interface TicketSubmittedPaneProps {
  confirmationMessage?: string | null;
  onStartAnother: () => void;
}

export function TicketSubmittedPane({
  confirmationMessage,
  onStartAnother,
}: TicketSubmittedPaneProps) {
  return (
    <section className="ticket-submitted">
      <p className="ticket-submitted__eyebrow">Ticket workflow started</p>
      <h2>Thank you</h2>
      <p className="ticket-submitted__lead">
        Your requirement brief has been saved and sent to the ticket handoff
        workflow.
      </p>
      <p className="ticket-submitted__copy">
        The generated brief is now ready for downstream processing. You can
        start another requirement whenever you are ready.
      </p>
      {confirmationMessage ? (
        <p className="ticket-submitted__meta">{confirmationMessage}</p>
      ) : null}
      <button
        type="button"
        className="secondary-button ticket-submitted__action"
        onClick={onStartAnother}
      >
        Start another brief
      </button>
    </section>
  );
}
