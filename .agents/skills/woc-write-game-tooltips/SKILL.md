---
name: woc-write-game-tooltips
description: "Write or audit World of ClaudeCraft spell, talent, aura, item, and mechanic tooltips in plain English, with live damage, healing, timing, target, resource, and power-scaling accuracy. Use for every player tooltip change or tooltip clarity review."
---

# Write game tooltips

Write tooltips from the live mechanic, not from existing prose. A clarity review or
audit is read-only unless authoring or fixes are authorized. Apply the rewrite and
test-change steps below only to authorized changes; use existing coverage for prose-only edits.

## Workflow

1. Read `docs/design/tooltip-writing.md` in full.
2. Inspect the content record, runtime handlers, resolved ability path, and focused tests.
3. Record the target, result, timing, values, scaling stat, triggers, caps, and consumption rules.
4. Rewrite the authoritative English source in short, direct sentences.
5. Use live resolved values when rank, gear, talents, or specialization can change a number.
6. For changed behavior, add or update a focused test comparing the tooltip with the combat result.
7. Run the relevant mechanic, tooltip, i18n, and type checks.

## Rules

- Do not claim scaling that the combat path does not use.
- Name Attack Power, Ranged Attack Power, Spell Power, weapon damage, pet state, or flat damage
  correctly.
- State every important trigger, cap, stack, target limit, reset, and resource change.
- Explain named states in plain English.
- Do not repeat metadata without a clear reason.
- Edit English sources first. Do not hand-edit locale overlays or generated i18n output.

Record a mismatch when code and intended design disagree. Do not make a tooltip promise
unfinished behavior or change mechanics outside the authorized scope. Continue independent
authorized work while reporting the unresolved claim.
