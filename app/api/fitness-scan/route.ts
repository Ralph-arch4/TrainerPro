import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import type { FitnessScanAnalysis } from "@/lib/db";

// Server-side only — never exposes storage URLs or API keys to the client
// Security model:
//   1. Auth enforced via Supabase Bearer token (trainer session)
//   2. Ownership checked (scan.user_id === auth user)
//   3. Image fetched server-side with a 45s signed URL (never sent to client)
//   4. Image converted to base64 in-memory, sent directly to Claude
//   5. Only the structured analysis JSON is returned to the client
//   6. ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY are server-only
//   7. Every analysis logged to scan_access_logs with SHA-256(IP)
// GDPR note: images are temporarily sent to Anthropic (EU/US processors).
//   Trainers must inform clients of this in their privacy policy.

const SCAN_BUCKET = "fitness-scans";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase service role env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

function anthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY env var");
  return new Anthropic({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const accessToken = authHeader.slice(7);

    const supabase = serviceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
    if (authErr || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const { scanId, storagePath } = body as { scanId?: string; storagePath?: string };
    if (!scanId || !storagePath) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    // ── Verify the scan belongs to this trainer ───────────────────────────────
    const { data: scanRow, error: scanErr } = await supabase
      .from("fitness_scans")
      .select("id, user_id, client_id, storage_path")
      .eq("id", scanId)
      .eq("user_id", user.id)
      .single();

    if (scanErr || !scanRow) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // ── Get a short-lived signed URL (45s) — server-side only ─────────────────
    // This URL is fetched within the same serverless invocation and never
    // returned to the client. 45s is more than enough for the fetch + Claude.
    const { data: urlData, error: urlErr } = await supabase.storage
      .from(SCAN_BUCKET)
      .createSignedUrl(storagePath, 45);

    if (urlErr || !urlData?.signedUrl) {
      return NextResponse.json({ error: "storage_error" }, { status: 500 });
    }

    // ── Fetch image bytes ─────────────────────────────────────────────────────
    const imgResp = await fetch(urlData.signedUrl);
    if (!imgResp.ok) {
      return NextResponse.json({ error: "image_fetch_failed" }, { status: 500 });
    }
    const imgBuffer = await imgResp.arrayBuffer();
    const base64    = Buffer.from(imgBuffer).toString("base64");
    const mediaType = (imgResp.headers.get("content-type") ?? "image/jpeg") as
      "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    // ── Claude vision analysis ────────────────────────────────────────────────
    const anthropic = anthropicClient();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1400,
      system: `Sei un esperto di composizione corporea e biomeccanica al servizio di personal trainer professionisti.
Analizza le foto fornite con precisione scientifica e restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo.
Non identificare mai il volto o l'identità della persona. Concentrati esclusivamente su composizione corporea visiva, postura e biomeccanica.
Ogni valutazione è un ausilio professionale — non una diagnosi medica.`,

      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Analizza questa foto corporea e restituisci ESCLUSIVAMENTE il seguente JSON (nessun testo prima o dopo):
{
  "body_fat_est": <percentuale grasso corporeo stimata visivamente, oppure null>,
  "muscle_mass_est": <"bassa" | "media" | "alta" | null>,
  "body_type": <"ectomorfo" | "mesomorfo" | "endomorfo" | "misto" | null>,
  "confidence": <"low" | "medium" | "high">,

  "summary": "<valutazione professionale in italiano, 2-3 frasi, tono da coach esperto>",

  "biomechanics": "<osservazione visiva su postura, simmetria muscolare, catene cinetiche, compensazioni evidenti — 2-3 frasi in italiano>",

  "strengths": [
    "<punto di forza fisico osservabile 1>",
    "<punto di forza fisico osservabile 2>",
    "<punto di forza fisico osservabile 3>"
  ],

  "improvements": [
    "<area di miglioramento prioritaria 1 con azione concreta>",
    "<area di miglioramento prioritaria 2 con azione concreta>"
  ],

  "nutrition_calories": <stima calorica mantenimento (TDEE) basata sul fisico visibile, oppure null>,
  "nutrition_protein_g": <fabbisogno proteico giornaliero consigliato in grammi, oppure null>,
  "nutrition_tips": [
    "<consiglio nutrizionale specifico 1 basato sul fisico e sull'obiettivo visibile>",
    "<consiglio nutrizionale specifico 2>",
    "<consiglio nutrizionale specifico 3>"
  ],

  "recommendations": [
    "<raccomandazione allenamento 1 specifica e concreta>",
    "<raccomandazione allenamento 2>",
    "<raccomandazione allenamento 3>"
  ]
}`,
            },
          ],
        },
      ],
    });

    // ── Parse Claude response ─────────────────────────────────────────────────
    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: Omit<FitnessScanAnalysis, "analyzed_at" | "model">;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no json");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "parse_error", raw: rawText }, { status: 500 });
    }

    const analysis: FitnessScanAnalysis = {
      ...parsed,
      analyzed_at: new Date().toISOString(),
      model: "claude-haiku-4-5-20251001",
    };

    // ── Persist analysis to DB ────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("fitness_scans")
      .update({ ai_analysis: analysis })
      .eq("id", scanId);

    if (updateErr) {
      console.error("Failed to save analysis:", updateErr);
    }

    // Audit log — SHA-256(IP) pseudonymisation
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipSalt = process.env.AUDIT_IP_SALT ?? "tp-scan-audit-2026";
    const ipHash = createHash("sha256").update(ipSalt + ip).digest("hex").slice(0, 32);
    // Fire-and-forget audit log — wrap in void to suppress unhandled promise
    void supabase.from("scan_access_logs").insert({
      scan_id:   scanId,
      client_id: (scanRow as { client_id?: string }).client_id ?? null,
      action:    "analyze",
      actor:     "trainer",
      ip_hash:   ipHash,
      user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
    });

    return NextResponse.json({ analysis }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (err) {
    console.error("[fitness-scan] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
