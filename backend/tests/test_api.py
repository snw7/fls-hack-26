from fastapi.testclient import TestClient

from app.dependencies import get_agent_service
from app.main import app
from app.schemas import (
    DiscoveryResponse,
    RevisionErrorResponse,
    RevisionUpdatedResponse,
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
            collected_context={"primary_user": "business analyst"},
        )

    def run_revision(self, request):
        self.revision_called = True
        return RevisionUpdatedResponse(
            status="updated",
            assistant_message="I updated the draft based on the submitted comments.",
            updated_markdown="# Draft\n\n## Goal\n\nCreate an agent-assisted workflow.\n",
            change_summary=["Expanded the goal section."],
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
    payload = response.json()
    assert payload["status"] == "updated"
    assert payload["updated_markdown"].startswith("# Draft")

    app.dependency_overrides.clear()
