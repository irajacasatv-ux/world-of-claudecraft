// The housing command chain end to end over the live wire: the frames
// ClientWorld actually emits, fed verbatim into the real GameServer dispatch
// (the tests/farming_command_chain_online.test.ts harness, for the same reason).
//
// WHY THIS FILE EXISTS. tests/freehold_snapshot_wire.test.ts pins the ten
// sender frames as hand-written literals, and tests/server/freehold_wire.test.ts
// pins the dispatch guard's inputs as a SEPARATE hand-written table; nothing
// else feeds a captured client frame into server.handleMessage. A payload key
// renamed on one side reddens only that side's own literal, the type guard
// then silently refuses every real frame, and housing is inert online while
// every offline pin stays green.
//
// So nothing here hand-writes a frame. The client's own send is captured off
// the socket as a raw string and handed to server.handleMessage unchanged: on
// a LIT realm the matching Sim stub is reached once with the guarded args and
// the session pid, and on a DARK realm the same bytes are refused before the
// sim (the drift guard between the sender payloads and the server guards).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the db layer so the live GameServer suite needs no Postgres (the
// vi.mock hoisting caveat applies: this block cannot reference imports).
vi.mock('../server/db', () => ({
  pool: { query: vi.fn(async () => ({ rows: [] })) },
  saveCharacterState: vi.fn(async () => {}),
  loadGuildBankRow: vi.fn(async () => null),
  openPlaySession: vi.fn(async () => 1),
  touchCharacterLogin: vi.fn(async () => {}),
  closePlaySession: vi.fn(async () => {}),
  insertChatLogs: vi.fn(async () => {}),
  walletForAccount: vi.fn(async () => null),
  loadAccountFlair: vi.fn(async () => ({ ai: false, streamer: false, links: {} })),
  markAccountQuestComplete: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  grantAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  setAccountWeaponSkinLoadout: vi.fn(async () => ({
    completedQuestIds: [],
    mechChromaIds: [],
    weaponSkinIds: [],
    weaponSkinLoadout: {},
  })),
}));

import { FREEHOLD_WIRE_COMMANDS } from '../server/freehold_wire';
import { type ClientSession, GameServer } from '../server/game';
import { noopGameMetricsCounters, setGameMetricsCounters } from '../server/http/game_signals';
import { ClientWorld } from '../src/net/online';
import type { PlayerClass } from '../src/sim/types';

const PROBE_CLASS: PlayerClass = 'warrior';

type HousingCommand = (typeof FREEHOLD_WIRE_COMMANDS)[number];

type StubName =
  | 'freeholdEnter'
  | 'freeholdLeave'
  | 'placeFurnishing'
  | 'moveFurnishing'
  | 'removeFurnishing'
  | 'undoPlacement'
  | 'redoPlacement'
  | 'payLedger'
  | 'setVisitPolicy'
  | 'setFreeholdBuildPresence';

interface HousingSender {
  token: HousingCommand;
  /** The IWorldHousing call a HUD will make; its args are what the frame carries. */
  send: (world: ClientWorld) => void;
  /** The frame's EXHAUSTIVE sorted key set: an extra field is as much a
   *  protocol change as a missing one, and a client-supplied authority
   *  value riding along is the exact thing server authority forbids. */
  keys: readonly string[];
  stub: StubName;
  /** The exact args the Sim stub must receive: the guarded payload, then the
   *  session pid LAST (the offline pid convention). The three presence
   *  fields the server guards and then drops (plotId, acceptedTransitionId,
   *  buildPresenceSeq) never reach the stub. */
  args: (pid: number) => unknown[];
}

const SENDERS: readonly HousingSender[] = [
  {
    token: 'freehold_enter',
    send: (w) => w.freeholdEnter(),
    keys: ['cmd', 't'],
    stub: 'freeholdEnter',
    args: (pid) => [pid],
  },
  {
    token: 'freehold_leave',
    send: (w) => w.freeholdLeave(),
    keys: ['cmd', 't'],
    stub: 'freeholdLeave',
    args: (pid) => [pid],
  },
  {
    token: 'place_furnishing',
    send: (w) => w.placeFurnishing(4, 1.5, 0, -2.25, 0.5),
    keys: ['cmd', 'slot', 't', 'x', 'y', 'yaw', 'z'],
    stub: 'placeFurnishing',
    args: (pid) => [4, 1.5, 0, -2.25, 0.5, pid],
  },
  {
    token: 'move_furnishing',
    send: (w) => w.moveFurnishing(12, -3, 0.5, 4, 3.14),
    keys: ['cmd', 'placementId', 't', 'x', 'y', 'yaw', 'z'],
    stub: 'moveFurnishing',
    args: (pid) => [12, -3, 0.5, 4, 3.14, pid],
  },
  {
    token: 'remove_furnishing',
    send: (w) => w.removeFurnishing(12),
    keys: ['cmd', 'placementId', 't'],
    stub: 'removeFurnishing',
    args: (pid) => [12, pid],
  },
  {
    token: 'undo_placement',
    send: (w) => w.undoPlacement(),
    keys: ['cmd', 't'],
    stub: 'undoPlacement',
    args: (pid) => [pid],
  },
  {
    token: 'redo_placement',
    send: (w) => w.redoPlacement(),
    keys: ['cmd', 't'],
    stub: 'redoPlacement',
    args: (pid) => [pid],
  },
  {
    token: 'pay_ledger',
    send: (w) => w.payLedger(),
    keys: ['cmd', 't'],
    stub: 'payLedger',
    args: (pid) => [pid],
  },
  {
    token: 'set_visit_policy',
    send: (w) => w.setVisitPolicy('friends'),
    keys: ['cmd', 'policy', 't'],
    stub: 'setVisitPolicy',
    args: (pid) => ['friends', pid],
  },
  {
    token: 'set_freehold_build_presence',
    send: (w) => w.setFreeholdBuildPresence(true),
    keys: ['acceptedTransitionId', 'active', 'buildPresenceSeq', 'cmd', 'plotId', 't'],
    stub: 'setFreeholdBuildPresence',
    args: (pid) => [true, pid],
  },
];

// --- the client half: a real ClientWorld whose socket keeps every send ---

class StubWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = StubWebSocket.OPEN;
  sent: string[] = [];
  static last: StubWebSocket | null = null;
  constructor(public readonly url: string) {
    StubWebSocket.last = this;
  }
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.readyState = StubWebSocket.CLOSED;
  }
}

function withDomStubs<T>(fn: () => T): T {
  const g = globalThis as Record<string, unknown>;
  const prevWebSocket = g.WebSocket;
  const prevWindow = g.window;
  g.WebSocket = StubWebSocket as unknown;
  g.window = {
    setInterval: () => 0,
    clearInterval: () => undefined,
    setTimeout: () => 0,
    clearTimeout: () => undefined,
  };
  try {
    return fn();
  } finally {
    g.WebSocket = prevWebSocket;
    g.window = prevWindow;
  }
}

// Run a body against a world that can actually SEND. Two things gate that and
// both are easy to get silently wrong, which would make every assertion below
// vacuous: canSendCommand() needs `connected`, which the server's `hello` sets
// (not the socket open), and it reads WebSocket.OPEN off the global, so the stub
// must stay installed for the whole body rather than just the constructor. The
// guard in captureRaw fails loudly if no frame was produced.
function withClient(fn: (world: ClientWorld, sock: StubWebSocket) => void): void {
  withDomStubs(() => {
    const world = new ClientWorld('freehold-chain-token', 1, PROBE_CLASS, 'http://x');
    const sock = StubWebSocket.last;
    if (!sock) throw new Error('ClientWorld opened no socket');
    (world as unknown as { onMessage(raw: string): void }).onMessage(
      JSON.stringify({ t: 'hello', pid: 1, seed: 20061 }),
    );
    sock.sent.length = 0; // drop whatever the join flush queued
    try {
      fn(world, sock);
    } finally {
      world.close();
    }
  });
}

/** The client's own bytes for one sender, captured off the socket: exactly
 *  one frame, never a string written by this test. */
function captureRaw(send: (world: ClientWorld) => void): string {
  const raw: string[] = [];
  withClient((world, sock) => {
    send(world);
    raw.push(...sock.sent);
  });
  expect(raw).toHaveLength(1);
  return raw[0];
}

// --- the server half ---

function fakeWs(): { sent: Record<string, unknown>[]; ws: unknown } {
  const sent: Record<string, unknown>[] = [];
  return {
    sent,
    ws: {
      readyState: 1,
      send: (payload: string) => sent.push(JSON.parse(payload) as Record<string, unknown>),
    },
  };
}

function joinWithSocket(
  server: GameServer,
  id: number,
  name: string,
): { session: ClientSession; fc: ReturnType<typeof fakeWs> } {
  const fc = fakeWs();
  const session = server.join(fc.ws as never, id, id, name, PROBE_CLASS, null);
  if ('error' in session) throw new Error(session.error);
  session.blockListLoaded = true;
  return { session, fc };
}

/** Spy every housing stub on this server's Sim (no-op bodies), keyed by name,
 *  so an arm can assert the ONE it expects fired and the other nine did not. */
function spyAllStubs(server: GameServer): Record<StubName, ReturnType<typeof vi.fn>> {
  const spies = {} as Record<StubName, ReturnType<typeof vi.fn>>;
  for (const s of SENDERS) {
    spies[s.stub] = vi
      .spyOn(server.sim, s.stub)
      .mockImplementation(() => {}) as unknown as ReturnType<typeof vi.fn>;
  }
  return spies;
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

// Production shape for every arm here: housing is a normal player command, not
// a dev cheat, so the claim "the server dispatches this" must hold with the dev
// gate provably unset.
beforeEach(() => {
  expect(process.env.ALLOW_DEV_COMMANDS).toBeUndefined();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setGameMetricsCounters(noopGameMetricsCounters);
});

describe('the sender table covers the wire vocabulary', () => {
  it('names exactly the ten tokens FREEHOLD_WIRE_COMMANDS gates, in order (no sender can be forgotten)', () => {
    expect(SENDERS.map((s) => s.token)).toEqual([...FREEHOLD_WIRE_COMMANDS]);
    expect(SENDERS).toHaveLength(10);
  });
});

describe('ClientWorld emits the housing frames the protocol declares', () => {
  it.each(SENDERS)('$token rides exactly its declared key set and nothing else', (s) => {
    const frame = JSON.parse(captureRaw(s.send)) as Record<string, unknown>;
    expect(frame.t).toBe('cmd');
    expect(frame.cmd).toBe(s.token);
    expect(Object.keys(frame).sort()).toEqual([...s.keys]);
  });
});

describe('the captured frames reach the Sim stubs through the real dispatch on a LIT realm', () => {
  it.each(SENDERS)(
    '$token invokes $stub once with the guarded args and the session pid, and no other stub',
    (s) => {
      vi.stubEnv('FREEHOLDS_ENABLED', '1');
      const raw = captureRaw(s.send);
      const server = new GameServer();
      const { session, fc } = joinWithSocket(server, 1, 'Freeholder');
      const spies = spyAllStubs(server);

      // Verbatim: the client's own bytes, never a frame written by this test.
      server.handleMessage(session, raw);

      expect(spies[s.stub]).toHaveBeenCalledTimes(1);
      expect(spies[s.stub].mock.calls[0]).toEqual(s.args(session.pid as number));
      for (const other of SENDERS) {
        if (other.stub !== s.stub) expect(spies[other.stub], other.stub).not.toHaveBeenCalled();
      }
      // Not a gate refusal: nothing answered ok:false.
      expect(fc.sent.filter((m) => m.t === 'commandOutcome' && m.ok === false)).toEqual([]);
    },
  );

  it('all ten frames from one client session reach their stubs in the order the client sent them', () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const raws: string[] = [];
    withClient((world, sock) => {
      for (const s of SENDERS) s.send(world);
      raws.push(...sock.sent);
    });
    expect(raws).toHaveLength(SENDERS.length);

    const server = new GameServer();
    const { session } = joinWithSocket(server, 2, 'Rowan');
    const order: StubName[] = [];
    for (const s of SENDERS) {
      vi.spyOn(server.sim, s.stub).mockImplementation(() => {
        order.push(s.stub);
      });
    }
    for (const raw of raws) server.handleMessage(session, raw);
    expect(order).toEqual(SENDERS.map((s) => s.stub));
  });
});

describe('the same captured frame is refused on a DARK realm', () => {
  it.each(SENDERS)(
    '$token: the stub is never reached, the refusal is booked, and a rid frame acks ok:false',
    (s) => {
      vi.stubEnv('FREEHOLDS_ENABLED', undefined);
      const refusals = recordingRefusalSink();
      const raw = captureRaw(s.send);
      const server = new GameServer();
      const { session, fc } = joinWithSocket(server, 3, 'Locked');
      const spies = spyAllStubs(server);

      // The client's own bytes first. The housing senders ride `cmd`, not
      // cmdWithOutcome, so this frame carries no rid: the refusal is
      // observable as the stub never firing plus the ops counter, and the
      // ack channel stays silent (sendCommandOutcome is rid-gated).
      server.handleMessage(session, raw);
      expect(spies[s.stub]).not.toHaveBeenCalled();
      expect(refusals.count()).toBe(1);
      expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([]);

      // The same field set with a rid riding on top (the client's fields
      // untouched): the refusal answers ok:false on the ack channel.
      server.handleMessage(
        session,
        JSON.stringify({ ...(JSON.parse(raw) as Record<string, unknown>), rid: 61 }),
      );
      expect(spies[s.stub]).not.toHaveBeenCalled();
      expect(refusals.count()).toBe(2);
      expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([
        { t: 'commandOutcome', rid: 61, ok: false },
      ]);

      // Positive control on the SAME server and session: light the realm and
      // the identical bytes reach the stub, so the refusals above were the
      // gate's doing and not a malformed capture.
      vi.stubEnv('FREEHOLDS_ENABLED', '1');
      server.handleMessage(session, raw);
      expect(spies[s.stub]).toHaveBeenCalledTimes(1);
      expect(spies[s.stub].mock.calls[0]).toEqual(s.args(session.pid as number));
      expect(refusals.count()).toBe(2);
    },
  );
});

// The one guard with a real shape bound, the opaque-id rule on plotId and
// acceptedTransitionId (server/freehold_wire.ts isOpaqueIdOrNull: null, or 1
// to 64 chars of [A-Za-z0-9_:-]), is driven with null by every row above
// because the mirrors start null. These arms stamp the mirrors the way a
// later producer will and capture the frame the client then emits, so the
// client's id shapes are held to the server's bound in the same suite: an id
// alphabet drift on either side (a base64 `+`, `/` or `=`, a dot, a braced
// UUID) reddens here instead of silently refusing every presence frame.
describe('the build-presence frame carries the mirrored ids through the opaque-id bound', () => {
  // Every character class the bound admits, at its exact length ceiling
  // (OPAQUE_ID_MAX_LEN and OPAQUE_ID_RE in server/freehold_wire.ts).
  const WIDEST_PLOT_ID = '_ABCDEFGHIJKLMNOPQRSTUVWXYZ:abcdefghijklmnopqrstuvwxyz-012345678';
  const TRANSITION_ID = 'txn:0007-accepted';

  /** The client's own presence frame with the two mirrors stamped first. */
  function presenceFrom(plotId: string, transitionId: string): string {
    return captureRaw((w) => {
      w.myFreehold = { plotId, tier: 'inn_room', visitPolicy: 'closed' };
      w.freeholdTransitionId = transitionId;
      w.setFreeholdBuildPresence(true);
    });
  }

  it('the widest id the bound admits, stamped on the client, rides the frame verbatim and reaches the stub on a LIT realm', () => {
    expect(WIDEST_PLOT_ID).toHaveLength(64);
    expect(WIDEST_PLOT_ID).toMatch(/^[A-Za-z0-9_:-]+$/);
    for (const cls of [/[A-Z]/, /[a-z]/, /[0-9]/, /_/, /:/, /-/])
      expect(WIDEST_PLOT_ID).toMatch(cls);
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const raw = presenceFrom(WIDEST_PLOT_ID, TRANSITION_ID);
    // No client-side laundering could hide a shape drift from the guard.
    const frame = JSON.parse(raw) as Record<string, unknown>;
    expect(frame.plotId).toBe(WIDEST_PLOT_ID);
    expect(frame.acceptedTransitionId).toBe(TRANSITION_ID);

    const server = new GameServer();
    const { session, fc } = joinWithSocket(server, 4, 'Widest');
    const spies = spyAllStubs(server);
    server.handleMessage(session, raw);
    expect(spies.setFreeholdBuildPresence).toHaveBeenCalledTimes(1);
    expect(spies.setFreeholdBuildPresence.mock.calls[0]).toEqual([true, session.pid as number]);
    expect(fc.sent.filter((m) => m.t === 'commandOutcome' && m.ok === false)).toEqual([]);
  });

  it.each([
    ['a base64 plus in plotId', 'plot+7', TRANSITION_ID],
    ['a base64 slash in plotId', 'plot/7', TRANSITION_ID],
    ['a base64 plus in acceptedTransitionId', WIDEST_PLOT_ID, 'txn+7'],
  ])(
    '%s is refused at the type boundary on a LIT realm: the stub is never reached',
    (_why, plotId, transitionId) => {
      vi.stubEnv('FREEHOLDS_ENABLED', '1');
      const refusals = recordingRefusalSink();
      const raw = presenceFrom(plotId, transitionId);
      const frame = JSON.parse(raw) as Record<string, unknown>;
      expect(frame.plotId).toBe(plotId);
      expect(frame.acceptedTransitionId).toBe(transitionId);

      const server = new GameServer();
      const { session, fc } = joinWithSocket(server, 5, 'Refused');
      const spies = spyAllStubs(server);
      server.handleMessage(session, raw);
      expect(spies.setFreeholdBuildPresence).not.toHaveBeenCalled();
      // The type boundary, not the dark gate: the realm is lit, so no housing
      // refusal is booked, and a rid-less frame draws no ack either way.
      expect(refusals.count()).toBe(0);
      expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([]);

      // Positive control on the SAME server and session: the identical frame
      // shape with the widest admitted ids reaches the stub, so the refusal
      // above was the bound's doing and not a malformed capture.
      server.handleMessage(session, presenceFrom(WIDEST_PLOT_ID, TRANSITION_ID));
      expect(spies.setFreeholdBuildPresence).toHaveBeenCalledTimes(1);
      expect(spies.setFreeholdBuildPresence.mock.calls[0]).toEqual([true, session.pid as number]);
    },
  );
});
