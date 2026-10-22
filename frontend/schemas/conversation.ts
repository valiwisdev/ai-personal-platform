import { z } from "zod";

export const ConversationSchema = z.object({
  threadId: z.string().min(1),
  agentId: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
});

export type Conversation = z.output<typeof ConversationSchema>;
