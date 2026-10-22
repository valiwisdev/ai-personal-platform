import type { JSONType } from "zod";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type ModelMessagePart = { part_kind: string; [key: string]: JSONType };

export type ModelMessage = {
  kind: "request" | "response";
  parts: ModelMessagePart[];
  [key: string]: JSONType;
};

export const threads = pgTable("agent_threads", {
  threadId: text("id").primaryKey(),
  messages: jsonb("messages").$type<ModelMessage[]>().notNull(),
  messageIds: jsonb("message_ids").$type<string[]>().notNull(),
  revision: integer("revision").notNull(),
});
export type Thread = typeof threads.$inferSelect;

export const conversations = pgTable("conversations", {
  threadId: text("thread_id").primaryKey(),
  agentId: text("agent_id").notNull(),
  title: text("title").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
export type Conversation = typeof conversations.$inferSelect;
