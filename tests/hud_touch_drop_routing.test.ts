// The touch drop routing past the hit test (the phase 14 QA gaps): the bags
// release reaches the HUD's drop deps, the action-ring wiring bounds its index,
// and the Hud's placeHotbarItemFromTouch hides the tooltip only on a placement.
// Source pins only: the placement itself (the bad-slot and non-hotbar refusals,
// the save) moved to ActionBarController.placeItemFromTouch, and its case moved
// with it to tests/action_bar_controller.test.ts, so this file no longer
// imports src/ui/hud (whose module graph cost it about 660 MB of retained heap).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('touch drop routing beyond the hit-test (the phase 14 QA gaps)', () => {
  const stripped = (rel: string): string =>
    readFileSync(join(__dirname, rel), 'utf8').replace(/^\s*\/\/.*$/gm, '');

  it('the bags release routes both action arms into the HUD deps (source pin)', () => {
    const bags = stripped('../src/ui/bags_window.ts');
    // The equip arm now also forwards WHICH bag copy was dragged, so it is no
    // longer a single line. Pinned as its parts rather than as one string: the
    // routing claim (this arm reaches dropOnEquipSlot with the item and the
    // target slot) is what this test is about, and the added third argument is
    // the copy-addressing work, covered by tests/item_copy_addressing_guard.
    const equipArm = bags.slice(
      bags.indexOf("if (target.kind === 'equip')"),
      bags.indexOf("else if (target.kind === 'bagCell')"),
    );
    expect(equipArm, 'the equip arm must reach the HUD dep').toContain(
      'this.deps.dropOnEquipSlot(',
    );
    expect(equipArm).toContain('s.itemId');
    expect(equipArm).toContain('target.slot');
    expect(bags).toContain(
      "else if (target.kind === 'actionSlot') this.deps.dropOnActionSlot(s.itemId, target.slot);",
    );
    expect(bags).toContain('this.deps.dropOnActionRingSlot(s.itemId, target.ringIndex);');
  });

  it('the ring wiring bounds the index against the live ring (source pin)', () => {
    const hud = stripped('../src/ui/hud.ts');
    const idx = hud.indexOf('dropOnActionRingSlot: (itemId, ringIndex) => {');
    expect(idx).toBeGreaterThan(-1);
    const body = hud.slice(idx, hud.indexOf('},', idx));
    expect(body).toContain('if (ringIndex >= this.mobileRingSlotBtns.length) return;');
    expect(body).toContain(
      'this.placeHotbarItemFromTouch(itemId, this.mobileSourceSlotForButton(ringIndex));',
    );
  });

  it('the Hud delegator applies the stale-tooltip rule only on a placement (source pin)', () => {
    // The refusals, the placement and the save are ActionBarController's
    // placeItemFromTouch (tests/action_bar_controller.test.ts); what the Hud
    // still owns is hiding the tooltip, and only when that returned true.
    const hud = stripped('../src/ui/hud.ts');
    const idx = hud.indexOf(
      'private placeHotbarItemFromTouch(itemId: string, slot: number): void {',
    );
    expect(idx).toBeGreaterThan(-1);
    const body = hud.slice(idx, hud.indexOf('\n  }\n', idx));
    expect(body).toContain(
      'if (this.actionBarController.placeItemFromTouch(itemId, slot)) this.hideTooltip();',
    );
    expect(body.match(/this\.hideTooltip\(\)/g)).toHaveLength(1);
  });
});
