# 07 findings ledger (every finding, every reviewer, applied or ruled)

Status key: FIXED (with the commit that did it) / RULED (reviewed, no change warranted,
with the reason).

THE ROUND IS NOT CLOSED. NINE fix rounds have now run and EIGHT of the nine introduced a
defect worse than one they closed, each caught by a fresh reviewer and never by the
round's own green tests. An earlier version of this line declared the round closed after
the third; that was wrong three times over. A later version said six rounds with the sixth
unreviewed; that was true when written and went stale within two commits. Both are
corrected here rather than quietly amended.

READ THE ROUNDS SEVEN, EIGHT AND NINE SECTION BEFORE ANY OTHER PART OF THIS FILE. Rounds
seven and eight reverted a mechanism that Y1, Z6 and W4 below still describe as the live
fix, and round nine replaced the seal those three argue about. Those three entries are
HISTORY, and each now carries a pointer saying so.

Nine reviewers were dispatched and nine reported: migration-safety, database-performance,
privacy-security, server-hot-path, architecture, cross-platform-sync, test-coverage,
frontend-seam and qa-checklist. EIGHT of them left a report file in this directory; the
qa-checklist gate reported inline across two chunks and has no file.
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

## FIX-ROUND FINDINGS (the fresh lane, which read the fix round as unreviewed code)

Five reviewers read `b2aeb46da2..f5dd9a3a44` and found three ways a real house could
still be lost. All three are closed in 23ffc92983 and e4b029d65d, and the terminal
state they share is now a counter rather than something only reading finds.

- X1 BLOCKING (security). The hasLive-but-not-loaded read widened a window in which a
  freshly seeded default could be compare-and-swapped over a real row. A leave drops
  the store entry while the sim record is still live, so a rejoin landing between them
  reads the row, learns a durable revision, and is handed a default once the old
  session's removePlayer evicts. Because the CAS never touches plot_id, the loss left
  the identity intact and was invisible in the key. FIXED: a write refuses a live
  record still carrying the unassigned plot id when the entry has a durable revision,
  or one whose identity is not the one the entry loaded.
- X2 BLOCKING (security, database-performance). A write deferred by the local cap, or
  one whose leave deadline expired, ran after eviction, serialized to null and wrote
  nothing: the leaving session's last edits were silently gone, with no counter.
  Reproduced by the database reviewer at both arms. FIXED: the document is captured
  before the wait.
- X3 BLOCKING (database-performance). The first fix for X2 cleared that capture at the
  top of `settle`, so a RE-ARMED write inherited nothing and lost the last edit anyway.
  FIXED: the clear moved to the non-rearm branch, and its own lifetime is pinned by a
  test proved decisive by removing it.
- X4 BLOCKING (architecture, tests). `freeholdWriteRefusal` enforced only the three
  ceilings while the loader had gained the positional-number codec rule, so eight
  document classes were writable and unreadable. FIXED: the save path runs the same row
  predicates and the same identity sets, through a new `identitySets()` port so the two
  cannot be declared twice and drift. A property test over eleven document classes
  replaced the three named cases.
- X5 BLOCKING (architecture, tests). The two removal paths disagreed about what counts
  as owing work; either disagreement drops a save. FIXED: one `owesWork` predicate, and
  a blocked entry is collected rather than kept forever.
- X6 BLOCKING (tests). `revFromBigintText` had no coverage AND its comment was wrong:
  normalizeFreehold REPAIRS an out-of-range revision to zero, so a row whose wire_rev
  outgrew a JS number loaded writable at zero and the next save wrote that zero over
  the larger stored value. FIXED: such a row is HELD.
- X7 BLOCKING (database-performance). `FREEHOLD_STORED_DETOAST_GATE_BYTES` was
  calibrated from `pg_column_size` on an UNSTORED expression, which reports the
  uncompressed datum, not what the gate reads. Every number in its comment was wrong
  and the gate did not catch the case the comment cited. FIXED: re-measured against a
  stored column (2199 for the maximal record, 32827 incompressible, 97932 uncompressed
  ceiling), lowered to 131072, and pinned by an on-disk calibration arm that the
  existing incompressible-fixture test could never have caught.
- X8 BLOCKING (tests). The constants pin omitted the three constants this work added,
  and every other use of them was a self-comparison. FIXED: literals for all ten.
- X9 BLOCKING (tests). Nothing pinned WHICH permit budget the login path spends; the
  refusal message names the number either way. FIXED: the test reads the deadline off
  the AbortSignal the store handed the gate.
- X10 SHOULD-FIX (database-performance). The measure expression was rendered about 2.6
  times per row because the planner inlines the LATERAL into three output expressions.
  FIXED: an `OFFSET 0` optimization barrier, measured 35.4 ms to 13.7 ms at 4.88 MB.
- X11 SHOULD-FIX (database-performance). The orphan sweep could collect an entry a live
  handshake still needed, leaving `retain` to yield a permanently write-blocked entry
  with no hold, no counter and no log. FIXED: `retain` re-reads when it finds an entry
  that is not loaded.
- X12 SHOULD-FIX (security). A thrown write counted toward the quiesce run forever, so
  three blips hours apart quiesced a healthy owner. FIXED: a five-minute window.
- X13 SHOULD-FIX (security). `ports.error(msg, err)` printed the whole pg error, and a
  23514 puts `Failing row contains (...)` in `detail`. FIXED: code, constraint and
  message only.
- X14 SHOULD-FIX (architecture, tests). The hearth-clock source scan omitted `src/sim`
  and `headless`, so a third writer added inside the sim would have passed both arms of
  a describe titled "exactly two writers, both in the sim". FIXED.
- X15 SHOULD-FIX (architecture). `server/game.ts` sat 63 lines under its ceiling after
  the extraction. FIXED: both ceilings lowered to the measured counts (9920, 4605).
- X16 SHOULD-FIX (architecture, tests). `installLoadedFreehold`'s two structural guards
  were coupled, so a malformed clock also skipped the plot. FIXED: independent, and the
  skip is now safe because X1's identity seal refuses the write it used to enable.
- X17 NITS, all applied: the misleading `finiteNumber` alias, the over-permissive
  version detail shape, the wire-cadence module's widened export surface, the missing
  barrel note for the hearth clock's second writer, the general (not fixture-specific)
  stored-ceiling margin now pinned as arithmetic, the unfiltered `pg_tables` assertion
  that flaked under a concurrent tenant, the metrics negative pin with no positive
  control, the `schema_version` validator disagreeing with its INT column, the
  re-entrant deferred pump, and the two constants the implementation never read.
- X18 RULED, no change warranted: two clauses cannot be isolated by any behaviour test
  because they sit behind a same-state filter (`drainCheck`'s deferred check, and the
  deferred clause in `owesWork`). Both are kept with a comment saying they are equal to
  their neighbours only by today's arithmetic. The non-HOT update cost of a plot save
  is recorded and negligible, and `freeholdsForExport`'s missing bound is pre-existing
  and out of this scope.

## SECOND FIX-ROUND FINDINGS (the fresh lane read its own predecessor)

The first fix round was itself reviewed, and one of its fixes had introduced a defect
worse than the one it closed. That is the reason the rule exists.

- Y1 BLOCKING (correctness, independently reproduced). The identity seal added for X1
  quiesced EVERY BRAND-NEW ACCOUNT on its second write. An absent-row account's first
  write is insert-only and correct; afterwards the entry held a durable revision while
  the live record still carried the unassigned plot id, so the seal fired on the very
  next save and every later edit of that first session was dropped with a misleading
  "the live record is not the record this entry loaded". Found by the implementer and
  confirmed independently by a reviewer reproducing it against the same commit.
  FIXED AT THE TIME across 23ffc92983 (the identity seal) and 2f298c24a1 (the sim-side
  stamp and its tests) by the correction both arrived at: the entry records the document as
  ACTUALLY WRITTEN, and a new sanctioned sim writer `stampFreeholdPlotId` teaches the
  live record the same identity, so the row, the entry and the record agree from the
  first insert.
  HISTORY, NOT CURRENT. `stampFreeholdPlotId` was deleted in round seven (4733572c0a),
  because W4 showed the stamp lands on whatever record exists at COMMIT time. Y1's own
  failure then came back on a different path and is closed differently in round nine; see
  V2 below.
- Y2 SHOULD-FIX (hot path). The shutdown drain's deadline had never been derived against
  the write cap: at four concurrent writes and a ten millisecond statement it covers
  about four thousand owners, and five thousand dirty owners left 1,584 unwritten.
  FIXED: the drain runs at its own cap, since it is the one moment nothing else contends
  for the shared gate, and the two constants are documented as the pair they are.
  Re-measured by the reviewer at 6,944 ms for five thousand.
- Y3 SHOULD-FIX (hot path). The leave flush returned in milliseconds under a mass
  disconnect, spending none of its budget, because a deferred entry has no chain and a
  null chain read as "nothing to wait for". A reserve alone did not fix it (it raised
  writes issued from 8 to 10 out of 1000). FIXED: the wait observes the deferred set.
- Y4 SHOULD-FIX (hot path). `utf8ByteLength` was a hand-rolled per-character loop whose
  comment justified counting over encoding to avoid allocating a second copy. Measured,
  that was backwards: twelve times slower than TextEncoder for a byte-identical answer,
  and 36 percent of every write's codec cost. FIXED, and its pin, which compared an
  encode against an encode, now carries a literal too.
- Y5 SHOULD-FIX (hot path). The eager leave capture retains about 66 MiB per thousand
  furnished leavers. The retention is required for correctness, so it is BOUNDED AND
  PUBLISHED rather than removed: the worst case is stated where the field is declared
  and `leave_captures` is a series.
- Y6 SHOULD-FIX (qa-checklist). The occupancy gauge called `entries` "loaded entries",
  and it is not: a join creates a reference-only entry before any read, so on a realm
  with housing disabled that number tracks online accounts and nothing else. FIXED:
  `loaded` is its own measure, zero on a dark realm however many entries exist.
- Y7 NITS, all applied: the metrics scrape read the store once per family rather than
  once per scrape; the orphan sweep copied the entry map every pass; `pumpLoop`'s skip
  arm left a dropped entry for the sweep instead of removing it; two comment anchors
  still named the cadence table's vacated home; the held and quiesced measures are
  counted independently and must not be summed; and the entry map's time-based eviction
  has no size bound, which is recorded with the seam that would provide one.
- Y8 SELF-FOUND while acting on Y6's neighbour: the lost-entry reload added in the first
  round would have issued a durable read per join ON A DARK REALM, where the join path's
  own preload is gated. FIXED in 97011ac1c7 before any reviewer reached it.

## THIRD FIX-ROUND FINDINGS (the second round was read the same way, and had the same result)

Two rounds in a row had introduced a defect worse than one they closed, so the second
was reviewed on that assumption. It had.

- Z1 SHOULD-FIX, blocking-adjacent (correctness). The leave capture was cleared on ANY
  non-rearm settle, and the null-permit arm of a write returns false WITHOUT quiescing,
  so an entry could settle uncommitted, unblocked and still dirty with its capture
  dropped. The next sweep then re-armed a write whose record removePlayer had already
  evicted, and the leaving session's edits were gone for good. Gate saturation is the
  single condition that produces both that timeout and the deferral the capture was
  built for, so the two arms are adjacent rather than exotic. FIXED: the capture
  survives while the entry still owes the write.
- Z2 SHOULD-FIX (correctness, claim scope). "A live record always wins" was not the
  right rule: a rejoin inside the deferral window reinstalls the entry's last COMMITTED
  state, which is the pre-leave revision, so the leaving session's edits were silently
  rolled back to it. FIXED AT THE TIME by a revision comparison, which W1 below then showed
  to be wrong and replaced; the rule now is that the live record wins whenever there is one
  and the leaver's edits are preserved by handing the capture to the rejoin. Historical:
  the newer document wins, with the live record winning ties,
  which keeps the original guarantee that a capture cannot shadow a later edit. The
  first test written for this was NOT decisive (the write sampled before the rejoin);
  it was rebuilt around a held permit and then killed the mutant.
- Z3 SHOULD-FIX (correctness). The write seal's plot-identity check tested the live
  record's id while the row received `entry.plotId`, so the one shape check underwriting
  writable-implies-readable for the identity column was validating a different value
  from the one that lands. FIXED: `runWrite` builds the document AS SENT once and every
  consumer, refusal included, reads that.
- Z4 SHOULD-FIX (correctness). `owesWork` claimed to be the one shared predicate while
  `sweepOrphans` still carried an in-flight-load guard `maybeRemove` did not, so an
  entry with a durable read in flight could still be removed and resurrected at zero
  references. That is the same "entry went missing under a live session" class that
  retain's reload repairs, seen from the other end. FIXED: the guard moved into the
  shared predicate.
- Z5 SHOULD-FIX (security). `boundedDatabaseError` was applied to throws out of this
  module's own code, discarding the stack that would name the line. FIXED: it applies
  only at the three sites where a pg error can arrive, and the docstring stops claiming
  `message` is a pure classification field.
- Z6 SHOULD-FIX (cross-platform-sync). The plot identity charset has four copies and
  only three had a pin, so widening it later would red three tests, the author would
  update three literals, and the loader would then mark every newly minted id malformed
  and write-block the account. FIXED, with refusal cases so the pin is not vacuous.
  The same reviewer's other finding, the minted id never reaching the live record, was
  closed AT THE TIME by stampFreeholdPlotId.
  HISTORY, NOT CURRENT: that stamp was deleted in round seven, so a fresh account's live
  record carries the stand-in for its whole first session again. Round nine makes that
  legal rather than reversing it, and the residual (the live plot identity differs between
  two sessions of one account for timing reasons alone) is carried as V6 below.
- Z7 NITS, all applied: a byte-ceiling comment called a measurement on one fixture a
  theoretical ceiling; an assertion that could never fail (a newline sought in
  whitespace-collapsed text) became an occurrence count; the pre-gate expression was
  spelled out twice; the reporter's vocabulary did not cover the details the writer now
  emits; a re-entrancy comment described a hazard its own latch already closed; and the
  hearth clock's documented growth was one entry per account that has USED a key, not
  one per login.
- Z8 RULED, no change: `wire_rev_shape` holding rather than repairing was flagged as a
  load-bearing CLEAN by the reviewer, since it is what stops a client-facing counter
  going backwards permanently, and it would be easy for a later reader to "simplify"
  into the loader's repair. Recorded so nobody does.

## FOURTH, FIFTH AND SIXTH FIX ROUNDS

The pattern did not stop at three. Each of these was found by a reviewer reading the round
before it, with an executed proof rather than an argument.

- W1 BLOCKING (correctness), round four. "The newer document wins" compared two revisions
  that are not on one timeline: a rejoin replay RESTARTS the record's revision from the last
  committed value, which this packet's own test establishes. Preferring the capture therefore
  discarded the REJOINING session's edits, the mirror of the bug it was written to fix.
  Reproduced: ten furnishings placed after a rejoin, then a sweep writing the pre-leave
  document over them. FIXED in 6e8e681a2b, above the contest rather than inside it: an
  outstanding capture outranks the entry's committed state AT THE JOIN, so a returning player
  is handed the house they logged out of, and the write path returns to the one rule that is
  decidable, the live record wins whenever there is one.
- W2 BLOCKING (correctness), round five. Releasing the capture at the READ was itself a
  lost-save path. The handshake reads before it takes the character lease, and five exits sit
  between them; none creates a live record, so a capture released at the read vanished with
  nothing holding the edits. The sharpest is a lease already held, because a reconnect after a
  dropped socket is the very event that produced the capture. Proved: a handshake that never
  joins, four sweeps, zero writes, four counted against the measure this module documents as
  the terminal state of every lost-save path. FIXED in 17b216b252: the handover is two-phase,
  the read offers and mutates nothing, and `retain` confirms.
- W3 BLOCKING (correctness), round five's own fix. `hasLive` confirms A record, not THIS one.
  `installLoadedFreehold` has four early returns and `loadFreehold` is load-once on top of
  them, while `retain` runs on every join and knows none of it; the reachable case is the
  same-account character swap, where the record `retain` sees belongs to the previous session
  and removePlayer is allowed to evict it afterwards. FIXED in 91d93d1f95 by comparing the
  live revision to the captured one, which fails closed.
- W4 BLOCKING (correctness), round six, the sixth distinct path to a lost house. The plot-id
  stamp lands on whatever record exists at COMMIT time, not the record the write came from. A
  write serving from its capture runs after eviction, and a join landing inside its round trip
  seeds a default; stamping there gives the empty default the row's durable identity, which is
  the only discriminator the write seal has. The seal then stops firing and the next sweep
  writes an empty tier-0 Inn Room over a real house, with the plot identity unchanged and
  every counter reading healthy. FIXED AT THE TIME in 45f7d41508 by stamping only a document
  that came from the live record. The reviewer's alternative guard was rejected on their own
  advice: it closes this path but would quiesce a healthy brand-new account.
  HISTORY, NOT CURRENT: rounds seven and eight removed the stamp altogether and replaced it
  with a pristine-record test, and round nine replaced that in turn. See V1 and V2.
- W5 SHOULD-FIX, round four. `leave_captures` never returned to zero, because a second leave
  over a surviving capture held one document and counted two. It is the only stated bound on a
  measured 66 MiB retention, and a bound that cannot read zero is not one. FIXED.
- W6 SHOULD-FIX, round four. The capture was cleared on any non-rearm settle, and the
  null-permit arm returns false WITHOUT quiescing, so an entry could settle uncommitted,
  unblocked and still dirty with its capture gone. FIXED: it survives while the entry owes the
  write.
- W7 SHOULD-FIX, rounds four and five: the write seal validated the live record's identity
  while the row received a different one; the in-flight-load guard was on one removal path
  only; the bounded error wrapper was applied to this module's own programming errors,
  discarding their stacks; and the plot-identity charset's fourth copy had no pin. All FIXED.
- W8 PROCESS, recorded because it is the finding that matters most. Two of the tests written
  for these fixes were NOT decisive until a mutation pass showed they passed against the
  mutant, and the harness itself modelled an impossible state (its two liveness ports could
  disagree, where the server reads one map). A green suite proved nothing here on five
  separate occasions. Every guard in this subsystem is now mutation-checked in both
  directions, and the ones no behaviour test can isolate say so instead of pretending.

## ROUNDS SEVEN, EIGHT AND NINE

Rounds seven (`4733572c0a`) and eight (`7269da3a5d`) landed after the section above was
written and were not folded into it, which is why three entries there described a deleted
function as the live fix. Round nine is a VERIFICATION session's own fix round: it was
dispatched to find a defect rather than to confirm the work, and it found two.

- V0 PROCESS, recorded first because it is what the rest of this section rests on.
  Round seven deleted `stampFreeholdPlotId` and the `stampPlotId` port; round eight added
  the pristine-record test. Neither round updated this ledger, so Y1, Z6 and W4 asserted a
  reverted mechanism for two commits, and the header still said six rounds with the sixth
  unreviewed while the tip carried eight. For a packet whose control mechanism IS a record
  that is corrected rather than quietly amended, that is the failure the record exists to
  prevent. Independently reported by the architecture reviewer in round nine.

- V1 BLOCKING (correctness), round nine, the SEVENTH distinct path to an empty default
  landing on a real house. Round eight's pristine test closes the blind window only while
  the reseeded record is UNTOUCHED. A seed stops being pristine the instant the returning
  player does anything: one tier grant today, one furnishing once that writer lands. The
  record is then a stand-in identity at revision one standing against an entry that
  committed revision seven, both of the seal's tests pass, and the empty default is
  compare-and-swapped over the real house with `plot_id` untouched and no counter moving.
  REPRODUCED against the real store before the fix: three writes where two were correct,
  the third carrying `layoutJson` `[]` at `wireRev` 1 against `expectedDurableRev` 2, over
  a row holding a cottage with a furnishing, a trophy, condition 91 and policy friends at
  revision 7. No error line, no counter.
  FIXED in 9468d374d9 by a third test: under the stand-in identity, a live revision
  strictly BELOW the entry's last committed one is a different record. That is decidable
  where "newer" is not, because every sanctioned writer only increments and every install
  the store offers a rejoin carries at least the committed revision.
  Reachability today is dev-grant-only, because `setFreeholdTier` is the one live-record
  mutator this release ships. It becomes ordinary the moment the furnishing writer lands,
  and the code comment claimed the window was closed.

- V2 BLOCKING (correctness), round nine, the MIRROR of V1 and a live defect of its own.
  Since round seven deleted the stamp, nothing teaches a live record its minted name, so a
  first-session record carries the stand-in for as long as it lives. If that account's
  store entry is dropped and RE-READ from the row it just inserted (`retain`'s lost-entry
  reload after an orphan sweep or a same-account leave, or a second character joining on
  `preload`'s already-live-but-unloaded arm), `entry.state` comes back holding the ROW's
  minted name while the same live record still holds the stand-in. The names differ, the
  seal fires, and the account is write-blocked for the rest of its session with a
  misleading "the live record is not the record this entry loaded". This is Y1's own
  failure, moved from the commit path to the row-read path by round seven.
  Found by the test-coverage reviewer and REPRODUCED independently against the real store
  (`quiesced: 1`, one error line, every later edit discarded).
  FIXED in 9468d374d9: a stand-in is the ABSENCE of a name, not a different one, so the
  name comparison is skipped for it and continuity decides instead. A record carrying any
  other name is still refused outright.

- V3 SHOULD-FIX (correctness), round nine's own change, caught by its own control. Hoisting
  the identity comparison out of `seededOverReal`'s `&&` chain into a named constant took
  it out from behind `entry.state !== null`, so an entry with no cached state would have
  dereferenced null on every account's first write. It did not fire only because such a
  record always carries the stand-in and the other conjunct short-circuits first, which is
  a coincidence of another rule rather than a guard. Found by a no-op mutation control
  whose 36 unexplained failures did not match the mutant applied. FIXED in the same commit.
  Recorded because the control is the only reason it was seen.

- V4 SHOULD-FIX (correctness), round nine. The shutdown drain armed on `isDirty` alone,
  while the periodic sweep and the leave flush both probe the live revision first, and the
  revision probe is the ONLY dirty detector with a production caller in this release. The
  drain therefore could not see an edit at all. It was correct only by the shutdown
  ORDERING in `server/main.ts`, which is a property of another file. Found independently by
  the database-performance reviewer (P2-6). FIXED in 9468d374d9, one expression, pinned.

- V5 SHOULD-FIX (simplification with a correctness edge), round nine. Once V2's exemption
  landed, `applyWriteResult`'s second cached identity became unobservable: caching the live
  record's name instead of the row's no longer changes any outcome, and a mutation pass
  confirms it (the mutant that swaps them survives the whole suite). The dual-identity
  model is what rounds six, seven and eight fought over, and an axis no test can
  distinguish is one a later reader reasons from wrongly. REMOVED in 9468d374d9: the entry
  caches one identity, the document as sent.

- V6 SHOULD-FIX, carried NOT fixed, and named rather than deferred anonymously. A fresh
  account's live plot identity is the stand-in for its whole first session and the row's
  minted id afterwards, so the same account's live record answers to two different names
  across two sessions for timing reasons alone. The wire is dark, `freeholdDescriptorFor`
  has no production caller, and `account_freeholds` declares a UNIQUE `plot_id` precisely
  because a client echoes it back, so 08a inherits this. Owed by the release that publishes
  the descriptor.

- V7 SHOULD-FIX, applied. The revision-coupling source scan that BOTH the sweep and now the
  seal depend on read only `state.ts`, while the eight bodies reserved for the furnishing
  writers sit in `commands.ts`. A mutator landing where the next one is going to land bumped
  no revision and was invisible to the only detector this release ships. Widened to the
  directory in e70164a57c and proved by planting one.

- V8 SHOULD-FIX, applied. Neither byte ceiling's DEFAULT was pinned: every assertion in the
  case that names them used a document under both ceilings, so swapping the writer's or the
  loader's default to the wider stored bound left the suite green. The loader's default is
  the only thing between an over-canonical row and a record this realm could write and never
  read back. Pinned in 8ad29098f4 against a record that sits between the two ceilings, which
  is constructible only because an identifier is bounded by LENGTH and not by bytes.

- V9 NITS, applied: the by-kind metric keyed its series on the producer's own map rather
  than a declared vocabulary (so an identity-keyed tally reached the scrape) and its scrape
  memo was keyed on nothing; the hearth module skipped the account-id guard its sibling
  runs on every entry point; the exponent docblock in `persisted.ts` carried a measurement
  that contradicted the same file's other docblock, and the wrong one was the one the
  re-measure commit missed; the visit-policy vocabulary was on the directory barrel with no
  barrel consumer; the by-path imports of `state.ts` carried no reason; DEPLOY.md and
  `.env.example` said the account cascade was the only removal path without saying that the
  player-facing account removal is a soft delete that fires no cascade, and neither warned
  that a dev tier grant is now durable.

- V10 TEST QUALITY, applied. Three cases were inert for their own claims and a mutation
  pass proved it: the fresh-account capture case asserted only on a store that had attempted
  nothing (both mutants it was written against left it green), the queued-then-held case
  named `runWrite`'s post-queue re-check while actually pinning `settle`'s re-arm gate, and
  the two ceiling-default cases are V8. The first two are repaired or retitled to what they
  actually prove.

- V11 RULED, no change, each verified by mutation rather than asserted. Three clauses of
  `owesWork` (`running`, `pending`, the deferred set) are redundant under today's arming
  rules, not one as the comment claimed. `runWrite`'s post-queue `blocked()` re-check is
  the middle of three layers of one gate and nothing outside a write result can block an
  entry, so no behaviour test isolates it; removing ALL THREE layers does fail the suite,
  and each of the outer two is now pinned on its own. The mint-once guard on the absent
  arm cannot be reached twice for one entry. The layout, trophies, tier, condition and
  visit-policy dimensions of the seal's second test need a record carrying content at
  revision zero, which no sanctioned writer produces; they are kept for totality over the
  persisted shape and are the net under the one coupling the third test cannot check for
  itself. Every one of these now says so in the source instead of reading as a live guard.

- V12 CARRIED, NOT FIXED, and each named with its reviewer and its measurement. These are
  behaviour or policy changes to a bounded store, in a file where eight of nine rounds
  introduced a defect, and they are recorded in the rollout contract as named release gates
  rather than attempted at the end of a verification session:
  * an admission-class load refusal (the local cap full, or no permit inside the login
    bound) is recorded as a TERMINAL hold, so a capacity blip becomes a session-long
    housing outage for that account and `retain`'s repair arm cannot reach it, because
    `holdResult` has already set `loaded`. Measured by the database reviewer: with the
    shared gate saturated, 8 of 8 logins at 1 join/s were refused, and a lone re-join for a
    refused account still replayed the hold.
  * the load cap (4) and the write cap (4) are independent and sum past the shared gate's
    capacity of 7; the store was measured holding 7 of 7 permits with other named producers
    queued behind it.
  * a dirty entry with no live record and no capture re-arms every sweep forever and is
    never collected (12 sweeps, 12 permits, `writesWithoutRecord` 1 to 13). No production
    sequence reaching that state was named by anyone.
  * under a sustained permit refusal the entry map's stated TIME bound does not apply at
    all, because `owesWork` is what suspends it; measured at 96 MiB per 5,000 owners at the
    shipped ceiling and 660 MiB at the approved one.
  * the leave reserve is two slots in total rather than two per leaver: with 296 background
    writes deferred, 98 of 100 simultaneous leave flushes hit the full 2,000 ms deadline
    with the write unlanded.
  * the login read path inherits the 15,000 ms pool statement timeout, three times the
    deliberately short permit bound, on a handshake with no deadline of its own.
  * the subject-access export read carries no LIMIT and no byte gate, while the account
    read's `LIMIT 2` is justified against exactly that hazard.
  * four distinct load-failure causes all report `unadmitted`, which is the discrimination
    the metric's own help text promises.
  * the write path serializes each document twice (the refusal's byte measure, then the two
    columns), measured at 0.225 ms per save at the 420-row ceiling, and none of that codec
    cost reaches a counter.
  * `entry.state` is a SECOND full copy of every online owner's house and a leaving owner
    briefly holds a third, measured at 10,051 bytes per copy at the shipped ceiling and
    69,452 at the approved one. Only the capture is documented today.
