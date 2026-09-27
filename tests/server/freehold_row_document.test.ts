// The durable row turned back into the document the load normalizer reads, and
// the wire revision's one narrowing, driven directly now that both are their own
// module. The store suite reaches them through a load; this pins each field.

import { describe, expect, it } from 'vitest';
import { representableRev, rowDocument } from '../../server/freehold_row_document';

describe('representableRev', () => {
  it('admits exactly the revisions a JS number carries without loss', () => {
    expect(representableRev('0')).toBe(true);
    expect(representableRev(String(Number.MAX_SAFE_INTEGER))).toBe(true);
    // One past the safe range is the row the store must HOLD, never repair.
    expect(representableRev('9007199254740992')).toBe(false);
    expect(representableRev('not a number')).toBe(false);
  });
});

describe('rowDocument', () => {
  it('maps every column onto the document field the normalizer reads', () => {
    const layout = [{ placementId: 1, itemId: 'oak_chair', x: 1.5, y: 0, z: -2.25, yaw: 0 }];
    const trophies = [{ plinth: 0, trophyId: 'skull_of_something' }];
    expect(
      rowDocument({
        schemaVersion: 1,
        plotId: 'plot:rowdocument01',
        tier: 'cottage',
        layout,
        trophies,
        condition: 87,
        visitPolicy: 'friends',
        wireRev: '12',
      }),
    ).toEqual({
      version: 1,
      plotId: 'plot:rowdocument01',
      tier: 'cottage',
      layout,
      trophies,
      condition: 87,
      visitPolicy: 'friends',
      rev: 12,
    });
  });
});
