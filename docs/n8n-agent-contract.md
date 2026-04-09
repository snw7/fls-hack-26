# Agent Contract

This document defines the minimal agent-service contract for the MVP.

## Overview

For the current setup, the Python backend only needs to provide **2 webhook-driven agent flows**:

1. `discovery-agent`
   Handles the chat-based clarification phase and can eventually return an initial Markdown draft.
2. `revision-agent`
   Takes the current Markdown plus text-selection comments and returns an updated Markdown document.

The frontend remains responsible for:

- storing chat history locally
- storing the current Markdown and local revisions
- storing unsent comment drafts
- rendering Markdown
- computing diffs between old and new Markdown

The backend is responsible for:

- calling the LLM with the right prompt
- applying the Markdown template when needed
- returning deterministic JSON payloads

## Agent 1: `discovery-agent`

### What it must do

- read the current discovery chat context
- ask the next best clarification question if information is missing
- decide when the conversation is sufficiently specified
- generate the initial Markdown draft once enough information is available

### Input

```json
{
  "session_id": "demo-session-1",
  "mode": "continue_or_generate",
  "template": {
    "id": "business-requirements-v1",
    "content": "# Title\n\n## Goal\n\n## Business Context\n\n## Functional Requirements\n\n## Open Questions\n"
  },
  "chat_history": [
    {
      "role": "user",
      "content": "We need a way for business analysts to collect requirements with an agent."
    },
    {
      "role": "assistant",
      "content": "Who is the primary user of this workflow?"
    },
    {
      "role": "user",
      "content": "A single business analyst for the MVP."
    }
  ],
  "latest_user_message": "The analyst should be able to review the generated markdown and comment on it.",
  "document_language": "en",
  "output_format": "json"
}
```

### Required output

```json
{
  "status": "needs_user_input",
  "assistant_message": "How should comments be attached to the document: by line, by section, or by selected text?",
  "document_ready": false,
  "markdown": null,
  "collected_context": {
    "primary_user": "single business analyst",
    "review_mode": "user reviews generated markdown"
  }
}
```

or

```json
{
  "status": "ready",
  "assistant_message": "I have enough information to generate the first draft.",
  "document_ready": true,
  "markdown": "# Requirements Draft\n\n## Goal\n\nBuild an agent-assisted requirements workflow.\n\n## Users\n\n- Single business analyst in the MVP\n",
  "collected_context": {
    "primary_user": "single business analyst",
    "comment_style": "selected text"
  }
}
```

### Output rules

- Always return valid JSON.
- `status` must be either `needs_user_input` or `ready`.
- `assistant_message` is always required.
- `markdown` must be `null` unless `status` is `ready`.
- `collected_context` should only contain compact structured facts the frontend may keep locally.

## Agent 2: `revision-agent`

### What it must do

- take the current Markdown document as the source of truth
- read a batch of user comments attached to selected text
- update the Markdown accordingly
- preserve unrelated content
- return the full updated Markdown, not just a patch

### Input

```json
{
  "session_id": "demo-session-1",
  "base_revision_id": "rev-1",
  "current_markdown": "# Requirements Draft\n\n## Goal\n\nBuild an agent-assisted requirements workflow.\n\n## Users\n\n- Single business analyst in the MVP\n",
  "comments": [
    {
      "comment_id": "c-1",
      "selected_text": "Single business analyst in the MVP",
      "comment_text": "Clarify that later collaboration may be added, but is out of scope for now."
    },
    {
      "comment_id": "c-2",
      "selected_text": "Build an agent-assisted requirements workflow.",
      "comment_text": "Mention that the output is a markdown-based business requirements document."
    }
  ],
  "document_language": "en",
  "output_format": "json"
}
```

### Required output

```json
{
  "status": "updated",
  "assistant_message": "I updated the draft based on the submitted comments.",
  "updated_markdown": "# Requirements Draft\n\n## Goal\n\nBuild an agent-assisted requirements workflow that produces a markdown-based business requirements document.\n\n## Users\n\n- Single business analyst in the MVP\n- Future collaboration may be added later but is out of scope for now\n",
  "change_summary": [
    "Expanded the goal to mention markdown output",
    "Clarified the MVP user scope and future collaboration"
  ]
}
```

### Output rules

- Always return valid JSON.
- `status` must be `updated` or `error`.
- On success, return the full `updated_markdown`.
- `change_summary` should be a short list of human-readable edits.
- The agent must not omit unchanged sections from the output.

### Error shape

```json
{
  "status": "error",
  "assistant_message": "I could not apply the requested changes because one selected text snippet was not found in the document.",
  "error_code": "SELECTED_TEXT_NOT_FOUND"
}
```

## Constraints the backend agents should follow

- Keep outputs deterministic and schema-stable.
- Never return Markdown wrapped inside code fences.
- Never return partial diffs as the primary artifact; always return the full Markdown.
- When a selected text snippet cannot be found, fail explicitly instead of guessing.
- Preserve headings and document structure unless a comment clearly requests restructuring.
- Keep the tone and language consistent with `document_language`.

## Minimal webhook design

You can implement this as either:

- two separate webhooks
  - `POST /webhook/discovery-agent`
  - `POST /webhook/revision-agent`

or

- one webhook with an `agent` field
  - `agent: "discovery-agent"` or `agent: "revision-agent"`

For the MVP, **two separate webhooks** are simpler to reason about and align with the frontend contract.

## Frontend expectations

The frontend should assume:

- discovery responses are full JSON responses
- draft creation happens when `document_ready` becomes `true`
- revision updates return a complete new Markdown document
- local revision history is just an array of prior Markdown snapshots
- diffs are computed locally from `current_markdown` and `updated_markdown`
