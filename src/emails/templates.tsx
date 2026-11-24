import { render } from "react-email";

import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Button, EmailLayout, Highlight, P, Rows, Small, Title } from "./layout";

export type InvoiceEmailData = {
  business: { name: string; website?: string | null; email?: string | null };
  clientName: string;
  number: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  lines: { description: string; amount: number }[];
  discount: number;
  taxLabel: string;
  taxAmount: number;
  total: number;
  amountDue: number;
  viewUrl: string;
  message?: string | null;
};

function totalsRows(d: InvoiceEmailData): [string, string][] {
  const rows: [string, string][] = d.lines.map((l) => [l.description, formatMoney(l.amount, d.currency)]);
  if (d.discount > 0) rows.push(["Discount", `−${formatMoney(d.discount, d.currency)}`]);
  if (d.taxAmount > 0) rows.push([d.taxLabel, formatMoney(d.taxAmount, d.currency)]);
  return rows;
}

export function InvoiceEmail(d: InvoiceEmailData) {
  return (
    <EmailLayout
      preview={`Invoice ${d.number} for ${formatMoney(d.amountDue, d.currency)} is due ${formatDate(d.dueDate)}.`}
      business={d.business}
      footer={`You're receiving this invoice as the billing contact for ${d.clientName}.`}
    >
      <Title>Invoice {d.number} from {d.business.name}</Title>
      {d.message && <P>{d.message}</P>}
      <Highlight label="Amount due" value={formatMoney(d.amountDue, d.currency)} side={{ label: "Due date", value: formatDate(d.dueDate) }} />
      <P>
        Hi {d.clientName}, invoice <strong>{d.number}</strong> was issued on {formatDate(d.issueDate)}. The PDF is attached.
      </P>
      <Rows rows={totalsRows(d)} total={["Total", formatMoney(d.total, d.currency)]} />
      <Button href={d.viewUrl}>View invoice</Button>
      <Small>Questions about this invoice? Just reply to this email{d.business.email ? ` or write to ${d.business.email}` : ""}.</Small>
    </EmailLayout>
  );
}

/** Renders a template to HTML and plain text for Resend. */
export async function renderEmail(element: React.ReactElement) {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}
