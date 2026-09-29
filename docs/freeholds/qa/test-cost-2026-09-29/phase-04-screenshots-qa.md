# Part 5, phase 4 (screenshots, the browser suite, the capture scripts): QA

Verdict: PASS. The corpus, the browser suite and the capture scripts were judged under ruling (c)
and the value rule; two fresh reviewers came back without a should-fix and their nits are
applied; phase 5 may start.

## The screenshot corpus, under ruling (c)

Ruling (c), verbatim in the ledger: evidence screenshots no test, doc, script or provenance
record references may leave the repo; hash-sealed and test-pinned files always stay; git history
keeps every deleted file. Standing instructions for the step: keep `eastbrook-vale-rebuild/`,
`eastbrook-grand-armoury/`, README heroes, and anything a test, the sparse CI cone or a
provenance record reads; a slug that appears only as a capture script's output directory or as
a feature name is not a reference to the file.

Method. `tools/screenshot_refscan.mjs` rescanned the tip (it now takes path prefixes to
exclude, since this record's own `data/` lists every screenshot path); the classes reproduced
phase 1 exactly: 1,077 files named by path, 327 named only by bare basename, 536 whose directory
only is named, 477 named nowhere. One agent then read every file outside the by-path class,
grouped by directory, against the rules above:

| Class | DELETE | KEEP |
|---|---|---|
| named nowhere | 382 files, 181.3 MB | 95 files, 54.9 MB (cone, eastbrook, READMEs and manifests inside their own directory, and paths built from parts the scanner missed) |
| directory only | 0 | 536 files, 354.2 MB (every directory a doc cites as evidence) |
| basename only | 84 files, 50.2 MB (generic names matched in another feature's text) | 243 files, 96.1 MB |

One override toward keeping: `world-quest-forging/mara-speech-workshop-portrait.png`, which the
design doc's prose describes ("Portrait reaches the game's existing rotate-to-landscape
screen") though it never links it. Landed in `7953085f86`: 465 files, 231.3 MB, 67 directories
whole; the tracked subtree floor in `tests/ci_workflow.test.ts` follows (135 to 68, mutant
killed). Kept only because a README inside the same directory names them, flagged for a later
ruling: `buried-hoard-cavern` `basin/` and `camera-*` (45.5 MB), `buried-hoard-tide-wave` (7
MB), `website-redesign` (3.9 MB).

## The browser suite

A value audit of all 67 files under `tests/browser/` (each must guard something a Node test
cannot): no file is wholly redundant; nearly every one measures real layout, hit testing,
WebGL, trusted input or canvas.

- `keyboard_nav`: its four focus-trap cases drove a bare `FocusManager` with synthetic Tab
  keydowns, which `tests/focus_manager.test.ts` pins case for case. Four mutants of the trap in
  `src/ui/focus_manager.ts` (focus-first taking the close button, a trap with focus outside,
  Shift ignored, no return focus), each killed by the Node suite (control 31 of 31; each mutant
  1 to 7 of 31 failed); the cases went in `b68f856b5a` (11 of 11 green in a real Chromium
  after). The coverage read then found that the Shift+Tab trap and the free Tab with focus
  outside the window (the game's Tab-target key) had lost their only real-document proof, so
  the kept TalentsWindow case now asserts both (`51363c816f`): with the trap-outside and the
  Shift-ignored mutants, the browser file fails 1 of 11 each (control 11 of 11; the first form
  of the Shift assertion let that mutant survive and was tightened to require the reverse
  direction).
- `harvest_preference`: six cases have Node counterparts piece by piece, but the browser file
  drives two real controllers wired together through real clicks, which no Node suite does.
  Kept; the saving would be under 2 s in a job that is not on the PR critical path.
- Recorded, not taken: scoping the browser job to the diff on pull requests, dropping it on
  pushes to queue-protected branches, and skipping the nightly browser leg when the ref was
  green within a day. Each saves runner minutes, none moves the PR critical path or the ruled
  targets, and each changes the gate's selection or the merge-queue contract, which needs its
  own review.

## The capture scripts

Of the scripts that drive a browser, 85 had no npm script, skill, workflow, doc recipe, test
pin, hygiene list entry or other script naming them (verified per basename with `git grep` over
every tracked file); they were retired in `e5218a6076` (529 KB). Kept on purpose: the four asset
`capture_*` rigs (each asset directory's reproduction recipe, beside its pinned exporter; their
evidence directories sit in the test-read cone), the scripts only other scripts cite as
templates ("modeled on"), `tutorial_island_e2e` and `deeds_screenshots` (named harnesses whose
owners were not asked).

Five sparse-cone directories were reachable only through retired scripts that named them as
output locations: they leave the cone in every sparse block of `ci.yml` and the pinned literal,
and `nythraxis-dread-curse-swap`, named by nothing else, leaves the repo. The test-reachable
corpus floor follows (11,060 to 10,975, exactly the 85 retired files) and the subtree floor
(68 to 67); mutants on both floors and on a dead cone entry, all killed.

The tracked tree fell from 2.72 GB at the pause to 2.49 GB.

Not in the ruling's scope, recorded: merged PR bodies that embedded one of the deleted files by
a branch-relative link now show a broken image (git history still holds the file).

## Reviews

- gate-integrity-reviewer over `7953085f86`, `e5218a6076`, `b68f856b5a`: PASS; one info (the
  corpus floor's comment misstated its history), applied in `be919f9d2c`.
- test-coverage-auditor, fresh (every deleted file and slug scanned, including relative, encoded
  and backslash forms; hash manifests; the retired scripts' names): PASS; three nits, applied
  (`51363c816f`, and the two paragraphs above).
