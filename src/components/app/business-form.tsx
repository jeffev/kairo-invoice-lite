"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveWorkspaceAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, parseRate } from "@/lib/money";

export type BusinessValues = {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  currency: string;
  taxRateBps: number;
  taxLabel: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  paymentTermsDays: number;
  defaultNotes: string | null;
  paymentInstructions: string | null;
};

export function BusinessForm({ values, hasInvoices }: { values: BusinessValues; hasInvoices: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [currency, setCurrency] = React.useState(values.currency);

  return (
    <form
      className="grid gap-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const s = (k: string) => String(f.get(k) ?? "");
        setPending(true);
        const r = await saveWorkspaceAction({
          name: s("name"),
          email: s("email"),
          phone: s("phone"),
          website: s("website"),
          address: s("address"),
          taxId: s("taxId"),
          currency,
          taxRateBps: parseRate(s("taxRate")),
          taxLabel: s("taxLabel") || "Tax",
          invoicePrefix: s("invoicePrefix"),
          nextInvoiceNumber: Math.max(1, Number.parseInt(s("nextInvoiceNumber")) || 1),
          paymentTermsDays: Math.max(0, Number.parseInt(s("paymentTermsDays")) || 0),
          defaultNotes: s("defaultNotes"),
          paymentInstructions: s("paymentInstructions"),
        });
        setPending(false);
        if (!r.ok) return void toast.error(r.error);
        toast.success("Settings saved");
        router.refresh();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
          <CardDescription>Printed at the top of every invoice and used as the sender of emails.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="b-name">Business name</Label>
            <Input id="b-name" name="name" defaultValue={values.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-email">Email (reply-to)</Label>
            <Input id="b-email" name="email" type="email" defaultValue={values.email ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-phone">Phone</Label>
            <Input id="b-phone" name="phone" defaultValue={values.phone ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-website">Website</Label>
            <Input id="b-website" name="website" defaultValue={values.website ?? ""} placeholder="https://" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-tax">Tax ID / VAT number</Label>
            <Input id="b-tax" name="taxId" defaultValue={values.taxId ?? ""} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="b-address">Address</Label>
            <Textarea id="b-address" name="address" rows={3} defaultValue={values.address ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice defaults</CardTitle>
          <CardDescription>Applied to new invoices. You can change any of them per invoice.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={hasInvoices}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasInvoices && <p className="text-xs text-muted-foreground">Locked once invoices exist.</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-taxLabel">Tax label</Label>
            <Input id="b-taxLabel" name="taxLabel" defaultValue={values.taxLabel} placeholder="VAT, GST, Sales tax…" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-taxRate">Default tax rate (%)</Label>
            <Input id="b-taxRate" name="taxRate" inputMode="decimal" defaultValue={(values.taxRateBps / 100).toString()} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-prefix">Invoice prefix</Label>
            <Input id="b-prefix" name="invoicePrefix" defaultValue={values.invoicePrefix} placeholder="INV-" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-next">Next invoice number</Label>
            <Input id="b-next" name="nextInvoiceNumber" type="number" min={values.nextInvoiceNumber} defaultValue={values.nextInvoiceNumber} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="b-terms">Payment terms (days)</Label>
            <Input id="b-terms" name="paymentTermsDays" type="number" min={0} max={365} defaultValue={values.paymentTermsDays} />
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="b-notes">Default notes</Label>
            <Textarea id="b-notes" name="defaultNotes" rows={2} defaultValue={values.defaultNotes ?? ""} placeholder="Thank you for your business!" />
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="b-pay">Payment details (bank account, PIX, etc.)</Label>
            <Textarea id="b-pay" name="paymentInstructions" rows={3} defaultValue={values.paymentInstructions ?? ""} />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save settings
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
