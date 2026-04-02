import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL  = "https://trainer-pro-phi.vercel.app";
const EMAIL     = process.env.TEST_EMAIL    ?? "guest1@e2e.trainerpro.test";
const PASSWORD  = process.env.TEST_PASSWORD ?? "Ciao04";

mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page    = await ctx.newPage();

const shot = async (name) => {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `screenshots/${name}`, fullPage: false });
  console.log(`  ✓ ${name}`);
};

// ── Public pages ────────────────────────────────────────────────────────────
await page.goto(BASE_URL, { waitUntil: "networkidle" });
await shot("01-landing.png");

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await shot("02-login.png");

await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
await shot("03-register.png");

// ── Auth pages ───────────────────────────────────────────────────────────────
await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.fill("input[type=email]", EMAIL);
await page.fill("input[type=password]", PASSWORD);
await page.click("button[type=submit]");
await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 12000 }).catch(() => {});
await page.waitForTimeout(1500); // let Zustand hydrate
await shot("04-dashboard.png");

await page.goto(`${BASE_URL}/dashboard/clienti`, { waitUntil: "networkidle" });
await shot("05-clienti.png");

await page.goto(`${BASE_URL}/dashboard/fasi`, { waitUntil: "networkidle" });
await shot("06-fasi.png");

await page.goto(`${BASE_URL}/dashboard/diete`, { waitUntil: "networkidle" });
await shot("07-diete.png");

await page.goto(`${BASE_URL}/dashboard/intake`, { waitUntil: "networkidle" });
await shot("08-intake.png");

await browser.close();
console.log("\nScreenshots salvati in ./screenshots/");
