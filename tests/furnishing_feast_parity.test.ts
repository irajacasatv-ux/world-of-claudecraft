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
import type { ClientWorld } from '../src/net/online';
import { ITEMS } from '../src/sim/data';
import type { Sim } from '../src/sim/sim';
import type { ItemDef, SimEvent } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';

const ID = FURNISHING.id;
const SIGNED = { signer: 'Feast Table Maker' };

beforeEach(() => {
  // Deliberately malformed metadata must not make furnishing usable as food.
  ITEMS[ID] = {
    ...structuredClone(ITEMS.harvest_feast),
    ...structuredClone(ITEMS.evergarden_braised_greens),
    ...structuredClone(FURNISHING),
  } as unknown as ItemDef;
  vi.stubGlobal('WebSocket', { OPEN: 1 });
  vi.spyOn(performance, 'now').mockReturnValue(1000);
});

afterEach(() => {
  delete ITEMS[ID];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function serverState(sim: Sim, pid: number) {
  const meta = sim.meta(pid);
  expect(meta).toBeDefined();
  expect(meta).not.toBeNull();
  expect(sim.entities.has(pid)).toBe(true);
  const rngState = (sim.rng as unknown as { s: number }).s;
  expect(Number.isFinite(rngState)).toBe(true);
  return structuredClone({
    meta,
    entities: [...sim.entities],
    feasts: [...sim.ctx.feasts],
    nextId: sim.ctx.nextId,
    rngState,
  });
}

function clientState(client: ClientWorld) {
  expect(client.entities.has(client.playerId)).toBe(true);
  // Transport queues carry the command and its result; these are game mirrors.
  return structuredClone({
    entities: [...client.entities],
    inventory: client.inventory,
    bags: client.bags,
    equipment: client.equipment,
    equipmentInstances: client.equipmentInstances,
    copper: client.copper,
  });
}

function online() {
  const server = new GameServer();
  const socket = fakeWs();
  const session = joinServer(server, socket, 9123, 'Feast Tester');
  const sim = server.sim;
  const pid = session.pid;
  const meta = sim.meta(pid);
  if (!meta) throw new Error('Joined player metadata is missing.');
  const player = sim.entities.get(pid);
  if (!player) throw new Error('Joined player entity is missing.');
  meta.inventory.splice(
    0,
    meta.inventory.length,
    { itemId: ID, count: 1, instance: structuredClone(SIGNED) },
    { itemId: 'harvest_feast', count: 1 },
  );
  sim.drainEvents();
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
      if (frame.t === 'events') {
        (client as unknown as { onMessage(raw: string): void }).onMessage(JSON.stringify(frame));
      }
    }
    received = socket.sent.length;
    const snapshot = lastSnap(socket.sent);
    expect(snapshot).not.toBeNull();
    (client as unknown as { applySnapshot(frame: unknown): void }).applySnapshot(snapshot);
  };
  sync();
  client.drainEvents();
  return { sim, pid, meta, player, client, sent, sync };
}

describe('furnishing feast commands through ClientWorld and GameServer', () => {
  it('refuses the furnishing slot without mutation and places the eligible feast using the same client method', () => {
    const { sim, pid, client, sent, sync } = online();
    const place = vi.spyOn(sim, 'placeFeast');
    const draws = vi.spyOn(sim.rng, 'next');
    const serverBefore = serverState(sim, pid);
    const clientBefore = clientState(client);
    expect(sim.countItem(ID, pid)).toBe(1);
    expect(sim.countItem('harvest_feast', pid)).toBe(1);
    expect(sim.ctx.feasts.size).toBe(0);

    expect(client.placeFeast({ slotIndex: 0 })).toBeUndefined();

    expect(sent).toEqual([{ t: 'cmd', cmd: 'place_feast', slot: 0 }]);
    expect(place).toHaveBeenCalledExactlyOnceWith(pid, 0);
    expect(serverState(sim, pid)).toEqual(serverBefore);
    expect(clientState(client)).toEqual(clientBefore);
    sync();
    expect(serverState(sim, pid)).toEqual(serverBefore);
    expect(clientState(client)).toEqual(clientBefore);
    expect(draws).not.toHaveBeenCalled();
    expect(client.drainEvents()).toEqual([{ type: 'farmDenied', pid, reason: 'no_feast' }]);
    expect(sim.countItem(ID, pid)).toBe(1);
    expect(sim.countItem('harvest_feast', pid)).toBe(1);
    expect(sim.ctx.feasts.size).toBe(0);

    client.placeFeast({ slotIndex: 1 });

    expect(sent.at(-1)).toEqual({ t: 'cmd', cmd: 'place_feast', slot: 1 });
    expect(place).toHaveBeenNthCalledWith(2, pid, 1);
    expect(clientState(client)).toEqual(clientBefore);
    expect(sim.countItem('harvest_feast', pid)).toBe(0);
    expect(sim.countItem(ID, pid)).toBe(1);
    expect(sim.ctx.feasts.size).toBe(1);
    const [[feastId, feast]] = [...sim.ctx.feasts];
    expect(feast.charges).toBe(10);
    expect(feast.dishItemId).toBe('evergarden_braised_greens');
    expect(feast.eatenBy).toEqual(new Set());
    expect(sim.entities.get(feastId)?.templateId).toBe('farm_feast');
    expect(sim.ctx.nextId).toBe(serverBefore.nextId + 1);
    sync();
    expect(client.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(client.entities.get(feastId)?.templateId).toBe('farm_feast');
    expect(client.entities.get(feastId)?.lootable).toBe(false);
    expect(client.drainEvents()).toEqual([{ type: 'farmFeastPlaced', pid, feastId }]);
    expect(draws).not.toHaveBeenCalled();
  });

  it('refuses a furnishing dish without spending a serving and mirrors the eligible meal through the same client method', () => {
    const { sim, pid, meta, player, client, sent, sync } = online();
    client.placeFeast({ slotIndex: 1 });
    sync();
    expect(sim.ctx.feasts.size).toBe(1);
    const [[feastId, feast]] = [...sim.ctx.feasts];
    expect(client.entities.get(feastId)?.templateId).toBe('farm_feast');
    expect(feast.dishItemId).toBe('evergarden_braised_greens');
    feast.dishItemId = ID;
    sync();
    client.drainEvents();
    sent.splice(0);
    const consume = vi.spyOn(sim, 'consumeFeast');
    const draws = vi.spyOn(sim.rng, 'next');
    const serverBefore = serverState(sim, pid);
    const clientBefore = clientState(client);
    expect(feast.charges).toBe(10);
    expect(feast.eatenBy.size).toBe(0);
    expect(player.eating).toBeNull();
    expect(player.sitting).toBe(false);
    expect(client.player.eating).toBeNull();
    expect(client.player.sitting).toBe(false);
    expect(client.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);

    expect(client.consumeFeast(feastId)).toBeUndefined();

    expect(sent).toEqual([{ t: 'cmd', cmd: 'consume_feast', id: feastId }]);
    expect(consume).toHaveBeenCalledExactlyOnceWith(feastId, pid);
    expect(serverState(sim, pid)).toEqual(serverBefore);
    expect(clientState(client)).toEqual(clientBefore);
    sync();
    expect(serverState(sim, pid)).toEqual(serverBefore);
    expect(clientState(client)).toEqual(clientBefore);
    expect(client.drainEvents()).toEqual([]);
    expect(draws).not.toHaveBeenCalled();
    expect(feast.charges).toBe(10);
    expect(feast.eatenBy).toEqual(new Set());
    expect(player.eating).toBeNull();
    expect(sim.countItem(ID, pid)).toBe(1);

    feast.dishItemId = 'evergarden_braised_greens';
    client.consumeFeast(feastId);

    expect(sent.at(-1)).toEqual({ t: 'cmd', cmd: 'consume_feast', id: feastId });
    expect(consume).toHaveBeenNthCalledWith(2, feastId, pid);
    expect(clientState(client)).toEqual(clientBefore);
    expect(feast.charges).toBe(9);
    expect(feast.eatenBy).toEqual(new Set(['character:9123']));
    expect(player.sitting).toBe(true);
    expect(player.eating).toEqual({
      itemId: 'evergarden_braised_greens',
      kind: 'food',
      hpPer2s: 109,
      manaPer2s: 0,
      remaining: 18,
      ticksElapsed: 0,
      wellFed: { aura: 'Well Fed', kind: 'buff_sta', value: 5, duration: 600 },
    });
    sync();
    expect(client.player.sitting).toBe(true);
    // The wire carries the active meal duration, not the server's power data.
    expect(client.player.eating).toEqual({
      itemId: '',
      kind: 'food',
      hpPer2s: 0,
      manaPer2s: 0,
      remaining: 18,
      ticksElapsed: 0,
    });
    expect(meta.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(client.inventory).toEqual(meta.inventory);
    expect(client.drainEvents()).toEqual([
      { type: 'heal', targetId: pid, amount: 0, source: 'food', sfxTick: true },
      { type: 'log', text: 'You sit down to eat.', color: '#999', pid },
    ]);
    expect(draws).not.toHaveBeenCalled();
  });
});
