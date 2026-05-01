"use client";
import { useState, useEffect, useRef } from "react";
import type { Exercise, ExerciseLog, SupplementItem } from "@/lib/store";
import { ChevronLeft, ChevronRight, Save, X, ExternalLink, Copy, Check, Pencil, Trash2, Plus, Dumbbell, ShoppingBag, TrendingUp } from "lucide-react";
import { showToast } from "@/components/Toast";

// ── Per-set data: weight + actual reps + RPE ─────────────────────────────────
interface SetData { reps: string; weight: string; rpe: string; }

/** Parse log.reps — JSON ([{r,w,e},...]) or legacy "12/10/8" */
function parseSetData(log: ExerciseLog | undefined, sets: number): SetData[] {
  const blank = (): SetData[] => Array.from({ length: sets }, () => ({ reps: "", weight: "", rpe: "" }));
  if (!log) return blank();
  try {
    const p = JSON.parse(log.reps ?? "");
    if (Array.isArray(p) && p[0] && "r" in p[0]) {
      const result: SetData[] = p.map((x: { r: string; w: string; e?: string }) => ({
        reps: String(x.r ?? ""),
        weight: String(x.w ?? ""),
        rpe: String(x.e ?? ""),
      }));
      while (result.length < sets) result.push({ reps: "", weight: "", rpe: "" });
      return result.slice(0, sets);
    }
  } catch {}
  // Legacy slash format
  const parts = (log.reps ?? "").split("/");
  const w = log.weight != null ? String(log.weight) : "";
  return Array.from({ length: sets }, (_, i) => ({ reps: parts[i] ?? "", weight: w, rpe: "" }));
}

/** Serialize back to DB storage */
function serializeSetData(data: SetData[]): { reps?: string; weight?: number } {
  const hasW = data.some(s => s.weight.trim());
  const hasR = data.some(s => s.reps.trim());
  const hasE = data.some(s => s.rpe.trim());
  if (!hasR && !hasW && !hasE) return {};
  if (hasW || hasE) {
    return {
      reps: JSON.stringify(data.map(s => ({ r: s.reps.trim(), w: s.weight.trim(), e: s.rpe.trim() }))),
      weight: parseFloat(data[0]?.weight) || undefined,
    };
  }
  return { reps: data.map(s => s.reps).join("/") || undefined };
}

function areDirty(a: SetData[], b: SetData[]) {
  return a.some((s, i) =>
    s.weight !== (b[i]?.weight ?? "") ||
    s.reps   !== (b[i]?.reps   ?? "") ||
    s.rpe    !== (b[i]?.rpe    ?? "")
  );
}

// ── Progressive overload suggestion ──────────────────────────────────────────
function calcSuggestion(prevData: SetData[]): { weight: number; delta: number; rpeAvg: number | null } | null {
  const valid = prevData.filter(s => s.weight && parseFloat(s.weight) > 0);
  if (!valid.length) return null;
  const avgW = valid.reduce((s, d) => s + parseFloat(d.weight), 0) / valid.length;
  const rpeValid = valid.filter(s => s.rpe && parseFloat(s.rpe) > 0);
  const avgRpe = rpeValid.length ? rpeValid.reduce((s, d) => s + parseFloat(d.rpe), 0) / rpeValid.length : null;
  let mult = 1.025;
  if (avgRpe !== null) {
    if (avgRpe <= 5)      mult = 1.05;
    else if (avgRpe <= 7) mult = 1.025;
    else if (avgRpe <= 8) mult = 1.0;
    else if (avgRpe <= 9) mult = 1.0;
    else                   mult = 0.975;
  }
  const suggested = Math.round(avgW * mult * 2) / 2;
  return { weight: suggested, delta: suggested - avgW, rpeAvg: avgRpe };
}

// ── Superset colors ───────────────────────────────────────────────────────────
const SS_COLORS: Record<string, string> = {
  A: "#a78bfa", B: "#38bdf8", C: "#34d399",
  D: "#fbbf24", E: "#f472b6", F: "#fb923c",
};
function ssColor(g?: string) { return g ? (SS_COLORS[g.toUpperCase()] ?? "#a78bfa") : null; }

// ── ExerciseCard ──────────────────────────────────────────────────────────────
interface CardProps {
  exercise: Exercise;
  log: ExerciseLog | undefined;
  lastWeekLog: ExerciseLog | undefined;
  week: number;
  mode: "trainer" | "client";
  onUpsertLog: (d: Omit<ExerciseLog, "id" | "loggedAt">) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ExerciseCard({ exercise, log, lastWeekLog, week, mode, onUpsertLog, onEdit, onDelete }: CardProps) {
  const sets = Math.max(1, exercise.sets || 3);
  const [data, setData]   = useState<SetData[]>(() => parseSetData(log, sets));
  const orig               = useRef<SetData[]>(parseSetData(log, sets));
  const dirty              = areDirty(data, orig.current);

  useEffect(() => {
    const parsed = parseSetData(log, sets);
    setData(parsed);
    orig.current = parsed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.loggedAt, log?.reps, sets]);

  function targetRep(i: number) { return exercise.perSetReps?.[i] ?? exercise.targetReps ?? "—"; }
  function updateWeight(i: number, val: string) { setData(p => { const n = [...p]; n[i] = { ...n[i], weight: val }; return n; }); }
  function updateReps(i: number, val: string)   { setData(p => { const n = [...p]; n[i] = { ...n[i], reps: val };   return n; }); }
  function updateRpe(i: number, val: string)    { setData(p => { const n = [...p]; n[i] = { ...n[i], rpe: val };    return n; }); }

  function handleSave() {
    const { reps, weight } = serializeSetData(data);
    onUpsertLog({ exerciseId: exercise.id, weekNumber: week, reps, weight });
    orig.current = [...data];
    showToast("Salvato ✓");
  }
  function handleClear() {
    const blank = Array.from({ length: sets }, () => ({ reps: "", weight: "", rpe: "" }));
    setData(blank);
    onUpsertLog({ exerciseId: exercise.id, weekNumber: week, reps: undefined, weight: undefined });
    orig.current = blank;
    showToast("Dati cancellati");
  }

  const sessionDate = log
    ? new Date(log.loggedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "— / — / ——";

  const color      = ssColor(exercise.supersetGroup);
  const cardBorder = color ? `2px solid ${color}40` : "1px solid rgba(255,255,255,0.07)";
  const rowBorder  = "1px solid rgba(255,255,255,0.05)";

  // Progressive overload suggestion (only for client, only from week 2+)
  const suggestion = mode === "client" && week > 1
    ? calcSuggestion(parseSetData(lastWeekLog, sets))
    : null;

  // Layout: client has 4 cols (set | reps | kg | RPE), trainer has 3
  const cols = mode === "client" ? "3.5rem 1fr 1fr 2.8rem" : "4.5rem 1fr 1fr";

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: cardBorder, background: "rgba(10,10,10,0.9)" }}>

      {/* Date header */}
      <div className="flex items-center justify-center px-2 py-1.5 text-xs font-bold"
        style={{ background: "rgba(229,50,50,0.75)", color: "#fff", letterSpacing: "0.04em", borderBottom: rowBorder }}>
        {sessionDate}
      </div>

      {/* Exercise name */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2"
        style={{ background: "rgba(255,107,43,0.06)", borderBottom: rowBorder }}>
        <div className="flex items-center gap-2 min-w-0">
          {color && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
              SS-{exercise.supersetGroup}
            </span>
          )}
          <span className="font-bold text-sm uppercase truncate" style={{ color: "var(--ivory)" }}>
            {exercise.name}
          </span>
          {exercise.muscleGroup && (
            <span className="text-xs px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.35)" }}>
              {exercise.muscleGroup}
            </span>
          )}
        </div>
        {mode === "trainer" && (
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <Pencil size={11} style={{ color: "rgba(245,240,232,0.5)" }} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ background: "rgba(239,68,68,0.07)" }}>
              <Trash2 size={11} style={{ color: "rgba(239,68,68,0.45)" }} />
            </button>
          </div>
        )}
      </div>

      {/* Progressive overload suggestion */}
      {suggestion && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs"
          style={{ background: "rgba(52,211,153,0.07)", borderBottom: rowBorder, color: "#34d399" }}>
          <TrendingUp size={11} />
          <span>
            Prova <strong>{suggestion.weight} kg</strong>
            {suggestion.delta > 0 ? ` (+${suggestion.delta.toFixed(1)} kg)` : suggestion.delta < 0 ? ` (${suggestion.delta.toFixed(1)} kg)` : " (mantieni)"}
            {suggestion.rpeAvg !== null ? ` · RPE scorsa: ${suggestion.rpeAvg.toFixed(1)}` : ""}
          </span>
        </div>
      )}

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: cols, borderBottom: rowBorder, background: "rgba(255,255,255,0.02)" }}>
        <div className="px-2 py-1.5 text-xs" style={{ color: "transparent", borderRight: rowBorder }}>·</div>
        <div className="px-2 py-1.5 text-xs font-semibold text-center"
          style={{ color: "rgba(245,240,232,0.35)", borderRight: rowBorder }}>
          {mode === "client" ? "rips" : "ripetizioni"}
        </div>
        <div className="px-2 py-1.5 text-xs font-semibold text-center"
          style={{ color: "rgba(245,240,232,0.35)", borderRight: mode === "client" ? rowBorder : undefined }}>
          kg
        </div>
        {mode === "client" && (
          <div className="px-1 py-1.5 text-xs font-semibold text-center"
            style={{ color: "rgba(245,240,232,0.35)" }}>
            RPE
          </div>
        )}
      </div>

      {/* Set rows */}
      {Array.from({ length: sets }, (_, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: cols,
          borderBottom: i < sets - 1 ? rowBorder : undefined,
          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
        }}>
          {/* Set label */}
          <div className="flex flex-col items-center justify-center px-2 py-2 text-xs"
            style={{ color: "rgba(245,240,232,0.35)", borderRight: rowBorder }}>
            <span>{i + 1}</span>
            {mode === "client" && (
              <span className="text-xs mt-0.5 font-semibold" style={{ color: "var(--accent-light)", fontSize: "0.6rem" }}>
                {targetRep(i)}
              </span>
            )}
          </div>

          {/* Reps column */}
          {mode === "client" ? (
            <div className="flex items-center px-1" style={{ borderRight: rowBorder }}>
              <input
                type="number" min="0" step="1"
                value={data[i]?.reps ?? ""}
                onChange={e => updateReps(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                placeholder={String(targetRep(i))}
                className="flex-1 text-center py-2 text-sm font-bold outline-none rounded-lg"
                style={{ background: "transparent", color: "var(--ivory)", border: "none", minWidth: 0 }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center px-2 py-2.5 text-xs font-semibold"
              style={{ color: "var(--accent-light)", borderRight: rowBorder }}>
              {targetRep(i)}
            </div>
          )}

          {/* Weight column */}
          {mode === "client" ? (
            <div className="flex items-center px-1" style={{ borderRight: rowBorder }}>
              <input
                type="number" min="0" step="0.5"
                value={data[i]?.weight ?? ""}
                onChange={e => updateWeight(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                placeholder="—"
                className="flex-1 text-center py-2 text-sm font-bold outline-none rounded-lg"
                style={{ background: "transparent", color: "var(--ivory)", border: "none", minWidth: 0 }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center px-2 py-2.5 text-sm font-bold"
              style={{ color: data[i]?.weight ? "var(--ivory)" : "rgba(245,240,232,0.18)" }}>
              {data[i]?.weight ? `${data[i].weight} kg` : "—"}
            </div>
          )}

          {/* RPE column (client only) */}
          {mode === "client" && (
            <div className="flex items-center justify-center px-1">
              <input
                type="number" min="1" max="10" step="1"
                value={data[i]?.rpe ?? ""}
                onChange={e => { const v = e.target.value; if (v === "" || (parseFloat(v) >= 1 && parseFloat(v) <= 10)) updateRpe(i, v); }}
                placeholder="—"
                className="w-full text-center py-2 text-xs font-bold outline-none rounded-lg"
                style={{ background: "transparent", color: "#34d399", border: "none", minWidth: 0 }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Save / Clear (client) */}
      {mode === "client" && (
        <div className="flex gap-2 px-2.5 py-2" style={{ borderTop: rowBorder }}>
          <button onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
            style={{ border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.55)" }}>
            <X size={10} /> Cancella
          </button>
          <button onClick={handleSave} disabled={!dirty}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: dirty ? "rgba(255,107,43,0.14)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${dirty ? "rgba(255,107,43,0.4)" : "rgba(255,255,255,0.06)"}`,
              color: dirty ? "var(--accent-light)" : "rgba(245,240,232,0.18)",
            }}>
            <Save size={10} /> {dirty ? "Salva" : "Salvato ✓"}
          </button>
        </div>
      )}

      {/* Trainer: note */}
      {mode === "trainer" && log?.note && (
        <div className="px-3 py-2 text-xs italic" style={{ borderTop: rowBorder, color: "rgba(245,240,232,0.35)" }}>
          📝 {log.note}
        </div>
      )}

      {/* Video link */}
      {exercise.videoUrl && (
        <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs transition-opacity hover:opacity-80"
          style={{ borderTop: rowBorder, color: "var(--accent-light)" }}>
          <ExternalLink size={10} /> Video dimostrativo
        </a>
      )}
    </div>
  );
}

// ── Supplement Card ───────────────────────────────────────────────────────────
function SupplementCard({ item }: { item: SupplementItem }) {
  const [copied, setCopied] = useState(false);
  function copyCode() {
    if (!item.discountCode) return;
    navigator.clipboard.writeText(item.discountCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
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
            <ExternalLink size={11} /> Acquista
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

// ── Main WorkoutLogbook ───────────────────────────────────────────────────────
interface Props {
  planId?: string;
  exercises: Exercise[];
  logs: ExerciseLog[];
  totalWeeks?: number;
  daysPerWeek?: number;
  mode: "trainer" | "client";
  dayLabels?: Record<number, string>;
  supplements?: SupplementItem[];
  onAddExercise?: (data: Omit<Exercise, "id" | "order">) => void;
  onUpdateExercise?: (exerciseId: string, data: Partial<Exercise>) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateSupplements?: (items: SupplementItem[]) => void;
  onUpsertLog: (log: Omit<ExerciseLog, "id" | "loggedAt">) => void;
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function WorkoutLogbook({
  exercises, logs, totalWeeks = 12, daysPerWeek = 3,
  mode, dayLabels = {}, supplements = [],
  onAddExercise, onUpdateExercise, onRemoveExercise,
  onUpdateSupplements, onUpsertLog,
}: Props) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const days  = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  const [activeDay,  setActiveDay]  = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);

  const [suppEditing, setSuppEditing] = useState(false);
  const [suppDraft,   setSuppDraft]   = useState<SupplementItem[]>(supplements);
  const [newSupp, setNewSupp]         = useState<Omit<SupplementItem, "id">>({ name: "", brand: "", productUrl: "", discountCode: "", notes: "" });

  useEffect(() => { setSuppDraft(supplements); }, [supplements]);

  useEffect(() => {
    if (mode === "client" && logs.length > 0) {
      const max = Math.min(Math.max(...logs.map(l => l.weekNumber)), totalWeeks);
      setActiveWeek(max);
    }
  }, [mode, totalWeeks]); // eslint-disable-line react-hooks/exhaustive-deps

  function getDayLabel(d: number) { return dayLabels[d] || `Giorno ${d}`; }
  function getLog(exerciseId: string, week: number) {
    return logs.find(l => l.exerciseId === exerciseId && l.weekNumber === week);
  }

  const dayExercises = [...exercises]
    .filter(e => (e.day ?? 1) === activeDay)
    .sort((a, b) => a.order - b.order);

  function saveSupplements(items: SupplementItem[]) {
    setSuppDraft(items);
    onUpdateSupplements?.(items);
    showToast("Integratori salvati ✓");
  }
  function addSupp() {
    if (!newSupp.name.trim()) return;
    const item: SupplementItem = { ...newSupp, id: uid() };
    saveSupplements([...suppDraft, item]);
    setNewSupp({ name: "", brand: "", productUrl: "", discountCode: "", notes: "" });
  }
  function removeSupp(id: string) { saveSupplements(suppDraft.filter(s => s.id !== id)); }

  // Week completion dots
  const weekDots = weeks.map(w => logs.some(l => l.weekNumber === w));

  return (
    <div className="space-y-5">

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveWeek(w => Math.max(1, w - 1))} disabled={activeWeek === 1}
          className="p-2 rounded-xl transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ChevronLeft size={16} style={{ color: "var(--ivory)" }} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm font-bold" style={{ color: "var(--ivory)" }}>Settimana {activeWeek}</span>
          <span className="text-xs ml-2" style={{ color: "rgba(245,240,232,0.35)" }}>di {totalWeeks}</span>
        </div>
        <button onClick={() => setActiveWeek(w => Math.min(totalWeeks, w + 1))} disabled={activeWeek === totalWeeks}
          className="p-2 rounded-xl transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ChevronRight size={16} style={{ color: "var(--ivory)" }} />
        </button>
      </div>

      {/* Week progress dots */}
      <div className="flex items-center gap-1.5 justify-center flex-wrap">
        {weekDots.map((done, i) => (
          <button key={i} onClick={() => setActiveWeek(i + 1)}
            title={`Settimana ${i + 1}`}
            className="transition-all"
            style={{
              width: activeWeek === i + 1 ? 20 : 8,
              height: 8, borderRadius: 4,
              background: activeWeek === i + 1
                ? "var(--accent)"
                : done
                  ? "rgba(34,197,94,0.7)"
                  : "rgba(255,255,255,0.1)",
              transition: "width 0.3s ease, background 0.2s",
            }} />
        ))}
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {days.map(d => (
          <button key={d} onClick={() => setActiveDay(d)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeDay === d ? "rgba(255,107,43,0.14)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeDay === d ? "rgba(255,107,43,0.35)" : "rgba(255,255,255,0.07)"}`,
              color: activeDay === d ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
            }}>
            {getDayLabel(d)}
          </button>
        ))}
      </div>

      {/* RPE legend (client mode) */}
      {mode === "client" && (
        <div className="text-xs px-1 flex items-center gap-1" style={{ color: "rgba(245,240,232,0.3)" }}>
          <span style={{ color: "#34d399" }}>RPE</span>: 1–6 facile · 7–8 giusto · 9 al limite · 10 cedimento
        </div>
      )}

      {/* Exercise grid */}
      {dayExercises.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Dumbbell size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
            {mode === "trainer"
              ? "Nessun esercizio per questo giorno. Usa la vista Avanzato per aggiungere esercizi."
              : "Il tuo trainer non ha ancora aggiunto esercizi per questo giorno."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {dayExercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              log={getLog(ex.id, activeWeek)}
              lastWeekLog={getLog(ex.id, activeWeek - 1)}
              week={activeWeek}
              mode={mode}
              onUpsertLog={onUpsertLog}
              onEdit={() => {
                if (!onUpdateExercise) return;
                const name = prompt("Nome esercizio:", ex.name);
                if (name?.trim()) onUpdateExercise(ex.id, { name: name.trim() });
              }}
              onDelete={() => { if (confirm(`Eliminare "${ex.name}"?`)) onRemoveExercise?.(ex.id); }}
            />
          ))}
        </div>
      )}

      {mode === "trainer" && onAddExercise && (
        <p className="text-xs text-center" style={{ color: "rgba(245,240,232,0.25)" }}>
          Usa la scheda laterale per aggiungere o riordinare gli esercizi.
        </p>
      )}

      {/* Supplements — client read-only */}
      {mode === "client" && suppDraft.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--ivory)" }}>Integratori consigliati</h3>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {suppDraft.map(item => <SupplementCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Supplements — PT editor */}
      {mode === "trainer" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--ivory)" }}>
                Integratori consigliati
                <span className="ml-2 text-xs font-normal" style={{ color: "rgba(245,240,232,0.35)" }}>
                  (visibili al cliente)
                </span>
              </h3>
            </div>
            <button onClick={() => setSuppEditing(e => !e)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: suppEditing ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${suppEditing ? "rgba(255,107,43,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: suppEditing ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
              }}>
              {suppEditing ? "Chiudi" : "Gestisci"}
            </button>
          </div>

          {suppDraft.length > 0 && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {suppDraft.map(item => (
                <div key={item.id} className="rounded-2xl p-3 flex items-start gap-3"
                  style={{ background: "rgba(255,107,43,0.03)", border: "1px solid rgba(255,107,43,0.1)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--ivory)" }}>{item.name}</p>
                    {item.brand && <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{item.brand}</p>}
                    {item.discountCode && <p className="text-xs mt-1 font-mono" style={{ color: "var(--accent-light)" }}>Codice: {item.discountCode}</p>}
                    {item.notes && <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.4)" }}>{item.notes}</p>}
                  </div>
                  <button onClick={() => removeSupp(item.id)}
                    className="p-1.5 rounded-lg shrink-0 hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(239,68,68,0.08)" }}>
                    <Trash2 size={12} style={{ color: "rgba(239,68,68,0.5)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {suppEditing && (
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-semibold" style={{ color: "rgba(245,240,232,0.5)" }}>Aggiungi integratore</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "name",         placeholder: "Nome prodotto *" },
                  { key: "brand",        placeholder: "Brand (es. MyProtein)" },
                  { key: "discountCode", placeholder: "Codice sconto (es. TRAINER20)" },
                  { key: "productUrl",   placeholder: "Link affiliato" },
                ].map(({ key, placeholder }) => (
                  <input key={key}
                    value={(newSupp as Record<string, string>)[key] ?? ""}
                    onChange={e => setNewSupp(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}
                  />
                ))}
              </div>
              <input value={newSupp.notes ?? ""} onChange={e => setNewSupp(p => ({ ...p, notes: e.target.value }))}
                placeholder="Note dosaggio (es. 3-5g post-workout)"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}
              />
              <button onClick={addSupp} disabled={!newSupp.name.trim()}
                className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-40">
                <Plus size={14} /> Aggiungi integratore
              </button>
            </div>
          )}

          {suppDraft.length === 0 && !suppEditing && (
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
              Nessun integratore aggiunto. Clicca "Gestisci" per aggiungerne uno.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
