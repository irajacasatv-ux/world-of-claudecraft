# Furnishing action admission fixes

Ownership: `src/sim/rift/progression.ts`, `src/sim/sim.ts`,
`src/sim/professions/feast.ts`, and their three new furnishing regression suites.
No staging, commits, test execution, assets, generated files, locale overlays,
database calls, or stored shapes were changed by this worker.

## Q28: Rift command admission

The shared Rift inventory selector rejects furnishing definitions before its
named-slot and legacy-id branches. Upgrade, enchant, and gem socket commands
therefore return `not_rift_gear` before spending essence or gems, rebuilding
rolled stats, or advancing the inventory revision.

`tests/furnishing_rift_admission.test.ts` exercises all three commands with both
selection forms in the offline Sim and through ClientWorld, GameServer dispatch,
authoritative result events, and decoded snapshots. Every refusal compares the
saved character, entire PlayerMeta, all entities, counts, and RNG calls. Every
same-call shell control verifies literal spending and resulting stats while
preserving the furnishing copy. Client tests also pin absence of local prediction.

The stock UI has no forge invocation or candidate list. The existing server gate
requires `RIFT_FORGE_ENABLED=1`; tests opt in explicitly and restore the environment.
The default-closed policy remains owned by `tests/rift_forge_gate.test.ts`.

## Q32: Automatic gear comparison

`Sim.maybeAutoEquip` compares weapon damage only against a current weapon and
ignores a current furnishing in the armor comparison. The latter deliberately
preserves all other current kinds, including a valid offhand weapon. The Sim file
has exactly four replaced lines and no line-count growth.

`tests/furnishing_auto_equip.test.ts` grants real mainhand weapons, helmet armor,
offhand shields, held offhands, and jewelry through `Sim.addItem` with automatic
equipment enabled. It pins exact furnishing copy return, stronger/equal gear
retention, weaker gear replacement, a valid offhand weapon versus a zero-armor
held offhand, and an incoming furnishing armed with forged slot, weapon, and
armor fields.

## Q35: Shared feast family

The feast template census, apex-feast recipe predicate, direct placement action,
and direct consume action all reject furnishing definitions. Consumption refuses
before the eaten ledger, serving count, sitting state, or meal payload changes.
The generic consuming builder and existing dedicated wire meaning are unchanged.

`tests/furnishing_feast_admission.test.ts` supplies synthetic content before module
evaluation, proving the actual census rejects the furnishing while admitting a
real feast. It pins false apex credit, direct named/id placement with whole-state
and count preservation, and malformed furnishing dishes with unchanged servings
and a same-call food control carrying literal restoration and Well Fed values.

## Validation responsibility and evidence

The parent observed decisive red results before production edits:

- `/tmp/freeholds-02-audit/late-rift-discovery-red.log`: the Rift cases failed on
  actual state mutation.
- `/tmp/freeholds-02-audit/late-auto-equip-red.log`: all furnishing replacement
  cases failed while the initial ordinary-gear controls passed.
- `/tmp/freeholds-02-audit/late-feast-red.log`: every new feast case failed on its
  intended refusal, census, credit, or serving assertion.

This worker ran scoped formatting and `git diff --check`, both successfully.
The parent owns runtime validation, typechecking, the shared gate, and final review.
Recommended focused command:

```sh
npx vitest run tests/furnishing_rift_admission.test.ts tests/furnishing_auto_equip.test.ts tests/furnishing_feast_admission.test.ts tests/rift_progression.test.ts tests/rift_forge_gate.test.ts tests/auto_equip_gate.test.ts tests/professions_feast.test.ts --maxWorkers=3
```

Then run `npx tsc --noEmit`, the architecture and monolith guards, and the required
shared completion gate. No unresolved implementation concern remains in this
owned slice, subject to the parent's green results and fresh independent review.
