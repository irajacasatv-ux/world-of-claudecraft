import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_CHARTERS,
  FREEHOLD_LEDGER_ELIGIBILITY,
  FREEHOLD_LEDGER_SCHEDULE,
  FREEHOLD_TIER_IDS,
  FREEHOLD_TIERS,
  freeholdTierById,
  isKnownFreeholdCharterId,
} from '../src/sim/content/freehold';
import { ITEMS, NPCS } from '../src/sim/data';

const SOURCE_FREEZE = 'docs/freeholds/content-source-freeze-2026-09-07.md';

describe('Freehold content source freeze', () => {
  it('pins the approved tier targets and persisted save ids literally', () => {
    expect(FREEHOLD_TIERS).toEqual([
      { id: 'inn_room', rooms: 1, decorBudget: 20, plinths: 3, amenitySlots: 0, upkeep: false },
      { id: 'cottage', rooms: 1, decorBudget: 60, plinths: 4, amenitySlots: 1, upkeep: true },
    ]);
    expect([...FREEHOLD_TIER_IDS]).toEqual(['inn_room', 'cottage']);
    expect(FREEHOLD_TIER_IDS.size).toBe(2);
  });

  it('returns shared frozen tier rows and refuses unknown or inherited ids', () => {
    expect(Object.isFrozen(FREEHOLD_TIERS)).toBe(true);
    for (const tier of FREEHOLD_TIERS) {
      expect(Object.isFrozen(tier), tier.id).toBe(true);
      expect(freeholdTierById(tier.id), tier.id).toBe(tier);
      expect(FREEHOLD_TIER_IDS.has(tier.id), tier.id).toBe(true);
      expect(() => Object.assign(tier, { decorBudget: 999 })).toThrow();
    }
    expect(() => Array.prototype.pop.call(FREEHOLD_TIERS)).toThrow();
    for (const id of [
      '',
      'inn',
      'manor',
      '__proto__',
      'constructor',
      'toString',
      'hasOwnProperty',
    ]) {
      expect(freeholdTierById(id), id).toBeUndefined();
      expect(FREEHOLD_TIER_IDS.has(id), id).toBe(false);
    }
  });

  it('publishes the complete read-only set contract without runtime mutators', () => {
    const ids = FREEHOLD_TIER_IDS;
    expect(Object.isFrozen(ids)).toBe(true);
    for (const method of ['add', 'delete', 'clear']) {
      expect(Reflect.get(ids, method), method).toBeUndefined();
    }
    expect(() => Set.prototype.add.call(ids, 'manor')).toThrow();
    expect(() => Object.defineProperty(ids, 'has', { value: () => true })).toThrow();
    expect([...ids.keys()]).toEqual(['inn_room', 'cottage']);
    expect([...ids.values()]).toEqual(['inn_room', 'cottage']);
    expect([...ids.entries()]).toEqual([
      ['inn_room', 'inn_room'],
      ['cottage', 'cottage'],
    ]);
    const receiver = { visited: [] as string[] };
    ids.forEach(function (this: typeof receiver, value, key, owner) {
      expect(this).toBe(receiver);
      expect(key).toBe(value);
      expect(owner).toBe(ids);
      this.visited.push(value);
    }, receiver);
    expect(receiver.visited).toEqual(['inn_room', 'cottage']);
  });

  it('pins the charter id and Cottage-only grant without prices or display copy', () => {
    expect(FREEHOLD_CHARTERS).toEqual({
      freehold_charter_cottage: { id: 'freehold_charter_cottage', tier: 'cottage' },
    });
    expect(Object.isFrozen(FREEHOLD_CHARTERS)).toBe(true);
    const charter = FREEHOLD_CHARTERS.freehold_charter_cottage;
    expect(Object.isFrozen(charter)).toBe(true);
    expect(Object.keys(charter).sort()).toEqual(['id', 'tier']);
    expect(freeholdTierById(charter.tier)).toBe(FREEHOLD_TIERS[1]);
    expect(isKnownFreeholdCharterId('freehold_charter_cottage')).toBe(true);
    for (const key of [
      'price',
      'priceUsd',
      'costClaudium',
      'name',
      'displayName',
      'lore',
      'copy',
    ]) {
      expect(Reflect.has(charter, key), key).toBe(false);
    }
    expect(() => Object.assign(charter, { tier: 'inn_room' })).toThrow();
    expect(() => Object.assign(FREEHOLD_CHARTERS, { unknown: charter })).toThrow();
    for (const id of [
      '',
      'cottage',
      'freehold_charter_manor',
      '__proto__',
      'constructor',
      'toString',
      'hasOwnProperty',
    ]) {
      expect(isKnownFreeholdCharterId(id), id).toBe(false);
    }
  });

  it('pins every approved family, source tier, alternative, and base-before-fine grade', () => {
    expect(
      FREEHOLD_LEDGER_ELIGIBILITY.map((row) => [
        row.family,
        row.materialTier,
        row.alternativeId,
        row.gradeIds,
      ]),
    ).toEqual([
      ['ore', 1, 'copper_ore', ['copper_ore', 'fine_copper_ore']],
      ['ore', 2, 'iron_ore', ['iron_ore', 'fine_iron_ore']],
      ['wood', 1, 'ironbark_log', ['ironbark_log', 'fine_ironbark_log']],
      ['wood', 2, 'ashwood_log', ['ashwood_log', 'fine_ashwood_log']],
      ['herb', 1, 'silverleaf_herb', ['silverleaf_herb', 'fine_silverleaf_herb']],
      ['herb', 2, 'goldleaf_herb', ['goldleaf_herb', 'fine_goldleaf_herb']],
      ['hide', 1, 'rough_hide', ['rough_hide']],
      ['hide', 2, 'rough_hide', ['rough_hide']],
      ['cloth', 1, 'homespun_cloth', ['homespun_cloth']],
      ['cloth', 2, 'homespun_cloth', ['homespun_cloth']],
      ['fish', 1, 'raw_mirror_trout', ['raw_mirror_trout']],
      ['fish', 1, 'raw_river_perch', ['raw_river_perch']],
      ['fish', 2, 'raw_marsh_pike', ['raw_marsh_pike']],
      ['fish', 2, 'raw_bog_eel', ['raw_bog_eel']],
      ['produce', 1, 'vale_wheat', ['vale_wheat', 'fine_vale_wheat']],
      ['produce', 1, 'brook_carrot', ['brook_carrot', 'fine_brook_carrot']],
      ['produce', 2, 'marsh_rice', ['marsh_rice', 'fine_marsh_rice']],
      ['produce', 2, 'bog_beet', ['bog_beet', 'fine_bog_beet']],
    ]);
    for (const row of FREEHOLD_LEDGER_ELIGIBILITY) {
      expect(Object.keys(row).sort()).toEqual([
        'alternativeId',
        'family',
        'gradeIds',
        'materialTier',
      ]);
      for (const id of row.gradeIds) expect(ITEMS[id], id).toBeDefined();
    }
  });

  it('freezes the complete eligibility graph at runtime', () => {
    expect(Object.isFrozen(FREEHOLD_LEDGER_ELIGIBILITY)).toBe(true);
    expect(FREEHOLD_LEDGER_ELIGIBILITY).toHaveLength(18);
    for (const row of FREEHOLD_LEDGER_ELIGIBILITY) {
      expect(Object.isFrozen(row), row.alternativeId).toBe(true);
      expect(Object.isFrozen(row.gradeIds), row.alternativeId).toBe(true);
      expect(() => Object.assign(row, { materialTier: 3 })).toThrow();
      expect(() => Array.prototype.push.call(row.gradeIds, 'unapproved')).toThrow();
    }
    expect(() => Array.prototype.pop.call(FREEHOLD_LEDGER_ELIGIBILITY)).toThrow();
  });

  it('keeps the unsigned production schedule absent without invented quantities or metadata', () => {
    expect(FREEHOLD_LEDGER_SCHEDULE).toEqual({
      status: 'pending_approval',
      calibrationId: 'CAL-LEDGER-A',
      schedule: null,
    });
    expect(Object.isFrozen(FREEHOLD_LEDGER_SCHEDULE)).toBe(true);
    expect(() => Object.assign(FREEHOLD_LEDGER_SCHEDULE, { schedule: [] })).toThrow();
  });

  it('retains the source record beside the tier and eligibility tables', () => {
    expect(existsSync(new URL(`../${SOURCE_FREEZE}`, import.meta.url))).toBe(true);
    for (const file of ['tiers.ts', 'ledger_schedule.ts']) {
      const source = readFileSync(
        new URL(`../src/sim/content/freehold/${file}`, import.meta.url),
        'utf8',
      );
      expect(source, file).toContain(SOURCE_FREEZE);
      expect(source, file).not.toContain('stackSize');
    }
  });

  it('keeps every unsigned furnishing and its acquisition source outside runtime content', () => {
    // Remove this admission guard only with the signed numeric source artifact.
    for (const id of [
      'freehold_timber_bed',
      'freehold_round_table',
      'freehold_spindle_chair',
      'freehold_low_stool',
      'freehold_woven_rug',
      'freehold_brass_lantern',
      'freehold_storage_chest',
      'freehold_open_bookshelf',
    ]) {
      expect(ITEMS[id], id).toBeUndefined();
      expect(
        Object.values(NPCS).some((npc) => npc.vendorItems?.includes(id)),
        id,
      ).toBe(false);
    }
    expect(NPCS.freehold_furnisher).toBeUndefined();
  });
});
