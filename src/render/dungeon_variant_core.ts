import type { DungeonInteriorVariant } from './dungeon';

/** Homes share the bright castle shell without its flame or banner dressing. */
export function isFreeholdInterior(interior: string): interior is 'inn_room' | 'cottage' {
  return interior === 'inn_room' || interior === 'cottage';
}

export function usesDawnholdGrammar(variant: DungeonInteriorVariant): boolean {
  return variant === 'dawnhold' || isFreeholdInterior(variant);
}
