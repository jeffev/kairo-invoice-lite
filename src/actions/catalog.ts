"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createItem, deleteItem, updateItem } from "@/lib/catalog";
import { requireWorkspace } from "@/lib/session";
import { optionalText, run } from "./shared";

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: optionalText,
  unitPrice: z.number().int().min(0),
});
export type ItemFormInput = z.input<typeof itemSchema>;

export async function saveItemAction(id: string | null, input: ItemFormInput) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const data = itemSchema.parse(input);
    const itemId = id ? (await updateItem(workspace.id, id, data), id) : await createItem(workspace.id, data);
    revalidatePath("/items");
    return { id: itemId };
  });
}

export async function deleteItemAction(id: string) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    await deleteItem(workspace.id, id);
    revalidatePath("/items");
  });
}
