// Low-frequency observability for the KEEP-FOREVER housing tables, today the
// operation receipts (freehold_operation_receipts, server/freehold_operation_db.ts).
// A receipt is the tombstone of a closed housing operation and PERMANENT replay
// authority: deleting one would re-enable its operation, and no signed
// replay-horizon evidence exists that would make a sweep safe, so the retention
// sweep deliberately has no arm for it (pinned absent by
// tests/server/main_retention_wiring.test.ts). Its growth is OBSERVED instead of
// swept: this monitor refreshes a process-local readout once a minute, and the
// woc_freehold_receipt_growth gauge (server/http/game_metrics.ts) reads that
// readout at scrape time, so a scrape never queries PostgreSQL. The shape is the
// bank ledger growth monitor's (server/bank_ledger_growth_monitor.ts).
//
// O(1) PER PASS, NEVER A COUNT(*): ONE catalog statement reads, for every table
// in FREEHOLD_RECEIPT_GROWTH_TABLES, pg_class.reltuples (the planner's row
// estimate, maintained by vacuum and analyze, and -1 until the table's first
// vacuum or analyze, which renders as UNKNOWN) and pg_total_relation_size (heap,
// indexes and TOAST, from file sizes). Neither scans a heap, so a pass costs the
// list length, not the table size. Each name resolves through to_regclass, so a
// database that has not applied a table yet reads it as ABSENT rather than
// failing the pass. It is not lock-free: pg_total_relation_size opens each
// relation with AccessShareLock (held only while that size is read), so it can
// wait behind an ACCESS EXCLUSIVE holder such as a boot DDL transaction; the
// statement timeout below bounds that to one missed telemetry beat.
//
// FREEHOLD_RECEIPT_GROWTH_TABLES is the extension point: 07b's history table
// joins that list and rides the same statement, session and cadence.
//
// Admission mirrors the bank monitor: tryAcquire on the shared background gate,
// so a busy gate skips the pass instead of queueing ahead of durability work, and
// a full pool is refused before checkout, so no telemetry waiter ever sits in
// pg-pool's queue. Active SQL is aborted and drained on stop, which main.ts
// awaits before pool.end(); if a non-full pool was opening a brand new socket,
// pg-pool may finish that attempt under its bounded connection timeout and
// pool.end() remains the final teardown authority. Every clock and timer is an
// injected port (nowMs, scheduleDeadline, scheduleRepeating), bound at the
// composition root in server/main.ts, so this module never names a wall clock
// or a timer itself (the freehold_* scan in tests/server/freehold_persist.test.ts)
// and its tests drive time by hand. The main-thread cost of a
// pass is one async round trip plus decoding one row per watched table,
// independent of how large any table grows, so, like the bank monitor, it bills
// nothing to the tick profiler.

import type { QueryResult, QueryResultRow } from 'pg';
import type { BackgroundDbPermit } from './background_db_gate';
import { boundedDatabaseError } from './freehold_bounded_error';

export const FREEHOLD_RECEIPT_GROWTH_MONITOR_INTERVAL_MS = 60_000;
export const FREEHOLD_RECEIPT_GROWTH_MONITOR_WALL_TIMEOUT_MS = 1_500;
export const FREEHOLD_RECEIPT_GROWTH_MONITOR_STATEMENT_TIMEOUT_MS = 1_000;

/** The keep-forever housing tables (in `public`) whose growth is observed
 *  rather than swept. Fixed, so it is also the gauge's whole `table` label
 *  vocabulary. 07b's history table joins here. */
export const FREEHOLD_RECEIPT_GROWTH_TABLES = Object.freeze([
  'freehold_operation_receipts',
] as const);

export type FreeholdReceiptGrowthTable = (typeof FREEHOLD_RECEIPT_GROWTH_TABLES)[number];

/** Arm a one-shot deadline and return its cancel: the housing store's
 *  scheduleDeadline shape (server/freehold_persist.ts). */
export type FreeholdReceiptGrowthDeadline = (callback: () => void, ms: number) => () => void;

/** Arm the repeating pass and return its cancel. The binding must not hold the
 *  process open (main.ts unrefs it). */
export type FreeholdReceiptGrowthRepeat = (callback: () => void, ms: number) => () => void;

/** One statement for the whole list, built once from fixed identifiers. The
 *  slot column keeps the answer in list order. */
function freeholdReceiptGrowthSql(tables: readonly string[]): string {
  const watched = tables
    .map((table, index) => {
      if (!/^[a-z_][a-z0-9_]*$/.test(table)) {
        throw new Error('freehold receipt growth table must be a simple lowercase identifier');
      }
      return `(${index + 1}, '${table}'::text, pg_catalog.to_regclass('public.${table}'))`;
    })
    .join(',\n               ');
  return `SELECT watched.table_name,
       relation.oid IS NOT NULL AS present,
       relation.reltuples::float8 AS reltuples,
       pg_catalog.pg_total_relation_size(relation.oid) AS total_bytes
  FROM (VALUES ${watched}) AS watched(slot, table_name, relid)
  LEFT JOIN pg_catalog.pg_class AS relation ON relation.oid = watched.relid
 ORDER BY watched.slot`;
}

export const FREEHOLD_RECEIPT_GROWTH_SQL = freeholdReceiptGrowthSql(FREEHOLD_RECEIPT_GROWTH_TABLES);

/** One raw catalog row, as the driver hands it back (float8 arrives as a
 *  number, bigint as a string). Decoded by observeFreeholdReceiptGrowth. */
export interface FreeholdReceiptGrowthRow {
  readonly table: unknown;
  readonly present: unknown;
  readonly reltuples: unknown;
  readonly totalBytes: unknown;
}

export interface FreeholdReceiptGrowthReading {
  readonly table: FreeholdReceiptGrowthTable;
  /** False when to_regclass resolved nothing: this database has not applied
   *  the table, so it has no measure at all. */
  readonly present: boolean;
  /** pg_class.reltuples, rounded. Null while PostgreSQL does not know (-1,
   *  before the table's first vacuum or analyze) and when absent. */
  readonly rowsEstimate: number | null;
  /** pg_total_relation_size. Null only when absent. */
  readonly bytes: number | null;
}

export interface FreeholdReceiptGrowthReadout {
  /** One reading per watched table, in list order; empty before the first
   *  accepted pass. */
  readonly tables: readonly FreeholdReceiptGrowthReading[];
  /** When the pass behind `tables` STARTED; null before the first one. */
  readonly observedAtMs: number | null;
}

/** undefined means malformed; null means PostgreSQL does not know yet. */
function decodeRowsEstimate(value: unknown): number | null | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  // -1 is the never-vacuumed, never-analyzed value: an estimate of nothing,
  // never zero rows.
  if (parsed < 0) return null;
  const rounded = Math.round(parsed);
  return Number.isSafeInteger(rounded) ? rounded : undefined;
}

function decodeBytes(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

/** Decode one pass's rows against the fixed list, or null when the answer is
 *  malformed (a missing, extra or reordered row, or an undecodable value). */
export function decodeFreeholdReceiptGrowthRows(
  rows: readonly FreeholdReceiptGrowthRow[],
): readonly FreeholdReceiptGrowthReading[] | null {
  if (rows.length !== FREEHOLD_RECEIPT_GROWTH_TABLES.length) return null;
  const readings: FreeholdReceiptGrowthReading[] = [];
  for (const [index, table] of FREEHOLD_RECEIPT_GROWTH_TABLES.entries()) {
    const row = rows[index];
    if (row.table !== table) return null;
    if (row.present !== true && row.present !== false) return null;
    // A relation dropped between to_regclass and the size read answers a NULL
    // size: that is absence, not a malformed reading.
    if (row.present === false || row.totalBytes === null) {
      readings.push(Object.freeze({ table, present: false, rowsEstimate: null, bytes: null }));
      continue;
    }
    const rowsEstimate = decodeRowsEstimate(row.reltuples);
    const bytes = decodeBytes(row.totalBytes);
    if (rowsEstimate === undefined || bytes === null) return null;
    readings.push(Object.freeze({ table, present: true, rowsEstimate, bytes }));
  }
  return Object.freeze(readings);
}

// Process-local. Only this module's monitor writes it, one pass at a time
// (refresh coalesces), so unlike the bank budget no ordering ticket is needed:
// no other writer can observe the database later than an in-flight pass.
let observedTables: readonly FreeholdReceiptGrowthReading[] = Object.freeze([]);
let observedAtMs: number | null = null;

/** Record one pass for the scrape-time gauge. False (and nothing recorded)
 *  when the rows are malformed, which the monitor reports as a failure. */
export function observeFreeholdReceiptGrowth(
  rows: readonly FreeholdReceiptGrowthRow[],
  nowMs: number,
): boolean {
  const readings = decodeFreeholdReceiptGrowthRows(rows);
  if (readings === null || !Number.isFinite(nowMs) || nowMs < 0) return false;
  observedTables = readings;
  observedAtMs = nowMs;
  return true;
}

export function freeholdReceiptGrowthReadout(): FreeholdReceiptGrowthReadout {
  return Object.freeze({ tables: observedTables, observedAtMs });
}

export interface FreeholdReceiptGrowthMonitorClient {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
  release(error?: Error | boolean): void;
  on(event: 'error', listener: (error: Error) => void): unknown;
  removeListener(event: 'error', listener: (error: Error) => void): unknown;
}

export interface FreeholdReceiptGrowthMonitorPool {
  connect(): Promise<FreeholdReceiptGrowthMonitorClient>;
  /** Public pg-pool occupancy counters make a non-queuing checkout enforceable
   * without reaching into pg-pool internals. */
  readonly totalCount: number;
  readonly idleCount: number;
  readonly waitingCount: number;
  readonly options: { readonly max: number };
}

export class FreeholdReceiptGrowthMonitorAborted extends Error {
  readonly code = 'FREEHOLD_RECEIPT_GROWTH_MONITOR_ABORTED' as const;

  constructor(message = 'freehold receipt growth monitor read aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export class FreeholdReceiptGrowthMonitorPoolBusy extends Error {
  readonly code = 'FREEHOLD_RECEIPT_GROWTH_MONITOR_POOL_BUSY' as const;

  constructor() {
    super('freehold receipt growth monitor skipped a saturated database pool');
    this.name = 'FreeholdReceiptGrowthMonitorPoolBusy';
  }
}

const pgErrorCode = (error: unknown): string | undefined =>
  (error as { code?: string } | null | undefined)?.code;

const errorForRelease = (error: unknown): Error =>
  error instanceof Error ? error : new Error('PostgreSQL freehold receipt growth monitor failed');

/** Pool checkout itself has no cancellation API. If cancellation wins while a
 * non-full pool is opening a new socket, reject now and destroy any eventual
 * client; pg-pool bounds that underlying connect attempt with its own timeout. */
function acquireMonitorClient(
  pool: FreeholdReceiptGrowthMonitorPool,
  signal: AbortSignal,
): Promise<FreeholdReceiptGrowthMonitorClient> {
  if (signal.aborted) return Promise.reject(new FreeholdReceiptGrowthMonitorAborted());

  // Refuse before connect() when occupancy says this call would queue: a queued
  // checkout cannot be cancelled, so the wall deadline would leave a ghost
  // telemetry waiter ahead of gameplay. The snapshot and connect() happen in one
  // synchronous turn, so another JavaScript caller cannot enter between them.
  if (pool.waitingCount > 0 || (pool.idleCount === 0 && pool.totalCount >= pool.options.max)) {
    return Promise.reject(new FreeholdReceiptGrowthMonitorPoolBusy());
  }

  let checkout: Promise<FreeholdReceiptGrowthMonitorClient>;
  try {
    checkout = pool.connect();
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let state: 'waiting' | 'aborted' | 'settled' = 'waiting';
    let abortError: FreeholdReceiptGrowthMonitorAborted | null = null;
    const detach = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      if (state !== 'waiting') return;
      state = 'aborted';
      abortError = new FreeholdReceiptGrowthMonitorAborted();
      detach();
      reject(abortError);
    };

    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();

    void checkout.then(
      (client) => {
        if (state === 'aborted') {
          client.release(abortError ?? new FreeholdReceiptGrowthMonitorAborted());
          return;
        }
        state = 'settled';
        detach();
        resolve(client);
      },
      (error) => {
        if (state !== 'waiting') return;
        state = 'settled';
        detach();
        reject(error);
      },
    );
  });
}

/** One bounded auto-commit catalog read. SET/RESET use an owned client so the
 * server-side timeout cannot leak to the next borrower. A known SELECT result
 * remains authoritative if RESET fails; only that client is poisoned. */
export async function readFreeholdReceiptGrowth(
  pool: FreeholdReceiptGrowthMonitorPool,
  scheduleDeadline: FreeholdReceiptGrowthDeadline,
  signal?: AbortSignal,
): Promise<readonly FreeholdReceiptGrowthRow[]> {
  const deadline = new AbortController();
  const cancelDeadline = scheduleDeadline(
    () =>
      deadline.abort(
        new FreeholdReceiptGrowthMonitorAborted('freehold receipt growth read timed out'),
      ),
    FREEHOLD_RECEIPT_GROWTH_MONITOR_WALL_TIMEOUT_MS,
  );
  const onOuterAbort = () => deadline.abort(new FreeholdReceiptGrowthMonitorAborted());
  signal?.addEventListener('abort', onOuterAbort, { once: true });
  if (signal?.aborted) onOuterAbort();

  let client: FreeholdReceiptGrowthMonitorClient | null = null;
  let released = false;
  let causalError: Error | null = null;
  let clientErrorListenerAttached = false;
  let abortListenerAttached = false;

  const detach = () => {
    if (abortListenerAttached) {
      abortListenerAttached = false;
      deadline.signal.removeEventListener('abort', onAbort);
    }
    if (client && clientErrorListenerAttached) {
      clientErrorListenerAttached = false;
      client.removeListener('error', onClientError);
    }
  };
  const release = (error?: Error) => {
    if (!client || released) return;
    released = true;
    detach();
    if (error) client.release(error);
    else client.release();
  };
  const onAbort = () => {
    if (released) return;
    causalError =
      deadline.signal.reason instanceof Error
        ? deadline.signal.reason
        : new FreeholdReceiptGrowthMonitorAborted();
    release(causalError);
  };
  const onClientError = (error: Error) => {
    if (released) return;
    causalError = error;
    release(error);
  };

  try {
    client = await acquireMonitorClient(pool, deadline.signal);
    client.on('error', onClientError);
    clientErrorListenerAttached = true;
    deadline.signal.addEventListener('abort', onAbort, { once: true });
    abortListenerAttached = true;
    if (deadline.signal.aborted) onAbort();
    if (released) throw causalError ?? new FreeholdReceiptGrowthMonitorAborted();

    try {
      await client.query(
        `SET statement_timeout = ${FREEHOLD_RECEIPT_GROWTH_MONITOR_STATEMENT_TIMEOUT_MS}`,
      );
    } catch (error) {
      if (causalError) throw causalError;
      release(errorForRelease(error));
      throw error;
    }
    if (released) throw causalError ?? new FreeholdReceiptGrowthMonitorAborted();

    let result: QueryResult;
    try {
      result = await client.query(FREEHOLD_RECEIPT_GROWTH_SQL);
    } catch (error) {
      if (causalError) throw causalError;
      if (pgErrorCode(error) === undefined) {
        release(errorForRelease(error));
      } else {
        try {
          await client.query('RESET statement_timeout');
          release();
        } catch (resetError) {
          release(errorForRelease(resetError));
        }
      }
      throw error;
    }

    if (!released) {
      try {
        await client.query('RESET statement_timeout');
        release();
      } catch (resetError) {
        release(errorForRelease(resetError));
      }
    }

    return result.rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        table: row.table_name,
        present: row.present,
        reltuples: row.reltuples,
        totalBytes: row.total_bytes,
      };
    });
  } finally {
    cancelDeadline();
    signal?.removeEventListener('abort', onOuterAbort);
    release();
  }
}

export interface FreeholdReceiptGrowthMonitorDeps {
  readonly pool: FreeholdReceiptGrowthMonitorPool;
  /** Immediate admission only: telemetry never queues ahead of durability. */
  readonly tryAcquireBackgroundPermit: () => BackgroundDbPermit | null;
  /** The clock and timer ports, bound by the composition root (server/main.ts). */
  readonly nowMs: () => number;
  /** Bounds the default read's wall time. */
  readonly scheduleDeadline: FreeholdReceiptGrowthDeadline;
  readonly scheduleRepeating: FreeholdReceiptGrowthRepeat;
  readonly read?: (
    pool: FreeholdReceiptGrowthMonitorPool,
    signal: AbortSignal,
  ) => Promise<readonly FreeholdReceiptGrowthRow[]>;
  /** False means the catalog answer was malformed, which is a monitor failure.
   * The timestamp is claimed BEFORE the read, so the readout's age describes
   * the snapshot. */
  readonly observe?: (rows: readonly FreeholdReceiptGrowthRow[], observedAtMs: number) => boolean;
  /** Handed the BOUNDED classification (boundedDatabaseError), never the raw
   *  error: a pg error's `detail` can carry row content into the log line. */
  readonly onError?: (error: Readonly<Record<string, unknown>>) => void;
  readonly intervalMs?: number;
}

export interface FreeholdReceiptGrowthMonitor {
  refresh(): Promise<void>;
  start(): void;
  stop(): Promise<void>;
}

export function createFreeholdReceiptGrowthMonitor(
  deps: FreeholdReceiptGrowthMonitorDeps,
): FreeholdReceiptGrowthMonitor {
  const read =
    deps.read ??
    ((pool: FreeholdReceiptGrowthMonitorPool, signal: AbortSignal) =>
      readFreeholdReceiptGrowth(pool, deps.scheduleDeadline, signal));
  const observe = deps.observe ?? observeFreeholdReceiptGrowth;
  const intervalMs = deps.intervalMs ?? FREEHOLD_RECEIPT_GROWTH_MONITOR_INTERVAL_MS;
  if (!Number.isSafeInteger(intervalMs) || intervalMs <= 0) {
    throw new RangeError(
      'freehold receipt growth monitor interval must be a positive safe integer',
    );
  }

  let cancelRepeat: (() => void) | null = null;
  let running: Promise<void> | null = null;
  let activeAbort: AbortController | null = null;
  let stopped = false;
  let failureStreak = false;

  const report = (error: unknown) => {
    if (failureStreak || stopped) return;
    failureStreak = true;
    try {
      deps.onError?.(boundedDatabaseError(error));
    } catch {
      // A diagnostic sink cannot turn a voided interval into a rejection.
    }
  };

  const refresh = (): Promise<void> => {
    if (stopped) return Promise.resolve();
    if (running) return running;
    const run = (async () => {
      let permit: BackgroundDbPermit | null;
      try {
        permit = deps.tryAcquireBackgroundPermit();
      } catch (error) {
        report(error);
        return;
      }
      if (!permit) return;

      const controller = new AbortController();
      activeAbort = controller;
      const startedAtMs = deps.nowMs();
      try {
        const rows = await read(deps.pool, controller.signal);
        if (stopped || controller.signal.aborted) return;
        if (!observe(rows, startedAtMs)) {
          throw new Error('freehold receipt growth monitor returned malformed catalog values');
        }
        failureStreak = false;
      } catch (error) {
        if (
          !stopped &&
          !controller.signal.aborted &&
          !(error instanceof FreeholdReceiptGrowthMonitorPoolBusy)
        ) {
          report(error);
        }
      } finally {
        if (activeAbort === controller) activeAbort = null;
        permit.release();
      }
    })().finally(() => {
      if (running === run) running = null;
    });
    running = run;
    return run;
  };

  return {
    refresh,
    start(): void {
      if (stopped || cancelRepeat !== null) return;
      void refresh();
      cancelRepeat = deps.scheduleRepeating(() => void refresh(), intervalMs);
    },
    async stop(): Promise<void> {
      if (stopped) return;
      stopped = true;
      if (cancelRepeat !== null) {
        cancelRepeat();
        cancelRepeat = null;
      }
      activeAbort?.abort(new FreeholdReceiptGrowthMonitorAborted());
      if (running) await running.catch(() => {});
    },
  };
}
