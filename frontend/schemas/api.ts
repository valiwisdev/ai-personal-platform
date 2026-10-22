import { z } from "zod";

export const ApiErrorSchema = z.object({ error: z.string().min(1) });

export const AgentErrorSchema = z.object({ detail: z.string().min(1) });
