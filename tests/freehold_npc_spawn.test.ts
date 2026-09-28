import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  colliderInternalsForTest,
  resolvePosition,
  streetlampPlacements,
} from '../src/sim/colliders';
import { BUILTIN_WORLD, NPCS, setActiveWorldContent } from '../src/sim/data';
import { shouldSpawnSurfaceNpc } from '../src/sim/freehold';
import { npcRoleFor, vendorRoleForStock } from '../src/sim/npc_role';
import { Sim } from '../src/sim/sim';
import { generateDecorations, groundHeight, roadDistance, waterLevel } from '../src/sim/world';
import { WORLD_SEED } from '../src/sim/world_seed';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

afterEach(() => setActiveWorldContent(null));

describe('freehold surface NPC admission', () => {
  it.each([false, true])('keeps ordinary and dynamic NPC rules with flag %s', (enabled) => {
    expect(shouldSpawnSurfaceNpc({ id: 'trader_wilkes' }, enabled)).toBe(true);
    expect(shouldSpawnSurfaceNpc({ id: 'trader_wilkes', dynamic: true }, enabled)).toBe(false);
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher', dynamic: true }, enabled)).toBe(false);
  });

  it('admits the furnisher only on a lit host and does not broaden to similar ids', () => {
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher' }, false)).toBe(false);
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher' }, true)).toBe(true);
    expect(shouldSpawnSurfaceNpc({ id: 'freehold_furnisher_other' }, false)).toBe(true);
  });
});

describe('authored furnisher construction and world geometry', () => {
  const stock = [
    'freehold_timber_bed',
    'freehold_round_table',
    'freehold_spindle_chair',
    'freehold_low_stool',
    'freehold_woven_rug',
    'freehold_brass_lantern',
    'freehold_storage_chest',
    'freehold_open_bookshelf',
  ];

  it('the dark constructor preserves the pre-furnisher entity and rng fingerprint', () => {
    // Independently measured from incoming dependency 54ce808436, which adds
    // Riftwright Maelis and the reserved-ID Realm Builder monument and moves
    // Drakelands geometry. The dark merged world must match that baseline.
    // This also detects decoration vetoes moving an existing spawn.
    // RE-MEASURED at the release/v0.42.0 OSSBrain merge (tip 553a5672ed): the
    // Eastbrook hub practice trio (Drillmaster Hale and the two training
    // dummies, content/practice_dummies.ts) spawns three more world entities
    // after the player, so nextId and entityCount move by exactly three and
    // the position digest follows; primaryId, the merchant and banker ids and
    // the rng cursor are unchanged, which is what proves nothing else moved.
    // Release 57a2ced3bd adds reserved-id Crucible Quartermaster Bronn. At that
    // landing, removing only that row reproduced the previous position digest.
    // RE-MEASURED at the release/v0.44.0 sync (tip 56525e0343): the release's own
    // tree measures this exact fingerprint (1031 entities, the same position
    // digest and rng cursor), measured on both trees, so the dark merged world
    // adds nothing of its own; the six new entities and the moved positions are
    // the release's. The Bronn-excluded digest below is re-measured on that same
    // merged world, so it no longer names the pre-Bronn release.
    // RE-MEASURED at the release/v0.44.0 sync at 09639d4ae9: the release tip's
    // own tree measures this exact fingerprint (1032 entities, both digests,
    // the same nextId and rng cursor), so the dark merged world still adds
    // nothing; the one new entity is the release's.
    // RE-MEASURED at the release/v0.44.0 sync at aaff789813: the release tip's
    // own tree measures this exact fingerprint (1053 entities, both digests,
    // the same nextId and rng cursor), so the dark merged world still adds
    // nothing; the 21 new entities (four of them before the player) are the release's.
    // RE-MEASURED at the release/v0.45.0 sync at ac9ed4db24: the release tip's
    // own tree measures this exact fingerprint (1058 entities, both digests,
    // the same nextId and rng cursor), so the dark merged world still adds
    // nothing; the five new entities are the release's.
    const sim = new Sim({ seed: 1, playerClass: 'warrior' });
    expect({
      nextId: sim.nextId,
      primaryId: sim.primaryId,
      merchants: sim.market.merchantIds,
      bankers: sim.bankerIds,
      entityCount: sim.entities.size,
      positionHash: digest(
        [...sim.entities.values()].map((e) => ({
          id: e.id,
          templateId: e.templateId,
          pos: e.pos,
          facing: e.facing,
          hp: e.hp,
        })),
      ),
      rngNext: sim.rng.next(),
    }).toEqual({
      nextId: 1011,
      primaryId: 1003,
      merchants: [1, 33],
      bankers: [9, 22, 34, 95],
      entityCount: 1058,
      positionHash: '449e14b532ef7dd6577e5d6ff13f3a1c6b343753c02666dbf9c6414ed135bafd',
      rngNext: 0.30275995447300375,
    });
    expect(sim.entities.get(1000000003)?.templateId).toBe('crucible_quartermaster');
    expect(
      digest(
        [...sim.entities.values()]
          .filter((e) => e.id !== 1000000003)
          .map((e) => ({
            id: e.id,
            templateId: e.templateId,
            pos: e.pos,
            facing: e.facing,
            hp: e.hp,
          })),
      ),
    ).toBe('7a19f37f9d509edbc35dfa772d77f8f16d5966eb271ad5feb121c05f430c028a');
    expect([...sim.entities.values()].some((e) => e.templateId === 'freehold_furnisher')).toBe(
      false,
    );
    expect(
      [...sim.entities.values()].flatMap((e) => e.vendorItems).some((id) => stock.includes(id)),
    ).toBe(false);
  });

  it('the lit constructor adds exactly one furnisher with the complete isolated stock', () => {
    const first = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', freeholdsEnabled: true });
    const second = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', freeholdsEnabled: true });
    const vendors = [...first.entities.values()].filter(
      (e) => e.templateId === 'freehold_furnisher',
    );
    expect(vendors).toHaveLength(1);
    expect(vendors[0].vendorItems).toEqual(stock);
    expect(vendors[0].pos).toEqual(first.groundPos(-66, -96));
    expect(
      [...first.entities.values()].filter((e) => e.vendorItems.some((id) => stock.includes(id))),
    ).toEqual(vendors);
    expect(digest([...first.entities.values()])).toBe(digest([...second.entities.values()]));
    expect(first.rng.next()).toBe(second.rng.next());
  });

  it('the civic-green site is dry, walkable, clear of colliders, roads and other NPCs', () => {
    const { pos } = NPCS.freehold_furnisher;
    expect(pos).toEqual({ x: -66, z: -96 });
    const height = groundHeight(pos.x, pos.z, WORLD_SEED);
    expect(height - waterLevel()).toBeGreaterThan(1);
    expect(roadDistance(pos.x, pos.z)).toBeGreaterThan(3);
    expect(roadDistance(pos.x, pos.z)).toBeLessThan(15);
    for (const r of [0.6, 1, 2, 3]) {
      expect(resolvePosition(WORLD_SEED, pos.x, pos.z, r, false)).toEqual(pos);
    }
    for (const [dx, dz] of [
      [0.6, 0],
      [-0.6, 0],
      [0, 0.6],
      [0, -0.6],
    ]) {
      expect(Math.abs(groundHeight(pos.x + dx, pos.z + dz, WORLD_SEED) - height)).toBeLessThan(
        0.05,
      );
    }
    // Release 77fd08ab72 moved Apothecary Lin (6 yd) and Marshal Redbrook (10 yd)
    // onto the civic square stands, so the nearest neighbour was Cook Marlow
    // (23.676 yd); since the aaff789813 sync it is the release's weekly emissary,
    // 18.4 yd off, far outside interaction range.
    const neighbors = Object.values(NPCS)
      .filter((npc) => npc.id !== 'freehold_furnisher')
      .map((npc) => ({ id: npc.id, d: Math.hypot(npc.pos.x - pos.x, npc.pos.z - pos.z) }))
      .sort((a, b) => a.d - b.d);
    expect(neighbors[0].id).toBe('weekly_emissary');
    expect(neighbors[0].d).toBeCloseTo(18.439, 3);
    expect(neighbors[1].id).toBe('cook_marlow');
    expect(neighbors[1].d).toBeCloseTo(23.676, 3);
  });

  it('adding the authored NPC does not alter static colliders, lamp sites or decoration output', () => {
    const geometry = () => ({
      colliders: digest(colliderInternalsForTest.staticWorldColliders(WORLD_SEED)),
      lamps: digest(streetlampPlacements(WORLD_SEED)),
      decorations: digest(generateDecorations(WORLD_SEED)),
    });
    // Both inputs use a custom bundle so builtin-only fixture admission does
    // not become an unrelated difference when removing the one NPC row.
    setActiveWorldContent({ ...BUILTIN_WORLD });
    const authored = geometry();
    const npcs = { ...NPCS };
    delete npcs.freehold_furnisher;
    setActiveWorldContent({ ...BUILTIN_WORLD, npcs });
    expect(geometry()).toEqual(authored);
  });

  it('records that the golden parity scenarios cover the default dark arm, with ONE lit build', () => {
    const source = readFileSync(new URL('./parity/scenarios.ts', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(source.match(/new\s+Sim\s*\(/g)?.length).toBeGreaterThan(50);
    // Every other scenario boots dark; freehold_claim is the ONE lit build, and its literal sits inside that scenario object.
    const start = source.indexOf("name: 'freehold_claim'");
    expect(start).toBeGreaterThanOrEqual(0);
    const nextName = source.indexOf("name: '", start + 1);
    const end = nextName === -1 ? source.length : nextName;
    expect(source.slice(start, end).match(/\bfreeholdsEnabled: true\b/g)).toHaveLength(1);
    expect(source.slice(0, start) + source.slice(end)).not.toMatch(/\bfreeholdsEnabled\b/);
  });
});

describe('the furnisher nameplate role line', () => {
  it('names no functional role, so the plate keeps the authored Household Goods title', () => {
    expect(NPCS.freehold_furnisher.title).toBe('Household Goods');
    expect(npcRoleFor(NPCS.freehold_furnisher)).toBeNull();
    expect(vendorRoleForStock(['freehold_timber_bed'])).toBeNull();
    // Control: furnishing stock beside real wares leaves the wares' role intact.
    expect(vendorRoleForStock(['freehold_timber_bed', 'tough_jerky'])).toBe('foodVendor');
    expect(vendorRoleForStock(['smithing_flux'])).toBe('generalGoods');
  });
});
