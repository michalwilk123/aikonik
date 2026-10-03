import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { agentIds, agents } from "@/agents/registry";
import { StreamedMessage } from "@/agents/streamed-message";
import { AgentTopBar } from "@/agents/top-bar";
import type { AgentId, AgentMessage, AgentReply } from "@/agents/types";
import { AgentWelcome } from "@/agents/welcome";

test("assistant navigation exposes five text-only agents with one selected tab", () => {
  const html = renderToStaticMarkup(
    <AgentTopBar activeAgent="wiedza" onSwitch={() => {}} />,
  );
  assert.equal((html.match(/<button/g) ?? []).length, 5);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.ok(!html.includes("<svg"));
  assert.ok(!html.includes(">Odkrywaj<"));
  for (const id of agentIds) assert.ok(html.includes(agents[id].label));
});

test("new agents introduce separate project matching and statistical exploration", () => {
  const match = renderToStaticMarkup(
    <AgentWelcome agentId="odkrywaj" onPick={() => {}} />,
  );
  const knowledge = renderToStaticMarkup(
    <AgentWelcome agentId="wiedza" onPick={() => {}} />,
  );
  assert.ok(match.includes("dopyta o Twoją sytuację"));
  assert.ok(match.includes("dokumentacją i filmami"));
  assert.ok(knowledge.includes("dane statystyczne"));
  assert.ok(knowledge.includes("wykresach i mapach"));
  assert.ok(!knowledge.includes("biblioteka-innowacji-spolecznych/kategorie"));
});

function message(agentId: AgentId): AgentMessage {
  return {
    id: "d065b17d-43b7-40a8-a78e-9167e7e47c13",
    agentId,
    role: "assistant",
    content: "Odpowiedź z danymi.",
    createdAt: "2026-10-03T10:00:00.000Z",
  };
}

function renderAnswer(agentId: AgentId, kind: "map" | "bar") {
  const reply: AgentReply = {
    requestId: "6fd2f3c4-eb6c-4e4a-a63c-1da859828572",
    message: message(agentId),
    sources: [
      {
        id: "source",
        title: "Dokumentacja projektu",
        url: "https://rops.krakow.pl/dokumentacja",
        excerpt: "Fragment źródła",
      },
    ],
    artifact: { title: "Szkic", fields: [{ label: "Pole", value: "Wartość" }] },
    videos: [
      {
        projectId: "project",
        title: "Film projektu",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
    visualizations: [
      {
        indicatorId: 135,
        title: "Statystyka testowa",
        year: 2024,
        sourceUrl: "https://obserwator.rops.krakow.pl/trendanalysis/135",
        kind,
        points: [{ id: "POW_8", label: "Kraków", value: 1.15 }],
      },
    ],
    model: "fixture",
  };
  return renderToStaticMarkup(
    <StreamedMessage
      message={reply.message}
      reply={reply}
      pending={false}
      animate={false}
      onRevealed={() => {}}
    />,
  );
}

test("Wiedza shows charts and maps while Dopasuj shows project videos", () => {
  for (const kind of ["map", "bar"] as const) {
    const match = renderAnswer("odkrywaj", kind);
    const knowledge = renderAnswer("wiedza", kind);
    assert.ok(match.includes("youtube-nocookie.com/embed/"));
    assert.ok(!match.includes("Statystyka testowa"));
    assert.ok(knowledge.includes("Statystyka testowa"));
    assert.ok(!knowledge.includes("youtube-nocookie.com/embed/"));
    assert.ok(match.includes("Źródła"));
    assert.ok(match.includes("Dokumentacja projektu"));
    assert.ok(knowledge.includes("Źródła"));
    assert.ok(knowledge.includes("Dokumentacja projektu"));
    assert.ok(!match.includes("Roboczy szkic"));
    assert.ok(!knowledge.includes("Roboczy szkic"));
    assert.ok(
      !renderAnswer("wdrazanie-innowacji", kind).includes("Statystyka testowa"),
    );
    const rollout = renderAnswer("wdrazanie-innowacji", kind);
    assert.ok(rollout.includes("Źródła"));
    assert.ok(rollout.includes("youtube-nocookie.com/embed/"));
    assert.ok(rollout.includes("Roboczy szkic"));
    assert.ok(rollout.includes("Wartość"));
    assert.ok(!renderAnswer("dodaj-pomysl", kind).includes("Źródła"));
    assert.ok(!renderAnswer("testuj-innowacje", kind).includes("Źródła"));
  }
});
