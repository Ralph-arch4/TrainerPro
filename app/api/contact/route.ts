import { NextRequest, NextResponse } from "next/server";
import { adminClient, isSameOrigin } from "@/lib/supabase/admin";

// Public "contact sales" form. Leads are saved in public.sales_leads
// (migration 027) with the service role; nobody can read them from the browser.

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60_000;

function allowed(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    if (rateMap.size > 2000) rateMap.clear();
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!allowed(ip)) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* validated below */ }

  // Honeypot field: real users never fill it. Pretend success to bots.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const lead = {
    name: clean(body.name, 120),
    email: clean(body.email, 200).toLowerCase(),
    phone: clean(body.phone, 40) || null,
    clients: clean(body.clients, 40) || null,
    message: clean(body.message, 2000) || null,
  };
  if (!lead.name || !EMAIL_RE.test(lead.email)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });
  }
  if (body.consent !== true) return NextResponse.json({ error: "consent_required" }, { status: 422 });

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { error } = await admin.from("sales_leads").insert(lead);
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
