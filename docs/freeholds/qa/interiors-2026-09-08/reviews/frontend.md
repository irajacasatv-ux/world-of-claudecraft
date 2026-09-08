# Frontend COVERAGE review

Historical initial review of `6540713541..67281f8ed4`, by `/root/frontend`
(`woc_frontend`). The read-only reviewer returned this report inline; the
coordinator retained it and this durable copy expands compressed prose without
changing the findings. No files were edited or tests rerun by the reviewer.
See [current dispositions](../findings.md) and [executed checks](../execution.md).

The reviewer found three unique SHOULD-FIX issues and three verification groups.
No additional issue was found in pure-core registration, simulation mutation,
cold DOM discipline, graphics fairness or marker localization.

## FE01: keyboard activation leaks into gameplay bindings

P1, high confidence. `gate_prompt_controller.ts` creates its root without the
shared button key guard or pointer-focus helper. The gate is deliberately
excluded from `Hud.isModalOpen()`, leaving gameplay enabled. Enter on a button
reaches `Input.onKeyDown` and opens Chat or moves focus; Space is prevented for
Jump rather than activating the native control. SELECT also falls through the
input/textarea exemption. Compose the shared helpers and preserve native select
activation. Actual browser Enter/Space on tabs, Find Home, Enter, Close and the
select must perform only their intended action; click unit tests are insufficient.

## FE02: Escape cannot cancel from the character name field

P2, high confidence. The gate input handler handles Enter only, while the game
input handler returns for focused inputs before dispatching Escape. Escape during
name entry cannot close the prompt or return focus. Use the shared close lifecycle
while preserving IME composition. Test actual input focus, Escape, closure, zero
entry and returned focus. Existing tests called the close method directly.

## FE03: stale eligibility leaves an inert enabled Enter button

P2, medium confidence. The controller silently returns when `canEnter` becomes
false. Movement, death or gate loss after opening leaves an enabled control with
no feedback; this window does not pause movement. The existing test only proves
no command is sent. Refresh the unavailable state or close the stale prompt on
rejected activation. No polling is necessary.

## Inspected claims

- UI uses `IWorld` and local drafts without simulation mutation. Explicit world
  commands and an injected visit adapter own entry.
- `housing_view` owns request/name identity, capability invalidation, authorization
  and the single total denial selector. The controller owns lifetime/focus; the
  painter escapes markup. Architecture/performance classifications exist and HUD
  remains a composition seam.
- Tests reject old request IDs, wrong normalized names, same-name stale responses
  and detached controls. Editing invalidates a result; failure preserves the draft;
  the own tab cannot consume friend capability. Production visiting belongs later.
- Pending sends suppress duplicates, denial re-arms, a self sequence closes an
  accepted entry, reopening creates a fresh intent, and reconnect retires uncertain
  intent without replay. Full/busy uses the denial path.
- Painting is event-driven, with no timer, forced layout or hot-path bypass.
  Reconciliation exits without pending work; the painter does not write DOM.
- Visible, aria, placeholder, status and denial copy is keyed, and names are
  escaped. The tooltip uses live cooldown and locale formatting, the exact required
  sentence and no second-home claim.
- The gate has its own semantic kind, layer, accessibility and entrance art.
  Social/admin labels are localized and graphics tiers omit no actionable facts.
- CSS uses shared layers/tokens, safe insets and touch transforms. Forced-color
  focus styling applies; selected tabs are underlined.
- The reviewer personally inspected all 18 initial PNGs: real before-quay images
  and after prompt/Inn/Cottage images at desktop, compact and tablet sizes fit
  without an overlay. Compact sidecars record controls at least 40 by 40 and a
  16-pixel select. These are functional shells, not final 09 lighting evidence.

The shared initial ledger recorded 25 files and 983 passing tests with three
release-only localization skips. Its initial GPU tour had positive drawn frames
and zero required interior event deltas. Painter-host, HUD performance, CSS,
focus/browser and final shared gate evidence was pending at the time of review.

## Verification groups

1. Actual keyboard, pad and touch cancellation, focus trap/return and native
   activation after FE01/FE02.
2. Compact friend lookup, pending/refusal/busy/full/recovery, IME, software keyboard,
   non-Latin text and forced colors. The canonical nine variants cover only the
   own prompt and two room arrivals.
3. Low-preset map marker interaction/accessibility and browser live-region
   announcements. Markup and pixels do not establish assistive output.

The fifteen non-M16 fills and inherited rental narrative were independently
corroborated and counted in hygiene, not again here. Renderer lifecycle issues
remain in the renderer report. This historical report grants no final QA PASS.
