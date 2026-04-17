"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Search } from "lucide-react";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function SparkLine({ data, positive }: { data: number[]; positive?: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 72, H = 24;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(" ");
  const color = positive ? "#22c55e" : "#f87171";
  const endX = W;
  const endY = H - ((data[data.length - 1] - min) / range) * H;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
      <circle cx={endX} cy={endY} r="2.5" fill={color} />
    </svg>
  );
}

function WeightTrend({ current, prev }: { current: number; prev?: number }) {
  if (!prev) return <span style={{ color: "rgba(245,240,232,0.4)" }}><Minus size={13} /></span>;
  const diff = current - prev;
  if (Math.abs(diff) < 0.1) return <span style={{ color: "rgba(245,240,232,0.4)" }}><Minus size={13} /></span>;
  return diff < 0
    ? <span className="flex items-center gap-0.5 text-xs" style={{ color: "#22c55e" }}><TrendingDown size={13} />{Math.abs(diff).toFixed(1)}</span>
    : <span className="flex items-center gap-0.5 text-xs" style={{ color: "#f87171" }}><TrendingUp size={13} />+{diff.toFixed(1)}</span>;
}

export default function MisurazioniPage() {
  const clients = useAppStore((s) => s.clients);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recenti" | "peso_asc" | "peso_desc">("recenti");

  // Build per-client summary
  const clientSummaries = clients
    .filter((c) => c.measurements.length > 0)
    .map((c) => {
      const sorted = [...c.measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = sorted[0];
      const prev = sorted[1];
      const first = sorted[sorted.length - 1];
      const totalChange = first ? latest.weight - first.weight : 0;
      return { client: c, latest, prev, totalChange, count: c.measurements.length };
    })
    .map((s) => {
      const weightHistory = s.client.measurements
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-8)
        .map((m) => m.weight);
      return { ...s, weightHistory };
    })
    .filter((s) => s.client.name.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...clientSummaries].sort((a, b) => {
    if (sortBy === "peso_asc") return a.latest.weight - b.latest.weight;
    if (sortBy === "peso_desc") return b.latest.weight - a.latest.weight;
    return new Date(b.latest.date).getTime() - new Date(a.latest.date).getTime();
  });

  // Global stats
  const allMeasurements = clients.flatMap((c) => c.measurements);
  const clientsWithData = clients.filter((c) => c.measurements.length > 0).length;
  const avgWeight = allMeasurements.length
    ? (allMeasurements.reduce((acc, m) => acc + m.weight, 0) / allMeasurements.length).toFixed(1)
    : "—";
  const avgBodyFat = (() => {
    const withFat = allMeasurements.filter((m) => m.bodyFat);
    return withFat.length ? (withFat.reduce((acc, m) => acc + (m.bodyFat ?? 0), 0) / withFat.length).toFixed(1) : "—";
  })();

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Misurazioni Corporee</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
          {allMeasurements.length} rilevazioni su {clientsWithData} {clientsWithData === 1 ? "cliente" : "clienti"}
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Clienti monitorati", value: clientsWithData, color: "var(--accent)" },
          { label: "Totale rilevazioni", value: allMeasurements.length, color: "#38bdf8" },
          { label: "Peso medio", value: avgWeight !== "—" ? `${avgWeight} kg` : "—", color: "#a78bfa" },
          { label: "% grasso medio", value: avgBodyFat !== "—" ? `${avgBodyFat}%` : "—", color: "#fbbf24" },
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
            placeholder="Cerca cliente…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }} />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}>
          <option value="recenti">Più recenti</option>
          <option value="peso_asc">Peso ↑</option>
          <option value="peso_desc">Peso ↓</option>
        </select>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-20 card-luxury rounded-2xl">
          <TrendingUp size={48} className="mx-auto mb-4" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--ivory)" }}>
            {allMeasurements.length === 0 ? "Nessuna misurazione" : "Nessun risultato"}
          </p>
          <p className="text-sm mb-4" style={{ color: "rgba(245,240,232,0.4)" }}>
            {allMeasurements.length === 0
              ? "Registra misurazioni dalla scheda di ogni cliente"
              : "Nessun cliente corrisponde alla ricerca"}
          </p>
          {allMeasurements.length === 0 && (
            <Link href="/dashboard/clienti" className="accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
              Vai ai clienti
            </Link>
          )}
        </div>
      )}

      {/* Client measurement cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map(({ client, latest, prev, totalChange, count, weightHistory }) => (
          <Link key={client.id} href={`/dashboard/clienti/${client.id}?tab=misurazioni`}
            className="card-luxury rounded-2xl p-5 hover:border-[rgba(255,107,43,0.3)] transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl accent-btn flex items-center justify-center font-bold flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--ivory)" }}>{client.name}</p>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{count} rilevazioni · Ultima: {formatDate(latest.date)}</p>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all mt-1" style={{ color: "var(--accent-light)" }} />
            </div>

            {/* Weight + sparkline */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>Peso attuale</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold" style={{ color: "var(--ivory)" }}>{latest.weight}</p>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>kg</p>
                  <WeightTrend current={latest.weight} prev={prev?.weight} />
                </div>
                {count > 1 && (
                  <p className="text-xs mt-1" style={{ color: totalChange < 0 ? "#22c55e" : totalChange > 0 ? "#f87171" : "rgba(245,240,232,0.5)" }}>
                    {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)} kg totale
                  </p>
                )}
              </div>
              {weightHistory.length >= 2 && (
                <SparkLine data={weightHistory} positive={totalChange <= 0} />
              )}
            </div>

            {/* Body fat + measurements */}
            {(latest.bodyFat || latest.waist || latest.arms) && (
              <div className="flex flex-wrap gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {latest.bodyFat && (
                  <div>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>% grasso</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{latest.bodyFat}%</p>
                  </div>
                )}
                {latest.waist && (
                  <div>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Vita</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{latest.waist} cm</p>
                  </div>
                )}
                {latest.arms && (
                  <div>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Braccia</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{latest.arms} cm</p>
                  </div>
                )}
                {latest.chest && (
                  <div>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Petto</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{latest.chest} cm</p>
                  </div>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
