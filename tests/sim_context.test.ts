// Direct unit tests for the SimContext seam (src/sim/sim_context.ts), installed by
// session S0b. Two layers:
//   1. createSimContext() in isolation against a FAKE host: the primitives are live
//      read-throughs, the callbacks pass through unchanged, and building/reading the
//      context draws no rng (so the seam can never perturb determinism).
//   2. The real `Sim.ctx`: every stub delegates to the still-on-Sim method of the
//      same name, and the seam leaves same-seed-same-world determinism intact.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createDeedRuntime } from '../src/sim/deeds';
import { asFreeholdPlotId, defaultFreeholdState } from '../src/sim/freehold';
import { createMobScanCounters } from '../src/sim/mob/scan_counters';
import { Rng } from '../src/sim/rng';
import { Sim } from '../src/sim/sim';
import { createSimContext, type SimContextHost } from '../src/sim/sim_context';
import { SpatialGrid } from '../src/sim/spatial';
import { DEFAULT_STORAGE_PRICES } from '../src/sim/storage_prices';
import type { Entity, SimEvent } from '../src/sim/types';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { tsFilesUnder } from './helpers/ts_files_under';

// Every cross-system callback on the seam. The list IS the contract: each must be a
// faithful pass-through to its host (and, on a real Sim, to the method of the same
// name). Keep in sync with SimContextCallbacks.
const CALLBACK_KEYS = [
  'emit',
  'error',
  'reserveVaultConsumption',
  'dealDamage',
  'handleDeath',
  'cancelCast',
  'pushbackCast',
  'refreshMobLeashFromAction',
  'retargetMob',
  'nythraxisAddFallbackTarget',
  'scheduleNythraxisAddDespawnIfBossReset',
  'isArenaCrossTeam',
  'arenaTeamOf',
  'endArenaMatch',
  'endDuel',
  // A2 duel/arena slice surface (consumed-from-Sim + arena bodies exposed for A3).
  'clearAurasFromSource',
  'entityInDungeon',
  'hasPendingSocialInvite',
  'createFiestaState',
  'fiestaStandardize',
  'updateFiestaActive',
  'fiestaRestoreChar',
  'clearFiestaAugments',
  'readyArenaFighter',
  'resetForArena',
  'isArenaTeamWiped',
  'arenaIsDown',
  'arenaAllPids',
  'fiestaTakedown',
  'fiestaDown',
  'rollLoot',
  'rollWorldBossLoot',
  'applyHeal',
  'spellCrit',
  'applyAura',
  'applyRootAura',
  'applyKnockback',
  'isIceBlocked',
  'diminishedCrowdControlDuration',
  'hostilesInRadius',
  'friendliesInRadius',
  'breakStealth',
  'applyTaunt',
  'summonPet',
  'petOf',
  'completeTame',
  // P1b new shared-helper keys (error/playerGcdFor/healingThreat/countItem already listed
  // elsewhere - deduped, not re-added).
  'spendResource',
  'removeItem',
  'canAddItem',
  'clearEntityMarker',
  'partyOf',
  'removeFromParty',
  'dropPartyMarkers',
  'formDungeonFinderGroup',
  // Quest-credit callbacks + the countItem the collect arm consumes.
  'onMobKilledForQuests',
  'onRecipeCraftedForQuests',
  'onNodeGatheredForQuests',
  'onCropFarmedForQuests',
  'onInventoryChangedForQuests',
  'checkQuestReady',
  'countItem',
  'completeQuestForDev',
  'completeCurrentQuestsForDev',
  // E1 entity-roster surface.
  'addEntity',
  'dropEntity',
  'rebucket',
  'resolve',
  'groundPos',
  'playerMods',
  'delveRunForPlayer',
  'delveModuleEntry',
  'failDelveRun',
  'pulseGroundAoE',
  // C1 damage-core surface.
  'grantXp',
  'enterCombat',
  'hexOutputMult',
  'critVulnBonus',
  'pvpController',
  'threatMod',
  'clearNonPlayerStatAuras',
  // C3 aura/regen runner surface.
  'healingTakenMult',
  'healingThreat',
  'applyNonPlayerStatAura',
  'delveRunForMob',
  'onDelveBossDefeated',
  'grantNythraxisLockout',
  'frenzyPackmates',
  'armDeathThroes',
  'refreshKnownAbilities',
  'revalidateOffhandForSpec',
  'syncPetLevel',
  // M2 mob-locomotion surface.
  'moveToward',
  'mobSwing',
  'updateRangedPetAttack',
  'fleeMoveSpeed',
  'maybeFlee',
  'aggroMob',
  'isStunned',
  'isRooted',
  'moveSpeedMult',
  'swingIntervalMult',
  'mobCanSwim',
  'resolveMovePoint',
  'resolvePlayerMove',
  'resolveMove',
  'updatePet',
  'isDelveCompanionMob',
  'updateDelveCompanion',
  'updateBossMechanics',
  'updateNythraxisEncounter',
  'resetNythraxisEncounter',
  'despawnSummonedAdds',
  'updateFearMovement',
  'delveDetectMult',
  'detonateCorpse',
  'despawnPet',
  'respawnMob',
  'onBossDeath',
  // I1 dungeon instancing + the shared raid-lockout clock + the host reset boundary.
  'lockoutNowMs',
  'raidResetMs',
  'weeklyRaidResetMs',
  'instanceKeyFor',
  'instanceOriginOf',
  'instanceClaimIdAt',
  'enterDungeon',
  'leaveDungeon',
  'resetDungeonInstances',
  'inheritDungeonResetLocks',
  'dungeonDifficulty',
  'setDungeonDifficulty',
  'awardHeroicMarks',
  // Masterwrought phase 04 materials surface (professions/masterwrought_materials).
  'awardWyrmfallCores',
  // M3 mob-swing affix cascade surface.
  'effectiveArmor',
  'recalcPlayer',
  // I2a delve run lifecycle consume surface (helpers / gates / pet seam / I2b / I2c
  // + the reach-in callbacks). grantXp/despawnPet/delveRunForMob/onDelveBossDefeated/
  // delveDetectMult already listed above (C1/M2/C3) - deduped, not re-added.
  'partyMembersForKey',
  'addItem',
  'addItemInstance',
  // 'removeItem' listed above (P1b inventory-hub helper) - deduped.
  'spawnBossAdds',
  'tradeFor',
  'duelFor',
  'serializePet',
  'restorePet',
  'despawnPersistentPet',
  'isPetClass',
  'spawnDelveCompanion',
  'despawnDelveCompanion',
  'maybeCompanionBark',
  'abandonLockpick',
  'tickLockpickTimeout',
  'startDelveRaiseDeadChannel',
  'tickMountTraining',
  'abandonMountTraining',
  'tickMountRace',
  // C4a casting-lifecycle surface.
  'resolvedAbility',
  'playerGcdFor',
  'isFriendlyTo',
  'isHostileTo',
  'lineOfSightBlocked',
  'stopFollow',
  'partyInvite',
  'readyCheckStart',
  'pullTimerStart',
  'pullTimerCancel',
  'tameError',
  'standUp',
  'breakGhostWolf',
  'forceDismount',
  'startAutoAttack',
  'tryPlayerSwing',
  'revivePet',
  'completeFishing',
  'completeGatherCast',
  'completeCraftCast',
  'completeDisenchantCast',
  'completeApplyEnchantCast',
  'completeSalvageCast',
  'completeSunderCast',
  'completeRechargeCast',
  'applyDemonHealTick',
  'awardCombo',
  'meleeSwing',
  'effectiveAttackPower',
  'hasLineOfSight',
  'findChargePath',
  'runEffects',
  // P1a pet-AI surface (effectiveAttackPower/isHostileTo already listed above; deduped).
  // C5 auto-attack consumes aggroMob/swingIntervalMult, already listed above (M2; deduped).
  'syncPetAspect',
  // G2 social plumbing (hasPendingSocialInvite already listed above; deduped).
  'setPlayerLevel',
  'notice',
  'spawnDevBot',
  'spawnDevVendor',
  'startCascadePlaytest',
  'startDevSandbox',
  'setDevMobsFrozen',
  'seedDungeonFinderDev',
  // L2 inventory/vendor (W2): the four still-on-Sim helpers the moved useItem dispatches to.
  'startFishing',
  'unlockMechChromaFromItem',
  'openSkinSelect',
  'isSwimming',
  // W3 interaction: the two still-on-Sim quest-NPC delegates the moved interact dispatches to.
  'talkToNpc',
  'isQuestInteractionEntity',
  // W5 chat router/readouts reach-backs.
  'targetEntity',
  'partyCapacity',
  'marketListingBelongsTo',
  // Ravenpost mail: the quest turn-in letter hook.
  'queueQuestLetter',
  'mailHeroicMarks',
  'mailWyrmfallCores',
  'mailAuthoredLetter',
  'mailboxHoldsItem',
  // Commission order board change signal (professions/commission_order.ts
  // writes it at every board mutation; the server's corder gate reads it).
  'bumpCommissionOrderBoardRev',
  // Set proc firing.
  'applySetProcs',
  // Book of Deeds lifetime-counter bump (deeds.ts owns the body).
  'bumpDeedStat',
  // The six vcup* callbacks were removed here with the Vale Cup retirement
  // (docs/design/eastbrook-revamp/master-plan.md), the sanctioned exception to
  // this list's append-only rule.
  // Thornhollow Fields battleground hooks (social/battleground.ts).
  'bgOnPlayerDeath',
] as const;

// A fully-spied fake host. `clock` is mutable so a test can prove the context reads
// time/tickCount LIVE rather than snapshotting them at construction.
function makeFakeHost() {
  const rng = new Rng(123);
  const entities = new Map<number, Entity>();
  const clock = { time: 0, tick: 0 };
  const host: SimContextHost = {
    riftCollisionToken: 1,
    accountCosmetics: {
      completedQuestIds: [],
      mechChromaIds: [],
      weaponSkinIds: [],
      weaponSkinLoadout: {},
      mountSkinIds: [],
    },
    storagePrices: DEFAULT_STORAGE_PRICES,
    naturalRiftPortals: [],
    riftEvents: [],
    nextRiftInstanceId: 1,
    riftPortalNextAt: 120,
    riftPortalSpawnCount: 0,
    get rng() {
      return rng;
    },
    get time() {
      return clock.time;
    },
    get tickCount() {
      return clock.tick;
    },
    get entities() {
      return entities;
    },
    entityRosterVersion: 0,
    players: new Map(),
    masteryResetNoticeCounter: { pending: 0 },
    stationPlacements: [],
    primaryId: -1,
    tradeInvites: new Map(),
    duelInvites: new Map(),
    feasts: new Map(),
    nextId: 1,
    grid: new SpatialGrid(),
    playerGrid: new SpatialGrid(),
    delayedEvents: [],
    pendingProjectiles: [],
    groundAoEs: [],
    frozenOrbs: [],
    dungeonDoorIds: null,
    instances: [],
    riftInstances: [],
    riftPortalIds: null,
    dungeonResetLocks: new Map(),
    arenaMatches: new Map(),
    duels: new Map(),
    cardDuelQueue: [],
    cardDuels: new Map(),
    cfg: { seed: 1 } as unknown as SimContextHost['cfg'],
    trades: new Map(),
    arenaQueue1v1: [],
    arenaQueue2v2: [],
    arenaQueueFiesta: [],
    arenaBusySlots: new Set(),
    arenaQueueYumi3: [],
    arenaQueueYumi5: [],
    yumiBusySlots: new Set(),
    yumiCatMatches: new Map(),
    escortRuns: new Map(),
    matchmakeYumi: vi.fn(),
    updateYumiActive: vi.fn(),
    yumiPlayerDown: vi.fn(),
    yumiCatDamaged: vi.fn(),
    cleanupYumiMatch: vi.fn(),
    nextArenaMatchId: 1,
    bgQueue: [],
    bgMatches: new Map(),
    bgBusySlots: new Set(),
    bgOutcomes: [],
    bgProposals: [],
    bgProposalLockouts: new Map(),
    nextBgProposalId: 1,
    nextBgMatchId: 1,
    delveRuns: [],
    delvePetStash: new Map(),
    utcDay: '',
    resetDay: '',
    eventLeadDay: '',
    dailyResetRemainingSec: 0,
    pendingMobRespawns: [],
    partyInvites: new Map(),
    readyChecks: new Map(),
    pullTimers: new Map(),
    pendingResurrections: new Map(),
    chatTokens: new Map(),
    channelSubs: new Map(),
    pendingLootRolls: new Map(),
    nextLootRollId: 1,
    devCommands: false,
    compulsoryTutorial: false,
    freeholdsEnabled: false,
    freeholdKeyAdmission: () => true,
    freeholdKeyReadyAtMs: new Map(),
    instanceScanCounters: { claimedSlotVisits: 0, ownerRosterVisits: 0, ownerClaimTests: 0 },
    freeholdDevGrantEnabled: false,
    marketListings: [],
    commissionOrderBoard: [],
    nextCommissionOrderId: 1,
    bankerIds: [],
    guildBanks: new Map(),
    freeholds: new Map(),
    deedDirtyPids: new Set<number>(),
    deedDirtyKeys: new Map<number, Set<string>>(),
    worldBossEntityIds: [],
    deedRuntime: createDeedRuntime(),
    fiestaBotPids: [],
    mobScanCounters: createMobScanCounters(),
    engagedPids: new Set<number>(),
    bumpDeedStat: vi.fn(),
    bumpCommissionOrderBoardRev: vi.fn(),
    markItemDiscovered: vi.fn(),
    markVisited: vi.fn(),
    markDeedsDirty: vi.fn(),
    grantDeed: vi.fn(() => true),
    emit: vi.fn(),
    error: vi.fn(),
    reserveVaultConsumption: vi.fn(() => ({ commit: vi.fn(), cancel: vi.fn() })),
    dealDamage: vi.fn(),
    handleDeath: vi.fn(),
    cancelCast: vi.fn(),
    pushbackCast: vi.fn(),
    refreshMobLeashFromAction: vi.fn(),
    retargetMob: vi.fn(),
    nythraxisAddFallbackTarget: vi.fn(() => null),
    scheduleNythraxisAddDespawnIfBossReset: vi.fn(() => false),
    isArenaCrossTeam: vi.fn(() => false),
    arenaTeamOf: vi.fn(() => null),
    endArenaMatch: vi.fn(),
    endDuel: vi.fn(),
    clearAurasFromSource: vi.fn(),
    entityInDungeon: vi.fn(() => false),
    hasPendingSocialInvite: vi.fn(() => false),
    createFiestaState: vi.fn(),
    fiestaStandardize: vi.fn(),
    updateFiestaActive: vi.fn(),
    fiestaRestoreChar: vi.fn(),
    clearFiestaAugments: vi.fn(),
    readyArenaFighter: vi.fn(),
    resetForArena: vi.fn(),
    isArenaTeamWiped: vi.fn(() => false),
    arenaIsDown: vi.fn(() => false),
    arenaAllPids: vi.fn(() => []),
    fiestaTakedown: vi.fn(),
    fiestaDown: vi.fn(),
    rollLoot: vi.fn(),
    rollWorldBossLoot: vi.fn(),
    applyHeal: vi.fn(),
    spellCrit: vi.fn(() => 0.05),
    applyAura: vi.fn(),
    isControlAura: vi.fn(() => false),
    applyRootAura: vi.fn(),
    applyKnockback: vi.fn(() => 0),
    isIceBlocked: vi.fn(() => false),
    diminishedCrowdControlDuration: vi.fn(() => null),
    hostilesInRadius: vi.fn(() => []),
    friendliesInRadius: vi.fn(() => []),
    breakStealth: vi.fn(),
    applyTaunt: vi.fn(),
    summonPet: vi.fn(),
    petOf: vi.fn(() => null),
    completeTame: vi.fn(),
    // P1b new shared-helper stubs (error/playerGcdFor/healingThreat/countItem stubbed
    // elsewhere in this host - deduped).
    spendResource: vi.fn(),
    removeItem: vi.fn(),
    canAddItem: vi.fn(() => true),
    removeFungibleItem: vi.fn(),
    clearEntityMarker: vi.fn(),
    partyOf: vi.fn(() => null),
    removeFromParty: vi.fn(),
    dropPartyMarkers: vi.fn(),
    formDungeonFinderGroup: vi.fn(() => null),
    onMobKilledForQuests: vi.fn(),
    onRecipeCraftedForQuests: vi.fn(),
    onNodeGatheredForQuests: vi.fn(),
    onCropFarmedForQuests: vi.fn(),
    onInventoryChangedForQuests: vi.fn(),
    checkQuestReady: vi.fn(),
    countItem: vi.fn(() => 0),
    countFungibleItem: vi.fn(() => 0),
    countEnchantableItem: vi.fn(() => 0),
    removeEnchantableItem: vi.fn(),
    completeQuestForDev: vi.fn(() => false),
    completeCurrentQuestsForDev: vi.fn(() => 0),
    lockoutNowMs: vi.fn(() => 0),
    raidResetMs: vi.fn((nowMs: number) => nowMs),
    weeklyRaidResetMs: vi.fn((nowMs: number) => nowMs),
    instanceKeyFor: vi.fn(() => 'solo:0'),
    instanceOriginOf: vi.fn(() => ({ x: 0, z: 0 })),
    instanceClaimIdAt: vi.fn(() => null),
    enterDungeon: vi.fn(),
    leaveDungeon: vi.fn(),
    enterRift: vi.fn(),
    leaveRift: vi.fn(),
    riftOpenTreasure: vi.fn(),
    resetDungeonInstances: vi.fn(),
    inheritDungeonResetLocks: vi.fn(),
    dungeonDifficulty: vi.fn(() => 'normal' as const),
    setDungeonDifficulty: vi.fn(),
    awardHeroicMarks: vi.fn(),
    awardWyrmfallCores: vi.fn(),
    addEntity: vi.fn(),
    dropEntity: vi.fn(),
    rebucket: vi.fn(),
    resolve: vi.fn(() => null),
    groundPos: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
    playerMods: vi.fn(),
    delveRunForPlayer: vi.fn(() => null),
    delveModuleEntry: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
    failDelveRun: vi.fn(),
    pulseGroundAoE: vi.fn(),
    grantXp: vi.fn(),
    enterCombat: vi.fn(),
    hexOutputMult: vi.fn(() => 1),
    critVulnBonus: vi.fn(() => 0),
    pvpController: vi.fn(() => null),
    threatMod: vi.fn(() => 1),
    clearNonPlayerStatAuras: vi.fn(),
    healingTakenMult: vi.fn(() => 1),
    healingThreat: vi.fn(),
    applyNonPlayerStatAura: vi.fn(),
    delveRunForMob: vi.fn(() => null),
    onDelveBossDefeated: vi.fn(),
    grantNythraxisLockout: vi.fn(),
    frenzyPackmates: vi.fn(),
    armDeathThroes: vi.fn(),
    refreshKnownAbilities: vi.fn(),
    revalidateOffhandForSpec: vi.fn(),
    syncPetLevel: vi.fn(),
    moveToward: vi.fn(() => false),
    mobSwing: vi.fn(),
    updateRangedPetAttack: vi.fn(),
    fleeMoveSpeed: vi.fn(() => 0),
    maybeFlee: vi.fn(() => false),
    aggroMob: vi.fn(),
    isStunned: vi.fn(() => false),
    isRooted: vi.fn(() => false),
    moveSpeedMult: vi.fn(() => 1),
    swingIntervalMult: vi.fn(() => 1),
    mobCanSwim: vi.fn(() => false),
    resolveMovePoint: vi.fn(() => ({ x: 0, z: 0 })),
    resolvePlayerMove: vi.fn(() => ({ x: 0, z: 0 })),
    resolveMove: vi.fn(() => ({ x: 0, z: 0 })),
    updatePet: vi.fn(),
    isDelveCompanionMob: vi.fn(() => false),
    updateDelveCompanion: vi.fn(),
    updateBossMechanics: vi.fn(),
    updateNythraxisEncounter: vi.fn(),
    resetNythraxisEncounter: vi.fn(),
    despawnSummonedAdds: vi.fn(),
    updateFearMovement: vi.fn(() => false),
    delveDetectMult: vi.fn(() => 1),
    detonateCorpse: vi.fn(),
    despawnPet: vi.fn(),
    respawnMob: vi.fn(),
    resetEvadingMob: vi.fn(),
    onBossDeath: vi.fn(),
    effectiveArmor: vi.fn(() => 0),
    recalcPlayer: vi.fn(),
    // I2a delve run lifecycle stubs. grantXp/despawnPet/delveRunForMob/onDelveBossDefeated/
    // delveDetectMult stubbed above (C1/M2/C3) - deduped here.
    partyMembersForKey: vi.fn(() => []),
    addItem: vi.fn(),
    equipBag: vi.fn(),
    equipItem: vi.fn(),
    unequipItem: vi.fn(),
    addItemInstance: vi.fn(),
    // removeItem stubbed above (P1b inventory-hub helper) - deduped.
    spawnBossAdds: vi.fn(),
    tradeFor: vi.fn(() => null),
    duelFor: vi.fn(() => null),
    serializePet: vi.fn(() => null),
    restorePet: vi.fn(),
    despawnPersistentPet: vi.fn(),
    isPetClass: vi.fn(() => false),
    spawnDelveCompanion: vi.fn(),
    despawnDelveCompanion: vi.fn(),
    maybeCompanionBark: vi.fn(),
    abandonLockpick: vi.fn(),
    tickLockpickTimeout: vi.fn(),
    startDelveRaiseDeadChannel: vi.fn(() => false),
    tickMountTraining: vi.fn(),
    tickMountRace: vi.fn(),
    abandonMountTraining: vi.fn(),
    resolvedAbility: vi.fn(() => null),
    playerGcdFor: vi.fn(() => 1.5),
    isFriendlyTo: vi.fn(() => false),
    isHostileTo: vi.fn(() => false),
    lineOfSightBlocked: vi.fn(() => false),
    stopFollow: vi.fn(),
    partyInvite: vi.fn(),
    readyCheckStart: vi.fn(),
    pullTimerStart: vi.fn(),
    pullTimerCancel: vi.fn(),
    tameError: vi.fn(() => null),
    standUp: vi.fn(),
    breakGhostWolf: vi.fn(),
    forceDismount: vi.fn(),
    startAutoAttack: vi.fn(),
    tryPlayerSwing: vi.fn(),
    revivePet: vi.fn(),
    completeFishing: vi.fn(),
    completeGatherCast: vi.fn(),
    completeCraftCast: vi.fn(),
    completeDisenchantCast: vi.fn(),
    completeApplyEnchantCast: vi.fn(),
    completeSalvageCast: vi.fn(),
    completeSunderCast: vi.fn(),
    completeRechargeCast: vi.fn(),
    applyDemonHealTick: vi.fn(),
    awardCombo: vi.fn(),
    meleeSwing: vi.fn(() => false),
    effectiveAttackPower: vi.fn(() => 0),
    hasLineOfSight: vi.fn(() => true),
    findChargePath: vi.fn(() => []),
    runEffects: vi.fn(),
    // P1a pet-AI stub (effectiveAttackPower/isHostileTo already stubbed above; deduped).
    // C5 auto-attack consumes aggroMob/swingIntervalMult, already stubbed above (M2; deduped).
    syncPetAspect: vi.fn(),
    // G2 social plumbing (hasPendingSocialInvite already stubbed above; deduped).
    setPlayerLevel: vi.fn(),
    notice: vi.fn(),
    spawnDevBot: vi.fn(),
    spawnDevVendor: vi.fn(),
    startCascadePlaytest: vi.fn(),
    startDevSandbox: vi.fn(),
    setDevMobsFrozen: vi.fn(() => false),
    seedDungeonFinderDev: vi.fn(() => ({ spawned: 0, note: 'ok' as const })),
    // L2 inventory/vendor (W2): the four still-on-Sim helpers the moved useItem dispatches to.
    startFishing: vi.fn(),
    unlockMechChromaFromItem: vi.fn(),
    openSkinSelect: vi.fn(),
    isSwimming: vi.fn(() => false),
    // W3 interaction: the two still-on-Sim quest-NPC delegates the moved interact dispatches to.
    talkToNpc: vi.fn(),
    isQuestInteractionEntity: vi.fn(() => false),
    // W5 chat router/readouts reach-backs.
    targetEntity: vi.fn(),
    partyCapacity: vi.fn(() => 5),
    marketListingBelongsTo: vi.fn(() => false),
    // Ravenpost mail: the quest turn-in letter hook.
    queueQuestLetter: vi.fn(),
    mailHeroicMarks: vi.fn(),
    mailWyrmfallCores: vi.fn(),
    mailAuthoredLetter: vi.fn(),
    mailboxHoldsItem: vi.fn(() => false),
    applySetProcs: vi.fn(),
    // Thornhollow Fields battleground hooks.
    bgOnPlayerDeath: vi.fn(),
    bgOnPlayerDamaged: vi.fn(),
    bgOnPlayerHealed: vi.fn(),
    bgCancelFlagAura: vi.fn(() => false),
  };
  return { host, rng, entities, clock };
}

describe('createSimContext (isolated, fake host)', () => {
  it('exposes the host rng/entities by shared reference', () => {
    const { host, rng, entities } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.rng).toBe(rng);
    expect(ctx.entities).toBe(entities);
  });

  it('reads time/tickCount LIVE, not snapshotted at construction', () => {
    const { host, clock } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.time).toBe(0);
    expect(ctx.tickCount).toBe(0);
    clock.time = 12.5;
    clock.tick = 7;
    expect(ctx.time).toBe(12.5);
    expect(ctx.tickCount).toBe(7);
  });

  it('exposes bankerIds as a live shared view (the marketListings idiom)', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.bankerIds).toBe(host.bankerIds);
    host.bankerIds.push(4242); // the Sim ctor pushes ids after the ctx is built
    expect(ctx.bankerIds).toEqual([4242]);
  });

  it('exposes guildBanks as a live shared view (the bankerIds idiom)', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.guildBanks).toBe(host.guildBanks);
    host.guildBanks.set(3, { treasury: 0, inventory: [], purchasedSlots: 0 });
    expect(ctx.guildBanks.get(3)).toEqual({ treasury: 0, inventory: [], purchasedSlots: 0 });
  });

  it('keeps isolated key state and instance scan counters as Sim-owned live views', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.freeholdKeyReadyAtMs).toBe(host.freeholdKeyReadyAtMs);
    expect(ctx.instanceScanCounters).toBe(host.instanceScanCounters);
    host.freeholdKeyReadyAtMs.set('account:7', 1234);
    host.instanceScanCounters.claimedSlotVisits++;
    expect(ctx.freeholdKeyReadyAtMs.get('account:7')).toBe(1234);
    expect(ctx.instanceScanCounters.claimedSlotVisits).toBe(1);
    expect(ctx.freeholdKeyAdmission('account:7', 1)).toBe(true);
  });

  it('exposes freeholds as a live shared view (the guildBanks idiom)', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.freeholds).toBe(host.freeholds);
    host.freeholds.set('acct:1', defaultFreeholdState('acct:1', asFreeholdPlotId('plot-1')));
    expect(ctx.freeholds.get('acct:1')).toEqual(
      defaultFreeholdState('acct:1', asFreeholdPlotId('plot-1')),
    );
    // Mutation through the ctx side is visible on the host side too: one map.
    ctx.freeholds.delete('acct:1');
    expect(host.freeholds.size).toBe(0);
  });

  it('is the ONLY read of cfg.freeholdsEnabled anywhere in src/sim (source pin)', () => {
    // The acceptance criterion is that the flag is read "only through its ctx
    // primitive". The read-through arm below pins the positive half; this pins
    // the negative one, which is the half that actually constrains 03 and 06.
    // Without it, a direct `this.cfg.freeholdsEnabled` inside sim.ts (exactly
    // what a furnisher-stock or gate-prompt author would reach for) ships green.
    const simDir = join(__dirname, '..', 'src', 'sim');
    const codeOnly = (src: string): string =>
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const files = tsFilesUnder(simDir);
    // Anti-vacuity floor: the walk saw the real tree, including sim.ts itself.
    expect(files.length).toBeGreaterThan(100);
    expect(files.some((f) => f.file === 'sim.ts')).toBe(true);

    const hits: string[] = [];
    for (const { file, full } of files) {
      const code = codeOnly(readFileSync(full, 'utf8'));
      for (const line of code.split('\n')) {
        if (/\bcfg\.freeholdsEnabled\b/.test(line)) hits.push(`${file}: ${line.trim()}`);
      }
    }
    // Exactly two sanctioned sites: the ctor default that resolves the optional
    // SimConfig field, and the ctx getter that publishes it. Any third hit is a
    // direct read that bypasses the primitive.
    expect(hits.sort()).toEqual([
      'sim.ts: freeholdsEnabled: cfg.freeholdsEnabled ?? false,',
      'sim.ts: return sim.cfg.freeholdsEnabled;',
    ]);
  });

  it('reads freeholdsEnabled through to the host (the compulsoryTutorial boot-flag shape)', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.freeholdsEnabled).toBe(false);
    // The fake host is a plain literal, so flipping the field proves the getter
    // reads through rather than snapshotting at construction.
    (host as { freeholdsEnabled: boolean }).freeholdsEnabled = true;
    expect(ctx.freeholdsEnabled).toBe(true);
  });

  it('is the ONLY read of cfg.freeholdDevGrantEnabled anywhere in src/sim (the mirror source pin)', () => {
    // The development grant permission (D81) has the exact two-site shape of
    // freeholdsEnabled above: the ctor default and the ctx getter. A third hit
    // would be a direct read bypassing the primitive (dev_grant.ts must read
    // ctx.freeholdDevGrantEnabled, never the cfg).
    const simDir = join(__dirname, '..', 'src', 'sim');
    const codeOnly = (src: string): string =>
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const files = tsFilesUnder(simDir);
    expect(files.length).toBeGreaterThan(100);
    expect(files.some((f) => f.file === 'sim.ts')).toBe(true);
    // Stated bound (the .tier scan's form): the regex sees the dotted read
    // `cfg.freeholdDevGrantEnabled` only. A destructured read
    // (`const { freeholdDevGrantEnabled } = cfg`) or a bracket read would
    // escape it; neither exists today, and whoever adds one owes this scan a
    // matching arm.
    const hits: string[] = [];
    for (const { file, full } of files) {
      const code = codeOnly(readFileSync(full, 'utf8'));
      for (const line of code.split('\n')) {
        if (/\bcfg\.freeholdDevGrantEnabled\b/.test(line)) hits.push(`${file}: ${line.trim()}`);
      }
    }
    expect(hits.sort()).toEqual([
      'sim.ts: freeholdDevGrantEnabled: cfg.freeholdDevGrantEnabled ?? false,',
      'sim.ts: return sim.cfg.freeholdDevGrantEnabled;',
    ]);
  });

  it('the two flag source pins walk src/sim through the shared walker only', () => {
    // tests/CLAUDE.md, Coverage & guards: a guard that scans a directory of
    // sources never hand-rolls its own directory read.
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['ts_files_under']);
  });

  it('reads freeholdDevGrantEnabled through to the host (the freeholdsEnabled shape)', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    expect(ctx.freeholdDevGrantEnabled).toBe(false);
    (host as { freeholdDevGrantEnabled: boolean }).freeholdDevGrantEnabled = true;
    expect(ctx.freeholdDevGrantEnabled).toBe(true);
  });

  it('passes every callback through to the host by identity (no rewrapping)', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    const ctxRec = ctx as unknown as Record<string, unknown>;
    const hostRec = host as unknown as Record<string, unknown>;
    for (const key of CALLBACK_KEYS) {
      expect(typeof ctxRec[key]).toBe('function');
      expect(ctxRec[key]).toBe(hostRec[key]);
    }
  });

  it('forwards call arguments and return values to the host', () => {
    const { host } = makeFakeHost();
    const ctx = createSimContext(host);
    const ev = { type: 'loot', text: 'seam-test' } as SimEvent;
    ctx.emit(ev);
    expect(host.emit).toHaveBeenCalledWith(ev);

    const src = { id: 1 } as Entity;
    const tgt = { id: 2 } as Entity;
    ctx.dealDamage(src, tgt, 9, true, 'fire', 'fireball', 'hit');
    expect(host.dealDamage).toHaveBeenCalledWith(src, tgt, 9, true, 'fire', 'fireball', 'hit');

    (host.petOf as ReturnType<typeof vi.fn>).mockReturnValueOnce(tgt);
    expect(ctx.petOf(42)).toBe(tgt);
    expect(host.petOf).toHaveBeenCalledWith(42);
  });

  it('constructs and reads without drawing rng (determinism-safe)', () => {
    const { host } = makeFakeHost();
    let draws = 0;
    host.rng.setObserver(() => {
      draws++;
    });
    const ctx = createSimContext(host);
    // Touch every primitive view; none may draw.
    void ctx.rng;
    void ctx.time;
    void ctx.tickCount;
    void ctx.entities;
    host.rng.setObserver(null);
    expect(draws).toBe(0);
  });
});

describe('Sim.ctx (real seam delegation)', () => {
  const makeSim = (seed = 42) => new Sim({ seed, playerClass: 'warrior', autoEquip: true });

  it('exposes the live shared rng/entities/time/tickCount', () => {
    const sim = makeSim();
    expect(sim.ctx.rng).toBe(sim.rng);
    expect(sim.ctx.entities).toBe(sim.entities);
    expect(sim.ctx.time).toBe(sim.time);
    expect(sim.ctx.tickCount).toBe(sim.tickCount);
    sim.tick();
    expect(sim.ctx.tickCount).toBe(1);
    expect(sim.ctx.tickCount).toBe(sim.tickCount);
    expect(sim.ctx.time).toBe(sim.time);
  });

  it('exposes freeholds as the Sim-owned live map and freeholdsEnabled as the ctor opt-in', () => {
    const sim = makeSim();
    expect(sim.ctx.freeholds).toBe(sim.freeholds); // one map: the multi-Sim isolation contract
    expect(sim.ctx.freeholds.size).toBe(0);
    sim.freeholds.set('acct:1', defaultFreeholdState('acct:1', asFreeholdPlotId('plot-1')));
    expect(sim.ctx.freeholds.get('acct:1')?.tier).toBe('inn_room');
    expect(sim.ctx.freeholdsEnabled).toBe(false); // D85: off unless the host opts in
    const live = new Sim({
      seed: 42,
      playerClass: 'warrior',
      autoEquip: true,
      freeholdsEnabled: true,
    });
    expect(live.ctx.freeholdsEnabled).toBe(true);
    expect(live.freeholds).not.toBe(sim.freeholds);
    // A lit host seeds the primary player's default Inn Room record at
    // addPlayer under the offline entity key (freehold/state.ts
    // seedFreeholdOnJoin); the dark sim above stayed empty.
    expect([...live.freeholds.keys()]).toEqual([`entity:${live.primaryId}`]);
    expect(live.freeholds.get(`entity:${live.primaryId}`)?.tier).toBe('inn_room');
  });

  it('exposes freeholdDevGrantEnabled as the ctor opt-in, off by default', () => {
    const sim = makeSim();
    expect(sim.ctx.freeholdDevGrantEnabled).toBe(false);
    const granting = new Sim({
      seed: 42,
      playerClass: 'warrior',
      autoEquip: true,
      freeholdDevGrantEnabled: true,
    });
    expect(granting.ctx.freeholdDevGrantEnabled).toBe(true);
    // The two flags are independent: the grant permission never lights housing.
    expect(granting.ctx.freeholdsEnabled).toBe(false);
  });

  it('emit delegates to the Sim event queue', () => {
    const sim = makeSim();
    sim.drainEvents(); // clear any startup events
    const ev = { type: 'loot', text: 'seam-emit' } as SimEvent;
    sim.ctx.emit(ev);
    expect(sim.drainEvents()).toContain(ev);
  });

  it('read-only callbacks (partyOf/petOf) delegate to Sim', () => {
    const sim = makeSim();
    const pid = sim.primaryId;
    expect(sim.ctx.partyOf(pid)).toBe(sim.partyOf(pid));
    expect(sim.ctx.petOf(pid)).toBe(sim.petOf(pid));
  });

  it('a mutating callback (dealDamage) delegates identically to Sim.dealDamage', () => {
    const viaCtx = makeSim(7);
    const viaDirect = makeSim(7);
    const pa = viaCtx.entities.get(viaCtx.primaryId) as Entity;
    const pb = viaDirect.entities.get(viaDirect.primaryId) as Entity;
    const hp0 = pa.hp;
    expect(pb.hp).toBe(hp0); // same seed => identical start

    viaCtx.ctx.dealDamage(null, pa, 5, false, 'physical', null, 'hit');
    viaDirect.dealDamage(null, pb, 5, false, 'physical', null, 'hit');

    expect(pa.hp).toBe(pb.hp); // delegation is identical to calling Sim directly
    expect(pa.hp).toBeLessThan(hp0); // and it actually applied damage (non-vacuous)
  });

  it('does not perturb determinism (same seed -> same world through the seam)', () => {
    const run = () => {
      const sim = makeSim(7);
      for (let i = 0; i < 40; i++) sim.tick();
      const p = sim.entities.get(sim.primaryId) as Entity;
      return { time: sim.ctx.time, tick: sim.ctx.tickCount, hp: p.hp, pos: { ...p.pos } };
    };
    expect(run()).toEqual(run());
  });
});
