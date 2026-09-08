// Character JSON keeps the permanent tool through the ordinary item save path.
// Account travel authority remains outside both character and plot snapshots;
// this isolated-host round trip makes no durable online-authority claim.
import { describe, expect, it } from 'vitest';
import { isBlocked } from '../src/sim/colliders';
import { BUILTIN_WORLD, dungeonAt } from '../src/sim/data';
import { loadFreehold, serializeFreehold, setFreeholdTier } from '../src/sim/freehold/state';
import type { FreeholdState } from '../src/sim/freehold/types';
import { type CharacterState, Sim } from '../src/sim/sim';

const OWNER = 'account:8106';

function makeSim() {
  return new Sim({
    seed: 42,
    playerClass: 'warrior',
    noPlayer: true,
    freeholdsEnabled: true,
    lockoutNowMs: () => 1000,
    world: {
      ...BUILTIN_WORLD,
      camps: [],
      npcs: { bursar_fernando: BUILTIN_WORLD.npcs.bursar_fernando },
      groundObjects: [],
    },
  });
}

function entity(sim: Sim, pid: number) {
  const player = sim.entities.get(pid);
  if (!player) throw new Error(`Missing player ${pid}`);
  return player;
}

function moveTo(sim: Sim, pid: number, templateId: string) {
  const target = [...sim.entities.values()].find((e) => e.templateId === templateId);
  if (!target) throw new Error(`Missing ${templateId}`);
  const player = entity(sim, pid);
  player.pos = { ...target.pos };
  player.prevPos = { ...player.pos };
  sim.ctx.rebucket(player);
}

function enterGate(sim: Sim, pid: number) {
  moveTo(sim, pid, 'freehold_gate');
  sim.freeholdEnter(pid);
}

function jsonRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function snapshots(sim: Sim, pid: number) {
  const character = sim.serializeCharacter(pid);
  const plot = serializeFreehold(sim.ctx, OWNER);
  if (!character || !plot) throw new Error('Missing character or plot snapshot');
  return { character: jsonRoundTrip(character), plot: jsonRoundTrip(plot) };
}

function restore(character: CharacterState, plot: FreeholdState) {
  const sim = makeSim();
  // Plot authority is loaded separately. Character JSON never chooses a tier
  // or owner stamp; the caller supplies its authenticated account again.
  loadFreehold(sim.ctx, OWNER, plot);
  const pid = sim.addPlayer('warrior', 'Restored', { state: character, freeholdOwnerKey: OWNER });
  return { sim, pid };
}

function keyRows(inventory: CharacterState['inventory']) {
  return inventory.filter((slot) => slot.itemId === 'hearth_key');
}

function allKeys(value: unknown): string[] {
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, nested]) => [key, ...allKeys(nested)]);
}

function expectNoSessionHousing(character: CharacterState, plot: FreeholdState) {
  for (const blob of [character, plot]) {
    expect(JSON.stringify(blob)).not.toContain('3601000');
    expect(
      allKeys(blob).filter((key) =>
        /^(freeholdOwnerKey|freeholdKeyReadyAtMs|readyAtMs|dungeonEntrySeq)$/.test(key),
      ),
    ).toEqual([]);
  }
  expect(JSON.stringify(character)).not.toContain(OWNER);
  expect(allKeys(character).filter((key) => /freehold|housing|plotId|ownerKey/i.test(key))).toEqual(
    [],
  );
  // The private plot's own identity is intentional and distinct from a
  // PlayerMeta freeholdOwnerKey stamp or an account Hearth deadline.
  expect(plot.ownerKey).toBe(OWNER);
}

describe.each(['inn_room', 'cottage'] as const)('%s Hearth Key character JSON', (tier) => {
  it('retains exactly one granted key, restores safely outside, and never duplicates it on the next gate entry', () => {
    const source = makeSim();
    const pid = source.addPlayer('warrior', 'Original', { freeholdOwnerKey: OWNER });
    setFreeholdTier(source.ctx, OWNER, tier);
    enterGate(source, pid);
    expect(dungeonAt(entity(source, pid).pos.x)?.id).toBe(`freehold_${tier}`);
    expect(source.countItem('hearth_key', pid)).toBe(1);
    source.freeholdLeave(pid);
    source.useItem('hearth_key', pid);
    expect(source.freeholdKeyReadyAtMs.get(OWNER)).toBe(3601000);
    expect(entity(source, pid).dungeonEntrySeq).toBe(2);
    expect(source.meta(pid)?.freeholdOwnerKey).toBe(OWNER);

    const { character, plot } = snapshots(source, pid);
    expect(keyRows(character.inventory)).toEqual([{ itemId: 'hearth_key', count: 1 }]);
    expect(plot.tier).toBe(tier);
    expectNoSessionHousing(character, plot);
    const restored = restore(character, plot);
    const player = entity(restored.sim, restored.pid);
    expect(keyRows(restored.sim.meta(restored.pid)!.inventory)).toEqual([
      { itemId: 'hearth_key', count: 1 },
    ]);
    expect(player.pos).toEqual(restored.sim.groundPos(-14, -96));
    expect(dungeonAt(player.pos.x)).toBeNull();
    expect(restored.sim.ctx.instanceClaimIdAt(player.pos)).toBeNull();
    expect(isBlocked(42, player.pos.x, player.pos.z, 0.5)).toBe(false);
    expect(player.dungeonEntrySeq).toBe(0);
    expect(restored.sim.freeholdKeyReadyAtMs.size).toBe(0);
    // The loaded inventory owns a clone, not the caller's parsed row.
    keyRows(character.inventory)[0].count = 9;
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(1);
    enterGate(restored.sim, restored.pid);
    expect(dungeonAt(player.pos.x)?.id).toBe(`freehold_${tier}`);
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(1);
    expect(restored.sim.freeholdKeyReadyAtMs.size).toBe(0);
    expect(source.freeholdKeyReadyAtMs.get(OWNER)).toBe(3601000);
    const next = snapshots(restored.sim, restored.pid);
    expect(keyRows(next.character.inventory)).toEqual([{ itemId: 'hearth_key', count: 1 }]);
    expectNoSessionHousing(next.character, next.plot);
  });

  it('loads an old keyless character without granting a key until explicit authorized gate entry', () => {
    const source = makeSim();
    const pid = source.addPlayer('warrior', 'OldCharacter', { freeholdOwnerKey: OWNER });
    setFreeholdTier(source.ctx, OWNER, tier);
    const { character, plot } = snapshots(source, pid);
    expect(keyRows(character.inventory)).toEqual([]);
    const restored = restore(character, plot);
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(0);
    moveTo(restored.sim, restored.pid, 'freehold_gate');
    for (let i = 0; i < 4; i++) restored.sim.tick();
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(0);
    expect(restored.sim.instances.filter((claim) => claim.partyKey !== null)).toEqual([]);
    restored.sim.freeholdEnter(restored.pid);
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(1);
    expect(dungeonAt(entity(restored.sim, restored.pid).pos.x)?.id).toBe(`freehold_${tier}`);
    expect(restored.sim.freeholdKeyReadyAtMs.size).toBe(0);
  });

  it('retains one banked key through JSON restore and gate entry before withdrawing it', () => {
    const source = makeSim();
    const pid = source.addPlayer('warrior', 'Banker', { freeholdOwnerKey: OWNER });
    setFreeholdTier(source.ctx, OWNER, tier);
    enterGate(source, pid);
    source.freeholdLeave(pid);
    moveTo(source, pid, 'bursar_fernando');
    source.bankDeposit(
      source.meta(pid)!.inventory.findIndex((slot) => slot.itemId === 'hearth_key'),
      undefined,
      pid,
    );
    expect(source.countItem('hearth_key', pid)).toBe(0);
    expect(keyRows(source.meta(pid)!.bank.inventory)).toEqual([{ itemId: 'hearth_key', count: 1 }]);
    const { character, plot } = snapshots(source, pid);
    expect(keyRows(character.inventory)).toEqual([]);
    expect(keyRows(character.bank!.inventory)).toEqual([{ itemId: 'hearth_key', count: 1 }]);
    const restored = restore(character, plot);
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(0);
    expect(keyRows(restored.sim.meta(restored.pid)!.bank.inventory)).toEqual([
      { itemId: 'hearth_key', count: 1 },
    ]);
    keyRows(character.bank!.inventory)[0].count = 9;
    expect(keyRows(restored.sim.meta(restored.pid)!.bank.inventory)[0].count).toBe(1);
    const meta = restored.sim.meta(restored.pid)!;
    const bankBefore = structuredClone(meta.bank);
    const entitlementBefore = serializeFreehold(restored.sim.ctx, OWNER);
    const wireRevBefore = meta.wireRev;
    const clockBefore = [...restored.sim.freeholdKeyReadyAtMs];
    restored.sim.drainEvents();
    enterGate(restored.sim, restored.pid);
    expect(dungeonAt(entity(restored.sim, restored.pid).pos.x)?.id).toBe(`freehold_${tier}`);
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(0);
    expect(keyRows(meta.bank.inventory)).toEqual([{ itemId: 'hearth_key', count: 1 }]);
    expect(meta.bank).toEqual(bankBefore);
    expect(meta.wireRev).toBe(wireRevBefore);
    expect(serializeFreehold(restored.sim.ctx, OWNER)).toEqual(entitlementBefore);
    expect([...restored.sim.freeholdKeyReadyAtMs]).toEqual(clockBefore);
    expect(restored.sim.drainEvents().filter((event) => event.type === 'loot')).toEqual([]);
    restored.sim.freeholdLeave(restored.pid);
    moveTo(restored.sim, restored.pid, 'bursar_fernando');
    restored.sim.bankWithdraw(
      restored.sim
        .meta(restored.pid)!
        .bank.inventory.findIndex((slot) => slot.itemId === 'hearth_key'),
      undefined,
      restored.pid,
    );
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(1);
    expect(keyRows(restored.sim.meta(restored.pid)!.bank.inventory)).toEqual([]);
    enterGate(restored.sim, restored.pid);
    expect(restored.sim.countItem('hearth_key', restored.pid)).toBe(1);
    expectNoSessionHousing(snapshots(restored.sim, restored.pid).character, plot);
  });
});
