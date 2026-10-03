import { getYouTubeVideoId } from "@/domain/youtube";

export function YouTubeVideo({ url, title }: { url: string; title: string }) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  const videoTitle = title.trim() || "Film o innowacji społecznej";
  return (
    <figure className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
      <iframe
        className="aspect-video min-h-[200px] w-full border-0"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={videoTitle}
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <figcaption className="px-4 py-3 text-sm text-on-surface-variant">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          {videoTitle} · YouTube
        </a>
      </figcaption>
    </figure>
  );
}
