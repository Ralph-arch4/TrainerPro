"use client";
import { useState, useEffect, useRef } from "react";
import { Bug, Lightbulb, Zap, Trash2, Loader2, Send, Check, CheckCheck } from "lucide-react";
import { dbFeedback, type FeedbackNote } from "@/lib/db";
import { showToast } from "@/components/Toast";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

type Category = "bug" | "improvement" | "idea";

const CAT: Record<Category, { label: string; color: string; bg: string; border: string; Icon: React.FC<{ size?: number }> }> = {
  bug:         { label: "Bug",           color: "#f87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   Icon: Bug },
  improvement: { label: "Miglioramento", color: "#FF9A6C", bg: "rgba(255,107,43,0.12)",  border: "rgba(255,107,43,0.3)",  Icon: Zap },
  idea:        { label: "Idea",          color: "#a78bfa", bg: "rgba(123,47,190,0.12)",  border: "rgba(123,47,190,0.3)",  Icon: Lightbulb },
};

const STATUS_ICON = {
  nuovo:     <Check size={12} style={{ color: "rgba(245,240,232,0.3)" }} />,
  in_review: <CheckCheck size={12} style={{ color: "rgba(245,240,232,0.45)" }} />,
  fatto:     <CheckCheck size={12} style={{ color: "#22c55e" }} />,
};

export default function TalkWithRalphPage() {
  const [notes,    setNotes]   = useState<FeedbackNote[]>([]);
  const [loading,  setLoading] = useState(true);
  const [sending,  setSending] = useState(false);
  const [text,     setText]    = useState("");
  const [cat,      setCat]     = useState<Category>("improvement");
  const userName = useAppStore(s => s.user?.name ?? "");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    dbFeedback.list()
      .then(setNotes)
      .catch(() => showToast("Errore nel caricamento", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const { data: { user } } = await createClient().auth.getUser();
      const created = await dbFeedback.create({
        title:       trimmed.split("\n")[0].slice(0, 80),
        category:    cat,
        description: trimmed,
        trainerName:  userName || undefined,
        trainerEmail: user?.email || undefined,
      });
      setNotes(prev => [...prev, created]);
      setText("");
      textareaRef.current?.focus();
    } catch { showToast("Errore nell'invio", "error"); }
    finally { setSending(false); }
  }

  async function handleDelete(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    try { await dbFeedback.remove(id); }
    catch { showToast("Errore nell'eliminazione", "error"); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  }

  function fmtDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday
      ? d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) + " " +
        d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "var(--black)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{
          background: "rgba(10,8,20,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        }}>
        {/* Ralph avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #E53232, #7B2FBE)", boxShadow: "0 0 16px rgba(229,50,50,0.35)" }}>
            R
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: "#22c55e", borderColor: "var(--black)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm" style={{ color: "var(--ivory)" }}>Ralph</p>
          <p className="text-xs" style={{ color: "#22c55e" }}>Platform developer · in ascolto</p>
        </div>
        {/* Count badges */}
        <div className="flex gap-1.5">
          {(["bug", "improvement", "idea"] as Category[]).map(c => {
            const n = notes.filter(x => x.category === c).length;
            if (n === 0) return null;
            return (
              <span key={c} className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: CAT[c].bg, color: CAT[c].color, border: `1px solid ${CAT[c].border}` }}>
                {n}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ overscrollBehavior: "contain" }}>

        {/* Welcome bubble from Ralph */}
        <div className="flex items-end gap-2 justify-start">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mb-1"
            style={{ background: "linear-gradient(135deg, #E53232, #7B2FBE)" }}>
            R
          </div>
          <div className="max-w-xs rounded-2xl rounded-bl-sm px-4 py-3"
            style={{ background: "rgba(229,50,50,0.1)", border: "1px solid rgba(229,50,50,0.15)" }}>
            <p className="text-sm" style={{ color: "var(--ivory)" }}>
              Ciao! Sono Ralph, il dev della piattaforma.
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.6)" }}>
              Segnalami bug 🐛, idee ✨ o miglioramenti 🚀 — li leggo ogni mattina e ti aggiorno sullo status.
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.25)" }}>oggi</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="animate-spin" style={{ color: "rgba(255,107,43,0.4)" }} />
          </div>
        )}

        {/* Note bubbles */}
        {!loading && notes.map(note => {
          const meta = CAT[note.category as Category] ?? CAT.improvement;
          const Icon = meta.Icon;
          return (
            <div key={note.id} className="flex items-end gap-2 justify-end group">
              <div className="relative max-w-sm">
                {/* Category tag */}
                <div className="flex items-center gap-1.5 mb-1 justify-end">
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: meta.color }}>
                    <Icon size={10} /> {meta.label}
                  </span>
                </div>
                {/* Bubble */}
                <div className="rounded-2xl rounded-br-sm px-4 py-3 relative"
                  style={{
                    background: `linear-gradient(135deg, rgba(30,15,15,0.95), rgba(20,10,10,0.9))`,
                    border: `1px solid ${meta.border}`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                  }}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ivory)" }}>{note.description}</p>
                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>{fmtDate(note.created_at)}</span>
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[note.status as keyof typeof STATUS_ICON] ?? STATUS_ICON.nuovo}
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                        title="Elimina">
                        <Trash2 size={11} style={{ color: "rgba(239,68,68,0.5)" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Compose bar ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pb-4"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          background: "rgba(10,8,20,0.95)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}>

        {/* Category pills */}
        <div className="flex gap-2 pt-3 pb-2">
          {(["bug", "improvement", "idea"] as Category[]).map(c => {
            const { label, color, bg, border, Icon } = CAT[c];
            const active = cat === c;
            return (
              <button key={c} onClick={() => setCat(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: active ? bg : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? border : "rgba(255,255,255,0.08)"}`,
                  color: active ? color : "rgba(245,240,232,0.35)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                }}>
                <Icon size={11} /> {label}
              </button>
            );
          })}
        </div>

        {/* Input row */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder={
              cat === "bug"         ? "Descrivi il bug che hai trovato..." :
              cat === "improvement" ? "Come si potrebbe migliorare?" :
              "Hai un'idea? Scrivila qui..."
            }
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${CAT[cat].border}`,
              color: "var(--ivory)",
              maxHeight: "120px",
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{
              background: text.trim()
                ? `linear-gradient(135deg, ${CAT[cat].color}, ${CAT[cat].color}aa)`
                : "rgba(255,255,255,0.06)",
              boxShadow: text.trim() ? `0 4px 16px ${CAT[cat].color}40` : "none",
              transform: text.trim() ? "scale(1.05)" : "scale(1)",
            }}>
            {sending
              ? <Loader2 size={17} className="animate-spin" style={{ color: "#fff" }} />
              : <Send size={17} style={{ color: text.trim() ? "#fff" : "rgba(245,240,232,0.3)" }} />
            }
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(245,240,232,0.18)" }}>
          ⌘ + Invio per inviare · ✓ = nuovo · ✓✓ = in review · ✓✓ verde = fatto
        </p>
      </div>
    </div>
  );
}
