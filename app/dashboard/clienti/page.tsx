"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { checkLimit } from "@/lib/plan-limits";
import { dbClients } from "@/lib/db";
import {
  Users, Plus, Search, ChevronRight,
  Mail, Phone, Activity, Loader2, X, AlertCircle
} from "lucide-react";

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
  performance: "#fb923c",
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
  const [limitError, setLimitError] = useState("");
  const [saveError, setSaveError] = useState("");

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tutti" || c.status === filterStatus;
    const matchGoal = filterGoal === "tutti" || c.goal === filterGoal;
    return matchSearch && matchStatus && matchGoal;
  });

  function openModal() {
    const { allowed, message } = checkLimit(user?.plan ?? "free", "clients", clients.length);
    if (!allowed) { setLimitError(message); return; }
    setLimitError("");
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeClient(id);
    try { await dbClients.remove(id); } catch {}
  }

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Clienti</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
            {clients.length} {clients.length === 1 ? "cliente" : "clienti"} totali
          </p>
        </div>
        <button onClick={openModal} className="accent-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
          <Plus size={16} /> Nuovo cliente
        </button>
      </div>

      {/* Limit error */}
      {limitError && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          <AlertCircle size={15} />
          {limitError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(245,240,232,0.35)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}>
          <option value="tutti">Tutti gli stati</option>
          <option value="attivo">Attivi</option>
          <option value="in_pausa">In pausa</option>
          <option value="inattivo">Inattivi</option>
        </select>
        <select value={filterGoal} onChange={(e) => setFilterGoal(e.target.value as Goal)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" }}>
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
          <p className="font-semibold mb-1" style={{ color: "var(--ivory)" }}>
            {clients.length === 0 ? "Nessun cliente ancora" : "Nessun risultato"}
          </p>
          <p className="text-sm mb-5" style={{ color: "rgba(245,240,232,0.4)" }}>
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
        {filtered.map((client) => (
          <Link key={client.id} href={`/dashboard/clienti/${client.id}`}
            className="card-luxury rounded-2xl p-5 hover:border-[rgba(255,107,43,0.3)] transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl accent-btn flex items-center justify-center text-base font-bold flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--ivory)" }}>{client.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[client.status] }} />
                    <span className="text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>{statusLabel[client.status]}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all mt-1" style={{ color: "var(--accent-light)" }} />
            </div>

            <div className="space-y-2 mb-4">
              {client.email && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>
                  <Mail size={12} /> <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(245,240,232,0.5)" }}>
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
              <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                <span className="flex items-center gap-1"><Activity size={11} /> {client.phases.length} fasi</span>
                {client.monthlyFee && <span style={{ color: "var(--accent-light)" }}>€{client.monthlyFee}/m</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Add client modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          <div className="relative w-full max-w-lg glass-dark rounded-2xl p-6 fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--ivory)" }}>Nuovo cliente</h2>
              <button onClick={() => { setShowModal(false); setSaveError(""); }} className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} style={{ color: "rgba(245,240,232,0.5)" }} />
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
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Nome completo *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Mario Rossi" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@esempio.com" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Telefono</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+39 333 123 4567" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Data di nascita</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Quota mensile (€)</label>
                  <input type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                    placeholder="150" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Obiettivo</label>
                  <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>
                    <option value="massa">Massa muscolare</option>
                    <option value="dimagrimento">Dimagrimento</option>
                    <option value="tonificazione">Tonificazione</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Livello</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzato">Avanzato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.6)" }}>Stato</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>
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
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.6)" }}>
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
