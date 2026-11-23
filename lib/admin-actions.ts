// Pure validation for the CEO admin panel actions (no Supabase imports, so it
// is unit-testable). The API route turns the result into DB/Auth calls.

export type AccountStatus = "active" | "suspended" | "banned";

export type AdminAction =
  | { action: "set_premium" }
  | { action: "set_demo" }
  | { action: "suspend"; reason: string }
  | { action: "reactivate" }
  | { action: "ban"; reason: string }
  | { action: "unban" }
  | { action: "extend_trial"; days: number }
  | { action: "set_paid_until"; date: string | null }
  | { action: "save_note"; note: string };

export interface ActionPlan {
  profile?: Record<string, unknown>;
  // Supabase Auth ban: "876000h" (100 years) blocks login and token refresh; "none" lifts it.
  authBan?: "876000h" | "none";
  note?: string;
  log: Record<string, unknown>;
}

const MAX_REASON = 500;
const MAX_NOTE = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export function parseAdminAction(body: unknown): AdminAction | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  switch (b.action) {
    case "set_premium": case "set_demo": case "reactivate": case "unban":
      return { action: b.action };
    case "suspend": case "ban": {
      const reason = text(b.reason, MAX_REASON);
      return reason ? { action: b.action, reason } : null;
    }
    case "extend_trial": {
      const days = Number(b.days ?? 14);
      return Number.isInteger(days) && days >= 1 && days <= 365 ? { action: "extend_trial", days } : null;
    }
    case "set_paid_until": {
      if (b.date === null || b.date === "") return { action: "set_paid_until", date: null };
      if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || Number.isNaN(Date.parse(b.date))) return null;
      return { action: "set_paid_until", date: b.date };
    }
    case "save_note":
      return typeof b.note === "string" ? { action: "save_note", note: b.note.slice(0, MAX_NOTE) } : null;
    default:
      return null;
  }
}

// Turns a validated action into the changes to apply. `adminEmail` is stamped
// on every change; `now` is injectable for tests.
export function planAdminAction(a: AdminAction, adminEmail: string, now = new Date()): ActionPlan {
  const stamp = { status_changed_at: now.toISOString(), status_changed_by: adminEmail };
  switch (a.action) {
    case "set_premium":
      return {
        profile: { plan: "premium", premium_status: "approved", premium_decided_at: now.toISOString(), premium_decided_by: adminEmail },
        log: { plan: "premium" },
      };
    case "set_demo":
      return {
        profile: { plan: "free", premium_status: "revoked", premium_decided_at: now.toISOString(), premium_decided_by: adminEmail },
        log: { plan: "free" },
      };
    case "suspend":
      return { profile: { account_status: "suspended", status_reason: a.reason, ...stamp }, log: { reason: a.reason } };
    case "reactivate":
      return { profile: { account_status: "active", status_reason: null, ...stamp }, authBan: "none", log: {} };
    case "ban":
      return { profile: { account_status: "banned", status_reason: a.reason, ...stamp }, authBan: "876000h", log: { reason: a.reason } };
    case "unban":
      return { profile: { account_status: "active", status_reason: null, ...stamp }, authBan: "none", log: {} };
    case "extend_trial": {
      const until = new Date(now.getTime() + a.days * 86_400_000).toISOString();
      return { profile: { trial_ends_at: until }, log: { days: a.days, trialEndsAt: until } };
    }
    case "set_paid_until":
      return { profile: { paid_until: a.date }, log: { paidUntil: a.date } };
    case "save_note":
      return { note: a.note, log: { length: a.note.length } };
  }
}

export const ACTION_LABELS: Record<string, string> = {
  set_premium: "Premium attivato",
  set_demo: "Riportato alla demo",
  suspend: "Account sospeso",
  reactivate: "Account riattivato",
  ban: "Account bannato",
  unban: "Ban rimosso",
  extend_trial: "Prova estesa",
  set_paid_until: "Pagato fino al",
  save_note: "Nota privata aggiornata",
  lead_handled: "Contatto gestito",
  lead_reopened: "Contatto riaperto",
  approve: "Premium approvato",
  reject: "Richiesta Premium rifiutata",
  revoke: "Premium revocato",
};

export function normalizeStatus(v: unknown): AccountStatus {
  return v === "suspended" || v === "banned" ? v : "active";
}
