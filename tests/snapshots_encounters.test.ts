// Encounter snapshot parity: Ring of Frost, Temporal Hourglass, Consecration,
// the Ignivar reconnect state and meteors, Nythraxis Grave Eruption, and the
// Varkhul Forgestorm and Cinder Orbs. Split out of tests/snapshots.test.ts on
// 2026-09-27.

import { describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { GameServer, wireEntity } from '../server/game';
import { MOBS } from '../src/sim/data';
import { IGNIVAR_JUDGMENT_CAST_ID } from '../src/sim/encounters/ignivar';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import {
  VARKHUL_SHARED_PYRE_AURA_ID,
  VARKHUL_SHARED_PYRE_NAME,
} from '../src/sim/varkhul_shared_pyre';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';
import { type SnapshotApplier, WIRE_TEST_WORLD } from './helpers/snapshot_wire';

describe('Ring of Frost snapshot parity', () => {
  it('mirrors authoritative active rings and clears zones missing from the next snapshot', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      rings: [{ id: '1:20', x: 3, z: 5, r: 6, i: 4.5, dur: 10, rem: 7.25 }],
    });
    expect(client.activeFrostRings).toEqual([
      {
        id: '1:20',
        x: 3,
        z: 5,
        radius: 6,
        innerRadius: 4.5,
        duration: 10,
        remaining: 7.25,
      },
    ]);

    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeFrostRings).toEqual([]);
  });

  it('interest-scopes active rings with their server-authored remaining lifetime', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Frostwire', 'mage');
    const caster = server.sim.entities.get(session.pid)!;
    (server.sim as any).groundAoEs.push({
      sourceId: caster.id,
      pos: { x: caster.pos.x + 4, y: caster.pos.y, z: caster.pos.z },
      radius: 6,
      min: 0,
      max: 0,
      remaining: 7.5,
      interval: 10,
      tickTimer: 10,
      school: 'frost',
      ability: 'Ring of Frost',
      frostRing: {
        id: `${caster.id}:10`,
        abilityId: 'rings_of_frost',
        duration: 10,
        freezeDuration: 4,
        innerRadius: 4.5,
        triggeredIds: new Set<number>(),
      },
    });

    broadcast(server);

    expect(lastSnap(fc.sent).rings).toEqual([
      expect.objectContaining({
        id: `${caster.id}:10`,
        r: 6,
        i: 4.5,
        dur: 10,
        rem: 7.5,
      }),
    ]);
  });
});

describe('Temporal Hourglass snapshot parity', () => {
  it('mirrors authoritative ground hourglasses and clears missing traps', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      hourglasses: [{ id: '1:20', x: 3, z: 5, r: 1.75, dur: 30, rem: 21.5 }],
    });
    expect(client.activeTemporalHourglasses).toEqual([
      { id: '1:20', x: 3, z: 5, radius: 1.75, duration: 30, remaining: 21.5 },
    ]);

    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeTemporalHourglasses).toEqual([]);
  });

  it('interest-scopes ground hourglasses with server-authored lifetime', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Timewire', 'mage');
    const caster = server.sim.entities.get(session.pid)!;
    (server.sim as any).groundAoEs.push({
      sourceId: caster.id,
      pos: { x: caster.pos.x + 4, y: caster.pos.y, z: caster.pos.z },
      radius: 1.75,
      min: 0,
      max: 0,
      remaining: 21.5,
      interval: 30,
      tickTimer: 30,
      school: 'arcane',
      ability: 'Hourglass of Suspension',
      temporalHourglass: {
        id: `${caster.id}:10`,
        abilityId: 'temporal_hourglass',
        protectiveDuration: 5,
        hostilePveDuration: 60,
        hostilePvpDuration: 10,
        groundDuration: 30,
        healMaxHpPct: 0.3,
        selfCooldownRate: 2,
        allyCooldownRate: 1.75,
      },
    });

    broadcast(server);

    expect(lastSnap(fc.sent).hourglasses).toEqual([
      expect.objectContaining({
        id: `${caster.id}:10`,
        r: 1.75,
        dur: 30,
        rem: 21.5,
      }),
    ]);
  });
});

describe('Consecration snapshot parity', () => {
  it('mirrors active holy ground and clears zones missing from the next snapshot', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      consecrations: [{ id: 'consecration:1:20', x: 3, z: 5, r: 8, dur: 9, rem: 6.5 }],
    });
    expect(client.activeConsecrations).toEqual([
      {
        id: 'consecration:1:20',
        x: 3,
        z: 5,
        radius: 8,
        duration: 9,
        remaining: 6.5,
      },
    ]);

    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeConsecrations).toEqual([]);
  });

  it('interest-scopes holy ground with its authoritative remaining lifetime', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Lightwire', 'paladin');
    const caster = server.sim.entities.get(session.pid)!;
    (server.sim as any).groundAoEs.push({
      sourceId: caster.id,
      pos: { x: caster.pos.x + 4, y: caster.pos.y, z: caster.pos.z },
      radius: 8,
      min: 22,
      max: 28,
      remaining: 6.5,
      interval: 1,
      tickTimer: 0.5,
      school: 'holy',
      ability: 'Consecration',
      consecration: { id: `consecration:${caster.id}:10`, duration: 9 },
    });

    broadcast(server);

    expect(lastSnap(fc.sent).consecrations).toEqual([
      expect.objectContaining({
        id: `consecration:${caster.id}:10`,
        r: 8,
        dur: 9,
        rem: 6.5,
      }),
    ]);
  });
});

describe('Ignivar raid actionable reconnect state', () => {
  it('rebuilds and clears Forge Judgment from the authoritative boss cast snapshot', () => {
    const boss = createMob(
      9900,
      MOBS.ignivar_herald_of_the_last_flame,
      MOBS.ignivar_herald_of_the_last_flame.maxLevel,
      { x: 3, y: 0, z: 5 },
    );
    boss.castingAbility = IGNIVAR_JUDGMENT_CAST_ID;
    boss.castTotal = 10;
    boss.castRemaining = 8;
    boss.channeling = false;
    boss.facing = 1.25;
    const client = bareClient(1);

    (client as unknown as SnapshotApplier).applySnapshot({
      t: 'snap',
      ents: [JSON.parse(JSON.stringify(wireEntity(boss)))],
    });

    expect(client.entities.get(boss.id)).toMatchObject({
      castingAbility: IGNIVAR_JUDGMENT_CAST_ID,
      castTotal: 10,
      castRemaining: 8,
      channeling: false,
      facing: 1.25,
    });

    boss.castRemaining = 4;
    boss.channeling = true;
    (client as unknown as SnapshotApplier).applySnapshot({
      t: 'snap',
      ents: [JSON.parse(JSON.stringify(wireEntity(boss)))],
    });
    expect(client.entities.get(boss.id)).toMatchObject({
      castingAbility: IGNIVAR_JUDGMENT_CAST_ID,
      castRemaining: 4,
      channeling: true,
    });

    boss.castingAbility = null;
    boss.castTotal = 0;
    boss.castRemaining = 0;
    boss.channeling = false;
    (client as unknown as SnapshotApplier).applySnapshot({
      t: 'snap',
      ents: [JSON.parse(JSON.stringify(wireEntity(boss)))],
    });
    expect(client.entities.get(boss.id)).toMatchObject({
      castingAbility: null,
      castTotal: 0,
      castRemaining: 0,
      channeling: false,
    });
  });

  it('rebuilds and clears the Shared Pyre target mark after reconnect', () => {
    const sim = new Sim({
      seed: 9900,
      playerClass: 'priest',
      world: WIRE_TEST_WORLD,
    });
    sim.player.auras.push({
      id: VARKHUL_SHARED_PYRE_AURA_ID,
      name: VARKHUL_SHARED_PYRE_NAME,
      kind: 'vulnerability',
      remaining: 4.5,
      duration: 6,
      value: 0,
      value2: 2,
      stacks: 4,
      sourceId: 9901,
      school: 'fire',
      encounterOwned: true,
    });
    const client = bareClient(999);

    (client as unknown as SnapshotApplier).applySnapshot({
      t: 'snap',
      ents: [JSON.parse(JSON.stringify(wireEntity(sim.player)))],
    });

    expect(client.entities.get(sim.player.id)?.auras).toContainEqual(
      expect.objectContaining({
        id: VARKHUL_SHARED_PYRE_AURA_ID,
        remaining: 4.5,
        duration: 6,
        value2: 2,
        stacks: 4,
        sourceId: 9901,
      }),
    );

    sim.player.auras = [];
    (client as unknown as SnapshotApplier).applySnapshot({
      t: 'snap',
      ents: [JSON.parse(JSON.stringify(wireEntity(sim.player)))],
    });
    expect(
      client.entities
        .get(sim.player.id)
        ?.auras.some((aura) => aura.id === VARKHUL_SHARED_PYRE_AURA_ID),
    ).toBe(false);
  });
});

describe('Ignivar meteor snapshot parity', () => {
  it('rebuilds active warnings after reconnect and clears them after impact', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      ignivarMeteors: [{ id: '77:912:0', x: 3, z: 5, r: 2.4, dur: 2.5, rem: 1.4, lead: 0.75 }],
    });
    expect(client.activeIgnivarMeteors).toEqual([
      {
        id: '77:912:0',
        x: 3,
        z: 5,
        radius: 2.4,
        duration: 2.5,
        remaining: 1.4,
        warningLead: 0.75,
      },
    ]);

    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeIgnivarMeteors).toEqual([]);
  });

  it('rejects malformed warning rows and clamps remaining time to duration', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      ignivarMeteors: [
        null,
        'primitive-row',
        { id: 'valid', x: 3, z: 5, r: 2.4, dur: 2.5, rem: 9, lead: 0 },
        { id: 'expired', x: 3, z: 5, r: 2.4, dur: 2.5, rem: 0, lead: 0.75 },
        { id: 'bad-lead', x: 3, z: 5, r: 2.4, dur: 2.5, rem: 1, lead: 2.5 },
        { id: 77, x: 3, z: 5, r: 2.4, dur: 2.5, rem: 1, lead: 0.75 },
        {
          id: 'bad-coordinate',
          x: Number.NaN,
          z: 5,
          r: 2.4,
          dur: 2.5,
          rem: 1,
          lead: 0.75,
        },
        { id: 'bad-radius', x: 3, z: 5, r: 0, dur: 2.5, rem: 1, lead: 0.75 },
        { id: 'bad-duration', x: 3, z: 5, r: 2.4, dur: 0, rem: 1, lead: 0.75 },
      ],
    });

    expect(client.activeIgnivarMeteors).toEqual([
      {
        id: 'valid',
        x: 3,
        z: 5,
        radius: 2.4,
        duration: 2.5,
        remaining: 2.5,
        warningLead: 0,
      },
    ]);
  });

  it('interest-scopes active warnings with their authoritative remaining lifetime', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Cinderwire', 'mage');
    const player = server.sim.entities.get(session.pid)!;
    const boss = createMob(
      9901,
      MOBS.ignivar_herald_of_the_last_flame,
      MOBS.ignivar_herald_of_the_last_flame.maxLevel,
      { x: player.pos.x + 4, y: player.pos.y, z: player.pos.z },
    );
    boss.ignivar = {
      meteorCastKey: 912,
      meteorImpactRemaining: 1.4,
      meteorPoints: [
        { x: player.pos.x + 5, z: player.pos.z },
        { x: player.pos.x + 100, z: player.pos.z },
      ],
    } as NonNullable<typeof boss.ignivar>;
    server.sim.entities.set(boss.id, boss);
    // The raid readouts walk the instance slots' mob lists, never the roster.
    server.sim.instances[0].mobIds.push(boss.id);

    broadcast(server);

    expect(lastSnap(fc.sent).ignivarMeteors).toEqual([
      expect.objectContaining({
        id: `${boss.id}:912:0`,
        r: 2.4,
        dur: 2.5,
        rem: 1.4,
        lead: 0.75,
      }),
    ]);
  });
});

describe('Nythraxis Grave Eruption snapshot parity', () => {
  it('rebuilds warning rings and flame patches after reconnect and clears them when absent', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      nythraxisEruptions: [{ id: '77:ge:41:0', x: 3, z: 5, r: 3, dur: 2.5, rem: 1.4, lead: 0.75 }],
      nythraxisFlames: [{ id: '77:gf:3', src: 77, k: 'grave', x: 8, z: 9, r: 3, dur: 12, rem: 7 }],
      nythraxisGravefires: [
        {
          id: '77:gfl:5',
          src: 77,
          x: 10,
          z: 11,
          dx: 0.6,
          dz: 0.8,
          tail: 2,
          head: 20,
          hw: 1.5,
          rem: 4,
        },
      ],
      nythraxisSigils: [{ id: '77:sig:8', src: 77, x: 12, z: 13, r: 4, dur: 15, rem: 11 }],
    });
    expect(client.activeNythraxisGraveEruptions).toEqual([
      {
        id: '77:ge:41:0',
        x: 3,
        z: 5,
        radius: 3,
        duration: 2.5,
        remaining: 1.4,
        warningLead: 0.75,
      },
    ]);
    expect(client.activeNythraxisGraveFlames).toEqual([
      {
        id: '77:gf:3',
        sourceId: 77,
        kind: 'grave',
        x: 8,
        z: 9,
        radius: 3,
        duration: 12,
        remaining: 7,
      },
    ]);
    expect(client.activeNythraxisGravefires).toEqual([
      {
        id: '77:gfl:5',
        sourceId: 77,
        x: 10,
        z: 11,
        dirX: 0.6,
        dirZ: 0.8,
        tail: 2,
        head: 20,
        halfWidth: 1.5,
        remaining: 4,
      },
    ]);
    expect(client.activeNythraxisBindingSigils).toEqual([
      { id: '77:sig:8', sourceId: 77, x: 12, z: 13, radius: 4, duration: 15, remaining: 11 },
    ]);

    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeNythraxisGraveEruptions).toEqual([]);
    expect(client.activeNythraxisGraveFlames).toEqual([]);
    expect(client.activeNythraxisGravefires).toEqual([]);
    expect(client.activeNythraxisBindingSigils).toEqual([]);
  });

  it('rejects malformed rows and clamps remaining time to duration', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      nythraxisEruptions: [
        null,
        'primitive-row',
        { id: 'valid', x: 3, z: 5, r: 3, dur: 2.5, rem: 9, lead: 0 },
        { id: 'expired', x: 3, z: 5, r: 3, dur: 2.5, rem: 0, lead: 0.75 },
        { id: 'bad-lead', x: 3, z: 5, r: 3, dur: 2.5, rem: 1, lead: 2.5 },
        { id: 77, x: 3, z: 5, r: 3, dur: 2.5, rem: 1, lead: 0.75 },
        { id: 'bad-coordinate', x: Number.NaN, z: 5, r: 3, dur: 2.5, rem: 1, lead: 0.75 },
        { id: 'bad-radius', x: 3, z: 5, r: 0, dur: 2.5, rem: 1, lead: 0.75 },
        { id: 'bad-duration', x: 3, z: 5, r: 3, dur: 0, rem: 1, lead: 0.75 },
      ],
      nythraxisFlames: [
        null,
        { id: 'valid', src: 77, k: 'soul', x: 8, z: 9, r: 4, dur: 15, rem: 30 },
        { id: 'expired', src: 77, k: 'grave', x: 8, z: 9, r: 3, dur: 12, rem: 0 },
        { id: 'bad-kind', src: 77, k: 'ember', x: 8, z: 9, r: 3, dur: 12, rem: 7 },
        { id: 'bad-source', src: '77', k: 'grave', x: 8, z: 9, r: 3, dur: 12, rem: 7 },
        {
          id: 'bad-coordinate',
          src: 77,
          k: 'grave',
          x: 8,
          z: Number.POSITIVE_INFINITY,
          r: 3,
          dur: 12,
          rem: 7,
        },
        { id: 'bad-radius', src: 77, k: 'grave', x: 8, z: 9, r: 0, dur: 12, rem: 7 },
        { id: 'bad-duration', src: 77, k: 'grave', x: 8, z: 9, r: 3, dur: 0, rem: 7 },
      ],
      nythraxisGravefires: [
        {
          id: 'valid-line',
          src: 77,
          x: 10,
          z: 11,
          dx: 0,
          dz: 1,
          tail: 0,
          head: 12,
          hw: 1.5,
          rem: 20,
        },
        {
          id: 'bad-line',
          src: 77,
          x: 10,
          z: 11,
          dx: 1,
          dz: 1,
          tail: 0,
          head: 12,
          hw: 1.5,
          rem: 20,
        },
      ],
      nythraxisSigils: [
        { id: 'valid-sigil', src: 77, x: 12, z: 13, r: 4, dur: 15, rem: 30 },
        { id: 'bad-sigil', src: 77, x: 12, z: 13, r: 0, dur: 15, rem: 10 },
      ],
    });

    expect(client.activeNythraxisGraveEruptions).toEqual([
      { id: 'valid', x: 3, z: 5, radius: 3, duration: 2.5, remaining: 2.5, warningLead: 0 },
    ]);
    expect(client.activeNythraxisGraveFlames).toEqual([
      {
        id: 'valid',
        sourceId: 77,
        kind: 'soul',
        x: 8,
        z: 9,
        radius: 4,
        duration: 15,
        remaining: 15,
      },
    ]);
    expect(client.activeNythraxisGravefires).toEqual([
      {
        id: 'valid-line',
        sourceId: 77,
        x: 10,
        z: 11,
        dirX: 0,
        dirZ: 1,
        tail: 0,
        head: 12,
        halfWidth: 1.5,
        remaining: 20,
      },
    ]);
    expect(client.activeNythraxisBindingSigils).toEqual([
      { id: 'valid-sigil', sourceId: 77, x: 12, z: 13, radius: 4, duration: 15, remaining: 15 },
    ]);
  });

  it('interest-scopes rings and flames with stable ids and authoritative lifetime', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Gravewire', 'priest');
    const player = server.sim.entities.get(session.pid)!;
    const boss = createMob(
      9903,
      MOBS.nythraxis_scourge_of_thornpeak,
      MOBS.nythraxis_scourge_of_thornpeak.maxLevel,
      { x: player.pos.x + 4, y: player.pos.y, z: player.pos.z },
    );
    boss.nythraxis = {
      eruptionCastKey: 41,
      eruptionImpactRemaining: 1.4,
      eruptionPoints: [
        { x: player.pos.x + 5, z: player.pos.z },
        { x: player.pos.x + 100, z: player.pos.z },
      ],
      graveFlames: [
        {
          seq: 3,
          kind: 'grave',
          x: player.pos.x - 6,
          z: player.pos.z,
          radius: 3,
          remaining: 7,
          tickTimer: 0.4,
        },
        {
          seq: 4,
          kind: 'soul',
          x: player.pos.x + 100,
          z: player.pos.z,
          radius: 4,
          remaining: 7,
          tickTimer: 0.4,
        },
      ],
      gravefires: [
        {
          seq: 5,
          x: player.pos.x - 8,
          z: player.pos.z,
          dirX: 0.6,
          dirZ: 0.8,
          elapsed: 1,
          tickTimer: 0.4,
        },
      ],
      sigil: {
        castKey: 8,
        x: player.pos.x + 9,
        z: player.pos.z,
        remaining: 11,
        ascensionTimer: 1,
        ascensionStacks: 2,
      },
    } as unknown as NonNullable<typeof boss.nythraxis>;
    server.sim.entities.set(boss.id, boss);
    // The raid readouts walk the instance slots' mob lists, never the roster.
    server.sim.instances[0].mobIds.push(boss.id);

    broadcast(server);

    const snap = lastSnap(fc.sent);
    expect(snap.nythraxisEruptions).toEqual([
      expect.objectContaining({ id: `${boss.id}:ge:41:0`, r: 3, dur: 2.5, rem: 1.4, lead: 0.75 }),
    ]);
    expect(snap.nythraxisFlames).toEqual([
      expect.objectContaining({
        id: `${boss.id}:gf:3`,
        src: boss.id,
        k: 'grave',
        r: 3,
        dur: 12,
        rem: 7,
      }),
    ]);
    expect(snap.nythraxisGravefires).toEqual([
      expect.objectContaining({
        id: `${boss.id}:gfl:5`,
        src: boss.id,
        dx: 0.6,
        dz: 0.8,
        tail: 0,
        head: 12,
        hw: 1.5,
        rem: 8.33,
      }),
    ]);
    expect(snap.nythraxisSigils).toEqual([
      expect.objectContaining({
        id: `${boss.id}:sig:8`,
        src: boss.id,
        r: 4,
        dur: 15,
        rem: 11,
      }),
    ]);
    expect(Object.keys(snap.nythraxisFlames[0])).toEqual([
      'id',
      'src',
      'k',
      'x',
      'z',
      'r',
      'dur',
      'rem',
    ]);
    expect(Object.keys(snap.nythraxisGravefires[0])).toEqual([
      'id',
      'src',
      'x',
      'z',
      'dx',
      'dz',
      'tail',
      'head',
      'hw',
      'rem',
    ]);
    expect(Object.keys(snap.nythraxisSigils[0])).toEqual([
      'id',
      'src',
      'x',
      'z',
      'r',
      'dur',
      'rem',
    ]);
  });
});

describe('Varkhul Forgestorm snapshot parity', () => {
  it('rebuilds active warnings after reconnect, clamps lifetime, and rejects malformed rows', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      varkhulForgestorm: [
        {
          id: 'varkhul-forgestorm:9901:1:0:0',
          sourceId: 9901,
          x: 3,
          z: 5,
          r: 4,
          dur: 2.5,
          rem: 9,
          lead: 0,
        },
        { id: 4, sourceId: 9901, x: 3, z: 5, r: 4, dur: 2.5, rem: 1, lead: 0 },
        {
          id: 'bad',
          sourceId: 'bad',
          x: 3,
          z: 5,
          r: 4,
          dur: 2.5,
          rem: 1,
          lead: 0,
        },
        {
          id: 'bad:2',
          sourceId: 9901,
          x: Number.NaN,
          z: 5,
          r: 4,
          dur: 2.5,
          rem: 1,
          lead: 0,
        },
        {
          id: 'bad:3',
          sourceId: 9901,
          x: 3,
          z: Number.NaN,
          r: 4,
          dur: 2.5,
          rem: 1,
          lead: 0,
        },
        {
          id: 'bad:4',
          sourceId: 9901,
          x: 3,
          z: 5,
          r: 0,
          dur: 2.5,
          rem: 1,
          lead: 0,
        },
        {
          id: 'bad:5',
          sourceId: 9901,
          x: 3,
          z: 5,
          r: 4,
          dur: 0,
          rem: 1,
          lead: 0,
        },
        {
          id: 'bad:6',
          sourceId: 9901,
          x: 3,
          z: 5,
          r: 4,
          dur: 2.5,
          rem: 0,
          lead: 0,
        },
        {
          id: 'bad:7',
          sourceId: 9901,
          x: 3,
          z: 5,
          r: 4,
          dur: 2.5,
          rem: 1,
          lead: -1,
        },
      ],
    });

    expect(client.activeVarkhulForgestormWarnings).toEqual([
      {
        id: 'varkhul-forgestorm:9901:1:0:0',
        sourceId: 9901,
        x: 3,
        z: 5,
        radius: 4,
        duration: 2.5,
        remaining: 2.5,
        warningLead: 0,
      },
    ]);

    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeVarkhulForgestormWarnings).toEqual([]);
  });

  it('interest-scopes active warnings with stable meteor ids and authoritative time', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Forgewire', 'warrior');
    const player = server.sim.entities.get(session.pid)!;
    const boss = createMob(
      9902,
      MOBS.varkhul_forgefather_of_the_last_flame,
      MOBS.varkhul_forgefather_of_the_last_flame.maxLevel,
      { x: player.pos.x + 4, y: player.pos.y, z: player.pos.z },
    );
    boss.varkhul = {
      forgestormCastKey: 7,
      forgestormWaveIndex: 1,
      forgestormWarningRemaining: 1.4,
      cinderFires: [],
      cinderOrbProjectiles: [],
      forgestormPoints: [
        { x: player.pos.x + 5, y: player.pos.y, z: player.pos.z },
        { x: player.pos.x + 100, y: player.pos.y, z: player.pos.z },
      ],
    } as unknown as NonNullable<typeof boss.varkhul>;
    server.sim.entities.set(boss.id, boss);
    // The raid readouts walk the instance slots' mob lists, never the roster.
    server.sim.instances[0].mobIds.push(boss.id);

    broadcast(server);

    expect(lastSnap(fc.sent).varkhulForgestorm).toEqual([
      expect.objectContaining({
        id: `varkhul-forgestorm:${boss.id}:7:1:0`,
        sourceId: boss.id,
        r: 4,
        dur: 2.5,
        rem: 1.4,
        lead: 0,
      }),
    ]);
  });
});

describe('Varkhul Cinder Orbs snapshot parity', () => {
  it('rebuilds Heroic meteors and all ten individual rune stations after reconnect', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      varkhulAnvilMeteors: [{ id: 'meteor:1', x: 3, z: 5, r: 3.5, dur: 1.8, rem: 1.2, lead: 0 }],
      varkhulAssemblies: [
        {
          bossId: 7,
          hc: 1,
          phase: 'links',
          fx: 10,
          fz: 20,
          hp: 0,
          mhp: 100,
          oh: 0.42,
          bw: 2.25,
          mr: 0,
          beams: [
            { i: 0, cx: -18, cz: 20, ix: -8, iz: 20, bid: 1 },
            { i: 1, cx: 38, cz: 20, ix: 10, iz: 20, bid: null },
          ],
          ib: {
            sid: 7,
            tid: 1,
            bid: 4,
            sx: 2,
            sz: 4,
            tx: 14,
            tz: 20,
            bx: 8,
            bz: 12,
            w: 1.35,
            dur: 5,
            rem: 2.25,
          },
          win: 0,
          round: 1,
          rounds: 2,
          rem: 18,
          cores: [],
          assign: [{ pid: 1, sym: 2, lock: 0 }],
          runes: Array.from({ length: 10 }, (_, sym) => ({
            sym,
            x: sym === 2 ? 14 : sym,
            z: sym === 2 ? 24 : -sym,
            r: 3.3,
            ti: sym,
            tr: 3,
            oa: Math.PI / 10 + (sym * Math.PI) / 5,
            ta: sym === 2 ? 1.2 : 0,
            ga: sym === 2 ? 1.25 : 1,
            c: sym === 2 ? 2 : 0,
            cp: sym === 2 ? 0.5 : 0,
            ap: 0,
            al: 0,
            lock: 0,
          })),
        },
      ],
    });

    expect(client.activeVarkhulAnvilMeteors).toEqual([
      expect.objectContaining({ id: 'meteor:1', radius: 3.5, remaining: 1.2 }),
    ]);
    expect(client.activeVarkhulAssemblies).toEqual([
      expect.objectContaining({
        bossId: 7,
        difficulty: 'heroic',
        phase: 'links',
        forgeOverheat: 0.42,
        forgeBeamWarmupRemaining: 2.25,
        round: 1,
        rounds: 2,
      }),
    ]);
    expect(client.activeVarkhulAssemblies[0].runes).toHaveLength(10);
    expect(client.activeVarkhulAssemblies[0].forgeBeams).toEqual([
      expect.objectContaining({ index: 0, blockerId: 1, blocked: true }),
      expect.objectContaining({ index: 1, blockerId: null, blocked: false }),
    ]);
    expect(client.activeVarkhulAssemblies[0].interceptBeam).toEqual({
      sourceId: 7,
      targetId: 1,
      blockerId: 4,
      sourceX: 2,
      sourceZ: 4,
      targetX: 14,
      targetZ: 20,
      blockerX: 8,
      blockerZ: 12,
      width: 1.35,
      duration: 5,
      remaining: 2.25,
    });
    expect(client.activeVarkhulAssemblies[0].runes[2]).toMatchObject({
      assignedPlayerId: 1,
      trackIndex: 2,
      trackRadius: 3,
      control: 'clockwise',
      controlProgress: 0.5,
    });
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      varkhulAssemblies: [
        {
          bossId: 7,
          hc: 1,
          phase: 'done',
          fx: 10,
          fz: 20,
          hp: 0,
          mhp: 100,
          oh: 1,
          bw: 0,
          mr: 4.5,
          beams: [],
          win: 0,
          round: 1,
          rounds: 2,
          rem: 0,
          cores: [],
          assign: [],
          runes: [],
        },
      ],
    });
    expect(client.activeVarkhulAssemblies).toEqual([
      expect.objectContaining({
        phase: 'done',
        forgeOverheat: 1,
        forgeMeltdownRemaining: 4.5,
        forgeBeams: [],
        interceptBeam: null,
      }),
    ]);
    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeVarkhulAnvilMeteors).toEqual([]);
    expect(client.activeVarkhulAssemblies).toEqual([]);
  });

  it('rebuilds permanent fires and traveling orbs after reconnect, then clears omissions', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [],
      varkhulCinderFires: [
        {
          id: '9901:cinder-fire:2:0',
          sourceId: 9901,
          x: 3,
          z: 5,
          r: 2.4,
        },
      ],
      varkhulCinderOrbs: [
        {
          id: '9901:cinder-orbs:2:0:0',
          sourceId: 9901,
          x: 3,
          z: 5,
          dx: 1,
          dz: 0,
          r: 1.1,
          dur: 5.5,
          rem: 4,
        },
      ],
    });

    expect(client.activeVarkhulCinderFires).toEqual([
      expect.objectContaining({ id: '9901:cinder-fire:2:0', radius: 2.4 }),
    ]);
    expect(client.activeVarkhulCinderOrbProjectiles).toEqual([
      expect.objectContaining({
        id: '9901:cinder-orbs:2:0:0',
        radius: 1.1,
        remaining: 4,
        dirX: 1,
        dirZ: 0,
      }),
    ]);
    (client as any).applySnapshot({ t: 'snap', ents: [] });
    expect(client.activeVarkhulCinderFires).toEqual([]);
    expect(client.activeVarkhulCinderOrbProjectiles).toEqual([]);
  });

  it('interest-scopes authoritative Cinder fire and orb positions', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Cinderwire', 'warrior');
    const player = server.sim.entities.get(session.pid)!;
    const boss = createMob(
      9903,
      MOBS.varkhul_forgefather_of_the_last_flame,
      MOBS.varkhul_forgefather_of_the_last_flame.maxLevel,
      { x: player.pos.x + 4, y: player.pos.y, z: player.pos.z },
    );
    boss.varkhul = {
      forgestormCastKey: 0,
      forgestormWaveIndex: 0,
      forgestormWarningRemaining: 0,
      forgestormPoints: [],
      cinderFires: [
        {
          id: `${boss.id}:cinder-fire:6:0`,
          pos: { x: player.pos.x + 6, y: player.pos.y, z: player.pos.z },
          tickTimer: 0.5,
        },
        {
          id: `${boss.id}:cinder-fire:6:1`,
          pos: { x: player.pos.x + 100, y: player.pos.y, z: player.pos.z },
          tickTimer: 0.5,
        },
      ],
      cinderOrbProjectiles: [
        {
          id: `${boss.id}:cinder-orbs:6:0:0`,
          ownerId: player.id,
          pos: { x: player.pos.x + 7, y: player.pos.y, z: player.pos.z },
          dir: { x: 1, z: 0 },
          remaining: 4,
          hitPlayerIds: [player.id],
        },
        {
          id: `${boss.id}:cinder-orbs:6:0:1`,
          ownerId: player.id,
          pos: { x: player.pos.x + 100, y: player.pos.y, z: player.pos.z },
          dir: { x: -1, z: 0 },
          remaining: 4,
          hitPlayerIds: [player.id],
        },
      ],
    } as unknown as NonNullable<typeof boss.varkhul>;
    server.sim.entities.set(boss.id, boss);
    // The raid readouts walk the instance slots' mob lists, never the roster.
    server.sim.instances[0].mobIds.push(boss.id);

    broadcast(server);

    expect(lastSnap(fc.sent).varkhulCinderFires).toEqual([
      expect.objectContaining({
        id: `${boss.id}:cinder-fire:6:0`,
        sourceId: boss.id,
        r: 3.5,
      }),
    ]);
    expect(lastSnap(fc.sent).varkhulCinderOrbs).toEqual([
      expect.objectContaining({
        id: `${boss.id}:cinder-orbs:6:0:0`,
        sourceId: boss.id,
        dx: 1,
        dz: 0,
        r: 1.1,
        dur: 5.5,
        rem: 4,
      }),
    ]);
  });
});
