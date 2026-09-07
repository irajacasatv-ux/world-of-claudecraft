# Fresh independent furnishing fix review

## Current coordinator status: earlier source PASS revoked

The adjacent property sweep expanded the deduplicated ledger to 40 findings.
The first 26 repairs retain their earlier inspection evidence, but the overall
source PASS is revoked. Q27-Q40 and the complete expanded round require finished
regressions, a final source seal and fresh independent review. The detailed
[late review checkpoint](fresh-fix-review-late-checkpoint.md) records the reviewer's
subsequent findings; its intermediate counts are also historical. Neither
checkpoint establishes final completion.

## Earlier source report, retained verbatim

Reviewer: fresh_fix_reviewer, active Codex harness and model. COVERAGE review of the entire fix round, including low-severity and uncertain concerns. This reviewer owned no implementation slice and ran no tests, generators, database experiments or shared gates.

Source-review verdict: PASS. One additional low-severity finding was found and resolved during this review (Q26). No unresolved source, test, authority, persistence, presentation or hygiene finding remains in the reviewed fixes. The packet's final QA verdict still requires the coordinator's completed shared gate, final census/roster evidence and post-verdict-commit check; pending execution is not represented as a passing result here.

## Exact reviewed revisions

- Entire fix: `ce0e25ec8593605d8f609074c4854fec56a811b2` against merge `041fd790cec0ea52c3e2285dcac7c3a49f30e7b0`, all 64 changed files.
- The initial fix revision `b1d7e9627674845e4be17b4e7a5dd431800261ea` and final fix revision have the identical tree `7ad83845a4cf7f48631bbbf0cf152e07c11e18ab`. Only the commit body was amended, and this reviewer independently checked both tree IDs and the final message.
- Composed integration `041fd790cec0ea52c3e2285dcac7c3a49f30e7b0` was reviewed against both parents: original furnishing tip `c47e2cb24519be7df37e8664b9d2d61756e2ce4a` and dependency `d3dcdaa4af18f960232196eb461e1e17233fccdb`, concentrating on every furnishing overlap, relocated owner, fixture repair, host/config seam and inventory pin.
- Original item-kind requirements and consumer inventory were obtained from the independent Explore report `/tmp/freeholds-02-audit/packet-context.md`, its census and original-diff artifacts. No planning document was read directly by this reviewer.

## Additional finding and resolution

Q26, low: the original fix commit body contained five prose sentences, exceeding root CLAUDE's one-to-four sentence convention. The coordinator combined its first two sentences. Final `ce0e25ec85` has four sentences, a scoped Conventional Commit subject, a substantive body and no prohibited work-stage word. The amendment has no source or test delta. Found 1, resolved 1, remaining 0 for this fresh review.

## Verification of every existing finding

| Finding | Independent resolution verification |
|---|---|
| Q01 | `recalcPlayerStats` rejects furnishing before authored or active copy stats, ratings and set accumulation. Its mainhand projection rejects furnished weapon capability. `wornSetCounts` rejects furnishing before set modifiers. Real save/load tests preserve the copy and compare all relevant entity power to an empty baseline; literal strength, weapon, proc and set controls remain active for eligible gear. |
| Q02 | `isUniqueEquipped` rejects furnishing on both incoming and worn paths through `uniqueEquipConflictSlot`. `masterwroughtConflictSlot` rejects incoming furnishing and skips worn furnishing before quality/cap counting. Tests cover authored/promoted quality, heroic-family collision, both cap reasons and actual successful equip beside a loaded furnishing. |
| Q03 | The first furnishing arm in `Hud.itemTooltip` returns the complete housing card. It precedes generic equipment, consumption, heroic, set and instance progression branches. Hostile copy tests prove equality to the truthful furnishing card while the same gear copy still displays its supported effects. |
| Q04 | `itemStatDeltas` refuses a furnishing candidate and treats worn furnishing as absent, including its instance. HUD stat-source and player-card weapon adapters reject its power. Tests drive actual HUD comparison/stat models and player-card construction, with literal positive gear deltas and fist/weapon DPS controls. |
| Q05 | `itemPresentationInstance` keeps only copy maker/custody facts on a fresh furnishing projection, leaving the stored object intact. All changed bag, personal bank, guild bank, vault and worn consumers receive item kind. Name, authored rarity, glyph and accessible wording are pinned through real cells and shared helpers; empty signer and generic unsigned copies do not invent a maker. Normal and unknown-kind behavior remains unchanged. |
| Q06 | The generic `partyTradeWindowCustody` key preserves the live deadline while omitting the impossible equip instruction. Minute/hour and expired cases drive the actual card; ordinary gear retains its existing complete sentence. It does not add a housing inventory key or change the approved placement copy. |
| Q07 | Tests use real `ClientWorld` methods and snapshot application through `bareClient`, real `GameServer.handleMessage`, shared Sim resolution and the actual RL `applyAction`/observation path. Online commands are asserted to be forwarded, with no optimistic inventory mutation. Both-world refusal events and successful controls are exercised, including Perfecting reads and swap. |
| Q08 | The expanded sweep adds same-call success controls and the bagged/worn plus replacement enchant matrix. Sim snapshots, literal reason tokens and eligible mutation/cast results make refusals decisive. Signer quality boundaries and bar APIs have independent controls. |
| Q09 | Synthetic malformed capabilities are supplied where removal of the furnishing guard would otherwise leave a slotless/statless negative green. Weapon, stats, tool use, power views and other generic property consumers are exercised with eligible controls. |
| Q10 | Refusal snapshots now clone entities as well as saved state, covering casts, auras, consumption and cooldowns. Independent use cases have actual consumable/fishing controls. Existing keyboard, normal cross-hotbar and cross-only activation paths invoke real HUD methods and prove no use, flash, mutation or random draw for furnishing. |
| Q11 | The durable broad-union negative uses the valid `fishing` discriminant. The coordinator's independent compiler log rejects that `ItemDef` assignment with TS2322 and missing `r` with TS2741; the separate valid broad-union radius-zero/cost-zero fixture compiles. Compiler assertions are genuinely type-sensitive, rather than runtime self-comparisons masquerading as behavior coverage. |
| Q12 | The actual furnishing view has only an erased type import. Its focused test transpiles that source and rejects any runtime import/require and browser-global tokens; the exported function must still exist. Generic UI purity registration is additional coverage, not the sole claim of a localization-free view. |
| Q13 | The unreachable furnishing member was removed from `UNSTACKED_KINDS`. The unconditional `stackSizeOf` furnishing return still precedes explicit stack overrides and remains directly tested. |
| Q14 | Housing CLAUDE now anchors the row contract to `FurnishingTooltipRow` and accurately describes the complete card, narrow world read and excluded power fields without a drifting output count. |
| Q15 | `withPerfectingBonus` rejects furnishing before collection lookup or payload construction. Swap `validProgress` rejects it before both payload replacements, wire revision and stat recalculation. Tests mock positive collection/recipe membership to reach the actual kind boundary and exercise source and target plus successful rank exchange, unchanged counts and zero draws. |
| Q16 | Real character and guild journal adapters receive both furnishing directions. Tests assert no query, no writes/anchors/movement and unchanged inputs. Real material positive controls prove the same adapters make one query and one movement. |
| Q17 | Tests serialize, JSON-round-trip and load a fresh world for bags, personal bank, guild book, full/dirty mail, market listing and collection. Signer and recipe identity are asserted, originals are unchanged, and repeated withdraw/take/cancel/collect cannot grant a second copy. |
| Q18 | Tests execute actual `sellableRows`, `lockedOutRows`, `wocTradableSlot` and `extractTradableCopy` across all furnishing qualities, the mount-policy switch and existing copy/definition locks. Negative extraction is immutable and the same path consumes one eligible copy. D25's mount-policy eligibility and separate `other` browse identity remain intact. |
| Q19 | This reviewer read the independent reconstruction script and its successful output. It parses every approved key table from its source, checks all unique rows and nonnumeric owners, then compares parsed content and exact serialized bytes to the checked-in manifest. The owner-02 inventory pins all four approved placement/maker keys and values; it is not a two-key or self-comparison check. |
| Q20 | This reviewer visually inspected baseline and frozen-final desktop cards, final touch card and both final full viewports. Native hover/long-press evidence and hidden-before/visible-after state are in the manifest. The final rare authored identity and rim, complete placement/maker/custody text and absence of forged power are visible; no clipping was seen. The frozen source has the same tree as the final fix commit. |
| Q21 | The tooltip fixture supplies a real `Sim` with `EMPTY_TEST_WORLD`, satisfying the moved required-level dependency while preserving real HUD methods. Preview-only asset mocks do not replace the tested tooltip or action-bar behavior. |
| Q22 | The merged Perfecting and Crucible fixtures positively narrow authored armor before spreading gear-only fields. They neither cast away the new union contract nor relax an assertion. The relocated bonus helper has a synthetic furnishing refusal and a literal armor bonus control. |
| Q23 | The merged wire test retains the exact `new Sim` construction-site pin and now checks delegation to `offlineWorldConfig`, while the helper's actual stock/custom behavior tests pin true and false. It preserves the headless literal-enabled pin. |
| Q24 | The obsolete HUD import is removed. No new unused import, duplicate implementation or unreachable arm was found in the complete fix diff. |
| Q25 | Broad `ItemDef` fixtures accept explicit true/false and omitted optional plinth, while the numeric value is a durable compiler-negative. This closes the optional field's missing type pin without inventing runtime behavior. |
| Q26 | Final commit message and tree identity verified as described above. |

## Composed merge and architectural review

Bank, guild and mail retain the upstream material selection/load/custody logic and the furnishing admission arm together. The material journal's positive registry remains junk-only, so signed furniture does not become journalled material. No SQL, dependency, pool, queue, timeout, lock-order or stored-shape change is introduced by the QA fixes. The previously reported dependency boot-timeout concern remains byte-identical to its upstream owner and has no furnishing overlap; it is excluded scope, not a deferred finding.

The Perfecting bonus guard moved with its true helper owner and the old module imports/re-exports that owner. The follow-on collection initializer and swap guards protect the new upstream consumers. No duplicated logic, random-draw movement, host-dependent gate or extra tick work was found. The main configuration extraction preserves stock/custom freehold policy, seed and gatherer identity behavior. Both appended command clusters and both IWorld facet families survive the merge with their relative order and string identities intact. Pin repairs reflect the composed universe; HUD and other monolith ceilings decrease rather than relaxing the ratchet.

The small presentation projection follows existing module seams and has a direct test and UI-purity registration. It does not mutate caller payloads. The complete furnishing composer receives only the needed `IWorld.partyTradeMsRemaining` member, resolves numbers through existing formatters and escapes all displayed copy/content text through existing helpers. Neither the projection nor the view introduces a concrete host dependency.

## Authority, persistence and attack surface

- Client-visible eligibility remains shared data/pure policy. The authoritative command path still validates and resolves through the shared Sim; the fixes add refusals, not a client-granted capability.
- The loaded-copy repair preserves stored IDs and payloads, making them inert at every newly identified stat/set/weapon projection. It does not delete a player's copy or grant capacity through a materials-only pool.
- Storage pipes retain their existing ownership, soulbound, no-market and copy-lock rules. D25 remains the mount-policy exception for Exchange eligibility only, with no riding entitlement or automatic opening of the feature.
- Strings containing hostile signer/name markup remain escaped. Furnishing presentation cannot advertise a promoted or heroic alias as an authoritative name/rarity. No endpoint, remote call, credential handling, authorization bypass or new unbounded job was introduced.
- The finished database review's measured PG evidence and the executed journal/restart tests support unchanged persistence cost and custody shape. Ordinary bank audit work is not confused with zero material-journal work.

## Localization, assets and hygiene

The original six furnishing English leaves remain unchanged: two labels and four approved housing rows. The single added generic custody key is outside the housing/build-mode key inventory, carries no new measurement or price and accurately describes an existing timed trade rule. Its contributor exception is the positive conjunction of an exact key and that locale's generated pending membership; tests also reject unrelated and no-longer-pending keys. Existing release pending enforcement remains in force.

Every changed resolved locale artifact adds only the custody line; the key union and pending registry add that same leaf through the owning generator. The original item-kind range and the QA fix range contain no authored locale-overlay edit. The full stacked branch retains older foundation API translations, and the merge carries independent upstream locale work; that inherited content is not misreported as a QA overlay mutation.

No shipped furnishing ID, model, texture, sampled sound or item painting was added by the QA fixes. Visual captures are screenshots of the existing runtime, using a synthetic definition and the existing fallback icon, not new asset production. No asset pipeline/provenance waiver was introduced. The existing item-icon orphan/coverage suite passed in the coordinator's recorded matrix.

No new leftover TODO, debug branch, forbidden work-stage term, em/en dash, emoji, generated-file hand-edit evidence, dead helper or unsupported-return-type arm was found. Existing dependency/history comments remain outside the new-code hygiene claim.

## Executed evidence inspected

The following are coordinator executions read by this reviewer, not reviewer reruns. Their exact commands and logs are collected in `/tmp/freeholds-02-audit/validation-results.md`.

- Final `npx tsc --noEmit`: no diagnostics; coordinator recorded exit 0.
- Required scoped matrix: 11 files, 477 tests passed.
- Final cell/presentation matrix: 9 files, 412 tests passed.
- Final consumer/real-host matrix: 2 files, 182 tests passed.
- Expanded furnishing, equipment, collection and persistence matrix: 6 files, 207 tests passed.
- Localization/storage/icon neighbors: 7 files, 339 tests passed and 3 existing release-only cases intentionally inactive. Those cases are not claimed to have passed.
- Disposable PostgreSQL integration: 7 files, 95 tests passed, including measured adapter/lock/index/save-growth evidence. No source fix after that experiment changes database behavior.
- Broad-union scratch: expected negative diagnostics and successful valid radius-zero control; manifest reconstruction: 557 approved unique rows, byte-identical.
- Accepted before/final screenshots: native desktop hover and touch long press, complete manifest and no capture failures for the final accepted run.

Full shared gate, final updated consumer census, all finishing roster artifacts and post-final-commit `ci:changed` remain coordinator completion steps at this source-review checkpoint. This reviewer will inspect the final evidence when provided and append its final completion decision without rerunning the gate.
