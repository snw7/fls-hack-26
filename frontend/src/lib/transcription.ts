import { z } from 'zod';

const transcriptionResponseSchema = z.object({
  text: z.string(),
  usage: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionResponseSchema>;

export function parseTranscriptionResponse(
  value: unknown
): TranscriptionResponse {
  return transcriptionResponseSchema.parse(value);
}

export async function createTranscription(
  url: string,
  audioFile: File,
  fetcher: typeof fetch = fetch
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.set('file', audioFile);

  const response = await fetcher(url, {
    method: 'POST',
    body: formData,
  });

  const rawText = await response.text();
  let parsedPayload: unknown = null;

  if (rawText) {
    try {
      parsedPayload = JSON.parse(rawText) as unknown;
    } catch {
      throw new Error('Transcription returned a non-JSON response.');
    }
  }

  if (!response.ok) {
    if (
      parsedPayload &&
      typeof parsedPayload === 'object' &&
      'detail' in parsedPayload &&
      typeof parsedPayload.detail === 'string'
    ) {
      throw new Error(parsedPayload.detail);
    }

    throw new Error(`Transcription request failed with ${response.status}.`);
  }

  return parseTranscriptionResponse(parsedPayload);
}
