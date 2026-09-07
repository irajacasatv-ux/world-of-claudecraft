import type { ItemKind } from './types';

/** Kind admission only. Each storage or transfer pipe keeps its own copy locks. */
export function isStorableItemKind(kind: ItemKind): boolean {
  if (kind === 'furnishing') return true;
  return kind !== 'quest';
}
