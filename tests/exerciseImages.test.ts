import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { getExerciseImageId, ALL_IMAGE_IDS } from "../lib/exerciseImages.ts";

const cases: Array<[string, string | null]> = [
  // exact library names
  ["Panca Piana con bilanciere", "Barbell_Bench_Press_-_Medium_Grip"],
  ["Curl ai cavi incrociati", null],
  // free text with extra detail
  ["Panca piana con bilanciere - fermo al petto", "Barbell_Bench_Press_-_Medium_Grip"],
  // different word order / no prepositions (previously the wrong equipment)
  ["Panca piana manubri", "Dumbbell_Bench_Press"],
  ["Panca inclinata bilanciere", "Barbell_Incline_Bench_Press_-_Medium_Grip"],
  ["Rematore manubrio", "One-Arm_Dumbbell_Row"],
  ["Curl manubri", "Dumbbell_Bicep_Curl"],
  ["Affondi bilanciere", "Barbell_Lunge"],
  ["Stacco rumeno manubri", "Stiff-Legged_Dumbbell_Deadlift"],
  ["Lento avanti manubri", "Dumbbell_Shoulder_Press"],
  // the movement wins over the bench (previously an incline press)
  ["Curl manubri su panca inclinata", "Incline_Dumbbell_Curl"],
  ["Croci su panca inclinata con manubri", "Incline_Dumbbell_Flyes"],
  ["Croci panca piana", "Dumbbell_Flyes"],
  ["Pullover su panca piana", "Bent-Arm_Dumbbell_Pullover"],
  // keywords only on word starts
  ["Tricipiti cavi incrociati", "Triceps_Pushdown"],
  ["Low row Hammer", null],
  ["Goblet squat kettlebell", "Goblet_Squat"],
  ["Esercizio inventato", null],
  // variant overrides and supersets
  ["Curl al cavo + push down con corda", "Standing_Biceps_Cable_Curl"],
  ["Croci ai cavi", "Cable_Crossover"],
  ["Alzate laterali da seduto", "Seated_Side_Lateral_Raise"],
  ["Sumo squat manubrio", "Plie_Dumbbell_Squat"],
  ["Squat a corpo libero", "Bodyweight_Squat"],
  ["Affondi a corpo libero", null],
  // equipment-specific photos instead of a look-alike
  ["Spinte manubri in piedi", "Standing_Dumbbell_Press"],
  ["Zottman Curl", "Zottman_Curl"],
  ["Corsa all'aperto", "Trail_Running_Walking"],
  ["Panca inclinata multipower 30°", "Smith_Machine_Incline_Bench_Press"],
  ["Panca presa stretta multipower", "Smith_Machine_Close-Grip_Bench_Press"],
  ["Polpacci al multipower", "Smith_Machine_Calf_Raise"],
  ["Crunch su panca declinata", "Decline_Crunch"],
  ["Crunch inverso", "Reverse_Crunch"],
  ["Crunch machine", "Ab_Crunch_Machine"],
  ["Bycicle crunch", "Air_Bike"],
  ["Glute Bridge monopodalico", "Single_Leg_Glute_Bridge"],
  ["Alzate laterali singole con manubrio", "One-Arm_Side_Laterals"],
  ["T-Bar Row chest supported", "Lying_T-Bar_Row"],
  ["Zercher squat", "Zercher_Squats"],
  ["Scrollate", "Barbell_Shrug"],
  ["Curl femorale", "Lying_Leg_Curls"],
  ["Leg curl in piedi", "Standing_Leg_Curl"],
  ["Affondi indietro alternati", "Dumbbell_Rear_Lunge"],
  ["Affondi bulgari manubri (per gamba)", "Split_Squat_with_Dumbbells"],
  ["Curl inverso EZ", "Reverse_Barbell_Curl"],
  ["Estensioni sopra la testa al cavo", "Cable_Rope_Overhead_Triceps_Extension"],
  ["Lat machine", "Wide-Grip_Lat_Pulldown"],
  ["Push down con sbarra dritta", "Triceps_Pushdown"],
  ["Spinte manubri panca 60-70°", "Dumbbell_Shoulder_Press"],
  // no fitting photo: show none rather than a different machine
  ["Pressa Orizzontale", null],
  ["Leg Press orizzontale", null],
  ["Lateral Raise Machine", null],
  ["Assault bike", null],
];

for (const [name, expected] of cases) {
  test(`image: ${name}`, () => assert.equal(getExerciseImageId(name), expected));
}

test("every mapped image folder exists on disk", () => {
  const missing = ALL_IMAGE_IDS.filter((id) => !existsSync(`public/exercises/${id}/0.webp`) || !existsSync(`public/exercises/${id}/1.webp`));
  assert.deepEqual(missing, []);
});
