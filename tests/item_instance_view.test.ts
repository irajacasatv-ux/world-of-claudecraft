import { describe, expect, it } from 'vitest';
import type { ItemInstancePayload } from '../src/sim/types';
import { bagInstanceGlyphKind } from '../src/ui/bag_instance_glyph_view';
import { instanceGlyphAriaKey } from '../src/ui/item_instance_glyph_mark';
import { itemPresentationInstance } from '../src/ui/item_instance_view';

describe('itemPresentationInstance', () => {
  const powerCopies: { name: string; instance: ItemInstancePayload }[] = [
    { name: 'Masterwork', instance: { rolled: { masterwork: true } } },
    { name: 'legacy enchant stats', instance: { rolled: { stats: { str: 100 } } } },
    { name: 'explicit enchant', instance: { enchant: 'enchant_chest_stamina' } },
    { name: 'chosen name', instance: { name: 'Forbidden Crown' } },
    { name: 'promoted quality', instance: { rolled: { quality: 'legendary' } } },
    { name: 'Perfected', instance: { perfected: true } },
    { name: 'Perfecting rank', instance: { perfecting: 2 } },
    { name: 'Perfecting binding', instance: { perfectingBound: true } },
    { name: 'Perfecting bonus', instance: { perfectingBonus: { str: 100 } } },
    { name: 'effect charges', instance: { charges: { damage: 3 } } },
    { name: 'worn crafting recipe', instance: { craftedRecipeId: 'probe_weapon_recipe' } },
    {
      name: 'Rift progression',
      instance: {
        rift: {
          sourceEventId: 'probe_rift',
          tier: 'A',
          power: 10,
          upgradeLevel: 2,
          maxUpgradeLevel: 6,
          baseStats: { str: 100 },
          gemSlots: 2,
          gems: ['probe_gem'],
        },
      },
    },
  ];

  it.each(powerCopies)(
    'strips an unsigned furnishing $name claim without inventing a maker',
    ({ instance }) => {
      const before = structuredClone(instance);
      const projected = itemPresentationInstance('furnishing', instance);
      expect(projected).toEqual({});
      expect(projected).not.toBe(instance);
      expect(bagInstanceGlyphKind(instance, 'furnishing')).toBe('generic');
      expect(instanceGlyphAriaKey('generic', 'furnishing')).toBe('itemUi.bags.itemAria');
      expect(instance).toEqual(before);
    },
  );

  it('retains actual maker and custody facts on a fresh furnishing projection', () => {
    const instance: ItemInstancePayload = {
      signer: 'Anna',
      locked: true,
      boundTo: 7,
      bindOnTrade: true,
      partyTrade: { untilMs: 123_456, eligible: ['Anna'], eligibleIds: [7] },
      name: 'Forbidden Crown',
      rolled: { quality: 'legendary', masterwork: true },
      enchant: 'enchant_chest_stamina',
      perfected: true,
    };
    const before = structuredClone(instance);
    const projected = itemPresentationInstance('furnishing', instance);
    expect(projected).toEqual({
      signer: 'Anna',
      locked: true,
      boundTo: 7,
      bindOnTrade: true,
      partyTrade: { untilMs: 123_456, eligible: ['Anna'], eligibleIds: [7] },
    });
    expect(projected).not.toBe(instance);
    expect(bagInstanceGlyphKind(instance, 'furnishing')).toBe('signed');
    expect(instanceGlyphAriaKey('signed', 'furnishing')).toBe('hudChrome.bags.itemAriaInstanced');
    expect(instance).toEqual(before);
  });

  it.each<{ instance: ItemInstancePayload; glyph: 'bound' | 'generic' }>([
    { instance: { bindOnTrade: true }, glyph: 'bound' },
    { instance: { boundTo: 7 }, glyph: 'bound' },
    { instance: { boundTo: 0 }, glyph: 'bound' },
    { instance: { bindOnTrade: false, locked: false }, glyph: 'generic' },
  ])('keeps real furnishing custody flags independently: $instance', ({ instance, glyph }) => {
    expect(itemPresentationInstance('furnishing', instance)).toEqual(instance);
    expect(bagInstanceGlyphKind(instance, 'furnishing')).toBe(glyph);
    expect(instanceGlyphAriaKey(glyph, 'furnishing')).toBe(
      glyph === 'bound' ? 'hudChrome.bags.itemAriaBound' : 'itemUi.bags.itemAria',
    );
  });

  const unchangedKinds: { kind: string | undefined }[] = [
    { kind: 'weapon' },
    { kind: 'armor' },
    { kind: 'junk' },
    { kind: 'unknown_kind' },
    { kind: undefined },
  ];
  it.each(unchangedKinds)('preserves existing payloads by reference for $kind', ({ kind }) => {
    const masterwork: ItemInstancePayload = {
      rolled: { masterwork: true, quality: 'legendary' },
      name: 'Dawn Oath',
    };
    const enchanted: ItemInstancePayload = { enchant: 'enchant_chest_stamina' };
    expect(itemPresentationInstance(kind, masterwork)).toBe(masterwork);
    expect(itemPresentationInstance(kind, enchanted)).toBe(enchanted);
    expect(bagInstanceGlyphKind(masterwork, kind)).toBe('masterwork');
    expect(bagInstanceGlyphKind(enchanted, kind)).toBe('enchanted');
    expect(instanceGlyphAriaKey('generic', kind)).toBe('hudChrome.bags.itemAriaInstanced');
  });

  it('keeps a plain furnishing stack free of instance markers', () => {
    expect(itemPresentationInstance('furnishing', undefined)).toBeUndefined();
    expect(bagInstanceGlyphKind(undefined, 'furnishing')).toBeNull();
  });

  it('treats an empty furnishing signer as unsigned while preserving legacy gear behavior', () => {
    const instance = { signer: '' };
    expect(itemPresentationInstance('furnishing', instance)).toEqual({});
    expect(bagInstanceGlyphKind(instance, 'furnishing')).toBe('generic');
    expect(instanceGlyphAriaKey('generic', 'furnishing')).toBe('itemUi.bags.itemAria');
    expect(itemPresentationInstance('weapon', instance)).toBe(instance);
    expect(bagInstanceGlyphKind(instance, 'weapon')).toBe('signed');
    expect(instance).toEqual({ signer: '' });
  });
});
