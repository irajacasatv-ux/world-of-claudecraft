// The Freehold Gate's press clearance (EASTBROOK_LAYOUT.services.freeholdGate). The press ladder
// (src/game/nearby_interaction_core.ts) ranks corpse, delve, OBJECT (the gate is one), npc, escort
// start, gather node, feast, garden bed, then the harvest choice, so a standing point inside the
// gate's reach AND another interactable's reach hands the press to whichever ranks higher. Two
// sites failed this: (-14,-92) sat 4.24 yd from Apothecary Lin once v0.44.0 moved her, and
// (-28,-82) cleared every NPC but stood inside the press reach of two Eastbrook garden beds (4.47
// and 5.00 yd) and within the 10 yd sum of two more (9.22 and 9.49 yd); a third, (-37,-103.5),
// passed the presses but dropped a leaving player 1.17 yd from a house corner, and a fourth,
// (-39,-104), 0.25 yd outside the Eastbrook town circle. This suite holds every fixed interactable
// beyond the SUM of the two reaches, pins the site margins that chose it, then proves the presses
// through the real ladder in both directions: every point an interactable answers answers the same
// with the gate added, and every point the gate reaches answers the gate and nothing else without
// it.
import { beforeAll, describe, expect, it } from 'vitest';
import { ESCORT_POST_RADIUS } from '../src/game/escort_interact';
import { objectInteractionRange } from '../src/game/interactions';
import {
  type NearbyGatherNode,
  type NearbyInteractionCandidate,
  resolveNearbyInteractionCandidate,
} from '../src/game/nearby_interaction_core';
import { GRID_CELL } from '../src/sim/collider_cells';
import { isBlocked, supportHeightAt } from '../src/sim/colliders';
import { FARM_PATCHES } from '../src/sim/content/farm_patches';
import { FREEHOLD_FURNISHER_NPC_ID } from '../src/sim/content/freehold';
import { ZONE1_ZONE } from '../src/sim/content/zone1';
import {
  DUNGEONS,
  ESCORTS,
  GATHER_NODES,
  instanceOrigin,
  MOBS,
  NPCS,
  PORTALS,
  PROPS,
  zoneAt,
} from '../src/sim/data';
import { distancePointToObb, EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import { ESCORT_AMBUSH_RADIUS, ESCORT_ARRIVE_RANGE } from '../src/sim/escort';
import {
  FREEHOLD_GATE_INTERACT_RANGE,
  FREEHOLD_GATE_TEMPLATE_ID,
} from '../src/sim/freehold/gate_rules';
import { DUNGEON_DOOR_RETURN_INSET } from '../src/sim/instances/dungeons';
import { isInTownZone } from '../src/sim/professions/focus';
import { resolveSavedPosExit } from '../src/sim/saved_pos_exit';
import { Sim } from '../src/sim/sim';
import { type Entity, INTERACT_RANGE } from '../src/sim/types';
import { groundHeight, isInWaterBody, roadDistance, WATER_LEVEL } from '../src/sim/world';
import { WORLD_SEED } from '../src/sim/world_seed';
import { collidersWithin, pushOutReach } from './helpers/collider_gap';

type P = { x: number; z: number };
const GATE = EASTBROOK_LAYOUT.services.freeholdGate.position;
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.z - b.z);
// The distance from a point to the segment a..b.
const segmentDistance = (at: P, a: P, b: P) => {
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  const ll = vx * vx + vz * vz;
  const t = ll ? Math.max(0, Math.min(1, ((at.x - a.x) * vx + (at.z - a.z) * vz) / ll)) : 0;
  return Math.hypot(at.x - (a.x + vx * t), at.z - (a.z + vz * t));
};
// Each rung's reach as the ladder measures it: an NPC or delve object under
// INTERACT_RANGE + 1, a node under INTERACT_RANGE, a bed within it, an object
// within its own objectInteractionRange. The gate reaches its range inclusive.
const NPC_CLEARANCE = FREEHOLD_GATE_INTERACT_RANGE + INTERACT_RANGE + 1;
const BED_OR_NODE_CLEARANCE = FREEHOLD_GATE_INTERACT_RANGE + INTERACT_RANGE;
// An escortee answers the press anywhere within INTERACT_RANGE of it while it
// stands within ESCORT_POST_RADIUS of its post (escort_interact.ts).
const ESCORT_CLEARANCE = FREEHOLD_GATE_INTERACT_RANGE + INTERACT_RANGE + ESCORT_POST_RADIUS;
// An escort route (and every ambush ring) keeps this far from the arch.
const ROUTE_CLEARANCE = 12;
// The collider-free ring round the arch the margins case pins on every seed.
const ARCH_CLEAR_RING = 3.5;
const SEEDS = [1, 7, 42, 99, 1032, 1337, WORLD_SEED, 2_147_483_647];
// Where a leaving player lands: neither room def sets a leaveOffset (the town
// circle case below proves it per def), so the door inset applies.
const DROP = { x: GATE.x, z: GATE.z - DUNGEON_DOOR_RETURN_INSET };

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
    expect(GATE).toEqual({ x: -38.65, z: -103.75 });
    // Facing 0: the arch opens along z, so the drop, the capture stance and the
    // probe's face-on view all assume it.
    expect(EASTBROOK_LAYOUT.services.freeholdGate.facing).toBe(0);
    for (const sim of sims) {
      const spawned = [...sim.entities.values()].find(
        (e) => e.templateId === FREEHOLD_GATE_TEMPLATE_ID,
      );
      expect({ x: spawned?.pos.x, z: spawned?.pos.z }).toEqual(GATE);
    }
    expect(NPC_CLEARANCE).toBe(11);
    expect(BED_OR_NODE_CLEARANCE).toBe(10);
    expect(ESCORT_CLEARANCE).toBe(13);
    // The click range the prompt's pointer arm checks is the gate's own reach.
    expect(objectInteractionRange({ templateId: FREEHOLD_GATE_TEMPLATE_ID })).toBe(
      FREEHOLD_GATE_INTERACT_RANGE,
    );
  });

  it('keeps the margins that chose the site: off the road, collider-free, drop clear of buildings', () => {
    // The world's own "off road" placement threshold is roadDistance >= 5; the
    // site keeps half a yard more. Its collider-free ground, two views of it:
    // the movement engine's (isBlocked, whose box push-out squares an OBB's
    // corners) keeps 3.5 yd round the arch free on every seed, and 3.6 yd
    // reaches the eastbrook_home_market collider and nothing else (proved over
    // a cell range below). The single-cell isBlocked read is complete here
    // too: a rotated box's square-cornered push-out reaches up to r * sqrt(2)
    // past its bounds, and the gate sits more than that inside its 16 yd
    // cell. The Euclidean view, read over a cell range, keeps
    // every collider at least 4.5 yd off (measured: 4.57 to a seed-scattered
    // circle on seed 1032, and 4.75 to the house and a streetlamp elsewhere).
    expect(roadDistance(GATE.x, GATE.z)).toBeGreaterThanOrEqual(5.5);
    const drop = DROP;
    const house = EASTBROOK_LAYOUT.buildings.find((b) => b.id === 'eastbrook_home_market');
    expect(house).toBeDefined();
    const inCell = (v: number) => v - Math.floor(v / GRID_CELL) * GRID_CELL;
    const cellEdge = Math.min(
      ...[GATE.x, GATE.z].flatMap((v) => [inCell(v), GRID_CELL - inCell(v)]),
    );
    expect(cellEdge).toBeGreaterThanOrEqual(3.6 * Math.SQRT2);
    for (const seed of SEEDS) {
      expect(isBlocked(seed, GATE.x, GATE.z, ARCH_CLEAR_RING), `seed ${seed}`).toBe(false);
      expect(isBlocked(seed, GATE.x, GATE.z, 3.6), `seed ${seed} at 3.6`).toBe(true);
      const near = collidersWithin(seed, GATE.x, GATE.z, 6);
      const reached = near.filter(({ collider }) => pushOutReach(collider, GATE.x, GATE.z) < 3.6);
      expect(
        reached.map(({ collider }) => [collider.type, collider.x, collider.z]),
        `seed ${seed} what 3.6 yd reaches`,
      ).toEqual([['obb', house?.position.x, house?.position.z]]);
      expect(pushOutReach(reached[0].collider, GATE.x, GATE.z)).toBeCloseTo(3.528, 3);
      expect(near[0].gap, `seed ${seed} nearest Euclidean gap`).toBeGreaterThan(4.5);
      // No deck stands over the drop, so the leave's deck seat (supportHeightAt,
      // as dungeons.ts applies it) keeps the player on the ground there.
      expect(supportHeightAt(seed, drop.x, drop.z, 0.5, Number.POSITIVE_INFINITY)).toBe(
        Number.NEGATIVE_INFINITY,
      );
    }
    // A leaving player lands at least 2 yd from every building footprint, and
    // 4.5 yd off the road centre.
    const gaps = EASTBROOK_LAYOUT.buildings.map((b) => distancePointToObb(drop, b.footprint));
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(2);
    expect(roadDistance(drop.x, drop.z)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the arch on flat, dry ground on every seed', () => {
    const drop = DROP;
    for (const point of [GATE, drop]) expect(isInWaterBody(point.x, point.z)).toBe(false);
    for (const seed of SEEDS) {
      const h = groundHeight(GATE.x, GATE.z, seed);
      expect(h - WATER_LEVEL, `seed ${seed} gate freeboard`).toBeGreaterThanOrEqual(1.5);
      expect(
        groundHeight(drop.x, drop.z, seed) - WATER_LEVEL,
        `seed ${seed} drop`,
      ).toBeGreaterThanOrEqual(1.5);
      // Ground within 4 yd of the arch stays within half a yard of its base.
      let spread = 0;
      for (const r of [1, 2, 3, 4])
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          spread = Math.max(
            spread,
            Math.abs(groundHeight(GATE.x + Math.cos(a) * r, GATE.z + Math.sin(a) * r, seed) - h),
          );
        }
      expect(spread, `seed ${seed} slope`).toBeLessThanOrEqual(0.5);
    }
  });

  it('stands well clear of doors, portals, delve markers and escort routes', () => {
    const doors = Object.values(DUNGEONS)
      .filter((d) => d.overworldDoor !== false)
      .map((d) => d.doorPos);
    const portals = PORTALS.flatMap((p) => [p.a, p.b]);
    const markers = PROPS.delveMarkers ?? [];
    expect(doors.length * portals.length * markers.length).toBeGreaterThan(0);
    for (const at of [...doors, ...portals, ...markers]) expect(dist(at, GATE)).toBeGreaterThan(15);
    // Escort routes keep ROUTE_CLEARANCE, but one: the Eastbrook freight caravan
    // (world quest wq_eastbrook_caravan) walks the main street 4.8 yd from the
    // arch. RULED 2026-09-27 (state.md premise G8): friendly traffic, kept. Its
    // escortee is never hostile, answers the press only at its post (held over
    // ESCORT_CLEARANCE by the post case below), and fires no wave near the gate
    // (the ambush-ring case below), so its route owes only the arch's
    // collider-free ring (ARCH_CLEAR_RING, the margins case), never a path
    // through it.
    const FRIENDLY_TRAFFIC = new Set(['esc_wq_eastbrook_caravan']);
    let segments = 0;
    const nearest = new Map<string, number>();
    for (const escort of Object.values(ESCORTS)) {
      const line = [escort.start, ...escort.waypoints];
      for (let i = 0; i + 1 < line.length; i++) {
        segments++;
        const d = segmentDistance(GATE, line[i], line[i + 1]);
        nearest.set(escort.id, Math.min(nearest.get(escort.id) ?? Infinity, d));
        const need = FRIENDLY_TRAFFIC.has(escort.id) ? ARCH_CLEAR_RING : ROUTE_CLEARANCE;
        expect(d, escort.id).toBeGreaterThan(need);
      }
    }
    expect(segments).toBeGreaterThan(0);
    for (const id of FRIENDLY_TRAFFIC) {
      const escort = ESCORTS[id];
      expect(escort, id).toBeDefined();
      // The exemption is live (the route really passes inside ROUTE_CLEARANCE,
      // so it is not a stale entry hiding a route that moved away), and the
      // walker is the friendly kind: it aggroes nothing and never moves itself.
      expect(nearest.get(id), id).toBeLessThan(ROUTE_CLEARANCE);
      expect(MOBS[escort.npcMobId], id).toMatchObject({ aggroRadius: 0, moveSpeed: 0 });
    }
  });

  it('keeps every escort ambush ring clear of the arch and of the leave drop', () => {
    // G8, RULED 2026-09-27 (state.md): no hostile wave lands near the gate. A wave
    // spawns on an evenly spaced ring round its escortee at the moment the run
    // counts a waypoint reached (escort.ts fireAmbushes): within
    // ESCORT_ARRIVE_RANGE of the waypoint, or anywhere on the leg into it when the
    // stuck arm fires. So a ring's worst case is the leg's nearest point, less the
    // arrival reach and the ring radius, and it must keep ROUTE_CLEARANCE and the
    // ambusher's own aggro radius from both the arch and the drop (a wave mob
    // idles at its spawn point for the tick an evade takes before it re-commits).
    // Before the ruling the caravan's third wave fired at waypoint 8, whose ring
    // put two bandits 6.4 yd from the arch and one 5.6 yd from the drop.
    let rings = 0;
    let closest = { clearance: Number.POSITIVE_INFINITY, at: '' };
    for (const escort of Object.values(ESCORTS)) {
      const line = [escort.start, ...escort.waypoints];
      for (const ambush of escort.ambushes) {
        const template = MOBS[ambush.mobId];
        expect(template, ambush.mobId).toBeDefined();
        const need = Math.max(ROUTE_CLEARANCE, template.aggroRadius);
        // line[k + 1] is waypoints[k]; the leg into it starts at line[k].
        const from = line[ambush.atWaypoint];
        const to = line[ambush.atWaypoint + 1];
        expect(to, `${escort.id} wave at ${ambush.atWaypoint}`).toBeDefined();
        const reach = ESCORT_ARRIVE_RANGE + (ambush.radius ?? ESCORT_AMBUSH_RADIUS);
        for (const [name, at] of [
          ['arch', GATE],
          ['drop', DROP],
        ] as const) {
          const clearance = segmentDistance(at, from, to) - reach;
          const where = `${escort.id} wave at ${ambush.atWaypoint}, ${name}`;
          expect(clearance, where).toBeGreaterThanOrEqual(need);
          if (clearance < closest.clearance) closest = { clearance, at: where };
        }
        rings++;
      }
    }
    expect(rings).toBeGreaterThan(Object.keys(ESCORTS).length);
    // Positive control: the bound is live. The nearest ring is the caravan's
    // third wave, measured 12.93 yd from the arch at its worst.
    expect(closest.at).toBe('esc_wq_eastbrook_caravan wave at 6, arch');
    expect(closest.clearance).toBeCloseTo(12.933, 3);
  });

  it('keeps the gate, the live leave and the saved-inside rejoin inside the Eastbrook town circle', () => {
    // Town Focus answers not_in_town outside the hub circle, judged as
    // setTownFocus does (isInTownZone over zoneAt), so a player who has just
    // left their home must land inside it. The previous site, (-39,-104),
    // dropped them 0.25 yd outside. The live leave drop is re-derived by the
    // rule detachFromDungeon applies (leaveOffset, else the door inset; the
    // online suite pins the landed point), and the saved-inside rejoin runs
    // resolveSavedPosExit itself.
    for (const id of ['freehold_inn_room', 'freehold_cottage']) {
      const def = DUNGEONS[id];
      const leave = def.leaveOffset ?? { x: 0, z: -DUNGEON_DOOR_RETURN_INSET };
      const drop = { x: def.doorPos.x + leave.x, z: def.doorPos.z + leave.z };
      expect(def.leaveOffset).toBeUndefined();
      expect(drop).toEqual(DROP);
      const inside = instanceOrigin(def.index, 0);
      const rejoin = resolveSavedPosExit({ x: inside.x, z: inside.z }).pos!;
      for (const at of [GATE, drop, rejoin]) {
        expect(zoneAt(at.x, at.z).id, `${id} ${at.x},${at.z}`).toBe(ZONE1_ZONE.id);
        expect(isInTownZone(at, zoneAt(at.x, at.z)), `${id} ${at.x},${at.z}`).toBe(true);
      }
    }
    // The return's margin inside the circle, measured: 0.16 yd. Pinned to the
    // measurement on purpose, so a hub retune that eats it fails loudly.
    const hub = ZONE1_ZONE.hub;
    expect(hub.radius - dist(DROP, hub)).toBeCloseTo(0.1605, 3);
  });

  it('holds every NPC (authored and live, the lit-only furnisher included) over 11 yd away', () => {
    const authored = Object.values(NPCS);
    // Every authored NPC that spawns on a lit host is live on both seeds, the
    // lit-only furnisher named directly (a count alone cannot prove it).
    const spawnable = authored.filter((n) => !n.dynamic).length;
    expect(liveNpcs.length).toBeGreaterThanOrEqual(2 * spawnable);
    expect(liveNpcs.filter((e) => e.templateId === FREEHOLD_FURNISHER_NPC_ID)).toHaveLength(2);
    const near = [
      ...authored.map((n) => ({ id: n.id, d: dist(n.pos, GATE) })),
      ...liveNpcs.map((e) => ({ id: e.templateId, d: dist(e.pos, GATE) })),
    ].filter((row) => row.d <= NPC_CLEARANCE);
    expect(near).toEqual([]);
    // Nearest today, measured: Cook Marlow at 12.19 yd. Pinned on purpose, so an
    // NPC moving toward the gate is reviewed even while it clears 11 yd.
    const nearest = Math.min(...authored.map((n) => dist(n.pos, GATE)));
    expect(nearest).toBeCloseTo(12.185, 3);
  });

  it('keeps the closest NPC at its spawn distance through a minute of a running lit realm', () => {
    // No town NPC wanders today (measured: none moves in 1200 ticks), so the
    // closest stays Cook Marlow's spawn 12.185 yd off. Pinned exactly on
    // purpose: an NPC given a route or a wander near the gate reds this and is
    // reviewed against the 11 yd clearance, which the spawn-time case cannot see.
    const sim = new Sim({
      seed: WORLD_SEED,
      playerClass: 'warrior',
      noPlayer: true,
      freeholdsEnabled: true,
    });
    let closest = Number.POSITIVE_INFINITY;
    for (let tick = 0; tick < 20 * 60; tick++) {
      sim.tick();
      if (tick % 20 !== 0) continue;
      for (const e of sim.entities.values())
        if (e.kind === 'npc') closest = Math.min(closest, dist(e.pos, GATE));
    }
    expect(closest).toBeGreaterThan(NPC_CLEARANCE);
    expect(closest).toBeCloseTo(12.185, 3);
  });

  it('holds every garden bed and gather node over 10 yd away, and every escort post over 13', () => {
    const beds = FARM_PATCHES.flatMap((p) => p.beds);
    expect(beds.length).toBeGreaterThan(0);
    for (const bed of beds) expect(dist(bed, GATE), bed.id).toBeGreaterThan(BED_OR_NODE_CLEARANCE);
    expect(GATHER_NODES.length).toBeGreaterThan(0);
    for (const node of GATHER_NODES)
      expect(dist(node.pos, GATE), node.id).toBeGreaterThan(BED_OR_NODE_CLEARANCE);
    const escorts = Object.values(ESCORTS);
    expect(escorts.length).toBeGreaterThan(0);
    for (const escort of escorts)
      expect(dist(escort.start, GATE), escort.id).toBeGreaterThan(ESCORT_CLEARANCE);
  });

  it('holds every other object beyond both reaches, and every delve marker beyond an NPC reach', () => {
    // 362 measured across both lit seeds.
    expect(liveObjects.length).toBeGreaterThan(340);
    for (const object of liveObjects) {
      const clearance = object.templateId.startsWith('delve_')
        ? NPC_CLEARANCE
        : FREEHOLD_GATE_INTERACT_RANGE + objectInteractionRange(object);
      expect(dist(object.pos, GATE), object.templateId).toBeGreaterThan(clearance);
      // The layout's comment says over 10 yd from every object, which the
      // 4 yd noticeboard and monument reaches alone would not require.
      if (!object.templateId.startsWith('delve_'))
        expect(dist(object.pos, GATE), object.templateId).toBeGreaterThan(BED_OR_NODE_CLEARANCE);
    }
    const markers = PROPS.delveMarkers ?? [];
    expect(markers.length).toBeGreaterThan(0);
    for (const marker of markers) expect(dist(marker, GATE)).toBeGreaterThan(NPC_CLEARANCE);
  });
});

describe('the Freehold Gate through the real press ladder', () => {
  // The local world: the gate plus the nearest live NPCs and objects, every
  // garden bed and every gather node, so the ladder resolves each point
  // against the same competitors it meets in town. K bounds only which
  // competitors the ladder cases load; the distance cases above hold EVERY
  // NPC, object, bed, node and escort post, so do not relax those for this.
  const K = 4;
  const nearestOf = <T>(items: T[], at: (item: T) => P) =>
    [...items].sort((a, b) => dist(at(a), GATE) - dist(at(b), GATE)).slice(0, K);
  const nodes: NearbyGatherNode[] = GATHER_NODES;
  function press(
    point: P,
    withGate: boolean,
    locals: Entity[],
    // A released ghost whose corpse is bound to an owner room: the one dead
    // player the gate still presents to (the corpse run).
    ghost = false,
  ): NearbyInteractionCandidate | null {
    const player = {
      id: 1,
      kind: 'player',
      templateId: 'player',
      pos: { x: point.x, y: 0, z: point.z },
      dead: ghost,
      ghost,
      corpseInstanceId: ghost ? 7 : null,
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
    type Group = 'npc' | 'object' | 'bed' | 'node';
    const targets: { group: Group; label: string; at: P; reach: number }[] = [
      ...npcs.map((e) => ({
        group: 'npc' as const,
        label: e.templateId,
        at: e.pos,
        reach: INTERACT_RANGE + 1,
      })),
      ...objects.map((e) => ({
        group: 'object' as const,
        label: e.templateId,
        at: e.pos,
        reach: objectInteractionRange(e),
      })),
      ...beds.map((b) => ({ group: 'bed' as const, label: b.id, at: b, reach: INTERACT_RANGE })),
      ...nearNodes.map((n) => ({
        group: 'node' as const,
        label: n.id,
        at: n.pos,
        reach: INTERACT_RANGE,
      })),
    ];
    const answered: Record<Group, number> = { npc: 0, object: 0, bed: 0, node: 0 };
    for (const target of targets) {
      for (const point of disc(target.at, target.reach)) {
        const without = key(press(point, false, locals));
        if (without === 'none') continue;
        answered[target.group]++;
        expect(key(press(point, true, locals)), `${target.label} at ${point.x},${point.z}`).toBe(
          without,
        );
      }
    }
    // Non-vacuous PER GROUP: each group's discs really answered presses (a world
    // that lost its beds or nodes would otherwise skip every such point).
    // Measured: npc 7162, object 4108, bed 5028, node 4980.
    const floor: Record<Group, number> = { npc: 7000, object: 4000, bed: 4900, node: 4850 };
    for (const group of Object.keys(answered) as Group[])
      expect(answered[group], group).toBeGreaterThan(floor[group]);
  });

  it('answers the gate, and nothing else, everywhere inside its own reach', () => {
    const locals = [
      ...nearestOf(realmNpcs, (e) => e.pos),
      ...nearestOf(realmObjects, (e) => e.pos),
    ];
    const points = disc(GATE, FREEHOLD_GATE_INTERACT_RANGE);
    expect(points.length).toBe(1257);
    for (const point of points) {
      // No standing point the gate reaches reaches anything else: without the
      // gate the press finds nothing there, so the gate can shadow no one and
      // no higher rung can shadow it. The same holds for a ghost on its
      // corpse run, whose only other rung is a spirit healer.
      for (const ghost of [false, true]) {
        const at = `${point.x},${point.z}${ghost ? ' ghost' : ''}`;
        expect(key(press(point, false, locals, ghost)), `${at} without`).toBe('none');
        expect(key(press(point, true, locals, ghost)), at).toBe(`object:${gate.id}`);
      }
    }
  });
});
