import type { Message } from "@copilotkit/react-core/v2";
import { AgentResponseSchema } from "@/schemas/agents";

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function toAgentMessage(message: Message): Message {
  if (message.role !== "assistant" || typeof message.content !== "string") {
    return message;
  }
  const response = AgentResponseSchema.safeParse(parseJson(message.content));
  return response.success
    ? { ...message, content: response.data.message }
    : message;
}

export function toAgentMessages(messages: Message[]): Message[] {
  return messages.map(toAgentMessage);
}
