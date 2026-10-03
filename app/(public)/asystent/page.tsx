import { redirect } from "next/navigation";
import { agentHref, agentIdFromSlug, defaultAgentId } from "@/agents/registry";

export default async function AssistantPage({
  searchParams,
}: PageProps<"/asystent">) {
  const { agent } = await searchParams;
  // Preserve existing links that used ?agent=<id>.
  const id = typeof agent === "string" ? agentIdFromSlug(agent) : undefined;
  redirect(agentHref(id ?? defaultAgentId));
}
