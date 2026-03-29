import Link from "next/link";
import { Dumbbell, Users, Activity, UtensilsCrossed, TrendingUp, FileDown, Calculator, CheckCircle, ArrowRight } from "lucide-react";

const features = [
  { icon: Users,           title: "Gestione Clienti",      desc: "Anagrafica completa, obiettivi, livello e storico di ogni cliente in un unico posto." },
  { icon: Activity,        title: "Fasi di Allenamento",   desc: "Pianifica fasi di Bulk, Cut e Mantenimento con durata, calorie target e progressi." },
  { icon: UtensilsCrossed, title: "Piani Alimentari",      desc: "Crea diete personalizzate con macro e calorie, collegate a ogni fase di allenamento." },
  { icon: TrendingUp,      title: "Misurazioni Corporee",  desc: "Traccia peso, % grasso, circonferenze e visualizza i progressi nel tempo." },
  { icon: Calculator,      title: "Preventivi",            desc: "Genera preventivi professionali per i tuoi servizi in pochi secondi." },
  { icon: FileDown,        title: "Esporta in PDF",        desc: "Condividi schede e piani dietetici con i tuoi clienti in formato PDF." },
];

const tiers = [
  {
    name: "Free",
    price: "€0",
    desc: "Per iniziare",
    features: ["1 cliente", "Tutte le funzionalità base", "Dashboard completa"],
    cta: "Inizia gratis",
    href: "/register",
    highlight: false,
  },
  {
    name: "Personal Coach",
    price: "€29",
    period: "/mese",
    desc: "Per i professionisti",
    features: ["Fino a 15 clienti", "Tutte le funzionalità", "Supporto prioritario", "Export PDF illimitato"],
    cta: "Scegli Personal Coach",
    href: "/register",
    highlight: true,
  },
  {
    name: "Fitness Master Customized",
    price: "Custom",
    desc: "Pericolosamente personalizzato",
    features: ["Clienti illimitati", "Personalizzato sul tuo modus operandi", "Setup dedicato", "SLA garantito"],
    cta: "Contattaci",
    href: "/register",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--black)", color: "var(--ivory)", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16 glass-dark">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl accent-btn flex items-center justify-center">
            <Dumbbell size={18} />
          </div>
          <span className="font-bold text-lg accent-text">TrainerPro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm px-4 py-2 rounded-xl transition-all hover:bg-white/5" style={{ color: "rgba(245,240,232,0.7)" }}>
            Accedi
          </Link>
          <Link href="/register" className="accent-btn text-sm px-5 py-2 rounded-xl">
            Inizia gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.25)", color: "var(--accent-light)" }}>
            <Dumbbell size={12} />
            CRM per Personal Trainer
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Gestisci i tuoi clienti<br />
            <span className="accent-text">come un professionista</span>
          </h1>
          <p className="text-lg lg:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "rgba(245,240,232,0.6)" }}>
            TrainerPro ti permette di gestire schede di allenamento, piani alimentari, fasi di bulk/cut e misurazioni di tutti i tuoi clienti in un unico posto.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="accent-btn flex items-center gap-2 px-8 py-3.5 rounded-xl text-base">
              Inizia gratis <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,107,43,0.25)", color: "var(--ivory)" }}>
              Accedi al tuo account
            </Link>
          </div>
          <p className="text-xs mt-4" style={{ color: "rgba(245,240,232,0.35)" }}>
            Nessuna carta di credito richiesta · Piano gratuito per sempre
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,107,43,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Tutto ciò che ti serve,<br /><span className="accent-text">niente di superfluo</span>
          </h2>
          <p className="text-center text-base mb-12" style={{ color: "rgba(245,240,232,0.5)" }}>
            Progettato specificamente per personal trainer nel mondo fitness e bodybuilding.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-luxury rounded-2xl p-6 hover:border-[rgba(255,107,43,0.25)] transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,107,43,0.1)" }}>
                  <Icon size={20} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "var(--ivory)" }}>{title}</h3>
                <p className="text-sm" style={{ color: "rgba(245,240,232,0.55)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,107,43,0.08)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Prezzi <span className="accent-text">trasparenti</span>
          </h2>
          <p className="text-center text-base mb-12" style={{ color: "rgba(245,240,232,0.5)" }}>
            Inizia gratis. Scala quando sei pronto.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((tier) => (
              <div key={tier.name} className={`rounded-2xl p-6 flex flex-col ${tier.highlight ? "" : "card-luxury"}`}
                style={tier.highlight ? {
                  background: "rgba(255,107,43,0.08)",
                  border: "2px solid rgba(255,107,43,0.4)",
                } : {}}>
                {tier.highlight && (
                  <div className="text-xs font-bold px-3 py-1 rounded-full self-start mb-4 accent-btn">
                    Più popolare
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1" style={{ color: "var(--ivory)" }}>{tier.name}</h3>
                <p className="text-xs mb-4" style={{ color: "rgba(245,240,232,0.4)" }}>{tier.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold" style={{ color: "var(--ivory)" }}>{tier.price}</span>
                  {tier.period && <span className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>{tier.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "rgba(245,240,232,0.7)" }}>
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}
                  className={`w-full py-3 rounded-xl text-sm text-center font-semibold transition-all ${tier.highlight ? "accent-btn" : ""}`}
                  style={!tier.highlight ? { border: "1px solid rgba(255,107,43,0.3)", color: "var(--accent-light)" } : {}}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,107,43,0.08)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Domande <span className="accent-text">frequenti</span>
          </h2>
          {[
            { q: "Posso usare TrainerPro gratis per sempre?", a: "Sì. Il piano Free ti permette di gestire 1 cliente con tutte le funzionalità senza limiti di tempo." },
            { q: "Posso esportare i piani in PDF?", a: "Sì, tutti i piani di allenamento e le diete possono essere esportati in PDF per essere condivisi con i clienti." },
            { q: "I miei dati sono al sicuro?", a: "Assolutamente. I dati sono archiviati su Supabase con crittografia e accesso protetto da Row Level Security." },
            { q: "Cos'è il piano Fitness Master Customized?", a: "È un piano completamente personalizzato sul tuo modo di lavorare, con funzionalità e limiti definiti insieme a noi." },
          ].map(({ q, a }) => (
            <div key={q} className="mb-6 pb-6" style={{ borderBottom: "1px solid rgba(255,107,43,0.08)" }}>
              <h3 className="font-semibold mb-2" style={{ color: "var(--ivory)" }}>{q}</h3>
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.55)" }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Pronto a fare il salto?
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(245,240,232,0.55)" }}>
            Unisciti ai personal trainer che usano TrainerPro per gestire il loro business in modo professionale.
          </p>
          <Link href="/register" className="accent-btn inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base">
            Crea il tuo account gratuito <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 text-center text-sm" style={{ borderTop: "1px solid rgba(255,107,43,0.08)", color: "rgba(245,240,232,0.3)" }}>
        © {new Date().getFullYear()} TrainerPro · Tutti i diritti riservati
      </footer>
    </div>
  );
}
