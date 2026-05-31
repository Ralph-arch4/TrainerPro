"use client";
import Link from "next/link";
import HamburgerNav from "@/components/HamburgerNav";
import TiltCard from "@/components/TiltCard";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Users, Activity, UtensilsCrossed, TrendingUp,
  FileDown, Calculator, CheckCircle, ArrowRight,
} from "lucide-react";

const EASE: [number,number,number,number] = [0.16, 1, 0.3, 1];

const features = [
  { icon: Users,           title: "Clienti",          desc: "Anagrafica completa, obiettivi, livello e storico in un unico posto." },
  { icon: Activity,        title: "Fasi Training",    desc: "Bulk, Cut e Mantenimento con durata, calorie target e progressi." },
  { icon: UtensilsCrossed, title: "Piani Alimentari", desc: "Diete personalizzate con macro collegate a ogni fase." },
  { icon: TrendingUp,      title: "Misurazioni",      desc: "Traccia peso, % grasso, circonferenze e visualizza i progressi." },
  { icon: Calculator,      title: "Preventivi",       desc: "Genera preventivi professionali in pochi secondi." },
  { icon: FileDown,        title: "Export PDF",       desc: "Condividi schede e piani con i tuoi clienti in PDF." },
];

const MARQUEE_TEXT = "REC STUDIO · GESTIONE CLIENTI · SCHEDE DI ALLENAMENTO · NUTRIZIONE · PROGRESSI · EXPORT PDF · ";

function SectionNum({ n }: { n: string }) {
  return (
    <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "var(--accent)" }}>
      {n}
    </span>
  );
}

function RevealDiv({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const imgY  = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 80]);
  const textY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : -60]);

  return (
    <section ref={ref} className="relative h-screen min-h-[600px] flex flex-col justify-end overflow-hidden">
      {/* ── Athlete photo background (save image as /public/hero-athlete.jpg) ── */}
      <motion.div
        style={{ y: imgY, position: "absolute", inset: "-10% 0 -10% 0" }}
        aria-hidden
      >
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(/hero-athlete.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            filter: "contrast(1.12) brightness(0.6) saturate(0.9)",
          }}
        />
      </motion.div>

      {/* ── Overlays ── */}
      {/* Bottom-to-top dark fade — ensures text legibility */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
        background: "linear-gradient(to top, #050505 0%, rgba(5,5,5,0.72) 30%, rgba(5,5,5,0.18) 65%, rgba(5,5,5,0.45) 100%)",
      }} />
      {/* Left gold atmospheric bleed */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
        background: "radial-gradient(ellipse 55% 70% at 5% 85%, rgba(201,168,76,0.12) 0%, transparent 65%)",
      }} />
      {/* Top vignette */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
        background: "linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, transparent 25%)",
      }} />

      {/* ── Nav (inside hero for z-index stacking) ── */}
      <HamburgerNav />

      {/* ── Hero text ── */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 px-6 lg:px-14 pb-16 lg:pb-24"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          className="text-xs font-mono tracking-[0.3em] uppercase mb-6"
          style={{ color: "var(--accent)" }}
        >
          REC STUDIO · CRM per Personal Trainer
        </motion.p>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="leading-[0.88] font-black tracking-tight"
          style={{ fontSize: "clamp(4.5rem, 13vw, 11rem)", letterSpacing: "-0.04em" }}
        >
          {["GESTISCI", "SCALA.", "DOMINA"].map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: reduced ? 0 : 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35 + i * 0.12, ease: EASE }}
              className="block"
              style={{ color: i === 1 ? undefined : "var(--ivory)" }}
            >
              {i === 1 ? <span className="accent-text">{word}</span> : word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Bottom row: tagline + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mt-10"
        >
          <p className="text-sm max-w-xs leading-relaxed" style={{ color: "rgba(245,240,232,0.55)" }}>
            L&apos;unico CRM pensato per chi trasforma i corpi.<br />
            Schede, nutrizione e progressi — tutto in un click.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/register" className="accent-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide">
              Inizia gratis <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="text-sm font-medium transition-colors"
              style={{ color: "rgba(245,240,232,0.5)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.5)")}>
              Accedi →
            </Link>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute right-6 lg:right-14 bottom-0 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "var(--text-faint)" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12"
            style={{ background: "linear-gradient(to bottom, var(--accent), transparent)" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Marquee ───────────────────────────────────────────────────────────────────
function Marquee() {
  return (
    <div className="py-5 overflow-hidden border-y"
      style={{ borderColor: "rgba(201,168,76,0.10)", background: "rgba(201,168,76,0.02)" }}>
      <div
        className="flex whitespace-nowrap text-xs font-mono tracking-[0.22em] uppercase"
        style={{ animation: "marqueeScroll 22s linear infinite", color: "var(--text-dim)", willChange: "transform" }}
      >
        {[0, 1].map(k => (
          <span key={k} className="flex-shrink-0">
            {MARQUEE_TEXT}{MARQUEE_TEXT}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Editorial section wrapper ─────────────────────────────────────────────────
function EditorialSection({ id, num, children }: { id?: string; num: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="relative py-32 lg:py-40 px-6 lg:px-14 overflow-hidden"
      style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}
    >
      {/* Giant watermark number */}
      <div
        className="absolute -top-4 right-0 select-none pointer-events-none font-black leading-none"
        style={{
          fontSize: "clamp(8rem, 22vw, 20rem)",
          WebkitTextStroke: "1px rgba(201,168,76,0.05)",
          color: "transparent",
          letterSpacing: "-0.06em",
          lineHeight: 0.85,
        }}
        aria-hidden
      >
        {num}
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {children}
      </div>
    </section>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
function Label({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-center gap-3 mb-10 lg:mb-14">
      <SectionNum n={num} />
      <span className="h-px flex-1 max-w-[60px]" style={{ background: "rgba(201,168,76,0.18)" }} />
      <span className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "var(--text-dim)" }}>{text}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "#050505", color: "var(--text)" }}>

      {/* ── 00: Hero ── */}
      <Hero />

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── 01: How it works ── */}
      <EditorialSection id="how" num="01">
        <Label num="01 —" text="Come Funziona" />

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <RevealDiv>
            <h2
              className="font-black tracking-tight leading-none mb-8"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", letterSpacing: "-0.04em" }}
            >
              In <span className="accent-text">3 passi</span><br />sei operativo.
            </h2>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
              Setup immediato, zero configurazione. Il tuo studio digitale è pronto in meno di 2 minuti.
            </p>
          </RevealDiv>

          <div className="space-y-0">
            {[
              { step: "01", title: "Aggiungi i clienti",  desc: "Crea il profilo con obiettivi, livello e dati personali. Tutto organizzato in un posto." },
              { step: "02", title: "Costruisci le schede", desc: "Schede divise per giorni, esercizi con serie e ripetizioni target. Condividi in un click." },
              { step: "03", title: "Traccia i progressi", desc: "Il cliente compila i progressi settimana dopo settimana — senza registrarsi." },
            ].map(({ step, title, desc }, i) => (
              <RevealDiv key={step} delay={i * 0.1}>
                <div
                  className="flex gap-6 lg:gap-8 py-8 group cursor-default"
                  style={{ borderBottom: "1px solid rgba(201,168,76,0.07)" }}
                >
                  <span
                    className="text-xs font-mono flex-shrink-0 pt-1 w-8"
                    style={{ color: "var(--accent)" }}
                  >{step}</span>
                  <div>
                    <h3 className="font-bold mb-2 transition-all duration-300 group-hover:text-[var(--accent-light)]"
                      style={{ color: "var(--text)" }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                  <span className="ml-auto text-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0 self-center"
                    style={{ color: "var(--accent)" }}>→</span>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </EditorialSection>

      {/* ── 02: Features ── */}
      <EditorialSection id="features" num="02">
        <Label num="02 —" text="Funzionalità" />

        <RevealDiv className="mb-14">
          <h2
            className="font-black tracking-tight leading-none"
            style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", letterSpacing: "-0.04em" }}
          >
            Tutto ciò che ti serve,<br />
            <span className="accent-text">niente di superfluo.</span>
          </h2>
        </RevealDiv>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ background: "rgba(201,168,76,0.06)" }}>
          {features.map(({ icon: Icon, title, desc }, i) => (
            <RevealDiv key={title} delay={i * 0.06}>
              <TiltCard className="h-full p-8 group cursor-default" maxTilt={5}
                style={{ background: "#050505" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                  style={{
                    background: "rgba(201,168,76,0.07)",
                    border: "1px solid rgba(201,168,76,0.14)",
                  }}>
                  <Icon size={18} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="font-bold mb-2 text-sm tracking-wide uppercase" style={{ color: "var(--text)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </TiltCard>
            </RevealDiv>
          ))}
        </div>
      </EditorialSection>

      {/* ── 03: Statement section (full-bleed dark) ── */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-14 overflow-hidden"
        style={{ background: "#030303", borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
        {/* Gold glow blob */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)",
        }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <RevealDiv>
            <SectionNum n="03 —" />
            <p className="text-xs font-mono tracking-[0.2em] uppercase mb-8 mt-2" style={{ color: "var(--text-dim)" }}>
              Il Vantaggio
            </p>
            <h2
              className="font-black tracking-tight leading-tight"
              style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)", letterSpacing: "-0.03em" }}
            >
              "Il trainer che usa la tecnologia<br />
              <span className="accent-text">non viene mai superato</span><br />
              da chi non la usa."
            </h2>
          </RevealDiv>

          <RevealDiv delay={0.2} className="mt-16">
            <div className="flex items-center justify-center gap-12 flex-wrap">
              {[
                { value: "2 min", label: "Setup iniziale" },
                { value: "∞",    label: "Clienti gestibili" },
                { value: "100%", label: "Gratis per sempre" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-black mb-1" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--accent)" }}>{value}</div>
                  <div className="text-xs font-mono tracking-widest uppercase" style={{ color: "var(--text-dim)" }}>{label}</div>
                </div>
              ))}
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* ── 04: Pricing ── */}
      <EditorialSection id="pricing" num="04">
        <Label num="04 —" text="Pricing" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealDiv>
            <h2
              className="font-black tracking-tight leading-none mb-6"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.04em" }}
            >
              Tutto incluso.<br />
              <span className="accent-text">Per sempre gratis.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "26rem" }}>
              Nessuna carta di credito. Nessun piano a pagamento. Accesso completo a tutte le funzionalità dal primo giorno.
            </p>
          </RevealDiv>

          <RevealDiv delay={0.15}>
            <TiltCard
              className="rounded-2xl p-8 lg:p-10 overflow-hidden"
              maxTilt={5}
              style={{
                background: "rgba(201,168,76,0.04)",
                border: "1px solid rgba(201,168,76,0.16)",
              }}
            >
              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-black" style={{ fontSize: "clamp(3rem,8vw,5rem)", color: "var(--ivory)" }}>€0</span>
                <span style={{ color: "var(--text-dim)" }}>/ per sempre</span>
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
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.04 }}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <CheckCircle size={14} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                    {f}
                  </motion.li>
                ))}
              </ul>
              <Link href="/register"
                className="accent-btn w-full py-4 rounded-xl text-sm text-center font-bold block tracking-wide">
                Crea account gratuito →
              </Link>
            </TiltCard>
          </RevealDiv>
        </div>
      </EditorialSection>

      {/* ── 05: FAQ ── */}
      <EditorialSection id="faq" num="05">
        <Label num="05 —" text="FAQ" />

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <RevealDiv>
            <h2
              className="font-black tracking-tight leading-none"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.04em" }}
            >
              Domande<br />
              <span className="accent-text">frequenti.</span>
            </h2>
          </RevealDiv>
          <div>
            {[
              { q: "REC Studio è davvero gratuito?",     a: "Sì, completamente. Nessuna carta di credito, nessun piano a pagamento, nessun limite nascosto." },
              { q: "Posso esportare i piani in PDF?",    a: "Sì, tutti i piani di allenamento e le diete possono essere esportati in PDF per essere condivisi." },
              { q: "I miei dati sono al sicuro?",        a: "I dati sono archiviati su Supabase con crittografia e accesso protetto da Row Level Security." },
              { q: "Quanti clienti posso gestire?",      a: "Clienti illimitati. Non c'è nessun tetto massimo dal primo giorno." },
            ].map(({ q, a }, i) => (
              <RevealDiv key={q} delay={i * 0.08}>
                <div className="py-7 border-b group" style={{ borderColor: "rgba(201,168,76,0.07)" }}>
                  <h3 className="font-semibold mb-2 text-sm transition-colors duration-300 group-hover:text-[var(--accent-light)]"
                    style={{ color: "var(--text)" }}>{q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{a}</p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </EditorialSection>

      {/* ── Final CTA (full-bleed photo echo) ── */}
      <section className="relative py-40 lg:py-56 px-6 lg:px-14 text-center overflow-hidden">
        {/* Echo of hero image — bottom portion */}
        <div className="absolute inset-0" aria-hidden style={{
          backgroundImage: "url(/hero-athlete.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 70%",
          filter: "contrast(1.0) brightness(0.25) saturate(0.6)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(to bottom, #050505 0%, rgba(5,5,5,0.7) 40%, rgba(5,5,5,0.7) 60%, #050505 100%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }} />

        <RevealDiv className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-mono tracking-[0.3em] uppercase mb-6" style={{ color: "var(--accent)" }}>
            Inizia oggi · Gratis
          </p>
          <h2
            className="font-black tracking-tight leading-none mb-8"
            style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)", letterSpacing: "-0.04em" }}
          >
            Pronto a<br />
            <span className="accent-text">dominare?</span>
          </h2>
          <p className="text-base mb-12 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>
            Unisciti ai personal trainer che usano REC Studio per gestire il loro business in modo professionale.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Link href="/register"
              className="accent-btn inline-flex items-center gap-3 px-10 py-5 rounded-xl text-base font-bold tracking-wide">
              Crea il tuo account gratuito <ArrowRight size={16} />
            </Link>
          </motion.div>
        </RevealDiv>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 lg:px-14 py-10 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(201,168,76,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md accent-btn flex items-center justify-center text-xs font-black">R</div>
          <span className="font-black text-xs tracking-[0.18em] uppercase accent-text">REC STUDIO</span>
        </div>
        <p className="text-xs font-mono" style={{ color: "var(--text-faint)" }}>
          © {new Date().getFullYear()} REC GROUP · Tutti i diritti riservati
        </p>
        <div className="flex items-center gap-6 text-xs font-mono" style={{ color: "var(--text-dim)" }}>
          <Link href="/login"    className="hover:text-[var(--accent)] transition-colors">Accedi</Link>
          <Link href="/register" className="hover:text-[var(--accent)] transition-colors">Registrati</Link>
        </div>
      </footer>
    </div>
  );
}
