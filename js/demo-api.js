import { content, questions } from "./demo-content.js";
import { STAGES } from "./flow.js";

const CONDITIONS = ["no_ai", "ai_review", "ai_generate"];
const STORAGE_KEY = "e1.demo";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function randomId() {
  return globalThis.crypto.randomUUID();
}

export function createDemoApi({
  storage = memoryStorage(),
  condition = null,
  durationSeconds = 900,
  now = () => Date.now(),
} = {}) {
  function load() {
    return JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}");
  }

  function store(participants) {
    storage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }

  function find(token) {
    const participant = load()[token];
    if (!participant) throw new Error("unknown_token");
    return participant;
  }

  function update(token, changes) {
    const participants = load();
    participants[token] = { ...participants[token], ...changes };
    store(participants);
    return participants[token];
  }

  function payload(participant) {
    const base = { stage: participant.stage };
    switch (participant.stage) {
      case "instructions":
      case "task":
        return {
          ...base,
          condition: participant.condition,
          instructions: content[`instructions_${participant.condition}`],
          task: content.task,
        };
      case "recall":
        return { ...base, recall: content.recall };
      case "authorship":
        return { ...base, authorship: content.authorship };
      case "quiz":
        return { ...base, quiz_intro: content.quiz_intro, questions };
      case "profile":
        return { ...base, profile: content.profile };
      default:
        return {
          ...base,
          debrief: content.debrief,
          withdrawal_code: participant.withdrawalCode,
        };
    }
  }

  return {
    async getConsent(session) {
      if (!session) throw new Error("invalid_session");
      return { consent: content.consent };
    },

    async startSession(session) {
      if (!session) throw new Error("invalid_session");
      const token = randomId();
      const participant = update(token, {
        stage: "instructions",
        condition: condition ?? CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
        withdrawalCode: randomId().replaceAll("-", "").slice(0, 8).toUpperCase(),
        startedAt: null,
      });
      return { ...payload(participant), token };
    },

    async beginTask(token) {
      let participant = find(token);
      if (!["instructions", "task"].includes(participant.stage)) throw new Error("wrong_stage");
      if (!participant.startedAt) {
        participant = update(token, { stage: "task", startedAt: new Date(now()).toISOString() });
      }
      return {
        stage: "task",
        source_text: content.source_text,
        started_at: participant.startedAt,
        server_now: new Date(now()).toISOString(),
        duration_seconds: durationSeconds,
      };
    },

    async saveStage(token, stage, data) {
      const participant = find(token);
      const savable = STAGES.slice(1, -1);
      if (participant.stage !== stage || !savable.includes(stage)) throw new Error("wrong_stage");
      const next = STAGES[STAGES.indexOf(stage) + 1];
      return payload(update(token, { stage: next, [stage]: data }));
    },

    async resume(token) {
      return payload(find(token));
    },

    async logEvents(token) {
      find(token);
      return {};
    },

    async withdraw(token) {
      find(token);
      const participants = load();
      delete participants[token];
      store(participants);
      return {};
    },
  };
}
