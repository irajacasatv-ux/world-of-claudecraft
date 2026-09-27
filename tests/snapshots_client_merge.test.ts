// The online client side of the snapshot wire: client-side delta merge and the
// despawn grace that keeps entities from flickering. Split out of
// tests/snapshots.test.ts on 2026-09-27.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { GameServer, wireEntity } from '../server/game';
import {
  emptyPriestMarkerState,
  priestMarkerStateForAuras,
} from '../src/sim/combat/priest/presentation';
import { Sim } from '../src/sim/sim';
import type { Aura } from '../src/sim/types';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';
import { WIRE_TEST_WORLD } from './helpers/snapshot_wire';

describe('client-side delta merge', () => {
  it('does not apply optimistic quest accept or completion state', () => {
    const client = bareClient(1);
    const sent: any[] = [];
    (client as any).ws = {
      readyState: 1,
      send: (payload: string) => sent.push(JSON.parse(payload)),
    };
    const oldWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = { OPEN: 1 };
    try {
      client.acceptQuest('q_wolves');
      expect(client.questLog.has('q_wolves')).toBe(false);
      expect(client.questState('q_wolves')).toBe('active');
      expect(sent).toContainEqual({
        t: 'cmd',
        cmd: 'accept',
        quest: 'q_wolves',
      });

      (client as any).pendingQuestCommands.clear();
      client.questLog.set('q_wolves', {
        questId: 'q_wolves',
        counts: [8],
        state: 'ready',
      });
      client.turnInQuest('q_wolves');
      expect(client.questLog.has('q_wolves')).toBe(true);
      expect(client.questsDone.has('q_wolves')).toBe(false);
      expect(client.questState('q_wolves')).toBe('active');
      expect(sent).toContainEqual({
        t: 'cmd',
        cmd: 'turnin',
        quest: 'q_wolves',
      });
    } finally {
      (globalThis as any).WebSocket = oldWebSocket;
    }
  });

  it('flushes changed movement immediately without resending unchanged frames', () => {
    const client = bareClient(1);
    const sent: any[] = [];
    (client as any).ws = {
      readyState: 1,
      send: (payload: string) => sent.push(JSON.parse(payload)),
    };
    const oldWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = { OPEN: 1 };
    try {
      Object.assign(client.moveInput, {
        forward: true,
        back: false,
        turnLeft: false,
        turnRight: false,
        strafeLeft: false,
        strafeRight: false,
        jump: false,
        dive: false,
        surface: false,
      });
      expect(client.flushInput(100)).toBe(true);
      expect(sent).toEqual([
        {
          t: 'input',
          seq: 1,
          mv: 2,
          mt: 100,
          mi: { f: 1, b: 0, tl: 0, tr: 0, sl: 0, sr: 0, j: 0, dv: 0, sf: 0 },
        },
      ]);

      expect(client.flushInput(105)).toBe(false);
      expect(sent).toHaveLength(1);

      Object.assign(client.moveInput, { forward: false, strafeRight: true });
      expect(client.flushInput(115)).toBe(false);
      expect(sent).toHaveLength(1);

      expect(client.flushInput(120)).toBe(true);
      expect(sent.at(-1)).toEqual({
        t: 'input',
        seq: 2,
        mv: 2,
        mt: 120,
        mi: { f: 0, b: 0, tl: 0, tr: 0, sl: 0, sr: 1, j: 0, dv: 0, sf: 0 },
      });
    } finally {
      (globalThis as any).WebSocket = oldWebSocket;
    }
  });

  it('sends movement v2 frames with client ticks and nullable facing', () => {
    const client = bareClient(1, { movementWireVersion: 2 });
    const sent: any[] = [];
    (client as any).ws = {
      readyState: 1,
      bufferedAmount: 0,
      send: (payload: string) => sent.push(JSON.parse(payload)),
    };
    const oldWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = { OPEN: 1 };
    try {
      expect(
        client.sendMovementFrame(
          { ct: 5, mi: { ...client.moveInput, forward: true }, facing: null },
          100,
        ),
      ).toBe(true);
      expect(
        client.sendMovementFrame(
          {
            ct: 6,
            mi: { ...client.moveInput, strafeLeft: true },
            facing: 0.25,
          },
          150,
        ),
      ).toBe(true);
      expect(sent).toEqual([
        {
          t: 'input',
          seq: 1,
          ct: 5,
          mi: { f: 1, b: 0, tl: 0, tr: 0, sl: 0, sr: 0, j: 0, dv: 0, sf: 0 },
        },
        {
          t: 'input',
          seq: 2,
          ct: 6,
          mi: { f: 0, b: 0, tl: 0, tr: 0, sl: 1, sr: 0, j: 0, dv: 0, sf: 0 },
          facing: 0.25,
        },
      ]);
    } finally {
      (globalThis as any).WebSocket = oldWebSocket;
    }
  });

  it('bounds movement v2 input echo telemetry to the legacy window', () => {
    const client = bareClient(1, { movementWireVersion: 2 });
    (client as any).ws = {
      readyState: 1,
      bufferedAmount: 0,
      send: () => {},
    };
    const oldWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = { OPEN: 1 };
    try {
      for (let ct = 0; ct < 121; ct++) {
        expect(client.sendMovementFrame({ ct, mi: client.moveInput, facing: null }, ct)).toBe(true);
      }
      expect((client as any).pendingInputSeqSentAt.size).toBe(120);
      expect([...(client as any).pendingInputSeqSentAt.keys()].slice(0, 2)).toEqual([2, 3]);
    } finally {
      (globalThis as any).WebSocket = oldWebSocket;
    }
  });

  // The camera swim steer is the one graded movement field, and it rides along
  // only when it actually grades something: absent means full rate on the far
  // side (swimSteerRate), so a land frame (and a full-rate keyboard dive) must
  // stay byte-identical to what this client always sent.
  it('sends the swim steer only while it grades the dive', () => {
    const client = bareClient(1);
    const sent: any[] = [];
    (client as any).ws = {
      readyState: 1,
      send: (payload: string) => sent.push(JSON.parse(payload)),
    };
    const oldWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = { OPEN: 1 };
    try {
      const last = () => sent[sent.length - 1].mi;
      Object.assign(client.moveInput, { forward: true });
      expect(client.flushInput(100)).toBe(true);
      expect(last().ss).toBeUndefined(); // walking: unchanged payload

      Object.assign(client.moveInput, { dive: true, swimSteer: 1 });
      expect(client.flushInput(200)).toBe(true);
      expect(last().dv).toBe(1);
      expect(last().ss).toBeUndefined(); // full rate is the default

      Object.assign(client.moveInput, { swimSteer: 0.5 });
      expect(client.flushInput(300)).toBe(true);
      expect(last().ss).toBe(0.5); // ...and a feathered one is carried

      // A steer CHANGE is a movement change: the signature has to notice, or
      // the rate would stick at whatever the last sent frame said.
      Object.assign(client.moveInput, { swimSteer: 0.5 });
      expect(client.flushInput(400)).toBe(false);
      Object.assign(client.moveInput, { swimSteer: 1 });
      expect(client.flushInput(500)).toBe(true);
      expect(last().ss).toBeUndefined();
    } finally {
      (globalThis as any).WebSocket = oldWebSocket;
    }
  });

  it('reconstructs stacking-debuff stack counts from the wire (Armor Shear)', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      ents: [
        {
          id: 2,
          k: 'mob',
          tid: 'wolf',
          nm: 'Wolf',
          lv: 3,
          x: 0,
          y: 0,
          z: 0,
          f: 0,
          hp: 40,
          mhp: 40,
          auras: [
            {
              id: 'sunder_armor',
              name: 'Armor Shear',
              kind: 'sunder',
              rem: 30,
              dur: 30,
              stacks: 3,
            },
          ],
        },
      ],
    });
    const aura = client.entities.get(2)?.auras.find((a) => a.kind === 'sunder');
    expect(aura?.stacks, 'client should mirror the wire stack count').toBe(3);
  });

  it('always wires Druid engine bank stages, including zero and one', () => {
    // The sparsity rule omits stacks below 2, but the engine banks teach their
    // live stage (auras_view badge + aura_effect tooltip) at 0 and 1 too, and
    // the decode side cannot tell "absent because 1" from "absent because 0".
    const sim = new Sim({ seed: 33, playerClass: 'druid', autoEquip: true });
    for (const stacks of [0, 1] as const) {
      sim.player.auras = [
        {
          id: 'moontide',
          name: 'Moontide',
          kind: 'moontide',
          remaining: 3600,
          duration: 3600,
          value: 0,
          stacks,
          sourceId: sim.playerId,
          school: 'nature',
        },
      ];
      const wire = wireEntity(sim.player) as {
        auras?: { id: string; stacks?: number }[];
      };
      const wired = wire.auras?.find((a) => a.id === 'moontide');
      expect(wired?.stacks, `the wire must carry the ${stacks}-stage bank`).toBe(stacks);

      const client = bareClient(sim.playerId + 1000);
      (client as any).applySnapshot({
        t: 'snap',
        ents: [wireEntity(sim.player)],
      });
      const mirrored = client.entities.get(sim.playerId)?.auras.find((a) => a.id === 'moontide');
      expect(mirrored?.stacks, `the mirror must read the ${stacks}-stage bank`).toBe(stacks);
    }
  });

  it('reconstructs charge-limited aura charges from the wire (Thunder Ward)', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      ents: [
        {
          id: 3,
          k: 'player',
          tid: '',
          nm: 'Shaman',
          lv: 12,
          x: 0,
          y: 0,
          z: 0,
          f: 0,
          hp: 200,
          mhp: 200,
          auras: [
            {
              id: 'lightning_shield',
              name: 'Thunder Ward',
              kind: 'thorns',
              rem: 600,
              dur: 600,
              charges: 2,
            },
          ],
        },
      ],
    });
    const aura = client.entities.get(3)?.auras.find((a) => a.id === 'lightning_shield');
    expect(aura?.charges, 'client should mirror the wire charge count').toBe(2);
  });

  it('round-trips the aura caster id (src) so own-aura prominence works online', () => {
    // Drives the REAL server emit (wireEntity) into the REAL client mirror: a
    // regression that drops either the `src` emission or the online.ts decode
    // would silently decode every online aura to sourceId 0, degrading the
    // target strip's ownFirst dot/hot prominence online while offline keeps it
    // (the stacks/charges sibling pins above follow the same pattern).
    const sim = new Sim({
      seed: 7,
      playerClass: 'warrior',
      autoEquip: true,
      world: WIRE_TEST_WORLD,
    });
    const e = sim.entities.get(sim.playerId)!;
    e.auras.push(
      {
        id: 'deep_wounds',
        name: 'Gaping Wounds',
        kind: 'dot',
        remaining: 9,
        duration: 9,
        value: 5,
        sourceId: 42,
        school: 'physical',
      },
      {
        id: 'battle_shout',
        name: 'Battle Shout',
        kind: 'buff_ap',
        remaining: 120,
        duration: 120,
        value: 20,
        sourceId: 0,
        school: 'physical',
      },
    );
    const w = wireEntity(e) as { auras: { id: string; src?: number }[] };
    expect(w.auras.find((a) => a.id === 'deep_wounds')?.src, 'server ships the caster id').toBe(42);
    expect(
      'src' in (w.auras.find((a) => a.id === 'battle_shout') ?? {}),
      'a sourceless aura omits src to stay lean',
    ).toBe(false);

    const client = bareClient(e.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    const mirrored = client.entities.get(e.id)?.auras;
    expect(
      mirrored?.find((a) => a.id === 'deep_wounds')?.sourceId,
      'client mirrors the caster id',
    ).toBe(42);
    expect(
      mirrored?.find((a) => a.id === 'battle_shout')?.sourceId,
      'an omitted src decodes to 0',
    ).toBe(0);
  });

  it('round-trips next-cast empowerment scope for online action-bar glows', () => {
    const sim = new Sim({ seed: 7, playerClass: 'priest', autoEquip: true });
    const e = sim.entities.get(sim.playerId)!;
    e.auras.push({
      id: 'pri_searing_light',
      name: 'Searing Light',
      kind: 'next_cast_free',
      remaining: 8,
      duration: 8,
      value: 0,
      sourceId: e.id,
      school: 'holy',
      empowerAbilities: ['smite'],
    });
    const w = wireEntity(e) as { auras: { id: string; emp?: string[] }[] };
    expect(w.auras.find((a) => a.id === 'pri_searing_light')?.emp).toEqual(['smite']);

    const client = bareClient(e.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    const aura = client.entities.get(e.id)?.auras.find((a) => a.id === 'pri_searing_light');
    expect(aura?.empowerAbilities).toEqual(['smite']);
  });

  it('round-trips Priest relationship and Gloomtithe presentation state online', () => {
    const sim = new Sim({ seed: 29, playerClass: 'priest', autoEquip: true });
    const e = sim.player;
    e.auras.push(
      {
        id: 'priest_doctrine',
        name: 'Doctrine',
        kind: 'doctrine',
        remaining: 30,
        duration: 30,
        value: 0.3,
        sourceId: e.id,
        school: 'holy',
      },
      {
        id: 'seraphic_vigil',
        name: 'Seraphic Vigil',
        kind: 'heal_echo',
        remaining: 30,
        duration: 30,
        value: 180,
        sourceId: e.id,
        school: 'holy',
      },
      {
        id: 'priest_gloomtithe',
        name: 'Gloomtithe',
        kind: 'gloomtithe',
        remaining: 15,
        duration: 15,
        value: 0,
        stacks: 5,
        sourceId: e.id,
        school: 'shadow',
      },
      {
        id: 'priest_effigy',
        name: 'Effigy',
        kind: 'hex',
        remaining: 18,
        duration: 18,
        value: 0.3,
        sourceId: e.id,
        school: 'shadow',
      },
    );

    const client = bareClient(e.id + 1000, { playerClass: 'priest' });
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    const mirrored = client.entities.get(e.id);
    if (!mirrored) throw new Error('online priest missing');

    expect(priestMarkerStateForAuras(mirrored.auras, emptyPriestMarkerState())).toEqual({
      doctrine: true,
      vigil: true,
      dirge: false,
      effigy: true,
      gloomtitheStacks: 5,
      summonReady: true,
    });
  });

  it('round-trips the Lingering Dread marker and clears it in place when the wire omits it', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warrior', autoEquip: true });
    const e = sim.entities.get(sim.playerId)!;
    const fearAura: Aura = {
      id: 'fear_incap',
      name: 'Fear',
      kind: 'incapacitate',
      remaining: 8,
      duration: 8,
      value: 0,
      sourceId: e.id,
      school: 'shadow',
      breakThreshold: 25,
    };
    e.auras.push(fearAura);
    const wired = wireEntity(e) as { auras: { id: string; bt?: 1 }[] };
    expect(wired.auras.find((a) => a.id === 'fear_incap')?.bt).toBe(1);

    const client = bareClient(e.id + 1000);
    const apply = (): void => {
      const snap = JSON.parse(JSON.stringify({ t: 'snap', ents: [wireEntity(e)] }));
      (client as any).applySnapshot(snap);
    };
    apply();
    const mirroredEntity = client.entities.get(e.id);
    if (!mirroredEntity) throw new Error('mirrored entity missing');
    const mirrored = mirroredEntity.auras.find((a) => a.id === 'fear_incap');
    if (!mirrored) throw new Error('mirrored fear aura missing');
    expect(mirrored.breakThreshold).toBe(1);

    fearAura.breakThreshold = undefined;
    apply();
    expect(client.entities.get(e.id)!.auras.find((a) => a.id === 'fear_incap')).toBe(mirrored);
    expect(mirrored.breakThreshold).toBeUndefined();
  });

  it('snaps the interpolation anchor on a teleport but tweens normal moves', () => {
    const client = bareClient(1);
    const ent = (x: number, z: number) => ({
      id: 2,
      k: 'mob',
      tid: 'wolf',
      nm: 'Wolf',
      lv: 3,
      x,
      y: 0,
      z,
      f: 0,
      hp: 40,
      mhp: 40,
    });
    const apply = (x: number, z: number) => (client as any).applySnapshot({ ents: [ent(x, z)] });

    // first sight: anchor initialised to the spawn pose
    apply(10, 20);
    let e = client.entities.get(2)!;
    expect(e.prevPos).toMatchObject({ x: 10, z: 20 });

    // a normal step keeps the anchor behind the new pose so the renderer can
    // interpolate across the gap (anchor stays at the previous server pose)
    apply(12, 21);
    e = client.entities.get(2)!;
    expect(e.pos).toMatchObject({ x: 12, z: 21 });
    expect(e.prevPos.x).not.toBe(12);
    expect(e.prevPos.z).not.toBe(21);

    // a teleport is a discontinuity: the anchor snaps to the destination so
    // the entity does not streak across the map over the next interval
    apply(220, 240);
    e = client.entities.get(2)!;
    expect(e.pos).toMatchObject({ x: 220, z: 240 });
    expect(e.prevPos).toMatchObject({ x: 220, z: 240 });
  });

  it('keeps previous structures when delta fields are omitted', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Testa');
    const client = bareClient(session.pid);

    server.sim.addItem('conjured_water', 1, session.pid);
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.inventory.length).toBeGreaterThan(0);
    const invRef = client.inventory;
    const qlogRef = client.questLog;
    const qdoneRef = client.questsDone;
    const cdsRef = client.player.cooldowns;

    fc.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    // omitted fields neither reset nor get rebuilt
    expect(client.inventory).toBe(invRef);
    expect(client.questLog).toBe(qlogRef);
    expect(client.questsDone).toBe(qdoneRef);
    expect(client.player.cooldowns).toBe(cdsRef);

    fc.sent.length = 0;
    server.sim.addItem('baked_bread', 1, session.pid);
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.inventory).not.toBe(invRef);
    expect(client.inventory.some((s) => s.itemId === 'baked_bread')).toBe(true);
  });
});

describe('despawn grace (anti-flicker)', () => {
  // A full ("first sight") wire record carrying identity, so applyWire creates
  // the entity rather than skipping it as a half-initialized lite ghost.
  function fullWire(id: number, x: number, z: number, extra: Record<string, unknown> = {}) {
    return {
      id,
      k: 'player',
      tid: 'warrior',
      nm: `E${id}`,
      lv: 1,
      x,
      y: 0,
      z,
      f: 0,
      hp: 100,
      mhp: 100,
      ...extra,
    };
  }
  function snap(self: any, ents: any[], keep: number[] = []) {
    return { t: 'snap', tick: 1, time: 0, self, ents, keep };
  }

  let clock = 0;

  beforeEach(() => {
    clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retains a far entity briefly missing from a snapshot, then drops it after the grace window', () => {
    const c = bareClient(1);
    const self = () => fullWire(1, 0, 0);

    // Establish: self plus a far entity riding the interest boundary (~95yd).
    (c as any).applySnapshot(snap(self(), [fullWire(2, 95, 0)]));
    expect(c.entities.has(2)).toBe(true);

    // Boundary churn: it drops out of the next snapshot. Held, not deleted.
    clock += 50;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(true);

    // Still gone, but within the grace window: still retained.
    clock += 200;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(true);

    // Gone past the grace window: now really removed.
    clock += 600;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(false);
  });

  it('clears the grace timer when the entity reappears (no flicker on re-entry)', () => {
    const c = bareClient(1);
    const self = () => fullWire(1, 0, 0);
    const ent2 = c.entities; // ref to the live map

    (c as any).applySnapshot(snap(self(), [fullWire(2, 95, 0)]));
    const created = ent2.get(2);

    clock += 50;
    (c as any).applySnapshot(snap(self(), [])); // briefly missing
    clock += 50;
    (c as any).applySnapshot(snap(self(), [fullWire(2, 96, 0)])); // back
    // Same entity object retained the whole time: the renderer never tore down
    // and rebuilt its view, so no visible flash.
    expect(ent2.get(2)).toBe(created);

    // Marker cleared, so a later miss starts a fresh grace window rather than
    // counting from the earlier one.
    clock += 5000;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(true);
  });

  it('treats a `keep`-listed entity as present (tier-throttle is never "missing")', () => {
    const c = bareClient(1);
    const self = () => fullWire(1, 0, 0);

    (c as any).applySnapshot(snap(self(), [fullWire(2, 95, 0)]));
    expect(c.entities.has(2)).toBe(true);

    // First a genuine omission so the grace timer is actually armed; without
    // this the `missingSince.has(2)` assertion below would be trivially false
    // and never exercise the keep-clears-timer path.
    clock += 50;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(true);
    expect((c as any).missingSince.has(2)).toBe(true);

    // Now a distance-tier-throttled snapshot omits it from `ents` but lists it
    // in `keep`, so it counts as seen: retained, and the armed grace timer is
    // cleared.
    clock += 50;
    (c as any).applySnapshot(snap(self(), [], [2]));
    expect(c.entities.has(2)).toBe(true);
    expect((c as any).missingSince.has(2)).toBe(false);

    // Because the timer was cleared, a genuine later miss starts a fresh grace
    // window (held now, not deleted as if it had been missing since the throttle).
    clock += 5000;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(true);
  });

  it('drops a close-range disappearance immediately (preserves instant stealth-vanish)', () => {
    const c = bareClient(1);
    const self = () => fullWire(1, 0, 0);

    (c as any).applySnapshot(snap(self(), [fullWire(2, 10, 0)]));
    expect(c.entities.has(2)).toBe(true);

    // A nearby enemy going stealth stops being observable and is omitted. It
    // must vanish at once, with no grace for close-range disappearances.
    clock += 50;
    (c as any).applySnapshot(snap(self(), []));
    expect(c.entities.has(2)).toBe(false);
  });
});
