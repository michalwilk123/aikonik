import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { agentIds } from "@/agents/registry";
import { StreamedMessage } from "@/agents/streamed-message";

const content =
  "udostępnienie przestrzeni i osobiste zaangażowanie. Wartości funkcjonalne i emocjonalne są już jasne.\n\nZastanówmy się teraz nad stroną organizacyjną – **Kto będzie Twoim głównym wsparciem (aktorami zmiany)?** Czy planujesz współpracę z kimś?";

test("every agent renders the reported message as bold text rather than raw Markdown", () => {
  for (const agentId of agentIds) {
    const html = renderToStaticMarkup(
      <StreamedMessage
        message={{
          id: crypto.randomUUID(),
          agentId,
          role: "assistant",
          content,
          createdAt: new Date().toISOString(),
        }}
        pending={false}
        animate={false}
        onRevealed={() => {}}
      />,
    );
    assert.ok(
      html.includes(
        "<strong>Kto będzie Twoim głównym wsparciem (aktorami zmiany)?</strong>",
      ),
      `${agentId} must render emphasis`,
    );
    assert.ok(
      !html.includes("**Kto"),
      `${agentId} must not expose Markdown delimiters`,
    );
  }
});
