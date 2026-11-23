// Free trial and payment details. Pure module (no React / store) so it can be
// unit-tested.
//
// Every new account starts a TRIAL_DAYS free trial with the full app and one
// client. When it ends without Premium the account is suspended: the trainer
// panel is blocked and client links stop working (migration 027 enforces the
// links on the server). No prices are shown anywhere: trainers talk to sales.

import { isPremium } from "./plan-limits.ts";

export const TRIAL_DAYS = 14;

// ── Payment details (shown only to trainers in the subscription page) ───────
// Configuration only: set the variables on Vercel, no code change needed.
//   NEXT_PUBLIC_PAYMENT_LINK      e.g. a Stripe / PayPal payment link
//   NEXT_PUBLIC_PAYMENT_IBAN      bank transfer details (IBAN)
//   NEXT_PUBLIC_PAYMENT_HOLDER    bank account holder
export const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK || "";
export const PAYMENT_IBAN = process.env.NEXT_PUBLIC_PAYMENT_IBAN || "";
export const PAYMENT_HOLDER = process.env.NEXT_PUBLIC_PAYMENT_HOLDER || "";

export const PREMIUM_FEATURES = [
  "Clienti illimitati",
  "Schede con progressioni e superserie",
  "Portale cliente con link condiviso",
  "Indicazioni alimentari, fasi e misurazioni",
  "Form di intake, preventivi ed export PDF",
];
export const TRIAL_FEATURES = [
  `${TRIAL_DAYS} giorni gratuiti`,
  "Tutte le funzioni, con 1 cliente",
  "Nessuna carta richiesta",
];

const DAY_MS = 86_400_000;

export interface TrialStatus {
  onTrial: boolean;     // demo account (plan "free")
  endsAt: Date | null;  // null when unknown (profile not loaded / migration 027 missing)
  daysLeft: number;     // whole days left, 0 once expired
  suspended: boolean;   // trial over without Premium
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getTrialStatus(
  user: { plan: string; trialEndsAt?: string | null } | null | undefined,
  now: Date = new Date(),
): TrialStatus | null {
  if (!user) return null;
  if (isPremium(user.plan)) return { onTrial: false, endsAt: null, daysLeft: 0, suspended: false };
  const endsAt = parseDate(user.trialEndsAt);
  // Unknown end date: never lock the trainer out from the browser side.
  if (!endsAt) return { onTrial: true, endsAt: null, daysLeft: TRIAL_DAYS, suspended: false };
  const msLeft = endsAt.getTime() - now.getTime();
  return { onTrial: true, endsAt, daysLeft: Math.max(0, Math.ceil(msLeft / DAY_MS)), suspended: msLeft <= 0 };
}

export function formatDueDate(d: Date): string {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

// ── Overall access ──────────────────────────────────────────────────────────
// "suspended" / "banned" are manual admin switches (profiles.account_status,
// migration 028); "trial_expired" comes from the trial. The server applies the
// same rule in public.account_is_active (migrations 027/028).
export type AccountAccess = "ok" | "trial_expired" | "suspended" | "banned";

export function accountAccess(
  user: { plan: string; trialEndsAt?: string | null; accountStatus?: string | null } | null | undefined,
  now: Date = new Date(),
): AccountAccess {
  if (!user) return "ok";
  if (user.accountStatus === "banned") return "banned";
  if (user.accountStatus === "suspended") return "suspended";
  return getTrialStatus(user, now)?.suspended ? "trial_expired" : "ok";
}
