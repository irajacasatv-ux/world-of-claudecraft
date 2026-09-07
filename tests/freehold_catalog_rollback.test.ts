import { describe, expect, it, vi } from 'vitest';

const { additions } = vi.hoisted(() => ({
  additions: new Set([
    'freehold_timber_bed',
    'freehold_round_table',
    'freehold_spindle_chair',
    'freehold_low_stool',
    'freehold_woven_rug',
    'freehold_brass_lantern',
    'freehold_storage_chest',
    'freehold_open_bookshelf',
  ]),
}));

// Inject the prior catalog into the real restore/serialize implementations.
// This characterizes the documented destructive rollback boundary; it does
// not claim to execute an old binary or make mixed-catalog writers safe.
vi.mock('../src/sim/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/sim/data')>();
  return {
    ...actual,
    ITEMS: Object.fromEntries(Object.entries(actual.ITEMS).filter(([id]) => !additions.has(id))),
  };
});
vi.mock('../src/sim/content/reliquary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/sim/content/reliquary')>();
  const items = new Map([...actual.RELIQUARY_ITEM_TO_PAGES].filter(([id]) => !additions.has(id)));
  return {
    ...actual,
    RELIQUARY_ITEM_TO_PAGES: items,
    RELIQUARY_PAGES_BY_ID: Object.fromEntries(
      Object.entries(actual.RELIQUARY_PAGES_BY_ID).filter(([id]) => id !== 'hearth_basics'),
    ),
    isCataloguedRelicItem: (id: string) => items.has(id),
  };
});

import { restoreDeedStats, serializeDeedStats } from '../src/sim/deeds';
import { restoreReliquaryState, serializeReliquaryState } from '../src/sim/reliquary';

describe('Freehold catalog rollback characterization', () => {
  it('loses all new discoveries and Hearth metadata through a prior-catalog autosave', () => {
    const knownItem = 'cryptbone_greaves';
    const knownPage = 'conquerors_hollow_crypt';
    const saved = JSON.parse(
      JSON.stringify({
        deedStats: { itemsDiscovered: [knownItem, ...additions] },
        reliquary: {
          firstFind: Object.fromEntries([knownItem, ...additions].map((id) => [id, { count: 1 }])),
          illuminatedPages: [knownPage, 'hearth_basics'],
          recent: [knownItem, ...additions],
        },
      }),
    );
    const loadedStats = restoreDeedStats(saved.deedStats);
    const loadedRelics = restoreReliquaryState(saved.reliquary);
    expect([...loadedStats.itemsDiscovered]).toEqual([knownItem]);
    expect(loadedRelics.firstFind).toEqual({ [knownItem]: {} });
    expect(loadedRelics.counts).toEqual({ [knownItem]: 1 });
    expect([...loadedRelics.illuminatedPages]).toEqual([knownPage]);
    expect(loadedRelics.recent).toEqual([knownItem]);
    const rewritten = JSON.parse(
      JSON.stringify({
        deedStats: serializeDeedStats(loadedStats),
        reliquary: serializeReliquaryState(loadedRelics),
      }),
    );
    expect(rewritten).toEqual({
      deedStats: { itemsDiscovered: [knownItem] },
      reliquary: {
        firstFind: { [knownItem]: { count: 1 } },
        illuminatedPages: [knownPage],
        recent: [knownItem],
      },
    });
  });
});
