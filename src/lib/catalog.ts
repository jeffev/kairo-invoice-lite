import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { item } from "@/db/schema";

/* ---------- Items (products and services) ---------- */

export type ItemInput = { name: string; description?: string | null; unitPrice: number };

export async function listItems(workspaceId: string) {
  return db.query.item.findMany({ where: eq(item.workspaceId, workspaceId), orderBy: asc(item.name) });
}

export async function createItem(workspaceId: string, input: ItemInput) {
  const id = crypto.randomUUID();
  await db.insert(item).values({ id, workspaceId, ...input });
  return id;
}

export async function updateItem(workspaceId: string, id: string, input: ItemInput) {
  await db.update(item).set(input).where(and(eq(item.id, id), eq(item.workspaceId, workspaceId)));
}

export async function deleteItem(workspaceId: string, id: string) {
  await db.delete(item).where(and(eq(item.id, id), eq(item.workspaceId, workspaceId)));
}
