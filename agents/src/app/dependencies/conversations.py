"""Conversation metadata, titles, and the backend conversation client."""

from collections.abc import Sequence
from datetime import datetime
from typing import Annotated
from urllib.parse import quote

import httpx
from fastapi import Depends
from pydantic import BaseModel, Field
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    TextContent,
    UserContent,
    UserPromptPart,
)

from app.dependencies.backend import BackendClient


class Conversation(BaseModel):
    thread_id: str = Field(alias="threadId")
    agent_id: str = Field(alias="agentId")
    title: str = Field(min_length=1)
    updated_at: datetime = Field(alias="updatedAt")


class ConversationClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self.client = client

    async def list(self, agent_id: str) -> list[Conversation]:
        response = await self.client.get("/conversations", params={"agentId": agent_id})
        response.raise_for_status()
        return [Conversation.model_validate(item) for item in response.json()]

    async def delete(self, thread_id: str, agent_id: str) -> None:
        response = await self.client.delete(
            f"/conversations/{quote(thread_id, safe='')}", params={"agentId": agent_id}
        )
        response.raise_for_status()


def get_conversation_client(backend: BackendClient) -> ConversationClient:
    return ConversationClient(backend)


ConversationClientDep = Annotated[ConversationClient, Depends(get_conversation_client)]


def conversation_title(messages: Sequence[ModelMessage]) -> str | None:
    """Derive a short title from the first user prompt in the conversation."""
    for message in messages:
        if not isinstance(message, ModelRequest):
            continue
        for part in message.parts:
            if isinstance(part, UserPromptPart):
                text = _prompt_text(part.content)
                if text:
                    return text[:80]
    return None


def _prompt_text(content: str | Sequence[UserContent]) -> str | None:
    if isinstance(content, str):
        return " ".join(content.split()) or None
    text = " ".join(
        item if isinstance(item, str) else item.content
        for item in content
        if isinstance(item, str | TextContent)
    )
    return " ".join(text.split()) or None
