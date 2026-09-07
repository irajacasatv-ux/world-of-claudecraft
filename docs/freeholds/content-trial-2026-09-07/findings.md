# Distinct completion-round findings

Full reviewed source span is `3fa4965a3c186982aafd44b3ec9b9d9851ace52d` through the
completed working tree. This ledger counts distinct issues found while finishing
the accepted development implementation and paired audit. Earlier partial-checkpoint
review history remains in its original report; it is not added again to this round.
Repeated reviews of one repair count once. Grouped validation fields stay one
finding when the originating report grouped them. Four visual VERIFY items count
as evidence gaps, not game defects. Intermediate harness retries are execution
history, not additional product findings.

**Found 39; resolved 39; outstanding 0; deferred findings 0.** Production and
pre-shipping scope boundaries, including the explicitly deferred voice, are
listed separately in acceptance.md and are not reported as repaired defects.

| ID | Kind | Finding | Resolution and evidence |
|---|---|---|---|
| F01 | producer | Separate source hashing after decode | RESOLVED: Source snapshot caches decoded bytes and refuses disk/buffer drift. [producer-correctness.md](reviews/producer-correctness.md) |
| F02 | producer | Partial rug factory recognition | RESOLVED: Complete unique AST-selected factory hash and mutation negatives. [producer-correctness.md](reviews/producer-correctness.md) |
| F03 | coverage | Unavailable Hearth test did not reach actual admission | RESOLVED: Real open() with only catalog dependency absent, two window states. [paired-coverage.md](reviews/paired-coverage.md) |
| F04 | coverage | Primitive-only decor dominance untested | RESOLVED: Independent primitive-dominant metric assertion. [paired-coverage.md](reviews/paired-coverage.md) |
| F05 | coverage | Observation selector fixtures could hide wrong identities | RESOLVED: Distinct yields, positive decoys and separate family/tier/alternative negatives. [paired-coverage.md](reviews/paired-coverage.md) |
| F06 | coverage | Hide/cloth ordinary-source reuse untested | RESOLVED: Each family tested without tier-two observations. [test-finishing-closure.md](reviews/test-finishing-closure.md) |
| F07 | coverage | Independent producer validation arms untested | RESOLVED: Separate comparator/ore/ratio/transform/cost invalid inputs. [test-finishing-closure.md](reviews/test-finishing-closure.md) |
| F08 | coverage | Positive decor floor assertion was vacuous | RESOLVED: All-zero metric vector requires literal one. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F09 | coverage | Scheduled grade junk/listability not explicitly asserted | RESOLVED: All sixty grade positions check kind and both restriction flags. [paired-correctness.md](reviews/paired-correctness.md) |
| F10 | runtime | Vendor Enter opened chat and Space reached gameplay | RESOLVED: Existing native-button guard enrolls vendor; trusted browser red/green. [keyboard-repair.md](reviews/keyboard-repair.md) |
| F11 | runtime | NPC definition reshaped shared terrain while dark | RESOLVED: Skip only its automatic calm pad; unchanged height and chunk goldens. [terrain-repair.md](reviews/terrain-repair.md) |
| F12 | catalog guard | Old copper-vendor relic ban rejected accepted Hearth | RESOLVED: Exact eight vendor/item pairs, independent wrong-ID/vendor negatives. [content-obligations.md](reviews/content-obligations.md) |
| F13 | catalog guard | Relic source-default count omitted actual page | RESOLVED: Literal source-default count sixteen. [content-obligations.md](reviews/content-obligations.md) |
| F14 | catalog guard | Bag All-only census omitted furnishings | RESOLVED: Add exact eight IDs without new bag category. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F15 | catalog guard | Crucible tail assumed no later page | RESOLVED: Pin actual final three page IDs in order. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F16 | catalog guard | Profile completion total omitted eight items | RESOLVED: Literal character total 409 with attribution. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F17 | catalog guard | Vendor stock census omitted new merchant | RESOLVED: Exact new merchant stock count eight; other vendors unchanged. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F18 | catalog guard | Exchange mount census counted shared furnishing bucket | RESOLVED: Count true mount kind and separately pin all eight furnishing policies. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F19 | catalog guard | Scoring-page memo count omitted Hearth | RESOLVED: Literal 39 scoring pages and one Hearth page. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F20 | documentation | Guide local inventory omitted Hearth | RESOLVED: Add actual shelf to Guide guidance. [cross-platform.md](reviews/cross-platform.md) |
| F21 | documentation | Housing payment comment said copper/day | RESOLVED: Correct eligible-material/week semantics. [cross-platform.md](reviews/cross-platform.md) |
| F22 | hygiene | NPC predicate imported a content leaf | RESOLVED: Use public content barrel. [hygiene-and-gate-integrity.md](reviews/hygiene-and-gate-integrity.md) |
| F23 | documentation | Command comment claimed no flag reader existed | RESOLVED: Distinguish NPC bootstrap from inert command bodies. [security.md](reviews/security.md) |
| F24 | documentation | Current handoff described absent delivered content | RESOLVED: Accepted development status plus explicitly historical checkpoint. [content-obligations.md](reviews/content-obligations.md) |
| F25 | documentation | Geometry table overstated legal-room evidence | RESOLVED: State per-object containment/open-lattice scope. [content-obligations.md](reviews/content-obligations.md) |
| F26 | metadata | Raw producer JSON conflicted with whitespace formatter | RESOLVED: Four exact formatter-only paths preserve accepted bytes; mutable art formatted. [hygiene-and-gate-integrity.md](reviews/hygiene-and-gate-integrity.md) |
| F27 | documentation | Current ledger used wrong item i18n prefix | RESOLVED: Correct entities.items.freehold_*.name. [qa-checklist-initial.md](reviews/qa-checklist-initial.md) |
| F28 | documentation | Current activation row called old freeze the authority | RESOLVED: Link accepted development successor and retain production gates. [qa-checklist-initial.md](reviews/qa-checklist-initial.md) |
| F29 | documentation | Current progress next link still targeted implementation | RESOLVED: Advance current handoff consistently at completion. [qa-checklist-initial.md](reviews/qa-checklist-initial.md) |
| F30 | documentation | Retained review contained en-dash ranges | RESOLVED: Normalize report ranges without changing claims. [hygiene-and-gate-integrity.md](reviews/hygiene-and-gate-integrity.md) |
| F31 | receipt | Per-review counts lacked a distinct total | RESOLVED: This explicit deduplicated ledger. [qa-checklist-initial.md](reviews/qa-checklist-initial.md) |
| F32 | receipt | Finishing closure lacked its preceding full claim matrix | RESOLVED: Retain original full report beside closure. [test-finishing-closure.md](reviews/test-finishing-closure.md) |
| F33 | test repair | New Exchange assertion lacked its import | RESOLVED: Import actual exchangeBrowseCategory; full eight-file repair passes. [fresh-entire-fix.md](reviews/fresh-entire-fix.md) |
| F34 | producer repair | Parser version lookup used aliased package path | RESOLVED: Read actual imported TypeScript version and rerun producer. [content-obligations.md](reviews/content-obligations.md) |
| F35 | visual VERIFY | Early screenshot captured arrival loading curtain | RESOLVED: Wait on actual zone readiness; inspect final Hearth image. [frontend.md](reviews/frontend.md) |
| F36 | visual VERIFY | Canonical mobile Overview target initially failed | RESOLVED: Unchanged failed-target-only retry, original receipts retained. [frontend.md](reviews/frontend.md) |
| F37 | visual VERIFY | Item runtime visual acceptance was pending | RESOLVED: Inspect actual desktop/mobile/Guide captures and seal hashes. [frontend.md](reviews/frontend.md) |
| F38 | visual VERIFY | Mobile grid below fold with performance notice over UI | RESOLVED: Ordinary scrolling and actual dismiss-button supplemental capture. [frontend.md](reviews/frontend.md) |
| F39 | receipt hygiene | Final staged evidence had extra terminal or blank-context whitespace | RESOLVED: Normalize mutable inventory/compact-log endings and five diff context blanks; unchanged parsed patch census. [final closure](reviews/qa-checklist-closure.md) |
