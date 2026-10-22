"""Read this agent's saved conversations from the backend."""

from fastapi import APIRouter, HTTPException, Response

from app.core.config import get_settings
from app.dependencies.backend import BackendError
from app.dependencies.conversations import Conversation, ConversationClientDep

settings = get_settings()
router = APIRouter()


@router.get("/conversations")
async def list_conversations(conversation_client: ConversationClientDep) -> list[Conversation]:
    try:
        return await conversation_client.list(settings.agent_id)
    except BackendError as error:
        raise HTTPException(
            status_code=503, detail="Could not load agent conversations."
        ) from error


@router.delete("/conversations/{thread_id}", status_code=204)
async def delete_conversation(
    thread_id: str, conversation_client: ConversationClientDep
) -> Response:
    try:
        await conversation_client.delete(thread_id, settings.agent_id)
    except BackendError as error:
        raise HTTPException(status_code=503, detail="Could not delete conversation.") from error
    return Response(status_code=204)
