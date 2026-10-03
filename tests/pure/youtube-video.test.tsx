import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { YouTubeVideo } from "@/agents/youtube-video";
import { getYouTubeVideoId } from "@/domain/youtube";

const videoId = "M7lc1UVf-VE";

test("YouTube parser accepts source URL formats and exact video IDs", () => {
  for (const value of [
    videoId,
    ` https://www.youtube.com/watch?v=${videoId}&feature=share `,
    `http://youtube.com/watch?v=${videoId}`,
    `https://m.youtube.com/watch?v=${videoId}`,
    `https://youtu.be/${videoId}?si=tracking`,
    `https://www.youtube.com/embed/${videoId}`,
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    `https://www.youtube.com/shorts/${videoId}`,
    `https://www.youtube.com/live/${videoId}/`,
  ]) {
    assert.equal(getYouTubeVideoId(value), videoId, value);
  }
});

test("YouTube parser rejects arbitrary hosts, credentials, protocols and malformed IDs", () => {
  for (const value of [
    "",
    "not a URL",
    "M7lc1UVf-V",
    `https://youtube.com.evil.example/watch?v=${videoId}`,
    `https://evil.example/watch?v=${videoId}`,
    `https://youtube.com@evil.example/watch?v=${videoId}`,
    `https://user@youtube.com/watch?v=${videoId}`,
    `https://youtube.com:444/watch?v=${videoId}`,
    `javascript:youtube.com/watch?v=${videoId}`,
    `ftp://youtube.com/watch?v=${videoId}`,
    `//youtube.com/watch?v=${videoId}`,
    `https://youtu.be/${videoId}/extra`,
    "https://youtube.com/watch?v=bad%22%3E%3Cscript%3E",
    "https://youtube.com/playlist?list=PL123",
    `https://youtube.com/channel/${videoId}`,
    `https://youtube-nocookie.com/watch?v=${videoId}`,
  ]) {
    assert.equal(getYouTubeVideoId(value), null, value);
  }
});

test("YouTube video renders a lazy, accessible privacy enhanced player without source parameters", () => {
  const html = renderToStaticMarkup(
    <YouTubeVideo
      url={`https://youtu.be/${videoId}?autoplay=1&si=tracking`}
      title="Seniorzy razem"
    />,
  );
  assert.ok(
    html.includes(`src="https://www.youtube-nocookie.com/embed/${videoId}"`),
  );
  assert.ok(html.includes('title="Seniorzy razem"'));
  assert.ok(html.includes('loading="lazy"'));
  assert.ok(html.includes('referrerPolicy="strict-origin-when-cross-origin"'));
  assert.ok(html.includes(`href="https://www.youtube.com/watch?v=${videoId}"`));
  assert.ok(!html.includes("autoplay"));
  assert.ok(!html.includes("tracking"));
});

test("YouTube video cannot render an arbitrary iframe and supplies a missing title", () => {
  assert.equal(
    renderToStaticMarkup(
      <YouTubeVideo url="https://evil.example/embed/video" title="Film" />,
    ),
    "",
  );
  const html = renderToStaticMarkup(<YouTubeVideo url={videoId} title="  " />);
  assert.ok(html.includes('title="Film o innowacji społecznej"'));
});
