"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { saveInvoiceAction, type InvoiceFormInput } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDays, formatDateInput, parseDateInput } from "@/lib/dates";
import { computeTotals, formatMoney, parseMoney, parseQuantity, parseRate, toMoneyInput } from "@/lib/money";

export type ClientOption = { id: string; name: string; company: string | null };
export type ItemOption = { id: string; name: string; description: string | null; unitPrice: number };

type Line = { key: string; description: string; quantity: string; unitPrice: string };

export type InvoiceFormValues = {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lines: { description: string; quantity: number; unitPrice: number }[];
  discount: number;
  taxRateBps: number;
  taxLabel: string;
  notes: string;
  paymentInstructions: string;
};

let keyCounter = 0;
const newKey = () => `l${++keyCounter}`;

export function InvoiceForm({
  id,
  initial,
  clients,
  items,
  paymentTermsDays,
}: {
  id: string | null;
  initial: InvoiceFormValues;
  clients: ClientOption[];
  items: ItemOption[];
  paymentTermsDays: number;
}) {
  const router = useRouter();
  const currency = initial.currency;
  const [clientId, setClientId] = React.useState(initial.clientId);
  const [issueDate, setIssueDate] = React.useState(initial.issueDate);
  const [dueDate, setDueDate] = React.useState(initial.dueDate);
  const [lines, setLines] = React.useState<Line[]>(() =>
    (initial.lines.length ? initial.lines : [{ description: "", quantity: 100, unitPrice: 0 }]).map((l) => ({
      key: newKey(),
      description: l.description,
      quantity: (l.quantity / 100).toString(),
      unitPrice: l.unitPrice ? toMoneyInput(l.unitPrice, currency) : "",
    })),
  );
  // Remounts the catalog picker after each pick, so the same item can be added twice in a row.
  const [catalogKey, setCatalogKey] = React.useState(0);
  const [discount, setDiscount] = React.useState(toMoneyInput(initial.discount, currency));
  const [taxRate, setTaxRate] = React.useState((initial.taxRateBps / 100).toString());
  const [taxLabel, setTaxLabel] = React.useState(initial.taxLabel);
  const [notes, setNotes] = React.useState(initial.notes);
  const [paymentInstructions, setPaymentInstructions] = React.useState(initial.paymentInstructions);
  const [pending, setPending] = React.useState(false);

  const parsedLines = lines.map((l) => ({
    description: l.description.trim(),
    quantity: parseQuantity(l.quantity),
    unitPrice: parseMoney(l.unitPrice, currency),
  }));
  const totals = computeTotals(parsedLines, parseMoney(discount, currency), parseRate(taxRate));

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  const addLine = (item?: ItemOption) =>
    setLines((ls) => [
      ...ls,
      {
        key: newKey(),
        description: item ? [item.name, item.description].filter(Boolean).join(" — ") : "",
        quantity: "1",
        unitPrice: item ? toMoneyInput(item.unitPrice, currency) : "",
      },
    ]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: InvoiceFormInput = {
      clientId,
      issueDate,
      dueDate,
      currency,
      lines: parsedLines,
      discount: parseMoney(discount, currency),
      taxRateBps: parseRate(taxRate),
      taxLabel: taxLabel.trim() || "Tax",
      notes,
      paymentInstructions,
    };
    setPending(true);
    const result = await saveInvoiceAction(id, input);
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success(id ? "Invoice updated" : "Invoice created");
    router.push(`/invoices/${result.data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-3">
              <Label htmlFor="client">Client</Label>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have no clients yet.{" "}
                  <Link href="/clients?new=1" className="font-medium text-foreground underline">
                    Add your first client
                  </Link>
                  .
                </p>
              ) : (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client" className="w-full">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company ? `${c.company} · ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issueDate">Issue date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  setDueDate(formatDateInput(addDays(parseDateInput(e.target.value), paymentTermsDays)));
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Input value={currency} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line items</CardTitle>
            {items.length > 0 && (
              <Select
                key={catalogKey}
                onValueChange={(v) => {
                  addLine(items.find((i) => i.id === v));
                  setCatalogKey((k) => k + 1);
                }}
              >
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue placeholder="Add from catalog" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} · {formatMoney(i.unitPrice, currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="hidden grid-cols-[1fr_88px_120px_110px_36px] gap-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            {lines.map((line, i) => (
              <div key={line.key} className="grid grid-cols-[1fr_36px] gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_88px_120px_110px_36px] sm:border-0 sm:p-0">
                <div className="flex items-center gap-1 sm:col-span-1">
                  <GripVertical className="hidden size-4 shrink-0 text-muted-foreground/50 sm:block" />
                  <Input
                    aria-label={`Line ${i + 1} description`}
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    required
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" className="sm:order-last" aria-label="Remove line" onClick={() => removeLine(line.key)} disabled={lines.length === 1}>
                  <Trash2 />
                </Button>
                <Input
                  aria-label={`Line ${i + 1} quantity`}
                  inputMode="decimal"
                  className="text-right"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                />
                <Input
                  aria-label={`Line ${i + 1} unit price`}
                  inputMode="decimal"
                  className="text-right"
                  placeholder="0.00"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                />
                <div className="flex items-center justify-end text-sm tabular-nums sm:pr-1">{formatMoney(totals.lines[i]?.amount ?? 0, currency)}</div>
              </div>
            ))}
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => addLine()}>
                <Plus /> Add line
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes to the client</Label>
              <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business!" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentInstructions">Payment details</Label>
              <Textarea
                id="paymentInstructions"
                rows={4}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder={"Bank: …\nIBAN: …"}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="discount">Discount ({currency})</Label>
              <Input id="discount" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="taxLabel">Tax label</Label>
                <Input id="taxLabel" value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRate">Tax rate (%)</Label>
                <Input id="taxRate" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
            </div>
            <dl className="grid gap-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(totals.subtotal, currency)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="tabular-nums">−{formatMoney(totals.discount, currency)}</dd>
                </div>
              )}
              {parseRate(taxRate) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{taxLabel || "Tax"}</dt>
                  <dd className="tabular-nums">{formatMoney(totals.taxAmount, currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(totals.total, currency)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending || !clientId}>
            {pending && <Loader2 className="animate-spin" />}
            {id ? "Save changes" : "Save draft"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={id ? `/invoices/${id}` : "/invoices"}>Cancel</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
