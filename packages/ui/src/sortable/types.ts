import type React from 'react';
import type { SortableItem } from '../core/utils/sort';

export type { SortableItem };

export type SortableListProps<T extends string, V> = {
  items: SortableItem<T, V>[];
  onReorder: (nextItems: SortableItem<T, V>[]) => void;
  renderItem: (item: SortableItem<T, V>) => React.ReactNode;
};
