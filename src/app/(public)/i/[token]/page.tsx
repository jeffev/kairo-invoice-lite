import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { Download } from "lucide-react";

import { db } from "@/db";
import { invoice, workspace } from "@/db/schema";
import { InvoiceSheet } from "@/components/invoices/invoice-sheet";
import { StatusBadge } from "@/components/invoices/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/dates";
import { getInvoiceByToken } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvoiceByToken(token);
  if (!inv || inv.status === "draft") notFound();
  const business = await db.query.workspace.findFirst({ where: eq(workspace.id, inv.workspaceId) });
  if (!business) notFound();

  // First open by the client: record it and move "sent" → "viewed".
  if (!inv.viewedAt) {
    await db
      .update(invoice)
      .set({ viewedAt: new Date(), ...(inv.status === "sent" ? { status: "viewed" as const } : {}) })
      .where(and(eq(invoice.id, inv.id), isNull(invoice.viewedAt)));
    inv.viewedAt = new Date();
    if (inv.status === "sent") inv.status = "viewed";
  }

  const payable = inv.status !== "void" && inv.status !== "paid";

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="text-sm font-medium">{business.name}</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
        <div className="flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Invoice {inv.number}</span>
              <StatusBadge status={inv.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {payable ? (
                <>
                  {formatMoney(inv.total, inv.currency)} due by <span className="font-medium text-foreground">{formatDate(inv.dueDate)}</span>
                </>
              ) : inv.status === "paid" ? (
                `Paid in full${inv.paidAt ? ` on ${formatDate(inv.paidAt)}` : ""}`
              ) : (
                "This invoice is no longer payable."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={`/api/i/${token}/pdf`} target="_blank" rel="noopener">
                <Download /> Download PDF
              </a>
            </Button>
          </div>
        </div>

        <InvoiceSheet invoice={inv} business={business} />

        <p className="text-center text-xs text-muted-foreground">
          {payable && inv.paymentInstructions ? "Pay using the payment details on the invoice. · " : ""}Powered by {siteConfig.name}
        </p>
      </main>
    </div>
  );
}
