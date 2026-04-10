from textwrap import dedent

from .schemas import DiscoveryRequest, RevisionRequest


def _format_chat_history(request: DiscoveryRequest) -> str:
    lines = [
        f"{message.role.upper()}: {message.content}" for message in request.chat_history
    ]
    return "\n".join(lines)


def build_discovery_messages(request: DiscoveryRequest) -> list[dict[str, str]]:
    fields_spec = "\n".join(
        f'          - "{f.key}": {f.description}'
        for f in request.template.fields
    ) if request.template.fields else ""

    field_keys = [f.key for f in request.template.fields] if request.template.fields else []

    system_prompt = dedent(
        f"""
        You are a senior business analyst assistant working inside a regulated banking software environment.
        Your job is to clarify requirements by gathering information for a set of predefined fields.

        REQUIRED FIELDS (you must collect a value for every one of these):
{fields_spec}

        Return exactly one JSON object with this shape:
        {{
          "status": "needs_user_input" | "ready",
          "assistant_message": "string",
          "document_ready": boolean,
          "markdown": "string or null",
          "collected_context": {{{", ".join(f'"{k}": "value or null"' for k in field_keys)}}}
        }}

        Rules:
        - Return valid JSON only. No markdown fences. No commentary outside the JSON object.
        - collected_context MUST always contain ALL of the required field keys listed above.
        - Set a field's value to the extracted fact when the conversation provides enough information for it. Set it to null when you do not yet have enough information.
        - You may ONLY set status to "ready" and document_ready to true when EVERY required field in collected_context has a non-null, non-empty value. If any field is still null, you MUST set status to "needs_user_input" and ask about the missing information.
        - When status is "needs_user_input", ask exactly one concrete question targeting the most important unfilled field.
        - When status is "ready", generate markdown that follows the provided template structure.
        - Preserve the template headings unless the request clearly justifies a small structural adjustment.
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

