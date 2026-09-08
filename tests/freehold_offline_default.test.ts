// Every owner's default tier-0 Inn Room record (D2, D81) on the offline host:
// a lit Sim seeds it at addPlayer under the `entity:<pid>` fallback key with
// the stand-in plot identity, a dark Sim seeds nothing and refuses every entry
// with `no_freehold`, a refused development grant still leaves the Inn Room
// enterable, the character save carries nothing housing, the record is
// evicted only when the LAST same-key session leaves, and the leave path
// touches the roster only when it has a record to evict.

import { describe, expect, it } from 'vitest';
import { FREEHOLD_INN_ROOM_DUNGEON_ID } from '../src/sim/content/freehold';
import { BUILTIN_WORLD, DUNGEONS, dungeonAt } from '../src/sim/data';
import {
  defaultFreeholdState,
  devGrantFreeholdTier,
  ensureFreeholdRecord,
  enterFreehold,
  type FreeholdState,
  freeholdKeyFor,
  freeholdOwnerKeyOfMeta,
  PENDING_FREEHOLD_PLOT_ID,
  releaseFreeholdOnLeave,
  seedFreeholdOnJoin,
} from '../src/sim/freehold';
// Off the barrel on purpose (the join hook is its one caller): the direct
// test imports the owning file.
import { applyFreeholdOwnerStamp } from '../src/sim/freehold/state';
import { Sim } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import type { WorldContent } from '../src/sim/types';

const SLIM_WORLD: WorldContent = { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] };
const ACCOUNT = 'account:7';
// The charset server/freehold_wire.ts admits for a plot id (cross-pinned in
// tests/freehold_module.test.ts).
const WIRE_PLOT_ID = /^[A-Za-z0-9_:-]{1,64}$/;

function litSim(seed = 7): Sim {
  return new Sim({ seed, playerClass: 'warrior', freeholdsEnabled: true, world: SLIM_WORLD });
}

function darkSim(seed = 7): Sim {
  return new Sim({ seed, playerClass: 'warrior', world: SLIM_WORLD });
}

function countDraws(sim: Sim, run: () => void): number {
  let draws = 0;
  sim.rng.setObserver(() => {
    draws++;
  });
  try {
    run();
  } finally {
    sim.rng.setObserver(null);
  }
  return draws;
}

describe('the draw counter', () => {
  it('is live: one rng draw counts as one (the positive control for the zero-draw pins)', () => {
    const sim = litSim();
    expect(
      countDraws(sim, () => {
        sim.rng.next();
      }),
    ).toBe(1);
  });
});

describe('the default record on a lit offline Sim', () => {
  it('exists for entity:<pid> at addPlayer: tier inn_room, rev 0, the stand-in plot id', () => {
    const sim = litSim();
    const pid = sim.primaryId;
    const key = `entity:${pid}`;
    expect(sim.meta(pid)?.freeholdOwnerKey).toBeUndefined();
    expect(freeholdKeyFor(sim.ctx, pid)).toBe(key);
    expect([...sim.freeholds.keys()]).toEqual([key]);
    const record = sim.freeholds.get(key);
    expect(record).toMatchObject({
      ownerKey: key,
      plotId: PENDING_FREEHOLD_PLOT_ID,
      tier: 'inn_room',
      rev: 0,
      layout: [],
      trophies: [],
      visitPolicy: 'closed',
      isDecorating: false,
    });
    // The stand-in identity is a fixed literal that names no owner.
    expect(String(PENDING_FREEHOLD_PLOT_ID)).toBe('plot:unassigned');
    expect(String(record?.plotId)).not.toContain(key);
    expect(String(record?.plotId)).not.toContain(String(pid));
    expect(String(record?.plotId)).not.toMatch(/entity|account/);
    expect(String(record?.plotId)).toMatch(WIRE_PLOT_ID);
  });

  it('is seeded for every joining player, each under its own key, with no rng drawn', () => {
    const sim = litSim();
    const draws = countDraws(sim, () => {
      const b = sim.addPlayer('mage', 'Bbb');
      expect(sim.freeholds.get(`entity:${b}`)?.tier).toBe('inn_room');
    });
    expect(sim.freeholds.size).toBe(2);
    // addPlayer itself may roll nothing housing-related: the seed is draw-free.
    expect(draws).toBe(0);
  });

  it('ensureFreeholdRecord is load-once and ignores the empty key', () => {
    const sim = litSim();
    const key = `entity:${sim.primaryId}`;
    const live = sim.freeholds.get(key);
    if (live) live.rev = 5;
    expect(ensureFreeholdRecord(sim.ctx, key)).toBe(live);
    expect(sim.freeholds.get(key)?.rev).toBe(5);
    expect(ensureFreeholdRecord(sim.ctx, '')).toBeNull();
    expect(sim.freeholds.has('')).toBe(false);
    expect(sim.freeholds.size).toBe(1);
  });

  it('the host stamp keys the record: account:<id> when stamped, entity:<pid> otherwise', () => {
    const sim = litSim();
    const a = sim.addPlayer('warrior', 'Aaa', { freeholdOwnerKey: ACCOUNT });
    expect(sim.meta(a)?.freeholdOwnerKey).toBe(ACCOUNT);
    expect(freeholdKeyFor(sim.ctx, a)).toBe(ACCOUNT);
    expect(sim.freeholds.get(ACCOUNT)?.ownerKey).toBe(ACCOUNT);
    expect(sim.freeholds.has(`entity:${a}`)).toBe(false);
    // The one writer, on the structural slice, and the read-time fallback.
    const meta = { entityId: 42, freeholdOwnerKey: undefined as string | undefined };
    expect(freeholdOwnerKeyOfMeta(meta)).toBe('entity:42');
    // An empty key is ignored (the loadFreehold / ensureFreeholdRecord rule):
    // on a fresh meta nothing is stamped, on a stamped one nothing is erased.
    applyFreeholdOwnerStamp(meta, '');
    expect(meta.freeholdOwnerKey).toBeUndefined();
    expect(freeholdOwnerKeyOfMeta(meta)).toBe('entity:42');
    applyFreeholdOwnerStamp(meta, 'account:9');
    expect(freeholdOwnerKeyOfMeta(meta)).toBe('account:9');
    applyFreeholdOwnerStamp(meta, '');
    expect(freeholdOwnerKeyOfMeta(meta)).toBe('account:9');
    expect(freeholdKeyFor(sim.ctx, 999_999)).toBe('entity:999999');
  });

  it('seedFreeholdOnJoin reads the meta it is handed, not the roster', () => {
    // An OFF-roster meta (no such pid on ctx.players): the hook stamps and
    // seeds from the slice alone, which is what makes it correct whether or
    // not addPlayer has registered the meta yet.
    const sim = litSim();
    expect(sim.players.has(12_345)).toBe(false);
    const stamped = { entityId: 12_345, freeholdOwnerKey: undefined as string | undefined };
    seedFreeholdOnJoin(sim.ctx, stamped, 'account:5');
    expect(stamped.freeholdOwnerKey).toBe('account:5');
    expect(sim.freeholds.get('account:5')?.ownerKey).toBe('account:5');
    expect(sim.freeholds.has('entity:12345')).toBe(false);
    // And with no host key, the entity fallback of that same off-roster meta.
    const bare = { entityId: 12_345 };
    seedFreeholdOnJoin(sim.ctx, bare, undefined);
    expect(sim.freeholds.get('entity:12345')?.tier).toBe('inn_room');
    expect(sim.players.has(12_345)).toBe(false);
  });
});

describe('the dark offline Sim', () => {
  it('seeds nothing at addPlayer and stamps the key regardless', () => {
    const sim = darkSim();
    expect(sim.ctx.freeholdsEnabled).toBe(false);
    expect(sim.freeholds.size).toBe(0);
    const a = sim.addPlayer('warrior', 'Aaa', { freeholdOwnerKey: ACCOUNT });
    expect(sim.freeholds.size).toBe(0);
    expect(sim.meta(a)?.freeholdOwnerKey).toBe(ACCOUNT);
  });

  it('answers no_freehold to every entry, moving, claiming and drawing nothing', () => {
    const sim = darkSim();
    const pid = sim.primaryId;
    const e = sim.entities.get(pid);
    if (!e) throw new Error('no primary entity');
    const before = { ...e.pos };
    sim.drainEvents();
    let result: boolean | null = null;
    const draws = countDraws(sim, () => {
      result = enterFreehold(sim.ctx, pid);
    });
    expect(result).toBe(false);
    expect(draws).toBe(0);
    expect(e.pos).toEqual(before);
    expect(sim.instances.every((i) => i.partyKey === null)).toBe(true);
    expect(sim.drainEvents()).toEqual([{ type: 'freeholdDenied', pid, reason: 'no_freehold' }]);
  });
});

describe('a failed development grant', () => {
  it('leaves the Inn Room enterable, at the Inn Room band', () => {
    // A lit host with devCommands off: the grant is refused and writes nothing.
    const sim = litSim();
    const pid = sim.primaryId;
    expect(devGrantFreeholdTier(sim.ctx, pid, 'cottage')).toEqual({ outcome: 'unauthorized' });
    expect(sim.freeholds.get(`entity:${pid}`)?.tier).toBe('inn_room');
    expect(sim.freeholds.get(`entity:${pid}`)?.rev).toBe(0);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const e = sim.entities.get(pid);
    expect(dungeonAt(e?.pos.x ?? Number.NaN)?.id).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    expect(DUNGEONS[FREEHOLD_INN_ROOM_DUNGEON_ID].index).toBe(15);
  });
});

describe('the character save', () => {
  it('carries nothing housing: no freehold key, no stamp, no plot id', () => {
    const sim = litSim();
    const a = sim.addPlayer('warrior', 'Aaa', { freeholdOwnerKey: ACCOUNT });
    expect(sim.freeholds.get(ACCOUNT)?.tier).toBe('inn_room');
    const saved = sim.serializeCharacter(a);
    const keys = Object.keys(saved as unknown as Record<string, unknown>);
    expect(keys.length).toBeGreaterThan(10); // a real save, not an empty shell
    expect(keys.filter((k) => /freehold|housing|plot/i.test(k))).toEqual([]);
    const json = JSON.stringify(saved);
    expect(json).not.toContain(ACCOUNT);
    expect(json).not.toContain(String(PENDING_FREEHOLD_PLOT_ID));
    expect(json).not.toMatch(/freehold/i);
    // Positive controls: the key filter and the text scans are live.
    expect(
      ['freeholdOwnerKey', 'housingPlot', 'plotId'].filter((k) => /freehold|housing|plot/i.test(k)),
    ).toHaveLength(3);
    expect(`${json}${ACCOUNT}`).toContain(ACCOUNT);
    expect(`${json} freehold`).toMatch(/freehold/i);
  });
});

describe('removePlayer', () => {
  it('evicts the record only when the last same-key player leaves', () => {
    const sim = litSim();
    const a = sim.addPlayer('warrior', 'Aaa', { freeholdOwnerKey: ACCOUNT });
    const b = sim.addPlayer('mage', 'Bbb', { freeholdOwnerKey: ACCOUNT });
    const c = sim.addPlayer('rogue', 'Ccc', { freeholdOwnerKey: 'account:8' });
    const shared = sim.freeholds.get(ACCOUNT);
    expect(shared).toBeDefined();
    expect(sim.freeholds.size).toBe(3); // the primary's entity key, account:7, account:8

    sim.removePlayer(a);
    expect(sim.freeholds.get(ACCOUNT)).toBe(shared); // the same live record, untouched
    expect(sim.freeholds.has('account:8')).toBe(true);

    sim.removePlayer(b);
    expect(sim.freeholds.has(ACCOUNT)).toBe(false);
    expect(sim.freeholds.has('account:8')).toBe(true);

    sim.removePlayer(c);
    expect(sim.freeholds.has('account:8')).toBe(false);
    expect([...sim.freeholds.keys()]).toEqual([`entity:${sim.primaryId}`]);
  });

  it('is a no-op for an unknown pid and on a dark host', () => {
    const lit = litSim();
    const before = [...lit.freeholds.keys()];
    lit.removePlayer(999_999);
    expect([...lit.freeholds.keys()]).toEqual(before);
    const dark = darkSim();
    const a = dark.addPlayer('warrior', 'Aaa', { freeholdOwnerKey: ACCOUNT });
    dark.removePlayer(a);
    expect(dark.freeholds.size).toBe(0);
    expect(dark.players.has(a)).toBe(false);
  });

  it('walks the roster only when the leaver holds a record: never on a dark host', () => {
    // A roster whose iteration is counted: `values()` is the only walk the
    // hook can make, so its call count is the pin. Lookups (`get`) stay free.
    const players = new Map<number, { entityId: number; freeholdOwnerKey?: string }>([
      [1, { entityId: 1 }],
      [2, { entityId: 2, freeholdOwnerKey: 'account:other' }],
    ]);
    let walks = 0;
    const roster = new Proxy(players, {
      get(target, prop) {
        if (prop === 'values') walks += 1;
        const member = Reflect.get(target, prop, target);
        return typeof member === 'function' ? member.bind(target) : member;
      },
    });
    const freeholds = new Map<string, FreeholdState>();
    const ctx = { players: roster, freeholds } as unknown as SimContext;
    // Dark host: no record anywhere. Returns before the roster.
    releaseFreeholdOnLeave(ctx, 1);
    expect(walks).toBe(0);
    // A record exists, but not under the leaver's key. Still no walk.
    freeholds.set('account:other', defaultFreeholdState('account:other', PENDING_FREEHOLD_PLOT_ID));
    releaseFreeholdOnLeave(ctx, 1);
    expect(walks).toBe(0);
    expect(freeholds.size).toBe(1);
    // Positive control: the leaver's own record is live, so the roster IS
    // walked once and the record evicted (nobody else shares entity:1).
    freeholds.set('entity:1', defaultFreeholdState('entity:1', PENDING_FREEHOLD_PLOT_ID));
    releaseFreeholdOnLeave(ctx, 1);
    expect(walks).toBe(1);
    expect(freeholds.has('entity:1')).toBe(false);
    expect(freeholds.has('account:other')).toBe(true);
  });
});
