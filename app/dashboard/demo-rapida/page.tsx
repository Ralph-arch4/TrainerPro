"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { dbDemoLinks, type DemoLink } from "@/lib/db";
import { EXERCISE_LIBRARY } from "@/lib/exerciseLibrary";
import {
  hasQuickDemo, LOCKABLE_FEATURES, DEFAULT_LOCKED, DEMO_DURATION_HOURS,
  DEMO_PROSPECT_MAX, DEMO_MESSAGE_MAX, remainingMs, formatRemaining, demoLinkErrorMessage,
  newQuickDay, newQuickExercise, quickToPlan, planToQuick, countQuickExercises, normalizeLocked,
  QUICK_MAX_DAYS, QUICK_MAX_EXERCISES,
  type LockableFeature, type QuickDay, type QuickExercise,
} from "@/lib/quickDemo";
import { showToast } from "@/components/Toast";
import {
  Timer, Lock, Copy, CheckCircle2, Trash2, Loader2, Plus, Eye, Dumbbell, Crown, RefreshCw, Send,
  ChevronUp, ChevronDown, X, Pencil, Settings2,
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
// Inline plans have a single week, so the "full programme" teaser is not offered.
const INLINE_FEATURES = LOCKABLE_FEATURES.filter((f) => f.id !== "weeks");
const MUSCLE_BY_NAME = new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.muscleGroup]));

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
        Modalità demo rapida per i tuoi clienti: crea la scheda insieme a lui e invia un link valido {DEMO_DURATION_HOURS} ore.
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [source, setSource] = useState<"quick" | "saved">("quick");
  const [prospect, setProspect] = useState("");
  const [planName, setPlanName] = useState("");
  const [days, setDays] = useState<QuickDay[]>(() => [newQuickDay(0)]);
  const [planId, setPlanId] = useState("");
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState<LockableFeature[]>(DEFAULT_LOCKED);
  const [showOptions, setShowOptions] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const plans = useMemo(() => clients.flatMap((c) =>
    c.workoutPlans.map((p) => ({ id: p.id, name: p.name, clientName: c.name, exercises: p.exercises.length }))), [clients]);
  const linkPlanName = (l: DemoLink) => l.workoutPlanId
    ? plans.find((p) => p.id === l.workoutPlanId)?.name ?? "Scheda salvata"
    : `${l.planName || "Lezione di prova"} · ${l.exercises?.length ?? 0} esercizi`;

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

  // ── Builder actions ────────────────────────────────────────────────────────
  function patchDay(dayId: string, fn: (d: QuickDay) => QuickDay) {
    setDays((prev) => prev.map((d) => d.id === dayId ? fn(d) : d));
  }
  function patchEx(dayId: string, exId: string, patch: Partial<QuickExercise>) {
    patchDay(dayId, (d) => ({ ...d, exercises: d.exercises.map((e) => e.id === exId ? { ...e, ...patch } : e) }));
  }
  function addEx(dayId: string, afterId?: string) {
    if (countQuickExercises(days) >= QUICK_MAX_EXERCISES) return;
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const at = afterId ? day.exercises.findIndex((e) => e.id === afterId) : day.exercises.length - 1;
    const prev = day.exercises[at];
    // New rows repeat the previous sets/reps: one less thing to type
    const ex = { ...newQuickExercise(), ...(prev ? { sets: prev.sets, reps: prev.reps } : {}) };
    setFocusId(ex.id);
    patchDay(dayId, (d) => {
      const idx = afterId ? d.exercises.findIndex((e) => e.id === afterId) : d.exercises.length - 1;
      const list = [...d.exercises];
      list.splice(idx + 1, 0, ex);
      return { ...d, exercises: list };
    });
  }
  function removeEx(dayId: string, exId: string) {
    patchDay(dayId, (d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== exId) }));
  }
  function moveEx(dayId: string, exId: string, dir: -1 | 1) {
    patchDay(dayId, (d) => {
      const i = d.exercises.findIndex((e) => e.id === exId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.exercises.length) return d;
      const list = [...d.exercises];
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, exercises: list };
    });
  }
  function addDay() {
    if (days.length >= QUICK_MAX_DAYS) return;
    const d = newQuickDay(days.length);
    setDays((prev) => [...prev, d]);
    setFocusId(d.exercises[0].id);
  }
  function removeDay(dayId: string) {
    setDays((prev) => prev.length > 1 ? prev.filter((d) => d.id !== dayId) : prev);
  }

  function resetForm() {
    setEditingId(null);
    setProspect("");
    setPlanName("");
    setDays([newQuickDay(0)]);
    setPlanId("");
    setMessage("");
    setLocked(DEFAULT_LOCKED);
    setSource("quick");
  }

  function startEdit(link: DemoLink) {
    setEditingId(link.id);
    setSource("quick");
    setProspect(link.prospectName ?? "");
    setPlanName(link.planName ?? "");
    setMessage(link.message ?? "");
    setLocked(normalizeLocked(link.lockedFeatures));
    const loaded = planToQuick(link.exercises ?? [], link.daysPerWeek ?? 1, link.dayLabels);
    setDays(loaded.length ? loaded : [newQuickDay(0)]);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copy(link: DemoLink) {
    try {
      await navigator.clipboard.writeText(demoUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { showToast("Copia non riuscita", "error"); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base = { prospectName: prospect, message, lockedFeatures: locked };
    let payload;
    if (source === "saved") {
      if (!planId) { showToast("Scegli la scheda da mostrare", "error"); return; }
    } else {
      const plan = quickToPlan(days);
      if (plan.exercises.length === 0) { showToast("Aggiungi almeno un esercizio", "error"); return; }
      const exercises = plan.exercises.map((x) => {
        const muscleGroup = MUSCLE_BY_NAME.get(x.name.toLowerCase());
        return muscleGroup ? { ...x, muscleGroup } : x;
      });
      payload = { ...base, planName, exercises, daysPerWeek: plan.daysPerWeek, dayLabels: plan.dayLabels };
    }
    setSaving(true);
    try {
      if (editingId && payload) {
        const updated = await dbDemoLinks.update(editingId, payload);
        setLinks((prev) => prev.map((l) => l.id === updated.id ? updated : l));
        showToast("Modifiche salvate: il link resta lo stesso");
      } else {
        const link = await dbDemoLinks.create(payload ?? { ...base, workoutPlanId: planId });
        setLinks((prev) => [link, ...prev]);
        await copy(link);
        showToast(`Link creato e copiato: valido ${DEMO_DURATION_HOURS} ore`);
      }
      resetForm();
    } catch (err) {
      showToast(demoLinkErrorMessage(err), "error");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const snapshot = links;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    if (editingId === id) resetForm();
    try { await dbDemoLinks.remove(id); } catch { setLinks(snapshot); showToast("Errore nell'eliminazione", "error"); }
    setDeleting(null);
  }

  function toggle(id: LockableFeature) {
    setLocked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function shareWhatsApp(link: DemoLink) {
    const greet = link.prospectName ? `Ciao ${link.prospectName.split(" ")[0]}! ` : "Ciao! ";
    const text = `${greet}Ecco la tua lezione di prova: la scheda che abbiamo preparato insieme. Il link resta attivo per ${DEMO_DURATION_HOURS} ore: ${demoUrl(link.token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const active = links.filter((l) => remainingMs(l.expiresAt, now) > 0);
  const expired = links.filter((l) => remainingMs(l.expiresAt, now) <= 0);
  const exCount = countQuickExercises(days);
  const features = source === "quick" ? INLINE_FEATURES : LOCKABLE_FEATURES;

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in">
      <Header />
      <datalist id="demo-exercise-library">
        {EXERCISE_LIBRARY.map((e) => <option key={e.name} value={e.name} />)}
      </datalist>
      <div className="grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
        {/* Builder */}
        <form ref={formRef} onSubmit={handleSubmit} className="card-luxury rounded-2xl p-4 sm:p-5 space-y-4 scroll-mt-20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Timer size={18} style={{ color: "var(--accent)" }} />
              <h2 className="font-bold" style={{ color: "var(--text)" }}>{editingId ? "Modifica lezione di prova" : "Nuova lezione di prova"}</h2>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1" style={{ color: "var(--text-dim)" }}>
                <X size={13} /> Annulla
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="demo-prospect" className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Nome del cliente</label>
              <input id="demo-prospect" value={prospect} onChange={(e) => setProspect(e.target.value)} maxLength={DEMO_PROSPECT_MAX}
                placeholder="es. Giulia" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            {source === "quick" && (
              <div>
                <label htmlFor="demo-plan-name" className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Nome della scheda</label>
                <input id="demo-plan-name" value={planName} onChange={(e) => setPlanName(e.target.value)} maxLength={120}
                  placeholder="Lezione di prova" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            )}
          </div>

          {source === "quick" ? (
            <div className="space-y-3">
              {days.map((d) => (
                <div key={d.id} data-testid="demo-day" className="rounded-xl p-3" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <input aria-label="Nome della sessione" value={d.label} maxLength={40}
                      onChange={(e) => patchDay(d.id, (x) => ({ ...x, label: e.target.value }))}
                      className="flex-1 min-w-0 bg-transparent text-sm font-bold outline-none px-1 py-1 rounded-lg"
                      style={{ color: "var(--accent-light)" }} />
                    {days.length > 1 && (
                      <button type="button" onClick={() => removeDay(d.id)} className="p-1.5 rounded-lg" title="Elimina sessione" aria-label={`Elimina ${d.label}`}>
                        <Trash2 size={14} style={{ color: "var(--text-dim)" }} />
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_3.5rem_4.5rem_4.5rem] gap-1.5 px-1 mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                    <span>Esercizio</span><span className="text-center">Serie</span><span className="text-center">Reps</span><span />
                  </div>
                  <div className="space-y-1.5">
                    {d.exercises.map((ex, ei) => (
                      <div key={ex.id} data-testid="demo-exercise" className="grid grid-cols-[3.5rem_auto_4.5rem_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_3.5rem_4.5rem_4.5rem] gap-1.5 items-center">
                        <input aria-label="Esercizio" list="demo-exercise-library" value={ex.name} maxLength={100}
                          autoFocus={focusId === ex.id} placeholder={`Esercizio ${ei + 1}`}
                          onChange={(e) => patchEx(d.id, ex.id, { name: e.target.value })}
                          className="col-span-4 sm:col-span-1 w-full px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                        <input aria-label="Serie" inputMode="numeric" value={ex.sets} maxLength={2}
                          onChange={(e) => patchEx(d.id, ex.id, { sets: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-2 py-2 rounded-lg text-sm text-center outline-none" style={inputStyle} />
                        <span className="sm:hidden text-xs" style={{ color: "var(--text-dim)" }}>serie ×</span>
                        <input aria-label="Ripetizioni" value={ex.reps} maxLength={20} placeholder="10"
                          onChange={(e) => patchEx(d.id, ex.id, { reps: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEx(d.id, ex.id); } }}
                          className="w-full px-2 py-2 rounded-lg text-sm text-center outline-none" style={inputStyle} />
                        <div className="flex items-center justify-end">
                          <button type="button" onClick={() => moveEx(d.id, ex.id, -1)} disabled={ei === 0} className="p-1 rounded disabled:opacity-25" aria-label="Sposta su">
                            <ChevronUp size={14} style={{ color: "var(--text-dim)" }} />
                          </button>
                          <button type="button" onClick={() => moveEx(d.id, ex.id, 1)} disabled={ei === d.exercises.length - 1} className="p-1 rounded disabled:opacity-25" aria-label="Sposta giu">
                            <ChevronDown size={14} style={{ color: "var(--text-dim)" }} />
                          </button>
                          <button type="button" onClick={() => removeEx(d.id, ex.id)} className="p-1 rounded" aria-label="Elimina esercizio">
                            <X size={14} style={{ color: "var(--text-dim)" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addEx(d.id)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
                    style={{ border: "1px dashed rgba(201,168,76,0.35)", color: "var(--accent-light)" }}>
                    <Plus size={13} /> Esercizio
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={addDay} disabled={days.length >= QUICK_MAX_DAYS}
                  className="outline-btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs disabled:opacity-40">
                  <Plus size={13} /> Sessione
                </button>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {days.length} {days.length === 1 ? "sessione" : "sessioni"} · {exCount} esercizi · Invio sulle reps aggiunge una riga
                </span>
              </div>
              {!editingId && plans.length > 0 && (
                <button type="button" onClick={() => setSource("saved")} className="text-xs underline" style={{ color: "var(--text-dim)" }}>
                  Oppure usa una scheda già salvata
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Scheda salvata da mostrare</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                <option value="">Scegli una scheda…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.clientName} · {p.name} ({p.exercises} esercizi)</option>
                ))}
              </select>
              <button type="button" onClick={() => setSource("quick")} className="text-xs underline mt-2" style={{ color: "var(--text-dim)" }}>
                Torna alla creazione rapida
              </button>
            </div>
          )}

          <div className="rounded-xl" style={{ border: "1px solid var(--border-subtle)" }}>
            <button type="button" onClick={() => setShowOptions((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-2"><Settings2 size={14} /> Messaggio finale e funzionalità bloccate</span>
              {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showOptions && (
              <div className="px-3 pb-3 space-y-3">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={DEMO_MESSAGE_MAX} rows={2}
                  aria-label="Messaggio finale"
                  placeholder="es. Ti è piaciuta? Scrivimi per iniziare il percorso completo: wa.me/39..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
                <div className="space-y-1.5">
                  {features.map((f) => (
                    <label key={f.id} className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer" style={{ background: "var(--surface-xs)" }}>
                      <input type="checkbox" checked={locked.includes(f.id)} onChange={() => toggle(f.id)} className="mt-0.5 accent-[#C9A84C]" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold" style={{ color: "var(--text)" }}>{f.label}</span>
                        <span className="block text-xs" style={{ color: "var(--text-dim)" }}>{f.teaser}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="accent-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : editingId ? <CheckCircle2 size={15} /> : <Plus size={15} />}
            {saving ? "Salvataggio…" : editingId ? "Salva modifiche" : `Genera link (${DEMO_DURATION_HOURS} ore)`}
          </button>
        </form>

        {/* Links */}
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
                  Nessun link attivo. Creane uno per la prossima lezione di prova.
                </p>
              )}
              {active.map((l) => (
                <LinkRow key={l.id} link={l} planName={linkPlanName(l)} now={now} editing={editingId === l.id}
                  copied={copiedId === l.id} deleting={deleting === l.id}
                  onCopy={() => copy(l)} onShare={() => shareWhatsApp(l)} onDelete={() => handleDelete(l.id)}
                  onEdit={l.workoutPlanId ? undefined : () => startEdit(l)} />
              ))}
              {expired.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "var(--text-dim)" }}>
                    Scaduti ({expired.length})
                  </p>
                  {expired.map((l) => (
                    <LinkRow key={l.id} link={l} planName={linkPlanName(l)} now={now} editing={false}
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

function LinkRow({ link, planName, now, editing, copied, deleting, onCopy, onShare, onEdit, onDelete }: {
  link: DemoLink; planName: string; now: Date; editing: boolean; copied: boolean; deleting: boolean;
  onCopy?: () => void; onShare?: () => void; onEdit?: () => void; onDelete: () => void;
}) {
  const left = remainingMs(link.expiresAt, now);
  const isActive = left > 0;
  return (
    <div data-testid="demo-link-row" className="rounded-2xl p-4" style={{ background: "var(--surface-xs)", border: `1px solid ${editing ? "var(--accent)" : isActive ? "rgba(201,168,76,0.25)" : "var(--border-subtle)"}`, opacity: isActive ? 1 : 0.75 }}>
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
      <div className="flex flex-wrap items-center gap-2 mt-3">
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
        {isActive && onEdit && (
          <button onClick={onEdit} className="outline-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            <Pencil size={13} /> Modifica
          </button>
        )}
        <button onClick={onDelete} disabled={deleting} className="ml-auto p-1.5 rounded-lg" title={isActive ? "Disattiva ed elimina" : "Elimina"} aria-label="Elimina link">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} style={{ color: "var(--text-dim)" }} />}
        </button>
      </div>
    </div>
  );
}
