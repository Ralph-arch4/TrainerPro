/**
 * End-to-end QA: trainer creates client + scheda → visits client share link.
 * Captures screenshots at every step to surface UX/functional bugs.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE  = "https://trainer-pro-phi.vercel.app";
const EMAIL = "renatominiomedia@gmail.com";
const PASS  = "Ciao04";
const DIR   = "screenshots/flow";

mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });

// ── helpers ───────────────────────────────────────────────────────────────────
let n = 0;
async function shot(page, label) {
  n++;
  const file = `${DIR}/${String(n).padStart(2,"0")}-${label}.png`;
  await page.waitForTimeout(1000);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${String(n).padStart(2,"0")}-${label}.png`);
}
async function shotFull(page, label) {
  n++;
  const file = `${DIR}/${String(n).padStart(2,"0")}-${label}.png`;
  await page.waitForTimeout(1000);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${String(n).padStart(2,"0")}-${label}-FULL.png`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — LOGIN
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 1: Login ═══");
const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("input[type=email]", EMAIL);
await page.fill("input[type=password]", PASS);
await page.click("button[type=submit]");
await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {});
await shot(page, "dashboard-after-login");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — CREATE CLIENT
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 2: Crea cliente ═══");
await page.goto(`${BASE}/dashboard/clienti`, { waitUntil: "networkidle" });
await shot(page, "clienti-empty");

// Open modal
await page.getByRole("button", { name: /Nuovo cliente|Aggiungi cliente/ }).first().click();
await page.waitForTimeout(500);
await shot(page, "modal-open");

// Fill name — target by placeholder
await page.locator('input[placeholder="Mario Rossi"]').fill("Cliente Test QA");
await page.waitForTimeout(300);
await shot(page, "modal-name-filled");

// Scroll modal to bottom so the button is in view, then click with force
await page.locator(".glass-dark.rounded-2xl").evaluate(el => el.scrollTop = el.scrollHeight);
await page.waitForTimeout(300);
// Last button = the one inside the modal (the top-right one is the other match)
await page.getByRole("button", { name: "Aggiungi cliente" }).last().click({ force: true });
await page.waitForTimeout(2500);
await shot(page, "after-create-client");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — OPEN CLIENT DETAIL → SCHEDE TAB
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 3: Client detail → Schede ═══");
// Click the client card
await page.locator("text=Cliente Test QA").first().click();
await page.waitForURL(/clienti\/[^/]+$/, { timeout: 8000 }).catch(() => {});
await shot(page, "client-detail-overview");

// Click Schede tab
await page.getByRole("button", { name: /Schede/ }).click();
await page.waitForTimeout(600);
await shot(page, "schede-tab-empty");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — CREATE WORKOUT PLAN
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 4: Crea scheda ═══");
await page.getByRole("button", { name: /Nuova scheda|Crea la prima scheda/ }).first().click();
await page.waitForTimeout(600);
await shot(page, "modal-nuova-scheda");

// Fill plan name
const planNameInput = page.locator('input[placeholder*="Push"], input[placeholder*="scheda"], input[placeholder*="Piano"]').first();
await planNameInput.fill("Full Body 3x – Test QA");
await page.waitForTimeout(300);

// Submit (scroll + force click same pattern)
await page.locator(".glass-dark.rounded-2xl").last().evaluate(el => el.scrollTop = el.scrollHeight);
await page.getByRole("button", { name: /Salva|Crea/ }).last().click({ force: true });
await page.waitForTimeout(2500);
await shot(page, "after-create-scheda");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — OPEN SCHEDA EDITOR
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 5: Apri editor scheda ═══");
const openBtn = page.getByRole("link", { name: /Apri scheda/ }).first();
const openBtnAlt = page.locator("a[href*='schede']").first();
const btn = (await openBtn.isVisible().catch(() => false)) ? openBtn : openBtnAlt;
await btn.click();
await page.waitForURL(/schede\//, { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1000);
await shot(page, "scheda-editor-loaded");
await shotFull(page, "scheda-editor-full");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 — ADD EXERCISE
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 6: Aggiungi esercizio ═══");
const addExBtn = page.getByRole("button", { name: /Aggiungi esercizio|Esercizio/ }).first();
if (await addExBtn.isVisible().catch(() => false)) {
  await addExBtn.click();
  await page.waitForTimeout(600);
  await shot(page, "modal-aggiungi-esercizio");

  // Fill exercise name
  const exInput = page.locator('input[placeholder*="Squat"], input[placeholder*="esercizio"], input[placeholder*="Esercizio"]').first();
  await exInput.fill("Squat");
  await page.waitForTimeout(200);

  // Sets
  const setsInput = page.locator('input[placeholder="3"], input[name="sets"]').first();
  if (await setsInput.isVisible().catch(() => false)) await setsInput.fill("4");

  // Reps
  const repsInput = page.locator('input[placeholder*="8-10"], input[name="reps"], input[placeholder*="Rip"]').first();
  if (await repsInput.isVisible().catch(() => false)) await repsInput.fill("10-12");

  await shot(page, "modal-exercise-filled");
  await page.getByRole("button", { name: /Aggiungi|Salva/ }).last().click({ force: true });
  await page.waitForTimeout(1500);
  await shot(page, "after-add-exercise");
  await shotFull(page, "scheda-with-exercise-full");
} else {
  console.log("  ⚠️  No 'Aggiungi esercizio' button found");
  await shotFull(page, "scheda-editor-no-add-btn");
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7 — GET SHARE LINK
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n═══ PHASE 7: Copia link cliente ═══");
let shareUrl = null;

// Look for "Copia link" button
const copyLinkBtn = page.getByRole("button", { name: /Copia link|Copiato/ }).first();
if (await copyLinkBtn.isVisible().catch(() => false)) {
  // Read the share URL from the page's JS context
  shareUrl = await page.evaluate(() => {
    const el = document.querySelector('input[readonly]');
    return el ? el.value : null;
  });

  // Also try to get it from the button's data or the DOM
  if (!shareUrl) {
    shareUrl = await page.evaluate(() => {
      // Find any element whose text or href contains /scheda/
      const links = Array.from(document.querySelectorAll('a[href*="/scheda/"]'));
      if (links.length) return links[0].href;
      // Try innerText of spans/divs containing /scheda/
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        if (el.children.length === 0 && el.textContent?.includes('/scheda/')) {
          return el.textContent?.trim() ?? null;
        }
      }
      return null;
    });
  }
  await shot(page, "copy-link-visible");
} else {
  console.log("  ⚠️  No 'Copia link' button — trying to extract from DOM");
}

// Fallback: extract from page JS context (WorkoutSpreadsheet builds it at runtime)
if (!shareUrl) {
  shareUrl = await page.evaluate((base) => {
    const all = Array.from(document.querySelectorAll('[class*="share"], [class*="link"], input'));
    for (const el of all) {
      const val = el.value || el.textContent || "";
      if (val.includes("/scheda/")) return val.trim();
    }
    return null;
  }, BASE);
}

if (shareUrl && !shareUrl.startsWith("http")) {
  shareUrl = BASE + shareUrl;
}

console.log(shareUrl ? `  🔗 Share URL: ${shareUrl}` : "  ❌ Could not find share URL");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 8 — VISIT AS CLIENT (mobile + desktop)
// ─────────────────────────────────────────────────────────────────────────────
if (shareUrl) {
  console.log("\n═══ PHASE 8: Vista cliente ═══");

  // ── Desktop ──
  const deskCtx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const deskPage = await deskCtx.newPage();
  await deskPage.goto(shareUrl, { waitUntil: "networkidle" });
  await deskPage.waitForTimeout(2000);
  n++;
  await deskPage.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-client-desktop.png`, fullPage: true });
  console.log(`  📸 client-desktop-FULL`);

  // Try to click a spreadsheet cell
  const cell = deskPage.locator("table td").nth(2);
  if (await cell.isVisible().catch(() => false)) {
    await cell.click();
    await deskPage.waitForTimeout(600);
    n++;
    await deskPage.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-client-cell-clicked.png` });
    console.log(`  📸 client-cell-clicked`);
    // Type some data
    await deskPage.keyboard.type("80");
    await deskPage.waitForTimeout(500);
    n++;
    await deskPage.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-client-typed-weight.png` });
    console.log(`  📸 client-typed-weight`);
  } else {
    console.log("  ⚠️  No spreadsheet cells visible");
    n++;
    await deskPage.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-client-no-cells.png`, fullPage: true });
    console.log(`  📸 client-no-cells`);
  }

  // ── Mobile ──
  const mobCtx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobPage = await mobCtx.newPage();
  await mobPage.goto(shareUrl, { waitUntil: "networkidle" });
  await mobPage.waitForTimeout(2000);
  n++;
  await mobPage.screenshot({ path: `${DIR}/${String(n).padStart(2,"0")}-client-mobile.png`, fullPage: true });
  console.log(`  📸 client-mobile-FULL`);

  await deskCtx.close();
  await mobCtx.close();
} else {
  console.log("\n  ❌ Skipping client view — no share URL");
}

await browser.close();
console.log(`\n✅ Done. Screenshots → ./${DIR}/`);
