import type { CharacterVisual } from './characters';
import type { ZonePrewarmStats } from './zone_prepare_stats';
import type { buildEntityPrewarmGroup } from './zone_prewarm_groups';

interface ZonePrewarmFinalizerHost {
  shutdownStarted: boolean;
  lifecycleGeneration: number;
  pooledVisuals: { store(key: string, visual: CharacterVisual): void };
  lastZonePrewarmStats: ZonePrewarmStats | null;
}

/** Publish only after the warm pass; retirement instead releases the staged visual owners. */
export function finalizeZonePrewarm(
  owner: object,
  generation: number,
  groups: readonly ReturnType<typeof buildEntityPrewarmGroup>[],
  zoneId: string,
  timing: { started: number; built: number; compiled: number },
): void {
  const host = owner as ZonePrewarmFinalizerHost;
  for (const { group } of groups) group.removeFromParent();
  // Background gameplay must not take a rig while its shadow variant is cold.
  const retired = host.shutdownStarted || generation !== host.lifecycleGeneration;
  for (const { pooled } of groups)
    for (const item of pooled)
      if (retired) item.visual.dispose();
      else host.pooledVisuals.store(item.key, item.visual);
  if (!retired)
    host.lastZonePrewarmStats = {
      zoneId,
      buildMs: Math.round(timing.built - timing.started),
      compileMs: Math.round(timing.compiled - timing.built),
      passMs: Math.round(performance.now() - timing.compiled),
    };
}
