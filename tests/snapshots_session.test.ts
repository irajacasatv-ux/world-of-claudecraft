// Session and social wire: raid party, dungeon difficulty, the restart countdown,
// online movement input lifetime, chat moderation, legendary celebration events,
// autosaves and /who. Split out of tests/snapshots.test.ts on 2026-09-27.

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the db layer so no Postgres is needed; snapshot logic is under test.
vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());

import { createBackgroundDbGate } from '../server/background_db_gate';
import {
  saveCharacterAndGuildBankState,
  saveCharacterAndMarketState,
  saveCharacterState,
  saveMailPartitions,
  saveMailState,
  saveMarketState,
} from '../server/db';
import { type ClientSession, GameServer } from '../server/game';
import { KeyedSerialWriteAborted } from '../server/serial_writer';
import { DT } from '../src/sim/types';
import {
  bareClient,
  broadcast,
  type FakeClient,
  fakeWs,
  joinServer,
  lastSnap,
} from './helpers/bare_client';

function eventTexts(sent: any[]): string[] {
  return sent
    .flatMap((msg) => (msg.t === 'events' ? msg.list : []))
    .filter((ev) => ev.type === 'log' || ev.type === 'error')
    .map((ev) => ev.text);
}

describe('raid party wire', () => {
  let server: GameServer;
  let fcLeader: FakeClient;
  let leader: ClientSession;
  let fcMember: FakeClient;
  let member: ClientSession;

  beforeEach(() => {
    server = new GameServer();
    fcLeader = fakeWs();
    leader = joinServer(server, fcLeader, 1, 'Leada');
    fcMember = fakeWs();
    member = joinServer(server, fcMember, 2, 'Memba');
    // Form a party, then mark it a raid and split into two subgroups. The
    // convert-to-raid command gates on a full five-player party, so we set the
    // raid state directly: this test pins the WIRE serialization, not that gate.
    const sim = server.sim;
    sim.partyInvite(member.pid, leader.pid);
    sim.partyAccept(member.pid);
    const party = (sim as any).partyOf(leader.pid);
    party.raid = true;
    party.raidGroups.set(member.pid, 2);
  });

  it('self.party wire carries the raid flag and per-member subgroup', () => {
    broadcast(server);
    const snap = lastSnap(fcLeader.sent);
    expect(snap.self.party).not.toBeNull();
    // The raid flag must survive the wire so the HUD renders the raid roster.
    expect(snap.self.party.raid).toBe(true);
    // Every member must carry its subgroup so the social panel can bucket them.
    for (const m of snap.self.party.members) {
      expect(m, `member ${m.pid} missing group`).toHaveProperty('group');
    }
    const memberGroup = snap.self.party.members.find((m: any) => m.pid === member.pid)?.group;
    expect(memberGroup).toBe(2);
  });

  it('online ClientWorld mirrors raid roster from the wire', () => {
    broadcast(server);
    const snap = lastSnap(fcLeader.sent);
    const client = bareClient(leader.pid);
    (client as any).applySnapshot(snap);
    expect(client.partyInfo).not.toBeNull();
    expect(client.partyInfo?.raid).toBe(true);
    expect(client.partyInfo?.members.find((m) => m.pid === member.pid)?.group).toBe(2);
  });

  it('ships tactical frame fields and the authoritative connection state', () => {
    const entity = server.sim.entities.get(member.pid)!;
    const meta = server.sim.meta(member.pid)!;
    meta.talentMods.role = 'healer';
    entity.auras.push({
      id: 'power_word_shield',
      name: 'Psalm of Warding',
      kind: 'absorb',
      remaining: 6,
      duration: 12,
      value: 90,
      sourceId: member.pid,
      school: 'holy',
    });
    member.linkdead = true;

    broadcast(server);
    const snap = lastSnap(fcLeader.sent);
    const wired = snap.self.party.members.find((m: any) => m.pid === member.pid);
    expect(wired).toMatchObject({ absorb: 90, role: 'healer', connected: 0 });
    expect(wired.auras).toEqual([{ id: 'power_word_shield', kind: 'absorb', remaining: 6 }]);

    const client = bareClient(leader.pid);
    (client as any).applySnapshot(snap);
    expect(client.partyInfo?.members.find((m) => m.pid === member.pid)).toMatchObject({
      absorb: 90,
      role: 'healer',
      connected: 0,
    });
  });

  it('wires a Wildfang druid in Wolf Form as damage so role-sorted raid frames keep the tanks adjacent', () => {
    const entity = server.sim.entities.get(member.pid)!;
    const meta = server.sim.meta(member.pid)!;
    meta.cls = 'druid';
    meta.talentMods.role = 'tank';
    entity.auras.push({
      id: 'cat_form',
      name: 'Wolf Form',
      kind: 'form_cat',
      remaining: 999,
      duration: 999,
      value: 1,
      sourceId: member.pid,
      school: 'physical',
    });

    broadcast(server);
    const wolf = lastSnap(fcLeader.sent).self.party.members.find((m: any) => m.pid === member.pid);
    expect(wolf.role).toBe('dps');

    entity.auras.length = 0;
    broadcast(server);
    const caster = lastSnap(fcLeader.sent).self.party.members.find(
      (m: any) => m.pid === member.pid,
    );
    expect(caster.role).toBe('tank');
  });

  it('projects common party member history once per broadcast and refreshes same-tick broadcasts', () => {
    const server = new GameServer();
    const leaderClient = fakeWs();
    const leader = joinServer(server, leaderClient, 11, 'Leader');
    const memberClient = fakeWs();
    const member = joinServer(server, memberClient, 22, 'Member');
    const thirdClient = fakeWs();
    const third = joinServer(server, thirdClient, 33, 'Third');
    server.sim.partyInvite(member.pid, leader.pid);
    server.sim.partyAccept(member.pid);
    server.sim.partyInvite(third.pid, leader.pid);
    server.sim.partyAccept(third.pid);

    let historyReads = 0;
    for (const pid of [leader.pid, member.pid, third.pid]) {
      const entity = server.sim.entities.get(pid)!;
      let history = [{ tick: server.sim.tickCount, amount: 10 }];
      Object.defineProperty(entity, 'damageHistory', {
        configurable: true,
        get: () => {
          historyReads++;
          return history;
        },
        set: (next) => {
          history = next ?? [];
        },
      });
    }

    broadcast(server);
    expect(historyReads).toBe(3);

    const memberEntity = server.sim.entities.get(member.pid)!;
    memberEntity.hp = 777;
    broadcast(server);
    expect(historyReads).toBe(6);
    const memberRow = lastSnap(leaderClient.sent).self.party.members.find(
      (row: any) => row.pid === member.pid,
    );
    expect(memberRow.hp).toBe(777);
  });

  it('uses the observed player as the Echo viewer for a spectator party snapshot', () => {
    const moderatorClient = fakeWs();
    const moderator = joinServer(server, moderatorClient, 3, 'Modera');
    const target = server.sim.entities.get(member.pid)!;
    target.auras.push(
      {
        id: 'temporal_echo',
        name: 'Temporal Echo',
        kind: 'temporal_echo',
        remaining: 11.1,
        duration: 15,
        value: 0,
        sourceId: leader.pid,
        school: 'arcane',
      },
      {
        id: 'temporal_echo',
        name: 'Temporal Echo',
        kind: 'temporal_echo',
        remaining: 22.1,
        duration: 15,
        value: 0,
        sourceId: member.pid,
        school: 'arcane',
      },
    );
    (server as any).enterSpectate(moderator, leader);

    broadcast(server);

    const echoAurasFor = (client: FakeClient) => {
      const memberRow = lastSnap(client.sent).self.party.members.find(
        (row: any) => row.pid === member.pid,
      );
      return memberRow.auras.filter((row: any) => row.kind === 'temporal_echo');
    };
    expect(echoAurasFor(fcLeader)).toEqual([
      { id: 'temporal_echo', kind: 'temporal_echo', remaining: 12 },
    ]);
    expect(echoAurasFor(fcMember)).toEqual([
      { id: 'temporal_echo', kind: 'temporal_echo', remaining: 23 },
    ]);
    expect(echoAurasFor(moderatorClient)).toEqual([
      { id: 'temporal_echo', kind: 'temporal_echo', remaining: 12 },
    ]);
  });
});

describe('dungeon difficulty wire', () => {
  it('ships the selected dungeon difficulty and ClientWorld mirrors it', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Hero');
    server.sim.setDungeonDifficulty('heroic', session.pid);

    broadcast(server);

    const snap = lastSnap(fc.sent);
    expect(snap.self.ddiff).toBe('heroic');
    const client = bareClient(session.pid);
    (client as any).applySnapshot(snap);
    expect(client.dungeonDifficulty()).toBe('heroic');
  });

  it('dispatches set_dungeon_difficulty through the wire and rejects invalid values', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Hero');

    const send = (difficulty: unknown) =>
      server.handleMessage(
        session,
        JSON.stringify({ t: 'cmd', cmd: 'set_dungeon_difficulty', difficulty }),
      );

    send('heroic');
    expect(server.sim.dungeonDifficulty(session.pid)).toBe('heroic');

    // isDungeonDifficulty guards the dispatch arm: junk values change nothing.
    send('mythic');
    expect(server.sim.dungeonDifficulty(session.pid)).toBe('heroic');
    send(7);
    expect(server.sim.dungeonDifficulty(session.pid)).toBe('heroic');
    send(undefined);
    expect(server.sim.dungeonDifficulty(session.pid)).toBe('heroic');

    send('normal');
    expect(server.sim.dungeonDifficulty(session.pid)).toBe('normal');
  });

  it('dispatches heroic_buy through the wire and validates the itemId', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Hero');
    const send = (itemId: unknown) =>
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'heroic_buy', itemId }));

    // Junk payloads never reach the sim handler (typeof string guard).
    send(7);
    send(undefined);
    // A valid string flows through; far from the quartermaster the sim refuses
    // with an error event rather than granting anything.
    send('seal_of_the_nine_oaths');
    expect(server.sim.countItem('seal_of_the_nine_oaths', session.pid)).toBe(0);
  });
});

describe('restart countdown', () => {
  const restartMessages = [
    'Server restart in 10 minutes.',
    'Server restart in 5 minutes.',
    'Server restart in 2 minutes.',
    'Server restart in 1 minute.',
    'Server restart in 30 seconds.',
    'Server restart in 10 seconds.',
    'Server restarting now.',
  ];

  it('broadcasts the restart countdown to every connected player', () => {
    vi.useFakeTimers();
    try {
      const server = new GameServer();
      const alice = fakeWs();
      const bob = fakeWs();
      joinServer(server, alice, 1, 'Alice');
      joinServer(server, bob, 2, 'Bob', 'mage');
      alice.sent.length = 0;
      bob.sent.length = 0;

      const result = server.startRestartCountdown();

      expect(result.started).toBe(true);
      expect(eventTexts(alice.sent)).toEqual(['Server restart in 10 minutes.']);
      expect(eventTexts(bob.sent)).toEqual(['Server restart in 10 minutes.']);

      vi.advanceTimersByTime(5 * 60_000);
      expect(eventTexts(alice.sent)).toEqual(restartMessages.slice(0, 2));

      vi.advanceTimersByTime(3 * 60_000);
      expect(eventTexts(alice.sent)).toEqual(restartMessages.slice(0, 3));

      vi.advanceTimersByTime(60_000);
      expect(eventTexts(alice.sent)).toEqual(restartMessages.slice(0, 4));

      vi.advanceTimersByTime(30_000);
      expect(eventTexts(alice.sent)).toEqual(restartMessages.slice(0, 5));

      vi.advanceTimersByTime(20_000);
      expect(eventTexts(alice.sent)).toEqual(restartMessages.slice(0, 6));

      vi.advanceTimersByTime(10_000);
      expect(eventTexts(alice.sent)).toEqual(restartMessages);
      expect(eventTexts(bob.sent)).toEqual(restartMessages);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a duplicate countdown until the active one completes', () => {
    vi.useFakeTimers();
    try {
      const server = new GameServer();
      const fc = fakeWs();
      joinServer(server, fc, 1, 'Alice');
      fc.sent.length = 0;

      expect(server.startRestartCountdown().started).toBe(true);
      const duplicate = server.startRestartCountdown();
      expect(duplicate.started).toBe(false);
      expect(duplicate.active).toBe(true);

      vi.advanceTimersByTime(10 * 60_000);
      expect(server.startRestartCountdown().started).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('online movement input lifetime', () => {
  it('clears stale held movement when the websocket input stream goes quiet', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Spinner');

    server.handleMessage(
      session,
      JSON.stringify({
        t: 'input',
        seq: 1,
        mi: { f: 0, b: 0, tl: 1, tr: 0, sl: 0, sr: 0, j: 0, dv: 0, sf: 0 },
      }),
    );
    const meta = server.sim.meta(session.pid)!;
    expect(meta.moveInput.turnLeft).toBe(true);

    for (let i = 0; i < Math.floor(0.5 / DT); i++) server.sim.tick();
    (server as any).clearStaleInputs();
    expect(meta.moveInput.turnLeft).toBe(true);

    for (let i = 0; i < Math.ceil(0.35 / DT); i++) server.sim.tick();
    (server as any).clearStaleInputs();
    expect(meta.moveInput.turnLeft).toBe(false);
  });
});

describe('chat moderation', () => {
  it('rate-limits chat bursts per connected client before cooldown', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Testa');
    fc.sent.length = 0;

    for (let i = 0; i < 6; i++) {
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'chat', text: `msg ${i}` }));
    }
    (server as any).routeEvents(server.sim.tick());

    const events = fc.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(events.filter((ev) => ev.type === 'chat')).toHaveLength(5);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'error',
        text: 'You are sending messages too quickly. Slow down.',
      }),
    );
  });

  it('locks chat for 20 seconds after repeated over-limit messages', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Testa');
    fc.sent.length = 0;

    for (let i = 0; i < 8; i++) {
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'chat', text: `msg ${i}` }));
    }
    (server as any).routeEvents(server.sim.tick());

    const events = fc.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(events.filter((ev) => ev.type === 'chat')).toHaveLength(5);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'error',
        text: 'Chat locked for 20s because you are sending messages too quickly.',
      }),
    );
  });

  it('blocks hard-word (slur) messages and escalates warning -> mute', () => {
    const server = new GameServer();
    server.chatFilter.load({
      soft: [],
      hard: ['slurword'],
      config: { warningsBeforeMute: 1, muteLadderSeconds: [600] },
    });
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Testa');

    // First offense: blocked entirely + warning; it never becomes a chat event.
    fc.sent.length = 0;
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'chat', text: 'you are a slurword' }),
    );
    (server as any).routeEvents(server.sim.tick());
    let events = fc.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(events.some((ev) => ev.type === 'chat')).toBe(false);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('Warning'),
      }),
    );

    // Second offense: escalates to a timed mute.
    fc.sent.length = 0;
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'chat', text: 'slurword strikes again' }),
    );
    events = fc.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('muted'),
      }),
    );

    // Now muted: even a clean message is dropped until the mute expires.
    fc.sent.length = 0;
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'chat', text: 'hello everyone' }),
    );
    (server as any).routeEvents(server.sim.tick());
    events = fc.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(events.some((ev) => ev.type === 'chat')).toBe(false);
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'error',
        text: expect.stringContaining('muted'),
      }),
    );
  });

  it('leaves soft (cosmetic) words untouched server-side: clients mask them', () => {
    const server = new GameServer();
    server.chatFilter.load({
      soft: ['darn'],
      hard: [],
      config: { warningsBeforeMute: 1, muteLadderSeconds: [600] },
    });
    const fc = fakeWs();
    const session = joinServer(server, fc, 1, 'Testa');
    fc.sent.length = 0;
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'chat', text: 'oh darn it' }));
    (server as any).routeEvents(server.sim.tick());
    const events = fc.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(events).toContainEqual(expect.objectContaining({ type: 'chat', text: 'oh darn it' }));
  });

  it('ships the soft word list to clients in the hello payload', () => {
    const server = new GameServer();
    server.chatFilter.load({
      soft: ['darn', 'heck'],
      hard: ['slurword'],
      config: { warningsBeforeMute: 1, muteLadderSeconds: [600] },
    });
    const fc = fakeWs();
    joinServer(server, fc, 1, 'Testa');
    const hello = fc.sent.find((msg) => msg.t === 'hello');
    expect(hello.softWords).toEqual(['darn', 'heck']);
    // Hard words are enforcement-only and must never be shipped to the client.
    expect(JSON.stringify(hello)).not.toContain('slurword');
  });
});

describe('legendary celebration events reach the client (phase 13)', () => {
  // End-to-end pass-through pin: the two orange-promotion celebration events
  // ride the generic pid-scoped fan-out (routeEvents), so ONE arm proves both
  // reach the recipient session's events frame, and pid-scoping keeps another
  // session from receiving a copy addressed elsewhere.
  it('legendaryForged and legendaryForgedZone route to their pid, and only their pid', () => {
    const server = new GameServer();
    const fcOwner = fakeWs();
    const owner = joinServer(server, fcOwner, 1, 'Forger');
    const fcOnlooker = fakeWs();
    const onlooker = joinServer(server, fcOnlooker, 2, 'Onlooker');
    fcOwner.sent.length = 0;
    fcOnlooker.sent.length = 0;
    const zoneCopy = (pid: number) => ({
      type: 'legendaryForgedZone' as const,
      pid,
      ownerPid: owner.pid as number,
      ownerName: 'Forger',
      itemId: 'wyrmfall_pendant',
      itemName: 'Dawnbreaker',
      zoneId: 'eastbrook_vale',
    });
    (server as any).routeEvents([
      {
        type: 'legendaryForged',
        itemId: 'wyrmfall_pendant',
        name: 'Dawnbreaker',
        owner: owner.pid as number,
        pid: owner.pid as number,
      },
      zoneCopy(owner.pid as number),
      zoneCopy(onlooker.pid as number),
    ]);
    const typesFor = (sent: any[]) =>
      sent.flatMap((msg) => (msg.t === 'events' ? msg.list : [])).map((ev: any) => ev.type);
    // The owner's frame carries the personal event AND their own zone copy.
    expect(typesFor(fcOwner.sent)).toEqual(['legendaryForged', 'legendaryForgedZone']);
    const ownerEvents = fcOwner.sent.flatMap((msg) => (msg.t === 'events' ? msg.list : []));
    expect(ownerEvents[0]).toMatchObject({ name: 'Dawnbreaker', itemId: 'wyrmfall_pendant' });
    expect(ownerEvents[1]).toMatchObject({ itemName: 'Dawnbreaker', ownerName: 'Forger' });
    // The onlooker gets exactly their own zone copy: the personal event and
    // the owner-addressed zone copy never cross sessions.
    expect(typesFor(fcOnlooker.sent)).toEqual(['legendaryForgedZone']);
  });
});

describe('autosaves', () => {
  beforeEach(() => {
    vi.mocked(saveCharacterState).mockReset();
    vi.mocked(saveCharacterState).mockResolvedValue(true);
    vi.mocked(saveCharacterAndGuildBankState).mockReset();
    vi.mocked(saveCharacterAndGuildBankState).mockResolvedValue(true);
    vi.mocked(saveCharacterAndMarketState).mockReset();
    vi.mocked(saveCharacterAndMarketState).mockResolvedValue(true);
    vi.mocked(saveMarketState).mockReset();
    vi.mocked(saveMarketState).mockResolvedValue();
    vi.mocked(saveMailState).mockReset();
    vi.mocked(saveMailState).mockResolvedValue();
    vi.mocked(saveMailPartitions).mockReset();
    vi.mocked(saveMailPartitions).mockResolvedValue();
  });

  it('skips overlapping saveAll runs while saving each current session once', async () => {
    const server = new GameServer();
    joinServer(server, fakeWs(), 1, 'Testa');
    joinServer(server, fakeWs(), 2, 'Testb');
    joinServer(server, fakeWs(), 3, 'Testc');

    let resolveFirstSave!: () => void;
    const firstSave = new Promise<void>((resolve) => {
      resolveFirstSave = resolve;
    });
    vi.mocked(saveCharacterState).mockImplementationOnce(() => firstSave.then(() => true));

    const firstRun = server.saveAll('test');
    await vi.waitFor(() => {
      expect(saveCharacterState).toHaveBeenCalledTimes(3);
    });

    await server.saveAll('test');
    expect(saveCharacterState).toHaveBeenCalledTimes(3);

    resolveFirstSave();
    await firstRun;

    const savedCharacterIds = vi.mocked(saveCharacterState).mock.calls.map((call) => call[0]);
    expect(savedCharacterIds.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('waits for an active autosave before running the shutdown save pass', async () => {
    const server = new GameServer();
    joinServer(server, fakeWs(), 1, 'Testa');
    joinServer(server, fakeWs(), 2, 'Testb');

    let resolveFirstSave!: () => void;
    const firstSave = new Promise<void>((resolve) => {
      resolveFirstSave = resolve;
    });
    vi.mocked(saveCharacterState).mockImplementationOnce(() => firstSave.then(() => true));

    const autosave = server.saveAll('autosave');
    await vi.waitFor(() => {
      expect(saveCharacterState).toHaveBeenCalledTimes(2);
    });

    const shutdown = server.saveAll('shutdown');
    await Promise.resolve();
    expect(saveCharacterState).toHaveBeenCalledTimes(2);

    resolveFirstSave();
    await autosave;
    await shutdown;

    const savedCharacterIds = vi.mocked(saveCharacterState).mock.calls.map((call) => call[0]);
    expect(savedCharacterIds.sort((a, b) => a - b)).toEqual([1, 1, 2, 2]);
  });

  it('holds each character save under the shared major-producer permit', async () => {
    const gate = createBackgroundDbGate(3, 2); // one admitted producer
    const server = new GameServer(undefined, gate);
    joinServer(server, fakeWs(), 1, 'Testa');
    joinServer(server, fakeWs(), 2, 'Testb');
    joinServer(server, fakeWs(), 3, 'Testc');
    let releaseDb!: () => void;
    const dbHold = new Promise<void>((resolve) => {
      releaseDb = resolve;
    });
    vi.mocked(saveCharacterState).mockImplementation(async () => {
      await dbHold;
      return true;
    });

    const saving = server.saveAll('autosave');
    await vi.waitFor(() => {
      expect(saveCharacterState).toHaveBeenCalledTimes(1);
      expect(gate.stats()).toMatchObject({ inFlight: 1, waiting: 2, max: 1 });
    });
    releaseDb();
    await saving;

    expect(saveCharacterState).toHaveBeenCalledTimes(3);
    expect(gate.stats()).toMatchObject({
      inFlight: 0,
      waiting: 0,
      acquired: 3,
    });
  });

  it('joins the character FIFO before taking the shared DB permit', async () => {
    const gate = createBackgroundDbGate(1, 0); // the supported one-lane edge
    const server = new GameServer(undefined, gate);
    const session = joinServer(server, fakeWs(), 1, 'Testa');
    const order: string[] = [];
    let markHeadStarted!: () => void;
    const headStarted = new Promise<void>((resolve) => {
      markHeadStarted = resolve;
    });
    let releaseHead!: () => void;
    const headHold = new Promise<void>((resolve) => {
      releaseHead = resolve;
    });
    const head = server.enqueueCharacterWrite(session.characterId, async () => {
      markHeadStarted();
      await headHold;
    });
    await headStarted;

    // Model the marketplace custody adapter: it already owns the character
    // FIFO before asking for a background permit.
    const custody = server.enqueueCharacterWrite(session.characterId, async () => {
      const permit = await gate.acquire();
      if (!permit) throw new Error('custody permit unexpectedly refused');
      try {
        order.push('custody');
      } finally {
        permit.release();
      }
    });
    vi.mocked(saveCharacterState).mockImplementationOnce(async () => {
      expect(gate.stats().inFlight).toBe(1);
      order.push('autosave');
      return true;
    });
    const autosave = server.saveAll('autosave');
    await Promise.resolve();
    await Promise.resolve();

    // The old permit->FIFO order held this one permit here. Custody was ahead
    // in the same FIFO and waited for it forever, while autosave waited behind
    // custody. No producer may consume the permit until its FIFO turn begins.
    expect(gate.stats()).toMatchObject({ inFlight: 0, waiting: 0, max: 1 });

    releaseHead();
    await Promise.all([head, custody, autosave]);
    expect(order).toEqual(['custody', 'autosave']);
    expect(gate.stats()).toMatchObject({
      inFlight: 0,
      waiting: 0,
      acquired: 2,
    });
  });

  it('a periodic market save joins the market FIFO before taking the shared DB permit', async () => {
    // Historical deadlock this guards against: the old permit->FIFO order let
    // a market write hold the sole DB permit while it was still waiting for
    // its OWN turn in the market FIFO behind another entry that also needed
    // that permit to proceed. Joining the FIFO first, then taking the permit
    // once it is actually this write's turn, makes that circular wait
    // impossible. `saveMarket`/`saveMail`/`saveRifts` all ride
    // `enqueueBackgroundMarketWrite`, which does exactly that.
    const gate = createBackgroundDbGate(1, 0); // the supported one-lane edge
    const server = new GameServer(undefined, gate);

    let releaseHead!: () => void;
    const headHold = new Promise<void>((resolve) => {
      releaseHead = resolve;
    });
    const head = (server as any).enqueueMarketWrite(async () => headHold) as Promise<void>;
    vi.mocked(saveMarketState).mockImplementationOnce(async () => {
      expect(gate.stats().inFlight).toBe(1);
    });

    const marketSave = server.saveMarket();
    await Promise.resolve();
    await Promise.resolve();
    // Queued behind `head` on the FIFO: it must not have taken the permit yet.
    expect(gate.stats()).toMatchObject({ inFlight: 0, waiting: 0, max: 1 });

    releaseHead();
    await Promise.all([head, marketSave]);
    expect(saveMarketState).toHaveBeenCalledTimes(1);
    expect(gate.stats()).toMatchObject({ inFlight: 0, waiting: 0, acquired: 1 });
  });

  it('a guild-book-only autosave no longer waits on the market FIFO', async () => {
    // Direction B (docs/guild-bank/escrow-fix-plan.md section 3.6): book
    // writes are a read-modify-write under a per-guild row lock, commutative
    // and order-independent, so a guild-book-only autosave (opts.withMarket
    // false) no longer needs the shared market writer's commit-order
    // guarantee. server/game.ts saveCharacter now runs that write directly
    // instead of queueing it behind whatever else the market writer is doing
    // (a market/mail autosave, or another guild's dirty-book autosave): the
    // exact compounding stall named as the escalation trigger in
    // server/game.ts's enqueueMarketWrite comment. Before this fix the save
    // below would have hung on the never-released `head` blocker.
    const gate = createBackgroundDbGate(1, 0);
    const server = new GameServer(undefined, gate);
    const session = joinServer(server, fakeWs(), 1, 'Testa');
    const guildId = 913;
    server.sim.loadGuildBank(guildId, {
      treasury: 0,
      inventory: [],
      purchasedSlots: 0,
    });
    session.dirtyGuildBanks.set(guildId, 1);

    let releaseHead!: () => void;
    const headHold = new Promise<void>((resolve) => {
      releaseHead = resolve;
    });
    const head = (server as any).enqueueMarketWrite(async () => headHold) as Promise<void>;
    vi.mocked(saveCharacterAndGuildBankState).mockImplementationOnce(async () => true);

    await server.saveAll('autosave');
    expect(saveCharacterAndGuildBankState).toHaveBeenCalledTimes(1);

    releaseHead();
    await head;
  });

  it('gates WOC dirty-book preflush and mail persistence at their innermost DB calls', async () => {
    const gate = createBackgroundDbGate(1, 0);
    const server = new GameServer(undefined, gate);
    const session = joinServer(server, fakeWs(), 1, 'Testa');
    const guildId = 914;
    server.sim.loadGuildBank(guildId, {
      treasury: 0,
      inventory: [],
      purchasedSlots: 0,
    });
    session.dirtyGuildBanks.set(guildId, 1);
    vi.mocked(saveCharacterAndGuildBankState).mockImplementationOnce(async () => {
      expect(gate.stats().inFlight).toBe(1);
      return true;
    });
    // Mail persistence rides the partitioned writer (#3561); a freshly joined
    // character already has dirty welcome-letter partitions, so the innermost
    // DB call still fires and can assert the permit is held.
    vi.mocked(saveMailPartitions).mockImplementationOnce(async () => {
      expect(gate.stats().inFlight).toBe(1);
    });

    await server.flushDirtyGuildBooks(session.characterId);
    await server.persistMailBlob();

    expect(saveCharacterAndGuildBankState).toHaveBeenCalledTimes(1);
    expect(saveMailPartitions).toHaveBeenCalledTimes(1);
    expect(gate.stats()).toMatchObject({
      inFlight: 0,
      waiting: 0,
      acquired: 2,
    });
  });

  it('unlinks a cancelled recovery save before it starts in the character FIFO', async () => {
    const server = new GameServer();
    const session = joinServer(server, fakeWs(), 1, 'Testa');
    vi.mocked(saveCharacterState).mockClear();
    let releaseHead!: () => void;
    const headHold = new Promise<void>((resolve) => {
      releaseHead = resolve;
    });
    const head = server.enqueueCharacterWrite(session.characterId, async () => headHold);
    const controller = new AbortController();
    const cancelled = server.saveCharacter(session, {
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();

    await expect(cancelled).rejects.toBeInstanceOf(KeyedSerialWriteAborted);
    expect(saveCharacterState).not.toHaveBeenCalled();
    releaseHead();
    await head;
  });

  it('unlinks a cancelled recovery save before it starts in the market FIFO', async () => {
    const server = new GameServer();
    const session = joinServer(server, fakeWs(), 1, 'Testa');
    vi.mocked(saveCharacterAndMarketState).mockClear();
    let releaseMarket!: () => void;
    const marketHold = new Promise<void>((resolve) => {
      releaseMarket = resolve;
    });
    const head = (server as any).enqueueMarketWrite(async () => marketHold) as Promise<void>;
    const serialize = vi.spyOn(server.sim, 'serializeCharacter');
    const controller = new AbortController();
    const cancelled = server.saveCharacter(session, {
      withMarket: true,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      // The character FIFO is already running; its synchronous snapshot work
      // completed before it queued behind the held market writer.
      expect(serialize).toHaveBeenCalled();
    });
    controller.abort();

    await expect(cancelled).rejects.toBeInstanceOf(KeyedSerialWriteAborted);
    expect(saveCharacterAndMarketState).not.toHaveBeenCalled();
    releaseMarket();
    await head;
  });
});

describe('/who command', () => {
  it('lists online players with class, level, realm, and zone metadata', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const self = joinServer(server, fc, 1, 'Aleph', 'warrior');
    const fc2 = fakeWs();
    const other = joinServer(server, fc2, 2, 'Bet', 'mage');
    server.sim.setPlayerLevel(7, other.pid);
    fc.sent.length = 0;

    server.handleMessage(self, JSON.stringify({ t: 'cmd', cmd: 'chat', text: '/who' }));

    const text = eventTexts(fc.sent).join('\n');
    expect(text).toContain('Who: 2 players online on Claudemoon.');
    expect(text).toContain('Aleph - level 1 warrior - Eastbrook Vale');
    expect(text).toContain('Bet - level 7 mage - Eastbrook Vale');
  });

  it('hides ignored players and players who ignored the requester', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const self = joinServer(server, fc, 1, 'Aleph');
    const fcIgnored = fakeWs();
    const ignored = joinServer(server, fcIgnored, 2, 'Bet');
    const fcBlocking = fakeWs();
    const blocking = joinServer(server, fcBlocking, 3, 'Gimel');
    self.blockedIds = new Set([ignored.characterId]);
    blocking.blockedIds = new Set([self.characterId]);
    fc.sent.length = 0;

    server.handleMessage(self, JSON.stringify({ t: 'cmd', cmd: 'chat', text: '/who' }));

    const text = eventTexts(fc.sent).join('\n');
    expect(text).toContain('Who: 1 player online on Claudemoon.');
    expect(text).toContain('Aleph - level 1 warrior - Eastbrook Vale');
    expect(text).not.toContain('Bet');
    expect(text).not.toContain('Gimel');
  });

  it('waits for the requester block list before showing online players', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const self = joinServer(server, fc, 1, 'Aleph');
    joinServer(server, fakeWs(), 2, 'Bet');
    self.blockListLoaded = false;
    fc.sent.length = 0;

    server.handleMessage(self, JSON.stringify({ t: 'cmd', cmd: 'chat', text: '/who' }));

    expect(eventTexts(fc.sent)).toContain(
      'Your block list is still loading. Try /who again in a moment.',
    );
  });

  it('omits players whose own block list is still loading', () => {
    const server = new GameServer();
    const fc = fakeWs();
    const self = joinServer(server, fc, 1, 'Aleph');
    const pending = joinServer(server, fakeWs(), 2, 'Bet');
    pending.blockListLoaded = false;
    fc.sent.length = 0;

    server.handleMessage(self, JSON.stringify({ t: 'cmd', cmd: 'chat', text: '/who' }));

    const text = eventTexts(fc.sent).join('\n');
    expect(text).toContain('Who: 1 player online on Claudemoon.');
    expect(text).toContain('Aleph - level 1 warrior - Eastbrook Vale');
    expect(text).not.toContain('Bet');
  });
});
