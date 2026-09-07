# Freehold economy trial proposal

Status: TUNING proposal for Fernando's acceptance. This document does not record
acceptance or authorize production. CAL-LEDGER-A and CAL-VENDOR-A production
signatures, the accepted market snapshot, and the later four-week cohort report
remain unsigned. The [completion checklist](../content-completion-checklist-2026-09-07.md)
separates development content acceptance from those activation requirements.

## Decisions presented for review

1. Accept the explicit laboratory activity protocol below for development trial
   units. It borrows the existing farmer's morning/evening cadence and measures
   real yields, but its field, corpse and fishing attempt allocation is a new
   proposed test protocol. It makes no claim about actual weekly player hours.
2. Accept a three-line Cottage trial bill containing produce and two rotating
   nonproduce families, with each selected resource charged at one tenth of its
   own measured eligible unit vector, rounded to the nearest positive whole
   unit with halves upward. The finite cycle covers every approved alternative.
   The one-tenth objective comes from the adopted Cottage target; applying it
   independently to these laboratory source vectors is the proposal.
3. Accept the same explicit common-quality, 250-copper purchase and 60-copper
   resale tuple for each of the eight starter furnishings. The tuple is copied
   directly from the live Linen Pouch comparator. This is proposed cosmetic
   positioning, not a claim that a bag and a furnishing have identical utility.

No market snapshot is needed to add unlike material units in this proposal:
those units are never added together as equivalent resources. Per-line unit
shares are the primary measurement. The separately labelled NPC-floor copper
sensitivity is diagnostic only and does not substitute for the service's
accepted market series or its missing/stale-price policy.

The observed trial produces the following concrete proposal. The integer rows
are the acceptance subject; they are not approved production bills.

| Trial row | Produce units | Other material units |
|---|---|---|
| `cottage-trial-01` | 20 `vale_wheat` | 6 `copper_ore`, 6 `ironbark_log` |
| `cottage-trial-02` | 20 `brook_carrot` | 6 `silverleaf_herb`, 12 `rough_hide` |
| `cottage-trial-03` | 29 `marsh_rice` | 11 `homespun_cloth`, 3 `raw_mirror_trout` |
| `cottage-trial-04` | 29 `bog_beet` | 8 `iron_ore`, 8 `ashwood_log` |
| `cottage-trial-05` | 20 `vale_wheat` | 8 `goldleaf_herb`, 12 `rough_hide` |
| `cottage-trial-06` | 20 `brook_carrot` | 11 `homespun_cloth`, 2 `raw_river_perch` |
| `cottage-trial-07` | 29 `marsh_rice` | 6 `copper_ore`, 6 `ironbark_log` |
| `cottage-trial-08` | 29 `bog_beet` | 6 `silverleaf_herb`, 12 `rough_hide` |
| `cottage-trial-09` | 20 `vale_wheat` | 11 `homespun_cloth`, 2 `raw_marsh_pike` |
| `cottage-trial-10` | 20 `brook_carrot` | 8 `iron_ore`, 8 `ashwood_log` |
| `cottage-trial-11` | 29 `marsh_rice` | 8 `goldleaf_herb`, 12 `rough_hide` |
| `cottage-trial-12` | 29 `bog_beet` | 11 `homespun_cloth`, 1 `raw_bog_eel` |

Where the approved eligibility row has a real fine twin, it is an alternative
grade for these units, with base consumed first. The table never charges both
the listed base units and another fine amount. Hide, cloth and fish retain no
invented fine grade.

## Reproduction and provenance

Run from the task worktree:

```sh
node scripts/freeholds/economy_measure.mjs --out docs/freeholds/content-trial-2026-09-07
```

The driver bundles the live simulation command paths. Its source loader seals
the actual input bytes compiled by esbuild, and it rechecks those bytes and HEAD
after executing the replay. Source drift refuses the run before evidence is
written. The complete source inventory is
[economy-source-hashes.json](economy-source-hashes.json). The concrete observations,
full command traces, material definitions, full named recipe comparators,
actual vendor source records, proposed bills, and per-item vendor rows are in
[economy-measurements.json](economy-measurements.json).

The evidence records its source commit, Node version, source-graph hash,
measurement hash and each fixture hash. Approval fields are null. A signature
must identify the actual accepted artifact version and content hash; a later
source edit requires remeasurement or an explicitly reviewed new version.

The corrected parent-run measurement completed with exit 0. Its artifact SHA-256
is `e6e6c4334999835f30c8f81735ef113de328a23948ff77531247a123d272204d`,
and its measurement SHA-256 is
`7da54311c24cbd73d5f185b74964076e78cde232f08e3aee05f68d5604c208d2`.
The source commit is `6e083002238ee625261a1b832a0e6049f931a432`; the separate
source hash inventory also seals the actual working-tree inputs.

| Measured source fixture | Attempts | Eligible units | Trial units | Active cast seconds |
|---|---:|---:|---:|---:|
| Each starter ore/wood/herb source | 56 | 55 | 6 | 140 |
| Each tier-2 ore/wood/herb source | 70 | 82 | 8 | 152.6 |
| Ordinary hide corpse | 56 | 115 | 12 | 82.5 |
| Ordinary cloth corpse | 56 | 110 | 11 | 84 |
| Eastbrook fishing, trout/perch respectively | 56 | 28 / 19 | 3 / 2 | 304.9 |
| Mirefen fishing, pike/eel respectively | 70 | 19 / 12 | 2 / 1 | 330.9 |
| Each starter crop | 56 | 193 base + 7 fine | 20 | 112 |
| Each tier-2 crop | 70 | 281 base + 10 fine | 29 | 140 |

The ordinary hide fixture's final attempt refused because the real starter bags
were full. Its denied attempt and zero grant remain in the measurement; no
inventory was cleared to improve the result. Other zero-eligible-output attempts
include excluded signed/windfall outputs, withered crops, junk and empty hooks.
Each complete event trace preserves those outcomes separately.

The smallest fish line is one eel from twelve observed eels, or 8.3333% of that
line's supply; the starter node line is six from fifty-five, or 10.9091%. These
are visible integer effects, not a secretly approved tolerance. The NPC-floor
diagnostic value of entire bills spans 9.8287% to 10.3226% of the matching source
vectors. That narrow aggregate must not hide individual resource deviations or
be represented as an accepted market burden report.

## Observed source facts and proposed laboratory choices

`tests/helpers/farming_calendar_model.ts::REFERENCE_FARMER` records two visits
per day and work at teaching-tier hubs. `FARM_PATCHES` supplies each source hub's
real bed identities and count. `FARM_CROPS` supplies crop duration, seeds, grades
and tier; `farmCropSkillThreshold` and `wieldRequirementForTier` supply admission
requirements. Crop survival, ordinary and fine yields, proficiency gains,
windfalls, node rarity, corpse components and every fishing outcome execute
through the live command implementations.

The following choices belong to this proposed laboratory protocol:

- Each source is a separate deterministic actor/fixture. It is a source-stratum
  experiment, not a claim that one account performs every fixture in one week.
  Farming works the crop's own hub. It does not silently count all teaching hubs
  as producing the same crop or claim to reproduce the full progression model.
- The measurement interval is the synthetic Tuesday 2026-09-08 through the next
  Tuesday, excluding the endpoint. The date is an injected test fixture, never
  the operational production epoch. Exactly fourteen morning/evening visits
  occur inside that interval.
- Farming begins with a recorded prior-evening plant. Its preparation cast
  seconds are separate from active cast seconds inside the week. Each in-week
  visit harvests and replants every source-hub bed, without compost, watch, tonic
  or tool effects. Final growing crops are retained but not credited as output.
  Seeds and the source-appropriate hoe are explicit setup grants; buying them
  and earning tool proficiency are not simulated or asserted free.
- Field gathering performs one attempt per source-hub bed slot on distinct
  actual same-zone nodes during each visit. Tool proficiency starts at the
  source-appropriate wield threshold and then gains through the live path.
  Nodes are not regenerated or their cooldowns cleared to fit the trial.
- Corpse harvesting uses the real lowest-level source template for each family,
  with its complete component tags and the ordinary All preference. Each corpse
  is an explicit dead fixture. Kill time, kill drops, travel and contested
  availability are unmeasured, and ordinary corpse loot is never credited.
- Fishing retains the actual lake, rod gate, entry proficiency and weighted
  table, including junk and empty hooks. Perfect first-bite reeling is a proposed
  laboratory assumption. Shore probes use the real deny path; the first
  admitted probe is the first counted catch and no successful draw is discarded.
- Only command casts and pending gathering grants advance. Movement, combat,
  the ambient world, quest rewards and login behavior are outside this replay.
  Active cast seconds are measured simulation time, never route time or weekly
  engagement. Offline visit gaps are represented by injected time jumps.

All source outputs and exclusions remain visible in the trace. Windfalls,
signed node/corpse materials, Pristine specimens, golden bonus items, husks and
off-lineage catches do not inflate the eligible baseline. Ordinary fine produce
is recorded by its actual identity. A failed or empty attempt contributes no
eligible supply. Inventory remains the real starter bags throughout, with no
silent clear or vault transfer. Capacity refusals and ordinary denial events
remain in the trace.

## Trial bills and rounding

The ordered family pairs are ore/wood, herb/hide and cloth/fish. Repeating those
pairs enough times to visit all four fish alternatives yields twelve rows.
Cycling the four produce alternatives once every four rows covers each one.
Other families retain the workbook's exact material-tier and base-before-fine
identities; hide and cloth share their existing ordinary source, without an
invented second-tier material. This finite enumeration is a proposed content
encoding, not a new gameplay duration or prepay allowance.

For each selected line, let `U` be the measured eligible units across only that
line's approved grade list. The proposal records raw `U / 10` and integer
`floor((2 * U + 10) / 20)`. A value that rounds below one refuses the proposal;
the tool never raises it to one as a hidden floor. It retains achieved units/U
and, separately, the theoretical half-unit rounding bound. No tolerance is
silently treated as approved. The later immutable bill consumer must preserve
the accepted content version and actual quoted rows through prepay and rollover.

The trial version is `freehold-ledger-tuning-v1`. Actual line rows, quantities
and achieved ratios are the `measurements.ledger.bills` records in the sealed
evidence. The production calendar anchor, accepted market snapshot and approval
remain null. Inn Room stays free without upkeep; the proposal creates no charge
for it and no higher housing-tier curve.

## Vendor proposal and acquisition burden

| Item ID | Buy copper | Sell copper | Quality |
|---|---:|---:|---|
| `freehold_timber_bed` | 250 | 60 | common |
| `freehold_round_table` | 250 | 60 | common |
| `freehold_spindle_chair` | 250 | 60 | common |
| `freehold_low_stool` | 250 | 60 | common |
| `freehold_woven_rug` | 250 | 60 | common |
| `freehold_brass_lantern` | 250 | 60 | common |
| `freehold_storage_chest` | 250 | 60 | common |
| `freehold_open_bookshelf` | 250 | 60 | common |

`src/sim/content/items.ts::BASE_ITEMS.linen_pouch` supplies all three fields as
one observed tuple, with actual ordinary vendor sources captured from `NPCS`.
No value is inferred from an optional type field, rarity default, item size or
material resale multiplier. Uniform starter pricing deliberately avoids an
unmeasured per-furnishing size or prestige weight.

The eight-item set costs 2000 copper, the exact current purchase value of
`BASE_ITEMS.travelers_knapsack`. That equality is a comparison supporting the
proposed starter-set positioning, not a rule requiring all future furniture to
cost the same. Reselling any purchased furnishing loses 190 copper, so direct
ordinary purchase/resale cannot mint gold. Runtime economy, custody and vendor
tests still own proof of the complete action paths after admission.

At the observed `copper_ore.sellValue` of 4 copper, buying one item corresponds
to selling 63 whole ordinary ore units: `ceil(250 / 4)`. The evidence ties that
requirement to the actual `ore-tier-1` output and cast seconds. It reports gross
ordinary material sale capacity, not profit after tool acquisition, journey
time, market fees or contested supply. The recipe comparators are retained as
full records and are context only; no crafting recipe, reagent, effect or fee is
copied onto these vendor-only cosmetics.

CONTENT produces these trials with the later UPKEEP and ECONOMY QA owners.
Fernando accepts or revises the concrete development basis. Fernando/service
production approval remains a separately named gate before production acquisition,
spending or upkeep can be enabled.
