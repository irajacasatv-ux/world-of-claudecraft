// Training command boundary: availability precedes the shared validator and fee.
import { recipeById } from '../content/recipes';
import { refusedWhileDead } from '../dead_gate';
import { isFreeholdCraftAvailable } from '../freehold';
import type { SimContext } from '../sim_context';
import { acquireRecipe } from './crafting';
import { resolveTrain, type TrainResult } from './training';

export function trainRecipe(ctx: SimContext, recipeId: string, pid?: number): void {
  if (refusedWhileDead(ctx, pid)) return;
  const r = ctx.resolve(pid);
  if (!r) return;
  const recipe = recipeById(recipeId);
  const available = !recipe || isFreeholdCraftAvailable(ctx.freeholdsEnabled, recipe.resultItemId);
  const result: TrainResult = available
    ? resolveTrain(ctx.stationPlacements, r.meta, r.e.pos, recipeId)
    : { ok: false, recipeId, reason: 'train_not_taught_here', fee: 0 };
  if (result.ok) {
    r.meta.copper -= result.fee;
    acquireRecipe(ctx, r.meta.entityId, recipeId, 'trainer');
  }
  r.meta.lastTrainResult = result;
  ctx.emit({
    type: 'trainResult',
    ok: result.ok,
    recipeId: result.recipeId,
    reason: result.reason,
    pid: r.meta.entityId,
  });
}
