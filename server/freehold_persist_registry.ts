// THE PROCESS-WIDE HANDLE on the realm's one housing store, and every answer a
// caller gets when there is not one. It is the server/unstuck_records.ts shape:
// the composition root registers the store it built, and shutdown, the join
// path and the metrics scrape reach it through here rather than through
// GameServer. Kept apart from server/freehold_persist.ts because none of it is
// store logic: it is a module-level variable and four total functions over it,
// each of which has to answer safely with NO store registered, which is a
// property worth reading in one place.

import { FREEHOLD_PRIMARY_PLOT_INDEX } from './freehold_db';
import { ABSENT_HEARTH_REVISION } from './freehold_hearth_load';
import { freeholdJoinVerdictCounts } from './freehold_join_answer';
import type { FreeholdPreloadOptions } from './freehold_login_bounds';
import {
  FREEHOLD_ABSENT_DURABLE_REV,
  FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS,
  type FreeholdPersistStats,
  type FreeholdPersistStore,
  type LoadedFreehold,
} from './freehold_persist';

let registered: FreeholdPersistStore | null = null;

/** The composition root's handle on the live store, so shutdown can drain
 *  without reaching into GameServer (the server/unstuck_records.ts shape).
 *  Passing null unregisters, which is what a test teardown does. */
export function registerFreeholdPersistStore(store: FreeholdPersistStore | null): void {
  registered = store;
}

/** The composition root's fresh-join read (server/ws_auth.ts, beside the bank
 *  bonus). Never rejects: with no store registered it answers a HOLD, so the
 *  join installs nothing and writes nothing rather than seeding a default over
 *  a row it could not read. */
export async function freeholdPreloadForAccount(
  accountId: number,
  opts?: FreeholdPreloadOptions,
): Promise<LoadedFreehold> {
  const store = registered;
  if (store) return await store.preload(accountId, opts);
  return freeholdPreloadUnavailable(accountId, 'no persistence store is registered on this host');
}

/**
 * The answer for a join that must not touch durable housing at all: a dark
 * realm, or a host with no store. It is a HOLD rather than an absence, so
 * installLoadedFreehold installs nothing and every later write for that account
 * is blocked. Answering absence here would be the dangerous shape: the sim
 * seeds a free default record for anyone who holds none, and an absence would
 * invite the store to mint an identity and persist that empty Inn Room over a
 * row this host never read.
 */
export function freeholdPreloadUnavailable(accountId: number, detail: string): LoadedFreehold {
  return {
    accountId,
    plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
    plotId: '',
    durableRev: null,
    state: null,
    hearthReadyAtMs: 0,
    // THROUGH THE CONSTANTS, not two bare zeroes. This file argues at length
    // that the plot fence and the hearth counter are different counters that
    // share a value, and spelling either as a literal here is how a later reader
    // learns they are one.
    hearthRevision: ABSENT_HEARTH_REVISION,
    recordWithheld: false,
    hold: {
      kind: 'unadmitted',
      detail,
      plotIndex: FREEHOLD_PRIMARY_PLOT_INDEX,
      durableRev: FREEHOLD_ABSENT_DURABLE_REV,
    },
  };
}

/** The scrape-safe counters, for the game-state metrics source. Zeroes when no
 *  store is registered, which is the honest reading of "nothing is loaded". */
export function freeholdPersistStats(): FreeholdPersistStats {
  return (
    registered?.stats() ?? {
      entries: 0,
      loaded: 0,
      dirty: 0,
      running: 0,
      pending: 0,
      held: 0,
      quiesced: 0,
      loads: 0,
      loadFailures: 0,
      loadFailuresByKind: {},
      writes: 0,
      writeFailures: 0,
      staleWrites: 0,
      permitWaitMsTotal: 0,
      queueWaitMsTotal: 0,
      writeMsTotal: 0,
      codecMsTotal: 0,
      loadMsTotal: 0,
      oldestDirtyAgeMs: 0,
      writeBytesTotal: 0,
      maxWriteBytes: 0,
      writesWithoutRecord: 0,
      preGateRefusals: 0,
      reasks: 0,
      reaskReads: 0,
      reaskMsTotal: 0,
      joinVerdicts: freeholdJoinVerdictCounts(),
      deferredWrites: 0,
      activeWrites: 0,
      leaveCaptures: 0,
    }
  );
}

/** Drain the registered store, if there is one. Never throws and never hangs:
 *  no store is a drained store. */
export async function freeholdPersistIdle(
  deadlineMs: number = FREEHOLD_PERSIST_SHUTDOWN_DRAIN_MS,
): Promise<boolean> {
  const store = registered;
  if (!store) return true;
  try {
    return await store.idle(deadlineMs);
  } catch {
    return false;
  }
}
