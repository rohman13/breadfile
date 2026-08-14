export interface ScissorRange {
  start: number;
  end: number;
  pages: number[];
}

/**
 * Resolve one or two one-based scissor endpoints into an inclusive page range.
 * One endpoint uses page 1 as the implicit start. Two endpoints are order-independent.
 */
export function resolveScissorRange(endpoints: readonly number[], totalPages: number): ScissorRange | null {
  const valid = endpoints
    .filter((page) => Number.isInteger(page) && page >= 1 && page <= totalPages)
    .slice(0, 2);
  if (valid.length === 0) return null;

  const start = valid.length === 1 ? 1 : Math.min(valid[0], valid[1]);
  const end = valid.length === 1 ? valid[0] : Math.max(valid[0], valid[1]);
  return {
    start,
    end,
    pages: Array.from({ length: end - start + 1 }, (_, index) => start + index),
  };
}
