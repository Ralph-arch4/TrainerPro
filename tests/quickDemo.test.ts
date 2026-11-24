import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasQuickDemo, normalizeLocked, remainingMs, isExpired, formatRemaining,
  demoLinkErrorMessage, DEFAULT_LOCKED, DEMO_DURATION_HOURS,
} from "../lib/quickDemo.ts";

test("quick demo is exclusive to fitness_master", () => {
  assert.equal(hasQuickDemo("fitness_master"), true);
  for (const plan of ["free", "premium", "personal_coach", "", null, undefined]) {
    assert.equal(hasQuickDemo(plan), false);
  }
});

test("links last 4 hours", () => {
  assert.equal(DEMO_DURATION_HOURS, 4);
  const now = new Date("2026-11-24T10:00:00Z");
  assert.equal(remainingMs("2026-11-24T14:00:00Z", now), 4 * 3600_000);
  assert.equal(isExpired("2026-11-24T14:00:00Z", now), false);
  assert.equal(isExpired("2026-11-24T10:00:00Z", now), true);
  assert.equal(remainingMs("2026-11-24T09:00:00Z", now), 0);
});

test("remaining time format", () => {
  assert.equal(formatRemaining(0), "scaduto");
  assert.equal(formatRemaining(30_000), "< 1m");
  assert.equal(formatRemaining(45 * 60_000), "45m");
  assert.equal(formatRemaining((3 * 60 + 5) * 60_000), "3h 05m");
});

test("locked features are filtered and ordered", () => {
  assert.deepEqual(normalizeLocked(["checkin", "bogus", "weeks"]), ["weeks", "checkin"]);
  assert.deepEqual(normalizeLocked(null), []);
  assert.equal(DEFAULT_LOCKED.length, 5);
});

test("DB guard errors map to Italian messages", () => {
  assert.match(demoLinkErrorMessage({ message: "DEMO_LINK_PLAN_REQUIRED" }), /Fitness Master/);
  assert.match(demoLinkErrorMessage(new Error("x")), /Riprova/);
});

test("quick builder: empty rows and days dropped, labels kept, values clamped", async () => {
  const { quickToPlan, planToQuick } = await import("../lib/quickDemo.ts");
  const days = [
    { id: "d1", label: "Push", exercises: [{ id: "a", name: " Panca Piana ", sets: "4", reps: "8-10" }, { id: "b", name: "", sets: "3", reps: "10" }] },
    { id: "d2", label: "Giorno 2", exercises: [{ id: "c", name: "", sets: "3", reps: "" }] },
    { id: "d3", label: "Giorno 3", exercises: [{ id: "d", name: "Squat", sets: "99", reps: "" }, { id: "e", name: "Plank", sets: "x", reps: "30s" }] },
  ];
  const plan = quickToPlan(days);
  assert.equal(plan.daysPerWeek, 2);
  assert.deepEqual(plan.dayLabels, { 1: "Push" });
  assert.deepEqual(plan.exercises.map((e) => [e.name, e.sets, e.targetReps, e.day, e.order]), [
    ["Panca Piana", 4, "8-10", 1, 0], ["Squat", 20, "10", 2, 0], ["Plank", 1, "30s", 2, 1],
  ]);
  const back = planToQuick(plan.exercises, plan.daysPerWeek, plan.dayLabels);
  assert.deepEqual(back.map((d) => [d.label, d.exercises.map((e) => e.name)]), [["Push", ["Panca Piana"]], ["Giorno 2", ["Squat", "Plank"]]]);
});
