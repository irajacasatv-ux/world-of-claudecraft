// The freehold instance claim ONLINE: the real GameServer session lifecycle
// (join, dispatch, socketClosed, expireLinkdeadSessions) driving the real
// owner-keyed claim (src/sim/freehold/instance.ts over the shared instance
// slot pool, D15) from the wire in, on the disconnect-reset model of
// tests/dungeon_instance_disconnect_reset.test.ts. What the offline suites
// cannot see is pinned here:
//  - the owner key is SERVER authority: `account:<id>` from the authenticated
//    session at join (never a frame field), every character of one account
//    resolves the same house, and the key never reaches any client frame;
//  - a fresh account's first join already holds the default tier-0 Inn Room
//    record (D81) and its first freehold_enter claims the Inn Room slot;
//  - two sessions of one account share ONE claim (a second enter claims no
//    second slot), concurrently (GM-exempt from the per-account session cap)
//    and through the linkdead displacement path;
//  - a dropped socket keeps the claim (resume rebinds the same session); a
//    full relog after the grace expires, before the empty timer elapses,
//    re-enters the SAME slot; after the reaper frees it, a fresh claim;
//  - the jailed refusal (the existing notice, the player and the pool
//    untouched), the dark-realm refusal at dispatch (counted, nothing claimed,
//    no record seeded on a dark Sim), and the smuggled-key frame;
//  - freehold_leave sets the player down outside the Eastbrook gate and frees
//    nothing until the reaper does;
//  - the `/dev freehold <tier>` server path needs ALLOW_DEV_COMMANDS=1 alone.
//
// Db is mocked so no Postgres runs (the freehold_wire.test.ts template, plus
// the weapon-skin write the disconnect model's leave path reaches).

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../server/db', () => ({
  pool: { query: vi.fn(async () => ({ rows: [] })) },
  saveCharacterState: vi.fn(async () => {}),
  saveCharacterAndMarketState: vi.fn(async () => {}),
  saveMarketState: vi.fn(async () => {}),
  saveMailState: vi.fn(async () => {}),
  loadMarketState: vi.fn(async () => null),
  loadMailState: vi.fn(async () => null),
  openPlaySession: vi.fn(async () => 1),
  touchCharacterLogin: vi.fn(async () => {}),
  closePlaySession: vi.fn(async () => {}),
  insertChatLogs: vi.fn(async () => {}),
  loadAccountFlair: vi.fn(async () => ({ ai: false, streamer: false, links: {} })),
  walletForAccount: vi.fn(async () => null),
  markAccountQuestComplete: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  grantAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  revokeAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  setAccountWeaponSkinLoadout: vi.fn(async () => ({
    completedQuestIds: [],
    mechChromaIds: [],
    weaponSkinIds: [],
    weaponSkinLoadout: {},
  })),
  insertBankLedgerRow: vi.fn(async () => {}),
  insertBankLedgerRows: vi.fn(async () => {}),
  acquireCharacterLease: vi.fn(async () => true),
  releaseCharacterLease: vi.fn(async () => {}),
  heartbeatCharacterLeases: vi.fn(async () => {}),
  releaseAllCharacterLeases: vi.fn(async () => {}),
}));

import { type ClientSession, GameServer } from '../server/game';
import { noopGameMetricsCounters, setGameMetricsCounters } from '../server/http/game_signals';
import { isBlocked } from '../src/sim/colliders';
import { DUNGEONS, instanceOrigin } from '../src/sim/data';
import { setFreeholdTier } from '../src/sim/freehold/state';
import type { InstanceSlot } from '../src/sim/sim';
import { INSTANCE_EMPTY_TIMEOUT, type PlayerClass } from '../src/sim/types';
import { type FakeClient, fakeWs } from './helpers/bare_client';

// The two owner-claimed rooms sit in the dungeon overflow band at 600 yd
// centres: instanceOriginX(15) = 119200 for the Inn Room, instanceOriginX(16)
// = 119800 for the Cottage, each owning +/- 300 (src/sim/data.ts dungeonAt).
const INN_ROOM_BAND = { min: 118900, max: 119500 } as const;
const COTTAGE_BAND = { min: 119500, max: 120100 } as const;
// Leaving sets the player down outside the Eastbrook gate: the def's doorPos
// { x: -37, z: -103.5 } plus the default 4 yd door inset (the record declares
// no leaveOffset), so { x: -37, z: -107.5 } on open ground off the east road
// (standability is pinned in tests/freehold_dungeon_defs.test.ts).
const GATE_DROP = { x: -37, z: -107.5 } as const;

// process.env is safe to flip here because vitest's default forks pool gives
// each test file its own process and files in one fork run sequentially.
const savedFlag = process.env.FREEHOLDS_ENABLED;
const savedDev = process.env.ALLOW_DEV_COMMANDS;
afterEach(() => {
  if (savedFlag === undefined) delete process.env.FREEHOLDS_ENABLED;
  else process.env.FREEHOLDS_ENABLED = savedFlag;
  if (savedDev === undefined) delete process.env.ALLOW_DEV_COMMANDS;
  else process.env.ALLOW_DEV_COMMANDS = savedDev;
  vi.restoreAllMocks();
  setGameMetricsCounters(noopGameMetricsCounters);
});

/** A realm whose Sim booted lit (the env is read at construction, D85). */
function litServer(): GameServer {
  process.env.FREEHOLDS_ENABLED = '1';
  return new GameServer();
}

/** A realm whose Sim booted dark: the default shipping shape. */
function darkServer(): GameServer {
  delete process.env.FREEHOLDS_ENABLED;
  return new GameServer();
}

/** A metrics sink that counts freeholdRefused and drops everything else. */
function recordingRefusalSink(): { count: () => number } {
  let refused = 0;
  setGameMetricsCounters({
    ...noopGameMetricsCounters,
    freeholdRefused() {
      refused++;
    },
  });
  return { count: () => refused };
}

function joinAs(
  server: GameServer,
  fc: FakeClient,
  accountId: number,
  characterId: number,
  name: string,
  opts: { cls?: PlayerClass; isGm?: boolean } = {},
): ClientSession {
  const s = server.join(
    fc.ws,
    accountId,
    characterId,
    name,
    opts.cls ?? 'warrior',
    null,
    opts.isGm ?? false,
  );
  if ('error' in s) throw new Error(s.error);
  s.blockListLoaded = true;
  return s;
}

function send(server: GameServer, session: ClientSession, frame: Record<string, unknown>): void {
  server.handleMessage(session, JSON.stringify({ t: 'cmd', ...frame }));
}

function approachGate(server: GameServer, session: ClientSession): void {
  const gate = [...server.sim.entities.values()].find((e) => e.templateId === 'freehold_gate');
  if (!gate || session.jailed) return;
  const e = entityOf(server, session.pid);
  e.pos = { ...gate.pos };
  e.prevPos = { ...e.pos };
}

function enter(server: GameServer, session: ClientSession, rid?: number): void {
  approachGate(server, session);
  send(
    server,
    session,
    rid === undefined ? { cmd: 'freehold_enter' } : { cmd: 'freehold_enter', rid },
  );
}

function leave(server: GameServer, session: ClientSession): void {
  send(server, session, { cmd: 'freehold_leave' });
}

function entityOf(server: GameServer, pid: number) {
  const e = server.sim.entities.get(pid);
  if (!e) throw new Error(`entity ${pid} missing`);
  return e;
}

function claimsFor(server: GameServer, key: string): InstanceSlot[] {
  return server.sim.instances.filter((i) => i.partyKey === key);
}

function claimFor(server: GameServer, key: string): InstanceSlot {
  const claims = claimsFor(server, key);
  if (claims.length !== 1) throw new Error(`${claims.length} claims for ${key}`);
  return claims[0];
}

function eventTexts(fc: FakeClient): string[] {
  return fc.sent
    .filter((m) => m.t === 'events')
    .flatMap((m) => m.list ?? [])
    .map((ev: { text?: unknown }) => ev.text)
    .filter((t): t is string => typeof t === 'string');
}

function outcomes(fc: FakeClient): unknown[] {
  return fc.sent.filter((m) => m.t === 'commandOutcome');
}

// The transport-level drop: the WebSocketServer close/error handlers in
// server/main.ts call game.socketClosed(session, ws).
function dropSocket(server: GameServer, session: ClientSession, fc: FakeClient): boolean {
  fc.ws.readyState = 3;
  return server.socketClosed(session, fc.ws);
}

/** Force the grace window shut and run the tick-driven teardown to completion. */
async function expireLinkdead(server: GameServer, session: ClientSession): Promise<void> {
  session.graceUntil = Date.now() - 1;
  (server as unknown as { expireLinkdeadSessions(): void }).expireLinkdeadSessions();
  await vi.waitFor(() => {
    expect(server.sim.entities.has(session.pid)).toBe(false);
  });
}

/** Run the sim's once-a-second reaper (updateInstances gates on tickCount % 20). */
function runReaper(server: GameServer): void {
  for (let i = 0; i < 20; i++) server.sim.tick();
}

function expectInBand(x: number, band: { min: number; max: number }): void {
  expect(x).toBeGreaterThanOrEqual(band.min);
  expect(x).toBeLessThan(band.max);
}

describe('freehold claim online: the default record and the first enter (D81, D15)', () => {
  it('a fresh account holds the tier-0 Inn Room record under account:<id> at join, and enter claims the Inn Room slot', () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4201, 420101, 'Ari');
    const key = 'account:4201';
    expect(server.sim.meta(s.pid)?.freeholdOwnerKey).toBe(key);
    expect(server.sim.ctx.freeholds.get(key)).toMatchObject({
      ownerKey: key,
      tier: 'inn_room',
      layout: [],
      trophies: [],
      condition: 100,
      visitPolicy: 'closed',
      isDecorating: false,
      rev: 0,
    });
    // No claim until the player steps in.
    expect(claimsFor(server, key)).toEqual([]);
    const p = entityOf(server, s.pid);
    expect(p.pos.x).toBeLessThan(INN_ROOM_BAND.min);

    enter(server, s, 11);

    const inst = claimFor(server, key);
    expect(inst.dungeonId).toBe('freehold_inn_room');
    expectInBand(p.pos.x, INN_ROOM_BAND);
    expect(server.sim.instanceInfoAt(p.pos)).toEqual({
      slot: inst.slot,
      dungeonId: 'freehold_inn_room',
    });
    // Accepted: no ok:false ack answers the rid.
    expect(outcomes(fc).filter((m) => (m as { ok: boolean }).ok === false)).toEqual([]);
  });

  it('the owner key never reaches a client frame: the enter log line does, the key does not', () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4202, 420201, 'Ari');
    enter(server, s);
    // The token the scan below hunts for IS present on the session's meta:
    // without this control an unstamped key would pass the leak scan vacuously.
    expect(server.sim.meta(s.pid)?.freeholdOwnerKey).toBe('account:4202');
    // Route this tick's events and broadcast a snapshot exactly as the
    // world loop does, then read every frame the socket ever received.
    const events = server.sim.tick();
    (server as unknown as { routeEvents(e: unknown[]): void }).routeEvents(events);
    (server as unknown as { broadcastSnapshots(): void }).broadcastSnapshots();
    const wire = JSON.stringify(fc.sent);
    // The positive control that the capture saw real traffic: the def's
    // enter line rode the events frame to this session. Read from the def
    // here; the English literal is pinned in tests/freehold_dungeon_defs.test.ts.
    expect(eventTexts(fc)).toContain(DUNGEONS.freehold_inn_room.enterText);
    expect(wire).toContain('"t":"snap"');
    expect(wire).not.toContain('account:');
    expect(wire).not.toContain('freeholdOwnerKey');
  });
});

describe('freehold claim online: a malformed account id is refused at join, never thrown', () => {
  // The owner-key stamp needs a real account id (freeholdOwnerKeyForAccount
  // throws on a bad one). planJoin refuses first, through join's `{ error }`
  // contract, so the caller's character-lease release and the linkdead
  // sibling logout ordering never see a throw: nothing is created.
  it.each([
    ['zero', 0],
    ['NaN', Number.NaN],
  ])('join with a %s account id returns the auth refusal and leaves nothing behind', (_l, id) => {
    const server = litServer();
    // A bystander session of a real account, held linkdead: the refused join
    // must not disturb it either.
    const fb = fakeWs();
    const bystander = joinAs(server, fb, 4901, 490101, 'Bo');
    expect(dropSocket(server, bystander, fb)).toBe(true);
    const clientsBefore = server.clients.size;
    const entitiesBefore = server.sim.entities.size;
    const recordsBefore = server.sim.ctx.freeholds.size;
    const fc = fakeWs();

    const result = server.join(fc.ws, id, 490901, 'Nul', 'warrior', null, false);

    expect(result).toEqual({ error: 'not authenticated' });
    expect(fc.sent).toEqual([]);
    expect(server.hasSessionForCharacter(490901)).toBe(false);
    expect(server.clients.size).toBe(clientsBefore);
    expect(server.sim.entities.size).toBe(entitiesBefore);
    expect(server.sim.ctx.freeholds.size).toBe(recordsBefore);
    for (const key of server.sim.ctx.freeholds.keys()) expect(key).toBe('account:4901');
    expect(server.sim.entities.has(bystander.pid)).toBe(true);
    expect(bystander.linkdead).toBe(true);
    expect(bystander.left).toBe(false);
  });
});

describe('freehold claim online: one account, one claim', () => {
  it('two concurrent sessions of one account (two characters, two sockets) share one slot', () => {
    const server = litServer();
    const fa = fakeWs();
    const fb = fakeWs();
    // The per-account live-session cap admits a second character only for a
    // GM: the exemption that makes two concurrent sessions possible at all.
    const a = joinAs(server, fa, 4301, 430101, 'Ari', { isGm: true });
    const b = joinAs(server, fb, 4301, 430102, 'Bo', { cls: 'mage', isGm: true });
    const key = 'account:4301';
    expect(server.sim.meta(a.pid)?.freeholdOwnerKey).toBe(key);
    expect(server.sim.meta(b.pid)?.freeholdOwnerKey).toBe(key);

    enter(server, a);
    const inst = claimFor(server, key);
    enter(server, b);

    // The second enter claimed no second slot: the same claim, and both
    // players stand inside its footprint.
    expect(claimsFor(server, key)).toHaveLength(1);
    expect(claimFor(server, key)).toBe(inst);
    const pa = entityOf(server, a.pid);
    const pb = entityOf(server, b.pid);
    const inside = { slot: inst.slot, dungeonId: 'freehold_inn_room' };
    expect(server.sim.instanceInfoAt(pa.pos)).toEqual(inside);
    expect(server.sim.instanceInfoAt(pb.pos)).toEqual(inside);
    expect(server.sim.instances.filter((i) => i.partyKey !== null)).toEqual([inst]);
  });

  it('a second character replacing a linkdead first one re-enters the same live claim, record intact', async () => {
    const server = litServer();
    const fa = fakeWs();
    const a = joinAs(server, fa, 4302, 430201, 'Ari');
    const key = 'account:4302';
    enter(server, a);
    const inst = claimFor(server, key);
    // A revision the default seed would NOT reproduce, so "record intact"
    // below is decisive: a wrongly re-seeded record would read rev 0 again.
    // The tier stays inn_room on purpose, so the replacement still re-enters
    // this same claim rather than a fresh Cottage.
    expect(setFreeholdTier(server.sim.ctx, key, 'inn_room')).toBe(true);
    expect(server.sim.ctx.freeholds.get(key)?.rev).toBe(1);
    expect(dropSocket(server, a, fa)).toBe(true);

    // Logging in on another character of the same account ends the held
    // character's grace at once (game.ts join: "replaced by a new character
    // login"); the new session must still see the account's record and claim.
    const fb = fakeWs();
    const b = joinAs(server, fb, 4302, 430202, 'Bo', { cls: 'mage' });
    await vi.waitFor(() => {
      expect(server.sim.entities.has(a.pid)).toBe(false);
    });
    expect(server.sim.meta(b.pid)?.freeholdOwnerKey).toBe(key);
    expect(server.sim.ctx.freeholds.get(key)).toMatchObject({
      ownerKey: key,
      tier: 'inn_room',
      rev: 1,
    });
    expect(inst.partyKey).toBe(key);

    enter(server, b);
    expect(claimFor(server, key)).toBe(inst);
    expect(server.sim.instanceInfoAt(entityOf(server, b.pid).pos)).toEqual({
      slot: inst.slot,
      dungeonId: 'freehold_inn_room',
    });
  });
});

describe('freehold claim online: the corpse run', () => {
  it('a character that dies inside and releases re-enters its own room through the real dispatch and resurrects', () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4310, 431001, 'Ari');
    const key = 'account:4310';
    enter(server, s);
    const inst = claimFor(server, key);
    const e = entityOf(server, s.pid);
    (server.sim as unknown as { handleDeath(e: unknown, killer: null): void }).handleDeath(e, null);
    server.sim.releaseSpirit(s.pid);
    expect(e.ghost).toBe(true);
    expect(e.corpseInstanceId).toBe(inst.exitId);
    expect(server.sim.instanceInfoAt(e.pos)).toBeNull();
    // The dispatch has no dead gate of its own: the sim's corpse-run exception
    // decides, and the ghost is back inside the SAME claim, alive.
    enter(server, s, 31);
    expect(claimFor(server, key)).toBe(inst);
    expect(server.sim.instanceInfoAt(e.pos)).toEqual({
      slot: inst.slot,
      dungeonId: 'freehold_inn_room',
    });
    expect(e.dead).toBe(false);
    expect(e.ghost).toBe(false);
    expect(e.corpseInstanceId).toBeNull();
    expect(claimsFor(server, key)).toHaveLength(1);
  });
});

describe('freehold claim online: the disconnect-reset model', () => {
  it('a dropped socket keeps the claim alive; resuming within the grace rebinds the same session', () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4401, 440101, 'Ari');
    const key = 'account:4401';
    enter(server, s);
    const inst = claimFor(server, key);

    expect(dropSocket(server, s, fc)).toBe(true);
    expect(s.linkdead).toBe(true);
    // The linkdead entity still stands inside the claim, so the reaper's
    // occupancy pass resets the empty timer even when forced to the brink.
    inst.emptyFor = INSTANCE_EMPTY_TIMEOUT - 1;
    runReaper(server);
    expect(inst.partyKey).toBe(key);
    expect(inst.emptyFor).toBe(0);

    const fc2 = fakeWs();
    const resumed = joinAs(server, fc2, 4401, 440101, 'Ari');
    expect(resumed).toBe(s);
    expect(s.linkdead).toBe(false);
    expect(claimFor(server, key)).toBe(inst);
    expect(server.sim.instanceInfoAt(entityOf(server, s.pid).pos)).toEqual({
      slot: inst.slot,
      dungeonId: 'freehold_inn_room',
    });
  });

  it('a full relog after the grace expires re-enters the SAME slot before the empty timer elapses, and a fresh claim after the reaper', async () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4402, 440201, 'Ari');
    const key = 'account:4402';
    enter(server, s);
    const inst = claimFor(server, key);
    const slotIndex = inst.slot;

    expect(dropSocket(server, s, fc)).toBe(true);
    await expireLinkdead(server, s);
    // The character is gone; the claim outlives it until the reaper decides.
    expect(inst.partyKey).toBe(key);
    expect(server.sim.entities.has(s.pid)).toBe(false);

    // Relog before INSTANCE_EMPTY_TIMEOUT elapses in sim time: a genuinely
    // fresh session and pid rebinding to the still-alive claim.
    expect(inst.emptyFor).toBeLessThan(INSTANCE_EMPTY_TIMEOUT);
    const fc2 = fakeWs();
    const relogged = joinAs(server, fc2, 4402, 440201, 'Ari');
    expect(relogged).not.toBe(s);
    expect(relogged.pid).not.toBe(s.pid);
    expect(server.sim.meta(relogged.pid)?.freeholdOwnerKey).toBe(key);
    expect(server.sim.ctx.freeholds.get(key)).toMatchObject({ ownerKey: key, tier: 'inn_room' });
    enter(server, relogged);
    expect(claimFor(server, key)).toBe(inst);
    expect(claimsFor(server, key)).toHaveLength(1);
    expect(server.sim.instanceInfoAt(entityOf(server, relogged.pid).pos)).toEqual({
      slot: slotIndex,
      dungeonId: 'freehold_inn_room',
    });

    // Abandon it for good: drop, expire, and let the real reaper run past the
    // empty timeout with nobody inside.
    expect(dropSocket(server, relogged, fc2)).toBe(true);
    await expireLinkdead(server, relogged);
    inst.emptyFor = INSTANCE_EMPTY_TIMEOUT - 1;
    runReaper(server);
    expect(inst.partyKey).toBeNull();
    expect(claimsFor(server, key)).toEqual([]);

    // A fresh claim: the owner is back and steps in again.
    const fc3 = fakeWs();
    const again = joinAs(server, fc3, 4402, 440201, 'Ari');
    enter(server, again);
    const fresh = claimFor(server, key);
    expect(fresh.dungeonId).toBe('freehold_inn_room');
    expectInBand(entityOf(server, again.pid).pos.x, INN_ROOM_BAND);
  });
});

describe('freehold claim online: the refusals leave the player and the pool untouched', () => {
  it('a jailed session receives exact gate feedback without movement, claims or Sim dispatch', () => {
    const server = litServer();
    const refusals = recordingRefusalSink();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4501, 450101, 'Ari');
    const key = 'account:4501';
    s.jailed = { returnPos: { x: 0, z: 0 }, returnFacing: 0 };
    const target = vi.spyOn(server.sim, 'freeholdEnter');
    const p = entityOf(server, s.pid);
    const before = { ...p.pos };
    server.sim.drainEvents();

    const sentBefore = fc.sent.length;
    s.selfHeavyDirty = false;
    enter(server, s, 21);

    expect(fc.sent.slice(sentBefore)).toEqual([
      { t: 'events', list: [{ type: 'freeholdDenied', pid: s.pid, reason: 'busy' }] },
      { t: 'commandOutcome', rid: 21, ok: false },
    ]);
    expect(s.selfHeavyDirty).toBe(false);
    expect(outcomes(fc)).toEqual([{ t: 'commandOutcome', rid: 21, ok: false }]);
    expect(target).not.toHaveBeenCalled();
    expect(p.pos).toEqual(before);
    expect(claimsFor(server, key)).toEqual([]);
    expect(server.sim.instances.filter((i) => i.partyKey !== null)).toEqual([]);
    expect(server.sim.drainEvents()).toEqual([]);
    // The jail arm owns the refusal on a lit realm: nothing booked against
    // the dark-housing series.
    expect(refusals.count()).toBe(0);
    // The record itself is untouched by the refusal.
    expect(server.sim.ctx.freeholds.get(key)).toMatchObject({ tier: 'inn_room', rev: 0 });
  });

  it('a dark realm refuses freehold_enter at dispatch with requester feedback and no claim or record', () => {
    const server = darkServer();
    const refusals = recordingRefusalSink();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4502, 450201, 'Ari');
    const key = 'account:4502';
    // D85: a dark Sim seeds no housing record at join (nothing to evict, and
    // nothing a lit-then-dark flip could resurrect).
    expect(server.sim.ctx.freeholds.size).toBe(0);
    // The stamp itself is unconditional (server authority is not a flag).
    expect(server.sim.meta(s.pid)?.freeholdOwnerKey).toBe(key);
    const target = vi.spyOn(server.sim, 'freeholdEnter');
    const p = entityOf(server, s.pid);
    const before = { ...p.pos };
    server.sim.drainEvents();
    // Everything the socket received so far is join traffic (hello, the
    // realm-entry log line); only what arrives AFTER this mark is the
    // refusal's doing.
    const sentBefore = fc.sent.length;

    enter(server, s, 31);
    enter(server, s);

    expect(target).not.toHaveBeenCalled();
    // Both frames receive requester-only feedback; only the rid frame gets an ack.
    const denied = {
      t: 'events',
      list: [{ type: 'freeholdDenied', pid: s.pid, reason: 'no_freehold' }],
    };
    expect(fc.sent.slice(sentBefore)).toEqual([
      denied,
      { t: 'commandOutcome', rid: 31, ok: false },
      denied,
    ]);
    expect(refusals.count()).toBe(2);
    expect(p.pos).toEqual(before);
    expect(claimsFor(server, key)).toEqual([]);
    expect(server.sim.instances.filter((i) => i.partyKey !== null)).toEqual([]);
    expect(server.sim.drainEvents()).toEqual([]);
    expect(server.sim.ctx.freeholds.size).toBe(0);
  });

  it('a frame carrying ownerKey, freeholdOwnerKey or accountId fields still resolves the session account', () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4601, 460101, 'Ari');
    const key = 'account:4601';
    approachGate(server, s);
    send(server, s, {
      cmd: 'freehold_enter',
      ownerKey: 'account:999',
      freeholdOwnerKey: 'account:999',
      accountId: 999,
      characterId: 999,
      pid: 999,
    });
    const inst = claimFor(server, key);
    expect(inst.partyKey).toBe(key);
    expect(claimsFor(server, 'account:999')).toEqual([]);
    expect(server.sim.ctx.freeholds.has('account:999')).toBe(false);
    expect(server.sim.meta(s.pid)?.freeholdOwnerKey).toBe(key);
    expect(server.sim.instanceInfoAt(entityOf(server, s.pid).pos)).toEqual({
      slot: inst.slot,
      dungeonId: 'freehold_inn_room',
    });
  });
});

describe('freehold claim online: leaving', () => {
  it('freehold_leave sets the player down outside the gate and frees nothing until the reaper', () => {
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4701, 470101, 'Ari');
    const key = 'account:4701';
    enter(server, s);
    const inst = claimFor(server, key);
    const p = entityOf(server, s.pid);
    server.sim.drainEvents();

    leave(server, s);

    expect(p.pos.x).toBeCloseTo(GATE_DROP.x, 5);
    expect(p.pos.z).toBeCloseTo(GATE_DROP.z, 5);
    expect(server.sim.instanceSlotAt(p.pos)).toBeNull();
    // The def's leave line rode out to this pid: the exit reached the sim.
    // Read from the def; the literal is pinned in tests/freehold_dungeon_defs.test.ts.
    expect(server.sim.drainEvents()).toContainEqual(
      expect.objectContaining({
        type: 'log',
        text: DUNGEONS.freehold_inn_room.leaveText,
        pid: s.pid,
      }),
    );
    // The claim is still the owner's: leaving starts the ordinary countdown,
    // it does not free.
    expect(inst.partyKey).toBe(key);
    expect(claimFor(server, key)).toBe(inst);

    // The reaper, run past the empty timeout with the room empty, frees it.
    inst.emptyFor = INSTANCE_EMPTY_TIMEOUT - 1;
    runReaper(server);
    expect(inst.partyKey).toBeNull();
    expect(claimsFor(server, key)).toEqual([]);
  });
});

describe('freehold claim online: the /dev freehold <tier> server path (D24, D81)', () => {
  it('with ALLOW_DEV_COMMANDS=1 the chat sets the record tier and the next enter lands in the Cottage band', () => {
    process.env.ALLOW_DEV_COMMANDS = '1';
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4801, 480101, 'Ari');
    const key = 'account:4801';
    expect(server.sim.ctx.freeholds.get(key)?.tier).toBe('inn_room');

    send(server, s, { cmd: 'chat', text: '/dev freehold cottage' });

    expect(server.sim.ctx.freeholds.get(key)?.tier).toBe('cottage');
    enter(server, s);
    const inst = claimFor(server, key);
    expect(inst.dungeonId).toBe('freehold_cottage');
    const p = entityOf(server, s.pid);
    expectInBand(p.pos.x, COTTAGE_BAND);
    expect(server.sim.instanceInfoAt(p.pos)).toEqual({
      slot: inst.slot,
      dungeonId: 'freehold_cottage',
    });
  });

  it('with ALLOW_DEV_COMMANDS unset the same chat leaves the tier inn_room and the enter lands in the Inn Room band', () => {
    delete process.env.ALLOW_DEV_COMMANDS;
    const server = litServer();
    const fc = fakeWs();
    const s = joinAs(server, fc, 4802, 480201, 'Ari');
    const key = 'account:4802';

    send(server, s, { cmd: 'chat', text: '/dev freehold cottage' });

    // The refusal rides the ERROR channel to this session, never a `[dev]`
    // log line: with the realm's /dev gate shut the chat router never reaches
    // the freehold arm, and its unknown-command answer is a ctx.error. Route
    // this tick's events as the world loop does to read it.
    const events = server.sim.tick();
    (server as unknown as { routeEvents(e: unknown[]): void }).routeEvents(events);
    const list = fc.sent.filter((m) => m.t === 'events').flatMap((m) => m.list ?? []);
    expect(list).toContainEqual(
      expect.objectContaining({
        type: 'error',
        text: 'Unknown command: /dev. Type /help for a list.',
      }),
    );
    expect(list.filter((ev) => ev.type === 'log' && String(ev.text).startsWith('[dev]'))).toEqual(
      [],
    );
    // The record is untouched: not only the tier but the revision, which a
    // grant that ran and wrote inn_room again would have bumped.
    expect(server.sim.ctx.freeholds.get(key)).toMatchObject({ tier: 'inn_room', rev: 0 });
    enter(server, s);
    const inst = claimFor(server, key);
    expect(inst.dungeonId).toBe('freehold_inn_room');
    expectInBand(entityOf(server, s.pid).pos.x, INN_ROOM_BAND);
    expect(claimsFor(server, key)).toHaveLength(1);
  });
});

describe.each(['inn_room', 'cottage'] as const)('online %s occupied arrival', (tier) => {
  it.each(['gate', 'key'] as const)(
    '%s dispatch preserves the first occupant and deterministically separates an alt',
    (surface) => {
      function replay() {
        const server = litServer();
        // This dependency proves dispatch behavior only, never durable authority.
        server.sim.cfg.freeholdKeyAdmission = () => true;
        server.sim.cfg.lockoutNowMs = () => 9000;
        const a = joinAs(server, fakeWs(), 4811, 481101, 'First', { isGm: true });
        const b = joinAs(server, fakeWs(), 4811, 481102, 'Second', { isGm: true });
        setFreeholdTier(server.sim.ctx, 'account:4811', tier);
        server.sim.addItem('hearth_key', 1, b.pid);
        const draws = vi.fn();
        server.sim.rng.setObserver(draws);
        enter(server, a);
        const first = entityOf(server, a.pid);
        const claim = claimFor(server, 'account:4811');
        const origin = instanceOrigin(DUNGEONS[claim.dungeonId].index, claim.slot);
        expect(first.pos).toEqual(server.sim.groundPos(origin.x, origin.z - 4));
        const before = structuredClone(first);
        if (surface === 'gate') enter(server, b);
        else send(server, b, { cmd: 'use', item: 'hearth_key', ownerKey: 'account:untrusted' });
        const second = entityOf(server, b.pid);
        expect(server.sim.ctx.instanceClaimIdAt(second.pos)).toBe(claim.exitId);
        expect(
          Math.hypot(first.pos.x - second.pos.x, first.pos.z - second.pos.z),
        ).toBeGreaterThanOrEqual(1);
        expect(Math.abs(second.pos.x - origin.x)).toBeLessThanOrEqual(1);
        expect(second.pos.z - origin.z).toBeGreaterThanOrEqual(-4);
        expect(second.pos.z - origin.z).toBeLessThanOrEqual(tier === 'inn_room' ? 5.5 : 9.5);
        expect(isBlocked(server.sim.cfg.seed, second.pos.x, second.pos.z, 0.5)).toBe(false);
        expect(second.facing).toBe(0);
        expect(first).toEqual(before);
        expect(server.sim.countItem('hearth_key', b.pid)).toBe(1);
        expect(server.sim.freeholdKeyReadyAtMs.get('account:4811')).toBe(
          surface === 'key' ? 3609000 : undefined,
        );
        expect(draws).not.toHaveBeenCalled();
        return { pos: second.pos, facing: second.facing, seq: second.dungeonEntrySeq };
      }
      expect(replay()).toEqual(replay());
    },
  );

  it.each(['gate', 'key'] as const)(
    '%s dispatch refuses a saturated owned room without moving occupants or spending the key clock',
    (surface) => {
      const server = litServer();
      server.sim.cfg.freeholdKeyAdmission = () => true;
      server.sim.cfg.lockoutNowMs = () => 9000;
      const a = joinAs(server, fakeWs(), 4812, 481201, 'First', { isGm: true });
      const b = joinAs(server, fakeWs(), 4812, 481202, 'Second', { isGm: true });
      setFreeholdTier(server.sim.ctx, 'account:4812', tier);
      enter(server, a);
      server.sim.addItem('hearth_key', 1, b.pid);
      const claim = claimFor(server, 'account:4812');
      const origin = instanceOrigin(DUNGEONS[claim.dungeonId].index, claim.slot);
      for (let x = -1; x <= 1; x++) {
        for (let z = -5.5; z <= (tier === 'inn_room' ? 5.5 : 9.5); z++) {
          const id = server.sim.addPlayer('warrior', `Blocker${x}/${z}`);
          const blocker = entityOf(server, id);
          blocker.pos = server.sim.groundPos(origin.x + x, origin.z + z);
          blocker.prevPos = { ...blocker.pos };
          server.sim.ctx.rebucket(blocker);
        }
      }
      approachGate(server, b);
      server.sim.freeholdKeyReadyAtMs.set('account:4812', 8999);
      server.sim.drainEvents();
      const state = () =>
        structuredClone({
          players: [...server.sim.players.keys()].map((pid) => entityOf(server, pid)),
          inventory: server.sim.meta(b.pid)?.inventory,
          claims: server.sim.instances,
          records: [...server.sim.freeholds],
          clocks: [...server.sim.freeholdKeyReadyAtMs],
          nextId: server.sim.nextId,
        });
      const before = state();
      const draws = vi.fn();
      server.sim.rng.setObserver(draws);
      send(
        server,
        b,
        surface === 'gate' ? { cmd: 'freehold_enter' } : { cmd: 'use', item: 'hearth_key' },
      );
      expect(server.sim.drainEvents()).toEqual([
        { type: 'freeholdDenied', pid: b.pid, reason: 'busy' },
      ]);
      expect(state()).toEqual(before);
      expect(draws).not.toHaveBeenCalled();
    },
  );
});

describe('remote-key shared-account clock through real server dispatch', () => {
  it('shares physical claim and isolated key deadline across alts while another account stays independent', () => {
    const server = litServer();
    // Explicit test participant, never claimed as durable production authority.
    const participant = vi.fn(() => true);
    server.sim.cfg.freeholdKeyAdmission = participant;
    server.sim.cfg.lockoutNowMs = () => 9000;
    const a = joinAs(server, fakeWs(), 4801, 480101, 'SharedA', { isGm: true });
    const b = joinAs(server, fakeWs(), 4801, 480102, 'SharedB', { isGm: true });
    const c = joinAs(server, fakeWs(), 4802, 480201, 'Independent', { isGm: true });
    enter(server, a);
    enter(server, b);
    enter(server, c);
    const shared = claimFor(server, 'account:4801');
    expect(server.sim.ctx.instanceClaimIdAt(entityOf(server, a.pid).pos)).toBe(shared.exitId);
    expect(server.sim.ctx.instanceClaimIdAt(entityOf(server, b.pid).pos)).toBe(shared.exitId);
    expect(claimFor(server, 'account:4802').exitId).not.toBe(shared.exitId);
    for (const session of [a, b, c]) {
      expect(server.sim.countItem('hearth_key', session.pid)).toBe(1);
      leave(server, session);
    }
    server.sim.drainEvents();
    send(server, a, { cmd: 'use', item: 'hearth_key', ownerKey: 'account:4802' });
    expect(server.sim.ctx.instanceClaimIdAt(entityOf(server, a.pid).pos)).toBe(shared.exitId);
    const secondPosition = { ...entityOf(server, b.pid).pos };
    const before = [...server.sim.freeholdKeyReadyAtMs];
    server.sim.drainEvents();
    const draws = vi.fn();
    server.sim.rng.setObserver(draws);
    send(server, b, { cmd: 'use', item: 'hearth_key', ownerKey: 'account:4802' });
    expect(server.sim.drainEvents()).toEqual([
      { type: 'freeholdDenied', pid: b.pid, reason: 'cooldown' },
    ]);
    expect(entityOf(server, b.pid).pos).toEqual(secondPosition);
    expect([...server.sim.freeholdKeyReadyAtMs]).toEqual(before);
    expect(draws).not.toHaveBeenCalled();
    server.sim.rng.setObserver(null);
    send(server, c, { cmd: 'use', item: 'hearth_key', ownerKey: 'account:4801' });
    expect(server.sim.ctx.instanceClaimIdAt(entityOf(server, c.pid).pos)).toBe(
      claimFor(server, 'account:4802').exitId,
    );
    expect([...server.sim.freeholdKeyReadyAtMs]).toEqual([
      ['account:4801', 3609000],
      ['account:4802', 3609000],
    ]);
    expect(participant.mock.calls).toEqual([
      ['account:4801', a.pid],
      ['account:4801', b.pid],
      ['account:4802', c.pid],
    ]);
  });
});
