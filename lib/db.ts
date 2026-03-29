import { createClient } from "@/lib/supabase/client";
import type { Client, WorkoutPlan, Phase, DietPlan, BodyMeasurement, Note, ExerciseLog, PlanTier } from "@/lib/store";

const db = () => createClient();

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const dbProfiles = {
  async updatePlan(userId: string, plan: PlanTier) {
    const { error } = await db().from("profiles").update({ plan }).eq("id", userId);
    if (error) throw error;
    // Also update auth metadata so it persists on reload
    await db().auth.updateUser({ data: { plan } });
  },
};

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

// ─── Intake Forms ─────────────────────────────────────────────────────────────
export interface IntakeForm {
  id: string;
  trainer_id: string;
  token: string;
  label: string | null;
  status: "pending" | "submitted";
  response: IntakeResponse | null;
  submitted_at: string | null;
  created_at: string;
}

export interface IntakeResponse {
  // Step 1 — Personal
  fullName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  // Step 2 — Body & Goals
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  bodyFatPercent?: number;
  primaryGoal?: string;
  goalTimeline?: string;
  motivation?: string;
  // Step 3 — Training
  level?: string;
  trainingYears?: string;
  currentTrainingDays?: string;
  injuriesOrLimitations?: string;
  availableDays?: string[];
  sessionDuration?: string;
  trainingLocation?: string[];
  equipment?: string;
  // Step 4 — Diet & Lifestyle
  dietType?: string;
  foodAllergies?: string;
  mealsPerDay?: string;
  alcoholConsumption?: string;
  supplements?: string;
  workType?: string;
  sleepHours?: string;
  stressLevel?: number;
  otherActivities?: string;
  additionalNotes?: string;
}

export const dbIntakeForms = {
  async list(trainerId: string): Promise<IntakeForm[]> {
    const { data, error } = await db()
      .from("intake_forms")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as IntakeForm[];
  },
  async create(trainerId: string, label: string): Promise<IntakeForm> {
    const { data, error } = await db()
      .from("intake_forms")
      .insert({ trainer_id: trainerId, label })
      .select()
      .single();
    if (error) throw error;
    return data as IntakeForm;
  },
  async remove(id: string) {
    const { error } = await db().from("intake_forms").delete().eq("id", id);
    if (error) throw error;
  },
  async getByToken(token: string): Promise<IntakeForm | null> {
    const { data, error } = await db()
      .from("intake_forms")
      .select("*")
      .eq("token", token)
      .single();
    if (error || !data) return null;
    return data as IntakeForm;
  },
  async submit(token: string, response: IntakeResponse) {
    const { error } = await db()
      .from("intake_forms")
      .update({ status: "submitted", response, submitted_at: new Date().toISOString() })
      .eq("token", token)
      .eq("status", "pending");
    if (error) throw error;
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
