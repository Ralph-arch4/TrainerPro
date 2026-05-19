import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { createHash, randomUUID } from "crypto";

// ── Single-use photo view tokens ──────────────────────────────────────────────
//
// Security model:
//  1. GET  — trainer requests a token for a specific storage path
//             server generates: opaque token + Supabase signed URL (90s TTL)
//             stores: SHA-256(token) in photo_view_tokens, expires in 90s
//  2. POST — client calls after image loads to mark token as used
//             prevents URL from being replayed even before the 90s expires
//
// Result:
//  - URL can only be loaded once, by the authenticated trainer, within 90s
//  - Expired or used tokens return 410 Gone
//  - Cache-Control: no-store prevents browser caching of the signed URL

const BUCKETS = {
  "progress":     "Trainer Progress Bar",
  "scan":         "fitness-scans",
} as const;

type BucketKey = keyof typeof BUCKETS;

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const SECURE_HEADERS = {
  "Cache-Control":         "no-store, no-cache, must-revalidate, private",
  "Pragma":                "no-cache",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":       "DENY",
} as const;

// ── GET /api/photo/view-token?path=X&bucket=progress|scan ─────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: SECURE_HEADERS });

  const path      = req.nextUrl.searchParams.get("path");
  const bucketKey = (req.nextUrl.searchParams.get("bucket") ?? "progress") as BucketKey;
  if (!path || !BUCKETS[bucketKey]) {
    return NextResponse.json({ error: "missing_params" }, { status: 400, headers: SECURE_HEADERS });
  }

  const svc = service();

  // Verify the resource belongs to this trainer before issuing a token
  const table  = bucketKey === "scan" ? "fitness_scans" : "progress_photos";
  const { data: record } = await svc
    .from(table)
    .select("id")
    .eq("storage_path", path)
    .eq("user_id", user.id)
    .single();

  if (!record) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: SECURE_HEADERS });
  }

  // Generate signed URL (90s — just enough to load the image)
  const bucket = BUCKETS[bucketKey];
  const { data: urlData, error: urlErr } = await svc.storage
    .from(bucket)
    .createSignedUrl(path, 90);

  if (urlErr || !urlData?.signedUrl) {
    return NextResponse.json({ error: "storage_error" }, { status: 500, headers: SECURE_HEADERS });
  }

  // Generate opaque token + store its hash
  const rawToken  = randomUUID();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();

  await svc.from("photo_view_tokens").insert({
    user_id:    user.id,
    resource:   path,
    bucket:     bucket,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return NextResponse.json(
    { signed_url: urlData.signedUrl, view_token: rawToken, expires_at: expiresAt },
    { headers: SECURE_HEADERS }
  );
}

// ── POST /api/photo/view-token — mark token as used after image loads ──────────
// Body: { token: string }
export async function POST(req: NextRequest) {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: SECURE_HEADERS });

  const { token } = await req.json() as { token?: string };
  if (!token) return NextResponse.json({ ok: false }, { headers: SECURE_HEADERS });

  const svc  = service();
  const hash = createHash("sha256").update(token).digest("hex");

  await svc.from("photo_view_tokens")
    .update({ used: true })
    .eq("token_hash", hash)
    .eq("user_id", user.id)
    .eq("used", false);                    // idempotent — only marks once

  return NextResponse.json({ ok: true }, { headers: SECURE_HEADERS });
}
