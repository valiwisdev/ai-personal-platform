import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { conversations, threads } from "./db/schema.ts";

const nonEmpty = (schema: z.ZodString) => schema.min(1);

// z.json() is recursive; registering it gives its self-references an OpenAPI component.
const jsonValue = z.json();
z.globalRegistry.add(jsonValue, { id: "JsonValue" });

export class HealthSchemas {
  private constructor() {}

  static readonly response = z.strictObject({
    status: z.literal("ok"),
    service: z.literal("backend"),
  });
}

export class ErrorSchemas {
  private constructor() {}

  static readonly response = z.object({
    statusCode: z.number().int(),
    error: z.string(),
    message: z.string(),
  });
}

export class ConversationSchemas {
  private constructor() {}

  static readonly item = createSelectSchema(conversations, {
    threadId: nonEmpty,
    agentId: nonEmpty,
    title: nonEmpty,
  });
  static readonly params = ConversationSchemas.item
    .pick({ threadId: true })
    .strict();
  static readonly list = z.array(ConversationSchemas.item);
  static readonly listQuery = ConversationSchemas.item
    .pick({ agentId: true })
    .partial()
    .strict();
  static readonly emptyResponse = z.void();
}

export class ThreadSchemas {
  private constructor() {}

  private static readonly messagePart = z
    .object({ part_kind: z.string().min(1) })
    .catchall(jsonValue);
  private static readonly message = z
    .object({
      kind: z.enum(["request", "response"]),
      parts: z.array(ThreadSchemas.messagePart),
    })
    .catchall(jsonValue);
  private static readonly thread = createSelectSchema(threads, {
    threadId: nonEmpty,
    messages: z.array(ThreadSchemas.message),
    messageIds: z.array(z.string().min(1)),
    revision: (schema) => schema.nonnegative(),
  });

  static readonly params = ThreadSchemas.thread
    .pick({ threadId: true })
    .strict();
  static readonly history = ThreadSchemas.thread
    .omit({ threadId: true })
    .strict();
  static readonly saveBody = ThreadSchemas.history.extend(
    ConversationSchemas.item.pick({ agentId: true, title: true }).shape,
  );
}
