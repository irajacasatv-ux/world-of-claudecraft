import { describe, expect, it, vi } from 'vitest';
import {
  deleteUnusedFederatedProvision,
  FederatedProvisionFreeholdOperationOpen,
} from '../server/federated_auth_db';

// A pg DatabaseError's shape: the SQLSTATE and the CONSTRAINT field ride the
// error object itself (both guard raises set CONSTRAINT; neither sets a DETAIL).
function guardError(code: string, constraint: string | undefined, message: string): Error {
  return Object.assign(new Error(message), { code, constraint, severity: 'ERROR' });
}

describe('deleteUnusedFederatedProvision', () => {
  it('deletes only an unreachable password-less account and lets its seeded characters cascade', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: 7 }], rowCount: 1 });

    await expect(deleteUnusedFederatedProvision({ query } as never, 7)).resolves.toBe(true);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/password_set\s*=\s*FALSE/i);
    expect(sql).toMatch(/NOT EXISTS \(SELECT 1 FROM auth_tokens/i);
    expect(sql).toMatch(/NOT EXISTS \(SELECT 1 FROM apple_auth_links/i);
    expect(sql).toMatch(/NOT EXISTS \(SELECT 1 FROM discord_links/i);
    expect(sql).not.toMatch(/NOT EXISTS \(SELECT 1 FROM characters/i);
    expect(sql).toMatch(/RETURNING a\.id/i);
    expect(params).toEqual([7]);
  });

  it('reports false when a token, password, or federated link makes the account reachable', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    await expect(deleteUnusedFederatedProvision({ query } as never, 9)).resolves.toBe(false);
  });

  it('keeps the storage guard refusal and its message unchanged', async () => {
    const raw = guardError('55006', 'storage_purchases_open_delete_guard', 'storage_purchase_open');
    const query = vi.fn().mockRejectedValue(raw);

    const failure = await deleteUnusedFederatedProvision({ query } as never, 7).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toBeInstanceOf(FederatedProvisionFreeholdOperationOpen);
    expect((failure as Error).message).toBe(
      'federated provision cleanup refused: account 7 has an open storage purchase awaiting reconciliation',
    );
    expect((failure as Error).cause).toBe(raw);
  });

  it('throws the typed housing refusal for the freehold operation guard', async () => {
    const raw = guardError(
      '55006',
      'freehold_operations_open_delete_guard',
      'freehold_operation_open',
    );
    const query = vi.fn().mockRejectedValue(raw);

    const failure = await deleteUnusedFederatedProvision({ query } as never, 7).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(FederatedProvisionFreeholdOperationOpen);
    expect(failure).toMatchObject({
      name: 'FederatedProvisionFreeholdOperationOpen',
      code: 'FEDERATED_PROVISION_FREEHOLD_OPERATION_OPEN',
      accountId: 7,
      message:
        'federated provision cleanup refused: account 7 has an open housing operation awaiting its close',
    });
    expect((failure as Error).cause).toBe(raw);
    // Never the storage reading: an operator chasing a stuck purchase would
    // look in the wrong ledger.
    expect((failure as Error).message).not.toContain('storage purchase');
  });

  it.each([
    ['a 55006 naming another constraint', () => guardError('55006', 'some_other_guard', 'in use')],
    [
      'a 55006 with a near-miss housing constraint',
      () => guardError('55006', 'freehold_operations_open_delete_guard_v2', 'x'),
    ],
    [
      'a 55006 with a near-miss storage constraint',
      () => guardError('55006', 'storage_purchases_open_delete', 'x'),
    ],
    // A deliberate change: every 55006 used to read as a storage purchase.
    ['a constraint-less 55006', () => guardError('55006', undefined, 'object in use')],
    [
      'a 23503 carrying the housing constraint',
      () => guardError('23503', 'freehold_operations_open_delete_guard', 'fk'),
    ],
    [
      'a 23503 carrying the storage constraint',
      () => guardError('23503', 'storage_purchases_open_delete_guard', 'fk'),
    ],
  ])('rethrows %s raw', async (_label, makeError) => {
    const raw = makeError();
    const query = vi.fn().mockRejectedValue(raw);

    await expect(deleteUnusedFederatedProvision({ query } as never, 7)).rejects.toBe(raw);
  });
});
