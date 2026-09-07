import { describe, expect, it, vi } from 'vitest';

// The lookup keeps its first catalog scan. Insert malformed synthetic content
// ahead of shipped charms before the tooltip module can fill that cache.
vi.mock('../src/sim/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/sim/data')>();
  const { FURNISHING } = await import('./fixtures/furnishing_item');
  return {
    ...actual,
    ITEMS: {
      probe_furnishing_catalog_effect: {
        ...FURNISHING,
        id: 'probe_furnishing_catalog_effect',
        quality: 'legendary',
        use: { type: 'toolEffect', effectId: 'quickening_charm' },
      },
      probe_furnishing_live_effect: {
        ...FURNISHING,
        id: 'probe_furnishing_live_effect',
        quality: 'legendary',
        use: { type: 'toolEffect', effectId: 'makers_charm' },
      },
      ...actual.ITEMS,
    },
  };
});

import { toolEffectStandaloneTooltip } from '../src/ui/tool_effect_tooltip';

describe('furnishing records cannot supply profession effect card rarity', () => {
  it('keeps the catalog-only rare title while a real charm still supplies its epic title', () => {
    const catalogCard = toolEffectStandaloneTooltip('quickening_charm');
    expect(catalogCard).toContain(
      '<div class="tt-title" style="color:#0070dd">Springback Charm</div>',
    );
    expect(catalogCard).not.toContain('color:#ff8000');
    expect(catalogCard).toContain('Shortens the node respawn timer it triggers.');

    expect(toolEffectStandaloneTooltip('makers_charm')).toContain(
      '<div class="tt-title" style="color:#a335ee">Maker&#39;s Charm</div>',
    );
  });

  it('skips a furnishing before the real matching charm during the cached lookup', () => {
    const liveCard = toolEffectStandaloneTooltip('makers_charm');
    expect(liveCard).toContain(
      '<div class="tt-title" style="color:#a335ee">Maker&#39;s Charm</div>',
    );
    expect(liveCard).not.toContain('color:#ff8000');
    expect(liveCard).toContain('+2 yield per harvest while charged, or +1 on a farming tool.');

    expect(toolEffectStandaloneTooltip('gatherers_cache')).toContain(
      '<div class="tt-title" style="color:#0070dd">Gatherer&#39;s Cache</div>',
    );
  });
});
