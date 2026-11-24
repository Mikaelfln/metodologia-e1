import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const root = new URL("../../supabase/", import.meta.url);

export async function createDb() {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated;");
  await db.exec(await readFile(new URL("schema.sql", root), "utf8"));
  await db.exec(await readFile(new URL("content.example.sql", root), "utf8"));
  await db.exec(`
    insert into sessions (code, label) values ('LAB1', 'Lab session');
    insert into sessions (code, label, pilot) values ('PILOT', 'Pilot', true);
    insert into sessions (code, label, classmate) values ('CLASS', 'Classroom', true);
    insert into sessions (code, label, active) values ('OLD', 'Closed', false);
  `);

  async function asAnon(sql, params = []) {
    await db.exec("set role anon");
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec("reset role");
    }
  }

  async function rpc(call, params = []) {
    const result = await asAnon(`select ${call} as r`, params);
    return result.rows[0].r;
  }

  async function admin(sql, params = []) {
    const result = await db.query(sql, params);
    return result.rows;
  }

  return { rpc, asAnon, admin, close: () => db.close() };
}

export async function advanceTo(db, stage, session = "LAB1") {
  const order = ["task", "recall", "authorship", "quiz", "profile", "debrief"];
  const payloads = {
    task: { summary: "Um resumo curto de teste.", word_count: 5, timed_out: false },
    recall: { text: "Um resumo curto.", skipped: false, similarity: 0.86 },
    authorship: { value: 4 },
    quiz: { answers: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 0 } },
    profile: { course: "Ciência da Computação", term: 5, ai_frequency: 3 },
  };
  const started = await db.rpc("start_session($1)", [session]);
  const token = started.token;
  let last = started;
  if (stage === "instructions") return { token, last };
  last = await db.rpc("begin_task($1::uuid)", [token]);
  for (const current of order) {
    if (current === stage) break;
    last = await db.rpc("save_stage($1::uuid, $2, $3::jsonb)", [
      token,
      current,
      JSON.stringify(payloads[current]),
    ]);
  }
  return { token, last };
}
