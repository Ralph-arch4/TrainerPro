"use client";
import { APP_NAME } from "@/lib/brand";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Mail, Lock, User, Loader2, CheckCircle2, Star, Shield, Zap, Crown, Check } from "lucide-react";
import { PREMIUM_PRICE } from "@/lib/billing";

type Choice = "free" | "premium";
const noopSubscribe = () => () => {};
// ?piano=premium preselects the paid plan (links from the landing page)
const planFromUrl = (): Choice => new URLSearchParams(window.location.search).get("piano") === "premium" ? "premium" : "free";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const urlChoice = useSyncExternalStore<Choice>(noopSubscribe, planFromUrl, () => "free");
  const [picked, setPicked] = useState<Choice | null>(null);
  const choice: Choice = picked ?? urlChoice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, intended_plan: choice } },
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
    } else if (data.user && data.user.identities?.length === 0) {
      // With email confirmation on, Supabase returns a fake success for
      // existing emails (anti-enumeration): identities is empty. Without this
      // check the user waits for a confirmation email that never arrives.
      setError("Email già registrata. Accedi oppure usa “Password dimenticata” per recuperarla.");
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
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Controlla la tua email</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Abbiamo inviato un link di conferma a{" "}
            <strong style={{ color: "var(--text)" }}>{email}</strong>.<br />
            Clicca il link per attivare il tuo account {APP_NAME}.
            {choice === "premium" && <><br />Al primo accesso trovi la pagina per attivare Premium.</>}
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
          <span className="font-bold text-xl accent-text">{APP_NAME}</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          {/* Left panel always dark — hardcode light text */}
          <h2 className="text-4xl font-bold leading-tight mb-4" style={{ color: "#F5F0E8" }}>
            Provalo gratis.<br />
            <span className="accent-text">Passa a Premium quando vuoi.</span>
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(245,240,232,0.55)" }}>
            Crea il tuo account in 30 secondi. La demo è gratuita e non richiede carta di credito.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: Star,   label: "Demo gratuita",             desc: "Tutte le funzioni con un cliente",          color: "#fbbf24" },
              { icon: Shield, label: "Dati al sicuro",            desc: "Connessioni cifrate, accesso solo tuo",     color: "#34d399" },
              { icon: Zap,    label: "Pronto in 2 minuti",        desc: "Setup immediato, zero configurazione",       color: "#818cf8" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#F5F0E8" }}>{label}</p>
                  <p className="text-xs" style={{ color: "rgba(245,240,232,0.55)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm italic relative z-10" style={{ color: "rgba(245,240,232,0.38)" }}>
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
            <h1 className="text-2xl font-bold accent-text">{APP_NAME}</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Crea il tuo account</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Scegli come iniziare: puoi cambiare piano in qualsiasi momento.</p>
          </div>

          <div className="glass-dark rounded-2xl p-8">
            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <div role="radiogroup" aria-label="Piano" className="grid grid-cols-2 gap-3 mb-5">
              {([
                { key: "free" as Choice, title: "Demo gratuita", price: "€0", lines: ["1 cliente", "Tutte le funzioni"], icon: Star },
                { key: "premium" as Choice, title: "Premium", price: `€${PREMIUM_PRICE}/mese`, lines: ["Clienti illimitati", "Accesso completo"], icon: Crown },
              ]).map(({ key, title, price, lines, icon: Icon }) => (
                <button key={key} type="button" role="radio" aria-checked={choice === key} onClick={() => setPicked(key)}
                  data-testid={`plan-${key}`}
                  className="text-left rounded-xl p-3 transition-all"
                  style={{
                    background: choice === key ? "rgba(201,168,76,0.12)" : "var(--surface)",
                    border: `1px solid ${choice === key ? "rgba(201,168,76,0.6)" : "var(--border)"}`,
                  }}>
                  <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: choice === key ? "var(--accent-light)" : "var(--text)" }}>
                    <Icon size={14} /> {title}
                  </span>
                  <span className="block text-xs font-semibold mt-1" style={{ color: "var(--text)" }}>{price}</span>
                  {lines.map((l) => (
                    <span key={l} className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      <Check size={11} className="flex-shrink-0" /> {l}
                    </span>
                  ))}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Nome completo</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Mario Rossi" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="il-tuo@email.com" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-light)" }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri" required minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--text)" }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="accent-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Creazione account…" : choice === "premium" ? "Crea account e attiva Premium" : "Inizia la demo gratuita"}
              </button>
            </form>

            <p className="text-center text-xs mt-4" style={{ color: "var(--text-dim)" }}>
              Creando l&apos;account dichiari di aver letto l&apos;
              <Link href="/privacy" className="underline" style={{ color: "var(--accent-light)" }}>informativa sulla privacy</Link> e accetti i{" "}
              <Link href="/termini" className="underline" style={{ color: "var(--accent-light)" }}>termini di servizio</Link>.
              {choice === "premium" && " Il pagamento si completa dopo l'accesso: non ti viene addebitato nulla ora."}
            </p>

            <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
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