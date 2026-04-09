import { z } from 'zod';

const discoveryResponseSchema = z.object({
  status: z.enum(['needs_user_input', 'ready']),
  assistant_message: z.string(),
  document_ready: z.boolean(),
  markdown: z.string().nullable(),
  collected_context: z.record(z.string(), z.string()).default({}),
});

const revisionUpdatedSchema = z.object({
  status: z.literal('updated'),
  assistant_message: z.string(),
  updated_markdown: z.string().min(1),
  change_summary: z.array(z.string()).default([]),
});

const revisionErrorSchema = z.object({
  status: z.literal('error'),
  assistant_message: z.string(),
  error_code: z.string().optional(),
});

const revisionResponseSchema = z.union([
  revisionUpdatedSchema,
  revisionErrorSchema,
]);

export interface DiscoveryRequest {
  session_id: string;
  mode: 'continue_or_generate';
  template: {
    id: string;
    content: string;
  };
  chat_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  latest_user_message: string;
  document_language: 'en';
  output_format: 'json';
}

export interface RevisionRequest {
  session_id: string;
  base_revision_id: string;
  current_markdown: string;
  comments: Array<{
    comment_id: string;
    selected_text: string;
    comment_text: string;
  }>;
  document_language: 'en';
  output_format: 'json';
}

export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;
export type RevisionResponse = z.infer<typeof revisionResponseSchema>;

async function postJson<T>(
  url: string,
  payload: object,
  parser: (value: unknown) => T,
  fetcher: typeof fetch = fetch
): Promise<T> {
  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsedPayload: unknown = null;

  if (rawText) {
    try {
      parsedPayload = JSON.parse(rawText) as unknown;
    } catch {
      throw new Error('Webhook returned a non-JSON response.');
    }
  }

  if (!response.ok) {
    if (
      parsedPayload &&
      typeof parsedPayload === 'object' &&
      'assistant_message' in parsedPayload &&
      typeof parsedPayload.assistant_message === 'string'
    ) {
      throw new Error(parsedPayload.assistant_message);
    }

    throw new Error(`Webhook request failed with ${response.status}.`);
  }

  return parser(parsedPayload);
}

export function parseDiscoveryResponse(value: unknown): DiscoveryResponse {
  return discoveryResponseSchema.parse(value);
}

export function parseRevisionResponse(value: unknown): RevisionResponse {
  return revisionResponseSchema.parse(value);
}

export function callDiscoveryAgent(
  url: string,
  payload: DiscoveryRequest,
  fetcher?: typeof fetch
): Promise<DiscoveryResponse> {
  return postJson(url, payload, parseDiscoveryResponse, fetcher);
}

export function callRevisionAgent(
  url: string,
  payload: RevisionRequest,
  fetcher?: typeof fetch
): Promise<RevisionResponse> {
  return postJson(url, payload, parseRevisionResponse, fetcher);
}

