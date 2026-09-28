// The Crucible Quartermaster purchase gate
// (src/ui/hud/vendor/crucible_purchase_confirm.ts), moved whole out of
// Hud.requestCrucibleVendorPurchase beside the heroic gate. A redemption
// consumes a sigil with no buyback, so the handler is exercised with a mock
// confirmDialog: the pre-existing buy command must fire ONLY from the dialog's
// onOk, never from the bare tap, and dismissing the dialog sends nothing. The
// structural half (the buy sits in the OK callback, never a direct call) is
// tests/warfare_purchase_confirm.test.ts.

import { describe, expect, it, vi } from 'vitest';
import { CRUCIBLE_VENDOR_STOCK } from '../src/sim/content/ignivar_loot';
import { ITEMS } from '../src/sim/data';
import { itemDisplayName } from '../src/ui/entity_i18n';
import type { ConfirmDialogArgs } from '../src/ui/hud/dialog';
import { requestCruciblePurchase } from '../src/ui/hud/vendor';
import { t } from '../src/ui/i18n';

interface ConfirmCall {
  title: string;
  body: string;
  ok: string;
  cancel: string;
  onOk: () => void;
}

/** A plain host shaped like the Hud members the gate drives (CruciblePurchaseHost). */
function harness() {
  const confirmations: ConfirmCall[] = [];
  const buy = vi.fn();
  const hud = {
    sim: { buyCrucibleVendorItem: buy },
    confirmDialog: (...[title, body, ok, cancel, onOk]: ConfirmDialogArgs) => {
      confirmations.push({ title, body, ok, cancel, onOk });
    },
  };
  return { confirmations, buy, request: (itemId: string) => requestCruciblePurchase(hud, itemId) };
}

const offer = CRUCIBLE_VENDOR_STOCK[0];
if (!offer) throw new Error('crucible vendor stock fixture not found');

describe('crucible quartermaster purchase confirmation', () => {
  it('names the item and the sigil it consumes, buying only from OK', () => {
    const { confirmations, buy, request } = harness();

    request(offer.itemId);

    expect(buy).not.toHaveBeenCalled();
    expect(confirmations).toHaveLength(1);
    const [confirm] = confirmations;
    expect(confirm.title).toBe(t('crucibleShop.buyConfirmTitle'));
    expect(confirm.body).toBe(
      t('crucibleShop.buyConfirmBody', {
        item: itemDisplayName(ITEMS[offer.itemId]),
        sigil: itemDisplayName(ITEMS[offer.sigilId]),
      }),
    );
    expect(confirm.body).toContain(ITEMS[offer.sigilId].name);
    expect(confirm.ok).toBe(t('crucibleShop.buyConfirmAccept'));
    expect(confirm.cancel).toBe(t('crucibleShop.buyConfirmCancel'));

    confirm.onOk();
    expect(buy).toHaveBeenCalledExactlyOnceWith(offer.itemId);
  });

  it('sends nothing when the dialog is dismissed', () => {
    const { confirmations, buy, request } = harness();

    request(offer.itemId);

    expect(confirmations).toHaveLength(1);
    expect(buy).not.toHaveBeenCalled();
  });

  it('opens nothing for an id outside the stock', () => {
    const { confirmations, buy, request } = harness();

    request('not_a_stock_item');

    expect(confirmations).toHaveLength(0);
    expect(buy).not.toHaveBeenCalled();
  });
});
