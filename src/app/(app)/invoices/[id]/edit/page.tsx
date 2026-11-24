import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { listItems } from "@/lib/catalog";
import { listClients } from "@/lib/clients";
import { formatDateInput } from "@/lib/dates";
import { getInvoice, isEditable } from "@/lib/invoices";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const inv = await getInvoice(workspace.id, id);
  if (!inv) notFound();
  if (!isEditable(inv.status)) redirect(`/invoices/${id}`);
  const [clients, items] = await Promise.all([listClients(workspace.id), listItems(workspace.id)]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <PageHeader title={`Edit ${inv.number}`} description={inv.status === "draft" ? "Draft" : "Changes apply to the public link and the next PDF."} />
      <InvoiceForm
        id={inv.id}
        clients={clients.map((c) => ({ id: c.id, name: c.name, company: c.company }))}
        items={items}
        paymentTermsDays={workspace.paymentTermsDays}
        initial={{
          clientId: inv.clientId,
          issueDate: formatDateInput(inv.issueDate),
          dueDate: formatDateInput(inv.dueDate),
          currency: inv.currency,
          lines: inv.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
          discount: inv.discount,
          taxRateBps: inv.taxRateBps,
          taxLabel: inv.taxLabel,
          notes: inv.notes ?? "",
          paymentInstructions: inv.paymentInstructions ?? "",
        }}
      />
    </div>
  );
}
