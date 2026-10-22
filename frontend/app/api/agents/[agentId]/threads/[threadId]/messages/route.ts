import { proxyAgentGet } from "@/lib/agent-proxy";
import { HistoryMessagesSchema } from "@/schemas/history";

type RouteContext = {
  params: Promise<{ agentId: string; threadId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { agentId, threadId } = await context.params;
  return proxyAgentGet(
    agentId,
    `/threads/${encodeURIComponent(threadId)}/messages`,
    HistoryMessagesSchema,
    "Could not load conversation history.",
  );
}
