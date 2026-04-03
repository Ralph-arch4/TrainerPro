"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutSpreadsheet from "@/components/WorkoutSpreadsheet";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { Dumbbell, UtensilsCrossed, Loader2, AlertCircle, Copy, Check } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  total_weeks: number;
  exercises: Exercise[];
  share_token: string;
  client_id: string;
}

interface DietData {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: string | null;
  notes: string | null;
  active: boolean;
}

type Tab = "allenamento" | "dieta";

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [diets, setDiets] = useState<DietData[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("allenamento");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) { setError("Link non valido."); setLoading(false); return; }
      try {
        const supabase = createClient();

        // 1. Load workout plan by share token
        const { data: planRow, error: planErr } = await supabase
          .from("workout_plans")
          .select("id, name, description, days_per_week, total_weeks, exercises, share_token, client_id")
          .eq("share_token", token)
          .single();

        if (planErr || !planRow) {
          setError("Portale non trovato o link non più valido.");
          setLoading(false);
          return;
        }

        // Parse exercises
        let exercises: Exercise[] = [];
        try {
          exercises = typeof planRow.exercises === "string"
            ? JSON.parse(planRow.exercises)
            : (planRow.exercises as Exercise[]) ?? [];
        } catch {}

        setPlan({ ...planRow, exercises });

        // 2. Load exercise logs
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

        // 3. Load diet plans for this client (public via migration 005 policy)
        const { data: dietRows } = await supabase
          .from("diet_plans")
          .select("id, name, calories, protein, carbs, fat, meals, notes, active")
          .eq("client_id", planRow.client_id)
          .eq("active", true)
          .order("created_at", { ascending: false });

        if (dietRows) setDiets(dietRows);

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
    setLogs((prev) => {
      const existing = prev.find((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber);
      if (existing) return prev.map((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber ? { ...l, ...logData, loggedAt: new Date().toISOString() } : l);
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
      setLogs((prev) => prev.map((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber ? { ...l, id: saved.id } : l));
    } catch {}
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--black)" }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>Caricamento portale…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--black)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "rgba(239,68,68,0.6)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--ivory)" }}>Portale non disponibile</p>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>{error || "Link non valido."}</p>
        </div>
      </div>
    );
  }

  const weeksLogged = logs.length > 0 ? Math.max(...logs.map((l) => l.weekNumber)) : 0;
  const pct = Math.round((weeksLogged / plan.total_weeks) * 100);
  const activeDiet = diets[0] ?? null;

  return (
    <div className="min-h-screen" style={{ background: "var(--black)" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(10,10,10,0.95)", borderColor: "rgba(255,107,43,0.12)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg accent-btn flex items-center justify-center flex-shrink-0">
              <Dumbbell size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--ivory)" }}>{plan.name}</p>
              <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Il tuo piano personale</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ border: "1px solid rgba(255,107,43,0.2)", color: copied ? "#22c55e" : "rgba(245,240,232,0.55)" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copiato!" : "Copia link"}
            </button>
            <span className="text-xs font-semibold accent-text">TrainerPro</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Settimane completate", value: `${weeksLogged}/${plan.total_weeks}` },
            { label: "Progressi",            value: `${pct}%`                           },
            { label: "Giorni / settimana",   value: `${plan.days_per_week}`             },
            { label: "Registrazioni",        value: String(logs.length)                 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,107,43,0.05)", border: "1px solid rgba(255,107,43,0.1)" }}>
              <p className="text-xl font-bold" style={{ color: "var(--ivory)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(245,240,232,0.4)" }}>
            <span>Avanzamento piano</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF6B2B, #FF9A6C)" }} />
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6">
          {([
            { key: "allenamento" as Tab, icon: Dumbbell,       label: "Scheda allenamento" },
            { key: "dieta"       as Tab, icon: UtensilsCrossed, label: `Piano dieta${diets.length > 0 ? ` (${diets.length})` : ""}` },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === key ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${tab === key ? "rgba(255,107,43,0.3)" : "rgba(255,255,255,0.07)"}`,
                color: tab === key ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
              }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── ALLENAMENTO tab ─────────────────────────────────────────────────── */}
        {tab === "allenamento" && (
          <div>
            {plan.description && (
              <p className="text-sm mb-4" style={{ color: "rgba(245,240,232,0.5)" }}>{plan.description}</p>
            )}
            <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.12)", color: "rgba(245,240,232,0.6)" }}>
              <span className="text-base leading-none mt-0.5">💡</span>
              <span><strong style={{ color: "var(--accent-light)" }}>Come usare la scheda:</strong> clicca su una cella per inserire il peso e le ripetizioni. I dati vengono salvati automaticamente settimana per settimana.</span>
            </div>
            {plan.exercises.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Dumbbell size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.2)" }} />
                <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Il tuo trainer sta ancora preparando gli esercizi.</p>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* ── DIETA tab ───────────────────────────────────────────────────────── */}
        {tab === "dieta" && (
          <div>
            {diets.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <UtensilsCrossed size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.2)" }} />
                <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Il tuo trainer non ha ancora creato un piano alimentare.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {diets.map((diet) => (
                  <div key={diet.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,107,43,0.12)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold" style={{ color: "var(--ivory)" }}>{diet.name}</h2>
                        {diet.notes && (
                          <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>{diet.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{diet.calories}</p>
                        <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>kcal / giorno</p>
                      </div>
                    </div>

                    {/* Macro bars */}
                    <div className="space-y-3">
                      {[
                        { label: "Proteine", value: diet.protein, unit: "g", color: "#FF6B2B", max: diet.protein + diet.carbs + diet.fat },
                        { label: "Carboidrati", value: diet.carbs, unit: "g", color: "#FF9A6C", max: diet.protein + diet.carbs + diet.fat },
                        { label: "Grassi", value: diet.fat, unit: "g", color: "#CC5522", max: diet.protein + diet.carbs + diet.fat },
                      ].map(({ label, value, unit, color, max }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(245,240,232,0.55)" }}>
                            <span>{label}</span>
                            <span style={{ color }}>{value}{unit}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.round((value / max) * 100)}%`, background: color }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Macro pills */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {[
                        { label: "Proteine", value: `${diet.protein}g`, kcal: diet.protein * 4 },
                        { label: "Carboidrati", value: `${diet.carbs}g`, kcal: diet.carbs * 4 },
                        { label: "Grassi", value: `${diet.fat}g`, kcal: diet.fat * 9 },
                      ].map(({ label, value, kcal }) => (
                        <div key={label} className="rounded-xl p-2.5 text-center"
                          style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.1)" }}>
                          <p className="text-sm font-bold" style={{ color: "var(--ivory)" }}>{value}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
                          <p className="text-xs" style={{ color: "rgba(255,107,43,0.5)" }}>{kcal} kcal</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: "rgba(245,240,232,0.18)" }}>
          Powered by <span className="accent-text font-semibold">TrainerPro</span>
        </p>
      </div>
    </div>
  );
}
