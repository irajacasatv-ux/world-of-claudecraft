// The world population invariant, as a CLASS detector rather than a list of
// known offenders.
//
// Rule: the open world may never hold more live mobs of a template than its
// authored CAMPS place, except for the wave of a run that is currently active.
// Anything that spawns mobs and forgets to reclaim them violates this, whatever
// the mechanism, so this catches the next leak as well as the one it was written
// for (escort ambush waves, which each run left behind permanently).
//
// Deliberately driven through the real Sim and the real content tables: the
// point is to exercise every shipped escort, not a fixture.
//
// The escort sweep itself runs in the _a to _d siblings, split for wall time only;
// the shared half lives in tests/helpers/world_population.ts, and
// tests/world_population_shards.test.ts pins the partition.
import { describe, expect, it } from 'vitest';
import { CAMPS, DUNGEON_X_THRESHOLD, ESCORTS, MOBS } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import type { EscortRunState } from '../src/sim/types';
import { assertPopulationSane, HUB_PRACTICE_IDS } from './helpers/world_population';

describe('open-world population never exceeds what the content authored', () => {
  // One boot world, shared by the boot check and the budget controls that follow it.
  let world: Sim | undefined;
  const bootWorld = () => {
    world ??= new Sim({ seed: 20061, playerClass: 'warrior', noPlayer: true });
    return world;
  };

  it('holds at world generation', () => {
    assertPopulationSane(bootWorld(), 'at boot');
  });

  it('flags one open-world mob over each budget term, and none within it', () => {
    // The negative controls every escort round depends on: one live copy past each
    // term of the budget (the camps, a tracked escortee and an untracked caravan, every
    // hub practice target, a wave with no run active, and an active run's wave and
    // walker) must fail the check,
    // and an active run's exact wave must not, or the sweep's passes prove nothing.
    // The Fisher Bram escort's wave template (breach_wretch) belongs to no other
    // escort, though Farshore's camps also place it, so each case adds one past the
    // summed budget. Live counts and camp sums are counted here, independently of the
    // helper; the escortee, caravan and hub allowances are stated literals.
    const sim = bootWorld();
    const openWorldLive = (templateId: string) =>
      [...sim.entities.values()].filter(
        (e) =>
          e.kind === 'mob' &&
          !e.dead &&
          e.spawnPos.x <= DUNGEON_X_THRESHOLD &&
          e.templateId === templateId,
      ).length;
    const campAuthored = (templateId: string) =>
      CAMPS.filter((camp) => camp.mobId === templateId && MOBS[camp.mobId]).reduce(
        (sum, camp) => sum + camp.count,
        0,
      );
    const campMobIds = new Set(CAMPS.map((camp) => camp.mobId));
    const base = [...sim.entities.values()].find(
      (e) =>
        e.kind === 'mob' &&
        !e.dead &&
        e.spawnPos.x <= DUNGEON_X_THRESHOLD &&
        campMobIds.has(e.templateId),
    );
    if (!base) throw new Error('the boot world holds no live open-world camp mob');
    const extras: number[] = [];
    const addCopies = (templateId: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const id = Math.max(...sim.entities.keys()) + 1;
        sim.entities.set(id, { ...base, id, templateId });
        extras.push(id);
      }
    };
    const clearCopies = () => {
      for (const id of extras.splice(0)) sim.entities.delete(id);
    };
    // Tops a template up to `allowed + 1` live and returns the one row the check must
    // report for it.
    const oneOver = (templateId: string, allowed: number) => {
      addCopies(templateId, allowed + 1 - openWorldLive(templateId));
      return [`${templateId}: ${allowed + 1} live vs ${allowed} allowed`];
    };
    // The rows the check reported over budget, or none.
    const overBudget = (label: string): unknown => {
      try {
        assertPopulationSane(sim, label);
      } catch (err) {
        expect((err as Error).message.startsWith(`${label}: `), label).toBe(true);
        return (err as { actual?: unknown }).actual;
      }
      return [];
    };
    // Every escortee starts in the open world, where the check counts it.
    for (const def of Object.values(ESCORTS)) {
      expect(def.start.x, def.id).toBeLessThanOrEqual(DUNGEON_X_THRESHOLD);
    }
    const bram = ESCORTS.esc_fs_bram;
    const wave = bram.ambushes[0];
    expect(wave.mobId).toBe('breach_wretch');
    const idle = sim.escortRuns.get(bram.id);
    if (!idle) throw new Error('the boot world seeds no Fisher Bram escort state');
    try {
      expect(overBudget('boot')).toEqual([]);

      const campRow = oneOver(base.templateId, campAuthored(base.templateId));
      expect(overBudget('a camp')).toEqual(campRow);
      clearCopies();

      const escorteeRow = oneOver(bram.npcMobId, 1);
      expect(overBudget('an idle escortee')).toEqual(escorteeRow);
      clearCopies();

      // A caravan tracks no escortee until a player enters its area, so it is allowed none.
      const caravan = ESCORTS.esc_wq_eastbrook_caravan;
      expect(sim.escortRuns.get(caravan.id)?.npcId ?? null).toBeNull();
      const caravanRow = oneOver(caravan.npcMobId, 0);
      expect(overBudget('a caravan not materialized')).toEqual(caravanRow);
      clearCopies();

      // An escort whose state exists but tracks no escortee (a run ended, its escortee
      // not yet respawned: the state every ticked world holds) is allowed none, so its
      // one live escortee is one over.
      sim.escortRuns.set(bram.id, { ...idle, npcId: null, respawnAt: 30 });
      expect(overBudget('an escort tracking no escortee')).toEqual([
        `${bram.npcMobId}: 1 live vs 0 allowed`,
      ]);
      sim.escortRuns.set(bram.id, idle);

      for (const hubId of HUB_PRACTICE_IDS) {
        const hubRow = oneOver(hubId, 1);
        expect(overBudget(`the hub practice yard (${hubId})`)).toEqual(hubRow);
        clearCopies();
      }

      const idleWaveRow = oneOver(wave.mobId, campAuthored(wave.mobId));
      expect(overBudget('a wave with no run active')).toEqual(idleWaveRow);
      clearCopies();

      const run: EscortRunState['run'] = {
        waypointIndex: 0,
        startedAt: 0,
        ambushIds: [],
        fired: [],
        lastX: 0,
        lastZ: 0,
        stuckTicks: 0,
      };
      sim.escortRuns.set(bram.id, { ...idle, run });
      const activeWave = campAuthored(wave.mobId) + wave.count;
      addCopies(wave.mobId, activeWave - openWorldLive(wave.mobId));
      expect(overBudget('an active run, its exact wave')).toEqual([]);
      const activeWaveRow = oneOver(wave.mobId, activeWave);
      expect(overBudget('an active run, one past its wave')).toEqual(activeWaveRow);
      clearCopies();
      // The walker is the escortee entity itself, so a run allows no second one.
      const walkerRow = oneOver(bram.npcMobId, 1);
      expect(overBudget('an active run, a second walker')).toEqual(walkerRow);
    } finally {
      // Restored whatever happened above, so the shared world stays the boot world.
      clearCopies();
      sim.escortRuns.set(bram.id, idle);
    }
    expect(overBudget('restored')).toEqual([]);
  });

  it('names the escort ambush templates it is protecting, so the sweep is visible', () => {
    // Every shipped escort wave template, spelled out. If a new escort ships,
    // this list moves and the author sees that the guard above now covers it.
    const waveTemplates = [
      ...new Set(Object.values(ESCORTS).flatMap((d) => d.ambushes.map((a) => a.mobId))),
    ].sort();
    expect(waveTemplates).toEqual([
      'bogtoad',
      'breach_wretch',
      'canopy_weaver',
      'fen_sprite',
      'rime_elemental',
      'snowdrift_wolf',
      'terrace_howler',
      'tide_scuttler',
      'vale_bandit',
      'void_stalker',
      'widowsilk_spinner',
      'willow_sprite',
      'wood_wraith',
    ]);
    // ...and each is a real template placed by real camps, so the budget above
    // is a meaningful number rather than zero.
    for (const id of waveTemplates) expect(MOBS[id], id).toBeTruthy();
  });
});
