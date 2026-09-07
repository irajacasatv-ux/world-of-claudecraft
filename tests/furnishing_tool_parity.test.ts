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
import { farmBedById } from '../src/sim/content/farm_patches';
import { MONSTER_MATERIAL_TIERS } from '../src/sim/content/professions';
import { ITEMS, MOBS } from '../src/sim/data';
import { createMob } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { InvSlot, ItemDef, SimEvent } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';
import { bareClient, broadcast, fakeWs, joinServer, lastSnap } from './helpers/bare_client';
import { expectDefined } from './helpers/defined';
import { placeAtHarvestSpot } from './helpers/harvest_spot';

const ID = FURNISHING.id;
const TOOL_ID = 'test_furnishing_tool_control';
const CHARM_ID = 'test_furnishing_charm_control';
const SIGNED = { signer: 'Tool Table Maker' };
const TOOL = {
  id: TOOL_ID,
  name: 'Control Pick',
  kind: 'tool',
  quality: 'common',
  sellValue: 1,
  use: { type: 'gatherTool', professionId: 'mining', tier: 1 },
} satisfies ItemDef;
const CHARM = {
  id: CHARM_ID,
  name: 'Control Charm',
  kind: 'tool',
  quality: 'rare',
  sellValue: 1,
  use: { type: 'toolEffect', effectId: 'gatherers_cache' },
} satisfies ItemDef;
const furnished: InvSlot = { itemId: ID, count: 1, instance: SIGNED };
const tool: InvSlot = { itemId: TOOL_ID, count: 1 };
const charm: InvSlot = { itemId: CHARM_ID, count: 1 };
const initialHideTier = MONSTER_MATERIAL_TIERS.hide;

beforeEach(() => {
  ITEMS[ID] = structuredClone(FURNISHING);
  ITEMS[TOOL_ID] = structuredClone(TOOL);
  ITEMS[CHARM_ID] = structuredClone(CHARM);
  vi.stubGlobal('WebSocket', { OPEN: 1 });
  vi.spyOn(performance, 'now').mockReturnValue(1000);
});

afterEach(() => {
  delete ITEMS[ID];
  delete ITEMS[TOOL_ID];
  delete ITEMS[CHARM_ID];
  (MONSTER_MATERIAL_TIERS as Record<string, number>).hide = initialHideTier;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function forgedUse(use: NonNullable<ItemDef['use']>) {
  ITEMS[ID] = { ...structuredClone(FURNISHING), use } as unknown as ItemDef;
}

function runtimeState(sim: Sim, pid: number) {
  const meta = expectDefined(sim.meta(pid), 'player metadata');
  expect(sim.entities.has(pid)).toBe(true);
  const rngState = (sim.rng as unknown as { s: number }).s;
  expect(Number.isFinite(rngState)).toBe(true);
  return structuredClone({
    meta,
    entities: [...sim.entities],
    nextId: sim.ctx.nextId,
    feasts: [...sim.ctx.feasts],
    rngState,
  });
}

function mirrorState(client: ClientWorld) {
  expect(client.entities.has(client.playerId)).toBe(true);
  return structuredClone({
    entities: [...client.entities],
    inventory: client.inventory,
    bags: client.bags,
    equipment: client.equipment,
    equipmentInstances: client.equipmentInstances,
    copper: client.copper,
    toolEffectSlots: client.toolEffectSlots,
    gatheringProficiency: client.gatheringProficiency,
    craftingIdentity: client.craftingIdentity,
    myFarmPlots: client.myFarmPlots,
    harvestPreference: client.harvestPreference,
    gatheringGoal: client.gatheringGoal,
  });
}

function harness(host: 'offline' | 'online') {
  const server = host === 'online' ? new GameServer() : null;
  const socket = fakeWs();
  const session = server ? joinServer(server, socket, 9187, 'Tool Tester') : null;
  const sim = server?.sim ?? new Sim({ seed: 29, playerClass: 'warrior', autoEquip: false });
  const pid = session?.pid ?? sim.playerId;
  const meta = expectDefined(sim.meta(pid), 'player metadata');
  const player = expectDefined(sim.entities.get(pid), 'player entity');
  const sent: unknown[] = [];
  const client =
    server && session
      ? bareClient(pid, {
          ws: {
            readyState: 1,
            send: (raw: string) => {
              sent.push(JSON.parse(raw));
              server.handleMessage(session, raw);
            },
          },
        })
      : null;
  const world = client ?? sim;
  let received = 0;
  const sync = () => {
    if (!server || !client) return;
    (server as unknown as { routeEvents(events: SimEvent[]): void }).routeEvents(sim.drainEvents());
    broadcast(server);
    for (const frame of socket.sent.slice(received)) {
      if (frame.t === 'events' || frame.t === 'commandOutcome') {
        (client as unknown as { onMessage(raw: string): void }).onMessage(JSON.stringify(frame));
      }
    }
    received = socket.sent.length;
    const snapshot = lastSnap(socket.sent);
    expect(snapshot).not.toBeNull();
    (client as unknown as { applySnapshot(frame: unknown): void }).applySnapshot(snapshot);
  };
  const inventory = (...slots: InvSlot[]) => {
    meta.inventory.splice(0, meta.inventory.length, ...structuredClone(slots));
    sim.ctx.onInventoryChangedForQuests(meta);
    sim.drainEvents();
    sync();
    world.drainEvents();
  };
  inventory(furnished);
  return { sim, pid, meta, player, client, world, sent, sync, inventory };
}

type Harness = ReturnType<typeof harness>;

async function refuse(h: Harness, action: () => unknown, event: SimEvent, result?: boolean) {
  const before = runtimeState(h.sim, h.pid);
  const mirroredBefore = h.client ? mirrorState(h.client) : null;
  const draws = vi.spyOn(h.sim.rng, 'next');
  expect(h.sim.countItem(ID, h.pid)).toBe(1);
  const outcome = action();
  expect(runtimeState(h.sim, h.pid)).toEqual(before);
  if (h.client) expect(mirrorState(h.client)).toEqual(mirroredBefore);
  h.sync();
  expect(runtimeState(h.sim, h.pid)).toEqual(before);
  if (h.client) expect(mirrorState(h.client)).toEqual(mirroredBefore);
  expect(await outcome).toBe(result);
  expect(h.world.drainEvents()).toEqual([event]);
  expect(h.sim.countItem(ID, h.pid)).toBe(1);
  expect(draws).not.toHaveBeenCalled();
  draws.mockRestore();
}

function noPrediction(h: Harness, action: () => unknown) {
  const before = h.client ? mirrorState(h.client) : null;
  const outcome = action();
  if (h.client) expect(mirrorState(h.client)).toEqual(before);
  h.sync();
  return outcome;
}

function wire(h: Harness, command: Record<string, unknown>) {
  if (h.client) expect(h.sent.at(-1)).toMatchObject({ t: 'cmd', ...command });
}

function finishCast(h: Harness, expected: string) {
  expect(h.player.castingAbility).toBe(expected);
  // Advance the real shared cast lifecycle at its fixed step. Ambient world
  // systems are outside this command contract and cannot consume its RNG.
  for (let tick = 0; tick < 100 && h.player.castingAbility !== null; tick++) {
    updateCasting(h.sim.ctx, h.player, h.meta);
  }
  expect(h.player.castingAbility).toBeNull();
  h.sync();
}

describe.each(['offline', 'online'] as const)('furnishing tool command boundaries %s', (host) => {
  it('refuses forged charm metadata without spending a copy and slots the eligible charm', async () => {
    forgedUse(CHARM.use);
    const h = harness(host);
    h.inventory(tool, furnished);
    await refuse(h, () => h.world.slotToolEffect('mining', 'gatherers_cache'), {
      type: 'toolEffectResult',
      action: 'slot',
      ok: false,
      professionId: 'mining',
      effectId: 'gatherers_cache',
      reason: 'no_charm',
      pid: h.pid,
    });
    wire(h, { cmd: 'slot_tool_effect', profession: 'mining', effect: 'gatherers_cache' });
    expect(h.sim.countItem(TOOL_ID, h.pid)).toBe(1);
    h.inventory(tool, furnished, charm);
    noPrediction(h, () => h.world.slotToolEffect('mining', 'gatherers_cache'));
    expect(h.meta.toolEffectSlots?.mining).toEqual({
      effectId: 'gatherers_cache',
      confirmMode: 'always',
      durability: 20,
      maxDurability: 20,
    });
    expect(h.sim.countItem(CHARM_ID, h.pid)).toBe(0);
    expect(h.world.inventory).toEqual([tool, furnished]);
    expect(h.world.toolEffectSlots).toEqual([
      {
        professionId: 'mining',
        effectId: 'gatherers_cache',
        confirmMode: 'always',
        charges: 20,
        maxCharges: 20,
        selfCrafted: false,
      },
    ]);
    expect(h.world.drainEvents()).toEqual([
      {
        type: 'toolEffectResult',
        action: 'slot',
        ok: true,
        professionId: 'mining',
        effectId: 'gatherers_cache',
        pid: h.pid,
      },
    ]);
  });

  it('refuses forged tool metadata without spending the charm and slots with a real tool', async () => {
    forgedUse(TOOL.use);
    const h = harness(host);
    h.inventory(furnished, charm);
    await refuse(h, () => h.world.slotToolEffect('mining', 'gatherers_cache'), {
      type: 'toolEffectResult',
      action: 'slot',
      ok: false,
      professionId: 'mining',
      effectId: 'gatherers_cache',
      reason: 'no_tool',
      pid: h.pid,
    });
    wire(h, { cmd: 'slot_tool_effect', profession: 'mining', effect: 'gatherers_cache' });
    expect(h.sim.countItem(CHARM_ID, h.pid)).toBe(1);
    h.inventory(furnished, charm, tool);
    noPrediction(h, () => h.world.slotToolEffect('mining', 'gatherers_cache'));
    expect(h.sim.countItem(CHARM_ID, h.pid)).toBe(0);
    expect(h.world.inventory).toEqual([furnished, tool]);
    expect(h.meta.toolEffectSlots?.mining).toEqual({
      effectId: 'gatherers_cache',
      confirmMode: 'always',
      durability: 20,
      maxDurability: 20,
    });
    expect(h.world.drainEvents()).toEqual([
      {
        type: 'toolEffectResult',
        action: 'slot',
        ok: true,
        professionId: 'mining',
        effectId: 'gatherers_cache',
        pid: h.pid,
      },
    ]);
  });

  it('refuses a furnishing recharge tool and completes the eligible recharge for exactly two dust', async () => {
    forgedUse(TOOL.use);
    const h = harness(host);
    h.inventory(furnished, tool, charm, { itemId: 'arcane_dust', count: 3 });
    noPrediction(h, () => h.world.slotToolEffect('mining', 'gatherers_cache'));
    const slot = expectDefined(h.meta.toolEffectSlots?.mining);
    expect(slot.durability).toBe(20);
    slot.durability = 0;
    h.inventory(furnished, { itemId: 'arcane_dust', count: 3 });
    await refuse(h, () => h.world.rechargeToolEffect('mining'), {
      type: 'toolEffectResult',
      action: 'recharge',
      ok: false,
      professionId: 'mining',
      effectId: 'gatherers_cache',
      reason: 'no_tool',
      pid: h.pid,
    });
    wire(h, { cmd: 'recharge_tool_effect', profession: 'mining' });
    expect(h.sim.countItem('arcane_dust', h.pid)).toBe(3);
    expect(slot.durability).toBe(0);
    h.inventory(furnished, tool, { itemId: 'arcane_dust', count: 3 });
    const draws = vi.spyOn(h.sim.rng, 'next');
    noPrediction(h, () => h.world.rechargeToolEffect('mining'));
    expect(h.world.player.castingAbility).toBe('tool_recharge');
    expect(h.sim.countItem('arcane_dust', h.pid)).toBe(3);
    finishCast(h, 'tool_recharge');
    expect(slot.durability).toBe(20);
    expect(slot.maxDurability).toBe(20);
    expect(h.sim.countItem('arcane_dust', h.pid)).toBe(1);
    expect(h.world.inventory).toEqual([
      furnished,
      tool,
      { itemId: 'arcane_dust', count: 1, materialSources: [{ source: {}, count: 1 }] },
    ]);
    expect(h.world.toolEffectSlots).toEqual([
      {
        professionId: 'mining',
        effectId: 'gatherers_cache',
        confirmMode: 'always',
        charges: 20,
        maxCharges: 20,
        selfCrafted: false,
      },
    ]);
    expect(h.world.drainEvents()).toContainEqual({
      type: 'toolEffectResult',
      action: 'recharge',
      ok: true,
      professionId: 'mining',
      effectId: 'gatherers_cache',
      materialItemId: 'arcane_dust',
      count: 2,
      pid: h.pid,
    });
    expect(draws).not.toHaveBeenCalled();
  });

  it('refuses a furnishing at a real ore node and admits the same harvest with an eligible pick', async () => {
    forgedUse(TOOL.use);
    const h = harness(host);
    placeAtHarvestSpot(h.sim, h.pid, 'ore_eastbrook_1');
    h.inventory(furnished);
    await refuse(
      h,
      () => h.world.harvestNode('ore_eastbrook_1'),
      {
        type: 'gatherDenied',
        pid: h.pid,
        surface: 'node',
        professionId: 'mining',
        requiredTier: 1,
      },
      false,
    );
    wire(h, { cmd: 'harvest_node', node: 'ore_eastbrook_1' });
    h.inventory(furnished, tool);
    const outcome = noPrediction(h, () => h.world.harvestNode('ore_eastbrook_1'));
    expect(await outcome).toBe(true);
    expect(h.player.castingAbility).toBe('gathering');
    expect(h.world.player.castingAbility).toBe('gathering');
    expect(h.player.gatherCastNodeId).toBe('ore_eastbrook_1');
    expect(h.world.inventory).toEqual([furnished, tool]);
    expect(h.world.drainEvents()).toContainEqual({
      type: 'castStart',
      entityId: h.pid,
      ability: 'gathering',
      time: 2.5,
      gatherNodeType: 'ore',
    });
  });

  it('refuses a furnishing hoe without spending seed and plants with an eligible hoe', async () => {
    const hoeUse = { type: 'gatherTool', professionId: 'farming', tier: 1 } as const;
    forgedUse(hoeUse);
    ITEMS[TOOL_ID] = { ...TOOL, use: hoeUse };
    const h = harness(host);
    const bed = expectDefined(farmBedById('bed_eastbrook_1'));
    h.player.pos = h.sim.groundPos(bed.x, bed.z);
    h.player.prevPos = { ...h.player.pos };
    h.inventory(furnished, { itemId: 'vale_wheat_seed', count: 1 });
    await refuse(h, () => h.world.plantCrop('bed_eastbrook_1', 'vale_wheat'), {
      type: 'farmDenied',
      reason: 'tool',
      pid: h.pid,
      bedId: 'bed_eastbrook_1',
      cropId: 'vale_wheat',
    });
    wire(h, { cmd: 'plant_crop', bed: 'bed_eastbrook_1', crop: 'vale_wheat' });
    expect(h.sim.countItem('vale_wheat_seed', h.pid)).toBe(1);
    expect(h.meta.farmPlots).toEqual(new Map());
    h.inventory(furnished, tool, { itemId: 'vale_wheat_seed', count: 1 });
    const draws = vi.spyOn(h.sim.rng, 'next');
    noPrediction(h, () => h.world.plantCrop('bed_eastbrook_1', 'vale_wheat'));
    expect(h.sim.countItem('vale_wheat_seed', h.pid)).toBe(0);
    expect(h.world.inventory).toEqual([furnished, tool]);
    expect(expectDefined(h.meta.farmPlots.get('bed_eastbrook_1')).cropId).toBe('vale_wheat');
    expect(h.world.myFarmPlots).toHaveLength(1);
    expect(h.world.myFarmPlots[0]).toMatchObject({
      bedId: 'bed_eastbrook_1',
      cropId: 'vale_wheat',
    });
    expect(h.world.player.castingAbility).toBe('farming');
    expect(h.world.drainEvents()).toContainEqual({
      type: 'farmPlanted',
      pid: h.pid,
      bedId: 'bed_eastbrook_1',
      cropId: 'vale_wheat',
    });
    expect(draws).toHaveBeenCalledTimes(2);
  });

  it('keeps a furnishing at bare-hands corpse yield and unlocks the premium specimen with a real tool', async () => {
    const strongerUse = { type: 'gatherTool', professionId: 'mining', tier: 2 } as const;
    forgedUse(strongerUse);
    ITEMS[TOOL_ID] = { ...TOOL, use: strongerUse };
    // Current corpse families are tier one. Raise this existing test seam to
    // exercise the premium gate at the first tier bare hands cannot cover.
    (MONSTER_MATERIAL_TIERS as Record<string, number>).hide = 2;
    const h = harness(host);
    h.meta.gatheringProficiency.mining = 40;
    h.world.setHarvestPreference('rough_hide');
    h.sync();
    expect(h.meta.harvestPreference).toEqual({ kind: 'material', itemId: 'rough_hide' });
    expect(h.world.harvestPreference).toEqual({ kind: 'material', itemId: 'rough_hide' });
    h.player.pos = h.sim.groundPos(0, 0);
    h.player.prevPos = { ...h.player.pos };
    let plainCount = 0;
    for (const eligible of [false, true]) {
      h.inventory(furnished, { itemId: 'field_kit', count: 1 }, ...(eligible ? [tool] : []));
      const mob = createMob(99001 + Number(eligible), MOBS.forest_wolf, 3, h.sim.groundPos(1, 0));
      mob.dead = true;
      mob.aiState = 'dead';
      mob.corpseTimer = 9999;
      mob.respawnTimer = 9999;
      h.sim.entities.set(mob.id, mob);
      h.sync();
      h.world.drainEvents();
      // Seed the real Mulberry32 stream at the same command boundary on each
      // host. Its second draw is 0.8512107962742448, a rare material roll.
      (h.sim.rng as unknown as { s: number }).s = 9;
      const draws = vi.spyOn(h.sim.rng, 'next');
      const outcome = noPrediction(h, () => h.world.harvestCorpse(mob.id));
      expect(await outcome).toBe(true);
      wire(h, { cmd: 'harvestCorpse', id: mob.id });
      expect(h.sim.countItem('pristine_hide', h.pid)).toBe(0);
      expect(h.world.player.castingAbility).toBe('corpse_harvest');
      finishCast(h, 'corpse_harvest');
      expect(h.sim.countItem(ID, h.pid)).toBe(1);
      expect(h.sim.countItem('field_kit', h.pid)).toBe(1);
      expect(mob.harvestClaimedBy).toBe(h.pid);
      expect(draws).toHaveBeenCalledTimes(2);
      expect(h.sim.countItem('rough_hide', h.pid)).toBeGreaterThan(0);
      const events = h.world.drainEvents();
      const denials = events.filter((event) => event.type === 'gatherDenied');
      if (eligible) {
        expect(h.sim.countItem('rough_hide', h.pid)).toBe(plainCount);
        expect(h.sim.countItem('pristine_hide', h.pid)).toBe(1);
        expect(h.world.inventory.find((entry) => entry.itemId === 'pristine_hide')).toMatchObject({
          count: 1,
          materialSources: [{ source: { signer: h.meta.name }, count: 1 }],
        });
        expect(denials).toEqual([]);
      } else {
        plainCount = h.sim.countItem('rough_hide', h.pid);
        expect(h.sim.countItem('pristine_hide', h.pid)).toBe(0);
        expect(h.world.inventory.some((entry) => entry.itemId === 'pristine_hide')).toBe(false);
        expect(denials).toEqual([
          {
            type: 'gatherDenied',
            pid: h.pid,
            surface: 'corpse',
            requiredTier: 2,
          },
        ]);
      }
      expect(events).toContainEqual(expect.objectContaining({ type: 'harvestResult', pid: h.pid }));
      draws.mockRestore();
    }
  });
});
