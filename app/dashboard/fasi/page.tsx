"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { Activity, CheckCircle2, Circle, ChevronRight, Filter } from "lucide-react";

const phaseTypeLabel: Record<string, string> = { bulk: "Bulk", cut: "Cut", maintenance: "Mantenimento", custom: "Personalizzata" };
const phaseTypeColor: Record<string, string> = { bulk: "#a78bfa", cut: "#38bdf8", maintenance: "#34d399", custom: "#fb923c" };

type FilterType = "tutte" | "bulk" | "cut" | "maintenance" | "custom";
type FilterStatus = "tutte" | "attive" | "completate";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function getPhaseDuration(start: string, end?: string) {
  if (!end) return "In corso";
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  if (days < 7) return `${days} giorni`;
  if (days < 30) return `${Math.round(days / 7)} settimane`;
  return `${Math.round(days / 30)} mesi`;
}

function getPhaseProgress(start: string, end?: string) {
  if (!end) return 50; // ongoing — show half-filled progress bar
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return 0;
  if (now > e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

export default function FasiPage() {
  const clients = useAppStore((s) => s.clients);
  const updatePhase = useAppStore((s) => s.updatePhase);
  const [filterType, setFilterType] = useState<FilterType>("tutte");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("tutte");
  const [search, setSearch] = useState("");

  // Flatten all phases with client info
  const allPhases = clients.flatMap((c) =>
    c.phases.map((p) => ({ ...p, clientName: c.name, clientId: c.id }))
  );

  const filtered = allPhases.filter((p) => {
    const matchType = filterType === "tutte" || p.type === filterType;
    const matchStatus = filterStatus === "tutte" ||
      (filterStatus === "completate" ? p.completed : !p.completed);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  // Sort by start date desc
  const sorted = [...filtered].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const active = allPhases.filter((p) => !p.completed).length;
  const completed = allPhases.filter((p) => p.completed).length;
  const bulkCount = allPhases.filter((p) => p.type === "bulk").length;
  const cutCount = allPhases.filter((p) => p.type === "cut").length;

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Fasi & Piani</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
          {allPhases.length} fasi totali su {clients.length} {clients.length === 1 ? "cliente" : "clienti"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Fasi attive",  value: active,    color: "var(--accent)"       },
          { label: "Completate",   value: completed, color: "var(--accent-light)"  },
          { label: "Bulk",         value: bulkCount, color: "#CC5522"              },
          { label: "Cut",          value: cutCount,  color: "rgba(255,107,43,0.65)"},
        ].map(({ label, value, color }) => (
          <div key={label} className="card-luxury rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca fase o cliente…"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}>
          <option value="tutte">Tutti i tipi</option>
          <option value="bulk">Bulk</option>
          <option value="cut">Cut</option>
          <option value="maintenance">Mantenimento</option>
          <option value="custom">Personalizzata</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}>
          <option value="tutte">Tutti gli stati</option>
          <option value="attive">Attive</option>
          <option value="completate">Completate</option>
        </select>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-20 card-luxury rounded-2xl">
          <Activity size={48} className="mx-auto mb-4" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--ivory)" }}>
            {allPhases.length === 0 ? "Nessuna fase pianificata" : "Nessun risultato"}
          </p>
          <p className="text-sm mb-4" style={{ color: "rgba(245,240,232,0.4)" }}>
            {allPhases.length === 0
              ? "Aggiungi fasi ai tuoi clienti dalla loro scheda"
              : "Prova a modificare i filtri"}
          </p>
          {allPhases.length === 0 && (
            <Link href="/dashboard/clienti" className="accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
              Vai ai clienti
            </Link>
          )}
        </div>
      )}

      {/* Phase list */}
      <div className="space-y-3">
        {sorted.map((phase) => {
          const progress = getPhaseProgress(phase.startDate, phase.endDate);
          const duration = getPhaseDuration(phase.startDate, phase.endDate);
          const isOngoing = progress > 0 && progress < 100 && !phase.completed;

          return (
            <div key={phase.id} className="card-luxury rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: phaseTypeColor[phase.type] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" style={{ color: "var(--ivory)" }}>{phase.name}</p>
                      <span className="text-xs px-2.5 py-0.5 rounded-full"
                        style={{ background: `${phaseTypeColor[phase.type]}18`, color: phaseTypeColor[phase.type] }}>
                        {phaseTypeLabel[phase.type]}
                      </span>
                      {isOngoing && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,43,0.12)", color: "var(--accent-light)" }}>In corso</span>
                      )}
                      {phase.completed && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Completata</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
                      {formatDate(phase.startDate)} → {phase.endDate ? formatDate(phase.endDate) : "In corso"} · {duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => updatePhase(phase.clientId, phase.id, { completed: !phase.completed })}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-all">
                    {phase.completed
                      ? <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
                      : <Circle size={16} style={{ color: "rgba(245,240,232,0.35)" }} />}
                  </button>
                  <Link href={`/dashboard/clienti/${phase.clientId}`}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                    style={{ color: "rgba(245,240,232,0.5)" }}>
                    {phase.clientName} <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Progress bar */}
              {!phase.completed && (
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(245,240,232,0.35)" }}>
                    <span>{progress}% completato</span>
                    {phase.targetCalories && <span>{phase.targetCalories} kcal target</span>}
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${phaseTypeColor[phase.type]}, ${phaseTypeColor[phase.type]}aa)`,
                    }} />
                  </div>
                </div>
              )}

              {phase.notes && (
                <p className="text-xs mt-3 pt-3" style={{ color: "rgba(245,240,232,0.45)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {phase.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
