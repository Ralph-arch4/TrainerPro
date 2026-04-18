export type PlanTier = "free" | "personal_coach" | "fitness_master";

export const PLAN_LIMITS: Record<PlanTier, { clients: number; label: string; description: string }> = {
  free:            { clients: 999999, label: "TrainerPro", description: "Accesso completo gratuito" },
  personal_coach:  { clients: 999999, label: "TrainerPro", description: "Accesso completo gratuito" },
  fitness_master:  { clients: 999999, label: "TrainerPro", description: "Accesso completo gratuito" },
};

export function checkLimit(_plan: PlanTier, _type: "clients", _current: number): { allowed: boolean; message: string } {
  return { allowed: true, message: "" };
}
