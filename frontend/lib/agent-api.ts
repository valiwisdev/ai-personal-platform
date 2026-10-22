import type { z } from "zod";
import { ApiErrorSchema } from "@/schemas/api";

export function agentApiPath(agentId: string, path: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}${path}`;
}

export async function fetchJson<Schema extends z.ZodType>(
  url: string,
  schema: Schema,
  fallbackError: string,
  signal?: AbortSignal,
): Promise<z.output<Schema>> {
  const response = await fetch(url, { cache: "no-store", signal });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(payload);
    throw new Error(error.success ? error.data.error : fallbackError);
  }
  return schema.parse(payload);
}
