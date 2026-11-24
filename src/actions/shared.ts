import "server-only";

import { z } from "zod";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string): ActionResult<never> => ({ ok: false, error });

/** Runs an action body and turns thrown errors and Zod issues into a result the form can show. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input");
    if (error instanceof Error) {
      // Next.js redirect() throws a special error that must propagate.
      if ("digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
      return fail(error.message);
    }
    return fail("Something went wrong");
  }
}

export const optionalText = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();
