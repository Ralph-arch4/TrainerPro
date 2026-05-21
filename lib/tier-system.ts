/**
 * Solo Leveling-inspired fitness tier system.
 * Tier is computed deterministically from AI-reported body_fat_est + muscle_mass_est.
 * Never trust Claude to assign the tier — it must be consistent.
 */

export type Tier = "E" | "D" | "C" | "B" | "A" | "S";

export interface TierConfig {
  tier: Tier;
  label: string;          // Italian rank title
  color: string;          // primary colour (text/border)
  glow: string;           // CSS box-shadow glow rgba
  bg: string;             // card background rgba
  badge_bg: string;       // badge background
  rank_up_msg: string;    // message shown on rank-up
  description: string;    // short description for the UI
}

export const TIERS: Record<Tier, TierConfig> = {
  E: {
    tier: "E",
    label: "Principiante",
    color: "#9CA3AF",
    glow: "rgba(156,163,175,0.35)",
    bg: "rgba(156,163,175,0.06)",
    badge_bg: "rgba(156,163,175,0.12)",
    rank_up_msg: "Il viaggio inizia qui. Ogni rep conta.",
    description: "Prima fase del percorso. Il corpo risponde velocemente ai primi stimoli.",
  },
  D: {
    tier: "D",
    label: "In Movimento",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    bg: "rgba(34,197,94,0.06)",
    badge_bg: "rgba(34,197,94,0.12)",
    rank_up_msg: "Rank D raggiunto! Il corpo inizia a cambiare.",
    description: "Progressi visibili. Fondamenta costruite. Il vero lavoro comincia.",
  },
  C: {
    tier: "C",
    label: "Atleta",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.45)",
    bg: "rgba(59,130,246,0.06)",
    badge_bg: "rgba(59,130,246,0.12)",
    rank_up_msg: "Rank C! Sei ufficialmente un atleta.",
    description: "Composizione corporea solida. Disciplina che si vede nei risultati.",
  },
  B: {
    tier: "B",
    label: "Guerriero",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.5)",
    bg: "rgba(139,92,246,0.06)",
    badge_bg: "rgba(139,92,246,0.12)",
    rank_up_msg: "Rank B — Guerriero! Sei tra i migliori.",
    description: "Fisico definito e atletico. Dedizione fuori dal comune.",
  },
  A: {
    tier: "A",
    label: "Élite",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.55)",
    bg: "rgba(245,158,11,0.06)",
    badge_bg: "rgba(245,158,11,0.14)",
    rank_up_msg: "RANK A — ÉLITE! Fisico di livello agonistico.",
    description: "Fisico d'élite. Definizione muscolare netta. Pochi raggiungono questo livello.",
  },
  S: {
    tier: "S",
    label: "Leggenda",
    color: "#E53232",
    glow: "rgba(229,50,50,0.6)",
    bg: "rgba(229,50,50,0.07)",
    badge_bg: "rgba(229,50,50,0.16)",
    rank_up_msg: "RANK S — LEGGENDA! Il massimo del potenziale umano.",
    description: "Condizione fisica eccezionale. Livello da competizione o cinefumetto.",
  },
};

export const TIER_ORDER: Tier[] = ["E", "D", "C", "B", "A", "S"];

/**
 * Compute tier from AI-provided metrics.
 * Primary driver: body fat %. Secondary: muscle mass qualitative estimate.
 */
export function computeTier(
  bodyFat: number | null,
  muscleMass: string | null
): Tier {
  const bf = bodyFat ?? 28;
  const highMuscle = muscleMass?.toLowerCase().includes("alta") || muscleMass?.toLowerCase().includes("high");
  const lowMuscle  = muscleMass?.toLowerCase().includes("bassa") || muscleMass?.toLowerCase().includes("low");

  if (bf < 7 && highMuscle)  return "S";
  if (bf < 9)                return highMuscle ? "S" : "A";
  if (bf < 13)               return highMuscle ? "A" : (lowMuscle ? "B" : "A");
  if (bf < 18)               return highMuscle ? "B" : (lowMuscle ? "C" : "B");
  if (bf < 23)               return highMuscle ? "C" : (lowMuscle ? "D" : "C");
  if (bf < 28)               return "D";
  return "E";
}

/** Returns how many tiers have been gained (positive) or lost (negative). */
export function tierDelta(from: Tier, to: Tier): number {
  return TIER_ORDER.indexOf(to) - TIER_ORDER.indexOf(from);
}
