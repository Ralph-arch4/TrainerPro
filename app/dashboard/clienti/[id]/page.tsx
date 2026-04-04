"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { dbPhases, dbWorkoutPlans, dbDietPlans, dbNotes } from "@/lib/db";
import { showToast } from "@/components/Toast";
import Link from "next/link";
import {
  ArrowLeft, Activity, UtensilsCrossed, StickyNote,
  Dumbbell, Plus, X, Loader2, Pencil, Trash2, CheckCircle2, Circle,
  Mail, Phone, Calendar, Target, BarChart2, ExternalLink, Copy, Check, Timer,
} from "lucide-react";

type Tab = "overview" | "fasi" | "schede" | "dieta" | "note";

const goalLabel: Record<string, string> = { dimagrimento: "Dimagrimento", massa: "Massa", tonificazione: "Tonificazione", performance: "Performance" };
const levelLabel: Record<string, string> = { principiante: "Principiante", intermedio: "Intermedio", avanzato: "Avanzato" };
const phaseTypeLabel: Record<string, string> = { bulk: "Bulk", cut: "Cut", maintenance: "Mantenimento", custom: "Personalizzata" };
const phaseTypeColor: Record<string, string> = { bulk: "#a78bfa", cut: "#38bdf8", maintenance: "#34d399", custom: "#fb923c" };
const statusColor: Record<string, string> = { attivo: "#22c55e", in_pausa: "#f59e0b", inattivo: "#6b7280" };
const statusLabel: Record<string, string> = { attivo: "Attivo", in_pausa: "In pausa", inattivo: "Inattivo" };

function formatDate(d: string) { return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }); }

function formatRestTime(sec: number): string {
  if (sec < 60) return `${sec}″`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}′${s}″` : `${m}′`;
}

function formatCalories(calories: number, caloriesMax?: number): string {
  if (caloriesMax && caloriesMax > calories) return `${calories}–${caloriesMax} kcal`;
  return `${calories} kcal`;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useAppStore((s) => s.clients.find((c) => c.id === id));
  const addPhase = useAppStore((s) => s.addPhase);
  const updatePhase = useAppStore((s) => s.updatePhase);
  const removePhase = useAppStore((s) => s.removePhase);
  const addWorkoutPlan = useAppStore((s) => s.addWorkoutPlan);
  const updateWorkoutPlan = useAppStore((s) => s.updateWorkoutPlan);
  const removeWorkoutPlan = useAppStore((s) => s.removeWorkoutPlan);
  const addDietPlan = useAppStore((s) => s.addDietPlan);
  const removeDietPlan = useAppStore((s) => s.removeDietPlan);
  const addNote = useAppStore((s) => s.addNote);
  const removeNote = useAppStore((s) => s.removeNote);

  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Phase modal
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: "", type: "bulk", startDate: "", endDate: "", targetCalories: "", targetWeight: "", notes: "" });

  // Workout plan modal
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ name: "", description: "", daysPerWeek: "3", totalWeeks: "12", restSeconds: "90", phaseId: "" });

  // Workout plan edit modal
  const [editingPlan, setEditingPlan] = useState<{ id: string; name: string; description: string; daysPerWeek: string; totalWeeks: string; restSeconds: string; phaseId: string } | null>(null);

  // Diet plan modal
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietForm, setDietForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", notes: "", phaseId: "" });

  // Note
  const [noteText, setNoteText] = useState("");

  // Portal link copy
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);

  function copyPortalLink(shareToken: string, planId: string) {
    const url = `${window.location.origin}/cliente/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPlanId(planId);
      setTimeout(() => setCopiedPlanId(null), 2000);
    });
  }

  // Live macro calculation for diet form
  const computedKcal = (() => {
    const p = parseFloat(dietForm.protein) || 0;
    const c = parseFloat(dietForm.carbs) || 0;
    const f = parseFloat(dietForm.fat) || 0;
    return p * 4 + c * 4 + f * 9;
  })();
  const enteredKcal = parseFloat(dietForm.calories) || 0;
  const kcalDiff = enteredKcal - computedKcal;
  const showMacroBadge = (parseFloat(dietForm.protein) || parseFloat(dietForm.carbs) || parseFloat(dietForm.fat)) > 0;

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: "rgba(245,240,232,0.5)" }}>Cliente non trovato.</p>
        <button onClick={() => router.push("/dashboard/clienti")} className="mt-4 text-sm hover:underline" style={{ color: "var(--accent-light)" }}>
          Torna alla lista
        </button>
      </div>
    );
  }

  async function savePhase() {
    if (!phaseForm.name || !phaseForm.startDate || !phaseForm.endDate) return;
    setSaving(true); setSaveError("");
    const p = addPhase(client!.id, {
      name: phaseForm.name, type: phaseForm.type as "bulk" | "cut" | "maintenance" | "custom",
      startDate: phaseForm.startDate, endDate: phaseForm.endDate,
      targetCalories: phaseForm.targetCalories ? parseInt(phaseForm.targetCalories) : undefined,
      targetWeight: phaseForm.targetWeight ? parseFloat(phaseForm.targetWeight) : undefined,
      notes: phaseForm.notes || undefined, completed: false,
    });
    try {
      await dbPhases.create(p);
      setShowPhaseModal(false);
      setPhaseForm({ name: "", type: "bulk", startDate: "", endDate: "", targetCalories: "", targetWeight: "", notes: "" });
      showToast("Fase salvata");
    } catch (err) {
      removePhase(client!.id, p.id);
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function saveWorkout() {
    if (!workoutForm.name) return;
    setSaving(true); setSaveError("");
    const rest = parseInt(workoutForm.restSeconds) || undefined;
    const w = addWorkoutPlan(client!.id, {
      name: workoutForm.name, description: workoutForm.description,
      daysPerWeek: parseInt(workoutForm.daysPerWeek),
      totalWeeks: parseInt(workoutForm.totalWeeks) || 12,
      restSeconds: rest,
      phaseId: workoutForm.phaseId || undefined,
      active: true,
    });
    try {
      await dbWorkoutPlans.create(w);
      setShowWorkoutModal(false);
      setWorkoutForm({ name: "", description: "", daysPerWeek: "3", totalWeeks: "12", restSeconds: "90", phaseId: "" });
      showToast("Scheda creata");
    } catch (err) {
      removeWorkoutPlan(client!.id, w.id);
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function saveEditPlan() {
    if (!editingPlan || !editingPlan.name.trim()) return;
    setSaving(true); setSaveError("");
    const patch = {
      name: editingPlan.name.trim(),
      description: editingPlan.description.trim() || undefined,
      daysPerWeek: parseInt(editingPlan.daysPerWeek),
      totalWeeks: parseInt(editingPlan.totalWeeks) || 12,
      restSeconds: parseInt(editingPlan.restSeconds) || undefined,
      phaseId: editingPlan.phaseId || undefined,
    };
    updateWorkoutPlan(client!.id, editingPlan.id, patch);
    try {
      await dbWorkoutPlans.update(editingPlan.id, patch);
      setEditingPlan(null);
      showToast("Scheda aggiornata");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function duplicatePlan(wp: ReturnType<typeof useAppStore.getState>["clients"][0]["workoutPlans"][0]) {
    const newPlan = addWorkoutPlan(client!.id, {
      name: `${wp.name} (copia)`,
      description: wp.description,
      daysPerWeek: wp.daysPerWeek,
      totalWeeks: wp.totalWeeks,
      restSeconds: wp.restSeconds,
      phaseId: wp.phaseId,
      active: false,
      dayLabels: wp.dayLabels,
    });
    // Copy exercises
    const withExercises = { ...newPlan, exercises: wp.exercises.map((e) => ({ ...e, id: crypto.randomUUID() })) };
    updateWorkoutPlan(client!.id, newPlan.id, { exercises: withExercises.exercises });
    try {
      await dbWorkoutPlans.create({ ...withExercises });
      showToast("Scheda duplicata");
    } catch (err) {
      removeWorkoutPlan(client!.id, newPlan.id);
      showToast("Errore nella duplicazione", "error");
    }
  }

  async function saveDiet() {
    if (!dietForm.name || !dietForm.calories) return;
    setSaving(true); setSaveError("");
    const d = addDietPlan(client!.id, {
      name: dietForm.name,
      calories: parseInt(dietForm.calories),
      protein: parseFloat(dietForm.protein) || 0,
      carbs: parseFloat(dietForm.carbs) || 0,
      fat: parseFloat(dietForm.fat) || 0,
      meals: "[]",
      notes: dietForm.notes || undefined,
      phaseId: dietForm.phaseId || undefined,
      active: true,
    });
    try {
      await dbDietPlans.create(d);
      setShowDietModal(false);
      setDietForm({ name: "", calories: "", protein: "", carbs: "", fat: "", notes: "", phaseId: "" });
      showToast("Piano alimentare salvato");
    } catch (err) {
      removeDietPlan(client!.id, d.id);
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio");
      showToast("Errore nel salvataggio", "error");
    }
    setSaving(false);
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    const n = addNote(client!.id, noteText.trim());
    try {
      await dbNotes.create(n);
      setNoteText("");
      showToast("Nota aggiunta");
    } catch (err) {
      removeNote(client!.id, n.id);
      showToast("Errore nel salvataggio", "error");
    }
  }

  const tabs: { key: Tab; label: string; icon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }>; count?: number }[] = [
    { key: "overview", label: "Overview", icon: BarChart2 },
    { key: "fasi", label: "Fasi", icon: Activity, count: client.phases.length },
    { key: "schede", label: "Schede", icon: Dumbbell, count: client.workoutPlans.length },
    { key: "dieta", label: "Dieta", icon: UtensilsCrossed, count: client.dietPlans.length },
    { key: "note", label: "Note", icon: StickyNote, count: client.notes.length },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm outline-none";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };
  const selectStyle = { background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };

  const activePhase = [...client.phases]
    .filter((p) => !p.completed)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

  // Recent logs: last 2 weeks across all plans
  const recentLogCount = client.workoutPlans.reduce((acc, wp) => {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return acc + wp.logs.filter((l) => new Date(l.loggedAt).getTime() > twoWeeksAgo).length;
  }, 0);

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      {/* Back + header */}
      <button onClick={() => router.push("/dashboard/clienti")}
        className="flex items-center gap-2 text-sm mb-5 hover:opacity-80 transition-all"
        style={{ color: "rgba(245,240,232,0.5)" }}>
        <ArrowLeft size={15} /> Tutti i clienti
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl accent-btn flex items-center justify-center text-xl font-bold flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>{client.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[client.status] }} />
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>{statusLabel[client.status]}</span>
              </div>
              {client.goal && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,43,0.1)", color: "var(--accent-light)" }}>{goalLabel[client.goal]}</span>}
              {client.level && <span className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>{levelLabel[client.level]}</span>}
            </div>
          </div>
        </div>
        {client.monthlyFee && (
          <div className="text-right">
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Quota mensile</p>
            <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>€{client.monthlyFee}</p>
          </div>
        )}
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl flex items-center justify-between gap-2 text-xs"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          <span>⚠ {saveError}</span>
          <button onClick={() => setSaveError("")} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
            style={{
              background: tab === key ? "rgba(255,107,43,0.12)" : "transparent",
              color: tab === key ? "var(--accent-light)" : "rgba(245,240,232,0.5)",
              border: tab === key ? "1px solid rgba(255,107,43,0.2)" : "1px solid transparent",
              fontWeight: tab === key ? "600" : "400",
            }}>
            <Icon size={14} />
            {label}
            {count !== undefined && count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card-luxury rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ivory)" }}>Informazioni personali</h3>
            <div className="space-y-3">
              {client.email && <div className="flex items-center gap-3 text-sm"><Mail size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "rgba(245,240,232,0.7)" }}>{client.email}</span></div>}
              {client.phone && <div className="flex items-center gap-3 text-sm"><Phone size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "rgba(245,240,232,0.7)" }}>{client.phone}</span></div>}
              {client.birthDate && <div className="flex items-center gap-3 text-sm"><Calendar size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "rgba(245,240,232,0.7)" }}>{formatDate(client.birthDate)}</span></div>}
              {client.goal && <div className="flex items-center gap-3 text-sm"><Target size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "rgba(245,240,232,0.7)" }}>{goalLabel[client.goal]}</span></div>}
              <div className="flex items-center gap-3 text-sm"><Calendar size={14} style={{ color: "var(--accent)" }} /><span style={{ color: "rgba(245,240,232,0.7)" }}>Inizio: {formatDate(client.startDate)}</span></div>
            </div>
          </div>

          <div className="card-luxury rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ivory)" }}>Riepilogo attività</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Fasi", value: client.phases.length, color: "#a78bfa" },
                { label: "Schede", value: client.workoutPlans.length, color: "var(--accent)" },
                { label: "Diete", value: client.dietPlans.length, color: "#34d399" },
                { label: "Log recenti", value: recentLogCount, color: "#38bdf8" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {activePhase && (
            <div className="card-luxury rounded-2xl p-5 sm:col-span-2">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ivory)" }}>Fase attiva</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: phaseTypeColor[activePhase.type] }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--ivory)" }}>{activePhase.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
                    {formatDate(activePhase.startDate)} → {formatDate(activePhase.endDate)}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${phaseTypeColor[activePhase.type]}18`, color: phaseTypeColor[activePhase.type] }}>
                  {phaseTypeLabel[activePhase.type]}
                </span>
                {activePhase.targetCalories && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.6)" }}>
                    {activePhase.targetCalories} kcal target
                  </span>
                )}
              </div>
            </div>
          )}

          {recentLogCount > 0 && (
            <div className="card-luxury rounded-2xl p-5 sm:col-span-2">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ivory)" }}>Attività recente (14 giorni)</h3>
              <div className="space-y-2">
                {client.workoutPlans.map((wp) => {
                  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
                  const recentLogs = wp.logs.filter((l) => new Date(l.loggedAt).getTime() > twoWeeksAgo);
                  if (recentLogs.length === 0) return null;
                  const lastLog = [...recentLogs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
                  return (
                    <div key={wp.id} className="flex items-center gap-3 text-sm">
                      <Dumbbell size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      <span className="flex-1" style={{ color: "rgba(245,240,232,0.7)" }}>{wp.name}</span>
                      <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{recentLogs.length} log · ultima {formatDate(lastLog.loggedAt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FASI ── */}
      {tab === "fasi" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>{client.phases.length} {client.phases.length === 1 ? "fase" : "fasi"}</p>
            <button onClick={() => setShowPhaseModal(true)} className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Plus size={14} /> Nuova fase
            </button>
          </div>
          {client.phases.length === 0 ? (
            <div className="text-center py-16 card-luxury rounded-2xl">
              <Activity size={40} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.25)" }} />
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>Nessuna fase pianificata</p>
              <button onClick={() => setShowPhaseModal(true)} className="mt-3 text-xs hover:underline" style={{ color: "var(--accent-light)" }}>Aggiungi la prima fase</button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...client.phases].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((phase) => (
                <div key={phase.id} className="card-luxury rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: phaseTypeColor[phase.type] }} />
                      <div>
                        <p className="font-semibold" style={{ color: "var(--ivory)" }}>{phase.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
                          {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${phaseTypeColor[phase.type]}18`, color: phaseTypeColor[phase.type] }}>
                        {phaseTypeLabel[phase.type]}
                      </span>
                      <button onClick={() => { updatePhase(client!.id, phase.id, { completed: !phase.completed }); dbPhases.update(phase.id, { completed: !phase.completed }).catch(() => {}); }}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-all">
                        {phase.completed ? <CheckCircle2 size={15} style={{ color: "#22c55e" }} /> : <Circle size={15} style={{ color: "rgba(245,240,232,0.35)" }} />}
                      </button>
                      <button onClick={async () => { removePhase(client!.id, phase.id); try { await dbPhases.remove(phase.id); } catch {} }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={14} style={{ color: "rgba(239,68,68,0.6)" }} />
                      </button>
                    </div>
                  </div>
                  {(phase.targetCalories || phase.targetWeight || phase.notes) && (
                    <div className="mt-3 pt-3 flex flex-wrap gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {phase.targetCalories && <div><p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Calorie target</p><p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{phase.targetCalories} kcal</p></div>}
                      {phase.targetWeight && <div><p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Peso target</p><p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{phase.targetWeight} kg</p></div>}
                      {phase.notes && <p className="text-xs w-full" style={{ color: "rgba(245,240,232,0.5)" }}>{phase.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCHEDE ── */}
      {tab === "schede" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>{client.workoutPlans.length} {client.workoutPlans.length === 1 ? "scheda" : "schede"}</p>
            <button onClick={() => setShowWorkoutModal(true)} className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Plus size={14} /> Nuova scheda
            </button>
          </div>

          {client.workoutPlans.length === 0 ? (
            <div className="text-center py-16 card-luxury rounded-2xl">
              <Dumbbell size={40} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.25)" }} />
              <p className="text-sm mb-1" style={{ color: "rgba(245,240,232,0.6)" }}>Nessuna scheda di allenamento</p>
              <p className="text-xs mb-4" style={{ color: "rgba(245,240,232,0.35)" }}>Crea la prima scheda e condividi il link col cliente</p>
              <button onClick={() => setShowWorkoutModal(true)} className="accent-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus size={14} /> Crea la prima scheda
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...client.workoutPlans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((wp) => {
                const linkedPhase = client.phases.find((ph) => ph.id === wp.phaseId);
                return (
                  <div key={wp.id} className="card-luxury rounded-2xl p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold" style={{ color: "var(--ivory)" }}>{wp.name}</p>
                          {wp.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Attiva</span>
                          )}
                          {linkedPhase && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${phaseTypeColor[linkedPhase.type]}18`, color: phaseTypeColor[linkedPhase.type] }}>
                              {linkedPhase.name}
                            </span>
                          )}
                        </div>
                        {wp.description && (
                          <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>{wp.description}</p>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => duplicatePlan(wp)}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                          title="Duplica scheda">
                          <Copy size={13} style={{ color: "rgba(245,240,232,0.45)" }} />
                        </button>
                        <button
                          onClick={() => setEditingPlan({ id: wp.id, name: wp.name, description: wp.description ?? "", daysPerWeek: String(wp.daysPerWeek), totalWeeks: String(wp.totalWeeks ?? 12), restSeconds: String(wp.restSeconds ?? 90), phaseId: wp.phaseId ?? "" })}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                          title="Modifica scheda">
                          <Pencil size={13} style={{ color: "rgba(245,240,232,0.45)" }} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Eliminare la scheda "${wp.name}"?`)) return;
                            removeWorkoutPlan(client!.id, wp.id);
                            try { await dbWorkoutPlans.remove(wp.id); } catch {}
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Elimina scheda">
                          <Trash2 size={13} style={{ color: "rgba(239,68,68,0.55)" }} />
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        { label: `${wp.daysPerWeek} giorni/sett` },
                        { label: `${wp.totalWeeks ?? 12} settimane` },
                        { label: `${wp.exercises.length} esercizi` },
                        ...(wp.restSeconds ? [{ label: formatRestTime(wp.restSeconds), icon: true }] : []),
                      ].map(({ label, icon }) => (
                        <span key={label} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          {icon && <Timer size={10} />}
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Share link + open */}
                    <div className="flex items-center gap-2 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {wp.shareToken && (
                        <button
                          onClick={() => copyPortalLink(wp.shareToken, wp.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                          style={copiedPlanId === wp.id
                            ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }
                            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,240,232,0.5)" }}>
                          {copiedPlanId === wp.id ? <><Check size={11} /> Link copiato!</> : <><Copy size={11} /> Portale cliente</>}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/clienti/${id}/schede/${wp.id}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
                        style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
                        <ExternalLink size={11} /> Apri &amp; Modifica
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DIETA ── */}
      {tab === "dieta" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>{client.dietPlans.length} piani</p>
            <button onClick={() => setShowDietModal(true)} className="accent-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <Plus size={14} /> Nuovo piano
            </button>
          </div>
          {client.dietPlans.length === 0 ? (
            <div className="text-center py-16 card-luxury rounded-2xl">
              <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.25)" }} />
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>Nessun piano alimentare</p>
              <button onClick={() => setShowDietModal(true)} className="mt-3 text-xs hover:underline" style={{ color: "var(--accent-light)" }}>Crea il primo piano</button>
            </div>
          ) : (
            <div className="space-y-4">
              {client.dietPlans.map((dp) => {
                const linkedPhase = client.phases.find((ph) => ph.id === dp.phaseId);
                return (
                  <div key={dp.id} className="card-luxury rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold" style={{ color: "var(--ivory)" }}>{dp.name}</p>
                          {dp.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Attivo</span>}
                          {linkedPhase && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${phaseTypeColor[linkedPhase.type]}18`, color: phaseTypeColor[linkedPhase.type] }}>
                              {linkedPhase.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={async () => { removeDietPlan(client!.id, dp.id); try { await dbDietPlans.remove(dp.id); } catch {} }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={14} style={{ color: "rgba(239,68,68,0.6)" }} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Calorie", value: formatCalories(dp.calories, dp.caloriesMax), color: "var(--accent)" },
                        { label: "Proteine", value: dp.proteinMax ? `${dp.protein}–${dp.proteinMax}g` : `${dp.protein}g`, color: "#a78bfa" },
                        { label: "Carboidrati", value: dp.carbsMax ? `${dp.carbs}–${dp.carbsMax}g` : `${dp.carbs}g`, color: "#38bdf8" },
                        { label: "Grassi", value: dp.fatMax ? `${dp.fat}–${dp.fatMax}g` : `${dp.fat}g`, color: "#fbbf24" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className="text-sm font-bold leading-tight" style={{ color }}>{value}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {dp.notes && <p className="text-xs mt-3" style={{ color: "rgba(245,240,232,0.45)" }}>{dp.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NOTE ── */}
      {tab === "note" && (
        <div>
          <div className="card-luxury rounded-2xl p-4 mb-4">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Aggiungi una nota sul cliente…"
              rows={3}
              className="w-full bg-transparent outline-none text-sm resize-none"
              style={{ color: "var(--ivory)" }} />
            <div className="flex justify-end mt-2">
              <button onClick={saveNote} disabled={!noteText.trim()}
                className="accent-btn px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40">
                <Plus size={13} /> Aggiungi nota
              </button>
            </div>
          </div>
          {client.notes.length === 0 ? (
            <div className="text-center py-10" style={{ color: "rgba(245,240,232,0.4)" }}>
              <StickyNote size={32} className="mx-auto mb-2" style={{ color: "rgba(255,107,43,0.2)" }} />
              <p className="text-sm">Nessuna nota ancora</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...client.notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((note) => (
                <div key={note.id} className="card-luxury rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm flex-1" style={{ color: "rgba(245,240,232,0.8)" }}>{note.content}</p>
                    <button onClick={async () => { removeNote(client!.id, note.id); try { await dbNotes.remove(note.id); } catch {} }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0">
                      <Trash2 size={13} style={{ color: "rgba(239,68,68,0.5)" }} />
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.3)" }}>{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Phase modal */}
      {showPhaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPhaseModal(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Nuova fase</h3>
              <button onClick={() => setShowPhaseModal(false)}><X size={16} style={{ color: "rgba(245,240,232,0.5)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Nome fase *</label>
                <input value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} placeholder="es. Bulk invernale" className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Tipo</label>
                  <select value={phaseForm.type} onChange={(e) => setPhaseForm({ ...phaseForm, type: e.target.value })} className={`${inputClass}`} style={selectStyle}>
                    <option value="bulk">Bulk</option><option value="cut">Cut</option><option value="maintenance">Mantenimento</option><option value="custom">Personalizzata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Calorie target</label>
                  <input type="number" value={phaseForm.targetCalories} onChange={(e) => setPhaseForm({ ...phaseForm, targetCalories: e.target.value })} placeholder="3200" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Data inizio *</label>
                  <input type="date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Data fine *</label>
                  <input type="date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Note</label>
                <textarea value={phaseForm.notes} onChange={(e) => setPhaseForm({ ...phaseForm, notes: e.target.value })} rows={2} placeholder="Obiettivi, indicazioni…" className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPhaseModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
              <button onClick={savePhase} disabled={saving} className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Salva fase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowWorkoutModal(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Nuova scheda</h3>
              <button onClick={() => setShowWorkoutModal(false)}><X size={16} style={{ color: "rgba(245,240,232,0.5)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Nome scheda *</label>
                <input value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })} placeholder="es. Scheda A — Push/Pull/Legs" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Descrizione</label>
                <textarea value={workoutForm.description} onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })} rows={2} placeholder="Obiettivi, note sulla scheda…" className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Giorni a settimana</label>
                  <select value={workoutForm.daysPerWeek} onChange={(e) => setWorkoutForm({ ...workoutForm, daysPerWeek: e.target.value })} className={inputClass} style={selectStyle}>
                    {[2,3,4,5,6].map((d) => <option key={d} value={d}>{d} giorni</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Durata (settimane)</label>
                  <select value={workoutForm.totalWeeks} onChange={(e) => setWorkoutForm({ ...workoutForm, totalWeeks: e.target.value })} className={inputClass} style={selectStyle}>
                    {[4,6,8,10,12,16,20,24].map((w) => <option key={w} value={w}>{w} settimane</option>)}
                  </select>
                </div>
                {client.phases.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Fase collegata</label>
                    <select value={workoutForm.phaseId} onChange={(e) => setWorkoutForm({ ...workoutForm, phaseId: e.target.value })} className={inputClass} style={selectStyle}>
                      <option value="">— nessuna —</option>
                      {client.phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowWorkoutModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
              <button onClick={saveWorkout} disabled={saving} className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Salva scheda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit workout plan modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingPlan(null)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Modifica scheda</h3>
              <button onClick={() => setEditingPlan(null)}><X size={16} style={{ color: "rgba(245,240,232,0.5)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Nome scheda *</label>
                <input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Descrizione</label>
                <textarea value={editingPlan.description} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  rows={2} className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Giorni a settimana</label>
                  <select value={editingPlan.daysPerWeek} onChange={(e) => setEditingPlan({ ...editingPlan, daysPerWeek: e.target.value })}
                    className={inputClass} style={selectStyle}>
                    {[2,3,4,5,6].map((d) => <option key={d} value={d}>{d} giorni</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Durata (settimane)</label>
                  <select value={editingPlan.totalWeeks} onChange={(e) => setEditingPlan({ ...editingPlan, totalWeeks: e.target.value })}
                    className={inputClass} style={selectStyle}>
                    {[4,6,8,10,12,16,20,24].map((w) => <option key={w} value={w}>{w} settimane</option>)}
                  </select>
                </div>
                {client.phases.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Fase collegata</label>
                    <select value={editingPlan.phaseId} onChange={(e) => setEditingPlan({ ...editingPlan, phaseId: e.target.value })}
                      className={inputClass} style={selectStyle}>
                      <option value="">— nessuna —</option>
                      {client.phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingPlan(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
                Annulla
              </button>
              <button onClick={saveEditPlan} disabled={saving || !editingPlan.name.trim()}
                className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />} Salva modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diet modal */}
      {showDietModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDietModal(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Nuovo piano alimentare</h3>
              <button onClick={() => setShowDietModal(false)}><X size={16} style={{ color: "rgba(245,240,232,0.5)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Nome piano *</label>
                <input value={dietForm.name} onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })} placeholder="es. Dieta Bulk — 3200 kcal" className={inputClass} style={inputStyle} />
              </div>

              {/* Calorie + macros */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Calorie totali *</label>
                  <input type="number" value={dietForm.calories} onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })}
                    placeholder="3200" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Proteine (g)</label>
                  <input type="number" value={dietForm.protein} onChange={(e) => setDietForm({ ...dietForm, protein: e.target.value })} placeholder="200" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Carboidrati (g)</label>
                  <input type="number" value={dietForm.carbs} onChange={(e) => setDietForm({ ...dietForm, carbs: e.target.value })} placeholder="350" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Grassi (g)</label>
                  <input type="number" value={dietForm.fat} onChange={(e) => setDietForm({ ...dietForm, fat: e.target.value })} placeholder="80" className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Live macro badge */}
              {showMacroBadge && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "rgba(245,240,232,0.5)" }}>Kcal dai macros:</span>
                  <span style={{ color: "var(--ivory)", fontWeight: 600 }}>{computedKcal.toFixed(0)} kcal</span>
                  {enteredKcal > 0 && (
                    <span style={{
                      color: Math.abs(kcalDiff) < 50 ? "#22c55e" : Math.abs(kcalDiff) < 150 ? "#f59e0b" : "#f87171",
                      fontWeight: 600,
                    }}>
                      {kcalDiff > 0 ? `+${kcalDiff.toFixed(0)}` : kcalDiff.toFixed(0)} vs inserite
                    </span>
                  )}
                </div>
              )}

              {client.phases.length > 0 && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Fase collegata</label>
                  <select value={dietForm.phaseId} onChange={(e) => setDietForm({ ...dietForm, phaseId: e.target.value })} className={inputClass} style={selectStyle}>
                    <option value="">— nessuna —</option>
                    {client.phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Note</label>
                <textarea value={dietForm.notes} onChange={(e) => setDietForm({ ...dietForm, notes: e.target.value })} rows={2} placeholder="Indicazioni, note…" className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowDietModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>Annulla</button>
              <button onClick={saveDiet} disabled={saving} className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Salva piano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
