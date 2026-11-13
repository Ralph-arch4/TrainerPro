import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyProgression, activeProgression, normalizeProgressions, describeProgression, moveWithinDay,
} from "../lib/progressions.ts";

const base = { sets: 2, targetReps: "8-10", restSeconds: "90", notes: "Lento in discesa" };

test("no progressions: exercise unchanged (same reference)", () => {
  assert.equal(applyProgression(base, 5), base);
  assert.equal(applyProgression({ ...base, progressions: [] }, 5).sets, 2);
});

test("trainer's case: 2 sets become 3 from week 3", () => {
  const ex = { ...base, progressions: [{ id: "a", fromWeek: 3, sets: 3 }] };
  assert.equal(applyProgression(ex, 1).sets, 2);
  assert.equal(applyProgression(ex, 2).sets, 2);
  assert.equal(applyProgression(ex, 3).sets, 3);
  assert.equal(applyProgression(ex, 8).sets, 3);
  assert.equal(applyProgression(ex, 3).targetReps, "8-10");
  assert.equal(ex.sets, 2, "base exercise is not mutated");
});

test("steps are cumulative and each overrides only its own fields", () => {
  const ex = { ...base, progressions: [
    { id: "b", fromWeek: 5, targetReps: "6-8", restSeconds: "120" },
    { id: "a", fromWeek: 3, sets: 3 },
    { id: "c", fromWeek: 7, sets: 4, notes: "Ultima serie a cedimento" },
  ] };
  const w5 = applyProgression(ex, 5);
  assert.deepEqual([w5.sets, w5.targetReps, w5.restSeconds], [3, "6-8", "120"]);
  const w7 = applyProgression(ex, 7);
  assert.deepEqual([w7.sets, w7.targetReps], [4, "6-8"]);
  assert.equal(w7.notes, "Lento in discesa\nUltima serie a cedimento");
  assert.equal(activeProgression(ex, 6)?.id, "b");
  assert.equal(activeProgression(ex, 2), undefined);
});

test("per-set reps follow the new number of sets", () => {
  const ex = { ...base, sets: 3, perSetReps: ["12", "10", "8"], progressions: [
    { id: "a", fromWeek: 2, sets: 4 }, { id: "b", fromWeek: 4, sets: 2 }, { id: "c", fromWeek: 6, targetReps: "5" },
  ] };
  assert.deepEqual(applyProgression(ex, 2).perSetReps, ["12", "10", "8", "8"]);
  assert.deepEqual(applyProgression(ex, 4).perSetReps, ["12", "10"]);
  assert.equal(applyProgression(ex, 6).perSetReps, undefined);
  assert.equal(applyProgression(ex, 6).targetReps, "5");
});

test("normalize drops invalid steps, clamps and sorts", () => {
  const out = normalizeProgressions([
    { id: "x", fromWeek: 1, sets: 5 },                 // week 1 = base plan
    { id: "y", fromWeek: 4 },                           // no change
    { id: "z", fromWeek: 6, sets: 99 },
    { id: "w", fromWeek: 3, sets: 0, targetReps: " 12 " },
    // @ts-expect-error malformed data coming from JSONB
    null,
  ]);
  assert.deepEqual(out.map((p) => p.fromWeek), [3, 6]);
  assert.equal(out[0].sets, undefined);
  assert.equal(out[0].targetReps, "12");
  assert.equal(out[1].sets, 20);
  assert.deepEqual(normalizeProgressions(undefined), []);
  // @ts-expect-error legacy rows may contain anything
  assert.deepEqual(normalizeProgressions("oops"), []);
});

test("two steps on the same week are merged, later wins", () => {
  const out = normalizeProgressions([
    { id: "a", fromWeek: 3, sets: 3, targetReps: "10" },
    { id: "b", fromWeek: 3, sets: 4 },
  ]);
  assert.equal(out.length, 1);
  assert.deepEqual([out[0].sets, out[0].targetReps], [4, "10"]);
});

test("describeProgression", () => {
  assert.equal(describeProgression({ id: "a", fromWeek: 3, sets: 3, targetReps: "6-8", restSeconds: "120" }), "3 serie · 6-8 rip. · rec. 120s");
});

test("moveWithinDay swaps only inside the day, even with interleaved order", () => {
  const exs = [
    { id: "a1", day: 1, order: 0 }, { id: "b1", day: 2, order: 1 },
    { id: "a2", day: 1, order: 2 }, { id: "b2", day: 2, order: 3 }, { id: "a3", day: 1, order: 4 },
  ];
  const moved = moveWithinDay(exs, "a2", "up");
  const day1 = moved.filter((e) => e.day === 1).sort((x, y) => x.order - y.order).map((e) => e.id);
  const day2 = moved.filter((e) => e.day === 2).sort((x, y) => x.order - y.order).map((e) => e.id);
  assert.deepEqual(day1, ["a2", "a1", "a3"]);
  assert.deepEqual(day2, ["b1", "b2"]);
  assert.deepEqual(moved.map((e) => e.order).sort((x, y) => x - y), [0, 1, 2, 3, 4]);
  assert.equal(moveWithinDay(exs, "a1", "up"), exs, "first of the day cannot go up");
  assert.equal(moveWithinDay(exs, "a3", "down"), exs);
  assert.equal(moveWithinDay(exs, "missing", "up"), exs);
});
