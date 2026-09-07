# Added tests and assertion inventory

Each section is an original test block, including exact assertions, fixture controls and helper invocation. `expectNoMutation` serializes the specified player before/after and spies on RNG; its full definition appears in original-implementation.diff. Parameterized cases expand under it.each when Vitest runs. No test execution is claimed by this inventory.

## tests/furnishing_item_kind.test.ts

```ts
  it('requires placement data and forbids item powers at compile time', () => {
    const rug: FurnishingItemDef = {
      ...FURNISHING,
      furnishing: { ...FURNISHING.furnishing, r: 0 },
    };
    expect(rug.furnishing.r).toBe(0);
    // @ts-expect-error collision radius is required even for walk-through furnishings
    const missingRadius: FurnishingItemDef['furnishing'] = {
      footprint: { width: 1, depth: 1 },
      decorCost: 1,
      surface: 'floor',
    };
    // @ts-expect-error furnishings cannot supply stats
    const stats: FurnishingItemDef = { ...FURNISHING, stats: { str: 1 } };
    // @ts-expect-error furnishings cannot carry item-use actions
    const use: FurnishingItemDef = { ...FURNISHING, use: { type: 'hearth' } };
    const feast: FurnishingItemDef = {
      ...FURNISHING,
      // @ts-expect-error furnishings cannot grant feast effects
      feast: { charges: 1, durationTicks: 1, dishItemId: 'roasted_boar', templateId: 'test_feast' },
    };
    // @ts-expect-error furnishing copies cannot opt into stacking
    const stack: FurnishingItemDef = { ...FURNISHING, stackSize: 20 };
    // @ts-expect-error furnishing provenance belongs to the copy
    const signer: FurnishingItemDef = { ...FURNISHING, signer: 'Defmaker' };
    void [missingRadius, stats, use, feast, stack, signer];
  });
```
```ts
  it('keeps every placement field required and every power field uninhabitable', () => {
    type Placement = FurnishingItemDef['furnishing'];
    type RequiredField<K extends keyof Placement> = {} extends Pick<Placement, K> ? false : true;
    const required: { [K in 'footprint' | 'r' | 'decorCost' | 'surface']: RequiredField<K> } = {
      footprint: true,
      r: true,
      decorCost: true,
      surface: true,
    };
    const footprintRequired: {
      [K in 'width' | 'depth']: {} extends Pick<Placement['footprint'], K> ? false : true;
    } = { width: true, depth: true };
    type PowerField =
      | 'armorType'
      | 'slot'
      | 'weapon'
      | 'stats'
      | 'spellPower'
      | 'healPower'
      | 'critRating'
      | 'hasteRating'
      | 'hitRating'
      | 'pvpOffenseRating'
      | 'pvpDefenseRating'
      | 'use'
      | 'feast'
      | 'stackSize'
      | 'foodHp'
      | 'drinkMana'
      | 'potionHp'
      | 'potionHpPctMax'
      | 'potionMana'
      | 'elixir'
      | 'bagSlots'
      | 'materialsOnly'
      | 'teachesRiding'
      | 'set'
      | 'masterwrought';
    type IsNever<T> = [T] extends [never] ? true : false;
    const barred: { [K in PowerField]: IsNever<NonNullable<FurnishingItemDef[K]>> } = {
      armorType: true,
      slot: true,
      weapon: true,
      stats: true,
      spellPower: true,
      healPower: true,
      critRating: true,
      hasteRating: true,
      hitRating: true,
      pvpOffenseRating: true,
      pvpDefenseRating: true,
      use: true,
      feast: true,
      stackSize: true,
      foodHp: true,
      drinkMana: true,
      potionHp: true,
      potionHpPctMax: true,
      potionMana: true,
      elixir: true,
      bagSlots: true,
      materialsOnly: true,
      teachesRiding: true,
      set: true,
      masterwrought: true,
    };
    // @ts-expect-error only floor support is authored by this item contract
    const surface: Placement['surface'] = 'wall';
    void [required, footprintRequired, barred, surface];
    expect(FURNISHING.furnishing).toEqual({
      footprint: { width: 2, depth: 3 },
      r: 0,
      decorCost: 7,
      surface: 'floor',
    });
  });
```
```ts
  it('keeps furnishing out of the broad OtherItemDef escape hatch', () => {
    const source = stripComments(
      readFileSync(new URL('../src/sim/types.ts', import.meta.url), 'utf8'),
    );
    const other = source.slice(source.indexOf('interface OtherItemDef'));
    expect(other).toMatch(/kind:\s*Exclude<\s*ItemKind,[^>]*'furnishing'/);
  });
```
```ts
  it('introduces no shipping furnishing record', () => {
    expect(
      Object.values(ITEMS)
        .filter((def) => def.kind === 'furnishing')
        .map((def) => def.id),
    ).toEqual([ID]);
  });
```
```ts
  it('occupies one bag slot per copy', () => {
    expect(stackSizeOf(FURNISHING)).toBe(1);
    const sim = makeSim();
    sim.addItem(ID, 2);
    expect(sim.inventory).toEqual([
      { itemId: ID, count: 1 },
      { itemId: ID, count: 1 },
    ]);
  });
```
```ts
  it('ignores a malformed runtime stack override', () => {
    expect(stackSizeOf({ ...FURNISHING, stackSize: 20 } as unknown as ItemDef)).toBe(1);
  });
```
```ts
  it('ranks immediately after tools and preserves the entire existing kind order', () => {
    const order: ItemKind[] = [
      'weapon',
      'armor',
      'held_offhand',
      'bag',
      'potion',
      'elixir',
      'flask',
      'scroll',
      'food',
      'drink',
      'tool',
      'furnishing',
      'mount',
      'recipe',
      'junk',
      'quest',
    ];
    const defs = order.map((kind) =>
      kind === 'furnishing'
        ? FURNISHING
        : Object.values(ITEMS).find((def) => def.kind === kind && def.quality !== 'poor')!,
    );
    expect(defs.every(Boolean)).toBe(true);
    const lookup = (id: string) => defs.find((def) => def.id === id);
    const slots = defs.map((def) => ({ itemId: def.id, count: 1 })).reverse();
    slots.sort((a, b) => compareBagStacks(a, b, lookup));
    expect(slots.map((slot) => lookup(slot.itemId)!.kind)).toEqual(order);
  });
});

describe('furnishing refusal and power gates', () => {
```
```ts
  it('refuses equipment eligibility for every player class', () => {
    for (const cls of [
      'warrior',
      'mage',
      'rogue',
      'priest',
      'hunter',
      'warlock',
      'paladin',
      'shaman',
      'druid',
    ] as const) {
      expect(canEquipItem(cls, FURNISHING), cls).toBe(false);
    }
  });
```
```ts
  it('resolves no equip slot', () => {
    expect(resolveEquipSlot(FURNISHING, {})).toBeNull();
  });
```
```ts
  it('rejects targeted equipment slots', () => {
    expect(slotAcceptsItem(FURNISHING, 'mainhand')).toBe(false);
    expect(canEquipItemInSlot('warrior', FURNISHING, 'mainhand')).toBe(false);
  });
```
```ts
  it('equip command consumes and moves nothing', () => {
    const sim = makeSim();
    give(sim);
    ITEMS[ID] = { ...FURNISHING, slot: 'mainhand', stats: { str: 50 } } as unknown as ItemDef;
    expectNoMutation(sim, () => sim.equipItem(ID));
  });
```
```ts
  it('use command consumes nothing and grants no effect', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    ITEMS[ID] = {
      ...FURNISHING,
      use: { type: 'hearth' },
      potionHp: 100,
      feast: { charges: 2 },
    } as unknown as ItemDef;
    expect(expectNoMutation(sim, () => sim.useItem(ID))).toBeUndefined();
    expect(sim.drainEvents()).toEqual([]);
  });
```
```ts
  it('disenchant refuses before spending a copy or drawing randomness', () => {
    const sim = makeSim();
    give(sim);
    expect(isDisenchantable(FURNISHING)).toBe(false);
    expect(expectNoMutation(sim, () => resolveDisenchant(sim.ctx, sim.playerId, ID))).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_disenchantable',
    });
  });
```
```ts
  it('disenchant admission refuses the same item kind', () => {
    const sim = makeSim();
    give(sim);
    expect(evaluateDisenchantAdmission(sim.ctx, sim.playerId, ID)).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_disenchantable',
    });
  });
```
```ts
  it('has no typed disenchant reagent', () => {
    expect(typedSecondaryFor(FURNISHING)).toBeNull();
  });
```
```ts
  it('salvage refuses before spending a copy or drawing randomness', () => {
    const sim = makeSim();
    give(sim);
    expect(isSalvageable(FURNISHING)).toBe(false);
    expect(expectNoMutation(sim, () => resolveSalvage(sim.ctx, sim.playerId, ID))).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_salvageable',
    });
  });
```
```ts
  it('salvage admission refuses the same item kind', () => {
    const sim = makeSim();
    give(sim);
    expect(evaluateSalvageAdmission(sim.ctx, sim.playerId, ID)).toEqual({
      ok: false,
      itemId: ID,
      reason: 'not_salvageable',
    });
  });
```
```ts
  it('sundering refuses without starting a cast or moving a copy', () => {
    const sim = makeSim();
    give(sim);
    expect(isSunderable(FURNISHING)).toBe(false);
    expectNoMutation(sim, () => extractEssence(sim.ctx, ID, sim.playerId));
    expect(sim.player.castingAbility).toBeNull();
    expect(errors(sim)).toEqual(['Only raid-won epics can be sundered.']);
  });
```
```ts
  it('perfecting refuses without spending materials or altering a copy', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    ITEMS[ID] = { ...FURNISHING, masterwrought: true } as unknown as ItemDef;
    expectNoMutation(sim, () =>
      resolvePerfectingAttempt(sim.ctx, sim.playerId, { bag: 0, itemId: ID }),
    );
    expect(errors(sim)).toEqual(['Only Masterwrought items can be perfected.']);
  });
```
```ts
  it('has no Perfecting view over either host mirror', () => {
    const sim = makeSim();
    give(sim);
    expect(
      perfectingInfoFrom({
        ref: { bag: 0, itemId: ID },
        inventory: sim.inventory,
        equipment: {},
        equipmentInstances: {},
        craftSkills: sim.meta(sim.playerId)!.craftSkills,
      }),
    ).toBeNull();
  });
```
```ts
  it('cannot receive a Perfecting stat bonus from malformed power data', () => {
    const malformed = { ...FURNISHING, slot: 'helmet', stats: { str: 10 } } as unknown as ItemDef;
    expect(perfectedBonusStats(malformed, { level: 1 })).toBeNull();
  });
```
```ts
  it('refuses enchanting without spending the copy or reagents', () => {
    const sim = makeSim();
    give(sim);
    ITEMS[ID] = { ...FURNISHING, slot: 'mainhand' } as unknown as ItemDef;
    expect(
      expectNoMutation(sim, () =>
        resolveApplyEnchant(sim.ctx, sim.playerId, ID, 'enchant_weapon_might'),
      ),
    ).toEqual({
      ok: false,
      itemId: ID,
      enchantId: 'enchant_weapon_might',
      reason: 'wrong_slot',
    });
  });
```
```ts
  it('refuses enchant admission before starting a cast', () => {
    const sim = makeSim();
    give(sim);
    ITEMS[ID] = { ...FURNISHING, slot: 'mainhand' } as unknown as ItemDef;
    expect(
      expectNoMutation(sim, () =>
        evaluateApplyEnchantAdmission(sim.ctx, sim.playerId, ID, 'enchant_weapon_might'),
      ),
    ).toEqual({
      ok: false,
      itemId: ID,
      enchantId: 'enchant_weapon_might',
      reason: 'wrong_slot',
    });
    expect(sim.player.castingAbility).toBeNull();
  });
```
```ts
  it('does not generate heroic power variants even from malformed slot data', () => {
    const malformed = { ...FURNISHING, slot: 'helmet', stats: { str: 10 } } as unknown as ItemDef;
    const gear: ItemDef = {
      id: 'test_heroic_control',
      name: 'Control',
      sellValue: 1,
      kind: 'armor',
      armorType: 'mail',
      slot: 'helmet',
      quality: 'rare',
      stats: { str: 10 },
    };
    const mob = {
      ...MOBS.korzul_the_gravewyrm,
      loot: [
        { itemId: ID, chance: 1 },
        { itemId: gear.id, chance: 1 },
      ],
    };
    const result = buildHeroicVariants({ [ID]: malformed, [gear.id]: gear }, { [mob.id]: mob });
    expect(Object.keys(result)).toEqual(['heroic_test_heroic_control']);
    expect(result.heroic_test_heroic_control.heroicOf).toBe('test_heroic_control');
    expect(result.heroic_test_heroic_control.kind).toBe('armor');
  });
```
```ts
  it('cannot acquire an apex crafting identity', () => {
    vi.spyOn(recipeContent, 'recipeForResultItem').mockReturnValue(RECIPE);
    ITEMS[ID] = { ...FURNISHING, masterwrought: true } as unknown as ItemDef;
    expect(craftForApexItem(ID)).toBeNull();
    ITEMS[ID] = { ...ITEMS[ID], kind: 'weapon' } as unknown as ItemDef;
    expect(craftForApexItem(ID)).toBe('weaponcrafting');
  });
```
```ts
  it('cannot receive a commission bond', () => {
    expect(isCommissionEligibleKind('furnishing')).toBe(false);
    expect(isCommissionEligible(FURNISHING)).toBe(false);
  });
```
```ts
  it('refuses unbinding without clearing a copy lock or charging copper', () => {
    const sim = makeSim();
    give(sim, ID, { signer: 'Testmaker', boundTo: 0, bindOnTrade: true });
    expect(expectNoMutation(sim, () => unbindItem(sim.ctx, ID, sim.playerId))).toEqual({
      ok: false,
      itemId: ID,
      reason: 'unbind_not_eligible',
      fee: 10000,
    });
  });
```
```ts
  it('has no crafting stat bonus', () => {
    const def = { ...FURNISHING, slot: 'helmet', stats: { str: 10 } } as unknown as ItemDef;
    expect(craftBonusStatsFor(def, RECIPE)).toBeNull();
  });
```
```ts
  it('retains the existing signer rarity rule', () => {
    for (const [quality, signed] of [
      ['common', false],
      ['uncommon', false],
      ['rare', true],
      ['epic', true],
      ['legendary', true],
    ] as const) {
      expect(mintsSignerPayload(FURNISHING, quality), quality).toBe(signed);
    }
    expect(mintsSignedCraftOutput(FURNISHING)).toBe(true);
  });
```
```ts
  it('crafts a signed furnishing without power', () => {
    const sim = makeSim();
    sim.meta(sim.playerId)!.craftSkills.weaponcrafting = 100;
    sim.addItem('bone_fragments', 1);
    const result = resolveCraftForRecipe(sim.ctx, sim.playerId, RECIPE);
    expect(result.ok).toBe(true);
    expect(sim.countItem('bone_fragments')).toBe(0);
    expect(sim.inventory).toEqual([
      { itemId: ID, count: 1, instance: { signer: sim.player.name } },
    ]);
  });
```
```ts
  it('has no item-level eligibility', () => {
    expect(isItemLevelEligible(FURNISHING)).toBe(false);
  });
```
```ts
  it('has no item level', () => {
    expect(itemLevel(FURNISHING)).toBeUndefined();
  });
```
```ts
  it('has no expected stat budget', () => {
    expect(expectedStatBudget(FURNISHING)).toBeUndefined();
  });
```
```ts
  it('has no slot stat multiplier', () => {
    expect(slotStatMultForItem(FURNISHING)).toBeUndefined();
  });
```
```ts
  it('has zero primary stat budget', () => {
    expect(primaryStatBudget(20, 'rare', FURNISHING.slot)).toBe(0);
  });
```
```ts
  it('has no scored primary stats', () => {
    expect(primaryStatSum(FURNISHING)).toBe(0);
  });
```
```ts
  it('has no item power score', () => {
    expect(itemScore(FURNISHING)).toBe(0);
  });
```
```ts
  it('cannot serve as a gathering tool', () => {
    expect(gatherToolTier(FURNISHING, 'mining')).toBeUndefined();
  });
```
```ts
  it('cannot serve as a fishing implement', () => {
    ITEMS[ID] = {
      ...FURNISHING,
      use: { type: 'gatherTool', professionId: 'fishing', tier: 9 },
    } as unknown as ItemDef;
    expect(hasFishingImplement([{ itemId: ID, count: 1 }], ITEMS)).toBe(false);
  });
```
```ts
  it('ignores forged gathering capabilities', () => {
    const malformed = {
      ...FURNISHING,
      use: { type: 'gatherTool', professionId: 'mining', tier: 9 },
    } as unknown as ItemDef;
    expect(gatherToolTier(malformed, 'mining')).toBeUndefined();
  });
```
```ts
  it('refuses furnishing copies as tool-effect charms', () => {
    const tool = Object.values(ITEMS).find(
      (def) =>
        def.kind === 'tool' && def.use?.type === 'gatherTool' && def.use.professionId === 'mining',
    )!;
    expect(tool).toBeDefined();
    const malformed = {
      ...FURNISHING,
      use: { type: 'toolEffect', effectId: 'makers_charm' },
    } as unknown as ItemDef;
    const inventory = [
      { itemId: tool.id, count: 1 },
      { itemId: ID, count: 1 },
    ];
    const before = structuredClone(inventory);
    expect(
      resolveSlotToolEffect(
        inventory,
        'mining',
        'makers_charm',
        'always',
        { ...ITEMS, [ID]: malformed },
        undefined,
        undefined,
      ),
    ).toEqual({ ok: false, reason: 'no_charm' });
    expect(inventory).toEqual(before);
  });
});

describe('furnishing storage and economy', () => {
```
```ts
  it.each([
    { name: 'ordinary', jack: false, draws: 1 },
    { name: 'Jack', jack: true, draws: 2 },
  ])('keeps $name crafting draws and refuses a forced furnishing power proc', (row) => {
    ITEMS[ID] = {
      ...FURNISHING,
      masterwrought: true,
      slot: 'chest',
      stats: { str: 4 },
    } as unknown as ItemDef;
    const sim = makeSim();
    const meta = sim.meta(sim.playerId)!;
    meta.craftSkills.weaponcrafting = 100;
    // A major's ceiling permits the rare-to-epic head-start candidate. Thus
    // removing the furnishing head-start guard makes the ordinary case fail.
    meta.archetype.activeArchetype = row.jack ? null : 'weaponcrafting';
    meta.archetype.pairedMajor = null;
    meta.archetype.hobbyCraft = null;
    meta.archetype.isJackOfAllTrades = row.jack;
    sim.addItem('bone_fragments', 1);
    const draw = vi.spyOn(sim.rng, 'next').mockReturnValue(0);
    // Jack draws variance first; 0.5 is normal, then 0 forces the proc hit.
    if (row.jack) draw.mockReturnValueOnce(0.5);
    const result = resolveCraftForRecipe(sim.ctx, sim.playerId, RECIPE, true);
    expect(result.ok).toBe(true);
    expect(draw).toHaveBeenCalledTimes(row.draws);
    expect(result.variance).toBe(row.jack ? 'normal' : undefined);
    expect(result.masterwork).toBeUndefined();
    expect(meta.copper).toBe(9998);
    expect(sim.countItem('bone_fragments')).toBe(0);
    // Exact shape excludes rolled stats, Perfecting rank, enchant and bond.
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: { signer: meta.name } }]);
  });

  function furnishingVendor(sim: Sim): number {
    const marla = [...sim.entities.values()].find(
      (entity) => entity.kind === 'npc' && entity.templateId === 'stablemaster_marla',
    )!;
    expect(marla).toBeDefined();
    // Replace this world's entity stock without mutating the content table.
    marla.vendorItems = [ID];
    moveTo(sim, marla.id);
    sim.setPlayerLevel(20);
    sim.meta(sim.playerId)!.ridingTrained = false;
    sim.drainEvents();
    return marla.id;
  }
```
```ts
  it.each([
    { name: 'ordinary', flags: {}, quantity: 2, copper: 200, honor: 0 },
    { name: 'soulbound', flags: { soulbound: true }, quantity: 1, copper: 100, honor: 0 },
    { name: 'honor-priced', flags: { priceHonor: 7 }, quantity: 1, copper: 100, honor: 7 },
    {
      name: 'forged riding service',
      flags: { teachesRiding: true },
      quantity: 1,
      copper: 100,
      honor: 0,
    },
  ])('buys $name furnishing through the real vendor count path', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags } as unknown as ItemDef;
    const sim = makeSim();
    const vendorId = furnishingVendor(sim);
    const meta = sim.meta(sim.playerId)!;
    // Enough to pay Marla's real Riding fee if the malformed service escapes.
    meta.copper = 1_000_000;
    meta.honor = 100;
    const draw = vi.spyOn(sim.rng, 'next');
    sim.buyItem(vendorId, ID, { count: 2 });
    expect(errors(sim)).toEqual([]);
    expect(draw).not.toHaveBeenCalled();
    expect(meta.ridingTrained).toBe(false);
    expect(meta.copper).toBe(1_000_000 - row.copper);
    expect(meta.honor).toBe(100 - row.honor);
    expect(sim.inventory).toEqual(
      Array.from({ length: row.quantity }, () => ({ itemId: ID, count: 1 })),
    );
  });
```
```ts
  it('refuses two vendor copies with one free cell before charging either copy', () => {
    const sim = makeSim();
    const vendorId = furnishingVendor(sim);
    const meta = sim.meta(sim.playerId)!;
    meta.bags = [];
    for (let cell = 0; cell < sim.bagCapacity - 1; cell++) give(sim);
    expect(sim.bagCapacity).toBe(16);
    expect(sim.inventory).toHaveLength(15);
    expect(sim.canAddItem(ID, 1)).toBe(true);
    expect(sim.canAddItem(ID, 2)).toBe(false);
    expectNoMutation(sim, () => sim.buyItem(vendorId, ID, { count: 2 }));
    expect(errors(sim)).toEqual(['Your bags are full.']);
    sim.buyItem(vendorId, ID, { count: 1 });
    expect(errors(sim)).toEqual([]);
    expect(sim.inventory).toHaveLength(16);
    expect(sim.inventory.every((slot) => slot.itemId === ID && slot.count === 1)).toBe(true);
    expect(meta.copper).toBe(9900);
  });

  type FurnishingLockCase = {
    name: string;
    flags: { soulbound?: boolean; noMarketList?: boolean };
    instance: ItemInstancePayload;
    guild: string | null;
    mail: string;
    market: string | null;
    trade: 'allow' | 'silent' | 'bound';
  };
  const furnishingLocks: FurnishingLockCase[] = [
    {
      name: 'soulbound',
      flags: { soulbound: true },
      instance: SIGNED,
      guild: 'You cannot store soulbound items in the guild bank.',
      mail: 'noMailSoulbound',
      market: 'That item cannot be listed on the World Market.',
      trade: 'silent',
    },
    {
      name: 'no-list',
      flags: { noMarketList: true },
      instance: SIGNED,
      guild: 'That item cannot be stored in the guild bank.',
      mail: 'noMailQuestItems',
      market: 'That item cannot be listed on the World Market.',
      trade: 'allow',
    },
    {
      name: 'armed',
      flags: {},
      instance: { ...SIGNED, bindOnTrade: true },
      guild: 'That item cannot be stored in the guild bank.',
      mail: 'noMailBound',
      market: 'That item is bound and cannot be listed.',
      trade: 'allow',
    },
    {
      name: 'bound to zero',
      flags: {},
      instance: { ...SIGNED, boundTo: 0 },
      guild: 'That item cannot be stored in the guild bank.',
      mail: 'noMailBound',
      market: 'That item is bound and cannot be listed.',
      trade: 'bound',
    },
    {
      name: 'owner-locked',
      flags: {},
      instance: { ...SIGNED, locked: true },
      guild: null,
      mail: 'sent',
      market: null,
      trade: 'allow',
    },
    {
      name: 'combined def and copy locks',
      flags: { soulbound: true, noMarketList: true },
      instance: { ...SIGNED, bindOnTrade: true, boundTo: 0 },
      guild: 'You cannot store soulbound items in the guild bank.',
      mail: 'noMailSoulbound',
      market: 'That item cannot be listed on the World Market.',
      trade: 'silent',
    },
  ];
```
```ts
  it.each(furnishingLocks)('self-banks $name furnishing without dropping lock fields', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    atBank(sim);
    give(sim, ID, row.instance);
    const before = structuredClone(sim.inventory);
    const copper = sim.meta(sim.playerId)!.copper;
    sim.bankDeposit(0, 1);
    expect(sim.inventory).toEqual([]);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual(before);
    sim.bankWithdraw(0, 1);
    expect(sim.inventory).toEqual(before);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual([]);
    expect(sim.meta(sim.playerId)!.copper).toBe(copper);
    expect(errors(sim)).toEqual([]);
  });
```
```ts
  it.each(furnishingLocks)('applies guild-bank $name policy in both directions', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = guildSim();
    const bank = sim.guildBanks.get(7)!;
    give(sim, ID, row.instance);
    const copy = structuredClone(sim.inventory[0]);
    if (row.guild === null) {
      sim.guildBankDepositFor(sim.playerId, 0, 1);
      expect(bank.inventory).toEqual([copy]);
      sim.guildBankWithdrawFor(sim.playerId, 0, 1);
      expect(sim.inventory).toEqual([copy]);
      expect(bank.inventory).toEqual([]);
      expect(errors(sim)).toEqual([]);
      return;
    }
    const beforeBank = structuredClone(bank);
    expectNoMutation(sim, () => sim.guildBankDepositFor(sim.playerId, 0, 1));
    expect(bank).toEqual(beforeBank);
    expect(errors(sim)).toEqual([row.guild]);
    sim.inventory.splice(0);
    bank.inventory.push(copy);
    const beforeWithdraw = structuredClone(bank);
    expectNoMutation(sim, () => sim.guildBankWithdrawFor(sim.playerId, 0, 1));
    expect(bank).toEqual(beforeWithdraw);
    expect(errors(sim)).toEqual(['That item cannot be withdrawn from the guild bank.']);
  });
```
```ts
  it.each(furnishingLocks)('applies mail $name policy before postage or escrow', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    give(sim, ID, row.instance);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.postOffice.mailboxIds[0]);
    sim.drainEvents();
    const beforeMail = structuredClone(sim.postOffice.mail);
    const beforeBob = structuredClone(sim.serializeCharacter(bob));
    const send = () =>
      sim.mailSend('Bob', 'Furniture', 'Parcel.', 0, [
        { itemId: ID, count: 1, instance: row.instance },
      ]);
    if (row.mail === 'sent') {
      send();
      expect(sim.inventory).toEqual([]);
      expect(sim.meta(sim.playerId)!.copper).toBe(9970);
      expect(sim.postOffice.mail.at(-1)?.items).toEqual([
        { itemId: ID, count: 1, instance: row.instance },
      ]);
      expect(sim.drainEvents().filter((event) => event.type === 'mailResult')).toEqual([
        { type: 'mailResult', code: 'sent', pid: sim.playerId, name: 'Bob', value: 30 },
      ]);
    } else {
      expectNoMutation(sim, send);
      expect(sim.postOffice.mail).toEqual(beforeMail);
      expect(sim.drainEvents().filter((event) => event.type === 'mailResult')).toEqual([
        { type: 'mailResult', code: row.mail, pid: sim.playerId },
      ]);
    }
    expect(sim.serializeCharacter(bob)).toEqual(beforeBob);
  });
```
```ts
  it.each(furnishingLocks)('applies market $name policy before signed-copy escrow', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    atMarket(sim);
    give(sim, ID, row.instance);
    const beforeMarket = structuredClone(sim.market.serializeMarket());
    if (row.market !== null) {
      expectNoMutation(sim, () => sim.marketListInstance(ID, 100, row.instance));
      expect(sim.market.serializeMarket()).toEqual(beforeMarket);
      expect(errors(sim)).toEqual([row.market]);
      return;
    }
    sim.marketListInstance(ID, 100, row.instance);
    const listing = sim.market.marketListings.find((entry) => entry.itemId === ID)!;
    expect(listing.instance).toEqual(row.instance);
    expect(sim.inventory).toEqual([]);
    sim.marketCancel(listing.id);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: row.instance }]);
    expect(sim.meta(sim.playerId)!.copper).toBe(10000);
    expect(errors(sim)).toEqual([]);
  });
```
```ts
  it.each(furnishingLocks)('applies direct-trade $name policy and recipient binding', (row) => {
    ITEMS[ID] = { ...FURNISHING, ...row.flags };
    const sim = makeSim();
    give(sim, ID, row.instance);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.drainEvents();
    const beforeBob = structuredClone(sim.serializeCharacter(bob));
    const offer = () => sim.tradeSetOffer([{ itemId: ID, count: 1 }], 0);
    if (row.trade !== 'allow') {
      expectNoMutation(sim, offer);
      expect(sim.tradeInfo!.myOffer.items).toEqual([]);
      expect(sim.serializeCharacter(bob)).toEqual(beforeBob);
      expect(errors(sim)).toEqual(
        row.trade === 'bound' ? ['That item is bound and cannot be traded.'] : [],
      );
      return;
    }
    offer();
    expect(sim.tradeInfo!.myOffer.items).toHaveLength(1);
    sim.tradeConfirm();
    sim.tradeConfirm(bob);
    expect(sim.countItem(ID)).toBe(0);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: row.instance.bindOnTrade ? { ...row.instance, boundTo: bob } : row.instance,
    });
    expect(sim.meta(sim.playerId)!.copper).toBe(10000);
    expect(errors(sim)).toEqual([]);
  });
```
```ts
  it('preserves the soulbound party-window exception for a furnishing', () => {
    ITEMS[ID] = { ...FURNISHING, soulbound: true };
    const sim = makeSim();
    const bob = sim.addPlayer('mage', 'Bob');
    const payload: ItemInstancePayload = {
      ...SIGNED,
      partyTrade: {
        untilMs: Math.floor(sim.time * 1000) + 7_200_000,
        eligible: [sim.player.name, 'Bob'],
      },
    };
    give(sim, ID, payload);
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.drainEvents();
    sim.tradeSetOffer([{ itemId: ID, count: 1 }], 0);
    expect(sim.tradeInfo!.myOffer.items).toHaveLength(1);
    sim.tradeConfirm();
    sim.tradeConfirm(bob);
    expect(sim.inventory).toEqual([]);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: payload,
    });
    expect(errors(sim)).toEqual([]);
  });

  // Existing plain marketList is already exercised for success and quest.
  // Add the two independent definition locks at the actual plain listing entry.
```
```ts
  it.each([{ soulbound: true }, { noMarketList: true }])(
    'retains plain-market definition lock %j',
    (flags) => {
      ITEMS[ID] = { ...FURNISHING, ...flags };
      const sim = makeSim();
      atMarket(sim);
      give(sim);
      const beforeMarket = structuredClone(sim.market.serializeMarket());
      expectNoMutation(sim, () => sim.marketList(ID, 1, 100));
      expect(sim.market.serializeMarket()).toEqual(beforeMarket);
      expect(errors(sim)).toEqual(['That item cannot be listed on the World Market.']);
    },
  );
```
```ts
  it('replays crafting, storage and refused use identically from the same seed', () => {
    const run = () => {
      const sim = makeSim();
      sim.meta(sim.playerId)!.craftSkills.weaponcrafting = 100;
      sim.addItem('bone_fragments', 1);
      expect(resolveCraftForRecipe(sim.ctx, sim.playerId, RECIPE).ok).toBe(true);
      atBank(sim);
      sim.bankDeposit(0, 1);
      sim.bankWithdraw(0, 1);
      sim.useItem(ID);
      expect(sim.inventory[0]).toMatchObject({ itemId: ID, count: 1 });
      return {
        state: sim.serializeCharacter(sim.playerId),
        events: sim.drainEvents(),
        next: sim.rng.next(),
      };
    };
    expect(run()).toEqual(run());
  });
```
```ts
  it('admits storage by kind while retaining quest refusal', () => {
    expect(isStorableItemKind('furnishing')).toBe(true);
    expect(isStorableItemKind('quest')).toBe(false);
    for (const kind of [
      'weapon',
      'armor',
      'held_offhand',
      'bag',
      'potion',
      'elixir',
      'flask',
      'scroll',
      'food',
      'drink',
      'tool',
      'mount',
      'recipe',
      'junk',
    ] as const) {
      expect(isStorableItemKind(kind), kind).toBe(true);
    }
    expect(isStorableItemKind('unknown' as ItemKind)).toBe(true);
  });
```
```ts
  it('deposits signed furnishings in the personal bank', () => {
    const sim = makeSim();
    atBank(sim);
    give(sim, ID, SIGNED);
    sim.bankDeposit(0, 1);
    expect(sim.inventory).toEqual([]);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual([
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
  });
```
```ts
  it('withdraws a signed furnishing from the personal bank', () => {
    const sim = makeSim();
    atBank(sim);
    give(sim, ID, SIGNED);
    sim.bankDeposit(0, 1);
    sim.bankWithdraw(0, 1);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(sim.meta(sim.playerId)!.bank.inventory).toEqual([]);
  });
```
```ts
  it('keeps personal-bank quest refusal unchanged', () => {
    const sim = makeSim();
    atBank(sim);
    give(sim, QUEST_ID);
    expect(ITEMS[QUEST_ID].kind).toBe('quest');
    expectNoMutation(sim, () => sim.bankDeposit(0, 1));
    expect(errors(sim)).toEqual(['You cannot store quest items in the bank.']);
  });
  function guildSim(): Sim {
    const sim = makeSim();
    atBank(sim);
    sim.setPlayerGuildMembership(sim.playerId, { guildId: 7, rank: 'officer' });
    sim.loadGuildBank(7, { treasury: 0, inventory: [], purchasedSlots: 24 });
    return sim;
  }
```
```ts
  it('deposits a signed furnishing in the guild bank', () => {
    const sim = guildSim();
    give(sim, ID, SIGNED);
    sim.guildBankDepositFor(sim.playerId, 0, 1);
    expect(sim.inventory).toEqual([]);
    expect(sim.guildBanks.get(7)!.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
  });
```
```ts
  it('withdraws a signed furnishing from the guild bank', () => {
    const sim = guildSim();
    give(sim, ID, SIGNED);
    sim.guildBankDepositFor(sim.playerId, 0, 1);
    sim.guildBankWithdrawFor(sim.playerId, 0, 1);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
    expect(sim.guildBanks.get(7)!.inventory).toEqual([]);
  });
```
```ts
  it('keeps guild-bank quest deposit refusal unchanged', () => {
    const sim = guildSim();
    give(sim, QUEST_ID);
    expectNoMutation(sim, () => sim.guildBankDepositFor(sim.playerId, 0, 1));
    expect(sim.guildBanks.get(7)!.inventory).toEqual([]);
    expect(errors(sim)).toEqual(['You cannot store quest items in the guild bank.']);
  });
```
```ts
  it('keeps guild-bank quest withdrawal refusal unchanged', () => {
    const sim = guildSim();
    sim.guildBanks.get(7)!.inventory.push({ itemId: QUEST_ID, count: 1 });
    expectNoMutation(sim, () => sim.guildBankWithdrawFor(sim.playerId, 0, 1));
    expect(sim.guildBanks.get(7)!.inventory).toEqual([{ itemId: QUEST_ID, count: 1 }]);
    expect(errors(sim)).toEqual(['That item cannot be withdrawn from the guild bank.']);
  });
```
```ts
  it('does not let furnishing kind bypass guild-bank copy locks', () => {
    expect(
      guildBankPipeRefusal({ itemId: ID, count: 1, instance: { boundTo: 9 } }, 'deposit'),
    ).toBe('That item cannot be stored in the guild bank.');
  });
```
```ts
  it('trades a signed furnishing to another player', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.tradeSetOffer([{ itemId: ID, count: 1, instance: SIGNED }], 0);
    sim.tradeConfirm();
    sim.tradeConfirm(bob);
    expect(sim.countItem(ID)).toBe(0);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: SIGNED,
    });
  });
```
```ts
  it('keeps trade quest refusal unchanged', () => {
    const sim = makeSim();
    give(sim, QUEST_ID);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.playerId, bob);
    sim.tradeRequest(bob);
    sim.tradeAccept(bob);
    sim.drainEvents();
    expectNoMutation(sim, () => sim.tradeSetOffer([{ itemId: QUEST_ID, count: 1 }], 0));
    expect(sim.tradeInfo!.myOffer.items).toEqual([]);
    expect(errors(sim)).toEqual([]);
  });
```
```ts
  it('mails and collects a signed furnishing without losing its maker', () => {
    const sim = makeSim();
    give(sim, ID, SIGNED);
    const bob = sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.postOffice.mailboxIds[0]);
    sim.mailSend('Bob', 'Furniture', 'For your home.', 0, [
      { itemId: ID, count: 1, instance: SIGNED },
    ]);
    expect(sim.countItem(ID)).toBe(0);
    expect(sim.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'mailResult', code: 'sent' }),
    );
    for (let tick = 0; tick <= MAIL_DELIVERY_SECONDS * 20; tick++) sim.tick();
    moveTo(sim, sim.postOffice.mailboxIds[0], bob);
    const letter = sim
      .mailInfoFor(bob)!
      .messages.find((message) => message.subject === 'Furniture')!;
    expect(letter).toBeDefined();
    sim.mailTake(letter.id, bob);
    expect(sim.meta(bob)!.inventory.find((slot) => slot.itemId === ID)).toEqual({
      itemId: ID,
      count: 1,
      instance: SIGNED,
    });
  });
```
```ts
  it('keeps mail quest refusal and postage unchanged', () => {
    const sim = makeSim();
    give(sim, QUEST_ID);
    sim.addPlayer('mage', 'Bob');
    moveTo(sim, sim.postOffice.mailboxIds[0]);
    sim.drainEvents();
    expectNoMutation(sim, () =>
      sim.mailSend('Bob', 'Quest', 'Parcel.', 0, [{ itemId: QUEST_ID, count: 1 }]),
    );
    expect(sim.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'mailResult', code: 'noMailQuestItems' }),
    );
  });
```
```ts
  it('lists and reclaims a plain furnishing on the World Market', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim);
    sim.marketList(ID, 1, 100);
    const listing = sim.market.marketListings.find((row) => row.itemId === ID)!;
    expect(listing).toBeDefined();
    expect(sim.countItem(ID)).toBe(0);
    sim.marketCancel(listing.id);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1 }]);
  });
```
```ts
  it('lists and reclaims a signed furnishing on the World Market', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim, ID, SIGNED);
    sim.marketListInstance(ID, 100, SIGNED);
    const listing = sim.market.marketListings.find((row) => row.itemId === ID)!;
    expect(listing.instance).toEqual(SIGNED);
    expect(sim.countItem(ID)).toBe(0);
    sim.marketCancel(listing.id);
    expect(sim.inventory).toEqual([{ itemId: ID, count: 1, instance: SIGNED }]);
  });
```
```ts
  it('keeps plain market quest refusal unchanged', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim, QUEST_ID);
    expectNoMutation(sim, () => sim.marketList(QUEST_ID, 1, 100));
    expect(errors(sim)).toEqual(['The Merchant will not broker quest items.']);
  });
```
```ts
  it('keeps signed market quest refusal unchanged', () => {
    const sim = makeSim();
    atMarket(sim);
    give(sim, QUEST_ID, SIGNED);
    expectNoMutation(sim, () => sim.marketListInstance(QUEST_ID, 100, SIGNED));
    expect(errors(sim)).toEqual(['The Merchant will not broker quest items.']);
  });
```
```ts
  it('allows a catalogued furnishing to count toward Reliquary completion', () => {
    const page: ReliquaryPageDef = {
      id: 'test_furnishing_page',
      shelf: 'professions',
      name: 'Test',
      relics: [{ kind: 'item', itemId: ID }],
    };
    const sim = makeSim();
    sim.addItem(ID, 1);
    const discovered = sim.meta(sim.playerId)!.deedStats.itemsDiscovered;
    expect(discovered.has(ID)).toBe(true);
    const count = discovered.size;
    sim.addItem(ID, 1);
    expect(discovered.size).toBe(count);
    expect(pageCompletion(page, { itemsDiscovered: discovered })).toEqual({
      owned: 1,
      total: 1,
      complete: true,
    });
    expect(catalogItemCompletion(discovered, [page])).toEqual({ owned: 1, total: 1 });
    expect(pageCompletion(page, { itemsDiscovered: new Set() })).toEqual({
      owned: 0,
      total: 1,
      complete: false,
    });
  });
```
```ts
  it('uses single-unit vendor packs', () => {
    expect(vendorStackSize(FURNISHING)).toBe(1);
  });
```
```ts
  it('permits ordinary bulk vendor purchases with one copy per slot', () => {
    expect(vendorCountForced(FURNISHING)).toBe(false);
    expect(buyPurchaseTotals(FURNISHING, 100, 0, 3)).toEqual({ units: 3, copper: 300, honor: 0 });
  });
```
```ts
  it('uses mount eligibility without the equipment quality floor', () => {
    expect(exchangeItemCategory(FURNISHING)).toBe('mount');
    expect(exchangeCategoryUsesQualityFloor(exchangeItemCategory(FURNISHING))).toBe(false);
    expect(
      listingEligibility(
        { ...FURNISHING, quality: undefined },
        undefined,
        WOC_MARKET_RESTRICTED_POLICY,
      ),
    ).toEqual({ ok: true });
    for (const quality of ['poor', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const) {
      expect(
        listingEligibility({ ...FURNISHING, quality }, SIGNED, WOC_MARKET_RESTRICTED_POLICY),
      ).toEqual({ ok: true });
    }
  });
```
```ts
  it('retains the mount policy switch for furnishing admission', () => {
    expect(
      listingEligibility(FURNISHING, undefined, {
        ...WOC_MARKET_RESTRICTED_POLICY,
        allowMounts: false,
      }),
    ).toEqual({ ok: false, reason: 'not_eligible_category' });
  });
```
```ts
  it('tolerates the same def-level binding as mounts', () => {
    expect(exchangeHardLock({ ...FURNISHING, soulbound: true }, undefined)).toBeNull();
  });
```
```ts
  it('keeps bound copies out of the Exchange', () => {
    expect(exchangeHardLock(FURNISHING, { boundTo: 0 })).toBe('bound_copy');
  });
```
```ts
  it('keeps armed copies out of the Exchange', () => {
    expect(exchangeHardLock(FURNISHING, { bindOnTrade: true })).toBe('bind_armed');
  });
```
```ts
  it('keeps locked copies out of the Exchange', () => {
    expect(exchangeHardLock(FURNISHING, { locked: true })).toBe('locked');
  });
```
```ts
  it('keeps no-list definitions out of the Exchange', () => {
    expect(exchangeHardLock({ ...FURNISHING, noMarketList: true }, undefined)).toBe(
      'no_market_list',
    );
  });
```
```ts
  it('keeps furnishing browse classification distinct from mounts', () => {
    expect(exchangeBrowseCategory(FURNISHING)).toBe('other');
  });
```
```ts
  it('has no Exchange browse subcategory', () => {
    expect(exchangeBrowseSubcategory(FURNISHING)).toBeNull();
  });
});

describe('furnishing presentation and input', () => {
```
```ts
  it('resolves the shared English kind label', () => {
    expect(itemKindLabel('furnishing')).toBe('Furnishing');
  });
```
```ts
  it('browses through exactly its own public market filter', () => {
    expect(marketItemMatches(ID, defaultMarketQuery())).toBe(true);
    expect(
      MARKET_ITEM_TYPE_FILTERS.filter(
        (itemType) =>
          itemType !== 'all' && marketItemMatches(ID, { ...defaultMarketQuery(), itemType }),
      ),
    ).toEqual(['furnishing']);
    expect(sanitizeMarketQuery({ itemType: 'furnishing' }).itemType).toBe('furnishing');
  });
```
```ts
  it('renders the literal furnishing browse chip label', () => {
    const window = MarketWindow.prototype as unknown as {
      marketItemTypeLabel: (kind: string) => string;
    };
    expect(window.marketItemTypeLabel('furnishing')).toBe('Furnishings');
  });
```
```ts
  it('respects furnishing market search and rarity while ignoring hidden equipment filters', () => {
    expect(
      marketItemMatches(ID, { ...defaultMarketQuery(), itemType: 'furnishing', search: 'missing' }),
    ).toBe(false);
    expect(
      marketItemMatches(ID, { ...defaultMarketQuery(), itemType: 'furnishing', rarity: 'epic' }),
    ).toBe(false);
    expect(
      marketItemMatches(ID, {
        ...defaultMarketQuery(),
        itemType: 'furnishing',
        search: 'Steel',
        rarity: 'rare',
        subtype: 'axe',
        armorClass: 'cloth',
        primaryStat: 'int',
      }),
    ).toBe(true);
  });
```
```ts
  it('hides unrelated market secondary menus', () => {
    expect(marketFilterMenus('furnishing')).toEqual({
      subtype: null,
      subtypeKind: null,
      armorClass: false,
      primaryStat: false,
    });
  });
```
```ts
  it('is reachable only through All in ordinary bags', () => {
    expect(BAG_CATEGORIES.filter((category) => matchesCategory(FURNISHING, category))).toEqual([
      'all',
    ]);
    expect(BAG_CATEGORIES).toEqual([
      'all',
      'weapon',
      'armor',
      'consumable',
      'material',
      'tool',
      'quest',
      'mount',
    ]);
  });
```
```ts
  it('retains normal bag search filtering in All', () => {
    const inventory = [{ itemId: ID, count: 1 }];
    expect(
      applyBagFilter(inventory, (id) => ITEMS[id], { ...DEFAULT_BAG_FILTER, search: 'Steel' }),
    ).toEqual(inventory);
    expect(
      applyBagFilter(inventory, (id) => ITEMS[id], { ...DEFAULT_BAG_FILTER, search: 'missing' }),
    ).toEqual([]);
  });
```
```ts
  it('uses a furnishing icon before the eel-name junk cascade', () => {
    expect(itemIconRecipe(ID)).toMatchObject({
      bg: 'wood',
      pal: 'earthBrown',
      prims: [{ p: 'crate' }],
    });
  });
```
```ts
  it('retains rarity effects on the furnishing icon', () => {
    expect(itemIconRecipe(ID).fx).toEqual(['glow']);
    ITEMS[ID] = { ...FURNISHING, quality: 'epic' };
    expect(itemIconRecipe(ID).fx).toEqual(['glow', 'sparkle']);
  });
```
```ts
  it('has no bag use hint', () => {
    expect(bagTooltipHintKey(FURNISHING, MODE)).toBe('');
  });
```
```ts
  it('has no ordinary bag click action', () => {
    expect(bagItemAction(FURNISHING, MODE)).toBe('none');
  });
```
```ts
  it('ordinary bag clicks invoke no command or repaint', () => {
    const call = vi.fn();
    const fake = { bagMode: () => MODE, deps: { world: call, showError: call }, render: call };
    const run = BagsWindow.prototype as unknown as {
      runBagAction: (
        item: ItemDef,
        slot: { itemId: string; count: number },
        ev: MouseEvent,
      ) => void;
    };
    run.runBagAction.call(fake, FURNISHING, { itemId: ID, count: 1 }, {} as MouseEvent);
    expect(call).not.toHaveBeenCalled();
  });
```
```ts
  it('keeps special bag storage and trading actions', () => {
    expect(bagItemAction(FURNISHING, { ...MODE, bankOpen: true, bankDeposit: true })).toBe(
      'bankDeposit',
    );
    expect(bagItemAction(FURNISHING, { ...MODE, tradeOpen: true })).toBe('trade');
    expect(bagItemAction(FURNISHING, { ...MODE, mailAttach: true })).toBe('mailAttach');
    expect(bagItemAction(FURNISHING, { ...MODE, marketSell: true })).toBe('marketSell');
  });
```
```ts
  it('has no bag capacity tooltip line', () => {
    expect(bagSlotsLineKey(FURNISHING)).toBeNull();
  });
```
```ts
  it('offers only its lock toggle in the context menu', () => {
    expect(bagItemContextActions(FURNISHING, ID)).toEqual([
      { id: 'lock', labelKey: 'hudChrome.bags.lockItem' },
    ]);
    expect(bagItemNewActions(FURNISHING, ID, { locked: true })).toEqual(['unlock']);
  });
```
```ts
  it('cannot be dragged onto the paperdoll', () => {
    expect(isPaperdollDraggable(FURNISHING)).toBe(false);
  });
```
```ts
  it('rejects the paperdoll drop by literal action', () => {
    expect(paperdollDropAction(FURNISHING, 'mainhand', 'warrior', 20)).toBe('blockedSlot');
  });
```
```ts
  it('uses ordinary rarity colors for item names', () => {
    for (const [quality, color] of [
      ['poor', '#9d9d9d'],
      ['common', '#ffffff'],
      ['uncommon', '#1eff00'],
      ['rare', '#0070dd'],
      ['epic', '#a335ee'],
      ['legendary', '#ff8000'],
    ] as const) {
      expect(itemNameColor({ ...FURNISHING, quality }), quality).toBe(color);
    }
    expect(itemNameColor({ ...FURNISHING, quality: undefined })).toBe('#ffffff');
    expect(itemNameColor({ ...FURNISHING, quality: 'constructor' })).toBe(
      'var(--color-quality-default)',
    );
  });
```
```ts
  it('uses ordinary rarity colors for market names', () => {
    expect(marketNameColor(FURNISHING.quality)).toBe('var(--mkt-name-rare)');
    expect(marketNameColor('common')).toBe('var(--mkt-name-common)');
    expect(marketNameColor(undefined)).toBe('var(--mkt-name-common)');
  });
```
```ts
  it('has no armor badge', () => {
    expect(marketArmorBadge(FURNISHING)).toBeNull();
  });
```
```ts
  it('never presents a furnishing as heroic gear', () => {
    for (const def of [
      { ...FURNISHING, heroic: true },
      { ...FURNISHING, heroicOf: 'test_base' },
    ]) {
      expect(isHeroicItem(def)).toBe(false);
      expect(marketHeroicStar(def, 'Heroic')).toBe('');
    }
  });
```
```ts
  it('has no pattern mark', () => {
    expect(marketPatternMark(FURNISHING, 'Pattern')).toBe('');
  });
```
```ts
  it('keeps malformed furnishing capabilities out of every UI action', () => {
    const def = {
      ...FURNISHING,
      slot: 'mainhand',
      armorType: 'mail',
      use: { type: 'hearth' },
      feast: { charges: 2 },
    } as unknown as ItemDef;
    ITEMS[ID] = def;
    expect(bagTooltipHintKey(def, MODE)).toBe('');
    expect(bagItemAction(def, MODE)).toBe('none');
    expect(bagItemNewActions(def, ID, undefined)).toEqual(['lock']);
    expect(isPaperdollDraggable(def)).toBe(false);
    expect(paperdollDropAction(def, 'mainhand', 'warrior', 20)).toBe('blockedSlot');
    expect(marketArmorBadge(def)).toBeNull();
    for (const use of [
      { type: 'fishing' },
      { type: 'gatherTool', professionId: 'mining', tier: 1 },
    ]) {
      ITEMS[ID] = { ...FURNISHING, use } as unknown as ItemDef;
      expect(bar().isAssignableAction(itemAction)).toBe(false);
    }
  });
```
```ts
  it('refuses action-bar assignment', () => {
    const controller = bar();
    expect(controller.isAssignableAction(itemAction)).toBe(false);
    expect(controller.actions).not.toContainEqual(itemAction);
  });
```
```ts
  it('refuses direct bar replacement', () => {
    const controller = bar();
    controller.replaceActions([itemAction]);
    expect(controller.actions[0]).toBeNull();
  });
```
```ts
  it('refuses loadout bar replacement', () => {
    const controller = bar();
    controller.replaceActionsForLoadout([itemAction], new Set(['sunder_armor']));
    expect(controller.actions[0]).toBeNull();
  });
```
```ts
  it('refuses configurable attack-slot replacement', () => {
    const controller = bar();
    controller.replaceAttackAction(itemAction);
    expect(controller.attackAction).toBeNull();
  });
```
```ts
  it('drops a persisted furnishing attack action without disturbing the normal bar', () => {
    const key = 'woc_hotbar_warrior_FurnishingTester';
    const storage = new Map([
      [key, JSON.stringify([{ type: 'ability', id: 'sunder_armor' }])],
      [`${key}:s0`, JSON.stringify(itemAction)],
    ]);
    const controller = bar(storage);
    controller.init();
    expect(controller.attackAction).toBeNull();
    expect(controller.actions[0]).toEqual({ type: 'ability', id: 'sunder_armor' });
    expect(storage.has(`${key}:s0`)).toBe(false);
  });
```
```ts
  it('cleans persisted furnishings without moving a valid ability', () => {
    const key = 'woc_hotbar_warrior_FurnishingTester';
    const storage = new Map([
      [key, JSON.stringify([itemAction, { type: 'ability', id: 'sunder_armor' }])],
    ]);
    const controller = bar(storage);
    controller.init();
    expect(controller.actions[0]).toBeNull();
    expect(controller.actions[1]).toEqual({ type: 'ability', id: 'sunder_armor' });
  });
});
```

## tests/furnishing_tooltip_view.test.ts

```ts
  it('footprint uses the literal key, resolved dimensions, and approved English', () => {
    expect(furnishingTooltipRows(furnishing)[0]).toEqual({
      key: 'hudChrome.housing.furnishing.footprint',
      values: { width: 2, depth: 3 },
    });
    expect(hudChromeStrings.housing.furnishing.footprint).toBe(
      'Footprint: {width} by {depth} cells.',
    );
    const wider: FurnishingItemDef = {
      ...furnishing,
      furnishing: { ...furnishing.furnishing, footprint: { width: 5, depth: 8 } },
    };
    expect(furnishingTooltipRows(wider)[0].values).toEqual({ width: 5, depth: 8 });
  });
```
```ts
  it('decor cost uses the literal key, resolved cost, and approved English', () => {
    expect(furnishingTooltipRows(furnishing)[1]).toEqual({
      key: 'hudChrome.housing.furnishing.decorCost',
      values: { cost: 7 },
    });
    expect(hudChromeStrings.housing.furnishing.decorCost).toBe('Decor cost: {cost}.');
    const free: FurnishingItemDef = {
      ...furnishing,
      furnishing: { ...furnishing.furnishing, decorCost: 0 },
    };
    expect(furnishingTooltipRows(free)[1].values).toEqual({ cost: 0 });
  });
```
```ts
  it('floor surface uses the literal key, no interpolations, and approved English', () => {
    expect(furnishingTooltipRows(furnishing)[2]).toEqual({
      key: 'hudChrome.housing.furnishing.surfaceFloor',
      values: {},
    });
    expect(hudChromeStrings.housing.furnishing.surfaceFloor).toBe('Placed on the floor.');
  });
```
```ts
  it('maker uses the literal key, copy signer, and approved English', () => {
    expect(furnishingTooltipRows(furnishing, { signer: 'Anna' })[3]).toEqual({
      key: 'hudChrome.housing.furnishing.maker',
      values: { maker: 'Anna' },
    });
    expect(hudChromeStrings.housing.furnishing.maker).toBe('Made by {maker}.');
    expect(furnishingTooltipRows(furnishing, { signer: 'Bryn' })[3].values).toEqual({
      maker: 'Bryn',
    });
  });
```
```ts
  it('unsigned copies have only the three placement rows', () => {
    expect(furnishingTooltipRows(furnishing)).toHaveLength(3);
    expect(furnishingTooltipRows(furnishing, {})).toHaveLength(3);
    expect(furnishingTooltipRows(furnishing, { signer: '' })).toHaveLength(3);
  });
```
```ts
  it('definition provenance never supplies or overrides a copy maker', () => {
    const defWithSigner: FurnishingItemDef & { signer: string } = {
      ...furnishing,
      signer: 'Definition Author',
    };
    expect(furnishingTooltipRows(defWithSigner)).toHaveLength(3);
    expect(furnishingTooltipRows(defWithSigner, { signer: 'Copy Maker' })[3]).toEqual({
      key: 'hudChrome.housing.furnishing.maker',
      values: { maker: 'Copy Maker' },
    });
  });
```
```ts
  it('other item kinds stay silent even with a signer', () => {
    const kinds = new Map(
      Object.values(ITEMS)
        .filter((def) => def.kind !== 'furnishing')
        .map((def) => [def.kind, def]),
    );
    expect([...kinds.keys()].sort()).toEqual([
      'armor',
      'bag',
      'drink',
      'elixir',
      'flask',
      'food',
      'held_offhand',
      'junk',
      'mount',
      'potion',
      'quest',
      'recipe',
      'scroll',
      'tool',
      'weapon',
    ]);
    for (const def of kinds.values()) {
      expect(furnishingTooltipRows(def, { signer: 'Anna' }), def.kind).toEqual([]);
      expect(furnishingTooltipLines(def, { signer: 'Anna' }), def.kind).toBe('');
    }
    const ordinary: ItemDef = {
      id: 'probe_junk_tooltip',
      name: 'Test Junk',
      kind: 'junk',
      sellValue: 0,
    };
    expect(furnishingTooltipRows(ordinary, { signer: 'Anna' })).toEqual([]);
    expect(furnishingTooltipLines(ordinary, { signer: 'Anna' })).toBe('');
  });
});

describe('furnishing tooltip composition', () => {
```
```ts
  it('renders ordered English lines with formatted resolved numbers', () => {
    const large: FurnishingItemDef = {
      ...furnishing,
      furnishing: {
        ...furnishing.furnishing,
        footprint: { width: 1250, depth: 2500 },
        decorCost: 12345,
      },
    };
    expect(furnishingTooltipLines(large, { signer: 'Anna' })).toBe(
      '<div class="tt-desc">Footprint: 1,250 by 2,500 cells.</div>' +
        '<div class="tt-desc">Decor cost: 12,345.</div>' +
        '<div class="tt-desc">Placed on the floor.</div>' +
        '<div class="tt-desc">Made by Anna.</div>',
    );
  });
```
```ts
  it('escapes a hostile signer at the thin composer seam', () => {
    const html = furnishingTooltipLines(furnishing, { signer: '<img src=x>&"' });
    expect(html).toContain('<div class="tt-desc">Made by &lt;img src=x&gt;&amp;&quot;.</div>');
    expect(html).not.toContain('<img');
  });
```
```ts
  it('HUD renders one escaped maker and preserves the copy lock line', () => {
    const html = composedTooltip(furnishing, { signer: '<Maker>', locked: true });
    expect(html).toContain('<div class="tt-desc">Footprint: 2 by 3 cells.</div>');
    expect(html).toContain('<div class="tt-desc">Decor cost: 7.</div>');
    expect(html).toContain('<div class="tt-desc">Placed on the floor.</div>');
    expect(html).toContain('Made by &lt;Maker&gt;.');
    expect(html.match(/&lt;Maker&gt;/g)).toHaveLength(1);
    expect(html).toContain('Locked');
    expect(html).not.toContain('Crafted by');
    expect(html).not.toContain('tt-makers-mark');
    expect(html).not.toContain('<Maker>');
  });
```
```ts
  it('HUD retains the extracted mount description, mobility and summon instruction', () => {
    const html = composedTooltip(ITEMS.reins_valorsteed);
    expect(html).toContain(
      '<div class="tt-desc">A hardy, sure-footed steed that provides enhanced travel speed.</div>',
    );
    expect(html).toContain('<div class="tt-green">+60% extra mobility</div>');
    expect(html).toContain('<div class="tt-sub">Use to summon this mount.</div>');
    expect(html).not.toContain('Footprint:');
  });
```
```ts
  it('HUD preserves crafted attribution on signed gear', () => {
    const html = composedTooltip(ITEMS.eastbrook_arming_sword, { signer: 'Anna' });
    expect(html).toContain('Crafted by Anna');
    expect(html).toContain('tt-makers-mark');
    expect(html).not.toContain('Made by');
  });
```
```ts
  it('HUD preserves gathered attribution for other signed item kinds', () => {
    const ordinary: ItemDef = {
      id: 'probe_junk_tooltip',
      name: 'Test Junk',
      kind: 'junk',
      sellValue: 0,
    };
    const html = composedTooltip(ordinary, { signer: 'Anna', locked: true });
    expect(html).toContain('Gathered by Anna');
    expect(html).not.toContain('Crafted by');
    expect(html).not.toContain('tt-makers-mark');
    expect(html).toContain('Locked');
    expect(html).not.toContain('Made by');
    expect(html).not.toContain('Footprint:');
  });
});

describe('furnishing drops through the live HUD action-bar handlers', () => {
```
```ts
  it.each([
    { name: 'normal slot, external bag payload', slot: 2, source: 'external' },
    { name: 'normal slot, stale attack drag', slot: 2, source: 'attack' },
    { name: 'freed attack slot, external bag payload', slot: 0, source: 'external' },
    { name: 'freed attack slot, stale normal drag', slot: 0, source: 'normal' },
  ] as const)('refuses $name without saving or moving other actions', ({ slot, source }) => {
    const previousDef = ITEMS[FURNISHING.id];
    ITEMS[FURNISHING.id] = FURNISHING;
    const root = document.createElement('div');
    root.innerHTML =
      '<div id="actionbar"></div><div id="actionbar2"></div><div id="actionbar3"></div>';
    document.body.append(root);
    try {
      const values = new Map<string, string>();
      const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: vi.fn((key: string, value: string) => {
          values.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          values.delete(key);
        }),
      };
      const sendLayout = vi.fn();
      const settingsWrite = vi.fn();
      const controller = new ActionBarController({
        storage,
        playerClass: 'warrior',
        playerName: 'FurnishingDropTester',
        playerLevel: () => 20,
        talentSpec: () => null,
        knownAbilityIds: () => ['sunder_armor'],
        hasAura: () => false,
        showAttackButton: () => false,
        persistLayout: sendLayout,
      });
      controller.init();
      const actions: HotbarAction[] = Array.from({ length: ACTION_BAR_ABILITY_SLOTS }, () => null);
      actions[0] = { type: 'ability', id: 'sunder_armor' };
      actions[1] = { type: 'item', id: 'reins_valorsteed' };
      controller.replaceActions(actions);
      controller.replaceAttackAction({ type: 'ability', id: 'sunder_armor' });
      controller.saveActions();
      controller.saveAttackAction();
      const noop = () => {};
      const runtimeHud = Object.assign(Object.create(Hud.prototype), {
        actionBarController: controller,
        abilityButtons: [],
        actionbarEl: root.querySelector('#actionbar'),
        keybinds: { primaryLabel: () => '' },
        sim: { known: [] },
        optionsHooks: { settings: { get: () => false, set: settingsWrite } },
        writerFacet: makeWriterFacet(
          new WeakMap(),
          new WeakMap(),
          new WeakMap(),
          new WeakMap(),
          noop,
          noop,
        ),
        bindEmpoweredActionHold: noop,
        attachTooltip: noop,
        hideTooltip: noop,
        buildMobileActionRing: noop,
        buildMobileConsumableSeat: noop,
        buildStanceBar: noop,
        dragAction: null,
      }) as {
        buildActionBar(): void;
        abilityButtons: { btn: HTMLButtonElement }[];
        dragAction: {
          action: Exclude<HotbarAction, null>;
          sourceIndex: number | null;
          sourceAttackSlot?: boolean;
        } | null;
      };
      runtimeHud.buildActionBar();
      const target = runtimeHud.abilityButtons[slot].btn;
      const dispatch = (kind: 'dragover' | 'drop', action: Exclude<HotbarAction, null>): Event => {
        const event = new Event(kind, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
          value: {
            types: [HOTBAR_ACTION_MIME],
            getData: (mime: string) => (mime === HOTBAR_ACTION_MIME ? JSON.stringify(action) : ''),
            dropEffect: 'none',
          },
        });
        target.dispatchEvent(event);
        return event;
      };
      const resetCalls = () => {
        storage.setItem.mockClear();
        storage.removeItem.mockClear();
        sendLayout.mockClear();
        settingsWrite.mockClear();
      };
      resetCalls();
      const before = {
        actions: structuredClone(controller.actions),
        attack: structuredClone(controller.attackAction),
        storage: [...values],
      };
      const rejected: Exclude<HotbarAction, null> = { type: 'item', id: FURNISHING.id };
      if (source !== 'external') {
        // A stale or malformed in-memory drag must be refused before it can
        // clear the valid source slot or configured attack action.
        runtimeHud.dragAction = {
          action: rejected,
          sourceIndex: source === 'normal' ? 0 : null,
          sourceAttackSlot: source === 'attack',
        };
      }
      expect(dispatch('dragover', rejected).defaultPrevented).toBe(false);
      expect(target.classList.contains('drop-target')).toBe(false);
      dispatch('drop', rejected);
      expect(controller.actions).toEqual(before.actions);
      expect(controller.actions[0]).toEqual({ type: 'ability', id: 'sunder_armor' });
      expect(controller.actions[1]).toEqual({ type: 'item', id: 'reins_valorsteed' });
      expect(controller.attackAction).toEqual(before.attack);
      expect([...values]).toEqual(before.storage);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.removeItem).not.toHaveBeenCalled();
      expect(sendLayout).not.toHaveBeenCalled();
      expect(settingsWrite).not.toHaveBeenCalled();

      // Positive control: the same mounted listeners accept and save an
      // eligible item, so the rejected drop's silence cannot be a dead fixture.
      runtimeHud.dragAction = null;
      const accepted: Exclude<HotbarAction, null> = { type: 'item', id: 'reins_valorsteed' };
      expect(dispatch('dragover', accepted).defaultPrevented).toBe(true);
      expect(target.classList.contains('drop-target')).toBe(true);
      dispatch('drop', accepted);
      expect(storage.setItem).toHaveBeenCalled();
      expect(sendLayout).toHaveBeenCalled();
      expect(target.classList.contains('drop-target')).toBe(false);
    } finally {
      root.remove();
      if (previousDef === undefined) delete ITEMS[FURNISHING.id];
      else ITEMS[FURNISHING.id] = previousDef;
    }
  });
});
```

## tests/mount_tooltip_view.test.ts

```ts
  it('preserves the collectible reins description, mobility, and summon markup', () => {
    expect(mountTooltipLines(ITEMS.reins_valorsteed)).toBe(
      '<div class="tt-desc">A hardy, sure-footed steed that provides enhanced travel speed.</div>' +
        '<div class="tt-green">+60% extra mobility</div>' +
        '<div class="tt-sub">Use to summon this mount.</div>',
    );
  });
```
```ts
  it('rounds a different speed and permits a mount without a description key', () => {
    const original = MOUNTS.valorsteed;
    try {
      MOUNTS.valorsteed = {
        ...original,
        key: 'test_unlabeled_mount' as typeof original.key,
        moveSpeedPct: 0.755,
      };
      expect(mountTooltipLines(ITEMS.reins_valorsteed)).toBe(
        '<div class="tt-green">+76% extra mobility</div><div class="tt-sub">Use to summon this mount.</div>',
      );
    } finally {
      MOUNTS.valorsteed = original;
    }
  });
```
```ts
  it('renders nothing for non-mount items', () => {
    expect(mountTooltipLines(ITEMS.iron_ore)).toBe('');
  });
```
```ts
  it('renders nothing when a mount definition is absent', () => {
    const missing: MountItemDef = {
      ...(ITEMS.reins_valorsteed as MountItemDef),
      mount: 'probe_missing_mount' as MountItemDef['mount'],
    };
    expect(mountTooltipLines(missing)).toBe('');
  });
});
```
