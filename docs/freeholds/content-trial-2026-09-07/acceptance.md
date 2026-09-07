# Accepted development trial basis

Fernando accepted the complete proposal on 2026-09-07 in this task. The recorded
answer was: "Accept this development trial basis".

The decision covered the fourteen-visit laboratory protocol, the twelve-row
Cottage cycle with produce plus two rotating families at one tenth of measured
eligible yields and the documented rounding, and all eight common furnishings
at 250 copper purchase / 60 copper resale. It also covered the measured existing
stand-ins, the 0.5-unit grid and outward-rounded envelopes, the rug's zero underlay
radius, the bookshelf at half its existing library scale, and decor costs
4 / 2 / 1 / 1 / 1 / 1 / 3 / 8 in the manifest's item order. One of each costs
21 decor points; the Inn Room budget remains 20.

This is development TUNING acceptance. It is not production approval, a market
snapshot, a measurement of player hours, a shipping GLB approval, or a room/LOW
performance result. Production remains disabled. No calendar epoch, cohort
threshold or twelve-week prepay extension is approved by this decision.

## Exact accepted evidence

The producer artifacts retain their original proposal status and null approval
fields as immutable measurement history. This separate decision record admits
those exact bytes for development implementation; it does not rewrite their
source commit or fabricate a producer-time signature. The source graph records
the actual compiled source buffers at measurement time, including uncommitted
work, rather than claiming that HEAD alone identifies them. Later integration
adds the accepted content to that source tree.

| Artifact | SHA-256 |
|---|---|
| [economy-proposal.md](economy-proposal.md) | `542908f66ceab24253aff21ffa3d6ed56412152d599bea80efe96acd1fe653ca` |
| [economy-measurements.json](economy-measurements.json) | `e6e6c4334999835f30c8f81735ef113de328a23948ff77531247a123d272204d` |
| [economy-source-hashes.json](economy-source-hashes.json) | `d289e3a6d404df55196697a81de56f5809c33c43650f4a52e1a9fcef20897b5b` |
| [geometry-review.md](geometry-review.md) | `f723133c9d7763fbb69fe2121a79df89a7c1baeb221257cff2e2d7189ecc5f7a` |
| [geometry-proposal.json](geometry-proposal.json) | `28172584aad1b4a7d2bc5090e4be377bff32170d735ae4bc8a0f867af7f273bb` |
| [geometry-measurements.json](geometry-measurements.json) | `aa3e35884452ff6c2b228c439ee731daf5fddace19bd213601aae3a16d8bc8f1` |

## Required before production or shipment

- Complete the applicable CAL-LEDGER-A, CAL-VENDOR-A, CAL-DECOR-A/B and
  MEASURE-SPACE production approvals and the later owner-specific calibration,
  room, placement, final-asset and LOW gates before enabling their consumers.
- Follow the existing [content-ID deployment boundary](../../../DEPLOY.md):
  install compatible readers/writers across the fleet before acquisition is
  enabled. The eight `freehold_*` item IDs listed in the accepted proposal and
  `hearth_basics` are catalog additions. An older catalog drops their discovery,
  first-find/count, recent and illumination records on restore and autosave.
  Disabling the feature on the current binary preserves those definitions;
  rolling back to an older binary does not. A rollback across this boundary
  requires restoration of affected state from backup, as the existing runbook
  specifies. No schema migration or new unknown-ID preservation policy is added.
- Complete the [Freehold Furnisher voice](furnisher-voice.md) before the feature
  ships. Fernando explicitly deferred it on 2026-09-07. Retain the text greeting
  and remove only the exact pending coverage exception when the real voice and
  normalized audio are registered and voice/SFX checks pass.
