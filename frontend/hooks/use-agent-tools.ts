"use client";

import { useEffect, useMemo, useState } from "react";
import type { AbstractAgent } from "@copilotkit/react-core/v2";
import useSWR from "swr";
import { agentApiPath, fetchJson } from "@/lib/agent-api";
import { AgentToolsSchema, type AgentTool } from "@/schemas/tools";

function fetchTools(url: string): Promise<AgentTool[]> {
  return fetchJson(url, AgentToolsSchema, "Could not load agent tools.");
}

export function useAgentTools(
  agentId: string,
  agent: AbstractAgent,
  isHistoryLoaded: boolean,
) {
  const url = isHistoryLoaded ? agentApiPath(agentId, "/tools") : null;
  const {
    data: tools,
    error,
    mutate,
  } = useSWR<AgentTool[], Error>(url, fetchTools);
  const [disabledTools, setDisabledTools] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const enabledTools = useMemo(
    () =>
      (tools ?? [])
        .filter((tool) => tool.available && !disabledTools.has(tool.name))
        .map((tool) => tool.name),
    [tools, disabledTools],
  );

  useEffect(() => {
    if (isHistoryLoaded && tools) {
      agent.setState({ ...agent.state, enabledTools });
    }
  }, [agent, tools, isHistoryLoaded, enabledTools]);

  function setToolEnabled(name: string, enabled: boolean) {
    const tool = tools?.find((candidate) => candidate.name === name);
    if (agent.isRunning || !tool?.available) {
      return;
    }
    setDisabledTools((current) => {
      const next = new Set(current);
      if (enabled) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return {
    tools,
    enabledTools,
    error: error?.message ?? null,
    setToolEnabled,
    retry: () => void mutate(),
  };
}
