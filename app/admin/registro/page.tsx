"use client";
import Link from "next/link";
import AdminShell, { AdminGate, fmtDate, fmtDateTime, useAdminData } from "@/components/admin/AdminShell";
import { ACTION_LABELS } from "@/lib/admin-actions";

interface Entry { id: string; action: string; adminEmail: string; targetUserId: string | null; details: Record<string, unknown> | null; createdAt: string }

export default function AdminAuditPage() {
  const { gate, data, reload } = useAdminData<{ entries: Entry[]; missing?: boolean }>("/api/admin/audit");
  if (gate !== "ok" || !data) return <AdminGate gate={gate} />;
  return (
    <AdminShell title="Registro azioni" subtitle="Ogni sospensione, ban e cambio di abbonamento fatto dal pannello." onRefresh={() => void reload()}>
      {data.missing ? (
        <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24" }}>Applica la migrazione 028 in Supabase per attivare il registro.</p>
      ) : data.entries.length === 0 ? (
        <p className="text-sm text-center py-16 rounded-2xl" style={{ color: "var(--text-dim)", border: "1px dashed var(--border)" }}>Nessuna azione registrata.</p>
      ) : (
        <div className="card-luxury rounded-2xl p-4 space-y-2">
          {data.entries.map((e) => (
            <div key={e.id} className="text-sm flex flex-wrap gap-x-2 py-1" style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
              <span className="tabular-nums text-xs" style={{ color: "var(--text-dim)" }}>{fmtDateTime(e.createdAt)}</span>
              <span style={{ color: "var(--text)" }}>{ACTION_LABELS[e.action] ?? e.action}</span>
              {typeof e.details?.reason === "string" && <span>· {e.details.reason}</span>}
              {typeof e.details?.paidUntil === "string" && <span>· {fmtDate(e.details.paidUntil)}</span>}
              {e.targetUserId && <Link href={`/admin/trainer/${e.targetUserId}`} className="underline">apri trainer</Link>}
              <span className="text-xs">· {e.adminEmail}</span>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
