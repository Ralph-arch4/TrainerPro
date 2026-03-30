"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { dbIntakeForms, type IntakeForm, type IntakeResponse } from "@/lib/db";
import { generateIntakeHtml } from "@/lib/generate-intake-html";
import {
  ClipboardList, Plus, Copy, CheckCircle2, Clock, Trash2, X,
  User, Target, Dumbbell, UtensilsCrossed, ExternalLink,
  ChevronRight, Loader2, RefreshCw, FileDown,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

const goalLabel: Record<string, string> = {
  dimagrimento: "Perdita peso", massa: "Massa muscolare",
  tonificazione: "Tonificazione", performance: "Performance", salute: "Salute generale",
};
const timelineLabel: Record<string, string> = {
  "1m": "1 mese", "3m": "3 mesi", "6m": "6 mesi", "1y": "1 anno", nessuna_fretta: "Senza fretta",
};

export default function IntakePage() {
  const user = useAppStore((s) => s.user);
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<IntakeForm | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    try { setForms(await dbIntakeForms.list(user.id)); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newLabel.trim()) return;
    setCreating(true);
    try {
      const form = await dbIntakeForms.create(user.id, newLabel.trim());
      setForms((prev) => [form, ...prev]);
      setNewLabel("");
      setShowCreate(false);
    } catch {}
    setCreating(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await dbIntakeForms.remove(id);
      setForms((prev) => prev.filter((f) => f.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {}
    setDeleting(null);
  }

  function copyLink(form: IntakeForm) {
    const url = `${SITE_URL}/intake/${form.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function downloadHtml(form: IntakeForm) {
    const html = generateIntakeHtml(form.token, form.label ?? "Form");
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `questionario-${(form.label ?? "cliente").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadedId(form.id);
    setTimeout(() => setDownloadedId(null), 2000);
  }

  const pending = forms.filter((f) => f.status === "pending");
  const submitted = forms.filter((f) => f.status === "submitted");

  return (
    <div className="p-6 lg:p-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--ivory)" }}>
            Form <span className="accent-text">Intake Clienti</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.5)" }}>
            Crea un link da inviare al cliente — compila il questionario senza registrarsi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl transition-all hover:bg-white/5" title="Aggiorna">
            <RefreshCw size={16} style={{ color: "rgba(245,240,232,0.4)" }} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="accent-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
            <Plus size={16} /> Nuovo form
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--ivory)" }}>Nuovo form intake</h2>
              <button onClick={() => setShowCreate(false)}><X size={16} style={{ color: "rgba(245,240,232,0.4)" }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>
                  Etichetta interna
                </label>
                <input
                  autoFocus
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="es. Mario Rossi – Marzo 2025"
                  required
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}
                />
                <p className="text-xs mt-1.5" style={{ color: "rgba(245,240,232,0.35)" }}>
                  Solo tu la vedi — serve per riconoscere il form nella lista.
                </p>
              </div>
              <button type="submit" disabled={creating}
                className="accent-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm">
                {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {creating ? "Creazione…" : "Crea form & genera link"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      ) : forms.length === 0 ? (
        <div className="card-luxury rounded-2xl p-14 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.15)" }}>
            <ClipboardList size={28} style={{ color: "rgba(255,107,43,0.5)" }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--ivory)" }}>Nessun form ancora</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "rgba(245,240,232,0.5)" }}>
            Crea un form intake, copia il link e invialo al cliente. Quando lo compila, trovi tutti i dati qui.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="accent-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
            <Plus size={15} /> Crea il primo form
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — list */}
          <div className="space-y-3">
            {/* Submitted */}
            {submitted.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                  style={{ color: "rgba(245,240,232,0.35)" }}>
                  Compilati ({submitted.length})
                </p>
                {submitted.map((f) => (
                  <FormRow key={f.id} form={f} selected={selected?.id === f.id}
                    onSelect={() => setSelected(selected?.id === f.id ? null : f)}
                    onCopy={() => copyLink(f)} copied={copiedId === f.id}
                    onDownload={() => downloadHtml(f)} downloaded={downloadedId === f.id}
                    onDelete={() => handleDelete(f.id)} deleting={deleting === f.id} />
                ))}
              </div>
            )}
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                  style={{ color: "rgba(245,240,232,0.35)" }}>
                  In attesa ({pending.length})
                </p>
                {pending.map((f) => (
                  <FormRow key={f.id} form={f} selected={selected?.id === f.id}
                    onSelect={() => setSelected(selected?.id === f.id ? null : f)}
                    onCopy={() => copyLink(f)} copied={copiedId === f.id}
                    onDownload={() => downloadHtml(f)} downloaded={downloadedId === f.id}
                    onDelete={() => handleDelete(f.id)} deleting={deleting === f.id} />
                ))}
              </div>
            )}
          </div>

          {/* Right — response detail */}
          <div>
            {selected?.status === "submitted" && selected.response ? (
              <ResponseDetail form={selected} />
            ) : selected?.status === "pending" ? (
              <div className="card-luxury rounded-2xl p-8 text-center">
                <Clock size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.3)" }} />
                <p className="text-sm font-medium mb-1" style={{ color: "var(--ivory)" }}>In attesa di risposta</p>
                <p className="text-xs mb-5" style={{ color: "rgba(245,240,232,0.4)" }}>
                  Il cliente non ha ancora compilato il form.
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <button
                    onClick={() => downloadHtml(selected)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all accent-btn">
                    {downloadedId === selected.id ? <CheckCircle2 size={15} /> : <FileDown size={15} />}
                    {downloadedId === selected.id ? "Scaricato!" : "Scarica HTML da inviare"}
                  </button>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>
                    oppure
                  </p>
                  <button
                    onClick={() => copyLink(selected)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all"
                    style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
                    {copiedId === selected.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedId === selected.id ? "Link copiato!" : "Copia link web"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card-luxury rounded-2xl p-8 text-center">
                <ChevronRight size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.15)" }} />
                <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
                  Seleziona un form dalla lista per vedere i dettagli
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormRow({ form, selected, onSelect, onCopy, copied, onDownload, downloaded, onDelete, deleting }: {
  form: IntakeForm; selected: boolean;
  onSelect: () => void; onCopy: () => void; copied: boolean;
  onDownload: () => void; downloaded: boolean;
  onDelete: () => void; deleting: boolean;
}) {
  const isSubmitted = form.status === "submitted";
  return (
    <div
      className="card-luxury rounded-2xl p-4 mb-2 transition-all cursor-pointer"
      style={{ borderColor: selected ? "rgba(255,107,43,0.35)" : undefined, background: selected ? "rgba(255,107,43,0.06)" : undefined }}
      onClick={onSelect}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isSubmitted ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)" }}>
          {isSubmitted
            ? <CheckCircle2 size={17} style={{ color: "#22c55e" }} />
            : <Clock size={17} style={{ color: "rgba(245,240,232,0.35)" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--ivory)" }}>
            {form.label ?? "Form senza etichetta"}
          </p>
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
            {isSubmitted && form.submitted_at
              ? `Compilato ${fmtDate(form.submitted_at)}`
              : `Creato ${fmtDate(form.created_at)}`}
            {isSubmitted && form.response?.fullName && ` · ${form.response.fullName}`}
          </p>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={onDownload}
            title="Scarica HTML da inviare al cliente"
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: downloaded ? "#22c55e" : "rgba(245,240,232,0.35)" }}>
            {downloaded ? <CheckCircle2 size={14} /> : <FileDown size={14} />}
          </button>
          <button onClick={onCopy}
            title="Copia link"
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: copied ? "#22c55e" : "rgba(245,240,232,0.35)" }}>
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="p-2 rounded-lg transition-all hover:bg-red-500/10"
            style={{ color: "rgba(245,240,232,0.25)" }}>
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResponseDetail({ form }: { form: IntakeForm }) {
  const r = form.response!;
  const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: "var(--accent)" }} />
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
    value ? (
      <div>
        <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: "var(--ivory)" }}>{value}</p>
      </div>
    ) : null
  );

  const FullField = ({ label, value }: { label: string; value?: string | null }) => (
    value ? (
      <div className="col-span-2">
        <p className="text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
        <p className="text-sm" style={{ color: "var(--ivory)" }}>{value}</p>
      </div>
    ) : null
  );

  const genderLabel: Record<string, string> = { M: "Maschio", F: "Femmina", altro: "Altro / Non specificato" };
  const levelLabel: Record<string, string> = { principiante: "Principiante", intermedio: "Intermedio", avanzato: "Avanzato" };
  const daysMap: Record<string, string> = { lun: "Lun", mar: "Mar", mer: "Mer", gio: "Gio", ven: "Ven", sab: "Sab", dom: "Dom" };

  return (
    <div className="card-luxury rounded-2xl p-5 overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--ivory)" }}>{r.fullName}</h2>
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
            {form.submitted_at ? `Compilato ${fmtDate(form.submitted_at)}` : ""}
          </p>
        </div>
        <a href={`mailto:${r.email}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:bg-white/5"
          style={{ color: "var(--accent-light)", border: "1px solid rgba(255,107,43,0.2)" }}>
          <ExternalLink size={12} /> Contatta
        </a>
      </div>

      <Section title="Dati Personali" icon={User}>
        <Field label="Email" value={r.email} />
        <Field label="Telefono" value={r.phone} />
        <Field label="Data di nascita" value={r.birthDate} />
        <Field label="Sesso" value={r.gender ? genderLabel[r.gender] : undefined} />
      </Section>

      <Section title="Fisico & Obiettivi" icon={Target}>
        <Field label="Altezza" value={r.height ? `${r.height} cm` : undefined} />
        <Field label="Peso attuale" value={r.currentWeight ? `${r.currentWeight} kg` : undefined} />
        <Field label="Peso obiettivo" value={r.targetWeight ? `${r.targetWeight} kg` : undefined} />
        <Field label="% Grasso (stimata)" value={r.bodyFatPercent ? `${r.bodyFatPercent}%` : undefined} />
        <Field label="Obiettivo principale" value={r.primaryGoal ? goalLabel[r.primaryGoal] : undefined} />
        <Field label="Timeline" value={r.goalTimeline ? timelineLabel[r.goalTimeline] : undefined} />
        <FullField label="Motivazione" value={r.motivation} />
      </Section>

      <Section title="Allenamento" icon={Dumbbell}>
        <Field label="Livello" value={r.level ? levelLabel[r.level] : undefined} />
        <Field label="Anni di training" value={r.trainingYears} />
        <Field label="Freq. attuale" value={r.currentTrainingDays ? `${r.currentTrainingDays} gg/sett.` : undefined} />
        <Field label="Durata sessione" value={r.sessionDuration ? `${r.sessionDuration} min` : undefined} />
        {r.availableDays && r.availableDays.length > 0 && (
          <div className="col-span-2">
            <p className="text-xs mb-1.5" style={{ color: "rgba(245,240,232,0.4)" }}>Giorni disponibili</p>
            <div className="flex gap-1.5 flex-wrap">
              {r.availableDays.map((d) => (
                <span key={d} className="px-2 py-0.5 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(255,107,43,0.1)", color: "var(--accent-light)" }}>
                  {daysMap[d] ?? d}
                </span>
              ))}
            </div>
          </div>
        )}
        {r.trainingLocation && r.trainingLocation.length > 0 && (
          <div className="col-span-2">
            <p className="text-xs mb-1.5" style={{ color: "rgba(245,240,232,0.4)" }}>Dove si allena</p>
            <p className="text-sm" style={{ color: "var(--ivory)" }}>{r.trainingLocation.join(", ")}</p>
          </div>
        )}
        <FullField label="Attrezzatura" value={r.equipment} />
        <FullField label="Infortuni / Limitazioni" value={r.injuriesOrLimitations} />
      </Section>

      <Section title="Alimentazione & Stile di vita" icon={UtensilsCrossed}>
        <Field label="Alimentazione" value={r.dietType} />
        <Field label="Pasti al giorno" value={r.mealsPerDay} />
        <Field label="Consumo alcol" value={r.alcoholConsumption} />
        <Field label="Tipo di lavoro" value={r.workType} />
        <Field label="Ore di sonno" value={r.sleepHours} />
        <Field label="Livello stress" value={r.stressLevel ? `${r.stressLevel}/5` : undefined} />
        <FullField label="Allergie / Intolleranze" value={r.foodAllergies} />
        <FullField label="Integratori" value={r.supplements} />
        <FullField label="Altre attività" value={r.otherActivities} />
        <FullField label="Note aggiuntive" value={r.additionalNotes} />
      </Section>
    </div>
  );
}
