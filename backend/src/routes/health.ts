import type {
  FastifyPluginCallbackZod,
  ZodTypeProvider,
} from "@fastify/type-provider-zod";
import { HealthSchemas } from "../schemas.ts";

export const healthRoutes: FastifyPluginCallbackZod = (instance, _, done) => {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Check service health without querying the database",
        response: { 200: HealthSchemas.response },
      },
    },
    () => ({ status: "ok", service: "backend" }) as const,
  );

  done();
};
