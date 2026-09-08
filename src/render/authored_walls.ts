import { DUNGEON_WALL_HEIGHT, type DungeonLayout } from '../sim/dungeon_layout';
import { authoredWallSegments, type WallSeg } from '../sim/rift/authored';
import { fitAuthoredWallSegment } from './authored_walls_core';
import type { DungeonInteriorVariant } from './dungeon';
import { Placements } from './dungeon_arena_walls';
import { usesDawnholdGrammar } from './dungeon_variant_core';
import type { WallCullPlane } from './wall_backface_cull_core';

export interface AuthoredWallFace {
  placements: Placements;
  segment: WallSeg;
  plane: WallCullPlane;
}

// Authored walls: one run of ~8u modules along every wall segment the sim's
// `authoredWallSegments` produced (doorway gaps already subtracted), each turned
// to face into the room it borders. The fitted wall ends frame each opening on
// their own: placing a nominal "arched wall" in the gap visually sealed doors
// even though the shared sim collider correctly left them open.
/** Shared authored wall courses; optionally retain full faces for camera cutaways. */
export function placeAuthoredWalls(
  p: Placements,
  layout: DungeonLayout,
  variant: DungeonInteriorVariant,
  options: {
    wallKind: (variant: DungeonInteriorVariant, t: number) => string;
    hash: (x: number, z: number) => number;
    moduleScale: number;
  },
  splitFaces = false,
): AuthoredWallFace[] {
  const rooms = layout.rooms ?? [];
  const doors = layout.doors ?? [];
  const bannerEvery = variant === 'crypt' ? 4 : 3;
  // Both walk-in castles suppress the kit's crypt hangings (their dressing
  // passes hang the kcas banners) and stack a second wall storey below.
  const isKeep = variant === 'lastkeep' || usesDawnholdGrammar(variant);
  const openAt = (x: number, z: number): boolean =>
    rooms.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
  // Highest lift among the rooms a wall segment borders: says which story the
  // wall belongs to (the keep's undercroft keeps cracked crypt stone, and the
  // lookout's parapet row is shortened so it stays an OPEN rooftop).
  const segMaxLift = (seg: WallSeg): number => {
    let best = 0;
    for (const r of rooms) {
      const touches =
        seg.axis === 'x'
          ? (r.z0 === seg.fixed || r.z1 === seg.fixed) && r.x1 > seg.a && r.x0 < seg.b
          : (r.x0 === seg.fixed || r.x1 === seg.fixed) && r.z1 > seg.a && r.z0 < seg.b;
      if (touches) best = Math.max(best, r.lift ?? 0);
    }
    return best;
  };
  const segRy = (seg: WallSeg): number => {
    const mid = (seg.a + seg.b) / 2;
    if (seg.axis === 'x') return openAt(mid, seg.fixed + 1.5) ? 0 : Math.PI;
    return openAt(seg.fixed + 1.5, mid) ? Math.PI / 2 : -Math.PI / 2;
  };
  const faces = new Map<string, AuthoredWallFace>();
  const target = (seg: WallSeg): Placements => {
    if (!splitFaces) return p;
    const key = `${seg.axis}:${seg.fixed}:${seg.a}:${seg.b}`;
    let face = faces.get(key);
    if (!face) {
      const mid = (seg.a + seg.b) / 2;
      const x = seg.axis === 'x' ? mid : seg.fixed;
      const z = seg.axis === 'x' ? seg.fixed : mid;
      const ry = segRy(seg);
      face = {
        placements: new Placements(),
        segment: seg,
        plane: { x, z, nx: -Math.sin(ry), nz: -Math.cos(ry) },
      };
      faces.set(key, face);
    }
    return face.placements;
  };
  let i = 0;
  for (const seg of authoredWallSegments(rooms, doors)) {
    const cells = fitAuthoredWallSegment(seg.a, seg.b, 8);
    // Face the wall detail into an adjacent room (either one, when it is shared).
    const ry = segRy(seg);
    // Only the Last Keep has a dungeon-flavored undercroft to re-key to the
    // crypt mix; Dawnhold's ground floor stays warm palace stone.
    const segVariant: DungeonInteriorVariant =
      variant === 'lastkeep' && segMaxLift(seg) < 1.6 ? 'crypt' : variant;
    for (const cell of cells) {
      const t = cell.center;
      const x = seg.axis === 'x' ? t : seg.fixed;
      const z = seg.axis === 'x' ? seg.fixed : t;
      const kind = options.wallKind(segVariant, options.hash(x * 13.7, z));
      const scale: [number, number, number] = [
        cell.length / 4,
        options.moduleScale,
        options.moduleScale,
      ];
      target(seg).add(kind, x, 0, z, ry, scale);
      // The keep hangs its red kcas banners from the lastkeep dressing pass
      // instead of the kit's crypt hangings.
      if (!isKeep && i % bannerEvery === 2 && kind !== 'wall_archedwindow_gated') {
        const banner = options.hash(z, x * 7.3) < 0.5 ? 'banner_red' : 'banner_triple_red';
        target(seg).add(banner, x, 0, z, ry, scale);
      }
      i++;
    }
  }
  if (!isKeep) return [...faces.values()];
  // ---- The walk-in castles' SECOND wall storey ----
  // One 8u module row is only wall-top 8, which the keep's residence floor
  // (lift 6) and tower would poke straight through. Stack a second row at
  // y=8 so the state floor soars (13u of wall over its 3.0 floor) and the
  // residence keeps 10u; Dawnhold's solar story (lift 3.0) gets the same
  // tall, airy read. The row is cut by the SAME door openings as the base row:
  // capping a low doorway looks like a lintel but puts the chase camera
  // inside the solid cap whenever it trails the player through a door (the
  // cap carries no collider, so the boom happily enters it and the frame
  // blacks out). Tall open archways cost that lintel read but keep every
  // doorway camera-safe. Segments bordering the lookout (lift 9) shorten to
  // a parapet so the tower top stays an open rooftop.
  for (const seg of authoredWallSegments(rooms, doors)) {
    const maxLift = segMaxLift(seg);
    const ry = segRy(seg);
    const upperVariant: DungeonInteriorVariant =
      variant === 'lastkeep' && maxLift < 1.6 ? 'crypt' : variant;
    const sy = maxLift >= 8 ? 0.75 : options.moduleScale; // lookout parapet: 3u, not 8u
    for (const cell of fitAuthoredWallSegment(seg.a, seg.b, 8)) {
      const t = cell.center;
      const x = seg.axis === 'x' ? t : seg.fixed;
      const z = seg.axis === 'x' ? seg.fixed : t;
      let kind = options.wallKind(upperVariant, options.hash(x * 7.1, z * 3.3));
      if (kind === 'wall_arched') kind = 'wall'; // no archways floating at mid-wall
      target(seg).add(kind, x, DUNGEON_WALL_HEIGHT, z, ry, [
        cell.length / 4,
        sy,
        options.moduleScale,
      ]);
    }
  }

  return [...faces.values()];
}
