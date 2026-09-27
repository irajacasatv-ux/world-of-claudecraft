// The STATE-driven celebrations of one handleEvents drain (extracted from the
// Hud handleEvents post-loop tail and its prev* fields): craft tier-ups plus
// the drain's masterwork plate, profession skill level-ups (floored craft skill
// and gathering proficiency), and faction standing tiers. Each reads the live
// IWorld mirror rather than an event payload, because online the self
// snapshot carrying cprof / gprof / fac can land a few snapshots after (or
// without) the drain's events. The pure diff steps and their armed-window
// rules live in the three *_view.ts cores; this class only holds their
// snapshots between drains and hands each crossing to its painter.
//
// Host-free: it touches no DOM and no browser global. The painters draw
// through the CelebrationHost thunk, built only when a celebration fires (a
// rare drain), never per tick.

import type { FactionId } from '../../../sim/factions';
import type { IWorld } from '../../../world_api';
import { paintFactionTierCelebrations } from '../reputation/faction_tier_celebration_painter';
import { advanceFactionTierObservation } from '../reputation/faction_tier_celebration_view';
import { type CraftCelebrationHost, paintCraftCelebrations } from './craft_celebration_painter';
import { CRAFT_TIER_UP_DRAIN_WINDOW, observeCraftSkillsForTierUps } from './craft_celebration_view';
import { paintSkillLevelCelebrations } from './skill_level_toast_painter';
import { advanceSkillLevelObservation } from './skill_level_toast_view';

/** The mirror slice one drain observation reads. */
export type CelebrationDrainWorld = Pick<
  IWorld,
  'craftingIdentity' | 'craftSkills' | 'gatheringProficiency' | 'factions'
>;

export class CelebrationDrainObserver {
  /** The craft-skill snapshot the tier-up diff compares against. */
  prevCraftSkills: Record<string, number> | null = null;
  /** Drains left in the post-craftResult window during which the tier-up
   *  diff runs (0 = disarmed; see armCraftTierUps). */
  craftTierUpDrains = 0;
  /** Profession skill level-up snapshots (craft + gathering): the last SYNCED
   *  observation, diffed for floored integer skill climbs. null until the
   *  first synced observation (the silent login/join baseline). Separate from
   *  the tier-up snapshot so a fractional craft skill carry never desyncs
   *  either consumer, and so gathering proficiency has its own baseline. */
  prevCraftSkillLevels: Record<string, number> | null = null;
  prevGatheringSkillLevels: Record<string, number> | null = null;
  prevFactionStanding: Record<FactionId, number> | null = null;

  /** A craft result resolved: arm the tier-up state check. Skills only ever
   *  change on a craft, and online the cprof mirror can land a few snapshots
   *  after that event, so the diff stays armed for a bounded drain window
   *  instead of polling every frame. */
  armCraftTierUps(): void {
    this.craftTierUpDrains = CRAFT_TIER_UP_DRAIN_WINDOW;
  }

  /** The drain tail: observe the mirror once and paint every crossing. The
   *  masterwork proc and whether a deed unlocked are the drain's own facts
   *  (they decide the one-chime-per-drain stand-down below). */
  observe(
    world: CelebrationDrainWorld,
    masterworkItemId: string | null,
    deedUnlocked: boolean,
    host: () => CraftCelebrationHost,
  ): void {
    // Craft tier crossings are STATE-driven, not event-driven: online the
    // cprof mirror can land a snapshot after (or without) this drain's
    // events, so the observation reads the live craftSkills rather than an
    // event payload. The armed-window rules (bounded post-craftResult drains,
    // the synced guard, the silent first init, disarm-on-change) live in the
    // pure step observeCraftSkillsForTierUps (craft_celebration_view.ts).
    // One craftingIdentity/craftSkills read per drain, shared by the tier-up
    // and skill-level observations below: this tail runs every drain and the
    // offline getters allocate a fresh copy per access.
    const identitySynced = world.craftingIdentity.synced;
    const craftSkillsNow = world.craftSkills;
    const obs = observeCraftSkillsForTierUps(
      identitySynced,
      this.prevCraftSkills,
      craftSkillsNow,
      this.craftTierUpDrains,
    );
    this.prevCraftSkills = obs.prev;
    this.craftTierUpDrains = obs.drains;
    if (masterworkItemId !== null || obs.tierUps.length > 0)
      paintCraftCelebrations(host(), masterworkItemId, obs.tierUps);
    // Profession skill level-ups (floored craft skill + gathering proficiency):
    // also STATE-driven. Always-on after a silent synced baseline so a quiet
    // post-gather drain (proficiency applies the next tick) and enchant /
    // battlefield trickle still land their chat lines without arming every
    // event arm. Both families gate on the cprof identity sync flag: the
    // server ships cprof and gprof unconditionally in the same self snapshot
    // (server/game.ts selfWireJson), and offline both are always synced.
    const craftSkillObs = advanceSkillLevelObservation(
      identitySynced,
      this.prevCraftSkillLevels,
      craftSkillsNow,
    );
    this.prevCraftSkillLevels = craftSkillObs.prev;
    const gatherSkillObs = advanceSkillLevelObservation(
      identitySynced,
      this.prevGatheringSkillLevels,
      world.gatheringProficiency,
    );
    this.prevGatheringSkillLevels = gatherSkillObs.prev;
    if (craftSkillObs.skillUps.length > 0 || gatherSkillObs.skillUps.length > 0)
      paintSkillLevelCelebrations(
        host(),
        craftSkillObs.skillUps,
        gatherSkillObs.skillUps,
        // One celebration chime per drain across the whole tail: stand down
        // when a tier-up, masterwork, or deed celebration just chimed (a
        // retro-only deed drain draws no chime; over-suppressing there only
        // quiets a login catch-up, never a live earned moment).
        masterworkItemId !== null || obs.tierUps.length > 0 || deedUnlocked,
      );
    // Faction standing tiers ride the same diff-observer family over
    // IWorld.factions (hud/reputation/faction_tier_celebration_view.ts), on
    // the same sync flag: `fac` ships in the self snapshot beside cprof.
    const factionObs = advanceFactionTierObservation(
      identitySynced,
      this.prevFactionStanding,
      world.factions,
    );
    this.prevFactionStanding = factionObs.prev;
    if (factionObs.tierUps.length > 0)
      paintFactionTierCelebrations(
        host(),
        factionObs.tierUps,
        masterworkItemId !== null || obs.tierUps.length > 0 || deedUnlocked,
      );
  }
}
