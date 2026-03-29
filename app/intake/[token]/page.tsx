"use client";
import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import type { IntakeResponse } from "@/lib/db";
import { Dumbbell, ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormStatus = "loading" | "not_found" | "already_submitted" | "open" | "submitting" | "success";

// ─── Step configuration ───────────────────────────────────────────────────────
const STEPS = [
  "Dati personali",
  "Corpo & Obiettivi",
  "Allenamento",
  "Alimentazione & Stile di vita",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>
      {children}{required && <span className="ml-0.5" style={{ color: "var(--accent)" }}>*</span>}
    </label>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)", ...props.style }}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
      style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>
      {children}
    </select>
  );
}

function RadioGroup({ name, options, value, onChange }: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button key={o.value} type="button"
          onClick={() => onChange(o.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-left transition-all"
          style={{
            background: value === o.value ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${value === o.value ? "rgba(255,107,43,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: value === o.value ? "var(--accent-light)" : "rgba(245,240,232,0.65)",
            fontWeight: value === o.value ? "600" : "400",
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const checked = value.includes(o.value);
        return (
          <button key={o.value} type="button"
            onClick={() => toggle(o.value)}
            className="px-3 py-1.5 rounded-xl text-sm transition-all"
            style={{
              background: checked ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${checked ? "rgba(255,107,43,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: checked ? "var(--accent-light)" : "rgba(245,240,232,0.6)",
              fontWeight: checked ? "600" : "400",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ["", "Basso", "Normale", "Moderato", "Alto", "Molto alto"];
  return (
    <div>
      <div className="flex justify-between mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button"
            onClick={() => onChange(n)}
            className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
            style={{
              background: value === n ? "rgba(255,107,43,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${value === n ? "rgba(255,107,43,0.5)" : "rgba(255,255,255,0.08)"}`,
              color: value === n ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
            }}>
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs text-center" style={{ color: "var(--accent-light)" }}>{labels[value]}</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IntakeFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<FormStatus>("loading");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Partial<IntakeResponse>>({
    availableDays: [],
    trainingLocation: [],
    stressLevel: 0,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("intake_forms")
        .select("status, token")
        .eq("token", token)
        .single();
      if (!data) { setStatus("not_found"); return; }
      if (data.status === "submitted") { setStatus("already_submitted"); return; }
      setStatus("open");
    }
    load();
  }, [token]);

  function set<K extends keyof IntakeResponse>(key: K, value: IntakeResponse[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (step === 0) return !!(form.fullName?.trim() && form.email?.trim());
    return true;
  }

  async function handleSubmit() {
    setError("");
    setStatus("submitting");
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("intake_forms")
        .update({
          status: "submitted",
          response: form,
          submitted_at: new Date().toISOString(),
        })
        .eq("token", token)
        .eq("status", "pending");
      if (err) throw err;
      setStatus("success");
    } catch {
      setError("Si è verificato un errore. Riprova.");
      setStatus("open");
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <Screen>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      </Screen>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (status === "not_found") {
    return (
      <Screen>
        <div className="text-center py-20">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "rgba(239,68,68,0.5)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Link non valido</h2>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
            Il link non esiste o è stato rimosso. Contatta il tuo personal trainer.
          </p>
        </div>
      </Screen>
    );
  }

  // ── Already submitted ────────────────────────────────────────────────────────
  if (status === "already_submitted") {
    return (
      <Screen>
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle2 size={40} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Già compilato!</h2>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.55)" }}>
            Hai già inviato questo questionario. Il tuo trainer ha ricevuto le tue risposte.
          </p>
        </div>
      </Screen>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <Screen>
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle2 size={44} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--ivory)" }}>Questionario inviato!</h2>
          <p className="text-base mb-2" style={{ color: "rgba(245,240,232,0.65)" }}>
            Grazie, <strong style={{ color: "var(--ivory)" }}>{form.fullName}</strong>!
          </p>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
            Il tuo personal trainer ha ricevuto tutte le tue risposte e si metterà in contatto con te presto.
          </p>
        </div>
      </Screen>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <Screen>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            Passo {step + 1} di {STEPS.length}
          </p>
          <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{STEPS[step]}</p>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
              width: `${((step + 1) / STEPS.length) * 100}%`,
            }} />
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-between mt-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-2 h-2 rounded-full transition-all"
                style={{ background: i <= step ? "var(--accent)" : "rgba(255,255,255,0.15)" }} />
              <span className="text-xs hidden sm:block" style={{ color: i === step ? "var(--accent-light)" : "rgba(245,240,232,0.3)" }}>
                {s.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step heading */}
      <h2 className="text-xl font-bold mb-6" style={{ color: "var(--ivory)" }}>
        {step === 0 && "Chi sei?"}
        {step === 1 && "Il tuo corpo & obiettivi"}
        {step === 2 && "Come ti alleni?"}
        {step === 3 && "Alimentazione & stile di vita"}
      </h2>

      {/* ── Step 0: Personal ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label required>Nome e cognome</Label>
            <Input value={form.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)}
              placeholder="Mario Rossi" />
          </div>
          <div>
            <Label required>Email</Label>
            <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)}
              placeholder="mario@email.com" />
          </div>
          <div>
            <Label>Numero di telefono</Label>
            <Input type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)}
              placeholder="+39 333 000 0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data di nascita</Label>
              <Input type="date" value={form.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
            <div>
              <Label>Sesso</Label>
              <Select value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
                <option value="">— Seleziona —</option>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
                <option value="altro">Preferisco non specificare</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Body & Goals ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Altezza (cm)</Label>
              <Input type="number" min={100} max={230} value={form.height ?? ""}
                onChange={(e) => set("height", Number(e.target.value) || undefined)}
                placeholder="175" />
            </div>
            <div>
              <Label>Peso attuale (kg)</Label>
              <Input type="number" min={30} max={300} step={0.5} value={form.currentWeight ?? ""}
                onChange={(e) => set("currentWeight", Number(e.target.value) || undefined)}
                placeholder="75" />
            </div>
            <div>
              <Label>Peso obiettivo (kg)</Label>
              <Input type="number" min={30} max={300} step={0.5} value={form.targetWeight ?? ""}
                onChange={(e) => set("targetWeight", Number(e.target.value) || undefined)}
                placeholder="70" />
            </div>
            <div>
              <Label>% Grasso (se conosci)</Label>
              <Input type="number" min={3} max={60} step={0.5} value={form.bodyFatPercent ?? ""}
                onChange={(e) => set("bodyFatPercent", Number(e.target.value) || undefined)}
                placeholder="18" />
            </div>
          </div>

          <div>
            <Label>Obiettivo principale</Label>
            <RadioGroup name="goal"
              options={[
                { value: "dimagrimento", label: "Perdita peso" },
                { value: "massa", label: "Massa muscolare" },
                { value: "tonificazione", label: "Tonificazione" },
                { value: "performance", label: "Performance" },
                { value: "salute", label: "Salute generale" },
                { value: "ricomposizione", label: "Ricomposizione" },
              ]}
              value={form.primaryGoal ?? ""}
              onChange={(v) => set("primaryGoal", v)}
            />
          </div>

          <div>
            <Label>Entro quando vuoi raggiungerlo?</Label>
            <RadioGroup name="timeline"
              options={[
                { value: "1m", label: "1 mese" },
                { value: "3m", label: "3 mesi" },
                { value: "6m", label: "6 mesi" },
                { value: "1y", label: "1 anno" },
                { value: "nessuna_fretta", label: "Senza fretta" },
              ]}
              value={form.goalTimeline ?? ""}
              onChange={(v) => set("goalTimeline", v)}
            />
          </div>

          <div>
            <Label>Cosa ti motiva a iniziare adesso?</Label>
            <Textarea value={form.motivation ?? ""}
              onChange={(e) => set("motivation", e.target.value)}
              placeholder="Racconta liberamente la tua situazione e cosa ti spinge a cambiare..." />
          </div>
        </div>
      )}

      {/* ── Step 2: Training ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <Label>Livello di esperienza</Label>
            <RadioGroup name="level"
              options={[
                { value: "principiante", label: "Principiante" },
                { value: "intermedio", label: "Intermedio" },
                { value: "avanzato", label: "Avanzato" },
              ]}
              value={form.level ?? ""}
              onChange={(v) => set("level", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Anni di allenamento</Label>
              <Select value={form.trainingYears ?? ""} onChange={(e) => set("trainingYears", e.target.value)}>
                <option value="">— Seleziona —</option>
                <option value="0">Mai allenato/a</option>
                <option value="<1">Meno di 1 anno</option>
                <option value="1-2">1–2 anni</option>
                <option value="3-5">3–5 anni</option>
                <option value="5+">Più di 5 anni</option>
              </Select>
            </div>
            <div>
              <Label>Frequenza attuale</Label>
              <Select value={form.currentTrainingDays ?? ""} onChange={(e) => set("currentTrainingDays", e.target.value)}>
                <option value="">— Seleziona —</option>
                <option value="0">Non mi alleno</option>
                <option value="1-2">1–2 volte/sett.</option>
                <option value="3-4">3–4 volte/sett.</option>
                <option value="5+">5+ volte/sett.</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Giorni disponibili per allenarti</Label>
            <CheckboxGroup
              options={[
                { value: "lun", label: "Lunedì" },
                { value: "mar", label: "Martedì" },
                { value: "mer", label: "Mercoledì" },
                { value: "gio", label: "Giovedì" },
                { value: "ven", label: "Venerdì" },
                { value: "sab", label: "Sabato" },
                { value: "dom", label: "Domenica" },
              ]}
              value={form.availableDays ?? []}
              onChange={(v) => set("availableDays", v)}
            />
          </div>

          <div>
            <Label>Durata sessione preferita</Label>
            <RadioGroup name="duration"
              options={[
                { value: "30-45", label: "30–45 min" },
                { value: "45-60", label: "45–60 min" },
                { value: "60-90", label: "60–90 min" },
                { value: "90+", label: "90+ min" },
              ]}
              value={form.sessionDuration ?? ""}
              onChange={(v) => set("sessionDuration", v)}
            />
          </div>

          <div>
            <Label>Dove ti alleni?</Label>
            <CheckboxGroup
              options={[
                { value: "Palestra", label: "Palestra" },
                { value: "Casa", label: "Casa" },
                { value: "Outdoor", label: "Outdoor" },
              ]}
              value={form.trainingLocation ?? []}
              onChange={(v) => set("trainingLocation", v)}
            />
          </div>

          <div>
            <Label>Attrezzatura disponibile</Label>
            <Textarea value={form.equipment ?? ""}
              onChange={(e) => set("equipment", e.target.value)}
              placeholder="es. manubri fino a 30 kg, bilanciere, rack, cavi, TRX..." />
          </div>

          <div>
            <Label>Infortuni o limitazioni fisiche</Label>
            <Textarea value={form.injuriesOrLimitations ?? ""}
              onChange={(e) => set("injuriesOrLimitations", e.target.value)}
              placeholder="es. mal di schiena lombare, problemi al ginocchio destro, nessuno..." />
          </div>
        </div>
      )}

      {/* ── Step 3: Diet & Lifestyle ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <Label>Tipo di alimentazione</Label>
            <RadioGroup name="diet"
              options={[
                { value: "Onnivoro", label: "Onnivoro" },
                { value: "Vegetariano", label: "Vegetariano" },
                { value: "Vegano", label: "Vegano" },
                { value: "Keto", label: "Keto" },
                { value: "Paleo", label: "Paleo" },
                { value: "Altro", label: "Altro" },
              ]}
              value={form.dietType ?? ""}
              onChange={(v) => set("dietType", v)}
            />
          </div>

          <div>
            <Label>Allergie o intolleranze alimentari</Label>
            <Textarea value={form.foodAllergies ?? ""}
              onChange={(e) => set("foodAllergies", e.target.value)}
              placeholder="es. lattosio, glutine, frutta secca, nessuna..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pasti al giorno</Label>
              <Select value={form.mealsPerDay ?? ""} onChange={(e) => set("mealsPerDay", e.target.value)}>
                <option value="">— Seleziona —</option>
                <option value="1-2">1–2</option>
                <option value="3">3</option>
                <option value="4-5">4–5</option>
                <option value="6+">6+</option>
              </Select>
            </div>
            <div>
              <Label>Consumo di alcol</Label>
              <Select value={form.alcoholConsumption ?? ""} onChange={(e) => set("alcoholConsumption", e.target.value)}>
                <option value="">— Seleziona —</option>
                <option value="No">No</option>
                <option value="Occasionale">Occasionale</option>
                <option value="Regolare">Regolare</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Integratori che usi</Label>
            <Textarea value={form.supplements ?? ""}
              onChange={(e) => set("supplements", e.target.value)}
              placeholder="es. proteine in polvere, creatina, omega-3, nessuno..." />
          </div>

          <div>
            <Label>Tipo di lavoro</Label>
            <RadioGroup name="work"
              options={[
                { value: "Sedentario (ufficio)", label: "Sedentario (ufficio)" },
                { value: "In piedi", label: "In piedi" },
                { value: "Fisico", label: "Fisico" },
              ]}
              value={form.workType ?? ""}
              onChange={(v) => set("workType", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ore di sonno per notte</Label>
              <Select value={form.sleepHours ?? ""} onChange={(e) => set("sleepHours", e.target.value)}>
                <option value="">— Seleziona —</option>
                <option value="Meno di 5h">Meno di 5h</option>
                <option value="5-6h">5–6h</option>
                <option value="7-8h">7–8h</option>
                <option value="Più di 8h">Più di 8h</option>
              </Select>
            </div>
            <div>
              <Label>Livello di stress percepito</Label>
              <div className="mt-1">
                <StressSlider value={form.stressLevel ?? 0} onChange={(v) => set("stressLevel", v)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Altre attività fisiche (sport, passeggiate…)</Label>
            <Textarea value={form.otherActivities ?? ""}
              onChange={(e) => set("otherActivities", e.target.value)}
              placeholder="es. cammino 30 min/giorno, gioco a calcetto il venerdì..." />
          </div>

          <div>
            <Label>Qualcosa che vuoi aggiungere?</Label>
            <Textarea value={form.additionalNotes ?? ""}
              onChange={(e) => set("additionalNotes", e.target.value)}
              placeholder="Qualsiasi altra informazione utile per il tuo trainer..." />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,107,43,0.1)" }}>
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
            style={{ color: "rgba(245,240,232,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronLeft size={16} /> Indietro
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canProceed() && setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="accent-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
            style={{ opacity: canProceed() ? 1 : 0.45, cursor: canProceed() ? "pointer" : "not-allowed" }}>
            Avanti <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={status === "submitting"}
            className="accent-btn flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold">
            {status === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {status === "submitting" ? "Invio in corso…" : "Invia questionario"}
          </button>
        )}
      </div>
    </Screen>
  );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--black)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 h-14 flex items-center gap-3 glass-dark">
        <div className="w-8 h-8 rounded-xl accent-btn flex items-center justify-center">
          <Dumbbell size={16} />
        </div>
        <span className="font-bold accent-text">TrainerPro</span>
        <span className="text-xs ml-2 px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,107,43,0.1)", color: "var(--accent-light)" }}>
          Questionario cliente
        </span>
      </div>
      {/* Content */}
      <div className="max-w-xl mx-auto px-5 py-10">{children}</div>
    </div>
  );
}
