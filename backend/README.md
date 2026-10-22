# Backend

Fastify and Drizzle ORM service running on Bun. It owns PostgreSQL access for native Pydantic AI history of AG-UI threads and the saved conversation list. The [agents service](../agents/README.md) accesses conversations and history over HTTP and has no database connection.

## Structure

```text
backend/
├── src/
│   ├── app.ts            # buildApp: compilers, error handler, plugins, and routes
│   ├── index.ts          # Database pool, listen, and graceful shutdown
│   ├── errors.ts         # ConflictError and the Fastify error handler
│   ├── db/
│   │   ├── index.ts      # PostgreSQL pool and typed Drizzle client
│   │   └── schema.ts     # threads (agent_threads) and conversations tables
│   ├── schemas.ts        # HealthSchemas, ErrorSchemas, ConversationSchemas, ThreadSchemas
│   ├── routes/          # Health, thread history, and conversation plugins
│   └── services/        # BaseService plus thread and conversation queries
├── drizzle/             # Committed SQL migrations and metadata
├── drizzle.config.ts
├── mise.toml
└── bun.lock
```

Route plugins receive the database through typed options. `src/schemas.ts` holds one Zod schema class per area, deriving table-backed fields from the Drizzle tables with `drizzle-zod`; dates are serialized as ISO strings. Services use Drizzle's inferred table types and have no HTTP dependencies. Request bodies may be up to 32 MiB so history saves can carry base64 chat attachments; larger bodies return 413. Client errors return `{ statusCode, error, message }` (`ErrorSchemas.response`); unexpected failures are logged and return a generic 500. `buildApp` registers Swagger before routes using the Zod schema transform and never listens, so it can be exercised with `inject()`; `index.ts` listens and closes the database pool during shutdown. The backend is TypeScript only: Bun runs `src/` directly, with no build step.

## Local development

Complete the [root setup](../README.md) first, then run from the repository root:

```bash
cp backend/.env.example backend/.env
docker compose up -d db
mise -C backend run db-migrate
mise -C backend run dev
```

The API defaults to <http://localhost:3001>. Bun loads `backend/.env` when running local tasks; Drizzle Kit also loads it. Compose supplies values from the root `.env`.

| Variable       | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | Required PostgreSQL connection string for the API and Drizzle Kit |
| `PORT`         | HTTP port; defaults to `3001`                                     |
| `CORS_ORIGINS` | Comma-separated browser origins; empty by default                 |

If database credentials or the published port change, update `backend/.env` accordingly. Native connections use `localhost`; Compose uses the `db` service name. CORS allows the methods these endpoints use, including history PUT requests.

## API

Swagger UI is served at `/docs`, with OpenAPI JSON at `/docs/json` and YAML at `/docs/yaml`.

| Method | Path                         | Behavior                                                                     |
| ------ | ---------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/health`                    | Process health without a database query                                      |
| GET    | `/threads/:threadId/history` | Load native Pydantic AI history and its revision                             |
| PUT    | `/threads/:threadId/history` | Save history and its conversation entry if the revision is current           |
| GET    | `/conversations`             | List saved conversations, newest activity first; optional `?agentId=` filter |
| DELETE | `/conversations/:threadId`   | Delete a conversation and its messages; optional `?agentId=` scope           |

Unknown fields and invalid requests return 400.

Thread IDs are AG-UI `threadId` values: nonempty strings stored as PostgreSQL `text`. An unknown thread returns:

```json
{ "messages": [], "messageIds": [], "revision": 0 }
```

`messages` contains serialized Pydantic AI `ModelMessage`s. Each message must have `kind` `request` or `response` and `parts` tagged by `part_kind`; other fields are stored unchanged, so the format follows Pydantic AI. `messageIds` lists the nonempty AG-UI message IDs already consumed. Submit the loaded revision when saving, along with the agent ID and conversation title. The backend atomically increments the revision and returns 409 for stale revisions, preventing lost updates. The agents service needs `BACKEND_URL` to use these endpoints.

Conversations are keyed by thread ID and store the owning agent ID, a short title, and the last activity timestamp. Each successful history save creates or updates the thread's conversation entry in the same database transaction, so the saved list always matches persisted history. `DELETE /conversations/:threadId` removes both the conversation entry and its saved messages in one transaction. An optional `agentId` query parameter restricts deletion to the owning agent; an unknown or mismatched conversation is a no-op with a 204 response.

## Commands

Run tasks from the root with `mise -C backend run <task>`, or inside `backend/` with `mise <task>`.

| Task                       | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `setup`                    | Install dependencies from `bun.lock`                     |
| `dev`                      | Start Bun with watch mode                                |
| `start`                    | Run the TypeScript server with Bun                       |
| `lint` / `lint-fix`        | Check / fix ESLint findings                              |
| `format-check` / `format`  | Check / apply Prettier formatting                        |
| `typecheck`                | Check TypeScript types                                   |
| `db-generate` / `db-check` | Generate migrations / check migration history            |
| `db-migrate` / `db-studio` | Apply migrations / open Drizzle Studio                   |
| `check`                    | Run lint, formatting, type, and migration-history checks |
| `logs` / `shell`           | Follow container logs / open its shell                   |
| `clean-cache`              | Remove application caches                                |
| `clean-deps`               | Remove only this application's `node_modules`            |

After editing `src/db/schema.ts`, generate and review a migration:

```bash
mise -C backend run db-generate --name describe_change
mise -C backend run db-check
mise -C backend run db-migrate
```

Commit the SQL, metadata, and `bun.lock`. Schema generation is explicit. Docker startup waits for healthy PostgreSQL and applies only committed migrations before starting the server; it never generates migrations. `BACKEND_PORT` defaults to `3001`, and root `mise down` preserves database volumes.

## Checks

Run `mise -C backend run check` for ESLint, Prettier, TypeScript, and migration-history validation. The backend has no dedicated test suite; the agents live API test verifies history and conversation persistence through these HTTP endpoints.
