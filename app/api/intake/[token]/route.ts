import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Server-side service role client — bypasses RLS, never exposed to browser
function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/intake/[token] — check if form exists and is still open
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { data, error } = await adminDb()
      .from("intake_forms")
      .select("token, status, label")
      .eq("token", token)
      .single();
    if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404, headers: CORS });
    return NextResponse.json({ status: data.status, label: data.label }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });
  }
}

// POST /api/intake/[token] — submit form response
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const body = await req.json();
    const { error } = await adminDb()
      .from("intake_forms")
      .update({
        status: "submitted",
        response: body,
        submitted_at: new Date().toISOString(),
      })
      .eq("token", token)
      .eq("status", "pending"); // only update if still pending
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: CORS });
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });
  }
}
