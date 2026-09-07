# Security finishing review and fresh terrain closure

Reviewer: `woc_security` (`review_security_final`); retained by the coordinator
from the reviewer's complete returned scope and coverage report. Scope:
`3fa4965a3c186982aafd44b3ec9b9d9851ace52d` through the integrated working tree,
including untracked content and the later terrain correction. Read-only review;
no tests or deployment actions were performed by the reviewer.

Verdict: PASS. Zero open security findings or nits. The one low-severity,
high-confidence documentation finding in `src/sim/freehold/commands.ts:22` is
closed: it now distinguishes the NPC bootstrap's flag read from the inert command
bodies, preserving the warning requiring an authority decision before mutations.

## COVERAGE

- Authority and custody: `server/game.ts` uses the authenticated `session.pid`.
  Existing buy dispatch reaches `src/sim/items.ts` and resolves authoritative NPC
  stock, price, life state, distance, quantity, balance and capacity before charge.
  Sell and buyback use owned inventory and recorded buyback rows. Client prices
  and capabilities never become authoritative.
- Production gating: config requires exactly `FREEHOLDS_ENABLED='1'` and is
  captured at boot. The new admission predicate excludes the exact furnisher
  before ID allocation on dark hosts. Forging a lit NPC ID cannot supply missing
  stock. Existing market-house stock remains explicit with no furnishing faucet.
- Power and progression: all eight frozen definitions contain only furnishing
  geometry and ordinary copper prices. Existing equip/use/stat kind guards remain.
  Homesteader deeds are cosmetic/manual with no new automatic grant path.
- Ledger: nested rows and grade lists are frozen. Lookup rejects unsupported
  tier/version and invalid ordinals; it accepts no owner/account/clock/RNG.
  Production approval remains false and housing/payment commands remain inert.
- Abuse controls: stale-session rejection, frame/byte budgets, command lanes,
  payload guards and refusal-before-heavy-snapshot ordering remain unchanged.
- Privacy/injection: no new auth, OAuth, TOTP, wallet, recovery, admin/internal
  route, SQL writer, dynamic static-file path, sensitive log, account-data
  snapshot, or untrusted HTML interpolation is introduced.
- Terrain closure: `terrain_calm_anchors.ts` excludes only the authored furnisher
  from flattening. The same rule runs on every host and depends on no player,
  account, flag state, time or RNG input. `collectCalmAnchorPads` still supplies
  the shared terrain used by movement and rendering.
- Terrain regression coverage checks the complete remaining NPC pad roster and
  independent previous height literals across two seeds and both configurations.
  The established full corpus remains unchanged. The new test was red with the
  pad and the relevant five-file run passed 127 tests after removal.

## Evidence and limits

The initial added-text scan covered 83,091 lines: zero credential signatures and
zero forbidden sim clock/random calls. The acceptance run had 725 passes and
three disclosed inherited localization skips. The inspected shared malware step
passed over 8,342 files with zero high findings after priors. The initial full
gate failed and must be superseded by the coordinator's final gate; no focused
result is represented as whole-gate success.

Production flags, compatible fleet-wide catalogs and the documented backup
boundary still require operational evidence before acquisition enable. Deployed
authentication, live persistence and environment flags were not tested. The exact
user-authorized voice deferral changes no security boundary.
