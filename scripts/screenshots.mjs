// Drives the real authed flow with Playwright and captures screenshots.
// Doubles as a visual smoke test. Point it at a running server or production:
//   PowerShell:  $env:BASE_URL="https://wafa.7mxd.me"; node scripts/screenshots.mjs
//   bash:        BASE_URL=http://127.0.0.1:3210 node scripts/screenshots.mjs
// Default BASE_URL is http://127.0.0.1:3210 (run `next dev -p 3210` first).
//
// The run is resilient: each section is independent, so one failure (e.g. a
// demo sign-in) never wipes the others. On a sign-in failure it surfaces the
// inline auth error and saves a `_debug-<name>.png` frame. Before each shot it
// waits for real content so the App Router `loading.tsx` skeleton is never the
// thing that gets captured.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3210";
const OUT = path.join(import.meta.dirname, "..", "screenshots");
fs.mkdirSync(OUT, { recursive: true });
console.log("→ BASE_URL:", BASE);

const browser = await chromium.launch();
const DESKTOP = { width: 1024, height: 820, deviceScaleFactor: 2 };
const MOBILE = { width: 402, height: 874, deviceScaleFactor: 2 };

const failures = [];
async function section(label, fn) {
  try {
    await fn();
  } catch (e) {
    console.error(`✗ ${label}: ${e.message}`);
    failures.push(label);
  }
}

async function newPage(vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
  });
  return { ctx, page: await ctx.newPage() };
}

async function open(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
}

// Wait for a real element to appear (so the loading.tsx skeleton, which carries
// no such element, has been replaced), then let the network quiesce.
async function settle(page, realLocator) {
  await realLocator
    .first()
    .waitFor({ state: "visible", timeout: 25000 })
    .catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  console.log("✓", name);
}

async function login(name, vp = DESKTOP) {
  const { ctx, page } = await newPage(vp);
  await open(page, `${BASE}/login`);
  if (name === null) return { ctx, page };

  // Demo-account chip: accessible name contains the person's name.
  const chip = page.getByRole("button", { name, exact: false });
  await chip.waitFor({ state: "visible", timeout: 15000 });
  await chip.click();

  // Win = reach /dashboard. Lose = the inline error box appears, or 30s passes.
  const errorBox = page.locator(".text-rose-700");
  let inlineErr = null;
  try {
    inlineErr = await Promise.race([
      page.waitForURL("**/dashboard", { timeout: 30000 }).then(() => null),
      (async () => {
        await errorBox.waitFor({ state: "visible", timeout: 30000 });
        return (await errorBox.first().textContent())?.trim() || "(empty error)";
      })(),
    ]);
  } catch {
    inlineErr = "TIMEOUT";
  }

  if (inlineErr) {
    await page
      .screenshot({ path: path.join(OUT, `_debug-${name}.png`) })
      .catch(() => {});
    const why =
      inlineErr === "TIMEOUT"
        ? "no /dashboard and no inline error within 30s — does BASE_URL point at a server whose Supabase has the seeded demo accounts?"
        : `inline error: "${inlineErr}"`;
    throw new Error(
      `demo sign-in for "${name}" failed (${why}); saved _debug-${name}.png; url=${page.url()}`,
    );
  }

  // Wait for real dashboard content (a loan card link), not the skeleton.
  await settle(page, page.locator('a[href^="/loans/"]'));
  return { ctx, page };
}

// 0) Landing page (public, logged-out)
await section("landing", async () => {
  for (const [name, vp] of [
    ["00-landing.png", DESKTOP],
    ["00b-landing-mobile.png", MOBILE],
  ]) {
    const { ctx, page } = await newPage(vp);
    await open(page, `${BASE}/`);
    await page.waitForTimeout(1200);
    await shot(page, name);
    await ctx.close();
  }
});

// 1) Login screen (desktop + mobile)
await section("login", async () => {
  let { ctx, page } = await login(null);
  await shot(page, "01-login.png");
  await ctx.close();
  ({ ctx, page } = await login(null, MOBILE));
  await shot(page, "01b-login-mobile.png");
  await ctx.close();
});

// 2) Omar: dashboard (the pending inbox) + the pending request detail
await section("omar dashboard + pending detail", async () => {
  const { ctx, page } = await login("Omar");
  await shot(page, "02-dashboard-omar.png");
  await page
    .locator('a[href^="/loans/"]', { hasText: "Car repair" })
    .first()
    .click();
  await page.waitForURL("**/loans/**");
  await settle(page, page.getByRole("heading", { name: "Timeline" }));
  await shot(page, "03-loan-pending-omar.png");
  await ctx.close();
});

// 2b) Omar dashboard on mobile
await section("omar dashboard mobile", async () => {
  const { ctx, page } = await login("Omar", MOBILE);
  await shot(page, "02b-dashboard-omar-mobile.png");
  await ctx.close();
});

// 3) Aisha: dashboard + the active loan (IBAN + repayment)
await section("aisha dashboard + active detail", async () => {
  const { ctx, page } = await login("Aisha");
  await shot(page, "04-dashboard-aisha.png");
  await page
    .locator('a[href^="/loans/"]', { hasText: "Laptop screen repair" })
    .first()
    .click();
  await page.waitForURL("**/loans/**");
  await settle(page, page.getByRole("heading", { name: "Timeline" }));
  await shot(page, "05-loan-active-aisha.png");
  await ctx.close();
});

// 4) The AI-assisted request flow (own session so it stands alone)
await section("ai request flow", async () => {
  const { ctx, page } = await login("Aisha");
  await open(page, `${BASE}/new`);
  const prompt = page.getByPlaceholder(/need 400/i);
  await prompt.waitFor({ state: "visible", timeout: 25000 });
  await prompt.fill("need 750 for a laptop repair, pay you back next month");
  await page.getByRole("button", { name: /Structure with AI/i }).click();
  await page.waitForTimeout(8500);
  await shot(page, "06-new-ai-filled.png");
  await ctx.close();
});

await browser.close();
if (failures.length) {
  console.error(`\n⚠ ${failures.length} section(s) failed: ${failures.join("; ")}`);
  process.exitCode = 1;
} else {
  console.log("done — all captures succeeded");
}
