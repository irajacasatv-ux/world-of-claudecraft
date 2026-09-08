# Privacy and security COVERAGE review

Historical initial review of `6540713541..67281f8ed4`, by `/root/security`
(`woc_security`). The read-only reviewer returned this report inline; the
coordinator retained it and this copy expands compressed prose. No tests, gate,
database commands or external actions were executed by the reviewer.
See [current dispositions](../findings.md) and [executed checks](../execution.md).

Zero unique findings, one independently verified duplicate CP01, and no unresolved
uncertain candidate were reported. CP01 is a feedback contract defect, not an
authentication bypass or jail escape.

## Scope and duplicate

The review covered 334 paths, scanned 126,919 added text lines across 314 text
files for credential patterns and forbidden simulation clocks/randomness, and
examined 955 security-relevant added lines. Detailed review included server gate,
key, context, claims, items, configuration, state, client sequence, admin, presence,
telemetry, capture/provenance and tests.

CP01: jailed `freehold_enter` returned housing reason `no_freehold`; jailed
`use` with `item: 'hearth_key'` was correctly blocked but fell through to generic
jail text. The shared context guard returns `busy`. Both server arms returned
before dispatch with failed outcomes. Count this duplicate once in the ledger.

## Verified claims

1. The authenticated account stamp selects the owner. Wire dispatch forwards the
   session player ID only; the key resolves the same owner.
2. Physical entry requires a current record and a live authoritative gate object
   within the full three-dimensional proximity radius.
3. `useItem` checks held inventory/selected slot. The focused key module separately
   requires a current owner record and tier; forged or transferred possession
   cannot grant an entitlement.
4. Regrant follows accepted entry and inventory capacity; it never grants clock
   authority.
5. `buildRealmSimConfig` injects a refusing participant before remote-key clock or
   admission work. There is no production override in the reviewed code.
6. The isolated account map lives outside plot serialization, reads an injected
   clock and writes one hour only after success.
7. Already-home handling precedes participant/clock reads. Refusals occur before
   deadline mutation.
8. Context checks cover combat, casting, membership, jail, finite coordinates,
   live instances and coordinate bands. The corpse exception is bound-owner only.
9. Generic dungeon dispatch requires an actual nearby dungeon door. Home definitions
   have `overworldDoor: false` and the Freehold gate is not a dungeon door.
10. Lane metering precedes jailed/dark checks, which precede heavy-self work and
    dispatch. The existing WebSocket size ceiling is unchanged.
11. The `de` self mirror is accepted only within a self delta; no public owner,
    cooldown or entry-sequence exposure was added.
12. Community relay collapses a home to Freehold. Social status preserves catalog,
    coordinates and existing block filtering. Metrics use bounded aggregate scene
    and count values without account labels.
13. Admin online inspection retains `accounts.read`; tick capture retains
    `ops.perf`. No new route or authorization bypass was added.
14. Developer commands still require exact `ALLOW_DEV_COMMANDS=1`; capture uses
    the local developer bridge. Deployment configuration is unchanged.

## Clean scans and limits

No credential literal or new forbidden simulation clock/random call was found.
No SQL, DDL, dependency, authentication, session, OAuth, TOTP, recovery, wallet,
static-serving or path-validation change was found. Logs are aggregate, without
owner identifiers. The reviewer parsed 33 changed JSON files; sensitive-key
candidates were boolean wallet-display flags and URL hosts were loopback. Item
provenance contains IDs, prompts, relative paths and hashes, without secrets or
private URLs. Capture added no external network destination or ownership setter.

Production durable account participation, the committed private mirror and PG
clock/race proof remain 07/07a. Slot capacity and physical-entry broadcast
acceptance remain named deployment gates. Injected test participants are not
production authority. No production runtime settings, snapshot isolation,
full-release malware audit or binary steganography proof was exercised or claimed.
