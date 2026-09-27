import { describe, expect, it } from 'vitest';
import { MASTERWROUGHT_EQUIP_CAP } from '../src/sim/equipment_rules';
import type { ItemDef, ItemInstancePayload } from '../src/sim/types';
import { wornTooltipInstance } from '../src/ui/item_instance_tooltip';
import { itemTooltipHtml } from '../src/ui/item_tooltip_view';
import { itemTooltipDeps } from './helpers/item_tooltip_deps';

// The Masterwrought tooltip tag is an arm of the pure item card composer
// (src/ui/item_tooltip_view.ts) that only builds an HTML string, so exercise
// it directly the way tests/weapon_type_tooltip.test.ts does (no Hud, no DOM).
// No shipped def carries the flag yet, so the defs are hand-built rather than
// read from ITEMS: the tag must render for any flagged def, whatever its source.
function tooltip(item: ItemDef, instance?: ItemInstancePayload): string {
  return itemTooltipHtml(item, itemTooltipDeps(), false, instance);
}

const FLAGGED_RING = {
  id: 'test_mw_tooltip_ring',
  name: 'Test Masterwrought Tooltip Ring',
  kind: 'armor',
  slot: 'ring',
  quality: 'epic',
  masterwrought: true,
  requiredLevel: 20,
  stats: { sta: 1 },
  sellValue: 1,
} as ItemDef;

// The exact rendered line: its own gold tt-sub line, never the type seat. The
// literal 2 here and the constants pin in tests/masterwrought_cap.test.ts move
// together on a cap retune.
const TAG_LINE =
  '<div class="tt-sub" style="color:var(--gold)">Unique-Equipped: Masterwrought (2)</div>';

describe('masterwrought tag on the item tooltip', () => {
  it('renders the counted-family tag on its own gold line with the cap number', () => {
    expect(MASTERWROUGHT_EQUIP_CAP).toBe(2);
    expect(tooltip(FLAGGED_RING)).toContain(TAG_LINE);
  });

  it('renders nothing masterwrought for the same def without the flag', () => {
    const unflagged = { ...FLAGGED_RING, masterwrought: undefined } as ItemDef;
    expect(tooltip(unflagged)).not.toContain('Masterwrought');
  });

  it('keeps its own line beside the unique-equipped tag on a legendary flagged piece', () => {
    // A legendary flagged def carries BOTH tags: the one-copy rule's tag in
    // the slot row's type seat and the counted family's own gold line. The
    // double-line copy pass is a recorded packet item; this pins only that
    // neither tag displaces the other.
    const legendary = { ...FLAGGED_RING, quality: 'legendary' } as ItemDef;
    const html = tooltip(legendary);
    expect(html).toContain(TAG_LINE);
    expect(html).toContain('tt-unique');
  });

  it('a promoted (legendary-rolled) copy of an EPIC def earns the unique tag from its instance', () => {
    // Masterwrought phase 13: isUniqueEquipped is instance-aware, so the
    // tooltip tag follows the copy, not just the def. 2026-08-27 scoping
    // correction: the widening is PROMOTION-SCOPED (perfected + legendary
    // rolled, the orange promotion's own mint), so a LEGACY rolled-only
    // payload stays tag-free like the def-only render, which is what makes
    // this arm instance-driven rather than a restatement of the case above.
    const promoted: ItemInstancePayload = { perfected: true, rolled: { quality: 'legendary' } };
    const html = tooltip(FLAGGED_RING, promoted);
    expect(html).toContain('tt-unique');
    expect(tooltip(FLAGGED_RING)).not.toContain('tt-unique');
    const legacy = tooltip(FLAGGED_RING, { rolled: { quality: 'legendary' } });
    expect(legacy).not.toContain('tt-unique');
  });

  it('the OWN paperdoll tooltip of a promoted worn copy keeps the tag (bags and paperdoll agree)', () => {
    // The paperdoll routes its payload through wornTooltipInstance; until
    // 2026-08-27 that projection dropped `perfected`, so the same copy showed
    // the Unique-Equipped tag in the bags and lost it the moment it was worn.
    // The projection now keeps the stamp (a self-side fact; einst carries the
    // full payload in both hosts), so both surfaces render the same tag.
    const full: ItemInstancePayload = {
      perfected: true,
      rolled: { quality: 'legendary' },
      name: "Vel'tara's Oath",
      boundTo: 7,
    };
    const bags = tooltip(FLAGGED_RING, full);
    const paperdoll = tooltip(FLAGGED_RING, wornTooltipInstance(full));
    expect(bags).toContain('tt-unique');
    expect(paperdoll).toContain('tt-unique');
  });
});
