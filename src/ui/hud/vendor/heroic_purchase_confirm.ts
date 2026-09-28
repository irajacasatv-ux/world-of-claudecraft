// The Heroic Quartermaster's purchase confirmation, moved whole out of
// Hud.requestHeroicVendorPurchase. Marks purchases debit Heroic Marks with no
// buyback recorded (gold vendors are the only buyback source), so a mis-tap is
// unrefundable: confirm before sending the exact pre-existing buy command,
// which fires ONLY from the confirm's OK callback (pinned as a call walk in
// tests/warfare_purchase_confirm.test.ts).
//
// The heroic window's onBuy calls this with the Hud as the host, so tsc checks
// the Hud against HeroicPurchaseHost.

import { HEROIC_VENDOR_STOCK } from '../../../sim/content/heroic_vendor';
import { ITEMS } from '../../../sim/data';
import type { ConfirmDialogArgs } from '../../confirm_dialog_controller';
import { itemDisplayName } from '../../entity_i18n';
import { formatNumber, t } from '../../i18n';

/** The Hud members the purchase confirmation drives. */
export interface HeroicPurchaseHost {
  readonly sim: { buyHeroicVendorItem(itemId: string): void };
  confirmDialog(...args: ConfirmDialogArgs): void;
}

/** Confirm a Heroic Marks purchase; an id outside the stock opens nothing. */
export function requestHeroicPurchase(host: HeroicPurchaseHost, itemId: string): void {
  const offer = HEROIC_VENDOR_STOCK.find((candidate) => candidate.itemId === itemId);
  const item = ITEMS[itemId];
  if (!offer || !item) return;
  host.confirmDialog(
    t('heroicShop.buyConfirmTitle'),
    t('heroicShop.buyConfirmBody', {
      item: itemDisplayName(item),
      marks: formatNumber(offer.marks, { maximumFractionDigits: 0 }),
    }),
    t('heroicShop.buyConfirmAccept'),
    t('heroicShop.buyConfirmCancel'),
    () => host.sim.buyHeroicVendorItem(itemId),
  );
}
