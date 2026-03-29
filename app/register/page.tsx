"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";

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
          <CheckCircle2 size={56} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Controlla la tua email</h2>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>
            Ti abbiamo inviato un link di conferma a <strong style={{ color: "var(--ivory)" }}>{email}</strong>.<br />
            Clicca il link per attivare il tuo account TrainerPro.
          </p>
          <Link href="/login" className="inline-block mt-6 text-sm font-medium hover:underline" style={{ color: "var(--accent-light)" }}>
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--black)" }}>
      <div className="w-full max-w-md fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl accent-btn flex items-center justify-center mb-4">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-3xl font-bold accent-text">TrainerPro</h1>
          <p className="text-sm mt-1" style={{ color: "var(--accent-light)" }}>Crea il tuo account gratuito</p>
        </div>

        <div className="glass-dark rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--ivory)" }}>Registrati</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Nome completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mario Rossi" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="il-tuo@email.com" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caratteri" required minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="accent-btn w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Registrazione in corso…" : "Crea account gratuito"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "rgba(245,240,232,0.5)" }}>
            Hai già un account?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent-light)" }}>Accedi</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
