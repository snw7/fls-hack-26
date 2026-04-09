import type { DiffBlock, DiffStats } from '../types';

function normalizeLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n');
}

export function createLineDiff(oldText: string, newText: string): DiffBlock[] {
  const oldLines = normalizeLines(oldText);
  const newLines = normalizeLines(newText);
  const dp = Array.from({ length: oldLines.length + 1 }, () =>
    Array<number>(newLines.length + 1).fill(0)
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      if (oldLines[oldIndex] === newLines[newIndex]) {
        dp[oldIndex][newIndex] = dp[oldIndex + 1][newIndex + 1] + 1;
      } else {
        dp[oldIndex][newIndex] = Math.max(
          dp[oldIndex + 1][newIndex],
          dp[oldIndex][newIndex + 1]
        );
      }
    }
  }

  const items: Array<{ type: DiffBlock['type']; line: string }> = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      items.push({ type: 'unchanged', line: oldLines[oldIndex] });
      oldIndex += 1;
      newIndex += 1;
    } else if (dp[oldIndex + 1][newIndex] >= dp[oldIndex][newIndex + 1]) {
      items.push({ type: 'removed', line: oldLines[oldIndex] });
      oldIndex += 1;
    } else {
      items.push({ type: 'added', line: newLines[newIndex] });
      newIndex += 1;
    }
  }

  while (oldIndex < oldLines.length) {
    items.push({ type: 'removed', line: oldLines[oldIndex] });
    oldIndex += 1;
  }

  while (newIndex < newLines.length) {
    items.push({ type: 'added', line: newLines[newIndex] });
    newIndex += 1;
  }

  const blocks: DiffBlock[] = [];

  for (const item of items) {
    const lastBlock = blocks.at(-1);

    if (lastBlock && lastBlock.type === item.type) {
      lastBlock.lines.push(item.line);
      continue;
    }

    blocks.push({
      id: `${item.type}-${blocks.length}`,
      type: item.type,
      lines: [item.line],
    });
  }

  return blocks;
}

export function summarizeDiff(blocks: DiffBlock[]): DiffStats {
  return blocks.reduce<DiffStats>(
    (stats, block) => {
      if (block.type === 'added') {
        return {
          addedLines: stats.addedLines + block.lines.length,
          removedLines: stats.removedLines,
          changedSections: stats.changedSections + 1,
        };
      }

      if (block.type === 'removed') {
        return {
          addedLines: stats.addedLines,
          removedLines: stats.removedLines + block.lines.length,
          changedSections: stats.changedSections + 1,
        };
      }

      return stats;
    },
    {
      addedLines: 0,
      removedLines: 0,
      changedSections: 0,
    }
  );
}

