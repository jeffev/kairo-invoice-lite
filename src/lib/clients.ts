import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { client, invoice } from "@/db/schema";

export type ClientInput = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
};

export async function listClients(workspaceId: string) {
  return db.query.client.findMany({ where: eq(client.workspaceId, workspaceId), orderBy: asc(client.name) });
}

/** Clients with their invoice count and open balance, for the clients table. */
export async function listClientsWithStats(workspaceId: string) {
  const rows = await db
    .select({
      client,
      invoices: sql<number>`count(${invoice.id})`,
      billed: sql<number>`coalesce(sum(case when ${invoice.status} != 'void' then ${invoice.total} else 0 end), 0)`,
      outstanding: sql<number>`coalesce(sum(case when ${invoice.status} in ('sent','viewed','overdue') then ${invoice.total} else 0 end), 0)`,
    })
    .from(client)
    .leftJoin(invoice, eq(invoice.clientId, client.id))
    .where(eq(client.workspaceId, workspaceId))
    .groupBy(client.id)
    .orderBy(asc(client.name));
  return rows.map((r) => ({ ...r.client, invoices: Number(r.invoices), billed: Number(r.billed), outstanding: Number(r.outstanding) }));
}

export async function getClient(workspaceId: string, id: string) {
  return db.query.client.findFirst({
    where: and(eq(client.id, id), eq(client.workspaceId, workspaceId)),
    with: { invoices: { orderBy: desc(invoice.issueDate) } },
  });
}

export async function createClient(workspaceId: string, input: ClientInput) {
  const id = crypto.randomUUID();
  await db.insert(client).values({ id, workspaceId, ...input });
  return id;
}

export async function updateClient(workspaceId: string, id: string, input: ClientInput) {
  await db.update(client).set(input).where(and(eq(client.id, id), eq(client.workspaceId, workspaceId)));
}

/** Fails (foreign key) when the client still has invoices; the action checks first. */
export async function deleteClient(workspaceId: string, id: string) {
  await db.delete(client).where(and(eq(client.id, id), eq(client.workspaceId, workspaceId)));
}
