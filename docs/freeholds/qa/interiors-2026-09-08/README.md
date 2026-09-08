# Interiors, gate and Hearth Key QA

**PASS, local, 2026-09-08: 37 findings found and 37 fixed, zero open or deferred.**
The original audit covers
`654071354172b3e252cfc03a1e85efde2daddaa6..67281f8ed40f0e20c9c9a438e38177e49b0c50ab`.
The independently reviewed fix round ends at
`957a93b05b418ac5baf7c164679b7bd72017b3c6`. The worktree is
`/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`, branch
`feature/freeholds`.

The PostgreSQL-armed canonical shared gate exited 0 with all twelve steps green:
4,210 Vitest files and 63,227 tests passed, with two existing expected failures
and 27 explained skips; all 51 browser files and 429 tests passed. Typecheck,
builds, generated-artifact freshness, security and changed-file checks passed.
The raw log retains nonfatal diagnostics; this is not a diagnostic-free claim.
The [fresh independent review](reviews/fresh-fix-review.md) accepts the complete
source/test fix round, all 46 final PNGs, raw measurements, provenance seals and
completed gate. Its 36 source/evidence findings are joined by DOC01, the final
documentation review's corrected historical-checkpoint wording. Failed attempts
remain in the execution ledger.

The original delivery is `a145a9b6c8`, `5093227a3f`, `f315050062`, `a3348cdaa1`
and `67281f8ed4`. Source repairs are `218916234d`, the deliberate arrival golden
`27489b027d`, and fresh bank/status repairs `8e9f11d4ee`. Canonical and presentation
evidence is in `713f18e41f`; actual-key evidence and its environment declaration
are in `1e322d90c2`. Shared-gate inventory corrections are `c3dd49f191`
(CI sparse cones), `524942c6b4` (loopback importer inventory) and `957a93b05b`
(live hotbar art census). No runtime change followed the final captures.

- [Findings and current disposition](findings.md): deduplicated defect and coverage rows.
- [Executed checks](execution.md): exact commands, outcomes and explicit limits.
- [Initial context handoff](reviews/context.md): delegated planning and source inventory.
- [Audited path inventory](audited-paths.txt): original delivery paths, reproducible with
  `git diff --name-only 6540713541..67281f8ed4`.

## Review coverage

These reports preserve each reviewer's original scope and limitations. Initial
FAIL, BLOCK or NOT READY judgments describe the source before fixes. Their
current disposition belongs to the findings ledger. Reviewers inspected the
coordinator's shared evidence; they did not rerun tests or the gate.

| Required concern | Retained report |
| --- | --- |
| Architecture and simulation correctness | [Correctness](reviews/correctness.md) |
| Cross-platform synchronization | [Cross-platform](reviews/cross-platform.md) |
| Renderer preparation and performance | [Render performance](reviews/render-performance.md) |
| Content obligations and item art | [Content](reviews/content.md) |
| Frontend seams, accessibility and input | [Frontend](reviews/frontend.md) |
| Privacy and security | [Security](reviews/security.md) |
| Server hot paths and database performance before decisions | [Server/database](reviews/server-db-performance.md) |
| Test coverage | [Test coverage](reviews/test-coverage.md) |
| Completion checklist | [Initial checklist](reviews/qa-checklist.md) |
| Additional hygiene audit | [Hygiene](reviews/hygiene.md) |
| Additional gate and capture-selection integrity | [Gate integrity](reviews/gate-integrity.md) |
| Persistence and mixed-release compatibility | [Persistence](reviews/persistence.md) |
| Finished database/server-cost checkpoint | [Finished checkpoint](reviews/database-finished.md) |
| Fresh independent complete fix-round and gate review: PASS | [Fresh review](reviews/fresh-fix-review.md) |

The fresh review independently found FFR01 through FFR03 and verified their
repairs. The complete shared gate exposed GI02 through GI04; each correction has
decisive focused evidence, independent review and the final passing gate. Every
finding is closed in the [deduplicated ledger](findings.md).

## Acceptance boundaries

The physical gate and isolated offline/headless Hearth Key use the shared Sim.
Online tests exercise real dispatch, authenticated owner selection, production
key refusal and explicitly injected participant success. Production remote key
admission remains fail-closed until 07/07a supplies the durable account participant,
database epoch after its lock and committed private display mirror. Neither a
plot save nor an isolated Sim/display clock authorizes production entry. Local
PostgreSQL readiness and an injected participant are not that later proof.

The isolated shared-account duration is exactly `3_600_000` milliseconds, kept
outside plot and character serialization and read through `ctx.lockoutNowMs()`.
The key is a permanent shortcut, not an entitlement. Physical entry, refused
entry and the already-owned-home no-op do not consume that duration.

The canonical functional registry remains three targets with desktop, compact
and tablet variants: nine variants and eighteen before/after PNGs. Its baseline
is the real release quay with the surface absent. The planned inventory of 557
keys and 742 variants, including 339 in Wave A, is not proof that later fixtures
exist. Supplemental key captures use actual game interaction; supplemental
prompt/refusal fixtures must be labeled presentation evidence.

The room images prove functional shells and safe arrival composition. They do
not approve the final lighting, camera or sampled welcome owned by 09. Fresh
arrival directive consumption remains with 07c/08a/09; production visiting with
18; final GLBs with 19; and Wave A close with 20. Reserved Cottage Strongbox and
station anchors remain invisible until their named owner, 12. Slot-capacity and
repeated-entry deployment signatures remain named release gates, not deferred
review findings. No new art is generated during this audit.

## Verdict packaging

Progress row `06 QA` and the state ledger/Gotchas record this scoped PASS. The
coordinator will make the separate verdict/documentation commit and run
`npm run ci:changed` after that actual last commit. That subsequent packaging
check is not claimed executed here; its actual result belongs in the final task
handoff. No push or PR merge is authorized by this packet. The next task is
[07 Persistence](../../phase-07-persistence.md).
