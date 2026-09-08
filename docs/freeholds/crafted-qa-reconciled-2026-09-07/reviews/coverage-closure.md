# Coverage closure supplement

Reviewed staged candidate `/tmp/freeholds-qa-current/availability-fixed.ts` and shared scratch mutation evidence. The candidate had not yet been installed in the live worktree when reviewed. No source/test edits or test execution by this reviewer.

## COV-1: resolved in the proposed preservation cases

The proposed fixture at line 22 contains the nonempty unrelated known recipe sentinel `recipe_copper_bearded_axe`. The ten training/grant/crafting rows snapshot the complete Set and compare it after each acquisition refusal and after carried-knowledge craft refusal (lines 106, 116, 125, 139). The three carried-manual cases compare the complete inventory, full knowledge Set and literal copper 10000 (lines 154-160). This now distinguishes preserving a player's knowledge from merely leaving the attempted recipe unknown.

The three dark quartermaster cases additionally arm copper 10000, the same knowledge sentinel and an unrelated copper_ore inventory row. Lines187-192 compare the complete inventory, full known Set and copper before the ordinary-pattern purchase control. The existing control remains meaningful: exactly 12 Marks buy the ordinary manual after the denied furnishing purchase leaves 20. No production learning, acquisition or vendor function is mocked or reimplemented.

Shared command and outcomes inspected: `npx vitest run tests/freehold_crafted_availability.test.ts --maxWorkers=2` in the disposable scratch tree, recorded by `/tmp/freeholds-qa-current/knowledge-mutation.json`. Baseline 17 passed, exit 0; clearing prior knowledge mutant 3 failed/14 passed, exit 1; restored 17 passed, exit 0. `/tmp/freeholds-qa-current/knowledge-mutant.log` shows all three furnishing manuals fail at the new full-Set assertion, received empty Set versus `Set{'recipe_copper_bearded_axe'}`. These failures are the intended regression signal, not compilation/configuration errors.

Verdict for COV-1: **proposed repair accepted, mutation demonstrated**. Live integration and the coordinator's final rerun remain necessary.

## PER-1 authored lit/dark/relit roundtrip

The extra test at candidate line 27 is outside the 17-test mutation receipts above and was unexecuted when inspected. It uses actual Sim serialization, a JSON stringify/parse boundary, real `addPlayer(...,{state})` load into a dark Sim, then the dark save into another lit Sim. Both restored hosts independently assert all ten known recipes, all thirteen actual item copies, copper 12345, item discovery, full Reliquary state, each furnishing firstFind `{count:1}`, and Hearth page illumination. Literal cohort counts plus the existing independent item/recipe pins keep the authored sweep nonempty and bounded.

This is a substantive test of persistence across host capability changes. Full inventory equality also compares retained per-copy payloads to the initial serialized baseline. One narrow strengthening was sent to the coordinator: line 45 deliberately seeds a signer, but line 60 compares only against the FIRST serialized output, so a serializer stripping that signer before the baseline is captured would pass. If this case claims signer preservation too, independently assert the expected signer-only payload on the authored item in the initial and restored inventories; that closes the first-serialization blind spot without restating implementation logic.

The sparse `{count:1}` expectation reflects the actual non-clear-source relic discovery contract; adding a `clears:0` field would assert a nonexistent serialization obligation. The coordinator corrected this draft expectation after reading production behavior, before running the test.

This supplement reviews the COV-1 repair and PER-1 candidate quality only. It does not replace the required independent fresh review of the entire final fix round, and does not claim the new roundtrip test or final gate has passed.
