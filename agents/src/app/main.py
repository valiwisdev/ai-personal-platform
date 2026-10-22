from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agent_router, conversations_router, health_router, history_router
from app.core.config import get_settings
from app.core.telemetry import configure_telemetry
from app.dependencies.backend import create_backend_client

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    client = create_backend_client(settings.backend_url) if settings.backend_url else None
    app.state.backend_client = client
    try:
        yield
    finally:
        if client is not None:
            await client.aclose()


app = FastAPI(title="AI Agent Platform API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(agent_router)
app.include_router(history_router)
app.include_router(conversations_router)
configure_telemetry(app, settings)
