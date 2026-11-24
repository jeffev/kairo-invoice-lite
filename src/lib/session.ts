import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** For server components and route handlers that require a signed-in user. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

/** The signed-in user and their workspace, for every app page and action. */
export async function requireWorkspace() {
  const user = await requireUser();
  const workspace = await getWorkspace(user.id);
  return { user, workspace };
}
