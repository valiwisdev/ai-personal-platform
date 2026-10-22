import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { AgentsConfigSchema, type AgentDefinition } from "@/schemas/agents";

export function getConfiguredAgents(): AgentDefinition[] {
  const path = join(process.cwd(), "agents.yml");
  const source = readFileSync(path, "utf8");
  const configuration: unknown = parse(source);
  return AgentsConfigSchema.parse(configuration).agents;
}

export function getConfiguredAgent(
  agentId: string,
): AgentDefinition | undefined {
  return getConfiguredAgents().find((agent) => agent.id === agentId);
}
