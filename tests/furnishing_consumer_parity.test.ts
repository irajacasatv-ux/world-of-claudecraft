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
import * as collections from '../src/sim/content/crucible_collections';
import * as recipes from '../src/sim/content/recipes';
import { BUILTIN_WORLD, ITEMS, LAKE } from '../src/sim/data';
import { MAIL_DELIVERY_SECONDS } from '../src/sim/mail/post_office';
import { defaultMarketQuery, marketItemMatches } from '../src/sim/market_query';
import { ACTIONS, applyAction, encodeObs } from '../src/sim/obs';
import { PERFECTING_ATTEMPT_COST } from '../src/sim/professions/perfecting';
import { capturePerfectItemRef } from '../src/sim/professions/perfecting_copy';
import { isSunderable } from '../src/sim/professions/sundering';
import { Sim } from '../src/sim/sim';
import type { ItemDef, ItemInstancePayload, PlayerClass, SimEvent } from '../src/sim/types';
import { terrainHeight } from '../src/sim/world';
import { type BagMode, bagItemAction } from '../src/ui/bags_view';
import { paperdollDropAction } from '../src/ui/equip_drop_core';
import { Hud } from '../src/ui/hud';
import { ActionBarController } from '../src/ui/hud/action_bar/action_bar_controller';
import type { IWorld } from '../src/world_api';
import { FURNISHING } from './fixtures/furnishing_item';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';

const ID = FURNISHING.id;
const CONTROL_ID = 'test_furnishing_use_control';
const GEAR: ItemDef = {
  id: 'test_furnishing_parity_gear',
  name: 'Control Sword',
  kind: 'weapon',
  slot: 'mainhand',
  sellValue: 1,
  quality: 'common',
  requiredLevel: 1,
  stats: { str: 2 },
  weapon: { min: 5, max: 7, speed: 2 },
};
const SIGNED: ItemInstancePayload = { signer: 'Mirror Maker' };
const MODE: BagMode = {
  tradeOpen: false,
  mailAttach: false,
  marketSell: false,
  vendorOpen: false,
  bankOpen: false,
  bankDeposit: false,
  bankSocketable: false,
  guildBankDeposit: false,
  vaultDeposit: false,
  petFeed: false,
};

beforeEach(() => {
  ITEMS[ID] = structuredClone(FURNISHING);
  ITEMS[GEAR.id] = structuredClone(GEAR);
});
afterEach(() => {
  delete ITEMS[ID];
  delete ITEMS[GEAR.id];
  delete ITEMS[CONTROL_ID];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function world(playerClass: PlayerClass = 'warrior'): Sim {
  const sim = new Sim({
    seed: 73,
    playerClass,
    autoEquip: false,
    freeholdsEnabled: true,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
  sim.inventory.splice(0);
  sim.drainEvents();
  return sim;
}
function snapshot(sim: Sim, pid = sim.playerId) {
  return structuredClone({
    character: sim.serializeCharacter(pid),
    entities: [...sim.entities],
    feasts: [...sim.ctx.feasts],
    moveInput: sim.meta(pid)!.moveInput,
  });
}
function noMutation(sim: Sim, run: () => unknown, pid = sim.playerId): void {
  const before = snapshot(sim, pid);
  const draws = vi.spyOn(sim.rng, 'next');
  expect(run()).toBeUndefined();
  expect(snapshot(sim, pid)).toEqual(before);
  expect(draws).not.toHaveBeenCalled();
  draws.mockRestore();
}
function give(sim: Sim, itemId = ID, pid = sim.playerId): void {
  sim.ctx.addItemInstance(itemId, { ...SIGNED }, pid);
}
function atEntity(sim: Sim, pid: number, entityId: number): void {
  const player = sim.entities.get(pid)!;
  player.pos = { ...sim.entities.get(entityId)!.pos };
  player.prevPos = { ...player.pos };
  sim.rebucket(player);
}
function atShore(sim: Sim): void {
  const x = LAKE.x;
  const z = LAKE.z - LAKE.radius - 2;
  sim.player.pos = { x, z, y: terrainHeight(x, z, sim.cfg.seed) };
  sim.player.prevPos = { ...sim.player.pos };
  sim.player.facing = 0;
  sim.rebucket(sim.player);
}

const USE_ROWS = [
  {
    name: 'legacy fishing',
    source: () =>
      ({
        id: CONTROL_ID,
        name: 'Control Pole',
        kind: 'tool',
        sellValue: 1,
        use: { type: 'fishing' },
      }) as ItemDef,
    outcome: 'fishing',
  },
  {
    name: 'tiered fishing',
    source: () =>
      ({
        id: CONTROL_ID,
        name: 'Control Rod',
        kind: 'tool',
        sellValue: 1,
        use: { type: 'gatherTool', professionId: 'fishing', tier: 1 },
      }) as ItemDef,
    outcome: 'fishing',
  },
  { name: 'potion', source: () => ITEMS.minor_healing_potion, outcome: 'potion' },
  { name: 'food', source: () => ITEMS.roasted_boar, outcome: 'food' },
  {
    name: 'drink',
    source: () => Object.values(ITEMS).find((def) => def.kind === 'drink')!,
    outcome: 'drink',
  },
  ...(['elixir', 'flask', 'scroll'] as const).map((kind) => ({
    name: kind,
    source: () => Object.values(ITEMS).find((def) => def.kind === kind)!,
    outcome: 'buff',
  })),
  { name: 'feast', source: () => ITEMS.harvest_feast, outcome: 'feast' },
];

describe('furnishing activation refusals', () => {
  it.each(USE_ROWS)('rejects independent $name power with a successful useItem control', (row) => {
    const control = { ...structuredClone(row.source()), id: CONTROL_ID } as ItemDef;
    ITEMS[CONTROL_ID] = control;
    ITEMS[ID] = { ...control, ...FURNISHING, use: control.use } as unknown as ItemDef;
    const sim = world();
    sim.player.hp -= 50;
    if (row.outcome === 'fishing') atShore(sim);
    give(sim);
    sim.drainEvents();
    noMutation(sim, () => sim.useItem(ID, { slotIndex: 0 }));
    expect(sim.drainEvents()).toEqual([]);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    give(sim, CONTROL_ID);
    sim.useItem(CONTROL_ID, { slotIndex: 1 });
    if (row.outcome === 'fishing') {
      expect(sim.player.castingAbility).toBe('fishing');
      expect(sim.countItem(CONTROL_ID)).toBe(1);
    } else {
      expect(sim.countItem(CONTROL_ID)).toBe(0);
      if (row.outcome === 'potion') {
        expect(sim.player.hp).toBe(sim.player.maxHp);
        expect(sim.player.potionCooldownUntil).toBe(120);
      } else if (row.outcome === 'food') expect(sim.player.eating).not.toBeNull();
      else if (row.outcome === 'drink') expect(sim.player.drinking).not.toBeNull();
      else if (row.outcome === 'buff') {
        expect(sim.player.auras.some((aura) => aura.id === `elixir_${control.elixir!.kind}`)).toBe(
          true,
        );
      } else expect(sim.ctx.feasts.size).toBe(1);
    }
  });

  it.each(['keyboard', 'crossOnBar', 'crossOnly'] as const)(
    'an existing %s item action refuses furnishing activation through real Hud dispatch',
    (route) => {
      ITEMS[CONTROL_ID] = { ...ITEMS.minor_healing_potion, id: CONTROL_ID } as ItemDef;
      ITEMS[ID] = { ...FURNISHING, use: { type: 'fishing' }, potionHp: 500 } as unknown as ItemDef;
      const sim = world();
      give(sim);
      const controller = new ActionBarController({
        storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        playerClass: 'warrior',
        playerName: 'Bar Tester',
        playerLevel: () => 1,
        talentSpec: () => null,
        knownAbilityIds: () => [],
        hasAura: () => false,
        showAttackButton: () => true,
      });
      let action: { type: 'item'; id: string } = { type: 'item', id: ID };
      const use = vi.fn((itemId: string) => sim.useItem(itemId));
      const flash = vi.fn();
      const showError = vi.fn();
      const host = {
        isGroundAimActive: () => false,
        actionForSlot: (slot: number) => (route !== 'crossOnly' && slot === 1 ? action : null),
        hotbarActions: [null],
        castSlot: (slot: number) => Hud.prototype.castSlot.call(host as unknown as Hud, slot),
        castCrossHotbarAction: (item: { type: 'item'; id: string }) =>
          Hud.prototype.castCrossHotbarAction.call(host as unknown as Hud, item),
        showError,
        tradeOpen: false,
        isHotbarItemId: (itemId: string) => controller.isHotbarItemId(itemId),
        useHotbarItem: use,
        flashActionSlot: flash,
      };
      const run = () =>
        route === 'keyboard'
          ? Hud.prototype.castSlot.call(host as unknown as Hud, 1)
          : Hud.prototype.pressCrossHotbarAction.call(host as unknown as Hud, action);
      noMutation(sim, run);
      expect(use).not.toHaveBeenCalled();
      expect(flash).not.toHaveBeenCalled();
      if (route === 'crossOnly')
        expect(showError).toHaveBeenCalledExactlyOnceWith("You don't have that item.");
      else expect(showError).not.toHaveBeenCalled();
      action = { type: 'item', id: CONTROL_ID };
      give(sim, CONTROL_ID);
      sim.player.hp -= 50;
      run();
      expect(use).toHaveBeenCalledExactlyOnceWith(CONTROL_ID);
      if (route === 'crossOnly') expect(flash).not.toHaveBeenCalled();
      else expect(flash).toHaveBeenCalledExactlyOnceWith(1);
      expect(sim.countItem(CONTROL_ID)).toBe(0);
      expect(sim.player.hp).toBe(sim.player.maxHp);
    },
  );

  it.each(['warrior', 'mage'] as const)(
    'headless eat_drink ignores forged furnishing restore data for %s',
    (cls) => {
      const sim = world(cls);
      ITEMS[ID] = {
        ...FURNISHING,
        foodHp: 999,
        drinkMana: 999,
        use: { type: 'fishing' },
      } as unknown as ItemDef;
      give(sim);
      sim.player.hp = 1;
      if (cls === 'mage') sim.player.resource = 0;
      const action = ACTIONS.indexOf('eat_drink');
      expect(action).toBeGreaterThan(0);
      const obs = encodeObs(sim);
      noMutation(sim, () => applyAction(sim, action));
      expect(encodeObs(sim)).toEqual(obs);
      expect(sim.player.eating).toBeNull();
      expect(sim.player.drinking).toBeNull();
      ITEMS[CONTROL_ID] = {
        ...structuredClone(
          cls === 'mage'
            ? Object.values(ITEMS).find((def) => def.kind === 'drink')!
            : ITEMS.roasted_boar,
        ),
        id: CONTROL_ID,
      } as ItemDef;
      give(sim, CONTROL_ID);
      applyAction(sim, action);
      expect(sim.countItem(CONTROL_ID)).toBe(0);
      expect(cls === 'mage' ? sim.player.drinking : sim.player.eating).not.toBeNull();
      expect(sim.countItem(ID)).toBe(1);
    },
  );
});

function online() {
  vi.stubGlobal('WebSocket', { OPEN: 1 });
  const server = new GameServer();
  const fc = fakeWs();
  const session = joinServer(server, fc, 9101, 'Mirror Tester');
  const sim = (server as unknown as { sim: Sim }).sim;
  const pid = session.pid;
  sim.meta(pid)!.inventory.splice(0);
  sim.meta(pid)!.equipment = {};
  sim.meta(pid)!.equipmentInstance = {};
  sim.meta(pid)!.copper = 10000;
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
  const apply = (frame: unknown) =>
    (client as unknown as { applySnapshot(s: unknown): void }).applySnapshot(frame);
  let received = 0;
  const sync = () => {
    (server as unknown as { routeEvents(events: SimEvent[]): void }).routeEvents(sim.drainEvents());
    broadcast(server);
    for (const frame of fc.sent.slice(received)) {
      if (frame.t === 'events')
        (client as unknown as { onMessage(raw: string): void }).onMessage(JSON.stringify(frame));
    }
    received = fc.sent.length;
    const snap = lastSnap(fc.sent);
    expect(snap).not.toBeNull();
    apply(snap);
    return snap;
  };
  return { server, fc, session, sim, pid, client, sent, sync, apply };
}
function visibleGates(host: IWorld) {
  const slot = host.inventory.find((entry) => entry.itemId === ID)!;
  expect(slot).toEqual({ itemId: ID, count: 1, instance: SIGNED });
  const def = ITEMS[slot.itemId];
  return {
    perfecting: host.perfectingInfo({ bag: host.inventory.indexOf(slot), itemId: ID }),
    bag: bagItemAction(def, MODE, slot.instance),
    paperdoll: paperdollDropAction(
      def,
      'mainhand',
      'warrior',
      host.player.level,
      host.talentSpec,
      host.equipment,
      host.equipmentInstances,
      host.inventory,
    ),
    furnishingMarket: marketItemMatches(def.id, {
      ...defaultMarketQuery(),
      itemType: 'furnishing',
    }),
    weaponMarket: marketItemMatches(def.id, { ...defaultMarketQuery(), itemType: 'weapon' }),
  };
}

describe('furnishing world facade parity', () => {
  it('shares client-visible kind decisions between offline Sim and decoded ClientWorld', () => {
    const local = world();
    give(local);
    const remote = online();
    give(remote.sim, ID, remote.pid);
    remote.sync();
    const expected = {
      perfecting: null,
      bag: 'none',
      paperdoll: 'blockedSlot',
      furnishingMarket: true,
      weaponMarket: false,
    };
    expect(visibleGates(local)).toEqual(expected);
    expect(visibleGates(remote.client)).toEqual(expected);
    // A real apex item supplies the recipe identity the facade resolves.
    const apex = Object.values(ITEMS).find((def) => def.masterwrought && def.kind === 'weapon')!;
    give(local, apex.id);
    give(remote.sim, apex.id, remote.pid);
    remote.sync();
    expect(local.perfectingInfo({ bag: 1, itemId: apex.id })?.itemId).toBe(apex.id);
    expect(remote.client.perfectingInfo({ bag: 1, itemId: apex.id })?.itemId).toBe(apex.id);
  });

  it.each(['equip', 'use'] as const)(
    'forwards %s and observes the server refusal without client prediction',
    (command) => {
      const remote = online();
      ITEMS[ID] = {
        ...FURNISHING,
        slot: 'mainhand',
        stats: { str: 500 },
        use: { type: 'fishing' },
        potionHp: 500,
      } as unknown as ItemDef;
      give(remote.sim, ID, remote.pid);
      remote.sync();
      const clientBefore = structuredClone(remote.client.inventory);
      const invoke = () =>
        command === 'equip' ? remote.client.equipItem(ID) : remote.client.useItem(ID);
      noMutation(remote.sim, invoke, remote.pid);
      expect(remote.sent).toEqual([{ t: 'cmd', cmd: command, item: ID }]);
      expect(remote.client.inventory).toEqual(clientBefore);
      remote.sync();
      expect(remote.client.inventory).toEqual(clientBefore);
      expect(remote.client.equipment.mainhand).toBeUndefined();
      expect(remote.client.player.castingAbility).toBeNull();
      if (command === 'equip') {
        give(remote.sim, GEAR.id, remote.pid);
        remote.sync();
        remote.client.equipItem(GEAR.id);
        remote.sync();
        expect(remote.client.equipment.mainhand).toBe(GEAR.id);
        expect(remote.sim.meta(remote.pid)!.equipment.mainhand).toBe(GEAR.id);
      } else {
        ITEMS[CONTROL_ID] = { ...ITEMS.minor_healing_potion, id: CONTROL_ID } as ItemDef;
        give(remote.sim, CONTROL_ID, remote.pid);
        remote.sim.entities.get(remote.pid)!.hp -= 50;
        remote.sync();
        remote.client.useItem(CONTROL_ID);
        remote.sync();
        expect(remote.client.inventory.map((slot) => slot.itemId)).toEqual([ID]);
        expect(remote.client.player.hp).toBe(remote.client.player.maxHp);
        expect(remote.sim.entities.get(remote.pid)!.potionCooldownUntil).toBe(120);
      }
    },
  );

  it('round-trips signed personal-bank contents and retains them through omitted deltas', () => {
    const remote = online();
    const banker = [...remote.sim.entities.values()].find(
      (entity) => entity.templateId === 'bursar_fernando',
    )!;
    atEntity(remote.sim, remote.pid, banker.id);
    give(remote.sim, ID, remote.pid);
    remote.sync();
    remote.client.bankDeposit(0, 1);
    remote.sync();
    expect(remote.client.inventory).toEqual([]);
    expect(remote.client.bankInfo?.slots).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    const before = structuredClone(remote.client.bankInfo);
    remote.apply({ t: 'snap', ents: [], self: { id: remote.pid, hp: remote.client.player.hp } });
    expect(remote.client.bankInfo).toEqual(before);
    remote.client.bankWithdraw(0, 1);
    remote.sync();
    expect(remote.client.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(remote.client.bankInfo?.slots).toEqual([]);
  });
});

describe('furnishing profession command parity', () => {
  const rows = [
    {
      name: 'disenchant',
      cast: 'disenchanting',
      event: 'disenchantResult',
      reason: 'not_disenchantable',
      run: (host: IWorld, id: string) => host.disenchantItem(id),
    },
    {
      name: 'salvage',
      cast: 'salvaging',
      event: 'salvageResult',
      reason: 'not_salvageable',
      run: (host: IWorld, id: string) => host.salvageItem(id),
    },
    {
      name: 'enchant',
      cast: 'enchanting_apply',
      event: 'enchantResult',
      reason: 'wrong_slot',
      run: (host: IWorld, id: string) => host.applyEnchant(id, 'enchant_weapon_might'),
    },
    {
      name: 'sunder',
      cast: 'sundering',
      event: 'error',
      reason: 'Only raid-won epics can be sundered.',
      run: (host: IWorld, id: string) => host.extractEssence(id),
    },
    {
      name: 'unbind',
      cast: null,
      event: 'unbindResult',
      reason: 'unbind_not_eligible',
      run: (host: IWorld, id: string) => host.unbindItem(id),
    },
    {
      name: 'perfect',
      cast: null,
      event: 'error',
      reason: 'Only Masterwrought items can be perfected.',
      run: (host: IWorld, id: string) =>
        host.perfectItem({
          bag: host.inventory.findIndex((slot) => slot.itemId === id),
          itemId: id,
        }),
    },
  ];
  it.each(rows)('keeps $name refusal and eligible success through both world facades', (row) => {
    ITEMS[ID] = { ...FURNISHING, slot: 'mainhand', masterwrought: true } as unknown as ItemDef;
    const remote = online();
    const local = world();
    for (const entry of [
      { sim: local, pid: local.playerId, host: local, sync: () => {} },
      { sim: remote.sim, pid: remote.pid, host: remote.client, sync: remote.sync },
    ]) {
      const { sim, pid, host } = entry;
      give(sim, ID, pid);
      entry.sync();
      host.drainEvents();
      sim.drainEvents();
      noMutation(sim, () => row.run(host, ID), pid);
      entry.sync();
      const events = host.drainEvents();
      expect(events).toContainEqual(
        expect.objectContaining(
          row.event === 'error'
            ? { type: 'error', text: row.reason }
            : { type: row.event, ok: false, reason: row.reason },
        ),
      );
      expect(host.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
      let eligibleId = GEAR.id;
      const meta = sim.meta(pid)!;
      if (row.name === 'sunder') eligibleId = Object.values(ITEMS).find(isSunderable)!.id;
      if (row.name === 'perfect') {
        ITEMS[GEAR.id] = { ...GEAR, quality: 'rare', masterwrought: true } as ItemDef;
        vi.spyOn(recipes, 'recipeForResultItem').mockReturnValue({
          id: 'test_mirror_recipe',
          professionId: 'weaponcrafting',
          resultItemId: GEAR.id,
          resultCount: 1,
          reagents: [],
          skillReq: 1,
          itemLevelBudget: 1,
          level: 1,
        });
        meta.craftSkills.weaponcrafting = 125;
        for (const cost of PERFECTING_ATTEMPT_COST) sim.addItem(cost.itemId, cost.count, pid);
        vi.spyOn(sim.rng, 'next').mockReturnValue(0);
      }
      if (row.name === 'enchant') sim.addItem('arcane_dust', 5, pid);
      if (row.name === 'unbind') {
        const station = sim.stationPlacements[0];
        const player = sim.entities.get(pid)!;
        player.pos.x = station.pos.x;
        player.pos.z = station.pos.z;
        meta.copper = 10000;
        meta.inventory.push({
          itemId: GEAR.id,
          count: 1,
          instance: { boundTo: pid, bindOnTrade: true },
        });
      } else give(sim, eligibleId, pid);
      entry.sync();
      row.run(host, eligibleId);
      entry.sync();
      if (row.cast) expect(host.player.castingAbility).toBe(row.cast);
      else if (row.name === 'unbind') {
        expect(
          host.inventory.find((slot) => slot.itemId === GEAR.id)?.instance?.boundTo,
        ).toBeUndefined();
        expect(host.drainEvents()).toContainEqual(
          expect.objectContaining({ type: 'unbindResult', ok: true }),
        );
      } else {
        expect(host.inventory.find((slot) => slot.itemId === GEAR.id)?.instance?.perfecting).toBe(
          1,
        );
      }
    }
  });

  it('refuses furnishing rank exchange through both reads and the authoritative command', () => {
    const remote = online();
    const local = world();
    vi.spyOn(collections, 'crucibleCollectionForItem').mockImplementation((id) =>
      id === ID || id === GEAR.id
        ? {
            id: 'test_collection',
            name: 'Test Collection',
            role: 'physical',
            armorType: 'mail',
            craftId: 'weaponcrafting',
            itemIds: [ID, GEAR.id],
          }
        : undefined,
    );
    vi.spyOn(recipes, 'recipeForResultItem').mockImplementation((id) =>
      id === ID || id === GEAR.id
        ? {
            id: 'test_collection_recipe',
            professionId: 'weaponcrafting',
            resultItemId: id,
            resultCount: 1,
            reagents: [],
            skillReq: 1,
            itemLevelBudget: 1,
            level: 1,
          }
        : undefined,
    );
    for (const entry of [
      { sim: local, pid: local.playerId, host: local, sync: () => {} },
      { sim: remote.sim, pid: remote.pid, host: remote.client, sync: remote.sync },
    ]) {
      ITEMS[ID] = structuredClone(FURNISHING);
      const meta = entry.sim.meta(entry.pid)!;
      meta.craftSkills.weaponcrafting = 125;
      meta.inventory.push(
        { itemId: ID, count: 1, instance: { perfecting: 3 } },
        { itemId: GEAR.id, count: 1, instance: { perfecting: 1 } },
      );
      const station = entry.sim.stationPlacements.find((def) => def.type === 'forge')!;
      const player = entry.sim.entities.get(entry.pid)!;
      player.pos.x = station.pos.x;
      player.pos.z = station.pos.z;
      entry.sync();
      const request = {
        source: capturePerfectItemRef(entry.host, { bag: 0, itemId: ID }),
        target: capturePerfectItemRef(entry.host, { bag: 1, itemId: GEAR.id }),
      };
      expect(entry.host.perfectingSwapInfo(request)?.reason).toBe('invalid_progress');
      noMutation(entry.sim, () => entry.host.swapPerfectingRanks(request), entry.pid);
      entry.sync();
      expect(entry.host.drainEvents()).toContainEqual(
        expect.objectContaining({
          type: 'perfectingSwapResult',
          ok: false,
          reason: 'invalid_progress',
        }),
      );
      ITEMS[ID] = { ...GEAR, id: ID };
      expect(entry.host.perfectingSwapInfo(request)?.reason).toBeUndefined();
      entry.host.swapPerfectingRanks(request);
      entry.sync();
      expect(entry.host.inventory.map((slot) => slot.instance?.perfecting)).toEqual([1, 3]);
      expect(entry.host.drainEvents()).toContainEqual(
        expect.objectContaining({ type: 'perfectingSwapResult', ok: true }),
      );
    }
  });
});

describe('furnishing storage mirrors', () => {
  it('round-trips signed guild-bank contents through the real command and snapshot', () => {
    const remote = online();
    const banker = [...remote.sim.entities.values()].find(
      (entity) => entity.templateId === 'bursar_fernando',
    )!;
    atEntity(remote.sim, remote.pid, banker.id);
    remote.sim.setPlayerGuildMembership(remote.pid, { guildId: 7, rank: 'officer' });
    remote.sim.loadGuildBank(7, { treasury: 0, inventory: [], purchasedSlots: 24 });
    give(remote.sim, ID, remote.pid);
    remote.sync();
    remote.client.guildBankDeposit(0, 1);
    remote.sync();
    expect(remote.client.inventory).toEqual([]);
    expect(remote.client.guildBankInfo?.slots).toEqual([
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
    const before = structuredClone(remote.client.guildBankInfo);
    remote.apply({ t: 'snap', ents: [], self: { id: remote.pid, hp: remote.client.player.hp } });
    expect(remote.client.guildBankInfo).toEqual(before);
    remote.client.guildBankWithdraw(0, 1);
    remote.sync();
    expect(remote.client.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(remote.client.guildBankInfo?.slots).toEqual([]);
  });

  it('mails a signed furnishing through both clients and retains omitted mail and inventory deltas', () => {
    const remote = online();
    const recipientSocket = fakeWs();
    const recipient = joinServer(remote.server, recipientSocket, 9102, 'Mirror Recipient');
    const receiver = bareClient(recipient.pid, {
      ws: { readyState: 1, send: (raw: string) => remote.server.handleMessage(recipient, raw) },
    });
    const receive = () =>
      (receiver as unknown as { applySnapshot(s: unknown): void }).applySnapshot(
        lastSnap(recipientSocket.sent),
      );
    remote.sim.meta(recipient.pid)!.inventory.splice(0);
    atEntity(remote.sim, remote.pid, remote.sim.postOffice.mailboxIds[0]);
    atEntity(remote.sim, recipient.pid, remote.sim.postOffice.mailboxIds[0]);
    give(remote.sim, ID, remote.pid);
    remote.sync();
    remote.client.mailSend('Mirror Recipient', 'Furniture', 'Signed parcel.', 0, [
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
    remote.sync();
    expect(remote.client.inventory).toEqual([]);
    expect(remote.sim.postOffice.mail.at(-1)?.items).toEqual([
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
    for (let tick = 0; tick <= MAIL_DELIVERY_SECONDS * 20; tick++) remote.sim.tick();
    remote.sync();
    receive();
    const letter = receiver.mailInfo?.messages.find((message) => message.subject === 'Furniture');
    expect(letter?.items).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    const before = structuredClone(receiver.mailInfo);
    (receiver as unknown as { applySnapshot(s: unknown): void }).applySnapshot({
      t: 'snap',
      ents: [],
      self: { id: recipient.pid, hp: receiver.player.hp },
    });
    expect(receiver.mailInfo).toEqual(before);
    receiver.mailTake(letter!.id);
    remote.sync();
    receive();
    expect(receiver.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    (receiver as unknown as { applySnapshot(s: unknown): void }).applySnapshot({
      t: 'snap',
      ents: [],
      self: { id: recipient.pid, hp: receiver.player.hp },
    });
    expect(receiver.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
  });

  it('keeps the furnishing market chip through ClientWorld search, server sanitization and listing results', () => {
    const remote = online();
    atEntity(remote.sim, remote.pid, remote.sim.market.merchantIds[0]);
    give(remote.sim, ID, remote.pid);
    remote.sync();
    remote.client.marketListInstance(ID, 100, SIGNED);
    remote.client.marketSearch({ ...defaultMarketQuery(), itemType: 'furnishing' });
    remote.sync();
    expect(remote.client.marketInfo?.itemType).toBe('furnishing');
    expect(remote.client.marketInfo?.listings.map((listing) => listing.itemId)).toEqual([ID]);
    expect(remote.client.marketInfo?.listings[0].instance?.signer).toBe('Mirror Maker');
    remote.client.marketSearch({ ...defaultMarketQuery(), itemType: 'weapon' });
    remote.sync();
    expect(remote.client.marketInfo?.listings.some((listing) => listing.itemId === ID)).toBe(false);
    expect(remote.client.marketInfo?.listings.length).toBeGreaterThan(0);
  });

  it('does not resolve a forged furnishing set into ClientWorld ability power', () => {
    const remote = online();
    remote.sim.setPlayerLevel(20, remote.pid);
    const frame = remote.sync();
    const before = structuredClone(
      remote.client.known.find((ability) => ability.def.id === 'overpower'),
    );
    expect(before).toBeDefined();
    ITEMS[ID] = { ...FURNISHING, set: 'slagbreaker' } as unknown as ItemDef;
    remote.apply({ ...frame, self: { ...frame.self, equip: { helmet: ID, chest: ID } } });
    expect(remote.client.known.find((ability) => ability.def.id === 'overpower')).toEqual(before);
    ITEMS[GEAR.id] = { ...GEAR, set: 'slagbreaker' } as ItemDef;
    remote.apply({ ...frame, self: { ...frame.self, equip: { helmet: GEAR.id, chest: GEAR.id } } });
    expect(remote.client.known.find((ability) => ability.def.id === 'overpower')).not.toEqual(
      before,
    );
  });
});
