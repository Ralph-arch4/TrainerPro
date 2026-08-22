"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { dbWorkoutPlans, dbExerciseLogs } from "@/lib/db";
import WorkoutSpreadsheet from "@/components/WorkoutSpreadsheet";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import { showToast } from "@/components/Toast";
import type { Exercise, SupplementItem } from "@/lib/store";
import { ArrowLeft, Dumbbell, LayoutGrid, Table2, MessageSquare, Check, Pencil, TrendingUp, Timer } from "lucide-react";

function estimateSessionMinutes(exercises: Exercise[], planRestSec?: number): number | null {
  if (!exercises.length) return null;
  const byDay = new Map<number, Exercise[]>();
  for (const ex of exercises) {
    if (!byDay.has(ex.day)) byDay.set(ex.day, []);
    byDay.get(ex.day)!.push(ex);
  }
  const defaultRest = planRestSec ?? 90;
  const dayDurations = Array.from(byDay.values()).map(exs => {
    const secs = exs.reduce((tot, ex) => {
      const sets = ex.sets || 3;
      const rest = ex.restSeconds ? parseInt(String(ex.restSeconds)) || defaultRest : defaultRest;
      return tot + sets * 50 + (sets - 1) * rest;
    }, 300);
    return Math.round(secs / 60);
  });
  return Math.round(dayDurations.reduce((a, b) => a + b, 0) / dayDurations.length);
}

type ViewMode = "logbook" | "spreadsheet";

export default function WorkoutPlanPage() {
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const router = useRouter();
  const client = useAppStore((s) => s.clients.find((c) => c.id === id));
  const plan = client?.workoutPlans.find((p) => p.id === planId);
  const addExercise = useAppStore((s) => s.addExercise);
  const updateExercise = useAppStore((s) => s.updateExercise);
  const removeExercise = useAppStore((s) => s.removeExercise);
  const reorderExercises = useAppStore((s) => s.reorderExercises);
  const upsertLog = useAppStore((s) => s.upsertLog);
  const removeLog = useAppStore((s) => s.removeLog);
  const updateWorkoutPlan = useAppStore((s) => s.updateWorkoutPlan);
  const synced = useRef(false);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());
  const [viewMode, setViewMode] = useState<ViewMode>("logbook");
  const [description, setDescription] = useState(() => plan?.description ?? "");
  const [editingDedica, setEditingDedica] = useState(false);
  const [dedicaSaved, setDedicaSaved] = useState(false);

  // Auto-repair: ensure share_token is persisted to DB
  useEffect(() => {
    if (!plan?.shareToken || synced.current) return;
    synced.current = true;
    dbWorkoutPlans.update(plan.id, { shareToken: plan.shareToken }).catch(() => {});
  }, [plan?.id, plan?.shareToken]);

  // Fetch fresh logs from DB so trainer sees what the client logged
  useEffect(() => {
    if (!plan) return;
    dbExerciseLogs.listByPlan(planId).then((rows) => {
      plan.logs.forEach((l) => removeLog(id, planId, l.id));
      rows.forEach((r) => {
        upsertLog(id, planId, {
          exerciseId: r.exercise_id,
          weekNumber: r.week_number,
          weight: r.weight ?? undefined,
          reps: r.reps ?? undefined,
          note: r.note ?? undefined,
        });
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (!client || !plan) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: "var(--text-dim)" }}>Scheda non trovata.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm hover:underline" style={{ color: "var(--accent-light)" }}>
          Torna indietro
        </button>
      </div>
    );
  }

  function syncExercisesToDb(exercises: Exercise[]) {
    // Serialize writes: rapid successive edits (e.g. CSV import adding N rows)
    // each rewrite the whole exercises array — if requests complete out of
    // order, an older/smaller array could win. Chaining guarantees ordering.
    syncQueue.current = syncQueue.current
      .then(() => dbWorkoutPlans.update(planId, { exercises }))
      .catch(() => {
        showToast("Errore nel salvataggio degli esercizi. Ricarica la pagina.", "error");
      });
  }

  function getExercises() {
    return useAppStore.getState().clients
      .find((c) => c.id === id)?.workoutPlans.find((p) => p.id === planId)?.exercises ?? [];
  }

  function handleAddExercise(data: Omit<Exercise, "id" | "order">) {
    addExercise(id, planId, data);
    syncExercisesToDb(getExercises());
  }

  function handleUpdateExercise(exerciseId: string, data: Partial<Exercise>) {
    updateExercise(id, planId, exerciseId, data);
    syncExercisesToDb(getExercises());
  }

  function handleRemoveExercise(exerciseId: string) {
    removeExercise(id, planId, exerciseId);
    syncExercisesToDb(getExercises());
  }

  function handleMoveExercise(exerciseId: string, dir: "up" | "down") {
    if (!plan) return;
    const exercises = [...plan.exercises].sort((a, b) => a.order - b.order);
    const idx = exercises.findIndex((e) => e.id === exerciseId);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === exercises.length - 1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const reordered = [...exercises];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const withOrder = reordered.map((e, i) => ({ ...e, order: i }));
    reorderExercises(id, planId, withOrder);
    syncExercisesToDb(withOrder);
  }

  function handleUpsertLog(logData: Parameters<typeof upsertLog>[2]) {
    upsertLog(id, planId, logData);
    dbExerciseLogs.upsert({
      workout_plan_id: planId,
      exercise_id: logData.exerciseId,
      week_number: logData.weekNumber,
      weight: logData.weight ?? null,
      reps: logData.reps ?? null,
      note: logData.note ?? null,
    }).catch(() => {});
  }

  function handleUpdateDayLabel(day: number, label: string) {
    if (!plan) return;
    const updated: Record<number, string> = { ...((plan.dayLabels as Record<number, string>) ?? {}) };
    if (label) updated[day] = label;
    else delete updated[day];
    updateWorkoutPlan(id, planId, { dayLabels: updated });
    dbWorkoutPlans.update(planId, { dayLabels: updated }).catch(() => {});
  }

  function handleUpdateSupplements(items: SupplementItem[]) {
    updateWorkoutPlan(id, planId, { supplements: items });
    dbWorkoutPlans.update(planId, { supplements: items } as Parameters<typeof dbWorkoutPlans.update>[1]).catch(() => {});
  }

  function handleSaveDedica() {
    if (!plan) return;
    updateWorkoutPlan(id, planId, { description });
    dbWorkoutPlans.update(planId, { description }).catch(() => {});
    setEditingDedica(false);
    setDedicaSaved(true);
    setTimeout(() => setDedicaSaved(false), 2500);
  }

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in">
      {/* Back */}
      <button
        onClick={() => router.push(`/dashboard/clienti/${id}?tab=schede`)}
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-80 transition-all"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={15} /> {client.name}
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl accent-btn flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{plan.name}</h1>
            <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--text-dim)" }}>
              <span>{plan.daysPerWeek} giorni/sett · {plan.totalWeeks ? `${plan.totalWeeks} settimane` : "durata libera"} · {plan.exercises.length} esercizi</span>
              {(() => {
                const mins = estimateSessionMinutes(plan.exercises, plan.restSeconds);
                if (!mins) return null;
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: "rgba(255,107,43,0.1)", color: "var(--accent-light)", border: "1px solid rgba(255,107,43,0.18)", fontSize: "10px" }}>
                    <Timer size={9} />
                    ~{mins} min/sessione
                  </span>
                );
              })()}
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
          {([
            { key: "logbook" as ViewMode,     icon: LayoutGrid, label: "Scheda" },
            { key: "spreadsheet" as ViewMode, icon: Table2,     label: "Avanzato" },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setViewMode(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: viewMode === key ? "rgba(255,107,43,0.14)" : "transparent",
                color: viewMode === key ? "var(--accent-light)" : "var(--text-muted)",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dedica Personale ─────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(201,168,76,0.18)", background: "rgba(201,168,76,0.04)" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: editingDedica ? "1px solid rgba(201,168,76,0.12)" : "none" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <MessageSquare size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(201,168,76,0.65)", letterSpacing: "0.12em" }}>
              Dedica personale
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(201,168,76,0.1)", color: "rgba(201,168,76,0.5)", fontSize: "0.6rem", border: "1px solid rgba(201,168,76,0.15)" }}>
              visibile al cliente
            </span>
          </div>
          <button
            onClick={() => { setEditingDedica(e => !e); setDedicaSaved(false); }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium flex-shrink-0"
            style={{ background: editingDedica ? "var(--surface-md)" : "rgba(201,168,76,0.1)", color: editingDedica ? "var(--text-muted)" : "var(--accent)", border: "1px solid rgba(201,168,76,0.18)" }}>
            {editingDedica ? "Annulla" : description ? <><Pencil size={11} />Modifica</> : "Aggiungi"}
          </button>
        </div>
        {editingDedica ? (
          <div className="p-4">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Scrivi un messaggio personale per il tuo cliente — apparirà nel suo portale…"
              rows={3}
              maxLength={400}
              className="w-full resize-none text-sm rounded-xl px-4 py-3 outline-none"
              style={{ background: "var(--surface-sm)", border: "1px solid rgba(201,168,76,0.22)", color: "var(--text)", fontStyle: "italic", lineHeight: 1.6 }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{description.length}/400</span>
              <button onClick={handleSaveDedica}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 accent-btn">
                <Check size={13} /> Salva dedica
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            {description ? (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                &ldquo;{description}&rdquo;
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Nessuna dedica — aggiungine una per rendere il piano più personale
              </p>
            )}
          </div>
        )}
        {dedicaSaved && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs font-semibold" style={{ color: "#22c55e" }}>
            <Check size={12} /> Dedica salvata — il cliente la vedrà nel suo portale
          </div>
        )}
      </div>

      {/* ── Progressi Piano ─────────────────────────────────────────────────── */}
      {(() => {
        const progress = plan.exercises
          .map(ex => {
            const logs = plan.logs
              .filter(l => l.exerciseId === ex.id && l.weight != null)
              .sort((a, b) => a.weekNumber - b.weekNumber);
            if (logs.length < 2) return null;
            const first = logs[0];
            const last = logs[logs.length - 1];
            const delta = Math.round((last.weight! - first.weight!) * 10) / 10;
            const last3 = logs.slice(-3);
            const plateau = last3.length >= 3 && last3.every(l => l.weight === last3[last3.length - 1].weight);
            return { ex, firstW: first.weight!, lastW: last.weight!, delta, plateau };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        if (!progress.length) return null;
        const growing = progress.filter(p => p.delta > 0 && !p.plateau).length;
        const plateaued = progress.filter(p => p.plateau).length;
        return (
          <div className="mb-5 rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.018)" }}>
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <TrendingUp size={13} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Progressi Piano
              </span>
              <span className="ml-auto text-xs" style={{ color: "var(--text-dim)" }}>
                {growing > 0 && <span style={{ color: "#22c55e" }}>{growing} in crescita</span>}
                {growing > 0 && plateaued > 0 && <span style={{ color: "var(--text-dim)" }}> · </span>}
                {plateaued > 0 && <span style={{ color: "#fb923c" }}>{plateaued} plateau</span>}
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                {progress.map(({ ex, firstW, lastW, delta, plateau }, i) => (
                  <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: i < progress.length - 1 ? "1px solid rgba(255,255,255,0.035)" : "none" }}>
                    <span className="text-xs flex-1 truncate" style={{ color: "var(--text)", minWidth: 0 }}>{ex.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                      {firstW}kg → {lastW}kg
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: plateau ? "rgba(251,146,60,0.12)" : delta > 0 ? "rgba(34,197,94,0.1)" : delta < 0 ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)",
                        color: plateau ? "#fb923c" : delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "#6b7280",
                      }}>
                      {plateau ? "Plateau" : delta > 0 ? `+${delta}kg` : delta === 0 ? "Stabile" : `${delta}kg`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Suggerimento Carico Prossima Sessione ─── */}
      {(() => {
        const suggestions = plan.exercises
          .map(ex => {
            const logs = plan.logs
              .filter(l => l.exerciseId === ex.id && l.weight != null && (l.weight as number) > 0)
              .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
              .slice(0, 3);
            if (logs.length < 3) return null;
            if (!logs.every(l => l.weight === logs[0].weight)) return null;
            const currentW = logs[0].weight as number;
            const step = currentW >= 80 ? 5 : 2.5;
            return { ex, currentW, suggestedW: Math.round((currentW + step) * 10) / 10, step };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        if (!suggestions.length) return null;
        return (
          <div className="mb-5 rounded-2xl overflow-hidden fade-in"
            style={{ border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.03)" }}>
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
              <TrendingUp size={13} style={{ color: "#22c55e" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#22c55e" }}>
                Suggerimento Carico
              </span>
              <span className="ml-1 text-xs" style={{ color: "rgba(34,197,94,0.55)" }}>
                — prossima sessione
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                {suggestions.length} {suggestions.length === 1 ? "esercizio" : "esercizi"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[300px]">
                {suggestions.map(({ ex, currentW, suggestedW, step }, i) => (
                  <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: i < suggestions.length - 1 ? "1px solid rgba(34,197,94,0.06)" : "none" }}>
                    <span className="text-xs flex-1 truncate" style={{ color: "var(--text)" }}>{ex.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-dim)" }}>{currentW}kg</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-dim)" }}>→</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                      {suggestedW}kg <span style={{ opacity: 0.6, fontSize: "9px" }}>+{step}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(34,197,94,0.06)" }}>
              <p className="text-xs" style={{ color: "rgba(34,197,94,0.5)" }}>
                3 sessioni consecutive allo stesso carico — il momento ideale per progredire
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Logbook view (Google Sheets style) ── */}
      {viewMode === "logbook" && (
        <WorkoutLogbook
          planId={planId}
          exercises={plan.exercises}
          logs={plan.logs}
          totalWeeks={plan.totalWeeks}
          daysPerWeek={plan.daysPerWeek}
          mode="trainer"
          dayLabels={plan.dayLabels}
          supplements={plan.supplements ?? []}
          onUpdateExercise={handleUpdateExercise}
          onRemoveExercise={handleRemoveExercise}
          onUpdateSupplements={handleUpdateSupplements}
          onUpsertLog={handleUpsertLog}
        />
      )}

      {/* ── Advanced spreadsheet view (full exercise management + add/edit) ── */}
      {viewMode === "spreadsheet" && (
        <WorkoutSpreadsheet
          planId={planId}
          planName={plan.name}
          exercises={plan.exercises}
          logs={plan.logs}
          totalWeeks={plan.totalWeeks}
          daysPerWeek={plan.daysPerWeek}
          mode="trainer"
          shareToken={plan.shareToken}
          dayLabels={plan.dayLabels}
          onUpdateDayLabel={handleUpdateDayLabel}
          onAddExercise={handleAddExercise}
          onUpdateExercise={handleUpdateExercise}
          onRemoveExercise={handleRemoveExercise}
          onMoveExercise={handleMoveExercise}
          onUpsertLog={handleUpsertLog}
        />
      )}
    </div>
  );
}
