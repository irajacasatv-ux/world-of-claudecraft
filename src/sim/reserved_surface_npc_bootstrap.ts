import {
  CRUCIBLE_VENDOR_ENTITY_ID,
  CRUCIBLE_VENDOR_ENTRANCE_POS,
  CRUCIBLE_VENDOR_NPC_ID,
} from './content/ignivar_loot';
import { FURY_ENTITY_ID, FURY_NPC_ID } from './content/pvp_honor';
import { deckFloorHeight } from './deck_floor';
import { createNpc } from './entity';
// By path, not through the pvp barrel: see pvp/index.ts's cycle constraint.
import {
  spawnWarfareQuartermaster,
  WARFARE_QUARTERMASTER_NPC_ID,
} from './pvp/warfare_quartermaster';
import type { SimContext } from './sim_context';
import type { NpcDef } from './types';
import { waterLevel } from './world';

/** Post-roster NPCs retain their reserved ids, spawn order and placement rules. */
export function bootstrapReservedSurfaceNpcs(
  ctx: SimContext,
  definitions: Readonly<Record<string, NpcDef>>,
  findSafePos: (x: number, z: number, minHeight: number) => { x: number; z: number },
): void {
  // FURY uses a reserved id and spawns after the rng-driven world roster, so
  // the Honor Quartermaster cannot perturb existing entity ids or replay RNG.
  {
    const furyDef = definitions[FURY_NPC_ID];
    if (furyDef && !ctx.entities.has(FURY_ENTITY_ID)) {
      const safe = findSafePos(furyDef.pos.x, furyDef.pos.z, waterLevel() + 0.6);
      const fury = createNpc(FURY_ENTITY_ID, furyDef, ctx.groundPos(safe.x, safe.z));
      ctx.addEntity(fury);
    }
  }

  // Warmarshal Draven Kole in Highwatch: the same reserved-id, rng-free
  // treatment as Bram and FURY above. See src/sim/pvp/warfare_quartermaster.ts.
  {
    const kole = definitions[WARFARE_QUARTERMASTER_NPC_ID];
    if (kole) {
      const safe = findSafePos(kole.pos.x, kole.pos.z, waterLevel() + 0.6);
      spawnWarfareQuartermaster(ctx, kole, safe);
    }
  }

  // Quartermaster Bronn Emberward on the keep's landing court: spawn after
  // world generation under a reserved id so replay entity ids remain stable.
  // Placed EXACTLY where authored, feet on the court's floor plate: findSafePos
  // reads that plate as a wall and would spiral him onto the summit flat inside
  // the door's walk-in trigger (tests/crucible_vendor_reach.test.ts pins it).
  {
    const bronn = definitions[CRUCIBLE_VENDOR_NPC_ID];
    if (bronn && !ctx.entities.has(CRUCIBLE_VENDOR_ENTITY_ID)) {
      const { x, z } = CRUCIBLE_VENDOR_ENTRANCE_POS;
      const at = { x, y: deckFloorHeight(ctx.cfg.seed, x, z), z };
      ctx.addEntity(createNpc(CRUCIBLE_VENDOR_ENTITY_ID, bronn, at));
    }
  }
}
