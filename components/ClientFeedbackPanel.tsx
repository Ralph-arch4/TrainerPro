"use client";
import { useState } from "react";
import { Clock, Dumbbell, MessageSquare } from "lucide-react";
import type { Exercise, ExerciseLog, WorkoutPlan } from "@/lib/store";
import { formatDuration, parseSession, durationBetween, type WorkoutSession } from "@/lib/workoutSession";

interface DiaryRow { exercise: Exercise | undefined; exerciseId: string; log: ExerciseLog; }

export interface DiaryEntry {
  key: string;
  planName: string;
  week: number;
  day: number;
  dayLabel: string;
  date: string;          // latest save in the group
  session?: WorkoutSession;
  duration?: number;
  rows: DiaryRow[];
}

function hasData(l: ExerciseLog) { return l.weight != null || !!l.reps || !!l.note?.trim(); }

// One entry per (plan, week, day) the client has trained or commented on,
// newest first: session times + every exercise's sets as saved by the client.
export function collectWorkoutDiary(plans: WorkoutPlan[]): DiaryEntry[] {
  const out: DiaryEntry[] = [];
  for (const p of plans) {
    const exById = new Map(p.exercises.map((e) => [e.id, e]));
    const groups = new Map<string, DiaryEntry>();
    const get = (week: number, day: number) => {
      const k = `${p.id}#${week}#${day}`;
      let g = groups.get(k);
      if (!g) {
        g = { key: k, planName: p.name, week, day, dayLabel: p.dayLabels?.[day] || `Giorno ${day}`, date: "", rows: [] };
        groups.set(k, g);
      }
      return g;
    };
    for (const l of p.logs) {
      if (!hasData(l)) continue;
      const ex = exById.get(l.exerciseId);
      const g = get(l.weekNumber, ex?.day ?? 0);
      g.rows.push({ exercise: ex, exerciseId: l.exerciseId, log: l });
      if (l.loggedAt > g.date) g.date = l.loggedAt;
    }
    for (const raw of p.sessionLogs ?? []) {
      const s = parseSession(raw);
      if (!s.start && !s.end && !s.feedback) continue;
      const g = get(s.week, s.day);
      g.session = s;
      g.duration = s.durationMin ?? durationBetween(s.start, s.end);
      if (s.loggedAt > g.date) g.date = s.loggedAt;
    }
    for (const g of groups.values()) {
      g.rows.sort((a, b) => (a.exercise?.order ?? 999) - (b.exercise?.order ?? 999));
      out.push(g);
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

// Human-readable sets: per-set JSON [{r,w,e}] or legacy "12/10/8" + weight
export function formatSets(log: ExerciseLog, ex?: Exercise): string {
  if (ex?.kind === "cardio") return log.reps ? `${log.reps} min` : "—";
  const raw = log.reps ?? "";
  try {
    const sets = JSON.parse(raw);
    if (Array.isArray(sets) && sets[0] && typeof sets[0] === "object") {
      const parts = (sets as Array<{ r?: string; w?: string; e?: string }>)
        .filter((s) => s.r || s.w)
        .map((s) => `${s.r || "?"}${s.w ? ` × ${s.w} kg` : ""}${s.e ? ` (RPE ${s.e})` : ""}`);
      return parts.length ? parts.join("  ·  ") : "—";
    }
  } catch { /* legacy */ }
  if (!raw && log.weight == null) return "—";
  return `${raw ? `${raw} rip.` : ""}${log.weight != null ? `${raw ? " @ " : ""}${log.weight} kg` : ""}`;
}

const PAGE = 10;

export default function ClientFeedbackPanel({ plans }: { plans: WorkoutPlan[] }) {
  const [shown, setShown] = useState(PAGE);
  const [now] = useState(() => Date.now());
  const entries = collectWorkoutDiary(plans);
  const weekAgo = now - 7 * 86400000;
  const lastWeek = entries.filter((e) => new Date(e.date).getTime() > weekAgo);
  const timed = entries.filter((e) => e.duration);
  const avg = timed.length ? Math.round(timed.reduce((n, e) => n + (e.duration ?? 0), 0) / timed.length) : undefined;

  if (entries.length === 0) {
    return (
      <div className="card-luxury rounded-2xl p-10 text-center">
        <Dumbbell size={24} className="mx-auto mb-3" style={{ color: "rgba(201,168,76,0.4)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Il cliente non ha ancora registrato allenamenti.</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
          Appena salva una sessione dal suo link, qui trovi serie, ripetizioni, carichi, orari e note. La pagina si aggiorna da sola.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Ultimo allenamento", value: new Date(entries[0].date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) },
          { label: "Ultimi 7 giorni", value: `${lastWeek.length} ${lastWeek.length === 1 ? "sessione" : "sessioni"}` },
          { label: "Durata media", value: formatDuration(avg) },
        ].map((s) => (
          <div key={s.label} className="card-luxury rounded-2xl px-3 py-2.5">
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>{s.label}</p>
            <p className="text-sm font-bold" style={{ color: "var(--ivory)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {entries.slice(0, shown).map((e) => {
        const isNew = now - new Date(e.date).getTime() < 86400000;
        return (
          <div key={e.key} className="card-luxury rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--ivory)" }}>{e.dayLabel}</span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>Sett. {e.week} · {e.planName}</span>
              {isNew && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Nuovo</span>
              )}
              <span className="ml-auto text-xs" style={{ color: "var(--text-dim)" }}>
                {new Date(e.date).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" })}
                {" · "}{new Date(e.date).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {e.session?.start && (
              <div className="px-4 py-2 flex items-center gap-2 text-sm" style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                <Clock size={13} style={{ color: "var(--accent)" }} />
                {e.session.start} – {e.session.end ?? "non terminata"}
                {e.duration ? <strong style={{ color: "var(--accent-light)" }}>{formatDuration(e.duration)}</strong> : null}
              </div>
            )}

            {e.rows.length > 0 && (
              <div>
                {e.rows.map((r) => (
                  <div key={r.log.id} className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <p className="text-sm font-semibold break-words" style={{ color: "var(--ivory)" }}>
                      {r.exercise?.name ?? "Esercizio rimosso dalla scheda"}
                    </p>
                    <p className="text-sm mt-0.5 break-words" style={{ color: "var(--accent-light)" }}>{formatSets(r.log, r.exercise)}</p>
                    {r.exercise && r.exercise.kind !== "cardio" && (
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                        Target: {r.exercise.sets} × {r.exercise.perSetReps?.some(Boolean) ? r.exercise.perSetReps.join("/") : r.exercise.targetReps}
                      </p>
                    )}
                    {r.log.note && (
                      <p className="text-xs mt-1 italic break-words" style={{ color: "var(--text-muted)" }}>&ldquo;{r.log.note}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {e.session?.feedback && (
              <div className="px-4 py-2.5 flex items-start gap-2">
                <MessageSquare size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                <p className="text-sm italic break-words whitespace-pre-line" style={{ color: "var(--text-muted)" }}>&ldquo;{e.session.feedback}&rdquo;</p>
              </div>
            )}
          </div>
        );
      })}

      {shown < entries.length && (
        <button onClick={() => setShown((n) => n + PAGE)} className="w-full py-2.5 rounded-xl text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          Mostra altri allenamenti ({entries.length - shown})
        </button>
      )}
    </div>
  );
}
