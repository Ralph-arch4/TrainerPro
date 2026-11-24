// "Modalità demo rapida": 4-hour trial links a fitness_master trainer sends
// for a free lesson. The DB (migration 029) enforces the plan gate and the
// expiry; this module holds the shared rules for the UI. Pure module.

export const QUICK_DEMO_PLAN = "fitness_master";
export const DEMO_DURATION_HOURS = 4;
export const DEMO_PROSPECT_MAX = 80;
export const DEMO_MESSAGE_MAX = 600;

export function hasQuickDemo(plan: string | null | undefined): boolean {
  return plan === QUICK_DEMO_PLAN;
}

export type LockableFeature = "weeks" | "diet" | "supplements" | "progress" | "checkin";

// Premium features the trainer can show as locked teasers in the demo.
export const LOCKABLE_FEATURES: { id: LockableFeature; label: string; teaser: string }[] = [
  { id: "weeks",       label: "Programma completo",          teaser: "Solo la settimana 1 è aperta: il percorso completo prosegue con le progressioni settimana per settimana." },
  { id: "diet",        label: "Indicazioni alimentari",      teaser: "Indicazioni alimentari costruite sui tuoi obiettivi e sulle tue abitudini." },
  { id: "supplements", label: "Integratori consigliati",     teaser: "Integratori selezionati dal tuo trainer, con codici sconto dedicati." },
  { id: "progress",    label: "Monitoraggio dei progressi",  teaser: "Storico carichi, misurazioni e andamento nel tempo, sempre sotto controllo." },
  { id: "checkin",     label: "Check-in con il trainer",     teaser: "Feedback dopo ogni allenamento e aggiustamenti continui della scheda." },
];

export const DEFAULT_LOCKED: LockableFeature[] = LOCKABLE_FEATURES.map((f) => f.id);

export function normalizeLocked(value: unknown): LockableFeature[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(LOCKABLE_FEATURES.map((f) => f.id));
  return LOCKABLE_FEATURES.map((f) => f.id).filter((id) => value.includes(id) && allowed.has(id));
}

export function remainingMs(expiresAt: string | Date, now: Date = new Date()): number {
  return Math.max(0, new Date(expiresAt).getTime() - now.getTime());
}

export function isExpired(expiresAt: string | Date, now: Date = new Date()): boolean {
  return remainingMs(expiresAt, now) <= 0;
}

// "3h 12m", "45m", "< 1m"
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "scaduto";
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return "< 1m";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

// Maps DB errors raised by the guard_demo_link trigger to Italian messages.
export function demoLinkErrorMessage(err: unknown): string {
  const msg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err ?? "");
  if (msg.includes("DEMO_LINK_PLAN_REQUIRED")) return "La demo rapida è riservata al piano Fitness Master.";
  if (msg.includes("DEMO_LINK_ACCOUNT_INACTIVE")) return "Account non attivo: impossibile creare il link.";
  if (msg.includes("DEMO_LINK_PLAN_NOT_FOUND")) return "Scheda non trovata.";
  return "Errore nella creazione del link. Riprova.";
}
