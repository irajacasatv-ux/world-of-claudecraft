// Varkhul's forge encounter: pillar warmups, add waves and intermission
// timeouts, portal adds, and soak exposure and forge heat. Split from
// tests/varkhul_forge_encounter.test.ts on 2026-09-27 for shard balance; the
// shared encounter setup is tests/helpers/varkhul_forge_harness.ts.

import { describe, expect, it } from 'vitest';
import {
  resetVarkhulEncounter,
  updateVarkhulEncounter,
  VARKHUL_CINDER_ARTIFICER_ID,
  VARKHUL_CRUCIBLE_WARDEN_ID,
  VARKHUL_EMBER_SENTINEL_ID,
  VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID,
  VARKHUL_FORGE_PORTAL_ABILITY_ID,
} from '../src/sim/encounters/varkhul';
import { DT, type Entity, MELEE_RANGE } from '../src/sim/types';
import { activeVarkhulAssembly } from '../src/sim/varkhul_assembly';
import {
  VARKHUL_CINDER_REPAIR_CAST_ID,
  VARKHUL_CINDER_REPAIR_END_ANIMATION_ID,
  VARKHUL_CINDER_REPAIR_START_ANIMATION_ID,
} from '../src/sim/varkhul_cinder_artificer';
import {
  VARKHUL_FORGE_BEAM_BLOCK_DAMAGE_TICK_SECONDS,
  VARKHUL_FORGE_BEAM_WARMUP_SECONDS,
  VARKHUL_FORGE_MELTDOWN_DURATION_SECONDS,
  varkhulForgeBeamExposureResetSeconds,
} from '../src/sim/varkhul_forge_beams';
import {
  VARKHUL_FORGE_ADD_WAVE_DELAY_HEROIC_SECONDS,
  VARKHUL_FORGE_ADD_WAVE_DELAY_NORMAL_SECONDS,
  VARKHUL_FORGE_INTERMISSION_SECONDS_HEROIC,
  VARKHUL_FORGE_INTERMISSION_SECONDS_NORMAL,
  VARKHUL_FORGE_INTERMISSION_WARNING_SECONDS,
  VARKHUL_FORGE_LOCAL_POS,
  VARKHUL_WORK_FACING,
  VARKHUL_WORK_LOCAL_POS,
} from '../src/sim/varkhul_forge_intermission';
import { addEncounterPlayer, addTank, claimedEncounter } from './helpers/varkhul_forge_harness';

describe('Varkhul forge pillars and add intermission', () => {
  it('does not trigger the 80%, 50%, 35%, or 20% windows just above their thresholds', () => {
    const teaching = claimedEncounter(721);
    updateVarkhulEncounter(teaching.sim.ctx, teaching.boss);
    const teachingState = teaching.boss.varkhul;
    if (!teachingState) throw new Error('Teaching state missing');
    teaching.boss.hp = teaching.boss.maxHp * 0.8001;
    updateVarkhulEncounter(teaching.sim.ctx, teaching.boss);
    expect(teachingState.forgeBeamTeachingTriggered).toBe(false);
    teaching.boss.hp = teaching.boss.maxHp * 0.8;
    updateVarkhulEncounter(teaching.sim.ctx, teaching.boss);
    expect(teachingState.forgeBeamWindow).toBe('teaching_left');

    const intermission = claimedEncounter(722);
    intermission.boss.hp = intermission.boss.maxHp * 0.5001;
    updateVarkhulEncounter(intermission.sim.ctx, intermission.boss);
    expect(intermission.boss.varkhul?.assemblyTriggered).toBe(false);
    intermission.boss.hp = intermission.boss.maxHp * 0.5;
    updateVarkhulEncounter(intermission.sim.ctx, intermission.boss);
    expect(intermission.boss.varkhul?.assemblyPhase).toBe('adds');

    const pressure = claimedEncounter(739);
    updateVarkhulEncounter(pressure.sim.ctx, pressure.boss);
    const pressureState = pressure.boss.varkhul;
    if (!pressureState) throw new Error('Pressure state missing');
    pressureState.assemblyTriggered = true;
    pressureState.assemblyPhase = 'done';
    pressureState.forgeBeamTeachingTriggered = true;
    pressure.boss.damageFloorHp = undefined;
    pressure.boss.hp = pressure.boss.maxHp * 0.3501;
    updateVarkhulEncounter(pressure.sim.ctx, pressure.boss);
    expect(pressureState.forgeBeamPressureTriggered).toBe(false);
    pressure.boss.hp = pressure.boss.maxHp * 0.35;
    updateVarkhulEncounter(pressure.sim.ctx, pressure.boss);
    expect(pressureState.forgeBeamPressureTriggered).toBe(true);

    const final = claimedEncounter(723);
    updateVarkhulEncounter(final.sim.ctx, final.boss);
    const finalState = final.boss.varkhul;
    if (!finalState) throw new Error('Final state missing');
    finalState.assemblyTriggered = true;
    finalState.assemblyPhase = 'done';
    final.boss.damageFloorHp = undefined;
    final.boss.hp = final.boss.maxHp * 0.2001;
    updateVarkhulEncounter(final.sim.ctx, final.boss);
    expect(finalState.forgeBeamFinalTriggered).toBe(false);
    final.boss.hp = final.boss.maxHp * 0.2;
    updateVarkhulEncounter(final.sim.ctx, final.boss);
    expect(finalState.forgeBeamWindow).toBe('final_left');
  });

  it('uses the full three-second warmup before a player can block or take exposure damage', () => {
    const { sim, boss } = claimedEncounter(724);
    const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
    if (!instance) throw new Error('Varkhul instance missing');
    const origin = sim.ctx.instanceOriginOf(instance);
    sim.player.pos = sim.ctx.groundPos(
      origin.x + VARKHUL_FORGE_LOCAL_POS.x - 14,
      origin.z + VARKHUL_FORGE_LOCAL_POS.z,
    );
    sim.player.prevPos = { ...sim.player.pos };
    boss.hp = boss.maxHp * 0.8;

    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    expect(state.assemblyForgeBeamWarmupRemaining).toBeCloseTo(
      VARKHUL_FORGE_BEAM_WARMUP_SECONDS - DT,
      5,
    );
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout').map((event) => event.call),
    ).toEqual(expect.arrayContaining(['leftPillarCharging']));
    expect(
      sim.events.some((event) => event.type === 'varkhulCallout' && event.call === 'leftPillar'),
    ).toBe(false);
    for (let tick = 1; tick < VARKHUL_FORGE_BEAM_WARMUP_SECONDS / DT; tick++) {
      expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
      expect(state.assemblyForgeOverheat).toBe(0);
      expect(sim.player.auras.some((aura) => aura.id === VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID)).toBe(
        false,
      );
      updateVarkhulEncounter(sim.ctx, boss);
    }
    expect(state.assemblyForgeBeamWarmupRemaining).toBe(0);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout' && event.call === 'leftPillar'),
    ).toHaveLength(1);

    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([sim.player.id, null]);
  });

  it('keeps Varkhul in player melee range while his tank soaks a pillar', () => {
    const { sim, boss } = claimedEncounter(754);
    const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
    if (!instance) throw new Error('Varkhul instance missing');
    const origin = sim.ctx.instanceOriginOf(instance);
    sim.player.pos = sim.ctx.groundPos(
      origin.x + VARKHUL_FORGE_LOCAL_POS.x - 14,
      origin.z + VARKHUL_FORGE_LOCAL_POS.z,
    );
    sim.player.prevPos = { ...sim.player.pos };
    boss.hp = boss.maxHp * 0.8;
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    state.assemblyForgeBeamWarmupRemaining = 0;
    state.forgeBeamWindowRemaining = 8;

    for (let tick = 0; tick < 80; tick++) sim.tick();

    expect(state.assemblyForgeBeamBlockerIds[0]).toBe(sim.player.id);
    expect(
      Math.hypot(boss.pos.x - sim.player.pos.x, boss.pos.z - sim.player.pos.z),
    ).toBeLessThanOrEqual(MELEE_RANGE);
  });

  it('delays the right-pillar ignition and blocker until its full warmup completes', () => {
    const { sim, boss } = claimedEncounter(732);
    const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
    if (!instance) throw new Error('Varkhul instance missing');
    const origin = sim.ctx.instanceOriginOf(instance);
    sim.player.pos = sim.ctx.groundPos(
      origin.x + VARKHUL_FORGE_LOCAL_POS.x + 14,
      origin.z + VARKHUL_FORGE_LOCAL_POS.z,
    );
    sim.player.prevPos = { ...sim.player.pos };
    boss.hp = boss.maxHp * 0.8;

    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    state.assemblyForgeBeamWarmupRemaining = 0;
    state.forgeBeamWindowRemaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    state.forgeBeamWindowRemaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);

    expect(state.forgeBeamWindow).toBe('teaching_right');
    expect(state.assemblyForgeBeamWarmupRemaining).toBe(VARKHUL_FORGE_BEAM_WARMUP_SECONDS);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
    expect(
      sim.events.filter(
        (event) => event.type === 'varkhulCallout' && event.call === 'rightPillarCharging',
      ),
    ).toHaveLength(1);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout' && event.call === 'rightPillar'),
    ).toHaveLength(0);

    for (let tick = 0; tick < VARKHUL_FORGE_BEAM_WARMUP_SECONDS / DT; tick++) {
      expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
      updateVarkhulEncounter(sim.ctx, boss);
    }
    expect(state.assemblyForgeBeamWarmupRemaining).toBe(0);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout' && event.call === 'rightPillar'),
    ).toHaveLength(1);

    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, sim.player.id]);
  });

  it('warms the first pillar, warns the next for two seconds, then hands off with zero overlap', () => {
    const { sim, boss } = claimedEncounter(733);
    const rightBlocker = addTank(sim, boss, 'BothWarmupRightBlocker');
    const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
    if (!instance) throw new Error('Varkhul instance missing');
    const origin = sim.ctx.instanceOriginOf(instance);
    const forgeX = origin.x + VARKHUL_FORGE_LOCAL_POS.x;
    const forgeZ = origin.z + VARKHUL_FORGE_LOCAL_POS.z;
    sim.player.pos = sim.ctx.groundPos(forgeX - 14, forgeZ);
    sim.player.prevPos = { ...sim.player.pos };
    rightBlocker.pos = sim.ctx.groundPos(forgeX + 14, forgeZ);
    rightBlocker.prevPos = { ...rightBlocker.pos };
    boss.hp = Math.floor(boss.maxHp * 0.5);

    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    expect(state.forgeBeamWindow).toBe('intermission_left');
    expect(state.assemblyForgeBeamActiveMask).toBe(1);
    expect(state.assemblyForgeBeamWarningMask).toBe(0);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
    expect(
      sim.events.filter(
        (event) => event.type === 'varkhulCallout' && event.call === 'leftPillarCharging',
      ),
    ).toHaveLength(2);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout' && event.call === 'leftPillar'),
    ).toHaveLength(0);

    for (let tick = 1; tick < VARKHUL_FORGE_BEAM_WARMUP_SECONDS / DT; tick++) {
      expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
      updateVarkhulEncounter(sim.ctx, boss);
    }
    expect(state.assemblyForgeBeamWarmupRemaining).toBe(0);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout' && event.call === 'leftPillar'),
    ).toHaveLength(2);

    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([sim.player.id, null]);
    state.forgeBeamWindowRemaining = VARKHUL_FORGE_INTERMISSION_WARNING_SECONDS + DT;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.forgeBeamWindow).toBe('intermission_left');
    expect(state.assemblyForgeBeamActiveMask).toBe(1);
    expect(state.assemblyForgeBeamWarningMask).toBe(2);
    expect(
      sim.events.filter(
        (event) => event.type === 'varkhulCallout' && event.call === 'rightPillarCharging',
      ),
    ).toHaveLength(2);
    expect(
      activeVarkhulAssembly(boss.id, state, { x: forgeX, z: forgeZ }, boss.pos, (entityId) =>
        sim.entities.get(entityId),
      )?.forgeBeams,
    ).toEqual([
      expect.objectContaining({ index: 0, active: true, warning: false }),
      expect.objectContaining({ index: 1, active: false, warning: true }),
    ]);

    state.forgeBeamWindowRemaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.forgeBeamWindow).toBe('intermission_right');
    expect(state.assemblyForgeBeamActiveMask).toBe(2);
    expect(state.assemblyForgeBeamWarningMask).toBe(0);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, null]);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout' && event.call === 'rightPillar'),
    ).toHaveLength(2);

    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyForgeBeamBlockerIds).toEqual([null, rightBlocker.id]);
  });

  it('waits for a Normal wave to die, then telegraphs the next wave after three seconds', () => {
    const { sim, boss } = claimedEncounter(712);
    boss.hp = Math.floor(boss.maxHp * 0.5);
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    state.assemblyArtificerNextSpawnRemaining = 999;
    const portalEvents = () =>
      sim.events.filter(
        (event) => event.type === 'spellfxAt' && event.ability === VARKHUL_FORGE_PORTAL_ABILITY_ID,
      );
    expect(state.assemblyIntermissionWaves).toBe(3);
    state.engage.phase = 'done';
    expect(portalEvents()).toHaveLength(4);
    expect(sim.activeVarkhulAssemblies[0]).toMatchObject({
      addWave: 1,
      addWaves: 3,
      addsRemaining: 4,
    });
    for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyAddIds).toHaveLength(4);

    state.assemblyNextWaveRemaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyNextWaveIndex).toBe(1);
    expect(state.assemblyNextWaveRemaining).toBe(VARKHUL_FORGE_ADD_WAVE_DELAY_NORMAL_SECONDS);
    expect(state.assemblyPortalSpawns).toEqual([]);

    for (const id of state.assemblyAddIds) {
      const add = sim.entities.get(id);
      if (add) add.dead = true;
    }
    for (let tick = 1; tick < VARKHUL_FORGE_ADD_WAVE_DELAY_NORMAL_SECONDS / DT; tick++) {
      updateVarkhulEncounter(sim.ctx, boss);
    }
    expect(state.assemblyNextWaveIndex).toBe(1);
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyNextWaveIndex).toBe(2);
    expect(state.assemblyPortalSpawns).toHaveLength(4);
    expect(portalEvents()).toHaveLength(8);
    expect(sim.activeVarkhulAssemblies[0]).toMatchObject({ addWave: 2, addsRemaining: 4 });
  });

  it('overlaps Heroic waves after fourteen seconds or queues early when the prior wave dies', () => {
    const timed = claimedEncounter(711, true);
    timed.boss.hp = Math.floor(timed.boss.maxHp * 0.5);
    updateVarkhulEncounter(timed.sim.ctx, timed.boss);
    const timedState = timed.boss.varkhul;
    if (!timedState) throw new Error('Varkhul state missing');
    timedState.engage.phase = 'done';
    timedState.assemblyArtificerNextSpawnRemaining = 999;
    for (const pending of timedState.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(timed.sim.ctx, timed.boss);
    expect(timedState.assemblyAddIds).toHaveLength(5);
    timedState.assemblyNextWaveRemaining = DT;
    updateVarkhulEncounter(timed.sim.ctx, timed.boss);
    expect(timedState.assemblyNextWaveIndex).toBe(2);
    expect(timedState.assemblyPortalSpawns).toHaveLength(5);
    expect(timedState.assemblyNextWaveRemaining).toBe(VARKHUL_FORGE_ADD_WAVE_DELAY_HEROIC_SECONDS);

    const early = claimedEncounter(713, true);
    early.boss.hp = Math.floor(early.boss.maxHp * 0.5);
    updateVarkhulEncounter(early.sim.ctx, early.boss);
    const earlyState = early.boss.varkhul;
    if (!earlyState) throw new Error('Varkhul state missing');
    earlyState.assemblyArtificerNextSpawnRemaining = 999;
    for (const pending of earlyState.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(early.sim.ctx, early.boss);
    for (const id of earlyState.assemblyAddIds) {
      const add = early.sim.entities.get(id);
      if (add) add.dead = true;
    }
    earlyState.assemblyNextWaveRemaining = 13;
    updateVarkhulEncounter(early.sim.ctx, early.boss);
    expect(earlyState.assemblyNextWaveIndex).toBe(2);
    expect(earlyState.assemblyPortalSpawns).toHaveLength(5);
  });

  it('waits for future and pending waves even when every add already spawned is dead', () => {
    const { sim, boss } = claimedEncounter(725);
    boss.hp = boss.maxHp * 0.5;
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');

    const spawnPendingAndKill = () => {
      for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
      updateVarkhulEncounter(sim.ctx, boss);
      for (const id of state.assemblyAddIds) {
        const add = sim.entities.get(id);
        if (add) add.dead = true;
      }
    };

    spawnPendingAndKill();
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyPhase).toBe('adds');
    expect(state.assemblyNextWaveIndex).toBe(1);
    expect(state.assemblyPortalSpawns).toEqual([]);

    state.assemblyNextWaveRemaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    spawnPendingAndKill();
    state.assemblyNextWaveRemaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyNextWaveIndex).toBe(state.assemblyIntermissionWaves);
    expect(state.assemblyPortalSpawns.length).toBeGreaterThan(0);
    expect(state.assemblyPhase).toBe('adds');

    spawnPendingAndKill();
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyPhase).toBe('stunned');
  });

  it.each([
    { heroic: false, seconds: VARKHUL_FORGE_INTERMISSION_SECONDS_NORMAL },
    { heroic: true, seconds: VARKHUL_FORGE_INTERMISSION_SECONDS_HEROIC },
  ])(
    'times out the full $seconds-second intermission exactly and keeps living adds in combat',
    ({ heroic, seconds }) => {
      const { sim, boss } = claimedEncounter(heroic ? 713 : 714, heroic);
      const rightBlocker = addTank(sim, boss, 'TimeoutRightBlocker');
      const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
      if (!instance) throw new Error('Varkhul instance missing');
      const origin = sim.ctx.instanceOriginOf(instance);
      const forgeX = origin.x + VARKHUL_FORGE_LOCAL_POS.x;
      const forgeZ = origin.z + VARKHUL_FORGE_LOCAL_POS.z;
      sim.player.pos = sim.ctx.groundPos(forgeX - 14, forgeZ);
      sim.player.prevPos = { ...sim.player.pos };
      rightBlocker.pos = sim.ctx.groundPos(forgeX + 14, forgeZ);
      rightBlocker.prevPos = { ...rightBlocker.pos };
      boss.hp = Math.floor(boss.maxHp * 0.5);
      updateVarkhulEncounter(sim.ctx, boss);
      const state = boss.varkhul;
      if (!state) throw new Error('Varkhul state missing');
      for (let tick = 1; tick < seconds / DT - 1; tick++) {
        updateVarkhulEncounter(sim.ctx, boss);
      }
      expect(state.assemblyRemaining).toBeCloseTo(DT, 4);
      expect(state.assemblyForgeMeltdownRemaining).toBe(0);
      const liveAddIds = [...state.assemblyAddIds];
      expect(liveAddIds.length).toBeGreaterThan(0);
      expect(liveAddIds.some((id) => sim.entities.has(id))).toBe(true);

      updateVarkhulEncounter(sim.ctx, boss);
      expect(state.assemblyRemaining).toBe(0);
      expect(state.assemblyForgeMeltdownRemaining).toBe(VARKHUL_FORGE_MELTDOWN_DURATION_SECONDS);
      expect(liveAddIds.every((id) => sim.entities.has(id))).toBe(true);
      expect(liveAddIds.every((id) => boss.summonedIds.includes(id))).toBe(true);
      expect(state.assemblyAddIds).toEqual(liveAddIds);
      expect(state.assemblyPortalSpawns).toEqual([]);
      const retainedWarden = liveAddIds
        .map((id) => sim.entities.get(id))
        .find((add) => add?.templateId === VARKHUL_CRUCIBLE_WARDEN_ID);
      if (!retainedWarden) throw new Error('Meltdown did not retain a Crucible Warden');
      retainedWarden.bigCastTimer = DT;
      sim.tick();
      expect(retainedWarden.inCombat).toBe(true);
      expect(retainedWarden.castingAbility).toBe('crucible_quake');
      for (let tick = 0; tick < VARKHUL_FORGE_MELTDOWN_DURATION_SECONDS / DT; tick++) {
        updateVarkhulEncounter(sim.ctx, boss);
      }
      expect(liveAddIds.every((id) => sim.entities.has(id))).toBe(true);
      expect(state.assemblyPhase).toBe('adds');
      expect(state.assemblyForgeMeltdownRemaining).toBe(0);
      expect(state.assemblyWipeResolved).toBe(true);
      expect(state.assemblyForgeBeamWarmupRemaining).toBeCloseTo(
        VARKHUL_FORGE_BEAM_WARMUP_SECONDS - DT,
        5,
      );
      resetVarkhulEncounter(sim.ctx, boss);
      expect(liveAddIds.every((id) => !sim.entities.has(id))).toBe(true);
    },
  );

  it('telegraphs four portals, spawns twenty Heroic combat adds, and sends them to the top tank', () => {
    const { sim, boss } = claimedEncounter(702, true);
    const topTank = addTank(sim, boss, 'TopTank');
    const deadTank = addTank(sim, boss, 'DeadTank');
    const highThreatDps = addEncounterPlayer(sim, boss, 'HighThreatDps');
    deadTank.dead = true;
    boss.threat.set(sim.player.id, 50);
    boss.threat.set(topTank.id, 100);
    boss.threat.set(deadTank.id, 10_000);
    boss.threat.set(highThreatDps.id, 5_000);
    boss.hp = Math.floor(boss.maxHp * 0.5);

    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    expect(state.assemblyPhase).toBe('adds');
    expect(state.assemblyRemaining).toBeCloseTo(VARKHUL_FORGE_INTERMISSION_SECONDS_HEROIC - DT, 5);
    expect(state.assemblyForgeBeamActiveMask).toBe(1);
    expect(state.assemblyPortalSpawns).toHaveLength(5);
    expect(new Set(state.assemblyPortalSpawns.map((spawn) => spawn.spawnIndex)).size).toBe(5);
    expect(state.assemblyAddIds).toEqual([]);
    expect(
      sim.events.filter((event) => event.type === 'varkhulCallout').map((event) => event.call),
    ).toEqual(expect.arrayContaining(['leftPillarCharging', 'portalsOpening']));
    for (const player of [sim.player, topTank, deadTank, highThreatDps]) {
      expect(
        sim.events.filter(
          (event) =>
            event.type === 'varkhulCallout' &&
            event.pid === player.id &&
            (event.call === 'leftPillarCharging' || event.call === 'portalsOpening'),
        ),
      ).toHaveLength(2);
    }
    const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
    if (!instance) throw new Error('Varkhul instance missing');
    expect(boss.pos.z - sim.ctx.instanceOriginOf(instance).z).toBeCloseTo(
      VARKHUL_WORK_LOCAL_POS.z,
      5,
    );
    expect(boss.facing).toBe(VARKHUL_WORK_FACING);

    expect(state.assemblyAddIds).toEqual([]);
    state.assemblyForgeBeamWarmupRemaining = DT;
    for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyAddIds).toHaveLength(5);
    for (const player of [sim.player, topTank, deadTank, highThreatDps]) {
      expect(
        sim.events.some(
          (event) =>
            event.type === 'varkhulCallout' &&
            event.pid === player.id &&
            event.call === 'leftPillar',
        ),
      ).toBe(true);
    }

    for (let wave = 1; wave < 4; wave++) {
      state.assemblyNextWaveRemaining = DT;
      updateVarkhulEncounter(sim.ctx, boss);
      expect(state.assemblyPortalSpawns).toHaveLength(5);
      for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
      updateVarkhulEncounter(sim.ctx, boss);
    }

    const adds = state.assemblyAddIds.map((id) => sim.entities.get(id)).filter(Boolean) as Entity[];
    expect(adds).toHaveLength(20);
    expect(adds.filter((add) => add.templateId === VARKHUL_CRUCIBLE_WARDEN_ID)).toHaveLength(4);
    expect(adds.filter((add) => add.templateId === VARKHUL_EMBER_SENTINEL_ID)).toHaveLength(16);
    expect(adds.some((add) => add.templateId === VARKHUL_CINDER_ARTIFICER_ID)).toBe(false);
    expect(adds.every((add) => add.aggroTargetId === topTank.id)).toBe(true);
    expect(adds.every((add) => (add.threat.get(topTank.id) ?? 0) >= 100)).toBe(true);
    expect(state.assemblyPhase).toBe('adds');

    for (const add of adds) add.dead = true;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyPhase).toBe('stunned');
    expect(state.assemblyPortalSpawns).toEqual([]);
    expect(state.assemblyForgeBeamActiveMask).toBe(0);
    for (const player of [sim.player, topTank, deadTank, highThreatDps]) {
      expect(
        sim.events.some(
          (event) =>
            event.type === 'varkhulCallout' &&
            event.pid === player.id &&
            event.call === 'addsDefeated',
        ),
      ).toBe(true);
    }
  });

  it('ramps one-second soak damage and records the long Heroic exposure reset', () => {
    const { sim, boss } = claimedEncounter(703, true);
    sim.player.damageImmune = false;
    boss.hp = Math.floor(boss.maxHp * 0.79);
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    expect(state.assemblyRuneDifficulty).toBe('heroic');
    expect(state.forgeBeamWindow).toBe('teaching_left');
    expect(
      sim.events.some(
        (event) => event.type === 'varkhulCallout' && event.call === 'leftPillarCharging',
      ),
    ).toBe(true);
    const forge = { x: boss.pos.x, z: boss.pos.z + 6 };
    sim.player.pos = { x: forge.x - 14, y: sim.player.pos.y, z: forge.z };
    sim.player.prevPos = { ...sim.player.pos };
    state.assemblyForgeBeamWarmupRemaining = 0;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(state.assemblyForgeBeamBlockerIds[0]).toBe(sim.player.id);
    state.assemblyForgeBeamDamageTimers[0] = DT;
    const hpBeforeFirst = sim.player.hp;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(hpBeforeFirst - sim.player.hp).toBe(Math.ceil(sim.player.maxHp * 0.1));
    const exposure = sim.player.auras.find(
      (aura) => aura.id === VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID,
    );
    expect(exposure?.stacks).toBe(1);
    expect(exposure?.remaining).toBe(60);

    state.assemblyForgeBeamDamageTimers[0] = DT;
    const hpBeforeSecond = sim.player.hp;
    updateVarkhulEncounter(sim.ctx, boss);
    expect(hpBeforeSecond - sim.player.hp).toBe(Math.ceil(sim.player.maxHp * 0.13));
    expect(exposure?.stacks).toBe(2);
    expect(exposure?.remaining).toBe(60);
    expect(VARKHUL_FORGE_BEAM_BLOCK_DAMAGE_TICK_SECONDS).toBe(1);
  });

  it.each([
    { heroic: false, resetSeconds: 10 },
    { heroic: true, resetSeconds: 60 },
  ])(
    'keeps exposure until the $resetSeconds-second reset and restarts the next soak at stack one',
    ({ heroic, resetSeconds }) => {
      const { sim, boss } = claimedEncounter(heroic ? 715 : 716, heroic);
      boss.hp = Math.floor(boss.maxHp * 0.79);
      updateVarkhulEncounter(sim.ctx, boss);
      const state = boss.varkhul;
      if (!state) throw new Error('Varkhul state missing');
      const instance = sim.instances.find((entry) => entry.mobIds.includes(boss.id));
      if (!instance) throw new Error('Varkhul instance missing');
      const origin = sim.ctx.instanceOriginOf(instance);
      const forgeX = origin.x + VARKHUL_FORGE_LOCAL_POS.x;
      const forgeZ = origin.z + VARKHUL_FORGE_LOCAL_POS.z;
      sim.player.pos = sim.ctx.groundPos(forgeX - 14, forgeZ);
      sim.player.prevPos = { ...sim.player.pos };
      state.assemblyForgeBeamWarmupRemaining = 0;
      state.assemblyForgeBeamBlockerIds[0] = sim.player.id;
      state.assemblyForgeBeamDamageTimers[0] = DT;
      updateVarkhulEncounter(sim.ctx, boss);
      expect(varkhulForgeBeamExposureResetSeconds(state.assemblyRuneDifficulty)).toBe(resetSeconds);
      expect(
        sim.player.auras.find((aura) => aura.id === VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID),
      ).toMatchObject({ stacks: 1, remaining: resetSeconds });

      sim.player.damageImmune = true;
      sim.player.pos = sim.ctx.groundPos(boss.pos.x, boss.pos.z - 2);
      sim.player.prevPos = { ...sim.player.pos };
      for (let tick = 0; tick < resetSeconds / DT - 1; tick++) sim.tick();
      expect(
        sim.player.auras.find((aura) => aura.id === VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID),
      ).toMatchObject({ stacks: 1, remaining: expect.any(Number) });
      sim.tick();
      expect(sim.player.auras.some((aura) => aura.id === VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID)).toBe(
        false,
      );

      state.majorAbility = 'none';
      state.forgeBeamWindow = 'teaching_left';
      state.forgeBeamWindowRemaining = 999;
      state.assemblyForgeBeamActiveMask = 1;
      state.assemblyForgeBeamWarmupRemaining = 0;
      state.assemblyForgeBeamBlockerIds[0] = sim.player.id;
      state.assemblyForgeBeamDamageTimers[0] = DT;
      sim.player.pos = sim.ctx.groundPos(forgeX - 14, forgeZ);
      sim.player.prevPos = { ...sim.player.pos };
      updateVarkhulEncounter(sim.ctx, boss);
      expect(
        sim.player.auras.find((aura) => aura.id === VARKHUL_FORGE_BEAM_EXPOSURE_AURA_ID),
      ).toMatchObject({ stacks: 1, remaining: resetSeconds });
    },
  );

  it('cools idle Normal heat, preserves Heroic heat, and announces both danger thresholds once', () => {
    const normal = claimedEncounter(705);
    updateVarkhulEncounter(normal.sim.ctx, normal.boss);
    if (!normal.boss.varkhul) throw new Error('Normal Varkhul state missing');
    normal.boss.varkhul.assemblyForgeOverheat = 0.4;
    updateVarkhulEncounter(normal.sim.ctx, normal.boss);
    expect(normal.boss.varkhul.assemblyForgeOverheat).toBeCloseTo(0.3985, 8);

    const heroic = claimedEncounter(706, true);
    updateVarkhulEncounter(heroic.sim.ctx, heroic.boss);
    if (!heroic.boss.varkhul) throw new Error('Heroic Varkhul state missing');
    heroic.boss.varkhul.assemblyForgeOverheat = 0.4;
    updateVarkhulEncounter(heroic.sim.ctx, heroic.boss);
    expect(heroic.boss.varkhul.assemblyForgeOverheat).toBe(0.4);

    normal.boss.hp = Math.floor(normal.boss.maxHp * 0.79);
    normal.boss.varkhul.assemblyForgeOverheat = 0.748;
    updateVarkhulEncounter(normal.sim.ctx, normal.boss);
    normal.boss.varkhul.assemblyForgeBeamWarmupRemaining = 0;
    updateVarkhulEncounter(normal.sim.ctx, normal.boss);
    normal.boss.varkhul.assemblyForgeOverheat = 0.898;
    updateVarkhulEncounter(normal.sim.ctx, normal.boss);
    updateVarkhulEncounter(normal.sim.ctx, normal.boss);
    const warnings = normal.sim.events
      .filter((event) => event.type === 'varkhulCallout')
      .map((event) => event.call)
      .filter((call) => call === 'heat75' || call === 'heat90');
    expect(warnings).toEqual(['heat75', 'heat90']);
  });

  it('lets a portal Sentinel cross the room, retarget by threat, and obey a taunt', () => {
    const { sim, boss } = claimedEncounter(717);
    boss.hp = Math.floor(boss.maxHp * 0.5);
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    state.assemblyForgeBeamWarmupRemaining = 999;
    const sentinels = state.assemblyAddIds
      .map((id) => sim.entities.get(id))
      .filter((add): add is Entity => add?.templateId === VARKHUL_EMBER_SENTINEL_ID);
    const sentinel = sentinels.sort(
      (first, second) =>
        Math.hypot(second.pos.x - sim.player.pos.x, second.pos.z - sim.player.pos.z) -
        Math.hypot(first.pos.x - sim.player.pos.x, first.pos.z - sim.player.pos.z),
    )[0];
    if (!sentinel) throw new Error('Ember Sentinel did not emerge');
    expect(sentinel.mechanicDamageMult).toBeUndefined();
    for (const addId of state.assemblyAddIds) {
      const add = sim.entities.get(addId);
      if (add && add.id !== sentinel.id) add.dead = true;
    }
    const startDistance = Math.hypot(
      sentinel.pos.x - sim.player.pos.x,
      sentinel.pos.z - sim.player.pos.z,
    );
    expect(startDistance).toBeGreaterThan(18);
    for (let tick = 0; tick < 180 && !sentinel.dead; tick++) {
      sim.tick();
      expect(sentinel.aiState).not.toBe('evade');
      if (Math.hypot(sentinel.pos.x - sim.player.pos.x, sentinel.pos.z - sim.player.pos.z) < 6) {
        break;
      }
    }
    expect(
      Math.hypot(sentinel.pos.x - sim.player.pos.x, sentinel.pos.z - sim.player.pos.z),
    ).toBeLessThan(6);

    const challenger = addTank(sim, boss, 'SentinelChallenger');
    sentinel.threat.clear();
    sentinel.threat.set(sim.player.id, 10);
    sentinel.threat.set(challenger.id, 10_000);
    sentinel.aggroTargetId = sim.player.id;
    sim.tick();
    expect(sentinel.aggroTargetId).toBe(challenger.id);

    sentinel.forcedTargetId = sim.player.id;
    sentinel.forcedTargetTimer = DT / 2;
    sim.tick();
    expect(sentinel.aggroTargetId).toBe(sim.player.id);
    sim.tick();
    expect(sentinel.forcedTargetId).toBeNull();
    expect(sentinel.aggroTargetId).toBe(challenger.id);
  });

  it('makes each portal Warden pursue, melee, cast Quake, and recast on cadence', () => {
    const { sim, boss } = claimedEncounter(704, true);
    sim.player.autoAttack = false;
    sim.player.damageImmune = false;
    sim.player.maxHp = 100_000;
    sim.player.hp = sim.player.maxHp;
    boss.hp = Math.floor(boss.maxHp * 0.5);
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    const warden = state.assemblyAddIds
      .map((id) => sim.entities.get(id))
      .find((add) => add?.templateId === VARKHUL_CRUCIBLE_WARDEN_ID);
    if (!warden) throw new Error('Crucible Warden did not emerge');
    expect(warden.maxHp).toBe(2_807);
    expect(warden.mechanicDamageMult).toBeCloseTo((92.2 * 1.25) / 99.8, 12);
    state.assemblyForgeBeamWarmupRemaining = 999;

    const challenger = addTank(sim, boss, 'WardenChallenger');
    warden.threat.clear();
    warden.threat.set(sim.player.id, 10);
    warden.threat.set(challenger.id, 10_000);
    warden.aggroTargetId = sim.player.id;
    sim.tick();
    expect(warden.aggroTargetId).toBe(challenger.id);
    warden.forcedTargetId = sim.player.id;
    warden.forcedTargetTimer = DT / 2;
    sim.tick();
    expect(warden.aggroTargetId).toBe(sim.player.id);
    sim.tick();
    expect(warden.forcedTargetId).toBeNull();
    expect(warden.aggroTargetId).toBe(challenger.id);
    warden.threat.clear();
    warden.threat.set(sim.player.id, 10_000);
    warden.aggroTargetId = sim.player.id;

    for (const addId of state.assemblyAddIds) {
      const add = sim.entities.get(addId);
      if (add && add.id !== warden.id) add.dead = true;
    }

    sim.player.pos = sim.ctx.groundPos(warden.pos.x + 10, warden.pos.z);
    sim.player.prevPos = { ...sim.player.pos };
    const beforePursuit = Math.hypot(
      warden.pos.x - sim.player.pos.x,
      warden.pos.z - sim.player.pos.z,
    );
    sim.tick();
    expect(
      Math.hypot(warden.pos.x - sim.player.pos.x, warden.pos.z - sim.player.pos.z),
    ).toBeLessThan(beforePursuit);

    sim.player.pos = sim.ctx.groundPos(warden.pos.x + 1, warden.pos.z);
    sim.player.prevPos = { ...sim.player.pos };
    warden.bigCastTimer = DT;
    warden.swingTimer = 0;
    const hpBeforeMelee = sim.player.hp;
    const quakeStartEvents = sim.tick();
    expect(sim.player.hp).toBeLessThan(hpBeforeMelee);
    expect(warden.castingAbility).toBe('crucible_quake');
    expect(quakeStartEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'spellfx',
          sourceId: warden.id,
          targetId: warden.id,
          fx: 'windup',
          ability: 'crucible_quake',
        }),
      ]),
    );
    const firstCastStartedAt = sim.ctx.time;

    sim.player.pos = sim.ctx.groundPos(warden.pos.x + 10, warden.pos.z);
    sim.player.prevPos = { ...sim.player.pos };
    const castRemainingBeforePursuit = warden.castRemaining;
    const distanceBeforeCastPursuit = Math.hypot(
      warden.pos.x - sim.player.pos.x,
      warden.pos.z - sim.player.pos.z,
    );
    sim.tick();
    expect(
      Math.hypot(warden.pos.x - sim.player.pos.x, warden.pos.z - sim.player.pos.z),
    ).toBeLessThan(distanceBeforeCastPursuit);
    expect(warden.castRemaining).toBeLessThan(castRemainingBeforePursuit);
    expect(warden.castingAbility).toBe('crucible_quake');

    sim.player.pos = sim.ctx.groundPos(warden.pos.x + 1, warden.pos.z);
    sim.player.prevPos = { ...sim.player.pos };
    warden.swingTimer = 0;
    const hpBeforeCastingMelee = sim.player.hp;
    sim.tick();
    expect(sim.player.hp).toBeLessThan(hpBeforeCastingMelee);
    expect(warden.castingAbility).toBe('crucible_quake');

    warden.swingTimer = 999;
    state.assemblyForgeOverheat = 0.2;
    const quakeDamage: number[] = [];
    for (let tick = 0; tick < 60 && warden.castingAbility === 'crucible_quake'; tick++) {
      for (const event of sim.tick()) {
        if (
          event.type === 'damage' &&
          event.sourceId === warden.id &&
          event.ability === 'Crucible Quake'
        ) {
          quakeDamage.push(event.amount);
        }
      }
    }
    expect(warden.castingAbility).toBeNull();
    expect(quakeDamage).toHaveLength(1);
    expect(quakeDamage[0]).toBeGreaterThanOrEqual(260);
    expect(quakeDamage[0]).toBeLessThanOrEqual(330);
    expect(state.assemblyForgeOverheat).toBeCloseTo(0.3, 8);
    for (let tick = 0; tick < 240 && warden.castingAbility !== 'crucible_quake'; tick++) {
      sim.tick();
    }
    expect(warden.castingAbility).toBe('crucible_quake');
    expect(sim.ctx.time - firstCastStartedAt).toBeCloseTo(12, 4);

    state.assemblyPhase = 'done';
    state.assemblyForgeOverheat = 0.3;
    warden.castRemaining = DT;
    sim.tick();
    expect(warden.castingAbility).toBeNull();
    expect(state.assemblyForgeOverheat).toBeCloseTo(0.3, 8);
  });

  it('lets Pummel interrupt Quake, applies fire lockout, and preserves its 12-second cadence', () => {
    const { sim, boss } = claimedEncounter(718);
    sim.setPlayerLevel(20);
    boss.hp = Math.floor(boss.maxHp * 0.5);
    updateVarkhulEncounter(sim.ctx, boss);
    const state = boss.varkhul;
    if (!state) throw new Error('Varkhul state missing');
    for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
    updateVarkhulEncounter(sim.ctx, boss);
    state.assemblyForgeBeamWarmupRemaining = 999;
    const warden = state.assemblyAddIds
      .map((id) => sim.entities.get(id))
      .find((add) => add?.templateId === VARKHUL_CRUCIBLE_WARDEN_ID);
    if (!warden) throw new Error('Crucible Warden did not emerge');
    for (const addId of state.assemblyAddIds) {
      const add = sim.entities.get(addId);
      if (add && add.id !== warden.id) add.dead = true;
    }
    sim.player.pos = sim.ctx.groundPos(warden.pos.x + 1, warden.pos.z);
    sim.player.prevPos = { ...sim.player.pos };
    warden.swingTimer = 999;
    warden.bigCastTimer = DT;
    state.assemblyForgeOverheat = 0.2;
    sim.tick();
    expect(warden.castingAbility).toBe('crucible_quake');
    const firstCastStartedAt = sim.ctx.time;

    const meta = sim.players.get(sim.playerId);
    const resolved = (
      sim as unknown as { resolvedAbility(id: string, pid: number): unknown }
    ).resolvedAbility('pummel', sim.playerId);
    if (!meta || !resolved) throw new Error('Pummel did not resolve');
    (
      sim.ctx as unknown as {
        runEffects(
          player: Entity,
          playerMeta: typeof meta,
          target: Entity,
          resolved: unknown,
        ): void;
      }
    ).runEffects(sim.player, meta, warden, resolved);
    expect(warden.castingAbility).toBeNull();
    expect(warden.auras).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'lockout', school: 'fire' })]),
    );
    expect(state.assemblyForgeOverheat).toBe(0.2);

    for (let tick = 0; tick < 239; tick++) {
      sim.tick();
      expect(warden.castingAbility).toBeNull();
    }
    sim.tick();
    expect(warden.castingAbility).toBe('crucible_quake');
    expect(sim.ctx.time - firstCastStartedAt).toBeCloseTo(12, 4);
  });

  it('replays Warden and Artificer portals, casts, heals, IDs, and rng draws for the same seed', () => {
    const run = () => {
      const { sim, boss } = claimedEncounter(719, true);
      boss.hp = Math.floor(boss.maxHp * 0.5);
      updateVarkhulEncounter(sim.ctx, boss);
      const state = boss.varkhul;
      if (!state) throw new Error('Varkhul state missing');
      for (const pending of state.assemblyPortalSpawns) pending.remaining = DT;
      updateVarkhulEncounter(sim.ctx, boss);
      state.assemblyForgeBeamWarmupRemaining = 999;
      const warden = state.assemblyAddIds
        .map((id) => sim.entities.get(id))
        .find((add) => add?.templateId === VARKHUL_CRUCIBLE_WARDEN_ID);
      if (!warden) throw new Error('Crucible Warden did not emerge');
      for (const addId of state.assemblyAddIds) {
        const add = sim.entities.get(addId);
        if (add && add.id !== warden.id) add.dead = true;
      }
      sim.player.pos = sim.ctx.groundPos(warden.pos.x + 1, warden.pos.z);
      sim.player.prevPos = { ...sim.player.pos };
      warden.swingTimer = 999;
      warden.bigCastTimer = DT;
      const draws: number[] = [];
      sim.rng.setObserver((value) => draws.push(value));
      const quakeEvents: unknown[] = [];
      const artificerEvents: unknown[] = [];
      for (let tick = 0; tick < 520; tick++) {
        const events = sim.tick();
        quakeEvents.push(
          ...events.filter((event) => event.type === 'spellfx' && event.sourceId === warden.id),
        );
        artificerEvents.push(
          ...events.filter(
            (event) =>
              (event.type === 'spellfx' &&
                (event.ability === VARKHUL_CINDER_REPAIR_START_ANIMATION_ID ||
                  event.ability === VARKHUL_CINDER_REPAIR_CAST_ID ||
                  event.ability === VARKHUL_CINDER_REPAIR_END_ANIMATION_ID)) ||
              (event.type === 'heal2' && event.ability === VARKHUL_CINDER_REPAIR_CAST_ID),
          ),
        );
      }
      sim.rng.setObserver(null);
      const artificerIds = state.assemblyAddIds.filter(
        (id) => sim.entities.get(id)?.templateId === VARKHUL_CINDER_ARTIFICER_ID,
      );
      return {
        draws,
        addIds: [...state.assemblyAddIds],
        targetId: warden.aggroTargetId,
        quakeEvents,
        artificerEvents,
        artificerIds,
        artificerPending: state.assemblyArtificerPortalSpawns.map((pending) => ({ ...pending })),
        artificerSpawnIndex: state.assemblyArtificerSpawnIndex,
        artificerTimer: state.assemblyArtificerNextSpawnRemaining,
        artificerRepaired: state.assemblyArtificerRepaired,
        bossHp: boss.hp,
        phase: state.assemblyPhase,
        bigCastTimer: warden.bigCastTimer,
      };
    };

    const first = run();
    const second = run();
    expect(first).toEqual(second);
    expect(first.draws.length).toBeGreaterThan(0);
    expect(first.quakeEvents.length).toBeGreaterThan(0);
    expect(first.artificerIds.length).toBeGreaterThan(0);
    expect(first.artificerEvents.length).toBeGreaterThan(2);
    expect(first.artificerRepaired).toBe(true);
  });
});
