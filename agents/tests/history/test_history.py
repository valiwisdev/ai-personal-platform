import json

import pytest
from ag_ui.core import AssistantMessage, ToolMessage, UserMessage
from pydantic_ai.messages import (
    ModelRequest,
    ToolReturnPart,
)

from app.dependencies.history import HistoryClient, ThreadHistory
from tests.helpers.history import HistoryBackend


def test_history_removes_persisted_turns_and_tool_results() -> None:
    history = ThreadHistory(
        messages=[ModelRequest(parts=[ToolReturnPart("summarize", "Short.", "summary-1")])],
        messageIds=["user-1"],
        revision=1,
    )
    messages = [
        UserMessage(id="user-1", content="Summarize this"),
        AssistantMessage(id="reply-1", content='{"message":"Short."}'),
        ToolMessage(id="tool-1", tool_call_id="summary-1", content="Short."),
        UserMessage(id="user-2", content="And now?"),
        ToolMessage(id="tool-2", tool_call_id="summary-2", content="Brief."),
    ]
    assert [message.id for message in history.new_messages(messages)] == ["user-2", "tool-2"]


def test_new_thread_keeps_initial_client_history() -> None:
    messages = [UserMessage(id="user-1", content="Hello")]
    assert ThreadHistory().new_messages(messages) == messages


async def test_history_client_round_trips_native_messages(
    history_client: HistoryClient, history_backend: HistoryBackend, thread_history: ThreadHistory
) -> None:
    payload = thread_history.model_dump(mode="json", by_alias=True)
    loaded = await history_client.load("thread-1")
    assert loaded.model_dump(mode="json", by_alias=True) == payload
    await history_client.save("thread-1", loaded, agent_id="assistant", title="Hello")

    load_request, save_request = history_backend.requests
    assert load_request.method == "GET"
    assert load_request.url.path == "/threads/thread-1/history"
    assert save_request.method == "PUT"
    assert save_request.url == load_request.url
    assert json.loads(save_request.content) == {**payload, "agentId": "assistant", "title": "Hello"}


async def test_history_client_reports_revision_conflict(
    history_client: HistoryClient, history_backend: HistoryBackend
) -> None:
    history_backend.save_status = 409
    with pytest.raises(RuntimeError, match="history changed"):
        await history_client.save(
            "thread-1", history_backend.history, agent_id="assistant", title="Hello"
        )
