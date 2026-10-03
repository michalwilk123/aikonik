// Smooth, deterministic speed adjustment. Animation is a presentation buffer,
// never the source of truth for persistence or conversation history.
export function graphemeBoundaries(text: string) {
  return Array.from(
    new Intl.Segmenter("pl", { granularity: "grapheme" }).segment(text),
    ({ index, segment }) => index + segment.length,
  );
}

export function advanceReveal(
  text: string,
  current: number,
  elapsedMs: number,
  carry: number,
  boundaries = graphemeBoundaries(text),
) {
  if (current > text.length) return { length: text.length, carry: 0 };
  const backlog = text.length - current;
  if (!backlog) return { length: current, carry: 0 };
  const charactersPerSecond = 65 + Math.min(220, backlog * 0.55);
  const budget = carry + (charactersPerSecond * Math.min(elapsedMs, 80)) / 1000;
  const desired = Math.min(text.length, current + Math.floor(budget));
  // Complete graphemes, including accents, flags and ZWJ emoji. The hook
  // caches boundaries per target so frames do not rescan the entire text.
  let length = current;
  if (desired > current) {
    let low = 0;
    let high = boundaries.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (boundaries[middle] < desired) low = middle + 1;
      else high = middle;
    }
    length = boundaries[low] ?? text.length;
  }
  return { length, carry: budget - Math.floor(budget) };
}
