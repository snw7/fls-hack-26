from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TemplateInput(StrictModel):
    id: str
    content: str


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
    collected_context: dict[str, str] = Field(default_factory=dict)


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


class HealthResponse(StrictModel):
    status: Literal["ok"]
    service: str

