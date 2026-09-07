# Simulation merge resolution

Compared Git stages 1, 2, and 3 for each owned conflict while merging
origin/feature/masterwrought d3dcdaa4af into c47e2cb245.

## Resolutions

- `src/sim/bank.ts`: retained both import sets. The branch's
  `isStorableItemKind` admission remains before any selection resolution or
  movement. All upstream material composition selection, source-aware movement,
  and load-time custody normalization remain unchanged.
- `src/sim/guild_bank.ts`: retained both import sets. The shared
  `guildBankPipeRefusal` retains the furnishing-compatible storability rule in
  both directions. All upstream material source legs, replay, selection,
  normalization, and custody behavior remain unchanged.
- `src/sim/professions/perfecting.ts`: accepted the upstream extraction of
  `perfectedBonusStats` and its budget helper into `perfecting_bonus.ts`.
  Preserved the furnishing refusals in the recipe resolver, host-shared view,
  and command admission. Keeping the old function body would have produced a
  duplicate declaration and referenced imports upstream had removed.
- `src/sim/professions/perfecting_bonus.ts`: relocated the furnishing refusal
  into the extracted helper, ahead of every stats read and budget operation.
  The upstream per-copy collection contribution behavior remains unchanged.
- `tests/perfecting_bonus.test.ts`: added a direct synthetic regression for
  the relocated helper. Malformed furnishing power fields return literal null;
  the same epic chest primary profile on eligible synthetic armor returns the
  literal `{ str: 19 }`. Also narrowed the existing retuning fixture to armor
  before spreading stats into it, because the expanded ItemDef union now
  correctly refuses a stats-bearing furnishing alternative.
- `tests/crucible_public_uniqueness.test.ts`: narrowed the existing pendant
  fixture to armor before adding the empty-set field, avoiding an invalid
  furnishing alternative in the expanded ItemDef union.

## Findings and follow-up

1. Resolved: upstream helper extraction would have lost the branch's furnishing
   bonus refusal if the deleted function were simply discarded. The refusal now
   lives in the extracted owner and has a direct regression plus an eligible
   control.
2. Resolved: upstream retuning fixture spread inferred an ItemDef alternative
   with furnishing and stats. The explicit armor precondition now narrows it.
3. Resolved: upstream empty-set fixture spread inferred an ItemDef alternative
   with furnishing and set. The explicit armor precondition now narrows it.
4. Audit consideration, uncertain: the new `perfecting_swap.ts` gates through
   fixed Crucible collection membership and recipe presence, without an explicit
   kind check in `validProgress`. The new `withPerfectingBonus` similarly uses
   collection membership. Synthetic furnishing ids are outside that static
   allowlist and are refused. A deliberately malformed existing collection def
   changed to furnishing would need separate scrutiny. Reported to the parent
   for the independent consumer census; no unrequested rule change made here.

No further nits found in the owned resolution. No SQL or query redesign, staging,
commits, or test commands were performed. The parent owns test execution and the
complete gate. The conflict-marker scan over all owned files returned no matches
(rg exit 1). Final comparison against the upstream branch leaves only the branch
admission guards, their relocated helper guard, and the described test additions.
