import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client-portal fitness scan endpoints.
// Auth: share_token (no Supabase session — clients are unauthenticated).
// Security model:
//   - Token validated server-side against workout_plans → resolves user_id + client_id
//   - Storage access via service_role only (never expose credentials to browser)
//   - Signed URLs generated server-side, 300s TTL
//   - File validated by MIME type and size before upload
//   - Rate limiting: 10 req/min per IP

const SCAN_BUCKET = "fitness-scans";
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB (pre-resized on client → usually <500 KB)

const ipWindows = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, limit = 10): boolean {
  const now = Date.now();
  const w = ipWindows.get(ip);
  if (!w || now > w.reset) { ipWindows.set(ip, { count: 1, reset: now + 60_000 }); return true; }
  if (w.count >= limit) return false;
  w.count++; return true;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

function err(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

async function resolveToken(supabase: ReturnType<typeof serviceClient>, token: string) {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("client_id, user_id")
    .eq("share_token", token)
    .single();
  if (error || !data) return null;
  return data as { client_id: string; user_id: string };
}

// ── GET ?token=xxx ─────────────────────────────────────────────────────────────
// Returns scan list with server-side signed URLs (300s TTL)
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) return err("rate_limited", 429);

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return err("missing_token", 400);

  const supabase = serviceClient();
  const plan = await resolveToken(supabase, token);
  if (!plan) return err("invalid_token", 403);

  const { data: scans, error: dbErr } = await supabase
    .from("fitness_scans")
    .select("id, taken_at, notes, ai_analysis, created_at")
    .eq("client_id", plan.client_id)
    .order("taken_at", { ascending: false });

  if (dbErr) return err("db_error", 500);

  // Generate signed URLs server-side — never expose raw paths to the client
  const { data: fullScans } = await supabase
    .from("fitness_scans")
    .select("id, storage_path")
    .eq("client_id", plan.client_id);

  const pathMap = new Map((fullScans ?? []).map(s => [s.id, s.storage_path]));

  const withUrls = await Promise.all((scans ?? []).map(async (scan) => {
    const path = pathMap.get(scan.id);
    let signedUrl: string | null = null;
    if (path) {
      const { data } = await supabase.storage.from(SCAN_BUCKET).createSignedUrl(path, 300);
      signedUrl = data?.signedUrl ?? null;
    }
    return { ...scan, signed_url: signedUrl };
  }));

  return NextResponse.json({ scans: withUrls });
}

// ── POST (multipart form) ──────────────────────────────────────────────────────
// Fields: token, taken_at, notes?, file (image/*)
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip, 6)) return err("rate_limited", 429);

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return err("invalid_form", 400); }

  const token   = (formData.get("token")    as string | null)?.trim();
  const takenAt = (formData.get("taken_at") as string | null)?.trim();
  const notes   = (formData.get("notes")    as string | null)?.trim() || null;
  const file    = formData.get("file") as File | null;

  if (!token || !takenAt || !file) return err("missing_params", 400);
  if (!file.type.startsWith("image/")) return err("invalid_file_type", 400);
  if (file.size > MAX_FILE_BYTES) return err("file_too_large", 400);

  const supabase = serviceClient();
  const plan = await resolveToken(supabase, token);
  if (!plan) return err("invalid_token", 403);

  // Upload image
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext    = file.type === "image/png" ? "png" : "jpg";
  const path   = `${plan.user_id}/${plan.client_id}/client-${takenAt}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(SCAN_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadErr) return err("upload_failed", 500);

  // Insert DB record
  const { data: scan, error: dbErr } = await supabase
    .from("fitness_scans")
    .insert({
      client_id:    plan.client_id,
      user_id:      plan.user_id,
      storage_path: path,
      taken_at:     takenAt,
      notes,
    })
    .select("id, taken_at, notes, ai_analysis, created_at")
    .single();

  if (dbErr) {
    await supabase.storage.from(SCAN_BUCKET).remove([path]);
    return err("db_error", 500);
  }

  // Return with a fresh signed URL
  const { data: urlData } = await supabase.storage.from(SCAN_BUCKET).createSignedUrl(path, 300);

  return NextResponse.json({ scan: { ...scan, signed_url: urlData?.signedUrl ?? null } }, { status: 201 });
}

// ── DELETE ?token=xxx&id=yyy ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) return err("rate_limited", 429);

  const token  = req.nextUrl.searchParams.get("token");
  const scanId = req.nextUrl.searchParams.get("id");
  if (!token || !scanId) return err("missing_params", 400);

  const supabase = serviceClient();
  const plan = await resolveToken(supabase, token);
  if (!plan) return err("invalid_token", 403);

  // Verify the scan belongs to this client before deleting
  const { data: scan } = await supabase
    .from("fitness_scans")
    .select("id, storage_path")
    .eq("id", scanId)
    .eq("client_id", plan.client_id)
    .single();

  if (!scan) return err("not_found", 404);

  await supabase.storage.from(SCAN_BUCKET).remove([scan.storage_path]);
  await supabase.from("fitness_scans").delete().eq("id", scanId);

  return NextResponse.json({ ok: true });
}
