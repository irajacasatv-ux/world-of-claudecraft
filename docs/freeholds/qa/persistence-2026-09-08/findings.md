# 07 findings ledger (every finding, every reviewer, applied or ruled)

Status key: FIXED (with the commit that did it) / RULED (reviewed, no change warranted,
with the reason). Nothing is OPEN: the round is closed.

Nine reviewers were dispatched and nine reported: migration-safety, database-performance,
privacy-security, server-hot-path, architecture, cross-platform-sync, test-coverage,
frontend-seam and qa-checklist. Their reports are the sibling files in this directory.
A SECOND, FRESH review lane then read the fix round itself, because a fix round is
unreviewed code; its findings are folded in below rather than kept apart.

## BLOCKING

- B1 the byte ceiling was enforced against two DIFFERENT measurements, and the save path
  checked neither. Re-measured against PostgreSQL 16 rather than trusted: the maximal legal
  record is 101,139 bytes of canonical JSON, and its two content columns measure 100,866
  canonical against 106,032 as jsonb text, because jsonb re-renders every object with a space
  after each colon and comma and stores every number as `numeric` in full positional form.
  FIXED in 4dbddca2dc: a codec rule refusing any number whose JSON text carries an exponent
  (which is what keeps the two renderings a fixed ratio apart rather than an unbounded
  multiple), `FREEHOLD_MAX_STORED_BYTES` as a separately measured bound for the SQL read,
  `freeholdWriteRefusal` applying all three load ceilings before every write, and a
  real-PostgreSQL round trip of the maximal record as the proof that writable implies
  readable.
- B2 the one wire carrying the durable record from ws_auth into game.join had NO test; a
  mutant deleting `freehold,` from the join meta left 168 tests green.  FIXED in 19fefbbeea:
  the five-case pair modelled on the bank-bonus pair, including the arm that proves a thrown
  durable read joins with nothing installed instead of refusing the login, and the contrast
  arm proving a thrown bank-bonus read still does refuse it.
- P1-1 (database-performance) one real edit produced two byte-identical durable writes
  whenever an arm landed while a write was in flight, which shutdown made routine.
  FIXED in 19fefbbeea: a write records the generation and the revision it sampled, and only a
  genuinely later edit re-arms.

## SHOULD-FIX

- S1  `schema_version` was never written, so the forward-version arm was inert.  FIXED in
      bd22f1aa78, on both the insert and the compare-and-swap save, proved against real
      PostgreSQL with a version that is not the current one.
- S2  the leave flush used a weaker dirty test than the sweep.  FIXED in bd22f1aa78.
- S3  contract section 7's "two-layer" enforcement claim was false in both halves.  FIXED in
      4dbddca2dc: the section now states which layer bounds which text and why they differ.
- S4  contract section 4's "refuses before deep allocation" was false for the sim layer.
      FIXED: the row counts bound the build and are checked first; the byte check follows it,
      and the contract says so rather than claiming the two layers refuse alike.
- S5  contract section 4 attributed `unadmitted` to a forward `schema_version`.  FIXED: the
      two causes are separated, because only the stranded `plot_index` is something the SQL
      reader itself admits.
- S6  the plot_id charset CHECK is a policy frozen where CREATE TABLE IF NOT EXISTS can never
      revisit it.  FIXED in bd22f1aa78 as a documented decision: the charset is the wire's own
      permanent contract, so widening it is a wire change first, and the DDL now names the
      explicit ALTER a widening release owes.
- S7  `installLoadedFreehold` discarded the durable Hearth clock whenever the plot was held or
      absent, handing a free travel to accounts already in recovery.  FIXED in e23d2a906e.
- S8  preload's replay arm tested `hold === null` instead of `blocked()`, so a quiesced entry
      replayed a stale house as current.  FIXED in bd22f1aa78.
- S9  load_report.ts had no production caller and the server hand-built its own details,
      routing around the only bound on what may reach a log.  FIXED in e23d2a906e: every
      detail comes from the reporter, and its second, uncalled log helper is deleted rather
      than left as a way past the bound.
- S10 `FREEHOLD_VISIT_POLICIES` duplicated the union with no compile-time link.  FIXED in
      e23d2a906e: both are derived from one list.
- S11 a server module was a second writer of `ctx.freeholdKeyReadyAtMs`.  FIXED in e23d2a906e:
      `mergeFreeholdKeyReadyAt` owns the forward-only rule, the map has exactly two writers,
      and a source scan over server/, net/, game/, ui/ and render/ holds that.
- S12 a preload whose handshake then failed leaked its store entry for the process lifetime.
      FIXED in 19fefbbeea: a mark-and-sweep pass on the periodic hook, two passes apart so the
      ordinary preload-then-retain window is untouched.
- S13 the `hasLive` short circuit could produce a permanently write-blocked entry, discarding a
      whole session of edits.  FIXED in bd22f1aa78: the read still happens; only the installed
      state is withheld.
- S14 the development tier grant becomes DURABLE for the first time and nothing said so.
      FIXED: its own subsection in the rollout contract, naming the blast-radius change and
      why `ALLOW_DEV_COMMANDS=1` in production is worse than it was.
- S16 the account-export pin read RAW source, so a commented-out loader kept it green.  FIXED
      in 553ab59851, and the same mutation now fails it.
- S17 the `WOC_FREEHOLD_PERSIST` gauge family had no test.  FIXED in 553ab59851 with a distinct
      value per measure, so a swapped pair fails.
- S18 the documented backwards-revision arm of `noteRevisionMoved` was untested.  FIXED in
      553ab59851; the `<=` mutant now fails two cases.
- S19 the INSERT column list was unpinned in the always-on tier.  FIXED in bd22f1aa78.
- P2-2 through P2-14 (database-performance) all applied: the entry leak (S12), the detoast
      pre-gate, per-kind load failures, `held` split from `quiesced`, the tick profiler sample
      on the housing sweep, a shorter login-path permit wait, a local write admission cap, a
      bounded leave flush, counters rather than gauges for cumulative totals, statement
      duration totals, byte total plus high-water mark, and the revision-coupling pin. P2-14
      (non-HOT updates rewriting both btrees) is RULED: recorded, no action, negligible at the
      current write rate and now halved by the P1-1 fix.

## NITS

- N1  a non-numeric version slipped past the forward-version arm.  FIXED in e23d2a906e: a
      version present but not a positive integer is malformed, so the row is preserved
      read-only rather than normalized up to a shape no release wrote.
- N2  `rev: Number(row.wireRev)` narrowed a bigint one layer above the boundary that forbids
      it.  FIXED in bd22f1aa78: it refuses instead of rounding into a fence that never existed.
- N3  `ABSENT_HEARTH_REVISION` was used for a plot hold's `durableRev`.  FIXED in 9377ed1d42.
- N4  a fractional condition clamped without rounding, so the loader and the writer disagreed.
      FIXED in 4dbddca2dc.
- N5  `placementId` and `plinth` had no magnitude bound.  FIXED by B1's codec rule, which
      admits only positional safe integers.
- N6  a plot_id unique violation was not diagnosed by `upsertFreehold`.  FIXED in bd22f1aa78,
      with a contrast arm proving no other database error is swallowed.
- N7  the deliberate empty-id admission had no fixture.  FIXED in 553ab59851, with its
      one-character-over contrast so the admission is not a missing check.
- N8  the unserializable arm of `persistedFreeholdBytes` was untested.  FIXED in 553ab59851.
- N9  the `drainWaiters` Set's stated concurrency reason was untested.  FIXED in 553ab59851.
- N10 the synchronous enqueue-throw catch arm was untested.  FIXED in 553ab59851.
- N11 `oldestDirtyAgeMs`'s "oldest" semantics was unpinned.  FIXED in 553ab59851 with two dirty
      entries six seconds apart.
- N12 `requireUpsertInput` did not bound the two lengths the DDL CHECKs.  FIXED in bd22f1aa78.
- N13 a thrown database error did not quiesce, so the sweep could retry it forever.  FIXED in
      bd22f1aa78 after a bounded run of thrown writes, with the run reset on any commit so a
      blip never accumulates.
- N14 an internal account id reached a hearth console line.  FIXED in bd22f1aa78: every hearth
      detail classifies, never identifies.
- N15 the barrel gained 15 names with one barrel consumer.  FIXED in e23d2a906e: the durable
      persistence vocabulary is server-facing and imported by path.
- N16 `plotId` is presentation-only and must never gate sim behavior.  FIXED: stated on the
      type itself.
- N17 the join-path retain was not inside a try/finally.  FIXED in e23d2a906e.
- N18 `advanceFreeholdHearthOnClient` has no production caller.  FIXED: the contract now
      carries the marker, and says why the pair is still the capability it names.
- N19 `meta.freehold` was read off a spread bag with no structural guard.  FIXED in e23d2a906e.
- N20 a write-blocked hold is invisible to the player.  RECORDED as a deliberate gap in the
      rollout contract, owed by the release that lights housing up: there is nowhere to put a
      message while the housing UI is dark, and an operator watching the `held` measure is the
      only observer this release has.
- Nit-15 (database-performance) a hearth constant stood in for a plot revision. Same as N3.
