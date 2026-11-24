"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveClientAction, type ClientFormInput } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ClientValues = Omit<ClientFormInput, "email"> & { id?: string; email?: string | null };

const empty: ClientValues = { name: "", company: "", email: "", phone: "", address: "", taxId: "", notes: "" };

export function ClientDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientValues | null;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const v = client ?? empty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          ref={formRef}
          key={client?.id ?? "new"}
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const input: ClientFormInput = {
              name: String(f.get("name")),
              company: String(f.get("company")),
              email: String(f.get("email")),
              phone: String(f.get("phone")),
              address: String(f.get("address")),
              taxId: String(f.get("taxId")),
              notes: String(f.get("notes")),
            };
            setPending(true);
            const result = await saveClientAction(client?.id ?? null, input);
            setPending(false);
            if (!result.ok) return void toast.error(result.error);
            toast.success(client?.id ? "Client updated" : "Client added");
            onOpenChange(false);
            onSaved?.(result.data.id);
            router.refresh();
          }}
        >
          <DialogHeader>
            <DialogTitle>{client?.id ? "Edit client" : "New client"}</DialogTitle>
            <DialogDescription>Contact details appear on invoices and are used to send them.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="c-name">Contact name</Label>
              <Input id="c-name" name="name" defaultValue={v.name} required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-company">Company</Label>
              <Input id="c-company" name="company" defaultValue={v.company ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" name="email" type="email" defaultValue={v.email ?? ""} placeholder="billing@company.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" name="phone" defaultValue={v.phone ?? ""} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="c-address">Billing address</Label>
              <Textarea id="c-address" name="address" rows={2} defaultValue={v.address ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-tax">Tax ID / VAT</Label>
              <Input id="c-tax" name="taxId" defaultValue={v.taxId ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-notes">Internal notes</Label>
              <Input id="c-notes" name="notes" defaultValue={v.notes ?? ""} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {client?.id ? "Save" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
