import json
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import Response

from .dependencies import get_agent_service
from .schemas import (
    DiscoveryRequest,
    DiscoveryResponse,
    ExportSessionRequest,
    ExportSessionResponse,
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
    version=settings.service_version,
)


@app.middleware("http")
async def add_build_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Service-Version"] = settings.service_version
    response.headers["X-Build-Id"] = settings.backend_build_id
    return response


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
        build_id=settings.backend_build_id,
    )


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


@app.post("/sessions/{session_id}/export-json", response_model=ExportSessionResponse)
def export_session_json(
    session_id: str,
    request: ExportSessionRequest,
) -> ExportSessionResponse:
    if request.session.sessionId != session_id:
        raise HTTPException(
            status_code=400,
            detail="Session ID in path does not match request body.",
        )

    export_dir = settings.requirements_export_dir
    export_dir.mkdir(parents=True, exist_ok=True)
    file_path = export_dir / f"{session_id}.json"
    tmp_path = file_path.with_suffix(".json.tmp")
    saved_at = datetime.now(timezone.utc).isoformat()

    current_revision = request.session.revisions[-1] if request.session.revisions else None
    payload = {
        "schema_version": request.session.schemaVersion,
        "exported_at": saved_at,
        "session": request.session.model_dump(mode="json"),
        "current_revision": current_revision.model_dump(mode="json") if current_revision else None,
        "current_markdown": current_revision.markdown if current_revision else None,
        "latest_change_summary": request.session.changeSummary,
    }

    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    tmp_path.replace(file_path)

    return ExportSessionResponse(
        status="saved",
        session_id=session_id,
        file_path=str(file_path),
        saved_at=saved_at,
    )
