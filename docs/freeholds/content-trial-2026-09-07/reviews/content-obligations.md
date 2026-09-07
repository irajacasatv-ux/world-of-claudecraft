# Freehold Content Obligations closure

Read-only fresh inspection, 2026-09-07, in `/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds`. This supplements `/tmp/freehold-review-obligations-final.md`; it does not replace the historical producer report. No source edits, test reruns or producer reruns.

## Fresh documentation result

**Original N1 closed.** `docs/freeholds/content-completion-checklist-2026-09-07.md:3` now explicitly identifies the implemented twelve-bill cycle, eight ItemDefs, furnisher and Hearth Basics page. Lines 23 to 26 link the exact accepted trial and integrated revalidation, superseding the earlier absence boundary; lines 57 to 68 mark the implemented content delivered while final evidence/gates/commits stay open. `docs/freeholds/content-source-freeze-2026-09-07.md:3` explicitly marks its entire absent-input inventory as historical and links both successor artifacts. No instruction remains to remove the admitted content.

**P3 geometry wording follow-up closed by fresh inspection.** Checklist line 34 now says “per-object envelope/radius containment and open-lattice fixtures.” It accurately describes the accepted producer's evidence without claiming approved room polygons or protected doorway/arrival clearance. Lines 51 to 53 retain legal room/LOW evidence with later owners. This documentation-only repair needs no code change or repeated gate. All findings and nits from this content-obligations review are closed.

## Retained exact eight-item obligation matrix

“Five fills” means actual `zh_CN`, `zh_TW`, `ja_JP`, `ko_KR` and `ru_RU` source translations. Every row has a real frozen ItemDef, ordinary common quality, 250/60 copper buy/sell values, floor surface, no power/storage/use/stack effect, and sole vendor `freehold_furnisher`.

| Exact item ID | English name | ItemDef line¹ | WebP present and accepted SHA prefix² | Provenance row² | English key + five fills³ | Actual Hearth/Guide membership⁴ |
|---|---|---:|---|---:|---|---|
| `freehold_timber_bed` | Timber Bed | 21 | Yes; `91afbb705212784a` | 55 | Yes | Slot 1 / Timber Bed |
| `freehold_round_table` | Round Table | 30 | Yes; `def32f5a936310c0` | 75 | Yes | Slot 2 / Round Table |
| `freehold_spindle_chair` | Spindle Chair | 39 | Yes; `b4f80bdfb3d0a458` | 95 | Yes | Slot 3 / Spindle Chair |
| `freehold_low_stool` | Low Stool | 48 | Yes; `624759c6060b2b1e` | 115 | Yes | Slot 4 / Low Stool |
| `freehold_woven_rug` | Woven Rug | 57 | Yes; `af2b3c7ca1f3c09c` | 135 | Yes | Slot 5 / Woven Rug |
| `freehold_brass_lantern` | Brass Lantern | 66 | Yes; `b2f6dc49f9cf68b6` | 155 | Yes | Slot 6 / Brass Lantern |
| `freehold_storage_chest` | Storage Chest | 75 | Yes; `4362f9f0492d4c25` | 175 | Yes | Slot 7 / Storage Chest |
| `freehold_open_bookshelf` | Open Bookshelf | 84 | Yes; `70181eb0c4bc065f` | 195 | Yes | Slot 8 / Open Bookshelf |

1. `src/sim/content/freehold/furnishings.ts`; all eight merge through `src/sim/data.ts:390`. Exact power-neutral row shapes, accepted dimensions/costs and frozen nested objects are pinned in `tests/freehold_content.test.ts:202`.
2. Exact files are `public/ui/items/<id>.webp`. Individual records are in `docs/freeholds/content-art-2026-09-07/items.accepted-art.json`; the single eight-ID mapping owner is `public/ui/items/mapping.json:6641`, with `CREDITS.md:169` and retained original/master/prompt lineage. All eight actual shipping hashes matched that evidence during the preceding review; the separate `tests/freehold_art_admission.test.ts` literals prevent a self-consistent but unreviewed manifest rewrite from passing. Runtime icon resolution derives the complete non-weapon set from real `ITEMS`.
3. IDs/names append through `src/ui/i18n.catalog/items.ts:3006` and `:3666`. The eight consecutive fill rows start at `src/ui/i18n.locales/zh_CN.ts:15201`, `zh_TW.ts:15207`, `ja_JP.ts:15526`, `ko_KR.ts:15539`, `ru_RU.ts:15760`. Dedicated Hearth/deed locale rows and NPC name/title/greeting fills also exist.
4. `src/sim/content/reliquary.ts:1830` is the real tail page `hearth_basics`; `src/guide/content.generated.ts:7816` contains all eight emitted rows. The page has normal completion and the actual furnisher vendor hint, with no patterns/trophy records. Guide parity is asserted against these exact displayed names.

## Finishing COVERAGE claims

- The exact eight-item vendor stock, dark-host absence, lit-host acquisition, copy-per-slot custody, insufficient funds/full bag, sell/buyback, discovery/completion, save/restore and no RNG draw paths remain covered by actual Sim tests. The runtime control remains the existing D3/D85 boot boolean; no new production approval switch is invented.
- Hearth union/nav/order, Overview cards, page/back/deep-link focus, missing-cell source tooltip/aria, owned-cell hint omission and actual Japanese relocalization are exercised through the real window/catalog/helpers. Existing hidden-source and simple-craft/disenchant negatives remain intact. The gold-vendor collection exception is the exact eight NPC/item pairs, not all furnishings or all gold stock.
- The true-tail manual Homesteader and Householder records retain 5 Renown each, respectively the Homesteader title/Horizons link and working shared Householder home border. Two independent registered crests have retained Codex/canonical-pipeline provenance and literal decoded-framing pins. No runtime grant sites or trigger widening are introduced; later placement/Cottage granting owns them.
- Both historical geometry findings remain closed: source-cache/seal/drift protection binds evidence to actual decoded bytes; unique complete-factory hashing rejects added rug scale/geometry even when the old fragments remain. Original and final complete rows/grid/decor are identical; final artifact SHA `d880b83a82a643631890ee6e9b941f3c83f89918b7de9388cd3d2a71b6725ff7`. No final-GLB, legal-room or GPU/LOW claim is inferred from these offline fixtures.
- The subsequent terrain repair at `src/sim/terrain_calm_anchors.ts:165` skips only the new furnisher's extra calm pad, retaining all existing NPC pad behavior and avoiding terrain reshaping on dark hosts. The current vendor census explicitly includes `freehold_furnisher: 8` at `tests/vendor_floor.test.ts:829`. I read `/tmp/freehold-full-gate-repairs.log`: **8 files, 261 tests passed**. This focused repair result does not replace the pending full-gate verdict.
- Exact full-span inventory deltas remain: items 1271→1279; current item-art files/owners 1256→1264; deeds 299→301 and Renown 3525→3535; titles 46→47 and borders 4→5; Reliquary pages 41→42, full completion 429→438, character completion 400→409, raw slots 465→474, indexed item IDs 319→327. Historical dated campaign evidence stays historical.
- NPC voice is explicitly user-deferred until before shipment. The text greeting remains, with one exact pending coverage exception; no borrowed/fabricated voice or production-approval claim is added.

## Remaining acceptance boundary

No unresolved content implementation defect or documentation nit remains in this review. Final runtime captures, full shared gate, required review closeout, final documentation/commit checks and paired 03 QA remain coordinator-owned and pending. Production calibration/signatures, later room/placement/final-asset/LOW evidence, compatible fleet deployment, and original NPC voice remain their separately recorded pre-enable/pre-ship requirements. They do not require expanding 03 into shipping GLB production or a four-week waiting period.
