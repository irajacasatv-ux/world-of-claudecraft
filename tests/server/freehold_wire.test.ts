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
//  - dark: each of the ten commands refuses BEFORE the sim (the stub is never
//    invoked), answers ok:false on the commandOutcome ack channel for rid
//    frames AND stays refused for the rid-less frame shape an attacker
//    actually sends, books one freeholdRefused metric per attempt, and never
//    sets the heavy-self dirty flag. Read that last one precisely: no housing
//    token is a heavy-self member yet, so the per-command flag assertions
//    cannot fail on their own. What carries the criterion is the SOURCE
//    ordering pin (the refusal sits above the receipt mark) plus the pinned
//    premise that both heavy-self sets are housing-free, with a receipt-marked
//    member (inv_sort) as the control that the flag is observable at all;
//    a non-housing command through the same wiring is untouched by this
//    predicate, and an unrecognised token lands in the default arm (proved by
//    its unknown_command protocol anomaly) with no kick and no housing
//    refusal (the old-server arm);
//  - lit: a well-formed frame per token reaches the matching Sim stub once
//    with the guarded args and the session pid, with no refusal count and no
//    heavy-self mark; a malformed payload per typed field is refused at the
//    type boundary and invokes nothing;
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
import { inertVaultConsumptionAdmission } from '../../src/sim/sim_context';
import { COMMAND_FACETS, type CommandName } from '../../src/world_api';
import { fakeWs, joinServer } from '../helpers/bare_client';

type HousingCommand = (typeof FREEHOLD_WIRE_COMMANDS)[number];

/** Strip block and line comments (keeping a `://` in a URL intact) before a
 *  source scan counts anything, so prose describing a call cannot satisfy it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

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
  // default. One row per field of the four-field presence frame.
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
    // counting env pins both dark-wire gates here.
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
    expect(refusedRiftForgeCommand('rift_upgrade_item', countingEnv)).toBe(true);
    expect(reads).toBe(1);
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

  it('no housing token is a heavy-self member, which is WHY the mark assertions above are safe', () => {
    // Honest statement of what the twenty `selfHeavyDirty` assertions in this
    // file can and cannot prove. Neither heavy-self set contains a housing
    // token today, so those assertions cannot fail on their own: what actually
    // carries the acceptance criterion is the source-ordering pin below (the
    // refusal sits above the receipt mark) plus this premise. Pinning the
    // premise means the day a housing command joins either set, THIS arm reds
    // and forces the vacuous assertions to be rewritten as real ones instead
    // of silently staying green against a member that now marks.
    expect(FREEHOLD_WIRE_COMMANDS.filter((c) => heavySelfMarkOnReceipt(c))).toEqual([]);
    expect(FREEHOLD_WIRE_COMMANDS.filter((c) => heavySelfMarkOnAccept(c))).toEqual([]);
    // The corollary, stated so it is not mistaken for coverage: the
    // `&& heavySelfMarkOnAccept(command)` arm of the game.ts housing case group
    // is therefore unreachable today and its true branch has no test. It is
    // deliberate forward scaffolding for the first arm-marked housing member.
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
    // token is a HEAVY_SELF_CMDS member today, so this control drives a real
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

describe('freeholds wire: lit realm dispatch reaches the dark Sim stubs', () => {
  it.each(TEN_TOKENS)(
    '%s: a well-formed frame invokes the Sim stub once with the guarded args and the pid',
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
      // No gate refusal: no ok:false ack, no count, and (every housing member
      // being a dark no-op today, none is a heavy-self member) no dirty mark.
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
    // argument) and the editor viewport stay dark by design, so main.ts
    // gates the flag like its two sibling live-world flags. Every `new Sim(`
    // in each file is counted so a second construction cannot slip past the
    // pin unread.
    const expected: ReadonlyArray<[string, string]> = [
      ['src/main.ts', 'freeholdsEnabled: world === undefined'],
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
  });
});

describe('freeholds wire: a jailed session cannot step through its own door', () => {
  /** The JAILED_BLOCKED_COMMANDS Set literal, comment-stripped. */
  function jailedSetLiteral(): string {
    const src = codeOnly(repoFile('server/game.ts'));
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

    server.handleMessage(session, JSON.stringify({ t: 'cmd', cmd: 'freehold_enter', rid: 81 }));

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
    const refusal = src.indexOf('refusedFreeholdCommand(msg.cmd)');
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
