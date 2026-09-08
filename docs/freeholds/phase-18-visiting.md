# Phase 18: visiting

Wave A, the Cottage MVP. The spec is `progress.md` "18 Visiting"; the decisions are
`state.md` D8 (visitors are the live claim roster on `InstanceSlot.enteredBy`, never a
persisted log), D15 (guests enter under the owner's key exactly as a party member joins a
claim), `state.md` D10 (text-free events) and D76 (the friend admission fact is the
named owner character's outgoing friend list, read by the server). This phase ships the
`friends` (default) and `private` policies, the `set_visit_policy` command, visitor entry
through the gate by owner name with the friend fact decided by the server per D76, the
cap of 8, read-only visitors, the who-is-home line, and the offline no-op. Open-house
policies, caps by tier, and the door knock are Phase 26.

## Exact screenshot integration contract

06 registers nine functional gate/landing variants through
scripts/lib/pr_shot_freeholds.mjs::freeholdReviewTargets. 09 introduces the planned
scripts/lib/pr_shot_housing.mjs common helper, constructor and visual selector with
twelve additional day/night interior variants. 11 extends that same
scripts/lib/pr_shot_housing.mjs build target; 16/17/18 append their own functional
descriptors as their UI lands. Never register a later nonfunctional UI target. No new screenshot runner or multi-image capture API is introduced.
The registry has one optional-clip result and one image per uniquely keyed variant.

Registration is cumulative by actual producer: file 06 registers nine functional
gate and safe-landing variants; file 09 adds twelve day/night interiors (21 total); file 11 extends the registry to 98; file 16
reaches 187; file 17 reaches 235; file 18 reaches 339. File 20 verifies the complete
wave A set (339 of the 742-variant program inventory in ux-spec section 11; 21 to 42
register their own milestones and each wave close verifies its union). Earlier files
require only their registered working subset,
never nonfunctional future UI. These are derived inventory counts, not new gameplay
or tuning values.

The common housingVariants, housingVisualWhen and supplied beforeLoad are
owned initially by 09 and extended by 11 exactly as ux-spec.md section 11 defines them.
Append only this file's implemented target; validate the registered cumulative subset
of 339 working variants (the wave A set of the 742-variant program inventory). Later UI
targets register only when their producer lands:

```js
{
  key: 'housing-visiting',
  label: 'Housing gate, arrival and owner/guest entry states',
  when: [
    ...housingVisualWhen,
    'src/ui/hud/housing/visit_prompt_',
    'src/ui/hud/housing/housing_view.ts',
    'src/ui/hud/housing/steward_panel_',
    'src/sim/freehold/gate.ts',
    'src/sim/freehold/visiting.ts',
    'src/game/teleport_camera.ts',
  ],
  variants: [
    ...housingVariants([
      'gate-own-choice', 'gate-friend-empty', 'gate-lookup-pending',
      'gate-lookup-ready', 'gate-lookup-stale', 'gate-lookup-refused',
      'arrival-inn', 'arrival-cottage', 'arrival-ordinary-return',
      'arrival-visitor', 'arrival-online-delayed-cosmetics',
      'visit-read-only', 'visit-owner-away', 'visit-owner-building',
      'visit-full', 'visit-private-refused', 'visit-policy-draft',
      'visit-policy-pending', 'visit-policy-saved', 'visit-policy-refused',
      'visit-end-review', 'visit-end-pending', 'visit-end-succeeded',
      'visit-revoked', 'entry-pending', 'entry-error', 'entry-busy',
    ]),
    ...housingVariants(['arrival-inn', 'arrival-cottage'], { motion: 'reduce' }),
    ...housingVariants(['arrival-inn', 'arrival-cottage'], { light: 'ios-effective-one' }),
    ...housingVariants(['arrival-inn', 'arrival-cottage'], { graphics: 'high' }),
    ...housingVariants(['gate-lookup-ready'], { input: 'keyboard' }),
    ...housingVariants(['portrait-rotation-gate'], {
      views: housingViews.filter((view) => view.mobile).map((view) => ({
        ...view, key: `${view.key}-portrait`, width: view.height, height: view.width,
      })),
    }),
  ],
  capture: captureHousingVisiting,
},
```

Every captureHousing* stages exactly variant.scene through its real UI/authority
fixture, asserts the matching state and returns one optional-clip result. Interior
scenes use 09's full-viewport {}; UI scenes return { clip: '#ui' }. Missing required
after-state throws. The registered working subset must include every exact
target/variant and identity dimension for its producers; 20 verifies the full union.
No callback side shot or sequence-to-last-state substitute.

### Starter Prompt
```
This is Phase 18 of the Freeholds and Guildhalls feature: visiting (the friends and
private policies, set_visit_policy, visitor entry by owner name, the D76 friend
predicate, cap 8, read-only visitors, who-is-home, the offline no-op).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.
ULTRACODE: not needed for this phase (three slices on existing seams).

Goal: let a friend walk into your Cottage through the Eastbrook gate, see your
furnishings and trophies, and touch nothing, with the friendship fact decided by the
server from the named owner character's outgoing friend list (D76, never the visitor's
list and never the payload), at most eight visitors inside at once, and an owner-set
policy that persists on the record, while the offline host does nothing.

Asset execution: every step that creates or regenerates shipping GLBs, reference
artwork, icons or images MUST be done by Codex, not Claude. Use
.agents/skills/woc-image-to-glb/SKILL.md and its shared canonical workflow for GLBs;
use Codex image generation for raster artwork. Capture actual rendered screenshots
as evidence. Ship final assets with provenance, credits, manifest and in-context proof.
phase-44a-final-codex-artwork.md audits/replaces residual feature-created placeholder
icons/images and produces final-artwork-audit.md before phase-44b-final-legal-handoff.md.
That final sweep does not postpone artwork owned here. 44b revisits the completed result
for the legal team; all earlier counsel/Terms/platform/service money gates still apply.

STEP 0 - PRE-FLIGHT:
- Work in the packet worktree named in docs/freeholds/state.md
  (/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds), on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user (a concurrent
  session may share this checkout).
- Sync the base: `git fetch origin --prune`. While PR #3872 (feature/masterwrought) is
  OPEN, merge its fresh head: `git merge origin/feature/masterwrought`. If it has MERGED,
  discover the newest release branch (`git branch -r | grep 'origin/release/' | sort -V |
  tail -1`), compare with `git rev-list --left-right --count HEAD...origin/release/<newest>`,
  merge it, and delete the dependency block from state.md. After any non-empty merge run
  the release-merge-audit skill; `pnpm install --frozen-lockfile` if the merge touched
  patches/.
- Memory scan: MEMORY.md and entries on the server/tests gotcha cluster, the offline
  IWorld live-array aliasing trap, parity goldens and META_EXCLUDE, the monolith
  ratchet, ALL_DELTA_KEYS conflicts, test-pin traps.

- Invoke database-performance-reviewer before storage/query/lock/cadence decisions;
  send the scoped diff surface and approved artifacts, then review the finished diff.

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly; save your context):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md (only "18 Visiting"), and this
  file
- src/sim/freehold/instance.ts (Phase 05: freeholdKeyFor, the owner-keyed enterDungeon
  path, the freeholdDenied reasons already appended: no_freehold, locked, cooldown,
  visitors_full, not_friend, dead, combat), src/sim/freehold/placement.ts and
  amenities.ts and ledger.ts (the owner-only gate each command already carries),
  src/sim/freehold/state.ts and types.ts (the visit_policy field from Phase 07),
  src/sim/instances/dungeons.ts (enterDungeon, the module-private instanceClaimContains
  that this phase exports append-only, updateInstances, the enteredBy set: how it
  accumulates and when it clears), the InstanceSlot interface (enteredBy, clearedBy) in
  src/sim/instances/instance_slot.ts since 10 (re-exported as a type from src/sim/sim.ts)
- the session-only stamp precedent: stampGuildMembership and PlayerMeta.guildMembership
  (grep in src/sim/ and server/game.ts), applyBankBonusStamp in src/sim/bank.ts, the
  META_EXCLUDE set in tests/parity/trace.ts
- server/social.ts (the one-directional friendships table: SocialDb.listFriends is a
  character's outgoing list and SocialDb.whoFriended is the reverse lookup; friendAdd,
  friendRemove and blockAdd are the mutation sites where the D76 hook lands;
  SocialTransport; SocialSnapshot and FriendEntry), server/game.ts sendSocialSnapshot
  (read only to confirm it is NOT the feed: snap.friends is the viewer's own outgoing
  list and session.socialTrackedIds mixes friends AND guildmates), the block list on
  the session (session.blockedIds and the ignore predicate in routeEvents),
  server/freehold_wire.ts (dispatchFreeholdCommand: where a visitor enter and
  set_visit_policy arrive), server/heavy_self.ts (HEAVY_SELF_EVENTS),
  JAILED_BLOCKED_COMMANDS in server/game.ts (freehold_enter already listed by Phase 05),
  the command lane in dispatchMessage (classifyMsgLane: the rate limit a visit attempt
  inherits)
- server/game.ts routeEvents and server/event_frame.ts (pid-scoped delivery;
  EVENT_RADIUS for pid-less events), src/net/online.ts (the freehold event mirrors
  Phase 08 added), src/net/freehold_snapshot_wire.ts, src/world_api/housing.ts
  (freeholdVisitors, setVisitPolicy), tests/snapshots.test.ts
- src/ui/hud/housing/ (Phase 11 and 16: the housing_view.ts selectors, the barrel), the
  gate interact from Phase 06 (grep freehold_enter in src/game/ and src/ui/), the
  prompt_dialog.ts recipe (src/ui/prompt_dialog.ts) and a name-entry prompt precedent
  (grep the mail compose or the friend-add prompt), src/ui/i18n.catalog/hud_chrome.ts
- tests/feast_online.test.ts (two sessions, wire frames), tests/dungeon_instance_disconnect_reset.test.ts
  (GameServer.join with server/db mocked), tests/freehold_command_chain_online.test.ts,
  tests/dungeons.test.ts (the slim world), tests/monolith_budget.test.ts
- server/CLAUDE.md "Hot paths", root CLAUDE.md "Invariants"
The agent returns: the D76 admission read (whoFriended(visitor) or listFriends(owner)
in the bounded on-open lookup, rechecked at entry) and the three mutation sites
(friendAdd, friendRemove, blockAdd) where the NEW hook busts the visitor projection and
triggers the D51 recheck; the session-only stamp precedent (a Sim setter, a fence, the
META_EXCLUDE row) only for the admitted-guest marker on PlayerMeta, never as the friend
feed; how "present inside the claim" is computed from enteredBy plus
instanceClaimContains (exported append-only by this phase; enteredBy alone accumulates);
how a normalized owner name is resolved through bounded authoritative lookup/lazy load
without trusting client claims;
the pid-scoped event delivery for arrivals; the HEAVY_SELF gating of fhold; the
prompt dialog recipe; the extraction candidates that pay for any sim.ts, game.ts, or
online.ts line.

STEP 2 - CHOOSE ORCHESTRATION + EXECUTE:
Assign disjoint file ownership and integrate shared pins last.
Read ux-spec.md and the locked decisions in state.md through the context reader.
NEW paths/symbols below are planned deliverables, not existing tree anchors.

Deliverables (at most five):
1. Admission and live policy. visiting.ts authorizes friends/default or private
   from the host-supplied current admission facts; a guildmate alone is not a friend.
   The friend fact is D76: the NAMED owner character's outgoing friend list contains
   the visitor's character (friendships.character_id = owner, friend_id = visitor),
   read through whoFriended(visitor) or listFriends(owner) in the bounded on-open
   lookup and rechecked at entry; the visitor's own friend list is never an admission
   input. A block row on either side refuses: any character of the owner account
   blocking the visitor's character, or the visitor's character blocking any character
   of the owner account (the account-level block mapping 26 and 36 inherit). A name
   that resolves to an alt resolves to that account's plot, and only the named
   character's friend list is consulted. Count enteredBy intersected with actual claim
   presence (export instanceClaimContains from src/sim/instances/dungeons.ts
   append-only: a one-line export, no behaviour change) and exclude every session of the
   owner account, not just one pid. Inn Room and Cottage use the approved 8 visitor
   target; the ninth refuses without mutating and departure frees capacity. Private
   stops new admissions while existing guests may finish until exit; blocking,
   revoked friendship/membership and explicit owner End visit immediately eject safely
   through the recorded exit route. Every client command and amenity remains read-only
   for guests, including ledger, history, banking, station and policy controls.
2. Offline-owner authority and bounded lookup. server/freehold_visiting.ts is a NEW
   sibling for normalized name lookup, current authorization, lazy plot load and 07's
   global claim fence. Authorized friends may visit while the owner is offline.
   Bound input length, lookups, pending work, cache cardinality and loaded claims;
   reuse shared admission/cancellation/deadlines. A foreign-realm active claim or full
   runtime pool returns honest busy/retry, never an ownership waitlist or lost home.
   Cache raw projections only; entry rechecks current social/block/privacy authority
   and busts on committed changes. The bust feed is a NEW mutation-site hook (D76):
   friendAdd, friendRemove and blockAdd in server/social.ts call a NEW SocialTransport
   member (or a direct call into server/freehold_visiting.ts) that busts the visitor
   projection and triggers the D51 ejection recheck for any guest inside;
   sendSocialSnapshot is not the feed, and the in-memory SocialDb and transport fakes
   in tests/social_system.test.ts mirror the hook. Unknown/inaccessible/no-home
   requests share a privacy-safe denial without revealing account ownership. Do not
   require a live owner session map or prohibit the necessary bounded on-open SQL.
   Friend lookup and entry are separate operations. On the friend tab, Enter in
   the name field performs Find home; Enter destination is absent until a current
   authorized result matches request identity and normalized queried name. Editing
   the name immediately invalidates the prior result/capability and shows
   hudChrome.housing.gate.lookupChanged. Stale or out-of-order replies never display
   or authorize another draft. Successful lookup focuses its named result heading,
   announces it and exposes Enter; failure retains name/retry. Explicit entry repeats
   all live admission checks; physical gate does not inherit remote Hearth Key cooldown.
   The owner tab selects an owned plot and shows only its real admission restrictions.
3. Policy/event/wire lifecycle. set_visit_policy and NEW freehold_end_visit/
   endFreeholdVisit travel through IWorld, both worlds, command/schema/tags, jail/dark
   gates, server dispatch, strict wire and RL protocol parity. Use public plotId and
   admitted guest identity, never client-asserted account/relationship authority.
   freeholdVisitors is current names/presence only, owner-account sessions first;
   arrival/leave events are pid-scoped. No persisted visitor log or per-tick roster
   sweep. Standalone offline Sim has no remote visitors and remains session-only as
   D16 says; this is distinct from an offline owner on the online server. Policy
   persists through the existing globally fenced plot writer online.
4. Gate/guest experience. visit_prompt_view/window reuse the small shared decision
   window and blocking-confirmation recipe where needed. Phase 06 already opens the
   own-home/friend-name prompt on interaction; extend it without an auto-teleport or
   second gate dialect. Use the existing hudChrome.housing.gate.* keys for own/friend
   choice, name lookup, loading, entry errors and confirmed destination; use existing
   hudChrome.housing.visit.* keys for admitted guest state, privacy, roster and
   who-is-home. Match ux-spec's exact keys; add no second namespace or new strings.
   The two Phase 05 reasons 06 parks on hudChrome.housing.denied.permission get their
   own freeholdDeniedLineKey rows here (06 names this handoff): visitors_full maps to
   the existing hudChrome.housing.visit.full ("This home is full. Try again later.")
   and not_friend to the existing hudChrome.housing.visit.unavailable ("This home is
   not available to visit."); tests/housing_view.test.ts gains the two rows here.
   Authorized visitor view shows current visitor count/cap and read-only affordances;
   owner sees current roster, privacy and End visit. The decorating indicator consumes
   only 08a's authoritative freeholdState.isDecorating boolean from 08's ephemeral
   setFreeholdBuildPresence authority and 11's start/stop lifecycle. Never infer presence
   from camera/focus/rendering or a ghost. Host clears departed/revoked sessions and
   rejects stale plot/entry/sequence observations; concurrent eligible sessions aggregate
   privately. Guests see accepted layout only, never ghost/history/inventory/camera or
   actor/account identity. Existing visit-owner-building is the sole guest-observer
   screenshot identity, owned by 18 and backed by separate real two-client lifecycle
   proof. All focus, keyboard, pad, touch 16px input/40x40 targets, safe-area and
   close-return behavior follow ux-spec.md.
   Owner privacy/roster lives in a Visitors tab of steward_panel_view/window, beside
   Ledger, with an owner guest-status entry selecting that same tab. Show only current
   Private/Friends policies here, no disabled Guild/Public teasers. Radio edits a draft;
   confirmed policy remains separate until Apply visiting policy succeeds. Correlate
   operation/plot/revision; unrelated entry/placement events cannot complete Apply.
   Matching refusal preserves draft/reason; reconnect refreshes authority before enabling.
   Current guest list has loading/empty/error/reconnect states independent of drafts.
   End visit opens owner-inert confirmation for that guest; matching endPending/
   endSucceeded copy is distinct from entry pending. If the guest leaves first, refresh
   roster without another ejection, focusing next valid row then heading if empty.
   Closed windows stay closed after late results; guests receive no owner tab/draft.
   Focus: selected tab, confirmed-policy help, selected radio, Apply, roster/list and
   named End visit actions, Close. Who-is-home uses locale list formatting over escaped
   authorized names; owner-away is distinct from an empty guest/other-player roster.
5. Authority/UI proof. Real two-session tests cover online and offline owner,
   unknown-name denial, forged friend flag, the D76 direction negative (the visitor
   friended the owner and the owner did not friend the visitor: refused not_friend on
   both dispatch arms), the owner-side revocation eject (the owner runs /friend remove
   while the guest is inside: ejected within one routeTick without a relog), block
   (either side, any owner-account character) and revocation during visit, Private
   existing-guest rule, End visit, owner alt exclusion, stale cache and foreign-realm
   claim conflict. Disposable-PG evidence proves bounded lookup/lazy-load admission,
   cancellation and global fence, with query/index inventory and no private wire
   fields. Add exact housing-visiting capture entry below for desktop/compact/tablet
   gate/loading/error/full/private/guest/owner-building, and regenerate
   docs/freeholds/ux-key-manifest.json and docs/freeholds/ux-shot-manifest.json in this
   same change with every cited count updated: this file's registration reaches the
   339-variant wave A milestone (D92). Screenshot fixtures are not
   proof of authorization; record separate real two-client results. Dispatch
   architecture-reviewer, cross-platform-sync, frontend-seam-reviewer,
   privacy-security-review, server-hot-path-reviewer, migration-safety, before/final
   database-performance-reviewer, test-coverage-auditor and qa-checklist.

INVARIANTS THIS PHASE MUST KEEP:
- Server authority: the friend fact is the named owner character's outgoing friend
  list read by the server (D76: whoFriended(visitor) or listFriends(owner) in the
  bounded on-open lookup, rechecked at entry), never the visitor's own list, never the
  social snapshot and never the payload; admission, the cap, and every read-only
  refusal are decided in the sim on the server.
- Nothing ticks and nothing persists a visit (D8): the roster is the live claim; no
  visitor log table; the policy is the only persisted field.
- Determinism: no Rng, no wall clock; the same stamps and roster give the same
  admission on both hosts; the offline host is a no-op by construction.
- Privacy: a visitor learns no account IDs or private ownership facts; unknown/inaccessible/
  no-home names share one denial, while an authorized offline owner can be visited;
  a block row on either side (any owner-account character blocking the visitor's
  character, or the visitor's character blocking any owner-account character) wins
  over friendship without a distinct reason; a session-only stamp is in META_EXCLUDE
  with a justification.
- Never destroy, never sell power: visiting changes no number and no record beyond the
  policy field.
- Hot paths: the NEW mutation-site hook at friendAdd/friendRemove/blockAdd feeds live
  relationship changes (D76; sendSocialSnapshot is not the feed); bounded authorized
  lookup/lazy-load queries support offline owners. No SQL runs per frame or tick;
  admission and cancellation bound work, events are pid-scoped.
- Distribution: visiting is gated by the server entitlement (flag plus entitlement)
  read through the housing facet, never a HudFeatures row (D91).
- i18n: the policy in docs/freeholds/implementation-plan.md; every deny and arrival is a
  text-free id-carrying SimEvent (D10); names cross as values.
- Monolith: sim.ts, game.ts, and online.ts use the current verified
  tests/monolith_budget.test.ts ceilings; a delegate, case label, or mirror line is
  paid for by an extraction and a lowered ceiling.
- The word "phase" appears in no code, comment, commit, or PR text.

Out of scope (do NOT do in this phase):
- The guild and public policies, caps by tier, the door knock, the open-house listing,
  and public-entry rate limits (Phase 26).
- Guest books, reactions, showcases (Wave D).
- A persisted "who visited" log or any new table.
- Any change to the friends system itself.

STEP 3 - VALIDATION + REVIEW DISPATCH:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run: `npx tsc --noEmit`; `npx vitest run tests/freehold_visiting.test.ts`;
  `npx vitest run tests/housing_view.test.ts` (the two selector rows);
  `npx vitest run tests/freehold_visiting_online.test.ts`; `npx vitest run
  tests/visit_prompt_view.test.ts tests/architecture.test.ts tests/sim_context.test.ts
  tests/monolith_budget.test.ts tests/world_api_parity.test.ts
  tests/command_schema.test.ts tests/command_facets.test.ts tests/snapshots.test.ts
  tests/bandwidth.test.ts tests/env_protocol.test.ts
  tests/freehold_command_chain_online.test.ts tests/freehold_determinism.test.ts
  tests/dungeons.test.ts tests/dungeon_instance_disconnect_reset.test.ts
  tests/server/freehold_wire.test.ts tests/server/heavy_self.test.ts
  tests/hud_update_drive.test.ts tests/mobile_window_coverage.test.ts
  tests/social_system.test.ts tests/localization_fixes.test.ts`; `npm run i18n:gen`
  then `npx vitest run tests/i18n_completeness.test.ts`; regenerate both UX manifests
  (docs/freeholds/ux-key-manifest.json and ux-shot-manifest.json) per state.md "UX
  verification inventories" and compare exact counts (D92); the parity goldens with
  `UPDATE_PARITY=1` in their own commit if a scenario changed, then `npx vitest run
  tests/parity`.
- Spawn review agents per the dispatch rules in docs/freeholds/implementation-plan.md,
  the same nine as the required list above: architecture-reviewer (visiting.ts and the
  dungeons.ts export), cross-platform-sync (the policy command and the visitor reads on
  both hosts, the offline no-op), privacy-security-review (the D76 read direction, the
  hook, the existence oracle, the block mapping, names on the wire),
  database-performance-reviewer and migration-safety (the bounded on-open SQL and the
  persisted policy field), server-hot-path-reviewer (the hook, the event fan-out, the
  lane), frontend-seam-reviewer (the prompt and the Visitors tab), test-coverage-auditor
  and qa-checklist. Prompt each for COVERAGE not filtering; each writes its report to a
  file. Do not commit until ALL findings, including nits, are resolved and the fixes
  have fresh review.

- Required reviewers for the complete settled diff: architecture-reviewer,
  cross-platform-sync, frontend-seam-reviewer, privacy-security-review,
  server-hot-path-reviewer, migration-safety, database-performance-reviewer,
  test-coverage-auditor and qa-checklist.
  Database performance reviews happen before implementation decisions and again on
  the finished diff; persistence/security pair on stored/authority surfaces. Runtime
  PG evidence, bounded workload/query/index/byte limits and cancellation are required.

STEP 4 - COMMIT CADENCE:
4 commits, Conventional Commits with scope and a body, EXPLICIT paths, never
`git add -A`, no em dashes or emojis, the word "phase" nowhere in the message:
- feat(sim): admit friends to a freehold under the owner's policy and cap
- feat(server): read the owner's friend list at admission and route visitor entry
- feat(ui): add the visit prompt and the who-is-home line
- test(server): prove friends-only visiting across two live sessions
Then run the shared contribution gate from docs/qa-gate.md, including
`node scripts/gate_select.mjs` when required, and `npm run ci:changed` after the LAST
commit as the Stop-hook floor; record exact exit codes.

STEP 5 - ACCEPTANCE CRITERIA (do not mark complete until all check):
- [ ] Every one of the five settled STEP 2 deliverables and all linked ux-spec.md states
  has implementation, decisive evidence and a fresh review; earlier summary prose never
  overrides the settled contract. Numeric references match state.md and approved artifacts.
- [ ] With policy friends a visitor on the named owner character's outgoing friend
  list enters under the owner's key; a visitor who friended the owner while the owner
  did not friend the visitor refuses not_friend on both dispatch arms (D76); a stranger
  and a guildmate-only refuse not_friend; a blocked player refuses not_friend on either
  side of the block and for any owner-account character; and with policy private new
  guests refuse while existing admitted guests may finish until exit unless blocked,
  revoked or explicitly ended (each a pin).
- [ ] The ninth visitor refuses visitors_full; a visitor who left frees the slot (the
  count uses presence, not the accumulated enteredBy); all owner-account sessions are excluded from the visitor count.
- [ ] Every placement, pay, amenity, and policy command refuses not_owner for a visitor
  without mutating (one pin per command through a visitor session).
- [ ] freeholdVisitors lists the players inside on both hosts; the owner receives
  freeholdVisitorArrived and freeholdVisitorLeft; the fhold arm round-trips.
- [ ] Unknown/inaccessible/no-home names share the same denial; an authorized offline
  owner loads lazily behind the global fence. No account ID/friend list crosses wire.
- [ ] Blocking, revoked friendship and End visit eject immediately and safely: the
  owner running /friend remove while the guest is inside ejects the guest within one
  routeTick without a relog through the D76 hook (pinned in the two-session test and
  mirrored in tests/social_system.test.ts); stale caches never authorize entry, and
  foreign-realm claims return truthful retry.
- [ ] Offline: no stamp, no visitor path, the policy updates the live record only and a
  fresh Sim starts at the friends default (pinned, D16); the RL ACTIONS pin is unchanged.
- [ ] The two-session online test passes; sim.ts, game.ts, online.ts ceilings are not
  higher than before.
- [ ] Both UX manifests are regenerated in this change with every cited count updated
  (the housing-visiting registration reaches the 339-variant wave A milestone) and the
  exact comparison passes (D92).
- [ ] All STEP 3 suites green; all triggered reviewers confirm ALL findings, including nits, are resolved and freshly reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- Update docs/freeholds/progress.md (status row 18, notes, named unsigned release
  gates) and docs/freeholds/state.md (the per-phase ledger row 18: the module, the
  admitted-guest stamp field and its META_EXCLUDE row, the D76 hook member, the
  dungeons.ts export, the events, the fhold fields, the i18n keys, the prompt window
  id; the cap of 8 recorded as an MVP literal).
- Record surprising rules learned in memory for the next session.

STEP 7 - FINAL RESPONSE FORMAT:
End with: phase status, files touched, validation results, review verdicts, external release gates, and the FULL PATH of the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-18-qa.md

STOPPING RULES:
- Stop if authorization would rely on a stale cosmetic cache or unbounded database
  lookup; use the locked bounded on-open authority/lazy-load contract for offline owners.
- Stop if visitor presence cannot be derived from the live claim without a new tick
  sweep or a persisted log (D8).
- Stop if a monolith ceiling would have to be RAISED; that is a maintainer decision.
- Do not push the branch; never merge a PR.
```
