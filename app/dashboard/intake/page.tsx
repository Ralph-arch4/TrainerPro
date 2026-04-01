"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { dbIntakeForms, dbClients, type IntakeForm } from "@/lib/db";
import { generateIntakeHtml } from "@/lib/generate-intake-html";
import {
  ClipboardList, Plus, Copy, CheckCircle2, Clock, Trash2, X,
  User, Target, Dumbbell, UtensilsCrossed, Activity, Heart,
  ChevronRight, Loader2, RefreshCw, FileDown, UserPlus,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}


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
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const addClient = useAppStore((s) => s.addClient);
  const r = form.response!;
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  async function handleCreateClient() {
    if (!user) return;
    setCreating(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const newClient = addClient({
        userId: user.id,
        name: r.fullName,
        email: "",
        status: "attivo",
        startDate: today,
      });
      await dbClients.create({ userId: user.id, name: r.fullName, email: "", status: "attivo", startDate: today });
      setCreated(true);
      setTimeout(() => router.push("/dashboard/clienti"), 1200);
    } catch {}
    setCreating(false);
  }

  const Sec = ({ title, icon: Icon, children }: { title: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 pb-1.5" style={{ borderBottom: "1px solid rgba(255,107,43,0.08)" }}>
        <Icon size={13} style={{ color: "var(--accent)" }} />
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const F = ({ n, label, value }: { n: number; label: string; value?: string | string[] | null }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    const display = Array.isArray(value) ? value.join(", ") : value;
    return (
      <div className="flex gap-2">
        <span className="text-xs font-bold flex-shrink-0 mt-0.5 w-5 text-right" style={{ color: "rgba(255,107,43,0.5)" }}>{n}.</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{label} </span>
          <span className="text-sm" style={{ color: "var(--ivory)" }}>{display}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="card-luxury rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,107,43,0.1)" }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--ivory)" }}>{r.fullName}</h2>
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
            {form.submitted_at ? `Compilato ${fmtDate(form.submitted_at)}` : ""}
            {form.label ? ` · ${form.label}` : ""}
          </p>
        </div>
        {!created ? (
          <button onClick={handleCreateClient} disabled={creating}
            className="accent-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold">
            {creating ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
            {creating ? "Creazione…" : "Crea cliente"}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            <CheckCircle2 size={13} /> Cliente creato!
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="p-5 overflow-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
        <Sec title="Dati personali" icon={User}>
          <F n={1} label="Nome e Cognome" value={r.fullName} />
          <F n={2} label="Età" value={r.age} />
          <F n={3} label="Altezza / Peso" value={[r.height && `${r.height} cm`, r.currentWeight && `${r.currentWeight} kg`].filter(Boolean).join(" · ") || undefined} />
        </Sec>

        <Sec title="Obiettivi & Motivazione" icon={Target}>
          <F n={4} label="Obiettivo principale" value={r.primaryGoal} />
          <F n={5} label="Obiettivi secondari" value={r.secondaryGoals} />
          <F n={6} label="Motivazione" value={r.motivation} />
        </Sec>

        <Sec title="Esperienza in palestra" icon={Dumbbell}>
          <F n={7} label="Esperienza in palestra" value={r.gymExperience} />
          <F n={8} label="Da quanto si allena" value={r.trainingYears} />
          <F n={9} label="Ha seguito programmi strutturati" value={r.hasFollowedProgram} />
          <F n={10} label="Esercizi che conosce tecnicamente" value={r.knownExercises} />
          <F n={11} label="Muscoli che sente lavorare" value={r.musclesFelt} />
          <F n={12} label="Muscoli che non sente" value={r.musclesNotFelt} />
          <F n={13} label="Esercizi preferiti" value={r.favoriteExercises} />
          <F n={14} label="Esercizi che non vuole fare" value={r.unwantedExercises} />
          <F n={15} label="Punti di forza" value={r.strongExercises} />
          <F n={16} label="Punti di debolezza" value={r.weakExercises} />
          <F n={17} label="Sport praticati in passato" value={r.pastSports} />
          <F n={18} label="Sport attuali" value={r.currentSports} />
          <F n={19} label="Autovalutazione forza/resistenza" value={r.fitnessAssessment} />
          <F n={20} label="Tipo di allenamento preferito" value={r.trainingTypePreference} />
        </Sec>

        <Sec title="Disponibilità & Logistica" icon={Activity}>
          <F n={21} label="Durata sessione" value={r.sessionDuration} />
          <F n={22} label="Frequenza settimanale" value={r.trainingDaysPerWeek} />
          <F n={23} label="Disponibile il weekend" value={r.canTrainWeekend} />
          <F n={24} label="Può allenarsi in casa" value={r.canTrainHome} />
          <F n={25} label="Attrezzatura in casa" value={r.homeEquipment} />
          <F n={26} label="Orario fisso o variabile" value={r.fixedSchedule} />
          <F n={27} label="Solo/a o con qualcuno" value={r.trainingPartner} />
          <F n={28} label="Orario preferito" value={r.preferredTrainingTime} />
        </Sec>

        <Sec title="Salute & Infortuni" icon={Heart}>
          <F n={29} label="Problemi articolari/muscolari" value={r.jointProblems} />
          <F n={30} label="Patologie" value={r.pathologies} />
          <F n={31} label="Infortuni passati" value={r.injuries} />
          <F n={32} label="Farmaci" value={r.medications} />
          <F n={33} label="Integratori" value={r.supplements} />
          <F n={34} label="Problemi digestivi" value={r.digestiveIssues} />
        </Sec>

        <Sec title="Stile di vita" icon={User}>
          <F n={35} label="Lavoro impegnativo" value={r.workDemanding} />
          <F n={36} label="Giorni lavorativi/sett." value={r.workDaysPerWeek} />
          <F n={37} label="Livello attività quotidiana" value={r.activityLevel} />
          <F n={38} label="Ore di sonno" value={r.sleepHours} />
          <F n={39} label="Qualità del sonno" value={r.sleepQuality} />
        </Sec>

        <Sec title="Alimentazione" icon={UtensilsCrossed}>
          <F n={40} label="Pasti fuori a settimana" value={r.eatingOutFrequency} />
          <F n={41} label="Cosa mangia quando sgarra" value={r.cheatFoods} />
          <F n={42} label="Tipo di dieta" value={r.dietType} />
          <F n={43} label="Allergie / Intolleranze" value={r.foodAllergies} />
          <F n={44} label="Pasti al giorno" value={r.mealsPerDay} />
          <F n={45} label="Suddivisione pasti" value={r.mealDistribution} />
          <F n={46} label="Prepara i pasti da solo/a" value={r.canPrepMeals} />
          <F n={47} label="Acqua al giorno" value={r.waterIntake} />
          <F n={48} label="Alcolici" value={r.alcoholConsumption} />
          <F n={49} label="Giornata alimentare tipo" value={r.typicalDayMeals} />
        </Sec>
      </div>
    </div>
  );
}

function buildClientNotes(r: NonNullable<IntakeForm["response"]>): string {
  const lines: string[] = ["=== INTAKE FORM ==="];
  const add = (n: number, label: string, val?: string | string[] | null) => {
    if (!val || (Array.isArray(val) && !val.length)) return;
    lines.push(`${n}. ${label}: ${Array.isArray(val) ? val.join(", ") : val}`);
  };
  add(1,"Nome",r.fullName);add(2,"Età",r.age);add(3,"Altezza/Peso",[r.height&&`${r.height}cm`,r.currentWeight&&`${r.currentWeight}kg`].filter(Boolean).join(" / ")||undefined);
  add(4,"Obiettivo principale",r.primaryGoal);add(5,"Obiettivi secondari",r.secondaryGoals);add(6,"Motivazione",r.motivation);
  add(7,"Esperienza palestra",r.gymExperience);add(8,"Anni di training",r.trainingYears);add(9,"Ha seguito schede",r.hasFollowedProgram);
  add(10,"Esercizi noti",r.knownExercises);add(11,"Muscoli che sente",r.musclesFelt);add(12,"Muscoli non sentiti",r.musclesNotFelt);
  add(13,"Esercizi preferiti",r.favoriteExercises);add(14,"Esercizi da evitare",r.unwantedExercises);
  add(15,"Punti di forza",r.strongExercises);add(16,"Punti di debolezza",r.weakExercises);
  add(17,"Sport passati",r.pastSports);add(18,"Sport attuali",r.currentSports);add(19,"Autovalutazione",r.fitnessAssessment);
  add(20,"Tipo allenamento preferito",r.trainingTypePreference);
  add(21,"Durata sessione",r.sessionDuration);add(22,"Freq. settimanale",r.trainingDaysPerWeek);
  add(23,"Weekend",r.canTrainWeekend);add(24,"Casa",r.canTrainHome);add(25,"Attrezzatura casa",r.homeEquipment);
  add(26,"Orario",r.fixedSchedule);add(27,"Partner",r.trainingPartner);add(28,"Orario preferito",r.preferredTrainingTime);
  add(29,"Problemi articolari",r.jointProblems);add(30,"Patologie",r.pathologies);add(31,"Infortuni",r.injuries);
  add(32,"Farmaci",r.medications);add(33,"Integratori",r.supplements);add(34,"Prob. digestivi",r.digestiveIssues);
  add(35,"Lavoro",r.workDemanding);add(36,"Giorni lavoro",r.workDaysPerWeek);add(37,"Attività quotidiana",r.activityLevel);
  add(38,"Sonno ore",r.sleepHours);add(39,"Qualità sonno",r.sleepQuality);
  add(40,"Pasti fuori",r.eatingOutFrequency);add(41,"Sgarri",r.cheatFoods);add(42,"Tipo dieta",r.dietType);
  add(43,"Allergie",r.foodAllergies);add(44,"Pasti/giorno",r.mealsPerDay);add(45,"Suddivisione pasti",r.mealDistribution);
  add(46,"Prepara pasti",r.canPrepMeals);add(47,"Acqua",r.waterIntake);add(48,"Alcolici",r.alcoholConsumption);
  add(49,"Giornata tipo",r.typicalDayMeals);
  return lines.join("\n");
}
