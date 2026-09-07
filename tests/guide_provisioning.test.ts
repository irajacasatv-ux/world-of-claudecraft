import { afterEach, describe, expect, it } from 'vitest';
import { GUIDE_PROF_PROVISIONING } from '../src/guide/content.generated';
import { provisioningDetailHtml } from '../src/guide/pages/professions_provisioning';
import { ITEMS } from '../src/sim/data';
import { getLanguage, setLanguage } from '../src/ui/i18n';

const originalLanguage = getLanguage();
afterEach(() => setLanguage(originalLanguage));

function render(): string {
  setLanguage('en');
  return provisioningDetailHtml();
}

describe('provisioning guide furnishing outputs', () => {
  it('classifies every generated cooking output from its live item kind', () => {
    const outputs = GUIDE_PROF_PROVISIONING.ladder.flatMap((rung) => rung.outputs);
    expect(outputs.filter((output) => ITEMS[output.itemId]?.kind === 'furnishing')).toEqual([
      {
        itemId: 'freehold_set_supper_table',
        placeable: false,
        station: false,
        furnishing: true,
      },
    ]);
    for (const output of outputs) {
      expect(ITEMS[output.itemId], output.itemId).toBeDefined();
      expect(output, output.itemId).toMatchObject({
        furnishing: ITEMS[output.itemId].kind === 'furnishing',
      });
    }
  });

  it('renders the actual supper table as ornamental and describes its lack of food or buffs', () => {
    const html = render();
    expect(html).toContain('<li>Set Supper Table (ornamental furnishing, not eaten)</li>');
    expect(html).not.toContain('<li>Set Supper Table</li>');
    expect(html).toContain('Furnishings decorate a Freehold and give no food or buff.');
    expect(html).not.toContain('The early rungs are single dishes you eat from your bags.');
    expect(html).toContain('<li>Marlow&#39;s Grand Roast</li>');
    expect(html).toContain('<li>Warspice Feast (placed, not eaten)</li>');
    expect(html).toContain('<li>The Laden Hearth (field station)</li>');
  });

  it('renders the furnishing classification for another item without a supper-table special case', () => {
    const outputs = GUIDE_PROF_PROVISIONING.ladder[0].outputs;
    const originalLength = outputs.length;
    const furnishing = {
      itemId: 'freehold_weapon_rack',
      placeable: false,
      station: false,
      furnishing: true,
    };
    outputs.push(furnishing);
    try {
      expect(render()).toContain('<li>Weapon Rack (ornamental furnishing, not eaten)</li>');
    } finally {
      outputs.length = originalLength;
    }
  });
});
