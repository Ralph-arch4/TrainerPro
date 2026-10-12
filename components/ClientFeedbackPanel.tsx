"use client";
import { useState } from "react";
import { MessageSquare, Clock, Dumbbell } from "lucide-react";
import type { WorkoutPlan } from "@/lib/store";
import { formatDuration, parseSession, durationBetween } from "@/lib/workoutSession";

type Entry =
  | { kind: "session"; key: string; date: string; planName: string; week: number; dayLabel: string; start?: string; end?: string; duration?: number; text?: string }
  | { kind: "exercise"; key: string; date: string; planName: string; week: number; exerciseName: string; text: string };

// Everything the client wrote (session feedback + per-exercise notes) and
// session times, newest first, across all plans of one client.
export function collectClientFeedback(plans: WorkoutPlan[]): Entry[] {
  const out: Entry[] = [];
  for (const p of plans) {
    const exName = new Map(p.exercises.map((e) => [e.id, e.name]));
    for (const raw of p.sessionLogs ?? []) {
      const s = parseSession(raw);
      if (!s.start && !s.end && !s.feedback) continue;
      out.push({
        kind: "session", key: raw.id, date: s.loggedAt, planName: p.name, week: s.week,
        dayLabel: p.dayLabels?.[s.day] || `Giorno ${s.day}`,
        start: s.start, end: s.end, duration: s.durationMin ?? durationBetween(s.start, s.end), text: s.feedback,
      });
    }
    for (const l of p.logs) {
      if (!l.note?.trim()) continue;
      out.push({
        kind: "exercise", key: l.id, date: l.loggedAt, planName: p.name, week: l.weekNumber,
        exerciseName: exName.get(l.exerciseId) ?? "Esercizio rimosso", text: l.note,
      });
    }
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function ClientFeedbackPanel({ plans }: { plans: WorkoutPlan[] }) {
  const [filter, setFilter] = useState<"all" | "session" | "exercise">("all");
  const entries = collectClientFeedback(plans).filter((e) => filter === "all" || e.kind === filter);
  const sessions = collectClientFeedback(plans).filter((e): e is Extract<Entry, { kind: "session" }> => e.kind === "session" && !!e.duration);
  const avg = sessions.length ? Math.round(sessions.reduce((n, s) => n + (s.duration ?? 0), 0) / sessions.length) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([["all", "Tutto"], ["session", "Sessioni"], ["exercise", "Note esercizi"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filter === k ? "rgba(201,168,76,0.12)" : "var(--surface)",
              border: `1px solid ${filter === k ? "rgba(201,168,76,0.32)" : "var(--border-subtle)"}`,
              color: filter === k ? "var(--accent-light)" : "var(--text-muted)",
            }}>
            {label}
          </button>
        ))}
        {avg !== undefined && (
          <span className="ml-auto text-xs" style={{ color: "var(--text-dim)" }}>
            Durata media: <strong style={{ color: "var(--accent-light)" }}>{formatDuration(avg)}</strong> su {sessions.length} sessioni
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card-luxury rounded-2xl p-10 text-center">
          <MessageSquare size={24} className="mx-auto mb-3" style={{ color: "rgba(201,168,76,0.4)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nessun feedback ancora.</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
            Qui compaiono gli orari delle sessioni, i commenti a fine allenamento e le note che il cliente lascia sui singoli esercizi.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.key} className="card-luxury rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--text-dim)" }}>
                {e.kind === "session"
                  ? <span className="flex items-center gap-1 font-bold" style={{ color: "var(--accent-light)" }}><Clock size={12} /> Sessione · {e.dayLabel}</span>
                  : <span className="flex items-center gap-1 font-bold break-words" style={{ color: "var(--accent-light)" }}><Dumbbell size={12} /> {e.exerciseName}</span>}
                <span>Sett. {e.week}</span>
                <span className="break-words">{e.planName}</span>
                <span className="ml-auto">
                  {new Date(e.date).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" })}
                </span>
              </div>
              {e.kind === "session" && e.start && (
                <p className="text-sm mt-1.5" style={{ color: "var(--ivory)" }}>
                  {e.start} – {e.end ?? "non terminata"}
                  {e.duration ? <strong className="ml-2" style={{ color: "var(--accent-light)" }}>{formatDuration(e.duration)}</strong> : null}
                </p>
              )}
              {e.text && (
                <p className="text-sm mt-1.5 italic break-words whitespace-pre-line" style={{ color: "var(--text-muted)" }}>
                  &ldquo;{e.text}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
