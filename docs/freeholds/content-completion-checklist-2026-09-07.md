# Freeholds content completion checklist, 2026-09-07

The completed content slice passes the shared gate and fresh review. Full 03
acceptance remains incomplete because concrete trial bills, complete furnishing
records, the furnisher and the actual Hearth item page are absent.

## Content acceptance and production activation

Final external signatures alone do not block 03 QA PASS. `state.md::D32` assigns
reference-derived trial bills to CONTENT, schedule/prepay validation to UPKEEP,
and the measured four-week report to ECONOMY QA. The opening contract in
`content-numbers-workbook.md` permits explicitly identified, measured TUNING
fixtures while disabled. The paired 03 QA contract permits named external
signature gates to remain open at a content PASS.

The earlier explanation treated later activation evidence too broadly as a
prerequisite for content completion. Production remains disabled until its
applicable approvals and release gates pass. The four-week calibration report,
twelve-week prepay extension and final shipping GLBs need not be completed to
author and test this content slice.

The existing [source freeze](content-source-freeze-2026-09-07.md) identifies the
actual missing inputs. It contains no complete measured trial rows, so its
current absence guards are valid for this checkpoint. Producing traceable trial
rows is the next work, rather than waiting for signatures on nonexistent rows.

## Producer sequence

| Work | Concrete output needed now | Owner and later acceptance |
|---|---|---|
| Trial Ledger schedule | Versioned finite cycle with selected material IDs, explicit grades, integer units and produce on every bill; source observations, allocation/valuation method, rounding and every-cycle fixtures | CONTENT with UPKEEP produces; Fernando/economy service sign before production enable; UPKEEP validates schedule/prepay and ECONOMY QA owns the four-week report |
| Trial vendor values | Eight explicit buy/sell copper and quality rows, tied to actual comparators and acquisition burden, with derivation/rounding and economy tests | CONTENT prepares the concrete CAL-VENDOR-A proposal for Fernando's review; generic material sell prices alone do not establish retail furnishing prices |
| Measured development geometry | Explicit model or stand-in mapping per item, intended scale and transform, measured bounds, grid/footprint conversion, collision/clearance and legal-placement evidence | ART/CORE brings the measurement work forward; final asset work later reconciles the shipping bounds. Icon pixels and unmapped dungeon props are insufficient |
| Trial decor costs | Positive integer per-item costs supported by the mapped geometry's measured render costs and declared trial budget method | CONTENT/ART prepares CAL-DECOR-A/B; final shipping and maximum-layout LOW evidence remain with their asset and economy acceptance owners |

Every proposal records its exact source, units, measured result, derivation,
rounding, version/hash, owner, fixture IDs and activation state. Do not invent
missing quantities, assume default item quality, derive bounds from an icon, or
record an approval on behalf of its owner. Prepare concrete rows and evidence
for review before requesting a decision.

The bounded owner decisions are acceptance of the measured reference activity
protocol/allocation and valuation snapshot, vendor acquisition-burden derivation,
and each stand-in's scale/grid plus the comparative decor-cost method. Current
repo measurements can inform these proposals but cannot uniquely choose those
targets. In particular, do not assume weekly play hours, a cohort threshold or
a retail multiplier merely to fill the worksheet.

`state.md::D13`, `content-manifest.md`'s implementation stand-in contract and
`art-brief.md`'s disabled-development allowance permit measured stand-ins before
final art. The current repository has no admitted mapping for these eight
furnishings. Establish that mapping and measurement basis first; this is a
scheduling dependency on ART/CORE inputs, not a requirement to build the final
shipping GLBs within this content task.

## Implementation and acceptance after trial inputs exist

- [ ] Replace the pending-only Ledger surface with the traceable trial cycle and
  exhaustive literal/firewall tests, preserving immutable published versions.
- [ ] Author exactly eight complete furnishing ItemDefs from the recorded rows,
  retaining the rug's explicit underlay radius of zero and all no-power rules.
- [ ] Add the Eastbrook furnisher, ordinary gold stock and entity localization;
  prove no furnisher on a dark host and the exact eight-item stock on a lit test
  host, plus purchase, sell and custody behavior.
- [ ] Complete shipping icon mappings/provenance, required item-name fills and
  the real `hearth_basics` page with live vendor source hints and safe discovery.
- [ ] Update the current absence guard to positive literal trial-content tests
  and proof that unsigned content cannot activate production. A lit development
  fixture is not a production approval.
- [ ] Regenerate the guide and i18n, update actual item/page inventories and
  retain desktop/mobile evidence of the live Hearth page and source behavior.
- [ ] Run the named content, economy, firewall, host, art, localization and guide
  checks plus `node scripts/gate_select.mjs`; complete the required specialist
  reviews, resolve findings and nits, and obtain fresh review of the repairs.
- [ ] Commit each reviewed deliverable with its generated outputs and evidence,
  run `npm run ci:changed` after the last commit, and run the paired 03 QA audit.

The manual deeds and their cosmetic rewards are already authored. Their gameplay
grant sites remain with first placement and confirmed Cottage granting in later
work, as the original content scope requires. Those future grant sites are not
additional requirements for this content PASS.

Current commits and observed validation are recorded in
[content validation](content-validation-2026-09-07.md). A passing paired audit
requires the actual missing content and its acceptance proofs above; current
green tests alone do not provide those deliverables.
