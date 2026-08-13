import { describe, expect, it } from 'vitest';
import { normalizePageSelection } from '../js/utils/pageSelection';

describe('normalizePageSelection', () => {
  it('returns sorted unique zero-based indices for valid pages', () => {
    expect(normalizePageSelection('4, 2-3, 2', 6)).toEqual([1, 2, 3]);
  });

  it('reports invalid tokens instead of silently ignoring them', () => {
    expect(normalizePageSelection('1, nope, 9', 4)).toEqual({
      error: 'Check these page entries: nope, 9',
    });
  });

  it('rejects malformed ranges', () => {
    expect(normalizePageSelection('3-1', 4)).toEqual({
      error: 'Check these page entries: 3-1',
    });
  });
});
