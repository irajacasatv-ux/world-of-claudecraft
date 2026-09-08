# Crafted furnishing QA, 2026-09-07

**FAIL: 29 findings, 28 fixed.** F01 remains an explicit requirement conflict: the original D85 availability guards and extractions changed four profession-source paths, while the audit requires no edits there. Preserving station, training-fee and economy validators does not satisfy a literal directory freeze. No owner waiver was received.

The final source gate at `b379ee462d` exited 0: all 12 steps passed, including 4,028 unit files / 60,594 passing tests and 46 browser files / 385 passing tests. The final visual sequence passed all 11 frames. A new independent whole-fix review accepted all 28 repairs across all 80 changed files; F01 prevents the packet from advancing.

- [Findings and dispositions](findings.md)
- [Exact validation commands, outcomes and limits](validation.md)
- [Ten recipes, three patterns and thirteen-item obligation evidence](content-evidence.md)
- [Fresh whole-fix and completion review](reviews/qa-checklist-final.md)
- [Independent frontend closing review](reviews/frontend-final.md)
- [Before/after screenshots and reproduction](../../screenshots/freehold-crafted-content-2026-09-07/qa/README.md)
- [Mutation execution records](mutations.json)
- [Independent incoming NPC fingerprint](npc-baseline-measurements.json)
- [Actual CI timing samples and generator argv](missing-weight-measurements.json)

The dependency was merged locally in `2e24ba8818`. Dedicated QA fixes are `ea3b62fad1`, `47655ffb54`, `1be1aef461`, `85f99f6a32`, `5f4821bec7` and `b379ee462d`. This evidence/verdict is committed separately. No push or PR merge occurred. The coordinator repeats `GATE_SELECT_BASE=54ce808436 npm run ci:changed` after that final commit and records its observed exit in the final task response and memory receipt.

Historical reports and failed logs retain their original observations; the closing findings, validation and fresh review identify what was subsequently resolved. Counts from overlapping test runs must not be added. Later production model, geometry and physical-performance gates retain their existing owners; this audit generated no asset and does not waive those gates.

Next file to rerun with F01 attached:

`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds/docs/freeholds/phase-04-content-crafted-and-patterns.md`
