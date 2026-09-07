import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The route graph constructs a pool but the injected service never connects.
vi.hoisted(() => {
  process.env.DATABASE_URL ||= 'postgres://test:test@127.0.0.1:5433/wocc_furnishing_exchange';
});

import { type WocListingRow, type WocMarketCustody, WocMarketService } from '../server/woc_market';
import { createDevWocMarketEconomy } from '../server/woc_market_proxy';
import {
  configureWocMarketRuntime,
  resetWocMarketRuntimeForTests,
  routes,
} from '../server/woc_market_routes';
import { WOC_MARKET_RESTRICTED_POLICY, type WocListingParams } from '../server/woc_market_rules';
import {
  buildStepUpMessage,
  stepUpBindingDigest,
  type WocStepUpBinding,
} from '../server/woc_market_stepup';
import { ITEMS } from '../src/sim/data';
import { extractTradableCopy } from '../src/sim/inventory_extract';
import { itemCopyPin } from '../src/sim/item_copy_ref';
import type { CharacterState } from '../src/sim/sim';
import type { InvSlot, ItemDef, ItemInstancePayload } from '../src/sim/types';
import {
  buildWocMarketView,
  lockedOutRows,
  sellableRows,
  type WocListingView,
  type WocMarketViewInput,
} from '../src/ui/woc_market_view';
import { FURNISHING } from './fixtures/furnishing_item';
import { type FakeRes, fakeCtx } from './server/helpers';
import { FakeWocMarketDb } from './server/helpers/fake_woc_market_db';

const GEAR: ItemDef = {
  id: 'test_furnishing_exchange_gear',
  name: 'Control Sword',
  kind: 'weapon',
  slot: 'mainhand',
  quality: 'epic',
  sellValue: 1,
  requiredLevel: 1,
  weapon: { min: 5, max: 7, speed: 2 },
};
const COPY: ItemInstancePayload = {
  name: 'Unsupported House Name',
  signer: 'Testmaker',
  rolled: { quality: 'legendary', masterwork: true, stats: { str: 999 } },
  enchant: 'test_enchant',
  rift: {
    sourceEventId: 'test_rift',
    tier: 'C',
    power: 999,
    upgradeLevel: 1,
    maxUpgradeLevel: 9,
    baseStats: { str: 999 },
    gemSlots: 0,
    gems: [],
  },
};
const NOW = 1_800_000_000_000;
const PARAMS: WocListingParams = {
  format: 'auction',
  directedBuyerAccount: null,
  startCents: 5000,
  reserveCents: null,
  buyNowCents: null,
  durationHours: 12,
  offerNext: false,
};

beforeEach(() => {
  ITEMS[FURNISHING.id] = structuredClone(FURNISHING);
  ITEMS[GEAR.id] = structuredClone(GEAR);
});
afterEach(() => {
  delete ITEMS[FURNISHING.id];
  delete ITEMS[GEAR.id];
  resetWocMarketRuntimeForTests();
});

function binding(itemId: string, instance: ItemInstancePayload = COPY): WocStepUpBinding {
  return {
    operation: 'create_listing',
    itemId,
    expectInstance: instance,
    format: PARAMS.format,
    startCents: PARAMS.startCents,
    reserveCents: PARAMS.reserveCents,
    buyNowCents: PARAMS.buyNowCents,
    durationHours: PARAMS.durationHours,
    offerNext: false,
  };
}
function message(itemId: string, instance: ItemInstancePayload = COPY): string {
  return buildStepUpMessage({
    binding: binding(itemId, instance),
    accountId: 1,
    wallet: 'wallet-seller',
    realm: 'Claudemoon',
    nonce: 'fixed-nonce',
    expiresAtIso: '2027-01-15T08:05:00.000Z',
  });
}
function rig(slot: InvSlot) {
  const inventory = [structuredClone(slot)];
  const db = new FakeWocMarketDb({
    now: () => NOW,
    characters: [{ characterId: 11, accountId: 1, name: 'Seller', realm: 'Claudemoon' }],
  });
  const unexpected = (): never => {
    throw new Error('unexpected delivery path');
  };
  const custody: WocMarketCustody = {
    runSerialized: async (_character, job) => job(),
    ownsLiveCharacter: (account, character) => account === 1 && character === 11,
    escrowSessionLost: unexpected,
    extractCopy: (_account, characterId, ref) => {
      const out = extractTradableCopy(inventory, ref, ITEMS[ref.itemId]);
      if (!out.ok) return out;
      return {
        ok: true,
        pid: characterId,
        extracted: out.extracted,
        characterName: 'Seller',
        save: { characterId, level: 10, state: {} as CharacterState, leaseNonce: 'nonce' },
      };
    },
    grantCopy: unexpected,
    snapshotCopy: unexpected,
    persistGrantSerialized: unexpected,
    restoreCopy: (_pid, _character, copy) => {
      inventory.push(copy);
    },
    persistMailParcel: unexpected,
    hasParcel: () => false,
  };
  const service = new WocMarketService({
    db,
    custody,
    economy: createDevWocMarketEconomy(() => NOW),
    verifiedWallet: async () => 'wallet-seller',
    balanceTokens: async () => 100_000_000,
    stepUpDevSig: true,
    now: () => NOW,
    config: {
      enabled: true,
      realm: 'Claudemoon',
      policy: WOC_MARKET_RESTRICTED_POLICY,
      confirmingReviewMs: 6 * 3600 * 1000,
    },
  });
  return { service, inventory, db };
}
async function list(slot: InvSlot) {
  const h = rig(slot);
  const issue = await h.service.issueStepUpChallenge(1, binding(slot.itemId, slot.instance));
  expect(issue.ok).toBe(true);
  if (!issue.ok) throw new Error(issue.reason);
  const out = await h.service.createListing({
    account: 1,
    characterId: 11,
    itemRef: { index: 0, itemId: slot.itemId, expectInstance: slot.instance },
    params: PARAMS,
    stepUp: { nonce: issue.challenge.nonce, signature: `devsig:${issue.challenge.nonce}` },
  });
  expect(out.ok).toBe(true);
  if (!out.ok) throw new Error(out.reason);
  const persisted = await h.db.listingById('Claudemoon', out.listing.id);
  expect(persisted).not.toBeNull();
  return { ...h, listing: persisted! };
}
function listingView(itemId: string): WocListingView {
  return {
    id: 1,
    item: { itemId, count: 1, instance: COPY },
    itemId,
    quality: 'legendary',
    format: 'auction',
    sellerName: 'Seller',
    mine: false,
    startCents: 5000,
    hasReserve: false,
    reserveMet: null,
    buyNowCents: null,
    offerNext: false,
    status: 'active',
    resolution: null,
    currentBidCents: null,
    minNextBidCents: 5000,
    minNextBidBondCents: 500,
    buyNowLocked: false,
    endsAtMs: NOW + 3600000,
    createdAtMs: NOW,
  };
}
function viewInput(rows: WocListingView[]): WocMarketViewInput {
  return {
    capable: true,
    statusFailed: false,
    walletLinked: true,
    tab: 'browse',
    nowMs: NOW,
    inventory: [],
    status: {
      ok: true,
      enabled: true,
      price: { available: true, healthy: true, tokensPerUsd: 100, asOfMs: NOW },
      maxActiveListings: 12,
      durationsHours: [12],
      minPriceCents: 25,
      maxPriceCents: 100000,
      allowMounts: true,
      allowMechChromas: true,
      qualityFloor: 'epic',
      settlementWindowSeconds: 600,
    },
    browse: {
      listings: rows,
      hasMore: false,
      page: 0,
      pageSize: 25,
      loading: false,
      failed: false,
      selectedId: 1,
      detail: rows[0],
      estimate: null,
      sales: null,
    },
    activity: {
      listings: rows,
      bids: [],
      settlements: [],
      strikes: null,
      termsAcceptedAtMs: NOW,
      walletLinked: true,
    },
  };
}

describe('furnishing Exchange identity', () => {
  it('keeps authored sell and locked-row quality while gear still uses its actual rolled tier', () => {
    const inventory = [FURNISHING.id, GEAR.id].map((itemId) => ({
      itemId,
      count: 1,
      instance: structuredClone(COPY),
    }));
    expect(
      sellableRows(inventory, 'epic', { mounts: true, mechChromas: true }).map((row) => [
        row.itemId,
        row.quality,
      ]),
    ).toEqual([
      [FURNISHING.id, 'rare'],
      [GEAR.id, 'legendary'],
    ]);
    const locked = inventory.map((slot) => ({
      ...slot,
      instance: { ...slot.instance, locked: true },
    }));
    expect(
      lockedOutRows(locked, 'epic', { mounts: true, mechChromas: true }).map((row) => [
        row.itemId,
        row.quality,
      ]),
    ).toEqual([
      [FURNISHING.id, 'rare'],
      [GEAR.id, 'legendary'],
    ]);
    expect(
      sellableRows(inventory, 'epic', { mounts: false, mechChromas: true }).map(
        (row) => row.itemId,
      ),
    ).toEqual([GEAR.id]);
    expect(inventory[0].instance).toEqual(COPY);
  });

  it('normalizes old Browse, detail and Activity row quality without changing payloads or gear', () => {
    const rows = [listingView(FURNISHING.id), { ...listingView(GEAR.id), id: 2 }];
    const before = structuredClone(rows);
    const view = buildWocMarketView(viewInput(rows));
    expect(view.kind).toBe('ready');
    if (view.kind !== 'ready') throw new Error('missing ready market');
    expect(view.browse.rows.map((row) => row.quality)).toEqual(['rare', 'legendary']);
    expect(view.browse.detail!.row.quality).toBe('rare');
    expect(view.activity!.listings.map((row) => row.quality)).toEqual(['rare', 'legendary']);
    expect(view.browse.rows[0].instance).toBe(rows[0].item.instance);
    expect(rows).toEqual(before);
  });

  it('persists authored listing quality and the complete raw escrow copy, with named gear as control', async () => {
    for (const [itemId, quality] of [
      [FURNISHING.id, 'rare'],
      [GEAR.id, 'legendary'],
    ]) {
      const slot: InvSlot = {
        itemId,
        count: 1,
        instance: structuredClone(COPY),
        craftedRecipeId: 'test_recipe',
      };
      const pin = itemCopyPin(slot);
      const h = await list(slot);
      expect(h.inventory).toEqual([]);
      expect(h.db.escrowSaves).toHaveLength(1);
      expect(h.listing.quality).toBe(quality);
      expect(h.listing.item).toEqual(slot);
      expect(itemCopyPin(h.listing.item)).toBe(pin);
      expect(h.listing.startCents).toBe(5000);
      expect(h.listing.sellerAccount).toBe(1);
    }
  });

  it('normalizes old listing wire quality while retaining raw copy identity and gear quality', async () => {
    const furnishing = (await list({ itemId: FURNISHING.id, count: 1, instance: COPY })).listing;
    const gear = (await list({ itemId: GEAR.id, count: 1, instance: COPY })).listing;
    const rows: WocListingRow[] = [
      { ...furnishing, quality: 'legendary' },
      { ...gear, id: 2 },
    ];
    const before = structuredClone(rows);
    configureWocMarketRuntime({
      service: { browse: async () => ({ rows, hasMore: false }) } as unknown as WocMarketService,
    });
    const route = routes.find(
      (row) => row.method === 'GET' && row.path === '/api/woc-market/listings',
    );
    expect(route).toBeDefined();
    const ctx = fakeCtx({
      method: 'GET',
      url: '/api/woc-market/listings',
      account: { accountId: 7, scope: 'read' },
    });
    await route!.handler(ctx);
    const response = ctx.res as unknown as FakeRes;
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.body).listings;
    expect(result.map((row: { quality: string }) => row.quality)).toEqual(['rare', 'legendary']);
    expect(result[0].item).toEqual(furnishing.item);
    expect(rows).toEqual(before);
  });

  it('describes only the sanitized maker while the signed binding still distinguishes every raw copy field', () => {
    const raw: ItemInstancePayload = { ...COPY, signer: '  Maker\n\u202eName  ' };
    const text = message(FURNISHING.id, raw);
    expect(text.split('\n').filter((line) => line.startsWith('Copy:'))).toEqual([
      'Copy: crafted by MakerName',
    ]);
    for (const word of [
      'masterwork',
      'legendary',
      'enchanted',
      'rift-forged',
      'customized',
      COPY.name!,
    ])
      expect(text).not.toContain(word);
    const original = binding(FURNISHING.id, raw);
    const variants: ItemInstancePayload[] = [
      { ...raw, name: 'Another Unsupported Name' },
      { ...raw, enchant: 'other_enchant' },
      { ...raw, rolled: { ...raw.rolled, quality: 'poor' } },
      { ...raw, rolled: { ...raw.rolled, masterwork: false } },
      { ...raw, rolled: { ...raw.rolled, stats: { str: 1 } } },
      { ...raw, rift: undefined },
    ];
    for (const variant of variants) {
      expect(message(FURNISHING.id, variant)).toBe(text);
      expect(stepUpBindingDigest(binding(FURNISHING.id, variant))).not.toBe(
        stepUpBindingDigest(original),
      );
      expect(itemCopyPin({ itemId: FURNISHING.id, count: 1, instance: variant })).not.toBe(
        itemCopyPin({ itemId: FURNISHING.id, count: 1, instance: raw }),
      );
    }
    expect(message(FURNISHING.id, { ...COPY, signer: '' })).not.toContain('Copy:');
    expect(message(FURNISHING.id, { ...COPY, signer: '\n\u202e' })).not.toContain('Copy:');
    expect(
      message(GEAR.id)
        .split('\n')
        .filter((line) => line.startsWith('Copy:')),
    ).toEqual(['Copy: masterwork, enchanted, rift-forged, crafted by Testmaker']);
    expect(raw).toEqual({ ...COPY, signer: '  Maker\n\u202eName  ' });
  });
});
