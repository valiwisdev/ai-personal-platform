# Backend

Fastify and Drizzle ORM service running on Bun. Owns PostgreSQL access for conversation history and saved chats. The [agents service](../agents/README.md) accesses it over HTTP.

## Quick start

For Docker, follow the [root quick start](../README.md). For native development, run `mise setup` from the repository root, then run:

```bash
cp backend/.env.example backend/.env
docker compose up -d db
mise -C backend run db-migrate
mise -C backend run dev
```

Open <http://localhost:3001/docs> for interactive API documentation.

Bun and Drizzle Kit load `backend/.env`; Docker uses the root `.env`. Set `DATABASE_URL` to match your PostgreSQL credentials and published port. Native connections use `localhost`; Docker uses the `db` service name. `PORT` controls the API port and `CORS_ORIGINS` accepts comma-separated browser origins.

## API

| Method | Path                         | Purpose                                                      |
| ------ | ---------------------------- | ------------------------------------------------------------ |
| GET    | `/health`                    | Check process health                                         |
| GET    | `/threads/:threadId/history` | Load native Pydantic AI history and its revision             |
| PUT    | `/threads/:threadId/history` | Save history and conversation metadata                       |
| GET    | `/conversations`             | List saved chats; optionally filter by `agentId`             |
| DELETE | `/conversations/:threadId`   | Delete a chat and its history; optionally scope by `agentId` |

Reuse the AG-UI `threadId` to continue a conversation. Save the revision returned when loading history; stale revisions return 409. History and conversation metadata are saved together in one transaction. Unknown threads return empty history with revision 0.

## Migrations

After editing [src/db/schema.ts](src/db/schema.ts), generate, review, and apply a migration:

```bash
mise -C backend run db-generate --name describe_change
mise -C backend run db-check
mise -C backend run db-migrate
```

Commit the generated SQL and metadata in `drizzle/`. Docker startup applies committed migrations before starting the server.

## Useful commands

Run these from the repository root:

| Command                         | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `mise -C backend run dev`       | Start the server with watch mode                 |
| `mise -C backend run check`     | Run lint, formatting, type, and migration checks |
| `mise -C backend run format`    | Apply formatting                                 |
| `mise -C backend run db-studio` | Open Drizzle Studio                              |
| `mise -C backend run logs`      | Follow container logs                            |

Bun runs TypeScript directly, so there is no build step. The backend has no dedicated test suite; the agents live API test checks persistence through its endpoints. See [mise.toml](mise.toml) for all tasks.
