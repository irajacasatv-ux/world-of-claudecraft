# Freehold content

Data only, exposed through `index.ts`. Housing behavior belongs under
`src/sim/freehold/` and must not be added to these catalogs.

- `items.ts` owns the permanent soulbound Hearth Key tool; its use action never
  consumes the item and possession never establishes plot ownership.
- `tiers.ts` owns frozen persisted tier ids, approved tier targets, and the
  shared-row lookup. Never rename or reuse a tier id. Keep every exported
  collection and nested row immutable at runtime.
- `charters.ts` owns stable charter ids and their tier grants only. Prices,
  availability, and display copy belong to the owning external catalogs.
- `ledger_schedule.ts` owns approved material eligibility identities. Material
  tiers are distinct from housing tiers. Each alternative remains a separate
  choice, and every grade list stays in base-before-fine order.
- `dungeons.ts` owns the two owner-keyed `DungeonDef` records (`freehold_inn_room`
  index 15, `freehold_cottage` index 16) and their exported ids. Both stay
  `claimKey: 'owner'`, `spawns: []`, without `objects`, `overworldDoor: false`,
  `guideVisible: false` and absent from `FINDER_ACTIVITIES`; `enterText` and
  `leaveText` stay unique across `DUNGEON_LIST` and their `entities.dungeons.*`
  rows derive from the def (`src/ui/world_entity_i18n.ts` `DUNGEON_IDS`).
  Never take index 6 or 7, and never add a lootable object here.
- `ledger_trial.ts` owns the accepted, deeply frozen development cycle and its
  version. `getFreeholdLedgerTrialBill` takes an injected nonnegative week
  ordinal, never a date, owner identity or RNG. The upkeep owner supplies the
  authoritative calendar mapping and preserves published version/anchor keys.
- `FREEHOLD_LEDGER_SCHEDULE` identifies the accepted development evidence;
  `productionApproved` remains false and `productionSchedule` remains null.
  Neither the trial lookup nor a host opt-in approves production spending.
  Never retune a published version or derive bill units from current prices.

Source record: `docs/freeholds/content-source-freeze-2026-09-07.md`.
Development acceptance: `docs/freeholds/content-trial-2026-09-07/acceptance.md`.
Pins: `tests/freehold_content.test.ts`, `tests/freehold_dungeon_defs.test.ts` and the ledger eligibility arm of
`tests/provisioner_firewall.test.ts`; every literal trial row and lookup boundary
is pinned by `tests/freehold_ledger_schedule.test.ts`. Extend the firewall in
place for every new ledger alternative or schedule; preserve its exclusions.
