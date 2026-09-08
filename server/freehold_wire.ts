// Freeholds wire surface: the Hearth Key item-use guard and ten housing command bodies (freehold_enter,
// freehold_leave, place_furnishing, move_furnishing, remove_furnishing,
// undo_placement, redo_placement, pay_ledger, set_visit_policy,
// set_freehold_build_presence) plus the dispatch-time flag verdict. The case
// labels stay in game.ts. The command-schema suite scans that switch for the
// dispatch universe, and the labels ARE the protocol surface. This module owns
// the frame guards; the sim stays the single definition of legality.
//
// The flag verdict (refusedFreeholdCommand) is the server/rift_forge_gate.ts
// shape: FREEHOLDS_ENABLED is read per verdict, never captured at import, so
// tests and a supervised restart both see the live value, and the env read
// sits BEHIND the token-set short-circuit so only housing frames pay for it.
// That per-verdict read is affordable ONLY because the call site sits behind
// the per-session command lane; never call it from the 20 Hz world loop or
// the per-viewer broadcast pass (capture the verdict once per pass there).
// The refusal counter (gameMetricsCounters().freeholdRefused) is bumped by the
// game.ts call site, the rift forge shape, so the predicate stays pure.
//
// Scope is the server boundary only. The Sim methods stay live for the
// offline single-player world and the headless RL env (D3); a dark realm
// refuses every housing frame before the sim sees it, and its Sim boots with
// freeholdsEnabled false (server/sim_boot_config.ts, D85).
//
// The owner key (freeholdOwnerKeyForAccount) is the second server-only piece:
// game.ts stamps it at the addPlayer call from the session's authenticated
// account id, so the sim's owner-keyed claim (D15) can never be shaped by a
// client frame. The two payload-free arms (freehold_enter, freehold_leave)
// read NOTHING from the frame: an `ownerKey`, `accountId` or any other extra
// field on the wire is ignored, and the sim resolves the owner from the
// stamped meta alone.

import type { FreeholdVisitPolicy } from '../src/sim/freehold/types';
import type { Sim } from '../src/sim/sim';
import type { CommandName } from '../src/world_api';
import { freeholdsEnabled } from './freehold_config';
import type { ClientSession } from './game';

/** The ten housing wire tokens, pinned to the shared command vocabulary. */
export const FREEHOLD_WIRE_COMMANDS = [
  'freehold_enter',
  'freehold_leave',
  'place_furnishing',
  'move_furnishing',
  'remove_furnishing',
  'undo_placement',
  'redo_placement',
  'pay_ledger',
  'set_visit_policy',
  'set_freehold_build_presence',
] as const satisfies readonly CommandName[];

const FREEHOLD_CMD_SET: ReadonlySet<string> = new Set(FREEHOLD_WIRE_COMMANDS);

/**
 * The dispatch-time verdict: true when a scalar command or parsed frame
 * names housing (including use/hearth_key) and the realm is dark, in which case the caller refuses without touching the sim.
 * Other item-use frames and unknown commands follow normal dispatch.
 *
 * `env` is optional rather than defaulted so the hot dispatch call pays the
 * `process.env` object load only on housing wire tokens (the `??` sits behind
 * the short-circuit), not on every command frame.
 */
export function refusedFreeholdCommand(frame: unknown, env?: NodeJS.ProcessEnv): boolean {
  const msg =
    typeof frame === 'object' && frame !== null ? (frame as Record<string, unknown>) : null;
  const cmd = msg ? msg.cmd : frame;
  return (
    typeof cmd === 'string' &&
    (FREEHOLD_CMD_SET.has(cmd) || (cmd === 'use' && msg?.item === 'hearth_key')) &&
    !freeholdsEnabled(env ?? process.env)
  );
}

const JAILED_BLOCKED_COMMANDS = new Set<string>([
  'arena_queue',
  'bg_queue',
  'enter_dungeon',
  'enter_crypt',
  'enter_delve',
  'duel_req',
  'duel_accept',
  'unstuck',
  'card_queue_join',
  // A door step into instanced space (the enter_dungeon shape); freehold_leave
  // stays unlisted because leaving lands the player where jail enforcement re-cages them.
  'freehold_enter',
]);

/** The jail precheck recognizes the real item-use wire shape. */
export function refusedJailedTravelCommand(msg: Record<string, unknown>): boolean {
  return (
    typeof msg.cmd === 'string' &&
    (JAILED_BLOCKED_COMMANDS.has(msg.cmd) || (msg.cmd === 'use' && msg.item === 'hearth_key'))
  );
}

/** The freehold owner key of an account: `account:<id>` (D15). SERVER-ONLY,
 *  by construction and by contract: game.ts computes it at the addPlayer call
 *  from the account id the authenticated session already holds (never from a
 *  client frame), the sim keeps it on the session-only PlayerMeta stamp, no
 *  snapshot or event serializes it to any client, and the parity suite lists
 *  it in META_EXCLUDE. It keys the account's live record (ctx.freeholds) and
 *  its owner-keyed InstanceSlot claim (partyKey), so every character of one
 *  account resolves the same house. A non-positive or non-integer id throws
 *  rather than minting a shared sentinel: `account:NaN` would let every
 *  malformed session claim ONE house together, and the id is a database row
 *  fact, so a bad one is a programming error. The join REFUSES FIRST: planJoin
 *  (server/linkdead.ts) rejects such an id with `not authenticated` before
 *  any session or entity exists, so this throw is the unreachable last line
 *  of defense, never the path a caller's lease release or sibling logout
 *  ordering depends on. */
export function freeholdOwnerKeyForAccount(accountId: number): string {
  if (!Number.isSafeInteger(accountId) || accountId <= 0) {
    throw new Error(`freehold owner key needs a positive account id, got ${String(accountId)}`);
  }
  return `account:${accountId}`;
}

/** The three visit policies the wire may name, pinned to the sim's union. */
const VISIT_POLICIES = [
  'closed',
  'friends',
  'open',
] as const satisfies readonly FreeholdVisitPolicy[];
const VISIT_POLICY_SET: ReadonlySet<string> = new Set(VISIT_POLICIES);

function isVisitPolicy(v: unknown): v is FreeholdVisitPolicy {
  return typeof v === 'string' && VISIT_POLICY_SET.has(v);
}

/** A real coordinate: a number that is neither NaN nor infinite. */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** An id or sequence: a safe integer, never a float or a numeric string.
 *  RANGE IS NOT CHECKED HERE and must not be assumed downstream: zero and
 *  negative integers pass, so a slot, a placement id and a buildPresenceSeq all
 *  reach the stub unbounded below. This is the TYPE boundary only; the owning
 *  later work (08 for the slot and placement ids, C03 for the sequence) does
 *  the range and monotonicity checks against real state, in the sim, where the
 *  offline host enforces them too. */
function isSafeInteger(v: unknown): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v);
}

/** An opaque id off the wire, or null: 1 to OPAQUE_ID_MAX_LEN chars of the
 *  id charset (letters, digits, `_`, `:`, `-`). Neither id is read, stored,
 *  echoed or logged today; the bound exists so the ws maxPayload is never the
 *  only ceiling on a field C03 will start trusting. */
const OPAQUE_ID_MAX_LEN = 64;
const OPAQUE_ID_RE = /^[A-Za-z0-9_:-]+$/;

function isOpaqueIdOrNull(v: unknown): v is string | null {
  return (
    v === null || (typeof v === 'string' && v.length <= OPAQUE_ID_MAX_LEN && OPAQUE_ID_RE.test(v))
  );
}

/** Routes one housing command frame. `msg` is the already-parsed client
 *  frame (game.ts's ClientMessage, structurally a string-keyed record); every
 *  field is re-guarded here exactly as dispatchMessage guards its own cases:
 *  a TYPE boundary only, never a laundered or defaulted value. Returns
 *  whether the frame REACHED the sim (its guards passed and a sim method was
 *  invoked): the dispatch's heavy-self mark for any arm-marked housing member
 *  rides this answer (server/heavy_self.ts HEAVY_SELF_ARM_MARKED_CMDS), so a
 *  frame refused HERE never buys a heavy self re-serialize. The sim's own
 *  verdict is not visible here and is not claimed: true means invoked, never
 *  accepted. freehold_enter and freehold_leave are LIVE (the sim claims and
 *  leaves the owner-keyed room, and a sim-side refusal rides the text-free
 *  freeholdDenied event); the other eight Sim methods are still dark no-ops
 *  (their bodies land in later work), so those accepted frames change
 *  nothing yet. The dark-realm refusal above the switch in game.ts stays the
 *  ONE server gate for every arm, lit or dark. */
export function dispatchFreeholdCommand(
  sim: Sim,
  session: ClientSession,
  command: CommandName,
  msg: Record<string, unknown>,
  pid: number,
): boolean {
  // C03 binds the authenticated socket to build presence later; the parameter
  // is fixed from the start so that change touches no call site.
  void session;
  switch (command) {
    case 'freehold_enter':
      sim.freeholdEnter(pid);
      return true;
    case 'freehold_leave':
      sim.freeholdLeave(pid);
      return true;
    case 'place_furnishing':
      if (
        isSafeInteger(msg.slot) &&
        isFiniteNumber(msg.x) &&
        isFiniteNumber(msg.y) &&
        isFiniteNumber(msg.z) &&
        isFiniteNumber(msg.yaw)
      ) {
        sim.placeFurnishing(msg.slot, msg.x, msg.y, msg.z, msg.yaw, pid);
        return true;
      }
      return false;
    case 'move_furnishing':
      if (
        isSafeInteger(msg.placementId) &&
        isFiniteNumber(msg.x) &&
        isFiniteNumber(msg.y) &&
        isFiniteNumber(msg.z) &&
        isFiniteNumber(msg.yaw)
      ) {
        sim.moveFurnishing(msg.placementId, msg.x, msg.y, msg.z, msg.yaw, pid);
        return true;
      }
      return false;
    case 'remove_furnishing':
      if (isSafeInteger(msg.placementId)) {
        sim.removeFurnishing(msg.placementId, pid);
        return true;
      }
      return false;
    case 'undo_placement':
      sim.undoPlacement(pid);
      return true;
    case 'redo_placement':
      sim.redoPlacement(pid);
      return true;
    case 'pay_ledger':
      sim.payLedger(pid);
      return true;
    case 'set_visit_policy':
      if (isVisitPolicy(msg.policy)) {
        sim.setVisitPolicy(msg.policy, pid);
        return true;
      }
      return false;
    case 'set_freehold_build_presence':
      // The sender's acknowledged plot id, accepted transition id and
      // monotonic sequence are guarded here so a malformed frame is refused at
      // the type boundary (the two ids to the opaque-id shape, never an
      // unbounded string); only `active` reaches the stub today (C03 binds
      // the rest to the authenticated session later).
      if (
        typeof msg.active === 'boolean' &&
        isOpaqueIdOrNull(msg.plotId) &&
        isOpaqueIdOrNull(msg.acceptedTransitionId) &&
        isSafeInteger(msg.buildPresenceSeq)
      ) {
        sim.setFreeholdBuildPresence(msg.active, pid);
        return true;
      }
      return false;
    default:
      return false;
  }
}
