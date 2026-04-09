# n8n Agent Test Cases

These test cases validate the n8n webhook contracts without depending on any frontend behavior.

## Discovery Agent

### Test 1: asks a follow-up question when context is incomplete

Input:

```json
{
  "session_id": "t1",
  "mode": "continue_or_generate",
  "template": {
    "id": "business-requirements-v1",
    "content": "# Title\n\n## Goal\n\n## Users\n\n## Requirements\n"
  },
  "chat_history": [
    {
      "role": "user",
      "content": "I want an AI system that helps create requirement documents."
    }
  ],
  "latest_user_message": "It should help analysts talk to an agent.",
  "document_language": "en",
  "output_format": "json"
}
```

Expected:

- `status = "needs_user_input"`
- `assistant_message` contains a concrete follow-up question
- `document_ready = false`
- `markdown = null`

### Test 2: returns an initial draft when enough context exists

Input:

```json
{
  "session_id": "t2",
  "mode": "continue_or_generate",
  "template": {
    "id": "business-requirements-v1",
    "content": "# Title\n\n## Goal\n\n## Users\n\n## Requirements\n"
  },
  "chat_history": [
    {
      "role": "user",
      "content": "The MVP is for a single business analyst."
    },
    {
      "role": "user",
      "content": "The system should generate markdown and allow later review by comments."
    },
    {
      "role": "user",
      "content": "Comments should be attached to selected text."
    }
  ],
  "latest_user_message": "That is enough for a first draft.",
  "document_language": "en",
  "output_format": "json"
}
```

Expected:

- `status = "ready"`
- `document_ready = true`
- `markdown` is non-empty
- returned Markdown follows the template structure

### Test 3: preserves requested language

Input:

Use the same structure as Test 2, but set:

```json
{
  "document_language": "de"
}
```

Expected:

- `assistant_message` is German
- `markdown` is German

## Revision Agent

### Test 4: applies a single comment correctly

Input:

```json
{
  "session_id": "t4",
  "base_revision_id": "rev-1",
  "current_markdown": "# Draft\n\n## Goal\n\nCreate a requirement workflow.\n",
  "comments": [
    {
      "comment_id": "c-1",
      "selected_text": "Create a requirement workflow.",
      "comment_text": "Clarify that the output is a markdown document."
    }
  ],
  "document_language": "en",
  "output_format": "json"
}
```

Expected:

- `status = "updated"`
- `updated_markdown` still contains all original headings
- the goal sentence is expanded, not dropped
- `change_summary` contains one relevant change note

### Test 5: applies multiple comments in one run

Input:

```json
{
  "session_id": "t5",
  "base_revision_id": "rev-1",
  "current_markdown": "# Draft\n\n## Goal\n\nCreate a requirement workflow.\n\n## Users\n\n- Business analyst\n",
  "comments": [
    {
      "comment_id": "c-1",
      "selected_text": "Create a requirement workflow.",
      "comment_text": "Mention that the workflow is agent-assisted."
    },
    {
      "comment_id": "c-2",
      "selected_text": "Business analyst",
      "comment_text": "Clarify that this is a single-user MVP."
    }
  ],
  "document_language": "en",
  "output_format": "json"
}
```

Expected:

- `status = "updated"`
- both requested changes are reflected
- unrelated sections remain intact

### Test 6: fails clearly when selected text is missing

Input:

```json
{
  "session_id": "t6",
  "base_revision_id": "rev-1",
  "current_markdown": "# Draft\n\n## Goal\n\nCreate a requirement workflow.\n",
  "comments": [
    {
      "comment_id": "c-1",
      "selected_text": "This text does not exist",
      "comment_text": "Update this."
    }
  ],
  "document_language": "en",
  "output_format": "json"
}
```

Expected:

- `status = "error"`
- `error_code = "SELECTED_TEXT_NOT_FOUND"`
- no partial updated document is returned

### Test 7: does not wrap output in code fences

Input:

Use any successful revision input.

Expected:

- `updated_markdown` starts directly with Markdown content
- output does not contain ```` ```markdown ```` or any other fence markers

### Test 8: preserves unrelated content

Input:

```json
{
  "session_id": "t8",
  "base_revision_id": "rev-2",
  "current_markdown": "# Draft\n\n## Goal\n\nCreate a requirement workflow.\n\n## Non-Functional Requirements\n\n- Fast response time\n\n## Users\n\n- Business analyst\n",
  "comments": [
    {
      "comment_id": "c-1",
      "selected_text": "Business analyst",
      "comment_text": "Clarify that this is the main user."
    }
  ],
  "document_language": "en",
  "output_format": "json"
}
```

Expected:

- `status = "updated"`
- `## Non-Functional Requirements` section remains present
- only the intended user-related text changes

## Basic acceptance checklist

- every response is valid JSON
- field names remain stable across calls
- error responses are explicit and machine-readable
- successful revision responses always include the full new Markdown
- successful discovery responses only include Markdown when `status = "ready"`
