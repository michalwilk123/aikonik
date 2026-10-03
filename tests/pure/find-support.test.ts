import assert from "node:assert/strict";
import { test } from "node:test";
import { makeFindSupport } from "../../application/use-cases/find-support";
import type { SupportAnswer } from "../../domain/support-offer";

test("rejects empty input before calling the matcher", async () => {
  let calls = 0;
  const findSupport = makeFindSupport({
    async match() {
      calls++;
      return { message: "", areaLabel: "", offers: [] };
    },
  });

  for (const query of ["", " ", "\n\t"]) {
    await assert.rejects(findSupport(query), {
      name: "EmptyQueryError",
      message: "Query must not be empty",
    });
  }
  assert.equal(calls, 0);
});

test("passes normalized Polish input to the matcher and returns its answer", async () => {
  const queries: string[] = [];
  const answer: SupportAnswer = {
    message: "Odpowiedź",
    areaLabel: "Małopolska",
    offers: [],
  };
  const findSupport = makeFindSupport({
    async match(query) {
      queries.push(query);
      return answer;
    },
  });

  assert.deepEqual(await findSupport(" \nPomoc dla osób starszych\t "), answer);
  assert.deepEqual(queries, ["Pomoc dla osób starszych"]);
});

test("propagates matcher failure rather than returning fabricated support", async () => {
  const failure = new Error("Retrieval unavailable");
  const findSupport = makeFindSupport({
    async match() {
      throw failure;
    },
  });

  await assert.rejects(findSupport("Potrzebuję wsparcia"), (error: unknown) => {
    assert.equal(error, failure);
    return true;
  });
});
