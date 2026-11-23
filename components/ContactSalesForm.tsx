"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { SALES_EMAIL } from "@/lib/brand";

const CLIENT_RANGES = ["1-5", "6-15", "16-30", "Più di 30"];

type State = "idle" | "sending" | "sent";

export default function ContactSalesForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clients, setClients] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setError("Serve il consenso per poterti ricontattare."); return; }
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, clients, message, consent, website }),
      });
      if (res.status === 429) throw new Error("rate");
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error && err.message === "rate"
        ? "Hai già inviato diverse richieste. Riprova tra qualche minuto."
        : SALES_EMAIL
          ? `Invio non riuscito. Scrivici a ${SALES_EMAIL}.`
          : "Invio non riuscito. Riprova tra poco.");
    }
  }

  if (state === "sent") {
    return (
      <div data-testid="contact-sent" className="card-luxury rounded-2xl p-8 text-center self-start">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <CheckCircle2 size={28} style={{ color: "#22c55e" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Richiesta inviata</h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Grazie {name.split(" ")[0]}, ti ricontattiamo al più presto all&apos;indirizzo {email}.
        </p>
      </div>
    );
  }

  const input = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const inputStyle = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" };
  const label = "block text-sm font-medium mb-1.5";

  return (
    <form onSubmit={submit} data-testid="contact-form" className="card-luxury rounded-2xl p-6 sm:p-8 space-y-4 self-start">
      <div>
        <label htmlFor="cs-name" className={label} style={{ color: "var(--text)" }}>Nome e cognome</label>
        <input id="cs-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)}
          autoComplete="name" className={input} style={inputStyle} placeholder="Mario Rossi" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cs-email" className={label} style={{ color: "var(--text)" }}>Email</label>
          <input id="cs-email" type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" className={input} style={inputStyle} placeholder="il-tuo@email.com" />
        </div>
        <div>
          <label htmlFor="cs-phone" className={label} style={{ color: "var(--text)" }}>Telefono <span style={{ color: "var(--text-dim)" }}>(facoltativo)</span></label>
          <input id="cs-phone" type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel" className={input} style={inputStyle} placeholder="+39 333 123 4567" />
        </div>
      </div>
      <fieldset>
        <legend className={label} style={{ color: "var(--text)" }}>Quanti clienti segui?</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CLIENT_RANGES.map((r) => (
            <button key={r} type="button" onClick={() => setClients(r)} aria-pressed={clients === r}
              className="px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: clients === r ? "rgba(201,168,76,0.14)" : "var(--surface)",
                border: `1px solid ${clients === r ? "rgba(201,168,76,0.6)" : "var(--border)"}`,
                color: clients === r ? "var(--accent-light)" : "var(--text-muted)",
              }}>
              {r}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="cs-message" className={label} style={{ color: "var(--text)" }}>Messaggio <span style={{ color: "var(--text-dim)" }}>(facoltativo)</span></label>
        <textarea id="cs-message" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)}
          className={input} style={inputStyle} placeholder="Come lavori oggi, cosa ti serve, quando preferisci essere richiamato…" />
      </div>
      {/* Honeypot: hidden from people, filled by bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)}
        className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: "var(--text-muted)" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#C9A84C]" />
        <span>
          Acconsento a essere ricontattato per ricevere informazioni commerciali, come descritto nell&apos;
          <Link href="/privacy" className="underline" style={{ color: "var(--accent-light)" }}>informativa sulla privacy</Link>.
        </span>
      </label>
      {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
      <button type="submit" disabled={state === "sending"}
        className="accent-btn w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
        {state === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        Contatta il team commerciale
      </button>
    </form>
  );
}
