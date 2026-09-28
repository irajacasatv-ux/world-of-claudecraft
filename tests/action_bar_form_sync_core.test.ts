// The per-frame action-bar form sync's decision (hotbarSyncOutcome, extracted
// from Hud.syncActiveHotbarForm). The decision half of the three form-sync
// cases in tests/action_bar_hud_facade.test.ts moved here: which syncs run, in
// which order, and what each combination owes the HUD. The Hud's application
// of the outcome (the spellbook refresh, the drag drop and the page re-clamp,
// all Hud fields) is its one coordinator case, in
// tests/hud_window_coordination.test.ts.

import { describe, expect, it } from 'vitest';
import {
  type HotbarFormSyncSources,
  hotbarSyncOutcome,
} from '../src/ui/hud/action_bar/action_bar_form_sync_core';

function sources(profileSwitched: boolean, specSwitched: boolean, formSwapped: boolean) {
  const calls: string[] = [];
  const src: HotbarFormSyncSources = {
    syncProfile: () => {
      calls.push('profile');
      return profileSwitched;
    },
    syncSpec: () => {
      calls.push('spec');
      return specSwitched;
    },
    syncActiveForm: () => {
      calls.push('form');
      return formSwapped;
    },
  };
  return { src, calls };
}

describe('hotbarSyncOutcome', () => {
  it('a form swap alone re-clamps without a spellbook refresh', () => {
    const { src, calls } = sources(false, false, true);
    expect(hotbarSyncOutcome(src)).toBe('formSwapped');
    // All three ran, the form sync last.
    expect(calls).toEqual(['profile', 'spec', 'form']);
  });

  it('a surface flip rebuilds and skips the form sync (the reload loaded the form)', () => {
    const { src, calls } = sources(true, false, true);
    expect(hotbarSyncOutcome(src)).toBe('rebuilt');
    // The spec sync still runs beside the profile sync; no second form sync.
    expect(calls).toEqual(['profile', 'spec']);
  });

  it('a spec switch rebuilds the same way', () => {
    const { src, calls } = sources(false, true, true);
    expect(hotbarSyncOutcome(src)).toBe('rebuilt');
    expect(calls).toEqual(['profile', 'spec']);
  });

  it('owes nothing when neither the surface, the spec nor the form changed', () => {
    const { src, calls } = sources(false, false, false);
    expect(hotbarSyncOutcome(src)).toBe('unchanged');
    expect(calls).toEqual(['profile', 'spec', 'form']);
  });
});
