import { NextRequest, NextResponse } from "next/server";
import { adminGuard, auditLog, isSameOrigin } from "@/lib/supabase/admin";
import { isUuid, normalizeStatus, parseAdminAction, planAdminAction } from "@/lib/admin-actions";

type Ctx = { params: Promise<{ id: string }> };

const DAY = 86_400_000;

// Trainer detail for the CEO admin panel: account, subscription, clients,
// activity and the admin actions already taken on this account.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const g = await adminGuard();
  if (g.error) return g.error;
  const { admin } = g;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const [{ data: profile }, authRes, { data: clients }, { data: plans }, { data: note }, { data: audit }, { data: feedback }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin.auth.admin.getUserById(id),
    admin.from("clients").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(2000),
    admin.from("workout_plans").select("id, client_id, name, active, created_at").eq("user_id", id).limit(5000),
    admin.from("admin_trainer_notes").select("note, updated_at, updated_by").eq("user_id", id).maybeSingle(),
    admin.from("admin_audit_log").select("*").eq("target_user_id", id).order("created_at", { ascending: false }).limit(100),
    admin.from("platform_feedback").select("id, title, category, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  const authUser = authRes.data?.user;
  if (!profile && !authUser) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Client activity = workout logs saved from the client link (or by the trainer).
  const planIds = (plans ?? []).map((p) => p.id as string);
  const planToClient = new Map((plans ?? []).map((p) => [p.id as string, p.client_id as string]));
  const lastByClient = new Map<string, string>();
  let logs30 = 0;
  let lastLogAt: string | null = null;
  const since = Date.now() - 30 * DAY;
  for (let i = 0; i < planIds.length; i += 200) {
    const { data: logs } = await admin.from("exercise_logs").select("workout_plan_id, logged_at")
      .in("workout_plan_id", planIds.slice(i, i + 200)).order("logged_at", { ascending: false }).limit(5000);
    for (const l of logs ?? []) {
      const at = l.logged_at as string;
      if (!at) continue;
      if (Date.parse(at) >= since) logs30++;
      if (!lastLogAt || at > lastLogAt) lastLogAt = at;
      const cid = planToClient.get(l.workout_plan_id as string);
      if (cid && (!lastByClient.has(cid) || at > lastByClient.get(cid)!)) lastByClient.set(cid, at);
    }
  }
  const plansByClient = new Map<string, number>();
  for (const p of plans ?? []) plansByClient.set(p.client_id as string, (plansByClient.get(p.client_id as string) ?? 0) + 1);

  return NextResponse.json({
    trainer: {
      id,
      name: (profile?.full_name as string | null) ?? (authUser?.user_metadata?.full_name as string | undefined) ?? "",
      email: authUser?.email ?? "",
      phone: authUser?.phone || null,
      createdAt: authUser?.created_at ?? (profile?.created_at as string | null) ?? null,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
      emailConfirmed: Boolean(authUser?.email_confirmed_at),
      bannedUntil: (authUser as { banned_until?: string | null } | undefined)?.banned_until ?? null,
      plan: (profile?.plan as string) ?? "free",
      premiumStatus: (profile?.premium_status as string) ?? "none",
      premiumRequestedAt: (profile?.premium_requested_at as string | null) ?? null,
      premiumDecidedAt: (profile?.premium_decided_at as string | null) ?? null,
      premiumDecidedBy: (profile?.premium_decided_by as string | null) ?? null,
      trialEndsAt: (profile?.trial_ends_at as string | null) ?? null,
      accountStatus: normalizeStatus(profile?.account_status),
      statusReason: (profile?.status_reason as string | null) ?? null,
      statusChangedAt: (profile?.status_changed_at as string | null) ?? null,
      statusChangedBy: (profile?.status_changed_by as string | null) ?? null,
      paidUntil: (profile?.paid_until as string | null) ?? null,
      migrationsMissing: profile ? !("account_status" in profile) : false,
    },
    clients: (clients ?? []).map((c) => ({
      id: c.id as string,
      name: (c.name as string) ?? "",
      email: (c.email as string | null) ?? null,
      phone: (c.phone as string | null) ?? null,
      status: (c.status as string | null) ?? null,
      goal: (c.goal as string | null) ?? null,
      monthlyFee: (c.monthly_fee as number | null) ?? null,
      startDate: (c.start_date as string | null) ?? null,
      createdAt: (c.created_at as string | null) ?? null,
      deletedAt: (c.deleted_at as string | null) ?? null,
      plans: plansByClient.get(c.id as string) ?? 0,
      lastActivityAt: lastByClient.get(c.id as string) ?? null,
    })),
    activity: {
      workoutPlans: planIds.length,
      activePlans: (plans ?? []).filter((p) => p.active).length,
      logsLast30Days: logs30,
      lastLogAt,
      feedback: (feedback ?? []).map((f) => ({ id: f.id, title: f.title, category: f.category, createdAt: f.created_at })),
    },
    note: note ? { text: note.note as string, updatedAt: note.updated_at as string, updatedBy: note.updated_by as string | null } : null,
    audit: (audit ?? []).map((a) => ({ id: a.id, action: a.action, adminEmail: a.admin_email, details: a.details, createdAt: a.created_at })),
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const g = await adminGuard();
  if (g.error) return g.error;
  const { admin, user } = g;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  let body: unknown = null;
  try { body = await req.json(); } catch { /* handled below */ }
  const action = parseAdminAction(body);
  if (!action) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  // The admin cannot lock himself out.
  if (id === user.id && ["suspend", "ban", "set_demo"].includes(action.action)) {
    return NextResponse.json({ error: "self_action" }, { status: 400 });
  }

  const adminEmail = user.email ?? "";
  const plan = planAdminAction(action, adminEmail);

  if (plan.profile) {
    const { data, error } = await admin.from("profiles").update(plan.profile).eq("id", id).select("id");
    if (error) {
      // 42703 = column missing: migration 027/028 not applied yet.
      const missing = error.code === "42703" || /column/i.test(error.message);
      return NextResponse.json({ error: missing ? "migration_missing" : "save_failed" }, { status: missing ? 409 : 500 });
    }
    if (!data || data.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (plan.authBan) {
    const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: plan.authBan });
    if (error && plan.authBan !== "none") return NextResponse.json({ error: "ban_failed" }, { status: 500 });
  }
  if (plan.note !== undefined) {
    const { error } = await admin.from("admin_trainer_notes")
      .upsert({ user_id: id, note: plan.note, updated_at: new Date().toISOString(), updated_by: adminEmail });
    if (error) return NextResponse.json({ error: "migration_missing" }, { status: 409 });
  }

  await auditLog(admin, adminEmail, action.action, id, plan.log);
  return NextResponse.json({ ok: true });
}
