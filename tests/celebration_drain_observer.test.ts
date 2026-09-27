// The drain tail's STATE-driven celebrations
// (src/ui/hud/professions/celebration_drain_observer.ts, extracted from the Hud
// handleEvents tail and its prev* fields), through a recorded host: a quiet
// drain never builds the host, a craft tier crossing waits for the post-craft
// armed window, a masterwork proc plates on its own, and a drain that already
// chimed (a deed unlock) stands the skill chime down. The skill and faction
// paths are driven end to end in tests/skill_level_toast_view.test.ts and
// tests/faction_tier_celebration_drain.test.ts. The Hud side (the tail's one
// call, the craftResult arming, the celebration host wiring) is pinned at
// source below.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { TIER_SKILL_STEP } from '../src/sim/professions/wheel';
import {
  CelebrationDrainObserver,
  type CelebrationDrainWorld,
} from '../src/ui/hud/professions/celebration_drain_observer';
import type { CraftCelebrationHost } from '../src/ui/hud/professions/craft_celebration_painter';
import { craftBannerText } from '../src/ui/hud/professions/craft_celebration_text_view';
import { CRAFT_TIER_UP_DRAIN_WINDOW } from '../src/ui/hud/professions/craft_celebration_view';
import { MASTERWORK_SEAL_IMAGE_URL } from '../src/ui/hud/professions/profession_art';
import { methodBody } from './helpers/method_body';
import { stripComments } from './helpers/strip_comments';

const T = TIER_SKILL_STEP;

function world(craftSkills: Record<string, number>, gathering: Record<string, number> = {}) {
  return {
    craftingIdentity: { synced: true },
    craftSkills,
    gatheringProficiency: gathering,
    factions: {},
  } as unknown as CelebrationDrainWorld;
}

function recordedHost() {
  const calls = {
    log: [] as string[],
    banners: [] as unknown[][],
    celebrations: [] as unknown[][],
  };
  const host: CraftCelebrationHost = {
    log: (text) => calls.log.push(text),
    showBanner: (...args) => calls.banners.push(args),
    showCelebrationBanner: (...args) => calls.celebrations.push(args),
    announce: () => {},
    reducedMotion: () => false,
  };
  const build = vi.fn(() => host);
  return { build, calls };
}

describe('CelebrationDrainObserver', () => {
  afterEach(() => vi.restoreAllMocks());

  it('never builds the host on a quiet drain (the tail runs every drain)', () => {
    const { build } = recordedHost();
    const observer = new CelebrationDrainObserver();
    // The silent synced baseline, then two unchanged drains.
    for (let i = 0; i < 3; i++) observer.observe(world({ cooking: 3 }), null, false, build);
    expect(build).not.toHaveBeenCalled();
    expect(observer.prevCraftSkills).toEqual({ cooking: 3 });
  });

  it('holds a craft tier crossing until a craft result arms the window', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { build, calls } = recordedHost();
    const observer = new CelebrationDrainObserver();
    observer.observe(world({ cooking: T - 1 }), null, false, build);
    // Disarmed: the floor climb logs its skill line, but no tier plate yet.
    observer.observe(world({ cooking: T }), null, false, build);
    expect(calls.banners).toEqual([]);
    observer.armCraftTierUps();
    expect(observer.craftTierUpDrains).toBe(CRAFT_TIER_UP_DRAIN_WINDOW);
    observer.observe(world({ cooking: T }), null, false, build);
    const plate = craftBannerText({ kind: 'tierUp', craftId: 'cooking', toTier: 1 });
    expect(calls.banners).toEqual([[plate, true, undefined]]);
    // The crossing disarms the window.
    expect(observer.craftTierUpDrains).toBe(0);
  });

  it("plates the drain's masterwork proc with the seal, tier-ups or not", () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { build, calls } = recordedHost();
    const observer = new CelebrationDrainObserver();
    observer.observe(world({}), 'iron_sword', false, build);
    const plate = craftBannerText({ kind: 'masterwork', itemId: 'iron_sword' });
    expect(calls.banners).toEqual([[plate, true, MASTERWORK_SEAL_IMAGE_URL]]);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('stands the skill chime down when the drain already chimed for a deed', () => {
    const chime = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const { build, calls } = recordedHost();
    const deedDrain = new CelebrationDrainObserver();
    deedDrain.observe(world({}, { mining: 24 }), null, false, build);
    deedDrain.observe(world({}, { mining: 25 }), null, true, build);
    expect(calls.celebrations).toHaveLength(1);
    expect(chime).not.toHaveBeenCalled();
    const quietDrain = new CelebrationDrainObserver();
    quietDrain.observe(world({}, { mining: 24 }), null, false, build);
    quietDrain.observe(world({}, { mining: 25 }), null, false, build);
    expect(chime).toHaveBeenCalledTimes(1);
  });
});

describe('the Hud side of the drain (source pins)', () => {
  const hud = stripComments(readFileSync(join(__dirname, '../src/ui/hud.ts'), 'utf8'));

  it('the handleEvents tail hands the drain facts to the observer, once', () => {
    expect(
      hud.match(
        /this\.celebrationDrain\.observe\(sim, masterworkItemId, deedUnlocks\.length > 0, \(\) =>\s*this\.celebrationHost\(\),?\s*\);/g,
      ),
    ).toHaveLength(1);
    expect(hud).toContain('masterworkItemId = ev.itemId;');
  });

  it('the craftResult arm arms the tier-up window, and nothing else does', () => {
    const arm = hud.slice(
      hud.indexOf("case 'craftResult': {"),
      hud.indexOf("case 'masterwork': {"),
    );
    expect(arm).toContain('this.celebrationDrain.armCraftTierUps();');
    expect(hud.match(/armCraftTierUps\(\)/g)).toHaveLength(1);
  });

  it('the observer is created lazily, so a bare-prototype drain rig still resolves', () => {
    expect(methodBody(hud, '  private get celebrationDrain(')).toContain(
      'this.celebrationDrainState ??= new CelebrationDrainObserver();',
    );
  });

  it('the celebration host wires every seam to its Hud member', () => {
    const body = methodBody(hud, '  private celebrationHost(');
    for (const wire of [
      'log: (text, color) => this.log(text, color),',
      'logNodes: (nodes, color) => this.logNodes(nodes, color),',
      'showBanner: (text, motion, iconUrl) => this.showBanner(text, motion, iconUrl),',
      'this.showCelebrationBanner(text, bannerClass, variant, motion, iconUrl, subtext),',
      'announce: (text) => this.combatAnnouncer.push(text, performance.now()),',
      "reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,",
      'deedsWindow: this.deedsWindow,',
      'reliquaryWindow: this.reliquaryWindow,',
    ]) {
      expect(body, wire).toContain(wire);
    }
  });
});
