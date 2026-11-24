import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Local development uses a SQLite file; in production point DATABASE_URL at Turso
// (libsql://...) and set DATABASE_AUTH_TOKEN.
const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
