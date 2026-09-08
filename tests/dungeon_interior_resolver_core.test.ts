import { describe, expect, it } from 'vitest';
import { hangsKitBanners } from '../src/render/dungeon_banner_core';
import {
  resolveDungeonInteriorLayout,
  resolveDungeonInteriorVariant,
} from '../src/render/dungeon_interior_resolver_core';
import {
  dungeonFloorKind,
  dungeonFloorQuadKind,
  dungeonWallKind,
} from '../src/render/dungeon_tile_kind_core';
import { isFreeholdInterior } from '../src/render/dungeon_variant_core';
import { arenaOrigin, instanceOrigin } from '../src/sim/data';
import { INTERIOR_LAYOUTS } from '../src/sim/dungeon_floor';
import { arenaMapForSlot, CRYPT_LAYOUT } from '../src/sim/dungeon_layout';

describe('shared dungeon interior resolution', () => {
  it.each(['inn_room', 'cottage'] as const)(
    'routes %s at overflow origins without dungeon dressing',
    (home) => {
      expect(isFreeholdInterior(home)).toBe(true);
      expect(resolveDungeonInteriorLayout(home, 0)).toBe(INTERIOR_LAYOUTS[home]);
      expect(resolveDungeonInteriorLayout(home, 0).rooms?.length).toBeGreaterThan(0);
      expect(resolveDungeonInteriorVariant(home, 119200, 0)).toBe(home);
      expect(hangsKitBanners(home)).toBe(false);
      for (const t of [0, 0.3, 0.75, 0.999]) {
        expect(dungeonFloorKind(home, t, false)).toBe(dungeonFloorKind('dawnhold', t, false));
        expect(dungeonWallKind(home, t, false)).toBe(dungeonWallKind('dawnhold', t, false));
        expect(dungeonFloorQuadKind(home, t)).toBe('floor_tile_small');
      }
    },
  );

  it('retains overrides, unknown fallback, bastion bands and arena parity', () => {
    expect(resolveDungeonInteriorLayout('inn_room', 0, CRYPT_LAYOUT)).toBe(CRYPT_LAYOUT);
    expect(resolveDungeonInteriorLayout('unknown', 0)).toBe(CRYPT_LAYOUT);
    expect(resolveDungeonInteriorVariant('crypt', instanceOrigin(1, 0).x, 0)).toBe('bastion');
    expect(resolveDungeonInteriorVariant('crypt', 119200, 0)).toBe('crypt');
    for (const slot of [0, 1]) {
      const { z } = arenaOrigin(slot);
      const map = arenaMapForSlot(slot);
      expect(resolveDungeonInteriorLayout('arena', z)).toBe(map.layout);
      expect(resolveDungeonInteriorVariant('arena', 0, z)).toBe(
        map.id === 'drowned_court' ? 'arena_drowned' : 'arena',
      );
    }
  });
});
