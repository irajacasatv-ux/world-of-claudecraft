// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RELIQUARY_PAGES, RELIQUARY_PAGES_BY_ID } from '../src/sim/content/reliquary';
import { catalogRelicCompletion, pageCompletion } from '../src/sim/reliquary';
import { tEntity } from '../src/ui/entity_i18n';
import { esc } from '../src/ui/esc';
import { ensureLocaleLoaded, formatNumber, setLanguage, t } from '../src/ui/i18n';
import { reliquaryPageName } from '../src/ui/reliquary_i18n';
import { reliquaryRelicDisplayName } from '../src/ui/reliquary_labels';
import { ReliquaryWindow, type ReliquaryWindowDeps } from '../src/ui/reliquary_window';

// Append a test-only page through module injection; the frozen shipping catalog
// and its item/vendor definitions are never mutated or replaced.
vi.mock('../src/sim/content/reliquary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/sim/content/reliquary')>();
  const page: (typeof actual.RELIQUARY_PAGES)[number] = {
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
  return {
    ...actual,
    RELIQUARY_PAGES: Object.freeze([...actual.RELIQUARY_PAGES, page]),
    RELIQUARY_PAGES_BY_ID: Object.freeze({ ...actual.RELIQUARY_PAGES_BY_ID, [page.id]: page }),
  };
});

// happy-dom has no canvas compositor. Preserve real art classification and
// every other icon export; only the procedural raster output is substituted.
vi.mock('../src/ui/icons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/ui/icons')>()),
  iconDataUrl: (kind: string, id: string) => `data:,${kind}:${id}`,
}));

const PAGE = 'hearth_fixture';
const windows: ReliquaryWindow[] = [];
const must = (root: HTMLElement, selector: string): HTMLElement => {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing test surface: ${selector}`);
  return node;
};
const fmt = (value: number) => formatNumber(value, { maximumFractionDigits: 0 });
const vendorSource = () =>
  t('hudChrome.reliquary.sourceVendor', {
    vendor: tEntity({ kind: 'npc', id: 'farmer_jessica', field: 'name' }),
  });

function makeWindow() {
  const root = document.createElement('div');
  const opener = document.createElement('button');
  document.body.append(opener, root);
  const itemsDiscovered = new Set(['field_kit']);
  const ownership = {
    itemsDiscovered,
    marks: new Set<string>(),
    deedsEarned: new Map<string, string>(),
  };
  const tooltips = new Map<HTMLElement, () => string>();
  let trackerShown = true;
  const deps: ReliquaryWindowDeps = {
    root: () => root,
    world: () =>
      ({
        cfg: { playerClass: 'warrior' },
        player: { name: 'Hearthreader' },
        deedStats: { itemsDiscovered, counters: {} },
        reliquaryMarks: ownership.marks,
        reliquaryRecent: [],
        reliquaryFirstFind: {},
        reliquaryObtainCounts: {},
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
    trackerShown: () => trackerShown,
    setTrackerShown: (shown) => {
      trackerShown = shown;
    },
    itemIcon: (item) => `<img data-item-icon="${item.id}" alt="">`,
    moneyHtml: () => '',
    itemTooltip: (item) => `<b>${esc(reliquaryRelicDisplayName('item', item.id))}</b>`,
    attachTooltip: (node, html) => {
      tooltips.set(node, html);
    },
  };
  const window = new ReliquaryWindow(deps);
  windows.push(window);
  return { window, root, tooltips };
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

describe('ReliquaryWindow with an authored Hearth fixture', () => {
  it('opens Hearth, follows its page and back route, and routes its Overview card with keyboard focus', () => {
    const { window, root } = makeWindow();
    window.open('hearth');
    const nav = must(root, '.reliquary-rail [data-nav="hearth"]');
    expect(nav.textContent).toContain(t('hudChrome.reliquary.navHearth'));
    expect(nav.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(nav);
    expect(nav.dataset.focusKey).toBe('nav:hearth');
    expect(must(root, '.reliquary-page-list').getAttribute('aria-label')).toBe(
      t('hudChrome.reliquary.navHearth'),
    );
    must(root, `[data-page="${PAGE}"]`).click();
    expect(must(root, '.reliquary-page-title').textContent).toBe(reliquaryPageName(PAGE));
    expect(must(root, '.reliquary-rail [data-nav="hearth"]').getAttribute('aria-pressed')).toBe(
      'true',
    );
    must(root, '[data-back]').click();
    expect(must(root, '.reliquary-page-list').getAttribute('aria-label')).toBe(
      t('hudChrome.reliquary.navHearth'),
    );
    expect(root.querySelector('.reliquary-page-title')).toBeNull();

    window.open('overview');
    const card = must(root, '.reliquary-shelf-card[data-nav="hearth"]');
    expect(card.getAttribute('aria-label')).toBe(
      t('hudChrome.reliquary.shelfOpenAria', {
        name: t('hudChrome.reliquary.navHearth'),
        owned: fmt(1),
        total: fmt(2),
      }),
    );
    expect(must(card, '.reliquary-shelf-card-name').textContent).toBe(
      t('hudChrome.reliquary.navHearth'),
    );
    card.focus();
    card.click();
    expect((document.activeElement as HTMLElement).dataset.focusKey).toBe('nav:hearth');
    expect(must(root, `[data-page="${PAGE}"]`)).toBeDefined();
    expect(root.querySelector('.reliquary-shelf-cards')).toBeNull();
  });

  it('shows vendor hunting directions on missing cells in both tooltip and aria, and omits them once owned', () => {
    const { window, root, tooltips } = makeWindow();
    window.openWithPage(PAGE);
    const owned = must(root, '[data-cell-id="field_kit"]');
    const missing = must(root, '[data-cell-id="linen_pouch"]');
    expect(owned.dataset.cellOwned).toBe('1');
    expect(missing.dataset.cellOwned).toBe('0');
    expect(missing.dataset.cellSource).toBe('1');
    const source = vendorSource();
    expect(source).toContain(tEntity({ kind: 'npc', id: 'farmer_jessica', field: 'name' }));
    expect(tooltips.has(missing)).toBe(true);
    expect(tooltips.get(missing)?.()).toContain(esc(source));
    expect(missing.getAttribute('aria-label')).toBe(
      t('hudChrome.reliquary.cellMissingSourceAria', {
        name: reliquaryRelicDisplayName('item', 'linen_pouch'),
        source,
      }),
    );
    expect(tooltips.has(owned)).toBe(true);
    expect(tooltips.get(owned)?.()).not.toContain(esc(source));
    expect(owned.hasAttribute('data-cell-source')).toBe(false);
    expect(owned.getAttribute('aria-label')).toBe(
      t('hudChrome.reliquary.cellOwnedAria', {
        name: reliquaryRelicDisplayName('item', 'field_kit'),
      }),
    );
  });

  it('repaints the open Hearth shelf and its source labels through the real Japanese language channel', async () => {
    const { window, root, tooltips } = makeWindow();
    window.open('hearth');
    const english = must(root, '.reliquary-page-list').getAttribute('aria-label');
    await ensureLocaleLoaded('ja_JP');
    setLanguage('ja_JP');
    // render() is the public method the HUD language fan-out invokes.
    window.render();
    const translated = t('hudChrome.reliquary.navHearth');
    expect(translated).not.toBe(english);
    expect(must(root, '.reliquary-page-list').getAttribute('aria-label')).toBe(translated);
    expect(must(root, '.reliquary-rail [data-nav="hearth"]').textContent).toContain(translated);
    must(root, `[data-page="${PAGE}"]`).click();
    const missing = must(root, '[data-cell-id="linen_pouch"]');
    expect(tooltips.get(missing)?.()).toContain(esc(vendorSource()));
    expect(missing.getAttribute('aria-label')).toContain(vendorSource());
    must(root, '[data-back]').click();
    expect(must(root, '.reliquary-page-list').getAttribute('aria-label')).toBe(translated);
  });
});
