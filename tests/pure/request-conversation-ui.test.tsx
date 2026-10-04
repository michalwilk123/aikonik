import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ConversationMessages,
  RequestConversation,
  type RequestThread,
} from "@/app/(public)/zgloszenia/[id]/request-conversation";
import { SubmissionReceipt } from "@/components/submission-receipt";

const thread: RequestThread = {
  id: "request-id",
  subject: "Pomysł sąsiedzki",
  submittedAt: "2026-10-04T08:00:00Z",
  status: "new",
  message: "Moje zgłoszenie",
  artifact: {
    title: "Szkic pomysłu",
    fields: [{ label: "Cel", value: "Integracja" }],
  },
  messages: [
    {
      id: "a",
      author: "staff",
      body: "Proszę doprecyzować budżet <script>",
      authorName: "Anna Kowalska",
      createdAt: "2026-10-04T09:00:00Z",
    },
    {
      id: "b",
      author: "customer",
      body: "Budżet wynosi 5000 zł",
      createdAt: "2026-10-04T10:00:00Z",
    },
  ],
};

test("public conversation HTML is generic until browser authentication", () => {
  const html = renderToStaticMarkup(<RequestConversation id="request-id" />);
  assert.match(html, /Sprawdzanie dostępu/);

  assert.doesNotMatch(
    html,
    /Pomysł sąsiedzki|request-id|Moje zgłoszenie|password/,
  );
});

test("conversation shows original submission, artifact, both authors and safely escaped replies", () => {
  const html = renderToStaticMarkup(<ConversationMessages thread={thread} />);
  for (const text of [
    "Moje zgłoszenie",

    "Integracja",
    "Anna Kowalska",
    "Budżet wynosi 5000 zł",
  ])
    assert.ok(html.includes(text));
  assert.match(html, /dateTime="2026-10-04T09:00:00Z"/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

for (const notification of ["sent", "pending", "disabled", "failed"] as const) {
  test(`submission receipt accurately describes ${notification} mail delivery`, () => {
    const html = renderToStaticMarkup(
      <SubmissionReceipt receipt={{ id: "reference", notification }} />,
    );
    assert.match(html, /Numer zgłoszenia: reference/);
    assert.match(html, /href="\/zgloszenia\/reference"/);
    assert.match(html, /Każda odpowiedź pracownika/);
    assert.doesNotMatch(html, /środowisko deweloperskie/);
    if (notification === "sent") assert.match(html, /Wysłaliśmy/);
    else {
      assert.doesNotMatch(html, /Wysłaliśmy/);
      assert.match(
        html,
        notification === "pending"
          ? /nie został jeszcze wysłany/
          : notification === "failed"
            ? /Nie udało się wysłać e-maila/
            : /obecnie niedostępna/,
      );
    }
  });
}

test("development conversation link is shown only when included in the receipt", () => {
  const html = renderToStaticMarkup(
    <SubmissionReceipt
      receipt={{
        id: "reference",
        notification: "disabled",
        devConversationURL: "/zgloszenia/reference#private",
      }}
    />,
  );
  assert.match(html, /href="\/zgloszenia\/reference#private"/);
  assert.match(html, /referrerPolicy="no-referrer"/);
});
