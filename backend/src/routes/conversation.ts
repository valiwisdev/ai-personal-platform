import type {
  FastifyPluginCallbackZod,
  ZodTypeProvider,
} from "@fastify/type-provider-zod";
import type { Database } from "../db/index.ts";
import { ConversationSchemas, ErrorSchemas } from "../schemas.ts";
import { ConversationService } from "../services/conversation.ts";
import { ThreadService } from "../services/thread.ts";

export const conversationRoutes: FastifyPluginCallbackZod<{ db: Database }> = (
  instance,
  { db },
  done,
) => {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const service = new ConversationService(db);
  const threads = new ThreadService(db);

  server.get(
    "/",
    {
      schema: {
        tags: ["Conversations"],
        summary:
          "List saved conversations, optionally filtered by agent, newest activity first",
        querystring: ConversationSchemas.listQuery,
        response: {
          200: ConversationSchemas.list,
          400: ErrorSchemas.response,
        },
      },
    },
    async (request) => service.list(request.query.agentId),
  );

  server.delete(
    "/:threadId",
    {
      schema: {
        tags: ["Conversations"],
        summary:
          "Delete a saved conversation and its messages, optionally scoped to an agent",
        params: ConversationSchemas.params,
        querystring: ConversationSchemas.listQuery,
        response: {
          204: ConversationSchemas.emptyResponse,
          400: ErrorSchemas.response,
        },
      },
    },
    async (request, reply) => {
      await threads.delete(request.params.threadId, request.query.agentId);
      return reply.code(204).send();
    },
  );

  done();
};
