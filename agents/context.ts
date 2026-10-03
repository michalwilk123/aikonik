import type { AgentMessage, AgentSource } from "@/agents/types";

// Keep whole recent turns within the validated server request budget.
export function selectAgentHistory(messages: AgentMessage[]): AgentMessage[] {
  const groups: AgentMessage[][] = [];
  for (const message of messages) {
    if (message.role === "user") groups.push([message]);
    else groups.at(-1)?.push(message);
  }
  const selected: AgentMessage[][] = [];
  let chars = 0;
  let count = 0;
  for (const group of groups.reverse()) {
    const length = group.reduce(
      (size, message) => size + message.content.length,
      0,
    );
    if (chars + length > 32000 || count + group.length > 24) break;
    selected.unshift(group);
    chars += length;
    count += group.length;
  }
  return selected.flat();
}

export function resolveSources(
  ids: string[],
  available: AgentSource[],
): AgentSource[] {
  const uniqueIds = new Set(ids);
  return available.filter((source) => uniqueIds.has(source.id));
}
