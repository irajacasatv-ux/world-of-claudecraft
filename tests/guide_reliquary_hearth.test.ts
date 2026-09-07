import { describe, expect, it } from 'vitest';
import { GUIDE_RELIQUARY, type GuideReliquaryPage } from '../src/guide/content.generated';
import { reliquaryCatalogSections } from '../src/guide/pages/reliquary';
import { t } from '../src/ui/i18n';

describe('wiki Hearth shelf readiness', () => {
  it('keeps Hearth absent while its item page remains unauthored', () => {
    expect(GUIDE_RELIQUARY.some((page) => page.shelf === 'hearth')).toBe(false);
    expect(reliquaryCatalogSections(GUIDE_RELIQUARY)).not.toContain('reliquary-shelf-hearth');
  });

  it('renders an authored Hearth page after the existing shelves through its localized heading', () => {
    const page: GuideReliquaryPage = {
      id: 'hearth_fixture',
      shelf: 'hearth',
      name: 'Synthetic Hearth Page',
      relics: [{ kind: 'item', name: 'Field Kit' }],
    };
    const html = reliquaryCatalogSections([...GUIDE_RELIQUARY, page]);
    expect(html).toContain('id="reliquary-shelf-hearth"');
    expect(html).toContain('id="reliquary-hearth_fixture"');
    expect(html).toContain(t('guide.reliquaryPage.shelf.hearth'));
    expect(html.indexOf('id="reliquary-shelf-hearth"')).toBeGreaterThan(
      html.indexOf('id="reliquary-shelf-horizons"'),
    );
    expect(html).toContain('Field Kit');
  });
});
