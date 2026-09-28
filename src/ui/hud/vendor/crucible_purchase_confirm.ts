// The Crucible Quartermaster's purchase confirmation, moved whole out of
// Hud.requestCrucibleVendorPurchase beside the heroic one. A redemption
// consumes a sigil with no buyback recorded, so a mis-tap is unrefundable:
// confirm before sending the exact pre-existing buy command, which fires ONLY
// from the confirm's OK callback (pinned as a call walk in
// tests/warfare_purchase_confirm.test.ts).
//
// The Crucible window's onBuy calls this with the Hud as the host, so tsc
// checks the Hud against CruciblePurchaseHost.

import { CRUCIBLE_VENDOR_STOCK } from '../../../sim/content/ignivar_loot';
import { ITEMS } from '../../../sim/data';
import { itemDisplayName } from '../../entity_i18n';
import { t } from '../../i18n';
import type { ConfirmDialogArgs } from '../dialog';

/** The Hud members the purchase confirmation drives. */
export interface CruciblePurchaseHost {
  readonly sim: { buyCrucibleVendorItem(itemId: string): void };
  confirmDialog(...args: ConfirmDialogArgs): void;
}

/** Confirm a sigil redemption; an id outside the stock opens nothing. */
export function requestCruciblePurchase(host: CruciblePurchaseHost, itemId: string): void {
  const offer = CRUCIBLE_VENDOR_STOCK.find((candidate) => candidate.itemId === itemId);
  const item = ITEMS[itemId];
  const sigil = offer ? ITEMS[offer.sigilId] : undefined;
  if (!offer || !item || !sigil) return;
  host.confirmDialog(
    t('crucibleShop.buyConfirmTitle'),
    t('crucibleShop.buyConfirmBody', {
      item: itemDisplayName(item),
      sigil: itemDisplayName(sigil),
    }),
    t('crucibleShop.buyConfirmAccept'),
    t('crucibleShop.buyConfirmCancel'),
    () => host.sim.buyCrucibleVendorItem(itemId),
  );
}
