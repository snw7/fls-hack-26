from app.schemas import DiscoveryRequest, TemplateField, TemplateInput
from app.service import _normalize_discovery_payload, _resolve_comment_selection


def test_resolve_comment_selection_returns_exact_match():
    result = _resolve_comment_selection(
        "# Requirement Brief\n\n## Goal\nReduce manual requirement intake.\n",
        "Reduce manual requirement intake.",
    )

    assert result is not None
    selected_text, context_before, _ = result
    assert selected_text == "Reduce manual requirement intake."
    assert "## Goal" in context_before


def test_resolve_comment_selection_normalizes_whitespace():
    result = _resolve_comment_selection(
        "# Requirement Brief\n\n## Goal\n\nReduce manual requirement intake.\n",
        "Goal Reduce manual requirement intake.",
    )

    assert result is not None
    selected_text, context_before, context_after = result
    assert selected_text == "Goal\n\nReduce manual requirement intake."
    assert "Requirement Brief" in context_before
    assert context_after == "\n"


def test_resolve_comment_selection_ignores_markdown_list_markers():
    result = _resolve_comment_selection(
        "## Users\n- End customers\n- Internal staff\n",
        "End customers\nInternal staff",
    )

    assert result is not None
    selected_text, context_before, context_after = result
    assert selected_text == "End customers\n- Internal staff"
    assert "## Users\n- " in context_before
    assert context_after == "\n"


def test_normalize_discovery_payload_fills_missing_required_keys():
    request = DiscoveryRequest(
        session_id="t1",
        mode="continue_or_generate",
        template=TemplateInput(
            id="business-requirements-v1",
            content="# Requirement Brief",
            fields=[
                TemplateField(
                    key="goal",
                    label="Goal",
                    description="What is the desired outcome?",
                ),
                TemplateField(
                    key="users",
                    label="Users",
                    description="Who are the users?",
                ),
            ],
        ),
        chat_history=[],
        latest_user_message="Need a calculator.",
        document_language="en",
        output_format="json",
    )

    payload = _normalize_discovery_payload(
        {
            "status": "needs_user_input",
            "assistant_message": "Who are the users?",
            "document_ready": False,
            "markdown": None,
            "collected_context": {"goal": "Provide a calculator."},
        },
        request,
    )

    assert payload["collected_context"] == {
        "goal": "Provide a calculator.",
        "users": None,
    }
