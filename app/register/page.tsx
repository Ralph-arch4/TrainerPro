"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Mail, Lock, User, Loader2, CheckCircle2, Star, Shield, Zap } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, plan: "free" } },
    });
    if (error) {
      if (error.message === "User already registered") {
        setError("Email già registrata. Prova ad accedere.");
      } else if (error.status === 429 || error.message?.includes("rate limit")) {
        setError("Troppe richieste. Attendi qualche minuto e riprova.");
      } else {
        setError(`Errore: ${error.message}`);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--black)" }}>
        <div className="w-full max-w-md text-center fade-in glass-dark rounded-2xl p-10">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle2 size={32} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Controlla la tua email</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(245,240,232,0.6)" }}>
            Abbiamo inviato un link di conferma a{" "}
            <strong style={{ color: "var(--ivory)" }}>{email}</strong>.<br />
            Clicca il link per attivare il tuo account TrainerPro.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 accent-btn px-6 py-2.5 rounded-xl text-sm">
            Vai al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--black)" }}>

      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #1a0800 50%, #0A0A0A 100%)" }}>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl accent-btn flex items-center justify-center">
            <Dumbbell size={20} />
          </div>
          <span className="font-bold text-xl accent-text">TrainerPro</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4" style={{ color: "var(--ivory)" }}>
            Tutto gratis.<br />
            <span className="accent-text">Clienti illimitati.</span>
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(245,240,232,0.5)" }}>
            Crea il tuo account in 30 secondi. Nessuna carta di credito richiesta.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: Star, label: "Accesso completo gratuito", desc: "Clienti illimitati, tutte le funzionalità", color: "#fbbf24" },
              { icon: Shield, label: "Dati al sicuro", desc: "Crittografia end-to-end su Supabase", color: "#34d399" },
              { icon: Zap, label: "Pronto in 2 minuti", desc: "Setup immediato, zero configurazione", color: "#818cf8" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm italic relative z-10" style={{ color: "rgba(245,240,232,0.35)" }}>
          "Pericolosamente personalizzato sul tuo modus operandi."
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md fade-in">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl accent-btn flex items-center justify-center mb-3">
              <Dumbbell size={28} />
            </div>
            <h1 className="text-2xl font-bold accent-text">TrainerPro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--ivory)" }}>Crea il tuo account</h2>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>Gratuito. Sempre. Nessuna carta richiesta.</p>
          </div>

          <div className="glass-dark rounded-2xl p-8">
            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Nome completo</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Mario Rossi" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="il-tuo@email.com" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri" required minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="accent-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Creazione account…" : "Crea account gratuito"}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "rgba(245,240,232,0.5)" }}>
              Hai già un account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--accent-light)" }}>
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
