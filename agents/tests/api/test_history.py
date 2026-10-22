"""History reads return only frontend messages without running the model."""

import pytest
from fastapi.testclient import TestClient
from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
    ThinkingPart,
)

from app.dependencies.history import ThreadHistory
from tests.helpers.history import HistoryBackend


@pytest.fixture
def history_api_client(api_client: TestClient, history_backend: HistoryBackend) -> TestClient:
    return api_client


def test_history_returns_visible_messages(
    history_api_client: TestClient, history_backend: HistoryBackend
) -> None:
    history = history_backend.history
    request = history.messages[0]
    response = history.messages[1]
    assert isinstance(request, ModelRequest)
    assert isinstance(response, ModelResponse)
    request.parts = [SystemPromptPart("Private instructions"), *request.parts]
    response.parts = [ThinkingPart("Private reasoning"), *response.parts]

    response = history_api_client.get("/threads/thread-1/messages")

    assert response.status_code == 200
    messages = response.json()
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Hello"
    assert messages[1]["role"] == "assistant"
    assert messages[1]["content"] == '{"message":"Hello!"}'
    assert "toolCalls" not in messages[1]
    assert "name" not in messages[1]
    assert "Private instructions" not in response.text
    assert "Private reasoning" not in response.text


def test_unknown_thread_has_no_messages(
    history_api_client: TestClient, history_backend: HistoryBackend
) -> None:
    history_backend.history = ThreadHistory()

    response = history_api_client.get("/threads/new-thread/messages")

    assert response.status_code == 200
    assert response.json() == []


def test_history_returns_unavailable_when_backend_fails(
    history_api_client: TestClient, history_backend: HistoryBackend
) -> None:
    history_backend.load_status = 503

    response = history_api_client.get("/threads/thread-1/messages")

    assert response.status_code == 503
    assert response.json() == {"detail": "Could not load agent history."}
