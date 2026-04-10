import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DiffBlock, DiffStats, PendingComment } from '../types';
import { buildSelectionContext } from '../lib/selection';

interface SelectionDraft {
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  startOffset: number;
  endOffset: number;
  top: number;
  left: number;
}

interface CommentDecoration {
  id: string;
  commentText: string;
  rects: Array<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>;
  cardTop: number;
  cardLeft: number;
}

const ANNOTATION_CARD_WIDTH = 210;
const ANNOTATION_LANE_GUTTER = 24;
const ANNOTATION_LANE_TOP_MIN = 84;
const VIEWPORT_MARGIN = 12;

interface DocumentReviewPaneProps {
  markdown: string;
  previousMarkdown?: string | null;
  revisionCount: number;
  pendingComments: PendingComment[];
  changeSummary: string[];
  diffBlocks: DiffBlock[];
  diffStats: DiffStats;
  busy: boolean;
  saveBusy: boolean;
  saveMessage: string | null;
  saveTone: 'success' | 'error';
  onAddComment: (comment: Omit<PendingComment, 'id' | 'createdAt'>) => void;
  onRemoveComment: (id: string) => void;
  onSubmitRevision: () => void;
  onSaveJson: () => void;
}

export function DocumentReviewPane({
  markdown,
  previousMarkdown,
  revisionCount,
  pendingComments,
  busy,
  saveBusy,
  saveMessage,
  saveTone,
  onAddComment,
  onRemoveComment,
  onSubmitRevision,
  onSaveJson,
}: DocumentReviewPaneProps) {
  const selectionPopoverRef = useRef<HTMLFormElement>(null);
  const reviewSurfaceRef = useRef<HTMLElement>(null);
  const reviewContentRef = useRef<HTMLDivElement>(null);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [commentDecorations, setCommentDecorations] = useState<CommentDecoration[]>([]);
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

  useLayoutEffect(() => {
    if (
      !selectionDraft ||
      !selectionPopoverRef.current ||
      !reviewContentRef.current
    ) {
      return;
    }

    const { offsetHeight, offsetWidth } = selectionPopoverRef.current;
    const maxTop = Math.max(
      VIEWPORT_MARGIN,
      reviewContentRef.current.scrollHeight - offsetHeight - VIEWPORT_MARGIN
    );
    const maxLeft = Math.max(
      VIEWPORT_MARGIN,
      reviewContentRef.current.clientWidth - offsetWidth - VIEWPORT_MARGIN
    );
    const nextTop = Math.min(Math.max(selectionDraft.top, VIEWPORT_MARGIN), maxTop);
    const nextLeft = Math.min(Math.max(selectionDraft.left, VIEWPORT_MARGIN), maxLeft);

    if (nextTop === selectionDraft.top && nextLeft === selectionDraft.left) {
      return;
    }

    setSelectionDraft((current) =>
      current
        ? {
            ...current,
            top: nextTop,
            left: nextLeft,
          }
        : current
    );
  }, [selectionDraft, commentText]);

  useLayoutEffect(() => {
    if (!reviewSurfaceRef.current || !reviewContentRef.current || pendingComments.length === 0) {
      setCommentDecorations([]);
      return;
    }

    const reviewSurface = reviewSurfaceRef.current;
    const reviewContent = reviewContentRef.current;
    let frame = 0;

    function scheduleMeasure() {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nextDecorations = measureCommentDecorations(
          reviewSurface,
          reviewContent,
          pendingComments
        );
        setCommentDecorations(nextDecorations);
      });
    }

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [pendingComments, markdown]);

  function handleSelection() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText || !reviewSurfaceRef.current || !reviewContentRef.current) {
      return;
    }

    if (
      !reviewContentRef.current.contains(range.commonAncestorContainer) &&
      range.commonAncestorContainer !== reviewContentRef.current
    ) {
      return;
    }

    const ancestorElement =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;

    if (
      ancestorElement?.closest(
        '[data-comment-overlay="true"], [data-selection-disabled="true"]'
      )
    ) {
      return;
    }

    const startContainerParent =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    const endContainerParent =
      range.endContainer instanceof Element
        ? range.endContainer
        : range.endContainer.parentElement;

    if (
      startContainerParent?.closest('[data-selection-disabled="true"]') ||
      endContainerParent?.closest('[data-selection-disabled="true"]')
    ) {
      return;
    }

    const rect = range.getBoundingClientRect();
    const contentRect = reviewContentRef.current.getBoundingClientRect();
    const startOffset = getSelectionOffset(reviewContentRef.current, range, 'start');
    const endOffset = getSelectionOffset(reviewContentRef.current, range, 'end');
    const { matchedText, contextBefore, contextAfter } = buildSelectionContext(
      markdown,
      selectedText
    );

    setSelectionDraft({
      selectedText: matchedText,
      contextBefore,
      contextAfter,
      startOffset,
      endOffset,
      top: rect.bottom - contentRect.top + 14,
      left: rect.left - contentRect.left,
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
      startOffset: selectionDraft.startOffset,
      endOffset: selectionDraft.endOffset,
    });

    setSelectionDraft(null);
    setCommentText('');
    window.getSelection()?.removeAllRanges();
  }

  return (
    <section className="review-layout">
      <article className="document-panel">
        <article
          ref={reviewSurfaceRef}
          className="document-surface"
          data-review-surface="true"
        >
          <div
            className="document-surface__actions"
            data-selection-disabled="true"
          >
            {pendingComments.length > 0 ? (
              <p className="document-surface__pending">
                {pendingComments.length} pending
              </p>
            ) : null}
            <button
              type="button"
              className="document-surface__save"
              disabled={busy || saveBusy || revisionCount === 0}
              onClick={onSaveJson}
              aria-label={saveBusy ? 'Sending ticket' : 'Send ticket'}
            >
              {saveBusy ? 'Sending…' : 'Send ticket'}
            </button>
            <button
              type="button"
              className="document-surface__submit"
              disabled={busy || pendingComments.length === 0}
              onClick={onSubmitRevision}
            >
              {busy ? 'Applying…' : 'Adjust that'}
            </button>
          </div>
          {saveMessage ? (
            <p
              className={`document-surface__save-message document-surface__save-message--${saveTone}`}
              data-selection-disabled="true"
              aria-live="polite"
            >
              {saveMessage}
            </p>
          ) : null}
          <div
            ref={reviewContentRef}
            className="document-surface__content"
            onMouseUp={handleSelection}
          >
            {previousMarkdown ? (
              <InlineDiffDocument
                previousMarkdown={previousMarkdown}
                markdown={markdown}
              />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            )}
            {commentDecorations.length > 0 ? (
              <div className="document-comment-overlay" data-comment-overlay="true">
                {commentDecorations.map((comment) => (
                  <div key={comment.id}>
                    {comment.rects.map((rect, index) => (
                      <div
                        key={`${comment.id}-${index}`}
                        className="document-comment-highlight"
                        style={{
                          top: `${rect.top}px`,
                          left: `${rect.left}px`,
                          width: `${rect.width}px`,
                          height: `${rect.height}px`,
                        }}
                      />
                    ))}
                    <div
                      className="document-comment-card"
                      style={{
                        top: `${comment.cardTop}px`,
                        left: `${comment.cardLeft}px`,
                      }}
                    >
                      <p>{comment.commentText}</p>
                      <div className="document-comment-card__actions">
                        <button
                          type="button"
                          className="document-comment-card__icon"
                          aria-label="Remove comment"
                          onClick={() => onRemoveComment(comment.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M3 6H21"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 6V4.8C8 4.35817 8.35817 4 8.8 4H15.2C15.6418 4 16 4.35817 16 4.8V6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.4 6L17.2751 19.4986C17.2057 20.3308 16.5103 20.9703 15.6752 20.9703H8.32477C7.48973 20.9703 6.79431 20.3308 6.72495 19.4986L5.6 6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 10.5V16"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M14 10.5V16"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {selectionDraft ? (
              <form
                ref={selectionPopoverRef}
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
                <button
                  type="button"
                  className="selection-popover__floating-action selection-popover__floating-action--dismiss"
                  aria-label="Close comment box"
                  onClick={() => {
                    setSelectionDraft(null);
                    setCommentText('');
                  }}
                >
                  <svg
                    className="selection-popover__floating-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <label className="sr-only" htmlFor="comment-draft">
                  Comment for the selected text
                </label>
                <div className="selection-popover__surface">
                  <textarea
                    id="comment-draft"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Explain the revision the agent should make here."
                    rows={3}
                  />
                  {commentText.trim() ? (
                    <button
                      type="submit"
                      className="selection-popover__submit"
                      aria-label="Queue comment"
                      disabled={!commentText.trim()}
                    >
                      <svg
                        className="selection-popover__submit-icon"
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
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
        </article>
      </article>
    </section>
  );
}

function getSelectionOffset(
  root: HTMLElement,
  range: Range,
  edge: 'start' | 'end'
): number {
  const offsetRange = document.createRange();
  offsetRange.selectNodeContents(root);

  if (edge === 'start') {
    offsetRange.setEnd(range.startContainer, range.startOffset);
  } else {
    offsetRange.setEnd(range.endContainer, range.endOffset);
  }

  return getSelectableTextLength(offsetRange.cloneContents());
}

function resolveTextPosition(root: HTMLElement, targetOffset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipSelectableNode(node)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let currentOffset = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textLength = currentNode.textContent?.length ?? 0;
    const nextOffset = currentOffset + textLength;

    if (targetOffset <= nextOffset) {
      return {
        node: currentNode,
        offset: Math.max(0, targetOffset - currentOffset),
      };
    }

    currentOffset = nextOffset;
    currentNode = walker.nextNode();
  }

  return null;
}

function shouldSkipSelectableNode(node: Node) {
  const parentElement = node.parentElement;

  return Boolean(
    parentElement?.closest('[data-comment-overlay="true"], [data-diff-removed="true"]')
  );
}

function getSelectableTextLength(fragment: DocumentFragment) {
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentElement = node.parentElement;

      if (parentElement?.closest('[data-diff-removed="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let length = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    length += currentNode.textContent?.length ?? 0;
    currentNode = walker.nextNode();
  }

  return length;
}

function measureCommentDecorations(
  reviewSurface: HTMLElement,
  reviewContent: HTMLElement,
  pendingComments: PendingComment[]
): CommentDecoration[] {
  const contentRect = reviewContent.getBoundingClientRect();
  const { laneLeft, laneTopMin } = getAnnotationLaneMetrics(reviewSurface);
  const cardGap = 12;

  const decorations = pendingComments.flatMap((comment) => {
    if (
      comment.startOffset === undefined ||
      comment.endOffset === undefined ||
      comment.endOffset <= comment.startOffset
    ) {
      return [];
    }

    const start = resolveTextPosition(reviewContent, comment.startOffset);
    const end = resolveTextPosition(reviewContent, comment.endOffset);

    if (!start || !end) {
      return [];
    }

    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    const rects = Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        top: rect.top - contentRect.top,
        left: rect.left - contentRect.left,
        width: rect.width,
        height: rect.height,
      }));

    if (rects.length === 0) {
      return [];
    }

    const anchorRect = rects[0];
    const estimatedCardHeight = estimateCommentCardHeight(comment.commentText);
    const preferredTop = getPreferredAnnotationTop(
      anchorRect.top,
      reviewSurface.clientHeight,
      estimatedCardHeight
    );

    return [
      {
        id: comment.id,
        commentText: comment.commentText,
        rects,
        cardTop: preferredTop,
        cardLeft: laneLeft,
      },
    ];
  });

  decorations.sort((left, right) => left.cardTop - right.cardTop);

  let currentBottom = laneTopMin;
  return decorations.map((comment) => {
    const estimatedCardHeight = estimateCommentCardHeight(comment.commentText);
    const maxTop = Math.max(laneTopMin, reviewSurface.clientHeight - estimatedCardHeight - 12);
    const cardTop = Math.min(Math.max(comment.cardTop, currentBottom), maxTop);
    currentBottom = cardTop + estimatedCardHeight + cardGap;

    return {
      ...comment,
      cardTop,
    };
  });
}

function estimateCommentCardHeight(commentText: string): number {
  const approximateLines = Math.max(2, Math.ceil(commentText.length / 24));
  return 52 + approximateLines * 24;
}

type DiffSegment = {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
};

type DiffLine = {
  key: string;
  kind: 'blank' | 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'ordered';
  prefix?: string;
  segments: DiffSegment[];
};

function InlineDiffDocument({
  previousMarkdown,
  markdown,
}: {
  previousMarkdown: string;
  markdown: string;
}) {
  const lines = buildInlineDiffLines(previousMarkdown, markdown);

  return (
    <div className="inline-diff-document">
      {lines.map((line) => {
        if (line.kind === 'blank') {
          return <div key={line.key} className="inline-diff-document__spacer" />;
        }

        const className = `inline-diff-line inline-diff-line--${line.kind}`;

        return (
          <div key={line.key} className={className}>
            {line.prefix ? <span className="inline-diff-line__prefix">{line.prefix}</span> : null}
            <span className="inline-diff-line__content">
              {line.segments.map((segment, index) => (
                <InlineDiffSegment
                  key={`${line.key}-${segment.type}-${index}`}
                  segment={segment}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function InlineDiffSegment({ segment }: { segment: DiffSegment }) {
  if (segment.type === 'added') {
    return <span className="inline-diff__added">{segment.text}</span>;
  }

  if (segment.type === 'removed') {
    return (
      <span className="inline-diff__removed" data-diff-removed="true" aria-hidden="true">
        {segment.text}
      </span>
    );
  }

  return <>{segment.text}</>;
}

function buildInlineDiffLines(previousMarkdown: string, markdown: string): DiffLine[] {
  const previousLines = previousMarkdown.replace(/\r\n/g, '\n').split('\n');
  const currentLines = markdown.replace(/\r\n/g, '\n').split('\n');
  const operations = diffLines(previousLines, currentLines);
  const lines: DiffLine[] = [];

  let index = 0;
  while (index < operations.length) {
    const current = operations[index];
    const next = operations[index + 1];

    if (current?.type === 'removed' && next?.type === 'added') {
      lines.push(
        createDiffLine(
          next.line,
          createWordDiffSegments(current.line, next.line),
          `line-${index}`
        )
      );
      index += 2;
      continue;
    }

    if (current.type === 'unchanged') {
      lines.push(
        createDiffLine(current.line, [{ type: 'unchanged', text: current.line }], `line-${index}`)
      );
    } else if (current.type === 'added') {
      lines.push(
        createDiffLine(current.line, [{ type: 'added', text: current.line }], `line-${index}`)
      );
    } else {
      lines.push(
        createDiffLine('', [{ type: 'removed', text: current.line }], `line-${index}`)
      );
    }

    index += 1;
  }

  return lines;
}

function createDiffLine(lineText: string, segments: DiffSegment[], key: string): DiffLine {
  if (lineText.length === 0 && segments.every((segment) => segment.text.length === 0)) {
    return { key, kind: 'blank', segments };
  }

  const headingMatch = /^(#{1,3})\s+(.*)$/.exec(lineText);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    return {
      key,
      kind: level === 1 ? 'heading1' : level === 2 ? 'heading2' : 'heading3',
      segments: trimLeadingText(segments, lineText.length - text.length),
    };
  }

  const bulletMatch = /^([-*])\s+(.*)$/.exec(lineText);
  if (bulletMatch) {
    const text = bulletMatch[2];
    return {
      key,
      kind: 'bullet',
      prefix: '•',
      segments: trimLeadingText(segments, lineText.length - text.length),
    };
  }

  const orderedMatch = /^(\d+\.)\s+(.*)$/.exec(lineText);
  if (orderedMatch) {
    const text = orderedMatch[2];
    return {
      key,
      kind: 'ordered',
      prefix: orderedMatch[1],
      segments: trimLeadingText(segments, lineText.length - text.length),
    };
  }

  return {
    key,
    kind: 'paragraph',
    segments,
  };
}

function trimLeadingText(segments: DiffSegment[], count: number) {
  if (count <= 0) {
    return segments;
  }

  const nextSegments: DiffSegment[] = [];
  let remaining = count;

  for (const segment of segments) {
    if (remaining <= 0) {
      nextSegments.push(segment);
      continue;
    }

    if (segment.text.length <= remaining) {
      remaining -= segment.text.length;
      continue;
    }

    nextSegments.push({
      ...segment,
      text: segment.text.slice(remaining),
    });
    remaining = 0;
  }

  return nextSegments;
}

function tokenizeInlineText(value: string) {
  return value.match(/\S+|\s+/g) ?? [];
}

function createWordDiffSegments(previousLine: string, currentLine: string): DiffSegment[] {
  const previousTokens = tokenizeInlineText(previousLine);
  const currentTokens = tokenizeInlineText(currentLine);
  const operations = diffTokens(previousTokens, currentTokens);

  return mergeSegments(
    operations.map((operation) => ({
      type: operation.type,
      text: operation.text,
    }))
  );
}

function mergeSegments(segments: DiffSegment[]) {
  return segments.reduce<DiffSegment[]>((accumulator, segment) => {
    if (!segment.text) {
      return accumulator;
    }

    const previous = accumulator[accumulator.length - 1];
    if (previous && previous.type === segment.type) {
      previous.text += segment.text;
      return accumulator;
    }

    accumulator.push({ ...segment });
    return accumulator;
  }, []);
}

function diffLines(previousLines: string[], currentLines: string[]) {
  return diffSequence(previousLines, currentLines).map((item) => ({
    type: item.type,
    line: item.value,
  }));
}

function diffTokens(previousTokens: string[], currentTokens: string[]) {
  return diffSequence(previousTokens, currentTokens).map((item) => ({
    type: item.type,
    text: item.value,
  }));
}

function diffSequence(previous: string[], current: string[]) {
  const dp = Array.from({ length: previous.length + 1 }, () =>
    Array<number>(current.length + 1).fill(0)
  );

  for (let previousIndex = previous.length - 1; previousIndex >= 0; previousIndex -= 1) {
    for (let currentIndex = current.length - 1; currentIndex >= 0; currentIndex -= 1) {
      if (previous[previousIndex] === current[currentIndex]) {
        dp[previousIndex][currentIndex] = dp[previousIndex + 1][currentIndex + 1] + 1;
      } else {
        dp[previousIndex][currentIndex] = Math.max(
          dp[previousIndex + 1][currentIndex],
          dp[previousIndex][currentIndex + 1]
        );
      }
    }
  }

  const items: Array<{ type: 'unchanged' | 'added' | 'removed'; value: string }> = [];
  let previousIndex = 0;
  let currentIndex = 0;

  while (previousIndex < previous.length && currentIndex < current.length) {
    if (previous[previousIndex] === current[currentIndex]) {
      items.push({ type: 'unchanged', value: previous[previousIndex] });
      previousIndex += 1;
      currentIndex += 1;
    } else if (dp[previousIndex + 1][currentIndex] >= dp[previousIndex][currentIndex + 1]) {
      items.push({ type: 'removed', value: previous[previousIndex] });
      previousIndex += 1;
    } else {
      items.push({ type: 'added', value: current[currentIndex] });
      currentIndex += 1;
    }
  }

  while (previousIndex < previous.length) {
    items.push({ type: 'removed', value: previous[previousIndex] });
    previousIndex += 1;
  }

  while (currentIndex < current.length) {
    items.push({ type: 'added', value: current[currentIndex] });
    currentIndex += 1;
  }

  return items;
}

function getAnnotationLaneMetrics(reviewSurface: HTMLElement) {
  return {
    cardWidth: ANNOTATION_CARD_WIDTH,
    laneLeft: Math.max(
      VIEWPORT_MARGIN,
      reviewSurface.clientWidth - ANNOTATION_CARD_WIDTH - ANNOTATION_LANE_GUTTER
    ),
    laneTopMin: ANNOTATION_LANE_TOP_MIN,
  };
}

function getPreferredAnnotationTop(
  anchorTop: number,
  surfaceHeight: number,
  itemHeight: number
) {
  const maxTop = Math.max(
    ANNOTATION_LANE_TOP_MIN,
    surfaceHeight - itemHeight - VIEWPORT_MARGIN
  );

  return Math.min(
    Math.max(ANNOTATION_LANE_TOP_MIN, anchorTop - 6),
    maxTop
  );
}
