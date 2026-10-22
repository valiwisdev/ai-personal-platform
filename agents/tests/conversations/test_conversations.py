"""Conversation metadata client and title tests."""

import httpx
import pytest
from pydantic_ai.messages import (
    BinaryContent,
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
    TextContent,
    TextPart,
    UserPromptPart,
)

from app.dependencies.conversations import Conversation, ConversationClient, conversation_title
from tests.helpers.conversations import ConversationsBackend


async def test_conversation_client_requests_its_agent_filter(
    conversation_client: ConversationClient, conversations_backend: ConversationsBackend
) -> None:
    conversations_backend.conversations = [
        Conversation.model_validate(
            {
                "threadId": "thread-1",
                "agentId": "assistant",
                "title": "Hello",
                "updatedAt": "2026-01-01T00:00:00Z",
            }
        ),
        Conversation.model_validate(
            {
                "threadId": "thread-2",
                "agentId": "other",
                "title": "Other",
                "updatedAt": "2026-01-02T00:00:00Z",
            }
        ),
    ]
    conversations = await conversation_client.list("assistant")

    assert [conversation.thread_id for conversation in conversations] == ["thread-1", "thread-2"]
    request = conversations_backend.requests[0]
    assert request.method == "GET"
    assert request.url.path == "/conversations"
    assert request.url.params["agentId"] == "assistant"


async def test_conversation_client_reports_backend_failure(
    conversation_client: ConversationClient, conversations_backend: ConversationsBackend
) -> None:
    conversations_backend.list_status = 503

    with pytest.raises(httpx.HTTPStatusError):
        await conversation_client.list("assistant")


def test_conversation_title_uses_first_user_prompt() -> None:
    messages = [
        ModelRequest(parts=[SystemPromptPart("Be brief"), UserPromptPart("  Hello   world  ")]),
        ModelResponse(parts=[TextPart('{"message":"Hi"}')]),
    ]

    assert conversation_title(messages) == "Hello world"


def test_conversation_title_truncates_to_eighty_characters() -> None:
    long_text = "word " * 40
    messages = [ModelRequest(parts=[UserPromptPart(long_text)])]

    title = conversation_title(messages)

    assert title is not None
    assert len(title) == 80
    assert title == " ".join(long_text.split())[:80]


def test_conversation_title_reads_text_content_parts() -> None:
    messages = [
        ModelRequest(parts=[UserPromptPart([TextContent("Hello"), TextContent("  world  ")])])
    ]

    assert conversation_title(messages) == "Hello world"


def test_conversation_title_skips_non_text_parts() -> None:
    messages = [ModelRequest(parts=[UserPromptPart([])])]

    assert conversation_title(messages) is None


def test_conversation_title_requires_a_user_prompt() -> None:
    messages = [ModelResponse(parts=[TextPart('{"message":"Hi"}')])]

    assert conversation_title(messages) is None


def test_conversation_title_uses_text_sent_with_an_attachment() -> None:
    image = BinaryContent(data=b"\x89PNG", media_type="image/png")
    messages = [ModelRequest(parts=[UserPromptPart(["What is in this image?", image])])]
    assert conversation_title(messages) == "What is in this image?"
