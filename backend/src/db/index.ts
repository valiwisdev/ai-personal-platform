import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

export type Database = NodePgDatabase<typeof schema>;

export function createDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
  return { db: drizzle(pool, { schema }), pool };
}
