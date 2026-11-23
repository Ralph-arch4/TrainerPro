import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-only helpers for routes that need the service role. Never import
// this file from a client component.

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Admins are listed in the Supabase table public.user_roles (role = 'admin',
// migration 028), read here with the service role. SUPERUSER_EMAILS (server-only,
// comma separated) is an optional fallback; with neither set nobody is admin.
export function superuserEmails(): string[] {
  return (process.env.SUPERUSER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

type MinimalUser = { id: string; email?: string | null; email_confirmed_at?: string | null };

export async function isAdmin(admin: NonNullable<ReturnType<typeof adminClient>>, user: MinimalUser | null | undefined): Promise<boolean> {
  if (!user?.id || !user.email_confirmed_at) return false;
  const { data, error } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!error && data) return true;
  return !!user.email && superuserEmails().includes(user.email.toLowerCase());
}

export async function sessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Browsers always send Origin on cross-site POSTs: reject anything that is not ours.
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  return !origin || origin === req.nextUrl.origin;
}

type AdminDb = NonNullable<ReturnType<typeof adminClient>>;

// Shared guard for every /api/admin route: signed in with a confirmed email,
// role 'admin' in public.user_roles, and the service role configured.
export async function adminGuard(): Promise<
  | { error: Response; user?: undefined; admin?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof sessionUser>>>; admin: AdminDb }
> {
  const user = await sessionUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const admin = adminClient();
  if (!admin) return { error: NextResponse.json({ error: "not_configured" }, { status: 503 }) };
  if (!(await isAdmin(admin, user))) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user, admin };
}

// Best effort: a missing audit table (migration 028 not applied) never blocks the action.
export async function auditLog(admin: AdminDb, adminEmail: string, action: string, targetUserId: string | null, details: Record<string, unknown> = {}) {
  try {
    await admin.from("admin_audit_log").insert({ admin_email: adminEmail, action, target_user_id: targetUserId, details });
  } catch { /* ignore */ }
}

export interface AuthUserInfo { email: string; createdAt: string | null; lastSignInAt: string | null; bannedUntil: string | null }

export async function listAuthUsers(admin: AdminDb): Promise<Map<string, AuthUserInfo>> {
  const out = new Map<string, AuthUserInfo>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    for (const u of data.users) {
      out.set(u.id, {
        email: u.email ?? "",
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        bannedUntil: (u as { banned_until?: string | null }).banned_until ?? null,
      });
    }
    if (data.users.length < 1000) break;
  }
  return out;
}
