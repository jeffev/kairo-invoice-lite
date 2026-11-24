import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { siteConfig } from "@/config/site";
import { sendEmail } from "@/lib/email";
import { env, features } from "@/lib/env";
import { getWorkspace } from "@/lib/workspace";

export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  // Better Auth requires a secret in production; generate one with `npx @better-auth/cli secret`.
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: `Reset your ${siteConfig.name} password`,
        text: `Hi ${user.name},\n\nClick the link below to choose a new password:\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
      });
    },
  },
  socialProviders: {
    ...(features.github && {
      github: { clientId: env.GITHUB_CLIENT_ID!, clientSecret: env.GITHUB_CLIENT_SECRET! },
    }),
    ...(features.google && {
      google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! },
    }),
  },
  user: {
    // Lets users delete their own account from Settings (data cascades via foreign keys).
    deleteUser: { enabled: true },
  },
  databaseHooks: {
    user: {
      create: {
        // Every user gets a workspace (the business that issues invoices).
        after: async (user) => {
          await getWorkspace(user.id);
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
