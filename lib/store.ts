"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

function uid() { return crypto.randomUUID(); }
function genToken() { return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""); }

export type PlanTier = "free" | "personal_coach" | "fitness_master";

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanTier;
}

// ─── Workout Exercise (template set by trainer) ───────────────────────────────
export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  sets: number;
  targetReps: string; // e.g. "8-10", "12", "AMRAP"
  notes?: string;
  order: number;
  day: number; // 1-based day number
}

// ─── Weekly log (filled by client via shared link) ────────────────────────────
export interface ExerciseLog {
  id: string;
  exerciseId: string;
  weekNumber: number; // 1-12
  weight?: number;    // kg
  reps?: string;      // "9" or "9/8/8/8"
  note?: string;
  loggedAt: string;
}

// ─── Phase ────────────────────────────────────────────────────────────────────
export interface Phase {
  id: string;
  clientId: string;
  name: string;
  type: "bulk" | "cut" | "maintenance" | "custom";
  startDate: string;
  endDate: string;
  targetCalories?: number;
  targetWeight?: number;
  completed: boolean;
  notes?: string;
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────
export interface WorkoutPlan {
  id: string;
  clientId: string;
  name: string;
  phaseId?: string;
  description?: string;
  daysPerWeek: number;
  totalWeeks: number;
  exercises: Exercise[];
  logs: ExerciseLog[];
  shareToken: string;
  createdAt: string;
  active: boolean;
  dayLabels?: Record<number, string>; // e.g. { 1: "Pull Day", 2: "Push Day" }
}

// ─── Diet Plan ────────────────────────────────────────────────────────────────
export interface DietPlan {
  id: string;
  clientId: string;
  phaseId?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: string;
  notes?: string;
  createdAt: string;
  active: boolean;
}

// ─── Body Measurement ─────────────────────────────────────────────────────────
export interface BodyMeasurement {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  legs?: number;
  notes?: string;
}

// ─── Note ─────────────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  clientId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  goal?: string;
  level?: "principiante" | "intermedio" | "avanzato";
  status: "attivo" | "inattivo" | "in_pausa";
  monthlyFee?: number;
  startDate: string;
  avatar?: string;
  workoutPlans: WorkoutPlan[];
  phases: Phase[];
  dietPlans: DietPlan[];
  measurements: BodyMeasurement[];
  notes: Note[];
  createdAt: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface AppState {
  user: User | null;
  clients: Client[];
  activeClientId: string | null;

  // User
  setUser: (user: User) => void;
  clearUser: () => void;

  // Clients
  setActiveClient: (id: string | null) => void;
  setAllClients: (clients: Client[]) => void;
  addClient: (data: Omit<Client, "id" | "createdAt" | "workoutPlans" | "phases" | "dietPlans" | "measurements" | "notes">) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  removeClient: (id: string) => void;

  // WorkoutPlans
  addWorkoutPlan: (clientId: string, data: { name: string; description?: string; daysPerWeek: number; totalWeeks: number; phaseId?: string; active: boolean; dayLabels?: Record<number, string> }) => WorkoutPlan;
  updateWorkoutPlan: (clientId: string, planId: string, data: Partial<WorkoutPlan>) => void;
  removeWorkoutPlan: (clientId: string, planId: string) => void;

  // Exercises (within a plan)
  addExercise: (clientId: string, planId: string, data: Omit<Exercise, "id" | "order">) => Exercise;
  updateExercise: (clientId: string, planId: string, exerciseId: string, data: Partial<Exercise>) => void;
  removeExercise: (clientId: string, planId: string, exerciseId: string) => void;
  reorderExercises: (clientId: string, planId: string, exercises: Exercise[]) => void;

  // Exercise logs (client weekly data)
  upsertLog: (clientId: string, planId: string, log: Omit<ExerciseLog, "id" | "loggedAt">) => ExerciseLog;
  removeLog: (clientId: string, planId: string, logId: string) => void;

  // Phases
  addPhase: (clientId: string, data: Omit<Phase, "id" | "clientId">) => Phase;
  updatePhase: (clientId: string, phaseId: string, data: Partial<Phase>) => void;
  removePhase: (clientId: string, phaseId: string) => void;

  // DietPlans
  addDietPlan: (clientId: string, data: Omit<DietPlan, "id" | "clientId" | "createdAt">) => DietPlan;
  updateDietPlan: (clientId: string, planId: string, data: Partial<DietPlan>) => void;
  removeDietPlan: (clientId: string, planId: string) => void;

  // Measurements
  addMeasurement: (clientId: string, data: Omit<BodyMeasurement, "id" | "clientId">) => BodyMeasurement;
  updateMeasurement: (clientId: string, measurementId: string, data: Partial<BodyMeasurement>) => void;
  removeMeasurement: (clientId: string, measurementId: string) => void;

  // Notes
  addNote: (clientId: string, content: string) => Note;
  updateNote: (clientId: string, noteId: string, content: string) => void;
  removeNote: (clientId: string, noteId: string) => void;
}

// ─── Helper to update a plan inside a client ─────────────────────────────────
function mapPlan(clients: Client[], clientId: string, planId: string, fn: (p: WorkoutPlan) => WorkoutPlan): Client[] {
  return clients.map((c) =>
    c.id === clientId
      ? { ...c, workoutPlans: c.workoutPlans.map((p) => p.id === planId ? fn(p) : p) }
      : c
  );
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      clients: [],
      activeClientId: null,

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null, clients: [], activeClientId: null }),

      setActiveClient: (id) => set({ activeClientId: id }),
      setAllClients: (clients) => set({ clients }),

      addClient: (data) => {
        const client: Client = {
          ...data, id: uid(), createdAt: new Date().toISOString(),
          workoutPlans: [], phases: [], dietPlans: [], measurements: [], notes: [],
        };
        set((s) => ({ clients: [...s.clients, client] }));
        return client;
      },
      updateClient: (id, data) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...data } : c) })),
      removeClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id), activeClientId: s.activeClientId === id ? null : s.activeClientId })),

      // ── WorkoutPlans ──────────────────────────────────────────────────────
      addWorkoutPlan: (clientId, data) => {
        const plan: WorkoutPlan = {
          ...data, id: uid(), clientId,
          exercises: [], logs: [],
          totalWeeks: data.totalWeeks ?? 12,
          shareToken: genToken(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, workoutPlans: [...c.workoutPlans, plan] } : c) }));
        return plan;
      },
      updateWorkoutPlan: (clientId, planId, data) =>
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, ...data })) })),
      removeWorkoutPlan: (clientId, planId) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, workoutPlans: c.workoutPlans.filter((p) => p.id !== planId) } : c) })),

      // ── Exercises ─────────────────────────────────────────────────────────
      addExercise: (clientId, planId, data) => {
        const plan = get().clients.find((c) => c.id === clientId)?.workoutPlans.find((p) => p.id === planId);
        const order = (plan?.exercises.length ?? 0);
        const exercise: Exercise = { ...data, id: uid(), order };
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, exercises: [...p.exercises, exercise] })) }));
        return exercise;
      },
      updateExercise: (clientId, planId, exerciseId, data) =>
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, exercises: p.exercises.map((e) => e.id === exerciseId ? { ...e, ...data } : e) })) })),
      removeExercise: (clientId, planId, exerciseId) =>
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, exercises: p.exercises.filter((e) => e.id !== exerciseId) })) })),
      reorderExercises: (clientId, planId, exercises) =>
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, exercises })) })),

      // ── Logs ──────────────────────────────────────────────────────────────
      upsertLog: (clientId, planId, logData) => {
        const plan = get().clients.find((c) => c.id === clientId)?.workoutPlans.find((p) => p.id === planId);
        const existing = plan?.logs.find((l) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber);
        if (existing) {
          const updated = { ...existing, ...logData, loggedAt: new Date().toISOString() };
          set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, logs: p.logs.map((l) => l.id === existing.id ? updated : l) })) }));
          return updated;
        }
        const log: ExerciseLog = { ...logData, id: uid(), loggedAt: new Date().toISOString() };
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, logs: [...p.logs, log] })) }));
        return log;
      },
      removeLog: (clientId, planId, logId) =>
        set((s) => ({ clients: mapPlan(s.clients, clientId, planId, (p) => ({ ...p, logs: p.logs.filter((l) => l.id !== logId) })) })),

      // ── Phases ────────────────────────────────────────────────────────────
      addPhase: (clientId, data) => {
        const phase: Phase = { ...data, id: uid(), clientId };
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, phases: [...c.phases, phase] } : c) }));
        return phase;
      },
      updatePhase: (clientId, phaseId, data) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, phases: c.phases.map((p) => p.id === phaseId ? { ...p, ...data } : p) } : c) })),
      removePhase: (clientId, phaseId) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, phases: c.phases.filter((p) => p.id !== phaseId) } : c) })),

      // ── DietPlans ─────────────────────────────────────────────────────────
      addDietPlan: (clientId, data) => {
        const plan: DietPlan = { ...data, id: uid(), clientId, createdAt: new Date().toISOString() };
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, dietPlans: [...c.dietPlans, plan] } : c) }));
        return plan;
      },
      updateDietPlan: (clientId, planId, data) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, dietPlans: c.dietPlans.map((p) => p.id === planId ? { ...p, ...data } : p) } : c) })),
      removeDietPlan: (clientId, planId) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, dietPlans: c.dietPlans.filter((p) => p.id !== planId) } : c) })),

      // ── Measurements ──────────────────────────────────────────────────────
      addMeasurement: (clientId, data) => {
        const m: BodyMeasurement = { ...data, id: uid(), clientId };
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, measurements: [...c.measurements, m] } : c) }));
        return m;
      },
      updateMeasurement: (clientId, measurementId, data) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, measurements: c.measurements.map((m) => m.id === measurementId ? { ...m, ...data } : m) } : c) })),
      removeMeasurement: (clientId, measurementId) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, measurements: c.measurements.filter((m) => m.id !== measurementId) } : c) })),

      // ── Notes ─────────────────────────────────────────────────────────────
      addNote: (clientId, content) => {
        const note: Note = { id: uid(), clientId, content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, notes: [...c.notes, note] } : c) }));
        return note;
      },
      updateNote: (clientId, noteId, content) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, notes: c.notes.map((n) => n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n) } : c) })),
      removeNote: (clientId, noteId) =>
        set((s) => ({ clients: s.clients.map((c) => c.id === clientId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c) })),
    }),
    { name: "trainerpro-storage" }
  )
);
