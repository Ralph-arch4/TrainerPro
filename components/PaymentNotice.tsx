"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { APP_NAME } from "@/lib/brand";
import { getPaymentStatus, formatDueDate } from "@/lib/billing";

const DISMISS_KEY = "payment-notice-dismissed";

function today() { return new Date().toISOString().slice(0, 10); }

// Small pop-up for trainers without a paid subscription: 30 days to pay,
// then access is blocked and client data is sent by email. Dismissing it
// hides it until the next day (per device).
const noopSubscribe = () => () => {};
function readDismissed(): string {
  try { return localStorage.getItem(DISMISS_KEY) ?? ""; } catch { return ""; }
}

export default function PaymentNotice() {
  const user = useAppStore((s) => s.user);
  // "ssr" on the server and during hydration: the notice only renders client-side
  const dismissed = useSyncExternalStore(noopSubscribe, readDismissed, () => "ssr");
  const [closed, setClosed] = useState(false);
  const clientCount = useAppStore((s) => s.clients.length);
  // Only accounts that already work with more clients than the demo allows
  const status = useMemo(() => getPaymentStatus(user, new Date(), undefined, clientCount), [user, clientCount]);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, `${user?.id}:${today()}`); } catch { /* storage blocked */ }
    setClosed(true);
  }

  if (!user || !status?.show || closed || dismissed === "ssr" || dismissed === `${user.id}:${today()}`) return null;

  return (
    <div role="alertdialog" aria-labelledby="payment-notice-title" aria-describedby="payment-notice-text"
      data-testid="payment-notice"
      className="print:hidden fixed z-[60] left-3 right-3 sm:left-auto sm:right-5 sm:w-[22rem] rounded-2xl p-4 fade-in"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        background: "var(--card-luxury-solid)",
        border: "1px solid rgba(201,168,76,0.45)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
      }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.35)" }}>
          <AlertTriangle size={17} style={{ color: "var(--accent)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p id="payment-notice-title" className="text-sm font-bold" style={{ color: "var(--text)" }}>
            {status.expired ? "Termine di pagamento scaduto" : "Passa a Premium"}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--accent-light)" }}>
            {status.expired
              ? `Scaduto il ${formatDueDate(status.dueDate)}`
              : `${status.daysLeft === 1 ? "Manca 1 giorno" : `Mancano ${status.daysLeft} giorni`} · entro il ${formatDueDate(status.dueDate)}`}
          </p>
        </div>
        <button onClick={dismiss} aria-label="Chiudi avviso" className="p-2 -m-1 rounded-lg flex-shrink-0"
          style={{ color: "var(--text-muted)" }}>
          <X size={16} />
        </button>
      </div>
      <p id="payment-notice-text" className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        La demo gratuita prevede un solo cliente. Se entro 30 giorni non attivi Premium non sarà più
        possibile accedere alle funzionalità di {APP_NAME}. I dati dei tuoi clienti non andranno persi:
        ti verranno inviati via email in modo sicuro.
      </p>
      <div className="flex gap-2 mt-3">
        <Link href="/dashboard/abbonamento" onClick={dismiss} className="accent-btn flex-1 text-center px-3 py-2.5 rounded-xl text-xs">
          Attiva Premium
        </Link>
        <button onClick={dismiss} className="outline-btn flex-1 px-3 py-2.5 rounded-xl text-xs">
          Ho capito
        </button>
      </div>
    </div>
  );
}
