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
  onChange: (value: string) => void;
  onSubmit: () => void;
  onGenerateDraft: () => void;
}

export function ClarificationChat({
  messages,
  value,
  busy,
  collectedContext,
  onChange,
  onSubmit,
  onGenerateDraft,
}: ClarificationChatProps) {
  const filledCount = requirementFields.filter(
    (f) =>
      collectedContext[f.key] !== null &&
      collectedContext[f.key]!.trim() !== ''
  ).length;
  const totalCount = requirementFields.length;
  const canGenerateDraft = allFieldsFilled(collectedContext);

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <div>
          <p className="card-label">Clarification</p>
          <h2>Shape the requirement before it becomes a document</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="muted-copy" style={{ whiteSpace: 'nowrap' }}>
            {filledCount}/{totalCount} fields
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={onGenerateDraft}
            disabled={busy || !canGenerateDraft}
            title={
              canGenerateDraft
                ? 'Generate the first markdown draft'
                : `${totalCount - filledCount} required field(s) still missing`
            }
          >
            Create first draft
          </button>
        </div>
      </div>

      <div className="field-progress">
        {requirementFields.map((f) => {
          const filled =
            collectedContext[f.key] !== null &&
            collectedContext[f.key]!.trim() !== '';
          return (
            <span
              key={f.key}
              className={`field-chip ${filled ? 'field-chip--filled' : ''}`}
              title={filled ? collectedContext[f.key]! : f.description}
            >
              {f.label}
            </span>
          );
        })}
      </div>

      <div className="message-list" aria-live="polite">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`message-bubble message-bubble--${message.role}`}
          >
            <p className="message-meta">{message.role}</p>
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
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
        <div className="composer__footer">
          <p className="muted-copy">
            Local state is saved in the browser. The backend only receives the
            current conversation payload.
          </p>
          <button type="submit" className="primary-button" disabled={busy || !value.trim()}>
            {busy ? 'Working…' : 'Send message'}
          </button>
        </div>
      </form>
    </section>
  );
}
