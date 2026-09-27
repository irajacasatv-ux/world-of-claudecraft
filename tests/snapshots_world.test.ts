// World, activity and command wire: farm plots, delve and lockpick state, mount
// commands and race events, world-boss liveness, gather node cooldowns, the
// dungeon-finder board memo, entity-anchored world events, interaction command
// outcomes, the Warlock pet-special wire and mount skin identity. Split out of
// tests/snapshots.test.ts on 2026-09-27.

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { COSMETIC_OP_BURST } from '../server/cosmetic_op_guard';
import { type ClientSession, GameServer } from '../server/game';
import { ClientWorld } from '../src/net/online';
import { FARM_PATCHES } from '../src/sim/content/farm_patches';
import { RETIRED_MOUNT_SKIN_IDS } from '../src/sim/content/mount_skins';
import { MOUNT_RACE_START_PLATFORM, type MountKey } from '../src/sim/content/mounts';
import { DELVES, GATHER_NODES, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { MOUNT_RACE_COUNTDOWN_TICKS } from '../src/sim/mount_race';
import { petOf, serializePet, summonPet } from '../src/sim/pet/pet_commands';
import { Sim } from '../src/sim/sim';
import { terrainHeight } from '../src/sim/world';
import { WORLD_BOSSES, worldBossLockoutId } from '../src/sim/world_boss';
import {
  bareClient,
  broadcast,
  type FakeClient,
  fakeWs,
  joinServer,
  lastSnap,
} from './helpers/bare_client';
import { FAR_FUTURE_MS, type SnapshotApplier } from './helpers/snapshot_wire';

function feedEventFrame(client: ClientWorld, frame: unknown): void {
  (client as any).onMessage(JSON.stringify(frame));
}

// The farming own-plot delta. A plot's survival outcome and yield are pre-rolled
// at plant time and stored in hidden PlotState slots; shipping either would let a
// client know a crop's fate before its timer runs out, so the projection
// (src/sim/professions/farm_projection.ts) picks its fields explicitly. This is
// the gate over the REAL wire: a GameServer broadcast, JSON-encoded and parsed
// back, so an accidental spread reddens here rather than in a unit test of the
// projection alone.
describe('farm plot wire (fplot)', () => {
  it('never carries the hidden pre-rolled outcome slots to a client', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Rowan');
    const meta = server.sim.meta(session.pid)!;
    meta.farmPlots.set('bed_eastbrook_1', {
      cropId: 'vale_wheat',
      plantedAtMs: 1_700_000_000_000,
      readyAtMs: FAR_FUTURE_MS,
      survivalRoll: 0.42,
      yieldSeed: 987654,
      compost: true,
      watch: false,
      tonic: true,
      notified: false,
    });
    broadcast(server);
    const snap = lastSnap(fc.sent);
    // The wire key is pinned as a literal: renaming it silently would strip the
    // plots from every online client while every projection test stayed green.
    const rows = snap.self.fplot as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    const row = rows[0];
    // Positive first: the public fields carry what was planted, so the absence
    // assertions below cannot pass on an empty or defaulted payload.
    expect(row.bedId).toBe('bed_eastbrook_1');
    expect(row.cropId).toBe('vale_wheat');
    expect(row.plantedAtMs).toBe(1_700_000_000_000);
    expect(row.readyAtMs).toBe(FAR_FUTURE_MS);
    expect(row.compost).toBe(true);
    expect(row.watch).toBe(false);
    expect(row.tonic).toBe(true);
    expect(row.notified).toBe(false);
    expect(row.status).toBe('growing');
    // The leak pin, both ways: named absence for a reader, then the exhaustive
    // key set so a NEW hidden PlotState field cannot ride along unnoticed.
    expect(row.survivalRoll).toBeUndefined();
    expect(row.yieldSeed).toBeUndefined();
    expect(Object.keys(row).sort()).toEqual([
      'bedId',
      'compost',
      'cropId',
      'notified',
      'plantedAtMs',
      'readyAtMs',
      'status',
      'tonic',
      'watch',
    ]);
  });

  it('rides the wire as [] for a player with no planted bed', () => {
    const server = new GameServer();
    const fc = fakeWs();
    joinServer(server, fc, 1, 'Bramble');
    broadcast(server);
    expect(lastSnap(fc.sent).self.fplot).toEqual([]);
  });

  it('a real ClientWorld serves the frozen patch table by reference from construction', () => {
    // The static-content arm of IWorldFarming: farmPatches never rides the
    // wire, so only a REAL construction (not the bareClient fixture, which
    // stamps its own copy of the default) can pin src/net/online.ts against
    // an accidental [] or defensive copy. DOM/network-free construction via
    // the withDomStubs idiom (target_echo_client.test.ts /
    // account_flair_client.test.ts).
    class StubWebSocket {
      static readonly OPEN = 1;
      onopen: (() => void) | null = null;
      readyState = StubWebSocket.OPEN;
      constructor(public readonly url: string) {}
      send(): void {}
      close(): void {}
    }
    const g = globalThis as Record<string, unknown>;
    const prevWebSocket = g.WebSocket;
    const prevWindow = g.window;
    g.WebSocket = StubWebSocket as unknown;
    g.window = { setInterval: () => 0, clearInterval: () => undefined };
    try {
      const w = new ClientWorld('farm-statics-probe', 1, 'warrior', 'http://localhost');
      expect(w.farmPatches).toBe(FARM_PATCHES);
      expect(w.myFarmPlots).toEqual([]);
    } finally {
      g.WebSocket = prevWebSocket;
      g.window = prevWindow;
    }
  });
});

describe('delve self-state mirrors over the wire', () => {
  let server: GameServer;
  let fc: FakeClient;
  let session: ClientSession;

  beforeEach(() => {
    server = new GameServer();
    fc = fakeWs();
    session = joinServer(server, fc, 1, 'Delver');
  });

  function enterDelveOnServer(): void {
    const sim = server.sim;
    sim.setPlayerLevel(DELVES.collapsed_reliquary.minLevel);
    const door = DELVES.collapsed_reliquary.doorPos;
    const p = sim.entities.get(session.pid)!;
    p.pos.x = door.x;
    p.pos.z = door.z;
    p.pos.y = terrainHeight(door.x, door.z, sim.cfg.seed);
    p.prevPos = { ...p.pos };
    sim.enterDelve('collapsed_reliquary', 'normal', session.pid);
  }

  it('geo-gates companion_upgrade and enter_delve to the board NPC door', () => {
    const sim = server.sim;
    sim.setPlayerLevel(DELVES.collapsed_reliquary.minLevel);
    const meta = sim.meta(session.pid)!;
    meta.companionUpgrades.companion_tessa = 1;
    meta.delveMarks = 100;
    const p = sim.entities.get(session.pid)!;
    const door = DELVES.collapsed_reliquary.doorPos;
    const place = (x: number, z: number) => {
      p.pos.x = x;
      p.pos.z = z;
      p.pos.y = terrainHeight(x, z, sim.cfg.seed);
      p.prevPos = { ...p.pos };
    };
    // Far from Brother Halven: the upgrade command is rejected (rank unchanged)...
    place(door.x + 200, door.z);
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'companion_upgrade',
        companionId: 'companion_tessa',
      }),
    );
    expect(meta.companionUpgrades.companion_tessa).toBe(1);
    // ...and enter_delve does not claim a run from across the world.
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'enter_delve',
        delveId: 'collapsed_reliquary',
        tierId: 'normal',
      }),
    );
    expect(sim.delveRunForPlayer(session.pid)).toBeNull();
    // Standing on the board door: the upgrade goes through.
    place(door.x, door.z);
    server.handleMessage(
      session,
      JSON.stringify({
        t: 'cmd',
        cmd: 'companion_upgrade',
        companionId: 'companion_tessa',
      }),
    );
    expect(meta.companionUpgrades.companion_tessa).toBe(2);
  });

  it('sends drun + dcompanion on entering a delve and the client mirrors them', () => {
    enterDelveOnServer();
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self).toHaveProperty('drun');
    expect(snap.self).toHaveProperty('dcompanion');
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.delveRun).not.toBeNull();
    expect(client.companionState?.companionId).toBe('companion_tessa');
  });

  it('mirrors delveMarks + delveClears + delveDaily to the client when they change', () => {
    enterDelveOnServer();
    broadcast(server);
    fc.sent.length = 0;
    server.sim.meta(session.pid)!.delveMarks = 5;
    const meta = server.sim.meta(session.pid)!;
    meta.delveClears['collapsed_reliquary:heroic'] = 1;
    meta.delveDaily.markClears = 2;
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.dmarks).toBe(5);
    expect(snap.self.dclears['collapsed_reliquary:heroic']).toBe(1);
    expect(snap.self.delveDaily.markClears).toBe(2);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.delveMarks).toBe(5);
    expect(client.delveClears['collapsed_reliquary:heroic']).toBe(1);
    // the shop view resolves the heroic-gated rare as unlocked off the mirror
    expect(
      client.delveShopOffers('collapsed_reliquary').find((o: any) => o.requiresHeroicClear)
        ?.unlocked,
    ).toBe(true);
    expect(client.delveDaily.markClears).toBe(2);
  });

  it('does NOT resend drun on an unchanged delve-less first/second tick', () => {
    // Outside a delve, drun is null and must be omitted after the first send.
    broadcast(server);
    fc.sent.length = 0;
    server.sim.tick();
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self).not.toHaveProperty('drun');
  });

  it('clears drun + dcompanion (value to null) on leaving a delve and the client mirror follows', () => {
    enterDelveOnServer();
    broadcast(server);
    const client = bareClient(session.pid);
    (client as any).applySnapshot(lastSnap(fc.sent));
    expect(client.delveRun).not.toBeNull();
    fc.sent.length = 0;
    server.sim.leaveDelve(session.pid);
    broadcast(server);
    const snap = lastSnap(fc.sent);
    expect(snap.self.drun).toBeNull();
    expect(snap.self.dcompanion).toBeNull();
    (client as any).applySnapshot(snap);
    expect(client.delveRun).toBeNull();
    expect(client.companionState).toBeNull();
  });
});

describe('lockpick view rebuilds from events on the online client', () => {
  function sessionEvent(sid: string, col: number, visible: any[]) {
    return {
      type: 'lockpickSession',
      sessionId: sid,
      objectId: 77,
      w: 11,
      h: 6,
      col,
      row: 2,
      page: 1,
      pageCount: 1,
      tries: 1,
      triesTotal: 1,
      lootTier: 'premium',
      allowed: ['hardSet', 'set', 'steady', 'ease', 'drop'],
      visible,
      stepTimeoutMs: 20000,
    };
  }
  function feed(client: ClientWorld, ev: any) {
    (client as any).onMessage(JSON.stringify({ t: 'events', list: [ev] }));
  }

  it('builds on session, advances on step, ignores foreign sessions, clears on end', () => {
    const client = bareClient(1);
    (client as any).lockpickState = null;
    const v0 = [{ col: 0, row: 2, kind: 'channel' }];
    feed(client, sessionEvent('s1', 0, v0));
    expect(client.lockpickState).not.toBeNull();
    expect(client.lockpickState?.sessionId).toBe('s1');
    expect(client.lockpickState?.lootTier).toBe('premium');
    expect(client.lockpickState?.visible).toEqual(v0);

    // Step advances col + visible, leaves identity fields (w/h/lootTier) intact.
    const v1 = [{ col: 1, row: 3, kind: 'channel' }];
    feed(client, {
      type: 'lockpickStep',
      sessionId: 's1',
      col: 1,
      row: 3,
      page: 1,
      pageCount: 1,
      tries: 1,
      triesTotal: 1,
      result: 'advanced',
      visible: v1,
    });
    expect(client.lockpickState?.col).toBe(1);
    expect(client.lockpickState?.visible).toEqual(v1);
    expect(client.lockpickState?.w).toBe(11);
    expect(client.lockpickState?.lootTier).toBe('premium');

    // A step for a different session must not mutate the active view.
    feed(client, {
      type: 'lockpickStep',
      sessionId: 'OTHER',
      col: 9,
      row: 9,
      page: 1,
      pageCount: 1,
      tries: 1,
      triesTotal: 1,
      result: 'advanced',
      visible: [],
    });
    expect(client.lockpickState?.col).toBe(1);

    // End for the active session clears it; events still reach the HUD queue.
    feed(client, {
      type: 'lockpickEnd',
      sessionId: 's1',
      outcome: 'success',
      lootTier: 'premium',
    });
    expect(client.lockpickState).toBeNull();
    expect(client.drainEvents().length).toBeGreaterThan(0);
  });

  it('does not clear the view on a foreign lockpickEnd', () => {
    const client = bareClient(1);
    (client as any).lockpickState = null;
    feed(client, sessionEvent('s2', 0, []));
    feed(client, { type: 'lockpickEnd', sessionId: 'OTHER', outcome: 'fail' });
    expect(client.lockpickState).not.toBeNull();
    expect(client.lockpickState?.sessionId).toBe('s2');
  });
});

describe('online mount command and race-event transport', () => {
  it('round-trips client frames through actor-scoped server dispatch and mirrors the race lifecycle', () => {
    const server = new GameServer();
    const actorWire = fakeWs();
    const actor = joinServer(server, actorWire, 1, 'Rider');
    const otherWire = fakeWs();
    const other = joinServer(server, otherWire, 2, 'Bystander');
    const sim = server.sim;
    const actorMeta = sim.players.get(actor.pid)!;
    const otherMeta = sim.players.get(other.pid)!;
    const actorEntity = sim.entities.get(actor.pid)!;
    const otherEntity = sim.entities.get(other.pid)!;
    sim.setPlayerLevel(20, actor.pid);
    sim.setPlayerLevel(20, other.pid);
    sim.addItem('reins_grag_bear', 1, actor.pid);
    // Riding is a purchased skill now; the transport fixture buys past the gate.
    actorMeta.ridingTrained = true;
    otherMeta.ridingTrained = true;

    // Drive the real ClientWorld command adapter. Every remaining mount command
    // is payload-free now that mount_select is gone, so the fragile part is the
    // command TOKEN arriving unchanged at the server dispatch.
    const outbox: string[] = [];
    const commandClient = bareClient(actor.pid);
    (commandClient as any).connected = true;
    (commandClient as any).ws = {
      readyState: 1,
      send: (payload: string) => outbox.push(payload),
    };
    (commandClient as any).entities.set(actor.pid, { level: 20 });
    const owned: MountKey[] = ['grag_bear'];
    (commandClient as any).selfOwnedMounts = owned;
    commandClient.toggleMounted();
    commandClient.mountRaceStart();
    commandClient.mountRaceCancel();
    expect(outbox.map((payload) => JSON.parse(payload))).toEqual([
      { t: 'cmd', cmd: 'mount_toggle' },
      { t: 'cmd', cmd: 'mount_race_start' },
      { t: 'cmd', cmd: 'mount_race_cancel' },
    ]);

    // The toggle no longer summons: reins are items, so an unmounted toggle is a
    // no-op and neither player starts a summon channel from it.
    server.handleMessage(actor, outbox[0]);
    expect(actorEntity.mountCastKey).toBe('');
    expect(otherEntity.mountCastKey).toBe('');

    // Put the actor at the course already mounted, then start through the
    // client-built frame. The bystander must never gain a session or receive
    // the actor's personal race events.
    actorEntity.mountCastRemaining = 0;
    actorEntity.mountCastKey = '';
    actorEntity.mountKey = 'grag_bear';
    actorEntity.inCombat = false;
    actorEntity.onGround = true;
    actorEntity.pos.x = MOUNT_RACE_START_PLATFORM.x;
    actorEntity.pos.z = MOUNT_RACE_START_PLATFORM.z;
    actorEntity.pos.y = terrainHeight(actorEntity.pos.x, actorEntity.pos.z, sim.cfg.seed);
    actorEntity.prevPos = { ...actorEntity.pos };
    // outbox[1] is mount_race_start (mount_select no longer occupies index 0).
    server.handleMessage(actor, outbox[1]);
    expect(actorMeta.mountRace?.phase).toBe('countdown');
    expect(otherMeta.mountRace ?? null).toBeNull();

    const mirror = bareClient(actor.pid);
    const routeTick = (): void => {
      const events = sim.tick();
      (server as any).routeEvents(events);
    };
    const feedNewActorFrames = (): void => {
      for (const frame of actorWire.sent.splice(0)) {
        if (
          frame.t === 'events' &&
          frame.list.some((event: { type?: string }) => event.type?.startsWith('mountRace'))
        ) {
          feedEventFrame(mirror, frame);
        }
      }
    };

    routeTick();
    feedNewActorFrames();
    expect(mirror.mountRaceView()).toMatchObject({
      phase: 'countdown',
      cleared: 0,
    });

    for (let i = 1; i < MOUNT_RACE_COUNTDOWN_TICKS; i++) routeTick();
    feedNewActorFrames();
    expect(actorMeta.mountRace?.phase).toBe('racing');
    expect(mirror.mountRaceView()).toMatchObject({
      phase: 'racing',
      cleared: 0,
    });

    server.handleMessage(actor, outbox[2]); // mount_race_cancel
    routeTick();
    feedNewActorFrames();
    expect(actorMeta.mountRace ?? null).toBeNull();
    expect(mirror.mountRaceView()).toBeNull();
    expect(otherMeta.mountRace ?? null).toBeNull();
    expect(
      otherWire.sent.some(
        (frame) =>
          frame.t === 'events' &&
          frame.list.some((event: { type?: string }) => event.type?.startsWith('mountRace')),
      ),
    ).toBe(false);
  });
});

describe('world-boss realm liveness snapshot', () => {
  it('mirrors spawn and death independently of personal loot eligibility', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 81, 'Bosswatch');
    const client = bareClient(session.pid);
    const bossId = WORLD_BOSSES[0].templateId;
    const meta = server.sim.meta(session.pid);
    if (!meta) throw new Error('missing world-boss viewer meta');
    meta.raidLockouts.set(worldBossLockoutId(bossId), Date.now() + 60_000);

    broadcast(server);
    let snap = lastSnap(fc.sent);
    expect(snap.self.wba).toEqual([]);
    (client as any).applySnapshot(snap);
    expect(client.worldBossActive(bossId)).toBe(false);

    (server.sim as any).worldBossNextAt[0] = server.sim.time;
    server.sim.tick();
    fc.sent.length = 0;
    broadcast(server);
    snap = lastSnap(fc.sent);
    expect(snap.self.wba).toEqual([bossId]);
    (client as any).applySnapshot(snap);
    expect(client.worldBossActive(bossId)).toBe(true);
    expect(client.raidLockouts().map((lockout) => lockout.id)).toContain(
      worldBossLockoutId(bossId),
    );

    const boss = [...server.sim.entities.values()].find((entity) => entity.templateId === bossId);
    if (!boss) throw new Error('missing spawned world boss');
    boss.dead = true;
    fc.sent.length = 0;
    broadcast(server);
    snap = lastSnap(fc.sent);
    expect(snap.self.wba).toEqual([]);
    (client as any).applySnapshot(snap);
    expect(client.worldBossActive(bossId)).toBe(false);
  });
});

describe('gather node cooldown wire round trip (ncd)', () => {
  it('flips a node from not-ready back to ready once the server-side cooldown clears', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Gatherer');
    const sim = (server as any).sim;
    const meta = sim.players.get(session.pid);
    const nodeId = GATHER_NODES[0].id;
    meta.nodeHarvestReadyAt[nodeId] = sim.time + 30;

    broadcast(server);
    const notReadySnap = lastSnap(fc.sent);
    expect(notReadySnap.self.ncd).toMatchObject({
      [nodeId]: expect.any(Number),
    });

    const client = bareClient(session.pid);
    (client as any).applySnapshot(notReadySnap);
    expect(client.nodeHarvestableByMe(nodeId)).toBe(false);

    // Server-side cooldown clears (readyAt passes): the next broadcast omits the
    // node from `ncd` entirely (server/game.ts's until > sim.time filter), and
    // applying THAT snapshot, not a hand-reassigned map, must flip the client
    // back to ready -- the exact transition a permanent-lockout regression would
    // fail to make.
    meta.nodeHarvestReadyAt[nodeId] = sim.time - 1;
    broadcast(server);
    const readySnap = lastSnap(fc.sent);
    expect(readySnap.self.ncd).toEqual({});

    (client as any).applySnapshot(readySnap);
    expect(client.nodeHarvestableByMe(nodeId)).toBe(true);
  });
});

// The realm-wide dungeon-finder board (`dfb`) is viewer-independent
// (dungeonFinderBoardView takes no pid), so selfWireJson ships it via `maybeRaw`
// plus a realm-readout memo: the board is built and JSON.stringify'd at most once
// per tick and reused by every session whose per-session lastDfWireTick gate opens
// on that tick. These pins prove the memo collapses the same-tick work WITHOUT
// changing a single wire byte or any session's cadence: the shipped string equals
// what plain `maybe()` produced before, an unchanged board still delta-elides,
// and a changed board still reaches every session within its own gate interval.
describe('dfb realm-readout memo (shared board bytes, per-session cadence)', () => {
  const DF_WIRE_INTERVAL_TICKS = 10; // DF_WIRE_HZ = 2 at DT = 1/20

  function boardServer(): {
    server: GameServer;
    fcA: FakeClient;
    fcB: FakeClient;
    sa: ClientSession;
    sb: ClientSession;
  } {
    const server = new GameServer();
    const fcA = fakeWs();
    const fcB = fakeWs();
    const sa = joinServer(server, fcA, 61, 'BoardOne');
    const sb = joinServer(server, fcB, 62, 'BoardTwo');
    // A real premade listing so the shared board is non-empty and its bytes are
    // meaningful (hollow_crypt_normal accepts a solo level-8 leader).
    server.sim.setPlayerLevel(8, sa.pid);
    server.sim.dungeonFinderListingCreate('hollow_crypt_normal', ['first_run'], sa.pid);
    return { server, fcA, fcB, sa, sb };
  }

  it('builds and stringifies the shared board once for two sessions gating on the same tick', () => {
    const { server, fcA, fcB } = boardServer();
    const memo = (server as any).dfBoardReadout;
    expect(memo.objectBuilds).toBe(0);
    expect(memo.stringifies).toBe(0);
    // Both sessions join with lastDfWireTick a full interval back, so the first
    // broadcast pass is due for both at the same sim tick: one build, one
    // stringify, shared. A per-session build/stringify would count 2 here.
    broadcast(server);
    expect(memo.objectBuilds).toBe(1);
    expect(memo.stringifies).toBe(1);
    const a = lastSnap(fcA.sent).self.dfb;
    const b = lastSnap(fcB.sent).self.dfb;
    expect(a).toHaveLength(1); // the listing is on the board both viewers received
    expect(JSON.stringify(a)).toBe(JSON.stringify(b)); // identical shared payload
    expect(JSON.stringify(a)).toBe(memo.json); // and it is exactly the memoized string
  });

  it('ships byte-for-byte what plain maybe() shipped: the memo string equals a direct stringify', () => {
    // A raw-capturing socket so the wire assertion reads the UNPARSED payload: a
    // JSON.parse/re-stringify round trip could mask a non-canonical formatting
    // difference in the raw bytes; the substring check below cannot.
    const raw: string[] = [];
    const server = new GameServer();
    const fcRaw = {
      sent: [] as any[],
      ws: { readyState: 1, send: (p: string) => raw.push(p) },
    };
    const sa = joinServer(server, fcRaw as any, 61, 'BoardOne');
    server.sim.setPlayerLevel(8, sa.pid);
    server.sim.dungeonFinderListingCreate('hollow_crypt_normal', ['first_run'], sa.pid);
    broadcast(server);
    const memo = (server as any).dfBoardReadout;
    // Same tick, so the finder's own boardRev/tickBucket cache is untouched: the
    // memoized string must equal the JSON.stringify(value ?? null) plain maybe()
    // would have produced. The view returns a bare array, never null/undefined
    // (buildBoard always returns a listing array), so `?? null` is inert and the
    // direct stringify IS the plain-maybe oracle.
    expect(memo.json).toBe(JSON.stringify(server.sim.dungeonFinderBoardView()));
    expect(JSON.parse(memo.json)).toHaveLength(1); // real payload, not an empty fixture
    // The raw snap frame embeds the memoized string verbatim (maybeRaw splices
    // `,"dfb":<serialized>` into the self JSON with no re-stringify).
    expect(raw.some((p) => p.includes('"t":"snap"') && p.includes(`"dfb":${memo.json}`))).toBe(
      true,
    );
  });

  it('keeps delta-elision on an unchanged board and still ships a changed board to every session', () => {
    const { server, fcA, fcB, sb } = boardServer();
    broadcast(server); // both sessions receive the initial one-listing board
    const idleA = fcA.sent.length;
    const idleB = fcB.sent.length;
    // Two full DF wire intervals with no board change: each session's gate opens
    // (due), the memo re-keys on the new ticks, but the serialized bytes are
    // unchanged, so maybeRaw elides the key for every session in the window.
    // The window deliberately crosses tick 20, where the finder's tickBucket
    // cache rebuilds the same content: same bytes, still elided.
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < DF_WIRE_INTERVAL_TICKS; i++) server.sim.tick();
      broadcast(server);
    }
    const dfbSnaps = (sent: any[], from: number): any[] =>
      sent.slice(from).filter((m) => m.t === 'snap' && m.self && 'dfb' in m.self);
    expect(dfbSnaps(fcA.sent, idleA)).toHaveLength(0);
    expect(dfbSnaps(fcB.sent, idleB)).toHaveLength(0);
    // A real board change (a second listing) still reaches both sessions on
    // their next due pass: the memo re-keys on the pass tick and re-stringifies
    // the grown board. A memo that never invalidated (a constant tick key)
    // would keep serving the stale one-listing string and red the length pin.
    server.sim.setPlayerLevel(8, sb.pid);
    server.sim.dungeonFinderListingCreate('hollow_crypt_normal', [], sb.pid);
    const changedA = fcA.sent.length;
    const changedB = fcB.sent.length;
    for (let i = 0; i < DF_WIRE_INTERVAL_TICKS; i++) server.sim.tick();
    broadcast(server);
    const grownA = dfbSnaps(fcA.sent, changedA);
    const grownB = dfbSnaps(fcB.sent, changedB);
    expect(grownA).toHaveLength(1);
    expect(grownB).toHaveLength(1);
    expect(grownA[0].self.dfb).toHaveLength(2);
    expect(JSON.stringify(grownA[0].self.dfb)).toBe(JSON.stringify(grownB[0].self.dfb));
  });

  it('keeps the cadence gate per-session: staggered sessions receive a change at their OWN ticks', () => {
    // The dfb gate is per-session state (session.lastDfWireTick), NOT a
    // realm-global dueness tracker: two sessions with offset gates
    // receive a board change at DIFFERENT broadcast passes, each at its own
    // next due tick. A realm-global gate would deliver the change to both
    // sessions in the SAME pass and red the not-yet-delivered assertion below.
    const server = new GameServer();
    const fcA = fakeWs();
    const sa = joinServer(server, fcA, 63, 'StagOne');
    server.sim.setPlayerLevel(8, sa.pid);
    server.sim.dungeonFinderListingCreate('hollow_crypt_normal', ['first_run'], sa.pid);
    broadcast(server); // tick 0: A ships the one-listing board; A's gate anchors at 0
    // five ticks later a SECOND session joins: its fresh-join pass anchors its
    // gate at tick 5, so the two sessions stay offset by 5 ticks forever
    for (let i = 0; i < 5; i++) server.sim.tick();
    const fcB = fakeWs();
    const sb = joinServer(server, fcB, 64, 'StagTwo');
    broadcast(server); // tick 5: B (fresh) ships the board; A is mid-interval, elided
    expect(lastSnap(fcB.sent).self.dfb).toHaveLength(1);
    // the board changes while BOTH gates are closed
    server.sim.setPlayerLevel(8, sb.pid);
    server.sim.dungeonFinderListingCreate('hollow_crypt_normal', [], sb.pid);
    const dfbSnaps = (sent: any[], from: number): any[] =>
      sent.slice(from).filter((m) => m.t === 'snap' && m.self && 'dfb' in m.self);
    const aFrom = fcA.sent.length;
    const bFrom = fcB.sent.length;
    for (let i = 0; i < 5; i++) server.sim.tick();
    broadcast(server); // tick 10: A's gate opens (10 - 0), B's does not (10 - 5)
    expect(dfbSnaps(fcA.sent, aFrom)).toHaveLength(1);
    expect(dfbSnaps(fcA.sent, aFrom)[0].self.dfb).toHaveLength(2);
    expect(dfbSnaps(fcB.sent, bFrom)).toHaveLength(0); // B must NOT see it yet
    for (let i = 0; i < 5; i++) server.sim.tick();
    broadcast(server); // tick 15: B's own gate opens (15 - 5)
    const bGrown = dfbSnaps(fcB.sent, bFrom);
    expect(bGrown).toHaveLength(1);
    expect(bGrown[0].self.dfb).toHaveLength(2);
  });
});

describe('entity-anchored world event scoping', () => {
  it('delivers delveRitePulse to sessions near its entityId anchor and not to far ones', () => {
    // The rite pulse is a world event with no pid; eventAnchor must resolve its
    // entityId to the shrine position and interest-scope delivery (EVENT_RADIUS).
    // Pre-fix the field was shrineId, which eventAnchor did not recognize, so
    // the pulse broadcast realm-wide and closed rite popups in unrelated runs.
    const server = new GameServer();
    const near = fakeWs();
    const far = fakeWs();
    const sNear = joinServer(server, near, 1, 'Nearena');
    const sFar = joinServer(server, far, 2, 'Faraway');
    const nearEnt = server.sim.entities.get(sNear.pid)!;
    const farEnt = server.sim.entities.get(sFar.pid)!;
    farEnt.pos.x = nearEnt.pos.x + 500;
    farEnt.pos.z = nearEnt.pos.z + 500;
    near.sent.length = 0;
    far.sent.length = 0;
    // Anchor on the near player's own entity: eventAnchor only reads a live
    // entity's position, so any resolvable id pins the scoping semantics.
    (server as any).routeEvents([
      {
        type: 'delveRitePulse',
        entityId: nearEnt.id,
        shrineKind: 'rite_shrine_bell',
      },
    ]);
    const pulses = (fc: ReturnType<typeof fakeWs>) =>
      fc.sent
        .flatMap((msg) => (msg.t === 'events' ? msg.list : []))
        .filter((ev: { type: string }) => ev.type === 'delveRitePulse');
    expect(pulses(near)).toHaveLength(1);
    expect(pulses(far)).toHaveLength(0);
  });
});

describe('authoritative interaction command outcomes', () => {
  it.each([
    ['loot', { id: -1 }],
    ['pickup', { id: -1 }],
    ['harvest_node', {}],
    ['enter_dungeon', {}],
    ['leave_dungeon', {}],
    ['delve_interact', {}],
  ])('reports a rejected %s command to the requesting client', (cmd, payload) => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Interactor');
    fc.sent.length = 0;
    const rid = 41;

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd, ...payload, rid }));

    expect(fc.sent).toContainEqual({ t: 'commandOutcome', rid, ok: false });
  });

  it('reports a successful command to the requesting client', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Interactor');
    fc.sent.length = 0;

    const player = server.sim.entities.get(session.pid)!;
    player.dead = true;
    player.ghost = false;
    player.hp = 0;
    server.sim.releaseSpirit(session.pid);
    expect(player.ghost).toBe(true);

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'resurrect_healer', rid: 42 }));
    expect(fc.sent).toContainEqual({ t: 'commandOutcome', rid: 42, ok: true });
    expect(player.dead).toBe(false);
  });

  it('forwards a valid pickup payload and reports the resulting world change', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Interactor');
    const player = server.sim.entities.get(session.pid)!;
    const object = [...server.sim.entities.values()].find(
      (entity) =>
        entity.kind === 'object' && entity.objectItemId === 'supply_crate' && entity.lootable,
    )!;
    server.sim.players.get(session.pid)!.questLog.set('q_supplies', {
      questId: 'q_supplies',
      counts: [0],
      state: 'active',
    });
    player.pos = { ...object.pos };
    player.prevPos = { ...object.pos };
    fc.sent.length = 0;

    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'pickup', id: object.id, rid: 43 }),
    );

    expect(fc.sent).toContainEqual({ t: 'commandOutcome', rid: 43, ok: true });
    expect(server.sim.countItem('supply_crate', session.pid)).toBe(1);
    expect(object.lootable).toBe(false);
  });
});

describe('negotiated Warlock pet-special wire v1', () => {
  it('advertises the button only to capable clients and disables hidden legacy autocast', () => {
    const server = new GameServer();
    const legacyWire = fakeWs();
    const capableWire = fakeWs();
    const legacy = joinServer(server, legacyWire, 1, 'Legacy', 'warlock');
    const capable = joinServer(server, capableWire, 2, 'Capable', 'warlock', {
      petSpecialWireVersion: 1,
    } as Parameters<GameServer['join']>[7]);
    const legacyOwner = server.sim.entities.get(legacy.pid)!;
    const capableOwner = server.sim.entities.get(capable.pid)!;

    summonPet(server.sim.ctx, legacyOwner, 'gloomshade');
    summonPet(server.sim.ctx, capableOwner, 'gloomshade');
    const legacyPet = petOf(server.sim.ctx, legacy.pid)!;
    const capablePet = petOf(server.sim.ctx, capable.pid)!;
    expect(legacyPet.petAutoSkill).toBe(false);
    expect(capablePet.petAutoSkill).toBe(true);

    const legacyTarget = createMob(server.sim.nextId++, MOBS.forest_wolf, 2, {
      x: legacyPet.pos.x,
      y: legacyPet.pos.y,
      z: legacyPet.pos.z + 12,
    });
    const capableTarget = createMob(server.sim.nextId++, MOBS.forest_wolf, 2, {
      x: capablePet.pos.x,
      y: capablePet.pos.y,
      z: capablePet.pos.z + 12,
    });
    server.sim.addEntity(legacyTarget);
    server.sim.addEntity(capableTarget);
    legacyOwner.targetId = legacyTarget.id;
    capableOwner.targetId = capableTarget.id;

    server.handleMessage(legacy, JSON.stringify({ t: 'cmd', cmd: 'pet_special' }));
    expect(legacyPet.petSkillTimer).toBe(0);
    expect(
      Math.hypot(legacyTarget.pos.x - legacyPet.pos.x, legacyTarget.pos.z - legacyPet.pos.z),
    ).toBe(12);
    server.handleMessage(capable, JSON.stringify({ t: 'cmd', cmd: 'pet_special' }));
    expect(capablePet.petSkillTimer).toBe(15);
    expect(
      Math.hypot(capableTarget.pos.x - capablePet.pos.x, capableTarget.pos.z - capablePet.pos.z),
    ).toBeCloseTo(2.8, 1);

    server.handleMessage(
      legacy,
      JSON.stringify({ t: 'cmd', cmd: 'pet_auto_special', enabled: true }),
    );
    expect(petOf(server.sim.ctx, legacy.pid)?.petAutoSkill).toBe(false);
    server.handleMessage(
      capable,
      JSON.stringify({ t: 'cmd', cmd: 'pet_auto_special', enabled: false }),
    );
    expect(petOf(server.sim.ctx, capable.pid)?.petAutoSkill).toBe(false);
    server.handleMessage(
      capable,
      JSON.stringify({ t: 'cmd', cmd: 'pet_auto_special', enabled: 'true' }),
    );
    expect(petOf(server.sim.ctx, capable.pid)?.petAutoSkill).toBe(false);
    server.handleMessage(
      capable,
      JSON.stringify({ t: 'cmd', cmd: 'pet_auto_special', enabled: true }),
    );
    expect(petOf(server.sim.ctx, capable.pid)?.petAutoSkill).toBe(true);

    broadcast(server);
    const legacySnap = lastSnap(legacyWire.sent);
    const capableSnap = lastSnap(capableWire.sent);
    expect(legacySnap.psw).toBeUndefined();
    expect(capableSnap.psw).toBe(1);

    const legacyClient = bareClient(legacy.pid, { playerClass: 'warlock' });
    const capableClient = bareClient(capable.pid, { playerClass: 'warlock' });
    (legacyClient as any).applySnapshot(legacySnap);
    (capableClient as any).applySnapshot(capableSnap);
    expect(legacyClient.petSpecialCommandsSupported).toBe(false);
    expect(capableClient.petSpecialCommandsSupported).toBe(true);

    (capableClient as any).applySnapshot({ ...capableSnap, psw: 2 });
    expect(capableClient.petSpecialCommandsSupported).toBe(false);
  });

  it('disarms a legacy restored special pet before the first server tick', () => {
    const source = new Sim({
      seed: 991,
      playerClass: 'warlock',
      noPlayer: true,
    });
    const sourcePid = source.addPlayer('warlock', 'Source');
    source.setPlayerLevel(20, sourcePid);
    const sourceOwner = source.entities.get(sourcePid)!;
    summonPet(source.ctx, sourceOwner, 'gloomshade');
    const state = source.serializeCharacter(sourcePid)!;
    state.pet = serializePet(source.ctx, sourcePid);

    const server = new GameServer();
    const wire = fakeWs();
    const joined = server.join(wire.ws, 3, 3, 'LegacyRestore', 'warlock', state);
    if ('error' in joined) throw new Error(joined.error);

    expect(petOf(server.sim.ctx, joined.pid)?.petAutoSkill).toBe(false);
  });

  it('refreshes pet-special capability on linkdead resume and disarms a downgrade', () => {
    const server = new GameServer();
    const firstWire = fakeWs();
    const original = joinServer(server, firstWire, 4, 'ResumeDemonist', 'warlock', {
      petSpecialWireVersion: 1,
    } as Parameters<GameServer['join']>[7]);
    const owner = server.sim.entities.get(original.pid)!;
    summonPet(server.sim.ctx, owner, 'gloomshade');
    const pet = petOf(server.sim.ctx, original.pid)!;
    expect(pet.petAutoSkill).toBe(true);

    firstWire.ws.readyState = 3;
    expect(server.socketClosed(original, firstWire.ws)).toBe(true);
    const legacyWire = fakeWs();
    const legacyResume = server.join(legacyWire.ws, 4, 4, 'ResumeDemonist', 'warlock', null);
    if ('error' in legacyResume) throw new Error(legacyResume.error);
    expect(legacyResume).toBe(original);
    expect(legacyResume.petSpecialWireVersion).toBe(0);
    expect(owner.petSpecialCommandsSupported).toBe(false);
    expect(pet.petAutoSkill).toBe(false);
    legacyWire.sent.length = 0;
    broadcast(server);
    expect(lastSnap(legacyWire.sent).psw).toBeUndefined();

    legacyWire.ws.readyState = 3;
    expect(server.socketClosed(legacyResume, legacyWire.ws)).toBe(true);
    const capableWire = fakeWs();
    const capableResume = server.join(
      capableWire.ws,
      4,
      4,
      'ResumeDemonist',
      'warlock',
      null,
      false,
      { petSpecialWireVersion: 1 } as Parameters<GameServer['join']>[7],
    );
    if ('error' in capableResume) throw new Error(capableResume.error);
    expect(capableResume).toBe(original);
    expect(capableResume.petSpecialWireVersion).toBe(1);
    expect(owner.petSpecialCommandsSupported).toBe(true);
    capableWire.sent.length = 0;
    broadcast(server);
    expect(lastSnap(capableWire.sent).psw).toBe(1);
  });
});

describe('mount skin identity round trip', () => {
  it.each(['mech_bird', 'chimeglass_tortoise', 'rickshaw_mount', 'goblin_rocket_sled'])(
    'ships %s to another client and clears it on takeoff',
    (skin) => {
      const server = new GameServer();
      const fc = fakeWs();
      const wearer = joinServer(server, fakeWs(), 1, 'Skinned');
      const observer = joinServer(server, fc, 2, 'Observer');
      const rider = server.sim.entities.get(wearer.pid)!;
      wearer.accountCosmetics.mountSkinIds = [skin];
      server.handleMessage(wearer, JSON.stringify({ t: 'cmd', cmd: 'change_mount_skin', skin }));
      expect(rider.mountSkinId).toBe(skin);
      expect(rider.mountKey).toBe('');
      const viewer = bareClient(observer.pid);
      server.sim.tick();
      broadcast(server);
      (viewer as unknown as SnapshotApplier).applySnapshot(lastSnap(fc.sent));
      expect(viewer.entities.get(wearer.pid)?.mountSkinId).toBe(skin);
      server.handleMessage(
        wearer,
        JSON.stringify({ t: 'cmd', cmd: 'change_mount_skin', skin: null }),
      );
      server.sim.tick();
      broadcast(server);
      (viewer as unknown as SnapshotApplier).applySnapshot(lastSnap(fc.sent));
      expect(viewer.entities.get(wearer.pid)?.mountSkinId).toBeNull();
    },
  );
  it.each([...RETIRED_MOUNT_SKIN_IDS])(
    'refuses to wear the retired %s even when the account row grants it',
    (skin) => {
      const server = new GameServer();
      const wearer = joinServer(server, fakeWs(), 1, 'Skinned');
      const rider = server.sim.entities.get(wearer.pid)!;
      wearer.accountCosmetics.mountSkinIds = [skin];
      server.handleMessage(wearer, JSON.stringify({ t: 'cmd', cmd: 'change_mount_skin', skin }));
      expect(rider.mountSkinId).toBeNull();
      expect(server.sim.meta(wearer.pid)?.mountSkinId ?? null).toBeNull();
    },
  );
  it('shares the identity-update rate limit with other cosmetics', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    try {
      const server = new GameServer();
      const session = joinServer(server, fakeWs(), 1, 'Limiter');
      session.accountCosmetics.mountSkinIds = ['goblin_rocket_sled'];
      const setter = vi.spyOn(server.sim, 'setMountSkin');
      for (let i = 0; i < COSMETIC_OP_BURST + 5; i++) {
        server.handleMessage(
          session,
          JSON.stringify({
            t: 'cmd',
            cmd: 'change_mount_skin',
            skin: i % 2 ? null : 'goblin_rocket_sled',
          }),
        );
      }
      expect(setter).toHaveBeenCalledTimes(COSMETIC_OP_BURST);
    } finally {
      now.mockRestore();
    }
  });
});
