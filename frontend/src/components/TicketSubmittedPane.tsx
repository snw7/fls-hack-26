import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TicketSubmittedPaneProps {
  confirmationMessage?: string | null;
  markdown: string;
  sessionId: string;
  onStartAnother: () => void;
}

export function TicketSubmittedPane({
  confirmationMessage,
  markdown,
  sessionId,
  onStartAnother,
}: TicketSubmittedPaneProps) {
  const reportContentRef = useRef<HTMLDivElement | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  function escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function handleExportPdf() {
    if (!reportContentRef.current) {
      return;
    }

    const reportWindow = window.open('', '_blank');

    if (!reportWindow) {
      setExportMessage('Allow pop-ups to export the PDF report.');
      return;
    }

    const title = `requirement-brief-${sessionId}`;
    const logoUrl = new URL('/logo.svg', window.location.href).href;
    const reportMarkup = reportContentRef.current.innerHTML;

    reportWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: A4;
        margin: 18mm;
      }

      :root {
        color-scheme: light;
      }

      body {
        margin: 0;
        color: #202126;
        font-family: "Segoe UI", Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.55;
      }

      .report-shell {
        max-width: 180mm;
        margin: 0 auto;
      }

      .report-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 28px;
        padding-bottom: 18px;
        border-bottom: 1px solid #d9e0e7;
      }

      .report-header img {
        width: 160px;
        height: auto;
      }

      .report-header__meta {
        text-align: right;
      }

      .report-header__eyebrow {
        margin: 0;
        color: #287f56;
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .report-header__title {
        margin: 8px 0 0;
        font-size: 12pt;
        font-weight: 600;
      }

      h1,
      h2,
      h3 {
        color: #202126;
        letter-spacing: -0.02em;
        page-break-after: avoid;
      }

      h1 {
        margin: 0 0 20px;
        font-size: 24pt;
      }

      h2 {
        margin: 22px 0 10px;
        font-size: 17pt;
      }

      h3 {
        margin: 18px 0 8px;
        font-size: 14pt;
      }

      p,
      ul,
      ol {
        margin: 0 0 12px;
      }

      ul,
      ol {
        padding-left: 20px;
      }

      li + li {
        margin-top: 6px;
      }

      hr {
        margin: 24px 0;
        border: none;
        border-top: 1px solid #d9e0e7;
      }
    </style>
  </head>
  <body>
    <div class="report-shell">
      <header class="report-header">
        <img src="${escapeHtml(logoUrl)}" alt="Finanz Informatik" />
        <div class="report-header__meta">
          <p class="report-header__eyebrow">Requirement Brief</p>
          <p class="report-header__title">${escapeHtml(title)}</p>
        </div>
      </header>
      <main>${reportMarkup}</main>
    </div>
  </body>
</html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();

    setExportMessage('Print dialog opened. Save it as a PDF report.');
  }

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
      {exportMessage ? (
        <p className="ticket-submitted__export-meta">{exportMessage}</p>
      ) : null}
      <div className="ticket-submitted__footer">
        <button
          type="button"
          className="secondary-button ticket-submitted__action"
          onClick={onStartAnother}
        >
          Start another brief
        </button>
        <div className="ticket-submitted__report-actions">
          <button
            type="button"
            className="ghost-button"
          >
            Send PDF Report to PAT
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleExportPdf}
          >
            Export PDF
          </button>
        </div>
      </div>
      <div
        ref={reportContentRef}
        className="ticket-submitted__report-source"
        aria-hidden="true"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </section>
  );
}
