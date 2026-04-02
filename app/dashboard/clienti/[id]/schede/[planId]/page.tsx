"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { dbWorkoutPlans, dbExerciseLogs } from "@/lib/db";
import WorkoutSpreadsheet from "@/components/WorkoutSpreadsheet";
import type { Exercise } from "@/lib/store";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default function WorkoutPlanPage() {
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const router = useRouter();
  const client = useAppStore((s) => s.clients.find((c) => c.id === id));
  const plan = client?.workoutPlans.find((p) => p.id === planId);
  const addExercise = useAppStore((s) => s.addExercise);
  const synced = useRef(false);

  // Auto-repair: if this plan has a shareToken in the store but it was never
  // persisted to DB (created before the camelCase fix), write it now.
  useEffect(() => {
    if (!plan?.shareToken || synced.current) return;
    synced.current = true;
    dbWorkoutPlans.update(plan.id, { shareToken: plan.shareToken }).catch(() => {});
  }, [plan?.id, plan?.shareToken]);
  const updateExercise = useAppStore((s) => s.updateExercise);
  const removeExercise = useAppStore((s) => s.removeExercise);
  const reorderExercises = useAppStore((s) => s.reorderExercises);
  const upsertLog = useAppStore((s) => s.upsertLog);
  const updateWorkoutPlan = useAppStore((s) => s.updateWorkoutPlan);

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

  function syncExercisesToDb(planId_: string, exercises: Exercise[]) {
    dbWorkoutPlans.update(planId_, {
      exercises: JSON.stringify(exercises) as unknown as Exercise[],
    } as Parameters<typeof dbWorkoutPlans.update>[1]).catch(() => {});
  }

  function getExercises() {
    return useAppStore.getState().clients
      .find((c) => c.id === id)?.workoutPlans.find((p) => p.id === planId)?.exercises ?? [];
  }

  function handleAddExercise(data: Omit<Exercise, "id" | "order">) {
    addExercise(id, planId, data);
    syncExercisesToDb(planId, getExercises());
  }

  function handleUpdateExercise(exerciseId: string, data: Partial<Exercise>) {
    updateExercise(id, planId, exerciseId, data);
    syncExercisesToDb(planId, getExercises());
  }

  function handleRemoveExercise(exerciseId: string) {
    removeExercise(id, planId, exerciseId);
    syncExercisesToDb(planId, getExercises());
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
    syncExercisesToDb(planId, withOrder);
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

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      {/* Back button */}
      <button
        onClick={() => router.push(`/dashboard/clienti/${id}?tab=schede`)}
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-80 transition-all"
        style={{ color: "rgba(245,240,232,0.5)" }}>
        <ArrowLeft size={15} /> {client.name}
      </button>

      {/* Plan header */}
      <div className="flex items-center justify-between mb-6">
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
      </div>

      {/* The spreadsheet */}
      <WorkoutSpreadsheet
        planId={planId}
        planName={plan.name}
        exercises={plan.exercises}
        logs={plan.logs}
        totalWeeks={plan.totalWeeks}
        daysPerWeek={plan.daysPerWeek}
        mode="trainer"
        shareToken={plan.shareToken}
        onAddExercise={handleAddExercise}
        onUpdateExercise={handleUpdateExercise}
        onRemoveExercise={handleRemoveExercise}
        onMoveExercise={handleMoveExercise}
        onUpsertLog={handleUpsertLog}
      />
    </div>
  );
}
