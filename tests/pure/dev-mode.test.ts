import assert from "node:assert/strict";
import { test } from "node:test";
import { isDevMode } from "@/infrastructure/chat/dev-mode";

test("DEV fixtures require an explicit true flag and a development runtime", () => {
  const environmentVariables = process.env as Record<
    string,
    string | undefined
  >;
  const previous = environmentVariables.NODE_ENV;
  try {
    for (const environment of ["production", "test", "development"]) {
      environmentVariables.NODE_ENV = environment;
      assert.equal(isDevMode("true"), environment === "development");
      assert.equal(isDevMode("false"), false);
      assert.equal(isDevMode(undefined), false);
    }
  } finally {
    if (previous === undefined) delete environmentVariables.NODE_ENV;
    else environmentVariables.NODE_ENV = previous;
  }
});
