# Furnishing QA finding ledger

QA verdict: **PASS**, 40 findings found and 40 resolved with independently reviewed repairs and evidence at
`d38663539433cbcd30642ea47d7663c5c52c59c0`; the shared gate has passed with
actual exit 0 and all 12 steps green. Standalone i18n generation/status and the
repeated source seal also passed. The
[fresh complete-fix reviewer](fresh-complete-fix-review.md) read all four repair
commits and all 110 changed files, returning source PASS with zero open findings.
The earlier 26-finding source verdict was revoked and is historical evidence.
No finding, including a documentation or dead-code nit, is deferred.

Compiler and control-fixture mistakes corrected while writing a regression remain
part of that finding. They are not counted again as product defects. Rejected
capture setup and database configuration attempts are retained in the validation
record and are not represented as passing evidence.

| ID | Finding and origin | Repair and available evidence |
|---|---|---|
| Q01 | Loaded furnishing gains combat stats, weapon power and set bonuses; correctness C1 and coverage C1. | Entity and set projections exclude furnishing while retaining the saved copy. Reload, weapon-proc and set controls cover the actual power consumers. |
| Q02 | Loaded furnishing interferes with uniqueness and Masterwrought caps; correctness C6. | Incoming and worn gear policies exclude furnishing before cap and family comparisons. Actual equip controls retain eligible conflicts. |
| Q03 | The complete tooltip displays unsupported heroic and copy power or progression; correctness C2 and hygiene H1. | The housing card returns before generic gear and consumable branches. Actual HUD tests cover hostile copy fields and eligible gear. |
| Q04 | Comparison, stat-model and player-card projections credit inert furnishing power; parity C1. | Shared comparison and stat/DPS adapters ignore furnishing power. Literal Strength deltas and actual HUD controls prove the repair. |
| Q05 | Owned cells and glyphs advertise promoted names, rarity or power, including a false maker aria label; frontend F1. | Kind-aware presentation reaches worn, bag, personal-bank and guild-bank cells. Live painter and native card/cell evidence verified the first repair. |
| Q06 | Timed custody text promises impossible furnishing equipment use. | A generic custody-only key preserves the live deadline without the equip instruction. Minute, hour, expired and eligible-gear controls pass. |
| Q07 | Helper-only testing overclaims host parity; correctness C3 and coverage C2. | Real ClientWorld, GameServer, Sim and RL commands, readouts, snapshots and deltas have refusal and eligible controls. The final tool, commerce and feast extension executes 24 tests across three files: six tool cases, four commerce routes and direct feast commands use real host round trips, immutable refusal snapshots and same-call eligible controls. See tool-route-tests-fix.md, commerce-host-tests-fix.md and cross-platform-sync-final.md. |
| Q08 | Refusals lack paired success and worn, replacement or boundary cases; coverage C3. | Same-call controls cover the enchant matrix, poor or absent quality and bar APIs. |
| Q09 | Slotless and statless fixtures cannot detect missing kind guards; coverage C4. | Independent malformed capability fixtures and ordinary-kind controls exercise each claimed boundary. |
| Q10 | Save snapshots miss transient power, and combined use fixtures mask consumer arms; coverage C5. | Entity, cast, aura, consuming, cooldown and RNG observations accompany independent valid-use fixtures and real keyboard/cross-hotbar activation. |
| Q11 | Compiler negatives use an invalid discriminant and only the narrow target; correctness C5 and coverage C6. | A valid fishing-use payload is assigned to broad ItemDef. Independent use and required-radius negatives fail, while radius-zero and cost-zero controls compile. |
| Q12 | The generic pure-core guard does not ban an i18n runtime import; coverage C7. | A dedicated erased-import and forbidden-runtime check pins the furnishing core's stronger contract. |
| Q13 | The unstacked set retains an unreachable furnishing member; hygiene H3. | The redundant member was removed. The unconditional early stack guard remains tested. |
| Q14 | Housing CLAUDE guidance uses a drifting literal inventory count; hygiene H2. | Stable symbol/file anchors and accurate complete-card seam guidance replace the count. |
| Q15 | Incoming Perfecting initialization and swapping lack a furnishing boundary. | Both reject furnishing before payload changes or draws. Synthetic collection membership and eligible source/target controls pin the shared entry points. |
| Q16 | Material-journal exclusion lacks real adapter execution; persistence C1. | Character and guild adapters execute both transfer directions with zero queries, writes, anchors and movements; material controls remain active. |
| Q17 | Custody coverage stops before JSON serialization and restart; persistence C2. | Bags, personal bank, guild, full and dirty mail, listings and collections round-trip through fresh load, preserve signer and recipe provenance, and refuse duplicate recovery. |
| Q18 | D25 downstream pickers and extraction are untested; parity C2. | Real sellable, locked-out, tradable and extraction consumers cover quality, policy, locks and immutable refusals. |
| Q19 | Approved UX reconstruction is supported only by inherited prose; context C4. | The executed checker reconstructs all 557 rows byte-for-byte, including nonnumeric owners and the exact four owner-02 leaves. |
| Q20 | Existing screenshots do not show the current complete card and repaired cells; frontend F2. | Comparable initial card/cell captures and late Exchange, paperdoll and sale-history captures passed native desktop mouse/mobile touch assertions. Both late commands exit 0 with 32 accepted PNGs each, eight surfaces per viewport and zero assertion failures. The frontend reviewer inspected every pair; rejected notice-raced first frames remain explicitly identified. See the visual record and frontend-seam-reviewer-final.md. |
| Q21 | The tooltip fixture lacks the merged Sim.player dependency; correctness C4. | A real EMPTY_TEST_WORLD Sim fixture and established asset mocks restore live composition. |
| Q22 | Upstream fixture spreads assume broad ItemDef accepts gear fields. | Eligible fixture definitions are narrowed in Perfecting and Crucible tests; full TypeScript checking passes. |
| Q23 | The merge wire test pins obsolete inline main.ts configuration. | The test now asserts constructor delegation and actual stock/custom offline-world configuration. |
| Q24 | Merge composition leaves an unused HUD import. | The unused requiredLevelFor import was removed; scoped formatting and type validation passed. |
| Q25 | Optional plinth lacks a durable boolean type pin; finishing coverage nit. | Broad-union true/false controls and a numeric compile-negative cover the promised shape. |
| Q26 | The fix commit body exceeds the canonical four-sentence limit; fresh review. | The unpushed commit message was amended to four sentences. The fresh reviewer verified the message and unchanged tree. |
| Q27 | Exchange rows, published quality and wallet descriptions trust unsupported furnishing copy metadata; fresh review. | Authored quality is used for sell, listing and public display projections. Wallet text retains only the sanitized actual maker while full raw copy fingerprints remain bound. Actual service, route, picker and digest tests pass; see market-identity-fix-report.md. |
| Q28 | Live Rift upgrade, enchant and gem commands admit furnishing copies; fresh review. | The shared selector rejects before currency, gems, payload, revision or RNG changes. Both selection forms run through offline and actual client/server paths with same-call shell controls; see rift-auto-equip-feast-fix-report.md. |
| Q29 | WorldMarket sale history trusts furnishing copy names after purchase and load; fresh review. | New sales omit the unsupported chosen-name field. Older saved history stays intact while Collect uses authored identity. Actual buy, JSON reload, painter and proceeds tests pass; see market-identity-fix-report.md. |
| Q30 | Discovery and Reliquary use promoted rarity or heroic aliases instead of furnishing identity; fresh review. | Discovery uses authored quality and own ID; Reliquary stops its alias walk at that ID. Acquisition, restart, repeated grants and preserved-history controls pass; persistence-late-review.md inspects the stored behavior. |
| Q31 | Worn set, Masterwrought and paperdoll projections advertise furnishing power; fresh review. | Catalog denominators, worn counts, cap readouts, per-slot diamonds and lazy tooltip lines exclude furnishing. Actual gear tooltip and CharWindow controls cover both supported host mirrors; see worn-and-enchant-fixes.md. |
| Q32 | Current-worn furnishing damage or armor can suppress a legitimate auto-equip upgrade; fresh review. | Comparison treats furnishing power as absent and preserves other current kinds. Live grants cover hand, armor, shield, held-offhand and jewelry replacements plus ordinary stronger/equal gear; see rift-auto-equip-feast-fix-report.md. |
| Q33 | Icon, held-model, entity-name and simulation-event projections inherit a furnishing heroic alias; fresh review and adjacent sweep. | Furnishing keeps its authored image/name identity and cannot borrow heroic held models. Own entity-manifest and event-name entries remain present; asset-identity and event-identity tests pass without generating an asset. |
| Q34 | Bag and worn enchant previews admit targets refused by authoritative apply; late coverage review. | Both builders share the exported authoritative eligibility predicate. Plain/replacement, synced/unsynced and first-step Perfected controls pass; see worn-and-enchant-fixes.md. |
| Q35 | Direct feast placement, consumption and family predicates accept furnishing metadata; late coverage and fresh review. | Census, apex credit and direct actions reject furnishing before spending, serving, meal or ledger changes. Same-call food controls and actual ClientWorld/GameServer placement and consumption round trips pass in the final 24-test route matrix. See rift-auto-equip-feast-fix-report.md and cross-platform-sync-final.md. |
| Q36 | Exchange retains an unused notice import and unread payout-loop counter; late hygiene repair. | The unused import and walked declaration/increment were removed without changing payout effects or budget timing. The owner remains at its existing 3945-line ceiling; see market-identity-fix-report.md. |
| Q37 | The discovery docblock no longer describes furnishing quality and alias behavior; persistence review nit. | The comment states authored quality and ignored heroic aliases. Related tooltip ownership, provenance current-mint and final QA evidence wording were corrected during resumed review, including the distinction between source repairs, visual evidence and commit-message repairs. Lost historical argv is disclosed instead of promised as future evidence. Archived log whitespace and one JSON command-array layout were normalized with content-preservation proof; the corrected post-commit CI exits 0. These documentation nits remain within the existing finding. |
| Q38 | Legendary regalia and its renderer cache accept furnishing promotion metadata; late property sweep. | The pure admission helper reads authored kind and equipped identity. Its extracted reference cache invalidates on either equipment or instance-map replacement, and cached hits perform no payload reread. Eligible gear retains the same pooled emitter and fairness gates. The owning provenance remint updates renderer/composite hashes only; its recursive delta check and 30 capture/integrity tests pass. No asset or frozen screenshot changed. See regalia-and-dev-picker-fixes.md and resumed-validation-commands.md. |
| Q39 | The developer picker interprets furnishing gear metadata; late property sweep. | Real picker rows retain authored name, rarity and exact-ID dispatch while suppressing furnishing slot and Heroic tags. An independent pre-flow clone pins source immutability. Final hygiene also removes the unused DEV_ITEM_PICKER_LIMIT import and repairs import order; the explicit 39-file Biome command exits 0. See regalia-and-dev-picker-fixes.md. |
| Q40 | A standalone tool-effect card uses furnishing metadata to choose its color; late property sweep. | The existing charm cache skips furnishing before its first-match admission. Actual exported cards retain literal rare and epic colors with real charm controls, unchanged bonus prose and no asset work; see furnishing-tool-effect-fix.md. |

## Decision reconciliation

The four approved housing placement/maker keys and two furnishing labels retain
their exact English and source values. The generic
`hudChrome.itemTooltip.partyTradeWindowCustody` key describes an existing custody
deadline. It adds no dimension, radius, price or cost. Its contributor exception
requires both the exact key and generated pending status. No locale overlay was
edited in `16f2aeed2b..c47e2cb245` or `041fd790ce..d386635394`; the stacked
foundation's five earlier non-Latin additions are outside those ranges.

D25 remains the mount eligibility and policy rule, with the `other` browse
identity and every furnishing rarity admitted. The inherited uncommon floor in
collectible-specific quality choices is unchanged; All browse remains available.
A synthetic stale Exchange row can retain a stored quality different from its
normalized display because SQL still filters the stored column. There are no
shipped furnishing IDs or production furnishing rows in this packet, so no
migration or backfill is required. Historical normalization means display only.
Database and security reviewers explicitly accepted that scope.

The incoming migration lock_timeout observation was excluded after byte-identity
comparison with dependency `d3dcdaa4af`; it has no furnishing overlap. Generic
cross-hotbar layout can retain old item tokens, but every actual activation route
refuses furnishing without mutation. Actual keyboard and cross-hotbar controls
pin that boundary. These are classified inherited behaviors, not deferred fixes.

Unsigned external release artifacts retain their named release gates. No asset
was generated in this audit. Screenshots document rendered behavior and do not
replace any producer's asset provenance or final-art obligations.

## Review and completion status

The fresh reviewer independently reviewed `041fd790ce..d386635394`, including
`ce0e25ec85`, `ff738f61a1`, `a82e71f4cd` and `d386635394`, and verified all
40 repairs. The final cross-platform and coverage reviewers found no open issue;
the complete census records 353 sites, 92 touched, 261 untouched by design and
zero MISSED. The frontend reviewer accepted both late visual runs. Bounded
database, persistence and security conclusions remain linked in the review index.

The shared gate's actual exit is 0 and standalone generator/status proof passed.
The fresh reviewer approved the complete documentation, its two resolved nits and
final verdict substitutions. The completion checklist also returned PASS. After
verdict commit `c881543258`, `npm run ci:changed` completed with actual exit 0
and a clean status. Fresh and checklist review of the evidence-only amendment passed; the
same command will run again after the true last commit. No deferred finding
remains and no future command is credited as passed.
