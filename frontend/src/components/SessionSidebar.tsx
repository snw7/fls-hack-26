import type { SessionState } from '../types';

interface SessionSidebarProps {
  state: SessionState;
}

export function SessionSidebar({ state }: SessionSidebarProps) {
  const currentRevision = state.revisions.at(-1);

  return (
    <div className="sidebar-stack">
      <section className="info-card info-card--accent">
        <p className="card-label">Workspace</p>
        <h2>Requirements control surface</h2>
        <p>
          Structured, reviewable, and deliberately operational. Chat collects
          intent, markdown becomes the governed artifact.
        </p>
      </section>

      <section className="info-card">
        <p className="card-label">Session</p>
        <dl className="key-value-list">
          <div>
            <dt>Phase</dt>
            <dd>{state.phase}</dd>
          </div>
          <div>
            <dt>Template</dt>
            <dd>{state.templateId}</dd>
          </div>
          <div>
            <dt>Messages</dt>
            <dd>{state.chatHistory.length}</dd>
          </div>
          <div>
            <dt>Revisions</dt>
            <dd>{state.revisions.length}</dd>
          </div>
        </dl>
      </section>

      <section className="info-card">
        <p className="card-label">Process</p>
        <ol className="step-list">
          <li className={state.phase === 'clarification' ? 'is-active' : 'is-complete'}>
            Clarify the requirement with the discovery agent
          </li>
          <li className={state.phase === 'review' ? 'is-active' : ''}>
            Generate the first markdown brief
          </li>
          <li className={currentRevision ? 'is-active' : ''}>
            Iterate through text-selected comments and controlled revisions
          </li>
        </ol>
      </section>

      <section className="info-card">
        <p className="card-label">Captured context</p>
        {Object.keys(state.collectedContext).length === 0 ? (
          <p className="muted-copy">
            Facts extracted by the webhook flow will accumulate here as the
            clarification advances.
          </p>
        ) : (
          <div className="context-chip-list">
            {Object.entries(state.collectedContext).map(([key, value]) => (
              <div key={key} className="context-chip">
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

