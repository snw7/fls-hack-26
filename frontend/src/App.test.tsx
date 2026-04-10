import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './lib/storage';

describe('App integration', () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
    });
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('submits the clarification message when Enter is pressed', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'needs_user_input',
          assistant_message: 'Who will use this feature?',
          document_ready: false,
          markdown: null,
          collected_context: {
            goal: 'Add a loan-duration calculator.',
            business_context: null,
            users: null,
            functional_requirements: null,
            non_functional_requirements: null,
            risks_and_dependencies: null,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<App />);

    const textarea = screen.getByLabelText('Clarification message');
    await user.type(textarea, 'Need a new loan-duration calculator.');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      latest_user_message: 'Need a new loan-duration calculator.',
    });
    expect(
      await screen.findByText('Who will use this feature?')
    ).toBeInTheDocument();
  });

  it('shows backend validation errors in the new clarification UI', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: [
            {
              loc: ['body', 'template', 'fields'],
              msg: 'Extra inputs are not permitted',
            },
          ],
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await userEvent.type(
      screen.getByLabelText('Clarification message'),
      'Need a new loan-duration calculator.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(
      await screen.findByText(
        'body → template → fields: Extra inputs are not permitted'
      )
    ).toBeInTheDocument();
  });

  it('sends the ticket from review mode and shows the thank-you screen', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        sessionId: 'session-123',
        phase: 'review',
        status: 'ready',
        templateId: 'business-requirements-v1',
        language: 'en',
        createdAt: '2026-04-10T10:00:00Z',
        updatedAt: '2026-04-10T10:05:00Z',
        chatHistory: [
          {
            id: 'assistant-1',
            role: 'assistant',
            content: 'Describe the business requirement.',
            timestamp: '2026-04-10T10:00:00Z',
          },
        ],
        revisions: [
          {
            id: 'rev-1',
            markdown: '# Requirement Brief',
            createdAt: '2026-04-10T10:05:00Z',
            source: 'generated',
          },
        ],
        pendingComments: [],
        collectedContext: {
          goal: 'Reduce manual requirement intake.',
          business_context: null,
          users: 'Business analysts',
          functional_requirements: null,
          non_functional_requirements: null,
          risks_and_dependencies: null,
        },
        changeSummary: ['Created the first draft.'],
        lastError: null,
      })
    );

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'saved',
          session_id: 'session-123',
          file_path: '/app/data/requirements/session-123.json',
          saved_at: '2026-04-10T10:06:00Z',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Send ticket' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/sessions/session-123/export-json');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      session: {
        sessionId: 'session-123',
      },
    });

    expect(
      await screen.findByRole('heading', { name: 'Thank you' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ticket sent. Requirements saved to /app/data/requirements/session-123.json'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start another brief' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send PDF Report to PAT' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Export PDF' })
    ).toBeInTheDocument();
  });

  it('shows field progress chips in clarification mode', () => {
    render(<App />);

    expect(screen.getByText('0/6 fields')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
