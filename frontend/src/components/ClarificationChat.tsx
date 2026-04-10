import { useEffect, useRef, useState } from 'react';
import {
  allFieldsFilled,
  requirementFields,
  type RequirementsContext,
} from '../data/template';
import type { TranscriptionResponse } from '../lib/transcription';
import type { ChatMessage } from '../types';

type RecordingState = 'idle' | 'recording' | 'transcribing';
const METER_BAR_COUNT = 88;

function createIdleMeterLevels(): number[] {
  return Array.from({ length: METER_BAR_COUNT }, (_, index) =>
    index % 9 === 0 ? 0.18 : 0.08
  );
}

interface SelectionRange {
  start: number;
  end: number;
}

interface ClarificationChatProps {
  messages: ChatMessage[];
  value: string;
  busy: boolean;
  collectedContext: RequirementsContext;
  statusMessage?: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onGenerateDraft: () => void;
  transcribeAudio: (audioFile: File) => Promise<TranscriptionResponse>;
}

function formatIntroMessage(message: string | null): string | null {
  if (!message || message.includes('\n')) {
    return message;
  }

  return message.replace('. ', '.\n');
}

export function ClarificationChat({
  messages,
  value,
  busy,
  collectedContext,
  statusMessage,
  onChange,
  onSubmit,
  onGenerateDraft,
  transcribeAudio,
}: ClarificationChatProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [meterLevels, setMeterLevels] = useState<number[]>(createIdleMeterLevels);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wavePhaseRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopActionRef = useRef<'abort' | 'transcribe' | null>(null);
  const selectionRef = useRef<SelectionRange>({
    start: value.length,
    end: value.length,
  });
  const pendingSelectionRef = useRef<SelectionRange | null>(null);
  const valueRef = useRef(value);
  const introMessage =
    messages[0]?.role === 'assistant' ? messages[0].content : null;
  const formattedIntroMessage = formatIntroMessage(introMessage);
  const conversationMessages = introMessage ? messages.slice(1) : messages;
  const hasComposerValue = value.trim().length > 0;
  const filledCount = requirementFields.filter((field) => {
    const currentValue = collectedContext[field.key];
    return currentValue !== null && currentValue.trim() !== '';
  }).length;
  const totalCount = requirementFields.length;
  const canGenerateDraft = allFieldsFilled(collectedContext);
  const isRecording = recordingState === 'recording';
  const isTranscribing = recordingState === 'transcribing';
  const showRecorderPanel = isRecording || isTranscribing;

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!pendingSelectionRef.current || !textareaRef.current || showRecorderPanel) {
      return;
    }

    const nextSelection = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(
      nextSelection.start,
      nextSelection.end
    );
    selectionRef.current = nextSelection;
  }, [showRecorderPanel, value]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      void audioContextRef.current?.close();
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop());
      audioContextRef.current = null;
      animationFrameRef.current = null;
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      audioChunksRef.current = [];
      stopActionRef.current = null;
    };
  }, []);

  function rememberSelection() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    selectionRef.current = {
      start: textarea.selectionStart ?? valueRef.current.length,
      end: textarea.selectionEnd ?? valueRef.current.length,
    };
  }

  function stopActiveStream() {
    const stream = mediaStreamRef.current;

    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function stopMeterMonitoring() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setMeterLevels(createIdleMeterLevels());
  }

  function startMeterMonitoring(stream: MediaStream) {
    if (typeof AudioContext === 'undefined') {
      return;
    }

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const sample = new Uint8Array(256);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      wavePhaseRef.current = 0;

      const updateMeter = () => {
        analyser.getByteTimeDomainData(sample);

        let energy = 0;

        for (const sampleValue of sample) {
          const centered = (sampleValue - 128) / 128;
          energy += centered * centered;
        }

        const rms = Math.sqrt(energy / sample.length);
        const loudness = Math.min(1, rms * 7.5);

        const nextLevels = Array.from({ length: METER_BAR_COUNT }, (_, index) => {
          const midpoint = (METER_BAR_COUNT - 1) / 2;
          const distanceFromCenter = Math.abs(index - midpoint) / midpoint;
          const envelope = 1 - distanceFromCenter ** 1.35;
          const ripple = 0.88 + 0.12 * Math.sin(wavePhaseRef.current + index * 0.42);
          const floor = 0.08 + envelope * 0.03;

          return Math.max(
            floor,
            Math.min(1, floor + loudness * (0.24 + envelope * 0.9) * ripple)
          );
        });

        wavePhaseRef.current += 0.16 + loudness * 0.32;
        setMeterLevels(nextLevels);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animationFrameRef.current = requestAnimationFrame(updateMeter);
    } catch {
      setMeterLevels(createIdleMeterLevels());
    }
  }

  function insertTranscription(text: string) {
    const currentValue = valueRef.current;
    const { start, end } = selectionRef.current;
    const nextValue =
      currentValue.slice(0, start) + text + currentValue.slice(end);
    const nextCaretPosition = start + text.length;

    pendingSelectionRef.current = {
      start: nextCaretPosition,
      end: nextCaretPosition,
    };
    onChange(nextValue);
  }

  async function startRecording() {
    if (busy || showRecorderPanel) {
      return;
    }

    setTranscriptionError(null);
    rememberSelection();

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setTranscriptionError('Audio capture is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      stopActionRef.current = null;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const action = stopActionRef.current;
        const chunks = [...audioChunksRef.current];

        audioChunksRef.current = [];
        stopActionRef.current = null;
        mediaRecorderRef.current = null;
        stopMeterMonitoring();
        stopActiveStream();

        if (action !== 'transcribe') {
          setRecordingState('idle');
          return;
        }

        if (chunks.length === 0) {
          setRecordingState('idle');
          setTranscriptionError('No audio was captured. Try again.');
          return;
        }

        try {
          const mimeType = recorder.mimeType || chunks[0]?.type || 'audio/webm';
          const extension = mimeType.includes('ogg')
            ? 'ogg'
            : mimeType.includes('mp4')
              ? 'm4a'
              : 'webm';
          const audioFile = new File(chunks, `recording.${extension}`, {
            type: mimeType,
          });
          const result = await transcribeAudio(audioFile);

          insertTranscription(result.text);
          setRecordingState('idle');
        } catch (error) {
          setRecordingState('idle');
          setTranscriptionError(
            error instanceof Error ? error.message : 'Transcription failed.'
          );
        }
      };

      startMeterMonitoring(stream);
      recorder.start();
      setRecordingState('recording');
    } catch (error) {
      stopMeterMonitoring();
      stopActiveStream();
      mediaRecorderRef.current = null;
      setRecordingState('idle');
      setTranscriptionError(
        error instanceof Error
          ? error.message
          : 'Microphone access could not be started.'
      );
    }
  }

  function abortRecording() {
    const recorder = mediaRecorderRef.current;

    setTranscriptionError(null);
    stopActionRef.current = 'abort';

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      stopMeterMonitoring();
      stopActiveStream();
    }

    setRecordingState('idle');
  }

  function confirmRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    setTranscriptionError(null);
    stopActionRef.current = 'transcribe';
    setRecordingState('transcribing');
    recorder.stop();
  }

  return (
    <section className="chat-panel">
      <div className="chat-panel__header">
        <div>
          <h2>Shape the requirement before it becomes a document</h2>
        </div>
      </div>

      {formattedIntroMessage ? (
        <p className="clarification-intro">{formattedIntroMessage}</p>
      ) : null}

      {statusMessage ? (
        <p className="clarification-status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      <div className="clarification-progress">
        <div className="clarification-progress__summary">
          <span>{filledCount}/{totalCount} fields</span>
          <button
            type="button"
            className="clarification-progress__action"
            disabled={busy || !canGenerateDraft}
            onClick={onGenerateDraft}
            title={
              canGenerateDraft
                ? 'Generate the first markdown draft'
                : `${totalCount - filledCount} required field(s) still missing`
            }
          >
            Create first draft
          </button>
        </div>
        <div className="clarification-progress__chips">
          {requirementFields.map((field) => {
            const currentValue = collectedContext[field.key];
            const isFilled = currentValue !== null && currentValue.trim() !== '';

            return (
              <span
                key={field.key}
                className={`clarification-chip ${
                  isFilled ? 'clarification-chip--filled' : ''
                }`}
                title={isFilled ? currentValue : field.description}
              >
                {field.label}
              </span>
            );
          })}
        </div>
      </div>

      {conversationMessages.length > 0 ? (
        <div className="message-list" aria-live="polite">
          {conversationMessages.map((message) => (
            <article
              key={message.id}
              className={`message-bubble message-bubble--${message.role}`}
            >
              <p className="message-meta">{message.role}</p>
              <p>{message.content}</p>
            </article>
          ))}
        </div>
      ) : null}

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="composer__surface">
          <label className="sr-only" htmlFor="clarification-input">
            Clarification message
          </label>
          {showRecorderPanel ? (
            <div
              className="composer__transcription-panel"
              aria-live="polite"
              aria-label={
                isTranscribing ? 'Transcription in progress' : 'Recording in progress'
              }
            >
              <div className="composer__recording-visual" aria-hidden="true">
                {meterLevels.map((level, index) => (
                  <span
                    key={index}
                    className="composer__recording-bar"
                    style={{
                      transform: `scaleY(${isTranscribing ? 0.28 : level})`,
                      opacity: isTranscribing ? 0.45 : 0.35 + level * 0.65,
                    }}
                  />
                ))}
              </div>
              <div className="composer__transcription-footer">
                <p className="composer__recording-copy">
                  {isTranscribing ? 'Transcribing audio…' : 'Recording voice note…'}
                </p>
                <div className="composer__transcription-actions">
                  <button
                    type="button"
                    className="composer__aux-button"
                    onClick={abortRecording}
                    aria-label="Abort recording"
                    disabled={isTranscribing}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="composer__submit"
                    onClick={confirmRecording}
                    aria-label="Transcribe recording"
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      '…'
                    ) : (
                      <svg
                        className="composer__submit-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12.5L10 17.5L19 6.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <textarea
                id="clarification-input"
                ref={textareaRef}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onClick={rememberSelection}
                onKeyUp={rememberSelection}
                onSelect={rememberSelection}
                placeholder="Describe the business change, the actors involved, and the outcome the analyst needs."
                rows={5}
                disabled={busy}
              />
              <div className="composer__action-row">
                <button
                  type="button"
                  className="composer__aux-button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    rememberSelection();
                  }}
                  onClick={() => {
                    void startRecording();
                  }}
                  aria-label="Record voice note"
                  disabled={busy}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect
                      x="9"
                      y="3"
                      width="6"
                      height="11"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M6 11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 17V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {busy || hasComposerValue ? (
                  <button
                    type="submit"
                    className="composer__submit"
                    aria-label={busy ? 'Working' : 'Send message'}
                    disabled={busy || !hasComposerValue}
                  >
                    {busy ? (
                      '…'
                    ) : (
                      <svg
                        className="composer__submit-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <line
                          x1="12"
                          y1="19"
                          x2="12"
                          y2="5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="5 12 12 5 19 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
        {transcriptionError ? (
          <p className="composer__transcription-error" role="alert">
            {transcriptionError}
          </p>
        ) : null}
      </form>
    </section>
  );
}
