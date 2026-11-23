import { NextRequest, NextResponse } from "next/server";
import { adminClient, isSameOrigin, sessionUser } from "@/lib/supabase/admin";

// A trainer asks to activate Premium. The request stays "pending" until a
// super user verifies the payment and approves it (/admin/premium).
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: profile } = await admin.from("profiles").select("plan, premium_status").eq("id", user.id).maybeSingle();
  if (profile && profile.plan !== "free") return NextResponse.json({ status: "approved" });
  if (profile?.premium_status === "pending") return NextResponse.json({ status: "pending" });

  const patch = { premium_status: "pending", premium_requested_at: new Date().toISOString() };
  const { error } = profile
    ? await admin.from("profiles").update(patch).eq("id", user.id)
    : await admin.from("profiles").insert({ id: user.id, full_name: user.user_metadata?.full_name ?? null, plan: "free", ...patch });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ status: "pending" });
}
