import { and, eq } from "drizzle-orm";
import type { Database } from "../db/index.ts";
import {
  conversations as conversationsTable,
  threads,
  type Thread,
} from "../db/schema.ts";
import { ConflictError, ErrorMessages } from "../errors.ts";
import { BaseService, type Transaction } from "./base.ts";
import { ConversationService, type ConversationEntry } from "./conversation.ts";

export type ThreadHistory = Omit<Thread, "threadId">;
export type ThreadSave = ThreadHistory & ConversationEntry;

const emptyHistory: ThreadHistory = {
  messages: [],
  messageIds: [],
  revision: 0,
};

export class ThreadService extends BaseService {
  private readonly conversations: ConversationService;

  constructor(db: Database) {
    super(db);
    this.conversations = new ConversationService(db);
  }

  async get(threadId: string): Promise<ThreadHistory> {
    const history = await this.db.query.threads.findFirst({
      columns: { messages: true, messageIds: true, revision: true },
      where: eq(threads.threadId, threadId),
    });
    return history ?? emptyHistory;
  }

  async save(threadId: string, body: ThreadSave): Promise<ThreadHistory> {
    const history = {
      messages: body.messages,
      messageIds: body.messageIds,
      revision: body.revision + 1,
    };
    return this.db.transaction(async (tx) => {
      const saved =
        body.revision === 0
          ? await this.insertHistory(tx, threadId, history)
          : await this.updateHistory(tx, threadId, body.revision, history);
      if (!saved) throw new ConflictError(ErrorMessages.HistoryConflict);
      await this.conversations.upsert(threadId, body, tx);
      return history;
    });
  }

  async delete(threadId: string, agentId?: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Match save's lock order: thread first, then conversation metadata.
      const conversation = await tx.query.conversations.findFirst({
        where: and(
          eq(conversationsTable.threadId, threadId),
          agentId ? eq(conversationsTable.agentId, agentId) : undefined,
        ),
      });
      if (!conversation) return;
      await tx.delete(threads).where(eq(threads.threadId, threadId));
      await this.conversations.delete(threadId, agentId, tx);
    });
  }

  private async insertHistory(
    tx: Transaction,
    threadId: string,
    history: ThreadHistory,
  ): Promise<boolean> {
    const rows = await tx
      .insert(threads)
      .values({ threadId, ...history })
      .onConflictDoNothing()
      .returning({ threadId: threads.threadId });
    return rows.length > 0;
  }

  private async updateHistory(
    tx: Transaction,
    threadId: string,
    revision: number,
    history: ThreadHistory,
  ): Promise<boolean> {
    const rows = await tx
      .update(threads)
      .set(history)
      .where(
        and(eq(threads.threadId, threadId), eq(threads.revision, revision)),
      )
      .returning({ threadId: threads.threadId });
    return rows.length > 0;
  }
}
