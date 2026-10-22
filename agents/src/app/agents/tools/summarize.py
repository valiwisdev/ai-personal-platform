"""The summarize tool: one model request that summarizes the supplied text."""

from functools import cache

from pydantic import BaseModel
from pydantic_ai import FunctionToolset, RunContext, TemplateStr
from pydantic_ai.direct import model_request
from pydantic_ai.messages import ModelRequest, UserPromptPart
from pydantic_ai.models import Model

from app.agents.base.model import AgentDeps, agent_model_settings
from app.agents.specs import load_prompt

MIN_SUMMARY_WORDS = 15
SUMMARY_RATIO = 0.25


class SummaryBudget(BaseModel):
    source_words: int
    max_summary_words: int


def summary_budget(text: str) -> SummaryBudget:
    words = len(text.split())
    limit = max(MIN_SUMMARY_WORDS, round(words * SUMMARY_RATIO))
    return SummaryBudget(source_words=words, max_summary_words=min(words, limit))


class Summary(BaseModel):
    """Structured so the tool result is JSON, which AG-UI clients parse."""

    summary: str


@cache
def summarize_instructions() -> TemplateStr[SummaryBudget]:
    return TemplateStr(load_prompt("summarize").template, deps_type=SummaryBudget)


summarize_toolset = FunctionToolset[AgentDeps]()


@summarize_toolset.tool(metadata={"label": "Summarizer"})
async def summarize(ctx: RunContext[AgentDeps], text: str) -> Summary:
    """Summarize the supplied text and return the summary.

    Args:
        text: The complete text to summarize, exactly as the user supplied it.
    """
    request = ModelRequest(
        parts=[UserPromptPart(text)],
        instructions=summarize_instructions().render(summary_budget(text)),
    )
    if not isinstance(ctx.model, Model):
        raise TypeError("summarize needs a concrete model to send its request to.")
    response = await model_request(ctx.model, [request], model_settings=agent_model_settings(ctx))
    ctx.usage.requests += 1
    ctx.usage.incr(response.usage)
    return Summary(summary=response.text or "")
