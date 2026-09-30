// Guards: the RL env's release of the seed-keyed module caches
// (src/sim/seed_caches.ts). Resetting the env onto distinct seeds leaves only
// the live seed cached, a same-seed reset keeps the warm grid, close releases
// it, a released seed rebuilds a bit-identical collider grid, terrain and calm
// field, and no host but the env calls the release. The nearest suites,
// tests/env_protocol.test.ts (protocol and obs shape, one seed) and
// the *_colliders suites (collision on one warm grid) never discard a seed.
//
// Cost: 5.5 s

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Env } from '../headless/env';
import {
  type ColliderGrid,
  lineOfSightClear,
  resolvePosition,
  setColliderGateOpen,
  supportHeightAt,
} from '../src/sim/colliders';
import { CAMPS, getActiveWorldContent } from '../src/sim/data';
import { gridCaches, releaseSeedCaches, seedCacheSeedsForTest } from '../src/sim/seed_caches';
import { transportGatesClosedAtBuild } from '../src/sim/transport_gates';
import { terrainCalmFactorAt, terrainHeight, terrainSteepnessAt } from '../src/sim/world';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// The env's two episode seeds (each distinct seed costs a world build, over a
// second); the second is the one probed and rebuilt below.
const SEED_A = 9101;
const SEED_B = 9102;
const FORWARD = 1;

function gridOf(seed: number): ColliderGrid | undefined {
  return gridCaches.get(getActiveWorldContent())?.get(seed);
}

/** Every seed-keyed cache's seeds, as a sorted unique union. */
function cachedSeeds(): number[] {
  return [...new Set(Object.values(seedCacheSeedsForTest()).flat())].sort((a, b) => a - b);
}

function stepForward(env: Env, steps: number): void {
  for (let i = 0; i < steps; i++) env.step(FORWARD);
}

/** A Float64 as its exact bit pattern, so equality below is bit-identity. */
function bits(v: number): string {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, v);
  return view.getBigUint64(0).toString(16);
}

/** Probe points: a ring around every zone hub (the dense town colliders and
 *  the decoration field around them) plus every open-world camp centre (the
 *  calm rings). */
function probePoints(): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (const zone of getActiveWorldContent().zones) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const d = 6 + k * 3;
      out.push({ x: zone.hub.x + Math.cos(a) * d, z: zone.hub.z + Math.sin(a) * d });
    }
  }
  for (const camp of CAMPS.slice(0, 40)) out.push({ x: camp.center.x, z: camp.center.z });
  return out;
}

/** What gameplay reads from a seed's caches at the probe points, bit for bit. */
function probeReadings(seed: number): string[] {
  const pts = probePoints();
  const out: string[] = [];
  for (const p of pts) {
    const q = { x: p.x + 8, z: p.z + 5 };
    const moved = resolvePosition(seed, p.x, p.z, 0.5);
    const y = terrainHeight(p.x, p.z, seed);
    out.push(
      [
        bits(moved.x),
        bits(moved.z),
        bits(supportHeightAt(seed, p.x, p.z, 0.5, y + 3)),
        String(lineOfSightClear(seed, { x: p.x, y: y + 1.6, z: p.z }, { x: q.x, z: q.z })),
        bits(y),
        bits(terrainCalmFactorAt(p.x, p.z, seed)),
        bits(terrainSteepnessAt(p.x, p.z, seed)),
      ].join(' '),
    );
  }
  return out;
}

/** A collider's geometry and flags without its gridIndex (which a lazily
 *  materialized decoration body takes in query order). */
function shape(c: { gridIndex?: number }): string {
  const { gridIndex: _, ...rest } = c;
  return JSON.stringify(rest);
}

/** Everything gridFor builds eagerly, which no later query changes: the
 *  collider list in gridIndex order (count and order), each cell's membership
 *  in insertion order, and the closed gates. */
function eagerGridSignature(grid: ColliderGrid): string[] {
  const all = new Set<{ gridIndex?: number }>();
  for (const list of grid.cells.values()) for (const c of list) all.add(c);
  for (const list of grid.gated.values()) for (const c of list) all.add(c);
  const ordered = [...all].sort((a, b) => (a.gridIndex ?? -1) - (b.gridIndex ?? -1));
  const out = [`colliders ${ordered.length}`];
  for (const c of ordered) out.push(`${c.gridIndex} ${shape(c)}`);
  for (const [key, list] of grid.cells) out.push(`cell ${key}: ${list.map((c) => c.gridIndex)}`);
  out.push(`closed ${[...grid.closedGates].sort()}`);
  return out;
}

describe('the RL env releases a discarded episode seed from every seed-keyed cache', () => {
  it('keeps only the live seed across resets and close, and a released seed rebuilds bit-identical', () => {
    const env = new Env();
    expect(cachedSeeds()).toEqual([]);

    env.reset(SEED_A, 'warrior', {});
    stepForward(env, 4);
    // Non-vacuous: the episode really filled the grid, calm and steepness caches.
    expect(seedCacheSeedsForTest()).toMatchObject({
      gridCaches: [SEED_A],
      calmSeedTables: [SEED_A],
      steepnessCache: [SEED_A],
    });

    env.reset(SEED_B, 'warrior', {});
    stepForward(env, 4);
    expect(cachedSeeds(), 'a reset onto a new seed releases the old one').toEqual([SEED_B]);
    expect(seedCacheSeedsForTest().gridCaches).toEqual([SEED_B]);

    // A reset onto the SAME seed discards a Sim but not the seed: the new
    // episode reuses the very grid object, exactly as before the release existed.
    // It also re-syncs the gates to the clock-0 schedule a fresh build starts in.
    const live = gridOf(SEED_B) as ColliderGrid;
    expect(live).toBeDefined();
    env.reset(SEED_B, 'warrior', {});
    expect(gridOf(SEED_B), 'a same-seed reset keeps the warm grid').toBe(live);
    expect(cachedSeeds()).toEqual([SEED_B]);
    const liveReadings = probeReadings(SEED_B);

    env.close();
    expect(env.sim).toBeNull();
    expect(cachedSeeds(), 'close releases the last episode seed').toEqual([]);

    // Rebuilt from nothing: every collision, terrain and calm reading matches
    // the live episode's bit for bit, and so does the collider grid.
    expect(probeReadings(SEED_B)).toEqual(liveReadings);
    const rebuilt = gridOf(SEED_B) as ColliderGrid;
    expect(rebuilt).toBeDefined();
    expect(rebuilt).not.toBe(live);
    const signature = eagerGridSignature(rebuilt);
    expect(signature.length).toBeGreaterThan(1000);
    expect(signature).toEqual(eagerGridSignature(live));
    // Lazily materialized decoration cells: every cell the rebuilt grid holds
    // (the probes and the streetlamp plan touched them in both) is the same list.
    expect(rebuilt.decorationCells.size).toBeGreaterThan(0);
    for (const [key, list] of rebuilt.decorationCells) {
      expect(live.decorationCells.get(key)?.map(shape), `decoration cell ${key}`).toEqual(
        list.map(shape),
      );
    }
    releaseSeedCaches(SEED_B);
  });

  it('releases exactly the named seed from each cache, pending gate wishes included', () => {
    // No grid is built here: a gate wish on an unbuilt grid is remembered
    // (setColliderGateOpen), and a terrain read fills the calm and steepness caches.
    const [gate] = transportGatesClosedAtBuild();
    expect(gate).toBeDefined();
    for (const seed of [SEED_A, SEED_B]) {
      setColliderGateOpen(seed, gate, true);
      terrainSteepnessAt(0, 0, seed);
    }
    expect(seedCacheSeedsForTest()).toEqual({
      gridCaches: [],
      pendingGateStates: [SEED_A, SEED_B],
      calmSeedTables: [SEED_A, SEED_B],
      steepnessCache: [SEED_A, SEED_B],
    });
    releaseSeedCaches(SEED_A);
    expect(seedCacheSeedsForTest()).toEqual({
      gridCaches: [],
      pendingGateStates: [SEED_B],
      calmSeedTables: [SEED_B],
      steepnessCache: [SEED_B],
    });
    releaseSeedCaches(SEED_B);
    expect(cachedSeeds()).toEqual([]);
  });

  it('is called by the RL env alone: no server, client or sim path releases a seed', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return walk(full);
        return /\.(ts|mts|js|mjs|svelte)$/.test(name) ? [full] : [];
      });
    const scanned = ['src', 'server', 'headless'].flatMap((d) => walk(join(repoRoot, d)));
    // Floor so a walk that lost a root cannot pass empty.
    expect(scanned.length).toBeGreaterThan(1000);
    const users = scanned
      .filter((f) => /\breleaseSeedCaches\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(repoRoot, f).split('\\').join('/'))
      .sort();
    expect(users).toEqual(['headless/env.ts', 'src/sim/seed_caches.ts']);
  });
});
