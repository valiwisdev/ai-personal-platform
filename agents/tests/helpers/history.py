"""Configurable backend HTTP responses for history-client tests."""

import httpx

from app.dependencies.history import ThreadHistory


class HistoryBackend:
    """Configurable HTTP responses for history-client tests; no model requests."""

    def __init__(self, history: ThreadHistory) -> None:
        self.history = history
        self.load_status = 200
        self.save_status = 200
        self.requests: list[httpx.Request] = []

    def handle(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        status = self.load_status
        if request.method == "PUT":
            status = self.save_status
        payload = self.history.model_dump(mode="json", by_alias=True)
        return httpx.Response(status, json=payload)
