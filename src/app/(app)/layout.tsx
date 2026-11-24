import { AppSidebar } from "@/components/app/app-sidebar";
import { DemoBanner } from "@/components/app/demo-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { features } from "@/lib/env";
import { getInvoiceStats, markOverdueInvoices } from "@/lib/invoices";
import { requireWorkspace } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  // Overdue statuses are refreshed on every page load.
  await markOverdueInvoices(workspace.id);
  const stats = await getInvoiceStats(workspace.id);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ name: user.name, email: user.email, image: user.image ?? null }}
        business={workspace.name}
        openCount={stats.openCount}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <DemoBanner email={features.email} />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
