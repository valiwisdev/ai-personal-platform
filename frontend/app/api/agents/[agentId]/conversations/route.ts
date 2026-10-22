import { proxyAgentGet } from "@/lib/agent-proxy";
import { ConversationSchema } from "@/schemas/conversation";

type RouteContext = {
  params: Promise<{ agentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { agentId } = await context.params;
  return proxyAgentGet(
    agentId,
    "/conversations",
    ConversationSchema.array(),
    "Could not load conversations.",
  );
}
