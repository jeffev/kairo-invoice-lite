import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Plus } from "lucide-react";

import { ClientEditButton } from "@/components/clients/client-edit-button";
import { EmptyState } from "@/components/app/page-header";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getClient } from "@/lib/clients";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const c = await getClient(workspace.id, id);
  if (!c) notFound();
  const billed = c.invoices.filter((i) => i.status !== "void" && i.status !== "draft").reduce((s, i) => s + i.total, 0);
  const paid = c.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = c.invoices.filter((i) => ["sent", "viewed", "overdue"].includes(i.status)).reduce((s, i) => s + i.total, 0);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <div className="grid gap-4">
        <Link href="/clients" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Clients
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{c.company || c.name}</h1>
            <p className="text-sm text-muted-foreground">{[c.company && c.name, c.email, c.phone].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex gap-2">
            <ClientEditButton client={{ id: c.id, name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, taxId: c.taxId, notes: c.notes }} />
            <Button asChild>
              <Link href={`/invoices/new?client=${c.id}`}>
                <Plus /> New invoice
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Billed", value: billed },
          { label: "Paid", value: paid },
          { label: "Outstanding", value: outstanding },
        ].map((s) => (
          <Card key={s.label} className="gap-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{formatMoney(s.value, workspace.currency)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {c.invoices.length === 0 ? (
              <EmptyState icon={FileText} title="No invoices for this client yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${inv.id}`}>{inv.number}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(inv.total, inv.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {c.address && (
              <div className="grid gap-0.5">
                <span className="text-xs text-muted-foreground">Address</span>
                <span className="whitespace-pre-line">{c.address}</span>
              </div>
            )}
            {c.taxId && (
              <div className="grid gap-0.5">
                <span className="text-xs text-muted-foreground">Tax ID</span>
                <span>{c.taxId}</span>
              </div>
            )}
            {c.notes && (
              <div className="grid gap-0.5">
                <span className="text-xs text-muted-foreground">Notes</span>
                <span className="whitespace-pre-line">{c.notes}</span>
              </div>
            )}
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">Client since</span>
              <span>{formatDate(c.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
