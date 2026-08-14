import { describe, expect, it } from 'vitest';
import { resolveScissorGroups } from '../js/utils/splitRange';

describe('resolveScissorGroups', () => {
  it('splits after one selected page', () => {
    expect(resolveScissorGroups([4], 10)).toEqual([
      { start: 1, end: 4, pages: [1, 2, 3, 4] },
      { start: 5, end: 10, pages: [5, 6, 7, 8, 9, 10] },
    ]);
  });

  it('creates complete non-overlapping groups for multiple cuts', () => {
    expect(resolveScissorGroups([1, 4, 6], 10)).toEqual([
      { start: 1, end: 1, pages: [1] },
      { start: 2, end: 4, pages: [2, 3, 4] },
      { start: 5, end: 6, pages: [5, 6] },
      { start: 7, end: 10, pages: [7, 8, 9, 10] },
    ]);
  });

  it('sorts and de-duplicates cut markers', () => {
    expect(resolveScissorGroups([6, 1, 4, 4], 10).map(({ start, end }) => [start, end])).toEqual([
      [1, 1], [2, 4], [5, 6], [7, 10],
    ]);
  });

  it('ignores invalid and final-page cuts while preserving every page once', () => {
    const groups = resolveScissorGroups([0, 10, 11], 10);
    expect(groups).toEqual([{ start: 1, end: 10, pages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }]);
    expect(groups.flatMap((group) => group.pages)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
