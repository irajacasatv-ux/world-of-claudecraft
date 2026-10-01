// THE HOUSING COMPOSITION HOOK of the ordinary character save (07a deliverable
// 2; docs/freeholds/mutation-touch-set-manifest.md section 2 and P1). A housing
// mutation does not get a transaction of its own: it rides ONE character save
// (saveCharacterState, saveCharacterAndMarketState or
// saveCharacterAndGuildBankState, whichever the character's state calls for),
// so its item and gold halves and its housing halves commit together or not
// at all, behind the same lease-nonce fence every character write already
// passes.
//
// Where the hook runs is the whole contract:
// - its ACCOUNT participants join the save's ONE sorted KEY SHARE (G1), so no
//   accounts lock is ever first taken after the character row;
// - it runs only after the character UPDATE landed (the fence-miss exit rolls
//   back before it), after EVERY legacy effect (journal, ledger, market, mail,
//   guild books, storage, the custody tail), and immediately before COMMIT, so
//   no legacy participant is ever acquired after it;
// - a refusal it throws rolls back every half;
// - it is told when COMMIT was SENT and when COMMIT RESOLVED, so a lost answer
//   is an ambiguity the mutation boundary verifies (server/freehold_mutation.ts),
//   never a guess.
// The save variant that is never hooked is saveCharacterStateOnClient: its
// callers take legacy participants after it returns, which a hook would invert.
import type { BankLedgerSaveEffects } from './bank_ledger_save_effects_db';
import { lockCharacterSaveEffectAccountsOnClient } from './bank_ledger_save_effects_db';
import type { StorageAppliedEffect } from './storage_purchase_db';

/** The statements a hook issues: the save's own deadline-owning transaction. */
export interface CharacterSaveHousingQueryable {
  query(
    text: string,
    values?: unknown[],
  ): Promise<{ rows?: Record<string, unknown>[]; rowCount?: number | null }>;
}

export interface CharacterSaveHousingHook {
  /** Every account the hook will touch, added to the save's G1 set. */
  readonly accountIds: readonly number[];
  /** After every legacy effect, immediately before COMMIT. Throws to refuse. */
  run(tx: CharacterSaveHousingQueryable): Promise<void>;
  /** COMMIT is about to be sent: from here a lost answer is ambiguous. */
  commitSent(): void;
  /** COMMIT resolved with a COMMIT tag. */
  committed(): void;
  /** The admission bound for the save's WAITS only (the character FIFO, the
   *  market writer, the background permit). Never handed to the transaction:
   *  aborting a running transaction would manufacture an ambiguous commit. */
  readonly waitSignal?: AbortSignal;
  /** Wraps the whole character-FIFO job, inside the FIFO and before the market
   *  writer: the plot store's owner FIFO for a mutation that writes a plot row
   *  (the touch-set manifest's Q3), and the live apply right after a proved
   *  COMMIT. Absent means the job runs bare. */
  wrap?<T>(job: () => Promise<T>): Promise<T>;
  /** Wraps the database transaction call itself, INSIDE the background permit
   *  and after the save's client is released: the ambiguous-COMMIT verify runs
   *  here, so it rides the permit the save already held instead of taking a
   *  second one outside the gate. */
  wrapPersist?<T>(persist: () => Promise<T>): Promise<T>;
}

/** The save's transaction call, wrapped by the hook when it asks. */
export function housingPersist<T>(
  housing: CharacterSaveHousingHook | undefined,
  persist: () => Promise<T>,
): () => Promise<T> {
  if (!housing?.wrapPersist) return persist;
  return () =>
    (housing as Required<Pick<CharacterSaveHousingHook, 'wrapPersist'>>).wrapPersist(persist);
}

/** G1 for a save that may carry a hook: the legacy effects' accounts and the
 *  hook's, in ONE sorted KEY SHARE. Answers the ids it locked. */
export function lockSaveAccountsWithHousing(
  db: CharacterSaveHousingQueryable,
  storageEffects: readonly StorageAppliedEffect[],
  ledgerEffects: BankLedgerSaveEffects | undefined,
  housing: CharacterSaveHousingHook | undefined,
): Promise<readonly number[]> {
  return lockCharacterSaveEffectAccountsOnClient(
    db as Parameters<typeof lockCharacterSaveEffectAccountsOnClient>[0],
    storageEffects,
    ledgerEffects,
    undefined,
    housing?.accountIds ?? [],
  );
}

/** THE LAST STEP of a hooked save: refuse unless every hook account was locked
 *  at G1 (the order is load-bearing, so it is checked in code, not only in a
 *  comment), run the hook, then COMMIT with its tag checked. An unhooked save
 *  commits exactly as before. */
export async function commitWithHousing(
  transaction: CharacterSaveHousingQueryable & {
    commit(): Promise<void>;
    commitChecked(): Promise<void>;
  },
  housing: CharacterSaveHousingHook | undefined,
  lockedAccountIds: readonly number[],
): Promise<void> {
  if (!housing) {
    await transaction.commit();
    return;
  }
  for (const accountId of housing.accountIds) {
    if (!lockedAccountIds.includes(accountId)) {
      throw new Error('a housing account participant was not locked with the save accounts');
    }
  }
  await housing.run(transaction);
  housing.commitSent();
  await transaction.commitChecked();
  housing.committed();
}
