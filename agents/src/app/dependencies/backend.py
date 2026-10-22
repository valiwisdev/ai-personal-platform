"""The shared, pooled HTTP client for the backend API."""

from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request
from pydantic import ValidationError

BackendError = (httpx.HTTPError, ValidationError, ValueError)


def create_backend_client(base_url: str) -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=10)


def get_backend_client(request: Request) -> httpx.AsyncClient:
    client: httpx.AsyncClient | None = getattr(request.app.state, "backend_client", None)
    if client is None:
        raise HTTPException(status_code=503, detail="BACKEND_URL is required.")
    return client


BackendClient = Annotated[httpx.AsyncClient, Depends(get_backend_client)]
