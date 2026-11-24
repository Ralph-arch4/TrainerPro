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

// ─── Quick plan builder (plan stored inside the link, migration 030) ─────────
export interface QuickExercise { id: string; name: string; sets: string; reps: string; }
export interface QuickDay { id: string; label: string; exercises: QuickExercise[]; }

export const QUICK_MAX_DAYS = 7;
export const QUICK_MAX_EXERCISES = 80;

let seq = 0;
export function quickId(prefix = "q"): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newQuickExercise(name = ""): QuickExercise {
  return { id: quickId("x"), name, sets: "3", reps: "10" };
}

export function newQuickDay(index: number): QuickDay {
  return { id: quickId("d"), label: `Giorno ${index + 1}`, exercises: [newQuickExercise()] };
}

interface PlainExercise { id: string; name: string; sets: number; targetReps: string; day: number; order: number; }

// Builder state -> what is saved on demo_links. Empty rows and empty days are dropped.
export function quickToPlan(days: QuickDay[]): { exercises: PlainExercise[]; daysPerWeek: number; dayLabels: Record<number, string> } {
  const kept = days
    .map((d) => ({ ...d, exercises: d.exercises.filter((e) => e.name.trim()) }))
    .filter((d) => d.exercises.length > 0)
    .slice(0, QUICK_MAX_DAYS);
  const exercises: PlainExercise[] = [];
  const dayLabels: Record<number, string> = {};
  kept.forEach((d, di) => {
    const day = di + 1;
    const label = d.label.trim();
    if (label && !/^Giorno \d+$/.test(label)) dayLabels[day] = label.slice(0, 40);
    d.exercises.forEach((e, ei) => {
      const sets = Math.min(20, Math.max(1, parseInt(e.sets, 10) || 1));
      exercises.push({ id: e.id, name: e.name.trim().slice(0, 100), sets, targetReps: e.reps.trim().slice(0, 20) || "10", day, order: ei });
    });
  });
  return { exercises: exercises.slice(0, QUICK_MAX_EXERCISES), daysPerWeek: Math.max(1, kept.length), dayLabels };
}

// Saved link -> builder state (to edit an active link).
export function planToQuick(exercises: Array<{ id: string; name: string; sets: number; targetReps: string; day: number; order: number }>, daysPerWeek: number, dayLabels: Record<number, string> | null): QuickDay[] {
  const n = Math.max(1, daysPerWeek || 1);
  return Array.from({ length: n }, (_, i) => {
    const day = i + 1;
    return {
      id: quickId("d"),
      label: dayLabels?.[day] ?? `Giorno ${day}`,
      exercises: exercises.filter((e) => e.day === day).sort((a, b) => a.order - b.order)
        .map((e) => ({ id: e.id, name: e.name, sets: String(e.sets), reps: e.targetReps })),
    };
  });
}

export function countQuickExercises(days: QuickDay[]): number {
  return days.reduce((n, d) => n + d.exercises.filter((e) => e.name.trim()).length, 0);
}
