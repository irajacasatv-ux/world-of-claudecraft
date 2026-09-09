# 07 findings ledger (every finding, every reviewer, applied or ruled)

Status key: OPEN / FIXED / RULED (reviewed, no change warranted, with the reason).

## BLOCKING

- B1 byte ceiling enforced against two DIFFERENT measurements, and no save-path check.
  (migration). Independently re-measured against PostgreSQL 16: the published maximal legal
  fixture is 98,734 bytes of canonical JSON and 584,380 bytes of jsonb text, a 5.9x gap, because
  jsonb renders numbers as `numeric` in full positional form (a subnormal costs 326 bytes).
  Fix: (a) a CODEC rule in normalizeFreehold refusing any number whose JSON text carries an
  exponent, which is exactly the condition that makes the two renderings agree; (b) a save-path
  byte refusal so writable implies readable; (c) a separate MEASURED storage guard for the SQL
  side; (d) a real-PG round trip of the maximal legal fixture through the actual read.  OPEN
- B2 the one wire that carries the durable record from ws_auth into game.join has NO test; a
  mutant deleting `freehold,` from the join meta left 168 tests green. (tests)  OPEN

## SHOULD-FIX

- S1  schema_version is never written, so the forward-version arm is inert. (migration, security)
- S2  the leave flush uses a weaker dirty test than the sweep, so a last-window edit is lost. (migration)
- S3  contract section 7's "two-layer" enforcement claim is false in both halves. (migration)
- S4  contract section 4's "refuses before deep allocation" is false for the sim layer. (migration)
- S5  contract section 4 attributes `unadmitted` to a forward schema_version. (migration)
- S6  the plot_id charset CHECK is a policy frozen inline where it can never be relaxed. (migration)
- S7  installLoadedFreehold discards the durable Hearth clock whenever the plot is held or absent. (architecture)
- S8  preload's replay arm tests `hold === null` instead of `blocked()`, so a quiesced entry
      replays a stale house as if it were current. (architecture, security)
- S9  load_report.ts has no production caller; the server hand-builds and logs its own details,
      and the contract claims the opposite. (architecture, security)
- S10 FREEHOLD_VISIT_POLICIES duplicates the union with no compile-time link and no pin. (architecture, tests)
- S11 a server module is now a second writer of ctx.freeholdKeyReadyAtMs, against the sim's own
      stated rule, and the forward-only merge is implemented twice. (architecture)
- S12 a preload whose handshake then fails leaks its store entry for the process lifetime. (security)
- S13 the hasLive short circuit can mint a permanently write-blocked entry, silently discarding a
      whole session of edits. (security)
- S14 the development tier grant becomes DURABLE for the first time and nothing says so. (security)
- S16 the account-export pin reads RAW source, so a commented-out loader keeps it green. (tests)
- S17 the new WOC_FREEHOLD_PERSIST gauge family has no test. (tests)
- S18 the documented backwards-revision arm of noteRevisionMoved is untested. (tests)
- S19 the INSERT column list is unpinned in the always-on tier. (tests)

## NITS

- N1  a non-numeric version slips past the forward-version arm. (migration)
- N2  `rev: Number(row.wireRev)` narrows a bigint one layer above the boundary that forbids it. (migration, security)
- N3  ABSENT_HEARTH_REVISION is used for a plot hold's durableRev. (migration, architecture, security, tests)
- N4  a fractional condition clamps without rounding, so the loader and the writer disagree. (migration)
- N5  placementId and plinth have no magnitude bound. (migration)  [subsumed by B1's codec rule]
- N6  a plot_id unique violation is not diagnosed by upsertFreehold. (migration, security)
- N7  the deliberate empty-id admission has no fixture. (tests)
- N8  the unserializable arm of persistedFreeholdBytes is untested. (tests)
- N9  the drainWaiters Set's stated concurrency reason is untested. (tests)
- N10 the synchronous enqueue-throw catch arm is untested. (tests)
- N11 oldestDirtyAgeMs's "oldest" semantics is unpinned (every test has one dirty entry). (tests)
- N12 requireUpsertInput does not bound the two lengths the DDL CHECKs. (security)
- N13 a thrown database error does not quiesce, so the sweep can retry it forever. (security)
- N14 an internal account id reaches a hearth console line. (security)
- N15 the barrel gains 15 names with one barrel consumer. (architecture)
- N16 plotId is presentation-only and must never gate sim behavior; say so. (architecture)
- N17 the join-path retain is not inside a try/finally. (architecture)
- N18 advanceFreeholdHearthOnClient has no production caller; the contract's capability wording
      should carry a marker. (architecture, security)
- N19 meta.freehold is read off a spread bag with no structural guard (hardening note). (security)
- N20 a write-blocked hold is invisible to the player; record the future surface. (frontend)
