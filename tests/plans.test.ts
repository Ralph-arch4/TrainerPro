import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkLimit, isPremium, planLabel, clientLimit, isDemoLimitError, isSuspendedError, FREE_CLIENT_LIMIT } from "../lib/plan-limits.ts";

test("demo plan: exactly one client", () => {
  assert.equal(FREE_CLIENT_LIMIT, 1);
  assert.equal(checkLimit("free", "clients", 0).allowed, true);
  const blocked = checkLimit("free", "clients", 1);
  assert.equal(blocked.allowed, false);
  assert.match(blocked.message, /un solo cliente/);
  assert.equal(checkLimit("free", "clients", 12).allowed, false);
});

test("unknown or missing plan is treated as demo", () => {
  assert.equal(isPremium(undefined), false);
  assert.equal(isPremium(null), false);
  assert.equal(isPremium(""), false);
  assert.equal(checkLimit(undefined, "clients", 1).allowed, false);
});

test("premium (and legacy paid tiers): unlimited clients", () => {
  for (const plan of ["premium", "personal_coach", "fitness_master"]) {
    assert.equal(isPremium(plan), true);
    assert.equal(checkLimit(plan, "clients", 500).allowed, true);
    assert.equal(clientLimit(plan), Infinity);
    assert.equal(planLabel(plan), "Premium");
  }
  assert.equal(planLabel("free"), "Prova gratuita");
});

test("database limit error is recognised", () => {
  assert.equal(isDemoLimitError({ message: "DEMO_CLIENT_LIMIT", code: "P0001" }), true);
  assert.equal(isDemoLimitError(new Error("DEMO_CLIENT_LIMIT")), true);
  assert.equal(isDemoLimitError(new Error("network")), false);
  assert.equal(isDemoLimitError(null), false);
});

test("migration 026 keeps the guarantees the app relies on", () => {
  const sql = readFileSync("supabase/migrations/026_plans_premium.sql", "utf-8");
  assert.match(sql, /before insert on public\.clients/);               // server-side demo limit
  assert.match(sql, /before update on public\.profiles/);              // plan cannot be self-assigned
  assert.doesNotMatch(sql, /raw_user_meta_data->>'plan'/);              // sign-up metadata never sets the plan
  assert.doesNotMatch(sql, /\b(delete\s+from|truncate|drop\s+table)\b/i); // existing data is left alone
});

test("the browser never writes the plan", () => {
  for (const file of ["lib/db.ts", "components/SupabaseDataLoader.tsx", "app/register/page.tsx"]) {
    const src = readFileSync(file, "utf-8");
    assert.doesNotMatch(src, /user_metadata\?\.plan\b/, file);
    assert.doesNotMatch(src, /update\(\{\s*plan\b/, file);
  }
});

test("migration 027: trial, suspension of client links, no data loss", () => {
  const sql = readFileSync("supabase/migrations/027_trial_and_suspension.sql", "utf-8");
  assert.match(sql, /trial_ends_at\s+timestamptz/);
  assert.match(sql, /now\(\) \+ interval '14 days'/);                          // new accounts: 14-day trial
  assert.match(sql, /new\.trial_ends_at\s+:= old\.trial_ends_at/);            // browser cannot extend it
  // both client-link RPCs check the trainer before returning or writing anything
  for (const fn of ["get_portal_data", "upsert_exercise_log"]) {
    const body = sql.slice(sql.indexOf(`function public.${fn}`));
    assert.match(body.slice(0, body.indexOf("$$;")), /account_is_active\(v_(plan\.)?user_id\)/, fn);
  }
  assert.match(sql, /enable row level security/);                              // sales_leads not public
  assert.doesNotMatch(sql, /\b(delete\s+from|truncate|drop\s+table)\b/i);
});

test("suspension error is recognised", () => {
  assert.equal(isSuspendedError(new Error("ACCOUNT_SUSPENDED")), true);
  assert.equal(isSuspendedError(new Error("DEMO_CLIENT_LIMIT")), false);
});

test("migration 027 leaves existing accounts alone (no backfill of trial_ends_at)", () => {
  const sql = readFileSync("supabase/migrations/027_trial_and_suspension.sql", "utf-8");
  assert.doesNotMatch(sql.replace(/^\s*--.*$/gm, ""), /update\s+public\.profiles/i);
  assert.match(sql, /p\.trial_ends_at is null/); // NULL = active forever
});
