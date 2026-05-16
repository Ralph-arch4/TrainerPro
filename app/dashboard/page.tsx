"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  Users, Activity, TrendingUp, UtensilsCrossed, Plus, ArrowRight,
  CheckCircle2, Circle, Dumbbell, Share2, ClipboardList, Euro,
  Flame, AlertTriangle, Trophy, Zap, Gift, MessageCircle, Scale,
} from "lucide-react";

function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buongiorno";
  if (h >= 12 && h < 18) return "Buon pomeriggio";
  if (h >= 18 && h < 22) return "Buonasera";
  return "Bentornato";
}

export default function DashboardPage() {
  const user       = useAppStore((s) => s.user);
  const clients    = useAppStore((s) => s.clients);
  const dataLoaded = useAppStore((s) => s.dataLoaded);

  const firstName  = user?.name?.split(" ")[0] ?? "Trainer";

  const { activeClients, totalWorkoutPlans, totalPhases, totalMeasurements, monthlyRevenue, logsThisMonth, inactiveCount, avgRevenue } = useMemo(() => {
    const active  = clients.filter((c) => c.status === "attivo");
    const revenue = active.reduce((sum, c) => sum + (c.monthlyFee ?? 0), 0);
    const cutoff  = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const now     = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let logsMonth = 0;
    let inactiveClients = 0;
    clients.forEach(c => {
      const recentLogs = c.workoutPlans.flatMap(p => p.logs).filter(l => new Date(l.loggedAt).getTime() > cutoff);
      if (c.status === "attivo" && recentLogs.length === 0) inactiveClients++;
      c.workoutPlans.forEach(p => {
        p.logs.forEach(l => {
          if (new Date(l.loggedAt).getTime() >= monthStart) logsMonth++;
        });
      });
    });

    return {
      activeClients:     active.length,
      totalWorkoutPlans: clients.reduce((acc, c) => acc + c.workoutPlans.length, 0),
      totalPhases:       clients.reduce((acc, c) => acc + c.phases.length, 0),
      totalMeasurements: clients.reduce((acc, c) => acc + c.measurements.length, 0),
      monthlyRevenue:    revenue,
      logsThisMonth:     logsMonth,
      inactiveCount:     inactiveClients,
      avgRevenue:        active.length > 0 ? Math.round(revenue / active.length) : 0,
    };
  }, [clients]);

  const recentClients = useMemo(
    () => [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [clients]
  );

  // Radar attività: chi sta performando vs chi rischia abbandono
  const { topClients, atRiskClients } = useMemo(() => {
    const week7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const scored = clients
      .filter(c => c.status === "attivo")
      .map(c => {
        const allLogs = c.workoutPlans.flatMap(p => p.logs ?? []);
        const weekLogs = allLogs.filter(l => new Date(l.loggedAt).getTime() > week7).length;
        const lastLog = allLogs.length > 0
          ? new Date(Math.max(...allLogs.map(l => new Date(l.loggedAt).getTime())))
          : null;
        const daysSinceLast = lastLog
          ? Math.floor((Date.now() - lastLog.getTime()) / 86400000)
          : (c.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 999);
        return { client: c, weekLogs, daysSinceLast };
      });
    const top = scored.filter(s => s.weekLogs > 0).sort((a, b) => b.weekLogs - a.weekLogs).slice(0, 3);
    const risk = scored.filter(s => s.daysSinceLast >= 7).sort((a, b) => b.daysSinceLast - a.daysSinceLast).slice(0, 3);
    return { topClients: top, atRiskClients: risk };
  }, [clients]);

  // Progression detector: exercises stalled at same weight for 3+ consecutive weeks
  const progressionSuggestions = useMemo(() => {
    const results: { clientName: string; clientId: string; exerciseName: string; weight: number; suggested: number }[] = [];
    for (const client of clients.filter(c => c.status === "attivo")) {
      for (const plan of client.workoutPlans) {
        const byExercise: Record<string, typeof plan.logs> = {};
        for (const log of plan.logs) {
          if (!byExercise[log.exerciseId]) byExercise[log.exerciseId] = [];
          byExercise[log.exerciseId].push(log);
        }
        for (const [exId, logs] of Object.entries(byExercise)) {
          const sorted = [...logs].filter(l => l.weight != null).sort((a, b) => b.weekNumber - a.weekNumber);
          if (sorted.length < 3) continue;
          const last3 = sorted.slice(0, 3);
          if (!last3.every(l => l.weight === last3[0].weight)) continue;
          const ex = plan.exercises.find(e => e.id === exId);
          if (!ex) continue;
          results.push({
            clientName: client.name,
            clientId: client.id,
            exerciseName: ex.name,
            weight: last3[0].weight!,
            suggested: Math.round((last3[0].weight! + 2.5) * 2) / 2,
          });
        }
      }
    }
    return results.slice(0, 4);
  }, [clients]);

  // Birthday radar: clients with birthday in the next 7 days
  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return clients
      .filter(c => c.status === "attivo" && c.birthDate)
      .map(c => {
        const bday = new Date(c.birthDate!);
        let bdayThis = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
        if (bdayThis.getTime() < todayMidnight) {
          bdayThis = new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate());
        }
        const daysUntil = Math.floor((bdayThis.getTime() - todayMidnight) / 86400000);
        const turnsAge = bdayThis.getFullYear() - bday.getFullYear();
        return { client: c, daysUntil, turnsAge };
      })
      .filter(b => b.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [clients]);

  // Highlights settimana: PR battuti e ritorni dopo assenza lunga
  const weekHighlights = useMemo(() => {
    const results: Array<{
      clientName: string; clientId: string;
      type: "pr" | "comeback"; label: string; detail: string;
    }> = [];
    const weekAgo = Date.now() - 7 * 86400000;

    for (const client of clients.filter(c => c.status === "attivo")) {
      for (const plan of client.workoutPlans) {
        const byEx: Record<string, typeof plan.logs> = {};
        for (const log of plan.logs) {
          if (!byEx[log.exerciseId]) byEx[log.exerciseId] = [];
          byEx[log.exerciseId].push(log);
        }
        for (const [exId, logs] of Object.entries(byEx)) {
          const withWeight = logs.filter(l => l.weight != null);
          if (!withWeight.length) continue;
          const thisWeek = withWeight.filter(l => new Date(l.loggedAt).getTime() > weekAgo);
          if (!thisWeek.length) continue;
          const best = Math.max(...thisWeek.map(l => l.weight!));
          const allTime = Math.max(...withWeight.map(l => l.weight!));
          if (best >= allTime && best > 0) {
            const ex = plan.exercises.find(e => e.id === exId);
            if (ex) results.push({ clientName: client.name, clientId: client.id, type: "pr", label: "Record personale", detail: `${ex.name}: ${best}kg` });
          }
        }
        const thisWeekLogs = plan.logs.filter(l => new Date(l.loggedAt).getTime() > weekAgo);
        if (thisWeekLogs.length) {
          const before = plan.logs.filter(l => new Date(l.loggedAt).getTime() <= weekAgo);
          if (before.length) {
            const lastBefore = Math.max(...before.map(l => new Date(l.loggedAt).getTime()));
            const gapDays = Math.floor((weekAgo - lastBefore) / 86400000);
            if (gapDays >= 7) results.push({ clientName: client.name, clientId: client.id, type: "comeback", label: "Ritorno in palestra", detail: `Assente da ${gapDays + 7}gg` });
          }
        }
      }
    }
    const seen = new Set<string>();
    return results.filter(r => { const k = `${r.clientId}-${r.type}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
  }, [clients]);

  // Stallo peso: clients with 3+ consecutive measurements within ±0.5kg
  const measurementPlateauAlerts = useMemo(() => {
    const results: { client: typeof clients[0]; weight: number; lastDate: string }[] = [];
    for (const c of clients.filter(cl => cl.status === "attivo")) {
      const sorted = [...c.measurements]
        .filter(m => m.weight != null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sorted.length < 3) continue;
      const last3 = sorted.slice(0, 3);
      const max = Math.max(...last3.map(m => m.weight!));
      const min = Math.min(...last3.map(m => m.weight!));
      if (max - min > 0.5) continue;
      results.push({ client: c, weight: last3[0].weight!, lastDate: last3[0].date });
    }
    return results.slice(0, 4);
  }, [clients]);

  // Smart onboarding: check what's actually done
  const hasClients     = clients.length > 0;
  const hasScheda      = clients.some((c) => c.workoutPlans.length > 0);
  const hasPhase       = clients.some((c) => c.phases.length > 0);
  const hasSharedLink  = clients.some((c) => c.workoutPlans.some((p) => p.shareToken));
  const onboardingDone = hasClients && hasScheda && hasPhase && hasSharedLink;

  const goalLabels: Record<string, string> = {
    dimagrimento: "Dimagrimento",
    massa: "Massa muscolare",
    tonificazione: "Tonificazione",
    performance: "Performance",
  };

  const statusColors: Record<string, string> = {
    attivo: "#22c55e",
    inattivo: "#6b7280",
    in_pausa: "#f59e0b",
  };

  const revenueLabel = monthlyRevenue > 0 ? `€${monthlyRevenue.toLocaleString("it-IT")}/mese` : "—";

  const stats = [
    { label: "Clienti attivi",      value: `${activeClients} / ${clients.length}`,   icon: Users,       color: "#FF6B2B" },
    { label: "Fatturato mensile",   value: revenueLabel,                              icon: Euro,        color: "#fbbf24" },
    { label: "Log questo mese",     value: String(logsThisMonth),                     icon: TrendingUp,  color: "#34d399" },
    { label: "Senza attività (14g)",value: inactiveCount > 0 ? String(inactiveCount) : "—", icon: Activity, color: inactiveCount > 0 ? "#f87171" : "#6b7280" },
  ];

  if (!dataLoaded) {
    return (
      <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
        <div className="mb-8">
          <div className="h-8 w-56 rounded-xl mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-4 w-36 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-luxury rounded-2xl p-5 animate-pulse">
              <div className="h-8 w-12 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card-luxury rounded-2xl p-5 animate-pulse" style={{ height: "180px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--ivory)" }}>
          {timeGreeting()},{" "}
          <span className="accent-text">{firstName}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.5)" }}>
          {clients.length === 0
            ? "Inizia configurando il tuo studio"
            : `${clients.length} ${clients.length === 1 ? "cliente" : "clienti"} · ${totalPhases} fasi · ${totalMeasurements} misurazioni`}
        </p>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-luxury rounded-2xl p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>{label}</p>
                <p className="text-3xl lg:text-3xl font-bold" style={{ color: "var(--ivory)" }}>{value}</p>
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary metrics row ─────────────────────────────────────────── */}
      {activeClients > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Euro size={13} style={{ color: "#fbbf24" }} />
            <span style={{ color: "rgba(245,240,232,0.5)" }}>Media/cliente:</span>
            <span className="font-bold" style={{ color: "var(--ivory)" }}>
              {avgRevenue > 0 ? `€${avgRevenue}/mese` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Dumbbell size={13} style={{ color: "var(--accent)" }} />
            <span style={{ color: "rgba(245,240,232,0.5)" }}>Schede totali:</span>
            <span className="font-bold" style={{ color: "var(--ivory)" }}>{totalWorkoutPlans}</span>
          </div>
          {inactiveCount > 0 && (
            <Link href="/dashboard/clienti"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <Activity size={13} />
              {inactiveCount} {inactiveCount === 1 ? "cliente" : "clienti"} senza attività da 14 giorni
            </Link>
          )}
        </div>
      )}

      {/* ── Radar Attività ───────────────────────────────────────────────── */}
      {(topClients.length > 0 || atRiskClients.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Top performers */}
          {topClients.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={14} style={{ color: "#fbbf24" }} />
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.6)" }}>
                  In forma questa settimana
                </p>
              </div>
              <div className="space-y-2">
                {topClients.map(({ client, weekLogs }, idx) => (
                  <Link key={client.id} href={`/dashboard/clienti/${client.id}`}
                    className="flex items-center gap-3 group">
                    <span className="text-sm font-black w-4 flex-shrink-0"
                      style={{ color: idx === 0 ? "#fbbf24" : idx === 1 ? "#d1d5db" : "#cd7f32" }}>
                      {idx + 1}
                    </span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="flex-1 text-sm font-semibold truncate group-hover:underline"
                      style={{ color: "var(--ivory)" }}>{client.name}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Flame size={11} style={{ color: "#f97316" }} />
                      <span className="text-xs font-bold" style={{ color: "#f97316" }}>{weekLogs}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* At risk */}
          {atRiskClients.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} style={{ color: "#f87171" }} />
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.6)" }}>
                  Necessitano un messaggio
                </p>
              </div>
              <div className="space-y-2">
                {atRiskClients.map(({ client, daysSinceLast }) => (
                  <div key={client.id} className="flex items-center gap-2">
                    <Link href={`/dashboard/clienti/${client.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0 group">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="flex-1 text-sm font-semibold truncate group-hover:underline"
                        style={{ color: "var(--ivory)" }}>{client.name}</p>
                      <span className="text-xs flex-shrink-0 font-medium" style={{ color: "rgba(248,113,113,0.7)" }}>
                        {daysSinceLast}gg fa
                      </span>
                    </Link>
                    {client.phone && (
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao ${client.name.split(" ")[0]}, sono passati ${daysSinceLast} giorni dall'ultima sessione. Quando riprendi?`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 flex-shrink-0"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                        <MessageCircle size={11} />
                        WA
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Radar Progressione ───────────────────────────────────────────── */}
      {progressionSuggestions.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.18)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} style={{ color: "#fbbf24" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.6)" }}>
              Progressione consigliata
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1 font-bold"
              style={{ background: "rgba(251,191,36,0.18)", color: "#fbbf24" }}>
              {progressionSuggestions.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {progressionSuggestions.map((s, i) => (
              <Link key={i} href={`/dashboard/clienti/${s.clientId}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
                  {s.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--ivory)" }}>{s.clientName}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(245,240,232,0.5)" }}>{s.exerciseName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>{s.weight}kg → {s.suggested}kg</p>
                  <p className="text-xs" style={{ color: "rgba(251,191,36,0.6)" }}>3 sett. stabile</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Highlights della settimana ──────────────────────────────────── */}
      {weekHighlights.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: "#fbbf24" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.6)" }}>
              Highlights della settimana
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1 font-bold"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
              {weekHighlights.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {weekHighlights.map((h, i) => (
              <Link key={i} href={`/dashboard/clienti/${h.clientId}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: h.type === "pr" ? "rgba(251,191,36,0.15)" : "rgba(34,197,94,0.12)", color: h.type === "pr" ? "#fbbf24" : "#34d399" }}>
                  {h.type === "pr" ? <Flame size={14} /> : <Zap size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--ivory)" }}>{h.clientName}</p>
                  <p className="text-xs truncate">
                    <span className="font-semibold" style={{ color: h.type === "pr" ? "#fbbf24" : "#34d399" }}>{h.label}</span>
                    <span style={{ color: "rgba(245,240,232,0.45)" }}>{" · "}{h.detail}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Compleanni imminenti ─────────────────────────────────────────── */}
      {upcomingBirthdays.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={14} style={{ color: "#c084fc" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.6)" }}>
              Compleanni imminenti
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1 font-bold"
              style={{ background: "rgba(168,85,247,0.18)", color: "#c084fc" }}>
              {upcomingBirthdays.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {upcomingBirthdays.map(({ client, daysUntil, turnsAge }) => (
              <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: daysUntil === 0 ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.06)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(168,85,247,0.18)", color: "#c084fc" }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--ivory)" }}>
                    {client.name}
                    <span className="ml-1.5 text-xs font-normal" style={{ color: "rgba(192,132,252,0.65)" }}>
                      {turnsAge} anni
                    </span>
                  </p>
                  <p className="text-xs font-medium" style={{ color: daysUntil === 0 ? "#c084fc" : "rgba(245,240,232,0.45)" }}>
                    {daysUntil === 0 ? "Oggi!" : daysUntil === 1 ? "Domani" : `Tra ${daysUntil} giorni`}
                  </p>
                </div>
                {client.phone && (
                  <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Tanti auguri ${client.name.split(" ")[0]}!`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                    <MessageCircle size={11} />
                    WA
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stallo peso corporeo ─────────────────────────────────────────── */}
      {measurementPlateauAlerts.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Scale size={14} style={{ color: "#818cf8" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.6)" }}>
              Stallo peso corporeo
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}>
              {measurementPlateauAlerts.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "rgba(245,240,232,0.35)" }}>
              3 misurazioni stabili — valuta aggiustamenti
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {measurementPlateauAlerts.map((s, i) => (
              <Link key={i} href={`/dashboard/clienti/${s.client.id}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                  {s.client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--ivory)" }}>{s.client.name}</p>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>
                    Ultima mis.: {new Date(s.lastDate).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: "#818cf8" }}>{s.weight} kg</p>
                  <p className="text-xs" style={{ color: "rgba(130,138,252,0.6)" }}>≈ stabile</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content: onboarding OR active view ──────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Left: onboarding steps (always shown until all done) or recent clients */}
        {!onboardingDone ? (
          <div className="card-luxury rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,107,43,0.1)" }}>
                <Plus size={19} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Inizia in 4 passi</h2>
                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
                  {[hasClients, hasScheda, hasPhase, hasSharedLink].filter(Boolean).length} / 4 completati
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {([
                { icon: Users,         label: "Aggiungi il tuo primo cliente",   desc: "Nome, obiettivo, livello e dati personali", href: "/dashboard/clienti?new=1", done: hasClients },
                { icon: Dumbbell,      label: "Crea una scheda di allenamento",  desc: "Organizza gli esercizi per giorno",         href: "/dashboard/clienti",    done: hasScheda },
                { icon: Activity,      label: "Imposta una fase",                desc: "Bulk, Cut o Mantenimento con calorie target", href: "/dashboard/fasi",     done: hasPhase },
                { icon: Share2,        label: "Condividi il link col cliente",   desc: "Il cliente traccia i progressi ogni settimana", href: "/dashboard/clienti", done: hasSharedLink },
              ] as const).map(({ icon: Icon, label, desc, href, done }, i) => (
                <Link key={i} href={href}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-white/5 group">
                  <div className="flex-shrink-0">
                    {done
                      ? <CheckCircle2 size={19} style={{ color: "#22c55e" }} />
                      : <Circle size={19} style={{ color: "rgba(255,107,43,0.3)" }} />}
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: done ? "rgba(34,197,94,0.08)" : "rgba(255,107,43,0.08)" }}>
                    <Icon size={14} style={{ color: done ? "#22c55e" : "var(--accent)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{
                      color: done ? "rgba(245,240,232,0.5)" : "var(--ivory)",
                      textDecoration: done ? "line-through" : "none",
                    }}>{label}</p>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>{desc}</p>
                  </div>
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-60 transition-all flex-shrink-0"
                    style={{ color: "var(--accent-light)" }} />
                </Link>
              ))}
            </div>
            {!hasClients && (
              <Link href="/dashboard/clienti"
                className="accent-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm mt-5">
                <Plus size={14} /> Aggiungi il tuo primo cliente
              </Link>
            )}
          </div>
        ) : (
          /* ── Recent clients (shown when onboarding complete) ── */
          <div className="card-luxury rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--ivory)" }}>Clienti recenti</h2>
              <Link href="/dashboard/clienti"
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ color: "var(--accent-light)" }}>
                Vedi tutti <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {recentClients.map((client) => (
                <Link key={client.id} href={`/dashboard/clienti/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5">
                  <div className="w-9 h-9 rounded-full accent-btn flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--ivory)" }}>{client.name}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(245,240,232,0.45)" }}>
                      {client.goal ? goalLabels[client.goal] : "Obiettivo non impostato"}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: statusColors[client.status] }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Right: Quick actions (always visible) */}
        <div className="card-luxury rounded-2xl p-5">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ivory)" }}>Azioni rapide</h2>
          <div className="space-y-1.5">
            {([
              { href: "/dashboard/clienti?new=1", icon: Users,    label: "Nuovo cliente",          desc: "Registra un nuovo cliente" },
              { href: "/dashboard/fasi",    icon: Activity,      label: "Crea una fase",           desc: "Bulk, cut o mantenimento" },
              { href: "/dashboard/diete",   icon: UtensilsCrossed, label: "Piano alimentare",     desc: "Calcola macro e calorie" },
              { href: "/dashboard/misurazioni", icon: TrendingUp, label: "Registra misurazioni",  desc: "Traccia i progressi fisici" },
              { href: "/dashboard/intake",  icon: ClipboardList,  label: "Invia form d'intake",   desc: "Raccogli dati dal cliente" },
            ] as const).map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,107,43,0.08)" }}>
                  <Icon size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--ivory)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{desc}</p>
                </div>
                <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: "var(--accent-light)" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
