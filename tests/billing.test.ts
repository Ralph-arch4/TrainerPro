import { test } from "node:test";
import assert from "node:assert/strict";
import { getTrialStatus, accountAccess, TRIAL_DAYS } from "../lib/billing.ts";

const NOW = new Date("2026-11-23T10:00:00Z");

test("no user: no status", () => assert.equal(getTrialStatus(null), null));

test("trial counts down whole days", () => {
  const st = getTrialStatus({ plan: "free", trialEndsAt: "2026-12-07T10:00:00Z" }, NOW)!;
  assert.deepEqual([st.onTrial, st.daysLeft, st.suspended], [true, 14, false]);
  assert.equal(getTrialStatus({ plan: "free", trialEndsAt: "2026-11-24T09:00:00Z" }, NOW)!.daysLeft, 1);
});

test("expired trial suspends the demo account", () => {
  const st = getTrialStatus({ plan: "free", trialEndsAt: "2026-11-23T09:59:59Z" }, NOW)!;
  assert.deepEqual([st.daysLeft, st.suspended], [0, true]);
});

test("paid plans are never on trial nor suspended", () => {
  for (const plan of ["premium", "personal_coach", "fitness_master"]) {
    const st = getTrialStatus({ plan, trialEndsAt: "2020-01-01" }, NOW)!;
    assert.deepEqual([st.onTrial, st.suspended], [false, false]);
  }
});

test("accounts without an end date (existing before the trial) are never on trial nor suspended", () => {
  for (const trialEndsAt of [undefined, null, "boh"]) {
    const st = getTrialStatus({ plan: "free", trialEndsAt }, NOW)!;
    assert.deepEqual([st.onTrial, st.suspended, st.endsAt], [false, false, null]);
  }
  assert.equal(TRIAL_DAYS, 14);
});

test("accountAccess: admin status wins over the trial", () => {
  assert.equal(accountAccess(null), "ok");
  assert.equal(accountAccess({ plan: "free", trialEndsAt: "2026-12-07" }, NOW), "ok");
  assert.equal(accountAccess({ plan: "free", trialEndsAt: "2026-11-01" }, NOW), "trial_expired");
  assert.equal(accountAccess({ plan: "premium", accountStatus: "suspended" }, NOW), "suspended");
  assert.equal(accountAccess({ plan: "premium", accountStatus: "banned" }, NOW), "banned");
  assert.equal(accountAccess({ plan: "premium", accountStatus: "active", trialEndsAt: "2020-01-01" }, NOW), "ok");
});
