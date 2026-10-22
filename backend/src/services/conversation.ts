import { and, desc, eq } from "drizzle-orm";
import { conversations, type Conversation } from "../db/schema.ts";
import { BaseService, type Transaction } from "./base.ts";

export type ConversationEntry = Pick<Conversation, "agentId" | "title">;

export class ConversationService extends BaseService {
  async list(agentId?: string): Promise<Conversation[]> {
    return this.db.query.conversations.findMany({
      where: agentId ? eq(conversations.agentId, agentId) : undefined,
      orderBy: [desc(conversations.updatedAt), desc(conversations.threadId)],
    });
  }

  async upsert(
    threadId: string,
    { agentId, title }: ConversationEntry,
    tx?: Transaction,
  ): Promise<void> {
    const entry = { agentId, title, updatedAt: new Date() };
    await this.executor(tx)
      .insert(conversations)
      .values({ threadId, ...entry })
      .onConflictDoUpdate({ target: conversations.threadId, set: entry });
  }

  async delete(
    threadId: string,
    agentId?: string,
    tx?: Transaction,
  ): Promise<Conversation[]> {
    return this.executor(tx)
      .delete(conversations)
      .where(
        and(
          eq(conversations.threadId, threadId),
          agentId ? eq(conversations.agentId, agentId) : undefined,
        ),
      )
      .returning();
  }
}
