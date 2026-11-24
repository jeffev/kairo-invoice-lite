"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient, deleteClient, updateClient } from "@/lib/clients";
import { countInvoicesForClient } from "@/lib/invoices";
import { requireWorkspace } from "@/lib/session";
import { optionalText, run } from "./shared";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: optionalText,
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.email("Enter a valid email").nullable()),
  phone: optionalText,
  address: optionalText,
  taxId: optionalText,
  notes: optionalText,
});

export type ClientFormInput = z.input<typeof clientSchema>;

export async function saveClientAction(id: string | null, input: ClientFormInput) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const data = clientSchema.parse(input);
    const clientId = id ? (await updateClient(workspace.id, id, data), id) : await createClient(workspace.id, data);
    revalidatePath("/clients");
    revalidatePath("/invoices");
    return { id: clientId };
  });
}

export async function deleteClientAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const n = await countInvoicesForClient(workspace.id, id);
    if (n > 0) throw new Error(`This client has ${n} invoice${n === 1 ? "" : "s"}. Delete or reassign them first.`);
    await deleteClient(workspace.id, id);
    revalidatePath("/clients");
  });
}
