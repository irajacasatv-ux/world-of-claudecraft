# Freehold content

Data only, exposed through `index.ts`. Housing behavior belongs under
`src/sim/freehold/` and must not be added to these catalogs.

- `tiers.ts` owns frozen persisted tier ids, approved tier targets, and the
  shared-row lookup. Never rename or reuse a tier id. Keep every exported
  collection and nested row immutable at runtime.
- `charters.ts` owns stable charter ids and their tier grants only. Prices,
  availability, and display copy belong to the owning external catalogs.
- `ledger_schedule.ts` owns approved material eligibility identities. Material
  tiers are distinct from housing tiers. Each alternative remains a separate
  choice, and every grade list stays in base-before-fine order.
- `FREEHOLD_LEDGER_SCHEDULE.schedule` is `null` until CAL-LEDGER-A has measured
  evidence and explicit approval. Eligibility is not an approved production
  schedule. Do not infer quantities, a cycle, or a version from unrelated data.

Source record: `docs/freeholds/content-source-freeze-2026-09-07.md`.
Pins: `tests/freehold_content.test.ts` and the ledger eligibility arm of
`tests/provisioner_firewall.test.ts`. Extend the latter in place for every new
ledger alternative or approved schedule; preserve its existing exclusions.
