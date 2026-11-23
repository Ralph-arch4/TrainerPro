import { NextRequest, NextResponse } from "next/server";
import { adminGuard, auditLog, isSameOrigin } from "@/lib/supabase/admin";

// Super-user console: list trainers and approve / reject / revoke Premium.
// Every call re-checks the session and the SUPERUSER_EMAILS list on the server.

const guard = adminGuard;

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  const { admin } = g;

  const [{ data: profiles, error }, { data: clients }] = await Promise.all([
    admin.from("profiles").select("*").limit(5000),
    admin.from("clients").select("*").limit(20000),
  ]);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });

  const emails = new Map<string, { email: string; createdAt: string }>();
  for (let page = 1; page <= 20; page++) {
    const { data, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError || !data) break;
    for (const u of data.users) emails.set(u.id, { email: u.email ?? "", createdAt: u.created_at });
    if (data.users.length < 1000) break;
  }
  const counts = new Map<string, number>();
  for (const c of clients ?? []) {
    if (c.deleted_at) continue;
    counts.set(c.user_id, (counts.get(c.user_id) ?? 0) + 1);
  }

  const trainers = (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: (p.full_name as string | null) ?? "",
    email: emails.get(p.id)?.email ?? "",
    createdAt: emails.get(p.id)?.createdAt ?? (p.created_at as string | null) ?? null,
    plan: (p.plan as string) ?? "free",
    premiumStatus: (p.premium_status as string) ?? "none",
    requestedAt: (p.premium_requested_at as string | null) ?? null,
    decidedAt: (p.premium_decided_at as string | null) ?? null,
    clients: counts.get(p.id) ?? 0,
  }));
  return NextResponse.json({ trainers });
}

const ACTIONS = {
  approve: { plan: "premium", premium_status: "approved" },
  reject:  { plan: "free",    premium_status: "rejected" },
  revoke:  { plan: "free",    premium_status: "revoked" },
} as const;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const g = await guard();
  if (g.error) return g.error;
  const { admin, user } = g;

  let body: { userId?: string; action?: string } = {};
  try { body = await req.json(); } catch { /* handled below */ }
  const patch = ACTIONS[body.action as keyof typeof ACTIONS];
  if (!patch || !body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Only the plan fields change: the trainer's clients and data are never touched.
  const { data, error } = await admin.from("profiles")
    .update({ ...patch, premium_decided_at: new Date().toISOString(), premium_decided_by: user.email })
    .eq("id", body.userId).select("id");
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await auditLog(admin, user.email ?? "", body.action as string, body.userId);
  return NextResponse.json({ ok: true, plan: patch.plan, premiumStatus: patch.premium_status });
}
