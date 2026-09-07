import { describe, expect, it } from 'vitest';
import {
  RELIQUARY_PAGES,
  RELIQUARY_PAGES_BY_ID,
  reliquaryRelicSource,
} from '../src/sim/content/reliquary';
import { ITEMS, NPCS } from '../src/sim/data';
import { pageCompletion } from '../src/sim/reliquary';
import {
  buildReliquaryTrackerViewInto,
  makeReliquaryTrackerView,
  pruneReliquaryPins,
  toggleReliquaryPin,
} from '../src/ui/reliquary_tracker_view';
import {
  buildReliquaryView,
  RELIQUARY_NAV,
  RELIQUARY_SHELF_ORDER,
  reliquaryVisibleNav,
} from '../src/ui/reliquary_view';

const HEARTH = RELIQUARY_PAGES_BY_ID.hearth_basics;
const ITEM_IDS = [
  'freehold_timber_bed',
  'freehold_round_table',
  'freehold_spindle_chair',
  'freehold_low_stool',
  'freehold_woven_rug',
  'freehold_brass_lantern',
  'freehold_storage_chest',
  'freehold_open_bookshelf',
];

describe('authored Hearth shelf', () => {
  it('declares Hearth last while keeping unauthored shelves out of player navigation', () => {
    expect(RELIQUARY_NAV).toEqual(['overview', 'conquerors', 'professions', 'horizons', 'hearth']);
    expect(RELIQUARY_SHELF_ORDER).toEqual(['conquerors', 'professions', 'horizons', 'hearth']);
    expect(reliquaryVisibleNav(RELIQUARY_PAGES)).toEqual([
      'overview',
      'conquerors',
      'professions',
      'horizons',
      'hearth',
    ]);
    expect(RELIQUARY_PAGES.slice(-2).map((page) => page.id)).toEqual([
      'hearth_basics',
      'hearth_first_crafts',
    ]);
    expect(RELIQUARY_PAGES.at(-2)).toBe(HEARTH);
    expect(
      RELIQUARY_PAGES_BY_ID.hearth_first_crafts.relics.map((relic) =>
        relic.kind === 'item' ? relic.itemId : relic.kind,
      ),
    ).toEqual([
      'freehold_weapon_rack',
      'freehold_iron_brazier',
      'freehold_patchwork_rug',
      'freehold_hide_armchair',
      'freehold_clockwork_lamp',
      'freehold_glass_floor_lamp',
      'freehold_chart_easel',
      'freehold_jewel_floor_lamp',
      'freehold_set_supper_table',
      'freehold_glow_lantern',
    ]);
    expect(reliquaryVisibleNav([])).toEqual(['overview']);
    expect(reliquaryVisibleNav([HEARTH])).toEqual(['overview', 'hearth']);
  });

  it('pins the real furniture inventory and each vendor route without patterns or trophies', () => {
    expect(HEARTH).toMatchObject({
      id: 'hearth_basics',
      shelf: 'hearth',
      name: 'Hearth Basics',
      clearSource: { kind: 'none' },
      sourceDefault: { sourceKind: 'vendor', sourceId: 'freehold_furnisher' },
    });
    expect(HEARTH.relics).toEqual(ITEM_IDS.map((itemId) => ({ kind: 'item', itemId })));
    expect(HEARTH.excludeFromCompletion).toBeUndefined();
    expect(Object.isFrozen(HEARTH)).toBe(true);
    expect(Object.isFrozen(HEARTH.relics)).toBe(true);
    for (const [index, relic] of HEARTH.relics.entries()) {
      const itemId = ITEM_IDS[index];
      expect(ITEMS[itemId]?.kind, itemId).toBe('furnishing');
      expect(NPCS.freehold_furnisher.vendorItems, itemId).toContain(itemId);
      expect(reliquaryRelicSource(HEARTH, relic)).toEqual([
        { sourceKind: 'vendor', sourceId: 'freehold_furnisher' },
      ]);
    }
  });

  it('adds an authored Hearth card and rail total without depending on discoveries', () => {
    const model = buildReliquaryView({
      pages: RELIQUARY_PAGES,
      itemsDiscovered: new Set(),
      marks: new Set(),
      recent: [],
      nav: 'overview',
      pageId: null,
    });
    expect(model.shelfCards.map((card) => card.shelf)).toEqual([
      'conquerors',
      'professions',
      'horizons',
      'hearth',
    ]);
    expect(model.shelfCards.at(-1)).toEqual({
      shelf: 'hearth',
      owned: 0,
      total: 18,
      recentId: null,
      recentKind: null,
    });
    expect(model.shelves.at(-1)).toEqual({ id: 'hearth', owned: 0, total: 18 });
  });

  it('carries Hearth ownership, localized search, recent jumps, and source plans through the existing view', () => {
    const model = buildReliquaryView({
      pages: [HEARTH],
      itemsDiscovered: new Set(['freehold_timber_bed']),
      marks: new Set(),
      recent: ['freehold_timber_bed'],
      nav: 'hearth',
      pageId: HEARTH.id,
      search: 'translated name',
      pageSearchText: () => '',
      relicSearchText: (_kind, id) =>
        id === 'freehold_timber_bed' ? 'translated name' : 'other name',
    });
    expect(model.shelfPages.map((page) => page.pageId)).toEqual(['hearth_basics']);
    expect(model.activePage).toMatchObject({ pageId: 'hearth_basics', owned: 1, total: 8 });
    expect(model.pageDetail?.cells).toEqual([
      {
        id: 'freehold_timber_bed',
        kind: 'item',
        index: 0,
        owned: true,
        sourcePlans: [{ kind: 'vendor', npcId: 'freehold_furnisher' }],
      },
    ]);
    expect(model.recent[0]).toMatchObject({ id: 'freehold_timber_bed', pageId: 'hearth_basics' });
    expect(model.shelfCards[0]).toMatchObject({
      shelf: 'hearth',
      owned: 1,
      total: 8,
      recentId: 'freehold_timber_bed',
    });
  });

  it('uses the existing page pin, completion, and prune rules for an authored Hearth page', () => {
    const itemsDiscovered = new Set(['freehold_timber_bed']);
    const completion = (id: string) =>
      id === HEARTH.id ? pageCompletion(HEARTH, { itemsDiscovered }) : null;
    const pinned = toggleReliquaryPin(new Set(), HEARTH.id).pinned;
    const out = makeReliquaryTrackerView();
    buildReliquaryTrackerViewInto(out, {
      pinned,
      pageIds: [HEARTH.id],
      completion,
      ownershipSig: () => itemsDiscovered.size,
      collapsed: false,
      enabled: true,
    });
    expect(out.count).toBe(1);
    expect(out.lines[0]).toMatchObject({ pageId: 'hearth_basics', owned: 1, total: 8 });
    expect(pruneReliquaryPins(pinned, completion)).toEqual({ pinned, changed: false });
    for (const id of ITEM_IDS) itemsDiscovered.add(id);
    expect(completion(HEARTH.id)).toEqual({ owned: 8, total: 8, complete: true });
    expect([...pruneReliquaryPins(pinned, completion).pinned]).toEqual([]);
    expect(completion('unknown_hearth_page')).toBeNull();
  });
});
