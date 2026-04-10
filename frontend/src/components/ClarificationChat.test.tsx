import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyRequirementsContext } from '../data/template';
import { ClarificationChat } from './ClarificationChat';

type RecorderState = 'inactive' | 'recording' | 'paused';

class FakeMediaRecorder {
  mimeType = 'audio/webm';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  state: RecorderState = 'inactive';

  constructor(public stream: MediaStream) {}

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({
      data: new Blob(['voice sample'], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.(new Event('stop'));
  }
}

function Harness({
  transcribeAudio,
}: {
  transcribeAudio: (audioFile: File) => Promise<{ text: string }>;
}) {
  const [value, setValue] = useState('Hello world');

  return (
    <ClarificationChat
      messages={[]}
      value={value}
      busy={false}
      collectedContext={createEmptyRequirementsContext()}
      onChange={setValue}
      onSubmit={() => undefined}
      onGenerateDraft={() => undefined}
      transcribeAudio={transcribeAudio}
    />
  );
}

function FocusHarness() {
  const [value, setValue] = useState('Need a calculator');
  const [busy, setBusy] = useState(false);

  return (
    <ClarificationChat
      messages={[]}
      value={value}
      busy={busy}
      collectedContext={createEmptyRequirementsContext()}
      onChange={setValue}
      onSubmit={() => {
        setValue('');
        setBusy(true);
        window.setTimeout(() => {
          setBusy(false);
        }, 0);
      }}
      onGenerateDraft={() => undefined}
      transcribeAudio={vi.fn()}
    />
  );
}

describe('ClarificationChat', () => {
  const originalMediaRecorder = globalThis.MediaRecorder;
  const originalMediaDevices = navigator.mediaDevices;
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      writable: true,
      value: FakeMediaRecorder,
    });
  });

  afterEach(() => {
    cleanup();

    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      writable: true,
      value: originalMediaRecorder,
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });

    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: originalScrollIntoView,
    });
  });

  it('scrolls the latest response into view when new chat messages arrive', async () => {
    const scrollIntoView = vi.fn();

    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    const { rerender } = render(
      <ClarificationChat
        messages={[
          {
            id: 'assistant-1',
            role: 'assistant',
            content: 'Describe the business requirement.',
            timestamp: '2026-04-10T10:00:00Z',
          },
          {
            id: 'user-1',
            role: 'user',
            content: 'Need a loan-duration calculator.',
            timestamp: '2026-04-10T10:01:00Z',
          },
        ]}
        value=""
        busy={false}
        collectedContext={createEmptyRequirementsContext()}
        onChange={() => undefined}
        onSubmit={() => undefined}
        onGenerateDraft={() => undefined}
        transcribeAudio={vi.fn()}
      />
    );

    const initialCalls = scrollIntoView.mock.calls.length;

    rerender(
      <ClarificationChat
        messages={[
          {
            id: 'assistant-1',
            role: 'assistant',
            content: 'Describe the business requirement.',
            timestamp: '2026-04-10T10:00:00Z',
          },
          {
            id: 'user-1',
            role: 'user',
            content: 'Need a loan-duration calculator.',
            timestamp: '2026-04-10T10:01:00Z',
          },
          {
            id: 'assistant-2',
            role: 'assistant',
            content: 'Who will use this feature?',
            timestamp: '2026-04-10T10:02:00Z',
          },
        ]}
        value=""
        busy={false}
        collectedContext={createEmptyRequirementsContext()}
        onChange={() => undefined}
        onSubmit={() => undefined}
        onGenerateDraft={() => undefined}
        transcribeAudio={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(scrollIntoView.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it('records, transcribes, and inserts text at the saved caret position', async () => {
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream);
    const transcribeAudio = vi.fn().mockResolvedValue({ text: ' brave new' });
    const user = userEvent.setup();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    render(<Harness transcribeAudio={transcribeAudio} />);

    const textarea = screen.getByLabelText(
      'Clarification message'
    ) as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(5, 5);
    fireEvent.select(textarea);

    await user.click(screen.getByLabelText('Record voice note'));
    expect(screen.getByLabelText('Recording in progress')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Transcribe recording'));

    await waitFor(() => {
      expect(transcribeAudio).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText('Clarification message')
      ).toHaveValue('Hello brave new world');
    });

    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the textarea after sending with Enter', async () => {
    const user = userEvent.setup();

    render(<FocusHarness />);

    const textarea = screen.getByLabelText(
      'Clarification message'
    ) as HTMLTextAreaElement;

    textarea.focus();
    expect(textarea).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByLabelText('Clarification message')).toHaveFocus();
    });
  });
});
