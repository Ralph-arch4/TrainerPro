import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import type { ComparisonAnalysis } from "@/lib/db";

// ── Security model ────────────────────────────────────────────────────────────
// Auth    : Bearer token (Supabase trainer session)
// Images  : fetched server-side with 45s signed URLs — never touch the client browser
// AI flow : both base64 buffers sent in a single Claude message
// Output  : only the structured ComparisonAnalysis JSON is returned
// Audit   : logged with SHA-256(IP) pseudonymisation
// CORS    : explicit same-origin restriction header

const SCAN_BUCKET = "fitness-scans";
const CORS_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trainer-pro-phi.vercel.app";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
function anthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey: key });
}

const IP_SALT = process.env.AUDIT_IP_SALT ?? "tp-scan-audit-2026";
function hashIp(ip: string) {
  return createHash("sha256").update(IP_SALT + ip).digest("hex").slice(0, 32);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  CORS_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options":       "nosniff",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders() });
    }
    const token = auth.slice(7);
    const supabase = serviceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders() });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json() as {
      scanBeforeId?: string;
      scanAfterId?:  string;
      clientId?:     string;
    };
    const { scanBeforeId, scanAfterId, clientId } = body;
    if (!scanBeforeId || !scanAfterId || !clientId) {
      return NextResponse.json({ error: "missing_params" }, { status: 400, headers: corsHeaders() });
    }
    if (scanBeforeId === scanAfterId) {
      return NextResponse.json({ error: "same_scan" }, { status: 400, headers: corsHeaders() });
    }

    // ── Verify both scans belong to this trainer ──────────────────────────────
    const { data: scans, error: scanErr } = await supabase
      .from("fitness_scans")
      .select("id, user_id, storage_path, taken_at")
      .in("id", [scanBeforeId, scanAfterId])
      .eq("user_id", user.id);

    if (scanErr || !scans || scans.length !== 2) {
      return NextResponse.json({ error: "not_found" }, { status: 404, headers: corsHeaders() });
    }

    const before = scans.find(s => s.id === scanBeforeId)!;
    const after  = scans.find(s => s.id === scanAfterId)!;

    // Sort by taken_at so "before" is actually earlier
    if (new Date(before.taken_at) > new Date(after.taken_at)) {
      return NextResponse.json({ error: "before_must_precede_after" }, { status: 400, headers: corsHeaders() });
    }

    // ── Check if comparison already exists ────────────────────────────────────
    const { data: existing } = await supabase
      .from("fitness_scan_comparisons")
      .select("id, analysis")
      .eq("scan_before_id", scanBeforeId)
      .eq("scan_after_id", scanAfterId)
      .single();

    if (existing?.analysis) {
      // Return cached result — avoid re-billing the API
      return NextResponse.json({ comparison: existing }, { headers: corsHeaders() });
    }

    // ── Fetch both images server-side (short-lived signed URLs, never exposed) ─
    const [urlBefore, urlAfter] = await Promise.all([
      supabase.storage.from(SCAN_BUCKET).createSignedUrl(before.storage_path, 45),
      supabase.storage.from(SCAN_BUCKET).createSignedUrl(after.storage_path,  45),
    ]);
    if (!urlBefore.data?.signedUrl || !urlAfter.data?.signedUrl) {
      return NextResponse.json({ error: "storage_error" }, { status: 500, headers: corsHeaders() });
    }

    const [imgBefore, imgAfter] = await Promise.all([
      fetch(urlBefore.data.signedUrl).then(r => r.arrayBuffer()),
      fetch(urlAfter.data.signedUrl).then(r => r.arrayBuffer()),
    ]);

    const b64Before = Buffer.from(imgBefore).toString("base64");
    const b64After  = Buffer.from(imgAfter).toString("base64");

    // ── Claude dual-image comparison ──────────────────────────────────────────
    const anthropic = anthropicClient();
    const message = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: `Sei un assistente specializzato nell'analisi della progressione della composizione corporea per personal trainer.
Ti vengono mostrate DUE foto della stessa persona scattate in momenti diversi.
Il tuo compito è confrontarle e identificare i cambiamenti.
Restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo prima o dopo.
Non identificare mai il volto o l'identità della persona. Concentrati esclusivamente sulla composizione corporea visiva.`,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `FOTO 1 — "PRIMA" (${before.taken_at}):`,
          },
          {
            type:   "image",
            source: { type: "base64", media_type: "image/jpeg", data: b64Before },
          },
          {
            type: "text",
            text: `FOTO 2 — "DOPO" (${after.taken_at}):`,
          },
          {
            type:   "image",
            source: { type: "base64", media_type: "image/jpeg", data: b64After },
          },
          {
            type: "text",
            text: `Confronta le due foto e restituisci ESCLUSIVAMENTE questo JSON:
{
  "body_fat_change": <numero di punti percentuali stimati, negativo se migliorato, null se non determinabile>,
  "muscle_change": <"increased" | "decreased" | "stable" | null>,
  "posture_change": <osservazione sulla postura o null>,
  "overall_trend": <"positive" | "neutral" | "negative">,
  "summary": "<paragrafo in italiano di 3-4 frasi che descrive la progressione complessiva>",
  "key_improvements": ["<miglioramento 1>", "<miglioramento 2>"],
  "areas_to_work": ["<area da migliorare 1>", "<area da migliorare 2>"],
  "coach_tips": ["<consiglio pratico 1>", "<consiglio pratico 2>"],
  "confidence": <"low" | "medium" | "high">
}
Rispondi SOLO con il JSON.`,
          },
        ],
      }],
    });

    // ── Parse response ────────────────────────────────────────────────────────
    const raw = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: Omit<ComparisonAnalysis, "period_from" | "period_to" | "analyzed_at" | "model">;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no json");
      parsed = JSON.parse(match[0]);
    } catch {
      return NextResponse.json(
        { error: "parse_error", raw: raw.slice(0, 200) },
        { status: 500, headers: corsHeaders() }
      );
    }

    const analysis: ComparisonAnalysis = {
      ...parsed,
      period_from:  before.taken_at,
      period_to:    after.taken_at,
      analyzed_at:  new Date().toISOString(),
      model:        "claude-haiku-4-5-20251001",
    };

    // ── Persist ───────────────────────────────────────────────────────────────
    let comparisonId = existing?.id;

    if (!comparisonId) {
      const { data: newComp, error: insErr } = await supabase
        .from("fitness_scan_comparisons")
        .insert({
          user_id:        user.id,
          client_id:      clientId,
          scan_before_id: scanBeforeId,
          scan_after_id:  scanAfterId,
          analysis,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      comparisonId = newComp.id;
    } else {
      await supabase
        .from("fitness_scan_comparisons")
        .update({ analysis })
        .eq("id", comparisonId);
    }

    // ── Audit log ─────────────────────────────────────────────────────────────
    void supabase.from("scan_access_logs").insert({
      scan_id:    scanAfterId,
      client_id:  clientId,
      action:     "analyze",
      actor:      "trainer",
      ip_hash:    hashIp(ip),
      user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
    });

    return NextResponse.json(
      { comparison: { id: comparisonId, scan_before_id: scanBeforeId, scan_after_id: scanAfterId, analysis } },
      { headers: corsHeaders() }
    );

  } catch (err) {
    console.error("[fitness-scan/compare]", err);
    return NextResponse.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "unknown" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
