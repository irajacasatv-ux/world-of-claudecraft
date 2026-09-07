import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../server/db', () => ({
  pool: { query: vi.fn(async () => ({ rows: [] })) },
  saveCharacterState: vi.fn(async () => {}),
  saveCharacterAndGuildBankState: vi.fn(async () => true),
  saveCharacterAndMarketState: vi.fn(async () => {}),
  saveMarketState: vi.fn(async () => {}),
  saveMailState: vi.fn(async () => {}),
  saveMailPartitions: vi.fn(async () => {}),
  openPlaySession: vi.fn(async () => 1),
  touchCharacterLogin: vi.fn(async () => {}),
  closePlaySession: vi.fn(async () => {}),
  insertChatLogs: vi.fn(async () => {}),
  walletForAccount: vi.fn(async () => null),
  markAccountQuestComplete: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  grantAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  setAccountWeaponSkinLoadout: vi.fn(async () => ({
    completedQuestIds: [],
    mechChromaIds: [],
    weaponSkinIds: [],
    weaponSkinLoadout: {},
  })),
  loadAccountFlair: vi.fn(async () => ({ ai: false, streamer: false, links: {} })),
}));

import { GameServer } from '../server/game';
import { RIFT_ESSENCE_ITEM_ID, RIFT_GEM_IDS } from '../src/sim/content/rift/items';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import {
  createRiftGearInstance,
  type RiftForgeAction,
  type RiftForgeResult,
} from '../src/sim/rift/progression';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import type { IWorld } from '../src/world_api';
import { FURNISHING } from './fixtures/furnishing_item';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';

const ID = FURNISHING.id;
const GEM_ID = RIFT_GEM_IDS[0];
type Target = { slotIndex: number } | undefined;
type ForgeWorld = {
  [K in 'upgradeRiftItem' | 'enchantRiftItem' | 'socketRiftGem']: (
    ...args: Parameters<IWorld[K]>
  ) => unknown;
};

const ACTIONS = [
  {
    action: 'upgrade',
    command: 'rift_upgrade_item',
    fields: {},
    invoke: (world: ForgeWorld, itemId: string, target: Target) =>
      world.upgradeRiftItem(itemId, target),
    result: { upgradeLevel: 1, essenceSpent: 2 },
    essence: 18,
    gems: 2,
    stats: { str: 5, sta: 2 },
  },
  {
    action: 'enchant',
    command: 'rift_enchant_item',
    fields: { stat: 'critRating' },
    invoke: (world: ForgeWorld, itemId: string, target: Target) =>
      world.enchantRiftItem(itemId, 'critRating', target),
    result: { essenceSpent: 4 },
    essence: 16,
    gems: 2,
    stats: { str: 4, sta: 2, critRating: 2 },
  },
  {
    action: 'socket',
    command: 'rift_socket_gem',
    fields: { gem: GEM_ID },
    invoke: (world: ForgeWorld, itemId: string, target: Target) =>
      world.socketRiftGem(itemId, GEM_ID, target),
    result: {},
    essence: 20,
    gems: 1,
    stats: { str: 6, sta: 2 },
  },
] as const;
const CASES = ACTIONS.flatMap((row) =>
  (['named slot', 'legacy item id'] as const).map((selection) => ({ ...row, selection })),
);

beforeEach(() => {
  ITEMS[ID] = structuredClone(FURNISHING);
});
afterEach(() => {
  delete ITEMS[ID];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function prepare(sim: Sim, pid = sim.playerId) {
  const gear = createRiftGearInstance('furnishing-forge-control', 'S', 'warrior', pid);
  // Inject the malformed live copy deliberately: the save loader already rejects
  // Rift payloads on non-shell ids, but command admission must hold independently.
  sim
    .meta(pid)!
    .inventory.splice(
      0,
      sim.meta(pid)!.inventory.length,
      { itemId: ID, count: 1, instance: structuredClone(gear.instance) },
      { itemId: gear.itemId, count: 1, instance: structuredClone(gear.instance) },
      { itemId: RIFT_ESSENCE_ITEM_ID, count: 20 },
      { itemId: GEM_ID, count: 2 },
    );
  sim.drainEvents();
  return gear.itemId;
}

function snapshot(sim: Sim, pid: number) {
  return structuredClone({
    character: sim.serializeCharacter(pid),
    meta: sim.meta(pid),
    entities: [...sim.entities],
  });
}

function withoutMutation(sim: Sim, pid: number, invoke: () => unknown) {
  const before = snapshot(sim, pid);
  const draws = vi.spyOn(sim.rng, 'next');
  const result = invoke();
  expect(snapshot(sim, pid)).toEqual(before);
  expect(draws).not.toHaveBeenCalled();
  draws.mockRestore();
  expect(sim.countItem(ID, pid)).toBe(1);
  expect(sim.countItem(RIFT_ESSENCE_ITEM_ID, pid)).toBe(20);
  expect(sim.countItem(GEM_ID, pid)).toBe(2);
  return result;
}

function refusal(action: RiftForgeAction): RiftForgeResult {
  return { ok: false, action, itemId: ID, reason: 'not_rift_gear' };
}

function expectControl(sim: Sim, pid: number, itemId: string, row: (typeof ACTIONS)[number]) {
  expect(sim.countItem(itemId, pid)).toBe(1);
  expect(sim.countItem(ID, pid)).toBe(1);
  expect(sim.countItem(RIFT_ESSENCE_ITEM_ID, pid)).toBe(row.essence);
  expect(sim.countItem(GEM_ID, pid)).toBe(row.gems);
  const copy = sim.meta(pid)!.inventory.find((slot) => slot.itemId === itemId)!;
  expect(copy.instance?.rolled).toEqual({ quality: 'epic', stats: row.stats });
  expect(copy.instance?.rift?.upgradeLevel).toBe(row.action === 'upgrade' ? 1 : 0);
  expect(copy.instance?.rift?.enchant).toEqual(
    row.action === 'enchant' ? { stat: 'critRating', value: 2 } : undefined,
  );
  expect(copy.instance?.rift?.gems).toEqual(row.action === 'socket' ? [GEM_ID] : []);
}

describe('furnishing Rift admission on the shared Sim', () => {
  it.each(CASES)('$action refuses a furnishing via $selection and accepts the shell', (row) => {
    const sim = new Sim({
      seed: 734,
      playerClass: 'warrior',
      autoEquip: false,
      world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
    });
    const pid = sim.playerId;
    const controlId = prepare(sim);
    const named = row.selection === 'named slot';
    expect(sim.countItem(ID)).toBe(1);
    const copyBefore = structuredClone(sim.inventory[0]);
    const result = withoutMutation(sim, pid, () =>
      row.invoke(sim, ID, named ? { slotIndex: 0 } : undefined),
    );
    expect(result).toEqual(refusal(row.action));
    expect(sim.drainEvents()).toEqual([{ type: 'riftForgeResult', pid, ...refusal(row.action) }]);

    const wireRevBefore = sim.meta(pid)!.wireRev;
    expect(row.invoke(sim, controlId, named ? { slotIndex: 1 } : undefined)).toEqual({
      ok: true,
      action: row.action,
      itemId: controlId,
      ...row.result,
    });
    expectControl(sim, pid, controlId, row);
    expect(sim.inventory[0]).toEqual(copyBefore);
    expect(sim.meta(pid)!.wireRev).toBeGreaterThan(wireRevBefore);
    expect(sim.drainEvents().filter((event) => event.type === 'riftForgeResult')).toEqual([
      {
        type: 'riftForgeResult',
        pid,
        ok: true,
        action: row.action,
        itemId: controlId,
        ...row.result,
      },
    ]);
  });
});

function online() {
  // This tests the shared rule behind the explicit realm opt-in. The default
  // closed wire and its refusal counter remain pinned by rift_forge_gate.test.ts.
  vi.stubEnv('RIFT_FORGE_ENABLED', '1');
  vi.stubGlobal('WebSocket', { OPEN: 1 });
  const server = new GameServer();
  const socket = fakeWs();
  const session = joinServer(server, socket, 9111, 'Rift Tester');
  const sim = server.sim;
  const pid = session.pid;
  const controlId = prepare(sim, pid);
  const sent: unknown[] = [];
  const client = bareClient(pid, {
    ws: {
      readyState: 1,
      send: (raw: string) => {
        sent.push(JSON.parse(raw));
        server.handleMessage(session, raw);
      },
    },
  });
  let received = 0;
  const sync = () => {
    (server as unknown as { routeEvents(events: SimEvent[]): void }).routeEvents(sim.drainEvents());
    broadcast(server);
    for (const frame of socket.sent.slice(received)) {
      if (frame.t === 'events')
        (client as unknown as { onMessage(raw: string): void }).onMessage(JSON.stringify(frame));
    }
    received = socket.sent.length;
    const snap = lastSnap(socket.sent);
    expect(snap).not.toBeNull();
    (client as unknown as { applySnapshot(frame: unknown): void }).applySnapshot(snap);
  };
  sync();
  client.drainEvents();
  return { sim, pid, controlId, client, sent, sync };
}

describe('furnishing Rift admission through ClientWorld and GameServer', () => {
  it.each(CASES)('$action refuses a furnishing via $selection and mirrors shell success', (row) => {
    const remote = online();
    const { sim, pid, controlId, client, sent, sync } = remote;
    const named = row.selection === 'named slot';
    const before = structuredClone(client.inventory);
    expect(before.find((slot) => slot.itemId === ID)?.count).toBe(1);
    expect(
      withoutMutation(sim, pid, () => row.invoke(client, ID, named ? { slotIndex: 0 } : undefined)),
    ).toBeUndefined();
    expect(sent).toEqual([
      { t: 'cmd', cmd: row.command, item: ID, ...row.fields, ...(named && { slot: 0 }) },
    ]);
    expect(client.inventory).toEqual(before);
    sync();
    expect(client.inventory).toEqual(before);
    expect(client.drainEvents()).toEqual([
      { type: 'riftForgeResult', pid, ...refusal(row.action) },
    ]);

    const wireRevBefore = sim.meta(pid)!.wireRev;
    row.invoke(client, controlId, named ? { slotIndex: 1 } : undefined);
    expect(client.inventory).toEqual(before);
    sync();
    expectControl(sim, pid, controlId, row);
    expect(sim.meta(pid)!.wireRev).toBeGreaterThan(wireRevBefore);
    expect(client.inventory).toEqual(sim.meta(pid)!.inventory);
    expect(client.inventory.find((slot) => slot.itemId === ID)).toEqual(before[0]);
    expect(client.drainEvents().filter((event) => event.type === 'riftForgeResult')).toEqual([
      {
        type: 'riftForgeResult',
        pid,
        ok: true,
        action: row.action,
        itemId: controlId,
        ...row.result,
      },
    ]);
  });
});
