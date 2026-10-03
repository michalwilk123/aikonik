import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceReveal, graphemeBoundaries } from "@/domain/chat/reveal";

test("bursts reveal gradually, accelerate for backlog, and drain after network completion", () => {
  const target = "Tekst odpowiedzi ".repeat(50);
  let state = { length: 0, carry: 0 };
  state = advanceReveal(target, state.length, 16, state.carry);
  assert.ok(state.length > 0 && state.length < target.length);
  assert.ok(
    advanceReveal(target, 0, 16, 0).length >
      advanceReveal("krótki", 0, 16, 0).length,
  );
  for (let frame = 0; frame < 1000 && state.length < target.length; frame++)
    state = advanceReveal(target, state.length, 16, state.carry);
  assert.equal(state.length, target.length);
});

test("visible prefixes never split combining accents, flags, skin tones or family emoji", () => {
  const text = "á 🇵🇱 👍🏽 👨‍👩‍👧‍👦 koniec";
  const boundaries = graphemeBoundaries(text);
  let state = { length: 0, carry: 0 };
  for (let frame = 0; frame < 1000 && state.length < text.length; frame++) {
    state = advanceReveal(text, state.length, 16, state.carry, boundaries);
    assert.ok(state.length === 0 || boundaries.includes(state.length));
  }
  assert.equal(state.length, text.length);
});

test("reveal handles pauses, replacement, background-tab elapsed time and emoji boundaries", () => {
  assert.deepEqual(advanceReveal("abc", 3, 1000, 0), { length: 3, carry: 0 });
  assert.deepEqual(advanceReveal("a", 30, 16, 0), { length: 1, carry: 0 });
  assert.ok(advanceReveal("x".repeat(1000), 0, 100000, 0).length < 30);
  const result = advanceReveal("😀abc", 0, 16, 0);
  assert.equal(result.length, 2);
});
