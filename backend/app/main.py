from fastapi import Depends, FastAPI, HTTPException

from .dependencies import get_agent_service
from .schemas import (
    DiscoveryRequest,
    DiscoveryResponse,
    HealthResponse,
    RevisionErrorResponse,
    RevisionRequest,
    RevisionUpdatedResponse,
)
from .service import AgentService, AgentServiceError
from .settings import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.service_name,
    version="0.1.0",
)


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.service_name)


@app.post("/webhook/discovery-agent", response_model=DiscoveryResponse)
@app.post("/webhook-test/discovery-agent", response_model=DiscoveryResponse)
def discovery_agent(
    request: DiscoveryRequest,
    agent_service: AgentService = Depends(get_agent_service),
) -> DiscoveryResponse:
    try:
        return agent_service.run_discovery(request)
    except AgentServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(
            status_code=502,
            detail="The discovery agent failed unexpectedly.",
        ) from exc


@app.post(
    "/webhook/revision-agent",
    response_model=RevisionUpdatedResponse | RevisionErrorResponse,
)
@app.post(
    "/webhook-test/revision-agent",
    response_model=RevisionUpdatedResponse | RevisionErrorResponse,
)
def revision_agent(
    request: RevisionRequest,
    agent_service: AgentService = Depends(get_agent_service),
) -> RevisionUpdatedResponse | RevisionErrorResponse:
    try:
        return agent_service.run_revision(request)
    except AgentServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(
            status_code=502,
            detail="The revision agent failed unexpectedly.",
        ) from exc
