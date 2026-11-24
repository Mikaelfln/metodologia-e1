import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoApi } from "../js/demo-api.js";

const answers = {
  task: { summary: "Resumo.", word_count: 1, timed_out: false },
  recall: { text: "Resumo.", skipped: false, similarity: 1 },
  authorship: { value: 3 },
  quiz: { answers: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  profile: { course: "Outro", term: 2, ai_frequency: 4 },
};

async function runUntil(api, stage) {
  const started = await api.startSession("LAB1");
  let last = await api.beginTask(started.token);
  for (const current of Object.keys(answers)) {
    if (current === stage) break;
    last = await api.saveStage(started.token, current, answers[current]);
  }
  return { token: started.token, last };
}

test("the demo walks from consent to the debrief", async () => {
  const api = createDemoApi();
  const { consent } = await api.getConsent("LAB1");
  assert.ok(consent.paragraphs.length > 0);
  const { last } = await runUntil(api, "debrief");
  assert.equal(last.stage, "debrief");
  assert.ok(last.withdrawal_code);
  assert.ok(last.debrief.paragraphs.length > 0);
});

test("the demo starts without the source text and honours a fixed condition", async () => {
  const api = createDemoApi({ condition: "ai_review" });
  const started = await api.startSession("LAB1");
  assert.equal(started.stage, "instructions");
  assert.equal(started.condition, "ai_review");
  assert.equal(started.source_text, undefined);
  assert.ok(started.instructions.paragraphs.length > 0);
});

test("the demo rejects a missing session code", async () => {
  const api = createDemoApi();
  await assert.rejects(api.getConsent(""), /invalid_session/);
});

test("the demo rejects a stage out of order", async () => {
  const api = createDemoApi();
  const { token } = await runUntil(api, "recall");
  await assert.rejects(api.saveStage(token, "quiz", answers.quiz), /wrong_stage/);
  await assert.rejects(api.saveStage(token, "task", answers.task), /wrong_stage/);
});

test("the demo keeps the first task start time", async () => {
  let clock = Date.parse("2026-12-10T14:00:00Z");
  const api = createDemoApi({ now: () => clock, durationSeconds: 20 });
  const started = await api.startSession("LAB1");
  const first = await api.beginTask(started.token);
  clock += 5000;
  const second = await api.beginTask(started.token);
  assert.equal(second.started_at, first.started_at);
  assert.equal(second.duration_seconds, 20);
  assert.equal(Date.parse(second.server_now) - Date.parse(second.started_at), 5000);
});

test("the demo quiz has no answer key", async () => {
  const api = createDemoApi();
  const { last } = await runUntil(api, "quiz");
  assert.equal(last.questions.length, 5);
  for (const question of last.questions) {
    assert.deepEqual(Object.keys(question).sort(), ["id", "options", "prompt"]);
  }
});

test("the demo survives a reload when given persistent storage", async () => {
  const saved = new Map();
  const storage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: (key) => saved.delete(key),
  };
  const { token } = await runUntil(createDemoApi({ storage }), "authorship");
  const resumed = await createDemoApi({ storage }).resume(token);
  assert.equal(resumed.stage, "authorship");
  assert.ok(resumed.authorship.prompt);
});

test("the demo forgets a withdrawn participant", async () => {
  const api = createDemoApi();
  const { token } = await runUntil(api, "debrief");
  await api.withdraw(token);
  await assert.rejects(api.resume(token), /unknown_token/);
});
