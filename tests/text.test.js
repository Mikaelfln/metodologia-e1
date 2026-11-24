import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countWords,
  normalize,
  splitSentences,
  recallSimilarity,
  withinRange,
} from "../js/text.js";

test("countWords is zero for empty or blank text", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n\t "), 0);
});

test("countWords ignores repeated spaces and line breaks", () => {
  assert.equal(countWords("  um\n\ndois   três "), 3);
});

test("countWords treats hyphenated words as one and skips loose punctuation", () => {
  assert.equal(countWords("bem-vindo — sim"), 2);
  assert.equal(countWords("Fim . . . !"), 1);
});

test("countWords counts numbers", () => {
  assert.equal(countWords("em 1887, 31 metros"), 4);
});

test("withinRange accepts 150 to 200 inclusive", () => {
  assert.equal(withinRange(149), false);
  assert.equal(withinRange(150), true);
  assert.equal(withinRange(200), true);
  assert.equal(withinRange(201), false);
});

test("normalize lowercases and strips accents and punctuation", () => {
  assert.deepEqual(normalize("A Água, ferve: NÃO?"), ["a", "agua", "ferve", "nao"]);
});

test("splitSentences splits on terminal punctuation and line breaks", () => {
  assert.deepEqual(splitSentences("Um. Dois! Três?\nQuatro"), ["Um", "Dois", "Três", "Quatro"]);
  assert.deepEqual(splitSentences("  \n "), []);
});

test("recallSimilarity is 1 for a sentence recalled exactly, ignoring case and accents", () => {
  assert.equal(
    recallSimilarity("A água ferve a cem graus.", "Introdução. A agua ferve a cem graus! Fim."),
    1,
  );
});

test("recallSimilarity is low for an unrelated sentence", () => {
  const score = recallSimilarity(
    "O gato dormiu no telhado ontem.",
    "O farol foi erguido em 1887. A luz era produzida por uma lamparina.",
  );
  assert.ok(score < 0.3, String(score));
});

test("recallSimilarity is partial for a paraphrase and rounded to two decimals", () => {
  const score = recallSimilarity(
    "O farol foi construído em 1887",
    "O farol foi erguido em 1887. Depois veio a eletricidade.",
  );
  assert.ok(score > 0.6 && score < 1, String(score));
  assert.equal(score, Math.round(score * 100) / 100);
});

test("recallSimilarity is zero when either side is empty", () => {
  assert.equal(recallSimilarity("", "Um resumo."), 0);
  assert.equal(recallSimilarity("Uma frase.", ""), 0);
  assert.equal(recallSimilarity("...", "Um resumo."), 0);
});
