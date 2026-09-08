// The owner-keyed freehold claim on the dungeon slot pool
// (src/sim/freehold/instance.ts over instances/dungeons.ts): a fresh lit Sim's
// player enters its Inn Room with no seeding step, two characters of one
// account share one claim while party membership is ignored, the empty claim
// reaps on the shared timeout, a relog rebinds before it and claims fresh after,
// every refusal is one text-free `freeholdDenied` that moves, claims and draws
// nothing, a full pool answers `busy` before the dungeon module's English busy
// error can run, the whole drive is seed-deterministic, and a tier change
// frees the old tier's vacant claim the moment the LIVING owner arrives in the
// new room (an old room with a player inside or a bound corpse in it, every
// party-keyed claim, and a ghost's corpse run, are left alone).

import { describe, expect, it } from 'vitest';
import { isBlocked } from '../src/sim/colliders';
import {
  FREEHOLD_COTTAGE_DUNGEON_ID,
  FREEHOLD_INN_ROOM_DUNGEON_ID,
} from '../src/sim/content/freehold';
import {
  BUILTIN_WORLD,
  DUNGEONS,
  dungeonAt,
  INSTANCE_SLOT_COUNT,
  instanceOrigin,
} from '../src/sim/data';
import {
  ensureFreeholdRecord,
  enterFreehold,
  evictFreehold,
  freeholdDefForTier,
  freeholdDescriptorFor,
  leaveFreehold,
  PENDING_FREEHOLD_PLOT_ID,
  setFreeholdTier,
} from '../src/sim/freehold';
// Off the barrel on purpose (the join hook is its one caller): the direct
// test imports the owning file.
import { applyFreeholdOwnerStamp } from '../src/sim/freehold/state';
import type { FreeholdTier } from '../src/sim/freehold/types';
import { instanceKeyFor } from '../src/sim/instances/dungeons';
import type { InstanceSlot } from '../src/sim/sim';
import { Sim } from '../src/sim/sim';
import {
  type Entity,
  INSTANCE_EMPTY_TIMEOUT,
  type SimEvent,
  type WorldContent,
} from '../src/sim/types';
import { unstuckLocationAt } from '../src/sim/unstuck';

// Instance slots spawn from DUNGEON_LIST, never from WorldContent, so the
// ambient overworld is stripped to keep every Sim cheap (the dungeons.test.ts
// recipe).
const SLIM_WORLD: WorldContent = { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] };

const INN = DUNGEONS[FREEHOLD_INN_ROOM_DUNGEON_ID];
const COTTAGE = DUNGEONS[FREEHOLD_COTTAGE_DUNGEON_ID];
const ACCOUNT = 'account:7';

function makeSim(seed = 99): Sim {
  return new Sim({
    seed,
    playerClass: 'warrior',
    noPlayer: true,
    freeholdsEnabled: true,
    world: SLIM_WORLD,
  });
}

function addOwner(sim: Sim, name: string, freeholdOwnerKey?: string): number {
  return sim.addPlayer('warrior', name, freeholdOwnerKey ? { freeholdOwnerKey } : undefined);
}

function entity(sim: Sim, pid: number): Entity {
  const e = sim.entities.get(pid);
  if (!e) throw new Error(`no entity ${pid}`);
  return e;
}

function claimOf(sim: Sim, key: string): InstanceSlot | null {
  return sim.instances.find((i) => i.partyKey === key) ?? null;
}

function claimedSlots(sim: Sim): InstanceSlot[] {
  return sim.instances.filter((i) => i.partyKey !== null);
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

function textEvents(events: SimEvent[]): SimEvent[] {
  return events.filter((ev) => ev.type === 'log' || ev.type === 'error');
}

// A death inside `inst` and the spirit release that follows, as the sim
// records them (spirit.ts): the corpse stays where the player fell, bound to
// the claim's exit entity, and the released ghost stands at the graveyard,
// outside every instance.
function dieInsideAndRelease(sim: Sim, pid: number, inst: InstanceSlot): void {
  const e = entity(sim, pid);
  expect(sim.instanceSlotAt(e.pos)).toBe(inst.slot);
  e.hp = 0;
  e.dead = true;
  e.ghost = true;
  e.corpsePos = { ...e.pos };
  e.corpseInstanceId = inst.exitId;
  e.pos = { x: 0, y: 0, z: 0 };
}

// Everything a refusal must leave alone, as a value snapshot.
function refusalSnapshot(sim: Sim, pid: number) {
  const e = entity(sim, pid);
  return {
    pos: { ...e.pos },
    facing: e.facing,
    entrySeq: e.dungeonEntrySeq,
    claims: sim.instances.map((i) => [
      i.dungeonId,
      i.slot,
      i.partyKey,
      i.exitId,
      i.emptyFor,
      i.difficulty,
      [...i.enteredBy],
      [...i.mobIds],
    ]),
    entities: sim.entities.size,
    // A deep value copy, so a mutated nested row (layout, trophies) shows too.
    freeholds: JSON.parse(JSON.stringify([...sim.freeholds.entries()])),
  };
}

describe('the draw counter', () => {
  it('is live: one rng draw counts as one (the positive control for every zero-draw pin below)', () => {
    const sim = makeSim();
    expect(
      countDraws(sim, () => {
        sim.rng.next();
      }),
    ).toBe(1);
    expect(countDraws(sim, () => {})).toBe(0);
  });
});

describe('the owner-keyed claim', () => {
  it("a fresh lit Sim's player enters its Inn Room with no seeding step", () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    const outside = { ...e.pos };
    expect(dungeonAt(outside.x)).toBeNull();
    expect(e.dungeonEntrySeq).toBe(0);
    sim.drainEvents();

    const draws = countDraws(sim, () => {
      expect(enterFreehold(sim.ctx, pid)).toBe(true);
    });
    expect(draws).toBe(0);

    expect(dungeonAt(e.pos.x)?.id).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    const inst = claimOf(sim, `entity:${pid}`);
    expect(inst).not.toBeNull();
    expect(inst?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    expect(INN.index).toBe(15);
    const origin = instanceOrigin(15, inst?.slot ?? -1);
    expect(e.pos.x).toBeCloseTo(origin.x + INN.entry.x, 6);
    expect(e.pos.z).toBeCloseTo(origin.z + INN.entry.z, 6);
    expect(sim.instanceSlotAt(e.pos)).toBe(inst?.slot);
    expect(e.dungeonEntrySeq).toBe(1);
    expect(e.facing).toBe(0);
    expect(inst?.enteredBy.has(pid)).toBe(true);
    expect(inst?.difficulty).toBe('normal');
    // The entry log rides the dungeon module, once, and nothing else is said.
    // INN.enterText is the def's own literal (pinned verbatim in
    // tests/freehold_dungeon_defs.test.ts), so this compares the real line.
    const events = sim.drainEvents();
    expect(textEvents(events)).toEqual([{ type: 'log', text: INN.enterText, color: '#b9f', pid }]);
    expect(events.filter((ev) => ev.type === 'freeholdDenied')).toEqual([]);
  });

  it('the entry pose stands on unblocked ground in both rooms, in the claimed slot and in slot 23', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    const key = `entity:${pid}`;
    expect(INSTANCE_SLOT_COUNT - 1).toBe(23);
    for (const [tier, def] of [
      ['inn_room', INN],
      ['cottage', COTTAGE],
    ] as const) {
      expect(setFreeholdTier(sim.ctx, key, tier)).toBe(true);
      expect(enterFreehold(sim.ctx, pid)).toBe(true);
      expect(dungeonAt(e.pos.x)?.id).toBe(def.id);
      // The real arrival, and the far end of the pool the same way: every
      // slot shares the room's local geometry, so slot 23 is the one a full
      // pool would hand out last.
      expect(isBlocked(sim.cfg.seed, e.pos.x, e.pos.z, 0.5), def.id).toBe(false);
      const far = instanceOrigin(def.index, 23);
      expect(
        isBlocked(sim.cfg.seed, far.x + def.entry.x, far.z + def.entry.z, 0.5),
        `${def.id} slot 23`,
      ).toBe(false);
      // Positive control: the collider is live in this band (the crypt kit's
      // front wall sits on the local z = -19 line, one yard behind the entry).
      expect(isBlocked(sim.cfg.seed, far.x, far.z - 19, 0.5), `${def.id} wall`).toBe(true);
      expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    }
  });

  it('two players stamped with one account key share ONE claim', () => {
    const sim = makeSim();
    const a = addOwner(sim, 'Aaa', ACCOUNT);
    const b = addOwner(sim, 'Bbb', ACCOUNT);
    expect(sim.freeholds.size).toBe(1);
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    const inst = claimOf(sim, ACCOUNT);
    expect(inst).not.toBeNull();
    const exitId = inst?.exitId;
    const claimedBefore = claimedSlots(sim).length;
    // A's exact pose and arrival count before B arrives: B's entry must not
    // re-teleport or re-arrive A (a second teleport to the same entry pose
    // would keep A's slot membership and still be wrong).
    const ea = entity(sim, a);
    ea.pos.x += 1.5;
    const aPose = { pos: { ...ea.pos }, facing: ea.facing, entrySeq: ea.dungeonEntrySeq };
    sim.drainEvents();

    const draws = countDraws(sim, () => {
      expect(enterFreehold(sim.ctx, b)).toBe(true);
    });
    expect(draws).toBe(0);
    // Nothing new claimed: the second character rejoined the live claim.
    expect(claimedSlots(sim).length).toBe(claimedBefore);
    expect(inst?.exitId).toBe(exitId);
    expect(sim.instanceSlotAt(entity(sim, b).pos)).toBe(inst?.slot);
    expect(sim.instanceSlotAt(entity(sim, a).pos)).toBe(inst?.slot);
    expect({ pos: { ...ea.pos }, facing: ea.facing, entrySeq: ea.dungeonEntrySeq }).toEqual(aPose);
    expect(inst?.enteredBy.has(b)).toBe(true);
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: INN.enterText, color: '#b9f', pid: b },
    ]);
  });

  it('ignores party membership: a partied third owner gets its OWN claim, a raid enters too', () => {
    const sim = makeSim();
    const a = addOwner(sim, 'Aaa', ACCOUNT);
    const b = addOwner(sim, 'Bbb', ACCOUNT);
    const c = addOwner(sim, 'Ccc', 'account:8');
    sim.partyInvite(b, a);
    sim.partyAccept(b);
    sim.partyInvite(c, a);
    sim.partyAccept(c);
    expect(sim.ctx.partyOf(c)?.members).toEqual(expect.arrayContaining([a, b, c]));
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    expect(enterFreehold(sim.ctx, c)).toBe(true);
    const shared = claimOf(sim, ACCOUNT);
    const own = claimOf(sim, 'account:8');
    expect(shared).not.toBeNull();
    expect(own).not.toBeNull();
    expect(own?.slot).not.toBe(shared?.slot);
    expect(sim.instanceSlotAt(entity(sim, c).pos)).toBe(own?.slot);
    // No party key ever claims a freehold slot.
    expect(sim.instances.some((i) => i.partyKey?.startsWith('party:'))).toBe(false);

    // A raid-flagged party (five members, the conversion minimum) still
    // enters, with no error and no party notice.
    for (const name of ['Ddd', 'Eee']) {
      const extra = addOwner(sim, name);
      sim.partyInvite(extra, a);
      sim.partyAccept(extra);
    }
    sim.convertPartyToRaid(a);
    expect(sim.ctx.partyOf(a)?.raid).toBe(true);
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, b)).toBe(true);
    expect(sim.instanceSlotAt(entity(sim, b).pos)).toBe(shared?.slot);
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: INN.enterText, color: '#b9f', pid: b },
    ]);
  });

  it('reaps the empty claim after INSTANCE_EMPTY_TIMEOUT, not before', () => {
    // The shared 300 s empty hold, as a literal: every boundary below is
    // written relative to the constant, so this is the one place the
    // gameplay bound itself is pinned (the INSTANCE_SLOT_COUNT shape).
    expect(INSTANCE_EMPTY_TIMEOUT).toBe(300);
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    expect(inst).not.toBeNull();
    if (!inst) return;
    expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    // One reaper cycle (every 20 ticks): empty for a second, still claimed.
    for (let i = 0; i < 20; i++) sim.tick();
    expect(inst.partyKey).toBe(`entity:${pid}`);
    expect(inst.emptyFor).toBe(1);
    // The boundary exactly: one second short of the shared timeout is still
    // claimed; the next reaper cycle is the one that frees it.
    inst.emptyFor = INSTANCE_EMPTY_TIMEOUT - 2;
    for (let i = 0; i < 20; i++) sim.tick();
    expect(inst.partyKey).toBe(`entity:${pid}`);
    expect(inst.emptyFor).toBe(INSTANCE_EMPTY_TIMEOUT - 1);
    for (let i = 0; i < 20; i++) sim.tick();
    expect(inst.partyKey).toBeNull();
    expect(inst.exitId).toBeNull();
    // The slot's session roster is emptied with it: a recycled slot carries
    // no stale membership into the next owner's claim.
    expect(inst.enteredBy.size).toBe(0);
    expect(inst.emptyFor).toBe(0);
    expect(claimedSlots(sim)).toEqual([]);
  });

  it('a relog rebinds to the live claim before the timeout and claims fresh after it', () => {
    const sim = makeSim();
    const first = addOwner(sim, 'Aaa', ACCOUNT);
    expect(enterFreehold(sim.ctx, first)).toBe(true);
    const inst = claimOf(sim, ACCOUNT);
    expect(inst).not.toBeNull();
    if (!inst) return;
    const firstExit = inst.exitId;
    const firstSlot = inst.slot;
    // Disconnect while INSIDE (the online relog model): the last session out
    // evicts the record, the claim stays live for the timeout.
    sim.removePlayer(first);
    expect(sim.freeholds.has(ACCOUNT)).toBe(false);
    for (let i = 0; i < 20; i++) sim.tick();
    expect(inst.partyKey).toBe(ACCOUNT);

    const second = addOwner(sim, 'Aaa', ACCOUNT);
    expect(sim.freeholds.get(ACCOUNT)?.tier).toBe('inn_room');
    expect(enterFreehold(sim.ctx, second)).toBe(true);
    expect(sim.instanceSlotAt(entity(sim, second).pos)).toBe(firstSlot);
    expect(inst.exitId).toBe(firstExit);
    expect(claimedSlots(sim)).toHaveLength(1);

    // Past the timeout the slot is reaped, so the next session claims afresh:
    // a new exit entity identifies the new claim.
    expect(leaveFreehold(sim.ctx, second)).toBe(true);
    sim.removePlayer(second);
    inst.emptyFor = INSTANCE_EMPTY_TIMEOUT - 1;
    for (let i = 0; i < 20; i++) sim.tick();
    expect(inst.partyKey).toBeNull();
    const third = addOwner(sim, 'Aaa', ACCOUNT);
    expect(enterFreehold(sim.ctx, third)).toBe(true);
    const fresh = claimOf(sim, ACCOUNT);
    expect(fresh).not.toBeNull();
    expect(fresh?.exitId).not.toBe(firstExit);
    expect(fresh?.exitId).not.toBeNull();
  });
});

describe('text-free refusals', () => {
  // Each arm: the refusal event exactly, AND nothing moved, claimed, or drawn.
  function expectRefusal(
    sim: Sim,
    pid: number,
    reason: 'dead' | 'combat' | 'no_freehold' | 'busy',
  ): void {
    sim.drainEvents();
    const before = refusalSnapshot(sim, pid);
    let result: boolean | null = null;
    const draws = countDraws(sim, () => {
      result = enterFreehold(sim.ctx, pid);
    });
    expect(result).toBe(false);
    expect(draws).toBe(0);
    expect(refusalSnapshot(sim, pid)).toEqual(before);
    expect(sim.drainEvents()).toEqual([{ type: 'freeholdDenied', pid, reason }]);
  }

  it('dead (a fresh corpse) is refused with `dead`', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    e.dead = true;
    e.ghost = false;
    expectRefusal(sim, pid, 'dead');
  });

  it('dead (a released ghost bound to no claim) is refused with `dead` too', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    e.dead = true;
    e.ghost = true;
    expect(e.corpseInstanceId).toBeNull();
    expectRefusal(sim, pid, 'dead');
  });

  it('a record whose tier is outside the union is unusable: `no_freehold`, never a throw', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const record = sim.freeholds.get(`entity:${pid}`);
    expect(record).toBeDefined();
    if (!record) return;
    // A corrupt or forward-version row (the persistence slice's channel):
    // the switch in freeholdDefForTier answers undefined at runtime.
    record.tier = 'lodge_v2' as FreeholdTier;
    expectRefusal(sim, pid, 'no_freehold');
    expect(record.tier).toBe('lodge_v2');
  });

  it('in combat is refused with `combat`', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    entity(sim, pid).inCombat = true;
    expectRefusal(sim, pid, 'combat');
  });

  it('no record is refused with `no_freehold`', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    evictFreehold(sim.ctx, `entity:${pid}`);
    expect(sim.freeholds.size).toBe(0);
    expectRefusal(sim, pid, 'no_freehold');
  });

  it('the refusal order is dead, then combat, then no record', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    e.dead = true;
    e.inCombat = true;
    evictFreehold(sim.ctx, `entity:${pid}`);
    expectRefusal(sim, pid, 'dead');
    e.dead = false;
    expectRefusal(sim, pid, 'combat');
    e.inCombat = false;
    expectRefusal(sim, pid, 'no_freehold');
  });

  it('a full pool answers `busy` before the dungeon module can say so in English', () => {
    const sim = makeSim();
    const owners: number[] = [];
    for (let i = 0; i < INSTANCE_SLOT_COUNT + 1; i++) owners.push(addOwner(sim, `P${i}`));
    for (const pid of owners.slice(0, INSTANCE_SLOT_COUNT)) {
      expect(enterFreehold(sim.ctx, pid)).toBe(true);
    }
    const inn = sim.instances.filter((i) => i.dungeonId === FREEHOLD_INN_ROOM_DUNGEON_ID);
    expect(inn).toHaveLength(INSTANCE_SLOT_COUNT);
    expect(inn.every((i) => i.partyKey !== null)).toBe(true);
    expect(new Set(inn.map((i) => i.partyKey)).size).toBe(INSTANCE_SLOT_COUNT);
    const last = owners[INSTANCE_SLOT_COUNT];
    // Order: no record outranks a full pool; with the record back it is busy.
    evictFreehold(sim.ctx, `entity:${last}`);
    expectRefusal(sim, last, 'no_freehold');
    ensureFreeholdRecord(sim.ctx, `entity:${last}`);
    expectRefusal(sim, last, 'busy');
    expect(dungeonAt(entity(sim, last).pos.x)).toBeNull();

    // The refusal is not sticky: once one owner leaves and the reaper frees
    // that slot, the refused owner's next enter claims exactly that slot.
    const leaver = owners[0];
    const freed = claimOf(sim, `entity:${leaver}`);
    expect(freed).not.toBeNull();
    if (!freed) return;
    expect(leaveFreehold(sim.ctx, leaver)).toBe(true);
    freed.emptyFor = INSTANCE_EMPTY_TIMEOUT - 1;
    for (let i = 0; i < 20; i++) sim.tick();
    expect(freed.partyKey).toBeNull();
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, last)).toBe(true);
    expect(freed.partyKey).toBe(`entity:${last}`);
    expect(sim.instanceSlotAt(entity(sim, last).pos)).toBe(freed.slot);
    expect(inn.filter((i) => i.partyKey !== null)).toHaveLength(INSTANCE_SLOT_COUNT);
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: INN.enterText, color: '#b9f', pid: last },
    ]);
  });

  it('INVARIANT: every false return for a resolved player is exactly one freeholdDenied, and nothing else', () => {
    // The busy arm rides expectRefusal above with the same 1:1 assertion; the
    // four player-state arms are walked here in one place so a new refusal
    // that forgets its event (or emits two) cannot hide behind a single case.
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    const key = `entity:${pid}`;
    const arms: ReadonlyArray<[string, () => void, () => void]> = [
      [
        'dead',
        () => {
          e.dead = true;
        },
        () => {
          e.dead = false;
        },
      ],
      [
        'ghost',
        () => {
          e.dead = true;
          e.ghost = true;
        },
        () => {
          e.dead = false;
          e.ghost = false;
        },
      ],
      [
        'combat',
        () => {
          e.inCombat = true;
        },
        () => {
          e.inCombat = false;
        },
      ],
      [
        'no record',
        () => evictFreehold(sim.ctx, key),
        () => {
          ensureFreeholdRecord(sim.ctx, key);
        },
      ],
    ];
    let refusals = 0;
    let denials = 0;
    for (const [name, arrange, restore] of arms) {
      arrange();
      sim.drainEvents();
      const result = enterFreehold(sim.ctx, pid);
      const events = sim.drainEvents();
      expect(result, name).toBe(false);
      refusals += 1;
      const denied = events.filter((ev) => ev.type === 'freeholdDenied');
      denials += denied.length;
      expect(denied, name).toHaveLength(1);
      expect(events, name).toHaveLength(1);
      restore();
    }
    expect(refusals).toBe(arms.length);
    expect(denials).toBe(refusals);
    // The positive side of the invariant: an accepted entry emits no denial.
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    expect(sim.drainEvents().filter((ev) => ev.type === 'freeholdDenied')).toEqual([]);
  });

  it('an unknown pid is ignored outright: no event, nothing drawn', () => {
    const sim = makeSim();
    addOwner(sim, 'Aaa');
    sim.drainEvents();
    const claims = claimedSlots(sim).length;
    const draws = countDraws(sim, () => {
      expect(enterFreehold(sim.ctx, 999_999)).toBe(false);
      expect(leaveFreehold(sim.ctx, 999_999)).toBe(false);
    });
    expect(draws).toBe(0);
    expect(claimedSlots(sim).length).toBe(claims);
    expect(sim.drainEvents()).toEqual([]);
  });

  it('a bound ghost flagged in combat answers `combat` (the exception clears dead, the order holds)', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    if (!inst) throw new Error('no claim');
    dieInsideAndRelease(sim, pid, inst);
    entity(sim, pid).inCombat = true;
    expectRefusal(sim, pid, 'combat');
  });

  it('refuses the ghost with `dead` once the reaper has freed the room its corpse lay in', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    if (!inst) throw new Error('no claim');
    dieInsideAndRelease(sim, pid, inst);
    // The shared reaper counts live bodies only, so the corpse does not hold
    // the slot past the empty timeout (a dungeon behaves the same way).
    inst.emptyFor = INSTANCE_EMPTY_TIMEOUT - 1;
    for (let i = 0; i < 20; i++) sim.tick();
    expect(inst.partyKey).toBeNull();
    expect(entity(sim, pid).ghost).toBe(true);
    expectRefusal(sim, pid, 'dead');
  });

  it('refuses a ghost bound to a claim that is not its own room', () => {
    // A ghost whose corpse lies in a dungeon claim (a real corpse run there)
    // is still `dead` to its freehold: the binding must name one of the
    // owner's own OWNER-KEYED claims (any freehold room), never a party or
    // solo claim.
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(sim.enterDungeon('hollow_crypt', pid)).toBe(true);
    const crypt = sim.instances.find((i) => i.dungeonId === 'hollow_crypt' && i.partyKey !== null);
    if (!crypt) throw new Error('no crypt claim');
    dieInsideAndRelease(sim, pid, crypt);
    expectRefusal(sim, pid, 'dead');
  });
});

describe('leaving', () => {
  it('lands at doorPos plus the leave offset and emits the leave log once', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    sim.drainEvents();
    const draws = countDraws(sim, () => {
      expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    });
    expect(draws).toBe(0);
    const drop = INN.leaveOffset ?? { x: 0, z: -4 };
    expect(e.pos.x).toBeCloseTo(INN.doorPos.x + drop.x, 6);
    expect(e.pos.z).toBeCloseTo(INN.doorPos.z + drop.z, 6);
    // The literal, so a moved door or a new offset re-pins the standability
    // proof in tests/freehold_dungeon_defs.test.ts too.
    expect({ x: e.pos.x, z: e.pos.z }).toEqual({ x: -14, z: -96 });
    expect(dungeonAt(e.pos.x)).toBeNull();
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: INN.leaveText, color: '#b9f', pid },
    ]);
    // The claim outlives the exit until the reaper frees it.
    expect(claimOf(sim, `entity:${pid}`)).not.toBeNull();
  });

  it('outside a freehold returns false and emits nothing', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    sim.drainEvents();
    const before = { ...e.pos };
    const draws = countDraws(sim, () => {
      expect(leaveFreehold(sim.ctx, pid)).toBe(false);
    });
    expect(draws).toBe(0);
    expect(e.pos).toEqual(before);
    expect(sim.drainEvents()).toEqual([]);
  });

  it('is refused for a player standing in an ordinary dungeon claim', () => {
    // The exit is the freehold's: a Hollow Crypt runner is not "in a freehold".
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(sim.enterDungeon('hollow_crypt', pid)).toBe(true);
    expect(dungeonAt(entity(sim, pid).pos.x)?.id).toBe('hollow_crypt');
    sim.drainEvents();
    expect(leaveFreehold(sim.ctx, pid)).toBe(false);
    expect(dungeonAt(entity(sim, pid).pos.x)?.id).toBe('hollow_crypt');
    expect(sim.drainEvents()).toEqual([]);
  });
});

describe('/unstuck inside a freehold', () => {
  it('resolves the owner claim as the unstuck location and is not refused as invalid_area', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    expect(inst).not.toBeNull();
    const located = unstuckLocationAt(sim.ctx, pid, e.pos);
    expect(located?.area).toEqual({
      kind: 'dungeon',
      id: FREEHOLD_INN_ROOM_DUNGEON_ID,
      instanceId: String(inst?.exitId),
      slot: inst?.slot,
    });
    for (let i = 0; i < 5; i++) sim.tick(); // settle the arrival before asking
    sim.drainEvents();
    expect(sim.unstuck(pid)).toBe(true);
    const blocked = sim.drainEvents().filter((ev) => ev.type === 'unstuck' && 'reason' in ev);
    expect(blocked).toEqual([]);
    expect(sim.meta(pid)?.pendingUnstuck?.area).toEqual(located?.area);
  });

  it('a party-keyed dungeon claim still resolves through the party/solo key', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(sim.enterDungeon('hollow_crypt', pid)).toBe(true);
    const e = entity(sim, pid);
    const key = instanceKeyFor(sim.ctx, pid);
    expect(key).toBe(`solo:${pid}`);
    const inst = sim.instances.find((i) => i.dungeonId === 'hollow_crypt' && i.partyKey === key);
    expect(inst).toBeDefined();
    expect(unstuckLocationAt(sim.ctx, pid, e.pos)?.area).toEqual({
      kind: 'dungeon',
      id: 'hollow_crypt',
      instanceId: String(inst?.exitId),
      slot: inst?.slot,
    });
    // A stranger standing in someone else's owner claim resolves nothing: the
    // owner key is the claim's, not the visitor's.
    const stranger = addOwner(sim, 'Zzz', 'account:9');
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const own = claimOf(sim, `entity:${pid}`);
    const es = entity(sim, stranger);
    es.pos = { ...e.pos };
    expect(sim.instanceSlotAt(es.pos)).toBe(own?.slot);
    expect(unstuckLocationAt(sim.ctx, stranger, es.pos)).toBeNull();
  });
});

describe('the Sim facade delegates', () => {
  it('freeholdEnter and freeholdLeave reach the module', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    sim.freeholdEnter(pid);
    expect(dungeonAt(e.pos.x)?.id).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    sim.freeholdLeave(pid);
    expect(dungeonAt(e.pos.x)).toBeNull();
    expect(e.pos.x).toBeCloseTo(INN.doorPos.x, 6);
  });
});

describe('the rest of the pool', () => {
  it('resetDungeonInstances never counts an owner claim, even when the owner key collides with the solo key', () => {
    // The offline solo key is `solo:<pid>`; stamping the SAME string as the
    // owner key forces the collision the explicit claimKey skip exists for.
    // Without the skip the house would land in `owned` and arm A's readout
    // would become the difficulty-transition refusal instead.
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const meta = sim.meta(pid);
    if (!meta) throw new Error('no meta');
    const collidingKey = instanceKeyFor(sim.ctx, pid);
    expect(collidingKey).toBe(`solo:${pid}`);
    applyFreeholdOwnerStamp(meta, collidingKey);
    ensureFreeholdRecord(sim.ctx, collidingKey);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const house = claimOf(sim, collidingKey);
    expect(house?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    const houseExit = house?.exitId;
    expect(houseExit).not.toBeNull();
    // Arm A: only the house, keyed exactly like a solo claim: nothing to reset.
    expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    sim.drainEvents();
    sim.resetDungeonInstances(pid);
    expect(sim.drainEvents().filter((ev) => ev.type === 'error')).toEqual([
      { type: 'error', text: 'You have no instances to reset.', pid },
    ]);
    expect(house?.partyKey).toBe(collidingKey);
    expect(house?.exitId).toBe(houseExit);
    // Arm B: a Hollow Crypt claim under the same string, reset as a Normal to
    // Heroic transition: the crypt claim is replaced, the house is untouched.
    expect(sim.enterDungeon('hollow_crypt', pid)).toBe(true);
    const crypt = sim.instances.find(
      (i) => i.dungeonId === 'hollow_crypt' && i.partyKey === collidingKey,
    );
    expect(crypt).toBeDefined();
    const cryptExit = crypt?.exitId;
    expect(sim.leaveDungeon(pid)).toBe(true);
    sim.setDungeonDifficulty('heroic', pid);
    sim.drainEvents();
    sim.resetDungeonInstances(pid);
    expect(sim.drainEvents().filter((ev) => ev.type === 'error')).toEqual([
      { type: 'error', text: 'All instances have been reset.', pid },
    ]);
    expect(crypt?.partyKey).toBe(collidingKey);
    expect(crypt?.difficulty).toBe('heroic');
    expect(crypt?.exitId).not.toBe(cryptExit);
    expect(house?.partyKey).toBe(collidingKey);
    expect(house?.exitId).toBe(houseExit);
    expect(house?.difficulty).toBe('normal');
  });

  it('freeholdDefForTier maps every tier to an owner-claim room, later tiers to the Cottage', () => {
    expect(freeholdDefForTier('inn_room').id).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    expect(freeholdDefForTier('cottage').id).toBe(FREEHOLD_COTTAGE_DUNGEON_ID);
    for (const tier of ['lodge', 'manor', 'keep', 'citadel'] as const) {
      expect(freeholdDefForTier(tier).id).toBe(FREEHOLD_COTTAGE_DUNGEON_ID);
    }
    expect(freeholdDefForTier('inn_room').claimKey).toBe('owner');
    expect(freeholdDefForTier('cottage').claimKey).toBe('owner');
    expect(freeholdDefForTier('inn_room').index).toBe(15);
    expect(freeholdDefForTier('cottage').index).toBe(16);
  });

  it('freeholdDescriptorFor is a value copy that carries no owner key', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa', ACCOUNT);
    const descriptor = freeholdDescriptorFor(sim.ctx, ACCOUNT);
    expect(descriptor).toEqual({
      plotId: PENDING_FREEHOLD_PLOT_ID,
      tier: 'inn_room',
      visitPolicy: 'closed',
      rev: 0,
      dungeonId: FREEHOLD_INN_ROOM_DUNGEON_ID,
    });
    // The exact toEqual above IS the no-owner-key pin: every field is listed.
    void pid;
    // Mutating the copy never reaches the live record.
    if (descriptor) descriptor.rev = 99;
    expect(sim.freeholds.get(ACCOUNT)?.rev).toBe(0);
    expect(freeholdDescriptorFor(sim.ctx, 'account:none')).toBeNull();
  });
});

describe('a tier change frees the old room', () => {
  function innExitEntity(sim: Sim, inst: InstanceSlot | null): number | null {
    const id = inst?.exitId ?? null;
    if (id === null) return null;
    expect(sim.entities.has(id)).toBe(true);
    return id;
  }

  it('re-entering the live claim of the same tier rejoins it: no new claim, the arrival re-runs', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    expect(inst).not.toBeNull();
    const exitId = inst?.exitId;
    sim.drainEvents();
    const draws = countDraws(sim, () => {
      expect(enterFreehold(sim.ctx, pid)).toBe(true);
    });
    expect(draws).toBe(0);
    expect(claimedSlots(sim)).toHaveLength(1);
    expect(inst?.exitId).toBe(exitId);
    expect(sim.instanceSlotAt(e.pos)).toBe(inst?.slot);
    expect(e.dungeonEntrySeq).toBe(2);
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: INN.enterText, color: '#b9f', pid },
    ]);
  });

  it('(i) a vacant old-tier claim is freed when the owner enters the new tier, with no rng drawn', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const key = `entity:${pid}`;
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inn = claimOf(sim, key);
    expect(inn?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    const innExit = innExitEntity(sim, inn);
    expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    expect(inn?.partyKey).toBe(key); // the claim outlives the exit, as always
    expect(setFreeholdTier(sim.ctx, key, 'cottage')).toBe(true);
    sim.drainEvents();
    const draws = countDraws(sim, () => {
      expect(enterFreehold(sim.ctx, pid)).toBe(true);
    });
    expect(draws).toBe(0);
    const cottage = claimOf(sim, key);
    expect(cottage?.dungeonId).toBe(FREEHOLD_COTTAGE_DUNGEON_ID);
    expect(sim.instanceSlotAt(entity(sim, pid).pos)).toBe(cottage?.slot);
    // The Inn Room claim is gone: unkeyed, its exit entity dropped, and the
    // Cottage claim is the only one left in the pool.
    expect(inn?.partyKey).toBeNull();
    expect(inn?.exitId).toBeNull();
    expect(innExit).not.toBeNull();
    expect(sim.entities.has(innExit ?? -1)).toBe(false);
    expect(claimedSlots(sim)).toEqual([cottage]);
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: COTTAGE.enterText, color: '#b9f', pid },
    ]);
  });

  it('(ii) an OCCUPIED old-tier claim stays when a sibling character enters the new tier', () => {
    const sim = makeSim();
    const a = addOwner(sim, 'Aaa', ACCOUNT);
    const b = addOwner(sim, 'Bbb', ACCOUNT);
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    const inn = claimOf(sim, ACCOUNT);
    expect(inn?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    const innExit = innExitEntity(sim, inn);
    expect(sim.instanceSlotAt(entity(sim, a).pos)).toBe(inn?.slot); // A stays inside
    expect(setFreeholdTier(sim.ctx, ACCOUNT, 'cottage')).toBe(true);
    expect(enterFreehold(sim.ctx, b)).toBe(true);
    const cottage = sim.instances.find(
      (i) => i.dungeonId === FREEHOLD_COTTAGE_DUNGEON_ID && i.partyKey === ACCOUNT,
    );
    expect(cottage).toBeDefined();
    expect(sim.instanceSlotAt(entity(sim, b).pos)).toBe(cottage?.slot);
    // Both claims live: the Inn Room still holds A.
    expect(inn?.partyKey).toBe(ACCOUNT);
    expect(inn?.exitId).toBe(innExit);
    expect(sim.entities.has(innExit ?? -1)).toBe(true);
    expect(sim.instanceSlotAt(entity(sim, a).pos)).toBe(inn?.slot);
    expect(claimedSlots(sim)).toHaveLength(2);
    // Once A leaves for the new room too, the old claim is vacant and goes.
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    expect(sim.instanceSlotAt(entity(sim, a).pos)).toBe(cottage?.slot);
    expect(inn?.partyKey).toBeNull();
    expect(sim.entities.has(innExit ?? -1)).toBe(false);
    expect(claimedSlots(sim)).toHaveLength(1);
  });

  it('(iii) an owner granted a tier while INSIDE the old room enters the new one and the old claim is freed', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const key = `entity:${pid}`;
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inn = claimOf(sim, key);
    const innExit = innExitEntity(sim, inn);
    expect(sim.instanceSlotAt(entity(sim, pid).pos)).toBe(inn?.slot);
    expect(setFreeholdTier(sim.ctx, key, 'cottage')).toBe(true);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const cottage = claimOf(sim, key);
    expect(cottage?.dungeonId).toBe(FREEHOLD_COTTAGE_DUNGEON_ID);
    expect(sim.instanceSlotAt(entity(sim, pid).pos)).toBe(cottage?.slot);
    // The owner has moved, so the Inn Room claim was vacant and is gone.
    expect(inn?.partyKey).toBeNull();
    expect(sim.entities.has(innExit ?? -1)).toBe(false);
    expect(claimedSlots(sim)).toEqual([cottage]);
  });

  it("never frees ANOTHER owner's vacant room: the key clause is the guard", () => {
    // Two accounts each claim and vacate an Inn Room; only the arriving
    // owner's own stale room goes. Drop the partyKey clause and the sweep
    // would free every vacant owner room in the realm.
    const sim = makeSim();
    const p = addOwner(sim, 'Ppp', 'account:7');
    const q = addOwner(sim, 'Qqq', 'account:8');
    expect(enterFreehold(sim.ctx, p)).toBe(true);
    expect(enterFreehold(sim.ctx, q)).toBe(true);
    const pInn = claimOf(sim, 'account:7');
    const qInn = claimOf(sim, 'account:8');
    expect(pInn?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    expect(qInn?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    expect(pInn?.slot).not.toBe(qInn?.slot);
    const qExit = innExitEntity(sim, qInn);
    expect(leaveFreehold(sim.ctx, p)).toBe(true);
    expect(leaveFreehold(sim.ctx, q)).toBe(true);
    expect(setFreeholdTier(sim.ctx, 'account:7', 'cottage')).toBe(true);
    expect(enterFreehold(sim.ctx, p)).toBe(true);
    expect(pInn?.partyKey).toBeNull();
    expect(qInn?.partyKey).toBe('account:8');
    expect(qInn?.exitId).toBe(qExit);
    expect(sim.entities.has(qExit ?? -1)).toBe(true);
    expect(
      claimedSlots(sim)
        .map((i) => [i.dungeonId, i.partyKey])
        .sort(),
    ).toEqual([
      [FREEHOLD_COTTAGE_DUNGEON_ID, 'account:7'],
      [FREEHOLD_INN_ROOM_DUNGEON_ID, 'account:8'],
    ]);
  });

  it("keeps an old-tier room that still holds the owner's bound corpse (the corpse run)", () => {
    const sim = makeSim();
    const a = addOwner(sim, 'Aaa', ACCOUNT);
    const b = addOwner(sim, 'Bbb', ACCOUNT);
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    const inn = claimOf(sim, ACCOUNT);
    const innExit = innExitEntity(sim, inn);
    if (!inn) throw new Error('no claim');
    // A dies inside and releases: the body stays bound to the Inn Room claim
    // while the ghost stands at the graveyard, outside every instance.
    dieInsideAndRelease(sim, a, inn);
    expect(setFreeholdTier(sim.ctx, ACCOUNT, 'cottage')).toBe(true);
    expect(enterFreehold(sim.ctx, b)).toBe(true);
    expect(claimOf(sim, ACCOUNT)?.dungeonId).toBe(FREEHOLD_INN_ROOM_DUNGEON_ID);
    // The Inn Room claim is NOT freed: nobody stands inside, but A's corpse
    // lies there, bound to this claim's exit.
    expect(inn.partyKey).toBe(ACCOUNT);
    expect(inn.exitId).toBe(innExit);
    expect(sim.entities.has(innExit ?? -1)).toBe(true);
    expect(claimedSlots(sim)).toHaveLength(2);
    // B leaves the Cottage: its claim is now VACANT, exactly what a tier-change
    // sweep would free. A's corpse run must not be that sweep.
    expect(leaveFreehold(sim.ctx, b)).toBe(true);
    const cottage = sim.instances.find(
      (i) => i.dungeonId === FREEHOLD_COTTAGE_DUNGEON_ID && i.partyKey === ACCOUNT,
    );
    if (!cottage) throw new Error('no cottage claim');
    const cottageExit = cottage.exitId;
    // A's corpse run goes to the CORPSE's room (the Inn Room), not the tier's
    // (the Cottage), A resurrects there, and the vacant Cottage claim survives.
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    const ea = entity(sim, a);
    expect(sim.instanceSlotAt(ea.pos)).toBe(inn.slot);
    expect(ea.ghost).toBe(false);
    expect(ea.corpseInstanceId).toBeNull();
    expect(cottage.partyKey).toBe(ACCOUNT);
    expect(cottage.exitId).toBe(cottageExit);
    expect(sim.entities.has(cottageExit ?? -1)).toBe(true);
    expect(claimedSlots(sim)).toHaveLength(2);
    expect(textEvents(sim.drainEvents())).toEqual([
      { type: 'log', text: INN.enterText, color: '#b9f', pid: a },
    ]);
    // Alive again and out, A's next enter REJOINS the current tier's claim
    // (the same exit entity), and the Inn Room, now vacant with no corpse, is
    // swept by that living arrival.
    expect(leaveFreehold(sim.ctx, a)).toBe(true);
    expect(enterFreehold(sim.ctx, a)).toBe(true);
    expect(sim.instanceSlotAt(entity(sim, a).pos)).toBe(cottage.slot);
    expect(cottage.exitId).toBe(cottageExit);
    expect(inn.partyKey).toBeNull();
    expect(claimedSlots(sim)).toEqual([cottage]);
  });

  it("admits a bound ghost to its corpse's room even when the record's tier is corrupt", () => {
    // The corpse run resolves the room from the bound claim, so an unusable
    // tier (which refuses a LIVING enter with no_freehold) does not strand
    // the body.
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    if (!inst) throw new Error('no claim');
    dieInsideAndRelease(sim, pid, inst);
    const record = sim.freeholds.get(`entity:${pid}`);
    if (!record) throw new Error('no record');
    record.tier = 'lodge_v2' as FreeholdTier;
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const e = entity(sim, pid);
    expect(sim.instanceSlotAt(e.pos)).toBe(inst.slot);
    expect(e.ghost).toBe(false);
    expect(sim.drainEvents().filter((ev) => ev.type === 'freeholdDenied')).toEqual([]);
    // Alive, the same record still refuses a fresh enter (an unusable tier).
    expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, pid)).toBe(false);
    expect(sim.drainEvents()).toEqual([{ type: 'freeholdDenied', pid, reason: 'no_freehold' }]);
    expect(dungeonAt(entity(sim, pid).pos.x)).toBeNull();
  });

  it('never frees a party-keyed claim under the same key string: the guard is the claimKey', () => {
    // The offline solo key is `solo:<pid>`; stamping the SAME string as the
    // owner key (the resetDungeonInstances collision) puts a Hollow Crypt
    // claim under the owner's key. A tier change must leave it alone.
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const meta = sim.meta(pid);
    if (!meta) throw new Error('no meta');
    const collidingKey = instanceKeyFor(sim.ctx, pid);
    applyFreeholdOwnerStamp(meta, collidingKey);
    ensureFreeholdRecord(sim.ctx, collidingKey);
    expect(sim.enterDungeon('hollow_crypt', pid)).toBe(true);
    const crypt = sim.instances.find(
      (i) => i.dungeonId === 'hollow_crypt' && i.partyKey === collidingKey,
    );
    expect(crypt).toBeDefined();
    const cryptExit = crypt?.exitId;
    expect(sim.leaveDungeon(pid)).toBe(true); // vacant, exactly like a stale room
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    // Two claims now share the key string; find the house by its room, since
    // claimOf answers the first claim in pool order (the crypt, index 0).
    const inn = sim.instances.find(
      (i) => i.dungeonId === FREEHOLD_INN_ROOM_DUNGEON_ID && i.partyKey === collidingKey,
    );
    expect(inn).toBeDefined();
    expect(leaveFreehold(sim.ctx, pid)).toBe(true);
    expect(setFreeholdTier(sim.ctx, collidingKey, 'cottage')).toBe(true);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    // The vacant Inn Room claim went; the vacant crypt claim did not.
    expect(inn?.partyKey).toBeNull();
    expect(crypt?.partyKey).toBe(collidingKey);
    expect(crypt?.exitId).toBe(cryptExit);
    expect(sim.entities.has(cryptExit ?? -1)).toBe(true);
    expect(
      claimedSlots(sim)
        .map((i) => i.dungeonId)
        .sort(),
    ).toEqual([FREEHOLD_COTTAGE_DUNGEON_ID, 'hollow_crypt']);
  });
});

describe('the corpse run', () => {
  it('the REAL death and release inside the room binds the corpse to the claim, and the run is admitted', () => {
    // The synthetic helper above asserts the binding; this arm PROVES it: the
    // sim's own death handler and spirit release capture the owner claim's
    // exit id (spirit.ts reads ctx.instanceClaimIdAt over the owner-keyed
    // slot), so a change to that lookup or to the release path fails here.
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    if (!inst) throw new Error('no claim');
    const inside = { ...e.pos };
    (sim as unknown as { handleDeath(e: Entity, killer: Entity | null): void }).handleDeath(
      e,
      null,
    );
    expect(e.dead).toBe(true);
    sim.releaseSpirit(pid);
    expect(e.ghost).toBe(true);
    expect(e.corpseInstanceId).toBe(inst.exitId);
    expect(e.corpsePos).toEqual(inside);
    expect(dungeonAt(e.pos.x)).toBeNull();
    sim.drainEvents();
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    expect(sim.instanceSlotAt(e.pos)).toBe(inst.slot);
    expect(e.dead).toBe(false);
    expect(e.ghost).toBe(false);
    expect(e.corpseInstanceId).toBeNull();
    expect(sim.drainEvents().filter((ev) => ev.type === 'freeholdDenied')).toEqual([]);
  });

  it('admits a released ghost whose corpse lies in its own live claim, and it resurrects at the entrance', () => {
    const sim = makeSim();
    const pid = addOwner(sim, 'Aaa');
    const e = entity(sim, pid);
    expect(enterFreehold(sim.ctx, pid)).toBe(true);
    const inst = claimOf(sim, `entity:${pid}`);
    if (!inst) throw new Error('no claim');
    const exitId = inst.exitId;
    dieInsideAndRelease(sim, pid, inst);
    expect(dungeonAt(e.pos.x)).toBeNull();
    sim.drainEvents();
    const draws = countDraws(sim, () => {
      expect(enterFreehold(sim.ctx, pid)).toBe(true);
    });
    expect(draws).toBe(0);
    // Back inside the SAME claim, alive again at the entrance (the dungeon
    // module's resurrect-on-reentry), with no refusal and no new claim.
    expect(sim.instanceSlotAt(e.pos)).toBe(inst.slot);
    expect(inst.exitId).toBe(exitId);
    expect(e.dead).toBe(false);
    expect(e.ghost).toBe(false);
    expect(e.hp).toBeGreaterThan(0);
    expect(claimedSlots(sim)).toEqual([inst]);
    const events = sim.drainEvents();
    expect(events.filter((ev) => ev.type === 'freeholdDenied')).toEqual([]);
    expect(events.filter((ev) => ev.type === 'respawn')).toEqual([{ type: 'respawn', pid }]);
    expect(textEvents(events)).toEqual([{ type: 'log', text: INN.enterText, color: '#b9f', pid }]);
  });
});

describe('determinism', () => {
  function drive(
    sim: Sim,
    leave = true,
  ): {
    positions: number[][];
    slots: (string | number | null)[][];
    draws: number;
  } {
    const a = addOwner(sim, 'Aaa', ACCOUNT);
    const b = addOwner(sim, 'Bbb', ACCOUNT);
    const c = addOwner(sim, 'Ccc');
    const draws = countDraws(sim, () => {
      enterFreehold(sim.ctx, a);
      enterFreehold(sim.ctx, b);
      enterFreehold(sim.ctx, c);
      for (let i = 0; i < 40; i++) sim.tick();
      if (leave) leaveFreehold(sim.ctx, a);
      for (let i = 0; i < 20; i++) sim.tick();
    });
    return {
      positions: [a, b, c].map((pid) => {
        const e = entity(sim, pid);
        return [e.pos.x, e.pos.y, e.pos.z, e.facing];
      }),
      slots: sim.instances
        .filter((i) => i.partyKey !== null)
        .map((i) => [i.dungeonId, i.slot, i.partyKey, i.exitId, i.emptyFor]),
      draws,
    };
  }

  it('the same seed and drive give identical positions, slots and draw counts', () => {
    const one = drive(makeSim(1234));
    const two = drive(makeSim(1234));
    expect(one).toEqual(two);
    expect(one.slots).toHaveLength(2);
    // Anti-vacuity: a different drive changes something the digest sees.
    expect(drive(makeSim(1234), false)).not.toEqual(one);
  });
});
