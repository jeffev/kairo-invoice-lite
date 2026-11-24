import type { Metadata } from "next";
import { Suspense } from "react";

import { ClientsView } from "@/components/clients/clients-view";
import { listClientsWithStats } from "@/lib/clients";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const { workspace } = await requireWorkspace();
  const clients = await listClientsWithStats(workspace.id);
  return (
    <Suspense>
      <ClientsView clients={clients} currency={workspace.currency} />
    </Suspense>
  );
}
