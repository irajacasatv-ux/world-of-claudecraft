// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RELIQUARY_PAGES, RELIQUARY_PAGES_BY_ID } from '../src/sim/content/reliquary';
import { catalogRelicCompletion, pageCompletion } from '../src/sim/reliquary';
import { setLanguage } from '../src/ui/i18n';
import { ReliquaryWindow, type ReliquaryWindowDeps } from '../src/ui/reliquary_window';

// The real open() method reads the imported catalog before building its view.
// Omit Hearth at that boundary in this isolated suite; a prebuilt render input
// cannot exercise unavailable-shelf admission or its focus destination.
vi.mock('../src/sim/content/reliquary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/sim/content/reliquary')>();
  const pages = Object.freeze(actual.RELIQUARY_PAGES.filter((page) => page.shelf !== 'hearth'));
  return {
    ...actual,
    RELIQUARY_PAGES: pages,
    RELIQUARY_PAGE_ORDER: Object.freeze(pages.map((page) => page.id)),
    RELIQUARY_PAGES_BY_ID: Object.freeze(Object.fromEntries(pages.map((page) => [page.id, page]))),
  };
});

// happy-dom has no canvas compositor; leave every non-raster icon export real.
vi.mock('../src/ui/icons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/ui/icons')>()),
  iconDataUrl: (kind: string, id: string) => `data:,${kind}:${id}`,
}));

const windows: ReliquaryWindow[] = [];

function makeWindow() {
  const root = document.createElement('div');
  const opener = document.createElement('button');
  document.body.append(opener, root);
  const ownership = {
    itemsDiscovered: new Set<string>(),
    marks: new Set<string>(),
    deedsEarned: new Map<string, string>(),
  };
  const deps: ReliquaryWindowDeps = {
    root: () => root,
    world: () =>
      ({
        cfg: { playerClass: 'warrior' },
        player: { name: 'Shelfreader' },
        deedStats: { itemsDiscovered: ownership.itemsDiscovered, counters: {} },
        reliquaryMarks: ownership.marks,
        reliquaryRecent: [],
        reliquaryFirstFind: {},
        reliquaryObtainCounts: {},
        // The release's account ledger reads (src/ui/reliquary_window.ts).
        accountDeeds: new Map(),
        reliquaryAccountFinds: new Map(),
        ownedMounts: () => [],
        accountCosmetics: { weaponSkinIds: [] },
        deedsEarned: ownership.deedsEarned,
        reliquaryPageClearCount: () => undefined,
        reliquaryCatalogCompletion: () => catalogRelicCompletion(ownership, RELIQUARY_PAGES),
        reliquaryCuratorRank: () => 0,
        reliquaryRarity: async () => null,
        reliquaryPageCompletion: (id: string) => {
          const page = RELIQUARY_PAGES_BY_ID[id];
          return page ? pageCompletion(page, ownership) : null;
        },
      }) as never,
    closeOthers: () => {},
    hideTooltip: () => {},
    consumePeek: () => false,
    captureFocus: () => opener,
    restoreFocus: (target) => target?.focus(),
    onPinChanged: () => {},
    trackerShown: () => true,
    setTrackerShown: () => {},
    itemIcon: () => '',
    moneyHtml: () => '',
    itemTooltip: () => '',
    attachTooltip: () => {},
  };
  const window = new ReliquaryWindow(deps);
  windows.push(window);
  return { window, root };
}

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  setLanguage('en');
});

afterEach(() => {
  for (const window of windows.splice(0)) window.close();
  setLanguage('en');
});

describe('ReliquaryWindow unavailable shelf admission', () => {
  it.each([false, true])(
    'routes an unavailable Hearth link to Overview (already open: %s)',
    async (alreadyOpen) => {
      const original = await vi.importActual<typeof import('../src/sim/content/reliquary')>(
        '../src/sim/content/reliquary',
      );
      expect(
        original.RELIQUARY_PAGES.filter((page) => page.shelf === 'hearth').map((page) => page.id),
      ).toEqual(['hearth_basics', 'hearth_first_crafts']);
      expect(Object.isFrozen(original.RELIQUARY_PAGES)).toBe(true);
      expect(RELIQUARY_PAGES.some((page) => page.shelf === 'hearth')).toBe(false);
      expect(RELIQUARY_PAGES).toHaveLength(original.RELIQUARY_PAGES.length - 2);
      const { window, root } = makeWindow();
      if (alreadyOpen) {
        window.open('conquerors');
        expect(root.querySelector('[data-nav="conquerors"]')?.getAttribute('aria-pressed')).toBe(
          'true',
        );
      }

      window.open('hearth');

      expect(root.querySelector('[data-nav="hearth"]')).toBeNull();
      expect(root.querySelector('[data-page="hearth_basics"]')).toBeNull();
      expect(root.querySelector('[data-page="hearth_first_crafts"]')).toBeNull();
      const overview = root.querySelector<HTMLElement>('.reliquary-rail [data-nav="overview"]');
      expect(overview).not.toBeNull();
      expect(overview?.getAttribute('aria-pressed')).toBe('true');
      expect(document.activeElement).toBe(overview);
      expect((document.activeElement as HTMLElement).dataset.focusKey).toBe('nav:overview');
      expect(
        [...root.querySelectorAll<HTMLElement>('.reliquary-shelf-card')].map(
          (card) => card.dataset.nav,
        ),
      ).toEqual(['conquerors', 'professions', 'horizons']);
      expect(root.querySelector('.reliquary-page-title')).toBeNull();
      expect(original.RELIQUARY_PAGES_BY_ID.hearth_basics).toBeDefined();
    },
  );
});
