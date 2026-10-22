from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=False, env_file=".env", extra="ignore")

    cors_origins: str = ""
    agent_id: str = "assistant"
    agent_model: str = "gpt-6-luna"
    opencode_api_key: str = ""
    opencode_base_url: str = ""
    backend_url: str = ""
    logfire_token: SecretStr = SecretStr("")
    logfire_service_name: str = "agents"
    logfire_environment: str = "development"
    logfire_include_content: bool = False

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
