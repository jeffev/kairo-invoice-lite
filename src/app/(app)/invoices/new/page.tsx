import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { listItems } from "@/lib/catalog";
import { listClients } from "@/lib/clients";
import { addDays, formatDateInput, startOfToday } from "@/lib/dates";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { workspace } = await requireWorkspace();
  const { client } = await searchParams;
  const [clients, items] = await Promise.all([listClients(workspace.id), listItems(workspace.id)]);
  const today = startOfToday();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <PageHeader title="New invoice" description={`Next number: ${workspace.invoicePrefix}${String(workspace.nextInvoiceNumber).padStart(4, "0")}`} />
      <InvoiceForm
        id={null}
        clients={clients.map((c) => ({ id: c.id, name: c.name, company: c.company }))}
        items={items}
        paymentTermsDays={workspace.paymentTermsDays}
        initial={{
          clientId: client && clients.some((c) => c.id === client) ? client : (clients[0]?.id ?? ""),
          issueDate: formatDateInput(today),
          dueDate: formatDateInput(addDays(today, workspace.paymentTermsDays)),
          currency: workspace.currency,
          lines: [],
          discount: 0,
          taxRateBps: workspace.taxRateBps,
          taxLabel: workspace.taxLabel,
          notes: workspace.defaultNotes ?? "",
          paymentInstructions: workspace.paymentInstructions ?? "",
        }}
      />
    </div>
  );
}
