import { z } from "zod";

export const AgentToolsSchema = z.array(
  z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    description: z.string(),
    available: z.boolean(),
  }),
);

export type AgentTool = z.infer<typeof AgentToolsSchema>[number];
