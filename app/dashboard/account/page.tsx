"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShieldCheck, UserRound, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function AccountPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const clientCount = useAppStore((s) => s.clients.length);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmText !== "ELIMINA" || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "ELIMINA" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      useAppStore.getState().clearUser();
      router.replace("/?account=eliminato");
    } catch {
      setError("Non è stato possibile eliminare l'account. Riprova o contatta l'assistenza.");
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Account</h1>

      <div className="card-luxury rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}>
            <UserRound size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold break-words" style={{ color: "var(--text)" }}>{user?.name ?? "Trainer"}</p>
            <p className="text-sm break-all" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="card-luxury rounded-2xl p-5 mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
          <ShieldCheck size={15} style={{ color: "var(--accent)" }} /> Privacy
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Leggi come trattiamo i tuoi dati e quelli dei tuoi clienti nella{" "}
          <Link href="/privacy" className="underline" style={{ color: "var(--accent-light)" }}>informativa sulla privacy</Link>.
        </p>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#f87171" }}>
          <Trash2 size={15} /> Elimina account
        </p>
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
          L&apos;eliminazione è definitiva: vengono cancellati il tuo profilo e tutti i dati collegati
          {clientCount > 0 ? ` (${clientCount} ${clientCount === 1 ? "cliente" : "clienti"}, schede, diete, misurazioni e note)` : " (clienti, schede, diete, misurazioni e note)"}.
          I link condivisi con i clienti smetteranno di funzionare. Se vuoi conservare i dati, esportali prima da{" "}
          <Link href="/dashboard/export" className="underline" style={{ color: "var(--accent-light)" }}>Esporta PDF</Link>.
        </p>
        <label htmlFor="confirm-delete" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
          Per confermare scrivi ELIMINA
        </label>
        <input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          autoComplete="off" autoCapitalize="characters" placeholder="ELIMINA"
          className="w-full px-3 py-2.5 rounded-xl text-base outline-none mb-3"
          style={{ background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text)" }} />
        {error && <p className="text-sm mb-3" style={{ color: "#f87171" }}>{error}</p>}
        <button onClick={handleDelete} disabled={confirmText !== "ELIMINA" || deleting}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          Elimina definitivamente il mio account
        </button>
      </div>
    </div>
  );
}
