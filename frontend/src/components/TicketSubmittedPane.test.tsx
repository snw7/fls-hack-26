import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TicketSubmittedPane } from './TicketSubmittedPane';

describe('TicketSubmittedPane', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens a printable PDF report window with the logo and rendered markdown', async () => {
    const user = userEvent.setup();
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const openMock = vi.fn(() => ({
      document: {
        write,
        close,
      },
      focus,
      print,
    }));

    Object.defineProperty(window, 'open', {
      configurable: true,
      value: openMock,
    });

    render(
      <TicketSubmittedPane
        confirmationMessage="Ticket sent."
        markdown={`# Requirement Brief\n\n## Goal\n\nProvide a calculator for customers.`}
        sessionId="session-123"
        onStartAnother={() => undefined}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Export PDF' }));

    expect(openMock).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0]).toContain('/logo.svg');
    expect(write.mock.calls[0][0]).toContain('<h1>Requirement Brief</h1>');
    expect(write.mock.calls[0][0]).toContain(
      '<p>Provide a calculator for customers.</p>'
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('Print dialog opened. Save it as a PDF report.')
    ).toBeInTheDocument();
  });
});
