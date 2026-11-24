import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Eye, Mail, Wallet } from "lucide-react";

import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceSheet } from "@/components/invoices/invoice-sheet";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysBetween, formatDate, startOfToday } from "@/lib/dates";
import { env, features } from "@/lib/env";
import { getInvoice } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { requireWorkspace } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const inv = await getInvoice(workspace.id, id);
  return { title: inv ? `Invoice ${inv.number}` : "Invoice" };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const inv = await getInvoice(workspace.id, id);
  if (!inv) notFound();
  const publicUrl = `${env.NEXT_PUBLIC_APP_URL}/i/${inv.publicToken}`;
  const daysLate = daysBetween(inv.dueDate, startOfToday());

  const timeline = [
    { icon: Clock, label: "Created", date: inv.createdAt },
    inv.sentAt && { icon: Mail, label: "Sent", date: inv.sentAt },
    inv.viewedAt && { icon: Eye, label: "Viewed by client", date: inv.viewedAt },
    inv.paidAt && { icon: Wallet, label: "Paid", date: inv.paidAt },
  ].filter((e): e is { icon: typeof Clock; label: string; date: Date } => Boolean(e));

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <div className="grid gap-4">
        <Link href="/invoices" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Invoices
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{inv.number}</h1>
              <StatusBadge status={inv.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {inv.client.company || inv.client.name} · {formatMoney(inv.total, inv.currency)}
              {inv.status === "overdue" && daysLate > 0 && <span className="text-red-600 dark:text-red-400"> · {daysLate} days overdue</span>}
              {inv.status === "paid" && inv.paidAt && ` · paid ${formatDate(inv.paidAt)}`}
            </p>
          </div>
          <InvoiceActions
            invoice={{ id: inv.id, number: inv.number, status: inv.status, currency: inv.currency, total: inv.total }}
            publicUrl={publicUrl}
            clientEmail={inv.client.email}
            emailDemo={!features.email}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <InvoiceSheet invoice={inv} business={workspace} />

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="tabular-nums">{formatMoney(inv.total, inv.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Due</span>
                <span className="tabular-nums">{formatMoney(inv.status === "void" || inv.status === "paid" ? 0 : inv.total, inv.currency)}</span>
              </div>
              {inv.status !== "draft" && (
                <Button variant="outline" size="sm" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener">
                    Open client view
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm">
                {timeline.map((e) => (
                  <li key={e.label + e.date.getTime()} className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <e.icon className="size-3.5" />
                    </span>
                    <span className="flex-1">{e.label}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
