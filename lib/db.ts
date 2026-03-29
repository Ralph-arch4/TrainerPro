import { createClient } from "@/lib/supabase/client";
import type { Client, WorkoutPlan, Phase, DietPlan, BodyMeasurement, Note, ExerciseLog } from "@/lib/store";

const db = () => createClient();

// ─── Clients ──────────────────────────────────────────────────────────────────
export const dbClients = {
  async list(userId: string) {
    const { data, error } = await db()
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(payload: Omit<Client, "id" | "createdAt" | "workoutPlans" | "phases" | "dietPlans" | "measurements" | "notes">) {
    const { data, error } = await db()
      .from("clients")
      .insert({ ...payload, user_id: payload.userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<Client>) {
    const { error } = await db().from("clients").update(payload).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db().from("clients").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── Workout Plans ────────────────────────────────────────────────────────────
export const dbWorkoutPlans = {
  async list(clientId: string) {
    const { data, error } = await db()
      .from("workout_plans")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(payload: Omit<WorkoutPlan, "id" | "createdAt">) {
    const { data, error } = await db()
      .from("workout_plans")
      .insert({ ...payload, client_id: payload.clientId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<WorkoutPlan>) {
    const { error } = await db().from("workout_plans").update(payload).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db().from("workout_plans").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── Phases ───────────────────────────────────────────────────────────────────
export const dbPhases = {
  async list(clientId: string) {
    const { data, error } = await db()
      .from("phases")
      .select("*")
      .eq("client_id", clientId)
      .order("start_date", { ascending: true });
    if (error) throw error;
    return data;
  },
  async create(payload: Omit<Phase, "id">) {
    const { data, error } = await db()
      .from("phases")
      .insert({ ...payload, client_id: payload.clientId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<Phase>) {
    const { error } = await db().from("phases").update(payload).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db().from("phases").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── Diet Plans ───────────────────────────────────────────────────────────────
export const dbDietPlans = {
  async list(clientId: string) {
    const { data, error } = await db()
      .from("diet_plans")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(payload: Omit<DietPlan, "id" | "createdAt">) {
    const { data, error } = await db()
      .from("diet_plans")
      .insert({ ...payload, client_id: payload.clientId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<DietPlan>) {
    const { error } = await db().from("diet_plans").update(payload).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db().from("diet_plans").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── Body Measurements ────────────────────────────────────────────────────────
export const dbMeasurements = {
  async list(clientId: string) {
    const { data, error } = await db()
      .from("body_measurements")
      .select("*")
      .eq("client_id", clientId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(payload: Omit<BodyMeasurement, "id">) {
    const { data, error } = await db()
      .from("body_measurements")
      .insert({ ...payload, client_id: payload.clientId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<BodyMeasurement>) {
    const { error } = await db().from("body_measurements").update(payload).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db().from("body_measurements").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── Exercise Logs ────────────────────────────────────────────────────────────
export const dbExerciseLogs = {
  async listByPlan(workoutPlanId: string) {
    const { data, error } = await db()
      .from("exercise_logs")
      .select("*")
      .eq("workout_plan_id", workoutPlanId);
    if (error) throw error;
    return data as Array<{
      id: string; workout_plan_id: string; exercise_id: string;
      week_number: number; weight: number | null; reps: string | null;
      note: string | null; logged_at: string;
    }>;
  },
  async upsert(payload: { workout_plan_id: string; exercise_id: string; week_number: number; weight?: number | null; reps?: string | null; note?: string | null }) {
    const { data, error } = await db()
      .from("exercise_logs")
      .upsert({ ...payload, logged_at: new Date().toISOString() }, {
        onConflict: "workout_plan_id,exercise_id,week_number",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id: string) {
    const { error } = await db().from("exercise_logs").delete().eq("id", id);
    if (error) throw error;
  },
  // Public access via share token (no auth)
  async listByShareToken(shareToken: string) {
    const { data: plan, error: planErr } = await db()
      .from("workout_plans")
      .select("id, name, description, days_per_week, total_weeks, exercises, share_token")
      .eq("share_token", shareToken)
      .single();
    if (planErr || !plan) return null;
    const { data: logs } = await db()
      .from("exercise_logs")
      .select("*")
      .eq("workout_plan_id", plan.id);
    return { plan, logs: logs ?? [] };
  },
};

// ─── Notes ────────────────────────────────────────────────────────────────────
export const dbNotes = {
  async list(clientId: string) {
    const { data, error } = await db()
      .from("notes")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(payload: Omit<Note, "id">) {
    const { data, error } = await db()
      .from("notes")
      .insert({ ...payload, client_id: payload.clientId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<Note>) {
    const { error } = await db().from("notes").update(payload).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db().from("notes").delete().eq("id", id);
    if (error) throw error;
  },
};
