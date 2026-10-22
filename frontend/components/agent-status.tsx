"use client";

import useSWR from "swr";
import { useAgent } from "@copilotkit/react-core/v2";
import { Badge } from "@/components/ui/badge";

type Health = { status: string };
type AgentStatus = "offline" | "checking" | "online";

async function fetchHealth(url: string): Promise<Health> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not fetch health status");
  }
  return response.json();
}

function getStatus(
  data: Health | undefined,
  error: unknown,
  isLoading: boolean,
): AgentStatus {
  if (error) {
    return "offline";
  } else if (isLoading) {
    return "checking";
  } else if (data?.status === "ok") {
    return "online";
  } else {
    return "offline";
  }
}

function fortmatAgentStatus(agentId: string | undefined, isReady?: boolean) {
  if (!agentId) return "";
  const formatted = agentId.charAt(0).toUpperCase() + agentId.slice(1);
  return isReady ? `${formatted} (online)`  : `${formatted} (not ready)`;
}

export function AgentStatus({ agentId }: Readonly<{ agentId: string }>) {
  const { agent, isReady } = useAgent({ agentId });
  const url = `/api/health?agent=${encodeURIComponent(agentId)}`;
  const { data, error, isLoading } = useSWR<Health>(url, fetchHealth);
  const status = getStatus(data, error, isLoading);

  return (
    <Badge
      role="status"
      className="gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 font-normal text-slate-600"
    >
      <span
        aria-hidden
        data-status={status}
        className="size-1.5 rounded-full bg-slate-300 data-[status=online]:bg-green-700"
      />
      {fortmatAgentStatus(agent?.agentId, isReady)}
    </Badge>
  );
}
