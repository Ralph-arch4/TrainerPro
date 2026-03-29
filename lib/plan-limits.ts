export type PlanTier = "free" | "personal_coach" | "fitness_master";

export const PLAN_LIMITS: Record<PlanTier, {
  clients: number;
  label: string;
  description: string;
}> = {
  free: {
    clients: 1,
    label: "Free",
    description: "Inizia gratuitamente con 1 cliente",
  },
  personal_coach: {
    clients: 15,
    label: "Personal Coach",
    description: "Gestisci fino a 15 clienti — €29/mese",
  },
  fitness_master: {
    clients: 999999,
    label: "Fitness Master Customized",
    description: "Clienti illimitati, personalizzato sul tuo business",
  },
};

export function checkLimit(
  plan: PlanTier,
  type: "clients",
  current: number
): { allowed: boolean; message: string } {
  const limit = PLAN_LIMITS[plan][type];
  if (current < limit) return { allowed: true, message: "" };

  const messages: Record<string, string> = {
    clients: `Hai raggiunto il limite di ${limit} client${limit === 1 ? "e" : "i"} per il piano ${PLAN_LIMITS[plan].label}. Esegui l'upgrade per aggiungere altri clienti.`,
  };

  return { allowed: false, message: messages[type] ?? "Limite raggiunto. Esegui l'upgrade per continuare." };
}
