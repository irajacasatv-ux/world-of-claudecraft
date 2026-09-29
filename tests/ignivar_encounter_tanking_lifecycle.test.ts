// Ignivar's encounter: Forge Strike tanking and Molten Armor, boss movement,
// conduits and Cleansing Backlash, room cleanup and resets, Last Inferno,
// barks, Apocalypse and wipe cooldowns. Split from tests/ignivar_encounter.test.ts
// on 2026-09-27 for shard balance; the shared encounter setup is
// tests/helpers/ignivar_harness.ts.

import { describe, expect, it } from 'vitest';
import { TALENT_ABILITIES_V2_B } from '../src/sim/content/talent_abilities_v2_b';
import { DUNGEONS, instanceOrigin } from '../src/sim/data';
import {
  IGNIVAR_APOCALYPSE_ADD_ID,
  IGNIVAR_APOCALYPSE_CAST_ID,
  IGNIVAR_APOCALYPSE_CAST_SECONDS,
  IGNIVAR_APOCALYPSE_HP_THRESHOLD,
  IGNIVAR_BRAND_AURA_ID,
  IGNIVAR_BRAND_EVERY_FINAL,
  IGNIVAR_BRAND_EVERY_LATE,
  IGNIVAR_BRAND_TARGETS_NORMAL,
  IGNIVAR_CLEANSING_BACKLASH_DAMAGE_MAX_HP,
  IGNIVAR_CLEANSING_BACKLASH_ID,
  IGNIVAR_CONDUIT_ACTIVE_SECONDS,
  IGNIVAR_DEATH_YELL,
  IGNIVAR_FINAL_FIRST_BRAND_SECONDS,
  IGNIVAR_FORGE_STRIKE_EVERY,
  IGNIVAR_FORGE_STRIKE_MAX_HP,
  IGNIVAR_FRONTAL_CAST_ID,
  IGNIVAR_FRONTAL_CAST_SECONDS,
  IGNIVAR_FRONTAL_EVERY,
  IGNIVAR_FRONTAL_VFX_DISTANCE,
  IGNIVAR_LAST_INFERNO_AURA_ID,
  IGNIVAR_LAST_INFERNO_HP_THRESHOLD,
  IGNIVAR_LAST_INFERNO_SECONDS,
  IGNIVAR_MOLTEN_ARMOR_AURA_ID,
  IGNIVAR_MOLTEN_ARMOR_DURATION,
  IGNIVAR_MOLTEN_ARMOR_PER_STACK,
  IGNIVAR_SOAK_AURA_ID,
  IGNIVAR_SOAK_CAST_SECONDS,
  ignivarFrontalDamageMaxHp,
  resetIgnivarEncounter,
  updateIgnivarEncounter,
} from '../src/sim/encounters/ignivar';
import { IGNIVAR_DIALOGUE } from '../src/sim/encounters/ignivar_dialogue';
import { IGNIVAR_WATER_CONDUIT_TEMPLATES } from '../src/sim/ignivar_arena';
import {
  IGNIVAR_FORGE_CHAINS_AURA_ID,
  IGNIVAR_FORGE_CHAINS_DURATION_SECONDS,
} from '../src/sim/ignivar_forge_chains';
import { enterDungeon, leaveDungeon } from '../src/sim/instances/dungeons';
import { Rng } from '../src/sim/rng';
import { type ResolvedAbility, Sim } from '../src/sim/sim';
import { revivePlayerAt } from '../src/sim/spirit';
import { DT, dist2d, IGNIVAR_BOSS_ID, type SimEvent } from '../src/sim/types';
import { VARKHUL_FORGE_PORTAL_ABILITY_ID } from '../src/sim/varkhul_forge_intermission';
import {
  addEncounterPlayer,
  applyIgnivarBrand,
  claimedEncounter,
  claimedHeroicEncounter,
  isolateForgeChains,
  prepareConduitCleanse,
} from './helpers/ignivar_harness';

describe('Ignivar encounter', () => {
  it('makes Forge Strike force a tank swap at two Molten Armor stacks', () => {
    const { sim, boss } = claimedEncounter();
    const secondTankPid = sim.addPlayer('paladin', 'Second Tank');
    sim.setPlayerLevel(20);
    sim.setPlayerLevel(20, secondTankPid);
    const secondTank = sim.entities.get(sim.players.get(secondTankPid)?.entityId ?? -1);
    if (!secondTank) throw new Error('Second tank did not spawn');
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    secondTank.pos = { ...sim.player.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    boss.ignivar.forgeStrikeTimer = 0;
    sim.player.hp = sim.player.maxHp;
    secondTank.hp = secondTank.maxHp;
    const firstTankHp = sim.player.hp;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.hp).toBe(
      firstTankHp - Math.ceil(sim.player.maxHp * IGNIVAR_FORGE_STRIKE_MAX_HP),
    );
    expect(sim.player.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toMatchObject(
      {
        kind: 'vuln_source',
        stacks: 1,
        value: IGNIVAR_MOLTEN_ARMOR_PER_STACK,
        remaining: IGNIVAR_MOLTEN_ARMOR_DURATION,
        encounterOwned: true,
      },
    );
    expect(boss.ignivar.forgeStrikeTimer).toBe(IGNIVAR_FORGE_STRIKE_EVERY);

    boss.ignivar.forgeStrikeTimer = 0;
    const hpBeforeSecond = sim.player.hp;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.hp).toBe(
      hpBeforeSecond -
        Math.round(
          Math.ceil(sim.player.maxHp * IGNIVAR_FORGE_STRIKE_MAX_HP) *
            (1 + IGNIVAR_MOLTEN_ARMOR_PER_STACK),
        ),
    );
    expect(sim.player.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)?.stacks).toBe(
      2,
    );

    boss.forcedTargetId = secondTank.id;
    boss.forcedTargetTimer = 3;
    boss.ignivar.forgeStrikeTimer = 0;
    const secondTankHp = secondTank.hp;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(secondTank.hp).toBe(
      secondTankHp - Math.ceil(secondTank.maxHp * IGNIVAR_FORGE_STRIKE_MAX_HP),
    );
    expect(secondTank.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)?.stacks).toBe(
      1,
    );
  });

  it('clears the first tank before a complete two-strike rotation returns to them', () => {
    const { sim, boss } = claimedEncounter();
    const secondTankPid = sim.addPlayer('paladin', 'Rotation Tank');
    const secondTank = sim.entities.get(secondTankPid);
    if (!secondTank) throw new Error('Rotation tank did not spawn');
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    sim.player.prevPos = { ...sim.player.pos };
    secondTank.pos = { ...sim.player.pos };
    secondTank.prevPos = { ...secondTank.pos };
    sim.player.devGod = true;
    secondTank.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.meteorTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    boss.forcedTargetId = sim.player.id;
    boss.forcedTargetTimer = 60;

    boss.ignivar.forgeStrikeTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.forgeStrikeTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toMatchObject(
      { stacks: 2, remaining: 26, duration: 26 },
    );

    boss.forcedTargetId = secondTank.id;
    boss.forcedTargetTimer = 60;
    boss.ignivar.forgeStrikeTimer = IGNIVAR_FORGE_STRIKE_EVERY;
    for (let tick = 0; tick < (IGNIVAR_FORGE_STRIKE_EVERY * 2) / DT; tick++) sim.tick();

    expect(secondTank.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)?.stacks).toBe(
      2,
    );
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(false);
  });

  it('makes two real Forge Strike stacks amplify Ignivar melee swings by seventy percent', () => {
    const normal = claimedEncounter();
    const molten = claimedEncounter();
    normal.sim.setPlayerLevel(20);
    molten.sim.setPlayerLevel(20);
    normal.sim.player.maxHp = 1_000_000;
    normal.sim.player.hp = normal.sim.player.maxHp;
    molten.sim.player.maxHp = 1_000_000;
    molten.sim.player.hp = molten.sim.player.maxHp;
    molten.sim.player.pos = {
      x: molten.boss.pos.x,
      y: molten.boss.pos.y,
      z: molten.boss.pos.z - 2,
    };
    updateIgnivarEncounter(molten.sim.ctx, molten.boss);
    if (!molten.boss.ignivar) throw new Error('Ignivar state was not initialized');
    molten.boss.ignivar.brandTimer = 999;
    molten.boss.ignivar.frontalTimer = 999;
    molten.boss.ignivar.overlapTimer = 999;
    molten.boss.swingTimer = 999;
    molten.boss.ignivar.forgeStrikeTimer = 0;
    updateIgnivarEncounter(molten.sim.ctx, molten.boss);
    molten.boss.ignivar.forgeStrikeTimer = 0;
    updateIgnivarEncounter(molten.sim.ctx, molten.boss);
    expect(
      molten.sim.player.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID),
    ).toMatchObject({ stacks: 2, value: 0.7 });
    molten.sim.player.hp = molten.sim.player.maxHp;
    normal.sim.rng = new Rng(1907);
    molten.sim.rng = new Rng(1907);

    const normalHp = normal.sim.player.hp;
    const moltenHp = molten.sim.player.hp;
    for (let attempt = 0; attempt < 20 && normal.sim.player.hp === normalHp; attempt++) {
      normal.sim.ctx.mobSwing(normal.boss, normal.sim.player);
      molten.sim.ctx.mobSwing(molten.boss, molten.sim.player);
    }
    const normalDamage = normalHp - normal.sim.player.hp;
    const moltenDamage = moltenHp - molten.sim.player.hp;

    expect(normalDamage).toBeGreaterThan(0);
    expect(moltenDamage / normalDamage).toBeCloseTo(1.7, 1);
  });

  it('limits Molten Armor amplification to damage dealt by Ignivar', () => {
    const moltenEncounter = (seed: number) => {
      const encounter = claimedEncounter(seed);
      const { sim, boss } = encounter;
      sim.player.maxHp = 1_000_000;
      sim.player.hp = sim.player.maxHp;
      sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.brandTimer = 999;
      boss.ignivar.frontalTimer = 999;
      boss.ignivar.overlapTimer = 999;
      boss.swingTimer = 999;
      boss.ignivar.forgeStrikeTimer = 0;
      updateIgnivarEncounter(sim.ctx, boss);
      boss.ignivar.forgeStrikeTimer = 0;
      updateIgnivarEncounter(sim.ctx, boss);
      expect(
        sim.player.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID),
      ).toMatchObject({ kind: 'vuln_source', sourceId: boss.id, stacks: 2, value: 0.7 });
      sim.player.hp = sim.player.maxHp;
      return encounter;
    };

    const ignivar = moltenEncounter(42);
    expect(
      ignivar.sim.ctx.dealDamage(
        ignivar.boss,
        ignivar.sim.player,
        100,
        false,
        'fire',
        'Ignivar Flame',
        'hit',
        true,
      ),
    ).toBe(170);

    const foreign = moltenEncounter(42);
    expect(
      foreign.sim.ctx.dealDamage(
        foreign.conduit,
        foreign.sim.player,
        100,
        false,
        'fire',
        'Foreign Flame',
        'hit',
        true,
      ),
    ).toBe(100);
  });

  it('holds a due Forge Strike out of melee, then repeats exactly fourteen seconds after landing', () => {
    const { sim, boss } = claimedEncounter();
    sim.setPlayerLevel(20);
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.swingTimer = 999;
    boss.ignivar.forgeStrikeTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(false);
    expect(boss.ignivar.forgeStrikeTimer).toBeLessThanOrEqual(0);

    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    updateIgnivarEncounter(sim.ctx, boss);
    const armor = sim.player.auras.find((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID);
    expect(armor?.stacks).toBe(1);
    for (let i = 0; i < 279; i++) updateIgnivarEncounter(sim.ctx, boss);
    expect(armor?.stacks).toBe(1);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(armor?.stacks).toBe(2);
  });

  it('retargets a living tank before a melee swing when Forge Strike kills its target', () => {
    const { sim, boss } = claimedEncounter();
    const secondTankPid = sim.addPlayer('paladin', 'Second Tank');
    sim.setPlayerLevel(20);
    sim.setPlayerLevel(20, secondTankPid);
    const secondTank = sim.entities.get(sim.players.get(secondTankPid)?.entityId ?? -1);
    if (!secondTank) throw new Error('Second tank did not spawn');
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    secondTank.pos = { ...sim.player.pos };
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.forgeStrikeTimer = 0;
    boss.forcedTargetId = sim.player.id;
    boss.forcedTargetTimer = 3;
    boss.swingTimer = 0;
    sim.player.hp = 1;
    const secondTankHp = secondTank.hp;
    let draws = 0;
    sim.rng.setObserver(() => draws++);

    updateIgnivarEncounter(sim.ctx, boss);
    sim.rng.setObserver(null);

    expect(sim.player.dead).toBe(true);
    expect(boss.aggroTargetId).toBe(secondTank.id);
    expect(secondTank.hp).toBeLessThan(secondTankHp);
    expect(boss.swingTimer).toBeGreaterThan(0);
    expect(draws).toBeGreaterThan(0);
  });

  it('retargets a living tank before starting a frontal when Forge Strike kills its target', () => {
    const { sim, boss } = claimedEncounter();
    const secondTankPid = sim.addPlayer('paladin', 'Second Tank');
    sim.setPlayerLevel(20);
    sim.setPlayerLevel(20, secondTankPid);
    const secondTank = sim.entities.get(sim.players.get(secondTankPid)?.entityId ?? -1);
    if (!secondTank) throw new Error('Second tank did not spawn');
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    secondTank.pos = { ...sim.player.pos };
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 0;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.forgeStrikeTimer = 0;
    boss.forcedTargetId = sim.player.id;
    boss.forcedTargetTimer = 3;
    sim.player.hp = 1;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.dead).toBe(true);
    expect(boss.aggroTargetId).toBe(secondTank.id);
    expect(boss.castingAbility).toBe(IGNIVAR_FRONTAL_CAST_ID);
    expect(boss.castTargetId).toBe(secondTank.id);
    expect(boss.castAim).toEqual(secondTank.pos);
  });

  it('retargets a living ally before starting a frontal when Brand overlap kills its target', () => {
    const { sim, boss } = claimedEncounter();
    const allyPid = sim.addPlayer('paladin', 'Surviving Tank');
    const ally = sim.entities.get(sim.players.get(allyPid)?.entityId ?? -1);
    if (!ally) throw new Error('Surviving tank did not spawn');
    sim.setPlayerLevel(20);
    sim.setPlayerLevel(20, allyPid);
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    ally.pos = { ...sim.player.pos };
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 0;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.overlapTimer = 0;
    boss.forcedTargetId = sim.player.id;
    boss.forcedTargetTimer = 3;
    sim.player.hp = 1;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.dead).toBe(true);
    expect(ally.dead).toBe(false);
    expect(boss.aggroTargetId).toBe(ally.id);
    expect(boss.castingAbility).toBe(IGNIVAR_FRONTAL_CAST_ID);
    expect(boss.castTargetId).toBe(ally.id);
    expect(boss.castAim).toEqual(ally.pos);
  });

  it('stops the mechanic tick without RNG or casts when Brand overlap leaves no living target', () => {
    const { sim, boss } = claimedEncounter();
    const allyPid = sim.addPlayer('priest', 'Last Ally');
    const ally = sim.entities.get(sim.players.get(allyPid)?.entityId ?? -1);
    if (!ally) throw new Error('Last ally did not spawn');
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    ally.pos = { ...sim.player.pos };
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 0;
    boss.ignivar.forgeStrikeTimer = 0;
    boss.ignivar.overlapTimer = 0;
    boss.swingTimer = 0;
    sim.player.hp = 1;
    ally.hp = 1;
    let draws = 0;
    sim.rng.setObserver(() => draws++);

    updateIgnivarEncounter(sim.ctx, boss);
    sim.rng.setObserver(null);

    expect(sim.player.dead).toBe(true);
    expect(ally.dead).toBe(true);
    expect(boss.castingAbility).toBeNull();
    expect(boss.swingTimer).toBe(0);
    expect(draws).toBe(0);
  });

  it('keeps Molten Armor and Shared Pyre out of water and removes both on reset', () => {
    const { sim, boss, conduit } = claimedEncounter();
    sim.setPlayerLevel(20);
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.forgeStrikeTimer = 0;
    boss.swingTimer = 999;
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 5;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(true);
    sim.player.auras.push({
      id: IGNIVAR_SOAK_AURA_ID,
      name: 'Shared Pyre',
      kind: 'vulnerability',
      remaining: IGNIVAR_SOAK_CAST_SECONDS,
      duration: IGNIVAR_SOAK_CAST_SECONDS,
      value: 0,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    sim.player.pos = { ...conduit.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(true);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_SOAK_AURA_ID)).toBe(true);

    resetIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(false);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_SOAK_AURA_ID)).toBe(false);
  });

  it('survives a real friendly dispel effect and still requires encounter water', () => {
    const sim = new Sim({
      seed: 42,
      playerClass: 'warlock',
      autoEquip: true,
      devCommands: true,
    });
    sim.setPlayerLevel(20);
    expect(enterDungeon(sim.ctx, 'ignivar_raid_arena', sim.player.id, true)).toBe(true);
    const boss = [...sim.entities.values()].find((e) => e.templateId === IGNIVAR_BOSS_ID);
    if (!boss) throw new Error('Ignivar did not spawn');
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    const meta = sim.meta(sim.player.id);
    if (!meta) throw new Error('missing player metadata');
    const def = TALENT_ABILITIES_V2_B.voidfeast;
    const resolved: ResolvedAbility = {
      def,
      rank: 1,
      cost: def.cost,
      castTime: def.castTime,
      cooldown: def.cooldown,
      effects: def.effects,
      threatFlat: 0,
      threatMult: 1,
    };
    sim.ctx.runEffects(sim.player, meta, sim.player, resolved);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
  });

  it('runs the encounter through the production mob tick dispatcher', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;

    for (let i = 0; i < 45; i++) sim.tick();
    expect(sim.player.auras.some((a) => a.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);

    for (let i = 0; i < 120; i++) sim.tick();
    expect(boss.castingAbility).toBe(IGNIVAR_FRONTAL_CAST_ID);
    expect(boss.ignivar?.frontalCastRemaining).toBeGreaterThan(0);
  });

  it('holds the boss at the arena center without wandering before combat', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', devCommands: true });
    expect(enterDungeon(sim.ctx, 'ignivar_raid_arena', sim.player.id, true)).toBe(true);
    const boss = [...sim.entities.values()].find((entity) => entity.templateId === IGNIVAR_BOSS_ID);
    if (!boss) throw new Error('Ignivar did not spawn');
    expect(boss.inCombat).toBe(false);
    expect(boss.aiState).toBe('idle');
    boss.wanderTimer = 0;
    boss.wanderTarget = null;
    const center = { ...boss.spawnPos };

    sim.tick();

    expect(boss.inCombat).toBe(false);
    expect(boss.pos).toEqual(center);
    expect(boss.prevPos).toEqual(center);
    expect(boss.wanderTarget).toBeNull();
  });

  it('re-seats on the highest-threat raider, not the lowest entity id, when the tank leaves the claim', () => {
    const { sim, boss } = claimedEncounter();
    // The Wolf Form druid spawns first (lowest entity id after the tank) and
    // sits low on the hate table; the rogue joined later and has far more.
    const druid = addEncounterPlayer(sim, boss, 'Wolf Druid', 'druid');
    const rogue = addEncounterPlayer(sim, boss, 'Rogue', 'rogue');
    expect(druid.id).toBeLessThan(rogue.id);
    boss.threat.set(sim.player.id, 9000);
    boss.threat.set(druid.id, 120);
    boss.threat.set(rogue.id, 4500);
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.aggroTargetId).toBe(sim.player.id);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.overlapTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;

    // A knockback carried the tank outside the arena claim: the encounter can
    // no longer use it as the living target.
    sim.player.pos = { x: boss.pos.x + 100000, y: boss.pos.y, z: boss.pos.z + 100000 };
    sim.player.prevPos = { ...sim.player.pos };
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.aggroTargetId).toBe(rogue.id);
  });

  it('chases the tank between mechanics when the tank moves out of melee', () => {
    const { sim, boss } = claimedEncounter();
    const destination = {
      x: boss.pos.x + 18,
      y: boss.pos.y,
      z: boss.pos.z,
    };
    sim.player.pos = destination;
    sim.player.prevPos = { ...destination };
    const distanceBefore = dist2d(boss.pos, sim.player.pos);
    const positionBefore = { ...boss.pos };

    sim.tick();

    expect(boss.moveSpeed).toBeGreaterThan(0);
    expect(boss.aiState).toBe('chase');
    expect(boss.pos).not.toEqual(positionBefore);
    expect(dist2d(boss.pos, sim.player.pos)).toBeLessThan(distanceBefore);
  });

  it('does not drift when the tank is already in melee and follows a forced tank over a bystander', () => {
    const melee = claimedEncounter();
    melee.sim.player.pos = {
      x: melee.boss.pos.x + 2,
      y: melee.boss.pos.y,
      z: melee.boss.pos.z,
    };
    melee.sim.player.prevPos = { ...melee.sim.player.pos };
    const meleeOrigin = { ...melee.boss.pos };

    melee.sim.tick();

    expect(melee.boss.pos).toEqual(meleeOrigin);
    expect(melee.boss.aiState).toBe('attack');
    expect(melee.boss.facing).toBeCloseTo(Math.PI / 2, 8);

    const forced = claimedEncounter();
    const forcedTank = addEncounterPlayer(forced.sim, forced.boss, 'Forced Tank', 'paladin');
    forced.sim.player.pos = {
      x: forced.boss.pos.x + 2,
      y: forced.boss.pos.y,
      z: forced.boss.pos.z,
    };
    forcedTank.pos = {
      x: forced.boss.pos.x + 18,
      y: forced.boss.pos.y,
      z: forced.boss.pos.z,
    };
    forcedTank.prevPos = { ...forcedTank.pos };
    forced.boss.forcedTargetId = forcedTank.id;
    forced.boss.forcedTargetTimer = 10;
    const forcedDistanceBefore = dist2d(forced.boss.pos, forcedTank.pos);

    forced.sim.tick();

    expect(forced.boss.aggroTargetId).toBe(forcedTank.id);
    expect(dist2d(forced.boss.pos, forcedTank.pos)).toBeLessThan(forcedDistanceBefore);
  });

  it('keeps the boss stationary through major casts and recenters it for Judgment', () => {
    const mechanics = ['frontal', 'skyfire', 'rotating rays', 'forge wave', 'judgment'];
    for (let mechanicIndex = 0; mechanicIndex < mechanics.length; mechanicIndex++) {
      const mechanic = mechanics[mechanicIndex];
      const { sim, boss } = claimedEncounter();
      sim.player.devGod = true;
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      const st = boss.ignivar;
      st.apocalypseTriggered = true;
      st.apocalypseResolved = true;
      st.apocalypseAddId = null;
      st.brandTimer = 999;
      st.forgeStrikeTimer = 999;
      st.frontalTimer = 999;
      st.skyfireTimer = 999;
      st.meteorTimer = 999;
      st.rotatingRaysTimer = 999;
      st.forgeWaveTimer = 999;
      st.soakTimer = 999;
      st.overlapTimer = 999;
      boss.swingTimer = 999;
      sim.player.pos = {
        x: boss.pos.x + 18,
        y: boss.pos.y,
        z: boss.pos.z,
      };
      sim.player.prevPos = { ...sim.player.pos };

      if (mechanic === 'frontal') st.frontalTimer = 0;
      else if (mechanic === 'skyfire') st.skyfireTimer = 0;
      else if (mechanic === 'rotating rays') st.rotatingRaysTimer = 0;
      else if (mechanic === 'forge wave') st.forgeWaveTimer = 0;
      else boss.hp = Math.floor(boss.maxHp * 0.45);

      const origin = { ...boss.pos };
      sim.tick();
      if (mechanic === 'judgment') {
        const arenaPoint = instanceOrigin(DUNGEONS.ignivar_raid_arena.index, 0);
        const arenaOrigin = { ...arenaPoint, y: boss.pos.y };
        expect(dist2d(boss.pos, arenaOrigin), `${mechanic} recenter`).toBeLessThan(
          dist2d(origin, arenaOrigin),
        );
      } else {
        expect(boss.pos, `${mechanic} start`).toEqual(origin);
      }
      if (mechanic === 'rotating rays') {
        st.rotatingRaysWindupRemaining = 0;
        st.rotatingRaysActiveRemaining = 1;
        st.rotatingRaysPulseTimer = 1;
      } else if (mechanic === 'forge wave') {
        st.forgeWaveWindupRemaining = 0;
        st.forgeWaveActiveRemaining = 1;
      } else if (mechanic === 'judgment') {
        st.forgeJudgmentPhase = 'active';
        st.forgeJudgmentRemaining = 1;
        st.forgeJudgmentPulseTimer = 1;
      }
      const activeOrigin = { ...boss.pos };
      sim.tick();
      expect(boss.pos, `${mechanic} active`).toEqual(activeOrigin);
    }
  });

  it('locks a visible frontal, activates the aimed conduit, and cleanses its water zone', () => {
    const { sim, boss, conduit } = claimedEncounter();
    const bystanderPid = sim.addPlayer('mage', 'Bystander');
    const bystanderMeta = sim.players.get(bystanderPid);
    const bystander = bystanderMeta ? sim.entities.get(bystanderMeta.entityId) : undefined;
    if (!bystander) throw new Error('Raid bystander did not spawn');
    const origin = instanceOrigin(DUNGEONS.ignivar_raid_arena.index, 0);
    // Aim along the north-west conduit line while starting outside its 3.25u
    // cleansing pool. The conduits now sit on the placed water pumps (just
    // inside +/-18), so start a little further in than the pump center: the
    // frontal still brands the player before the explicit step into the
    // activated water below.
    sim.player.pos.x = origin.x - 13;
    sim.player.pos.z = origin.z + 13;
    bystander.pos = { x: origin.x + 18, y: 0, z: origin.z - 18 };
    boss.facing = Math.atan2(sim.player.pos.x - boss.pos.x, sim.player.pos.z - boss.pos.z);
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      tickInterval: 2,
      tickTimer: 2,
      sourceId: boss.id,
      school: 'fire',
      finalDamage: true,
    });
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.frontalTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.castingAbility).toBe(IGNIVAR_FRONTAL_CAST_ID);
    expect(boss.castTotal).toBe(IGNIVAR_FRONTAL_CAST_SECONDS);
    const hpBeforeFrontal = sim.player.hp;
    const bystanderHp = bystander.hp;
    boss.ignivar.frontalCastRemaining = 0.01;
    const events = sim.tick();

    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.active);
    expect(
      events.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.conduitActivated,
      ),
    ).toBe(true);
    expect(sim.player.hp).toBe(
      hpBeforeFrontal - Math.ceil(sim.player.maxHp * ignivarFrontalDamageMaxHp('normal')),
    );
    expect(bystander.hp).toBe(bystanderHp);
    expect(IGNIVAR_FRONTAL_VFX_DISTANCE).toBe(30);
    const blasts = events.filter(
      (event): event is Extract<SimEvent, { type: 'spellfxAt' }> =>
        event.type === 'spellfxAt' &&
        event.ability === IGNIVAR_FRONTAL_CAST_ID &&
        event.fx === 'burst',
    );
    expect(blasts).toHaveLength(1);
    const blast = blasts[0];
    expect(blast).toBeDefined();
    if (!blast) throw new Error('Searing Torrent did not emit its frontal VFX');
    expect(blast.sourceId).toBe(boss.id);
    expect(blast.school).toBe('fire');
    expect(blast.radius).toBeUndefined();
    const blastDx = blast.x - boss.pos.x;
    const blastDz = blast.z - boss.pos.z;
    expect(Math.hypot(blastDx, blastDz)).toBeCloseTo(IGNIVAR_FRONTAL_VFX_DISTANCE, 8);
    expect(
      (blastDx * Math.sin(boss.ignivar.frontalFacing) +
        blastDz * Math.cos(boss.ignivar.frontalFacing)) /
        IGNIVAR_FRONTAL_VFX_DISTANCE,
    ).toBeCloseTo(1, 8);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((a) => a.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    sim.player.auras.push({
      id: 'control_debuff',
      name: 'Control Debuff',
      kind: 'slow',
      remaining: 5,
      duration: 5,
      value: 0.5,
      sourceId: boss.id,
      school: 'physical',
    });
    sim.player.pos.x = conduit.pos.x;
    sim.player.pos.z = conduit.pos.z;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((a) => a.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(sim.player.auras.some((a) => a.id === 'control_debuff')).toBe(true);
  });

  it('tracks a moving tank until release so the tank can redirect the frontal', () => {
    const { sim, boss } = claimedEncounter();
    const origin = instanceOrigin(DUNGEONS.ignivar_raid_arena.index, 0);
    const conduits = [...sim.entities.values()].filter((entity) =>
      Object.values(IGNIVAR_WATER_CONDUIT_TEMPLATES).includes(
        entity.templateId as (typeof IGNIVAR_WATER_CONDUIT_TEMPLATES)[keyof typeof IGNIVAR_WATER_CONDUIT_TEMPLATES],
      ),
    );
    const northWest = conduits.find(
      (conduit) => conduit.pos.x < origin.x && conduit.pos.z > origin.z,
    );
    const northEast = conduits.find(
      (conduit) => conduit.pos.x > origin.x && conduit.pos.z > origin.z,
    );
    const southEast = conduits.find(
      (conduit) => conduit.pos.x > origin.x && conduit.pos.z < origin.z,
    );
    if (!northWest || !northEast || !southEast) {
      throw new Error('Redirect conduits did not spawn');
    }
    sim.player.pos = { ...northWest.pos };
    sim.player.prevPos = { ...sim.player.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.frontalTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);
    const initialFacing = boss.ignivar.frontalFacing;
    sim.player.pos = { ...northEast.pos };
    sim.player.prevPos = { ...sim.player.pos };
    updateIgnivarEncounter(sim.ctx, boss);

    const redirectedFacing = Math.atan2(
      sim.player.pos.x - boss.pos.x,
      sim.player.pos.z - boss.pos.z,
    );
    expect(boss.ignivar.frontalFacing).not.toBeCloseTo(initialFacing, 5);
    expect(boss.ignivar.frontalFacing).toBeCloseTo(redirectedFacing, 8);
    expect(boss.facing).toBeCloseTo(redirectedFacing, 8);
    expect(boss.castAim).toEqual(sim.player.pos);

    sim.player.pos = { ...southEast.pos };
    sim.player.prevPos = { ...sim.player.pos };
    boss.ignivar.frontalCastRemaining = DT;
    updateIgnivarEncounter(sim.ctx, boss);

    const releaseFacing = Math.atan2(sim.player.pos.x - boss.pos.x, sim.player.pos.z - boss.pos.z);
    expect(boss.facing).toBeCloseTo(releaseFacing, 8);
    expect(northWest.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.ready);
    expect(northEast.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.ready);
    expect(southEast.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.active);
  });

  it('does not reactivate a spent conduit hit by another frontal', () => {
    const { sim, boss, conduit } = claimedEncounter();
    sim.player.pos = { ...conduit.pos };
    sim.player.prevPos = { ...sim.player.pos };
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.frontalTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.frontalCastRemaining = DT;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.active);

    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown;
    boss.ignivar.conduitTimers.north_west = 20;
    boss.ignivar.frontalTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.frontalCastRemaining = DT;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown);
    expect(boss.ignivar.conduitTimers.north_west).toBeUndefined();
  });

  it('only cleanses inside an active conduit, never ready or cooldown water', () => {
    const { sim, boss, conduit } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.swingTimer = 999;
    sim.player.pos = { ...conduit.pos };
    const applyBrand = () => {
      sim.player.auras = sim.player.auras.filter((aura) => aura.id !== IGNIVAR_BRAND_AURA_ID);
      sim.player.auras.push({
        id: IGNIVAR_BRAND_AURA_ID,
        name: 'Brand of the Pyre',
        kind: 'dot',
        remaining: 600,
        duration: 600,
        value: 1,
        sourceId: boss.id,
        school: 'fire',
        encounterOwned: true,
      });
    };

    applyBrand();
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown;
    boss.ignivar.conduitTimers.north_west = 20;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 5;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
  });

  it('keeps Normal Cleansing Backlash damage-free', () => {
    const { sim, boss, conduit } = claimedEncounter();
    const cleanser = addEncounterPlayer(sim, boss, 'Normal Cleanser');
    prepareConduitCleanse(sim, boss, conduit);
    cleanser.pos = { ...conduit.pos };
    applyIgnivarBrand(cleanser, boss);
    const playerHp = sim.player.hp;
    const cleanserHp = cleanser.hp;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(cleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(cleanser.hp).toBe(cleanserHp);
    expect(sim.player.hp).toBe(playerHp);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
  });

  it('damages every living raid member once for one Heroic Cleansing Backlash', () => {
    const { sim, boss, conduit } = claimedHeroicEncounter();
    const cleanser = addEncounterPlayer(sim, boss, 'Heroic Cleanser');
    expect(IGNIVAR_CLEANSING_BACKLASH_DAMAGE_MAX_HP).toBe(0.18);
    expect(IGNIVAR_CLEANSING_BACKLASH_ID).toBe('Cleansing Backlash');
    prepareConduitCleanse(sim, boss, conduit);
    cleanser.pos = { ...conduit.pos };
    for (const player of [sim.player, cleanser]) {
      player.maxHp = 1_000;
      player.hp = player.maxHp;
    }
    applyIgnivarBrand(cleanser, boss);

    const events = sim.tick();

    const expectedDamage = 1_000 * IGNIVAR_CLEANSING_BACKLASH_DAMAGE_MAX_HP;
    expect(cleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(cleanser.hp).toBe(1_000 - expectedDamage);
    expect(sim.player.hp).toBe(1_000 - expectedDamage);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(
      events.filter(
        (event) => event.type === 'damage' && event.ability === IGNIVAR_CLEANSING_BACKLASH_ID,
      ),
    ).toHaveLength(2);
  });

  it('stacks simultaneous Heroic Cleansing Backlashes independently', () => {
    const { sim, boss, conduit } = claimedHeroicEncounter();
    const firstCleanser = addEncounterPlayer(sim, boss, 'First Heroic Cleanser');
    const secondCleanser = addEncounterPlayer(sim, boss, 'Second Heroic Cleanser');
    prepareConduitCleanse(sim, boss, conduit);
    firstCleanser.pos = { ...conduit.pos };
    secondCleanser.pos = { ...conduit.pos };
    const players = [sim.player, firstCleanser, secondCleanser];
    for (const player of players) {
      player.maxHp = 1_000;
      player.hp = player.maxHp;
    }
    applyIgnivarBrand(firstCleanser, boss);
    applyIgnivarBrand(secondCleanser, boss);

    const events = sim.tick();

    const expectedDamage = 2 * 1_000 * IGNIVAR_CLEANSING_BACKLASH_DAMAGE_MAX_HP;
    for (const player of players) expect(player.hp).toBe(1_000 - expectedDamage);
    expect(firstCleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(secondCleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(
      events.filter(
        (event) => event.type === 'damage' && event.ability === IGNIVAR_CLEANSING_BACKLASH_ID,
      ),
    ).toHaveLength(6);
  });

  it('keeps active conduits ticking and cleansing during Heroic Forge Chains', () => {
    const { sim, boss, conduit } = claimedHeroicEncounter();
    const cleanser = addEncounterPlayer(sim, boss, 'Chained Cleanser');
    const partner = addEncounterPlayer(sim, boss, 'Chained Partner');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar?.forgeChainsPlayerIds) throw new Error('Forge Chains did not activate');

    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 5;
    cleanser.pos = { ...conduit.pos };
    cleanser.prevPos = { ...cleanser.pos };
    const players = [sim.player, cleanser, partner];
    for (const player of players) {
      player.maxHp = 1_000;
      player.hp = player.maxHp;
    }
    applyIgnivarBrand(cleanser, boss);

    const events = sim.tick();

    expect(boss.ignivar.conduitTimers.north_west).toBeCloseTo(5 - DT);
    expect(cleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    for (const player of players) {
      expect(player.hp).toBe(1_000 - Math.ceil(1_000 * IGNIVAR_CLEANSING_BACKLASH_DAMAGE_MAX_HP));
    }
    expect(
      events.filter(
        (event) => event.type === 'damage' && event.ability === IGNIVAR_CLEANSING_BACKLASH_ID,
      ),
    ).toHaveLength(players.length);
  });

  it('freezes active conduits and cleansing throughout Forge Judgment', () => {
    const { sim, boss, conduit } = claimedHeroicEncounter();
    const cleanser = addEncounterPlayer(sim, boss, 'Judgment Cleanser');
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.forgeJudgmentPhase = 'active';
    boss.ignivar.forgeJudgmentRemaining = 1;
    boss.ignivar.forgeJudgmentPulseTimer = 1;
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 5;
    cleanser.pos = { ...conduit.pos };
    cleanser.prevPos = { ...cleanser.pos };
    applyIgnivarBrand(cleanser, boss);

    const events = sim.tick();

    expect(boss.ignivar.conduitTimers.north_west).toBe(5);
    expect(cleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    expect(
      events.some(
        (event) => event.type === 'damage' && event.ability === IGNIVAR_CLEANSING_BACKLASH_ID,
      ),
    ).toBe(false);
  });

  it('ticks and resolves a conduit before the final Last Inferno wipe', () => {
    const { sim, boss, conduit } = claimedHeroicEncounter();
    const cleanser = addEncounterPlayer(sim, boss, 'Last Inferno Cleanser');
    sim.player.devGod = true;
    cleanser.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.lastInfernoTriggered = true;
    boss.ignivar.lastInfernoResolved = false;
    boss.ignivar.lastInfernoRemaining = DT;
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 5;
    cleanser.pos = { ...conduit.pos };
    cleanser.prevPos = { ...cleanser.pos };
    applyIgnivarBrand(cleanser, boss);

    const events = sim.tick();
    const damageAbilities = events
      .filter((event) => event.type === 'damage')
      .map((event) => event.ability);

    expect(boss.ignivar.conduitTimers.north_west).toBeCloseTo(5 - DT);
    expect(cleanser.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(damageAbilities).toContain(IGNIVAR_CLEANSING_BACKLASH_ID);
    expect(damageAbilities.indexOf(IGNIVAR_CLEANSING_BACKLASH_ID)).toBeLessThan(
      damageAbilities.indexOf('Last Inferno'),
    );
    expect(boss.ignivar.lastInfernoResolved).toBe(true);
  });

  it('excludes dead raid members from Heroic Cleansing Backlash', () => {
    const { sim, boss, conduit } = claimedHeroicEncounter();
    const cleanser = addEncounterPlayer(sim, boss, 'Living Heroic Cleanser');
    const deadPlayer = addEncounterPlayer(sim, boss, 'Dead Heroic Raider');
    prepareConduitCleanse(sim, boss, conduit);
    cleanser.pos = { ...conduit.pos };
    deadPlayer.pos = { ...conduit.pos };
    for (const player of [sim.player, cleanser]) {
      player.maxHp = 1_000;
      player.hp = player.maxHp;
    }
    deadPlayer.dead = true;
    deadPlayer.hp = 0;
    applyIgnivarBrand(cleanser, boss);
    applyIgnivarBrand(deadPlayer, boss);

    const events = sim.tick();

    const expectedDamage = 1_000 * IGNIVAR_CLEANSING_BACKLASH_DAMAGE_MAX_HP;
    expect(sim.player.hp).toBe(1_000 - expectedDamage);
    expect(cleanser.hp).toBe(1_000 - expectedDamage);
    expect(deadPlayer.hp).toBe(0);
    expect(deadPlayer.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === 'damage' &&
          event.ability === IGNIVAR_CLEANSING_BACKLASH_ID &&
          event.targetId === deadPlayer.id,
      ),
    ).toBe(false);
  });

  it('damages an overlapping Heroic ally without propagating Brand', () => {
    const { sim, boss } = claimedHeroicEncounter();
    const allyPid = sim.addPlayer('priest', 'Waterbearer');
    const allyMeta = sim.players.get(allyPid);
    const ally = allyMeta ? sim.entities.get(allyMeta.entityId) : undefined;
    if (!ally) throw new Error('Raid ally did not spawn');
    const origin = instanceOrigin(DUNGEONS.ignivar_raid_arena.index, 0);
    sim.player.pos = { x: origin.x + 15, y: 0, z: origin.z };
    ally.pos = { ...sim.player.pos };
    boss.swingTimer = 999;
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.overlapTimer = 0;
    const carrierHp = sim.player.hp;
    const allyHp = ally.hp;

    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.hp).toBe(carrierHp - Math.ceil(sim.player.maxHp * 0.06));
    expect(ally.hp).toBe(allyHp - Math.ceil(ally.maxHp * 0.06));
    expect(ally.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    ally.pos.x += 10;
    boss.ignivar.overlapTimer = 0;
    const separatedCarrierHp = sim.player.hp;
    const separatedAllyHp = ally.hp;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.hp).toBe(separatedCarrierHp);
    expect(ally.hp).toBe(separatedAllyHp);
  });

  it('cleans brands, conduits, and the encounter state the moment the room empties', () => {
    const { sim, boss, conduit } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 7;
    sim.player.pos = { x: 0, y: 0, z: 0 };

    // Nothing defers the reset any more: the empty room resets the boss in the
    // same call (home, idle, full health) and scrubs its encounter state.
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.aiState).toBe('idle');
    expect(boss.hp).toBe(boss.maxHp);
    expect(boss.ignivar).toBeUndefined();
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.ready);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
  });

  it('removes encounter-owned player auras immediately when leaving the development raid', () => {
    const { sim, boss } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    sim.player.auras.push({
      id: IGNIVAR_MOLTEN_ARMOR_AURA_ID,
      name: 'Molten Armor',
      kind: 'vulnerability',
      remaining: 30,
      duration: 30,
      value: IGNIVAR_MOLTEN_ARMOR_PER_STACK,
      stacks: 2,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });

    // The exit portal is sealed while Ignivar is engaged, so the fight lulls
    // first; the Halls claim gives the arena's floor-chain exit a live room to
    // route to, and stepping back into the arena takes its real portal out.
    boss.inCombat = false;
    expect(enterDungeon(sim.ctx, 'ignivar_forge_approach', sim.player.id, true)).toBe(true);
    expect(enterDungeon(sim.ctx, 'ignivar_raid_arena', sim.player.id, true)).toBe(true);
    expect(leaveDungeon(sim.ctx, sim.player.id)).toBe(true);

    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(false);
  });

  it('cleans brands, casts, and conduit state immediately when Ignivar dies', () => {
    const { sim, boss, conduit } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.enraged).toBe(true);
    boss.ignivar.frontalCastRemaining = 2;
    boss.castingAbility = IGNIVAR_FRONTAL_CAST_ID;
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });

    boss.dead = true;
    const deathEvents = sim.tick();

    expect(boss.ignivar).toBeUndefined();
    expect(boss.enraged).toBe(false);
    expect(boss.auras.some((aura) => aura.id === IGNIVAR_LAST_INFERNO_AURA_ID)).toBe(false);
    expect(boss.castingAbility).toBeNull();
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.ready);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(
      deathEvents.filter(
        (event) =>
          event.type === 'chat' && event.channel === 'yell' && event.text === IGNIVAR_DEATH_YELL,
      ),
    ).toHaveLength(1);
    expect(
      sim
        .tick()
        .filter(
          (event) =>
            event.type === 'chat' && event.channel === 'yell' && event.text === IGNIVAR_DEATH_YELL,
        ),
    ).toHaveLength(0);
  });

  it('despawns Ashcaller and cancels armed meteors when Ignivar dies mid-mechanic', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    const add = [...sim.entities.values()].find(
      (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
    );
    if (!add || !boss.ignivar) throw new Error('Apocalypse did not initialize');
    isolateForgeChains(boss, 999);
    boss.ignivar.meteorTimer = 0;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.activeIgnivarMeteors.length).toBeGreaterThan(0);
    const impact = boss.ignivar.meteorPoints[0];
    if (!impact) throw new Error('Falling Cinders did not choose an impact point');
    boss.ignivar.meteorImpactRemaining = DT;
    sim.player.pos = { x: impact.x, y: boss.pos.y, z: impact.z };
    sim.player.prevPos = { ...sim.player.pos };
    sim.player.devGod = false;
    sim.player.damageImmune = false;
    const hpBeforeDeath = sim.player.hp;

    boss.dead = true;
    sim.tick();

    expect(boss.ignivar).toBeUndefined();
    expect(sim.entities.has(add.id)).toBe(false);
    expect(sim.activeIgnivarMeteors).toEqual([]);
    expect(boss.castingAbility).toBeNull();
    expect(sim.player.hp).toBe(hpBeforeDeath);
    sim.tick();
    expect(sim.player.hp).toBe(hpBeforeDeath);
  });

  it('clears raid mechanics through a real death and corpse resurrection', () => {
    const { sim, boss } = claimedEncounter();
    const ally = addEncounterPlayer(sim, boss, 'Living Witness');
    updateIgnivarEncounter(sim.ctx, boss);
    isolateForgeChains(boss, 999);
    const encounterAuraIds = [
      IGNIVAR_BRAND_AURA_ID,
      IGNIVAR_MOLTEN_ARMOR_AURA_ID,
      IGNIVAR_FORGE_CHAINS_AURA_ID,
    ];
    applyIgnivarBrand(sim.player, boss);
    sim.ctx.applyAura(sim.player, {
      id: IGNIVAR_MOLTEN_ARMOR_AURA_ID,
      name: 'Molten Armor',
      kind: 'vuln_source',
      remaining: IGNIVAR_MOLTEN_ARMOR_DURATION,
      duration: IGNIVAR_MOLTEN_ARMOR_DURATION,
      value: IGNIVAR_MOLTEN_ARMOR_PER_STACK,
      stacks: 1,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });
    sim.ctx.applyAura(sim.player, {
      id: IGNIVAR_FORGE_CHAINS_AURA_ID,
      name: 'Forge Chains',
      kind: 'vulnerability',
      remaining: IGNIVAR_FORGE_CHAINS_DURATION_SECONDS,
      duration: IGNIVAR_FORGE_CHAINS_DURATION_SECONDS,
      value: 0,
      value2: ally.id,
      sourceId: boss.id,
      school: 'fire',
      encounterOwned: true,
    });

    sim.ctx.dealDamage(
      boss,
      sim.player,
      sim.player.maxHp * 100,
      false,
      'fire',
      'Raid Test Kill',
      'hit',
      true,
    );

    expect(sim.player.dead).toBe(true);
    expect(sim.player.auras.some((aura) => encounterAuraIds.includes(aura.id))).toBe(false);
    const state = boss.ignivar;
    expect(state).toBeDefined();

    sim.releaseSpirit(sim.player.id);
    const corpse = sim.player.corpsePos;
    if (!corpse) throw new Error('Raid death did not leave a corpse');
    sim.player.pos = { ...corpse };
    sim.player.prevPos = { ...corpse };
    sim.rebucket(sim.player);
    sim.resurrectAtCorpse(sim.player.id);
    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.dead).toBe(false);
    expect(sim.player.ghost).toBe(false);
    expect(sim.player.hp).toBe(Math.round(sim.player.maxHp * 0.5));
    expect(sim.player.auras.some((aura) => encounterAuraIds.includes(aura.id))).toBe(false);
    expect(boss.ignivar).toBe(state);
  });

  it('resets a real all-dead wipe and starts the next pull without stale hazards', () => {
    const { sim, boss } = claimedEncounter();
    const ally = addEncounterPlayer(sim, boss, 'Wipe Witness');
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    const firstState = boss.ignivar;
    isolateForgeChains(boss, 999);
    boss.ignivar.meteorTimer = 0;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.activeIgnivarMeteors.length).toBeGreaterThan(0);

    sim.ctx.handleDeath(sim.player, boss);
    sim.ctx.handleDeath(ally, boss);
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar).toBeUndefined();
    expect(boss.castingAbility).toBeNull();
    expect(sim.activeIgnivarMeteors).toEqual([]);

    revivePlayerAt(sim.ctx, sim.player.id, { ...boss.pos });
    revivePlayerAt(sim.ctx, ally.id, { ...boss.pos });
    boss.inCombat = true;
    boss.aiState = 'attack';
    boss.aggroTargetId = sim.player.id;
    boss.swingTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar).toBeDefined();
    expect(boss.ignivar).not.toBe(firstState);
    expect(boss.ignivar?.rotatingRaysWindupRemaining).toBe(0);
    expect(boss.ignivar?.rotatingRaysActiveRemaining).toBe(0);
    expect(boss.ignivar?.forgeWaveWindupRemaining).toBe(0);
    expect(boss.ignivar?.forgeWaveActiveRemaining).toBe(0);
    expect(boss.ignivar?.meteorPoints).toEqual([]);
    expect(boss.ignivar?.apocalypseTriggered).toBe(false);
  });

  it('ticks the frontal cadence during its cast and honors forced-target threat', () => {
    const { sim, boss } = claimedEncounter();
    const tankPid = sim.addPlayer('paladin', 'Second Tank');
    const tankMeta = sim.players.get(tankPid);
    const tank = tankMeta ? sim.entities.get(tankMeta.entityId) : undefined;
    if (!tank) throw new Error('Second tank did not spawn');
    tank.pos = { ...sim.player.pos };
    boss.forcedTargetId = tank.id;
    boss.forcedTargetTimer = 3;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.aggroTargetId).toBe(tank.id);
    expect(boss.forcedTargetTimer).toBeLessThan(3);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    isolateForgeChains(boss, 999);
    boss.ignivar.frontalTimer = 0;

    updateIgnivarEncounter(sim.ctx, boss);
    let sawRelease = false;
    let secondCastTicks = 0;
    for (let i = 1; i <= 600; i++) {
      updateIgnivarEncounter(sim.ctx, boss);
      if (boss.castingAbility === null) sawRelease = true;
      if (sawRelease && boss.castingAbility === IGNIVAR_FRONTAL_CAST_ID) {
        secondCastTicks = i;
        break;
      }
    }

    expect(secondCastTicks * DT).toBeCloseTo(IGNIVAR_FRONTAL_EVERY, 5);
  });

  it('selects exactly three unique targets deterministically from a ten-player raid', () => {
    const selectTargets = (seed: number): number[] => {
      const { sim, boss } = claimedEncounter(seed);
      const origin = instanceOrigin(DUNGEONS.ignivar_raid_arena.index, 0);
      for (let i = 1; i < 10; i++) sim.addPlayer(i % 2 === 0 ? 'mage' : 'priest', `Raider ${i}`);
      for (const meta of sim.players.values()) {
        const player = sim.entities.get(meta.entityId);
        if (player) player.pos = { x: origin.x + 15, y: 0, z: origin.z };
      }
      boss.swingTimer = 999;
      updateIgnivarEncounter(sim.ctx, boss);
      if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
      boss.ignivar.brandTimer = 0;
      boss.ignivar.frontalTimer = 999;
      updateIgnivarEncounter(sim.ctx, boss);
      return [...sim.players.values()]
        .map((meta) => sim.entities.get(meta.entityId))
        .filter((player) => player?.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID))
        .map((player) => player?.id ?? -1)
        .sort((a, b) => a - b);
    };

    const first = selectTargets(42);
    expect(first).toHaveLength(IGNIVAR_BRAND_TARGETS_NORMAL);
    expect(new Set(first).size).toBe(IGNIVAR_BRAND_TARGETS_NORMAL);
    expect(selectTargets(42)).toEqual(first);
  });

  it('honors the ten-second active window and leaves the conduit spent for the pull', () => {
    const { sim, boss, conduit } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.swingTimer = 999;
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = IGNIVAR_CONDUIT_ACTIVE_SECONDS;

    let activeTicks = 0;
    while (conduit.templateId === IGNIVAR_WATER_CONDUIT_TEMPLATES.active && activeTicks < 1_000) {
      updateIgnivarEncounter(sim.ctx, boss);
      activeTicks++;
    }
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown);
    expect(activeTicks * DT).toBeCloseTo(IGNIVAR_CONDUIT_ACTIVE_SECONDS, 5);

    for (let tick = 0; tick < 40 / DT; tick++) updateIgnivarEncounter(sim.ctx, boss);
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown);
    expect(boss.ignivar.conduitTimers.north_west).toBeUndefined();
  });

  it('only re-arms a spent conduit when the encounter resets', () => {
    const { sim, boss, conduit } = claimedEncounter();
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    conduit.templateId = IGNIVAR_WATER_CONDUIT_TEMPLATES.active;
    boss.ignivar.conduitTimers.north_west = 0.01;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown);
    boss.ignivar.conduitTimers.north_west = 0.01;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.cooldown);

    sim.player.auras.push({
      id: IGNIVAR_BRAND_AURA_ID,
      name: 'Brand of the Pyre',
      kind: 'dot',
      remaining: 600,
      duration: 600,
      value: 1,
      sourceId: boss.id,
      school: 'fire',
    });
    resetIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar).toBeUndefined();
    expect(boss.castingAbility).toBeNull();
    expect(conduit.templateId).toBe(IGNIVAR_WATER_CONDUIT_TEMPLATES.ready);
    expect(sim.player.auras.some((a) => a.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
  });

  it('starts Last Inferno at twenty percent and replaces overlapping normal mechanics', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    const normalSwingInterval = boss.weapon.speed * sim.ctx.swingIntervalMult(boss);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD) + 1;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.enraged).toBe(false);
    expect(boss.ignivar?.lastInfernoTriggered).toBe(false);

    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);
    boss.ignivar.brandTimer = DT;
    boss.ignivar.frontalTimer = DT;
    boss.ignivar.forgeStrikeTimer = DT;
    boss.ignivar.forgeWaveTimer = DT;
    boss.ignivar.soakTimer = DT;
    sim.player.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 2 };
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.enraged).toBe(true);
    expect(boss.ignivar.lastInfernoTriggered).toBe(true);
    expect(boss.ignivar.lastInfernoRemaining).toBe(IGNIVAR_LAST_INFERNO_SECONDS);
    expect(boss.auras.find((aura) => aura.id === IGNIVAR_LAST_INFERNO_AURA_ID)).toMatchObject({
      remaining: IGNIVAR_LAST_INFERNO_SECONDS,
      value: 1.2,
      encounterOwned: true,
    });
    expect(boss.weapon.speed * sim.ctx.swingIntervalMult(boss)).toBeCloseTo(
      normalSwingInterval / 1.2,
      5,
    );
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(false);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_MOLTEN_ARMOR_AURA_ID)).toBe(false);
    expect(boss.castingAbility).toBeNull();
    expect(boss.ignivar.forgeWaveTimer).toBe(DT);
    expect(boss.ignivar.soakTimer).toBe(DT);
    expect(boss.ignivar.finalNextFrontal).toBe('searing');

    boss.ignivar.meteorTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.finalFrontalTimer = 999;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar.forgeWaveTimer).toBe(DT);
    expect(boss.ignivar.soakTimer).toBe(DT);
    expect(boss.castingAbility).toBeNull();
  });

  it('accelerates dispellable marks approaching the finale and keeps casting them in it', () => {
    const { sim, boss } = claimedEncounter();
    const marked = addEncounterPlayer(sim, boss, 'Late Brand Target', 'mage');
    sim.player.devGod = true;
    marked.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.hp = Math.floor(boss.maxHp * 0.4);
    boss.ignivar.brandTimer = DT;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.meteorTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTimer = 999;
    boss.swingTimer = 999;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(marked.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    expect(boss.ignivar.brandTimer).toBe(IGNIVAR_BRAND_EVERY_LATE);

    for (const player of [sim.player, marked]) {
      player.auras = player.auras.filter((aura) => aura.id !== IGNIVAR_BRAND_AURA_ID);
    }
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar.lastInfernoTriggered).toBe(true);
    expect(boss.ignivar.brandTimer).toBeCloseTo(IGNIVAR_FINAL_FIRST_BRAND_SECONDS - DT, 8);
    boss.ignivar.meteorTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.finalFrontalTimer = 999;

    for (let tick = 0; tick < IGNIVAR_FINAL_FIRST_BRAND_SECONDS / DT - 2; tick++) {
      updateIgnivarEncounter(sim.ctx, boss);
    }
    const anyPlayerHasBrand = () =>
      [sim.player, marked].some((player) =>
        player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID),
      );
    expect(anyPlayerHasBrand()).toBe(false);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(anyPlayerHasBrand()).toBe(true);
    expect(boss.ignivar.brandTimer).toBe(IGNIVAR_BRAND_EVERY_FINAL);
  });

  it('clears a legacy Shared Pyre mark instead of blocking Last Inferno', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.ignivar.brandTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.skyfireTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.forgeWaveTimer = 999;
    boss.ignivar.soakTargetId = sim.player.id;
    boss.ignivar.soakRemaining = DT;
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);

    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar.lastInfernoTriggered).toBe(true);
    expect(boss.ignivar.soakTargetId).toBeNull();

    let ticksUntilFirstFinalCast = 0;
    while (boss.castingAbility === null && ticksUntilFirstFinalCast < 200) {
      updateIgnivarEncounter(sim.ctx, boss);
      ticksUntilFirstFinalCast++;
    }

    expect(boss.ignivar.lastInfernoTriggered).toBe(true);
    expect(ticksUntilFirstFinalCast * DT).toBeGreaterThanOrEqual(6 - DT);
    expect(boss.castingAbility).toBe(IGNIVAR_FRONTAL_CAST_ID);
  });

  it('increases Ignivar melee damage by thirty-five percent during Last Inferno', () => {
    const normal = claimedEncounter();
    const enraged = claimedEncounter();
    normal.sim.setPlayerLevel(20);
    enraged.sim.setPlayerLevel(20);
    normal.boss.enraged = false;
    enraged.boss.enraged = true;
    normal.sim.player.maxHp = 1_000_000;
    normal.sim.player.hp = normal.sim.player.maxHp;
    enraged.sim.player.maxHp = 1_000_000;
    enraged.sim.player.hp = enraged.sim.player.maxHp;

    const normalHp = normal.sim.player.hp;
    const enragedHp = enraged.sim.player.hp;
    for (let attempt = 0; attempt < 20; attempt++) {
      normal.sim.ctx.mobSwing(normal.boss, normal.sim.player);
      enraged.sim.ctx.mobSwing(enraged.boss, enraged.sim.player);
    }
    const normalDamage = normalHp - normal.sim.player.hp;
    const enragedDamage = enragedHp - enraged.sim.player.hp;

    expect(normalDamage).toBeGreaterThan(0);
    expect(enragedDamage).toBeGreaterThan(normalDamage);
    expect(enragedDamage / normalDamage).toBeCloseTo(1.35, 1);
  });

  it('wipes the claimed raid exactly when the forty-five-second Last Inferno expires', () => {
    const { sim, boss } = claimedEncounter();
    const outsiderPid = sim.addPlayer('mage', 'Outsider');
    const outsider = sim.entities.get(sim.players.get(outsiderPid)?.entityId ?? -1);
    if (!outsider) throw new Error('Outsider did not spawn');
    outsider.pos = { x: 0, y: 0, z: 0 };
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.ignivar.meteorTimer = 999;
    boss.ignivar.finalFrontalTimer = 999;
    boss.swingTimer = 999;

    const preWipeTicks = Math.round(IGNIVAR_LAST_INFERNO_SECONDS / DT) - 1;
    for (let i = 0; i < preWipeTicks; i++) updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.dead).toBe(false);
    expect(boss.ignivar.lastInfernoRemaining).toBeCloseTo(DT, 5);

    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.dead).toBe(true);
    expect(outsider.dead).toBe(false);
    expect(boss.ignivar.lastInfernoResolved).toBe(true);
  });

  it('announces Last Inferno without taking over the boss cast bar', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.ignivar.forgeStrikeTimer = 999;
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);

    const events = sim.tick();

    expect(boss.castingAbility).toBeNull();
    expect(
      events.some(
        (event) =>
          event.type === 'chat' &&
          event.channel === 'yell' &&
          event.text === 'The last flame consumes all!',
      ),
    ).toBe(true);
    const nextEvents = sim.tick();
    expect(
      nextEvents.some(
        (event) =>
          event.type === 'chat' &&
          event.channel === 'yell' &&
          event.text === 'The last flame consumes all!',
      ),
    ).toBe(false);
    expect(
      events.some(
        (event) =>
          event.type === 'spellfx' &&
          event.sourceId === boss.id &&
          event.targetId === boss.id &&
          event.fx === 'nova',
      ),
    ).toBe(true);
  });

  it('opens a fresh pull with the approved signature yell', () => {
    const { sim } = claimedEncounter();

    const events = sim.tick();

    expect(
      events.some(
        (event) =>
          event.type === 'chat' &&
          event.channel === 'yell' &&
          event.text === IGNIVAR_DIALOGUE.engage,
      ),
    ).toBe(true);
    expect(
      sim.tick().some((event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.engage),
    ).toBe(false);
  });

  it('uses the two supporting defeat barks once per fallen pull participant', () => {
    const { sim, boss } = claimedEncounter();
    const first = addEncounterPlayer(sim, boss, 'First Fallen Spark');
    const second = addEncounterPlayer(sim, boss, 'Second Fallen Spark');
    sim.player.devGod = true;
    sim.tick();
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    isolateForgeChains(boss, 999);
    boss.ignivar.dialogueCooldownRemaining = 0;
    boss.swingTimer = 999;

    sim.ctx.handleDeath(first, boss);
    const firstEvents = sim.tick();
    expect(
      firstEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.defeatSpark,
      ),
    ).toBe(true);

    boss.ignivar.dialogueCooldownRemaining = 0;
    sim.ctx.handleDeath(second, boss);
    const secondEvents = sim.tick();
    expect(
      secondEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.defeatForge,
      ),
    ).toBe(true);

    boss.ignivar.dialogueCooldownRemaining = 0;
    expect(
      sim
        .tick()
        .some(
          (event) =>
            event.type === 'chat' &&
            (event.text === IGNIVAR_DIALOGUE.defeatSpark ||
              event.text === IGNIVAR_DIALOGUE.defeatForge),
        ),
    ).toBe(false);
  });

  it('defers a defeat bark until the current major mechanic has finished', () => {
    const { sim, boss } = claimedEncounter();
    const fallen = addEncounterPlayer(sim, boss, 'Deferred Fallen Spark');
    sim.player.devGod = true;
    sim.tick();
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    isolateForgeChains(boss, 999);
    boss.ignivar.dialogueCooldownRemaining = 0;
    boss.ignivar.rotatingRaysTimer = 0;
    boss.swingTimer = 999;
    sim.ctx.handleDeath(fallen, boss);

    const rayEvents = sim.tick();
    expect(
      rayEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.rotatingRays,
      ),
    ).toBe(true);
    expect(
      rayEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.defeatSpark,
      ),
    ).toBe(false);

    boss.ignivar.rotatingRaysActiveRemaining = 0;
    boss.ignivar.rotatingRaysWindupRemaining = 0;
    boss.ignivar.dialogueCooldownRemaining = 0;
    boss.castingAbility = null;
    expect(
      sim
        .tick()
        .some((event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.defeatSpark),
    ).toBe(true);
  });

  it('speaks the supporting Last Flame line on only the first final-phase brand', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    sim.tick();
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.apocalypseTriggered = true;
    boss.ignivar.apocalypseResolved = true;
    boss.ignivar.forgeJudgmentPhase = 'done';
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_LAST_INFERNO_HP_THRESHOLD);
    isolateForgeChains(boss, 999);
    boss.ignivar.meteorTimer = 999;
    boss.ignivar.rotatingRaysTimer = 999;
    boss.swingTimer = 999;

    const phaseEvents = sim.tick();
    expect(
      phaseEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.lastInferno,
      ),
    ).toBe(true);
    expect(
      phaseEvents.some(
        (event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.finalBrand,
      ),
    ).toBe(false);

    const brandYells: SimEvent[] = [];
    for (let ticks = 0; ticks < 10 / DT; ticks++) {
      brandYells.push(
        ...sim
          .tick()
          .filter((event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.finalBrand),
      );
    }
    expect(brandYells).toHaveLength(1);
    expect(boss.ignivar.finalBrandYellSpoken).toBe(true);

    boss.castingAbility = null;
    boss.ignivar.frontalCastRemaining = 0;
    boss.ignivar.skyfireCastRemaining = 0;
    boss.ignivar.rotatingRaysWindupRemaining = 0;
    boss.ignivar.rotatingRaysActiveRemaining = 0;
    boss.ignivar.brandTimer = DT;
    boss.ignivar.dialogueCooldownRemaining = 0;
    expect(
      sim
        .tick()
        .some((event) => event.type === 'chat' && event.text === IGNIVAR_DIALOGUE.finalBrand),
    ).toBe(false);
  });

  it('ships one Normal Apocalypse add at the sixty-five-percent health gate', () => {
    expect(IGNIVAR_APOCALYPSE_HP_THRESHOLD).toBe(0.65);
    expect(IGNIVAR_APOCALYPSE_CAST_SECONDS).toBe(20);

    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD) + 1;
    updateIgnivarEncounter(sim.ctx, boss);
    expect(
      [...sim.entities.values()].filter(
        (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
      ),
    ).toHaveLength(0);
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);

    updateIgnivarEncounter(sim.ctx, boss);

    const adds = [...sim.entities.values()].filter(
      (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
    );
    expect(adds).toHaveLength(1);
    expect(adds[0]).toMatchObject({
      hostile: true,
      inCombat: true,
      castingAbility: IGNIVAR_APOCALYPSE_CAST_ID,
      castTotal: IGNIVAR_APOCALYPSE_CAST_SECONDS,
      castRemaining: IGNIVAR_APOCALYPSE_CAST_SECONDS,
      channeling: true,
    });
    expect(boss).toMatchObject({
      hostile: true,
      inCombat: true,
      aiState: 'attack',
    });
    expect(boss.ignivar?.apocalypseAddId).toBe(adds[0].id);
    expect(boss.summonedIds).toContain(adds[0].id);
    for (let i = 0; i < 50; i++) updateIgnivarEncounter(sim.ctx, boss);
    expect(
      [...sim.entities.values()].filter(
        (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
      ),
    ).toHaveLength(1);
  });

  it('announces Apocalypse with a raid-wide yell and a location-safe spawn effect', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);

    const events = sim.tick();
    const add = [...sim.entities.values()].find(
      (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
    );
    if (!add) throw new Error('Apocalypse add did not spawn');
    expect(
      events.some(
        (event) =>
          event.type === 'chat' &&
          event.channel === 'yell' &&
          event.text === IGNIVAR_DIALOGUE.apocalypse,
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === 'spellfxAt' &&
          event.x === add.pos.x &&
          event.z === add.pos.z &&
          event.fx === 'nova',
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === 'spellfxAt' &&
          event.x === add.pos.x &&
          event.z === add.pos.z &&
          event.fx === 'burst' &&
          event.ability === VARKHUL_FORGE_PORTAL_ABILITY_ID &&
          event.sourceId === boss.id &&
          event.radius === 4 &&
          event.duration === 2,
      ),
    ).toBe(true);

    const nextEvents = sim.tick();
    expect(
      nextEvents.some(
        (event) =>
          event.type === 'chat' &&
          event.channel === 'yell' &&
          event.text === IGNIVAR_DIALOGUE.apocalypse,
      ),
    ).toBe(false);
  });

  it('keeps the Apocalypse add stationary and non-attacking while Ignivar stays active', () => {
    const { sim, boss } = claimedEncounter();
    sim.player.devGod = true;
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    const add = [...sim.entities.values()].find(
      (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
    );
    if (!add) throw new Error('Apocalypse add did not spawn');
    const spawn = { ...add.pos };
    const swingBefore = add.swingTimer;
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = DT;
    boss.ignivar.frontalTimer = DT;

    updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.auras.some((aura) => aura.id === IGNIVAR_BRAND_AURA_ID)).toBe(true);
    expect(boss.castingAbility).toBe(IGNIVAR_FRONTAL_CAST_ID);

    for (let i = 0; i < 40; i++) sim.tick();

    expect(add.pos).toEqual(spawn);
    expect(add.swingTimer).toBe(swingBefore);
    expect(add.castingAbility).toBe(IGNIVAR_APOCALYPSE_CAST_ID);
    expect(add.castRemaining).toBeLessThan(IGNIVAR_APOCALYPSE_CAST_SECONDS);
    expect(boss.inCombat).toBe(true);
    expect(boss.aiState).toBe('attack');
  });

  it('cancels Apocalypse when the add dies and never summons it twice in one pull', () => {
    const { sim, boss } = claimedEncounter();
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    const add = [...sim.entities.values()].find(
      (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID,
    );
    if (!add) throw new Error('Apocalypse add did not spawn');

    sim.ctx.dealDamage(
      sim.player,
      add,
      add.maxHp * 100,
      false,
      'physical',
      'Test Kill',
      'hit',
      true,
    );
    expect(add.dead).toBe(true);
    const hpBefore = sim.player.hp;
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    isolateForgeChains(boss, 999);
    boss.swingTimer = 999;

    const ticksPastOriginalDeadline = Math.round(IGNIVAR_APOCALYPSE_CAST_SECONDS / DT) + 1;
    for (let i = 0; i < ticksPastOriginalDeadline; i++) updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.dead).toBe(false);
    expect(sim.player.hp).toBe(hpBefore);
    expect(boss.ignivar?.apocalypseResolved).toBe(true);
    expect(
      [...sim.entities.values()].filter(
        (entity) => entity.templateId === IGNIVAR_APOCALYPSE_ADD_ID && !entity.dead,
      ),
    ).toHaveLength(0);
  });

  it('wipes only living players inside the claimed arena when Apocalypse completes', () => {
    const { sim, boss } = claimedEncounter();
    const raiderPid = sim.addPlayer('priest', 'Raid Healer');
    const outsiderPid = sim.addPlayer('mage', 'Outsider');
    const raider = sim.entities.get(sim.players.get(raiderPid)?.entityId ?? -1);
    const outsider = sim.entities.get(sim.players.get(outsiderPid)?.entityId ?? -1);
    if (!raider || !outsider) throw new Error('Test players did not spawn');
    raider.pos = { x: boss.pos.x, y: boss.pos.y, z: boss.pos.z - 12 };
    outsider.pos = { x: 0, y: 0, z: 0 };
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    if (!boss.ignivar) throw new Error('Ignivar state was not initialized');
    boss.ignivar.brandTimer = 999;
    boss.ignivar.frontalTimer = 999;
    boss.swingTimer = 999;
    sim.player.devGod = true;
    raider.devGod = true;

    const preWipeTicks = Math.round(IGNIVAR_APOCALYPSE_CAST_SECONDS / DT) - 1;
    for (let i = 0; i < preWipeTicks; i++) updateIgnivarEncounter(sim.ctx, boss);
    expect(sim.player.dead).toBe(false);
    expect(raider.dead).toBe(false);
    expect(boss.ignivar.apocalypseCastRemaining).toBeCloseTo(DT, 5);

    sim.player.devGod = false;
    raider.devGod = false;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.dead).toBe(true);
    expect(raider.dead).toBe(true);
    expect(outsider.dead).toBe(false);
    expect(boss.ignivar.apocalypseResolved).toBe(true);
  });

  it('despawns the Apocalypse add on reset and rearms it for a fresh pull', () => {
    const { sim, boss } = claimedEncounter();
    boss.hp = Math.floor(boss.maxHp * IGNIVAR_APOCALYPSE_HP_THRESHOLD);
    updateIgnivarEncounter(sim.ctx, boss);
    const firstAddId = boss.ignivar?.apocalypseAddId;
    if (firstAddId === null || firstAddId === undefined) {
      throw new Error('Apocalypse add did not spawn');
    }
    sim.player.targetId = firstAddId;

    resetIgnivarEncounter(sim.ctx, boss);

    expect(sim.entities.has(firstAddId)).toBe(false);
    expect(sim.player.targetId).toBeNull();
    expect(boss.summonedIds).toEqual([]);
    updateIgnivarEncounter(sim.ctx, boss);
    const secondAddId = boss.ignivar?.apocalypseAddId;
    expect(secondAddId).not.toBeNull();
    expect(secondAddId).not.toBe(firstAddId);
    expect(sim.entities.get(secondAddId ?? -1)?.templateId).toBe(IGNIVAR_APOCALYPSE_ADD_ID);
  });

  it('recovers participating players long cooldowns when the pull wipes', () => {
    const { sim, boss } = claimedEncounter();
    sim.setPlayerLevel(20);
    const meta = sim.meta(sim.player.id);
    const longAbility = meta?.known.find((ability) => ability.cooldown >= 120);
    if (!longAbility) throw new Error('Expected a long Warrior cooldown');
    sim.player.cooldowns.set(longAbility.def.id, longAbility.cooldown);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar?.attemptParticipantIds).toContain(sim.player.id);

    sim.player.dead = true;
    sim.player.hp = 0;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar).toBeUndefined();
    expect(sim.player.cooldowns.has(longAbility.def.id)).toBe(false);
  });

  it('does not reset a remote nonparticipant cooldown when Ignivar wipes', () => {
    const { sim, boss } = claimedEncounter();
    const outsiderId = sim.addPlayer('warrior', 'Remote Ignivar Visitor');
    sim.setPlayerLevel(20, outsiderId);
    const outsider = sim.entities.get(outsiderId);
    const outsiderMeta = sim.meta(outsiderId);
    const longAbility = outsiderMeta?.known.find((ability) => ability.cooldown >= 120);
    if (!outsider || !longAbility) throw new Error('Expected a remote player with a long cooldown');
    outsider.cooldowns.set(longAbility.def.id, longAbility.cooldown);
    outsider.pos = sim.ctx.groundPos(0, 0);
    outsider.prevPos = { ...outsider.pos };
    sim.rebucket(outsider);
    updateIgnivarEncounter(sim.ctx, boss);
    expect(boss.ignivar?.attemptParticipantIds).not.toContain(outsider.id);

    sim.player.dead = true;
    sim.player.hp = 0;
    updateIgnivarEncounter(sim.ctx, boss);

    expect(boss.ignivar).toBeUndefined();
    expect(outsider.cooldowns.get(longAbility.def.id)).toBe(longAbility.cooldown);
  });

  it('keeps long cooldowns when Ignivar is reset without a wipe', () => {
    const { sim, boss } = claimedEncounter();
    sim.setPlayerLevel(20);
    const meta = sim.meta(sim.player.id);
    const longAbility = meta?.known.find((ability) => ability.cooldown >= 120);
    if (!longAbility) throw new Error('Expected a long Warrior cooldown');
    sim.player.cooldowns.set(longAbility.def.id, longAbility.cooldown);
    updateIgnivarEncounter(sim.ctx, boss);

    resetIgnivarEncounter(sim.ctx, boss);

    expect(sim.player.cooldowns.get(longAbility.def.id)).toBe(longAbility.cooldown);
  });
});
