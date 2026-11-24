"use client";
import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, CreditCard, History, Activity, StickyNote, Users, Loader2 } from "lucide-react";
import AdminShell, { AdminGate, ERROR_TEXT, PlanBadge, StatusBadge, adminPost, fmtDate, fmtDateTime, useAdminData } from "@/components/admin/AdminShell";
import { ACTION_LABELS } from "@/lib/admin-actions";

interface Detail {
  trainer: {
    id: string; name: string; email: string; phone: string | null; createdAt: string | null; lastSignInAt: string | null;
    emailConfirmed: boolean; bannedUntil: string | null; plan: string; premiumStatus: string;
    premiumRequestedAt: string | null; premiumDecidedAt: string | null; premiumDecidedBy: string | null;
    trialEndsAt: string | null; accountStatus: "active" | "suspended" | "banned"; statusReason: string | null;
    statusChangedAt: string | null; statusChangedBy: string | null; paidUntil: string | null; migrationsMissing: boolean;
  };
  clients: Array<{
    id: string; name: string; email: string | null; phone: string | null; status: string | null; goal: string | null;
    monthlyFee: number | null; startDate: string | null; createdAt: string | null; deletedAt: string | null; plans: number; lastActivityAt: string | null;
  }>;
  activity: { workoutPlans: number; activePlans: number; logsLast30Days: number; lastLogAt: string | null; feedback: Array<{ id: string; title: string; category: string; createdAt: string }> };
  note: { text: string; updatedAt: string; updatedBy: string | null } | null;
  audit: Array<{ id: string; action: string; adminEmail: string; details: Record<string, unknown> | null; createdAt: string }>;
}

const CLIENT_STATUS: Record<string, string> = { attivo: "Attivo", inattivo: "Inattivo", in_pausa: "In pausa" };

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="card-luxury rounded-2xl p-4 lg:p-5">
      <h2 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: "var(--text)" }}>
        <span style={{ color: "var(--accent)" }}>{icon}</span>{title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-right break-words min-w-0" style={{ color: "var(--text)" }}>{children}</span>
    </div>
  );
}

const inputStyle = { background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text)" };

export default function AdminTrainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { gate, data, reload } = useAdminData<Detail>(`/api/admin/trainers/${id}`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState("Pagamento non ricevuto");
  const [banReason, setBanReason] = useState("");
  // Drafts: null = show the saved value from the server.
  const [paidDraft, setPaidDraft] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  if (gate !== "ok" || !data) return <AdminGate gate={gate} />;
  const t = data.trainer;
  const premium = t.plan !== "free";
  const paidUntil = paidDraft ?? t.paidUntil ?? "";
  const note = noteDraft ?? data.note?.text ?? "";

  async function run(body: Record<string, unknown>, confirmText: string | null, done: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setMessage(null);
    const res = await adminPost(`/api/admin/trainers/${id}`, body);
    setBusy(false);
    if (!res.ok) return setMessage({ text: ERROR_TEXT[res.error ?? ""] ?? "Operazione non riuscita. Riprova.", error: true });
    setMessage({ text: done });
    await reload();
    setPaidDraft(null);
    setNoteDraft(null);
  }

  const who = t.email || t.name || "questo trainer";
  const clients = data.clients.filter((c) => showDeleted || !c.deletedAt);
  const deletedCount = data.clients.filter((c) => c.deletedAt).length;

  return (
    <AdminShell title={t.name || t.email || "Trainer"} subtitle={t.name ? t.email : undefined} onRefresh={() => void reload()}>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={14} /> Tutti i trainer
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <PlanBadge plan={t.plan} trialEndsAt={t.trialEndsAt} />
        <StatusBadge status={t.accountStatus} />
        {t.statusReason && t.accountStatus !== "active" && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Motivo: {t.statusReason}</span>
        )}
      </div>

      {t.migrationsMissing && (
        <p className="text-sm mb-4 px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24" }}>
          Il database non ha ancora le colonne per sospensione e ban: applica le migrazioni 027 e 028 in Supabase.
        </p>
      )}
      {message && (
        <p role="status" className="text-sm mb-4" style={{ color: message.error ? "#f87171" : "var(--accent-light)" }}>{message.text}</p>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card icon={<CreditCard size={15} />} title="Abbonamento">
          <Row label="Piano">{t.plan === "fitness_master" ? "Fitness Master" : premium ? "Premium" : "Demo / prova"}</Row>
          {!premium && <Row label="Prova fino al">{fmtDate(t.trialEndsAt)}</Row>}
          {t.premiumStatus === "pending" && <Row label="Richiesta Premium">{fmtDate(t.premiumRequestedAt)}</Row>}
          {t.premiumDecidedAt && <Row label="Ultima decisione">{fmtDate(t.premiumDecidedAt)}{t.premiumDecidedBy ? ` · ${t.premiumDecidedBy}` : ""}</Row>}
          <Row label="Stato abbonamento">{t.accountStatus === "active" ? "Attivo" : t.accountStatus === "suspended" ? "Sospeso" : "Bloccato (ban)"}</Row>

          <div className="flex flex-wrap gap-2 mt-3">
            {t.plan !== "premium" && (
              <button disabled={busy} onClick={() => run({ action: "set_premium" }, `Attivare il piano Premium per ${who}?`, "Piano Premium attivato")}
                className={premium ? "outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50" : "accent-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50"}>Passa a Premium</button>
            )}
            {t.plan !== "fitness_master" && (
              <button disabled={busy} onClick={() => run({ action: "set_fitness_master" }, `Attivare il piano Fitness Master per ${who}?`, "Piano Fitness Master attivato")}
                className="accent-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Passa a Fitness Master</button>
            )}
            {premium && (
              <button disabled={busy} onClick={() => run({ action: "set_demo" }, `Riportare ${who} alla demo? I dati restano conservati.`, "Account riportato alla demo")}
                className="outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Riporta alla demo</button>
            )}
            {!premium && (
              <button disabled={busy} onClick={() => run({ action: "extend_trial", days: 14 }, null, "Prova estesa di 14 giorni")}
                className="outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Estendi prova di 14 giorni</button>
            )}
          </div>

          <label className="block text-xs mt-4 mb-1" style={{ color: "var(--text-muted)" }}>Pagato fino al</label>
          <div className="flex gap-2">
            <input type="date" value={paidUntil} onChange={(e) => setPaidDraft(e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
            <button disabled={busy || paidUntil === (t.paidUntil ?? "")} onClick={() => run({ action: "set_paid_until", date: paidUntil || null }, null, "Data di pagamento salvata")}
              className="outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Salva</button>
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {t.accountStatus === "active" ? (
              <>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Motivo della sospensione (visibile solo a te)</label>
                <div className="flex gap-2">
                  <input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} maxLength={500} className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                  <button disabled={busy || !suspendReason.trim()} onClick={() => run({ action: "suspend", reason: suspendReason }, `Sospendere l'abbonamento di ${who}? Non potrà usare il pannello e i link dei suoi clienti smetteranno di funzionare. I dati restano conservati.`, "Abbonamento sospeso")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50" style={{ background: "rgba(251,191,36,0.14)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }}>Sospendi</button>
                </div>
              </>
            ) : t.accountStatus === "suspended" ? (
              <button disabled={busy} onClick={() => run({ action: "reactivate" }, `Riattivare l'abbonamento di ${who}?`, "Abbonamento riattivato")}
                className="accent-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Riattiva abbonamento</button>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Account bannato: rimuovi il ban dalla sezione Moderazione.</p>
            )}
          </div>
        </Card>

        <Card icon={<Ban size={15} />} title="Moderazione">
          <Row label="Email confermata">{t.emailConfirmed ? "Sì" : "No"}</Row>
          <Row label="Iscritto il">{fmtDate(t.createdAt)}</Row>
          <Row label="Ultimo accesso">{fmtDateTime(t.lastSignInAt)}</Row>
          {t.statusChangedAt && <Row label="Ultimo cambio stato">{fmtDateTime(t.statusChangedAt)}{t.statusChangedBy ? ` · ${t.statusChangedBy}` : ""}</Row>}
          {t.bannedUntil && <Row label="Login bloccato fino al">{fmtDate(t.bannedUntil)}</Row>}

          {t.accountStatus === "banned" ? (
            <button disabled={busy} onClick={() => run({ action: "unban" }, `Rimuovere il ban di ${who}? Potrà di nuovo accedere.`, "Ban rimosso")}
              className="accent-btn px-3 py-2 rounded-xl text-xs mt-3 disabled:opacity-50">Rimuovi ban</button>
          ) : (
            <>
              <p className="text-xs mt-3 mb-1" style={{ color: "var(--text-muted)" }}>
                Il ban blocca subito il login, il pannello e i link dei clienti. Usalo per comportamenti scorretti; per i pagamenti usa la sospensione.
              </p>
              <div className="flex gap-2">
                <input value={banReason} onChange={(e) => setBanReason(e.target.value)} maxLength={500} placeholder="Motivo del ban" aria-label="Motivo del ban"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                <button disabled={busy || !banReason.trim()} onClick={() => run({ action: "ban", reason: banReason }, `Bannare ${who}? Verrà disconnesso e non potrà più accedere finché non rimuovi il ban.`, "Account bannato")}
                  className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50" style={{ background: "rgba(239,68,68,0.14)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}>Banna</button>
              </div>
            </>
          )}
        </Card>

        <Card icon={<Activity size={15} />} title="Attività">
          <Row label="Clienti attivi">{data.clients.filter((c) => !c.deletedAt).length}</Row>
          <Row label="Schede (attive)">{data.activity.workoutPlans} ({data.activity.activePlans})</Row>
          <Row label="Allenamenti registrati, ultimi 30 giorni">{data.activity.logsLast30Days}</Row>
          <Row label="Ultimo allenamento registrato">{fmtDateTime(data.activity.lastLogAt)}</Row>
          <Row label="Feedback inviati">{data.activity.feedback.length}</Row>
          {data.activity.feedback.length > 0 && (
            <ul className="mt-2 space-y-1">
              {data.activity.feedback.slice(0, 5).map((f) => (
                <li key={f.id} className="text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(f.createdAt)} · {f.title}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card icon={<StickyNote size={15} />} title="Note private">
          <textarea value={note} onChange={(e) => setNoteDraft(e.target.value)} rows={5} maxLength={5000}
            placeholder="Pagamenti, accordi, segnalazioni. Le vedi solo tu."
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>{data.note ? `Aggiornata il ${fmtDateTime(data.note.updatedAt)}` : ""}</span>
            <button disabled={busy || note === (data.note?.text ?? "")} onClick={() => run({ action: "save_note", note }, null, "Nota salvata")}
              className="outline-btn px-3 py-2 rounded-xl text-xs disabled:opacity-50">Salva nota</button>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card icon={<Users size={15} />} title={`Clienti (${data.clients.filter((c) => !c.deletedAt).length})`}>
          {deletedCount > 0 && (
            <button onClick={() => setShowDeleted((v) => !v)} className="text-xs mb-2 underline" style={{ color: "var(--text-muted)" }}>
              {showDeleted ? "Nascondi" : "Mostra"} {deletedCount} {deletedCount === 1 ? "cliente eliminato" : "clienti eliminati"}
            </button>
          )}
          {clients.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-dim)" }}>Nessun cliente.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[40rem]">
                <thead>
                  <tr className="text-left text-xs" style={{ color: "var(--text-muted)" }}>
                    <th className="px-1 py-2 font-medium">Nome</th>
                    <th className="px-1 py-2 font-medium">Contatti</th>
                    <th className="px-1 py-2 font-medium">Stato</th>
                    <th className="px-1 py-2 font-medium">Dal</th>
                    <th className="px-1 py-2 font-medium">Schede</th>
                    <th className="px-1 py-2 font-medium">Ultimo allenamento</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} style={{ borderTop: "1px solid var(--border-subtle)", opacity: c.deletedAt ? 0.5 : 1 }}>
                      <td className="px-1 py-2" style={{ color: "var(--text)" }}>{c.name}{c.deletedAt && " (eliminato)"}</td>
                      <td className="px-1 py-2 text-xs break-all" style={{ color: "var(--text-muted)" }}>{[c.email, c.phone].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="px-1 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{CLIENT_STATUS[c.status ?? ""] ?? c.status ?? "—"}</td>
                      <td className="px-1 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(c.startDate ?? c.createdAt)}</td>
                      <td className="px-1 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{c.plans}</td>
                      <td className="px-1 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(c.lastActivityAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card icon={<History size={15} />} title="Registro azioni su questo account">
          {data.audit.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>Nessuna azione registrata.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.audit.map((a) => (
                <li key={a.id} className="text-xs flex flex-wrap gap-x-2" style={{ color: "var(--text-muted)" }}>
                  <span className="tabular-nums" style={{ color: "var(--text-dim)" }}>{fmtDateTime(a.createdAt)}</span>
                  <span style={{ color: "var(--text)" }}>{ACTION_LABELS[a.action] ?? a.action}</span>
                  {typeof a.details?.reason === "string" && <span>· {a.details.reason}</span>}
                  {typeof a.details?.paidUntil === "string" && <span>· {fmtDate(a.details.paidUntil)}</span>}
                  <span>· {a.adminEmail}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {busy && (
        <div className="fixed bottom-4 right-4 p-3 rounded-full" style={{ background: "var(--surface-modal)" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      )}
    </AdminShell>
  );
}
