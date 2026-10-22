"""Thread history, duplicate filtering, and the backend history client."""

from collections.abc import Sequence
from typing import Annotated
from urllib.parse import quote

import httpx
from ag_ui.core import Message
from fastapi import Depends
from pydantic import BaseModel, Field
from pydantic_ai.messages import ModelMessage, NativeToolReturnPart, ToolReturnPart

from app.dependencies.backend import BackendClient


class ThreadHistory(BaseModel):
    messages: list[ModelMessage] = Field(default_factory=list)
    message_ids: list[str] = Field(default_factory=list, alias="messageIds")
    revision: int = Field(default=0, ge=0)

    def new_messages(self, messages: Sequence[Message]) -> list[Message]:
        """Keep new client input without replaying persisted turns or tool results."""
        consumed_message_ids = set(self.message_ids)
        returned_tool_ids = self._returned_tool_call_ids()
        new_messages: list[Message] = []

        for message in messages:
            if self._is_persisted_message(message, consumed_message_ids, returned_tool_ids):
                continue
            new_messages.append(message)

        return new_messages

    def _returned_tool_call_ids(self) -> set[str]:
        tool_call_ids: set[str] = set()
        for message in self.messages:
            for part in message.parts:
                if isinstance(part, ToolReturnPart | NativeToolReturnPart):
                    tool_call_ids.add(part.tool_call_id)
        return tool_call_ids

    def _is_persisted_message(
        self,
        message: Message,
        consumed_message_ids: set[str],
        returned_tool_ids: set[str],
    ) -> bool:
        if message.id in consumed_message_ids:
            return True
        if self.revision > 0 and message.role == "assistant":
            return True
        if message.role == "tool" and message.tool_call_id in returned_tool_ids:
            return True
        return False


class HistoryClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self.client = client

    async def load(self, thread_id: str) -> ThreadHistory:
        response = await self.client.get(_history_path(thread_id))
        response.raise_for_status()
        return ThreadHistory.model_validate(response.json())

    async def save(
        self, thread_id: str, history: ThreadHistory, *, agent_id: str, title: str
    ) -> None:
        payload = history.model_dump(mode="json", by_alias=True) | {
            "agentId": agent_id,
            "title": title,
        }
        response = await self.client.put(_history_path(thread_id), json=payload)
        if response.status_code == 409:
            raise RuntimeError("Thread history changed during this run. Retry your message.")
        response.raise_for_status()


def get_history_client(backend: BackendClient) -> HistoryClient:
    return HistoryClient(backend)


HistoryClientDep = Annotated[HistoryClient, Depends(get_history_client)]


def _history_path(thread_id: str) -> str:
    return f"/threads/{quote(thread_id, safe='')}/history"
