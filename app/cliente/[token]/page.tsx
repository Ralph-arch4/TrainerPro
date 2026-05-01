"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import type { Exercise, ExerciseLog, SupplementItem } from "@/lib/store";
import { Dumbbell, UtensilsCrossed, ShoppingBag, Loader2, AlertCircle, Copy, Check, Zap, Trophy, Flame } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  total_weeks: number;
  exercises: Exercise[];
  share_token: string;
  client_id: string;
  day_labels: Record<number, string> | null;
  supplements: SupplementItem[] | null;
}

interface DietData {
  id: string;
  name: string;
  calories: number;
  calories_max?: number;
  protein: number;
  protein_max?: number;
  carbs: number;
  carbs_max?: number;
  fat: number;
  fat_max?: number;
  meals: string | null;
  notes: string | null;
  active: boolean;
}

type Tab = "allenamento" | "dieta" | "integratori";

function SupplementClientCard({ item }: { item: SupplementItem }) {
  const [copied, setCopied] = useState(false);
  function copyCode() {
    if (!item.discountCode) return;
    navigator.clipboard.writeText(item.discountCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "rgba(255,107,43,0.04)", border: "1px solid rgba(255,107,43,0.14)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--ivory)" }}>{item.name}</p>
          {item.brand && <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{item.brand}</p>}
        </div>
        <ShoppingBag size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
      </div>
      {item.notes && <p className="text-xs" style={{ color: "rgba(245,240,232,0.55)" }}>{item.notes}</p>}
      <div className="flex gap-2 flex-wrap">
        {item.productUrl && (
          <a href={item.productUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold accent-btn">
            <span>🛒</span> Acquista
          </a>
        )}
        {item.discountCode && (
          <button onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#34d399" : "rgba(245,240,232,0.6)",
            }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copiato!" : `Codice: ${item.discountCode}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [diets, setDiets] = useState<DietData[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("allenamento");
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) { setError("Link non valido."); setLoading(false); return; }
      try {
        const supabase = createClient();

        // Single RPC call — validates token server-side, no enumeration possible
        const { data, error: rpcErr } = await supabase
          .rpc("get_portal_data", { p_token: token });

        if (rpcErr || !data || data.error === "not_found") {
          setError("Portale non trovato o link non più valido.");
          setLoading(false);
          return;
        }

        const planRow = data.plan;

        let exercises: Exercise[] = [];
        try {
          exercises = typeof planRow.exercises === "string"
            ? JSON.parse(planRow.exercises)
            : (planRow.exercises as Exercise[]) ?? [];
        } catch {}

        let supplements: SupplementItem[] = [];
        try {
          supplements = typeof planRow.supplements === "string"
            ? JSON.parse(planRow.supplements)
            : planRow.supplements as SupplementItem[] ?? [];
        } catch {}
        setPlan({ ...planRow, exercises, supplements });

        if (data.logs) {
          setLogs((data.logs as Array<Record<string, unknown>>).map((l) => ({
            id: l.id as string,
            exerciseId: l.exercise_id as string,
            weekNumber: l.week_number as number,
            weight: (l.weight as number) ?? undefined,
            reps: (l.reps as string) ?? undefined,
            note: (l.note as string) ?? undefined,
            loggedAt: l.logged_at as string,
          })));
        }

        if (data.diets) setDiets(data.diets as DietData[]);

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
    setLogs((prev) => {
      const existing = prev.find((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber);
      if (existing) return prev.map((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber ? { ...l, ...logData, loggedAt: new Date().toISOString() } : l);
      return [...prev, { ...logData, id: `tmp_${Date.now()}`, loggedAt: new Date().toISOString() }];
    });
    try {
      const saved = await dbExerciseLogs.upsertByToken(plan.share_token, {
        exercise_id: logData.exerciseId,
        week_number: logData.weekNumber,
        weight: logData.weight ?? null,
        reps: logData.reps ?? null,
        note: logData.note ?? null,
      });
      setLogs((prev) => prev.map((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber ? { ...l, id: saved.id } : l));
    } catch {
      setLogs(snapshot);
      setSaveError(true);
    }
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

  // Progress: count distinct weeks with at least one log
  const uniqueWeeks     = new Set(logs.map(l => l.weekNumber));
  const currentWeek     = uniqueWeeks.size > 0 ? Math.max(...uniqueWeeks) : 0;
  // A week is "completed" only once the client moves past it
  const weeksCompleted  = Math.max(0, currentWeek - 1);
  const pct             = plan.total_weeks > 0 ? Math.round((weeksCompleted / plan.total_weeks) * 100) : 0;

  // ── Gamification ─────────────────────────────────────────────────────────
  const totalLogs  = logs.length;
  const xpPerLog   = 10;
  const xpPerWeek  = 50;
  const totalXP    = totalLogs * xpPerLog + weeksCompleted * xpPerWeek;
  const XP_PER_LVL = 150;
  const level      = Math.floor(totalXP / XP_PER_LVL) + 1;
  const xpInLevel  = totalXP % XP_PER_LVL;
  const xpPct      = Math.round((xpInLevel / XP_PER_LVL) * 100);
  const levelNames: Record<number, string> = { 1: "Novizio", 2: "Atleta", 3: "Guerriero", 4: "Campione", 5: "Élite" };
  const levelName  = levelNames[Math.min(level, 5)] ?? "Leggenda";

  // Achievements
  const achievements: { icon: string; label: string; unlocked: boolean }[] = [
    { icon: "🏋️", label: "Prima sessione",    unlocked: totalLogs >= 1 },
    { icon: "🔥", label: "3 giorni di fila",  unlocked: uniqueWeeks.size >= 1 && totalLogs >= 3 },
    { icon: "📅", label: "Settimana 1",       unlocked: currentWeek >= 1 },
    { icon: "💪", label: "Settimana 3",       unlocked: currentWeek >= 3 },
    { icon: "⚡", label: "20 registrazioni",  unlocked: totalLogs >= 20 },
    { icon: "🏆", label: "Metà programma",    unlocked: pct >= 50 },
  ];

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

        {/* ── Level + XP card ────────────────────────────────────────────────── */}
        <div className="mb-4 p-4 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(123,47,190,0.18), rgba(229,50,50,0.1))", border: "1px solid rgba(123,47,190,0.25)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #a78bfa, #7B2FBE)", boxShadow: "0 0 20px rgba(123,47,190,0.4)" }}>
                {level}
              </div>
              <div>
                <p className="font-black text-base" style={{ color: "var(--ivory)" }}>{levelName}</p>
                <p className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>Livello {level} · {totalXP} XP totali</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold" style={{ color: "rgba(245,240,232,0.4)" }}>al prossimo liv.</p>
              <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>{XP_PER_LVL - xpInLevel} XP</p>
            </div>
          </div>
          {/* XP bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, #7B2FBE, #a78bfa)" }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "rgba(245,240,232,0.3)" }}>
            Ogni sessione salvata = +10 XP · ogni settimana completata = +50 XP
          </p>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Settimane completate", value: `${weeksCompleted}/${plan.total_weeks}`, icon: <Trophy size={13} style={{ color: "#fbbf24" }} /> },
            { label: "Completamento",        value: `${pct}%`,                               icon: <Flame size={13} style={{ color: "var(--accent)" }} /> },
            { label: "Giorni / settimana",   value: `${plan.days_per_week}`,                 icon: <Dumbbell size={13} style={{ color: "#38bdf8" }} /> },
            { label: "Registrazioni",        value: String(totalLogs),                       icon: <Zap size={13} style={{ color: "#a78bfa" }} /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
              <p className="text-xl font-black" style={{ color: "var(--ivory)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.38)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Program progress bar ───────────────────────────────────────────── */}
        <div className="mb-4 p-4 rounded-2xl"
          style={{ background: "rgba(255,107,43,0.04)", border: "1px solid rgba(255,107,43,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: "var(--ivory)" }}>Avanzamento programma</p>
            <span className="text-sm font-black accent-text">{pct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-light))" }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "rgba(245,240,232,0.35)" }}>
            {weeksCompleted === 0
              ? `Settimana ${currentWeek > 0 ? currentWeek : 1} in corso — continua così!`
              : `${weeksCompleted} sett. completate · Settimana ${currentWeek} in corso`}
          </p>
        </div>

        {/* ── Achievements ───────────────────────────────────────────────────── */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Trophy size={13} style={{ color: "#fbbf24" }} />
            <p className="text-xs font-bold" style={{ color: "rgba(245,240,232,0.6)" }}>
              Obiettivi — {achievements.filter(a => a.unlocked).length}/{achievements.length} sbloccati
            </p>
          </div>
          <div className="grid grid-cols-3 gap-0">
            {achievements.map((a, i) => (
              <div key={i}
                className="flex flex-col items-center gap-1.5 p-3 text-center"
                style={{
                  borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  opacity: a.unlocked ? 1 : 0.3,
                  filter: a.unlocked ? "none" : "grayscale(1)",
                }}>
                <span style={{ fontSize: "1.4rem" }}>{a.icon}</span>
                <span className="text-xs font-semibold leading-tight" style={{ color: a.unlocked ? "var(--ivory)" : "rgba(245,240,232,0.4)" }}>
                  {a.label}
                </span>
                {a.unlocked && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: "0.6rem" }}>
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {([
            { key: "allenamento"  as Tab, icon: Dumbbell,        label: "Scheda allenamento" },
            { key: "dieta"        as Tab, icon: UtensilsCrossed,  label: `Piano dieta${diets.length > 0 ? ` (${diets.length})` : ""}` },
            { key: "integratori"  as Tab, icon: ShoppingBag,      label: `Integratori${(plan.supplements?.length ?? 0) > 0 ? ` (${plan.supplements!.length})` : ""}` },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
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
            {saveError && (
              <div className="mb-4 p-3 rounded-xl text-sm flex items-center justify-between gap-3"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.9)" }}>
                <span>Errore nel salvataggio. Controlla la connessione e riprova.</span>
                <button onClick={() => setSaveError(false)} className="text-xs underline opacity-70 flex-shrink-0">Chiudi</button>
              </div>
            )}
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
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,107,43,0.08)" }}>
                  <Dumbbell size={22} style={{ color: "rgba(255,107,43,0.4)" }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "rgba(245,240,232,0.6)" }}>Scheda in preparazione</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "rgba(245,240,232,0.3)" }}>Il tuo trainer sta costruendo la tua scheda personalizzata su misura. Torni tra poco.</p>
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

        {/* ── DIETA tab ───────────────────────────────────────────────────────── */}
        {tab === "dieta" && (
          <div>
            {diets.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,107,43,0.08)" }}>
                  <UtensilsCrossed size={22} style={{ color: "rgba(255,107,43,0.4)" }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "rgba(245,240,232,0.6)" }}>Piano alimentare in preparazione</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "rgba(245,240,232,0.3)" }}>Il tuo piano alimentare personalizzato apparirà qui. Il trainer lo sta preparando su misura per i tuoi obiettivi.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {diets.map((diet) => {
                  const meals: Array<{
                    id: string; name: string; time?: string; notes?: string;
                    items: Array<{ id: string; name: string; grams: number; gramsMax?: number; protein?: number; carbs?: number; fat?: number; notes?: string; }>;
                  }> = (() => {
                    try {
                      const p = JSON.parse(diet.meals ?? "[]");
                      if (Array.isArray(p) && p[0]?.items) return p;
                    } catch {}
                    return [];
                  })();

                  const fmt = (min: number, max?: number, unit = "g") =>
                    max && max > min ? `${min}–${max}${unit}` : `${min}${unit}`;

                  return (
                    <div key={diet.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,107,43,0.15)" }}>
                      {/* Header */}
                      <div className="p-5" style={{ background: "rgba(255,107,43,0.04)" }}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-base font-bold" style={{ color: "var(--ivory)" }}>{diet.name}</h2>
                            {diet.notes && <p className="text-xs mt-1 italic" style={{ color: "rgba(245,240,232,0.45)" }}>{diet.notes}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                              {fmt(diet.calories, diet.calories_max, " kcal")}
                            </p>
                            <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>al giorno</p>
                          </div>
                        </div>
                        {/* Macro pills */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Proteine", min: diet.protein, max: diet.protein_max, color: "#a78bfa" },
                            { label: "Carboidrati", min: diet.carbs, max: diet.carbs_max, color: "#38bdf8" },
                            { label: "Grassi", min: diet.fat, max: diet.fat_max, color: "#fbbf24" },
                          ].map(({ label, min, max, color }) => (
                            <div key={label} className="rounded-xl p-3 text-center"
                              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}>
                              <p className="text-sm font-bold" style={{ color }}>{fmt(min, max)}</p>
                              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meals */}
                      {meals.length > 0 && (
                        <div className="divide-y" style={{ borderTop: "1px solid rgba(255,107,43,0.1)", borderColor: "rgba(255,107,43,0.08)" }}>
                          {meals.map((meal, mi) => (
                            <div key={meal.id} className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(255,107,43,0.15)", color: "var(--accent-light)" }}>{mi + 1}</span>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{meal.name}</p>
                                  {meal.time && <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{meal.time}</span>}
                                </div>
                              </div>
                              {meal.notes && <p className="text-xs mb-2 italic" style={{ color: "rgba(245,240,232,0.4)" }}>{meal.notes}</p>}
                              {meal.items.length > 0 && (
                                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                                  {meal.items.map((item, ii) => (
                                    <div key={item.id}
                                      className="flex items-center gap-3 px-3 py-2.5"
                                      style={{ background: ii % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                                      <span className="flex-1 text-sm" style={{ color: "rgba(245,240,232,0.85)" }}>{item.name || "—"}</span>
                                      <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--accent-light)" }}>
                                        {item.gramsMax && item.gramsMax > item.grams ? `${item.grams}–${item.gramsMax}g` : `${item.grams}g`}
                                      </span>
                                      {(item.protein || item.carbs || item.fat) && (
                                        <div className="hidden sm:flex items-center gap-2 text-xs flex-shrink-0" style={{ color: "rgba(245,240,232,0.35)" }}>
                                          {item.protein ? <span style={{ color: "#a78bfa" }}>P {item.protein}g</span> : null}
                                          {item.carbs ? <span style={{ color: "#38bdf8" }}>C {item.carbs}g</span> : null}
                                          {item.fat ? <span style={{ color: "#fbbf24" }}>G {item.fat}g</span> : null}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INTEGRATORI tab ─────────────────────────────────────────────────── */}
        {tab === "integratori" && (
          <div>
            {(!plan.supplements || plan.supplements.length === 0) ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(255,107,43,0.08)" }}>
                  <ShoppingBag size={22} style={{ color: "rgba(255,107,43,0.4)" }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "rgba(245,240,232,0.6)" }}>Integratori in arrivo</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "rgba(245,240,232,0.3)" }}>Il tuo trainer aggiungerà presto i consigli sugli integratori più adatti al tuo programma.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs mb-4" style={{ color: "rgba(245,240,232,0.4)" }}>
                  Integratori consigliati dal tuo trainer. Se presente un codice sconto, copialo prima di acquistare.
                </p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {plan.supplements.map((item) => (
                    <SupplementClientCard key={item.id} item={item} />
                  ))}
                </div>
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
