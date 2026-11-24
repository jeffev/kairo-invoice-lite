/** Currencies offered in Settings. Amounts are always stored in the smallest unit (cents). */
export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "JPY", name: "Japanese Yen" },
] as const;

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP"]);

export function currencyDecimals(currency: string) {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/** 1999 → "$19.99" */
export function formatMoney(cents: number, currency = "USD", locale = "en-US") {
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(cents / 10 ** decimals);
}

/** "19.99" → 1999 (accepts commas and currency symbols; invalid input → 0) */
export function parseMoney(input: string | number, currency = "USD") {
  if (typeof input === "number") return Math.round(input * 10 ** currencyDecimals(currency));
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10 ** currencyDecimals(currency));
}

/** 1999 → "19.99" for form inputs */
export function toMoneyInput(cents: number, currency = "USD") {
  return (cents / 10 ** currencyDecimals(currency)).toFixed(currencyDecimals(currency));
}

/** Quantities are stored with two decimals as integers: 150 → 1.5 */
export const QTY_SCALE = 100;
export function formatQuantity(q: number) {
  return (q / QTY_SCALE).toLocaleString("en-US", { maximumFractionDigits: 2 });
}
export function parseQuantity(input: string | number) {
  const value = typeof input === "number" ? input : Number.parseFloat(String(input).replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return QTY_SCALE;
  return Math.round(value * QTY_SCALE);
}

/** 850 → "8.5%" */
export function formatRate(bps: number) {
  return `${(bps / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}
export function parseRate(input: string | number) {
  const value = typeof input === "number" ? input : Number.parseFloat(String(input).replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export type LineInput = { description: string; quantity: number; unitPrice: number };

/** Computes line amounts and invoice totals the same way everywhere (form, server, PDF). */
export function computeTotals(lines: LineInput[], discount: number, taxRateBps: number) {
  const computed = lines.map((l) => ({ ...l, amount: Math.round((l.quantity * l.unitPrice) / QTY_SCALE) }));
  const subtotal = computed.reduce((sum, l) => sum + l.amount, 0);
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const taxable = subtotal - safeDiscount;
  const taxAmount = Math.round((taxable * taxRateBps) / 10_000);
  const total = taxable + taxAmount;
  return { lines: computed, subtotal, discount: safeDiscount, taxAmount, total };
}
