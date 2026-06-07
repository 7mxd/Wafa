// Drives the real authed flow with Playwright and captures screenshots.
// Doubles as a visual smoke test. Run a server first, then:
//   BASE_URL=http://127.0.0.1:3210 node scripts/screenshots.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3210";
const OUT = path.join(import.meta.dirname, "..", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const DESKTOP = { width: 1024, height: 820, deviceScaleFactor: 2 };
const MOBILE = { width: 402, height: 874, deviceScaleFactor: 2 };

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  console.log("✓", name);
}

async function login(name, viewport = DESKTOP) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  if (name === null) return { ctx, page };
  // Demo-account chip: accessible name is "<Name> Demo"
  await page.getByRole("button", { name, exact: false }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  return { ctx, page };
}

// 0) Landing page (public, logged-out)
for (const [name, vp] of [
  ["00-landing.png", DESKTOP],
  ["00b-landing-mobile.png", MOBILE],
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, name);
  await ctx.close();
}

// 1) Login screen (desktop + mobile)
{
  const { ctx, page } = await login(null);
  await shot(page, "01-login.png");
  await ctx.close();
}
{
  const { ctx, page } = await login(null, MOBILE);
  await shot(page, "01b-login-mobile.png");
  await ctx.close();
}

// 2) Omar: dashboard (has the pending inbox) + the pending request detail
{
  const { ctx, page } = await login("Omar");
  await shot(page, "02-dashboard-omar.png");
  await page
    .locator('a[href^="/loans/"]', { hasText: "Car repair" })
    .first()
    .click();
  await page.waitForURL("**/loans/**");
  await page.waitForLoadState("networkidle");
  await shot(page, "03-loan-pending-omar.png");
  await ctx.close();
}

// 2b) Omar dashboard on mobile
{
  const { ctx, page } = await login("Omar", MOBILE);
  await shot(page, "02b-dashboard-omar-mobile.png");
  await ctx.close();
}

// 3) Aisha: dashboard + the active loan (IBAN + repayment) + AI request flow
{
  const { ctx, page } = await login("Aisha");
  await shot(page, "04-dashboard-aisha.png");

  await page
    .locator('a[href^="/loans/"]', { hasText: "Laptop screen repair" })
    .first()
    .click();
  await page.waitForURL("**/loans/**");
  await page.waitForLoadState("networkidle");
  await shot(page, "05-loan-active-aisha.png");

  await page.goto(`${BASE}/new`, { waitUntil: "networkidle" });
  await page
    .getByPlaceholder(/need 400/i)
    .fill("need 750 for a laptop repair, pay you back next month");
  await page.getByRole("button", { name: /Structure with AI/i }).click();
  await page.waitForTimeout(7000);
  await shot(page, "06-new-ai-filled.png");
  await ctx.close();
}

await browser.close();
console.log("done");
