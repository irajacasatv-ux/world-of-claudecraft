// The per-guild HOLDER INDEX behind the unsettled gate and the escrow refusal
// arm: which live sessions hold unflushed work on which guild's book, with
// each holder's contribution (server/guild_bank_settle_gate.ts
// holderContribution) cached until its log changes. The gate used to walk
// every live session per gated op and fold every matching log; at the realm
// session cap and the op guard's rate that is tens of millions of session
// probes per second, so the index is maintained at the four places a mark or
// a log changes instead:
//
//   touch(session, guild)   an op landed (the mark was set, the log grew)
//   resync(session)         a save committed (a prefix was consumed, a mark
//                           may have cleared) or a rollback undid the log
//   dropGuild(guild)        the guild disbanded (every mark cleared)
//   dropSession(session)    the session left the realm
//
// A cached contribution is invalidated (never patched) on touch and resync,
// and recomputed lazily from the live log on the next read. Anything less
// exact is unsafe: a commit that consumed one entry while an op pushed
// another leaves the log the same LENGTH with different contents, and a
// length-keyed cache would then report the old deposit as unsettled and the
// new one as settled, which is exactly the consume the gate exists to refuse.
//
// The same module owns the flush coalescing: one flush in flight per holder
// (queued or running, however long the per-character save queue holds it),
// with a single re-arm behind it that fires only if the holder still carries
// work when the flush settles. Refusals cost their sender one op-guard token,
// so anything looser lets one officer stack saves on a dirty guildmate.

import type { GuildBankOpDelta } from '../src/sim/guild_bank';
import {
  contributesTo,
  type GuildBookContribution,
  type GuildBookDependency,
  holderContribution,
  SETTLED_BOOK,
  sumContributions,
  type UnsettledGuildBook,
} from './guild_bank_settle_gate';
import { gameMetricsCounters } from './http/game_signals';

/** The slice of a live session the index reads (structural, so GameServer's
 *  ClientSession satisfies it without the type dragging the whole class in). */
export interface GuildBookHolderSession {
  readonly escrowQuarantined: boolean;
  readonly left: boolean;
  readonly dirtyGuildBanks: ReadonlyMap<number, number>;
  readonly unflushedGuildBankOps: ReadonlyMap<number, readonly GuildBankOpDelta[]>;
}

/** How many holders one refusal may flush. The contributing filter normally
 *  leaves one; the bound is the ceiling for a book many officers are feeding
 *  at once, so a refusal can never fan out across a whole online guild. */
export const GUILD_BOOK_FLUSH_FAN_OUT_MAX = 4;

export class GuildBookHolderIndex<S extends GuildBookHolderSession> {
  // guild -> holder -> cached contribution, null while stale.
  private readonly byGuild = new Map<number, Map<S, GuildBookContribution | null>>();
  private readonly bySession = new Map<S, Set<number>>();

  /** An op landed on this guild's book for this session: index it and drop
   *  its cached contribution. */
  touch(session: S, guildId: number): void {
    let holders = this.byGuild.get(guildId);
    if (!holders) {
      holders = new Map();
      this.byGuild.set(guildId, holders);
    }
    holders.set(session, null);
    let guilds = this.bySession.get(session);
    if (!guilds) {
      guilds = new Set();
      this.bySession.set(session, guilds);
    }
    guilds.add(guildId);
  }

  /** The session's marks or logs changed outside an op (a commit consumed a
   *  prefix, a rollback undid the log): keep it indexed where it is still
   *  dirty with a stale contribution, drop it where it is not. */
  resync(session: S): void {
    const guilds = this.bySession.get(session);
    if (!guilds) return;
    for (const guildId of [...guilds]) {
      if (session.dirtyGuildBanks.has(guildId)) {
        this.byGuild.get(guildId)?.set(session, null);
        continue;
      }
      this.remove(session, guildId, guilds);
    }
  }

  /** The guild disbanded: every session's mark for it cleared. */
  dropGuild(guildId: number): void {
    const holders = this.byGuild.get(guildId);
    if (!holders) return;
    for (const session of holders.keys()) {
      const guilds = this.bySession.get(session);
      guilds?.delete(guildId);
      if (guilds && guilds.size === 0) this.bySession.delete(session);
    }
    this.byGuild.delete(guildId);
  }

  /** The session left the realm. */
  dropSession(session: S): void {
    const guilds = this.bySession.get(session);
    if (!guilds) return;
    for (const guildId of [...guilds]) this.remove(session, guildId, guilds);
  }

  /** Sessions other than `except` holding unflushed work on this guild's
   *  book. A quarantined session is never a holder: its work was undone on the
   *  live book the moment it was quarantined. A LEAVING session's work is
   *  still on the live book until its leave flush commits, so the gate counts
   *  it (`includeLeaving: true`); the escrow refusal arm does not, because a
   *  departing session is neither one to wait on nor one to flush again. */
  holders(guildId: number, except: S | null, opts: { readonly includeLeaving: boolean }): S[] {
    const out: S[] = [];
    const holders = this.byGuild.get(guildId);
    if (!holders) return out;
    for (const session of holders.keys()) {
      if (session === except || session.escrowQuarantined) continue;
      if (session.left && !opts.includeLeaving) continue;
      if (!session.dirtyGuildBanks.has(guildId)) continue;
      out.push(session);
    }
    return out;
  }

  /** The sum of every OTHER holder's contribution on this guild's book, the
   *  gate's input. Leaving sessions included: their work is live until their
   *  leave flush commits. */
  unsettled(guildId: number, except: S | null): UnsettledGuildBook {
    const holders = this.byGuild.get(guildId);
    if (!holders) return SETTLED_BOOK;
    const contributions: GuildBookContribution[] = [];
    for (const session of this.holders(guildId, except, { includeLeaving: true })) {
      contributions.push(this.contribution(holders, session, guildId));
    }
    return contributions.length === 0 ? SETTLED_BOOK : sumContributions(contributions);
  }

  /** The holders a refusal should flush: the ones whose work FEEDS the named
   *  dependency (every holder when none is named), never a leaving or
   *  quarantined one, and at most `max` of them. */
  contributors(
    guildId: number,
    except: S | null,
    dependency: GuildBookDependency | null,
    max = GUILD_BOOK_FLUSH_FAN_OUT_MAX,
  ): S[] {
    const out: S[] = [];
    const holders = this.byGuild.get(guildId);
    if (!holders) return out;
    for (const session of this.holders(guildId, except, { includeLeaving: false })) {
      if (out.length >= max) break;
      if (
        dependency === null ||
        contributesTo(this.contribution(holders, session, guildId), dependency)
      ) {
        out.push(session);
      }
    }
    return out;
  }

  /** How many guilds have at least one indexed holder (a leak pin for tests). */
  get size(): number {
    return this.byGuild.size;
  }

  private contribution(
    holders: Map<S, GuildBookContribution | null>,
    session: S,
    guildId: number,
  ): GuildBookContribution {
    let cached = holders.get(session) ?? null;
    if (cached === null) {
      cached = holderContribution(session.unflushedGuildBankOps.get(guildId) ?? []);
      holders.set(session, cached);
    }
    return cached;
  }

  private remove(session: S, guildId: number, guilds: Set<number>): void {
    const holders = this.byGuild.get(guildId);
    holders?.delete(session);
    if (holders && holders.size === 0) this.byGuild.delete(guildId);
    guilds.delete(guildId);
    if (guilds.size === 0) this.bySession.delete(session);
  }
}

/** The flush state a holder session carries. */
export interface GuildBookFlushSession {
  guildBookFlushInFlight: boolean;
  guildBookFlushRearm: boolean;
  readonly left: boolean;
  readonly escrowQuarantined: boolean;
  readonly dirtyGuildBanks: ReadonlyMap<number, number>;
}

/** Flush one holder, coalesced: while a flush is queued or running for it,
 *  a further request only arms ONE follow-up, which fires when the flush
 *  settles and only if the holder still carries work then. `save` must never
 *  reject (the host wraps its own logging around the real save). */
export function requestGuildBookFlush<S extends GuildBookFlushSession>(
  session: S,
  save: (session: S) => Promise<unknown>,
): void {
  if (session.left || session.escrowQuarantined) return;
  if (session.guildBookFlushInFlight) {
    session.guildBookFlushRearm = true;
    return;
  }
  session.guildBookFlushInFlight = true;
  session.guildBookFlushRearm = false;
  void save(session).then(
    () => settle(session, save),
    () => settle(session, save),
  );
}

function settle<S extends GuildBookFlushSession>(
  session: S,
  save: (session: S) => Promise<unknown>,
): void {
  session.guildBookFlushInFlight = false;
  const again = session.guildBookFlushRearm;
  session.guildBookFlushRearm = false;
  if (again && session.dirtyGuildBanks.size > 0) requestGuildBookFlush(session, save);
}

/** Mark a guild's book dirty for this session's next fenced escrow save: bump
 *  the session's own count and index it. Beside `touch`, which is the half it
 *  exists to pair with, so the count and the index can never be bumped apart. */
export function markGuildBookDirty<
  S extends GuildBookHolderSession & { dirtyGuildBanks: Map<number, number> },
>(index: GuildBookHolderIndex<S>, session: S, guildId: number): void {
  session.dirtyGuildBanks.set(guildId, (session.dirtyGuildBanks.get(guildId) ?? 0) + 1);
  index.touch(session, guildId);
}

/** The MUTABLE slice the revert below writes, kept apart from
 *  `GuildBookHolderSession` above, which is deliberately read-only: the index
 *  OBSERVES a session's book work, and this undoes it. */
export interface GuildBookRevertSession extends GuildBookHolderSession {
  readonly dirtyGuildBanks: Map<number, number>;
  readonly unflushedGuildBankOps: Map<number, GuildBankOpDelta[]>;
  readonly guildBankDeficitSkips: Map<number, number>;
}

/** The sim surface the revert touches: one call, named rather than the whole
 *  Sim, so this module cannot grow into a second coordinator. */
export interface GuildBookRevertSim {
  revertGuildBankDeltas(guildId: number, deltas: readonly GuildBankOpDelta[]): void;
}

/**
 * Undo one session's own unflushed guild-book work, moved here from the
 * coordinator so it can be driven by a Vitest with neither a GameServer nor a
 * Sim. SIX call sites reach it through the coordinator's two private wrappers,
 * counted rather than described because an earlier version of this line named a
 * census that did not match the tree: the leave path's teardown, the leave
 * save's exhausted-retry arm, the ledger-projection quarantine, the fence-out,
 * the takeover sweep, and the admin guild-bank purge, plus
 * server/guild_bank_escrow_refusal.ts through an injected port. None of them
 * checks for an empty id list, because this loop is the check: no ids means no
 * revert, no resync, no counter and no log.
 *
 * When this session's escrow can never commit again, its guild-book mutations
 * remain in the LIVE book while the character half rolled back (a same-account
 * takeover fenced it out) or never landed (the leave flush exhausted its
 * retries). SYNCHRONOUS and unconditional: replay exactly this session's own
 * unflushed deltas BACKWARD onto the live book, leaving every other session's
 * unflushed ops untouched.
 *
 * There is deliberately no evict-and-reload arm any more, and no cross-session
 * dirty scan to choose between arms. Under the escrow root fix a session's
 * payload contains only its own deltas, so a dead session's ops are in NO other
 * session's payload and durable truth can never have been advanced by them:
 * reloading the row would restore state that is either identical (a no-op) or
 * another officer's newer work (destroying it).
 *
 * EVERY unflushed delta is undone, with no exceptions to reason about: a save
 * either commits both halves or commits neither, so an unflushed delta never
 * has a durable character half behind it.
 *
 * NEVER THROWS, and that is load-bearing rather than tidy. Two of its callers
 * run inside a leaving session's teardown, one of them from inside a catch, and
 * it is now the FIRST statement of leave()'s finally, so a throw here would skip
 * every registration that makes the character re-enterable as well as the lease
 * release and removePlayer. A guild whose replay faults is logged and the
 * remaining guilds are still undone, because stopping at the first fault would
 * strand the rest of this session's book work with no session left to converge
 * it. The guard covers the WHOLE per-guild body rather than the sim call alone:
 * the holder resync and the process-wide counter sink are on this path too, and
 * neither is owned here.
 */
export function revertOwnGuildBookOps<S extends GuildBookRevertSession>(
  index: GuildBookHolderIndex<S>,
  sim: GuildBookRevertSim,
  dead: S,
  guildIds: readonly number[],
): void {
  for (const guildId of guildIds) {
    // THE WHOLE BODY, not the sim call alone. The header promises this never
    // throws and that a faulting guild leaves the rest undone, and a try around
    // one of four statements delivered neither: `index.resync` and the counter
    // sink both sit on this path, the counter sink is a process-wide mutable
    // slot that nothing here owns, and a throw from either aborted the loop and
    // then, because leave()'s finally calls this FIRST, skipped every
    // registration that makes the character re-enterable. That is the
    // round-fifteen lockout reached through the round-sixteen fix. The maps are
    // cleared before anything that can fault, so a guild is never revisited.
    const log = dead.unflushedGuildBankOps.get(guildId) ?? [];
    dead.dirtyGuildBanks.delete(guildId);
    dead.unflushedGuildBankOps.delete(guildId);
    dead.guildBankDeficitSkips.delete(guildId);
    try {
      index.resync(dead);
      if (log.length === 0) continue;
      // THE REVERT BEFORE THE COUNTER, because the ops log is already deleted
      // above and only one of these two can be lost. With the counter first, a
      // faulting sink (a process-wide slot nothing here owns) discarded that
      // guild's money revert permanently and left the deltas live with no log to
      // retry from; with the revert first, the same fault costs one telemetry
      // sample and the operator still gets the error line from the catch.
      sim.revertGuildBankDeltas(guildId, log);
      // Counted per GUILD, the unit the remedy applies to: reaching this at all
      // means a session that can never commit again held unflushed book ops,
      // the shape the Phase 3 QA dupe lived in. This is the ONE reconcile site
      // under the escrow root fix, so the counter lives here rather than at
      // five call sites. A guild whose log is already empty is a bookkeeping
      // no-op, not an incident, and is not counted.
      gameMetricsCounters().guildBankIncident('reconcile');
    } catch (err) {
      console.error(`guild book revert failed for guild ${guildId}; its ops stay live:`, err);
    }
  }
}
