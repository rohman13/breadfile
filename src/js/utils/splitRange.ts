export interface SplitGroup {
  start: number;
  end: number;
  pages: number[];
}

/**
 * Convert one-based "cut after page" markers into complete, non-overlapping
 * page groups. A cut on the final page is ignored because the document already
 * ends there. Every source page appears in exactly one group.
 */
export function resolveScissorGroups(cutAfterPages: readonly number[], totalPages: number): SplitGroup[] {
  if (!Number.isInteger(totalPages) || totalPages < 1) return [];

  const cuts = [...new Set(cutAfterPages)]
    .filter((page) => Number.isInteger(page) && page >= 1 && page < totalPages)
    .sort((a, b) => a - b);

  const groups: SplitGroup[] = [];
  let start = 1;
  for (const end of [...cuts, totalPages]) {
    groups.push({
      start,
      end,
      pages: Array.from({ length: end - start + 1 }, (_, index) => start + index),
    });
    start = end + 1;
  }
  return groups;
}
