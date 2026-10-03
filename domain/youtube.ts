const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Extract an ID only from a supported YouTube URL or an exact video ID. */
export function getYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (videoIdPattern.test(input)) return input;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port
  ) {
    return null;
  }

  let id: string | null = null;
  if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") {
    id = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1] ?? null;
  } else if (youtubeHosts.has(url.hostname)) {
    if (
      url.pathname === "/watch" &&
      !url.hostname.endsWith("youtube-nocookie.com")
    ) {
      id = url.searchParams.get("v");
    } else {
      const pathPattern = url.hostname.endsWith("youtube-nocookie.com")
        ? /^\/embed\/([A-Za-z0-9_-]{11})\/?$/
        : /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/;
      id = pathPattern.exec(url.pathname)?.[1] ?? null;
    }
  }
  return id && videoIdPattern.test(id) ? id : null;
}
