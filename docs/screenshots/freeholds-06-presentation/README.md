# Gate prompt presentation fixtures

These 20 images are narrow-layout presentation fixtures from the composed gate
browser tests. They supplement the canonical functional capture registry; they
do not add registry variants or claim physical-phone or production-online proof.

The executed producer command was:

```sh
VITE_FREEHOLD_PRESENTATION_CAPTURE=1 npx vitest run --config vitest.browser.config.ts tests/browser/freehold_gate_input.browser.test.ts
```

The run exited 0 with 28 browser tests passing after the duplicate result/status
repair, now committed in `8e9f11d4eefe8d2a77551ab9022b83dc1fabcc49`. The PNGs
were refreshed after that repair. Every file's PNG header measures **333 by 720
pixels**. The harness requested 390 by 844, but browser-runner iframe scaling
produced the observed smaller images. These files must not be described as
390-by-844 viewport captures. The canonical compact functional captures at
874 by 402 supply the separate actual viewport and touch-target evidence.

## Covered presentation states

| Images | State shown |
| --- | --- |
| `friend-nonlatin-draft.png`, `friend-name-required.png` | Non-Latin draft and required-name feedback. |
| `friend-lookup-pending.png`, `friend-lookup-result.png`, `friend-lookup-retry.png` | Pending, authorized result and retained draft for retry through the injected test adapter. |
| `entry-pending.png` | Pending entry feedback and duplicate suppression presentation. |
| `stale-range.png`, `stale-death.png`, `stale-disabled-host.png`, `stale-gate-removed.png` | Unavailable entry after eligibility changes. |
| `denied-no_freehold.png`, `denied-busy.png`, `denied-locked.png`, `denied-dead.png`, `denied-combat.png`, `denied-cooldown.png`, `denied-instanced.png`, `denied-match.png`, `denied-not_friend.png` | The nine distinct keyed denial strings. Multiple enum tokens may select the same string. |
| `forced-colors.png` | Focus and selected-state styling under forced colors. |

Dormant visiting/refusal states use an explicitly injected presentation adapter.
Production visiting belongs to 18, and durable online Hearth Key authority and
the committed private mirror belong to 07/07a. These fixtures grant neither.
The images show appearance; the executed browser tests provide keyboard, pad,
trusted touch, IME, focus-return and announcement behavior. Pixels alone do not
prove assistive output or interaction.

The [QA execution ledger](../../freeholds/qa/interiors-2026-09-08/execution.md)
records the commands and limits. The real-game Hearth Key captures live in the
separate sibling evidence directory and are not replaced by these fixtures.
