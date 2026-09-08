# Freeholds 06 hygiene coverage review

Historical initial review. Findings and pending checks below describe the audited delivery, not the final fix round. See [the current disposition ledger](../findings.md) and [execution evidence](../execution.md).

Reviewed worktree: /Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds
Range: 654071354172b3e252cfc03a1e85efde2daddaa6..67281f8ed40f0e20c9c9a438e38177e49b0c50ab
Role: read-only DEAD CODE AND HYGIENE coverage audit. No repository edit, shared test, asset generation, commit or remote mutation performed. Planning rulings came from docs/freeholds/qa/interiors-2026-09-08/reviews/context.md and /root/context, not direct planning reads.

## Findings

Five grouped findings, comprising one newly unused import, one live vocabulary conflict, fifteen non-M16 locale fills, eleven inherited unused imports and two inherited dead local helpers. The parent owns applicability/ranking and the final found/fixed count. Inherited items are explicitly distinguished from regressions.

### HY-01: newly unused DUNGEONS import after extraction

Severity P3, high confidence, introduced in this range. server/game.ts:24 imports DUNGEONS, but its remaining TypeScript AST has no other reference to the identifier. The base revision used it; the extracted instance-presence work now reads the dungeon table in server/instance_presence.ts. Remove the orphan import specifier. This is a concrete extraction cleanup, not a behavior change.

### HY-02: Inn entry still describes a rented room

Severity P2 requirement gap, high confidence on occurrence; inherited field in the audited feature's live route. src/sim/content/freehold/dungeons.ts:28 emits 'You climb the inn stairs and let yourself into your rented room.' The exact standalone token rent is absent, but rented is the same disallowed ownership vocabulary. The phrase is visibly present in the committed after-freehold-inn-desktop.png and after-freehold-cottage-desktop.png chat logs. Context found no locked exception permitting it. Resolve the vocabulary conflict explicitly, use ownership-neutral room wording, preserve localization and refresh the affected visual evidence. Generated catalog changes must come from the generator.

### HY-03: fifteen locale additions exceed the M16 exception

Severity P3, high confidence, introduced in this range. src/ui/i18n.locales/{ja_JP,ko_KR,ru_RU,zh_CN,zh_TW}.ts each adds 41 new rows. Exactly three per locale do not meet the literal M16 predicate used by tests/i18n_completeness.test.ts:254, /[a-z]{4,}/ after stripping {tokens}:

- hudChrome.housing.common.back: English Back.
- hudChrome.housing.gate.own: English My Home.
- hudChrome.housing.gate.lookup: English Find Home.

The other 38 rows per locale qualify. The root/local policy and the implementation-plan ruling supplied by context permit contributor overlay changes only for M16. Preserve an already recorded explicit maintainer authorization if it exists; absent such authorization remove these 15 additions and regenerate. Do not change English solely to manufacture eligibility. This is a scope/policy finding, not a claim that the translations are linguistically wrong.

### HY-04: inherited unused imports remain in touched modules

Severity P3, high confidence on deadness; inherited scope applicability for parent resolution. Each identifier occurs only in its import in the tip AST and also was unused at the base:

- server/game.ts:17 isMountSkinId; :20 isWeaponSkinType and WEAPON_SKINS; :196 grantAccountMountSkins; :197 grantAccountWeaponSkins; :206 markAccountQuestComplete; :215 setAccountWeaponSkinLoadout. Seven imports.
- src/render/dungeon.ts:33 polygonContainsPoint; :108 markSharedTexture; :109 radialGlowTexture. Three imports.
- src/sim/world.ts:41 reachDeckSurface. One import.

These are not regressions from 06. The user's coverage request explicitly includes unused imports and all nits, so they are reported rather than silently filtered. Remove only the unused specifiers if parent accepts them into the fix scope. Any source seals affected by semantic-neutral cleanup still need correct freshness handling.

### HY-05: inherited dead local Eastbrook geometry helpers

Severity P3, high confidence on deadness; inherited scope applicability for parent resolution. src/sim/eastbrook_layout.ts:954 wallPoint and :982 gateCrossing are non-exported function declarations with no references in the file. The AST count is one per identifier in both base and tip. They are not new regressions, but this touched layout is explicitly within the hygiene audit. Parent should resolve their inclusion rather than treating them as freshly introduced or silently implying a dead-code-free touched tree.

## Verified coverage and clean results

- Inspected the five commit messages including bodies. Scoped Conventional Commit subjects/bodies exist. No exact phase/rent/real estate token, em/en dash, or emoji in those five messages.
- Scanned every added source/test/script line in src, server, scripts, tests and .github, including generated additions, for exact phase/rent/real estate tokens, TODO/FIXME, debugger, .only, em/en dashes and common emoji ranges. No match. Technical captured shader text contains inherited float phase variables inside raw telemetry; that is source-captured animation terminology, not a new housing name. Existing unrelated source comments using phase are inherited and not relabeled as new changes.
- TypeScript AST scan of touched nongenerated source/script modules found no newly unused imports beyond HY-01 and no new unused non-exported named function/type/class declarations. HY-04/HY-05 preserve all concrete inherited candidates found by that scan. This is an identifier audit, not a claim of a full whole-program reachability proof.
- Added sim imports and source lines show no render/ui/game/net/Three dependency or DOM/browser/Math.random/Date.now/performance.now call. Added renderer lines show no assignment into sim/entity state or new mutating world call. Read the freehold renderer and route modules directly. Shared sim geometry/data imports are the sanctioned deterministic source-of-truth seam.
- src/render/freehold/CLAUDE.md exists and accurately describes the dressing API, procedural measured parts, shared prepared geometry/materials, reserved empty stations, walk-through plinth underlays, no lights/flames/condition rigs, all-tier geometry, containing dungeon gate, opaque wall cutaway, and door-aligned exit label. The implementation matches these claims.
- Both old crypt-placeholder interior definitions are replaced by inn_room/cottage and shared authored entry/exit constants. Placeholder comments in that definition are removed. Static dressing stand-ins remain intentionally permitted for this delivery; reserved Cottage Strongbox/station anchors intentionally draw no model or collider until their later owner per context. They are not orphaned decor defects.
- Read the English generated catalog as data and checked every hudChrome.housing.* leaf: no earn/earned/earning vocabulary. Only the five expected non-Latin overlays changed; their exact non-M16 excess is HY-03.
- Only one new shipping WebP is in the range: public/ui/items/hearth_key.webp. It has exactly the new matching item provenance batch, source item id, CREDITS row and accepted-art record. SHA256 of the shipping file matches 7ce9c6ca71367b295e8c9165985eb16fba20fd417f54ba323cd6ef620694b0aa, size 2220 bytes. All three style-reference hashes match. The ignored original and master PNGs still exist locally and match their recorded hashes. The record names Codex built-in OpenAI image generation, exact prompt, ordered style-only references, source/master/shipping hashes, npm run assets:items conversion, small-size/grayscale/circular review. Viewed review.png; complete key bow/shaft/teeth remain readable without a frame or writing. No model/GLB/texture/sampled-SFX binary was added by these five commits, so no missing new GLB-export producer can be inferred here.

## Capture and performance evidence

- scripts/lib/pr_shot_freeholds.mjs::freeholdReviewTargets contains exactly freehold-gate/gate-own-prompt, freehold-inn/inn-safe-landing and freehold-cottage/cottage-safe-landing, each desktop 1600x900, compact 874x402, tablet 1180x820. Eighteen before/after image files and eighteen evidence sidecars are present, plus three raw/formatted pairs and acceptance.json.
- Independently computed every PNG and sidecar SHA256 listed in acceptance.json: all 36 hashes match. All three raw-file SHA256 values match, and each raw/formatted JSON pair is semantically equal. All 31 captured source-input seals match the audited source. No fabricated prior room or prompt: visually inspected all nine before PNGs, which show the real baseline quay, and all nine after PNGs, which show the prompt or the correct room shell.
- All eighteen sidecars record graphicsPreset=1, graphicsDefaultApplied=true and rendererTier=low; all record a fitting viewport, no GPU notice over the image, and a classic theme. The harness sets both preset fields before navigation. All five visible controls on each of the three gate images are at least 40x40 CSS pixels; mobile select fonts are 16px. No reviewed image is blocked by a notice or clipped prompt.
- The tour obtains the Cottage through the actual chat /dev freehold cottage route, uses nearby F and explicit gate confirmation, and reads player position instead of assigning it. Writes under window.__game are input intent/camera input members, not sim state or direct setters. The wording 'no window.__game mutation' should be understood with this sanctioned real-input harness seam; otherwise the contract conflicts with the user's explicit existing route requirement.
- The raw diagnostics remain honest: before manifest has 123 console entries (102 inherited missing character preloads and 21 HTTP502); after has 23 HTTP502 entries, with no target failure or page exception. Context already classifies these as baseline/preload repairs and offline backend diagnostics. Do not report these files as zero-console-error captures. Their existence is not evidence of a new untriaged game-render failure.
- The committed perf record states real-gpu-headed, low renderer tier on desktop/mobile, 0 errors and 2 ignored console errors per run. Each room sample preserves lifetime counters and records deltas from gate confirmation through rendered sample windows. The main thread must execute the mandated fresh tour; this review does not substitute the historical record for that run.
- Screenshots show functional shells, not final 09 lighting/camera/welcome acceptance. No claim of final arrival beauty is justified by them. The known later 18/19/20 handoff remains explicit in the context summary.

## Limits and parent checks still required

No shared tests, typecheck, build, wiki/i18n/manifest regeneration or perf tour was run by this reviewer, as assigned. Generated-file byte freshness must be proved by the parent's canonical regeneration and status check; historical use of a generator cannot be proven solely from a git diff. The same applies to current public item-art consistency gates and full architecture guard execution. This audit did not generate an asset or rewrite an evidence file.
