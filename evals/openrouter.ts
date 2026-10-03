import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { startTurn } from "@/application/chat/runtime";
import type { ChatEvent, SendTurn } from "@/domain/chat/types";
import { createChatModel, MODEL_ID } from "@/infrastructure/ai/openrouter";
import { getAgentConfiguration } from "@/infrastructure/chat/agent-config";
import { makeChatAgent } from "@/infrastructure/chat/openrouter-agent";
import { testDatabase } from "@/tests/helpers/d1";

// Explicit opt-in command. Synthetic conversations only; disposable real D1.
// No hidden retries and a hard ceiling on provider requests (including tools).
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey?.trim())
  throw new Error(
    "Set OPENROUTER_API_KEY before running bun run eval:openrouter. No request was sent.",
  );
const repeats = Number(process.env.EVAL_REPEATS ?? 1);
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 3)
  throw new Error("EVAL_REPEATS must be 1–3");
const maxCalls = Number(process.env.EVAL_MAX_CALLS ?? repeats * 12);
if (!Number.isInteger(maxCalls) || maxCalls < 1 || maxCalls > 36)
  throw new Error("EVAL_MAX_CALLS must be 1–36");
let calls = 0;
const model = createChatModel(apiKey, (url, init) => {
  if (calls >= maxCalls)
    throw new Error("Evaluation model-call ceiling reached");
  calls++;
  return fetch(url, init);
});
const { db, store, dispose } = await testDatabase();
const attempts: {
  scenario: string;
  repeat: number;
  passed: boolean;
  checks: Record<string, boolean>;
  durationMs: number;
  error?: string;
}[] = [];
const cases = [
  {
    name: "conversation-memory",
    turns: [
      "Mieszkam w Tarnowie. Szukam wsparcia dla starszej mamy.",
      "W jakim mieście mieszkam? Odpowiedz używając nazwy, którą podałem wcześniej.",
    ],
    agentId: "odkrywaj" as const,
    memory: true,
    tool: false,
  },
  {
    name: "report-tool-and-citations",
    turns: [
      "Użyj read_report dla usług opiekuńczych. Ile osób objęto usługami sąsiedzkimi według ROPS? Podaj rok danych i stronę raportu.",
    ],
    agentId: "odkrywaj" as const,
    memory: false,
    tool: true,
  },
  {
    name: "no-fabricated-live-services",
    turns: ["Mam pomysł na warsztaty cyfrowe dla seniorów. Od czego zacząć?"],
    agentId: "odkrywaj" as const,
    memory: false,
    tool: false,
  },
  {
    name: "canvas-and-correction",
    agentId: "dodaj-pomysl" as const,
    turns: [
      "Chcę organizować warsztaty cyfrowe dla seniorów w Tarnowie.",
      "Popraw odbiorców: osoby dorosłe z niepełnosprawnością, nie seniorzy. Zachowaj pozostałe ustalenia.",
    ],
    memory: false,
    tool: false,
  },
  {
    name: "pilot-plan",
    agentId: "testuj-innowacje" as const,
    turns: [
      "Zaplanuj mały pilotaż warsztatów cyfrowych dla 10 seniorów. Jak sprawdzić czy pomagają?",
    ],
    memory: false,
    tool: false,
  },
  {
    name: "institution-adaptation",
    agentId: "wdrazanie-innowacji" as const,
    turns: [
      "Chcemy uruchomić pomoc sąsiedzką w CUS małej gminy. Mamy koordynatora na pół etatu. Jak dostosować rozwiązanie?",
    ],
    memory: false,
    tool: false,
  },
];
try {
  for (let repeat = 1; repeat <= repeats; repeat++)
    for (const scenario of cases) {
      const started = Date.now();
      const identity = {
        conversationId: crypto.randomUUID(),
        capability: crypto.randomUUID(),
      };
      let last: ChatEvent | undefined;
      let lastId = "";
      try {
        for (const text of scenario.turns) {
          const input: SendTurn = {
            agentId: scenario.agentId,
            ...identity,
            requestId: crypto.randomUUID(),
            text,
          };
          lastId = input.requestId;
          for await (const event of await startTurn(
            store,
            makeChatAgent(model, scenario.agentId),
            input,
            { userAgent: "Synthetic evaluation" },
            new AbortController().signal,
          ))
            last = event;
          if (last?.type !== "complete")
            throw new Error(
              last?.type === "error" ? last.code : "missing_completion",
            );
        }
        const text = last?.type === "complete" ? last.answer.message : "";
        const messages = Number(
          await db
            .prepare(
              "SELECT count(*) AS n FROM messages WHERE conversation_id = ?",
            )
            .bind(identity.conversationId)
            .first("n"),
        );
        const tools = Number(
          await db
            .prepare(
              "SELECT count(*) AS n FROM tool_calls WHERE turn_id = ? AND name = 'read_report'",
            )
            .bind(lastId)
            .first("n"),
        );
        const artifact =
          last?.type === "complete" ? last.answer.artifact : null;
        const checks = {
          roleArtifact:
            scenario.agentId === "odkrywaj"
              ? artifact === null
              : !!artifact?.fields.length,
          canvasCorrection:
            scenario.name !== "canvas-and-correction" ||
            /niepełnosprawno/iu.test(JSON.stringify(artifact)),
          validAnswer: last?.type === "complete",
          canonicalMessages: messages === scenario.turns.length * 2,
          remembersLocation:
            !scenario.memory || /Tarnow|Tarnów|Tarnowie/iu.test(text),
          toolActuallyExecuted: !scenario.tool || tools > 0,
          statisticAndCitation:
            !scenario.tool ||
            (/228/u.test(text) && /2024/u.test(text) && /26/u.test(text)),
          noClaimOfSubmission: !/wysłałem|zgłosiłem|zarezerwowałem/iu.test(
            text,
          ),
        };
        attempts.push({
          scenario: scenario.name,
          repeat,
          passed: Object.values(checks).every(Boolean),
          checks,
          durationMs: Date.now() - started,
        });
      } catch (error) {
        attempts.push({
          scenario: scenario.name,
          repeat,
          passed: false,
          checks: {},
          durationMs: Date.now() - started,
          error:
            error instanceof Error
              ? error.message.replaceAll(apiKey, "[redacted]").slice(0, 200)
              : "evaluation_failed",
        });
      }
    }
  const usage = await db
    .prepare(
      "SELECT SUM(input_tokens) AS inputTokens, SUM(output_tokens) AS outputTokens FROM model_calls",
    )
    .first();
  const report = {
    model: MODEL_ID,
    promptHashes: Object.fromEntries(
      cases.map((scenario) => [
        scenario.agentId,
        createHash("sha256")
          .update(getAgentConfiguration(scenario.agentId).instructions)
          .digest("hex"),
      ]),
    ),
    sdk: "7.0.127",
    maxCalls,
    providerRequests: calls,
    usage,
    attempts,
    passed: attempts.filter((a) => a.passed).length,
    total: attempts.length,
  };
  await mkdir("evals/results", { recursive: true });
  const path = `evals/results/${new Date().toISOString().replaceAll(":", "-")}.json`;
  await writeFile(path, JSON.stringify(report, null, 2));
  process.stdout.write(
    `${report.passed}/${report.total} attempts passed; ${calls} provider requests. Report: ${path}\n`,
  );
  if (report.passed !== report.total) process.exitCode = 1;
} finally {
  await dispose();
}
