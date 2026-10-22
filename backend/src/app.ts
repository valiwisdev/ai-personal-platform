import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import type { Database } from "./db/index.ts";
import { errorHandler } from "./errors.ts";
import { conversationRoutes } from "./routes/conversation.ts";
import { healthRoutes } from "./routes/health.ts";
import { threadRoutes } from "./routes/thread.ts";

const BODY_LIMIT_BYTES = 32 * 1024 * 1024;

export interface AppOptions {
  db: Database;
  corsOrigins: string[];
}

export async function buildApp({ db, corsOrigins }: AppOptions) {
  const app = Fastify({
    logger: true,
    bodyLimit: BODY_LIMIT_BYTES,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: corsOrigins,
    methods: ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"],
  });
  await app.register(swagger, {
    openapi: { info: { title: "Agent Platform Backend", version: "0.1.0" } },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
  app.get("/", { schema: { hide: true } }, (_, reply) =>
    reply.redirect("/docs"),
  );

  await app.register(healthRoutes);
  await app.register(threadRoutes, { prefix: "/threads", db });
  await app.register(conversationRoutes, { prefix: "/conversations", db });

  return app;
}
