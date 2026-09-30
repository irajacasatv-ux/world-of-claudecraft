// Groveheart's engine read at the cast: what the three level-20 druid capstones
// (src/sim/content/choice_rows_classic.ts, the druid level-20 row) act on inside the
// healer probe (runOwnedHealerProbe in scripts/owned_class_balance_probe.ts), recorded
// around the rotation's own instant casts. The probe's hps cannot tell the capstones
// apart (tests/owned_class_balance_groveheart.test.ts says why), so the suite reads the
// mechanics here instead:
//  - Quickening restores mana per Verdance stage banked (rewardQuickening in
//    src/sim/combat/druid_engines.ts): each instant Wildbloom records the mana and the
//    bank on both sides of the cast, and the cast's cost. Second Bloom banks when its
//    cast completes inside a tick, where regen and Lifesap land too, so it is not
//    recorded.
//  - Wild Apex scales the Overbloom heal and Nature's Echo seeds the bank after it
//    (resolveDruidOverbloom): each Overbloom records the healing every owned
//    heal-over-time effect had left per ally, the heal it asked for per ally, and the
//    bank right after.
// Observation only: it reads state and draws no rng, so a traced probe reads exactly
// what an untraced one does.
import type { Aura, Entity } from '../src/sim/types';

export interface GroveheartSowing {
  manaBefore: number;
  cost: number;
  manaAfter: number;
  verdanceBefore: number;
  verdanceAfter: number;
}

export interface GroveheartOverbloom {
  /** Ally id to the healing its owned heal-over-time effects had left at the cast. */
  harvestLeft: Record<number, number>;
  /** Ally id to the amount the Overbloom heal asked for (before overheal). */
  healRequested: Record<number, number>;
  verdanceAfter: number;
}

export interface GroveheartEngineTrace {
  sowings: GroveheartSowing[];
  overblooms: GroveheartOverbloom[];
}

const WILDBLOOM_ID = 'rejuvenation';
const OVERBLOOM_ID = 'overbloom';

export function verdanceStacks(healer: Entity): number {
  return (
    healer.auras.find((aura) => aura.id === 'verdance' && aura.sourceId === healer.id)?.stacks ?? 0
  );
}

/** The healing a heal-over-time effect has left: its tick value times the ticks still to
 *  land inside its remaining duration (the Overbloom tooltip's "remaining healing"). */
export function hotHealingLeft(aura: Aura): number {
  const interval = aura.tickInterval ?? 1;
  const untilNextTick = aura.tickTimer ?? interval;
  const ticks =
    untilNextTick <= aura.remaining
      ? 1 + Math.max(0, Math.floor((aura.remaining - untilNextTick) / interval))
      : 0;
  return aura.value * ticks;
}

interface OpenCast {
  defId: string;
  manaBefore: number;
  cost: number;
  verdanceBefore: number;
  overbloom?: GroveheartOverbloom;
}

export class GroveheartEngineRecorder {
  readonly trace: GroveheartEngineTrace = { sowings: [], overblooms: [] };
  private open: OpenCast | null = null;

  constructor(private readonly healer: Entity) {}

  /** Before the rotation presses `defId` (the resolved ability id) at `cost`. */
  beforeCast(defId: string, cost: number, entities: Iterable<Entity>): void {
    this.open = null;
    if (defId !== WILDBLOOM_ID && defId !== OVERBLOOM_ID) return;
    const open: OpenCast = {
      defId,
      manaBefore: this.healer.resource,
      cost,
      verdanceBefore: verdanceStacks(this.healer),
    };
    if (defId === OVERBLOOM_ID) {
      const harvestLeft: Record<number, number> = {};
      for (const entity of entities) {
        if (entity.dead) continue;
        let left = 0;
        for (const aura of entity.auras) {
          if (aura.kind === 'hot' && aura.sourceId === this.healer.id) left += hotHealingLeft(aura);
        }
        if (left > 0) harvestLeft[entity.id] = left;
      }
      open.overbloom = { harvestLeft, healRequested: {}, verdanceAfter: 0 };
    }
    this.open = open;
  }

  /** Every heal the probe sees asked for; only an open Overbloom's own heals count. */
  onHeal(targetId: number, amount: number, abilityId: string | null | undefined): void {
    const overbloom = this.open?.overbloom;
    if (!overbloom || abilityId !== OVERBLOOM_ID) return;
    overbloom.healRequested[targetId] = (overbloom.healRequested[targetId] ?? 0) + amount;
  }

  /** After the press; `landed` is false when the cast never started. */
  afterCast(landed: boolean): void {
    const open = this.open;
    this.open = null;
    if (!open || !landed) return;
    const verdanceAfter = verdanceStacks(this.healer);
    if (open.overbloom) {
      open.overbloom.verdanceAfter = verdanceAfter;
      this.trace.overblooms.push(open.overbloom);
      return;
    }
    this.trace.sowings.push({
      manaBefore: open.manaBefore,
      cost: open.cost,
      manaAfter: this.healer.resource,
      verdanceBefore: open.verdanceBefore,
      verdanceAfter,
    });
  }
}
