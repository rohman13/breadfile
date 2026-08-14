import { describe, expect, it } from 'vitest';
import { resolveScissorRange } from '../js/utils/splitRange';

describe('resolveScissorRange', () => {
  it('uses page 1 as the implicit start for one scissor', () => {
    expect(resolveScissorRange([3], 10)).toEqual({ start: 1, end: 3, pages: [1, 2, 3] });
  });

  it('uses two scissors as inclusive range endpoints', () => {
    expect(resolveScissorRange([5, 9], 12)).toEqual({
      start: 5,
      end: 9,
      pages: [5, 6, 7, 8, 9],
    });
  });

  it('accepts endpoints in either click order', () => {
    expect(resolveScissorRange([9, 5], 12)).toEqual({
      start: 5,
      end: 9,
      pages: [5, 6, 7, 8, 9],
    });
  });

  it('ignores invalid endpoints and returns no range without a valid click', () => {
    expect(resolveScissorRange([0, 13], 12)).toBeNull();
    expect(resolveScissorRange([], 12)).toBeNull();
  });
});
