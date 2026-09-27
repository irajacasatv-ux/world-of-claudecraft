// The leave path releases a manned cannon BEFORE the leave save
// (server/game.ts settleLeavingSession, whose first line is the release's
// leaveVehicle). The order is the point: the save awaits Postgres while the world
// loop keeps ticking the leaving player until removePlayer, so a cannon still
// manned there would run its encounter (quest credit, the score row, the retry
// lockout) past the snapshot the save wrote, and a rejoin would load without it.
// removePlayer's own leaveVehicle is a backstop that runs only AFTER the save, so
// it cannot satisfy this case. Postgres is mocked (hoisted above the server/game
// import), the unstuck_online idiom.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../server/db', () => ({
  pool: { query: vi.fn(async () => ({ rows: [] })) },
  saveCharacterState: vi.fn(async () => {}),
  saveCharacterAndMarketState: vi.fn(async () => {}),
  saveMarketState: vi.fn(async () => {}),
  saveMailState: vi.fn(async () => {}),
  openPlaySession: vi.fn(async () => 1),
  touchCharacterLogin: vi.fn(async () => {}),
  closePlaySession: vi.fn(async () => {}),
  insertChatLogs: vi.fn(async () => {}),
  walletForAccount: vi.fn(async () => null),
  markAccountQuestComplete: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  grantAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  revokeAccountMechChroma: vi.fn(async () => ({ completedQuestIds: [], mechChromaIds: [] })),
  acquireCharacterLease: vi.fn(async () => true),
  releaseCharacterLease: vi.fn(async () => {}),
  heartbeatCharacterLeases: vi.fn(async () => {}),
  releaseAllCharacterLeases: vi.fn(async () => {}),
}));

import { saveCharacterAndMarketState } from '../server/db';
import { type ClientSession, GameServer } from '../server/game';
import { NORTH_WATCH_CANNON } from '../src/sim/content/vehicle_stations';
import { WORLD_QUESTS_BY_ID } from '../src/sim/data';
import type { VehicleSession } from '../src/sim/types';
import { terrainHeight } from '../src/sim/world';
import { worldQuestCycleOfferingQuest } from '../src/sim/world_quest_rotation';

function join(server: GameServer): ClientSession {
  const ws = { readyState: 1, send: () => {} };
  const result = server.join(
    ws as unknown as Parameters<GameServer['join']>[0],
    1,
    1,
    'Gunner',
    'mage',
    null,
  );
  if ('error' in result) throw new Error(result.error);
  result.blockListLoaded = true;
  return result;
}

// Seat the session's player at the North Watch cannon the way tests/vehicles.test.ts
// rigs it: the station quest's own level floor, a cycle that offers it, standing
// beside the station, one tick so the area starts the quest.
function manTheCannon(server: GameServer, session: ClientSession): void {
  const sim = server.sim;
  const meta = sim.meta(session.pid);
  const player = sim.entities.get(session.pid);
  if (!meta || !player) throw new Error('joined player missing');
  sim.setPlayerLevel(WORLD_QUESTS_BY_ID[NORTH_WATCH_CANNON.questId].minLevel, session.pid);
  meta.devWorldQuestCycle = worldQuestCycleOfferingQuest('wq3_0', NORTH_WATCH_CANNON.questId);
  const x = NORTH_WATCH_CANNON.x;
  const z = NORTH_WATCH_CANNON.z + 2;
  player.pos = { x, z, y: terrainHeight(x, z, sim.cfg.seed) };
  player.prevPos = { ...player.pos };
  sim.tick();
  expect(sim.enterVehicle(NORTH_WATCH_CANNON.id, session.pid)).toBe(true);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('a leaving gunner', () => {
  it('leaves the cannon before the leave save reads the character', async () => {
    const server = new GameServer();
    const session = join(server);
    manTheCannon(server, session);
    // Positive control: the rig really is manned when the leave starts.
    expect(server.sim.vehicleSessionFor(session.pid)?.stationId).toBe(NORTH_WATCH_CANNON.id);

    const mannedAtSave: Array<VehicleSession | null> = [];
    vi.mocked(saveCharacterAndMarketState).mockImplementation(async () => {
      mannedAtSave.push(server.sim.vehicleSessionFor(session.pid));
      return true;
    });
    await server.leave(session, 'test');

    // Exactly one leave save ran, and the cannon was already released when it did.
    expect(mannedAtSave).toEqual([null]);
    expect(server.sim.entities.has(session.pid)).toBe(false);
  });
});
