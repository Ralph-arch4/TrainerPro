"use client";
import { useState, useEffect, use } from "react";
import type { IntakeResponse } from "@/lib/db";
import { Dumbbell, ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type Status = "loading" | "not_found" | "already_submitted" | "open" | "submitting" | "success";

const STEPS = [
  "Dati personali",
  "Obiettivi & Motivazione",
  "Esperienza in palestra",
  "Disponibilità & Logistica",
  "Salute & Infortuni",
  "Stile di vita & Alimentazione",
];

// ── Shared form primitives ────────────────────────────────────────────────────
function Lbl({ n, children, req }: { n: number; children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>
      <span className="mr-1 text-xs font-bold" style={{ color: "rgba(255,107,43,0.6)" }}>{n}.</span>
      {children}{req && <span className="ml-0.5" style={{ color: "var(--accent)" }}>*</span>}
    </label>
  );
}
function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />;
}
function Sel({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#151515", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>{children}</select>;
}
function Txt(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />;
}
function Radio({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className="px-3 py-1.5 rounded-xl text-sm transition-all"
          style={{ background: value === o ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${value === o ? "rgba(255,107,43,0.4)" : "rgba(255,255,255,0.08)"}`, color: value === o ? "var(--accent-light)" : "rgba(245,240,232,0.6)", fontWeight: value === o ? 600 : 400 }}>
          {o}
        </button>
      ))}
    </div>
  );
}
function Multi({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            className="px-3 py-1.5 rounded-xl text-sm transition-all"
            style={{ background: on ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(255,107,43,0.4)" : "rgba(255,255,255,0.08)"}`, color: on ? "var(--accent-light)" : "rgba(245,240,232,0.6)", fontWeight: on ? 600 : 400 }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-wider mt-6 mb-3 pb-1.5" style={{ color: "rgba(255,107,43,0.7)", borderBottom: "1px solid rgba(255,107,43,0.1)" }}>{children}</p>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function IntakeFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<Status>("loading");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<IntakeResponse>>({ trainingTypePreference: [] });

  useEffect(() => {
    fetch(`/api/intake/${token}`).then(async (res) => {
      if (!res.ok) { setStatus("not_found"); return; }
      const d = await res.json();
      setStatus(d.status === "submitted" ? "already_submitted" : "open");
    });
  }, [token]);

  function s<K extends keyof IntakeResponse>(key: K, val: IntakeResponse[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }
  const v = form as IntakeResponse;

  async function submit() {
    setError(""); setStatus("submitting");
    const res = await fetch(`/api/intake/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setStatus("success"); } else { setError("Errore durante l'invio. Riprova."); setStatus("open"); }
  }

  if (status === "loading") return <Screen><div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} /></div></Screen>;
  if (status === "not_found") return <Screen><div className="text-center py-20"><AlertCircle size={48} className="mx-auto mb-4" style={{ color: "rgba(239,68,68,0.5)" }} /><h2 className="text-xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Link non valido</h2><p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>Contatta il tuo personal trainer.</p></div></Screen>;
  if (status === "already_submitted") return <Screen><div className="text-center py-20"><div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}><CheckCircle2 size={40} style={{ color: "#22c55e" }} /></div><h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Già compilato!</h2><p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>Il tuo trainer ha già ricevuto le tue risposte.</p></div></Screen>;
  if (status === "success") return <Screen><div className="text-center py-16"><div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)" }}><CheckCircle2 size={44} style={{ color: "#22c55e" }} /></div><h2 className="text-2xl font-bold mb-3" style={{ color: "var(--ivory)" }}>Questionario inviato!</h2><p className="text-base mb-2" style={{ color: "rgba(245,240,232,0.65)" }}>Grazie, <strong style={{ color: "var(--ivory)" }}>{v.fullName}</strong>!</p><p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Il tuo personal trainer ha ricevuto tutte le risposte.</p></div></Screen>;

  return (
    <Screen>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-1.5"><span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Passo {step + 1} di {STEPS.length}</span><span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{STEPS[step]}</span></div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}><div className="h-1.5 rounded-full transition-all duration-500" style={{ background: "linear-gradient(90deg,var(--accent),var(--accent-light))", width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>
      <h2 className="text-xl font-bold mb-5" style={{ color: "var(--ivory)" }}>{["Chi sei?", "Obiettivi & Motivazione", "Esperienza in palestra", "Disponibilità & Logistica", "Salute & Infortuni", "Stile di vita & Alimentazione"][step]}</h2>

      {/* ── Step 0 ── */}
      {step === 0 && <div className="space-y-4">
        <div><Lbl n={1} req>Nome e Cognome</Lbl><Inp value={v.fullName ?? ""} onChange={(e) => s("fullName", e.target.value)} placeholder="Mario Rossi" /></div>
        <div><Lbl n={2}>Età</Lbl><Inp type="number" min={10} max={100} value={v.age ?? ""} onChange={(e) => s("age", e.target.value)} placeholder="28" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Lbl n={3}>Altezza (cm)</Lbl><Inp type="number" value={v.height ?? ""} onChange={(e) => s("height", e.target.value)} placeholder="178" /></div>
          <div><Lbl n={3}>Peso attuale (kg)</Lbl><Inp type="number" step="0.5" value={v.currentWeight ?? ""} onChange={(e) => s("currentWeight", e.target.value)} placeholder="80" /></div>
        </div>
      </div>}

      {/* ── Step 1 ── */}
      {step === 1 && <div className="space-y-4">
        <div><Lbl n={4}>Qual è il tuo obiettivo principale?</Lbl><Txt value={v.primaryGoal ?? ""} onChange={(e) => s("primaryGoal", e.target.value)} placeholder="es. perdere peso, aumentare massa muscolare..." /></div>
        <div><Lbl n={5}>Hai obiettivi secondari?</Lbl><Txt value={v.secondaryGoals ?? ""} onChange={(e) => s("secondaryGoals", e.target.value)} placeholder="es. migliorare la postura, più resistenza..." /></div>
        <div><Lbl n={6}>Cosa ti spinge ad allenarti?</Lbl><Txt value={v.motivation ?? ""} onChange={(e) => s("motivation", e.target.value)} placeholder="La tua motivazione..." /></div>
      </div>}

      {/* ── Step 2 ── */}
      {step === 2 && <div className="space-y-4">
        <div><Lbl n={7}>Hai esperienza in palestra?</Lbl><Radio options={["Sì, molta", "Sì, un po'", "Poca o nessuna"]} value={v.gymExperience ?? ""} onChange={(x) => s("gymExperience", x)} /></div>
        <div><Lbl n={8}>Da quanto tempo ti alleni?</Lbl><Sel value={v.trainingYears ?? ""} onChange={(e) => s("trainingYears", e.target.value)}><option value="">— Seleziona —</option><option>Mai iniziato/a</option><option>Meno di 6 mesi</option><option>6 mesi – 1 anno</option><option>1–2 anni</option><option>3–5 anni</option><option>Più di 5 anni</option></Sel></div>
        <div><Lbl n={9}>Hai mai seguito una scheda o programma strutturato?</Lbl><Radio options={["Sì", "No", "Qualche volta"]} value={v.hasFollowedProgram ?? ""} onChange={(x) => s("hasFollowedProgram", x)} /></div>
        <div><Lbl n={10}>Quali esercizi conosci tecnicamente bene?</Lbl><Txt value={v.knownExercises ?? ""} onChange={(e) => s("knownExercises", e.target.value)} placeholder="es. squat, panca piana, stacco..." /></div>
        <div><Lbl n={11}>Quale/i muscolo/i senti lavorare maggiormente?</Lbl><Txt value={v.musclesFelt ?? ""} onChange={(e) => s("musclesFelt", e.target.value)} placeholder="es. sento molto il petto sulla panca..." /></div>
        <div><Lbl n={12}>Quale/i muscolo/i non riesci a sentire bene?</Lbl><Txt value={v.musclesNotFelt ?? ""} onChange={(e) => s("musclesNotFelt", e.target.value)} placeholder="es. non sento mai lavorare i dorsali..." /></div>
        <div><Lbl n={13}>Quali sono i tuoi esercizi preferiti?</Lbl><Txt value={v.favoriteExercises ?? ""} onChange={(e) => s("favoriteExercises", e.target.value)} placeholder="es. squat, pull-up, dips..." /></div>
        <div><Lbl n={14}>Esercizi che non vuoi fare? (Se sì, quali)</Lbl><Txt value={v.unwantedExercises ?? ""} onChange={(e) => s("unwantedExercises", e.target.value)} placeholder="es. leg press, affondi... e perché" /></div>
        <div><Lbl n={15}>In quali esercizi ti senti più forte?</Lbl><Txt value={v.strongExercises ?? ""} onChange={(e) => s("strongExercises", e.target.value)} placeholder="es. panca: 100 kg, squat: 120 kg..." /></div>
        <div><Lbl n={16}>In quali esercizi ti senti più debole?</Lbl><Txt value={v.weakExercises ?? ""} onChange={(e) => s("weakExercises", e.target.value)} placeholder="es. trazioni: solo con elastico..." /></div>
        <div><Lbl n={17}>Sport praticati in passato (anche agonistici)?</Lbl><Txt value={v.pastSports ?? ""} onChange={(e) => s("pastSports", e.target.value)} placeholder="es. calcio per 10 anni, nuoto agonistico, nessuno..." /></div>
        <div><Lbl n={18}>Pratichi attualmente altri sport?</Lbl><Txt value={v.currentSports ?? ""} onChange={(e) => s("currentSports", e.target.value)} placeholder="es. calcetto il venerdì, nessuno..." /></div>
        <div><Lbl n={19}>Valuta la tua resistenza/forza attuale</Lbl><Txt value={v.fitnessAssessment ?? ""} onChange={(e) => s("fitnessAssessment", e.target.value)} placeholder="es. riesco a fare 20 push-up, squat 60 kg x 10..." /></div>
        <div><Lbl n={20}>Tipo di allenamento preferito <span className="text-xs font-normal" style={{ color: "rgba(245,240,232,0.4)" }}>(anche più di uno)</span></Lbl>
          <Multi options={["Bodybuilding", "Funzionale", "HIIT", "Circuiti", "Aerobico", "Powerlifting", "Nessuna preferenza"]} value={v.trainingTypePreference ?? []} onChange={(x) => s("trainingTypePreference", x)} />
        </div>
      </div>}

      {/* ── Step 3 ── */}
      {step === 3 && <div className="space-y-4">
        <div><Lbl n={21}>Tempo massimo per un singolo allenamento</Lbl><Sel value={v.sessionDuration ?? ""} onChange={(e) => s("sessionDuration", e.target.value)}><option value="">— Seleziona —</option><option>30–45 minuti</option><option>45–60 minuti</option><option>60–75 minuti</option><option>75–90 minuti</option><option>Più di 90 minuti</option></Sel></div>
        <div><Lbl n={22}>Quante volte a settimana puoi allenarti?</Lbl><Sel value={v.trainingDaysPerWeek ?? ""} onChange={(e) => s("trainingDaysPerWeek", e.target.value)}><option value="">— Seleziona —</option><option>1–2 volte</option><option>3 volte</option><option>4 volte</option><option>5 volte</option><option>6+ volte</option></Sel></div>
        <div><Lbl n={23}>Puoi allenarti il fine settimana?</Lbl><Radio options={["Sì, entrambi i giorni", "Solo sabato", "Solo domenica", "No"]} value={v.canTrainWeekend ?? ""} onChange={(x) => s("canTrainWeekend", x)} /></div>
        <div><Lbl n={24}>Hai la possibilità di allenarti in casa?</Lbl><Radio options={["Sì", "No", "A volte"]} value={v.canTrainHome ?? ""} onChange={(x) => s("canTrainHome", x)} /></div>
        <div><Lbl n={25}>Attrezzatura disponibile a casa</Lbl><Txt value={v.homeEquipment ?? ""} onChange={(e) => s("homeEquipment", e.target.value)} placeholder="es. manubri fino a 20 kg, sbarra, nessuna..." /></div>
        <div><Lbl n={26}>Riesci ad andare in palestra sempre alla stessa ora?</Lbl><Radio options={["Sempre stessa ora", "Orario variabile"]} value={v.fixedSchedule ?? ""} onChange={(x) => s("fixedSchedule", x)} /></div>
        <div><Lbl n={27}>Preferisci allenarti solo/a o con qualcuno?</Lbl><Radio options={["Solo/a", "Con qualcuno", "Indifferente"]} value={v.trainingPartner ?? ""} onChange={(x) => s("trainingPartner", x)} /></div>
        <div><Lbl n={28}>Ti alleni meglio la mattina, pomeriggio o sera?</Lbl><Radio options={["Mattina", "Pomeriggio", "Sera", "Indifferente"]} value={v.preferredTrainingTime ?? ""} onChange={(x) => s("preferredTrainingTime", x)} /></div>
      </div>}

      {/* ── Step 4 ── */}
      {step === 4 && <div className="space-y-4">
        <div><Lbl n={29}>Hai problemi articolari o muscolari?</Lbl><Txt value={v.jointProblems ?? ""} onChange={(e) => s("jointProblems", e.target.value)} placeholder="es. mal di schiena lombare, ginocchio, nessuno..." /></div>
        <div><Lbl n={30}>Soffri di qualche patologia?</Lbl><Txt value={v.pathologies ?? ""} onChange={(e) => s("pathologies", e.target.value)} placeholder="es. ernia discale, ipertensione, nessuna..." /></div>
        <div><Lbl n={31}>Hai avuto infortuni?</Lbl><Txt value={v.injuries ?? ""} onChange={(e) => s("injuries", e.target.value)} placeholder="es. distorsione caviglia (2022), nessuno..." /></div>
        <div><Lbl n={32}>Assumi farmaci regolarmente?</Lbl><Txt value={v.medications ?? ""} onChange={(e) => s("medications", e.target.value)} placeholder="es. antipertensivi, nessuno..." /></div>
        <div><Lbl n={33}>Utilizzi integratori?</Lbl><Txt value={v.supplements ?? ""} onChange={(e) => s("supplements", e.target.value)} placeholder="es. proteine whey, creatina, nessuno..." /></div>
        <div><Lbl n={34}>Soffri di problemi digestivi/intestinali?</Lbl><Txt value={v.digestiveIssues ?? ""} onChange={(e) => s("digestiveIssues", e.target.value)} placeholder="es. colon irritabile, reflusso, nessuno..." /></div>
      </div>}

      {/* ── Step 5 ── */}
      {step === 5 && <div className="space-y-4">
        <SectionLabel>Stile di vita</SectionLabel>
        <div><Lbl n={35}>Il tuo lavoro è molto impegnativo?</Lbl><Radio options={["Sì, molto", "Abbastanza", "No, poco stress"]} value={v.workDemanding ?? ""} onChange={(x) => s("workDemanding", x)} /></div>
        <div><Lbl n={36}>Quante volte lavori a settimana?</Lbl><Sel value={v.workDaysPerWeek ?? ""} onChange={(e) => s("workDaysPerWeek", e.target.value)}><option value="">— Seleziona —</option><option>3 giorni o meno</option><option>4 giorni</option><option>5 giorni</option><option>6 giorni</option><option>Tutti i giorni</option></Sel></div>
        <div><Lbl n={37}>Sei in movimento o tendenzialmente sedentario/a?</Lbl><Radio options={["Molto attivo/a", "Moderatamente attivo/a", "Sedentario/a"]} value={v.activityLevel ?? ""} onChange={(x) => s("activityLevel", x)} /></div>
        <div><Lbl n={38}>Quante ore dormi mediamente a notte?</Lbl><Sel value={v.sleepHours ?? ""} onChange={(e) => s("sleepHours", e.target.value)}><option value="">— Seleziona —</option><option>Meno di 5h</option><option>5–6h</option><option>6–7h</option><option>7–8h</option><option>Più di 8h</option></Sel></div>
        <div><Lbl n={39}>Com&apos;è la qualità del tuo sonno?</Lbl><Radio options={["Buona", "Discreta", "Scarsa"]} value={v.sleepQuality ?? ""} onChange={(x) => s("sleepQuality", x)} /></div>
        <SectionLabel>Alimentazione</SectionLabel>
        <div><Lbl n={40}>Quante volte mangi fuori a settimana?</Lbl><Sel value={v.eatingOutFrequency ?? ""} onChange={(e) => s("eatingOutFrequency", e.target.value)}><option value="">— Seleziona —</option><option>Mai</option><option>1 volta</option><option>2–3 volte</option><option>4–5 volte</option><option>Quasi ogni giorno</option></Sel></div>
        <div><Lbl n={41}>Cosa mangi di solito quando &quot;sgarri&quot;?</Lbl><Txt value={v.cheatFoods ?? ""} onChange={(e) => s("cheatFoods", e.target.value)} placeholder="es. pizza, gelato, fast food, dolci..." /></div>
        <div><Lbl n={42}>Sei vegetariano/vegano/pescetariano/ecc.?</Lbl><Radio options={["Onnivoro/a", "Vegetariano/a", "Vegano/a", "Pescetariano/a", "Altro"]} value={v.dietType ?? ""} onChange={(x) => s("dietType", x)} /></div>
        <div><Lbl n={43}>Soffri di intolleranze o allergie alimentari?</Lbl><Txt value={v.foodAllergies ?? ""} onChange={(e) => s("foodAllergies", e.target.value)} placeholder="es. lattosio, glutine, nessuna..." /></div>
        <div><Lbl n={44}>Quanti pasti fai al giorno?</Lbl><Sel value={v.mealsPerDay ?? ""} onChange={(e) => s("mealsPerDay", e.target.value)}><option value="">— Seleziona —</option><option>1–2</option><option>3</option><option>4</option><option>5+</option></Sel></div>
        <div><Lbl n={45}>Come suddividi i pasti nel corso della giornata?</Lbl><Txt value={v.mealDistribution ?? ""} onChange={(e) => s("mealDistribution", e.target.value)} placeholder="es. colazione ore 8, pranzo ore 13, cena ore 20..." /></div>
        <div><Lbl n={46}>Hai la possibilità di prepararti i pasti da solo/a?</Lbl><Radio options={["Sì, sempre", "A volte", "Raramente"]} value={v.canPrepMeals ?? ""} onChange={(x) => s("canPrepMeals", x)} /></div>
        <div><Lbl n={47}>Quanta acqua bevi in media al giorno?</Lbl><Sel value={v.waterIntake ?? ""} onChange={(e) => s("waterIntake", e.target.value)}><option value="">— Seleziona —</option><option>Meno di 1 litro</option><option>1–1.5 litri</option><option>1.5–2 litri</option><option>2–2.5 litri</option><option>Più di 2.5 litri</option></Sel></div>
        <div><Lbl n={48}>Consumi alcolici?</Lbl><Radio options={["No", "Raramente", "1–2 volte/sett.", "Quasi ogni giorno"]} value={v.alcoholConsumption ?? ""} onChange={(x) => s("alcoholConsumption", x)} /></div>
        <div><Lbl n={49}>Elenca ciò che mangi in una giornata tipo</Lbl><Txt value={v.typicalDayMeals ?? ""} onChange={(e) => s("typicalDayMeals", e.target.value)} rows={5} placeholder={"Colazione: ...\nSpuntino: ...\nPranzo: ...\nSpuntino: ...\nCena: ..."} /></div>
        {error && <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}><AlertCircle size={15} />{error}</div>}
      </div>}

      {/* Nav */}
      <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: "1px solid rgba(255,107,43,0.1)" }}>
        {step > 0 ? (
          <button onClick={() => { setStep((s) => s - 1); window.scrollTo(0, 0); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5" style={{ color: "rgba(245,240,232,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronLeft size={16} /> Indietro
          </button>
        ) : <div />}
        {step < STEPS.length - 1 ? (
          <button onClick={() => { if (step === 0 && !v.fullName?.trim()) { alert("Il nome è obbligatorio."); return; } setStep((s) => s + 1); window.scrollTo(0, 0); }} className="accent-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
            Avanti <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={submit} disabled={status === "submitting"} className="accent-btn flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold">
            {status === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {status === "submitting" ? "Invio…" : "Invia questionario"}
          </button>
        )}
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--black)" }}>
      <div className="sticky top-0 z-10 px-5 h-14 flex items-center gap-3 glass-dark">
        <div className="w-8 h-8 rounded-xl accent-btn flex items-center justify-center"><Dumbbell size={16} /></div>
        <span className="font-bold accent-text">TrainerPro</span>
        <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,43,0.1)", color: "var(--accent-light)" }}>Questionario programmazione</span>
      </div>
      <div className="max-w-xl mx-auto px-5 py-10">{children}</div>
    </div>
  );
}
