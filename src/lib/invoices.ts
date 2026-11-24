import "server-only";

import { randomBytes } from "node:crypto";

import { and, asc, desc, eq, gte, inArray, like, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { client, invoice, invoiceLine, type InvoiceStatus } from "@/db/schema";
import { startOfToday } from "@/lib/dates";
import { computeTotals, type LineInput } from "@/lib/money";
import { reserveInvoiceNumber } from "@/lib/workspace";

export type Invoice = typeof invoice.$inferSelect;
export type InvoiceLine = typeof invoiceLine.$inferSelect;
export type Client = typeof client.$inferSelect;

export type InvoiceWithRelations = Invoice & { client: Client; lines: InvoiceLine[] };

export type InvoiceInput = {
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  lines: LineInput[];
  discount: number;
  taxRateBps: number;
  taxLabel: string;
  notes?: string | null;
  paymentInstructions?: string | null;
};

/** Statuses that count as "open" money: sent but not fully paid. */
export const OPEN_STATUSES: InvoiceStatus[] = ["sent", "viewed", "overdue"];

export async function listInvoices(
  workspaceId: string,
  opts: { status?: InvoiceStatus | "open"; clientId?: string; search?: string; limit?: number } = {},
) {
  const where = [eq(invoice.workspaceId, workspaceId)];
  if (opts.status === "open") where.push(inArray(invoice.status, OPEN_STATUSES));
  else if (opts.status) where.push(eq(invoice.status, opts.status));
  if (opts.clientId) where.push(eq(invoice.clientId, opts.clientId));
  if (opts.search) {
    const term = `%${opts.search.trim()}%`;
    const matching = db.select({ id: client.id }).from(client).where(and(eq(client.workspaceId, workspaceId), or(like(client.name, term), like(client.company, term))));
    where.push(or(like(invoice.number, term), inArray(invoice.clientId, matching))!);
  }
  return db.query.invoice.findMany({
    where: and(...where),
    with: { client: true },
    orderBy: [desc(invoice.issueDate), desc(invoice.createdAt)],
    limit: opts.limit ?? 200,
  });
}

export async function getInvoice(workspaceId: string, id: string): Promise<InvoiceWithRelations | undefined> {
  return db.query.invoice.findFirst({
    where: and(eq(invoice.id, id), eq(invoice.workspaceId, workspaceId)),
    with: { client: true, lines: { orderBy: asc(invoiceLine.position) } },
  });
}

export async function getInvoiceByToken(token: string): Promise<InvoiceWithRelations | undefined> {
  return db.query.invoice.findFirst({
    where: eq(invoice.publicToken, token),
    with: { client: true, lines: { orderBy: asc(invoiceLine.position) } },
  });
}

export async function createInvoice(workspaceId: string, input: InvoiceInput) {
  const totals = computeTotals(input.lines, input.discount, input.taxRateBps);
  const id = crypto.randomUUID();
  const number = await reserveInvoiceNumber(workspaceId);
  await db.transaction(async (tx) => {
    await tx.insert(invoice).values({
      id,
      workspaceId,
      clientId: input.clientId,
      number,
      currency: input.currency,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRateBps: input.taxRateBps,
      taxLabel: input.taxLabel,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: input.notes ?? null,
      paymentInstructions: input.paymentInstructions ?? null,
      publicToken: randomBytes(18).toString("base64url"),
    });
    if (totals.lines.length) {
      await tx.insert(invoiceLine).values(
        totals.lines.map((l, i) => ({ id: crypto.randomUUID(), invoiceId: id, position: i, ...l })),
      );
    }
  });
  return id;
}

/** Drafts and sent (unpaid) invoices can be edited; paid and void ones are frozen. */
export function isEditable(status: InvoiceStatus) {
  return status === "draft" || OPEN_STATUSES.includes(status);
}

export async function updateInvoice(workspaceId: string, id: string, input: InvoiceInput) {
  const existing = await getInvoice(workspaceId, id);
  if (!existing) throw new Error("Invoice not found");
  if (!isEditable(existing.status)) throw new Error("Paid and void invoices can't be edited");
  const totals = computeTotals(input.lines, input.discount, input.taxRateBps);
  await db.transaction(async (tx) => {
    await tx
      .update(invoice)
      .set({
        clientId: input.clientId,
        currency: input.currency,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxRateBps: input.taxRateBps,
        taxLabel: input.taxLabel,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes: input.notes ?? null,
        paymentInstructions: input.paymentInstructions ?? null,
        // An edited overdue invoice with a new due date goes back to "sent".
        status: existing.status === "overdue" && input.dueDate >= startOfToday() ? "sent" : existing.status,
      })
      .where(eq(invoice.id, id));
    await tx.delete(invoiceLine).where(eq(invoiceLine.invoiceId, id));
    if (totals.lines.length) {
      await tx.insert(invoiceLine).values(
        totals.lines.map((l, i) => ({ id: crypto.randomUUID(), invoiceId: id, position: i, ...l })),
      );
    }
  });
}

export async function setInvoiceStatus(workspaceId: string, id: string, status: InvoiceStatus, extra: Partial<Invoice> = {}) {
  await db
    .update(invoice)
    .set({ status, ...extra })
    .where(and(eq(invoice.id, id), eq(invoice.workspaceId, workspaceId)));
}

export async function deleteInvoice(workspaceId: string, id: string) {
  await db.delete(invoice).where(and(eq(invoice.id, id), eq(invoice.workspaceId, workspaceId)));
}

/** Marks an open invoice as paid in full (payment received outside the app). */
export async function markInvoicePaid(workspaceId: string, id: string, paidAt: Date) {
  await db
    .update(invoice)
    .set({ status: "paid", paidAt })
    .where(and(eq(invoice.id, id), eq(invoice.workspaceId, workspaceId), inArray(invoice.status, OPEN_STATUSES)));
}

/** Undoes "Mark as paid": back to sent, or overdue when past the due date. */
export async function markInvoiceUnpaid(workspaceId: string, id: string) {
  const inv = await db.query.invoice.findFirst({ where: and(eq(invoice.id, id), eq(invoice.workspaceId, workspaceId)) });
  if (!inv || inv.status !== "paid") return;
  await db
    .update(invoice)
    .set({ status: inv.dueDate < startOfToday() ? "overdue" : "sent", paidAt: null })
    .where(eq(invoice.id, id));
}

/** Marks every sent/viewed invoice past its due date as overdue. Returns how many changed. */
export async function markOverdueInvoices(workspaceId?: string) {
  const where = [inArray(invoice.status, ["sent", "viewed"]), lt(invoice.dueDate, startOfToday())];
  if (workspaceId) where.push(eq(invoice.workspaceId, workspaceId));
  const rows = await db.update(invoice).set({ status: "overdue" }).where(and(...where)).returning({ id: invoice.id });
  return rows.length;
}

/** Copies an invoice into a new draft with today's dates and a new number. */
export async function duplicateInvoice(workspaceId: string, id: string, paymentTermsDays: number) {
  const source = await getInvoice(workspaceId, id);
  if (!source) throw new Error("Invoice not found");
  const issueDate = startOfToday();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  return createInvoice(workspaceId, {
    clientId: source.clientId,
    issueDate,
    dueDate,
    currency: source.currency,
    lines: source.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
    discount: source.discount,
    taxRateBps: source.taxRateBps,
    taxLabel: source.taxLabel,
    notes: source.notes,
    paymentInstructions: source.paymentInstructions,
  });
}

export async function countInvoicesForClient(workspaceId: string, clientId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(invoice)
    .where(and(eq(invoice.workspaceId, workspaceId), eq(invoice.clientId, clientId)));
  return row?.n ?? 0;
}

/** Numbers for the dashboard cards. */
export async function getInvoiceStats(workspaceId: string) {
  const monthStart = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
  const today = startOfToday();
  const [open] = await db
    .select({ amount: sql<number>`coalesce(sum(${invoice.total}), 0)`, count: sql<number>`count(*)` })
    .from(invoice)
    .where(and(eq(invoice.workspaceId, workspaceId), inArray(invoice.status, OPEN_STATUSES)));
  const [overdue] = await db
    .select({ amount: sql<number>`coalesce(sum(${invoice.total}), 0)`, count: sql<number>`count(*)` })
    .from(invoice)
    .where(and(eq(invoice.workspaceId, workspaceId), inArray(invoice.status, OPEN_STATUSES), lt(invoice.dueDate, today)));
  const [paid] = await db
    .select({ amount: sql<number>`coalesce(sum(${invoice.total}), 0)`, count: sql<number>`count(*)` })
    .from(invoice)
    .where(and(eq(invoice.workspaceId, workspaceId), eq(invoice.status, "paid"), gte(invoice.paidAt, monthStart)));
  const [drafts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoice)
    .where(and(eq(invoice.workspaceId, workspaceId), eq(invoice.status, "draft")));
  return {
    outstanding: Number(open?.amount ?? 0),
    openCount: Number(open?.count ?? 0),
    overdueAmount: Number(overdue?.amount ?? 0),
    overdueCount: Number(overdue?.count ?? 0),
    paidThisMonth: Number(paid?.amount ?? 0),
    paidCount: Number(paid?.count ?? 0),
    draftCount: Number(drafts?.count ?? 0),
  };
}
