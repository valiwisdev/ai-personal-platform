"use client";

import { useEffect, useRef, useState } from "react";
import type { AbstractAgent } from "@copilotkit/react-core/v2";
import useSWR from "swr";
import { agentApiPath, fetchJson } from "@/lib/agent-api";
import { ConversationSchema, type Conversation } from "@/schemas/conversation";
import { ApiErrorSchema } from "@/schemas/api";

function fetchConversations(url: string): Promise<Conversation[]> {
  return fetchJson(
    url,
    ConversationSchema.array(),
    "Could not load your conversations.",
  );
}

export function useConversations(
  agentId: string,
  agent: AbstractAgent,
  isLoaded: boolean,
) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleting = useRef(false);
  const { data, error, mutate } = useSWR<Conversation[], Error>(
    agentApiPath(agentId, "/conversations"),
    fetchConversations,
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const subscription = agent.subscribe({
      onRunFinishedEvent: () => void mutate(),
    });
    return () => subscription.unsubscribe();
  }, [agent, isLoaded, mutate]);

  async function deleteConversation(threadId: string): Promise<boolean> {
    if (deleting.current || agent.isRunning) return false;
    deleting.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(
        agentApiPath(agentId, `/conversations/${encodeURIComponent(threadId)}`),
        { method: "DELETE" },
      );
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const parsed = ApiErrorSchema.safeParse(payload);
        throw new Error(
          parsed.success ? parsed.data.error : "Could not delete conversation.",
        );
      }
      await mutate(
        (current) =>
          current?.filter((conversation) => conversation.threadId !== threadId),
        { revalidate: false },
      );
      return true;
    } catch (cause: unknown) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "Could not delete conversation.",
      );
      return false;
    } finally {
      deleting.current = false;
      setIsDeleting(false);
    }
  }

  return {
    conversations: data ?? [],
    error: deleteError ?? error?.message ?? null,
    isDeleting,
    deleteConversation,
  };
}
