import json
from datetime import datetime, timezone

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import Response
from fastapi import File, UploadFile

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
    TranscriptionResponse,
)
from .service import AgentService, AgentServiceError
from .settings import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
)


def _forward_export_payload(payload: dict) -> None:
    if not settings.n8n_export_webhook_url:
        return

    headers = {"Content-Type": "application/json"}
    if settings.n8n_export_webhook_secret:
        headers[settings.n8n_export_webhook_secret_header] = (
            settings.n8n_export_webhook_secret
        )

    try:
        response = httpx.post(
            settings.n8n_export_webhook_url,
            headers=headers,
            json=payload,
            timeout=30.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail="The requirements JSON was saved locally but could not be sent to the configured webhook.",
        ) from exc

    if response.is_error:
        detail = (
            "The requirements JSON was saved locally but the configured webhook rejected it."
        )
        try:
            response_payload = response.json()
        except ValueError:
            response_payload = None

        if isinstance(response_payload, dict):
            if isinstance(response_payload.get("message"), str):
                detail = response_payload["message"]
            elif isinstance(response_payload.get("error"), str):
                detail = response_payload["error"]
        elif response.text:
            detail = response.text

        raise HTTPException(status_code=503, detail=detail)


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
    _forward_export_payload(payload)

    return ExportSessionResponse(
        status="saved",
        session_id=session_id,
        file_path=str(file_path),
        saved_at=saved_at,
    )


@app.post("/audio/transcriptions", response_model=TranscriptionResponse)
async def create_transcription(
    file: UploadFile = File(...),
    agent_service: AgentService = Depends(get_agent_service),
) -> TranscriptionResponse:
    audio = await file.read()

    if not audio:
        raise HTTPException(status_code=400, detail="The uploaded audio file was empty.")

    try:
        return agent_service.transcribe_audio(
            filename=file.filename or "recording.webm",
            content_type=file.content_type,
            data=audio,
        )
    except AgentServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(
            status_code=502,
            detail="The transcription request failed unexpectedly.",
        ) from exc
