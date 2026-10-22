# AI Personal Platform

A full-stack agent platform with a Next.js frontend, a Bun/Fastify backend, and a FastAPI service for Pydantic AI agents. The frontend selects agents from a YAML registry and restores conversations persisted in PostgreSQL through the backend.

This project was built using my own knowledge and AI assistance for code generation, design, and documentation.

The idea behind this project is  to provide a personal AI platform that allows users to interact with various AI agents, manage their conversations, and store their data securely. Also manage coding tasks, documents, and personal information in a unified interface.

## Services

| Service    | Default local address   | Responsibility                                                   | Documentation                         |
| ---------- | ----------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| Frontend   | <http://localhost:3000> | Agent selection, chat, and server-side API proxies               | [Frontend README](frontend/README.md) |
| Backend    | <http://localhost:3001> | Native conversation history, saved conversations, and PostgreSQL | [Backend README](backend/README.md)   |
| Agents     | <http://localhost:8000> | Pydantic AI runs, AG-UI streams, and frontend history conversion | [Agents README](agents/README.md)     |
| PostgreSQL | `localhost:5432`        | Backend-owned storage                                            | [Compose configuration](compose.yaml) |

## Setup

The project requires [mise](https://mise.jdx.dev/) and Docker Compose. Setup runs from the repository root:

```bash
cp .env.example .env
mise trust
mise install
mise setup
```

Set `OPENCODE_API_KEY` in `.env` before running agents. Keep the required `OPENCODE_BASE_URL`, `BACKEND_URL`, `DATABASE_URL`, and health-check URLs from `.env.example`, adjusting them for your deployment. Root `DATABASE_URL` uses Docker's `db` service name; native backend development uses a host-accessible URL in `backend/.env`. Container health checks use container ports, independently of published host ports.

The frontend agent registry lives in [frontend/agents.yml](frontend/agents.yml), rather than environment variables. Its checked-in URL uses Docker's `agents` service name. For native frontend development, change it to `http://127.0.0.1:8000/agent`. See each application's README for its local configuration and startup commands.

## Development

The development stack starts in the background with:

```bash
mise dev
```

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:3001/conversations>
- Backend Swagger UI: <http://localhost:3001/docs>
- Agents API documentation: <http://localhost:8000/docs>

The backend waits for PostgreSQL and applies committed migrations during startup. The agents service has no database driver or Compose dependency on PostgreSQL; it uses `BACKEND_URL` to load and save history once the backend is available. Dependency or Dockerfile changes require a rebuild with `mise dev`.

| Command                         | Purpose                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `mise setup`                    | Installs tools and dependencies for all applications                              |
| `mise dev`                      | Builds and starts the full stack                                                  |
| `mise ps`                       | Shows service status                                                              |
| `mise -C agents run test-agent` | Tests one real model request and persisted history; requires exported target URLs |
| `mise -C <folder> run check`    | Runs an application's checks                                                      |
| `mise -C <folder> run logs`     | Follows an application's container logs                                           |
| `mise clean-cache`              | Removes application caches, local pnpm store, and root Ruff cache                 |
| `mise clean-deps`               | Removes installed dependencies from all applications                              |
| `mise down`                     | Stops the stack while preserving database volumes                                 |

Each application has its own `mise.toml`, inheriting tool versions from the root. The root configuration contains dependency setup, whole-stack Docker commands, and GitHub/Git workflow tasks; run application commands through their local configs. You can also run commands within an application:

```bash
mise -C backend run dev
mise -C backend run db-generate --name describe_change
mise -C frontend run lint
mise -C agents run test
```

Inside `backend/`, `frontend/`, or `agents/`, `mise dev` starts that application locally. Use root `mise dev`, `mise ps`, and `mise down` for the full stack; `mise down` preserves database volumes. `mise setup` trusts each application config and installs all dependencies. `mise trust --all` trusts the root and application configs explicitly.

After `mise clean-deps`, `mise setup` reinstalls dependencies.

## Agents and conversation history

Add running agent services to `frontend/agents.yml` with a unique ID, display name, and run URL. The frontend validates the file and registers each endpoint with CopilotKit. Each service must provide its run endpoint, `/health`, `/threads/{thread_id}/messages`, and `/conversations`. Endpoint URLs remain server-side. Restart the frontend after changing the registry.

Conversation URLs contain the selected `agent` and `thread`. Refresh or reopen the same URL to restore messages. Selecting another agent or **New chat** starts a fresh thread.

The Python service loads native Pydantic AI history from the backend, filters previously consumed input, and saves completed runs through the backend's revision-checked API. Failed or interrupted runs are not saved. The frontend receives converted AG-UI messages without system instructions or reasoning.

Completed runs also save conversation metadata (agent ID, title, activity time) to the backend in the same transaction as the history, so the frontend's **Chat history** list is persisted in PostgreSQL instead of the browser.

The assistant agent returns `NativeOutput(AgentResponse)` with a required nonempty `message`, such as `{"message":"Hello!"}`. The frontend displays that message as assistant text.

The frontend uses the shadcn `dashboard-01` app shell. The app sidebar provides **Agents**, **Coding**, **Documents**, and **Personal** navigation links, and a separate agent panel beside the chat contains **New chat**, the configured agent selector, and saved chat history. The header contains the sidebar toggle, chat title, and agent status; CopilotKit's `CopilotChat` fills the chat area. On phones, the agent panel becomes a compact bar below the header with an 8rem agent selector, a chat-history selector that fills the remaining space, and a **New chat** icon button. The app sidebar opens as a sheet from the header toggle. **Settings** at the bottom of the agent panel opens tool preferences and general settings, replacing the chat controls with settings navigation; **Back to chat** restores them. On phones, open Settings from the header. Saved chats can be deleted with the trash button after confirmation, which removes their messages as well.

Use **+** in the chat input to attach images or PDFs (up to 10 MB each). Attachments are sent inline with the message as AG-UI input content and saved with the thread's native history. Use the wrench button next to it to enable or disable the assistant's tools, such as the summarize tool; it is hidden for agents without tools. Choices apply to subsequent messages in the current chat view; opening another chat or reloading restores defaults. Controls are locked while a response is running. Tools marked unavailable on the server cannot be enabled from the frontend. The frontend's API routes proxy the agents service and pass its error details (for example, a missing model configuration or `BACKEND_URL`) through to the chat.

The agent is instructed to decline summarization when the summarize tool is disabled, rather than perform those tasks itself. General questions that do not require tools can still be answered.

The agents service exposes its tool catalog at `GET /tools`. AG-UI clients can send `state.enabledTools` as an array of tool names with each `/agent` request. An empty array disables all tools; omitting the field uses server defaults. Unknown names and malformed selections return HTTP 422. The service applies each selection independently without changing the shared agent.

## Agent observability

The agents service includes optional Pydantic Logfire tracing for requests, agents, tools, model calls, and outgoing HTTP calls. Set `LOGFIRE_TOKEN` in the root `.env` and recreate the agents container to export to your Logfire project. Model and tool content capture is off by default. See the [agents Logfire setup](agents/README.md#logfire-tracing) for native development and configuration.

## Checks

Run application checks from the repository root:

```bash
mise -C agents run check
mise -C backend run check
mise -C frontend run check
```

Agents tests are grouped under `tests/api/`, `tests/conversations/`, `tests/history/`, and `tests/tools/`, with shared fixtures and helpers. Ordinary pytest runs skip the live model request when `AGENT_API_URL` is unset. The backend checks include migration history; it has no dedicated test suite. Frontend tests run lint and type checks.

With the backend and agents services running, verify one real model response and saved history:

```bash
export AGENT_API_URL=http://127.0.0.1:8000
export BACKEND_URL=http://127.0.0.1:3001
mise -C agents run test-agent
```

Use host-accessible URLs for these test commands. The [Agents workflow](.github/workflows/agents.yml) runs the live test on relevant pull requests and manual dispatches. It starts PostgreSQL and both services, applies backend migrations, and requires the `OPENCODE_API_KEY` repository secret. It has read-only token permissions and no push trigger on `main`.

## Issues and pull requests

Issue creation supports interactive selection or an explicit template:

```bash
mise create-issue
mise create-issue --template bug-report
mise create-issue --template feature-request
```

The issue branch command creates a linked branch. After changes are committed and pushed, the PR command opens a pull request:

```bash
mise create-issue-branch <issue-number> --name feat/add-search
mise create-pr
```

Running `mise create-issue-branch` without arguments prompts for an issue and branch name. Branch names follow patterns such as `feat/add-search`, `docs/update-guide`, or `fix/login-error`.

Issue templates and the PR checklist live in [.github](.github/). CLI issue creation uses Markdown templates from the default branch; YAML forms are available in GitHub's web interface. Template names must be unique across both formats.

## Stacked pull requests

The following commands install the extension and open the stack menu:

```bash
mise install-gh-stack
mise create-stack
```

The menu supports initialization, linking, viewing, syncing, rebasing, submitting, and merging. Initialization requires a clean working tree and branch names ordered from bottom to top:

```bash
mise create-stack feat/api feat/ui
```

Branches use conventional prefixes such as `feat/`, `docs/`, or `fix/`. The link action also accepts PR numbers.
