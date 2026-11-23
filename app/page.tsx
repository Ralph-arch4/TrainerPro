"use client";
import Link from "next/link";
import { APP_NAME, APP_INITIAL, COMPANY_NAME, CONTACT_SALES_PATH, SALES_EMAIL, SALES_WHATSAPP } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/billing";
import HamburgerNav from "@/components/HamburgerNav";
import TiltCard from "@/components/TiltCard";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Users, Activity, UtensilsCrossed, TrendingUp,
  FileDown, Calculator, CheckCircle, ArrowRight, MessageCircle, Mail,
} from "lucide-react";

const EASE: [number,number,number,number] = [0.16, 1, 0.3, 1];

const features = [
  { icon: Users,           title: "Clienti",          desc: "Anagrafica completa, obiettivi, livello e storico in un unico posto." },
  { icon: Activity,        title: "Fasi Training",    desc: "Bulk, Cut e Mantenimento con durata, calorie target e progressi." },
  { icon: UtensilsCrossed, title: "Indicazioni alimentari", desc: "Linee guida generali sull'alimentazione, collegate a ogni fase." },
  { icon: TrendingUp,      title: "Misurazioni",      desc: "Traccia peso, % grasso, circonferenze e visualizza i progressi." },
  { icon: Calculator,      title: "Preventivi",       desc: "Genera preventivi professionali in pochi secondi." },
  { icon: FileDown,        title: "Export PDF",       desc: "Condividi schede e piani con i tuoi clienti in PDF." },
];

const MARQUEE_TEXT = `${APP_NAME.toUpperCase()} · GESTIONE CLIENTI · SCHEDE DI ALLENAMENTO · NUTRIZIONE · PROGRESSI · EXPORT PDF · `;

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
      initial={reduced ? { opacity: 0 } : { opacity: 0, rotateX: 18, y: 50, scale: 0.97 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      className={className}
      style={{
        transformPerspective: 1100,
        transformOrigin: "center bottom",
        ...style,
      }}
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

  // ── Mouse-driven 3D parallax (smooth, spring-damped) ──
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 70, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), spring);
  const videoX  = useSpring(useTransform(mx, [-0.5, 0.5], [-26, 26]), spring);
  const videoYm = useSpring(useTransform(my, [-0.5, 0.5], [-18, 18]), spring);
  const textXm  = useSpring(useTransform(mx, [-0.5, 0.5], [20, -20]), spring);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // On mobile show the FULL video frame (contain), no zoom/parallax; cover on desktop.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function handleMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function handleLeave() { mx.set(0); my.set(0); }

  // ── Mount guard (prevents a flash of the wrong layout on first paint) ──
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Mobile gyroscope tilt for the framed video card ──
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const cardRotX = useSpring(useTransform(gy, [-1, 1], [7, -7]), spring);
  const cardRotY = useSpring(useTransform(gx, [-1, 1], [-9, 9]), spring);
  useEffect(() => {
    if (!isMobile || reduced) return;
    const clamp = (v: number, m: number) => Math.max(-1, Math.min(1, v / m));
    const onOrient = (e: DeviceOrientationEvent) => {
      gx.set(clamp(e.gamma ?? 0, 40));
      gy.set(clamp((e.beta ?? 0) - 45, 40));
    };
    window.addEventListener("deviceorientation", onOrient, true);
    return () => window.removeEventListener("deviceorientation", onOrient, true);
  }, [isMobile, reduced, gx, gy]);

  const words = ["GESTISCI", "SCALA.", "DOMINA"];

  // Pre-mount: neutral dark shell (no flash of the wrong layout)
  if (!mounted) {
    return (
      <section className="relative overflow-hidden" style={{ minHeight: "100svh", background: "#050505" }}>
        <HamburgerNav />
      </section>
    );
  }

  // ── MOBILE: premium FRAMED video (full frame, zero crop) in normal scroll flow ──
  if (isMobile) {
    return (
      <section className="relative flex flex-col overflow-hidden" style={{ minHeight: "100svh", background: "#050505" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
          background: "radial-gradient(ellipse 75% 42% at 50% 16%, rgba(201,168,76,0.16) 0%, transparent 60%)",
        }} />
        <HamburgerNav />

        <div className="relative z-10 flex flex-col px-5 pt-20 pb-12 gap-8">
          {/* Framed video card — levitates + tilts with the gyroscope */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{ perspective: 1100 }}
          >
            <motion.div
              animate={reduced ? {} : { y: [0, -7, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                style={{
                  rotateX: cardRotX, rotateY: cardRotY, transformStyle: "preserve-3d",
                  opacity: videoReady ? 1 : 0, transition: "opacity 0.7s ease",
                  background: "linear-gradient(140deg, rgba(201,168,76,0.55), rgba(201,168,76,0.08) 55%, rgba(201,168,76,0.32))",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 50px rgba(201,168,76,0.18)",
                }}
                className="relative rounded-[26px] p-[1.5px]"
              >
                <div className="relative rounded-[25px] overflow-hidden" style={{ background: "#0b0b0b" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={() => setVideoReady(true)}
                    onPlaying={() => setVideoReady(true)}
                    className="block w-full h-auto"
                    style={{ filter: "contrast(1.06) saturate(1.06)" }}
                  >
                    <source src="/hero.mp4" type="video/mp4" />
                  </video>
                  {/* sheen + base fade */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
                    background: "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 34%), linear-gradient(to top, rgba(5,5,5,0.5), transparent 42%)",
                  }} />
                  {/* corner accents */}
                  {["top-3 left-3 border-t-2 border-l-2 rounded-tl-md", "top-3 right-3 border-t-2 border-r-2 rounded-tr-md", "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md", "bottom-3 right-3 border-b-2 border-r-2 rounded-br-md"].map(c => (
                    <span key={c} className={`absolute w-6 h-6 ${c}`} style={{ borderColor: "rgba(201,168,76,0.7)" }} />
                  ))}
                  {/* live badge */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: "rgba(5,5,5,0.6)", border: "1px solid rgba(201,168,76,0.3)", backdropFilter: "blur(8px)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
                    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--accent-light, #E8CC7A)" }}>{APP_NAME}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Headline + copy + CTA (normal flow → whole page stays visible/scrollable) */}
          <div>
            <h1 className="leading-[0.9] font-black tracking-tight" style={{ fontSize: "clamp(2.4rem, 12vw, 3.6rem)", letterSpacing: "-0.03em" }}>
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: reduced ? 0 : 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: EASE }}
                  className="block"
                  style={{ color: i === 1 ? undefined : "var(--ivory)" }}
                >
                  {i === 1 ? <span className="accent-text">{word}</span> : word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-base leading-relaxed"
              style={{ color: "rgba(245,240,232,0.6)" }}
            >
              Il gestionale per personal trainer: clienti, schede, alimentazione e progressi in un unico posto.
              Provalo gratis per {TRIAL_DAYS} giorni, con tutte le funzioni.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, ease: EASE }}
              className="mt-7 flex flex-col gap-3"
            >
              <Link href="/register" className="accent-btn inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold">
                Prova gratis {TRIAL_DAYS} giorni <ArrowRight size={16} />
              </Link>
              <Link href={CONTACT_SALES_PATH} className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-medium"
                style={{ border: "1px solid rgba(201,168,76,0.25)", color: "rgba(245,240,232,0.8)", background: "rgba(201,168,76,0.05)" }}>
                Parla con il team commerciale
              </Link>
              <Link href="/login" className="text-center text-sm py-1" style={{ color: "rgba(245,240,232,0.55)" }}>
                Hai già un account? Accedi
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // ── DESKTOP: cinematic full-bleed video + 3D mouse parallax (unchanged) ──
  return (
    <section
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative min-h-screen flex flex-col justify-end overflow-hidden"
      style={{ perspective: 1300, minHeight: "100svh", background: "#050505" }}
    >
      {/* ── Looping video background — fades in when ready (NO poster, no old-photo flash) ── */}
      <motion.div
        style={{
          y: imgY, position: "absolute", inset: isMobile ? 0 : "-8% -4%",
          transformStyle: "preserve-3d",
          opacity: videoReady ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
        aria-hidden
      >
        <motion.video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          style={{
            x: isMobile ? 0 : videoX, y: isMobile ? 0 : videoYm,
            rotateX: isMobile ? 0 : rotateX, rotateY: isMobile ? 0 : rotateY,
            scale: isMobile ? 1 : 1.14,
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: isMobile ? "contain" : "cover",
            objectPosition: "center center",
            transformOrigin: "center center",
            filter: isMobile
              ? "contrast(1.05) brightness(0.92) saturate(1.04)"
              : "contrast(1.08) brightness(0.6) saturate(1.04)",
          }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </motion.video>
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

      {/* ── Hero text (floats above video, mouse parallax) ── */}
      <motion.div
        style={{ y: textY, x: textXm, z: 60, transformStyle: "preserve-3d" }}
        className="relative z-10 px-6 lg:px-14 pb-16 lg:pb-24"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="leading-[0.88] font-black tracking-tight"
          style={{ fontSize: "clamp(3rem, 13.5vw, 11rem)", letterSpacing: "-0.04em" }}
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
            Il gestionale per personal trainer: clienti, schede,<br />
            alimentazione e progressi in un unico posto.<br />
            <span style={{ color: "rgba(245,240,232,0.8)" }}>{TRIAL_DAYS} giorni gratis, tutte le funzioni.</span>
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/register" className="accent-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-wide">
              Prova gratis {TRIAL_DAYS} giorni <ArrowRight size={14} />
            </Link>
            <Link href={CONTACT_SALES_PATH} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium"
              style={{ border: "1px solid rgba(201,168,76,0.3)", color: "rgba(245,240,232,0.85)", background: "rgba(201,168,76,0.06)" }}>
              Parla con noi
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
  const reduced = useReducedMotion();
  return (
    <section
      id={id}
      className="relative py-32 lg:py-40 px-6 lg:px-14 overflow-hidden"
      style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}
    >
      {/* Giant watermark number — 3D sweep from right */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 60, rotateY: -12 }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, x: 0, rotateY: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.0, ease: EASE }}
        className="absolute -top-4 right-0 select-none pointer-events-none font-black leading-none"
        style={{
          fontSize: "clamp(8rem, 22vw, 20rem)",
          WebkitTextStroke: "1px rgba(201,168,76,0.05)",
          color: "transparent",
          letterSpacing: "-0.06em",
          lineHeight: 0.85,
          transformPerspective: 800,
          transformOrigin: "right center",
        }}
        aria-hidden
      >
        {num}
      </motion.div>
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

const TRIAL_INCLUDES = [
  "Scheda di allenamento con progressioni e superserie",
  "Portale del cliente con link condiviso",
  "Indicazioni alimentari, fasi e misurazioni",
  "Form di intake, preventivi ed export PDF",
];

const FAQ = [
  { q: "Come funziona la prova gratuita?", a: `Ti registri con email e password, senza carta di credito. Per ${TRIAL_DAYS} giorni hai tutte le funzionalità, con un cliente: puoi creare la sua scheda, condividergli il link e seguire i suoi progressi.` },
  { q: `Cosa succede alla fine dei ${TRIAL_DAYS} giorni?`, a: "Se vuoi continuare, il team commerciale attiva Premium e lavori con tutti i tuoi clienti. Altrimenti l'account viene sospeso, insieme ai link condivisi con il cliente. Non cancelliamo nulla: i dati tornano disponibili appena attivi Premium." },
  { q: "Quanto costa?", a: "Dipende da quanti clienti segui e da come lavori. Non abbiamo un listino unico: scrivi al team commerciale e ti facciamo una proposta su misura." },
  { q: "I miei clienti devono installare qualcosa?", a: "No. Ricevono un link personale e aprono la scheda dal telefono, senza registrarsi. Lì segnano carichi, ripetizioni e feedback." },
  { q: "I miei dati sono al sicuro?", a: "I dati sono archiviati in Europa, con connessioni cifrate, e ogni trainer vede solo i propri clienti." },
];

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
              Niente da installare, niente da configurare. Ti registri e in due minuti lavori con il tuo primo cliente.
            </p>
          </RevealDiv>

          <div className="space-y-0">
            {[
              { step: "01", title: "Attiva la prova gratuita", desc: `Email e password, nessuna carta di credito. Hai ${TRIAL_DAYS} giorni con tutte le funzioni.` },
              { step: "02", title: "Crea la scheda del cliente", desc: "Giorni, esercizi con foto guida, serie, ripetizioni e progressioni settimana per settimana." },
              { step: "03", title: "Condividi il link", desc: "Il cliente apre la scheda dal telefono e registra i suoi progressi, senza registrarsi. Tu li vedi in tempo reale." },
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
              &ldquo;Il trainer che usa la tecnologia<br />
              <span className="accent-text">non viene mai superato</span><br />
              da chi non la usa.&rdquo;
            </h2>
          </RevealDiv>

          <RevealDiv delay={0.2} className="mt-16">
            <div className="flex items-center justify-center gap-12 flex-wrap">
              {[
                { value: "2 min",            label: "Per iniziare" },
                { value: `${TRIAL_DAYS} gg`, label: "Di prova gratuita" },
                { value: "0",                label: "App da installare per i clienti" },
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

      {/* ── 04: Free trial ── */}
      <EditorialSection id="prova" num="04">
        <Label num="04 —" text="Prova gratuita" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealDiv>
            <h2
              className="font-black tracking-tight leading-none mb-6"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.04em" }}
            >
              {TRIAL_DAYS} giorni.<br />
              <span className="accent-text">Tutto incluso.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "28rem" }}>
              Provalo sul campo con un tuo cliente vero: ogni funzione è sbloccata, senza carta di credito.
              Alla fine dei {TRIAL_DAYS} giorni decidi tu se continuare: i tuoi dati restano dove sono.
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
              <p className="text-xs font-mono tracking-[0.2em] uppercase mb-3" style={{ color: "var(--accent)" }}>La prova comprende</p>
              <p className="font-black mb-8 leading-tight" style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", color: "var(--ivory)" }}>
                1 cliente · {TRIAL_DAYS} giorni · ogni funzione
              </p>
              <ul className="space-y-3 mb-8">
                {TRIAL_INCLUDES.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -16, rotateX: 12 }}
                    whileInView={{ opacity: 1, x: 0, rotateX: 0 }}
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
                Inizia la prova gratuita →
              </Link>
              <Link href={CONTACT_SALES_PATH} className="block text-center text-sm mt-4 underline" style={{ color: "var(--text-muted)" }}>
                Segui già molti clienti? Parla con il team commerciale
              </Link>
            </TiltCard>
          </RevealDiv>
        </div>
      </EditorialSection>

      {/* ── 05: Contact sales ── */}
      <EditorialSection id="contatti" num="05">
        <Label num="05 —" text="Team commerciale" />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealDiv>
            <h2
              className="font-black tracking-tight leading-none mb-6"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.04em" }}
            >
              Nessun listino.<br />
              <span className="accent-text">Una proposta su misura.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "28rem" }}>
              Ogni studio è diverso: quanti clienti segui, se lavori da solo o con altri coach, come vuoi presentarti.
              Raccontacelo e ti ricontattiamo con la soluzione giusta per te.
            </p>
          </RevealDiv>

          <RevealDiv delay={0.15}>
            <div className="flex flex-col gap-3">
              <Link href={CONTACT_SALES_PATH}
                className="accent-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold tracking-wide">
                <MessageCircle size={16} /> Contatta il team commerciale
              </Link>
              {SALES_WHATSAPP && (
                <a href={`https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(`Ciao! Vorrei informazioni su ${APP_NAME}.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="outline-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm">
                  <MessageCircle size={16} /> Scrivici su WhatsApp
                </a>
              )}
              {SALES_EMAIL && (
                <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Informazioni su ${APP_NAME}`)}`}
                  className="outline-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm break-all">
                  <Mail size={16} /> {SALES_EMAIL}
                </a>
              )}
              <p className="text-xs text-center mt-1" style={{ color: "var(--text-dim)" }}>Rispondiamo entro un giorno lavorativo.</p>
            </div>
          </RevealDiv>
        </div>
      </EditorialSection>

      {/* ── 06: FAQ ── */}
      <EditorialSection id="faq" num="06">
        <Label num="06 —" text="FAQ" />

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
            {FAQ.map(({ q, a }, i) => (
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
        <div className="absolute inset-0" aria-hidden style={{
          backgroundImage: "url(/hero-still.jpg)",
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
            Inizia oggi · {TRIAL_DAYS} giorni gratis
          </p>
          <h2
            className="font-black tracking-tight leading-none mb-8"
            style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)", letterSpacing: "-0.04em" }}
          >
            Pronto a<br />
            <span className="accent-text">dominare?</span>
          </h2>
          <p className="text-base mb-12 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>
            Porta il tuo lavoro di personal trainer su {APP_NAME}: prova tutto gratis, poi scegli con noi come continuare.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link href="/register"
                className="accent-btn inline-flex items-center gap-3 px-10 py-5 rounded-xl text-base font-bold tracking-wide">
                Inizia la prova gratuita <ArrowRight size={16} />
              </Link>
            </motion.div>
            <Link href={CONTACT_SALES_PATH} className="inline-flex items-center gap-2 px-8 py-5 rounded-xl text-base font-medium"
              style={{ border: "1px solid rgba(201,168,76,0.3)", color: "rgba(245,240,232,0.85)", background: "rgba(201,168,76,0.06)" }}>
              Parla con il team commerciale
            </Link>
          </div>
        </RevealDiv>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 lg:px-14 py-10 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(201,168,76,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md accent-btn flex items-center justify-center text-xs font-black">{APP_INITIAL}</div>
          <span className="font-black text-xs tracking-[0.18em] uppercase accent-text">{APP_NAME}</span>
        </div>
        <p className="text-xs font-mono text-center" style={{ color: "var(--text-faint)" }}>
          © {new Date().getFullYear()} {COMPANY_NAME} · Tutti i diritti riservati
        </p>
        <div className="flex items-center gap-x-6 gap-y-2 flex-wrap justify-center text-xs font-mono" style={{ color: "var(--text-dim)" }}>
          <Link href={CONTACT_SALES_PATH} className="hover:text-[var(--accent)] transition-colors">Contatti</Link>
          <Link href="/privacy"  className="hover:text-[var(--accent)] transition-colors">Privacy</Link>
          <Link href="/termini"  className="hover:text-[var(--accent)] transition-colors">Termini</Link>
          <Link href="/login"    className="hover:text-[var(--accent)] transition-colors">Accedi</Link>
        </div>
      </footer>
    </div>
  );
}
