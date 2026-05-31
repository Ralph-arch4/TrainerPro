'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const NAV_ITEMS = [
  { num: '01', label: 'Funzionalità', href: '#features' },
  { num: '02', label: 'Come Funziona', href: '#how'      },
  { num: '03', label: 'Pricing',       href: '#pricing'  },
  { num: '04', label: 'Accedi',        href: '/login'    },
]

const EASE: [number,number,number,number] = [0.16, 1, 0.3, 1]

export default function HamburgerNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-14 h-16"
        style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.72) 0%, transparent 100%)', backdropFilter: 'none' }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg accent-btn flex items-center justify-center flex-shrink-0 text-xs font-black">R</div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-sm tracking-[0.16em] uppercase accent-text">REC STUDIO</span>
            <span className="text-[10px] font-mono tracking-[0.18em] uppercase mt-0.5" style={{ color: 'var(--text-faint)' }}>CRM · Personal Trainer</span>
          </div>
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 group"
          aria-label="Apri menu"
        >
          <span className="text-xs font-bold tracking-[0.18em] uppercase hidden sm:block"
            style={{ color: 'var(--text-muted)' }}>MENU</span>
          <div className="flex flex-col gap-[5px]">
            <span className="block w-6 h-[2px] rounded-full transition-all"
              style={{ background: 'var(--accent)' }} />
            <span className="block w-4 h-[2px] rounded-full transition-all group-hover:w-6"
              style={{ background: 'var(--accent)', transition: 'width 0.25s ease' }} />
          </div>
        </button>
      </div>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ background: '#050505' }}
          >
            {/* Top */}
            <div className="flex items-center justify-between px-6 lg:px-14 h-16 flex-shrink-0">
              <Link href="/" onClick={() => setOpen(false)}>
                <span className="font-black text-sm tracking-[0.18em] uppercase accent-text">REC STUDIO</span>
              </Link>
              <button onClick={() => setOpen(false)} className="flex items-center gap-3 group" aria-label="Chiudi menu">
                <span className="text-xs font-bold tracking-[0.18em] uppercase hidden sm:block"
                  style={{ color: 'var(--text-muted)' }}>CHIUDI</span>
                <X size={18} style={{ color: 'var(--accent)' }} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px mx-6 lg:mx-14" style={{ background: 'rgba(201,168,76,0.10)' }} />

            {/* Nav list */}
            <nav className="flex-1 flex flex-col justify-center px-6 lg:px-14 py-8 overflow-y-auto">
              {NAV_ITEMS.map(({ num, label, href }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: EASE }}
                  className="border-b group"
                  style={{ borderColor: 'rgba(201,168,76,0.07)' }}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-5 py-6 lg:py-8 w-full"
                  >
                    <span className="text-xs font-mono w-8 flex-shrink-0"
                      style={{ color: 'var(--accent)' }}>{num}</span>
                    <span className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none transition-all duration-300 group-hover:pl-4"
                      style={{ color: 'var(--text)' }}>
                      {label}
                    </span>
                    <span className="ml-auto text-2xl lg:text-4xl font-black opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ color: 'var(--accent)' }}>→</span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom */}
            <div className="h-px mx-6 lg:mx-14" style={{ background: 'rgba(201,168,76,0.10)' }} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex items-center justify-between px-6 lg:px-14 py-6 flex-shrink-0"
            >
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="accent-btn px-7 py-3.5 rounded-xl text-sm font-bold tracking-wider"
              >
                Inizia Gratis →
              </Link>
              <div className="text-right">
                <p className="text-xs font-mono tracking-widest uppercase"
                  style={{ color: 'var(--text-faint)' }}>REC GROUP</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>© 2026</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
