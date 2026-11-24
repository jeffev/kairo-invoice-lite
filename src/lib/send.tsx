import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { invoice, workspace } from "@/db/schema";
import { InvoiceEmail, renderEmail, type InvoiceEmailData } from "@/emails/templates";
import { startOfToday } from "@/lib/dates";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getInvoice, type InvoiceWithRelations } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { renderInvoicePdf } from "@/lib/pdf";
import type { Workspace } from "@/lib/workspace";

const publicUrl = (token: string) => `${env.NEXT_PUBLIC_APP_URL}/i/${token}`;

function emailData(inv: InvoiceWithRelations, ws: Workspace, message?: string | null): InvoiceEmailData {
  return {
    business: { name: ws.name, website: ws.website, email: ws.email },
    clientName: inv.client.name,
    number: inv.number,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    currency: inv.currency,
    lines: inv.lines.map((l) => ({ description: l.description, amount: l.amount })),
    discount: inv.discount,
    taxLabel: inv.taxLabel,
    taxAmount: inv.taxAmount,
    total: inv.total,
    amountDue: inv.total,
    viewUrl: publicUrl(inv.publicToken),
    message,
  };
}

async function loadWorkspace(workspaceId: string) {
  return (await db.query.workspace.findFirst({ where: eq(workspace.id, workspaceId) }))!;
}

/** Emails the invoice (PDF attached) to the client and marks it as sent. */
export async function sendInvoice(workspaceId: string, invoiceId: string, message?: string | null) {
  const inv = await getInvoice(workspaceId, invoiceId);
  if (!inv) throw new Error("Invoice not found");
  if (!inv.client.email) throw new Error("This client has no email address");
  if (inv.status === "paid" || inv.status === "void") throw new Error(`A ${inv.status} invoice can't be sent`);
  const ws = await loadWorkspace(workspaceId);
  const data = emailData(inv, ws, message);
  const [{ html, text }, pdf] = await Promise.all([renderEmail(<InvoiceEmail {...data} />), renderInvoicePdf(inv, ws)]);
  const result = await sendEmail({
    to: inv.client.email,
    replyTo: ws.email ?? undefined,
    subject: `Invoice ${inv.number} from ${ws.name} — ${formatMoney(data.amountDue, inv.currency)} due ${data.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    text,
    html,
    attachments: [{ filename: `${inv.number}.pdf`, content: pdf }],
  });
  if (!result.ok) throw new Error(result.error);
  const overdue = inv.dueDate < startOfToday();
  await db
    .update(invoice)
    .set({ status: overdue ? "overdue" : inv.status === "draft" ? "sent" : inv.status, sentAt: new Date() })
    .where(eq(invoice.id, inv.id));
  return result;
}
