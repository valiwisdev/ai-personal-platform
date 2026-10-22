import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { getConfiguredAgents } from "@/lib/agents";

const agents: Record<string, HttpAgent> = {};
for (const definition of getConfiguredAgents()) {
  agents[definition.id] = new HttpAgent({ url: definition.url });
}

const runtime = new CopilotRuntime({ agents });

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
