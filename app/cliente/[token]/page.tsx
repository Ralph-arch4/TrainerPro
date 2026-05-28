"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbExerciseLogs } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import type { Exercise, ExerciseLog, SupplementItem } from "@/lib/store";
import { Dumbbell, UtensilsCrossed, ShoppingBag, Loader2, AlertCircle, Copy, Check, Zap, Trophy, Flame, ChevronDown, ChevronUp, Calendar, MessageSquare, Scan, ShieldCheck, Brain, Sparkles, Trash2, Upload } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { FitnessScanAnalysis } from "@/lib/db";

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
              background: selectedDay === i ? "rgba(229,50,50,0.18)" : "var(--surface-sm)",
              border: `1px solid ${selectedDay === i ? "rgba(229,50,50,0.4)" : "var(--surface-md)"}`,
              color: selectedDay === i ? "var(--accent-light)" : "var(--text-muted)",
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
            style={{ background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-black" style={{ color }}>{val}</p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>{label}</p>
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
              style={{ border: "1px solid var(--border)", background: "var(--surface-xs)" }}>
              {/* Header */}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.03]"
                onClick={() => setExpanded(isOpen ? null : key)}>
                <span className="text-lg">{MEAL_ICONS[slot]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-dim)" }}>
                    {slot.charAt(0).toUpperCase() + slot.slice(1)} · {targetKcal} kcal
                  </p>
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{meal.name}</p>
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
                {isOpen ? <ChevronUp size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }} />}
              </button>

              {/* Expanded: ingredients + macros mobile */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
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
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Ingredienti</p>
                    <div className="space-y-1">
                      {meal.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
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

      <p className="text-xs mt-4 text-center" style={{ color: "var(--text-faint)" }}>
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

type Tab = "allenamento" | "dieta" | "integratori" | "record" | "scan";

// ── Image resize (client-side canvas) ────────────────────────────────────────
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      const r = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * r);
      canvas.height = Math.round(img.height * r);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("blob")), "image/jpeg", 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Client scan type (returned by /api/fitness-scan/client) ──────────────────
interface ClientScan {
  id: string;
  taken_at: string;
  notes: string | null;
  ai_analysis: FitnessScanAnalysis | null;
  signed_url: string | null;
  created_at: string;
}

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
          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{item.name}</p>
          {item.brand && <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{item.brand}</p>}
        </div>
        <ShoppingBag size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
      </div>
      {item.notes && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.notes}</p>}
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
              background: copied ? "rgba(52,211,153,0.12)" : "var(--surface-md)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "var(--surface-md)"}`,
              color: copied ? "#34d399" : "var(--text-muted)",
            }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copiato!" : `Codice: ${item.discountCode}`}
          </button>
        )}
      </div>
    </div>
  );
}

function SignatureStroke({ name }: { name: string }) {
  // Path length is fixed at ~148; varies slightly by name length but animation still works
  const pathLen = 148;
  return (
    <svg width="118" height="20" viewBox="0 0 118 20" fill="none"
      aria-hidden="true"
      style={{ display: "block", marginTop: 3, overflow: "visible" }}>
      {/* Main signature flourish — flowing bezier */}
      <path
        d="M2 14 C12 7, 24 17, 38 11 C52 5, 60 16, 74 10 C88 4, 100 15, 116 9"
        stroke="rgba(229,50,50,0.52)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: pathLen,
          strokeDashoffset: pathLen,
          animation: "signatureDraw 1.5s cubic-bezier(.4,0,.2,1) 0.55s forwards",
        }}
      />
      {/* Terminal dot — appears after the line finishes */}
      <circle cx="116" cy="9" r="1.8" fill="rgba(229,50,50,0.52)"
        style={{ animation: "signatureFlare 0.45s ease-out 2.05s both" }}
      />
      {/* Subtle name-length underline echo */}
      <line
        x1="2" y1="18" x2={Math.min(8 + name.length * 6.2, 116)} y2="18"
        stroke="rgba(229,50,50,0.14)"
        strokeWidth="0.8"
        strokeLinecap="round"
        style={{
          strokeDasharray: 120,
          strokeDashoffset: 120,
          animation: "signatureDraw 0.9s ease-out 2.3s forwards",
        }}
      />
    </svg>
  );
}

function ProgramCard({ planName, trainerName, daysPerWeek, totalWeeks, shareToken, level, levelName, xpPct }: {
  planName: string; trainerName: string; daysPerWeek: number; totalWeeks: number; shareToken: string;
  level: number; levelName: string; xpPct: number;
}) {
  const initials = trainerName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "PT";
  const cardNum  = shareToken.replace(/-/g, "").toUpperCase().slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  return (
    <div className="mb-5 rounded-3xl overflow-hidden relative select-none holo-card"
      style={{ background: "linear-gradient(135deg, rgba(12,4,4,0.98) 0%, rgba(45,8,8,0.92) 55%, rgba(18,6,6,0.98) 100%)", border: "1px solid rgba(229,50,50,0.22)", boxShadow: "0 8px 32px rgba(229,50,50,0.1), inset 0 1px 0 var(--border-subtle)" }}>
      {/* Holographic shimmer overlay */}
      <div className="holo-shimmer" />
      <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(229,50,50,0.09) 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
      {/* Dot-matrix hologram pattern */}
      <div className="absolute bottom-7 right-4 pointer-events-none"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", opacity: 0.07 }}>
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ivory)" }} />
        ))}
      </div>
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(229,50,50,0.18)", border: "1px solid rgba(229,50,50,0.32)" }}>
              <span className="text-xs font-black" style={{ color: "var(--accent)", lineHeight: 1 }}>TP</span>
            </div>
            <span className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: "var(--text-dim)" }}>TrainerPro</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Gold EMV chip */}
            <div style={{
              width: 34, height: 24, borderRadius: 4, flexShrink: 0, position: "relative", overflow: "hidden",
              background: "linear-gradient(135deg, #c8a84b 0%, #f0d060 35%, #b07828 65%, #e8c840 100%)",
              border: "1px solid rgba(255,215,50,0.45)",
              boxShadow: "0 1px 5px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.28)",
            }}>
              <div style={{ position: "absolute", inset: "3px 5px", display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: "2px" }}>
                {[0,1,2].map(i => <div key={i} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 1 }} />)}
              </div>
              <div style={{ position: "absolute", top: 3, bottom: 3, left: "50%", width: 1, background: "rgba(0,0,0,0.14)", transform: "translateX(-50%)" }} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                style={{ background: "rgba(229,50,50,0.1)", border: "1px solid rgba(229,50,50,0.22)", color: "rgba(229,50,50,0.75)" }}>
                Piano Attivo
              </span>
              <span className="font-black uppercase tracking-wider"
                style={{ background: "linear-gradient(90deg,#7B2FBE,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontSize: "0.6rem", letterSpacing: "0.14em" }}>
                Lv.{level} {levelName}
              </span>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-black tracking-tight leading-tight mb-1" style={{ color: "var(--text)" }}>{planName}</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
          {daysPerWeek} giorni/settimana · {totalWeeks > 0 ? `${totalWeeks} settimane` : "piano continuo"}
        </p>
        <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, rgba(229,50,50,0.28), transparent)" }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] mb-1" style={{ color: "var(--text-faint)" }}>Firmato da</p>
            {/* Trainer signature — serif italic for handwritten feel */}
            <p className="text-base font-black" style={{ color: "var(--text)", fontStyle: "italic", fontFamily: "Georgia,'Times New Roman',serif", letterSpacing: "0.02em" }}>{trainerName}</p>
            <SignatureStroke name={trainerName} />
          </div>
          <div className="relative" style={{ width: 68, height: 68, flexShrink: 0 }}>
            {/* XP progress ring */}
            <svg width="68" height="68" viewBox="0 0 68 68" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="xpRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7B2FBE" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <circle cx="34" cy="34" r="30" fill="none" stroke="rgba(123,47,190,0.12)" strokeWidth="3.5" />
              <circle cx="34" cy="34" r="30" fill="none" stroke="url(#xpRingGrad)" strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - xpPct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)", filter: "drop-shadow(0 0 4px rgba(167,139,250,0.6))" }}
              />
            </svg>
            {/* Glow */}
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "rgba(229,50,50,0.24)", filter: "blur(7px)" }} />
            {/* Trainer initials */}
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 38% 32%, rgba(229,50,50,0.32), rgba(8,8,8,0.9))", border: "1.5px solid rgba(229,50,50,0.55)" }}>
              <span className="text-base font-black" style={{ color: "var(--accent)" }}>{initials}</span>
            </div>
            {/* Level badge */}
            <div style={{ position: "absolute", bottom: 1, right: 1, width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#7B2FBE,#a78bfa)", border: "2px solid var(--black)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 8px rgba(123,47,190,0.55)" }}>
              <span style={{ color: "#fff", fontSize: "0.55rem", fontWeight: 900, lineHeight: 1 }}>{level}</span>
            </div>
          </div>
        </div>
        <p className="text-xs mt-3 font-mono" style={{ color: "var(--text-faint)", letterSpacing: "0.16em" }}>{cardNum}</p>
      </div>
      <div className="h-1" style={{ background: "linear-gradient(90deg, var(--accent), rgba(229,50,50,0.15), transparent)" }} />
    </div>
  );
}

const TRAINER_REACTIONS = [
  "Ottima sessione! Sento la tua dedizione da qui.",
  "Bravissimo! Ogni rep registrata è un mattone sul tuo progresso.",
  "Ecco la costanza che fa la differenza. Continua così.",
  "Sei in forma! Stai costruendo qualcosa di cui essere orgoglioso.",
  "Perfetto! I risultati arrivano a chi non molla mai.",
  "Registro ricevuto — sto seguendo ogni tuo progresso.",
  "Questo è l'atteggiamento giusto. Sono fiero di te.",
  "Sessione completata! Il tuo futuro-io ti ringrazierà.",
];

const WEEKLY_PRINCIPLES: { cat: string; text: string; accent: string }[] = [
  { cat: "Allenamento",  text: "La progressione non è una linea retta — ogni plateau nasconde il tuo prossimo salto.", accent: "var(--accent)" },
  { cat: "Recupero",     text: "Il muscolo non cresce durante l'allenamento, ma nel riposo. Il sonno è parte del programma.", accent: "#a78bfa" },
  { cat: "Nutrizione",   text: "Non esiste il pasto perfetto — esiste la settimana perfetta. Ogni scelta è solo un'occasione.", accent: "#38bdf8" },
  { cat: "Mentalità",    text: "La coerenza batte la perfezione ogni giorno della settimana, senza eccezioni.", accent: "#fbbf24" },
  { cat: "Allenamento",  text: "Forma prima del carico — sempre. Un kg in più non vale una settimana di stop.", accent: "var(--accent)" },
  { cat: "Recupero",     text: "L'idratazione non è un dettaglio. Ogni cellula muscolare funziona meglio con l'acqua.", accent: "#a78bfa" },
  { cat: "Nutrizione",   text: "Le proteine non costruiscono solo muscolo — riparano, proteggono, tengono sazi.", accent: "#38bdf8" },
  { cat: "Mentalità",    text: "Misura i progressi in mesi, non in giorni. Il corpo ha i suoi tempi — rispettali.", accent: "#fbbf24" },
  { cat: "Allenamento",  text: "Il riscaldamento non è facoltativo. Prepara il sistema nervoso prima del sistema muscolare.", accent: "var(--accent)" },
  { cat: "Recupero",     text: "Dopo uno sforzo intenso, il corpo chiede 48 ore. Dargliele non è debolezza — è strategia.", accent: "#a78bfa" },
  { cat: "Nutrizione",   text: "Mangia per alimentare l'allenamento di domani, non solo per recuperare quello di oggi.", accent: "#38bdf8" },
  { cat: "Mentalità",    text: "La motivazione parte il motore. La disciplina lo tiene acceso.", accent: "#fbbf24" },
  { cat: "Allenamento",  text: "Ogni ripetizione conta doppio: una per il muscolo, una per la tua testa.", accent: "var(--accent)" },
  { cat: "Recupero",     text: "Lo stress mentale è stress fisico. Gestisci l'uno e migliori anche l'altro.", accent: "#a78bfa" },
  { cat: "Nutrizione",   text: "I carboidrati sono benzina, non nemici. Scegli la qualità, non l'assenza.", accent: "#38bdf8" },
  { cat: "Mentalità",    text: "Il confronto con gli altri frena. Il confronto con te stesso di 3 mesi fa accelera.", accent: "#fbbf24" },
  { cat: "Allenamento",  text: "Più forza significa meno infortuni. L'allenamento non ti logora — ti corazza.", accent: "var(--accent)" },
  { cat: "Recupero",     text: "Lo stretching post-allenamento non è un optional — è l'ultima serie del giorno.", accent: "#a78bfa" },
  { cat: "Nutrizione",   text: "I grassi sani supportano gli ormoni che supportano il tuo allenamento. Non eliminarli.", accent: "#38bdf8" },
  { cat: "Mentalità",    text: "Ogni sessione saltata non è una colpa — è un dato. Prendi nota e riprogramma.", accent: "#fbbf24" },
];

function WeeklyPrincipleCard({ trainerName }: { trainerName: string }) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const p = WEEKLY_PRINCIPLES[(weekNum - 1) % WEEKLY_PRINCIPLES.length];
  return (
    <div className="mb-4 rounded-2xl p-5 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${p.accent}0d, rgba(8,8,8,0.6))`, border: `1px solid ${p.accent}28` }}>
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${p.accent}12, transparent)` }} />
      <p className="text-xs font-black uppercase tracking-[0.16em] mb-2.5" style={{ color: p.accent, opacity: 0.75 }}>
        Principio della settimana · Sett. {weekNum}
      </p>
      <p className="text-base font-black leading-relaxed mb-3"
        style={{ color: "var(--text)", fontStyle: "italic", fontFamily: "Georgia,'Times New Roman',serif" }}>
        &ldquo;{p.text}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: `${p.accent}14`, color: p.accent, border: `1px solid ${p.accent}22` }}>
          {p.cat}
        </span>
        <p className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>— {trainerName}</p>
      </div>
    </div>
  );
}

const JOURNEY_MILESTONES = [
  { days: 7,   label: "1 settimana",   msg: "Il tuo percorso è ufficialmente iniziato. Ogni rep conta." },
  { days: 14,  label: "2 settimane",   msg: "Due settimane. Stai costruendo qualcosa di reale." },
  { days: 30,  label: "1 mese",        msg: "Un mese insieme. Il cambiamento è già in atto — anche se non lo vedi ancora allo specchio." },
  { days: 60,  label: "2 mesi",        msg: "Due mesi di lavoro costante. I risultati si vedono perché ci sei ogni volta." },
  { days: 90,  label: "3 mesi",        msg: "Un trimestre di dedizione. Pochi arrivano fin qui — tu ci sei." },
  { days: 180, label: "6 mesi",        msg: "Metà anno. Una trasformazione autentica, costruita giorno per giorno." },
  { days: 365, label: "1 anno",        msg: "Un anno intero insieme. Questo non è più un programma — è il tuo stile di vita." },
];

function MilestoneBanner({ dayOnJourney, trainerName }: { dayOnJourney: number | null; trainerName: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dayOnJourney === null || dismissed) return null;
  const hit = JOURNEY_MILESTONES.find(m => dayOnJourney >= m.days && dayOnJourney < m.days + 7);
  if (!hit) return null;
  return (
    <div className="mb-4 rounded-2xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(229,50,50,0.1), rgba(255,154,108,0.04))", border: "1px solid rgba(229,50,50,0.3)" }}>
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(229,50,50,0.1), transparent)" }} />
      <button onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold"
        style={{ background: "var(--surface-md)", color: "var(--text-dim)" }}>
        &times;
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(229,50,50,0.65)", letterSpacing: "0.13em" }}>
          Traguardo raggiunto
        </p>
      </div>
      <p className="text-xl font-black mb-1.5" style={{ color: "var(--text)" }}>
        {hit.label} insieme
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
        &ldquo;{hit.msg}&rdquo;
      </p>
      <p className="text-xs mt-3 font-semibold" style={{ color: "rgba(229,50,50,0.48)" }}>
        — {trainerName}
      </p>
    </div>
  );
}

function TrainerVoiceCard({ trainerName, daysSinceLastLog, streak, totalLogs }: {
  trainerName: string; daysSinceLastLog: number | null; streak: number; totalLogs: number;
}) {
  const initials = trainerName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "PT";

  let message: string;
  let color = "var(--accent)";

  if (totalLogs === 0) {
    message = `Benvenuto! Sono pronto ad accompagnarti in questo percorso. Inizia dalla prima settimana quando vuoi — ci sono.`;
    color = "var(--accent)";
  } else if (daysSinceLastLog === null || daysSinceLastLog === 0) {
    if (streak >= 5) {
      message = `${streak} giorni di fila — questo è il livello che fa la differenza. Sono fiero di te.`;
      color = "#fbbf24";
    } else {
      message = `Ottimo lavoro oggi! Ogni sessione che completi mi rende orgoglioso di lavorare con te.`;
      color = "#22c55e";
    }
  } else if (daysSinceLastLog === 1) {
    message = `Pronto per oggi? Ieri hai fatto bene — continua su questa strada.`;
    color = "var(--accent)";
  } else if (daysSinceLastLog <= 3) {
    message = `Qualche giorno di pausa fa parte del piano. Riprendi da dove hai lasciato — sai già come si fa.`;
    color = "var(--accent)";
  } else if (daysSinceLastLog <= 7) {
    message = `Ti stavo pensando. ${daysSinceLastLog} giorni si recuperano in fretta — ricomincia con una sessione leggera e il ritmo torna subito.`;
    color = "#fbbf24";
  } else {
    message = `Sono qui quando vuoi riprendere. Non importa quanto tempo è passato — il programma ti aspetta esattamente dove l'hai lasciato.`;
    color = "#fbbf24";
  }

  const timeLabel = daysSinceLastLog === null
    ? "in attesa"
    : daysSinceLastLog === 0
      ? "oggi attivo"
      : daysSinceLastLog === 1
        ? "ieri"
        : `${daysSinceLastLog}g fa`;

  return (
    <div className="mb-4 rounded-2xl p-4 relative overflow-hidden"
      style={{ background: "var(--surface-xs)", border: `1px solid ${color}28` }}>
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base"
            style={{ background: `radial-gradient(circle at 38% 32%, ${color}35, rgba(8,8,8,0.92))`, border: `1.5px solid ${color}55` }}>
            <span style={{ color, fontStyle: "normal" }}>{initials}</span>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ borderColor: "var(--black)", background: color, boxShadow: `0 0 7px ${color}` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs font-bold" style={{ color }}>{trainerName}</p>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: `${color}18`, color, fontSize: "0.6rem" }}>
              {timeLabel}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            &ldquo;{message}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Athlete Status Band ──────────────────────────────────────────────────────
function AthleteStatusBand({ dayOnJourney, streak }: {
  dayOnJourney: number | null; streak: number;
}) {
  return (
    <div className="mb-4 rounded-2xl overflow-hidden"
      style={{ background: "rgba(10,10,10,0.6)", border: "1px solid rgba(229,50,50,0.15)" }}>
      <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(229,50,50,0.55),transparent)" }} />
      <div className="flex items-stretch">
        {/* LIVE dot */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderRight: "1px solid rgba(229,50,50,0.12)" }}>
          <span className="pulse-glow" style={{ display: "block", width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
          <span className="text-xs font-black tracking-[0.18em] uppercase" style={{ color: "rgba(34,197,94,0.85)" }}>Live</span>
        </div>
        {/* Day counter */}
        <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3"
          style={{ borderRight: "1px solid rgba(229,50,50,0.12)" }}>
          <Calendar size={11} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {dayOnJourney !== null ? `Giorno ${dayOnJourney} del percorso` : "Percorso non ancora iniziato"}
          </span>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-4 py-3 flex-shrink-0">
          <Flame size={11} style={{ color: streak > 0 ? "var(--accent)" : "var(--text-faint)", flexShrink: 0 }} />
          <span className="text-xs font-bold" style={{ color: streak > 0 ? "var(--accent)" : "var(--text-faint)" }}>
            {streak > 0 ? `${streak}gg streak` : "0 streak"}
          </span>
        </div>
      </div>
      <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(229,50,50,0.25),transparent)" }} />
    </div>
  );
}

// ── Pre-Session Mood Check-In ────────────────────────────────────────────────
const MOODS = [
  { id: "energy", emoji: "⚡", label: "Carico",  color: "#22c55e",      msg: "Ottimo! Canalizziamo questa energia — oggi spingi sui carichi e non aver paura di osare." },
  { id: "normal", emoji: "💪", label: "Pronto",  color: "var(--accent)", msg: "Perfetto. Sei qui, e questo è già metà della vittoria. Lavoriamo insieme." },
  { id: "tired",  emoji: "😴", label: "Stanco",  color: "#fbbf24",      msg: "Ti sento. Anche una sessione leggera oggi vale più di zero — ascolta il corpo e dai quello che puoi." },
] as const;
type MoodId = typeof MOODS[number]["id"];

function MoodCheckIn({ trainerName }: { trainerName: string }) {
  const todayKey = `mood_${new Date().toISOString().slice(0, 10)}`;
  const [mood, setMood] = useState<MoodId | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(todayKey) as MoodId) ?? null;
  });

  function pick(id: MoodId) {
    localStorage.setItem(todayKey, id);
    setMood(id);
  }

  const selected = mood ? MOODS.find(m => m.id === mood)! : null;

  if (selected) {
    return (
      <div className="mb-4 rounded-2xl p-4 flex items-start gap-3"
        style={{ background: "var(--surface-xs)", border: `1px solid ${selected.color}28` }}>
        <span style={{ fontSize: "1.3rem", lineHeight: 1, marginTop: 1 }}>{selected.emoji}</span>
        <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          &ldquo;{selected.msg}&rdquo;{" "}
          <span className="not-italic font-bold" style={{ color: selected.color }}>— {trainerName}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl p-4"
      style={{ background: "var(--surface-xs)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] mb-3"
        style={{ color: "var(--text-dim)" }}>
        Come ti senti oggi?
      </p>
      <div className="flex gap-2">
        {MOODS.map(m => (
          <button key={m.id} onClick={() => pick(m.id)}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
            style={{ background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "1.5rem" }}>{m.emoji}</span>
            <span className="text-xs font-bold" style={{ color: m.color }}>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Radar Atletico ───────────────────────────────────────────────────────────
const RADAR_AXES = [
  { label: "Costanza",  color: "var(--accent)" },
  { label: "Volume",    color: "#a78bfa" },
  { label: "Livello",   color: "#38bdf8" },
  { label: "Programma", color: "#fbbf24" },
  { label: "Attività",  color: "#22c55e" },
] as const;

function RadarAtletico({ streak, totalLogs, level, pct, recentDays }: {
  streak: number; totalLogs: number; level: number; pct: number | null; recentDays: number;
}) {
  const values = [
    Math.min(streak / 7, 1),
    Math.min(totalLogs / 25, 1),
    Math.min((level - 1) / 4, 1),
    pct !== null ? pct / 100 : 0.5,
    Math.min(recentDays / 12, 1),
  ];
  const C = 110; const R = 78; const SIZE = 220;
  const angles = Array.from({ length: 5 }, (_, i) => ((-90 + 72 * i) * Math.PI) / 180);
  const pt = (v: number, i: number) => ({ x: C + v * R * Math.cos(angles[i]), y: C + v * R * Math.sin(angles[i]) });
  const gridPaths = [0.25, 0.5, 0.75, 1].map(r =>
    angles.map((_, i) => pt(r, i)).map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z"
  );
  const dataPts = values.map((v, i) => pt(Math.max(v, 0.06), i));
  const dataPath = dataPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const score = Math.round(values.reduce((a, b) => a + b, 0) / 5 * 100);

  return (
    <div className="mb-4 rounded-2xl p-4" style={{ border: "1px solid rgba(229,50,50,0.18)", background: "var(--surface-xs)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--text-dim)" }}>Radar Atletico</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>DNA della tua performance</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: "var(--accent)" }}>
            {score}<span className="text-sm font-bold">/100</span>
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>score globale</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0" style={{ maxWidth: 160, height: "auto" }}>
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(229,50,50,0.38)" />
              <stop offset="100%" stopColor="rgba(229,50,50,0.06)" />
            </radialGradient>
            <filter id="radarGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {gridPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(229,50,50,0.1)" strokeWidth="0.8" />)}
          {angles.map((a, i) => (
            <line key={i} x1={C} y1={C}
              x2={(C + R * Math.cos(a)).toFixed(1)} y2={(C + R * Math.sin(a)).toFixed(1)}
              stroke="rgba(229,50,50,0.12)" strokeWidth="0.8" />
          ))}
          <path d={dataPath} fill="url(#radarFill)" stroke="rgba(229,50,50,0.75)" strokeWidth="1.6"
            filter="url(#radarGlow)" style={{ animation: "fadeIn 0.9s ease-out forwards" }} />
          {dataPts.map((p, i) => (
            <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5"
              fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 5px rgba(229,50,50,0.85))" }} />
          ))}
          {RADAR_AXES.map((ax, i) => {
            const lx = C + (R + 19) * Math.cos(angles[i]);
            const ly = C + (R + 19) * Math.sin(angles[i]);
            return (
              <text key={i} x={lx.toFixed(1)} y={ly.toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                style={{ fill: "var(--text-dim)", fontSize: "9px", fontWeight: 700, fontFamily: "inherit" }}>
                {ax.label}
              </text>
            );
          })}
        </svg>
        <div className="flex-1 space-y-2.5">
          {RADAR_AXES.map((ax, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-bold" style={{ color: ax.color }}>{ax.label}</p>
                <p className="text-xs font-black" style={{ color: "var(--text)" }}>{Math.round(values[i] * 100)}</p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(values[i] * 100)}%`, background: ax.color, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
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
  const [trainerName, setTrainerName] = useState("Il tuo Trainer");
  const [trainerReaction, setTrainerReaction] = useState<string | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fitness Scan state
  const [scans, setScans] = useState<ClientScan[]>([]);
  const [scansLoaded, setScansLoaded] = useState(false);
  const [scansLoading, setScansLoading] = useState(false);
  const [scanUploading, setScanUploading] = useState(false);
  const [scanDeleting, setScanDeleting] = useState<string | null>(null);
  const [scanUploadDate, setScanUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [scanUploadNotes, setScanUploadNotes] = useState("");
  const [scanUploadError, setScanUploadError] = useState<string | null>(null);
  const [scanUploadSuccess, setScanUploadSuccess] = useState(false);

  async function loadScans(force = false) {
    if ((scansLoaded && !force) || !token || scansLoading) return;
    setScansLoading(true);
    try {
      const resp = await fetch(`/api/fitness-scan/client?token=${encodeURIComponent(token)}`);
      if (!resp.ok) throw new Error(`${resp.status}`);
      const { scans: list } = await resp.json();
      setScans(list ?? []);
      setScansLoaded(true);
    } catch {
      // Leave scansLoaded false so retry is possible on next tab open
    } finally {
      setScansLoading(false);
    }
  }

  async function handleScanUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || !token) return;
    e.target.value = "";
    setScanUploading(true);
    setScanUploadError(null);
    setScanUploadSuccess(false);
    try {
      const resized = await resizeImage(file);
      const fd = new FormData();
      fd.append("token",    token);
      fd.append("taken_at", scanUploadDate);
      if (scanUploadNotes) fd.append("notes", scanUploadNotes);
      fd.append("file", resized, "scan.jpg");
      const resp = await fetch("/api/fitness-scan/client", { method: "POST", body: fd });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        const code = (json as { error?: string }).error ?? `errore ${resp.status}`;
        throw new Error(code);
      }
      const { scan } = await resp.json();
      setScans(prev => [scan, ...prev]);
      setScanUploadNotes("");
      setScanUploadSuccess(true);
      setTimeout(() => setScanUploadSuccess(false), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "errore sconosciuto";
      setScanUploadError(msg);
    } finally {
      setScanUploading(false);
    }
  }

  async function handleScanDelete(scan: ClientScan) {
    if (!token) return;
    setScanDeleting(scan.id);
    setScans(prev => prev.filter(s => s.id !== scan.id));
    try {
      await fetch(`/api/fitness-scan/client?token=${encodeURIComponent(token)}&id=${scan.id}`, { method: "DELETE" });
    } catch { setScans(prev => [scan, ...prev]); }
    setScanDeleting(null);
  }

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
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      setTrainerReaction(TRAINER_REACTIONS[Math.floor(Math.random() * TRAINER_REACTIONS.length)]);
      reactionTimerRef.current = setTimeout(() => setTrainerReaction(null), 3800);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Caricamento portale…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "rgba(239,68,68,0.6)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Portale non disponibile</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error || "Link non valido."}</p>
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

  // ── Days since last log ──────────────────────────────────────────────────
  const daysSinceLastLog: number | null = sortedLogDays.length === 0
    ? null
    : Math.floor((Date.now() - new Date(sortedLogDays[sortedLogDays.length - 1]).getTime()) / 86400000);

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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b glass-dark" style={{ borderColor: "rgba(229,50,50,0.14)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg accent-btn flex items-center justify-center flex-shrink-0">
              <Dumbbell size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{plan.name}</p>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>Il tuo piano personale</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle size={14} />
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all active:scale-95"
              style={{ border: "1px solid rgba(229,50,50,0.2)", color: copied ? "#22c55e" : "var(--text-muted)", minHeight: "2.5rem" }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? "Copiato!" : "Copia link"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Carta del Programma ───────────────────────────────────────────── */}
        <ProgramCard
          planName={plan.name}
          trainerName={trainerName}
          daysPerWeek={plan.days_per_week}
          totalWeeks={plan.total_weeks}
          shareToken={plan.share_token}
          level={level}
          levelName={levelName}
          xpPct={xpPct}
        />

        {/* ── Stato Atleta ─────────────────────────────────────────────────── */}
        <AthleteStatusBand dayOnJourney={dayOnJourney} streak={streak} />

        {/* ── Voce del Trainer ─────────────────────────────────────────────── */}
        <TrainerVoiceCard
          trainerName={trainerName}
          daysSinceLastLog={daysSinceLastLog}
          streak={streak}
          totalLogs={totalLogs}
        />

        {/* ── Principio della settimana ────────────────────────────────────── */}
        <WeeklyPrincipleCard trainerName={trainerName} />

        {/* ── Banner milestone percorso ─────────────────────────────────────── */}
        <MilestoneBanner dayOnJourney={dayOnJourney} trainerName={trainerName} />

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
                  style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  &ldquo;{plan.description}&rdquo;
                </p>
                <p className="text-xs mt-3 font-semibold"
                  style={{ color: "rgba(229,50,50,0.48)" }}>
                  — {trainerName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Level + XP card ────────────────────────────────────────────────── */}
        <div className="mb-4 p-4 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(229,50,50,0.1), rgba(170,21,21,0.05))", border: "1px solid rgba(229,50,50,0.22)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", boxShadow: "0 0 20px rgba(229,50,50,0.35)" }}>
                {level}
              </div>
              <div>
                <p className="font-black text-base" style={{ color: "var(--text)" }}>{levelName}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Livello {level} · {totalXP} XP totali</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold" style={{ color: "var(--text-dim)" }}>al prossimo liv.</p>
              <p className="text-sm font-bold accent-text">{XP_PER_LVL - xpInLevel} XP</p>
            </div>
          </div>
          {/* XP bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-md)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, var(--accent-dark), var(--accent))" }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              +10 XP per sessione · +50 XP per settimana completata
            </p>
            {dayOnJourney !== null && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: "rgba(229,50,50,0.08)", color: "var(--text-muted)", border: "1px solid rgba(229,50,50,0.15)" }}>
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
              style={{ background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
              <p className="text-xl font-black" style={{ color: "var(--text)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Program progress bar (hidden for unlimited plans) ──────────────── */}
        {!isUnlimited && pct !== null && (
          <div className="mb-4 p-4 rounded-2xl"
            style={{ background: "rgba(229,50,50,0.04)", border: "1px solid rgba(229,50,50,0.12)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Avanzamento programma</p>
              <span className="text-sm font-black accent-text">{pct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-md)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-light))" }} />
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-dim)" }}>
              {weeksCompleted === 0
                ? `Settimana ${currentWeek > 0 ? currentWeek : 1} in corso — continua così!`
                : `${weeksCompleted} sett. completate · Settimana ${currentWeek} in corso`}
            </p>
          </div>
        )}

        {/* ── Achievements ───────────────────────────────────────────────────── */}
        <div className="mb-4 rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--surface-xs)", borderBottom: "1px solid var(--border-subtle)" }}>
            <Trophy size={13} style={{ color: "#fbbf24" }} />
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              Obiettivi — {achievements.filter(a => a.unlocked).length}/{achievements.length} sbloccati
            </p>
          </div>
          <div className="grid grid-cols-3 gap-0">
            {achievements.map((a, i) => (
              <div key={i}
                className="flex flex-col items-center gap-1.5 p-3 text-center"
                style={{
                  borderRight: i % 3 !== 2 ? "1px solid var(--border-subtle)" : undefined,
                  borderBottom: i < 3 ? "1px solid var(--border-subtle)" : undefined,
                  opacity: a.unlocked ? 1 : 0.3,
                  filter: a.unlocked ? "none" : "grayscale(1)",
                }}>
                <span style={{ fontSize: "1.4rem" }}>{a.icon}</span>
                <span className="text-xs font-semibold leading-tight" style={{ color: a.unlocked ? "var(--ivory)" : "var(--text-dim)" }}>
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

        {/* ── Radar Atletico ────────────────────────────────────────────────── */}
        <RadarAtletico
          streak={streak}
          totalLogs={totalLogs}
          level={level}
          pct={pct}
          recentDays={Array.from(logsByDayGlobal.keys()).filter(d =>
            Math.floor((Date.now() - new Date(d).getTime()) / 86400000) <= 30
          ).length}
        />

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {([
            { key: "allenamento" as Tab, icon: Dumbbell,       label: "Scheda",       beta: false },
            { key: "record"      as Tab, icon: Trophy,          label: "Record",        beta: false },
            { key: "dieta"       as Tab, icon: UtensilsCrossed, label: `Dieta${diets.length > 0 ? ` (${diets.length})` : ""}`, beta: false },
            { key: "integratori" as Tab, icon: ShoppingBag,     label: `Integratori${(plan.supplements?.length ?? 0) > 0 ? ` (${plan.supplements!.length})` : ""}`, beta: false },
            { key: "scan"        as Tab, icon: Scan,            label: "Fitness Scan",  beta: true },
          ]).map(({ key, icon: Icon, label, beta }) => (
            <button key={key} onClick={() => { setTab(key); if (key === "scan") loadScans(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: tab === key ? "rgba(229,50,50,0.12)" : "var(--surface-sm)",
                border: `1px solid ${tab === key ? "rgba(229,50,50,0.32)" : "var(--border-subtle)"}`,
                color: tab === key ? "var(--accent-light)" : "var(--text-muted)",
              }}>
              <Icon size={14} />
              {label}
              {beta && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "0.55rem", letterSpacing: "0.05em" }}>
                  BETA
                </span>
              )}
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
              <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", background: "var(--surface-xs)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Attività — ultimi 8 settimane</p>
                  <span className="text-xs font-bold" style={{ color: "var(--accent-light)" }}>{totalTrainingDays} giorni allenati</span>
                </div>
                {/* Day labels */}
                <div className="flex gap-1 mb-1 pl-0">
                  {weekLabels.map((l, i) => (
                    <div key={i} className="text-center flex-1 text-xs" style={{ color: "var(--text-faint)", fontSize: "0.6rem" }}>{l}</div>
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
                            ? "var(--surface)"
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
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>meno</span>
                  {["var(--surface)", "rgba(229,50,50,0.25)", "rgba(229,50,50,0.5)", "rgba(229,50,50,0.8)"].map((bg, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />
                  ))}
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>più</span>
                </div>
              </div>

              {/* Personal Records */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--surface-xs)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Personal Record</p>
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>{prs.length} esercizi tracciati</span>
                </div>
                {prs.length === 0 ? (
                  <div className="text-center py-12" style={{ color: "var(--text-dim)" }}>
                    <p className="text-sm">Ancora nessun record.</p>
                    <p className="text-xs mt-1">Inserisci i pesi durante l&apos;allenamento e i tuoi PR appariranno qui.</p>
                  </div>
                ) : (
                  <div>
                    {prs.map(([name, pr], idx) => (
                      <div key={name}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: idx < prs.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
                          style={{
                            background: idx === 0 ? "rgba(255,210,63,0.18)" : idx === 1 ? "rgba(200,200,200,0.12)" : idx === 2 ? "rgba(205,127,50,0.12)" : "var(--surface)",
                            color: idx === 0 ? "#fbbf24" : idx === 1 ? "#d1d5db" : idx === 2 ? "#cd7f32" : "var(--text-dim)",
                          }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{name}</p>
                          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
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
            <MoodCheckIn trainerName={trainerName} />
            <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: "rgba(229,50,50,0.06)", border: "1px solid rgba(229,50,50,0.14)", color: "var(--text-muted)" }}>
              <span className="text-base leading-none mt-0.5">💡</span>
              <span><strong style={{ color: "var(--accent-light)" }}>Come usare la scheda:</strong> clicca su una cella per inserire il peso e le ripetizioni. I dati vengono salvati automaticamente settimana per settimana.</span>
            </div>
            {plan.exercises.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(229,50,50,0.08)" }}>
                  <Dumbbell size={22} style={{ color: "rgba(229,50,50,0.4)" }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-muted)" }}>Scheda in preparazione</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--text-dim)" }}>Il tuo trainer sta costruendo la tua scheda personalizzata su misura. Torni tra poco.</p>
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
              <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(229,50,50,0.08)" }}>
                  <UtensilsCrossed size={22} style={{ color: "rgba(229,50,50,0.4)" }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-muted)" }}>Piano alimentare in preparazione</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--text-dim)" }}>Il tuo piano alimentare personalizzato apparirà qui. Il trainer lo sta preparando su misura per i tuoi obiettivi.</p>
              </div>
            ) : null}

            {/* ── 7-day meal plan ── */}
            {diets.length > 0 && (() => {
              const d = diets[0];
              return (
                <div className="mb-6 rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(229,50,50,0.2)", background: "linear-gradient(135deg,rgba(229,50,50,0.06),rgba(8,6,6,0.6))" }}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(229,50,50,0.12)", border: "1px solid rgba(229,50,50,0.2)" }}>
                      <Calendar size={18} style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-black" style={{ color: "var(--text)" }}>Piano alimentare 7 giorni</p>
                      <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                        Pasti calcolati sui tuoi macro · {d.calories} kcal al giorno
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
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
                    <div key={diet.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(229,50,50,0.15)" }}>
                      {/* Header */}
                      <div className="p-5" style={{ background: "rgba(229,50,50,0.04)" }}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{diet.name}</h2>
                            {diet.notes && <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>{diet.notes}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                              {fmt(diet.calories, diet.calories_max, " kcal")}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-dim)" }}>al giorno</p>
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
                              style={{ background: "var(--surface-sm)", border: `1px solid ${color}25` }}>
                              <p className="text-sm font-bold" style={{ color }}>{fmt(min, max)}</p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meals */}
                      {meals.length > 0 && (
                        <div className="divide-y" style={{ borderTop: "1px solid rgba(229,50,50,0.12)", borderColor: "rgba(229,50,50,0.08)" }}>
                          {meals.map((meal, mi) => (
                            <div key={meal.id} className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(229,50,50,0.14)", color: "var(--accent-light)" }}>{mi + 1}</span>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{meal.name}</p>
                                  {meal.time && <span className="text-xs" style={{ color: "var(--text-dim)" }}>{meal.time}</span>}
                                </div>
                              </div>
                              {meal.notes && <p className="text-xs mb-2 italic" style={{ color: "var(--text-dim)" }}>{meal.notes}</p>}
                              {meal.items.length > 0 && (
                                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                                  {meal.items.map((item, ii) => (
                                    <div key={item.id}
                                      className="flex items-center gap-3 px-3 py-2.5"
                                      style={{ background: ii % 2 === 0 ? "var(--surface-xs)" : "transparent" }}>
                                      <span className="flex-1 text-sm" style={{ color: "var(--text)" }}>{item.name || "—"}</span>
                                      <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--accent-light)" }}>
                                        {item.gramsMax && item.gramsMax > item.grams ? `${item.grams}–${item.gramsMax}g` : `${item.grams}g`}
                                      </span>
                                      {(item.protein || item.carbs || item.fat) && (
                                        <div className="hidden sm:flex items-center gap-2 text-xs flex-shrink-0" style={{ color: "var(--text-dim)" }}>
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
              <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(229,50,50,0.08)" }}>
                  <ShoppingBag size={22} style={{ color: "rgba(229,50,50,0.4)" }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-muted)" }}>Integratori in arrivo</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--text-dim)" }}>Il tuo trainer aggiungerà presto i consigli sugli integratori più adatti al tuo programma.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
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

        {/* ── FITNESS SCAN tab ────────────────────────────────────────────────── */}
        {tab === "scan" && (
          <div className="pb-2">
            {/* Privacy header */}
            <div className="rounded-2xl p-4 mb-4 flex items-start gap-3"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
              <ShieldCheck size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: "#fbbf24" }}>
                  Fitness Scan — BETA · I tuoi progressi sono al sicuro
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Le tue foto sono cifrate e visibili solo al tuo trainer. Nessuna condivisione automatica.
                  Il trainer analizza la composizione corporea con AI per guidarti mese per mese.
                </p>
              </div>
            </div>

            {/* Upload form */}
            <div className="card-luxury rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Upload size={15} style={{ color: "var(--accent)" }} /> Carica una foto di trasformazione
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Data foto *</label>
                  <input type="date" value={scanUploadDate} onChange={e => setScanUploadDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Note (opzionale)</label>
                  <input type="text" value={scanUploadNotes} onChange={e => setScanUploadNotes(e.target.value)}
                    placeholder="es. Fronte, Schiena, Lato…"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--text)" }} />
                </div>
              </div>
              <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all ${scanUploading ? "opacity-60 pointer-events-none" : "hover:opacity-90"} accent-btn`}>
                {scanUploading ? <Loader2 size={15} className="animate-spin" /> : <Scan size={15} />}
                {scanUploading ? "Caricamento in corso…" : "Seleziona foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleScanUpload} disabled={scanUploading} />
              </label>

              {/* Success feedback */}
              {scanUploadSuccess && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl fade-in"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <span style={{ color: "#22c55e", fontSize: "0.85rem" }}>✓</span>
                  <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                    Foto caricata — il tuo trainer la vedrà a breve
                  </p>
                </div>
              )}

              {/* Error feedback */}
              {scanUploadError && (
                <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>Caricamento fallito</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {scanUploadError === "rate_limited" ? "Troppi caricamenti — attendi un minuto e riprova." :
                       scanUploadError === "quota_exceeded" ? "Quota massima foto raggiunta." :
                       scanUploadError === "file_too_large" ? "File troppo grande (max 5 MB)." :
                       scanUploadError === "invalid_token" ? "Link non valido — contatta il tuo trainer." :
                       "Errore di rete. Verifica la connessione e riprova."}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs mt-2 text-center" style={{ color: "var(--text-faint)" }}>
                La foto viene compressa automaticamente · visibile solo al tuo trainer
              </p>
            </div>

            {/* Scan timeline */}
            {scansLoading ? (
              <div className="text-center py-10">
                <Loader2 size={22} className="animate-spin mx-auto mb-2" style={{ color: "rgba(229,50,50,0.5)" }} />
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>Caricamento…</p>
              </div>
            ) : !scansLoaded ? (
              <div className="text-center py-10">
                <button onClick={() => loadScans(true)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  Carica foto
                </button>
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-14 rounded-2xl" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                <Brain size={34} className="mx-auto mb-3" style={{ color: "rgba(229,50,50,0.3)" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Nessuna foto ancora</p>
                <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--text-dim)" }}>
                  Carica la prima foto — il tuo trainer potrà tracciare i tuoi progressi mese per mese.
                </p>
              </div>
            ) : (() => {
              // Group by month
              const byMonth: Record<string, typeof scans> = {};
              [...scans].sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())
                .forEach(s => { const k = s.taken_at.slice(0, 7); if (!byMonth[k]) byMonth[k] = []; byMonth[k].push(s); });
              const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {scans.length} foto · {months.length} {months.length === 1 ? "mese" : "mesi"} di tracking
                    </p>
                    <button onClick={() => loadScans(true)} disabled={scansLoading}
                      className="flex items-center gap-1 text-xs transition-all hover:opacity-80"
                      style={{ color: "var(--text-faint)" }}>
                      <Loader2 size={10} className={scansLoading ? "animate-spin" : ""} />
                      Aggiorna
                    </button>
                  </div>

                  {/* Month timeline */}
                  {months.map((month, monthIdx) => {
                    const monthScans = byMonth[month];
                    const monthLabel = new Date(month + "-01").toLocaleDateString("it-IT", { month: "long", year: "numeric" });
                    const hasAnalysis = monthScans.some(s => s.ai_analysis);
                    return (
                      <div key={month} className="mb-6">
                        {/* Month header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: monthIdx === 0 ? "var(--accent)" : "rgba(229,50,50,0.35)" }} />
                          <p className="text-xs font-bold capitalize" style={{ color: monthIdx === 0 ? "var(--accent-light)" : "var(--text-muted)", letterSpacing: "0.06em" }}>
                            {monthLabel}
                            {monthIdx === 0 && <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-faint)" }}>· mese corrente</span>}
                          </p>
                          {hasAnalysis && (
                            <span className="ml-auto text-xs flex items-center gap-1" style={{ color: "#22c55e" }}>
                              <Sparkles size={10} /> Analizzato
                            </span>
                          )}
                        </div>

                        {/* Photos grid for this month */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {monthScans.map(scan => (
                            <div key={scan.id} className="rounded-2xl overflow-hidden transition-all"
                              style={{ background: "var(--surface-sm)", border: "1px solid rgba(229,50,50,0.12)", boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
                              <div className="aspect-[3/4] relative bg-black">
                                {scan.signed_url ? (
                                  <img
                                    src={scan.signed_url}
                                    alt={scan.taken_at}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={e => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                    }}
                                  />
                                ) : null}
                                {/* Fallback shown when no URL or image fails to load */}
                                <div className={`w-full h-full flex flex-col items-center justify-center absolute inset-0 ${scan.signed_url ? "hidden" : ""}`}
                                  style={{ background: "var(--surface-xs)" }}>
                                  <Scan size={22} style={{ color: "rgba(229,50,50,0.3)" }} />
                                  <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)", fontSize: "0.6rem" }}>
                                    {scan.signed_url ? "URL scaduta" : "—"}
                                  </p>
                                </div>
                                {/* Security badge */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                  style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
                                  <ShieldCheck size={8} style={{ color: "#22c55e" }} />
                                  <span style={{ color: "#22c55e", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.05em" }}>PRIVATO</span>
                                </div>
                                {/* AI badge */}
                                {scan.ai_analysis && (
                                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                    style={{ background: "rgba(229,50,50,0.9)", backdropFilter: "blur(6px)" }}>
                                    <Sparkles size={8} style={{ color: "#fff" }} />
                                    <span style={{ color: "#fff", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.05em" }}>AI</span>
                                  </div>
                                )}
                                {/* Date overlay at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
                                  <p className="text-xs font-semibold" style={{ color: "#fff" }}>
                                    {new Date(scan.taken_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                                  </p>
                                  {scan.notes && (
                                    <p className="truncate" style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.6rem" }}>{scan.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="px-2 py-1.5 flex items-center justify-end">
                                <button onClick={() => handleScanDelete(scan)} disabled={scanDeleting === scan.id}
                                  className="flex items-center gap-1 text-xs transition-all hover:opacity-80"
                                  style={{ color: "rgba(239,68,68,0.55)" }}>
                                  {scanDeleting === scan.id ? <Loader2 size={9} className="animate-spin" /> : <Trash2 size={9} />}
                                  {scanDeleting === scan.id ? "" : "Elimina"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* AI analysis for this month (client-friendly, motivational) */}
                        {monthScans[0]?.ai_analysis && (() => {
                          const a = monthScans[0].ai_analysis!;
                          return (
                            <div className="rounded-2xl p-4" style={{ background: "rgba(229,50,50,0.04)", border: "1px solid rgba(229,50,50,0.14)" }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={12} style={{ color: "var(--accent)" }} />
                                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)", letterSpacing: "0.1em" }}>
                                  Analisi del tuo trainer
                                </p>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                {[
                                  { l: "Grasso stim.", v: a.body_fat_est != null ? `${a.body_fat_est}%` : "—", c: "#fbbf24" },
                                  { l: "Muscolarità",  v: a.muscle_mass_est ?? "—", c: "#a78bfa" },
                                  { l: "Somatotipo",   v: a.body_type ?? "—", c: "#38bdf8" },
                                ].map(({ l, v, c }) => (
                                  <div key={l} className="rounded-xl p-2 text-center" style={{ background: "var(--surface-xs)", border: `1px solid ${c}22` }}>
                                    <p className="text-sm font-bold capitalize" style={{ color: c }}>{v}</p>
                                    <p style={{ color: "var(--text-faint)", fontSize: "0.58rem" }}>{l}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs leading-relaxed italic px-3 py-2.5 rounded-xl mb-3"
                                style={{ color: "var(--text-muted)", background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                                {a.summary}
                              </p>
                              {a.recommendations?.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-dim)", letterSpacing: "0.06em" }}>CONSIGLI PERSONALIZZATI</p>
                                  {a.recommendations.map((r, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                                        style={{ background: "rgba(229,50,50,0.14)", color: "var(--accent)", fontSize: "0.58rem" }}>{i + 1}</span>
                                      {r}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs mt-2.5" style={{ color: "var(--text-faint)" }}>
                                Stima visiva AI · {new Date(a.analyzed_at).toLocaleDateString("it-IT")}
                              </p>
                            </div>
                          );
                        })()}

                        {/* Divider between months */}
                        {monthIdx < months.length - 1 && (
                          <div className="mt-4" style={{ height: "1px", background: "var(--border-subtle)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Powered by <span className="accent-text font-semibold">TrainerPro</span>
        </p>
      </div>

      {/* ── Reazione Trainer (toast post-log) ──────────────────────────────── */}
      {trainerReaction && (() => {
        const initials = trainerName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "PT";
        return (
          <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none fade-in">
            <div className="max-w-sm w-full rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: "rgba(8,8,8,0.97)",
                border: "1px solid rgba(229,50,50,0.5)",
                boxShadow: "0 8px 40px rgba(229,50,50,0.22), 0 0 0 1px rgba(255,255,255,0.03)",
                backdropFilter: "blur(20px)",
              }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black flex-shrink-0"
                style={{ background: "radial-gradient(circle at 35% 30%, rgba(229,50,50,0.35), rgba(8,8,8,0.92))", border: "1.5px solid rgba(229,50,50,0.6)" }}>
                <span style={{ color: "var(--accent)", fontSize: "0.85rem" }}>{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>{trainerName}</p>
                  <span className="text-xs font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.18)", color: "#22c55e", fontSize: "0.55rem", letterSpacing: "0.08em" }}>
                    LIVE
                  </span>
                </div>
                <p className="text-sm leading-snug" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  &ldquo;{trainerReaction}&rdquo;
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}