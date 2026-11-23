"use client";
import { useState } from "react";
import AdminShell, { AdminGate, adminPost, fmtDateTime, useAdminData } from "@/components/admin/AdminShell";

interface Lead { id: string; name: string; email: string; phone: string | null; clients: string | number | null; message: string | null; handled: boolean; createdAt: string }

// Requests from the public "contact sales" form on the homepage.
export default function AdminLeadsPage() {
  const { gate, data, setData, reload } = useAdminData<{ leads: Lead[]; missing?: boolean }>("/api/admin/leads");
  const [showHandled, setShowHandled] = useState(false);
  const [error, setError] = useState("");
  if (gate !== "ok" || !data) return <AdminGate gate={gate} />;

  async function toggle(l: Lead) {
    setError("");
    const res = await adminPost("/api/admin/leads", { id: l.id, handled: !l.handled });
    if (!res.ok) return setError("Operazione non riuscita. Riprova.");
    setData((d) => d && { ...d, leads: d.leads.map((x) => x.id === l.id ? { ...x, handled: !l.handled } : x) });
  }

  const open = data.leads.filter((l) => !l.handled).length;
  const rows = data.leads.filter((l) => showHandled || !l.handled);
  return (
    <AdminShell title="Contatti" subtitle={`${open} da gestire, dal modulo pubblico del sito.`} onRefresh={() => void reload()}>
      {data.missing ? (
        <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24" }}>Il modulo contatti non è ancora attivo (migrazione 027).</p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" checked={showHandled} onChange={(e) => setShowHandled(e.target.checked)} /> Mostra anche quelli gestiti
          </label>
          {error && <p role="status" className="text-sm mb-3" style={{ color: "#f87171" }}>{error}</p>}
          {rows.length === 0 ? (
            <p className="text-sm text-center py-16 rounded-2xl" style={{ color: "var(--text-dim)", border: "1px dashed var(--border)" }}>Nessun contatto da gestire.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((l) => (
                <div key={l.id} className="card-luxury rounded-2xl p-4 flex flex-wrap gap-3 items-start" style={{ opacity: l.handled ? 0.6 : 1 }}>
                  <div className="flex-1 min-w-[14rem]">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{l.name || "Senza nome"}</p>
                    <p className="text-xs break-all" style={{ color: "var(--text-muted)" }}>
                      <a href={`mailto:${l.email}`} className="underline">{l.email}</a>{l.phone && <> · <a href={`tel:${l.phone}`} className="underline">{l.phone}</a></>}
                      {l.clients !== null && l.clients !== "" && <> · {l.clients} clienti</>}
                    </p>
                    {l.message && <p className="text-sm mt-2 whitespace-pre-wrap break-words" style={{ color: "var(--text)" }}>{l.message}</p>}
                    <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{fmtDateTime(l.createdAt)}</p>
                  </div>
                  <button onClick={() => void toggle(l)} className={l.handled ? "outline-btn px-3 py-2 rounded-xl text-xs" : "accent-btn px-3 py-2 rounded-xl text-xs"}>
                    {l.handled ? "Riapri" : "Segna come gestito"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
