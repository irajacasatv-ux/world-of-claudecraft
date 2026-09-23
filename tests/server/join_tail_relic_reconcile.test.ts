// The join tail after `clients.set` runs outside the join window's try, so a
// synchronous throw there rejects the handshake with no leave scheduled
// (server/game.ts, THE RESIDUAL). The release's relic reconcile walks the
// whole character synchronously; the join must hand that walk to
// reconcileJoinedAccountRelics, which runs it inside its own guard.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server/account_ledger_db', () => ({
  insertAccountRelicFinds: vi.fn(async () => {}),
  loadAccountLedgerKeys: vi.fn(async () => ({ deeds: new Set(), relics: new Set() })),
}));

import { insertAccountRelicFinds } from '../../server/account_ledger_db';
import {
  reconcileJoinedAccountRelics,
  relicRecordsIdle,
} from '../../server/account_ledger_records';

const insertMock = vi.mocked(insertAccountRelicFinds);
const WHO = { characterId: 42, accountId: 7, name: 'Hilda', cls: 'warrior' as const };

beforeEach(async () => {
  await relicRecordsIdle();
  insertMock.mockClear();
});

afterEach(async () => {
  await relicRecordsIdle();
  vi.restoreAllMocks();
});

describe('reconcileJoinedAccountRelics', () => {
  it('swallows a throwing key walk, logs it and records nothing', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      reconcileJoinedAccountRelics(WHO, () => {
        throw new Error('walk failed');
      }),
    ).not.toThrow();
    await relicRecordsIdle();
    expect(insertMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('relic reconcile key walk failed:', expect.any(Error));
  });

  it('replays the walked keys UNDATED, exactly as the plain reconcile does', async () => {
    reconcileJoinedAccountRelics(WHO, () => ['item:cryptbone_helm']);
    await relicRecordsIdle();
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][1]).toEqual(['item:cryptbone_helm']);
    expect(insertMock.mock.calls[0][2]).toEqual({ undated: true });
  });

  it('is the form the join tail calls, with the walk deferred into its guard', () => {
    const game = readFileSync(new URL('../../server/game.ts', import.meta.url), 'utf8');
    expect(game).toContain('reconcileJoinedAccountRelics(who, () => selfRelicKeys(joinedMeta));');
    expect(game).not.toMatch(/reconcileAccountRelics\(/);
    expect(game.match(/selfRelicKeys\(/g)).toHaveLength(1);
  });
});
