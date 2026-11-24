"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CURRENCIES } from "@/lib/money";
import { requireWorkspace } from "@/lib/session";
import { updateWorkspace } from "@/lib/workspace";
import { optionalText, run } from "./shared";

const schema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(120),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.email("Enter a valid email").nullable()),
  phone: optionalText,
  website: optionalText,
  address: optionalText,
  taxId: optionalText,
  currency: z.enum(CURRENCIES.map((c) => c.code) as [string, ...string[]]),
  taxRateBps: z.number().int().min(0).max(10_000),
  taxLabel: z.string().trim().min(1).max(40),
  invoicePrefix: z.string().trim().max(12),
  nextInvoiceNumber: z.number().int().min(1),
  paymentTermsDays: z.number().int().min(0).max(365),
  defaultNotes: optionalText,
  paymentInstructions: optionalText,
});
export type WorkspaceFormInput = z.input<typeof schema>;

export async function saveWorkspaceAction(input: WorkspaceFormInput) {
  return run(async () => {
    const { workspace } = await requireWorkspace();
    const data = schema.parse(input);
    if (data.nextInvoiceNumber < workspace.nextInvoiceNumber) {
      // Never reuse a number that was already issued.
      data.nextInvoiceNumber = workspace.nextInvoiceNumber;
    }
    await updateWorkspace(workspace.id, data);
    revalidatePath("/", "layout");
  });
}
