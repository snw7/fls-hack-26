import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.dependencies import get_agent_service
from app.main import app, settings as app_settings
from app.schemas import (
    DiscoveryResponse,
    RevisionErrorResponse,
    RevisionUpdatedResponse,
    TranscriptionResponse,
)


class FakeAgentService:
    def __init__(self) -> None:
        self.revision_called = False

    def run_discovery(self, request):
        return DiscoveryResponse(
            status="needs_user_input",
            assistant_message="Which team owns the workflow after approval?",
            document_ready=False,
            markdown=None,
            collected_context={
                "goal": None,
                "business_context": None,
                "users": "business analyst",
                "functional_requirements": None,
                "non_functional_requirements": None,
                "risks_and_dependencies": None,
            },
        )

    def run_revision(self, request):
        self.revision_called = True
        return RevisionUpdatedResponse(
            status="updated",
            assistant_message="I updated the draft based on the submitted comments.",
            updated_markdown="# Draft\n\n## Goal\n\nCreate an agent-assisted workflow.\n",
            change_summary=["Expanded the goal section."],
        )

    def transcribe_audio(self, filename, content_type, data):
        return TranscriptionResponse(
            text=f"Transcript from {filename} ({content_type}, {len(data)} bytes)."
        )


def test_discovery_endpoint_returns_contract_shape():
    app.dependency_overrides[get_agent_service] = lambda: FakeAgentService()
    client = TestClient(app)

    response = client.post(
        "/webhook/discovery-agent",
        json={
            "session_id": "t1",
            "mode": "continue_or_generate",
            "template": {
                "id": "business-requirements-v1",
                "content": "# Title\n\n## Goal\n",
                "fields": [
                    {
                        "key": "goal",
                        "label": "Goal",
                        "description": "What is the desired outcome?",
                    }
                ],
            },
            "chat_history": [
                {
                    "role": "user",
                    "content": "I want an AI system that helps create requirement documents.",
                }
            ],
            "latest_user_message": "It should help analysts talk to an agent.",
            "document_language": "en",
            "output_format": "json",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "needs_user_input"
    assert payload["document_ready"] is False
    assert payload["markdown"] is None

    app.dependency_overrides.clear()


def test_discovery_endpoint_accepts_template_without_fields():
    app.dependency_overrides[get_agent_service] = lambda: FakeAgentService()
    client = TestClient(app)

    response = client.post(
        "/webhook/discovery-agent",
        json={
            "session_id": "t1-no-fields",
            "mode": "continue_or_generate",
            "template": {
                "id": "business-requirements-v1",
                "content": "# Title\n\n## Goal\n",
            },
            "chat_history": [
                {
                    "role": "user",
                    "content": "I want an AI system that helps create requirement documents.",
                }
            ],
            "latest_user_message": "It should help analysts talk to an agent.",
            "document_language": "en",
            "output_format": "json",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "needs_user_input"

    app.dependency_overrides.clear()


def test_discovery_endpoint_rejects_unknown_template_keys():
    app.dependency_overrides[get_agent_service] = lambda: FakeAgentService()
    client = TestClient(app)

    response = client.post(
        "/webhook/discovery-agent",
        json={
            "session_id": "t1-invalid-template",
            "mode": "continue_or_generate",
            "template": {
                "id": "business-requirements-v1",
                "content": "# Title\n\n## Goal\n",
                "fields": [
                    {
                        "key": "goal",
                        "label": "Goal",
                        "description": "What is the desired outcome?",
                    }
                ],
                "unexpected": "reject me",
            },
            "chat_history": [
                {
                    "role": "user",
                    "content": "I want an AI system that helps create requirement documents.",
                }
            ],
            "latest_user_message": "It should help analysts talk to an agent.",
            "document_language": "en",
            "output_format": "json",
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["detail"][0]["loc"] == ["body", "template", "unexpected"]
    assert payload["detail"][0]["type"] == "extra_forbidden"

    app.dependency_overrides.clear()


def test_health_endpoint_exposes_version_and_build_headers():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "FI Agent Service",
        "version": "0.1.0",
        "build_id": "dev",
    }
    assert response.headers["x-service-version"] == "0.1.0"
    assert response.headers["x-build-id"] == "dev"


def test_export_session_writes_json_file(tmp_path):
    client = TestClient(app)
    original_dir = app_settings.requirements_export_dir
    app_settings.requirements_export_dir = tmp_path

    response = client.post(
        "/sessions/session-123/export-json",
        json={
            "session": {
                "schemaVersion": 1,
                "sessionId": "session-123",
                "phase": "review",
                "status": "ready",
                "templateId": "business-requirements-v1",
                "language": "en",
                "createdAt": "2026-04-10T10:00:00Z",
                "updatedAt": "2026-04-10T10:05:00Z",
                "chatHistory": [
                    {
                        "id": "assistant-1",
                        "role": "assistant",
                        "content": "Describe the business need.",
                        "timestamp": "2026-04-10T10:00:00Z",
                    }
                ],
                "revisions": [
                    {
                        "id": "rev-1",
                        "markdown": "# Requirement Brief",
                        "createdAt": "2026-04-10T10:05:00Z",
                        "source": "generated",
                    }
                ],
                "pendingComments": [
                    {
                        "id": "comment-1",
                        "selectedText": "Business analysts",
                        "commentText": "Clarify their responsibilities.",
                        "contextBefore": "",
                        "contextAfter": "",
                        "startOffset": 10,
                        "endOffset": 27,
                        "createdAt": "2026-04-10T10:05:00Z",
                    }
                ],
                "collectedContext": {
                    "goal": "Reduce manual requirement intake.",
                    "business_context": None,
                    "users": "Business analysts",
                    "functional_requirements": None,
                    "non_functional_requirements": None,
                    "risks_and_dependencies": None,
                },
                "changeSummary": ["Created the first draft."],
                "lastError": None,
            }
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "saved"
    assert Path(payload["file_path"]) == tmp_path / "session-123.json"

    saved_payload = json.loads((tmp_path / "session-123.json").read_text(encoding="utf-8"))
    assert saved_payload["session"]["collectedContext"]["goal"] == "Reduce manual requirement intake."
    assert saved_payload["current_markdown"] == "# Requirement Brief"
    assert saved_payload["current_revision"]["id"] == "rev-1"
    assert saved_payload["latest_change_summary"] == ["Created the first draft."]

    app_settings.requirements_export_dir = original_dir


def test_export_session_rejects_mismatched_session_id(tmp_path):
    client = TestClient(app)
    original_dir = app_settings.requirements_export_dir
    app_settings.requirements_export_dir = tmp_path

    response = client.post(
        "/sessions/session-abc/export-json",
        json={
            "session": {
                "schemaVersion": 1,
                "sessionId": "session-def",
                "phase": "review",
                "status": "ready",
                "templateId": "business-requirements-v1",
                "language": "en",
                "createdAt": "2026-04-10T10:00:00Z",
                "updatedAt": "2026-04-10T10:05:00Z",
                "chatHistory": [],
                "revisions": [],
                "pendingComments": [],
                "collectedContext": {
                    "goal": None,
                    "business_context": None,
                    "users": None,
                    "functional_requirements": None,
                    "non_functional_requirements": None,
                    "risks_and_dependencies": None,
                },
                "changeSummary": [],
                "lastError": None,
            }
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Session ID in path does not match request body."

    app_settings.requirements_export_dir = original_dir


def test_export_session_rejects_malformed_payload(tmp_path):
    client = TestClient(app)
    original_dir = app_settings.requirements_export_dir
    app_settings.requirements_export_dir = tmp_path

    response = client.post(
        "/sessions/session-123/export-json",
        json={
            "session": {
                "schemaVersion": 1,
                "sessionId": "session-123",
                "phase": "review",
                "status": "ready",
                "templateId": "business-requirements-v1",
                "language": "en",
                "createdAt": "2026-04-10T10:00:00Z",
                "updatedAt": "2026-04-10T10:05:00Z",
                "chatHistory": [],
                "revisions": [],
                "pendingComments": [],
                "collectedContext": {
                    "goal": None,
                    "business_context": None,
                    "users": None,
                    "functional_requirements": None,
                    "non_functional_requirements": None,
                    "risks_and_dependencies": None,
                },
                "changeSummary": [],
                "lastError": None,
                "unexpected": True,
            }
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "session", "unexpected"]

    app_settings.requirements_export_dir = original_dir


def test_revision_endpoint_returns_selected_text_error_without_model_call():
    class MissingTextService(FakeAgentService):
        def run_revision(self, request):
            return RevisionErrorResponse(
                status="error",
                assistant_message=(
                    "I could not apply the requested changes because one selected text snippet was not found in the document."
                ),
                error_code="SELECTED_TEXT_NOT_FOUND",
            )

    app.dependency_overrides[get_agent_service] = lambda: MissingTextService()
    client = TestClient(app)

    response = client.post(
        "/webhook/revision-agent",
        json={
            "session_id": "t6",
            "base_revision_id": "rev-1",
            "current_markdown": "# Draft\n\n## Goal\n\nCreate a requirement workflow.\n",
            "comments": [
                {
                    "comment_id": "c-1",
                    "selected_text": "This text does not exist",
                    "comment_text": "Update this.",
                }
            ],
            "document_language": "en",
            "output_format": "json",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "error"
    assert payload["error_code"] == "SELECTED_TEXT_NOT_FOUND"

    app.dependency_overrides.clear()


def test_revision_endpoint_returns_updated_markdown():
    app.dependency_overrides[get_agent_service] = lambda: FakeAgentService()
    client = TestClient(app)

    response = client.post(
        "/webhook/revision-agent",
        json={
            "session_id": "t5",
            "base_revision_id": "rev-1",
            "current_markdown": "# Draft\n\n## Goal\n\nCreate a requirement workflow.\n",
            "comments": [
                {
                    "comment_id": "c-1",
                    "selected_text": "Create a requirement workflow.",
                    "comment_text": "Mention that the workflow is agent-assisted.",
                }
            ],
            "document_language": "en",
            "output_format": "json",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "updated"

    app.dependency_overrides.clear()


def test_transcription_endpoint_returns_text():
    app.dependency_overrides[get_agent_service] = lambda: FakeAgentService()
    client = TestClient(app)

    response = client.post(
        "/audio/transcriptions",
        files={
            "file": ("recording.webm", b"audio-bytes", "audio/webm"),
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["text"] == "Transcript from recording.webm (audio/webm, 11 bytes)."

    app.dependency_overrides.clear()
