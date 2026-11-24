import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { createDemoApi } from "./demo-api.js";

async function call(name, args) {
  let response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args),
    });
  } catch {
    throw new Error("network");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "request_failed");
  return body;
}

export function createApi({ demo = false, demoOptions = {} } = {}) {
  if (demo) return createDemoApi(demoOptions);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("not_configured");
  return {
    getConsent: (session) => call("get_consent", { p_session: session }),
    startSession: (session) => call("start_session", { p_session: session }),
    beginTask: (token) => call("begin_task", { p_token: token }),
    saveStage: (token, stage, data) =>
      call("save_stage", { p_token: token, p_stage: stage, p_data: data }),
    resume: (token) => call("resume", { p_token: token }),
    logEvents: (token, events) => call("log_events", { p_token: token, p_events: events }),
    withdraw: (token) => call("withdraw", { p_token: token }),
  };
}
