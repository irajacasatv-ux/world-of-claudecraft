// Ignivar's encounter: ability cadence and gaps, Revolving Inferno, skyfire,
// meteors, Falling Cinders, Rain of Cinders and Brand. Forge Strike tanking,
// conduits, the pull lifecycle, Last Inferno and Apocalypse are in
// tests/ignivar_encounter_tanking_lifecycle.test.ts (split 2026-09-27 for shard
// balance; the shared encounter setup is tests/helpers/ignivar_harness.ts).

import { describe, expect, it } from 'vitest';
import { isDispellableAura } from '../src/sim/aura_classify';
import { DUNGEONS, instanceOrigin } from '../src/sim/data';
import { IGNIVAR_LAYOUT } from '../src/sim/dungeon_layout';
import {
  IGNIVAR_APOCALYPSE_ADD_ID,
  IGNIVAR_APOCALYPSE_HP_THRESHOLD,
  IGNIVAR_BRAND_AURA_ID,
  IGNIVAR_BRAND_EVERY,
  IGNIVAR_BRAND_EVERY_FINAL,
  IGNIVAR_BRAND_EVERY_LATE,
  IGNIVAR_BRAND_MAX_STACKS,
  IGNIVAR_BRAND_TARGETS_NORMAL,
  IGNIVAR_CONDUIT_ACTIVE_SECONDS,
  IGNIVAR_FINAL_FIRST_BRAND_SECONDS,
  IGNIVAR_FIRST_ROTATING_RAYS_SECONDS,
  IGNIVAR_FIRST_SKYFIRE_SECONDS,
  IGNIVAR_FIRST_SOAK_SECONDS,
  IGNIVAR_FORGE_STRIKE_EVERY,
  IGNIVAR_FORGE_STRIKE_MAX_HP,
  IGNIVAR_FORGE_WAVE_CAST_ID,
  IGNIVAR_FRONTAL_CAST_SECONDS,
  IGNIVAR_LAST_INFERNO_HP_THRESHOLD,
  IGNIVAR_LAST_INFERNO_SECONDS,
  IGNIVAR_MAJOR_ABILITY_GAP_SECONDS,
  IGNIVAR_MOLTEN_ARMOR_DURATION,
  IGNIVAR_MOLTEN_ARMOR_PER_STACK,
  IGNIVAR_ROTATING_RAYS_ACTIVE_SECONDS,
  IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED,
  IGNIVAR_ROTATING_RAYS_CAST_ID,
  IGNIVAR_ROTATING_RAYS_DAMAGE_MAX_HP,
  IGNIVAR_ROTATING_RAYS_EVERY,
  IGNIVAR_ROTATING_RAYS_PULSE_SECONDS,
  IGNIVAR_ROTATING_RAYS_WINDUP_SECONDS,
  IGNIVAR_SKYFIRE_CAST_ID,
  IGNIVAR_SKYFIRE_CAST_SECONDS,
  IGNIVAR_SKYFIRE_CONE_COUNT,
  IGNIVAR_SKYFIRE_DAMAGE_MAX_HP,
  IGNIVAR_SKYFIRE_EVERY,
  IGNIVAR_SKYFIRE_HALF_ANGLE,
  IGNIVAR_SKYFIRE_RANGE,
  IGNIVAR_SOAK_AURA_ID,
  IGNIVAR_SOAK_CAST_SECONDS,
  IGNIVAR_SOAK_EVERY,
  IGNIVAR_SOAK_RADIUS,
  IGNIVAR_SOAK_REQUIRED_PLAYERS,
  IGNIVAR_SOAK_SHARED_MAX_HP,
  ignivarBrandCadence,
  resetIgnivarEncounter,
  updateIgnivarEncounter,
} from '../src/sim/encounters/ignivar';
import { IGNIVAR_DIALOGUE } from '../src/sim/encounters/ignivar_dialogue';
import { polygonContainsPoint } from '../src/sim/geometry2d';
import {
  IGNIVAR_FORGE_CHAINS_ATTACH_GRACE_SECONDS,
  IGNIVAR_FORGE_CHAINS_AURA_ID,
  IGNIVAR_FORGE_CHAINS_BREAK_DISTANCE,
  IGNIVAR_FORGE_CHAINS_DURATION_SECONDS,
  IGNIVAR_FORGE_CHAINS_EVERY,
  IGNIVAR_FORGE_CHAINS_FIRST_SECONDS,
  IGNIVAR_FORGE_CHAINS_PAIR_COUNT,
  IGNIVAR_FORGE_CHAINS_STRAIN_SECONDS,
  updateIgnivarForgeChains,
} from '../src/sim/ignivar_forge_chains';
import {
  IGNIVAR_FIRST_FORGE_WAVE_SECONDS,
  IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS,
  IGNIVAR_FORGE_WAVE_DAMAGE_MAX_HP,
  IGNIVAR_FORGE_WAVE_EVERY,
  IGNIVAR_FORGE_WAVE_KNOCKBACK_HEROIC,
  IGNIVAR_FORGE_WAVE_KNOCKBACK_NORMAL,
  IGNIVAR_FORGE_WAVE_RANGE,
  IGNIVAR_FORGE_WAVE_WINDUP_SECONDS,
  ignivarForgeWaveKnockback,
} from '../src/sim/ignivar_forge_wave';
import {
  IGNIVAR_FIRST_METEOR_SECONDS,
  IGNIVAR_METEOR_CAST_ID,
  IGNIVAR_METEOR_COUNT_HEROIC,
  IGNIVAR_METEOR_COUNT_NORMAL,
  IGNIVAR_METEOR_DAMAGE_MAX_HP,
  IGNIVAR_METEOR_EVERY,
  IGNIVAR_METEOR_RADIUS,
  IGNIVAR_METEOR_REVEAL_DELAY_SECONDS,
  IGNIVAR_METEOR_TELEGRAPH_SECONDS,
} from '../src/sim/ignivar_meteors';
import { DT, dist2d, type SimEvent } from '../src/sim/types';
import {
  addEncounterPlayer,
  claimedEncounter,
  claimedHeroicEncounter,
  displaceOutOfArena,
  forgeWaveCadenceTrace,
  isolateForgeChains,
} from './helpers/ignivar_harness';

describe('Ignivar encounter', () => {
  it('applies the calibrated Heroic tuning through the real boss and Heart spawn path', () => {
    const { sim, boss } = claimedHeroicEncounter();

    expect(boss.maxHp).toBe(210_000);
    expect(boss.weapon).toEqual({ min: 619, max: 968, speed: 2.6 });
    expect(boss.stats.armor).toBe(1_058);
    expect(boss.mechanicDamageMult).toBe(2);
    expect(boss.mechanicHealMult).toBe(1.75);

    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    const heart = [...sim.entities.values()].find(
      (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
    );

    expect(heart?.maxHp).toBe(12_250);
    expect(heart?.weapon).toEqual({ min: 0, max: 0, speed: 2.6 });
    expect(heart?.stats.armor).toBe(302);
    expect(heart?.mechanicDamageMult).toBe(2);
    expect(heart?.mechanicHealMult).toBe(1.75);
  });

  it('keeps Chains of the Forge exclusive to Heroic difficulty', () => {
    const { sim, boss } = claimedEncounter();
    const first = addEncounterPlayer(sim, boss, 'Normal Chain One');
    const second = addEncounterPlayer(sim, boss, 'Normal Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
  });

  it('holds a due Heroic chain behind an active major cast and its six-second gap', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Spaced Chain One');
    const second = addEncounterPlayer(sim, boss, 'Spaced Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.frontalCastRemaining = DT;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(boss.ignivar.forgeChainsTimer).toBe(IGNIVAR_MAJOR_ABILITY_GAP_SECONDS);
  });

  it('lets an armed Falling Cinders impact finish before a due Heroic chain starts', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Meteor Chain One');
    const second = addEncounterPlayer(sim, boss, 'Meteor Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.meteorPoints = [{ x: boss.pos.x + 10, z: boss.pos.z }];
    boss.ignivar.meteorImpactRemaining = DT;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(boss.ignivar.meteorImpactRemaining).toBe(0);
    expect(boss.ignivar.meteorPoints).toEqual([]);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
  });

  it('starts Heroic chains at 18 seconds and rearms them for exactly 32 seconds', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Cadence Chain One');
    const second = addEncounterPlayer(sim, boss, 'Cadence Chain Two');

    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    isolateForgeChains(boss, boss.ignivar.forgeChainsTimer);
    const firstActivationTicks = Math.ceil(IGNIVAR_FORGE_CHAINS_FIRST_SECONDS / DT);
    for (let tick = 1; tick < firstActivationTicks - 1; tick++) {
      updateIgnivarEncounter(sim.ctx, boss);
    }
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    boss.ignivar.forgeChainsRemaining = DT;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar.forgeChainsTimer).toBe(IGNIVAR_FORGE_CHAINS_EVERY);

    second.pos = { ...first.pos };
    second.prevPos = { ...second.pos };
    const repeatTicks = Math.ceil(IGNIVAR_FORGE_CHAINS_EVERY / DT);
    for (let tick = 0; tick < repeatTicks - 1; tick++) {
      updateIgnivarEncounter(sim.ctx, boss);
    }
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
  });

  it('executes both linked players when a Heroic chain is stretched too far', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Heroic Chain One');
    const second = addEncounterPlayer(sim, boss, 'Heroic Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);

    updateIgnivarEncounter(sim.ctx, boss);

    const firstChain = first.auras.find((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID);
    const secondChain = second.auras.find((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID);
    expect(firstChain?.value2).toBe(second.id);
    expect(secondChain?.value2).toBe(first.id);
    expect(firstChain?.duration).toBe(IGNIVAR_FORGE_CHAINS_DURATION_SECONDS);

    second.pos.x = first.pos.x + IGNIVAR_FORGE_CHAINS_BREAK_DISTANCE;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.forgeChainsAttachGraceRemaining = 0;
    const pairIndex = boss.ignivar.forgeChainsPlayerIds?.findIndex((pair) =>
      pair.includes(first.id),
    );
    if (pairIndex === undefined || pairIndex < 0) throw new Error('Chain pair was not retained');
    boss.ignivar.forgeChainsStrainSeconds[pairIndex] = IGNIVAR_FORGE_CHAINS_STRAIN_SECONDS - DT * 2;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.dead).toBe(false);
    expect(second.dead).toBe(false);
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    expect(boss.ignivar.forgeChainsStrainSeconds[pairIndex]).toBeCloseTo(
      IGNIVAR_FORGE_CHAINS_STRAIN_SECONDS - DT,
    );
    boss.ignivar.forgeChainsRemaining = DT;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(first.dead).toBe(true);
    expect(first.hp).toBe(0);
    expect(second.dead).toBe(true);
    expect(second.hp).toBe(0);
  });

  it('preserves explicit GM and dev invulnerability when a chain severs', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const god = addEncounterPlayer(sim, boss, 'Invulnerable Chain God');
    const profiler = addEncounterPlayer(sim, boss, 'Invulnerable Chain Profiler');
    const gm = addEncounterPlayer(sim, boss, 'Invulnerable Chain GM');
    const mortal = addEncounterPlayer(sim, boss, 'Mortal Chain Partner');
    god.devGod = true;
    profiler.profilerInvulnerable = true;
    gm.gm = true;
    const positions = [
      [god, -20, 0],
      [profiler, 20, 0],
      [gm, -20, 20],
      [mortal, 20, 20],
    ] as const;
    for (const [player, x, z] of positions) {
      player.pos = { x, y: 0, z };
      player.prevPos = { ...player.pos };
    }
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.forgeChainsPlayerIds = [
      [god.id, profiler.id],
      [gm.id, mortal.id],
    ];
    boss.ignivar.forgeChainsRemaining = 1;
    boss.ignivar.forgeChainsAttachGraceRemaining = 0;
    boss.ignivar.forgeChainsStrainSeconds = positions
      .slice(0, 2)
      .map(() => IGNIVAR_FORGE_CHAINS_STRAIN_SECONDS - DT);
    boss.ignivar.forgeChainsLastPositions = positions.map(([player, x, z]) => ({
      playerId: player.id,
      x,
      z,
    }));

    const result = updateIgnivarForgeChains(
      sim.ctx,
      boss,
      boss.ignivar,
      positions.map(([player]) => player),
      false,
    );

    expect(result).toBe('resolved');
    expect(god.dead).toBe(false);
    expect(profiler.dead).toBe(false);
    expect(gm.dead).toBe(false);
    expect(mortal.dead).toBe(true);
  });

  it('links every player into five proximity pairs in a full Heroic raid', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const players = Array.from({ length: 9 }, (_, index) =>
      addEncounterPlayer(sim, boss, `Heroic Chain Group ${index + 1}`),
    );
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);

    updateIgnivarEncounter(sim.ctx, boss);

    const linkedPlayers = [sim.player, ...players].filter((player) =>
      player.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID),
    );
    expect(linkedPlayers).toHaveLength(10);
    expect(boss.ignivar?.forgeChainsPlayerIds).toHaveLength(5);
    const partnerIds = linkedPlayers.map(
      (player) => player.auras.find((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)?.value2,
    );
    expect(new Set(partnerIds).size).toBe(10);
  });

  it('breaks a Heroic chain and kills a third player who crosses it', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Chain Crossing First');
    first.pos = { x: boss.pos.x + 1, y: boss.pos.y, z: boss.pos.z + 2 };
    first.prevPos = { ...first.pos };
    const partner = addEncounterPlayer(sim, boss, 'Chain Crossing Partner');
    partner.pos = { x: boss.pos.x + 5, y: boss.pos.y, z: boss.pos.z + 2 };
    partner.prevPos = { ...partner.pos };
    const intruder = addEncounterPlayer(sim, boss, 'Chain Crossing Intruder');
    intruder.pos = { x: boss.pos.x + 3, y: boss.pos.y, z: boss.pos.z + 7 };
    intruder.prevPos = { ...intruder.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar?.forgeChainsPlayerIds).toContainEqual([first.id, partner.id]);
    expect(intruder.auras.find((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)?.value2).toBe(
      sim.player.id,
    );
    intruder.pos = { x: boss.pos.x + 3, y: boss.pos.y, z: boss.pos.z - 3 };
    // Render interpolation history is deliberately stationary: Chains owns
    // its authoritative previous-position sample instead of trusting prevPos.
    intruder.prevPos = { ...intruder.pos };

    updateIgnivarEncounter(sim.ctx, boss);

    expect(intruder.dead).toBe(true);
    expect(intruder.hp).toBe(0);
    expect(first.dead).toBe(false);
    expect(partner.dead).toBe(false);
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(partner.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(boss.ignivar?.forgeChainsPlayerIds).toBeNull();
  });

  it('resolves every simultaneous crossing during the chains final active tick', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Simultaneous Chain First');
    const second = addEncounterPlayer(sim, boss, 'Simultaneous Chain Second');
    const third = addEncounterPlayer(sim, boss, 'Simultaneous Chain Third');
    const fourth = addEncounterPlayer(sim, boss, 'Simultaneous Chain Fourth');
    const firstIntruder = addEncounterPlayer(sim, boss, 'Simultaneous Intruder One');
    const secondIntruder = addEncounterPlayer(sim, boss, 'Simultaneous Intruder Two');
    const positions = [
      [first, -5, 0],
      [second, 5, 0],
      [third, -5, 10],
      [fourth, 5, 10],
      [firstIntruder, 0, 2],
      [secondIntruder, 0, 12],
    ] as const;
    for (const [player, x, z] of positions) {
      player.pos = { x, y: 0, z };
      player.prevPos = { ...player.pos };
    }
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.forgeChainsPlayerIds = [
      [first.id, second.id],
      [third.id, fourth.id],
    ];
    boss.ignivar.forgeChainsRemaining = DT;
    boss.ignivar.forgeChainsAttachGraceRemaining = 0;
    boss.ignivar.forgeChainsStrainSeconds = [0, 0];
    boss.ignivar.forgeChainsLastPositions = positions.map(([player, x, z]) => ({
      playerId: player.id,
      x,
      z: player.id === firstIntruder.id ? -2 : player.id === secondIntruder.id ? 8 : z,
    }));

    const result = updateIgnivarForgeChains(
      sim.ctx,
      boss,
      boss.ignivar,
      positions.map(([player]) => player),
      false,
    );

    expect(result).toBe('resolved');
    expect(firstIntruder.dead).toBe(true);
    expect(secondIntruder.dead).toBe(true);
    expect([first, second, third, fourth].every((player) => !player.dead)).toBe(true);
    expect(boss.ignivar.forgeChainsPlayerIds).toBeNull();
  });

  it('attaches a distant Heroic pair before allowing the tether to strain', () => {
    const { sim, boss } = claimedHeroicEncounter();
    sim.player.pos = { x: boss.pos.x - 20, y: boss.pos.y, z: boss.pos.z };
    sim.player.prevPos = { ...sim.player.pos };
    const partner = addEncounterPlayer(sim, boss, 'Distant Chain Partner');
    partner.pos = { x: boss.pos.x + 20, y: boss.pos.y, z: boss.pos.z };
    partner.prevPos = { ...partner.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.auras.find((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)?.value2).toBe(
      partner.id,
    );
    expect(partner.hp).toBe(partner.maxHp);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    const pairIndex = boss.ignivar.forgeChainsPlayerIds?.findIndex((pair) =>
      pair.includes(sim.player.id),
    );
    if (pairIndex === undefined || pairIndex < 0) throw new Error('Distant pair was not retained');
    boss.ignivar.forgeChainsAttachGraceRemaining = 0;
    boss.ignivar.forgeChainsStrainSeconds[pairIndex] = IGNIVAR_FORGE_CHAINS_STRAIN_SECONDS / 2;
    partner.pos = { ...sim.player.pos, x: sim.player.pos.x + 2 };
    partner.prevPos = { ...partner.pos };

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.forgeChainsStrainSeconds[pairIndex]).toBe(0);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
  });

  it('resolves safely when linked Heroic players stay together until expiry', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Failed Chain One');
    const second = addEncounterPlayer(sim, boss, 'Failed Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.forgeChainsRemaining = DT;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(first.hp).toBe(first.maxHp);
    expect(second.hp).toBe(second.maxHp);
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
  });

  it('clears an active Heroic chain when the encounter resets', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Reset Chain One');
    const second = addEncounterPlayer(sim, boss, 'Reset Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(true);

    resetIgnivarEncounter(sim.ctx, boss);

    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
    expect(boss.ignivar).toBeUndefined();
  });

  it('finishes an active Heroic chain before Last Inferno can begin', () => {
    const { sim, boss } = claimedHeroicEncounter();
    addEncounterPlayer(sim, boss, 'Phase Chain One');
    addEncounterPlayer(sim, boss, 'Phase Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.forgeChainsPlayerIds).not.toBeNull();
    expect(boss.ignivar.lastInfernoTriggered).toBe(false);
  });

  it('cancels Heroic chains without damage when either partner leaves the arena', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Leaving Chain One');
    const second = addEncounterPlayer(sim, boss, 'Leaving Chain Two');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    const firstHp = first.hp;
    const secondHp = second.hp;

    displaceOutOfArena(sim, first);
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.forgeChainsPlayerIds).toBeNull();
    expect(first.hp).toBe(firstHp);
    expect(second.hp).toBe(secondHp);
    expect(second.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
  });

  it('cancels Heroic chains without damage when the second partner leaves the arena', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Staying Chain Partner');
    const second = addEncounterPlayer(sim, boss, 'Second Leaving Chain Partner');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    const firstHp = first.hp;
    const secondHp = second.hp;

    displaceOutOfArena(sim, second);
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.forgeChainsPlayerIds).toBeNull();
    expect(first.hp).toBe(firstHp);
    expect(second.hp).toBe(secondHp);
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
  });

  it('cancels Heroic chains without damage when the second partner dies', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const first = addEncounterPlayer(sim, boss, 'Living Chain Partner');
    const second = addEncounterPlayer(sim, boss, 'Dead Chain Partner');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    const firstHp = first.hp;
    second.dead = true;
    second.hp = 0;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.forgeChainsPlayerIds).toBeNull();
    expect(first.hp).toBe(firstHp);
    expect(first.auras.some((aura) => aura.id === IGNIVAR_FORGE_CHAINS_AURA_ID)).toBe(false);
  });

  it('ships the Normal cadence as explicit tuning constants', () => {
    expect(IGNIVAR_FORGE_CHAINS_FIRST_SECONDS).toBe(18);
    expect(IGNIVAR_FORGE_CHAINS_EVERY).toBe(32);
    expect(IGNIVAR_FORGE_CHAINS_DURATION_SECONDS).toBe(8);
    expect(IGNIVAR_FORGE_CHAINS_BREAK_DISTANCE).toBe(10);
    expect(IGNIVAR_FORGE_CHAINS_PAIR_COUNT).toBe(5);
    expect(IGNIVAR_FORGE_CHAINS_ATTACH_GRACE_SECONDS).toBe(2.5);
    expect(IGNIVAR_FORGE_CHAINS_STRAIN_SECONDS).toBe(0.75);
    expect(IGNIVAR_BRAND_TARGETS_NORMAL).toBe(3);
    expect(IGNIVAR_BRAND_EVERY).toBe(28);
    expect(IGNIVAR_BRAND_EVERY_LATE).toBe(20);
    expect(IGNIVAR_BRAND_EVERY_FINAL).toBe(12);
    expect(IGNIVAR_FINAL_FIRST_BRAND_SECONDS).toBe(4);
    expect(IGNIVAR_BRAND_MAX_STACKS).toBe(3);
    expect(IGNIVAR_FORGE_STRIKE_EVERY).toBe(14);
    expect(IGNIVAR_FORGE_STRIKE_MAX_HP).toBe(0.35);
    expect(IGNIVAR_MAJOR_ABILITY_GAP_SECONDS).toBe(6);
    expect(IGNIVAR_FIRST_FORGE_WAVE_SECONDS).toBe(50);
    expect(IGNIVAR_FORGE_WAVE_EVERY).toBe(60);
    expect(IGNIVAR_FORGE_WAVE_WINDUP_SECONDS).toBe(2.5);
    expect(IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS).toBe(3);
    expect(IGNIVAR_FORGE_WAVE_DAMAGE_MAX_HP).toBe(0.5);
    expect(IGNIVAR_FORGE_WAVE_KNOCKBACK_NORMAL).toBe(4);
    expect(IGNIVAR_FORGE_WAVE_KNOCKBACK_HEROIC).toBe(6);
    expect(ignivarForgeWaveKnockback('normal')).toBe(4);
    expect(ignivarForgeWaveKnockback('heroic')).toBe(6);
    expect(IGNIVAR_MOLTEN_ARMOR_DURATION).toBe(26);
    expect(IGNIVAR_MOLTEN_ARMOR_PER_STACK).toBe(0.35);
    expect(IGNIVAR_FRONTAL_CAST_SECONDS).toBe(3);
    expect(IGNIVAR_CONDUIT_ACTIVE_SECONDS).toBe(10);
    expect(IGNIVAR_LAST_INFERNO_HP_THRESHOLD).toBe(0.2);
    expect(IGNIVAR_LAST_INFERNO_SECONDS).toBe(45);
    expect(IGNIVAR_SKYFIRE_CAST_SECONDS).toBe(3);
    expect(IGNIVAR_FIRST_SKYFIRE_SECONDS).toBe(16);
    expect(IGNIVAR_SKYFIRE_EVERY).toBe(20);
    expect(IGNIVAR_SKYFIRE_DAMAGE_MAX_HP).toBe(0.6);
    expect(IGNIVAR_SKYFIRE_RANGE).toBe(30);
    expect(IGNIVAR_SKYFIRE_HALF_ANGLE).toBe(Math.PI / 10);
    expect(IGNIVAR_SKYFIRE_CONE_COUNT).toBe(3);
    expect(IGNIVAR_FIRST_METEOR_SECONDS).toBe(13);
    expect(IGNIVAR_METEOR_EVERY).toBe(17);
    expect(IGNIVAR_METEOR_TELEGRAPH_SECONDS).toBe(2.5);
    expect(IGNIVAR_METEOR_REVEAL_DELAY_SECONDS).toBe(0.75);
    expect(IGNIVAR_METEOR_DAMAGE_MAX_HP).toBe(0.5);
    expect(IGNIVAR_FIRST_ROTATING_RAYS_SECONDS).toBe(30);
    expect(IGNIVAR_ROTATING_RAYS_EVERY).toBe(44);
    expect(IGNIVAR_ROTATING_RAYS_WINDUP_SECONDS).toBe(2);
    expect(IGNIVAR_ROTATING_RAYS_ACTIVE_SECONDS).toBe(8);
    expect(IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED).toBe(Math.PI / 10);
    expect(IGNIVAR_ROTATING_RAYS_PULSE_SECONDS).toBe(0.5);
    expect(IGNIVAR_ROTATING_RAYS_DAMAGE_MAX_HP).toBe(0.3);
    expect(IGNIVAR_SOAK_CAST_SECONDS).toBe(6);
    expect(IGNIVAR_FIRST_SOAK_SECONDS).toBe(24);
    expect(IGNIVAR_SOAK_EVERY).toBe(34);
    expect(IGNIVAR_SOAK_REQUIRED_PLAYERS).toBe(4);
    expect(IGNIVAR_SOAK_RADIUS).toBe(5.5);
    expect(IGNIVAR_SOAK_SHARED_MAX_HP).toBe(1.2);
  });

  it('switches mark cadence at the exact late-phase boundary', () => {
    expect(ignivarBrandCadence(0.450001, false)).toBe(28);
    expect(ignivarBrandCadence(0.45, false)).toBe(20);
    expect(ignivarBrandCadence(0.2, true)).toBe(12);
  });

  it('expands Forge Wave once through unsafe arcs while opposite gaps remain safe', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.castingAbility).toBe(IGNIVAR_FORGE_WAVE_CAST_ID);
    expect(boss.castTotal).toBe(IGNIVAR_FORGE_WAVE_WINDUP_SECONDS);
    expect(boss.channeling).toBe(false);
    const lockedFacing = boss.ignivar.forgeWaveFacing;

    const safe = addEncounterPlayer(sim, boss, 'Safe Gap');
    const secondUnsafe = addEncounterPlayer(sim, boss, 'Second Unsafe');
    const pointAt = (angle: number, radius: number) => ({
      x: boss.pos.x + Math.sin(angle) * radius,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(angle) * radius,
    });
    sim.player.pos = pointAt(lockedFacing + Math.PI / 2, 10);
    sim.player.prevPos = { ...sim.player.pos };
    safe.pos = pointAt(lockedFacing, 10);
    safe.prevPos = { ...safe.pos };
    secondUnsafe.pos = pointAt(lockedFacing - Math.PI / 2, 10);
    secondUnsafe.prevPos = { ...secondUnsafe.pos };

    boss.ignivar.forgeWaveWindupRemaining = 0.01;
    const releaseEvents = sim.tick();
    const releaseBursts = releaseEvents.filter(
      (event): event is Extract<SimEvent, { type: 'spellfxAt' }> =>
        event.type === 'spellfxAt' && event.ability === IGNIVAR_FORGE_WAVE_CAST_ID,
    );
    expect(releaseBursts).toHaveLength(1);
    expect(releaseBursts[0]).toMatchObject({
      x: boss.pos.x,
      z: boss.pos.z,
      school: 'fire',
      fx: 'burst',
      sourceId: boss.id,
    });
    expect(releaseBursts[0]?.radius).toBeUndefined();
    expect(boss.channeling).toBe(true);
    expect(boss.castTotal).toBe(IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS);

    boss.ignivar.forgeWaveRadius = 9;
    boss.ignivar.forgeWaveActiveRemaining =
      IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS * (1 - 10 / IGNIVAR_FORGE_WAVE_RANGE) + DT;
    const unsafeHp = sim.player.hp;
    const secondUnsafeHp = secondUnsafe.hp;
    const safeHp = safe.hp;
    const unsafeDistance = Math.hypot(sim.player.pos.x - boss.pos.x, sim.player.pos.z - boss.pos.z);
    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.hp).toBe(
      unsafeHp - Math.ceil(sim.player.maxHp * IGNIVAR_FORGE_WAVE_DAMAGE_MAX_HP),
    );
    const pushedDistance = Math.hypot(sim.player.pos.x - boss.pos.x, sim.player.pos.z - boss.pos.z);
    expect(pushedDistance).toBeCloseTo(unsafeDistance + IGNIVAR_FORGE_WAVE_KNOCKBACK_NORMAL, 5);
    expect(safe.hp).toBe(safeHp);
    expect(secondUnsafe.hp).toBe(
      secondUnsafeHp - Math.ceil(secondUnsafe.maxHp * IGNIVAR_FORGE_WAVE_DAMAGE_MAX_HP),
    );
    expect(boss.ignivar.forgeWaveHitPlayerIds).toEqual([sim.player.id, secondUnsafe.id]);
    expect(boss.facing).toBe(lockedFacing);

    const hpAfterFirstHit = sim.player.hp;
    const secondHpAfterFirstHit = secondUnsafe.hp;
    const nextRadius = boss.ignivar.forgeWaveRadius + 0.5;
    sim.player.pos = pointAt(lockedFacing + Math.PI / 2, nextRadius);
    sim.player.prevPos = { ...sim.player.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.hp).toBe(hpAfterFirstHit);
    expect(secondUnsafe.hp).toBe(secondHpAfterFirstHit);

    boss.ignivar.forgeWaveActiveRemaining = DT;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.castingAbility).toBeNull();
    expect(boss.channeling).toBe(false);
    expect(boss.castTotal).toBe(0);
    expect(boss.castRemaining).toBe(0);
    expect(boss.castTargetId).toBeNull();
    expect(boss.castAim).toBeNull();
  });

  it('knocks Heroic Forge Wave victims farther than Normal victims', () => {
    const encounters = [
      { ...claimedEncounter(), expectedKnockback: IGNIVAR_FORGE_WAVE_KNOCKBACK_NORMAL },
      {
        ...claimedHeroicEncounter(),
        expectedKnockback: IGNIVAR_FORGE_WAVE_KNOCKBACK_HEROIC,
      },
    ];

    for (const { sim, boss, expectedKnockback } of encounters) {
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.frontalTimer = 999;
      boss.ignivar.skyfireTimer = 999;
      boss.ignivar.rotatingRaysTimer = 999;
      boss.ignivar.forgeWaveTimer = 0;
      updateIgnivarEncounter(sim.ctx, boss);

      boss.ignivar.forgeWaveWindupRemaining = 0;
      boss.ignivar.forgeWaveActiveRemaining =
        IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS * (1 - 10 / IGNIVAR_FORGE_WAVE_RANGE) + DT;
      boss.ignivar.forgeWaveFacing = 0;
      boss.ignivar.forgeWaveRadius = 9;
      boss.ignivar.forgeWaveHitPlayerIds = [];
      sim.player.pos = { x: boss.pos.x + 10, y: boss.pos.y, z: boss.pos.z };
      sim.player.prevPos = { ...sim.player.pos };
      const distanceBefore = dist2d(boss.pos, sim.player.pos);

      updateIgnivarEncounter(sim.ctx, boss);

      expect(dist2d(boss.pos, sim.player.pos)).toBeCloseTo(distanceBefore + expectedKnockback, 5);
    }
  });

  it.each([
    {
      name: 'straight wall',
      bossOffset: { x: -25, z: 0 },
      victimOffset: { x: 25, z: 0 },
    },
    {
      name: 'diagonal wall',
      bossOffset: { x: -22, z: -22 },
      victimOffset: { x: 22, z: 22 },
    },
  ])(
    'sweeps the opposite $name, damages once, and only nudges its victim',
    ({ bossOffset, victimOffset }) => {
      const { sim, boss } = claimedEncounter();
      const origin = instanceOrigin(DUNGEONS.ignivar_raid_arena.index, 0);
      boss.pos = { x: origin.x + bossOffset.x, y: boss.pos.y, z: origin.z + bossOffset.z };
      sim.player.pos = {
        x: origin.x + victimOffset.x,
        y: sim.player.pos.y,
        z: origin.z + victimOffset.z,
      };
      sim.player.prevPos = { ...sim.player.pos };
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.frontalTimer = 999;
      boss.ignivar.skyfireTimer = 999;
      boss.ignivar.rotatingRaysTimer = 999;
      boss.ignivar.forgeWaveWindupRemaining = 0;
      boss.ignivar.forgeWaveActiveRemaining = IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS;
      boss.ignivar.forgeWaveFacing = 0;
      boss.ignivar.forgeWaveRadius = 0;
      boss.ignivar.forgeWaveHitPlayerIds = [];
      boss.castingAbility = IGNIVAR_FORGE_WAVE_CAST_ID;
      boss.channeling = true;
      const hpBefore = sim.player.hp;
      const positionBefore = { ...sim.player.pos };

      for (let tick = 0; tick < IGNIVAR_FORGE_WAVE_ACTIVE_SECONDS / DT; tick++) {
        updateIgnivarEncounter(sim.ctx, boss);
      }

      const shell = IGNIVAR_LAYOUT.shellPolygon;
      if (!shell) throw new Error('Ignivar arena polygon is missing');
      const roomDiameter = Math.max(
        ...shell.flatMap((from) => shell.map((to) => Math.hypot(to.x - from.x, to.z - from.z))),
      );
      expect(IGNIVAR_FORGE_WAVE_RANGE).toBeGreaterThanOrEqual(roomDiameter);
      expect(IGNIVAR_FORGE_WAVE_KNOCKBACK_NORMAL).toBeLessThan(IGNIVAR_FORGE_WAVE_RANGE / 10);
      expect(sim.player.hp).toBe(
        hpBefore - Math.ceil(sim.player.maxHp * IGNIVAR_FORGE_WAVE_DAMAGE_MAX_HP),
      );
      expect(
        Math.hypot(sim.player.pos.x - positionBefore.x, sim.player.pos.z - positionBefore.z),
      ).toBeLessThanOrEqual(IGNIVAR_FORGE_WAVE_KNOCKBACK_NORMAL);
      const localX = sim.player.pos.x - origin.x;
      const localZ = sim.player.pos.z - origin.z;
      expect(polygonContainsPoint(shell, localX, localZ)).toBe(true);
    },
  );

  it('replays the complete Forge Wave windup, sweep, and cadence deterministically', () => {
    const first = forgeWaveCadenceTrace(418);
    expect(forgeWaveCadenceTrace(418)).toEqual(first);
    expect(first).toEqual([
      {
        startTick: 1101,
        endTick: 1211,
        facingSlot: 0,
        windupFrames: 50,
        activeFrames: 60,
      },
      {
        startTick: 2380,
        endTick: 2490,
        facingSlot: 4,
        windupFrames: 50,
        activeFrames: 60,
      },
    ]);
  });

  it('warns before three rays rotate, damages crossings, and reverses the next cast', () => {
    const { sim, boss } = claimedEncounter();
    const safePlayer = addEncounterPlayer(sim, boss, 'Ray Gap');
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.castingAbility).toBe(IGNIVAR_ROTATING_RAYS_CAST_ID);
    expect(boss.castTotal).toBe(
      IGNIVAR_ROTATING_RAYS_WINDUP_SECONDS + IGNIVAR_ROTATING_RAYS_ACTIVE_SECONDS,
    );
    expect(boss.ignivar.rotatingRaysDirection).toBe(1);
    const lockedFacing = boss.ignivar.rotatingRaysFacing;
    sim.player.hp = sim.player.maxHp;
    safePlayer.hp = safePlayer.maxHp;
    sim.player.pos = {
      x: boss.pos.x + Math.sin(lockedFacing) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(lockedFacing) * 15,
    };
    safePlayer.pos = {
      x: boss.pos.x + Math.sin(lockedFacing + Math.PI / 3) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(lockedFacing + Math.PI / 3) * 15,
    };
    boss.ignivar.rotatingRaysWindupRemaining = DT;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.hp).toBe(sim.player.maxHp);
    expect(safePlayer.hp).toBe(safePlayer.maxHp);
    expect(boss.facing).toBeCloseTo(lockedFacing, 8);

    const damagingFacing = lockedFacing + IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
    sim.player.pos = {
      x: boss.pos.x + Math.sin(damagingFacing) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(damagingFacing) * 15,
    };
    safePlayer.pos = {
      x: boss.pos.x + Math.sin(damagingFacing + Math.PI / 3) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(damagingFacing + Math.PI / 3) * 15,
    };
    boss.ignivar.rotatingRaysPulseTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.facing).toBeCloseTo(damagingFacing, 8);
    expect(sim.player.hp).toBe(
      sim.player.maxHp - Math.ceil(sim.player.maxHp * IGNIVAR_ROTATING_RAYS_DAMAGE_MAX_HP),
    );
    expect(safePlayer.hp).toBe(safePlayer.maxHp);

    boss.ignivar.rotatingRaysActiveRemaining = DT;
    boss.ignivar.rotatingRaysPulseTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.castingAbility).toBeNull();
    boss.ignivar.rotatingRaysTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar.rotatingRaysDirection).toBe(-1);
  });

  it('keeps a clear gap after Revolving Inferno before another major ability', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.swingTimer = 999;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.castingAbility).toBe(IGNIVAR_ROTATING_RAYS_CAST_ID);

    boss.ignivar.frontalTimer = 0;
    boss.ignivar.skyfireTimer = 0;
    boss.ignivar.forgeWaveTimer = 0;
    boss.ignivar.soakTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.castingAbility).toBe(IGNIVAR_ROTATING_RAYS_CAST_ID);

    boss.ignivar.rotatingRaysWindupRemaining = 0;
    boss.ignivar.rotatingRaysActiveRemaining = DT;
    boss.ignivar.rotatingRaysPulseTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.castingAbility).toBeNull();
    expect(boss.ignivar.frontalTimer).toBeGreaterThanOrEqual(IGNIVAR_MAJOR_ABILITY_GAP_SECONDS);
    expect(boss.ignivar.skyfireTimer).toBeGreaterThanOrEqual(IGNIVAR_MAJOR_ABILITY_GAP_SECONDS);
    expect(boss.ignivar.forgeWaveTimer).toBeGreaterThanOrEqual(IGNIVAR_MAJOR_ABILITY_GAP_SECONDS);
  });

  it('applies the six-second gap after every cast-based major ability', () => {
    const assertReleaseGap = (
      seed: number,
      primeRelease: (boss: ReturnType<typeof claimedEncounter>['boss']) => void,
    ) => {
      const { sim, boss } = claimedEncounter(seed);
      sim.player.devGod = true;
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.brandTimer = 999;
      boss.ignivar.forgeStrikeTimer = 999;
      boss.ignivar.frontalTimer = 999;
      boss.ignivar.skyfireTimer = 0;
      boss.ignivar.rotatingRaysTimer = 999;
      boss.ignivar.forgeWaveTimer = 999;
      boss.ignivar.soakTimer = 999;
      boss.swingTimer = 999;
      primeRelease(boss);

      updateIgnivarEncounter(sim.ctx, boss);

      expect(boss.castingAbility).toBeNull();
      expect(boss.ignivar.skyfireTimer).toBeGreaterThanOrEqual(6);
    };

    assertReleaseGap(42, (boss) => {
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.frontalCastRemaining = DT;
    });
    assertReleaseGap(42, (boss) => {
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.skyfireCastRemaining = DT;
    });
    assertReleaseGap(42, (boss) => {
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.forgeWaveActiveRemaining = DT;
    });
  });

  it('keeps Revolving Inferno active for ten seconds and turns the rays by 144 degrees', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;
    const startEvents = sim.tick();
    expect(
      startEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.rotatingRays,
      ),
    ).toBe(true);
    const startFacing = boss.ignivar.rotatingRaysFacing;

    let castTicks = 0;
    while (boss.castingAbility === IGNIVAR_ROTATING_RAYS_CAST_ID && castTicks < 400) {
      updateIgnivarEncounter(sim.ctx, boss);
      castTicks++;
    }

    expect(castTicks * DT).toBeCloseTo(
      IGNIVAR_ROTATING_RAYS_WINDUP_SECONDS + IGNIVAR_ROTATING_RAYS_ACTIVE_SECONDS,
      5,
    );
    expect(boss.ignivar.rotatingRaysFacing - startFacing).toBeCloseTo(
      IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * IGNIVAR_ROTATING_RAYS_ACTIVE_SECONDS,
      8,
    );
    expect(boss.ignivar.rotatingRaysTimer).toBeCloseTo(
      IGNIVAR_ROTATING_RAYS_EVERY -
        IGNIVAR_ROTATING_RAYS_WINDUP_SECONDS -
        IGNIVAR_ROTATING_RAYS_ACTIVE_SECONDS,
      5,
    );
  });

  it('restores the boss facing when the encounter resets during rotating rays', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    const lockedBossFacing = boss.ignivar.rotatingRaysBossFacing;
    boss.ignivar.rotatingRaysWindupRemaining = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.facing).not.toBeCloseTo(lockedBossFacing, 8);

    resetIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar).toBeUndefined();
    expect(boss.facing).toBeCloseTo(lockedBossFacing, 8);
  });

  it('pulses an active rotating ray every half second without floating-point drift', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.rotatingRaysWindupRemaining = 0;
    const pulseTicks: number[] = [];

    for (let tick = 1; tick <= 21; tick++) {
      const nextFacing =
        boss.ignivar.rotatingRaysFacing +
        boss.ignivar.rotatingRaysDirection * IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
      sim.player.pos = {
        x: boss.pos.x + Math.sin(nextFacing) * 15,
        y: boss.pos.y,
        z: boss.pos.z + Math.cos(nextFacing) * 15,
      };
      sim.player.hp = sim.player.maxHp;
      updateIgnivarEncounter(sim.ctx, boss);
      if (sim.player.hp < sim.player.maxHp) pulseTicks.push(tick);
    }

    expect(pulseTicks).toEqual([1, 11, 21]);
  });

  it('damages a player who enters a rotating ray between pulse boundaries', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.rotatingRaysWindupRemaining = 0;

    const firstFacing =
      boss.ignivar.rotatingRaysFacing +
      boss.ignivar.rotatingRaysDirection * IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
    sim.player.pos = {
      x: boss.pos.x + Math.sin(firstFacing + Math.PI / 3) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(firstFacing + Math.PI / 3) * 15,
    };
    updateIgnivarEncounter(sim.ctx, boss);
    const beforeEntry = sim.player.hp;

    const nextFacing =
      boss.ignivar.rotatingRaysFacing +
      boss.ignivar.rotatingRaysDirection * IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
    sim.player.pos = {
      x: boss.pos.x + Math.sin(nextFacing) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(nextFacing) * 15,
    };
    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.hp).toBeLessThan(beforeEntry);
  });

  it('does not double-hit a late ray entry on the next global pulse boundary', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.rotatingRaysWindupRemaining = 0;

    for (let tick = 0; tick < 9; tick++) {
      const nextFacing =
        boss.ignivar.rotatingRaysFacing +
        boss.ignivar.rotatingRaysDirection * IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
      sim.player.pos = {
        x: boss.pos.x + Math.sin(nextFacing + Math.PI / 3) * 15,
        y: boss.pos.y,
        z: boss.pos.z + Math.cos(nextFacing + Math.PI / 3) * 15,
      };
      updateIgnivarEncounter(sim.ctx, boss);
    }

    const lateFacing =
      boss.ignivar.rotatingRaysFacing +
      boss.ignivar.rotatingRaysDirection * IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
    sim.player.pos = {
      x: boss.pos.x + Math.sin(lateFacing) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(lateFacing) * 15,
    };
    updateIgnivarEncounter(sim.ctx, boss);
    const hpAfterLateEntry = sim.player.hp;
    expect(hpAfterLateEntry).toBeLessThan(sim.player.maxHp);

    const boundaryFacing =
      boss.ignivar.rotatingRaysFacing +
      boss.ignivar.rotatingRaysDirection * IGNIVAR_ROTATING_RAYS_ANGULAR_SPEED * DT;
    sim.player.pos = {
      x: boss.pos.x + Math.sin(boundaryFacing) * 15,
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(boundaryFacing) * 15,
    };
    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.hp).toBe(hpAfterLateEntry);
  });

  it('telegraphs three skyfire cones, then releases three fire eruptions at cast end', () => {
    const { sim, boss } = claimedEncounter();
    const safePlayer = addEncounterPlayer(sim, boss, 'Safe Raider');
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.skyfireTimer = 0;

    const events = sim.tick();

    expect(boss.castingAbility).toBe(IGNIVAR_SKYFIRE_CAST_ID);
    expect(boss.castTotal).toBe(IGNIVAR_SKYFIRE_CAST_SECONDS);
    expect(
      events.some(
        (event) =>
          event.type === 'chat' &&
          event.channel === 'yell' &&
          event.fromPid === boss.id &&
          event.text === IGNIVAR_DIALOGUE.skyfire,
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === 'spellfxAt' &&
          (event.fx === 'meteorFall' || event.fx === 'ambientMeteorFall'),
      ),
    ).toBe(false);
    expect(
      events.some(
        (event) =>
          event.type === 'spellfxAt' &&
          event.fx === 'burst' &&
          event.ability === IGNIVAR_SKYFIRE_CAST_ID,
      ),
    ).toBe(false);
    const facing = boss.ignivar.skyfireFacing;
    const conePlayers = [
      sim.player,
      addEncounterPlayer(sim, boss, 'Second Cone'),
      addEncounterPlayer(sim, boss, 'Third Cone'),
    ];
    const gapPlayers = [
      safePlayer,
      addEncounterPlayer(sim, boss, 'Second Gap'),
      addEncounterPlayer(sim, boss, 'Third Gap'),
    ];
    const outsideRangePlayer = addEncounterPlayer(sim, boss, 'Outside Rain Range');
    for (let index = 0; index < conePlayers.length; index++) {
      const angle = facing + (index * Math.PI * 2) / IGNIVAR_SKYFIRE_CONE_COUNT;
      const radius = index === 0 ? 25 : index === 1 ? IGNIVAR_SKYFIRE_RANGE : 12;
      conePlayers[index].pos = {
        x: boss.pos.x + Math.sin(angle) * radius,
        y: boss.pos.y,
        z: boss.pos.z + Math.cos(angle) * radius,
      };
    }
    outsideRangePlayer.pos = {
      x: boss.pos.x + Math.sin(facing) * (IGNIVAR_SKYFIRE_RANGE + 0.01),
      y: boss.pos.y,
      z: boss.pos.z + Math.cos(facing) * (IGNIVAR_SKYFIRE_RANGE + 0.01),
    };
    for (let index = 0; index < gapPlayers.length; index++) {
      const angle = facing + Math.PI / 3 + (index * Math.PI * 2) / IGNIVAR_SKYFIRE_CONE_COUNT;
      gapPlayers[index].pos = {
        x: boss.pos.x + Math.sin(angle) * 12,
        y: boss.pos.y,
        z: boss.pos.z + Math.cos(angle) * 12,
      };
    }
    for (const player of [...conePlayers, ...gapPlayers, outsideRangePlayer]) {
      player.hp = player.maxHp;
    }
    const midCastEvents = sim.tick();
    expect(boss.castingAbility).toBe(IGNIVAR_SKYFIRE_CAST_ID);
    expect(boss.ignivar.skyfireCastRemaining).toBeGreaterThan(DT);
    expect(
      midCastEvents.some(
        (event) =>
          event.type === 'spellfxAt' &&
          event.fx === 'burst' &&
          event.ability === IGNIVAR_SKYFIRE_CAST_ID,
      ),
    ).toBe(false);
    boss.ignivar.skyfireCastRemaining = DT;
    const lockedFacing = boss.ignivar.skyfireFacing;
    safePlayer.pos = { x: boss.pos.x - 12, y: boss.pos.y, z: boss.pos.z };

    const releaseEvents = sim.tick();

    const fireEruptions = releaseEvents.filter(
      (event): event is Extract<SimEvent, { type: 'spellfxAt' }> =>
        event.type === 'spellfxAt' &&
        event.fx === 'burst' &&
        event.ability === IGNIVAR_SKYFIRE_CAST_ID,
    );
    expect(fireEruptions).toHaveLength(IGNIVAR_SKYFIRE_CONE_COUNT);
    for (let cone = 0; cone < IGNIVAR_SKYFIRE_CONE_COUNT; cone++) {
      const eruption = fireEruptions[cone];
      const eruptionFacing = lockedFacing + (cone * Math.PI * 2) / IGNIVAR_SKYFIRE_CONE_COUNT;
      expect(eruption.x).toBeCloseTo(
        boss.pos.x + Math.sin(eruptionFacing) * IGNIVAR_SKYFIRE_RANGE,
        8,
      );
      expect(eruption.z).toBeCloseTo(
        boss.pos.z + Math.cos(eruptionFacing) * IGNIVAR_SKYFIRE_RANGE,
        8,
      );
      expect(eruption.school).toBe('fire');
      expect(eruption.sourceId).toBe(boss.id);
      expect(eruption.radius).toBeUndefined();
    }

    for (const player of conePlayers) {
      expect(player.hp).toBe(
        player.maxHp - Math.ceil(player.maxHp * IGNIVAR_SKYFIRE_DAMAGE_MAX_HP),
      );
    }
    for (const player of gapPlayers) expect(player.hp).toBe(player.maxHp);
    expect(outsideRangePlayer.hp).toBe(outsideRangePlayer.maxHp);
    expect(boss.ignivar.skyfireFacing).toBe(lockedFacing);
    expect(boss.castingAbility).toBeNull();
  });

  it('warns with red meteor circles independently, then damages only on impact', () => {
    const { sim, boss } = claimedEncounter();
    const safePlayer = addEncounterPlayer(sim, boss, 'Meteor Safe');
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.skyfireTimer = 0;
    boss.ignivar.meteorTimer = 0;
    boss.swingTimer = 999;
    sim.player.hp = sim.player.maxHp;
    safePlayer.hp = safePlayer.maxHp;

    const events = sim.tick();

    expect(boss.castingAbility).toBe(IGNIVAR_SKYFIRE_CAST_ID);
    const warnings = events.filter(
      (event): event is Extract<SimEvent, { type: 'spellfxAt' }> =>
        event.type === 'spellfxAt' &&
        event.fx === 'meteorFall' &&
        event.ability === IGNIVAR_METEOR_CAST_ID,
    );
    expect(warnings).toHaveLength(IGNIVAR_METEOR_COUNT_NORMAL);
    expect(warnings.every((warning) => warning.radius === IGNIVAR_METEOR_RADIUS)).toBe(true);
    expect(warnings.every((warning) => warning.duration === IGNIVAR_METEOR_TELEGRAPH_SECONDS)).toBe(
      true,
    );
    expect(
      warnings.every((warning) => warning.warningLead === IGNIVAR_METEOR_REVEAL_DELAY_SECONDS),
    ).toBe(true);
    expect(warnings.map((warning) => warning.persistentId)).toEqual(
      sim.activeIgnivarMeteors.map((warning) => warning.id),
    );
    expect(sim.player.hp).toBe(sim.player.maxHp);
    expect(boss.ignivar.meteorTimer).toBeCloseTo(IGNIVAR_METEOR_EVERY, 8);

    const impact = boss.ignivar.meteorPoints[0];
    sim.player.pos = { x: impact.x, y: boss.pos.y, z: impact.z };
    safePlayer.pos = { x: boss.pos.x + 33, y: boss.pos.y, z: boss.pos.z };
    safePlayer.prevPos = { ...safePlayer.pos };
    sim.tick();
    expect(sim.player.hp).toBe(sim.player.maxHp);
    expect(safePlayer.hp).toBe(safePlayer.maxHp);

    boss.ignivar.meteorImpactRemaining = DT;
    const impactEvents = sim
      .tick()
      .filter(
        (event): event is Extract<SimEvent, { type: 'spellfxAt' }> =>
          event.type === 'spellfxAt' && event.fx === 'meteorImpact',
      );

    expect(sim.player.hp).toBe(
      sim.player.maxHp - Math.ceil(sim.player.maxHp * IGNIVAR_METEOR_DAMAGE_MAX_HP),
    );
    expect(safePlayer.hp).toBe(safePlayer.maxHp);
    expect(impactEvents.map((event) => event.persistentId)).toEqual(
      warnings.map((warning) => warning.persistentId),
    );
    expect(boss.ignivar.meteorPoints).toEqual([]);
  });

  it('casts two additional Falling Cinders with the Heroic encounter path', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const meteorTargets = Array.from({ length: IGNIVAR_METEOR_COUNT_HEROIC }, (_, index) => {
      const player = addEncounterPlayer(sim, boss, `Heroic Meteor ${index + 1}`);
      const angle = (index * Math.PI * 2) / IGNIVAR_METEOR_COUNT_HEROIC;
      player.pos = {
        x: boss.pos.x + Math.sin(angle) * 18,
        y: boss.pos.y,
        z: boss.pos.z + Math.cos(angle) * 18,
      };
      player.prevPos = { ...player.pos };
      return player;
    });
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.forgeChainsTimer = 999;
    boss.ignivar.meteorTimer = 0;
    boss.swingTimer = 999;

    const warnings = sim
      .tick()
      .filter(
        (event): event is Extract<SimEvent, { type: 'spellfxAt' }> =>
          event.type === 'spellfxAt' &&
          event.fx === 'meteorFall' &&
          event.ability === IGNIVAR_METEOR_CAST_ID,
      );

    expect(warnings).toHaveLength(IGNIVAR_METEOR_COUNT_HEROIC);
    expect(boss.ignivar.meteorPoints).toHaveLength(IGNIVAR_METEOR_COUNT_HEROIC);
    for (const target of meteorTargets) {
      expect(
        boss.ignivar.meteorPoints.some(
          (point) => point.x === target.pos.x && point.z === target.pos.z,
        ),
      ).toBe(true);
    }
    const frozenWarnings = boss.ignivar.meteorPoints.map((point) => ({ ...point }));
    for (const target of meteorTargets) {
      target.pos.x = boss.pos.x;
      target.pos.z = boss.pos.z;
    }
    sim.tick();
    expect(boss.ignivar.meteorPoints).toEqual(frozenWarnings);
  });

  it('targets five distinct non-tanks and freezes their positions on Normal', () => {
    const { sim, boss } = claimedEncounter();
    const meteorTargets = Array.from({ length: IGNIVAR_METEOR_COUNT_NORMAL }, (_, index) => {
      const player = addEncounterPlayer(sim, boss, `Normal Meteor ${index + 1}`);
      const angle = (index * Math.PI * 2) / IGNIVAR_METEOR_COUNT_NORMAL;
      player.pos = {
        x: boss.pos.x + Math.sin(angle) * 18,
        y: boss.pos.y,
        z: boss.pos.z + Math.cos(angle) * 18,
      };
      player.prevPos = { ...player.pos };
      return player;
    });
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.targetId = sim.player.id;
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.meteorTimer = 0;
    boss.swingTimer = 999;

    sim.tick();

    expect(boss.ignivar.meteorPoints).toHaveLength(IGNIVAR_METEOR_COUNT_NORMAL);
    expect(boss.ignivar.meteorPoints).toEqual(
      expect.arrayContaining(meteorTargets.map(({ pos }) => ({ x: pos.x, z: pos.z }))),
    );
    expect(
      boss.ignivar.meteorPoints.some(
        (point) => point.x === sim.player.pos.x && point.z === sim.player.pos.z,
      ),
    ).toBe(false);
    const frozenWarnings = boss.ignivar.meteorPoints.map((point) => ({ ...point }));
    for (const target of meteorTargets) {
      target.pos.x = boss.pos.x;
      target.pos.z = boss.pos.z;
    }
    sim.tick();
    expect(boss.ignivar.meteorPoints).toEqual(frozenWarnings);
  });

  it('starts Falling Cinders naturally after 13 seconds and every 17 seconds thereafter', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    const warningTicks: number[] = [];

    for (let tick = 1; tick <= 650 && warningTicks.length < 2; tick++) {
      const events = sim.tick();
      if (
        events.some(
          (event) =>
            event.type === 'spellfxAt' &&
            event.fx === 'meteorFall' &&
            event.ability === IGNIVAR_METEOR_CAST_ID,
        )
      ) {
        warningTicks.push(tick);
      }
    }

    expect(warningTicks).toEqual([259, 599]);
  });

  it('keeps Rain of Cinders on cadence without crowding another major ability', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    sim.player.pos = { x: boss.pos.x + 30, y: boss.pos.y, z: boss.pos.z };
    const starts: number[] = [];
    let previous: string | null = boss.castingAbility;

    for (let i = 0; i < 1_400 && starts.length < 2; i++) {
      sim.tick();
      if (boss.castingAbility === IGNIVAR_SKYFIRE_CAST_ID && previous !== boss.castingAbility) {
        starts.push(sim.time);
      }
      previous = boss.castingAbility;
    }

    expect(starts).toHaveLength(2);
    expect(starts[0]).toBeGreaterThanOrEqual(IGNIVAR_FIRST_SKYFIRE_SECONDS);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(IGNIVAR_SKYFIRE_EVERY);
  });

  it('never schedules Shared Pyre after it moves to Varkhul and clears a legacy mark', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTimer = 0;
    boss.ignivar.soakTargetId = sim.player.id;
    boss.ignivar.soakRemaining = 3;
    sim.player.auras.push({
      id: IGNIVAR_SOAK_AURA_ID,
      name: 'Shared Pyre',
      kind: 'vulnerability',
      remaining: 3,
      duration: 6,
      value: 0,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.soakTargetId).toBeNull();
    expect(boss.ignivar.soakRemaining).toBe(0);
    expect(boss.ignivar.soakTimer).toBe(0);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_SOAK_AURA_ID)).toBe(false);
  });
  it('marks every available non-tank and excludes both the active and off tank', () => {
    const { sim, boss } = claimedEncounter();
    const activeTankMeta = sim.players.get(sim.player.id);
    if (!activeTankMeta) throw new Error('Active tank metadata is missing');
    activeTankMeta.talentMods.role = 'tank';
    const offTank = addEncounterPlayer(sim, boss, 'Off Tank', 'paladin');
    const offTankMeta = sim.players.get(offTank.id);
    if (!offTankMeta) throw new Error('Off tank metadata is missing');
    offTankMeta.talentMods.role = 'tank';
    const firstNonTank = addEncounterPlayer(sim, boss, 'Brand Candidate One');
    const secondNonTank = addEncounterPlayer(sim, boss, 'Brand Candidate Two', 'mage');
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(offTank.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(firstNonTank.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    const brand = secondNonTank.auras.find((a) => a.id === IGNIVAR_BRAND_AURA_ID);
    expect(brand).toMatchObject({
      kind: 'dot',
      tickInterval: 2,
      sourceId: boss.id,
      encounterOwned: true,
    });
    if (!brand) throw new Error('Ignivar brand was not applied');
    expect(isDispellableAura(brand, false)).toBe(false);
    const hpBeforeTick = secondNonTank.hp;
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    for (let i = 0; i < 40; i++) sim.tick();
    expect(secondNonTank.hp).toBe(hpBeforeTick - Math.ceil(secondNonTank.maxHp * 0.05));
  });

  it.each([0, 1, 2])(
    'preserves historical Brand RNG slots with %i eligible non-tanks',
    (nonTankCount) => {
      const { sim, boss } = claimedEncounter();
      const activeTankMeta = sim.players.get(sim.player.id);
      if (!activeTankMeta) throw new Error('Active tank metadata is missing');
      activeTankMeta.talentMods.role = 'tank';
      const eligible = Array.from({ length: nonTankCount }, (_, index) =>
        addEncounterPlayer(sim, boss, `Brand RNG Candidate ${index}`, 'mage'),
      );
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.brandTimer = 0;
      boss.ignivar.frontalTimer = 999;
      boss.ignivar.skyfireTimer = 999;
      boss.ignivar.rotatingRaysTimer = 999;
      boss.ignivar.forgeWaveTimer = 999;
      boss.ignivar.forgeStrikeTimer = 999;
      boss.ignivar.overlapTimer = 999;
      boss.ignivar.meteorTimer = 999;
      boss.swingTimer = 999;
      let draws = 0;
      sim.rng.setObserver(() => draws++);

      updateIgnivarEncounter(sim.ctx, boss);
      sim.rng.setObserver(null);

      expect(draws).toBe(Math.min(IGNIVAR_BRAND_TARGETS_NORMAL, 1 + nonTankCount));
      expect(
        eligible.filter((player) => player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)),
      ).toHaveLength(nonTankCount);
    },
  );

  it('ramps each uncleansed Brand tick from one to three stacks without exceeding the cap', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 0;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    const brand = sim.player.auras.find((aura) => aura.id === IGNIVAR_BRAND_AURA_ID);
    if (!brand) throw new Error('Ignivar brand was not applied');
    const base = Math.ceil(sim.player.maxHp * 0.05);
    expect(brand).toMatchObject({ stacks: 1, value: base });

    const startingHp = sim.player.hp;
    for (let i = 0; i < 40; i++) sim.tick();
    expect(sim.player.hp).toBe(startingHp - base);
    expect(brand).toMatchObject({ stacks: 2, value: base * 2 });

    for (let i = 0; i < 40; i++) sim.tick();
    expect(sim.player.hp).toBe(startingHp - base * 3);
    expect(brand).toMatchObject({ stacks: 3, value: base * 3 });

    sim.player.hp = sim.player.maxHp;
    for (let i = 0; i < 40; i++) sim.tick();
    expect(sim.player.hp).toBe(sim.player.maxHp - base * 3);
    expect(brand).toMatchObject({
      stacks: IGNIVAR_BRAND_MAX_STACKS,
      value: base * 3,
    });
  });

  it('does not reset an uncleansed Brand when that player is selected again', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    const brand = sim.player.auras.find((aura) => aura.id === IGNIVAR_BRAND_AURA_ID);
    if (!brand) throw new Error('Ignivar brand was not applied');
    brand.stacks = 3;
    brand.value *= 3;
    brand.tickTimer = 0.75;
    brand.remaining = 1;
    const rampedValue = brand.value;

    boss.ignivar.brandTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.auras.filter((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toHaveLength(1);
    expect(brand).toMatchObject({
      stacks: 3,
      value: rampedValue,
      tickTimer: 0.75,
      remaining: 600,
    });
  });
});
