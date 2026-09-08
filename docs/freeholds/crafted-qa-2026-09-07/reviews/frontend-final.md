# Independent frontend closing review

Coordinator transcription of the final read-only `frontend_finish` report. The reviewer inspected source and supplied evidence; it did not edit files, rerun tests, launch a browser or generate art. Source scope: original `49ed3f0933..3666d89647`, integration `2e24ba8818`, subsequent guide/manual repairs and the final mobile toast CSS committed in `5f4821bec7`.

**Verdict:** no unresolved defect found in the reviewed frontend diff. The cooking-guide finding and F16 are repaired and verified. This is a frontend verdict; the coordinator's final integrated gate and the unresolved F01 requirement conflict remain separate completion conditions.

| Finding | Severity / confidence | Closure |
| --- | --- | --- |
| Cooking guide implied Set Supper Table was edible | P2 / high | The generator derives furnishing classification from item kind; the provisioning page labels ornamental outputs and uses corrected prose. Generated-data tests and desktop/mobile/Japanese captures verify the correction. |
| F16: retained furnishing manuals advertised unavailable learning, including silent mobile refusal | P3 / high | The tooltip explains realm unavailability; the bag hint suppresses its generic Use instruction. The actual Use handler reads current capability and supplies localized feedback before a command. Mobile CSS places that feedback above Bags. Actual touch before/after pixels and the browser regression close visibility. Touch and layering repairs belong to the existing F16. |

## Reviewed implementation

- Trainer, vendor and crafting models consume `IWorld` projections. Availability stays in the shared predicate. The new Use guard calls the existing error seam and returns without mutating simulation state. Tooltip logic remains in focused modules.
- The crafting refresh signature includes realm capability. The reconnect test drives both directions and requires exactly one repaint while preserving inventory, knowledge, vault state and position. No new per-frame DOM writes, forced layouts, GPU producers, graphics-tier gates or frame-rate-dependent information hiding were introduced.
- The only new presentation rule uses the existing mobile layer and transient `z-index: 96` band above the `95` Bags sheet. Pointer inertness, desktop stacking, toast duration and chat mirroring remain. No new token, framework or inline product style was added.
- The guide adds translated prose/tag keys with the five required M16 fills. Manual refusal reuses `apiError.freehold.disabled`. The obsolete guide key is correctly retired; owning generation removes it from 15 pending locale lists without changing visible copy or reviewed overlays.
- Trainer and quartermaster filters preserve ordinary rows and existing affordability/skill states. Bag and market classification preserve furnishing semantics. The actual Hearth page test renders all ten entries rather than assuming an eight-item cap.
- Furnishing-aware action-bar, enchant-target and comparison behavior retain upstream unsaved-change, Rift-gear and rolled-stat behavior. Furnishings remain decorative. Actionable information does not depend on graphics quality.
- The original runtime manifest covers thirteen shipping icons and the relevant trainer/vendor/bag/Hearth surfaces. QA regenerated none of those accepted artifacts. This review does not certify final GLB geometry or hardware performance.

## Independently inspected visuals

Paths below are under `docs/screenshots/freehold-crafted-content-2026-09-07/qa/`.

| Evidence | Result |
| --- | --- |
| `guide-before` and earlier `guide-after`, six frames each | Corrected prose and the Set Supper Table tag are readable on desktop, narrow mobile and Japanese pages. Existing meal, feast and field-station distinctions remain. The final source sequence is `combined-after`. |
| `manual-before`, five frames from immutable integration source | Reproduces misleading desktop/forced-color tooltips and silent actual mobile Use. Enabled controls consume one manual and learn once. |
| `combined-after`, final eleven frames | All frames inspected. Corrected guide, enabled/disabled desktop controls, actual mobile refusal, enabled mobile control and forced-color tooltip pass. |
| `refusal-layer-before`, intermediate quiet mobile frame | Feedback is obscured behind Bags despite positive opacity and viewport measurements. This is failed-before evidence. |

Final mobile refusal is decisive: actual tap then Use produces zero `useItem` calls, retains one manual, leaves the recipe unknown and visibly displays the complete bright warning above Bags. Use measures 134 by 40 CSS pixels; the bag row measures 42.8125 by 42.8125. Enabled mobile Use calls once, consumes one copy and learns once. Its later tooltip uses an explicitly separate restored fixture.

Desktop and forced-color frames show focused rows, readable warning text, no misleading Use hint and tooltips inside the viewport. The forced-color leg records `forcedColors: true`. All final manual legs record English after the Japanese guide legs, completing F24's sequence evidence.

## Inspected test evidence

These are coordinator/owner executions inspected by the reviewer, not new reviewer reruns. Log basenames refer to `../logs/`.

| Log | Outcome |
| --- | --- |
| `freeholds-crafted-qa-guide-after.txt` | 2 files, 152 tests passed |
| `freeholds-crafted-qa-pattern-tooltip-final.txt` | 3 files, 185 tests passed |
| `freeholds-crafted-qa-touch-before.txt` | Intended 12 failures, 19 passes |
| `freeholds-crafted-qa-touch-final.txt` | 5 files, 328 tests passed |
| `freeholds-crafted-qa-toast-layer-before.txt` | Intended overlap hit-test failure; desktop control passed |
| `freeholds-crafted-qa-toast-layer-after.txt` | 2 browser files, 5 tests passed, including the existing heroic-loot/Bags coverage |
| `freeholds-crafted-qa-combined-after-quiet-final.txt` | Owner-observed exit 0, 11 captures, no target or page exception |

The browser test proves overlapping paint order with the shipping stylesheet, restores pointer inertness and proves taps pass through. The Use-case source pin stays bounded to its own case and retains the gathering fallback assertion. Stale `BagItemInfo` and happy-dom comments are corrected. No additional open nit was found.

## Verification limits

The coordinator must append the final integrated gate, shared browser suite, typecheck/build and generated-freshness results after the last changes. Captures establish actual keyboard activation and focused presentation; they do not alone establish complete Tab/Escape/focus-return travel or screen-reader announcements. The shared browser/accessibility suite owns those broader claims. Firefox/WebKit, physical-device safe areas and hardware LOW performance are not certified here.

The final manifest retains 65 console entries: 29 HTTP 502 responses and 36 character-preload warnings. Saved Vite evidence attributes the offline API proxy failures to the unavailable local backend. These captures support the reviewed UI claims, not a zero-console or general 3D-loading claim.
