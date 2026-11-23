// Plans: "free" is the demo (one client), everything else is Premium (full app).
// The plan lives in profiles.plan and is enforced by the database
// (supabase/migrations/026_plans_premium.sql); this module mirrors the rule
// for the UI. Pure module: no React, no store imports.

export type PlanTier = "free" | "premium" | "personal_coach" | "fitness_master";
export type PremiumStatus = "none" | "pending" | "approved" | "rejected" | "revoked";

export const FREE_CLIENT_LIMIT = 1;

export function isPremium(plan: string | null | undefined): boolean {
  return !!plan && plan !== "free";
}

export function planLabel(plan: string | null | undefined): string {
  return isPremium(plan) ? "Premium" : "Demo gratuita";
}

export function clientLimit(plan: string | null | undefined): number {
  return isPremium(plan) ? Infinity : FREE_CLIENT_LIMIT;
}

export const DEMO_LIMIT_MESSAGE =
  "La demo gratuita permette di lavorare con un solo cliente. Passa a Premium per aggiungerne altri.";

// `current` = clients the trainer already has.
export function checkLimit(plan: string | null | undefined, _type: "clients", current: number): { allowed: boolean; message: string } {
  if (current < clientLimit(plan)) return { allowed: true, message: "" };
  return { allowed: false, message: DEMO_LIMIT_MESSAGE };
}

// Database error raised by the enforce_client_limit trigger
export function isDemoLimitError(err: unknown): boolean {
  const msg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err ?? "");
  return msg.includes("DEMO_CLIENT_LIMIT");
}
