# 07 findings ledger (every finding, every reviewer, applied or ruled)

Status key: FIXED (with the commit that did it) / RULED (reviewed, no change warranted,
with the reason).

THE ROUND IS NOT CLOSED, AND THE VERDICT IS FAIL. SIXTEEN fix rounds have now run and
FOURTEEN of the sixteen introduced a defect worse than one they closed, each caught by a
fresh reviewer, by the gate, or by a mutant, and NEVER by the round's own green tests.
ROUND FIFTEEN is the round that executed the four settled rulings, and the fresh read
that opened it found 36 findings including one BLOCKING, in code fourteen rounds and a
green gate had already been over. ROUND SIXTEEN is six fresh lanes over round fifteen
itself: 30 findings, three BLOCKING, and TWO of those three were defects round fifteen
had introduced, one of them a money-conservation regression on the leave path and one of
them the eighth path re-opened from the other side. Both sections are at the end of this
file, and the second is why the first is not the last word.
Round fourteen is the sharpest instance: round thirteen shipped a fix whose CLAIM WAS
WIDER THAN ITS EVIDENCE, citing two measured SQLSTATEs that both leave the connection
usable as proof about every clock fault, so its own probe could not see the case it was
cited for. An earlier version of this line declared the round closed after the third; that
was wrong three times over. A later version said six rounds with the sixth unreviewed, and
a later one said nine; each was true when written and went stale within two commits. All
are corrected here rather than quietly amended.

THE COUNT THAT MATTERS IS NOT THE ROUND COUNT. It is that no round has yet been read by a
fresh pair of eyes and found clean, so the correct prior for the next reader is that this
one is wrong too.

READ THE ROUNDS SEVEN, EIGHT AND NINE SECTION BEFORE ANY OTHER PART OF THIS FILE. Rounds
seven and eight reverted a mechanism that Y1, Z6 and W4 below still describe as the live
fix, and round nine replaced the seal those three argue about. Those three entries are
HISTORY, and each now carries a pointer saying so.

Nine reviewers were dispatched and nine reported: migration-safety, database-performance,
privacy-security, server-hot-path, architecture, cross-platform-sync, test-coverage,
frontend-seam and qa-checklist. EIGHT of them left a report file in this directory; the
qa-checklist gate reported inline across two chunks and has no file. Three further FRESH
lanes then read the fix rounds themselves, one per round from eleven on.
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
      routing around the only bound on what may reach a log.  FIXED in e23d2a906e: the
      reporter gained its production caller and its second, uncalled log helper was deleted
      rather than left as a way past the bound.
      THE CLOSURE OVERSTATED ITSELF, corrected here rather than quietly amended. "Every
      detail comes from the reporter" was true of the two normalize arms of `classify` and
      of nothing else: the oversize byte prose, the SQL reader's unadmitted detail, the
      `wire_rev_shape` literal, the three `refuse()` details, the hearth read's detail, the
      upsert result's detail and `freeholdWriteRefusal`'s refusal detail all reached the
      warn and error ports built OUTSIDE the reporter and untested against its shape bound.
      Nothing leaked, because every one of those producers is a compile-time literal, a
      module constant or a number this process computed, but the entry in KNOWN_DETAILS
      written for the save path had no traffic at all. CLOSED PROPERLY at the persistence
      QA: the bound is exported as `boundedFreeholdDetail` and applied at the two sites
      whose producer lives outside the store, the SQL reader's stranded-slot shape is named
      in the vocabulary, and a case proves an unrecognized detail is replaced rather than
      printed.
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

## ROUND TEN: THE VERIFICATION SESSION'S OWN FIX ROUND WAS REVIEWED, AND IT HAD DONE IT AGAIN

Round nine was dispatched to two FRESH reviewers on the standing assumption that a fix
round is unreviewed code. Both found real defects in it, and one of them was the same
class the round existed to close. Eight of nine became nine of ten.

- U1 BLOCKING (correctness), found by the fresh architecture review with an executed A/B
  against the baseline. Round nine's stand-in EXEMPTION was a data-loss hole of its own.
  Skipping the name comparison for a record carrying the stand-in identity left only the
  continuity tests, and those catch a seed whose revision is BELOW the entry's. A
  returning player needs only `entry.state.rev + 1` edits inside one sweep interval to
  carry it above, at which point nothing refuses: measured, a row at wire revision 2
  holding a chair and a trophy, against a fresh default at revision 3, was written as
  `layoutJson '[]'` at `wireRev` 3 with `quiesced: 0` and no error. THE SAME SCENARIO AT
  THE BASELINE REFUSED IT, so this was a regression round nine introduced, not a hole it
  inherited. Round nine's own new case models one edit on the seed, which is the regressed
  side; it never models the seed catching up.
  REVERTED rather than patched a fourth time. The name comparison is total again, and the
  case the reviewer executed is now pinned, along with the revert itself in both
  directions: re-applying the exemption fails two cases, and re-applying the identity
  simplification below fails nine.
- U2 SHOULD-FIX (correctness), same review. Round nine's removal of the entry's second
  cached identity was NOT unobservable: `entry.state` is also what `offerCapture` hands a
  rejoin, and `installLoadedFreehold` sets the live record's identity from that document,
  so caching the row's name there teaches the sim a different name on every replay.
  Measured A/B on one fresh account: the replay handed the sim `plot:minted1` at HEAD and
  `plot:unassigned` at the baseline. That is a cross-host behaviour change wearing a
  simplification's clothes, and two comments landed asserting it was not observable.
  REVERTED, with the reason recorded where the field is assigned.
- U3 THE TRADE, recorded because it is a decision and not an oversight. Reverting the
  exemption REOPENS V2, the fresh account whose entry re-reads its own row and is
  write-blocked for the session. That is the honest trade: refusing a write costs one
  session's edits, admitting a seed costs the house, and the row survives either way.
  V2 is now PINNED AS IT BEHAVES, in a case named KNOWN DEFECT, so a future fix flips a
  red test rather than discovering the behaviour. It is carried as a named gate, and its
  actual fix is to teach the live record its minted identity AT INSTALL. That is a design
  decision for the maintainer: it is what `stampFreeholdPlotId` did, W4 showed stamping at
  COMMIT time is wrong, and stamping at install is a different change with a different
  argument. It is not a fourth heuristic in one boolean expression, which is what the last
  four rounds have each tried.
- U4 SHOULD-FIX, applied. Round nine ruled the pristine arm and its non-revision
  dimensions unpinnable on the premise that no sanctioned writer produces content at
  revision zero. The premise was wrong twice over: `entry.state` on that path comes from a
  durable ROW, which is untrusted external input, and tier, condition and visit policy are
  not content at all, so a default change makes a rev-zero difference ordinary. The
  correct statement, which is what the source now carries, is that they are dead while the
  name comparison is TOTAL and become load-bearing the moment it is narrowed, which is
  exactly what round nine did.
- U5 SHOULD-FIX, applied, found by the fresh test audit. A case added in round nine
  modelled an impossible state: its row reader answered `absent` unconditionally, so after
  a confirmed insert the store re-read the same account, found no row, fenced insert-only a
  SECOND time and minted two identities for one account. With `entry.durableRev` null the
  seal is structurally disarmed, so the case could never reach the arm it was named for.
  The reader now returns the inserted row, and the case is retitled to the capture claim
  its first half actually proves.
- U6 SHOULD-FIX, applied. The leave-capture case pinned the GAUGE and not the retained
  DOCUMENT, and the two are separable: a second leave that kept the stale capture reads
  one on the gauge at every assertion while discarding the second session's edits. A
  sibling case now asserts the write carries the SECOND session's revision.
- U7 SHOULD-FIX, applied. Two guards this session added had no test at all: the hearth
  account-id refusal at both entry points (removing both left 208 tests green) and the
  scrape memo's source key. Both are pinned now, the memo with the two-registry case the
  reviewer wrote.
- U8 NITS, applied. A "positive control" added this session controlled nothing (it
  appended a literal containing the token it then searched for, so it was true for any
  input) and is replaced by an assertion on the emitted line count; the widened directory
  scan's size floor was 20 against an actual 43, loose enough to survive losing half the
  directory; the hearth guard was inserted between another function's docblock and its
  function; and the directory CLAUDE.md's barrel rule did not mention the by-path
  exception this session widened.
- U9 RULINGS VERIFIED, by the reviewers rather than by their author. Every "no behaviour
  test can isolate this" claim round nine added was independently re-tested and holds:
  `owesWork`'s three redundant clauses (clause by clause), the mint-once guard (including
  an adversarial concurrent-preload case), and `runWrite`'s post-queue re-check (including
  a written attempt that failed to reach it). The orphan-sweep reset ruling was reached the
  same way, by two failed attempts to build the case.

## ROUND ELEVEN: THE PAIRED QA, WHICH FOUND THE EIGHTH PATH

Eleven reviewers reported (three independent readers plus migration-safety,
database-performance, privacy-security, server-hot-path, architecture, cross-platform-sync,
frontend-seam and test-coverage; the qa-checklist gate did not return). Two mutation passes
ran over the store, 40 mutants and then 13, each with a no-op control that proved the tests
executed. The eighth path was found by the correctness reader, confirmed by an adversarial
verifier that reproduced it independently, and reproduced a THIRD time by this session's own
probe written from scratch against `createFreeholdPersistStore`.

- Q1 BLOCKING, NOT FIXED, RULING OWED. THE EIGHTH PATH. For an entry that MINTED its own
  row, the seal's name comparison is inert BY VALUE EQUALITY: `applyWriteResult` caches the
  identity the LIVE RECORD carried, nothing teaches a live record its minted name, so that
  entry's cached name IS the stand-in and a reseeded default carries the same literal. The
  two continuity arms are then the whole seal and both are revision-shaped, so a reseed
  whose revision has CAUGHT UP satisfies neither. Measured: a row holding tier cottage, one
  furnishing, one trophy, condition 91 and policy friends at wire revision 7 was
  compare-and-swapped to an empty Inn Room at wire revision 8 and again at 9, `quiesced` 0,
  `write_failures` 0, no error line, `plot_id` untouched; controls at revision 0 and 5 both
  refused. U1's revert was reasoned entirely about entries that loaded a ROW and never
  considered the entry U3 deliberately created. PINNED AS IT BEHAVES in two KNOWN DEFECT
  cases plus a contrast arm proving a row-loaded entry still refuses the identical reseed.
  The interim guard the reader proposed (judging the stand-in case by content instead of by
  revision) was REFUTED here: it write-blocks the one live-record mutator this release ships,
  because a `/dev` tier grant on a fresh empty account is a stand-in record with an empty
  layout whose tier differs from the entry's, which is the Y1 failure class again. The fix
  is the design decision C1 already owes, in the SAFE form the parity reader specified.
- Q2 SHOULD-FIX, applied. `drainCheck` was a THIRD "owes durable work" predicate and omitted
  the dirty clause, so the drain answered DRAINED with an entry left dirty and unblocked by
  the null-permit arm. Split into two questions rather than unified into one: what is still
  MOVING decides when to stop waiting, what is still UNWRITTEN decides the answer. It now
  resolves at once and answers false.
- Q3 SHOULD-FIX, applied. `pumpLoop` admitted a deferred entry at the NON-leaving cap in
  insertion order, so the leave reserve bought nothing past the first two leavers and a
  deferred leaver queued behind every background write. It now prefers a deferred entry
  holding a capture and admits it at the leaving cap. (C6's mechanism, found by the hot-path
  reader.)
- Q4 SHOULD-FIX, applied. `server/game.ts`'s leave ran its three release lines outside any
  guard while all three callers fire it with no catch, so a rejection anywhere in the
  settlement skipped the store release, the lease release and `removePlayer` permanently.
  The join's guard covered `addPlayer` alone while a dozen throwable calls sat between the
  seed and `clients.set`. Both are guarded now, PAID FOR BY EXTRACTION: the leave save and
  its retry policy and the contests a leaver forfeits moved to
  `server/leave_character_save.ts`, the join binding to
  `server/freehold_session_binding.ts`, and the coordinator's ceiling was LOWERED to 9916.
- Q5 SHOULD-FIX, applied. The revision-coupling scan the write seal rests on missed every
  mutator shape the next writer will use: an in-place row edit, an indexed write, a compound
  assignment, unshift, sort, reverse, fill, a length truncation and `Object.assign`. Its bump
  matcher accepted `const rev = state.rev` and `state.rev = 0`. Its walk saw `export function`
  only and sliced bodies from the first export, so a module head was in no body. `plotId`,
  the field the named next change writes, was not in its field list. All widened, the
  CONSTRUCTORS exemption is now pinned rather than asserted, and `bodyOf` is keyed by
  `file:name`. Proved by planting the natural `moveFurnishing` body: the scan goes red.
- Q6 SHOULD-FIX, applied. `boundedDetail` was not the bound on log content: seven of nine
  producers reached the ports without it, and the ledger recorded S9 as closed. See the
  corrected S9 entry above.
- Q7 SHOULD-FIX, applied. Three server predicates keyed the Hearth Key by a re-typed
  `'hearth_key'` literal while the sim dispatches on `use.type === 'freeholdEnter'`, so a
  second item carrying that use type would pass the dark-realm gate and the jail gate. All
  three now use `HEARTH_KEY_ITEM_ID`.
- Q8 SHOULD-FIX, applied. The account read measured and shipped the unadmitted second row in
  full; the export read had neither a LIMIT nor a byte gate. Both bounded, the export widened
  rather than copied, and proved against real PostgreSQL.
- Q9 SHOULD-FIX, applied. Four inert or gameable pins: the dark-realm wiring pin passed with
  the two ternary arms SWAPPED (executed against the real text); the drain cap was referenced
  by no test at all; the four millisecond totals were asserted only as `>= 0`, which every
  accumulation already guarantees; and the general stored-margin pin computed its wrapper
  from the MAXIMAL record, proving a 231-byte margin where the real worst case is 55.
- Q10 SHOULD-FIX, applied. The load-failure kinds, the login statement bound, the two gauge
  docblocks, `writes_without_record`'s own description, the `scheduleDeadline` "ONE timer"
  claim, preload's handover comment (which contradicted `offerCapture`'s), the stand-in
  docblock in `state.ts`, the drain-cap block that argued from the figures it contradicts,
  the metrics memo's 0.3 ms figure (about five times high), the `sim_context.ts` note telling
  a persistence loader to register a retention prune the pins FORBID, and the schema
  idempotence denylist that could not see an unguarded CREATE TABLE. All corrected.
- Q11 NITS, applied: `preload` is async so its synchronous throw is catchable; `ensureEntry`
  refuses an owner key and an account id that name different accounts; `installLoadedFreehold`
  refuses an answer that names another account; every preload arm resets the orphan grace;
  both removal paths release a retained capture and its accounting; the `persisted === null`
  arm stops owing the write; the shadowed `live` local is renamed; the two absent revisions go
  through their named constants; `mergeFreeholdKeyReadyAt` honors the dark-realm flag; the two
  bare-named housing cores are registered; the by-path import exceptions are recorded in both
  directory CLAUDE.md files; and the one en dash this branch added is gone.
- Q12 RULINGS RE-TESTED BY MUTATION, all six still hold: `owesWork`'s three redundant clauses,
  `runWrite`'s post-queue re-check, the mint-once guard, the orphan-sweep reset, and the
  seal's pristine arm and its non-revision dimensions. ONE RULING BROKE: "dead while the name
  comparison is TOTAL" rests on a premise that is false for a minted-row entry, which is Q1.
  A seventh clause was ruled rather than pinned: `entry.durableRev !== null` is equal to
  `entry.state !== null` by today's arithmetic, because all three writers set both together.

## ROUND TWELVE: THE FIX ROUND WAS READ TWICE AND HAD DONE IT AGAIN, TWICE

Two fresh reviewers read the fix round as unreviewed code, and four of the nine
audit lanes delivered late. Between them they found one regression the round
introduced and had already been caught by the gate, one it introduced and had
not, and a set of pin defects the round's own widening had not reached.

- W1 BLOCKING, caught by the GATE rather than by a reviewer. The round deleted the
  private leave-save method and four live call sites reach it through an any-cast
  accessor, which `tsc` cannot see: ten tests went red across two suites,
  including the whole money-conservation property sweep. Restored as a thin
  delegate, and the extracted module now carries the behaviour test it never had:
  the retry ladder, its backoff cap and the exhausted-retry reconciliation had no
  test that imported them at all.
- W2 SHOULD-FIX, a regression the round introduced and nothing caught. `leave()`
  guards on `session.left || !clients.has(pid)`, and BOTH of those were set inside
  the settlement, below three throwable calls, while the new `finally` runs on any
  throw out of it. A throw there tore the session's resources down while the
  session was still re-enterable, so a later leave passed the guard and ran the
  whole teardown a second time, double-releasing one retain and collecting the
  entry out from under a live sibling session. Before the round a throw there left
  everything intact. Both statements now close the guard before the window opens.
- W3 SHOULD-FIX. The export's new byte gate was the COMPRESSED pre-gate with
  nothing behind it, which that constant's own docblock twenty lines above says is
  not a bound: at the file's measured 48x ratio a row under it renders about
  6.3 MB into a request path holding one pool client. The authoritative rendered
  measure now sits behind the pre-gate exactly as the account read's does, and a
  truncated export appends a marker row instead of trailing off.
- W4 SHOULD-FIX. The join's new guard repaired two of the three resources it
  covers and left the bot tracking context held for the process lifetime; the
  leave's flush was the one unguarded statement inside the guard that exists so a
  throw cannot skip the other two; and the extraction had speculated a helper
  nothing imports. All three closed.
- W5 SHOULD-FIX, from the store lanes. A leave that found no live record DESTROYED
  the capture it was standing in for, which is the exact window the capture exists
  for. A synchronously throwing enqueue woke no settle waiter, so a parked leaver
  spent its whole deadline on a write that had already finished failing. Closing
  intake retired the ORPHAN SWEEP with it, because the sweep runs inside the
  arming pass, so any store that outlives a drain loses the entries map's only
  time bound.
- W6 SHOULD-FIX. The join path read a LIVE `process.env` housing flag while the
  store's own port, both record inserters and the repair reload all read the boot
  snapshot. An in-process flip disagreed with itself in both directions: raised,
  two unbudgeted durable reads per login on a realm that seeds no record and can
  never write; lowered, every joining account silently write-blocked into
  `quiesced`, which DEPLOY.md tells an operator to read as a second realm writing
  the same rows. One source now.
- W7 SHOULD-FIX, the pin defects the round's own widening did not reach. A body
  slice ran to the NEXT export, so an exempted constructor exempted every private
  helper after it, including `cloneFreeholdState`, which runs on every load and
  every serialize; proved by planting a durable write there and watching the scan
  go red. The walk did not recurse, so a module under a subdirectory was invisible.
  The exported-body floor tolerated losing three single-export files. The record
  map had no sole-writer scan despite its header claiming one. The i18n drift guard
  enumerated nine of fifteen modules by hand, including neither refusal-decision
  module. The catch pin was satisfied by a release moved OUT of the catch, which
  would release on every SUCCESSFUL join. The hearth advance pinned its SET list
  from one side only. Two negative key scans had no control that the walker walks.
  One case's title named an assertion its body never made.
- W8 RECORDED, not taken. Deriving the harness's `hasLive` from `serialize` is the
  right shape and reds four cases that model a COLD join with the default
  document, which would have to be rewritten to keep saying what they say. That is
  a suite-wide change rather than a fix, and the gap is now BOUNDED in the harness
  instead: exactly one production decision reads `hasLive`, five cases model the
  combination the server cannot produce, and no conclusion is falsified by it.

## ROUND THIRTEEN: THE LATE REVIEWER'S TAIL, AND A MEASUREMENT THAT REFUTED ITS OWN DOCBLOCK

The fresh reviewer of round twelve's fix delivered its findings in pieces. Three
landed after that round had closed, and all three were real.

- X1 SHOULD-FIX. Round twelve bounded the two login reads by wrapping EACH in
  `runWithStatementTimeout`, which is a transaction helper, not a timeout
  decorator: `pool.connect`, `BEGIN`, `SET LOCAL`, the statement, `COMMIT`. The
  right bound was bought at four times the network cost, on the one path where a
  player is waiting: eight round trips on two checked-out clients, each held
  across four statements. Closed with an optional combined `readDurables` port
  bound to ONE wrapper over both statements, five round trips on one client. The
  two-port `readRow` / `readHearth` pair stays as the fallback for a host with no
  transaction seam. IT IS ALSO THE ARM EVERY UNIT TEST DRIVES, so the production
  arm is covered only by the real-PostgreSQL evidence in X3; that asymmetry is
  named here rather than left for a later reader to discover.
- X2 NIT AS FILED, PAID AS A DEFECT. The reviewer noticed the coordinator's
  monolith ceiling had gone 9920 to 9916 and back to 9920 inside this packet,
  with the last commit calling 9920 "its unchanged ceiling". Traced across all
  thirteen commits, that is exactly what happened: the extraction round lowered
  the row to 9916, and the review round that followed spent those four lines
  again restoring the private leave-save delegate W1 required, then put the row
  back and recorded the raise as a non-event. Against the floor this packet had
  already set, it was a raise, and the rule forbids one whatever the inherited
  number was. Paid rather than re-recorded, in two behaviour-identical moves: the
  leave flush's swallowed rejection moved into the binding module that owns the
  retain-release pairing, and the three copies of the guild-book reconcile guard
  now route through the one private method that already existed for it, whose own
  empty check duplicated the loop it calls. The row lands at 9914, six under what
  the packet inherited and two under its own floor, and the ledger comment now
  records the whole walk including the middle.
- X3 SHOULD-FIX, found while verifying X1 rather than reported by anyone. Sharing
  one transaction across the two reads creates a failure mode neither read had
  alone: a hearth fault would abort the transaction and take the plot row with it,
  turning a clock fault into a plot HOLD and inverting the deliberate asymmetry
  (the plot fails closed, the clock fails open). The port therefore carries a
  thrown hearth read as a VALUE, not a rejection. Proved against the dev database
  rather than assumed: with the second statement failing under a caught handler,
  the first statement's already-returned rows survive, and the trailing `COMMIT`
  answers a ROLLBACK tag WITHOUT throwing, for a relation error (SQLSTATE 42P01)
  and for a statement timeout (57014) alike.
- X4 SHOULD-FIX, the same probe refuting the docblock that motivated X1. The
  constant's own comment and section 8a of the contract both asserted the
  pre-fix arithmetic and both still ASKED FOR the port-shape change that had just
  landed. Worse, `SET LOCAL statement_timeout` bounds each statement SEPARATELY at
  READ COMMITTED: two 300 ms sleeps under a 400 ms bound both completed, 612 ms
  elapsed. So the pair's bound is 2 x 2,000, not 2,000. The corrected worst case
  is 5,000 (one pool checkout) + 2 x 2,000 = 9,000 ms against a 10,000 ms
  [CORRECTED IN ROUND FIFTEEN: every figure in this entry and the next is wrong, and
  so is the premise. The handshake has no deadline of its own, because
  AUTH_TIMEOUT_MS is cleared before the database work begins; and COMMIT answers to
  neither server-side bound, measured, so the floor is 104,000 ms. See ROUND FIFTEEN.]
  handshake, down from 19,000. Nine against ten is a MARGIN, NOT A BOUND: the cap
  on the whole preload against the handshake's remaining budget still does not
  exist, so section 8a's gate is narrowed to its budget half and STAYS OPEN for
  the release.

- X5 SHOULD-FIX, found by this session while verifying X1 rather than reported.
  `readLoginPair` was written as two returns, and the combined arm normalized the
  clock payload OUTSIDE the `try` the fallback arm had. A payload that throws
  inside `normalizeHearth` therefore answered a cold clock on a host binding the
  two-port pair and HELD THE WHOLE LOGIN on a host binding the combined port,
  which write-blocks that account for the session. Which port a host binds must
  not decide that. Both shapes now run one path: the row read outside the guard,
  where its rejection still becomes a hold, and everything clock-shaped inside it.
  Pinned by driving one malformed payload through BOTH arms and comparing, and
  the pin is decisive: restoring the two-return shape reds it.
- X6 SHOULD-FIX, A SURVIVING MUTANT. The combined port had no test of any kind,
  because every case in the suite drives the fallback pair, and the composition
  root has none either because nothing imports it (it binds the real pool at
  module scope). Removing the wiring's clock swallow, which is the ONE property
  that makes a shared transaction safe, left all 180 cases green, and `tsc` stays
  silent because dropping that arm only NARROWS the value against the port's
  declared union. Closed with four behaviour cases over the combined port and
  three source pins over the binding. FOUR MUTANTS over the wiring, each against
  a proved control of `Tests 183 passed (183)`: the swallow removed (KILLED, 1
  failed), the row read swallowed too (KILLED, 1 failed), the clock read moved
  off the transaction onto the pool (KILLED, 2 failed), and one wrapper per read,
  which is the original X1 defect (KILLED, 3 failed). A first attempt at the
  third mutant did not apply, its unmutated run is NOT counted as a result, and
  it was re-run correctly.

The extraction that paid for X1: the composition root moved WHOLE to
`server/freehold_persist_wiring.ts`, taking every SQL import with it. The store
file now names its ports and nothing supplies them, which is the property that
lets a Vitest drive the whole lifecycle with no database and no GameServer. Its
row drops 2343 to 2319, twenty-four under its opening count despite seventy lines
of new logic.

## ROUND FOURTEEN: THE REVIEWS ARRIVED LATE, AND ROUND THIRTEEN HAD DONE IT AGAIN

All four fresh lanes delivered after round thirteen had been written up as
unreviewed. Every one of their findings was real, and TWO OF THEM WERE DEFECTS
ROUND THIRTEEN INTRODUCED. The pattern holds at fourteen for fourteen.

- Y1 SHOULD-FIX, the round's own regression, and the sharpest kind: THE FIX'S
  CLAIM WAS WIDER THAN ITS EVIDENCE. Round thirteen's `.catch` covered only
  `loadFreeholdHearth`'s promise, not the `COMMIT` that `runWithStatementTimeout`
  issues afterwards. The two SQLSTATEs measured (42P01, 57014) both leave the
  connection USABLE, which is exactly why COMMIT answered a ROLLBACK tag in the
  probe; the probe therefore could not see the case it was cited for. A clock
  fault that KILLS the connection (backend crash, restart, dropped socket) makes
  COMMIT reject, the helper rethrow and the port reject, so `loadOnce` answers a
  hold and the account is write-blocked FOR A FAULT IN THE CLOCK, on the one path
  the two-port pair answers with a cold clock and a normal login. Not a breach of
  the one invariant, since a hold preserves the row, but the opposite of what the
  commit and the contract said. Closed by guarding the WHOLE transaction: the row
  is captured as it is read, a later rejection with a row in hand is a thrown
  clock, a rejection with no row is rethrown so the plot still fails closed.
- Y2 SHOULD-FIX, also round thirteen's. Extracting the composition root SILENTLY
  DROPPED the statement bound off both two-port fallback ports, leaving them on
  the pool's 15,000 ms session default (the "against a 10,000 ms handshake" half of
  this sentence is CORRECTED IN ROUND FIFTEEN: there is no such handshake bound),
  while the
  new file header claimed the move changed nothing. Dead on this host, and the
  declared fallback surface every unit test drives. Both wrappers restored and
  the header corrected.
- Y3 SHOULD-FIX. `readLoginPair` branched on the hearth VALUE
  (`both.hearth ?? await ports.readHearth(...)`) rather than on which port the
  host bound, which is precisely the coupling the merge existed to remove and, on
  the real host, a second read outside the transaction. Branches on the port now.
- Y4 SHOULD-FIX, the arithmetic. 9,000 ms was never the worst case: `BEGIN` and
  `SET LOCAL` both execute BEFORE the lowered bound is in force, so they and the
  trailing `COMMIT` answer to the pool session default. The floor is 5,000 +
  2 x 15,000 + 3 x 2,000 = 41,000 ms; two transactions were about 78,000. The
  change halves it and stands, but "nine against ten is a margin" was the sentence
  used to narrow section 8a's gate, and against 41,000 there is no margin. The
  19,000 it replaced carried the same omission, so this is an older habit than the
  rewrite. Section 8a's gate is restored undiminished.
- Y5 SHOULD-FIX, three pin defects in round thirteen's own new pins. The clock
  swallow pin's window ended at `}),` which does not match `})),`, so it ran 740
  characters past the hearth read through seven later ports and an identical catch
  on any of them would have satisfied it. The fallback pin's title claimed a bound
  it never asserted, and its comment called the pair "deliberately UNBOUNDED",
  enshrining Y2 as intentional. And `flushFreeholdBinding`'s never-rejects
  property, moved into that module by round thirteen, had no pin at all: if a
  later edit drops it the rejection escapes the leave's `finally` above the lease
  release and `removePlayer`, which is invariant 1 territory. All three closed,
  and FOUR mutants over the new guards are KILLED against a proved control of
  `Tests 184 passed (184)`: the rethrow removed, the outer catch removed, the
  fallback unbound again, and the flush swallow dropped.
- Y6 SHOULD-FIX. The export row bound was pinned only as a constant and as SQL
  text, so nothing had ever inserted a twenty-first row and the truncation marker
  shipped with no executed coverage. One PostgreSQL case now inserts past the
  limit and asserts the count, the marker's shape, that it carries no plot
  identity an exporter could read as a plot, and a contrast arm one row short
  that returns no marker.
- Y7 NITS. A leftover private alias for a name that had become exported; a
  re-measurement spliced mid-sentence into a comment without rewrapping; and a
  docblock still saying "two leave-path callers" after round thirteen routed five
  sites through it.

- Y8 NITS, from the reviewer's truncated tail, which arrived after the rest was
  already applied. The clock-swallow needle carried the trailing comma of biome's
  MULTI-LINE object form, so a reformat that fitted the literal on one line would
  have turned the pin red with no behaviour change; it matches in pieces now, and
  two further mutants confirm it still dies when the catch is removed and when it
  is moved onto the row read instead. The thrown-clock case is decisive ONLY
  through its log assertion, because the normalizer falls through to the same zero
  and the same revision, so the two value assertions cannot tell a deleted
  cold-clock path from a working one; that is now written beside the line rather
  than left for a trimmer to discover. A fixture carried a stray discriminant that
  is not part of the port's shape. A comment claimed the two arms were compared
  with each other when the loop asserts fixed literals on each, which is stronger,
  and comparing them would pass if both regressed the same way. And the rollout
  contract still gave the store file's line count as a number that was already
  stale when written; it cites the ratchet row now, which is the anchor rule the
  rest of that document follows.

WHAT THE ROUND CONFIRMED rather than found. The guild-book routing HOLDS: the
callee puts `guildBookHolders.resync` and the `reconcile` counter inside the loop
over the ids it is handed, so an empty set is zero iterations and no side effect
became reachable or unreachable. The flush swallow HOLDS, because
`flushAndRelease` is declared async so no synchronous throw bypasses the attached
catch. The merged reader's fallback arm HOLDS. The four new behaviour cases are
not vacuous. Both ceilings HOLD at their lowered values.

## WHAT ROUND THIRTEEN DID NOT GET AT THE TIME, AND WHAT ARRIVED AFTERWARDS

SUPERSEDED IN PART, kept because the sequence is the point. When round thirteen
was written up, four fresh lanes had been dispatched over it and all four had
gone idle without their reports reaching this session, so it was recorded as
unreviewed and nothing was claimed. THE REPORTS THEN ARRIVED, late and in one
batch, and round fourteen above is what they found: seven findings, two of them
defects round thirteen had introduced. Two reports were still truncated mid-list
and their tails were requested; an unknown number of findings remains outstanding.

The reason for recording it this way rather than quietly folding it in: a round
that declares itself unreviewed and then turns out to have been wrong is the
ordinary case on this branch, not the exception.

WHY THAT IS NOT A FORMALITY HERE. Eleven of the thirteen rounds introduced a
defect worse than one they closed, and not one of those was caught by the round's
own green tests. Round thirteen's own X5 and X6 were found by this session
attacking its own change and by a mutant, not by the suite, which was green
throughout. The gate is green at this tip and that is where a reader should
start, not stop.

WHAT THIS ROUND SELF-CHECKED INSTEAD, stated so a later reader knows the
substitution was made and what it is worth. The guild-book routing is the highest
risk change in the round, because it touches money-conservation paths: five call
sites now share one private method whose own empty guard was deleted, and the
equivalence rests on `revertOwnGuildBookOps` iterating the ids it is handed, so an
empty set performs no revert, no `guildBookHolders.resync` and no `reconcile`
counter, exactly as the deleted guard ensured. That is a code reading plus a green
money-conservation property sweep inside the full suite. It is NOT a fresh
reviewer, and it is NOT a mutation over that path.

THE NEXT SESSION'S FIRST TASK is a fresh read of `dd4c869a2b..HEAD` by someone who
did not write it, with the guild-book routing and the combined login port first.

## THE VALIDATION THIS VERDICT RESTS ON

At tip `29b1f85307`, with `TEST_DATABASE_URL` armed from the main checkout.

- `node scripts/gate_select.mjs` exit 0, PASS, all 12 steps green. The planner FELL
  BACK to the full suite on a 1,733-path diff, so this is the deeper check rather
  than the selective one.
- Full suite: 4,218 test files passed and 1 skipped of 4,219; 63,685 tests passed,
  2 expected-fail, 28 skipped; 750.58 s.
- Real-browser suite: 51 files, 429 tests, all passed. It rewrote four PNGs under
  `docs/screenshots/`, restored with `git checkout --` and NOT committed.
- `npx tsc --noEmit` exit 0. `npm run ci:changed` exit 0 over 640 files, warnings
  only, which is the documented pre-existing debt and not this branch's.
- The two `.pg` suites, run BOTH WAYS to prove the arming rather than assert it:
  33 passed with the variable set, the same 33 skipped with it unset.
- Four mutants over `server/freehold_persist_wiring.ts`, each against a proved
  control of `Tests 183 passed (183)`, all KILLED. One earlier attempt at the third
  did not apply; its unmutated run is NOT counted as a result and it was re-run.
- Transaction semantics measured against the dev database rather than reasoned
  about: a second statement failing under a caught handler leaves the first
  statement's already-returned rows intact and the trailing COMMIT answers a
  ROLLBACK tag without throwing, for SQLSTATE 42P01 and 57014 alike; and SET LOCAL
  bounds each statement separately, two 300 ms sleeps under a 400 ms bound both
  completing in 612 ms.

A GREEN GATE IS WHERE THIS ROUND STARTED, not where it finished. The gate was green
at round twelve's tip too, and round thirteen still found six things.

## THE FOUR RULINGS: THE WORD IS GIVEN, 2026-09-10

ALL FOUR ARE DECIDED, and every one landed on the recommendation. Six further scope
decisions were settled in the same sitting and are recorded below the four. Nothing here
is implemented yet: the behaviour each ruling describes is still pinned as it currently
behaves, and the next session executes them. The evidence and the reasoning are kept
verbatim under each ruling, because a decision without its evidence is unreviewable.

### RULING 1, C1 plus C22 plus the EIGHTH PATH: teach the live record its minted identity

DECIDED: TAKE IT, in the SAFE form, AS ONE CHANGE. Steps 1 to 5 below are the executable
specification. This closes the packet's blocking finding.
1. In `installLoadedFreehold`, on the ABSENT arm ONLY (`hold === null && state === null &&
   durableRev === null`, with a `plotId` that matches the wire charset), install a default
   record carrying `loaded.plotId` through the existing `loadFreehold`. It is load-once and
   already honors the dark-realm flag, so `addPlayer`'s `ensureFreeholdRecord` then returns
   it untouched. No new sim writer, no stamp function, no post-hoc mutation, and neither
   `src/main.ts` nor `server/game.ts` is touched.
2. Do NOT stamp onto a record that is already live. That form rewrites a freshly seeded
   default's identity to the minted name, which kills the name comparison and, through
   `standInSeed`, both continuity arms at once. It is a new path to the same loss, traced by
   the parity reader.
3. In the SAME change, un-gate `revisionRegressed` from `standInSeed`: after the fix no
   online record carries the stand-in, so the revision discriminator would otherwise be dead
   for the same-account character swap. This half needs its OWN executed proof, because `rev`
   restarts from the last committed value on a rejoin replay, which is what made W1's
   revision comparison wrong.
4. Two existing pins flip with it and must be planned rather than discovered:
   `tests/server/freehold_persist.test.ts` "installs nothing for an absent load", and the
   KNOWN DEFECT cases.
5. Offline and headless are untouched, which WIDENS the host divergence from session two
   onward to session one onward: every offline world keeps the one literal stand-in while
   online identities are unique. If 08a intends `plotId` to be a key, those hosts need a
   minter of their own.
What it closes: C1, C22, V6 and the eighth path, and it makes the name comparison TOTAL for
every entry class rather than for row-loaded entries only.
Why this QA did not take it: its safe and unsafe forms differ by one line and one of them is
a new data-loss path, and its companion un-gating needs an executed proof of its own. The
alternative interim is a fourth heuristic in the same boolean expression, which is what the
last four rounds each tried, and the specific one proposed this round was refuted here
because it write-blocks the development tier grant.

### RULING 2, C2: an admission-class refusal is a TERMINAL hold

DECIDED: TAKE the reviewer's smaller correction, with the caveat this QA measured. Do not set
`loaded` for the three admission kinds (`cap_full`, `no_permit`, `read_threw`), so `retain`'s
lost-entry repair arm can re-read them; leave `unadmitted`, `unsupported`, `malformed` and
`oversize` terminal, because those are DATA causes and a repeat cannot change them. The
caveat: `entry.loaded` is also what `preload`'s replay arms and `blocked()` read, so the
change must keep the entry write-blocked while it is unrepaired. The current behaviour is
now pinned (a mutation pass showed removing the flag left 507 tests green), so the fix flips
a test rather than passing silently.

### RULING 3, C3: the entries map has no size bound

DECIDED: RECORD THE DERIVED CEILING. No cache, and therefore no eviction policy, because
an eviction policy here is a decision about whose unwritten edits may be dropped and
nothing has asked for one. The measured facts:
one ordinary sweep at five thousand dirty owners leaves 4,996 deferred and uncollectable
until their writes land, and that clears in about 14.5 seconds at the measured 345 writes per
second, inside the interval. The cliff is about ten thousand three hundred concurrently dirty
owners per sweep, which is the write cap divided by the statement latency times the autosave
period. Below it the map is self-limiting; above it nothing collects. If a hard cap is wanted
anyway, the seam the file already names is the keyed bounded cache with LRU eviction in
`server/discord_status_cache.ts`, and the decision it forces is which owner's unwritten edits
an eviction is allowed to drop.

### RULING 4, the policy half of C5: the two admission caps sum past the shared gate

DECIDED: STATE THE OVERCOMMIT AS ACCEPTED, with the arithmetic, rather than sharing one
budget. The load cap of four and the write cap of four are independent against a gate of
seven, and the store was measured holding all seven. Sharing one budget couples a login's
read to a sweep's writes, which is the coupling the two constants were split to avoid; the
honest alternative is to say in the contract that housing may hold up to seven of seven
permits in steady state and eight during a drain, and to alert on `permit_wait_ms` for the
other producers behind it. The peak-concurrency pin the database reviewer asked for should be
written against whichever answer is taken, not before.

## THE SIX SCOPE DECISIONS SETTLED WITH THE RULINGS, 2026-09-10

Decided in the same sitting, and binding on the next session in the same way.

- **C23, the player-facing surface for a write-blocked hold: SCOPED NEXT, BUILT SEPARATELY.**
  The next session designs it and writes the `t()` keys and the contract entry; a later
  session builds and captures it. The reason for the split is diff shape rather than
  priority: the identity fix touches the sim's load path and the surface touches the HUD,
  and merging them makes one reviewable change into two unreviewable halves. The next
  session's scoping output must name the exact keys, the render sink each one goes to, and
  which of the seven load-failure kinds the player is told apart, because a surface that
  says "something went wrong" for all seven is not worth a string.
- **The section 8a login budget gate: CLOSE IT.** Cap the WHOLE preload against the
  handshake's remaining budget, so an overrunning login is refused rather than joining
  behind a closed socket with a character lease taken. Lowering the statement bound instead
  was considered and rejected: it does not bound BEGIN, SET LOCAL or COMMIT, which are three
  of the five statements and answer to the pool session default, so it narrows the number
  without closing the gate.
- **Offline and headless plot identity: ACCEPT AND DOCUMENT THE DIVERGENCE.** Online mints
  unique ids; offline and headless keep the single literal stand-in. Record it in this
  contract and in `src/sim/freehold/CLAUDE.md` so the phase that makes `plotId` load-bearing
  as a key knows it must supply a minter for those hosts FIRST. No sim change now, and no
  minter improvised: anything minting ids inside `src/sim/` must draw from `Rng`, never a
  clock and never `Math.random`.
- **Review: A FRESH READ OF THE WHOLE PACKET FIRST**, `dd4c869a2b..HEAD` end to end, before
  any new code is written, with the guild-book routing and the combined login port first.
  Twelve of the fourteen rounds introduced a defect worse than one they closed and not one
  was caught by the round's own green tests, so the correct prior is that this packet is
  still wrong. The fix round that follows gets its own separate fresh review.
- **Scope: THE FOUR RULINGS PLUS THE LOGIN BUDGET GATE, THEN STOP.** C23 is scoped, not
  built. Nothing else in C1 to C23 is open: the rest is either closed in this packet or was
  a maintainer decision, and all of those are now settled.
- **Delivery: STAY LOCAL.** Commit on `feature/freeholds`, run the gate, report. No push, no
  pull request, no merge, whatever the result.

## ROUND FIFTEEN: THE WORD WAS EXECUTED, AND THE FRESH READ FOUND A BLOCKER FIRST

The four rulings and the six scope calls were executed on 2026-09-10. Before any
of that was written, the whole packet was read fresh by lanes that had not
written it, `dd4c869a2b..HEAD` end to end, with the guild-book routing and the
combined login port first, exactly as the scope call required. THAT READ FOUND
36 FINDINGS, one of them BLOCKING, and it found them in code that fourteen rounds
and a green gate had already been over. Every finding was adversarially verified
by three independent lenses (does it reproduce, is it already ruled, is the claim
wider than the evidence); 35 of 36 survived, and the one that did not is recorded
below rather than dropped.

The pattern therefore holds at fifteen for fifteen. It is worth saying plainly
what that now means: the count is not evidence that the reviewers are thorough,
it is evidence that this subsystem is not yet in a state where a round can be
trusted on its own.

### The BLOCKING one, and it was not in the store at all

- R1 BLOCKING (teardown). `settleLeavingSession` still ended with FOUR session
  REGISTRATIONS, below a final save that retries five times and a guild-book
  revert that can fault. A rejection anywhere above them ran the three releases
  in leave()'s `finally` and skipped all four, so the character was gone from
  `clients` and from the sim while `sessionsByCharacterId` STILL MAPPED IT:
  `planJoin` then answered 'character already in world' for every later login for
  the life of the process, `takeOverCharacter` found the corpse, reported
  'taken-over' and changed nothing, and every whisper, mail and party lookup kept
  resolving to the dead session and sending into a closed socket. Round eleven
  moved the three RELEASES into that `finally` for exactly this reason and left
  these behind, and the round-twelve regression that followed was the same shape
  seen from the other end. FIXED: the four move into the `finally`, ahead of the
  three awaits, identity-guarded so a same-account swap cannot evict the live
  session's own registration. PAID FOR BY EXTRACTION, `revertOwnGuildBookOps` to
  `server/guild_book_holders.ts`, and the coordinator's ceiling LOWERED to 9907.

### What else the fresh read found, all applied

- R2 SHOULD-FIX. `saveLeavingCharacter`'s "never throws" was stated in its header
  and proved with a stub that could not throw. Its one callback runs INSIDE the
  catch on the exhausted-retry arm, so a fault in the backward book replay
  rejected out of the leaving session's settlement, which is the single most
  expensive place on the leave path for a rejection to land. Guarded, and the
  extracted revert never throws either: a guild whose replay faults is logged and
  the guilds behind it are still undone.
- R3 SHOULD-FIX. `retain` cleared a returning owner's leave capture with two
  inline lines rather than through `releaseCapture`, so the entry kept its place
  in `deferredLeavers` with no capture. `nextDeferred` then answered with it on
  every admission and `pumpLoop` priced it at the NON-leaving cap, so the two
  reserved slots never reached the genuine leavers queued behind it. That is
  exactly the starvation 23d2e6741a was written to end, and it falsified
  `undefer`'s own stated invariant. A case drives it and dies when the inline
  clear comes back.
- R4 SHOULD-FIX. The MINT IS PER ENTRY, NOT PER OWNER, and ruling 1 as written
  does not fix that: an entry the orphan sweep collects between a preload and its
  retain is recreated empty, and its repair reload mints a SECOND identity while
  the record installed from the first keeps answering to the first. After ruling
  1 that is not cosmetic, it is a quiesced session. The absent arm adopts the live
  record's identity when there is one.
- R5 SHOULD-FIX. `readDurables`' outer guard captured the ROW as it was read and
  rebuilt the CLOCK from the outer error, so a COMMIT that rejected after both
  statements had answered threw away a clock it had already read and reported the
  cold one, which reads as READY. The store then remembers that zero on the entry
  and replays it to every later character of the account for the whole session
  without reading again. Both halves are captured now, and the policy moved out of
  the composition root into `readLoginDurables`, where five behaviour cases drive
  it: the root binds the real pool at module scope, so nothing imported it and
  nothing executed its closures.
- R6 SHOULD-FIX. `flushAndRelease` gave the reference back after the flush rather
  than in a `finally`, so a throw from the injected deadline scheduler, the
  serialize port or the enqueue port held it for the life of the process, with
  its one production caller swallowing the rejection that would have shown it.
- R7 SHOULD-FIX (attribution). The guild-book routing and the leave-flush swallow
  removal are in 0c48e8a3c4, NOT fbcd3298dc as the ledger and that commit's
  message both said, and 0c48e8a3c4 deleted the swallow ONE COMMIT BEFORE the
  module gained it: at exactly that commit a `flushAndRelease` rejection escapes
  leave()'s own `finally` above the lease release and `removePlayer`. HEAD was
  always correct; the defect is one commit deep and survives any bisect or
  per-commit audit. Corrected here rather than amended, because a record that
  misattributes a fix is how the next reader looks in the wrong commit.
- R8 SHOULD-FIX (docs). The published login floor of 41,000 ms contradicted the
  statement composition in its own sentence, which argued 54,000. MEASURED rather
  than argued: see the corrections section below. Both were wrong.
- R9 SHOULD-FIX (docs). DEPLOY.md told an operator to read the load-failure split
  as FOUR diagnoses and named four of the seven kinds the series emits, omitting
  the three data incidents the recovery contract exists for. All eight are named
  now, in the two groups an operator can act on.
- R10 SHOULD-FIX (docs). `state.md` named a gate run no other document records,
  22 commits behind the tip, and no recorded gate covered the last three code
  commits. Corrected with this round's own run.
- R11 SHOULD-FIX (tests). The sole-writer scan for the live record map listed
  seven roots and could not see `src/world_api`, `src/editor`, `src/admin`,
  `src/guide` or `src/main.ts`, while the claim it enforces is "the ONLY file".
  Widened to `src`, `server`, `headless` and `bot` whole.
- R12 SHOULD-FIX (tests). That scan's anti-vacuity control asserted two LITERALS
  while the scan used a REGEX, so a regex that stopped matching passed the
  offender list empty and the control still went green: it controlled the file's
  contents, not the detector. It runs the scan's own predicate now.
- R13 SHOULD-FIX (tests). The join-teardown pin read the CATCH release as inside
  its block and left the identical hole open on the FINALLY release one line
  below, under a comment naming that exact failure mode.
- R14 SHOULD-FIX (tests). The high-water-mark case drove a second write of the
  SAME size, which a last-sample gauge satisfies just as well. It drives a
  smaller write and then a larger one.
- R15 SHOULD-FIX (db). The export's on-disk pre-gate is STRICTER than its own
  authoritative rendered bound for incompressible content, so the widening is
  inert there and the row comes back with its size instead of its content on the
  owner's only readback. Recorded as a named residual with its reasoning rather
  than closed by widening the pre-gate, which would defeat what the pre-gate is
  for.
- R16 SHOULD-FIX (critic). `boundedFreeholdDetail` was added to cover the log
  routes that bypass the reporter and was wired at ONE of FOUR, while its own
  docblock recorded the whole channel as closed. That is the S9 overstatement
  again. Applied at all four, every shape they emit named in the vocabulary, and
  the omission the round-trip arm structurally cannot see is pinned separately.
- R17 SHOULD-FIX (critic). `normalizeHearthLoad` answers the COLD clock, which is
  READY, for an `unsupported` row, while `loadFreeholdHearth`'s docblock said that
  kind is what stops a damaged row granting a trip. Both files say what is true
  now: the kind buys a WARN, and refusing the trip is 07a's job.
- R18 NITS, all applied: the two upkeep JSONB columns are selected raw past both
  export bounds (safe only because the DDL holds them NULL in this build, and the
  release that writes them owes them the same treatment); `requireUpsertInput`
  did not make the refusals its own header promises for two narrow integer
  columns and two JSONB ones; `freeholdsForExport` skipped the account-id refusal
  every sibling runs; a docblock had drifted two declarations from the constant
  it describes, leaving one invariant undocumented and its neighbour wearing the
  wrong text; the export docblock stated a truncation rule the function does not
  implement and the boundary had no case; DEPLOY.md counted its alert-worthy
  series with a bare literal; a duplicated comment fragment in the capture
  handover; the by-path exception list in `src/sim/freehold/CLAUDE.md` was stale
  against two importers the same range added; `FREEHOLD_MAX_VISIT_POLICY_LENGTH`
  duplicated the column ceiling with nothing pinning them equal;
  `requireHearthAccountId`'s docblock claimed a hold the combined port can no
  longer produce; the clock-swallow pin's piecewise match dropped the one thing
  the old literal proved, that the catch RETURNS the payload carrying the error;
  the recursive module walk was contradicted by a flat directory listing beside
  it; the join's `joined = true` comment claimed a leave would run for a tail that
  is outside the guard.
- R19 REFUTED by two of three verifiers, and JUDGED HERE rather than dropped:
  "nothing executes any port closure in the wiring file". The claim is FACTUALLY
  TRUE and the verifiers refuted it as already recorded, which it is (round
  thirteen's X6 says so in as many words). It is answered in this round anyway,
  by moving the login read's POLICY out of that file into a module five behaviour
  cases drive, and by the mutation pass over the binding that remains.
- R20 REVIEWED, NO CHANGE. The join tail after the `finally` closes is outside
  the retain guard, so a synchronous throw there rejects the handshake with no
  message handler attached and nothing schedules the leave that owns the release.
  Every statement in that tail is a map write or a voided, caught promise today,
  and moving the guard would re-indent a hundred and twenty lines for a case
  nothing can currently reach. The over-claiming comment is corrected to state
  the residual instead.

### THE CLAIMS THIS ROUND REFUTED WITH A MEASUREMENT

- THE HANDSHAKE HAS NO DEADLINE OF ITS OWN, and section 8a said it does.
  `AUTH_TIMEOUT_MS` is cleared SYNCHRONOUSLY by the first-frame handler before
  `authenticateWebSocket` runs; `server/ws_auth.ts`'s own docblock states that it
  bounds upgrade-to-first-frame only, never the handshake's database work. The
  database reviewer's ORIGINAL finding (C7) said exactly this and the contract
  overwrote it with a correction that was itself wrong. The login budget gate is
  therefore closed with a STATED CEILING rather than a share of a budget that
  does not exist, and the contract says so.
- COMMIT ANSWERS TO NEITHER SERVER-SIDE BOUND. Measured on PostgreSQL 16 with a
  DEFERRABLE INITIALLY DEFERRED constraint trigger putting two seconds of work
  inside the commit itself: under `SET LOCAL statement_timeout = 300` the COMMIT
  ran 2,008 ms and COMMITTED, against a control at the session default that took
  the same 2,008 ms. A second probe on a pool built with `query_timeout: 500`
  REJECTED the same COMMIT after 501 ms with a client-side read timeout carrying
  no SQLSTATE. So COMMIT's only ceiling is `DB_QUERY_TIMEOUT_MS`, and the floor
  on the combined login read is 5,000 + 2 x 15,000 + 2 x 2,000 + 65,000 =
  104,000 ms. The published 41,000 priced COMMIT at the lowered bound and the
  prose beside it argued 54,000; the 19,000 and the 9,000 before them omitted
  five statements between them. FOUR published figures, all wrong, all in the
  same direction.
- THE DELIBERATE BACKWARDS WRITE IS RETIRED. `phase-07-qa.md` closed with "a
  record carrying a REAL plot name still goes backwards onto the row,
  deliberately", and `noteRevisionMoved`'s docblock said the same. Un-gating
  `revisionRegressed` reverses it, and it should be reversed: a live revision
  below the entry's last committed one means the live record is not the record
  that commit came from, since every install a rejoin is offered carries at least
  the committed revision and every sanctioned mutator only increments, and
  writing it walks the client-facing wire counter backwards permanently, which is
  the exact harm the loader's own `wire_rev_shape` hold refuses on the read side.
  Two pins encoded the old rule and both flip.

### WHAT THE RULINGS COST THAT THEY DID NOT SAY THEY WOULD

Ruling 1 step 4 named TWO pins that would flip. FOUR did: the two above, plus the
absent-load install case and one that modelled an established account emptying
its house at revision ZERO, which no sanctioned writer produces (every mutator
increments, so emptying a record at five leaves it at six). That fixture proved
its claim through a state the sim cannot reach; it is repaired rather than
deleted, because the claim itself is right and worth keeping.

Ruling 2's caveat held exactly as written: `entry.loaded` is also read by
`preload`'s replay arms and by `blocked()`, and an entry with a hold and no
`loaded` is blocked by both halves, so nothing writes for it while it is
unrepaired.

### THE MUTATION PASS

Every guard added or changed was mutated on disk, its owning suite run, the RED
confirmed, and the file restored by plain file write with the green re-confirmed.
Each pass ran against a no-op control first, and the control's full `Tests N
passed (N)` line is quoted in the verdict rather than summarized.

- Ruling 1, four mutants, control `Tests 196 passed (196)`, ALL KILLED: re-gating
  `revisionRegressed` behind `standInSeed` (3 failed), dropping the absent-arm
  install (1), minting unconditionally instead of adopting the live identity (1),
  and installing the stand-in instead of the minted identity (1).
- Ruling 2, two mutants, control `Tests 197 passed (197)`, BOTH KILLED: every
  hold terminal again (1 failed), and every hold retryable (1 failed). Both
  directions, because a one-way pin here is satisfied by a constant.
- The login budget, four mutants, control `Tests 201 passed (201)`, ALL KILLED:
  the cap dropped entirely (2 failed), the expiry touching the entry instead of
  leaving it alone (1), the deadline never cancelled (4), and a scheduler fault
  refusing the login instead of running uncapped (1).
- The capture bookkeeping, one mutant, control `Tests 190 passed (190)`, KILLED:
  restoring `retain`'s inline capture clear (1 failed).

## ROUND SIXTEEN: THE RULINGS ROUND WAS READ FRESH, AND IT HAD DONE IT AGAIN

Round fifteen executed the four settled rulings and was then handed to six fresh
lanes on the standing assumption that a fix round is unreviewed code. They found
30 findings, THREE of them BLOCKING, and TWO of the three were defects round
fifteen had introduced. Sixteen for sixteen.

Every finding was verified by three lenses (does it reproduce, was it
pre-existing or round-introduced, is the claim wider than the evidence). 27 of 30
survived; the three that did not are judged below rather than dropped.

### The two the round introduced

- S1 BLOCKING (teardown). Moving the four registrations into leave()'s `finally`
  meant that on a SETTLEMENT THROW a session was dropped from both guild-book
  indexes without its unflushed ops ever being reverted, because
  `reconcileOwnGuildBooks` was the settlement's last statement and a throw skips
  it. That leaves uncommitted money deltas on the LIVE book with nothing left to
  converge them: no mark for the disband guard to fail closed on, no session for
  the settle gate to count, and no session for the quarantine paths to find. The
  next officer's op on that guild then serializes the live book and commits
  deltas whose character half never landed, so one deposit becomes two, which is
  the Phase 3 QA dupe shape verbatim. Before the round nothing was dropped on a
  throw, so this is strictly a regression it created. FIXED: the revert runs in
  the `finally`, FIRST, above both drops. It is idempotent (the first pass
  deletes every id it was handed, so a second call is handed an empty list and
  does nothing) and it cannot throw (the extraction gave it a per-guild catch).
- S2 BLOCKING (identity). RULING 1 CLOSED THE EIGHTH PATH FROM ONE SIDE ONLY, and
  round fifteen's own two other fixes re-opened it from the other.
  `installLoadedFreehold` returns early on ANY hold, so a record seeded while its
  own load was refused never learns a name. Before this round that cost nothing,
  because an admission hold set `entry.loaded` and the entry stayed blocked all
  session. Ruling 2 made it re-readable, and the login cap deliberately left its
  entry for the in-flight read to fill, so for the first time an entry could be
  held at login and WRITABLE afterwards with no install ever having run. The
  store then minted a name for the row, `applyWriteResult` cached the LIVE
  record's stand-in, and the seal's name comparison was inert BY VALUE EQUALITY
  for the life of that entry, which is the eighth path arrived at from the other
  side. Reported independently by three of the six lanes.
  FIXED where the store can decide it: `classify`'s absent arm REFUSES to name a
  row for a record it did not install. A live record carrying the stand-in gets
  an `unnamed_record` hold, terminal for that entry, and no row is created at
  all. Nothing is lost, because there was no row; the next login builds a fresh
  entry whose install runs before the seed. NOT closed by stamping the identity
  onto the live record, which is the form ruling 1 forbids and refuted.
- S3 SHOULD-FIX (teardown). `storageRecovery.offline` is CHARACTER-keyed and was
  moved into the `finally` without the identity guard its neighbour got, so on a
  same-account swap it marked a LIVE character offline: that character's
  gold-rail ordering hold and its recovery-drive hold are released and it becomes
  a capacity-eviction candidate. The other two registrations are keyed by session
  identity and cannot reach a sibling, which is why only these two are guarded.

### What else the read found, all applied

- S4 SHOULD-FIX. `no_budget` was added to the kind list and forgotten in the
  repairable set, under a docblock claiming the set was "derived from the list
  below rather than re-typed, so a kind cannot be added to one and forgotten in
  the other". It was three hand-typed literals, and the very commit that wrote
  that sentence falsified it. DERIVED BY SUBTRACTION now: everything that is not
  a data cause and not the ordering cause is a capacity cause, so a kind added
  later lands in exactly one group by construction.
- S5 SHOULD-FIX. Only one of the three repairable kinds was pinned: deleting
  `cap_full` and `read_threw` from the set left the suite green. All of them are
  driven now, each through the port fault that produces it, and the set's exact
  membership is pinned.
- S6 SHOULD-FIX. The three flipped seal cases assert the fix BY FIXTURE: each
  hardcodes the live identity to its post-fix value, so reverting ruling 1's
  install left all three green and the eighth path's whole regression protection
  was one unit case in another describe. A case now couples the two through the
  REAL sim: it installs, reads the identity back off `ctx.freeholds`, evicts,
  reseeds through `ensureFreeholdRecord`, and asserts the seal refuses. Reverting
  the install reds it on its first assertion.
- S7 SHOULD-FIX. The harness's `livePlotId` contradicted its own `hasLive`:
  production reads both off ONE map, so no record means no identity, and the
  harness answered an identity for an owner it also said was not live. The ONE
  case covering the identity-adoption fix depended on that impossible state.
  Bound strictly to the liveness predicate now, and adoption is re-pinned on the
  state it actually exists for, a second character joining over a live record.
- S8 SHOULD-FIX. Raising the emptied-house fixture from revision zero to six,
  which the un-gating forced, took with it the ONLY pin on the `standInSeed &&`
  conjunct of `pristineSeed`: deleting that conjunct left the whole suite green.
- S9 SHOULD-FIX. THE SEAL HAD NO SUITE OF ITS OWN, and a comment written in the
  same round promised one. `tests/server/freehold_write_seal.test.ts` now drives
  every arm with literals, including the totality of `entryKnowsMore` dimension
  by dimension, and each of the four arms dies to its own mutant.
- S10 SHOULD-FIX. The budget-cap case detected only `entry.hold`, so a refusal
  that stamped `entry.loaded` was green, and a stamped `loaded` is exactly what
  stops the repair arm ever reaching that entry again.
- S11 SHOULD-FIX. DEPLOY.md kept "held counts entries under ANY recovery hold"
  while the same paragraph added a kind that books no hold at all: the whole-load
  cap leaves the entry untouched by design, so `no_budget` can climb with `held`
  flat. Both caveats are now stated, together with the fact that this series
  counts REFUSALS and not logins, so one login can book more than one.
- S12 SHOULD-FIX. The clock and timer source scan read only the store file, so
  the four modules that came off it could each have gained a `Date.now` or a
  second timer unseen. It walks all six now, with a floor proving the file list
  is not stale.
- S13 NITS, all applied: the extracted revert's call-site census named a caller
  that does not exist and undercounted by one, and the coordinator's own copy of
  it was stale the same way; the C23 scope document named the DOM-free view core
  as a paint sink and counted table rows as sinks; two source comments and one
  test comment asserted a totality that did not hold until S2 landed; the losing
  promise of the budget race now keeps a no-op handler, because being wrong about
  whether it can reject costs the realm process.
- S14 REFUTED by two of three lenses, JUDGED HERE. (a) "the budget race leaves an
  unhandled rejection": the premise is right that nothing handled it and the
  lenses are right that `preloadWithin` does not reject, so the handler is added
  as cheap insurance rather than as a defect. (b) "COMMIT ANSWERS TO NEITHER
  SERVER-SIDE BOUND is wider than its evidence": the lenses refuted it, and THE
  REVIEWER WAS RIGHT ANYWAY. Both probes had LOWERED the bound, so neither tested
  a session-level `statement_timeout` binding the commit work, and this packet's
  signature failure is exactly a claim shipped wider than its probe. A THIRD
  PROBE settled it rather than an argument: session-level `statement_timeout` at
  300 ms, no SET LOCAL at all, COMMIT ran 2,007 ms and committed. The claim
  stands and is now measured both ways. (c) "budgetRefusal answers a READY clock":
  correctly refuted, the merge is forward-only so a zero is inert, and every
  other hold answers the same cold clock.

### The mutation pass over this round's own fixes

Six mutants, against a proved control of `Tests 217 passed (217)`, ALL KILLED:
the unnamed-record refusal removed (1 failed), the same refusal inverted so it
admits the stand-in and refuses a real name (4), the repairable set widened to
every kind (3), the terminal set losing the ordering kind (2), the leave revert
dropped from the finally (1), and the storage hook losing its identity guard (1).
Four more over the seal's own new suite, each arm in turn, all killed:
`standInSeed &&` deleted (1), `revisionRegressed` dropped (2), `pristineSeed`
dropped (1), `foreignIdentity` dropped (2). And two survivors from the earlier
composition-root pass were closed and re-killed: a live-identity binding replaced
by a constant, and the clock read's inner catch removed.

## THE VALIDATION ROUNDS FIFTEEN AND SIXTEEN REST ON

At tip `0be2f181e2`, ten commits on `07521507d6`, with `TEST_DATABASE_URL` armed
from the main checkout's `DATABASE_URL`. THIS BRANCH IS LOCAL: nothing was
pushed, no pull request was opened and nothing was merged.

- `node scripts/gate_select.mjs` exit 0, PASS, ALL 12 STEPS GREEN. The planner
  FELL BACK to the full suite on a 1,742-path diff, so this is the deeper check
  rather than the selective one.
- Full suite: 4,219 test files passed and 1 skipped of 4,220; 63,729 tests
  passed, 2 expected-fail, 28 skipped.
- Real-browser suite: 51 files, 429 tests, all passed. It rewrote three PNGs
  under `docs/screenshots/`, restored with `git checkout --` and NOT committed.
- `npx tsc --noEmit` exit 0 throughout.
- The two `.pg` suites, run BOTH WAYS at this tip to prove the arming rather than
  assert it: 34 passed with the variable set, the same 34 skipped with it unset.
- Mutation: eighteen mutants across five passes, each against a proved control
  whose full `Tests N passed (N)` line is quoted in its round's section. Sixteen
  died on the first pass; TWO SURVIVED, both over the composition root and the
  login policy, and both were closed and re-killed. Every guard these two rounds
  added or changed was mutated in both directions where a one-way pin would be
  satisfied by a constant.
- The three PostgreSQL 16 transaction probes are described where they are used
  (the login bound in section 8a of the contract): SET LOCAL does not bound
  COMMIT, a session-level `statement_timeout` does not bound COMMIT either, and
  the driver's `query_timeout` does.

TWO THINGS THIS VALIDATION DOES NOT COVER, stated rather than implied.

THE DIFF BASE HAS MOVED AGAIN. The gate reports `origin/release/v0.43.0` as the
integration base; the last recorded sync on this branch was `release/v0.42.0`.
NO SYNC WAS PERFORMED in these rounds, because the tip was pinned. The next
session owes the merge-forward that `state.md` requires at every phase start, and
every count in this section is against the unsynced tree.
CORRECTED AT ROUND SEVENTEEN: the sync was performed after this paragraph was
written, in merge `d5e7f423c7`, and it was never gated. See below.

AND THE VERDICT IS STILL FAIL, on the record rather than on an open defect. Every
finding either round produced is applied, both blocking sets are closed, and the
gate is green. What is not established is that round sixteen's own fix round is
clean: it has not been read by anyone who did not write it. Sixteen rounds have
run and fourteen introduced a defect worse than one they closed, so the honest
prior for the next reader is that this one is wrong too. A green gate is where
that reading starts.

## THE VALIDATION ROUND SEVENTEEN RESTS ON

At tip `046008c59d`, fifteen commits on the release-sync merge `d5e7f423c7`, with
`TEST_DATABASE_URL` armed from the main checkout's `DATABASE_URL`. THIS BRANCH IS
LOCAL: nothing was pushed, no pull request was opened and nothing was merged.

- `npx tsc --noEmit` exit 0 throughout.
- `npm run ci:changed` exit 0 (824 warnings, 17 infos, ZERO errors; warnings are
  not the bar and the whole-repo red is pre-existing debt).
- `node scripts/gate_select.mjs`, THREE RUNS, and the first two each caught a real
  defect the ungated sync had left behind rather than anything this round wrote.
  Run 1 FAILED at `biome (changed files)` on ONE error: a format diff in
  `scripts/pr_shot_targets.mjs`, the release's own new capture target, which the
  merge took unformatted and which makes `ci:changed` refuse the entire changed
  set. Run 2 was abandoned mid-suite when the read of the fix round landed. Run 3
  reached the end.
- RUN 3, the full one. The planner FELL BACK to the full suite on a 1,744-path
  diff, so this is the deeper check rather than the selective one. Diff base
  resolved as `origin/release/v0.43.0`, which is the integration base the gate
  sorts to. Every step green through the malware scan and biome. FULL SUITE
  PASSED: 4,225 test files passed and 1 skipped of 4,226; 63,821 tests passed, 2
  expected-fail, 28 skipped.
- RUN 4, ON A QUIET MACHINE, and this is the one that settles it: `GATE_EXIT=0`,
  `PASS: all 12 steps green (vitest workers: 8)`. Same tip, same armed database.
  Full suite 4,225 files passed and 1 skipped of 4,226; 63,821 tests passed, 2
  expected-fail, 28 skipped. BROWSER REGRESSIONS 52 files and 443 tests, ALL
  PASSED, which is the step run 3 failed. Malware scan PASS (9,082 files, 457
  flags, 0 high after priors). Typecheck, the env, server and bot builds and the
  client bundle all green. The browser step rewrote six PNGs under
  `docs/screenshots/`, restored with `git checkout --` and NOT committed.
- RUN 3 HAD FAILED AT `browser regressions`, exit 1, on ONE test of 443:
  `tests/browser/post_grade_fxaa.browser.test.ts`, "softens a diagonal edge and
  leaves every flat fragment byte-identical", `Error: Test timed out in 15000ms`.
  DIAGNOSED RATHER THAN ASSERTED, because a browser failure on a persistence
  round is exactly the shape that deserves suspicion. The test ran 19,231 ms
  against a 15,000 ms bound, a 28 percent overrun, on a machine whose load
  average was 117 at the time (a second session was saturating it). This round
  touches NO render code at all: `git diff --name-only` over the whole range
  matches nothing under `src/render/`, `src/game/`, or any shader, FXAA or grade
  path. Re-run ALONE on the same tree it passes, 2 tests, 449 ms of test time
  against the same 15,000 ms bound, a 34x margin. It is a contention timeout, not
  a regression.
- The two `.pg` suites, run BOTH WAYS at this tip to prove the arming rather than
  assert it: 34 passed with the variable set, the same 34 skipped with it unset.
- The browser step rewrote seven PNGs under `docs/screenshots/`, restored with
  `git checkout --` and NOT committed. The tree is clean.
- All 21 monolith rows measure EXACTLY at their ceilings with zero slack and none
  raised. `server/game.ts` 9907, `server/db.ts` 4605,
  `server/freehold_persist.ts` 2193, LOWERED four times across the round
  (2243 to 2228 to 2215 to 2210 to 2193) against eight extractions.
- No em dash, en dash or emoji on any line the round added, checked by a
  byte-level scan over the whole diff.

THE QUIET RUN WAS OWED AND HAS SINCE BEEN MADE. Run 4 above is it, and the gate
PASSES: the contention diagnosis is confirmed by the step passing rather than by
the argument for it. Nothing about the gate is outstanding.

AND THE VERDICT IS FAIL ON ITS OWN MERITS, independent of the gate. The store's
test harness still lets `serialize` and `liveRev` contradict `hasLive`. Part of
it is closed here and the general repair is a deliberate harness rewrite measured
at forty-plus cases. That is the next session's first work, and the honest prior
for whoever does it is the one this round earned: it found TWO new paths to the
one invariant, and its own repair for the first opened the second.

## ROUND SEVENTEEN: THE UNREVIEWED TAIL WAS READ, AND IT HAD DONE IT AGAIN

Six fresh lanes read `c8bb3d3f31..HEAD` with `5c7e3566ff` first, plus a
release-merge audit of the sync that had landed in between. The pattern holds at
SEVENTEEN for SEVENTEEN, and it held twice inside this round: the fresh read
found a NINTH path to the packet's one invariant, and the read of the fix for it
found that the fix write-blocked an account it should not have.

### THE SYNC HAD ALREADY HAPPENED, AND IT WAS NEVER GATED

The paragraph above says no sync was performed and that the next session owes it.
It had been performed: `d5e7f423c7`, merging `origin/release/v0.43.0` at
`b276778485`, made after that paragraph was written and recorded in no
`docs/freeholds/` file. `origin/release/v0.43.0` is still the version-newest
release branch (`git for-each-ref --sort=-v:refname`, which is exactly what
`resolveSelectBase` sorts by), so the base is correct; `v0.42.1` and `v0.42.2`
are later patch branches and not the integration base by the gate's own rule.

IT LEFT THE TREE RED. `tests/freehold_capture_contract.test.ts` hashes the 42
`sourceInputs` of `docs/screenshots/freehold-interiors-2026-09-08/acceptance.json`,
the merge changed three of those files, and `acceptance.json` is not in the merge
delta at all, so all three pins still equalled the branch parent's value:
`src/styles/components.css`, `src/styles/hud.mobile.css` and
`scripts/pr_shot_targets.mjs`. Re-minted at all FOUR occurrences, because the
script's digest appears twice (`sourceInputs` and the `producerInputs` filter) and
replacing one left the suite red.

THE CAPTURES WERE NOT RE-SHOT, and that judgement is recorded with its evidence
rather than asserted: every selector the two stylesheets changed is scoped to
`.corpse-harvest-btn`, `#harvest-preference-window`, `.harvest-preference-*` or
`.soc-*`, none of which appears in a freehold gate prompt or interior view, and
the script change is one ADDITIVE capture target (`guild-roster-expand`) that
alters no existing route. A release touching a selector these captures can reach
owes a re-shoot, not a re-hash.

WHAT ELSE THE MERGE AUDIT FOUND, and it is short. The committed i18n bundles are
FRESH against the merged catalogs, verified by regenerating both builds into a
scratch directory through their own `I18N_OUT_DIR` override and diffing (22 UI
locales plus the pseudo, the admin set, and the flat key union: no differing
files), so the merge reconciled them by regeneration rather than by taking a
side. All 21 monolith rows re-measure exactly on the merged tree with zero slack.
No shard or timing table is in the delta. One new `vi.mock('../server/db')` site
arrived with the release and passes on the merged tree. No legacy-arm divergence
and no un-re-bound injected helper; `npx tsc --noEmit` exits 0. THE MERGE TOUCHED
NO FREEHOLD PERSISTENCE CODE AT ALL: zero paths matching `freehold` or `housing`,
and exactly one `server/` file (`server/corpse_harvest_inspection.ts`), so the
code under review is exactly as round sixteen left it. One adjacent non-finding,
recorded so it is not re-investigated: five wiki titles present in the release
parent are absent from the merged seed, and that is NOT a merge drop, the merged
seed is byte-equal to a fresh generator run and those five dungeons carry
`guideVisible: false` in the release's own content.

### THE NINTH PATH, and the refusal that closed the eighth was not total either

- Q1 BLOCKING (identity). `classify`'s `unnamed_record` refusal reads the LIVE
  RECORD, so it can only fire once something has been SEEDED, and that made it
  depend on WHEN the load landed. The whole-preload budget refusal deliberately
  leaves its read in flight to fill the entry, and the handshake still has
  `acquireCharacterLease` and `getCharacter` to run below it, two database round
  trips on the same saturated pool that produced the overrun. The read lands in
  THAT window, before `bindFreeholdOnJoin` and so before `addPlayer` seeds
  anything: `livePlotId` answers null rather than the stand-in, the refusal
  cannot fire, the absent arm mints, and `installLoadedFreehold` then returns
  early on the budget hold while `ensureFreeholdRecord` seeds the stand-in a
  moment later. REPRODUCED against the real store, and reproduced independently
  by a second reader before it was told: entry `loaded` and unheld holding
  `plot:minted1`, a row INSERTED under that name, `write_failures` 0 and
  `quiesced` 0, while `applyWriteResult` caches the RECORD's stand-in, so
  `foreignIdentity` is `PENDING !== PENDING` and the seal's name comparison is
  inert BY VALUE EQUALITY for the life of that entry. The second reader carried
  it to the loss itself: a reseeded default at revision six written over the row
  with `layoutJson '[]'` and `trophiesJson '[]'`. That is the eighth path arrived
  at from a THIRD side, and both `server/freehold_write_seal.ts` and section 8a
  claimed `classify` had closed it totally.
  FIXED: the store now knows which loads its caller abandoned, so the two cases
  are one rule, mint only for a record this store can name.

- Q2 BLOCKING, and it is the fix for Q1 read fresh. Abandonment was recorded
  against the ACCOUNT, and `beginLoad` is single-flight per account: two
  characters of one account joining together ride ONE read, so if the first
  login overran, the second one's load was refused too and the account took a
  TERMINAL `unnamed_record` hold for its whole session with a live installer
  standing right there. Fail-safe rather than a lost row, and still a housing
  outage manufactured by the guard against one. FIXED: a waiter COUNT in
  `server/freehold_load_waiters.ts`, and classify refuses only when the LAST
  login has gone. Exact rather than conservative, because classify runs inside
  the load promise, before any surviving waiter's own race has resolved.

### THE TENTH PATH, AND THE FIX FOR THE NINTH IS WHAT OPENED IT

- Q20 BLOCKING (identity), found by the read of the fix round and REPRODUCED
  against the store. The sibling exemption Q2 added is the precondition. Two
  characters of one account ride ONE single-flight read, and `no_budget` is the
  ONLY kind that leaves a sibling with a clean answer, because every other hold
  goes through `holdResult` onto the shared entry and both installs then return
  early. So the sibling keeps the mint alive at classify; the REFUSED login
  reaches `addPlayer` FIRST, because it stopped waiting earlier and is therefore
  always ahead in the pipeline, and seeds the stand-in; and the sibling's own
  install, which would have named the record, is silently discarded by
  `loadFreehold`'s load-once guard (`if (ctx.freeholds.has(ownerKey)) return`).
  The entry is left `loaded`, unheld, `durableRev` null and holding `plot:minted1`
  while the live record carries the stand-in. Measured: a row INSERTED under
  `plot:minted1`, `write_failures` 0, `quiesced` 0, after which
  `applyWriteResult` caches the record's stand-in and `foreignIdentity` is
  `PENDING !== PENDING` for the life of that entry. The eighth path's terminal
  state, reached through the ninth path's own repair.

WHY THE LOAD-SIDE TEST CANNOT CLOSE IT, and the reason is general rather than
incidental: the fact it samples (is anyone still waiting) is not the fact that
matters (will an install actually reach the record). A waiter's install is
discarded whenever the abandoned login's own `addPlayer` seeds first, and the
abandoned login is ahead by construction. Any ordering test has this shape.

### THE WRITE-SIDE GUARD: NOW TAKEN, AND WHY IT WAS NOT SOONER

THE FIX IS `insertWouldMintAnUnnamedRow`: the FIRST row for an entry may only be
created for a record that already carries the identity that row will be created
under. Judged at the instant the row would be created, so no ordering can matter.
It is strictly additive to `seedWouldLandOnRealRow`, whose whole body sits behind
`entry.durableRev !== null`, so the two can never disagree about a document.

AND THE WAITER MACHINERY IS RETIRED RATHER THAN REPAIRED A THIRD TIME. Both of
its forms carried a defect (an account flag write-blocked a healthy sibling; a
waiter count opened Q20) and neither was ever sufficient. The load-side ordering
test keeps only its stand-in arm, which is cheaper and diagnoses better, and its
own comment now states plainly that it is NOT total and where totality lives.
`server/freehold_load_waiters.ts` and its suite are deleted; the store's ceiling
falls to 2193.

WHAT IT COST, and this is the reason the earlier round escalated it rather than
taking it. The guard refuses the first insert for any entry whose live record
carries the stand-in, and FIVE store-level seal cases built exactly that state to
reach `pristineSeed` and its content dimensions. That state is what the install
fix removed, and a separate reader found the same five modelling it
independently, so the cases are repaired rather than the guard weakened: each
carries the INSTALLED identity until its own reseed, as production does. The
consequence is honest and worth stating, because it is a real reduction in
defence in depth: `pristineSeed` and its layout, trophies, tier, condition and
visit-policy dimensions are now unreachable through the store for EVERY entry
class, not only for row-loaded ones. They remain driven decisively, with literals
and their own mutants, in `tests/server/freehold_write_seal.test.ts`, which needs
no store at all.

ONE MORE HARNESS DEFECT CAME OUT WITH IT. The default live identity was GLOBAL,
answering the last id minted by anyone, so a case driving two accounts handed the
first owner's record the second owner's identity, which no realm can produce and
which the new refusal correctly rejects. It is per owner now, attributed through
the account whose row read is in flight, which is exact because `classify` mints
between its own read and its own assignment.

### THE WRITE-SIDE GUARD AS IT WAS ESCALATED (superseded, kept for the record)

The order-independent statement of the same invariant is a WRITE-side refusal:
`entry.durableRev === null && persisted.plotId !== entry.plotId` means the first
row for this entry would be created under a name the record being written does
not carry, so refuse and quiesce. It was built, it closes Q1 regardless of
ordering, and a fresh reader attacked it for false positives and found none: on
every healthy path the install has already put `entry.plotId` INTO the record or
adopted the live record's identity, so the two are equal by construction, and the
next login heals it because `preload` replays that same minted `plotId` with
`state` and `durableRev` both null, which is `installLoadedFreehold`'s absent arm.

IT WAS NOT TAKEN AT FIRST, and the reason is a decision about what the seal is
FOR rather than a doubt about the guard. Q20 settled it: the cost below is real
and it is smaller than a tenth path. It refuses the FIRST insert for any entry whose
live record carries the stand-in, and that is the exact state five store-level
seal cases build, so it makes `pristineSeed` and its content dimensions
unreachable for every entry class rather than only for row-loaded ones. The
seal's own docblock says those arms exist precisely because the name comparison
is inert for a minted entry. Removing the last state in which they can fire is a
maintainer decision, and it is recorded here with the predicate, the evidence and
the cost so it can be taken deliberately rather than discovered.

### THE HARNESS MODELS A STATE THE SERVER CANNOT PRODUCE, AND IT IS OPEN

- Q3 BLOCKING, NOT FIXED, and it is why this round's verdict is what it is.
  Round sixteen's S7 bound `livePlotId` strictly to `hasLive` and recorded that
  "no case depends on a liveness state the server cannot produce". That is FALSE.
  Production derives all four liveness reads from ONE map and they are mutually
  equivalent (`hasLive`, `serialize() !== null`, `liveRev() !== null`,
  `livePlotId() !== null`), and the harness leaves `serialize` and `liveRev`
  unbound: with `hasLive` defaulting FALSE the loader is told no record is live
  while the writer is handed a document carrying that record's identity. FIVE
  seal cases declare a stand-in live identity over an absent row and then assert
  a first write lands, and `server/freehold_install.ts` is exactly what removes
  that state. The strict binding of round sixteen survives only because
  `livePlotId` is read at CLASSIFY time while `serialize` and `liveRev` are read
  at WRITE time, which is a property of which port is read when, not of the
  harness modelling one map.
  WHY IT IS NOT FIXED HERE, stated rather than waived. The faithful repair is a
  harness that models the two moments a login has, no record at preload and a
  record afterwards, and every shape of it was measured: binding `hasLive` to
  `serialize` sends every case down `preloadWithin`'s already-live arm and reds
  most of the suite, and binding `liveRev` strictly alone reds forty-plus cases,
  which is the blast radius the reader measured independently. That is a
  deliberate harness rewrite touching the cases that guard this packet's one
  invariant, and doing it at the end of a long round is precisely how fifteen of
  seventeen rounds have gone wrong. The compensation is real but partial: every
  arm of the seal is now driven decisively by literals in
  `tests/server/freehold_write_seal.test.ts`, which needs no harness at all.

### WHAT ELSE THE SIX LANES FOUND, all applied

- Q4 SHOULD-FIX (teardown). `revertOwnGuildBookOps` promised it never throws and
  that a faulting guild leaves the rest undone, and its try wrapped ONE of four
  statements. `index.resync` and the process-wide incident counter sink sit
  outside it, and the revert is now the FIRST statement of leave()'s `finally`,
  so a throw from either aborted the loop AND skipped both index drops, the
  outbox discard, the lease release and `removePlayer`: the round-fifteen
  character lockout reached through the round-sixteen fix for it. The guard
  covers the whole per-guild body now, with the three marks cleared above it so
  a guild is never revisited. Two cases drive it, one per statement, each
  asserting the guild AFTER the faulted one is still undone.
- Q5 SHOULD-FIX (tests). The teardown order pin asserted the revert above ONE of
  the two index drops while its own sentence claimed both, leaving the character
  map free to move above it.
- Q6 SHOULD-FIX (seal coverage). Four sub-expressions of the seal survived
  mutation in a suite whose comment claims each dimension is asserted on its own.
  THREE are real gaps and are closed with pairs that differ in exactly the
  conjunct under test: a stand-in record that has MOVED (a fresh account's tier
  grant at revision one) kills `persisted.rev === 0`, and a stand-in record
  carrying layout or trophies at revision zero kills the other two, which is the
  state the content arm exists for. The FOURTH is unkillable and is documented
  instead: under `pristineSeed` the document is at revision zero, so
  `entry.state.rev > 0` is exactly `revisionRegressed`, a separate disjunct of
  the same expression, and the dimension table's `rev` row passed through THAT
  disjunct, which is a case passing for the wrong reason under a comment
  promising the opposite.
- Q7 SHOULD-FIX (docs). DEPLOY.md stated the gauge caveat backwards. A TERMINAL
  hold is the one where `loaded` and `held` double-count an entry, because a data
  refusal leaves it loaded; a CAPACITY hold is the one that still sums. The doc
  named the summing case as the exception, so an operator read double-counted
  terminal holds as normal.
- Q8 SHOULD-FIX (docs). The C23 scope document claimed its two player groups line
  up exactly with the repairable and terminal split, which its own table eleven
  lines above falsifies: `unnamed_record` is terminal and reads as RETRY. An
  implementer deriving the player group from the runtime set would tell the one
  player a relog reliably helps that their home will not clear on its own.
- Q9 SHOULD-FIX (channel). The new refusal's detail literal was not in
  `KNOWN_DETAILS` while its sibling on the same arm was, so a later reader
  wrapping that arm for consistency would silently lose the diagnostic to
  `unclassified`. The totality pin enumerated only the shapes that are WRAPPED
  today, which is what let the asymmetry sit there; it covers every shape a
  server module emits now, wrapped or not.
- Q10 SHOULD-FIX (docs and source). Both said the `unnamed_record` refusal costs
  nothing. No durable ROW is lost, which is not the same thing: for an account
  with no row a capacity hold at login converts to a terminal one, so those
  owners furnish for a session and lose it at logout with a counter as the only
  observer. That is the population C23 exists for.
- Q11 SHOULD-FIX (activation gate). Every refusal answers a COLD hearth clock
  whose ready time is zero and the merge is forward-only, so a login slow enough
  to overrun its budget is handed a READY Hearth every time, which is the outcome
  `server/freehold_install.ts` argues its unconditional merge prevents. Recorded
  in section 8a as a sharper statement of the existing fail-open gate and
  corrected in the source comment. Pre-existing, not introduced this round.
- Q12 SHOULD-FIX (types). `FREEHOLD_TERMINAL_HOLD_KINDS` was `ReadonlySet<string>`,
  so the subtraction's guarantee rested on one assertion in the suite: a typo
  compiled clean and silently moved a DATA cause into the repairable group, which
  is re-reading an unreadable row on every login forever. Typed to the kind list
  now, and a typo fails compilation (measured).
- Q13 SHOULD-FIX (scan). THE EXTRACTIONS RE-OPENED THE STALE-LIST GAP the last
  round closed. The clock and timer scan hand-typed its file list, so a new
  sibling was unscanned while every listed file still existed and the
  anti-staleness floor read clean. Derived from the store's own imports now, with
  the derivation itself pinned. The by-path importer list in
  `src/sim/freehold/CLAUDE.md` was stale against THREE importers that three
  separate extractions added, and is pinned by a derived test.
- Q14 NITS, all applied: the wrapper's guild-book caller census named the
  fence-out, which calls the module directly with the ids it carried, and omitted
  the growth-limit quarantine; the takeover comment described a lifetime lockout
  for what is a transient; an em dash on the same line; the load-failure
  counter's help text, which is the string an operator reads in Prometheus, still
  enumerated four responses for nine kinds; the contract carried a count of eight
  against its own nine; the interiors evidence record claimed 31 source inputs
  against a record carrying 42; the seal's pristine fixture spelled the sim's
  default tier, condition, visit policy and revision as literals instead of
  deriving them, so its totality claim would stop tracking the shape it is total
  over.

### THE SIXTH RUNTIME PROOF, SETTLED

`phase-07-qa.md` records C4's pin as STILL OWED. IT LANDED at `4648c4b1e6`,
before the rulings round, as "stops owing a write that has no record and no
capture, instead of re-arming forever": it drives the ports directly, asserts the
write reaches its permit and issues no statement, asserts the entry STOPS being
dirty so no later sweep re-arms it, and asserts the entry is collected. The row
is corrected rather than amended.

WHAT WAS ACTUALLY OWED is the other half of C4, whether any production sequence
reaches that arm, and the answer is NO in this release. The argument, enumerated
so it can be attacked rather than trusted:
1. Dirtiness has exactly TWO producers. `markDirty` has no production caller (a
   whole-tree grep over `server/`, `src/`, `headless/` and `bot/` finds only the
   unrelated mail index and editor methods of the same name), and
   `noteRevisionMoved` returns false when `liveRev` is null, so it cannot dirty
   an entry with no record.
2. An entry can therefore only become dirty while a live record exists.
3. The record is dropped only by `releaseFreeholdOnLeave`, reached only from
   `sim.removePlayer`, which has exactly TWO call sites, and both are preceded on
   the same path by a `flushAndRelease` for the same owner key: the leave path
   awaits `flushFreeholdBinding`, which cannot reject, and the join-failure path
   fires `releaseFreeholdBinding`, whose `flushAndRelease` runs synchronously
   past its capture before the first await.
4. `flushAndRelease` captures `ports.serialize(ownerKey)` while the record is
   still live for any entry that is unblocked and owes a write.
5. A capture is released only through `releaseCapture`, at three sites, each
   gated on `!owesWork(entry)`, and `owesWork` includes `isDirty && !blocked`, so
   a dirty unblocked entry never loses its capture.
6. A dirty BLOCKED entry cannot reach the arm at all: `runWrite` re-checks
   `blocked(entry)` after the queue wait and returns before sampling.
The arm is a bound on a state the furnishing writer will make reachable, exactly
as its own comment says, and the pin is the right shape for that.

### AND THIS ROUND'S OWN FIX ROUND WAS READ, WHICH IS WHERE THREE MORE CAME FROM

A seventh lane read `d5e7f423c7..HEAD` on the standing assumption that a fix
round is unreviewed code. It found four defects and THREE OF THEM WERE IN THE
FIXES FOR THE OTHER LANES' FINDINGS, which is the pattern one level down: not
"the round introduced a defect" but "the round's repairs each narrowed what they
replaced".

- Q15 SHOULD-FIX. The clock and timer scan was re-derived FROM THE STORE'S
  IMPORTS, and that is the stale-list trap one level down: it silently dropped
  `server/freehold_install.ts`, which performs the hearth-clock merge and is
  precisely where a `Date.now` is a behaviour bug, and which THIS ROUND EDITED,
  plus `server/freehold_persist_registry.ts`. Both were on the hand-typed list it
  replaced. An import-derived list also cannot see a module extracted from a
  SIBLING rather than from the store, which is reachable the moment the
  load-outcome module splits again. Derived from the DIRECTORY now, with the
  composition root excluded as a named decision (binding `Date.now` to the
  store's `nowMs` port is its whole job) and both dropped files pinned by name.
- Q16 SHOULD-FIX, and it is TWO defects in one pin. The by-path importer pin
  checked file NAMES and never the leaf lists beside them, so the same commit
  that added it credited the store with a `types.ts` import it does not have (the
  claim was true when written and the round's own orphaned-import cleanup
  falsified it). Worse, the first repair for that was ITSELF VACUOUS: it searched
  the WHOLE guide, found each file's earliest mention, which is ordinary prose
  hundreds of characters from any list, and skipped every importer as list-less,
  so it passed over exactly the claim it was written for. Scoped to the exception
  paragraph now, with a count of how many lists it actually compared, and killed
  by mutants in BOTH directions: a leaf credited but not imported, and a leaf
  imported but omitted.
- Q17 SHOULD-FIX. The guild-book incident counter sat ABOVE the revert inside the
  widened try, with the ops log already deleted above the guard, so the faulting
  sink the round's OWN new case installs discarded that guild's money revert
  permanently. Only one of the two can be lost there and the money is not it: the
  revert runs first, and the two cases assert each site's real outcome rather
  than one shared answer.
- Q18 NIT. The waiter registry's header claimed `abandoned` false means an
  install is left. What it knows is that NOBODY IS WAITING, which is narrower:
  `retain`'s lost-entry repair waits there too and discards its own result.
  Counting it is still correct, because that repair runs on a join whose next
  replay installs the entry's identity, and the narrower claim is what is
  written now.
- Q19 REFUTED, and judged here rather than dropped. "The round's two new modules
  ship with no tests in the commit", read off `git status` as untracked. They are
  tracked, at `2f71cdf9ee`; the lane started before that commit and read the
  pre-commit tree. Recorded because a refuted finding from a reader this useful
  is worth the line.

WHAT THAT LANE COULD NOT BREAK, listed so nobody pays for it twice: the waiter
count across every exit of `preload` (the uncapped fallback, a throwing
scheduler, two accounts, the drain, a throwing owner key), which floors and
deletes at zero so the map cannot grow; the five extracted functions as
field-for-field moves with no dropped counter and no changed default; the three
new seal cases, each reaching the conjunct its comment names and no other; and
the typed terminal set, which is a real compile error because the kind list is
`as const`.

### AND THE TENTH PATH'S FIX WAS READ TOO, WHICH IS WHERE THE LAST FOUR CAME FROM

An eighth lane read `0077f6018f` and what followed it. IT FOUND NO ELEVENTH PATH
and no healthy account write-blocked by the new refusal, which is the first time
in this ledger a reader has come back from the store's identity logic with
neither. What it did find is four claims the round made that the code does not
support, three of them about the round's own repairs.

- Q21 SHOULD-FIX. THREE of the five repaired seal cases refuse through the
  IDENTITY arm now, not the arms their comments name. Once the record carries its
  installed name, `applyWriteResult` caches that name, so a reseeded default
  differs by name and `foreignIdentity` short-circuits everything after it.
  Measured against the real predicate with BOTH continuity arms neutralised. The
  two anti-vacuity cases were worse than mislabelled: one claimed a record
  identical to a pristine seed while its own fixture makes `standInSeed` false,
  and the other was titled for a stand-in record it no longer carries. All five
  are renamed and re-commented to the outcome they still prove, each pointing at
  the seal's own suite for the dimension it used to claim.
- Q22 SHOULD-FIX. The seal's own justification for keeping the pristine arm was
  false in the same way, and it contradicted this ledger: it said the arm is dead
  for a ROW-LOADED entry but the only thing standing for an entry that MINTED its
  own row, where the name comparison cannot fire at all. Both halves are the same
  half now. The file says so, and the dangling "see the OPEN GATE below" goes
  with it.
- Q23 NIT. The per-owner mint attribution is exact for SEQUENTIAL loads only. One
  variable set when a read starts and read when the mint happens would
  misattribute across two overlapping accounts, which is the defect it replaced
  one level up. Unreachable by any case today, and stated rather than closed.
- Q24 SHOULD-FIX, and it is a correction to this round's own new pin. The insert
  refusal costs one LOGOUT, not one session. The poisoned record is evicted by
  `removePlayer` only when the LAST session sharing the owner key leaves, so
  while a sibling character is still online the record outlives the entry and
  each new login's classify sees the stand-in and takes the terminal hold again.
  Bounded either way, never unbounded, and the weaker claim is the true one. The
  case also drove its leave in the reverse of production order, which was
  harmless here and is corrected.

### THE MUTATION PASS

Every guard added or changed was mutated on disk, its owning suite run, the RED
confirmed, and the file restored by plain file write with the green
re-confirmed. Each pass ran against a no-op control first and the control's full
`Tests N passed (N)` line is quoted.

- The ordering refusal, first form (an account flag), four mutants, control
  `Tests 209 passed (209)`, ALL KILLED: the abandoned arm dropped (1 failed), the
  stand-in arm dropped (1), the mark never set (1), the mark never cleared (1). A
  fifth, `abandoned` forced true, killed 46.
- The ordering refusal, SECOND form (the waiter count), six mutants, control
  `Tests 210 passed (210)`, ALL KILLED: the abandoned arm dropped (1), the
  stand-in arm dropped (1), `abandoned` forced true (47), the waiter never
  registered (47), the waiter never released (1), and the count's own predicate
  forced false (1). Both directions, because a one-way pin here is satisfied by a
  constant.
- The guild-book revert, one mutant, control `Tests 48 passed (48)`, KILLED:
  narrowing the try back to the sim call alone (1).
- The by-path importer pin, one mutant, control `Tests 48 passed (48)`, KILLED:
  one importer name removed from the guide (1).
- The seal, four mutants over its own suite plus the store's, control
  `Tests 220 passed (220)`, THREE KILLED AND ONE SURVIVING BY CONSTRUCTION:
  `persisted.rev === 0` dropped (survived before the new cases, 1 failed after),
  the layout conjunct dropped (survived, then 1), the trophies conjunct dropped
  (survived, then 1), and `entry.state.rev > 0` dropped (SURVIVES, and is the
  absorbed dimension recorded above rather than a gap left open).
- A type mutant rather than a test mutant, for Q12: a one-character typo in the
  terminal set now fails `npx tsc --noEmit`, measured both ways.
- The directory-derived clock scan, one mutant, KILLED: narrowing the filter back
  to the store file alone reds on the named `server/freehold_install.ts`.
- The by-path leaf pin, two mutants, BOTH KILLED: crediting the store with a
  `types.ts` it does not import (1 failed), and omitting a `state.ts` it does
  (1 failed). Both directions, because a one-way pin here is satisfied by an
  empty list, which is how its first cut passed.
- The INSERT refusal, three mutants against a proved control of
  `Tests 224 passed (224)`: the guard disabled (2 failed, the ninth and tenth
  path pins), the predicate inverted so it admits a mismatch and refuses a match
  (37 failed), and the `durableRev === null` gate dropped, which SURVIVES. That
  survivor is absorbed rather than a gap and is recorded in the source: once a
  row exists the seal reaches the same verdict by a different field, and the only
  way the two could disagree is the state this arm stops from ever getting a row.
- The load-side stand-in arm, one mutant, KILLED (1 failed), so retiring the
  waiter machinery did not leave it unpinned.

## THE RELEASE/V0.44.0 SYNC, 2026-09-22, AND WHAT IT LEFT OWED

Merge `ffa7ac5ffb` takes `origin/release/v0.44.0` at `56525e0343` (877 commits; 221
files changed on both sides, 80 conflicted). Every conflict was resolved by hand against
both parents; i18n, wiki and MediaWiki artifacts were regenerated; the terrain corpus was
re-minted with the release body kept byte for byte and this packet's 811-record tail
byte-identical; the Eastbrook polish provenance was re-minted by its own script. Two
double extractions collapsed onto the release's module (client perf rows, `anchorFields`).

THE AUDIT: five fresh read-only lanes (sim/render/net; UI/scripts/docs; server with its
endpoints, bindings and plan premises; auto-merged test pins; a re-read of every hand
resolution). Applied in the merge: the furnishing guards ported onto the release's
`auto_equip.ts` and `nearby_interaction_core.ts`, and mirrored onto its new paths (the
Sales History quality frame on both hosts, the sell-confirm threshold, the chat link and
Exchange loot-quality badges, the vendor role classifier, `perfectedLineBudgets`, the
party-trade def gate on the furnishing card); the Who tab keeps `freehold` (with a
compile-time exhaustiveness check) and serves the RELAY zone realm-wide; the join tail's
relic key walk now runs inside its own guard (`reconcileJoinedAccountRelics`); the gate
prompt tabs moved onto the library `.ui-tab` primitive; every stale pin re-measured on the
merged tree, each against the release commit that moved it.

REVIEWED, NO CHANGE, WITH THE REASON: the Sales History quality FILTER matches the stored
column (unreachable, every furnishing listing is stamped at creation and none has
shipped); the map Dungeons filter does not hide the gate (it is a navigation marker like
the release's delve and rift entrances); the loot window, loot roll, vault and rift forge
badge reads (a furnishing never drops as loot and cannot enter the vault or forge); the
release GameServer db mocks lack `runWithStatementTimeout` (no test reaches it today).

OWED, IN ORDER, FOR THE NEXT SESSION:
1. MOVE THE GATE (ruled 2026-09-22). The release moved Apothecary Lin 4.24 yd from the gate
   at (-14,-92), and the interact ladder ranks objects above NPCs, so on a lit host the gate
   steals Lin's press. Chosen site (-28,-82): 12.4 yd from the nearest NPC (clear of the
   gate's 5 yd reach plus the 6 yd NPC reach), about 12 yd from the Eastbrook Inn, flat, dry,
   off roads, with the drop (-28,-86) unblocked and zero depenetration on seeds 1, 7, 42,
   99, 1032, 1337. The single source is `EASTBROOK_LAYOUT.services.freeholdGate`; the literal
   (-14,-92)/(-14,-96) sites are `tests/freehold_dungeon_defs.test.ts` (94, 110, 270),
   `tests/freehold_instance.test.ts:622`, `tests/freehold_instance_online.test.ts:76`,
   `tests/server/freehold_wire.test.ts` (705, 1055) and `tests/parity/scenarios.ts`
   (3229, 3241). Add a clearance pin (every NPC over 11 yd from the gate). Re-mint the
   `freehold_claim` golden, the terrain tail (prove the prefix and 811 again, then validate
   on Linux in Docker), and the Eastbrook polish provenance (`eastbrook_layout.ts` is an input).
2. RE-HASH THE CAPTURE FINGERPRINTS (ruled 2026-09-22) in
   `docs/screenshots/freehold-interiors-2026-09-08/acceptance.json`, after the gate move,
   and record in `docs/freeholds/interiors-implementation-evidence.md` that the captures
   predate the v0.44.0 restyle, the gate tabs change and the gate move, so a RE-SHOOT IS
   OWED before this evidence is relied on.
3. Re-run `node scripts/ci_shard_weights_harvest.mjs --carry-local-missing --runs 3` on a
   quiet machine (coverage 0.897 against the 0.918 floor; it refuses while any suite is
   red, which is why it stopped at the capture contract) and commit the table alone.
4. The armed gate, then `npm run ci:changed` after the LAST commit.
5. Rulings or plans still open: `Sim.addPlayer` is not atomic and the release widened it
   (`seedAccountLedgerSelf` runs after `addEntity` and the freehold seed, and the join's
   catch only releases the binding); the release's account ledger is cross-realm, so a
   character on a dark realm (D85) can show Hearth relics and earn cosmetic Reliquary deeds
   from lit-realm finds; phase 17 needs its re-plan onto the ledger (recorded there and in
   D48).

## THE OWED LIST WORKED THROUGH, 2026-09-22 TO 23: THE GATE MOVE, THE RE-SHOOT, THE GATE

Everything the previous section left owed is either DONE below or named in the open list at
the end of this section. Commits `190329610f..HEAD`, all local.

### A SECOND SYNC FIRST

`release/v0.44.0` moved on by five commits (the craft-roll audit, PR #4165) after
`ffa7ac5ffb`, so merge `190329610f` takes it at `fc86d90234`. Two conflicts, both unions:
the account export keeps both the housing loaders and the new craft-roll read, and the
monolith rows take the exact merged counts, `server/game.ts` at 9776 and `server/db.ts`
at 4530. The db.ts row RISES from this branch's 4513 by the release's own +17 (its
craft-roll export read), and stays under the release's own 4641 pin; it is recorded here
because a ceiling that moves up is a maintainer's call to see.

### THE GATE MOVED FOUR TIMES, AND WHY THE RULED SITE WAS NOT THE LAST

The ruled site `(-28,-82)` cleared every NPC by 12.37 yd, but stood 4.47 and 5.00 yd
from two garden beds, and the press ladder ranks objects above beds, so it took their
press (`742523fbc4`). `(-37,-103.5)` then passed every press but dropped a leaving
player 1.17 yd from a house corner and cleared the road and a streetlamp by a hair.
`(-39,-104)` added real margins and landed a leaving player 0.25 yd OUTSIDE the
Eastbrook town circle, where Town Focus refuses. The gate now stands at
`(-38.65,-103.75)`, facing 0, with its drop 4 yd south at `(-38.65,-107.75)` through
`DUNGEON_DOOR_RETURN_INSET`, both in town. `docs/freeholds/content-numbers-workbook.md`
separates the rules into RULED (the NPC press), ENFORCED (every press rung, dry flat
ground on all eight seeds, the town circle) and CHOSEN (three margins picked for this
site: drop to building 2 yd, drop to road 5.5 yd, 3.5 yd of collider-free ground). Without
the chosen margins `(-37,-103.5)` would stand nearer the ruled point; FERNANDO, that is
the one place this move went past the ruling's letter, and it is his to confirm.
`tests/freehold_gate_clearance.test.ts` pins every rule through the real ladder, the real
colliders (measured two ways, because `isBlocked` reads one cell and is complete only to
0.8 yd, and squares an OBB's corners) and the real leave and rejoin points.

Each move re-minted the `freehold_claim` golden (only position-derived fields, the POI
visit marks and, after the copy change, the events digest moved; ticks, draws and the draw
digest are byte-identical), the terrain corpus tail (the 152,181-record body
byte-identical, the tail still 811 records, only its 50 door-stencil records changed,
validated on Linux aarch64 AND, at the end, on Linux x86_64 glibc 2.36 in
`node:26-bookworm`: 2 of 2) and the Eastbrook polish provenance by its own script.

### THE GATE DID NOT DRAW ON A LIT HOST, AND FOUR RENDER RULES WERE WHY

Found only because the re-shoot looked at the frames: the arch spawns
`lootable:false`, and the per-frame object visibility gate hid every non-lootable object
outside the delve, rift and battleground families (`7e49b9fec1`); a direct pick dropped
the whole hit list on it, and dropped it again when an ordinary prop stood behind it
(`02661857ed`, `9f65cfad2a`); the view pool ranked it last, behind every town NPC within
45 yd, though every leave lands 4 yd from it (`02661857ed`, then `c9b15ef50d`: the
mailbox and noticeboard landmark path); and town grass tufts grew through its plinths
(`7afac8b0c1`), with the clearing then limited to hosts that light freeholds
(`1c17e99834`). Each rule has an exact-template arm pinned against the entity the real
bootstrap spawns, and an online case drives the server's wire through the client mirror.

### THE PROMPT'S TABS WEAR THE LIBRARY LOOK

A later-layer gate rule in `src/styles/components.css` still painted the selected tab gold
with an underline over the `.ui-tab` primitive the sync moved the tabs onto. It is removed
and `tests/freehold_gate_prompt.test.ts` holds the tabs on the primitive with no local
selected rule and the 40 px floor.

### THE LEAVE LINES SAID QUAY

Both rooms' leave lines still said the player steps back onto the quay. The English and its
five non-Latin fills now say town, the resolved tables are regenerated, and the golden's
events digest follows.

### THE RE-SHOOT, AND WHAT IT CAUGHT IN ITS OWN HARNESS

All 18 images, both producer manifests and the performance record were re-shot on
2026-09-23, TWICE: first at `ba8460e32f` (`aadff20b9f`), then, because the review rounds
below changed sealed inputs, again at `1c536218af` (`8618300332`), which is the record
now. The receipt seals 67 source inputs, 17 of them harness files (the harness's whole
local import closure, derived and pinned). Every image was read by eye, both times. The
trees, stances, cameras, diagnostics and counters are in
`docs/freeholds/interiors-implementation-evidence.md`, last section. The harness grew a
receipt that refuses a frame on every conjunct it checks (each with its own refusal row
and near miss), a raycast probe that meets the arch's own mesh at three points with
nothing in front, a DOM census (controls on top, focus, transient HUD and arrival
overlays), and one shared greeting-decline selector with a scan over `scripts/` (the old
entry pass clicked a greeting's first button, which ACCEPTED the ferry guidance note).

Harness defects the capture exposed, each fixed test-first: dismissals after the prompt
opened took its focus; the chase camera could open a frame swung round in front of the
player (a walk-out retry failed at a software frame rate because `camera_follow.ts` caps
automatic yaw per frame, a W+S hold hit the sim's zero-vector path, and the settle now
holds Turn Left + Turn Right in one page task and refuses under Mouse Camera, mouselook or
attack-move); a leave carried the player past the gate's reach before the reopening press;
and the Cottage switch raced its own keystrokes under load (the perf tour failed that way
twice before the fix).

### THE COVERAGE REVIEW, AND TWO FIX ROUNDS READ FRESH

Four fresh COVERAGE reviewers read `190329610f..551e6493be`: qa-checklist,
test-coverage-auditor, frontend-seam-reviewer and a fresh general reviewer. None
found a blocking defect. Their should-fix findings: the capture seal missed
inputs that change the frames (six harness scripts the capture loads, the grass
ring's own file, the gate's spawn and press path, the offline host flag and the
chase camera); the gate prompt's selected tab lost its only non-color cue under
forced colors; the receipt's second baseline check and its placement check were
reached by no test; a gate frame off the stance along z alone was accepted
(stance z-term mutant survived); and the evidence doc and this packet's rows
carried claims the committed records contradict. ONE finding was refuted: the
frontend lane said nothing drives the online mirror through the gate's draw and
pick cores, but `tests/server/freehold_wire.test.ts` does, from the server's own
wire.

Applied in `9a7c42a8aa..7b6e10ba35`, each mutation-checked: every bloom now keeps
out of the town grass exclusions (a new behavioural suite found two meadow
flowers inside the gate's circle on a lit host, which the old tuft-only check
could not see); a forced-colors underline for the library's selected tab; the
probe must meet the arch's own mesh at each point; the seal derives and covers
the harness import closure and holds every baseline frame to the stance (the
dead overworld conjunct went with it); the camera settle checks the key
bindings; the perf tour checks the stretch from the gate's reveal to the inn
entry and fails the leave window closed; the census refuses an arrival overlay
landing after the last settle pass; the capture target follows the files that
decide the grass and the press; and the clearance, turn-pair, hello-flag and
importer pins. The two recorded sealed-comment nits were carried in the same
round, and two pre-existing em dashes in `src/game/interactions.ts` (now sealed)
were removed.

A fresh reader of THAT round found no blocking defect and nine findings, all
applied in `004049c1ce..e6df007602`: the settle read only the first held action
on a key, so a layout that also bound A to a strafe passed (it now requires each
key to drive exactly one held action, over a list pinned to the bind table); the
receipt comment claimed a check its notice equality cannot make (reworded: the
gate frame's focus check is what refuses a dismissal after the press); the
running-realm NPC case asserted movement that does not happen (it now pins the
measured closest spawn exactly); the Evergarden bed pass was the one bloom pass
left unchecked; every bloom read all 124 exclusions (each chunk now tests its
own exact short list); the forced-colors cue is now proved from the computed
style in Chromium; a stale comment, the `when` list's stated purpose, and an
optimistic hello-test comment.

A third fresh reader, of THAT round, found the one real defect in it: the chunk short
list reached 3 yd, but a four-rep bloom strays up to 2.65 yd on each axis, 3.75 on the
diagonal, so a corner bloom could miss an exclusion the list had dropped (latent: zero
disagreements measured over the built-in world), and nothing pinned the reach. Fixed in
`77afa71a35` by removing the dependency rather than tuning the number: a point beyond the
reach reads the whole list, so the test is exact everywhere and the reach sets only
speed. The same reader corrected four comments that claimed more than their checks
(`1c536218af`). A fourth, final reader proved the exactness (the containment bound for a
turned box, both boundary comparisons, one million randomized points with zero
mismatches) and found only comment nits and one uncovered boundary, all applied in
`01518e8eaf`; its should-fix, a test comment citing this ledger for the reconnect grass
limit before this ledger recorded it, is closed by the RECORDED section below.

Every fix in the three rounds was mutation-checked; the survivors each earned a case
(the stance z-term, an in-reach reopen, the anchored-bloom padding band, the importer
comment strip, a turned box's padded corner, the always-whole-list fast path and the
point-side threshold), and each then died.

### THE MEASUREMENTS

- The capture: 18 frames and the performance record, final set `8618300332`, every
  number in `docs/freeholds/interiors-implementation-evidence.md` (last section).
- The terrain corpus tail: 2 of 2 on Linux x86_64 glibc 2.36 (`node:26-bookworm` under
  `--platform linux/amd64`), beside the aarch64 run each re-mint recorded.
- The shard weights: 474 unmeasured test files carried at the median of three local runs armed against Postgres (`7cf74b411d`; table coverage 1.0, 4,538 of 4,538, against the 0.918 floor).
- The gate: the armed `node scripts/gate_select.mjs` runs on the tree that records this section; its outcome is the next entry.

### RECORDED, NOT APPLIED, EACH WITH ITS REASON

Kept out of the capture seal, by the rule the `when` list now states (the seal is
the curated inputs that decide what the committed frames show): `src/game/input.ts`,
`src/game/keybinds.ts` and `src/sim/player_motion.ts` decide only whether the camera
settle can run, and the settle refuses unless its preconditions hold while every
frame's record proves its outcome (stance, facing, camera); `src/sim/data.ts` merges
the gate site, which is sealed at its source (`src/sim/eastbrook_layout.ts`) and
whose merge `tests/freehold_layouts.test.ts` pins. Sealing those large, churning
files would mark the evidence stale at nearly every release for no frame change.

Measured, not enforced: the reveal soft-deadline and submit-stop counters did not
move in either first-draw window, but the perf check enforces only live-program,
attach-watchdog, gate-timeout, reveal-watchdog and touch-unproven; adding the two
would harden a software-renderer tour without a ruling. touch-unproven already
stands at 1 before the window on both profiles, so the check proves no NEW one.

Known limits, stated where they live: the procedural arch fallback's passage
triangulates filled (the browser draws the GLB; the probe and the grass circle
are measured against it), and on that fallback a click through the arch now picks
the gate, since the gate became pickable; the blade-grass carpet above the medium
tier is not cleared; the grass ring is built once per renderer, so a reconnect
whose hello flips the freeholds flag does not rebuild it (the next renderer
reads it right); the no-parallel-compile residual and the landmark entry cost on
constrained devices are unmeasured; the SwiftShader capture is visibility
evidence, not GPU cost; the polish seal does not include the visibility or
foliage cores; `door_portal`'s material name is untested; the golden lost its
POI visit marks because the drop lies outside both visit radii; the gate's tabs
sit on the library look without a `.ui-panel` under them, so their open bottom
edge floats (cosmetic, visible in the frames); `delve_interactable_visibility_core`
now decides visibility for every object view, not only delve ones (a rename is a
follow-up across its importers); the Evergarden bed pass's exclusion check is
latent (no shipped exclusion overlaps a garden bed, so no test can fail on its
revert; a source pin holds it); an older client shows the new leave line in
English until it updates (deploy timing).

Pre-existing or out of scope: `saved_pos_exit`'s `leaveOffset` bug in other
dungeons; the literal `'freehold_gate'` in UI modules this packet did not touch.

History, not fixable in place: some commits in the range are red between (the
committed-evidence pin is red from each sealed-input change until the next
receipt; bisect across them with care). Commit bodies that overclaimed or
mislabelled are corrected here rather than rewritten: `ca325559eb`, `5cc9d3986b`,
`742523fbc4` (counted two garden beds where four stood within the 10 yd sum),
`2e31fbb91b` (type), `d69ce0fd43`, `a11c1446ad`, `1ef85c2d3c`, `ba8460e32f`,
`004049c1ce` ("answers exactly" held only within 3 yd until `77afa71a35`), and
`c162e730be` (the shared-key layout it says walked cannot be held by the shipped
bind table; the check is hardening against a foreign store).

### STILL OPEN, IN ORDER

1. THE 07 HARNESS-FIDELITY REWRITE, which is why 07's QA verdict is still FAIL: the store's
   test harness lets `serialize` and `liveRev` contradict `hasLive`, so cases can model a
   liveness state the server cannot produce (ROUND SEVENTEEN).
2. `Sim.addPlayer` is not atomic, and the release widened it: `seedAccountLedgerSelf`
   runs after `addEntity` and the freehold seed, and the join's catch only releases the
   binding.
3. The release's account ledger is cross-realm, so a character on a dark realm (D85) can
   show Hearth relics and earn cosmetic Reliquary deeds from lit-realm finds: a ruling.
4. Phase 17 needs its re-plan onto the account ledger (recorded in `phase-17-trophies.md`
   and D48).
5. A new release sync, if `release/**` moves again.
6. FERNANDO: confirm the chosen margins that placed the gate at `(-38.65,-103.75)` rather
   than the nearer `(-37,-103.5)`.
