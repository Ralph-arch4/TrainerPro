"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { dbWorkoutPlans, dbExerciseLogs } from "@/lib/db";
import WorkoutSpreadsheet from "@/components/WorkoutSpreadsheet";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import type { Exercise, SupplementItem } from "@/lib/store";
import { ArrowLeft, Dumbbell, LayoutGrid, Table2 } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<ViewMode>("logbook");

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
        <p style={{ color: "rgba(245,240,232,0.4)" }}>Scheda non trovata.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm hover:underline" style={{ color: "var(--accent-light)" }}>
          Torna indietro
        </button>
      </div>
    );
  }

  function syncExercisesToDb(exercises: Exercise[]) {
    dbWorkoutPlans.update(planId, {
      exercises: JSON.stringify(exercises) as unknown as Exercise[],
    } as Parameters<typeof dbWorkoutPlans.update>[1]).catch(() => {});
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

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      {/* Back */}
      <button
        onClick={() => router.push(`/dashboard/clienti/${id}?tab=schede`)}
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-80 transition-all"
        style={{ color: "rgba(245,240,232,0.5)" }}>
        <ArrowLeft size={15} /> {client.name}
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl accent-btn flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--ivory)" }}>{plan.name}</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
              {plan.daysPerWeek} giorni/sett · {plan.totalWeeks} settimane · {plan.exercises.length} esercizi
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {([
            { key: "logbook" as ViewMode,     icon: LayoutGrid, label: "Scheda" },
            { key: "spreadsheet" as ViewMode, icon: Table2,     label: "Avanzato" },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setViewMode(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: viewMode === key ? "rgba(255,107,43,0.14)" : "transparent",
                color: viewMode === key ? "var(--accent-light)" : "rgba(245,240,232,0.45)",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

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
