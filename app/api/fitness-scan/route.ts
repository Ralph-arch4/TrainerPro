import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { analysePhysique, type StoredBodyFeatures } from "@/lib/physique-analyzer";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { scanId, storagePath } = body as { scanId?: string; storagePath?: string };
    if (!scanId || !storagePath) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    const { data: scanRow, error: scanErr } = await supabase
      .from("fitness_scans")
      .select("id, user_id, client_id, body_features")
      .eq("id", scanId)
      .eq("user_id", user.id)
      .single();

    if (scanErr || !scanRow) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const analysis = analysePhysique(scanId, (scanRow.body_features ?? null) as StoredBodyFeatures | null);

    const { error: updateErr } = await supabase
      .from("fitness_scans")
      .update({ ai_analysis: analysis })
      .eq("id", scanId);

    if (updateErr) {
      console.error("[fitness-scan] DB update error:", updateErr);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = createHash("sha256")
      .update((process.env.AUDIT_IP_SALT ?? "tp-scan-audit-2026") + ip)
      .digest("hex").slice(0, 32);
    void supabase.from("scan_access_logs").insert({
      scan_id:    scanId,
      client_id:  (scanRow as { client_id?: string }).client_id ?? null,
      action:     "analyze",
      actor:      "trainer",
      ip_hash:    ipHash,
      user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? null,
    });

    return NextResponse.json({ analysis }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[fitness-scan] error:", msg);
    return NextResponse.json({ error: "internal_error", detail: msg }, { status: 500 });
  }
}
