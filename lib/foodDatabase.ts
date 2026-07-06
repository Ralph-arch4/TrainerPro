// ─── Italian food database ─────────────────────────────────────────────────
// Macros are per 100 g (raw weight where applicable). kcal is always derived
// from macros (4/4/9) so generated plans stay internally consistent.

export type FoodCategory = "carb" | "protein" | "fat" | "veg" | "fruit";
export type MealSlot = "colazione" | "spuntino" | "pranzo" | "cena";

export interface Food {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  per100: { protein: number; carbs: number; fat: number };
  slots: MealSlot[];
  meat?: boolean;
  fish?: boolean;
  step?: number;     // gram rounding step (default 5)
  maxGrams?: number; // realistic single-portion cap
  unitNote?: string; // e.g. "peso a crudo"
}

const CRUDO = "peso a crudo";

export const FOODS: Food[] = [
  // ── Carb sources ──
  { id: "pasta-barilla", name: "Pasta di semola", brand: "Barilla", category: "carb", per100: { protein: 12.5, carbs: 70.4, fat: 2 }, slots: ["pranzo", "cena"], maxGrams: 200, unitNote: CRUDO },
  { id: "pasta-integrale", name: "Pasta integrale", brand: "Barilla", category: "carb", per100: { protein: 13.5, carbs: 64.5, fat: 2.5 }, slots: ["pranzo", "cena"], maxGrams: 200, unitNote: CRUDO },
  { id: "riso-basmati", name: "Riso basmati", category: "carb", per100: { protein: 8.1, carbs: 77.5, fat: 0.6 }, slots: ["pranzo", "cena"], maxGrams: 180, unitNote: CRUDO },
  { id: "riso-bianco", name: "Riso bianco", category: "carb", per100: { protein: 6.7, carbs: 80.4, fat: 0.4 }, slots: ["pranzo", "cena"], maxGrams: 180, unitNote: CRUDO },
  { id: "riso-venere", name: "Riso venere", category: "carb", per100: { protein: 9, carbs: 72, fat: 2 }, slots: ["pranzo", "cena"], maxGrams: 180, unitNote: CRUDO },
  { id: "farro", name: "Farro perlato", category: "carb", per100: { protein: 15.1, carbs: 67.1, fat: 2.5 }, slots: ["pranzo", "cena"], maxGrams: 180, unitNote: CRUDO },
  { id: "quinoa", name: "Quinoa", category: "carb", per100: { protein: 14.1, carbs: 64.2, fat: 6.1 }, slots: ["pranzo", "cena"], maxGrams: 180, unitNote: CRUDO },
  { id: "couscous", name: "Cous cous", category: "carb", per100: { protein: 12.5, carbs: 72.6, fat: 0.6 }, slots: ["pranzo", "cena"], maxGrams: 180, unitNote: CRUDO },
  { id: "patate", name: "Patate", category: "carb", per100: { protein: 2.1, carbs: 17.9, fat: 0.1 }, slots: ["pranzo", "cena"], step: 10, maxGrams: 600 },
  { id: "patate-dolci", name: "Patate dolci", category: "carb", per100: { protein: 1.6, carbs: 20.1, fat: 0.1 }, slots: ["pranzo", "cena"], step: 10, maxGrams: 600 },
  { id: "pane-integrale", name: "Pane integrale", category: "carb", per100: { protein: 7.5, carbs: 48.5, fat: 1.3 }, slots: ["colazione", "spuntino", "pranzo", "cena"], maxGrams: 250 },
  { id: "pane-segale", name: "Pane di segale", category: "carb", per100: { protein: 8.3, carbs: 45.4, fat: 1.7 }, slots: ["colazione", "spuntino", "pranzo", "cena"], maxGrams: 250 },
  { id: "fiocchi-avena", name: "Fiocchi d'avena", category: "carb", per100: { protein: 13, carbs: 58.7, fat: 7 }, slots: ["colazione"], maxGrams: 150 },
  { id: "fette-biscottate", name: "Fette biscottate integrali", category: "carb", per100: { protein: 11, carbs: 72, fat: 6 }, slots: ["colazione"], maxGrams: 100, unitNote: "1 fetta ≈ 9 g" },
  { id: "gallette-riso", name: "Gallette di riso", category: "carb", per100: { protein: 7.5, carbs: 81.5, fat: 0.9 }, slots: ["colazione", "spuntino"], maxGrams: 80, unitNote: "1 galletta ≈ 8 g" },
  { id: "miele", name: "Miele", category: "carb", per100: { protein: 0.6, carbs: 80.3, fat: 0 }, slots: ["colazione"], maxGrams: 40 },
  { id: "marmellata", name: "Marmellata", category: "carb", per100: { protein: 0.5, carbs: 58, fat: 0.2 }, slots: ["colazione", "spuntino"], maxGrams: 60 },

  // ── Fruit ──
  { id: "banana", name: "Banana", category: "fruit", per100: { protein: 1.1, carbs: 22.8, fat: 0.3 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 300, unitNote: "1 banana media ≈ 120 g" },
  { id: "mela", name: "Mela", category: "fruit", per100: { protein: 0.3, carbs: 13.8, fat: 0.1 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 350, unitNote: "1 mela media ≈ 180 g" },
  { id: "pera", name: "Pera", category: "fruit", per100: { protein: 0.4, carbs: 15.2, fat: 0.1 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 350 },
  { id: "arancia", name: "Arancia", category: "fruit", per100: { protein: 0.9, carbs: 11.8, fat: 0.2 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 350 },
  { id: "kiwi", name: "Kiwi", category: "fruit", per100: { protein: 1.1, carbs: 14.7, fat: 0.5 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 300 },
  { id: "frutti-bosco", name: "Frutti di bosco", category: "fruit", per100: { protein: 1, carbs: 9.7, fat: 0.4 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 300 },

  // ── Protein sources ──
  { id: "petto-pollo", name: "Petto di pollo", category: "protein", per100: { protein: 23.3, carbs: 0, fat: 0.8 }, slots: ["pranzo", "cena"], meat: true, maxGrams: 350, unitNote: CRUDO },
  { id: "fesa-tacchino", name: "Fesa di tacchino", category: "protein", per100: { protein: 24, carbs: 0, fat: 1.2 }, slots: ["pranzo", "cena"], meat: true, maxGrams: 350, unitNote: CRUDO },
  { id: "manzo-magro", name: "Manzo magro (girello)", category: "protein", per100: { protein: 21.8, carbs: 0, fat: 5 }, slots: ["pranzo", "cena"], meat: true, maxGrams: 300, unitNote: CRUDO },
  { id: "vitello", name: "Vitello magro", category: "protein", per100: { protein: 20.7, carbs: 0, fat: 2.7 }, slots: ["pranzo", "cena"], meat: true, maxGrams: 300, unitNote: CRUDO },
  { id: "lonza-maiale", name: "Lonza di maiale", category: "protein", per100: { protein: 20.5, carbs: 0, fat: 6.3 }, slots: ["pranzo", "cena"], meat: true, maxGrams: 300, unitNote: CRUDO },
  { id: "bresaola", name: "Bresaola", category: "protein", per100: { protein: 32, carbs: 0.4, fat: 2.6 }, slots: ["spuntino", "pranzo", "cena"], meat: true, maxGrams: 150 },
  { id: "prosciutto-crudo", name: "Prosciutto crudo sgrassato", category: "protein", per100: { protein: 26.9, carbs: 0, fat: 7.8 }, slots: ["spuntino", "pranzo", "cena"], meat: true, maxGrams: 150 },
  { id: "tonno-naturale", name: "Tonno al naturale", category: "protein", per100: { protein: 25, carbs: 0, fat: 1 }, slots: ["spuntino", "pranzo", "cena"], fish: true, maxGrams: 250, unitNote: "peso sgocciolato" },
  { id: "merluzzo", name: "Merluzzo / Nasello", category: "protein", per100: { protein: 17, carbs: 0.3, fat: 0.3 }, slots: ["pranzo", "cena"], fish: true, maxGrams: 400, unitNote: CRUDO },
  { id: "orata", name: "Orata", category: "protein", per100: { protein: 20.7, carbs: 0.7, fat: 3.8 }, slots: ["pranzo", "cena"], fish: true, maxGrams: 350, unitNote: CRUDO },
  { id: "branzino", name: "Branzino", category: "protein", per100: { protein: 16.5, carbs: 0.6, fat: 2.5 }, slots: ["pranzo", "cena"], fish: true, maxGrams: 400, unitNote: CRUDO },
  { id: "salmone", name: "Salmone fresco", category: "protein", per100: { protein: 20, carbs: 0, fat: 13 }, slots: ["pranzo", "cena"], fish: true, maxGrams: 250, unitNote: CRUDO },
  { id: "gamberi", name: "Gamberi", category: "protein", per100: { protein: 18, carbs: 0.5, fat: 0.8 }, slots: ["pranzo", "cena"], fish: true, maxGrams: 300, unitNote: CRUDO },
  { id: "uova", name: "Uova intere", category: "protein", per100: { protein: 12.4, carbs: 0.5, fat: 8.7 }, slots: ["colazione", "pranzo", "cena"], step: 10, maxGrams: 240, unitNote: "1 uovo ≈ 60 g" },
  { id: "albume", name: "Albume d'uovo", category: "protein", per100: { protein: 10.7, carbs: 0.7, fat: 0.2 }, slots: ["colazione", "pranzo", "cena"], step: 10, maxGrams: 400 },
  { id: "yogurt-greco", name: "Yogurt greco 0%", brand: "Fage", category: "protein", per100: { protein: 10.3, carbs: 4, fat: 0.2 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 350 },
  { id: "skyr", name: "Skyr", category: "protein", per100: { protein: 11, carbs: 4, fat: 0.2 }, slots: ["colazione", "spuntino"], step: 10, maxGrams: 350 },
  { id: "whey", name: "Proteine whey (polvere)", category: "protein", per100: { protein: 78, carbs: 6, fat: 6 }, slots: ["colazione", "spuntino"], step: 1, maxGrams: 60 },
  { id: "ricotta", name: "Ricotta vaccina", category: "protein", per100: { protein: 8.8, carbs: 3.5, fat: 10.9 }, slots: ["colazione", "spuntino", "cena"], maxGrams: 250 },
  { id: "fiocchi-latte", name: "Fiocchi di latte", category: "protein", per100: { protein: 12.3, carbs: 3.2, fat: 4.3 }, slots: ["colazione", "spuntino", "cena"], maxGrams: 300 },
  { id: "latte-ps", name: "Latte parzialmente scremato", category: "protein", per100: { protein: 3.5, carbs: 5, fat: 1.6 }, slots: ["colazione"], step: 10, maxGrams: 400, unitNote: "100 ml ≈ 100 g" },
  { id: "tofu", name: "Tofu", category: "protein", per100: { protein: 12, carbs: 1.5, fat: 7.5 }, slots: ["pranzo", "cena"], maxGrams: 300 },
  { id: "seitan", name: "Seitan", category: "protein", per100: { protein: 24, carbs: 3.5, fat: 1.5 }, slots: ["pranzo", "cena"], maxGrams: 250 },
  { id: "lenticchie", name: "Lenticchie secche", category: "protein", per100: { protein: 23, carbs: 51, fat: 1.3 }, slots: ["pranzo", "cena"], maxGrams: 150, unitNote: CRUDO },
  { id: "ceci", name: "Ceci secchi", category: "protein", per100: { protein: 19.3, carbs: 47, fat: 6.3 }, slots: ["pranzo", "cena"], maxGrams: 150, unitNote: CRUDO },
  { id: "fagioli", name: "Fagioli borlotti secchi", category: "protein", per100: { protein: 20.2, carbs: 47.7, fat: 2 }, slots: ["pranzo", "cena"], maxGrams: 150, unitNote: CRUDO },

  // ── Fat sources ──
  { id: "olio-evo", name: "Olio extravergine d'oliva", category: "fat", per100: { protein: 0, carbs: 0, fat: 100 }, slots: ["pranzo", "cena"], step: 1, maxGrams: 60, unitNote: "1 cucchiaio ≈ 10 g" },
  { id: "mandorle", name: "Mandorle", category: "fat", per100: { protein: 22, carbs: 4.6, fat: 55.3 }, slots: ["colazione", "spuntino"], step: 1, maxGrams: 60 },
  { id: "noci", name: "Noci", category: "fat", per100: { protein: 14.3, carbs: 5.1, fat: 63 }, slots: ["colazione", "spuntino", "cena"], step: 1, maxGrams: 60, unitNote: "1 noce ≈ 5 g" },
  { id: "nocciole", name: "Nocciole", category: "fat", per100: { protein: 13.8, carbs: 6.1, fat: 64.1 }, slots: ["colazione", "spuntino"], step: 1, maxGrams: 60 },
  { id: "burro-arachidi", name: "Burro d'arachidi", category: "fat", per100: { protein: 25, carbs: 11.6, fat: 50 }, slots: ["colazione", "spuntino"], step: 1, maxGrams: 50 },
  { id: "avocado", name: "Avocado", category: "fat", per100: { protein: 1.9, carbs: 1.8, fat: 23 }, slots: ["pranzo", "cena", "colazione"], step: 5, maxGrams: 150 },
  { id: "cioccolato-fondente", name: "Cioccolato fondente 85%", category: "fat", per100: { protein: 9.8, carbs: 22.4, fat: 46 }, slots: ["colazione", "spuntino"], step: 1, maxGrams: 40 },
  { id: "parmigiano", name: "Parmigiano Reggiano", category: "fat", per100: { protein: 32.4, carbs: 0, fat: 29.7 }, slots: ["spuntino", "pranzo", "cena"], step: 1, maxGrams: 50 },
  { id: "semi-chia", name: "Semi di chia", category: "fat", per100: { protein: 16.5, carbs: 7.7, fat: 30.7 }, slots: ["colazione", "spuntino"], step: 1, maxGrams: 40 },

  // ── Vegetables ──
  { id: "zucchine", name: "Zucchine", category: "veg", per100: { protein: 1.3, carbs: 1.4, fat: 0.1 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "broccoli", name: "Broccoli", category: "veg", per100: { protein: 3, carbs: 3.1, fat: 0.4 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "spinaci", name: "Spinaci", category: "veg", per100: { protein: 3.4, carbs: 2.9, fat: 0.7 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "insalata-mista", name: "Insalata mista", category: "veg", per100: { protein: 1.5, carbs: 2.5, fat: 0.3 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 300 },
  { id: "pomodori", name: "Pomodori", category: "veg", per100: { protein: 1, carbs: 3.5, fat: 0.2 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "peperoni", name: "Peperoni", category: "veg", per100: { protein: 0.9, carbs: 4.2, fat: 0.3 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "fagiolini", name: "Fagiolini", category: "veg", per100: { protein: 2.1, carbs: 2.4, fat: 0.1 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "asparagi", name: "Asparagi", category: "veg", per100: { protein: 3, carbs: 3.3, fat: 0.2 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "melanzane", name: "Melanzane", category: "veg", per100: { protein: 1.1, carbs: 2.6, fat: 0.4 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
  { id: "cetrioli", name: "Cetrioli", category: "veg", per100: { protein: 0.7, carbs: 1.8, fat: 0.5 }, slots: ["pranzo", "cena"], step: 50, maxGrams: 400 },
];

const FOOD_MAP = new Map(FOODS.map((f) => [f.id, f]));

export function getFood(id: string): Food | undefined {
  return FOOD_MAP.get(id);
}

export function displayName(food: Food): string {
  return food.brand ? `${food.name} ${food.brand}` : food.name;
}

export function macrosFor(food: Food, grams: number) {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const protein = r1((food.per100.protein * grams) / 100);
  const carbs = r1((food.per100.carbs * grams) / 100);
  const fat = r1((food.per100.fat * grams) / 100);
  return { protein, carbs, fat, calories: Math.round(protein * 4 + carbs * 4 + fat * 9) };
}

export function searchFoods(query: string, limit = 6): Food[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts: Food[] = [];
  const contains: Food[] = [];
  for (const f of FOODS) {
    const label = displayName(f).toLowerCase();
    if (label.startsWith(q)) starts.push(f);
    else if (label.includes(q)) contains.push(f);
  }
  return [...starts, ...contains].slice(0, limit);
}
