// @vitest-environment happy-dom

// The real drain wiring of the faction standing tier celebration, through the
// CelebrationDrainObserver the Hud handleEvents tail delegates to: the
// observer rides the professions sync flag, baselines silently on the first
// synced drain, plates and logs a later tier crossing through the celebration
// host (the celebration rig: a real BannerSlot), and stays quiet on a gain
// inside a tier.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { STANDING_THRESHOLDS } from '../src/sim/factions';
import {
  CelebrationDrainObserver,
  type CelebrationDrainWorld,
} from '../src/ui/hud/professions/celebration_drain_observer';
import { type CelebrationRig, celebrationRig } from './helpers/celebration_rig';

interface DrainHarness {
  sim: {
    playerId: number;
    craftingIdentity: { synced: boolean };
    craftSkills: Record<string, number>;
    gatheringProficiency: Record<string, number>;
    factions: Record<string, number>;
  };
  bannerEl: HTMLElement;
  log: CelebrationRig['log'];
  combatAnnouncer: CelebrationRig['combatAnnouncer'];
  observer: CelebrationDrainObserver;
  /** One empty drain's tail: what Hud.handleEvents([]) hands the observer
   *  (no masterwork proc, no deed unlock). */
  drain(): void;
}

function drainHud(synced: boolean): DrainHarness {
  const rig = celebrationRig();
  const observer = new CelebrationDrainObserver();
  const hud: DrainHarness = {
    sim: {
      playerId: 1,
      craftingIdentity: { synced },
      craftSkills: {},
      gatheringProficiency: {},
      factions: { rift_watch: 0, church_order: 0, automatons: 0 },
    },
    bannerEl: rig.bannerEl,
    log: rig.log,
    combatAnnouncer: rig.combatAnnouncer,
    observer,
    drain: () =>
      observer.observe(hud.sim as unknown as CelebrationDrainWorld, null, false, () => rig.host),
  };
  return hud;
}

describe('faction tier celebration: the drain wiring', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('baselines silently, then plates a later tier crossing and logs it', () => {
    vi.useFakeTimers();
    const achievement = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const hud = drainHud(true);
    hud.sim.factions = { rift_watch: STANDING_THRESHOLDS.trusted, church_order: 0, automatons: 0 };

    // Drain 1: the first synced observation is history, never a toast.
    hud.drain();
    expect(hud.log).not.toHaveBeenCalled();
    expect(achievement).not.toHaveBeenCalled();

    // The mirror updates (the online path replaces the object wholesale).
    hud.sim.factions = { rift_watch: STANDING_THRESHOLDS.proven, church_order: 0, automatons: 0 };
    hud.drain();
    expect(hud.log).toHaveBeenCalledTimes(1);
    expect(hud.log).toHaveBeenCalledWith(
      'You are now Proven with the Rift Watch. Your faction title is now Warden.',
      '#ffd100',
    );
    expect(hud.bannerEl.classList.contains('banner-deed')).toBe(true);
    expect(hud.bannerEl.textContent).toContain('Now Proven with the Rift Watch');
    expect(hud.bannerEl.textContent).toContain('Faction title: Warden');
    expect(hud.combatAnnouncer.push).toHaveBeenCalledTimes(1);
    expect(achievement).toHaveBeenCalledTimes(1);

    // Drain 3: a gain inside the tier is silent.
    hud.sim.factions = {
      rift_watch: STANDING_THRESHOLDS.proven + 80,
      church_order: 0,
      automatons: 0,
    };
    hud.drain();
    expect(hud.log).toHaveBeenCalledTimes(1);
    expect(achievement).toHaveBeenCalledTimes(1);
  });

  it('never baselines on the pre-mirror default (unsynced), so the first real snapshot is history too', () => {
    const achievement = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const hud = drainHud(false);
    hud.drain();
    expect(hud.observer.prevFactionStanding).toBeNull();
    hud.sim.craftingIdentity = { synced: true };
    hud.sim.factions = { rift_watch: STANDING_THRESHOLDS.champion, church_order: 0, automatons: 0 };
    hud.drain();
    expect(hud.log).not.toHaveBeenCalled();
    expect(achievement).not.toHaveBeenCalled();
    expect(hud.observer.prevFactionStanding?.rift_watch).toBe(STANDING_THRESHOLDS.champion);
  });
});
