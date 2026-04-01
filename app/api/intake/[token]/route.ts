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

// ── Server-side service role client — bypasses RLS, never exposed to browser ─
function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Simple in-memory rate limiter (best-effort; resets on cold start) ────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 8;        // max submissions per window
const WINDOW_MS  = 60_000;   // 1-minute window

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  // Prune map to avoid unbounded growth in long-lived instances
  if (rateMap.size > 2000) rateMap.clear();
  return entry.count <= RATE_LIMIT;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ── GET /api/intake/[token] — check if form exists and is still open ─────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length > 64) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400, headers: CORS });
  }
  try {
    const { data, error } = await adminDb()
      .from("intake_forms")
      .select("token, status, label")
      .eq("token", token)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: CORS });
    }
    return NextResponse.json({ status: data.status, label: data.label }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });
  }
}

// ── POST /api/intake/[token] — submit form response ───────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  // Rate limiting
  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429, headers: { ...CORS, "Retry-After": "60" } },
    );
  }

  const { token } = await params;
  if (!token || token.length > 64) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400, headers: CORS });
  }

  // Body size guard (100 KB max)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 100_000) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413, headers: CORS });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }

  // Require at minimum a name
  if (!body.fullName || typeof body.fullName !== "string" || !body.fullName.trim()) {
    return NextResponse.json({ error: "missing_name" }, { status: 422, headers: CORS });
  }

  // Sanitise: strip any keys that exceed 2 KB in value length
  const sanitised: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === "string" && v.length > 2000) {
      sanitised[k] = v.slice(0, 2000);
    } else {
      sanitised[k] = v;
    }
  }

  try {
    const { error } = await adminDb()
      .from("intake_forms")
      .update({
        status:       "submitted",
        response:     sanitised,
        submitted_at: new Date().toISOString(),
      })
      .eq("token", token)
      .eq("status", "pending"); // only update if still pending (idempotent guard)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS });
    }
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });
  }
}
