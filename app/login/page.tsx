"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Mail, Lock, Loader2, Users, Activity, TrendingUp } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o password non corretti. Riprova.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--black)" }}>

      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0A0A 0%, #1a0800 50%, #0A0A0A 100%)" }}>

        {/* Decorative orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%)" }} />
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,107,43,0.08) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl accent-btn flex items-center justify-center">
            <Dumbbell size={20} />
          </div>
          <span className="font-bold text-xl accent-text">TrainerPro</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight mb-6" style={{ color: "var(--ivory)" }}>
            Il tuo studio.<br />
            <span className="accent-text">Sempre con te.</span>
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(245,240,232,0.5)" }}>
            Gestisci clienti, schede di allenamento, diete e progressi in un'unica piattaforma professionale.
          </p>

          {/* Mini stat cards */}
          <div className="space-y-3">
            {[
              { icon: Users, label: "Clienti gestiti", value: "Tutti in un posto", color: "var(--accent)" },
              { icon: Activity, label: "Fasi & Allenamento", value: "Bulk · Cut · Maintenance", color: "#818cf8" },
              { icon: TrendingUp, label: "Progressi tracciati", value: "Misurazioni & Grafici", color: "#34d399" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,107,43,0.08)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--ivory)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-sm italic" style={{ color: "rgba(245,240,232,0.35)" }}>
            "Pericolosamente personalizzato sul tuo modus operandi."
          </p>
        </div>
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
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--ivory)" }}>Bentornato</h2>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>Accedi al tuo account TrainerPro</p>
          </div>

          <div className="glass-dark rounded-2xl p-8">
            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm flex items-start gap-2"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="il-tuo@email.com" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--ivory)" }}>Password</label>
                  <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--accent-light)" }}>
                    Password dimenticata?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="accent-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Accesso in corso…" : "Accedi"}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: "rgba(245,240,232,0.5)" }}>
              Non hai un account?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--accent-light)" }}>
                Registrati gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
