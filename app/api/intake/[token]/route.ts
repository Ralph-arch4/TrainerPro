import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

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

// ── DB-backed rate limiter ───────────────────────────────────────────────────
// The previous in-memory Map didn't survive serverless cold starts and was not
// shared across concurrent instances, so the limit was effectively per-instance.
// The check_rate_limit RPC (migration 018) is atomic and shared across all
// instances. IP is hashed so no plaintext IP is stored.
const RATE_LIMIT = 8;     // max submissions per window
const WINDOW_SEC = 60;    // 1-minute window
const IP_SALT = process.env.AUDIT_IP_SALT ?? "tp-scan-audit-2026";

async function checkRateLimit(db: ReturnType<typeof adminDb>, ip: string): Promise<boolean> {
  const key = `intake:${createHash("sha256").update(IP_SALT + ip).digest("hex").slice(0, 16)}`;
  try {
    const { data } = await db.rpc("check_rate_limit", {
      p_key: key, p_limit: RATE_LIMIT, p_window_sec: WINDOW_SEC,
    });
    return data === true;
  } catch {
    // If the limiter backend is unavailable, fail open rather than block
    // legitimate submissions (the whitelist + size guards still apply).
    return true;
  }
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
  // Rate limiting (DB-backed, shared across serverless instances)
  const ip = getIp(req);
  const db = adminDb();
  if (!(await checkRateLimit(db, ip))) {
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

  // Sanitise with a strict whitelist: only known IntakeResponse keys, only
  // string values (trainingTypePreference: array of strings). Anything else —
  // nested objects, numbers, extra keys — is dropped so it can never reach
  // the trainer's UI.
  const STRING_KEYS = new Set([
    "fullName", "age", "height", "currentWeight",
    "primaryGoal", "secondaryGoals", "motivation",
    "gymExperience", "trainingYears", "hasFollowedProgram", "knownExercises",
    "musclesFelt", "musclesNotFelt", "favoriteExercises", "unwantedExercises",
    "strongExercises", "weakExercises", "pastSports", "currentSports",
    "fitnessAssessment",
    "sessionDuration", "trainingDaysPerWeek", "canTrainWeekend", "canTrainHome",
    "homeEquipment", "fixedSchedule", "trainingPartner", "preferredTrainingTime",
    "jointProblems", "pathologies", "injuries", "medications", "supplements",
    "digestiveIssues",
    "workDemanding", "workDaysPerWeek", "activityLevel", "sleepHours", "sleepQuality",
    "eatingOutFrequency", "cheatFoods", "dietType", "foodAllergies",
    "mealsPerDay", "mealDistribution", "canPrepMeals", "waterIntake",
    "alcoholConsumption", "typicalDayMeals",
  ]);
  const sanitised: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === "trainingTypePreference") {
      if (Array.isArray(v)) {
        const arr = v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 200)).slice(0, 20);
        if (arr.length > 0) sanitised[k] = arr;
      }
      continue;
    }
    if (!STRING_KEYS.has(k) || typeof v !== "string") continue;
    sanitised[k] = v.length > 2000 ? v.slice(0, 2000) : v;
  }

  try {
    const { error } = await db
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
