// The zone-map marker interaction (src/ui/hud/map/map_marker_interaction_controller.ts)
// over the marker rig in tests/helpers/map_marker_rig.ts: hover, touch and
// click hit-testing, layer priority, the scratch buffers and the cached canvas
// geometry. No Hud here: the three cases that need the real coordinator (the
// map window's drag commit refreshing that geometry, and updateMapWindow's
// marker lifecycle) moved to tests/hud_window_coordination.test.ts, over the
// same rig on a bare Hud.prototype.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELVE_LIST, ZONES } from '../src/sim/data';
import type { QuestObjectiveRef } from '../src/sim/quest_targets';
import { MapMarkerTooltipContent } from '../src/ui/hud/map';
import type { MapNavigationMarker } from '../src/ui/map_window_view';
import type { IWorld } from '../src/world_api';
import {
  canvasFixture,
  FARM_PATCH,
  GATHER,
  installFakeDocument,
  markerHarness,
  NAVIGATION,
  NPC,
  QUEST_AREA,
  SERVICE,
  STATION,
  semanticCore,
  WORLD_BOSS,
  WORLD_QUEST,
} from './helpers/map_marker_rig';

const mapPointMarkerHitsIntoCalls = vi.hoisted(() => vi.fn());
const questAreaObjectivesAtIntoCalls = vi.hoisted(() => vi.fn());

vi.mock('../src/ui/map_window_view', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/ui/map_window_view')>();
  return {
    ...actual,
    mapPointMarkerHitsInto: (...args: Parameters<typeof actual.mapPointMarkerHitsInto>) => {
      mapPointMarkerHitsIntoCalls(...args);
      return actual.mapPointMarkerHitsInto(...args);
    },
    questAreaObjectivesAtInto: (...args: Parameters<typeof actual.questAreaObjectivesAtInto>) => {
      questAreaObjectivesAtIntoCalls(...args);
      return actual.questAreaObjectivesAtInto(...args);
    },
  };
});

beforeEach(() => {
  installFakeDocument();
  mapPointMarkerHitsIntoCalls.mockClear();
  questAreaObjectivesAtIntoCalls.mockClear();
});

afterEach(() => vi.unstubAllGlobals());

describe('Hud zone-map marker interaction', () => {
  it('selects only a clicked world-quest emblem and clears the disclosure on a miss', () => {
    const canvas = canvasFixture();
    const { hud } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapMarkerInteraction.worldQuests = [WORLD_QUEST];

    expect(hud.mapMarkerInteraction.selectedWorldQuestId).toBeNull();
    expect(hud.mapMarkerInteraction.selectWorldQuestAt(canvas, 170, 150)).toBe(true);
    expect(hud.mapMarkerInteraction.selectedWorldQuestId).toBe(WORLD_QUEST.questId);
    expect(hud.mapMarkerInteraction.selectWorldQuestAt(canvas, 10, 10)).toBe(true);
    expect(hud.mapMarkerInteraction.selectedWorldQuestId).toBeNull();
  });

  it('prioritizes the world-quest emblem for hover and touch over overlapping markers', () => {
    const canvas = canvasFixture();
    const { hud, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapMarkerInteraction.worldQuests = [WORLD_QUEST];

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(paint).toHaveBeenLastCalledWith('<div>world quest</div>', 170, 150);
    expect(mapPointMarkerHitsIntoCalls).not.toHaveBeenCalled();

    expect(hud.mapMarkerInteraction.showAt(canvas, 185, 150)).toBe(false);
    expect(hud.mapMarkerInteraction.showAt(canvas, 185, 150, true)).toBe(true);
    expect(paint).toHaveBeenLastCalledWith('<div>world quest</div>', 185, 150);
  });

  it('prioritizes a world-boss skull without selecting a world-quest area', () => {
    const canvas = canvasFixture();
    const { hud, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapMarkerInteraction.worldQuests = [WORLD_QUEST];
    hud.mapMarkerInteraction.worldBosses = [WORLD_BOSS];

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(paint).toHaveBeenLastCalledWith('<div>world boss</div>', 170, 150);
    expect(hud.mapMarkerInteraction.selectedWorldQuestId).toBeNull();
    expect(hud.mapMarkerInteraction.selectWorldQuestAt(canvas, 170, 150)).toBe(false);
    expect(hud.mapMarkerInteraction.selectedWorldQuestId).toBeNull();

    hud.mapMarkerInteraction.selectedWorldQuestId = WORLD_QUEST.questId;
    expect(hud.mapMarkerInteraction.selectWorldQuestAt(canvas, 170, 150, true)).toBe(true);
    expect(hud.mapMarkerInteraction.selectedWorldQuestId).toBeNull();
  });

  it('converts client coordinates to backing pixels and passes each marker array in draw order', () => {
    const canvas = canvasFixture();
    const { hud, paint, calls } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);

    expect(mapPointMarkerHitsIntoCalls).toHaveBeenCalledWith(
      [NPC],
      [],
      [SERVICE],
      [STATION],
      [GATHER],
      [FARM_PATCH],
      140,
      200,
      10,
      hud.mapPointHitsScratch,
    );
    expect(calls).toEqual(['npc', 'station', 'service', 'gather']);
    expect(paint).toHaveBeenCalledWith('<div>gather</div>', 170, 150);
  });

  it('uses backing-scaled touch radius while hover keeps the glyph radius', () => {
    const canvas = canvasFixture();
    const { hud, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapNpcMarkers = [];
    hud.mapStations = [];
    hud.mapServices = [];
    hud.mapFarmPatches = [];
    hud.mapGatherNodes = [{ ...GATHER, mx: 175 }];

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(false);
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150, true)).toBe(true);

    expect(mapPointMarkerHitsIntoCalls.mock.calls.map((call) => call[8])).toEqual([10, 40]);
    expect(paint).toHaveBeenCalledTimes(1);
  });

  it('fills the Hud-owned quest scratch only when quest areas can answer the pointer', () => {
    const canvas = canvasFixture();
    const { hud, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    const objective: QuestObjectiveRef = { questId: 'quest', objectiveIndex: 0 };
    const area = { ...QUEST_AREA, objectives: [objective] };
    const areaTip = vi.fn((_refs: QuestObjectiveRef[], activeCount?: number) =>
      activeCount === 1 ? '<div>area</div>' : '',
    );
    hud.mapNpcMarkers = [];
    hud.mapStations = [];
    hud.mapServices = [];
    hud.mapFarmPatches = [];
    hud.mapGatherNodes = [];
    hud.mapQuestAreas = [area];
    hud.questAreaTooltipHtml = areaTip;

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(questAreaObjectivesAtIntoCalls).toHaveBeenCalledWith(
      [area],
      140,
      200,
      hud.mapQuestObjectiveScratch,
    );
    expect(areaTip).toHaveBeenCalledWith(hud.mapQuestObjectiveScratch, 1);
    expect(hud.mapQuestObjectiveScratch[0]).toBe(objective);
    expect(paint).toHaveBeenCalledWith('<div>area</div>', 170, 150);

    const areaCallCount = questAreaObjectivesAtIntoCalls.mock.calls.length;
    hud.mapQuestAreas = [];
    hud.mapNpcMarkers = [{ ...NPC, mx: 500, my: 500 }];
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(false);
    expect(questAreaObjectivesAtIntoCalls).toHaveBeenCalledTimes(areaCallCount);
    expect(areaTip).toHaveBeenCalledTimes(1);
  });

  it('lets the globally nearest point marker win before category tie priority', () => {
    const canvas = canvasFixture();
    const { hud, calls } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapNpcMarkers = [{ ...NPC, mx: 148 }];
    hud.mapStations = [{ ...STATION, mx: 146 }];
    hud.mapServices = [{ ...SERVICE, mx: 144 }];
    hud.mapGatherNodes = [{ ...GATHER, mx: 142 }];
    hud.mapFarmPatches = [{ ...FARM_PATCH, mx: 150 }];
    hud.questGiverTooltipHtml = () => {
      calls.push('npc');
      return '<div>npc</div>';
    };

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(calls).toEqual(['gather']);
  });

  it('gives an exact-distance navigation painting priority over lower landmark layers', () => {
    const canvas = canvasFixture();
    const { hud, calls, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapNavigationMarkers = [NAVIGATION];
    hud.navigationMapTooltipHtml = () => {
      calls.push('navigation');
      return '<div>navigation</div>';
    };

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(calls).toEqual(['npc', 'navigation']);
    expect(paint).toHaveBeenCalledWith('<div>navigation</div>', 170, 150);
  });

  it('routes a farm-patch hit to the farm resolver and paints its html', () => {
    const canvas = canvasFixture();
    const { hud, calls, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    // Only the patch is under the pointer, so nothing above it can answer.
    hud.mapNpcMarkers = [];
    hud.mapStations = [];
    hud.mapServices = [];
    hud.mapGatherNodes = [];
    hud.farmPatchMapTooltipHtml = () => {
      calls.push('farm');
      return '<div>farm</div>';
    };

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(calls).toEqual(['farm']);
    expect(paint).toHaveBeenCalledWith('<div>farm</div>', 170, 150);
  });

  it('answers no pointer at all when the patch layer is the only empty one left', () => {
    const canvas = canvasFixture();
    const { hud, calls, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapNpcMarkers = [];
    hud.mapStations = [];
    hud.mapServices = [];
    hud.mapGatherNodes = [];
    hud.mapFarmPatches = [];

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(false);
    expect(calls).toEqual([]);
    expect(paint).not.toHaveBeenCalled();
  });

  it('uses content names for route tooltips and escapes generated Rift names', () => {
    const semantics = semanticCore();
    const content = new MapMarkerTooltipContent({} as IWorld);
    const navigationHtml = (marker: MapNavigationMarker): string =>
      content.navigation(semantics.navigationText(marker));
    expect(navigationHtml(NAVIGATION)).toContain(DELVE_LIST[0].name);
    expect(
      navigationHtml({
        kind: 'world-passage',
        mx: 0,
        my: 0,
        portalId: 'test',
        destinationZoneId: ZONES[1].id,
      }),
    ).toContain(ZONES[1].name);
    const rift = navigationHtml({
      kind: 'rift-entrance',
      mx: 0,
      my: 0,
      name: '<Rift>',
      rank: 'S',
    });
    expect(rift).toContain('&lt;Rift&gt;');
    expect(rift).not.toContain('<Rift>');
    expect(rift).toContain('(S)');
  });

  it('uses the same localized state and location copy for instance hover and touch tips', () => {
    const canvas = canvasFixture();
    const { hud, paint } = markerHarness();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    hud.mapNpcMarkers = [];
    hud.mapGatherNodes = [];
    hud.mapStations = [];
    hud.mapServices = [];
    const passage = {
      cx: 140,
      cy: 200,
      semantic: { kind: 'delve-passage', state: 'sealed' },
    } as const;
    hud.mapSemanticAccessibility.updateDelve(
      {
        mobs: [],
        rewards: [],
        navigation: [passage],
        party: [],
        player: { cx: 280, cy: 280 },
        areaLabel: 'Test Delve',
      },
      560,
    );
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(paint).toHaveBeenLastCalledWith(
      '<div class="tt-title">Sealed passage: northwest, medium distance.</div>',
      170,
      150,
    );
    hud.mapSemanticAccessibility.updateDelve(
      {
        mobs: [],
        rewards: [],
        navigation: [{ ...passage, semantic: { kind: 'delve-passage', state: 'open' } }],
        party: [],
        player: { cx: 280, cy: 280 },
        areaLabel: 'Test Delve',
      },
      560,
    );
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(paint.mock.lastCall?.[0]).toContain('Open passage');

    const reward = {
      cx: 175,
      cy: 200,
      semantic: { kind: 'delve-reward', reward: 'cache', state: 'active', bountiful: false },
    } as const;
    hud.mapSemanticAccessibility.updateDelve(
      {
        mobs: [],
        rewards: [reward],
        navigation: [],
        party: [],
        player: { cx: 280, cy: 280 },
        areaLabel: 'Test Delve',
      },
      560,
    );
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(false);
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150, true)).toBe(true);
    expect(paint).toHaveBeenLastCalledWith(
      '<div class="tt-title">Delve cache active: northwest, medium distance.</div>',
      170,
      150,
    );
  });

  it.each(['locked', 'active', 'opened'] as const)(
    'keeps the %s reward state explicit in the semantic tooltip',
    (state) => {
      const canvas = canvasFixture();
      const { hud, paint } = markerHarness();
      hud.mapMarkerInteraction.refreshGeometry(canvas);
      hud.mapNpcMarkers = [];
      hud.mapGatherNodes = [];
      hud.mapStations = [];
      hud.mapServices = [];
      hud.mapSemanticAccessibility.updateDelve(
        {
          mobs: [],
          rewards: [
            {
              cx: 140,
              cy: 200,
              semantic: { kind: 'delve-reward', reward: 'reliquary', state, bountiful: false },
            },
          ],
          navigation: [],
          party: [],
          player: { cx: 280, cy: 280 },
          areaLabel: 'Test Delve',
        },
        560,
      );
      expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
      expect(paint.mock.lastCall?.[0]).toContain(
        state === 'locked'
          ? 'Locked reliquary'
          : state === 'active'
            ? 'Reliquary rite active'
            : 'Reliquary opened',
      );
    },
  );

  it('reuses cached projection geometry until a bounded map-paint refresh', () => {
    const canvas = canvasFixture();
    let left = 100;
    let size = 280;
    const readRect = vi.fn(
      () =>
        ({
          x: left,
          y: 50,
          left,
          top: 50,
          width: size,
          height: size,
          right: left + size,
          bottom: 50 + size,
          toJSON: () => ({}),
        }) as DOMRect,
    );
    canvas.getBoundingClientRect = readRect;
    const { hud } = markerHarness();

    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(false);
    expect(readRect).not.toHaveBeenCalled();

    hud.mapMarkerInteraction.refreshGeometry(canvas);
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(hud.mapMarkerInteraction.showAt(canvas, 170, 150)).toBe(true);
    expect(readRect).toHaveBeenCalledTimes(1);

    left = 30;
    size = 140;
    expect(hud.mapMarkerInteraction.showAt(canvas, 65, 100)).toBe(false);
    expect(readRect).toHaveBeenCalledTimes(1);

    hud.mapMarkerInteraction.refreshGeometry(canvas);
    expect(hud.mapMarkerInteraction.showAt(canvas, 65, 100)).toBe(true);
    expect(readRect).toHaveBeenCalledTimes(2);
  });
});
