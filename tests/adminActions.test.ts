import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isUuid, normalizeStatus, parseAdminAction, planAdminAction } from "../lib/admin-actions.ts";

const NOW = new Date("2026-11-23T12:00:00Z");

test("rejects unknown or malformed actions", () => {
  assert.equal(parseAdminAction(null), null);
  assert.equal(parseAdminAction({ action: "delete_everything" }), null);
  assert.equal(parseAdminAction({ action: "suspend" }), null, "suspend needs a reason");
  assert.equal(parseAdminAction({ action: "ban", reason: "   " }), null, "ban needs a reason");
  assert.equal(parseAdminAction({ action: "extend_trial", days: 0 }), null);
  assert.equal(parseAdminAction({ action: "extend_trial", days: 1000 }), null);
  assert.equal(parseAdminAction({ action: "set_paid_until", date: "31/12/2026" }), null);
  assert.equal(parseAdminAction({ action: "save_note", note: 5 }), null);
});

test("suspend keeps data and only flips the account status", () => {
  const a = parseAdminAction({ action: "suspend", reason: " Pagamento non ricevuto " });
  assert.ok(a);
  const p = planAdminAction(a, "ceo@example.com", NOW);
  assert.deepEqual(p.profile, {
    account_status: "suspended", status_reason: "Pagamento non ricevuto",
    status_changed_at: NOW.toISOString(), status_changed_by: "ceo@example.com",
  });
  assert.equal(p.authBan, undefined, "suspension does not block the login");
});

test("ban blocks the login, unban and reactivate lift it", () => {
  const ban = planAdminAction(parseAdminAction({ action: "ban", reason: "Spam" })!, "ceo@example.com", NOW);
  assert.equal(ban.profile?.account_status, "banned");
  assert.equal(ban.authBan, "876000h");
  for (const action of ["unban", "reactivate"]) {
    const p = planAdminAction(parseAdminAction({ action })!, "ceo@example.com", NOW);
    assert.equal(p.profile?.account_status, "active");
    assert.equal(p.authBan, "none");
  }
});

test("plan, trial and payment date", () => {
  assert.equal(planAdminAction({ action: "set_premium" }, "x", NOW).profile?.plan, "premium");
  assert.equal(planAdminAction({ action: "set_demo" }, "x", NOW).profile?.plan, "free");
  const trial = planAdminAction(parseAdminAction({ action: "extend_trial" })!, "x", NOW);
  assert.equal(trial.profile?.trial_ends_at, "2026-12-07T12:00:00.000Z");
  assert.equal(planAdminAction(parseAdminAction({ action: "set_paid_until", date: "2026-12-31" })!, "x", NOW).profile?.paid_until, "2026-12-31");
  assert.equal(planAdminAction(parseAdminAction({ action: "set_paid_until", date: "" })!, "x", NOW).profile?.paid_until, null);
});

test("notes never touch the profile row", () => {
  const p = planAdminAction(parseAdminAction({ action: "save_note", note: "Paga a fine mese" })!, "x", NOW);
  assert.equal(p.profile, undefined);
  assert.equal(p.note, "Paga a fine mese");
});

test("helpers", () => {
  assert.equal(isUuid("1b4e28ba-2fa1-11d2-883f-0016d3cca427"), true);
  assert.equal(isUuid("1; drop table"), false);
  assert.equal(normalizeStatus("banned"), "banned");
  assert.equal(normalizeStatus(undefined), "active");
});

test("migration 028: browser cannot change moderation fields, gate includes account status", () => {
  const sql = readFileSync(new URL("../supabase/migrations/028_admin_moderation.sql", import.meta.url), "utf8");
  assert.match(sql, /new\.account_status\s+:= old\.account_status/);
  assert.match(sql, /coalesce\(p\.account_status, 'active'\) = 'active'/);
  assert.match(sql, /alter table public\.admin_audit_log enable row level security/);
  assert.match(sql, /alter table public\.admin_trainer_notes enable row level security/);
});

test("migration 028: admin role lives in user_roles, no browser writes", () => {
  const sql = readFileSync(new URL("../supabase/migrations/028_admin_moderation.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists public\.user_roles/);
  assert.match(sql, /alter table public\.user_roles enable row level security/);
  assert.doesNotMatch(sql, /on public\.user_roles for (insert|update|delete|all)/);
  assert.match(sql, /function public\.is_platform_admin\(\)[\s\S]*user_roles/);
  const guard = readFileSync(new URL("../lib/supabase/admin.ts", import.meta.url), "utf8");
  assert.match(guard, /from\("user_roles"\)/);
});

test("every admin API route goes through the server guard", () => {
  for (const f of ["me/route.ts", "trainers/route.ts", "trainers/[id]/route.ts", "audit/route.ts", "leads/route.ts", "premium/route.ts"]) {
    const src = readFileSync(new URL(`../app/api/admin/${f}`, import.meta.url), "utf8");
    assert.match(src, /adminGuard/, f);
    if (/export async function POST/.test(src)) assert.match(src, /isSameOrigin/, f);
  }
});
