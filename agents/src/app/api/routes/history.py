"""Read persisted conversations as frontend AG-UI messages."""

from ag_ui.core import Message
from fastapi import APIRouter, HTTPException
from pydantic_ai.ui.ag_ui import AGUIAdapter

from app.dependencies.backend import BackendError
from app.dependencies.history import HistoryClientDep

router = APIRouter()


@router.get("/threads/{thread_id}/messages", response_model_exclude_none=True)
async def get_thread_messages(thread_id: str, history_client: HistoryClientDep) -> list[Message]:
    try:
        history = await history_client.load(thread_id)
    except BackendError as error:
        raise HTTPException(status_code=503, detail="Could not load agent history.") from error

    messages = AGUIAdapter.dump_messages(history.messages)
    return [message for message in messages if message.role in {"user", "assistant", "tool"}]
