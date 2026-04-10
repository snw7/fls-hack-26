import { startTransition, useState } from 'react';
import { AppShell } from './components/AppShell';
import { ClarificationChat } from './components/ClarificationChat';
import { DocumentReviewPane } from './components/DocumentReviewPane';
import { requirementsTemplate } from './data/template';
import { usePersistentSession } from './hooks/usePersistentSession';
import { runtimeConfig } from './lib/config';
import { createLineDiff, summarizeDiff } from './lib/diff';
import {
  createMessage,
  createPendingComment,
  createRevision,
} from './lib/session';
import { callDiscoveryAgent, callRevisionAgent } from './lib/webhooks';

function toTimestamp(): string {
  return new Date().toISOString();
}

export default function App() {
  const { state, setState } = usePersistentSession(runtimeConfig.defaultTemplateId);
  const [composerValue, setComposerValue] = useState('');

  const currentRevision = state.revisions.at(-1) ?? null;
  const previousRevision = state.revisions.at(-2) ?? null;
  const diffBlocks =
    currentRevision && previousRevision
      ? createLineDiff(previousRevision.markdown, currentRevision.markdown)
      : [];
  const diffStats = summarizeDiff(diffBlocks);

  async function handleSendMessage() {
    const trimmedValue = composerValue.trim();

    if (!trimmedValue) {
      return;
    }

    const userMessage = createMessage('user', trimmedValue);
    const nextHistory = [...state.chatHistory, userMessage];

    setState((current) => ({
      ...current,
      status: 'loading',
      chatHistory: nextHistory,
      lastError: null,
      updatedAt: toTimestamp(),
    }));
    setComposerValue('');

    try {
      const response = await callDiscoveryAgent(runtimeConfig.discoveryWebhookUrl, {
        session_id: state.sessionId,
        mode: 'continue_or_generate',
        template: requirementsTemplate,
        chat_history: nextHistory.map(({ role, content }) => ({ role, content })),
        latest_user_message: trimmedValue,
        document_language: state.language,
        output_format: 'json',
      });

      const assistantMessage = createMessage(
        'assistant',
        response.assistant_message
      );

      startTransition(() => {
        setState((current) => {
          const revisions = [...current.revisions];
          let phase = current.phase;

          if (response.document_ready && response.markdown) {
            revisions.push(createRevision(response.markdown, 'generated'));
            phase = 'review';
          }

          return {
            ...current,
            status: 'ready',
            phase,
            chatHistory: [...nextHistory, assistantMessage],
            revisions,
            collectedContext: {
              ...current.collectedContext,
              ...response.collected_context,
            },
            lastError: null,
            updatedAt: toTimestamp(),
          };
        });
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The discovery webhook failed.';

      setState((current) => ({
        ...current,
        status: 'error',
        lastError: message,
        updatedAt: toTimestamp(),
      }));
    }
  }

  async function handleGenerateDraft() {
    if (state.chatHistory.length < 2) {
      return;
    }

    setState((current) => ({
      ...current,
      status: 'loading',
      lastError: null,
      updatedAt: toTimestamp(),
    }));

    try {
      const response = await callDiscoveryAgent(runtimeConfig.discoveryWebhookUrl, {
        session_id: state.sessionId,
        mode: 'continue_or_generate',
        template: requirementsTemplate,
        chat_history: state.chatHistory.map(({ role, content }) => ({
          role,
          content,
        })),
        latest_user_message:
          'Please generate the first markdown draft based on the current conversation.',
        document_language: state.language,
        output_format: 'json',
      });

      const assistantMessage = createMessage(
        'assistant',
        response.assistant_message
      );

      startTransition(() => {
        setState((current) => ({
          ...current,
          status: 'ready',
          phase:
            response.document_ready && response.markdown
              ? 'review'
              : current.phase,
          chatHistory: [...current.chatHistory, assistantMessage],
          revisions:
            response.document_ready && response.markdown
              ? [...current.revisions, createRevision(response.markdown, 'generated')]
              : current.revisions,
          collectedContext: {
            ...current.collectedContext,
            ...response.collected_context,
          },
          lastError: null,
          updatedAt: toTimestamp(),
        }));
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The draft generation failed.';

      setState((current) => ({
        ...current,
        status: 'error',
        lastError: message,
        updatedAt: toTimestamp(),
      }));
    }
  }

  function handleAddComment(
    comment: Parameters<typeof createPendingComment>[0]
  ) {
    setState((current) => ({
      ...current,
      pendingComments: [...current.pendingComments, createPendingComment(comment)],
      updatedAt: toTimestamp(),
    }));
  }

  function handleRemoveComment(id: string) {
    setState((current) => ({
      ...current,
      pendingComments: current.pendingComments.filter((comment) => comment.id !== id),
      updatedAt: toTimestamp(),
    }));
  }

  async function handleSubmitRevision() {
    if (!currentRevision || state.pendingComments.length === 0) {
      return;
    }

    setState((current) => ({
      ...current,
      status: 'loading',
      lastError: null,
      updatedAt: toTimestamp(),
    }));

    try {
      const response = await callRevisionAgent(runtimeConfig.revisionWebhookUrl, {
        session_id: state.sessionId,
        base_revision_id: currentRevision.id,
        current_markdown: currentRevision.markdown,
        comments: state.pendingComments.map((comment) => ({
          comment_id: comment.id,
          selected_text: comment.selectedText,
          comment_text: comment.commentText,
          context_before: comment.contextBefore,
          context_after: comment.contextAfter,
        })),
        document_language: state.language,
        output_format: 'json',
      });

      if (response.status === 'error') {
        throw new Error(response.assistant_message);
      }

      const assistantMessage = createMessage(
        'assistant',
        response.assistant_message
      );
      const revision = createRevision(response.updated_markdown, 'revised');

      startTransition(() => {
        setState((current) => ({
          ...current,
          status: 'ready',
          phase: 'review',
          chatHistory: [...current.chatHistory, assistantMessage],
          revisions: [...current.revisions, revision],
          pendingComments: [],
          changeSummary: response.change_summary,
          lastError: null,
          updatedAt: toTimestamp(),
        }));
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The revision webhook failed.';

      setState((current) => ({
        ...current,
        status: 'error',
        lastError: message,
        updatedAt: toTimestamp(),
      }));
    }
  }

  return (
    <AppShell>
      {state.phase === 'clarification' || !currentRevision ? (
        <ClarificationChat
          messages={state.chatHistory}
          value={composerValue}
          busy={state.status === 'loading'}
          onChange={setComposerValue}
          onSubmit={handleSendMessage}
          onGenerateDraft={handleGenerateDraft}
        />
      ) : (
        <DocumentReviewPane
          markdown={currentRevision.markdown}
          previousMarkdown={previousRevision?.markdown ?? null}
          revisionCount={state.revisions.length}
          pendingComments={state.pendingComments}
          changeSummary={state.changeSummary}
          diffBlocks={diffBlocks}
          diffStats={diffStats}
          busy={state.status === 'loading'}
          onAddComment={handleAddComment}
          onRemoveComment={handleRemoveComment}
          onSubmitRevision={handleSubmitRevision}
        />
      )}
    </AppShell>
  );
}
