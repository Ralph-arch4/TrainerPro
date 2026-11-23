"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import AdminShell, { AdminGate, type Gate } from "@/components/admin/AdminShell";

interface Trainer {
  id: string; name: string; email: string; createdAt: string | null;
  plan: string; premiumStatus: string; requestedAt: string | null; decidedAt: string | null; clients: number;
}
type Filter = "pending" | "premium" | "free" | "all";

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Super-user console. Access is decided by the server (SUPERUSER_EMAILS):
// this page only renders what /api/admin/premium returns.
export default function AdminPremiumPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/premium", { cache: "no-store" });
      if (res.status === 401) return setGate("login");
      if (res.status === 403) return setGate("forbidden");
      if (!res.ok) return setGate("error");
      const json = await res.json();
      setTrainers(json.trainers ?? []);
      setGate("ok");
    } catch { setGate("error"); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function act(t: Trainer, action: "approve" | "reject" | "revoke") {
    const question = action === "approve" ? `Attivare Premium per ${t.email}?`
      : action === "revoke" ? `Riportare ${t.email} alla demo? I suoi dati restano conservati.`
      : `Rifiutare la richiesta di ${t.email}?`;
    if (!confirm(question)) return;
    setBusy(t.id);
    setMessage("");
    try {
      const res = await fetch("/api/admin/premium", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: t.id, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      setTrainers((prev) => prev.map((x) => x.id === t.id ? { ...x, plan: json.plan, premiumStatus: json.premiumStatus, decidedAt: new Date().toISOString() } : x));
      setMessage(action === "approve" ? `Premium attivato per ${t.email}` : `${t.email} è ora sulla demo`);
    } catch {
      setMessage("Operazione non riuscita. Riprova.");
    } finally { setBusy(null); }
  }

  if (gate !== "ok") return <AdminGate gate={gate} />;

  const isPrem = (t: Trainer) => t.plan !== "free";
  const counts = {
    pending: trainers.filter((t) => t.premiumStatus === "pending" && !isPrem(t)).length,
    premium: trainers.filter(isPrem).length,
    free: trainers.filter((t) => !isPrem(t)).length,
    all: trainers.length,
  };
  const q = query.trim().toLowerCase();
  const rows = trainers
    .filter((t) => filter === "all" ? true : filter === "premium" ? isPrem(t) : filter === "free" ? !isPrem(t) : t.premiumStatus === "pending" && !isPrem(t))
    .filter((t) => !q || t.email.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
    .sort((a, b) => (b.requestedAt ?? b.createdAt ?? "").localeCompare(a.requestedAt ?? a.createdAt ?? ""));

  return (
    <AdminShell title="Richieste Premium" subtitle="Approva l'accesso Premium dopo aver verificato il pagamento." onRefresh={() => void load()}>
        <div className="flex flex-wrap gap-2 mb-4">
          {([["pending", "In attesa"], ["premium", "Premium"], ["free", "Demo"], ["all", "Tutti"]] as Array<[Filter, string]>).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: filter === key ? "rgba(201,168,76,0.14)" : "var(--surface-sm)",
                border: `1px solid ${filter === key ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                color: filter === key ? "var(--accent-light)" : "var(--text-muted)",
              }}>
              {label} ({counts[key]})
            </button>
          ))}
          <div className="relative flex-1 min-w-[12rem]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per email o nome" aria-label="Cerca trainer"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none" style={{ background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
        </div>

        {message && <p role="status" className="text-sm mb-3" style={{ color: "var(--accent-light)" }}>{message}</p>}

        {rows.length === 0 ? (
          <p className="text-sm text-center py-16 rounded-2xl" style={{ color: "var(--text-dim)", border: "1px dashed var(--border)" }}>
            {filter === "pending" ? "Nessuna richiesta in attesa." : "Nessun trainer in questo elenco."}
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((t) => (
              <div key={t.id} data-testid="trainer-row" className="card-luxury rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[14rem]">
                  <p className="text-sm font-semibold break-all" style={{ color: "var(--text)" }}>{t.email || t.id}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.name || "Senza nome"} · {t.clients} {t.clients === 1 ? "cliente" : "clienti"} · iscritto il {fmt(t.createdAt)}
                    {t.requestedAt && <> · richiesta del {fmt(t.requestedAt)}</>}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={isPrem(t)
                    ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                    : t.premiumStatus === "pending" ? { background: "rgba(201,168,76,0.14)", color: "var(--accent-light)" }
                    : { background: "var(--surface-md)", color: "var(--text-muted)" }}>
                  {isPrem(t) ? "Premium" : t.premiumStatus === "pending" ? "In attesa" : "Demo"}
                </span>
                <div className="flex gap-2">
                  {isPrem(t) ? (
                    <button onClick={() => act(t, "revoke")} disabled={busy === t.id} className="outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Revoca</button>
                  ) : (
                    <>
                      <button onClick={() => act(t, "approve")} disabled={busy === t.id} className="accent-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Approva Premium</button>
                      {t.premiumStatus === "pending" && (
                        <button onClick={() => act(t, "reject")} disabled={busy === t.id} className="outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Rifiuta</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminShell>
  );
}
