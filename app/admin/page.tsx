"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import AdminShell, { AdminGate, PlanBadge, StatusBadge, fmtDate, useAdminData } from "@/components/admin/AdminShell";

interface TrainerRow {
  id: string; name: string; email: string; createdAt: string | null; lastSignInAt: string | null;
  plan: string; premiumStatus: string; trialEndsAt: string | null;
  accountStatus: "active" | "suspended" | "banned"; statusReason: string | null; paidUntil: string | null; clients: number;
}
type Filter = "all" | "active" | "suspended" | "banned" | "premium" | "demo" | "expired" | "pending";

const FILTERS: Array<[Filter, string]> = [
  ["all", "Tutti"], ["active", "Attivi"], ["suspended", "Sospesi"], ["banned", "Bannati"],
  ["premium", "Premium"], ["demo", "Demo / prova"], ["expired", "Prova scaduta"], ["pending", "Richiesta Premium"],
];

const isPremium = (t: TrainerRow) => t.plan !== "free";
const trialExpired = (t: TrainerRow) => !isPremium(t) && !!t.trialEndsAt && Date.parse(t.trialEndsAt) < Date.now();
const paymentOverdue = (t: TrainerRow) => isPremium(t) && !!t.paidUntil && Date.parse(t.paidUntil) + 86_400_000 < Date.now();

function matches(t: TrainerRow, f: Filter) {
  switch (f) {
    case "all": return true;
    case "active": return t.accountStatus === "active";
    case "suspended": return t.accountStatus === "suspended";
    case "banned": return t.accountStatus === "banned";
    case "premium": return isPremium(t);
    case "demo": return !isPremium(t);
    case "expired": return trialExpired(t);
    case "pending": return !isPremium(t) && t.premiumStatus === "pending";
  }
}

export default function AdminHomePage() {
  const { gate, data, reload } = useAdminData<{ trainers: TrainerRow[] }>("/api/admin/trainers");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const trainers = useMemo(() => data?.trainers ?? [], [data]);
  const stats = useMemo(() => ({
    total: trainers.length,
    premium: trainers.filter(isPremium).length,
    suspended: trainers.filter((t) => t.accountStatus === "suspended").length,
    banned: trainers.filter((t) => t.accountStatus === "banned").length,
    clients: trainers.reduce((s, t) => s + t.clients, 0),
    overdue: trainers.filter(paymentOverdue).length,
    pending: trainers.filter((t) => matches(t, "pending")).length,
  }), [trainers]);

  if (gate !== "ok") return <AdminGate gate={gate} />;

  const q = query.trim().toLowerCase();
  const rows = trainers
    .filter((t) => matches(t, filter))
    .filter((t) => !q || t.email.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const tiles: Array<[string, number, Filter | null]> = [
    ["Trainer", stats.total, "all"], ["Premium", stats.premium, "premium"], ["Clienti totali", stats.clients, null],
    ["Sospesi", stats.suspended, "suspended"], ["Bannati", stats.banned, "banned"], ["Richieste Premium", stats.pending, "pending"],
  ];

  return (
    <AdminShell title="Personal trainer" subtitle="Abbonamenti, clienti e moderazione di ogni account." onRefresh={() => void reload()}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {tiles.map(([label, value, f]) => (
          <button key={label} onClick={() => f && setFilter(f)} disabled={!f}
            className="card-luxury rounded-2xl p-3 text-left disabled:cursor-default">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{value}</p>
          </button>
        ))}
      </div>

      {stats.overdue > 0 && (
        <p className="text-sm mb-4 px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24" }}>
          {stats.overdue} {stats.overdue === 1 ? "trainer Premium ha " : "trainer Premium hanno "} la data &quot;pagato fino al&quot; superata. Controlla e sospendi se il pagamento non è arrivato.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className="px-3 py-2 rounded-xl text-sm"
            style={{
              background: filter === key ? "rgba(201,168,76,0.14)" : "var(--surface-sm)",
              border: `1px solid ${filter === key ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
              color: filter === key ? "var(--accent-light)" : "var(--text-muted)",
            }}>
            {label} ({trainers.filter((t) => matches(t, key)).length})
          </button>
        ))}
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per email o nome" aria-label="Cerca trainer"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none" style={{ background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text)" }} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-center py-16 rounded-2xl" style={{ color: "var(--text-dim)", border: "1px dashed var(--border)" }}>Nessun trainer in questo elenco.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <Link key={t.id} href={`/admin/trainer/${t.id}`} data-testid="admin-trainer-row"
              className="card-luxury rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[14rem]">
                <p className="text-sm font-semibold break-all" style={{ color: "var(--text)" }}>{t.name || "Senza nome"}</p>
                <p className="text-xs break-all" style={{ color: "var(--text-muted)" }}>{t.email || t.id}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                  {t.clients} {t.clients === 1 ? "cliente" : "clienti"} · iscritto il {fmtDate(t.createdAt)} · ultimo accesso {fmtDate(t.lastSignInAt)}
                  {isPremium(t) && t.paidUntil && <> · pagato fino al {fmtDate(t.paidUntil)}</>}
                  {!isPremium(t) && t.trialEndsAt && <> · prova fino al {fmtDate(t.trialEndsAt)}</>}
                </p>
              </div>
              <PlanBadge plan={t.plan} trialEndsAt={t.trialEndsAt} />
              <StatusBadge status={t.accountStatus} />
              <ChevronRight size={16} style={{ color: "var(--text-dim)" }} />
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
