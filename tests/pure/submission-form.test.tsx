import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentComposer } from "@/agents/composer";
import { AgentSubmissionForm } from "@/agents/submission-form";
import { manualDraft } from "@/agents/submission-template";
import { getAgentConfiguration } from "@/infrastructure/chat/agent-config";

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

for (const source of ["dodaj-pomysl", "testuj-innowacje"] as const) {
  test(`${source} requires AI to explicitly decide draft readiness`, () => {
    const schema = getAgentConfiguration(source).outputSchema;
    const output = {
      message: "Szkic",
      sourceIds: [],
      artifact: {
        title: "Szkic",
        fields: [{ label: "Problem", value: "Samotność" }],
      },
    };
    assert.equal(schema.safeParse(output).success, false);
    for (const ready of [false, true]) {
      assert.equal(
        schema.safeParse({ ...output, artifact: { ...output.artifact, ready } })
          .success,
        true,
      );
    }
  });
}

test("the manual form lists every field and keeps values from the draft", () => {
  const draft = manualDraft("testuj-innowacje", {
    title: "Plan testu innowacji",
    fields: [
      { label: "Uczestnicy", value: "10 seniorów" },
      { label: "Dodatkowe", value: "Uwagi" },
    ],
  });
  assert.equal(draft.fields.length, 8);
  assert.deepEqual(draft.fields[2], {
    label: "Uczestnicy",
    value: "10 seniorów",
  });
  assert.equal(draft.fields[0]?.value, "");
  assert.deepEqual(draft.fields.at(-1), { label: "Dodatkowe", value: "Uwagi" });
  assert.equal(manualDraft("dodaj-pomysl", null).title, "Mój pomysł");
});
