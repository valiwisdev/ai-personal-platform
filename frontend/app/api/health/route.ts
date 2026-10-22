import { NextResponse } from "next/server";
import { getConfiguredAgents } from "@/lib/agents";

export async function GET(request: Request) {
  try {
    const agentId = new URL(request.url).searchParams.get("agent");
    const agents = getConfiguredAgents();
    const agent = agentId
      ? agents.find((item) => item.id === agentId)
      : agents[0];
    if (!agent) {
      return NextResponse.json({ status: "unavailable" }, { status: 404 });
    }
    const response = await fetch(new URL("/health", agent.url), {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
