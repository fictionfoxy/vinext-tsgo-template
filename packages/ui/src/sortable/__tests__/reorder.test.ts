import { describe, expect, it } from 'vitest';
import { createId } from '../../core/types/id';
import { reorderItems } from '../reorder';

function makeItems() {
  return [
    { id: createId<'Task'>('a'), rank: 10, value: 'A' },
    { id: createId<'Task'>('b'), rank: 20, value: 'B' },
    { id: createId<'Task'>('c'), rank: 30, value: 'C' },
  ];
}

describe('reorderItems', () => {
  it('moves an item to a new position and reassigns ranks', () => {
    const result = reorderItems(makeItems(), 'a', 'c');
    expect(result.map((i) => i.value)).toEqual(['B', 'C', 'A']);
    expect(result.map((i) => i.rank)).toEqual([10, 20, 30]);
  });

  it('returns the same array when active === over', () => {
    const items = makeItems();
    const result = reorderItems(items, 'a', 'a');
    expect(result).toBe(items);
  });

  it('returns the same array when activeId is not found', () => {
    const items = makeItems();
    const result = reorderItems(items, 'x', 'b');
    expect(result).toBe(items);
  });

  it('does not mutate the original array', () => {
    const items = makeItems();
    const originalFirst = items[0].id;
    reorderItems(items, 'a', 'c');
    expect(items[0].id).toBe(originalFirst);
  });

  it('preserves all item values after reorder', () => {
    const result = reorderItems(makeItems(), 'c', 'a');
    expect(result.map((i) => i.value)).toEqual(['C', 'A', 'B']);
  });
});
