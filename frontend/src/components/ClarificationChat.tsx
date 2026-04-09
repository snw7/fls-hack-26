import type { ChatMessage } from '../types';

interface ClarificationChatProps {
  messages: ChatMessage[];
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onGenerateDraft: () => void;
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
  onChange,
  onSubmit,
  onGenerateDraft: _onGenerateDraft,
}: ClarificationChatProps) {
  const introMessage =
    messages[0]?.role === 'assistant' ? messages[0].content : null;
  const formattedIntroMessage = formatIntroMessage(introMessage);
  const conversationMessages = introMessage ? messages.slice(1) : messages;
  const hasComposerValue = value.trim().length > 0;

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
          <textarea
            id="clarification-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Describe the business change, the actors involved, and the outcome the analyst needs."
            rows={5}
            disabled={busy}
          />
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
      </form>
    </section>
  );
}
