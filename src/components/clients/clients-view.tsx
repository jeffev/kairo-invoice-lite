"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteClientAction } from "@/actions/clients";
import { ConfirmButton } from "@/components/app/confirm-button";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { ClientDialog, type ClientValues } from "@/components/clients/client-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

export type ClientRow = ClientValues & { id: string; invoices: number; billed: number; outstanding: number };

export function ClientsView({ clients, currency }: { clients: ClientRow[]; currency: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [editing, setEditing] = React.useState<ClientValues | null | undefined>(search.get("new") ? null : undefined);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <PageHeader title="Clients" description={`${clients.length} client${clients.length === 1 ? "" : "s"}`}>
        <Button onClick={() => setEditing(null)}>
          <Plus /> New client
        </Button>
      </PageHeader>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" text="Add the people and companies you invoice. Their details are printed on every invoice.">
          <Button size="sm" onClick={() => setEditing(null)}>
            Add client
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Billed</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/clients/${c.id}`} className="block font-medium">
                      {c.company || c.name}
                    </Link>
                    {c.company && <span className="block text-xs text-muted-foreground">{c.name}</span>}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{c.email || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.invoices}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatMoney(c.billed, currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.outstanding > 0 ? formatMoney(c.outstanding, currency) : "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Client actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/new?client=${c.id}`}>
                            <FileText /> New invoice
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(c)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <ConfirmButton
                          title={`Delete ${c.company || c.name}?`}
                          description="Clients with invoices can't be deleted."
                          confirmLabel="Delete"
                          destructive
                          onConfirm={async () => {
                            const result = await deleteClientAction(c.id);
                            if (!result.ok) return void toast.error(result.error);
                            toast.success("Client deleted");
                            router.refresh();
                          }}
                        >
                          <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </ConfirmButton>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} client={editing ?? null} />
    </div>
  );
}
