import type { RequirementsContext } from './data/template';

export type Phase = 'clarification' | 'review';
export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error';
export type MessageRole = 'user' | 'assistant';
export type RevisionSource = 'generated' | 'revised';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface DocumentRevision {
  id: string;
  markdown: string;
  createdAt: string;
  source: RevisionSource;
}

export interface PendingComment {
  id: string;
  selectedText: string;
  commentText: string;
  contextBefore: string;
  contextAfter: string;
  startOffset?: number;
  endOffset?: number;
  createdAt: string;
}

export interface SessionState {
  schemaVersion: 1;
  sessionId: string;
  phase: Phase;
  status: SessionStatus;
  templateId: string;
  language: 'en';
  createdAt: string;
  updatedAt: string;
  chatHistory: ChatMessage[];
  revisions: DocumentRevision[];
  pendingComments: PendingComment[];
  collectedContext: RequirementsContext;
  changeSummary: string[];
  lastError: string | null;
}

export interface DiffBlock {
  id: string;
  type: 'added' | 'removed' | 'unchanged';
  lines: string[];
}

export interface DiffStats {
  addedLines: number;
  removedLines: number;
  changedSections: number;
}
