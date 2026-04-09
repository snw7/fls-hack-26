from textwrap import dedent

from .schemas import DiscoveryRequest, RevisionRequest


def _format_chat_history(request: DiscoveryRequest) -> str:
    lines = [
        f"{message.role.upper()}: {message.content}" for message in request.chat_history
    ]
    return "\n".join(lines)


def build_discovery_messages(request: DiscoveryRequest) -> list[dict[str, str]]:
    system_prompt = dedent(
        f"""
        You are a senior business analyst assistant working inside a regulated banking software environment.
        Your job is to clarify requirements and decide whether enough information exists to create a first markdown draft.

        Return exactly one JSON object with this shape:
        {{
          "status": "needs_user_input" | "ready",
          "assistant_message": "string",
          "document_ready": boolean,
          "markdown": "string or null",
          "collected_context": {{"snake_case_key": "short fact"}}
        }}

        Rules:
        - Return valid JSON only. No markdown fences. No commentary outside the JSON object.
        - If the conversation is not sufficiently specified, set status to "needs_user_input", document_ready to false, markdown to null, and ask exactly one concrete next question.
        - If the conversation is sufficient, set status to "ready", document_ready to true, and generate markdown that follows the provided template structure.
        - Preserve the template headings unless the request clearly justifies a small structural adjustment.
        - Keep collected_context compact, factual, and limited to the most relevant extracted facts.
        - Write assistant_message and markdown in {request.document_language.upper()}.
        """
    ).strip()

    user_prompt = dedent(
        f"""
        Session ID: {request.session_id}
        Mode: {request.mode}
        Document language: {request.document_language}

        Template ID: {request.template.id}
        Template:
        {request.template.content}

        Conversation so far:
        {_format_chat_history(request)}

        Latest user message:
        {request.latest_user_message}

        Decide whether you need one more question or can generate the first draft now.
        """
    ).strip()

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def build_revision_messages(request: RevisionRequest) -> list[dict[str, str]]:
    comment_lines: list[str] = []

    for index, comment in enumerate(request.comments, start=1):
        comment_lines.append(
            dedent(
                f"""
                Comment {index}
                - comment_id: {comment.comment_id}
                - selected_text: {comment.selected_text}
                - context_before: {comment.context_before}
                - context_after: {comment.context_after}
                - instruction: {comment.comment_text}
                """
            ).strip()
        )

    system_prompt = dedent(
        f"""
        You are a precise markdown editor for business requirements documents.
        Update the provided markdown according to the submitted comments.

        Return exactly one JSON object with this shape:
        {{
          "status": "updated",
          "assistant_message": "string",
          "updated_markdown": "string",
          "change_summary": ["short change note"]
        }}

        Rules:
        - Return valid JSON only. No markdown fences. No commentary outside the JSON object.
        - Treat the provided markdown as the full source of truth.
        - Apply every valid comment.
        - Preserve unrelated sections, headings, and existing structure unless a comment explicitly asks for restructuring.
        - Do not drop content accidentally.
        - updated_markdown must be the full revised markdown document, not a diff.
        - change_summary should be a short human-readable list of the main edits.
        - Write assistant_message and updated_markdown in {request.document_language.upper()}.
        """
    ).strip()

    user_prompt = dedent(
        f"""
        Session ID: {request.session_id}
        Base revision ID: {request.base_revision_id}
        Document language: {request.document_language}

        Current markdown:
        {request.current_markdown}

        Comments:
        {"\n\n".join(comment_lines)}

        Apply the revision request now.
        """
    ).strip()

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

