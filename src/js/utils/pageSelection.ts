export type PageSelectionResult = number[] | { error: string };

/** Parses user-facing one-based page numbers into sorted zero-based indices. */
export function normalizePageSelection(input: string, totalPages: number): PageSelectionResult {
  const tokens = input.split(',').map(token => token.trim()).filter(Boolean);
  const invalid: string[] = [];
  const indices = new Set<number>();

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page >= 1 && page <= totalPages) indices.add(page - 1);
      else invalid.push(token);
      continue;
    }

    const match = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) {
      invalid.push(token);
      continue;
    }

    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < 1 || end > totalPages || start > end) {
      invalid.push(token);
      continue;
    }

    for (let page = start; page <= end; page += 1) indices.add(page - 1);
  }

  if (invalid.length > 0) return { error: `Check these page entries: ${invalid.join(', ')}` };
  return Array.from(indices).sort((a, b) => a - b);
}
