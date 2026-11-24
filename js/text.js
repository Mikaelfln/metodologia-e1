export const MIN_WORDS = 150;
export const MAX_WORDS = 200;

const HAS_WORD_CHARACTER = /[\p{L}\p{N}]/u;

export function countWords(text) {
  return text.split(/\s+/).filter((piece) => HAS_WORD_CHARACTER.test(piece)).length;
}

export function withinRange(count) {
  return count >= MIN_WORDS && count <= MAX_WORDS;
}

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function splitSentences(text) {
  return text
    .split(/[.!?\n]+/)
    .map((piece) => piece.trim())
    .filter(Boolean);
}

function tally(tokens) {
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

function dice(left, right) {
  if (left.length === 0 || right.length === 0) return 0;
  const rightCounts = tally(right);
  let shared = 0;
  for (const [token, count] of tally(left)) {
    shared += Math.min(count, rightCounts.get(token) ?? 0);
  }
  return (2 * shared) / (left.length + right.length);
}

export function recallSimilarity(recall, summary) {
  const recalled = normalize(recall);
  const best = splitSentences(summary).reduce(
    (highest, sentence) => Math.max(highest, dice(recalled, normalize(sentence))),
    0,
  );
  return Math.round(best * 100) / 100;
}
