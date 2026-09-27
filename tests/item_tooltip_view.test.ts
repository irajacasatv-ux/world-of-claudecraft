// The composed item card (src/ui/item_tooltip_view.ts), extracted from
// Hud.itemTooltip. What each line of the card says is pinned by the suites of
// the builders it composes (weapon_type_tooltip, masterwrought_tooltip,
// rift_band_tooltip, item_kind_line, the *_tooltip_view suites and their
// method-scoped source pins); this suite pins the seam itself: the deps
// contract (the Show Item Level thunk is read lazily, only where the readout is
// eligible, and the comparison renders the worn card through the SAME deps),
// the shared quest progress text, and the Hud half of the seam (the thin
// delegator hands its own world and the right setting key through).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { ItemInstancePayload } from '../src/sim/types';
import { t } from '../src/ui/i18n';
import { itemNumber } from '../src/ui/item_instance_tooltip';
import { itemTooltipHtml, questProgressText } from '../src/ui/item_tooltip_view';
import { itemLevelReadout } from '../src/ui/rift_band_tooltip';
import { itemTooltipDeps } from './helpers/item_tooltip_deps';

// Two item-level-eligible helmets (each has a drop-source item level), so the
// hovered card and the worn card in its comparison both reach the readout.
const HOVERED = ITEMS.boundstone_helm;
const WORN = ITEMS.cryptbone_helm;

function depsWithSpy(equipment: Record<string, string> = {}) {
  const deps = itemTooltipDeps({ world: { equipment, equipmentInstances: {} } });
  const showItemLevel = vi.fn(() => true);
  return { deps: { ...deps, showItemLevel }, showItemLevel };
}

describe('itemTooltipHtml deps contract', () => {
  it('reads the Show Item Level setting only for an eligible item, once per card', () => {
    expect(HOVERED?.slot).toBe('helmet');
    expect(WORN?.slot).toBe('helmet');
    const { deps, showItemLevel } = depsWithSpy();
    const html = itemTooltipHtml(HOVERED, deps, false);
    expect(showItemLevel).toHaveBeenCalledTimes(1);
    // The thunk's answer is what gates the readout.
    expect(html).toContain(t('hudChrome.options.itemLevelLine', { level: '23' }));
    showItemLevel.mockReturnValue(false);
    expect(itemTooltipHtml(HOVERED, deps, false)).not.toContain(
      t('hudChrome.options.itemLevelLine', { level: '23' }),
    );

    // A sourceless consumable is never eligible: the setting is not read at all.
    showItemLevel.mockClear();
    itemTooltipHtml(ITEMS.minor_healing_potion, deps, false);
    expect(showItemLevel).not.toHaveBeenCalled();
  });

  it('a quality-rolled copy shows the readout without reading the setting', () => {
    // The badge's legend: a lootQuality copy ALWAYS shows its level, so the
    // optional setting is short-circuited, never consulted.
    const { deps, showItemLevel } = depsWithSpy();
    showItemLevel.mockReturnValue(false);
    const copy: ItemInstancePayload = {
      lootQuality: { version: 1, tier: 2, weights: [4, 900, 200, 6, 7] },
    };
    const html = itemTooltipHtml(HOVERED, deps, false, copy);
    expect(showItemLevel).not.toHaveBeenCalled();
    const readout = itemLevelReadout(HOVERED, copy);
    expect(readout).toBeDefined();
    expect(html).toContain(
      t('hudChrome.options.itemLevelLine', { level: itemNumber(readout?.level as number) }),
    );
  });

  it('renders the worn comparison card through the same deps (one read per card)', () => {
    const { deps, showItemLevel } = depsWithSpy({ helmet: WORN.id });
    const withCompare = itemTooltipHtml(HOVERED, deps, true);
    // Hovered card plus the worn card, each reading the setting through the
    // one deps object: the recursion does not mint its own.
    expect(showItemLevel).toHaveBeenCalledTimes(2);
    expect(withCompare).toContain(t('hudChrome.options.itemLevelLine', { level: '11' }));
    showItemLevel.mockClear();
    const without = itemTooltipHtml(HOVERED, deps, false);
    expect(showItemLevel).toHaveBeenCalledTimes(1);
    expect(without).not.toContain(t('hudChrome.options.itemLevelLine', { level: '11' }));
    expect(withCompare.startsWith(without)).toBe(true);
  });
});

describe('questProgressText', () => {
  it('formats an objective label with its current and total counts', () => {
    expect(questProgressText('Wolves slain', 3, 10)).toBe(
      t('questUi.detail.objectiveProgress', { label: 'Wolves slain', current: '3', total: '10' }),
    );
  });
});

describe('the Hud half of the seam (source pin)', () => {
  it('delegates to itemTooltipHtml with its own world and the showItemLevel setting', () => {
    // The composer takes the setting as a thunk, so WHICH setting Hud reads is
    // Hud's to get right; the suites that drive the composer directly cannot
    // see it. Comment-stripped, and scoped to the delegator's own body.
    const hud = readFileSync(path.join(__dirname, '../src/ui/hud.ts'), 'utf8').replace(
      /^\s*\/\/.*$/gm,
      '',
    );
    const start = hud.indexOf('private itemTooltip(');
    expect(start).toBeGreaterThan(-1);
    const body = hud.slice(start, hud.indexOf('\n  }\n', start));
    expect(body).toMatch(/world:\s*this\.sim,/);
    expect(body).toContain("showItemLevel: () => this.optionsHooks?.settings.get('showItemLevel')");
    expect(body).toContain(
      'return itemTooltipHtml(item, deps, compare, instance, materialSources);',
    );
  });
});
