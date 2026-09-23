// Per-readout wire cadence: how often each throttled `self` block is rebuilt
// and re-serialized, and which events or player commands re-arm a gate early.
//
// MOVED OUT OF server/game.ts UNCHANGED. Every value, comment and named
// residual below is the one that shipped there; this file adds only the DT
// import and an `export` on the names the coordinator actually imports. The
// rest stay module-private exactly as they were, because a move that widens a
// module's public surface is not only a move. It is a declarative table
// with one responsibility (cadence policy), so it belongs beside the
// coordinator rather than inside it, and a reader looking for "how often does
// the market browse rebuild" now has one place to look.
//
// Every interval is derived from a stated Hz against the fixed 20 Hz tick, so
// changing DT can never silently change a cadence.

import { DT } from '../src/sim/types';

const ARENA_WIRE_HZ = 0.1;
export const ARENA_WIRE_INTERVAL_TICKS = Math.max(1, Math.round(1 / (DT * ARENA_WIRE_HZ)));
// Thornhollow Fields `bg` self key: 1 Hz covers the in-match clocks (wave respawn,
// match cap, carrier vulnerability) that tick by whole seconds; queue and match
// transitions force a fresh readout via lastBgWireTick resets (the arena
// staleness fix), and the flag/score events ride the event queue instantly.
const BG_WIRE_HZ = 1;
export const BG_WIRE_INTERVAL_TICKS = Math.max(1, Math.round(1 / (DT * BG_WIRE_HZ)));
// Personal battleground events that change the throttled `bg` readout the
// moment they land (found/start/flag plays/result/queue churn).
export const BG_WIRE_RESET_EVENTS = new Set([
  'bgQueued',
  'bgUnqueued',
  // The offer prompt is a 30 second clock the player must act on, so it must
  // never wait up to a BG_WIRE_HZ period to appear or to show a new accept.
  'bgProposed',
  'bgProposalUpdate',
  'bgFound',
  'bgStart',
  'bgFlag',
  'bgKill', // the board tallies moved: refresh them with the feed line
  'bgEnd',
]);
// A respawn is NOT in that set: the sim emits it pid-scoped for the RESPAWNER
// only, while the readout it invalidates (the match-wide `dead` column) is read
// by every member. A per-recipient reset would leave the other nine scoreboards
// showing bodies for up to one BG_WIRE_HZ period, which the offline host, which
// recomputes the view every frame, never does. So a respawn fans out to the
// whole match instead (bgRespawnRefreshPids), the shape the bgKill events
// already have because the sim emits one copy per member.
export const BG_RESPAWN_EVENT = 'respawn';
// Dungeon Finder personal readout cadence: the `df` payload carries
// whole-second clocks (queue wait, proposal countdown), so 2 Hz keeps the
// window live without re-serializing it at 20 Hz. The shared `dfb` board rides
// the same cadence and only re-sends when a listing actually changes.
const DF_WIRE_HZ = 2;
export const DF_WIRE_INTERVAL_TICKS = Math.max(1, Math.round(1 / (DT * DF_WIRE_HZ)));
// World Market browse readout cadence. The browse view is a filter + page over
// the whole listing book, the single most expensive per-viewer read in
// selfWireJson on a grown book, and nothing in it carries a sub-second clock,
// so 4 Hz keeps the window feeling live while capping the rebuild rate. The
// viewer's OWN market commands re-arm the gate (MARKET_WIRE_PROMPT_CMDS) so
// their search/buy/cancel feedback still lands on the next snapshot. On top of
// the cadence, a rebuild-only-on-change gate (sim.marketBrowseRevFor plus the
// query object identity) skips the rebuild entirely while nothing changed;
// MARKET_BROWSE_REFRESH_TICKS is its staleness backstop, the heavy-gate
// refresh idea applied here.
const MARKET_WIRE_HZ = 4;
export const MARKET_WIRE_INTERVAL_TICKS = Math.max(1, Math.round(1 / (DT * MARKET_WIRE_HZ)));
export const MARKET_BROWSE_REFRESH_TICKS = 40;
export const MARKET_WIRE_PROMPT_CMDS = new Set<string>([
  'market_search',
  'market_sell_price_check',
  'market_list',
  'market_list_instance',
  'market_buy',
  'market_sweep_quote',
  'market_sweep',
  'market_cancel',
  'market_collect',
]);
// Commission order board readout, the market recipe applied to the second
// O(realm-collection) read that shipped on the per-tick self path (issue
// #1298's `corder`): commissionOrdersFor walks the whole board and every
// open-scope order lands in EVERY viewer's projection, so the unconditional
// per-tick rebuild scaled with realm activity exactly like the market browse
// did. Same three layers: a 4 Hz cadence, a rebuild-only-on-change gate
// polling sim.commissionOrderBoardRev (viewer-independent: the projection is
// a pure function of board plus pid), and a staleness backstop. The viewer's
// OWN commission commands re-arm the gate for next-snapshot feedback.
const CORDER_WIRE_HZ = 4;
export const CORDER_WIRE_INTERVAL_TICKS = Math.max(1, Math.round(1 / (DT * CORDER_WIRE_HZ)));
export const CORDER_BOARD_REFRESH_TICKS = 40;
export const CORDER_WIRE_PROMPT_CMDS = new Set<string>([
  'open_commission_order',
  'cancel_commission_order',
  'accept_commission_order',
  'deliver_commission_order',
]);
// Known residual, named on purpose: the board revision is realm-global and
// corder has no proximity gate, so ONE board mutation anywhere re-triggers an
// O(board) rebuild for every online session at its next due tick. Under
// sustained churn (~4 mutations per second) the change gate degenerates to
// the plain 5x cadence win. If that rate ever materializes, the next lever is
// the bg readout's sharedMatchView memo shape: build the viewer-identical
// open-scope subset once per board revision and splice the per-viewer rows.
// The mail gate below shares the realm-global-revision half of this residual
// (any letter booked anywhere rebuilds every at-pillar viewer's inbox at up
// to 4 Hz); cheap now that mailInfoFor is bucket-based, and the
// per-recipient buckets make a per-recipient revision the natural follow-up.

// Ravenpost mailbox readout cadence, the market gate applied to `mail`: the
// view is a full projection of the viewer's delivered letters (bodies
// included) that used to re-serialize at 20 Hz for anyone standing at a raven
// pillar, and nothing in it carries a sub-second clock. On top of the cadence,
// a rebuild-only-on-change gate (sim.mailRevFor) skips the rebuild while
// nothing changed; MAIL_REFRESH_TICKS is its staleness backstop, and the
// viewer's OWN mail commands re-arm the gate so their take/delete/read
// feedback still lands on the next snapshot. The always-streamed O(1) `mailU`
// envelope count is deliberately NOT gated.
const MAIL_WIRE_HZ = 4;
export const MAIL_WIRE_INTERVAL_TICKS = Math.max(1, Math.round(1 / (DT * MAIL_WIRE_HZ)));
export const MAIL_REFRESH_TICKS = 40;
export const MAIL_WIRE_PROMPT_CMDS = new Set<string>([
  'mail_send',
  'mail_take',
  'mail_delete',
  'mail_read',
]);
