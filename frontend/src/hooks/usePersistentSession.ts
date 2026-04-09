import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { SessionState } from '../types';
import { createInitialState } from '../lib/session';
import { loadState, saveState } from '../lib/storage';

export function usePersistentSession(templateId: string): {
  state: SessionState;
  setState: Dispatch<SetStateAction<SessionState>>;
  reset: () => void;
} {
  const [state, setState] = useState<SessionState>(
    () => loadState() ?? createInitialState(templateId)
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  function reset() {
    setState(createInitialState(templateId));
  }

  return {
    state,
    setState,
    reset,
  };
}
