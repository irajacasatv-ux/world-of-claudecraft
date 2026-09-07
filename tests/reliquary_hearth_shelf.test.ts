import { describe, expect, it } from 'vitest';
import { RELIQUARY_PAGES, type ReliquaryPageDef } from '../src/sim/content/reliquary';
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

// Existing item ids exercise the shelf seam without authoring unfinished furnishings.
const HEARTH: ReliquaryPageDef = {
  id: 'hearth_fixture',
  shelf: 'hearth',
  name: 'Synthetic Hearth Page',
  clearSource: { kind: 'none' },
  sourceDefault: { sourceKind: 'vendor', sourceId: 'farmer_jessica' },
  relics: [
    { kind: 'item', itemId: 'field_kit' },
    { kind: 'item', itemId: 'linen_pouch' },
  ],
};

describe('prepared Hearth shelf support', () => {
  it('declares Hearth last while keeping unauthored shelves out of player navigation', () => {
    expect(RELIQUARY_NAV).toEqual(['overview', 'conquerors', 'professions', 'horizons', 'hearth']);
    expect(RELIQUARY_SHELF_ORDER).toEqual(['conquerors', 'professions', 'horizons', 'hearth']);
    expect(reliquaryVisibleNav(RELIQUARY_PAGES)).toEqual([
      'overview',
      'conquerors',
      'professions',
      'horizons',
    ]);
    expect(RELIQUARY_PAGES.some((page) => page.id === 'hearth_basics')).toBe(false);
    expect(reliquaryVisibleNav([])).toEqual(['overview']);
    expect(reliquaryVisibleNav([HEARTH])).toEqual(['overview', 'hearth']);
  });

  it('adds an authored Hearth card and rail total without depending on discoveries', () => {
    const model = buildReliquaryView({
      pages: [...RELIQUARY_PAGES, HEARTH],
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
      total: 2,
      recentId: null,
      recentKind: null,
    });
    expect(model.shelves.at(-1)).toEqual({ id: 'hearth', owned: 0, total: 2 });
  });

  it('carries Hearth ownership, localized search, recent jumps, and source plans through the existing view', () => {
    const model = buildReliquaryView({
      pages: [HEARTH],
      itemsDiscovered: new Set(['field_kit']),
      marks: new Set(),
      recent: ['field_kit'],
      nav: 'hearth',
      pageId: HEARTH.id,
      search: 'translated name',
      pageSearchText: () => '',
      relicSearchText: (_kind, id) => (id === 'field_kit' ? 'translated name' : 'other name'),
    });
    expect(model.shelfPages.map((page) => page.pageId)).toEqual(['hearth_fixture']);
    expect(model.activePage).toMatchObject({ pageId: 'hearth_fixture', owned: 1, total: 2 });
    expect(model.pageDetail?.cells).toEqual([
      {
        id: 'field_kit',
        kind: 'item',
        index: 0,
        owned: true,
        sourcePlans: [{ kind: 'vendor', npcId: 'farmer_jessica' }],
      },
    ]);
    expect(model.recent[0]).toMatchObject({ id: 'field_kit', pageId: 'hearth_fixture' });
    expect(model.shelfCards[0]).toMatchObject({
      shelf: 'hearth',
      owned: 1,
      total: 2,
      recentId: 'field_kit',
    });
  });

  it('uses the existing page pin, completion, and prune rules for an authored Hearth page', () => {
    const itemsDiscovered = new Set(['field_kit']);
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
    expect(out.lines[0]).toMatchObject({ pageId: 'hearth_fixture', owned: 1, total: 2 });
    expect(pruneReliquaryPins(pinned, completion)).toEqual({ pinned, changed: false });
    itemsDiscovered.add('linen_pouch');
    expect(completion(HEARTH.id)).toEqual({ owned: 2, total: 2, complete: true });
    expect([...pruneReliquaryPins(pinned, completion).pinned]).toEqual([]);
    expect(completion('hearth_basics')).toBeNull();
  });
});
