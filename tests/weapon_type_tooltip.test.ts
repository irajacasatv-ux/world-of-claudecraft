import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import { itemTooltipHtml } from '../src/ui/item_tooltip_view';
import { itemTooltipDeps } from './helpers/item_tooltip_deps';

// The item tooltip is a pure composer that only builds an HTML string
// (src/ui/item_tooltip_view.ts), so exercise it directly (no Hud, no DOM).
// Only the few world reads the weapon/armor slot lines make need stubbing:
// player.level (the requires-level line) and cfg.playerClass + equipment (the
// armor can-equip check).
function tooltip(itemId: string, playerClass = 'rogue'): string {
  const item = ITEMS[itemId];
  if (!item) throw new Error(`missing test item ${itemId}`);
  // compare=false: the compare block reads more IWorld surface than this slim
  // fixture stubs and is out of scope for the slot-line assertions.
  return itemTooltipHtml(item, itemTooltipDeps({ playerClass }), false);
}

describe('weapon type line on the item tooltip', () => {
  it('shows a sword its type on its own plain line under the quality/kind line and above the slot', () => {
    const html = tooltip('worn_sword');
    // Its own plain sub-line, NOT a right-aligned chip inside the slot tt-row.
    expect(html).toContain('<div class="tt-sub tt-weapon-type">Sword</div>');
    // Ordering: quality/kind line, then the type line, then the slot line.
    const qualityIdx = html.indexOf('<div class="tt-sub">Common Weapon</div>');
    const typeIdx = html.indexOf('<div class="tt-sub tt-weapon-type">Sword</div>');
    const slotIdx = html.indexOf('<div class="tt-sub">Main Hand</div>');
    expect(qualityIdx).toBeGreaterThanOrEqual(0);
    expect(typeIdx).toBeGreaterThan(qualityIdx);
    expect(slotIdx).toBeGreaterThan(typeIdx);
    // Never a right-aligned tt-row chip and never colored by class like armor weight.
    expect(html).not.toMatch(/tt-row"><span>[^<]*<\/span><span class="tt-weapon-type"/);
    expect(html).not.toContain('tt-armor');
  });

  it('shows a dagger its type and drops the old standalone Dagger sub-line', () => {
    const html = tooltip('fang_of_korzul');
    expect(html).toContain('<div class="tt-sub tt-weapon-type">Dagger</div>');
    // The legacy line was a plain `<div class="tt-sub">Dagger</div>` (no
    // tt-weapon-type class) emitted below the DPS. Assert that exact standalone
    // form is gone: the type now reads on its own line above the slot instead.
    expect(html).not.toContain('<div class="tt-sub">Dagger</div>');
  });

  it('labels a polearm with the newly added type label', () => {
    expect(tooltip('tidereaver_gaff')).toContain(
      '<div class="tt-sub tt-weapon-type">Polearm</div>',
    );
  });

  it('labels staff and wand types', () => {
    expect(tooltip('gnarled_staff')).toContain('<div class="tt-sub tt-weapon-type">Staff</div>');
    expect(tooltip('drowned_tide_scepter')).toContain(
      '<div class="tt-sub tt-weapon-type">Wand</div>',
    );
  });

  it('leaves the armor tooltip unchanged: armor-weight row, no weapon-type line', () => {
    // apprentice_robe is cloth chest armor; a mage can wear it (no tt-armor-bad).
    const html = tooltip('apprentice_robe', 'mage');
    expect(html).toContain('tt-armor');
    expect(html).toContain('>Cloth<');
    expect(html).not.toContain('tt-weapon-type');
  });
});
