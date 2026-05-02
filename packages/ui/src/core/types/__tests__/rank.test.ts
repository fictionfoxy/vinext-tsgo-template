import { describe, expect, it } from 'vitest';
import { compareRank } from '../rank';

describe('compareRank', () => {
  it('returns negative when a < b', () => {
    expect(compareRank(10, 20)).toBeLessThan(0);
  });

  it('returns positive when a > b', () => {
    expect(compareRank(20, 10)).toBeGreaterThan(0);
  });

  it('returns zero when a === b', () => {
    expect(compareRank(10, 10)).toBe(0);
  });
});
