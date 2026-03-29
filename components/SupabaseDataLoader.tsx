"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { PlanTier } from "@/lib/store";

export default function SupabaseDataLoader() {
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      if (clients) {
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
            workoutPlans: [],
            phases: [],
            dietPlans: [],
            measurements: [],
            notes: [],
            createdAt: c.created_at,
          }))
        );
      }
    }

    load();
  }, []);

  return null;
}
