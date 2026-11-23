"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Client } from "@/lib/store";
import { dbClients } from "@/lib/db";

/**
 * Confirmation dialog for permanently deleting a client.
 * The DB cascades (ON DELETE CASCADE) remove plans, logs, sessions, diet plans,
 * phases, measurements and notes; share links stop working with the plans.
 * Removing the row also frees the Demo plan's single client slot.
 */
export default function DeleteClientDialog({
  client, onClose, onDeleted,
}: {
  client: Client;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const removeClient = useAppStore((s) => s.removeClient);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const expected = client.name.trim();
  const canDelete = confirmText.trim().toLowerCase() === expected.toLowerCase() && !deleting;

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !deleting) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleting, onClose]);

  const logCount = client.workoutPlans.reduce((n, p) => n + (p.logs?.length ?? 0) + (p.sessionLogs?.length ?? 0), 0);
  const items: { label: string; count: number }[] = [
    { label: "schede di allenamento (e i link condivisi)", count: client.workoutPlans.length },
    { label: "registrazioni di carichi e sessioni", count: logCount },
    { label: "indicazioni alimentari", count: client.dietPlans.length },
    { label: "fasi", count: client.phases.length },
    { label: "misurazioni", count: client.measurements.length },
    { label: "note", count: client.notes.length },
  ].filter((i) => i.count > 0);

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    // Irreversible action: wait for the DB before touching the store, so a
    // failure never shows a client as gone and the detail page can navigate
    // away (onDeleted) before the client disappears from the store.
    try {
      await dbClients.remove(client.id);
    } catch {
      setError("Non è stato possibile eliminare il cliente. Riprova.");
      setDeleting(false);
      return;
    }
    onDeleted?.();
    onClose();
    removeClient(client.id);
  }

  // Portal to <body>: the page wrapper's fade-in transform would otherwise
  // become the containing block and break the fixed overlay and backdrop blur.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => { if (!deleting) onClose(); }}>
      <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
      <div className="relative w-full max-w-md rounded-2xl p-6 fade-in max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg)", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
        role="dialog" aria-modal="true" aria-labelledby="delete-client-title"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertTriangle size={18} style={{ color: "#f87171" }} />
            </div>
            <div>
              <h3 id="delete-client-title" className="text-base font-bold" style={{ color: "var(--text)" }}>
                Eliminare {client.name}?
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>L&apos;azione è definitiva e non si può annullare.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={deleting} aria-label="Chiudi" className="p-1 disabled:opacity-40">
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="rounded-xl p-3 mb-4 text-xs space-y-1.5"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--text-muted)" }}>
          <p className="font-semibold" style={{ color: "var(--text)" }}>Verranno cancellati anche:</p>
          {items.length > 0 ? (
            <ul className="space-y-1">
              {items.map((i) => (
                <li key={i.label} className="flex gap-2">
                  <span className="font-bold" style={{ color: "#f87171" }}>{i.count}</span> {i.label}
                </li>
              ))}
            </ul>
          ) : (
            <p>Il profilo del cliente (non ci sono schede, piani o dati collegati).</p>
          )}
          <p className="pt-1">Il cliente non potrà più aprire la sua scheda dal link che gli hai inviato.</p>
        </div>

        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
          Per confermare scrivi il nome del cliente: <span className="font-bold" style={{ color: "var(--text)" }}>{expected}</span>
        </label>
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleDelete(); }}
          autoFocus autoComplete="off" placeholder={expected}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text)" }} />

        {error && <p className="text-xs mt-3" style={{ color: "#f87171" }}>{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm disabled:opacity-40"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Annulla
          </button>
          <button onClick={handleDelete} disabled={!canDelete}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: "#dc2626", color: "#fff" }}>
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Elimina cliente
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
