"use client";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { Users, Activity, TrendingUp, UtensilsCrossed, Plus, ArrowRight, Crown, CheckCircle2, Circle, Dumbbell, Share2 } from "lucide-react";

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const clients = useAppStore((s) => s.clients);

  const plan = user?.plan ?? "free";
  const activeClients = clients.filter((c) => c.status === "attivo").length;
  const pausedClients = clients.filter((c) => c.status === "in_pausa").length;
  const totalPhases = clients.reduce((acc, c) => acc + c.phases.length, 0);
  const totalMeasurements = clients.reduce((acc, c) => acc + c.measurements.length, 0);
  const recentClients = [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

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

  return (
    <div className="p-6 lg:p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--ivory)" }}>
          Ciao, <span className="accent-text">{user?.name?.split(" ")[0] ?? "Trainer"}</span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.5)" }}>
          Ecco il riepilogo della tua attività
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Clienti totali", value: clients.length, icon: Users, color: "var(--accent)" },
          { label: "Clienti attivi", value: activeClients, icon: Users, color: "#22c55e" },
          { label: "Fasi attive", value: totalPhases, icon: Activity, color: "#818cf8" },
          { label: "Misurazioni", value: totalMeasurements, icon: TrendingUp, color: "#38bdf8" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-luxury rounded-2xl p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>{label}</p>
                <p className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--ivory)" }}>{value}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={17} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan usage */}
      <div className="card-luxury rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>Piano {PLAN_LIMITS[plan].label}</span>
          </div>
          <span className="text-xs" style={{ color: "var(--accent-light)" }}>
            {clients.length} / {PLAN_LIMITS[plan].clients === 999999 ? "∞" : PLAN_LIMITS[plan].clients} clienti
          </span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-2 rounded-full transition-all" style={{
            background: "linear-gradient(90deg, var(--accent), var(--accent-dark))",
            width: PLAN_LIMITS[plan].clients === 999999 ? "10%" : `${Math.min((clients.length / PLAN_LIMITS[plan].clients) * 100, 100)}%`
          }} />
        </div>
        {plan === "free" && (
          <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.4)" }}>
            Vuoi gestire più clienti?{" "}
            <span className="underline cursor-pointer" style={{ color: "var(--accent-light)" }}>Esegui l&apos;upgrade a Personal Coach</span>
          </p>
        )}
      </div>

      {clients.length === 0 ? (
        /* ── Onboarding state ── */
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-luxury rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,43,0.1)" }}>
                <Plus size={20} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Inizia in 4 passi</h2>
                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Configura il tuo studio in pochi minuti</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: Users, label: "Aggiungi il tuo primo cliente", desc: "Nome, obiettivo, livello e dati personali", href: "/dashboard/clienti", done: false },
                { icon: Dumbbell, label: "Crea una scheda di allenamento", desc: "Organizza gli esercizi per giorno", href: "/dashboard/clienti", done: false },
                { icon: Activity, label: "Imposta una fase", desc: "Bulk, Cut o Mantenimento con calorie target", href: "/dashboard/fasi", done: false },
                { icon: Share2, label: "Condividi il link col cliente", desc: "Il cliente compila i progressi ogni settimana", href: "/dashboard/clienti", done: false },
              ].map(({ icon: Icon, label, desc, href, done }, i) => (
                <Link key={i} href={href}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-white/5 group">
                  <div className="flex-shrink-0">
                    {done
                      ? <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
                      : <Circle size={20} style={{ color: "rgba(255,107,43,0.35)" }} />
                    }
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,107,43,0.08)" }}>
                    <Icon size={15} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--ivory)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{desc}</p>
                  </div>
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-60 transition-all flex-shrink-0" style={{ color: "var(--accent-light)" }} />
                </Link>
              ))}
            </div>
            <Link href="/dashboard/clienti" className="accent-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm mt-5">
              <Plus size={15} /> Aggiungi il tuo primo cliente
            </Link>
          </div>

          {/* Quick actions */}
          <div className="card-luxury rounded-2xl p-5">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ivory)" }}>Azioni rapide</h2>
            <div className="space-y-2">
              {[
                { href: "/dashboard/clienti", icon: Users, label: "Aggiungi nuovo cliente", desc: "Registra un nuovo cliente" },
                { href: "/dashboard/fasi", icon: Activity, label: "Crea una fase", desc: "Bulk, cut o mantenimento" },
                { href: "/dashboard/diete", icon: UtensilsCrossed, label: "Piano alimentare", desc: "Calcola macro e calorie" },
                { href: "/dashboard/misurazioni", icon: TrendingUp, label: "Registra misurazioni", desc: "Traccia i progressi" },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: "rgba(255,107,43,0.1)" }}>
                    <Icon size={16} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--ivory)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{desc}</p>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: "var(--accent-light)" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Normal state (has clients) ── */
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent clients */}
          <div className="card-luxury rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--ivory)" }}>Clienti recenti</h2>
              <Link href="/dashboard/clienti" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--accent-light)" }}>
                Vedi tutti <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
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
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[client.status] }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card-luxury rounded-2xl p-5">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ivory)" }}>Azioni rapide</h2>
            <div className="space-y-2">
              {[
                { href: "/dashboard/clienti", icon: Users, label: "Aggiungi nuovo cliente", desc: "Registra un nuovo cliente" },
                { href: "/dashboard/fasi", icon: Activity, label: "Crea una fase", desc: "Bulk, cut o mantenimento" },
                { href: "/dashboard/diete", icon: UtensilsCrossed, label: "Piano alimentare", desc: "Calcola macro e calorie" },
                { href: "/dashboard/misurazioni", icon: TrendingUp, label: "Registra misurazioni", desc: "Traccia i progressi" },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: "rgba(255,107,43,0.1)" }}>
                    <Icon size={16} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--ivory)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{desc}</p>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: "var(--accent-light)" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
