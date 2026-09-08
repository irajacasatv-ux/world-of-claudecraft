# Reconciled crafted-content audit findings

Audit date: 2026-09-07, America/Denver. Worktree: `wocc-freeholds`, branch `feature/freeholds`. Source repairs: `d5ea0825d1eb3520cf5114003eb585953ddefb90` and `69ffdab561bbe204045c7e3a4fcb4a60c0222b43`.

Current complete audit: **4 found, 4 resolved, zero deferred**: three source/test findings and one documentation nit. The contribution verdict and exact execution outcome are recorded in [validation](validation.md) and the living progress ledger.

| ID | Severity | Finding | Applied repair and decisive evidence |
| --- | --- | --- | --- |
| HN1 | P3 | New crafted content bypassed the documented public content barrel. | Export `FURNISHING_PATTERN_ITEMS` from `src/sim/content/freehold/index.ts`; route all three external catalog consumers through that barrel. Architecture and furnishing suites passed. Fresh review checked the dependency graph and found no runtime cycle. |
| COV-1 | P2 | Dark-host refusals checked only target absence with empty prior knowledge, allowing unrelated learned recipes to disappear unnoticed. | Seed an ordinary known recipe and compare complete knowledge, possessions and fees across all ten training/grant/craft cases and all three manual/vendor refusals. Retain the successful ordinary-vendor control. A scratch rollback-to-empty mutation fails exactly the three manual preservation cases; baseline and restored runs pass. |
| PER-1 | P3 | No actual JSON character-save round trip covered all ten authored furnishings and three unused manuals through lit, dark and relit hosts. | Add a real serializer/reload regression with literal 10/3 counts, all thirteen identities, discoveries, furnishing first-finds, illuminated Hearth, copper, whole knowledge and an independently pinned `Craftedkeeper` signer. Preserve the supplied save. A scratch sanitizer mutation dropping furnishing knowledge fails this exact test; baseline and restored runs pass. |
| DOC-1 | P3 | The current audit prose overstated the calibration receipt as 60 successful field comparisons. | Correct validation and the copied context report to 50: ten rows with five true boolean fields each. The receipt itself and all source calibration values are unchanged. The fresh documentation reviewer verifies this correction and the final four-finding totals. |

PER-1 is a missing regression proof, not an observed production save defect. The COV-1 default-knownness concern was separately challenged: existing fresh-character, trainer and manual tests pin initial absence independently, so whole-state equality does not weaken that requirement.

## Independent review

[Fresh complete fix review](reviews/fresh-fix.md): PASS, zero additional findings or nits. The independent reviewer read all five current repair files and all six historical repair commits (`ea3b62fad1`, `47655ffb54`, `1be1aef461`, `85f99f6a32`, `5f4821bec7`, `b379ee462d`), including complete parsed generated payloads. It independently rechecked both full protected declarations. Required [content obligations](reviews/content-obligations.md), [test coverage](reviews/coverage.md), [coverage closure](reviews/coverage-closure.md) and [completion checklist](reviews/qa-checklist.md) reports are retained. Earlier provisional report language records the state at review time; current execution and final supplements own closure.

## Historical scope reconciliation

The [earlier audit](../crafted-qa-2026-09-07/) remains **FAIL, 29 found and 28 fixed** under its then-current whole-directory profession prohibition. Its F01 conflict is closed prospectively by the user's explicit current instruction protecting `evaluateCraftAdmission`, `resolveTrain`, existing station bindings and training/economy semantics while permitting the existing availability seam. This is a reconciled instruction boundary, not another counted code finding or a retrospective PASS. Do not combine the two audits' counts.

Both protected declarations are byte-identical to `86eb86bbe2^`; [machine comparison](receipts/protected-functions.json) and the independent fresh review provide the evidence. No validator, station, fee, craft budget, stored shape or protocol changes occur in the current repair.

## Remaining named owner gates

Production calibration remains disabled. Final GLBs and their Wave A closeout belong to owner 19; production numeric signatures, room/navigation validation and physical LOW approval remain their named later gates. These are neither approvals granted here nor unresolved review findings. No assets were generated during this audit. The branch stays local, and implementation 05 has not started.

Final count reconciliation: the earlier source reviewers correctly reported three source/test findings at that time. DOC-1 was then found and resolved during final documentation review, for four total findings and four resolved. [Final document review](reviews/docs-final.md) and [final checklist](reviews/checklist-final.md) own this completed audit total; older provisional reports remain chronological evidence.
