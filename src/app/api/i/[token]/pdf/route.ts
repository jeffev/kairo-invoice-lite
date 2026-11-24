import { eq } from "drizzle-orm";

import { db } from "@/db";
import { workspace } from "@/db/schema";
import { getInvoiceByToken } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf";

/** PDF download from the public invoice page (the token is the secret). */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvoiceByToken(token);
  if (!inv || inv.status === "draft") return new Response("Not found", { status: 404 });
  const ws = await db.query.workspace.findFirst({ where: eq(workspace.id, inv.workspaceId) });
  if (!ws) return new Response("Not found", { status: 404 });
  const pdf = await renderInvoicePdf(inv, ws);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
