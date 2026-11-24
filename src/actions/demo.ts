"use server";

import { revalidatePath } from "next/cache";

import { createItem } from "@/lib/catalog";
import { createClient } from "@/lib/clients";
import { addDays, addMonths, startOfToday } from "@/lib/dates";
import { createInvoice, getInvoice, markInvoicePaid, setInvoiceStatus } from "@/lib/invoices";
import { requireWorkspace } from "@/lib/session";
import { run } from "./shared";

/**
 * Fills an empty workspace with realistic sample data so the app can be explored right away.
 * Only available while the workspace has no clients.
 */
export async function loadSampleDataAction() {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const today = startOfToday();
    const cur = workspace.currency;
    const tax = workspace.taxRateBps;

    const clients = await Promise.all(
      [
        { name: "Maya Lin", company: "Northwind Studio", email: "maya@northwind.example", address: "120 Market St\nSan Francisco, CA 94105" },
        { name: "Diego Alvarez", company: "Lumen Labs", email: "diego@lumen.example", address: "45 Rue de Rivoli\n75001 Paris" },
        { name: "Priya Shah", company: "Acme Corp", email: "priya@acme.example", address: "1 Infinite Loop\nCupertino, CA 95014" },
        { name: "Tom Becker", company: "Globex", email: "tom@globex.example", address: "Friedrichstraße 100\n10117 Berlin" },
      ].map((c) => createClient(workspace.id, c)),
    );

    await Promise.all(
      [
        { name: "Web design", description: "Design of landing pages and marketing sites", unitPrice: 9_500 },
        { name: "Frontend development", description: "Hourly, React / Next.js", unitPrice: 12_000 },
        { name: "Monthly maintenance", description: "Updates, monitoring and small fixes", unitPrice: 49_000 },
        { name: "Consulting call", description: "60 minutes", unitPrice: 15_000 },
      ].map((i) => createItem(workspace.id, i)),
    );

    const mk = (clientId: string, issue: Date, days: number, lines: { description: string; quantity: number; unitPrice: number }[]) =>
      createInvoice(workspace.id, {
        clientId,
        issueDate: issue,
        dueDate: addDays(issue, days),
        currency: cur,
        lines,
        discount: 0,
        taxRateBps: tax,
        taxLabel: workspace.taxLabel,
        notes: workspace.defaultNotes,
        paymentInstructions: workspace.paymentInstructions,
      });

    const payInFull = async (id: string, paidAt: Date) => {
      const inv = (await getInvoice(workspace.id, id))!;
      await setInvoiceStatus(workspace.id, id, "sent", { sentAt: inv.issueDate });
      await markInvoicePaid(workspace.id, id, paidAt);
    };

    // Paid invoices spread over the last five months.
    for (let m = 5; m >= 1; m--) {
      const issue = addMonths(today, -m);
      const id = await mk(clients[m % clients.length], issue, 30, [
        { description: "Frontend development", quantity: 2_000 + m * 400, unitPrice: 12_000 },
        { description: "Monthly maintenance", quantity: 100, unitPrice: 49_000 },
      ]);
      await payInFull(id, addDays(issue, 12));
    }

    // This month: one paid, one sent, one overdue, one viewed, one draft.
    const paid = await mk(clients[0], addDays(today, -10), 30, [
      { description: "Web design — homepage and pricing page", quantity: 100, unitPrice: 240_000 },
    ]);
    await payInFull(paid, addDays(today, -3));

    const sent = await mk(clients[1], addDays(today, -4), 30, [
      { description: "Frontend development", quantity: 1_650, unitPrice: 12_000 },
      { description: "Consulting call", quantity: 200, unitPrice: 15_000 },
    ]);
    await setInvoiceStatus(workspace.id, sent, "sent", { sentAt: addDays(today, -4) });

    const overdue = await mk(clients[2], addDays(today, -45), 30, [{ description: "Monthly maintenance — August", quantity: 100, unitPrice: 49_000 }]);
    await setInvoiceStatus(workspace.id, overdue, "overdue", { sentAt: addDays(today, -45) });

    const viewed = await mk(clients[3], addDays(today, -2), 14, [{ description: "Design sprint — 5 days", quantity: 500, unitPrice: 95_000 }]);
    await setInvoiceStatus(workspace.id, viewed, "viewed", { sentAt: addDays(today, -2), viewedAt: addDays(today, -1) });

    await mk(clients[0], today, 30, [{ description: "Frontend development", quantity: 800, unitPrice: 12_000 }]);

    revalidatePath("/", "layout");
  });
}
