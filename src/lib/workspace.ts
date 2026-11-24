import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { user, workspace } from "@/db/schema";

export type Workspace = typeof workspace.$inferSelect;

/** Returns the user's workspace, creating a default one on first access. */
export async function getWorkspace(userId: string): Promise<Workspace> {
  const existing = await db.query.workspace.findFirst({ where: eq(workspace.userId, userId) });
  if (existing) return existing;

  const owner = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { name: true, email: true } });
  await db
    .insert(workspace)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: owner?.name ? `${owner.name}'s business` : "My business",
      email: owner?.email ?? null,
    })
    .onConflictDoNothing();
  return (await db.query.workspace.findFirst({ where: eq(workspace.userId, userId) }))!;
}

/** Reserves the next invoice number atomically (e.g. "INV-0042"). */
export async function reserveInvoiceNumber(workspaceId: string) {
  const [row] = await db
    .update(workspace)
    .set({ nextInvoiceNumber: sql`${workspace.nextInvoiceNumber} + 1` })
    .where(eq(workspace.id, workspaceId))
    .returning({ next: workspace.nextInvoiceNumber, prefix: workspace.invoicePrefix });
  const n = row.next - 1;
  return `${row.prefix}${String(n).padStart(4, "0")}`;
}

export async function updateWorkspace(workspaceId: string, values: Partial<Omit<Workspace, "id" | "userId" | "createdAt">>) {
  await db.update(workspace).set(values).where(eq(workspace.id, workspaceId));
}
