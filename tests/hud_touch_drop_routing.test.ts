// @vitest-environment happy-dom
//
// The touch drop routing past the hit test (the phase 14 QA gaps): the bags
// release reaches the HUD's drop deps, the action-ring wiring bounds its index,
// and the Hud's placeHotbarItemFromTouch refuses bad slots and non-hotbar items.
// Moved out of tests/equip_drop_core.test.ts on 2026-09-27: it is the one case
// there that needs the Hud class, and importing src/ui/hud cost every other case
// of that pure-core suite about 400 MB of retained heap.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { Hud } from '../src/ui/hud';

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

  it('placeHotbarItemFromTouch refuses bad slots and non-hotbar items, places the rest', () => {
    // The three behaviors on the real prototype method: the slot >= 1
    // integer refusal, the isHotbarItemId silent cancel, and the placement
    // with its save and stale-tooltip rule.
    const rig = () => {
      const replaceActions = vi.fn();
      const h = Object.create(Hud.prototype) as unknown as {
        actionBarController: {
          isHotbarItemId(id: string): boolean;
          actions: unknown[];
          replaceActions: ReturnType<typeof vi.fn>;
        };
        saveSlotMap: ReturnType<typeof vi.fn>;
        hideTooltip: ReturnType<typeof vi.fn>;
        placeHotbarItemFromTouch(itemId: string, slot: number): void;
      };
      // The hotbarActions accessor pair delegates to the controller: the
      // getter reads `actions`, the setter calls `replaceActions`.
      h.actionBarController = {
        isHotbarItemId: (id: string) => id === 'simple_fishing_pole',
        actions: [null, null, null, null],
        replaceActions,
      };
      h.saveSlotMap = vi.fn();
      h.hideTooltip = vi.fn();
      return h;
    };
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      const h = rig();
      h.placeHotbarItemFromTouch('simple_fishing_pole', bad);
      expect(h.saveSlotMap, `slot ${bad}`).not.toHaveBeenCalled();
      expect(h.actionBarController.replaceActions).not.toHaveBeenCalled();
    }
    const notHotbar = rig();
    notHotbar.placeHotbarItemFromTouch('iron_ore', 2);
    expect(notHotbar.saveSlotMap).not.toHaveBeenCalled();
    const ok = rig();
    ok.placeHotbarItemFromTouch('simple_fishing_pole', 2);
    const placed = ok.actionBarController.replaceActions.mock.calls[0]?.[0] as unknown[];
    expect(placed?.[1]).toMatchObject({ type: 'item', id: 'simple_fishing_pole' });
    expect(ok.saveSlotMap).toHaveBeenCalledTimes(1);
    expect(ok.hideTooltip).toHaveBeenCalledTimes(1);
  });
});
