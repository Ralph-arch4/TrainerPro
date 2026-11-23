import { NextResponse } from "next/server";
import { adminGuard, listAuthUsers } from "@/lib/supabase/admin";
import { normalizeStatus } from "@/lib/admin-actions";

// CEO admin panel: every trainer with plan, account status, trial and client count.
export async function GET() {
  const g = await adminGuard();
  if (g.error) return g.error;
  const { admin } = g;

  const [{ data: profiles, error }, { data: clients }, authUsers] = await Promise.all([
    admin.from("profiles").select("*").limit(5000),
    admin.from("clients").select("user_id, deleted_at").limit(50000),
    listAuthUsers(admin),
  ]);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });

  const counts = new Map<string, number>();
  for (const c of clients ?? []) {
    if (c.deleted_at) continue;
    counts.set(c.user_id, (counts.get(c.user_id) ?? 0) + 1);
  }

  const trainers = (profiles ?? []).map((p) => {
    const a = authUsers.get(p.id);
    return {
      id: p.id as string,
      name: (p.full_name as string | null) ?? "",
      email: a?.email ?? "",
      createdAt: a?.createdAt ?? (p.created_at as string | null) ?? null,
      lastSignInAt: a?.lastSignInAt ?? null,
      plan: (p.plan as string) ?? "free",
      premiumStatus: (p.premium_status as string) ?? "none",
      trialEndsAt: (p.trial_ends_at as string | null) ?? null,
      accountStatus: normalizeStatus(p.account_status),
      statusReason: (p.status_reason as string | null) ?? null,
      paidUntil: (p.paid_until as string | null) ?? null,
      clients: counts.get(p.id) ?? 0,
    };
  });
  return NextResponse.json({ trainers });
}
