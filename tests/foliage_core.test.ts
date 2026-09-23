import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FREEHOLD_GATE_STANCE } from '../scripts/freehold_interior_route.mjs';
import { buildStaticDoorBody } from '../src/render/door_portal';
import {
  type EastbrookGrassExclusion,
  eastbrookGrassExclusions,
  FREEHOLD_GATE_GRASS_RADIUS,
  grassExclusionTestNear,
  insideDressingExclusion,
  insideEastbrookGrassExclusion,
  insideGrassHubExclusion,
} from '../src/render/foliage_core';
import { BUILTIN_WORLD, PROPS } from '../src/sim/data';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import {
  EASTBROOK_NOTICEBOARD_ASSET_ID,
  EASTBROOK_NOTICEBOARD_INTERACTION_RADIUS,
  EASTBROOK_NOTICEBOARD_NATIVE_DIMENSIONS,
  EASTBROOK_NOTICEBOARD_TEMPLATE_ID,
  type NoticeboardDef,
} from '../src/sim/types';
import { doorArchTriangles } from './helpers/door_arch_glb';

const PADDING = 0.35;
const BOUNDARY_EPSILON = 0.01;
const BUILTIN_NOTICEBOARDS = BUILTIN_WORLD.services?.noticeboards ?? [];

describe('the Freehold Gate grass exclusion', () => {
  const site = BUILTIN_WORLD.services?.freeholdGate;
  const lit = () =>
    eastbrookGrassExclusions(PROPS.buildings, true, BUILTIN_NOTICEBOARDS, site ?? null);

  it('keeps a dark realm grassed where no arch stands, and adds one circle on a lit host', () => {
    const dark = eastbrookGrassExclusions(PROPS.buildings, true, BUILTIN_NOTICEBOARDS);
    expect(dark.some((exclusion) => exclusion.id === 'freehold_gate')).toBe(false);
    expect(site).toEqual({ ...EASTBROOK_LAYOUT.services.freeholdGate.position, facing: 0 });
    expect(lit()).toHaveLength(dark.length + 1);
    expect(lit().find((exclusion) => exclusion.id === 'freehold_gate')).toEqual({
      kind: 'circle',
      id: 'freehold_gate',
      x: site?.x,
      z: site?.z,
      radius: 2.6,
    });
    expect(FREEHOLD_GATE_GRASS_RADIUS).toBe(2.6);
  });

  it('honours a custom world that places its own gate', () => {
    expect(eastbrookGrassExclusions([], false, [], { x: 10, z: 20 })).toEqual([
      { kind: 'circle', id: 'freehold_gate', x: 10, z: 20, radius: FREEHOLD_GATE_GRASS_RADIUS },
    ]);
  });

  it('covers every tuft that could overlap the real arch or its plinths, and not the stance', () => {
    // The arch body the renderer draws (the procedural fallback in Node): the
    // arch and its two plinths stand on the ground. A tuft within PADDING of
    // any of their footprints would poke through, so every such point must be
    // excluded.
    const body = buildStaticDoorBody();
    body.updateMatrixWorld(true);
    const grounded = body.children
      .filter((child): child is THREE.Mesh => (child as THREE.Mesh).isMesh === true)
      .map((mesh) => new THREE.Box3().setFromObject(mesh))
      .filter((box) => box.min.y <= 0.01);
    expect(grounded).toHaveLength(3);
    const arch = lit().filter((exclusion) => exclusion.id === 'freehold_gate');
    for (const box of grounded)
      for (const x of [box.min.x - PADDING, box.max.x + PADDING])
        for (const z of [box.min.z - PADDING, box.max.z + PADDING])
          expect(
            insideEastbrookGrassExclusion(arch, (site?.x ?? 0) + x, (site?.z ?? 0) + z, PADDING),
          ).toBe(true);
    const stance = {
      x: (site?.x ?? 0) + FREEHOLD_GATE_STANCE.dx,
      z: (site?.z ?? 0) + FREEHOLD_GATE_STANCE.dz,
    };
    expect(insideEastbrookGrassExclusion(arch, stance.x, stance.z, PADDING)).toBe(false);
  });

  it('covers every tuft that could overlap the GLB arch the browser draws', async () => {
    // Everything a tuft card could reach up to: every vertex within 1 yd of the
    // ground, as turned by door_portal.ts (measured: x within 1.85, z within
    // 0.56 of the centre).
    const ground = (await doorArchTriangles())
      .flatMap((t) => [t.a, t.b, t.c])
      .filter((p) => p.y < 1);
    expect(ground.length).toBeGreaterThan(100);
    const [minX, maxX] = [Math.min(...ground.map((p) => p.x)), Math.max(...ground.map((p) => p.x))];
    const [minZ, maxZ] = [Math.min(...ground.map((p) => p.z)), Math.max(...ground.map((p) => p.z))];
    const arch = lit().filter((exclusion) => exclusion.id === 'freehold_gate');
    for (const x of [minX - PADDING, maxX + PADDING])
      for (const z of [minZ - PADDING, maxZ + PADDING])
        expect(
          insideEastbrookGrassExclusion(arch, (site?.x ?? 0) + x, (site?.z ?? 0) + z, PADDING),
          `${x},${z}`,
        ).toBe(true);
  });

  it('reaches the grass ring only through the lit host flag', () => {
    const code = (path: string) =>
      readFileSync(path, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
        .replace(/\s+/g, ' ');
    expect(code('src/render/renderer.ts')).toContain(
      'this.foliage = buildFoliage(this.sim.cfg.seed, this.webgl, !!this.sim.cfg.freeholdsEnabled);',
    );
    const foliage = code('src/render/foliage.ts');
    expect(foliage).toContain(': buildGrassRing(group, seed, undefined, freeholdsLit);');
    expect(foliage).toContain(
      'freeholdGateLit ? (activeContent.services?.freeholdGate ?? null) : null,',
    );
  });
});

describe('Eastbrook town grass exclusion', () => {
  it('snapshots every built-in town footprint, service apron, civic prop, and wall chord', () => {
    const exclusions = eastbrookGrassExclusions(PROPS.buildings, true, BUILTIN_NOTICEBOARDS);
    // Eastbrook's board plus the Proving Shore tutorial island's camp
    // signpost (content/noticeboards.ts): the island board rides the same
    // canonical def, so it enters the built-in service list and earns its
    // own grass exclusion like any other civic prop.
    expect(BUILTIN_NOTICEBOARDS).toHaveLength(15);
    // Includes Eastbrook footprints plus Fenbridge rebuild aprons (see fenbridge_layout).
    // Re-pinned 2026-08: the harbor-move layout v3 retired the ring wall
    // (d19aa33f76, docs/design/eastbrook-revamp/site-plan.md), dropping the
    // 26 wall-chord OBB exclusions. Re-pinned again for round 3: the grown
    // lots and the inn lane left the count alone, but the three promoted
    // homes (eastbrook_home_market, eastbrook_home_east, eastbrook_home_rise)
    // each add a footprint OBB and an apron circle (64 obb + 29 circle).
    // Re-pinned for round 4: the preserved Grand Armoury retired from
    // placement (preservedBuildings is empty), so its footprint OBB and
    // service-apron circle left the snapshot (63 obb + 28 circle). The
    // barracks garrison that took the lot is a zone1 decor prop, outside
    // this layout-derived snapshot by design.
    // Re-pinned for round 6: eastbrook_home_rise was removed from the layout
    // after live review, taking its footprint OBB and service-apron circle
    // with it (62 obb + 27 circle). The wrought-iron churchyard enclosure
    // that now holds its lot is a zone1 decor prop, so it does not come back
    // into this snapshot. Re-pinned again for the same round's harbour
    // quarter: the town gained three coastal buildings along the dock road,
    // and each one contributes exactly two rows, a footprint OBB and a
    // service-apron circle (65 obb + 30 circle). The island signpost's board
    // and reading-spot exclusions add two more on top.
    // The 13 town guild boards (content/noticeboards.ts, one per hub
    // settlement) each add a footprint and a reading-spot exclusion: 26 more.
    // The Freehold Gate's arch adds its circle only on a lit host (below).
    expect(exclusions).toHaveLength(123);
    expect(exclusions.some((item) => item.id.startsWith('eastbrook_grand_armoury'))).toBe(false);
    for (const building of [
      ...EASTBROOK_LAYOUT.preservedBuildings,
      ...EASTBROOK_LAYOUT.buildings,
    ]) {
      expect(exclusions.some((item) => item.id === building.id)).toBe(true);
      expect(exclusions.some((item) => item.id === `${building.id}:serviceApron`)).toBe(true);
      expect(
        insideEastbrookGrassExclusion(
          exclusions,
          building.position.x,
          building.position.z,
          PADDING,
        ),
      ).toBe(true);
      expect(
        insideEastbrookGrassExclusion(
          exclusions,
          building.frontStandingPoint.x,
          building.frontStandingPoint.z,
          PADDING,
        ),
      ).toBe(true);
    }
  });

  it('pins the literal exclusion dimensions for the complete replacement layout', () => {
    const exclusions = eastbrookGrassExclusions(PROPS.buildings, true, BUILTIN_NOTICEBOARDS);
    const byId = new Map(exclusions.map((exclusion) => [exclusion.id, exclusion]));
    // Re-pinned 2026-08 round 3: every kit building grew so its door reads
    // at player height (the chapel is a bespoke asset and stays as shipped),
    // and the three promoted homes carry first-class lots of their own now.
    // Round 4 retired the Grand Armoury row with its placement, and round 6
    // retired the eastbrook_home_rise row the same way when the house came
    // out of the layout after live review. Round 6 also grew the table by
    // three rows when the town gained the coastal harbour-quarter buildings,
    // including the first hexb_market lot Eastbrook has ever seated.
    const expectedObbDimensions = {
      eastbrook_bank: [4.3, 3.45],
      eastbrook_smithy: [4.2, 3.3],
      eastbrook_inn: [4.3, 3.45],
      eastbrook_chapel: [2.75, 3],
      eastbrook_weaving_workshop: [3.45, 2.8],
      eastbrook_toolworks: [3.45, 2.8],
      eastbrook_home_market: [3.45, 2.8],
      eastbrook_home_east: [3.45, 2.8],
      eastbrook_quayside_home: [3.45, 2.8],
      eastbrook_harbour_market: [4.3, 3.5],
      eastbrook_dock_home: [3.45, 2.8],
    } as const;
    for (const [id, [halfWidth, halfDepth]] of Object.entries(expectedObbDimensions)) {
      expect(byId.get(id)).toMatchObject({ kind: 'obb', halfWidth, halfDepth });
      expect(byId.get(`${id}:serviceApron`)).toMatchObject({ kind: 'circle', radius: 1.5 });
    }
    // Round 7 replaced the well beacon with the Realm Builder monument on the
    // same point, and round 8 doubled it: the exclusion is the sculpt's own
    // tight cylinder at that size, not the beacon's looser 1.5.
    expect(byId.get('eastbrook_realm_builder_monument')).toMatchObject({
      kind: 'circle',
      radius: 3.19,
    });
    expect(byId.get('eastbrook_noticeboard')).toMatchObject({
      kind: 'obb',
      halfWidth: 1.2,
      halfDepth: 0.3,
      // Re-pinned 2026-08: the noticeboard was re-laid with the harbor move
      // (d19aa33f76, docs/design/eastbrook-revamp/site-plan.md).
      rotation: -2.17084654019665,
    });
    expect(byId.get('eastbrook_noticeboard:serviceApron')).toMatchObject({
      kind: 'circle',
      radius: 1.2,
    });
    expect(byId.has('eastbrook_market_stall_artisans')).toBe(false);

    const dimensionsFor = (ids: readonly string[]) =>
      ids.map((id) => {
        const exclusion = byId.get(id);
        if (exclusion?.kind !== 'obb') throw new Error(`missing OBB ${id}`);
        return [exclusion.halfWidth, exclusion.halfDepth];
      });
    expect(dimensionsFor(EASTBROOK_LAYOUT.civic.benches.map((bench) => bench.id))).toEqual([
      [0.9, 0.3],
      [0.9, 0.3],
      [0.9, 0.3],
    ]);
    expect(dimensionsFor(EASTBROOK_LAYOUT.market.stalls.map((stall) => stall.id))).toEqual([
      [1.4, 1.1],
      [1.4, 1.1],
    ]);
    const fenceDimensions = dimensionsFor(EASTBROOK_LAYOUT.fences.map((fence) => fence.id));
    // Re-pinned 2026-08: the smithy fences moved with the smithy in the
    // harbor move (d19aa33f76, docs/design/eastbrook-revamp/site-plan.md),
    // then re-derived again in round 3 when the yard widened around the
    // grown smithy lot, so the half widths carry fresh float noise.
    expect(fenceDimensions.map(([halfWidth]) => halfWidth)).toEqual([
      0.9000000000000008, 4.7000000000000055, 0.9000000000000008,
    ]);
    expect(fenceDimensions.map(([, halfDepth]) => halfDepth)).toEqual([0.14, 0.14, 0.14]);

    const wallDimensions = dimensionsFor(
      EASTBROOK_LAYOUT.wall.segments.map((segment) => segment.id),
    );
    // Re-pinned 2026-08: the harbor-move layout v3 retired the ring wall
    // (d19aa33f76, docs/design/eastbrook-revamp/site-plan.md); WALL_SEGMENTS
    // is empty, so there are no wall-chord OBBs left to pin.
    expect(wallDimensions).toHaveLength(0);
    expect(wallDimensions.every(([, halfDepth]) => halfDepth === 0.325)).toBe(true);
  });

  it('keeps every exclusion just inside its padded boundary and rejects just outside', () => {
    const exclusions = eastbrookGrassExclusions(PROPS.buildings, true, BUILTIN_NOTICEBOARDS);
    for (const exclusion of exclusions) {
      if (exclusion.kind === 'circle') {
        const boundary = exclusion.radius + PADDING;
        expect(
          insideEastbrookGrassExclusion(
            [exclusion],
            exclusion.x + boundary - BOUNDARY_EPSILON,
            exclusion.z,
            PADDING,
          ),
          `${exclusion.id} circle inside`,
        ).toBe(true);
        expect(
          insideEastbrookGrassExclusion(
            [exclusion],
            exclusion.x + boundary + BOUNDARY_EPSILON,
            exclusion.z,
            PADDING,
          ),
          `${exclusion.id} circle outside`,
        ).toBe(false);
        continue;
      }

      const localXInside = exclusion.halfWidth + PADDING - BOUNDARY_EPSILON;
      const localXOutside = exclusion.halfWidth + PADDING + BOUNDARY_EPSILON;
      const cosine = Math.cos(exclusion.rotation);
      const sine = Math.sin(exclusion.rotation);
      const worldPoint = (localX: number) => ({
        x: exclusion.x + localX * cosine,
        z: exclusion.z - localX * sine,
      });
      const inside = worldPoint(localXInside);
      const outside = worldPoint(localXOutside);
      expect(
        insideEastbrookGrassExclusion([exclusion], inside.x, inside.z, PADDING),
        `${exclusion.id} OBB inside`,
      ).toBe(true);
      expect(
        insideEastbrookGrassExclusion([exclusion], outside.x, outside.z, PADDING),
        `${exclusion.id} OBB outside`,
      ).toBe(false);
    }
  });

  it('keeps grass out of the well and wall while preserving every exact gate opening', () => {
    const exclusions = eastbrookGrassExclusions(PROPS.buildings, true, BUILTIN_NOTICEBOARDS);
    const well = EASTBROOK_LAYOUT.civic.monument;
    expect(
      insideEastbrookGrassExclusion(exclusions, well.position.x, well.position.z, PADDING),
    ).toBe(true);
    for (const segment of EASTBROOK_LAYOUT.wall.segments) {
      expect(
        insideEastbrookGrassExclusion(
          exclusions,
          segment.footprint.center.x,
          segment.footprint.center.z,
          PADDING,
        ),
        segment.id,
      ).toBe(true);
    }
    for (const gate of EASTBROOK_LAYOUT.wall.gates) {
      expect(
        insideEastbrookGrassExclusion(exclusions, gate.crossing.x, gate.crossing.z, PADDING),
        gate.id,
      ).toBe(false);
    }
  });

  it('never injects the canonical layout into a custom world snapshot', () => {
    expect(eastbrookGrassExclusions([], false, [])).toEqual([]);
    // Round 4: the built-in world no longer places the armoury landmark, so
    // the shipped building table contributes nothing to a custom snapshot.
    // A custom world that places the landmark itself still earns exactly its
    // own exclusion, never the fixed canonical coordinates.
    expect(eastbrookGrassExclusions(PROPS.buildings, false)).toHaveLength(0);
    const customArmoury = {
      id: 'eastbrook_grand_armoury',
      kind: 'house',
      landmark: 'eastbrook_grand_armoury',
      x: 140,
      z: 60,
      w: 13,
      d: 9,
      rot: -Math.PI / 2,
    } as const;
    const explicitLandmarkOnly = eastbrookGrassExclusions([customArmoury], false);
    expect(explicitLandmarkOnly).toEqual([
      {
        kind: 'obb',
        id: 'eastbrook_grand_armoury',
        x: 140,
        z: 60,
        halfWidth: 6.5,
        halfDepth: 4.5,
        rotation: -Math.PI / 2,
      },
    ]);
    const bank = EASTBROOK_LAYOUT.buildings[0];
    expect(
      insideEastbrookGrassExclusion(
        explicitLandmarkOnly,
        bank.position.x,
        bank.position.z,
        PADDING,
      ),
    ).toBe(false);

    const customBoard = {
      id: 'custom_noticeboard',
      entityId: 2_000_000_002,
      templateId: EASTBROOK_NOTICEBOARD_TEMPLATE_ID,
      assetId: EASTBROOK_NOTICEBOARD_ASSET_ID,
      name: 'Custom Board',
      x: 120,
      z: -80,
      rotation: 0.25,
      ...EASTBROOK_NOTICEBOARD_NATIVE_DIMENSIONS,
      interactionRadius: EASTBROOK_NOTICEBOARD_INTERACTION_RADIUS,
      frontStandingPoint: { x: 120, z: -78 },
    } satisfies NoticeboardDef;
    expect(eastbrookGrassExclusions([], false, [customBoard])).toEqual([
      {
        kind: 'obb',
        id: 'custom_noticeboard',
        x: 120,
        z: -80,
        halfWidth: 1.2,
        halfDepth: 0.3,
        rotation: 0.25,
      },
      {
        kind: 'circle',
        id: 'custom_noticeboard:serviceApron',
        x: 120,
        z: -78,
        radius: 1.2,
      },
    ]);
  });

  it('uses only the active world hub for grass clearance', () => {
    const customZones = [{ hub: { x: 120, z: -80 } }];
    expect(insideGrassHubExclusion(customZones, 0, 0)).toBe(false);
    expect(insideGrassHubExclusion(customZones, 120, -80)).toBe(true);
    expect(insideGrassHubExclusion(customZones, 134.99, -80)).toBe(true);
    expect(insideGrassHubExclusion(customZones, 135.01, -80)).toBe(false);
  });

  it('uses only active-world hubs and camps for dressing clearance', () => {
    const zones = [{ hub: { x: 120, z: -80, radius: 9 } }];
    const camps = [{ center: { x: -70, z: 95 }, radius: 6 }];
    expect(insideDressingExclusion(zones, camps, 0, 0)).toBe(false);
    expect(insideDressingExclusion(zones, camps, 132.9, -80)).toBe(true);
    expect(insideDressingExclusion(zones, camps, 133.1, -80)).toBe(false);
    expect(insideDressingExclusion(zones, camps, -62.1, 95)).toBe(true);
    expect(insideDressingExclusion(zones, camps, -61.9, 95)).toBe(false);
  });

  it('wires the one-time active-world snapshot into streamed grass', () => {
    const source = readFileSync(new URL('../src/render/foliage.ts', import.meta.url), 'utf8');
    expect(source).toContain('const GRASS_BUILDING_PADDING = 0.35;');
    expect(source).toContain('activeContent === BUILTIN_WORLD');
    expect(source).toContain('activeContent.services?.noticeboards ?? []');
    expect(source).toContain('insideGrassHubExclusion(activeContent.zones, x, z)');
    expect(source).toContain(
      'insideDressingExclusion(activeContent.zones, activeContent.camps, x, z)',
    );
    // Each chunk tests against its own short list of the snapshot, tufts and
    // every bloom pass alike (behaviour: tests/foliage_freehold_gate_grass.test.ts).
    expect(source).toMatch(
      /const excluded = grassExclusionTestNear\(\s*townExclusions,\s*\{ minX, maxX, minZ, maxZ \},\s*GRASS_BUILDING_PADDING,\s*GRASS_BLOOM_STRAY,\s*\);/,
    );
    expect(source).toMatch(/if \(excluded\(x, z\)\) continue;/);
    expect(source.match(/excluded\(fx, fz\)/g)).toHaveLength(3);
  });
});

describe('a streamed chunk exclusion test', () => {
  // A seeded walk, so the case set is the same on every run.
  let state = 0x2f6b1a3d;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const between = (lo: number, hi: number) => lo + (hi - lo) * next();
  const box = { minX: 0, maxX: 48, minZ: 0, maxZ: 48 };
  const exclusions: EastbrookGrassExclusion[] = Array.from({ length: 80 }, (_, i) =>
    i % 2 === 0
      ? {
          kind: 'circle',
          id: `c${i}`,
          x: between(-40, 88),
          z: between(-40, 88),
          radius: between(0.5, 6),
        }
      : {
          kind: 'obb',
          id: `o${i}`,
          x: between(-40, 88),
          z: between(-40, 88),
          halfWidth: between(0.5, 6),
          halfDepth: between(0.5, 6),
          rotation: between(0, Math.PI),
        },
  );

  it('answers as the whole list does for every point within reach of the chunk', () => {
    const test = grassExclusionTestNear(exclusions, box, 0.35, 3);
    let inside = 0;
    for (let i = 0; i < 20_000; i++) {
      const x = between(box.minX - 3, box.maxX + 3);
      const z = between(box.minZ - 3, box.maxZ + 3);
      const whole = insideEastbrookGrassExclusion(exclusions, x, z, 0.35);
      if (whole) inside++;
      expect(test(x, z), `${x}, ${z}`).toBe(whole);
    }
    // Both answers occur, so the agreement is not two constant functions.
    expect(inside).toBeGreaterThan(100);
    expect(inside).toBeLessThan(20_000);
  });

  it('consults only the exclusions that can reach it', () => {
    const test = grassExclusionTestNear(exclusions, box, 0.35, 3);
    expect(test.near.length).toBeGreaterThan(0);
    expect(test.near.length).toBeLessThan(exclusions.length);
    // A unit circle, padded to 1.35 yd, reaches 3 yd off the box's west edge
    // from 4.35 yd out: just beyond that it is dropped, just within it is kept.
    const edge = (x: number): EastbrookGrassExclusion => ({
      kind: 'circle',
      id: 'edge',
      x,
      z: 24,
      radius: 1,
    });
    expect(grassExclusionTestNear([edge(-4.36)], box, 0.35, 3).near).toEqual([]);
    expect(grassExclusionTestNear([edge(-4.34)], box, 0.35, 3).near).toHaveLength(1);
    expect(grassExclusionTestNear([], box, 0.35, 3)(1, 1)).toBe(false);
  });

  it('keeps a turned box whose padded corner alone reaches the chunk', () => {
    // A 2 by 2 yd box turned 45 degrees, its padded corner pointing east at the
    // chunk: the corner tip sits 1.909 yd off its centre, so from 4.9 yd west of
    // the chunk it reaches 2.99 yd off the chunk's edge, inside the 3 yd reach.
    const turned: EastbrookGrassExclusion = {
      kind: 'obb',
      id: 'turned',
      x: -4.9,
      z: 24,
      halfWidth: 1,
      halfDepth: 1,
      rotation: Math.PI / 4,
    };
    expect(insideEastbrookGrassExclusion([turned], -2.995, 24, 0.35)).toBe(true);
    const test = grassExclusionTestNear([turned], box, 0.35, 3);
    expect(test.near).toEqual([turned]);
    expect(test(-2.995, 24)).toBe(true);
  });
});
