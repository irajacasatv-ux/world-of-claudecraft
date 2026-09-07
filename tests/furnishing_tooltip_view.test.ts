// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { FurnishingItemDef, ItemDef, ItemInstancePayload } from '../src/sim/types';
import { Hud } from '../src/ui/hud';
import {
  ACTION_BAR_ABILITY_SLOTS,
  ActionBarController,
} from '../src/ui/hud/action_bar/action_bar_controller';
import { HOTBAR_ACTION_MIME, type HotbarAction } from '../src/ui/hud/action_bar/hotbar';
import { furnishingTooltipLines, furnishingTooltipRows } from '../src/ui/hud/housing';
import { setLanguage } from '../src/ui/i18n';
import { hudChromeStrings } from '../src/ui/i18n.catalog/hud_chrome';
import { makeWriterFacet } from '../src/ui/painter_host';
import { FURNISHING } from './fixtures/furnishing_item';

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

function composedTooltip(item: ItemDef, instance?: ItemInstancePayload): string {
  const hud = Object.create(Hud.prototype) as {
    itemTooltip(item: ItemDef, compare: boolean, instance?: ItemInstancePayload): string;
  };
  return hud.itemTooltip(item, false, instance);
}

afterEach(() => setLanguage('en'));

describe('furnishingTooltipRows', () => {
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
