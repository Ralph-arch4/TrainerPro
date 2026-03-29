import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL  = process.env.SITE_URL      ?? "http://localhost:3000";
const EMAIL     = process.env.TEST_EMAIL    ?? "";
const PASSWORD  = process.env.TEST_PASSWORD ?? "";

mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page    = await ctx.newPage();

const shot = async (name) => {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false });
  console.log(`  ✓ ${name}.png`);
};

await page.goto(BASE_URL);
await shot("01-landing");

await page.goto(`${BASE_URL}/login`);
await shot("02-login");

if (EMAIL && PASSWORD) {
  await page.fill("input[type=email]", EMAIL);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard**");
  await shot("03-dashboard");

  await page.goto(`${BASE_URL}/dashboard/clienti`);
  await shot("04-clienti");

  await page.goto(`${BASE_URL}/dashboard/fasi`);
  await shot("05-fasi");
}

await browser.close();
console.log("\nScreenshots salvati in ./screenshots/");
