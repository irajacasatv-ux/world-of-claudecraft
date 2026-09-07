# Cross-platform finishing COVERAGE closure

Reviewer `woc_cross_platform` (`parity_evidence_closure`). Scope
`3fa4965a3c186982aafd44b3ec9b9d9851ace52d` through the working tree at checkpoint
HEAD `6e083002238ee625261a1b832a0e6049f931a432`, including untracked modules/tests.
Root/local guidance was read and boundaries independently traced. Retained by the
coordinator from the returned report; no source edits or duplicated tests.

Verdict PASS. Zero confirmed gaps, blocking/nonblocking findings or open nits.
High confidence for the reviewed seams.

## COVERAGE

- IWorld/Sim/ClientWorld: no member, command token or runtime shape changes.
  Housing facet change corrects documentation. Both worlds retain shared
  Reliquary ownership/completion; buys retain the inventory facet.
- Shared content/Ledger: all eight entries join ITEMS at data.ts:390 with nested
  freeze. Twelve deeply frozen bills use only a validated injected ordinal and
  version, without clock/owner/RNG/current-price input. No billing consumer
  exists; productionApproved stays false and productionSchedule null.
- Construction: bootstrapSurfaceNpcs preserves authored order, safe position,
  ID allocation, insertion and service registration before market.seed. The
  admission helper preserves dynamic exclusion and gates only the exact
  furnisher. Stock offline config opts in at offline_world_config.ts:20,
  headless at env_server.ts:122; server captures its strict boot flag through
  sim_boot_config.ts:48. Dark construction is unchanged; identical lit inputs
  remain deterministic.
- Terrain/geometry: terrain_calm_anchors.ts:165 skips the new pad on every host,
  never splitting terrain by flag. Prior pads and height literals are checked
  on both modes; existing height/chunk tests and goldens are unchanged. Site
  clearance, colliders, lamps and decoration output retain dedicated coverage.
- Wire/deltas: existing k/tid/nm NPC encoding and client shared-catalog stock
  reconstruction remain. Discoveries/Hearth use existing dstats/reliq fields;
  client omitted-value guards remain. No new housing self key is allowed; the
  empty-allowlist decoder remains unchanged.
- Commands/authority: ClientWorld sends the existing buy command. Server uses
  authenticated player identity; shared buy validates merchant, stock, price,
  life, range, quantity and capacity. No client price/discovery authority is
  added. Housing commands, including payLedger, remain inert. Keyboard repair
  uses the same command path.
- Events: no new variant or free-text payload. Acquisitions use pid-scoped
  reliquaryUnlock; manual deeds use idempotent grantDeed. Both stay registered
  for heavy-self dirtiness and existing HUD handling. Events notify; snapshots
  supply state.
- Deeds/cosmetics: two appended manual deeds gain no automatic/placement/Cottage
  caller. Grants and cosmetic selections remain character-scoped/idempotent and
  authoritative. Only Homesteader title joins Horizons; Householder uses the
  shared palette/motif registry.
- i18n/Hearth: the NPC ID supplies name/title/greeting through the existing
  resolver. All applicable item/NPC/deed/page/shelf English and five non-Latin
  fills exist. Existing vendor error matchers suffice. Shelf union, view,
  window and Guide include Hearth; unavailable catalogs fall back to Overview.
- RL/Python: no obs.ts/headless/Python diff, observation element, action index,
  reward or NDJSON field. Existing housing-action exclusion remains pinned;
  Python queries advertised spaces. Content does not extend trained interfaces.

The two prior documentation nits are closed: Guide shelf inventory includes
Hearth and the housing payment comment describes eligible materials and weeks.

## Evidence and limits

Inspected acceptance: fourteen files / 725 passes / three inherited localization
skips. Repairs: eight files / 261 passes including both terrain suites. Terrain
regression: five files / 127 passes. Initial architecture evidence was read and
late terrain correction traced independently.

The final shared gate passed all twelve steps: 3853 passed unit files / 57726
passed tests / two expected failures / 541 skips; browser 43 files / 376 passes.
Typecheck and env/server/bot/client builds passed. Existing golden traces cover
dark config; lit determinism uses dedicated construction tests, not a reminted
trace. Production calibration and the user-authorized pre-shipping voice remain
separate obligations. No parity remediation is required.
