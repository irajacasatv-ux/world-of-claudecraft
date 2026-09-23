// The Freehold Gate's press clearance (EASTBROOK_LAYOUT.services.freeholdGate).
// The press ladder (src/game/nearby_interaction_core.ts) ranks corpse, delve,
// OBJECT (the gate is one), npc, escort start, gather node, feast, garden bed,
// then the harvest choice, so a standing point inside the gate's reach AND
// another interactable's reach hands the press to whichever ranks higher. Two
// sites failed this: (-14,-92) sat 4.24 yd from Apothecary Lin once v0.44.0
// moved her, and (-28,-82) cleared every NPC but took the press of two Eastbrook
// garden beds. This suite holds every fixed interactable beyond the SUM of the
// two reaches, then proves it through the real ladder in both directions: every
// point an interactable answers answers the same with the gate added, and every
// point the gate reaches answers the gate and nothing else without it.
import { beforeAll, describe, expect, it } from 'vitest';
import { objectInteractionRange } from '../src/game/interactions';
import {
  type NearbyGatherNode,
  type NearbyInteractionCandidate,
  resolveNearbyInteractionCandidate,
} from '../src/game/nearby_interaction_core';
import { FARM_PATCHES } from '../src/sim/content/farm_patches';
import { ESCORTS, GATHER_NODES, NPCS, PROPS } from '../src/sim/data';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import {
  FREEHOLD_GATE_INTERACT_RANGE,
  FREEHOLD_GATE_TEMPLATE_ID,
} from '../src/sim/freehold/gate_rules';
import { Sim } from '../src/sim/sim';
import { type Entity, INTERACT_RANGE } from '../src/sim/types';
import { WORLD_SEED } from '../src/sim/world_seed';

type P = { x: number; z: number };
const GATE = EASTBROOK_LAYOUT.services.freeholdGate.position;
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.z - b.z);
// Each rung's reach as the ladder measures it: an NPC or delve object under
// INTERACT_RANGE + 1, a node under INTERACT_RANGE, a bed within it, an object
// within its own objectInteractionRange. The gate reaches its range inclusive.
const NPC_CLEARANCE = FREEHOLD_GATE_INTERACT_RANGE + INTERACT_RANGE + 1;
const BED_OR_NODE_CLEARANCE = FREEHOLD_GATE_INTERACT_RANGE + INTERACT_RANGE;

let sims: Sim[];
// Live entities of BOTH lit seeds for the distance checks; entity ids repeat
// across Sims, so the ladder worlds below draw from the shipped seed only.
let liveNpcs: Entity[];
let liveObjects: Entity[];
let gate: Entity;
let realmNpcs: Entity[];
let realmObjects: Entity[];
beforeAll(() => {
  sims = [1, WORLD_SEED].map(
    (seed) => new Sim({ seed, playerClass: 'warrior', noPlayer: true, freeholdsEnabled: true }),
  );
  const npcsOf = (sim: Sim) => [...sim.entities.values()].filter((e) => e.kind === 'npc');
  const objectsOf = (sim: Sim) =>
    [...sim.entities.values()].filter(
      (e) => e.kind === 'object' && e.templateId !== FREEHOLD_GATE_TEMPLATE_ID,
    );
  liveNpcs = sims.flatMap(npcsOf);
  liveObjects = sims.flatMap(objectsOf);
  const realm = sims[1];
  const gates = [...realm.entities.values()].filter(
    (e) => e.templateId === FREEHOLD_GATE_TEMPLATE_ID,
  );
  expect(gates).toHaveLength(1);
  gate = gates[0];
  realmNpcs = npcsOf(realm);
  realmObjects = objectsOf(realm);
});

describe('the Freehold Gate site', () => {
  it('stands at its measured site, spawned there on every lit seed', () => {
    expect(GATE).toEqual({ x: -37, z: -103.5 });
    for (const sim of sims) {
      const spawned = [...sim.entities.values()].find(
        (e) => e.templateId === FREEHOLD_GATE_TEMPLATE_ID,
      );
      expect({ x: spawned?.pos.x, z: spawned?.pos.z }).toEqual(GATE);
    }
    expect(NPC_CLEARANCE).toBe(11);
    expect(BED_OR_NODE_CLEARANCE).toBe(10);
  });

  it('holds every NPC (authored and live, the lit-only furnisher included) over 11 yd away', () => {
    const authored = Object.values(NPCS);
    // Every authored NPC that spawns on a lit host is live on both seeds.
    const spawnable = authored.filter((n) => !n.dynamic).length;
    expect(liveNpcs.length).toBeGreaterThanOrEqual(2 * spawnable);
    const near = [
      ...authored.map((n) => ({ id: n.id, d: dist(n.pos, GATE) })),
      ...liveNpcs.map((e) => ({ id: e.templateId, d: dist(e.pos, GATE) })),
    ].filter((row) => row.d <= NPC_CLEARANCE);
    expect(near).toEqual([]);
    // Nearest today, measured: Fisherman Brandt at 12.01 yd.
    const nearest = Math.min(...authored.map((n) => dist(n.pos, GATE)));
    expect(nearest).toBeCloseTo(12.0104, 3);
  });

  it('holds every garden bed, gather node and escort post over 10 yd away', () => {
    const beds = FARM_PATCHES.flatMap((p) => p.beds);
    expect(beds.length).toBeGreaterThan(0);
    for (const bed of beds) expect(dist(bed, GATE), bed.id).toBeGreaterThan(BED_OR_NODE_CLEARANCE);
    for (const node of GATHER_NODES)
      expect(dist(node.pos, GATE), node.id).toBeGreaterThan(BED_OR_NODE_CLEARANCE);
    for (const escort of Object.values(ESCORTS))
      expect(dist(escort.start, GATE), escort.id).toBeGreaterThan(BED_OR_NODE_CLEARANCE);
  });

  it('holds every other object beyond both reaches, and every delve marker beyond an NPC reach', () => {
    expect(liveObjects.length).toBeGreaterThan(20);
    for (const object of liveObjects) {
      const clearance = object.templateId.startsWith('delve_')
        ? NPC_CLEARANCE
        : FREEHOLD_GATE_INTERACT_RANGE + objectInteractionRange(object);
      expect(dist(object.pos, GATE), object.templateId).toBeGreaterThan(clearance);
    }
    for (const marker of PROPS.delveMarkers ?? [])
      expect(dist(marker, GATE)).toBeGreaterThan(NPC_CLEARANCE);
  });
});

describe('the Freehold Gate through the real press ladder', () => {
  // The local world: the gate plus the nearest live NPCs and objects, every
  // garden bed and every gather node, so the ladder resolves each point
  // against the same competitors it meets in town.
  const K = 4;
  const nearestOf = <T>(items: T[], at: (item: T) => P) =>
    [...items].sort((a, b) => dist(at(a), GATE) - dist(at(b), GATE)).slice(0, K);
  const nodes: NearbyGatherNode[] = GATHER_NODES;
  function press(point: P, withGate: boolean, locals: Entity[]): NearbyInteractionCandidate | null {
    const player = {
      id: 1,
      kind: 'player',
      templateId: 'player',
      pos: { x: point.x, y: 0, z: point.z },
      dead: false,
      ghost: false,
      corpseInstanceId: null,
    } as unknown as Entity;
    const entities = new Map<number, Entity>([[player.id, player]]);
    for (const e of locals) entities.set(e.id, e);
    if (withGate) entities.set(gate.id, gate);
    return resolveNearbyInteractionCandidate(
      {
        playerId: 1,
        player,
        entities,
        questLog: new Map(),
        farmPatches: FARM_PATCHES,
      },
      true,
      null,
      nodes,
    );
  }
  const key = (c: NearbyInteractionCandidate | null) => (c ? `${c.kind}:${c.id}` : 'none');
  function disc(center: P, radius: number): P[] {
    const points: P[] = [];
    for (let dx = -radius; dx <= radius; dx += 0.25)
      for (let dz = -radius; dz <= radius; dz += 0.25)
        if (Math.hypot(dx, dz) <= radius) points.push({ x: center.x + dx, z: center.z + dz });
    return points;
  }

  it('changes no answer anywhere inside the nearest NPCs, objects, beds and nodes', () => {
    const npcs = nearestOf(realmNpcs, (e) => e.pos);
    const objects = nearestOf(realmObjects, (e) => e.pos);
    const locals = [...npcs, ...objects];
    const beds = nearestOf(
      FARM_PATCHES.flatMap((p) => p.beds),
      (b) => b,
    );
    const nearNodes = nearestOf(GATHER_NODES, (n) => n.pos);
    const targets: { label: string; at: P; reach: number }[] = [
      ...npcs.map((e) => ({ label: e.templateId, at: e.pos, reach: INTERACT_RANGE + 1 })),
      ...objects.map((e) => ({ label: e.templateId, at: e.pos, reach: objectInteractionRange(e) })),
      ...beds.map((b) => ({ label: b.id, at: b, reach: INTERACT_RANGE })),
      ...nearNodes.map((n) => ({ label: n.id, at: n.pos, reach: INTERACT_RANGE })),
    ];
    let answered = 0;
    for (const target of targets) {
      for (const point of disc(target.at, target.reach)) {
        const without = key(press(point, false, locals));
        if (without === 'none') continue;
        answered++;
        expect(key(press(point, true, locals)), `${target.label} at ${point.x},${point.z}`).toBe(
          without,
        );
      }
    }
    // Non-vacuous: the sampled discs really answered presses.
    expect(answered).toBeGreaterThan(5000);
  });

  it('answers the gate, and nothing else, everywhere inside its own reach', () => {
    const locals = [
      ...nearestOf(realmNpcs, (e) => e.pos),
      ...nearestOf(realmObjects, (e) => e.pos),
    ];
    const points = disc(GATE, FREEHOLD_GATE_INTERACT_RANGE);
    expect(points.length).toBeGreaterThan(1000);
    for (const point of points) {
      // No standing point the gate reaches reaches anything else: without the
      // gate the press finds nothing there, so the gate can shadow no one and
      // no higher rung can shadow it.
      expect(key(press(point, false, locals)), `${point.x},${point.z} without`).toBe('none');
      expect(key(press(point, true, locals)), `${point.x},${point.z}`).toBe(`object:${gate.id}`);
    }
  });
});
