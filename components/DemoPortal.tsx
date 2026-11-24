"use client";
import { useState, useEffect } from "react";
import { dbDemoLinks } from "@/lib/db";
import WorkoutLogbook from "@/components/WorkoutLogbook";
import ThemeToggle from "@/components/ThemeToggle";
import LinkifiedText from "@/components/LinkifiedText";
import type { Exercise, ExerciseLog } from "@/lib/store";
import { splitLogs } from "@/lib/workoutSession";
import { LOCKABLE_FEATURES, normalizeLocked, formatRemaining, type LockableFeature } from "@/lib/quickDemo";
import { Dumbbell, Loader2, AlertCircle, Lock, Timer, Sparkles, Hourglass } from "lucide-react";

// Public page of a quick demo link (/demo/[token]): the plan the trainer chose,
// with tracking, for 4 hours. Premium features chosen by the trainer are shown locked.

interface DemoData {
  name: string;
  description: string | null;
  daysPerWeek: number;
  totalWeeks: number;
  exercises: Exercise[];
  dayLabels: Record<number, string>;
}

interface Meta {
  trainerName: string;
  prospectName: string | null;
  message: string | null;
  locked: LockableFeature[];
  expiresAt: number; // local clock, corrected with the server time
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") { try { return JSON.parse(value) as T; } catch { return fallback; } }
  return value as T;
}

export default function DemoPortal({ token }: { token: string | undefined }) {
  const [plan, setPlan] = useState<DemoData | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "expired" | "error">("loading");
  const [saveError, setSaveError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    async function load() {
      if (!token) { setState("error"); return; }
      try {
        const data = await dbDemoLinks.getByToken(token);
        const base: Meta = {
          trainerName: (data.trainer_name as string) || "Il tuo trainer",
          prospectName: (data.prospect_name as string) ?? null,
          message: (data.message as string) ?? null,
          locked: normalizeLocked(data.locked_features),
          expiresAt: 0,
        };
        if (data.error === "expired") { setMeta(base); setState("expired"); return; }
        if (data.error || !data.plan) { setState("error"); return; }
        const skew = Date.now() - new Date(data.server_now as string).getTime();
        setMeta({ ...base, expiresAt: new Date(data.expires_at as string).getTime() + skew });
        const row = data.plan as Record<string, unknown>;
        setPlan({
          name: row.name as string,
          description: (row.description as string) ?? null,
          daysPerWeek: (row.days_per_week as number) || 3,
          totalWeeks: (row.total_weeks as number) || 1,
          exercises: parseJson<Exercise[]>(row.exercises, []),
          dayLabels: parseJson<Record<number, string>>(row.day_labels, {}) ?? {},
        });
        setLogs(((data.logs ?? []) as Array<Record<string, unknown>>).map((l) => ({
          id: l.id as string,
          exerciseId: l.exercise_id as string,
          weekNumber: l.week_number as number,
          weight: (l.weight as number) ?? undefined,
          reps: (l.reps as string) ?? undefined,
          note: (l.note as string) ?? undefined,
          loggedAt: l.logged_at as string,
        })));
        setState("ok");
      } catch {
        setState("error");
      }
    }
    load();
  }, [token]);

  useEffect(() => {
    if (state !== "ok") return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [state]);

  async function handleUpsertLog(logData: Omit<ExerciseLog, "id" | "loggedAt">) {
    if (!token) return;
    setSaveError(false);
    const snapshot = logs;
    const stamp = new Date().toISOString();
    setLogs((prev) => {
      const same = (l: ExerciseLog) => l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber;
      if (prev.some(same)) return prev.map((l) => same(l) ? { ...l, ...logData, loggedAt: stamp } : l);
      return [...prev, { ...logData, id: `tmp_${Date.now()}`, loggedAt: stamp }];
    });
    try {
      const saved = await dbDemoLinks.upsertLogByToken(token, {
        exercise_id: logData.exerciseId,
        week_number: logData.weekNumber,
        weight: logData.weight ?? null,
        reps: logData.reps ?? null,
        note: logData.note ?? null,
      });
      setLogs((prev) => prev.map((l) =>
        l.exerciseId === logData.exerciseId && l.weekNumber === logData.weekNumber ? { ...l, id: saved.id } : l));
    } catch (err) {
      setLogs(snapshot);
      if (err instanceof Error && err.message === "expired") setState("expired");
      else setSaveError(true);
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={36} className="mx-auto mb-3" style={{ color: "rgba(239,68,68,0.6)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Lezione di prova non trovata o link non più valido.</p>
        </div>
      </div>
    );
  }

  const timedOut = state === "ok" && !!meta && meta.expiresAt <= now;
  if (state === "expired" || timedOut || !plan || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-md w-full text-center card-luxury rounded-2xl p-8">
          <Hourglass size={34} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <h1 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>La lezione di prova è terminata</h1>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            {meta?.prospectName ? `${meta.prospectName.split(" ")[0]}, grazie` : "Grazie"} per aver provato il coaching di{" "}
            <strong style={{ color: "var(--text)" }}>{meta?.trainerName ?? "il tuo trainer"}</strong>.
            Con il percorso completo ritrovi la tua scheda, i tuoi progressi e tutte le funzionalità.
          </p>
          {meta?.message && (
            <div className="text-sm text-left rounded-xl px-4 py-3 break-words whitespace-pre-line"
              style={{ background: "var(--surface-xs)", border: "1px solid var(--border)", color: "var(--ivory)" }}>
              <LinkifiedText text={meta.message} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const { logs: exerciseLogs, sessionLogs } = splitLogs(logs);
  const weeksLocked = meta.locked.includes("weeks") && plan.totalWeeks > 1;
  const teasers = LOCKABLE_FEATURES.filter((f) => meta.locked.includes(f.id) && (f.id !== "weeks" || weeksLocked));
  const left = Math.max(0, meta.expiresAt - now);
  const initials = meta.trainerName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "PT";
  const firstName = meta.prospectName?.split(" ")[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="sticky top-0 z-40 border-b glass-dark" style={{ borderColor: "rgba(201,168,76,0.14)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
              style={{ background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.35)", color: "var(--accent)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight line-clamp-2 break-words" style={{ color: "var(--text)" }}>{plan.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>Lezione di prova · {meta.trainerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: "rgba(201,168,76,0.12)", color: "var(--accent-light)" }} title="Tempo rimasto">
              <Timer size={12} /> {formatRemaining(left)}
            </span>
            <ThemeToggle size={14} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.22)" }}>
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Sparkles size={15} style={{ color: "var(--accent)" }} />
            {firstName ? `Ciao ${firstName}, questa scheda è pensata per te` : "Questa scheda è pensata per te"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {meta.trainerName}{" "}l&apos;ha costruita sui tuoi obiettivi. Allenati e registra serie, ripetizioni e carichi:
            il tuo trainer vedrà come è andata. Il link resta attivo ancora {formatRemaining(left)}.
          </p>
        </div>

        {plan.description && (
          <div className="rounded-2xl px-4 py-3 text-sm break-words whitespace-pre-line"
            style={{ background: "var(--surface-xs)", border: "1px solid var(--border)", color: "var(--ivory)" }}>
            <span className="text-xs font-bold uppercase tracking-wide block mb-1" style={{ color: "var(--accent-light)" }}>Note del trainer</span>
            <LinkifiedText text={plan.description} />
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-xl text-sm flex items-center justify-between gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.9)" }}>
            <span>Errore nel salvataggio. Controlla la connessione e riprova.</span>
            <button onClick={() => setSaveError(false)} className="text-xs underline opacity-70 flex-shrink-0">Chiudi</button>
          </div>
        )}

        {plan.exercises.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--surface-xs)", border: "1px solid var(--border-subtle)" }}>
            <Dumbbell size={24} className="mx-auto mb-3" style={{ color: "rgba(201,168,76,0.4)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Scheda in preparazione</p>
          </div>
        ) : (
          <WorkoutLogbook
            exercises={plan.exercises}
            logs={exerciseLogs}
            sessionLogs={sessionLogs}
            totalWeeks={weeksLocked ? 1 : plan.totalWeeks}
            daysPerWeek={plan.daysPerWeek}
            mode="client"
            dayLabels={plan.dayLabels}
            supplements={[]}
            onUpsertLog={handleUpsertLog}
          />
        )}

        {teasers.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: "var(--text-dim)" }}>
              Nel percorso completo con {meta.trainerName}
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {teasers.map((f) => (
                <div key={f.id} className="relative rounded-2xl p-4 overflow-hidden"
                  style={{ background: "var(--surface-xs)", border: "1px solid rgba(201,168,76,0.18)" }}>
                  <div className="absolute inset-x-4 bottom-3 space-y-1.5 opacity-40 blur-[2px] pointer-events-none" aria-hidden>
                    <div className="h-2 rounded-full w-3/4" style={{ background: "rgba(201,168,76,0.35)" }} />
                    <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(201,168,76,0.25)" }} />
                  </div>
                  <div className="relative pb-6">
                    <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                      <Lock size={14} style={{ color: "var(--accent)" }} />
                      {f.id === "weeks" ? `Programma completo di ${plan.totalWeeks} settimane` : f.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{f.teaser}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl px-4 py-4 text-center" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.22)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Vuoi continuare con {meta.trainerName}?</p>
          {meta.message ? (
            <div className="text-sm mt-1 break-words whitespace-pre-line" style={{ color: "var(--text-muted)" }}>
              <LinkifiedText text={meta.message} />
            </div>
          ) : (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Contatta il tuo trainer per sbloccare il percorso completo.</p>
          )}
        </div>

        <p className="text-center text-xs pt-2 pb-2" style={{ color: "var(--text-dim)" }}>
          I dati che inserisci sono visibili solo al trainer ·{" "}
          <a href="/privacy" className="underline">Privacy</a>
        </p>
      </div>
    </div>
  );
}
