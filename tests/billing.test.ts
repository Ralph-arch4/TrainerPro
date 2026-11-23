import { test } from "node:test";
import assert from "node:assert/strict";
import { getPaymentStatus } from "../lib/billing.ts";

const START = "2026-11-13";

test("no user: no status", () => assert.equal(getPaymentStatus(null), null));

test("legacy free account over the demo limit: 30 days from the notice start", () => {
  const st = getPaymentStatus({ plan: "free" }, new Date("2026-11-13T10:00:00Z"), START, 5)!;
  assert.equal(st.show, true);
  assert.equal(st.daysLeft, 30);
  assert.equal(st.dueDate.toISOString().slice(0, 10), "2026-12-13");
  assert.equal(st.expired, false);
});

test("countdown decreases and expires", () => {
  assert.equal(getPaymentStatus({ plan: "free" }, new Date("2026-12-12T12:00:00Z"), START)!.daysLeft, 1);
  const late = getPaymentStatus({ plan: "free" }, new Date("2026-12-20T00:00:00Z"), START)!;
  assert.deepEqual([late.daysLeft, late.expired], [0, true]);
});

test("demo accounts within the limit are not warned", () => {
  assert.equal(getPaymentStatus({ plan: "free" }, new Date("2026-11-20"), START, 0)!.show, false);
  assert.equal(getPaymentStatus({ plan: "free" }, new Date("2026-11-20"), START, 1)!.show, false);
  assert.equal(getPaymentStatus({ plan: "free" }, new Date("2026-11-20"), START, 2)!.show, true);
});

test("paid plans never see the notice", () => {
  assert.equal(getPaymentStatus({ plan: "premium" }, new Date("2026-11-20"), START, 40)!.show, false);
  assert.equal(getPaymentStatus({ plan: "personal_coach" }, new Date("2026-11-20"), START)!.show, false);
  assert.equal(getPaymentStatus({ plan: "fitness_master" }, new Date("2026-11-20"), START)!.show, false);
});

test("per-account due date overrides the default; invalid dates are ignored", () => {
  const st = getPaymentStatus({ plan: "free", paymentDueAt: "2027-01-10" }, new Date("2026-12-31T00:00:00Z"), START)!;
  assert.equal(st.daysLeft, 10);
  const bad = getPaymentStatus({ plan: "free", paymentDueAt: "boh" }, new Date("2026-11-13T00:00:00Z"), START)!;
  assert.equal(bad.daysLeft, 30);
});
