Finishing test-coverage COVERAGE verdict: **CHANGES REQUIRED** for one P2 coverage gap and one P3 tooling-validation nit. No P0/P1 finding.

Reviewed `3fa4965a3c186982aafd44b3ec9b9d9851ace52d` through the working tree, including untracked implementation and tests, in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. This is a separate finishing review from the earlier bounded coverage audit. Claims were assembled from the acceptance request, accepted trial basis, source diff, and test titles before judging assertions. No source/tests were modified or tests rerun.

**Findings**

1. **P2, high confidence: intentional hide/cloth observation reuse lacks decisive coverage.** At `tests/freehold_trial_economy.test.ts:124`, the fixture creates separate tier-2 observations for hide and cloth. Removing the exception at `scripts/freeholds/economy_model.mjs:28` therefore leaves the five tests green. The real replay supplies only one ordinary-corpse observation for each family, so that regression would prevent producing their tier-2 bills. Test hide and cloth independently without tier-2 observations; pin the tier-2 bill’s tier-1 fixture identity, unit vector, and quantity. Retain the fish tier-mismatch refusal to constrain the exception.

2. **P3, high confidence: several independent evidence-tool validation fields are untested.** These affect producer refusal behavior, not the already literal-pinned runtime values:
   - `tests/freehold_trial_economy.test.ts:36` negates only `noVendorSell`. Missing comparator retail price, quality, and set-comparator price, plus ore floor versus observed quantity, need independent negatives against otherwise valid inputs. Producers: `economy_model.mjs:99` and `:109`.
   - `roundTrialUnits` only exercises the default numerator. Add one non-default ratio and an invalid numerator if retaining that public argument.
   - `tests/freehold_trial_geometry.test.ts:102` lacks an independently invalid floor lift, a correctly sized nonfinite transform, and invalid later comparative metrics with preceding metrics valid. Producers: `geometry_core.mjs:18`, `:32`, and `:94`.

These counterfactuals follow from the inspected branches and fixtures; no mutation execution was performed.

**Earlier findings: resolved**

- `tests/reliquary_empty_shelf.test.ts:93` exercises actual `open('hearth')` on both cold and already-open windows with the catalog dependency lacking Hearth. Overview selection, exact focus, remaining cards, and original catalog preservation are asserted.
- `tests/freehold_trial_geometry.test.ts:96` independently makes primitives dominate. All four maximum components now have decisive positive cases. Source snapshot and complete-rug guards also exercise replacement and mutation failures.
- `tests/freehold_trial_economy.test.ts:105` supplies distinct fish/produce yields and positive decoys; `:188` pins selected fixture/vector/quantity, `:281` rejects missing/wrong identity, and `:141` independently rejects wrong family and tier.

**COVERAGE**

| Behavior claim | Verdict and decisive assertion |
|---|---|
| Exact persisted tiers and price-free Charter | **PASS.** `freehold_content.test.ts:20` and `:76` compare complete literal rows. Extra fields fail equality. Unknown/prototype names, read-only set operations, and mutation failures are covered at `:29` and `:52`. |
| Complete eligibility, separate alternatives, base-before-fine order | **PASS.** All 18 identity/grade rows are literal-pinned at `freehold_content.test.ts:112`; nested freezing is exercised at `:151`. |
| Exact versioned twelve-bill cycle | **PASS.** `freehold_ledger_schedule.test.ts:16` pins every bill and all 36 family/tier/material/quantity tuples. `:130` checks all grades, three distinct families, produce every week, and all alternatives reached. |
| Deterministic, bounded, immutable lookup | **PASS.** `freehold_ledger_schedule.test.ts:169` covers three full cycles, explicit/default version, maximum safe integer, and independent invalid week/tier/version inputs. `:197` attempts mutation at every nested level. |
| Accepted evidence with production unsigned | **PASS for metadata.** `freehold_ledger_schedule.test.ts:214` pins the artifact digest, original null approval history, runtime source digest, published lines, and false production approval. This does not establish deployed flag state. |
| Every bill excludes protected identities and grades | **PASS.** `provisioner_firewall.test.ts:253` exercises 1,056 independent published-position injections. Registry injections and live protected outputs remain covered at `:169` and `:210`. This is a test-owned content scanner, not a mocked runtime firewall. |
| Trial rounding and source selection | **PARTIAL.** Literal half-up boundaries and distinct source vectors are decisive; the hide/cloth reuse and validation findings above remain. |
| Measured geometry, outward bounds/radius and rug underlay | **PASS for accepted arithmetic.** `freehold_trial_geometry.test.ts:25`, `:40`, `:57`, and `:70` detect missing transforms, half-width radius substitution, epsilon shrinkage, and lost nonuniform rug scaling/floor lift. Input-validation coverage is partial as noted. |
| Four-component decor cost and source sealing | **PASS.** `freehold_trial_geometry.test.ts:89` independently exercises every dominant component and the positive floor. `:114`, `:135`, and `:155` exercise cached bytes, changed sources/buffers, and altered/duplicate/absent rug factories. |
| Exactly eight immutable, neutral furnishings and sole vendor | **PASS.** `freehold_content.test.ts:202` compares complete literal definitions including 250/60 copper, quality, every footprint/radius/cost, and sole acquisition source. `:239` checks nested freezing. |
| NPC extraction preserves construction behavior | **PASS.** `surface_npc_bootstrap.test.ts:50` pins deliberately nonsorted insertion order, safe-position callback ordering, IDs, copied arrays, and both service registries; `:84` covers lit insertion. Actual bootstrap and `createNpc` remain real. |
| Dark/lit admission and host parity | **PASS.** `freehold_npc_spawn.test.ts:19` exercises predicate arms; `server/freehold_wire.test.ts:704` constructs real realm-configured Sims and pins absent/strict-`'1'` stock plus boot immutability. The literal pre-furnisher fingerprint, lit determinism, and geometry comparison are at spawn tests `:45`, `:82`, and `:124`. |
| Real purchase, copy storage, discovery and completion | **PASS.** `freehold_furnisher.test.ts:48` purchases every ID and additional chairs, checking copies, 8/8 completion, counts, copper and zero RNG draws. Its price-derived expectations are backed by independent literal price pins. |
| Commerce failures and dark-host forgery | **PASS.** `freehold_furnisher.test.ts:80` independently checks insufficient funds and full bags with whole-state equality; `:120` refuses all eight forged dark-host purchases. Sale/buyback and sticky discovery are exercised at `:101`. |
| Current save/load and old-catalog rollback boundary | **PASS within stated scope.** `freehold_furnisher.test.ts:131` restores actual acquired items through JSON onto a dark host; `:155` tests old-row defaults. `freehold_catalog_rollback.test.ts:43` calls real restore/serialize functions with old catalog dependencies and an old-item/page positive control. It correctly does not claim old-binary execution. |
| Measured persisted growth preserves historical attribution | **PASS.** `professions_blob_growth.test.ts:2204` pins 188 + 444 = 632 bytes, prior 209571 and current 210203 totals, while retaining independent Field Kit/Homesteader deltas, historical equations, band width and warning threshold. |
| Manual, appended, cosmetic, character-scoped deeds | **PASS.** `freehold_deed_records.test.ts:18` pins both complete rows; `:40` exercises automatic evaluation, repeated manual grants, separate characters and unchanged stats. `deeds_content.test.ts:1009` preserves the prior catalog digest. Future raise sites are not claimed. |
| Artwork bytes, provenance and historical review integrity | **PASS for automated admission.** `freehold_art_admission.test.ts:91`, `:151`, and `:184` pin sealed lineage, exact owners, every shipping hash, decoded dimensions/opacity and runtime URLs. Deed art and motif have literal byte/palette/primitive pins. Historical verdicts remain separate from new art. |
| Hearth catalog, navigation, source, completion and localization | **PASS.** `reliquary_hearth_shelf.test.ts:35` through `:130` exercises catalog/nav/cards/search/recent/source/pinning/completion. Real window routes, missing/owned tooltip and ARIA behavior, and Japanese repaint are covered at `reliquary_hearth_window.test.ts:124`, `:165`, and `:193`. |
| Wiki and voice obligations | **PASS within authorized scope.** `guide_reliquary_hearth.test.ts:9` pins the actual generated eight-item page and rendered order; `:38` covers empty output. `npc_voice_coverage.test.ts:77` permits only the exact deferred greeting tuple, preserving strict coverage for other voices. |
| Vendor keyboard activation | **PASS.** `browser/vendor_keyboard.browser.test.ts:100` uses trusted Enter and Space through real Input, focus wiring, painter and Sim. It asserts one purchase, literal inventory/copper, retained focus and no chat theft. `:115` preserves world Enter and chat typing. |

No newly focused, skipped, TODO-only, or expected-failure coverage was found. Replaced absence assertions now have exact live inventories and genuine unavailable-catalog tests.

**Shared results inspected**

- Acceptance log: **14 files passed; 725 passed, 3 skipped**. Skip identities and exact invocation remain for the coordinator’s planned detailed result; those skips are not counted as passes.
- Economy selection guards: **5 passed**.
- Geometry guards: **12 passed**.
- Unavailable shelf guards: **2 passed**.
- `npm run test:browser -- tests/browser/vendor_keyboard.browser.test.ts`: **red 2 failed/1 passed**, then **green 3 passed**.
- Vendor-related regression log: **4 files, 163 passed**.
- Art admission log: **5 files, 59 passed**.
- Coordinator reported typecheck success; the captured typecheck log contains no errors.

The final shared gate, completed runtime art capture, and post-last-commit verification remain coordinator evidence. This review does not establish production calibration, player-hour burden, final GLBs/layouts, GPU performance, or fleet rollback safety.
