# Focused coverage closure: F22 evidence seals and CI measurement nit

Independent read-only follow-up over the unstaged repairs to `tests/furnishing_recipes.test.ts` and `tests/ci_workflow.test.ts` atop `ea3b62fad1`. No repository files or tests were edited, and no test command was run by this reviewer.

**Both findings are closed by source review. No new finding in the focused diff.** This supplements and supersedes the low evidence-rehash limitation and CI count nit in `/tmp/freeholds-crafted-qa-test-coverage-final.md`.

| Claim | Verdict | Decisive evidence |
|---|---|---|
| Actual geometry-measurements.json bytes remain the accepted artifact | Covered | Literal row at `tests/furnishing_recipes.test.ts:104`: SHA c340590e9b89415432f7c0712dacfea273486d3cc42b20900f1ae0004336a8c8, 75,312 bytes. The parameterized body checks calibration membership at `:121`, reads this actual file at `:122`, checks byte length at `:123`, and hashes actual bytes against the literal at `:124`. |
| Actual geometry-proposal.json bytes remain the accepted artifact | Covered | Independent literal row at `tests/furnishing_recipes.test.ts:109`: SHA d944116ea84fedc226635cb74fa5c6dadccca531622439f8b47e84e2d2e6825f, 8,417 bytes, reaching all four assertions at `:121` through `:124`. |
| Actual economy-measurements.json bytes remain the accepted artifact | Covered | Independent literal row at `tests/furnishing_recipes.test.ts:114`: SHA 8e7a10f6b5f1e073c1652fe4819a0c16a8f44071e1f8b1649c2d70afa4f8e64e, 1,925,504 bytes, reaching all four assertions at `:121` through `:124`. |
| Calibration itself stays independently sealed | Covered and preserved | Existing literal SHA assertion at `tests/furnishing_recipes.test.ts:79` remains unchanged: c211e11ae3289fc5ae8745f27c13c3253164dcf9188641fbcbf3c150fa479e2b. `git diff --name-only HEAD` for calibration and the three referenced artifacts returned no changes. |
| CI vacuity floors are tied to an accurate identified snapshot | Covered; independently measured | Comments at `tests/ci_workflow.test.ts:474` and `:531` explicitly identify ea3b62fad1, with floors 306 and 9,404 at `:477` and `:533`. Independent read-only `git ls-tree -r --name-only ea3b62fad1` enumeration with the guard's directory/extension/self-exclusion rules measured exactly 306 screenshot subtrees and 9,404 corpus paths. |

The three-row parameterization is a literal nonempty cohort. Expected hashes are independent of parsed calibration, so changing only a file, only its stored entry, or both the file and its stored entry cannot remain green by moving the expectation with the actual data. A same-length byte alteration fails the SHA assertion; a length change fails the byte assertion; deletion throws at the actual filesystem read. Existing calibration sealing also blocks silent edits to the stored evidence table. No immutable-artifact constraint is violated because the repair adds reads/assertions and leaves artifacts untouched.

The CI edit raises the corpus floor from 9,402 to 9,404 and keeps process-status checks, missing-file handling, self-exclusion, and exact reference/cone set equality intact. The dated, named snapshot avoids an inaccurate claim about later growing HEADs.

**Execution status:** the coordinator is running the four owning suites; their result was pending at this handoff. This source-coverage closure does not imply those tests, the final gate, visual checks, or the outstanding D85 scope decision have passed.
