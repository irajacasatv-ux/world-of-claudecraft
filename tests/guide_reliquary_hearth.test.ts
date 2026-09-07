import { describe, expect, it } from 'vitest';
import { GUIDE_RELIQUARY } from '../src/guide/content.generated';
import { reliquaryCatalogSections } from '../src/guide/pages/reliquary';
import { t } from '../src/ui/i18n';

// The generator and the live catalog must agree; no synthetic furnishing page
// can make this test pass while wiki generation omits the actual content.
describe('wiki Hearth shelf', () => {
  it('lists the authored household furnishings on its real page', () => {
    expect(GUIDE_RELIQUARY.filter((page) => page.shelf === 'hearth')).toEqual([
      {
        id: 'hearth_basics',
        shelf: 'hearth',
        name: 'Hearth Basics',
        relics: [
          { kind: 'item', name: 'Timber Bed' },
          { kind: 'item', name: 'Round Table' },
          { kind: 'item', name: 'Spindle Chair' },
          { kind: 'item', name: 'Low Stool' },
          { kind: 'item', name: 'Woven Rug' },
          { kind: 'item', name: 'Brass Lantern' },
          { kind: 'item', name: 'Storage Chest' },
          { kind: 'item', name: 'Open Bookshelf' },
        ],
      },
    ]);
    const html = reliquaryCatalogSections(GUIDE_RELIQUARY);
    expect(html).toContain('id="reliquary-shelf-hearth"');
    expect(html).toContain('id="reliquary-hearth_basics"');
    expect(html).toContain(t('guide.reliquaryPage.shelf.hearth'));
    expect(html.indexOf('id="reliquary-shelf-hearth"')).toBeGreaterThan(
      html.indexOf('id="reliquary-shelf-horizons"'),
    );
    expect(html).toContain('Timber Bed');
    expect(html).toContain('Open Bookshelf');
  });

  it('omits an empty Hearth shelf when rendering an empty catalog', () => {
    expect(reliquaryCatalogSections([])).not.toContain('reliquary-shelf-hearth');
  });
});
