import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, LEGAL_OWNER, CONTACT_EMAIL } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/billing";
import { FREE_CLIENT_LIMIT } from "@/lib/plan-limits";

export const metadata: Metadata = {
  title: `Termini di servizio — ${APP_NAME}`,
  description: `Condizioni d'uso di ${APP_NAME}: prova gratuita e piano Premium.`,
};

const UPDATED = "23 novembre 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--text-muted)" }}>{children}</div>
    </section>
  );
}

export default function TermsPage() {
  const owner = LEGAL_OWNER || `il gestore di ${APP_NAME}`;
  const contact = CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--accent-light)" }}>{CONTACT_EMAIL}</a>
    : <>i recapiti indicati nella scheda dell&apos;app sullo store</>;
  return (
    <main className="min-h-dvh px-4 py-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent-light)" }}>← {APP_NAME}</Link>
        <h1 className="text-3xl font-bold mt-4 mb-1" style={{ color: "var(--text)" }}>Termini di servizio</h1>
        <p className="text-xs mb-8" style={{ color: "var(--text-dim)" }}>Ultimo aggiornamento: {UPDATED}</p>

        <Section title="Il servizio">
          <p>{APP_NAME} è uno strumento di lavoro per personal trainer, fornito da {owner}: gestione dei clienti, schede di allenamento, indicazioni alimentari generali, misurazioni e condivisione della scheda con il cliente.</p>
          <p>Il servizio è rivolto a professionisti maggiorenni. Il trainer è responsabile dei contenuti che inserisce e del rapporto con i propri clienti.</p>
        </Section>

        <Section title="Piani">
          <p><strong>Prova gratuita:</strong> tutte le funzionalità con un massimo di {FREE_CLIENT_LIMIT} cliente per {TRIAL_DAYS} giorni dalla registrazione, senza carta di credito.</p>
          <p><strong>Fine della prova:</strong> se allo scadere dei {TRIAL_DAYS} giorni Premium non è attivo, l&apos;account viene sospeso: il pannello del trainer e i link condivisi con i clienti (scheda, diario, questionari) smettono di funzionare. I dati non vengono cancellati e tornano disponibili con l&apos;attivazione di Premium. Puoi chiedere in qualsiasi momento l&apos;eliminazione dell&apos;account e dei dati.</p>
          <p><strong>Premium:</strong> clienti illimitati, alle condizioni economiche concordate con il team commerciale. L&apos;accesso Premium viene attivato dopo la verifica del pagamento.</p>
        </Section>

        <Section title="Pagamenti, disdetta e rimborsi">
          <p>Il pagamento avviene con i metodi indicati nella pagina Abbonamento o comunicati via email. Puoi disdire in qualsiasi momento scrivendo a {contact}: alla fine del periodo già pagato l&apos;account viene sospeso e i dati restano conservati.</p>
          <p>Se sei un consumatore hai diritto di recesso entro 14 giorni dall&apos;attivazione, con rimborso di quanto pagato.</p>
        </Section>

        <Section title="Uso corretto">
          <p>Non è consentito usare il servizio per attività illecite, inserire dati di persone senza averne titolo, tentare di accedere a dati di altri utenti o aggirare i limiti del piano.</p>
          <p>Le indicazioni alimentari presenti nell&apos;app sono generali e non sostituiscono il parere di un medico, di un biologo nutrizionista o di un dietista. L&apos;app non fornisce consulenza medica.</p>
        </Section>

        <Section title="Dati e privacy">
          <p>Il trattamento dei dati è descritto nell&apos;<Link href="/privacy" className="underline" style={{ color: "var(--accent-light)" }}>informativa sulla privacy</Link>. Puoi eliminare l&apos;account e tutti i dati in qualsiasi momento da Menu → Account.</p>
        </Section>

        <Section title="Disponibilità e responsabilità">
          <p>Ci impegniamo a mantenere il servizio disponibile e i dati al sicuro, ma non garantiamo l&apos;assenza di interruzioni. Nei limiti consentiti dalla legge, la responsabilità è limitata a quanto pagato negli ultimi 12 mesi.</p>
        </Section>

        <Section title="Modifiche e legge applicabile">
          <p>Eventuali modifiche a questi termini o ai prezzi vengono comunicate nell&apos;app con almeno 30 giorni di anticipo. Si applica la legge italiana.</p>
        </Section>
      </div>
    </main>
  );
}
