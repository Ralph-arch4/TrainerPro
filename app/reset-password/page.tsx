"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // Case 1: ?code= in URL (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.history.replaceState({}, "", "/reset-password");
          setReady(true);
          return;
        }
      }

      // Case 2: existing session
      const { data } = await supabase.auth.getSession();
      if (data.session) { setReady(true); return; }

      // Case 3: PASSWORD_RECOVERY event (implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") { setReady(true); subscription.unsubscribe(); }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!ready) setError("Link non valido o scaduto. Richiedi un nuovo link di recupero.");
      }, 2000);
    }

    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Impossibile aggiornare la password. Riprova.");
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--black)" }}>
        <div className="w-full max-w-md text-center fade-in glass-dark rounded-2xl p-10">
          <CheckCircle2 size={56} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--ivory)" }}>Password aggiornata!</h2>
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>Reindirizzamento alla dashboard…</p>
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
        </div>

        <div className="glass-dark rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--ivory)" }}>Nuova password</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {error}
            </div>
          )}

          {!ready && !error && (
            <div className="flex items-center gap-3 py-6 justify-center" style={{ color: "rgba(245,240,232,0.5)" }}>
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span className="text-sm">Verifica in corso…</span>
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ivory)" }}>Nuova password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri" required minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="accent-btn w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Aggiornamento…" : "Aggiorna password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
