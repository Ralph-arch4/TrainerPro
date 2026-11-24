"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { dbDemoLinks, type DemoLink } from "@/lib/db";
import {
  hasQuickDemo, LOCKABLE_FEATURES, DEFAULT_LOCKED, DEMO_DURATION_HOURS,
  DEMO_PROSPECT_MAX, DEMO_MESSAGE_MAX, remainingMs, formatRemaining, demoLinkErrorMessage,
  type LockableFeature,
} from "@/lib/quickDemo";
import { showToast } from "@/components/Toast";
import {
  Timer, Lock, Copy, CheckCircle2, Trash2, Loader2, Plus, Eye, Dumbbell, Crown, RefreshCw, Send,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (typeof window !== "undefined" ? window.location.origin : "");

function demoUrl(token: string) {
  return `${SITE_URL || window.location.origin}/demo/${token}`;
}

function fmtTime(d: string) {
  return new Date(d).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const inputStyle = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" };

export default function QuickDemoPage() {
  const user = useAppStore((s) => s.user);
  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }
  return hasQuickDemo(user.plan) ? <QuickDemoPanel /> : <QuickDemoLocked />;
}

function Header() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
        Demo <span className="accent-text">rapida</span>
      </h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Modalità demo rapida per i tuoi clienti: un link valido {DEMO_DURATION_HOURS} ore per la lezione di prova gratuita.
      </p>
    </div>
  );
}

function QuickDemoLocked() {
  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in max-w-3xl">
      <Header />
      <div className="card-luxury rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
          <Lock size={24} style={{ color: "var(--accent)" }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Esclusiva del piano Fitness Master</h2>
        <p className="text-sm max-w-md mx-auto mb-5" style={{ color: "var(--text-muted)" }}>
          Genera un link temporaneo di {DEMO_DURATION_HOURS} ore per la lezione free: il potenziale cliente prova la scheda
          che hai preparato per lui, registra i suoi allenamenti e vede in anteprima le funzionalità del percorso completo.
        </p>
        <Link href="/dashboard/abbonamento" className="accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
          <Crown size={15} /> Scopri il tuo abbonamento
        </Link>
      </div>
    </div>
  );
}

function QuickDemoPanel() {
  const clients = useAppStore((s) => s.clients);
  const [links, setLinks] = useState<DemoLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const [planId, setPlanId] = useState("");
  const [prospect, setProspect] = useState("");
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState<LockableFeature[]>(DEFAULT_LOCKED);

  const plans = useMemo(() => clients.flatMap((c) =>
    c.workoutPlans.map((p) => ({ id: p.id, name: p.name, clientName: c.name, exercises: p.exercises.length }))), [clients]);
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? "Scheda eliminata";

  async function load() {
    setLoading(true);
    try { setLinks(await dbDemoLinks.list()); } catch { showToast("Errore nel caricamento dei link demo", "error"); }
    setLoading(false);
  }

  useEffect(() => {
    dbDemoLinks.list()
      .then(setLinks)
      .catch(() => showToast("Errore nel caricamento dei link demo", "error"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  async function copy(link: DemoLink) {
    try {
      await navigator.clipboard.writeText(demoUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { showToast("Copia non riuscita", "error"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) { showToast("Scegli la scheda da mostrare", "error"); return; }
    setCreating(true);
    try {
      const link = await dbDemoLinks.create({ workoutPlanId: planId, prospectName: prospect, message, lockedFeatures: locked });
      setLinks((prev) => [link, ...prev]);
      setProspect("");
      await copy(link);
      showToast(`Link creato e copiato: valido ${DEMO_DURATION_HOURS} ore`);
    } catch (err) {
      showToast(demoLinkErrorMessage(err), "error");
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const snapshot = links;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    try { await dbDemoLinks.remove(id); } catch { setLinks(snapshot); showToast("Errore nell'eliminazione", "error"); }
    setDeleting(null);
  }

  function toggle(id: LockableFeature) {
    setLocked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function shareWhatsApp(link: DemoLink) {
    const greet = link.prospectName ? `Ciao ${link.prospectName.split(" ")[0]}! ` : "Ciao! ";
    const text = `${greet}Ecco la tua lezione di prova: la scheda che ho preparato per te. Il link resta attivo per ${DEMO_DURATION_HOURS} ore: ${demoUrl(link.token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const active = links.filter((l) => remainingMs(l.expiresAt, now) > 0);
  const expired = links.filter((l) => remainingMs(l.expiresAt, now) <= 0);

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in">
      <Header />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Create */}
        <form onSubmit={handleCreate} className="card-luxury rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Timer size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-bold" style={{ color: "var(--text)" }}>Nuovo link di prova</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Scheda da mostrare</label>
            {plans.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                Prepara prima una scheda su misura per il potenziale cliente (ad esempio creando il suo profilo in{" "}
                <Link href="/dashboard/clienti" className="underline">Clienti</Link>).
              </p>
            ) : (
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                <option value="">Scegli una scheda…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.clientName} · {p.name} ({p.exercises} esercizi)</option>
                ))}
              </select>
            )}
            <p className="text-xs mt-1.5" style={{ color: "var(--text-dim)" }}>
              Le serie registrate nella demo restano separate dallo storico del cliente.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Nome del potenziale cliente</label>
            <input value={prospect} onChange={(e) => setProspect(e.target.value)} maxLength={DEMO_PROSPECT_MAX}
              placeholder="es. Giulia" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Messaggio finale (facoltativo)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={DEMO_MESSAGE_MAX} rows={3}
              placeholder="es. Ti è piaciuta? Scrivimi per iniziare il percorso completo: wa.me/39..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
          </div>

          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Funzionalità premium in anteprima</p>
            <p className="text-xs mb-2" style={{ color: "var(--text-dim)" }}>
              Quelle selezionate compaiono bloccate, per far vedere cosa avrebbe con il percorso completo.
            </p>
            <div className="space-y-1.5">
              {LOCKABLE_FEATURES.map((f) => (
                <label key={f.id} className="flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer"
                  style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                  <input type="checkbox" checked={locked.includes(f.id)} onChange={() => toggle(f.id)} className="mt-0.5 accent-[#C9A84C]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold" style={{ color: "var(--text)" }}>{f.label}</span>
                    <span className="block text-xs" style={{ color: "var(--text-dim)" }}>{f.teaser}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={creating || plans.length === 0}
            className="accent-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm disabled:opacity-50">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {creating ? "Creazione…" : `Genera link (${DEMO_DURATION_HOURS} ore)`}
          </button>
        </form>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
              Link attivi ({active.length})
            </p>
            <button onClick={load} className="p-2 rounded-xl" title="Aggiorna">
              <RefreshCw size={15} style={{ color: "var(--text-dim)" }} />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin" style={{ color: "var(--accent)" }} /></div>
          ) : (
            <>
              {active.length === 0 && (
                <p className="text-sm rounded-2xl p-5 text-center" style={{ color: "var(--text-dim)", background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                  Nessun link attivo. Generane uno per la prossima lezione di prova.
                </p>
              )}
              {active.map((l) => (
                <LinkRow key={l.id} link={l} planName={planName(l.workoutPlanId)} now={now}
                  copied={copiedId === l.id} deleting={deleting === l.id}
                  onCopy={() => copy(l)} onShare={() => shareWhatsApp(l)} onDelete={() => handleDelete(l.id)} />
              ))}
              {expired.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "var(--text-dim)" }}>
                    Scaduti ({expired.length})
                  </p>
                  {expired.map((l) => (
                    <LinkRow key={l.id} link={l} planName={planName(l.workoutPlanId)} now={now}
                      copied={false} deleting={deleting === l.id} onDelete={() => handleDelete(l.id)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkRow({ link, planName, now, copied, deleting, onCopy, onShare, onDelete }: {
  link: DemoLink; planName: string; now: Date; copied: boolean; deleting: boolean;
  onCopy?: () => void; onShare?: () => void; onDelete: () => void;
}) {
  const left = remainingMs(link.expiresAt, now);
  const isActive = left > 0;
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface-xs)", border: `1px solid ${isActive ? "rgba(201,168,76,0.25)" : "var(--border-subtle)"}`, opacity: isActive ? 1 : 0.75 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{link.prospectName || "Potenziale cliente"}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{planName} · creato {fmtTime(link.createdAt)}</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
          style={isActive
            ? { background: "rgba(201,168,76,0.12)", color: "var(--accent-light)" }
            : { background: "var(--surface-md)", color: "var(--text-dim)" }}>
          {isActive ? `Ancora ${formatRemaining(left)}` : "Scaduto"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1"><Eye size={12} /> {link.openCount === 0 ? "Non ancora aperto" : `Aperto ${link.openCount} ${link.openCount === 1 ? "volta" : "volte"}`}</span>
        <span className="flex items-center gap-1"><Dumbbell size={12} /> {link.logCount} {link.logCount === 1 ? "esercizio registrato" : "esercizi registrati"}</span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        {isActive && onCopy && (
          <button onClick={onCopy} className="outline-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />} {copied ? "Copiato" : "Copia link"}
          </button>
        )}
        {isActive && onShare && (
          <button onClick={onShare} className="outline-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            <Send size={13} /> WhatsApp
          </button>
        )}
        <button onClick={onDelete} disabled={deleting} className="ml-auto p-1.5 rounded-lg" title={isActive ? "Disattiva ed elimina" : "Elimina"}>
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} style={{ color: "var(--text-dim)" }} />}
        </button>
      </div>
    </div>
  );
}
