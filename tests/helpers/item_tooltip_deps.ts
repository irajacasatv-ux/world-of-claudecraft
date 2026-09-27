// The minimal deps a suite drives itemTooltipHtml (src/ui/item_tooltip_view.ts)
// with, in place of the Object.create(Hud.prototype) rig those suites used
// while the item card lived on the Hud coordinator (whose import alone cost a
// test file several hundred MB of retained heap).
//
// Only the IWorld reads a def-only hover makes are filled in: the viewer's
// level (the required-level line, read for every item) and class (the
// armor-weight line), plus empty worn gear (the masterwrought cap and the set
// count). The Show Item Level setting is off unless a case turns it on, the
// value an unset option read gave the old rig. A case that exercises another
// read (the craft identity, the quest log, worn instances, the party-trade
// clock) passes it through `world`, or hands in a real world: the card over a
// real Sim and a snapshot-fed ClientWorld is tests/item_tooltip_view_parity.test.ts.
import type { ItemTooltipDeps, ItemTooltipWorld } from '../../src/ui/item_tooltip_view';

export interface ItemTooltipFixture {
  readonly level?: number;
  readonly playerClass?: string;
  readonly showItemLevel?: boolean;
  /** Extra or replacement world reads, merged over the defaults above. */
  readonly world?: Record<string, unknown>;
}

export function itemTooltipDeps(fixture: ItemTooltipFixture = {}): ItemTooltipDeps {
  const world = {
    player: { level: fixture.level ?? 80 },
    cfg: { playerClass: fixture.playerClass ?? 'warrior' },
    equipment: {},
    ...fixture.world,
  } as unknown as ItemTooltipWorld;
  const showItemLevel = fixture.showItemLevel ?? false;
  return { world, showItemLevel: () => showItemLevel };
}
