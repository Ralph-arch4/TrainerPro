"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  Users, Activity, TrendingUp, UtensilsCrossed, Plus, ArrowRight,
  Crown, CheckCircle2, Circle, Dumbbell, Share2, ClipboardList,
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

  const plan       = user?.plan ?? "free";
  const firstName  = user?.name?.split(" ")[0] ?? "Trainer";

  const { activeClients, totalWorkoutPlans, totalDietPlans, totalPhases, totalMeasurements } = useMemo(() => ({
    activeClients:     clients.filter((c) => c.status === "attivo").length,
    totalWorkoutPlans: clients.reduce((acc, c) => acc + c.workoutPlans.length, 0),
    totalDietPlans:    clients.reduce((acc, c) => acc + c.dietPlans.length, 0),
    totalPhases:       clients.reduce((acc, c) => acc + c.phases.length, 0),
    totalMeasurements: clients.reduce((acc, c) => acc + c.measurements.length, 0),
  }), [clients]);

  const recentClients = useMemo(
    () => [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [clients]
  );

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

  const stats = [
    { label: "Clienti totali",  value: clients.length,      icon: Users,           color: "#FF6B2B" },
    { label: "Clienti attivi",  value: activeClients,        icon: Activity,        color: "#FF9A6C" },
    { label: "Schede create",   value: totalWorkoutPlans,    icon: Dumbbell,        color: "#CC5522" },
    { label: "Piani alimentari",value: totalDietPlans,       icon: UtensilsCrossed, color: "rgba(255,154,108,0.85)" },
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

      {/* ── Plan usage ─────────────────────────────────────────────────────── */}
      <div className="card-luxury rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown size={15} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>
              Piano {PLAN_LIMITS[plan].label}
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--accent-light)" }}>
            {clients.length} / {PLAN_LIMITS[plan].clients === 999999 ? "∞" : PLAN_LIMITS[plan].clients} clienti
          </span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-1.5 rounded-full transition-all" style={{
            background: "linear-gradient(90deg, var(--accent), var(--accent-dark))",
            width: PLAN_LIMITS[plan].clients === 999999
              ? "8%"
              : `${Math.min((clients.length / PLAN_LIMITS[plan].clients) * 100, 100)}%`,
          }} />
        </div>
        {plan !== "fitness_master" && (
          <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.38)" }}>
            {plan === "free"
              ? <>Vuoi gestire più clienti? <span className="underline cursor-pointer" style={{ color: "var(--accent-light)" }}>Passa a Personal Coach</span></>
              : <>Vuoi clienti illimitati? <span className="underline cursor-pointer" style={{ color: "var(--accent-light)" }}>Passa a Fitness Master</span></>}
          </p>
        )}
      </div>

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
