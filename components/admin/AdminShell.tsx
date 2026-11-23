"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export type Gate = "loading" | "ok" | "login" | "forbidden" | "error";

// Loads an /api/admin endpoint and maps auth failures to a gate state.
// Access is decided by the server (SUPERUSER_EMAILS): pages only render what it returns.
export function useAdminData<T>(url: string) {
  const [gate, setGate] = useState<Gate>("loading");
  const [data, setData] = useState<T | null>(null);
  const apply = useCallback((r: { gate: Gate; data?: T }) => {
    if (r.data !== undefined) setData(r.data);
    setGate(r.gate);
  }, []);
  const reload = useCallback(async () => apply(await fetchAdmin<T>(url)), [url, apply]);
  useEffect(() => {
    let alive = true;
    fetchAdmin<T>(url).then((r) => { if (alive) apply(r); });
    return () => { alive = false; };
  }, [url, apply]);
  return { gate, data, setData, reload };
}

async function fetchAdmin<T>(url: string): Promise<{ gate: Gate; data?: T }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) return { gate: "login" };
    if (res.status === 403) return { gate: "forbidden" };
    if (!res.ok) return { gate: "error" };
    return { gate: "ok", data: (await res.json()) as T };
  } catch { return { gate: "error" }; }
}

export const isPast = (d: string | null | undefined) => !!d && Date.parse(d) < Date.now();

export async function adminPost(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: json.error };
  } catch { return { ok: false, error: "network" }; }
}

export const ERROR_TEXT: Record<string, string> = {
  migration_missing: "Serve la migrazione del database 028 (e 027). Applicala in Supabase e riprova.",
  self_action: "Non puoi applicare questa azione al tuo account amministratore.",
  ban_failed: "Ban non riuscito su Supabase Auth. Riprova.",
  not_found: "Account non trovato.",
};

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const NAV: Array<[string, string]> = [
  ["/admin", "Trainer"],
  ["/admin/premium", "Richieste Premium"],
  ["/admin/contatti", "Contatti"],
  ["/admin/registro", "Registro azioni"],
  ["/admin/feedback", "Feedback"],
];

export function AdminGate({ gate }: { gate: Gate }) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        {gate === "loading" ? <Loader2 size={28} className="animate-spin mx-auto" style={{ color: "var(--accent)" }} /> : (
          <>
            <ShieldAlert size={34} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {gate === "login" ? "Accedi con l'account amministratore per aprire il pannello."
                : gate === "forbidden" ? "Questo account non è autorizzato ad accedere al pannello amministratore."
                : "Pannello non disponibile. Controlla la configurazione del server e riprova."}
            </p>
            <Link href={gate === "login" ? "/login" : "/dashboard"} className="accent-btn inline-block px-5 py-2.5 rounded-xl text-sm">
              {gate === "login" ? "Vai al login" : "Torna alla dashboard"}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminShell({ title, subtitle, onRefresh, children }: {
  title: string; subtitle?: string; onRefresh?: () => void; children: ReactNode;
}) {
  const path = usePathname();
  return (
    <main className="min-h-dvh p-4 lg:p-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <ShieldCheck size={13} /> Amministratore
            </p>
            <h1 className="text-2xl font-bold break-words" style={{ color: "var(--text)" }}>{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRefresh && (
              <button onClick={onRefresh} aria-label="Aggiorna" className="p-2.5 rounded-xl" style={{ background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <RefreshCw size={15} />
              </button>
            )}
            <ThemeToggle size={15} />
          </div>
        </div>
        <nav className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {NAV.map(([href, label]) => {
            const active = href === "/admin" ? path === "/admin" || path.startsWith("/admin/trainer") : path.startsWith(href);
            return (
              <Link key={href} href={href} className="px-3 py-2 rounded-xl text-sm whitespace-nowrap"
                style={{
                  background: active ? "rgba(201,168,76,0.14)" : "var(--surface-sm)",
                  border: `1px solid ${active ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                  color: active ? "var(--accent-light)" : "var(--text-muted)",
                }}>
                {label}
              </Link>
            );
          })}
          <Link href="/dashboard" className="px-3 py-2 rounded-xl text-sm whitespace-nowrap ml-auto" style={{ color: "var(--text-dim)" }}>Esci dal pannello</Link>
        </nav>
        {children}
      </div>
    </main>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status === "banned" ? { label: "Bannato", bg: "rgba(239,68,68,0.14)", color: "#f87171" }
    : status === "suspended" ? { label: "Sospeso", bg: "rgba(251,191,36,0.14)", color: "#fbbf24" }
    : { label: "Attivo", bg: "rgba(34,197,94,0.12)", color: "#22c55e" };
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

export function PlanBadge({ plan, trialEndsAt }: { plan: string; trialEndsAt?: string | null }) {
  const premium = plan !== "free";
  const expired = !premium && isPast(trialEndsAt);
  const s = premium ? { label: "Premium", bg: "rgba(201,168,76,0.14)", color: "var(--accent-light)" }
    : expired ? { label: "Prova scaduta", bg: "rgba(239,68,68,0.10)", color: "#f87171" }
    : { label: trialEndsAt ? "In prova" : "Demo", bg: "var(--surface-md)", color: "var(--text-muted)" };
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}
