"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, MessageCircle, Crown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { accountAccess, getTrialStatus, formatDueDate } from "@/lib/billing";
import { CONTACT_SALES_PATH } from "@/lib/brand";

// Pages a suspended trainer can still open: activate Premium, manage or delete the account.
const ALLOWED = ["/dashboard/abbonamento", "/dashboard/account"];

// Blocks the trainer panel once the free trial is over without Premium, or
// when an admin suspended / banned the account (no exceptions then).
// Client links are blocked on the server (migration 027).
export default function TrialGate({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const pathname = usePathname();
  const access = accountAccess(user);
  const trial = getTrialStatus(user);

  if (access === "ok" || (access === "trial_expired" && ALLOWED.includes(pathname))) return <>{children}</>;
  const pending = user?.premiumStatus === "pending";
  const expired = access === "trial_expired";

  return (
    <div data-testid="account-suspended" className="min-h-[80dvh] flex items-center justify-center p-4 fade-in">
      <div className="card-luxury rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)" }}>
          <Lock size={24} style={{ color: "var(--accent)" }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          {expired ? "Prova gratuita terminata" : "Account sospeso"}
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {expired && trial?.endsAt && <>La prova è terminata il {formatDueDate(trial.endsAt)}. </>}
          Il pannello e i link condivisi con i tuoi clienti sono sospesi.
          {expired
            ? " I tuoi dati sono al sicuro e tornano disponibili appena attivi Premium."
            : " Contatta il team commerciale per maggiori informazioni."}
        </p>
        {expired && pending && (
          <p className="text-sm mt-3 font-semibold" style={{ color: "var(--accent-light)" }}>
            Richiesta Premium inviata: l&apos;account si riattiva appena il pagamento viene verificato.
          </p>
        )}
        <div className="flex flex-col gap-2 mt-6">
          <Link href={CONTACT_SALES_PATH} className="accent-btn px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <MessageCircle size={15} /> Parla con il team commerciale
          </Link>
          {expired && (
            <>
              <Link href="/dashboard/abbonamento" className="outline-btn px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                <Crown size={15} /> {pending ? "Stato della richiesta" : "Attiva Premium"}
              </Link>
              <Link href="/dashboard/account" className="text-xs underline mt-2" style={{ color: "var(--text-dim)" }}>
                Gestisci account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
