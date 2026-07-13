"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import {
  Dumbbell, LayoutDashboard, Users, Activity, UtensilsCrossed,
  TrendingUp, Calculator, FileDown, LogOut, Menu, X, ClipboardList, MessageSquare,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

function nameHash(name: string): number[] {
  const h: number[] = [];
  for (let i = 0; i < name.length; i++) h.push(name.charCodeAt(i));
  while (h.length < 8) h.push(h.reduce((a, b) => a + b, 42) % 256);
  return h;
}

function TrainerMonogram({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "PT";
  const h = nameHash(name);
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 1.5;
  const innerR = size / 2 - 7;
  const variant = h[0] % 3;
  const spokeCount = 4 + (h[1] % 3);
  const uid = name.split("").reduce((a, c) => ((a * 31 + c.charCodeAt(0)) | 0), 7);
  const gradId = `tmg${Math.abs(uid).toString(36)}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        boxShadow: "0 0 12px rgba(201,168,76,0.35), 0 0 4px rgba(201,168,76,0.2)",
        pointerEvents: "none",
      }} />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.22)" />
            <stop offset="100%" stopColor="rgba(12,8,4,0.95)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={outerR} fill={`url(#${gradId})`} stroke="rgba(201,168,76,0.45)" strokeWidth="0.9" />
        {variant === 0 && Array.from({ length: spokeCount }, (_, i) => {
          const a = (i / spokeCount) * Math.PI * 2 - Math.PI / 2;
          return <line key={i} x1={cx + Math.cos(a) * innerR} y1={cy + Math.sin(a) * innerR}
            x2={cx + Math.cos(a) * (outerR - 2)} y2={cy + Math.sin(a) * (outerR - 2)}
            stroke="rgba(201,168,76,0.18)" strokeWidth="0.7" />;
        })}
        {variant === 1 && [0, 90, 180, 270].map(a => {
          const r = (a * Math.PI) / 180;
          return <circle key={a} cx={cx + Math.cos(r) * (outerR - 4)} cy={cy + Math.sin(r) * (outerR - 4)} r="1.2" fill="rgba(201,168,76,0.3)" />;
        })}
        {variant === 2 && (
          <rect x={cx - innerR * 0.7} y={cy - innerR * 0.7} width={innerR * 1.4} height={innerR * 1.4}
            rx="2" fill="none" stroke="rgba(201,168,76,0.18)" strokeWidth="0.7" transform={`rotate(45 ${cx} ${cy})`} />
        )}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="rgba(8,5,2,0.7)" />
        <text x={cx} y={cy + (initials.length > 1 ? 4.5 : 5)} textAnchor="middle"
          fontSize={initials.length > 1 ? 10 : 12} fontWeight="900"
          fontFamily="Georgia,'Times New Roman',serif" fontStyle="italic"
          fill="rgba(201,168,76,0.9)"
          style={{ filter: "drop-shadow(0 0 3px rgba(201,168,76,0.45))" }}>
          {initials}
        </text>
      </svg>
    </div>
  );
}

const navItems = [
  { href: "/dashboard",                 icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/clienti",         icon: Users,           label: "Clienti" },
  { href: "/dashboard/intake",          icon: ClipboardList,   label: "Form Intake" },
  { href: "/dashboard/fasi",            icon: Activity,        label: "Fasi & Piani" },
  { href: "/dashboard/diete",           icon: UtensilsCrossed, label: "Diete" },
  { href: "/dashboard/misurazioni",     icon: TrendingUp,      label: "Misurazioni" },
  { href: "/dashboard/preventivi",      icon: Calculator,      label: "Preventivi" },
  { href: "/dashboard/export",          icon: FileDown,        label: "Esporta PDF" },
  { href: "/dashboard/talk-with-ralph", icon: MessageSquare,   label: "Talk with Ralph" },
];

export default function AppNav() {
  const pathname    = usePathname();
  const router      = useRouter();
  const user        = useAppStore((s) => s.user);
  const clientCount = useAppStore((s) => s.clients.length);
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().clearUser();
    router.push("/login");
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl accent-btn flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} />
          </div>
          <span className="font-bold text-lg accent-text">REC Studio</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: active ? "rgba(201,168,76,0.12)" : "transparent",
                color: active ? "var(--accent-light)" : "var(--text-muted)",
                fontWeight: active ? "600" : "400",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: trainer identity */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <div className="rounded-xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, rgba(18,12,4,0.96), rgba(28,18,6,0.88))", border: "1px solid rgba(201,168,76,0.18)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
          <div className="relative flex items-center gap-2.5 px-3 py-2.5">
            <TrainerMonogram name={user?.name ?? "Trainer"} size={38} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate leading-tight"
                style={{ color: "var(--text)", fontFamily: "Georgia,'Times New Roman',serif", fontStyle: "italic" }}>
                {user?.name ?? "Trainer"}
              </p>
              <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-[0.14em]"
                style={{ color: "rgba(201,168,76,0.5)" }}>
                {clientCount} {clientCount === 1 ? "cliente" : "clienti"}
              </p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg transition-all flex-shrink-0"
              style={{ color: "var(--text-dim)" }} title="Esci">
              <LogOut size={13} />
            </button>
          </div>
          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.22), transparent)" }} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 glass-dark"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 3.5rem)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-2">
          <Dumbbell size={20} style={{ color: "var(--accent)" }} />
          <span className="font-bold accent-text">REC Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle size={15} />
          <button onClick={() => setOpen(!open)} className="p-2 rounded-xl" style={{ background: "var(--surface-md)" }}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden print:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
          <div className="absolute left-0 top-0 bottom-0 w-64 glass-dark" onClick={(e) => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex print:hidden flex-col fixed left-0 top-0 bottom-0 w-60 glass-dark z-30">
        <NavContent />
      </aside>
    </>
  );
}
