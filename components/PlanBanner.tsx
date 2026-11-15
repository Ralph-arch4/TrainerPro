"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crown, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { isPremium, FREE_CLIENT_LIMIT } from "@/lib/plan-limits";

const INTENT_KEY = "premium-intent-opened";

// Strip shown to demo accounts on every dashboard page. Trainers who chose
// Premium at sign-up are taken once to the subscription page.
export default function PlanBanner() {
  const user = useAppStore((s) => s.user);
  const clientCount = useAppStore((s) => s.clients.length);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user?.wantsPremium) return;
    try {
      if (localStorage.getItem(INTENT_KEY) === user.id) return;
      localStorage.setItem(INTENT_KEY, user.id);
    } catch { return; }
    router.push("/dashboard/abbonamento");
  }, [user?.wantsPremium, user?.id, router]);

  if (!user || isPremium(user.plan) || pathname === "/dashboard/abbonamento") return null;
  const pending = user.premiumStatus === "pending";

  return (
    <div data-testid="plan-banner" className="print:hidden mx-4 lg:mx-8 mt-4 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap"
      style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.28)" }}>
      {pending ? <Clock size={15} style={{ color: "var(--accent)" }} /> : <Crown size={15} style={{ color: "var(--accent)" }} />}
      <p className="text-xs flex-1 min-w-0" style={{ color: "var(--text-muted)" }}>
        {pending
          ? "Richiesta Premium inviata: si attiva appena il pagamento viene verificato."
          : <>Demo gratuita · {Math.min(clientCount, FREE_CLIENT_LIMIT)}/{FREE_CLIENT_LIMIT} cliente. Con Premium lavori con tutti i tuoi clienti.</>}
      </p>
      <Link href="/dashboard/abbonamento" className={pending ? "outline-btn px-3 py-1.5 rounded-lg text-xs" : "accent-btn px-3 py-1.5 rounded-lg text-xs"}>
        {pending ? "Dettagli" : "Passa a Premium"}
      </Link>
    </div>
  );
}
