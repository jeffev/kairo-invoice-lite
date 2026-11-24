// Runs before `npm run dev`: creates .env from .env.example on first run and
// fills in a random BETTER_AUTH_SECRET, so the app starts with zero manual setup.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("setup: created .env from .env.example");
}

const env = readFileSync(".env", "utf8");
if (/^BETTER_AUTH_SECRET=\s*$/m.test(env)) {
  const secret = randomBytes(32).toString("base64url");
  writeFileSync(".env", env.replace(/^BETTER_AUTH_SECRET=\s*$/m, `BETTER_AUTH_SECRET=${secret}`));
  console.log("setup: generated BETTER_AUTH_SECRET");
}
