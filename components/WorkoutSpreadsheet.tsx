"use client";
import { useState, useEffect } from "react";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle2, Copy, ExternalLink, Pencil, Check, ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { showToast } from "@/components/Toast";

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
  restSeconds?: number; // plan-level default rest
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

interface ActiveCell { exerciseId: string; week: number; weight: string; reps: string; }

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };
const selectStyle = { background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };

function formatRest(sec: number) {
  if (sec < 60) return `${sec}″`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}′${s}″` : `${m}′`;
}

const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300];

export default function WorkoutSpreadsheet({
  planName, exercises, logs, totalWeeks = 12, daysPerWeek = 3,
  restSeconds: planRestSeconds,
  mode, shareToken, dayLabels = {}, onUpdateDayLabel,
  onAddExercise, onRemoveExercise, onUpdateExercise,
  onMoveExercise, onUpsertLog,
}: Props) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const days = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  const [activeDay, setActiveDay] = useState(1);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", muscleGroup: "", sets: "3", targetReps: "8-10", restSeconds: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", muscleGroup: "", sets: "3", targetReps: "8-10", restSeconds: "", notes: "" });
  const [copied, setCopied] = useState(false);
  const [editingDayLabel, setEditingDayLabel] = useState<number | null>(null);
  const [dayLabelDraft, setDayLabelDraft] = useState("");

  // Mobile: which week to show (1-based)
  const [isMobile, setIsMobile] = useState(false);
  const [mobileWeek, setMobileWeek] = useState(1);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-advance to last logged week on mobile
  useEffect(() => {
    if (!isMobile || logs.length === 0) return;
    const lastWeek = Math.min(Math.max(...logs.map((l) => l.weekNumber)), totalWeeks);
    setMobileWeek(lastWeek);
  }, [isMobile, logs.length, totalWeeks]);

  const shareUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/cliente/${shareToken}`
    : null;

  const dayExercises = [...exercises]
    .filter((e) => (e.day ?? 1) === activeDay)
    .sort((a, b) => a.order - b.order);

  function getDayLabel(d: number) {
    return dayLabels[d] || `Giorno ${d}`;
  }

  function startEditDayLabel(d: number) {
    setEditingDayLabel(d);
    setDayLabelDraft(dayLabels[d] || "");
  }

  function saveDayLabel(d: number) {
    onUpdateDayLabel?.(d, dayLabelDraft.trim());
    setEditingDayLabel(null);
  }

  function getLog(exerciseId: string, week: number) {
    return logs.find((l) => l.exerciseId === exerciseId && l.weekNumber === week);
  }

  function openCell(exerciseId: string, week: number) {
    const existing = getLog(exerciseId, week);
    setActiveCell({ exerciseId, week, weight: existing?.weight?.toString() ?? "", reps: existing?.reps ?? "" });
  }

  function saveCell() {
    if (!activeCell) return;
    const { exerciseId, week, weight, reps } = activeCell;
    if (!weight && !reps) { setActiveCell(null); return; }
    onUpsertLog({ exerciseId, weekNumber: week, weight: weight ? parseFloat(weight) : undefined, reps: reps || undefined });
    setActiveCell(null);
    showToast("Salvato ✓");
  }

  function handleAddExercise() {
    if (!addForm.name || !onAddExercise) return;
    onAddExercise({
      name: addForm.name, muscleGroup: addForm.muscleGroup || undefined,
      sets: parseInt(addForm.sets) || 3, targetReps: addForm.targetReps,
      restSeconds: addForm.restSeconds ? parseInt(addForm.restSeconds) : planRestSeconds,
      notes: addForm.notes || undefined, day: activeDay,
    });
    setAddForm({ name: "", muscleGroup: "", sets: "3", targetReps: "8-10", restSeconds: "", notes: "" });
    setShowAddRow(false);
    showToast("Esercizio aggiunto");
  }

  function startEdit(ex: Exercise) {
    setEditId(ex.id);
    setEditForm({ name: ex.name, muscleGroup: ex.muscleGroup ?? "", sets: ex.sets.toString(), targetReps: ex.targetReps, restSeconds: ex.restSeconds ? ex.restSeconds.toString() : "", notes: ex.notes ?? "" });
  }

  function saveEdit() {
    if (!editId || !onUpdateExercise) return;
    onUpdateExercise(editId, { name: editForm.name, muscleGroup: editForm.muscleGroup || undefined, sets: parseInt(editForm.sets) || 3, targetReps: editForm.targetReps, restSeconds: editForm.restSeconds ? parseInt(editForm.restSeconds) : undefined, notes: editForm.notes || undefined });
    setEditId(null);
    showToast("Esercizio aggiornato");
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  // ── MOBILE SINGLE-WEEK VIEW ──────────────────────────────────────────────────
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
          {days.map((d) => (
            <button key={d} onClick={() => { setActiveDay(d); setActiveCell(null); setShowAddRow(false); }}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all"
              style={{
                background: activeDay === d ? "rgba(255,107,43,0.14)" : "rgba(255,255,255,0.04)",
                color: activeDay === d ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
                border: `1px solid ${activeDay === d ? "rgba(255,107,43,0.3)" : "rgba(255,255,255,0.07)"}`,
                fontWeight: activeDay === d ? "600" : "400",
              }}>
              {getDayLabel(d)}
            </button>
          ))}
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
        {mode === "trainer" && !showAddRow && (
          <button onClick={() => setShowAddRow(true)}
            className="flex items-center gap-2 mb-3 w-full px-4 py-2.5 rounded-xl text-sm"
            style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
            <Plus size={14} /> Aggiungi esercizio
          </button>
        )}

        {mode === "trainer" && showAddRow && (
          <div className="mb-4 p-4 rounded-2xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.2)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--accent-light)" }}>NUOVO ESERCIZIO — {getDayLabel(activeDay).toUpperCase()}</p>
            <div className="space-y-2">
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                placeholder="Nome esercizio *" autoFocus
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
              <div className="grid grid-cols-2 gap-2">
                <select value={addForm.muscleGroup} onChange={(e) => setAddForm({ ...addForm, muscleGroup: e.target.value })}
                  className="px-3 py-2 rounded-xl text-xs outline-none" style={selectStyle}>
                  <option value="">Gruppo</option>
                  {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <input value={addForm.targetReps} onChange={(e) => setAddForm({ ...addForm, targetReps: e.target.value })}
                  placeholder="Rep (8-10)" className="px-3 py-2 rounded-xl text-xs outline-none" style={inputStyle} />
                <input type="number" value={addForm.sets} onChange={(e) => setAddForm({ ...addForm, sets: e.target.value })}
                  placeholder="Serie" className="px-3 py-2 rounded-xl text-xs outline-none" style={inputStyle} />
                <select value={addForm.restSeconds} onChange={(e) => setAddForm({ ...addForm, restSeconds: e.target.value })}
                  className="px-3 py-2 rounded-xl text-xs outline-none" style={selectStyle}>
                  <option value="">{planRestSeconds ? `Default (${formatRest(planRestSeconds)})` : "Recupero"}</option>
                  {REST_OPTIONS.map((s) => <option key={s} value={s}>{formatRest(s)}</option>)}
                </select>
                <input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="Note tecniche" className="px-3 py-2 rounded-xl text-xs outline-none col-span-2" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowAddRow(false)} className="flex-1 py-2 rounded-xl text-xs"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
              <button onClick={handleAddExercise} disabled={!addForm.name} className="flex-1 accent-btn py-2 rounded-xl text-xs disabled:opacity-40">
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {/* Exercise cards for current week */}
        {dayExercises.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ border: "1px dashed rgba(255,107,43,0.15)" }}>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
              {mode === "trainer" ? `Nessun esercizio — aggiungine uno` : `Nessun esercizio pianificato`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayExercises.map((ex) => {
              const log = getLog(ex.id, mobileWeek);
              const isActive = activeCell?.exerciseId === ex.id && activeCell?.week === mobileWeek;
              return (
                <div key={ex.id} className="card-luxury rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{ex.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
                        {ex.muscleGroup && `${ex.muscleGroup} · `}{ex.sets} serie × {ex.targetReps}
                        {(ex.restSeconds ?? planRestSeconds) && ` · ⏱ ${formatRest(ex.restSeconds ?? planRestSeconds!)}`}
                      </p>
                    </div>
                    {mode === "trainer" && (
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(ex)} className="p-1.5 rounded-lg hover:bg-white/5">
                          <Pencil size={12} style={{ color: "rgba(245,240,232,0.4)" }} />
                        </button>
                        <button onClick={() => onRemoveExercise?.(ex.id)} className="p-1.5 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={12} style={{ color: "rgba(239,68,68,0.5)" }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline edit for trainer */}
                  {mode === "trainer" && editId === ex.id && (
                    <div className="space-y-2 mb-3 p-3 rounded-xl" style={{ background: "rgba(255,107,43,0.05)" }}>
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} autoFocus />
                      <div className="grid grid-cols-2 gap-1.5">
                        <select value={editForm.muscleGroup} onChange={(e) => setEditForm({ ...editForm, muscleGroup: e.target.value })}
                          className="px-2 py-1 rounded-lg text-xs outline-none" style={selectStyle}>
                          <option value="">Gruppo</option>
                          {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <input value={editForm.targetReps} onChange={(e) => setEditForm({ ...editForm, targetReps: e.target.value })}
                          placeholder="Rep" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                        <input type="number" value={editForm.sets} onChange={(e) => setEditForm({ ...editForm, sets: e.target.value })}
                          placeholder="Serie" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                        <select value={editForm.restSeconds} onChange={(e) => setEditForm({ ...editForm, restSeconds: e.target.value })}
                          className="px-2 py-1 rounded-lg text-xs outline-none" style={selectStyle}>
                          <option value="">{planRestSeconds ? `Default (${formatRest(planRestSeconds)})` : "Recupero"}</option>
                          {REST_OPTIONS.map((s) => <option key={s} value={s}>{formatRest(s)}</option>)}
                        </select>
                        <input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Note" className="px-2 py-1 rounded-lg text-xs outline-none col-span-2" style={inputStyle} />
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditId(null)} className="flex-1 py-1.5 rounded-lg text-xs"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
                        <button onClick={saveEdit} className="flex-1 accent-btn py-1.5 rounded-lg text-xs">Salva</button>
                      </div>
                    </div>
                  )}

                  {/* Log entry */}
                  {isActive ? (
                    <div className="p-3 rounded-xl" style={{ background: "rgba(255,107,43,0.07)" }}>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="number" value={activeCell.weight}
                          onChange={(e) => setActiveCell({ ...activeCell, weight: e.target.value })}
                          placeholder="kg" autoFocus
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                        <input value={activeCell.reps}
                          onChange={(e) => setActiveCell({ ...activeCell, reps: e.target.value })}
                          placeholder="rep (9/8/8)"
                          onKeyDown={(e) => { if (e.key === "Enter") saveCell(); if (e.key === "Escape") setActiveCell(null); }}
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setActiveCell(null)} className="flex-1 py-2 rounded-xl text-sm font-medium"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
                        <button onClick={saveCell} className="flex-1 accent-btn py-2 rounded-xl text-sm font-medium">Salva</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => openCell(ex.id, mobileWeek)}
                      className="w-full py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: log?.weight || log?.reps ? "rgba(255,107,43,0.08)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${log?.weight || log?.reps ? "rgba(255,107,43,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                      {log?.weight || log?.reps ? (
                        <div className="flex items-center justify-center gap-3">
                          {log?.weight && <span className="font-bold" style={{ color: "var(--accent-light)" }}>{log.weight} kg</span>}
                          {log?.reps && <span style={{ color: "rgba(245,240,232,0.6)" }}>{log.reps} rep</span>}
                          <Pencil size={12} style={{ color: "rgba(245,240,232,0.3)" }} />
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2" style={{ color: "rgba(245,240,232,0.3)" }}>
                          <Plus size={14} /> Inserisci
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs mt-3 text-center" style={{ color: "rgba(245,240,232,0.2)" }}>
          Usa le frecce per navigare tra le settimane
        </p>
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
                <button onClick={() => { setActiveDay(d); setShowAddRow(false); setActiveCell(null); }}
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

      {mode === "trainer" && !showAddRow && (
        <button onClick={() => setShowAddRow(true)}
          className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl text-sm transition-all"
          style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
          <Plus size={14} /> Aggiungi esercizio — {getDayLabel(activeDay)}
        </button>
      )}

      {mode === "trainer" && showAddRow && (
        <div className="mb-4 p-4 rounded-2xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.2)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--accent-light)" }}>NUOVO ESERCIZIO — {getDayLabel(activeDay).toUpperCase()}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Nome *</label>
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                placeholder="es. Squat, Panca, Stacco…"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} autoFocus />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Gruppo muscolare</label>
              <select value={addForm.muscleGroup} onChange={(e) => setAddForm({ ...addForm, muscleGroup: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={selectStyle}>
                <option value="">—</option>
                {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Serie</label>
              <input type="number" min="1" max="10" value={addForm.sets} onChange={(e) => setAddForm({ ...addForm, sets: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Rep target</label>
              <input value={addForm.targetReps} onChange={(e) => setAddForm({ ...addForm, targetReps: e.target.value })}
                placeholder="8-10 / AMRAP / 12" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Recupero</label>
              <select value={addForm.restSeconds} onChange={(e) => setAddForm({ ...addForm, restSeconds: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={selectStyle}>
                <option value="">{planRestSeconds ? `Default (${formatRest(planRestSeconds)})` : "— nessuno —"}</option>
                {REST_OPTIONS.map((s) => <option key={s} value={s}>{formatRest(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Note tecniche</label>
              <input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                placeholder="es. busto 30°, pausa in basso" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddRow(false)}
              className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
              Annulla
            </button>
            <button onClick={handleAddExercise} disabled={!addForm.name}
              className="accent-btn flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm disabled:opacity-40">
              <Plus size={13} /> Aggiungi
            </button>
          </div>
        </div>
      )}

      {dayExercises.length === 0 ? (
        <div className="text-center py-14 rounded-2xl" style={{ border: "1px dashed rgba(255,107,43,0.15)" }}>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
            {mode === "trainer" ? `Nessun esercizio per ${getDayLabel(activeDay)}` : `Nessun esercizio pianificato per ${getDayLabel(activeDay)}`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,107,43,0.12)" }}>
          <table className="w-full border-collapse" style={{ minWidth: `${360 + totalWeeks * 120}px` }}>
            <thead>
              <tr style={{ background: "rgba(255,107,43,0.08)" }}>
                {mode === "trainer" && <th className="w-8 p-2" style={{ borderRight: "1px solid rgba(255,107,43,0.1)" }} />}
                <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--accent-light)", minWidth: "200px", borderRight: "2px solid rgba(255,107,43,0.15)", position: "sticky", left: 0, background: "rgba(15,8,4,0.98)", zIndex: 10 }}>
                  Esercizio · {getDayLabel(activeDay)}
                </th>
                {weeks.map((w) => (
                  <th key={w} className="text-center p-3 text-xs font-semibold"
                    style={{ color: "rgba(245,240,232,0.45)", minWidth: "110px", borderRight: "1px solid rgba(255,107,43,0.07)" }}>
                    Sett. {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayExercises.map((ex, idx) => (
                <tr key={ex.id} style={{ borderTop: "1px solid rgba(255,107,43,0.06)" }}
                  className="group hover:bg-white/[0.015] transition-colors">
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
                  <td className="p-3" style={{ borderRight: "2px solid rgba(255,107,43,0.12)", position: "sticky", left: 0, background: "rgba(10,10,10,0.98)", zIndex: 5, minWidth: "200px" }}>
                    {editId === ex.id ? (
                      <div className="space-y-2">
                        <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} autoFocus />
                        <div className="grid grid-cols-2 gap-1.5">
                          <select value={editForm.muscleGroup} onChange={(e) => setEditForm({ ...editForm, muscleGroup: e.target.value })}
                            className="px-2 py-1 rounded-lg text-xs outline-none" style={selectStyle}>
                            <option value="">Gruppo</option>
                            {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <input value={editForm.targetReps} onChange={(e) => setEditForm({ ...editForm, targetReps: e.target.value })}
                            placeholder="Rep" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                          <input type="number" value={editForm.sets} onChange={(e) => setEditForm({ ...editForm, sets: e.target.value })}
                            placeholder="Serie" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                          <select value={editForm.restSeconds} onChange={(e) => setEditForm({ ...editForm, restSeconds: e.target.value })}
                            className="px-2 py-1 rounded-lg text-xs outline-none" style={selectStyle}>
                            <option value="">{planRestSeconds ? `Default (${formatRest(planRestSeconds)})` : "— recupero —"}</option>
                            {REST_OPTIONS.map((s) => <option key={s} value={s}>{formatRest(s)}</option>)}
                          </select>
                          <input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            placeholder="Note" className="px-2 py-1 rounded-lg text-xs outline-none col-span-2" style={inputStyle} />
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => setEditId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
                            Annulla
                          </button>
                          <button onClick={saveEdit} className="accent-btn px-2.5 py-1 rounded-lg text-xs">Salva</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{ex.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                            {ex.muscleGroup && <span>{ex.muscleGroup} · </span>}
                            {ex.sets} serie × {ex.targetReps} rep
                            {(ex.restSeconds ?? planRestSeconds) && (
                              <span className="inline-flex items-center gap-0.5 ml-1.5">
                                <Timer size={9} style={{ display: "inline" }} /> {formatRest(ex.restSeconds ?? planRestSeconds!)}
                              </span>
                            )}
                          </p>
                          {ex.notes && <p className="text-xs mt-0.5 italic" style={{ color: "rgba(245,240,232,0.28)" }}>{ex.notes}</p>}
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
                  {weeks.map((w) => {
                    const log = getLog(ex.id, w);
                    const isActive = activeCell?.exerciseId === ex.id && activeCell?.week === w;
                    const hasData = log?.weight || log?.reps;
                    return (
                      <td key={w} className="p-0" style={{ borderRight: "1px solid rgba(255,107,43,0.05)", verticalAlign: "top" }}>
                        {isActive ? (
                          <div className="p-2" style={{ background: "rgba(255,107,43,0.07)", minWidth: "110px" }}>
                            <input type="number" value={activeCell.weight}
                              onChange={(e) => setActiveCell({ ...activeCell, weight: e.target.value })}
                              placeholder="kg" autoFocus
                              className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1.5"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                            <input value={activeCell.reps}
                              onChange={(e) => setActiveCell({ ...activeCell, reps: e.target.value })}
                              placeholder="rep (9/8/8)"
                              onKeyDown={(e) => { if (e.key === "Enter") saveCell(); if (e.key === "Escape") setActiveCell(null); }}
                              className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1.5"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.3)", color: "var(--ivory)" }} />
                            <div className="flex gap-1">
                              <button onClick={() => setActiveCell(null)} className="flex-1 py-1 rounded text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.5)" }}>✕</button>
                              <button onClick={saveCell} className="flex-1 accent-btn py-1 rounded text-xs">✓</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => openCell(ex.id, w)}
                            className="w-full h-full p-3 text-center transition-colors hover:bg-white/[0.03]"
                            style={{ minHeight: "58px", cursor: "pointer" }}>
                            {hasData ? (
                              <div>
                                {log?.weight && <p className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>{log.weight} kg</p>}
                                {log?.reps && <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.55)" }}>{log.reps}</p>}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: "rgba(245,240,232,0.22)" }}>
        {mode === "trainer"
          ? "Hover sul tab giorno per rinominarlo · Clicca su una cella per inserire peso e reps"
          : "Clicca su una cella per inserire peso e ripetizioni · Invio per salvare"}
      </p>
    </div>
  );
}
