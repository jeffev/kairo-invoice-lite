"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export function InvoiceFilters({ status, q }: { status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState(q);

  const navigate = (next: { status?: string; q?: string }) => {
    const params = new URLSearchParams();
    const s = next.status ?? status;
    const term = next.q ?? query;
    if (s && s !== "all") params.set("status", s);
    if (term.trim()) params.set("q", term.trim());
    router.push(params.size ? `${pathname}?${params}` : pathname);
  };

  // Debounced search.
  React.useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => navigate({ q: query }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={tabs.some((t) => t.value === status) ? status : "all"} onValueChange={(v) => navigate({ status: v })}>
        <TabsList className="flex-wrap">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search number or client" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search invoices" />
      </div>
    </div>
  );
}
