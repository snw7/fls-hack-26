import { describe, expect, it } from 'vitest';
import {
  parseDiscoveryResponse,
  parseExportSessionResponse,
  parseRevisionResponse,
} from './webhooks';

describe('webhook parsers', () => {
  it('parses a valid discovery response', () => {
    const result = parseDiscoveryResponse({
      status: 'needs_user_input',
      assistant_message: 'Which team owns the process?',
      document_ready: false,
      markdown: null,
      collected_context: {
        goal: null,
        business_context: null,
        users: 'business analyst',
        functional_requirements: null,
        non_functional_requirements: null,
        risks_and_dependencies: null,
      },
    });

    expect(result.status).toBe('needs_user_input');
    expect(result.collected_context.users).toBe('business analyst');
    expect(result.collected_context.goal).toBeNull();
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

  it('parses valid export responses', () => {
    const result = parseExportSessionResponse({
      status: 'saved',
      session_id: 'session-123',
      file_path: '/app/data/requirements/session-123.json',
      saved_at: '2026-04-10T10:06:00Z',
    });

    expect(result.status).toBe('saved');
    expect(result.file_path).toContain('session-123.json');
  });
});
