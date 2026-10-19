"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import ThemeToggle from "@/components/ThemeToggle";
import LinkifiedText from "@/components/LinkifiedText";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { splitLogs } from "@/lib/workoutSession";
import { Dumbbell, Loader2, AlertCircle } from "lucide-react";

// Client portal shared by /cliente/[token] and /scheda/[token]: only the plan.

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  total_weeks: number;
  exercises: Exercise[];
  share_token: string;
  day_labels?: Record<number, string> | null;
}

export default function ClientPortal({ token }: { token: string | undefined }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [trainerName, setTrainerName] = useState("Il tuo Trainer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) { setError("Link non valido."); setLoading(false); return; }
      try {
        const { data, error: rpcErr } = await createClient().rpc("get_portal_data", { p_token: token });
        if (rpcErr || !data || data.error === "not_found") {
          setError("Scheda non trovata o link non più valido.");
          return;
        }
        const row = data.plan;
        let exercises: Exercise[] = [];
        try {
          exercises = typeof row.exercises === "string" ? JSON.parse(row.exercises) : (row.exercises as Exercise[]) ?? [];
        } catch { /* empty plan */ }
        let dayLabels: Record<number, string> | null = null;
        try {
          dayLabels = typeof row.day_labels === "string" ? JSON.parse(row.day_labels) : row.day_labels ?? null;
        } catch { /* default labels */ }
        setPlan({ ...row, exercises, day_labels: dayLabels });
        setLogs(((data.logs ?? []) as Array<Record<string, unknown>>).map((l) => ({
          id: l.id as string,
          exerciseId: l.exercise_id as string,
          weekNumber: l.week_number as number,
          weight: (l.weight as number) ?? undefined,
          reps: (l.reps as string) ?? undefined,
          note: (l.note as string) ?? undefined,
          loggedAt: l.logged_at as string,
        })));
        if (data.trainer_name) setTrainerName(data.trainer_name as string);
      } catch {
        setError("Errore nel caricamento. Riprova.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleUpsertLog(logData: Omit<ExerciseLog, "id" | "loggedAt">) {
    if (!plan) return;
    setSaveError(false);
    const snapshot = logs;
    const now = new Date().toISOString();
    setLogs((prev) => {
      const same = (l: ExerciseLog) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber;
      if (prev.some(same)) return prev.map((l) => same(l) ? { ...l, ...logData, loggedAt: now } : l);
      return [...prev, { ...logData, id: `tmp_${Date.now()}`, loggedAt: now }];
    });
    try {
      const saved = await dbExerciseLogs.upsertByToken(plan.share_token, {
        exercise_id: logData.exerciseId,
        week_number: logData.weekNumber,
        weight: logData.weight ?? null,
        reps: logData.reps ?? null,
        note: logData.note ?? null,
      });
      setLogs((prev) => prev.map((l) =>
        l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber ? { ...l, id: saved.id } : l));
    } catch {
      setLogs(snapshot);
      setSaveError(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={36} className="mx-auto mb-3" style={{ color: "rgba(239,68,68,0.6)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error || "Link non valido."}</p>
        </div>
      </div>
    );
  }

  const { logs: exerciseLogs, sessionLogs } = splitLogs(logs);
  const initials = trainerName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "PT";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b glass-dark" style={{ borderColor: "rgba(201,168,76,0.14)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
              style={{ background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.35)", color: "var(--accent)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight line-clamp-2 break-words" style={{ color: "var(--text)" }}>{plan.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>di {trainerName}</p>
            </div>
          </div>
          <ThemeToggle size={14} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {plan.description && (
          <div className="rounded-2xl px-4 py-3 text-sm break-words whitespace-pre-line"
            style={{ background: "var(--surface-xs)", border: "1px solid var(--border)", color: "var(--ivory)" }}>
            <span className="text-xs font-bold uppercase tracking-wide block mb-1" style={{ color: "var(--accent-light)" }}>
              Note del trainer
            </span>
            <LinkifiedText text={plan.description} />
          </div>
        )}
        {saveError && (
          <div className="p-3 rounded-xl text-sm flex items-center justify-between gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.9)" }}>
            <span>Errore nel salvataggio. Controlla la connessione e riprova.</span>
            <button onClick={() => setSaveError(false)} className="text-xs underline opacity-70 flex-shrink-0">Chiudi</button>
          </div>
        )}
        {plan.exercises.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
            <Dumbbell size={24} className="mx-auto mb-3" style={{ color: "rgba(201,168,76,0.4)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Scheda in preparazione</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Il tuo trainer la sta preparando su misura per te.</p>
          </div>
        ) : (
          <WorkoutLogbook
            planId={plan.id}
            exercises={plan.exercises}
            logs={exerciseLogs}
            sessionLogs={sessionLogs}
            totalWeeks={plan.total_weeks}
            daysPerWeek={plan.days_per_week}
            mode="client"
            dayLabels={plan.day_labels ?? {}}
            supplements={[]}
            onUpsertLog={handleUpsertLog}
          />
        )}
      </div>
    </div>
  );
}
