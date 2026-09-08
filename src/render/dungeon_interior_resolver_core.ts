import { arenaOriginAt, instanceOrigin } from '../sim/data';
import { INTERIOR_LAYOUTS } from '../sim/dungeon_floor';
import {
  arenaMapForSlot,
  CRYPT_LAYOUT,
  DAWNHOLD_LAYOUT,
  type DungeonLayout,
  IGNIVAR_FORGE_APPROACH_LAYOUT,
  IGNIVAR_LAYOUT,
  LASTKEEP_LAYOUT,
  NYTHRAXIS_LAYOUT,
  SANCTUM_LAYOUT,
  TEMPLE_LAYOUT,
} from '../sim/dungeon_layout';
import type { DungeonInteriorVariant } from './dungeon';
import { isFreeholdInterior } from './dungeon_variant_core';
import { isIgnivarInterior } from './ignivar_tile_kit';

const NAMED_LAYOUTS: Readonly<Record<string, DungeonLayout>> = {
  sanctum: SANCTUM_LAYOUT,
  temple: TEMPLE_LAYOUT,
  nythraxis: NYTHRAXIS_LAYOUT,
  lastkeep: LASTKEEP_LAYOUT,
  dawnhold: DAWNHOLD_LAYOUT,
  ignivar_approach: IGNIVAR_FORGE_APPROACH_LAYOUT,
  ignivar: IGNIVAR_LAYOUT,
};

/** Overrides are authored module layouts; arena parity shares the collision selector. */
export function resolveDungeonInteriorLayout(
  interior: string,
  oz: number,
  override?: DungeonLayout,
): DungeonLayout {
  if (override) return override;
  if (interior === 'arena') return arenaMapForSlot(arenaOriginAt(oz).slot).layout;
  return NAMED_LAYOUTS[interior] ?? INTERIOR_LAYOUTS[interior] ?? CRYPT_LAYOUT;
}

export function resolveDungeonInteriorVariant(
  interior: string,
  ox: number,
  oz: number,
): DungeonInteriorVariant {
  if (interior === 'arena') {
    return arenaMapForSlot(arenaOriginAt(oz).slot).id === 'drowned_court'
      ? 'arena_drowned'
      : 'arena';
  }
  if (isFreeholdInterior(interior)) return interior;
  if (isIgnivarInterior(interior)) return 'ignivar';
  if (
    interior === 'nythraxis' ||
    interior === 'sanctum' ||
    interior === 'temple' ||
    interior === 'lastkeep' ||
    interior === 'dawnhold'
  )
    return interior;
  return Math.abs(ox - instanceOrigin(1, 0).x) < 250 ? 'bastion' : 'crypt';
}
