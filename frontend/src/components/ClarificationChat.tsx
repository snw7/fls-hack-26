import {
  allFieldsFilled,
  requirementFields,
  type RequirementsContext,
} from '../data/template';
import type { ChatMessage } from '../types';

interface ClarificationChatProps {
  messages: ChatMessage[];
  value: string;
  busy: boolean;
  collectedContext: RequirementsContext;
  statusMessage?: string | null;
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
  collectedContext,
  statusMessage,
  onChange,
  onSubmit,
  onGenerateDraft,
}: ClarificationChatProps) {
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
