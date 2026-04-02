'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Dumbbell, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

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
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: 'var(--black)' }}
    >
      {/* Ambient glow behind globe */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(255,107,43,0.09) 0%, transparent 68%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 lg:gap-6 items-center py-16 lg:py-0">
        {/* ── Left: text content ────────────────────────────────────────── */}
        <div className="flex flex-col items-start">
          <motion.div {...fade(0)}>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: 'rgba(255,107,43,0.1)',
                border: '1px solid rgba(255,107,43,0.25)',
                color: 'var(--accent-light)',
              }}
            >
              <Dumbbell size={12} />
              CRM per Personal Trainer · Fitness &amp; Bodybuilding
            </div>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="text-4xl lg:text-6xl font-bold leading-tight mb-6"
          >
            Gestisci i tuoi clienti
            <br />
            <span className="accent-text">come un professionista</span>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="text-lg mb-10 max-w-lg"
            style={{ color: 'rgba(245,240,232,0.6)' }}
          >
            Schede, diete, fasi e misurazioni — tutto in un posto. Condividi le
            schede con un link, i clienti compilano i progressi settimanalmente.
          </motion.p>

          <motion.div
            {...fade(0.3)}
            className="flex flex-col sm:flex-row items-start gap-4 mb-8"
          >
            <Link
              href="/register"
              className="accent-btn flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
            >
              Inizia gratis <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base transition-all hover:bg-white/5"
              style={{
                border: '1px solid rgba(255,107,43,0.25)',
                color: 'var(--ivory)',
              }}
            >
              Accedi al tuo account
            </Link>
          </motion.div>

          <motion.p {...fade(0.35)} style={{ color: 'rgba(245,240,232,0.35)' }} className="text-xs mb-10">
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
                className="rounded-2xl p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,107,43,0.1)',
                }}
              >
                <Icon size={16} className="mx-auto mb-1.5" style={{ color: 'var(--accent)' }} />
                <p className="text-xl font-bold mb-0.5" style={{ color: 'var(--ivory)' }}>{value}</p>
                <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: 3D canvas ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1.4, delay: 0.15 }}
          className="relative w-full"
          style={{ height: '520px' }}
        >
          {/* CSS fallback visible until/if WebGL loads */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div style={{
              width: 260, height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(255,107,43,0.18) 0%, rgba(255,107,43,0.06) 55%, transparent 80%)',
              boxShadow: '0 0 80px 20px rgba(255,107,43,0.10)',
            }} />
          </div>
          <HeroCanvas />
        </motion.div>
      </div>
    </section>
  )
}
