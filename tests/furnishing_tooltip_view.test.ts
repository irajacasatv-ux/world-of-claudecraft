// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { PlayerEquipment, PlayerEquipmentInstances } from '../src/sim/entity';
import { Sim } from '../src/sim/sim';
import type { FurnishingItemDef, ItemDef, ItemInstancePayload } from '../src/sim/types';
import { charStatModel } from '../src/ui/char_stat_model_core';
import { Hud } from '../src/ui/hud';
import {
  ACTION_BAR_ABILITY_SLOTS,
  ActionBarController,
} from '../src/ui/hud/action_bar/action_bar_controller';
import { HOTBAR_ACTION_MIME, type HotbarAction } from '../src/ui/hud/action_bar/hotbar';
import { furnishingTooltipLines, furnishingTooltipRows } from '../src/ui/hud/housing';
import { buildPlayerCardData } from '../src/ui/hud/player_card/player_card_data';
import { setLanguage } from '../src/ui/i18n';
import { hudChromeStrings } from '../src/ui/i18n.catalog/hud_chrome';
import { itemTooltipHtml } from '../src/ui/item_tooltip_view';
import { makeWriterFacet } from '../src/ui/painter_host';
import type { StatId, StatTooltipModel } from '../src/ui/stat_tooltip';
import type { IWorld } from '../src/world_api';
import { FURNISHING } from './fixtures/furnishing_item';
import { EMPTY_TEST_WORLD } from './sim_shared';

// The tooltip and action-bar paths do not render character previews. Keep the
// real HUD methods while avoiding unrelated GLB preloads in the DOM test host.
vi.mock('../src/render/characters', () => ({ CharacterPreview: class {} }));
vi.mock('../src/render/characters/assets', () => ({ preloadMechAssets: vi.fn() }));
vi.mock('../src/render/characters/portrait', () => ({
  onPortraitsReady: vi.fn(),
  onPortraitUpdate: vi.fn(),
  playerPortraitDataUrl: vi.fn(),
  portraitsReady: vi.fn(() => false),
  visualPortraitDataUrl: vi.fn(),
}));

const furnishing: FurnishingItemDef = {
  id: 'probe_furnishing_tooltip',
  name: 'Tooltip Test Furnishing',
  kind: 'furnishing',
  quality: 'rare',
  sellValue: 0,
  furnishing: {
    footprint: { width: 2, depth: 3 },
    r: 0,
    decorCost: 7,
    surface: 'floor',
  },
};

// The composed item card (src/ui/item_tooltip_view.ts) over a real world, with
// the Show Item Level setting off (the value the old Hud prototype rig read).
// Only the action-bar drag and chat-link cases below still need the Hud.
function composedTooltip(
  item: ItemDef,
  instance?: ItemInstancePayload,
  world?: IWorld,
  compare = false,
): string {
  const tooltipWorld =
    world ??
    new Sim({
      seed: 42,
      playerClass: 'warrior',
      autoEquip: false,
      world: EMPTY_TEST_WORLD,
    });
  return itemTooltipHtml(
    item,
    { world: tooltipWorld, showItemLevel: () => false },
    compare,
    instance,
  );
}

afterEach(() => setLanguage('en'));

describe('furnishingTooltipRows', () => {
  it('has no runtime import closure, DOM, Three, or localization runtime access', () => {
    const source = readFileSync('src/ui/hud/housing/furnishing_tooltip_view.ts', 'utf8');
    const runtime = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        removeComments: true,
      },
    }).outputText;
    expect(runtime).toContain('export function furnishingTooltipRows(');
    expect(runtime).not.toMatch(
      /\b(?:import|require|document|window|navigator|globalThis|localStorage|sessionStorage|THREE)\b/,
    );
  });

  it('footprint uses the literal key, resolved dimensions, and approved English', () => {
    expect(furnishingTooltipRows(furnishing)[0]).toEqual({
      key: 'hudChrome.housing.furnishing.footprint',
      values: { width: 2, depth: 3 },
    });
    expect(hudChromeStrings.housing.furnishing.footprint).toBe(
      'Footprint: {width} by {depth} cells.',
    );
    const wider: FurnishingItemDef = {
      ...furnishing,
      furnishing: { ...furnishing.furnishing, footprint: { width: 5, depth: 8 } },
    };
    expect(furnishingTooltipRows(wider)[0].values).toEqual({ width: 5, depth: 8 });
  });

  it('decor cost uses the literal key, resolved cost, and approved English', () => {
    expect(furnishingTooltipRows(furnishing)[1]).toEqual({
      key: 'hudChrome.housing.furnishing.decorCost',
      values: { cost: 7 },
    });
    expect(hudChromeStrings.housing.furnishing.decorCost).toBe('Decor cost: {cost}.');
    const free: FurnishingItemDef = {
      ...furnishing,
      furnishing: { ...furnishing.furnishing, decorCost: 0 },
    };
    expect(furnishingTooltipRows(free)[1].values).toEqual({ cost: 0 });
  });

  it('floor surface uses the literal key, no interpolations, and approved English', () => {
    expect(furnishingTooltipRows(furnishing)[2]).toEqual({
      key: 'hudChrome.housing.furnishing.surfaceFloor',
      values: {},
    });
    expect(hudChromeStrings.housing.furnishing.surfaceFloor).toBe('Placed on the floor.');
  });

  it('maker uses the literal key, copy signer, and approved English', () => {
    expect(furnishingTooltipRows(furnishing, { signer: 'Anna' })[3]).toEqual({
      key: 'hudChrome.housing.furnishing.maker',
      values: { maker: 'Anna' },
    });
    expect(hudChromeStrings.housing.furnishing.maker).toBe('Made by {maker}.');
    expect(furnishingTooltipRows(furnishing, { signer: 'Bryn' })[3].values).toEqual({
      maker: 'Bryn',
    });
  });

  it('unsigned copies have only the three placement rows', () => {
    expect(furnishingTooltipRows(furnishing)).toHaveLength(3);
    expect(furnishingTooltipRows(furnishing, {})).toHaveLength(3);
    expect(furnishingTooltipRows(furnishing, { signer: '' })).toHaveLength(3);
  });

  it('definition provenance never supplies or overrides a copy maker', () => {
    const defWithSigner: FurnishingItemDef & { signer: string } = {
      ...furnishing,
      signer: 'Definition Author',
    };
    expect(furnishingTooltipRows(defWithSigner)).toHaveLength(3);
    expect(furnishingTooltipRows(defWithSigner, { signer: 'Copy Maker' })[3]).toEqual({
      key: 'hudChrome.housing.furnishing.maker',
      values: { maker: 'Copy Maker' },
    });
  });

  it('other item kinds stay silent even with a signer', () => {
    const kinds = new Map(
      Object.values(ITEMS)
        .filter((def) => def.kind !== 'furnishing')
        .map((def) => [def.kind, def]),
    );
    expect([...kinds.keys()].sort()).toEqual([
      'armor',
      'bag',
      'drink',
      'elixir',
      'flask',
      'food',
      'held_offhand',
      'junk',
      'mount',
      'potion',
      'quest',
      'recipe',
      'scroll',
      'tool',
      'weapon',
    ]);
    for (const def of kinds.values()) {
      expect(furnishingTooltipRows(def, { signer: 'Anna' }), def.kind).toEqual([]);
      expect(furnishingTooltipLines(def, { signer: 'Anna' }), def.kind).toBe('');
    }
    const ordinary: ItemDef = {
      id: 'probe_junk_tooltip',
      name: 'Test Junk',
      kind: 'junk',
      sellValue: 0,
    };
    expect(furnishingTooltipRows(ordinary, { signer: 'Anna' })).toEqual([]);
    expect(furnishingTooltipLines(ordinary, { signer: 'Anna' })).toBe('');
  });
});

describe('furnishing tooltip composition', () => {
  const gear: Extract<ItemDef, { kind: 'armor' }> = {
    id: 'probe_furnishing_tooltip_gear',
    name: 'Tooltip Test Armor',
    kind: 'armor',
    slot: 'chest',
    armorType: 'mail',
    quality: 'rare',
    sellValue: 0,
  };
  const powerCopies: { name: string; instance: ItemInstancePayload; claim: string }[] = [
    {
      name: 'legacy rolled combat stats',
      instance: { rolled: { stats: { str: 50 } } },
      claim: '+50 Strength (Enchanted)',
    },
    {
      name: 'masterwork seal and rolled stats',
      instance: { rolled: { stats: { str: 9 }, masterwork: true } },
      claim: 'Masterwork',
    },
    { name: 'Perfected stamp', instance: { perfected: true }, claim: 'Perfected' },
    {
      name: 'promoted copy name and quality',
      instance: { perfected: true, name: '<Forged Name>', rolled: { quality: 'legendary' } },
      claim: '&lt;Forged Name&gt;',
    },
    {
      name: 'Perfecting progress',
      instance: { perfecting: 2 },
      claim: 'Perfecting: rank 2 of 4',
    },
    {
      name: 'enchant bonus',
      instance: { enchant: 'enchant_chest_stamina', rolled: { stats: { sta: 4 } } },
      claim: '+4 Stamina (Enchanted)',
    },
    {
      name: 'Rift power and upgrade metadata',
      instance: {
        rolled: { stats: { str: 50 } },
        rift: {
          sourceEventId: 'tooltip_rift_probe',
          tier: 'A',
          power: 10,
          upgradeLevel: 2,
          maxUpgradeLevel: 6,
          baseStats: { str: 50 },
          gemSlots: 2,
          gems: ['probe_gem'],
        },
      },
      claim: 'Rift upgrade 2/6',
    },
  ];

  it.each(powerCopies)(
    'HUD refuses $name claims on furnishing while eligible gear keeps them',
    ({ instance, claim }) => {
      const copy: ItemInstancePayload = { signer: '<Maker>', locked: true, ...instance };
      const before = structuredClone(copy);
      const expected = composedTooltip(furnishing, { signer: '<Maker>', locked: true });
      const html = composedTooltip(furnishing, copy);
      expect(composedTooltip(gear, copy)).toContain(claim);
      expect(html).toBe(expected);
      expect(html).toContain('Made by &lt;Maker&gt;.');
      expect(html).toContain('Locked');
      expect(html).not.toContain(claim);
      expect(copy).toEqual(before);
    },
  );

  it.each(['heroic', 'heroicOf'] as const)(
    'HUD refuses the inherited %s tag on a furnishing while gear retains it',
    (field) => {
      const extra = field === 'heroic' ? { heroic: true } : { heroicOf: 'eastbrook_arming_sword' };
      const item: FurnishingItemDef = { ...furnishing, ...extra };
      expect(composedTooltip({ ...gear, ...extra })).toContain('[HEROIC]');
      expect(composedTooltip(item)).toBe(composedTooltip(furnishing));
    },
  );

  it('HUD refuses malformed furnishing equipment and consumable capabilities without changing source data', () => {
    const malformed = {
      ...furnishing,
      slot: 'mainhand',
      armorType: 'mail',
      weapon: { min: 17, max: 29, speed: 2 },
      stats: { str: 61, armor: 84 },
      spellPower: 73,
      healPower: 79,
      hitRating: 83,
      hasteRating: 89,
      critRating: 97,
      pvpOffenseRating: 101,
      pvpDefenseRating: 101,
      foodHp: 103,
      drinkMana: 107,
      potionHp: 109,
      potionHpPctMax: 0.23,
      potionMana: 113,
      elixir: { aura: 'Tooltip Test Buff', kind: 'buff_ap', value: 127, duration: 3600 },
      use: { type: 'hearth' },
      stackSize: 20,
      bagSlots: 12,
      set: 'slagbreaker',
      masterwrought: true,
    } as unknown as ItemDef;
    const before = structuredClone(malformed);
    expect(composedTooltip({ ...gear, stats: { str: 61, armor: 84 } })).toContain('+61 Strength');
    const food: ItemDef = {
      id: 'probe_furnishing_tooltip_food',
      name: 'Tooltip Test Food',
      kind: 'food',
      foodHp: 103,
      sellValue: 0,
    };
    expect(composedTooltip(food)).toContain('103 health');
    const html = composedTooltip(malformed);
    expect(html).toBe(composedTooltip(furnishing));
    expect(html).toContain('Footprint: 2 by 3 cells.');
    expect(html).toContain('Decor cost: 7.');
    expect(html).not.toMatch(/Strength|Armor|Power|Rating|Use:|Masterwrought|Slagbreaker|damage/);
    expect(malformed).toEqual(before);
  });

  it('HUD retains genuine soulbound, copy lock, maker and party-trade facts', () => {
    const item: FurnishingItemDef = { ...furnishing, soulbound: true };
    const copy: ItemInstancePayload = {
      signer: '<Maker>',
      locked: true,
      partyTrade: { untilMs: 60000, eligible: ['Maker'] },
      rolled: { stats: { str: 50 }, masterwork: true },
      perfected: true,
    };
    const html = composedTooltip(item, copy);
    expect(html).toContain('Soulbound');
    expect(html).toContain('Locked');
    expect(html).toContain('Made by &lt;Maker&gt;.');
    expect(html).toContain('1 minute');
    expect(html).not.toContain('Masterwork');
    expect(html).not.toContain('Perfected');
    expect(html).not.toContain('Strength');
  });

  it.each([
    { untilMs: 60000, duration: '1 minute' },
    { untilMs: 3600000, duration: '1 hour' },
  ])(
    'furnishing custody text preserves $duration without an impossible equip instruction',
    ({ untilMs, duration }) => {
      const copy: ItemInstancePayload = { partyTrade: { untilMs, eligible: ['Maker'] } };
      const sentence = `You may trade this item to players who shared its drop for the next ${duration}.`;
      // The trade window qualifies a bind-on-pickup drop, so both cards are soulbound.
      const html = composedTooltip({ ...furnishing, soulbound: true }, copy);
      expect(html).toContain(`${sentence}</div>`);
      expect(html).not.toContain('Equipping it ends the trade window.');
      expect(composedTooltip({ ...gear, soulbound: true }, copy)).toContain(
        `${sentence} Equipping it ends the trade window.`,
      );
      // A marker left on a drop that is no longer soulbound promises nothing, on
      // either card (the gear card's def gate, mirrored on the furnishing card).
      expect(composedTooltip(furnishing, copy)).not.toContain('You may trade this item');
      expect(composedTooltip(gear, copy)).not.toContain('You may trade this item');
    },
  );

  it.each([0, -1])('expired furnishing party-trade deadline %s has no trade promise', (untilMs) => {
    const copy: ItemInstancePayload = { partyTrade: { untilMs, eligible: ['Maker'] } };
    // Soulbound, so the def gate is open and the expired deadline alone refuses.
    expect(composedTooltip({ ...furnishing, soulbound: true }, copy)).not.toContain(
      'You may trade this item',
    );
    expect(composedTooltip({ ...gear, soulbound: true }, copy)).not.toContain(
      'You may trade this item',
    );
  });

  it('HUD retains authored furnishing rarity and vendor value with no invented placement metadata', () => {
    const item: FurnishingItemDef = {
      ...furnishing,
      quality: 'epic',
      sellValue: 12345,
      furnishing: { ...furnishing.furnishing, footprint: { width: 5, depth: 8 }, decorCost: 0 },
    };
    const html = composedTooltip(item, { rolled: { quality: 'legendary' } });
    expect(html).toContain('Epic Furnishing');
    expect(html).not.toContain('Legendary');
    expect(html).toContain('Sell price: 1g 23s 45c');
    expect(html).toContain('Footprint: 5 by 8 cells.');
    expect(html).toContain('Decor cost: 0.');
    expect(composedTooltip({ ...item, noVendorSell: true })).not.toContain('Sell price:');
    expect(composedTooltip({ ...item, soulbound: true })).not.toContain('Sell price:');
  });

  it('renders ordered English lines with formatted resolved numbers', () => {
    const large: FurnishingItemDef = {
      ...furnishing,
      furnishing: {
        ...furnishing.furnishing,
        footprint: { width: 1250, depth: 2500 },
        decorCost: 12345,
      },
    };
    expect(furnishingTooltipLines(large, { signer: 'Anna' })).toBe(
      '<div class="tt-desc">Footprint: 1,250 by 2,500 cells.</div>' +
        '<div class="tt-desc">Decor cost: 12,345.</div>' +
        '<div class="tt-desc">Placed on the floor.</div>' +
        '<div class="tt-desc">Made by Anna.</div>',
    );
  });

  it('escapes a hostile signer at the thin composer seam', () => {
    const html = furnishingTooltipLines(furnishing, { signer: '<img src=x>&"' });
    expect(html).toContain('<div class="tt-desc">Made by &lt;img src=x&gt;&amp;&quot;.</div>');
    expect(html).not.toContain('<img');
  });

  it('HUD renders one escaped maker and preserves the copy lock line', () => {
    const html = composedTooltip(furnishing, { signer: '<Maker>', locked: true });
    expect(html).toContain('<div class="tt-desc">Footprint: 2 by 3 cells.</div>');
    expect(html).toContain('<div class="tt-desc">Decor cost: 7.</div>');
    expect(html).toContain('<div class="tt-desc">Placed on the floor.</div>');
    expect(html).toContain('Made by &lt;Maker&gt;.');
    expect(html.match(/&lt;Maker&gt;/g)).toHaveLength(1);
    expect(html).toContain('Locked');
    expect(html).not.toContain('Crafted by');
    expect(html).not.toContain('tt-makers-mark');
    expect(html).not.toContain('<Maker>');
  });

  it('HUD retains the extracted mount description, mobility and summon instruction', () => {
    const html = composedTooltip(ITEMS.reins_valorsteed);
    expect(html).toContain(
      '<div class="tt-desc">A hardy, sure-footed steed that provides enhanced travel speed.</div>',
    );
    expect(html).toContain('<div class="tt-green">+60% extra mobility</div>');
    expect(html).toContain('<div class="tt-sub">Use to summon this mount.</div>');
    expect(html).not.toContain('Footprint:');
  });

  it('HUD preserves crafted attribution on signed gear', () => {
    const html = composedTooltip(ITEMS.eastbrook_arming_sword, { signer: 'Anna' });
    expect(html).toContain('Crafted by Anna');
    expect(html).toContain('tt-makers-mark');
    expect(html).not.toContain('Made by');
  });

  it('HUD preserves gathered attribution for other signed item kinds', () => {
    const ordinary: ItemDef = {
      id: 'probe_junk_tooltip',
      name: 'Test Junk',
      kind: 'junk',
      sellValue: 0,
    };
    const html = composedTooltip(ordinary, { signer: 'Anna', locked: true });
    expect(html).toContain('Gathered by Anna');
    expect(html).not.toContain('Crafted by');
    expect(html).not.toContain('tt-makers-mark');
    expect(html).toContain('Locked');
    expect(html).not.toContain('Made by');
    expect(html).not.toContain('Footprint:');
  });
});

describe('loaded furnishings in equipment display projections', () => {
  const armor: Extract<ItemDef, { kind: 'armor' }> = {
    id: 'probe_furnishing_hover_armor',
    name: 'Tooltip Armor Control',
    kind: 'armor',
    armorType: 'mail',
    slot: 'chest',
    stats: { str: 10 },
    sellValue: 0,
  };
  const weapon: Extract<ItemDef, { kind: 'weapon' }> = {
    id: 'probe_furnishing_display_weapon',
    name: 'Tooltip Weapon Control',
    kind: 'weapon',
    slot: 'mainhand',
    weapon: { min: 14, max: 28, speed: 2 },
    stats: { str: 17 },
    spellPower: 23,
    sellValue: 0,
  };
  const previous = new Map<string, ItemDef | undefined>();
  beforeEach(() => {
    for (const item of [furnishing, armor, weapon]) {
      previous.set(item.id, ITEMS[item.id]);
      ITEMS[item.id] = item;
    }
  });
  afterEach(() => {
    for (const [id, item] of previous) {
      if (item === undefined) delete ITEMS[id];
      else ITEMS[id] = item;
    }
    previous.clear();
  });

  function loaded(equipment: PlayerEquipment, instances: PlayerEquipmentInstances = {}): Sim {
    const sim = new Sim({
      seed: 42,
      playerClass: 'warrior',
      autoEquip: false,
      world: EMPTY_TEST_WORLD,
    });
    const state = sim.serializeCharacter(sim.playerId);
    if (!state) throw new Error('Tooltip fixture character state is missing');
    state.equipment = structuredClone(equipment);
    state.equipmentInstance = structuredClone(instances);
    sim.primaryId = sim.addPlayer('warrior', 'Tooltip Reader', { state, autoEquip: false });
    return sim;
  }

  // The live-world stat bridge moved out of Hud into char_stat_model_core at
  // the 2026-09-26 release sync; the furnishing guard moved with it.
  function statModel(world: IWorld, stat: StatId): StatTooltipModel {
    return charStatModel(world, stat);
  }

  it('the actual armor hover compares against zero furnishing power and keeps real gear deltas', () => {
    const copy: ItemInstancePayload = { rolled: { stats: { str: 100 } } };
    const world = loaded({ chest: furnishing.id }, { chest: copy });
    const html = composedTooltip(armor, undefined, world, true);
    expect(html).toContain('<div class="tt-green">+10 Strength</div>');
    expect(html).not.toContain('90 Strength');
    expect(html).not.toContain('100 Strength');
    expect(world.equipment.chest).toBe(furnishing.id);
    expect(world.equipmentInstances.chest).toEqual(copy);
    const control = loaded({ chest: armor.id }, { chest: copy });
    // A distinct candidate keeps the real gear delta active; the same-id
    // non-Rift hover deliberately suppresses self-comparison.
    const candidate = { ...armor, id: 'probe_furnishing_hover_candidate' };
    expect(composedTooltip(candidate, undefined, control, true)).toContain(
      '<div class="tt-red">−100 Strength</div>',
    );
    expect(composedTooltip(furnishing, copy, world, true)).not.toContain('If you equip');
  });

  it('stat hover sources and DPS reflect the loaded combat state while real weapons remain active', () => {
    ITEMS[furnishing.id] = {
      ...furnishing,
      weapon: weapon.weapon,
      stats: weapon.stats,
      spellPower: weapon.spellPower,
      healPower: 31,
    } as unknown as ItemDef;
    const world = loaded({ mainhand: furnishing.id });
    expect(world.player.weapon).toEqual({ min: 1, max: 2, speed: 2 });
    expect(statModel(world, 'str').sources.filter((source) => source.kind === 'gear')).toEqual([]);
    expect(
      statModel(world, 'spellPower').sources.filter((source) => source.kind === 'gear'),
    ).toEqual([]);
    // The release's Healing Power cell reads gear healPower too; a forged
    // furnishing adds no line there either.
    expect(
      statModel(world, 'healPower').sources.filter((source) => source.kind === 'gear'),
    ).toEqual([]);
    expect(statModel(world, 'dps').statValue - world.player.attackPower / 14).toBeCloseTo(0.75);
    const control = loaded({ mainhand: weapon.id });
    expect(statModel(control, 'str').sources).toContainEqual({ kind: 'gear', value: 17 });
    expect(statModel(control, 'spellPower').sources).toContainEqual({ kind: 'gear', value: 23 });
    expect(statModel(control, 'dps').statValue - control.player.attackPower / 14).toBeCloseTo(10.5);
  });

  it('the player card reports fist DPS for loaded furnishing while real weapon DPS remains visible', () => {
    ITEMS[furnishing.id] = { ...furnishing, weapon: weapon.weapon } as unknown as ItemDef;
    const world = loaded({ mainhand: furnishing.id });
    const card = (sim: IWorld) =>
      buildPlayerCardData(sim, {
        characterImage: 'data:image/png;base64,test',
        referral: null,
        standing: null,
        balance: null,
        showDevBadges: false,
        slotName: (slot) => slot,
      });
    expect(card(world).combatStats).toContainEqual({
      label: 'Damage/sec',
      value: (0.75 + world.player.attackPower / 14).toFixed(1),
    });
    const control = loaded({ mainhand: weapon.id });
    expect(card(control).combatStats).toContainEqual({
      label: 'Damage/sec',
      value: (10.5 + control.player.attackPower / 14).toFixed(1),
    });
    expect(world.equipment.mainhand).toBe(furnishing.id);
  });
});

describe('furnishing drops through the live HUD action-bar handlers', () => {
  it.each([
    { name: 'normal slot, external bag payload', slot: 2, source: 'external' },
    { name: 'normal slot, stale attack drag', slot: 2, source: 'attack' },
    { name: 'freed attack slot, external bag payload', slot: 0, source: 'external' },
    { name: 'freed attack slot, stale normal drag', slot: 0, source: 'normal' },
  ] as const)('refuses $name without saving or moving other actions', ({ slot, source }) => {
    const previousDef = ITEMS[FURNISHING.id];
    ITEMS[FURNISHING.id] = FURNISHING;
    const root = document.createElement('div');
    root.innerHTML =
      '<div id="actionbar"></div><div id="actionbar2"></div><div id="actionbar3"></div>';
    document.body.append(root);
    try {
      const values = new Map<string, string>();
      const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: vi.fn((key: string, value: string) => {
          values.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          values.delete(key);
        }),
      };
      const sendLayout = vi.fn();
      const settingsWrite = vi.fn();
      const controller = new ActionBarController({
        storage,
        playerClass: 'warrior',
        playerName: 'FurnishingDropTester',
        playerLevel: () => 20,
        talentSpec: () => null,
        knownAbilityIds: () => ['sunder_armor'],
        hasAura: () => false,
        showAttackButton: () => false,
        persistLayout: sendLayout,
      });
      controller.init();
      const actions: HotbarAction[] = Array.from({ length: ACTION_BAR_ABILITY_SLOTS }, () => null);
      actions[0] = { type: 'ability', id: 'sunder_armor' };
      actions[1] = { type: 'item', id: 'reins_valorsteed' };
      controller.replaceActions(actions);
      controller.replaceAttackAction({ type: 'ability', id: 'sunder_armor' });
      controller.saveActions();
      controller.saveAttackAction();
      const noop = () => {};
      const runtimeHud = Object.assign(Object.create(Hud.prototype), {
        actionBarController: controller,
        abilityButtons: [],
        actionbarEl: root.querySelector('#actionbar'),
        keybinds: { primaryLabel: () => '' },
        sim: { known: [] },
        optionsHooks: { settings: { get: () => false, set: settingsWrite } },
        writerFacet: makeWriterFacet(
          new WeakMap(),
          new WeakMap(),
          new WeakMap(),
          new WeakMap(),
          noop,
          noop,
        ),
        bindEmpoweredActionHold: noop,
        attachTooltip: noop,
        hideTooltip: noop,
        buildMobileActionRing: noop,
        buildMobileConsumableSeat: noop,
        buildStanceBar: noop,
        dragAction: null,
      }) as {
        buildActionBar(): void;
        abilityButtons: { btn: HTMLButtonElement }[];
        dragAction: {
          action: Exclude<HotbarAction, null>;
          sourceIndex: number | null;
          sourceAttackSlot?: boolean;
        } | null;
      };
      runtimeHud.buildActionBar();
      const target = runtimeHud.abilityButtons[slot].btn;
      const dispatch = (kind: 'dragover' | 'drop', action: Exclude<HotbarAction, null>): Event => {
        const event = new Event(kind, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
          value: {
            types: [HOTBAR_ACTION_MIME],
            getData: (mime: string) => (mime === HOTBAR_ACTION_MIME ? JSON.stringify(action) : ''),
            dropEffect: 'none',
          },
        });
        target.dispatchEvent(event);
        return event;
      };
      const resetCalls = () => {
        storage.setItem.mockClear();
        storage.removeItem.mockClear();
        sendLayout.mockClear();
        settingsWrite.mockClear();
      };
      resetCalls();
      const before = {
        actions: structuredClone(controller.actions),
        attack: structuredClone(controller.attackAction),
        storage: [...values],
      };
      const rejected: Exclude<HotbarAction, null> = { type: 'item', id: FURNISHING.id };
      if (source !== 'external') {
        // A stale or malformed in-memory drag must be refused before it can
        // clear the valid source slot or configured attack action.
        runtimeHud.dragAction = {
          action: rejected,
          sourceIndex: source === 'normal' ? 0 : null,
          sourceAttackSlot: source === 'attack',
        };
      }
      expect(dispatch('dragover', rejected).defaultPrevented).toBe(false);
      expect(target.classList.contains('drop-target')).toBe(false);
      dispatch('drop', rejected);
      expect(controller.actions).toEqual(before.actions);
      expect(controller.actions[0]).toEqual({ type: 'ability', id: 'sunder_armor' });
      expect(controller.actions[1]).toEqual({ type: 'item', id: 'reins_valorsteed' });
      expect(controller.attackAction).toEqual(before.attack);
      expect([...values]).toEqual(before.storage);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.removeItem).not.toHaveBeenCalled();
      expect(sendLayout).not.toHaveBeenCalled();
      expect(settingsWrite).not.toHaveBeenCalled();

      // Positive control: the same mounted listeners accept and save an
      // eligible item, so the rejected drop's silence cannot be a dead fixture.
      runtimeHud.dragAction = null;
      const accepted: Exclude<HotbarAction, null> = { type: 'item', id: 'reins_valorsteed' };
      expect(dispatch('dragover', accepted).defaultPrevented).toBe(true);
      expect(target.classList.contains('drop-target')).toBe(true);
      dispatch('drop', accepted);
      expect(storage.setItem).toHaveBeenCalled();
      expect(sendLayout).toHaveBeenCalled();
      expect(target.classList.contains('drop-target')).toBe(false);
    } finally {
      root.remove();
      if (previousDef === undefined) delete ITEMS[FURNISHING.id];
      else ITEMS[FURNISHING.id] = previousDef;
    }
  });
});

describe('furnishing chat item links', () => {
  function linkText(itemId: string, instance?: ItemInstancePayload): string {
    const hud = Object.create(Hud.prototype) as {
      attachTooltip: () => void;
      appendChatItemLink(parent: HTMLElement, id: string, copy?: ItemInstancePayload): void;
    };
    hud.attachTooltip = () => {};
    const parent = document.createElement('div');
    hud.appendChatItemLink(parent, itemId, instance);
    return parent.textContent ?? '';
  }

  it('never names a forged loot-quality tier on a furnishing link', () => {
    const rolled: ItemInstancePayload = {
      lootQuality: { version: 1, tier: 4, weights: [4, 900, 200, 6, 7] },
    };
    const previous = ITEMS[FURNISHING.id];
    ITEMS[FURNISHING.id] = FURNISHING;
    try {
      expect(linkText(FURNISHING.id, rolled)).toBe(linkText(FURNISHING.id));
      // Control: the same roll on real gear does change the link's name.
      expect(linkText('worn_sword', rolled)).not.toBe(linkText('worn_sword'));
    } finally {
      if (previous === undefined) delete ITEMS[FURNISHING.id];
      else ITEMS[FURNISHING.id] = previous;
    }
  });
});
