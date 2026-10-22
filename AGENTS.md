# Repository Guidelines

## Project Structure

- Next.js frontend in `frontend/`: `app/` for routes, `components/` for UI, `hooks/` for client hooks, `lib/` for shared helpers, and `schemas/` for Zod schemas.
- FastAPI in `agents/src/app/`: `api/` for routes, `agents/` for agents (`agents/base/` holds `BaseAgent`, `AgentDeps`, and the shared provider model; `agents/specs/agents/` holds one Pydantic AI `AgentSpec` YAML file per agent with its name, description, and instructions, loaded with `BaseAgent(spec=...)`, and `agents/specs/prompts/` holds Handlebars prompt templates used by code, such as `enabled_tools.yaml` and `summarize.yaml`, so keep prompt text out of Python; tools live in `agents/tools/`, and the summarize tool is a single direct model request, not a sub-agent; if a real sub-agent is added later, use Pydantic AI agent delegation via a tool that calls `child.run(..., deps=ctx.deps, usage=ctx.usage)`; every agent extends `BaseAgent`, which builds its tool catalog from its function toolsets (label in tool `metadata`) and adds the `EnabledTools` capability that filters tools and adds tool-selection instructions; put per-run tool policy in capabilities, not toolsets or skills), `dependencies/` for FastAPI dependencies: the pooled backend `httpx` client and the `HistoryClient` and `ConversationClient` built on it, injected into routes with `Depends` (they are clients of the backend, not application services), `tools/` for toolsets, `core/` for settings. Agents service tests live in `agents/tests/`.
- Backend in `backend/`, using Bun for dependency management, scripts, and runtime: `src/routes/` for route plugins, `src/schemas.ts` for all Zod request and response schemas, `src/services/` for business logic (services extend `BaseService`, which holds the database and an `executor(tx?)` helper; each service writes only its own table and accepts an optional transaction for cross-service atomic writes), and `src/errors.ts` for thrown exceptions and the Fastify error handler. `src/app.ts` builds the Fastify app (compilers, error handler, plugins, and routes) without listening; `src/index.ts` creates the database, builds the app, listens, and handles graceful shutdown.
- Root `compose.yaml`, `mise.toml`, `.env.example`, and `README.md` coordinate development. Preserve official scaffold output unless integration requires a change.
- GitHub Actions workflows in `.github/workflows/` and their shell scripts in `.github/workflows/scripts/`. The `Agents` workflow calls `test_agents.sh` to start Uvicorn, wait for health, run the live API test, and stop the server.

## Service Boundaries

- The agents service is independent of PostgreSQL. Do not add database settings, drivers, connection helpers, a database health endpoint, or a Compose dependency on `db`. The TypeScript Fastify backend owns PostgreSQL access through Drizzle.
- The assistant agent returns `AgentResponse` through `NativeOutput(AgentResponse)` with a required nonempty `message` field. Preserve this structured response contract in the live API test.
- Frontend agent registry IDs must match each service's `AGENT_ID` so the saved conversation list associates chats with the right agent.

## Backend Conventions

- Drizzle PostgreSQL layout: `src/db/schema.ts` declares tables, `src/db/index.ts` creates the pool/client, `drizzle.config.ts` configures Drizzle Kit, and `drizzle/` contains committed SQL migrations and metadata.
- Keep every HTTP schema in the single `src/schemas.ts` file, separate from the database declarations in `src/db/schema.ts`, with one static class per area (`HealthSchemas`, `ErrorSchemas`, `ConversationSchemas`, `ThreadSchemas`): readonly schema fields and a private constructor. Derive table-backed fields from the Drizzle tables with `drizzle-zod` (`createSelectSchema`, `createInsertSchema`, `createUpdateSchema`) and narrow them with refinements, `pick`, and `omit` instead of redefining columns by hand. Thread messages are serialized Pydantic AI `ModelMessage`s: validate their `kind` and `part_kind` tags and pass other fields through, so Pydantic AI upgrades do not require backend changes. Name thread identifiers after AG-UI (`threadId`, message IDs). Services depend only on `src/db/`: type their inputs and results from Drizzle's inferred table types (`Thread`, `Conversation`) and return Drizzle rows; response schemas use `z.date()`, which the type provider documents as `date-time` strings.
- Keep the backend structure small: one `tsconfig.json`, no test folder/task, and no infrastructure plugin wrappers. Commit `bun.lock`; do not add a generated client or use pnpm in the backend.
- Fastify patterns: use `@fastify/type-provider-zod` and Zod request/response schemas with `validatorCompiler` and `serializerCompiler`. Use a synchronous `FastifyPluginCallbackZod` with `done()` for route registration without asynchronous work, an explicit local `withTypeProvider<ZodTypeProvider>()` binding, and typed plugin options for database injection. Use `z.output` for explicitly typed transformed request queries.
- Lifecycle: await async registration/startup; keep signal listeners synchronous and delegate to async shutdown. Keep `buildApp` free of process concerns so it works with `inject()`, and keep `src/index.ts` limited to environment configuration, the database pool and its shutdown hook, `listen`, and signal handling.
- API docs: register `@fastify/swagger` before routes using the Zod `jsonSchemaTransform`, and serve Swagger UI at `/docs`. Keep route tags, summaries, request schemas, and response schemas accurate.
- Include explicit Node.js and Bun type declarations.
- The backend is TypeScript only: Bun runs `src/` directly with no build step or `dist/` output, imports use `.ts` specifiers, and configuration files such as `eslint.config.ts` are TypeScript. `typecheck` runs `tsc --noEmit`.

## Build, Test, and Development Commands

### Setup

- `mise trust` and `mise install` enable the versions declared in `mise.toml`; run once.
- `mise setup` installs tools, trusts the application configs, and invokes their setup tasks.

### Task layout

- Root `mise.toml` contains shared tool versions, `setup` for installing all application dependencies, whole-stack Docker commands, aggregate cleanup tasks, and GitHub/Git workflow tasks. Keep development, quality checks, tests, database, application cleanup implementations, and application container tasks in each application's `mise.toml`.
- Run application tasks with `mise -C <folder> run <task>` from the root, or `mise <task>` inside `backend/`, `frontend/`, or `agents/`. Each local config inherits tool versions and sets its own working directory.
- Each application defines `dev`, `lint`, `format-check`, `typecheck`, `check`, `logs`, `shell`, `clean-cache`, and `clean-deps`. Frontend and agents also define `test`; frontend tests use lint and type checks. Backend checks cover lint, formatting, type checking, and migration history.

### Database

- Backend database commands are `mise -C backend run db-generate --name describe_change`, `db-check`, and `db-migrate`. Generation is explicit; Docker startup applies only committed migrations. Bun and its Docker image use the version declared in root mise.

### Docker

- Root `mise dev` builds and starts the Docker stack; `mise ps` shows status, `mise logs-db` follows PostgreSQL logs, and `mise down` stops the stack while preserving volumes.
- `docker compose config` validates Compose configuration, and `docker compose up --build` builds and starts all services. Rebuild containers after dependency or Dockerfile changes.

### Cleanup

- Root `mise clean-cache` and `mise clean-deps` delegate to all three application configs. Root `clean-cache` also removes the project-local `.pnpm-store/` and `.ruff_cache/`, preserving installed dependencies and global package caches. Local `clean-cache` tasks preserve dependencies; `clean-deps` removes only the owning application's dependency directory. Root `mise setup` reinstalls all application dependencies.

### GitHub and Git workflows

- `mise create-issue` selects a Markdown issue template by its frontmatter name and passes it to `gh issue create --template`; accept only `bug-report` and `feature-request` as selectors. Templates must be recognized on the default branch, and their names must be unique across Markdown templates and YAML forms.
- `mise create-issue-branch <number> --name <type>/<slug>` creates, links, and checks out an issue branch. It shares branch naming validation with `create-stack` in `scripts/lib/branch_name.sh`; use names such as `feat/api`, `docs/guide`, or `fix/login`.
- `mise create-pr` creates a pull request with `.github/pull_request_template.md`. `mise install-gh-stack` installs the `gh stack` extension. `mise create-stack` opens a menu of common stack actions and requires a clean working tree to initialize. Order branch names from the bottom layer to the top.

### Tool selection

- Mise selects Node.js, Bun, pnpm, Python, uv, and GitHub CLI from `mise.toml` while working in this repository. Use `mise x -- <command>` for direct tool commands, or enable shell activation to put the selected tools on `PATH` automatically when entering the repository.

## Coding Style & Naming Conventions

- Follow generated Next.js, TypeScript, ESLint, Prettier, and Tailwind conventions.
- Use strict TypeScript, PascalCase React components, and camelCase functions and values.
- Python uses Ruff, four-space indentation, snake_case names, and type annotations for application interfaces.
- Keep modules focused and configuration environment-based; use `@/*` imports where appropriate.

## Testing Guidelines

- Add agents service tests under `agents/tests/` with names such as `test_health.py`; test HTTP endpoints with the configured `httpx` client. Place frontend tests beside features if a test framework is added.
- Run relevant tests and lint/type checks before proposing changes; report only checks actually run.
- Live API test (`agents/tests/api/test_agent_api.py`): test through the real HTTP endpoint and configured model provider; do not replace it with a mocked agent or `TestModel`. Send a complete AG-UI payload and verify matching thread/run IDs, streamed JSON validated with `AgentResponse.model_validate_json`, a nonempty `message`, a successful `RUN_FINISHED` outcome, and no `RUN_ERROR` events. Use separate assertions for independent conditions. Ordinary pytest runs skip this test when `AGENT_API_URL` is unset; `mise -C agents run test-agent` requires an explicitly exported target and sends one real model request.
- The `Agents` workflow runs on relevant pull requests and manual dispatches, with no push trigger on `main`. It requires the `OPENCODE_API_KEY` repository secret and fails clearly when it is unavailable. Keep token permissions read-only and do not use `pull_request_target` to expose secrets to fork code.
- Distinguish local test results, skipped live tests, and workflow runs actually executed by GitHub Actions.

## Commit & Pull Request Guidelines

- Use a conventional commit type in each subject: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `chore:`, or `revert:`. An optional scope is allowed, as in `feat(frontend): add chat history`. The commit-message hook validates this format.
- Run relevant application lint and type checks with mise before proposing changes.
- Use the issue forms in `.github/ISSUE_TEMPLATE/` to track personal work and follow `.github/pull_request_template.md` when opening pull requests.

## Security & Configuration

- Copy `.env.example` for local configuration; never commit real environment files or credentials.
- Keep internal URLs and database credentials server-side; expose only intentional public values with `NEXT_PUBLIC_`.
- Keep runtime URLs in environment configuration and example values in `.env.example` files, except the frontend agent registry, which is configured server-side in `frontend/agents.yml`.
- Require `DATABASE_URL` for the backend and Drizzle Kit and `OPENCODE_BASE_URL` for agent requests.
- Compose reads service and container health-check URLs from the root environment; do not embed URL fallbacks in application code or Compose.
