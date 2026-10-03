import type { HistoryMessage } from "@/domain/chat/types";

// Drop oldest complete turns, never half of a user/assistant pair. Storage is
// unbounded by this prompt budget; diagnostics and browser data stay out.
export function selectHistory(
  history: HistoryMessage[],
  maxChars = 24000,
  maxMessages = 20,
) {
  const groups: HistoryMessage[][] = [];
  for (const message of history) {
    if (!message.content.trim()) continue;
    if (message.role === "user") groups.push([message]);
    else groups.at(-1)?.push(message);
  }
  const selected: HistoryMessage[][] = [];
  let chars = 0;
  let count = 0;
  for (const group of groups.reverse()) {
    const size = group.reduce((sum, m) => sum + m.content.length, 0);
    if (chars + size > maxChars || count + group.length > maxMessages) break;
    selected.unshift(group);
    chars += size;
    count += group.length;
  }
  return selected.flat();
}

export function compileHistory(
  history: HistoryMessage[],
  maxChars = 24000,
  maxMessages = 20,
) {
  return selectHistory(history, maxChars, maxMessages).map(
    ({ role, content }) => ({ role, content }),
  );
}
