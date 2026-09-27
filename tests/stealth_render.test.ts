import { describe, expect, it } from 'vitest';
import { shouldRenderStealthGhost } from '../src/render/stealth';

const entity = (overrides: any) => ({
  id: 1,
  kind: 'player',
  auras: [],
  ...overrides,
});

describe('stealth rendering policy', () => {
  it('renders stealthed players, the local one and detected others, as translucent ghosts', () => {
    const self = entity({ id: 7, auras: [{ kind: 'stealth' }] });
    expect(shouldRenderStealthGhost(7, self)).toBe(true);
    const detected = entity({ id: 8, auras: [{ kind: 'stealth' }] });
    expect(shouldRenderStealthGhost(7, detected)).toBe(true);
  });

  it('does not ghost unstealthed players or creatures', () => {
    expect(shouldRenderStealthGhost(7, entity({ id: 8 }))).toBe(false);
    expect(
      shouldRenderStealthGhost(7, entity({ id: 8, kind: 'mob', auras: [{ kind: 'stealth' }] })),
    ).toBe(false);
  });
});
