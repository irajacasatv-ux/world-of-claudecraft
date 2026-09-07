import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, ITEMS } from '../src/sim/data';
import { MAIL_DELIVERY_SECONDS, type MailSave } from '../src/sim/mail/post_office';
import { type CharacterState, Sim } from '../src/sim/sim';
import type { InvSlot } from '../src/sim/types';
import { FURNISHING } from './fixtures/furnishing_item';

const COPY: InvSlot = {
  itemId: FURNISHING.id,
  count: 1,
  instance: { signer: 'Testmaker' },
  craftedRecipeId: 'test_furnishing_recipe',
};
const CHARACTER_ID = 701;

beforeEach(() => {
  ITEMS[FURNISHING.id] = structuredClone(FURNISHING);
});
afterEach(() => {
  delete ITEMS[FURNISHING.id];
});

function world(): Sim {
  return new Sim({
    seed: 73,
    playerClass: 'warrior',
    noPlayer: true,
    autoEquip: false,
    world: { ...BUILTIN_WORLD, camps: [], groundObjects: [] },
  });
}
function keeper(sim: Sim, state?: CharacterState): number {
  const pid = sim.addPlayer('warrior', 'Keeper', { characterId: CHARACTER_ID, state });
  if (!state) {
    sim.meta(pid)!.inventory.splice(0);
    sim.meta(pid)!.copper = 10000;
  }
  return pid;
}
function moveTo(sim: Sim, pid: number, targetId: number): void {
  const target = sim.entities.get(targetId)!;
  expect(target).toBeDefined();
  const player = sim.entities.get(pid)!;
  player.pos = { ...target.pos };
  player.prevPos = { ...player.pos };
  sim.rebucket(player);
}
function atBank(sim: Sim, pid: number): void {
  const banker = [...sim.entities.values()].find(
    (entity) => entity.templateId === 'bursar_fernando',
  )!;
  moveTo(sim, pid, banker.id);
}
function copies(sim: Sim, pid: number): InvSlot[] {
  return sim.meta(pid)!.inventory.filter((slot) => slot.itemId === FURNISHING.id);
}
function persisted<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
function savedCharacter(sim: Sim, pid: number): CharacterState {
  const save = sim.serializeCharacter(pid);
  expect(save).not.toBeNull();
  return persisted(save!);
}

describe('furnishing custody persistence', () => {
  it.each(['bags', 'personal bank'] as const)(
    'retains one signed crafted furnishing through a fresh character load from %s',
    (container) => {
      const sim = world();
      const pid = keeper(sim);
      sim.meta(pid)!.inventory.push(structuredClone(COPY));
      if (container === 'personal bank') {
        atBank(sim, pid);
        sim.bankDeposit(0, 1, pid);
        expect(copies(sim, pid)).toEqual([]);
        expect(sim.meta(pid)!.bank.inventory).toEqual([COPY]);
      }
      const liveBefore = structuredClone(sim.meta(pid)!);
      const save = savedCharacter(sim, pid);
      expect(sim.meta(pid)).toEqual(liveBefore);
      const savedBefore = structuredClone(save);

      const restored = world();
      const restoredPid = keeper(restored, save);
      expect(save).toEqual(savedBefore);
      if (container === 'personal bank') {
        expect(restored.meta(restoredPid)!.bank.inventory).toEqual([COPY]);
        expect(copies(restored, restoredPid)).toEqual([]);
        atBank(restored, restoredPid);
        restored.bankWithdraw(0, 1, restoredPid);
        expect(restored.meta(restoredPid)!.bank.inventory).toEqual([]);
        restored.bankWithdraw(0, 1, restoredPid);
      }
      expect(copies(restored, restoredPid)).toEqual([expect.objectContaining(COPY)]);
      expect(save).toEqual(savedBefore);
      expect(sim.meta(pid)).toEqual(liveBefore);
    },
  );

  it('reloads the guild book and permits one withdrawal by the restored officer', () => {
    const sim = world();
    const pid = keeper(sim);
    atBank(sim, pid);
    sim.setPlayerGuildMembership(pid, { guildId: 7, rank: 'officer' });
    sim.loadGuildBank(7, { inventory: [], treasury: 0, purchasedSlots: 24 });
    sim.meta(pid)!.inventory.push(structuredClone(COPY));
    sim.guildBankDepositFor(pid, 0, 1);
    expect(copies(sim, pid)).toEqual([]);
    expect(sim.guildBanks.get(7)!.inventory).toEqual([COPY]);
    const liveBefore = structuredClone(sim.guildBanks.get(7));
    const book = persisted(sim.serializeGuildBank(7));
    expect(book?.inventory).toEqual([COPY]);
    const savedBefore = structuredClone(book);

    const restored = world();
    const restoredPid = keeper(restored, savedCharacter(sim, pid));
    restored.setPlayerGuildMembership(restoredPid, { guildId: 7, rank: 'officer' });
    restored.loadGuildBank(7, book);
    expect(restored.guildBanks.get(7)!.inventory).toEqual([COPY]);
    atBank(restored, restoredPid);
    restored.guildBankWithdrawFor(restoredPid, 0, 1);
    expect(restored.guildBanks.get(7)!.inventory).toEqual([]);
    restored.guildBankWithdrawFor(restoredPid, 0, 1);
    expect(copies(restored, restoredPid)).toEqual([expect.objectContaining(COPY)]);
    expect(book).toEqual(savedBefore);
    expect(sim.guildBanks.get(7)).toEqual(liveBefore);
  });

  it.each(['full book', 'dirty partition'] as const)(
    'reloads an in-flight signed furnishing from the mail %s and grants it once',
    (format) => {
      const sim = world();
      const pid = keeper(sim);
      const recipient = sim.addPlayer('mage', 'Receiver', { characterId: 702 });
      const recipientState = savedCharacter(sim, recipient);
      sim.meta(pid)!.inventory.push(structuredClone(COPY));
      moveTo(sim, pid, sim.postOffice.mailboxIds[0]);
      sim.takeDirtyMailPartitions();
      sim.mailSend('Receiver', 'Furniture', 'Parcel.', 0, [COPY], pid);
      expect(copies(sim, pid)).toEqual([]);
      const liveBefore = structuredClone(sim.postOffice.mail);
      const full = sim.serializeMail();
      const partitions = sim.takeDirtyMailPartitions();
      const save: MailSave = persisted(
        format === 'full book'
          ? full
          : {
              nextMailId: full.nextMailId,
              mail: partitions.flatMap((partition) => partition.letters),
            },
      );
      const parcel = save.mail.find((letter) => letter.subject === 'Furniture')!;
      expect(parcel.items).toEqual([COPY]);
      expect(parcel.deliverIn).toBe(MAIL_DELIVERY_SECONDS);
      expect(sim.postOffice.mail).toEqual(liveBefore);
      const savedBefore = structuredClone(save);

      const restored = world();
      restored.loadMail(save);
      const restoredRecipient = restored.addPlayer('mage', 'Receiver', {
        characterId: 702,
        state: recipientState,
      });
      moveTo(restored, restoredRecipient, restored.postOffice.mailboxIds[0]);
      restored.mailTake(parcel.id, restoredRecipient);
      expect(copies(restored, restoredRecipient)).toEqual([]);
      for (let tick = 0; tick <= MAIL_DELIVERY_SECONDS * 20; tick++) restored.tick();
      restored.mailTake(parcel.id, restoredRecipient);
      expect(copies(restored, restoredRecipient)).toEqual([expect.objectContaining(COPY)]);
      expect(
        restored.serializeMail().mail.find((letter) => letter.id === parcel.id)?.items,
      ).toEqual([]);
      restored.mailTake(parcel.id, restoredRecipient);
      expect(copies(restored, restoredRecipient)).toEqual([expect.objectContaining(COPY)]);
      expect(save).toEqual(savedBefore);
      expect(sim.postOffice.mail).toEqual(liveBefore);
    },
  );

  it.each(['listing', 'collection'] as const)(
    'reloads a signed crafted furnishing from the World Market %s and reclaims it once',
    (container) => {
      const sim = world();
      const pid = keeper(sim);
      sim.meta(pid)!.inventory.push(structuredClone(COPY));
      moveTo(sim, pid, sim.market.merchantIds[0]);
      sim.marketListInstance(FURNISHING.id, 100, COPY.instance!, pid);
      const listing = sim.marketListings.find((row) => row.itemId === FURNISHING.id)!;
      expect(listing).toMatchObject(COPY);
      expect(copies(sim, pid)).toEqual([]);
      if (container === 'collection') {
        listing.expiresAt = sim.time;
        for (let tick = 0; tick < 21; tick++) sim.tick();
        expect(sim.marketInfoFor(pid)?.collectionItems).toEqual([COPY]);
      }
      const liveBefore = structuredClone({
        listings: sim.marketListings,
        collections: sim.marketInfoFor(pid)?.collectionItems,
      });
      const save = persisted(sim.serializeMarket());
      expect(container === 'listing' ? save.listings : save.collections[0]?.items).toEqual([
        expect.objectContaining(COPY),
      ]);
      const savedBefore = structuredClone(save);

      const restored = world();
      restored.loadMarket(save);
      const restoredPid = keeper(restored, savedCharacter(sim, pid));
      moveTo(restored, restoredPid, restored.market.merchantIds[0]);
      expect(copies(restored, restoredPid)).toEqual([]);
      if (container === 'listing') {
        const loaded = restored.marketListings.find((row) => row.itemId === FURNISHING.id)!;
        expect(loaded).toMatchObject(COPY);
        restored.marketCancel(loaded.id, restoredPid);
        expect(restored.marketListings.some((row) => row.itemId === FURNISHING.id)).toBe(false);
        restored.marketCancel(loaded.id, restoredPid);
      } else {
        expect(restored.marketInfoFor(restoredPid)?.collectionItems).toEqual([COPY]);
        restored.marketCollect(restoredPid);
        expect(restored.marketInfoFor(restoredPid)?.collectionItems).toEqual([]);
        restored.marketCollect(restoredPid);
      }
      expect(copies(restored, restoredPid)).toEqual([expect.objectContaining(COPY)]);
      expect(save).toEqual(savedBefore);
      expect({
        listings: sim.marketListings,
        collections: sim.marketInfoFor(pid)?.collectionItems,
      }).toEqual(liveBefore);
    },
  );
});
