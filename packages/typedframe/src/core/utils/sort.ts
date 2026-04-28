import type { Id } from '../types/id';
import type { Rank } from '../types/rank';
import { compareRank } from '../types/rank';

export type SortableItem<T extends string, V = unknown> = {
  id: Id<T>;
  rank: Rank;
  value: V;
};

export function sortItems<T extends string, V>(
  items: SortableItem<T, V>[],
): SortableItem<T, V>[] {
  return [...items].sort((a, b) => compareRank(a.rank, b.rank));
}
