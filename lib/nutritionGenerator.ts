// ─── Nutrition plan generator ──────────────────────────────────────────────
// Given daily macro targets and a meal count, builds a full day of eating
// with per-food gram amounts computed from lib/foodDatabase. Per meal, the
// grams of the carb / protein / fat source are solved iteratively
// (Gauss-Seidel: each food is dominant in its own macro, so it converges),
// then a per-meal fine-tune corrects rounding drift so every single meal
// hits its own targets, and a day-level pass lands totals within ~1 g.
// Each meal also gets VARIANTS_PER_MEAL complete alternative versions
// (different source combinations solved on the same meal targets).

import type { Meal, MealItem, MealItemAlternative, MealVariant } from "./store";
import { FOODS, type Food, type FoodCategory, type MealSlot, displayName, macrosFor } from "./foodDatabase";

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
function pick(ids: string[], pref: DietPreference, seed: number, used: Set<string>, minCoverage?: { macro: "protein" | "carbs" | "fat"; grams: number }): Food {
  const pool = ids.map(getFoodStrict).filter((f) => allowed(f, pref));
  if (pool.length === 0) throw new Error("No food available for preference");
  const covers = (f: Food) => {
    if (!minCoverage) return true;
    const density = f.per100[minCoverage.macro];
    return density > 0 && (density * (f.maxGrams ?? 600)) / 100 >= minCoverage.grams * 0.9;
  };
  const ranked = pool
    .map((f, i) => ({ f, order: (i + seed) % pool.length }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.f);
  return (
    ranked.find((f) => !used.has(f.id) && covers(f)) ??
    ranked.find((f) => covers(f)) ??
    // Nothing covers the target within its portion cap: take the densest.
    ranked.slice().sort((a, b) => b.per100[minCoverage?.macro ?? "protein"] - a.per100[minCoverage?.macro ?? "protein"])[0]
  );
}

interface SolvedItem { food: Food; grams: number; role: "carb" | "protein" | "fat" | "fixed"; }
interface MealTargets { p: number; c: number; f: number; }
interface ComboPick { carb: Food; prot: Food; fat: Food; }

// Solve grams of the three main foods so the meal hits its macro targets.
function solveTrio(target: MealTargets, carb: Food, prot: Food, fat: Food) {
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

// Per-meal fine-tune: after step-rounding, nudge each role item by 1 g steps
// so THIS meal hits its own targets, not just the day total.
function tuneMeal(items: SolvedItem[], targets: MealTargets) {
  const passes: Array<{ role: SolvedItem["role"]; macro: "protein" | "carbs" | "fat"; target: number }> = [
    { role: "protein", macro: "protein", target: targets.p },
    { role: "carb", macro: "carbs", target: targets.c },
    { role: "fat", macro: "fat", target: targets.f },
  ];
  for (const pass of passes) {
    const it = items.find((si) => si.role === pass.role && si.food.per100[pass.macro] > 0);
    if (!it) continue;
    const total = items.reduce((acc, si) => acc + (si.food.per100[pass.macro] * si.grams) / 100, 0);
    const delta = Math.round(((pass.target - total) / it.food.per100[pass.macro]) * 100);
    it.grams = clampGrams(it.grams + delta, it.food);
  }
}

// Assemble one meal version: fixed sides, solve the trio on the remaining
// targets, round to realistic steps, drop crumbs, then fine-tune the meal.
function buildMealItems(combo: ComboPick, cand: { fixedVeg?: boolean; fixedFruit?: boolean }, mealTargets: MealTargets, fixedSeed: number): SolvedItem[] {
  const fixed: SolvedItem[] = [];
  if (cand.fixedVeg) {
    const veg = getFoodStrict(VEG_ROTATION[fixedSeed % VEG_ROTATION.length]);
    fixed.push({ food: veg, grams: 200, role: "fixed" });
  }
  if (cand.fixedFruit) {
    const fruit = getFoodStrict(FRUIT_ROTATION[fixedSeed % FRUIT_ROTATION.length]);
    fixed.push({ food: fruit, grams: 100, role: "fixed" });
  }

  const target: MealTargets = { ...mealTargets };
  for (const fx of fixed) {
    target.p -= (fx.food.per100.protein * fx.grams) / 100;
    target.c -= (fx.food.per100.carbs * fx.grams) / 100;
    target.f -= (fx.food.per100.fat * fx.grams) / 100;
  }
  target.p = Math.max(target.p, 0);
  target.c = Math.max(target.c, 0);
  target.f = Math.max(target.f, 0);

  const { gC, gP, gF } = solveTrio(target, combo.carb, combo.prot, combo.fat);

  const solids: SolvedItem[] = ([
    { food: combo.carb, grams: roundStep(gC, combo.carb), role: "carb" },
    { food: combo.prot, grams: roundStep(gP, combo.prot), role: "protein" },
    { food: combo.fat, grams: roundStep(gF, combo.fat), role: "fat" },
  ] as SolvedItem[]).filter((si) => si.grams >= ((si.food.step ?? 5) <= 1 ? 3 : 10));

  const items = [...solids, ...fixed];
  tuneMeal(items, mealTargets);
  return items;
}

function poolFor(ids: string[], pref: DietPreference): Food[] {
  return ids.map(getFoodStrict).filter((f) => allowed(f, pref));
}

// Distinct source combinations for the meal variants: rotate each pool with
// a different stride and reject combos already seen (including the primary).
function variantCombos(cand: { carb: string[]; protein: string[]; fat: string[] }, pref: DietPreference, seed: number, count: number, primarySig: string, proteinTarget: number): ComboPick[] {
  const carbs = poolFor(cand.carb, pref);
  const fats = poolFor(cand.fat, pref);
  let prots = poolFor(cand.protein, pref).filter(
    (f) => (f.per100.protein * (f.maxGrams ?? 600)) / 100 >= proteinTarget * 0.9,
  );
  if (prots.length === 0) prots = poolFor(cand.protein, pref);
  if (carbs.length === 0 || prots.length === 0 || fats.length === 0) return [];

  const combos: ComboPick[] = [];
  const sigs = new Set([primarySig]);
  for (let v = 0; combos.length < count && v < count * 8; v++) {
    const combo: ComboPick = {
      carb: carbs[(seed + v) % carbs.length],
      prot: prots[(seed + v) % prots.length],
      fat: fats[(seed + Math.floor(v / prots.length) + v) % fats.length],
    };
    const sig = `${combo.carb.id}|${combo.prot.id}|${combo.fat.id}`;
    if (sigs.has(sig)) continue;
    sigs.add(sig);
    combos.push(combo);
  }
  return combos;
}

// A variant is publishable only if it actually lands on the meal targets;
// combos where a portion cap truncates a macro are discarded.
function mealWithinTolerance(items: SolvedItem[], t: MealTargets): boolean {
  const tot = { p: 0, c: 0, f: 0 };
  for (const si of items) {
    tot.p += (si.food.per100.protein * si.grams) / 100;
    tot.c += (si.food.per100.carbs * si.grams) / 100;
    tot.f += (si.food.per100.fat * si.grams) / 100;
  }
  const ok = (achieved: number, target: number) => Math.abs(achieved - target) <= Math.max(5, target * 0.08);
  return ok(tot.p, t.p) && ok(tot.c, t.c) && ok(tot.f, t.f);
}

function toMealItem(si: SolvedItem, alternatives: MealItemAlternative[]): MealItem {
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
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  };
}

const MAX_ALTERNATIVES = 5;

// Equivalent substitutes: same slot and role, grams solved so the substitute
// carries the same amount of the item's dominant macro (e.g. 90 g of rice and
// 99 g of pasta both provide ~70 g of carbs).
function alternativesFor(si: SolvedItem, slot: MealSlot, pref: DietPreference, seed: number): MealItemAlternative[] {
  // Vegetable sides are quasi-free: swap at equal weight.
  if (si.role === "fixed" && si.food.category === "veg") {
    const pool = rotate(FOODS.filter((f) => f.category === "veg" && f.id !== si.food.id), seed);
    return pool.slice(0, MAX_ALTERNATIVES).map((f) => ({ foodId: f.id, name: displayName(f), grams: si.grams }));
  }

  const macro: "protein" | "carbs" | "fat" =
    si.role === "protein" ? "protein" : si.role === "fat" ? "fat" : "carbs";
  const categories: FoodCategory[] =
    si.role === "protein" ? ["protein"]
    : si.role === "fat" ? ["fat"]
    : si.role === "fixed" ? ["fruit"]
    : ["carb", "fruit"];

  const target = (si.food.per100[macro] * si.grams) / 100;
  const pool = FOODS.filter((f) =>
    f.id !== si.food.id &&
    categories.includes(f.category) &&
    f.slots.includes(slot) &&
    allowed(f, pref) &&
    f.per100[macro] > 0 &&
    // must reach ~the same macro amount within a realistic portion
    (f.per100[macro] * (f.maxGrams ?? 600)) / 100 >= target * 0.9,
  );

  return rotate(pool, seed)
    .slice(0, MAX_ALTERNATIVES)
    .map((f) => ({ foodId: f.id, name: displayName(f), grams: clampGrams(roundStep((target / f.per100[macro]) * 100, f), f) }))
    .filter((a) => a.grams > 0);
}

function rotate<T>(arr: T[], seed: number): T[] {
  if (arr.length === 0) return arr;
  const s = seed % arr.length;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

const VARIANTS_PER_MEAL = 6; // within the 5-7 range requested by PTs

export function generateNutritionPlan(input: GeneratorInput): GeneratedPlan {
  const seed = input.seed ?? 0;
  const n = Math.min(Math.max(Math.round(input.mealsCount) || 4, 2), 6);
  const slots = SLOT_SEQUENCES[n];

  const totalW = slots.reduce((acc, s) => acc + s.kcalWeight, 0);
  const used = new Set<string>();
  const mealItems: SolvedItem[][] = [];
  const mealVariants: SolvedItem[][][] = [];

  slots.forEach((slotDef, mi) => {
    const w = slotDef.kcalWeight / totalW;
    // Protein is spread flatter than kcal so every meal carries a useful dose.
    const pShare = 0.6 * w + 0.4 * (1 / n);
    const mealTargets: MealTargets = {
      p: input.protein * pShare,
      c: input.carbs * w,
      f: input.fat * w,
    };

    const cand = CANDIDATES[slotDef.slot];

    // Primary version: cross-meal dedup via the used set, coverage checks so
    // no source is picked whose portion cap can't reach its macro share.
    const protFood = pick(cand.protein, input.preference, seed + mi * 3, used, { macro: "protein", grams: mealTargets.p });
    const carbFood = pick(cand.carb, input.preference, seed + mi * 3, used, { macro: "carbs", grams: mealTargets.c });
    const fatFood = pick(cand.fat, input.preference, seed + mi * 3, used, { macro: "fat", grams: mealTargets.f });
    used.add(protFood.id);
    used.add(carbFood.id);

    const primary: ComboPick = { carb: carbFood, prot: protFood, fat: fatFood };
    mealItems.push(buildMealItems(primary, cand, mealTargets, seed + mi));

    // Alternative versions of the whole meal, solved on the same targets.
    // Build more combos than needed and keep the first ones that land on target.
    const combos = variantCombos(cand, input.preference, seed + mi * 3 + 1, VARIANTS_PER_MEAL * 3, `${carbFood.id}|${protFood.id}|${fatFood.id}`, mealTargets.p);
    const accepted: SolvedItem[][] = [];
    for (const combo of combos) {
      if (accepted.length >= VARIANTS_PER_MEAL) break;
      const items = buildMealItems(combo, cand, mealTargets, seed + mi + accepted.length + 1);
      if (mealWithinTolerance(items, mealTargets)) accepted.push(items);
    }
    mealVariants.push(accepted);
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

  const byRole = (items: SolvedItem[]) => items.slice().sort((a, b) => roleOrder(a.role) - roleOrder(b.role));

  const meals: Meal[] = slots.map((slotDef, mi) => ({
    id: uid(),
    name: slotDef.name,
    time: slotDef.time,
    items: byRole(mealItems[mi])
      .map((si, ii) => toMealItem(si, alternativesFor(si, slotDef.slot, input.preference, seed + mi + ii))),
    variants: mealVariants[mi].length > 0
      ? mealVariants[mi].map((items, vi): MealVariant => ({
          id: uid(),
          name: `Alternativa ${vi + 1}`,
          // Variant items carry no per-food substitutes: the variant IS the substitute.
          items: byRole(items).map((si) => toMealItem(si, [])),
        }))
      : undefined,
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
