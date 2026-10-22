from dataclasses import dataclass, field
from functools import lru_cache

from pydantic_ai import ModelSettings, RunContext
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.agents.tools.selection import ToolSelection
from app.core.config import get_settings


@dataclass
class AgentDeps:
    """Run dependencies; the AG-UI adapter validates the frontend state into `state`."""

    session_id: str
    available_tools: frozenset[str] | None = None
    state: ToolSelection = field(default_factory=ToolSelection)

    @property
    def enabled_tools(self) -> frozenset[str] | None:
        requested = self.state.enabled_tools
        if requested is None:
            return self.available_tools
        if self.available_tools is None:
            return frozenset(requested)
        return self.available_tools.intersection(requested)


def agent_model_settings(ctx: RunContext[AgentDeps]) -> ModelSettings:
    """Build provider headers from dependencies forwarded to every subagent run."""
    return {
        "extra_headers": {
            "User-Agent": "ai-agent-platform/0.1.0",
            "x-opencode-session": ctx.deps.session_id,
        }
    }


@lru_cache
def get_agent_model() -> OpenAIResponsesModel:
    settings = get_settings()
    if not settings.opencode_base_url:
        raise ValueError("OPENCODE_BASE_URL is required")

    provider = OpenAIProvider(
        api_key=settings.opencode_api_key,
        base_url=settings.opencode_base_url,
    )
    return OpenAIResponsesModel(settings.agent_model, provider=provider)
