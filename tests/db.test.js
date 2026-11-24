import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createDb, advanceTo } from "./helpers/db.js";

const CONDITIONS = ["ai_generate", "ai_review", "no_ai"];

let db;

before(async () => {
  db = await createDb();
});

after(async () => {
  await db.close();
});

async function fresh() {
  return createDb();
}

test("get_consent returns the consent text for an active session", async () => {
  const result = await db.rpc("get_consent($1)", ["LAB1"]);
  assert.ok(result.consent.paragraphs.length > 0);
});

test("get_consent rejects closed and unknown sessions and stores nothing", async () => {
  const local = await fresh();
  await assert.rejects(local.rpc("get_consent($1)", ["OLD"]), /invalid_session/);
  await assert.rejects(local.rpc("get_consent($1)", ["NOPE"]), /invalid_session/);
  await local.rpc("get_consent($1)", ["LAB1"]);
  const rows = await local.admin("select count(*)::int as n from participants");
  assert.equal(rows[0].n, 0);
  await local.close();
});

test("the schema ships with a collection link and a pilot link", async () => {
  const local = await fresh();
  await local.rpc("get_consent($1)", ["coleta"]);
  await local.rpc("start_session($1)", ["coleta"]);
  await local.rpc("start_session($1)", ["piloto"]);
  const rows = await local.admin(
    "select session_code, pilot, classmate from participants order by session_code",
  );
  assert.deepEqual(rows, [
    { session_code: "coleta", pilot: false, classmate: false },
    { session_code: "piloto", pilot: true, classmate: false },
  ]);
  await local.close();
});

test("start_session rejects closed sessions", async () => {
  await assert.rejects(db.rpc("start_session($1)", ["OLD"]), /invalid_session/);
});

test("anonymous role cannot read any table or the export view", async () => {
  for (const relation of [
    "participants",
    "events",
    "content",
    "quiz_questions",
    "quiz_answers",
    "sessions",
    "allocation_queue",
    "export",
  ]) {
    await assert.rejects(
      db.asAnon(`select * from ${relation}`),
      /permission denied/,
      relation,
    );
  }
});

test("anonymous role cannot write to participants directly", async () => {
  await assert.rejects(
    db.asAnon("update participants set condition = 'no_ai'"),
    /permission denied/,
  );
});

test("conditions are balanced in consecutive blocks of three", async () => {
  const local = await fresh();
  const assigned = [];
  for (let i = 0; i < 9; i += 1) {
    const session = i % 2 === 0 ? "LAB1" : "CLASS";
    assigned.push((await local.rpc("start_session($1)", [session])).condition);
  }
  for (let i = 0; i < 9; i += 3) {
    assert.deepEqual(assigned.slice(i, i + 3).sort(), CONDITIONS);
  }
  await local.close();
});

test("pilot sessions do not consume slots of the main allocation", async () => {
  const local = await fresh();
  await local.rpc("start_session($1)", ["LAB1"]);
  for (let i = 0; i < 3; i += 1) await local.rpc("start_session($1)", ["PILOT"]);
  const rest = [];
  for (let i = 0; i < 2; i += 1) {
    rest.push((await local.rpc("start_session($1)", ["LAB1"])).condition);
  }
  const first = await local.admin(
    "select condition from participants where not pilot order by consented_at, id",
  );
  assert.deepEqual(first.map((row) => row.condition).sort(), CONDITIONS);
  assert.equal(rest.length, 2);
  await local.close();
});

test("participants inherit classmate and pilot flags from the session", async () => {
  const local = await fresh();
  await local.rpc("start_session($1)", ["CLASS"]);
  await local.rpc("start_session($1)", ["PILOT"]);
  const rows = await local.admin(
    "select session_code, classmate, pilot from participants order by session_code",
  );
  assert.deepEqual(rows, [
    { session_code: "CLASS", classmate: true, pilot: false },
    { session_code: "PILOT", classmate: false, pilot: true },
  ]);
  await local.close();
});

test("start_session returns instructions but not the source text", async () => {
  const started = await db.rpc("start_session($1)", ["LAB1"]);
  assert.equal(started.stage, "instructions");
  assert.ok(CONDITIONS.includes(started.condition));
  assert.ok(started.instructions.paragraphs.length > 0);
  assert.ok(started.task.prompt);
  assert.equal(started.source_text, undefined);
  assert.match(started.token, /^[0-9a-f-]{36}$/);
});

test("begin_task returns the source text and keeps the first start time", async () => {
  const { token } = await advanceTo(db, "instructions");
  const first = await db.rpc("begin_task($1::uuid)", [token]);
  const second = await db.rpc("begin_task($1::uuid)", [token]);
  assert.ok(first.source_text.paragraphs.length > 0);
  assert.equal(first.duration_seconds, 900);
  assert.equal(first.stage, "task");
  assert.equal(second.started_at, first.started_at);
  assert.ok(second.server_now);
});

test("begin_task is rejected once the summary has been submitted", async () => {
  const { token } = await advanceTo(db, "recall");
  await assert.rejects(db.rpc("begin_task($1::uuid)", [token]), /wrong_stage/);
});

test("a full session ends at the debrief and is exported as complete", async () => {
  const local = await fresh();
  const { token, last } = await advanceTo(local, "debrief");
  assert.equal(last.stage, "debrief");
  assert.ok(last.debrief.paragraphs.length > 0);
  assert.match(last.withdrawal_code, /^[A-Z0-9]{8}$/);
  const rows = await local.admin("select * from export");
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.complete, true);
  assert.equal(row.summary, "Um resumo curto de teste.");
  assert.equal(row.summary_word_count, 5);
  assert.equal(row.recall_text, "Um resumo curto.");
  assert.equal(Number(row.recall_similarity), 0.86);
  assert.equal(row.recall_coded, null);
  assert.equal(row.authorship, 4);
  assert.equal(row.profile_term, 5);
  assert.equal(row.withdrawal_code, last.withdrawal_code);
  assert.equal(row.token, undefined);
  const expected = await local.admin(`
    select count(*)::int as n from quiz_answers
    where correct_option = (array[0, 1, 2, 3, 0])[question_id]
  `);
  assert.equal(row.quiz_score, expected[0].n);
  assert.ok(token);
  await local.close();
});

test("an unfinished session is exported as incomplete with no quiz score", async () => {
  const local = await fresh();
  await advanceTo(local, "authorship");
  const rows = await local.admin("select complete, quiz_score, stage from export");
  assert.deepEqual(rows, [{ complete: false, quiz_score: null, stage: "authorship" }]);
  await local.close();
});

test("save_stage rejects a stage that is not the current one", async () => {
  const { token } = await advanceTo(db, "recall");
  await assert.rejects(
    db.rpc("save_stage($1::uuid, $2, $3::jsonb)", [token, "quiz", '{"answers":{}}']),
    /wrong_stage/,
  );
});

test("save_stage rejects a repeated stage and keeps the stored data", async () => {
  const { token } = await advanceTo(db, "recall");
  await assert.rejects(
    db.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
      token,
      "task",
      JSON.stringify({ summary: "Outro texto", word_count: 2, timed_out: false }),
    ]),
    /wrong_stage/,
  );
  const rows = await db.admin("select summary from participants where token = $1", [token]);
  assert.equal(rows[0].summary, "Um resumo curto de teste.");
});

test("the summary cannot be saved before the task has begun", async () => {
  const { token } = await advanceTo(db, "instructions");
  await assert.rejects(
    db.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
      token,
      "task",
      JSON.stringify({ summary: "x", word_count: 1, timed_out: false }),
    ]),
    /wrong_stage/,
  );
});

test("the quiz is delivered without the answer key", async () => {
  const { last } = await advanceTo(db, "quiz");
  assert.equal(last.stage, "quiz");
  assert.equal(last.questions.length, 5);
  for (const question of last.questions) {
    assert.deepEqual(Object.keys(question).sort(), ["id", "options", "prompt"]);
    assert.equal(question.options.length, 4);
  }
});

test("authorship outside 1 to 5 is rejected", async () => {
  const { token } = await advanceTo(db, "authorship");
  for (const value of [0, 6, null]) {
    await assert.rejects(
      db.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
        token,
        "authorship",
        JSON.stringify({ value }),
      ]),
      /invalid_data/,
    );
  }
});

test("a skipped recall is stored without text", async () => {
  const local = await fresh();
  const { token } = await advanceTo(local, "recall");
  await local.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
    token,
    "recall",
    JSON.stringify({ text: "", skipped: true, similarity: 0 }),
  ]);
  const rows = await local.admin("select recall_text, recall_skipped from export");
  assert.deepEqual(rows, [{ recall_text: null, recall_skipped: true }]);
  await local.close();
});

test("quiz answers must be valid option indexes of known questions", async () => {
  const local = await fresh();
  const { token } = await advanceTo(local, "quiz");
  for (const answers of [{ 1: "a" }, { 1: 1.5 }, { 1: 1e99 }, { 1: 4 }, { 1: -1 }, { 99: 0 }]) {
    await assert.rejects(
      local.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
        token,
        "quiz",
        JSON.stringify({ answers }),
      ]),
      /invalid_data/,
      JSON.stringify(answers),
    );
  }
  await local.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
    token,
    "quiz",
    JSON.stringify({ answers: { 1: 0, 3: 3 } }),
  ]);
  const rows = await local.admin("select quiz_score from export");
  assert.deepEqual(rows, [{ quiz_score: 1 }]);
  await local.close();
});

test("page events are counted per stage in the export", async () => {
  const local = await fresh();
  const { token } = await advanceTo(local, "task");
  const at = new Date().toISOString();
  await local.rpc("log_events($1::uuid, $2::jsonb)", [
    token,
    JSON.stringify([
      { stage: "task", kind: "blur", at, detail: {} },
      { stage: "task", kind: "focus", at, detail: {} },
      { stage: "task", kind: "blur", at, detail: {} },
      { stage: "task", kind: "paste", at, detail: { length: 40 } },
      { stage: "quiz", kind: "blur", at, detail: {} },
    ]),
  ]);
  const rows = await local.admin(
    "select tab_leaves_task, pastes_task, pasted_chars_task, tab_leaves_measures from export",
  );
  assert.deepEqual(rows, [
    { tab_leaves_task: 2, pastes_task: 1, pasted_chars_task: 40, tab_leaves_measures: 1 },
  ]);
  await local.close();
});

test("events of an unknown kind are rejected", async () => {
  const { token } = await advanceTo(db, "task");
  await assert.rejects(
    db.rpc("log_events($1::uuid, $2::jsonb)", [
      token,
      JSON.stringify([{ stage: "task", kind: "keylog", at: new Date().toISOString() }]),
    ]),
    /invalid_data/,
  );
});

test("withdraw deletes the participant and its events", async () => {
  const local = await fresh();
  const { token } = await advanceTo(local, "debrief");
  await local.admin(
    "insert into events (participant_id, stage, kind, at) select id, 'task', 'blur', now() from participants",
  );
  await local.rpc("withdraw($1::uuid)", [token]);
  const rows = await local.admin(
    "select (select count(*) from participants)::int as p, (select count(*) from events)::int as e",
  );
  assert.deepEqual(rows, [{ p: 0, e: 0 }]);
  await assert.rejects(local.rpc("resume($1::uuid)", [token]), /unknown_token/);
  await local.close();
});

test("resume returns what the current stage needs", async () => {
  const quiz = await advanceTo(db, "quiz");
  const resumedQuiz = await db.rpc("resume($1::uuid)", [quiz.token]);
  assert.equal(resumedQuiz.stage, "quiz");
  assert.equal(resumedQuiz.questions.length, 5);

  const task = await advanceTo(db, "task");
  const resumedTask = await db.rpc("resume($1::uuid)", [task.token]);
  assert.equal(resumedTask.stage, "task");
  assert.ok(resumedTask.instructions);
  assert.equal(resumedTask.source_text, undefined);

  const debrief = await advanceTo(db, "debrief");
  const resumedDebrief = await db.rpc("resume($1::uuid)", [debrief.token]);
  assert.equal(resumedDebrief.withdrawal_code, debrief.last.withdrawal_code);
});

test("unknown tokens are rejected", async () => {
  await assert.rejects(
    db.rpc("resume($1::uuid)", ["00000000-0000-4000-8000-000000000000"]),
    /unknown_token/,
  );
});

test("the consent text does not reveal the measures", async () => {
  const { consent } = await db.rpc("get_consent($1)", ["LAB1"]);
  const text = JSON.stringify(consent).toLowerCase();
  for (const word of ["memória", "lembr", "autoria", "citar"]) {
    assert.ok(!text.includes(word), word);
  }
});

test("the consent text states how long data is kept and how to drop out", async () => {
  const { consent } = await db.rpc("get_consent($1)", ["LAB1"]);
  const text = consent.paragraphs.join(" ");
  assert.match(text, /[[PRAZO]]/);
  assert.match(text, /avise quem está aplicando/);
});
