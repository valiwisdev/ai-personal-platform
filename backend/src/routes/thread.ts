import type {
  FastifyPluginCallbackZod,
  ZodTypeProvider,
} from "@fastify/type-provider-zod";
import type { Database } from "../db/index.ts";
import { ErrorSchemas, ThreadSchemas } from "../schemas.ts";
import { ThreadService } from "../services/thread.ts";

export const threadRoutes: FastifyPluginCallbackZod<{ db: Database }> = (
  instance,
  { db },
  done,
) => {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const service = new ThreadService(db);

  server.get(
    "/:threadId/history",
    {
      schema: {
        tags: ["Threads"],
        summary:
          "Load an AG-UI thread's native Pydantic AI history; unknown threads have revision zero",
        params: ThreadSchemas.params,
        response: {
          200: ThreadSchemas.history,
          400: ErrorSchemas.response,
        },
      },
    },
    async (request) => service.get(request.params.threadId),
  );

  server.put(
    "/:threadId/history",
    {
      schema: {
        tags: ["Threads"],
        summary:
          "Save native Pydantic AI history and its conversation entry if the revision is current",
        params: ThreadSchemas.params,
        body: ThreadSchemas.saveBody,
        response: {
          200: ThreadSchemas.history,
          400: ErrorSchemas.response,
          409: ErrorSchemas.response,
        },
      },
    },
    async (request) => service.save(request.params.threadId, request.body),
  );

  done();
};
