// Visual guide images for exercises: start (0) and end (1) position photos.
// Source: free-exercise-db (github.com/yuhonas/free-exercise-db), Unlicense /
// public domain. Self-hosted as WebP under public/exercises/<id>/{0,1}.webp
// (CSP img-src only allows 'self').

// Library name (lib/exerciseLibrary.ts + cardio presets) -> image folder id
const IMAGE_IDS: Record<string, string> = {
  "Panca Piana con bilanciere": "Barbell_Bench_Press_-_Medium_Grip",
  "Panca Piana con manubri": "Dumbbell_Bench_Press",
  "Panca Inclinata con bilanciere": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Panca Inclinata con manubri": "Incline_Dumbbell_Press",
  "Panca Declinata con bilanciere": "Decline_Barbell_Bench_Press",
  "Chest Press": "Leverage_Chest_Press",
  "Chest Fly con manubri": "Dumbbell_Flyes",
  "Chest Fly Panca Inclinata": "Incline_Dumbbell_Flyes",
  "Croci ai Cavi": "Cable_Crossover",
  "Croci Cavi Bassi (Low-to-High)": "Low_Cable_Crossover",
  "Croci Cavi Alti (High-to-Low)": "Cable_Crossover",
  "Pec Deck / Butterfly": "Butterfly",
  "Push-Up": "Pushups",
  "Push-Up a diamante": "Push-Ups_-_Close_Triceps_Position",
  "Dips (parallele)": "Dips_-_Chest_Version",
  "Pull-over con manubrio": "Bent-Arm_Dumbbell_Pullover",
  "Stacco da terra con bilanciere": "Barbell_Deadlift",
  "Rematore con bilanciere": "Bent_Over_Barbell_Row",
  "Rematore Singolo con Manubrio": "One-Arm_Dumbbell_Row",
  "Rematore al Cavo Basso": "Seated_Cable_Rows",
  "Lat Machine Triangolo": "V-Bar_Pulldown",
  "Lat Machine Presa Larga": "Wide-Grip_Lat_Pulldown",
  "Lat Machine Presa Inversa": "Underhand_Cable_Pulldowns",
  "Pull-down al Cavo con Corda": "Rope_Straight-Arm_Pulldown",
  "Pull-down Cavo Alto con Doppia Corda": "Rope_Straight-Arm_Pulldown",
  "Pull-Up (Trazioni)": "Pullups",
  "Chin-Up (Trazioni inverse)": "Chin-Up",
  "Hyperextension": "Hyperextensions_Back_Extensions",
  "T-Bar Row": "T-Bar_Row_with_Handle",
  "Seated Row Machine": "Leverage_Iso_Row",
  "Face Pull al Cavo": "Face_Pull",
  "Squat con bilanciere": "Barbell_Squat",
  "Squat con manubri": "Dumbbell_Squat",
  "Front Squat": "Front_Barbell_Squat",
  "Squat al Multipower (Smith Machine)": "Smith_Machine_Squat",
  "Hack Squat": "Hack_Squat",
  "Leg Press 45°": "Leg_Press",
  "Pressa Orizzontale": "Leg_Press",
  "Leg Extension": "Leg_Extensions",
  "Affondi con bilanciere": "Barbell_Lunge",
  "Affondi con manubri": "Dumbbell_Lunges",
  "Affondi bulgari (Bulgarian Split Squat)": "Split_Squat_with_Dumbbells",
  "Step-Up con manubri": "Dumbbell_Step_Ups",
  "Box Jump": "Front_Box_Jump",
  "Sissy Squat": "Weighted_Sissy_Squat",
  "Leg Curl sdraiato": "Lying_Leg_Curls",
  "Leg Curl seduto": "Seated_Leg_Curl",
  "Stacco Rumeno con bilanciere": "Romanian_Deadlift",
  "Stacco Rumeno con manubri": "Stiff-Legged_Dumbbell_Deadlift",
  "Good Morning con bilanciere": "Good_Morning",
  "Nordic Curl": "Natural_Glute_Ham_Raise",
  "Leg Curl al cavo": "Standing_Leg_Curl",
  "Sumo Deadlift": "Sumo_Deadlift",
  "Hip Thrust con bilanciere": "Barbell_Hip_Thrust",
  "Hip Thrust al Multipower": "Smith_Machine_Hip_Raise",
  "Abductor Machine": "Thigh_Abductor",
  "Adductor Machine": "Thigh_Adductor",
  "Cable Kickback": "One-Legged_Cable_Kickback",
  "Donkey Kick": "Glute_Kickback",
  "Glute Bridge": "Barbell_Glute_Bridge",
  "Calf Raise in piedi": "Standing_Calf_Raises",
  "Calf Raise seduto": "Seated_Calf_Raise",
  "Calf Raise alla Leg Press": "Calf_Press_On_The_Leg_Press_Machine",
  "Calf Raise con bilanciere": "Standing_Barbell_Calf_Raise",
  "Military Press con bilanciere": "Standing_Military_Press",
  "Spinte Manubri Panca Inclinata a 30°": "Incline_Dumbbell_Press",
  "Spinte manubri in piedi": "Dumbbell_One-Arm_Shoulder_Press",
  "Spinte manubri seduto": "Dumbbell_Shoulder_Press",
  "Arnold Press": "Arnold_Dumbbell_Press",
  "Alzate laterali con manubri": "Side_Lateral_Raise",
  "Alzate laterali al cavo": "Cable_Seated_Lateral_Raise",
  "Alzate frontali con manubri": "Front_Dumbbell_Raise",
  "Alzate frontali con bilanciere": "Standing_Front_Barbell_Raise_Over_Head",
  "Lateral Raise Machine": "Seated_Side_Lateral_Raise",
  "Alzate posteriori con manubri (Reverse Fly)": "Reverse_Flyes",
  "Alzate posteriori al peck deck": "Reverse_Machine_Flyes",
  "Shoulder Press Machine": "Machine_Shoulder_Military_Press",
  "Upright Row con bilanciere": "Upright_Barbell_Row",
  "Curl con bilanciere": "Barbell_Curl",
  "Curl con bilanciere EZ": "EZ-Bar_Curl",
  "Curl manubri alternato": "Dumbbell_Alternate_Bicep_Curl",
  "Curl manubri simultaneo": "Dumbbell_Bicep_Curl",
  "Curl a martello (Hammer Curl)": "Hammer_Curls",
  "Curl con cavo basso": "Standing_Biceps_Cable_Curl",
  "Curl al cavo con corda": "Cable_Hammer_Curls_-_Rope_Attachment",
  "Curl concentrato": "Concentration_Curls",
  "Curl su panca Scott (Preacher Curl)": "Preacher_Curl",
  "Curl spider con bilanciere EZ": "Spider_Curl",
  "Curl ai cavi incrociati": "High_Cable_Curls",
  "Tricipiti al cavo con barra": "Triceps_Pushdown",
  "Tricipiti al cavo con corda": "Triceps_Pushdown_-_Rope_Attachment",
  "Tricipiti al cavo presa inversa": "Reverse_Grip_Triceps_Pushdown",
  "French Press con bilanciere": "Lying_Triceps_Press",
  "French Press con manubrio": "Standing_Dumbbell_Triceps_Extension",
  "Skull Crusher": "EZ-Bar_Skullcrusher",
  "Kick-Back con manubrio": "Tricep_Dumbbell_Kickback",
  "Dips ai paralleli (tricipiti)": "Dips_-_Triceps_Version",
  "Close Grip Bench Press": "Close-Grip_Barbell_Bench_Press",
  "Overhead Triceps Extension al cavo": "Cable_Rope_Overhead_Triceps_Extension",
  "Wrist Curl con bilanciere": "Seated_Palm-Up_Barbell_Wrist_Curl",
  "Reverse Curl con bilanciere": "Reverse_Barbell_Curl",
  "Reverse Curl con manubri": "Standing_Dumbbell_Reverse_Curl",
  "Zottman Curl": "Dumbbell_Bicep_Curl",
  "Farmer's Walk": "Farmers_Walk",
  "Plate Pinch": "Plate_Pinch",
  "Crunch classico": "Crunches",
  "Crunch al cavo": "Cable_Crunch",
  "Plank": "Plank",
  "Side Plank": "Side_Bridge",
  "Leg Raise": "Flat_Bench_Lying_Leg_Raise",
  "Hanging Leg Raise": "Hanging_Leg_Raise",
  "Russian Twist": "Russian_Twist",
  "Ab Wheel Rollout": "Ab_Roller",
  "Dead Bug": "Dead_Bug",
  "Mountain Climber": "Mountain_Climbers",
  "Pallof Press": "Pallof_Press",
  "Vacuum addominale": "Stomach_Vacuum",
  "Clean and Jerk": "Clean_and_Jerk",
  "Power Clean": "Power_Clean",
  "Snatch": "Snatch",
  "Kettlebell Swing": "One-Arm_Kettlebell_Swings",
  "Turkish Get-Up": "Kettlebell_Turkish_Get-Up_Lunge_style",
  "Thruster": "Kettlebell_Thruster",
  "Battle Rope": "Battling_Ropes",
  "Sled Push": "Sled_Push",
  "Trap Bar Deadlift": "Trap_Bar_Deadlift",
  "Tapis roulant": "Jogging_Treadmill",
  "Camminata inclinata": "Walking_Treadmill",
  "Cyclette": "Bicycling_Stationary",
  "Ellittica": "Elliptical_Trainer",
  "Vogatore": "Rowing_Stationary",
  "Stair climber": "Stairmaster",
  "Corsa all'aperto": "Running_Treadmill",
  "Assault bike": "Bicycling_Stationary",
  "Corda": "Rope_Jumping",
};

// Common Italian gym names that are not in the library (same image folders).
const ALIAS_IDS: Record<string, string> = {
  "Croci con manubri": "Dumbbell_Flyes",
  "Croci manubri panca piana": "Dumbbell_Flyes",
  "Croci manubri panca inclinata": "Incline_Dumbbell_Flyes",
  "Croci ai cavi dal basso": "Low_Cable_Crossover",
  "Distensioni manubri panca piana": "Dumbbell_Bench_Press",
  "Distensioni manubri panca inclinata": "Incline_Dumbbell_Press",
  "Distensioni bilanciere panca piana": "Barbell_Bench_Press_-_Medium_Grip",
  "Distensioni bilanciere panca inclinata": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Panca piana presa stretta": "Close-Grip_Barbell_Bench_Press",
  "Lento avanti con bilanciere": "Standing_Military_Press",
  "Lento avanti con manubri": "Dumbbell_Shoulder_Press",
  "Military Press con manubri": "Dumbbell_Shoulder_Press",
  "Shoulder Press con manubri": "Dumbbell_Shoulder_Press",
  "Spinte sopra la testa con manubri": "Dumbbell_Shoulder_Press",
  "Tirate al mento con bilanciere": "Upright_Barbell_Row",
  "Rematore con manubrio": "One-Arm_Dumbbell_Row",
  "Rematore con manubri": "One-Arm_Dumbbell_Row",
  "Pulley basso": "Seated_Cable_Rows",
  "Lat Machine avanti": "Wide-Grip_Lat_Pulldown",
  "Trazioni alla sbarra": "Pullups",
  "Trazioni presa supina": "Chin-Up",
  "Trazioni presa inversa": "Chin-Up",
  "Stacco a gambe tese con manubri": "Stiff-Legged_Dumbbell_Deadlift",
  "Stacco a gambe tese": "Romanian_Deadlift",
  "Stacco sumo": "Sumo_Deadlift",
  "Goblet Squat": "Dumbbell_Squat",
  "Squat bulgaro": "Split_Squat_with_Dumbbells",
  "Affondi camminati con manubri": "Dumbbell_Lunges",
  "Ponte glutei": "Barbell_Glute_Bridge",
  "Slanci al cavo": "One-Legged_Cable_Kickback",
  "Curl con manubri": "Dumbbell_Bicep_Curl",
  "Curl manubri panca inclinata": "Dumbbell_Bicep_Curl",
  "Curl al cavo": "Standing_Biceps_Cable_Curl",
  "Hammer Curl al cavo": "Cable_Hammer_Curls_-_Rope_Attachment",
  "Push down con corda": "Triceps_Pushdown_-_Rope_Attachment",
  "Push down con barra": "Triceps_Pushdown",
  "Estensioni tricipiti sopra la testa con manubrio": "Standing_Dumbbell_Triceps_Extension",
  "Estensioni tricipiti al cavo con corda": "Triceps_Pushdown_-_Rope_Attachment",
  "Piegamenti sulle braccia": "Pushups",
  "Piegamenti presa stretta": "Push-Ups_-_Close_Triceps_Position",
  "Sollevamento gambe alla sbarra": "Hanging_Leg_Raise",
  "Sollevamento gambe a terra": "Flat_Bench_Lying_Leg_Raise",
  "Plank laterale": "Side_Bridge",
  "Salto con la corda": "Rope_Jumping",
};

// Keyword fallbacks for free-text names typed by the trainer (checked in order,
// first match wins). Movement words come first; bench/position words last, so
// "Curl su panca inclinata" is a curl, not an incline press.
const KEYWORD_IDS: Array<[string, string]> = [
  ["stacco rumeno", "Romanian_Deadlift"],
  ["stacco sumo", "Sumo_Deadlift"],
  ["sumo", "Sumo_Deadlift"],
  ["stacco", "Barbell_Deadlift"],
  ["deadlift", "Barbell_Deadlift"],
  ["rematore", "Bent_Over_Barbell_Row"],
  ["pulley", "Seated_Cable_Rows"],
  ["lat machine", "Wide-Grip_Lat_Pulldown"],
  ["lat pulldown", "Wide-Grip_Lat_Pulldown"],
  ["trazioni", "Pullups"],
  ["pull up", "Pullups"],
  ["chin up", "Chin-Up"],
  ["face pull", "Face_Pull"],
  ["front squat", "Front_Barbell_Squat"],
  ["hack squat", "Hack_Squat"],
  ["goblet", "Dumbbell_Squat"],
  ["bulgar", "Split_Squat_with_Dumbbells"],
  ["affondi", "Dumbbell_Lunges"],
  ["lunge", "Dumbbell_Lunges"],
  ["leg press", "Leg_Press"],
  ["pressa", "Leg_Press"],
  ["leg extension", "Leg_Extensions"],
  ["leg curl", "Lying_Leg_Curls"],
  ["squat", "Barbell_Squat"],
  ["hip thrust", "Barbell_Hip_Thrust"],
  ["ponte glutei", "Barbell_Glute_Bridge"],
  ["glute bridge", "Barbell_Glute_Bridge"],
  ["abductor", "Thigh_Abductor"],
  ["abduttori", "Thigh_Abductor"],
  ["adductor", "Thigh_Adductor"],
  ["adduttori", "Thigh_Adductor"],
  ["calf", "Standing_Calf_Raises"],
  ["polpacci", "Standing_Calf_Raises"],
  ["military", "Standing_Military_Press"],
  ["lento avanti", "Standing_Military_Press"],
  ["shoulder press", "Dumbbell_Shoulder_Press"],
  ["arnold", "Arnold_Dumbbell_Press"],
  ["alzate laterali", "Side_Lateral_Raise"],
  ["alzate frontali", "Front_Dumbbell_Raise"],
  ["alzate posteriori", "Reverse_Flyes"],
  ["tirate al mento", "Upright_Barbell_Row"],
  ["pullover", "Bent-Arm_Dumbbell_Pullover"],
  ["pull over", "Bent-Arm_Dumbbell_Pullover"],
  ["croci", "Dumbbell_Flyes"],
  ["chest fly", "Dumbbell_Flyes"],
  ["pec deck", "Butterfly"],
  ["chest press", "Leverage_Chest_Press"],
  ["hammer curl", "Hammer_Curls"],
  ["curl hammer", "Hammer_Curls"],
  ["martello", "Hammer_Curls"],
  ["scott", "Preacher_Curl"],
  ["wrist curl", "Seated_Palm-Up_Barbell_Wrist_Curl"],
  ["curl", "Barbell_Curl"],
  ["push down", "Triceps_Pushdown"],
  ["pushdown", "Triceps_Pushdown"],
  ["french press", "Lying_Triceps_Press"],
  ["skull", "EZ-Bar_Skullcrusher"],
  ["kick back", "Tricep_Dumbbell_Kickback"],
  ["dips", "Dips_-_Triceps_Version"],
  ["piegamenti", "Pushups"],
  ["push up", "Pushups"],
  ["crunch", "Crunches"],
  ["plank", "Plank"],
  ["sit up", "Crunches"],
  ["panca inclinata", "Incline_Dumbbell_Press"],
  ["panca declinata", "Decline_Barbell_Bench_Press"],
  ["panca piana", "Barbell_Bench_Press_-_Medium_Grip"],
  ["bench press", "Barbell_Bench_Press_-_Medium_Grip"],
  ["distensioni", "Barbell_Bench_Press_-_Medium_Grip"],
  ["tapis", "Jogging_Treadmill"],
  ["treadmill", "Jogging_Treadmill"],
  ["bike", "Bicycling_Stationary"],
  ["cyclette", "Bicycling_Stationary"],
  ["spinning", "Bicycling_Stationary"],
  ["ellittic", "Elliptical_Trainer"],
  ["vogatore", "Rowing_Stationary"],
  ["rower", "Rowing_Stationary"],
  ["stair", "Stairmaster"],
  ["salto con la corda", "Rope_Jumping"],
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

// Words that carry no meaning for matching, and singular/plural equivalents.
const STOPWORDS = new Set(["con", "al", "alla", "alle", "allo", "ai", "agli", "a", "di", "del", "della", "su", "sul", "sulla", "in", "il", "la", "le", "lo", "i", "da", "dal", "e", "per"]);
const SYNONYMS: Record<string, string> = {
  manubrio: "manubri", cavo: "cavi", cavetto: "cavi", corde: "corda", parallele: "paralleli",
  seduta: "seduto", sdraiata: "sdraiato", bilancere: "bilanciere", multipower: "multipower", smith: "multipower",
};

function tokens(normalized: string): string[] {
  return normalized.split(" ").filter((t) => t && !STOPWORDS.has(t)).map((t) => SYNONYMS[t] ?? t);
}

const NORMALIZED = Object.entries({ ...IMAGE_IDS, ...ALIAS_IDS }).map(([k, v]) => {
  const n = normalize(k);
  return { name: n, id: v, tokens: tokens(n) };
});

/** Every image folder referenced by the mappings (used by tests). */
export const ALL_IMAGE_IDS: string[] = [...new Set([
  ...Object.values(IMAGE_IDS), ...Object.values(ALIAS_IDS), ...KEYWORD_IDS.map(([, id]) => id),
])];

/** Image folder id for an exercise name, or null when no reliable match exists. */
export function getExerciseImageId(name: string): string | null {
  const n = normalize(name);
  if (!n) return null;
  const exact = NORMALIZED.find((e) => e.name === n);
  if (exact) return exact.id;
  // Longest library name the typed one starts with ("Panca Piana con bilanciere - fermo al petto")
  const padded = ` ${n} `;
  const byLength = [...NORMALIZED].sort((a, b) => b.name.length - a.name.length);
  const prefix = byLength.find((e) => e.name.length >= 8 && padded.startsWith(` ${e.name} `));
  if (prefix) return prefix.id;
  // Same words in a different order or without prepositions ("Panca piana
  // manubri", "Rematore manubrio"): the movement (first word) must match and at
  // least two words must be shared; fewer unmatched library words wins.
  const typed = tokens(n);
  if (typed.length >= 2) {
    let best: { id: string; shared: number; extra: number } | null = null;
    for (const e of NORMALIZED) {
      if (!e.tokens.includes(typed[0])) continue;
      const shared = e.tokens.filter((t) => typed.includes(t)).length;
      if (shared < 2) continue;
      const extra = e.tokens.length - shared;
      if (!best || shared > best.shared || (shared === best.shared && extra < best.extra)) best = { id: e.id, shared, extra };
    }
    if (best) return best.id;
  }
  // Library name appearing later in the typed one ("Superset: hack squat lento")
  const contained = byLength.find((e) => e.name.length >= 8 && padded.includes(` ${e.name} `));
  if (contained) return contained.id;
  // Keywords match on word starts only ("croci" must not match "incrociati")
  const kw = KEYWORD_IDS.find(([k]) => padded.includes(` ${k}`));
  return kw ? kw[1] : null;
}

/** [start, end] position image URLs, or null. */
export function getExerciseImages(name: string): [string, string] | null {
  const id = getExerciseImageId(name);
  return id ? [`/exercises/${id}/0.webp`, `/exercises/${id}/1.webp`] : null;
}
