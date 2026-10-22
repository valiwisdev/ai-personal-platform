"""Agent endpoint configuration, request validation, and history persistence."""

from dataclasses import dataclass, field
from functools import cached_property

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from pydantic_ai import AgentRunResult
from pydantic_ai.messages import ModelMessage
from pydantic_ai.ui.ag_ui import AGUIAdapter
from starlette.requests import Request
from starlette.responses import Response

from app.agents import get_assistant_agent
from app.agents.assistant import AgentResponse
from app.agents.base import AgentDeps
from app.agents.tools.selection import AgentTool
from app.core.config import get_settings
from app.dependencies.backend import BackendError
from app.dependencies.conversations import conversation_title
from app.dependencies.history import HistoryClientDep, ThreadHistory

settings = get_settings()
router = APIRouter()


@dataclass
class ThreadAdapter(AGUIAdapter[AgentDeps, AgentResponse]):
    """Run only the client messages that the saved thread history does not contain."""

    history: ThreadHistory = field(default_factory=ThreadHistory)

    @cached_property
    def messages(self) -> list[ModelMessage]:
        new_messages = self.history.new_messages(self.run_input.messages)
        return self.load_messages(new_messages, preserve_file_data=self.preserve_file_data)


def require_model() -> None:
    if not settings.opencode_api_key or not settings.opencode_base_url:
        raise HTTPException(
            status_code=503,
            detail=(
                "Agent model is not configured. Set OPENCODE_API_KEY, OPENCODE_BASE_URL, "
                "and AGENT_MODEL before sending a message."
            ),
        )


@router.get("/tools")
async def list_tools() -> list[AgentTool]:
    require_model()
    return get_assistant_agent().tool_catalog


@router.post("/agent")
async def run_agent(request: Request, history_client: HistoryClientDep) -> Response:
    require_model()
    try:
        run_input = AGUIAdapter.build_run_input(await request.body())
    except ValidationError as error:
        return Response(
            error.json(include_input=False), status_code=422, media_type="application/json"
        )
    if not run_input.thread_id:
        raise HTTPException(status_code=422, detail="threadId must not be empty.")

    try:
        history = await history_client.load(run_input.thread_id)
    except BackendError as error:
        raise HTTPException(status_code=503, detail="Could not load agent history.") from error
    if not history.new_messages(run_input.messages):
        raise HTTPException(status_code=409, detail="No new messages in this thread.")
    message_ids = list(dict.fromkeys([*history.message_ids, *(m.id for m in run_input.messages)]))

    async def save_run(result: AgentRunResult[AgentResponse]) -> None:
        updated = history.model_copy(
            update={"messages": result.all_messages(), "message_ids": message_ids}
        )
        title = conversation_title(result.all_messages()) or "Conversation"
        await history_client.save(
            run_input.thread_id, updated, agent_id=settings.agent_id, title=title
        )

    agent = get_assistant_agent()
    deps = AgentDeps(session_id=run_input.thread_id, available_tools=agent.available_tools)
    try:
        response = await ThreadAdapter.dispatch_request(
            request,
            agent=agent,
            deps=deps,
            message_history=history.messages,
            on_complete=save_run,
            history=history,
        )
        agent.check_tool_selection(deps.state)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Invalid enabledTools selection.") from error
    return response
