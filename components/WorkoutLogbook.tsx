"use client";
import { useState, useEffect, useRef } from "react";
import type { Exercise, ExerciseLog, SupplementItem } from "@/lib/store";
import { ChevronLeft, ChevronRight, Save, X, ExternalLink, Copy, Check, Pencil, Trash2, Plus, Dumbbell, ShoppingBag } from "lucide-react";
import { showToast } from "@/components/Toast";

// ── Per-set data (weight + reps per individual set) ───────────────────────────
interface SetData { reps: string; weight: string; }

/** Parse log.reps — either JSON ([{r,w},...]) or legacy "12/10/8" slash format */
function parseSetData(log: ExerciseLog | undefined, sets: number): SetData[] {
  const blank = (): SetData[] => Array.from({ length: sets }, () => ({ reps: "", weight: "" }));
  if (!log) return blank();
  try {
    const p = JSON.parse(log.reps ?? "");
    if (Array.isArray(p) && p[0] && "r" in p[0]) {
      const result: SetData[] = p.map((x: { r: string; w: string }) => ({ reps: String(x.r ?? ""), weight: String(x.w ?? "") }));
      while (result.length < sets) result.push({ reps: "", weight: "" });
      return result.slice(0, sets);
    }
  } catch {}
  // Legacy: "12/10/8", weight is a single number
  const parts = (log.reps ?? "").split("/");
  const w = log.weight != null ? String(log.weight) : "";
  return Array.from({ length: sets }, (_, i) => ({ reps: parts[i] ?? "", weight: w }));
}

/** Serialize SetData[] back to reps string + weight for DB storage */
function serializeSetData(data: SetData[]): { reps?: string; weight?: number } {
  const hasW = data.some(s => s.weight.trim());
  const hasR = data.some(s => s.reps.trim());
  if (!hasR && !hasW) return {};
  if (hasW) {
    return {
      reps: JSON.stringify(data.map(s => ({ r: s.reps.trim(), w: s.weight.trim() }))),
      weight: parseFloat(data[0]?.weight) || undefined,
    };
  }
  return { reps: data.map(s => s.reps).join("/") || undefined };
}

function areDirty(a: SetData[], b: SetData[]) {
  return a.some((s, i) => s.weight !== (b[i]?.weight ?? "") || s.reps !== (b[i]?.reps ?? ""));
}

// ── Superset color palette ────────────────────────────────────────────────────
const SS_COLORS: Record<string, string> = {
  A: "#a78bfa", B: "#38bdf8", C: "#34d399",
  D: "#fbbf24", E: "#f472b6", F: "#fb923c",
};
function ssColor(g?: string) { return g ? (SS_COLORS[g.toUpperCase()] ?? "#a78bfa") : null; }

// ── ExerciseCard ──────────────────────────────────────────────────────────────
interface CardProps {
  exercise: Exercise;
  log: ExerciseLog | undefined;
  week: number;
  mode: "trainer" | "client";
  onUpsertLog: (d: Omit<ExerciseLog, "id" | "loggedAt">) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ExerciseCard({ exercise, log, week, mode, onUpsertLog, onEdit, onDelete }: CardProps) {
  const sets = Math.max(1, exercise.sets || 3);
  const [data, setData] = useState<SetData[]>(() => parseSetData(log, sets));
  const orig = useRef<SetData[]>(parseSetData(log, sets));
  const dirty = areDirty(data, orig.current);

  // Re-sync when parent's log changes (DB refresh)
  useEffect(() => {
    const parsed = parseSetData(log, sets);
    setData(parsed);
    orig.current = parsed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.loggedAt, log?.reps, sets]);

  function targetRep(i: number) {
    return exercise.perSetReps?.[i] ?? exercise.targetReps ?? "—";
  }

  function updateWeight(i: number, val: string) {
    setData(prev => { const n = [...prev]; n[i] = { ...n[i], weight: val }; return n; });
  }

  function updateReps(i: number, val: string) {
    setData(prev => { const n = [...prev]; n[i] = { ...n[i], reps: val }; return n; });
  }

  function handleSave() {
    const { reps, weight } = serializeSetData(data);
    onUpsertLog({ exerciseId: exercise.id, weekNumber: week, reps, weight });
    orig.current = [...data];
    showToast("Salvato ✓");
  }

  function handleClear() {
    const blank = Array.from({ length: sets }, () => ({ reps: "", weight: "" }));
    setData(blank);
    onUpsertLog({ exerciseId: exercise.id, weekNumber: week, reps: undefined, weight: undefined });
    orig.current = blank;
    showToast("Dati cancellati");
  }

  const sessionDate = log
    ? new Date(log.loggedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "— / — / ——";

  const color = ssColor(exercise.supersetGroup);
  const cardBorder = color ? `2px solid ${color}40` : "1px solid rgba(255,255,255,0.07)";

  // Table column widths
  const cols = "4.5rem 1fr 1fr";
  const rowBorder = "1px solid rgba(255,255,255,0.05)";

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: cardBorder, background: "rgba(10,10,10,0.9)" }}>

      {/* ── Row 1: recovery | date ── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", borderBottom: rowBorder }}>
        <div className="flex items-center gap-1 px-3 py-2 text-xs font-bold shrink-0"
          style={{ background: "rgba(52,211,153,0.10)", color: "#34d399", borderRight: rowBorder, minWidth: "5.5rem" }}>
          ⏱ {exercise.restSeconds ?? "—"}″
        </div>
        <div className="flex items-center justify-center px-2 py-2 text-xs font-bold"
          style={{ background: "rgba(255,107,43,0.80)", color: "#fff", letterSpacing: "0.04em" }}>
          {sessionDate}
        </div>
      </div>

      {/* ── Row 2: exercise name | trainer controls ── */}
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

      {/* ── Row 3: column headers ── */}
      <div style={{ display: "grid", gridTemplateColumns: cols, borderBottom: rowBorder, background: "rgba(255,255,255,0.02)" }}>
        <div className="px-3 py-1.5 text-xs" style={{ color: "transparent", borderRight: rowBorder }}>·</div>
        <div className="px-3 py-1.5 text-xs font-semibold text-center"
          style={{ color: "rgba(245,240,232,0.35)", borderRight: rowBorder }}>ripetizioni</div>
        <div className="px-3 py-1.5 text-xs font-semibold text-center"
          style={{ color: "rgba(245,240,232,0.35)" }}>carico (kg)</div>
      </div>

      {/* ── Set rows ── */}
      {Array.from({ length: sets }, (_, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: cols,
          borderBottom: i < sets - 1 ? rowBorder : undefined,
          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
        }}>
          {/* Label */}
          <div className="flex items-center px-3 py-2.5 text-xs"
            style={{ color: "rgba(245,240,232,0.35)", borderRight: rowBorder }}>
            serie {i + 1}
          </div>
          {/* Target reps */}
          <div className="flex items-center justify-center px-2 py-2.5 text-xs font-semibold"
            style={{ color: "var(--accent-light)", borderRight: rowBorder }}>
            {targetRep(i)}
          </div>
          {/* Carico input (client) or logged value (trainer) */}
          {mode === "client" ? (
            <div className="flex items-center gap-1 px-1.5">
              <input
                type="number" min="0" step="0.5"
                value={data[i]?.weight ?? ""}
                onChange={e => updateWeight(i, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                placeholder="—"
                className="flex-1 text-center py-2.5 text-sm font-bold outline-none rounded-xl"
                style={{ background: "transparent", color: "var(--ivory)", border: "none", minWidth: 0 }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center px-2 py-2.5 text-sm font-bold"
              style={{ color: data[i]?.weight ? "var(--ivory)" : "rgba(245,240,232,0.18)" }}>
              {data[i]?.weight ? `${data[i].weight} kg` : "—"}
            </div>
          )}
        </div>
      ))}

      {/* ── Save / Clear bar (client only) ── */}
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

      {/* Trainer mode: note if any */}
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

// ── Supplement Card (client read-only) ───────────────────────────────────────
function SupplementCard({ item }: { item: SupplementItem }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!item.discountCode) return;
    navigator.clipboard.writeText(item.discountCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      {item.notes && (
        <p className="text-xs" style={{ color: "rgba(245,240,232,0.55)" }}>{item.notes}</p>
      )}
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
  // PT-only callbacks
  onAddExercise?: (data: Omit<Exercise, "id" | "order">) => void;
  onUpdateExercise?: (exerciseId: string, data: Partial<Exercise>) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateSupplements?: (items: SupplementItem[]) => void;
  // Logging
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
  const days = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  const [activeDay, setActiveDay] = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);

  // Supplement editor state (PT only)
  const [suppEditing, setSuppEditing] = useState(false);
  const [suppDraft, setSuppDraft] = useState<SupplementItem[]>(supplements);
  const [newSupp, setNewSupp] = useState<Omit<SupplementItem, "id">>({ name: "", brand: "", productUrl: "", discountCode: "", notes: "" });

  // Sync supplement draft when props change
  useEffect(() => { setSuppDraft(supplements); }, [supplements]);

  // Auto-select latest logged week for client
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

  // ── Supplement management ──
  function saveSupplements(items: SupplementItem[]) {
    setSuppDraft(items);
    onUpdateSupplements?.(items);
    showToast("Integratori salvati ✓");
  }

  function addSupp() {
    if (!newSupp.name.trim()) return;
    const item: SupplementItem = { ...newSupp, id: uid() };
    const updated = [...suppDraft, item];
    saveSupplements(updated);
    setNewSupp({ name: "", brand: "", productUrl: "", discountCode: "", notes: "" });
  }

  function removeSupp(id: string) {
    saveSupplements(suppDraft.filter(s => s.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Week navigator ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveWeek(w => Math.max(1, w - 1))} disabled={activeWeek === 1}
          className="p-2 rounded-xl transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ChevronLeft size={16} style={{ color: "var(--ivory)" }} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-sm font-bold" style={{ color: "var(--ivory)" }}>
            Settimana {activeWeek}
          </span>
          <span className="text-xs ml-2" style={{ color: "rgba(245,240,232,0.35)" }}>
            di {totalWeeks}
          </span>
        </div>
        <button onClick={() => setActiveWeek(w => Math.min(totalWeeks, w + 1))} disabled={activeWeek === totalWeeks}
          className="p-2 rounded-xl transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ChevronRight size={16} style={{ color: "var(--ivory)" }} />
        </button>
      </div>

      {/* ── Week progress mini-bar ── */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(activeWeek / totalWeeks) * 100}%`, background: "linear-gradient(90deg, #FF6B2B, #FF9A6C)" }} />
      </div>

      {/* ── Day tabs ── */}
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

      {/* ── Exercise grid (Google Sheets style) ── */}
      {dayExercises.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Dumbbell size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
            {mode === "trainer" ? "Nessun esercizio per questo giorno. Usa la vista Avanzato per aggiungere o importare esercizi." : "Il tuo trainer non ha ancora aggiunto esercizi per questo giorno."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {dayExercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              log={getLog(ex.id, activeWeek)}
              week={activeWeek}
              mode={mode}
              onUpsertLog={onUpsertLog}
              onEdit={() => {
                if (!onUpdateExercise) return;
                const name = prompt("Nome esercizio:", ex.name);
                if (name && name.trim()) onUpdateExercise(ex.id, { name: name.trim() });
              }}
              onDelete={() => { if (confirm(`Eliminare "${ex.name}"?`)) onRemoveExercise?.(ex.id); }}
            />
          ))}
        </div>
      )}

      {/* ── PT: add exercise note ── */}
      {mode === "trainer" && onAddExercise && (
        <p className="text-xs text-center" style={{ color: "rgba(245,240,232,0.25)" }}>
          Usa la scheda laterale per aggiungere o riordinare gli esercizi.
        </p>
      )}

      {/* ── Supplements section ── */}
      {(mode === "client" && suppDraft.length > 0) && (
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

      {/* ── PT: supplement manager ── */}
      {mode === "trainer" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--ivory)" }}>
                Integratori consigliati
                <span className="ml-2 text-xs font-normal" style={{ color: "rgba(245,240,232,0.35)" }}>
                  (visibili al cliente con link e codice sconto)
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

          {/* Current supplements list */}
          {suppDraft.length > 0 && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {suppDraft.map(item => (
                <div key={item.id} className="rounded-2xl p-3 flex items-start gap-3"
                  style={{ background: "rgba(255,107,43,0.03)", border: "1px solid rgba(255,107,43,0.1)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--ivory)" }}>{item.name}</p>
                    {item.brand && <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{item.brand}</p>}
                    {item.discountCode && (
                      <p className="text-xs mt-1 font-mono" style={{ color: "var(--accent-light)" }}>
                        Codice: {item.discountCode}
                      </p>
                    )}
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

          {/* Add new supplement form */}
          {suppEditing && (
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-semibold" style={{ color: "rgba(245,240,232,0.5)" }}>
                Aggiungi integratore
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "name",         placeholder: "Nome prodotto *",         label: "Nome" },
                  { key: "brand",        placeholder: "Brand (es. MyProtein)",   label: "Brand" },
                  { key: "discountCode", placeholder: "Codice sconto (es. TRAINER20)", label: "Codice sconto" },
                  { key: "productUrl",   placeholder: "Link affiliato",          label: "URL" },
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
              <input
                value={newSupp.notes ?? ""}
                onChange={e => setNewSupp(p => ({ ...p, notes: e.target.value }))}
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
              Nessun integratore aggiunto. Clicca "Gestisci" per aggiungerne uno con link affiliato e codice sconto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

