"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbFeedback, type FeedbackNote } from "@/lib/db";
import { MessageSquare, Bug, Lightbulb, Zap, Loader2, CheckCircle2, Clock, AlertCircle, Users, Filter } from "lucide-react";

const CATEGORY_META = {
  bug:         { label: "Bug",           color: "#f87171", bg: "rgba(239,68,68,0.12)",    Icon: Bug },
  improvement: { label: "Miglioramento", color: "#FF9A6C", bg: "rgba(255,107,43,0.12)",   Icon: Zap },
  idea:        { label: "Idea",          color: "#a78bfa", bg: "rgba(123,47,190,0.12)",   Icon: Lightbulb },
} as const;

const STATUS_META = {
  nuovo:     { label: "Nuovo",      color: "#38bdf8", bg: "rgba(56,189,248,0.12)",   Icon: AlertCircle },
  in_review: { label: "In review",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)",   Icon: Clock },
  fatto:     { label: "Fatto",      color: "#22c55e", bg: "rgba(34,197,94,0.12)",    Icon: CheckCircle2 },
} as const;

const ADMIN_EMAIL = "raffaele.dinora0409@gmail.com";

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [notes,      setNotes]      = useState<FeedbackNote[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [catFilter,  setCatFilter]  = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace("/dashboard");
        return;
      }
      setAuthorized(true);
      try {
        const all = await dbFeedback.listAll();
        setNotes(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function setStatus(id: string, status: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: status as FeedbackNote["status"] } : n));
    await dbFeedback.updateStatus(id, status);
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080608" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  // Derived data
  const trainers = Array.from(new Set(notes.map(n => n.trainer_email).filter(Boolean))) as string[];
  const filtered = notes.filter(n => {
    if (catFilter    !== "all" && n.category !== catFilter)      return false;
    if (statusFilter !== "all" && n.status   !== statusFilter)   return false;
    if (trainerFilter !== "all" && n.trainer_email !== trainerFilter) return false;
    return true;
  });

  const counts = {
    bug:         notes.filter(n => n.category === "bug").length,
    improvement: notes.filter(n => n.category === "improvement").length,
    idea:        notes.filter(n => n.category === "idea").length,
    nuovo:       notes.filter(n => n.status   === "nuovo").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#080608", color: "#f5f0ff" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E53232, #AA1515)", boxShadow: "0 0 20px rgba(229,50,50,0.3)" }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#f5f0ff" }}>Supervisor Panel</h1>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
              Feedback da tutti i trainer · {notes.length} note totali
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Bug aperti",         value: counts.bug,         color: "#f87171" },
            { label: "Miglioramenti",      value: counts.improvement, color: "#FF9A6C" },
            { label: "Idee",               value: counts.idea,        color: "#a78bfa" },
            { label: "Da leggere (nuovi)", value: counts.nuovo,       color: "#38bdf8" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-5">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
            <Filter size={12} /> Filtra:
          </div>
          {/* Category */}
          {["all", "bug", "improvement", "idea"].map(v => (
            <button key={v} onClick={() => setCatFilter(v)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: catFilter === v ? "rgba(229,50,50,0.18)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${catFilter === v ? "rgba(229,50,50,0.4)" : "rgba(255,255,255,0.07)"}`,
                color: catFilter === v ? "#FF9A6C" : "rgba(245,240,232,0.5)",
              }}>
              {v === "all" ? "Tutte le categorie" : CATEGORY_META[v as keyof typeof CATEGORY_META].label}
            </button>
          ))}
          {/* Status */}
          {["all", "nuovo", "in_review", "fatto"].map(v => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: statusFilter === v ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${statusFilter === v ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`,
                color: statusFilter === v ? "#38bdf8" : "rgba(245,240,232,0.5)",
              }}>
              {v === "all" ? "Tutti gli status" : STATUS_META[v as keyof typeof STATUS_META].label}
            </button>
          ))}
        </div>

        {/* Trainer filter */}
        {trainers.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-5 items-center">
            <Users size={13} style={{ color: "rgba(245,240,232,0.4)" }} />
            <button onClick={() => setTrainerFilter("all")}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: trainerFilter === "all" ? "rgba(123,47,190,0.18)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${trainerFilter === "all" ? "rgba(123,47,190,0.4)" : "rgba(255,255,255,0.07)"}`,
                color: trainerFilter === "all" ? "#a78bfa" : "rgba(245,240,232,0.5)",
              }}>
              Tutti i trainer
            </button>
            {trainers.map(email => (
              <button key={email} onClick={() => setTrainerFilter(email)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: trainerFilter === email ? "rgba(123,47,190,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${trainerFilter === email ? "rgba(123,47,190,0.4)" : "rgba(255,255,255,0.07)"}`,
                  color: trainerFilter === email ? "#a78bfa" : "rgba(245,240,232,0.5)",
                }}>
                {notes.find(n => n.trainer_email === email)?.trainer_name ?? email}
              </button>
            ))}
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="text-center py-20"><Loader2 size={28} className="animate-spin mx-auto" style={{ color: "#FF9A6C" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(245,240,232,0.4)" }}>Nessuna nota corrisponde ai filtri.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(note => {
              const cat    = CATEGORY_META[note.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.improvement;
              const st     = STATUS_META[note.status as keyof typeof STATUS_META] ?? STATUS_META.nuovo;
              const CatIcon = cat.Icon;
              const StIcon  = st.Icon;
              return (
                <div key={note.id} className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start gap-4">
                    {/* Category icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cat.bg }}>
                      <CatIcon size={16} style={{ color: cat.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title + badges */}
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                        <p className="font-bold text-sm" style={{ color: "#f5f0ff" }}>{note.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                            style={{ background: st.bg, color: st.color }}>
                            <StIcon size={10} /> {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(245,240,232,0.6)" }}>
                        {note.description}
                      </p>

                      {/* Trainer + date */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
                          <Users size={11} />
                          <span className="font-semibold" style={{ color: "rgba(245,240,232,0.65)" }}>
                            {note.trainer_name ?? "—"}
                          </span>
                          {note.trainer_email && (
                            <span>· {note.trainer_email}</span>
                          )}
                        </div>
                        <span className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
                          {new Date(note.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Status actions */}
                      <div className="flex gap-2 mt-3">
                        {(["nuovo", "in_review", "fatto"] as const).map(s => (
                          <button key={s} onClick={() => setStatus(note.id, s)}
                            disabled={note.status === s}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                            style={{
                              background: note.status === s ? STATUS_META[s].bg : "rgba(255,255,255,0.04)",
                              border: `1px solid ${note.status === s ? STATUS_META[s].color + "50" : "rgba(255,255,255,0.08)"}`,
                              color: note.status === s ? STATUS_META[s].color : "rgba(245,240,232,0.4)",
                            }}>
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
