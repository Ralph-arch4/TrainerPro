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
