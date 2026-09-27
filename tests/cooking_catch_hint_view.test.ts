//
// Raw cooking catch purpose line: pure key table (every RAW_COOKING_CATCH_IDS
// member shares one key) plus createElement paint (tt-desc + textContent, no
// innerHTML). Integration: the composed item card (itemTooltipHtml) shows
// the cooking line and never a restore-health / foodHp line.

import { describe, expect, it } from 'vitest';
import { RAW_COOKING_CATCH_IDS } from '../src/sim/content/items';
import { ITEMS } from '../src/sim/data';
import {
  COOKING_CATCH_HINT_KEY,
  cookingCatchHintKey,
} from '../src/ui/hud/professions/cooking_catch_hint_view';
import { t } from '../src/ui/i18n';
import { itemTooltipHtml } from '../src/ui/item_tooltip_view';
import { itemTooltipDeps } from './helpers/item_tooltip_deps';

function tooltipHtml(itemId: string): string {
  const item = ITEMS[itemId];
  if (!item) throw new Error(`missing item ${itemId}`);
  // The minimal deps fixture (tests/helpers/item_tooltip_deps.ts): the card
  // reads world.player.level for itemRequiredLevelLine on every item, and
  // cfg/equipment cover the slot/masterwrought arms these items never take.
  return itemTooltipHtml(item, itemTooltipDeps(), false);
}

describe('cooking_catch_hint_view (pure keys)', () => {
  it('every raw cooking catch shares the one cooking-ingredient key', () => {
    // TEN since masterwrought Phase 11i added its three high-band catches;
    // they take the same one cooking-ingredient key by being catches.
    expect(RAW_COOKING_CATCH_IDS.size).toBe(10);
    const keys = new Set([...RAW_COOKING_CATCH_IDS].map((id) => cookingCatchHintKey(id)));
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe(COOKING_CATCH_HINT_KEY);
    expect(COOKING_CATCH_HINT_KEY).toBe('hudChrome.materialHint.cookingCatch');
  });

  it('cooked meals and non-catch junk stay unhinted', () => {
    for (const id of ['pan_seared_perch', 'game_meat', 'iron_ore', 'tangled_weed', 'baked_bread']) {
      expect(cookingCatchHintKey(id), id).toBeUndefined();
    }
  });

  it('resolves to the locked cook-first English, not restore-health', () => {
    expect(t(COOKING_CATCH_HINT_KEY)).toBe('Cooking ingredient. Must be cooked before eating.');
  });
});

describe('cooking catch hint source', () => {
  it('new feature modules do not introduce innerHTML assignments', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    // Repo root is process.cwd() under vitest (worktree root).
    for (const rel of ['src/ui/hud/professions/cooking_catch_hint_view.ts']) {
      const src = readFileSync(join(process.cwd(), rel), 'utf8');
      expect(src, rel).not.toMatch(/\.innerHTML\s*=/);
      expect(src, rel).not.toMatch(/`[\s\S]*class="tt-/);
    }
  });
});

describe('itemTooltip integration for raw catches', () => {
  it('shows the cooking-ingredient line and never a restore-health line', () => {
    const cookingText = t(COOKING_CATCH_HINT_KEY);
    for (const id of RAW_COOKING_CATCH_IDS) {
      const html = tooltipHtml(id);
      expect(html, id).toContain(cookingText);
      expect(html, id).toContain('class="tt-desc"');
      expect(html, id).not.toMatch(/Restores .+ health/i);
      expect(html, id).not.toContain('Must remain seated while eating');
      // Def has no foodHp so useFood never fires.
      expect(ITEMS[id].foodHp, id).toBeUndefined();
    }
  });

  it('cooked control still shows the restore-health use line', () => {
    const html = tooltipHtml('pan_seared_perch');
    expect(html).toMatch(/Restores .+ health/i);
    expect(html).not.toContain(t(COOKING_CATCH_HINT_KEY));
  });
});
