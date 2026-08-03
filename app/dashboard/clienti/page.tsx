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
  Gift, Heart, TrendingUp, Zap, Clock, Ruler, Dumbbell, Flame
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

function TrainingSignature({ client }: { client: Client }) {
  const DAYS = 28;
  const now = Date.now();
  const allLogs = client.workoutPlans.flatMap(p => p.logs ?? []);
  const counts = Array.from({ length: DAYS }, (_, i) => {
    const dayStart = now - (DAYS - 1 - i) * 86400000;
    return allLogs.filter(l => {
      const t = new Date(l.loggedAt).getTime();
      return t >= dayStart && t < dayStart + 86400000;
    }).length;
  });
  if (counts.every(c => c === 0)) return null;
  const max = Math.max(...counts, 1);
  const W = 200, H = 14;
  const step = W / (DAYS - 1);
  const pts = counts.map((c, i) => ({
    x: i * step,
    y: c > 0 ? H - 2 - ((c / max) * (H - 6)) : H - 3,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[DAYS - 1];
  const isActive = counts[DAYS - 1] > 0 || counts[DAYS - 2] > 0;
  return (
    <div className="mt-3 pt-2" style={{ borderTop: "1px solid rgba(201,168,76,0.07)" }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`sig-${client.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(201,168,76,0)" />
            <stop offset="30%" stopColor="rgba(201,168,76,0.5)" />
            <stop offset="100%" stopColor={isActive ? "rgba(201,168,76,0.85)" : "rgba(201,168,76,0.4)"} />
          </linearGradient>
        </defs>
        <path d={path} stroke={`url(#sig-${client.id})`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {isActive && (
          <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="2.5" fill="rgba(201,168,76,0.9)" />
        )}
      </svg>
    </div>
  );
}

function AthleticFingerprint({ name, size = 44 }: { name: string; size?: number }) {
  const hue = clientHue(name);
  const src = name.length ? name : "X";
  const h = Array.from({ length: 10 }, (_, i) => src.charCodeAt(i % src.length));
  const uid = src.split("").reduce((a, c) => ((a * 31 + c.charCodeAt(0)) | 0), 0);
  const gradId = `fp${(uid < 0 ? -uid : uid).toString(36)}`;
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = size * 0.28;
  const spokes = 5 + (h[0] % 4);
  const pts = Array.from({ length: spokes }, (_, i) => {
    const angle = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    const r = outerR * (0.45 + 0.55 * (h[i % h.length] % 100) / 100);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const initials = src.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("").slice(0, 2);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor={`hsl(${hue},68%,62%)`} stopOpacity="0.25" />
          <stop offset="100%" stopColor={`hsl(${(hue + 30) % 360},55%,18%)`} stopOpacity="0.78" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={outerR} fill={`hsla(${hue},60%,50%,0.07)`} stroke={`hsla(${hue},60%,60%,0.2)`} strokeWidth="0.8" />
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke={`hsla(${hue},65%,62%,0.22)`} strokeWidth="0.6" />
      ))}
      <polygon points={poly} fill={`hsla(${hue},65%,55%,0.16)`} stroke={`hsla(${hue},70%,65%,0.75)`} strokeWidth="1.3" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="1.4" fill={`hsla(${hue},70%,68%,0.55)`} />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill={`url(#${gradId})`} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={`hsla(${hue},60%,60%,0.35)`} strokeWidth="0.8" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize={initials.length > 1 ? size * 0.27 : size * 0.32} fontWeight="900"
        fill={`hsl(${hue},70%,82%)`} fontFamily="system-ui,sans-serif">{initials}</text>
    </svg>
  );
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

function getWeekStreak(client: Client): number {
  const allLogs = client.workoutPlans.flatMap(p => p.logs ?? []);
  if (!allLogs.length) return 0;
  const now = Date.now();
  const thisWeekHasLog = allLogs.some(l => new Date(l.loggedAt).getTime() > now - 7 * 86400000);
  let streak = thisWeekHasLog ? 1 : 0;
  for (let w = 1; w < 52; w++) {
    const weekEnd = now - w * 7 * 86400000;
    const weekStart = weekEnd - 7 * 86400000;
    if (allLogs.some(l => { const t = new Date(l.loggedAt).getTime(); return t >= weekStart && t < weekEnd; })) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getRiskDays(client: Client): number | null {
  if (client.status !== "attivo") return null;
  const last = getLastLogDate(client);
  const ref = last ?? (client.startDate ? new Date(client.startDate) : null);
  if (!ref) return null;
  const days = Math.floor((Date.now() - ref.getTime()) / 86400000);
  return days >= 7 ? days : null;
}

interface DailyPriority {
  client: Client;
  reason: string;
  urgency: number;
  icon: "risk" | "expiry" | "progression" | "measurement" | "streak";
}

function getDailyPriorities(clients: Client[]): DailyPriority[] {
  const now = Date.now();
  const priorities: DailyPriority[] = [];

  for (const c of clients) {
    if (c.status !== "attivo") continue;

    const allLogs = c.workoutPlans.flatMap(p => p.logs ?? []);
    const lastLog = allLogs.length
      ? Math.max(...allLogs.map(l => new Date(l.loggedAt).getTime()))
      : null;
    const daysSinceLog = lastLog ? Math.floor((now - lastLog) / 86400000) : null;

    if (daysSinceLog !== null && daysSinceLog >= 5) {
      priorities.push({
        client: c,
        reason: `Nessun log da ${daysSinceLog} giorni`,
        urgency: 100 + daysSinceLog,
        icon: "risk",
      });
      continue;
    }

    // Striscia a rischio: streak >= 3, no log questa settimana, siamo a mercoledi o oltre
    const dayOfWeek = new Date().getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
    const isLateEnough = dayOfWeek === 0 || dayOfWeek >= 3; // Mer, Gio, Ven, Sab, Dom
    const thisWeekHasLog = allLogs.some(l => new Date(l.loggedAt).getTime() > now - 7 * 86400000);
    if (isLateEnough && !thisWeekHasLog) {
      const streak = getWeekStreak(c);
      if (streak >= 3) {
        priorities.push({
          client: c,
          reason: `Striscia di ${streak} settimane a rischio`,
          urgency: 95 + streak,
          icon: "streak",
        });
        continue;
      }
    }

    const activePlan = c.workoutPlans.find(p => p.active);
    if (activePlan && activePlan.totalWeeks) {
      const planLogs = activePlan.logs ?? [];
      const maxWeek = planLogs.length
        ? Math.max(...planLogs.map(l => l.weekNumber))
        : 0;
      const weeksLeft = activePlan.totalWeeks - maxWeek;
      if (weeksLeft <= 2 && weeksLeft > 0) {
        priorities.push({
          client: c,
          reason: weeksLeft === 1 ? "Ultima settimana di piano" : "Piano scade fra 2 settimane",
          urgency: 90 - weeksLeft,
          icon: "expiry",
        });
        continue;
      }
    }

    const progReady = getProgressionReady(c);
    if (progReady >= 3) {
      priorities.push({
        client: c,
        reason: `${progReady} esercizi pronti per +carico`,
        urgency: 60 + progReady,
        icon: "progression",
      });
      continue;
    }

    const lastMeasurement = c.measurements?.length
      ? Math.max(...c.measurements.map(m => new Date(m.date).getTime()))
      : null;
    const daysSinceMeasurement = lastMeasurement
      ? Math.floor((now - lastMeasurement) / 86400000)
      : null;
    if (daysSinceMeasurement !== null && daysSinceMeasurement >= 30) {
      priorities.push({
        client: c,
        reason: `Misurazioni da ${daysSinceMeasurement} giorni`,
        urgency: 40 + Math.min(daysSinceMeasurement, 30),
        icon: "measurement",
      });
    }
  }

  return priorities.sort((a, b) => b.urgency - a.urgency).slice(0, 4);
}

const priorityIconMap = {
  risk: TrendingDown,
  expiry: Clock,
  progression: Dumbbell,
  measurement: Ruler,
  streak: Flame,
};
const priorityColorMap = {
  risk: "#ef4444",
  expiry: "#f59e0b",
  progression: "#22c55e",
  measurement: "#38bdf8",
  streak: "#f97316",
};

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
    const snapshot = useAppStore.getState().clients.find((c) => c.id === id);
    removeClient(id);
    try {
      await dbClients.remove(id);
    } catch {
      // DB delete failed: restore the client so UI and DB stay in sync
      if (snapshot) useAppStore.setState((s) => ({ clients: [...s.clients, snapshot] }));
      alert("Errore nell'eliminazione del cliente. Riprova.");
    }
  }

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in">
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

      {/* Priorita del Giorno */}
      {(() => {
        const priorities = getDailyPriorities(clients);
        if (!priorities.length) return null;
        const today = new Date();
        const dayNames = ["Domenica", "Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato"];
        const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        return (
          <div className="mb-6 card-luxury rounded-2xl p-4 fade-in"
            style={{ borderLeft: "3px solid var(--accent)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                Priorita del Giorno
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>
                {dayNames[today.getDay()]} {today.getDate()} {monthNames[today.getMonth()]}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {priorities.map((p, i) => {
                const Icon = priorityIconMap[p.icon];
                const color = priorityColorMap[p.icon];
                return (
                  <Link key={p.client.id}
                    href={`/dashboard/clienti/${p.client.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:brightness-125"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}15` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                        {p.client.name}
                      </p>
                      <p className="text-xs truncate" style={{ color }}>
                        {p.reason}
                      </p>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: `${color}18`, color, fontSize: "9px" }}>
                      {i + 1}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

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
          const weekStreak = getWeekStreak(client);
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
                <AthleticFingerprint name={client.name} size={44} />
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
                {client.monthlyFee != null && <span style={{ color: "var(--accent-light)" }}>€{client.monthlyFee}/m</span>}
                {weekStreak >= 2 && (
                  <span className="flex items-center gap-1 font-semibold"
                    style={{ color: weekStreak >= 5 ? "#f97316" : weekStreak >= 3 ? "#fb923c" : "rgba(249,115,22,0.7)" }}>
                    <Flame size={10} style={{ color: weekStreak >= 5 ? "#f97316" : weekStreak >= 3 ? "#fb923c" : "rgba(249,115,22,0.7)" }} />
                    {weekStreak}w
                  </span>
                )}
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
            <TrainingSignature client={client} />
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
