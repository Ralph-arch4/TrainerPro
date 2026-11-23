import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { APP_NAME, SALES_EMAIL, SALES_WHATSAPP } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/billing";
import ContactSalesForm from "@/components/ContactSalesForm";

export const metadata: Metadata = {
  title: `Parla con il team commerciale — ${APP_NAME}`,
  description: `Scopri come ${APP_NAME} può aiutarti a gestire tutti i tuoi clienti. Ti ricontattiamo noi.`,
};

export default function ContactSalesPage() {
  return (
    <main className="min-h-dvh px-4 py-10 sm:py-16" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent-light)" }}>← {APP_NAME}</Link>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 mt-8">
          <div>
            <p className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "var(--accent)" }}>Team commerciale</p>
            <h1 className="font-black tracking-tight leading-none mt-3" style={{ fontSize: "clamp(2.25rem, 6vw, 3.75rem)", letterSpacing: "-0.03em", color: "var(--text)" }}>
              Parliamo del <span className="accent-text">tuo studio.</span>
            </h1>
            <p className="text-base leading-relaxed mt-5" style={{ color: "var(--text-muted)" }}>
              Raccontaci quanti clienti segui e come lavori: ti proponiamo il piano giusto e ti aiutiamo a portare
              dentro {APP_NAME} schede, clienti e progressi.
            </p>
            <ul className="mt-6 space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <li>· Risposta entro un giorno lavorativo</li>
              <li>· Nessun impegno: prima ascoltiamo, poi proponiamo</li>
              <li>· Vuoi provare subito? La prova gratuita dura {TRIAL_DAYS} giorni, con un cliente.</li>
            </ul>

            {(SALES_EMAIL || SALES_WHATSAPP) && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {SALES_WHATSAPP && (
                  <a href={`https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(`Ciao! Vorrei informazioni su ${APP_NAME}.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="outline-btn px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    <MessageCircle size={15} /> Scrivici su WhatsApp
                  </a>
                )}
                {SALES_EMAIL && (
                  <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Informazioni su ${APP_NAME}`)}`}
                    className="outline-btn px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 break-all">
                    <Mail size={15} /> {SALES_EMAIL}
                  </a>
                )}
              </div>
            )}

            <p className="text-sm mt-8" style={{ color: "var(--text-dim)" }}>
              Preferisci provare da solo?{" "}
              <Link href="/register" className="underline" style={{ color: "var(--accent-light)" }}>Inizia la prova gratuita</Link>
            </p>
          </div>

          <ContactSalesForm />
        </div>
      </div>
    </main>
  );
}
