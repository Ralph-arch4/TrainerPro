import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import { Users, Activity, UtensilsCrossed, TrendingUp, FileDown, Calculator, CheckCircle, ArrowRight, Dumbbell } from "lucide-react";

const features = [
  { icon: Users,           title: "Gestione Clienti",      desc: "Anagrafica completa, obiettivi, livello e storico di ogni cliente in un unico posto." },
  { icon: Activity,        title: "Fasi di Allenamento",   desc: "Pianifica fasi di Bulk, Cut e Mantenimento con durata, calorie target e progressi." },
  { icon: UtensilsCrossed, title: "Piani Alimentari",      desc: "Crea diete personalizzate con macro e calorie, collegate a ogni fase di allenamento." },
  { icon: TrendingUp,      title: "Misurazioni Corporee",  desc: "Traccia peso, % grasso, circonferenze e visualizza i progressi nel tempo." },
  { icon: Calculator,      title: "Preventivi",            desc: "Genera preventivi professionali per i tuoi servizi in pochi secondi." },
  { icon: FileDown,        title: "Esporta in PDF",        desc: "Condividi schede e piani dietetici con i tuoi clienti in formato PDF." },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--black)", color: "var(--ivory)", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16 glass-dark">
        {/* Subtle red line at bottom of nav */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(229,50,50,0.5) 30%, rgba(229,50,50,0.5) 70%, transparent)' }} />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl accent-btn flex items-center justify-center pulse-glow">
            <Dumbbell size={18} />
          </div>
          <span className="font-black text-lg accent-text tracking-tight">TrainerPro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="nav-ghost-link text-sm px-4 py-2 rounded-xl transition-all font-medium">
            Accedi
          </Link>
          <Link href="/register" className="accent-btn text-sm px-5 py-2.5 rounded-xl font-bold tracking-wide">
            Inizia gratis
          </Link>
        </div>
      </nav>

      {/* Hero — 3D split layout */}
      <HeroSection />

      {/* How it works */}
      <section className="py-20 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-3">
            Come <span className="accent-text">funziona</span>
          </h2>
          <p className="text-center text-base mb-12" style={{ color: "rgba(245,240,232,0.5)" }}>
            In 3 passi il tuo studio è operativo
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Aggiungi i tuoi clienti", desc: "Crea il profilo di ogni cliente con obiettivi, livello e dati personali. Tutto organizzato in un posto." },
              { step: "02", title: "Costruisci le schede", desc: "Crea schede di allenamento divise per giorni, aggiungi esercizi con serie e ripetizioni target." },
              { step: "03", title: "Condividi il link", desc: "Il cliente riceve un link personale e compila i progressi settimana per settimana — senza registrarsi." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative card-luxury rounded-2xl p-6">
                <div className="text-7xl font-black mb-4 leading-none select-none" style={{
                  background: 'linear-gradient(135deg, rgba(229,50,50,0.18), rgba(229,50,50,0.04))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{step}</div>
                <h3 className="font-bold mb-2 text-base" style={{ color: "var(--ivory)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Tutto ciò che ti serve,<br /><span className="accent-text">niente di superfluo</span>
          </h2>
          <p className="text-center text-base mb-12" style={{ color: "rgba(245,240,232,0.5)" }}>
            Progettato specificamente per personal trainer nel mondo fitness e bodybuilding.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-luxury rounded-2xl p-6 group cursor-default">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, rgba(229,50,50,0.15), rgba(229,50,50,0.05))",
                    border: "1px solid rgba(229,50,50,0.15)",
                    boxShadow: "0 0 20px rgba(229,50,50,0.07)",
                  }}>
                  <Icon size={20} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="font-bold mb-2 text-sm" style={{ color: "var(--ivory)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free — tutto incluso */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Tutto incluso, <span className="accent-text">gratis</span>
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(245,240,232,0.5)" }}>
            Nessuna carta di credito. Nessun piano a pagamento. Accesso completo a tutte le funzionalità dal primo giorno.
          </p>
          <div className="card-luxury rounded-2xl p-8 text-left max-w-md mx-auto">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold" style={{ color: "var(--ivory)" }}>€0</span>
              <span className="text-base" style={{ color: "rgba(245,240,232,0.4)" }}>per sempre</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "Clienti illimitati",
                "Schede di allenamento personalizzate",
                "Piani alimentari con macro",
                "Fasi: Bulk, Cut, Mantenimento",
                "Misurazioni corporee",
                "Form di intake per i clienti",
                "Preventivi professionali",
                "Export PDF completo",
                "Link condiviso per ogni cliente",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(245,240,232,0.75)" }}>
                  <CheckCircle size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="accent-btn w-full py-3 rounded-xl text-sm text-center font-semibold block">
              Crea account gratuito
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Domande <span className="accent-text">frequenti</span>
          </h2>
          {[
            { q: "TrainerPro è davvero gratuito?", a: "Sì, completamente. Nessuna carta di credito, nessun piano a pagamento, nessun limite nascosto. Accesso completo a tutte le funzionalità." },
            { q: "Posso esportare i piani in PDF?", a: "Sì, tutti i piani di allenamento e le diete possono essere esportati in PDF per essere condivisi con i clienti." },
            { q: "I miei dati sono al sicuro?", a: "Assolutamente. I dati sono archiviati su Supabase con crittografia e accesso protetto da Row Level Security." },
            { q: "Quanti clienti posso gestire?", a: "Clienti illimitati. Non c'è nessun tetto massimo: puoi aggiungere tutti i clienti che vuoi dal primo giorno." },
          ].map(({ q, a }) => (
            <div key={q} className="mb-6 pb-6" style={{ borderBottom: "1px solid rgba(229,50,50,0.08)" }}>
              <h3 className="font-semibold mb-2" style={{ color: "var(--ivory)" }}>{q}</h3>
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.55)" }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-12 text-center relative overflow-hidden">
        {/* Laser beam bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[
            { top: '25%', op: 0.35, dur: '4s', delay: '0s'   },
            { top: '55%', op: 0.5,  dur: '3s', delay: '1.2s' },
            { top: '75%', op: 0.3,  dur: '5s', delay: '0.6s' },
          ].map((b, i) => (
            <div key={i} className="laser-line" style={{
              top: b.top, height: '1.5px',
              '--beam-op': b.op, '--beam-dur': b.dur, '--beam-delay': b.delay,
            } as React.CSSProperties} />
          ))}
        </div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(229,50,50,0.08)', border: '1px solid rgba(229,50,50,0.25)', color: 'var(--accent-light)' }}>
            Inizia oggi · Gratis
          </div>
          <h2 className="text-3xl lg:text-5xl font-black mb-4 tracking-tight">
            Pronto a fare il <span className="accent-text">salto</span>?
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>
            Unisciti ai personal trainer che usano TrainerPro per gestire il loro business in modo professionale.
          </p>
          <Link href="/register" className="accent-btn inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold">
            Crea il tuo account gratuito <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 text-center text-sm" style={{ borderTop: "1px solid rgba(229,50,50,0.08)", color: "rgba(245,240,232,0.3)" }}>
        © {new Date().getFullYear()} TrainerPro · Tutti i diritti riservati
      </footer>
    </div>
  );
}
