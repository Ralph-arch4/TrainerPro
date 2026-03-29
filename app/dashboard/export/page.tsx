"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { FileDown, Printer, CheckCircle2, Dumbbell, UtensilsCrossed, TrendingUp, Activity, User } from "lucide-react";

const phaseTypeLabel: Record<string, string> = { bulk: "Bulk", cut: "Cut", maintenance: "Mantenimento", custom: "Personalizzata" };
const goalLabel: Record<string, string> = { dimagrimento: "Dimagrimento", massa: "Massa", tonificazione: "Tonificazione", performance: "Performance" };
const levelLabel: Record<string, string> = { principiante: "Principiante", intermedio: "Intermedio", avanzato: "Avanzato" };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

type ExportSection = "anagrafica" | "fasi" | "schede" | "dieta" | "misurazioni";

export default function ExportPage() {
  const clients = useAppStore((s) => s.clients);
  const user = useAppStore((s) => s.user);

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? "");
  const [sections, setSections] = useState<Record<ExportSection, boolean>>({
    anagrafica: true, fasi: true, schede: true, dieta: true, misurazioni: true,
  });
  const [printed, setPrinted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const client = clients.find((c) => c.id === selectedClientId);

  function toggleSection(s: ExportSection) {
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  function handlePrint() {
    window.print();
    setPrinted(true);
    setTimeout(() => setPrinted(false), 2000);
  }

  const sectionOptions: { key: ExportSection; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "anagrafica", label: "Dati anagrafici", icon: User },
    { key: "fasi", label: "Fasi di allenamento", icon: Activity, count: client?.phases.length },
    { key: "schede", label: "Schede allenamento", icon: Dumbbell, count: client?.workoutPlans.length },
    { key: "dieta", label: "Piani alimentari", icon: UtensilsCrossed, count: client?.dietPlans.length },
    { key: "misurazioni", label: "Misurazioni corporee", icon: TrendingUp, count: client?.measurements.length },
  ];

  if (clients.length === 0) {
    return (
      <div className="p-6 lg:p-8 fade-in">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--ivory)" }}>Esporta PDF</h1>
        <div className="text-center py-20 card-luxury rounded-2xl">
          <FileDown size={48} className="mx-auto mb-4" style={{ color: "rgba(255,107,43,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Aggiungi clienti per poter esportare le loro schede</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen UI */}
      <div className="p-6 lg:p-8 fade-in print:hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--ivory)" }}>Esporta PDF</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>
            Genera un documento completo da condividere con il cliente
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Config panel */}
          <div className="space-y-4">
            <div className="card-luxury rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ivory)" }}>Seleziona cliente</h2>
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(26,26,26,1)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--ivory)" }}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="card-luxury rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ivory)" }}>Sezioni da includere</h2>
              <div className="space-y-2">
                {sectionOptions.map(({ key, label, icon: Icon, count }) => (
                  <button key={key} onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                    style={{
                      background: sections[key] ? "rgba(255,107,43,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${sections[key] ? "rgba(255,107,43,0.25)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <div className="flex items-center gap-3">
                      <Icon size={15} style={{ color: sections[key] ? "var(--accent)" : "rgba(245,240,232,0.35)" }} />
                      <span className="text-sm" style={{ color: sections[key] ? "var(--ivory)" : "rgba(245,240,232,0.45)" }}>{label}</span>
                      {count !== undefined && count > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,107,43,0.12)", color: "var(--accent-light)" }}>{count}</span>
                      )}
                    </div>
                    {sections[key] ? <CheckCircle2 size={16} style={{ color: "var(--accent)" }} /> : <div className="w-4 h-4 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.15)" }} />}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handlePrint}
              className="w-full accent-btn flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm">
              {printed ? <CheckCircle2 size={16} /> : <Printer size={16} />}
              {printed ? "Dialogo di stampa aperto!" : "Genera PDF / Stampa"}
            </button>
            <p className="text-xs text-center" style={{ color: "rgba(245,240,232,0.3)" }}>
              Usa il browser per salvare come PDF dalla finestra di stampa
            </p>
          </div>

          {/* Preview */}
          <div className="card-luxury rounded-2xl p-5 overflow-auto" style={{ maxHeight: "70vh" }}>
            <p className="text-xs font-semibold mb-4" style={{ color: "rgba(245,240,232,0.4)" }}>ANTEPRIMA</p>
            {hydrated && client
              ? <PrintPreview client={client} sections={sections} trainerName={user?.name ?? "TrainerPro"} />
              : (
                <div className="flex flex-col items-center justify-center py-16" style={{ color: "rgba(245,240,232,0.25)" }}>
                  <FileDown size={40} className="mb-3" style={{ color: "rgba(255,107,43,0.15)" }} />
                  <p className="text-sm">Seleziona un cliente per vedere l&apos;anteprima</p>
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* Print layout */}
      {client && (
        <div className="hidden print:block p-8" style={{ background: "white", color: "#111" }}>
          <PrintPreview client={client} sections={sections} trainerName={user?.name ?? "TrainerPro"} forPrint />
        </div>
      )}
    </>
  );
}

function PrintPreview({ client, sections, trainerName, forPrint = false }: {
  client: ReturnType<typeof useAppStore.getState>["clients"][0];
  sections: Record<string, boolean>;
  trainerName: string;
  forPrint?: boolean;
}) {
  const textColor = forPrint ? "#111" : "var(--ivory)";
  const mutedColor = forPrint ? "#555" : "rgba(245,240,232,0.55)";
  const borderColor = forPrint ? "#e5e7eb" : "rgba(255,107,43,0.12)";
  const bgCard = forPrint ? "#f9fafb" : "rgba(255,255,255,0.04)";

  return (
    <div style={{ color: textColor, fontSize: "13px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: `2px solid ${forPrint ? "#FF6B2B" : "var(--accent)"}` }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>TrainerPro</h1>
          <p style={{ color: mutedColor }}>Trainer: {trainerName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{client.name}</p>
          {client.goal && <p style={{ color: mutedColor }}>{goalLabel[client.goal]}</p>}
          <p style={{ color: mutedColor }}>{new Date().toLocaleDateString("it-IT")}</p>
        </div>
      </div>

      {/* Anagrafica */}
      {sections.anagrafica && (
        <section className="mb-6">
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>Dati Anagrafici</h2>
          <div className="rounded-xl p-4" style={{ background: bgCard, border: `1px solid ${borderColor}` }}>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Nome", client.name],
                ["Email", client.email || "—"],
                ["Telefono", client.phone || "—"],
                ["Data di nascita", client.birthDate ? formatDate(client.birthDate) : "—"],
                ["Obiettivo", client.goal ? goalLabel[client.goal] : "—"],
                ["Livello", client.level ? levelLabel[client.level] : "—"],
                ["Stato", client.status],
                ["Quota mensile", client.monthlyFee ? `€${client.monthlyFee}` : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs" style={{ color: mutedColor }}>{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fasi */}
      {sections.fasi && client.phases.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>Fasi di Allenamento</h2>
          <div className="space-y-2">
            {client.phases.map((p) => (
              <div key={p.id} className="rounded-xl p-3" style={{ background: bgCard, border: `1px solid ${borderColor}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.name} <span style={{ color: mutedColor }}>({phaseTypeLabel[p.type]})</span></p>
                    <p className="text-xs" style={{ color: mutedColor }}>{formatDate(p.startDate)} → {formatDate(p.endDate)}</p>
                  </div>
                  <div className="text-right text-xs">
                    {p.targetCalories && <p>{p.targetCalories} kcal</p>}
                    {p.completed && <p style={{ color: "#22c55e" }}>✓ Completata</p>}
                  </div>
                </div>
                {p.notes && <p className="text-xs mt-1" style={{ color: mutedColor }}>{p.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schede */}
      {sections.schede && client.workoutPlans.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>Schede di Allenamento</h2>
          <div className="space-y-2">
            {client.workoutPlans.map((w) => (
              <div key={w.id} className="rounded-xl p-3" style={{ background: bgCard, border: `1px solid ${borderColor}` }}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-xs" style={{ color: mutedColor }}>{w.daysPerWeek} gg/sett.</p>
                </div>
                {w.description && <p className="text-xs mt-1" style={{ color: mutedColor }}>{w.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dieta */}
      {sections.dieta && client.dietPlans.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>Piani Alimentari</h2>
          <div className="space-y-2">
            {client.dietPlans.map((d) => (
              <div key={d.id} className="rounded-xl p-3" style={{ background: bgCard, border: `1px solid ${borderColor}` }}>
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{d.name}</p>
                  <p className="font-bold" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>{d.calories} kcal</p>
                </div>
                <div className="flex gap-4 mt-1 text-xs" style={{ color: mutedColor }}>
                  <span>Prot. {d.protein}g</span>
                  <span>Carb. {d.carbs}g</span>
                  <span>Grassi {d.fat}g</span>
                </div>
                {d.notes && <p className="text-xs mt-1" style={{ color: mutedColor }}>{d.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Misurazioni */}
      {sections.misurazioni && client.measurements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: forPrint ? "#FF6B2B" : "var(--accent)" }}>Misurazioni Corporee</h2>
          <div className="space-y-2">
            {[...client.measurements]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((m) => (
                <div key={m.id} className="rounded-xl p-3" style={{ background: bgCard, border: `1px solid ${borderColor}` }}>
                  <div className="flex items-start justify-between">
                    <p className="font-semibold">{formatDate(m.date)}</p>
                    <p className="font-bold">{m.weight} kg</p>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: mutedColor }}>
                    {m.bodyFat && <span>Grasso {m.bodyFat}%</span>}
                    {m.chest && <span>Petto {m.chest}cm</span>}
                    {m.waist && <span>Vita {m.waist}cm</span>}
                    {m.arms && <span>Braccia {m.arms}cm</span>}
                    {m.legs && <span>Gambe {m.legs}cm</span>}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="pt-4 text-center text-xs" style={{ borderTop: `1px solid ${borderColor}`, color: mutedColor }}>
        Generato da TrainerPro · {new Date().toLocaleDateString("it-IT")}
      </div>
    </div>
  );
}
