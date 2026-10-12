import type { ExerciseLog } from "@/lib/store";

// A training session (start/end time, duration, client feedback) for one
// plan day in one week. Stored as a regular exercise_logs row so it reuses the
// token-secured upsert_exercise_log RPC and the portal read path:
//   exercise_id = "session:<day>", week_number = week,
//   reps = JSON {s, e, d, sa}, note = client feedback.
export const SESSION_PREFIX = "session:";

export interface WorkoutSession {
  day: number;
  week: number;
  start?: string;     // "HH:MM"
  end?: string;       // "HH:MM"
  durationMin?: number;
  startedAt?: string; // ISO, set when started with the live timer
  feedback?: string;
  loggedAt: string;
}

export function sessionExerciseId(day: number): string { return `${SESSION_PREFIX}${day}`; }

export function isSessionLog(log: Pick<ExerciseLog, "exerciseId">): boolean {
  return log.exerciseId.startsWith(SESSION_PREFIX);
}

export function parseSession(log: ExerciseLog): WorkoutSession {
  const day = parseInt(log.exerciseId.slice(SESSION_PREFIX.length)) || 1;
  let data: { s?: string; e?: string; d?: number; sa?: string } = {};
  try { data = JSON.parse(log.reps ?? "{}") ?? {}; } catch { /* empty */ }
  return {
    day, week: log.weekNumber,
    start: data.s || undefined, end: data.e || undefined,
    durationMin: typeof data.d === "number" ? data.d : undefined,
    startedAt: data.sa || undefined,
    feedback: log.note || undefined,
    loggedAt: log.loggedAt,
  };
}

/** Log payload for onUpsertLog. Returns reps undefined when nothing is set. */
export function sessionToLog(s: Omit<WorkoutSession, "loggedAt">): Omit<ExerciseLog, "id" | "loggedAt"> {
  const durationMin = s.durationMin ?? durationBetween(s.start, s.end);
  const payload = { s: s.start, e: s.end, d: durationMin, sa: s.startedAt };
  const hasTimes = !!(s.start || s.end || durationMin);
  return {
    exerciseId: sessionExerciseId(s.day),
    weekNumber: s.week,
    reps: hasTimes ? JSON.stringify(payload) : undefined,
    note: s.feedback?.trim() || undefined,
  };
}

/** Minutes between two "HH:MM" times; crossing midnight is handled. */
export function durationBetween(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined;
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const a = toMin(start), b = toMin(end);
  if (isNaN(a) || isNaN(b)) return undefined;
  const d = b >= a ? b - a : b + 1440 - a;
  return d > 0 && d <= 600 ? d : undefined;
}

export function formatDuration(min?: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Split a mixed log list into exercise logs and sessions. */
export function splitLogs(all: ExerciseLog[]): { logs: ExerciseLog[]; sessionLogs: ExerciseLog[] } {
  const logs: ExerciseLog[] = [], sessionLogs: ExerciseLog[] = [];
  for (const l of all) (isSessionLog(l) ? sessionLogs : logs).push(l);
  return { logs, sessionLogs };
}
