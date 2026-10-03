import {
  isStepCount,
  type LanguageModel,
  Output,
  streamText,
  type ToolSet,
} from "ai";
import type { z } from "zod";
import { resolveSources } from "@/agents/context";
import {
  type AgentArtifact,
  type AgentId,
  agentOutputSchema,
} from "@/agents/types";
import { compileHistory } from "@/application/chat/context";
import type { AgentEvent, ChatAgent } from "@/application/chat/runtime";
import type { ChatAnswer } from "@/domain/chat/types";
import type { ObservatoryVisualization } from "@/domain/observatory";
import { type SupportOffer, supportAnswerSchema } from "@/domain/support-offer";
import { getAgentConfiguration } from "@/infrastructure/chat/agent-config";
import { makeInnovationTools } from "@/infrastructure/chat/innovation-tools";
import {
  makeObservatoryTools,
  supportsObservatory,
} from "@/infrastructure/chat/observatory-tool";
import { makeReportTool } from "@/infrastructure/chat/report-tool";
import {
  getInnovationVideos,
  resolveInnovationSources,
} from "@/infrastructure/innovations/source";

export function makeChatAgent(
  model: LanguageModel,
  agentId?: AgentId,
): ChatAgent {
  return async function* (history, signal, log) {
    const started = Date.now();
    const config = getAgentConfiguration(agentId);
    const messages = compileHistory(history);
    const availableSources = [...config.sources];
    if (agentId === "odkrywaj") {
      for (const message of messages) {
        if (message.role !== "assistant") continue;
        try {
          const previous = JSON.parse(message.content);
          if (Array.isArray(previous.sourceIds))
            availableSources.push(
              ...resolveInnovationSources(
                previous.sourceIds.filter(
                  (id: unknown): id is string => typeof id === "string",
                ),
              ),
            );
        } catch {
          // Older replies may be plain text rather than a persisted answer.
        }
      }
    }
    type ModelAnswer = {
      message: string;
      areaLabel?: string;
      offers?: SupportOffer[];
      sourceIds?: string[];
      artifact?: AgentArtifact | null;
    };
    const schema: z.ZodType<ModelAnswer> = agentId
      ? agentOutputSchema
      : supportAnswerSchema;
    type ModelEvent = Extract<AgentEvent, { type: "model" }>;
    const calls: ModelEvent[] = [];
    const toolEvents: Extract<AgentEvent, { type: "tool" }>[] = [];
    const visualizations: ObservatoryVisualization[] = [];
    const tools: ToolSet = { read_report: makeReportTool() };
    if (agentId === "odkrywaj")
      Object.assign(
        tools,
        makeInnovationTools((sources) => {
          for (const source of sources) {
            const index = availableSources.findIndex(
              (existing) => existing.id === source.id,
            );
            if (index === -1) availableSources.push(source);
            else availableSources[index] = source;
          }
        }),
      );
    if (supportsObservatory(agentId))
      Object.assign(
        tools,
        makeObservatoryTools((visualization) => {
          if (
            visualizations.length < 4 &&
            !visualizations.some(
              (existing) =>
                existing.kind === visualization.kind &&
                existing.indicatorId === visualization.indicatorId &&
                existing.year === visualization.year,
            )
          )
            visualizations.push(visualization);
        }),
      );
    let streamError: unknown;
    // Aborts the provider call when the consumer closes this iterator early.
    const local = new AbortController();
    const result = streamText({
      model,
      instructions: config.instructions,
      messages,
      tools,
      stopWhen: isStepCount(3),
      // Reserve the final step for an answer; tool-only steps have no object
      // output and would otherwise exhaust the limit with an empty response.
      prepareStep: ({ stepNumber }) =>
        stepNumber >= 2 ? { toolChoice: "none", activeTools: [] } : {},
      output: Output.object({ schema }),
      maxOutputTokens: 4000,
      maxRetries: 0,
      abortSignal: AbortSignal.any([signal, local.signal]),
      onError({ error }) {
        streamError = error;
      },
      async onLanguageModelCallStart(event) {
        calls.push({
          type: "model",
          step: calls.length,
          model: event.modelId,
          provider: event.provider,
          usage: {},
          durationMs: 0,
          finishReason: "running",
        });
        await log?.(calls[calls.length - 1]);
      },
      async onLanguageModelCallEnd(event) {
        const call = calls.at(-1);
        if (call)
          calls[calls.length - 1] = {
            ...call,
            model: event.modelId,
            provider: event.provider,
            usage: {
              input: event.usage.inputTokens,
              output: event.usage.outputTokens,
            },
            durationMs: event.performance.responseTimeMs,
            firstTokenMs: event.performance.timeToFirstOutputMs,
            finishReason: event.finishReason,
          };
        if (call) await log?.(calls[calls.length - 1]);
      },
      async onStepEnd(event) {
        // Invalid input and unknown tool names have no execution-end callback.
        // Record the attempt, without promoting it to an allowed capability.
        for (const call of event.toolCalls) {
          if (!toolEvents.some((entry) => entry.id === call.toolCallId))
            toolEvents.push({
              type: "tool",
              id: call.toolCallId,
              name: call.toolName,
              input: call.input,
              output: { error: "tool_not_executed" },
              status: "error",
              durationMs: 0,
            });
        }
        for (const attempt of toolEvents) await log?.(attempt);
      },
      async onToolExecutionEnd(event) {
        toolEvents.push({
          type: "tool",
          id: event.toolCall.toolCallId,
          name: event.toolCall.toolName,
          input: event.toolCall.input,
          output:
            event.toolOutput.type === "tool-result"
              ? event.toolOutput.output
              : { error: "tool_execution_failed" },
          durationMs: event.toolExecutionMs,
          status:
            event.toolOutput.type === "tool-result" ? "complete" : "error",
        });
        await log?.(toolEvents[toolEvents.length - 1]);
      },
    });
    // Handle rejection immediately, including schema/provider errors while the
    // partial stream is still being consumed. No raw JSON enters the public UI.
    const output = Promise.resolve(result.output);
    void output.catch(() => {});
    let answer: ChatAnswer | undefined;
    let failure: unknown;
    let text = "";
    try {
      try {
        for await (const part of result.partialOutputStream) {
          if (typeof part.message === "string" && part.message !== text) {
            if (!part.message.startsWith(text))
              throw new Error("Non-monotonic model output");
            text = part.message;
            yield { type: "text", text };
          }
        }
        const generated = await output;
        const sources = resolveSources(generated.sourceIds ?? [], [
          ...new Map(
            availableSources.map((source) => [source.id, source]),
          ).values(),
        ]);
        const videos =
          agentId === "odkrywaj" ? getInnovationVideos(sources) : [];
        answer = {
          message: generated.message,
          areaLabel: generated.areaLabel ?? "Małopolska",
          offers: generated.offers ?? [],
          ...(visualizations.length ? { visualizations } : {}),
          ...(videos.length ? { videos } : {}),
          ...(agentId
            ? {
                sources,
                artifact:
                  agentId === "odkrywaj" ? null : (generated.artifact ?? null),
              }
            : {}),
        };
      } catch (error) {
        failure = streamError ?? error;
      }
      // Also record failed and aborted calls and executed tools. Never store the
      // provider request body, system prompt per message, or secret-bearing errors.
      for (const call of calls)
        yield call.finishReason === "running"
          ? {
              ...call,
              durationMs: Date.now() - started,
              finishReason: signal.aborted ? "aborted" : "error",
            }
          : call;
      for (const event of toolEvents) yield event;
      if (!answer) throw failure;
      yield { type: "answer", answer };
    } finally {
      local.abort();
    }
  };
}
