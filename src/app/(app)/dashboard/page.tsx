import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Plus, Wallet } from "lucide-react";

import { SampleDataButton } from "@/components/app/sample-data-button";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listClients } from "@/lib/clients";
import { formatDate } from "@/lib/dates";
import { getInvoiceStats, listInvoices } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const cur = workspace.currency;
  const [stats, recent, overdue, clients] = await Promise.all([
    getInvoiceStats(workspace.id),
    listInvoices(workspace.id, { limit: 6 }),
    listInvoices(workspace.id, { status: "overdue", limit: 5 }),
    listClients(workspace.id),
  ]);
  const firstName = user.name.split(" ")[0];

  const cards = [
    { title: "Paid this month", value: formatMoney(stats.paidThisMonth, cur), hint: `${stats.paidCount} invoice${stats.paidCount === 1 ? "" : "s"} paid`, icon: CheckCircle2 },
    { title: "Outstanding", value: formatMoney(stats.outstanding, cur), hint: `${stats.openCount} open invoice${stats.openCount === 1 ? "" : "s"}`, icon: Wallet },
    { title: "Overdue", value: formatMoney(stats.overdueAmount, cur), hint: `${stats.overdueCount} invoice${stats.overdueCount === 1 ? "" : "s"} past due`, icon: AlertTriangle, alert: stats.overdueCount > 0 },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Good to see you, {firstName}</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s how {workspace.name} is doing.</p>
        </div>
        <div className="flex gap-2">
          {clients.length === 0 && <SampleDataButton />}
          <Button asChild>
            <Link href="/invoices/new">
              <Plus /> New invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="gap-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <span className={`flex size-8 items-center justify-center rounded-md ${card.alert ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"}`}>
                <card.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="grid gap-1">
              <CardTitle>Recent invoices</CardTitle>
              <CardDescription>The latest activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">
                All invoices <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="grid justify-items-center gap-3 rounded-lg border border-dashed py-10 text-center">
                <FileText className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
                <Button size="sm" asChild>
                  <Link href="/invoices/new">Create your first invoice</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {recent.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/invoices/${inv.id}`} className="group flex items-center gap-3 py-3 text-sm">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="w-24 font-medium">{inv.number}</span>
                      <span className="flex-1 truncate">{inv.client.company || inv.client.name}</span>
                      <StatusBadge status={inv.status} />
                      <span className="w-28 text-right tabular-nums">{formatMoney(inv.total, inv.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>{overdue.length === 0 ? "Nothing overdue. Nice." : "Overdue invoices"}</CardDescription>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {stats.draftCount > 0 ? (
                  <>
                    You have {stats.draftCount} draft{stats.draftCount === 1 ? "" : "s"} waiting to be sent.{" "}
                    <Link href="/invoices?status=draft" className="font-medium text-foreground underline">
                      Review drafts
                    </Link>
                  </>
                ) : (
                  "Invoices past their due date show up here."
                )}
              </p>
            ) : (
              <ul className="divide-y">
                {overdue.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/invoices/${inv.id}`} className="flex items-center gap-3 py-2.5 text-sm">
                      <div className="grid flex-1 gap-0.5">
                        <span className="font-medium">{inv.client.company || inv.client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {inv.number} · due {formatDate(inv.dueDate)}
                        </span>
                      </div>
                      <span className="tabular-nums">{formatMoney(inv.total, inv.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
