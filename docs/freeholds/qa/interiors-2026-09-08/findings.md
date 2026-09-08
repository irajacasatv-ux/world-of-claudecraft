# Findings and disposition

**PASS: 37 distinct findings found and 37 fixed, zero open or deferred.**
The 36 source/evidence findings and all 46 final PNGs completed independent review through
`957a93b05b418ac5baf7c164679b7bd72017b3c6`. The third complete shared gate
exited 0 with all twelve steps green. The [fresh final review](reviews/fresh-fix-review.md)
records PASS for the entire fix round. DOC01 adds the final documentation
review's corrected historical-checkpoint wording. Earlier failed attempts remain
historical evidence in the execution ledger.

Original audit range: `6540713541..67281f8ed4`. Fix-round base: `67281f8ed4`.
Duplicate reports are counted once by root cause. A separate missing decisive
assertion remains a coverage finding. All findings, including nits, are in scope.
The source fixes are in `218916234d`; the expected arrival golden is in
`27489b027d`. Fresh-review repairs are committed in `8e9f11d4ee`; canonical
captures in `713f18e41f`; and actual-key producer/evidence plus FFR03 in
`1e322d90c2`. The sparse-checkout evidence correction is in `c3dd49f191`. All
46 PNGs have independent visual inspection. GI03 and GI04 are subsequent inventory corrections, committed in `524942c6b4`
and `957a93b05b`. Complete QA acceptance is supported by the final shared gate and fresh independent PASS.

| ID | Finding | Current correction and evidence |
| --- | --- | --- |
| C1 | Shared-account arrivals overlap. | Deterministic body-safe owner arrival resolves before claim, movement or cooldown effects; saturation refuses without side effects. Focused arrival tests and the corrected online suite pass. Ordinary dungeon arrival remains unchanged. |
| C2 | Public gate changes dead/combat/no-record refusal order. | Public gate preserves the ordered context guard and bound-owner corpse exception. Gate/key exact-reason and unchanged-state regressions pass. |
| C3 | Capture route mutates game input/camera through `window.__game`. | Freehold routes now steer through browser keyboard input, with observation-only game reads and key release cleanup. Capture route tests pass; all nine after images were recaptured, all eighteen before/after images independently inspected, and all six capture-contract tests pass. |
| TC01 | No independent same-tier foreign-owner negative. | Real key use from another owner's same-tier claim asserts `instanced` and unchanged full travel/account state. Focused simulation tests pass. |
| TC02 | Cancel/focus coverage calls helpers directly. | Real browser keyboard, pad and trusted touch cancellation assert zero entry and actual focus return. The final prompt browser run passes 28 tests. |
| TC03 | Jailed key test lacks exact personal denial and complete unchanged state. | Real jailed dispatch asserts `busy`, requester-only feedback, failed outcome and unchanged travel, inventory, claim and cooldown state. Server regressions pass. |
| TC04 | Rift negative uses only a coordinate band. | Real generated rift-floor fixtures assert `instanced` and unchanged full state for both surfaces. Focused simulation tests pass. |
| TC05 | Missing unrelated-item, forged use and genuine regrant matrix. | Real unrelated item behavior, missing possession, held key without ownership and grant/remove/regrant cases now have decisive regressions. Gate regrant does not mint ownership or consume cooldown. Simulation/server tests pass. FFR01 adds the distinct bank-held case below. |
| TC06 | Map test title claims a positive pointer tooltip without asserting it. | Composed navigation marker hit/tooltip and clearing behavior is tested. The first proposed `tooltipAt` assertion targeted the instance-marker adapter and was discarded as an invalid test candidate; no production map defect was claimed. |
| HY01 | New unused `DUNGEONS` import. | Removed from the audited server coordinator; typecheck and changed-file checks cover the correction. |
| HY02 | Inn narrative uses rental vocabulary. | Ownership wording now says `your room`, with the existing matcher/catalog and required native fills regenerated. Content/localization tests pass; the refreshed images carry the corrected narrative. |
| HY03 | Fifteen locale additions exceed M16. | Removed Back/My Home/Find Home fills from the five overlays; preserved the exact qualifying M16 additions. Generated bundles were regenerated. |
| HY04 | Eleven inherited unused imports in touched modules. | Removed only the audited unused imports across server, renderer and world modules. Typecheck and scoped tests cover the correction. |
| HY05 | Two dead Eastbrook local helpers in an audited file. | Removed the unused `wallPoint` and `gateCrossing` helpers; source seals were reminted through the owning tool. |
| RP01 | Required dependency wait can block arrival and shutdown indefinitely. | Waiter cancellation and bounded deadlines now terminate stalled preparation, preserving generation guards and shared cache work. Lifecycle regressions pass. |
| RP02 | Temporary prewarm instance handles are not disposed. | Temporary handles are released after compile/resume users settle, without disposing shared geometry/materials. Lifecycle regressions pass. |
| RP03 | Perf acceptance trusts stale derived deltas. | Validation checks raw arrival-before through sample-end counters, monotonicity and stored delta consistency. Contradictory raw evidence now fails. Route/perf tests pass. The final hardware GPU tour reports zero required raw deltas in both rooms and viewports. |
| RP04 | Perf preset lacks boot marker and effective-tier proof. | Capture seeds both preset and default-applied marker before boot and verifies effective low graphics. Focused tests pass; the final raw tour retains preset 1 and effective low tier for both rooms and viewports. |
| CP01 | Jailed gate/key reasons and event shapes diverge. | Both housing routes use the shared personal `busy` denial and preserve pre-dispatch refusal. Real server tests pass. Security independently corroborated the same feedback defect; no escape was found. |
| SP01 | Gate attempts force heavy self serialization without inventory changes. | Dispatch compares the actor's inventory revision around entry and dirties heavy self only after an actual grant. Real projection assertions cover refusal, existing key, full bags and new key. The finished database/server review closes this finding. |
| FE01 | Enter/Space on gate controls leaks to Chat/Jump. | Shared key and pointer-focus helpers protect button/select activation while preserving native behavior. Real browser regressions pass. |
| FE02 | Escape cannot close from the friend name field. | Non-composing Escape uses the shared close lifecycle and returns focus. Browser tests cover the name field and IME boundary. |
| FE03 | Lost eligibility leaves silently inert enabled Enter. | Rejected activation refreshes the existing unavailable state and disables entry without adding polling. Unit/browser regressions pass. |
| GI01 | Capture selection omits new producer paths. | Resolver, variant and ground-object paths select all three Freehold targets and their nine canonical variants. Direct classifier regressions pass. |
| GI02 | CI sparse checkouts omit the new key and presentation evidence folders. | The first shared gate exposed the source-reference/cone mismatch. Added both folders to all five CI checkout cones and the common literal pin, preserving the derived corpus and equality/adversarial guards. All 27 workflow tests pass with the intended audit references staged. Independent gate-integrity review passes the applicable checks; fixed in `c3dd49f191`. |
| GI03 | Exact loopback-guard importer inventory omits the new key capture script. | Added `scripts/freehold_key_capture.mjs` to `URL_GUARDED_SCRIPTS`. The producer already calls `assertLoopbackUrl` before opening the browser and never opens PostgreSQL; no runtime safety change was needed. Targeted red evidence is one failure and 36 passes; after the inventory row, all 38 cases pass, including its per-script assertion. Independently closed and committed in `524942c6b4`; the complete corrected gate passed. |
| GI04 | Live painted hotbar-item census remains 97 after the Hearth Key becomes eligible. | Updated the current inventory comment and exact count to 98 and added explicit key membership. Historical 81/81 acceptance, artwork bytes and seals are unchanged. Red evidence is one failure/four passes; corrected art suites pass 13 cases, and the real action-bar controller suite separately passes 65. Independently closed in `957a93b05b`; the complete third gate passed. |
| CO01 | Key lacks real desktop/mobile inventory, tooltip and usable action-slot evidence. | Closed by the final producer exit 0: both desktop and compact completed gate grant, shipping bag/bank tooltips, native or held-touch action placement, real bank round trip and key activation, with one key retained. Eight images and source-bound raw evidence are committed in `1e322d90c2`. Compact tooltip capture uses explicit automated DOM focus; no keyboard-only/touch-only tooltip navigation or physical-device claim is made. Earlier failed attempts remain recorded. |
| CO02 | Item-count comment omits the key. | Corrected the explanatory comment without changing the assertion. Item-art consistency tests pass. |
| CO03 | Generated-batch comment omits the key batch. | Corrected the explanatory comment without changing provenance or assertions. Item-art consistency tests pass. |
| CO04 | Mapping-owner arithmetic double-counts reins and omits the key. | Corrected the explanation; mapping ownership and item-art tests pass. |
| PR01 | No real JSON character save/restore proof for the key and old rows. | Six save/JSON/restore cases pass for both rooms, retained key, no duplicate, safe exterior reload, old rows and bank. Account deadline, owner stamp and arrival sequence remain outside saved character/plot state. |
| FE04 | Ordinary action-slot eligibility rejects the Hearth Key. | Shared item eligibility accepts the real key action. The real `action_bar_controller` suite passes 65 tests after the decisive red regression; its final exact command and log are retained in execution evidence. |
| FFR01 | A bank-held key is ignored during gate regrant, allowing a duplicate. | Gate restoration now counts a key already held in the bank. The bank/key/server regression command passes 177 tests across three files. The fresh reviewer accepted the repair; the final key capture now completes the bank round trip on both variants with one retained key. |
| FFR02 | Authorized friend lookup repeats the visible home label in the result row and persistent status. | Removed the duplicate result paragraph and retained the single persistent `role=status` as the visible, focusable authorized result and live announcement. The controller gives that status the result focus key and `tabindex=0` only while authorized, and removes both during edit or IME invalidation. The refreshed presentation/browser run passes 28 tests; housing/prompt/focus regressions pass 87 tests across three files. The additional IME regression passes 23 tests. The fresh reviewer accepted the repair and completed source/image review; the shared gate and final independent verdict also pass. |
| FFR03 | New `KEY_SHOTS_DIR` override lacks a Turborepo environment declaration. | Added the name to `globalPassThroughEnv`, alongside the existing screenshot-directory convention. Four-file Biome inspection has no findings; all 14 gate task-cache tests pass. This is a hygiene warning, not a demonstrated direct-Node cache defect. Runtime and producer hashes are unchanged. |
| DOC01 | Final execution ledger still labels completed acceptance evidence as pending. | Relabeled the old paragraph as a historical checkpoint and explicitly linked its completed freshness, gate and review steps to the final results below. Only verdict packaging and the subsequent actual-last-commit check remain prospective. No runtime or test change is involved. |

## Scope decisions applied

- Remote production key authority remains fail-closed until 07/07a. The later,
  explicit authority contract controls the earlier blanket online-success wording.
  Injected participant success proves dispatch only.
- The exact M16 predicate governs the required five-locale fills; English was not
  rewritten to evade it. Nonqualifying additions were removed.
- The user's capture prohibition applies to all Freehold-reachable capture code:
  game access is observation-only and movement uses real browser input. Unrelated
  legacy perf scenarios were not rewritten.
- Reserved future Cottage anchors are intentionally invisible and noncolliding.
  Current shell images do not approve later lighting, camera, visiting or final art.
- Inherited unused declarations in the explicitly audited touched files were fixed.
  No general repository cleanup was performed.

See [the execution ledger](execution.md) for the commands and retained logs. A
focused green test closes its stated regression; it does not replace the final
shared gate, fresh full-fix review or artifact acceptance.
