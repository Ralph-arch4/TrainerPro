// ─── Nutrition plan generator ──────────────────────────────────────────────
// Given daily macro targets and a meal count, builds a full day of eating
// with per-food gram amounts computed from lib/foodDatabase. Per meal, the
// grams of the carb / protein / fat source are solved iteratively
// (Gauss-Seidel: each food is dominant in its own macro, so it converges),
// then a day-level fine-tune pass corrects rounding drift to ~1 g.

import type { Meal, MealItem } from "./store";
import { FOODS, type Food, type MealSlot, displayName, macrosFor } from "./foodDatabase";

export type DietPreference = "onnivora" | "pescetariana" | "vegetariana";

export interface GeneratorInput {
  protein: number; // g/day
  carbs: number;   // g/day
  fat: number;     // g/day
  mealsCount: number; // 2-6
  preference: DietPreference;
  seed?: number; // bump to get a different food rotation
}

export interface GeneratedTotals { protein: number; carbs: number; fat: number; calories: number; }
export interface GeneratedPlan { meals: Meal[]; totals: GeneratedTotals; }

interface SlotDef { slot: MealSlot; name: string; time: string; kcalWeight: number; }

const SLOT_SEQUENCES: Record<number, SlotDef[]> = {
  2: [
    { slot: "pranzo", name: "Pranzo", time: "13:00", kcalWeight: 1.15 },
    { slot: "cena", name: "Cena", time: "20:00", kcalWeight: 1.05 },
  ],
  3: [
    { slot: "colazione", name: "Colazione", time: "07:30", kcalWeight: 0.8 },
    { slot: "pranzo", name: "Pranzo", time: "13:00", kcalWeight: 1.15 },
    { slot: "cena", name: "Cena", time: "20:00", kcalWeight: 1.05 },
  ],
  4: [
    { slot: "colazione", name: "Colazione", time: "07:30", kcalWeight: 0.8 },
    { slot: "spuntino", name: "Spuntino mattina", time: "10:30", kcalWeight: 0.4 },
    { slot: "pranzo", name: "Pranzo", time: "13:00", kcalWeight: 1.15 },
    { slot: "cena", name: "Cena", time: "20:00", kcalWeight: 1.05 },
  ],
  5: [
    { slot: "colazione", name: "Colazione", time: "07:30", kcalWeight: 0.8 },
    { slot: "spuntino", name: "Spuntino mattina", time: "10:30", kcalWeight: 0.4 },
    { slot: "pranzo", name: "Pranzo", time: "13:00", kcalWeight: 1.15 },
    { slot: "spuntino", name: "Spuntino pomeriggio", time: "16:30", kcalWeight: 0.4 },
    { slot: "cena", name: "Cena", time: "20:00", kcalWeight: 1.05 },
  ],
  6: [
    { slot: "colazione", name: "Colazione", time: "07:30", kcalWeight: 0.8 },
    { slot: "spuntino", name: "Spuntino mattina", time: "10:30", kcalWeight: 0.4 },
    { slot: "pranzo", name: "Pranzo", time: "13:00", kcalWeight: 1.1 },
    { slot: "spuntino", name: "Spuntino pomeriggio", time: "16:30", kcalWeight: 0.4 },
    { slot: "cena", name: "Cena", time: "20:00", kcalWeight: 1 },
    { slot: "spuntino", name: "Spuntino serale", time: "22:30", kcalWeight: 0.35 },
  ],
};

// Candidate food ids per slot and role. Order matters: for restricted
// preferences the earliest allowed candidate that can cover the protein
// target is preferred, so low-carb vegetal proteins come before legumes.
const CANDIDATES: Record<MealSlot, { carb: string[]; protein: string[]; fat: string[]; fixedVeg?: boolean; fixedFruit?: boolean }> = {
  colazione: {
    carb: ["fiocchi-avena", "pane-integrale", "fette-biscottate", "gallette-riso", "pane-segale"],
    protein: ["yogurt-greco", "albume", "whey", "skyr", "fiocchi-latte", "ricotta"],
    fat: ["mandorle", "burro-arachidi", "noci", "nocciole", "cioccolato-fondente"],
    fixedFruit: true,
  },
  spuntino: {
    carb: ["banana", "mela", "gallette-riso", "pera", "pane-integrale", "frutti-bosco"],
    protein: ["yogurt-greco", "whey", "skyr", "bresaola", "fiocchi-latte"],
    fat: ["mandorle", "noci", "nocciole", "cioccolato-fondente", "burro-arachidi"],
  },
  pranzo: {
    carb: ["pasta-barilla", "riso-basmati", "farro", "quinoa", "couscous", "pane-integrale", "patate"],
    protein: ["petto-pollo", "fesa-tacchino", "tonno-naturale", "manzo-magro", "gamberi", "seitan", "uova", "tofu", "lenticchie", "ceci"],
    fat: ["olio-evo", "parmigiano", "avocado"],
    fixedVeg: true,
  },
  cena: {
    carb: ["patate", "riso-basmati", "pane-integrale", "patate-dolci", "riso-venere", "pasta-integrale"],
    protein: ["merluzzo", "salmone", "petto-pollo", "orata", "manzo-magro", "branzino", "vitello", "seitan", "uova", "tofu", "fagioli"],
    fat: ["olio-evo", "avocado", "noci"],
    fixedVeg: true,
  },
};

const VEG_ROTATION = ["zucchine", "broccoli", "insalata-mista", "spinaci", "fagiolini", "asparagi"];
const FRUIT_ROTATION = ["banana", "frutti-bosco", "mela", "kiwi"];

function uid(): string {
  return crypto.randomUUID();
}

function allowed(food: Food, pref: DietPreference): boolean {
  if (pref === "vegetariana") return !food.meat && !food.fish;
  if (pref === "pescetariana") return !food.meat;
  return true;
}

function getFoodStrict(id: string): Food {
  const f = FOODS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown food id: ${id}`);
  return f;
}

function roundStep(grams: number, food: Food): number {
  const step = food.step ?? 5;
  return Math.round(grams / step) * step;
}

function clampGrams(grams: number, food: Food): number {
  return Math.min(Math.max(grams, 0), food.maxGrams ?? 600);
}

// Seeded candidate pick: rotates with the seed, skips foods already used
// today when an alternative exists, so lunch and dinner don't repeat.
function pick(ids: string[], pref: DietPreference, seed: number, used: Set<string>, minCoverage?: { macro: "protein"; grams: number }): Food {
  const pool = ids.map(getFoodStrict).filter((f) => allowed(f, pref));
  if (pool.length === 0) throw new Error("No food available for preference");
  const covers = (f: Food) => {
    if (!minCoverage) return true;
    const density = f.per100[minCoverage.macro];
    return density > 0 && (density * (f.maxGrams ?? 600)) / 100 >= minCoverage.grams;
  };
  const ranked = pool
    .map((f, i) => ({ f, order: (i + seed) % pool.length }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.f);
  return (
    ranked.find((f) => !used.has(f.id) && covers(f)) ??
    ranked.find((f) => covers(f)) ??
    // Nothing covers the target within its portion cap: take the densest.
    ranked.slice().sort((a, b) => b.per100.protein - a.per100.protein)[0]
  );
}

interface SolvedItem { food: Food; grams: number; role: "carb" | "protein" | "fat" | "fixed"; }

// Solve grams of the three main foods so the meal hits its macro targets.
function solveTrio(target: { p: number; c: number; f: number }, carb: Food, prot: Food, fat: Food) {
  let gC = 0, gP = 0, gF = 0;
  for (let i = 0; i < 16; i++) {
    gC = clampGrams(((target.c - (prot.per100.carbs * gP) / 100 - (fat.per100.carbs * gF) / 100) / carb.per100.carbs) * 100, carb);
    gP = clampGrams(((target.p - (carb.per100.protein * gC) / 100 - (fat.per100.protein * gF) / 100) / prot.per100.protein) * 100, prot);
    gF = fat.per100.fat > 0
      ? clampGrams(((target.f - (carb.per100.fat * gC) / 100 - (prot.per100.fat * gP) / 100) / fat.per100.fat) * 100, fat)
      : 0;
  }
  return { gC, gP, gF };
}

function toMealItem(si: SolvedItem): MealItem {
  const m = macrosFor(si.food, si.grams);
  return {
    id: uid(),
    foodId: si.food.id,
    name: displayName(si.food),
    grams: si.grams,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    calories: m.calories,
    notes: si.food.unitNote,
  };
}

export function generateNutritionPlan(input: GeneratorInput): GeneratedPlan {
  const seed = input.seed ?? 0;
  const n = Math.min(Math.max(Math.round(input.mealsCount) || 4, 2), 6);
  const slots = SLOT_SEQUENCES[n];

  const totalW = slots.reduce((acc, s) => acc + s.kcalWeight, 0);
  const used = new Set<string>();
  const mealItems: SolvedItem[][] = [];

  slots.forEach((slotDef, mi) => {
    const w = slotDef.kcalWeight / totalW;
    // Protein is spread flatter than kcal so every meal carries a useful dose.
    const pShare = 0.6 * w + 0.4 * (1 / n);
    const target = {
      p: input.protein * pShare,
      c: input.carbs * w,
      f: input.fat * w,
    };

    const cand = CANDIDATES[slotDef.slot];
    const items: SolvedItem[] = [];

    // Fixed sides contribute first; their macros are subtracted from targets.
    if (cand.fixedVeg) {
      const veg = getFoodStrict(VEG_ROTATION[(seed + mi) % VEG_ROTATION.length]);
      items.push({ food: veg, grams: 200, role: "fixed" });
    }
    if (cand.fixedFruit) {
      const fruit = getFoodStrict(FRUIT_ROTATION[(seed + mi) % FRUIT_ROTATION.length]);
      items.push({ food: fruit, grams: 100, role: "fixed" });
    }
    for (const fx of items) {
      target.p -= (fx.food.per100.protein * fx.grams) / 100;
      target.c -= (fx.food.per100.carbs * fx.grams) / 100;
      target.f -= (fx.food.per100.fat * fx.grams) / 100;
    }
    target.p = Math.max(target.p, 0);
    target.c = Math.max(target.c, 0);
    target.f = Math.max(target.f, 0);

    const protFood = pick(cand.protein, input.preference, seed + mi * 3, used, { macro: "protein", grams: target.p });
    const carbFood = pick(cand.carb, input.preference, seed + mi * 3, used);
    const fatFood = pick(cand.fat, input.preference, seed + mi * 3, used);
    used.add(protFood.id);
    used.add(carbFood.id);

    const { gC, gP, gF } = solveTrio(target, carbFood, protFood, fatFood);

    const solids: SolvedItem[] = ([
      { food: carbFood, grams: roundStep(gC, carbFood), role: "carb" },
      { food: protFood, grams: roundStep(gP, protFood), role: "protein" },
      { food: fatFood, grams: roundStep(gF, fatFood), role: "fat" },
    ] as SolvedItem[]).filter((si) => si.grams >= ((si.food.step ?? 5) <= 1 ? 3 : 10));

    mealItems.push([...solids, ...items]);
  });

  // ── Day-level fine-tune: fix rounding drift by nudging one dominant item
  // per macro (step 1 g) so daily totals land within ~1 g of the targets.
  const totalOf = (macro: "protein" | "carbs" | "fat") =>
    mealItems.flat().reduce((acc, si) => acc + (si.food.per100[macro] * si.grams) / 100, 0);

  (["protein", "carbs", "fat"] as const).forEach((macro) => {
    const targetVal = macro === "protein" ? input.protein : macro === "carbs" ? input.carbs : input.fat;
    const residual = targetVal - totalOf(macro);
    const role = macro === "carbs" ? "carb" : macro === "protein" ? "protein" : "fat";
    // Most-dense adjuster of the matching role, preferring the largest meal.
    const adjuster = mealItems
      .flat()
      .filter((si) => si.role === role && si.food.per100[macro] > 0)
      .sort((a, b) => b.food.per100[macro] - a.food.per100[macro])[0];
    if (!adjuster) return;
    const delta = Math.round((residual / adjuster.food.per100[macro]) * 100);
    adjuster.grams = clampGrams(adjuster.grams + delta, adjuster.food);
  });

  const meals: Meal[] = slots.map((slotDef, mi) => ({
    id: uid(),
    name: slotDef.name,
    time: slotDef.time,
    items: mealItems[mi]
      .slice()
      .sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
      .map(toMealItem),
  }));

  const totals = meals.reduce(
    (acc, m) => {
      for (const it of m.items) {
        acc.protein += it.protein ?? 0;
        acc.carbs += it.carbs ?? 0;
        acc.fat += it.fat ?? 0;
        acc.calories += it.calories ?? 0;
      }
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 },
  );
  totals.protein = Math.round(totals.protein);
  totals.carbs = Math.round(totals.carbs);
  totals.fat = Math.round(totals.fat);

  return { meals, totals };
}

function roleOrder(role: SolvedItem["role"]): number {
  switch (role) {
    case "carb": return 0;
    case "protein": return 1;
    case "fat": return 2;
    default: return 3;
  }
}
