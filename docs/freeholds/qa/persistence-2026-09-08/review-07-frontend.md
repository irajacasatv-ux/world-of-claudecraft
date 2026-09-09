# Frontend seam review, phase 07 persistence (c18facd4cc..HEAD)

**Out of scope for the presentation-seam checks.** No changed path is under `src/ui/`,
`src/styles/`, `src/render/`, and neither `src/game/ui_tier_knobs.ts`,
`src/game/ui_effects_profile.ts` nor the `src/main.ts` client firewall is touched
(`server/main.ts` is the server entry, a different file). The only non-test `src/` files in
the diff are `src/sim/freehold/{persisted,load_report,types,index}.ts` and `src/sim/jail.ts`,
all sim-side. Checks 1 to 8 have no surface to run against.

Gates run anyway, because they cover the sim-purity and source-scan claims that feed the
presentation barrel:
- `npx tsc --noEmit`: exit 0.
- `npx vitest run tests/architecture.test.ts tests/freehold_module.test.ts`: 2 files, 136
  tests, all pass.
- Monolith ratchet, presentation half: `src/ui/hud.ts` 18436 and `src/render/renderer.ts`
  12844 lines, byte-identical to the literals `docs/freeholds/state.md:23` records. No
  presentation coordinator grew.

## Q1: does anything here create a future presentation obligation?

One, and it is real.

`[NOTE] (confidence: high) server/freehold_persist.ts:328-345, 964; docs/freeholds/persistence-rollout-contract.md:151`
A write-blocked hold is invisible to the player, in a way that will read as data loss the
moment housing lights up.
- Failure scenario: an account's `account_freeholds` row is unsupported, malformed, oversize
  or unadmitted. `installLoadedFreehold` returns early (`freehold_persist.ts:964`, `hold !==
  null`), so the sim seeds its free tier-0 Inn Room instead. The player logs in and sees an
  EMPTY Inn Room where their furnished plot was. They re-place furniture; every placement is
  accepted in memory because the sim knows nothing about the hold. At flush the store's
  `blocked()` predicate (`:271`) refuses the write, correctly, to protect the real row. The
  session's work is discarded with no message. The only signal anywhere is one server-side
  `console.warn` (`:339`), a dev channel no player can read.
- The rollout contract acknowledges half of this ("a hold is a REFUSAL TO WRITE, never a
  refusal to serve: the account keeps playing, and only its housing writes quiesce",
  `persistence-rollout-contract.md:149-151`) but never states the player-facing consequence
  or names a phase that owes the surface.
- Not a defect in THIS diff: `FREEHOLD_RECOVERY`/`FreeholdRecoveryHold` never leaves
  `server/freehold_persist.ts` (grepped across `server/`, `src/`, `tests/`: zero references
  outside that file), the feature is dark behind `FREEHOLDS_ENABLED`, and adding a player
  string now would be speculative UI for an unshipped state.
- Concrete follow-up to record: when the housing UI phase lands, the hold needs one wire flag
  and one `hudChrome.*` `t()` key on the freehold window ("This home could not be loaded;
  changes made now will not be saved"), added English-only to
  `src/ui/i18n.catalog/hud_chrome.ts`. Confirm by grepping for a consumer of
  `FreeholdRecoveryHold` outside `server/freehold_persist.ts`; today there is none.

Nothing else. The Hearth Key cooldown becoming account-authoritative changes no client
surface: `hearthKeyTooltipLines` (`src/ui/hud.ts:462,6707`) is untouched, and
`installLoadedFreehold` only ever moves `ctx.freeholdKeyReadyAtMs` FORWARD
(`freehold_persist.ts:969-972`), so a session's rendered cooldown stays monotonic. The new
barrel exports (`FREEHOLD_MAX_LAYOUT_ROWS`, `FREEHOLD_MAX_TROPHY_ROWS`,
`src/sim/freehold/index.ts:44-58`) are the right constants for a future "N placements left"
readout to import rather than redeclare; that is a positive, not a finding.

## Q2: is the housing i18n surface untouched?

Yes, cleanly. Evidence:
- No `src/ui/`, `src/ui/i18n.catalog/`, `src/ui/i18n.locales/`, `src/ui/i18n.status.json` or
  `src/styles/` file appears in `git diff --name-only c18facd4cc..HEAD`.
- Zero `t(` calls, zero DOM references, zero `aria-`/`title`/`innerHTML`/`textContent` in the
  added lines (grepped the whole range).
- Every new string is dev-channel English: the `console.warn` in
  `src/sim/freehold/load_report.ts:107-110`, the `ports.warn`/`ports.error` lines in
  `server/freehold_persist.ts` (`:339`, `:1172`, `:1344`), and validation `throw`s in
  `server/freehold_db.ts` / `server/freehold_hearth_db.ts` that no catch surfaces to a client.
  `load_report.ts:16-18` states the rule explicitly and the file holds it: the diagnostic is
  counts plus a positively-shaped classification, never row content.
- No new client-bound error string. The two `refuse(...)` details
  (`server/freehold_persist.ts:1826,1851` in diff coordinates: 'the local load admission cap
  is full', 'the durable load threw') land in a `FreeholdRecoveryHold` that feeds
  `ports.warn` only; `ws_auth.ts:152-158` documents that the read never rejects, so no
  handshake failure string is added either.
- The S3 drift guard was extended to cover both new sim modules
  (`tests/localization_fixes.test.ts:1425-1426`), which is the correct same-change
  obligation for a new `src/sim/freehold/*.ts` file.

A persistence-only change owes no player-visible string, and this one adds none.

## Counts
blocking 0, should-fix 0, nit 0, note 1.
Presentation-seam checks 1 through 8: no surface in this diff, not run.
