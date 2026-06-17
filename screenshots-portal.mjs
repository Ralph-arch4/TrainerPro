/**
 * screenshots-portal.mjs
 * Captures /cliente/[token] and /scheda/[token] at mobile + desktop viewports.
 *
 * Requires: guest1@trainerpro.dev / Ciao04 seeded account with at least one client
 * named "Cliente Demo 1" that has a workout plan with a share_token.
 * If the selector fails, check seed-e2e.ts / run scripts/seed-e2e.ts first.
 *
 * Usage: node screenshots-portal.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL  = process.env.BASE_URL  ?? "https://trainer-pro-phi.vercel.app";
const EMAIL     = process.env.TEST_EMAIL    ?? "guest1@trainerpro.dev";
const PASSWORD  = process.env.TEST_PASSWORD ?? "Ciao04";

mkdirSync("screenshots", { recursive: true });

// ── Phase 1: log in as the seeded trainer and extract the share token ──────────
const browser = await chromium.launch();
const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.fill("input[type=email]", EMAIL);
await page.fill("input[type=password]", PASSWORD);
await page.click("button[type=submit]");
await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 12000 }).catch(() => {});

// Navigate to the seeded client and extract the share URL
await page.goto(`${BASE_URL}/dashboard/clienti`, { waitUntil: "networkidle" });
await page.locator("text=Cliente Demo 1").first().click();
await page.waitForTimeout(1200);

const shareUrl = await page.evaluate(() => {
  // Try anchor tags first
  const links = Array.from(document.querySelectorAll('a[href*="/cliente/"], a[href*="/scheda/"]'));
  if (links.length) return links[0].href;
  // Fallback: scan all text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent?.trim() ?? "";
    if (t.includes("/cliente/") || t.includes("/scheda/")) return t;
  }
  return null;
});

await browser.close();

if (!shareUrl) {
  console.error("Could not extract share token. Check that guest1@trainerpro.dev has a client 'Cliente Demo 1' with a workout plan.");
  process.exit(1);
}

const token = new URL(shareUrl, BASE_URL).pathname.split("/").pop();
console.log(`Share token: ${token}`);

// ── Phase 2: screenshot both portal routes at mobile + desktop ─────────────────
const browser2 = await chromium.launch();

for (const [w, h, tag, idx] of [[390, 844, "mobile", "09-10"], [1440, 900, "desktop", "10-12"]]) {
  const c = await browser2.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();

  // /cliente/[token]
  await p.goto(`${BASE_URL}/cliente/${token}`, { waitUntil: "networkidle" });
  // Apply light theme so screenshots match the visual-qa audit style
  await p.evaluate(() => {
    localStorage.setItem("tp-theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
  });
  await p.waitForTimeout(800);
  const clienteFile = tag === "mobile" ? "09-cliente-portal-mobile.png" : "10-cliente-portal-desktop.png";
  await p.screenshot({ path: `screenshots/${clienteFile}` });
  console.log(`Saved screenshots/${clienteFile}`);

  // /scheda/[token]
  await p.goto(`${BASE_URL}/scheda/${token}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const schedaFile = tag === "mobile" ? "11-scheda-public-mobile.png" : "12-scheda-public-desktop.png";
  await p.screenshot({ path: `screenshots/${schedaFile}` });
  console.log(`Saved screenshots/${schedaFile}`);

  await c.close();
}

await browser2.close();
console.log("Done.");
