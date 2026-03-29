"use client";
import { useState, useRef, useEffect } from "react";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { Plus, Trash2, GripVertical, CheckCircle2, Copy, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";

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
  mode: "trainer" | "client";
  shareToken?: string;
  onAddExercise?: (data: Omit<Exercise, "id" | "order">) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, data: Partial<Exercise>) => void;
  onMoveExercise?: (exerciseId: string, dir: "up" | "down") => void;
  onUpsertLog: (log: Omit<ExerciseLog, "id" | "loggedAt">) => void;
}

interface CellEdit {
  exerciseId: string;
  week: number;
  weight: string;
  reps: string;
  note: string;
}

export default function WorkoutSpreadsheet({
  planId, planName, exercises, logs, totalWeeks = 12,
  mode, shareToken, onAddExercise, onRemoveExercise, onUpdateExercise,
  onMoveExercise, onUpsertLog,
}: Props) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const [activeCell, setActiveCell] = useState<CellEdit | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", muscleGroup: "", sets: "3", targetReps: "8-10", notes: "" });
  const [copied, setCopied] = useState(false);
  const [editExerciseId, setEditExerciseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", muscleGroup: "", sets: "3", targetReps: "8-10", notes: "" });
  const cellRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeCell && cellRef.current) cellRef.current.focus();
  }, [activeCell]);

  const shareUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/scheda/${shareToken}`
    : null;

  function getLog(exerciseId: string, week: number) {
    return logs.find((l) => l.exerciseId === exerciseId && l.weekNumber === week);
  }

  function openCell(exerciseId: string, week: number) {
    const existing = getLog(exerciseId, week);
    setActiveCell({
      exerciseId, week,
      weight: existing?.weight?.toString() ?? "",
      reps: existing?.reps ?? "",
      note: existing?.note ?? "",
    });
  }

  function saveCell() {
    if (!activeCell) return;
    const { exerciseId, week, weight, reps, note } = activeCell;
    if (!weight && !reps) { setActiveCell(null); return; }
    onUpsertLog({
      exerciseId,
      weekNumber: week,
      weight: weight ? parseFloat(weight) : undefined,
      reps: reps || undefined,
      note: note || undefined,
    });
    setActiveCell(null);
  }

  function handleAddExercise() {
    if (!addForm.name || !onAddExercise) return;
    onAddExercise({
      name: addForm.name,
      muscleGroup: addForm.muscleGroup || undefined,
      sets: parseInt(addForm.sets) || 3,
      targetReps: addForm.targetReps,
      notes: addForm.notes || undefined,
    });
    setAddForm({ name: "", muscleGroup: "", sets: "3", targetReps: "8-10", notes: "" });
    setShowAddRow(false);
  }

  function startEditExercise(ex: Exercise) {
    setEditExerciseId(ex.id);
    setEditForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup ?? "",
      sets: ex.sets.toString(),
      targetReps: ex.targetReps,
      notes: ex.notes ?? "",
    });
  }

  function saveEditExercise() {
    if (!editExerciseId || !onUpdateExercise) return;
    onUpdateExercise(editExerciseId, {
      name: editForm.name,
      muscleGroup: editForm.muscleGroup || undefined,
      sets: parseInt(editForm.sets) || 3,
      targetReps: editForm.targetReps,
      notes: editForm.notes || undefined,
    });
    setEditExerciseId(null);
  }

  function copyShareLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };
  const selectStyle = { background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };

  return (
    <div>
      {/* Header with share link (trainer only) */}
      {mode === "trainer" && shareUrl && (
        <div className="flex items-center gap-3 mb-5 p-3.5 rounded-xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.15)" }}>
          <ExternalLink size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span className="text-xs flex-1 truncate" style={{ color: "rgba(245,240,232,0.5)", fontFamily: "monospace" }}>{shareUrl}</span>
          <button onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,107,43,0.1)",
              color: copied ? "#22c55e" : "var(--accent-light)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(255,107,43,0.2)"}`,
            }}>
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied ? "Copiato!" : "Copia link"}
          </button>
        </div>
      )}

      {/* Add exercise button */}
      {mode === "trainer" && !showAddRow && (
        <button onClick={() => setShowAddRow(true)}
          className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl text-sm transition-all"
          style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
          <Plus size={14} /> Aggiungi esercizio
        </button>
      )}

      {/* Add exercise inline form */}
      {mode === "trainer" && showAddRow && (
        <div className="mb-4 p-4 rounded-2xl" style={{ background: "rgba(255,107,43,0.06)", border: "1px solid rgba(255,107,43,0.2)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--accent-light)" }}>NUOVO ESERCIZIO</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Nome esercizio *</label>
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
                placeholder="es. Squat"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={inputStyle}
                autoFocus
              />
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
              <input type="number" min="1" max="10"
                value={addForm.sets} onChange={(e) => setAddForm({ ...addForm, sets: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Rep target</label>
              <input value={addForm.targetReps} onChange={(e) => setAddForm({ ...addForm, targetReps: e.target.value })}
                placeholder="8-10 / AMRAP / 12"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Note</label>
              <input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                placeholder="es. busto inclinato 30°"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
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

      {exercises.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed rgba(255,107,43,0.2)" }}>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
            {mode === "trainer" ? "Nessun esercizio ancora — clicca \"Aggiungi esercizio\" per iniziare" : "La scheda non ha ancora esercizi"}
          </p>
        </div>
      ) : (
        /* ── SPREADSHEET ── */
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,107,43,0.12)" }}>
          <table className="w-full border-collapse" style={{ minWidth: `${380 + totalWeeks * 130}px` }}>
            <thead>
              <tr style={{ background: "rgba(255,107,43,0.08)" }}>
                {mode === "trainer" && (
                  <th className="w-8 p-2" style={{ borderRight: "1px solid rgba(255,107,43,0.1)" }} />
                )}
                {/* Exercise column header */}
                <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--accent-light)", minWidth: "220px", borderRight: "2px solid rgba(255,107,43,0.15)", position: "sticky", left: 0, background: "rgba(20,10,5,0.97)", zIndex: 10 }}>
                  Esercizio
                </th>
                {weeks.map((w) => (
                  <th key={w} className="text-center p-3 text-xs font-semibold"
                    style={{ color: "rgba(245,240,232,0.5)", minWidth: "120px", borderRight: "1px solid rgba(255,107,43,0.08)" }}>
                    SETT. {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...exercises].sort((a, b) => a.order - b.order).map((ex, idx) => (
                <tr key={ex.id} style={{ borderTop: "1px solid rgba(255,107,43,0.07)" }}
                  className="group hover:bg-white/[0.015] transition-colors">

                  {/* Reorder controls (trainer only) */}
                  {mode === "trainer" && (
                    <td className="w-8 p-1 text-center" style={{ borderRight: "1px solid rgba(255,107,43,0.08)" }}>
                      <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onMoveExercise?.(ex.id, "up")} disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-all">
                          <ChevronUp size={11} style={{ color: "rgba(245,240,232,0.5)" }} />
                        </button>
                        <button onClick={() => onMoveExercise?.(ex.id, "down")} disabled={idx === exercises.length - 1}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition-all">
                          <ChevronDown size={11} style={{ color: "rgba(245,240,232,0.5)" }} />
                        </button>
                      </div>
                    </td>
                  )}

                  {/* Exercise info cell (sticky) */}
                  <td className="p-3" style={{
                    borderRight: "2px solid rgba(255,107,43,0.15)",
                    position: "sticky", left: 0,
                    background: "rgba(10,10,10,0.97)",
                    zIndex: 5,
                    minWidth: "220px",
                  }}>
                    {editExerciseId === ex.id ? (
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
                            placeholder="Rep target" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                          <input type="number" min="1" max="10" value={editForm.sets} onChange={(e) => setEditForm({ ...editForm, sets: e.target.value })}
                            placeholder="Serie" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                          <input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            placeholder="Note" className="px-2 py-1 rounded-lg text-xs outline-none" style={inputStyle} />
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          <button onClick={() => setEditExerciseId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
                            Annulla
                          </button>
                          <button onClick={saveEditExercise}
                            className="accent-btn px-2.5 py-1 rounded-lg text-xs">
                            Salva
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--ivory)" }}>{ex.name}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(245,240,232,0.4)" }}>
                            {ex.muscleGroup && <span>{ex.muscleGroup} · </span>}
                            {ex.sets} serie × {ex.targetReps} rep
                          </p>
                          {ex.notes && <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(245,240,232,0.3)" }}>{ex.notes}</p>}
                        </div>
                        {mode === "trainer" && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => startEditExercise(ex)}
                              className="p-1 rounded hover:bg-white/10 transition-all" title="Modifica">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(245,240,232,0.4)" }}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button onClick={() => onRemoveExercise?.(ex.id)}
                              className="p-1 rounded hover:bg-red-500/10 transition-all" title="Rimuovi">
                              <Trash2 size={11} style={{ color: "rgba(239,68,68,0.5)" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Weekly log cells */}
                  {weeks.map((w) => {
                    const log = getLog(ex.id, w);
                    const isActive = activeCell?.exerciseId === ex.id && activeCell?.week === w;
                    const hasData = log?.weight || log?.reps;

                    return (
                      <td key={w} className="p-0 relative"
                        style={{ borderRight: "1px solid rgba(255,107,43,0.06)", verticalAlign: "top" }}>
                        {isActive ? (
                          <div className="p-2" style={{ background: "rgba(255,107,43,0.06)", minWidth: "120px" }}>
                            <input
                              type="number"
                              value={activeCell.weight}
                              onChange={(e) => setActiveCell({ ...activeCell, weight: e.target.value })}
                              placeholder="kg"
                              className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1.5"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.25)", color: "var(--ivory)" }}
                              autoFocus
                            />
                            <input
                              value={activeCell.reps}
                              onChange={(e) => setActiveCell({ ...activeCell, reps: e.target.value })}
                              placeholder="rep (es. 9/8/8)"
                              className="w-full px-2 py-1 rounded-lg text-xs outline-none mb-1.5"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,107,43,0.25)", color: "var(--ivory)" }}
                              onKeyDown={(e) => { if (e.key === "Enter") saveCell(); if (e.key === "Escape") setActiveCell(null); }}
                            />
                            <div className="flex gap-1">
                              <button onClick={() => setActiveCell(null)}
                                className="flex-1 py-1 rounded text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.5)" }}>
                                ✕
                              </button>
                              <button onClick={saveCell}
                                className="flex-1 accent-btn py-1 rounded text-xs">
                                ✓
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openCell(ex.id, w)}
                            className="w-full h-full p-3 text-center transition-colors hover:bg-white/[0.03]"
                            style={{ minHeight: "60px", cursor: "pointer" }}>
                            {hasData ? (
                              <div>
                                {log?.weight && (
                                  <p className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
                                    {log.weight} kg
                                  </p>
                                )}
                                {log?.reps && (
                                  <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.6)" }}>
                                    {log.reps}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: "rgba(245,240,232,0.15)" }}>—</span>
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

      {/* Legend */}
      <p className="text-xs mt-3" style={{ color: "rgba(245,240,232,0.25)" }}>
        Clicca su una cella per inserire peso e ripetizioni · Premi Invio per salvare
      </p>
    </div>
  );
}
