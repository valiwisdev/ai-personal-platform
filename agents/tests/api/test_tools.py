"""Tool catalog and per-run API selection tests."""

import json
from collections.abc import AsyncIterator

import pytest
from ag_ui.core import RunAgentInput
from fastapi.testclient import TestClient
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.function import AgentInfo, FunctionModel

from app.agents.base import agent as base_agent
from app.api.routes import agent as agent_routes
from app.core.config import Settings
from tests.helpers.agent_api import assert_agent_reply
from tests.helpers.history import HistoryBackend


@pytest.fixture
def configured_tools(test_agents: None, monkeypatch: pytest.MonkeyPatch) -> None:
    settings = Settings(
        opencode_api_key="test",
        opencode_base_url="http://provider.test",
        backend_url="http://backend.test",
    )
    monkeypatch.setattr(agent_routes, "settings", settings)


def test_catalog_comes_from_the_agent(api_client: TestClient, configured_tools: None) -> None:
    response = api_client.get("/tools")
    assert response.status_code == 200
    assert [(tool["name"], tool["available"]) for tool in response.json()] == [("summarize", True)]


def test_run_passes_selected_tools_to_agent(
    api_client: TestClient,
    configured_tools: None,
    history_backend: HistoryBackend,
    run_input: RunAgentInput,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def model(messages: list[ModelMessage], info: AgentInfo) -> AsyncIterator[str]:
        names = sorted(tool.name for tool in info.function_tools)
        yield json.dumps({"message": json.dumps(names)})

    monkeypatch.setattr(base_agent, "get_agent_model", lambda: FunctionModel(stream_function=model))
    run_input.state = {"enabledTools": ["summarize"]}

    response = api_client.post("/agent", json=run_input.model_dump(mode="json", by_alias=True))

    assert response.status_code == 200
    events = [
        json.loads(line.removeprefix("data: "))
        for line in response.text.splitlines()
        if line.startswith("data: ")
    ]
    reply = assert_agent_reply(events)
    assert json.loads(reply.message) == ["summarize"]


def test_run_rejects_unknown_tools(
    api_client: TestClient,
    configured_tools: None,
    history_backend: HistoryBackend,
    run_input: RunAgentInput,
) -> None:
    run_input.state = {"enabledTools": ["unknown"]}
    response = api_client.post("/agent", json=run_input.model_dump(mode="json", by_alias=True))
    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid enabledTools selection."}
    assert [request.method for request in history_backend.requests] == ["GET"]
