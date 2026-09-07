# Furnishing paired audit reports

QA verdict: **PASS**, 40 findings found and 40 resolved with independently reviewed repairs and
evidence at `d38663539433cbcd30642ea47d7663c5c52c59c0`. The final source review
returns PASS with zero open findings across 110 changed files and four repair
commits. The shared gate has completed with actual exit 0 and all 12 steps green.
Standalone i18n generation and clean generated-file status also passed. Fresh
review of the final verdict documentation and the completion checklist both
returned PASS. Zero review findings are deferred. The actual post-commit check
passed at `c881543258` with a clean status. The coordinator will repeat it after
this evidence-only amendment and report the actual exit without another repo edit.

The audit resumed after an operating-system restart. The
[restart evidence index](restart-evidence-index.md) identifies surviving records,
lost or interrupted runs and the required replacement evidence. The source
repair commits are `ce0e25ec85`, `ff738f61a1`, `a82e71f4cd` and `d386635394`;
no missing process result is inferred from those commits.

The reports below preserve the audit of the original furnishing implementation,
dependency integration and subsequent repairs. Earlier pending statements remain
historical evidence; later addenda and the [QA validation report](../../../furnishing-item-kind-qa-validation.md)
identify the results that supersede them. The original implementation reports in
the parent directory are unchanged.

| Review | Evidence |
|---|---|
| Promised deliverables, original commits and test inventory | [Context summary](context-summary.md), [initial test assertions](initial-test-assertions.md) |
| Independent kind and property consumers | [Kind census](consumer-census.md), [property supplement](consumer-census-supplement.md), [raw kind scan](consumer-census-raw.txt), [related scan](consumer-census-related.txt) |
| Initial correctness, test coverage and hygiene fan-out | [Correctness](initial-correctness.md), [coverage](initial-test-coverage.md), [hygiene](initial-hygiene.md) |
| Final cross-platform review | [PASS, actual host routes](cross-platform-sync-final.md); [earlier review](cross-platform-sync.md) |
| Final architecture review | [Architecture](architecture-reviewer-final.md), [PASS at d386635394](architecture-seal-addendum.md); [earlier review](architecture-reviewer.md) |
| Final frontend review | [PASS, all paired visual surfaces](frontend-seam-reviewer-final.md); [earlier review](frontend-seam-reviewer.md) |
| Final test coverage review | [PASS, 47 acceptance claims](test-coverage-resumed-final.md); [earlier review](test-coverage-auditor.md) |
| Completion checklist | [Final checklist](qa-checklist-final.md); [historical checklist](qa-checklist.md) |
| Fresh independent review of every fix and its integration | [Final complete-fix source PASS](fresh-complete-fix-review.md); [revoked historical review](fresh-fix-review.md) |
| Final independent consumer census | [353 classified sites, zero MISSED](consumer-census-resumed-final.md), [requested literal scan](consumer-census-requested-final.txt), [broad scan](consumer-census-broad-final.txt) |
| Database performance before decisions and after repairs | [Precheck](database-precheck.md), [finished database review](database-finished.md) |
| Persistence and authority | [Initial persistence](initial-persistence.md), [initial security](initial-security.md) |
| Dependency merge audit | [Merge verdict](merge-review.md), [simulation](merge-sim.md), [UI](merge-ui.md), [wire](merge-wiring.md) |
| Repair detail | [Equipment repair evidence](equipment-fixes.md), [finding ledger](findings-ledger.md) |
| Late property and literal census review | [Expanded coverage](test-coverage-late-property-review.md), [77 literal additions](consumer-census-final-classification.md), [fresh checkpoint](fresh-fix-review-late-checkpoint.md) |
| Late implementation details | [Exchange and WorldMarket](market-identity-fix-report.md), [Rift, auto-equip and feast](rift-auto-equip-feast-fix-report.md), [worn and enchant presentation](worn-and-enchant-fixes.md), [regalia and developer picker](regalia-and-dev-picker-fixes.md), [profession effect card](furnishing-tool-effect-fix.md) |
| Late specialist review | [Database](database-late-finished.md), [persistence](persistence-late-review.md), [security](security-late-review.md) |
| Final persistence and authority seals | [Persistence PASS at d386635394](persistence-final-seal.md), [security PASS at d386635394](security-final-seal.md), [independent security hashes](security-critical-files.sha256) |
| Exact late execution | [Historical commands](late-validation-commands.md), [resumed commands and outcomes](resumed-validation-commands.md) |
| Final host-route implementation evidence | [Tool routes](tool-route-tests-fix.md), [Commerce routes](commerce-host-tests-fix.md) |
| Reviewed file identity | [All 110 SHA-256 identities](reviewed-source-seal.json), [successful byte comparison](logs/reviewed-source-seal.log.txt), [replay attachment](attachments/seal-reviewed-files.mjs.txt) |
| Completed final shared gate | [Actual exit-0 result and exact environment](gate-final-resumed-result.json), [readable step/summary excerpts](logs/gate-final-resumed-excerpt.log.txt), [complete archived output](logs/gate-final-resumed.log.txt) |
| Final standalone i18n freshness and unchanged source | [Generator exit 0](logs/i18n-final-resumed.log.txt), [immediate status](logs/status-after-final-i18n.txt), [status after known browser-output cleanup](logs/status-after-gate-artifact-cleanup.txt), [repeated source seal](logs/reviewed-source-seal.log.txt) |
| Post-verdict-commit CI | [Initial formatting failure](ci-verdict-first-result.json), [failed output](logs/ci-verdict-first.log.txt), [corrected actual exit 0](ci-verdict-corrected-result.json), [successful output](logs/ci-verdict-corrected.log.txt), [clean status](logs/status-after-verdict-corrected.txt) |
| Restart recovery and current command matrix | [Evidence index](restart-evidence-index.md) |

The earlier fresh review and scoped reviewer addenda remain attached as history.
Their scope predates the expanded Q27-Q40 round and the revoked source verdict.
The final source and visual reports above supersede those historical checkpoints.
The final verdict text has been independently reviewed with PASS.
A reviewer report does not replace
executed tests, typechecks, generators, builds, security checks or the shared gate.

## Reproduction attachments

Archived `logs/*.log.txt` files preserve complete command/result content, with
trailing ASCII whitespace and extra empty EOF lines normalized for repository
whitespace checks. Nonempty files retain one final LF; no interior whitespace,
command, diagnostic or result text was changed. Original bytes are preserved in
the ignored `tmp/freeholds-02-audit/original-archived-logs/` directory.

The deterministic [normalizer](attachments/normalize-archive-logs.py.txt) ran as
`python3 tmp/freeholds-02-audit/normalize-archive-logs.py` with exit 0: 48 logs
verified, 28 normalized, and identical non-whitespace content in every file.
The [per-file proof](log-normalization-result.json) records original/normalized
byte counts and SHA-256 hashes, plus the unchanged non-whitespace hash. References
in historical reports to raw logs mean this complete archived command output;
the normalized archive is not claimed to retain byte-exact trailing whitespace.

The [final shared-gate runner](attachments/run-final-gate.mjs.txt) records exact
argv, explicit disposable PostgreSQL environment, source commit/tree, timestamps
and the child process's actual exit status. Its archived result records exit 0
on the final reviewed source. The [provenance delta checker](attachments/check-provenance-delta.mjs.txt)
validates that the owning remint changed only current renderer/composite hashes;
its recorded command and output are in the resumed validation archive.

The archived [UX inventory checker](attachments/check-ux-manifest.mjs.txt) is the
exact standalone audit script. Restore it to the path used by its recorded run:

```sh
mkdir -p /tmp/freeholds-02-audit
cp docs/freeholds/reviews/furnishing-item-kind/qa/attachments/check-ux-manifest.mjs.txt /tmp/freeholds-02-audit/check-ux-manifest.mjs
node /tmp/freeholds-02-audit/check-ux-manifest.mjs
```

It reconstructs approved key tables in encounter order, rejects unparsed key rows,
and proves semantic and byte equality with the committed manifest. Its executed
result covers 557 unique rows, the four owner-02 keys, and the nonnumeric owners
30a and 41a. [Output](logs/ux-manifest.log.txt) records the reconstruction hash.

The compiler probes are preserved as text attachments:
[invalid source](attachments/narrow-def-negative.ts.txt),
[valid source](attachments/narrow-def-valid.ts.txt),
[invalid config](attachments/narrow-def-tsconfig.json.txt), and
[valid config](attachments/narrow-def-valid-tsconfig.json.txt). Copy them to their
original `/tmp/freeholds-02-audit/` names to rerun the exact commands in the
validation report. They refer to the packet worktree by absolute path; a different
checkout requires updating that root in the temporary copies. The negative
probe must fail on the two named errors; a compiler failure from any unrelated
reason does not satisfy the contract.

The [visual evidence directory](../../../../screenshots/furnishing-item-kind/qa/README.md)
owns the screenshot harness attachment, accepted images, native-event manifests
and source identity. These are screenshots of existing assets with a synthetic
in-memory item, not generated artwork or shipping content.
