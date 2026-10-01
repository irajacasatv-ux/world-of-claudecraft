# Provenance of the `freehold_hearth_key` parity golden (2026-09-30)

The golden `tests/parity/golden/freehold_hearth_key.json` is the evidence that the 07a change
leaves the OFFLINE remote Hearth Key path exactly as it was (no rng draw moved, no event or
sampled state changed): it was minted on the commit BEFORE 07a and passes unchanged on the
07a code. The scenario is `freeholdHearthKey()` in `tests/parity/scenarios.ts`, its coverage
case is in `tests/parity/coverage_cases_d.ts`, and it runs in the `coverage_d.test.ts` shard.

## How it was minted

1. A temporary worktree at the pre-07a base, on disk:
   `git worktree add /home/fernando/Documents/wocc-parity-base 0008427d14`, dependencies
   through `pnpm install --frozen-lockfile --offline` (the shared store).
2. The scenario and coverage-case edits copied into that worktree, unchanged; they compile on
   the base's APIs as written.
3. Minted there: `UPDATE_PARITY=1 WOC_LANE_SUITES=1 npx vitest run tests/parity/coverage_d.test.ts
   -t freehold_hearth_key`.
4. The golden copied back into the main checkout and run there WITHOUT `UPDATE_PARITY`: the
   gate case and the coverage case pass.
5. The strict check: the golden deleted, re-minted on the 07a code, compared with `cmp`
   (identical), and the base copy restored. The worktree was removed and pruned.

The committed file (first added in `1343b080bd`) is the base mint:

```
sha256 cf730d556a47b9d4b3309eb4ef57999213629bd5e1d42a3607498803281b7911
```

## What the base run showed

On the base, the new coverage case failed at exactly ONE assertion, the clock map being empty
after the owner's last session leaves (`clocksAfterRelease`, 1 on the base, 0 on 07a): the
last-session eviction is the one behaviour 07a adds on this path. Every other assertion (the
admitted entry, the clock set to the use time plus `HEARTH_KEY_COOLDOWN_MS`, the single
`cooldown` denial, the denial moving nothing, the entry and the leave drawing nothing) passed on
the base. The whole scenario makes zero rng draws, so the golden pins "draws nothing": a draw
added anywhere on this path turns it red.

## Limits

The scenario does not drive the cooldown elapsing (one hour of sim time is 72,000 ticks); the
hour boundary stays covered by `tests/freehold_gate_and_key.test.ts`. The trace samples players
and entities, not the clock map, so the eviction itself is pinned through the coverage case's
notes; the golden pins that the eviction moved nothing else.
