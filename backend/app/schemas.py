from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TemplateField(StrictModel):
    key: str
    label: str
    description: str


class TemplateInput(StrictModel):
    id: str
    content: str
    fields: list[TemplateField] = Field(default_factory=list)


class ChatHistoryItem(StrictModel):
    role: Literal["user", "assistant"]
    content: str


class DiscoveryRequest(StrictModel):
    session_id: str
    mode: Literal["continue_or_generate"]
    template: TemplateInput
    chat_history: list[ChatHistoryItem]
    latest_user_message: str
    document_language: Literal["en", "de"] = "en"
    output_format: Literal["json"] = "json"


class DiscoveryResponse(StrictModel):
    status: Literal["needs_user_input", "ready"]
    assistant_message: str
    document_ready: bool
    markdown: str | None = None
    collected_context: dict[str, str | None] = Field(default_factory=dict)


class RevisionComment(StrictModel):
    comment_id: str
    selected_text: str
    comment_text: str
    context_before: str = ""
    context_after: str = ""


class RevisionRequest(StrictModel):
    session_id: str
    base_revision_id: str
    current_markdown: str
    comments: list[RevisionComment]
    document_language: Literal["en", "de"] = "en"
    output_format: Literal["json"] = "json"


class RevisionUpdatedResponse(StrictModel):
    status: Literal["updated"]
    assistant_message: str
    updated_markdown: str
    change_summary: list[str] = Field(default_factory=list)


class RevisionErrorResponse(StrictModel):
    status: Literal["error"]
    assistant_message: str
    error_code: str | None = None


class PersistedChatMessage(StrictModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: str


class PersistedRevision(StrictModel):
    id: str
    markdown: str
    createdAt: str
    source: Literal["generated", "revised"]


class PersistedPendingComment(StrictModel):
    id: str
    selectedText: str
    commentText: str
    contextBefore: str
    contextAfter: str
    startOffset: int | None = None
    endOffset: int | None = None
    createdAt: str


class PersistedSessionState(StrictModel):
    schemaVersion: Literal[1]
    sessionId: str
    phase: Literal["clarification", "review"]
    status: Literal["idle", "loading", "ready", "error"]
    templateId: str
    language: Literal["en"]
    createdAt: str
    updatedAt: str
    chatHistory: list[PersistedChatMessage]
    revisions: list[PersistedRevision]
    pendingComments: list[PersistedPendingComment]
    collectedContext: dict[str, str | None]
    changeSummary: list[str] = Field(default_factory=list)
    lastError: str | None = None


class ExportSessionRequest(StrictModel):
    session: PersistedSessionState


class ExportSessionResponse(StrictModel):
    status: Literal["saved"]
    session_id: str
    file_path: str
    saved_at: str


class TranscriptionResponse(StrictModel):
    text: str
    usage: dict[str, Any] | None = None


class HealthResponse(StrictModel):
    status: Literal["ok"]
    service: str
    version: str
    build_id: str
