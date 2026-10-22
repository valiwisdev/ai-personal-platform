import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { getConfiguredAgent } from "@/lib/agents";
import { AgentErrorSchema } from "@/schemas/api";

export async function proxyAgentGet(
  agentId: string,
  path: string,
  schema: z.ZodType,
  fallbackError: string,
): Promise<NextResponse> {
  return proxyAgentRequest(agentId, path, "GET", fallbackError, schema);
}

export function proxyAgentDelete(
  agentId: string,
  path: string,
  fallbackError: string,
): Promise<NextResponse> {
  return proxyAgentRequest(agentId, path, "DELETE", fallbackError);
}

async function proxyAgentRequest(
  agentId: string,
  path: string,
  method: "GET" | "DELETE",
  fallbackError: string,
  schema?: z.ZodType,
): Promise<NextResponse> {
  const agent = getConfiguredAgent(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  try {
    const response = await fetch(new URL(path, agent.url), {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = AgentErrorSchema.safeParse(payload);
      return NextResponse.json(
        { error: detail.success ? detail.data.detail : fallbackError },
        { status: response.status < 500 ? response.status : 503 },
      );
    }
    if (method === "DELETE") return new NextResponse(null, { status: 204 });
    return NextResponse.json(schema!.parse(payload), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: fallbackError }, { status: 503 });
  }
}
