import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { getExerciseImageId, ALL_IMAGE_IDS } from "../lib/exerciseImages.ts";

const cases: Array<[string, string | null]> = [
  // exact library names
  ["Panca Piana con bilanciere", "Barbell_Bench_Press_-_Medium_Grip"],
  ["Curl ai cavi incrociati", "Standing_Biceps_Cable_Curl"],
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
  ["Curl manubri su panca inclinata", "Dumbbell_Bicep_Curl"],
  ["Croci su panca inclinata con manubri", "Incline_Dumbbell_Flyes"],
  ["Croci panca piana", "Dumbbell_Flyes"],
  ["Pullover su panca piana", "Bent-Arm_Dumbbell_Pullover"],
  // keywords only on word starts
  ["Tricipiti cavi incrociati", "Triceps_Pushdown"],
  ["Low row Hammer", null],
  ["Goblet squat kettlebell", "Dumbbell_Squat"],
  ["Esercizio inventato", null],
  // variant overrides and supersets
  ["Curl al cavo + push down con corda", "Standing_Biceps_Cable_Curl"],
  ["Croci ai cavi", "Cable_Crossover"],
  ["Alzate laterali da seduto", "Seated_Side_Lateral_Raise"],
  ["Sumo squat manubrio", "Dumbbell_Squat"],
  ["Squat a corpo libero", null],
];

for (const [name, expected] of cases) {
  test(`image: ${name}`, () => assert.equal(getExerciseImageId(name), expected));
}

test("every mapped image folder exists on disk", () => {
  const missing = ALL_IMAGE_IDS.filter((id) => !existsSync(`public/exercises/${id}/0.webp`) || !existsSync(`public/exercises/${id}/1.webp`));
  assert.deepEqual(missing, []);
});
