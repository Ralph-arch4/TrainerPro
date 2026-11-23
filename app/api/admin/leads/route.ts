import { NextRequest, NextResponse } from "next/server";
import { adminGuard, auditLog, isSameOrigin } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/admin-actions";

// Sales leads from the public contact form (table public.sales_leads, migration 027).
export async function GET() {
  const g = await adminGuard();
  if (g.error) return g.error;
  const { data, error } = await g.admin.from("sales_leads").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ leads: [], missing: true });
  return NextResponse.json({
    leads: (data ?? []).map((l) => ({
      id: l.id as string, name: (l.name as string) ?? "", email: (l.email as string) ?? "", phone: (l.phone as string | null) ?? null,
      clients: (l.clients as string | number | null) ?? null, message: (l.message as string | null) ?? null,
      handled: Boolean(l.handled), createdAt: l.created_at as string,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const g = await adminGuard();
  if (g.error) return g.error;
  let body: { id?: unknown; handled?: unknown } = {};
  try { body = await req.json(); } catch { /* handled below */ }
  if (!isUuid(body.id) || typeof body.handled !== "boolean") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { error } = await g.admin.from("sales_leads").update({ handled: body.handled }).eq("id", body.id);
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  await auditLog(g.admin, g.user.email ?? "", body.handled ? "lead_handled" : "lead_reopened", null, { leadId: body.id });
  return NextResponse.json({ ok: true });
}
