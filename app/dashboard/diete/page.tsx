"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { UtensilsCrossed, ChevronRight, Search } from "lucide-react";

type GoalFilter = "tutti" | "dimagrimento" | "massa" | "tonificazione" | "performance";

const goalLabel: Record<string, string> = { dimagrimento: "Dimagrimento", massa: "Massa", tonificazione: "Tonificazione", performance: "Performance" };
const goalColor: Record<string, string> = { dimagrimento: "#38bdf8", massa: "#a78bfa", tonificazione: "#34d399", performance: "#fb923c" };

export default function DietePage() {
  const clients = useAppStore((s) => s.clients);
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("tutti");

  // Flatten all diet plans
  const allDiets = clients.flatMap((c) =>
    c.dietPlans.map((d) => ({ ...d, clientName: c.name, clientId: c.id, clientGoal: c.goal }))
  );

  const filtered = allDiets.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase());
    const matchGoal = goalFilter === "tutti" || d.clientGoal === goalFilter;
    return matchSearch && matchGoal;
  });

  const totalCalories = allDiets.reduce((acc, d) => acc + d.calories, 0);
  const avgCalories = allDiets.length ? Math.round(totalCalories / allDiets.length) : 0;
  const activeDiets = allDiets.filter((d) => d.active).length;

  // Macro averages
  const avgProtein = allDiets.length ? Math.round(allDiets.reduce((a, d) => a + d.protein, 0) / allDiets.length) : 0;
  const avgCarbs = allDiets.length ? Math.round(allDiets.reduce((a, d) => a + d.carbs, 0) / allDiets.length) : 0;
  const avgFat = allDiets.length ? Math.round(allDiets.reduce((a, d) => a + d.fat, 0) / allDiets.length) : 0;

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Piani Alimentari</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
          {allDiets.length} piani su {clients.length} {clients.length === 1 ? "cliente" : "clienti"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Piani attivi",     value: activeDiets,                           color: "var(--accent)"       },
          { label: "Media kcal",       value: avgCalories ? `${avgCalories}` : "0", color: "var(--accent-light)"  },
          { label: "Media proteine",   value: avgProtein  ? `${avgProtein}g`  : "0",color: "#CC5522"              },
          { label: "Media carboidrati",value: avgCarbs    ? `${avgCarbs}g`    : "0",color: "rgba(255,107,43,0.65)"},
        ].map(({ label, value, color }) => (
          <div key={label} className="card-luxury rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(245,240,232,0.35)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca piano o cliente…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }} />
        </div>
        <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value as GoalFilter)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}>
          <option value="tutti">Tutti gli obiettivi</option>
          <option value="massa">Massa</option>
          <option value="dimagrimento">Dimagrimento</option>
          <option value="tonificazione">Tonificazione</option>
          <option value="performance">Performance</option>
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 card-luxury rounded-2xl">
          <UtensilsCrossed size={48} className="mx-auto mb-4" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--ivory)" }}>
            {allDiets.length === 0 ? "Nessun piano alimentare" : "Nessun risultato"}
          </p>
          <p className="text-sm mb-4" style={{ color: "rgba(245,240,232,0.4)" }}>
            {allDiets.length === 0
              ? "Crea piani alimentari dalla scheda di ogni cliente"
              : "Prova a modificare i filtri"}
          </p>
          {allDiets.length === 0 && (
            <Link href="/dashboard/clienti" className="accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
              Vai ai clienti
            </Link>
          )}
        </div>
      )}

      {/* Diet cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((diet) => {
          const totalMacros = diet.protein + diet.carbs + diet.fat;
          const proteinPct = totalMacros ? Math.round((diet.protein / totalMacros) * 100) : 0;
          const carbsPct = totalMacros ? Math.round((diet.carbs / totalMacros) * 100) : 0;
          const fatPct = totalMacros ? 100 - proteinPct - carbsPct : 0;

          return (
            <Link key={diet.id} href={`/dashboard/clienti/${diet.clientId}`}
              className="card-luxury rounded-2xl p-5 hover:border-[rgba(255,107,43,0.3)] transition-all group block">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: "var(--ivory)" }}>{diet.name}</p>
                    {diet.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Attivo</span>}
                  </div>
                  <Link href={`/dashboard/clienti/${diet.clientId}`} className="flex items-center gap-1 text-xs mt-1 hover:underline"
                    style={{ color: "rgba(245,240,232,0.45)" }} onClick={(e) => e.stopPropagation()}>
                    {diet.clientName}
                    {diet.clientGoal && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: `${goalColor[diet.clientGoal]}18`, color: goalColor[diet.clientGoal] }}>
                        {goalLabel[diet.clientGoal]}
                      </span>
                    )}
                  </Link>
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all mt-1" style={{ color: "var(--accent-light)" }} />
              </div>

              {/* Calorie highlight */}
              <div className="text-center py-3 mb-4 rounded-xl" style={{ background: "rgba(255,107,43,0.06)" }}>
                <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{diet.calories}</p>
                <p className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>kcal / giorno</p>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Prot.", value: `${diet.protein}g`, pct: proteinPct, color: "#a78bfa" },
                  { label: "Carb.", value: `${diet.carbs}g`, pct: carbsPct, color: "#38bdf8" },
                  { label: "Grass.", value: `${diet.fat}g`, pct: fatPct, color: "#fbbf24" },
                ].map(({ label, value, pct, color }) => (
                  <div key={label} className="text-center rounded-xl p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-xs font-semibold" style={{ color }}>{value}</p>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>{label} {pct}%</p>
                  </div>
                ))}
              </div>

              {/* Macro bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${proteinPct}%`, background: "#a78bfa" }} />
                <div style={{ width: `${carbsPct}%`, background: "#38bdf8" }} />
                <div style={{ width: `${fatPct}%`, background: "#fbbf24" }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
