import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { EmptyState, PageHeader } from "@/components/app/page-header";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { listInvoices } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Invoices" };

type Search = { status?: string; q?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { workspace } = await requireWorkspace();
  const { status, q } = await searchParams;
  const statusFilter = status === "open" ? "open" : (INVOICE_STATUSES as readonly string[]).includes(status ?? "") ? (status as InvoiceStatus) : undefined;
  const invoices = await listInvoices(workspace.id, { status: statusFilter, search: q });
  const outstanding = invoices.filter((i) => ["sent", "viewed", "overdue"].includes(i.status)).reduce((s, i) => s + i.total, 0);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <PageHeader title="Invoices" description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} · ${formatMoney(outstanding, workspace.currency)} outstanding in this view`}>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus /> New invoice
          </Link>
        </Button>
      </PageHeader>

      <InvoiceFilters status={status ?? "all"} q={q ?? ""} />

      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title={q || status ? "No invoices match" : "No invoices yet"} text={q || status ? "Try another filter or search term." : "Create your first invoice and send it with a payment link in minutes."}>
          {!q && !status && (
            <Button size="sm" asChild>
              <Link href="/invoices/new">Create invoice</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Issued</TableHead>
                <TableHead className="hidden sm:table-cell">Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/invoices/${inv.id}`} className="block">
                      {inv.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/invoices/${inv.id}`} className="block">
                      <span className="block truncate">{inv.client.company || inv.client.name}</span>
                      {inv.client.company && <span className="block truncate text-xs text-muted-foreground">{inv.client.name}</span>}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(inv.issueDate)}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(inv.dueDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(inv.total, inv.currency)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                    {inv.status === "paid" || inv.status === "void" ? "—" : formatMoney(inv.total, inv.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
