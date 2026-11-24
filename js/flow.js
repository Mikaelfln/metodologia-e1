export const STAGES = [
  "instructions",
  "task",
  "recall",
  "authorship",
  "quiz",
  "profile",
  "debrief",
];

export function remainingSeconds(startedAt, serverNow, clientAtResponse, clientNow, duration) {
  const elapsedBefore = Date.parse(serverNow) - Date.parse(startedAt);
  const elapsedSince = clientNow - clientAtResponse;
  const left = duration - (elapsedBefore + elapsedSince) / 1000;
  return Math.max(0, Math.ceil(left));
}
