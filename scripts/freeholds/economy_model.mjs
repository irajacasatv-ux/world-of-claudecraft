// Review-only TUNING arithmetic. No runtime content imports or activation writes.

export function roundTrialUnits(observedUnits, numerator = 1, denominator = 10) {
  for (const value of [observedUnits, numerator, denominator]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid unit ratio');
  }
  const product = observedUnits * numerator;
  if (!Number.isSafeInteger(product * 2 + denominator)) throw new Error('Unit overflow');
  const units = Math.floor((product * 2 + denominator) / (denominator * 2));
  if (units < 1) throw new Error('Observed supply does not support a positive trial line');
  return { observedUnits, numerator, denominator, rawUnits: product / denominator, units };
}

export function proposeLedger(eligibility, observations, items) {
  const families = ['ore', 'wood', 'herb', 'hide', 'cloth', 'fish'];
  const byFamily = (family) => eligibility.filter((row) => row.family === family);
  // Two nonproduce slots across six families need twelve rows to visit the
  // four fish alternatives. The four produce alternatives divide that cycle.
  const cycleLength = (families.length * Math.max(...families.map((f) => byFamily(f).length))) / 2;
  if (!Number.isSafeInteger(cycleLength) || cycleLength % byFamily('produce').length !== 0) {
    throw new Error('Roster no longer fits the proposed finite cycle');
  }
  const occurrences = new Map();
  const line = (row) => {
    const observation = observations.find(
      (candidate) =>
        candidate.family === row.family &&
        (candidate.materialTier === row.materialTier || ['hide', 'cloth'].includes(row.family)) &&
        candidate.measuredIds.includes(row.alternativeId),
    );
    if (!observation) throw new Error(`Missing observation: ${row.alternativeId}`);
    const unitVector = row.gradeIds.map((itemId) => ({
      itemId,
      units: observation.eligibleUnits[itemId] ?? 0,
    }));
    const observedUnits = unitVector.reduce((sum, item) => sum + item.units, 0);
    const rounding = roundTrialUnits(observedUnits);
    for (const itemId of row.gradeIds) {
      if (!Object.hasOwn(items, itemId)) throw new Error(`Missing item: ${itemId}`);
    }
    return {
      ...row,
      units: rounding.units,
      fixtureId: observation.fixtureId,
      sourceUnitVector: unitVector,
      rounding,
      achievedUnitShare: rounding.units / observedUnits,
      baseGradeNpcFloorCopper: items[row.gradeIds[0]].sellValue,
    };
  };
  const bills = Array.from({ length: cycleLength }, (_, cycleIndex) => {
    const selected = families.slice((cycleIndex % 3) * 2, (cycleIndex % 3) * 2 + 2);
    const alternatives = selected.map((family) => {
      const count = occurrences.get(family) ?? 0;
      occurrences.set(family, count + 1);
      const rows = byFamily(family);
      return rows[count % rows.length];
    });
    const produce = byFamily('produce');
    const lines = [produce[cycleIndex % produce.length], ...alternatives].map(line);
    const baselineCopper = lines.reduce(
      (sum, row) => sum + row.rounding.observedUnits * row.baseGradeNpcFloorCopper,
      0,
    );
    const billCopper = lines.reduce((sum, row) => sum + row.units * row.baseGradeNpcFloorCopper, 0);
    return {
      id: `cottage-trial-${String(cycleIndex + 1).padStart(2, '0')}`,
      cycleIndex,
      tierId: 'cottage',
      lines,
      sensitivityOnly: {
        valuation: 'NPC base-grade vendor floors, not an accepted market snapshot',
        baselineCopper,
        billCopper,
        achievedShare: billCopper / baselineCopper,
        roundingShareBound:
          lines.reduce((sum, row) => sum + row.baseGradeNpcFloorCopper / 2, 0) / baselineCopper,
      },
    };
  });
  return {
    status: 'TUNING_PROPOSAL_AWAITING_OWNER_ACCEPTANCE',
    contentVersion: 'freehold-ledger-tuning-v1',
    cycleLength,
    productionApproved: false,
    approval: null,
    operationalRealmWeekAnchor: null,
    allocation: 'One tenth of the selected resource vector in each separate lab fixture',
    comparison: 'Per-line unit shares; NPC-floor copper is sensitivity evidence only',
    marketSnapshot: null,
    burdenToleranceApproval: null,
    bills,
  };
}

export function proposeVendors(itemIds, items, oreObservation) {
  const comparator = items.linen_pouch;
  const setComparator = items.travelers_knapsack;
  if (
    comparator?.buyValue === undefined ||
    comparator.quality === undefined ||
    comparator.noVendorSell ||
    setComparator?.buyValue === undefined
  ) {
    throw new Error('Vendor comparator is incomplete or not sellable');
  }
  const oreFloor = items.copper_ore?.sellValue;
  const copperUnits = oreObservation?.eligibleUnits.copper_ore;
  if (!(oreFloor > 0) || !(copperUnits > 0)) throw new Error('Missing ore sale observation');
  return {
    status: 'TUNING_PROPOSAL_AWAITING_OWNER_ACCEPTANCE',
    contentVersion: 'freehold-vendor-tuning-v1',
    productionApproved: false,
    approval: null,
    comparator,
    setComparator,
    proposedSetBuyCopper: comparator.buyValue * itemIds.length,
    rows: itemIds.map((itemId) => ({
      itemId,
      buyValue: comparator.buyValue,
      sellValue: comparator.sellValue,
      quality: comparator.quality,
      comparatorId: comparator.id,
      derivation: 'Copy the comparator retail, resale and quality tuple without a multiplier',
      rounding: 'No price rounding; whole observed comparator copper values',
      acquisition: {
        fixtureId: oreObservation.fixtureId,
        copperOreUnitsAtNpcFloor: Math.ceil(comparator.buyValue / oreFloor),
        observedCopperOreUnits: copperUnits,
        observedCopperFloor: copperUnits * oreFloor,
        observedCastSeconds: oreObservation.activeCastSeconds,
        interpretation: 'Gross ordinary ore sale equivalent; excludes travel and tool purchase',
      },
    })),
  };
}
