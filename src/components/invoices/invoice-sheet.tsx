import { formatDate } from "@/lib/dates";
import type { InvoiceWithRelations } from "@/lib/invoices";
import { formatMoney, formatQuantity, formatRate } from "@/lib/money";
import { cn } from "@/lib/utils";

type Business = { name: string; email: string | null; phone: string | null; website: string | null; address: string | null; taxId: string | null };

function Lines({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <>
      {text.split("\n").map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </>
  );
}

/** The invoice as a document, used on the detail page and the public page. */
export function InvoiceSheet({ invoice: inv, business, className }: { invoice: InvoiceWithRelations; business: Business; className?: string }) {
  const { client, currency } = inv;
  return (
    <article className={cn("rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10", className)}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1 text-sm">
          <h2 className="text-2xl font-semibold tracking-tight">{business.name}</h2>
          <p className="text-muted-foreground">
            <Lines text={business.address} />
          </p>
          <p className="text-muted-foreground">{[business.email, business.phone, business.website].filter(Boolean).join(" · ")}</p>
          {business.taxId && <p className="text-muted-foreground">Tax ID {business.taxId}</p>}
        </div>
        <div className="grid gap-1 text-sm sm:text-right">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Invoice</span>
          <span className="text-xl font-semibold">{inv.number}</span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 text-sm sm:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-0.5">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Bill to</span>
          <span className="font-medium">{client.company || client.name}</span>
          {client.company && <span>{client.name}</span>}
          <span className="text-muted-foreground">
            <Lines text={client.address} />
          </span>
          {client.email && <span className="text-muted-foreground">{client.email}</span>}
          {client.taxId && <span className="text-muted-foreground">Tax ID {client.taxId}</span>}
        </div>
        <dl className="grid content-start gap-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Issue date</dt>
            <dd>{formatDate(inv.issueDate)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="font-medium">{formatDate(inv.dueDate)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Currency</dt>
            <dd>{currency}</dd>
          </div>
        </dl>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-foreground text-left">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="hidden py-2 text-right font-medium sm:table-cell">Unit price</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="py-2.5 pr-3">{l.description}</td>
              <td className="py-2.5 text-right tabular-nums">{formatQuantity(l.quantity)}</td>
              <td className="hidden py-2.5 text-right tabular-nums sm:table-cell">{formatMoney(l.unitPrice, currency)}</td>
              <td className="py-2.5 text-right tabular-nums">{formatMoney(l.amount, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto grid w-full max-w-xs gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatMoney(inv.subtotal, currency)}</dd>
        </div>
        {inv.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="tabular-nums">−{formatMoney(inv.discount, currency)}</dd>
          </div>
        )}
        {inv.taxRateBps > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {inv.taxLabel} ({formatRate(inv.taxRateBps)})
            </dt>
            <dd className="tabular-nums">{formatMoney(inv.taxAmount, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(inv.total, currency)}</dd>
        </div>
      </dl>

      {(inv.paymentInstructions || inv.notes) && (
        <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          {inv.paymentInstructions && (
            <div className="grid gap-1">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Payment details</span>
              <p>
                <Lines text={inv.paymentInstructions} />
              </p>
            </div>
          )}
          {inv.notes && (
            <div className="grid gap-1">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Notes</span>
              <p className="text-muted-foreground">
                <Lines text={inv.notes} />
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
