"""Configurable backend HTTP responses for conversation-client tests."""

import httpx

from app.dependencies.conversations import Conversation


class ConversationsBackend:
    """Configurable HTTP responses for conversation-client tests; no model requests."""

    def __init__(self, conversations: list[Conversation] | None = None) -> None:
        self.conversations = conversations or []
        self.list_status = 200
        self.delete_status = 204
        self.requests: list[httpx.Request] = []

    def handle(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if request.method == "DELETE":
            if self.delete_status == 204:
                self.conversations = [
                    conversation
                    for conversation in self.conversations
                    if not (
                        conversation.thread_id == request.url.path.rsplit("/", 1)[-1]
                        and conversation.agent_id == request.url.params.get("agentId")
                    )
                ]
            return httpx.Response(self.delete_status)
        payload = [
            conversation.model_dump(mode="json", by_alias=True)
            for conversation in self.conversations
        ]
        return httpx.Response(self.list_status, json=payload)
