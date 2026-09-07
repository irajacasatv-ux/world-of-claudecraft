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
import { updateCasting } from '../src/sim/combat/casting_lifecycle';
import * as recipes from '../src/sim/content/recipes';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import type { ProfessionRecipeRecord } from '../src/sim/professions/types';
import { Sim } from '../src/sim/sim';
import type { ItemDef, ItemInstancePayload, SimEvent } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';

const ID = FURNISHING.id;
const GEAR: ItemDef = {
  id: 'test_furnishing_commerce_gear',
  name: 'Commerce Control Sword',
  kind: 'weapon',
  quality: 'rare',
  sellValue: 25,
  slot: 'mainhand',
  requiredLevel: 20,
  stats: { str: 4 },
  weapon: { min: 5, max: 7, speed: 2 },
};
const RECIPE: ProfessionRecipeRecord = {
  id: 'test_furnishing_commerce_recipe',
  professionId: 'weaponcrafting',
  resultItemId: ID,
  resultCount: 1,
  reagents: [{ itemId: 'bone_fragments', count: 1 }],
  skillReq: 0,
  itemLevelBudget: 20,
  level: 20,
};
const CONTROL_RECIPE = { ...RECIPE, id: `${RECIPE.id}_control`, resultItemId: GEAR.id };

beforeEach(() => {
  ITEMS[ID] = structuredClone(FURNISHING);
  ITEMS[GEAR.id] = structuredClone(GEAR);
});

afterEach(() => {
  delete ITEMS[ID];
  delete ITEMS[GEAR.id];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function clearInventory(sim: Sim, pid: number): void {
  const meta = sim.meta(pid);
  expect(meta).toBeDefined();
  if (!meta) throw new Error('Commerce player is missing');
  meta.inventory.splice(0);
  meta.equipment = {};
  meta.equipmentInstance = {};
  meta.copper = 10_000;
}

function online() {
  vi.stubGlobal('WebSocket', { OPEN: 1 });
  const server = new GameServer();
  const sim = server.sim;
  const peers: Array<{ sync(): void }> = [];
  const join = (characterId: number, name: string) => {
    const socket = fakeWs();
    const session = joinServer(server, socket, characterId, name);
    clearInventory(sim, session.pid);
    const sent: unknown[] = [];
    const client = bareClient(session.pid, {
      ws: {
        readyState: 1,
        send: (raw: string) => {
          sent.push(JSON.parse(raw));
          server.handleMessage(session, raw);
        },
      },
    });
    let received = 0;
    const peer = {
      pid: session.pid,
      client,
      sent,
      sync() {
        for (const frame of socket.sent.slice(received)) {
          if (frame.t === 'events') {
            (client as unknown as { onMessage(raw: string): void }).onMessage(
              JSON.stringify(frame),
            );
          }
        }
        received = socket.sent.length;
        const snap = lastSnap(socket.sent);
        expect(snap).not.toBeNull();
        (client as unknown as { applySnapshot(snap: unknown): void }).applySnapshot(snap);
      },
    };
    peers.push(peer);
    return peer;
  };
  const first = join(9201, 'Commerce Maker');
  const sync = () => {
    (server as unknown as { routeEvents(events: SimEvent[]): void }).routeEvents(sim.drainEvents());
    broadcast(server);
    for (const peer of peers) peer.sync();
  };
  return { sim, join, ...first, sync };
}

function host(mode: 'offline' | 'online'): {
  sim: Sim;
  pid: number;
  world: Sim | ClientWorld;
  sent: unknown[];
  sync(): void;
} {
  if (mode === 'online') {
    const remote = online();
    return { ...remote, world: remote.client };
  }
  const sim = new Sim({
    seed: 73,
    playerClass: 'warrior',
    autoEquip: false,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
  clearInventory(sim, sim.playerId);
  return { sim, pid: sim.playerId, world: sim, sent: [], sync() {} };
}

function atEntity(sim: Sim, pid: number, targetId: number): void {
  const player = sim.entities.get(pid);
  const target = sim.entities.get(targetId);
  expect(player).toBeDefined();
  expect(target).toBeDefined();
  if (!player || !target) throw new Error('Commerce location is missing');
  player.pos = { ...target.pos };
  player.prevPos = { ...player.pos };
  sim.rebucket(player);
}

function snapshot(sim: Sim, pid: number) {
  const character = sim.serializeCharacter(pid);
  expect(character).not.toBeNull();
  return structuredClone({ character, entities: [...sim.entities], listings: sim.marketListings });
}

function completeCast(sim: Sim, pid: number): void {
  const player = sim.entities.get(pid);
  const meta = sim.meta(pid);
  expect(player?.castingAbility).toBe('crafting');
  if (!player || !meta) throw new Error('Commerce cast owner is missing');
  for (let step = 0; step < 200 && player.castingAbility !== null; step++) {
    updateCasting(sim.ctx, player, meta);
  }
  expect(player.castingAbility).toBeNull();
}

describe.each(['offline', 'online'] as const)('furnishing %s commerce commands', (mode) => {
  it.each([false, true])(
    'crafts signer-only furnishing with forced apex=%s power and a gear control',
    (apex) => {
      ITEMS[ID] = { ...GEAR, ...FURNISHING, masterwrought: apex } as unknown as ItemDef;
      ITEMS[GEAR.id] = { ...GEAR, masterwrought: apex } as ItemDef;
      const originalRecipe = recipes.recipeById;
      vi.spyOn(recipes, 'recipeById').mockImplementation((id) => {
        if (id === RECIPE.id) return RECIPE;
        if (id === CONTROL_RECIPE.id) return CONTROL_RECIPE;
        return originalRecipe(id);
      });
      const entry = host(mode);
      const meta = entry.sim.meta(entry.pid)!;
      meta.craftSkills.weaponcrafting = 100;
      meta.archetype.activeArchetype = 'weaponcrafting';
      meta.archetype.pairedMajor = null;
      meta.archetype.hobbyCraft = null;
      meta.archetype.isJackOfAllTrades = false;
      meta.knownRecipes.add(RECIPE.id);
      meta.knownRecipes.add(CONTROL_RECIPE.id);
      entry.sim.addItem('bone_fragments', 2, entry.pid);
      entry.sync();
      const draws = vi.spyOn(entry.sim.rng, 'next').mockReturnValue(0);
      entry.world.craftItem(RECIPE.id, true, 1);
      expect(draws).not.toHaveBeenCalled();
      completeCast(entry.sim, entry.pid);
      expect(draws).toHaveBeenCalledTimes(1);
      expect(meta.lastCraftResult).toMatchObject({ ok: true, recipeId: RECIPE.id });
      expect(meta.lastCraftResult?.commission).toBeUndefined();
      expect(meta.lastCraftResult?.masterwork).toBeUndefined();
      expect(meta.inventory.find((slot) => slot.itemId === ID)).toEqual({
        itemId: ID,
        count: 1,
        instance: { signer: meta.name },
      });
      entry.sync();
      expect(entry.world.inventory.find((slot) => slot.itemId === ID)).toEqual({
        itemId: ID,
        count: 1,
        instance: { signer: meta.name },
      });
      expect(entry.world.lastCraftResult).toMatchObject({ ok: true, recipeId: RECIPE.id });
      expect(meta.copper).toBe(9_960);
      draws.mockClear();
      entry.world.craftItem(CONTROL_RECIPE.id, true, 1);
      completeCast(entry.sim, entry.pid);
      expect(draws).toHaveBeenCalledTimes(1);
      expect(meta.lastCraftResult?.commission).toBe(true);
      const control = meta.inventory.find((slot) => slot.itemId === GEAR.id);
      expect(control?.instance).toMatchObject({ signer: meta.name, bindOnTrade: true });
      if (apex) expect(control?.instance?.perfecting).toBe(1);
      else expect(control?.instance?.rolled?.masterwork).toBe(true);
      expect(entry.sim.countItem('bone_fragments', entry.pid)).toBe(0);
      expect(meta.copper).toBe(9_920);
      entry.sync();
      expect(entry.world.inventory).toEqual(meta.inventory);
      expect(entry.world.copper).toBe(meta.copper);
      if (mode === 'online') {
        expect(entry.sent).toEqual([
          { t: 'cmd', cmd: 'craft_item', recipe: RECIPE.id, commission: true },
          { t: 'cmd', cmd: 'craft_item', recipe: CONTROL_RECIPE.id, commission: true },
        ]);
      }
    },
  );

  it('buys a forged riding furnishing as an ordinary copy and trains only the eligible service', () => {
    ITEMS[ID] = { ...FURNISHING, teachesRiding: true } as unknown as ItemDef;
    const entry = host(mode);
    const meta = entry.sim.meta(entry.pid)!;
    const marla = [...entry.sim.entities.values()].find(
      (entity) => entity.templateId === 'stablemaster_marla',
    );
    expect(marla).toBeDefined();
    if (!marla) throw new Error('Riding vendor is missing');
    marla.vendorItems = [ID, 'riding_training'];
    atEntity(entry.sim, entry.pid, marla.id);
    entry.sim.setPlayerLevel(20, entry.pid);
    meta.copper = 1_000_000;
    meta.ridingTrained = false;
    entry.sim.drainEvents();
    entry.sync();
    const playerBefore = structuredClone(entry.sim.entities.get(entry.pid));
    const draws = vi.spyOn(entry.sim.rng, 'next');
    entry.world.buyItem(marla.id, ID, { count: 2 });
    expect(draws).not.toHaveBeenCalled();
    expect(meta.ridingTrained).toBe(false);
    expect(meta.copper).toBe(999_900);
    expect(meta.inventory).toEqual([{ itemId: ID, count: 1 }]);
    expect(entry.sim.entities.get(entry.pid)).toEqual(playerBefore);
    entry.sync();
    expect(entry.world.ridingTrained()).toBe(false);
    expect(entry.world.inventory).toEqual([{ itemId: ID, count: 1 }]);
    expect(entry.world.copper).toBe(999_900);
    entry.world.buyItem(marla.id, 'riding_training', { count: 2 });
    expect(draws).not.toHaveBeenCalled();
    expect(meta.ridingTrained).toBe(true);
    expect(meta.copper).toBe(199_900);
    expect(meta.inventory).toEqual([{ itemId: ID, count: 1 }]);
    entry.sync();
    expect(entry.world.ridingTrained()).toBe(true);
    expect(entry.world.copper).toBe(199_900);
    expect(entry.world.inventory).toEqual([{ itemId: ID, count: 1 }]);
    if (mode === 'online') {
      expect(entry.sent).toEqual([
        { t: 'cmd', cmd: 'buy', npc: marla.id, item: ID, count: 2 },
        { t: 'cmd', cmd: 'buy', npc: marla.id, item: 'riding_training', count: 2 },
      ]);
    }
  });

  it('lists plain furnishing and gear, recovers both copies, and refuses quest stock unchanged', () => {
    const entry = host(mode);
    atEntity(entry.sim, entry.pid, entry.sim.market.merchantIds[0]);
    for (const itemId of ['supply_crate', ID, GEAR.id]) entry.sim.addItem(itemId, 1, entry.pid);
    entry.sim.drainEvents();
    entry.sync();
    entry.world.drainEvents();
    const before = snapshot(entry.sim, entry.pid);
    const draws = vi.spyOn(entry.sim.rng, 'next');
    entry.world.marketList('supply_crate', 1, 100);
    expect(snapshot(entry.sim, entry.pid)).toEqual(before);
    expect(draws).not.toHaveBeenCalled();
    entry.sync();
    expect(entry.world.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'error', text: 'The Merchant will not broker quest items.' }),
    );
    for (const itemId of [ID, GEAR.id]) {
      const bagBefore = structuredClone(entry.sim.meta(entry.pid)!.inventory);
      entry.world.marketList(itemId, 1, 100);
      expect(entry.sim.countItem(itemId, entry.pid)).toBe(0);
      const listing = entry.sim.marketListings.find((row) => row.itemId === itemId && !row.house);
      expect(listing).toMatchObject({ itemId, count: 1, price: 100 });
      if (!listing) throw new Error('Commerce listing is missing');
      expect(listing.instance).toBeUndefined();
      entry.sync();
      expect(entry.world.inventory.some((slot) => slot.itemId === itemId)).toBe(false);
      expect(entry.world.marketInfo?.listings.find((row) => row.id === listing.id)).toMatchObject({
        itemId,
        count: 1,
        price: 100,
      });
      entry.world.marketCancel(listing.id);
      expect(entry.sim.countItem(itemId, entry.pid)).toBe(1);
      expect(entry.sim.marketListings.some((row) => row.id === listing.id)).toBe(false);
      expect(entry.sim.meta(entry.pid)!.inventory).toEqual(expect.arrayContaining(bagBefore));
      entry.sync();
      expect(entry.world.inventory).toEqual(entry.sim.meta(entry.pid)!.inventory);
      expect(entry.world.marketInfo?.listings.some((row) => row.id === listing.id)).toBe(false);
      expect(entry.world.copper).toBe(10_000);
    }
    expect(draws).not.toHaveBeenCalled();
    expect(entry.sim.countItem('supply_crate', entry.pid)).toBe(1);
    if (mode === 'online') {
      expect(entry.sent.filter((row) => (row as { cmd: string }).cmd === 'market_list')).toEqual([
        { t: 'cmd', cmd: 'market_list', item: 'supply_crate', count: 1, price: 100 },
        { t: 'cmd', cmd: 'market_list', item: ID, count: 1, price: 100 },
        { t: 'cmd', cmd: 'market_list', item: GEAR.id, count: 1, price: 100 },
      ]);
    }
  });
});

describe('furnishing two-client direct trade', () => {
  it.each([false, true])(
    'transfers signer and armed=%s custody through both offers and confirms',
    (armed) => {
      const remote = online();
      const receiver = remote.join(9202, 'Commerce Recipient');
      atEntity(remote.sim, receiver.pid, remote.pid);
      const sender = remote.sim.meta(remote.pid)!;
      const recipient = remote.sim.meta(receiver.pid)!;
      const payload: ItemInstancePayload = {
        signer: 'Commerce Maker',
        ...(armed ? { bindOnTrade: true } : {}),
      };
      const finalPayload = armed ? { ...payload, boundTo: receiver.pid } : payload;
      remote.sim.addItem('supply_crate', 1, remote.pid);
      for (const itemId of [ID, GEAR.id]) {
        remote.sim.ctx.addItemInstance(itemId, structuredClone(payload), remote.pid);
        remote.sim.addItem('bone_fragments', 2, receiver.pid);
        remote.sync();
        const senderCopper = sender.copper;
        const receiverCopper = recipient.copper;
        const draws = vi.spyOn(remote.sim.rng, 'next');
        remote.client.tradeRequest(receiver.pid);
        receiver.client.tradeAccept();
        remote.sync();
        expect(remote.client.tradeInfo?.otherPid).toBe(receiver.pid);
        expect(receiver.client.tradeInfo?.otherPid).toBe(remote.pid);
        if (itemId === ID) {
          const before = snapshot(remote.sim, remote.pid);
          const offerBefore = structuredClone(remote.client.tradeInfo);
          remote.client.tradeSetOffer([{ itemId: 'supply_crate', count: 1 }], 0);
          expect(snapshot(remote.sim, remote.pid)).toEqual(before);
          expect(draws).not.toHaveBeenCalled();
          remote.sync();
          expect(remote.client.tradeInfo).toEqual(offerBefore);
          expect(remote.client.tradeInfo?.myOffer.items).toEqual([]);
          expect(receiver.client.tradeInfo?.theirOffer.items).toEqual([]);
        }
        const offered = [{ itemId, count: 1, instance: structuredClone(payload) }];
        remote.client.tradeSetOffer(offered, 37);
        receiver.client.tradeSetOffer([{ itemId: 'bone_fragments', count: 2 }], 11);
        remote.sync();
        expect(remote.client.tradeInfo?.myOffer).toEqual({ items: offered, copper: 37 });
        expect(receiver.client.tradeInfo?.theirOffer).toEqual({ items: offered, copper: 37 });
        expect(remote.client.tradeInfo?.theirOffer).toEqual({
          items: [
            { itemId: 'bone_fragments', count: 2, materialSources: [{ count: 2, source: {} }] },
          ],
          copper: 11,
        });
        expect(remote.sim.countItem(itemId, remote.pid)).toBe(1);
        remote.client.tradeConfirm();
        remote.sync();
        expect(remote.client.tradeInfo?.myAccepted).toBe(true);
        expect(receiver.client.tradeInfo?.theirAccepted).toBe(true);
        expect(remote.sim.countItem(itemId, remote.pid)).toBe(1);
        receiver.client.tradeConfirm();
        expect(draws).not.toHaveBeenCalled();
        draws.mockRestore();
        expect(remote.sim.countItem(itemId, remote.pid)).toBe(0);
        expect(remote.sim.countItem(itemId, receiver.pid)).toBe(1);
        expect(recipient.inventory.find((slot) => slot.itemId === itemId)).toEqual({
          itemId,
          count: 1,
          instance: finalPayload,
        });
        expect(sender.copper).toBe(senderCopper - 26);
        expect(recipient.copper).toBe(receiverCopper + 26);
        expect(remote.sim.countItem('bone_fragments', receiver.pid)).toBe(0);
        remote.sync();
        expect(remote.client.tradeInfo).toBeNull();
        expect(receiver.client.tradeInfo).toBeNull();
        expect(remote.client.inventory).toEqual(sender.inventory);
        expect(receiver.client.inventory).toEqual(recipient.inventory);
        expect(remote.client.copper).toBe(sender.copper);
        expect(receiver.client.copper).toBe(recipient.copper);
        expect(receiver.client.inventory.find((slot) => slot.itemId === itemId)).toEqual({
          itemId,
          count: 1,
          instance: finalPayload,
        });
      }
      expect(remote.sim.countItem('bone_fragments', remote.pid)).toBe(4);
      expect(remote.sim.countItem('supply_crate', remote.pid)).toBe(1);
      expect(
        remote.sent.filter((row) => (row as { cmd: string }).cmd === 'trade_offer'),
      ).toHaveLength(3);
      expect(
        receiver.sent.filter((row) => (row as { cmd: string }).cmd === 'trade_confirm'),
      ).toEqual([
        { t: 'cmd', cmd: 'trade_confirm' },
        { t: 'cmd', cmd: 'trade_confirm' },
      ]);
    },
  );
});
