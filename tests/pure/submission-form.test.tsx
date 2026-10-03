import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentComposer } from "@/agents/composer";
import { AgentSubmissionForm } from "@/agents/submission-form";

for (const source of ["dodaj-pomysl", "testuj-innowacje"] as const) {
  test(`${source} starts with a prefilled editable draft and next/cancel actions`, () => {
    const html = renderToStaticMarkup(
      <AgentSubmissionForm
        onCancel={() => {}}
        onSubmitted={() => {}}
        source={source}
        requestId="draft"
        artifact={{
          title: "Szkic",
          fields: [{ label: "Odbiorcy", value: "Seniorzy" }],
        }}
        identity={{ conversationId: "conversation", capability: "capability" }}
      />,
    );
    assert.match(html, /<textarea[^>]*>Seniorzy<\/textarea>/);
    assert.match(html, />Dalej</);
    assert.match(html, />Anuluj</);
    assert.doesNotMatch(html, /<details|name="email"/);
  });
}

test("the composer disables typing and sending while a form is open", () => {
  const html = renderToStaticMarkup(
    <AgentComposer
      agentId="dodaj-pomysl"
      value="Wiadomość"
      onChange={() => {}}
      onSubmit={() => {}}
      onStop={() => {}}
      pending={false}
      disabled
      inputRef={null}
    />,
  );
  assert.match(html, /<textarea[^>]*disabled/);
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /Czat zablokowany/);
});
