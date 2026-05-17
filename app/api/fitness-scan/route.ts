import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import type { FitnessScanAnalysis } from "@/lib/db";

// Server-side only — never exposes storage URLs or API keys to the client
// Security model:
//   1. Auth enforced via Supabase session cookie (SSR)
//   2. Image fetched server-side with a 60s signed URL (never sent to client)
//   3. Image converted to base64 in-memory, sent directly to Claude
//   4. Only the structured analysis JSON is returned to the client
//   5. ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY are server-only env vars

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
      .select("id, user_id, storage_path")
      .eq("id", scanId)
      .eq("user_id", user.id)
      .single();

    if (scanErr || !scanRow) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // ── Get a short-lived signed URL (60s) — server-side only ─────────────────
    const { data: urlData, error: urlErr } = await supabase.storage
      .from(SCAN_BUCKET)
      .createSignedUrl(storagePath, 60);

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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `Sei un assistente di analisi della composizione corporea per personal trainer professionisti.
Analizza le foto di trasformazione corporea fornite e restituisci SOLO un oggetto JSON valido, senza testo aggiuntivo.
La tua analisi è un ausilio professionale e deve essere sempre accompagnata da una misurazione clinica.
Non identificare mai l'identità della persona. Concentrati esclusivamente sulla composizione corporea visiva.`,

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
              text: `Analizza questa foto di trasformazione corporea e restituisci ESCLUSIVAMENTE un oggetto JSON con questa struttura esatta:
{
  "body_fat_est": <numero percentuale stimata oppure null se non determinabile>,
  "muscle_mass_est": <"bassa" | "media" | "alta" | null>,
  "body_type": <"ectomorfo" | "mesomorfo" | "endomorfo" | "misto" | null>,
  "summary": "<descrizione professionale in italiano, max 3 frasi>",
  "recommendations": ["<consiglio 1>", "<consiglio 2>", "<consiglio 3>"],
  "confidence": <"low" | "medium" | "high">
}

Rispondi SOLO con il JSON. Nessun testo prima o dopo.`,
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

    return NextResponse.json({ analysis });

  } catch (err) {
    console.error("[fitness-scan] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
