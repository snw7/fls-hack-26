from functools import lru_cache

from .service import AgentService, OpenAIAgentService
from .settings import Settings, get_settings


@lru_cache
def get_agent_service() -> AgentService:
    settings: Settings = get_settings()
    return OpenAIAgentService(settings)

