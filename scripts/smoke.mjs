// End-to-end check of the app in a real browser.
//   npm run build && npx next start -H 127.0.0.1 -p 3000
//   BASE=http://127.0.0.1:3000 npm run smoke
// Uses an installed Chrome (CHROME_PATH to override). Screenshots: SHOTS=1 writes docs/*.png.
import { mkdirSync } from "node:fs";

import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://127.0.0.1:3000";
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/google-chrome");
const SHOTS = process.env.SHOTS === "1";
const stamp = Date.now().toString(36);
const OWNER = { name: "Olivia Owner", email: `owner-${stamp}@example.com`, password: "demo-pass-2026" };

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 }, deviceScaleFactor: SHOTS ? 2 : 1 });
const page = await ctx.newPage();
const anonCtx = await browser.newContext({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: SHOTS ? 2 : 1 });
const anon = await anonCtx.newPage();

let failures = 0;
const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(`ok   ${name}`);
  } catch (e) {
    failures++;
    await page.screenshot({ path: `fail-${failures}.png` }).catch(() => {});
    results.push(`FAIL ${name}: ${e.message.split("\n")[0]}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const hydrate = (p) => p.waitForTimeout(4000);
const text = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const shot = async (p, name) => {
  if (!SHOTS) return;
  mkdirSync("docs", { recursive: true });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `docs/${name}.png` });
};

await check("landing page", async () => {
  await anon.goto(BASE + "/", { waitUntil: "networkidle" });
  assert((await text(anon)).includes("Kairo Invoice Lite"), "brand missing");
});

await check("sign up and load sample data", async () => {
  const r = await ctx.request.post(`${BASE}/api/auth/sign-up/email`, { data: OWNER, headers: { Origin: BASE } });
  assert(r.ok(), `sign-up ${r.status()}`);
  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
  await hydrate(page);
  await page.getByRole("button", { name: "Load sample data" }).click();
  await page.getByText("Sample data loaded").waitFor({ timeout: 180000 });
  await page.reload({ waitUntil: "networkidle" });
  assert((await text(page)).includes("Outstanding"), "dashboard cards");
  await shot(page, "dashboard");
});

await check("paid-only modules are not present", async () => {
  for (const path of ["/expenses", "/recurring", "/reports", "/estimates"]) {
    const r = await page.goto(BASE + path, { waitUntil: "networkidle" });
    assert(r.status() === 404, `${path} answered ${r.status()}`);
  }
  for (const path of ["/api/cron", "/api/stripe/webhook"]) {
    const r = await ctx.request.get(BASE + path);
    assert(r.status() === 404 || r.status() === 405, `${path} answered ${r.status()}`);
  }
});

let invoiceUrl = "";
await check("create a client and an invoice", async () => {
  await page.goto(BASE + "/clients?new=1", { waitUntil: "networkidle" });
  await hydrate(page);
  await page.locator("#c-name").fill("Harriet Jones");
  await page.locator("#c-company").fill(`Thames Works ${stamp}`);
  await page.locator("#c-email").fill("harriet@thames.example");
  await page.getByRole("button", { name: "Add client" }).click();
  await page.getByText("Client added").waitFor();
  await page.goto(BASE + "/invoices/new", { waitUntil: "networkidle" });
  await hydrate(page);
  await page.locator("#client").click();
  await page.getByRole("option", { name: new RegExp(`Thames Works ${stamp}`) }).click();
  await page.getByLabel("Line 1 description").fill("Workshop");
  await page.getByLabel("Line 1 unit price").fill("1200");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.waitForURL(/\/invoices\/[0-9a-f-]{36}$/);
  invoiceUrl = page.url();
  await page.waitForLoadState("networkidle");
  assert((await text(page)).includes("$1,200.00"), "total");
});

await check("send by email (printed to the console without a key)", async () => {
  await hydrate(page);
  await page.getByRole("button", { name: "Send" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Send" }).click();
  await page.locator("[data-sonner-toast]", { hasText: /printed to the server console|Invoice sent/ }).waitFor({ timeout: 30000 });
  await page.reload({ waitUntil: "networkidle" });
  assert((await text(page)).includes("Sent"), "status not sent");
  await shot(page, "invoice");
});

await check("PDF downloads", async () => {
  const id = invoiceUrl.split("/").pop();
  const r = await ctx.request.get(`${BASE}/api/invoices/${id}/pdf`);
  assert(r.ok() && r.headers()["content-type"] === "application/pdf", `pdf ${r.status()}`);
});

await check("public invoice page: view and PDF, no card payment", async () => {
  const href = await page.getByRole("link", { name: "Open client view" }).getAttribute("href");
  await anon.goto(href, { waitUntil: "networkidle" });
  const t = await text(anon);
  assert(t.includes("Workshop") && t.includes("Download PDF"), "public page content");
  assert((await anon.getByRole("button", { name: /^Pay/ }).count()) === 0, "a Pay button exists");
  const pdf = await anonCtx.request.get(href.replace("/i/", "/api/i/") + "/pdf");
  assert(pdf.ok(), "public pdf");
  await shot(anon, "public-invoice");
});

await check("mark as paid and undo", async () => {
  await page.goto(invoiceUrl, { waitUntil: "networkidle" });
  await hydrate(page);
  await page.getByRole("button", { name: "Mark as paid" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Mark as paid" }).click();
  await page.getByText("Marked as paid").waitFor();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Mark as unpaid" }).click();
  await page.getByText("Marked as unpaid").waitFor();
});

await check("invoice list filters", async () => {
  await page.goto(BASE + "/invoices?status=overdue", { waitUntil: "networkidle" });
  assert((await page.locator("tbody tr").count()) >= 1, "no overdue invoice");
  await page.goto(BASE + "/invoices", { waitUntil: "networkidle" });
  await shot(page, "invoices");
});

await browser.close();
console.log(results.join("\n"));
console.log(failures ? `\n${failures} failing` : `\nall ${results.length} checks passed`);
process.exit(failures ? 1 : 0);
