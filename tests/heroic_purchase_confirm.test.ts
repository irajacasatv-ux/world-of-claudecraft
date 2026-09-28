// The Heroic Quartermaster purchase gate
// (src/ui/hud/vendor/heroic_purchase_confirm.ts), moved whole from
// tests/hud_confirm_gates.test.ts when requestHeroicPurchase left
// Hud.requestHeroicVendorPurchase. Marks purchases record no buyback, so the
// handler is exercised with a mock confirmDialog: the pre-existing buy command
// must fire ONLY from the dialog's onOk, never from the bare tap, and
// dismissing the dialog sends nothing. The structural half (the buy sits in
// the OK callback, never a direct call) is tests/warfare_purchase_confirm.test.ts.

import { describe, expect, it, vi } from 'vitest';
import { HEROIC_VENDOR_STOCK } from '../src/sim/content/heroic_vendor';
import { ITEMS } from '../src/sim/data';
import type { ConfirmDialogArgs } from '../src/ui/hud/dialog/confirm_dialog_controller';
import { requestHeroicPurchase } from '../src/ui/hud/vendor/heroic_purchase_confirm';

interface ConfirmCall {
  title: string;
  body: string;
  ok: string;
  cancel: string;
  onOk: () => void;
  onCancel?: () => void;
}

/** A plain host shaped like the Hud members the gate drives (HeroicPurchaseHost). */
function harness() {
  const confirmations: ConfirmCall[] = [];
  const buy = vi.fn();
  const hud = {
    sim: { buyHeroicVendorItem: buy },
    confirmDialog: (...[title, body, ok, cancel, onOk, onCancel]: ConfirmDialogArgs) => {
      confirmations.push({ title, body, ok, cancel, onOk, onCancel });
    },
  };
  return { confirmations, buy, request: (itemId: string) => requestHeroicPurchase(hud, itemId) };
}

const stockOffer = HEROIC_VENDOR_STOCK[0];
if (!stockOffer) throw new Error('heroic vendor stock fixture not found');

describe('heroic quartermaster purchase confirmation', () => {
  it('opens the confirm with the item name and mark cost, buying only from OK', () => {
    const { confirmations, buy, request } = harness();

    request(stockOffer.itemId);

    expect(buy).not.toHaveBeenCalled();
    expect(confirmations).toHaveLength(1);
    const confirm = confirmations[0];
    expect(confirm.title).toBe('Confirm Purchase');
    expect(confirm.body).toContain(ITEMS[stockOffer.itemId].name);
    expect(confirm.body).toContain(String(stockOffer.marks));
    expect(confirm.body).toContain('Heroic Marks');
    expect(confirm.ok).toBe('Buy');
    expect(confirm.cancel).toBe('Cancel');

    confirm.onOk();
    expect(buy).toHaveBeenCalledExactlyOnceWith(stockOffer.itemId);
  });

  it('sends nothing when the dialog is dismissed', () => {
    const { confirmations, buy, request } = harness();

    request(stockOffer.itemId);

    expect(confirmations).toHaveLength(1);
    // The gate hands the dialog no cancel action, so a dismissal (Cancel, Escape,
    // the close button) runs nothing of its own.
    expect(confirmations[0].onCancel).toBeUndefined();
    confirmations[0].onCancel?.();
    expect(buy).not.toHaveBeenCalled();
  });

  it('ignores an item id that is not in the quartermaster stock', () => {
    const { confirmations, buy, request } = harness();

    request('not_a_stock_item');

    expect(confirmations).toHaveLength(0);
    expect(buy).not.toHaveBeenCalled();
  });
});
