import type { InvoiceStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

const styles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  viewed: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-300",
  void: "bg-muted text-muted-foreground line-through",
};

export const statusLabel: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export function StatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles[status], className)}>
      {statusLabel[status]}
    </span>
  );
}
