"""Tool catalog entries and the per-run tool selection sent as AG-UI state."""

from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from pydantic_ai import FunctionToolset
from pydantic_ai.toolsets import AbstractToolset


class AgentTool(BaseModel):
    name: str
    label: str
    description: str
    available: bool = True


class ToolSelection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    enabled_tools: list[str] | None = Field(default=None, alias="enabledTools", strict=True)


def catalog_from_toolsets(toolsets: Sequence[AbstractToolset[Any]]) -> list[AgentTool]:
    """List the tools of function toolsets, labelled by their `metadata`.

    A tool's description is its docstring; `metadata={"label": ...}` sets the label shown in
    the tool selector, and `metadata={"available": False}` lists it as unavailable.
    """
    catalog: list[AgentTool] = []
    for toolset in toolsets:
        if not isinstance(toolset, FunctionToolset):
            continue
        for tool in toolset.tools.values():
            metadata = tool.metadata or {}
            catalog.append(
                AgentTool(
                    name=tool.name,
                    label=metadata.get("label", tool.name),
                    description=tool.description or "",
                    available=metadata.get("available", True),
                )
            )
    return catalog
