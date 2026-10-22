# Frontend

Next.js App Router frontend using React, Tailwind CSS, CopilotKit, and pnpm. It selects configured agents, streams their replies, and restores persisted conversations through server-side API routes.

## Structure

```text
frontend/
├── agents.yml               # Server-side agent IDs, names, and endpoint URLs
├── app/
│   ├── page.tsx             # Agent selection and conversation URL
│   ├── providers.tsx        # CopilotKit runtime provider
│   └── api/                 # Runtime, tools, conversations, history, and health routes
├── components/              # App shell, agent panel, chat, tools menu, status, and shadcn UI
├── hooks/                   # useAgentHistory, useAgentTools, useConversations
├── lib/                     # Registry loading, agent proxy, fetchJson, and response helpers
├── schemas/                 # Zod schemas and their derived types
├── mise.toml
└── pnpm-lock.yaml
```

## Local development

Complete the [root setup](../README.md) first and start the [backend](../backend/README.md) and [agents service](../agents/README.md). From the repository root:

```bash
cp frontend/.env.example frontend/.env.local
```

For native development, change the example agent URL in `frontend/agents.yml` to `http://127.0.0.1:8000/agent`, then start the frontend:

```bash
mise -C frontend run dev
```

The application defaults to <http://localhost:3000>. Local Next.js execution loads `.env.local`; Compose supplies values from the root `.env`. `NEXT_PUBLIC_APP_URL` is the browser-visible canonical URL. Keep credentials and service URLs server-side.

## Agent registry

Configure agents in `agents.yml`; the frontend does not read an agent registry from environment variables. Each entry needs a unique nonempty ID, display name, and valid URL. The ID must match the `AGENT_ID` of the service it points to so the saved conversation list associates chats with the right agent:

```yaml
agents:
  - id: assistant
    name: Example agent
    url: http://agents:8000/agent
```

Add another entry for each additional running agent service. The checked-in URL uses Docker's service name; use host-accessible URLs for native development. Each service must support its configured run URL, `/health`, `/threads/{thread_id}/messages`, and `/conversations`.

The server validates the registry and registers its endpoints with CopilotKit. Only IDs and display names reach the browser. Restart the frontend after changing the registry so runtime registration and the selector stay consistent.

## Navigation

The app sidebar links to **Agents** (`/`), **Coding** (`/coding`), **Documents** (`/documents`), and **Personal** (`/personal`). Each route highlights its active navigation item and uses the shared app shell. The three new sections currently show empty views, ready for their features. On phones, the header toggle opens navigation as a sheet; selecting a section closes it.

## Settings

Open **Settings** at the bottom of the agent panel, or use the header settings button on phones. Settings replaces the chat controls in the left panel with **Tools** and **General** tabs. **Back to chat** restores chat controls and preserves your draft.

The **Tools** tab shares its switches with the wrench menu in the chat input. Changes apply to the current chat and reset when opening another chat or reloading. Unavailable tools and switches during a running reply are disabled. Long tool lists scroll within the view. **General** is reserved for future settings.

## Conversations

The app sidebar provides **Agents**, **Coding**, **Documents**, and **Personal** navigation links. A separate agent panel beside the chat contains **New chat**, the agent selector, and the saved chat history. On phones, the panel becomes a compact bar below the header: an 8rem agent selector, a chat-history selector that fills the remaining space, and a **New chat** icon button. The header toggle opens the app navigation as a sheet.

Conversation URLs contain `agent` and `thread` parameters. Refresh or reopen the same URL to restore saved messages. Changing agents or selecting **New chat** creates a new thread; browser navigation can reopen a previous conversation URL.

Use **Chat history** to switch between conversations for the selected agent. Starting a new chat does not add a history entry; it appears after the first message and successful reply are saved. Opening an empty conversation URL also leaves history unchanged. Titles come from the first user message, and the most recently updated chat appears first. The list is persisted in PostgreSQL through the agents service and backend, so it survives browser clears and is shared across browsers. Switching chats is disabled while a reply is running.

History loads through the selected agent's server-side proxy before chat input appears. Failed loads show a retry control. CopilotKit's separate in-memory replay is disabled because the agents service loads history persisted by the backend. Assistant JSON is displayed as the structured response's `message` text.

Use the trash button beside a saved chat to delete it, then confirm. On phones, select a saved chat and use the trash button in the compact bar. Deletion removes the conversation and its saved messages. Deleting the open chat starts a new empty chat; deleting another chat leaves the current one open. Deletion is disabled while a reply is running. Failures leave the chat in history and show an error so you can retry.

## API

| Method                   | Path                                              | Behavior                                                                 |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------ |
| GET                      | `/api/health?agent=:agentId`                      | Proxy the selected agent's health; default to the first configured agent |
| GET                      | `/api/agents/:agentId/threads/:threadId/messages` | Proxy persisted AG-UI messages for the selected agent                    |
| GET                      | `/api/agents/:agentId/conversations`              | Proxy the selected agent's saved conversation list                       |
| DELETE                   | `/api/agents/:agentId/conversations/:threadId`    | Delete a saved conversation and its messages through the selected agent  |
| GET                      | `/api/agents/:agentId/tools`                      | Proxy the selected agent's tool catalog                                  |
| GET, POST, PATCH, DELETE | `/api/copilotkit/*`                               | Handle CopilotKit requests for configured agents                         |

The agent routes share `proxyAgentGet` (`lib/agent-proxy.ts`), which validates each response with its Zod schema; history uses AG-UI's `MessageSchema` from `@ag-ui/core/schemas`, which also works on the server. Unknown agents return 404. Agents-service client errors keep their status, and upstream failures return 503; either way the agents service's `detail` becomes `{ "error": ... }`, which the hooks show to the user through `fetchJson` (`lib/agent-api.ts`). Requests bypass caching, and endpoint URLs stay on the server.

## Commands

Run tasks from the root with `mise -C frontend run <task>`, or inside `frontend/` with `mise <task>`.

| Task                      | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `setup`                   | Install dependencies from `pnpm-lock.yaml`           |
| `dev`                     | Start the development server                         |
| `build`                   | Create a production build                            |
| `lint` / `lint-fix`       | Check / fix ESLint findings                          |
| `format-check` / `format` | Check / apply Prettier formatting                    |
| `typecheck`               | Check TypeScript types                               |
| `test`                    | Run lint and type checks                             |
| `check`                   | Run lint, formatting, type checks, and the test task |
| `logs` / `shell`          | Follow container logs / open its shell               |
| `clean-cache`             | Remove application build output and caches           |
| `clean-deps`              | Remove only this application's `node_modules`        |

Root `mise dev` builds and starts the Docker stack. The frontend waits for the agents service's health check and uses bind-mounted source. `FRONTEND_PORT` defaults to `3000`. Rebuild after dependency or Dockerfile changes; root `mise down` preserves volumes.

## Checks

Run `mise -C frontend run check` for lint, formatting, and TypeScript checks, or `mise -C frontend run test` for lint and types. No frontend test framework is configured. Run `mise -C frontend run build` to verify the production build.
