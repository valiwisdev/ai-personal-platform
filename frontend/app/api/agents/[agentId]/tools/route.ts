import { proxyAgentGet } from "@/lib/agent-proxy";
import { AgentToolsSchema } from "@/schemas/tools";

type RouteContext = {
  params: Promise<{ agentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { agentId } = await context.params;
  return proxyAgentGet(
    agentId,
    "/tools",
    AgentToolsSchema,
    "Could not load agent tools.",
  );
}
