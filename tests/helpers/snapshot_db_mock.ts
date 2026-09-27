// The db mock every snapshot wire suite hoists (tests/snapshots.test.ts and the
// tests/snapshots_<topic>.test.ts files split out of it on 2026-09-27), as one
// factory so the export set cannot drift between them:
//   vi.mock('../server/db', async () => (await import('./helpers/snapshot_db_mock')).snapshotDbMock());
// Each call builds fresh spies, so every suite owns its own call history.

import { vi } from 'vitest';

export function snapshotDbMock() {
  return {
    pool: { query: vi.fn(async () => ({ rows: [] })) },
    saveCharacterState: vi.fn(async () => {}),
    saveCharacterAndGuildBankState: vi.fn(async () => true),
    saveCharacterAndMarketState: vi.fn(async () => {}),
    saveMarketState: vi.fn(async () => {}),
    saveMailState: vi.fn(async () => {}),
    saveMailPartitions: vi.fn(async () => {}),
    openPlaySession: vi.fn(async () => 1),
    touchCharacterLogin: vi.fn(async () => {}),
    closePlaySession: vi.fn(async () => {}),
    insertChatLogs: vi.fn(async () => {}),
    walletForAccount: vi.fn(async () => null),
    markAccountQuestComplete: vi.fn(async () => ({
      completedQuestIds: [],
      mechChromaIds: [],
    })),
    grantAccountMechChroma: vi.fn(async () => ({
      completedQuestIds: [],
      mechChromaIds: [],
    })),
    setAccountWeaponSkinLoadout: vi.fn(async () => ({
      completedQuestIds: [],
      mechChromaIds: [],
      weaponSkinIds: [],
      weaponSkinLoadout: {},
      mountSkinIds: [],
    })),
    loadAccountFlair: vi.fn(async () => ({
      ai: false,
      streamer: false,
      links: {},
    })),
  };
}
