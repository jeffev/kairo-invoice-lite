import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile();
} catch {
  // No .env file: fall back to the local SQLite database.
}

// Also accepts the `<PREFIX>_TURSO_DATABASE_URL` / `<PREFIX>_TURSO_AUTH_TOKEN` names set by Vercel's Turso integration.
const bySuffix = (suffix: string) =>
  Object.entries(process.env).find(([k, v]) => k.endsWith(suffix) && v)?.[1];
const url = process.env.DATABASE_URL || bySuffix("TURSO_DATABASE_URL") || "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || bySuffix("TURSO_AUTH_TOKEN") || undefined;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: authToken ? "turso" : "sqlite",
  dbCredentials: { url, authToken },
});
