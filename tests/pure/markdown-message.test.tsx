import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownMessage } from "@/agents/markdown-message";

function render(text: string) {
  return renderToStaticMarkup(<MarkdownMessage>{text}</MarkdownMessage>);
}

test("agent Markdown renders headings, emphasis, lists, links and code", () => {
  const html = render(
    "## Plan\n\n**Ważne** i *przykład*.\n\n- Pierwszy krok\n- Drugi krok\n\n1. Test\n2. Ocena\n\n[Źródło](https://rops.krakow.pl)\n\n> Cytat\n\n`kod`\n\n```js\nconst wynik = 1;\n```",
  );
  for (const fragment of [
    "<h2>Plan</h2>",
    "<strong>Ważne</strong>",
    "<em>przykład</em>",
    "<ul>",
    "<li>Pierwszy krok</li>",
    "<ol>",
    '<a href="https://rops.krakow.pl">Źródło</a>',
    "<blockquote>",
    "<code>kod</code>",
    '<pre><code class="language-js">const wynik = 1;',
  ]) {
    assert.ok(html.includes(fragment), fragment);
  }
});

test("agent Markdown supports tables, task lists and strikethrough", () => {
  const html = render(
    "| Krok | Termin |\n| --- | --- |\n| Test | Maj |\n\n- [x] Gotowe\n\n~~Poprzedni plan~~",
  );
  assert.ok(html.includes('<div class="my-3 overflow-x-auto"><table>'));
  assert.ok(html.includes("<th>Krok</th>"));
  assert.ok(html.includes("<td>Maj</td>"));
  assert.ok(html.includes('type="checkbox"'));
  assert.ok(html.includes("<del>Poprzedni plan</del>"));
});

test("agent Markdown ignores raw HTML and blocks unsafe link protocols", () => {
  const html = render(
    '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[Link](javascript:alert%281%29)',
  );
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes("Link</a>"));
});

test("partial streamed Markdown remains renderable and final content is formatted", () => {
  const text =
    "## Plan\n\n**Ważne**\n\n[Źródło](https://rops.krakow.pl)\n\n```\nkod\n```";
  for (let end = 0; end <= text.length; end++) {
    assert.doesNotThrow(() => render(text.slice(0, end)));
  }
  assert.ok(render(text).includes("<strong>Ważne</strong>"));
  assert.ok(
    render("Pierwszy akapit.\n\nDrugi akapit.").includes(
      "<p>Drugi akapit.</p>",
    ),
  );
});
