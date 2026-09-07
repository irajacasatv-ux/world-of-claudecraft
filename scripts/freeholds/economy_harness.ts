// Isolated command timing and admitted-yield measurement, never runtime logic.
import { updateCasting } from '../../src/sim/combat/casting_lifecycle';
import { FARM_WITHERED_HUSK_ITEM_ID } from '../../src/sim/content/farm_crops';
import { drainGatheringGrants } from '../../src/sim/professions/gathering';
import { Sim } from '../../src/sim/sim';
import { DT, type SimEvent } from '../../src/sim/types';
import { REFERENCE_FARMER } from '../../tests/helpers/farming_calendar_model';

export const SEED = 20260907;
export const DAYS = 7;
export const START_MS = Date.parse('2026-09-08T00:00:00.000Z');
export const VISITS = DAYS * REFERENCE_FARMER.visitsPerDay;
export const VISIT_MS = 86_400_000 / REFERENCE_FARMER.visitsPerDay;

export function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing source: ${label}`);
  return value;
}

export function harness(
  fixtureId: string,
  family: string,
  materialTier: number,
  measuredIds: string[],
) {
  let wallMs = START_MS;
  const sim = new Sim({
    seed: SEED,
    playerClass: 'warrior',
    autoEquip: false,
    lockoutNowMs: () => wallMs,
  });
  const meta = required(sim.players.get(sim.playerId), 'replay player');
  const trace: unknown[] = [];
  const eligibleUnits: Record<string, number> = {};
  const excludedUnits: Array<{ itemId: string; units: number; reason: string }> = [];
  let activeTicks = 0;
  let setupTicks = 0;
  let attempts = 0;
  let failures = 0;
  let completedWithoutEligibleOutput = 0;
  const stand = (x: number, z: number) => {
    sim.player.pos = sim.groundPos(x, z);
    sim.player.prevPos = { ...sim.player.pos };
  };
  const tick = () => {
    sim.tickCount++;
    sim.time += DT;
    wallMs += DT * 1000;
    if (wallMs < START_MS) setupTicks++;
    else activeTicks++;
    updateCasting(sim.ctx, sim.player, meta);
    drainGatheringGrants(meta);
  };
  const finish = () => {
    let ticks = 0;
    while (sim.player.castingAbility && ticks++ < 1_000) tick();
    if (sim.player.castingAbility) throw new Error(`${fixtureId}: cast exceeded bounded lifecycle`);
  };
  const visit = (index: number) => {
    wallMs = START_MS + index * VISIT_MS;
    sim.time = (wallMs - START_MS) / 1_000;
    sim.tickCount = Math.round(sim.time / DT);
    sim.resetDay = new Date(wallMs).toISOString().slice(0, 10);
  };
  const grant = (itemId: string, units: number, reason?: string) => {
    if (reason || !measuredIds.includes(itemId)) {
      excludedUnits.push({
        itemId,
        units,
        reason: reason ?? 'outside selected material identities',
      });
    } else eligibleUnits[itemId] = (eligibleUnits[itemId] ?? 0) + units;
  };
  const observe = (command: string, action: () => void) => {
    const from = sim.events.length;
    const before = activeTicks;
    const setupBefore = setupTicks;
    const start = wallMs;
    const proficiency = { ...meta.gatheringProficiency };
    action();
    finish();
    drainGatheringGrants(meta);
    const events = sim.events.slice(from);
    const relevant = events.filter((e) =>
      [
        'gatherResult',
        'gatherDenied',
        'harvestResult',
        'farmHarvested',
        'farmWithered',
        'farmDenied',
        'fishingResult',
        'fishingEmptyHook',
        'error',
      ].includes(e.type),
    );
    trace.push({
      command,
      injectedUtcMs: start,
      resetDay: sim.resetDay,
      proficiency,
      activeTicks: activeTicks - before,
      setupTicks: setupTicks - setupBefore,
      events: relevant,
    });
    return events;
  };
  const account = (events: SimEvent[]) => {
    attempts++;
    let result = false;
    let admitted = false;
    for (const e of events) {
      if (e.type === 'gatherResult') {
        admitted = true;
        const excluded = e.rareEvent
          ? 'node windfall'
          : ['rare', 'epic', 'legendary'].includes(e.rarity)
            ? 'signed node material'
            : undefined;
        grant(e.itemId, e.qty, excluded);
        result ||= !excluded && measuredIds.includes(e.itemId);
      } else if (e.type === 'harvestResult') {
        admitted = true;
        for (const y of e.yields) {
          grant(y.itemId, y.qty, y.kind === 'plain' ? undefined : y.kind);
          result ||= y.kind === 'plain' && measuredIds.includes(y.itemId);
        }
      } else if (e.type === 'farmHarvested') {
        admitted = true;
        const reason = e.goldenBonusItemId ? 'golden windfall' : undefined;
        grant(e.itemId, e.count, reason);
        if (e.fineItemId && e.fineCount) grant(e.fineItemId, e.fineCount, reason);
        if (e.goldenBonusItemId) grant(e.goldenBonusItemId, 1, 'golden bonus');
        result ||= !reason;
      } else if (e.type === 'farmWithered') {
        admitted = true;
        grant(FARM_WITHERED_HUSK_ITEM_ID, e.count, 'withered crop consolation');
      } else if (e.type === 'fishingResult') {
        admitted = true;
        grant(e.itemId, 1);
        result ||= measuredIds.includes(e.itemId);
      } else if (e.type === 'fishingEmptyHook') admitted = true;
    }
    if (!admitted) failures++;
    else if (!result) completedWithoutEligibleOutput++;
  };
  return {
    sim,
    meta,
    stand,
    visit,
    observe,
    account,
    tick,
    result: () => ({
      fixtureId,
      seed: SEED,
      family,
      materialTier,
      measuredIds,
      attempts,
      failures,
      completedWithoutEligibleOutput,
      eligibleUnits,
      excludedUnits,
      activeCastSeconds: activeTicks * DT,
      setupCastSeconds: setupTicks * DT,
      elapsedInjectedSeconds: (wallMs - START_MS) / 1_000,
      travelSeconds: null,
      combatSeconds: null,
      cancelledAttempts: 0,
      custody: 'Real starter bags retained throughout; no vault or batch inventory clearing',
      trace,
    }),
  };
}
