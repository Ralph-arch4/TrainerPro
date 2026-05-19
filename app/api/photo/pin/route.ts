import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { createHash, randomUUID } from "crypto";

// ── PIN management for progress photo access ──────────────────────────────────
//
// Security model:
//  - PIN stored as hex(SHA-256(salt || PIN)) — salt is random UUID per trainer
//  - Plaintext PIN is never persisted
//  - On verify: recompute hash and compare in constant time (timingSafeEqual)
//  - Session: successful verify returns an opaque session token stored in DB
//    with 30-minute TTL. Client keeps it in sessionStorage (tab-scoped).
//  - Rate limiting: 5 attempts per 5 minutes per user (via existing check_rate_limit RPC)

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function hashPin(salt: string, pin: string): string {
  return createHash("sha256").update(salt + pin).digest("hex");
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  // Node.js timingSafeEqual — constant time regardless of content
  try {
    return require("crypto").timingSafeEqual(bufA, bufB);
  } catch {
    return a === b;
  }
}

// ── GET /api/photo/pin — check if PIN is set ───────────────────────────────────
export async function GET(req: NextRequest) {
  void req;
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = service();
  const { data } = await svc.from("photo_access_pins").select("user_id").eq("user_id", user.id).single();
  return NextResponse.json({ has_pin: !!data });
}

// ── POST /api/photo/pin — set or update PIN ────────────────────────────────────
// Body: { pin: string }  (4-8 digit PIN)
export async function POST(req: NextRequest) {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { pin } = await req.json() as { pin?: string };
  if (!pin || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN deve essere di 4-8 cifre" }, { status: 400 });
  }

  const salt = randomUUID();
  const hash = hashPin(salt, pin);
  const svc  = service();

  await svc.from("photo_access_pins")
    .upsert({ user_id: user.id, pin_hash: hash, pin_salt: salt, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}

// ── PUT /api/photo/pin — verify PIN, return session token ──────────────────────
// Body: { pin: string }
// Returns: { token: string, expires_at: string }
export async function PUT(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = service();

  // Rate limit: 5 attempts / 5 minutes
  const rlKey = `pin-verify:${user.id}:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
  const { data: allowed } = await svc.rpc("check_rate_limit", {
    p_key: rlKey, p_limit: 5, p_window_sec: 300,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Attendi 5 minuti." }, { status: 429 });
  }

  const { pin } = await req.json() as { pin?: string };
  if (!pin) return NextResponse.json({ error: "PIN mancante" }, { status: 400 });

  // Fetch stored hash
  const { data: row } = await svc
    .from("photo_access_pins")
    .select("pin_hash, pin_salt")
    .eq("user_id", user.id)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Nessun PIN impostato. Configuralo nelle impostazioni." }, { status: 404 });
  }

  const computed = hashPin(row.pin_salt, pin);
  if (!timingSafeCompare(computed, row.pin_hash)) {
    return NextResponse.json({ error: "PIN errato." }, { status: 401 });
  }

  // Generate opaque session token — 30 min TTL
  const rawToken  = randomUUID();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Store hashed session token in photo_view_tokens table (reuse for session tracking)
  await svc.from("photo_view_tokens").insert({
    user_id:    user.id,
    resource:   "__session__",
    bucket:     "__session__",
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return NextResponse.json({ token: rawToken, expires_at: expiresAt });
}

// ── DELETE /api/photo/pin — verify session token ───────────────────────────────
// Used by client to validate an existing session without re-entering PIN.
// Body: { token: string }
export async function DELETE(req: NextRequest) {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { token } = await req.json() as { token?: string };
  if (!token) return NextResponse.json({ valid: false });

  const svc = service();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: row } = await svc
    .from("photo_view_tokens")
    .select("expires_at, used")
    .eq("token_hash", tokenHash)
    .eq("user_id", user.id)
    .eq("resource", "__session__")
    .single();

  const valid = !!(row && !row.used && new Date(row.expires_at) > new Date());
  return NextResponse.json({ valid, expires_at: row?.expires_at ?? null });
}
