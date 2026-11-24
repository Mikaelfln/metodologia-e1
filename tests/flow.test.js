import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, remainingSeconds } from "../js/flow.js";

const started = "2026-12-10T14:00:00.000Z";

test("stages follow the session order", () => {
  assert.deepEqual(STAGES, [
    "instructions",
    "task",
    "recall",
    "authorship",
    "quiz",
    "profile",
    "debrief",
  ]);
});

test("remainingSeconds is the full duration at the start", () => {
  assert.equal(remainingSeconds(started, started, 5000, 5000, 900), 900);
});

test("remainingSeconds counts down with the local clock", () => {
  assert.equal(remainingSeconds(started, started, 5000, 5000 + 60_000, 900), 840);
});

test("remainingSeconds accounts for time already elapsed on the server", () => {
  const serverNow = "2026-12-10T14:05:00.000Z";
  assert.equal(remainingSeconds(started, serverNow, 5000, 5000 + 10_000, 900), 590);
});

test("remainingSeconds never goes below zero", () => {
  assert.equal(remainingSeconds(started, started, 5000, 5000 + 1_000_000, 900), 0);
});

test("remainingSeconds does not depend on the absolute value of the local clock", () => {
  const hour = 3_600_000;
  assert.equal(
    remainingSeconds(started, started, Date.parse(started) + hour, Date.parse(started) + hour + 30_000, 900),
    870,
  );
});
