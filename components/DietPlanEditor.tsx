"use client";
import { useState, useEffect } from "react";
import type { DietPlan, Meal, MealItem, Phase } from "@/lib/store";
import {
  X, Plus, Trash2, ChevronDown, ChevronUp, Clock, UtensilsCrossed,
  Check, Flame, Wheat, Droplets, Beef,
} from "lucide-react";

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,107,43,0.2)",
  color: "var(--ivory)",
};
const selectStyle = {
  background: "rgba(26,26,26,1)",
  border: "1px solid rgba(255,107,43,0.2)",
  color: "var(--ivory)",
};

function uid() { return crypto.randomUUID(); }

function parseMeals(raw: string): Meal[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "items" in parsed[0]) return parsed as Meal[];
  } catch {}
  return [];
}

interface MacroRowProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  unit: string;
}

function MacroRow({ label, icon, color, min, max, onMin, onMax, unit }: MacroRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <span style={{ color }}>{icon}</span>
        <span className="text-sm font-medium" style={{ color: "var(--ivory)" }}>{label}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>Min {unit}</label>
          <input type="number" value={min} onChange={(e) => onMin(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
        <span className="text-xs mt-4" style={{ color: "rgba(245,240,232,0.3)" }}>–</span>
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>Max {unit}</label>
          <input type="number" value={max} onChange={(e) => onMax(e.target.value)}
            placeholder="facoltativo"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
      </div>
    </div>
  );
}

interface MealItemRowProps {
  item: MealItem;
  onChange: (data: Partial<MealItem>) => void;
  onRemove: () => void;
}

function MealItemRow({ item, onChange, onRemove }: MealItemRowProps) {
  return (
    <div className="p-3 rounded-xl mb-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2">
            <input value={item.name} onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Alimento (es. Pollo, Riso, Olio EVO…)"
              className="w-full px-2.5 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <input type="number" value={item.grams || ""} onChange={(e) => onChange({ grams: parseFloat(e.target.value) || 0 })}
                placeholder="g min"
                className="flex-1 w-full px-2.5 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
              <span className="text-xs flex-shrink-0" style={{ color: "rgba(245,240,232,0.3)" }}>–</span>
              <input type="number" value={item.gramsMax || ""} onChange={(e) => onChange({ gramsMax: parseFloat(e.target.value) || undefined })}
                placeholder="g max"
                className="flex-1 w-full px-2.5 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.3)" }}>Grammi (range)</p>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <input type="number" value={item.protein || ""} onChange={(e) => onChange({ protein: parseFloat(e.target.value) || undefined })}
                placeholder="P g"
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={{ ...inputStyle, border: "1px solid rgba(167,139,250,0.25)" }} />
              <p className="text-xs mt-0.5 text-center" style={{ color: "rgba(167,139,250,0.6)" }}>Prot</p>
            </div>
            <div>
              <input type="number" value={item.carbs || ""} onChange={(e) => onChange({ carbs: parseFloat(e.target.value) || undefined })}
                placeholder="C g"
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={{ ...inputStyle, border: "1px solid rgba(56,189,248,0.25)" }} />
              <p className="text-xs mt-0.5 text-center" style={{ color: "rgba(56,189,248,0.6)" }}>Carb</p>
            </div>
            <div>
              <input type="number" value={item.fat || ""} onChange={(e) => onChange({ fat: parseFloat(e.target.value) || undefined })}
                placeholder="G g"
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={{ ...inputStyle, border: "1px solid rgba(251,191,36,0.25)" }} />
              <p className="text-xs mt-0.5 text-center" style={{ color: "rgba(251,191,36,0.6)" }}>Gras</p>
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="mt-1 p-1.5 rounded-lg flex-shrink-0 hover:bg-red-500/10 transition-all">
          <Trash2 size={13} style={{ color: "rgba(239,68,68,0.55)" }} />
        </button>
      </div>
      {/* notes per item */}
      <input value={item.notes || ""} onChange={(e) => onChange({ notes: e.target.value || undefined })}
        placeholder="Note (es. cottura a vapore, olio extra…)"
        className="w-full mt-2 px-2.5 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
    </div>
  );
}

interface MealBlockProps {
  meal: Meal;
  index: number;
  onUpdate: (data: Partial<Meal>) => void;
  onRemove: () => void;
}

function MealBlock({ meal, index, onUpdate, onRemove }: MealBlockProps) {
  const [expanded, setExpanded] = useState(true);

  const totalCalFromItems = meal.items.reduce((acc, it) => {
    return acc + ((it.protein ?? 0) * 4 + (it.carbs ?? 0) * 4 + (it.fat ?? 0) * 9);
  }, 0);

  function addItem() {
    const item: MealItem = { id: uid(), name: "", grams: 0 };
    onUpdate({ items: [...meal.items, item] });
  }

  function updateItem(itemId: string, data: Partial<MealItem>) {
    onUpdate({ items: meal.items.map((it) => it.id === itemId ? { ...it, ...data } : it) });
  }

  function removeItem(itemId: string) {
    onUpdate({ items: meal.items.filter((it) => it.id !== itemId) });
  }

  return (
    <div className="rounded-2xl mb-3" style={{ border: "1px solid rgba(255,107,43,0.18)", background: "rgba(255,107,43,0.03)" }}>
      {/* Meal header */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "rgba(255,107,43,0.15)", color: "var(--accent-light)" }}>
          {index + 1}
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input value={meal.name} onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`Pasto ${index + 1}`}
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none border-b"
            style={{ color: "var(--ivory)", borderColor: "rgba(255,107,43,0.2)" }} />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock size={11} style={{ color: "rgba(245,240,232,0.3)" }} />
            <input value={meal.time || ""} onChange={(e) => onUpdate({ time: e.target.value || undefined })}
              placeholder="orario"
              className="w-16 text-xs bg-transparent outline-none"
              style={{ color: "rgba(245,240,232,0.5)" }} />
          </div>
        </div>
        {totalCalFromItems > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(255,107,43,0.08)", color: "var(--accent-light)" }}>
            ~{Math.round(totalCalFromItems)} kcal
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-white/5 transition-all">
            {expanded ? <ChevronUp size={14} style={{ color: "rgba(245,240,232,0.4)" }} /> : <ChevronDown size={14} style={{ color: "rgba(245,240,232,0.4)" }} />}
          </button>
          <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
            <Trash2 size={13} style={{ color: "rgba(239,68,68,0.5)" }} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5">
          {/* Food items */}
          {meal.items.map((item) => (
            <MealItemRow key={item.id} item={item}
              onChange={(data) => updateItem(item.id, data)}
              onRemove={() => removeItem(item.id)} />
          ))}
          <button onClick={addItem}
            className="flex items-center gap-1.5 w-full py-2 rounded-xl text-xs mt-1 transition-all"
            style={{ border: "1px dashed rgba(255,107,43,0.2)", color: "var(--accent-light)", background: "transparent" }}>
            <Plus size={12} /> Aggiungi alimento
          </button>
          {/* Meal notes */}
          <input value={meal.notes || ""} onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
            placeholder="Note pasto (es. post-workout, pre-nanna…)"
            className="w-full mt-2 px-3 py-2 rounded-xl text-xs outline-none" style={inputStyle} />
        </div>
      )}
    </div>
  );
}

// ─── Main DietPlanEditor Modal ─────────────────────────────────────────────────
interface Props {
  plan?: DietPlan; // undefined = create new
  clientId: string;
  phases: Phase[];
  onSave: (data: Omit<DietPlan, "id" | "clientId" | "createdAt">) => void;
  onClose: () => void;
}

export default function DietPlanEditor({ plan, clientId, phases, onSave, onClose }: Props) {
  const [name, setName] = useState(plan?.name ?? "");
  const [phaseId, setPhaseId] = useState(plan?.phaseId ?? "");
  const [active, setActive] = useState(plan?.active ?? true);
  const [notes, setNotes] = useState(plan?.notes ?? "");

  // Macros with ranges
  const [calories, setCalories] = useState(plan?.calories?.toString() ?? "");
  const [caloriesMax, setCaloriesMax] = useState(plan?.caloriesMax?.toString() ?? "");
  const [protein, setProtein] = useState(plan?.protein?.toString() ?? "");
  const [proteinMax, setProteinMax] = useState(plan?.proteinMax?.toString() ?? "");
  const [carbs, setCarbs] = useState(plan?.carbs?.toString() ?? "");
  const [carbsMax, setCarbsMax] = useState(plan?.carbsMax?.toString() ?? "");
  const [fat, setFat] = useState(plan?.fat?.toString() ?? "");
  const [fatMax, setFatMax] = useState(plan?.fatMax?.toString() ?? "");

  // Meals
  const [meals, setMeals] = useState<Meal[]>(() => parseMeals(plan?.meals ?? "[]"));

  // Auto-compute calories from macros if calories is empty
  const computedKcal = (parseFloat(protein) || 0) * 4 + (parseFloat(carbs) || 0) * 4 + (parseFloat(fat) || 0) * 9;
  const computedKcalMax = (parseFloat(proteinMax) || parseFloat(protein) || 0) * 4 + (parseFloat(carbsMax) || parseFloat(carbs) || 0) * 4 + (parseFloat(fatMax) || parseFloat(fat) || 0) * 9;
  const hasMacros = (parseFloat(protein) || parseFloat(carbs) || parseFloat(fat)) > 0;

  function addMeal() {
    const newMeal: Meal = { id: uid(), name: `Pasto ${meals.length + 1}`, items: [] };
    setMeals([...meals, newMeal]);
  }

  function updateMeal(mealId: string, data: Partial<Meal>) {
    setMeals(meals.map((m) => m.id === mealId ? { ...m, ...data } : m));
  }

  function removeMeal(mealId: string) {
    setMeals(meals.filter((m) => m.id !== mealId));
  }

  function handleSave() {
    const cal = parseFloat(calories) || (hasMacros ? Math.round(computedKcal) : 0);
    const calMax = parseFloat(caloriesMax) || (hasMacros && computedKcalMax > computedKcal ? Math.round(computedKcalMax) : undefined);
    onSave({
      name: name.trim() || "Piano alimentare",
      phaseId: phaseId || undefined,
      active,
      notes: notes.trim() || undefined,
      calories: cal,
      caloriesMax: calMax,
      protein: parseFloat(protein) || 0,
      proteinMax: parseFloat(proteinMax) || undefined,
      carbs: parseFloat(carbs) || 0,
      carbsMax: parseFloat(carbsMax) || undefined,
      fat: parseFloat(fat) || 0,
      fatMax: parseFloat(fatMax) || undefined,
      meals: JSON.stringify(meals),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-4 pb-8 px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-3xl p-6 my-4 flex flex-col gap-5"
        style={{ background: "rgba(18,12,8,0.98)", border: "1px solid rgba(255,107,43,0.22)", boxShadow: "0 0 60px rgba(255,107,43,0.08)" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,43,0.12)", border: "1px solid rgba(255,107,43,0.2)" }}>
              <UtensilsCrossed size={16} style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--ivory)" }}>
              {plan ? "Modifica piano alimentare" : "Nuovo piano alimentare"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all">
            <X size={18} style={{ color: "rgba(245,240,232,0.5)" }} />
          </button>
        </div>

        {/* ── Plan metadata ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(245,240,232,0.5)" }}>Nome piano *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="es. Massa, Definizione, Mantenimento…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(245,240,232,0.5)" }}>Fase collegata</label>
            <select value={phaseId} onChange={(e) => setPhaseId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={selectStyle}>
              <option value="">— Nessuna —</option>
              {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={() => setActive(!active)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={active
                ? { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,240,232,0.4)" }}>
              {active ? <Check size={13} /> : <span className="w-3 h-3 rounded-full inline-block" style={{ background: "rgba(245,240,232,0.2)" }} />}
              {active ? "Piano attivo" : "Piano inattivo"}
            </button>
          </div>
        </div>

        {/* ── Macros with ranges ── */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,107,43,0.1)" }}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ivory)" }}>
            <Flame size={14} style={{ color: "var(--accent)" }} /> Macronutrienti giornalieri
            <span className="text-xs font-normal ml-1" style={{ color: "rgba(245,240,232,0.35)" }}>(range min – max)</span>
          </h3>

          <div className="space-y-3">
            <MacroRow label="Calorie" icon={<Flame size={14} />} color="var(--accent)"
              min={calories} max={caloriesMax} unit="kcal"
              onMin={setCalories} onMax={setCaloriesMax} />
            <MacroRow label="Proteine" icon={<Beef size={14} />} color="#a78bfa"
              min={protein} max={proteinMax} unit="g"
              onMin={setProtein} onMax={setProteinMax} />
            <MacroRow label="Carboidrati" icon={<Wheat size={14} />} color="#38bdf8"
              min={carbs} max={carbsMax} unit="g"
              onMin={setCarbs} onMax={setCarbsMax} />
            <MacroRow label="Grassi" icon={<Droplets size={14} />} color="#fbbf24"
              min={fat} max={fatMax} unit="g"
              onMin={setFat} onMax={setFatMax} />
          </div>

          {hasMacros && (
            <div className="mt-3 pt-3 flex items-center gap-3 flex-wrap"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Calcolato dai macro:</span>
              <span className="text-sm font-bold" style={{ color: "var(--accent-light)" }}>
                {Math.round(computedKcal)}{computedKcalMax > computedKcal ? `–${Math.round(computedKcalMax)}` : ""} kcal
              </span>
              {(parseFloat(calories) > 0) && Math.abs(parseFloat(calories) - computedKcal) > 20 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                  ⚠ differisce dal valore inserito
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Meal breakdown ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--ivory)" }}>
              <UtensilsCrossed size={14} style={{ color: "var(--accent)" }} />
              Pasti ({meals.length})
            </h3>
            <button onClick={addMeal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.2)", color: "var(--accent-light)" }}>
              <Plus size={12} /> Aggiungi pasto
            </button>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-8 rounded-2xl" style={{ border: "1px dashed rgba(255,107,43,0.15)" }}>
              <UtensilsCrossed size={28} className="mx-auto mb-2" style={{ color: "rgba(255,107,43,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>Nessun pasto ancora</p>
              <button onClick={addMeal} className="mt-2 text-xs hover:underline" style={{ color: "var(--accent-light)" }}>
                + Aggiungi il primo pasto
              </button>
            </div>
          ) : (
            <div>
              {meals.map((meal, i) => (
                <MealBlock key={meal.id} meal={meal} index={i}
                  onUpdate={(data) => updateMeal(meal.id, data)}
                  onRemove={() => removeMeal(meal.id)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(245,240,232,0.5)" }}>Note generali</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Indicazioni generali, strategia di refeed, timing, integratori…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
        </div>

        {/* ── Save / Cancel ── */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,232,0.5)" }}>
            Annulla
          </button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-[2] accent-btn py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            <Check size={15} /> {plan ? "Salva modifiche" : "Crea piano alimentare"}
          </button>
        </div>
      </div>
    </div>
  );
}
