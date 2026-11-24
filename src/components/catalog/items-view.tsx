"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteItemAction, saveItemAction } from "@/actions/catalog";
import { ConfirmButton } from "@/components/app/confirm-button";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, parseMoney, toMoneyInput } from "@/lib/money";

export type ItemRow = { id: string; name: string; description: string | null; unitPrice: number };

export function ItemsView({ items, currency }: { items: ItemRow[]; currency: string }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<ItemRow | null | undefined>(undefined);
  const [pending, setPending] = React.useState(false);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 p-4 md:p-6">
      <PageHeader title="Items" description="Products and services you invoice often, with a default price.">
        <Button onClick={() => setEditing(null)}>
          <Plus /> New item
        </Button>
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState icon={Package} title="No items yet" text="Save your services and products once, then add them to invoices with one click.">
          <Button size="sm" onClick={() => setEditing(null)}>
            Add item
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <span className="block font-medium">{i.name}</span>
                    {i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(i.unitPrice, currency)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit item" onClick={() => setEditing(i)}>
                        <Pencil />
                      </Button>
                      <ConfirmButton
                        title={`Delete ${i.name}?`}
                        description="Existing invoices keep their lines."
                        confirmLabel="Delete"
                        destructive
                        onConfirm={async () => {
                          const r = await deleteItemAction(i.id);
                          if (!r.ok) return void toast.error(r.error);
                          toast.success("Item deleted");
                          router.refresh();
                        }}
                      >
                        <Button variant="ghost" size="icon" aria-label="Delete item">
                          <Trash2 />
                        </Button>
                      </ConfirmButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)}>
        <DialogContent>
          <form
            key={editing?.id ?? "new"}
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setPending(true);
              const r = await saveItemAction(editing?.id ?? null, {
                name: String(f.get("name")),
                description: String(f.get("description")),
                unitPrice: parseMoney(String(f.get("unitPrice")), currency),
              });
              setPending(false);
              if (!r.ok) return void toast.error(r.error);
              toast.success(editing?.id ? "Item updated" : "Item added");
              setEditing(undefined);
              router.refresh();
            }}
          >
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit item" : "New item"}</DialogTitle>
              <DialogDescription>The description is copied into the invoice line.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="i-name">Name</Label>
              <Input id="i-name" name="name" defaultValue={editing?.name ?? ""} required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="i-desc">Description</Label>
              <Input id="i-desc" name="description" defaultValue={editing?.description ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="i-price">Unit price ({currency})</Label>
              <Input id="i-price" name="unitPrice" inputMode="decimal" defaultValue={editing ? toMoneyInput(editing.unitPrice, currency) : ""} placeholder="0.00" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(undefined)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
