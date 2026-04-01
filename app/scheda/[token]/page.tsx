"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutSpreadsheet from "@/components/WorkoutSpreadsheet";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { Dumbbell, Loader2, AlertCircle } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  total_weeks: number;
  exercises: Exercise[];
  share_token: string;
}

export default function PublicSchedaPage() {
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!token) { setError("Link non valido."); setLoading(false); return; }
      try {
        const result = await dbExerciseLogs.listByShareToken(token);
        if (!result) { setError("Scheda non trovata o link non più valido."); setLoading(false); return; }

        // Parse exercises from JSONB
        let exercises: Exercise[] = [];
        if (result.plan.exercises) {
          try {
            exercises = typeof result.plan.exercises === "string"
              ? JSON.parse(result.plan.exercises)
              : result.plan.exercises as Exercise[];
          } catch {}
        }

        setPlan({ ...result.plan, exercises });

        // Map DB logs → ExerciseLog shape
        const mappedLogs: ExerciseLog[] = result.logs.map((l) => ({
          id: l.id,
          exerciseId: l.exercise_id,
          weekNumber: l.week_number,
          weight: l.weight ?? undefined,
          reps: l.reps ?? undefined,
          note: l.note ?? undefined,
          loggedAt: l.logged_at,
        }));
        setLogs(mappedLogs);
      } catch (e) {
        setError("Errore nel caricamento della scheda. Riprova.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleUpsertLog(logData: Omit<ExerciseLog, "id" | "loggedAt">) {
    if (!plan) return;

    // Optimistic update
    setLogs((prev) => {
      const existing = prev.find((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber);
      if (existing) {
        return prev.map((l) =>
          l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber
            ? { ...l, ...logData, loggedAt: new Date().toISOString() }
            : l
        );
      }
      return [...prev, { ...logData, id: `tmp_${Date.now()}`, loggedAt: new Date().toISOString() }];
    });

    // Persist to Supabase (anon access — plan is public via share_token policy)
    try {
      const saved = await dbExerciseLogs.upsert({
        workout_plan_id: plan.id,
        exercise_id: logData.exerciseId,
        week_number: logData.weekNumber,
        weight: logData.weight ?? null,
        reps: logData.reps ?? null,
        note: logData.note ?? null,
      });
      // Replace temp id with real id from DB
      setLogs((prev) =>
        prev.map((l) =>
          l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber
            ? { ...l, id: saved.id }
            : l
        )
      );
    } catch {}
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--black)" }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>Caricamento scheda…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--black)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "rgba(239,68,68,0.6)" }} />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>{error || "Scheda non trovata."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--black)" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "rgba(255,107,43,0.12)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl accent-btn flex items-center justify-center flex-shrink-0">
              <Dumbbell size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--ivory)" }}>{plan.name}</h1>
              <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
                {plan.days_per_week} giorni/sett · {plan.total_weeks} settimane
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold accent-text">TrainerPro</p>
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>La tua scheda personale</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 pt-5">
        {plan.description && (
          <p className="text-sm mb-4" style={{ color: "rgba(245,240,232,0.5)" }}>{plan.description}</p>
        )}
        {/* Progress summary */}
        {(() => {
          const weeksLogged = logs.length > 0
            ? Math.max(...logs.map((l) => l.weekNumber))
            : 0;
          const pct = Math.round((weeksLogged / plan.total_weeks) * 100);
          return (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Settimane completate", value: `${weeksLogged} / ${plan.total_weeks}` },
                { label: "Progressi", value: `${pct}%` },
                { label: "Registrazioni totali", value: String(logs.length) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,107,43,0.05)", border: "1px solid rgba(255,107,43,0.1)" }}>
                  <p className="text-lg font-bold" style={{ color: "var(--ivory)" }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Spreadsheet */}
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 pb-6">
        <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
          style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.12)", color: "rgba(245,240,232,0.6)" }}>
          <span className="text-base leading-none mt-0.5">💡</span>
          <span><strong style={{ color: "var(--accent-light)" }}>Come usare la scheda:</strong> clicca su una cella per inserire il peso utilizzato e le ripetizioni completate. I dati vengono salvati automaticamente.</span>
        </div>

        <WorkoutSpreadsheet
          planId={plan.id}
          planName={plan.name}
          exercises={plan.exercises}
          logs={logs}
          totalWeeks={plan.total_weeks}
          daysPerWeek={plan.days_per_week}
          mode="client"
          onUpsertLog={handleUpsertLog}
        />
      </div>

      {/* Footer */}
      <div className="text-center pb-8 pt-2">
        <p className="text-xs" style={{ color: "rgba(245,240,232,0.2)" }}>
          Powered by <span className="accent-text font-semibold">TrainerPro</span>
        </p>
      </div>
    </div>
  );
}
