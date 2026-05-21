import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Trainer-side upload endpoint.
// Uses service_role to bypass storage.objects RLS — storage policies
// are therefore not required on the "fitness-scans" bucket.
// Auth is enforced via the Bearer token (trainer Supabase session).

const SCAN_BUCKET = "fitness-scans";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return err("unauthorized", 401);

  const supabase = svc();
  const { data: { user }, error: authErr } = await supabase.auth.getUser(auth.slice(7));
  if (authErr || !user) return err("unauthorized", 401);

  // ── Parse multipart ────────────────────────────────────────────────────────
  let form: FormData;
  try { form = await req.formData(); }
  catch { return err("invalid_form"); }

  const file          = form.get("file") as File | null;
  const clientId      = (form.get("client_id") as string | null)?.trim();
  const takenAt       = (form.get("taken_at")  as string | null)?.trim();
  const notes         = (form.get("notes")     as string | null)?.trim() || null;
  const bodyFeaturesR = (form.get("body_features") as string | null)?.trim() || null;

  if (!file || !clientId || !takenAt) return err("missing_params");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(takenAt))    return err("invalid_date");
  if (file.size > 8 * 1024 * 1024)              return err("file_too_large");
  if (!file.type.startsWith("image/"))           return err("invalid_file_type");

  // Verify the client belongs to this trainer
  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (clientErr || !clientRow) return err("client_not_found", 403);

  // ── Magic byte check ────────────────────────────────────────────────────────
  const buf = Buffer.from(await file.arrayBuffer());
  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const isPng  = buf[0] === 0x89 && buf[1] === 0x50;
  const isWebp = buf[0] === 0x52 && buf[8] === 0x57;
  if (!isJpeg && !isPng && !isWebp) return err("invalid_image_content");

  // ── Upload to storage (service_role bypasses bucket policies) ───────────────
  const ext  = file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/${clientId}/${takenAt}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(SCAN_BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false });

  if (uploadErr) {
    console.error("[scan-upload] storage error:", uploadErr);
    return err(`storage_error: ${uploadErr.message}`, 500);
  }

  // ── Parse body_features (optional, from TF.js MoveNet) ─────────────────────
  let bodyFeatures: object | null = null;
  if (bodyFeaturesR) {
    try { bodyFeatures = JSON.parse(bodyFeaturesR); } catch { /* ignore */ }
  }

  // ── Create DB record ────────────────────────────────────────────────────────
  const { data: scan, error: dbErr } = await supabase
    .from("fitness_scans")
    .insert({
      client_id:     clientId,
      user_id:       user.id,
      storage_path:  path,
      taken_at:      takenAt,
      notes:         notes ?? null,
      body_features: bodyFeatures,
    })
    .select("id, client_id, user_id, storage_path, taken_at, notes, ai_analysis, body_features, created_at")
    .single();

  if (dbErr) {
    // Roll back storage upload on DB failure
    await supabase.storage.from(SCAN_BUCKET).remove([path]);
    console.error("[scan-upload] db error:", dbErr);
    return err(`db_error: ${dbErr.message}`, 500);
  }

  // ── Signed URL (5 min for immediate display) ────────────────────────────────
  const { data: urlData } = await supabase.storage
    .from(SCAN_BUCKET)
    .createSignedUrl(path, 300);

  return NextResponse.json(
    { scan, signedUrl: urlData?.signedUrl ?? null },
    { status: 201 }
  );
}
