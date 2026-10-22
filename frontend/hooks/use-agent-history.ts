"use client";

import { useCallback, useEffect, useState } from "react";
import { useAgent, type AbstractAgent } from "@copilotkit/react-core/v2";
import { agentApiPath, fetchJson } from "@/lib/agent-api";
import { HistoryMessagesSchema } from "@/schemas/history";

const HISTORY_ERROR = "Could not load your conversation. Please try again.";

export function useAgentHistory(agentId: string, threadId: string) {
  const { agent, isReady } = useAgent({ agentId });
  const [hydratedAgent, setHydratedAgent] = useState<AbstractAgent | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const isLoaded = isReady && hydratedAgent === agent;

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const controller = new AbortController();
    const url = agentApiPath(
      agentId,
      `/threads/${encodeURIComponent(threadId)}/messages`,
    );

    fetchJson(url, HistoryMessagesSchema, HISTORY_ERROR, controller.signal)
      .then((messages) => {
        agent.setMessages(messages);
        agent.setState({});
        setError(null);
        setHydratedAgent(agent);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : HISTORY_ERROR);
        }
      });
    return () => controller.abort();
  }, [agent, agentId, isReady, threadId, attempt]);

  const retryHistory = useCallback(() => {
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  return { agent, isLoaded, error, retryHistory };
}
