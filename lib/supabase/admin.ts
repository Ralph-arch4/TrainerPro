import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-only helpers for routes that need the service role. Never import
// this file from a client component.

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Super users approve Premium access. They sign in with their normal
// credentials; their emails are listed in SUPERUSER_EMAILS (comma separated,
// server-only variable). With the variable unset nobody is a super user.
export function superuserEmails(): string[] {
  return (process.env.SUPERUSER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isSuperuser(user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined): boolean {
  if (!user?.email || !user.email_confirmed_at) return false;
  return superuserEmails().includes(user.email.toLowerCase());
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
