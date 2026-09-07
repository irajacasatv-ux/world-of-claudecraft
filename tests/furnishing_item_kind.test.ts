import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listingEligibility, WOC_MARKET_RESTRICTED_POLICY } from '../server/woc_market_rules';
import { stackSizeOf } from '../src/sim/bags';
import { buildHeroicVariants } from '../src/sim/content/heroic_variants';
import * as recipeContent from '../src/sim/content/recipes';
import type { ReliquaryPageDef } from '../src/sim/content/reliquary';
import { BUILTIN_WORLD, ITEMS, MOBS } from '../src/sim/data';
import {
  canEquipItem,
  canEquipItemInSlot,
  resolveEquipSlot,
  slotAcceptsItem,
} from '../src/sim/equipment_rules';
import {
  exchangeBrowseCategory,
  exchangeBrowseSubcategory,
  exchangeCategoryUsesQualityFloor,
  exchangeHardLock,
  exchangeItemCategory,
} from '../src/sim/exchange_eligibility';
import { guildBankPipeRefusal } from '../src/sim/guild_bank';
import { extractTradableCopy } from '../src/sim/inventory_extract';
import { compareBagStacks } from '../src/sim/inventory_sort';
import { primaryStatBudget, slotStatMultForItem } from '../src/sim/item_budget';
import {
  expectedStatBudget,
  isItemLevelEligible,
  itemLevel,
  itemScore,
  primaryStatSum,
  resetItemLevelCache,
} from '../src/sim/item_level';
import { isStorableItemKind } from '../src/sim/item_storage_rules';
import { MAIL_DELIVERY_SECONDS } from '../src/sim/mail/post_office';
import {
  defaultMarketQuery,
  MARKET_ITEM_TYPE_FILTERS,
  marketItemMatches,
  sanitizeMarketQuery,
} from '../src/sim/market_query';
import {
  isCommissionEligible,
  isCommissionEligibleKind,
  unbindItem,
} from '../src/sim/professions/commission';
import {
  craftBonusStatsFor,
  mintsSignedCraftOutput,
  mintsSignerPayload,
  resolveCraftForRecipe,
} from '../src/sim/professions/crafting';
import { typedSecondaryFor } from '../src/sim/professions/disenchant_reagents';
import {
  evaluateApplyEnchantAdmission,
  evaluateDisenchantAdmission,
  isDisenchantable,
  resolveApplyEnchant,
  resolveDisenchant,
} from '../src/sim/professions/enchanting';
import {
  craftForApexItem,
  PERFECTING_ATTEMPT_COST,
  perfectedBonusStats,
  perfectingInfoFrom,
  resolvePerfectingAttempt,
} from '../src/sim/professions/perfecting';
import {
  evaluateSalvageAdmission,
  isSalvageable,
  resolveSalvage,
} from '../src/sim/professions/salvage';
import { extractEssence, isSunderable } from '../src/sim/professions/sundering';
import {
  gatherToolTier,
  hasFishingImplement,
  resolveSlotToolEffect,
} from '../src/sim/professions/tools';
import type { ProfessionRecipeRecord } from '../src/sim/professions/types';
import { catalogItemCompletion, pageCompletion } from '../src/sim/reliquary';
import { Sim } from '../src/sim/sim';
import type { FurnishingItemDef, ItemDef, ItemInstancePayload, ItemKind } from '../src/sim/types';
import { buyPurchaseTotals, vendorCountForced } from '../src/sim/vendor_buy_stack';
import { vendorStackSize } from '../src/sim/vendor_stack';
import {
  applyBagFilter,
  BAG_CATEGORIES,
  DEFAULT_BAG_FILTER,
  matchesCategory,
} from '../src/ui/bag_filter';
import { bagItemContextActions, bagItemNewActions } from '../src/ui/bag_item_context_menu';
import {
  type BagMode,
  bagItemAction,
  bagSlotsLineKey,
  bagTooltipHintKey,
} from '../src/ui/bags_view';
import { BagsWindow } from '../src/ui/bags_window';
import { isPaperdollDraggable, paperdollDropAction } from '../src/ui/equip_drop_core';
import { ActionBarController } from '../src/ui/hud/action_bar/action_bar_controller';
import type { HotbarAction } from '../src/ui/hud/action_bar/hotbar';
import { itemIconRecipe } from '../src/ui/icons';
import { itemKindLabel } from '../src/ui/item_kind_label';
import { itemNameColor } from '../src/ui/item_name_color';
import {
  isHeroicItem,
  marketArmorBadge,
  marketHeroicStar,
  marketPatternMark,
} from '../src/ui/market_armor_badge';
import { marketNameColor } from '../src/ui/market_name_color';
import { marketFilterMenus } from '../src/ui/market_view';
import { MarketWindow } from '../src/ui/market_window';
import { wocTradableSlot } from '../src/ui/trade_woc_view';
import { lockedOutRows, sellableRows } from '../src/ui/woc_market_view';
import { FURNISHING } from './fixtures/furnishing_item';
import { stripComments } from './helpers/strip_comments';

const ID = FURNISHING.id;
const GEAR: ItemDef = {
  id: 'test_furnishing_gear_control',
  name: 'Control Sword',
  kind: 'weapon',
  slot: 'mainhand',
  quality: 'rare',
  sellValue: 1,
  requiredLevel: 1,
  stats: { str: 10, armor: 20 },
  weapon: { min: 10, max: 10, speed: 2 },
  heroicOf: 'test_furnishing_source',
};
const TOOL: ItemDef = {
  id: 'test_furnishing_tool_control',
  name: 'Control Pick',
  kind: 'tool',
  sellValue: 1,
  use: { type: 'gatherTool', professionId: 'mining', tier: 9 },
};
function malformedPower(): ItemDef {
  return {
    ...GEAR,
    ...FURNISHING,
    slot: 'mainhand',
    stats: GEAR.stats,
    weapon: GEAR.weapon,
  } as unknown as ItemDef;
}
const QUEST_ID = 'supply_crate';
const SIGNED: ItemInstancePayload = { signer: 'Testmaker' };
const RECIPE: ProfessionRecipeRecord = {
  id: 'test_furnishing_recipe',
  professionId: 'weaponcrafting',
  resultItemId: ID,
  resultCount: 1,
  reagents: [{ itemId: 'bone_fragments', count: 1 }],
  skillReq: 0,
  itemLevelBudget: 1,
  level: 1,
};
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
  ITEMS[TOOL.id] = structuredClone(TOOL);
  resetItemLevelCache();
});
afterEach(() => {
  delete ITEMS[ID];
  delete ITEMS[GEAR.id];
  delete ITEMS[TOOL.id];
  resetItemLevelCache();
  vi.restoreAllMocks();
});

function makeSim(): Sim {
  const sim = new Sim({
    seed: 73,
    playerClass: 'warrior',
    autoEquip: false,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
  sim.inventory.splice(0);
  sim.meta(sim.playerId)!.copper = 10000;
  sim.drainEvents();
  return sim;
}
function give(sim: Sim, itemId = ID, instance?: ItemInstancePayload): void {
  sim.inventory.push({
    itemId,
    count: 1,
    ...(instance ? { instance: structuredClone(instance) } : {}),
  });
}
function moveTo(sim: Sim, entityId: number, pid = sim.playerId): void {
  const target = sim.entities.get(entityId)!;
  const player = sim.entities.get(pid)!;
  expect(target).toBeDefined();
  player.pos = { ...target.pos };
  player.prevPos = { ...player.pos };
  sim.rebucket(player);
}
function atBank(sim: Sim): void {
  const banker = [...sim.entities.values()].find((e) => e.templateId === 'bursar_fernando')!;
  moveTo(sim, banker.id);
}
function atMarket(sim: Sim): void {
  moveTo(sim, sim.market.merchantIds[0]);
}
function errors(sim: Sim): string[] {
  return sim.drainEvents().flatMap((event) => (event.type === 'error' ? [event.text] : []));
}
function expectNoMutation(sim: Sim, run: () => unknown): unknown {
  // Saves omit casts, auras, consumption and cooldowns. Capture every entity
  // too, including entities a forged feast or summon could create.
  const snapshot = () =>
    structuredClone({
      character: sim.serializeCharacter(sim.playerId),
      entities: [...sim.entities],
    });
  const before = snapshot();
  expect(before.character).not.toBeNull();
  const draw = vi.spyOn(sim.rng, 'next');
  const result = run();
  expect(snapshot()).toEqual(before);
  expect(draw).not.toHaveBeenCalled();
  return result;
}
function bar(storage = new Map<string, string>()): ActionBarController {
  return new ActionBarController({
    storage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
    },
    playerClass: 'warrior',
    playerName: 'FurnishingTester',
    playerLevel: () => 20,
    talentSpec: () => null,
    knownAbilityIds: () => ['sunder_armor'],
    hasAura: () => false,
    showAttackButton: () => true,
  });
}
const itemAction: HotbarAction = { type: 'item', id: ID };

describe('furnishing definition and inventory', () => {
  it('requires placement data and forbids item powers at compile time', () => {
    const rug: FurnishingItemDef = {
      ...FURNISHING,
      furnishing: { ...FURNISHING.furnishing, r: 0 },
    };
    expect(rug.furnishing.r).toBe(0);
    // @ts-expect-error collision radius is required even for walk-through furnishings
    const missingRadius: FurnishingItemDef['furnishing'] = {
      footprint: { width: 1, depth: 1 },
      decorCost: 1,
      surface: 'floor',
    };
    // @ts-expect-error furnishings cannot supply stats
    const stats: FurnishingItemDef = { ...FURNISHING, stats: { str: 1 } };
    // @ts-expect-error furnishings cannot carry item-use actions
    const use: FurnishingItemDef = { ...FURNISHING, use: { type: 'fishing' } };
    // @ts-expect-error the broad union must not admit furnishing through OtherItemDef
    const broadUse: ItemDef = { ...FURNISHING, use: { type: 'fishing' } };
    const feast: FurnishingItemDef = {
      ...FURNISHING,
      // @ts-expect-error furnishings cannot grant feast effects
      feast: { charges: 1, durationTicks: 1, dishItemId: 'roasted_boar', templateId: 'test_feast' },
    };
    // @ts-expect-error furnishing copies cannot opt into stacking
    const stack: FurnishingItemDef = { ...FURNISHING, stackSize: 20 };
    // @ts-expect-error furnishing provenance belongs to the copy
    const signer: FurnishingItemDef = { ...FURNISHING, signer: 'Defmaker' };
    void [missingRadius, stats, use, broadUse, feast, stack, signer];
  });
  it('accepts either boolean plinth value and rejects a numeric plinth through the broad union', () => {
    const raised: ItemDef = {
      ...FURNISHING,
      furnishing: { ...FURNISHING.furnishing, plinth: true },
    };
    const floor: ItemDef = {
      ...FURNISHING,
      furnishing: { ...FURNISHING.furnishing, plinth: false },
    };
    const omitted: ItemDef = { ...FURNISHING };
    expect(raised.furnishing.plinth).toBe(true);
    expect(floor.furnishing.plinth).toBe(false);
    expect(omitted.furnishing.plinth).toBeUndefined();
    // @ts-expect-error furnishing plinth accepts only a boolean when present
    const numeric: ItemDef = { ...FURNISHING, furnishing: { ...FURNISHING.furnishing, plinth: 1 } };
    void numeric;
  });
  it('keeps every placement field required and every power field uninhabitable', () => {
    type Placement = FurnishingItemDef['furnishing'];
    type RequiredField<K extends keyof Placement> = {} extends Pick<Placement, K> ? false : true;
    const required: { [K in 'footprint' | 'r' | 'decorCost' | 'surface']: RequiredField<K> } = {
      footprint: true,
      r: true,
      decorCost: true,
      surface: true,
    };
    const footprintRequired: {
      [K in 'width' | 'depth']: {} extends Pick<Placement['footprint'], K> ? false : true;
    } = { width: true, depth: true };
    type PowerField =
      | 'armorType'
      | 'slot'
      | 'weapon'
      | 'stats'
      | 'spellPower'
      | 'healPower'
      | 'critRating'
      | 'hasteRating'
      | 'hitRating'
      | 'pvpOffenseRating'
      | 'pvpDefenseRating'
      | 'use'
      | 'feast'
      | 'stackSize'
      | 'foodHp'
      | 'drinkMana'
      | 'potionHp'
      | 'potionHpPctMax'
      | 'potionMana'
      | 'elixir'
      | 'bagSlots'
      | 'materialsOnly'
      | 'teachesRiding'
      | 'set'
      | 'masterwrought';
    type IsNever<T> = [T] extends [never] ? true : false;
    const barred: { [K in PowerField]: IsNever<NonNullable<FurnishingItemDef[K]>> } = {
      armorType: true,
      slot: true,
      weapon: true,
      stats: true,
      spellPower: true,
      healPower: true,
      critRating: true,
      hasteRating: true,
      hitRating: true,
      pvpOffenseRating: true,
      pvpDefenseRating: true,
      use: true,
      feast: true,
      stackSize: true,
      foodHp: true,
      drinkMana: true,
      potionHp: true,
      potionHpPctMax: true,
      potionMana: true,
      elixir: true,
      bagSlots: true,
      materialsOnly: true,
      teachesRiding: true,
      set: true,
      masterwrought: true,
    };
    // @ts-expect-error only floor support is authored by this item contract
    const surface: Placement['surface'] = 'wall';
    void [required, footprintRequired, barred, surface];
    expect(FURNISHING.furnishing).toEqual({
      footprint: { width: 2, depth: 3 },
      r: 0,
      decorCost: 7,
      surface: 'floor',
    });
  });
  it('keeps furnishing out of the broad OtherItemDef escape hatch', () => {
    const source = stripComments(
      readFileSync(new URL('../src/sim/types.ts', import.meta.url), 'utf8'),
    );
    const other = source.slice(source.indexOf('interface OtherItemDef'));
    expect(other).toMatch(/kind:\s*Exclude<\s*ItemKind,[^>]*'furnishing'/);
  });
  it('introduces no shipping furnishing record', () => {
    expect(
      Object.values(ITEMS)
        .filter((def) => def.kind === 'furnishing')
        .map((def) => def.id),
    ).toEqual([ID]);
  });
  it('occupies one bag slot per copy', () => {
    expect(stackSizeOf(FURNISHING)).toBe(1);
    const sim = makeSim();
    sim.addItem(ID, 2);
    expect(sim.inventory).toEqual([
      { itemId: ID, count: 1 },
      { itemId: ID, count: 1 },
    ]);
  });
  it('ignores a malformed runtime stack override', () => {
    expect(stackSizeOf({ ...FURNISHING, stackSize: 20 } as unknown as ItemDef)).toBe(1);
  });
  it('ranks immediately after tools and preserves the entire existing kind order', () => {
    const order: ItemKind[] = [
      'weapon',
      'armor',
      'held_offhand',
      'bag',
      'potion',
      'elixir',
      'flask',
      'scroll',
      'food',
      'drink',
      'tool',
      'furnishing',
      'mount',
      'recipe',
      'junk',
      'quest',
    ];
    const defs = order.map((kind) =>
      kind === 'furnishing'
        ? FURNISHING
        : Object.values(ITEMS).find((def) => def.kind === kind && def.quality !== 'poor')!,
    );
    expect(defs.every(Boolean)).toBe(true);
    const lookup = (id: string) => defs.find((def) => def.id === id);
    const slots = defs.map((def) => ({ itemId: def.id, count: 1 })).reverse();
    slots.sort((a, b) => compareBagStacks(a, b, lookup));
    expect(slots.map((slot) => lookup(slot.itemId)!.kind)).toEqual(order);
  });
});

describe('furnishing refusal and power gates', () => {
  it('refuses equipment eligibility for every player class', () => {
    for (const cls of [
      'warrior',
      'mage',
      'rogue',
      'priest',
      'hunter',
      'warlock',
      'paladin',
      'shaman',
      'druid',
    ] as const) {
      expect(canEquipItem(cls, malformedPower()), cls).toBe(false);
      expect(canEquipItem(cls, GEAR), cls).toBe(true);
    }
  });
  it('resolves no equip slot', () => {
    expect(resolveEquipSlot(malformedPower(), {})).toBeNull();
    expect(resolveEquipSlot(GEAR, {})).toBe('mainhand');
  });
  it('rejects targeted equipment slots', () => {
    expect(slotAcceptsItem(malformedPower(), 'mainhand')).toBe(false);
    expect(canEquipItemInSlot('warrior', malformedPower(), 'mainhand')).toBe(false);
    expect(slotAcceptsItem(GEAR, 'mainhand')).toBe(true);
    expect(canEquipItemInSlot('warrior', GEAR, 'mainhand')).toBe(true);
  });
  it('equip command consumes and moves nothing', () => {
    const sim = makeSim();
    give(sim);
    ITEMS[ID] = { ...FURNISHING, slot: 'mainhand', stats: { str: 50 } } as unknown as ItemDef;
    expect(expectNoMutation(sim, () => sim.equipItem(ID))).toBeUndefined();
    give(sim, GEAR.id);
    sim.equipItem(GEAR.id);
    expect(sim.equipment.mainhand).toBe(GEAR.id);
    expect(sim.countItem(GEAR.id)).toBe(0);
  });
  it('disenchant refuses before spending a copy or drawing randomness', () => {
    const sim = makeSim();
    give(sim);
    expect(isDisenchantable(FURNISHING)).toBe(false);
    expect(isDisenchantable(GEAR)).toBe(true);
    expect(expectNoMutation(sim, () => resolveDisenchant(sim.ctx, sim.playerId, ID))).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_disenchantable',
    });
    give(sim, GEAR.id);
    expect(resolveDisenchant(sim.ctx, sim.playerId, GEAR.id)?.ok).toBe(true);
    expect(sim.countItem(GEAR.id)).toBe(0);
  });
  it('disenchant admission refuses the same item kind', () => {
    const sim = makeSim();
    give(sim);
    expect(
      expectNoMutation(sim, () => evaluateDisenchantAdmission(sim.ctx, sim.playerId, ID)),
    ).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_disenchantable',
    });
    give(sim, GEAR.id);
    expect(evaluateDisenchantAdmission(sim.ctx, sim.playerId, GEAR.id)).toBeNull();
  });
  it('has no typed disenchant reagent', () => {
    expect(typedSecondaryFor(FURNISHING)).toBeNull();
    expect(typedSecondaryFor(GEAR)).toBe('resonant_steel');
  });
  it('salvage refuses before spending a copy or drawing randomness', () => {
    const sim = makeSim();
    give(sim);
    expect(isSalvageable(FURNISHING)).toBe(false);
    expect(isSalvageable(GEAR)).toBe(true);
    expect(expectNoMutation(sim, () => resolveSalvage(sim.ctx, sim.playerId, ID))).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_salvageable',
    });
    give(sim, GEAR.id);
    expect(resolveSalvage(sim.ctx, sim.playerId, GEAR.id)?.ok).toBe(true);
    expect(sim.countItem(GEAR.id)).toBe(0);
  });
  it('salvage admission refuses the same item kind', () => {
    const sim = makeSim();
    give(sim);
    expect(
      expectNoMutation(sim, () => evaluateSalvageAdmission(sim.ctx, sim.playerId, ID)),
    ).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_salvageable',
    });
    give(sim, GEAR.id);
    expect(evaluateSalvageAdmission(sim.ctx, sim.playerId, GEAR.id)).toBeNull();
  });
  it('sundering refuses without starting a cast or moving a copy', () => {
    const sim = makeSim();
    give(sim);
    expect(isSunderable(FURNISHING)).toBe(false);
    expectNoMutation(sim, () => extractEssence(sim.ctx, ID, sim.playerId));
    expect(sim.player.castingAbility).toBeNull();
    expect(errors(sim)).toEqual(['Only raid-won epics can be sundered.']);
    // Raid provenance is keyed by the shipped encounter source index.
    const raidGear = Object.values(ITEMS).find(isSunderable)!;
    expect(isSunderable(raidGear)).toBe(true);
    give(sim, raidGear.id);
    extractEssence(sim.ctx, raidGear.id, sim.playerId);
    expect(sim.player.castingAbility).toBe('sundering');
  });
  it('perfecting refuses without spending materials or altering a copy', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    ITEMS[ID] = { ...FURNISHING, masterwrought: true } as unknown as ItemDef;
    expectNoMutation(sim, () =>
      resolvePerfectingAttempt(sim.ctx, sim.playerId, { bag: 0, itemId: ID }),
    );
    expect(errors(sim)).toEqual(['Only Masterwrought items can be perfected.']);
    ITEMS[GEAR.id] = { ...GEAR, masterwrought: true } as ItemDef;
    vi.spyOn(recipeContent, 'recipeForResultItem').mockReturnValue({
      ...RECIPE,
      resultItemId: GEAR.id,
    });
    sim.meta(sim.playerId)!.craftSkills.weaponcrafting = 125;
    give(sim, GEAR.id);
    for (const cost of PERFECTING_ATTEMPT_COST) sim.addItem(cost.itemId, cost.count);
    const bag = sim.inventory.findIndex((slot) => slot.itemId === GEAR.id);
    vi.spyOn(sim.rng, 'next').mockReturnValue(0);
    resolvePerfectingAttempt(sim.ctx, sim.playerId, { bag, itemId: GEAR.id });
    expect(sim.inventory[bag].instance?.perfecting).toBe(1);
    expect(errors(sim)).toEqual([]);
  });
  it('has no Perfecting view from the shared inventory projection', () => {
    const sim = makeSim();
    give(sim);
    expect(
      perfectingInfoFrom({
        ref: { bag: 0, itemId: ID },
        inventory: sim.inventory,
        equipment: {},
        equipmentInstances: {},
        craftSkills: sim.meta(sim.playerId)!.craftSkills,
      }),
    ).toBeNull();
    ITEMS[GEAR.id] = { ...GEAR, masterwrought: true } as ItemDef;
    give(sim, GEAR.id);
    expect(
      perfectingInfoFrom({
        ref: { bag: 1, itemId: GEAR.id },
        inventory: sim.inventory,
        equipment: {},
        equipmentInstances: {},
        craftSkills: sim.meta(sim.playerId)!.craftSkills,
      })?.itemId,
    ).toBe(GEAR.id);
  });
  it('cannot receive a Perfecting stat bonus from malformed power data', () => {
    const malformed = { ...FURNISHING, slot: 'helmet', stats: { str: 10 } } as unknown as ItemDef;
    expect(perfectedBonusStats(malformed, { level: 1 })).toBeNull();
    expect(perfectedBonusStats(GEAR, { level: 1 })?.str).toBeGreaterThan(0);
  });
  it.each([
    { shape: 'bagged', worn: false, replace: false },
    { shape: 'worn', worn: true, replace: false },
    { shape: 'bagged replacement', worn: false, replace: true },
    { shape: 'worn replacement', worn: true, replace: true },
  ])('refuses $shape enchant admission and resolution with eligible controls', (row) => {
    for (const apply of [evaluateApplyEnchantAdmission, resolveApplyEnchant]) {
      const sim = makeSim();
      const meta = sim.meta(sim.playerId)!;
      ITEMS[ID] = malformedPower();
      const payload = row.replace
        ? { enchant: 'enchant_weapon_intellect', rolled: { stats: { int: 2 } } }
        : undefined;
      sim.addItem('arcane_dust', 5);
      if (row.worn) {
        meta.equipment.mainhand = ID;
        meta.equipmentInstance = payload ? { mainhand: payload } : {};
      } else give(sim, ID, payload);
      expect(
        expectNoMutation(sim, () =>
          apply(
            sim.ctx,
            sim.playerId,
            ID,
            'enchant_weapon_might',
            row.worn ? 'mainhand' : undefined,
            row.replace,
          ),
        ),
      ).toEqual({
        ok: false,
        itemId: ID,
        enchantId: 'enchant_weapon_might',
        reason: 'wrong_slot',
      });
      if (row.worn) meta.equipment.mainhand = GEAR.id;
      else {
        sim.inventory.splice(1, 1);
        give(sim, GEAR.id, payload);
      }
      const result = apply(
        sim.ctx,
        sim.playerId,
        GEAR.id,
        'enchant_weapon_might',
        row.worn ? 'mainhand' : undefined,
        row.replace,
      );
      if (apply === evaluateApplyEnchantAdmission) expect(result).toBeNull();
      else expect(result?.ok).toBe(true);
    }
  });
  it('does not generate heroic power variants even from malformed slot data', () => {
    const malformed = { ...FURNISHING, slot: 'helmet', stats: { str: 10 } } as unknown as ItemDef;
    const gear: ItemDef = {
      id: 'test_heroic_control',
      name: 'Control',
      sellValue: 1,
      kind: 'armor',
      armorType: 'mail',
      slot: 'helmet',
      quality: 'rare',
      stats: { str: 10 },
    };
    const mob = {
      ...MOBS.korzul_the_gravewyrm,
      loot: [
        { itemId: ID, chance: 1 },
        { itemId: gear.id, chance: 1 },
      ],
    };
    const result = buildHeroicVariants({ [ID]: malformed, [gear.id]: gear }, { [mob.id]: mob });
    expect(Object.keys(result)).toEqual(['heroic_test_heroic_control']);
    expect(result.heroic_test_heroic_control.heroicOf).toBe('test_heroic_control');
    expect(result.heroic_test_heroic_control.kind).toBe('armor');
  });
  it('cannot acquire an apex crafting identity', () => {
    vi.spyOn(recipeContent, 'recipeForResultItem').mockReturnValue(RECIPE);
    ITEMS[ID] = { ...FURNISHING, masterwrought: true } as unknown as ItemDef;
    expect(craftForApexItem(ID)).toBeNull();
    ITEMS[ID] = { ...ITEMS[ID], kind: 'weapon' } as unknown as ItemDef;
    expect(craftForApexItem(ID)).toBe('weaponcrafting');
  });
  it('cannot receive a commission bond', () => {
    expect(isCommissionEligibleKind('furnishing')).toBe(false);
    expect(isCommissionEligible(FURNISHING)).toBe(false);
    expect(isCommissionEligibleKind('weapon')).toBe(true);
    expect(isCommissionEligible(GEAR)).toBe(true);
  });
  it('refuses unbinding without clearing a copy lock or charging copper', () => {
    const sim = makeSim();
    give(sim, ID, { signer: 'Testmaker', boundTo: 0, bindOnTrade: true });
    expect(expectNoMutation(sim, () => unbindItem(sim.ctx, ID, sim.playerId))).toEqual({
      ok: false,
      itemId: ID,
      reason: 'unbind_not_eligible',
      fee: 10000,
    });
    give(sim, GEAR.id, { signer: 'Testmaker', boundTo: sim.playerId, bindOnTrade: true });
    const station = sim.ctx.stationPlacements[0];
    sim.player.pos.x = station.pos.x;
    sim.player.pos.z = station.pos.z;
    expect(unbindItem(sim.ctx, GEAR.id, sim.playerId)).toEqual({
      ok: true,
      itemId: GEAR.id,
      fee: 10000,
    });
    expect(
      sim.inventory.find((slot) => slot.itemId === GEAR.id)?.instance?.boundTo,
    ).toBeUndefined();
    expect(sim.copper).toBe(0);
  });
  it('has no crafting stat bonus', () => {
    const def = { ...FURNISHING, slot: 'helmet', stats: { str: 10 } } as unknown as ItemDef;
    expect(craftBonusStatsFor(def, RECIPE)).toBeNull();
    expect(craftBonusStatsFor(GEAR, { ...RECIPE, level: 20 })?.str).toBeGreaterThan(0);
  });
  it('retains the existing signer rarity rule', () => {
    for (const [quality, signed] of [
      ['common', false],
      ['uncommon', false],
      ['rare', true],
      ['epic', true],
      ['legendary', true],
    ] as const) {
      expect(mintsSignerPayload(FURNISHING, quality), quality).toBe(signed);
    }
    expect(mintsSignedCraftOutput(FURNISHING)).toBe(true);
    expect(mintsSignedCraftOutput({ ...FURNISHING, quality: 'poor' })).toBe(false);
    expect(mintsSignedCraftOutput({ ...FURNISHING, quality: undefined })).toBe(false);
  });
  it('crafts a signed furnishing without power', () => {
    const sim = makeSim();
    sim.meta(sim.playerId)!.craftSkills.weaponcrafting = 100;
    sim.addItem('bone_fragments', 1);
    const result = resolveCraftForRecipe(sim.ctx, sim.playerId, RECIPE);
    expect(result.ok).toBe(true);
    expect(sim.countItem('bone_fragments')).toBe(0);
    expect(sim.inventory).toEqual([
      { itemId: ID, count: 1, instance: { signer: sim.player.name } },
    ]);
  });
  it('has no item-level eligibility', () => {
    expect(isItemLevelEligible(malformedPower())).toBe(false);
    expect(isItemLevelEligible(GEAR)).toBe(true);
  });
  it('has no item level', () => {
    expect(itemLevel(malformedPower())).toBeUndefined();
    expect(itemLevel(GEAR)).toBe(25);
  });
  it('has no expected stat budget', () => {
    expect(expectedStatBudget(malformedPower())).toBeUndefined();
    expect(expectedStatBudget(GEAR)).toBe(14);
  });
  it('has no slot stat multiplier', () => {
    expect(
      slotStatMultForItem({ ...malformedPower(), occupiesHand: false } as ItemDef),
    ).toBeUndefined();
    expect(
      slotStatMultForItem({
        id: 'test_worn_control',
        name: 'Control Quiver',
        kind: 'held_offhand',
        sellValue: 1,
        slot: 'offhand',
        occupiesHand: false,
      }),
    ).toBe(0.45);
  });
  it('has zero raw budget because the valid furnishing shape has no slot', () => {
    expect(primaryStatBudget(20, 'rare', FURNISHING.slot)).toBe(0);
    expect(primaryStatBudget(20, 'rare', GEAR.slot)).toBe(11);
  });
  it('has no scored primary stats', () => {
    expect(primaryStatSum(malformedPower())).toBe(0);
    expect(primaryStatSum(GEAR)).toBe(10);
  });
  it('has no item power score', () => {
    expect(itemScore(malformedPower())).toBe(0);
    expect(itemScore(GEAR)).toBeGreaterThan(10);
  });
  it('cannot serve as a gathering tool', () => {
    expect(gatherToolTier(FURNISHING, 'mining')).toBeUndefined();
    expect(gatherToolTier(TOOL, 'mining')).toBe(9);
  });
  it.each([
    { type: 'fishing' } as const,
    { type: 'gatherTool', professionId: 'fishing', tier: 9 } as const,
  ])('cannot serve as a fishing implement through $type', (use) => {
    ITEMS[ID] = { ...FURNISHING, use } as unknown as ItemDef;
    ITEMS[TOOL.id] = { ...TOOL, use } as ItemDef;
    expect(hasFishingImplement([{ itemId: ID, count: 1 }], ITEMS)).toBe(false);
    expect(hasFishingImplement([{ itemId: TOOL.id, count: 1 }], ITEMS)).toBe(true);
  });
  it('ignores forged gathering capabilities', () => {
    const malformed = {
      ...FURNISHING,
      use: { type: 'gatherTool', professionId: 'mining', tier: 9 },
    } as unknown as ItemDef;
    expect(gatherToolTier(malformed, 'mining')).toBeUndefined();
    expect(gatherToolTier(TOOL, 'mining')).toBe(9);
  });
  it('refuses furnishing copies as tool-effect charms', () => {
    const tool = Object.values(ITEMS).find(
      (def) =>
        def.kind === 'tool' && def.use?.type === 'gatherTool' && def.use.professionId === 'mining',
    )!;
    expect(tool).toBeDefined();
    const malformed = {
      ...FURNISHING,
      use: { type: 'toolEffect', effectId: 'makers_charm' },
    } as unknown as ItemDef;
    const inventory = [
      { itemId: tool.id, count: 1 },
      { itemId: ID, count: 1 },
    ];
    const before = structuredClone(inventory);
    expect(
      resolveSlotToolEffect(
        inventory,
        'mining',
        'makers_charm',
        'always',
        { ...ITEMS, [ID]: malformed },
        undefined,
        undefined,
      ),
    ).toEqual({ ok: false, reason: 'no_charm' });
    expect(inventory).toEqual(before);
    const charm: ItemDef = {
      id: ID,
      name: 'Control Charm',
      sellValue: 1,
      kind: 'tool',
      use: { type: 'toolEffect', effectId: 'makers_charm' },
    };
    expect(
      resolveSlotToolEffect(
        inventory,
        'mining',
        'makers_charm',
        'always',
        { ...ITEMS, [ID]: charm },
        undefined,
        undefined,
      ),
    ).toMatchObject({ ok: true, consumeIndex: 1 });
    expect(inventory).toEqual(before);
  });
});

describe('furnishing storage and economy', () => {
  it.each([
    { name: 'ordinary', jack: false, draws: 1 },
    { name: 'Jack', jack: true, draws: 2 },
  ])('keeps $name crafting draws and refuses a forced furnishing power proc', (row) => {
    ITEMS[ID] = {
      ...FURNISHING,
      masterwrought: true,
      slot: 'chest',
      stats: { str: 4 },
    } as unknown as ItemDef;
    const sim = makeSim();
    const meta = sim.meta(sim.playerId)!;
    meta.craftSkills.weaponcrafting = 100;
    // A major's ceiling permits the rare-to-epic head-start candidate. Thus
    // removing the furnishing head-start guard makes the ordinary case fail.
    meta.archetype.activeArchetype = row.jack ? null : 'weaponcrafting';
    meta.archetype.pairedMajor = null;
    meta.archetype.hobbyCraft = null;
    meta.archetype.isJackOfAllTrades = row.jack;
    sim.addItem('bone_fragments', 1);
    const draw = vi.spyOn(sim.rng, 'next').mockReturnValue(0);
    // Jack draws variance first; 0.5 is normal, then 0 forces the proc hit.
    if (row.jack) draw.mockReturnValueOnce(0.5);
    const result = resolveCraftForRecipe(sim.ctx, sim.playerId, RECIPE, true);
    expect(result.ok).toBe(true);
    expect(draw).toHaveBeenCalledTimes(row.draws);
    expect(result.variance).toBe(row.jack ? 'normal' : undefined);
    expect(result.masterwork).toBeUndefined();
    expect(meta.copper).toBe(9998);
    expect(sim.countItem('bone_fragments')).toBe(0);
    // Exact shape excludes rolled stats, Perfecting rank, enchant and bond.
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: { signer: meta.name } }]);
  });

  function furnishingVendor(sim: Sim): number {
    const marla = [...sim.entities.values()].find(
      (entity) => entity.kind === 'npc' && entity.templateId === 'stablemaster_marla',
    )!;
    expect(marla).toBeDefined();
    // Replace this world's entity stock without mutating the content table.
    marla.vendorItems = [ID];
    moveTo(sim, marla.id);
    sim.setPlayerLevel(20);
    sim.meta(sim.playerId)!.ridingTrained = false;
    sim.drainEvents();
    return marla.id;
  }

  it.each([
    { name: 'ordinary', flags: {}, quantity: 2, copper: 200, honor: 0 },
    { name: 'soulbound', flags: { soulbound: true }, quantity: 1, copper: 100, honor: 0 },
    { name: 'honor-priced', flags: { priceHonor: 7 }, quantity: 1, copper: 100, honor: 7 },
    {
      name: 'forged riding service',
      flags: { teachesRiding: true },
      quantity: 1,
      copper: 100,
      honor: 0,
    },
  ])('buys $name furnishing through the real vendor count path', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags } as unknown as ItemDef;
    const sim = makeSim();
    const vendorId = furnishingVendor(sim);
    const meta = sim.meta(sim.playerId)!;
    // Enough to pay Marla's real Riding fee if the malformed service escapes.
    meta.copper = 1_000_000;
    meta.honor = 100;
    const draw = vi.spyOn(sim.rng, 'next');
    sim.buyItem(vendorId, ID, { count: 2 });
    expect(errors(sim)).toEqual([]);
    expect(draw).not.toHaveBeenCalled();
    expect(meta.ridingTrained).toBe(false);
    expect(meta.copper).toBe(1_000_000 - row.copper);
    expect(meta.honor).toBe(100 - row.honor);
    expect(sim.inventory).toEqual(
      Array.from({ length: row.quantity }, () => ({ itemId: ID, count: 1 })),
    );
  });

  it('refuses two vendor copies with one free cell before charging either copy', () => {
    const sim = makeSim();
    const vendorId = furnishingVendor(sim);
    const meta = sim.meta(sim.playerId)!;
    meta.bags = [];
    for (let cell = 0; cell < sim.bagCapacity - 1; cell++) give(sim);
    expect(sim.bagCapacity).toBe(16);
    expect(sim.inventory).toHaveLength(15);
    expect(sim.canAddItem(ID, 1)).toBe(true);
    expect(sim.canAddItem(ID, 2)).toBe(false);
    expectNoMutation(sim, () => sim.buyItem(vendorId, ID, { count: 2 }));
    expect(errors(sim)).toEqual(['Your bags are full.']);
    sim.buyItem(vendorId, ID, { count: 1 });
    expect(errors(sim)).toEqual([]);
    expect(sim.inventory).toHaveLength(16);
    expect(sim.inventory.every((slot) => slot.itemId === ID && slot.count === 1)).toBe(true);
    expect(meta.copper).toBe(9900);
  });

  type FurnishingLockCase = {
    name: string;
    flags: { soulbound?: boolean; noMarketList?: boolean };
    instance: ItemInstancePayload;
    guild: string | null;
    mail: string;
    market: string | null;
    trade: 'allow' | 'silent' | 'bound';
  };
  const furnishingLocks: FurnishingLockCase[] = [
    {
      name: 'soulbound',
      flags: { soulbound: true },
      instance: SIGNED,
      guild: 'You cannot store soulbound items in the guild bank.',
      mail: 'noMailSoulbound',
      market: 'That item cannot be listed on the World Market.',
      trade: 'silent',
    },
    {
      name: 'no-list',
      flags: { noMarketList: true },
      instance: SIGNED,
      guild: 'That item cannot be stored in the guild bank.',
      mail: 'noMailQuestItems',
      market: 'That item cannot be listed on the World Market.',
      trade: 'allow',
    },
    {
      name: 'armed',
      flags: {},
      instance: { ...SIGNED, bindOnTrade: true },
      guild: 'That item cannot be stored in the guild bank.',
      mail: 'noMailBound',
      market: 'That item is bound and cannot be listed.',
      trade: 'allow',
    },
    {
      name: 'bound to zero',
      flags: {},
      instance: { ...SIGNED, boundTo: 0 },
      guild: 'That item cannot be stored in the guild bank.',
      mail: 'noMailBound',
      market: 'That item is bound and cannot be listed.',
      trade: 'bound',
    },
    {
      name: 'owner-locked',
      flags: {},
      instance: { ...SIGNED, locked: true },
      guild: null,
      mail: 'sent',
      market: null,
      trade: 'allow',
    },
    {
      name: 'combined def and copy locks',
      flags: { soulbound: true, noMarketList: true },
      instance: { ...SIGNED, bindOnTrade: true, boundTo: 0 },
      guild: 'You cannot store soulbound items in the guild bank.',
      mail: 'noMailSoulbound',
      market: 'That item cannot be listed on the World Market.',
      trade: 'silent',
    },
  ];

  it.each(furnishingLocks)('self-banks $name furnishing without dropping lock fields', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    atBank(sim);
    give(sim, ID, row.instance);
    const before = structuredClone(sim.inventory);
    const copper = sim.meta(sim.playerId)!.copper;
    sim.bankDeposit(0, 1);
    expect(sim.inventory).toEqual([]);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual(before);
    sim.bankWithdraw(0, 1);
    expect(sim.inventory).toEqual(before);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual([]);
    expect(sim.meta(sim.playerId)!.copper).toBe(copper);
    expect(errors(sim)).toEqual([]);
  });

  it.each(furnishingLocks)('applies guild-bank $name policy in both directions', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = guildSim();
    const bank = sim.guildBanks.get(7)!;
    give(sim, ID, row.instance);
    const copy = structuredClone(sim.inventory[0]);
    if (row.guild === null) {
      sim.guildBankDepositFor(sim.playerId, 0, 1);
      expect(bank.inventory).toEqual([copy]);
      sim.guildBankWithdrawFor(sim.playerId, 0, 1);
      expect(sim.inventory).toEqual([copy]);
      expect(bank.inventory).toEqual([]);
      expect(errors(sim)).toEqual([]);
      return;
    }
    const beforeBank = structuredClone(bank);
    expectNoMutation(sim, () => sim.guildBankDepositFor(sim.playerId, 0, 1));
    expect(bank).toEqual(beforeBank);
    expect(errors(sim)).toEqual([row.guild]);
    sim.inventory.splice(0);
    bank.inventory.push(copy);
    const beforeWithdraw = structuredClone(bank);
    expectNoMutation(sim, () => sim.guildBankWithdrawFor(sim.playerId, 0, 1));
    expect(bank).toEqual(beforeWithdraw);
    expect(errors(sim)).toEqual(['That item cannot be withdrawn from the guild bank.']);
  });

  it.each(furnishingLocks)('applies mail $name policy before postage or escrow', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    give(sim, ID, row.instance);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.postOffice.mailboxIds[0]);
    sim.drainEvents();
    const beforeMail = structuredClone(sim.postOffice.mail);
    const beforeBob = structuredClone(sim.serializeCharacter(bob));
    const send = () =>
      sim.mailSend('Bob', 'Furniture', 'Parcel.', 0, [
        { itemId: ID, count: 1, instance: row.instance },
      ]);
    if (row.mail === 'sent') {
      send();
      expect(sim.inventory).toEqual([]);
      expect(sim.meta(sim.playerId)!.copper).toBe(9970);
      expect(sim.postOffice.mail.at(-1)?.items).toEqual([
        { itemId: ID, count: 1, instance: row.instance },
      ]);
      expect(sim.drainEvents().filter((event) => event.type === 'mailResult')).toEqual([
        { type: 'mailResult', code: 'sent', pid: sim.playerId, name: 'Bob', value: 30 },
      ]);
    } else {
      expectNoMutation(sim, send);
      expect(sim.postOffice.mail).toEqual(beforeMail);
      expect(sim.drainEvents().filter((event) => event.type === 'mailResult')).toEqual([
        { type: 'mailResult', code: row.mail, pid: sim.playerId },
      ]);
    }
    expect(sim.serializeCharacter(bob)).toEqual(beforeBob);
  });

  it.each(furnishingLocks)('applies market $name policy before signed-copy escrow', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    atMarket(sim);
    give(sim, ID, row.instance);
    const beforeMarket = structuredClone(sim.market.serializeMarket());
    if (row.market !== null) {
      expectNoMutation(sim, () => sim.marketListInstance(ID, 100, row.instance));
      expect(sim.market.serializeMarket()).toEqual(beforeMarket);
      expect(errors(sim)).toEqual([row.market]);
      return;
    }
    sim.marketListInstance(ID, 100, row.instance);
    const listing = sim.market.marketListings.find((entry) => entry.itemId === ID)!;
    expect(listing.instance).toEqual(row.instance);
    expect(sim.inventory).toEqual([]);
    sim.marketCancel(listing.id);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: row.instance }]);
    expect(sim.meta(sim.playerId)!.copper).toBe(10000);
    expect(errors(sim)).toEqual([]);
  });

  it.each(furnishingLocks)('applies direct-trade $name policy and recipient binding', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    give(sim, ID, row.instance);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.drainEvents();
    const beforeBob = structuredClone(sim.serializeCharacter(bob));
    const offer = () => sim.tradeSetOffer([{ itemId: ID, count: 1 }], 0);
    if (row.trade !== 'allow') {
      expectNoMutation(sim, offer);
      expect(sim.tradeInfo!.myOffer.items).toEqual([]);
      expect(sim.serializeCharacter(bob)).toEqual(beforeBob);
      expect(errors(sim)).toEqual(
        row.trade === 'bound' ? ['That item is bound and cannot be traded.'] : [],
      );
      return;
    }
    offer();
    expect(sim.tradeInfo!.myOffer.items).toHaveLength(1);
    sim.tradeConfirm();
    sim.tradeConfirm(bob);
    expect(sim.countItem(ID)).toBe(0);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: row.instance.bindOnTrade ? { ...row.instance, boundTo: bob } : row.instance,
    });
    expect(sim.meta(sim.playerId)!.copper).toBe(10000);
    expect(errors(sim)).toEqual([]);
  });

  it('preserves the soulbound party-window exception for a furnishing', () => {
    ITEMS[ID] = { ...FURNISHING, soulbound: true };
    const sim = makeSim();
    const bob = sim.addPlayer('mage', 'Bob');
    const payload: ItemInstancePayload = {
      ...SIGNED,
      partyTrade: {
        untilMs: Math.floor(sim.time * 1000) + 7_200_000,
        eligible: [sim.player.name, 'Bob'],
      },
    };
    give(sim, ID, payload);
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.drainEvents();
    sim.tradeSetOffer([{ itemId: ID, count: 1 }], 0);
    expect(sim.tradeInfo!.myOffer.items).toHaveLength(1);
    sim.tradeConfirm();
    sim.tradeConfirm(bob);
    expect(sim.inventory).toEqual([]);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: payload,
    });
    expect(errors(sim)).toEqual([]);
  });

  // Existing plain marketList is already exercised for success and quest.
  // Add the two independent definition locks at the actual plain listing entry.
  it.each([{ soulbound: true }, { noMarketList: true }])(
    'retains plain-market definition lock %j',
    (flags) => {
      ITEMS[ID] = { ...FURNISHING, ...flags };
      const sim = makeSim();
      atMarket(sim);
      give(sim);
      const beforeMarket = structuredClone(sim.market.serializeMarket());
      expectNoMutation(sim, () => sim.marketList(ID, 1, 100));
      expect(sim.market.serializeMarket()).toEqual(beforeMarket);
      expect(errors(sim)).toEqual(['That item cannot be listed on the World Market.']);
    },
  );

  it('replays crafting, storage and refused use identically from the same seed', () => {
    const run = () => {
      const sim = makeSim();
      sim.meta(sim.playerId)!.craftSkills.weaponcrafting = 100;
      sim.addItem('bone_fragments', 1);
      expect(resolveCraftForRecipe(sim.ctx, sim.playerId, RECIPE).ok).toBe(true);
      atBank(sim);
      sim.bankDeposit(0, 1);
      sim.bankWithdraw(0, 1);
      sim.useItem(ID);
      expect(sim.inventory[0]).toMatchObject({ itemId: ID, count: 1 });
      return {
        state: sim.serializeCharacter(sim.playerId),
        events: sim.drainEvents(),
        next: sim.rng.next(),
      };
    };
    expect(run()).toEqual(run());
  });
  it('admits storage by kind while retaining quest refusal', () => {
    expect(isStorableItemKind('furnishing')).toBe(true);
    expect(isStorableItemKind('quest')).toBe(false);
    for (const kind of [
      'weapon',
      'armor',
      'held_offhand',
      'bag',
      'potion',
      'elixir',
      'flask',
      'scroll',
      'food',
      'drink',
      'tool',
      'mount',
      'recipe',
      'junk',
    ] as const) {
      expect(isStorableItemKind(kind), kind).toBe(true);
    }
    expect(isStorableItemKind('unknown' as ItemKind)).toBe(true);
  });
  it('deposits signed furnishings in the personal bank', () => {
    const sim = makeSim();
    atBank(sim);
    give(sim, ID, SIGNED);
    sim.bankDeposit(0, 1);
    expect(sim.inventory).toEqual([]);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual([
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
  });
  it('withdraws a signed furnishing from the personal bank', () => {
    const sim = makeSim();
    atBank(sim);
    give(sim, ID, SIGNED);
    sim.bankDeposit(0, 1);
    sim.bankWithdraw(0, 1);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual([]);
  });
  it('keeps personal-bank quest refusal unchanged', () => {
    const sim = makeSim();
    atBank(sim);
    give(sim, QUEST_ID);
    expect(ITEMS[QUEST_ID].kind).toBe('quest');
    expectNoMutation(sim, () => sim.bankDeposit(0, 1));
    expect(errors(sim)).toEqual(['You cannot store quest items in the bank.']);
  });
  function guildSim(): Sim {
    const sim = makeSim();
    atBank(sim);
    sim.setPlayerGuildMembership(sim.playerId, { guildId: 7, rank: 'officer' });
    sim.loadGuildBank(7, { treasury: 0, inventory: [], purchasedSlots: 24 });
    return sim;
  }
  it('deposits a signed furnishing in the guild bank', () => {
    const sim = guildSim();
    give(sim, ID, SIGNED);
    sim.guildBankDepositFor(sim.playerId, 0, 1);
    expect(sim.inventory).toEqual([]);
    expect(sim.guildBanks.get(7)!.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
  });
  it('withdraws a signed furnishing from the guild bank', () => {
    const sim = guildSim();
    give(sim, ID, SIGNED);
    sim.guildBankDepositFor(sim.playerId, 0, 1);
    sim.guildBankWithdrawFor(sim.playerId, 0, 1);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(sim.guildBanks.get(7)!.inventory).toEqual([]);
  });
  it('keeps guild-bank quest deposit refusal unchanged', () => {
    const sim = guildSim();
    give(sim, QUEST_ID);
    expectNoMutation(sim, () => sim.guildBankDepositFor(sim.playerId, 0, 1));
    expect(sim.guildBanks.get(7)!.inventory).toEqual([]);
    expect(errors(sim)).toEqual(['You cannot store quest items in the guild bank.']);
  });
  it('keeps guild-bank quest withdrawal refusal unchanged', () => {
    const sim = guildSim();
    sim.guildBanks.get(7)!.inventory.push({ itemId: QUEST_ID, count: 1 });
    expectNoMutation(sim, () => sim.guildBankWithdrawFor(sim.playerId, 0, 1));
    expect(sim.guildBanks.get(7)!.inventory).toEqual([{ itemId: QUEST_ID, count: 1 }]);
    expect(errors(sim)).toEqual(['That item cannot be withdrawn from the guild bank.']);
  });
  it('does not let furnishing kind bypass guild-bank copy locks', () => {
    expect(
      guildBankPipeRefusal({ itemId: ID, count: 1, instance: { boundTo: 9 } }, 'deposit'),
    ).toBe('That item cannot be stored in the guild bank.');
  });
  it('trades a signed furnishing to another player', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.tradeSetOffer([{ itemId: ID, count: 1, instance: SIGNED }], 0);
    sim.tradeConfirm();
    sim.tradeConfirm(bob);
    expect(sim.countItem(ID)).toBe(0);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: SIGNED,
    });
  });
  it('keeps trade quest refusal unchanged', () => {
    const sim = makeSim();
    give(sim, QUEST_ID);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.drainEvents();
    expectNoMutation(sim, () => sim.tradeSetOffer([{ itemId: QUEST_ID, count: 1 }], 0));
    expect(sim.tradeInfo!.myOffer.items).toEqual([]);
    expect(errors(sim)).toEqual([]);
  });
  it('mails and collects a signed furnishing without losing its maker', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.postOffice.mailboxIds[0]);
    sim.mailSend('Bob', 'Furniture', 'For your home.', 0, [
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
    expect(sim.countItem(ID)).toBe(0);
    expect(sim.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'mailResult', code: 'sent' }),
    );
    for (let tick = 0; tick <= MAIL_DELIVERY_SECONDS * 20; tick++) sim.tick();
    moveTo(sim, sim.postOffice.mailboxIds[0], bob);
    const letter = sim
      .mailInfoFor(bob)!
      .messages.find((message) => message.subject === 'Furniture')!;
    expect(letter).toBeDefined();
    sim.mailTake(letter.id, bob);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: SIGNED,
    });
  });
  it('keeps mail quest refusal and postage unchanged', () => {
    const sim = makeSim();
    give(sim, QUEST_ID);
    sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.postOffice.mailboxIds[0]);
    sim.drainEvents();
    expectNoMutation(sim, () =>
      sim.mailSend('Bob', 'Quest', 'Parcel.', 0, [{ itemId: QUEST_ID, count: 1 }]),
    );
    expect(sim.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'mailResult', code: 'noMailQuestItems' }),
    );
  });
  it('lists and reclaims a plain furnishing on the World Market', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim);
    sim.marketList(ID, 1, 100);
    const listing = sim.market.marketListings.find((row) => row.itemId === ID)!;
    expect(listing).toBeDefined();
    expect(sim.countItem(ID)).toBe(0);
    sim.marketCancel(listing.id);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1 }]);
  });
  it('lists and reclaims a signed furnishing on the World Market', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim, ID, SIGNED);
    sim.marketListInstance(ID, 100, SIGNED);
    const listing = sim.market.marketListings.find((row) => row.itemId === ID)!;
    expect(listing.instance).toEqual(SIGNED);
    expect(sim.countItem(ID)).toBe(0);
    sim.marketCancel(listing.id);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
  });
  it('keeps plain market quest refusal unchanged', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim, QUEST_ID);
    expectNoMutation(sim, () => sim.marketList(QUEST_ID, 1, 100));
    expect(errors(sim)).toEqual(['The Merchant will not broker quest items.']);
  });
  it('keeps signed market quest refusal unchanged', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim, QUEST_ID, SIGNED);
    expectNoMutation(sim, () => sim.marketListInstance(QUEST_ID, 100, SIGNED));
    expect(errors(sim)).toEqual(['The Merchant will not broker quest items.']);
  });
  it('allows a catalogued furnishing to count toward Reliquary completion', () => {
    const page: ReliquaryPageDef = {
      id: 'test_furnishing_page',
      shelf: 'professions',
      name: 'Test',
      relics: [{ kind: 'item', itemId: ID }],
    };
    const sim = makeSim();
    sim.addItem(ID, 1);
    const discovered = sim.meta(sim.playerId)!.deedStats.itemsDiscovered;
    expect(discovered.has(ID)).toBe(true);
    const count = discovered.size;
    sim.addItem(ID, 1);
    expect(discovered.size).toBe(count);
    expect(pageCompletion(page, { itemsDiscovered: discovered })).toEqual({
      owned: 1,
      total: 1,
      complete: true,
    });
    expect(catalogItemCompletion(discovered, [page])).toEqual({ owned: 1, total: 1 });
    expect(pageCompletion(page, { itemsDiscovered: new Set() })).toEqual({
      owned: 0,
      total: 1,
      complete: false,
    });
  });
  it('uses single-unit vendor packs', () => {
    expect(vendorStackSize(FURNISHING)).toBe(1);
  });
  it('permits ordinary bulk vendor purchases with one copy per slot', () => {
    expect(vendorCountForced(FURNISHING)).toBe(false);
    expect(buyPurchaseTotals(FURNISHING, 100, 0, 3)).toEqual({ units: 3, copper: 300, honor: 0 });
  });
  it('uses mount eligibility without the equipment quality floor', () => {
    expect(exchangeItemCategory(FURNISHING)).toBe('mount');
    expect(exchangeCategoryUsesQualityFloor(exchangeItemCategory(FURNISHING))).toBe(false);
    expect(
      listingEligibility(
        { ...FURNISHING, quality: undefined },
        undefined,
        WOC_MARKET_RESTRICTED_POLICY,
      ),
    ).toEqual({ ok: true });
    for (const quality of ['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const) {
      expect(
        listingEligibility({ ...FURNISHING, quality }, SIGNED, WOC_MARKET_RESTRICTED_POLICY),
      ).toEqual({ ok: true });
    }
  });
  it('retains the mount policy switch for furnishing admission', () => {
    expect(
      listingEligibility(FURNISHING, undefined, {
        ...WOC_MARKET_RESTRICTED_POLICY,
        allowMounts: false,
      }),
    ).toEqual({ ok: false, reason: 'not_eligible_category' });
  });
  it('tolerates the same def-level binding as mounts', () => {
    expect(exchangeHardLock({ ...FURNISHING, soulbound: true }, undefined)).toBeNull();
  });
  it('keeps bound copies out of the Exchange', () => {
    expect(exchangeHardLock(FURNISHING, { boundTo: 0 })).toBe('bound_copy');
  });
  it('keeps armed copies out of the Exchange', () => {
    expect(exchangeHardLock(FURNISHING, { bindOnTrade: true })).toBe('bind_armed');
  });
  it('keeps locked copies out of the Exchange', () => {
    expect(exchangeHardLock(FURNISHING, { locked: true })).toBe('locked');
  });
  it('keeps no-list definitions out of the Exchange', () => {
    expect(exchangeHardLock({ ...FURNISHING, noMarketList: true }, undefined)).toBe(
      'no_market_list',
    );
  });
  it('keeps furnishing browse classification distinct from mounts', () => {
    expect(exchangeBrowseCategory(FURNISHING)).toBe('other');
  });
  it('has no Exchange browse subcategory', () => {
    expect(exchangeBrowseSubcategory(FURNISHING)).toBeNull();
  });
});

describe('furnishing presentation and input', () => {
  it('resolves the shared English kind label', () => {
    expect(itemKindLabel('furnishing')).toBe('Furnishing');
  });
  it('browses through exactly its own public market filter', () => {
    expect(marketItemMatches(ID, defaultMarketQuery())).toBe(true);
    expect(
      MARKET_ITEM_TYPE_FILTERS.filter(
        (itemType) =>
          itemType !== 'all' && marketItemMatches(ID, { ...defaultMarketQuery(), itemType }),
      ),
    ).toEqual(['furnishing']);
    expect(sanitizeMarketQuery({ itemType: 'furnishing' }).itemType).toBe('furnishing');
  });
  it('renders the literal furnishing browse chip label', () => {
    const window = MarketWindow.prototype as unknown as {
      marketItemTypeLabel: (kind: string) => string;
    };
    expect(window.marketItemTypeLabel('furnishing')).toBe('Furnishings');
  });
  it('respects furnishing market search and rarity while ignoring hidden equipment filters', () => {
    expect(
      marketItemMatches(ID, { ...defaultMarketQuery(), itemType: 'furnishing', search: 'missing' }),
    ).toBe(false);
    expect(
      marketItemMatches(ID, { ...defaultMarketQuery(), itemType: 'furnishing', rarity: 'epic' }),
    ).toBe(false);
    expect(
      marketItemMatches(ID, {
        ...defaultMarketQuery(),
        itemType: 'furnishing',
        search: 'Steel',
        rarity: 'rare',
        subtype: 'axe',
        armorClass: 'cloth',
        primaryStat: 'int',
      }),
    ).toBe(true);
  });
  it('hides unrelated market secondary menus', () => {
    expect(marketFilterMenus('furnishing')).toEqual({
      subtype: null,
      subtypeKind: null,
      armorClass: false,
      primaryStat: false,
    });
  });
  it('is reachable only through All in ordinary bags', () => {
    expect(BAG_CATEGORIES.filter((category) => matchesCategory(FURNISHING, category))).toEqual([
      'all',
    ]);
    expect(BAG_CATEGORIES).toEqual([
      'all',
      'weapon',
      'armor',
      'consumable',
      'material',
      'tool',
      'quest',
      'mount',
    ]);
  });
  it('retains normal bag search filtering in All', () => {
    const inventory = [{ itemId: ID, count: 1 }];
    expect(
      applyBagFilter(inventory, (id) => ITEMS[id], { ...DEFAULT_BAG_FILTER, search: 'Steel' }),
    ).toEqual(inventory);
    expect(
      applyBagFilter(inventory, (id) => ITEMS[id], { ...DEFAULT_BAG_FILTER, search: 'missing' }),
    ).toEqual([]);
  });
  it('uses a furnishing icon before the eel-name junk cascade', () => {
    expect(itemIconRecipe(ID)).toMatchObject({
      bg: 'wood',
      pal: 'earthBrown',
      prims: [{ p: 'crate' }],
    });
  });
  it('retains rarity effects on the furnishing icon', () => {
    expect(itemIconRecipe(ID).fx).toEqual(['glow']);
    ITEMS[ID] = { ...FURNISHING, quality: 'epic' };
    expect(itemIconRecipe(ID).fx).toEqual(['glow', 'sparkle']);
  });
  it('has no bag use hint', () => {
    expect(bagTooltipHintKey(FURNISHING, MODE)).toBe('');
    expect(bagTooltipHintKey(GEAR, MODE)).toBe('itemUi.tooltip.clickEquip');
  });
  it('has no ordinary bag click action', () => {
    expect(bagItemAction(FURNISHING, MODE)).toBe('none');
    expect(bagItemAction(GEAR, MODE)).toBe('use');
  });
  it('ordinary bag clicks invoke no command or repaint', () => {
    const call = vi.fn();
    const fake = { bagMode: () => MODE, deps: { world: call, showError: call }, render: call };
    const run = BagsWindow.prototype as unknown as {
      runBagAction: (
        item: ItemDef,
        slot: { itemId: string; count: number },
        ev: MouseEvent,
      ) => void;
    };
    run.runBagAction.call(fake, FURNISHING, { itemId: ID, count: 1 }, {} as MouseEvent);
    expect(call).not.toHaveBeenCalled();
    const useItem = vi.fn();
    const control = { itemId: TOOL.id, count: 1 };
    Object.assign(fake, { copyRefFor: () => ({ slotIndex: 0 }) });
    Object.assign(fake.deps, {
      world: () => ({ useItem, inventory: [control] }),
      useGatherTool: () => false,
      renderCharIfOpen: vi.fn(),
    });
    run.runBagAction.call(fake, TOOL, control, {} as MouseEvent);
    expect(useItem).toHaveBeenCalledWith(TOOL.id, { slotIndex: 0 });
  });
  it('keeps special bag storage and trading actions', () => {
    expect(bagItemAction(FURNISHING, { ...MODE, bankOpen: true, bankDeposit: true })).toBe(
      'bankDeposit',
    );
    expect(bagItemAction(FURNISHING, { ...MODE, tradeOpen: true })).toBe('trade');
    expect(bagItemAction(FURNISHING, { ...MODE, mailAttach: true })).toBe('mailAttach');
    expect(bagItemAction(FURNISHING, { ...MODE, marketSell: true })).toBe('marketSell');
  });
  it('has no bag capacity tooltip line', () => {
    expect(bagSlotsLineKey(FURNISHING)).toBeNull();
    expect(
      bagSlotsLineKey({
        kind: 'bag',
        bagSlots: 4,
      }),
    ).toBe('itemUi.tooltip.bagSlots');
  });
  it('offers only its lock toggle in the context menu', () => {
    expect(bagItemContextActions(FURNISHING, ID)).toEqual([
      { id: 'lock', labelKey: 'hudChrome.bags.lockItem' },
    ]);
    expect(bagItemNewActions(FURNISHING, ID, { locked: true })).toEqual(['unlock']);
    expect(bagItemContextActions(GEAR, GEAR.id)).toEqual([
      { id: 'default', labelKey: 'hudChrome.itemMenu.equip' },
      { id: 'disenchant', labelKey: 'hudChrome.itemMenu.disenchant' },
      { id: 'salvage', labelKey: 'hudChrome.itemMenu.salvage' },
      { id: 'lock', labelKey: 'hudChrome.bags.lockItem' },
    ]);
    expect(bagItemNewActions(GEAR, GEAR.id, { locked: true })).toEqual(['disenchant', 'unlock']);
  });
  it('cannot be dragged onto the paperdoll', () => {
    expect(isPaperdollDraggable(FURNISHING)).toBe(false);
    expect(isPaperdollDraggable(GEAR)).toBe(true);
  });
  it('rejects the paperdoll drop by literal action', () => {
    expect(paperdollDropAction(FURNISHING, 'mainhand', 'warrior', 20)).toBe('blockedSlot');
    expect(paperdollDropAction(GEAR, 'mainhand', 'warrior', 20)).toBe('equip');
  });
  it('uses ordinary rarity colors for item names', () => {
    for (const [quality, color] of [
      ['poor', '#9d9d9d'],
      ['common', '#ffffff'],
      ['uncommon', '#1eff00'],
      ['rare', '#0070dd'],
      ['epic', '#a335ee'],
      ['legendary', '#ff8000'],
    ] as const) {
      expect(itemNameColor({ ...FURNISHING, quality }), quality).toBe(color);
    }
    expect(itemNameColor({ ...FURNISHING, quality: undefined })).toBe('#ffffff');
    expect(itemNameColor({ ...FURNISHING, quality: 'constructor' })).toBe(
      'var(--color-quality-default)',
    );
  });
  it('uses ordinary rarity colors for market names', () => {
    expect(marketNameColor(FURNISHING.quality)).toBe('var(--mkt-name-rare)');
    expect(marketNameColor('common')).toBe('var(--mkt-name-common)');
    expect(marketNameColor(undefined)).toBe('var(--mkt-name-common)');
  });
  it('has no armor badge', () => {
    expect(marketArmorBadge(FURNISHING)).toBeNull();
    expect(
      marketArmorBadge({
        id: 'test_badge_control',
        name: 'Control Helm',
        kind: 'armor',
        armorType: 'mail',
        slot: 'helmet',
        sellValue: 1,
      }),
    ).toEqual({
      armorType: 'mail',
      labelKey: 'hudChrome.itemArmorType.mail',
    });
  });
  it('never presents a furnishing as heroic gear', () => {
    for (const def of [
      { ...FURNISHING, heroic: true },
      { ...FURNISHING, heroicOf: 'test_base' },
    ]) {
      expect(isHeroicItem(def)).toBe(false);
      expect(marketHeroicStar(def, 'Heroic')).toBe('');
      const control = { ...GEAR, heroic: def.heroic, heroicOf: def.heroicOf };
      expect(isHeroicItem(control)).toBe(true);
      expect(marketHeroicStar(control, 'Heroic')).toContain('aria-label="Heroic"');
    }
  });
  it('has no pattern mark', () => {
    expect(marketPatternMark(FURNISHING, 'Pattern')).toBe('');
    expect(
      marketPatternMark(
        {
          id: 'test_pattern_control',
          name: 'Control Pattern',
          kind: 'recipe',
          sellValue: 1,
          teachesRecipeId: 'test_recipe',
        },
        'Pattern',
      ),
    ).toContain('aria-label="Pattern"');
  });
  it('keeps malformed furnishing capabilities out of every UI action', () => {
    const def = {
      ...FURNISHING,
      slot: 'mainhand',
      armorType: 'mail',
      use: { type: 'fishing' },
      feast: { charges: 2 },
    } as unknown as ItemDef;
    ITEMS[ID] = def;
    expect(bagTooltipHintKey(def, MODE)).toBe('');
    expect(bagItemAction(def, MODE)).toBe('none');
    expect(bagItemNewActions(def, ID, undefined)).toEqual(['lock']);
    expect(isPaperdollDraggable(def)).toBe(false);
    expect(paperdollDropAction(def, 'mainhand', 'warrior', 20)).toBe('blockedSlot');
    expect(marketArmorBadge(def)).toBeNull();
    for (const use of [
      { type: 'fishing' },
      { type: 'gatherTool', professionId: 'mining', tier: 1 },
    ]) {
      ITEMS[ID] = { ...FURNISHING, use } as unknown as ItemDef;
      expect(bar().isAssignableAction(itemAction)).toBe(false);
      ITEMS[TOOL.id] = { ...TOOL, use } as ItemDef;
      expect(bar().isAssignableAction({ type: 'item', id: TOOL.id })).toBe(true);
    }
  });
  it('refuses action-bar assignment', () => {
    const controller = bar();
    expect(controller.isAssignableAction(itemAction)).toBe(false);
    expect(controller.actions).not.toContainEqual(itemAction);
    expect(controller.isAssignableAction({ type: 'item', id: TOOL.id })).toBe(true);
  });
  it('refuses direct bar replacement', () => {
    const controller = bar();
    controller.replaceActions([itemAction]);
    expect(controller.actions[0]).toBeNull();
    controller.replaceActions([{ type: 'item', id: TOOL.id }]);
    expect(controller.actions[0]).toEqual({ type: 'item', id: TOOL.id });
  });
  it('refuses loadout bar replacement', () => {
    const controller = bar();
    controller.replaceActionsForLoadout([itemAction], new Set(['sunder_armor']));
    expect(controller.actions[0]).toBeNull();
    controller.replaceActionsForLoadout([{ type: 'item', id: TOOL.id }], new Set(['sunder_armor']));
    expect(controller.actions[0]).toEqual({ type: 'item', id: TOOL.id });
  });
  it('refuses configurable attack-slot replacement', () => {
    const controller = bar();
    controller.replaceAttackAction(itemAction);
    expect(controller.attackAction).toBeNull();
    controller.replaceAttackAction({ type: 'item', id: TOOL.id });
    expect(controller.attackAction).toEqual({ type: 'item', id: TOOL.id });
  });
  it('drops a persisted furnishing attack action without disturbing the normal bar', () => {
    const key = 'woc_hotbar_warrior_FurnishingTester';
    const storage = new Map([
      [key, JSON.stringify([{ type: 'ability', id: 'sunder_armor' }])],
      [`${key}:s0`, JSON.stringify(itemAction)],
    ]);
    const controller = bar(storage);
    controller.init();
    expect(controller.attackAction).toBeNull();
    expect(controller.actions[0]).toEqual({ type: 'ability', id: 'sunder_armor' });
    expect(storage.has(`${key}:s0`)).toBe(false);
  });
  it('cleans persisted furnishings without moving a valid ability', () => {
    const key = 'woc_hotbar_warrior_FurnishingTester';
    const storage = new Map([
      [key, JSON.stringify([itemAction, { type: 'ability', id: 'sunder_armor' }])],
    ]);
    const controller = bar(storage);
    controller.init();
    expect(controller.actions[0]).toBeNull();
    expect(controller.actions[1]).toEqual({ type: 'ability', id: 'sunder_armor' });
  });
});

describe('furnishing Exchange consumer parity', () => {
  it.each(['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary', undefined] as const)(
    'keeps %s furnishings eligible through picker, staged trade and custody',
    (quality) => {
      ITEMS[ID] = { ...FURNISHING, quality, soulbound: true };
      const inventory = [{ itemId: ID, count: 1, instance: { ...SIGNED } }];
      expect(
        sellableRows(inventory, 'legendary', { mounts: true, mechChromas: false }).map(
          (row) => row.itemId,
        ),
      ).toEqual([ID]);
      expect(lockedOutRows(inventory, 'legendary', { mounts: true, mechChromas: false })).toEqual(
        [],
      );
      expect(sellableRows(inventory, 'common', { mounts: false, mechChromas: true })).toEqual([]);
      expect(wocTradableSlot(inventory[0], ITEMS)).toBe(true);
      expect(
        extractTradableCopy(inventory, { index: 0, itemId: ID, expectInstance: SIGNED }, ITEMS[ID]),
      ).toEqual({ ok: true, extracted: { itemId: ID, count: 1, instance: SIGNED } });
      expect(inventory).toEqual([]);
    },
  );

  it.each([
    {
      name: 'owner lock',
      instance: { ...SIGNED, locked: true },
      flags: {},
      reason: 'locked',
      unlockable: true,
    },
    {
      name: 'bound copy',
      instance: { ...SIGNED, boundTo: 9 },
      flags: {},
      reason: 'bound_copy',
      unlockable: false,
    },
    {
      name: 'armed bond',
      instance: { ...SIGNED, bindOnTrade: true },
      flags: {},
      reason: 'bind_armed',
      unlockable: false,
    },
    {
      name: 'market exclusion',
      instance: SIGNED,
      flags: { noMarketList: true },
      reason: 'no_market_list',
      unlockable: false,
    },
  ])('honors $name in picker, staged trade and custody with an eligible control', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const inventory = [{ itemId: ID, count: 1, instance: structuredClone(row.instance) }];
    const before = structuredClone(inventory);
    expect(sellableRows(inventory, 'epic', { mounts: true, mechChromas: true })).toEqual([]);
    expect(
      lockedOutRows(inventory, 'epic', { mounts: true, mechChromas: true }).map(
        (entry) => entry.itemId,
      ),
    ).toEqual(row.unlockable ? [ID] : []);
    expect(wocTradableSlot(inventory[0], ITEMS)).toBe(false);
    expect(extractTradableCopy(inventory, { index: 0, itemId: ID }, ITEMS[ID])).toEqual({
      ok: false,
      reason: row.reason,
    });
    expect(inventory).toEqual(before);
    ITEMS[ID] = structuredClone(FURNISHING);
    const eligible = [{ itemId: ID, count: 1, instance: { ...SIGNED } }];
    expect(
      sellableRows(eligible, 'epic', { mounts: true, mechChromas: true }).map(
        (entry) => entry.itemId,
      ),
    ).toEqual([ID]);
    expect(wocTradableSlot(eligible[0], ITEMS)).toBe(true);
    expect(extractTradableCopy(eligible, { index: 0, itemId: ID }, ITEMS[ID]).ok).toBe(true);
    expect(eligible).toEqual([]);
  });
});
