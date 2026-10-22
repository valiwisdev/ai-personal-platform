# AI Personal Platform

A personal AI platform with agent chat, saved conversations, attachments, and configurable tools. Built with Next.js, FastAPI/Pydantic AI, Bun/Fastify, and PostgreSQL. Coding, Documents, and Personal sections are placeholders for future features.

Built using my own knowledge and AI assistance for code, design, and documentation.

## Quick start

Install [mise](https://mise.jdx.dev/) and Docker Compose, then run from the project root:

```bash
cp .env.example .env
mise trust
mise install
```
workspace
Set `OPENCODE_API_KEY` in `.env`. The example already provides the URLs needed for Docker.

```bash
mise dev
```

Open <http://localhost:3000>.

Configure agents in [frontend/agents.yml](frontend/agents.yml). Set `LOGFIRE_TOKEN` in `.env` to enable optional agent tracing.

## Useful commands

| Command | Purpose |
| --- | --- |
| `mise dev` | Build and start the stack |
| `mise ps` | Show service status |
| `docker compose down` | Stop the stack and keep database data |
| `mise setup` | Install dependencies for native development and checks |
| `mise -C <folder> run check` | Run checks in `frontend`, `backend`, or `agents` |

## Service documentation

- [Frontend](frontend/README.md): interface, agent registry, and native development.
- [Backend](backend/README.md): APIs, database, and migrations.
- [Agents](agents/README.md): models, tools, tests, and Logfire setup.
