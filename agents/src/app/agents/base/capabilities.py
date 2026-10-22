"""Capabilities shared by agents built on `BaseAgent`."""

from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from functools import cache

from pydantic import BaseModel
from pydantic_ai import RunContext, TemplateStr
from pydantic_ai.capabilities import AbstractCapability
from pydantic_ai.tools import ToolDefinition

from app.agents.base.model import AgentDeps
from app.agents.specs import load_prompt
from app.agents.tools.selection import AgentTool, ToolSelection


class ToolPrompt(BaseModel):
    enabled: list[AgentTool]
    disabled: list[AgentTool]
    unavailable: list[AgentTool]


@cache
def tool_prompt_template() -> TemplateStr[ToolPrompt]:
    """Compile `specs/prompts/enabled_tools.yaml` against `ToolPrompt`, validating its fields."""
    return TemplateStr(load_prompt("enabled_tools").template, deps_type=ToolPrompt)


@dataclass
class EnabledTools(AbstractCapability[AgentDeps]):
    """Limit each run to the user's enabled catalog tools and explain that limit to the model.

    `prepare_tools` hides tools that are not enabled, and `get_instructions` renders
    `specs/prompts/enabled_tools.yaml` with the enabled, disabled, and unavailable tools, so the two
    always agree.
    """

    catalog: Sequence[AgentTool] = field(default_factory=list)

    @property
    def available_tools(self) -> frozenset[str]:
        return frozenset(tool.name for tool in self.catalog if tool.available)

    def check(self, selection: ToolSelection) -> None:
        """Reject selected tool names that are not in the catalog."""
        known = {tool.name for tool in self.catalog}
        if selection.enabled_tools is not None and not set(selection.enabled_tools) <= known:
            raise ValueError("Unknown tool in enabledTools.")

    def get_instructions(self) -> Callable[[RunContext[AgentDeps]], str]:
        return self.instructions

    async def prepare_tools(
        self, ctx: RunContext[AgentDeps], tool_defs: list[ToolDefinition]
    ) -> list[ToolDefinition]:
        if ctx.deps.enabled_tools is None:
            return tool_defs
        return [tool for tool in tool_defs if tool.name in ctx.deps.enabled_tools]

    def instructions(self, ctx: RunContext[AgentDeps]) -> str:
        enabled = ctx.deps.enabled_tools
        if enabled is None:
            enabled = self.available_tools
        prompt = ToolPrompt(
            enabled=[tool for tool in self.catalog if tool.name in enabled],
            disabled=[t for t in self.catalog if t.available and t.name not in enabled],
            unavailable=[tool for tool in self.catalog if not tool.available],
        )
        return tool_prompt_template().render(prompt)
