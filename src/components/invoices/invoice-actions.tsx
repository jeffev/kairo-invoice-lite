"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Check, CheckCircle2, Copy, Download, Link2, Loader2, MoreHorizontal, Pencil, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteInvoiceAction,
  duplicateInvoiceAction,
  markPaidAction,
  markSentAction,
  markUnpaidAction,
  sendInvoiceAction,
  voidInvoiceAction,
} from "@/actions/invoices";
import { ConfirmButton } from "@/components/app/confirm-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceStatus } from "@/db/schema";
import { formatDateInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export function InvoiceActions({
  invoice,
  publicUrl,
  clientEmail,
  emailDemo,
}: {
  invoice: { id: string; number: string; status: InvoiceStatus; currency: string; total: number };
  publicUrl: string;
  clientEmail: string | null;
  emailDemo: boolean;
}) {
  const router = useRouter();
  const [sendOpen, setSendOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [paidAt, setPaidAt] = React.useState(formatDateInput(new Date()));
  const [pending, setPending] = React.useState<string | null>(null);
  const open = ["sent", "viewed", "overdue"].includes(invoice.status);
  const editable = invoice.status === "draft" || open;

  const call = async <T,>(name: string, fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, success: string | ((d: T) => string)) => {
    setPending(name);
    const result = await fn();
    setPending(null);
    if (!result.ok) {
      toast.error(result.error);
      return null;
    }
    toast.success(typeof success === "function" ? success(result.data) : success);
    router.refresh();
    return result.data;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Invoice link copied");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {invoice.status !== "void" && invoice.status !== "paid" && (
        <Button onClick={() => setSendOpen(true)} disabled={!clientEmail}>
          <Send /> {invoice.status === "draft" ? "Send" : "Resend"}
        </Button>
      )}
      {open && (
        <Button variant="outline" onClick={() => setPayOpen(true)}>
          <CheckCircle2 /> Mark as paid
        </Button>
      )}
      {invoice.status === "paid" && (
        <Button variant="outline" onClick={() => call("unpaid", () => markUnpaidAction(invoice.id), "Marked as unpaid")}>
          <RotateCcw /> Mark as unpaid
        </Button>
      )}
      <Button variant="outline" asChild>
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener">
          <Download /> PDF
        </a>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {editable && (
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={copyLink}>
            <Link2 /> Copy invoice link
          </DropdownMenuItem>
          {invoice.status === "draft" && (
            <DropdownMenuItem onClick={() => call("sent", () => markSentAction(invoice.id), "Marked as sent")}>
              <Check /> Mark as sent (no email)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={async () => {
              const data = await call("dup", () => duplicateInvoiceAction(invoice.id), "Invoice duplicated");
              if (data) router.push(`/invoices/${data.id}`);
            }}
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {invoice.status !== "void" && invoice.status !== "paid" && (
            <ConfirmButton
              title={`Void invoice ${invoice.number}?`}
              description="A void invoice stays in your records but can no longer be paid."
              confirmLabel="Void invoice"
              destructive
              onConfirm={async () => {
                await call("void", () => voidInvoiceAction(invoice.id), "Invoice voided");
              }}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Ban /> Void
              </DropdownMenuItem>
            </ConfirmButton>
          )}
          {invoice.status !== "paid" && (
            <ConfirmButton
              title={`Delete invoice ${invoice.number}?`}
              description="This permanently removes the invoice. The number will not be reused."
              confirmLabel="Delete"
              destructive
              onConfirm={async () => {
                const ok = await call("delete", () => deleteInvoiceAction(invoice.id), "Invoice deleted");
                if (ok !== null) router.push("/invoices");
              }}
            >
              <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </ConfirmButton>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Send dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invoice {invoice.number}</DialogTitle>
            <DialogDescription>
              The client receives the PDF and a link to view it online{clientEmail ? ` at ${clientEmail}` : ""}.
              {emailDemo && " Demo mode: the email is printed to the server console."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="message">Personal message (optional)</Label>
            <Textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Thanks again for the project. Let me know if you have any questions." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending === "send"}
              onClick={async () => {
                const data = await call("send", () => sendInvoiceAction(invoice.id, message), (d) => (d.demo ? "Email printed to the server console (demo mode)" : "Invoice sent"));
                if (data) setSendOpen(false);
              }}
            >
              {pending === "send" && <Loader2 className="animate-spin" />}
              <Send /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {invoice.number} as paid</DialogTitle>
            <DialogDescription>Record that the client paid {formatMoney(invoice.total, invoice.currency)} outside the app (bank transfer, cash, check…).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="paidAt">Payment date</Label>
            <Input id="paidAt" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending === "paid"}
              onClick={async () => {
                const ok = await call("paid", () => markPaidAction(invoice.id, paidAt), "Marked as paid");
                if (ok !== null) setPayOpen(false);
              }}
            >
              {pending === "paid" && <Loader2 className="animate-spin" />}
              Mark as paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
