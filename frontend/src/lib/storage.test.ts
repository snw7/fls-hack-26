import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from './session';
import { clearState, loadState, saveState, STORAGE_KEY } from './storage';

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and restores session state', () => {
    const state = createInitialState('business-requirements-v1');

    saveState(state);

    expect(loadState()).toEqual(state);
  });

  it('ignores invalid stored payloads', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"broken":true}');

    expect(loadState()).toBeNull();
  });

  it('clears stored session state', () => {
    saveState(createInitialState('business-requirements-v1'));
    clearState();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

