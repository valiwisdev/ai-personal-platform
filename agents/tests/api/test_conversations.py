"""Conversation list endpoint returns this agent's saved conversations."""

import pytest
from fastapi.testclient import TestClient

from app.api.routes import conversations as conversations_routes
from app.core.config import Settings
from app.dependencies.conversations import Conversation
from app.main import app
from tests.helpers.conversations import ConversationsBackend


@pytest.fixture
def conversations_api_client(
    api_client: TestClient,
    conversations_backend: ConversationsBackend,
    monkeypatch: pytest.MonkeyPatch,
) -> TestClient:
    monkeypatch.setattr(
        conversations_routes,
        "settings",
        Settings(backend_url="http://backend.test", agent_id="assistant"),
    )
    return api_client


def test_conversations_returns_backend_list(
    conversations_api_client: TestClient, conversations_backend: ConversationsBackend
) -> None:
    conversations_backend.conversations = [
        Conversation.model_validate(
            {
                "threadId": "thread-1",
                "agentId": "assistant",
                "title": "Hello",
                "updatedAt": "2026-01-01T00:00:00.123Z",
            }
        ),
        Conversation.model_validate(
            {
                "threadId": "thread-2",
                "agentId": "other",
                "title": "Other",
                "updatedAt": "2026-01-02T00:00:00.456Z",
            }
        ),
    ]

    response = conversations_api_client.get("/conversations")

    assert response.status_code == 200
    assert response.json() == [
        {
            "threadId": "thread-1",
            "agentId": "assistant",
            "title": "Hello",
            "updatedAt": "2026-01-01T00:00:00.123000Z",
        },
        {
            "threadId": "thread-2",
            "agentId": "other",
            "title": "Other",
            "updatedAt": "2026-01-02T00:00:00.456000Z",
        },
    ]


def test_conversations_requires_backend_url(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(app.state, "backend_client", None)

    response = api_client.get("/conversations")

    assert response.status_code == 503
    assert response.json() == {"detail": "BACKEND_URL is required."}


def test_conversations_report_unavailable_backend(
    conversations_api_client: TestClient, conversations_backend: ConversationsBackend
) -> None:
    conversations_backend.list_status = 503

    response = conversations_api_client.get("/conversations")

    assert response.status_code == 503
    assert response.json() == {"detail": "Could not load agent conversations."}


def test_delete_conversation_is_scoped_to_agent(
    conversations_api_client: TestClient, conversations_backend: ConversationsBackend
) -> None:
    conversations_backend.conversations = [
        Conversation.model_validate(
            {
                "threadId": "thread-1",
                "agentId": "assistant",
                "title": "Hello",
                "updatedAt": "2026-01-01T00:00:00Z",
            }
        ),
        Conversation.model_validate(
            {
                "threadId": "thread-2",
                "agentId": "other",
                "title": "Keep me",
                "updatedAt": "2026-01-01T00:00:00Z",
            }
        ),
    ]

    response = conversations_api_client.delete("/conversations/thread-1")

    assert response.status_code == 204
    assert response.content == b""
    request = conversations_backend.requests[-1]
    assert request.method == "DELETE"
    assert request.url.path == "/conversations/thread-1"
    assert request.url.params["agentId"] == "assistant"
    assert [conversation.thread_id for conversation in conversations_backend.conversations] == [
        "thread-2"
    ]

    response = conversations_api_client.delete("/conversations/thread-2")

    assert response.status_code == 204
    assert [conversation.thread_id for conversation in conversations_backend.conversations] == [
        "thread-2"
    ]


def test_delete_conversation_reports_backend_failure(
    conversations_api_client: TestClient, conversations_backend: ConversationsBackend
) -> None:
    conversations_backend.delete_status = 503

    response = conversations_api_client.delete("/conversations/thread-1")

    assert response.status_code == 503
    assert response.json() == {"detail": "Could not delete conversation."}


def test_delete_conversation_requires_backend_url(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(app.state, "backend_client", None)

    response = api_client.delete("/conversations/thread-1")

    assert response.status_code == 503
    assert response.json() == {"detail": "BACKEND_URL is required."}
