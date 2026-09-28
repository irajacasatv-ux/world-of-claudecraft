// The zone-map marker rigs, shared by the marker interaction suite
// (tests/hud_map_marker_lifecycle.test.ts, which drives the
// MapMarkerInteractionController a rig builds, with no Hud) and the
// coordinator suite (tests/hud_window_coordination.test.ts, which drives the
// real Hud.updateMapWindow, initWindowManagement and showMapTipAt over the SAME
// rig on a bare Hud.prototype). Moved here whole from the marker suite when its
// three coordinator cases left it, so the two files cannot drift apart.
//
// Deliberately free of any src/ui/hud import (that import alone costs a file
// several hundred MB): a caller that needs the real coordinator passes
// `Object.create(Hud.prototype)` in as the base object.
//
// Both rigs run over a FAKE document (installFakeDocument), stubbed with
// vi.stubGlobal: every caller unstubs it after each case.
import { vi } from 'vitest';
import { DELVE_LIST, ZONES } from '../../src/sim/data';
import type { QuestObjectiveRef } from '../../src/sim/quest_targets';
import type { StationType } from '../../src/sim/types';
import type { ContinentZoneRegion } from '../../src/ui/continent_map_view';
import type { DelveDrawModel } from '../../src/ui/hud/delve/delve_map_painter';
import { MapMarkerInteractionController } from '../../src/ui/hud/map';
import type { RiftMapModel } from '../../src/ui/hud/rift/rift_map_core';
import { MapSemanticAccessibilityCore } from '../../src/ui/map_semantic_accessibility_core';
import type {
  MapFarmPatchMarker,
  MapGatherNodeMarker,
  MapNavigationMarker,
  MapNpcMarker,
  MapPointMarkerHit,
  MapQuestAreaMarker,
  MapServiceMarker,
  MapStationMarker,
  MapViewRect,
  MapWorldBossMarker,
  MapWorldQuestMarker,
} from '../../src/ui/map_window_view';
import type { IWorld } from '../../src/world_api';

export interface MapCanvas extends HTMLCanvasElement {
  getBoundingClientRect(): DOMRect;
}

/** The fake document's elements by id (cleared by installFakeDocument). */
export const hudElements = new Map<string, HTMLElement>();

function fakeElement(tagName: string): HTMLElement {
  return {
    id: '',
    tagName: tagName.toUpperCase(),
    style: { cursor: '', display: '' },
  } as unknown as HTMLElement;
}

export function installFakeDocument(): void {
  hudElements.clear();
  vi.stubGlobal('document', {
    createElement: (tagName: string) => fakeElement(tagName),
    querySelector: (selector: string) =>
      selector.startsWith('#') ? (hudElements.get(selector.slice(1)) ?? null) : null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      append: (...elements: HTMLElement[]) => {
        for (const element of elements) if (element.id) hudElements.set(element.id, element);
      },
      replaceChildren: () => hudElements.clear(),
    },
  } as unknown as Document);
}

/** The Hud members the marker cases read, as the rig stamps them. */
export interface MarkerHarness {
  sim: IWorld;
  mapLevel: 'zone' | 'continent';
  mapHoverZone: string | null;
  mapZoom: number;
  mapCenter: { x: number; z: number } | null;
  mapPing: { x: number; z: number } | null;
  mapZoneOverride: string | null;
  mapZoneId: string;
  lastZoneId: string;
  mapDrag: unknown;
  mapView: MapViewRect | null;
  mapQuestAreas: MapQuestAreaMarker[];
  mapNpcMarkers: MapNpcMarker[];
  mapGatherNodes: MapGatherNodeMarker[];
  mapStations: MapStationMarker[];
  mapServices: MapServiceMarker[];
  mapFarmPatches: MapFarmPatchMarker[];
  mapNavigationMarkers: MapNavigationMarker[];
  mapPointHitsScratch: MapPointMarkerHit[];
  mapQuestObjectiveScratch: QuestObjectiveRef[];
  mapSemanticAccessibility: MapSemanticAccessibilityCore;
  mapMarkerInteraction: MapMarkerInteractionController;
  mapGatherTipMemo: unknown;
  continentRegions: ContinentZoneRegion[];
  questGiverTooltipHtml(marker: MapNpcMarker): string;
  stationMapTooltipHtml(marker: MapStationMarker): string;
  serviceMapTooltipHtml(marker: MapServiceMarker): string;
  farmPatchMapTooltipHtml(marker: MapFarmPatchMarker): string;
  navigationMapTooltipHtml(marker: MapNavigationMarker): string;
  gatherNodeMapTooltipHtml(marker: MapGatherNodeMarker): string;
  questAreaTooltipHtml(refs: readonly QuestObjectiveRef[], activeCount?: number): string;
  paintTooltipAt(html: string, clientX: number, clientY: number): void;
  syncAnyWindowOpenState(): void;
  setWindowPixelPosition(element: HTMLElement, left: number, top: number, rect?: DOMRect): void;
  setDisplay(element: HTMLElement, display: string): void;
  setStyleProp(element: HTMLElement, prop: string, value: string): void;
  setText(element: HTMLElement, text: string): void;
  mapZoneBg(): HTMLCanvasElement;
  mapZoneRegion(): { minX: number; maxX: number; minZ: number; maxZ: number };
  mapPainter: {
    paintOverworld(): {
      view: MapViewRect;
      questAreas: MapQuestAreaMarker[];
      npcs: MapNpcMarker[];
      gatherNodes: MapGatherNodeMarker[];
      stations: MapStationMarker[];
      services: MapServiceMarker[];
      farmPatches: MapFarmPatchMarker[];
      navigation: MapNavigationMarker[];
      cursor: 'default' | 'grab';
    };
  };
  bgMapPainter: { paint(): void };
  delvePainter: { paintWorldMapDelve(): DelveDrawModel | null };
  riftPainter: { paintWorldMap(): RiftMapModel | null };
  interiorMaps: {
    paintWorldMap(): { title: string; model: null } | null;
  };
  continentPainter: {
    paintContinent(): { regions: ContinentZoneRegion[] };
  };
}

export function semanticCore(): MapSemanticAccessibilityCore {
  return new MapSemanticAccessibilityCore({
    zone: (id) => ZONES.find((zone) => zone.id === id)?.name ?? id,
    dungeon: (id) => id,
    delve: (id) => DELVE_LIST.find((delve) => delve.id === id)?.name ?? id,
    station: (type) => type,
    poi: (zoneId, index) => `${zoneId}/${index}`,
    rift: (name, rank) => `${name}${rank ? ` (${rank})` : ''}`,
    npc: (id) => id,
    mob: (id) => id,
    worldQuest: (id) => id,
  });
}

function wireTooltipResolvers(hud: MarkerHarness): void {
  const controller = new MapMarkerInteractionController({
    names: {
      zone: (id) => ZONES.find((zone) => zone.id === id)?.name ?? id,
      dungeon: (id) => id,
      delve: (id) => DELVE_LIST.find((delve) => delve.id === id)?.name ?? id,
      station: (type) => type,
      poi: (zoneId, index) => `${zoneId}/${index}`,
      rift: (name, rank) => `${name}${rank ? ` (${rank})` : ''}`,
      npc: (id) => id,
      mob: (id) => id,
      worldQuest: (id) => id,
    },
    npc: (marker) => hud.questGiverTooltipHtml(marker),
    navigation: (marker) => hud.navigationMapTooltipHtml(marker),
    station: (marker) => hud.stationMapTooltipHtml(marker),
    service: (marker) => hud.serviceMapTooltipHtml(marker),
    gather: (marker) => hud.gatherNodeMapTooltipHtml(marker),
    farm: (marker) => hud.farmPatchMapTooltipHtml(marker),
    worldQuest: () => '<div>world quest</div>',
    worldBoss: () => '<div>world boss</div>',
    questArea: (refs, count) => hud.questAreaTooltipHtml(refs, count),
    paint: (html, x, y) => hud.paintTooltipAt(html, x, y),
    clearMemo: () => {
      hud.mapGatherTipMemo = null;
    },
  });
  controller.questAreas = hud.mapQuestAreas;
  controller.npcs = hud.mapNpcMarkers;
  controller.gatherNodes = hud.mapGatherNodes;
  controller.stations = hud.mapStations;
  controller.services = hud.mapServices;
  controller.farmPatches = hud.mapFarmPatches;
  controller.navigation = hud.mapNavigationMarkers;
  hud.mapMarkerInteraction = controller;
  const proxy = <K extends keyof MapMarkerInteractionController>(
    legacy: keyof MarkerHarness,
    key: K,
  ): void => {
    Object.defineProperty(hud, legacy, {
      configurable: true,
      get: () => controller[key],
      set: (value) => {
        controller[key] = value;
      },
    });
  };
  proxy('mapQuestAreas', 'questAreas');
  proxy('mapNpcMarkers', 'npcs');
  proxy('mapGatherNodes', 'gatherNodes');
  proxy('mapStations', 'stations');
  proxy('mapServices', 'services');
  proxy('mapFarmPatches', 'farmPatches');
  proxy('mapNavigationMarkers', 'navigation');
  Object.defineProperty(hud, 'mapPointHitsScratch', {
    configurable: true,
    get: () => controller.pointHits,
  });
  Object.defineProperty(hud, 'mapQuestObjectiveScratch', {
    configurable: true,
    get: () => controller.questObjectives,
  });
  Object.defineProperty(hud, 'mapSemanticAccessibility', {
    configurable: true,
    get: () => controller.semantics,
  });
}

export const NPC: MapNpcMarker = {
  mx: 140,
  my: 200,
  kind: 'available',
  quests: [],
};
export const STATION: MapStationMarker = {
  mx: 140,
  my: 200,
  stationId: 'station',
  type: 'forge' as StationType,
};
export const SERVICE: MapServiceMarker = { mx: 140, my: 200, kind: 'mailbox' };
export const FARM_PATCH: MapFarmPatchMarker = {
  mx: 140,
  my: 200,
  patchId: 'patch_eastbrook',
  zoneId: 'eastbrook_vale',
};
export const NAVIGATION: MapNavigationMarker = {
  mx: 140,
  my: 200,
  kind: 'delve-entrance',
  delveId: DELVE_LIST[0].id,
};
export const GATHER: MapGatherNodeMarker = {
  mx: 140,
  my: 200,
  nodeId: 'node',
  type: 'ore',
  ready: true,
  locked: false,
};
export const QUEST_AREA: MapQuestAreaMarker = {
  mx: 140,
  my: 200,
  radius: 8,
  objectives: [],
  numbers: [],
};
export const WORLD_QUEST: MapWorldQuestMarker = {
  questId: 'wq_eastbrook_bandits',
  mx: 140,
  my: 200,
  radius: 20,
  state: 'available',
};
export const WORLD_BOSS: MapWorldBossMarker = {
  bossId: 'thunzharr_waking_peak',
  mx: 140,
  my: 200,
};
export const VIEW: MapViewRect = {
  spanX: 300,
  spanZ: 300,
  minX: -150,
  maxX: 150,
  minZ: -150,
  maxZ: 150,
};

export function canvasFixture(): MapCanvas {
  const canvas = document.createElement('canvas') as MapCanvas;
  canvas.id = 'map-canvas';
  canvas.width = 560;
  canvas.height = 560;
  Object.defineProperty(canvas, 'getContext', {
    value: vi.fn(() => ({}) as CanvasRenderingContext2D),
  });
  canvas.getBoundingClientRect = () =>
    ({
      x: 100,
      y: 50,
      left: 100,
      top: 50,
      width: 280,
      height: 280,
      right: 380,
      bottom: 330,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.append(canvas);
  return canvas;
}

function appendHudElement(id: string): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  document.body.append(element);
  return element;
}

/** The marker-interaction rig: tooltip resolvers that record which layer
 *  answered, over a real MapMarkerInteractionController. `base` is the object
 *  the fields are stamped on (a bare Hud.prototype for a coordinator case). */
export function markerHarness<H extends MarkerHarness = MarkerHarness>(
  base: object = {},
): {
  hud: H;
  paint: ReturnType<typeof vi.fn>;
  calls: string[];
} {
  const hud = base as H;
  const calls: string[] = [];
  const paint = vi.fn();
  Object.assign(hud, {
    mapQuestAreas: [],
    mapNpcMarkers: [NPC],
    mapGatherNodes: [GATHER],
    mapStations: [STATION],
    mapServices: [SERVICE],
    mapFarmPatches: [FARM_PATCH],
    mapNavigationMarkers: [],
    mapPointHitsScratch: [],
    mapQuestObjectiveScratch: [],
    mapSemanticAccessibility: semanticCore(),
    mapSidebar: { update() {}, filterState: () => undefined, shownRoute: () => null },
    questGiverTooltipHtml: () => {
      calls.push('npc');
      return '';
    },
    stationMapTooltipHtml: () => {
      calls.push('station');
      return '';
    },
    serviceMapTooltipHtml: () => {
      calls.push('service');
      return '';
    },
    farmPatchMapTooltipHtml: () => {
      calls.push('farm');
      return '';
    },
    navigationMapTooltipHtml: () => {
      calls.push('navigation');
      return '';
    },
    gatherNodeMapTooltipHtml: () => {
      calls.push('gather');
      return '<div>gather</div>';
    },
    questAreaTooltipHtml: () => '',
    paintTooltipAt: paint,
  });
  wireTooltipResolvers(hud);
  return { hud, paint, calls };
}

function worldFixture(): IWorld {
  const zone = ZONES[0];
  return {
    player: {
      id: 1,
      name: 'Tester',
      facing: 0,
      pos: {
        x: ((zone.xMin ?? -300) + (zone.xMax ?? 300)) / 2,
        z: (zone.zMin + zone.zMax) / 2,
      },
    },
    playerId: 1,
    entities: new Map(),
    bgInfo: null,
    delveRun: null,
    riftFloor: null,
    cfg: { seed: 1, playerClass: 'warrior' },
  } as unknown as IWorld;
}

/** The map-window lifecycle rig: every painter updateMapWindow reaches, a zone
 *  paint that returns one marker per layer, and the summary elements it writes.
 *  `base` is the object the fields are stamped on (a bare Hud.prototype). */
export function lifecycleHarness<H extends MarkerHarness>(
  base: object,
): {
  hud: H;
  canvas: MapCanvas;
  paintTooltip: ReturnType<typeof vi.fn>;
} {
  const canvas = canvasFixture();
  appendHudElement('map-summary');
  appendHudElement('map-marker-summary');
  appendHudElement('map-level-toggle');
  appendHudElement('map-zoom');
  const zone = ZONES[0];
  const paintTooltip = vi.fn();
  const hud = base as H;
  Object.assign(hud, {
    sim: worldFixture(),
    mapLevel: 'zone',
    mapHoverZone: null,
    mapZoom: 1,
    mapCenter: null,
    mapPing: null,
    mapZoneOverride: null,
    mapZoneId: zone.id,
    lastZoneId: zone.id,
    mapDrag: null,
    mapView: null,
    mapQuestAreas: [],
    mapNpcMarkers: [],
    mapGatherNodes: [],
    mapStations: [],
    mapServices: [],
    mapFarmPatches: [],
    mapNavigationMarkers: [],
    mapPointHitsScratch: [],
    mapQuestObjectiveScratch: [],
    mapSemanticAccessibility: semanticCore(),
    mapSidebar: { update() {}, filterState: () => undefined, shownRoute: () => null },
    mapGatherTipMemo: { nodeId: 'stale' },
    continentRegions: [],
    setDisplay: vi.fn(),
    setStyleProp: vi.fn((element: HTMLElement, prop: string, value: string) => {
      (element.style as unknown as Record<string, string>)[prop] = value;
    }),
    setText: vi.fn(),
    mapZoneBg: () => document.createElement('canvas'),
    mapZoneRegion: () => ({ minX: -150, maxX: 150, minZ: -150, maxZ: 150 }),
    mapPainter: {
      paintOverworld: () => ({
        view: VIEW,
        questAreas: [QUEST_AREA],
        npcs: [NPC],
        gatherNodes: [GATHER],
        stations: [STATION],
        services: [SERVICE],
        farmPatches: [FARM_PATCH],
        navigation: [NAVIGATION],
        player: { mx: 280, my: 280, angle: 0 },
        allies: [],
        party: [],
        portals: [],
        pois: [],
        cursor: 'default' as const,
      }),
    },
    bgMapPainter: { paint: vi.fn() },
    delvePainter: { paintWorldMapDelve: vi.fn(() => null) },
    riftPainter: { paintWorldMap: vi.fn(() => null) },
    interiorMaps: { paintWorldMap: vi.fn(() => null) },
    continentPainter: {
      paintContinent: () => ({
        regions: [
          {
            zoneId: zone.id,
            rect: { mx: 0, my: 0, w: 10, h: 10 },
            labelX: 5,
            labelY: 5,
            isCurrent: true,
            isHovered: false,
            levelMin: zone.levelRange[0],
            levelMax: zone.levelRange[1],
          },
        ],
      }),
    },
    questGiverTooltipHtml: () => '<div>npc</div>',
    stationMapTooltipHtml: () => '<div>station</div>',
    serviceMapTooltipHtml: () => '<div>service</div>',
    farmPatchMapTooltipHtml: () => '<div>farm</div>',
    navigationMapTooltipHtml: () => '<div>navigation</div>',
    gatherNodeMapTooltipHtml: () => '<div>gather</div>',
    questAreaTooltipHtml: () => '<div>area</div>',
    paintTooltipAt: paintTooltip,
    hideTooltip: vi.fn(),
  });
  wireTooltipResolvers(hud);
  return { hud, canvas, paintTooltip };
}
