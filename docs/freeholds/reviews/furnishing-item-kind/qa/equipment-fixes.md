# Furnishing equipment fixes

Owned files:

- `src/sim/entity.ts`
- `src/sim/set_bonus_mods.ts`
- `src/sim/equipment_rules.ts`
- `tests/furnishing_equipment_power.test.ts`

## Finding mapping

- C1: Added kind admission to the existing stat/set projection, mainhand resolution, and engine-set count. Furnishings retain their saved equipment slots and copy payloads but contribute no base or rolled stats, weapon damage, weapon identity, set stats, set procs, or engine-set modifiers.
- C6: Furnishings are never unique-equipped and never count as incoming or worn Masterwrought equipment. This prevents valid inherited legendary/heroic metadata or malformed Masterwrought data on a saved furnishing from blocking eligible gear.

No schema, character load normalization, save serializer, inventory operation, equipment mutation, generated asset, or dependency changed. Existing non-furnishing admission is preserved. The shared sim seams remain the only runtime implementation.

## Test evidence

The coordinator ran the new suite before production edits. After correcting an invalid test signer, the result was nine failing cases and two passing proc cases. The nine failures exercised the expected stat, weapon, set, and equipment-limit defects. The two controls proved that the existing authored/enchant proc guard was already safe and retained successful real-weapon procs.

Eleven registered cases cover:

- Typed furnishing definition plus typed rolled instance stats through serialize/addPlayer.
- Raw recalculation with malformed base stats, all rating families, healing power, and instance stats.
- Saved mainhand/offhand furnishings with malformed weapon metadata and a real weapon control.
- Raw stat-set bonuses and set procs with a synthetic eligible armor control.
- Raw engine-set counting, character modifiers, and actual loaded modifiers with a synthetic eligible armor control.
- Authored and enchant proc refusals in both hands, with exact zero RNG draws and unchanged auras/save, followed by a working weapon control.
- Authored and promoted legendary uniqueness, both incoming/worn family directions, and successful real equip after restore.
- Both Masterwrought caps, both incoming/worn directions, and successful real equip after restore.

The load helper asserts input save immutability, exact reserialized equipment/copy/bag preservation, and unchanged copy associations on entity mirrors. Synthetic item ids are restored after every case.

Two fixture corrections were needed without relaxing assertions: a valid signer (`Testmaker`) survives production signer validation, and a synthetic legendary gear control needs `requiredLevel: 1` to reach equipment-limit admission at level one instead of the default source-less legendary level gate.

Final validation is coordinator-owned. This worker ran no tests, TypeScript, gate, staging, or commit commands.
