"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, Loader2, Bug, Lightbulb, Zap, X } from "lucide-react";
import { dbFeedback, type FeedbackNote } from "@/lib/db";
import { showToast } from "@/components/Toast";

type Category = "bug" | "improvement" | "idea";

const CATEGORY_META: Record<Category, { label: string; color: string; bg: string; icon: React.FC<{ size?: number }> }> = {
  bug:         { label: "Bug",          color: "#f87171", bg: "rgba(239,68,68,0.12)",    icon: Bug },
  improvement: { label: "Miglioramento", color: "var(--accent-light)", bg: "rgba(255,107,43,0.12)", icon: Zap },
  idea:        { label: "Idea",          color: "#a78bfa", bg: "rgba(123,47,190,0.12)",  icon: Lightbulb },
};

const emptyForm = () => ({ title: "", category: "improvement" as Category, description: "" });

export default function TalkWithRalphPage() {
  const [notes,   setNotes]   = useState<FeedbackNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState(emptyForm());
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    dbFeedback.list()
      .then(setNotes)
      .catch(() => showToast("Errore nel caricamento note", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const created = await dbFeedback.create(form);
      setNotes(prev => [created, ...prev]);
      setForm(emptyForm());
      setOpen(false);
      showToast("Nota inviata a Ralph");
    } catch { showToast("Errore nel salvataggio", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    try { await dbFeedback.remove(id); }
    catch { showToast("Errore nell'eliminazione", "error"); }
  }

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" };
  const labelStyle = { color: "rgba(245,240,232,0.6)" };

  return (
    <div className="p-4 pt-20 lg:pt-8 lg:p-8 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl accent-btn flex items-center justify-center flex-shrink-0">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Talk with Ralph</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
              Segnala bug, idee o miglioramenti per la piattaforma
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(true)}
          className="accent-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={15} /> Nuova nota
        </button>
      </div>

      {/* Empty state */}
      {!loading && notes.length === 0 && (
        <div className="text-center py-20 card-luxury rounded-2xl">
          <MessageSquare size={44} className="mx-auto mb-4" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="text-sm font-semibold mb-1" style={{ color: "rgba(245,240,232,0.6)" }}>
            Nessuna nota ancora
          </p>
          <p className="text-xs max-w-xs mx-auto mb-5" style={{ color: "rgba(245,240,232,0.35)" }}>
            Hai trovato un bug? Un&apos;idea per migliorare la piattaforma? Scrivila qui — Ralph la leggerà.
          </p>
          <button onClick={() => setOpen(true)} className="accent-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
            <Plus size={14} /> Scrivi la prima nota
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-luxury rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-48 rounded mb-2" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Notes list */}
      {!loading && notes.length > 0 && (
        <div className="space-y-3">
          {/* Category summary */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {(["bug", "improvement", "idea"] as Category[]).map(cat => {
              const count = notes.filter(n => n.category === cat).length;
              if (count === 0) return null;
              const { label, color, bg } = CATEGORY_META[cat];
              return (
                <span key={cat} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: bg, color }}>
                  {count} {label}{count !== 1 ? (cat === "bug" ? "" : "i") : ""}
                </span>
              );
            })}
          </div>

          {notes.map(note => {
            const meta = CATEGORY_META[note.category as Category] ?? CATEGORY_META.improvement;
            const Icon = meta.icon;
            return (
              <div key={note.id} className="card-luxury rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: meta.bg }}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm" style={{ color: "var(--ivory)" }}>{note.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.6)" }}>
                      {note.description}
                    </p>
                    <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.3)" }}>
                      {new Date(note.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(note.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0"
                    title="Elimina nota">
                    <Trash2 size={14} style={{ color: "rgba(239,68,68,0.5)" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New note modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          <div className="relative w-full max-w-md glass-dark rounded-2xl p-6 fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl accent-btn flex items-center justify-center">
                  <MessageSquare size={15} />
                </div>
                <h3 className="text-base font-bold" style={{ color: "var(--ivory)" }}>Nuova nota</h3>
              </div>
              <button onClick={() => setOpen(false)}>
                <X size={16} style={{ color: "rgba(245,240,232,0.5)" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-medium mb-2" style={labelStyle}>Tipo</label>
                <div className="flex gap-2">
                  {(["bug", "improvement", "idea"] as Category[]).map(cat => {
                    const { label, color, bg } = CATEGORY_META[cat];
                    return (
                      <button key={cat}
                        onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: form.category === cat ? bg : "rgba(255,255,255,0.04)",
                          border: `1px solid ${form.category === cat ? color : "rgba(255,255,255,0.08)"}`,
                          color: form.category === cat ? color : "rgba(245,240,232,0.45)",
                        }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Titolo *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="es. Il timer non si azzera dopo il salvataggio"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Descrizione *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Spiega il problema o l'idea nel dettaglio..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
                Annulla
              </button>
              <button onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.description.trim()}
                className="flex-1 accent-btn py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                Invia a Ralph
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
