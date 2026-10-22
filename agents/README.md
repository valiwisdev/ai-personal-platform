# Agents

FastAPI and Pydantic AI service using Python and uv. It runs agents over AG-UI, loads conversation history through the [backend](../backend/README.md), and saves completed runs along with their conversation metadata. PostgreSQL access belongs entirely to the backend.

## Structure

```text
agents/
├── src/app/
│   ├── main.py                  # App setup and router registration
│   ├── api/routes/              # Agent, conversations, history, and health endpoints
│   ├── dependencies/            # FastAPI dependencies for the backend API
│   │   ├── backend.py           # Pooled httpx client created in the app lifespan
│   │   ├── conversations.py     # Conversation metadata and ConversationClient
│   │   └── history.py           # Native history, filtering, and HistoryClient
│   ├── agents/                 # Agents, their specs, and their tools
│   │   ├── assistant.py        # The served assistant agent
│   │   ├── base/               # BaseAgent, AgentDeps, EnabledTools capability, provider model
│   │   ├── specs/              # YAML specs and their loaders
│   │   │   ├── agents/         # One Pydantic AI AgentSpec per agent (assistant)
│   │   │   └── prompts/        # Handlebars prompt templates (enabled_tools, summarize)
│   │   └── tools/              # summarize tool and tool-selection models
│   └── core/                   # Environment settings
├── tests/
│   ├── api/                    # HTTP endpoints and AG-UI
│   ├── conversations/          # Conversation metadata and persistence client
│   ├── history/                # History filtering and persistence client
│   ├── tools/                  # Tool selection and the summarize tool
│   ├── helpers/                # Streaming assertions and HTTP responders
│   └── conftest.py             # Shared inputs, histories, and client fixtures
├── mise.toml
├── pyproject.toml
└── uv.lock
```

## Local development

Complete the [root setup](../README.md) first. Start the backend with its committed migrations applied, then create the agents configuration:

```bash
cp agents/.env.example agents/.env
```

Set `OPENCODE_API_KEY`, `OPENCODE_BASE_URL`, and `BACKEND_URL` in that file, then start the service from the repository root:

```bash
mise -C agents run dev
```

The default local address is <http://localhost:8000>; interactive API documentation is at `/docs`. Native execution loads `agents/.env`, while Compose supplies values from the root `.env`.

| Variable                  | Purpose                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `OPENCODE_API_KEY`        | Model-provider credential required for agent runs                               |
| `OPENCODE_BASE_URL`       | Required model-provider API base URL                                            |
| `AGENT_ID`                | Agent identifier for saved conversations; defaults to `assistant`               |
| `AGENT_MODEL`             | Model name; defaults to `gpt-6-luna`                                            |
| `BACKEND_URL`             | Required backend base URL for conversation history                              |
| `CORS_ORIGINS`            | Comma-separated browser origins; empty by default                               |
| `AGENT_API_URL`           | Explicit target for the live API test                                           |
| `LOGFIRE_TOKEN`           | Optional project write token; empty disables cloud export                       |
| `LOGFIRE_SERVICE_NAME`    | Telemetry service name; defaults to `agents`                                    |
| `LOGFIRE_ENVIRONMENT`     | Telemetry environment; defaults to `development`                                |
| `LOGFIRE_INCLUDE_CONTENT` | Capture model prompts, replies, and tool arguments/results; defaults to `false` |

## Logfire tracing

The service instruments FastAPI requests, Pydantic AI agent/model/tool activity (including the summarize tool's direct model request), and outgoing HTTPX requests. Configuration lives in `core/telemetry.py` and runs once before serving requests. Health probes are excluded.

Create a Logfire project using the [getting started guide](https://pydantic.dev/docs/logfire/get-started/) and copy a project write token into `LOGFIRE_TOKEN`. Use the root `.env` for Docker or `agents/.env` for native development. Tokens stay server-side; without a token the service runs with cloud export disabled.

For Docker, rebuild and recreate the agents service after setting the token:

```bash
docker compose up -d --build agents
```

For native development, restart `mise -C agents run dev`. Open the Logfire project's Live view and load `/conversations`, or send a chat message to see the request's agent/model/tool spans. Set `LOGFIRE_ENVIRONMENT` to distinguish development and production.

HTTP headers/bodies, parsed FastAPI arguments, and binary attachments are not captured. Model prompts, completions, and tool arguments/results are excluded by default; set `LOGFIRE_INCLUDE_CONTENT=true` to include them. The SDK's default scrubbing remains enabled. Offline tests use Logfire's in-memory exporter, with no cloud export or real model calls.

## API and history

| Method | Path                            | Behavior                                                |
| ------ | ------------------------------- | ------------------------------------------------------- |
| GET    | `/health`                       | Process health without querying the database or model   |
| POST   | `/agent`                        | Run the assistant agent and stream AG-UI events         |
| GET    | `/threads/{thread_id}/messages` | Convert persisted history to frontend AG-UI messages    |
| GET    | `/conversations`                | List this agent's saved conversations from the backend  |
| DELETE | `/conversations/{thread_id}`    | Delete this agent's saved conversation and its messages |
| GET    | `/docs`                         | Interactive API documentation                           |

The assistant agent uses `NativeOutput(AgentResponse)` and returns JSON such as `{"message":"Hello!"}`, with a required nonempty `message`. The route loads native history and calls `dispatch_request` on `ThreadAdapter`, an `AGUIAdapter` that runs only client messages missing from that history, so saved turns are never replayed.

The assistant's only tool is `summarize(text)` in `agents/tools/summarize.py`. It is not an
agent: it sends one direct model request (`pydantic_ai.direct.model_request`) on the
assistant's model with only the supplied text, never the conversation, and instructions
rendered from `specs/prompts/summarize.yaml` with a word budget of a quarter of the source
(at least 15 words, at most the source length). The request adds to the run's `usage`, so it
counts toward the assistant's usage limits, and uses the same provider headers, so it sends
the run's stable `x-opencode-session` and the application's `User-Agent`. The saved native
history contains the `summarize` tool call and the returned summary. Try: `Summarize this:
The project uses Next.js for the UI, Fastify for persistence, and Pydantic AI for agents.`

Agent definitions live in `src/app/agents/specs/agents/` as Pydantic AI `AgentSpec` YAML files (`name`, `description`, and `instructions`); `BaseAgent(spec="assistant")` loads `assistant.yaml`. Prompt templates used by code live in `src/app/agents/specs/prompts/` with a `description` and a Handlebars `template` (rendered with `TemplateStr`, which needs the `spec` extra of `pydantic-ai-slim`): `enabled_tools.yaml` is the tool prompt that the `EnabledTools` capability renders each run, and `summarize.yaml` holds the summarize tool's instructions; `enabled_tools.yaml` is rendered against its enabled, disabled, and unavailable tools, using `~` to keep block tags from adding blank lines. Each agent's tool catalog is built from its own function toolsets: the name and description come from the tool function and its docstring, and `metadata={"label": ...}` (optionally `"available": False`) sets the selector label; `BaseAgent` then adds the `EnabledTools` capability, which filters the model-visible tools (`prepare_tools`) and adds instructions built from the catalog (`get_instructions`) (enabled tools with their descriptions, tools the user disabled, and tools this server does not offer), while agents without a catalog get neither. `GET /tools` returns the served agent's catalog, and the `enabledTools` AG-UI state is checked against it; unknown names return 422.

Each completed run saves its full native history through `on_complete`. Failed or interrupted runs are not saved. Reuse the same `threadId` to continue a conversation. Already consumed client messages and completed tool results are filtered to avoid replaying saved turns.

The history save also carries conversation metadata (agent ID, title from the first user prompt). The backend stores the conversation entry in the same transaction as the history, so the frontend's saved list never diverges from persisted history.

The backend checks revisions when saving history. Concurrent updates can produce a conflict rather than overwrite another run; serialize requests within a thread. The frontend history endpoint excludes system instructions and reasoning and does not make a model request.

## Commands

Run tasks from the root with `mise -C agents run <task>`, or inside `agents/` with `mise <task>`.

| Task                      | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `setup`                   | Recreate `.venv` and install locked development dependencies |
| `dev`                     | Start Uvicorn with reload on port `8000`                     |
| `lint` / `lint-fix`       | Check / fix Ruff findings                                    |
| `format-check` / `format` | Check / apply Ruff formatting                                |
| `typecheck`               | Run mypy                                                     |
| `test`                    | Run pytest; skip the live API test without `AGENT_API_URL`   |
| `test-agent`              | Send one real model request and verify saved history         |
| `check`                   | Run lint, formatting, type checks, and tests                 |
| `logs` / `shell`          | Follow container logs / open its shell                       |
| `clean-cache`             | Remove application caches while preserving dependencies      |
| `clean-deps`              | Remove only this application's `.venv`                       |

Root `mise dev` builds and starts the Docker stack with bind-mounted source. `AGENTS_PORT` defaults to `8000`. Rebuild after dependency or Dockerfile changes. Root `mise down` preserves volumes.

## Tests

`tests/conftest.py` defines the sample AG-UI input, native history, and clients. History-client tests use the configurable HTTP responder in `tests/helpers/history.py`; conversation-client tests use `tests/helpers/conversations.py`. The live test uses a real model and backend; its streaming and assertion helpers are in `tests/helpers/agent_api.py`.

Local delegation tests use function models to verify the parent/child flow, shared usage
limits, isolated child context, and serialization of delegation results into backend history.
These tests do not send model-provider requests.

With both services running, export host-accessible URLs and run:

```bash
export AGENT_API_URL=http://127.0.0.1:8000
export BACKEND_URL=http://127.0.0.1:3001
mise -C agents run test-agent
```

The test validates matching thread/run IDs, a nonempty structured `AgentResponse`, successful `RUN_FINISHED`, no `RUN_ERROR`, and persisted backend history and conversation metadata. It sends one model request and prints the reply.

The [Agents workflow](../.github/workflows/agents.yml) runs on relevant pull requests and manual dispatches. It starts PostgreSQL and uses [test_agents.sh](../.github/workflows/scripts/test_agents.sh) to migrate the backend, start both services, check readiness, run the live test, and stop both servers. It requires the `OPENCODE_API_KEY` repository secret, uses read-only token permissions, and has no push trigger on `main`.
