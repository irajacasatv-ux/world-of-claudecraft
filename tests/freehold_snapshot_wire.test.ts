// The housing foundation's online half: the freehold self-wire decode home
// (src/net/freehold_snapshot_wire.ts) and the IWorldHousing surface on
// ClientWorld. Everything is dark by design (no key admitted, every mirror
// null, every command a bare send), so these pins hold the SHAPE still while
// later work lights the bodies: the empty allowlist, the delta contract (an
// early or unknown housing key never wipes a mirror or rejects a frame), the
// exact wire payload of all ten senders through the REAL send path, and the
// command table rows the senders rely on.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  applyFreeholdSelfWire,
  applyWithDecoders,
  FREEHOLD_SELF_KEYS,
  type FreeholdSelfDecoder,
  type FreeholdSelfMirrors,
} from '../src/net/freehold_snapshot_wire';
import type { ClientWorld } from '../src/net/online';
import type { FreeholdLayoutView, FreeholdView } from '../src/sim/freehold/types';
import { asFreeholdPlotId } from '../src/sim/freehold/types';
import { COMMAND_FACETS, COMMAND_NAMES } from '../src/world_api';
import { bareClient } from './helpers/bare_client';

/** The ten housing wire tokens in COMMAND_NAMES order (append-only there). */
const HOUSING_COMMANDS = [
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
] as const;

function playerWire(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    k: 'player',
    tid: 'warrior',
    nm: 'Freeholder',
    lv: 20,
    x: 0,
    y: 0,
    z: 0,
    f: 0,
    hp: 100,
    mhp: 100,
    ...extra,
  };
}

/** Drive the real applySnapshot with one self record (the bank wire harness). */
function apply(client: ClientWorld, extra: Record<string, unknown> = {}): void {
  (client as unknown as { applySnapshot(value: unknown): void }).applySnapshot({
    t: 'snap',
    tick: 1,
    ents: [],
    self: playerWire(extra),
  });
}

/** A bare online client wired to the REAL send path (cmd -> rawCmd -> ws.send),
 *  recording every parsed frame; a key rename on the sender reddens here. */
function sendingClient(): { client: ClientWorld; sent: Record<string, unknown>[] } {
  const sent: Record<string, unknown>[] = [];
  const client = bareClient(1);
  (client as unknown as { ws: unknown }).ws = {
    readyState: 1,
    send: (payload: string) => sent.push(JSON.parse(payload) as Record<string, unknown>),
  };
  return { client, sent };
}

/** Strip block and line comments (keeping a `://` in a URL intact) before a
 *  source scan counts anything, so prose describing a call cannot satisfy it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function nullMirrors(): FreeholdSelfMirrors {
  return { myFreehold: null, freeholdLayout: null, freeholdTransitionId: null };
}

function freeholdView(): FreeholdView {
  return { plotId: asFreeholdPlotId('plot-7'), tier: 'cottage', visitPolicy: 'friends' };
}

function layoutView(): FreeholdLayoutView {
  return {
    plotId: asFreeholdPlotId('plot-7'),
    rows: [{ placementId: 1, itemId: 'oak_chair', x: 1, y: 0, z: 2, yaw: 0 }],
  };
}

describe('freehold self wire: the empty allowlist', () => {
  it('admits no housing self key yet', () => {
    expect(FREEHOLD_SELF_KEYS).toEqual([]);
  });

  it.each([
    ['a housing-shaped object', { freehold: { plotId: 'x' } }],
    ['a layout-shaped object', { fhlayout: { plotId: 'x', rows: [] } }],
    ['a null', { freehold: null }],
    ['an array', { freehold: [] }],
    ['a string', { freehold: 'plot-7' }],
    [
      'a whole housing-looking record',
      { freehold: { plotId: 'x' }, fhlayout: null, fhtrans: 't1' },
    ],
  ])(
    'ignores %s under an unknown key without throwing and without touching a mirror',
    (_label, self) => {
      const target: FreeholdSelfMirrors = {
        myFreehold: null,
        freeholdLayout: null,
        freeholdTransitionId: null,
      };
      expect(() => applyFreeholdSelfWire(target, self)).not.toThrow();
      expect(target).toEqual({
        myFreehold: null,
        freeholdLayout: null,
        freeholdTransitionId: null,
      });
    },
  );

  it('retains a populated mirror BY REFERENCE when the frame omits or mis-shapes the key (the delta contract)', () => {
    const view = freeholdView();
    const layout = layoutView();
    const target: FreeholdSelfMirrors = {
      myFreehold: view,
      freeholdLayout: layout,
      freeholdTransitionId: 'transition-3',
    };
    applyFreeholdSelfWire(target, {});
    applyFreeholdSelfWire(target, { freehold: { plotId: 'other' }, fhlayout: 'junk' });
    expect(target.myFreehold).toBe(view);
    expect(target.freeholdLayout).toBe(layout);
    expect(target.freeholdTransitionId).toBe('transition-3');
  });
});

describe('the decode walk (applyWithDecoders, the seam applyFreeholdSelfWire delegates to)', () => {
  // The production allowlist is empty, so nothing above can reach the loop
  // through applyFreeholdSelfWire: every arm in the first block would stay
  // green with the walk deleted outright. These arms drive the walk with a
  // fake admitted key and hold the loop's own rules still: fire once per
  // present value, skip undefined as UNCHANGED, never look at an unadmitted
  // key.
  function walk() {
    const calls: unknown[] = [];
    const decoder: FreeholdSelfDecoder = (target, value) => {
      calls.push(value);
      if (typeof value === 'string') target.freeholdTransitionId = value;
    };
    return { calls, decoder, target: nullMirrors() };
  }

  it('fires the admitted key decoder exactly once for a present value, and its write lands on the target', () => {
    const { calls, decoder, target } = walk();
    applyWithDecoders(target, { fhtrans: 'transition-9' }, ['fhtrans'], { fhtrans: decoder });
    expect(calls).toEqual(['transition-9']);
    expect(target.freeholdTransitionId).toBe('transition-9');
  });

  it('skips an omitted value (absent or undefined): omission is UNCHANGED, never a decode', () => {
    const { calls, decoder, target } = walk();
    target.freeholdTransitionId = 'kept';
    applyWithDecoders(target, {}, ['fhtrans'], { fhtrans: decoder });
    applyWithDecoders(target, { fhtrans: undefined }, ['fhtrans'], { fhtrans: decoder });
    expect(calls).toEqual([]);
    expect(target.freeholdTransitionId).toBe('kept');
  });

  it('hands a present null to the decoder to judge: only undefined means omitted', () => {
    const { calls, decoder, target } = walk();
    applyWithDecoders(target, { fhtrans: null }, ['fhtrans'], { fhtrans: decoder });
    expect(calls).toEqual([null]);
  });

  it('never reaches a decoder for a key the allowlist does not admit, whatever the frame carries', () => {
    const { calls, decoder, target } = walk();
    const stray: unknown[] = [];
    const strayDecoder: FreeholdSelfDecoder = (_target, value) => {
      stray.push(value);
    };
    applyWithDecoders(target, { fhtrans: 'transition-9', freehold: { plotId: 'x' } }, ['fhtrans'], {
      fhtrans: decoder,
      freehold: strayDecoder,
    });
    expect(calls).toEqual(['transition-9']);
    expect(stray).toEqual([]);
    expect(target.myFreehold).toBeNull();
  });

  it('walks the admitted keys in list order and skips an admitted key with no decoder', () => {
    const order: string[] = [];
    const tag =
      (name: string): FreeholdSelfDecoder =>
      () => {
        order.push(name);
      };
    const target = nullMirrors();
    expect(() =>
      applyWithDecoders(target, { second: 1, first: 1, orphan: 1 }, ['first', 'orphan', 'second'], {
        first: tag('first'),
        second: tag('second'),
      }),
    ).not.toThrow();
    expect(order).toEqual(['first', 'second']);
  });

  it('applyFreeholdSelfWire delegates to the walk with the production allowlist and table (source pin)', () => {
    // Behaviorally unobservable while the allowlist is empty, so the binding
    // between the production wrapper and the seam is pinned on
    // comment-stripped source: the wrapper's body is the one delegate call.
    const src = codeOnly(
      readFileSync(new URL('../src/net/freehold_snapshot_wire.ts', import.meta.url), 'utf8'),
    );
    const at = src.indexOf('export function applyFreeholdSelfWire(');
    expect(at).toBeGreaterThanOrEqual(0);
    const end = src.indexOf('\n}\n', at);
    expect(end).toBeGreaterThan(at);
    expect(src.slice(at, end)).toContain(
      'applyWithDecoders(target, self, ADMITTED_KEYS, DECODER_BY_KEY)',
    );
    // The two module-local views that call passes are the production
    // bindings and not a redefinition: each is declared exactly once, straight
    // from the exported allowlist and the decoder table (whitespace folded,
    // since the formatter wraps the second initializer).
    const flat = src.replace(/\s+/g, ' ');
    expect(flat).toContain('const ADMITTED_KEYS: readonly string[] = FREEHOLD_SELF_KEYS;');
    expect(flat).toContain(
      'const DECODER_BY_KEY: Readonly<Record<string, FreeholdSelfDecoder | undefined>> = FREEHOLD_SELF_DECODERS;',
    );
    expect(flat.match(/\bconst ADMITTED_KEYS\b/g)).toHaveLength(1);
    expect(flat.match(/\bconst DECODER_BY_KEY\b/g)).toHaveLength(1);
  });

  it('online.ts WIRES the decode home in, and decodes no housing key inline (source pin)', () => {
    // The decoder being correct is worthless if nothing calls it, and while the
    // allowlist is empty a deleted call site is behaviorally invisible: every
    // suite in the repo stays green, and 05/08a would then fill an allowlist
    // into a walk that never runs. So pin BOTH halves on comment-stripped
    // source: the call exists inside the self-record block beside its bank
    // sibling, and no housing mirror is assigned anywhere else in the file.
    const online = codeOnly(readFileSync(new URL('../src/net/online.ts', import.meta.url), 'utf8'));

    const call = online.indexOf('applyFreeholdSelfWire(this, s)');
    expect(call, 'online.ts must call the housing decode home').toBeGreaterThanOrEqual(0);
    // Inside the same self-record walk as the bank sibling, not stranded in
    // some unrelated method: the bank call is the anchor and sits just above.
    const bank = online.indexOf('applyBankSelfWire(this, s)');
    expect(bank).toBeGreaterThanOrEqual(0);
    expect(call).toBeGreaterThan(bank);
    expect(online.slice(bank, call)).not.toContain('applySnapshot');
    // Exactly one call site, so a duplicate cannot double-apply a future key.
    expect(online.match(/applyFreeholdSelfWire\(/g)).toHaveLength(1);

    // THE ONLY DECODE HOME: the two housing mirrors are assigned only by their
    // class-field initializers (`= null`), never by an inline `this.myFreehold =
    // s.something` the way 05/08a would be tempted to write inside applySnapshot.
    for (const mirror of ['myFreehold', 'freeholdLayout', 'freeholdTransitionId']) {
      const assignments = online.match(new RegExp(`this\\.${mirror}\\s*=`, 'g')) ?? [];
      expect(assignments, `${mirror} must not be assigned outside the decode home`).toEqual([]);
    }
  });
});

describe('ClientWorld housing mirrors', () => {
  it('the bareClient fixture seeds every housing mirror null (the class-default pin is tests/bare_client_defaults.test.ts)', () => {
    // bareClient builds on Object.create(ClientWorld.prototype), so the nulls
    // read here are the FIXTURE's own assignments, not the class initializers.
    // tests/bare_client_defaults.test.ts scrapes those initializers off the
    // AST and holds the fixture to them; this arm only proves the harness
    // the sender pins below run on starts dark.
    const client = bareClient(1);
    expect(client.myFreehold).toBeNull();
    expect(client.freeholdLayout).toBeNull();
    expect(
      (client as unknown as { freeholdTransitionId: unknown }).freeholdTransitionId,
    ).toBeNull();
  });

  it('housingNowMs is Date.now read fresh per call (the farmNowMs base the facet names)', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(1_725_000_000_000);
      const client = bareClient(1);
      expect(client.housingNowMs()).toBe(1_725_000_000_000);
      // Fresh per call, not captured: the clock moves and so does the read.
      vi.setSystemTime(1_725_000_000_750);
      expect(client.housingNowMs()).toBe(1_725_000_000_750);
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves every mirror null when a snapshot carries an unknown housing key object', () => {
    const client = bareClient(1);
    expect(() => apply(client, { freehold: { plotId: 'x' } })).not.toThrow();
    expect(client.myFreehold).toBeNull();
    expect(client.freeholdLayout).toBeNull();
    expect(
      (client as unknown as { freeholdTransitionId: unknown }).freeholdTransitionId,
    ).toBeNull();
    // The rest of the self frame still applied: the unknown key never
    // rejected the whole snapshot.
    expect(client.player.level).toBe(20);
  });

  it('never wipes a populated mirror on a snapshot that omits the housing keys', () => {
    const client = bareClient(1);
    const view = freeholdView();
    const layout = layoutView();
    client.myFreehold = view;
    client.freeholdLayout = layout;
    apply(client);
    expect(client.myFreehold).toBe(view);
    expect(client.freeholdLayout).toBe(layout);
  });
});

describe('ClientWorld housing senders (the real send path)', () => {
  it.each([
    ['freeholdEnter', (c: ClientWorld) => c.freeholdEnter(), { t: 'cmd', cmd: 'freehold_enter' }],
    ['freeholdLeave', (c: ClientWorld) => c.freeholdLeave(), { t: 'cmd', cmd: 'freehold_leave' }],
    [
      'placeFurnishing',
      (c: ClientWorld) => c.placeFurnishing(4, 1.5, 0, -2.25, 1.5707963267948966),
      {
        t: 'cmd',
        cmd: 'place_furnishing',
        slot: 4,
        x: 1.5,
        y: 0,
        z: -2.25,
        yaw: 1.5707963267948966,
      },
    ],
    [
      'moveFurnishing',
      (c: ClientWorld) => c.moveFurnishing(12, -3, 0.5, 4, 3.14),
      { t: 'cmd', cmd: 'move_furnishing', placementId: 12, x: -3, y: 0.5, z: 4, yaw: 3.14 },
    ],
    [
      'removeFurnishing',
      (c: ClientWorld) => c.removeFurnishing(12),
      { t: 'cmd', cmd: 'remove_furnishing', placementId: 12 },
    ],
    ['undoPlacement', (c: ClientWorld) => c.undoPlacement(), { t: 'cmd', cmd: 'undo_placement' }],
    ['redoPlacement', (c: ClientWorld) => c.redoPlacement(), { t: 'cmd', cmd: 'redo_placement' }],
    ['payLedger', (c: ClientWorld) => c.payLedger(), { t: 'cmd', cmd: 'pay_ledger' }],
    [
      'setVisitPolicy',
      (c: ClientWorld) => c.setVisitPolicy('open'),
      { t: 'cmd', cmd: 'set_visit_policy', policy: 'open' },
    ],
  ] as const)('%s sends exactly one frame with the pinned payload', (_name, call, frame) => {
    const { client, sent } = sendingClient();
    call(client);
    expect(sent).toEqual([frame]);
  });

  it('setFreeholdBuildPresence sends the null plot and transition ids with a monotonic sequence', () => {
    const { client, sent } = sendingClient();
    client.setFreeholdBuildPresence(true);
    client.setFreeholdBuildPresence(false);
    expect(sent).toEqual([
      {
        t: 'cmd',
        cmd: 'set_freehold_build_presence',
        active: true,
        plotId: null,
        acceptedTransitionId: null,
        buildPresenceSeq: 1,
      },
      {
        t: 'cmd',
        cmd: 'set_freehold_build_presence',
        active: false,
        plotId: null,
        acceptedTransitionId: null,
        buildPresenceSeq: 2,
      },
    ]);
  });

  it('setFreeholdBuildPresence echoes the mirrored plot and transition ids once they exist', () => {
    const { client, sent } = sendingClient();
    client.myFreehold = freeholdView();
    (client as unknown as { freeholdTransitionId: string | null }).freeholdTransitionId =
      'transition-3';
    client.setFreeholdBuildPresence(true);
    expect(sent).toEqual([
      {
        t: 'cmd',
        cmd: 'set_freehold_build_presence',
        active: true,
        plotId: asFreeholdPlotId('plot-7'),
        acceptedTransitionId: 'transition-3',
        buildPresenceSeq: 1,
      },
    ]);
  });

  it('never resets the build-presence sequence on a snapshot: send, snapshot, send carries 1 then 2', () => {
    const { client, sent } = sendingClient();
    client.setFreeholdBuildPresence(true);
    apply(client);
    client.setFreeholdBuildPresence(false);
    const seqs = sent
      .filter((f) => f.cmd === 'set_freehold_build_presence')
      .map((f) => f.buildPresenceSeq);
    expect(seqs).toEqual([1, 2]);
  });

  it('sends nothing while spectating (the cmd gate every IWorld send shares)', () => {
    const { client, sent } = sendingClient();
    (client as unknown as { spectating: unknown }).spectating = 'Watcher';
    client.freeholdEnter();
    client.setFreeholdBuildPresence(true);
    expect(sent).toEqual([]);
  });

  it('mirrors nothing on a send: every housing mirror stays null after all ten', () => {
    const { client, sent } = sendingClient();
    client.freeholdEnter();
    client.freeholdLeave();
    client.placeFurnishing(0, 0, 0, 0, 0);
    client.moveFurnishing(1, 0, 0, 0, 0);
    client.removeFurnishing(1);
    client.undoPlacement();
    client.redoPlacement();
    client.payLedger();
    client.setVisitPolicy('closed');
    client.setFreeholdBuildPresence(true);
    expect(sent.map((f) => f.cmd)).toEqual([...HOUSING_COMMANDS]);
    expect(client.myFreehold).toBeNull();
    expect(client.freeholdLayout).toBeNull();
  });
});

describe('the housing command table rows', () => {
  it('registers all ten tokens in COMMAND_NAMES as one contiguous run in the pinned order', () => {
    const names: readonly string[] = COMMAND_NAMES;
    for (const cmd of HOUSING_COMMANDS) expect(names, cmd).toContain(cmd);
    // Appended as one block and never reordered: the run that starts at the
    // first housing token is exactly the ten, in the contract's order. (Not
    // pinned as the table's tail: a later packet may append after it.)
    const start = names.indexOf(HOUSING_COMMANDS[0]);
    expect(names.slice(start, start + HOUSING_COMMANDS.length)).toEqual([...HOUSING_COMMANDS]);
  });

  it('tags every one of the ten with IWorldHousing and nothing else with it', () => {
    const tags = COMMAND_FACETS as Readonly<Record<string, string>>;
    for (const cmd of HOUSING_COMMANDS) expect(tags[cmd], cmd).toBe('IWorldHousing');
    const tagged = Object.entries(tags)
      .filter(([, facet]) => facet === 'IWorldHousing')
      .map(([cmd]) => cmd)
      .sort();
    expect(tagged).toEqual([...HOUSING_COMMANDS].sort());
  });
});
