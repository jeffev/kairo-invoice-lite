import { Body, Container, Head, Html, Preview, Section, Text } from "react-email";

/* Email-safe layout: tables and inline styles only, so it renders the same in Gmail, Outlook and
   Apple Mail. Adapted from Kairo Mail. */

export const colors = {
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  line: "#e2e8f0",
  canvas: "#f4f5f8",
  primary: "#171717",
  success: "#16a34a",
  danger: "#dc2626",
};

const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function EmailLayout({
  preview,
  business,
  children,
  footer,
}: {
  preview: string;
  business: { name: string; website?: string | null };
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ margin: 0, backgroundColor: colors.canvas, fontFamily: font }}>
        <Preview>{preview}</Preview>
        <Section style={{ backgroundColor: colors.canvas, padding: "32px 12px" }}>
          <Container style={{ maxWidth: 600, margin: "0 auto" }}>
            <Text style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: colors.ink }}>{business.name}</Text>
            <Section
              style={{
                backgroundColor: "#ffffff",
                border: `1px solid ${colors.line}`,
                borderRadius: 16,
                padding: "36px 32px",
              }}
            >
              {children}
            </Section>
            <Text style={{ margin: "24px 0 0", fontSize: 12, lineHeight: "18px", color: colors.muted, textAlign: "center" }}>
              {footer ?? `Sent by ${business.name}${business.website ? ` · ${business.website}` : ""}`}
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 16px", fontSize: 24, lineHeight: "32px", fontWeight: 600, color: colors.ink }}>{children}</Text>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 16px", fontSize: 15, lineHeight: "24px", color: colors.body }}>{children}</Text>;
}

export function Small({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: colors.muted }}>{children}</Text>;
}

export function Button({ href, children, tone = "primary" }: { href: string; children: React.ReactNode; tone?: "primary" | "danger" }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: tone === "danger" ? colors.danger : colors.primary,
          color: "#ffffff",
          borderRadius: 8,
          padding: "12px 24px",
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {children}
      </a>
    </Section>
  );
}

export function Highlight({ label, value, side }: { label: string; value: string; side?: { label: string; value: string } }) {
  return (
    <Section style={{ margin: "24px 0", backgroundColor: colors.canvas, borderRadius: 12, padding: "20px" }}>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <Text style={{ margin: 0, fontSize: 13, color: colors.muted }}>{label}</Text>
              <Text style={{ margin: 0, fontSize: 30, lineHeight: "38px", fontWeight: 600, color: colors.ink }}>{value}</Text>
            </td>
            {side && (
              <td align="right" style={{ verticalAlign: "top" }}>
                <Text style={{ margin: 0, fontSize: 13, color: colors.muted }}>{side.label}</Text>
                <Text style={{ margin: 0, fontSize: 17, lineHeight: "38px", fontWeight: 600, color: colors.ink }}>{side.value}</Text>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function Rows({ rows, total }: { rows: [string, string][]; total?: [string, string] }) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: 24 }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label + value}>
            <td style={{ padding: "6px 0", fontSize: 14, color: colors.muted }}>{label}</td>
            <td align="right" style={{ padding: "6px 0", fontSize: 14, color: colors.body }}>
              {value}
            </td>
          </tr>
        ))}
        {total && (
          <tr>
            <td style={{ paddingTop: 12, borderTop: `1px solid ${colors.line}`, fontSize: 16, fontWeight: 600, color: colors.ink }}>{total[0]}</td>
            <td align="right" style={{ paddingTop: 12, borderTop: `1px solid ${colors.line}`, fontSize: 16, fontWeight: 600, color: colors.ink }}>
              {total[1]}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
