"""YAML specs: agent definitions in `agents/` and reusable prompt templates in `prompts/`."""

from functools import cache
from pathlib import Path

import yaml
from pydantic import BaseModel
from pydantic_ai.agent.spec import AgentSpec

SPECS_DIR = Path(__file__).parent


class PromptSpec(BaseModel):
    description: str
    template: str


@cache
def load_agent_spec(name: str) -> AgentSpec:
    """Load `agents/<name>.yaml`, a Pydantic AI `AgentSpec` with an agent's prompt."""
    return AgentSpec.from_file(SPECS_DIR / "agents" / f"{name}.yaml")


@cache
def load_prompt(name: str) -> PromptSpec:
    """Load `prompts/<name>.yaml`, a Handlebars prompt template used by code."""
    text = (SPECS_DIR / "prompts" / f"{name}.yaml").read_text(encoding="utf-8")
    return PromptSpec.model_validate(yaml.safe_load(text))
