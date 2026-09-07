# Furnishing QA restart evidence index

Historical checkpoint: resumed on 2026-09-07 without a final QA verdict. The operating-system
restart removed the prior `/tmp/freeholds-02-audit` working directory and ended
its running processes. Durable evidence below survived under `docs/`. A command
whose completion output was lost is not recorded as passed.

The source commits present at resumption are
`ce0e25ec8593605d8f609074c4854fec56a811b2` and
`ff738f61a10822d807e44d26538bc1e1c01f7819`, following dependency merge
`041fd790cec0ea52c3e2285dcac7c3a49f30e7b0`. The later source seal is
`d38663539433cbcd30642ea47d7663c5c52c59c0`, also including the provenance repair
`a82e71f4cd`. The final source reviewer has now verified all 40 repairs across
all four commits. This conclusion comes from replacement evidence below, never
from an inferred completion of the interrupted processes.

## Durable evidence and recovery

The archived reports, attachments and logs were copied without content changes
to `tmp/freeholds-02-audit/recovered-checkpoint/`. That ignored recovery directory
is a working copy, not a new execution record. The durable sources remain the
links below.

| Evidence | Surviving record | What it establishes |
|---|---|---|
| Original promises and test inventory | [Context summary](context-summary.md), [assertion inventory](initial-test-assertions.md) | Scope and inspection at the original furnishing tip |
| Initial audits and required reviewer roster | [Archive index](README.md) | Earlier findings and bounded reviewer conclusions; their final source PASS was revoked |
| Complete finding inventory | [Finding ledger](findings-ledger.md) | Q01-Q40; completion evidence was pending at resumption and is now replaced by the final reviewed PASS below |
| Initial card and cell visual comparison | [Visual record](../../../../screenshots/furnishing-item-kind/qa/README.md) | Accepted mouse/touch captures for the first repair only |
| Required furnishing matrix | [Original accepted result](logs/required-scoped-final.log.txt), [late accepted result](logs/required-scoped-late-final.log.txt) | Each completed with 11 files and 477 passing tests at its stated checkpoint |
| Late property regressions | [Late matrix](logs/late-final-tests.log.txt), [power boundaries](logs/late-power-green.log.txt), [event and authority](logs/late-event-auth-green.log.txt) | Completed 64-, 102- and 38-test groups at their named checkpoints |
| Existing consumer neighbors | [Neighbor result](logs/late-neighbors.log.txt) | 11 existing matched files and 611 tests; the two absent requested paths are disclosed in the exact command record |
| PostgreSQL integration | [Storage and journal result](logs/merge-pg.log.txt), [serial differential result](logs/pg-differential-serial-green.log.txt) | Completed 95-test and 11-test groups; the failed parallel run is retained separately |
| Compiler probes | [Negative output](logs/narrow-def-tsc.log.txt), [valid output](logs/narrow-def-valid.log.txt), [attachments](attachments/narrow-def-negative.ts.txt) | Expected union/use and required-radius failures plus independent valid control |
| Approved key inventory | [Checker attachment](attachments/check-ux-manifest.mjs.txt), [output](logs/ux-manifest.log.txt) | Executed byte equality against the approved manifest, including nonnumeric owners |
| Source type and architecture checkpoint | [Typecheck](logs/tsc-sealed-final.log.txt), [architecture](logs/seal-architecture-final.log.txt) | Recorded checkpoint checks; these do not validate later edits |
| Changed-file formatting checkpoint | [Initial diagnostic](logs/late-explicit-biome.log.txt), [safe repair result](logs/late-explicit-biome-fixed.log.txt) | Import repairs and unused-import removal, followed by exit 0 with warnings disclosed |
| Generator freshness checkpoint | [Generator](logs/i18n-late-final.log.txt), [status](logs/status-after-late-i18n.txt) | Owning generator completed and no generated artifact appeared in that status |

## Lost or interrupted work at resumption

This list preserves the restart checkpoint. Completed replacement runs are
recorded in the current matrix below and supersede its pending descriptions.

- The later full shared-gate process has no surviving final exit record. It is
  unverified and must run again. The earlier [completed failure excerpt](logs/gate-first-failure-excerpt.log.txt)
  remains a failure, not replacement evidence for the missing run.
- The separate late regalia, developer-picker and tool-effect command was
  reported during the prior session, but its raw output was not copied into the
  durable archive. It is not credited as final execution evidence here; the
  coordinator will rerun the current tests.
- The attempted late Exchange, WorldMarket and paperdoll browser captures have
  no accepted durable screenshot/manifests. The surviving ignored capture script
  can be reused after inspection, but both comparable source captures still need
  completed commands and visual review.
- The expanded fix round has no surviving final fresh-review PASS. New source
  review must cover both existing fix commits and every resumed repair commit.
- No post-last-commit `npm run ci:changed` result exists for the final contribution,
  because the verdict and remaining repair commits have not been made.

The previous expected-failure probes, initial failed full gate, PostgreSQL
fixture deadlock and rejected browser setup attempts remain disclosed in their
existing records. Recovery never changes an incomplete or failed run into a pass.

## Resumed command matrix

The coordinator owns execution. The [resumed command record](resumed-validation-commands.md)
contains exact completed commands, exits and current durable output. The
[validation report](../../../furnishing-item-kind-qa-validation.md) and
[late command archive](late-validation-commands.md) retain the historical exact
commands. Counts from overlapping groups must not be added together.

| Required current evidence | Current replacement evidence |
|---|---|
| Actual tool, commerce and feast ClientWorld refusal and same-call eligible controls | [Exit 0, three files and 24 tests](logs/routes-final.log.txt), independently reviewed at d386635394 |
| Regalia, developer picker and effect card | [Exit 0, four files and 40 tests](logs/presentation-resumed.log.txt) |
| Required furnishing matrix plus bank/craft-from-vault/feast/localization neighbors | [Exit 0, 15 files and 764 tests](logs/required-resumed.log.txt), three existing release-only skips disclosed |
| Final `npx tsc --noEmit` | [Exit 0 after final route fixes](logs/tsc-routes-final.log.txt); earlier independent compiler probes retained above |
| `npm run i18n:gen` followed by `git status --porcelain` | [Generator exit 0](logs/i18n-final-resumed.log.txt), [no generated i18n changes](logs/status-after-final-i18n.txt); known browser-only output cleanup and source reseal passed |
| `node scripts/gate_select.mjs` with explicit disposable PostgreSQL configuration | [Actual exit 0 at d386635394, all 12 steps green](gate-final-resumed-result.json); [complete output](logs/gate-final-resumed.log.txt) |
| Both SQL differential suites, executed serially with matching database URLs | [Repeated exit 0, two files and 11 tests, no skips](logs/pg-differential-final.log.txt) |
| Comparable late desktop and mobile browser captures | [Both commands exit 0, zero assertion failures; frontend PASS](../../../../screenshots/furnishing-item-kind/qa/README.md) |
| Final literal and property consumer census | [353 classified sites, 92 touched, 261 by design, zero MISSED](consumer-census-resumed-final.md) |
| Cross-platform, architecture, frontend, coverage and completion-checklist reports | All current PASS reports linked in the [review index](README.md); final verdict substitutions independently reviewed with PASS |
| Independent review of the entire expanded fix round | [Source PASS on all 110 changed files and four commits through d386635394](fresh-complete-fix-review.md) |
| Final documentation review and post-last-commit `npm run ci:changed` | Final documentation and checklist PASS; [actual post-commit exit 0 at c881543258](ci-verdict-corrected-result.json) and clean status. The same command runs after the evidence-only amendment, with its actual exit reported in the final handoff |

The resumed stale tooltip ownership comment belongs to Q37's documentation
accuracy repair. It does not create a new runtime finding or change the count.
The final source review explicitly confirms that comment and the additional
Q35 host controls. Named unsigned external release artifacts remain release
gates, never deferred review findings.
