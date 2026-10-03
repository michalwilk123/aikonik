"use client";

import { useEffect, useRef, useState } from "react";
import { advanceReveal, graphemeBoundaries } from "@/domain/chat/reveal";

// Aiwise's received/displayed buffer with one animation clock. New network
// packets update the target without cancelling or delaying the next frame.
export function useSmoothText(target: string, animateOnMount = true) {
  const [length, setLength] = useState(animateOnMount ? 0 : target.length);
  const current = useRef(length);
  const carry = useRef(0);
  const received = useRef({ text: "", boundaries: [] as number[] });
  const schedule = useRef<() => void>(() => {});

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    const snap = () => {
      current.current = received.current.text.length;
      carry.current = 0;
      setLength(current.current);
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const tick = (now: number) => {
      frame = 0;
      if (media.matches) return snap();
      const { text, boundaries } = received.current;
      const next = advanceReveal(
        text,
        current.current,
        now - last,
        carry.current,
        boundaries,
      );
      last = now;
      current.current = next.length;
      carry.current = next.carry;
      setLength(next.length);
      if (next.length < text.length) frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (media.matches) return snap();
      if (!frame && current.current < received.current.text.length) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    schedule.current = start;
    media.addEventListener("change", start);
    return () => {
      schedule.current = () => {};
      media.removeEventListener("change", start);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!target.startsWith(received.current.text)) {
      current.current = 0;
      carry.current = 0;
      setLength(0);
    }
    received.current = { text: target, boundaries: graphemeBoundaries(target) };
    schedule.current();
  }, [target]);

  return target.slice(0, length);
}
