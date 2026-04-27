export interface LibraryExercise {
  name: string;
  muscleGroup: string;
  equipment?: string;
  pattern?: string; // push, pull, hinge, squat, carry, core
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ── PETTO ──────────────────────────────────────────────────────────────────
  { name: "Panca Piana con bilanciere", muscleGroup: "Petto", equipment: "Bilanciere", pattern: "push" },
  { name: "Panca Piana con manubri", muscleGroup: "Petto", equipment: "Manubri", pattern: "push" },
  { name: "Panca Inclinata con bilanciere", muscleGroup: "Petto", equipment: "Bilanciere", pattern: "push" },
  { name: "Panca Inclinata con manubri", muscleGroup: "Petto", equipment: "Manubri", pattern: "push" },
  { name: "Panca Declinata con bilanciere", muscleGroup: "Petto", equipment: "Bilanciere", pattern: "push" },
  { name: "Chest Press", muscleGroup: "Petto", equipment: "Macchina", pattern: "push" },
  { name: "Chest Fly con manubri", muscleGroup: "Petto", equipment: "Manubri", pattern: "push" },
  { name: "Chest Fly Panca Inclinata", muscleGroup: "Petto", equipment: "Manubri", pattern: "push" },
  { name: "Croci ai Cavi", muscleGroup: "Petto", equipment: "Cavo", pattern: "push" },
  { name: "Croci Cavi Bassi (Low-to-High)", muscleGroup: "Petto", equipment: "Cavo", pattern: "push" },
  { name: "Croci Cavi Alti (High-to-Low)", muscleGroup: "Petto", equipment: "Cavo", pattern: "push" },
  { name: "Pec Deck / Butterfly", muscleGroup: "Petto", equipment: "Macchina", pattern: "push" },
  { name: "Push-Up", muscleGroup: "Petto", equipment: "Corpo libero", pattern: "push" },
  { name: "Push-Up a diamante", muscleGroup: "Petto", equipment: "Corpo libero", pattern: "push" },
  { name: "Dips (parallele)", muscleGroup: "Petto", equipment: "Corpo libero", pattern: "push" },
  { name: "Pull-over con manubrio", muscleGroup: "Petto", equipment: "Manubri", pattern: "pull" },

  // ── SCHIENA ────────────────────────────────────────────────────────────────
  { name: "Stacco da terra con bilanciere", muscleGroup: "Schiena", equipment: "Bilanciere", pattern: "hinge" },
  { name: "Rematore con bilanciere", muscleGroup: "Schiena", equipment: "Bilanciere", pattern: "pull" },
  { name: "Rematore Singolo con Manubrio", muscleGroup: "Schiena", equipment: "Manubri", pattern: "pull" },
  { name: "Rematore al Cavo Basso", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },
  { name: "Lat Machine Triangolo", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },
  { name: "Lat Machine Presa Larga", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },
  { name: "Lat Machine Presa Inversa", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },
  { name: "Pull-down al Cavo con Corda", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },
  { name: "Pull-down Cavo Alto con Doppia Corda", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },
  { name: "Pull-Up (Trazioni)", muscleGroup: "Schiena", equipment: "Corpo libero", pattern: "pull" },
  { name: "Chin-Up (Trazioni inverse)", muscleGroup: "Schiena", equipment: "Corpo libero", pattern: "pull" },
  { name: "Hyperextension", muscleGroup: "Schiena", equipment: "Corpo libero", pattern: "hinge" },
  { name: "T-Bar Row", muscleGroup: "Schiena", equipment: "Bilanciere", pattern: "pull" },
  { name: "Seated Row Machine", muscleGroup: "Schiena", equipment: "Macchina", pattern: "pull" },
  { name: "Face Pull al Cavo", muscleGroup: "Schiena", equipment: "Cavo", pattern: "pull" },

  // ── QUADRICIPITI ───────────────────────────────────────────────────────────
  { name: "Squat con bilanciere", muscleGroup: "Quadricipiti", equipment: "Bilanciere", pattern: "squat" },
  { name: "Squat con manubri", muscleGroup: "Quadricipiti", equipment: "Manubri", pattern: "squat" },
  { name: "Front Squat", muscleGroup: "Quadricipiti", equipment: "Bilanciere", pattern: "squat" },
  { name: "Squat al Multipower (Smith Machine)", muscleGroup: "Quadricipiti", equipment: "Macchina", pattern: "squat" },
  { name: "Hack Squat", muscleGroup: "Quadricipiti", equipment: "Macchina", pattern: "squat" },
  { name: "Leg Press 45°", muscleGroup: "Quadricipiti", equipment: "Macchina", pattern: "squat" },
  { name: "Pressa Orizzontale", muscleGroup: "Quadricipiti", equipment: "Macchina", pattern: "squat" },
  { name: "Leg Extension", muscleGroup: "Quadricipiti", equipment: "Macchina", pattern: "squat" },
  { name: "Affondi con bilanciere", muscleGroup: "Quadricipiti", equipment: "Bilanciere", pattern: "squat" },
  { name: "Affondi con manubri", muscleGroup: "Quadricipiti", equipment: "Manubri", pattern: "squat" },
  { name: "Affondi bulgari (Bulgarian Split Squat)", muscleGroup: "Quadricipiti", equipment: "Manubri", pattern: "squat" },
  { name: "Step-Up con manubri", muscleGroup: "Quadricipiti", equipment: "Manubri", pattern: "squat" },
  { name: "Box Jump", muscleGroup: "Quadricipiti", equipment: "Corpo libero", pattern: "squat" },
  { name: "Sissy Squat", muscleGroup: "Quadricipiti", equipment: "Corpo libero", pattern: "squat" },
  { name: "Wall Sit", muscleGroup: "Quadricipiti", equipment: "Corpo libero", pattern: "squat" },

  // ── FEMORALI ───────────────────────────────────────────────────────────────
  { name: "Leg Curl sdraiato", muscleGroup: "Femorali", equipment: "Macchina", pattern: "hinge" },
  { name: "Leg Curl seduto", muscleGroup: "Femorali", equipment: "Macchina", pattern: "hinge" },
  { name: "Stacco Rumeno con bilanciere", muscleGroup: "Femorali", equipment: "Bilanciere", pattern: "hinge" },
  { name: "Stacco Rumeno con manubri", muscleGroup: "Femorali", equipment: "Manubri", pattern: "hinge" },
  { name: "Good Morning con bilanciere", muscleGroup: "Femorali", equipment: "Bilanciere", pattern: "hinge" },
  { name: "Nordic Curl", muscleGroup: "Femorali", equipment: "Corpo libero", pattern: "hinge" },
  { name: "Leg Curl al cavo", muscleGroup: "Femorali", equipment: "Cavo", pattern: "hinge" },
  { name: "Sumo Deadlift", muscleGroup: "Femorali", equipment: "Bilanciere", pattern: "hinge" },

  // ── GLUTEI ─────────────────────────────────────────────────────────────────
  { name: "Hip Thrust con bilanciere", muscleGroup: "Glutei", equipment: "Bilanciere", pattern: "hinge" },
  { name: "Hip Thrust al Multipower", muscleGroup: "Glutei", equipment: "Macchina", pattern: "hinge" },
  { name: "Abductor Machine", muscleGroup: "Glutei", equipment: "Macchina", pattern: "core" },
  { name: "Adductor Machine", muscleGroup: "Glutei", equipment: "Macchina", pattern: "core" },
  { name: "Cable Kickback", muscleGroup: "Glutei", equipment: "Cavo", pattern: "hinge" },
  { name: "Donkey Kick", muscleGroup: "Glutei", equipment: "Corpo libero", pattern: "hinge" },
  { name: "Glute Bridge", muscleGroup: "Glutei", equipment: "Corpo libero", pattern: "hinge" },

  // ── POLPACCI ───────────────────────────────────────────────────────────────
  { name: "Calf Raise in piedi", muscleGroup: "Polpacci", equipment: "Macchina", pattern: "squat" },
  { name: "Calf Raise seduto", muscleGroup: "Polpacci", equipment: "Macchina", pattern: "squat" },
  { name: "Calf Raise alla Leg Press", muscleGroup: "Polpacci", equipment: "Macchina", pattern: "squat" },
  { name: "Calf Raise con bilanciere", muscleGroup: "Polpacci", equipment: "Bilanciere", pattern: "squat" },

  // ── SPALLE ─────────────────────────────────────────────────────────────────
  { name: "Military Press con bilanciere", muscleGroup: "Spalle", equipment: "Bilanciere", pattern: "push" },
  { name: "Spinte Manubri Panca Inclinata a 30°", muscleGroup: "Spalle", equipment: "Manubri", pattern: "push" },
  { name: "Spinte manubri in piedi", muscleGroup: "Spalle", equipment: "Manubri", pattern: "push" },
  { name: "Spinte manubri seduto", muscleGroup: "Spalle", equipment: "Manubri", pattern: "push" },
  { name: "Arnold Press", muscleGroup: "Spalle", equipment: "Manubri", pattern: "push" },
  { name: "Alzate laterali con manubri", muscleGroup: "Spalle", equipment: "Manubri", pattern: "push" },
  { name: "Alzate laterali al cavo", muscleGroup: "Spalle", equipment: "Cavo", pattern: "push" },
  { name: "Alzate frontali con manubri", muscleGroup: "Spalle", equipment: "Manubri", pattern: "push" },
  { name: "Alzate frontali con bilanciere", muscleGroup: "Spalle", equipment: "Bilanciere", pattern: "push" },
  { name: "Lateral Raise Machine", muscleGroup: "Spalle", equipment: "Macchina", pattern: "push" },
  { name: "Alzate posteriori con manubri (Reverse Fly)", muscleGroup: "Spalle", equipment: "Manubri", pattern: "pull" },
  { name: "Alzate posteriori al peck deck", muscleGroup: "Spalle", equipment: "Macchina", pattern: "pull" },
  { name: "Shoulder Press Machine", muscleGroup: "Spalle", equipment: "Macchina", pattern: "push" },
  { name: "Upright Row con bilanciere", muscleGroup: "Spalle", equipment: "Bilanciere", pattern: "pull" },

  // ── BICIPITI ───────────────────────────────────────────────────────────────
  { name: "Curl con bilanciere", muscleGroup: "Bicipiti", equipment: "Bilanciere", pattern: "pull" },
  { name: "Curl con bilanciere EZ", muscleGroup: "Bicipiti", equipment: "Bilanciere", pattern: "pull" },
  { name: "Curl manubri alternato", muscleGroup: "Bicipiti", equipment: "Manubri", pattern: "pull" },
  { name: "Curl manubri simultaneo", muscleGroup: "Bicipiti", equipment: "Manubri", pattern: "pull" },
  { name: "Curl a martello (Hammer Curl)", muscleGroup: "Bicipiti", equipment: "Manubri", pattern: "pull" },
  { name: "Curl con cavo basso", muscleGroup: "Bicipiti", equipment: "Cavo", pattern: "pull" },
  { name: "Curl al cavo con corda", muscleGroup: "Bicipiti", equipment: "Cavo", pattern: "pull" },
  { name: "Curl concentrato", muscleGroup: "Bicipiti", equipment: "Manubri", pattern: "pull" },
  { name: "Curl su panca Scott (Preacher Curl)", muscleGroup: "Bicipiti", equipment: "Bilanciere", pattern: "pull" },
  { name: "Curl spider con bilanciere EZ", muscleGroup: "Bicipiti", equipment: "Bilanciere", pattern: "pull" },
  { name: "Curl ai cavi incrociati", muscleGroup: "Bicipiti", equipment: "Cavo", pattern: "pull" },

  // ── TRICIPITI ──────────────────────────────────────────────────────────────
  { name: "Tricipiti al cavo con barra", muscleGroup: "Tricipiti", equipment: "Cavo", pattern: "push" },
  { name: "Tricipiti al cavo con corda", muscleGroup: "Tricipiti", equipment: "Cavo", pattern: "push" },
  { name: "Tricipiti al cavo presa inversa", muscleGroup: "Tricipiti", equipment: "Cavo", pattern: "push" },
  { name: "French Press con bilanciere", muscleGroup: "Tricipiti", equipment: "Bilanciere", pattern: "push" },
  { name: "French Press con manubrio", muscleGroup: "Tricipiti", equipment: "Manubri", pattern: "push" },
  { name: "Skull Crusher", muscleGroup: "Tricipiti", equipment: "Bilanciere", pattern: "push" },
  { name: "Kick-Back con manubrio", muscleGroup: "Tricipiti", equipment: "Manubri", pattern: "push" },
  { name: "Dips ai paralleli (tricipiti)", muscleGroup: "Tricipiti", equipment: "Corpo libero", pattern: "push" },
  { name: "Close Grip Bench Press", muscleGroup: "Tricipiti", equipment: "Bilanciere", pattern: "push" },
  { name: "Overhead Triceps Extension al cavo", muscleGroup: "Tricipiti", equipment: "Cavo", pattern: "push" },

  // ── AVAMBRACCI ─────────────────────────────────────────────────────────────
  { name: "Wrist Curl con bilanciere", muscleGroup: "Avambracci", equipment: "Bilanciere", pattern: "pull" },
  { name: "Reverse Curl con bilanciere", muscleGroup: "Avambracci", equipment: "Bilanciere", pattern: "pull" },
  { name: "Reverse Curl con manubri", muscleGroup: "Avambracci", equipment: "Manubri", pattern: "pull" },
  { name: "Zottman Curl", muscleGroup: "Avambracci", equipment: "Manubri", pattern: "pull" },
  { name: "Farmer's Walk", muscleGroup: "Avambracci", equipment: "Manubri", pattern: "carry" },
  { name: "Plate Pinch", muscleGroup: "Avambracci", equipment: "Disco", pattern: "carry" },

  // ── ADDOMINALI ─────────────────────────────────────────────────────────────
  { name: "Crunch classico", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Crunch al cavo", muscleGroup: "Addominali", equipment: "Cavo", pattern: "core" },
  { name: "Plank", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Side Plank", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Leg Raise", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Hanging Leg Raise", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Russian Twist", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Ab Wheel Rollout", muscleGroup: "Addominali", equipment: "Attrezzo", pattern: "core" },
  { name: "Dead Bug", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Mountain Climber", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Pallof Press", muscleGroup: "Addominali", equipment: "Cavo", pattern: "core" },
  { name: "Dragon Flag", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },
  { name: "Vacuum addominale", muscleGroup: "Addominali", equipment: "Corpo libero", pattern: "core" },

  // ── FULL BODY / OLIMPICI ───────────────────────────────────────────────────
  { name: "Clean and Jerk", muscleGroup: "Full Body", equipment: "Bilanciere", pattern: "carry" },
  { name: "Power Clean", muscleGroup: "Full Body", equipment: "Bilanciere", pattern: "hinge" },
  { name: "Snatch", muscleGroup: "Full Body", equipment: "Bilanciere", pattern: "hinge" },
  { name: "Kettlebell Swing", muscleGroup: "Full Body", equipment: "Kettlebell", pattern: "hinge" },
  { name: "Turkish Get-Up", muscleGroup: "Full Body", equipment: "Kettlebell", pattern: "carry" },
  { name: "Farmer's Walk", muscleGroup: "Full Body", equipment: "Manubri", pattern: "carry" },
  { name: "Burpee", muscleGroup: "Full Body", equipment: "Corpo libero", pattern: "carry" },
  { name: "Box Jump", muscleGroup: "Gambe", equipment: "Corpo libero", pattern: "squat" },
  { name: "Thruster", muscleGroup: "Full Body", equipment: "Bilanciere", pattern: "squat" },
  { name: "Battle Rope", muscleGroup: "Full Body", equipment: "Attrezzo", pattern: "carry" },
  { name: "Sled Push", muscleGroup: "Full Body", equipment: "Attrezzo", pattern: "carry" },
  { name: "Trap Bar Deadlift", muscleGroup: "Full Body", equipment: "Bilanciere", pattern: "hinge" },
];

export const MUSCLE_GROUPS = [...new Set(EXERCISE_LIBRARY.map((e) => e.muscleGroup))].sort();

export function searchExercises(query: string, muscleGroup?: string): LibraryExercise[] {
  const q = query.toLowerCase().trim();
  return EXERCISE_LIBRARY.filter((e) => {
    const matchesMuscle = !muscleGroup || e.muscleGroup === muscleGroup;
    const matchesQuery = !q ||
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup.toLowerCase().includes(q) ||
      (e.equipment?.toLowerCase().includes(q) ?? false);
    return matchesMuscle && matchesQuery;
  }).slice(0, 8);
}
