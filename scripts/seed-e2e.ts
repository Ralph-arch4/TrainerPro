/**
 * TrainerPro — E2E Seed Script
 * Creates 5 trainer accounts (Guest1–Guest5), each with:
 *   - 1 client
 *   - 1 workout plan with exercises and custom day labels
 *   - 1 diet plan
 *   - Exercise logs (simulating client edits via portal)
 *
 * Usage:
 *   npx tsx scripts/seed-e2e.ts
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - npx tsx (or ts-node) installed
 */

import { createClient } from "@supabase/supabase-js";
// Load .env.local manually (avoid dotenv dependency)
import { readFileSync } from "fs";
try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#")) process.env[k.trim()] = v.join("=").trim();
  }
} catch { /* file not found — rely on shell env */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function uid() { return crypto.randomUUID(); }
function genToken() { return uid().replace(/-/g, "") + uid().replace(/-/g, ""); }

const GUESTS = [
  { n: 1, email: "guest1@trainerpro.dev" },
  { n: 2, email: "guest2@trainerpro.dev" },
  { n: 3, email: "guest3@trainerpro.dev" },
  { n: 4, email: "guest4@trainerpro.dev" },
  { n: 5, email: "guest5@trainerpro.dev" },
];

const EXERCISES_TEMPLATE = [
  { name: "Squat", muscleGroup: "Gambe", sets: 4, targetReps: "8-10", day: 1 },
  { name: "Leg Press", muscleGroup: "Gambe", sets: 3, targetReps: "12", day: 1 },
  { name: "Panca Piana", muscleGroup: "Petto", sets: 4, targetReps: "8", day: 2 },
  { name: "Dip alle parallele", muscleGroup: "Tricipiti", sets: 3, targetReps: "10-12", day: 2 },
  { name: "Trazioni", muscleGroup: "Schiena", sets: 4, targetReps: "6-8", day: 3 },
  { name: "Rematore con bilanciere", muscleGroup: "Schiena", sets: 3, targetReps: "10", day: 3 },
];

async function seed() {
  console.log("🌱 Seeding 5 trainer accounts...\n");

  for (const { n, email } of GUESTS) {
    console.log(`─── Guest${n} (${email}) ───`);
    const password = "Ciao04";

    // 1. Create auth user (upsert-style: delete if exists first)
    const { data: existing } = await admin.auth.admin.listUsers();
    const existingUser = existing?.users.find((u) => u.email === email);
    if (existingUser) {
      await admin.auth.admin.deleteUser(existingUser.id);
      console.log(`  ↺ Deleted existing user`);
    }

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Guest${n}`, plan: "personal_coach" },
    });
    if (authErr || !authData.user) {
      console.error(`  ✗ Auth error:`, authErr?.message);
      continue;
    }
    const userId = authData.user.id;
    console.log(`  ✓ Auth user created: ${userId}`);

    // 2. Upsert profile
    await admin.from("profiles").upsert({
      id: userId,
      full_name: `Guest${n}`,
      plan: "personal_coach",
    });

    // 3. Create client
    const clientId = uid();
    const { error: clientErr } = await admin.from("clients").insert({
      id: clientId,
      user_id: userId,
      name: `Cliente Demo ${n}`,
      email: `clientedemo${n}@example.com`,
      goal: ["dimagrimento", "massa", "tonificazione", "performance"][n % 4],
      level: ["principiante", "intermedio", "avanzato"][n % 3],
      status: "attivo",
      start_date: new Date().toISOString().split("T")[0],
    });
    if (clientErr) { console.error(`  ✗ Client error:`, clientErr.message); continue; }
    console.log(`  ✓ Client: Cliente Demo ${n}`);

    // 4. Create workout plan
    const planId = uid();
    const shareToken = genToken();
    const dayLabels = { 1: "Leg Day", 2: "Push Day", 3: "Pull Day" };
    const exercises = EXERCISES_TEMPLATE.map((e, i) => ({ ...e, id: uid(), order: i }));

    const { error: planErr } = await admin.from("workout_plans").insert({
      id: planId,
      user_id: userId,
      client_id: clientId,
      name: `Scheda Full Body — Guest${n}`,
      description: `Piano di allenamento per Cliente Demo ${n}`,
      days_per_week: 3,
      total_weeks: 12,
      exercises: JSON.stringify(exercises),
      active: true,
      share_token: shareToken,
      day_labels: dayLabels,
    });
    if (planErr) { console.error(`  ✗ Plan error:`, planErr.message); continue; }
    console.log(`  ✓ Workout plan: ${planId} | token: ${shareToken.slice(0, 16)}…`);

    // 5. Create diet plan
    const { error: dietErr } = await admin.from("diet_plans").insert({
      id: uid(),
      user_id: userId,
      client_id: clientId,
      name: `Piano Alimentare — Guest${n}`,
      calories: 2200 + n * 100,
      protein: 160 + n * 5,
      carbs: 220 + n * 10,
      fat: 70 + n * 2,
      meals: "Colazione, Pranzo, Cena, Spuntino pre-workout",
      notes: `Piano personalizzato per obiettivo ${["dimagrimento", "massa", "tonificazione", "performance"][n % 4]}`,
      active: true,
    });
    if (dietErr) { console.error(`  ✗ Diet error:`, dietErr.message); continue; }
    console.log(`  ✓ Diet plan created`);

    // 6. Simulate client exercise logs (weeks 1-3 for each exercise)
    const logRows = [];
    for (const ex of exercises) {
      for (let week = 1; week <= 3; week++) {
        logRows.push({
          workout_plan_id: planId,
          exercise_id: ex.id,
          week_number: week,
          weight: 60 + n * 5 + week * 2.5,
          reps: `${10 - week + n}/${10 - week + n - 1}/${10 - week + n - 1}`,
          logged_at: new Date().toISOString(),
        });
      }
    }
    const { error: logErr } = await admin.from("exercise_logs").insert(logRows);
    if (logErr) { console.error(`  ✗ Logs error:`, logErr.message); }
    else console.log(`  ✓ ${logRows.length} exercise logs seeded (client portal simulation)`);

    console.log(`  🔗 Portal URL: ${SUPABASE_URL.replace("supabase.co", "vercel.app")}/cliente/${shareToken}`);
    console.log();
  }

  console.log("✅ Seed complete.");
  console.log("\n🔑 Login credentials:");
  GUESTS.forEach(({ n, email }) => {
    console.log(`   Guest${n}: ${email} / Ciao04`);
  });
}

seed().catch(console.error);
