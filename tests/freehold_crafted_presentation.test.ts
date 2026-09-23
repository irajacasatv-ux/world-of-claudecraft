import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../server/db', () => ({
  pool: { query: vi.fn(async () => ({ rows: [] })) },
  saveCharacterState: vi.fn(async () => {}),
  loadGuildBankRow: vi.fn(async () => null),
  openPlaySession: vi.fn(async () => 1),
  touchCharacterLogin: vi.fn(async () => {}),
  closePlaySession: vi.fn(async () => {}),
  insertChatLogs: vi.fn(async () => {}),
  walletForAccount: vi.fn(async () => null),
  loadAccountFlair: vi.fn(async () => ({ ai: false, streamer: false, links: {} })),
  markAccountQuestComplete: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  grantAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
}));

import { GameServer } from '../server/game';
import { buildWorldHello } from '../server/world_hello';
import { anchorFields } from '../src/net/anchor_fields';
import { ClientWorld } from '../src/net/online';
import { FURNISHING_RECIPES } from '../src/sim/content/freehold/furnishing_recipes';
import { HEROIC_VENDOR_STOCK } from '../src/sim/content/heroic_vendor';
import { STATIONS } from '../src/sim/content/professions';
import { ITEMS } from '../src/sim/data';
import {
  buildHeroicVendorView,
  buildHeroicVendorViewForWorld,
} from '../src/ui/hud/vendor/heroic_vendor_view';
import { buildTrainView, type TrainViewDeps } from '../src/ui/hud/vendor/train_view';
import { bareClient, fakeWs, joinServer } from './helpers/bare_client';

const outputs = [
  'freehold_weapon_rack',
  'freehold_iron_brazier',
  'freehold_patchwork_rug',
  'freehold_hide_armchair',
  'freehold_clockwork_lamp',
  'freehold_glass_floor_lamp',
  'freehold_chart_easel',
  'freehold_jewel_floor_lamp',
  'freehold_set_supper_table',
  'freehold_glow_lantern',
];
const patterns = [
  'pattern_freehold_clockwork_lamp',
  'pattern_freehold_chart_easel',
  'pattern_freehold_jewel_floor_lamp',
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('crafted furnishing presentation availability', () => {
  it('starts an actual client dark before its first hello', () => {
    class Socket {
      static OPEN = 1;
      static CLOSED = 3;
      readyState = 1;
      onclose: (() => void) | null = null;
      send() {}
      close() {
        this.readyState = 3;
      }
    }
    vi.stubGlobal('WebSocket', Socket);
    vi.stubGlobal('window', {
      setInterval: () => 0,
      clearInterval: () => {},
      setTimeout: () => 0,
      clearTimeout: () => {},
    });
    const world = new ClientWorld('fixture', 1, 'warrior', 'http://x');
    try {
      expect(world.cfg).not.toHaveProperty('freeholdsEnabled');
      expect(world.recipeList.some((row) => outputs.includes(row.resultItemId))).toBe(false);
      expect(bareClient(1).recipeList).toBe(world.recipeList);
    } finally {
      world.close();
    }
  });

  it('reuses the extracted purse calculation for the live HUD capability', () => {
    const world = bareClient(1, {
      inventory: [
        { itemId: 'heroic_mark', count: 9 },
        { itemId: 'iron_ore', count: 999 },
        { itemId: 'heroic_mark', count: 7 },
      ],
    });
    expect(buildHeroicVendorViewForWorld(world)).toEqual(
      buildHeroicVendorView(HEROIC_VENDOR_STOCK, ITEMS, 16, false),
    );
    world.cfg.freeholdsEnabled = true;
    expect(buildHeroicVendorViewForWorld(world)).toEqual(
      buildHeroicVendorView(HEROIC_VENDOR_STOCK, ITEMS, 16, true),
    );
  });

  it('keeps the extracted hello legacy bytes and copy anchors exact', () => {
    const session = { pid: 42, name: 'Fixture', isAdmin: false, movementWireVersion: 2 as const };
    expect(
      JSON.stringify(buildWorldHello({ seed: 11 }, session, 'warrior', 'test', ['word'])),
    ).toBe(
      '{"t":"hello","pid":42,"seed":11,"name":"Fixture","cls":"warrior","realm":"test","admin":false,"softWords":["word"],"chatMutedUntil":null,"movementWire":2}',
    );
    expect(anchorFields({ slotIndex: 4 })).toEqual({});
    expect(anchorFields({ slotIndex: 4, anchor: { ordinal: 2, count: 3 } })).toEqual({
      ord: 2,
      n: 3,
    });
  });

  it('keeps existing trainer rows unchanged while hiding only the seven new lessons', () => {
    const rows = (enabled?: boolean) =>
      STATIONS.flatMap(
        (station) =>
          buildTrainView(station.masterNpcId, {
            stations: STATIONS,
            knownRecipes: [],
            craftSkills: {},
            copper: 100000,
            items: ITEMS,
            freeholdsEnabled: enabled,
          } as TrainViewDeps).rows,
      );
    const dark = rows(false);
    const lit = rows(true);
    expect(rows()).toEqual(dark);
    expect(
      lit
        .filter((row) => outputs.includes(row.resultItemId))
        .map((row) => row.resultItemId)
        .sort(),
    ).toEqual(outputs.filter((id) => !patterns.includes(`pattern_${id}`)).sort());
    expect(dark).toEqual(lit.filter((row) => !outputs.includes(row.resultItemId)));
    expect(dark.length).toBeGreaterThan(10);
  });

  it('hides exactly three quartermaster patterns without changing existing price rows', () => {
    const build = buildHeroicVendorView;
    const dark = build(HEROIC_VENDOR_STOCK, ITEMS, 16, false);
    const lit = build(HEROIC_VENDOR_STOCK, ITEMS, 16, true);
    expect(build(HEROIC_VENDOR_STOCK, ITEMS, 16)).toEqual(dark);
    expect(
      lit.rows.filter((row) => patterns.includes(row.itemId)).map((row) => row.itemId),
    ).toEqual(patterns);
    expect(dark.rows).toEqual(lit.rows.filter((row) => !patterns.includes(row.itemId)));
    expect(dark.rows.length).toBeGreaterThan(1);
  });

  it.each([undefined, false, 1, '1', 'true', null, {}])(
    'resets a lit mirror on missing or malformed hello capability %j',
    (capability) => {
      const world = bareClient(1);
      const hello = (value: unknown) =>
        (world as unknown as { onMessage(raw: string): void }).onMessage(
          JSON.stringify({
            t: 'hello',
            pid: 1,
            seed: 20061,
            freeholdsEnabled: value,
          }),
        );
      hello(true);
      expect(world.cfg.freeholdsEnabled).toBe(true);
      expect(world.recipeList.filter((row) => outputs.includes(row.resultItemId))).toHaveLength(10);
      const callbackValues: unknown[] = [];
      world.onReconnected = () =>
        callbackValues.push([
          world.cfg.freeholdsEnabled,
          world.recipeList.some((row) => outputs.includes(row.resultItemId)),
        ]);
      (world as unknown as { reconnectAttempts: number }).reconnectAttempts = 1;
      hello(capability);
      expect(callbackValues).toEqual([[undefined, false]]);
      expect(world.cfg.freeholdsEnabled).not.toBe(true);
      expect(world.recipeList.filter((row) => outputs.includes(row.resultItemId))).toEqual([]);
      expect(FURNISHING_RECIPES).toHaveLength(10);
      for (const id of outputs) expect(ITEMS[id].kind).toBe('furnishing');
    },
  );

  it.each([false, true])(
    'advertises only boot-time true on fresh and resumed hello (enabled %s)',
    (enabled) => {
      vi.stubEnv('FREEHOLDS_ENABLED', enabled ? '1' : '0');
      const server = new GameServer();
      vi.stubEnv('FREEHOLDS_ENABLED', enabled ? '0' : '1');
      const first = fakeWs();
      const session = joinServer(server, first, 901, 'Fixture');
      const check = (frames: typeof first.sent) => {
        const hello = frames.find((frame) => frame.t === 'hello');
        expect(hello).toBeDefined();
        if (enabled) expect(hello.freeholdsEnabled).toBe(true);
        else expect(hello).not.toHaveProperty('freeholdsEnabled');
      };
      check(first.sent);
      first.ws.readyState = 3;
      expect(server.socketClosed(session, first.ws)).toBe(true);
      const resumed = fakeWs();
      expect(joinServer(server, resumed, 901, 'Fixture')).toBe(session);
      check(resumed.sent);
    },
  );
});
