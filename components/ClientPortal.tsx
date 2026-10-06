"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import ThemeToggle from "@/components/ThemeToggle";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { Dumbbell, TrendingUp, Flame, Trophy, Loader2, AlertCircle, Lock } from "lucide-react";

// Minimal client portal shared by /cliente/[token] and /scheda/[token]:
// the plan itself + a light progress/gamification view. Nothing else.

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

type Tab = "scheda" | "progressi";

const XP_PER_LOG = 10;
const XP_PER_WEEK = 50;
const XP_PER_PR = 25;
const XP_PER_LEVEL = 200;
const LEVEL_NAMES = ["Novizio", "Atleta", "Guerriero", "Campione", "Élite", "Leggenda"];

const localDay = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD, local time

// Best weight in a log: per-set JSON first, legacy `weight` column as fallback
function bestWeight(log: ExerciseLog): number {
  let best = log.weight ?? 0;
  try {
    const sets = JSON.parse(log.reps ?? "");
    if (Array.isArray(sets)) {
      for (const s of sets) {
        const w = parseFloat((s as { w?: string })?.w ?? "");
        if (!isNaN(w) && w > best) best = w;
      }
    }
  } catch { /* legacy */ }
  return best;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const W = 64, H = 22, P = 2;
  const pts = values.map((v, i) =>
    `${(P + (i / (values.length - 1)) * (W - P * 2)).toFixed(1)},${(P + (1 - (v - min) / range) * (H - P * 2)).toFixed(1)}`);
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={W} height={H} className="flex-shrink-0" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={up ? "#22c55e" : "#f87171"} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ClientPortal({ token }: { token: string | undefined }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [trainerName, setTrainerName] = useState("Il tuo Trainer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [tab, setTab] = useState<Tab>("scheda");
  const [toast, setToast] = useState<{ title: string; sub?: string; pr?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Regular saves are confirmed by the logbook itself ("Salvato · +10 XP");
  // only personal records get the bigger banner here.
  function showToastMsg(t: { title: string; sub?: string; pr?: boolean }) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

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

      if (!logData.weight && !logData.reps) return; // cleared, no reward
      const prevBest = Math.max(0, ...snapshot
        .filter((l) => l.exerciseId === logData.exerciseId && l.weekNumber !== logData.weekNumber)
        .map(bestWeight));
      const newBest = logData.weight ?? 0;
      if (prevBest > 0 && newBest > prevBest) {
        const name = plan.exercises.find((e) => e.id === logData.exerciseId)?.name ?? "Esercizio";
        showToastMsg({ title: "Nuovo record", sub: `${name}: ${newBest} kg (+${+(newBest - prevBest).toFixed(2)})  ·  +${XP_PER_PR} XP`, pr: true });
      }
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

  // ── Progress & gamification ───────────────────────────────────────────────
  const filledLogs = logs.filter((l) => l.weight != null || l.reps);
  const currentWeek = filledLogs.length > 0 ? Math.max(...filledLogs.map((l) => l.weekNumber)) : 0;
  const weeksCompleted = Math.max(0, currentWeek - 1);
  const isUnlimited = plan.total_weeks === 0;

  const days = Array.from(new Set(filledLogs.map((l) => localDay(new Date(l.loggedAt))))).sort();
  let streak = 0;
  if (days.length > 0) {
    const gapDays = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
    if (gapDays(localDay(new Date()), days[days.length - 1]) <= 1) {
      streak = 1;
      for (let i = days.length - 1; i > 0 && gapDays(days[i], days[i - 1]) === 1; i--) streak++;
    }
  }

  // Sessions this calendar week (Mon-Sun) = distinct training days
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sessionsThisWeek = days.filter((d) => new Date(d) >= new Date(localDay(monday))).length;

  // Records per exercise: best weight + weekly history
  const records = plan.exercises
    .filter((ex) => ex.kind !== "cardio")
    .map((ex) => {
      const exLogs = filledLogs.filter((l) => l.exerciseId === ex.id).sort((a, b) => a.weekNumber - b.weekNumber);
      const history = exLogs.map(bestWeight).filter((w) => w > 0);
      if (history.length === 0) return null;
      const best = Math.max(...history);
      const bestLog = exLogs.find((l) => bestWeight(l) === best)!;
      return { ex, best, history, delta: +(history[history.length - 1] - history[0]).toFixed(1), isNew: bestLog.weekNumber === currentWeek && history.length > 1 };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.delta - a.delta);

  // A PR = a log heavier than every earlier week for that exercise
  const prCount = records.reduce((n, r) => {
    let max = r.history[0], c = 0;
    for (const w of r.history.slice(1)) if (w > max) { c++; max = w; }
    return n + c;
  }, 0);

  const totalXP = filledLogs.length * XP_PER_LOG + weeksCompleted * XP_PER_WEEK + prCount * XP_PER_PR;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const levelName = LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length) - 1];
  const xpPct = Math.round(((totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  const badges = [
    { label: "Prima sessione", done: filledLogs.length >= 1 },
    { label: "3 giorni di fila", done: streak >= 3 },
    { label: "Settimana piena", done: sessionsThisWeek >= plan.days_per_week },
    { label: "Primo record", done: prCount >= 1 },
    { label: "10 record", done: prCount >= 10 },
    { label: isUnlimited ? "8 settimane" : "Metà programma", done: isUnlimited ? weeksCompleted >= 8 : weeksCompleted >= plan.total_weeks / 2 },
  ];

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
              <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{plan.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>di {trainerName}</p>
            </div>
          </div>
          <ThemeToggle size={14} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Player strip: level + XP + 3 key numbers */}
        <div className="rounded-2xl p-3.5" style={{ background: "var(--surface-xs)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", color: "#0b0b0b" }}>
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{levelName}</p>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>{totalXP % XP_PER_LEVEL}/{XP_PER_LEVEL} XP</p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: "var(--surface-md)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, var(--accent-dark), var(--accent-light))" }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            {[
              { icon: <Flame size={12} style={{ color: "#fb923c" }} />, value: streak, label: streak === 1 ? "giorno di fila" : "giorni di fila" },
              { icon: <Dumbbell size={12} style={{ color: "var(--accent)" }} />, value: `${sessionsThisWeek}/${plan.days_per_week}`, label: "questa settimana" },
              { icon: <Trophy size={12} style={{ color: "#fbbf24" }} />, value: prCount, label: "record" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl py-2" style={{ background: "var(--surface-sm)" }}>
                <p className="flex items-center justify-center gap-1 text-base font-black" style={{ color: "var(--text)" }}>
                  {s.icon}{s.value}
                </p>
                <p className="text-xs" style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: "scheda" as Tab, icon: Dumbbell, label: "Scheda" },
            { key: "progressi" as Tab, icon: TrendingUp, label: "Progressi" },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === key ? "rgba(201,168,76,0.12)" : "var(--surface-sm)",
                border: `1px solid ${tab === key ? "rgba(201,168,76,0.32)" : "var(--border-subtle)"}`,
                color: tab === key ? "var(--accent-light)" : "var(--text-muted)",
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === "scheda" && (
          <div className="space-y-4">
            {plan.description && (
              <p className="text-sm italic px-1" style={{ color: "var(--text-muted)" }}>
                &ldquo;{plan.description}&rdquo; <span className="not-italic text-xs" style={{ color: "var(--text-dim)" }}>— {trainerName}</span>
              </p>
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
                logs={logs}
                totalWeeks={plan.total_weeks}
                daysPerWeek={plan.days_per_week}
                mode="client"
                dayLabels={plan.day_labels ?? {}}
                supplements={[]}
                onUpsertLog={handleUpsertLog}
              />
            )}
          </div>
        )}

        {tab === "progressi" && (
          <div className="space-y-4">
            {/* Program progress */}
            {!isUnlimited && (
              <div className="rounded-2xl p-4" style={{ background: "var(--surface-xs)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Programma</p>
                  <p className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>
                    Settimana {Math.max(currentWeek, 1)} di {plan.total_weeks}
                  </p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: plan.total_weeks }, (_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-full"
                      style={{ background: i < weeksCompleted ? "var(--accent)" : i === weeksCompleted ? "rgba(201,168,76,0.4)" : "var(--surface-md)" }} />
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="rounded-2xl p-4" style={{ background: "var(--surface-xs)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>
                Traguardi <span className="text-xs font-normal" style={{ color: "var(--text-dim)" }}>{badges.filter((b) => b.done).length}/{badges.length}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {badges.map((b) => (
                  <div key={b.label} className="rounded-xl px-2 py-2.5 text-center"
                    style={{
                      background: b.done ? "rgba(201,168,76,0.1)" : "var(--surface-sm)",
                      border: `1px solid ${b.done ? "rgba(201,168,76,0.3)" : "var(--border-subtle)"}`,
                    }}>
                    {b.done
                      ? <Trophy size={14} className="mx-auto mb-1" style={{ color: "var(--accent)" }} />
                      : <Lock size={14} className="mx-auto mb-1" style={{ color: "var(--text-faint)" }} />}
                    <p className="text-xs leading-tight" style={{ color: b.done ? "var(--text)" : "var(--text-dim)", fontSize: "0.68rem" }}>{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-exercise progression */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-4 py-3" style={{ background: "var(--surface-xs)", borderBottom: "1px solid var(--border-subtle)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Progressione carichi</p>
              </div>
              {records.length === 0 ? (
                <p className="text-center text-sm py-10 px-4" style={{ color: "var(--text-dim)" }}>
                  Inserisci i pesi nella scheda: qui vedrai i tuoi miglioramenti settimana dopo settimana.
                </p>
              ) : records.map((r, i) => (
                <div key={r.ex.id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < records.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{r.ex.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {r.history.length} {r.history.length === 1 ? "settimana" : "settimane"}
                      {r.delta !== 0 && (
                        <span className="ml-2 font-bold" style={{ color: r.delta > 0 ? "#22c55e" : "#f87171" }}>
                          {r.delta > 0 ? `+${r.delta}` : r.delta} kg
                        </span>
                      )}
                    </p>
                  </div>
                  <Sparkline values={r.history} />
                  <div className="text-right flex-shrink-0">
                    {r.isNew && (
                      <p className="text-xs font-bold" style={{ color: "#22c55e", fontSize: "0.6rem" }}>NUOVO PR</p>
                    )}
                    <p className="text-sm font-black" style={{ color: "var(--accent)" }}>{r.best} kg</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
              +{XP_PER_LOG} XP per esercizio registrato · +{XP_PER_PR} XP per record · +{XP_PER_WEEK} XP per settimana completata
            </p>
          </div>
        )}
      </div>

      {/* Save feedback */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl fade-in max-w-[90vw]"
          style={{
            background: toast.pr ? "linear-gradient(135deg, rgba(201,168,76,0.95), rgba(139,104,32,0.95))" : "rgba(20,20,20,0.92)",
            border: `1px solid ${toast.pr ? "rgba(232,201,107,0.8)" : "rgba(201,168,76,0.35)"}`,
            color: toast.pr ? "#0b0b0b" : "var(--accent-light)",
          }}>
          <p className="text-sm font-black flex items-center gap-1.5">
            {toast.pr && <Trophy size={14} />}{toast.title}
          </p>
          {toast.sub && <p className="text-xs font-semibold mt-0.5">{toast.sub}</p>}
        </div>
      )}
    </div>
  );
}
