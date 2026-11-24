import "server-only";

import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer, type ViewProps } from "@react-pdf/renderer";

// Never hyphenate: business names and descriptions must not be split with a dash.
Font.registerHyphenationCallback((word) => [word]);

import { formatDate } from "@/lib/dates";
import type { InvoiceWithRelations } from "@/lib/invoices";
import { formatMoney, formatQuantity, formatRate } from "@/lib/money";
import type { Workspace } from "@/lib/workspace";

const ink = "#111111";
const muted = "#6b7280";
const line = "#e5e7eb";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: ink, lineHeight: 1.4 },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  h1: { fontSize: 22, lineHeight: 1.15, fontFamily: "Helvetica-Bold", letterSpacing: -0.5, marginBottom: 4 },
  label: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: muted },
  badge: { fontSize: 8, fontFamily: "Helvetica-Bold", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  table: { marginTop: 28, borderTopWidth: 1, borderTopColor: ink },
  th: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: ink },
  td: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: line },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 56, textAlign: "right" },
  cPrice: { width: 80, textAlign: "right" },
  cAmount: { width: 88, textAlign: "right" },
  totals: { marginTop: 10, alignSelf: "flex-end", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  grand: { borderTopWidth: 1, borderTopColor: ink, marginTop: 4, paddingTop: 8, fontSize: 13, fontFamily: "Helvetica-Bold" },
  section: { marginTop: 28 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 32, fontSize: 8, color: muted, textAlign: "center" },
});

const statusColors: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "#dcfce7", fg: "#166534" },
  overdue: { bg: "#fee2e2", fg: "#991b1b" },
  void: { bg: "#e5e7eb", fg: "#374151" },
  draft: { bg: "#e5e7eb", fg: "#374151" },
  sent: { bg: "#dbeafe", fg: "#1e40af" },
  viewed: { bg: "#dbeafe", fg: "#1e40af" },
};

function Multiline({ text, style }: { text?: string | null; style?: ViewProps["style"] }) {
  if (!text) return null;
  return (
    <View style={style}>
      {text.split("\n").map((l, i) => (
        <Text key={i}>{l}</Text>
      ))}
    </View>
  );
}

export function InvoiceDocument({ invoice: inv, business }: { invoice: InvoiceWithRelations; business: Workspace }) {
  const { client, currency } = inv;
  const status = statusColors[inv.status] ?? statusColors.draft;

  return (
    <Document title={`Invoice ${inv.number}`} author={business.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.between}>
          <View style={{ maxWidth: 300 }}>
            <Text style={[styles.h1]}>{business.name}</Text>
            <Multiline text={business.address} style={{ marginTop: 6, color: muted }} />
            <Text style={styles.muted}>{[business.email, business.phone, business.website].filter(Boolean).join("  ·  ")}</Text>
            {business.taxId && <Text style={styles.muted}>Tax ID {business.taxId}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 20, lineHeight: 1.2, fontFamily: "Helvetica-Bold" }}>INVOICE</Text>
            <Text style={{ fontSize: 12, lineHeight: 1.3 }}>{inv.number}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.badge, { backgroundColor: status.bg, color: status.fg }]}>{inv.status}</Text>
            </View>
          </View>
        </View>

        {/* Parties and dates */}
        <View style={[styles.row, { marginTop: 32, gap: 24 }]}>
          <View style={{ flex: 1.3 }}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.bold}>{client.company || client.name}</Text>
            {client.company && <Text>{client.name}</Text>}
            <Multiline text={client.address} style={{ color: muted }} />
            {client.email && <Text style={styles.muted}>{client.email}</Text>}
            {client.taxId && <Text style={styles.muted}>Tax ID {client.taxId}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <View style={[styles.between, { marginBottom: 6 }]}>
              <Text style={styles.label}>Issue date</Text>
              <Text>{formatDate(inv.issueDate)}</Text>
            </View>
            <View style={[styles.between, { marginBottom: 6 }]}>
              <Text style={styles.label}>Due date</Text>
              <Text style={styles.bold}>{formatDate(inv.dueDate)}</Text>
            </View>
            <View style={styles.between}>
              <Text style={styles.label}>Currency</Text>
              <Text>{currency}</Text>
            </View>
          </View>
        </View>

        {/* Lines */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cDesc, styles.bold]}>Description</Text>
            <Text style={[styles.cQty, styles.bold]}>Qty</Text>
            <Text style={[styles.cPrice, styles.bold]}>Unit price</Text>
            <Text style={[styles.cAmount, styles.bold]}>Amount</Text>
          </View>
          {inv.lines.map((l) => (
            <View key={l.id} style={styles.td} wrap={false}>
              <Text style={styles.cDesc}>{l.description}</Text>
              <Text style={styles.cQty}>{formatQuantity(l.quantity)}</Text>
              <Text style={styles.cPrice}>{formatMoney(l.unitPrice, currency)}</Text>
              <Text style={styles.cAmount}>{formatMoney(l.amount, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatMoney(inv.subtotal, currency)}</Text>
          </View>
          {inv.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Discount</Text>
              <Text>−{formatMoney(inv.discount, currency)}</Text>
            </View>
          )}
          {inv.taxRateBps > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>
                {inv.taxLabel} ({formatRate(inv.taxRateBps)})
              </Text>
              <Text>{formatMoney(inv.taxAmount, currency)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grand]}>
            <Text>Total</Text>
            <Text>{formatMoney(inv.total, currency)}</Text>
          </View>
        </View>

        {inv.paymentInstructions && (
          <View style={styles.section}>
            <Text style={styles.label}>Payment details</Text>
            <Multiline text={inv.paymentInstructions} />
          </View>
        )}
        {inv.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Multiline text={inv.notes} style={{ color: muted }} />
          </View>
        )}

        <Text style={styles.footer} fixed>
          {business.name} · Invoice {inv.number} · Thank you for your business
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(inv: InvoiceWithRelations, business: Workspace) {
  return renderToBuffer(<InvoiceDocument invoice={inv} business={business} />);
}
