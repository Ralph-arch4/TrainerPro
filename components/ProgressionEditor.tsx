"use client";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import {
  normalizeProgressions, describeProgression, MAX_SETS, type ExerciseProgression,
} from "@/lib/progressions";

const fieldStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.22)", color: "var(--ivory)" };
const selectStyle = { background: "rgba(26,26,26,1)", border: "1px solid rgba(201,168,76,0.22)", color: "var(--ivory)" };

function newId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

interface EditorProps {
  value: ExerciseProgression[];
  onChange: (next: ExerciseProgression[]) => void;
  totalWeeks?: number;   // 0 = open-ended plan
  isCardio?: boolean;
  baseSets: number;
}

// Trainer-side editor: "from week N this exercise becomes X sets / Y reps".
export default function ProgressionEditor({ value, onChange, totalWeeks = 12, isCardio, baseSets }: EditorProps) {
  const lastWeek = totalWeeks > 0 ? Math.max(totalWeeks, 2) : 24;
  const weekOptions = Array.from({ length: lastWeek - 1 }, (_, i) => i + 2);

  function update(id: string, patch: Partial<ExerciseProgression>) {
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addStep() {
    const used = new Set(value.map((p) => p.fromWeek));
    const fromWeek = weekOptions.find((w) => !used.has(w) && w >= 3) ?? weekOptions.find((w) => !used.has(w)) ?? lastWeek;
    const prevSets = value.length > 0 ? value[value.length - 1].sets ?? baseSets : baseSets;
    onChange([...value, { id: newId(), fromWeek, sets: isCardio ? undefined : Math.min(prevSets + 1, MAX_SETS) }]);
  }

  return (
    <div className="rounded-xl p-3" data-testid="progression-editor"
      style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.18)" }}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>
          <TrendingUp size={12} /> Progressioni
        </p>
        <button type="button" onClick={addStep} disabled={value.length >= weekOptions.length}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--accent-light)" }}>
          <Plus size={11} /> Aggiungi
        </button>
      </div>
      <p className="text-xs mb-2" style={{ color: "rgba(245,240,232,0.4)" }}>
        Imposta ora i cambi futuri: dalla settimana scelta l&apos;esercizio si aggiorna da solo, anche per il cliente.
      </p>

      {value.length === 0 ? (
        <p className="text-xs italic" style={{ color: "rgba(245,240,232,0.3)" }}>
          Nessuna progressione. Esempio: dalla settimana 3 passa da {baseSets} a {baseSets + 1} serie.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((p) => (
            <div key={p.id} className="rounded-lg p-2" data-testid="progression-step"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs flex-shrink-0" style={{ color: "rgba(245,240,232,0.55)" }}>Dalla settimana</span>
                <select value={p.fromWeek} aria-label="Settimana di inizio"
                  onChange={(e) => update(p.id, { fromWeek: parseInt(e.target.value) })}
                  className="px-2 py-1.5 rounded-lg text-sm outline-none" style={selectStyle}>
                  {weekOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
                <div className="flex-1" />
                <button type="button" onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                  aria-label="Rimuovi progressione" className="p-2 rounded-lg hover:bg-red-500/10">
                  <Trash2 size={13} style={{ color: "rgba(239,68,68,0.6)" }} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>{isCardio ? "Blocchi" : "Serie"}</label>
                  <input type="number" inputMode="numeric" min={1} max={MAX_SETS} value={p.sets ?? ""}
                    aria-label="Serie"
                    onChange={(e) => update(p.id, { sets: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="—" className="w-full px-2 py-2 rounded-lg text-sm outline-none" style={fieldStyle} />
                </div>
                {isCardio ? (
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>Minuti</label>
                    <input value={p.duration ?? ""} aria-label="Minuti"
                      onChange={(e) => update(p.id, { duration: e.target.value || undefined })}
                      placeholder="—" className="w-full px-2 py-2 rounded-lg text-sm outline-none" style={fieldStyle} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>Ripetizioni</label>
                    <input value={p.targetReps ?? ""} aria-label="Ripetizioni"
                      onChange={(e) => update(p.id, { targetReps: e.target.value || undefined })}
                      placeholder="—" className="w-full px-2 py-2 rounded-lg text-sm outline-none" style={fieldStyle} />
                  </div>
                )}
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>Recupero (s)</label>
                  <input value={p.restSeconds ?? ""} aria-label="Recupero"
                    onChange={(e) => update(p.id, { restSeconds: e.target.value || undefined })}
                    placeholder="—" className="w-full px-2 py-2 rounded-lg text-sm outline-none" style={fieldStyle} />
                </div>
              </div>
              <input value={p.notes ?? ""} aria-label="Nota progressione"
                onChange={(e) => update(p.id, { notes: e.target.value || undefined })}
                placeholder="Nota per il cliente (opzionale)"
                className="w-full mt-2 px-2 py-2 rounded-lg text-sm outline-none" style={fieldStyle} />
            </div>
          ))}
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>
            Lascia vuoto ciò che non cambia. Ogni progressione resta valida fino alla successiva.
          </p>
        </div>
      )}
    </div>
  );
}

// Read-only list of the planned steps ("Sett. 3+: 3 serie").
export function ProgressionChips({ progressions, currentWeek }: { progressions?: ExerciseProgression[]; currentWeek?: number }) {
  const steps = normalizeProgressions(progressions);
  if (steps.length === 0) return null;
  const activeId = currentWeek ? steps.filter((p) => p.fromWeek <= currentWeek).pop()?.id : undefined;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5" data-testid="progression-chips">
      {steps.map((p) => {
        const active = p.id === activeId;
        return (
          <span key={p.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full break-words"
            style={{
              background: active ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.07)",
              border: `1px solid ${active ? "rgba(201,168,76,0.45)" : "rgba(201,168,76,0.18)"}`,
              color: active ? "var(--accent-light)" : "rgba(201,168,76,0.75)",
              overflowWrap: "anywhere",
            }}>
            <TrendingUp size={9} className="flex-shrink-0" />
            Sett. {p.fromWeek}+: {describeProgression(p)}
          </span>
        );
      })}
    </div>
  );
}
