import json
from typing import Any, Protocol

from openai import OpenAI

from .prompts import build_discovery_messages, build_revision_messages
from .schemas import (
    DiscoveryRequest,
    DiscoveryResponse,
    RevisionErrorResponse,
    RevisionRequest,
    RevisionUpdatedResponse,
)
from .settings import Settings


class AgentServiceError(RuntimeError):
    pass


class AgentService(Protocol):
    def run_discovery(self, request: DiscoveryRequest) -> DiscoveryResponse: ...

    def run_revision(
        self, request: RevisionRequest
    ) -> RevisionUpdatedResponse | RevisionErrorResponse: ...


def _strip_code_fences(value: str) -> str:
    stripped = value.strip()

    if stripped.startswith("```") and stripped.endswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()

    return stripped


def _extract_json_payload(raw_text: str) -> dict[str, Any]:
    candidate = _strip_code_fences(raw_text)

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start == -1 or end == -1 or start >= end:
            raise AgentServiceError("The model returned invalid JSON.")

        try:
            return json.loads(candidate[start : end + 1])
        except json.JSONDecodeError as exc:
            raise AgentServiceError("The model returned invalid JSON.") from exc


def _sanitize_markdown(markdown: str | None) -> str | None:
    if markdown is None:
        return None
    return _strip_code_fences(markdown)


class OpenAIAgentService:
    def __init__(self, settings: Settings):
        self._settings = settings
        client_kwargs: dict[str, str] = {}
        if settings.openai_api_key:
            client_kwargs["api_key"] = settings.openai_api_key
        if settings.openai_base_url:
            client_kwargs["base_url"] = settings.openai_base_url
        self._client = OpenAI(**client_kwargs) if settings.openai_api_key else None

    def _require_client(self) -> OpenAI:
        if self._client is None:
            raise AgentServiceError(
                "OPENAI_API_KEY is not configured. Set it in the environment before calling the agent service."
            )
        return self._client

    def _invoke_json(
        self, messages: list[dict[str, str]], max_output_tokens: int
    ) -> dict[str, Any]:
        client = self._require_client()
        response = client.responses.create(
            model=self._settings.openai_model,
            reasoning={"effort": self._settings.openai_reasoning_effort},
            input=messages,
            max_output_tokens=max_output_tokens,
            store=False,
        )

        status = getattr(response, "status", None)
        if status == "incomplete":
            raise AgentServiceError("The OpenAI response was incomplete.")

        output_text = getattr(response, "output_text", None)
        if not output_text:
            raise AgentServiceError("The OpenAI response was empty.")

        return _extract_json_payload(output_text)

    def run_discovery(self, request: DiscoveryRequest) -> DiscoveryResponse:
        payload = self._invoke_json(
            build_discovery_messages(request),
            max_output_tokens=self._settings.openai_max_output_tokens_discovery,
        )
        response = DiscoveryResponse.model_validate(payload)
        response.markdown = _sanitize_markdown(response.markdown)
        return response

    def run_revision(
        self, request: RevisionRequest
    ) -> RevisionUpdatedResponse | RevisionErrorResponse:
        missing_comment = next(
            (
                comment
                for comment in request.comments
                if comment.selected_text.strip()
                and comment.selected_text not in request.current_markdown
            ),
            None,
        )

        if missing_comment is not None:
            return RevisionErrorResponse(
                status="error",
                assistant_message=(
                    "I could not apply the requested changes because one selected text snippet was not found in the document."
                ),
                error_code="SELECTED_TEXT_NOT_FOUND",
            )

        payload = self._invoke_json(
            build_revision_messages(request),
            max_output_tokens=self._settings.openai_max_output_tokens_revision,
        )
        response = RevisionUpdatedResponse.model_validate(payload)
        response.updated_markdown = _sanitize_markdown(response.updated_markdown) or ""
        return response
