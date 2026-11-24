"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseDateInput } from "@/lib/dates";
import {
  createInvoice,
  deleteInvoice,
  duplicateInvoice,
  getInvoice,
  markInvoicePaid,
  markInvoiceUnpaid,
  setInvoiceStatus,
  updateInvoice,
} from "@/lib/invoices";
import { sendInvoice } from "@/lib/send";
import { requireWorkspace } from "@/lib/session";
import { optionalText, run } from "./shared";

const lineSchema = z.object({
  description: z.string().trim().min(1, "Every line needs a description").max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().min(0),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Choose a client"),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.string().length(3),
  lines: z.array(lineSchema).min(1, "Add at least one line"),
  discount: z.number().int().min(0),
  taxRateBps: z.number().int().min(0).max(10_000),
  taxLabel: z.string().trim().min(1).max(40),
  notes: optionalText,
  paymentInstructions: optionalText,
});

export type InvoiceFormInput = z.input<typeof invoiceSchema>;

function toInput(data: z.output<typeof invoiceSchema>) {
  const issueDate = parseDateInput(data.issueDate);
  const dueDate = parseDateInput(data.dueDate);
  if (dueDate < issueDate) throw new Error("The due date can't be before the issue date");
  return { ...data, issueDate, dueDate };
}

function revalidateInvoices(id?: string) {
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  if (id) revalidatePath(`/invoices/${id}`);
}

export async function saveInvoiceAction(id: string | null, input: InvoiceFormInput) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const data = toInput(invoiceSchema.parse(input));
    const invoiceId = id ? (await updateInvoice(workspace.id, id, data), id) : await createInvoice(workspace.id, data);
    revalidateInvoices(invoiceId);
    return { id: invoiceId };
  });
}

export async function sendInvoiceAction(id: string, message?: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const result = await sendInvoice(workspace.id, id, message?.trim() || null);
    revalidateInvoices(id);
    return { demo: result.demo };
  });
}

/** "Mark as sent" without emailing (e.g. the invoice was delivered another way). */
export async function markSentAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const inv = await getInvoice(workspace.id, id);
    if (!inv || inv.status !== "draft") throw new Error("Only drafts can be marked as sent");
    await setInvoiceStatus(workspace.id, id, "sent", { sentAt: new Date() });
    revalidateInvoices(id);
  });
}

/** The client paid outside the app (bank transfer, cash…): mark the invoice as paid in full. */
export async function markPaidAction(id: string, paidAt: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const inv = await getInvoice(workspace.id, id);
    if (!inv) throw new Error("Invoice not found");
    if (!["sent", "viewed", "overdue"].includes(inv.status)) throw new Error("Only sent invoices can be marked as paid");
    await markInvoicePaid(workspace.id, id, parseDateInput(paidAt));
    revalidateInvoices(id);
  });
}

export async function markUnpaidAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    await markInvoiceUnpaid(workspace.id, id);
    revalidateInvoices(id);
  });
}

export async function voidInvoiceAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const inv = await getInvoice(workspace.id, id);
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === "paid") throw new Error("Paid invoices can't be voided. Mark it as unpaid first.");
    await setInvoiceStatus(workspace.id, id, "void");
    revalidateInvoices(id);
  });
}

export async function deleteInvoiceAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const inv = await getInvoice(workspace.id, id);
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === "paid") throw new Error("Paid invoices can't be deleted. Void or keep them for your records.");
    await deleteInvoice(workspace.id, id);
    revalidateInvoices();
  });
}

export async function duplicateInvoiceAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const newId = await duplicateInvoice(workspace.id, id, workspace.paymentTermsDays);
    revalidateInvoices(newId);
    return { id: newId };
  });
}
