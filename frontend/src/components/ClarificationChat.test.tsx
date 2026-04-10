import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('ClarificationChat', () => {
  const originalMediaRecorder = globalThis.MediaRecorder;
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      writable: true,
      value: FakeMediaRecorder,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      writable: true,
      value: originalMediaRecorder,
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
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
});
