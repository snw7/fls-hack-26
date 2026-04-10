import json
import re
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


def _normalize_for_match(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _build_normalized_index(markdown: str) -> tuple[str, list[int]]:
    normalized_chars: list[str] = []
    raw_index_by_normalized_index: list[int] = []
    pending_space_index: int | None = None
    at_line_start = True

    for index, character in enumerate(markdown):
        if at_line_start:
            if character in (" ", "\t"):
                continue
            if character == ">" and index + 1 < len(markdown) and markdown[index + 1] == " ":
                continue
            if character == "#":
                marker_end = index
                while marker_end < len(markdown) and markdown[marker_end] == "#":
                    marker_end += 1
                if marker_end < len(markdown) and markdown[marker_end] == " ":
                    continue
            if character in ("-", "*", "+") and index + 1 < len(markdown) and markdown[index + 1] == " ":
                continue
            if character.isdigit():
                marker_end = index
                while marker_end < len(markdown) and markdown[marker_end].isdigit():
                    marker_end += 1
                if (
                    marker_end + 1 < len(markdown)
                    and markdown[marker_end] == "."
                    and markdown[marker_end + 1] == " "
                ):
                    continue
            at_line_start = False

        if character.isspace():
            if normalized_chars and pending_space_index is None:
                pending_space_index = index
            if character == "\n":
                at_line_start = True
            continue

        if pending_space_index is not None:
            normalized_chars.append(" ")
            raw_index_by_normalized_index.append(pending_space_index)
            pending_space_index = None

        normalized_chars.append(character)
        raw_index_by_normalized_index.append(index)

    return "".join(normalized_chars), raw_index_by_normalized_index


def _resolve_comment_selection(
    markdown: str,
    selected_text: str,
    context_before: str = "",
    context_after: str = "",
    window_size: int = 56,
) -> tuple[str, str, str] | None:
    if not selected_text.strip():
        return "", context_before, context_after

    exact_index = markdown.find(selected_text)
    if exact_index != -1:
        start = max(0, exact_index - window_size)
        end = min(len(markdown), exact_index + len(selected_text) + window_size)
        return (
            selected_text,
            markdown[start:exact_index],
            markdown[exact_index + len(selected_text):end],
        )

    normalized_selected_text = _normalize_for_match(selected_text)
    if not normalized_selected_text:
        return None

    normalized_markdown, raw_index_by_normalized_index = _build_normalized_index(markdown)
    candidate_indices: list[int] = []
    search_from = 0

    while search_from < len(normalized_markdown):
        match_index = normalized_markdown.find(normalized_selected_text, search_from)
        if match_index == -1:
            break
        candidate_indices.append(match_index)
        search_from = match_index + 1

    if not candidate_indices:
        return None

    normalized_context_before = _normalize_for_match(context_before)
    normalized_context_after = _normalize_for_match(context_after)
    matching_candidates: list[int] = []

    for normalized_start in candidate_indices:
        normalized_end = normalized_start + len(normalized_selected_text) - 1
        raw_start = raw_index_by_normalized_index[normalized_start]
        raw_end = raw_index_by_normalized_index[normalized_end] + 1
        before_slice = markdown[max(0, raw_start - max(window_size, len(context_before) + 8)):raw_start]
        after_slice = markdown[raw_end:min(len(markdown), raw_end + max(window_size, len(context_after) + 8))]

        before_ok = not normalized_context_before or _normalize_for_match(before_slice).endswith(
            normalized_context_before
        )
        after_ok = not normalized_context_after or _normalize_for_match(after_slice).startswith(
            normalized_context_after
        )

        if before_ok and after_ok:
            matching_candidates.append(normalized_start)

    if len(matching_candidates) == 1:
        candidate_indices = matching_candidates
    elif len(candidate_indices) != 1:
        return None

    normalized_start = candidate_indices[0]
    normalized_end = normalized_start + len(normalized_selected_text) - 1
    raw_start = raw_index_by_normalized_index[normalized_start]
    raw_end = raw_index_by_normalized_index[normalized_end] + 1
    start = max(0, raw_start - window_size)
    end = min(len(markdown), raw_end + window_size)

    return (
        markdown[raw_start:raw_end],
        markdown[start:raw_start],
        markdown[raw_end:end],
    )


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


def _normalize_discovery_payload(
    payload: dict[str, Any], request: DiscoveryRequest
) -> dict[str, Any]:
    normalized = dict(payload)
    collected_context = normalized.get("collected_context")
    if not isinstance(collected_context, dict):
        collected_context = {}

    if request.template.fields:
        for field in request.template.fields:
            collected_context.setdefault(field.key, None)

    normalized["collected_context"] = collected_context
    return normalized


class OpenAIAgentService:
    def __init__(self, settings: Settings):
        self._settings = settings
        client_kwargs: dict[str, str] = {}
        if settings.openai_api_key:
            client_kwargs["api_key"] = settings.openai_api_key
        if settings.openai_base_url:
            client_kwargs["base_url"] = settings.openai_base_url
        else:
            client_kwargs["base_url"] = "https://api.openai.com/v1"
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
        payload = _normalize_discovery_payload(
            self._invoke_json(
                build_discovery_messages(request),
                max_output_tokens=self._settings.openai_max_output_tokens_discovery,
            ),
            request,
        )
        response = DiscoveryResponse.model_validate(payload)
        response.markdown = _sanitize_markdown(response.markdown)

        if request.template.fields and response.document_ready:
            required_keys = {field.key for field in request.template.fields}
            all_filled = all(
                response.collected_context.get(key) not in (None, "")
                for key in required_keys
            )
            if not all_filled:
                response.document_ready = False
                response.status = "needs_user_input"
                response.markdown = None

        return response

    def run_revision(
        self, request: RevisionRequest
    ) -> RevisionUpdatedResponse | RevisionErrorResponse:
        normalized_comments = []

        for comment in request.comments:
            resolved_selection = _resolve_comment_selection(
                request.current_markdown,
                comment.selected_text,
                comment.context_before,
                comment.context_after,
            )

            if resolved_selection is None:
                return RevisionErrorResponse(
                    status="error",
                    assistant_message=(
                        "I could not apply the requested changes because one selected text snippet was not found in the document."
                    ),
                    error_code="SELECTED_TEXT_NOT_FOUND",
                )

            selected_text, context_before, context_after = resolved_selection
            normalized_comments.append(
                comment.model_copy(
                    update={
                        "selected_text": selected_text,
                        "context_before": context_before,
                        "context_after": context_after,
                    }
                )
            )

        request = request.model_copy(update={"comments": normalized_comments})

        payload = self._invoke_json(
            build_revision_messages(request),
            max_output_tokens=self._settings.openai_max_output_tokens_revision,
        )
        response = RevisionUpdatedResponse.model_validate(payload)
        response.updated_markdown = _sanitize_markdown(response.updated_markdown) or ""
        return response
