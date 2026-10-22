"""Tool selection validation and model-visible tools, without provider requests."""

import json
from asyncio import gather

import pytest
from pydantic import ValidationError
from pydantic_ai import FunctionToolset
from pydantic_ai.messages import ModelMessage, ModelResponse, TextPart, ToolCallPart, ToolReturnPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

from app.agents import assistant
from app.agents.base import AgentDeps, BaseAgent
from app.agents.tools.selection import ToolSelection

catalog_tools = FunctionToolset[AgentDeps]()


@catalog_tools.tool_plain(metadata={"label": "Lookup"})
def lookup(term: str) -> str:
    """Look up a term."""
    return term.upper()


@catalog_tools.tool_plain(metadata={"label": "Reverser"})
def reverse(text: str) -> str:
    """Reverse text."""
    return text[::-1]


@catalog_tools.tool_plain(metadata={"label": "Web search", "available": False})
def search(query: str) -> str:
    """Search the web."""
    return query


@pytest.fixture
def catalog_agent(test_agents: None) -> BaseAgent[str]:
    return BaseAgent[str](spec="assistant", toolsets=[catalog_tools])


def selected(*names: str) -> ToolSelection:
    return ToolSelection(enabledTools=list(names))


def enabled_tools(agent: BaseAgent[str], state: object) -> frozenset[str] | None:
    selection = ToolSelection.model_validate(state)
    agent.check_tool_selection(selection)
    deps = AgentDeps(session_id="selection", available_tools=agent.available_tools, state=selection)
    return deps.enabled_tools


def test_selection_defaults_and_empty_selection(catalog_agent: BaseAgent[str]) -> None:
    assert enabled_tools(catalog_agent, {}) == frozenset({"lookup", "reverse"})
    assert enabled_tools(catalog_agent, {"enabledTools": []}) == frozenset()


def test_unavailable_tools_cannot_be_enabled(catalog_agent: BaseAgent[str]) -> None:
    assert enabled_tools(catalog_agent, {"enabledTools": ["search"]}) == frozenset()


@pytest.mark.parametrize("selection", ["lookup", [1], {}])
def test_malformed_selection_is_rejected(selection: object) -> None:
    with pytest.raises(ValidationError):
        ToolSelection.model_validate({"enabledTools": selection})


def test_tools_outside_the_agent_catalog_are_rejected(catalog_agent: BaseAgent[str]) -> None:
    with pytest.raises(ValueError, match="Unknown tool"):
        enabled_tools(catalog_agent, {"enabledTools": ["unknown"]})


async def test_concurrent_runs_filter_tools_independently(catalog_agent: BaseAgent[str]) -> None:
    def model(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        return ModelResponse(
            parts=[TextPart(json.dumps(sorted(t.name for t in info.function_tools)))]
        )

    selections = [selected(), selected("lookup"), selected("reverse")]
    with catalog_agent.override(model=FunctionModel(model)):
        results = await gather(
            *(
                catalog_agent.run("List tools.", deps=AgentDeps(session_id=str(i), state=s))
                for i, s in enumerate(selections)
            )
        )
    for result, selection in zip(results, selections, strict=True):
        assert json.loads(result.output) == sorted(selection.enabled_tools or [])


async def test_instructions_describe_enabled_disabled_and_unavailable_tools(
    catalog_agent: BaseAgent[str],
) -> None:
    seen: list[str] = []

    def model(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        seen.append(info.instructions or "")
        return ModelResponse(parts=[TextPart("ok")])

    with catalog_agent.override(model=FunctionModel(model)):
        await catalog_agent.run("Hi", deps=AgentDeps(session_id="t", state=selected("lookup")))

    assert "- lookup (Lookup): Look up a term." in seen[0]
    assert "Disabled by the user for this run: reverse (Reverser)." in seen[0]
    assert "Not available on this server: search (Web search)." in seen[0]
    assert "Say you used a tool only if you called it during this run" in seen[0]


async def test_disabling_tools_updates_instructions_after_a_tool_run(
    catalog_agent: BaseAgent[str],
) -> None:
    def model(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        names = {tool.name for tool in info.function_tools}
        assert info.instructions is not None
        if not names:
            assert "No tools are enabled. Do not call any tool." in info.instructions
            return ModelResponse(parts=[TextPart("Please enable Lookup.")])
        assert names == {"lookup"}
        if isinstance(messages[-1].parts[-1], ToolReturnPart):
            return ModelResponse(parts=[TextPart("Looked it up.")])
        return ModelResponse(parts=[ToolCallPart("lookup", {"term": "ag-ui"})])

    with catalog_agent.override(model=FunctionModel(model)):
        first = await catalog_agent.run(
            "Look up AG-UI.", deps=AgentDeps(session_id="t", state=selected("lookup"))
        )
        second = await catalog_agent.run(
            "Again.",
            deps=AgentDeps(session_id="t", state=selected()),
            message_history=first.all_messages(),
        )

    assert first.output == "Looked it up."
    assert second.output == "Please enable Lookup."
    assert not any(
        isinstance(part, ToolCallPart | ToolReturnPart)
        for message in second.new_messages()
        for part in message.parts
    )


async def test_only_agents_with_a_catalog_get_tool_selection_instructions(
    test_agents: None,
) -> None:
    seen: list[str] = []

    def model(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
        seen.append(info.instructions or "")
        return ModelResponse(parts=[TextPart('{"message":"ok"}')])

    deps = AgentDeps(session_id="instructions", state=selected("summarize"))
    parent = assistant.get_assistant_agent()
    child = BaseAgent[str](spec="assistant")
    with parent.override(model=FunctionModel(model)), child.override(model=FunctionModel(model)):
        await parent.run("Hello", deps=deps)
        await child.run("Hello", deps=deps)

    parent_instructions, no_catalog_instructions = seen
    assert (
        "- summarize (Summarizer): Summarize the supplied text and return the summary."
        in parent_instructions
    )
    assert "## Tools for this run" not in no_catalog_instructions
