import type { SortableItem } from '../core/utils/sort';

/**
 * Given the current ordered list and the drag result (active id moved to over id),
 * returns a new array with updated ranks so the moved item sits between its neighbours.
 */
export function reorderItems<T extends string, V>(
  items: SortableItem<T, V>[],
  activeId: string,
  overId: string,
): SortableItem<T, V>[] {
  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return items;
  }

  const reordered = [...items];
  const [moved] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, moved);

  // Reassign ranks as evenly spaced integers so the order is stable and serialisable.
  return reordered.map((item, index) => ({
    ...item,
    rank: (index + 1) * 10,
  }));
}
