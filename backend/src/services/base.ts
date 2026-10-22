import type { Database } from "../db/index.ts";

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type Executor = Database | Transaction;

export abstract class BaseService {
  constructor(protected readonly db: Database) {}

  protected executor(tx?: Transaction): Executor {
    return tx ?? this.db;
  }
}
