import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DiffBlock, DiffStats, PendingComment } from '../types';
import { buildSelectionContext } from '../lib/selection';

interface SelectionDraft {
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  top: number;
  left: number;
}

interface DocumentReviewPaneProps {
  markdown: string;
  revisionCount: number;
  pendingComments: PendingComment[];
  changeSummary: string[];
  diffBlocks: DiffBlock[];
  diffStats: DiffStats;
  busy: boolean;
  onAddComment: (comment: Omit<PendingComment, 'id' | 'createdAt'>) => void;
  onRemoveComment: (id: string) => void;
  onSubmitRevision: () => void;
}

export function DocumentReviewPane({
  markdown,
  revisionCount,
  pendingComments,
  changeSummary,
  diffBlocks,
  diffStats,
  busy,
  onAddComment,
  onRemoveComment,
  onSubmitRevision,
}: DocumentReviewPaneProps) {
  const reviewSurfaceRef = useRef<HTMLElement>(null);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectionDraft(null);
        setCommentText('');
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleSelection() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText || !reviewSurfaceRef.current) {
      return;
    }

    if (
      !reviewSurfaceRef.current.contains(range.commonAncestorContainer) &&
      range.commonAncestorContainer !== reviewSurfaceRef.current
    ) {
      return;
    }

    const rect = range.getBoundingClientRect();
    const { contextBefore, contextAfter } = buildSelectionContext(
      markdown,
      selectedText
    );

    setSelectionDraft({
      selectedText,
      contextBefore,
      contextAfter,
      top: Math.min(rect.bottom + 14, window.innerHeight - 220),
      left: Math.min(rect.left, window.innerWidth - 348),
    });
    setCommentText('');
  }

  function commitComment() {
    if (!selectionDraft || !commentText.trim()) {
      return;
    }

    onAddComment({
      selectedText: selectionDraft.selectedText,
      commentText: commentText.trim(),
      contextBefore: selectionDraft.contextBefore,
      contextAfter: selectionDraft.contextAfter,
    });

    setSelectionDraft(null);
    setCommentText('');
    window.getSelection()?.removeAllRanges();
  }

  return (
    <section className="review-layout">
      <article className="panel document-panel">
        <div className="panel-header">
          <div>
            <p className="card-label">Review</p>
            <h2>Refine the markdown brief through anchored comments</h2>
          </div>
          <div className="revision-badge">
            <span>Revision</span>
            <strong>{revisionCount}</strong>
          </div>
        </div>

        <div className="document-toolbar">
          <p className="muted-copy">
            Select any meaningful span in the document and attach a comment to
            drive the next revision.
          </p>
          <div className="diff-stats">
            <span>{diffStats.addedLines} added</span>
            <span>{diffStats.removedLines} removed</span>
            <span>{diffStats.changedSections} changed blocks</span>
          </div>
        </div>

        <article
          ref={reviewSurfaceRef}
          className="document-surface"
          data-review-surface="true"
          onMouseUp={handleSelection}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      </article>

      <aside className="review-rail">
        <section className="info-card info-card--sticky">
          <div className="rail-heading">
            <div>
              <p className="card-label">Queued comments</p>
              <h3>{pendingComments.length} pending</h3>
            </div>
            <button
              type="button"
              className="primary-button"
              disabled={busy || pendingComments.length === 0}
              onClick={onSubmitRevision}
            >
              {busy ? 'Applying…' : 'Adjust that'}
            </button>
          </div>
          {pendingComments.length === 0 ? (
            <p className="muted-copy">
              Nothing queued yet. Select text in the document to create a
              targeted change request.
            </p>
          ) : (
            <ul className="comment-list">
              {pendingComments.map((comment) => (
                <li key={comment.id} className="comment-card">
                  <blockquote>{comment.selectedText}</blockquote>
                  <p>{comment.commentText}</p>
                  <button
                    type="button"
                    className="inline-action"
                    onClick={() => onRemoveComment(comment.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="info-card">
          <p className="card-label">Latest changes</p>
          {changeSummary.length === 0 ? (
            <p className="muted-copy">
              The next successful revision will show a concise summary here.
            </p>
          ) : (
            <ul className="summary-list">
              {changeSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="info-card">
          <p className="card-label">Document diff</p>
          <div className="diff-list">
            {diffBlocks.length === 0 ? (
              <p className="muted-copy">
                No revision diff yet. Once a new markdown version comes back,
                the delta appears here.
              </p>
            ) : (
              diffBlocks
                .filter((block) => block.type !== 'unchanged')
                .map((block) => (
                  <div
                    key={block.id}
                    className={`diff-block diff-block--${block.type}`}
                  >
                    <p className="diff-block__label">{block.type}</p>
                    <pre>{block.lines.join('\n') || ' '}</pre>
                  </div>
                ))
            )}
          </div>
        </section>
      </aside>

      {selectionDraft ? (
        <form
          className="selection-popover"
          style={{
            top: `${selectionDraft.top}px`,
            left: `${selectionDraft.left}px`,
          }}
          onSubmit={(event) => {
            event.preventDefault();
            commitComment();
          }}
        >
          <p className="card-label">Selected text</p>
          <blockquote>{selectionDraft.selectedText}</blockquote>
          <label className="sr-only" htmlFor="comment-draft">
            Comment for the selected text
          </label>
          <textarea
            id="comment-draft"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Explain the revision the agent should make here."
            rows={4}
          />
          <div className="selection-popover__actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setSelectionDraft(null);
                setCommentText('');
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={!commentText.trim()}
            >
              Queue comment
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

