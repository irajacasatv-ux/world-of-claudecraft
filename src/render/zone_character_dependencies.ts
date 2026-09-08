import { MOBS, NPCS } from '../sim/data';
import type { ZoneDef } from '../sim/types';
import { modularKeyFor, modularLookFor } from './characters';
import { prepareCharacterUrl } from './characters/assets';
import { VISUALS, visualAssetUrlForGraphics, visualKeyFor } from './characters/manifest';
import { GFX } from './gfx';
import type { ZonePrewarmGroupHost } from './zone_prewarm_groups';

/** Resident GLBs precede synchronous rig construction inside the existing prewarm entries. */
export async function prepareZoneCharacterDependencies(host: object, zone: ZoneDef): Promise<void> {
  const h = host as ZonePrewarmGroupHost;
  const urls = new Set<string>();
  for (const kind of ['mob', 'npc'] as const) {
    for (const id of h.templateIdsInZone(zone, kind)) {
      const template = kind === 'mob' ? MOBS[id] : NPCS[id];
      if (!template) continue;
      const entity = h.prewarmEntity(kind, id, template.color, 1);
      const key = modularLookFor(entity) ? modularKeyFor(entity) : visualKeyFor(entity);
      const def = VISUALS[key];
      if (!def) continue;
      for (const url of [def.url, ...(def.animUrls ?? []), ...(def.attach ?? []).map((a) => a.url)])
        urls.add(visualAssetUrlForGraphics(url, GFX.standardMaterials));
    }
  }
  await Promise.all([...urls].map(prepareCharacterUrl));
}
