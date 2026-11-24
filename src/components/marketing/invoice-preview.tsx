import { CheckCircle2 } from "lucide-react";

/** Static mock of an invoice and its payment confirmation, for the landing page hero. */
export function InvoicePreview() {
  const lines = [
    ["Web design — homepage and pricing", "$2,400.00"],
    ["Frontend development · 16.5 h", "$1,980.00"],
    ["Consulting call · 2", "$300.00"],
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold">Northwind Studio</p>
            <p className="text-xs text-muted-foreground">120 Market St, San Francisco</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Invoice</p>
            <p className="font-semibold">INV-0042</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Bill to</p>
            <p className="font-medium">Acme Corp</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Due</p>
            <p className="font-medium">Nov 20, 2026</p>
          </div>
        </div>
        <table className="mt-6 w-full text-xs">
          <tbody>
            {lines.map(([d, a]) => (
              <tr key={d} className="border-t">
                <td className="py-2">{d}</td>
                <td className="py-2 text-right tabular-nums">{a}</td>
              </tr>
            ))}
            <tr className="border-t">
              <td className="pt-3 font-semibold">Total</td>
              <td className="pt-3 text-right font-semibold tabular-nums">$4,680.00</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground">Pay $4,680.00</div>
      </div>
      <div className="absolute -right-3 -bottom-5 flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm shadow-lg sm:-right-8">
        <CheckCircle2 className="size-4 text-emerald-500" />
        <span>
          <span className="font-medium">Paid</span> · Oct 21, 9:14 AM
        </span>
      </div>
    </div>
  );
}
