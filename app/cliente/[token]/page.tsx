"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import type { Exercise, ExerciseLog, SupplementItem } from "@/lib/store";
import { Dumbbell, UtensilsCrossed, ShoppingBag, Loader2, AlertCircle, Copy, Check, Zap, Trophy, Flame, ChevronDown, ChevronUp, Calendar, MessageSquare } from "lucide-react";

// ── Meal library (Italian, based on sports nutrition guidelines) ─────────────
interface MealTpl { name: string; ingredients: string[]; pro: number; cho: number; fat: number; kcal: number; }

const MEAL_LIB: Record<"colazione" | "pranzo" | "cena" | "spuntino", MealTpl[]> = {
  colazione: [
    { name: "Avena con frutta e noci",         ingredients: ["80g fiocchi d'avena","200ml latte parz. scremato","15g noci","100g mirtilli"],                 pro:16,cho:55,fat:11,kcal:383 },
    { name: "Yogurt greco con granola",          ingredients: ["200g yogurt greco 0%","40g granola integrale","150g fragole","1 cucch. miele"],               pro:22,cho:48,fat:4, kcal:316 },
    { name: "Uova strapazzate e pane integrale", ingredients: ["3 uova intere","2 fette pane integrale","10ml olio EVO","manciata spinaci"],                  pro:26,cho:28,fat:18,kcal:378 },
    { name: "Smoothie proteico",                 ingredients: ["30g whey protein","200ml latte","1 banana","30g fiocchi d'avena"],                            pro:32,cho:58,fat:6, kcal:418 },
    { name: "Ricotta e pane tostato",            ingredients: ["150g ricotta magra","3 fette pane integrale","1 cucch. miele","1 arancia"],                   pro:20,cho:58,fat:6, kcal:370 },
    { name: "Pancake proteici alla banana",      ingredients: ["2 uova","50g avena macinata","1 banana","1 cucch. miele"],                                   pro:20,cho:52,fat:10,kcal:378 },
    { name: "Skyr con cereali e frutta",         ingredients: ["200g skyr naturale","30g muesli senza zucchero","100g fragole","10g mandorle"],               pro:24,cho:38,fat:7, kcal:311 },
  ],
  pranzo: [
    { name: "Pasta integrale al pollo",          ingredients: ["100g pasta integrale","150g petto di pollo","200g zucchine","10ml olio EVO","pomodorini"],    pro:48,cho:80,fat:12,kcal:624 },
    { name: "Riso basmati con salmone",          ingredients: ["100g riso basmati","150g salmone al forno","150g asparagi","10ml olio EVO"],                  pro:42,cho:80,fat:20,kcal:668 },
    { name: "Farro con tonno e peperoni",        ingredients: ["90g farro","150g tonno al naturale","200g peperoni arrostiti","10ml olio EVO"],               pro:40,cho:68,fat:12,kcal:540 },
    { name: "Tacchino con patate dolci",         ingredients: ["160g petto di tacchino","200g patate dolci","200g broccoli","10ml olio EVO"],                 pro:44,cho:60,fat:12,kcal:528 },
    { name: "Quinoa con manzo e spinaci",        ingredients: ["90g quinoa","140g manzo magro","200g spinaci","10ml olio EVO","pomodori"],                    pro:42,cho:60,fat:14,kcal:538 },
    { name: "Piadina integrale con pollo",       ingredients: ["1 piadina integrale","120g pollo","60g avocado","rucola","pomodorini"],                       pro:36,cho:52,fat:18,kcal:514 },
    { name: "Merluzzo con patate e insalata",    ingredients: ["160g merluzzo al forno","200g patate","insalata mista","10ml olio EVO"],                      pro:36,cho:50,fat:12,kcal:456 },
  ],
  cena: [
    { name: "Salmone al forno con riso",         ingredients: ["150g salmone","80g riso integrale","200g fagiolini","10ml olio EVO"],                         pro:40,cho:60,fat:18,kcal:566 },
    { name: "Pollo grigliato con patate",        ingredients: ["180g petto di pollo","200g patate novelle","insalata verde","10ml olio EVO"],                 pro:46,cho:38,fat:10,kcal:430 },
    { name: "Branzino con verdure grigliate",    ingredients: ["180g branzino","200g zucchine grigliate","150g patate dolci","10ml olio EVO"],                pro:36,cho:38,fat:12,kcal:406 },
    { name: "Frittata proteica e pane",          ingredients: ["4 uova + 2 albumi","200g verdure miste","2 fette pane integrale","10ml olio EVO"],            pro:36,cho:30,fat:18,kcal:426 },
    { name: "Tacchino con lenticchie",           ingredients: ["180g tacchino","150g lenticchie cotte","200g verdure stagione","10ml olio EVO"],              pro:46,cho:40,fat:10,kcal:434 },
    { name: "Tonno fresco con quinoa",           ingredients: ["160g tonno fresco","80g quinoa","pomodori e olive","10ml olio EVO"],                          pro:40,cho:45,fat:14,kcal:466 },
    { name: "Pollo al curry con riso",           ingredients: ["180g pollo","90g riso basmati","spinaci","100ml latte di cocco light"],                       pro:46,cho:62,fat:12,kcal:538 },
  ],
  spuntino: [
    { name: "Yogurt greco e noci",               ingredients: ["150g yogurt greco 0%","15g noci","1 cucch. miele"],                                          pro:16,cho:12,fat:10,kcal:202 },
    { name: "Banana e burro di mandorle",        ingredients: ["1 banana media","20g burro di mandorle"],                                                    pro:5, cho:30,fat:10,kcal:230 },
    { name: "Fiocchi di latte e frutti di bosco",ingredients: ["180g fiocchi di latte","100g frutti di bosco misti"],                                        pro:22,cho:12,fat:2, kcal:154 },
    { name: "Shake proteico",                    ingredients: ["30g whey protein","200ml acqua o latte scremato"],                                            pro:28,cho:6, fat:2, kcal:154 },
    { name: "Gallette riso con ricotta",         ingredients: ["3 gallette riso integrale","60g ricotta","1 mela piccola"],                                   pro:8, cho:28,fat:4, kcal:180 },
    { name: "Mix frutta secca",                  ingredients: ["30g mix mandorle, noci, pistacchi","1 mandarino"],                                            pro:7, cho:16,fat:16,kcal:232 },
    { name: "Uova sode e frutto",                ingredients: ["2 uova sode","1 arancia media"],                                                             pro:14,cho:14,fat:10,kcal:202 },
  ],
};

const MEAL_SPLITS = { colazione: 0.175, pranzo: 0.375, cena: 0.325, spuntino: 0.125 } as const;
const DAY_LABELS  = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
const MEAL_ICONS  = { colazione: "☀️", pranzo: "🍽️", cena: "🌙", spuntino: "🍎" };

function scaleMeal(tpl: MealTpl, targetKcal: number) {
  const k = targetKcal / tpl.kcal;
  return {
    ...tpl,
    scale: k,
    pro:  Math.round(tpl.pro  * k),
    cho:  Math.round(tpl.cho  * k),
    fat:  Math.round(tpl.fat  * k),
    kcal: Math.round(tpl.kcal * k),
    ingredients: tpl.ingredients.map(ing => {
      const m = ing.match(/^(\d+(?:\.\d+)?)(g|ml|kg)\s(.+)$/);
      if (m) return `${Math.round(parseFloat(m[1]) * k)}${m[2]} ${m[3]}`;
      return ing;
    }),
  };
}

function WeeklyDietPlan({ calories, protein, carbs, fat }: { calories: number; protein: number; carbs: number; fat: number }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  const slots = Object.entries(MEAL_SPLITS) as [keyof typeof MEAL_SPLITS, number][];

  return (
    <div className="mt-6">
      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-4">
        {DAY_LABELS.map((d, i) => (
          <button key={i} onClick={() => setSelectedDay(i)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: selectedDay === i ? "rgba(229,50,50,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${selectedDay === i ? "rgba(229,50,50,0.4)" : "rgba(255,255,255,0.07)"}`,
              color: selectedDay === i ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
            }}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Macro target banner */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Kcal",  val: `${calories}`,  color: "var(--accent)" },
          { label: "Prot.", val: `${protein}g`,   color: "#a78bfa" },
          { label: "Carb.", val: `${carbs}g`,     color: "#38bdf8" },
          { label: "Grassi",val: `${fat}g`,       color: "#fbbf24" },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl p-2 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-sm font-black" style={{ color }}>{val}</p>
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.38)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Meals for the selected day */}
      <div className="space-y-3">
        {slots.map(([slot, pct]) => {
          const targetKcal = Math.round(calories * pct);
          const meal       = scaleMeal(MEAL_LIB[slot][selectedDay % 7], targetKcal);
          const key        = `${selectedDay}-${slot}`;
          const isOpen     = expanded === key;
          return (
            <div key={slot} className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
              {/* Header */}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.03]"
                onClick={() => setExpanded(isOpen ? null : key)}>
                <span className="text-lg">{MEAL_ICONS[slot]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                    {slot.charAt(0).toUpperCase() + slot.slice(1)} · {targetKcal} kcal
                  </p>
                  <p className="text-sm font-bold truncate" style={{ color: "var(--ivory)" }}>{meal.name}</p>
                </div>
                {/* Macro pills */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                  {[
                    { v: meal.pro,  c: "#a78bfa", l: "P" },
                    { v: meal.cho,  c: "#38bdf8", l: "C" },
                    { v: meal.fat,  c: "#fbbf24", l: "G" },
                  ].map(({ v, c, l }) => (
                    <span key={l} className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                      style={{ background: `${c}18`, color: c }}>
                      {l} {v}g
                    </span>
                  ))}
                </div>
                {isOpen ? <ChevronUp size={14} style={{ color: "rgba(245,240,232,0.4)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "rgba(245,240,232,0.4)", flexShrink: 0 }} />}
              </button>

              {/* Expanded: ingredients + macros mobile */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 flex-wrap pt-3">
                    {[
                      { v: meal.pro,  c: "#a78bfa", l: "Proteine" },
                      { v: meal.cho,  c: "#38bdf8", l: "Carboidrati" },
                      { v: meal.fat,  c: "#fbbf24", l: "Grassi" },
                      { v: meal.kcal, c: "var(--accent)", l: "Kcal" },
                    ].map(({ v, c, l }) => (
                      <div key={l} className="rounded-xl px-3 py-1.5 text-center"
                        style={{ background: `${c}12`, border: `1px solid ${c}30` }}>
                        <p className="text-sm font-black" style={{ color: c }}>{v}{l === "Kcal" ? "" : "g"}</p>
                        <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.35)" }}>Ingredienti</p>
                    <div className="space-y-1">
                      {meal.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "rgba(245,240,232,0.7)" }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
                          {ing}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs mt-4 text-center" style={{ color: "rgba(245,240,232,0.25)" }}>
        Piano generato in base ai tuoi macro target · le porzioni si adattano automaticamente
      </p>
    </div>
  );
}

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

type Tab = "allenamento" | "dieta" | "integratori" | "record";

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
  const isUnlimited     = plan.total_weeks === 0;
  // null = no percentage (unlimited plan)
  const pct: number | null = isUnlimited ? null : Math.round((weeksCompleted / plan.total_weeks) * 100);

  // ── Streak (consecutive calendar days with a log) ─────────────────────────
  const logsByDayGlobal = new Map<string, number>();
  logs.forEach(l => {
    const day = new Date(l.loggedAt).toISOString().slice(0, 10);
    logsByDayGlobal.set(day, (logsByDayGlobal.get(day) ?? 0) + 1);
  });
  let streak = 0;
  const sortedLogDays = Array.from(logsByDayGlobal.keys()).sort();
  if (sortedLogDays.length > 0) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDay  = sortedLogDays[sortedLogDays.length - 1];
    const diffToday = Math.floor((new Date(todayStr).getTime() - new Date(lastDay).getTime()) / 86400000);
    if (diffToday <= 1) {
      streak = 1;
      let prev = lastDay;
      for (let i = sortedLogDays.length - 2; i >= 0; i--) {
        const cur = sortedLogDays[i];
        const gap = Math.floor((new Date(prev).getTime() - new Date(cur).getTime()) / 86400000);
        if (gap === 1) { streak++; prev = cur; } else break;
      }
    }
  }

  // ── Day on journey ───────────────────────────────────────────────────────
  const firstLogDate = logs.length > 0
    ? new Date(Math.min(...logs.map(l => new Date(l.loggedAt).getTime())))
    : null;
  const dayOnJourney = firstLogDate
    ? Math.floor((Date.now() - firstLogDate.getTime()) / 86400000) + 1
    : null;

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
    { icon: "🔥", label: "3 giorni di fila",  unlocked: streak >= 3 },
    { icon: "📅", label: "Settimana 1",       unlocked: currentWeek >= 1 },
    { icon: "💪", label: "Settimana 3",       unlocked: currentWeek >= 3 },
    { icon: "⚡", label: "20 registrazioni",  unlocked: totalLogs >= 20 },
    { icon: "🏆", label: "Metà programma",    unlocked: !isUnlimited && pct !== null && pct >= 50 },
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

        {/* ── Messaggio dal Trainer ─────────────────────────────────────────── */}
        {plan.description && (
          <div className="mb-4 p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(229,50,50,0.07), rgba(255,154,108,0.03))",
              border: "1px solid rgba(229,50,50,0.22)",
            }}>
            <div className="absolute top-2 right-4 text-7xl font-black leading-none select-none pointer-events-none"
              style={{ color: "rgba(229,50,50,0.07)", fontFamily: "Georgia, serif", lineHeight: 1 }}>
              &ldquo;
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(229,50,50,0.14)", border: "1px solid rgba(229,50,50,0.28)" }}>
                <MessageSquare size={15} style={{ color: "var(--accent)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "rgba(229,50,50,0.65)", letterSpacing: "0.12em" }}>
                  Messaggio dal tuo Trainer
                </p>
                <p className="text-sm leading-relaxed"
                  style={{ color: "rgba(245,240,232,0.82)", fontStyle: "italic" }}>
                  &ldquo;{plan.description}&rdquo;
                </p>
                <p className="text-xs mt-3 font-semibold"
                  style={{ color: "rgba(229,50,50,0.48)" }}>
                  — Il tuo Trainer
                </p>
              </div>
            </div>
          </div>
        )}

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
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>
              +10 XP per sessione · +50 XP per settimana completata
            </p>
            {dayOnJourney !== null && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: "rgba(245,240,232,0.06)", color: "rgba(245,240,232,0.45)" }}>
                Giorno {dayOnJourney}
              </span>
            )}
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            {
              label: "Settimane",
              value: isUnlimited ? `${weeksCompleted}` : `${weeksCompleted}/${plan.total_weeks}`,
              sub: isUnlimited ? "piano aperto" : "completate",
              icon: <Trophy size={13} style={{ color: "#fbbf24" }} />,
            },
            {
              label: "Streak",
              value: `${streak}`,
              sub: streak === 1 ? "giorno" : "giorni di fila",
              icon: <Flame size={13} style={{ color: "var(--accent)" }} />,
            },
            {
              label: "Sessioni salvate",
              value: String(totalLogs),
              sub: "totali",
              icon: <Zap size={13} style={{ color: "#a78bfa" }} />,
            },
            {
              label: "Giorni / sett.",
              value: `${plan.days_per_week}`,
              sub: "nel programma",
              icon: <Dumbbell size={13} style={{ color: "#38bdf8" }} />,
            },
          ].map(({ label, value, sub, icon }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
              <p className="text-xl font-black" style={{ color: "var(--ivory)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.38)" }}>{label}</p>
              <p className="text-xs" style={{ color: "rgba(245,240,232,0.22)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Program progress bar (hidden for unlimited plans) ──────────────── */}
        {!isUnlimited && pct !== null && (
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
        )}

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
            { key: "allenamento"  as Tab, icon: Dumbbell,        label: "Scheda" },
            { key: "record"       as Tab, icon: Trophy,           label: "Record" },
            { key: "dieta"        as Tab, icon: UtensilsCrossed,  label: `Dieta${diets.length > 0 ? ` (${diets.length})` : ""}` },
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

        {/* ── RECORD tab ──────────────────────────────────────────────────────── */}
        {tab === "record" && (() => {
          // ── Personal Records ──────────────────────────────────────────────
          const prMap = new Map<string, { weight: number; week: number; date: string; isThisWeek: boolean }>();
          const currentWeekNum = logs.length > 0 ? Math.max(...logs.map(l => l.weekNumber)) : 0;
          plan.exercises.forEach(ex => {
            let best = 0;
            let bestLog: typeof logs[0] | null = null;
            logs.filter(l => l.exerciseId === ex.id).forEach(l => {
              const w = l.weight ?? 0;
              if (w > best) { best = w; bestLog = l; }
              try {
                const sets = JSON.parse(l.reps ?? "");
                if (Array.isArray(sets) && sets[0] && "w" in sets[0]) {
                  const maxW = Math.max(...sets.map((s: { w: string }) => parseFloat(s.w) || 0));
                  if (maxW > best) { best = maxW; bestLog = l; }
                }
              } catch {}
            });
            if (bestLog && best > 0) {
              const prev = prMap.get(ex.name);
              if (!prev || best > prev.weight) {
                prMap.set(ex.name, {
                  weight: best,
                  week: (bestLog as typeof logs[0]).weekNumber,
                  date: (bestLog as typeof logs[0]).loggedAt,
                  isThisWeek: (bestLog as typeof logs[0]).weekNumber === currentWeekNum,
                });
              }
            }
          });
          const prs = Array.from(prMap.entries())
            .sort((a, b) => b[1].weight - a[1].weight);

          // ── Training heatmap ───────────────────────────────────────────────
          const today = new Date();
          const heatDays = Array.from({ length: 56 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (55 - i));
            return d.toISOString().slice(0, 10);
          });
          const logsByDay = logsByDayGlobal;
          const totalTrainingDays = logsByDay.size;
          const weekLabels = ["L", "M", "M", "G", "V", "S", "D"];
          const firstDow = (new Date(heatDays[0]).getDay() + 6) % 7; // Monday=0

          return (
            <div className="space-y-5">
              {/* Heatmap */}
              <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ color: "var(--ivory)" }}>Attività — ultimi 8 settimane</p>
                  <span className="text-xs font-bold" style={{ color: "var(--accent-light)" }}>{totalTrainingDays} giorni allenati</span>
                </div>
                {/* Day labels */}
                <div className="flex gap-1 mb-1 pl-0">
                  {weekLabels.map((l, i) => (
                    <div key={i} className="text-center flex-1 text-xs" style={{ color: "rgba(245,240,232,0.25)", fontSize: "0.6rem" }}>{l}</div>
                  ))}
                </div>
                {/* Grid: 7 cols × 8 rows */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                  {Array.from({ length: firstDow }, (_, i) => (
                    <div key={`e${i}`} style={{ aspectRatio: "1", borderRadius: "3px" }} />
                  ))}
                  {heatDays.map(day => {
                    const count = logsByDay.get(day) ?? 0;
                    const isToday = day === today.toISOString().slice(0, 10);
                    return (
                      <div key={day} title={`${day}: ${count} log`}
                        style={{
                          aspectRatio: "1",
                          borderRadius: "3px",
                          background: count === 0
                            ? "rgba(255,255,255,0.05)"
                            : count <= 2
                              ? "rgba(229,50,50,0.35)"
                              : "rgba(229,50,50,0.75)",
                          border: isToday ? "1px solid rgba(229,50,50,0.8)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <span className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>meno</span>
                  {["rgba(255,255,255,0.05)", "rgba(229,50,50,0.25)", "rgba(229,50,50,0.5)", "rgba(229,50,50,0.8)"].map((bg, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />
                  ))}
                  <span className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>più</span>
                </div>
              </div>

              {/* Personal Records */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--ivory)" }}>Personal Record</p>
                  <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{prs.length} esercizi tracciati</span>
                </div>
                {prs.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "rgba(245,240,232,0.35)" }}>
                    <p className="text-sm">Ancora nessun record.</p>
                    <p className="text-xs mt-1">Inserisci i pesi durante l&apos;allenamento e i tuoi PR appariranno qui.</p>
                  </div>
                ) : (
                  <div>
                    {prs.map(([name, pr], idx) => (
                      <div key={name}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: idx < prs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
                          style={{
                            background: idx === 0 ? "rgba(255,210,63,0.18)" : idx === 1 ? "rgba(200,200,200,0.12)" : idx === 2 ? "rgba(205,127,50,0.12)" : "rgba(255,255,255,0.05)",
                            color: idx === 0 ? "#fbbf24" : idx === 1 ? "#d1d5db" : idx === 2 ? "#cd7f32" : "rgba(245,240,232,0.35)",
                          }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--ivory)" }}>{name}</p>
                          <p className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                            Sett. {pr.week} · {new Date(pr.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {pr.isThisWeek && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                              Nuovo!
                            </span>
                          )}
                          <span className="text-base font-black" style={{ color: "var(--accent)" }}>
                            {pr.weight} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
            ) : null}

            {/* ── 7-day meal plan ── */}
            {diets.length > 0 && (() => {
              const d = diets[0];
              return (
                <div className="mb-6 rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(229,50,50,0.2)", background: "linear-gradient(135deg,rgba(229,50,50,0.06),rgba(13,11,30,0.6))" }}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(229,50,50,0.12)", border: "1px solid rgba(229,50,50,0.2)" }}>
                      <Calendar size={18} style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-black" style={{ color: "var(--ivory)" }}>Piano alimentare 7 giorni</p>
                      <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
                        Pasti calcolati sui tuoi macro · {d.calories} kcal al giorno
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <WeeklyDietPlan
                      calories={d.calories}
                      protein={d.protein}
                      carbs={d.carbs}
                      fat={d.fat}
                    />
                  </div>
                </div>
              );
            })()}

            {diets.length > 0 && (
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
