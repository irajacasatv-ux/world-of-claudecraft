import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { ItemDef } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';

const GEAR_ID = 'test_furnishing_event_gear';
const gear: ItemDef = {
  id: GEAR_ID,
  name: 'Event Control Sword',
  kind: 'weapon',
  quality: 'rare',
  sellValue: 1,
  slot: 'mainhand',
  weapon: { min: 1, max: 2, speed: 2 },
  heroicOf: 'worn_sword',
};
let localizeSimText: typeof import('../src/ui/sim_i18n').localizeSimText;

beforeAll(async () => {
  ITEMS[FURNISHING.id] = { ...FURNISHING, heroicOf: 'worn_sword' };
  ITEMS[GEAR_ID] = gear;
  // The reverse map is built at module evaluation, after the fixture exists.
  ({ localizeSimText } = await import('../src/ui/sim_i18n'));
});
afterAll(() => {
  delete ITEMS[FURNISHING.id];
  delete ITEMS[GEAR_ID];
});

describe('furnishing event identity', () => {
  it('keeps the authored furnishing name in shared English event text', () => {
    expect(localizeSimText('Unequipped Steel Side Table.')).toBe('Unequipped Steel Side Table.');
    expect(localizeSimText('Unequipped Event Control Sword.')).toBe(
      'Unequipped Pitted Shortsword.',
    );
  });
});
