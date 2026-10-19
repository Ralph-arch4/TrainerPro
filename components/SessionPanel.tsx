"use client";
import { useEffect, useState } from "react";
import { Play, Square, Clock, Pencil, Check, MessageSquare } from "lucide-react";
import { showToast } from "@/components/Toast";
import { durationBetween, formatDuration, nowHHMM, type WorkoutSession } from "@/lib/workoutSession";

interface Props {
  day: number;
  week: number;
  dayLabel: string;
  session?: WorkoutSession;
  mode: "trainer" | "client";
  onSave?: (s: Omit<WorkoutSession, "loggedAt">) => void;
}

function elapsed(fromIso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 1000));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(h > 0 ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
}

// Start/stop timer + manual start/end times + feedback for one day of one week.
export default function SessionPanel({ day, week, dayLabel, session, mode, onSave }: Props) {
  const running = !!session?.start && !session?.end;
  const done = !!session?.start && !!session?.end;
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(session?.start ?? "");
  const [end, setEnd] = useState(session?.end ?? "");
  const [feedback, setFeedback] = useState(session?.feedback ?? "");
  const [, setTick] = useState(0);

  // Drafts are (re)loaded from the saved session each time the editor opens
  function openEditor() {
    setStart(session?.start ?? "");
    setEnd(session?.end ?? "");
    setFeedback(session?.feedback ?? "");
    setEditing(true);
  }

  useEffect(() => {
    if (!running || !session?.startedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running, session?.startedAt]);

  const base = { day, week, feedback: session?.feedback };
  const duration = session?.durationMin ?? durationBetween(session?.start, session?.end);

  function startNow() {
    onSave?.({ ...base, start: nowHHMM(), startedAt: new Date().toISOString() });
    showToast("Allenamento iniziato, buon lavoro");
  }

  function stopNow() {
    if (!session?.start) return;
    const end = nowHHMM();
    const live = session.startedAt ? Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)) : undefined;
    const durationMin = live && live <= 600 ? live : durationBetween(session.start, end) ?? 1;
    onSave?.({ ...base, start: session.start, end, startedAt: session.startedAt, durationMin });
    showToast(`Allenamento completato in ${formatDuration(durationMin)}`);
  }

  function saveManual() {
    // Manual times win over the live timer measurement
    onSave?.({ day, week, start: start || undefined, end: end || undefined, startedAt: session?.startedAt, feedback });
    setEditing(false);
    showToast("Sessione salvata");
  }

  const card = { background: "var(--surface-xs)", border: "1px solid var(--border)" };
  const input = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ivory)" };

  if (mode === "trainer") {
    return (
      <div className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={card}>
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--ivory)" }}>
          <Clock size={14} style={{ color: "var(--accent)" }} /> Sessione · {dayLabel}
        </span>
        {session?.start ? (
          <>
            <span style={{ color: "var(--text-muted)" }}>{session.start} – {session.end ?? "in corso"}</span>
            <span className="font-bold" style={{ color: "var(--accent-light)" }}>{formatDuration(duration)}</span>
          </>
        ) : (
          <span style={{ color: "var(--text-dim)" }}>Nessun orario registrato</span>
        )}
        {session?.feedback && (
          <p className="w-full text-sm italic break-words" style={{ color: "var(--text-muted)" }}>&ldquo;{session.feedback}&rdquo;</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={card}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Sessione · {dayLabel}</p>
          {running && session?.startedAt ? (
            <p className="text-2xl font-black tabular-nums" style={{ color: "var(--accent-light)" }}>{elapsed(session.startedAt)}</p>
          ) : done ? (
            <p className="text-base font-black" style={{ color: "var(--ivory)" }}>
              Completato in <span style={{ color: "var(--accent-light)" }}>{formatDuration(duration)}</span>
            </p>
          ) : running ? (
            <p className="text-base font-bold" style={{ color: "var(--ivory)" }}>Iniziato alle {session?.start}</p>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Avvia il timer quando inizi</p>
          )}
          {session?.start && (
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>{session.start} – {session.end ?? "in corso"}</p>
          )}
        </div>
        {!session?.start && (
          <button onClick={startNow}
            className="flex items-center gap-2 px-4 rounded-xl text-sm font-bold flex-shrink-0 active:scale-95 transition-all"
            style={{ minHeight: "2.75rem", background: "rgba(201,168,76,0.16)", border: "1px solid rgba(201,168,76,0.45)", color: "var(--accent-light)" }}>
            <Play size={14} /> Inizia
          </button>
        )}
        {running && (
          <button onClick={stopNow}
            className="flex items-center gap-2 px-4 rounded-xl text-sm font-bold flex-shrink-0 active:scale-95 transition-all"
            style={{ minHeight: "2.75rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
            <Square size={13} /> Termina
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs" style={{ color: "var(--text-dim)" }}>
              Ora di inizio
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none" style={input} />
            </label>
            <label className="text-xs" style={{ color: "var(--text-dim)" }}>
              Ora di fine
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none" style={input} />
            </label>
          </div>
          {start && end && (
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>Durata: {formatDuration(durationBetween(start, end))}</p>
          )}
          <label className="block text-xs" style={{ color: "var(--text-dim)" }}>
            Come è andata? <span style={{ color: "var(--text-faint)" }}>(la legge il tuo trainer)</span>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value.slice(0, 500))} rows={3}
              placeholder="Energia, dolori, esercizi troppo facili o difficili…"
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none resize-none" style={input} />
          </label>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Annulla</button>
            <button onClick={saveManual} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold accent-btn">
              <Check size={14} /> Salva
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={openEditor} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <Pencil size={11} /> Orari manuali
          </button>
          <button onClick={openEditor} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <MessageSquare size={11} /> {session?.feedback ? "Modifica feedback" : "Feedback per il trainer"}
          </button>
          {session?.feedback && (
            <p className="w-full text-xs italic break-words" style={{ color: "var(--text-dim)" }}>&ldquo;{session.feedback}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
