"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Crown, Clock, CreditCard, Landmark, Loader2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { isPremium, FREE_CLIENT_LIMIT } from "@/lib/plan-limits";
import { PAYMENT_LINK, PAYMENT_IBAN, PAYMENT_HOLDER, PREMIUM_FEATURES, TRIAL_FEATURES, getTrialStatus, formatDueDate } from "@/lib/billing";
import { APP_NAME, CONTACT_SALES_PATH } from "@/lib/brand";
import { isAndroidApp } from "@/lib/platform";
import { showToast } from "@/components/Toast";

const noopSubscribe = () => () => {};

export default function SubscriptionPage() {
  const user = useAppStore((s) => s.user);
  const clientCount = useAppStore((s) => s.clients.length);
  const inAndroidApp = useSyncExternalStore(noopSubscribe, isAndroidApp, () => false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const premium = isPremium(user?.plan);
  const pending = user?.premiumStatus === "pending";
  const trial = getTrialStatus(user);

  async function requestPremium() {
    if (!user || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/premium/request", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? String(res.status));
      useAppStore.setState({
        user: json.status === "approved"
          ? { ...user, plan: "premium", premiumStatus: "approved", wantsPremium: false }
          : { ...user, premiumStatus: "pending", wantsPremium: false },
      });
      showToast(json.status === "approved" ? "Premium attivo" : "Richiesta Premium inviata");
    } catch {
      setError("Non è stato possibile inviare la richiesta. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 pt-4 lg:pt-8 lg:p-8 fade-in max-w-4xl">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Abbonamento</h1>
      <p className="text-sm mt-0.5 mb-6" style={{ color: "var(--text-muted)" }}>
        Piano attuale: <strong data-testid="current-plan" style={{ color: "var(--accent-light)" }}>{premium ? "Premium" : "Prova gratuita"}</strong>
        {!premium && <> · {clientCount} {clientCount === 1 ? "cliente" : "clienti"} su {FREE_CLIENT_LIMIT} disponibile</>}
        {!premium && trial?.endsAt && (
          <span data-testid="trial-ends" className="block mt-0.5" style={{ color: trial.suspended ? "#f87171" : "var(--text-muted)" }}>
            {trial.suspended
              ? `Prova terminata il ${formatDueDate(trial.endsAt)}: pannello e link dei clienti sono sospesi fino all'attivazione di Premium.`
              : `Prova attiva fino al ${formatDueDate(trial.endsAt)} (${trial.daysLeft === 1 ? "ultimo giorno" : `${trial.daysLeft} giorni rimasti`}).`}
          </span>
        )}
      </p>

      {premium && (
        <div className="rounded-2xl p-5 mb-6 flex items-start gap-3" data-testid="premium-active"
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <ShieldCheck size={20} style={{ color: "#22c55e" }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Premium attivo</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Hai accesso completo a {APP_NAME}, senza limiti sul numero di clienti.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Demo */}
        <div className="card-luxury rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-dim)" }}>Prova gratuita</p>
          <ul className="space-y-2">
            {TRIAL_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--text-dim)" }} /> {f}
              </li>
            ))}
          </ul>
          {!premium && <p className="text-xs mt-4 font-semibold" style={{ color: "var(--text-dim)" }}>Il tuo piano attuale</p>}
        </div>

        {/* Premium */}
        <div className="rounded-2xl p-6 relative" style={{ background: "var(--card-luxury-solid)", border: "1px solid rgba(201,168,76,0.5)", boxShadow: "0 0 30px rgba(201,168,76,0.12)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
            <Crown size={13} /> Premium
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Condizioni su misura per il tuo studio.{" "}
            <Link href={CONTACT_SALES_PATH} className="underline" style={{ color: "var(--accent-light)" }}>Parla con il team commerciale</Link>
          </p>
          <ul className="space-y-2">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} /> {f}
              </li>
            ))}
          </ul>
          {premium && <p className="text-xs mt-4 font-semibold" style={{ color: "var(--accent-light)" }}>Il tuo piano attuale</p>}
        </div>
      </div>

      {!premium && (
        <div className="card-luxury rounded-2xl p-6" data-testid="checkout">
          {pending ? (
            <div className="flex items-start gap-3" data-testid="premium-pending">
              <Clock size={20} style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Richiesta inviata</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Premium si attiva appena il pagamento viene verificato. Nel frattempo continui a usare la demo:
                  i tuoi dati restano dove sono.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                <Sparkles size={15} style={{ color: "var(--accent)" }} /> Attiva Premium
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                Invia la richiesta: l&apos;accesso completo viene sbloccato appena il pagamento è verificato.
                Nessun dato va perso nel passaggio.
              </p>
            </>
          )}

          {/* Payment details: filled from configuration (lib/billing.ts). Hidden in the Android app. */}
          {!inAndroidApp ? (
            <div className="grid sm:grid-cols-2 gap-3 mt-4" data-testid="payment-methods">
              <div className="rounded-xl p-4" style={{ background: "var(--surface-xs)", border: "1px solid var(--border)" }}>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-dim)" }}>
                  <CreditCard size={13} /> Carta o wallet
                </p>
                {PAYMENT_LINK ? (
                  <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="accent-btn inline-block px-4 py-2.5 rounded-xl text-sm">
                    Paga online
                  </a>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Riceverai via email il link per il pagamento dopo aver inviato la richiesta.
                  </p>
                )}
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--surface-xs)", border: "1px solid var(--border)" }}>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-dim)" }}>
                  <Landmark size={13} /> Bonifico
                </p>
                {PAYMENT_IBAN ? (
                  <p className="text-sm break-all" style={{ color: "var(--text)" }}>
                    {PAYMENT_HOLDER && <>{PAYMENT_HOLDER}<br /></>}
                    <span className="font-mono">{PAYMENT_IBAN}</span><br />
                    <span style={{ color: "var(--text-muted)" }}>Causale: Premium {user?.email}</span>
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Le coordinate bancarie ti verranno comunicate via email.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Dopo la richiesta verrai contattato via email per completare l&apos;attivazione.
            </p>
          )}

          {error && <p className="text-sm mt-4" style={{ color: "#f87171" }}>{error}</p>}
          {!pending && (
            <button onClick={requestPremium} disabled={sending || !user}
              className="accent-btn mt-5 w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Crown size={15} />}
              Richiedi Premium
            </button>
          )}
          <Link href={CONTACT_SALES_PATH}
            className="outline-btn mt-3 w-full sm:w-auto sm:ml-3 px-6 py-3 rounded-xl text-sm inline-flex items-center justify-center gap-2">
            <MessageCircle size={15} /> Parla con il team commerciale
          </Link>
          <p className="text-xs mt-4" style={{ color: "var(--text-dim)" }}>
            Procedendo accetti i <Link href="/termini" className="underline">termini di servizio</Link>. Puoi disdire in qualsiasi momento:
            i dati restano conservati.
          </p>
        </div>
      )}
    </div>
  );
}
