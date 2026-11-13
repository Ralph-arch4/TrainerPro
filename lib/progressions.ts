// Pre-planned progressions: from a given week onward an exercise changes
// sets / reps / rest / notes without the trainer having to edit the plan.
// Stored inside the exercise object (workout_plans.exercises JSONB), so no
// DB migration is needed. Pure module: no React, no store imports.

export interface ExerciseProgression {
  id: string;
  fromWeek: number;      // 1-based week from which the change applies
  sets?: number;
  targetReps?: string;
  restSeconds?: string;
  duration?: string;     // cardio minutes
  notes?: string;        // extra instruction shown from that week
}

// Minimal exercise shape, structurally compatible with store.Exercise.
export interface ProgressableExercise {
  sets: number;
  targetReps: string;
  perSetReps?: string[];
  restSeconds?: string;
  duration?: string;
  notes?: string;
  progressions?: ExerciseProgression[];
}

export const MAX_SETS = 20;

function hasChange(p: ExerciseProgression): boolean {
  return p.sets != null || !!p.targetReps || !!p.restSeconds || !!p.duration || !!p.notes;
}

// Drops empty/invalid steps, clamps values, sorts by week. When two steps
// target the same week the later one in the list wins field by field.
export function normalizeProgressions(list: ExerciseProgression[] | undefined | null): ExerciseProgression[] {
  if (!Array.isArray(list)) return [];
  const byWeek = new Map<number, ExerciseProgression>();
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const fromWeek = Math.floor(Number(raw.fromWeek));
    if (!Number.isFinite(fromWeek) || fromWeek < 2) continue; // week 1 is the base plan
    const setsNum = raw.sets == null ? NaN : Math.floor(Number(raw.sets));
    const step: ExerciseProgression = {
      id: raw.id || `w${fromWeek}`,
      fromWeek,
      sets: Number.isFinite(setsNum) && setsNum >= 1 ? Math.min(setsNum, MAX_SETS) : undefined,
      targetReps: raw.targetReps?.toString().trim() || undefined,
      restSeconds: raw.restSeconds?.toString().trim() || undefined,
      duration: raw.duration?.toString().trim() || undefined,
      notes: raw.notes?.toString().trim() || undefined,
    };
    if (!hasChange(step)) continue;
    const prev = byWeek.get(fromWeek);
    byWeek.set(fromWeek, prev ? {
      ...prev,
      sets: step.sets ?? prev.sets,
      targetReps: step.targetReps ?? prev.targetReps,
      restSeconds: step.restSeconds ?? prev.restSeconds,
      duration: step.duration ?? prev.duration,
      notes: step.notes ?? prev.notes,
    } : step);
  }
  return [...byWeek.values()].sort((a, b) => a.fromWeek - b.fromWeek);
}

// Latest step that is active in the given week (undefined = base plan).
export function activeProgression(ex: ProgressableExercise, week: number): ExerciseProgression | undefined {
  const steps = normalizeProgressions(ex.progressions).filter((p) => p.fromWeek <= week);
  return steps[steps.length - 1];
}

// Exercise as it must be performed in `week`: steps are cumulative, each one
// overrides only the fields it sets.
export function applyProgression<T extends ProgressableExercise>(ex: T, week: number): T {
  const steps = normalizeProgressions(ex.progressions).filter((p) => p.fromWeek <= week);
  if (steps.length === 0) return ex;
  const out: T = { ...ex };
  for (const p of steps) {
    if (p.targetReps) {
      out.targetReps = p.targetReps;
      out.perSetReps = undefined; // a new rep target replaces per-set targets
    }
    if (p.sets != null && p.sets !== out.sets) {
      if (out.perSetReps && out.perSetReps.length > 0) {
        const last = out.perSetReps[out.perSetReps.length - 1] ?? "";
        out.perSetReps = Array.from({ length: p.sets }, (_, i) => out.perSetReps![i] ?? last);
      }
      out.sets = p.sets;
    }
    if (p.restSeconds) out.restSeconds = p.restSeconds;
    if (p.duration) out.duration = p.duration;
    if (p.notes) out.notes = out.notes && out.notes !== p.notes ? `${out.notes}\n${p.notes}` : p.notes;
  }
  return out;
}

// Short Italian description of one step, e.g. "3 serie · 6-8 rip. · rec. 120s".
export function describeProgression(p: ExerciseProgression): string {
  const parts: string[] = [];
  if (p.sets != null) parts.push(`${p.sets} serie`);
  if (p.targetReps) parts.push(`${p.targetReps} rip.`);
  if (p.duration) parts.push(`${p.duration} min`);
  if (p.restSeconds) parts.push(`rec. ${p.restSeconds}s`);
  if (p.notes) parts.push(p.notes);
  return parts.join(" · ");
}

// Reorders an exercise inside its own day and renumbers `order` globally so
// days never interleave. Returns the same array when the move is not possible.
export function moveWithinDay<T extends { id: string; day: number; order: number }>(
  exercises: T[], exerciseId: string, dir: "up" | "down",
): T[] {
  const target = exercises.find((e) => e.id === exerciseId);
  if (!target) return exercises;
  const dayOf = (e: T) => e.day ?? 1;
  const sameDay = exercises.filter((e) => dayOf(e) === dayOf(target)).sort((a, b) => a.order - b.order);
  const idx = sameDay.findIndex((e) => e.id === exerciseId);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= sameDay.length) return exercises;
  [sameDay[idx], sameDay[swap]] = [sameDay[swap], sameDay[idx]];
  const others = exercises.filter((e) => dayOf(e) !== dayOf(target));
  const all = [...others, ...sameDay.map((e, i) => ({ e, i }))
    .map(({ e, i }) => ({ ...e, order: -1000 + i }))];
  // Stable global renumbering: by day, then by position within the day.
  return all
    .sort((a, b) => dayOf(a) - dayOf(b) || a.order - b.order)
    .map((e, i) => ({ ...e, order: i }));
}
