from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    service_name: str = "FI Agent Service"
    service_version: str = "0.1.0"
    backend_build_id: str = "dev"
    requirements_export_dir: Path = Path("/app/data/requirements")
    n8n_export_webhook_url: str | None = None
    n8n_export_webhook_secret: str | None = None
    n8n_export_webhook_secret_header: str = "secret"
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str = "gpt-5.4-mini"
    openai_transcription_model: str = "gpt-4o-transcribe"
    openai_reasoning_effort: str = "low"
    openai_max_output_tokens_discovery: int = Field(default=2200, ge=256)
    openai_max_output_tokens_revision: int = Field(default=3600, ge=256)


@lru_cache
def get_settings() -> Settings:
    return Settings()
