"use client";
import { useState, useEffect, useRef } from "react";
import type { Exercise, ExerciseLog } from "@/lib/store";
import {
  Plus, Trash2, ChevronUp, ChevronDown, CheckCircle2, Copy, ExternalLink,
  Pencil, Check, ChevronLeft, ChevronRight, Link as LinkIcon, X, Upload,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import { searchExercises, type LibraryExercise } from "@/lib/exerciseLibrary";
import { parseWorkoutCSV, generateCSVTemplate } from "@/lib/parseWorkoutCSV";

const MUSCLE_GROUPS = [
  "Petto", "Schiena", "Gambe", "Spalle", "Bicipiti",
  "Tricipiti", "Addominali", "Glutei", "Polpacci", "Full Body", "Altro",
];

interface Props {
  planId?: string;
  planName: string;
  exercises: Exercise[];
  logs: ExerciseLog[];
  totalWeeks?: number;
  daysPerWeek?: number;
  mode: "trainer" | "client";
  shareToken?: string;
  dayLabels?: Record<number, string>;
  onUpdateDayLabel?: (day: number, label: string) => void;
  onAddExercise?: (data: Omit<Exercise, "id" | "order">) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, data: Partial<Exercise>) => void;
  onMoveExercise?: (exerciseId: string, dir: "up" | "down") => void;
  onUpsertLog: (log: Omit<ExerciseLog, "id" | "loggedAt">) => void;
}

interface ActiveCell { exerciseId: string; week: number; weight: string; reps: string; note: string; }

type ExerciseFormData = {
  name: string;
  muscleGroup: string;
  sets: string;
  targetReps: string;
  usePerSetReps: boolean;
  perSetReps: string[]; // one entry per set
  restSeconds: string;
  notes: string;
  supersetGroup: string;
  videoUrl: string;
};

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };
const selectStyle = { background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };

function emptyForm(sets = 3): ExerciseFormData {
  return {
    name: "", muscleGroup: "", sets: String(sets), targetReps: "8-10",
    usePerSetReps: false, perSetReps: Array(sets).fill(""),
    restSeconds: "", notes: "", supersetGroup: "", videoUrl: "",
  };
}

function formToExercise(f: ExerciseFormData, day: number): Omit<Exercise, "id" | "order"> {
  const sets = Math.max(1, parseInt(f.sets) || 3);
  const perSet = f.usePerSetReps ? f.perSetReps.slice(0, sets) : undefined;
  return {
    name: f.name.trim(),
    muscleGroup: f.muscleGroup || undefined,
    sets,
    targetReps: f.targetReps || "—",
    perSetReps: perSet && perSet.some(Boolean) ? perSet : undefined,
    restSeconds: f.restSeconds.trim() || undefined,
    notes: f.notes.trim() || undefined,
    supersetGroup: f.supersetGroup.trim().toUpperCase() || undefined,
    videoUrl: f.videoUrl.trim() || undefined,
    day,
  };
}

function exerciseToForm(ex: Exercise): ExerciseFormData {
  const sets = ex.sets || 3;
  const usePerSetReps = Array.isArray(ex.perSetReps) && ex.perSetReps.length > 0;
  const perSetReps = usePerSetReps
    ? [...(ex.perSetReps ?? []), ...Array(Math.max(0, sets - (ex.perSetReps?.length ?? 0))).fill("")]
    : Array(sets).fill("");
  return {
    name: ex.name, muscleGroup: ex.muscleGroup ?? "", sets: String(sets),
    targetReps: ex.targetReps, usePerSetReps, perSetReps,
    restSeconds: ex.restSeconds ?? "", notes: ex.notes ?? "",
    supersetGroup: ex.supersetGroup ?? "", videoUrl: ex.videoUrl ?? "",
  };
}

// Superset group color palette
const SUPERSET_COLORS: Record<string, string> = {
  A: "#a78bfa", B: "#38bdf8", C: "#34d399", D: "#fbbf24",
  E: "#f472b6", F: "#fb923c", G: "#60a5fa", H: "#a3e635",
};
function ssColor(g?: string) { return g ? (SUPERSET_COLORS[g.toUpperCase()] ?? "var(--accent)") : null; }

// Render rep targets for a given exercise
function renderRepTargets(ex: Exercise): React.ReactNode {
  if (ex.perSetReps && ex.perSetReps.some(Boolean)) {
    return (
      <div className="space-y-0.5">
        {ex.perSetReps.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-xs w-12 font-medium" style={{ color: "rgba(245,240,232,0.35)" }}>
              Serie {i + 1}
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>
              {r || "—"} rep
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <span className="text-xs" style={{ color: "rgba(245,240,232,0.55)" }}>
      {ex.sets} × {ex.targetReps} rep
    </span>
  );
}

// ── ExerciseFormPanel ─────────────────────────────────────────────────────────
interface FormPanelProps {
  form: ExerciseFormData;
  onChange: (data: ExerciseFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  compact?: boolean;
}

function ExerciseFormPanel({ form, onChange, onSubmit, onCancel, submitLabel, compact }: FormPanelProps) {
  const sets = Math.max(1, parseInt(form.sets) || 3);
  const [suggestions, setSuggestions] = useState<LibraryExercise[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [activeSugg, setActiveSugg] = useState(-1);
  const suggRef = useRef<HTMLDivElement>(null);

  function handleNameChange(val: string) {
    onChange({ ...form, name: val });
    if (val.trim().length >= 2) {
      const results = searchExercises(val, form.muscleGroup || undefined);
      setSuggestions(results);
      setShowSugg(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSugg(false);
    }
    setActiveSugg(-1);
  }

  function pickSuggestion(ex: LibraryExercise) {
    onChange({ ...form, name: ex.name, muscleGroup: ex.muscleGroup });
    setSuggestions([]);
    setShowSugg(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (!showSugg) { if (e.key === "Enter") onSubmit(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSugg((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveSugg((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeSugg >= 0) pickSuggestion(suggestions[activeSugg]); else onSubmit(); }
    else if (e.key === "Escape") { setShowSugg(false); }
  }

  function updateSets(val: string) {
    const n = Math.max(1, parseInt(val) || 1);
    const perSetReps = [...form.perSetReps];
    while (perSetReps.length < n) perSetReps.push("");
    onChange({ ...form, sets: val, perSetReps: perSetReps.slice(0, n) });
  }

  function updatePerSetRep(i: number, val: string) {
    const perSetReps = [...form.perSetReps];
    perSetReps[i] = val;
    onChange({ ...form, perSetReps });
  }

  return (
    <div className={`space-y-3 ${compact ? "text-xs" : "text-sm"}`}>
      {/* Row 1: name + muscle */}
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
        <div className={`relative ${compact ? "" : "sm:col-span-2"}`}>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Nome esercizio *</label>}
          <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={() => setTimeout(() => setShowSugg(false), 150)}
            onFocus={() => { if (form.name.trim().length >= 2 && suggestions.length > 0) setShowSugg(true); }}
            placeholder="es. Lat Machine, Panca Piana… (digita per suggerimenti)" autoFocus
            className={`w-full px-3 rounded-xl outline-none ${compact ? "py-2 text-xs" : "py-2.5 text-sm"}`}
            style={inputStyle} />
          {showSugg && (
            <div ref={suggRef} className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,107,43,0.25)", top: "100%" }}>
              {suggestions.map((ex, i) => (
                <button key={ex.name} type="button"
                  onMouseDown={() => pickSuggestion(ex)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors"
                  style={{
                    background: i === activeSugg ? "rgba(255,107,43,0.12)" : "transparent",
                    borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}>
                  <span className="text-xs font-medium truncate" style={{ color: "var(--ivory)" }}>{ex.name}</span>
                  <span className="text-xs shrink-0 px-1.5 py-0.5 rounded-md" style={{ background: "rgba(255,107,43,0.1)", color: "var(--accent-light)" }}>
                    {ex.muscleGroup}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Gruppo muscolare</label>}
          <select value={form.muscleGroup} onChange={(e) => onChange({ ...form, muscleGroup: e.target.value })}
            className={`w-full px-3 rounded-xl outline-none ${compact ? "py-2 text-xs" : "py-2.5 text-sm"}`}
            style={selectStyle}>
            <option value="">Gruppo —</option>
            {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: sets + rep mode toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Serie</label>}
          <input type="number" min="1" max="10" value={form.sets}
            onChange={(e) => updateSets(e.target.value)}
            placeholder="Serie" className="w-20 px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
        <button onClick={() => onChange({ ...form, usePerSetReps: !form.usePerSetReps })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all mt-0 sm:mt-5"
          style={form.usePerSetReps
            ? { background: "rgba(255,107,43,0.14)", border: "1px solid rgba(255,107,43,0.35)", color: "var(--accent-light)" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
          {form.usePerSetReps ? <Check size={11} /> : <Plus size={11} />}
          Rep variabili per serie
        </button>
        <div className="flex-1" />
      </div>

      {/* Rep targets */}
      {form.usePerSetReps ? (
        <div>
          {!compact && <label className="block text-xs mb-2" style={{ color: "rgba(245,240,232,0.5)" }}>Rep target per serie</label>}
          <div className={`grid gap-2 ${sets === 1 ? "grid-cols-1" : sets === 2 ? "grid-cols-2" : sets === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
            {Array.from({ length: sets }, (_, i) => (
              <div key={i}>
                <label className="block text-xs mb-1 text-center" style={{ color: "rgba(245,240,232,0.4)" }}>S{i + 1}</label>
                <input value={form.perSetReps[i] ?? ""}
                  onChange={(e) => updatePerSetRep(i, e.target.value)}
                  placeholder="12" className="w-full px-2 py-2 rounded-xl text-sm text-center outline-none" style={inputStyle} />
              </div>
            ))}
          </div>
          <p className="text-xs mt-1.5" style={{ color: "rgba(245,240,232,0.3)" }}>
            Puoi scrivere: 12, 8-10, AMRAP, 10+4 (drop), ecc.
          </p>
        </div>
      ) : (
        <div>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Rep target (uguale per tutte le serie)</label>}
          <input value={form.targetReps} onChange={(e) => onChange({ ...form, targetReps: e.target.value })}
            placeholder="es. 8-10 / 12 / AMRAP / 10+4 (drop)" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
      )}

      {/* Row: rest + superset */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Recupero (sec)</label>}
          <input value={form.restSeconds} onChange={(e) => onChange({ ...form, restSeconds: e.target.value })}
            placeholder="es. 90 / 60-90 / 120" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          {!compact && (
            <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>
              Superset <span style={{ color: "rgba(245,240,232,0.35)" }}>(A, B, C…)</span>
            </label>
          )}
          <input value={form.supersetGroup} onChange={(e) => onChange({ ...form, supersetGroup: e.target.value.slice(0, 2) })}
            placeholder="Superset A/B…" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}
            title="Assegna la stessa lettera a più esercizi per raggrupparli in superset" />
        </div>
      </div>

      {/* Row: notes + video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className={compact ? "" : ""}>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Note tecniche</label>}
          <input value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })}
            placeholder="es. busto inclinato 30°, pausa in basso…" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          {!compact && <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Link video (opzionale)</label>}
          <input value={form.videoUrl} onChange={(e) => onChange({ ...form, videoUrl: e.target.value })}
            placeholder="https://youtube.com/..." className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
          Annulla
        </button>
        <button onClick={onSubmit} disabled={!form.name.trim()}
          className="flex-1 accent-btn flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm disabled:opacity-40">
          <Check size={14} /> {submitLabel}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WorkoutSpreadsheet({
  planName, exercises, logs, totalWeeks = 12, daysPerWeek = 3,
  mode, shareToken, dayLabels = {}, onUpdateDayLabel,
  onAddExercise, onRemoveExercise, onUpdateExercise,
  onMoveExercise, onUpsertLog,
}: Props) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const days = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  const [activeDay, setActiveDay] = useState(1);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState<ExerciseFormData>(emptyForm(3));
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExerciseFormData>(emptyForm(3));
  const [copied, setCopied] = useState(false);
  const [editingDayLabel, setEditingDayLabel] = useState<number | null>(null);
  const [dayLabelDraft, setDayLabelDraft] = useState("");
  const [showImportGuide, setShowImportGuide] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileWeek, setMobileWeek] = useState(1);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile || logs.length === 0) return;
    const lastWeek = Math.min(Math.max(...logs.map((l) => l.weekNumber)), totalWeeks);
    setMobileWeek(lastWeek);
  }, [isMobile, logs.length, totalWeeks]);

  const shareUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/scheda/${shareToken}`
    : null;

  const dayExercises = [...exercises]
    .filter((e) => (e.day ?? 1) === activeDay)
    .sort((a, b) => a.order - b.order);

  function getDayLabel(d: number) { return dayLabels[d] || `Giorno ${d}`; }
  function startEditDayLabel(d: number) { setEditingDayLabel(d); setDayLabelDraft(dayLabels[d] || ""); }
  function saveDayLabel(d: number) { onUpdateDayLabel?.(d, dayLabelDraft.trim()); setEditingDayLabel(null); }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onAddExercise) return;
    const text = await file.text();
    const imported = parseWorkoutCSV(text);
    if (imported.length === 0) {
      showToast("Nessun esercizio trovato — controlla il formato del file");
      setShowImportGuide(true);
    } else {
      for (const ex of imported) {
        onAddExercise(ex);
      }
      showToast(`${imported.length} esercizi importati`);
    }
    e.target.value = "";
  }

  function handleDownloadTemplate() {
    const csv = generateCSVTemplate(daysPerWeek);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trainerpro_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function getLog(exerciseId: string, week: number) {
    return logs.find((l) => l.exerciseId === exerciseId && l.weekNumber === week);
  }

  function openCell(exerciseId: string, week: number) {
    const existing = getLog(exerciseId, week);
    setActiveCell({ exerciseId, week, weight: existing?.weight?.toString() ?? "", reps: existing?.reps ?? "", note: existing?.note ?? "" });
  }

  function saveCell() {
    if (!activeCell) return;
    const { exerciseId, week, weight, reps, note } = activeCell;
    if (!weight && !reps) { setActiveCell(null); return; }
    onUpsertLog({ exerciseId, weekNumber: week, weight: weight ? parseFloat(weight) : undefined, reps: reps || undefined, note: note || undefined });
    setActiveCell(null);
    showToast("Salvato ✓");
  }

  function handleAddExercise() {
    if (!addForm.name.trim() || !onAddExercise) return;
    onAddExercise(formToExercise(addForm, activeDay));
    setAddForm(emptyForm(parseInt(addForm.sets) || 3));
    setShowAddRow(false);
    showToast("Esercizio aggiunto");
  }

  function startEdit(ex: Exercise) {
    setEditId(ex.id);
    setEditForm(exerciseToForm(ex));
  }

  function saveEdit() {
    if (!editId || !onUpdateExercise || !editForm.name.trim()) return;
    const { day, ...rest } = formToExercise(editForm, activeDay);
    onUpdateExercise(editId, rest);
    setEditId(null);
    showToast("Esercizio aggiornato");
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  // ── Shared: CSV import guide modal (used in both mobile + desktop) ──────────
  const importGuideModal = showImportGuide ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowImportGuide(false)}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
      <div className="relative w-full max-w-lg glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload size={16} style={{ color: "var(--accent)" }} />
            <h3 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Importa esercizi da CSV</h3>
          </div>
          <button onClick={() => setShowImportGuide(false)}>
            <X size={16} style={{ color: "rgba(245,240,232,0.4)" }} />
          </button>
        </div>
        <p className="text-xs mb-3" style={{ color: "rgba(245,240,232,0.55)" }}>
          Il file CSV deve avere una riga di intestazione con queste colonne (l&apos;ordine non importa):
        </p>
        <div className="rounded-xl p-3 mb-4 text-xs font-mono overflow-x-auto" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>
          <p style={{ color: "var(--accent-light)" }}>Esercizio,Giorno,Serie,Ripetizioni,Recupero,Gruppo</p>
          <p style={{ color: "rgba(245,240,232,0.6)" }}>Panca Piana,1,4,8-10,120,Petto</p>
          <p style={{ color: "rgba(245,240,232,0.6)" }}>Squat,1,4,10,90,Gambe</p>
          <p style={{ color: "rgba(245,240,232,0.6)" }}>Curl Bilanciere,2,3,12,60,Bicipiti</p>
        </div>
        <div className="space-y-1.5 mb-5">
          {([
            ["Esercizio", "Nome esercizio (obbligatorio)"],
            ["Giorno", "Numero giorno — 1, 2, 3... (default: 1)"],
            ["Serie", "Numero di serie (default: 3)"],
            ["Ripetizioni", "Target reps — es. 8-10 o 12 (default: 10)"],
            ["Recupero", "Secondi di recupero — es. 90 (opzionale)"],
            ["Gruppo", "Gruppo muscolare (opzionale)"],
          ] as [string, string][]).map(([col, desc]) => (
            <div key={col} className="flex items-baseline gap-2 text-xs">
              <span className="font-mono font-semibold w-24 flex-shrink-0" style={{ color: "var(--accent-light)" }}>{col}</span>
              <span style={{ color: "rgba(245,240,232,0.5)" }}>{desc}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm flex-shrink-0"
            style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
            <Upload size={14} style={{ transform: "rotate(180deg)" }} /> Scarica template
          </button>
          <button
            onClick={() => {
              setShowImportGuide(false);
              setTimeout(() => importInputRef.current?.click(), 50);
            }}
            className="flex-1 accent-btn flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm">
            <Upload size={14} /> Scegli file CSV
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ── MOBILE VIEW ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div>
        {/* Share link (trainer) */}
        {mode === "trainer" && shareUrl && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.15)" }}>
            <ExternalLink size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span className="text-xs flex-1 truncate" style={{ color: "rgba(245,240,232,0.5)", fontFamily: "monospace" }}>{shareUrl}</span>
            <button onClick={copyLink} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,107,43,0.1)", color: copied ? "#22c55e" : "var(--accent-light)", border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(255,107,43,0.2)"}` }}>
              {copied ? <><CheckCircle2 size={10} /> Copiato</> : <><Copy size={10} /> Copia</>}
            </button>
          </div>
        )}

        {/* Day tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {days.map((d) => {
            const count = exercises.filter((e) => (e.day ?? 1) === d).length;
            return (
              <button key={d} onClick={() => { setActiveDay(d); setActiveCell(null); setShowAddRow(false); setEditId(null); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all"
                style={{
                  background: activeDay === d ? "rgba(255,107,43,0.14)" : "rgba(255,255,255,0.04)",
                  color: activeDay === d ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
                  border: `1px solid ${activeDay === d ? "rgba(255,107,43,0.3)" : "rgba(255,255,255,0.07)"}`,
                  fontWeight: activeDay === d ? "600" : "400",
                }}>
                {getDayLabel(d)}{count > 0 && ` (${count})`}
              </button>
            );
          })}
        </div>

        {/* Week navigator */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button onClick={() => setMobileWeek((w) => Math.max(1, w - 1))} disabled={mobileWeek === 1}
            className="p-2 rounded-xl disabled:opacity-30" style={{ background: "rgba(255,255,255,0.05)" }}>
            <ChevronLeft size={16} style={{ color: "var(--ivory)" }} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: "var(--ivory)" }}>Settimana {mobileWeek}</p>
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>di {totalWeeks}</p>
          </div>
          <button onClick={() => setMobileWeek((w) => Math.min(totalWeeks, w + 1))} disabled={mobileWeek === totalWeeks}
            className="p-2 rounded-xl disabled:opacity-30" style={{ background: "rgba(255,255,255,0.05)" }}>
            <ChevronRight size={16} style={{ color: "var(--ivory)" }} />
          </button>
        </div>

        {/* Add exercise (trainer) */}
        {mode === "trainer" && !showAddRow && !editId && (
          <div className="flex gap-2 mb-3">
            <button onClick={() => setShowAddRow(true)}
              className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
              <Plus size={14} /> Aggiungi esercizio
            </button>
            <button onClick={() => setShowImportGuide(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.55)" }}
              title="Importa esercizi da CSV">
              <Upload size={14} /> CSV
            </button>
            <input ref={importInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImportCSV} />
          </div>
        )}

        {mode === "trainer" && showAddRow && (
          <div className="mb-4 p-4 rounded-2xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.2)" }}>
            <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>
              Nuovo esercizio — {getDayLabel(activeDay)}
            </p>
            <ExerciseFormPanel
              form={addForm}
              onChange={setAddForm}
              onSubmit={handleAddExercise}
              onCancel={() => setShowAddRow(false)}
              submitLabel="Aggiungi"
              compact
            />
          </div>
        )}

        {/* Exercise cards */}
        {dayExercises.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ border: "1px dashed rgba(255,107,43,0.15)" }}>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
              {mode === "trainer" ? "Nessun esercizio — aggiungine uno" : "Nessun esercizio pianificato"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayExercises.map((ex, idx) => {
              const color = ssColor(ex.supersetGroup);
              const prevEx = idx > 0 ? dayExercises[idx - 1] : null;
              const isSupersetContinue = color && prevEx?.supersetGroup === ex.supersetGroup;
              const log = getLog(ex.id, mobileWeek);
              const isEditingThis = editId === ex.id;

              return (
                <div key={ex.id} className="card-luxury rounded-2xl overflow-hidden"
                  style={color ? { borderLeft: `3px solid ${color}` } : {}}>
                  {isSupersetContinue && (
                    <div className="px-4 py-1 text-xs flex items-center gap-2" style={{ background: `${color}10`, color }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700 }}>SS-{ex.supersetGroup}</span>
                      <span className="opacity-50">↑ superset con {prevEx?.name}</span>
                    </div>
                  )}
                  <div className="p-4">
                    {/* Exercise header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {color && !isSupersetContinue && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                              SS-{ex.supersetGroup}
                            </span>
                          )}
                          <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{ex.name}</p>
                          {ex.videoUrl && (
                            <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer">
                              <LinkIcon size={11} style={{ color: "var(--accent)" }} />
                            </a>
                          )}
                        </div>
                        {ex.muscleGroup && <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{ex.muscleGroup}</p>}
                        <div className="mt-1">{renderRepTargets(ex)}</div>
                        {ex.restSeconds && <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>Recupero: {ex.restSeconds}s</p>}
                        {ex.notes && (
                          <p className="text-xs mt-1 italic" style={{ color: "rgba(245,240,232,0.5)", borderLeft: "2px solid rgba(255,107,43,0.2)", paddingLeft: "6px" }}>
                            {ex.notes}
                          </p>
                        )}
                      </div>
                      {mode === "trainer" && (
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          <button onClick={() => startEdit(ex)} className="p-1.5 rounded-lg hover:bg-white/5">
                            <Pencil size={12} style={{ color: "rgba(245,240,232,0.4)" }} />
                          </button>
                          <button onClick={() => onRemoveExercise?.(ex.id)} className="p-1.5 rounded-lg hover:bg-red-500/10">
                            <Trash2 size={12} style={{ color: "rgba(239,68,68,0.5)" }} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline edit */}
                    {mode === "trainer" && isEditingThis && (
                      <div className="mb-3 p-3 rounded-xl" style={{ background: "rgba(255,107,43,0.05)", border: "1px solid rgba(255,107,43,0.2)" }}>
                        <ExerciseFormPanel form={editForm} onChange={setEditForm}
                          onSubmit={saveEdit} onCancel={() => setEditId(null)}
                          submitLabel="Salva" compact />
                      </div>
                    )}

                    {/* Log cell */}
                    {activeCell?.exerciseId === ex.id && activeCell?.week === mobileWeek ? (
                      <div className="p-3 rounded-xl mt-2" style={{ background: "rgba(255,107,43,0.07)", border: "1px solid rgba(255,107,43,0.2)" }}>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input type="number" value={activeCell.weight}
                            onChange={(e) => setActiveCell({ ...activeCell, weight: e.target.value })}
                            placeholder="kg" autoFocus
                            className="px-3 py-2 rounded-xl text-sm outline-none"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                          <input value={activeCell.reps}
                            onChange={(e) => setActiveCell({ ...activeCell, reps: e.target.value })}
                            placeholder="rep (12/10/8)"
                            onKeyDown={(e) => { if (e.key === "Enter") saveCell(); if (e.key === "Escape") setActiveCell(null); }}
                            className="px-3 py-2 rounded-xl text-sm outline-none"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                        </div>
                        <input value={activeCell.note}
                          onChange={(e) => setActiveCell({ ...activeCell, note: e.target.value })}
                          placeholder="nota libera…"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--ivory)" }} />
                        <div className="flex gap-2">
                          <button onClick={() => setActiveCell(null)} className="flex-1 py-2 rounded-xl text-sm font-medium"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
                          <button onClick={saveCell} className="flex-1 accent-btn py-2 rounded-xl text-sm font-medium">Salva</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => openCell(ex.id, mobileWeek)}
                        className="w-full mt-2 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          background: log?.weight || log?.reps ? "rgba(255,107,43,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${log?.weight || log?.reps ? "rgba(255,107,43,0.2)" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        {log?.weight || log?.reps ? (
                          <div className="flex items-center justify-center gap-3">
                            {log?.weight && <span className="font-bold" style={{ color: "var(--accent-light)" }}>{log.weight} kg</span>}
                            {log?.reps && <span style={{ color: "rgba(245,240,232,0.6)" }}>{log.reps} rep</span>}
                            {log?.note && <span className="text-xs italic" style={{ color: "rgba(245,240,232,0.35)" }}>{log.note}</span>}
                            <Pencil size={11} style={{ color: "rgba(245,240,232,0.3)" }} />
                          </div>
                        ) : (
                          <span className="flex items-center justify-center gap-2" style={{ color: "rgba(245,240,232,0.3)" }}>
                            <Plus size={14} /> Inserisci sett. {mobileWeek}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs mt-4 text-center" style={{ color: "rgba(245,240,232,0.2)" }}>
          ← → per navigare tra le settimane · tocca una cella per inserire
        </p>
        {importGuideModal}
      </div>
    );
  }

  // ── DESKTOP TABLE VIEW ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Share link (trainer only) */}
      {mode === "trainer" && shareUrl && (
        <div className="flex items-center gap-3 mb-5 p-3.5 rounded-xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.15)" }}>
          <ExternalLink size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span className="text-xs flex-1 truncate" style={{ color: "rgba(245,240,232,0.5)", fontFamily: "monospace" }}>{shareUrl}</span>
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,107,43,0.1)", color: copied ? "#22c55e" : "var(--accent-light)", border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(255,107,43,0.2)"}` }}>
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied ? "Copiato!" : "Copia link"}
          </button>
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {days.map((d) => {
          const count = exercises.filter((e) => (e.day ?? 1) === d).length;
          const isActive = activeDay === d;
          const isEditing = editingDayLabel === d;
          return (
            <div key={d} className="relative flex-shrink-0">
              {isEditing && mode === "trainer" ? (
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,107,43,0.14)", border: "1px solid rgba(255,107,43,0.3)" }}>
                  <input autoFocus value={dayLabelDraft} onChange={(e) => setDayLabelDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveDayLabel(d); if (e.key === "Escape") setEditingDayLabel(null); }}
                    placeholder={`Giorno ${d}`}
                    className="text-sm outline-none w-28 bg-transparent" style={{ color: "var(--accent-light)" }} />
                  <button onClick={() => saveDayLabel(d)} className="p-0.5 rounded hover:bg-white/10">
                    <Check size={12} style={{ color: "#22c55e" }} />
                  </button>
                  <button onClick={() => setEditingDayLabel(null)} className="p-0.5 rounded hover:bg-white/10 text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>✕</button>
                </div>
              ) : (
                <button onClick={() => { setActiveDay(d); setShowAddRow(false); setActiveCell(null); setEditId(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all group/tab"
                  style={{
                    background: isActive ? "rgba(255,107,43,0.14)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
                    border: `1px solid ${isActive ? "rgba(255,107,43,0.3)" : "rgba(255,255,255,0.07)"}`,
                    fontWeight: isActive ? "600" : "400",
                  }}>
                  <span>{getDayLabel(d)}</span>
                  {count > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: isActive ? "rgba(255,107,43,0.2)" : "rgba(255,255,255,0.08)", color: isActive ? "var(--accent-light)" : "rgba(245,240,232,0.4)" }}>
                      {count}
                    </span>
                  )}
                  {mode === "trainer" && isActive && (
                    <span role="button" onClick={(e) => { e.stopPropagation(); startEditDayLabel(d); }}
                      className="opacity-0 group-hover/tab:opacity-60 hover:!opacity-100 transition-opacity ml-0.5" title="Rinomina">
                      <Pencil size={10} />
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add exercise panel */}
      {mode === "trainer" && !showAddRow && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setShowAddRow(true); setEditId(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
            <Plus size={14} /> Aggiungi esercizio — {getDayLabel(activeDay)}
          </button>
          <button onClick={() => setShowImportGuide(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.55)" }}
            title="Importa esercizi da CSV">
            <Upload size={14} /> Importa CSV
          </button>
        </div>
      )}

      {mode === "trainer" && showAddRow && (
        <div className="mb-5 p-5 rounded-2xl" style={{ background: "rgba(255,107,43,0.05)", border: "1px solid rgba(255,107,43,0.2)" }}>
          <p className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>
            Nuovo esercizio — {getDayLabel(activeDay)}
          </p>
          <ExerciseFormPanel
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAddExercise}
            onCancel={() => setShowAddRow(false)}
            submitLabel="Aggiungi esercizio"
          />
        </div>
      )}

      {dayExercises.length === 0 ? (
        <div className="text-center py-14 rounded-2xl" style={{ border: "1px dashed rgba(255,107,43,0.15)" }}>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
            {mode === "trainer" ? `Nessun esercizio per ${getDayLabel(activeDay)} — aggiungine uno sopra` : `Nessun esercizio pianificato per ${getDayLabel(activeDay)}`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,107,43,0.12)" }}>
          <table className="w-full border-collapse" style={{ minWidth: `${360 + totalWeeks * 120}px` }}>
            <thead>
              <tr style={{ background: "rgba(255,107,43,0.08)" }}>
                {mode === "trainer" && <th className="w-8 p-2" style={{ borderRight: "1px solid rgba(255,107,43,0.1)" }} />}
                <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--accent-light)", minWidth: "240px", borderRight: "2px solid rgba(255,107,43,0.15)", position: "sticky", left: 0, background: "rgba(15,8,4,0.98)", zIndex: 10 }}>
                  Esercizio · {getDayLabel(activeDay)}
                </th>
                {weeks.map((w) => (
                  <th key={w} className="text-center p-3 text-xs font-semibold"
                    style={{ color: "rgba(245,240,232,0.45)", minWidth: "120px", borderRight: "1px solid rgba(255,107,43,0.07)" }}>
                    Sett. {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayExercises.map((ex, idx) => {
                const color = ssColor(ex.supersetGroup);
                const isEditingThis = editId === ex.id;
                const prevEx = idx > 0 ? dayExercises[idx - 1] : null;
                const isSupersetStart = color && (!prevEx || prevEx.supersetGroup !== ex.supersetGroup);
                const isSupersetContinue = color && prevEx?.supersetGroup === ex.supersetGroup;

                return (
                  <tr key={ex.id}
                    style={{
                      borderTop: isSupersetContinue
                        ? `1px dashed ${color}30`
                        : "1px solid rgba(255,107,43,0.06)",
                      borderLeft: color ? `3px solid ${color}` : undefined,
                    }}
                    className="group hover:bg-white/[0.015] transition-colors">
                    {/* Reorder controls */}
                    {mode === "trainer" && (
                      <td className="w-8 p-1 text-center" style={{ borderRight: "1px solid rgba(255,107,43,0.07)" }}>
                        <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onMoveExercise?.(ex.id, "up")} disabled={idx === 0}
                            className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                            <ChevronUp size={11} style={{ color: "rgba(245,240,232,0.4)" }} />
                          </button>
                          <button onClick={() => onMoveExercise?.(ex.id, "down")} disabled={idx === dayExercises.length - 1}
                            className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                            <ChevronDown size={11} style={{ color: "rgba(245,240,232,0.4)" }} />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* Exercise info cell */}
                    <td className="p-3" style={{ borderRight: "2px solid rgba(255,107,43,0.12)", position: "sticky", left: 0, background: "rgba(10,10,10,0.98)", zIndex: 5, minWidth: "240px" }}>
                      {isEditingThis ? (
                        <div className="py-1">
                          <ExerciseFormPanel
                            form={editForm}
                            onChange={setEditForm}
                            onSubmit={saveEdit}
                            onCancel={() => setEditId(null)}
                            submitLabel="Salva modifiche"
                            compact
                          />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              {color && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: `${color}20`, color, border: `1px solid ${color}40`, fontFamily: "monospace" }}>
                                  SS-{ex.supersetGroup}
                                </span>
                              )}
                              <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{ex.name}</p>
                              {ex.videoUrl && (
                                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer"
                                  className="hover:opacity-80" title="Guarda video">
                                  <LinkIcon size={11} style={{ color: "var(--accent)" }} />
                                </a>
                              )}
                            </div>
                            {ex.muscleGroup && (
                              <p className="text-xs mb-1" style={{ color: "rgba(245,240,232,0.35)" }}>{ex.muscleGroup}</p>
                            )}
                            {renderRepTargets(ex)}
                            {ex.restSeconds && (
                              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>
                                Recupero: {ex.restSeconds}s
                              </p>
                            )}
                            {ex.notes && (
                              <p className="text-xs mt-1 italic" style={{ color: "rgba(245,240,232,0.4)", borderLeft: "2px solid rgba(255,107,43,0.2)", paddingLeft: "6px" }}>
                                {ex.notes}
                              </p>
                            )}
                          </div>
                          {mode === "trainer" && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => startEdit(ex)} className="p-1 rounded hover:bg-white/10" title="Modifica">
                                <Pencil size={11} style={{ color: "rgba(245,240,232,0.4)" }} />
                              </button>
                              <button onClick={() => onRemoveExercise?.(ex.id)} className="p-1 rounded hover:bg-red-500/10">
                                <Trash2 size={11} style={{ color: "rgba(239,68,68,0.5)" }} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Week log cells */}
                    {weeks.map((w) => {
                      const log = getLog(ex.id, w);
                      const isActive = activeCell?.exerciseId === ex.id && activeCell?.week === w;
                      const hasData = log?.weight || log?.reps;
                      return (
                        <td key={w} className="p-0" style={{ borderRight: "1px solid rgba(255,107,43,0.05)", verticalAlign: "top" }}>
                          {isActive ? (
                            <div className="p-2" style={{ background: "rgba(255,107,43,0.07)", minWidth: "120px" }}>
                              <input type="number" value={activeCell.weight}
                                onChange={(e) => setActiveCell({ ...activeCell, weight: e.target.value })}
                                placeholder="kg" autoFocus
                                className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1"
                                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                              <input value={activeCell.reps}
                                onChange={(e) => setActiveCell({ ...activeCell, reps: e.target.value })}
                                placeholder="rep (12/10/8)"
                                onKeyDown={(e) => { if (e.key === "Enter") saveCell(); if (e.key === "Escape") setActiveCell(null); }}
                                className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1"
                                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                              <input value={activeCell.note}
                                onChange={(e) => setActiveCell({ ...activeCell, note: e.target.value })}
                                placeholder="nota…"
                                className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1.5"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--ivory)" }} />
                              <div className="flex gap-1">
                                <button onClick={() => setActiveCell(null)} className="flex-1 py-1 rounded text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.5)" }}>✕</button>
                                <button onClick={saveCell} className="flex-1 accent-btn py-1 rounded text-xs">✓</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => openCell(ex.id, w)}
                              className="w-full h-full p-2.5 text-center transition-colors hover:bg-white/[0.03]"
                              style={{ minHeight: "64px", cursor: "pointer" }}>
                              {hasData ? (
                                <div>
                                  {log?.weight && <p className="text-sm font-bold" style={{ color: "var(--accent-light)" }}>{log.weight} kg</p>}
                                  {log?.reps && <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.6)" }}>{log.reps}</p>}
                                  {log?.note && <p className="text-xs mt-0.5 italic truncate" style={{ color: "rgba(245,240,232,0.3)" }}>{log.note}</p>}
                                </div>
                              ) : (
                                <span className="text-xs" style={{ color: "rgba(245,240,232,0.12)" }}>—</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: "rgba(245,240,232,0.22)" }}>
        {mode === "trainer"
          ? "Hover sul tab giorno per rinominarlo · Clicca su una cella per inserire peso/reps · SS-A/B = superset"
          : "Clicca su una cella per inserire il peso e le ripetizioni · Invio per salvare"}
      </p>

      <input ref={importInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImportCSV} />
      {importGuideModal}
    </div>
  );
}

