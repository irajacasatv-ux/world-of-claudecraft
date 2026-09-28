// The delta core of the self-snapshot wire: the delta-key registry (DELTA_KEYS,
// ALL_DELTA_KEYS, CAPABILITY_DELTA_KEYS, DENSE_DELTA_KEYS, TERSE_TO_IWORLD) and
// the suites that iterate it: delta snapshots, the full self-state delta fixture
// built by dirtyEveryDeltaField, and the anti-drift contract pins that scrape
// the server emitters. Themed wire suites were split out of this file on
// 2026-09-27 into tests/snapshots_<topic>.test.ts; their shared fixtures live in
// tests/helpers/snapshot_wire.ts and the db mock in tests/helpers/snapshot_db_mock.ts.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeCraftCast } from './helpers/enchant_family_cast';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { stripComments } from './helpers/strip_comments';
import { tsFilesUnder } from './helpers/ts_files_under';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { type ClientSession, GameServer } from '../server/game';
import { consumeMovementFramesV2 } from '../server/movement_input_timeline_v2';
import { updateMovementOverrideEpochs } from '../server/movement_override_epoch';
import { EMPTY_MST_CRAFTS } from '../src/net/crafting_wire';
import { CLUE_HUNTS } from '../src/sim/content/clue_hunts';
import { CRAFT_RING, STATION_RADIUS } from '../src/sim/content/professions';
import { COMBO_RECIPES } from '../src/sim/content/recipes';
import { TREASURE_SITES } from '../src/sim/content/treasure_maps';
import { NORTH_WATCH_CANNON } from '../src/sim/content/vehicle_stations';
import { DELVES, GATHER_NODES, ITEMS, WORLD_QUESTS } from '../src/sim/data';
import { emptySaleLog } from '../src/sim/market_sale_log';
import { createCannonEncounter } from '../src/sim/minigames/cannon_encounter';
import { livePlaytimeSeconds } from '../src/sim/playtime';
import { spawnHillNow } from '../src/sim/pvp';
import { interactObjectCreditKey } from '../src/sim/quests/interact_object_credit';
import { noteRelicItemFind, noteRelicObtain } from '../src/sim/reliquary';
import type { Aura, SimEvent } from '../src/sim/types';
import { terrainHeight } from '../src/sim/world';
import { WORLD_BOSSES } from '../src/sim/world_boss';
import { onMobKilledForWorldQuests, worldQuestCycleForResetDay } from '../src/sim/world_quests';
import { buildCraftingView } from '../src/ui/hud/professions/crafting_view';
import { playtimeParts } from '../src/ui/playtime_view';
import {
  bareClient,
  broadcast,
  type FakeClient,
  fakeWs,
  joinServer,
  lastSnap,
} from './helpers/bare_client';
import { FAR_FUTURE_MS, type SnapshotApplier } from './helpers/snapshot_wire';

const DELTA_KEYS = [
  'inv',
  'buyback',
  'equip',
  'qlog',
  'qdone',
  'wkexp',
  'wkq',
  'wqday',
  'wqexp',
  'wqlog',
  'fac',
  'facCur',
  'wqrr',
  'wqrep',
  'cluh',
  'lockouts',
  'cds',
  'stats',
  'weapon',
  'offhandWeapon',
  'party',
  'trade',
  'duel',
  'honor',
  'lhonor',
  'corpse',
];

describe('delta snapshots', () => {
  let server: GameServer;
  let fc: FakeClient;
  let session: ClientSession;

  beforeEach(() => {
    server = new GameServer();
    fc = fakeWs();
    session = joinServer(server, fc, 1, 'Testa');
  });

  it('first snapshot carries the full self state', () => {
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap).not.toBeNull();
    // a fresh session has an empty lastSent, so EVERY maybe() delta key rides the
    // first snapshot (even the null-valued ones like party/trade/bank); every
    // key in ALL_DELTA_KEYS
    for (const key of DENSE_DELTA_KEYS) {
      expect(snap.self, `self.${key} missing from first snapshot`).toHaveProperty(key);
    }
    expect(snap.self.party).toBeNull();
    expect(snap.self.trade).toBeNull();
    expect(Array.isArray(snap.self.inv)).toBe(true);
    expect(Array.isArray(snap.ents)).toBe(true);
  });

  it('round-trips lifetime played time minute-quantized on ptime', () => {
    // The encoder floors to whole minutes (still in seconds on the wire) so
    // the serialized form only changes about once a minute and the delta gate
    // drops the key from every other tick; the decoder mirrors it verbatim.
    const meta = server.sim.players.get(session.pid)!;
    meta.totalPlayedSeconds = 3725; // 1h 2m 5s baseline, sim.time still ~0
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.ptime).toBe(3720);

    const client = bareClient(session.pid);
    (client as unknown as SnapshotApplier).applySnapshot(snap);
    expect(client.playtimeSeconds).toBe(3720);

    // Unchanged within the same minute: the next snapshot omits the key, and
    // the delta-guarded decode keeps the prior mirror instead of wiping it.
    broadcast(server);
    const snap2 = lastSnap(fc.sent);
    expect(snap2.self).not.toHaveProperty('ptime');
    (client as unknown as SnapshotApplier).applySnapshot(snap2);
    expect(client.playtimeSeconds).toBe(3720);

    // The elapsed-session arm: once the sim clock crosses the next whole
    // minute the quantized value re-ships and tracks the live total.
    (server.sim as { time: number }).time += 61;
    broadcast(server);
    const snap3 = lastSnap(fc.sent);
    expect(snap3.self.ptime).toBe(3780);
    (client as unknown as SnapshotApplier).applySnapshot(snap3);
    expect(client.playtimeSeconds).toBe(3780);

    // Cross-host display agreement, pinned ABSOLUTELY on both sides (3725s
    // baseline + 61s session = 1h 3m): the offline formula serves unfloored
    // seconds while the online mirror is minute-quantized, and the sheet's
    // minute-flooring parts split must render both identically. The offline
    // arm anchors on the session's own meta (not Sim.primary, which is only
    // coincidentally the same character in this harness), and the literal
    // expectation keeps the pin decisive inside this file even if
    // playtimeParts itself regresses.
    expect(playtimeParts(client.playtimeSeconds)).toEqual({
      days: 0,
      hours: 1,
      minutes: 3,
    });
    expect(playtimeParts(livePlaytimeSeconds(meta, server.sim.time))).toEqual({
      days: 0,
      hours: 1,
      minutes: 3,
    });
  });

  it('round-trips the Hunter reactive window as remaining seconds', () => {
    const player = server.sim.entities.get(session.pid)!;
    player.overpowerUntil = server.sim.time + 4.25;

    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.opUntil).toBe(1);
    expect(snap.self.opRem).toBe(4.25);

    const client = bareClient(session.pid, { playerClass: 'hunter' });
    const now = vi.spyOn(performance, 'now').mockReturnValue(10_000);
    (client as unknown as SnapshotApplier).applySnapshot(snap);
    expect(client.reactiveAbilityWindowRemaining('mongoose_bite')).toBe(4.25);
    expect(client.reactiveAbilityWindowRemaining('another_ability')).toBe(0);
    now.mockReturnValue(12_500);
    expect(client.reactiveAbilityWindowRemaining('mongoose_bite')).toBe(1.75);
    now.mockReturnValue(14_250);
    expect(client.reactiveAbilityWindowRemaining('mongoose_bite')).toBe(0);

    const releaseSnapshot = structuredClone(snap);
    delete releaseSnapshot.self.opRem;
    (client as unknown as SnapshotApplier).applySnapshot(releaseSnapshot);
    expect(client.reactiveAbilityWindowRemaining('mongoose_bite')).toBe(0);

    player.overpowerUntil = -1;
    broadcast(server);
    const expiredSnapshot = lastSnap(fc.sent);
    expect(expiredSnapshot.self.opUntil).toBe(0);
    expect(expiredSnapshot.self.opRem).toBe(0);
    (client as unknown as SnapshotApplier).applySnapshot(expiredSnapshot);
    expect(client.reactiveAbilityWindowRemaining('mongoose_bite')).toBe(0);
    now.mockRestore();
  });

  it('mirrors account-wide cosmetic unlocks from self snapshots', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const joined = server.join(fc.ws, 1, 1, 'Cosmetic', 'warrior', null, false, {
      accountCosmetics: {
        completedQuestIds: ['q_aldrics_fallen_star'],
        mechChromaIds: ['amber_crimson'],
        weaponSkinIds: [],
        weaponSkinLoadout: {},
        mountSkinIds: [],
      },
    });
    if ('error' in joined) throw new Error(joined.error);
    const session = joined;
    session.blockListLoaded = true;
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.cosmetics).toEqual({
      completedQuestIds: ['q_aldrics_fallen_star'],
      mechChromaIds: ['amber_crimson'],
      weaponSkinIds: [],
      weaponSkinLoadout: {},
      mountSkinIds: [],
    });

    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.accountCosmetics).toEqual({
      completedQuestIds: ['q_aldrics_fallen_star'],
      mechChromaIds: ['amber_crimson'],
      weaponSkinIds: [],
      weaponSkinLoadout: {},
      mountSkinIds: [],
    });
  });

  it('mirrors live cosmetic appearance catalog through snapshots', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const joined = server.join(fc.ws, 1, 1, 'Mechlive', 'shaman', null);
    if ('error' in joined) throw new Error(joined.error);
    const session = joined;
    session.blockListLoaded = true;
    server.sim.setPlayerSkin(session.pid, 0, 'mech');

    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.cat).toBe('mech');

    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.player.skinCatalog).toBe('mech');
  });

  it('omits unchanged heavy fields from subsequent snapshots', () => {
    broadcast(server);
    fc.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    const snap = lastSnap(fc.sent);
    // This single-tick test stays on the decay-safe subset: cds and the timer-backed
    // keys (delve/arena timers, delveDaily) can re-emit after a real sim.tick(), so the
    // widened all-27 omission is proven by the no-op re-broadcast test instead.
    for (const key of DELTA_KEYS) {
      expect(snap.self, `self.${key} resent although unchanged`).not.toHaveProperty(key);
    }
    // the always-on fields are still present every snapshot. xp/copper moved
    // behind the delta gate alongside the rest of the static combat-rating/
    // progression cohort (server/game.ts), so they are no longer in this list.
    for (const key of ['x', 'z', 'hp', 'mhp', 'res', 'gcd', 'pcd', 'swing', 'swingOff', 'target']) {
      expect(snap.self).toHaveProperty(key);
    }
    // xp/copper are unchanged since the first broadcast, so they delta-elide here.
    for (const key of ['xp', 'copper']) {
      expect(snap.self, `self.${key} resent although unchanged`).not.toHaveProperty(key);
    }
  });

  it('mirrors the swing timer to the online client for the swing-timer HUD bar', () => {
    const player = server.sim.entities.get(session.pid)!;
    player.swingTimer = 1.7;
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.swing).toBeCloseTo(1.7, 1);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.player.swingTimer).toBeCloseTo(1.7, 1);
  });

  it('mirrors the off-hand swing timer and weapon for the melee-weaving HUD bar; dualWielding is derived client-side', () => {
    const player = server.sim.entities.get(session.pid)!;
    player.dualWielding = true;
    player.offhandWeapon = { min: 3, max: 6, speed: 1.8 };
    player.offhandSwingTimer = 0.9;
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.swingOff).toBeCloseTo(0.9, 1);
    expect(snap.self.offhandWeapon).toMatchObject({ speed: 1.8 });
    // dualWielding rides no wire key of its own: it is always exactly
    // offhandWeapon !== null (src/sim/entity.ts), so it is absent from the
    // wire and derived by applySelfCombatScalars instead.
    expect(snap.self).not.toHaveProperty('dualWielding');
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.player.offhandSwingTimer).toBeCloseTo(0.9, 1);
    expect(client.player.dualWielding).toBe(true);
    expect(client.player.offhandWeapon).toMatchObject({ speed: 1.8 });
  });

  it('clears a mirrored off-hand weapon back to null when it is unequipped, and re-derives dualWielding false', () => {
    const player = server.sim.entities.get(session.pid)!;
    player.dualWielding = true;
    player.offhandWeapon = { min: 3, max: 6, speed: 1.8 };
    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.player.offhandWeapon).not.toBeNull();
    expect(client.player.dualWielding).toBe(true);

    player.dualWielding = false;
    player.offhandWeapon = null;
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.player.offhandWeapon).toBeNull();
    expect(client.player.dualWielding).toBe(false);
  });

  it('mirrors the shared potion cooldown to the online client for the action-bar swipe', () => {
    const player = server.sim.entities.get(session.pid)!;
    player.potionCdRemaining = 95.5;
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.pcd).toBeCloseTo(95.5, 1);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.player.potionCdRemaining).toBeCloseTo(95.5, 1);
  });

  it('includes live aura and movement diagnostics in admin online rows', () => {
    const druidServer = new GameServer();
    const fc = fakeWs();
    const druid = joinServer(druidServer, fc, 10, 'Newkali', 'druid');
    const player = druidServer.sim.entities.get(druid.pid)!;
    druidServer.sim.setPlayerLevel(20, druid.pid);
    player.resource = player.maxResource;

    druidServer.sim.castAbility('travel_form', druid.pid);
    druidServer.sim.tick();
    // Every shift now grants the baseline Loping Stride burst (60% for 3 sec,
    // combat/druid_engines.ts); this row reads the FORM's own speed, so shed it.
    player.auras = player.auras.filter((aura) => aura.id !== 'loping_stride');

    const row = druidServer.liveSessions().find((p) => p.characterId === 10)!;
    expect(row.moveSpeedMultiplier).toBeCloseTo(1.4);
    expect(row.runSpeed).toBeCloseTo(9.8);
    expect(row.swimming).toBe(false);
    expect(row.auras).toContainEqual(
      expect.objectContaining({
        id: 'travel_form',
        name: 'Fleet Form',
        kind: 'form_travel',
        value: 1.4,
      }),
    );
  });

  it('sell command forwards bounded stack quantities', () => {
    const player = server.sim.entities.get(session.pid)!;
    const vendor = [...server.sim.entities.values()].find((e) => e.templateId === 'trader_wilkes')!;
    player.pos = { ...vendor.pos, x: vendor.pos.x + 2 };
    player.prevPos = { ...player.pos };
    server.sim.addItem('wolf_fang', 5, session.pid);

    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'sell', item: 'wolf_fang', count: 3 }),
    );

    expect(server.sim.meta(session.pid)?.copper).toBe(12);
    expect(server.sim.countItem('wolf_fang', session.pid)).toBe(2);

    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'sell', item: 'wolf_fang', count: 99 }),
    );

    expect(server.sim.meta(session.pid)?.copper).toBe(20);
    expect(server.sim.countItem('wolf_fang', session.pid)).toBe(0);
  });

  it('discard command mirrors inventory and quest progress changes', () => {
    const meta = server.sim.meta(session.pid)!;
    meta.questLog.set('q_widows', {
      questId: 'q_widows',
      counts: [10, 0],
      state: 'active',
    });
    server.sim.addItem('widow_venom_sac', 6, session.pid);
    broadcast(server);
    fc.sent.length = 0;

    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'discard',
        item: 'widow_venom_sac',
        count: 2,
      }),
    );
    broadcast(server);

    expect(server.sim.countItem('widow_venom_sac', session.pid)).toBe(4);
    expect(meta.questLog.get('q_widows')).toMatchObject({
      counts: [10, 4],
      state: 'active',
    });
    const snap = lastSnap(fc.sent);
    // The wire mirrors the whole inventory (starter rations included); pin the
    // discarded stack's mirrored count.
    expect(snap.self.inv.filter((s: { itemId: string }) => s.itemId === 'widow_venom_sac')).toEqual(
      [{ itemId: 'widow_venom_sac', count: 4 }],
    );
    expect(snap.self.qlog).toEqual([{ questId: 'q_widows', counts: [10, 4], state: 'active' }]);
  });

  it('echoes the last processed input sequence in self snapshots', () => {
    server.handleMessage(session, JSON.stringify({ t: 'input', seq: 7, mi: { f: 1 } }));
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect({
      ack: snap.self.ack,
      ...('ackCt' in snap.self ? { ackCt: snap.self.ackCt } : {}),
    }).toEqual({ ack: 7 });
    expect(snap.self).not.toHaveProperty('rpx');
    expect(snap.self).not.toHaveProperty('rpy');
    expect(snap.self).not.toHaveProperty('rpz');
    expect(snap.self).not.toHaveProperty('rpf');
    expect(snap.self).not.toHaveProperty('ovE');
    expect(snap.self).not.toHaveProperty('ovA');
    expect(snap.self).not.toHaveProperty('msm');

    server.handleMessage(session, JSON.stringify({ t: 'input', seq: 6, mi: { f: 0 } }));
    fc.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self.ack).toBe(7);
  });

  it("folds a seq-bearing 'target' command into the same input ack, beside its target echo", () => {
    // The online mirror's pending-target echo (src/net/target_echo.ts) reads a
    // covering ack as "this snapshot was built after my command", so the
    // command's seq must ride the one high-water the movement frames use.
    const other = joinServer(server, fakeWs(), 2, 'Other', 'mage');
    server.handleMessage(session, JSON.stringify({ t: 'input', seq: 7, mi: { f: 1 } }));
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'target', id: other.pid, seq: 8 }),
    );
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.ack).toBe(8);
    expect(snap.self.target).toBe(other.pid);

    // A refused target (an unknown id) is still acked: the mirror then adopts
    // the server's unchanged value from that very snapshot.
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'target', id: 424242, seq: 9 }));
    fc.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self.ack).toBe(9);
    expect(lastSnap(fc.sent).self.target).toBe(other.pid);

    // A seq-less 'target' (an older client) leaves the high-water alone.
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'target', id: null }));
    fc.sent.length = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self.ack).toBe(9);
    expect(lastSnap(fc.sent).self.target).toBeNull();
  });

  it("acks a lane-dropped 'target' command without running it, so the mirror yields to the server", () => {
    // The fold sits at receipt, ahead of the lane verdict: a command the flood
    // defense drops still advances the ack, and the client's hold then adopts
    // the server's unchanged target from that snapshot (a command that never
    // ran has no other correct outcome). Pinned by stubbing the lane verdict.
    const other = joinServer(server, fakeWs(), 2, 'Other', 'mage');
    // biome-ignore lint/suspicious/noExplicitAny: consumeLane is a private dispatcher method
    const priv = server as any;
    const realConsumeLane = priv.consumeLane;
    priv.consumeLane = (s: unknown, lane: string, nowSec: number) =>
      lane === 'command' ? false : realConsumeLane.call(server, s, lane, nowSec);
    try {
      server.handleMessage(
        session,
        JSON.stringify({ t: 'cmd', cmd: 'target', id: other.pid, seq: 12 }),
      );
    } finally {
      priv.consumeLane = realConsumeLane;
    }
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.ack).toBe(12);
    expect(snap.self.target).toBeNull();
  });

  it('adds the consumed client tick beside the legacy ack only for movement v2', () => {
    const v2Server = new GameServer();
    const v2Client = fakeWs();
    const v2Session = joinServer(v2Server, v2Client, 2, 'Ticked', 'warrior', {
      movementWireVersion: 2,
    });
    const meta = v2Server.sim.meta(v2Session.pid)!;
    const entity = v2Server.sim.entities.get(v2Session.pid)!;
    const facingBeforeArrival = entity.facing;
    const lastInputAtBeforeArrival = v2Session.lastInputAt;
    v2Server.handleMessage(
      v2Session,
      JSON.stringify({ t: 'input', seq: 4, ct: 0, mi: { f: 1 }, facing: 0.25 }),
    );

    expect(meta.moveInput.forward).toBe(false);
    expect(entity.facing).toBe(facingBeforeArrival);
    expect(v2Session.lastInputAt).toBe(lastInputAtBeforeArrival);
    consumeMovementFramesV2(v2Server.sim, [v2Session]);
    expect(meta.moveInput.forward).toBe(true);
    expect(entity.facing).toBe(0.25);
    expect(v2Session.lastConsumedCt).toBe(0);
    expect(v2Session.lastInputAt).toBe(v2Server.sim.time);
    v2Server.sim.tick();
    entity.pos.x = 1 / 3;
    entity.pos.y = 2 / 3;
    entity.pos.z = 4 / 3;
    entity.facing = Math.PI / 7;
    updateMovementOverrideEpochs(v2Server.sim, [v2Session]);
    broadcast(v2Server);
    const self = lastSnap(v2Client.sent).self;

    expect({
      ack: self.ack,
      ackCt: self.ackCt,
      rpx: self.rpx,
      rpy: self.rpy,
      rpz: self.rpz,
      rpf: self.rpf,
      ovE: self.ovE,
    }).toEqual({
      ack: 4,
      ackCt: 0,
      rpx: 1 / 3,
      rpy: 2 / 3,
      rpz: 4 / 3,
      rpf: Math.PI / 7,
      ovE: 0,
    });
    expect(self).not.toHaveProperty('msm');
    expect({ x: self.x, y: self.y, z: self.z, f: self.f }).toEqual({
      x: 0.33,
      y: 0.67,
      z: 1.33,
      f: 0.45,
    });

    const client = bareClient(v2Session.pid, { movementWireVersion: 2 });
    client.reconMoveSpeedMult = 2;
    (client as any).applySnapshot(lastSnap(v2Client.sent));
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
      x: 1 / 3,
      y: 2 / 3,
      z: 4 / 3,
      previousFacing: Math.PI / 7,
      facing: Math.PI / 7,
      ackCt: 0,
      epoch: 0,
      active: false,
      moveSpeedMult: 1,
    });
    expect(client.player.pos).toEqual({ x: 0.33, y: 0.67, z: 1.33 });
    expect(client.player.petAutoSkill).toBe(false);

    entity.auras.push({
      id: 'test_root',
      name: 'Root',
      kind: 'root',
      remaining: 1,
      duration: 1,
      value: 0,
      sourceId: entity.id,
      school: 'physical',
    });
    updateMovementOverrideEpochs(v2Server.sim, [v2Session]);
    v2Client.sent.length = 0;
    broadcast(v2Server);
    expect(lastSnap(v2Client.sent).self).toMatchObject({ ovE: 1, ovA: 1 });

    entity.auras.push({
      id: 'test_speed',
      name: 'Speed',
      kind: 'buff_speed',
      remaining: 1,
      duration: 1,
      value: 1.5,
      sourceId: entity.id,
      school: 'physical',
    });
    updateMovementOverrideEpochs(v2Server.sim, [v2Session]);
    v2Client.sent.length = 0;
    broadcast(v2Server);
    const spedSelf = lastSnap(v2Client.sent).self;
    expect(spedSelf.msm).toBe(1.5);
    (client as any).applySnapshot(lastSnap(v2Client.sent));
    expect(client.reconMoveSpeedMult).toBe(1.5);
  });

  it('omits movement reconciliation fields from a spectating v2 self record', () => {
    const spectateServer = new GameServer();
    const moderatorWs = fakeWs();
    const targetWs = fakeWs();
    const moderator = joinServer(spectateServer, moderatorWs, 4, 'Moderator', 'warrior', {
      movementWireVersion: 2,
    });
    const target = joinServer(spectateServer, targetWs, 5, 'Observed');
    (spectateServer as any).enterSpectate(moderator, target);
    moderatorWs.sent.length = 0;

    broadcast(spectateServer);

    const self = lastSnap(moderatorWs.sent).self;
    expect(self.id).toBe(target.pid);
    for (const key of ['rpx', 'rpy', 'rpz', 'rpf', 'ackCt', 'ovE', 'ovA', 'msm']) {
      expect(self).not.toHaveProperty(key);
    }
  });

  it.each([
    ['unreleased corpse', true, false, false, false],
    ['released ghost', true, true, false, true],
    ['stunned player', false, false, true, false],
  ] as const)(
    'applies v2 facing guards at consumption for a %s',
    (_name, dead, ghost, stunned, appliesFacing) => {
      const facingServer = new GameServer();
      const facingClient = fakeWs();
      const facingSession = joinServer(
        facingServer,
        facingClient,
        3,
        `Facing ${_name}`,
        'warrior',
        {
          movementWireVersion: 2,
        },
      );
      const entity = facingServer.sim.entities.get(facingSession.pid)!;
      entity.facing = 0.25;
      entity.dead = dead;
      entity.ghost = ghost;
      if (stunned) {
        entity.auras.push({
          id: 'test_stun',
          name: 'Test Stun',
          kind: 'stun',
          remaining: 5,
          duration: 5,
          value: 0,
          sourceId: entity.id,
          school: 'physical',
        } satisfies Aura);
      }

      facingServer.handleMessage(
        facingSession,
        JSON.stringify({ t: 'input', seq: 1, ct: 0, mi: {}, facing: 1.25 }),
      );
      consumeMovementFramesV2(facingServer.sim, [facingSession]);

      expect(entity.facing).toBe(appliesFacing ? 1.25 : 0.25);
    },
  );

  it('turns echoed input acks into client latency samples', () => {
    const client = bareClient(1);
    const first = {
      id: 1,
      k: 'player',
      tid: 'player',
      nm: 'Testa',
      lv: 1,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 100,
      mhp: 100,
    };
    (client as any).pendingInputSeqSentAt.set(1, 100);
    (client as any).pendingInputSeqSentAt.set(2, 140);

    const oldPerf = (globalThis as any).performance;
    (globalThis as any).performance = { now: () => 200 };
    try {
      (client as any).applySnapshot({
        t: 'snap',
        ents: [],
        self: { ...first, ack: 2 },
      });
    } finally {
      (globalThis as any).performance = oldPerf;
    }

    expect(client.consumeInputEchoSamples()).toEqual([100, 60]);
    expect(client.consumeInputEchoSamples()).toEqual([]);
  });

  it('snaps a dead mob to its respawn pose instead of interpolating from the corpse', () => {
    const client = bareClient(1);
    const corpse = {
      id: 99,
      k: 'mob',
      tid: 'forest_wolf',
      nm: 'Forest Wolf',
      lv: 1,
      x: 0,
      y: 0,
      z: 0,
      f: 0,
      hp: 0,
      mhp: 45,
      dead: true,
      h: true,
    };
    const respawned = {
      id: 99,
      tid: 'forest_wolf',
      nm: 'Forest Wolf',
      lv: 1,
      x: 10,
      y: 0,
      z: 0,
      f: 0,
      hp: 45,
      mhp: 45,
      dead: false,
      h: true,
    };

    const oldPerf = (globalThis as any).performance;
    (globalThis as any).performance = { now: () => 100 };
    try {
      (client as any).applySnapshot({ t: 'snap', ents: [corpse] });
      (globalThis as any).performance = { now: () => 125 };
      (client as any).applySnapshot({ t: 'snap', ents: [respawned] });
    } finally {
      (globalThis as any).performance = oldPerf;
    }

    const mob = client.entities.get(99)!;
    expect(mob.dead).toBe(false);
    expect(mob.pos.x).toBe(10);
    expect(mob.prevPos).toEqual(mob.pos);
  });

  it('resends a heavy field once it changes', () => {
    broadcast(server);
    fc.sent.length = 0;
    server.sim.addItem('baked_bread', 2, session.pid);
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self).toHaveProperty('inv');
    expect(snap.self.inv.some((s: any) => s.itemId === 'baked_bread')).toBe(true);
    expect(snap.self).not.toHaveProperty('qlog');
    expect(snap.self).not.toHaveProperty('stats');
  });

  it('flushes mage row picks in the next heavy self snapshot', () => {
    const mageServer = new GameServer();
    const mageFc = fakeWs();
    const mage = joinServer(mageServer, mageFc, 9, 'Rowwire', 'mage');
    mageServer.sim.setPlayerLevel(5, mage.pid);

    broadcast(mageServer);
    const client = bareClient(mage.pid, { playerClass: 'mage' });
    (client as any).applySnapshot(lastSnap(mageFc.sent));
    mageFc.sent.length = 0;
    broadcast(mageServer);
    expect(lastSnap(mageFc.sent).self).not.toHaveProperty('tal');

    mageFc.sent.length = 0;
    mageServer.handleMessage(
      mage,
      JSON.stringify({
        t: 'cmd',
        cmd: 'selectTalentRow',
        level: 5,
        optionId: 'mag_r5_ice_floes',
      }),
    );
    broadcast(mageServer);

    const snap = lastSnap(mageFc.sent);
    expect(snap.self.tal.alloc).toEqual({
      spec: null,
      rows: { 5: 'mag_r5_ice_floes' },
    });
    (client as any).applySnapshot(snap);
    expect(client.talents).toEqual({
      spec: null,
      rows: { 5: 'mag_r5_ice_floes' },
    });
  });

  it('resends equip + inv on the next snapshot after an online unequip', () => {
    // A fresh warrior starts with worn_sword equipped in mainhand (its class
    // startWeapon). unequipItem returns the piece to bags via the sim's
    // addItemSilent, which (unlike the addItem/removeItem hub) does NOT bump
    // PlayerMeta.wireRev and emits only a log event, so the gated equip/inv block
    // is resent promptly only because unequip_item is a HEAVY_SELF_CMD. Without
    // that the client would show the item still equipped (and missing from bags)
    // until the ~2 s staggered safety refresh.
    const client = bareClient(session.pid);
    expect(server.sim.meta(session.pid)!.equipment.mainhand).toBe('worn_sword');

    // Flush the first full snapshot to the client so it has the equipped state,
    // then confirm the heavy block is quiet: with the gate on, a no-op
    // re-broadcast omits equip/inv (the staggered refresh is not due this tick),
    // so any later resend is the command dirtying the session, not the refresh.
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.equipment.mainhand).toBe('worn_sword');
    fc.sent.length = 0;
    broadcast(server);
    const quiet = lastSnap(fc.sent);
    expect(quiet.self).not.toHaveProperty('equip');
    expect(quiet.self).not.toHaveProperty('inv');

    // Unequip the mainhand and broadcast once: the very next snapshot must carry
    // the updated equip + inv, not wait for the safety refresh.
    fc.sent.length = 0;
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'unequip_item', slot: 'mainhand' }),
    );
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self).toHaveProperty('equip');
    expect(snap.self).toHaveProperty('inv');
    expect(snap.self.equip.mainhand).toBeUndefined();
    expect(snap.self.inv.some((s: any) => s.itemId === 'worn_sword')).toBe(true);

    // and it round-trips: the client mirror clears the slot and shows it in bags.
    (client as any).applySnapshot(snap);
    expect(client.equipment.mainhand).toBeUndefined();
    expect(client.inventory.some((s) => s.itemId === 'worn_sword')).toBe(true);
  });

  it('instance payloads (masterwork and legacy quality) ride the inv snapshot verbatim', () => {
    // Back-compat over the wire: the server sends the live
    // meta.inventory wholesale, so a masterwork copy's full payload (signer,
    // enchant marker, rolled.masterwork plus baked stats) and a legacy copy's
    // rolled.quality must both arrive on the client mirror byte-identical.
    // A future snapshot serializer that field-picks the instance would red
    // here before it could strip either generation.
    const masterwork = {
      signer: 'Testa',
      enchant: 'enchant_chest_stamina',
      rolled: { masterwork: true, stats: { int: 2, spi: 1 } },
    };
    const legacy = { signer: 'Oldhand', rolled: { quality: 'rare' as const } };
    server.sim.addItemInstance('eastbrook_ritual_vestments', masterwork, session.pid);
    server.sim.addItemInstance('apprentice_staff', legacy, session.pid);

    broadcast(server);
    const snap = lastSnap(fc.sent);
    const wireMw = snap.self.inv.find((s: any) => s.itemId === 'eastbrook_ritual_vestments');
    const wireLegacy = snap.self.inv.find((s: any) => s.itemId === 'apprentice_staff');
    expect(wireMw?.instance).toEqual(masterwork);
    expect(wireLegacy?.instance).toEqual(legacy);

    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(
      client.inventory.find((s) => s.itemId === 'eastbrook_ritual_vestments')?.instance,
    ).toEqual(masterwork);
    expect(client.inventory.find((s) => s.itemId === 'apprentice_staff')?.instance).toEqual(legacy);
  });

  it('a counted identical-payload stack rides the inv snapshot as one slot', () => {
    // Three byte-equal signed grants merge server-side into a single count-3
    // slot; wolf_fang is a material, so the legacy premium signer moves off
    // the instance payload and into the exact per-unit composition
    // (material_stack.ts normalizeMaterialStack) as source.signer; no
    // gatherer is invented, signer and gatherer are distinct concepts
    // (material_sources.ts). The wire and the client mirror must both carry
    // the composition intact (a mirror that re-split or dropped either would
    // red here).
    const signed = { signer: 'Testa' };
    for (let i = 0; i < 3; i++) server.sim.addItemInstance('wolf_fang', signed, session.pid);

    broadcast(server);
    const snap = lastSnap(fc.sent);
    const wireSlots = snap.self.inv.filter((s: any) => s.itemId === 'wolf_fang');
    expect(wireSlots).toHaveLength(1);
    expect(wireSlots[0].count).toBe(3);
    expect(wireSlots[0].instance).toBeUndefined();
    expect(wireSlots[0].materialSources).toEqual([{ count: 3, source: signed }]);

    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    const mirrored = client.inventory.filter((s) => s.itemId === 'wolf_fang');
    expect(mirrored).toHaveLength(1);
    expect(mirrored[0].count).toBe(3);
    expect(mirrored[0].instance).toBeUndefined();
    expect(mirrored[0].materialSources).toEqual([{ count: 3, source: signed }]);
  });

  it('mirrors vendor buyback deltas to the client', () => {
    const wilkes = [...server.sim.entities.values()].find((e) => e.templateId === 'trader_wilkes')!;
    const player = server.sim.entities.get(session.pid)!;
    player.pos.x = wilkes.pos.x + 2;
    player.pos.z = wilkes.pos.z;
    player.prevPos = { ...player.pos };
    server.sim.addItem('apprentice_staff', 1, session.pid);
    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.vendorBuyback).toEqual([]);
    expect(client.consumeInventoryChanged()).toBe(true);

    fc.sent.length = 0;
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'sell', item: 'apprentice_staff' }),
    );
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self).toHaveProperty('buyback');
    expect(snap.self.buyback).toEqual([{ itemId: 'apprentice_staff', count: 1 }]);

    const buybackOnly = { ...snap, self: { ...snap.self } };
    delete buybackOnly.self.inv;
    (client as any).applySnapshot(buybackOnly);
    expect(client.vendorBuyback).toEqual([{ itemId: 'apprentice_staff', count: 1 }]);
    expect(client.consumeInventoryChanged()).toBe(true);
  });

  it('quest commands force a quest-state resync even when rejected', () => {
    broadcast(server);
    fc.sent.length = 0;
    // unknown quest: the sim rejects it and quest state does not change, but
    // the next snapshot must still carry quest fields so stale client UI
    // converges back to the server's truth
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'accept', quest: 'no_such_quest' }),
    );
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self).toHaveProperty('qlog');
    expect(snap.self).toHaveProperty('qdone');
    expect(snap.self).not.toHaveProperty('inv');
  });

  it('rejected distant quest accepts resync the authoritative quest state', () => {
    broadcast(server);
    fc.sent.length = 0;
    const player = server.sim.entities.get(session.pid)!;
    player.pos.x = 0;
    player.pos.z = -40;

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'accept', quest: 'q_wolves' }));
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.qlog).toEqual([]);
    expect(snap.self.qdone).toEqual([]);
  });

  it('dev quest completion resyncs qlog and qdone', () => {
    const previous = process.env.ALLOW_DEV_COMMANDS;
    process.env.ALLOW_DEV_COMMANDS = '1';
    try {
      broadcast(server);
      fc.sent.length = 0;

      server.handleMessage(
        session,
        JSON.stringify({
          t: 'cmd',
          cmd: 'dev_complete_quest',
          quest: 'q_wolves',
        }),
      );
      broadcast(server);

      const snap = lastSnap(fc.sent);
      expect(snap.self).toHaveProperty('qlog');
      expect(snap.self).toHaveProperty('qdone');
      expect(snap.self.qlog).toEqual([]);
      expect(snap.self.qdone).toContain('q_wolves');
    } finally {
      if (previous === undefined) delete process.env.ALLOW_DEV_COMMANDS;
      else process.env.ALLOW_DEV_COMMANDS = previous;
    }
  });

  it('a self-starting world quest dirties and round-trips its heavy self state', () => {
    const quest = WORLD_QUESTS.find((candidate) => candidate.objective.type === 'kill');
    if (!quest || quest.objective.type !== 'kill') {
      throw new Error('Expected kill world quest fixture');
    }
    const targetMobId = quest.objective.targetMobId;
    broadcast(server);
    fc.sent.length = 0;
    server.sim.setPlayerLevel(quest.minLevel, session.pid);
    server.sim.utcDay = '2026-08-31';
    server.sim.resetDay = '2026-08-31';
    server.sim.worldQuestExpiresAtMs = 1_900_000_000_000;
    const player = server.sim.entities.get(session.pid)!;
    player.pos.x = quest.area.x;
    player.pos.z = quest.area.z;
    player.prevPos = { ...player.pos };
    session.selfHeavyDirty = false;

    const events = server.sim.tick();
    (server as unknown as { routeEvents(routed: SimEvent[]): void }).routeEvents(events);

    expect(events).toContainEqual({
      type: 'worldQuestStarted',
      questId: quest.id,
      pid: session.pid,
    });
    expect(session.selfHeavyDirty).toBe(true);
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.wqday).toBe(worldQuestCycleForResetDay('2026-08-31'));
    expect(snap.self.wqexp).toBe(1_900_000_000_000);
    expect(snap.self.wqlog).toEqual([{ questId: quest.id, count: 0, state: 'active' }]);

    const client = bareClient(session.pid);
    (client as unknown as { applySnapshot(snapshot: unknown): void }).applySnapshot(snap);
    expect(client.worldQuestCycle).toBe(worldQuestCycleForResetDay('2026-08-31'));
    expect(client.worldQuestExpiresAtMs).toBe(1_900_000_000_000);
    expect(client.worldQuestLog.get(quest.id)).toEqual({
      questId: quest.id,
      count: 0,
      state: 'active',
    });

    const meta = server.sim.meta(session.pid)!;
    const target = [...server.sim.entities.values()].find(
      (entity) => entity.kind === 'mob' && entity.templateId === targetMobId,
    )!;
    target.pos.x = quest.area.x;
    target.pos.z = quest.area.z;

    fc.sent.length = 0;
    session.selfHeavyDirty = false;
    onMobKilledForWorldQuests(server.sim.ctx, target, meta);
    const progressEvents = server.sim.drainEvents();
    (server as unknown as { routeEvents(routed: SimEvent[]): void }).routeEvents(progressEvents);
    expect(progressEvents.some((event) => event.type === 'worldQuestProgress')).toBe(true);
    expect(session.selfHeavyDirty).toBe(true);
    broadcast(server);
    const progressSnap = lastSnap(fc.sent);
    expect(progressSnap.self.wqlog).toEqual([{ questId: quest.id, count: 1, state: 'active' }]);
    (client as unknown as { applySnapshot(snapshot: unknown): void }).applySnapshot(progressSnap);
    expect(client.worldQuestLog.get(quest.id)?.count).toBe(1);

    fc.sent.length = 0;
    session.selfHeavyDirty = false;
    for (let count = 1; count < quest.count; count++) {
      onMobKilledForWorldQuests(server.sim.ctx, target, meta);
    }
    const doneEvents = server.sim.drainEvents();
    (server as unknown as { routeEvents(routed: SimEvent[]): void }).routeEvents(doneEvents);
    expect(doneEvents.some((event) => event.type === 'worldQuestDone')).toBe(true);
    expect(session.selfHeavyDirty).toBe(true);
    broadcast(server);
    const doneSnap = lastSnap(fc.sent);
    expect(doneSnap.self.wqlog).toEqual([
      { questId: quest.id, count: quest.count, state: 'completed' },
    ]);
    (client as unknown as { applySnapshot(snapshot: unknown): void }).applySnapshot(doneSnap);
    expect(client.worldQuestLog.get(quest.id)?.state).toBe('completed');
  });

  it('round-trips advanced puzzle, match-three, and credited-object state to ClientWorld', () => {
    const meta = server.sim.meta(session.pid)!;
    const cycle = worldQuestCycleForResetDay('2026-08-31');
    const matchQuest = WORLD_QUESTS.find((quest) => quest.id === 'wq_palmreach_confections')!;
    const puzzleQuest = WORLD_QUESTS.find((quest) => quest.id === 'wq_galecrest_wisps')!;
    if (matchQuest.objective.type !== 'match3' || puzzleQuest.objective.type !== 'puzzle') {
      throw new Error('Expected advanced world quest fixtures');
    }
    const level = matchQuest.objective.levels[1];
    const puzzle = puzzleQuest.objective.puzzles[1];
    const matchProgress = {
      questId: matchQuest.id,
      count: 12,
      state: 'active' as const,
      puzzleVariant: 1,
      match3Board: [...level.board],
      match3Moves: 4,
      match3RefillIndex: 9,
    };
    const puzzleProgress = {
      questId: puzzleQuest.id,
      count: 0,
      state: 'active' as const,
      puzzleVariant: 1,
      puzzleRotations: puzzle.tiles.map((tile) => tile.initialRotation),
    };
    meta.worldQuestCycle = cycle;
    meta.worldQuestLog.clear();
    meta.worldQuestLog.set(matchQuest.id, matchProgress);
    meta.worldQuestLog.set(puzzleQuest.id, puzzleProgress);
    session.selfHeavyDirty = true;

    broadcast(server);
    const first = lastSnap(fc.sent);
    const client = bareClient(session.pid);
    (client as unknown as { applySnapshot(snapshot: unknown): void }).applySnapshot(first);

    expect(first.self.wqlog).toEqual([matchProgress, puzzleProgress]);
    expect(client.worldQuestLog.get(matchQuest.id)).toEqual(matchProgress);
    expect(client.worldQuestLog.get(puzzleQuest.id)).toEqual(puzzleProgress);

    const salvageQuest = WORLD_QUESTS.find((quest) => quest.id === 'wq_farshore_salvage')!;
    if (salvageQuest.objective.type !== 'salvage') throw new Error('Expected salvage fixture');
    const creditedObjects = [
      interactObjectCreditKey(0, { x: 277, z: 82 }),
      interactObjectCreditKey(0, { x: 285, z: 82 }),
    ];
    const salvageProgress = {
      questId: salvageQuest.id,
      count: 2,
      state: 'active' as const,
      creditedObjects,
      puzzleVariant: 0,
    };
    // A later cycle than the first half, and one that OFFERS the salvage quest:
    // Farshore's pool is four deep since the round-2 zone hunts, so the
    // shipwreck sits on cycles 0, 4, 8 (an inactive quest's progress is
    // filtered out of the self snapshot).
    meta.worldQuestCycle = 'wq3_4';
    meta.worldQuestLog.clear();
    meta.worldQuestLog.set(salvageQuest.id, salvageProgress);
    session.selfHeavyDirty = true;
    fc.sent.length = 0;

    broadcast(server);
    const second = lastSnap(fc.sent);
    (client as unknown as { applySnapshot(snapshot: unknown): void }).applySnapshot(second);

    expect(second.self.wqlog).toEqual([salvageProgress]);
    expect(client.worldQuestLog.get(salvageQuest.id)).toEqual(salvageProgress);
  });

  it('each client gets full state on its own first snapshot', () => {
    broadcast(server);
    const fc2 = fakeWs();
    joinServer(server, fc2, 2, 'Testb');
    broadcast(server);
    const snapNew = lastSnap(fc2.sent);
    // a fresh session always receives the full self state: every registered delta key
    for (const key of DENSE_DELTA_KEYS) {
      expect(snapNew.self, `self.${key} missing for fresh session`).toHaveProperty(key);
    }
    // the veteran session still gets deltas only
    const snapOld = lastSnap(fc.sent);
    expect(snapOld.self).not.toHaveProperty('inv');
    // both players spawn together, so each sees the other in ents
    expect(snapNew.ents.some((e: any) => e.id === session.pid)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// W0a: full self-snapshot delta round-trip gate.
//
// `selfWireJson` (server/game.ts) emits its heavy "delta" fields through a
// `maybe(key, value)` closure that ships a key only when its serialized form
// changed since this session last received it; `applySnapshot` (src/net/
// online.ts) mirrors each with `if (s.X !== undefined)` (or the inline
// `s.X ?? e.X` form for `stats`/`weapon`). This is the single most fragile codec
// in the workstream, so we pin: (a) the exact registered key set against drift, (b) the
// terse-key -> IWorld-name rename map, (c) that every dirtied value round-trips
// onto the correct decode target, and (d) that a no-op re-broadcast omits all registered keys
// while the prior decoded value is preserved.
// ---------------------------------------------------------------------------

// The pinned set of delta keys, sorted. Cross-checked below against the
// live `maybe(...)` (and `maybeRaw(...)`) calls scraped from server/game.ts
// source, so any unregistered delta key reddens this gate. All but four ride
// via `maybe(...)`; `dfb` is written with `maybeRaw(...)` (a realm-wide
// fragment, serialized at most once per tick by a realm-readout memo and
// shared across viewers), `reliq` is `maybeRaw(...)` too but for a different
// memo: a PER-CHARACTER blob serialized once per state revision
// (reliquaryWireJson), never shared across viewers, and `app` is `maybeRaw(...)`
// over the memoized authored-look JSON (per-viewer, re-serialized only when the
// look changes), and `wba` reuses one realm-wide world-boss liveness fragment
// across every viewer in the broadcast pass. The count is the union of the
// release's realm-readout keys, the procedural-dungeon branch's rift delta keys,
// and the 16 static combat-rating/progression scalars (ap/sp/sh/crit/dodge/blk/bval/
// crat/hrat/hirat/xp/lxp/rxp/prk/copper/ddiff) moved off the always-present self
// record and behind this same delta gate, since they change far less often than
// the reconciliation-critical fields (resource, gcd, swing, combo, target...)
// that stay unconditional.
const ALL_DELTA_KEYS = [
  'aborder',
  'acct',
  'achg',
  'achr',
  'ap',
  'app',
  'arena',
  'atitle',
  'auras',
  'bags',
  'bank',
  'bg',
  'blk',
  'bpsl',
  'buyback',
  'bval',
  'cardDuel',
  'cbt',
  'cds',
  'cluh',
  'copper',
  'corder',
  'corpse',
  'cosmetics',
  'cprof',
  'crat',
  'crit',
  'cvault',
  'dclears',
  'dcomp',
  'dcompanion',
  'ddiff',
  'de',
  'deeds',
  'delveDaily',
  'denc',
  'df',
  'dfb',
  'dmarks',
  'dodge',
  'drun',
  'dstats',
  'duel',
  'einst',
  'ench',
  'equip',
  'fac',
  'facCur',
  'fplot',
  'ggoal',
  'gprof',
  'guildBank',
  'hbl',
  'hill',
  'hirat',
  'honor',
  'hpref',
  'hpw',
  'hrat',
  'inv',
  'lhonor',
  'lockouts',
  'lroll',
  'lrollg',
  'lxp',
  'mail',
  'mailU',
  'market',
  'marks',
  'milestones',
  'mktU',
  'mloot',
  'mntLesson',
  'mntOwn',
  'mntRace',
  'mntRtd',
  'mst',
  'ncd',
  'offhandWeapon',
  'party',
  'prk',
  'prof',
  'ptime',
  'qdone',
  'qlog',
  'reliq',
  'renown',
  'rxp',
  'salv',
  'scb',
  'sh',
  'sp',
  'stats',
  'tal',
  'tfocus',
  'tfpend',
  'tmap',
  'trade',
  'tslot',
  'vault',
  'vehicle',
  'wba',
  'weapon',
  'weeklyRewards',
  'wkexp',
  'wkq',
  'wpvp',
  'wqday',
  'wqexp',
  'wqlog',
  'wqrep',
  'wqrr',
  'xp',
] as const;

/** The registered delta keys whose DELTA behavior is gated on a wire
 *  capability the session advertises in its auth frame; both are DIRECT
 *  maybeSerialized emits in server/game.ts bcastSelf, which is why the emitter
 *  scrape below needs its Serialized arm to see them at all.
 *  - `de` (dungeonEntryFacingWireVersion): the dungeon entry facing fence's
 *    token. Capability-ONLY: a legacy session never receives the key, so it
 *    stays out of DENSE_DELTA_KEYS. Lifecycle pins:
 *    tests/server/dungeon_entry_facing.test.ts.
 *  - `auras` (timerWireVersion, the stable timer wire): delta-ELIDED only for
 *    a stable-wire session; a legacy session still receives auras on EVERY
 *    snapshot as part of the always-present base self record (wireEntity's
 *    includeAuras arm), so the key IS dense but never elides for legacy.
 *    Lifecycle pins: the negotiated stable timer wire suite in
 *    tests/snapshots_auras.test.ts. */
const CAPABILITY_DELTA_KEYS = ['auras', 'de'] as const;

/** The delta keys a FRESH session is guaranteed to receive on its first
 *  snapshot. Every registered key but two: `app` is the authored modular look,
 *  and a character created before the creator (or by a client that posts no
 *  appearance) has none, so it stays sparse on the wire the way `eq`/`eqi` do
 *  on the entity record (its own round trip is pinned in
 *  tests/appearance_broadcast.test.ts, including that it ships exactly once);
 *  `de` is capability-only (CAPABILITY_DELTA_KEYS above). `auras` stays dense:
 *  a legacy session gets it on the base self record and a stable-wire session
 *  gets the first-send delta. */
const DENSE_DELTA_KEYS = ALL_DELTA_KEYS.filter((key) => key !== 'app' && key !== 'de');

// The terse wire key -> IWorld member name rename map, in sorted order. The wire
// string IS the protocol (contract #4): a terse key renamed on one side passes tsc
// and most per-field tests but silently breaks the world, so this map is pinned and
// each target is validated as a survived value by the round-trip test below. It
// carries the always-present self scalars (res/mres/rtype/lxp/rxp/prk) plus every
// delta key whose IWorld name differs from its terse key (stats/weapon/delveDaily
// keep their name; tal fans out to several members and is asserted directly).
const TERSE_TO_IWORLD: Record<string, string> = {
  aborder: 'activeBorder',
  achg: 'abilityCharges',
  ap: 'attackPower',
  arena: 'arenaInfo',
  atitle: 'activeTitle',
  bags: 'bags',
  bank: 'bankInfo',
  blk: 'blockChance',
  buyback: 'vendorBuyback',
  bval: 'blockValue',
  cbt: 'inCombat',
  cds: 'cooldowns',
  cluh: 'clueHunt',
  corder: 'commissionOrders',
  cosmetics: 'accountCosmetics',
  cprof: 'craftingIdentity',
  crat: 'critRating',
  crit: 'critChance',
  cvault: 'craftVaultStock',
  dclears: 'delveClears',
  dcomp: 'companionUpgrades',
  dcompanion: 'companionState',
  ddiff: 'dungeonDifficulty',
  deeds: 'deedsEarned',
  denc: 'lastDisenchantResult',
  df: 'dungeonFinderInfo',
  dfb: 'dungeonFinderBoard',
  dmarks: 'delveMarks',
  dodge: 'dodgeChance',
  drun: 'delveRun',
  dstats: 'deedStats',
  duel: 'duelInfo',
  einst: 'equipmentInstances',
  ench: 'lastEnchantResult',
  equip: 'equipment',
  fac: 'factions',
  facCur: 'factionCurrencies',
  fplot: 'myFarmPlots',
  ggoal: 'gatheringGoal',
  gprof: 'gatheringProficiency',
  guildBank: 'guildBankInfo',
  hill: 'hillInfo',
  hirat: 'hitRating',
  hpref: 'harvestPreference',
  hrat: 'hasteRating',
  inv: 'inventory',
  lhonor: 'lifetimeHonor',
  lockouts: 'selfLockouts',
  lroll: 'lootRollPrompts',
  lrollg: 'lootRollGroup',
  lxp: 'lifetimeXp',
  mail: 'mailInfo',
  mailU: 'mailUnread',
  market: 'marketInfo',
  marks: 'markers',
  milestones: 'unlockedMilestones',
  mktU: 'marketCollectPending',
  mloot: 'masterLootPrompts',
  mntLesson: 'mountLessonActive',
  mntOwn: 'ownedMounts',
  mntRace: 'mountRaceView',
  mntRtd: 'ridingTrained',
  mres: 'maxResource',
  mst: 'activeMobileStationCrafts',
  party: 'partyInfo',
  prk: 'prestigeRank',
  prof: 'professionsState',
  ptime: 'playtimeSeconds',
  qdone: 'questsDone',
  qlog: 'questLog',
  res: 'resource',
  rtype: 'resourceType',
  rxp: 'restedXp',
  salv: 'lastSalvageResult',
  sh: 'spellHaste',
  sp: 'spellPower',
  tfocus: 'townFocus',
  tfpend: 'townFocusPending',
  tmap: 'treasureMap',
  tslot: 'toolEffectSlots',
  vault: 'vaultInfo',
  vehicle: 'vehicleSession',
  weeklyRewards: 'weeklyRewardInfo',
  wkexp: 'weeklyQuestResetAtMs',
  wkq: 'weeklyQuest',
  wpvp: 'worldPvpInfo',
  wqday: 'worldQuestCycle',
  wqexp: 'worldQuestExpiresAtMs',
  wqlog: 'worldQuestLog',
  wqrep: 'worldQuestReplacements',
  wqrr: 'worldQuestRerollCycle',
};

// Dirty every one of the registered `maybe()` delta fields with a distinguishable,
// non-default value so the round-trip + no-op-omission assertions are meaningful
// (a fresh session carries all of them on snapshot #1 regardless, since lastSent is
// empty). Most fields are set on their real PlayerMeta/Entity/session source;
// for the few whose authentic setup is mutually exclusive in one player state we
// poke the exact source field the encoder reads, per the brief (the gate asserts
// the CODEC, not gameplay validity, which the parity/sim suites own):
//   - `dcompanion`: the delve companion auto-spawns only for a `solo:` run, which
//     a 2-player party precludes; we attach `run.companion` directly.
//   - `marks`: setMarker requires a hostile-mob target the delve instance does
//     not hand us deterministically; we seed the party's marker map directly.
//   - `market`: marketInfoFor is null unless near the Merchant, so we relocate
//     the Merchant entity onto the (in-delve) player.
function dirtyEveryDeltaField(): {
  server: GameServer;
  fc: FakeClient;
  leader: ClientSession;
  memberPid: number;
} {
  const server = new GameServer();
  const fc = fakeWs();
  const leader = joinServer(server, fc, 1, 'Alld');
  const fcMember = fakeWs();
  const member = joinServer(server, fcMember, 2, 'Memb', 'mage');
  const sim = server.sim;
  const lp = leader.pid;
  const mp = member.pid;
  const meta = sim.meta(lp)!;

  // Real 2-player party (party) and a real delve run (drun).
  sim.partyInvite(mp, lp);
  sim.partyAccept(mp);
  sim.setPlayerLevel(DELVES.collapsed_reliquary.minLevel, lp);
  const door = DELVES.collapsed_reliquary.doorPos;
  const pDoor = sim.entities.get(lp)!;
  pDoor.pos.x = door.x;
  pDoor.pos.z = door.z;
  pDoor.pos.y = terrainHeight(door.x, door.z, sim.cfg.seed);
  pDoor.prevPos = { ...pDoor.pos };
  sim.enterDelve('collapsed_reliquary', 'normal', lp);
  const p = sim.entities.get(lp)!;

  // An authored modular look (app). Sparse on the wire (a character created
  // before the creator has none), so the fixture stamps one, exactly as the
  // join path does from the character's own column.
  p.modularAppearance = { gender: 'female', hair: 'highbun' };
  // `cbt`: the authoritative in-combat bit; a fresh character is out of combat,
  // so the fixture flags it the way the sim's engaged pass would.
  p.inCombat = true;

  // Poke the encoder's exact sources for the mutually-exclusive cases.
  const run = sim.delveRunForPlayer(lp) as any;
  run.companion = { companionId: 'companion_tessa', entityId: mp };
  const party = (sim as any).partyOf(lp);
  (sim as any).targeting.partyMarkers.set(party.id, new Map([[mp, 3]]));
  const merchant = sim.entities.get(sim.market.merchantIds[0]);
  if (merchant) merchant.pos = { ...p.pos };
  // `mktU`: credit a pending collection so the collect-indicator bit is 1 (the
  // name key merges into the canonical seller key on first read).
  (sim.market as any).marketCollections.set(meta.name, {
    copper: 95,
    items: [],
    sales: emptySaleLog(),
  });
  // `mail`: mailInfoFor is null unless near a mailbox, so relocate one onto the
  // player. `mailU` is already non-zero: every fresh character got the one-time
  // Ravenpost welcome letter (delay 0) at join.
  const mailbox = sim.entities.get(sim.postOffice.mailboxIds[0]);
  if (mailbox) mailbox.pos = { ...p.pos };
  // `bank`: bankInfoFor is null unless near a banker, so relocate a bursar onto the
  // player; a stocked bank slot makes the mirrored contents distinguishable.
  const banker = sim.entities.get(sim.bankerIds[0]);
  if (banker) banker.pos = { ...p.pos };
  meta.bank.inventory = [{ itemId: 'wolf_fang', count: 2 }];
  // `vault`: vaultInfoFor shares the bank's proximity gate (the bursar relocated
  // above covers it), so only the contents need dirtying. Stocked AND upgraded,
  // because a locked empty vault still encodes as a non-null all-zero object:
  // without a rung the mirrored numbers would be indistinguishable from the
  // default and the decode-target assertion could not tell them apart.
  meta.vault.stock = { copper_ore: 7 };
  meta.vault.upgrades = 2;
  // The weekly emissary's charge (wkq): held mid-week so the key rides non-null.
  meta.weeklyQuest = { questId: 'wk_dungeons', week: '2030-W01', count: 1, state: 'active' };
  // `cvault`: craftVaultStockFor is gated on the craft-draw context predicate,
  // not the banker. This harness player carries a live DELVE RUN (the drun
  // key's seeding below), which the gate refuses by design, so cvault's
  // dirtied value is the EXPLICIT NULL arrival: presence still pinned by the
  // all-keys sweep, and the non-null arrival is pinned in
  // tests/vault_wire.test.ts where no delve run competes for the player.
  // `guildBank`: guildBankInfoFor additionally needs a guild membership stamp
  // (any rank; officer-plus here also exercises canEdit true over the wire)
  // and a loaded guild book (the banker relocated above covers proximity);
  // a non-empty treasury + slot makes the mirror distinguishable.
  sim.setPlayerGuildMembership(lp, { guildId: 7, rank: 'officer' });
  sim.loadGuildBank(7, {
    treasury: 12345,
    inventory: [{ itemId: 'wolf_fang', count: 4 }],
    purchasedSlots: 30, // opened (24) + one expansion: a valid ladder position
  });

  // Direct PlayerMeta fields.
  // The reins item both dirties `inv` further and flips `mntOwn` (the owned
  // mount collection) to a non-default value, which is what lets the pick
  // below land on a non-horse mount.
  meta.inventory = [
    { itemId: 'baked_bread', count: 3 },
    { itemId: 'reins_grag_bear', count: 1 },
  ];
  meta.vendorBuyback = [{ itemId: 'apprentice_staff', count: 1 }];
  meta.equipment = { ...meta.equipment, mainhand: 'zealotsbane_blade' };
  meta.equipmentInstance = {
    ring1: { rolled: { quality: 'epic', stats: { str: 2 } }, boundTo: lp },
  };
  meta.questLog.set('q_widows', {
    questId: 'q_widows',
    counts: [10, 0],
    state: 'active',
  });
  meta.questsDone.add('q_wolves');
  meta.worldQuestCycle = '2026-08-31';
  // `cluh`: an active clue hunt on a shipped hunt id (the client decoder
  // drops an id the pool does not know, so a made-up one would mirror null).
  meta.clueHunt = { huntId: CLUE_HUNTS[0].id, step: 1 };
  meta.factionCurrencies = { rift_watch: 17, church_order: 29, automatons: 41 };
  meta.treasureMap = { rarity: 'epic', siteId: TREASURE_SITES[0].id, seed: 78123 };
  server.sim.worldQuestExpiresAtMs = FAR_FUTURE_MS;
  meta.worldQuestLog.set('wq_eastbrook_bandits', {
    questId: 'wq_eastbrook_bandits',
    count: 2,
    state: 'active',
  });
  meta.raidLockouts.set('nythraxis_boss_arena', FAR_FUTURE_MS);
  meta.unlockedMilestones.add('milestone_test');
  meta.lifetimeXp = 555;
  meta.honor = 321;
  meta.lifetimeHonor = 654;
  // World PvP: the wpvp self readout (meta) and the pvp entity bit (entity).
  meta.worldPvp = { flagged: true, disarmAt: null, kills: 2, deaths: 1 };
  sim.entities.get(lp)!.pvpFlag = true;
  // King of the Hill: a hill stands (in a free-for-all zone the leader is not
  // in), so the hill self readout rides the snapshot.
  spawnHillNow(sim.ctx);
  meta.restedXp = 222;
  meta.prestigeRank = 3;
  meta.delveMarks = 7;
  meta.delveClears = { 'collapsed_reliquary:heroic': 1 };
  meta.companionUpgrades = { companion_tessa: 2 };
  meta.gatheringProficiency = { mining: 6, logging: 0, herbalism: 0, fishing: 0, farming: 0 };
  // hpref: a chosen material, not the default All (which would still pass
  // the "carries every key" presence loop, since All encodes as the
  // non-null explicit token, but would not prove a real choice decodes).
  meta.harvestPreference = { kind: 'material', itemId: 'rough_hide' };
  // tfpend: a REAL queued re-spec (null is the idle default and would fail
  // the presence loop). Far enough out that no tick in this fixture resolves it.
  meta.pendingTownFocus = {
    allocation: { silk: 2 },
    readyAtTime: sim.time + FAR_FUTURE_MS,
    coin: 0,
    materials: 0,
  };
  // tslot: a REAL slotted effect, not the empty default. Without this the key
  // rides the first snapshot as `[]`, which is not null, so it passes the
  // "dirtied to a non-default value" loop below vacuously and nothing anywhere
  // proves a slot reaches a client. Written straight onto meta (this fixture
  // predates the acquisition craft's charm-consuming command and stays a
  // direct write on purpose: the wire shape under test is the DELTA, not the
  // mint) at the charges a common tier-1 pick mints.
  meta.toolEffectSlots = {
    mining: {
      effectId: 'gatherers_cache',
      durability: 12,
      maxDurability: 20,
      confirmMode: 'always',
    },
  };
  // fplot: a REAL planted plot, not the empty default. Without this the key
  // rides the first snapshot as `[]`, which is not null, so it passes the
  // "dirtied to a non-default value" loop below vacuously and nothing anywhere
  // proves a plot row reaches a client. Written straight onto meta (the plant
  // command lands in the growth phase; the wire shape under test is the DELTA,
  // not the mint). The hidden pre-rolled outcome slots are FILLED here on
  // purpose: they are what the 'farm plot wire (fplot)' leak pin proves never
  // crosses the wire.
  // readyAtMs sits far past the fixture's clock (the sim-time lockoutNowMs
  // seam, single-digit seconds in), so `status` is deterministically 'growing'.
  meta.farmPlots.set('bed_eastbrook_1', {
    cropId: 'vale_wheat',
    plantedAtMs: 1_700_000_000_000,
    readyAtMs: FAR_FUTURE_MS,
    survivalRoll: 0.42,
    yieldSeed: 987654,
    compost: true,
    watch: true,
    tonic: false,
    notified: false,
  });
  meta.craftSkills.armorcrafting = 31;
  meta.craftSkills.weaponcrafting = 29;
  meta.archetype = {
    activeArchetype: 'armorcrafting',
    pairedMajor: 'weaponcrafting',
    hobbyCraft: 'leatherworking',
    attunedPairs: ['weaponcrafting+armorcrafting'],
    switchCount: 2,
    amendsProgress: 4,
    isJackOfAllTrades: false,
  };
  // `ggoal`: a real tracked recipe goal (Intentional Gathering PR4), seeded
  // through the actual command body (trackGatheringRecipe) rather than a
  // hand-mutation, so the wire shape under test matches what the command
  // really produces. Needs the recipe known and combo-eligible, which the
  // archetype/craftSkills dirtied just above already satisfy.
  meta.knownRecipes.add('recipe_ironbound_warplate_helm');
  sim.trackGatheringRecipe('recipe_ironbound_warplate_helm', 5, lp);
  // An ACTIVE own mobile crafting station (`mst`, the own-station arm of the
  // serving set): set directly on the meta slot (the placement command's
  // specialization gate is pinned in tests/professions_crafting_hub.test.ts;
  // this suite pins the WIRE mirror, and the party-shared arm has its own
  // GameServer rig below), far from expiry so the server-side liveness check
  // reads it active.
  meta.mobileStation = {
    playerId: 'Alld',
    craftId: 'armorcrafting',
    pos: { x: 1, z: 2 },
    placedAtTick: sim.tickCount,
    expiresAtTick: sim.tickCount + 12000,
  };
  // Per-player gather-node respawn cooldown (#1866): one node still cooling
  // down (readyAt 30s in the sim future), so `ncd` mirrors it as ~30 remaining
  // seconds and nodeHarvestableByMe reports it not ready.
  meta.nodeHarvestReadyAt[GATHER_NODES[0].id] = sim.time + 30;
  meta.delveDaily = {
    date: '2099-01-01',
    firstClearXp: new Set(['x']),
    markClears: 4,
  };
  meta.talents = { spec: 'arms', rows: {} };
  meta.ridingTrained = true; // dirties mntRtd (the purchased riding skill)
  meta.mountTraining = {
    sessionId: 'mt_wire_fixture',
    ownerId: lp,
    anchor: { x: p.pos.x, z: p.pos.z },
    state: 'IN_PROGRESS',
    phase: 'ride',
  };
  meta.mountRace = {
    raceId: 'race_wire_fixture',
    ownerId: lp,
    phase: 'racing',
    goTick: sim.tickCount,
    deadlineTick: sim.tickCount + 200,
    clearedMask: 3,
  };
  // Encoder fixture deliberately seeds mutually exclusive activities without ticking.
  meta.vehicle = {
    kind: 'cannon',
    stationId: NORTH_WATCH_CANNON.id,
    cycle: 'wq3_8',
    origin: { ...p.pos },
    encounter: createCannonEncounter(),
  };
  // Book of Deeds: two earned deeds with DISTINCT utcDay stamps (an empty map
  // would be a vacuous pin), a non-zero stat block covering the counter, both
  // sets, and a clear record, a renown total, an active title
  // (prog_veteran carries a title reward, so the sim setter would accept it)
  // and an active nameplate border (prog_prestige_10 carries a border reward,
  // the other reward kind, so a swapped kind check would redden).
  meta.deedsEarned.set('prog_first_steps', '2026-07-01');
  meta.deedsEarned.set('prog_veteran', '2026-07-08');
  meta.deedStats.counters.kills = 7;
  meta.deedStats.itemsDiscovered.add('wolf_fang');
  meta.deedStats.visited.add('npc:chronicler_saul');
  meta.deedStats.dungeonClears.hollow_crypt = 2;
  meta.renown = 15;
  meta.activeTitle = 'prog_veteran';
  meta.activeBorder = 'prog_prestige_10';
  // Reliquary sparse blob (`reliq`): one catalogued first-find with BOTH of the
  // entry's fields (clears provenance and the Phase 17 obtain tally, which
  // rides folded onto the entry rather than as a fourth top-level key) plus a
  // capped recent, so the codec pin is non-vacuous (empty {} would pass
  // first-snapshot only).
  //
  // Through the real WRITE SEAMS, never by hand-mutating the state: the wire
  // blob is memoized per state revision, and only these functions bump it. A
  // hand-mutated fixture is a lie that happens to work, because it sits before
  // this session's first memo build; move it after one and the fixture would
  // silently stop reaching the wire. tests/reliquary_wire.test.ts made the same
  // move for the same reason. (The clear meter feeding the stamp is the
  // dungeonClears assignment in the deed-stats block above.)
  noteRelicItemFind(meta, 'cryptbone_helm');
  noteRelicObtain(meta, 'cryptbone_helm', 3);
  meta.talentMods.spec = 'arms';
  meta.loadouts = [{ name: 'PvP', alloc: { spec: 'arms', rows: {} }, bar: [] }];
  meta.activeLoadout = 0;

  // Session-scoped account cosmetics.
  leader.accountCosmetics = {
    completedQuestIds: ['q_aldrics_fallen_star'],
    mechChromaIds: ['amber_crimson'],
    weaponSkinIds: [],
    weaponSkinLoadout: {},
    mountSkinIds: [],
  };
  // Session-scoped stored action-bar layout (`hbl`, self-only): set the frozen
  // join-time wire view (the per-profile document plus the desktop `forms`
  // mirror), pre-serialized as the session holds it, so the heavy self block
  // wires it once.
  const hotbarForms = {
    normal: { bar: [{ type: 'ability' as const, id: 'heroic_strike' }], attack: null },
  };
  leader.initialHotbarLayoutJson = JSON.stringify({
    v: 2,
    forms: hotbarForms,
    profiles: { desktop: { v: 1, forms: hotbarForms } },
  });

  // Player Entity fields.
  p.cooldowns.set('heroic_strike', 5);
  p.abilityCharges = {
    ice_block: { charges: 1, maxCharges: 2, recharge: 10, rechargeLength: 240 },
  };
  p.stats = { ...p.stats, str: 12345, pvpOffense: 0.17, pvpDefense: 0.13 };
  p.weapon = { ...p.weapon, min: 999 };
  // dualWielding is not a delta key (derived client-side from offhandWeapon,
  // src/net/combat_scalar_wire.ts); setting offhandWeapon alone dirties it.
  p.offhandWeapon = { min: 3, max: 6, speed: 1.8 };
  p.resource = 42;
  p.maxResource = 150;
  // corpse: the ghost-run body marker (self-only delta). Non-null = a ghost with a
  // body to run back to; the encoder reads p.corpsePos via maybe('corpse', ...).
  p.corpsePos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };

  // Trade / duel / loot-roll: poke the exact collections the encoder reads.
  sim.trades.set(lp, {
    a: lp,
    b: mp,
    offerA: { items: [], copper: 10 },
    offerB: { items: [], copper: 0 },
    acceptedA: true,
    acceptedB: false,
  });
  sim.duels.set(lp, { a: lp, b: mp, state: 'countdown', timer: 3 });
  (sim as any).pendingLootRolls.set(1, {
    id: 1,
    itemId: 'baked_bread',
    itemName: 'Baked Bread',
    quality: 'common',
    expiresAt: 9999,
    candidates: [lp],
    partyMembers: [lp, mp],
    choices: new Map(),
  });
  // `mloot`: a SECOND roll, still in its master-loot curate phase with the leader
  // as the master looter. Deliberately distinct from the need/greed roll above so
  // the two surfaces cannot be confused: activeLootRolls/lootRollGroupStatus skip
  // this one (masterLooter set) and activeMasterLootRolls skips that one.
  (sim as any).pendingLootRolls.set(2, {
    id: 2,
    itemId: 'greyjaw_hide_boots',
    itemName: 'Greyjaw Hide Boots',
    quality: 'uncommon',
    expiresAt: 9999,
    candidates: [lp, mp],
    candidateNames: new Map([
      [lp, 'Alld'],
      [mp, 'Memb'],
    ]),
    partyMembers: [lp, mp],
    choices: new Map(),
    masterLooter: lp,
  });

  // Enchanting-action outcomes (Professions 2.0): poke the exact
  // PlayerMeta fields the denc/ench/salv encoders read
  // (lastDisenchantResultFor/lastEnchantResultFor/lastSalvageResultFor), each a
  // distinguishable non-null value so the round-trip and first-snapshot pins are
  // meaningful. The disenchant carries the typed bind-on-trade secondary; the
  // enchant is a deny arm (reason survives).
  meta.lastDisenchantResult = {
    ok: true,
    itemId: 'zealotsbane_blade',
    materialItemId: 'arcane_essence',
    count: 1,
    secondaryItemId: 'wolf_fang',
    secondaryCount: 1,
  };
  meta.lastEnchantResult = {
    ok: false,
    itemId: 'apprentice_staff',
    enchantId: 'ench_test_flat_stamina',
    reason: 'insufficient_materials',
  };
  meta.lastSalvageResult = {
    ok: true,
    itemId: 'zealotsbane_blade',
    materialItemId: 'spider_leg',
    count: 2,
  };

  // Realm-wide world-boss liveness (`wba`), intentionally separate from the
  // viewer's personal loot lockout. Spawn through the real Sim primitive while
  // leaving the scheduler clocks alone so the rest of this codec fixture stays still.
  (sim as any).worldBossEntityIds[0] = (sim as any).spawnWorldBoss(WORLD_BOSSES[0]);

  return { server, fc, leader, memberPid: mp };
}

describe('full self-state snapshot delta fixture', () => {
  it('mirrors an exact pair and completes the online combo craft command end to end', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 71, 'Combo');
    const meta = server.sim.meta(session.pid)!;
    meta.craftSkills.armorcrafting = 25;
    meta.craftSkills.weaponcrafting = 25;
    meta.archetype = {
      activeArchetype: 'armorcrafting',
      pairedMajor: 'weaponcrafting',
      hobbyCraft: 'leatherworking',
      attunedPairs: ['weaponcrafting+armorcrafting'],
      switchCount: 0,
      amendsProgress: 0,
      isJackOfAllTrades: false,
    };
    // Reagents for the warplate helm.
    meta.inventory = [
      { itemId: 'arcanite_bar', count: 1 },
      { itemId: 'thorium_ore', count: 5 },
      { itemId: 'wolf_fang', count: 4 },
      { itemId: 'smithing_flux', count: 2 },
    ];
    // Acquisition switch: combo recipes are trainer-taught now, so a
    // fresh test player must learn this one explicitly before crafting it.
    meta.knownRecipes.add('recipe_ironbound_warplate_helm');

    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    const recipe = COMBO_RECIPES.find((entry) => entry.id === 'recipe_ironbound_warplate_helm')!;
    const view = buildCraftingView(
      [recipe],
      client.inventory,
      ITEMS,
      client.craftSkills,
      client.craftingIdentity,
    );
    expect(client.craftingIdentity.synced).toBe(true);
    expect(view.recipes[0].craftable).toBe(true);

    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'craft_item', recipe: recipe.id }),
    );
    completeCraftCast(server.sim as never, session.pid);
    expect(server.sim.countItem(recipe.resultItemId, session.pid)).toBe(1);
  });

  it('train_recipe online: fee hits the self copper and the SORTED knownRecipes rides the cprof delta', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 72, 'Trainee');
    const meta = server.sim.meta(session.pid)!;
    meta.craftSkills.armorcrafting = 25; // ironbound is armorcrafting
    meta.craftSkills.weaponcrafting = 25; // forgeguard is weaponcrafting
    meta.copper = 10000;
    // Stand at the Eastbrook forge: training is gated on the STATIC station.
    // Re-pinned 2026-08 for the harbor move (d19aa33f76,
    // docs/design/eastbrook-revamp/site-plan.md): station_eastbrook_forge moved
    // with the smithy to (-5.80, -123.90); stand ~0.2yd from its center.
    const player = server.sim.entities.get(session.pid)!;
    player.pos = { ...player.pos, x: -6, z: -124 };
    player.prevPos = { ...player.pos };

    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.craftingIdentity.knownRecipes).toEqual([]);

    // Learn the two forge combos in REVERSE alphabetical order: the mirror
    // must come back SORTED (the stable-signature contract), never insertion
    // ordered, and each train charges its 2500 fee exactly once.
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'train_recipe',
        recipe: 'recipe_ironbound_warplate_helm',
      }),
    );
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'train_recipe',
        recipe: 'recipe_forgeguard_bulwark_gauntlets',
      }),
    );
    expect(server.sim.meta(session.pid)?.copper).toBe(5000);

    fc.sent.length = 0;
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    // Liveness: the ClientWorld read surface reflects the grant with NO
    // explicit dirty-marking anywhere in the dispatch case (knownRecipes is
    // part of craftingIdentityFor's JSON, so the cprof maybe() diff fires).
    expect(client.craftingIdentity.knownRecipes).toEqual([
      'recipe_forgeguard_bulwark_gauntlets',
      'recipe_ironbound_warplate_helm',
    ]);
    expect(client.copper).toBe(5000);
  });

  it('carries every one of the dirtied delta keys on the first snapshot', () => {
    const { server, fc } = dirtyEveryDeltaField();
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap).not.toBeNull();
    for (const key of ALL_DELTA_KEYS) {
      // `de` is capability-only and this fixture joins WITHOUT the
      // entry-facing capability on purpose (its mirror assertions pin the
      // legacy wire shapes), so its absence here IS the legacy-exclusion
      // contract; the capable first-send/elision lifecycle is pinned in
      // tests/server/dungeon_entry_facing.test.ts (see CAPABILITY_DELTA_KEYS).
      // `auras` needs no carve-out: the legacy base self record carries it.
      if (key === 'de') {
        expect(snap.self, 'self.de sent to a legacy session').not.toHaveProperty(key);
        continue;
      }
      expect(snap.self, `self.${key} missing from first snapshot`).toHaveProperty(key);
      // each was dirtied to a non-default value, so none rides the wire as null
      // EXCEPT cvault: this harness player carries a live delve run (the drun
      // key's own seeding), and the craft-draw gate refuses vault draw inside
      // a delve, so cvault's dirtied first-snapshot value IS the explicit
      // gated null: the two keys are mutually exclusive on one player by
      // design. Its non-null arrival (and the by-reference mirror) is pinned
      // in tests/vault_wire.test.ts instead.
      // This fixture stands at a different banker; the weekly keeper gate stays closed.
      if (key === 'cvault' || key === 'weeklyRewards') {
        expect(snap.self[key], 'self.cvault must arrive as the explicit gated null').toBeNull();
        continue;
      }
      expect(snap.self[key], `self.${key} arrived null`).not.toBeNull();
    }
  });

  it('mirrors every dirtied self value onto the correct decode target', () => {
    const { server, fc, leader, memberPid } = dirtyEveryDeltaField();
    broadcast(server);
    const client = bareClient(leader.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));

    expect(client.factionCurrencies).toEqual({ rift_watch: 17, church_order: 29, automatons: 41 });
    expect(client.treasureMap).toEqual({ rarity: 'epic', siteId: TREASURE_SITES[0].id });
    expect(lastSnap(fc.sent).self.tmap).not.toHaveProperty('seed');

    // --- fields that decode onto the player ENTITY (client.player), not the client ---
    expect(client.player.cooldowns.get('heroic_strike')).toBe(5); // cds -> e.cooldowns
    expect(client.player.abilityCharges?.ice_block?.charges).toBe(1); // achg -> e.abilityCharges
    // achr -> the same records' recharge timer (legacy wire: raw [remaining, length]);
    // it is hand-decoded inside the achg block, so it has no TERSE_TO_IWORLD
    // rename entry.
    expect(client.player.abilityCharges?.ice_block?.recharge).toBe(10);
    expect(client.player.abilityCharges?.ice_block?.rechargeLength).toBe(240);
    expect(client.player.stats).toMatchObject({
      str: 12345,
      pvpOffense: 0.17,
      pvpDefense: 0.13,
    }); // stats (inline s.X ?? e.X, legacy-safe object replacement)
    expect(client.player.weapon).toMatchObject({ min: 999 }); // weapon (inline s.X ?? e.X)
    expect(client.player.inCombat).toBe(true); // cbt -> e.inCombat (combat_scalar_wire.ts)
    expect(client.player.resource).toBe(42); // res -> resource
    expect(client.player.maxResource).toBe(150); // mres -> maxResource
    expect(client.player.resourceType).toBe('rage'); // rtype -> resourceType

    // --- always-present scalar renames ---
    expect(client.lifetimeXp).toBe(555); // lxp -> lifetimeXp
    expect(client.honor).toBe(321); // honor
    expect(client.lifetimeHonor).toBe(654); // lhonor -> lifetimeHonor
    // wpvp -> worldPvpInfo (social_self_wire.ts), and the entity-record pvp bit
    // -> e.pvpFlag on the self record (a full record) for the flagged leader.
    expect(client.worldPvpInfo).toMatchObject({
      flagged: true,
      kills: 2,
      deaths: 1,
      zone: 'contested', // the fixture leader stands on contested ground
      enabled: true,
    });
    expect(client.player.pvpFlag).toBe(true);
    // hill -> hillInfo (social_self_wire.ts): the standing hill from the
    // leader's seat (outside its zone, so the live fields are zero; the
    // fixture leader is ungrouped, so counts as a group of one).
    expect(client.hillInfo).toMatchObject({
      radius: 50,
      phase: 'active',
      standing: 'counted',
      holder: 'none',
      inZone: false,
      inside: false,
      minutesLeft: 45,
    });
    expect(['drakelands', 'frostveil', 'amberfall']).toContain(client.hillInfo?.zoneId);
    expect(client.restedXp).toBe(222); // rxp -> restedXp
    expect(client.prestigeRank).toBe(3); // prk -> prestigeRank

    // --- fields that decode onto the client ---
    expect(client.inventory).toEqual([
      { itemId: 'baked_bread', count: 3 },
      { itemId: 'reins_grag_bear', count: 1 },
    ]); // inv -> inventory
    expect(client.vendorBuyback).toEqual([{ itemId: 'apprentice_staff', count: 1 }]); // buyback -> vendorBuyback
    expect(client.equipment).toMatchObject({ mainhand: 'zealotsbane_blade' }); // equip -> equipment
    expect(client.equipmentInstances.ring1?.rolled?.stats).toEqual({ str: 2 });
    // cosmetics -> accountCosmetics, asserted against the normalized shape (the input
    // is already the normal {completedQuestIds, mechChromaIds} form, see :192-202)
    expect(client.accountCosmetics).toEqual({
      completedQuestIds: ['q_aldrics_fallen_star'],
      mechChromaIds: ['amber_crimson'],
      weaponSkinIds: [],
      weaponSkinLoadout: {},
      mountSkinIds: [],
    });
    expect([...client.questLog.values()]).toEqual([
      { questId: 'q_widows', counts: [10, 0], state: 'active' },
    ]); // qlog -> questLog (Map)
    expect(client.questsDone.has('q_wolves')).toBe(true); // qdone -> questsDone (Set)
    expect(client.worldQuestCycle).toBe('wq1_0'); // wqday -> canonical worldQuestCycle
    expect(client.worldQuestExpiresAtMs).toBe(FAR_FUTURE_MS); // wqexp -> rotation deadline
    expect([...client.worldQuestLog.values()]).toEqual([
      { questId: 'wq_eastbrook_bandits', count: 2, state: 'active' },
    ]); // wqlog -> worldQuestLog (Map)
    expect(client.unlockedMilestones).toEqual(['milestone_test']); // milestones -> unlockedMilestones
    // lockouts -> selfLockouts (private), via the raidLockouts() accessor
    expect(client.raidLockouts().map((l) => l.id)).toEqual(['nythraxis_boss_arena']);
    expect(client.worldBossActive(WORLD_BOSSES[0].templateId)).toBe(true); // wba -> private id set
    // mnt is active identity only: a persisted pick must not make a dismounted
    // online player render or move as mounted.
    expect(client.player.mountKey).toBe('');
    // mntOwn -> selfOwnedMounts (private), via the ownedMounts() accessor. The
    // horse is no longer auto-owned, so the collection is exactly what the reins
    // item in the seeded inventory grants (server ownedMountsFor -> wire -> mirror).
    expect(client.ownedMounts()).toEqual(['grag_bear']);
    expect(client.mountLessonActive()).toBe(true);
    expect(client.mountRaceView()).toMatchObject({
      raceId: 'race_wire_fixture',
      phase: 'racing',
      clearedMask: 3,
      cleared: 2,
    });
    expect(client.ridingTrained()).toBe(true); // mntRtd -> ridingTrained
    expect(client.partyInfo).not.toBeNull(); // party -> partyInfo
    expect(client.partyInfo?.members.some((m) => m.pid === memberPid)).toBe(true);
    expect(client.markerFor(memberPid)).toBe(3); // marks -> markers, via markerFor()
    expect((client.tradeInfo as any)?.otherPid).toBe(memberPid); // trade -> tradeInfo
    expect((client.duelInfo as any)?.state).toBe('countdown'); // duel -> duelInfo
    expect(client.arenaInfo).not.toBeNull(); // arena -> arenaInfo
    expect(client.bgInfo).not.toBeNull(); // bg -> bgInfo (queue/standing readout)
    expect(client.marketInfo).not.toBeNull(); // market -> marketInfo
    expect(client.marketCollectPending).toBe(true); // mktU -> marketCollectPending (truthy bit)
    expect(client.bankInfo).not.toBeNull(); // bank -> bankInfo
    expect(client.bankInfo?.slots).toEqual([{ itemId: 'wolf_fang', count: 2 }]); // bank contents mirror
    // vault -> vaultInfo: the owner-only Materials Vault clone survives whole,
    // both derived numbers included (rung 2 of the 40-per-rung ladder, priced
    // from the rung-2 literal in src/sim/materials_vault.ts).
    expect(client.vaultInfo).toEqual({
      stock: { copper_ore: 7 },
      special: [],
      upgrades: 2,
      perMaterialCap: 80,
      nextUpgradeCost: 100000,
    });
    // cvault -> craftVaultStock: this harness player is inside a delve run
    // (see the seeding comment), so the gated null is all that can arrive
    // here, and null is ALSO the mirror default: this line alone cannot prove
    // the decode. The decisive decode pins (stocked non-null arrival, the
    // by-reference adoption, the gate-flip explicit null) live in
    // tests/vault_wire.test.ts.
    expect(client.craftVaultStock).toBeNull();
    expect(client.guildBankInfo).not.toBeNull(); // guildBank -> guildBankInfo
    // guild bank mirror: the membership-gated boundary clone survives the wire
    // whole, canEdit included (the client renders read-only panes from it)
    expect(client.guildBankInfo).toEqual({
      treasury: 12345,
      // loadGuildBank sanitizes on load (normalizeLoadedMaterialSlot), so an
      // unsigned legacy wolf_fang stack picks up its exact provenance.
      slots: [{ itemId: 'wolf_fang', count: 4, materialSources: [{ count: 4, source: {} }] }],
      capacity: 30,
      purchasedSlots: 30,
      nextExpansionPrice: 50000, // rung-2 literal
      canEdit: true,
    });
    expect(client.activeLootRolls().map((r) => r.rollId)).toEqual([1]); // lroll -> lootRollPrompts
    // mloot -> masterLootPrompts, via the activeMasterLootRolls() accessor. Roll 2
    // only: the curate-phase master roll is master-looter-only, and roll 1 (a plain
    // need/greed roll) must never leak onto it.
    expect(client.activeMasterLootRolls()).toEqual([
      {
        rollId: 2,
        itemId: 'greyjaw_hide_boots',
        itemName: 'Greyjaw Hide Boots',
        quality: 'uncommon',
        expiresAt: 9999,
        candidates: [
          { pid: leader.pid, name: 'Alld' },
          { pid: memberPid, name: 'Memb' },
        ],
      },
    ]);
    // lrollg -> lootRollGroup, via the lootRollGroupStatus() accessor
    expect(client.lootRollGroupStatus()).toEqual([
      {
        rollId: 1,
        itemId: 'baked_bread',
        itemName: 'Baked Bread',
        quality: 'common',
        expiresAt: 9999,
        entries: [{ pid: leader.pid, name: 'Alld', choice: null }],
      },
    ]);
    expect(client.delveRun).not.toBeNull(); // drun -> delveRun
    expect(client.companionState?.companionId).toBe('companion_tessa'); // dcompanion -> companionState
    expect(client.delveMarks).toBe(7); // dmarks -> delveMarks
    expect(client.companionUpgrades).toEqual({ companion_tessa: 2 }); // dcomp -> companionUpgrades
    expect(client.gatheringProficiency).toEqual({
      mining: 6,
      logging: 0,
      herbalism: 0,
      fishing: 0,
      farming: 0,
    }); // gprof -> gatheringProficiency
    // hpref -> harvestPreference: the wire carries a plain material item id
    // string (never the tag/specimen it resolves against on a body), decoded
    // through decodeHarvestPreferenceWire into the same shape the offline Sim
    // exposes via harvestPreferenceFor.
    expect(client.harvestPreference).toEqual({ kind: 'material', itemId: 'rough_hide' });
    // tslot -> toolEffectSlots: the projected row shape, so a decode onto the
    // wrong field or a renamed wire key reddens here rather than silently
    // leaving the HUD empty. craftedBy is deliberately not projected; what
    // crosses instead is the R48 selfCrafted boolean (false here: the
    // fixture's direct meta write recorded no crafter).
    expect(client.toolEffectSlots).toEqual([
      {
        professionId: 'mining',
        effectId: 'gatherers_cache',
        charges: 12,
        maxCharges: 20,
        confirmMode: 'always',
        selfCrafted: false,
      },
    ]);
    // fplot -> myFarmPlots: the projected row shape, written out fresh here
    // rather than compared against the fixture's PlotState, which carries the
    // hidden slots and no status. The knob flags are deliberately mixed so a
    // decode that dropped or transposed one reddens.
    expect(client.myFarmPlots).toEqual([
      {
        bedId: 'bed_eastbrook_1',
        cropId: 'vale_wheat',
        plantedAtMs: 1_700_000_000_000,
        readyAtMs: FAR_FUTURE_MS,
        compost: true,
        watch: true,
        tonic: false,
        notified: false,
        status: 'growing',
      },
    ]);
    // ncd -> nodeHarvestableByMe: the cooling-down node reads not-ready, an
    // untouched node (never in the map) still reads ready.
    expect(client.nodeHarvestableByMe(GATHER_NODES[0].id)).toBe(false);
    expect(client.nodeHarvestableByMe('not_a_real_node')).toBe(true);
    // Re-pin: the enforced per-profession caps
    // (mining/logging/herbalism/farming 100, fishing 200) replace the old
    // uniform 300, in the append-last order farming joined in.
    expect(client.professionsState).toEqual({
      skills: [
        { professionId: 'mining', skill: 6, maxSkill: 100 },
        { professionId: 'logging', skill: 0, maxSkill: 100 },
        { professionId: 'herbalism', skill: 0, maxSkill: 100 },
        { professionId: 'fishing', skill: 0, maxSkill: 200 },
        { professionId: 'farming', skill: 0, maxSkill: 100 },
      ],
    }); // prof -> professionsState
    expect(client.craftingIdentity).toMatchObject({
      version: 1,
      synced: true,
      activeArchetype: 'armorcrafting',
      pairedMajor: 'weaponcrafting',
      hobbyCraft: 'leatherworking',
      attunedPairs: ['weaponcrafting+armorcrafting'],
      switchCount: 2,
      amendsProgress: 4,
      amendsRequired: 11,
    }); // cprof -> craftingIdentity
    // The pair-named archetype title derives LIVE from the mirrored
    // craftingIdentity (Professions 2.0): the canonical pair id, not a
    // craft id, and it must reflect the cprof delta just applied.
    expect(client.archetypeTitle).toBe('weaponcrafting+armorcrafting');
    expect(client.craftSkills).toMatchObject({ armorcrafting: 31, weaponcrafting: 29 });
    // ggoal -> gatheringGoal: the tracked recipe goal survives the wire whole,
    // decoded through the strict leaf gathering_goal_wire.ts (its own key,
    // never folded into cprof). A crossed identity/kind, a wrong count, or a
    // status/reason mismatch reddens here.
    expect(client.gatheringGoal?.goal).toEqual({
      kind: 'recipe',
      recipeId: 'recipe_ironbound_warplate_helm',
      count: 5,
    });
    expect(client.gatheringGoal?.status).toBe('collecting');
    expect(client.gatheringGoal?.reason).toBeNull();
    // storageRestricted: this fixture's live delve run (drun) refuses the
    // vault draw for craft reagents the same way it does for cvault above.
    expect(client.gatheringGoal?.storageRestricted).toBe(true);
    // No fixture inventory or bank slot carries arcanite_bar, so nothing is
    // payable and that row arrives entirely missing.
    expect(client.gatheringGoal?.payableCrafts).toBe(0);
    expect(
      client.gatheringGoal?.materials.some(
        (m) => m.itemId === 'arcanite_bar' && m.carried === 0 && m.missing > 0,
      ),
    ).toBe(true);
    // mst -> activeMobileStationCrafts: the server-computed serving set as a
    // comma-joined scalar (expiry and party range resolved server-side
    // against the sim's own tickCount and positions), split on decode.
    expect(client.activeMobileStationCrafts).toEqual(['armorcrafting']);
    // denc/ench/salv -> lastDisenchantResult/lastEnchantResult/lastSalvageResult
    // (Professions 2.0): the delta arm mirrors the exact stash. JSON drops
    // undefined fields, so each decoded object carries no undefined keys; the
    // disenchant secondary and the enchant deny reason both survive.
    expect(client.lastDisenchantResult).toEqual({
      ok: true,
      itemId: 'zealotsbane_blade',
      materialItemId: 'arcane_essence',
      count: 1,
      secondaryItemId: 'wolf_fang',
      secondaryCount: 1,
    });
    expect(client.lastEnchantResult).toEqual({
      ok: false,
      itemId: 'apprentice_staff',
      enchantId: 'ench_test_flat_stamina',
      reason: 'insufficient_materials',
    });
    expect(client.lastSalvageResult).toEqual({
      ok: true,
      itemId: 'zealotsbane_blade',
      materialItemId: 'spider_leg',
      count: 2,
    });
    expect(client.delveClears).toEqual({ 'collapsed_reliquary:heroic': 1 }); // dclears -> delveClears
    expect(client.delveDaily).toMatchObject({ markClears: 4 }); // delveDaily
    // deeds -> deedsEarned: the Map rebuilds from the plain wire object with
    // both utcDay stamps intact (a Map does not survive JSON.stringify)
    expect([...client.deedsEarned.entries()]).toEqual([
      ['prog_first_steps', '2026-07-01'],
      ['prog_veteran', '2026-07-08'],
    ]);
    // dstats -> deedStats: counters survive and BOTH Sets rebuild from arrays
    expect(client.deedStats.counters.kills).toBe(7);
    expect(client.deedStats.itemsDiscovered.has('wolf_fang')).toBe(true);
    expect(client.deedStats.visited.has('npc:chronicler_saul')).toBe(true);
    expect(client.deedStats.dungeonClears).toEqual({ hollow_crypt: 2 });
    expect(client.renown).toBe(15); // renown (same name both sides, no rename)
    expect(client.activeTitle).toBe('prog_veteran'); // atitle -> activeTitle
    expect(client.activeBorder).toBe('prog_prestige_10'); // aborder -> activeBorder
    // reliq fans out to reliquaryFirstFind / Marks / Recent (asserted directly like
    // tal; no TERSE_TO_IWORLD rename). Sparse blob only; not a second discovery set.
    // Phase 17 wire shape change: pageId dropped from the entry, the obtain
    // tally folded onto it. The mirror splits `count` back out into
    // reliquaryObtainCounts, so the entry itself carries clears alone.
    expect(client.reliquaryFirstFind.cryptbone_helm).toEqual({ clears: 2 });
    expect(client.reliquaryObtainCounts).toEqual({ cryptbone_helm: 3 });
    expect(client.reliquaryRecent).toEqual(['cryptbone_helm']);
    // tal -> talents / talentSpec / loadouts / activeLoadout
    expect(client.talents).toEqual({ spec: 'arms', rows: {} });
    expect(client.talentSpec).toBe('arms');
    expect(client.loadouts).toEqual([{ name: 'PvP', alloc: { spec: 'arms', rows: {} }, bar: [] }]);
    expect(client.activeLoadout).toBe(0);
    // hbl -> the login action-bar restore (self-only, resolved once on the first
    // self payload). A stored server document arrives as a 'server' restore
    // carrying every profile (the `forms` mirror is for pre-profile bundles and
    // is not mirrored); like tal it is asserted directly (no TERSE_TO_IWORLD
    // rename entry).
    expect(client.takeActionBarLayoutRestore()).toEqual({
      source: 'server',
      profiles: {
        v: 2,
        profiles: {
          desktop: {
            v: 1,
            forms: { normal: { bar: [{ type: 'ability', id: 'heroic_strike' }], attack: null } },
          },
        },
      },
    });
  });

  it('mirrors canEdit FALSE for a member-rank viewer (the read-only arm over the real wire)', () => {
    // The fixture above rides canEdit true (officer). This is the negative the
    // feature exists for: a plain member's snapshot must arrive non-null with
    // canEdit false, and a demotion mid-session must flip the live mirror
    // without nulling it.
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 91, 'Grunt');
    const sim = server.sim;
    const p = sim.entities.get(session.pid)!;
    const banker = sim.entities.get(sim.bankerIds[0])!;
    banker.pos = { ...p.pos };
    sim.setPlayerGuildMembership(session.pid, { guildId: 9, rank: 'officer' });
    sim.loadGuildBank(9, {
      treasury: 777,
      inventory: [{ itemId: 'wolf_fang', count: 4 }],
      purchasedSlots: 24,
    });
    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.guildBankInfo?.canEdit).toBe(true);
    // The demotion re-stamp: same guild, member rank. The stream must STAY
    // (read-only view), only the edit verdict flips.
    sim.setPlayerGuildMembership(session.pid, { guildId: 9, rank: 'member' });
    broadcast(server);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.guildBankInfo).not.toBeNull();
    expect(client.guildBankInfo?.canEdit).toBe(false);
    expect(client.guildBankInfo?.slots).toEqual([
      { itemId: 'wolf_fang', count: 4, materialSources: [{ count: 4, source: {} }] },
    ]);
  });

  it('keeps the live ride distinct from the persisted mount pick on self snapshots', () => {
    const { server, fc, leader } = dirtyEveryDeltaField();
    server.sim.entities.get(leader.pid)!.mountKey = 'valorsteed';
    broadcast(server);
    const snapshot = lastSnap(fc.sent);
    expect(snapshot.self.mnt).toBe('valorsteed');
    // There is no persisted pick any more: mntSel left the wire when reins became
    // usable items, so the active mount is the only mount field on the snapshot.
    expect(snapshot.self).not.toHaveProperty('mntSel');

    const client = bareClient(leader.pid);
    (client as any).applySnapshot(snapshot);
    expect(client.player.mountKey).toBe('valorsteed');
  });

  it('flips mst to null when the mobile station expires (server-side tick-domain check)', () => {
    // The expiry arm of the mst self-delta: activeMobileStationCraftsFor
    // resolves active-vs-expired against the SERVER sim's own tickCount, so
    // the lapse must reach the client as an explicit mst: null delta (a
    // nullable joined scalar; omission would leave the stale set mirrored).
    const { server, fc, leader } = dirtyEveryDeltaField();
    broadcast(server);
    const client = bareClient(leader.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.activeMobileStationCrafts).toEqual(['armorcrafting']);

    const meta = server.sim.meta(leader.pid);
    if (!meta?.mobileStation) throw new Error('mobile station missing from the harness');
    meta.mobileStation.expiresAtTick = server.sim.tickCount; // isStationActive: now < expiry fails
    server.sim.tick();
    broadcast(server);
    const lapsedSnap = lastSnap(fc.sent);
    // The explicit null on the wire, never an omission: an empty serving set
    // must overwrite the mirror.
    expect(lapsedSnap.self.mst).toBeNull();
    (client as any).applySnapshot(lapsedSnap);
    expect(client.activeMobileStationCrafts).toEqual([]);
  });

  it('carries an in-range party-shared station craft on mst and clears it when the viewer walks out', () => {
    // The party arm of the mst self-delta over a real GameServer: B holds an
    // ACTIVE partyShared station (the Master's Field Forge item path; the
    // meta slot is stamped directly, the placement gates are pinned in
    // tests/mobile_station_party.test.ts), A stands within STATION_RADIUS of
    // it, so A's OWN snapshot must carry the craft. The key is
    // MOVEMENT-DRIVEN: walking A out of range must clear it with an explicit
    // mst: null delta on the next broadcast, no placement change involved.
    const server = new GameServer();
    const fcA = fakeWs();
    const fcB = fakeWs();
    const a = joinServer(server, fcA, 41, 'Walker');
    const b = joinServer(server, fcB, 42, 'Forger', 'mage');
    const sim = server.sim;
    sim.partyInvite(b.pid, a.pid);
    sim.partyAccept(b.pid);
    const ea = sim.entities.get(a.pid)!;
    const eb = sim.entities.get(b.pid)!;
    eb.pos.x = 0;
    eb.pos.z = 150;
    eb.prevPos = { ...eb.pos };
    ea.pos.x = STATION_RADIUS / 2; // inside the serving radius
    ea.pos.z = 150;
    ea.prevPos = { ...ea.pos };
    sim.meta(b.pid)!.mobileStation = {
      playerId: 'Forger',
      craftId: 'weaponcrafting',
      partyShared: true,
      pos: { x: eb.pos.x, z: eb.pos.z },
      placedAtTick: sim.tickCount,
      expiresAtTick: sim.tickCount + 12000,
    };

    broadcast(server);
    const inRangeSnap = lastSnap(fcA.sent);
    expect(inRangeSnap.self.mst).toBe('weaponcrafting');
    const client = bareClient(a.pid);
    (client as any).applySnapshot(inRangeSnap);
    expect(client.activeMobileStationCrafts).toEqual(['weaponcrafting']);

    // Same raw value again: the split is cached against the raw string, so
    // an identical delta must keep ARRAY IDENTITY (no per-snapshot
    // reallocation), and the cached array is frozen against consumer
    // mutation.
    const cached = client.activeMobileStationCrafts;
    (client as any).applySnapshot(inRangeSnap);
    expect(client.activeMobileStationCrafts).toBe(cached);
    expect(Object.isFrozen(client.activeMobileStationCrafts)).toBe(true);

    // A also holds an OWN active station of a different craft: the wire
    // value becomes the SORTED comma-join and the split round-trips BOTH
    // elements. This is the multi-element arm the whole set widening exists
    // for; a delimiter mutation on either side dies here.
    sim.meta(a.pid)!.mobileStation = {
      playerId: 'Walker',
      craftId: 'alchemy',
      partyShared: false,
      pos: { x: ea.pos.x, z: ea.pos.z },
      placedAtTick: sim.tickCount,
      expiresAtTick: sim.tickCount + 12000,
    };
    broadcast(server);
    const twoSnap = lastSnap(fcA.sent);
    expect(twoSnap.self.mst).toBe('alchemy,weaponcrafting');
    (client as any).applySnapshot(twoSnap);
    expect(client.activeMobileStationCrafts).toEqual(['alchemy', 'weaponcrafting']);

    // The join is only unambiguous while craft ids stay comma-free; pin the
    // whole catalog so a comma-bearing id is a deliberate wire decision.
    for (const craft of CRAFT_RING) expect(craft.id).not.toContain(',');

    // A walks past STATION_RADIUS of the station; the very next broadcast
    // must drop the shared craft even though no station was placed or
    // expired (the own station keeps serving at any distance).
    sim.meta(a.pid)!.mobileStation = null;
    ea.pos.x = STATION_RADIUS * 3;
    ea.prevPos = { ...ea.pos };
    broadcast(server);
    const outOfRangeSnap = lastSnap(fcA.sent);
    expect(outOfRangeSnap.self.mst).toBeNull();
    (client as any).applySnapshot(outOfRangeSnap);
    expect(client.activeMobileStationCrafts).toEqual([]);
    // The empty transition hands back the ONE shared frozen empty by
    // identity (EMPTY_MST_CRAFTS), the same contract the offline resolver
    // pins for its EMPTY_CRAFTS, so the empty case never reallocates and a
    // consumer mutation throws in both worlds. Decisive because the client
    // held a NON-empty split just above, so this value can only have come
    // out of the decode's empty arm.
    expect(client.activeMobileStationCrafts).toBe(EMPTY_MST_CRAFTS);
    expect(Object.isFrozen(client.activeMobileStationCrafts)).toBe(true);
    // FIXTURE-contract pin only (bareClient assigns the same import, so this
    // cannot exercise ClientWorld's field initializer): the shared test
    // double must keep mirroring the class default by identity.
    expect(bareClient(a.pid).activeMobileStationCrafts).toBe(EMPTY_MST_CRAFTS);

    // Drop-malformed wire idiom: the shipped encoder sends null for the
    // empty set (asserted above) and a non-empty join can never be '', so
    // an empty STRING mst only reaches the decoder from a buggy or
    // adversarial server, and it must decode as the empty set rather than
    // [''] leaking a phantom craft row.
    (client as any).applySnapshot({ ents: [], keep: [], self: { mst: '' } });
    expect(client.activeMobileStationCrafts).toEqual([]);
    expect(client.activeMobileStationCrafts).toBe(EMPTY_MST_CRAFTS);
  });

  it('omits all delta keys on a no-op re-broadcast and preserves the prior mirror', () => {
    const { server, fc, leader, memberPid } = dirtyEveryDeltaField();
    broadcast(server);
    const client = bareClient(leader.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));

    // capture the structures decoded from snapshot #1, by reference
    const invRef = client.inventory;
    const cooldownsRef = client.player.cooldowns;
    const statsRef = client.player.stats;
    const weaponRef = client.player.weapon;
    const partyRef = client.partyInfo;
    const delveRunRef = client.delveRun;
    const vaultRef = client.vaultInfo;

    // a second broadcast with NO intervening sim.tick() and no state mutation: the
    // maybe() closure sees byte-identical JSON for every registered key and omits every one
    fc.sent.length = 0;
    broadcast(server);
    const snap2 = lastSnap(fc.sent);
    for (const key of ALL_DELTA_KEYS) {
      // `auras` only elides under the stable timer wire (pinned in the
      // negotiated stable timer wire suite); this legacy fixture receives it
      // on the always-present base self record, re-broadcast or not.
      if (key === 'auras') {
        expect(snap2.self, 'legacy self.auras left the base record').toHaveProperty(key);
        continue;
      }
      expect(snap2.self, `self.${key} resent although unchanged`).not.toHaveProperty(key);
    }

    // applying the delta-less snapshot keeps the prior mirror untouched, by reference
    // (covers both the `if (s.X !== undefined)` and the inline `s.X ?? e.X` forms)
    (client as any).applySnapshot(snap2);
    expect(client.inventory).toBe(invRef); // if !== undefined (client field)
    expect(client.player.cooldowns).toBe(cooldownsRef); // if !== undefined (player entity)
    expect(client.player.stats).toBe(statsRef); // s.stats ?? e.stats (inline, player entity)
    expect(client.player.weapon).toBe(weaponRef); // s.weapon ?? e.weapon (inline, player entity)
    expect(client.partyInfo).toBe(partyRef);
    expect(client.delveRun).toBe(delveRunRef);
    // an omitted `vault` must leave an open vault window's mirror alone, not
    // reset it to null (the omission-is-unchanged half of the delta contract)
    expect(client.vaultInfo).toBe(vaultRef);
    expect(client.markerFor(memberPid)).toBe(3);
    expect(client.delveMarks).toBe(7);
    expect(client.honor).toBe(321);
    expect(client.lifetimeHonor).toBe(654);
    expect(client.companionState?.companionId).toBe('companion_tessa');
  });

  it('authoritatively clears stale race and lesson mirrors after a missed end event', () => {
    const { server, fc, leader } = dirtyEveryDeltaField();
    broadcast(server);
    const client = bareClient(leader.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.mountLessonActive()).toBe(true);
    expect(client.mountRaceView()).not.toBeNull();

    const meta = server.sim.meta(leader.pid)!;
    meta.mountTraining = null;
    meta.mountRace = null;
    fc.sent.length = 0;
    broadcast(server);
    const ended = lastSnap(fc.sent);
    expect(ended.self.mntLesson).toBe(false);
    expect(ended.self.mntRace).toBeNull();

    (client as any).applySnapshot(ended);
    expect(client.mountLessonActive()).toBe(false);
    expect(client.mountRaceView()).toBeNull();
  });
});

describe('delta-key contract pins (anti-drift)', () => {
  it('ALL_DELTA_KEYS contains exactly 113 unique keys in sorted order', () => {
    // 109 plus the release batch's pending Town Focus and Spell Crit core keys.
    // +1: guildBank (Guild Bank Phase 2), +1: the battleground bg key, +1: the
    // commission order board's corder key (issue #1298), +1: the character
    // sheet's lifetime played-time key ptime, for 67, then +16: the static
    // combat-rating/progression scalars (ap/sp/sh/crit/dodge/blk/bval/crat/
    // hrat/hirat/xp/lxp/rxp/prk/copper/ddiff) moved off the always-present
    // self record and behind this same delta gate, for 83, then +1 reliq
    // (Reliquary Phase 3 sparse blob), +1 aborder (the Book of Deeds nameplate
    // border echo, atitle's sibling), and +1 `app` (the release's authored
    // modular look, which cannot come from the entity list because the
    // broadcast loop skips the viewer's own entity, and which is heavy and
    // immutable so it rides this channel instead of re-serializing per tick),
    // for 86. Every v0.36.0 sync conflicts here because each side pins its own
    // additions alone; the merged tree carries all of them, and this number
    // came from a run on the merged tree. The New Eastbrook program's Vale Cup
    // retirement then removes sport/vcup/vcupb, for 83, and the healPower
    // seam adds the derived Healing Power scalar hpw for 84. Bank Storage
    // Phase 2 then adds the purchased-slots key bpsl, the Materials Vault
    // blob vault, and the craft-vault stock cvault, for 87. Widening the
    // scrape to the direct maybeSerialized form then registers the two
    // capability-gated keys it had been blind to, the stable timer wire's
    // self auras channel and the dungeon entry facing token de
    // (CAPABILITY_DELTA_KEYS above), for 89.
    // On the Masterwrought branch the same three bank-storage keys arrived
    // through the 2026-08-29 v0.41.0 sync (the Materials Vault's owner-only
    // vault key from bank-storage phase 02, the craft-from-vault cvault key
    // from phase 04, context-gated, and the always-available owner-only ladder
    // key bpsl from phase 15, the one bank-family key with NO proximity gate,
    // emitted for the VIEWING session rather than the spectate anchor), beside
    // farming's own-plot key fplot, for 87 on that branch (no hpw, no auras,
    // no de yet). Every release sync conflicts here because each side pins its
    // own additions alone; the 2026-08-30 v0.41.0 sync carries both arms
    // (fplot in beside hpw, auras and de), for 90, measured on the merged
    // tree. The v0.42.0 sync then brings the release's melee-weaving off-hand
    // bar key offhandWeapon (delta-guarded like weapon/stats: a gear swap, not
    // a per-tick change; dualWielding rides no key of its own, it is always
    // exactly offhandWeapon !== null, so the client derives it), for 91,
    // counted from the merged registry above rather than from either side.
    // Intentional Gathering PR3 then adds the corpse-harvest preference key
    // hpref (a gathering-adjacent self scalar, sibling of gprof/tfocus/tslot),
    // for 92. Intentional Gathering PR4 adds the owner-only tracked-goal
    // full-view key ggoal (its own leaf, gathering_goal_wire.ts, not folded
    // into the gprof/tfocus/tslot/hpref cluster), for 94. The account ledger
    // (src/sim/account_ledger.ts) adds the heavy self key acct, for 95.
    // The World Quests branch adds its rotation id, expiry and progress mirrors
    // (wqday, wqexp, wqlog), the vehicle session and the world-boss liveness
    // key wba, for 100.
    // The faction standing (fac) and daily reroll (wqrr, wqrep) owner keys, for 103.
    // The weekly emissary's wkq and wkexp self keys, for 105, and the Clue
    // Scrolls active-hunt key cluh, for 106.
    // The Weekly Vault's weeklyRewards self key (PR 4052), for 107.
    // The World PvP flag readout wpvp (src/sim/pvp/world_pvp.ts) and the King of
    // the Hill readout hill (src/sim/pvp/hill.ts), at the second release/v0.44.0
    // base merge, for 109.
    // The release batch's pending Town Focus and the Spell Crit sheet cell's
    // shared crit core scb (server/self_scalar_wire.ts), at the third
    // release/v0.44.0 base merge, for 111.
    expect(ALL_DELTA_KEYS).toHaveLength(113);
    expect(new Set(ALL_DELTA_KEYS).size).toBe(113);
    expect([...ALL_DELTA_KEYS]).toEqual([...ALL_DELTA_KEYS].sort());
  });

  it('the parked-mana field sm is an omit-when-default BASE self field, never a delta key', () => {
    // The release's druid parked-mana wire field (Phase 18 release-hygiene pin):
    // it is written straight onto the always-sent self object in selfWireJson
    // (`self.sm = wireParkedMana(...)`, omitted at rest), and the client's
    // absent-means-zero decode (src/net/online.ts) is correct ONLY while it
    // stays off the maybe() delta gate: a delta-gated key is omitted when
    // UNCHANGED, which the decoder would read as "parked mana returned to
    // zero" every tick the value held. Pinned three ways: not in the registry,
    // written before the base stringify in the emitter, and never emitted
    // through any of the three delta writers anywhere under server/.
    expect(ALL_DELTA_KEYS as readonly string[]).not.toContain('sm');
    const gameSource = stripComments(
      readFileSync(resolve(process.cwd(), 'server/game.ts'), 'utf8'),
    );
    const assignAt = gameSource.indexOf('self.sm = wireParkedMana(');
    const baseStringifyAt = gameSource.indexOf('const json = JSON.stringify(self);');
    expect(assignAt).toBeGreaterThan(-1);
    expect(baseStringifyAt).toBeGreaterThan(assignAt);
    const serverSources = tsFilesUnder(resolve(process.cwd(), 'server'));
    for (const { full } of serverSources) {
      const raw = stripComments(readFileSync(full, 'utf8'));
      expect(raw, `${full} delta-gates sm`).not.toMatch(
        /\b(?:maybe|maybeSerialized|maybeRaw)\(\s*'sm'/,
      );
    }
  });

  it('sm is OMITTED at rest and present only while mana is parked (the behavior, not the placement)', () => {
    // The pin above reads source text: it proves sm is written onto the base
    // self object rather than through a delta writer, but a regression that
    // emitted sm unconditionally (0 at rest) would pass it while spending a key
    // on every self snapshot for every player of every class. This arm drives
    // the real emitter instead.
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Barkskin', 'druid');
    const player = (server as any).sim.entities.get(session.pid);

    // At rest: a caster on mana with nothing parked. Both halves of the guard
    // are unmet, so the key must not be on the wire at all.
    player.resourceType = 'mana';
    player.savedMana = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self).not.toHaveProperty('sm');

    // Shifted (the live bar runs on rage) but nothing parked yet: still absent,
    // so the second half of the guard is load-bearing on its own.
    player.resourceType = 'rage';
    player.savedMana = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self).not.toHaveProperty('sm');

    // Shifted with a real parked pool: present, floored by wireParkedMana.
    player.savedMana = 240.7;
    broadcast(server);
    expect(lastSnap(fc.sent).self.sm).toBe(240);

    // Back on mana with the pool restored to the live bar: absent again, so a
    // session that once carried sm does not keep a stale copy of it.
    player.resourceType = 'mana';
    player.savedMana = 0;
    broadcast(server);
    expect(lastSnap(fc.sent).self).not.toHaveProperty('sm');
  });

  it('ALL_DELTA_KEYS equals the maybe(...) keys scraped from every server emitter (multi-line lockouts incl.)', () => {
    // Scan the whole recursive server tree: game.ts is the original emitter,
    // while Bank Storage moved the bank family into bank_wire.ts and the
    // Materials Vault family into vault_wire.ts, and farming's fplot row moved
    // whole to server/farming_commands.ts at the v0.38.0 sync monolith heal
    // (appendFarmPlotsWire). New wire surface belongs in siblings too,
    // including nested ones, and must join this registry without relying on a
    // hand-maintained emitter-file inventory.
    const serverSources = tsFilesUnder(resolve(process.cwd(), 'server'));
    expect(
      serverSources.length,
      'the delta-emitter scrape reads the whole server tree, not one level',
    ).toBeGreaterThanOrEqual(300);
    expect(serverSources.map(({ file }) => file)).toContain('vault_wire.ts');
    expect(serverSources.map(({ file }) => file)).toContain('farming_commands.ts');
    // Strip comments per file before scraping so a commented-out call cannot keep
    // its key in the scraped set. stripComments is the shared single-pass form
    // (tests/helpers/strip_comments.ts): the two-pass replace this used to run read
    // a bare `/*` inside a line comment as a block opener and could swallow real
    // calls down to the next block closer. Its lookbehind keeps protocol `://`.
    const src = serverSources
      .map(({ full }) => stripComments(readFileSync(full, 'utf8')))
      .join('\n');
    // tolerate whitespace/newline between `(` and the quote so the multi-line
    // maybe('lockouts', ...) call (game.ts ~2166-2169) is captured, not undercounted;
    // the optional `(?:Raw|Serialized)?` also captures the maybeRaw realm-wide
    // calls ('vcupb' and the multi-line 'dfb') AND the direct
    // maybeSerialized(...) emits: `maybe` and `maybeRaw` are both thin wrappers
    // over maybeSerialized, so a key emitted ONLY through the direct form (the
    // capability-gated 'de' and 'auras') is exactly as real on the wire, and
    // before this arm the "exact" registry was structurally blind to it.
    // `emit(...)` is the same call under the name the extracted emitter gives
    // the delta-eliding closure its caller hands it; without this arm the two
    // relocated bank keys stay invisible even with the file in the list.
    // The lookbehind keeps `emit` to that BARE parameter form: `\b` would also
    // match a member call (`this.emit('spikeReport', ...)`, `bus.emit(...)`),
    // whose key is not a delta key at all, and the obvious repair for the red
    // that would cause is to add it to ALL_DELTA_KEYS, permanently weakening the
    // registry this pin exists to police.
    const DELTA_CALL = /(?<![.\w$])(?:maybe(?:Raw|Serialized)?|emit)\(\s*['"](\w+)['"]/g;
    const re = new RegExp(DELTA_CALL.source, 'g');
    const scraped = new Set<string>();
    for (let m = re.exec(src); m !== null; m = re.exec(src)) scraped.add(m[1]);
    expect(scraped.has('lockouts')).toBe(true); // the multi-line call IS captured
    expect(scraped.has('app')).toBe(true); // the maybeRaw calls ARE captured by the widened regex
    expect(scraped.has('dfb')).toBe(true); // incl. the multi-line maybeRaw('dfb', ...) form
    // The two direct-maybeSerialized-only keys, BY NAME: each is emitted through
    // no other form (de behind the dungeon entry facing capability, auras behind
    // the stable timer wire), so only the Serialized arm of the scrape sees them
    // and dropping that arm must redden here, not silently shrink the registry.
    expect(scraped.has('de')).toBe(true);
    expect(scraped.has('auras')).toBe(true);
    expect(scraped.has('reliq')).toBe(true); // Reliquary Phase 3 sparse self blob
    // Both relocated bank keys, BY NAME: the extraction that moved them out of
    // game.ts left this scrape one short and only the count said so.
    expect(scraped.has('bank')).toBe(true);
    expect(scraped.has('bpsl')).toBe(true);
    expect(scraped.has('vault')).toBe(true);
    expect(scraped.has('cvault')).toBe(true);
    // ...and the narrowing really narrows. A member `emit` is not a delta call,
    // and asserting it on a synthetic source keeps the claim honest even while
    // neither emitter file happens to contain one.
    // THROUGH the same pattern the scrape above uses, not a copy of it: a second
    // literal here would keep passing while the real one was widened back.
    const memberEmit = new Set<string>();
    const narrowed = new RegExp(DELTA_CALL.source, 'g');
    // The bare maybeSerialized call rides along in the same sample: the direct
    // form IS captured while a member spelling of it stays out, through the one
    // shared lookbehind.
    const sample =
      "this.emit('spikeReport', x); bus.emit('tick', y); emit('bpsl', z); " +
      "maybeSerialized('de', s); cache.maybeSerialized('memberKey', s);";
    for (let m = narrowed.exec(sample); m !== null; m = narrowed.exec(sample)) {
      memberEmit.add(m[1]);
    }
    expect([...memberEmit]).toEqual(['bpsl', 'de']);
    // The base-merge union: v0.31's 56 (incl. the market-collect key mktU) plus
    // the Rift + mounts and worn-instance keys (einst, mntRtd and the rift
    // snapshot fragments) for 61, then v0.32's master-loot key mloot for 62,
    // plus the packet's slotted-tool-effects key tslot for 63, the
    // battleground's bg self key for 64, guildBank (Guild Bank Phase 2)
    // for 65, this branch's commission order board key corder
    // (issue #1298) for 66, and the character sheet's lifetime played-time
    // key ptime for 67, then the 16 static combat-rating/progression scalars
    // (ap/sp/sh/crit/dodge/blk/bval/crat/hrat/hirat/xp/lxp/rxp/prk/copper/ddiff)
    // for 83, then reliq (Reliquary Phase 3 sparse blob) for 84, the nameplate
    // border echo aborder for 85, and the authored modular look `app` for 86.
    // The Vale Cup retirement then removes sport/vcup/vcupb, for 83, and the
    // healPower seam adds the derived Healing Power scalar hpw for 84. Bank
    // Storage Phase 2 then adds bpsl, vault, and cvault, for 87. The
    // maybeSerialized arm of the scrape then surfaces the two capability-gated
    // direct emits, auras and de, for 89. Farming's own-plot key fplot (the
    // Masterwrought branch) then makes 90, and the release's off-hand bar key
    // offhandWeapon makes 91 on the merged tree. Intentional Gathering PR3's
    // hpref (emitted from the new gathering_self_wire.ts sibling, still
    // inside the recursive server-tree scrape) makes 92. Intentional
    // Gathering PR4's ggoal (emitted from the new gathering_goal_wire.ts
    // sibling, likewise inside the recursive scrape) makes 93.
    // The candidate self in-combat key cbt brings the combined inventory to 94;
    // the account ledger's acct key (server/deeds_wire.ts) makes it 95.
    // The World Quests branch adds its five self keys, for 100.
    // Plus the faction standing and daily reroll owner keys, for 103. The
    // weekly emissary's wkq and wkexp self keys make 105, and the Clue Scrolls
    // active-hunt key cluh 106.
    // The Weekly Vault's weeklyRewards self key (PR 4052) makes 107.
    // The World PvP readout wpvp and the King of the Hill readout hill make 109.
    // The release batch's pending Town Focus and Spell Crit core keys make 111.
    expect(scraped.size).toBe(113);
    expect([...scraped].sort()).toEqual([...ALL_DELTA_KEYS].sort());
  });

  it('scans server emitters only through the shared recursive TypeScript walker', () => {
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['ts_files_under']);
  });

  it('mntOwn is encoded INSIDE the heavy self gate (its inputs sit behind it)', () => {
    // The owned-mounts walk (full inventory AND bank scan with an ITEMS
    // lookup per slot, per viewer per pass) rode outside the gate at the
    // v0.32.0 merge; a straight revert to the ungated position stays green
    // on every wire-observing sweep (an unchanged value elides either way),
    // so the placement itself is pinned two ways: the source order here, and
    // the call-elision spy below, which observes the WORK the gate exists to
    // skip rather than the bytes it cannot change.
    const raw = stripComments(readFileSync(resolve(process.cwd(), 'server/game.ts'), 'utf8'));
    const gateAt = raw.indexOf('if (heavyDue) {');
    const mntOwnAt = raw.indexOf("maybe('mntOwn'");
    const siblingAt = raw.indexOf('emitQuestSelfKeys(maybe');
    expect(gateAt).toBeGreaterThan(-1);
    expect(mntOwnAt).toBeGreaterThan(gateAt);
    expect(mntOwnAt).toBeLessThan(siblingAt);
  });

  it('a non-heavy pass never runs the owned-mounts walk; a heavy-dirty one does', () => {
    // The behavioral half of the placement pin above: the gate's whole point
    // is skipping the walk, so spy on the CALL. A quiet pass (not dirty,
    // same wireRev, off the staggered refresh slot) must not invoke
    // ownedMountsFor; flipping selfHeavyDirty must.
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 61, 'Rider');
    broadcast(server); // the join's own heavy pass, so the gate state settles
    const meta = server.sim.meta(session.pid);
    if (!meta) throw new Error('missing meta');
    session.selfHeavyDirty = false;
    session.lastWireRev = meta.wireRev;
    // Step off the staggered refresh slot so heavyDue is false for certain.
    while ((server.sim.tickCount + session.pid) % 40 === 0) server.sim.tick();
    const walk = vi.spyOn(server.sim, 'ownedMountsFor');
    broadcast(server);
    expect(walk).not.toHaveBeenCalled();
    session.selfHeavyDirty = true;
    broadcast(server);
    expect(walk).toHaveBeenCalledWith(session.pid);
    walk.mockRestore();
  });

  it('TERSE_TO_IWORLD pins the terse-key to IWorld-name renames in sorted membership', () => {
    // the non-obvious renames the brief calls out as where drift hides
    const required: Record<string, string> = {
      res: 'resource',
      mres: 'maxResource',
      rtype: 'resourceType',
      lxp: 'lifetimeXp',
      lhonor: 'lifetimeHonor',
      rxp: 'restedXp',
      prk: 'prestigeRank',
      drun: 'delveRun',
      dcompanion: 'companionState',
      dmarks: 'delveMarks',
      dcomp: 'companionUpgrades',
      dclears: 'delveClears',
      atitle: 'activeTitle',
      aborder: 'activeBorder',
      deeds: 'deedsEarned',
      dstats: 'deedStats',
      mntLesson: 'mountLessonActive',
      mntRace: 'mountRaceView',
      mntRtd: 'ridingTrained',
      // Two loot-roll surfaces whose terse keys look interchangeable: mloot is the
      // master-looter curate prompt, lroll the need/greed one, and swapping either
      // right-hand side would pass every other check in this test.
      lroll: 'lootRollPrompts',
      mloot: 'masterLootPrompts',
      // The farming own-plot delta: the wire key and the IWorld name share no
      // stem, so a typo on either side would decode onto nothing at all.
      fplot: 'myFarmPlots',
    };
    for (const [terse, iworld] of Object.entries(required)) {
      expect(TERSE_TO_IWORLD[terse], `rename ${terse} -> ${iworld} drifted`).toBe(iworld);
    }
    // renown keeps the same name on both sides, so it must NEVER grow a rename
    // entry (one would imply a wire key the decoder does not read)
    expect('renown' in TERSE_TO_IWORLD).toBe(false);
    // reliq fans out to three IWorld members (firstFind / marks / recent), so it
    // is asserted directly and must never grow a single-target rename entry.
    expect('reliq' in TERSE_TO_IWORLD).toBe(false);
    // sorted-membership pin: adding or renaming an entry must be a deliberate,
    // reviewable change landing in alphabetical order
    expect(Object.keys(TERSE_TO_IWORLD)).toEqual([...Object.keys(TERSE_TO_IWORLD)].sort());
    // every entry is either a delta key or one of the always-present self scalars.
    // blk/bval/lxp/rxp/prk moved into ALL_DELTA_KEYS alongside the rest of the
    // static combat-rating/progression cohort, so only res/mres/rtype are left
    // always-present here.
    const SELF_SCALARS = new Set(['res', 'mres', 'rtype']);
    for (const terse of Object.keys(TERSE_TO_IWORLD)) {
      expect(
        (ALL_DELTA_KEYS as readonly string[]).includes(terse) || SELF_SCALARS.has(terse),
        `${terse} is neither a delta key nor a known self scalar`,
      ).toBe(true);
    }
  });
});
