import { afterEach, describe, expect, it } from 'vitest';
import { MOUNTS } from '../src/sim/content/mounts';
import { ITEMS } from '../src/sim/data';
import type { MountItemDef } from '../src/sim/types';
import { setLanguage } from '../src/ui/i18n';
import { mountTooltipLines } from '../src/ui/mount_tooltip_view';

afterEach(() => setLanguage('en'));

describe('mountTooltipLines', () => {
  it('preserves the collectible reins description, mobility, and summon markup', () => {
    expect(mountTooltipLines(ITEMS.reins_valorsteed)).toBe(
      '<div class="tt-desc">A hardy, sure-footed steed that provides enhanced travel speed.</div>' +
        '<div class="tt-green">+60% extra mobility</div>' +
        '<div class="tt-sub">Use to summon this mount.</div>',
    );
  });

  it('rounds a different speed and permits a mount without a description key', () => {
    const original = MOUNTS.valorsteed;
    try {
      MOUNTS.valorsteed = {
        ...original,
        key: 'test_unlabeled_mount' as typeof original.key,
        moveSpeedPct: 0.755,
      };
      expect(mountTooltipLines(ITEMS.reins_valorsteed)).toBe(
        '<div class="tt-green">+76% extra mobility</div><div class="tt-sub">Use to summon this mount.</div>',
      );
    } finally {
      MOUNTS.valorsteed = original;
    }
  });

  it('renders nothing for non-mount items', () => {
    expect(mountTooltipLines(ITEMS.iron_ore)).toBe('');
  });

  it('renders nothing when a mount definition is absent', () => {
    const missing: MountItemDef = {
      ...(ITEMS.reins_valorsteed as MountItemDef),
      mount: 'probe_missing_mount' as MountItemDef['mount'],
    };
    expect(mountTooltipLines(missing)).toBe('');
  });
});
