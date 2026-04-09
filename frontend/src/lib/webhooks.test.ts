import { describe, expect, it } from 'vitest';
import { parseDiscoveryResponse, parseRevisionResponse } from './webhooks';

describe('webhook parsers', () => {
  it('parses a valid discovery response', () => {
    const result = parseDiscoveryResponse({
      status: 'needs_user_input',
      assistant_message: 'Which team owns the process?',
      document_ready: false,
      markdown: null,
      collected_context: {
        primary_user: 'business analyst',
      },
    });

    expect(result.status).toBe('needs_user_input');
    expect(result.collected_context.primary_user).toBe('business analyst');
  });

  it('rejects malformed discovery responses', () => {
    expect(() =>
      parseDiscoveryResponse({
        status: 'ready',
        assistant_message: 'ok',
      })
    ).toThrow();
  });

  it('parses valid revision responses', () => {
    const result = parseRevisionResponse({
      status: 'updated',
      assistant_message: 'Applied changes.',
      updated_markdown: '# Draft',
      change_summary: ['Expanded goal'],
    });

    expect(result.status).toBe('updated');
  });
});
