export interface SelectionContext {
  matchedText: string;
  contextBefore: string;
  contextAfter: string;
}

function normalizeForMatch(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildNormalizedIndex(markdown: string): {
  normalized: string;
  rawIndexByNormalizedIndex: number[];
} {
  const normalizedChars: string[] = [];
  const rawIndexByNormalizedIndex: number[] = [];
  let pendingSpaceIndex: number | null = null;
  let atLineStart = true;

  for (let index = 0; index < markdown.length; index += 1) {
    const character = markdown[index];

    if (atLineStart) {
      if (character === ' ' || character === '\t') {
        continue;
      }

      if (character === '>') {
        const nextCharacter = markdown[index + 1];
        if (nextCharacter === ' ') {
          index += 1;
          continue;
        }
      }

      if (character === '#' ) {
        let markerEnd = index;
        while (markdown[markerEnd] === '#') {
          markerEnd += 1;
        }
        if (markdown[markerEnd] === ' ') {
          index = markerEnd;
          continue;
        }
      }

      if (
        (character === '-' || character === '*' || character === '+') &&
        markdown[index + 1] === ' '
      ) {
        index += 1;
        continue;
      }

      if (/\d/.test(character)) {
        let markerEnd = index;
        while (/\d/.test(markdown[markerEnd] ?? '')) {
          markerEnd += 1;
        }
        if (markdown[markerEnd] === '.' && markdown[markerEnd + 1] === ' ') {
          index = markerEnd + 1;
          continue;
        }
      }

      atLineStart = false;
    }

    if (/\s/.test(character)) {
      if (normalizedChars.length > 0 && pendingSpaceIndex === null) {
        pendingSpaceIndex = index;
      }
      if (character === '\n') {
        atLineStart = true;
      }
      continue;
    }

    if (pendingSpaceIndex !== null) {
      normalizedChars.push(' ');
      rawIndexByNormalizedIndex.push(pendingSpaceIndex);
      pendingSpaceIndex = null;
    }

    normalizedChars.push(character);
    rawIndexByNormalizedIndex.push(index);
  }

  return {
    normalized: normalizedChars.join(''),
    rawIndexByNormalizedIndex,
  };
}

export function buildSelectionContext(
  markdown: string,
  selectedText: string,
  windowSize = 56
): SelectionContext {
  const exactIndex = markdown.indexOf(selectedText);

  if (exactIndex !== -1) {
    const start = Math.max(0, exactIndex - windowSize);
    const end = Math.min(markdown.length, exactIndex + selectedText.length + windowSize);

    return {
      matchedText: selectedText,
      contextBefore: markdown.slice(start, exactIndex),
      contextAfter: markdown.slice(exactIndex + selectedText.length, end),
    };
  }

  const normalizedSelectedText = normalizeForMatch(selectedText);
  if (!normalizedSelectedText) {
    return {
      matchedText: selectedText,
      contextBefore: '',
      contextAfter: '',
    };
  }

  const { normalized, rawIndexByNormalizedIndex } = buildNormalizedIndex(markdown);
  const candidateIndices: number[] = [];
  let searchFrom = 0;

  while (searchFrom < normalized.length) {
    const matchIndex = normalized.indexOf(normalizedSelectedText, searchFrom);
    if (matchIndex === -1) {
      break;
    }
    candidateIndices.push(matchIndex);
    searchFrom = matchIndex + 1;
  }

  if (candidateIndices.length !== 1) {
    return {
      matchedText: selectedText,
      contextBefore: '',
      contextAfter: '',
    };
  }

  const normalizedStart = candidateIndices[0];
  const normalizedEnd = normalizedStart + normalizedSelectedText.length - 1;
  const rawStart = rawIndexByNormalizedIndex[normalizedStart];
  const rawEnd = rawIndexByNormalizedIndex[normalizedEnd] + 1;
  const matchedText = markdown.slice(rawStart, rawEnd);
  const start = Math.max(0, rawStart - windowSize);
  const end = Math.min(markdown.length, rawEnd + windowSize);

  return {
    matchedText,
    contextBefore: markdown.slice(start, rawStart),
    contextAfter: markdown.slice(rawEnd, end),
  };
}
