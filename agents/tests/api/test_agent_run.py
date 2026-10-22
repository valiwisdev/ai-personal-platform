"""The agent endpoint runs new AG-UI input on top of saved native history."""

import json
from collections.abc import AsyncIterator

import pytest
from ag_ui.core import RunAgentInput, UserMessage
from fastapi.testclient import TestClient
from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

from app.agents.base import agent as base_agent
from app.api.routes import agent as agent_routes
from app.core.config import Settings
from tests.helpers.history import HistoryBackend


@pytest.fixture
def configured_agent(test_agents: None, monkeypatch: pytest.MonkeyPatch) -> None:
    settings = Settings(opencode_api_key="test", opencode_base_url="http://provider.test")
    monkeypatch.setattr(agent_routes, "settings", settings)


def test_run_skips_saved_messages_and_saves_the_result(
    api_client: TestClient,
    configured_agent: None,
    history_backend: HistoryBackend,
    run_input: RunAgentInput,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    prompts: list[str] = []

    async def model(messages: list[ModelMessage], info: AgentInfo) -> AsyncIterator[str]:
        for message in messages:
            if isinstance(message, ModelRequest):
                for part in message.parts:
                    if isinstance(part, UserPromptPart) and isinstance(part.content, str):
                        prompts.append(part.content)
        yield json.dumps({"message": "Hi again."})

    monkeypatch.setattr(base_agent, "get_agent_model", lambda: FunctionModel(stream_function=model))
    run_input.messages = [UserMessage(id="user-1", content="Hello"), *run_input.messages]

    response = api_client.post("/agent", json=run_input.model_dump(mode="json", by_alias=True))

    assert response.status_code == 200
    assert prompts == ["Hello", "Say hello in one short sentence."]
    load, save = history_backend.requests
    assert (load.method, save.method) == ("GET", "PUT")
    saved = json.loads(save.content)
    assert saved["revision"] == 2
    assert saved["messageIds"] == ["user-1", run_input.messages[1].id]


def test_run_rejects_non_json_requests(
    api_client: TestClient,
    configured_agent: None,
    history_backend: HistoryBackend,
    run_input: RunAgentInput,
) -> None:
    response = api_client.post(
        "/agent",
        content=run_input.model_dump_json(by_alias=True),
        headers={"content-type": "text/plain"},
    )
    assert response.status_code == 415
