"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Mail, Lock, Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--black)" }}>
      <div className="w-full max-w-md fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl accent-btn flex items-center justify-center mb-4">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-3xl font-bold accent-text">TrainerPro</h1>
          <p className="text-sm mt-1" style={{ color: "var(--accent-light)" }}>Il tuo studio. Sempre con te.</p>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--ivory)" }}>Accedi al tuo account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="il-tuo@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,107,43,0.2)",
                    color: "var(--ivory)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,107,43,0.2)",
                    color: "var(--ivory)",
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--accent-light)" }}>
                Password dimenticata?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="accent-btn w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "rgba(245,240,232,0.5)" }}>
            Non hai un account?{" "}
            <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--accent-light)" }}>
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
