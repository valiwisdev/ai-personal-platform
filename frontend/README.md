# Frontend

Next.js interface with React, Tailwind CSS, and CopilotKit. Provides agent chat, attachments, tool selection, and saved conversations.

## Quick start

For Docker, follow the [root quick start](../README.md). For native development, run `mise setup` from the repository root and start the [backend](../backend/README.md) and [agents service](../agents/README.md), then run:

```bash
cp frontend/.env.example frontend/.env.local
```

Change the agent URL in `frontend/agents.yml` to `http://127.0.0.1:8000/agent`, then start the frontend:

```bash
mise -C frontend run dev
```

Open <http://localhost:3000>. Next.js loads `.env.local`; Docker uses the root `.env`. `NEXT_PUBLIC_APP_URL` sets the browser-visible canonical URL.

## Agent configuration

Configure agents in [agents.yml](agents.yml):

```yaml
agents:
  - id: assistant
    name: Example agent
    url: http://agents:8000/agent
```

Each ID must be unique and match the service's `AGENT_ID` so saved conversations belong to the correct agent. Use Docker service names for Docker and host-accessible URLs for native development. Restart the frontend after changing the registry.

Agent URLs stay server-side. The frontend proxies runs, health, tools, and conversation history through Next.js API routes.

## Chat

Choose an agent and start a chat. Conversations appear in history after the first successful reply is saved. URLs include the agent and thread, so reopening a URL restores the conversation. Deleting a saved chat also removes its messages.

Use **Settings → Tools** or the wrench menu to select tools for the current chat. Tool choices reset when switching chats or reloading. **Coding**, **Documents**, and **Personal** are placeholders for future features.

## Useful commands

Run these from the repository root:

| Command                       | Purpose                               |
| ----------------------------- | ------------------------------------- |
| `mise -C frontend run dev`    | Start the development server          |
| `mise -C frontend run build`  | Create a production build             |
| `mise -C frontend run check`  | Run lint, formatting, and type checks |
| `mise -C frontend run format` | Apply formatting                      |
| `mise -C frontend run logs`   | Follow container logs                 |

The `test` task runs lint and type checks; no frontend test framework is configured. See [mise.toml](mise.toml) for all tasks.
