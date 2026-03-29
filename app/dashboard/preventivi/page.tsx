"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Calculator, Plus, Trash2, Copy, CheckCircle2, Printer } from "lucide-react";

interface QuoteItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

interface Quote {
  id: string;
  clientName: string;
  date: string;
  items: QuoteItem[];
  notes: string;
  discount: number;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

const PRESET_SERVICES = [
  { description: "Abbonamento mensile Personal Training", price: 150 },
  { description: "Sessione singola Personal Training (1h)", price: 50 },
  { description: "Scheda di allenamento personalizzata", price: 80 },
  { description: "Piano alimentare personalizzato", price: 100 },
  { description: "Analisi composizione corporea", price: 30 },
  { description: "Pacchetto 10 sessioni Personal Training", price: 450 },
  { description: "Consulenza nutrizionale (1h)", price: 70 },
  { description: "Revisione scheda mensile", price: 40 },
];

export default function PreventiviPage() {
  const clients = useAppStore((s) => s.clients);
  const user = useAppStore((s) => s.user);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [copied, setCopied] = useState(false);

  function newQuote() {
    const q: Quote = {
      id: uid(),
      clientName: "",
      date: new Date().toISOString().split("T")[0],
      items: [{ id: uid(), description: "", qty: 1, price: 0 }],
      notes: "",
      discount: 0,
    };
    setQuotes((prev) => [q, ...prev]);
    setActiveQuote(q);
  }

  function updateQuote(patch: Partial<Quote>) {
    if (!activeQuote) return;
    const updated = { ...activeQuote, ...patch };
    setActiveQuote(updated);
    setQuotes((prev) => prev.map((q) => q.id === updated.id ? updated : q));
  }

  function addItem() {
    if (!activeQuote) return;
    updateQuote({ items: [...activeQuote.items, { id: uid(), description: "", qty: 1, price: 0 }] });
  }

  function updateItem(itemId: string, patch: Partial<QuoteItem>) {
    if (!activeQuote) return;
    updateQuote({ items: activeQuote.items.map((i) => i.id === itemId ? { ...i, ...patch } : i) });
  }

  function removeItem(itemId: string) {
    if (!activeQuote) return;
    updateQuote({ items: activeQuote.items.filter((i) => i.id !== itemId) });
  }

  function addPreset(preset: { description: string; price: number }) {
    if (!activeQuote) return;
    updateQuote({ items: [...activeQuote.items, { id: uid(), description: preset.description, qty: 1, price: preset.price }] });
  }

  function deleteQuote(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    if (activeQuote?.id === id) setActiveQuote(null);
  }

  function getSubtotal(q: Quote) {
    return q.items.reduce((acc, i) => acc + i.qty * i.price, 0);
  }

  function getTotal(q: Quote) {
    const sub = getSubtotal(q);
    return sub - (sub * q.discount) / 100;
  }

  async function copyText() {
    if (!activeQuote) return;
    const sub = getSubtotal(activeQuote);
    const total = getTotal(activeQuote);
    const text = [
      `PREVENTIVO — ${activeQuote.date}`,
      activeQuote.clientName ? `Cliente: ${activeQuote.clientName}` : "",
      `Trainer: ${user?.name ?? "TrainerPro"}`,
      "",
      "SERVIZI:",
      ...activeQuote.items.map((i) => `• ${i.description} (x${i.qty}) — €${(i.qty * i.price).toFixed(2)}`),
      "",
      activeQuote.discount > 0 ? `Subtotale: €${sub.toFixed(2)}` : "",
      activeQuote.discount > 0 ? `Sconto: ${activeQuote.discount}%` : "",
      `TOTALE: €${total.toFixed(2)}`,
      activeQuote.notes ? `\nNote: ${activeQuote.notes}` : "",
    ].filter(Boolean).join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm outline-none";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,43,0.15)", color: "var(--ivory)" };

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Preventivi</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>{quotes.length} preventivi creati</p>
        </div>
        <button onClick={newQuote} className="accent-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
          <Plus size={16} /> Nuovo preventivo
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quote list */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(245,240,232,0.6)" }}>I tuoi preventivi</h2>
          {quotes.length === 0 ? (
            <div className="card-luxury rounded-2xl p-8 text-center">
              <Calculator size={36} className="mx-auto mb-3" style={{ color: "rgba(255,107,43,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Nessun preventivo ancora</p>
              <button onClick={newQuote} className="mt-3 text-xs hover:underline" style={{ color: "var(--accent-light)" }}>Crea il primo</button>
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((q) => (
                <div key={q.id}
                  onClick={() => setActiveQuote(q)}
                  className="card-luxury rounded-xl p-4 cursor-pointer transition-all hover:border-[rgba(255,107,43,0.3)]"
                  style={{ borderColor: activeQuote?.id === q.id ? "rgba(255,107,43,0.4)" : undefined, background: activeQuote?.id === q.id ? "rgba(255,107,43,0.06)" : undefined }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>
                        {q.clientName || "Cliente non specificato"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{q.date} · {q.items.length} servizi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>€{getTotal(q).toFixed(2)}</p>
                      <button onClick={(e) => { e.stopPropagation(); deleteQuote(q.id); }}
                        className="mt-1 p-1 rounded-lg hover:bg-red-500/10 transition-all">
                        <Trash2 size={12} style={{ color: "rgba(239,68,68,0.5)" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quote editor */}
        <div className="lg:col-span-2">
          {!activeQuote ? (
            <div className="card-luxury rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <Calculator size={48} className="mb-4" style={{ color: "rgba(255,107,43,0.15)" }} />
              <p className="text-base font-semibold mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>Seleziona o crea un preventivo</p>
              <p className="text-sm mb-5" style={{ color: "rgba(245,240,232,0.3)" }}>Aggiungi servizi, calcola il totale e copialo con un click</p>
              <button onClick={newQuote} className="accent-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus size={14} /> Nuovo preventivo
              </button>
            </div>
          ) : (
            <div className="card-luxury rounded-2xl p-6">
              {/* Header */}
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.5)" }}>Cliente</label>
                  <select
                    value={activeQuote.clientName}
                    onChange={(e) => updateQuote({ clientName: e.target.value })}
                    className={inputClass} style={{ ...inputStyle, background: "rgba(26,26,26,1)" }}>
                    <option value="">Seleziona cliente…</option>
                    {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="__custom">Altro…</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.5)" }}>Data</label>
                  <input type="date" value={activeQuote.date} onChange={(e) => updateQuote({ date: e.target.value })}
                    className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Preset services */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: "rgba(245,240,232,0.5)" }}>Aggiungi servizio rapido:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SERVICES.map((p) => (
                    <button key={p.description} onClick={() => addPreset(p)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                      style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
                      + {p.description.split(" ").slice(0, 3).join(" ")}…
                    </button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
                  <span className="col-span-6">Descrizione</span>
                  <span className="col-span-2 text-center">Qtà</span>
                  <span className="col-span-2 text-right">Prezzo €</span>
                  <span className="col-span-2 text-right">Totale</span>
                </div>
                <div className="space-y-2">
                  {activeQuote.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Descrizione servizio…"
                        className="col-span-6 px-3 py-2 rounded-xl text-sm outline-none"
                        style={inputStyle} />
                      <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, { qty: parseInt(e.target.value) || 1 })}
                        className="col-span-2 px-2 py-2 rounded-xl text-sm outline-none text-center"
                        style={inputStyle} />
                      <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        className="col-span-2 px-2 py-2 rounded-xl text-sm outline-none text-right"
                        style={inputStyle} />
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <span className="text-sm font-semibold" style={{ color: "var(--ivory)" }}>€{(item.qty * item.price).toFixed(2)}</span>
                        <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-red-500/10 transition-all">
                          <Trash2 size={12} style={{ color: "rgba(239,68,68,0.5)" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-3 flex items-center gap-1.5 text-xs hover:opacity-80 transition-all"
                  style={{ color: "var(--accent-light)" }}>
                  <Plus size={13} /> Aggiungi riga
                </button>
              </div>

              {/* Discount + totals */}
              <div className="pt-4 mb-4" style={{ borderTop: "1px solid rgba(255,107,43,0.1)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>Sconto (%)</label>
                  <input type="number" min="0" max="100" value={activeQuote.discount}
                    onChange={(e) => updateQuote({ discount: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-3 py-1.5 rounded-xl text-sm outline-none text-center"
                    style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  {activeQuote.discount > 0 && (
                    <>
                      <div className="flex justify-between text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
                        <span>Subtotale</span>
                        <span>€{getSubtotal(activeQuote).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm" style={{ color: "#22c55e" }}>
                        <span>Sconto {activeQuote.discount}%</span>
                        <span>-€{(getSubtotal(activeQuote) * activeQuote.discount / 100).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ color: "var(--ivory)" }}>Totale</span>
                    <span style={{ color: "var(--accent)" }}>€{getTotal(activeQuote).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(245,240,232,0.5)" }}>Note aggiuntive</label>
                <textarea value={activeQuote.notes} onChange={(e) => updateQuote({ notes: e.target.value })}
                  rows={2} placeholder="Condizioni, validità, modalità di pagamento…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle} />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={copyText}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
                  style={{ border: "1px solid rgba(255,107,43,0.25)", color: copied ? "#22c55e" : "var(--accent-light)" }}>
                  {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                  {copied ? "Copiato!" : "Copia testo"}
                </button>
                <button onClick={() => window.print()}
                  className="flex-1 accent-btn flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm">
                  <Printer size={15} /> Stampa / PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
