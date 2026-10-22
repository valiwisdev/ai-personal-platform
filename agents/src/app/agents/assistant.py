from functools import lru_cache

from pydantic import BaseModel, Field
from pydantic_ai import NativeOutput

from app.agents.base import BaseAgent
from app.agents.tools.summarize import summarize_toolset


class AgentResponse(BaseModel):
    message: str = Field(min_length=1, description="The assistant response to the user.")


@lru_cache
def get_assistant_agent() -> BaseAgent[AgentResponse]:
    return BaseAgent[AgentResponse](
        spec="assistant",
        output_type=NativeOutput(AgentResponse),
        toolsets=[summarize_toolset],
    )
