import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Permanently deletes the signed-in trainer's account. All trainer data
// (clients, plans, logs, diets, measurements, notes) is removed by the
// ON DELETE CASCADE foreign keys on auth.users. Required by Google Play
// for apps that let users create an account.
export async function POST(req: NextRequest) {
  // Same-origin only: a cross-site form must not be able to trigger deletion.
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { confirm?: string } = {};
  try { body = await req.json(); } catch { /* handled below */ }
  if (body.confirm !== "ELIMINA") {
    return NextResponse.json({ error: "confirmation_required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const admin = createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true });
}
