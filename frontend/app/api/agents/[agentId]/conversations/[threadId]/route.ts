import { proxyAgentDelete } from "@/lib/agent-proxy";

type RouteContext = {
  params: Promise<{ agentId: string; threadId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { agentId, threadId } = await context.params;
  return proxyAgentDelete(
    agentId,
    `/conversations/${encodeURIComponent(threadId)}`,
    "Could not delete conversation.",
  );
}
