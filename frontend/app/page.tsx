import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { AgentChat } from "@/components/agent-chat";
import { getConfiguredAgents } from "@/lib/agents";

type HomeProps = Readonly<{
  searchParams: Promise<{
    agent?: string | string[];
    thread?: string | string[];
  }>;
}>;

export default async function Home({ searchParams }: HomeProps) {
  const { agent, thread } = await searchParams;
  const definitions = getConfiguredAgents();
  const selectedAgent = definitions.find(
    (definition) => definition.id === agent,
  );
  if (!selectedAgent) {
    const defaultAgent = definitions[0];
    redirect(
      `/?agent=${encodeURIComponent(defaultAgent.id)}&thread=${randomUUID()}`,
    );
  }
  if (typeof thread !== "string" || !thread) {
    redirect(
      `/?agent=${encodeURIComponent(selectedAgent.id)}&thread=${randomUUID()}`,
    );
  }
  const agents = definitions.map(({ id, name }) => ({ id, name }));
  return (
    <AgentChat agentId={selectedAgent.id} agents={agents} threadId={thread} />
  );
}
