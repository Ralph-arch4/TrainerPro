import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, LEGAL_OWNER, CONTACT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Informativa sulla privacy — ${APP_NAME}`,
  description: `Come ${APP_NAME} tratta i dati di personal trainer e clienti.`,
};

const UPDATED = "13 novembre 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--text-muted)" }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const owner = LEGAL_OWNER || `il gestore di ${APP_NAME}`;
  const contact = CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--accent-light)" }}>{CONTACT_EMAIL}</a>
    : <>i recapiti indicati nella scheda dell&apos;app sullo store</>;

  return (
    <main className="min-h-dvh px-4 py-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent-light)" }}>← {APP_NAME}</Link>
        <h1 className="text-3xl font-bold mt-4 mb-1" style={{ color: "var(--text)" }}>Informativa sulla privacy</h1>
        <p className="text-xs mb-8" style={{ color: "var(--text-dim)" }}>Ultimo aggiornamento: {UPDATED}</p>

        <Section title="Chi tratta i dati">
          <p>
            Il titolare del trattamento per i dati degli account dei personal trainer è {owner}. Per i dati dei
            clienti inseriti dal personal trainer (schede, diete, misurazioni, note), il titolare è il personal
            trainer stesso e {APP_NAME} agisce come responsabile del trattamento per suo conto.
          </p>
          <p>Per qualsiasi richiesta puoi scrivere a {contact}.</p>
        </Section>

        <Section title="Quali dati raccogliamo">
          <p><strong>Personal trainer:</strong> nome, email, password (conservata in forma cifrata dal fornitore di autenticazione), piano di abbonamento.</p>
          <p><strong>Clienti del trainer:</strong> nome, contatti, data di nascita, obiettivo, livello, schede di allenamento, carichi e ripetizioni registrati, feedback sugli allenamenti, indicazioni alimentari, misurazioni corporee e note.</p>
          <p><strong>Questionario iniziale:</strong> se il trainer lo invia, il cliente può indicare abitudini, infortuni, patologie, farmaci e allergie. Queste informazioni sulla salute sono raccolte solo con il consenso esplicito del cliente, dato al momento dell&apos;invio.</p>
          <p><strong>Cosa non raccogliamo:</strong> non conserviamo foto dei clienti, non usiamo sistemi di intelligenza artificiale per analizzare le persone e non creiamo profili automatizzati.</p>
          <p><strong>Dati tecnici:</strong> cookie di sessione necessari all&apos;accesso e preferenze salvate sul dispositivo (tema, dati in cache). Non usiamo cookie di profilazione né pubblicità.</p>
        </Section>

        <Section title="Perché li usiamo">
          <p>Usiamo i dati solo per fornire il servizio: permettere al trainer di gestire i propri clienti e al cliente di consultare la scheda e registrare gli allenamenti tramite il link ricevuto dal trainer. Le misurazioni corporee e le informazioni sulla salute sono trattate sulla base del consenso che il cliente dà al proprio trainer.</p>
        </Section>

        <Section title="Dove sono conservati e con chi sono condivisi">
          <p>I dati sono conservati su Supabase (database e autenticazione) e l&apos;applicazione è ospitata su Vercel. Questi fornitori trattano i dati per nostro conto. Non vendiamo dati e non li condividiamo con terzi per finalità di marketing.</p>
          <p>Le connessioni sono cifrate (HTTPS) e ogni trainer può accedere solo ai dati dei propri clienti.</p>
        </Section>

        <Section title="Per quanto tempo">
          <p>I dati restano finché l&apos;account del trainer è attivo. Quando un trainer elimina un cliente o il proprio account, i dati collegati vengono cancellati dai sistemi attivi; le copie di backup vengono sovrascritte entro 30 giorni.</p>
        </Section>

        <Section title="I tuoi diritti">
          <p>Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità dei dati e opporti al trattamento, oltre a proporre reclamo al Garante per la protezione dei dati personali. I clienti possono rivolgersi al proprio trainer oppure a noi.</p>
        </Section>

        <Section title="Eliminazione dell'account e dei dati">
          <p id="elimina-account">
            Il trainer può eliminare in qualsiasi momento il proprio account e tutti i dati collegati direttamente
            dall&apos;app: <Link href="/dashboard/account" className="underline" style={{ color: "var(--accent-light)" }}>Menu → Account → Elimina account</Link>.
            In alternativa può richiederlo scrivendo a {contact}: la richiesta viene evasa entro 30 giorni.
          </p>
        </Section>

        <Section title="Modifiche">
          <p>Se questa informativa cambia in modo sostanziale, avviseremo i trainer nell&apos;app prima che le modifiche abbiano effetto.</p>
        </Section>
      </div>
    </main>
  );
}
