// The tracked-item provenance tooltip lines (src/ui/item_provenance_view.ts):
// origin wording keyed by the record's source, the previous-owner count only
// once a copy has changed hands, and the item ID line on every tracked copy.
import { describe, expect, it } from 'vitest';
import type { ItemInstancePayload } from '../src/sim/types';
import {
  itemProvenanceFacts,
  itemProvenanceLines,
  provenanceOriginKey,
} from '../src/ui/item_provenance_view';

const GUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const AT = Date.UTC(2026, 8, 30, 12, 0, 0);

function tracked(extra: Partial<ItemInstancePayload['provenance']> = {}): ItemInstancePayload {
  return {
    guid: GUID,
    provenance: { at: AT, by: 'Alice', byId: 101, source: 'mob:forest_wolf', ...extra },
  };
}

describe('provenanceOriginKey', () => {
  it('keys a kill, a quest reward, and everything else', () => {
    expect(provenanceOriginKey('mob:forest_wolf')).toBe('hudChrome.itemTooltip.lootedBy');
    expect(provenanceOriginKey('quest:q_wolves')).toBe('hudChrome.itemTooltip.questRewardTo');
    expect(provenanceOriginKey('vendor')).toBe('hudChrome.itemTooltip.obtainedBy');
    expect(provenanceOriginKey('craft:recipe_x')).toBe('hudChrome.itemTooltip.obtainedBy');
    expect(provenanceOriginKey('legacy')).toBe('hudChrome.itemTooltip.obtainedBy');
  });
});

describe('itemProvenanceLines', () => {
  it('renders nothing for an untracked payload or no payload', () => {
    expect(itemProvenanceLines(undefined)).toBe('');
    expect(itemProvenanceLines({ signer: 'Alice' })).toBe('');
  });

  it('renders the origin and the item ID for a fresh copy, no owner count', () => {
    const html = itemProvenanceLines(tracked());
    expect(html).toContain('Looted by Alice on ');
    expect(html).toContain(`Item ID: ${GUID}`);
    expect(html).not.toContain('Previous owners');
    expect(html).toContain('tt-item-guid');
  });

  it('adds the previous-owner count once the copy has changed hands', () => {
    const html = itemProvenanceLines(tracked({ owners: [{ at: AT, by: 'Bob' }], transfers: 3 }));
    expect(html).toContain('Previous owners: 3');
  });

  it('escapes the origin name', () => {
    const html = itemProvenanceLines(tracked({ by: '<b>' }));
    expect(html).toContain('&lt;b&gt;');
    expect(html).not.toContain('<b>');
  });

  it('exposes the plain facts with a localized date', () => {
    const facts = itemProvenanceFacts({ at: AT, by: 'Alice', source: 'quest:q_wolves' });
    expect(facts.origin.startsWith('Quest reward to Alice on ')).toBe(true);
    expect(facts.origin).toContain('2026');
    expect(facts.previousOwners).toBeNull();
  });

  it('renders the item ID alone for a copy whose record was dropped on load', () => {
    const html = itemProvenanceLines({ guid: GUID });
    expect(html).toContain(`Item ID: ${GUID}`);
    expect(html).not.toContain('by');
  });
});
