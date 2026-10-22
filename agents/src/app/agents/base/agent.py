from collections.abc import Callable, Sequence
from typing import Any

from pydantic_ai import Agent, RunContext, TemplateStr
from pydantic_ai.capabilities import AbstractCapability
from pydantic_ai.toolsets import AbstractToolset

from app.agents.base.capabilities import EnabledTools
from app.agents.base.model import AgentDeps, agent_model_settings, get_agent_model
from app.agents.specs import load_agent_spec
from app.agents.tools.selection import AgentTool, ToolSelection, catalog_from_toolsets

type Instruction = str | TemplateStr[AgentDeps] | Callable[[RunContext[AgentDeps]], str]


def _instruction_list(
    instructions: Instruction | Sequence[Instruction] | None,
) -> list[Instruction]:
    if instructions is None:
        return []
    if isinstance(instructions, str | TemplateStr) or callable(instructions):
        return [instructions]
    return list(instructions)


class BaseAgent[OutputT](Agent[AgentDeps, OutputT]):
    """Shared-model agent with `AgentDeps`, a YAML spec, and a catalog of its own tools.

    The spec file in `app/agents/specs/agents/` supplies the name, description, and base
    instructions. The catalog is built from the agent's function toolsets; agents with tools
    get the `EnabledTools` capability, which filters them and describes them by the run's
    tool selection.
    """

    def __init__(
        self,
        *,
        spec: str,
        instructions: Instruction | Sequence[Instruction] = (),
        toolsets: Sequence[AbstractToolset[AgentDeps]] = (),
        capabilities: Sequence[AbstractCapability[AgentDeps]] = (),
        **kwargs: Any,
    ) -> None:
        agent_spec = load_agent_spec(spec)
        instruction_list = [
            *_instruction_list(agent_spec.instructions),
            *_instruction_list(instructions),
        ]
        catalog = catalog_from_toolsets(toolsets)
        enabled_tools = EnabledTools(catalog=catalog)
        capability_list = list(capabilities)
        if catalog:
            capability_list.append(enabled_tools)
        super().__init__(
            get_agent_model(),
            deps_type=AgentDeps,
            model_settings=agent_model_settings,
            name=agent_spec.name,
            description=agent_spec.description,
            instructions=instruction_list,
            toolsets=toolsets,
            capabilities=capability_list,
            **kwargs,
        )
        self.enabled_tools = enabled_tools

    @property
    def tool_catalog(self) -> list[AgentTool]:
        return list(self.enabled_tools.catalog)

    @property
    def available_tools(self) -> frozenset[str]:
        return self.enabled_tools.available_tools

    def check_tool_selection(self, selection: ToolSelection) -> None:
        """Reject selected tool names that are not in this agent's catalog."""
        self.enabled_tools.check(selection)
