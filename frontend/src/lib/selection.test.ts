import { describe, expect, it } from 'vitest';
import { buildSelectionContext } from './selection';

describe('buildSelectionContext', () => {
  it('returns the exact match when the selection exists verbatim', () => {
    const result = buildSelectionContext(
      '# Requirement Brief\n\n## Goal\nReduce manual requirement intake.\n',
      'Reduce manual requirement intake.'
    );

    expect(result.matchedText).toBe('Reduce manual requirement intake.');
    expect(result.contextBefore).toContain('## Goal');
  });

  it('resolves selections across markdown list markers', () => {
    const result = buildSelectionContext(
      '## Users\n- End customers\n- Internal staff\n',
      'End customers\nInternal staff'
    );

    expect(result.matchedText).toBe('End customers\n- Internal staff');
    expect(result.contextBefore).toContain('## Users\n- ');
  });
});
