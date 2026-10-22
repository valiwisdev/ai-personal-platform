# Agents

FastAPI and Pydantic AI service using Python and uv. Runs agents over AG-UI and saves completed conversations through the [backend](../backend/README.md).

## Quick start

For Docker, follow the [root quick start](../README.md). For native development, run `mise setup` from the repository root and start the backend with its migrations applied, then run:

```bash
cp agents/.env.example agents/.env
```

Set `OPENCODE_API_KEY` in `agents/.env`. Check `OPENCODE_BASE_URL` for your model provider and `BACKEND_URL` for your running backend, then start the service:

```bash
mise -C agents run dev
```

Open <http://localhost:8000/docs> for interactive API documentation. Native execution loads `agents/.env`; Docker uses the root `.env`.

## Agent configuration

`AGENT_ID` identifies saved conversations and must match the entry in [frontend/agents.yml](../frontend/agents.yml). `AGENT_MODEL` selects the model.

Agent definitions live in [src/app/agents/specs/agents](src/app/agents/specs/agents), and prompt templates live in [src/app/agents/specs/prompts](src/app/agents/specs/prompts). Agents extend `BaseAgent`, which builds the tool catalog and applies the enabled-tool policy. The assistant's `summarize` tool sends one direct model request using the supplied text.

The assistant returns structured JSON with a required nonempty `message`. Completed runs save native history and conversation metadata together through the backend. Reuse the same `threadId` to continue a chat and serialize requests within a thread to avoid revision conflicts.

## API

| Method | Path                            | Purpose                                   |
| ------ | ------------------------------- | ----------------------------------------- |
| GET    | `/health`                       | Check process health                      |
| POST   | `/agent`                        | Run the assistant and stream AG-UI events |
| GET    | `/tools`                        | List the assistant's tool catalog         |
| GET    | `/threads/{thread_id}/messages` | Load saved messages in AG-UI format       |
| GET    | `/conversations`                | List this agent's saved chats             |
| DELETE | `/conversations/{thread_id}`    | Delete this agent's chat and its messages |

## Tracing

Set `LOGFIRE_TOKEN` to your project's write token to enable optional tracing for FastAPI, Pydantic AI, and outgoing HTTP requests. Leave it empty to disable cloud export. Use the root `.env` for Docker or `agents/.env` for native development, then restart the service; rebuild the agents container for Docker.

`LOGFIRE_ENVIRONMENT` labels the environment. Model prompts, replies, and tool content are excluded by default; set `LOGFIRE_INCLUDE_CONTENT=true` to capture them. View requests and model activity in your Logfire project's Live view.

## Useful commands

Run these from the repository root:

| Command                         | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `mise -C agents run dev`        | Start Uvicorn with reload                              |
| `mise -C agents run check`      | Run Ruff, formatting, mypy, and tests                  |
| `mise -C agents run test`       | Run pytest; skip the live test without `AGENT_API_URL` |
| `mise -C agents run test-agent` | Run the live model and persistence test                |
| `mise -C agents run logs`       | Follow container logs                                  |

See [mise.toml](mise.toml) for all tasks.

## Live test

With the agents service and backend running, export their host-accessible URLs:

```bash
export AGENT_API_URL=http://127.0.0.1:8000
export BACKEND_URL=http://127.0.0.1:3001
mise -C agents run test-agent
```

The test sends one real model request and checks matching thread/run IDs, the structured response, successful completion, and persisted history and conversation metadata.

The [Agents workflow](../.github/workflows/agents.yml) runs this test on relevant pull requests and manual dispatches. It requires the `OPENCODE_API_KEY` repository secret.
