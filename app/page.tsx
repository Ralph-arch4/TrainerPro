"use client";
import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import TiltCard from "@/components/TiltCard";
import { motion, useReducedMotion } from "framer-motion";
import { Users, Activity, UtensilsCrossed, TrendingUp, FileDown, Calculator, CheckCircle, ArrowRight, Dumbbell } from "lucide-react";

const features = [
  { icon: Users,           title: "Gestione Clienti",      desc: "Anagrafica completa, obiettivi, livello e storico di ogni cliente in un unico posto." },
  { icon: Activity,        title: "Fasi di Allenamento",   desc: "Pianifica fasi di Bulk, Cut e Mantenimento con durata, calorie target e progressi." },
  { icon: UtensilsCrossed, title: "Piani Alimentari",      desc: "Crea diete personalizzate con macro e calorie, collegate a ogni fase di allenamento." },
  { icon: TrendingUp,      title: "Misurazioni Corporee",  desc: "Traccia peso, % grasso, circonferenze e visualizza i progressi nel tempo." },
  { icon: Calculator,      title: "Preventivi",            desc: "Genera preventivi professionali per i tuoi servizi in pochi secondi." },
  { icon: FileDown,        title: "Esporta in PDF",        desc: "Condividi schede e piani dietetici con i tuoi clienti in formato PDF." },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: React.ReactNode; sub: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="text-center mb-12"
    >
      {eyebrow && (
        <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(229,50,50,0.07)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--accent-light)" }}>
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl lg:text-4xl font-bold mb-3">{title}</h2>
      <p className="text-base max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const reduced = useReducedMotion();

  return (
    <div style={{ background: "var(--black)", color: "var(--text)", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16 glass-dark">
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(229,50,50,0.5) 30%, rgba(229,50,50,0.5) 70%, transparent)" }} />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl accent-btn flex items-center justify-center pulse-glow">
            <Dumbbell size={18} />
          </div>
          <span className="font-black text-lg accent-text tracking-tight">TrainerPro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="nav-ghost-link text-sm px-4 py-2 rounded-xl transition-all font-medium">Accedi</Link>
          <Link href="/register" className="accent-btn text-sm px-5 py-2.5 rounded-xl font-bold tracking-wide">Inizia gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* How it works */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            eyebrow="Come funziona"
            title={<>In <span className="accent-text">3 passi</span> sei operativo</>}
            sub="Setup immediato, zero configurazione. Il tuo studio digitale è pronto in meno di 2 minuti."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Aggiungi i tuoi clienti", desc: "Crea il profilo di ogni cliente con obiettivi, livello e dati personali. Tutto organizzato in un posto." },
              { step: "02", title: "Costruisci le schede", desc: "Crea schede di allenamento divise per giorni, aggiungi esercizi con serie e ripetizioni target." },
              { step: "03", title: "Condividi il link", desc: "Il cliente riceve un link personale e compila i progressi settimana per settimana — senza registrarsi." },
            ].map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: reduced ? 0 : 40, rotateX: reduced ? 0 : 8 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                style={{ transformPerspective: 900 }}
              >
                <TiltCard className="relative card-luxury rounded-2xl p-6 h-full overflow-hidden">
                  {/* Step number watermark */}
                  <div className="absolute -top-2 -right-1 text-8xl font-black leading-none select-none pointer-events-none"
                    style={{ background: "linear-gradient(135deg, rgba(229,50,50,0.12), rgba(229,50,50,0.03))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4 text-xs font-bold"
                      style={{ background: "rgba(229,50,50,0.1)", border: "1px solid rgba(229,50,50,0.2)", color: "var(--accent)" }}>
                      {step}
                    </div>
                    <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text)" }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Funzionalità"
            title={<>Tutto ciò che ti serve,<br /><span className="accent-text">niente di superfluo</span></>}
            sub="Progettato specificamente per personal trainer nel mondo fitness e bodybuilding."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: reduced ? 0 : 35, scale: reduced ? 1 : 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.07, ease: EASE }}
              >
                <TiltCard className="card-luxury rounded-2xl p-6 h-full overflow-hidden cursor-default" maxTilt={8}>
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, rgba(229,50,50,0.15), rgba(229,50,50,0.05))",
                        border: "1px solid rgba(229,50,50,0.15)",
                        boxShadow: "0 0 20px rgba(229,50,50,0.07)",
                      }}>
                      <Icon size={20} style={{ color: "var(--accent)" }} />
                    </div>
                    <h3 className="font-bold mb-2 text-sm" style={{ color: "var(--text)" }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow="Pricing"
            title={<>Tutto incluso, <span className="accent-text">gratis</span></>}
            sub="Nessuna carta di credito. Nessun piano a pagamento. Accesso completo a tutte le funzionalità dal primo giorno."
          />
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 40, scale: reduced ? 1 : 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <TiltCard className="card-luxury rounded-2xl p-8 max-w-md mx-auto overflow-hidden" maxTilt={6}>
              <div className="relative z-10">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold" style={{ color: "var(--text)" }}>€0</span>
                  <span className="text-base" style={{ color: "var(--text-dim)" }}>per sempre</span>
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
                  ].map((f, i) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: reduced ? 0 : -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease: "easeOut" }}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <CheckCircle size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                      {f}
                    </motion.li>
                  ))}
                </ul>
                <Link href="/register" className="accent-btn w-full py-3 rounded-xl text-sm text-center font-semibold block">
                  Crea account gratuito
                </Link>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(229,50,50,0.08)" }}>
        <div className="max-w-2xl mx-auto">
          <SectionHeader
            eyebrow="FAQ"
            title={<>Domande <span className="accent-text">frequenti</span></>}
            sub="Tutto quello che devi sapere per iniziare oggi."
          />
          {[
            { q: "TrainerPro è davvero gratuito?", a: "Sì, completamente. Nessuna carta di credito, nessun piano a pagamento, nessun limite nascosto. Accesso completo a tutte le funzionalità." },
            { q: "Posso esportare i piani in PDF?", a: "Sì, tutti i piani di allenamento e le diete possono essere esportati in PDF per essere condivisi con i clienti." },
            { q: "I miei dati sono al sicuro?", a: "Assolutamente. I dati sono archiviati su Supabase con crittografia e accesso protetto da Row Level Security." },
            { q: "Quanti clienti posso gestire?", a: "Clienti illimitati. Non c'è nessun tetto massimo: puoi aggiungere tutti i clienti che vuoi dal primo giorno." },
          ].map(({ q, a }, i) => (
            <motion.div
              key={q}
              initial={{ opacity: 0, y: reduced ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
              className="mb-6 pb-6"
              style={{ borderBottom: "1px solid rgba(229,50,50,0.08)" }}
            >
              <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>{q}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[
            { top: "25%", op: 0.35, dur: "4s", delay: "0s" },
            { top: "55%", op: 0.5,  dur: "3s", delay: "1.2s" },
            { top: "75%", op: 0.3,  dur: "5s", delay: "0.6s" },
          ].map((b, i) => (
            <div key={i} className="laser-line" style={{
              top: b.top, height: "1.5px",
              "--beam-op": b.op, "--beam-dur": b.dur, "--beam-delay": b.delay,
            } as React.CSSProperties} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 50, scale: reduced ? 1 : 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-2xl mx-auto relative z-10"
        >
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: "rgba(229,50,50,0.08)", border: "1px solid rgba(229,50,50,0.25)", color: "var(--accent-light)" }}>
            Inizia oggi · Gratis
          </div>
          <h2 className="text-3xl lg:text-5xl font-black mb-4 tracking-tight">
            Pronto a fare il <span className="accent-text">salto</span>?
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Unisciti ai personal trainer che usano TrainerPro per gestire il loro business in modo professionale.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Link href="/register" className="accent-btn inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold">
              Crea il tuo account gratuito <ArrowRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <footer className="px-6 lg:px-12 py-8 text-center text-sm"
        style={{ borderTop: "1px solid rgba(229,50,50,0.08)", color: "var(--text-dim)" }}>
        © {new Date().getFullYear()} TrainerPro · Tutti i diritti riservati
      </footer>
    </div>
  );
}
