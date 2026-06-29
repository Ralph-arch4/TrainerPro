"use client";
import { useMemo } from "react";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { useAppStore } from "@/lib/store";
import { showToast } from "@/components/Toast";
import {
  Users, Activity, TrendingUp, UtensilsCrossed, Plus, ArrowRight,
  CheckCircle2, Circle, Dumbbell, Share2, ClipboardList, Euro,
  Flame, AlertTriangle, Trophy, Zap, Gift, MessageCircle, Scale, TrendingDown,
  BarChart2, CreditCard, Target, Heart, ClipboardCopy, CalendarClock, ShieldAlert,
} from "lucide-react";

function nameHash(name: string): number[] {
  const h: number[] = [];
  for (let i = 0; i < name.length; i++) h.push(name.charCodeAt(i));
  while (h.length < 6) h.push(h.reduce((a, b) => a + b, 42) % 256);
  return h;
}

function StudioPattern({ name }: { name: string }) {
  const h = nameHash(name);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "TP";
  const cellSize = 48;
  const cols = 8;
  const rows = 3;
  const variant = h[0] % 4;
  const angle = 10 + (h[1] % 20);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${cols * cellSize} ${rows * cellSize}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.028 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="studio-trama" x="0" y="0" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
          {variant === 0 && (
            <>
              <circle cx={cellSize / 2} cy={cellSize / 2} r={6} fill="none" stroke="var(--accent)" strokeWidth="1.2" />
              <text x={cellSize / 2} y={cellSize / 2 + 3} textAnchor="middle" fontSize="6" fontWeight="900" fill="var(--accent)" fontFamily="Georgia,serif" fontStyle="italic">{initials}</text>
            </>
          )}
          {variant === 1 && (
            <>
              <path d={`M${cellSize / 2} 4 L${cellSize - 4} ${cellSize / 2} L${cellSize / 2} ${cellSize - 4} L4 ${cellSize / 2}Z`} fill="none" stroke="var(--accent)" strokeWidth="0.8" />
              <circle cx={cellSize / 2} cy={cellSize / 2} r={3} fill="var(--accent)" />
            </>
          )}
          {variant === 2 && (
            <>
              <line x1="0" y1="0" x2={cellSize} y2={cellSize} stroke="var(--accent)" strokeWidth="0.6" />
              <line x1={cellSize} y1="0" x2="0" y2={cellSize} stroke="var(--accent)" strokeWidth="0.6" />
              <text x={cellSize / 2} y={cellSize / 2 + 3.5} textAnchor="middle" fontSize="7" fontWeight="900" fill="var(--accent)" fontFamily="Georgia,serif">{initials}</text>
            </>
          )}
          {variant === 3 && (
            <>
              <rect x="6" y="6" width={cellSize - 12} height={cellSize - 12} rx="4" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
              <circle cx={cellSize / 2} cy={cellSize / 2} r={2} fill="var(--accent)" />
              {[0, 90, 180, 270].map(a => {
                const r = (a * Math.PI) / 180;
                return <circle key={a} cx={cellSize / 2 + Math.cos(r) * 10} cy={cellSize / 2 + Math.sin(r) * 10} r="1.2" fill="var(--accent)" />;
              })}
            </>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#studio-trama)" />
    </svg>
  );
}

function StudioIdentityStrip({ name, plan }: { name: string; plan: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "TP";
  const h = nameHash(name);
  const tierLabel: Record<string, string> = { free: "Starter", personal_coach: "Personal Coach", fitness_master: "Fitness Master" };
  const tierColor: Record<string, string> = { free: "rgba(201,168,76,0.6)", personal_coach: "#C9A84C", fitness_master: "#f0d060" };
  const cx = 32, cy = 32;
  const petalCount = 4 + (h[0] % 3);
  const innerR = 14 + (h[1] % 5);

  return (
    <div className="mb-6 rounded-2xl overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, rgba(12,4,4,0.95) 0%, rgba(30,12,6,0.85) 50%, rgba(12,4,4,0.95) 100%)", border: "1px solid rgba(201,168,76,0.18)" }}>
      <StudioPattern name={name} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)" }} />
      <div className="relative flex items-center gap-5 px-5 py-4">
        {/* Generated monogram */}
        <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx={cx} cy={cy} r="30" fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth="0.6" />
            <circle cx={cx} cy={cy} r="22" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.8" strokeDasharray="2 3" />
            {Array.from({ length: petalCount }, (_, i) => {
              const angle = (i * 360 / petalCount - 90) * Math.PI / 180;
              const x1 = cx + Math.cos(angle) * innerR;
              const y1 = cy + Math.sin(angle) * innerR;
              const x2 = cx + Math.cos(angle) * 28;
              const y2 = cy + Math.sin(angle) * 28;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,168,76,0.22)" strokeWidth="0.7" />;
            })}
            {[0, 90, 180, 270].map(a => {
              const r = (a * Math.PI) / 180;
              return <circle key={a} cx={cx + Math.cos(r) * 27} cy={cy + Math.sin(r) * 27} r="1.3" fill="rgba(201,168,76,0.3)" />;
            })}
            <circle cx={cx} cy={cy} r="15" fill="rgba(201,168,76,0.08)" />
            <circle cx={cx} cy={cy} r="15" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="1" />
            <text x={cx} y={cy + 5.5} textAnchor="middle" fontSize="13" fontWeight="900"
              fill="rgba(201,168,76,0.8)" fontFamily="Georgia,'Times New Roman',serif" fontStyle="italic">
              {initials}
            </text>
          </svg>
        </div>

        {/* Studio info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "rgba(201,168,76,0.45)" }}>Il tuo studio</p>
          <p className="text-lg font-black tracking-tight" style={{ color: "var(--text)", fontFamily: "Georgia,'Times New Roman',serif", fontStyle: "italic" }}>{name}</p>
          <div className="h-px mt-2 mb-2" style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)", maxWidth: 180 }} />
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: tierColor[plan] ?? tierColor.free }}>
            {tierLabel[plan] ?? "Starter"}
          </p>
        </div>

        {/* Brand mark */}
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs font-black tracking-[0.14em] uppercase" style={{ color: "rgba(201,168,76,0.28)" }}>REC Studio</span>
          <span className="text-xs" style={{ color: "rgba(201,168,76,0.18)" }}>TrainerPro</span>
        </div>
      </div>
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), rgba(201,168,76,0.4), rgba(201,168,76,0.25), transparent)" }} />
    </div>
  );
}

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

  // Note da monitorare: log recenti con possibili segnali di dolore/infortunio
  const painFlagAlerts = useMemo(() => {
    const PAIN_RE = /dolor|fastidi|infortun|tirat|stiramento|bruci|formicol|fa male|scrocch|inflam/i;
    const weekAgo = Date.now() - 7 * 86400000;
    const results: { clientName: string; clientId: string; exerciseName: string; note: string; loggedAt: string }[] = [];
    for (const client of clients.filter(c => c.status === "attivo")) {
      for (const plan of client.workoutPlans) {
        for (const log of plan.logs) {
          if (!log.note || !PAIN_RE.test(log.note)) continue;
          if (new Date(log.loggedAt).getTime() < weekAgo) continue;
          const ex = plan.exercises.find(e => e.id === log.exerciseId);
          results.push({ clientName: client.name, clientId: client.id, exerciseName: ex?.name ?? "Esercizio", note: log.note, loggedAt: log.loggedAt });
        }
      }
    }
    return results.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()).slice(0, 4);
  }, [clients]);

  // Piani in scadenza: scheda attiva a tempo che sta per finire — prepara la prossima
  const planEndingAlerts = useMemo(() => {
    const results: { client: typeof clients[0]; plan: typeof clients[0]["workoutPlans"][0]; weeksLeft: number }[] = [];
    for (const client of clients.filter(c => c.status === "attivo")) {
      for (const plan of client.workoutPlans) {
        if (!plan.active || !plan.totalWeeks) continue;
        const maxLogged = plan.logs.length > 0 ? Math.max(...plan.logs.map(l => l.weekNumber)) : 0;
        const weeksLeft = plan.totalWeeks - maxLogged;
        if (weeksLeft >= 0 && weeksLeft <= 1) results.push({ client, plan, weeksLeft });
      }
    }
    return results.sort((a, b) => a.weeksLeft - b.weeksLeft).slice(0, 5);
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

  // Anniversari del percorso: collaborazioni che raggiungono 30/60/90/180/365 giorni entro 7 giorni
  const anniversaryAlerts = useMemo(() => {
    const MILESTONES = [30, 60, 90, 180, 365];
    const now = new Date();
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const results: { client: typeof clients[0]; days: number; daysUntil: number; label: string }[] = [];
    for (const c of clients.filter(cl => cl.status === "attivo" && cl.startDate)) {
      const start = new Date(c.startDate!);
      for (const days of MILESTONES) {
        const msDt = new Date(start.getTime() + days * 86400000);
        const msMs = new Date(msDt.getFullYear(), msDt.getMonth(), msDt.getDate()).getTime();
        const diff = Math.floor((msMs - todayMs) / 86400000);
        if (diff >= 0 && diff <= 7) {
          const label = days < 365 ? `${days} giorni insieme` : "1 anno insieme";
          results.push({ client: c, days, daysUntil: diff, label });
        }
      }
    }
    return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 4);
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

  // Churn radar: clients whose weekly log frequency is declining (w-2 > w-1 > w-0)
  const churnRiskClients = useMemo(() => {
    const now = Date.now();
    const results: {
      client: typeof clients[0];
      w2: number; w1: number; w0: number;
      risk: "critico" | "alto" | "medio";
    }[] = [];
    for (const c of clients.filter(cl => cl.status === "attivo")) {
      const allLogs = c.workoutPlans.flatMap(p => p.logs ?? []);
      const inWindow = (from: number, to: number) =>
        allLogs.filter(l => { const t = new Date(l.loggedAt).getTime(); return t > now - to * 86400000 && t <= now - from * 86400000; }).length;
      const w2 = inWindow(21, 14);
      const w1 = inWindow(14, 7);
      const w0 = inWindow(7, 0);
      if (w2 === 0 && w1 === 0) continue;
      const baseline = Math.max(w2, w1);
      if (w0 >= baseline) continue;
      const risk: "critico" | "alto" | "medio" =
        w0 === 0 && baseline > 0 ? "critico" :
        w0 < baseline / 2 ? "alto" : "medio";
      results.push({ client: c, w2, w1, w0, risk });
    }
    return results
      .sort((a, b) => ({ critico: 0, alto: 1, medio: 2 }[a.risk] - { critico: 0, alto: 1, medio: 2 }[b.risk]))
      .slice(0, 5);
  }, [clients]);

  // Rinnovi imminenti: clients whose monthly billing day falls within next 7 days
  const renewalAlerts = useMemo(() => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const results: { client: typeof clients[0]; daysUntil: number; fee: number }[] = [];
    for (const c of clients.filter(cl => cl.status === "attivo" && cl.monthlyFee && cl.startDate)) {
      const startDay = new Date(c.startDate!).getDate();
      let nextRenewal = new Date(today.getFullYear(), today.getMonth(), startDay);
      if (nextRenewal.getTime() < todayMidnight) {
        nextRenewal = new Date(today.getFullYear(), today.getMonth() + 1, startDay);
      }
      const daysUntil = Math.floor((nextRenewal.getTime() - todayMidnight) / 86400000);
      if (daysUntil <= 7) results.push({ client: c, daysUntil, fee: c.monthlyFee! });
    }
    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [clients]);

  // Coach Pulse: sintesi settimanale — score 0-100 per lo studio
  const coachPulse = useMemo(() => {
    const now = Date.now();
    const active = clients.filter(c => c.status === "attivo");
    if (active.length === 0) return null;

    const loggedThisWeek = active.filter(c =>
      c.workoutPlans.flatMap(p => p.logs ?? []).some(l => new Date(l.loggedAt).getTime() > now - 7 * 86400000)
    ).length;

    const loggedLastWeek = active.filter(c =>
      c.workoutPlans.flatMap(p => p.logs ?? []).some(l => {
        const t = new Date(l.loggedAt).getTime();
        return t > now - 14 * 86400000 && t <= now - 7 * 86400000;
      })
    ).length;

    const adherenceRatio = loggedThisWeek / active.length;
    const trend = loggedLastWeek > 0 ? (loggedThisWeek - loggedLastWeek) / loggedLastWeek : 0;

    const prCount = weekHighlights.filter(h => h.type === "pr").length;
    const prBonus = Math.min(20, prCount * 5);

    const score = Math.round(adherenceRatio * 60 + Math.max(-15, Math.min(20, trend * 20)) + prBonus);
    const clamped = Math.max(0, Math.min(100, score));

    const label =
      clamped >= 80 ? "Studio in ottima forma" :
      clamped >= 60 ? "Settimana positiva" :
      clamped >= 40 ? "Settimana nella norma" :
      "Settimana da monitorare";

    const color =
      clamped >= 80 ? "#22c55e" :
      clamped >= 60 ? "#fbbf24" :
      clamped >= 40 ? "#fb923c" : "#ef4444";

    const trendLabel = trend > 0.05 ? `+${Math.round(trend * 100)}% vs settimana scorsa` :
      trend < -0.05 ? `${Math.round(trend * 100)}% vs settimana scorsa` : "Stabile vs settimana scorsa";

    const sentence =
      `${loggedThisWeek} su ${active.length} clienti attivi hanno allenato questa settimana` +
      (prCount > 0 ? ` · ${prCount} record ${prCount === 1 ? "personale" : "personali"}` : "");

    return { score: clamped, label, color, trendLabel, sentence, trend };
  }, [clients, weekHighlights]);

  // Riepilogo settimanale: testo pronto da copiare per WhatsApp/note del trainer
  const weeklyRecap = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Riepilogo settimanale — ${new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}`);
    if (coachPulse) {
      lines.push("");
      lines.push(`${coachPulse.label} (${coachPulse.score}/100)`);
      lines.push(coachPulse.sentence);
    }
    if (weekHighlights.length) {
      lines.push("");
      lines.push("Highlights della settimana:");
      weekHighlights.forEach(h => lines.push(`- ${h.clientName}: ${h.label} (${h.detail})`));
    }
    if (atRiskClients.length) {
      lines.push("");
      lines.push("Da contattare:");
      atRiskClients.forEach(({ client, daysSinceLast }) => lines.push(`- ${client.name}: ${daysSinceLast}gg senza sessioni`));
    }
    if (renewalAlerts.length) {
      lines.push("");
      lines.push("Rinnovi in arrivo:");
      renewalAlerts.forEach(({ client, daysUntil, fee }) => lines.push(`- ${client.name}: €${fee} ${daysUntil === 0 ? "(oggi)" : daysUntil === 1 ? "(domani)" : `(tra ${daysUntil} giorni)`}`));
    }
    if (upcomingBirthdays.length) {
      lines.push("");
      lines.push("Compleanni in arrivo:");
      upcomingBirthdays.forEach(({ client, daysUntil }) => lines.push(`- ${client.name}: ${daysUntil === 0 ? "oggi" : daysUntil === 1 ? "domani" : `tra ${daysUntil} giorni`}`));
    }
    return lines.join("\n");
  }, [coachPulse, weekHighlights, atRiskClients, renewalAlerts, upcomingBirthdays]);

  const copyWeeklyRecap = async () => {
    try {
      await navigator.clipboard.writeText(weeklyRecap);
      showToast("Riepilogo copiato negli appunti");
    } catch {
      showToast("Impossibile copiare il riepilogo", "error");
    }
  };

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

  // Aderenza piano: sessioni reali vs target (ultimi 4 settimane)
  const weeklyAdherence = useMemo(() => {
    const now = Date.now();
    return clients
      .filter(c => c.status === "attivo" && c.workoutPlans.some(p => p.active))
      .map(c => {
        const activePlan = c.workoutPlans.find(p => p.active)!;
        const target = activePlan.daysPerWeek || 3;
        const allLogs = c.workoutPlans.flatMap(p => p.logs ?? []);
        const weeks = [3, 2, 1, 0].map(weeksAgo => {
          const from = now - (weeksAgo + 1) * 7 * 86400000;
          const to   = now - weeksAgo * 7 * 86400000;
          const uniq = new Set(
            allLogs
              .filter(l => { const t = new Date(l.loggedAt).getTime(); return t > from && t <= to; })
              .map(l => new Date(l.loggedAt).toDateString())
          );
          return uniq.size;
        });
        const thisWeek = weeks[3];
        return { client: c, target, weeks, thisWeek };
      })
      .sort((a, b) => (a.thisWeek / a.target) - (b.thisWeek / b.target))
      .slice(0, 6);
  }, [clients]);

  // Traiettoria fase: clients with active bulk/cut and measurable weight progress vs target
  const phaseTrajectoryAlerts = useMemo(() => {
    const now = Date.now();
    const results: {
      client: typeof clients[0];
      phase: typeof clients[0]["phases"][0];
      currentWeight: number;
      daysRemaining: number;
      requiredPerWeek: number;
      actualPerWeek: number;
      status: "ottimo" | "in_linea" | "in_ritardo";
    }[] = [];

    for (const c of clients.filter(cl => cl.status === "attivo")) {
      const activePhase = [...c.phases]
        .filter(p => !p.completed && p.targetWeight != null && p.endDate)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      if (!activePhase) continue;

      const sortedM = [...c.measurements]
        .filter(m => m.weight != null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortedM.length < 2) continue;

      const currentWeight = sortedM[0].weight!;
      const daysRemaining = Math.floor((new Date(activePhase.endDate!).getTime() - now) / 86400000);
      if (daysRemaining <= 3) continue;

      const weeksRemaining = daysRemaining / 7;
      const requiredPerWeek = (activePhase.targetWeight! - currentWeight) / weeksRemaining;
      if (Math.abs(requiredPerWeek) < 0.05) continue;

      const fourWeeksAgo = now - 28 * 86400000;
      const recent = sortedM.filter(m => new Date(m.date).getTime() >= fourWeeksAgo);
      if (recent.length < 2) continue;
      const oldest = recent[recent.length - 1];
      const newest = recent[0];
      const daysDiff = (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / 86400000;
      if (daysDiff < 3) continue;
      const actualPerWeek = ((newest.weight! - oldest.weight!) / daysDiff) * 7;

      const efficiency = requiredPerWeek !== 0 ? actualPerWeek / requiredPerWeek : 0;
      const status: "ottimo" | "in_linea" | "in_ritardo" =
        efficiency >= 1.1 ? "ottimo" : efficiency >= 0.65 ? "in_linea" : "in_ritardo";

      results.push({ client: c, phase: activePhase, currentWeight, daysRemaining, requiredPerWeek, actualPerWeek, status });
    }
    return results.sort((a, b) => ({ in_ritardo: 0, in_linea: 1, ottimo: 2 }[a.status] - { in_ritardo: 0, in_linea: 1, ottimo: 2 }[b.status])).slice(0, 5);
  }, [clients]);

  // Rendimento per Sessione: €/giorno di allenamento per ogni cliente attivo con fee
  const revenueEfficiency = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    return clients
      .filter(c => c.status === "attivo" && c.monthlyFee && c.monthlyFee > 0)
      .map(c => {
        const trainingDays = new Set(
          c.workoutPlans
            .flatMap(p => p.logs ?? [])
            .filter(l => new Date(l.loggedAt).getTime() > thirtyDaysAgo)
            .map(l => new Date(l.loggedAt).toDateString())
        ).size;
        const perSession = trainingDays > 0 ? Math.round(c.monthlyFee! / trainingDays) : null;
        return { client: c, trainingDays, perSession, fee: c.monthlyFee! };
      })
      .filter(r => r.trainingDays > 0)
      .sort((a, b) => (a.perSession ?? 0) - (b.perSession ?? 0))
      .slice(0, 6);
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
    { label: "Clienti attivi",      value: `${activeClients} / ${clients.length}`,   icon: Users,       color: "#C9A84C" },
    { label: "Fatturato mensile",   value: revenueLabel,                              icon: Euro,        color: "#fbbf24" },
    { label: "Log questo mese",     value: String(logsThisMonth),                     icon: TrendingUp,  color: "#34d399" },
    { label: "Senza attività (14g)",value: inactiveCount > 0 ? String(inactiveCount) : "—", icon: Activity, color: inactiveCount > 0 ? "#f87171" : "#6b7280" },
  ];

  if (!dataLoaded) {
    return (
      <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="skeleton h-8 w-64 rounded-xl mb-2" />
          <div className="skeleton h-4 w-40 rounded-lg" style={{ animationDelay: "0.15s" }} />
        </div>
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card-luxury rounded-2xl p-4 lg:p-5" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="skeleton h-3 rounded" style={{ width: "55%", animationDelay: `${i * 0.08}s` }} />
                <div className="skeleton w-8 h-8 rounded-xl flex-shrink-0" style={{ animationDelay: `${i * 0.08 + 0.1}s` }} />
              </div>
              <div className="skeleton h-8 w-20 rounded-lg" style={{ animationDelay: `${i * 0.08 + 0.2}s` }} />
            </div>
          ))}
        </div>
        {/* Secondary metrics skeleton */}
        <div className="flex gap-3 mb-6">
          {[80, 96, 72].map((w, i) => (
            <div key={i} className="skeleton h-9 rounded-xl" style={{ width: `${w}px`, animationDelay: `${0.35 + i * 0.1}s` }} />
          ))}
        </div>
        {/* Panels skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="card-luxury rounded-2xl p-5" style={{ height: "200px" }}>
              <div className="skeleton h-4 w-32 rounded-lg mb-4" style={{ animationDelay: `${0.5 + i * 0.12}s` }} />
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" style={{ animationDelay: `${0.55 + i * 0.12 + j * 0.07}s` }} />
                  <div className="flex-1">
                    <div className="skeleton h-3 rounded mb-1.5" style={{ width: `${60 + j * 10}%`, animationDelay: `${0.6 + i * 0.12 + j * 0.07}s` }} />
                    <div className="skeleton h-2.5 w-16 rounded" style={{ animationDelay: `${0.65 + i * 0.12 + j * 0.07}s` }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in">

      {/* ── Studio Identity ──────────────────────────────────────────────── */}
      {user && <StudioIdentityStrip name={user.name || "Trainer"} plan={user.plan || "free"} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--text)" }}>
          {timeGreeting()},{" "}
          <span className="accent-text">{firstName}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {clients.length === 0
            ? "Inizia configurando il tuo studio"
            : `${clients.length} ${clients.length === 1 ? "cliente" : "clienti"} · ${totalPhases} fasi · ${totalMeasurements} misurazioni`}
        </p>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <Reveal key={label} delay={0.05 + i * 0.08} className="card-luxury rounded-2xl p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-3xl lg:text-3xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ── Coach Pulse ─────────────────────────────────────────────────── */}
      {coachPulse && (
        <div className="flex items-center gap-4 p-4 rounded-2xl mb-4"
          style={{ background: `${coachPulse.color}09`, border: `1px solid ${coachPulse.color}30` }}>
          {/* Score ring */}
          <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
            <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle cx="26" cy="26" r="21" fill="none" stroke={coachPulse.color} strokeWidth="4"
                strokeDasharray={`${(coachPulse.score / 100 * 131.9).toFixed(1)} 131.9`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black"
              style={{ fontSize: 13, color: coachPulse.color }}>{coachPulse.score}</span>
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: coachPulse.color }}>{coachPulse.label}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{coachPulse.sentence}</p>
          </div>
          {/* Trend pill */}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: `${coachPulse.color}18`,
              color: coachPulse.color,
              border: `1px solid ${coachPulse.color}30`,
            }}>
            {coachPulse.trendLabel}
          </span>
          {/* Copia riepilogo */}
          <button onClick={copyWeeklyRecap} title="Copia riepilogo settimanale"
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: `${coachPulse.color}18`, color: coachPulse.color }}>
            <ClipboardCopy size={14} />
          </button>
        </div>
      )}

      {/* ── Secondary metrics row ─────────────────────────────────────────── */}
      {activeClients > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
            <Euro size={13} style={{ color: "#fbbf24" }} />
            <span style={{ color: "var(--text-muted)" }}>Media/cliente:</span>
            <span className="font-bold" style={{ color: "var(--text)" }}>
              {avgRevenue > 0 ? `€${avgRevenue}/mese` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--surface-sm)", border: "1px solid var(--border)" }}>
            <Dumbbell size={13} style={{ color: "var(--accent)" }} />
            <span style={{ color: "var(--text-muted)" }}>Schede totali:</span>
            <span className="font-bold" style={{ color: "var(--text)" }}>{totalWorkoutPlans}</span>
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
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
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
                      style={{ color: "var(--text)" }}>{client.name}</p>
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
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
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
                        style={{ color: "var(--text)" }}>{client.name}</p>
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
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
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
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{s.clientName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{s.exerciseName}</p>
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

      {/* ── Note da monitorare ───────────────────────────────────────────── */}
      {painFlagAlerts.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <ShieldAlert size={14} style={{ color: "#f87171" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Note da monitorare
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(220,38,38,0.18)", color: "#f87171" }}>
              {painFlagAlerts.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
              possibili segnali nei log recenti
            </span>
          </div>
          <div className="space-y-1.5">
            {painFlagAlerts.map((p, i) => (
              <Link key={i} href={`/dashboard/clienti/${p.clientId}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(220,38,38,0.12)", color: "#f87171" }}>
                  {p.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                    {p.clientName} <span style={{ color: "var(--text-dim)" }}>· {p.exerciseName}</span>
                  </p>
                  <p className="text-xs truncate" style={{ color: "rgba(248,113,113,0.75)" }}>&ldquo;{p.note}&rdquo;</p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                  {new Date(p.loggedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Piani in scadenza ─────────────────────────────────────────────── */}
      {planEndingAlerts.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(251,113,133,0.05)", border: "1px solid rgba(251,113,133,0.2)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CalendarClock size={14} style={{ color: "#fb7185" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Piani in scadenza
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(251,113,133,0.18)", color: "#fb7185" }}>
              {planEndingAlerts.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
              prepara la prossima scheda
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planEndingAlerts.map(({ client, plan, weeksLeft }) => (
              <Link key={plan.id} href={`/dashboard/clienti/${client.id}/schede/${plan.id}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(251,113,133,0.12)", color: "#fb7185" }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{plan.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: "#fb7185" }}>
                    {weeksLeft === 0 ? "Ultima settimana" : "Penultima settimana"}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(251,113,133,0.6)" }}>su {plan.totalWeeks} totali</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Radar Churn Predittivo ───────────────────────────────────────── */}
      {churnRiskClients.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <TrendingDown size={14} style={{ color: "#fb923c" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Frequenza in calo
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(249,115,22,0.18)", color: "#fb923c" }}>
              {churnRiskClients.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
              sessioni: -2sett / -1sett / questa sett
            </span>
          </div>
          <div className="space-y-1.5">
            {churnRiskClients.map(({ client, w2, w1, w0, risk }) => {
              const riskColor = risk === "critico" ? "#ef4444" : risk === "alto" ? "#f97316" : "#fbbf24";
              const riskLabel = risk === "critico" ? "Critico" : risk === "alto" ? "Alto" : "Medio";
              const maxW = Math.max(w2, w1, 1);
              return (
                <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(249,115,22,0.04)" }}>
                  <Link href={`/dashboard/clienti/${client.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c" }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold truncate group-hover:underline flex-1"
                      style={{ color: "var(--text)" }}>{client.name}</p>
                    <div className="flex items-end gap-1 flex-shrink-0 mr-1" style={{ height: 20 }}>
                      {[w2, w1, w0].map((v, i) => (
                        <div key={i} className="w-3 rounded-sm"
                          style={{
                            height: Math.max(3, Math.round((v / maxW) * 18)),
                            background: i === 2 ? riskColor : i === 1 ? "rgba(249,115,22,0.4)" : "rgba(249,115,22,0.2)",
                            opacity: v === 0 && i === 2 ? 0.3 : 1,
                          }} />
                      ))}
                    </div>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                      {w2}→{w1}→{w0}
                    </span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${riskColor}18`, color: riskColor }}>{riskLabel}</span>
                  </Link>
                  {client.phone && (
                    <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao ${client.name.split(" ")[0]}, come stai? Noto che questa settimana non hai ancora allenato — tutto bene?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                      <MessageCircle size={11} />
                      WA
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Aderenza al Piano ───────────────────────────────────────────── */}
      {weeklyAdherence.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.18)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <BarChart2 size={14} style={{ color: "#2dd4bf" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Aderenza al Piano
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf" }}>
              {weeklyAdherence.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
              sessioni reali vs obiettivo · 4 settimane
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {weeklyAdherence.map(({ client, target, weeks, thisWeek }) => {
              const ratio = target > 0 ? thisWeek / target : 0;
              const barColor = ratio >= 1 ? "#22c55e" : ratio >= 0.5 ? "#fbbf24" : "#f87171";
              return (
                <Link key={client.id} href={`/dashboard/clienti/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(20,184,166,0.1)", color: "#2dd4bf" }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--ivory)" }}>{client.name}</p>
                    <div className="flex items-end gap-0.5 mt-1.5" style={{ height: 14 }}>
                      {weeks.map((v, i) => {
                        const isLast = i === 3;
                        const h = Math.max(3, Math.round(Math.min(v / Math.max(target, 1), 1.1) * 12));
                        const clr = v >= target ? "#22c55e" : v > 0 ? "#fbbf24" : "#ef4444";
                        return (
                          <div key={i} className="w-4 rounded-sm"
                            style={{
                              height: h,
                              background: isLast ? clr : `${clr}55`,
                              transition: "height 0.3s ease",
                            }} />
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: barColor }}>{thisWeek}/{target}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>questa sett.</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Highlights della settimana ──────────────────────────────────── */}
      {weekHighlights.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} style={{ color: "#fbbf24" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
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
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text)" }}>{h.clientName}</p>
                  <p className="text-xs truncate">
                    <span className="font-semibold" style={{ color: h.type === "pr" ? "#fbbf24" : "#34d399" }}>{h.label}</span>
                    <span style={{ color: "var(--text-muted)" }}>{" · "}{h.detail}</span>
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
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
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
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {client.name}
                    <span className="ml-1.5 text-xs font-normal" style={{ color: "rgba(192,132,252,0.65)" }}>
                      {turnsAge} anni
                    </span>
                  </p>
                  <p className="text-xs font-medium" style={{ color: daysUntil === 0 ? "#c084fc" : "var(--text-muted)" }}>
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

      {/* ── Anniversari del percorso ────────────────────────────────────── */}
      {anniversaryAlerts.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(236,72,153,0.05)", border: "1px solid rgba(236,72,153,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={14} style={{ color: "#f472b6" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Anniversari del percorso
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1 font-bold"
              style={{ background: "rgba(236,72,153,0.18)", color: "#f472b6" }}>
              {anniversaryAlerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {anniversaryAlerts.map(({ client, label, daysUntil }, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: daysUntil === 0 ? "rgba(236,72,153,0.1)" : "rgba(236,72,153,0.04)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(236,72,153,0.15)", color: "#f472b6" }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {client.name}
                  </p>
                  <p className="text-xs font-medium" style={{ color: daysUntil === 0 ? "#f472b6" : "var(--text-muted)" }}>
                    {daysUntil === 0 ? `Oggi — ${label}!` : daysUntil === 1 ? `Domani — ${label}` : `Tra ${daysUntil} giorni — ${label}`}
                  </p>
                </div>
                {client.phone && (
                  <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao ${client.name.split(" ")[0]}! Oggi festeggiamo ${label} di percorso insieme — sono fiero dei tuoi progressi. Continua così!`)}`}
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
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Stallo peso corporeo
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}>
              {measurementPlateauAlerts.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
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
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{s.client.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
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

      {/* ── Rinnovi Imminenti ───────────────────────────────────────────── */}
      {renewalAlerts.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.18)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CreditCard size={14} style={{ color: "#4ade80" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Rinnovi Imminenti
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(34,197,94,0.18)", color: "#4ade80" }}>
              {renewalAlerts.length}
            </span>
            <span className="text-xs ml-auto font-medium" style={{ color: "rgba(74,222,128,0.6)" }}>
              +€{renewalAlerts.reduce((s, r) => s + r.fee, 0).toLocaleString("it-IT")} in arrivo
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {renewalAlerts.map(({ client, daysUntil, fee }) => {
              const urgency = daysUntil === 0 ? "#f87171" : daysUntil <= 2 ? "#fbbf24" : "#4ade80";
              const label = daysUntil === 0 ? "Oggi" : daysUntil === 1 ? "Domani" : `Tra ${daysUntil}gg`;
              return (
                <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(34,197,94,0.05)" }}>
                  <Link href={`/dashboard/clienti/${client.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:underline" style={{ color: "var(--text)" }}>{client.name}</p>
                      <p className="text-xs font-medium" style={{ color: urgency }}>{label}</p>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: "#4ade80" }}>€{fee}/m</span>
                  </Link>
                  {client.phone && (
                    <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao ${client.name.split(" ")[0]}! Ti ricordo che il tuo abbonamento mensile (€${fee}) si rinnova ${daysUntil === 0 ? "oggi" : daysUntil === 1 ? "domani" : `tra ${daysUntil} giorni`}. Fammi sapere!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 flex-shrink-0"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                      <MessageCircle size={11} />
                      WA
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rendimento per Sessione ────────────────────────────────────── */}
      {revenueEfficiency.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Euro size={14} style={{ color: "#fbbf24" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Rendimento per Sessione
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
              {revenueEfficiency.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
              €/sessione · ultimi 30 giorni
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {revenueEfficiency.map(({ client, trainingDays, perSession, fee }) => {
              const efficiency = perSession ?? 0;
              const color = efficiency >= 25 ? "#22c55e" : efficiency >= 12 ? "#fbbf24" : "#f87171";
              const label = efficiency >= 25 ? "Premium" : efficiency >= 12 ? "Standard" : "Sotto media";
              return (
                <Link key={client.id} href={`/dashboard/clienti/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${color}18`, color }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      €{fee}/mese · {trainingDays} sessioni
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color }}>€{efficiency}</p>
                    <p className="text-xs" style={{ color: `${color}99` }}>{label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Traiettoria Fase ────────────────────────────────────────────── */}
      {phaseTrajectoryAlerts.length > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.18)" }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Target size={14} style={{ color: "#38bdf8" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Traiettoria Fase
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}>
              {phaseTrajectoryAlerts.length}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
              peso reale vs obiettivo fase
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {phaseTrajectoryAlerts.map(({ client, phase, currentWeight, daysRemaining, requiredPerWeek, actualPerWeek, status }) => {
              const statusColor = status === "ottimo" ? "#22c55e" : status === "in_linea" ? "#38bdf8" : "#f87171";
              const statusLabel = status === "ottimo" ? "In anticipo" : status === "in_linea" ? "In linea" : "In ritardo";
              const phaseLabel = phase.type === "bulk" ? "Massa" : phase.type === "cut" ? "Cut" : phase.name;
              const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}kg/sett`;
              return (
                <Link key={client.id} href={`/dashboard/clienti/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${statusColor}18`, color: statusColor }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                        style={{ background: `${statusColor}18`, color: statusColor }}>{statusLabel}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                      {phaseLabel} · {currentWeight}kg → {phase.targetWeight}kg · {daysRemaining}gg rimasti
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: statusColor }}>{fmt(actualPerWeek)}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>serve {fmt(requiredPerWeek)}</p>
                  </div>
                </Link>
              );
            })}
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
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Inizia in 4 passi</h2>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
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
                      color: done ? "var(--text-muted)" : "var(--ivory)",
                      textDecoration: done ? "line-through" : "none",
                    }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>{desc}</p>
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
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Clienti recenti</h2>
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
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
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
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>Azioni rapide</h2>
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
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>{desc}</p>
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
