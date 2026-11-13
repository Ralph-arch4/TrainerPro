// Payment reminder shown to trainers without a paid subscription.
// Pure module (no React / store) so it can be unit-tested.

export const PAYMENT_GRACE_DAYS = 30;

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

export function getPaymentStatus(
  user: { plan: string; paymentDueAt?: string | null } | null | undefined,
  now: Date = new Date(),
  noticeStart: string = PAYMENT_NOTICE_START,
): PaymentStatus | null {
  if (!user) return null;
  const start = parseDate(noticeStart) ?? now;
  const dueDate = parseDate(user.paymentDueAt) ?? new Date(start.getTime() + PAYMENT_GRACE_DAYS * DAY_MS);
  const msLeft = dueDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS));
  return { show: user.plan === "free", dueDate, daysLeft, expired: msLeft <= 0 };
}

export function formatDueDate(d: Date): string {
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
