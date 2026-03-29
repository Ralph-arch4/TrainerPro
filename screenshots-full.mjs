import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = process.env.SITE_URL ?? "http://localhost:3000";
mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  // Visual QA bypass cookie — only works on localhost
  storageState: {
    cookies: [{ name: "x-visual-qa", value: "1", domain: "localhost", path: "/" }],
    origins: []
  }
});
const page = await ctx.newPage();

const shot = async (name) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false });
  console.log(`  ✓ ${name}.png`);
};

// ── Public pages ──────────────────────────────────────────────────────────────
await page.goto(BASE_URL, { waitUntil: "networkidle" });
await shot("01-landing");

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await shot("02-login");

await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
await shot("03-register");

// ── Authenticated pages (inject Zustand mock state) ───────────────────────────
// We go to each dashboard page and inject mock data via localStorage
// so we can see what the UI looks like with real content.

const mockState = {
  state: {
    user: {
      id: "mock-user-id",
      name: "Marco Trainer",
      email: "marco@trainerpro.it",
      plan: "personal_coach"
    },
    clients: [
      {
        id: "client-1",
        userId: "mock-user-id",
        name: "Luca Bianchi",
        email: "luca@esempio.com",
        phone: "+39 333 111 2233",
        birthDate: "1993-05-15",
        goal: "massa",
        level: "intermedio",
        status: "attivo",
        monthlyFee: 150,
        startDate: "2024-01-10",
        createdAt: "2024-01-10T10:00:00Z",
        workoutPlans: [
          { id: "wp-1", clientId: "client-1", name: "Push Pull Legs — Volume", daysPerWeek: 5, exercises: "[]", active: true, description: "Scheda per massa muscolare", createdAt: "2024-01-10T10:00:00Z" }
        ],
        phases: [
          { id: "ph-1", clientId: "client-1", name: "Bulk Invernale 2024", type: "bulk", startDate: "2024-01-01", endDate: "2024-04-30", targetCalories: 3400, completed: false, notes: "Incremento calorico graduale" },
          { id: "ph-2", clientId: "client-1", name: "Cut Estivo", type: "cut", startDate: "2024-05-01", endDate: "2024-07-31", targetCalories: 2600, targetWeight: 82, completed: false }
        ],
        dietPlans: [
          { id: "dp-1", clientId: "client-1", name: "Dieta Bulk — 3400 kcal", calories: 3400, protein: 210, carbs: 420, fat: 95, meals: "[]", active: true, createdAt: "2024-01-10T10:00:00Z" }
        ],
        measurements: [
          { id: "m-1", clientId: "client-1", date: "2024-01-10", weight: 78.5, bodyFat: 15.2, chest: 102, waist: 83, arms: 38, legs: 58 },
          { id: "m-2", clientId: "client-1", date: "2024-02-10", weight: 80.2, bodyFat: 14.8, chest: 104, waist: 84, arms: 39, legs: 59 },
          { id: "m-3", clientId: "client-1", date: "2024-03-10", weight: 82.0, bodyFat: 14.5, chest: 106, waist: 85, arms: 40, legs: 60 }
        ],
        notes: [
          { id: "n-1", clientId: "client-1", content: "Ottima progressione sulla panca. Aumentare il volume sulle gambe.", createdAt: "2024-03-01T10:00:00Z", updatedAt: "2024-03-01T10:00:00Z" }
        ]
      },
      {
        id: "client-2",
        userId: "mock-user-id",
        name: "Sara Russo",
        email: "sara@esempio.com",
        phone: "+39 347 222 3344",
        goal: "dimagrimento",
        level: "principiante",
        status: "attivo",
        monthlyFee: 120,
        startDate: "2024-02-01",
        createdAt: "2024-02-01T10:00:00Z",
        workoutPlans: [],
        phases: [
          { id: "ph-3", clientId: "client-2", name: "Fase Dimagrimento Q1", type: "cut", startDate: "2024-02-01", endDate: "2024-05-01", targetCalories: 1600, completed: false }
        ],
        dietPlans: [
          { id: "dp-2", clientId: "client-2", name: "Dieta Ipocalorica — 1600 kcal", calories: 1600, protein: 140, carbs: 160, fat: 55, meals: "[]", active: true, createdAt: "2024-02-01T10:00:00Z" }
        ],
        measurements: [
          { id: "m-4", clientId: "client-2", date: "2024-02-01", weight: 68.0, bodyFat: 28.5, waist: 78 },
          { id: "m-5", clientId: "client-2", date: "2024-03-01", weight: 66.5, bodyFat: 27.0, waist: 76 }
        ],
        notes: []
      },
      {
        id: "client-3",
        userId: "mock-user-id",
        name: "Antonio De Luca",
        email: "antonio@esempio.com",
        goal: "performance",
        level: "avanzato",
        status: "in_pausa",
        monthlyFee: 200,
        startDate: "2023-09-01",
        createdAt: "2023-09-01T10:00:00Z",
        workoutPlans: [],
        phases: [],
        dietPlans: [],
        measurements: [
          { id: "m-6", clientId: "client-3", date: "2024-01-15", weight: 85.0, bodyFat: 11.0 }
        ],
        notes: []
      }
    ],
    activeClientId: null
  },
  version: 0
};

async function injectAndShot(path, filename) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.evaluate((state) => {
    localStorage.setItem("trainerpro-storage", JSON.stringify(state));
  }, mockState);
  await page.reload({ waitUntil: "networkidle" });
  await shot(filename);
}

await injectAndShot("/dashboard", "04-dashboard");
await injectAndShot("/dashboard/clienti", "05-clienti");
await injectAndShot("/dashboard/fasi", "06-fasi");
await injectAndShot("/dashboard/diete", "07-diete");
await injectAndShot("/dashboard/misurazioni", "08-misurazioni");
await injectAndShot("/dashboard/preventivi", "09-preventivi");
await injectAndShot("/dashboard/export", "10-export");

// Client detail page
await page.goto(`${BASE_URL}/dashboard/clienti/client-1`, { waitUntil: "networkidle" });
await page.evaluate((state) => {
  localStorage.setItem("trainerpro-storage", JSON.stringify(state));
}, mockState);
await page.reload({ waitUntil: "networkidle" });
await shot("11-client-detail");

await browser.close();
console.log("\nScreenshots salvati in ./screenshots/");
