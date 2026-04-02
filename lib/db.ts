import { createClient } from "@/lib/supabase/client";
import type { Client, WorkoutPlan, Phase, DietPlan, BodyMeasurement, Note, ExerciseLog, PlanTier } from "@/lib/store";

const db = () => createClient();

async function uid(): Promise<string> {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

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
      .insert({
        id:          (payload as { id?: string }).id,
        user_id:     payload.userId,
        name:        payload.name,
        email:       payload.email || null,
        phone:       payload.phone || null,
        birth_date:  payload.birthDate || null,
        goal:        payload.goal || null,
        level:       payload.level || null,
        status:      payload.status,
        monthly_fee: payload.monthlyFee || null,
        start_date:  payload.startDate || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<Client>) {
    const mapped: Record<string, unknown> = {};
    if (payload.name        !== undefined) mapped.name        = payload.name;
    if (payload.email       !== undefined) mapped.email       = payload.email;
    if (payload.phone       !== undefined) mapped.phone       = payload.phone;
    if (payload.birthDate   !== undefined) mapped.birth_date  = payload.birthDate;
    if (payload.goal        !== undefined) mapped.goal        = payload.goal;
    if (payload.level       !== undefined) mapped.level       = payload.level;
    if (payload.status      !== undefined) mapped.status      = payload.status;
    if (payload.monthlyFee  !== undefined) mapped.monthly_fee = payload.monthlyFee;
    if (payload.startDate   !== undefined) mapped.start_date  = payload.startDate;
    const { error } = await db().from("clients").update(mapped).eq("id", id);
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
    const userId = await uid();
    const { data, error } = await db()
      .from("workout_plans")
      .insert({
        name:          payload.name,
        description:   payload.description ?? null,
        client_id:     payload.clientId,
        user_id:       userId,
        phase_id:      payload.phaseId ?? null,
        days_per_week: payload.daysPerWeek,
        total_weeks:   payload.totalWeeks,
        exercises:     payload.exercises,
        active:        payload.active,
        share_token:   payload.shareToken,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<WorkoutPlan>) {
    // Map any camelCase keys the caller might pass to their snake_case column names.
    const mapped: Record<string, unknown> = {};
    if (payload.name         !== undefined) mapped.name          = payload.name;
    if (payload.description  !== undefined) mapped.description   = payload.description;
    if (payload.phaseId      !== undefined) mapped.phase_id      = payload.phaseId;
    if (payload.daysPerWeek  !== undefined) mapped.days_per_week = payload.daysPerWeek;
    if (payload.totalWeeks   !== undefined) mapped.total_weeks   = payload.totalWeeks;
    if (payload.exercises    !== undefined) mapped.exercises      = payload.exercises;
    if (payload.active       !== undefined) mapped.active         = payload.active;
    if (payload.shareToken   !== undefined) mapped.share_token   = payload.shareToken;
    const { error } = await db().from("workout_plans").update(mapped).eq("id", id);
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
    const userId = await uid();
    const { data, error } = await db()
      .from("phases")
      .insert({
        user_id:          userId,
        client_id:        payload.clientId,
        name:             payload.name,
        type:             payload.type,
        start_date:       payload.startDate,
        end_date:         payload.endDate || null,
        target_calories:  payload.targetCalories ?? null,
        target_weight:    payload.targetWeight ?? null,
        completed:        payload.completed ?? false,
        notes:            payload.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<Phase>) {
    const mapped: Record<string, unknown> = {};
    if (payload.name             !== undefined) mapped.name             = payload.name;
    if (payload.type             !== undefined) mapped.type             = payload.type;
    if (payload.startDate        !== undefined) mapped.start_date       = payload.startDate;
    if (payload.endDate          !== undefined) mapped.end_date         = payload.endDate;
    if (payload.targetCalories   !== undefined) mapped.target_calories  = payload.targetCalories;
    if (payload.targetWeight     !== undefined) mapped.target_weight    = payload.targetWeight;
    if (payload.completed        !== undefined) mapped.completed        = payload.completed;
    if (payload.notes            !== undefined) mapped.notes            = payload.notes;
    const { error } = await db().from("phases").update(mapped).eq("id", id);
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
    const userId = await uid();
    const { data, error } = await db()
      .from("diet_plans")
      .insert({
        user_id:   userId,
        client_id: payload.clientId,
        phase_id:  payload.phaseId ?? null,
        name:      payload.name,
        calories:  payload.calories,
        protein:   payload.protein,
        carbs:     payload.carbs,
        fat:       payload.fat,
        meals:     payload.meals ?? null,
        notes:     payload.notes ?? null,
        active:    payload.active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<DietPlan>) {
    const mapped: Record<string, unknown> = {};
    if (payload.phaseId  !== undefined) mapped.phase_id = payload.phaseId;
    if (payload.name     !== undefined) mapped.name     = payload.name;
    if (payload.calories !== undefined) mapped.calories = payload.calories;
    if (payload.protein  !== undefined) mapped.protein  = payload.protein;
    if (payload.carbs    !== undefined) mapped.carbs    = payload.carbs;
    if (payload.fat      !== undefined) mapped.fat      = payload.fat;
    if (payload.meals    !== undefined) mapped.meals    = payload.meals;
    if (payload.notes    !== undefined) mapped.notes    = payload.notes;
    if (payload.active   !== undefined) mapped.active   = payload.active;
    const { error } = await db().from("diet_plans").update(mapped).eq("id", id);
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
    const userId = await uid();
    const { data, error } = await db()
      .from("body_measurements")
      .insert({
        user_id:   userId,
        client_id: payload.clientId,
        date:      payload.date,
        weight:    payload.weight,
        body_fat:  payload.bodyFat ?? null,
        chest:     payload.chest ?? null,
        waist:     payload.waist ?? null,
        hips:      payload.hips ?? null,
        arms:      payload.arms ?? null,
        legs:      payload.legs ?? null,
        notes:     payload.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, payload: Partial<BodyMeasurement>) {
    const mapped: Record<string, unknown> = {};
    if (payload.date    !== undefined) mapped.date     = payload.date;
    if (payload.weight  !== undefined) mapped.weight   = payload.weight;
    if (payload.bodyFat !== undefined) mapped.body_fat = payload.bodyFat;
    if (payload.chest   !== undefined) mapped.chest    = payload.chest;
    if (payload.waist   !== undefined) mapped.waist    = payload.waist;
    if (payload.hips    !== undefined) mapped.hips     = payload.hips;
    if (payload.arms    !== undefined) mapped.arms     = payload.arms;
    if (payload.legs    !== undefined) mapped.legs     = payload.legs;
    if (payload.notes   !== undefined) mapped.notes    = payload.notes;
    const { error } = await db().from("body_measurements").update(mapped).eq("id", id);
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
  // ── DATI PERSONALI ──────────────────────────────────────────────────────────
  fullName: string;          // 1. Nome e Cognome
  age?: string;              // 2. Età
  height?: string;           // 3. Altezza
  currentWeight?: string;    // 3. Peso attuale
  // ── OBIETTIVI & MOTIVAZIONE ─────────────────────────────────────────────────
  primaryGoal?: string;      // 4. Obiettivo principale
  secondaryGoals?: string;   // 5. Obiettivi secondari
  motivation?: string;       // 6. Cosa ti spinge ad allenarti
  // ── ESPERIENZA IN PALESTRA ──────────────────────────────────────────────────
  gymExperience?: string;    // 7. Hai esperienza in palestra?
  trainingYears?: string;    // 8. Da quanto tempo ti alleni?
  hasFollowedProgram?: string; // 9. Hai mai seguito una scheda strutturata?
  knownExercises?: string;   // 10. Esercizi che conosci tecnicamente
  musclesFelt?: string;      // 11. Muscoli che senti lavorare
  musclesNotFelt?: string;   // 12. Muscoli che non riesci a sentire
  favoriteExercises?: string; // 13. Esercizi preferiti
  unwantedExercises?: string; // 14. Esercizi che non vuoi fare
  strongExercises?: string;  // 15. Esercizi in cui ti senti forte
  weakExercises?: string;    // 16. Esercizi in cui ti senti debole
  pastSports?: string;       // 17. Sport praticati in passato
  currentSports?: string;    // 18. Sport praticati attualmente
  fitnessAssessment?: string; // 19. Valuta resistenza/forza attuale
  trainingTypePreference?: string[]; // 20. Tipo di allenamento preferito
  // ── DISPONIBILITÀ & LOGISTICA ───────────────────────────────────────────────
  sessionDuration?: string;  // 21. Tempo massimo per singolo allenamento
  trainingDaysPerWeek?: string; // 22. Quante volte a settimana
  canTrainWeekend?: string;  // 23. Puoi allenarti il fine settimana?
  canTrainHome?: string;     // 24. Possibilità di allenarti in casa?
  homeEquipment?: string;    // 25. Attrezzatura in casa
  fixedSchedule?: string;    // 26. Orario fisso o variabile?
  trainingPartner?: string;  // 27. Solo o con qualcuno?
  preferredTrainingTime?: string; // 28. Mattina, pomeriggio o sera?
  // ── SALUTE & INFORTUNI ──────────────────────────────────────────────────────
  jointProblems?: string;    // 29. Problemi articolari o muscolari
  pathologies?: string;      // 30. Patologie
  injuries?: string;         // 31. Infortuni passati
  medications?: string;      // 32. Farmaci
  supplements?: string;      // 33. Integratori
  digestiveIssues?: string;  // 34. Problemi digestivi/intestinali
  // ── STILE DI VITA ───────────────────────────────────────────────────────────
  workDemanding?: string;    // 35. Lavoro impegnativo?
  workDaysPerWeek?: string;  // 36. Quante volte lavori a settimana?
  activityLevel?: string;    // 37. In movimento o sedentario?
  sleepHours?: string;       // 38. Ore di sonno
  sleepQuality?: string;     // 39. Qualità del sonno
  // ── ALIMENTAZIONE ───────────────────────────────────────────────────────────
  eatingOutFrequency?: string; // 40. Quante volte mangi fuori
  cheatFoods?: string;       // 41. Cosa mangi quando "sgarri"
  dietType?: string;         // 42. Vegetariano/vegano/ecc.
  foodAllergies?: string;    // 43. Intolleranze/allergie
  mealsPerDay?: string;      // 44. Quanti pasti al giorno
  mealDistribution?: string; // 45. Come suddividi i pasti
  canPrepMeals?: string;     // 46. Puoi prepararti i pasti?
  waterIntake?: string;      // 47. Acqua al giorno
  alcoholConsumption?: string; // 48. Consumi alcolici?
  typicalDayMeals?: string;  // 49. Cosa mangi in una giornata tipo
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
    const userId = await uid();
    const { data, error } = await db()
      .from("notes")
      .insert({ ...payload, client_id: payload.clientId, user_id: userId })
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
