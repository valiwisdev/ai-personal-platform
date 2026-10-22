import os
from collections.abc import Iterator
from uuid import uuid4

import httpx
import pytest
from ag_ui.core import RunAgentInput, UserMessage
from fastapi.testclient import TestClient
from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, UserPromptPart
from pydantic_ai.models.test import TestModel

from app.agents import assistant
from app.agents.base import agent as base_agent
from app.dependencies.backend import get_backend_client
from app.dependencies.conversations import ConversationClient
from app.dependencies.history import HistoryClient, ThreadHistory
from app.main import app
from tests.helpers.conversations import ConversationsBackend
from tests.helpers.history import HistoryBackend


@pytest.fixture
def run_input() -> RunAgentInput:
    return RunAgentInput(
        thread_id=str(uuid4()),
        run_id=str(uuid4()),
        state={},
        messages=[UserMessage(id=str(uuid4()), content="Say hello in one short sentence.")],
        tools=[],
        context=[],
        forwarded_props={},
    )


@pytest.fixture
def test_agents(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Build cached agents on TestModel; tests override the model they exercise."""
    monkeypatch.setattr(base_agent, "get_agent_model", TestModel)
    assistant.get_assistant_agent.cache_clear()
    yield
    assistant.get_assistant_agent.cache_clear()


@pytest.fixture
def thread_history() -> ThreadHistory:
    return ThreadHistory(
        messages=[
            ModelRequest(parts=[UserPromptPart("Hello")]),
            ModelResponse(parts=[TextPart('{"message":"Hello!"}')]),
        ],
        messageIds=["user-1"],
        revision=2,
    )


def fake_backend_client(handler: httpx.MockTransport) -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url="http://backend.test", transport=handler)


@pytest.fixture
def history_backend(thread_history: ThreadHistory) -> Iterator[HistoryBackend]:
    backend = HistoryBackend(thread_history)
    client = fake_backend_client(httpx.MockTransport(backend.handle))
    app.dependency_overrides[get_backend_client] = lambda: client
    yield backend
    app.dependency_overrides.pop(get_backend_client, None)


@pytest.fixture
def history_client(history_backend: HistoryBackend) -> HistoryClient:
    return HistoryClient(fake_backend_client(httpx.MockTransport(history_backend.handle)))


@pytest.fixture
def conversations_backend() -> Iterator[ConversationsBackend]:
    backend = ConversationsBackend()
    client = fake_backend_client(httpx.MockTransport(backend.handle))
    app.dependency_overrides[get_backend_client] = lambda: client
    yield backend
    app.dependency_overrides.pop(get_backend_client, None)


@pytest.fixture
def conversation_client(conversations_backend: ConversationsBackend) -> ConversationClient:
    return ConversationClient(
        fake_backend_client(httpx.MockTransport(conversations_backend.handle))
    )


@pytest.fixture
def api_client() -> Iterator[TestClient]:
    with TestClient(app) as client:
        yield client


@pytest.fixture
def agent_api_client() -> Iterator[httpx.Client]:
    base_url = os.environ.get("AGENT_API_URL")
    if not base_url:
        pytest.skip("Set AGENT_API_URL to test the running agents service and real model provider.")
    with httpx.Client(base_url=base_url, timeout=120) as client:
        yield client


@pytest.fixture
def backend_api_client(agent_api_client: httpx.Client) -> Iterator[httpx.Client]:
    base_url = os.environ.get("BACKEND_URL")
    if not base_url:
        pytest.fail("Set BACKEND_URL to the history backend before running the live agent test.")
    with httpx.Client(base_url=base_url, timeout=10) as client:
        yield client
