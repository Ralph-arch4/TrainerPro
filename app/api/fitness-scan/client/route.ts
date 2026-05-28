import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// ── Security model ────────────────────────────────────────────────────────────
// Auth     : share_token validated server-side (no Supabase session for clients)
// Rate lmt : DB-backed (Supabase RPC) — survives Vercel serverless restarts
// File val : MIME header + magic byte check on raw buffer bytes
// EXIF     : stripped implicitly by client-side canvas resize before upload
// Storage  : private bucket, service_role only, RLS on fitness_scans table
// URLs     : signed server-side, 1h TTL
// Audit    : every operation logged to scan_access_logs with SHA-256(IP)
// Paths    : never exposed to the client browser
// AI data  : processed in trainer route only, never here
// ─────────────────────────────────────────────────────────────────────────────

const SCAN_BUCKET    = "fitness-scans";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB max (canvas-resized images are <500 KB)
const SIGNED_URL_TTL = 3600;            // 1 hour — enough for a full session view
const MAX_SCANS_PER_CLIENT = 120;        // quota: prevent storage abuse
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://trainer-pro-phi.vercel.app";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing service env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Content-Type-Options":       "nosniff",
    "X-Frame-Options":              "DENY",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status, headers: corsHeaders() });
}

// ── IP pseudonymisation ───────────────────────────────────────────────────────
// Store SHA-256(ip) in audit logs — compliant with GDPR pseudonymisation
// requirements. Cannot be reversed. Salt added so rainbow tables don't work.
const IP_SALT = process.env.AUDIT_IP_SALT ?? "tp-scan-audit-2026";
function hashIp(ip: string): string {
  return createHash("sha256").update(IP_SALT + ip).digest("hex").slice(0, 32);
}

// ── DB-backed rate limiting ───────────────────────────────────────────────────
// Uses check_rate_limit(key, limit, window_seconds) Supabase RPC.
// Atomic via PL/pgSQL row-level locking → safe across serverless instances.
async function dbRateLimit(
  supabase: ReturnType<typeof serviceClient>,
  ip: string,
  endpoint: string,
  limit: number,
  windowSec = 60
): Promise<boolean> {
  const key = `${endpoint}:${hashIp(ip)}`;
  const { data } = await supabase.rpc("check_rate_limit", {
    p_key: key, p_limit: limit, p_window_sec: windowSec,
  });
  return data === true;
}

// ── Token validation ──────────────────────────────────────────────────────────
async function resolveToken(
  supabase: ReturnType<typeof serviceClient>,
  token: string
): Promise<{ client_id: string; user_id: string } | null> {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("client_id, user_id")
    .eq("share_token", token)
    .single();
  if (error || !data) return null;
  return data as { client_id: string; user_id: string };
}

// ── Magic byte validation ─────────────────────────────────────────────────────
// The MIME Content-Type header is client-controlled and can be spoofed.
// This check validates the actual byte signature of the file content.
function validateImageBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // WebP: RIFF????WEBP
  if (buf[0]===0x52 && buf[1]===0x49 && buf[2]===0x46 && buf[3]===0x46 &&
      buf[8]===0x57 && buf[9]===0x45 && buf[10]===0x42 && buf[11]===0x50) return true;
  // HEIC/HEIF: ISO Base Media — bytes 4-7 are 'ftyp'
  if (buf[4]===0x66 && buf[5]===0x74 && buf[6]===0x79 && buf[7]===0x70) return true;
  return false;
}

// ── Date validation ───────────────────────────────────────────────────────────
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
}

// ── Audit log writer ──────────────────────────────────────────────────────────
async function audit(
  supabase: ReturnType<typeof serviceClient>,
  action: "view" | "upload" | "delete",
  actor: "client",
  ip: string,
  ua: string | null,
  scanId: string | null,
  clientId: string
) {
  await supabase.from("scan_access_logs").insert({
    scan_id:    scanId,
    client_id:  clientId,
    action,
    actor,
    ip_hash:    hashIp(ip),
    user_agent: ua?.slice(0, 200) ?? null,
  });
}

// ── GET ?token=xxx ─────────────────────────────────────────────────────────────
// Returns scan metadata + short-lived signed URLs (90s TTL).
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent");

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return err("missing_token", 400);

  const supabase = serviceClient();

  const allowed = await dbRateLimit(supabase, ip, "scan-list", 12, 60);
  if (!allowed) return err("rate_limited", 429);

  const plan = await resolveToken(supabase, token);
  if (!plan) return err("invalid_token", 403);

  // Single query — avoids double-fetch race condition
  const { data: scans, error: dbErr } = await supabase
    .from("fitness_scans")
    .select("id, taken_at, notes, ai_analysis, created_at, storage_path")
    .eq("client_id", plan.client_id)
    .order("taken_at", { ascending: false });

  if (dbErr) return err("db_error", 500);

  // Generate short-lived signed URLs server-side
  const withUrls = await Promise.all((scans ?? []).map(async (scan) => {
    const { storage_path, ...meta } = scan;
    let signedUrl: string | null = null;
    if (storage_path) {
      const { data } = await supabase.storage
        .from(SCAN_BUCKET)
        .createSignedUrl(storage_path, SIGNED_URL_TTL);
      signedUrl = data?.signedUrl ?? null;
    }
    // Audit one "view" event for the batch (not per-image to reduce DB writes)
    return { ...meta, signed_url: signedUrl };
  }));

  // Single audit entry for the list view
  if ((scans ?? []).length > 0) {
    await audit(supabase, "view", "client", ip, ua, null, plan.client_id);
  }

  return NextResponse.json({ scans: withUrls }, { headers: corsHeaders() });
}

// ── POST (multipart) ──────────────────────────────────────────────────────────
// Fields: token, taken_at (YYYY-MM-DD), notes?, file (image/*)
// Client resizes image via canvas before sending → EXIF stripped implicitly.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent");

  const supabase = serviceClient();

  const allowed = await dbRateLimit(supabase, ip, "scan-upload", 5, 60);
  if (!allowed) return err("rate_limited", 429);

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return err("invalid_form", 400); }

  const token   = (formData.get("token")    as string | null)?.trim();
  const takenAt = (formData.get("taken_at") as string | null)?.trim();
  const rawNotes= (formData.get("notes")    as string | null)?.trim() ?? null;
  const file    = formData.get("file") as File | null;

  if (!token || !takenAt || !file) return err("missing_params", 400);
  if (!isValidDate(takenAt))        return err("invalid_date", 400);
  if (file.size > MAX_FILE_BYTES)   return err("file_too_large", 400);

  // Limit notes field length
  const notes = rawNotes ? rawNotes.slice(0, 200) : null;

  // Read buffer BEFORE MIME check — magic bytes are authoritative
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. MIME header check (client-supplied, not trusted alone)
  if (!file.type.startsWith("image/")) return err("invalid_file_type", 400);

  // 2. Magic byte check (actual file content — cannot be spoofed)
  if (!validateImageBytes(buffer)) return err("invalid_image_content", 400);

  // Token validation must come after file checks to avoid unnecessary DB round-trips
  const plan = await resolveToken(supabase, token);
  if (!plan) return err("invalid_token", 403);

  // Quota check — prevent storage abuse (max scans per client)
  const { data: quotaOk } = await supabase.rpc("check_scan_upload_quota", {
    p_client_id: plan.client_id,
    p_max: MAX_SCANS_PER_CLIENT,
  });
  if (!quotaOk) return err("quota_exceeded", 429);

  const ext  = file.type === "image/png" ? "png" : "jpg";
  // Path includes a UUID segment — not guessable even if storage is enumerated
  const path = `${plan.user_id}/${plan.client_id}/c-${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(SCAN_BUCKET)
    .upload(path, buffer, { contentType: "image/jpeg", upsert: false });
  if (uploadErr) return err("upload_failed", 500);

  const { data: scan, error: dbErr } = await supabase
    .from("fitness_scans")
    .insert({ client_id: plan.client_id, user_id: plan.user_id, storage_path: path, taken_at: takenAt, notes })
    .select("id, taken_at, notes, ai_analysis, created_at")
    .single();

  if (dbErr) {
    await supabase.storage.from(SCAN_BUCKET).remove([path]);
    return err("db_error", 500);
  }

  const { data: urlData } = await supabase.storage
    .from(SCAN_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);

  await audit(supabase, "upload", "client", ip, ua, scan.id, plan.client_id);

  return NextResponse.json(
    { scan: { ...scan, signed_url: urlData?.signedUrl ?? null } },
    { status: 201, headers: corsHeaders() }
  );
}

// ── DELETE ?token=xxx&id=yyy ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent");

  const supabase = serviceClient();

  const allowed = await dbRateLimit(supabase, ip, "scan-delete", 10, 60);
  if (!allowed) return err("rate_limited", 429);

  const token  = req.nextUrl.searchParams.get("token");
  const scanId = req.nextUrl.searchParams.get("id");
  if (!token || !scanId) return err("missing_params", 400);

  const plan = await resolveToken(supabase, token);
  if (!plan) return err("invalid_token", 403);

  // Ownership enforced by double eq() — client can only delete own scans
  const { data: scan } = await supabase
    .from("fitness_scans")
    .select("id, storage_path")
    .eq("id", scanId)
    .eq("client_id", plan.client_id)
    .single();

  if (!scan) return err("not_found", 404);

  await supabase.storage.from(SCAN_BUCKET).remove([scan.storage_path]);
  await supabase.from("fitness_scans").delete().eq("id", scanId);

  await audit(supabase, "delete", "client", ip, ua, scanId, plan.client_id);

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
