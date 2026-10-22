import { z } from "zod";

export const AgentDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.url(),
});

export const AgentDefinitionsSchema = z
  .array(AgentDefinitionSchema)
  .min(1)
  .refine(
    (agents) => new Set(agents.map((agent) => agent.id)).size === agents.length,
    "Agent IDs must be unique.",
  );

export const AgentsConfigSchema = z.object({ agents: AgentDefinitionsSchema });

export const AgentResponseSchema = z.object({
  message: z.string().min(1),
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
export type AgentOption = Readonly<Pick<AgentDefinition, "id" | "name">>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
