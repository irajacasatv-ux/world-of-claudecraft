// @vitest-environment happy-dom

// Hud window coordination: the cases that need the REAL coordinator's window
// management, driven as the real Hud methods on a bare Hud.prototype rig. The
// extracted modules each have their own suite; what stays here is the routing
// only the Hud owns. Its own file on purpose, beside
// tests/hud_coordinator_delegators.test.ts (the delegators and the event
// drain): importing the coordinator costs a suite several hundred MB
// (tests/CLAUDE.md, "Test cost"), so these cases left the pure-module suites
// that pin the extracted halves, and every case below moved whole:
// - the lockpick panel through Hud.closeAll, the gamepad escape path (from
//   tests/lockpick_managed_close.test.ts; the rig is
//   tests/helpers/lockpick_rig.ts and the controller's own latch stays there);
// - the profession tutorial's Esc reachability and managed close (from
//   tests/profession_tutorial_window.test.ts);
// - the zone map's drag-commit geometry refresh and updateMapWindow's marker
//   lifecycle (from tests/hud_map_marker_lifecycle.test.ts; the rig is
//   tests/helpers/map_marker_rig.ts, over a fake document);
// - furnishing drops refused by buildActionBar's live listeners (from
//   tests/furnishing_tooltip_view.test.ts);
// - syncActiveHotbarForm applying the form-sync outcome to the Hud's own fields
//   (from tests/action_bar_hud_facade.test.ts).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BG_X, DELVE_LIST, DELVE_X_MIN, ITEMS, ZONES } from '../src/sim/data';
import { Hud } from '../src/ui/hud';
import {
  ACTION_BAR_ABILITY_SLOTS,
  ActionBarController,
} from '../src/ui/hud/action_bar/action_bar_controller';
import { HOTBAR_ACTION_MIME, type HotbarAction } from '../src/ui/hud/action_bar/hotbar';
import type { LockpickController } from '../src/ui/hud/delve/lockpick_controller';
import type { RiftMapModel } from '../src/ui/hud/rift/rift_map_core';
import { makeWriterFacet } from '../src/ui/painter_host';
import type { WindowDragDeps } from '../src/ui/window_drag';
import type { LockpickView, RiftFloorView } from '../src/world_api';
import { FURNISHING } from './fixtures/furnishing_item';
import { closeBuiltLockpicks, LIVE, lockpickRig } from './helpers/lockpick_rig';
import {
  canvasFixture,
  GATHER,
  hudElements,
  installFakeDocument,
  lifecycleHarness as lifecycleRig,
  type MarkerHarness,
  markerHarness as markerRig,
  NAVIGATION,
  NPC,
  QUEST_AREA,
  SERVICE,
  STATION,
} from './helpers/map_marker_rig';

const installWindowDragCalls = vi.hoisted(() => vi.fn());

// The map window's drag installer, captured so the drag-commit case can drive
// the commit the Hud wires; every other export passes through.
vi.mock('../src/ui/window_drag', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/ui/window_drag')>();
  return {
    ...actual,
    installWindowDrag: (deps: WindowDragDeps) => {
      installWindowDragCalls(deps);
      return { cancel: () => {}, destroy: () => {} };
    },
  };
});

// The action-bar and tooltip paths do not render character previews. Keep the
// real HUD methods while avoiding unrelated GLB preloads in the DOM test host.
vi.mock('../src/render/characters', () => ({ CharacterPreview: class {} }));
vi.mock('../src/render/characters/assets', () => ({ preloadMechAssets: vi.fn() }));
vi.mock('../src/render/characters/portrait', () => ({
  onPortraitsReady: vi.fn(),
  onPortraitUpdate: vi.fn(),
  playerPortraitDataUrl: vi.fn(),
  portraitsReady: vi.fn(() => false),
  visualPortraitDataUrl: vi.fn(),
}));

// ---------------------------------------------------------------------------
// The lockpick panel through Hud.closeAll (#2517), over the shared rig. Only
// the members closeAll -> closeManagedWindow actually read; closeManagedWindow is
// private, so the bare-prototype harness is the hud_coordinator_delegators /
// profession_tutorial precedent. `windowDragController` is deliberately left
// undefined: the real field is optional-chained, and Object.create skips field
// initializers.
// ---------------------------------------------------------------------------

interface CloseAllHarness {
  lockpickController: LockpickController;
  lootWindow: { hasOpenChest: boolean };
  playerCard: { isOpen: boolean };
  emoteWheelOpen: boolean;
  syncAnyWindowOpenState(): void;
  hideTooltip(): void;
  closeAll(): boolean;
  topmostOpenWindow(): HTMLElement | null;
}

function harness(initial: LockpickView | null, host: 'online' | 'offline' = 'online') {
  const rig = lockpickRig(initial, host);
  // The Hud's own hideTooltip, a second spy for ATTRIBUTION only beside the
  // rig's controller dep (production wires the dep as `() => this.hideTooltip()`,
  // so in the client these ARE one call).
  const hudHideTooltip = vi.fn();
  const hud = Object.create(Hud.prototype) as unknown as CloseAllHarness;
  hud.lockpickController = rig.controller;
  hud.lootWindow = { hasOpenChest: false };
  hud.playerCard = { isOpen: false };
  hud.emoteWheelOpen = false;
  hud.syncAnyWindowOpenState = vi.fn();
  hud.hideTooltip = hudHideTooltip;
  return { ...rig, hud, hudHideTooltip };
}

function tick(ticks: number): void {
  for (let i = 0; i < ticks; i++) vi.advanceTimersByTime(100);
}

/** The observable teardown a dismissal must produce, whichever path asked for it. */
function teardown(h: ReturnType<typeof harness>) {
  return {
    aborts: h.abort.mock.calls.length,
    releases: h.release.mock.calls.length,
    timers: vi.getTimerCount(),
    display: h.panel.style.display,
  };
}

describe('lockpick panel: Hud.closeAll (the gamepad escape path)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    closeBuiltLockpicks();
    // Not the inline mockRestore()s a failing expect would skip: a spy left on the shared
    // jsdom window turns one red case into a cascade in every case after it.
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('is the topmost scan hit while the board is up, and leaves the scan once closed', () => {
    // If the scan did not select it, every other case below would pass vacuously by
    // closing something else (or nothing).
    const h = harness(LIVE);
    h.controller.openBoard();
    expect(h.hud.topmostOpenWindow()).toBe(h.panel);
    // The other side of the scan, which the requestClose latch cases below rely on
    // when they read a hidden panel as "the sweep moves on": once the panel is
    // closed it is no longer the topmost hit, and a closeAll with nothing else up
    // reports that it closed nothing.
    h.controller.close();
    expect(h.hud.topmostOpenWindow()).not.toBe(h.panel);
    expect(h.hud.closeAll(), 'nothing left for this harness to close').toBe(false);
  });

  it('withdraws from the live session and stops the 100ms countdown', () => {
    const h = harness(LIVE);
    h.controller.openBoard();
    // Exactly one pending timer: the countdown startTimer armed.
    expect(vi.getTimerCount(), 'the board arms its countdown').toBe(1);
    const bar = h.bar() as HTMLElement;
    tick(20);
    const frozen = bar.style.width;
    expect(frozen).not.toBe('100%');

    expect(h.hud.closeAll(), 'closeAll reports it closed something').toBe(true);

    // The server is told to withdraw, so the attempt is preserved instead of being
    // burned down by a per-step clock the player can no longer see.
    expect(h.abort).toHaveBeenCalledTimes(1);
    // Asserted as "the clock is GONE", not "nothing throws": painting a detached or
    // hidden subtree throws nothing at all, so a no-throw assertion passes with the
    // whole fix reverted.
    expect(vi.getTimerCount(), 'the countdown interval is cleared').toBe(0);
    tick(20);
    expect(bar.style.width, 'the hidden subtree stops being repainted').toBe(frozen);

    // The post-condition a reader most needs, and it is deliberate rather than a shortfall:
    // the withdrawal does NOT close. Online the panel stands and the trap stays armed until
    // the server's lockpickEnd, which is what the offline case below drives to completion.
    expect(h.release, 'the trap is released by end(), not by the withdraw').not.toHaveBeenCalled();
    expect(h.panel.style.display, 'still up until lockpickEnd lands').toBe('block');
    // The arm owes its own tooltip hide, since close() (which would have done it) has not run.
    expect(h.hudHideTooltip).toHaveBeenCalledTimes(1);
    expect(
      h.depsHideTooltip,
      'close() has not run, so the controller owed no hide',
    ).not.toHaveBeenCalled();
  });

  it('three closeAll calls in a row: withdraw, re-send and close, then nothing, never a wedge', () => {
    // The end-to-end form of the latch cases below, through the Hud this time.
    // SkinEventController.open() sweeps `for (i < 20 && closeTop())` and closeTop IS
    // closeAll, so what the sweep sees is closeAll's RETURN: true while the panel is
    // still up to close, then false once it has left the scan. A managed arm that
    // reported false on the re-send call would stop the sweep with the windows
    // underneath still open; one that kept reporting true would spin it. Three calls,
    // not two: the third proves the panel actually left the scan, not merely that it
    // stopped aborting.
    const h = harness(LIVE);
    h.controller.openBoard();

    expect(h.hud.closeAll(), 'first: withdraw').toBe(true);
    expect(h.abort).toHaveBeenCalledTimes(1);
    expect(h.panel.style.display).toBe('block');

    expect(h.hud.closeAll(), 'second: re-send, then close').toBe(true);
    expect(h.abort).toHaveBeenCalledTimes(2);
    expect(h.panel.style.display).toBe('none');
    expect(h.release).toHaveBeenCalledWith(true);
    expect(h.hud.topmostOpenWindow(), 'the sweep can move on').not.toBe(h.panel);

    expect(h.hud.closeAll(), 'third: nothing left for this harness to close').toBe(false);
    expect(h.abort, 'and no third abort on the way out').toHaveBeenCalledTimes(2);
  });

  it('produces the same teardown as the Escape key, live board and ante selector alike', () => {
    // The two paths are the same funnel or they drift: the keyboard one aborts a live
    // session and closes an idle one, and the pad must not do something else.
    //
    // SCOPED to what `teardown()` reads. The paths are NOT byte-identical: the managed-window
    // arm adds its own `this.hideTooltip()`, which the controller's keydown handler has no
    // way to reach. That difference is deliberate (the arm owes the hide the default arm used
    // to guarantee) and is pinned in the live case above, not here.
    for (const initial of [LIVE, null]) {
      const viaKey = harness(initial);
      if (initial) viaKey.controller.openBoard();
      else viaKey.controller.openAnte(9);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
      const keyResult = teardown(viaKey);
      viaKey.controller.close();

      const viaPad = harness(initial);
      if (initial) viaPad.controller.openBoard();
      else viaPad.controller.openAnte(9);
      expect(
        viaPad.hud.closeAll(),
        `closeAll reports it closed something (live=${initial !== null})`,
      ).toBe(true);
      const padResult = teardown(viaPad);
      viaPad.controller.close();

      expect(padResult, `gamepad and keyboard must agree (live=${initial !== null})`).toEqual(
        keyResult,
      );
      // The comparison alone is RELATIVE: both paths run the same funnel, so it survives any
      // change made to the funnel itself, including inverting it (close a live board, abort an
      // idle one) which keeps the two sides equal and non-empty. Pin the absolute shape too.
      expect(keyResult, `the shape itself (live=${initial !== null})`).toEqual(
        initial
          ? { aborts: 1, releases: 0, timers: 0, display: 'block' }
          : { aborts: 0, releases: 1, timers: 0, display: 'none' },
      );
    }
  });
});

// ---------------------------------------------------------------------------
// The profession tutorial modal through the Hud. The managed-window close path
// (Esc dispatcher: closeAll -> topmostOpenWindow -> closeManagedWindow) must
// route the tutorial modal through closeProfessionTutorial, releasing the focus
// trap and returning focus to the opener, the same contract every other
// managed window honors. Exercised via a bare Hud prototype since
// closeManagedWindow is private.
// ---------------------------------------------------------------------------

interface CloseHarness {
  professionTutorialTrap: { release: ReturnType<typeof vi.fn>; focusFirst: () => void } | null;
  syncAnyWindowOpenState(): void;
  hideTooltip(): void;
  closeManagedWindow(el: HTMLElement): void;
}

// The Esc dispatcher reaches a managed window only through the
// topmostOpenWindow scan (closeAll -> topmostOpenWindow -> closeManagedWindow),
// which selects visible '.window.panel' elements by z-order. This pin drives
// the REAL openProfessionTutorial (painter, z floor, focus trap wiring) and
// asserts the scan finds the modal and the close case tears it down with the
// trap released, so the one-shot can never open unreachable by Esc.
interface EscReachHarness {
  professionTutorialTrap: { release: (restore?: boolean) => void; focusFirst: () => void } | null;
  windowZ: number;
  focusManager: { open: ReturnType<typeof vi.fn> };
  syncAnyWindowOpenState(): void;
  hideTooltip(): void;
  openProfessionTutorial(): void;
  topmostOpenWindow(): HTMLElement | null;
  closeManagedWindow(el: HTMLElement): void;
}

describe('tutorial Esc reachability (openProfessionTutorial -> topmostOpenWindow)', () => {
  it('the open modal is the topmost scan hit, and the close case releases the trap and removes it', () => {
    document.body.innerHTML = '';
    const release = vi.fn();
    const hud = Object.create(Hud.prototype) as unknown as EscReachHarness;
    hud.professionTutorialTrap = null;
    // The window z-band floor; bringWindowToFront increments from here before
    // the tutorial's own 96 floor wins.
    hud.windowZ = 50;
    hud.focusManager = { open: vi.fn(() => ({ release, focusFirst: vi.fn() })) };
    hud.syncAnyWindowOpenState = vi.fn();
    hud.hideTooltip = vi.fn();

    hud.openProfessionTutorial();
    const el = document.getElementById('profession-tutorial');
    expect(el).not.toBeNull();
    expect(hud.focusManager.open).toHaveBeenCalledTimes(1);

    // The Esc dispatcher's scan (visible '.window.panel' by z) must surface
    // the modal, or Esc would close some other window underneath it.
    const top = hud.topmostOpenWindow();
    expect(top).toBe(el);

    hud.closeManagedWindow(top as HTMLElement);
    // No-arg release: restoreFocus defaults true, focus returns to the opener.
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith();
    expect(hud.professionTutorialTrap).toBeNull();
    expect(document.getElementById('profession-tutorial')).toBeNull();
  });
});

describe('tutorial managed-window close (Esc path)', () => {
  it('releases the focus trap (returning focus) and removes the modal, not just hides it', () => {
    document.body.innerHTML = '';
    const el = document.createElement('div');
    el.id = 'profession-tutorial';
    el.className = 'window panel';
    document.body.appendChild(el);

    const release = vi.fn();
    const hud = Object.create(Hud.prototype) as unknown as CloseHarness;
    hud.professionTutorialTrap = { release, focusFirst: vi.fn() };
    hud.syncAnyWindowOpenState = vi.fn();
    hud.hideTooltip = vi.fn();

    hud.closeManagedWindow(el);

    // release() with no argument defaults restoreFocus=true, so focus returns to
    // the opener (the FocusManager contract); a bare display:none default arm
    // would leave the trap live and never return focus.
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith();
    expect(hud.professionTutorialTrap).toBeNull();
    expect(document.getElementById('profession-tutorial')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The zone map through the Hud, over the marker rig on a bare Hud.prototype and
// a fake document (the rig's installFakeDocument, unstubbed after each case).
// ---------------------------------------------------------------------------

/** The rig's fields plus the real Hud methods these cases drive. */
interface MapHudHarness extends MarkerHarness {
  initWindowManagement(): void;
  showMapTipAt(
    mapCanvas: HTMLCanvasElement,
    clientX: number,
    clientY: number,
    touchTarget?: boolean,
  ): boolean;
  updateMapWindow(): void;
}

const markerHarness = () => markerRig<MapHudHarness>(Object.create(Hud.prototype));
const lifecycleHarness = () => lifecycleRig<MapHudHarness>(Object.create(Hud.prototype));

describe('Hud zone-map marker interaction', () => {
  beforeEach(() => {
    installFakeDocument();
    installWindowDragCalls.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('refreshes cached projection geometry only when the map window drag commits', () => {
    const canvas = canvasFixture();
    let left = 100;
    const readRect = vi.fn(
      () =>
        ({
          x: left,
          y: 50,
          left,
          top: 50,
          width: 280,
          height: 280,
          right: left + 280,
          bottom: 330,
          toJSON: () => ({}),
        }) as DOMRect,
    );
    canvas.getBoundingClientRect = readRect;
    const { hud } = markerHarness();
    Object.assign(hud, {
      windowObserver: null,
      syncAnyWindowOpenState: vi.fn(),
      setWindowPixelPosition: (element: HTMLElement, nextLeft: number) => {
        if (element.id === 'map-window') left = nextLeft;
      },
    });
    vi.stubGlobal(
      'MutationObserver',
      class {
        observe(): void {}
      },
    );
    vi.stubGlobal('window', { addEventListener: vi.fn() });

    hud.initWindowManagement();
    const dragDeps = installWindowDragCalls.mock.lastCall?.[0] as WindowDragDeps | undefined;
    expect(dragDeps).toBeDefined();
    hud.mapMarkerInteraction.refreshGeometry(canvas);
    expect(hud.showMapTipAt(canvas, 170, 150)).toBe(true);
    expect(readRect).toHaveBeenCalledTimes(1);

    dragDeps?.commitWindow({ id: 'bags' } as HTMLElement, 60, 50, {} as DOMRect);
    expect(hud.showMapTipAt(canvas, 170, 150)).toBe(true);
    expect(readRect).toHaveBeenCalledTimes(1);

    dragDeps?.commitWindow({ id: 'map-window' } as HTMLElement, 30, 50, {} as DOMRect);
    expect(hud.showMapTipAt(canvas, 170, 150)).toBe(false);
    expect(hud.showMapTipAt(canvas, 100, 150)).toBe(true);
    expect(readRect).toHaveBeenCalledTimes(2);
  });
});

describe('Hud zone-map marker lifecycle', () => {
  beforeEach(() => {
    installFakeDocument();
    installWindowDragCalls.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('clears every zone hit target on rift, battleground, delve, and continent transitions', () => {
    const { hud, canvas, paintTooltip } = lifecycleHarness();
    const zone = ZONES[0];
    const world = hud.sim as unknown as {
      player: { pos: { x: number; z: number } };
      delveRun: unknown;
      riftFloor: RiftFloorView | null;
    };
    const assertZoneMarkers = (): void => {
      expect(hud.mapQuestAreas).toEqual([QUEST_AREA]);
      expect(hud.mapNpcMarkers).toEqual([NPC]);
      expect(hud.mapGatherNodes).toEqual([GATHER]);
      expect(hud.mapStations).toEqual([STATION]);
      expect(hud.mapServices).toEqual([SERVICE]);
      expect(hud.mapNavigationMarkers).toEqual([NAVIGATION]);
      expect(hud.showMapTipAt(canvas, 170, 150)).toBe(true);
    };
    const assertNoZoneHits = (): void => {
      expect(hud.mapQuestAreas).toEqual([]);
      expect(hud.mapNpcMarkers).toEqual([]);
      expect(hud.mapGatherNodes).toEqual([]);
      expect(hud.mapStations).toEqual([]);
      expect(hud.mapServices).toEqual([]);
      expect(hud.mapNavigationMarkers).toEqual([]);
      expect(hud.mapSemanticAccessibility.instanceMarkers).toEqual([]);
      expect(hud.mapGatherTipMemo).toBeNull();
      expect(hud.mapView).toBeNull();
      expect(hud.showMapTipAt(canvas, 170, 150, true)).toBe(false);
    };
    const returnToZone = (): void => {
      const zone = ZONES[0];
      world.player.pos.x = ((zone.xMin ?? -300) + (zone.xMax ?? 300)) / 2;
      world.player.pos.z = (zone.zMin + zone.zMax) / 2;
      world.delveRun = null;
      world.riftFloor = null;
      hud.mapLevel = 'zone';
      hud.updateMapWindow();
      assertZoneMarkers();
    };

    hud.updateMapWindow();
    assertZoneMarkers();

    world.riftFloor = {
      eventId: null,
      instanceId: 1,
      seed: 1,
      baseLevel: 20,
      floorIndex: 0,
      floorCount: 3,
      origin: { x: 4000, z: -1000 },
      contentId: 'test',
      contentHash: 'test',
      upgrade: null,
      name: 'The Test Rift',
      themeName: 'Test',
      tier: 'B',
    };
    hud.mapLevel = 'continent';
    hud.mapCenter = { x: 1, z: 2 };
    hud.mapPing = { x: 3, z: 4 };
    hud.mapZoneOverride = zone.id;
    hud.mapDrag = {};
    hud.updateMapWindow();
    assertNoZoneHits();
    // A mode transition opens the new band on ITS default level: the rift plan
    // here (map_surface_core.ts defaultMapLevel); the toggle can still leave it.
    expect(hud.mapLevel).toBe('instance');
    expect(hud.mapCenter).toBeNull();
    expect(hud.mapPing).toBeNull();
    expect(hud.mapZoneOverride).toBeNull();
    expect(hud.mapDrag).toBeNull();

    world.riftFloor = null;
    world.player.pos.x = BG_X;
    hud.updateMapWindow();
    assertNoZoneHits();

    returnToZone();
    world.player.pos.x = DELVE_X_MIN;
    world.delveRun = {
      delveId: DELVE_LIST[0].id,
      modules: [],
      moduleIndex: 0,
      origin: { x: DELVE_X_MIN, z: 0 },
    };
    hud.updateMapWindow();
    assertNoZoneHits();

    returnToZone();
    hud.mapLevel = 'continent';
    hud.updateMapWindow();
    assertNoZoneHits();
    expect(hud.continentRegions).toHaveLength(1);

    expect(paintTooltip).toHaveBeenCalledTimes(3);
  });

  it('wires the exact returned Rift model into the hidden summary and mechanic hit layer', () => {
    const { hud, canvas, paintTooltip } = lifecycleHarness();
    const world = hud.sim as unknown as { riftFloor: RiftFloorView | null };
    world.riftFloor = {
      eventId: null,
      instanceId: 1,
      seed: 1,
      baseLevel: 20,
      floorIndex: 0,
      floorCount: 3,
      origin: { x: 4000, z: -1000 },
      contentId: 'test',
      contentHash: 'test',
      upgrade: null,
      name: 'The Test Rift',
      themeName: 'Test',
      tier: 'B',
    };
    const mechanic = {
      cx: 140,
      cy: 200,
      semantic: { kind: 'rift-mechanic', mechanic: 'orb', state: 'active' },
    } as const;
    hud.riftPainter.paintWorldMap = vi.fn(
      () =>
        ({
          staticKey: 'test',
          staticGeometry: { walkable: [], structures: [], clipped: [] },
          transform: {},
          mobs: [],
          objects: [mechanic],
          party: [],
          deathZones: [],
          corpse: null,
          player: { cx: 280, cy: 280, angle: 0 },
          areaLabel: 'The Test Rift',
        }) as unknown as RiftMapModel,
    );

    hud.updateMapWindow();

    expect(hud.mapSemanticAccessibility.instanceMarkers).toEqual([mechanic]);
    expect(hud.showMapTipAt(canvas, 170, 150)).toBe(true);
    expect(paintTooltip.mock.lastCall?.[0]).toContain('Active orb');
    expect(hud.setText).toHaveBeenCalledWith(
      hudElements.get('map-marker-summary'),
      expect.stringContaining('Active orb'),
    );
  });
});

// ---------------------------------------------------------------------------
// Furnishing drops through buildActionBar's live listeners.
// ---------------------------------------------------------------------------

describe('furnishing drops through the live HUD action-bar handlers', () => {
  it.each([
    { name: 'normal slot, external bag payload', slot: 2, source: 'external' },
    { name: 'normal slot, stale attack drag', slot: 2, source: 'attack' },
    { name: 'freed attack slot, external bag payload', slot: 0, source: 'external' },
    { name: 'freed attack slot, stale normal drag', slot: 0, source: 'normal' },
  ] as const)('refuses $name without saving or moving other actions', ({ slot, source }) => {
    const previousDef = ITEMS[FURNISHING.id];
    ITEMS[FURNISHING.id] = FURNISHING;
    const root = document.createElement('div');
    root.innerHTML =
      '<div id="actionbar"></div><div id="actionbar2"></div><div id="actionbar3"></div>';
    document.body.append(root);
    try {
      const values = new Map<string, string>();
      const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: vi.fn((key: string, value: string) => {
          values.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          values.delete(key);
        }),
      };
      const sendLayout = vi.fn();
      const settingsWrite = vi.fn();
      const controller = new ActionBarController({
        storage,
        playerClass: 'warrior',
        playerName: 'FurnishingDropTester',
        playerLevel: () => 20,
        talentSpec: () => null,
        knownAbilityIds: () => ['sunder_armor'],
        hasAura: () => false,
        showAttackButton: () => false,
        persistLayout: sendLayout,
      });
      controller.init();
      const actions: HotbarAction[] = Array.from({ length: ACTION_BAR_ABILITY_SLOTS }, () => null);
      actions[0] = { type: 'ability', id: 'sunder_armor' };
      actions[1] = { type: 'item', id: 'reins_valorsteed' };
      controller.replaceActions(actions);
      controller.replaceAttackAction({ type: 'ability', id: 'sunder_armor' });
      controller.saveActions();
      controller.saveAttackAction();
      const noop = () => {};
      const runtimeHud = Object.assign(Object.create(Hud.prototype), {
        actionBarController: controller,
        abilityButtons: [],
        actionbarEl: root.querySelector('#actionbar'),
        keybinds: { primaryLabel: () => '' },
        sim: { known: [] },
        optionsHooks: { settings: { get: () => false, set: settingsWrite } },
        writerFacet: makeWriterFacet(
          new WeakMap(),
          new WeakMap(),
          new WeakMap(),
          new WeakMap(),
          noop,
          noop,
        ),
        bindEmpoweredActionHold: noop,
        attachTooltip: noop,
        hideTooltip: noop,
        buildMobileActionRing: noop,
        buildMobileConsumableSeat: noop,
        buildStanceBar: noop,
        dragAction: null,
      }) as {
        buildActionBar(): void;
        abilityButtons: { btn: HTMLButtonElement }[];
        dragAction: {
          action: Exclude<HotbarAction, null>;
          sourceIndex: number | null;
          sourceAttackSlot?: boolean;
        } | null;
      };
      runtimeHud.buildActionBar();
      const target = runtimeHud.abilityButtons[slot].btn;
      const dispatch = (kind: 'dragover' | 'drop', action: Exclude<HotbarAction, null>): Event => {
        const event = new Event(kind, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
          value: {
            types: [HOTBAR_ACTION_MIME],
            getData: (mime: string) => (mime === HOTBAR_ACTION_MIME ? JSON.stringify(action) : ''),
            dropEffect: 'none',
          },
        });
        target.dispatchEvent(event);
        return event;
      };
      const resetCalls = () => {
        storage.setItem.mockClear();
        storage.removeItem.mockClear();
        sendLayout.mockClear();
        settingsWrite.mockClear();
      };
      resetCalls();
      const before = {
        actions: structuredClone(controller.actions),
        attack: structuredClone(controller.attackAction),
        storage: [...values],
      };
      const rejected: Exclude<HotbarAction, null> = { type: 'item', id: FURNISHING.id };
      if (source !== 'external') {
        // A stale or malformed in-memory drag must be refused before it can
        // clear the valid source slot or configured attack action.
        runtimeHud.dragAction = {
          action: rejected,
          sourceIndex: source === 'normal' ? 0 : null,
          sourceAttackSlot: source === 'attack',
        };
      }
      expect(dispatch('dragover', rejected).defaultPrevented).toBe(false);
      expect(target.classList.contains('drop-target')).toBe(false);
      dispatch('drop', rejected);
      expect(controller.actions).toEqual(before.actions);
      expect(controller.actions[0]).toEqual({ type: 'ability', id: 'sunder_armor' });
      expect(controller.actions[1]).toEqual({ type: 'item', id: 'reins_valorsteed' });
      expect(controller.attackAction).toEqual(before.attack);
      expect([...values]).toEqual(before.storage);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.removeItem).not.toHaveBeenCalled();
      expect(sendLayout).not.toHaveBeenCalled();
      expect(settingsWrite).not.toHaveBeenCalled();

      // Positive control: the same mounted listeners accept and save an
      // eligible item, so the rejected drop's silence cannot be a dead fixture.
      runtimeHud.dragAction = null;
      const accepted: Exclude<HotbarAction, null> = { type: 'item', id: 'reins_valorsteed' };
      expect(dispatch('dragover', accepted).defaultPrevented).toBe(true);
      expect(target.classList.contains('drop-target')).toBe(true);
      dispatch('drop', accepted);
      expect(storage.setItem).toHaveBeenCalled();
      expect(sendLayout).toHaveBeenCalled();
      expect(target.classList.contains('drop-target')).toBe(false);
    } finally {
      root.remove();
      if (previousDef === undefined) delete ITEMS[FURNISHING.id];
      else ITEMS[FURNISHING.id] = previousDef;
    }
  });
});

// ---------------------------------------------------------------------------
// The action-bar form sync's application to the Hud's own fields.
// ---------------------------------------------------------------------------

describe('Hud action-bar facade', () => {
  // WAS: 'cancels a mobile drag before exposing a newly loaded form page'. The
  // long-press rearrange that drag belonged to is retired, so there is no drag
  // to cancel here any more. What still matters at this seam is the OTHER half
  // that test covered: a form swap must drop the desktop drag AND re-clamp the
  // ring page, or the newly loaded bar is exposed through a stale page.
  //
  // The DECISION (which syncs run, in which order, and what each combination
  // owes) is hotbarSyncOutcome now, pinned in
  // tests/action_bar_form_sync_core.test.ts, including that a surface flip runs
  // no second form sync. What stays on Hud is applying the outcome to Hud's own
  // fields (dragAction, mobileActionPage) and the spellbook refresh, so ONE
  // coordinator case drives the real syncActiveHotbarForm through all three
  // outcomes.
  interface FormSyncHud {
    actionBarController: {
      syncActiveForm(): boolean;
      syncProfile(): boolean;
      syncSpec(): boolean;
    };
    spellbookWindow: { refreshHotbarControls(): void };
    dragAction: unknown;
    mobileActionPage: number;
    currentMobileActionPage(): number;
    syncActiveHotbarForm(): void;
  }

  function formSyncHud(
    profileSwitched: boolean,
    formSwapped: boolean,
  ): FormSyncHud & {
    refreshes: number;
  } {
    const hud = Object.create(Hud.prototype) as unknown as FormSyncHud & {
      refreshes: number;
    };
    hud.refreshes = 0;
    hud.actionBarController = {
      syncActiveForm: () => formSwapped,
      syncProfile: () => profileSwitched,
      // The spec sync sits beside the profile and form syncs on the real
      // controller; this case holds the spec still so only the form and
      // surface arms move.
      syncSpec: () => false,
    };
    hud.spellbookWindow = {
      refreshHotbarControls: () => {
        hud.refreshes += 1;
      },
    };
    hud.dragAction = { action: { type: 'ability', id: 'strike' }, sourceIndex: 0 };
    hud.mobileActionPage = 4;
    hud.currentMobileActionPage = () => 1;
    return hud;
  }

  it('applies the form-sync outcome: drag drop and page re-clamp on a form swap or a surface flip, the spellbook refresh only on the flip, nothing when unchanged', () => {
    // A form swap drops the desktop drag and re-clamps the ring page.
    const swapped = formSyncHud(false, true);
    swapped.syncActiveHotbarForm();
    expect(swapped.dragAction).toBeNull();
    expect(swapped.mobileActionPage).toBe(1);
    expect(swapped.refreshes).toBe(0);

    // A mid-session Interface Mode flip re-seeds the bars from the other
    // surface's keys: the same drag drop and page re-clamp as a form swap, plus
    // the spellbook's hotbar controls re-read the newly loaded bar.
    const flipped = formSyncHud(true, false);
    flipped.syncActiveHotbarForm();
    expect(flipped.dragAction).toBeNull();
    expect(flipped.mobileActionPage).toBe(1);
    expect(flipped.refreshes).toBe(1);

    // Neither the surface nor the form changed: the drag and page stay put.
    const unchanged = formSyncHud(false, false);
    unchanged.syncActiveHotbarForm();
    expect(unchanged.dragAction).not.toBeNull();
    expect(unchanged.mobileActionPage).toBe(4);
    expect(unchanged.refreshes).toBe(0);
  });
});
