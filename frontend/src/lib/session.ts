import { createEmptyRequirementsContext } from '../data/template';
import type {
  ChatMessage,
  DocumentRevision,
  PendingComment,
  RevisionSource,
  SessionState,
} from '../types';
import { createId } from './id';

export function createInitialState(templateId: string): SessionState {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    sessionId: createId('session'),
    phase: 'clarification',
    status: 'ready',
    templateId,
    language: 'en',
    createdAt: now,
    updatedAt: now,
    chatHistory: [
      createMessage(
        'assistant',
        'Describe the business requirement, the target users, and the outcome you need.\nI will turn that into a structured markdown brief you can refine.'
      ),
    ],
    revisions: [],
    pendingComments: [],
    collectedContext: createEmptyRequirementsContext(),
    changeSummary: [],
    lastError: null,
  };
}

export function createMessage(
  role: ChatMessage['role'],
  content: string
): ChatMessage {
  return {
    id: createId(role),
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

export function createRevision(
  markdown: string,
  source: RevisionSource
): DocumentRevision {
  return {
    id: createId('rev'),
    markdown,
    createdAt: new Date().toISOString(),
    source,
  };
}

export function createPendingComment(
  input: Omit<PendingComment, 'id' | 'createdAt'>
): PendingComment {
  return {
    ...input,
    id: createId('comment'),
    createdAt: new Date().toISOString(),
  };
}
