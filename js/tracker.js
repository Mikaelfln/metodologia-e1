const TRACKED_STAGES = ["task", "recall", "authorship", "quiz"];
const FLUSH_INTERVAL = 10_000;

export function createTracker({ getStage, send }) {
  let buffer = [];
  let away = false;
  let sending = null;

  function record(kind, detail = {}) {
    const stage = getStage();
    if (!TRACKED_STAGES.includes(stage)) return;
    buffer.push({ stage, kind, at: new Date().toISOString(), detail });
  }

  function updatePresence() {
    const nowAway = document.visibilityState === "hidden" || !document.hasFocus();
    if (nowAway === away) return;
    away = nowAway;
    record(away ? "blur" : "focus");
  }

  async function flush() {
    if (sending) await sending.catch(() => {});
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    sending = send(batch)
      .catch(() => {
        buffer = batch.concat(buffer);
      })
      .finally(() => {
        sending = null;
      });
    await sending;
  }

  document.addEventListener("visibilitychange", updatePresence);
  window.addEventListener("blur", updatePresence);
  window.addEventListener("focus", updatePresence);
  document.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text") ?? "";
    record("paste", { length: text.length });
  });
  setInterval(flush, FLUSH_INTERVAL);

  return { flush };
}
