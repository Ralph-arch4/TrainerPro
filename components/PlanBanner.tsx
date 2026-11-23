"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { FREE_CLIENT_LIMIT } from "@/lib/plan-limits";
import { getTrialStatus, formatDueDate } from "@/lib/billing";

// Strip shown to trial accounts on every dashboard page: days left in the
// free trial and the way to Premium.
export default function PlanBanner() {
  const user = useAppStore((s) => s.user);
  const clientCount = useAppStore((s) => s.clients.length);
  const pathname = usePathname();

  const trial = getTrialStatus(user);
  if (!user || !trial?.onTrial || trial.suspended || pathname === "/dashboard/abbonamento") return null;
  const pending = user.premiumStatus === "pending";
  const urgent = trial.endsAt !== null && trial.daysLeft <= 3;

  return (
    <div data-testid="plan-banner" className="print:hidden mx-4 lg:mx-8 mt-4 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap"
      style={{
        background: urgent ? "rgba(239,68,68,0.07)" : "rgba(201,168,76,0.08)",
        border: `1px solid ${urgent ? "rgba(239,68,68,0.35)" : "rgba(201,168,76,0.28)"}`,
      }}>
      {pending ? <Clock size={15} style={{ color: "var(--accent)" }} /> : <Crown size={15} style={{ color: "var(--accent)" }} />}
      <p className="text-xs flex-1 min-w-0" style={{ color: "var(--text-muted)" }}>
        {pending
          ? "Richiesta Premium inviata: si attiva appena il pagamento viene verificato."
          : <>
              Prova gratuita
              {trial.endsAt && <> · <strong style={{ color: "var(--text)" }}>{trial.daysLeft === 1 ? "ultimo giorno" : `${trial.daysLeft} giorni rimasti`}</strong> (fino al {formatDueDate(trial.endsAt)})</>}
              {" "}· {Math.min(clientCount, FREE_CLIENT_LIMIT)}/{FREE_CLIENT_LIMIT} cliente
            </>}
      </p>
      <Link href="/dashboard/abbonamento" className={pending ? "outline-btn px-3 py-1.5 rounded-lg text-xs" : "accent-btn px-3 py-1.5 rounded-lg text-xs"}>
        {pending ? "Dettagli" : "Attiva Premium"}
      </Link>
    </div>
  );
}
