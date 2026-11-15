// Payment reminder shown to trainers without a paid subscription.
// Pure module (no React / store) so it can be unit-tested.

import { FREE_CLIENT_LIMIT } from "./plan-limits.ts";

export const PAYMENT_GRACE_DAYS = 30;

// ── Premium offer and payment details ────────────────────────────────────────
// Everything here is configuration: set the variables on Vercel when the real
// payment data is ready, no code change needed.
//   NEXT_PUBLIC_PREMIUM_PRICE     e.g. "29"            (EUR per month, shown to trainers)
//   NEXT_PUBLIC_PAYMENT_LINK      e.g. a Stripe / PayPal payment link
//   NEXT_PUBLIC_PAYMENT_IBAN      bank transfer details (IBAN)
//   NEXT_PUBLIC_PAYMENT_HOLDER    bank account holder
export const PREMIUM_PRICE = process.env.NEXT_PUBLIC_PREMIUM_PRICE || "29";
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
export const DEMO_FEATURES = [
  "1 cliente",
  "Tutte le funzioni per provarle davvero",
  "Nessuna carta richiesta",
];

// Day the reminder went live: trainers without a personal due date have
// PAYMENT_GRACE_DAYS from here. Override per account with the Supabase user
// metadata key `payment_due_at` (ISO date), or globally with
// NEXT_PUBLIC_PAYMENT_NOTICE_START.
export const PAYMENT_NOTICE_START = process.env.NEXT_PUBLIC_PAYMENT_NOTICE_START || "2026-11-13";

const DAY_MS = 86_400_000;

export interface PaymentStatus {
  show: boolean;        // false for paid plans
  dueDate: Date;
  daysLeft: number;     // 0 when the deadline has passed
  expired: boolean;
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// The reminder is only for accounts that are over the demo limit (trainers who
// joined before plans existed): they have PAYMENT_GRACE_DAYS to upgrade.
export function getPaymentStatus(
  user: { plan: string; paymentDueAt?: string | null } | null | undefined,
  now: Date = new Date(),
  noticeStart: string = PAYMENT_NOTICE_START,
  clientCount: number = Infinity,
): PaymentStatus | null {
  if (!user) return null;
  const start = parseDate(noticeStart) ?? now;
  const dueDate = parseDate(user.paymentDueAt) ?? new Date(start.getTime() + PAYMENT_GRACE_DAYS * DAY_MS);
  const msLeft = dueDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));
  return { show: user.plan === "free" && clientCount > FREE_CLIENT_LIMIT, dueDate, daysLeft, expired: msLeft <= 0 };
}

export function formatDueDate(d: Date): string {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
