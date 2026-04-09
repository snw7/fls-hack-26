import { describe, expect, it } from 'vitest';
import { createLineDiff, summarizeDiff } from './diff';

describe('createLineDiff', () => {
  it('detects additions and removals', () => {
    const blocks = createLineDiff(
      '# Draft\n\n## Goal\n\nOld line\n',
      '# Draft\n\n## Goal\n\nNew line\n'
    );

    expect(blocks.some((block) => block.type === 'removed')).toBe(true);
    expect(blocks.some((block) => block.type === 'added')).toBe(true);
  });

  it('summarizes changed sections', () => {
    const stats = summarizeDiff(
      createLineDiff('Alpha\nBeta\n', 'Alpha\nGamma\nDelta\n')
    );

    expect(stats.addedLines).toBeGreaterThan(0);
    expect(stats.removedLines).toBeGreaterThan(0);
    expect(stats.changedSections).toBeGreaterThan(0);
  });
});

