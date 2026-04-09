import type { SessionState } from '../types';

export const STORAGE_KEY = 'fi-requirements-workbench:v1';

function isSessionState(value: unknown): value is SessionState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SessionState>;

  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.sessionId === 'string' &&
    Array.isArray(candidate.chatHistory) &&
    Array.isArray(candidate.revisions) &&
    Array.isArray(candidate.pendingComments)
  );
}

export function loadState(): SessionState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isSessionState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveState(state: SessionState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

