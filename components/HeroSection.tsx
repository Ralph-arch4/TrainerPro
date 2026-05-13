'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react'

// SSR-safe import — Three.js uses window/WebGL, unavailable in Node SSR
const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false })

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const prefersReduced = useReducedMotion()

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: prefersReduced ? 0 : 22 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden pt-16 grid-texture"
      style={{ background: 'var(--black)' }}
    >
      {/* ── Laser beams ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[
          { top: '18%', height: '1.5px', op: 0.55, dur: '3.2s', delay: '0s'   },
          { top: '30%', height: '0.8px', op: 0.35, dur: '4.1s', delay: '0.7s' },
          { top: '44%', height: '2.5px', op: 0.65, dur: '2.8s', delay: '1.4s' },
          { top: '57%', height: '1px',   op: 0.4,  dur: '3.8s', delay: '0.3s' },
          { top: '70%', height: '2px',   op: 0.5,  dur: '3.5s', delay: '1.8s' },
          { top: '82%', height: '0.8px', op: 0.3,  dur: '4.5s', delay: '0.9s' },
        ].map((beam, i) => (
          <div
            key={i}
            className="laser-line"
            style={{
              top: beam.top,
              height: beam.height,
              '--beam-op': beam.op,
              '--beam-dur': beam.dur,
              '--beam-delay': beam.delay,
              '--beam-angle': '-27deg',
              filter: `blur(${parseFloat(beam.height) < 1 ? '0.8px' : '0.3px'})`,
              boxShadow: `0 0 ${parseFloat(beam.height) * 12}px rgba(229,50,50,0.5), 0 0 ${parseFloat(beam.height) * 30}px rgba(229,50,50,0.2)`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Deep red ambient ────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(229,50,50,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Ambient glow behind globe */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 60% 50%, rgba(229,50,50,0.16) 0%, rgba(200,20,20,0.06) 45%, transparent 70%), radial-gradient(ellipse at 35% 65%, rgba(255,80,30,0.07) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 lg:gap-6 items-center py-16 lg:py-0">
        {/* ── Left: text content ────────────────────────────────────────── */}
        <div className="flex flex-col items-start">
          <motion.div {...fade(0)}>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wide"
              style={{
                background: 'linear-gradient(135deg, rgba(229,50,50,0.06) 0%, rgba(255,80,30,0.14) 50%, rgba(229,50,50,0.06) 100%)',
                backgroundSize: '200% auto',
                animation: 'shimmer 3s linear infinite',
                border: '1px solid rgba(229,50,50,0.3)',
                color: 'var(--accent-light)',
                boxShadow: '0 0 20px rgba(229,50,50,0.1)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="3.5" r="2" fill="currentColor"/>
                <path d="M6 8.5 C5 9 3.5 10.5 4 13 L5.5 13 C6 11 7 10 8 9.5 L10.5 9 L12 10 L13.5 9 L16 9.5 C17 10 18 11 18.5 13 L20 13 C20.5 10.5 19 9 18 8.5 L15 7.5 C14 7 13 6.5 12 6.5 C11 6.5 10 7 9 7.5 Z" fill="currentColor"/>
                <path d="M8.5 13 L8 19 L10.5 19.5 L11 15 L13 15 L13.5 19.5 L16 19 L15.5 13 Z" fill="currentColor"/>
                <path d="M4 10 L3 14 L5.5 14.5 Z" fill="currentColor"/>
                <path d="M20 10 L21 14 L18.5 14.5 Z" fill="currentColor"/>
              </svg>
              CRM per Personal Trainer · Fitness &amp; Bodybuilding
            </div>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="text-4xl lg:text-6xl font-black leading-tight mb-6 tracking-tight"
          >
            Allena di più,
            <br />
            <span className="accent-text glow-text-red">gestisci da maestro.</span>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="text-lg mb-10 max-w-lg leading-relaxed"
            style={{ color: 'rgba(245,240,232,0.55)' }}
          >
            L&apos;unico CRM pensato per chi trasforma i corpi. Schede, nutrizione e progressi — tutto sotto controllo, condiviso in un click.
          </motion.p>

          <motion.div
            {...fade(0.3)}
            className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 mb-8 w-full sm:w-auto"
          >
            <Link
              href="/register"
              className="accent-btn flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold"
            >
              Inizia gratis <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all"
              style={{
                border: '1px solid rgba(229,50,50,0.2)',
                color: 'rgba(245,240,232,0.75)',
                background: 'rgba(229,50,50,0.04)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(229,50,50,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(229,50,50,0.04)')}
            >
              Accedi al tuo account
            </Link>
          </motion.div>

          <motion.p {...fade(0.35)} style={{ color: 'rgba(245,240,232,0.3)' }} className="text-xs mb-10 tracking-wide">
            Nessuna carta di credito richiesta · Piano gratuito per sempre
          </motion.p>

          {/* Stats bar */}
          <motion.div {...fade(0.42)} className="grid grid-cols-3 gap-3 w-full max-w-sm">
            {[
              { icon: Zap,    value: '2 min', label: 'Setup iniziale' },
              { icon: Shield, value: '100%',  label: 'Dati protetti'  },
              { icon: Clock,  value: '∞',     label: 'Piano free'     },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center border-glow"
                style={{
                  background: 'linear-gradient(135deg, rgba(229,50,50,0.06), rgba(15,8,8,0.6))',
                  border: '1px solid rgba(229,50,50,0.12)',
                }}
              >
                <Icon size={16} className="mx-auto mb-1.5" style={{ color: 'var(--accent)' }} />
                <p className="text-xl font-black mb-0.5" style={{ color: 'var(--ivory)' }}>{value}</p>
                <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: HUD canvas ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1.4, delay: 0.15 }}
          className="relative w-full flex items-center justify-center overflow-hidden"
          style={{ height: 'clamp(320px, 45vw, 560px)' }}
        >
          <HeroCanvas />
        </motion.div>
      </div>
    </section>
  )
}
