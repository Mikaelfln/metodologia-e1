import { createApi } from "./api.js";
import { createTracker } from "./tracker.js";
import { remainingSeconds } from "./flow.js";
import { countWords, withinRange, recallSimilarity, MIN_WORDS, MAX_WORDS } from "./text.js";

const TOKEN_KEY = "e1.token";
const DRAFT_KEY = "e1.draft";
const SUMMARY_KEY = "e1.summary";
const ENDING_SECONDS = 120;

const MESSAGES = {
  invalid_session:
    "Este link não está ativo. Peça um novo link a quem está aplicando a sessão.",
  not_configured: "O site ainda não foi configurado.",
  invalid_data: "Alguma resposta não foi aceita. Confira o que você preencheu e tente de novo.",
  fallback: "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.",
};

const params = new URLSearchParams(window.location.search);
const sessionCode = (params.get("s") ?? "").trim();
const demo = params.get("demo") === "1";
const screen = document.querySelector("#screen");
const store = window.sessionStorage;

const state = { token: store.getItem(TOKEN_KEY), stage: null };
let api;
let tracker;
let stopClock = () => {};

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === "class") node.className = value;
    else if (name === "text") node.textContent = value;
    else if (name.startsWith("on")) node.addEventListener(name.slice(2), value);
    else if (value === true) node.setAttribute(name, "");
    else if (value !== false && value != null) node.setAttribute(name, value);
  }
  node.append(...children.filter((child) => child != null));
  return node;
}

function paragraphs(items) {
  return items.map((text) => el("p", { text }));
}

function show(nodes, layout = "") {
  stopClock();
  screen.dataset.layout = layout;
  screen.replaceChildren(...nodes);
  window.scrollTo(0, 0);
  screen.focus({ preventScroll: true });
}

function messageFor(error) {
  return MESSAGES[error.message] ?? MESSAGES.fallback;
}

function forget() {
  state.token = null;
  state.stage = null;
  store.removeItem(TOKEN_KEY);
  store.removeItem(DRAFT_KEY);
  store.removeItem(SUMMARY_KEY);
}

function closing(text) {
  forget();
  show([el("h1", { text: "Sessão encerrada" }), el("p", { text })]);
}

async function recover(error, notice) {
  if (error.message === "unknown_token") {
    forget();
    await openConsent();
    return;
  }
  if (error.message === "wrong_stage") {
    try {
      render(await api.resume(state.token));
      return;
    } catch (again) {
      notice.textContent = messageFor(again);
      return;
    }
  }
  notice.textContent = messageFor(error);
}

async function attempt(button, notice, action) {
  button.disabled = true;
  notice.textContent = "";
  try {
    await action();
  } catch (error) {
    await recover(error, notice);
  } finally {
    button.disabled = false;
  }
}

async function advance(stage, data) {
  await tracker.flush();
  render(await api.saveStage(state.token, stage, data));
}

function render(payload) {
  state.stage = payload.stage;
  const screens = {
    instructions: renderInstructions,
    task: renderTask,
    recall: renderRecall,
    authorship: renderAuthorship,
    quiz: renderQuiz,
    profile: renderProfile,
    debrief: renderDebrief,
  };
  screens[payload.stage](payload);
}

async function openConsent() {
  if (!sessionCode) {
    show([
      el("h1", { text: "Link incompleto" }),
      el("p", { text: "Abra o link completo que você recebeu de quem está aplicando a sessão." }),
    ]);
    return;
  }
  try {
    const { consent } = await api.getConsent(sessionCode);
    renderConsent(consent);
  } catch (error) {
    const notice = el("p", { class: "notice", text: messageFor(error) });
    const retry = el("button", {
      class: "primary",
      type: "button",
      text: "Tentar de novo",
      onclick: () => openConsent(),
    });
    show([el("h1", { text: "Não foi possível abrir a sessão" }), notice, el("div", { class: "actions" }, retry)]);
  }
}

function renderConsent(consent) {
  const notice = el("p", { class: "notice", role: "alert" });
  const accept = el("button", { class: "primary", type: "button", text: consent.accept_label });
  const decline = el("button", { class: "quiet", type: "button", text: consent.decline_label });
  accept.addEventListener("click", () =>
    attempt(accept, notice, async () => {
      const started = await api.startSession(sessionCode);
      state.token = started.token;
      store.setItem(TOKEN_KEY, started.token);
      render(started);
    }),
  );
  decline.addEventListener("click", () =>
    closing("Tudo bem. Nada foi registrado. Você já pode fechar esta página."),
  );
  show([
    el("h1", { text: consent.title }),
    ...paragraphs(consent.paragraphs),
    el("div", { class: "actions" }, accept, decline),
    notice,
  ]);
}

function renderInstructions(payload) {
  const notice = el("p", { class: "notice", role: "alert" });
  const begin = el("button", { class: "primary", type: "button", text: "Começar" });
  begin.addEventListener("click", () => attempt(begin, notice, () => openTask(payload)));
  show([
    el("h1", { text: payload.instructions.title }),
    ...paragraphs(payload.instructions.paragraphs),
    el("p", { class: "prompt", text: payload.task.prompt }),
    el("div", { class: "actions" }, begin),
    notice,
  ]);
}

async function renderTask(payload) {
  const notice = el("p", { class: "notice", role: "alert" });
  const retry = el("button", { class: "primary", type: "button", text: "Tentar de novo" });
  retry.addEventListener("click", () => attempt(retry, notice, () => openTask(payload)));
  show([el("p", { class: "waiting", text: "Carregando…" }), notice]);
  try {
    await openTask(payload);
  } catch (error) {
    show([el("h1", { text: payload.task.title }), el("div", { class: "actions" }, retry), notice]);
    await recover(error, notice);
  }
}

async function openTask(payload) {
  const task = await api.beginTask(state.token);
  const answeredAt = Date.now();
  state.stage = "task";

  const clockValue = el("strong", { text: "" });
  const clock = el("p", { class: "clock" }, "Tempo restante ", clockValue);
  const editor = el("textarea", {
    class: "writing",
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": "Seu resumo",
  });
  editor.value = store.getItem(DRAFT_KEY) ?? "";
  const countValue = el("span", { text: "" });
  const countHint = document.createTextNode("");
  const count = el("p", { class: "count" }, countValue, countHint);
  const submit = el("button", { class: "primary", type: "button", text: "Entregar resumo" });
  const notice = el("p", { class: "notice", role: "alert" });
  let finished = false;

  function refreshCount() {
    const words = countWords(editor.value);
    const ok = withinRange(words);
    countValue.textContent = `${words} ${words === 1 ? "palavra" : "palavras"}`;
    if (ok) countHint.textContent = "";
    else if (words < MIN_WORDS) countHint.textContent = `, faltam ${MIN_WORDS - words} para o mínimo`;
    else countHint.textContent = `, ${words - MAX_WORDS} acima do máximo`;
    count.dataset.ok = String(ok);
    submit.disabled = !ok || finished;
  }

  async function deliver(timedOut) {
    finished = true;
    editor.readOnly = true;
    submit.disabled = true;
    notice.textContent = "";
    const summary = editor.value;
    try {
      store.setItem(SUMMARY_KEY, summary);
      await advance("task", {
        summary,
        word_count: countWords(summary),
        timed_out: timedOut,
      });
      store.removeItem(DRAFT_KEY);
    } catch (error) {
      if (timedOut) {
        submit.textContent = "Enviar de novo";
        submit.disabled = false;
        submit.onclick = () => deliver(true);
        await recover(error, notice);
        if (!notice.textContent) return;
        notice.textContent = `O tempo acabou. ${notice.textContent}`;
      } else {
        finished = false;
        editor.readOnly = false;
        refreshCount();
        await recover(error, notice);
      }
    }
  }

  function tick() {
    if (finished) return;
    const left = remainingSeconds(
      task.started_at,
      task.server_now,
      answeredAt,
      Date.now(),
      task.duration_seconds,
    );
    const minutes = String(Math.floor(left / 60)).padStart(2, "0");
    const seconds = String(left % 60).padStart(2, "0");
    clockValue.textContent = `${minutes}:${seconds}`;
    clock.dataset.ending = String(left <= ENDING_SECONDS);
    if (left === 0) deliver(true);
  }

  editor.addEventListener("input", () => {
    store.setItem(DRAFT_KEY, editor.value);
    refreshCount();
  });
  submit.onclick = () => deliver(false);

  show(
    [
      el("div", { class: "task-bar" }, el("p", { class: "prompt", text: payload.task.prompt }), clock),
      el(
        "div",
        { class: "task" },
        el(
          "article",
          { class: "source" },
          el("h2", { text: task.source_text.title }),
          ...paragraphs(task.source_text.paragraphs),
        ),
        el("div", { class: "desk" }, editor, el("div", { class: "desk-footer" }, count, submit), notice),
      ),
    ],
    "wide",
  );

  refreshCount();
  tick();
  const timer = window.setInterval(tick, 250);
  document.addEventListener("visibilitychange", tick);
  stopClock = () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
    stopClock = () => {};
  };
}

function renderRecall(payload) {
  const notice = el("p", { class: "notice", role: "alert" });
  const answer = el("textarea", {
    class: "writing",
    spellcheck: "false",
    autocomplete: "off",
    "aria-label": "Frase do seu resumo",
  });
  const skip = el("input", { type: "checkbox" });
  const proceed = el("button", { class: "primary", type: "button", text: "Continuar", disabled: true });

  function refresh() {
    answer.disabled = skip.checked;
    proceed.disabled = !skip.checked && answer.value.trim() === "";
  }

  answer.addEventListener("input", refresh);
  skip.addEventListener("change", refresh);
  proceed.addEventListener("click", () =>
    attempt(proceed, notice, async () => {
      const skipped = skip.checked;
      const text = skipped ? "" : answer.value.trim();
      const summary = store.getItem(SUMMARY_KEY) ?? "";
      await advance("recall", {
        text,
        skipped,
        similarity: skipped ? 0 : recallSimilarity(text, summary),
      });
      store.removeItem(SUMMARY_KEY);
    }),
  );

  show([
    el("p", { class: "prompt", text: payload.recall.prompt }),
    el("div", { class: "recall" }, answer),
    el("label", { class: "choice" }, skip, payload.recall.skip_label),
    el("div", { class: "actions" }, proceed),
    notice,
  ]);
  answer.focus();
}

function scale(name, low, high, onChange) {
  const options = [1, 2, 3, 4, 5].map((value) =>
    el("label", {}, el("input", { type: "radio", name, value: String(value), onchange: onChange }), String(value)),
  );
  return [
    el("div", { class: "scale" }, ...options),
    el("p", { class: "scale-ends" }, el("span", { text: `1 = ${low}` }), el("span", { text: `5 = ${high}` })),
  ];
}

function chosen(name) {
  const input = screen.querySelector(`input[name="${name}"]:checked`);
  return input ? input.value : null;
}

function renderAuthorship(payload) {
  const notice = el("p", { class: "notice", role: "alert" });
  const proceed = el("button", { class: "primary", type: "button", text: "Continuar", disabled: true });
  const enable = () => {
    proceed.disabled = false;
  };
  proceed.addEventListener("click", () =>
    attempt(proceed, notice, () => advance("authorship", { value: Number(chosen("authorship")) })),
  );
  show([
    el(
      "fieldset",
      {},
      el("legend", { class: "prompt", text: payload.authorship.prompt }),
      ...scale("authorship", payload.authorship.low, payload.authorship.high, enable),
    ),
    el("div", { class: "actions" }, proceed),
    notice,
  ]);
}

function renderQuiz(payload) {
  const notice = el("p", { class: "notice", role: "alert" });
  const proceed = el("button", { class: "primary", type: "button", text: "Continuar", disabled: true });
  const names = payload.questions.map((question) => `question-${question.id}`);
  const refresh = () => {
    proceed.disabled = names.some((name) => chosen(name) === null);
  };
  const blocks = payload.questions.map((question, index) =>
    el(
      "fieldset",
      {},
      el("legend", { text: `${index + 1}. ${question.prompt}` }),
      ...question.options.map((option, position) =>
        el(
          "label",
          { class: "choice" },
          el("input", {
            type: "radio",
            name: `question-${question.id}`,
            value: String(position),
            onchange: refresh,
          }),
          option,
        ),
      ),
    ),
  );
  proceed.addEventListener("click", () =>
    attempt(proceed, notice, () => {
      const answers = {};
      for (const question of payload.questions) {
        answers[question.id] = Number(chosen(`question-${question.id}`));
      }
      return advance("quiz", { answers });
    }),
  );
  show([
    el("p", { class: "prompt", text: payload.quiz_intro.prompt }),
    ...blocks,
    el("div", { class: "actions" }, proceed),
    notice,
  ]);
}

function renderProfile(payload) {
  const profile = payload.profile;
  const notice = el("p", { class: "notice", role: "alert" });
  const proceed = el("button", { class: "primary", type: "button", text: "Continuar", disabled: true });
  const term = el("input", {
    class: "field",
    type: "number",
    min: "1",
    max: "30",
    step: "1",
    inputmode: "numeric",
    id: "term",
  });

  function termValue() {
    const value = Number(term.value);
    return Number.isInteger(value) && value >= 1 && value <= 30 ? value : null;
  }

  function refresh() {
    proceed.disabled =
      chosen("course") === null || chosen("ai-frequency") === null || termValue() === null;
  }

  term.addEventListener("input", refresh);
  proceed.addEventListener("click", () =>
    attempt(proceed, notice, () =>
      advance("profile", {
        course: chosen("course"),
        term: termValue(),
        ai_frequency: Number(chosen("ai-frequency")),
      }),
    ),
  );

  show([
    el("p", { class: "prompt", text: profile.intro }),
    el(
      "fieldset",
      {},
      el("legend", { text: profile.course_label }),
      ...profile.course_options.map((option) =>
        el(
          "label",
          { class: "choice" },
          el("input", { type: "radio", name: "course", value: option, onchange: refresh }),
          option,
        ),
      ),
    ),
    el("fieldset", {}, el("legend", {}, el("label", { for: "term", text: profile.term_label })), term),
    el(
      "fieldset",
      {},
      el("legend", { text: profile.ai_frequency_label }),
      ...scale("ai-frequency", profile.ai_frequency_low, profile.ai_frequency_high, refresh),
    ),
    el("div", { class: "actions" }, proceed),
    notice,
  ]);
}

function renderDebrief(payload) {
  store.removeItem(TOKEN_KEY);
  store.removeItem(DRAFT_KEY);
  store.removeItem(SUMMARY_KEY);
  const notice = el("p", { class: "notice", role: "alert" });
  const finish = el("button", {
    class: "primary",
    type: "button",
    text: "Concluir",
    onclick: () => closing("Obrigado pela participação. Você já pode fechar esta página."),
  });
  const erase = el("button", { class: "primary", type: "button", text: "Apagar meus dados" });
  const keep = el("button", { class: "quiet", type: "button", text: "Manter meus dados" });
  const confirmation = el(
    "div",
    { class: "confirm", hidden: true },
    el("p", {
      text: "Tudo o que você escreveu e respondeu nesta sessão será apagado agora. Isso não pode ser desfeito.",
    }),
    el("div", { class: "actions" }, erase, keep),
  );
  const withdraw = el("button", {
    class: "quiet",
    type: "button",
    text: payload.debrief.withdraw_label,
    onclick: () => {
      confirmation.hidden = false;
      erase.focus();
    },
  });
  keep.addEventListener("click", () => {
    confirmation.hidden = true;
    withdraw.focus();
  });
  erase.addEventListener("click", () =>
    attempt(erase, notice, async () => {
      await api.withdraw(state.token);
      closing("Seus dados foram apagados. Obrigado pela presença. Você já pode fechar esta página.");
    }),
  );
  show([
    el("h1", { text: payload.debrief.title }),
    ...paragraphs(payload.debrief.paragraphs),
    el("p", {}, "Seu código de participante: ", el("span", { class: "code", text: payload.withdrawal_code })),
    el("div", { class: "actions" }, finish, withdraw),
    confirmation,
    notice,
  ]);
}

function demoOptions() {
  const condition = params.get("condition");
  const seconds = Number(params.get("seconds"));
  return {
    storage: store,
    condition: ["no_ai", "ai_review", "ai_generate"].includes(condition) ? condition : null,
    durationSeconds: Number.isInteger(seconds) && seconds > 0 ? seconds : 900,
  };
}

async function main() {
  document.querySelector("#demo-note").hidden = !demo;
  try {
    api = createApi({ demo, demoOptions: demoOptions() });
  } catch (error) {
    show([el("h1", { text: "Site indisponível" }), el("p", { text: messageFor(error) })]);
    return;
  }
  tracker ??= createTracker({
    getStage: () => state.stage,
    send: (events) => api.logEvents(state.token, events),
  });
  window.onbeforeunload = (event) => {
    if (!state.token || state.stage === "debrief") return undefined;
    event.preventDefault();
    return "";
  };
  if (state.token) {
    try {
      render(await api.resume(state.token));
      return;
    } catch (error) {
      if (error.message === "unknown_token") forget();
      else {
        const notice = el("p", { class: "notice", text: messageFor(error) });
        const retry = el("button", {
          class: "primary",
          type: "button",
          text: "Tentar de novo",
          onclick: () => main(),
        });
        show([el("h1", { text: "Não foi possível retomar a sessão" }), notice, el("div", { class: "actions" }, retry)]);
        return;
      }
    }
  }
  await openConsent();
}

main();
