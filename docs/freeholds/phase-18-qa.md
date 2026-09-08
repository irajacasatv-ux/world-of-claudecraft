# Phase 18 QA: audit visiting

Audits `phase-18-visiting.md`. Verdict goes in `progress.md` (row "18 QA"). The next
implementation phase never starts before this file has run.

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
This is Phase 18 (QA) of the Freeholds and Guildhalls feature: audit visiting (the
friends and private policies, set_visit_policy, the D76 friend predicate, the cap of
8, read-only visitors, who-is-home, the offline no-op).

Harness: Claude Code. Follow the root CLAUDE.md "Working style by model capability"
block for effort and fan-out; this prompt names no model.

Goal: audit the Phase 18 diff for correctness against every deliverable and acceptance
criterion in docs/freeholds/progress.md "18 Visiting", missing tests, dead code, the
D76 friend-predicate direction and its mutation-site hook, the existence-oracle frame,
the presence-based cap, the
per-command read-only refusals, three-host parity, and the no-persisted-log rule; fix
what the audit finds; record a verdict.

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
- Work in the packet worktree named in docs/freeholds/state.md, on branch
  feature/freeholds. Verify `git status` is clean; if not, ask the user.
- Sync the base per state.md "Worktree, base, and merge-forward" (merge
  origin/feature/masterwrought while PR #3872 is open, else the newest
  origin/release/**; release-merge-audit after a non-empty merge; pnpm install
  --frozen-lockfile if patches/ moved).
- Memory scan: MEMORY.md, the test-pin traps catalog, the server/tests gotcha cluster,
  the offline IWorld live-array aliasing trap, "review the review-fix round", "apply ALL
  findings".

STEP 1 - LOAD CONTEXT (do NOT read planning docs directly):
Spawn one Explore agent to read and summarize:
- docs/freeholds/state.md, docs/freeholds/progress.md ("18 Visiting" and the row),
  docs/freeholds/phase-18-visiting.md (what was promised)
- the Phase 18 diff: `git log --oneline <phase-start>..HEAD` and
  `git diff <phase-start>..HEAD --stat`, then the full diff of every touched file (the
  commits named in progress.md row 18)
- the pins the diff claims: tests/freehold_visiting.test.ts, tests/housing_view.test.ts
  (the visitors_full and not_friend selector rows),
  tests/freehold_visiting_online.test.ts, tests/visit_prompt_view.test.ts,
  tests/snapshots.test.ts (the fhold arm), tests/parity/trace.ts (the META_EXCLUDE row),
  tests/server/freehold_wire.test.ts, tests/server/heavy_self.test.ts,
  tests/social_system.test.ts (the D76 hook mirror)
The agent returns: the promised-versus-delivered table per deliverable, the list of new
symbols and where each is consumed, where the friend fact is read (whoFriended(visitor)
or listFriends(owner); never snap.friends, never socialTrackedIds, never the visitor's
own list), where the friendAdd/friendRemove/blockAdd hook lands and what it busts, how
presence is counted, the
exact frames answered for an unknown name, an offline owner, and a name that owns no
freehold, every test added with what it asserts, and any TODO, unused import, or new
table or per-tick roster walk.

STEP 2 - AUDIT (fresh parallel reviewers, COVERAGE, all findings to files):
- CORRECTNESS reads every one of the five settled deliverables in
  phase-18-visiting.md, all its STEP 5 criteria, the linked ux-spec.md
  states and state.md decisions against the full diff. Every promised behavior must
  have a named implementation consumer; a copied constant or stated intention is not
  delivery. Specifically audit this exact settled contract:

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

- TEST COVERAGE verifies decisive literal/source and negative assertions for every
  boundary above, including actual work before equality, real async/race outcomes and
  honest unknown/denied states, and the two D76 decisive negatives: "visitor friended
  owner, owner did not: refused not_friend on both dispatch arms" and "owner runs
  /friend remove while the guest is inside: ejected within one routeTick without a
  relog" (a "forged friend flag" case alone proves only payload independence). Missing
  before/after capture, skipped environment test, unaccepted release gate or absent
  artifact is explicit, never silently PASS.
- HYGIENE checks source anchors and imports, ownership, no dead/TODO code, actual
  monolith ceilings, all i18n render sinks and generated-artifact obligations (both UX
  manifests regenerated in the 18 change with the cited counts updated to the
  339-variant wave A milestone, D92), no
  em/en dash or emoji and no forbidden purchase language. Cross-check every numeric
  literal to state.md Content numbers or its measured/accepted artifact.
Then dispatch every reviewer the implementation STEP 3 and canonical surface matrix
requires, including test-coverage-auditor and qa-checklist. Do not run duplicate shared
commands; inspect parent evidence. Apply ALL findings, including nits, then a fresh
reviewer reads the fixes before the verdict.

STEP 3 - VALIDATION:
Required named reviewers for this file: architecture-reviewer, cross-platform-sync,
privacy-security-review, database-performance-reviewer, migration-safety,
server-hot-path-reviewer, frontend-seam-reviewer, test-coverage-auditor, qa-checklist.
Database-performance-reviewer runs before implementation decisions and again on the
finished diff; pair with migration-safety and privacy-security-review as listed.
The QA session inspects those reports and dispatches a fresh review of every fix.
- Run the Phase 18 STEP 3 suite list plus `npx tsc --noEmit`.

STEP 4 - FIX:
- Resolve ALL findings, including NICE-TO-HAVE items and nits. Correct any conflict
  with a locked decision consistently before PASS; never defer the finding. Re-run the validation matrix. Commit fixes
  separately from the verdict, Conventional Commits with scope and body, EXPLICIT paths,
  never `git add -A`, the word "phase" nowhere. Then review the fix commits with a FRESH
  reviewer (fixes are unreviewed code until someone reads them). `npm run ci:changed`
  after the last commit; read the exit code.

STEP 5 - ACCEPTANCE:
External signatures stay explicit release gates attached to completed handoff artifacts;
they are not deferred review findings. PASS requires ALL findings, including nits,
resolved and a fresh review of the complete fix round.

- [ ] The complete five-deliverable settled contract above, exact screenshot entries and
  ux-spec.md states are checked against real evidence; no unresolved scope ruling remains.
- [ ] Every Phase 18 acceptance box is verified by a check that ran, not by inspection.
- [ ] docs/freeholds/ux-key-manifest.json and ux-shot-manifest.json were regenerated in
  the 18 change and the exact comparison ran (the 339-variant wave A count, D92).
- [ ] The two D76 decisive negatives ran and passed: the direction case refused
  not_friend on both dispatch arms, and the owner-side /friend remove ejected the guest
  within one routeTick without a relog.
- [ ] ALL findings, including nits, are resolved; a fresh reviewer has reviewed the fix round.
- [ ] The fix commits were reviewed.

STEP 6 - DOC UPDATES + MEMORY:
- progress.md row "18 QA": verdict (PASS / FAIL), counts found and
  fixed, external release gates. state.md: anything the fixes changed in the ledger row.
- Record surprising rules learned in memory.

STEP 7 - FINAL RESPONSE FORMAT:
End with: the QA verdict, counts found and fixed, external release gates, and the FULL PATH of
the next file to run:
/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-19-art-batch.md

STOPPING RULES:
- A FAIL verdict stops the packet: record it and name the Phase 18 file as the next file
  to re-run with the findings attached.
- Do not push the branch; never merge a PR.
```
