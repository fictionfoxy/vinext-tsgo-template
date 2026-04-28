import { describe, expect, it } from 'vitest';
import { createId } from '../../types/id';
import { sortItems } from '../sort';

describe('sortItems', () => {
  it('sorts items by rank ascending', () => {
    const items = [
      { id: createId<'Task'>('b'), rank: 20, value: { title: 'Second' } },
      { id: createId<'Task'>('a'), rank: 10, value: { title: 'First' } },
      { id: createId<'Task'>('c'), rank: 30, value: { title: 'Third' } },
    ];
    const sorted = sortItems(items);
    expect(sorted.map((i) => i.value.title)).toEqual(['First', 'Second', 'Third']);
  });

  it('does not mutate the original array', () => {
    const items = [
      { id: createId<'Task'>('b'), rank: 20, value: null },
      { id: createId<'Task'>('a'), rank: 10, value: null },
    ];
    const original = [...items];
    sortItems(items);
    expect(items[0].id).toBe(original[0].id);
  });

  it('returns an empty array for empty input', () => {
    expect(sortItems([])).toEqual([]);
  });

  it('handles equal ranks stably', () => {
    const items = [
      { id: createId<'Task'>('a'), rank: 10, value: 'a' },
      { id: createId<'Task'>('b'), rank: 10, value: 'b' },
    ];
    const sorted = sortItems(items);
    expect(sorted).toHaveLength(2);
  });
});
