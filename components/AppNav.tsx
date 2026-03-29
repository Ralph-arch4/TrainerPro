"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  Dumbbell, LayoutDashboard, Users, Activity, UtensilsCrossed,
  TrendingUp, Calculator, FileDown, LogOut, Menu, X, Crown
} from "lucide-react";

const navItems = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/clienti",   icon: Users,           label: "Clienti" },
  { href: "/dashboard/fasi",      icon: Activity,        label: "Fasi & Piani" },
  { href: "/dashboard/diete",     icon: UtensilsCrossed, label: "Diete" },
  { href: "/dashboard/misurazioni", icon: TrendingUp,    label: "Misurazioni" },
  { href: "/dashboard/preventivi", icon: Calculator,     label: "Preventivi" },
  { href: "/dashboard/export",    icon: FileDown,        label: "Esporta PDF" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const clients = useAppStore((s) => s.clients);
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const plan = user?.plan ?? "free";
  const planLabel = PLAN_LIMITS[plan].label;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().clearUser();
    router.push("/login");
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl accent-btn flex items-center justify-center flex-shrink-0">
          <Dumbbell size={18} />
        </div>
        <span className="font-bold text-lg accent-text">TrainerPro</span>
      </div>

      {/* Client count badge */}
      <div className="px-5 mb-4">
        <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.15)" }}>
          <div className="flex justify-between items-center">
            <span style={{ color: "rgba(245,240,232,0.6)" }}>Clienti attivi</span>
            <span style={{ color: "var(--accent)" }} className="font-semibold">
              {clients.length} / {PLAN_LIMITS[plan].clients === 999999 ? "∞" : PLAN_LIMITS[plan].clients}
            </span>
          </div>
          <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-1 rounded-full" style={{
              background: "var(--accent)",
              width: PLAN_LIMITS[plan].clients === 999999 ? "20%" : `${Math.min((clients.length / PLAN_LIMITS[plan].clients) * 100, 100)}%`
            }} />
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: active ? "rgba(255,107,43,0.12)" : "transparent",
                color: active ? "var(--accent-light)" : "rgba(245,240,232,0.65)",
                fontWeight: active ? "600" : "400",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: plan + user */}
      <div className="px-3 pb-4 space-y-2">
        {plan !== "fitness_master" && (
          <button onClick={() => setShowUpgrade(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,107,43,0.08)", color: "var(--accent-light)", border: "1px solid rgba(255,107,43,0.2)" }}>
            <Crown size={15} />
            <span className="font-medium">Passa a {plan === "free" ? "Personal Coach" : "Fitness Master"}</span>
          </button>
        )}

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="w-8 h-8 rounded-full accent-btn flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? "T"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--ivory)" }}>{user?.name ?? "Trainer"}</p>
            <p className="text-xs truncate" style={{ color: "var(--accent)" }}>{planLabel}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg transition-all hover:bg-red-500/10" title="Esci">
            <LogOut size={14} style={{ color: "rgba(245,240,232,0.4)" }} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 glass-dark">
        <div className="flex items-center gap-2">
          <Dumbbell size={20} style={{ color: "var(--accent)" }} />
          <span className="font-bold accent-text">TrainerPro</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />
          <div className="absolute left-0 top-0 bottom-0 w-64 glass-dark" onClick={(e) => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 glass-dark z-30">
        <NavContent />
      </aside>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowUpgrade(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
          <div className="relative w-full max-w-sm glass-dark rounded-2xl p-8 text-center fade-in" onClick={(e) => e.stopPropagation()}>
            <Crown size={40} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Potenzia il tuo business</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(245,240,232,0.6)" }}>
              {plan === "free"
                ? "Con Personal Coach gestisci fino a 15 clienti per soli €29/mese."
                : "Fitness Master Customized: illimitato e personalizzato sul tuo modus operandi."}
            </p>
            <button className="accent-btn w-full py-3 rounded-xl text-sm" onClick={() => setShowUpgrade(false)}>
              Contattaci per l&apos;upgrade
            </button>
            <button onClick={() => setShowUpgrade(false)} className="mt-3 text-xs hover:underline" style={{ color: "rgba(245,240,232,0.4)" }}>
              Non ora
            </button>
          </div>
        </div>
      )}
    </>
  );
}
