export interface SelectionContext {
  contextBefore: string;
  contextAfter: string;
}

export function buildSelectionContext(
  markdown: string,
  selectedText: string,
  windowSize = 56
): SelectionContext {
  const index = markdown.indexOf(selectedText);

  if (index === -1) {
    return {
      contextBefore: '',
      contextAfter: '',
    };
  }

  const start = Math.max(0, index - windowSize);
  const end = Math.min(markdown.length, index + selectedText.length + windowSize);

  return {
    contextBefore: markdown.slice(start, index),
    contextAfter: markdown.slice(index + selectedText.length, end),
  };
}

