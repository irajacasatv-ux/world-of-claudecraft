import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { journalCharacterSaveSources } from '../server/character_material_sources_db';
import { journalGuildBookSources } from '../server/guild_bank_source_journal';
import type { MaterialSourceJournalRecord } from '../server/material_source_journal_db';
import { REALM } from '../server/realm';
import { ITEMS } from '../src/sim/data';
import { materialItemIds } from '../src/sim/material_ids';
import type { InvSlot } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';

const COPY: InvSlot = {
  itemId: FURNISHING.id,
  count: 1,
  instance: { signer: 'Testmaker' },
  craftedRecipeId: 'test_furnishing_recipe',
};

beforeEach(() => {
  ITEMS[FURNISHING.id] = structuredClone(FURNISHING);
});
afterEach(() => {
  delete ITEMS[FURNISHING.id];
});

describe('furnishing material source journals', () => {
  it.each(['deposit', 'withdraw'] as const)(
    'a personal-bank furnishing %s creates no query, anchor or movement',
    async (direction) => {
      const occupied = { inventory: [structuredClone(COPY)], purchasedSlots: 0, bonusSlots: 0 };
      const empty = { inventory: [], purchasedSlots: 0, bonusSlots: 0 };
      const before = { bank: direction === 'deposit' ? empty : occupied, vault: null };
      const after = { bank: direction === 'deposit' ? occupied : empty };
      const inputs = structuredClone({ before, after });
      const query = vi.fn();

      expect(ITEMS[FURNISHING.id].kind).toBe('furnishing');
      expect(materialItemIds().has(FURNISHING.id)).toBe(false);
      expect(
        await journalCharacterSaveSources({ query }, 701, before, { rowCount: 1 }, after),
      ).toEqual({ writes: [], unchangedContainers: 2, anchorsCreated: 0, movementRows: 0 });
      expect(query).not.toHaveBeenCalled();
      expect({ before, after }).toEqual(inputs);
    },
  );

  it.each(['deposit', 'withdraw'] as const)(
    'a guild-bank furnishing %s creates no query, anchor or movement',
    async (direction) => {
      const occupied = [structuredClone(COPY)];
      const changes = [
        {
          guildId: 7,
          before: direction === 'deposit' ? [] : occupied,
          after: direction === 'deposit' ? occupied : [],
        },
      ];
      const inputs = structuredClone(changes);
      const query = vi.fn();

      expect(ITEMS[FURNISHING.id].kind).toBe('furnishing');
      expect(materialItemIds().has(FURNISHING.id)).toBe(false);
      expect(await journalGuildBookSources({ query }, changes)).toEqual({
        writes: [],
        unchangedContainers: 1,
        anchorsCreated: 0,
        movementRows: 0,
      });
      expect(query).not.toHaveBeenCalled();
      expect(changes).toEqual(inputs);
    },
  );

  it.each(['personal', 'guild'] as const)(
    '%s material control still journals one real movement in one query',
    async (container) => {
      const query = vi.fn().mockResolvedValue({
        rows: [{ ord: 0, realm: REALM, container, owner_id: '7', revision: '1' }],
        rowCount: 1,
      });
      const occupied = [{ itemId: 'copper_ore', count: 1 }];
      const before = { bank: { inventory: [], purchasedSlots: 0, bonusSlots: 0 }, vault: null };
      const after = { bank: { inventory: occupied, purchasedSlots: 0, bonusSlots: 0 } };
      const changes = [{ guildId: 7, before: [], after: occupied }];
      const inputs = structuredClone({ before, after, changes });

      expect(materialItemIds().has('copper_ore')).toBe(true);
      const result =
        container === 'personal'
          ? await journalCharacterSaveSources({ query }, 7, before, { rowCount: 1 }, after)
          : await journalGuildBookSources({ query }, changes);
      expect(query).toHaveBeenCalledTimes(1);
      const records = JSON.parse(
        String(query.mock.calls[0][1][0]),
      ) as MaterialSourceJournalRecord[];
      expect(records).toHaveLength(1);
      expect(records[0].container).toBe(container);
      expect(records[0].movements).toEqual([
        { itemId: 'copper_ore', count: 1, sourceDeltas: [{ source: {}, count: 1 }] },
      ]);
      expect(result?.writes).toHaveLength(1);
      expect(result?.anchorsCreated).toBe(1);
      expect(result?.movementRows).toBe(1);
      expect({ before, after, changes }).toEqual(inputs);
    },
  );
});
