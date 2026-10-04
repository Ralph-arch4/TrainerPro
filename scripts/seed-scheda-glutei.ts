/**
 * TrainerPro — Seed "Scheda Glutei & Cosce" (4 days, hypertrophy, mild surplus)
 * Target: female, 20y, 156 cm, 50 kg. Goal: glute/thigh mass, no fat loss.
 *
 * Creates for an existing trainer account:
 *   - 1 client
 *   - 1 workout plan (4 days, 8 weeks) with day labels
 *   - 1 diet plan (2050 kcal, P95/C265/F65) generated via generateNutritionPlan
 * Prints the shared plan link and the client portal link.
 *
 * Usage:
 *   npx tsx scripts/seed-scheda-glutei.ts --trainer-email you@example.com [--client-name "Giulia"] [--dry-run]
 *
 * Requirements (not needed with --dry-run):
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { generateNutritionPlan } from "../lib/nutritionGenerator";

try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#")) process.env[k.trim()] = v.join("=").trim();
  }
} catch { /* file not found — rely on shell env */ }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trainer-pro-phi.vercel.app";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const DRY_RUN = process.argv.includes("--dry-run");
const TRAINER_EMAIL = arg("trainer-email");
const CLIENT_NAME = arg("client-name") ?? "Cliente Glutei & Cosce";

function uid() { return crypto.randomUUID(); }
function genToken() { return uid().replace(/-/g, "") + uid().replace(/-/g, ""); }

const DAY_LABELS = {
  1: "Glutei (dominante anca)",
  2: "Upper (petto e postura)",
  3: "Cosce (quadricipiti e femorali)",
  4: "Glutei + Upper leggero",
};

type Row = { name: string; muscleGroup: string; sets: number; targetReps: string; restSeconds: number; day: number };

const EXERCISES: Row[] = [
  // Day 1 — Glutei
  { day: 1, name: "Hip Thrust con bilanciere", muscleGroup: "Glutei", sets: 4, targetReps: "8-10", restSeconds: 120 },
  { day: 1, name: "Stacco rumeno con manubri", muscleGroup: "Femorali", sets: 3, targetReps: "10", restSeconds: 120 },
  { day: 1, name: "Affondi bulgari (busto inclinato)", muscleGroup: "Glutei", sets: 3, targetReps: "10 per gamba", restSeconds: 90 },
  { day: 1, name: "Abduzioni alla macchina", muscleGroup: "Glutei", sets: 3, targetReps: "15-20", restSeconds: 60 },
  { day: 1, name: "Kickback al cavo", muscleGroup: "Glutei", sets: 3, targetReps: "12-15 per gamba", restSeconds: 60 },
  // Day 2 — Upper
  { day: 2, name: "Panca inclinata con manubri (30°)", muscleGroup: "Petto", sets: 4, targetReps: "8-10", restSeconds: 120 },
  { day: 2, name: "Lat machine presa larga", muscleGroup: "Schiena", sets: 3, targetReps: "10", restSeconds: 90 },
  { day: 2, name: "Croci ai cavi dal basso verso l'alto", muscleGroup: "Petto", sets: 3, targetReps: "12-15", restSeconds: 60 },
  { day: 2, name: "Pulley basso", muscleGroup: "Schiena", sets: 3, targetReps: "10-12", restSeconds: 90 },
  { day: 2, name: "Push-up (anche su ginocchia)", muscleGroup: "Petto", sets: 3, targetReps: "max", restSeconds: 60 },
  { day: 2, name: "Face pull", muscleGroup: "Spalle", sets: 3, targetReps: "15", restSeconds: 60 },
  // Day 3 — Cosce
  { day: 3, name: "Squat con bilanciere", muscleGroup: "Quadricipiti", sets: 4, targetReps: "6-8", restSeconds: 150 },
  { day: 3, name: "Leg press piedi alti e larghi", muscleGroup: "Glutei", sets: 3, targetReps: "10-12", restSeconds: 120 },
  { day: 3, name: "Leg curl sdraiato", muscleGroup: "Femorali", sets: 3, targetReps: "10-12", restSeconds: 90 },
  { day: 3, name: "Affondi in camminata", muscleGroup: "Quadricipiti", sets: 3, targetReps: "12 per gamba", restSeconds: 90 },
  { day: 3, name: "Leg extension", muscleGroup: "Quadricipiti", sets: 3, targetReps: "12-15", restSeconds: 60 },
  { day: 3, name: "Calf raise", muscleGroup: "Polpacci", sets: 3, targetReps: "15", restSeconds: 60 },
  // Day 4 — Glutei + Upper leggero
  { day: 4, name: "Glute bridge con bilanciere (fermo 2\" in alto)", muscleGroup: "Glutei", sets: 4, targetReps: "12", restSeconds: 90 },
  { day: 4, name: "Stacco sumo", muscleGroup: "Glutei", sets: 3, targetReps: "8-10", restSeconds: 120 },
  { day: 4, name: "Step-up su panca alta", muscleGroup: "Glutei", sets: 3, targetReps: "10 per gamba", restSeconds: 90 },
  { day: 4, name: "Abduzioni al cavo / elastico", muscleGroup: "Glutei", sets: 3, targetReps: "20", restSeconds: 45 },
  { day: 4, name: "Chest press inclinata alla macchina", muscleGroup: "Petto", sets: 3, targetReps: "10-12", restSeconds: 90 },
  { day: 4, name: "Rematore con manubrio", muscleGroup: "Schiena", sets: 3, targetReps: "10 per braccio", restSeconds: 90 },
];

const MACROS = { calories: 2050, caloriesMax: 2150, protein: 95, proteinMax: 100, carbs: 265, carbsMax: 280, fat: 65, fatMax: 70 };

async function seed() {
  const exercises = EXERCISES.map((e, i) => ({ ...e, id: uid(), order: i }));
  const { meals, totals } = generateNutritionPlan({
    protein: MACROS.protein, carbs: MACROS.carbs, fat: MACROS.fat, mealsCount: 5, preference: "onnivora",
  });

  if (DRY_RUN) {
    console.log(`Exercises: ${exercises.length} over ${Object.keys(DAY_LABELS).length} days`);
    console.log(`Diet totals:`, totals);
    for (const m of meals) console.log(`  ${m.name}: ${m.items.map((it) => `${it.name} ${it.grams}g`).join(", ")}`);
    return;
  }

  if (!TRAINER_EMAIL) { console.error("Missing --trainer-email"); process.exit(1); }
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // Find trainer (paginate listUsers)
  let userId: string | undefined;
  for (let page = 1; !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === TRAINER_EMAIL.toLowerCase())?.id;
    if (data.users.length < 1000) break;
  }
  if (!userId) { console.error(`Trainer not found: ${TRAINER_EMAIL}`); process.exit(1); }

  const clientId = uid();
  const today = new Date().toISOString().split("T")[0];
  const { error: clientErr } = await admin.from("clients").insert({
    id: clientId,
    user_id: userId,
    name: CLIENT_NAME,
    goal: "massa",
    level: "principiante",
    status: "attivo",
    start_date: today,
  });
  if (clientErr) throw clientErr;

  const shareToken = genToken();
  const { error: planErr } = await admin.from("workout_plans").insert({
    id: uid(),
    user_id: userId,
    client_id: clientId,
    name: "Scheda Glutei & Cosce — Ipertrofia",
    description: "4 giorni/settimana. Lasciare 1-2 ripetizioni di riserva. Chiuse tutte le serie al limite alto: +2,5 kg (multiarticolari) / +1 kg (manubri). Dopo 8 settimane: 1 settimana di scarico (-40% volume). Cardio max 2 camminate in salita da 20-30'.",
    days_per_week: 4,
    total_weeks: 8,
    exercises,
    active: true,
    share_token: shareToken,
    day_labels: DAY_LABELS,
  });
  if (planErr) throw planErr;

  const { error: dietErr } = await admin.from("diet_plans").insert({
    id: uid(),
    user_id: userId,
    client_id: clientId,
    name: "Surplus leggero — Massa glutei",
    calories: MACROS.calories,
    calories_max: MACROS.caloriesMax,
    protein: MACROS.protein,
    protein_max: MACROS.proteinMax,
    carbs: MACROS.carbs,
    carbs_max: MACROS.carbsMax,
    fat: MACROS.fat,
    fat_max: MACROS.fatMax,
    meals: JSON.stringify(meals),
    notes: "Obiettivo +0,25-0,5 kg/mese. Peso fermo 3 settimane: +100 kcal. Sale troppo: -100 kcal. Mai in deficit per preservare la massa grassa del seno.",
    active: true,
  });
  if (dietErr) throw dietErr;

  console.log(`Client: ${CLIENT_NAME} (${clientId})`);
  console.log(`Scheda:  ${APP_URL}/scheda/${shareToken}`);
  console.log(`Portale: ${APP_URL}/cliente/${shareToken}`);
}

seed().catch((e) => { console.error(e); process.exit(1); });
