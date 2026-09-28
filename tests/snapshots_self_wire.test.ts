// Self-record wire round trips: the in-combat bit, stats, talents, spectate POV,
// per-session isolation, raid lockouts, the Combat Mech held weapon, channel
// target, pet signature skill, swing timer, account flair, corpse harvest claim,
// ledge climb, loot FFA lapse, corpse decay, the buried hoard rarity identity
// wire and the combat-rating scalars behind the delta gate. Split out of
// tests/snapshots.test.ts on 2026-09-27.

import { describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { GameServer, wireEntity } from '../server/game';
import { corpseLootAvailability } from '../src/game/corpse_loot_availability';
import { mechHeldWeaponOverride, visualKeyFor } from '../src/render/characters/manifest';
import { MOBS } from '../src/sim/data';
import { createGroundObject, createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { PlayerClass } from '../src/sim/types';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';
import { WIRE_TEST_WORLD } from './helpers/snapshot_wire';

describe('buried hoard rarity identity wire', () => {
  it.each(['common', 'rare', 'epic', 'legendary'] as const)('round-trips %s', (rarity) => {
    const entrance = createGroundObject(90_003, '', 'Buried Hoard', { x: 2, y: 0, z: 3 });
    entrance.templateId = 'hoard_entrance';
    entrance.vaultRarity = rarity;
    const client = bareClient(-1);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(entrance)] });
    expect(client.entities.get(entrance.id)?.vaultRarity).toBe(rarity);
  });

  it('ignores an unknown quality from a newer server', () => {
    const entrance = createGroundObject(90_004, '', 'Buried Hoard', { x: 2, y: 0, z: 3 });
    const client = bareClient(-1);
    (client as any).applySnapshot({ t: 'snap', ents: [{ ...wireEntity(entrance), vr: 'future' }] });
    expect(client.entities.get(entrance.id)?.vaultRarity).toBeUndefined();
  });

  it('round-trips vr, preserves it across a lite record, and clears it on a later full record', () => {
    const entrance = createGroundObject(90_001, '', 'Buried Hoard', { x: 2, y: 0, z: 3 });
    entrance.templateId = 'hoard_entrance';
    entrance.vaultRarity = 'legendary';

    const full = wireEntity(entrance);
    expect(full.vr).toBe('legendary');

    const client = bareClient(-1);
    (client as any).applySnapshot({ t: 'snap', ents: [full] });
    expect(client.entities.get(entrance.id)?.vaultRarity).toBe('legendary');

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ id: entrance.id, x: 2.5, y: 0, z: 3, f: 0, hp: 1, mhp: 1 }],
    });
    expect(client.entities.get(entrance.id)?.vaultRarity).toBe('legendary');

    entrance.vaultRarity = undefined;
    const cleared = wireEntity(entrance);
    expect(cleared.k).toBe('object');
    expect(cleared).not.toHaveProperty('vr');
    (client as any).applySnapshot({ t: 'snap', ents: [cleared] });
    expect(client.entities.get(entrance.id)?.vaultRarity).toBeUndefined();
  });
});

describe('self in-combat bit (cbt) wire round-trip', () => {
  it('ships the sim flag on the self record and ClientWorld mirrors it, then elides until it flips', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Swordsworn');
    const sim = server.sim;
    const player = sim.entities.get(session.pid)!;
    const client = bareClient(session.pid);

    // Fresh character: the first record carries the bit explicitly as 0.
    broadcast(server);
    let snap = lastSnap(fc.sent);
    expect(snap.self.cbt).toBe(0);
    (client as any).applySnapshot(snap);
    expect(client.player.inCombat).toBe(false);

    // A real pull: a wild hostile aggroes the player and the engaged pass flags
    // them on the next tick (the player never swings, so no personal damage
    // event ever reaches the client: exactly the boss-fight report).
    const mob = [...sim.entities.values()].find(
      (e) => e.kind === 'mob' && e.hostile && !e.dead && e.ownerId === null,
    )!;
    mob.pos = { ...player.pos };
    expect(sim.aggroMob(mob, player, false)).toBe(true);
    sim.tick();
    expect(player.inCombat).toBe(true);
    fc.sent.length = 0;
    broadcast(server);
    snap = lastSnap(fc.sent);
    expect(snap.self.cbt).toBe(1);
    (client as any).applySnapshot(snap);
    expect(client.player.inCombat).toBe(true);

    // Unchanged: the key is omitted and the mirror keeps the held state.
    fc.sent.length = 0;
    broadcast(server);
    snap = lastSnap(fc.sent);
    expect(snap.self).not.toHaveProperty('cbt');
    (client as any).applySnapshot(snap);
    expect(client.player.inCombat).toBe(true);

    // The fight ends: the bit flips back to 0 once and the mirror clears.
    mob.dead = true;
    mob.threat.clear();
    mob.aggroTargetId = null;
    mob.aiState = 'dead';
    for (let i = 0; i < 20 * 6; i++) sim.tick();
    expect(player.inCombat).toBe(false);
    fc.sent.length = 0;
    broadcast(server);
    snap = lastSnap(fc.sent);
    expect(snap.self.cbt).toBe(0);
    (client as any).applySnapshot(snap);
    expect(client.player.inCombat).toBe(false);
  });
});

describe('self stat wire round-trip', () => {
  it('mirrors Paladin Devotion and Ascension state from the authoritative server', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Oathkeeper', 'paladin');
    const player = (server as any).sim.entities.get(session.pid);
    player.paladinDevotion.value = 7;
    player.paladinDevotion.ascensionCharges = 3;
    player.paladinDevotion.ascensionRemaining = 18.25;

    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.pdev).toEqual({ value: 7, charges: 3, remaining: 18.25 });

    const client = bareClient(session.pid, { playerClass: 'paladin' });
    (client as any).applySnapshot(snap);
    expect(client.player.paladinDevotion).toMatchObject({
      value: 7,
      ascensionCharges: 3,
      ascensionRemaining: 18.25,
    });
  });

  it('mirrors compact Ascension charges for a remote Paladin visual', () => {
    const sim = new Sim({ seed: 27, playerClass: 'paladin', autoEquip: true });
    sim.player.paladinDevotion!.ascensionCharges = 4;
    sim.player.paladinDevotion!.ascensionRemaining = 20;

    const wire = wireEntity(sim.player);
    expect(wire.pasc).toBe(4);

    const client = bareClient(sim.playerId + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    expect(client.entities.get(sim.playerId)?.paladinDevotion).toMatchObject({
      ascensionCharges: 4,
      ascensionRemaining: 1,
    });

    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...wire, pasc: 0 }],
    });
    expect(client.entities.get(sim.playerId)?.paladinDevotion).toMatchObject({
      ascensionCharges: 0,
      ascensionRemaining: 0,
    });
  });

  it('omits idle Ascension charges from the wire and clears them on decode', () => {
    const sim = new Sim({ seed: 27, playerClass: 'paladin', autoEquip: true });
    sim.player.paladinDevotion!.ascensionCharges = 4;
    sim.player.paladinDevotion!.ascensionRemaining = 20;
    const active = wireEntity(sim.player);
    expect(active.pasc).toBe(4);

    const client = bareClient(sim.playerId + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [active] });
    expect(client.entities.get(sim.playerId)?.paladinDevotion?.ascensionCharges).toBe(4);

    // Idle charges are omitted entirely (omit-when-default, like the fields
    // around it), and decoding the ABSENT field must clear the mirrored
    // charges: a decode gated on presence would leave an expired Ascension's
    // orbiting seals on the remote paladin forever.
    sim.player.paladinDevotion!.ascensionCharges = 0;
    const idle = wireEntity(sim.player);
    expect('pasc' in idle).toBe(false);
    (client as any).applySnapshot({ t: 'snap', ents: [idle] });
    expect(client.entities.get(sim.playerId)?.paladinDevotion).toMatchObject({
      ascensionCharges: 0,
      ascensionRemaining: 0,
    });
  });

  it('preserves talent-expanded Ascension charge counts for remote Paladins', () => {
    const sim = new Sim({ seed: 28, playerClass: 'paladin', autoEquip: true });
    sim.player.paladinDevotion!.ascensionCharges = 7;
    sim.player.paladinDevotion!.ascensionRemaining = 20;
    const wire = wireEntity(sim.player);

    const client = bareClient(sim.playerId + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });

    expect(client.entities.get(sim.playerId)?.paladinDevotion?.ascensionCharges).toBe(7);
  });

  it('mirrors Warrior shield block stats from the live equip command path', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Cedric', 'warrior');
    server.sim.addItem('eastbrook_buckler', 1, session.pid);
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'equip',
        item: 'eastbrook_buckler',
        slot: 'offhand',
      }),
    );
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.equip.offhand).toBe('eastbrook_buckler');
    expect(snap.self.stats.armor).toBeGreaterThan(0);
    expect(snap.self.stats.sta).toBeGreaterThan(0);
    expect(snap.self.blk).toBeGreaterThan(0);
    expect(snap.self.bval).toBe(6);

    const client = bareClient(session.pid, { playerClass: 'warrior' });
    const internals = client as unknown as {
      applySnapshot(snapshot: unknown): void;
    };
    internals.applySnapshot(snap);
    expect(client.player.offhandItemId).toBe('eastbrook_buckler');
    expect(client.player.equippedItems.offhand).toBe('eastbrook_buckler');
    expect(client.player.stats.armor).toBe(snap.self.stats.armor);
    expect(client.player.stats.sta).toBe(snap.self.stats.sta);
    expect(client.player.blockChance).toBe(snap.self.blk);
    expect(client.player.blockValue).toBe(6);
  });

  it('mirrors crit/haste rating from the self snapshot onto the paper-doll entity', () => {
    const client = bareClient(1);
    const internals = client as unknown as {
      applySnapshot(snapshot: unknown): void;
    };
    internals.applySnapshot({
      t: 'snap',
      ents: [],
      self: {
        id: 1,
        k: 'player',
        tid: 'mage',
        nm: 'Caster',
        lv: 20,
        x: 0,
        y: 0,
        z: 0,
        f: 0,
        hp: 100,
        mhp: 100,
        res: 0,
        mres: 100,
        rtype: 'mana',
        crat: 20,
        hrat: 150,
        hirat: 30,
      },
    });
    // Without the wire fields these read the blankEntity default 0 (the bug this guards).
    expect(client.player.critRating).toBe(20);
    expect(client.player.hasteRating).toBe(150);
    expect(client.player.hitRating).toBe(30);
  });

  it('backfills WARFARE fractions when an older server sends the legacy six-field stats shape', () => {
    const client = bareClient(1);
    const internals = client as unknown as {
      applySnapshot(snapshot: unknown): void;
    };
    internals.applySnapshot({
      t: 'snap',
      ents: [],
      self: {
        id: 1,
        k: 'player',
        tid: 'warrior',
        nm: 'Veteran',
        lv: 20,
        x: 0,
        y: 0,
        z: 0,
        f: 0,
        hp: 100,
        mhp: 100,
        stats: { str: 40, agi: 25, sta: 38, int: 10, spi: 12, armor: 300 },
      },
    });
    expect(client.player.stats).toMatchObject({
      str: 40,
      pvpOffense: 0,
      pvpDefense: 0,
    });
  });
});

describe('self talent wire decode (IWorldTalents facet)', () => {
  // Ported coverage from the mage-line branch: the client decodes the heavy `tal`
  // field, repairs the allocation, and re-derives spec/role/known/talentPoints
  // locally from the mirrored rows (display-only; the server stays authoritative).
  it('decodes the talent snapshot field and recomputes known from spec plus rows', () => {
    const client = bareClient(1);
    const internals = client as unknown as {
      applySnapshot(snapshot: unknown): void;
    };
    const snapshotAlloc = {
      spec: 'prot',
      rows: { 8: 'war_row_die_by_the_sword', 17: 'war_row_recklessness' },
    };
    internals.applySnapshot({
      t: 'snap',
      ents: [],
      self: {
        id: 1,
        k: 'player',
        tid: 'warrior',
        nm: 'Tank',
        lv: 20,
        x: 0,
        y: 0,
        z: 0,
        f: 0,
        hp: 100,
        mhp: 100,
        res: 0,
        mres: 100,
        rtype: 'rage',
        tal: {
          alloc: snapshotAlloc,
          loadouts: [{ name: 'MT', alloc: { spec: null, rows: {} }, bar: [] }],
          activeLoadout: 0,
        },
      },
    });
    expect(client.talents).toEqual(snapshotAlloc);
    expect(client.talentSpec).toBe('prot');
    expect(client.talentRole).toBe('tank'); // derived from the prot mastery, not the wire
    expect(client.loadouts.length).toBe(1);
    expect(client.activeLoadout).toBe(0);
    // known is re-derived locally: the prot signature plus the two row grants.
    expect(client.known.some((k) => k.def.id === 'shield_slam')).toBe(true);
    expect(client.known.some((k) => k.def.id === 'die_by_sword')).toBe(true);
    expect(client.known.some((k) => k.def.id === 'recklessness')).toBe(true);
    expect(client.talentPoints()).toEqual({ total: 6, spent: 2 });
  });
});

describe('spectate client POV', () => {
  it('clears movement reconciliation state when the observed identity changes', () => {
    const client = bareClient(1, {
      movementWireVersion: 2,
      reconAuthoritativeX: 1,
      reconAuthoritativeY: 2,
      reconAuthoritativeZ: 3,
      reconPreviousAuthoritativeFacing: 0.25,
      reconAuthoritativeFacing: 0.5,
      reconAckClientTick: 17,
      reconOverrideEpoch: 4,
      reconOverrideActive: true,
      reconMoveSpeedMult: 1.5,
    });

    (client as any).onMessage(JSON.stringify({ t: 'spectate', name: 'Suspect' }));

    expect({
      x: client.reconAuthoritativeX,
      y: client.reconAuthoritativeY,
      z: client.reconAuthoritativeZ,
      previousFacing: client.reconPreviousAuthoritativeFacing,
      facing: client.reconAuthoritativeFacing,
      ackCt: client.reconAckClientTick,
      epoch: client.reconOverrideEpoch,
      active: client.reconOverrideActive,
      moveSpeedMult: client.reconMoveSpeedMult,
    }).toEqual({
      x: null,
      y: null,
      z: null,
      previousFacing: null,
      facing: null,
      ackCt: -1,
      epoch: 0,
      active: false,
      moveSpeedMult: 1,
    });
  });

  it('follows observed self, aligns on entry and respawn, then restores identity', () => {
    const client = bareClient(1);
    const internals = client as unknown as {
      applySnapshot(snapshot: unknown): void;
      onMessage(raw: string): void;
    };
    internals.applySnapshot({
      t: 'snap',
      ents: [],
      self: {
        id: 1,
        k: 'player',
        tid: 'warrior',
        nm: 'Moderator',
        lv: 10,
        x: 0,
        y: 0,
        z: 0,
        f: 0,
        hp: 100,
        mhp: 100,
        res: 0,
        mres: 100,
        rtype: 'rage',
      },
    });
    internals.onMessage(JSON.stringify({ t: 'spectate', name: 'Suspect' }));
    expect(client.spectating).toBe('Suspect');

    const snapshot = (facing: number, dead: boolean) => ({
      t: 'snap',
      ents: [],
      self: {
        id: 2,
        k: 'player',
        tid: 'rogue',
        nm: 'Suspect',
        lv: 10,
        x: 5,
        y: 0,
        z: 7,
        f: facing,
        hp: dead ? 0 : 100,
        mhp: 100,
        dead,
        res: dead ? 0 : 80,
        mres: 100,
        rtype: 'energy',
      },
    });

    internals.applySnapshot(snapshot(1.25, false));
    expect(client.playerId).toBe(2);
    expect(client.player.name).toBe('Suspect');
    expect(client.cfg.playerClass).toBe('rogue');
    expect(client.consumeSpectateFacing()).toBe(1.25);
    expect(client.consumeSpectateFacing()).toBeNull();

    internals.applySnapshot(snapshot(2.5, true));
    expect(client.consumeSpectateFacing()).toBeNull();
    internals.applySnapshot(snapshot(-0.75, false));
    expect(client.consumeSpectateFacing()).toBe(-0.75);
    expect(client.consumeSpectateFacing()).toBeNull();

    internals.onMessage(JSON.stringify({ t: 'spectate', name: null }));
    // Identity restores on the exit frame itself, but `spectating` (the HUD's
    // "this self view is mine" signal) is held until the next own self-decode
    // rebuilds the moderator's presentation (tests/spectate_exit_hold.test.ts).
    expect(client.spectating).toBe('Suspect');
    expect(client.playerId).toBe(1);
    expect(client.player.name).toBe('Moderator');
    expect(client.cfg.playerClass).toBe('warrior');
    expect(client.consumeSpectateFacing()).toBeNull();
    internals.applySnapshot({
      t: 'snap',
      ents: [],
      self: {
        id: 1,
        k: 'player',
        tid: 'warrior',
        nm: 'Moderator',
        lv: 10,
        x: 0,
        y: 0,
        z: 0,
        f: 0,
        hp: 100,
        mhp: 100,
      },
    });
    expect(client.spectating).toBeNull();
  });
});

describe('per-session isolation in the broadcast loop', () => {
  it('keeps broadcasting to healthy sessions when one session throws', () => {
    // Regression: the broadcast loop iterated every session unguarded, so a throw
    // while building one player's snapshot unwound the whole call and starved every
    // other session of its snapshot that tick (server/CLAUDE.md: one socket must
    // not crash the loop). forEachGuarded must isolate the bad session.
    const server = new GameServer();
    const before = fakeWs();
    const bad = fakeWs();
    const after = fakeWs();
    joinServer(server, before, 1, 'Before');
    const badSession = joinServer(server, bad, 2, 'Broken');
    // 'After' joins last, so it is iterated AFTER the throwing session: the real
    // regression is that this one used to be starved when 'Broken' threw.
    joinServer(server, after, 3, 'After');

    // Force a throw only while serializing the bad session's self payload.
    const original = (server as any).selfWireJson.bind(server);
    vi.spyOn(server as any, 'selfWireJson').mockImplementation((session: any, ...rest: any[]) => {
      if (session.pid === badSession.pid) throw new Error('corrupt self state');
      return original(session, ...rest);
    });

    expect(() => broadcast(server)).not.toThrow();
    // Both healthy sessions, on either side of the throw, still got a snapshot;
    // only the broken one was skipped.
    expect(lastSnap(before.sent)).not.toBeNull();
    expect(lastSnap(after.sent)).not.toBeNull();
    expect(lastSnap(bad.sent)).toBeNull();
  });
});

describe('raid lockouts over the wire', () => {
  it('ships a granted lockout in self.lockouts and ClientWorld mirrors it end to end', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Locked');
    const sim = (server as any).sim;
    const meta = sim.players.get(session.pid);
    const until = Date.now() + 5 * 60 * 60 * 1000;
    meta.raidLockouts.set('nythraxis_boss_arena', until);

    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.lockouts).toEqual({ nythraxis_boss_arena: until });

    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    const out = client.raidLockouts();
    expect(out.map((l) => l.id)).toEqual(['nythraxis_boss_arena']);
    expect(out[0].msRemaining).toBeGreaterThan(5 * 60 * 60 * 1000 - 5000);
  });

  it('clears the client lockout once the server-side entry has expired', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Expiring');
    const sim = (server as any).sim;
    const meta = sim.players.get(session.pid);
    meta.raidLockouts.set('nythraxis_boss_arena', Date.now() - 1000); // already past

    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.lockouts).toEqual({}); // server filters to future-only

    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.raidLockouts()).toEqual([]);
  });
});

// The held-items-on-the-mech fix is client render, but it depends on four wire
// fields the server must ship for a player: class (tid), cosmetic body (cat),
// equipped mainhand (mh), and equipped offhand (oh). This drives the real server
// emit into the real client mirror and checks the visual layer's inputs.
describe('Combat Mech held weapon over the wire', () => {
  it('mirrors a Rogue mech with independent mainhand and offhand weapons', () => {
    const sim = new Sim({
      seed: 7,
      playerClass: 'rogue',
      autoEquip: true,
      world: WIRE_TEST_WORLD,
    });
    const pid = sim.playerId;
    sim.setPlayerLevel(20, pid);
    sim.setPlayerSkin(pid, 0, 'mech');
    sim.addItem('keen_dirk', 1, pid);
    sim.equipItem('keen_dirk', pid);
    const e = sim.entities.get(pid)!;
    expect(e.mainhandItemId).toBe('rusty_dagger');
    expect(e.offhandItemId).toBe('keen_dirk');

    // server emit
    const w = wireEntity(e);
    expect(w.tid).toBe('rogue'); // class drives visualKeyFor and the hand-layout override
    expect(w.cat).toBe('mech'); // cosmetic body
    expect(w.mh).toBe('rusty_dagger');
    expect(w.oh).toBe('keen_dirk');

    // client mirror: a DIFFERENT local player seeing this rogue-mech in the world
    const client = bareClient(pid + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    const mirrored = client.entities.get(e.id)!;
    expect(mirrored.templateId).toBe('rogue');
    expect(mirrored.skinCatalog).toBe('mech');
    expect(mirrored.mainhandItemId).toBe('rusty_dagger');
    expect(mirrored.offhandItemId).toBe('keen_dirk');

    // what the renderer derives from the mirrored entity
    expect(visualKeyFor(mirrored)).toBe('player_mech');
    const override = mechHeldWeaponOverride(mirrored.templateId as PlayerClass);
    expect(override?.weaponSlots).toEqual([0]);
    expect(override?.offhandSlot).toBe(1);
  });

  it('mirrors a winning Warrior mech with its real shield offhand', () => {
    const sim = new Sim({
      seed: 7,
      playerClass: 'warrior',
      autoEquip: true,
      world: WIRE_TEST_WORLD,
    });
    const pid = sim.playerId;
    sim.setPlayerSkin(pid, 0, 'mech');
    sim.addItem('worn_sword', 1, pid);
    sim.equipItem('worn_sword', pid);
    const e = sim.entities.get(pid)!;

    const client = bareClient(pid + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    const mirrored = client.entities.get(e.id)!;
    expect(mirrored.skinCatalog).toBe('mech');
    expect(mirrored.mainhandItemId).toBe('worn_sword');
    expect(mirrored.offhandItemId).toBe('eastbrook_buckler');
    expect(visualKeyFor(mirrored)).toBe('player_mech');
    expect(mechHeldWeaponOverride(mirrored.templateId as PlayerClass)).toMatchObject({
      weaponSlots: [0],
      offhandSlot: 1,
    });
  });
});

describe('channel target over the wire', () => {
  it('lets a late observer reconstruct the Drain Life tether from snapshot state', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warlock' });
    const caster = sim.player;
    caster.castingAbility = 'drain_life';
    caster.channeling = true;
    caster.castRemaining = 3.25;
    caster.castTotal = 5;
    caster.castTargetId = 91;

    const wire = wireEntity(caster);
    expect(wire.castTgt).toBe(91);

    const client = bareClient(caster.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    const mirrored = client.entities.get(caster.id)!;
    expect(mirrored.castingAbility).toBe('drain_life');
    expect(mirrored.channeling).toBe(true);
    expect(mirrored.castTargetId).toBe(91);
    expect(mirrored.castRemaining).toBe(3.25);
  });
});

describe('pet signature skill over the wire', () => {
  it('mirrors the visible cooldown and autocast state used by the pet bar', () => {
    const pet = createMob(9301, MOBS.gloomshade, 20, { x: 0, y: 0, z: 0 });
    pet.ownerId = 42;
    pet.petSkillTimer = 12.35;
    pet.petAutoSkill = true;

    const wire = wireEntity(pet);
    expect(wire.ps).toBe(12.35);
    expect(wire.px).toBe(1);

    const client = bareClient(42);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    const mirrored = client.entities.get(pet.id)!;
    expect(mirrored.petSkillTimer).toBe(12.35);
    expect(mirrored.petAutoSkill).toBe(true);
  });

  it('keeps a ready manual signature skill sparse and resets stale mirror state', () => {
    const pet = createMob(9302, MOBS.emberkin, 20, { x: 0, y: 0, z: 0 });
    pet.ownerId = 42;
    const readyWire = wireEntity(pet);
    expect(readyWire).not.toHaveProperty('ps');
    expect(readyWire).not.toHaveProperty('px');

    const client = bareClient(42);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [{ ...readyWire, ps: 4, px: 1 }],
    });
    (client as any).applySnapshot({ t: 'snap', ents: [readyWire] });
    const mirrored = client.entities.get(pet.id)!;
    expect(mirrored.petSkillTimer).toBe(0);
    expect(mirrored.petAutoSkill).toBe(false);
  });
});

describe('target swing timer over the wire', () => {
  it('mirrors a non-self mob auto-attacking, gated on autoAttack', () => {
    const mob = createMob(9310, MOBS.forest_wolf, 5, { x: 0, y: 0, z: 0 });
    mob.autoAttack = true;
    mob.swingTimer = 1.42;

    const wire = wireEntity(mob);
    expect(wire.swing).toBe(1.42);

    const client = bareClient(42);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    const mirrored = client.entities.get(mob.id)!;
    expect(mirrored.autoAttack).toBe(true);
    expect(mirrored.swingTimer).toBe(1.42);
  });

  it('omits swing and resets a stale mirror when the mob is not auto-attacking', () => {
    const mob = createMob(9311, MOBS.forest_wolf, 5, { x: 0, y: 0, z: 0 });
    mob.autoAttack = false;
    mob.swingTimer = 0.5; // stale/frozen value while disengaged; must not ride the wire

    const idleWire = wireEntity(mob);
    expect(idleWire).not.toHaveProperty('swing');

    const client = bareClient(42);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [
        {
          ...idleWire,
          id: mob.id,
          k: 'mob',
          tid: mob.templateId,
          nm: mob.name,
          lv: mob.level,
          swing: 1.1,
        },
      ],
    });
    (client as any).applySnapshot({ t: 'snap', ents: [idleWire] });
    const mirrored = client.entities.get(mob.id)!;
    expect(mirrored.autoAttack).toBe(false);
    expect(mirrored.swingTimer).toBe(0);
  });
});

// Operator-set account flair (the [AI] mark + an official streamer's links). The
// wire keys `ai` and `slk` ARE the protocol, so pin both halves together: the REAL
// server emit (wireEntity) into the REAL client mirror (applySnapshot). Pinning only
// the decode (a hand-built wire record) would let the server rename or drop the key
// with every test still green, which is exactly the hole this closes.
describe('account flair over the wire', () => {
  const LINKS = {
    twitch: 'https://twitch.tv/someone',
    youtube: 'https://youtu.be/abc',
  };

  it('mirrors the AI mark and the streamer links onto another player client', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warrior' });
    const e = sim.player;
    // What the server stamps on the entity once an operator sets the flair
    // (GameServer.applyAccountFlairLive; the wireStreamerLinks gate runs there).
    e.aiAccount = true;
    e.streamerLinks = { ...LINKS };

    const wire = wireEntity(e);
    expect(wire.ai).toBe(1); // the wire key is `ai`, encoded as 1 (sparse)
    expect(wire.slk).toEqual(LINKS); // the wire key is `slk`

    // A DIFFERENT player's client seeing this streamer in the world.
    const client = bareClient(e.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    const mirrored = client.entities.get(e.id)!;
    expect(mirrored.aiAccount).toBe(true);
    expect(mirrored.streamerLinks).toEqual(LINKS);
  });

  it('leaves an ordinary player unmarked, with neither key on the wire', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warrior' });
    const e = sim.player;

    const wire = wireEntity(e);
    // Absent, not `ai: 0` / `slk: {}`: an ordinary player's identity record must be
    // byte-unchanged by this feature, or every entity on screen pays for it.
    expect(wire).not.toHaveProperty('ai');
    expect(wire).not.toHaveProperty('slk');

    const client = bareClient(e.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    const mirrored = client.entities.get(e.id)!;
    expect(mirrored.aiAccount).toBe(false);
    expect(mirrored.streamerLinks).toBeUndefined();
  });

  it('drops a hostile link at the client boundary even if one reached the wire', () => {
    const sim = new Sim({ seed: 7, playerClass: 'warrior' });
    const e = sim.player;
    // The server gates this twice (admin write + wireStreamerLinks), so this record
    // cannot occur in production. The point is that the CLIENT re-sanitizes anyway:
    // a link that survives to a client must never reach window.open.
    const wire = { ...wireEntity(e), slk: { twitch: 'javascript:alert(1)' } };

    const client = bareClient(e.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    expect(client.entities.get(e.id)!.streamerLinks).toBeUndefined();
  });
});

// Corpse harvest claims over the wire. The corpse picker
// (src/game/corpse_loot_availability.ts) reads mob.harvestClaimedBy; offline the
// Sim entity carries it, so online the same field must ride the sparse terse key
// `hcb` or the online picker keeps offering already-claimed corpses. Same pin
// shape as the account-flair suite above: the REAL server emit (wireEntity) into
// the REAL client mirror (applySnapshot), never a hand-built wire record alone.
describe('corpse harvest claim over the wire', () => {
  function deadWolfCorpse(id: number): ReturnType<typeof createMob> {
    const template = MOBS.forest_wolf;
    const mob = createMob(id, template, template.maxLevel, {
      x: 0,
      y: 0,
      z: 0,
    });
    mob.dead = true;
    return mob;
  }

  it('mirrors the claimer pid onto another player client via hcb', () => {
    const claimer = 42;
    const mob = deadWolfCorpse(9001);
    mob.harvestClaimedBy = claimer;

    const w = wireEntity(mob);
    expect(w.hcb).toBe(claimer);

    const client = bareClient(claimer + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    expect(client.entities.get(mob.id)!.harvestClaimedBy).toBe(claimer);
  });

  it('keeps an unclaimed corpse sparse: no hcb key, mirrored as null', () => {
    const mob = deadWolfCorpse(9002);

    const w = wireEntity(mob);
    // Absent, not `hcb: null`: an unclaimed corpse's record must be byte-unchanged
    // by this feature, so the per-entity delta cache keeps eliding it.
    expect(w).not.toHaveProperty('hcb');

    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    expect(client.entities.get(mob.id)!.harvestClaimedBy).toBeNull();
  });

  it('clears a stale mirrored claim when a later record arrives without hcb', () => {
    const mob = deadWolfCorpse(9003);
    mob.harvestClaimedBy = 42;

    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(mob)] });
    expect(client.entities.get(mob.id)!.harvestClaimedBy).toBe(42);

    // Respawn clears the claim server-side (src/sim/mob/lifecycle.ts); the next
    // record simply omits hcb, and the mirror must reset, not keep the stale pid.
    mob.harvestClaimedBy = null;
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(mob)] });
    expect(client.entities.get(mob.id)!.harvestClaimedBy).toBeNull();
  });
});

describe('ledge climb over the wire (cl progress)', () => {
  function climbingPlayer(): {
    e: ReturnType<Sim['entities']['get']> & object;
  } {
    const sim = new Sim({ seed: 1, playerClass: 'warrior', noPlayer: true });
    const pid = sim.addPlayer('warrior', 'Scaler');
    const e = sim.entities.get(pid)!;
    return { e };
  }

  it('quantizes the pull progress out and mirrors it 0..1 on the client', () => {
    const { e } = climbingPlayer();
    expect(wireEntity(e)).not.toHaveProperty('cl');

    e.climb = {
      from: { x: e.pos.x, y: e.pos.y, z: e.pos.z },
      to: { x: e.pos.x, y: e.pos.y + 2, z: e.pos.z + 0.5 },
      elapsed: 0.25,
      duration: 0.5,
    };
    expect(wireEntity(e).cl).toBe(50);
    // Just armed: still non-zero, so any client reads it as climbing.
    e.climb.elapsed = 0;
    expect(wireEntity(e).cl).toBe(1);
    // Nearly done: capped inside 99, never rounding to a falsy 0 or a lying 100.
    e.climb.elapsed = 0.499;
    expect(wireEntity(e).cl).toBe(99);

    e.climb.elapsed = 0.25;
    const client = bareClient(9);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    const remote = client.entities.get(e.id)!;
    expect(remote.climbing).toBe(true);
    expect(remote.climbProgress).toBeCloseTo(0.5, 6);
  });

  it('clears the mirror when a later record arrives without cl', () => {
    const { e } = climbingPlayer();
    e.climb = {
      from: { x: e.pos.x, y: e.pos.y, z: e.pos.z },
      to: { x: e.pos.x, y: e.pos.y + 2, z: e.pos.z + 0.5 },
      elapsed: 0.1,
      duration: 0.5,
    };
    const client = bareClient(9);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    expect(client.entities.get(e.id)!.climbing).toBe(true);

    e.climb = null; // the pull completed server-side
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    expect(client.entities.get(e.id)!.climbing).toBe(false);
    expect(client.entities.get(e.id)!.climbProgress).toBeUndefined();
  });

  it('mirrors active Vaulting Charge flight and clears when the leap is absent', () => {
    const { e } = climbingPlayer();
    expect(wireEntity(e)).not.toHaveProperty('lp');

    e.leap = {
      from: { x: e.pos.x, y: e.pos.y, z: e.pos.z },
      to: { x: e.pos.x + 8, y: e.pos.y, z: e.pos.z + 12 },
      elapsed: 0.1,
      duration: 0.5,
      apex: 4,
      landingAoe: { min: 1, max: 2, radius: 3 },
      abilityName: 'Vaulting Charge',
      abilityId: 'heroic_leap',
      school: 'physical',
    };
    expect(wireEntity(e).lp).toBe(1);

    const client = bareClient(9);
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    expect(client.entities.get(e.id)!.leaping).toBe(true);

    e.leap = null;
    (client as any).applySnapshot({ t: 'snap', ents: [wireEntity(e)] });
    expect(client.entities.get(e.id)!.leaping).toBe(false);
  });
});

// Loot owner-lock lapse (FFA) over the wire. The rights-aware corpse picker
// (src/game/corpse_loot_availability.ts) reads mob.lootFfaTimer; offline the
// Sim entity carries the real countdown, so online the LAPSE must ride the
// sparse terse key `ffa` or a stranger's aged-out corpse stays unofferable
// forever (the old hardcoded Infinity mirror). Same pin shape as the hcb suite
// above: the REAL server emit into the REAL client mirror.
describe('loot FFA lapse over the wire', () => {
  const TAPPER = 42;

  function strangerCorpse(id: number, lootFfaTimer: number): ReturnType<typeof createMob> {
    const template = MOBS.forest_wolf;
    const mob = createMob(id, template, template.maxLevel, {
      x: 0,
      y: 0,
      z: 0,
    });
    mob.dead = true;
    mob.lootable = true;
    mob.corpseTimer = 45;
    mob.tappedById = TAPPER;
    // claimed: keeps the harvest arm closed so canOpen isolates loot rights
    mob.harvestClaimedBy = TAPPER;
    mob.lootFfaTimer = lootFfaTimer;
    mob.loot = { copper: 10, items: [{ itemId: 'wolf_fang', count: 1 }] };
    return mob;
  }

  it('a fresh owner-locked corpse stays sparse (no ffa key) and unofferable to a stranger', () => {
    const w = wireEntity(strangerCorpse(9101, 60));
    // Absent, not `ffa: 0`: a still-locked corpse's record must be byte-unchanged
    // by this feature, so the per-entity delta cache keeps eliding it.
    expect(w).not.toHaveProperty('ffa');

    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    const mirrored = client.entities.get(9101)!;
    expect(mirrored.lootFfaTimer).toBe(Infinity);
    expect(corpseLootAvailability(mirrored, 1).canOpen).toBe(false);
  });

  it('the lapse rides ffa:1, mirrors as lapsed, and reopens the picker for a stranger', () => {
    const w = wireEntity(strangerCorpse(9102, 0));
    expect(w.ffa).toBe(1);

    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    const mirrored = client.entities.get(9102)!;
    expect(corpseLootAvailability(mirrored, 1).canOpen).toBe(true);
    expect(corpseLootAvailability(mirrored, 1).hasLoot).toBe(true);
  });

  it('a record without the flag resets a stale mirrored lapse (respawn reuses the id)', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [wireEntity(strangerCorpse(9103, 0))],
    });
    expect(corpseLootAvailability(client.entities.get(9103)!, 1).canOpen).toBe(true);

    (client as any).applySnapshot({
      t: 'snap',
      ents: [wireEntity(strangerCorpse(9103, 60))],
    });
    expect(client.entities.get(9103)!.lootFfaTimer).toBe(Infinity);
    expect(corpseLootAvailability(client.entities.get(9103)!, 1).canOpen).toBe(false);
  });

  it('never emits ffa for a non-lootable entity even with a lapsed timer', () => {
    const template = MOBS.forest_wolf;
    const alive = createMob(9104, template, template.maxLevel, {
      x: 0,
      y: 0,
      z: 0,
    });
    alive.lootFfaTimer = 0;
    expect(wireEntity(alive)).not.toHaveProperty('ffa');
  });
});

// Corpse decay over the wire, the same shape as the ffa suite above: offline
// the Sim entity carries the real corpseTimer countdown, so online the DECAY
// must ride the sparse terse key `cd` or a self-scheduled rare's aged-out
// corpse (Grix the Tunnelking: a 15 to 30 minute respawnWindow far outlasts
// his 60s corpseTimer, see tests/respawn_policy.test.ts) stays a rendered,
// unclickable "stuck corpse" for the rest of the respawn wait, the reported
// bug entity_view_policy_core.ts's admission check now fixes.
describe('corpse decay over the wire', () => {
  function deadMob(id: number, corpseTimer: number): ReturnType<typeof createMob> {
    const template = MOBS.grix_the_tunnelking;
    const mob = createMob(id, template, template.maxLevel, {
      x: 0,
      y: 0,
      z: 0,
    });
    mob.dead = true;
    mob.corpseTimer = corpseTimer;
    mob.respawnTimer = 1800; // far outside the corpse window, like Grix's real one
    return mob;
  }

  it('a fresh corpse stays sparse (no cd key) while inside its loot window', () => {
    const w = wireEntity(deadMob(9201, 45));
    // Absent, not `cd: 0`: an undecayed corpse's record must be byte-unchanged
    // by this feature, so the per-entity delta cache keeps eliding it.
    expect(w).not.toHaveProperty('cd');

    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    expect(client.entities.get(9201)!.corpseTimer).toBeGreaterThan(0);
  });

  it('the decay rides cd:1 once the corpse window elapses, and mirrors as decayed', () => {
    const w = wireEntity(deadMob(9202, 0));
    expect(w.cd).toBe(1);

    const client = bareClient(1);
    (client as any).applySnapshot({ t: 'snap', ents: [w] });
    expect(client.entities.get(9202)!.corpseTimer).toBeLessThanOrEqual(0);
  });

  it('a record without the flag resets a stale mirrored decay (respawn reuses the id)', () => {
    const client = bareClient(1);
    (client as any).applySnapshot({
      t: 'snap',
      ents: [wireEntity(deadMob(9203, 0))],
    });
    expect(client.entities.get(9203)!.corpseTimer).toBeLessThanOrEqual(0);

    (client as any).applySnapshot({
      t: 'snap',
      ents: [wireEntity(deadMob(9203, 45))],
    });
    expect(client.entities.get(9203)!.corpseTimer).toBeGreaterThan(0);
  });

  it('never emits cd for a live mob, even with a stale zero corpseTimer field', () => {
    const template = MOBS.forest_wolf;
    const alive = createMob(9204, template, template.maxLevel, {
      x: 0,
      y: 0,
      z: 0,
    });
    alive.corpseTimer = 0;
    expect(wireEntity(alive)).not.toHaveProperty('cd');
  });
});

describe('combat ratings over the wire', () => {
  it('mirrors Ranged Attack Power so online hunter attack-spell tooltips can scale', () => {
    const sim = new Sim({
      seed: 7,
      playerClass: 'hunter',
      autoEquip: true,
      world: WIRE_TEST_WORLD,
    });
    sim.setPlayerLevel(20);
    sim.tick();
    const e = sim.player;
    expect(e.rangedPower).toBeGreaterThan(0);

    const wire = wireEntity(e);
    expect(wire.rp).toBe(e.rangedPower);

    const client = bareClient(e.id + 1000);
    (client as any).applySnapshot({ t: 'snap', ents: [wire] });
    const mirrored = client.entities.get(e.id)!;
    expect(mirrored.rangedPower).toBe(e.rangedPower);
  });
});

// The static combat-rating/progression scalars (ap/sp/sh/crit/dodge/blk/bval/
// crat/hrat/hirat/xp/lxp/rxp/prk/copper/ddiff) used to ride the unconditional
// base self object every tick for every player, unlike every other heavy field
// on the same record. They now go through the same `maybe(...)` delta gate
// (server/game.ts), so an unchanged value elides from the wire entirely; the
// decoder (src/net/online.ts) falls back to the prior mirrored value instead
// of a hardcoded default when the key is absent.
describe('static combat-rating/progression scalars ride the delta gate', () => {
  const SCALAR_KEYS = [
    'ap',
    'sp',
    'sh',
    'crit',
    'dodge',
    'blk',
    'bval',
    'crat',
    'hrat',
    'hirat',
    'xp',
    'lxp',
    'rxp',
    'prk',
    'copper',
    'ddiff',
  ] as const;

  it('rides the first snapshot, elides once quiet, and resends only the field that actually moved', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 91, 'Ratings');
    const meta = server.sim.meta(session.pid)!;
    const p = server.sim.entities.get(session.pid)!;

    // A fresh session has an empty lastSent, so every one of these rides the
    // very first snapshot, same as every other maybe() delta key.
    broadcast(server);
    const first = lastSnap(fc.sent);
    for (const key of SCALAR_KEYS) {
      expect(first.self, `self.${key} missing from first snapshot`).toHaveProperty(key);
    }
    const client = bareClient(session.pid);
    (client as any).applySnapshot(first);
    expect(client.player.attackPower).toBe(p.attackPower);
    expect(client.player.critChance).toBe(p.critChance);
    expect(client.player.dodgeChance).toBe(p.dodgeChance);
    expect(client.copper).toBe(meta.copper);
    expect(client.xp).toBe(meta.xp);

    // The mechanism this PR adds: a second, no-op broadcast with nothing about
    // combat ratings or progression changed must OMIT every one of these keys
    // (fewer bytes built and shipped per player per tick), and applying that
    // delta-less snapshot must NOT reset the mirrored values to a default.
    fc.sent.length = 0;
    broadcast(server);
    const quiet = lastSnap(fc.sent);
    for (const key of SCALAR_KEYS) {
      expect(quiet.self, `self.${key} resent although unchanged`).not.toHaveProperty(key);
    }
    (client as any).applySnapshot(quiet);
    expect(client.player.attackPower).toBe(p.attackPower);
    expect(client.player.critChance).toBe(p.critChance);
    expect(client.player.dodgeChance).toBe(p.dodgeChance);
    expect(client.copper).toBe(meta.copper);
    expect(client.xp).toBe(meta.xp);

    // A real gear change bumps attackPower: only `ap` rides on the next
    // snapshot, proving the gate detects a genuine change precisely (not just
    // that it stays quiet), while every other scalar in the cohort keeps eliding.
    p.attackPower += 25;
    fc.sent.length = 0;
    broadcast(server);
    const changed = lastSnap(fc.sent);
    expect(changed.self.ap).toBe(p.attackPower);
    for (const key of SCALAR_KEYS) {
      if (key === 'ap') continue;
      expect(changed.self, `self.${key} resent although unchanged`).not.toHaveProperty(key);
    }
    (client as any).applySnapshot(changed);
    expect(client.player.attackPower).toBe(p.attackPower);
  });
});
