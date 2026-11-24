import type { Metadata } from "next";

import { ItemsView } from "@/components/catalog/items-view";
import { listItems } from "@/lib/catalog";
import { requireWorkspace } from "@/lib/session";

export const metadata: Metadata = { title: "Items" };

export default async function ItemsPage() {
  const { workspace } = await requireWorkspace();
  const items = await listItems(workspace.id);
  return <ItemsView items={items} currency={workspace.currency} />;
}
