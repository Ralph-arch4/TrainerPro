"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { dbClients } from "@/lib/db";
import {
  Users, Plus, Search, ChevronRight,
  Mail, Phone, Activity, Loader2, X, AlertCircle, Trash2, TrendingDown,
  Gift, Heart, TrendingUp
} from "lucide-react";
import type { Client } from "@/lib/store";

type Status = "tutti" | "attivo" | "in_pausa" | "inattivo";
type Goal = "tutti" | "dimagrimento" | "massa" | "tonificazione" | "performance";

const goalLabel: Record<string, string> = {
  dimagrimento: "Dimagrimento",
  massa: "Massa",
  tonificazione: "Tonificazione",
  performance: "Performance",
};
const goalColor: Record<string, string> = {
  dimagrimento: "#38bdf8",
  massa: "#a78bfa",
  tonificazione: "#34d399",
  performance: "#C9A84C",
};
const statusLabel: Record<string, string> = {
  attivo: "Attivo",
  in_pausa: "In pausa",
  inattivo: "Inattivo",
};
const statusColor: Record<string, string> = {
  attivo: "#22c55e",
  in_pausa: "#f59e0b",
  inattivo: "#6b7280",
};

const levelLabel: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzato: "Avanzato",
};

function clientHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

function getFormaScore(client: Client): { score: number; label: string; color: string } | null {
  if (client.status !== "attivo") return null;
  const now = Date.now();
  const allLogs = client.workoutPlans.flatMap(p => p.logs ?? []);

  const activePlan = client.workoutPlans.find(p => p.active);
  const target = Math.max(1, activePlan?.daysPerWeek ?? 3);
  const weekDays = new Set(
    allLogs.filter(l => new Date(l.loggedAt).getTime() > now - 7 * 86400000)
      .map(l => new Date(l.loggedAt).toDateString())
  );
  const freqScore = Math.min(40, Math.round((weekDays.size / target) * 40));

  const weeksWithSessions = [3, 2, 1, 0].filter(wAgo => {
    const from = now - (wAgo + 1) * 7 * 86400000;
    const to   = now - wAgo * 7 * 86400000;
    return allLogs.some(l => { const t = new Date(l.loggedAt).getTime(); return t > from && t <= to; });
  }).length;
  const consScore = Math.round((weeksWithSessions / 4) * 30);

  let progScore = 15;
  const weighted = allLogs.filter(l => l.weight != null)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  if (weighted.length >= 4) {
    const rAvg = weighted.slice(0, 2).reduce((s, l) => s + l.weight!, 0) / 2;
    const oAvg = weighted.slice(2, 4).reduce((s, l) => s + l.weight!, 0) / 2;
    progScore = rAvg > oAvg + 0.5 ? 30 : rAvg < oAvg - 0.5 ? 5 : 15;
  }

  const score = freqScore + consScore + progScore;
  const label = score >= 80 ? "In forma" : score >= 55 ? "Costante" : score >= 30 ? "Intermittente" : "Inattivo";
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#fbbf24" : score >= 30 ? "#f97316" : "#ef4444";
  return { score, label, color };
}

function getLastLogDate(client: Client): Date | null {
  const allLogs = client.workoutPlans.flatMap(p => p.logs ?? []);
  if (!allLogs.length) return null;
  return new Date(Math.max(...allLogs.map(l => new Date(l.loggedAt).getTime())));
}

function getBirthdayStatus(client: Client): { daysUntil: number; isToday: boolean } | null {
  const bd = (client as Client & { birthDate?: string }).birthDate;
  if (!bd) return null;
  const now = new Date();
  const birth = new Date(bd);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYearBd = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  let diff = Math.round((thisYearBd.getTime() - todayStart.getTime()) / 86400000);
  if (diff < 0) {
    const nextYearBd = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
    diff = Math.round((nextYearBd.getTime() - todayStart.getTime()) / 86400000);
  }
  if (diff > 7) return null;
  return { daysUntil: diff, isToday: diff === 0 };
}

function getTogetherLabel(client: Client): string | null {
  if (!client.startDate) return null;
  const days = Math.floor((Date.now() - new Date(client.startDate).getTime()) / 86400000);
  if (days < 14) return null;
  if (days < 60) return `${days} giorni insieme`;
  if (days < 365) return `${Math.floor(days / 30)} mesi insieme`;
  const y = Math.floor(days / 365);
  return `${y} ${y === 1 ? "anno" : "anni"} insieme`;
}

function getProgressionReady(client: Client): number {
  const activePlan = client.workoutPlans.find(p => p.active);
  if (!activePlan || !activePlan.logs?.length) return 0;
  let readyCount = 0;
  const exerciseIds = [...new Set(activePlan.exercises.map(e => e.id))];
  for (const exId of exerciseIds) {
    const logs = (activePlan.logs ?? [])
      .filter(l => l.exerciseId === exId && l.weight != null && l.weight > 0)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 3);
    if (logs.length >= 3 && logs.every(l => l.weight === logs[0].weight)) readyCount++;
  }
  return readyCount;
}

function getRiskDays(client: Client): number | null {
  if (client.status !== "attivo") return null;
  const last = getLastLogDate(client);
  const ref = last ?? (client.startDate ? new Date(client.startDate) : null);
  if (!ref) return null;
  const days = Math.floor((Date.now() - ref.getTime()) / 86400000);
  return days >= 7 ? days : null;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  goal: string;
  level: string;
  status: string;
  monthlyFee: string;
  birthDate: string;
}

const emptyForm: ClientFormData = {
  name: "", email: "", phone: "", goal: "massa", level: "principiante",
  status: "attivo", monthlyFee: "", birthDate: "",
};

function ClientiPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.user);
  const clients = useAppStore((s) => s.clients);
  const addClient = useAppStore((s) => s.addClient);
  const removeClient = useAppStore((s) => s.removeClient);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status>("tutti");
  const [filterGoal, setFilterGoal] = useState<Goal>("tutti");
  const [showModal, setShowModal] = useState(false);

  // Auto-open modal when navigating with ?new=1 (e.g. from dashboard quick actions)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openModal();
      router.replace("/dashboard/clienti");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tutti" || c.status === filterStatus;
    const matchGoal = filterGoal === "tutti" || c.goal === filterGoal;
    return matchSearch && matchStatus && matchGoal;
  });

  function openModal() {
    setForm(emptyForm);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !user) return;
    setSaving(true);
    setSaveError("");

    const payload = {
      userId:     user.id,
      name:       form.name.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      goal:       (form.goal || undefined) as "dimagrimento" | "massa" | "tonificazione" | "performance" | undefined,
      level:      form.level as "principiante" | "intermedio" | "avanzato",
      status:     form.status as "attivo" | "inattivo" | "in_pausa",
      monthlyFee: form.monthlyFee ? parseFloat(form.monthlyFee) : undefined,
      birthDate:  form.birthDate || undefined,
      startDate:  new Date().toISOString().split("T")[0],
    };

    const newClient = addClient(payload);
    try {
      await dbClients.create({ ...newClient });
      setSaving(false);
      setShowModal(false);
      router.push(`/dashboard/clienti/${newClient.id}`);
    } catch (err) {
      removeClient(newClient.id);
      setSaveError(err instanceof Error ? err.message : "Errore nel salvataggio. Riprova.");
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Eliminare "${name}"? Questa azione è irreversibile.`)) return;
    removeClient(id);
    try { await dbClients.remove(id); } catch {}
  }

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Clienti</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {clients.length} {clients.length === 1 ? "cliente" : "clienti"} totali
          </p>
        </div>
        <button onClick={openModal} className="accent-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
          <Plus size={16} /> Nuovo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--text)" }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--text)" }}>
          <option value="tutti">Tutti gli stati</option>
          <option value="attivo">Attivi</option>
          <option value="in_pausa">In pausa</option>
          <option value="inattivo">Inattivi</option>
        </select>
        <select value={filterGoal} onChange={(e) => setFilterGoal(e.target.value as Goal)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--text)" }}>
          <option value="tutti">Tutti gli obiettivi</option>
          <option value="massa">Massa</option>
          <option value="dimagrimento">Dimagrimento</option>
          <option value="tonificazione">Tonificazione</option>
          <option value="performance">Performance</option>
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 card-luxury rounded-2xl">
          <Users size={48} className="mx-auto mb-4" style={{ color: "rgba(255,107,43,0.25)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
            {clients.length === 0 ? "Nessun cliente ancora" : "Nessun risultato"}
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--text-dim)" }}>
            {clients.length === 0 ? "Aggiungi il tuo primo cliente per iniziare" : "Prova a modificare i filtri"}
          </p>
          {clients.length === 0 && (
            <button onClick={openModal} className="accent-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus size={15} /> Aggiungi cliente
            </button>
          )}
        </div>
      )}

      {/* Client grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client, i) => {
          const riskDays = getRiskDays(client);
          const forma = getFormaScore(client);
          const birthdayInfo = getBirthdayStatus(client);
          const togetherLabel = getTogetherLabel(client);
          const progressionReady = getProgressionReady(client);
          const hue = clientHue(client.name);
          return (
          <Reveal key={client.id} delay={Math.min(i, 8) * 0.06}>
          <Link href={`/dashboard/clienti/${client.id}`}
            className="card-luxury rounded-2xl p-5 transition-all group block"
            style={{ borderColor: riskDays ? "rgba(239,68,68,0.25)" : birthdayInfo ? "rgba(251,191,36,0.2)" : undefined }}>
            {/* Top banner: rischio o compleanno */}
            {riskDays ? (
              <div className="flex items-center gap-2 -mx-5 -mt-5 mb-4 px-4 py-2 rounded-t-2xl"
                style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f87171" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#ef4444" }} />
                </span>
                <TrendingDown size={11} style={{ color: "#f87171" }} />
                <span className="text-xs font-bold" style={{ color: "#f87171" }}>
                  Nessun log da {riskDays} giorni — a rischio
                </span>
                {birthdayInfo && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: "#fbbf24" }}>
                    <Gift size={10} />
                    {birthdayInfo.isToday ? "Compl. oggi!" : `Compl. tra ${birthdayInfo.daysUntil}gg`}
                  </span>
                )}
              </div>
            ) : birthdayInfo ? (
              <div className="flex items-center gap-2 -mx-5 -mt-5 mb-4 px-4 py-2 rounded-t-2xl"
                style={{ background: "rgba(251,191,36,0.1)", borderBottom: "1px solid rgba(251,191,36,0.2)" }}>
                <Gift size={11} style={{ color: "#fbbf24" }} />
                <span className="text-xs font-bold" style={{ color: "#fbbf24" }}>
                  {birthdayInfo.isToday
                    ? `Buon compleanno, ${client.name.split(" ")[0]}!`
                    : `Compleanno tra ${birthdayInfo.daysUntil} ${birthdayInfo.daysUntil === 1 ? "giorno" : "giorni"}`}
                </span>
              </div>
            ) : null}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue} 68% 46%), hsl(${(hue + 48) % 360} 62% 30%))`,
                    boxShadow: `0 3px 12px hsl(${hue} 60% 40% / 0.4), inset 0 1px 0 rgba(255,255,255,0.18)`,
                  }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{client.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[client.status] }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{statusLabel[client.status]}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDelete(client.id, client.name, e)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 transition-all"
                  title="Elimina cliente">
                  <Trash2 size={14} style={{ color: "rgba(239,68,68,0.7)" }} />
                </button>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all mt-0.5" style={{ color: "var(--accent-light)" }} />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {client.email && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Mail size={12} /> <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Phone size={12} /> {client.phone}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              {client.goal ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${goalColor[client.goal]}18`, color: goalColor[client.goal] }}>
                  {goalLabel[client.goal]}
                </span>
              ) : <span />}
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-dim)" }}>
                {togetherLabel && (
                  <span className="flex items-center gap-1">
                    <Heart size={10} style={{ color: "rgba(229,50,50,0.55)" }} />
                    {togetherLabel}
                  </span>
                )}
                <span className="flex items-center gap-1"><Activity size={11} /> {client.phases.length} fasi</span>
                {client.monthlyFee && <span style={{ color: "var(--accent-light)" }}>€{client.monthlyFee}/m</span>}
              </div>
            </div>
            {(forma || progressionReady > 0) && (
              <div className="mt-3 pt-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {forma ? (
                  <>
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>Indice forma</span>
                    <div className="flex items-center gap-2">
                      {progressionReady > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                          <TrendingUp size={10} />
                          {progressionReady} {progressionReady === 1 ? "esercizio" : "esercizi"} +
                        </span>
                      )}
                      <div className="relative w-7 h-7 flex-shrink-0">
                        <svg className="w-7 h-7" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 28 28">
                          <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                          <circle cx="14" cy="14" r="11" fill="none" stroke={forma.color} strokeWidth="3"
                            strokeDasharray={`${((forma.score / 100) * 69.11).toFixed(1)} 69.11`}
                            strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-bold"
                          style={{ fontSize: "7px", color: forma.color }}>{forma.score}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: forma.color }}>{forma.label}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>Progressione</span>
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <TrendingUp size={10} />
                      {progressionReady} {progressionReady === 1 ? "esercizio pronto" : "esercizi pronti"} per aumento carico
                    </span>
                  </>
                )}
              </div>
            )}
          </Link>
          </Reveal>
          );
        })}
      </div>

      {/* Add client modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0" style={{ background: "var(--surface-modal)" }} />
          <div className="relative w-full max-w-lg glass-dark rounded-2xl p-6 fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Nuovo cliente</h2>
              <button onClick={() => { setShowModal(false); setSaveError(""); }} className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            {saveError && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-xs"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                <AlertCircle size={13} /> {saveError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Nome completo *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Mario Rossi" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@esempio.com" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Telefono</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+39 333 123 4567" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Data di nascita</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Quota mensile (€)</label>
                  <input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                    placeholder="150" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Obiettivo</label>
                  <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }}>
                    <option value="massa">Massa muscolare</option>
                    <option value="dimagrimento">Dimagrimento</option>
                    <option value="tonificazione">Tonificazione</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Livello</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }}>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzato">Avanzato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Stato</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }}>
                    <option value="attivo">Attivo</option>
                    <option value="in_pausa">In pausa</option>
                    <option value="inattivo">Inattivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                Annulla
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? "Salvataggio…" : "Aggiungi cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientiPage() {
  return (
    <Suspense>
      <ClientiPageInner />
    </Suspense>
  );
}
