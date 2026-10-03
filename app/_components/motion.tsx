"use client";

import { type CSSProperties, Fragment, useEffect, useRef } from "react";

/** Thin bar under the header showing how far the reader is down the page. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const progress = max > 0 ? Math.min(root.scrollTop / max, 1) : 0;
      bar.current?.style.setProperty("--progress", String(progress));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <div ref={bar} aria-hidden="true" className="scroll-progress" />;
}

/**
 * Reveals every `[data-reveal]` element the first time it scrolls into view.
 * Content stays visible without JS: elements are only hidden once this runs,
 * and anything already on screen at that moment is marked shown immediately.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ];
    for (const el of targets) {
      // Already on screen: show as-is, no entrance.
      if (el.getBoundingClientRect().top < window.innerHeight)
        el.dataset.shown = "early";
    }
    document.documentElement.dataset.reveal = "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "view";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const el of targets)
      if (!("shown" in el.dataset)) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * Splits text into words (or letters) that rise out of a mask in sequence.
 * Screen readers get the plain text; the animated copy is hidden from them.
 */
export function RevealText({
  text,
  by = "word",
  delay = 0,
  step = 45,
}: {
  text: string;
  by?: "word" | "letter" | "line";
  delay?: number;
  step?: number;
}) {
  const joiner = by === "word" ? " " : "";
  const parts = by === "line" ? [text] : text.split(joiner);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((word, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static text, order never changes
          <Fragment key={i}>
            <span
              className="reveal-word"
              style={{ "--d": `${delay + i * step}ms` } as CSSProperties}
            >
              <span>{word}</span>
            </span>
            {joiner}
          </Fragment>
        ))}
      </span>
    </>
  );
}
