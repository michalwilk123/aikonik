import { notFound, redirect } from "next/navigation";
import { agentHref, agentIdFromSlug } from "@/agents/registry";

export default async function AgentPage({
  params,
}: PageProps<"/asystent/[agent]">) {
  const { agent } = await params;
  const id = agentIdFromSlug(agent);
  if (!id) notFound();
  if (agent === "odkrywaj") redirect(agentHref(id));
  return null;
}
