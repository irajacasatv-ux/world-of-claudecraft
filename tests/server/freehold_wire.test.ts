// The Freeholds wire gate and dispatch sibling (server/freehold_wire.ts,
// server/freehold_config.ts, the game.ts call sites, server/sim_boot_config.ts).
//
// Housing ships dark by default: FREEHOLDS_ENABLED must be exactly '1' to
// light a realm. Pins, both arms of the flag:
//  - the pure verdict: the strict four-value contract, read LIVE on every
//    call (never captured at import or construction), exactly the ten
//    housing tokens refuse while dark, nothing else ever, and the env read
//    sits BEHIND the token short-circuit (a non-housing frame never touches
//    the env);
//  - dark: each housing command and use/hearth_key refuses before the Sim,
//    returns ok:false when a rid is present, and never marks heavy self dirty;
//  - lit: well-formed frames reach the matching Sim method with session-owned
//    identity. Gate entry is arm-marked because it can grant inventory; other
//    housing commands remain outside the heavy-self set. Malformed fields
//    refuse before invocation. The real gate/item dispatch tests below prove
//    accepted own entry and isolated test-participant remote travel separately
//    from the stock realm's unavailable remote-key authority;
//  - the owner key: `account:<id>` is minted server-side from the session's
//    account id at the ONE addPlayer call in game.ts (a source pin), refuses a
//    malformed id, and is never shaped by a client frame;
//  - jailed: freehold_enter is a JAILED_BLOCKED_COMMANDS member (a door step
//    into instanced space) and freehold_leave is not, pinned in source and
//    behaviorally on a lit realm;
//  - the realm Sim boot config maps the flag to SimConfig.freeholdsEnabled
//    (D85) while the offline stock world and the headless host construct
//    their Sim lit (D3), each from exactly one `new Sim(` site;
//  - the ops surfaces (.env.example, DEPLOY.md, turbo.json) and the game.ts
//    shape (every token has a case label; the refusal sits above the
//    heavy-self mark) stay pinned.
//
// Db is mocked so no Postgres runs (the rift_forge_gate idiom).

import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server/db', () => ({
  // The canonical GameServer db-mock shape (tests/character_lease_game.test.ts):
  // thinner mocks fail only on the merged tree when game.ts grows a './db'
  // import, so mirror the template rather than the minimum this file reaches.
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
  loadAccountFlair: vi.fn(async () => null),
  walletForAccount: vi.fn(async () => null),
  markAccountQuestComplete: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  grantAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  revokeAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  insertBankLedgerRow: vi.fn(async () => {}),
  insertBankLedgerRows: vi.fn(async () => {}),
  acquireCharacterLease: vi.fn(async () => true),
  releaseCharacterLease: vi.fn(async () => {}),
  heartbeatCharacterLeases: vi.fn(async () => {}),
  releaseAllCharacterLeases: vi.fn(async () => {}),
}));

import type { BotDetector } from '../../server/bot_detector/contract';
import { freeholdsEnabled } from '../../server/freehold_config';
import {
  dispatchFreeholdCommand,
  FREEHOLD_WIRE_COMMANDS,
  freeholdOwnerKeyForAccount,
  refusedFreeholdCommand,
} from '../../server/freehold_wire';
import { GameServer } from '../../server/game';
import {
  HEAVY_SELF_ARM_MARKED_CMDS,
  HEAVY_SELF_CMDS,
  heavySelfMarkOnAccept,
  heavySelfMarkOnReceipt,
} from '../../server/heavy_self';
import { noopGameMetricsCounters, setGameMetricsCounters } from '../../server/http/game_signals';
import { refusedRiftForgeCommand } from '../../server/rift_forge_gate';
import { buildRealmSimConfig } from '../../server/sim_boot_config';
import { bagCapacity } from '../../src/sim/bags';
import { ITEMS } from '../../src/sim/data';
import { EASTBROOK_LAYOUT } from '../../src/sim/eastbrook_layout';
import { isInJailCage } from '../../src/sim/jail';
import { Sim } from '../../src/sim/sim';
import { inertVaultConsumptionAdmission } from '../../src/sim/sim_context';
import { FreeholdGatePrompt } from '../../src/ui/hud/housing/gate_prompt_controller';
import { COMMAND_FACETS, type CommandName } from '../../src/world_api';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from '../helpers/bare_client';
import { methodBody } from '../helpers/method_body';

type HousingCommand = (typeof FREEHOLD_WIRE_COMMANDS)[number];

/** Strip block and line comments (keeping a `://` in a URL intact) before a
 *  source scan counts anything, so prose describing a call cannot satisfy it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// The authored gate site, read from its one source so a move re-pins nothing here.
const GATE = EASTBROOK_LAYOUT.services.freeholdGate.position;

function repoFile(rel: string): string {
  return readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');
}

/** The source text of the balanced call starting at `open` (the index of a `(`). */
function balancedCall(src: string, open: number): string {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  throw new Error('unbalanced call');
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

/** GameServer keeps its detector private; a spy reaches it structurally
 *  (the tests/event_frame_serialize.test.ts idiom). */
function botDetectorOf(server: GameServer): BotDetector {
  return (server as unknown as { botDetector: BotDetector }).botDetector;
}

/** A joined session on a fresh server; housing needs nothing else to probe. */
function housingSession() {
  const server = new GameServer();
  const fc = fakeWs();
  const session = joinServer(server, fc, 7201, 'Freeholder');
  return { server, fc, session, pid: session.pid };
}

/** One well-formed payload per token (the ClientWorld sender shapes). */
const WELL_FORMED: Record<HousingCommand, Record<string, unknown>> = {
  freehold_enter: {},
  freehold_leave: {},
  place_furnishing: { slot: 3, x: 1.5, y: 0, z: -2.25, yaw: 0.5 },
  move_furnishing: { placementId: 12, x: 1.5, y: 0, z: -2.25, yaw: 0.5 },
  remove_furnishing: { placementId: 12 },
  undo_placement: {},
  redo_placement: {},
  pay_ledger: {},
  set_visit_policy: { policy: 'friends' },
  set_freehold_build_presence: {
    active: true,
    plotId: 'plot-a',
    acceptedTransitionId: null,
    buildPresenceSeq: 1,
  },
};

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

/** The Sim stub each token reaches, and the exact guarded args it carries. */
const STUB: Record<HousingCommand, { method: StubName; args: (pid: number) => unknown[] }> = {
  freehold_enter: { method: 'freeholdEnter', args: (pid) => [pid] },
  freehold_leave: { method: 'freeholdLeave', args: (pid) => [pid] },
  place_furnishing: { method: 'placeFurnishing', args: (pid) => [3, 1.5, 0, -2.25, 0.5, pid] },
  move_furnishing: { method: 'moveFurnishing', args: (pid) => [12, 1.5, 0, -2.25, 0.5, pid] },
  remove_furnishing: { method: 'removeFurnishing', args: (pid) => [12, pid] },
  undo_placement: { method: 'undoPlacement', args: (pid) => [pid] },
  redo_placement: { method: 'redoPlacement', args: (pid) => [pid] },
  pay_ledger: { method: 'payLedger', args: (pid) => [pid] },
  set_visit_policy: { method: 'setVisitPolicy', args: (pid) => ['friends', pid] },
  set_freehold_build_presence: {
    method: 'setFreeholdBuildPresence',
    args: (pid) => [true, pid],
  },
};

/** One negative per typed field, each a single-field mutation of the well-formed frame. */
const MALFORMED: ReadonlyArray<[HousingCommand, string, Record<string, unknown>]> = [
  ['place_furnishing', 'non-finite x', { ...WELL_FORMED.place_furnishing, x: Number.NaN }],
  [
    'place_furnishing',
    'infinite yaw',
    { ...WELL_FORMED.place_furnishing, yaw: Number.POSITIVE_INFINITY },
  ],
  ['place_furnishing', 'non-integer slot', { ...WELL_FORMED.place_furnishing, slot: 1.5 }],
  ['place_furnishing', 'numeric-string slot', { ...WELL_FORMED.place_furnishing, slot: '3' }],
  ['place_furnishing', 'missing y', { slot: 3, x: 1.5, z: -2.25, yaw: 0.5 }],
  [
    'move_furnishing',
    'non-integer placementId',
    { ...WELL_FORMED.move_furnishing, placementId: 2.5 },
  ],
  ['move_furnishing', 'non-finite z', { ...WELL_FORMED.move_furnishing, z: Number.NaN }],
  ['remove_furnishing', 'numeric-string placementId', { placementId: '12' }],
  ['remove_furnishing', 'missing placementId', {}],
  ['set_visit_policy', 'unknown policy', { policy: 'everyone' }],
  ['set_visit_policy', 'non-string policy', { policy: 1 }],
  ['set_visit_policy', 'missing policy', {}],
  [
    'set_freehold_build_presence',
    'non-boolean active',
    { ...WELL_FORMED.set_freehold_build_presence, active: 'true' },
  ],
  [
    'set_freehold_build_presence',
    'non-string plotId',
    { ...WELL_FORMED.set_freehold_build_presence, plotId: 7 },
  ],
  [
    'set_freehold_build_presence',
    'non-string acceptedTransitionId',
    { ...WELL_FORMED.set_freehold_build_presence, acceptedTransitionId: 3 },
  ],
  [
    'set_freehold_build_presence',
    'non-integer buildPresenceSeq',
    { ...WELL_FORMED.set_freehold_build_presence, buildPresenceSeq: 1.5 },
  ],
  // One negative per ANDed guard dimension the rows above left unexercised
  // (deleting any one clause of a guard must red at least one row).
  ['place_furnishing', 'non-finite z', { ...WELL_FORMED.place_furnishing, z: Number.NaN }],
  ['move_furnishing', 'non-finite x', { ...WELL_FORMED.move_furnishing, x: Number.NaN }],
  ['move_furnishing', 'missing y', { placementId: 12, x: 1.5, z: -2.25, yaw: 0.5 }],
  [
    'move_furnishing',
    'non-finite yaw',
    { ...WELL_FORMED.move_furnishing, yaw: Number.NEGATIVE_INFINITY },
  ],
  [
    'set_freehold_build_presence',
    'missing buildPresenceSeq',
    { active: true, plotId: 'plot-a', acceptedTransitionId: null },
  ],
  // Null, array and object values: the type boundary admits none of them for
  // a numeric or enum field (typeof null is 'object', never a number).
  ['place_furnishing', 'null slot', { ...WELL_FORMED.place_furnishing, slot: null }],
  ['remove_furnishing', 'null placementId', { placementId: null }],
  ['move_furnishing', 'null placementId', { ...WELL_FORMED.move_furnishing, placementId: null }],
  ['place_furnishing', 'array-valued x', { ...WELL_FORMED.place_furnishing, x: [1.5] }],
  ['set_visit_policy', 'object-valued policy', { policy: { policy: 'open' } }],
  [
    'set_freehold_build_presence',
    'object-valued buildPresenceSeq',
    { ...WELL_FORMED.set_freehold_build_presence, buildPresenceSeq: { seq: 1 } },
  ],
  // The two opaque ids are bounded to 1..64 chars of [A-Za-z0-9_:-] or null:
  // an over-length, empty, or off-charset id is refused, never truncated.
  [
    'set_freehold_build_presence',
    'over-length plotId',
    { ...WELL_FORMED.set_freehold_build_presence, plotId: 'p'.repeat(65) },
  ],
  [
    'set_freehold_build_presence',
    'empty plotId',
    { ...WELL_FORMED.set_freehold_build_presence, plotId: '' },
  ],
  [
    'set_freehold_build_presence',
    'off-charset plotId (a space)',
    { ...WELL_FORMED.set_freehold_build_presence, plotId: 'plot a' },
  ],
  [
    'set_freehold_build_presence',
    'off-charset plotId (a slash)',
    { ...WELL_FORMED.set_freehold_build_presence, plotId: 'plot/a' },
  ],
  [
    'set_freehold_build_presence',
    'over-length acceptedTransitionId',
    { ...WELL_FORMED.set_freehold_build_presence, acceptedTransitionId: 't'.repeat(65) },
  ],
  [
    'set_freehold_build_presence',
    'off-charset acceptedTransitionId (non-Latin)',
    { ...WELL_FORMED.set_freehold_build_presence, acceptedTransitionId: 'tränsition' },
  ],
  [
    'set_freehold_build_presence',
    'array-valued plotId',
    { ...WELL_FORMED.set_freehold_build_presence, plotId: ['plot-a'] },
  ],
  // An OMITTED field is a distinct shape from a wrong-typed one: `undefined`
  // must fail every guard rather than be read as an absent-and-therefore-fine
  // default. One row per field of the four-field presence frame: three here,
  // and `missing buildPresenceSeq` already sits with the guard-dimension rows
  // above, so all four omissions are driven.
  [
    'set_freehold_build_presence',
    'missing active',
    { plotId: 'plot-a', acceptedTransitionId: null, buildPresenceSeq: 1 },
  ],
  [
    'set_freehold_build_presence',
    'missing plotId',
    { active: true, acceptedTransitionId: null, buildPresenceSeq: 1 },
  ],
  [
    'set_freehold_build_presence',
    'missing acceptedTransitionId',
    { active: true, plotId: 'plot-a', buildPresenceSeq: 1 },
  ],
  // Beyond Number.MAX_SAFE_INTEGER the value is no longer an exact integer, so
  // a sequence that large cannot be compared for monotonicity: refuse it here
  // rather than let C03 inherit a lossy counter.
  [
    'set_freehold_build_presence',
    'buildPresenceSeq past the safe-integer range',
    { ...WELL_FORMED.set_freehold_build_presence, buildPresenceSeq: 2 ** 53 },
  ],
];

/** The widest ids the opaque-id bound admits, one per field (the positive
 *  control for the bound rows above: 64 chars of the full charset). */
const WIDEST_ID = `${'A'.repeat(20)}${'z'.repeat(20)}${'0'.repeat(20)}_:-_`;

const TEN_TOKENS: readonly HousingCommand[] = [
  'freehold_enter',
  'freehold_leave',
  'place_furnishing',
  'move_furnishing',
  'remove_furnishing',
  'undo_placement',
  'redo_placement',
  'pay_ledger',
  'set_visit_policy',
  'set_freehold_build_presence',
];

// process.env is safe to flip here because vitest's default forks pool gives
// each test file its own process and files in one fork run sequentially;
// under a threads pool this would need vi.stubEnv everywhere instead.
const saved = process.env.FREEHOLDS_ENABLED;
afterEach(() => {
  if (saved === undefined) delete process.env.FREEHOLDS_ENABLED;
  else process.env.FREEHOLDS_ENABLED = saved;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setGameMetricsCounters(noopGameMetricsCounters);
});

describe('freeholds flag: the pure verdict', () => {
  it('is dark unless FREEHOLDS_ENABLED is exactly 1', () => {
    expect(freeholdsEnabled({})).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: undefined })).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: '0' })).toBe(false);
    // Strict opt-in, not truthiness: "true"/"yes" must not light a realm.
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: 'true' })).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: 'TRUE' })).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: 'yes' })).toBe(false);
    // The near-miss shapes a hand-edited .env actually produces stay dark too.
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: '' })).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: ' 1' })).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: '1 ' })).toBe(false);
    expect(freeholdsEnabled({ FREEHOLDS_ENABLED: '1' })).toBe(true);
  });

  it('refuses exactly the ten housing tokens while dark, and nothing else ever', () => {
    expect(FREEHOLD_WIRE_COMMANDS).toEqual(TEN_TOKENS);
    for (const cmd of FREEHOLD_WIRE_COMMANDS) {
      expect(refusedFreeholdCommand(cmd, {}), `${cmd} must refuse while dark`).toBe(true);
      expect(
        refusedFreeholdCommand(cmd, { FREEHOLDS_ENABLED: '1' }),
        `${cmd} must pass while lit`,
      ).toBe(false);
    }
    // Non-housing traffic never draws a verdict from this gate, dark or lit.
    expect(refusedFreeholdCommand('cast', {})).toBe(false);
    expect(refusedFreeholdCommand('plant_crop', {})).toBe(false);
    expect(refusedFreeholdCommand('rift_upgrade_item', {})).toBe(false);
    expect(refusedFreeholdCommand(undefined, {})).toBe(false);
    expect(refusedFreeholdCommand(42, {})).toBe(false);
  });

  it('reads the flag live on every call, never captured at import', () => {
    delete process.env.FREEHOLDS_ENABLED;
    expect(refusedFreeholdCommand('freehold_enter')).toBe(true);
    process.env.FREEHOLDS_ENABLED = '1';
    expect(refusedFreeholdCommand('freehold_enter')).toBe(false);
    process.env.FREEHOLDS_ENABLED = '0';
    expect(refusedFreeholdCommand('freehold_enter')).toBe(true);
  });

  it('the env read sits behind the token short-circuit: a non-housing frame never touches the env', () => {
    // The per-verdict process.env read is affordable only because it runs
    // for housing tokens alone (the module header's load-bearing claim). A
    // reordered conjunction would move the lookup onto every command frame
    // of every session; this Proxy counts the reads so that reorder reds.
    // The rift forge sibling (server/rift_forge_gate.ts) makes the same
    // claim on the same shape and takes the same env argument, so the same
    // counting env pins the short-circuit in both wire gates here.
    let reads = 0;
    const countingEnv = new Proxy({} as NodeJS.ProcessEnv, {
      get(target, prop, receiver) {
        reads++;
        return Reflect.get(target, prop, receiver);
      },
    });
    expect(refusedFreeholdCommand('cast', countingEnv)).toBe(false);
    expect(refusedFreeholdCommand(undefined, countingEnv)).toBe(false);
    expect(reads).toBe(0);
    expect(refusedFreeholdCommand('freehold_enter', countingEnv)).toBe(true);
    expect(reads).toBe(1);
    reads = 0;
    expect(refusedRiftForgeCommand('cast', countingEnv)).toBe(false);
    expect(refusedRiftForgeCommand('freehold_enter', countingEnv)).toBe(false);
    expect(reads).toBe(0);
    expect(refusedRiftForgeCommand('rift_upgrade_item', countingEnv)).toBe(false);
    expect(reads).toBe(1);
    countingEnv.RIFT_FORGE_ENABLED = '0';
    expect(refusedRiftForgeCommand('rift_upgrade_item', countingEnv)).toBe(true);
    expect(reads).toBe(2);
  });

  it('the gate list is exactly the COMMAND_FACETS rows tagged IWorldHousing, both ways', () => {
    const housing = Object.entries(COMMAND_FACETS)
      .filter(([, facet]) => facet === 'IWorldHousing')
      .map(([cmd]) => cmd)
      .sort();
    expect(housing).toEqual([...FREEHOLD_WIRE_COMMANDS].sort());
  });
});

describe('freeholds wire: dark realm dispatch', () => {
  it.each(TEN_TOKENS)(
    '%s: refused before the sim, ok:false per rid, one count per attempt, no heavy-self mark',
    (cmd) => {
      delete process.env.FREEHOLDS_ENABLED;
      const refusals = recordingRefusalSink();
      const { server, fc, session } = housingSession();
      const stub = vi.spyOn(server.sim, STUB[cmd].method);
      session.selfHeavyDirty = false;

      server.handleMessage(
        session,
        JSON.stringify({ t: 'cmd', cmd, ...WELL_FORMED[cmd], rid: 31 }),
      );
      // The frame shape an attacker actually sends: no rid at all. It must be
      // refused identically, not slip through because there is no ack to send
      // (the gate must not be conditional on the ack).
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd, ...WELL_FORMED[cmd] }));

      // Refused before the sim: the stub was never reached.
      expect(stub).not.toHaveBeenCalled();
      // The refusal answers on the commandOutcome ack channel, ok:false per
      // rid, and only for the rid frame.
      expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([
        { t: 'commandOutcome', rid: 31, ok: false },
      ]);
      // Every attempt books the ops counter, the rid-less one included.
      expect(refusals.count()).toBe(2);
      // Refused ABOVE the heavy-self dirty flag: a blocked frame cannot force a re-diff.
      expect(session.selfHeavyDirty).toBe(false);
    },
  );

  it('a non-housing command through the same wiring is untouched by this gate (positive control)', () => {
    delete process.env.FREEHOLDS_ENABLED;
    const refusals = recordingRefusalSink();
    const { server, fc, session } = housingSession();
    const junk = vi.spyOn(server.sim, 'sellAllJunk');
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'sell_all_junk', rid: 41 }));
    // The frame reached its own arm: the sim was invoked, nothing was counted,
    // and no gate refusal answered the rid.
    expect(junk).toHaveBeenCalledTimes(1);
    expect(refusals.count()).toBe(0);
    expect(fc.sent.filter((m) => m.t === 'commandOutcome' && m.ok === false)).toEqual([]);
  });

  it('only gate entry is heavy-self arm-marked because it may grant the key', () => {
    expect(FREEHOLD_WIRE_COMMANDS.filter((c) => heavySelfMarkOnReceipt(c))).toEqual([]);
    expect(FREEHOLD_WIRE_COMMANDS.filter((c) => heavySelfMarkOnAccept(c))).toEqual([
      'freehold_enter',
    ]);
    expect(heavySelfMarkOnAccept('set_freehold_build_presence')).toBe(false);
  });

  it('a housing command in HEAVY_SELF_CMDS must also be arm-marked, or refusals start marking', () => {
    // The arm's whole guarantee is that a frame refused by the wire guards buys
    // no re-serialize, and that holds ONLY while every housing member marks on
    // ACCEPT rather than on RECEIPT. heavySelfMarkOnAccept is true just for a
    // member of BOTH sets, so adding a housing token to HEAVY_SELF_CMDS while
    // forgetting HEAVY_SELF_ARM_MARKED_CMDS silently moves the mark to the
    // pre-switch receipt line, ahead of the type guards. Housing is the only
    // dispatch case whose guards live in a sibling module, which is exactly what
    // makes that omission easy; this arm is vacuous today and becomes real the
    // moment the first housing member joins either set.
    const heavy = FREEHOLD_WIRE_COMMANDS.filter((c) => HEAVY_SELF_CMDS.has(c));
    const armMarked = FREEHOLD_WIRE_COMMANDS.filter((c) => HEAVY_SELF_ARM_MARKED_CMDS.has(c));
    expect(heavy.filter((c) => !armMarked.includes(c))).toEqual([]);
    // The control that keeps the above honest once it stops being empty: the
    // two sets are real and reachable from here.
    expect(HEAVY_SELF_CMDS.has('inv_sort')).toBe(true);
  });

  it('the heavy-self dirty flag IS observable through this harness (a receipt-marked member sets it)', () => {
    // The "no heavy-self mark" assertions above and in the lit block can only
    // fail if the flag is reachable at all through handleMessage; no housing
    // gate token is arm-marked, and this control also drives a real
    // receipt-marked member (inv_sort, server/heavy_self.ts) through the same
    // session and proves the flag flips where the dispatch marks on receipt.
    expect(heavySelfMarkOnReceipt('inv_sort')).toBe(true);
    const { server, session } = housingSession();
    session.selfHeavyDirty = false;
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'inv_sort' }));
    expect(session.selfHeavyDirty).toBe(true);
  });

  it('an unrecognised token lands in the default arm: still connected, no kick, no housing refusal', () => {
    // The mixed-release shape: a housing frame reaching a realm whose switch
    // has no label for it (an older server) falls into the default arm as a
    // protocol anomaly and nothing more. The labels all exist here, so an
    // invented token stands in for that arm; the session must stay joined,
    // the socket untouched, the housing counter silent, and no ack answered.
    delete process.env.FREEHOLDS_ENABLED;
    const refusals = recordingRefusalSink();
    const { server, fc, session, pid } = housingSession();
    const close = vi.fn();
    const terminate = vi.fn();
    Object.assign(fc.ws, { close, terminate });
    // The frame must PROVE it reached the default arm before the absence
    // claims below mean anything: that arm reports the token as the
    // unknown_command protocol anomaly, so a frame dropped ahead of the
    // switch (or an arm that stopped observing) leaves this spy silent.
    const anomaly = vi.spyOn(botDetectorOf(server), 'observeProtocolAnomaly');
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_tour', rid: 61 }));
    expect(anomaly).toHaveBeenCalledTimes(1);
    expect(anomaly.mock.calls[0][1]).toBe('unknown_command');
    expect(server.clients.get(pid)).toBe(session);
    expect(close).not.toHaveBeenCalled();
    expect(terminate).not.toHaveBeenCalled();
    expect(refusals.count()).toBe(0);
    expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([]);
  });

  it('reads the flag per verdict on a live server, not captured at construction', () => {
    delete process.env.FREEHOLDS_ENABLED;
    const refusals = recordingRefusalSink();
    const { server, session } = housingSession();
    const stub = vi.spyOn(server.sim, 'freeholdEnter');
    const frame = JSON.stringify({ t: 'cmd', cmd: 'freehold_enter' });

    server.handleMessage(session, frame);
    expect(stub).not.toHaveBeenCalled();
    expect(refusals.count()).toBe(1);

    // Flip the env on the SAME server instance: the very next frame reaches
    // the stub, which a constructor-captured flag could not do.
    process.env.FREEHOLDS_ENABLED = '1';
    server.handleMessage(session, frame);
    expect(stub).toHaveBeenCalledTimes(1);
    expect(refusals.count()).toBe(1);
  });
});

describe('freeholds wire: lit realm dispatch reaches the Sim methods', () => {
  it.each(TEN_TOKENS)(
    '%s: a well-formed frame invokes the Sim method once with the guarded args and the pid',
    (cmd) => {
      process.env.FREEHOLDS_ENABLED = '1';
      const refusals = recordingRefusalSink();
      const { server, fc, session, pid } = housingSession();
      const stub = vi.spyOn(server.sim, STUB[cmd].method);
      session.selfHeavyDirty = false;

      server.handleMessage(
        session,
        JSON.stringify({ t: 'cmd', cmd, ...WELL_FORMED[cmd], rid: 51 }),
      );

      expect(stub).toHaveBeenCalledTimes(1);
      expect(stub.mock.calls[0]).toEqual(STUB[cmd].args(pid));
      // This player is away from the gate, so the invoked entry refuses without
      // changing inventory. Invocation alone must not force heavy serialization.
      expect(fc.sent.filter((m) => m.t === 'commandOutcome' && m.ok === false)).toEqual([]);
      expect(refusals.count()).toBe(0);
      expect(session.selfHeavyDirty).toBe(false);
    },
  );

  it.each(MALFORMED)(
    '%s with a %s payload is refused at the type boundary',
    (cmd, _why, payload) => {
      process.env.FREEHOLDS_ENABLED = '1';
      const { server, session, pid } = housingSession();
      const stub = vi.spyOn(server.sim, STUB[cmd].method);
      expect(dispatchFreeholdCommand(server.sim, session, cmd, { cmd, ...payload }, pid)).toBe(
        false,
      );
      expect(stub).not.toHaveBeenCalled();
    },
  );

  it.each(['closed', 'friends', 'open'] as const)(
    'set_visit_policy accepts the policy %s and hands that exact value to the stub',
    (policy) => {
      // The server allowlist is `[...] as const satisfies readonly
      // FreeholdVisitPolicy[]`, and `satisfies` permits a SUBSET: dropping
      // 'open' and 'closed' from it still compiles and would refuse the real
      // client's own frames forever. The fixtures elsewhere in this file only
      // ever send 'friends', so each value needs its own accepted arm.
      process.env.FREEHOLDS_ENABLED = '1';
      const { server, session, pid } = housingSession();
      const stub = vi.spyOn(server.sim, 'setVisitPolicy');
      expect(
        dispatchFreeholdCommand(
          server.sim,
          session,
          'set_visit_policy',
          { cmd: 'set_visit_policy', policy },
          pid,
        ),
      ).toBe(true);
      expect(stub).toHaveBeenCalledWith(policy, pid);
    },
  );

  it('the widest opaque ids the bound admits still reach the stub (the bound is not over-tight)', () => {
    process.env.FREEHOLDS_ENABLED = '1';
    const { server, session, pid } = housingSession();
    const stub = vi.spyOn(server.sim, 'setFreeholdBuildPresence');
    expect(WIDEST_ID).toHaveLength(64);
    const msg = {
      cmd: 'set_freehold_build_presence',
      active: false,
      plotId: WIDEST_ID,
      acceptedTransitionId: WIDEST_ID,
      buildPresenceSeq: 2,
    };
    expect(
      dispatchFreeholdCommand(server.sim, session, 'set_freehold_build_presence', msg, pid),
    ).toBe(true);
    expect(stub).toHaveBeenCalledWith(false, pid);
  });

  it('a malformed frame through the live dispatch invokes nothing and marks nothing', () => {
    process.env.FREEHOLDS_ENABLED = '1';
    const refusals = recordingRefusalSink();
    const { server, fc, session } = housingSession();
    const stub = vi.spyOn(server.sim, 'placeFurnishing');
    session.selfHeavyDirty = false;
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'place_furnishing', slot: 1.5, x: 0, y: 0, z: 0, yaw: 0 }),
    );
    expect(stub).not.toHaveBeenCalled();
    expect(session.selfHeavyDirty).toBe(false);
    // Not a GATE refusal: the flag is lit, so nothing is counted and no ack answers.
    expect(refusals.count()).toBe(0);
    expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([]);
  });

  it('the dispatch sibling answers true only for its own ten tokens', () => {
    process.env.FREEHOLDS_ENABLED = '1';
    const { server, session, pid } = housingSession();
    for (const cmd of TEN_TOKENS) {
      const stub = vi.spyOn(server.sim, STUB[cmd].method);
      expect(
        dispatchFreeholdCommand(server.sim, session, cmd, { cmd, ...WELL_FORMED[cmd] }, pid),
        cmd,
      ).toBe(true);
      expect(stub).toHaveBeenCalledTimes(1);
    }
    const junk = vi.spyOn(server.sim, 'sellAllJunk');
    expect(
      dispatchFreeholdCommand(
        server.sim,
        session,
        'sell_all_junk' as CommandName,
        { cmd: 'sell_all_junk' },
        pid,
      ),
    ).toBe(false);
    expect(junk).not.toHaveBeenCalled();
  });
});

describe('the realm Sim boot config maps FREEHOLDS_ENABLED to SimConfig.freeholdsEnabled (D85)', () => {
  it.each([undefined, '1'])(
    'boot flag %s controls actual gate spawn, public entry and key grant',
    (flag) => {
      vi.stubEnv('FREEHOLDS_ENABLED', flag);
      const sim = new Sim(buildRealmSimConfig(undefined, inertVaultConsumptionAdmission));
      const pid = sim.addPlayer('warrior', 'BootOwner', { freeholdOwnerKey: 'account:9901' });
      const gate = [...sim.entities.values()].find((e) => e.templateId === 'freehold_gate');
      expect(Boolean(gate)).toBe(flag === '1');
      const player = sim.entities.get(pid)!;
      player.pos = gate ? { ...gate.pos } : sim.groundPos(GATE.x, GATE.z);
      const before = { ...player.pos };
      expect(sim.countItem('hearth_key', pid)).toBe(0);
      sim.drainEvents();
      sim.freeholdEnter(pid);
      if (flag === '1') {
        const id = sim.ctx.instanceClaimIdAt(player.pos);
        expect(id).not.toBeNull();
        expect(sim.instances.find((claim) => claim.exitId === id)?.partyKey).toBe('account:9901');
        expect(sim.countItem('hearth_key', pid)).toBe(1);
      } else {
        expect(player.pos).toEqual(before);
        expect(sim.ctx.instanceClaimIdAt(player.pos)).toBeNull();
        expect(sim.freeholds.size).toBe(0);
        expect(sim.countItem('hearth_key', pid)).toBe(0);
        expect(sim.drainEvents()).toEqual([{ type: 'freeholdDenied', pid, reason: 'no_freehold' }]);
      }
      expect(sim.freeholdKeyReadyAtMs.size).toBe(0);
    },
  );
  it('snapshots the real furnisher spawn and stock at realm boot', () => {
    const ids = [
      'freehold_timber_bed',
      'freehold_round_table',
      'freehold_spindle_chair',
      'freehold_low_stool',
      'freehold_woven_rug',
      'freehold_brass_lantern',
      'freehold_storage_chest',
      'freehold_open_bookshelf',
    ];
    vi.stubEnv('FREEHOLDS_ENABLED', undefined);
    const dark = new Sim(buildRealmSimConfig(undefined, inertVaultConsumptionAdmission));
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const lit = new Sim(buildRealmSimConfig(undefined, inertVaultConsumptionAdmission));
    const vendors = (sim: Sim) =>
      [...sim.entities.values()].filter((e) => e.templateId === 'freehold_furnisher');
    expect(dark.cfg.freeholdsEnabled).toBe(false);
    expect(vendors(dark)).toEqual([]);
    expect(
      [...dark.entities.values()].some((e) => e.vendorItems.some((id) => ids.includes(id))),
    ).toBe(false);
    expect(lit.cfg.freeholdsEnabled).toBe(true);
    expect(vendors(lit)).toHaveLength(1);
    expect(vendors(lit)[0].vendorItems).toEqual(ids);
    vi.stubEnv('FREEHOLDS_ENABLED', '0');
    expect(lit.cfg.freeholdsEnabled).toBe(true);
    expect(vendors(lit)[0].vendorItems).toEqual(ids);
    expect(vendors(dark)).toEqual([]);
    // The shared catalog remains one host-independent module value.
    expect(ids.map((id) => ITEMS[id]?.id)).toEqual(ids);
  });

  it.each([
    ['1', true],
    [undefined, false],
    ['0', false],
    ['true', false],
  ] as const)('FREEHOLDS_ENABLED=%s boots freeholdsEnabled %s', (value, expected) => {
    vi.stubEnv('FREEHOLDS_ENABLED', value);
    const cfg = buildRealmSimConfig(undefined, inertVaultConsumptionAdmission);
    expect(cfg.freeholdsEnabled).toBe(expected);
  });

  it('the offline stock world and the headless host construct their Sim lit (D3), from exactly one site each', () => {
    // The stock offline world is lit; custom editor play-test maps (a `world`
    // argument) and the editor viewport stay dark by design. The offline
    // configuration helper owns that policy. Every `new Sim(`
    // in each file is counted so a second construction cannot slip past the
    // pin unread.
    const expected: ReadonlyArray<[string, string]> = [
      ['src/main.ts', 'offlineWorldConfig('],
      ['headless/env_server.ts', 'freeholdsEnabled: true'],
    ];
    for (const [rel, literal] of expected) {
      const src = codeOnly(repoFile(rel));
      // The occurrence bound sees every spelling of a construction (a type
      // argument, extra whitespace), so a second site cannot slip past it.
      const sites = [...src.matchAll(/new\s+Sim\s*[<(]/g)].map((m) => m.index);
      expect(sites, `${rel} constructs exactly one Sim`).toHaveLength(1);
      const call = balancedCall(src, src.indexOf('(', sites[0])).replace(/\s+/g, ' ');
      expect(call, `${rel}: the new Sim( literal passes ${literal}`).toContain(literal);
    }
    const config = codeOnly(repoFile('src/game/offline_world_config.ts'));
    expect(config).toContain('freeholdsEnabled: options.world === undefined');
  });
});

describe('freeholds wire: a jailed session cannot step through its own door', () => {
  /** The JAILED_BLOCKED_COMMANDS Set literal, comment-stripped. */
  function jailedSetLiteral(): string {
    const src = codeOnly(repoFile('server/freehold_wire.ts'));
    const at = src.indexOf('const JAILED_BLOCKED_COMMANDS = new Set<string>(');
    expect(at, 'the jailed command set').toBeGreaterThanOrEqual(0);
    return balancedCall(src, at + 'const JAILED_BLOCKED_COMMANDS = new Set<string>'.length);
  }

  it('freehold_enter is in the jailed set (the enter_dungeon shape) and freehold_leave is not', () => {
    const literal = jailedSetLiteral();
    // A door step into instanced space would carry a prisoner out of the
    // cage; leaving lands the player where jail enforcement re-cages them.
    expect(literal).toContain("'enter_dungeon'");
    expect(literal).toContain("'freehold_enter'");
    expect(literal).not.toContain("'freehold_leave'");
  });

  it('on a DARK realm the jail arm answers first, so the housing counter under-counts a jailed prober', () => {
    // Ordering fact worth pinning rather than discovering later: the jailed
    // check sits ABOVE the housing refusal, so a jailed session probing
    // freehold_enter on a dark realm takes the jail arm and never books
    // woc_freehold_refused_total. The command is still refused, so this is an
    // ops-signal gap, not a security one. Pinned so a future reorder of the
    // dispatch prologue is a deliberate decision and not an accident, and so
    // the counter's documented meaning stays honest.
    delete process.env.FREEHOLDS_ENABLED;
    const refusals = recordingRefusalSink();
    const { server, fc, session } = housingSession();
    session.jailed = { returnPos: { x: 0, z: 0 }, returnFacing: 0 };
    const enter = vi.spyOn(server.sim, 'freeholdEnter');
    session.selfHeavyDirty = false;
    fc.sent.length = 0;

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter', rid: 81 }));
    expect(fc.sent).toEqual([
      { t: 'events', list: [{ type: 'freeholdDenied', pid: session.pid, reason: 'busy' }] },
      { t: 'commandOutcome', rid: 81, ok: false },
    ]);

    // Refused, and never reaches the sim: the security property holds.
    expect(enter).not.toHaveBeenCalled();
    expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([
      { t: 'commandOutcome', rid: 81, ok: false },
    ]);
    expect(session.selfHeavyDirty).toBe(false);
    // But the jail arm owns the refusal, so the housing counter stays at zero.
    expect(refusals.count()).toBe(0);

    // The contrast that makes the above a statement about the JAIL arm and not
    // about dark realms generally: an unjailed session on the same dark realm
    // does book the counter.
    const free = housingSession();
    free.server.handleMessage(free.session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter' }));
    expect(refusals.count()).toBe(1);
  });

  it('on a LIT realm, freehold_enter from a jailed session is refused before the stub and freehold_leave is not', () => {
    process.env.FREEHOLDS_ENABLED = '1';
    const refusals = recordingRefusalSink();
    const { server, fc, session, pid } = housingSession();
    session.jailed = { returnPos: { x: 0, z: 0 }, returnFacing: 0 };
    const enter = vi.spyOn(server.sim, 'freeholdEnter');
    const leave = vi.spyOn(server.sim, 'freeholdLeave');

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter', rid: 71 }));
    expect(enter).not.toHaveBeenCalled();
    expect(fc.sent.filter((m) => m.t === 'commandOutcome')).toEqual([
      { t: 'commandOutcome', rid: 71, ok: false },
    ]);
    // The jail notice, not the flag counter: the realm is lit, so nothing is
    // booked against the dark-housing series.
    expect(refusals.count()).toBe(0);

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_leave', rid: 72 }));
    expect(leave).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledWith(pid);
    expect(fc.sent.filter((m) => m.t === 'commandOutcome' && m.rid === 72)).toEqual([]);
  });
});

describe('freeholds wire: the ops contract and the game.ts shape', () => {
  it('the flag is pinned in its ops surfaces', () => {
    // A six-place contract (server/freehold_config.ts, server/sim_boot_config.ts,
    // .env.example, DEPLOY.md, turbo.json, this suite); a rename must not
    // leave the ops half stale.
    expect(repoFile('.env.example')).toContain('#FREEHOLDS_ENABLED=1');
    // The live-versus-boot sentence is pinned on both ops surfaces, so the
    // .env.example prose cannot drift back to "the realm reads it live".
    expect(repoFile('.env.example').replace(/^#\s?/gm, '').replace(/\s+/g, ' ')).toContain(
      'the realm Sim snapshots it at boot, so a running realm needs a restart',
    );
    const deploy = repoFile('DEPLOY.md').replace(/\s+/g, ' ');
    expect(deploy).toContain(
      '`FREEHOLDS_ENABLED` defaults off, is read live as the strict \'1\', and production never enables it before the release gates in docs/freeholds/state.md "Tracked release and handoff gates" are signed',
    );
    const turbo = JSON.parse(repoFile('turbo.json')) as { globalPassThroughEnv: string[] };
    expect(turbo.globalPassThroughEnv).toContain('FREEHOLDS_ENABLED');
  });

  it('every housing token has a case label, and the refusal sits above the heavy-self mark', () => {
    const src = codeOnly(repoFile('server/game.ts'));
    const refusal = src.indexOf('refusedFreeholdCommand(msg)');
    const mark = src.indexOf('heavySelfMarkOnReceipt(msg.cmd)');
    expect(refusal, 'the pre-switch predicate call').toBeGreaterThanOrEqual(0);
    expect(mark, 'the heavy-self receipt mark').toBeGreaterThanOrEqual(0);
    // Refused ABOVE the mark, textually: a blocked frame can never re-arm the diff.
    expect(refusal).toBeLessThan(mark);
    const sw = src.indexOf('switch (command)', mark);
    expect(sw, 'the command switch follows the mark').toBeGreaterThan(mark);
    for (const cmd of FREEHOLD_WIRE_COMMANDS) {
      const label = src.indexOf(`case '${cmd}':`, sw);
      expect(label, `case label for ${cmd}`).toBeGreaterThan(sw);
    }
    // The labels route through the sibling, never an inline body.
    expect(src).toContain('dispatchFreeholdCommand(sim, session, command, msg, pid)');
  });
});

describe('the owner key: minted server-side from the session account (D15)', () => {
  it('freeholdOwnerKeyForAccount is the literal account:<id>', () => {
    expect(freeholdOwnerKeyForAccount(42)).toBe('account:42');
    expect(freeholdOwnerKeyForAccount(1)).toBe('account:1');
    expect(freeholdOwnerKeyForAccount(Number.MAX_SAFE_INTEGER)).toBe('account:9007199254740991');
  });

  it.each([
    ['zero', 0],
    ['negative', -7],
    ['fractional', 1.5],
    ['NaN', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['past the safe-integer range', 2 ** 53],
  ])('refuses a %s account id by throwing, never a shared sentinel key', (_why, id) => {
    // `account:NaN` would let every malformed session claim ONE house
    // together; the id is a database row fact, so a bad one is a programming
    // error the join must surface, not launder.
    expect(() => freeholdOwnerKeyForAccount(id)).toThrow(/positive account id/);
  });

  it('game.ts stamps the key from the join accountId at exactly one addPlayer call', () => {
    const src = codeOnly(repoFile('server/game.ts'));
    // The join derives the key ONCE, from its own accountId parameter (the
    // authenticated session), into a local the three call sites below share.
    // The persistence work gave it a name because retain, addPlayer and the
    // failure release all need the same value; what must not change is where
    // that value comes from. A key read off a meta field a client-supplied join
    // payload could shape would let a caller claim another account's house.
    // THE DERIVATION MOVED, not the rule. server/freehold_session_binding.ts
    // computes it, from the join's own accountId, and hands it back so the join
    // has exactly one value; game.ts no longer spells the deriver at all, and
    // the leave path READS the key off the session rather than re-deriving it.
    const binding = codeOnly(repoFile('server/freehold_session_binding.ts'));
    expect(
      binding.split('freeholdOwnerKeyForAccount(accountId)').length - 1,
      'derived exactly once, from accountId',
    ).toBe(1);
    expect(src.split('freeholdOwnerKeyForAccount(').length - 1, 'never derived in game.ts').toBe(0);

    const derive = 'const freeholdOwnerKey = bindFreeholdOnJoin(';
    const joinBody = methodBody(src, '  join(');
    const derived = joinBody.indexOf(derive);
    const call = joinBody.indexOf('this.sim.addPlayer(');
    expect(derived, 'the derivation sits in join').toBeGreaterThanOrEqual(0);
    expect(call, 'the addPlayer call').toBeGreaterThanOrEqual(0);
    expect(derived, 'derived before it is used').toBeLessThan(call);
    // The stamp itself is the shared local, passed by shorthand.
    expect(balancedCall(joinBody, call + 'this.sim.addPlayer'.length)).toContain(
      'freeholdOwnerKey,',
    );
    expect(src.replace(/\s+/g, ' ')).toContain(
      "import { dispatchFreeholdCommand, refusedFreeholdCommand, refusedJailedTravelCommand, } from './freehold_wire';",
    );
    // NO OTHER SPELLING of the stamp: a second, differently keyed one would let
    // two call sites disagree about who owns the plot. The only other use of
    // the deriver in this file is the leave path, which keys on the SESSION's
    // account rather than a join parameter, and is named here so it cannot be
    // mistaken for a second stamp.
    // The ONE property-form use is the session field the join stamps and the
    // leave path reads back, which is the SAME value rather than a second stamp:
    // it is assigned by shorthand from the one local above.
    expect(src.split('freeholdOwnerKey:').length - 1, 'one property-form use').toBe(1);
    expect(src).toContain('readonly freeholdOwnerKey: string;');
    expect(src).toContain('const freeholdOwnerKey = session.freeholdOwnerKey;');
    // ZERO in the coordinator now: the deriver lives in the binding module and
    // the leave path reads the key the join stamped.
    expect(src.split('freeholdOwnerKeyForAccount(').length - 1, 'no call sites here').toBe(0);
    expect(
      binding.split('freeholdOwnerKeyForAccount(').length - 1,
      'one call site, in the binding',
    ).toBe(1);
    expect(src).toContain('const freeholdOwnerKey = session.freeholdOwnerKey;');
  });

  it('the stamped key is the session account, observed live: one account, two characters, one key', () => {
    process.env.FREEHOLDS_ENABLED = '1';
    const server = new GameServer();
    // The per-account live-session cap admits a second character only for a
    // GM, which is the exemption that makes two concurrent sessions possible.
    const a = server.join(fakeWs().ws, 4242, 424201, 'Ari', 'warrior', null, true);
    const b = server.join(fakeWs().ws, 4242, 424202, 'Bo', 'mage', null, true);
    const c = server.join(fakeWs().ws, 4343, 434301, 'Cy', 'rogue', null, true);
    if ('error' in a || 'error' in b || 'error' in c) throw new Error('join refused');
    expect(server.sim.meta(a.pid)?.freeholdOwnerKey).toBe('account:4242');
    expect(server.sim.meta(b.pid)?.freeholdOwnerKey).toBe('account:4242');
    expect(server.sim.meta(c.pid)?.freeholdOwnerKey).toBe('account:4343');
  });
});

describe('freeholds wire: the two lit arms read nothing off the frame', () => {
  const SMUGGLED = {
    ownerKey: 'account:999',
    freeholdOwnerKey: 'account:999',
    accountId: 999,
    characterId: 999,
    pid: 999,
    slot: 3,
    x: 1,
    z: 2,
  };

  it.each([
    ['freehold_enter', 'freeholdEnter'],
    ['freehold_leave', 'freeholdLeave'],
  ] as const)(
    '%s reaches %s with the session pid and NOTHING else, whatever the frame carries',
    (cmd, method) => {
      process.env.FREEHOLDS_ENABLED = '1';
      const refusals = recordingRefusalSink();
      const { server, fc, session, pid } = housingSession();
      const target = vi.spyOn(server.sim, method);
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd, ...SMUGGLED, rid: 93 }));
      expect(target).toHaveBeenCalledTimes(1);
      // Exactly one argument, the session's own pid: no smuggled owner, account
      // or pid field reaches the sim through this arm.
      expect(target.mock.calls[0]).toEqual([pid]);
      expect(refusals.count()).toBe(0);
      expect(fc.sent.filter((m) => m.t === 'commandOutcome' && m.ok === false)).toEqual([]);
    },
  );

  it('the other eight arms still reach nothing in the sim: no claim, no move, no event, no rng draw', () => {
    process.env.FREEHOLDS_ENABLED = '1';
    const { server, session, pid } = housingSession();
    const key = `account:${session.accountId}`;
    const p = server.sim.entities.get(pid);
    if (!p) throw new Error('no player entity');
    const before = { ...p.pos };
    let draws = 0;
    server.sim.rng.setObserver(() => {
      draws++;
    });
    server.sim.drainEvents();
    const darkArms = TEN_TOKENS.filter((c) => c !== 'freehold_enter' && c !== 'freehold_leave');
    expect(darkArms).toHaveLength(8);
    for (const cmd of darkArms) {
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd, ...WELL_FORMED[cmd] }));
    }
    expect(server.sim.instances.filter((i) => i.partyKey === key)).toEqual([]);
    expect(p.pos).toEqual(before);
    expect(server.sim.drainEvents()).toEqual([]);
    expect(draws).toBe(0);
    p.pos = server.sim.ctx.groundPos(GATE.x, GATE.z);
    // The positive control that the four "nothing" reads above can move: the
    // live enter arm through the same session claims a slot and moves the
    // player into the Inn Room band (instanceOriginX(15) = 119200, +/- 300).
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter' }));
    server.sim.rng.setObserver(null);
    expect(server.sim.instances.filter((i) => i.partyKey === key)).toHaveLength(1);
    expect(p.pos.x).toBeGreaterThanOrEqual(118900);
    expect(p.pos.x).toBeLessThan(119500);
  });
});

describe('Freehold Gate and Hearth Key real server dispatch', () => {
  it.each(['dark boot', 'lit boot then disabled'])(
    '%s returns exact requester-only denial before gate or item dispatch',
    (boot) => {
      vi.stubEnv('FREEHOLDS_ENABLED', boot === 'dark boot' ? '0' : '1');
      const { server, session, pid, fc } = housingSession();
      const other = fakeWs();
      joinServer(server, other, 7202, 'Observer');
      server.sim.addItem('hearth_key', 1, pid);
      const use = vi.spyOn(server.sim, 'useItem');
      const enter = vi.spyOn(server.sim, 'freeholdEnter');
      expect([...server.sim.entities.values()].some((e) => e.templateId === 'freehold_gate')).toBe(
        boot !== 'dark boot',
      );
      vi.stubEnv('FREEHOLDS_ENABLED', '0');
      session.selfHeavyDirty = false;
      fc.sent.length = 0;
      other.sent.length = 0;
      server.sim.drainEvents();
      const before = { ...server.sim.entities.get(pid)!.pos };
      server.handleMessage(
        session,
        JSON.stringify({
          t: 'cmd',
          cmd: 'use',
          item: 'hearth_key',
          ownerKey: 'account:1',
          rid: 700,
        }),
      );
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter' }));
      const denied = {
        t: 'events',
        list: [{ type: 'freeholdDenied', pid, reason: 'no_freehold' }],
      };
      expect(fc.sent).toEqual([denied, { t: 'commandOutcome', rid: 700, ok: false }, denied]);
      expect(other.sent).toEqual([]);
      expect(server.sim.drainEvents()).toEqual([]);
      expect(use).not.toHaveBeenCalled();
      expect(enter).not.toHaveBeenCalled();
      expect(session.selfHeavyDirty).toBe(false);
      expect(server.sim.entities.get(pid)!.pos).toEqual(before);
      expect(server.sim.freeholdKeyReadyAtMs.size).toBe(0);
    },
  );
  it('enabled physical confirmation enters own room and grants the permanent key', () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const { server, session, pid } = housingSession();
    const player = server.sim.entities.get(pid)!;
    const gate = [...server.sim.entities.values()].find((e) => e.templateId === 'freehold_gate')!;
    player.pos = { ...gate.pos };
    session.selfHeavyDirty = false;
    server.sim.drainEvents();
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'freehold_enter', ownerKey: 'account:1' }),
    );
    const claim = server.sim.instances.find(
      (i) => i.exitId === server.sim.ctx.instanceClaimIdAt(player.pos),
    );
    expect(claim?.partyKey).toBe(freeholdOwnerKeyForAccount(session.accountId));
    expect(server.sim.countItem('hearth_key', pid)).toBe(1);
    expect(session.selfHeavyDirty).toBe(true);
    expect(server.sim.freeholdKeyReadyAtMs.size).toBe(0);
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_leave' }));
    server.sim.drainEvents();
    const before = { ...player.pos };
    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'use', item: 'hearth_key' }));
    expect(player.pos).toEqual(before);
    expect(server.sim.drainEvents()).toContainEqual({
      type: 'freeholdDenied',
      pid,
      reason: 'busy',
    });
    expect(server.sim.freeholdKeyReadyAtMs.size).toBe(0);
  });
  it('an explicitly injected test participant reaches remote entry through real use dispatch', () => {
    vi.stubEnv('FREEHOLDS_ENABLED', '1');
    const { server, session, pid } = housingSession();
    const admission = vi.fn(() => true);
    server.sim.cfg.freeholdKeyAdmission = admission;
    server.sim.cfg.lockoutNowMs = () => 5000;
    server.sim.addItem('hearth_key', 1, pid);
    server.sim.drainEvents();
    server.handleMessage(
      session,
      JSON.stringify({ t: 'cmd', cmd: 'use', item: 'hearth_key', accountId: 1 }),
    );
    expect(admission).toHaveBeenCalledExactlyOnceWith(
      freeholdOwnerKeyForAccount(session.accountId),
      pid,
    );
    expect(server.sim.ctx.instanceClaimIdAt(server.sim.entities.get(pid)!.pos)).not.toBeNull();
    expect(server.sim.freeholdKeyReadyAtMs.get(freeholdOwnerKeyForAccount(session.accountId))).toBe(
      3605000,
    );
    expect(server.sim.countItem('hearth_key', pid)).toBe(1);
    // This participant is deliberately test-only. The stock realm case above
    // remains refused until durable remote-key account authority lands in 07a.
  });
  it.each([{ cmd: 'freehold_enter' }, { cmd: 'use', item: 'hearth_key' }])(
    'jailed $cmd returns only the personal busy denial and changes no travel state',
    (frame) => {
      vi.stubEnv('FREEHOLDS_ENABLED', '1');
      const { server, session, pid, fc } = housingSession();
      const other = fakeWs();
      joinServer(server, other, 7202, 'Observer');
      // Drive the production jail transition: both the session and Sim entity
      // are jailed, and the player really occupies the cage.
      (
        server as unknown as {
          jailSession(moderator: typeof session, target: typeof session, minutes: number): void;
        }
      ).jailSession(session, session, 10);
      const player = server.sim.entities.get(pid)!;
      expect(session.jailed).not.toBeNull();
      expect(player.jailed).toBe(true);
      expect(isInJailCage(player.pos)).toBe(true);
      server.sim.addItem('hearth_key', 1, pid);
      const ownerKey = freeholdOwnerKeyForAccount(session.accountId);
      server.sim.freeholdKeyReadyAtMs.set(ownerKey, 9999999);
      const admission = vi.fn(() => true);
      server.sim.cfg.freeholdKeyAdmission = admission;
      const use = vi.spyOn(server.sim, 'useItem');
      const enter = vi.spyOn(server.sim, 'freeholdEnter');
      const state = () => ({
        position: player.pos,
        entrySeq: player.dungeonEntrySeq,
        claims: server.sim.instances,
        plots: [...server.sim.ctx.freeholds],
        inventory: server.sim.meta(pid)!.inventory,
        deadlines: [...server.sim.freeholdKeyReadyAtMs],
        wireRev: server.sim.meta(pid)!.wireRev,
      });
      const before = structuredClone(state());
      session.selfHeavyDirty = false;
      server.sim.drainEvents();
      fc.sent.length = 0;
      other.sent.length = 0;
      server.handleMessage(
        session,
        JSON.stringify({ t: 'cmd', ...frame, ownerKey: 'account:1', pid: 1, rid: 701 }),
      );
      expect(fc.sent).toEqual([
        { t: 'events', list: [{ type: 'freeholdDenied', pid, reason: 'busy' }] },
        { t: 'commandOutcome', rid: 701, ok: false },
      ]);
      expect(other.sent).toEqual([]);
      expect(server.sim.drainEvents()).toEqual([]);
      expect(use).not.toHaveBeenCalled();
      expect(enter).not.toHaveBeenCalled();
      expect(admission).not.toHaveBeenCalled();
      expect(state()).toEqual(before);
      expect(session.selfHeavyDirty).toBe(false);
    },
  );

  it.each(['dark realm', 'jailed on lit realm'])(
    '%s preserves an unrelated item effect despite forged housing fields',
    (context) => {
      vi.stubEnv('FREEHOLDS_ENABLED', context === 'dark realm' ? '0' : '1');
      const { server, session, pid, fc } = housingSession();
      if (context === 'jailed on lit realm') {
        (
          server as unknown as {
            jailSession(moderator: typeof session, target: typeof session, minutes: number): void;
          }
        ).jailSession(session, session, 10);
      }
      const player = server.sim.entities.get(pid)!;
      player.hp = 1;
      server.sim.addItem('minor_healing_potion', 1, pid);
      const slot = server.sim
        .meta(pid)!
        .inventory.findIndex((item) => item.itemId === 'minor_healing_potion');
      const before = structuredClone({
        position: player.pos,
        claims: server.sim.instances,
        plots: [...server.sim.ctx.freeholds],
      });
      const admission = vi.fn(() => true);
      server.sim.cfg.freeholdKeyAdmission = admission;
      const use = vi.spyOn(server.sim, 'useItem');
      const refusals = recordingRefusalSink();
      server.sim.drainEvents();
      fc.sent.length = 0;
      server.handleMessage(
        session,
        JSON.stringify({
          t: 'cmd',
          cmd: 'use',
          item: 'minor_healing_potion',
          slot,
          itemId: 'hearth_key',
          use: { type: 'freeholdEnter' },
          ownerKey: 'account:1',
          rid: 702,
        }),
      );
      expect(use).toHaveBeenCalledExactlyOnceWith('minor_healing_potion', pid, slot);
      expect(player.hp).toBeGreaterThan(1);
      expect(server.sim.countItem('minor_healing_potion', pid)).toBe(0);
      expect(server.sim.countItem('hearth_key', pid)).toBe(0);
      expect({
        position: player.pos,
        claims: server.sim.instances,
        plots: [...server.sim.ctx.freeholds],
      }).toEqual(before);
      expect(server.sim.freeholdKeyReadyAtMs.size).toBe(0);
      expect(admission).not.toHaveBeenCalled();
      expect(refusals.count()).toBe(0);
      expect(server.sim.drainEvents().filter((event) => event.type === 'freeholdDenied')).toEqual(
        [],
      );
      expect(fc.sent).toEqual([]);
    },
  );

  it.each(['no key', 'wrong selected item'])(
    'a forged key use with %s cannot authorize travel or consume another item',
    (inventory) => {
      vi.stubEnv('FREEHOLDS_ENABLED', '1');
      const { server, session, pid } = housingSession();
      server.sim.addItem('minor_healing_potion', 1, pid);
      if (inventory === 'wrong selected item') server.sim.addItem('hearth_key', 1, pid);
      const meta = server.sim.meta(pid)!;
      const slot =
        inventory === 'wrong selected item'
          ? meta.inventory.findIndex((item) => item.itemId === 'minor_healing_potion')
          : undefined;
      const admission = vi.fn(() => true);
      server.sim.cfg.freeholdKeyAdmission = admission;
      const player = server.sim.entities.get(pid)!;
      const state = () => ({
        position: player.pos,
        entrySeq: player.dungeonEntrySeq,
        inventory: meta.inventory,
        claims: server.sim.instances,
        plots: [...server.sim.ctx.freeholds],
        deadlines: [...server.sim.freeholdKeyReadyAtMs],
      });
      const before = structuredClone(state());
      const use = vi.spyOn(server.sim, 'useItem');
      server.handleMessage(
        session,
        JSON.stringify({ t: 'cmd', cmd: 'use', item: 'hearth_key', slot, accountId: 1 }),
      );
      expect(use).toHaveBeenCalledExactlyOnceWith('hearth_key', pid, slot);
      expect(admission).not.toHaveBeenCalled();
      expect(state()).toEqual(before);
    },
  );
});

describe('Freehold Gate inventory change drives heavy self snapshots', () => {
  it.each(['refusal', 'existing key', 'full bags', 'new key'])(
    '%s refreshes heavy self only for a newly granted key',
    (outcome) => {
      vi.stubEnv('FREEHOLDS_ENABLED', '1');
      vi.stubEnv('SELF_SNAPSHOT_FULL', '0');
      const { server, session, pid, fc } = housingSession();
      const player = server.sim.entities.get(pid)!;
      const meta = server.sim.meta(pid)!;
      const gate = [...server.sim.entities.values()].find((e) => e.templateId === 'freehold_gate')!;
      if (outcome !== 'refusal') player.pos = { ...gate.pos };
      if (outcome === 'existing key') server.sim.addItem('hearth_key', 1, pid);
      if (outcome === 'full bags') {
        meta.inventory.splice(
          0,
          meta.inventory.length,
          ...Array.from({ length: bagCapacity(meta.bags) }, () => ({
            itemId: 'masters_field_forge',
            count: 1,
          })),
        );
        expect(server.sim.canAddItem('hearth_key', 1, pid)).toBe(false);
      }
      // The heavy block invokes this projection even when delta serialization
      // drops identical bytes. Observe work as well as the resulting payload.
      const heavyProjection = vi.spyOn(server.sim, 'ownedMountsFor');
      server.sim.tickCount = 40 - (pid % 40) + 1;
      broadcast(server);
      expect(heavyProjection).toHaveBeenCalledExactlyOnceWith(pid);
      expect(lastSnap(fc.sent).self.inv).toEqual(meta.inventory);
      expect(session.selfHeavyDirty).toBe(false);
      const beforeInventory = structuredClone(meta.inventory);
      const beforePosition = { ...player.pos };
      heavyProjection.mockClear();
      server.sim.drainEvents();
      fc.sent.length = 0;
      server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter' }));
      const events = server.sim.drainEvents();
      (
        server as unknown as {
          routeEvents(events: ReturnType<Sim['drainEvents']>): void;
        }
      ).routeEvents(events);
      broadcast(server);
      expect(heavyProjection).toHaveBeenCalledTimes(outcome === 'new key' ? 1 : 0);
      if (outcome === 'new key') {
        expect(lastSnap(fc.sent).self.inv).toEqual(meta.inventory);
        expect(lastSnap(fc.sent).self.inv).toContainEqual({ itemId: 'hearth_key', count: 1 });
      } else {
        expect(lastSnap(fc.sent).self.inv).toBeUndefined();
        expect(meta.inventory).toEqual(beforeInventory);
      }
      if (outcome === 'refusal') {
        expect(player.pos).toEqual(beforePosition);
        expect(events).toEqual([{ type: 'freeholdDenied', pid, reason: 'busy' }]);
      } else {
        const claim = server.sim.instances.find(
          (instance) => instance.exitId === server.sim.ctx.instanceClaimIdAt(player.pos),
        );
        expect(claim?.partyKey).toBe(freeholdOwnerKeyForAccount(session.accountId));
        expect(player.pos).not.toEqual(beforePosition);
      }
      heavyProjection.mockClear();
      broadcast(server);
      expect(heavyProjection).not.toHaveBeenCalled();
      expect(lastSnap(fc.sent).self.inv).toBeUndefined();
    },
  );
});

it('silently sheds a live gate command and recovers only after a fresh user confirmation', () => {
  vi.stubEnv('FREEHOLDS_ENABLED', '1');
  const window = new Window();
  vi.stubGlobal('document', window.document);
  vi.stubGlobal('HTMLElement', window.HTMLElement);
  try {
    const { server, session, fc, pid } = housingSession();
    const player = server.sim.entities.get(pid)!;
    const gate = [...server.sim.entities.values()].find((e) => e.templateId === 'freehold_gate')!;
    player.pos = { ...gate.pos };
    server.sim.drainEvents();
    fc.sent.length = 0;
    session.selfHeavyDirty = false;
    const delivered: string[] = [];
    const client = bareClient(pid, {
      cfg: { seed: 42, playerClass: 'warrior', freeholdsEnabled: true },
      ws: {
        readyState: 1,
        send: (raw: string) => {
          delivered.push(raw);
          server.handleMessage(session, raw);
        },
      },
    });
    const snapshot = () =>
      (client as unknown as { applySnapshot(value: unknown): void }).applySnapshot({
        t: 'snap',
        tick: 1,
        time: 1,
        self: {
          id: pid,
          k: 'player',
          tid: 'warrior',
          nm: 'Fen',
          lv: 1,
          x: player.pos.x,
          y: player.pos.y,
          z: player.pos.z,
          f: 0,
          hp: 100,
          mhp: 100,
          de: player.dungeonEntrySeq ?? 0,
        },
        ents: [
          {
            id: gate.id,
            k: 'object',
            tid: 'freehold_gate',
            nm: 'Freehold Gate',
            x: gate.pos.x,
            y: gate.pos.y,
            z: gate.pos.z,
            f: 0,
            hp: 1,
            mhp: 1,
          },
        ],
      });
    snapshot();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const prompt = new FreeholdGatePrompt({
      root: () => root,
      world: () => client,
      closeOthers: () => {},
      captureFocus: () => null,
      restoreFocus: () => {},
      onVisibilityChange: () => {},
    });
    const enter = () =>
      root.querySelector<HTMLButtonElement>('[data-focus-key="gate-enter"]')!.click();
    session.msgLanes.commandTokens = 0;
    session.msgLanes.lastRefillSec = Number.POSITIVE_INFINITY;
    const authority = vi.spyOn(server.sim, 'freeholdEnter');
    const before = { ...player.pos };
    prompt.open();
    enter();
    expect(client.connected).toBe(true);
    expect(delivered).toHaveLength(1);
    expect(authority).not.toHaveBeenCalled();
    expect(fc.sent).toEqual([]);
    expect(server.sim.drainEvents()).toEqual([]);
    expect(session.selfHeavyDirty).toBe(false);
    expect(player.pos).toEqual(before);
    expect(root.getAttribute('aria-busy')).toBe('true');
    prompt.close();
    prompt.open();
    expect(delivered).toHaveLength(1);
    expect(root.getAttribute('aria-busy')).toBe('false');
    session.msgLanes.commandTokens = 1;
    enter();
    expect(delivered).toHaveLength(2);
    expect(authority).toHaveBeenCalledTimes(1);
    expect(player.pos).not.toEqual(before);
    snapshot();
    prompt.reconcile();
    expect(prompt.isOpen).toBe(false);
    expect(client.player.pos.x).toBe(player.pos.x);
  } finally {
    vi.unstubAllGlobals();
  }
});
