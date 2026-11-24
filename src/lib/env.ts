import { z } from "zod";

// Every integration is optional: leave a key empty and that feature runs in demo mode,
// so the app works right after `npm install`.
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().default("file:local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),

  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),


  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Kairo Invoice <onboarding@resend.dev>"),

});

// Empty strings in .env mean "not set".
const raw: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
);

// The Vercel ↔ Turso integration names its variables `<PREFIX>_TURSO_DATABASE_URL` and
// `<PREFIX>_TURSO_AUTH_TOKEN` (or without a prefix); pick them up automatically.
const bySuffix = (suffix: string) => Object.entries(raw).find(([k, v]) => k.endsWith(suffix) && v)?.[1];
raw.DATABASE_URL ??= bySuffix("TURSO_DATABASE_URL");
raw.DATABASE_AUTH_TOKEN ??= bySuffix("TURSO_AUTH_TOKEN");
if (!raw.NEXT_PUBLIC_APP_URL && raw.VERCEL_PROJECT_PRODUCTION_URL) {
  raw.NEXT_PUBLIC_APP_URL = `https://${raw.VERCEL_PROJECT_PRODUCTION_URL}`;
}

export const env = schema.parse(raw);

export const features = {
  email: Boolean(env.RESEND_API_KEY),
  github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};
