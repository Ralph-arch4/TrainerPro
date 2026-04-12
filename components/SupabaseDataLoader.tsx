"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { PlanTier, Exercise, SupplementItem } from "@/lib/store";

function parseJsonb<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

export default function SupabaseDataLoader() {
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      useAppStore.setState({ dataLoaded: false });

      useAppStore.setState({
        user: {
          id: user.id,
          name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Trainer",
          email: user.email ?? "",
          plan: (user.user_metadata?.plan as PlanTier) ?? "free",
        },
      });

      const { data: clients } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!clients || clients.length === 0) {
        useAppStore.getState().setAllClients([]);
        useAppStore.setState({ dataLoaded: true });
        return;
      }

      const clientIds = clients.map((c) => c.id);

      const [
        { data: workoutPlans },
        { data: phases },
        { data: dietPlans },
        { data: measurements },
        { data: notes },
      ] = await Promise.all([
        supabase.from("workout_plans").select("*").in("client_id", clientIds).order("created_at", { ascending: false }),
        supabase.from("phases").select("*").in("client_id", clientIds).order("start_date", { ascending: true }),
        supabase.from("diet_plans").select("*").in("client_id", clientIds).order("created_at", { ascending: false }),
        supabase.from("body_measurements").select("*").in("client_id", clientIds).order("date", { ascending: false }),
        supabase.from("notes").select("*").in("client_id", clientIds).order("created_at", { ascending: false }),
      ]);

      // Fetch exercise logs for all workout plans
      const planIds = (workoutPlans ?? []).map((p) => p.id);
      const { data: exerciseLogs } = planIds.length > 0
        ? await supabase.from("exercise_logs").select("*").in("workout_plan_id", planIds)
        : { data: [] };

      useAppStore.getState().setAllClients(
        clients.map((c) => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          email: c.email ?? "",
          phone: c.phone,
          birthDate: c.birth_date,
          goal: c.goal,
          level: c.level,
          status: c.status ?? "attivo",
          monthlyFee: c.monthly_fee,
          startDate: c.start_date ?? c.created_at,
          avatar: c.avatar,
          createdAt: c.created_at,
          workoutPlans: (workoutPlans ?? [])
            .filter((p) => p.client_id === c.id)
            .map((p) => ({
              id: p.id,
              clientId: p.client_id,
              name: p.name,
              description: p.description ?? undefined,
              phaseId: p.phase_id ?? undefined,
              daysPerWeek: p.days_per_week,
              totalWeeks: p.total_weeks,
              exercises: parseJsonb<Exercise[]>(p.exercises, []),
              logs: (exerciseLogs ?? [])
                .filter((l) => l.workout_plan_id === p.id)
                .map((l) => ({
                  id: l.id,
                  exerciseId: l.exercise_id,
                  weekNumber: l.week_number,
                  weight: l.weight ?? undefined,
                  reps: l.reps ?? undefined,
                  note: l.note ?? undefined,
                  loggedAt: l.logged_at,
                })),
              shareToken: p.share_token,
              createdAt: p.created_at,
              active: p.active,
              dayLabels: parseJsonb<Record<number, string>>(p.day_labels, {}),
              restSeconds: p.rest_seconds ?? undefined,
              supplements: parseJsonb<SupplementItem[]>(p.supplements, []),
            })),
          phases: (phases ?? [])
            .filter((p) => p.client_id === c.id)
            .map((p) => ({
              id: p.id,
              clientId: p.client_id,
              name: p.name,
              type: p.type,
              startDate: p.start_date,
              endDate: p.end_date,
              targetCalories: p.target_calories ?? undefined,
              targetWeight: p.target_weight ?? undefined,
              completed: p.completed,
              notes: p.notes ?? undefined,
            })),
          dietPlans: (dietPlans ?? [])
            .filter((dp) => dp.client_id === c.id)
            .map((dp) => {
              // Primary: use dedicated *_max columns (migration 007).
              // Fallback: check the old meals-JSON hack for legacy records.
              let proteinMax: number | undefined = dp.protein_max ?? undefined;
              let carbsMax: number | undefined = dp.carbs_max ?? undefined;
              let fatMax: number | undefined = dp.fat_max ?? undefined;
              let mealsRaw = dp.meals ?? "[]";
              // If no dedicated columns, try to migrate from legacy JSON hack
              if (!proteinMax && !carbsMax && !fatMax) {
                try {
                  const parsed = JSON.parse(dp.meals ?? "[]");
                  if (parsed && !Array.isArray(parsed) && (parsed.proteinMax || parsed.carbsMax || parsed.fatMax)) {
                    proteinMax = parsed.proteinMax ?? undefined;
                    carbsMax = parsed.carbsMax ?? undefined;
                    fatMax = parsed.fatMax ?? undefined;
                    mealsRaw = "[]";
                  }
                } catch { /* keep defaults */ }
              }
              return {
                id: dp.id,
                clientId: dp.client_id,
                phaseId: dp.phase_id ?? undefined,
                name: dp.name,
                calories: dp.calories,
                caloriesMax: dp.calories_max ?? undefined,
                protein: dp.protein,
                proteinMax,
                carbs: dp.carbs,
                carbsMax,
                fat: dp.fat,
                fatMax,
                meals: mealsRaw,
                notes: dp.notes ?? undefined,
                createdAt: dp.created_at,
                active: dp.active,
              };
            }),
          measurements: (measurements ?? [])
            .filter((m) => m.client_id === c.id)
            .map((m) => ({
              id: m.id,
              clientId: m.client_id,
              date: m.date,
              weight: m.weight,
              bodyFat: m.body_fat ?? undefined,
              chest: m.chest ?? undefined,
              waist: m.waist ?? undefined,
              hips: m.hips ?? undefined,
              arms: m.arms ?? undefined,
              legs: m.legs ?? undefined,
              notes: m.notes ?? undefined,
            })),
          notes: (notes ?? [])
            .filter((n) => n.client_id === c.id)
            .map((n) => ({
              id: n.id,
              clientId: n.client_id,
              content: n.content,
              createdAt: n.created_at,
              updatedAt: n.updated_at,
            })),
        }))
      );
      useAppStore.setState({ dataLoaded: true });
    }

    load();
  }, []);

  return null;
}
