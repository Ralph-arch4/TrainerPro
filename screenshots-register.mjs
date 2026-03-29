import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = "http://localhost:3000";
mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Capture ALL console messages and network failures
const logs = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
page.on("requestfailed", (req) => logs.push(`[network-fail] ${req.method()} ${req.url()} → ${req.failure()?.errorText}`));
page.on("response", async (res) => {
  if (res.url().includes("supabase") && res.status() >= 400) {
    logs.push(`[supabase-error] ${res.status()} ${res.url()}`);
    try { logs.push(`[supabase-body] ${await res.text()}`); } catch {}
  }
});

await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });

// Fill and submit
await page.fill("input[type=text]", "Marco Trainer");
await page.fill("input[type=email]", "test@trainerpro.it");
await page.fill("input[type=password]", "password123");
await page.click("button[type=submit]");

// Wait up to 10 seconds
await page.waitForTimeout(10000);
await page.screenshot({ path: "screenshots/reg-result.png", fullPage: false });
console.log("  ✓ reg-result.png");
console.log("📍 Final URL:", page.url());
console.log("\n📋 Console/Network log:");
if (logs.length === 0) console.log("  (nessun log)");
logs.forEach((l) => console.log(" ", l));

await browser.close();
