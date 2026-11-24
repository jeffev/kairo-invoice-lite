import { getInvoice } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf";
import { requireWorkspace } from "@/lib/session";

/** PDF download for the signed-in owner. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const inv = await getInvoice(workspace.id, id);
  if (!inv) return new Response("Not found", { status: 404 });
  const pdf = await renderInvoicePdf(inv, workspace);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
