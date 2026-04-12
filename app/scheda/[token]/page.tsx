"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import type { Exercise, ExerciseLog, SupplementItem } from "@/lib/store";
import { Dumbbell, Loader2, AlertCircle } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  total_weeks: number;
  exercises: Exercise[];
  share_token: string;
  supplements: SupplementItem[] | null;
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
        const supabase = createClient();
        const { data: planRow, error: planErr } = await supabase
          .from("workout_plans")
          .select("id, name, description, days_per_week, total_weeks, exercises, share_token, supplements")
          .eq("share_token", token)
          .single();

        if (planErr || !planRow) { setError("Scheda non trovata o link non più valido."); setLoading(false); return; }

        let exercises: Exercise[] = [];
        try {
          exercises = typeof planRow.exercises === "string"
            ? JSON.parse(planRow.exercises)
            : planRow.exercises as Exercise[] ?? [];
        } catch {}

        let supplements: SupplementItem[] = [];
        try {
          supplements = typeof planRow.supplements === "string"
            ? JSON.parse(planRow.supplements)
            : planRow.supplements as SupplementItem[] ?? [];
        } catch {}

        setPlan({ ...planRow, exercises, supplements });

        const { data: logRows } = await supabase
          .from("exercise_logs")
          .select("*")
          .eq("workout_plan_id", planRow.id);

        if (logRows) {
          setLogs(logRows.map((l) => ({
            id: l.id,
            exerciseId: l.exercise_id,
            weekNumber: l.week_number,
            weight: l.weight ?? undefined,
            reps: l.reps ?? undefined,
            note: l.note ?? undefined,
            loggedAt: l.logged_at,
          })));
        }
      } catch {
        setError("Errore nel caricamento della scheda. Riprova.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleUpsertLog(logData: Omit<ExerciseLog, "id" | "loggedAt">) {
    if (!plan) return;
    setLogs((prev) => {
      const existing = prev.find((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber);
      if (existing) {
        return prev.map((l) =>
          l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber
            ? { ...l, ...logData, loggedAt: new Date().toISOString() } : l
        );
      }
      return [...prev, { ...logData, id: `tmp_${Date.now()}`, loggedAt: new Date().toISOString() }];
    });
    try {
      const saved = await dbExerciseLogs.upsert({
        workout_plan_id: plan.id,
        exercise_id: logData.exerciseId,
        week_number: logData.weekNumber,
        weight: logData.weight ?? null,
        reps: logData.reps ?? null,
        note: logData.note ?? null,
      });
      setLogs((prev) =>
        prev.map((l) =>
          l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber
            ? { ...l, id: saved.id } : l
        )
      );
    } catch {}
  }

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

  const weeksLogged = logs.length > 0 ? Math.max(...logs.map((l) => l.weekNumber)) : 0;
  const pct = Math.round((weeksLogged / plan.total_weeks) * 100);

  return (
    <div className="min-h-screen" style={{ background: "var(--black)" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "rgba(255,107,43,0.12)" }}>
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
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
          <span className="text-xs font-semibold accent-text">TrainerPro</span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Settimane completate", value: `${weeksLogged} / ${plan.total_weeks}` },
            { label: "Progressi", value: `${pct}%` },
            { label: "Registrazioni", value: String(logs.length) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,107,43,0.05)", border: "1px solid rgba(255,107,43,0.1)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--ivory)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Info tip */}
        <div className="mb-5 p-3 rounded-xl text-sm flex items-start gap-2"
          style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.12)", color: "rgba(245,240,232,0.6)" }}>
          <span className="text-base leading-none mt-0.5">💡</span>
          <span>
            <strong style={{ color: "var(--accent-light)" }}>Come usare la scheda:</strong>{" "}
            Seleziona la settimana, inserisci il carico (kg) usato per ogni serie e premi <strong>Salva</strong>. I dati vengono conservati settimana per settimana.
          </span>
        </div>

        {/* Logbook */}
        {plan.exercises.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Dumbbell size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Il tuo trainer sta ancora preparando gli esercizi.</p>
          </div>
        ) : (
          <WorkoutLogbook
            planId={plan.id}
            exercises={plan.exercises}
            logs={logs}
            totalWeeks={plan.total_weeks}
            daysPerWeek={plan.days_per_week}
            mode="client"
            supplements={plan.supplements ?? []}
            onUpsertLog={handleUpsertLog}
          />
        )}
      </div>

      <div className="text-center pb-8 pt-2">
        <p className="text-xs" style={{ color: "rgba(245,240,232,0.2)" }}>
          Powered by <span className="accent-text font-semibold">TrainerPro</span>
        </p>
      </div>
    </div>
  );
}
