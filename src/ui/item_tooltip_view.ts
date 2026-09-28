// The composed item tooltip card: title, quality and kind, slot and armor
// weight, the optional item-level readout, the per-copy instance lines, every
// purpose and use line the pure tooltip siblings build, the set block, and the
// classic side-by-side comparison with what is worn. Extracted from Hud (it
// read no Hud state beyond its world and one setting), so every surface that
// shows an item card (bags, bank, vendor, crafting, market, mail, the action
// bar, chat links, the paperdoll) composes the SAME string through here, and a
// test drives the real composition without importing the Hud coordinator.
//
// Pure and DOM-free (registered in tests/architecture.test.ts UI_PURE_CORES):
// the caller hands in a narrow IWorld slice and the live Show Item Level
// setting as a thunk, so the setting is read per call and only when the
// readout is actually eligible, exactly where Hud used to read it.

import { ITEMS, QUESTS } from '../sim/data';
import { canEquipItem, isUniqueEquipped, weaponHand } from '../sim/equipment_rules';
import type { FactionId } from '../sim/factions';
import { isItemLevelEligible, itemInstanceLevel, itemScore } from '../sim/item_level';
import type { MaterialComposition } from '../sim/material_sources';
import { CONSUME_DURATION, type ItemDef, type ItemInstancePayload } from '../sim/types';
import type { IWorld } from '../world_api';
import { bagSlotsLineKey } from './bags_view';
import { questObjectiveLabel, questTitle } from './entity_display_core';
import { classDisplayName, itemDisplayName, itemSetBonusField, tEntity } from './entity_i18n';
import { esc } from './esc';
import { gatherToolTooltipLines } from './gather_tool_tooltip';
import { factionRewardTooltipLines } from './hud/faction_reward_tooltip_view';
import { furnishingItemTooltip, hearthKeyTooltipLines } from './hud/housing';
import { cookingCatchHintKey } from './hud/professions/cooking_catch_hint_view';
import { elixirTooltipLines } from './hud/professions/elixir_tooltip_view';
import { feastTooltipLines } from './hud/professions/feast_tooltip_view';
import { materialHintLine } from './hud/professions/material_hint_view';
import { materialProfessionHintText } from './hud/professions/material_profession_hint_view';
import { mobileStationTooltipLines } from './hud/professions/mobile_station_tooltip';
import { recipePatternTooltipLines } from './hud/professions/recipe_pattern_tooltip_view';
import { stationNameText } from './hud/professions/station_name_view';
import { wellFedTooltipLines } from './hud/professions/wellfed_tooltip_view';
import { CHROME_TONE } from './hud_tones';
import { formatNumber, t } from './i18n';
import { itemArmorTypeLabelKey } from './item_armor_type';
import { requiredClassesForTooltip } from './item_class_restriction';
import { itemCombatTooltipLines } from './item_combat_tooltip_view';
import { itemCompareBlocksHtml } from './item_compare_view';
import {
  instanceBadgeLines,
  instanceBindingLines,
  instanceLockLine,
  instancePartyTradeLine,
  instanceTitleHtml,
  itemNumber,
  itemRequiredLevelLine,
  materialMakersMarkLines,
  tooltipEffectiveQuality,
  vendorSellTooltipLine,
} from './item_instance_tooltip';
import { itemKindLabel, itemQualityLabel } from './item_kind_label';
import {
  equippedSetTooltipPieces,
  itemSetMemberCounts,
  itemSetTooltipModel,
} from './item_set_tooltip_view';
import { itemSlotLabel as itemSlotName } from './item_slot_labels';
import { masterwroughtTooltipLines } from './masterwrought_cap_view';
import { mountTooltipLines } from './mount_tooltip_view';
import {
  QUEST_ITEM_TOOLTIP_COLOR,
  type QuestItemTooltipModel,
  questItemTooltipModel,
  questItemTooltipRelatedKey,
} from './quest_item_tooltip_view';
import { questProgressText } from './quest_progress_text';
import { itemLevelReadout } from './rift_band_tooltip';
import { stackSizeTooltipLine } from './stack_size_tooltip_view';
import { toolEffectTooltipLines } from './tool_effect_tooltip';
import { tooltipLine } from './tooltip_line_core';
import { trinketTooltipLines } from './trinket_tooltip_view';
import { type WeaponProcEffectDesc, weaponProcLines } from './weapon_proc_view';
import { weaponTypeLabelKey } from './weapon_type_label';

/** The IWorld reads the item card makes: the viewer's level and class (the
 *  required-level and armor-weight lines, trinket text), the realm's Freeholds
 *  flag and the craft identity (pattern lines), worn gear and its per-copy
 *  payloads (masterwrought cap, set count, comparison), the quest log (quest
 *  item progress), and the party-trade clock (the soulbound trade window). */
export type ItemTooltipWorld = Pick<
  IWorld,
  | 'player'
  | 'cfg'
  | 'equipment'
  | 'equipmentInstances'
  | 'questLog'
  | 'craftingIdentity'
  | 'partyTradeMsRemaining'
>;

export interface ItemTooltipDeps {
  readonly world: ItemTooltipWorld;
  /** The live Show Item Level setting (off by default). A thunk, not a value:
   *  read per hover, so toggling it takes effect on the next tooltip. */
  readonly showItemLevel: () => boolean;
}

// `instance` is the optional per-copy payload (#1165): a masterwork seal, a
// maker's mark, or baked bonus stats specific to THIS copy. Absent for
// fungible stacks and def-only surfaces (the crafting window's result rows),
// so those render exactly as before.
export function itemTooltipHtml(
  item: ItemDef,
  deps: ItemTooltipDeps,
  compare = true,
  instance?: ItemInstancePayload,
  materialSources?: MaterialComposition,
): string {
  const world = deps.world;
  if (item.kind === 'furnishing') return furnishingItemTooltip(item, instance, world);
  // Quest items are a purpose class, not a quality tier: title and kind use
  // quest gold, and the kind line is "Quest Item" alone (never "Common Quest
  // Item"). Story lines (related quest, progress, rules, orphaned) come from
  // the pure model; escape and tEntity stay in this composer.
  const questModel = questItemTooltipFor(item, world);
  // Title: quest gold for quest kinds, else the copy's EFFECTIVE quality; a
  // named copy titles the card (item_instance_tooltip.ts owns the rules).
  let html = instanceTitleHtml(item, instance, itemDisplayName(item));
  // Quality/kind line, e.g. "Epic Armor". Heroic items (dungeon upgraded variants
  // via heroicOf, bespoke heroic-tier raid gear via heroic) append a gold
  // "[HEROIC]" tag here (never in the name) so the drop reads "Epic Armor [HEROIC]".
  // Quest kinds skip the quality half so the line is a single quest-gold
  // "Quest Item" (no redundant Common + second Quest Item desc).
  if (questModel && !questModel.showQuality) {
    html += `<div class="tt-sub" style="color:${QUEST_ITEM_TOOLTIP_COLOR}">${esc(
      t(questModel.kindLineKey),
    )}</div>`;
  } else {
    let qualityKindHtml = esc(
      t('itemUi.tooltip.qualityKind', {
        quality: itemQualityLabel(tooltipEffectiveQuality(item, instance)),
        kind: itemKindLabel(item.kind, item.id),
      }),
    );
    if (item.heroicOf || item.heroic) {
      qualityKindHtml += ` <span style="color:${CHROME_TONE.HEROIC_TAG}">${esc(t('hudChrome.itemHeroicTag'))}</span>`;
    }
    html += `<div class="tt-sub">${qualityKindHtml}</div>`;
  }
  // Weapon type (Sword/Dagger/Mace/...) as its own plain line under the
  // quality/kind line and above the slot/handedness line, classic-style, so a
  // player can tell a dagger from a sword at a glance (rogues need daggers). It
  // is NOT colored by class the way armor weight is: any class can equip most
  // weapon types and the class/weapon rules are archetype-based, not type-based,
  // so a red type label would mislead. Null only for a non-weapon or
  // unclassified id (the map is guarded), which simply shows no type line.
  if (item.kind === 'weapon') {
    const weaponTypeKey = weaponTypeLabelKey(item.id);
    if (weaponTypeKey) {
      html += `<div class="tt-sub tt-weapon-type">${esc(t(weaponTypeKey))}</div>`;
    }
  }
  if (item.slot) {
    // Classic layout: slot name on the left, armor subtype (Cloth/Leather/Mail)
    // right-aligned on the same line so it is clear which classes the gear suits.
    // A two-handed weapon reads "Two-Hand" (the classic label), not its
    // mainhand slot: the hand, not the paperdoll cell, is what the player needs.
    const slotName =
      item.kind === 'weapon' && weaponHand(item) === 'twohand'
        ? t('itemUi.slots.twoHand')
        : itemSlotName(item.slot);
    const armorTypeKey = itemArmorTypeLabelKey(item);
    // Unique-equipped tag (every EFFECTIVE legendary with a slot, a phase 13
    // promoted copy included; one worn copy per item family): rendered in
    // the armor-weight indicator's type seat, soulbound gold; with an armor
    // weight already there it takes its own gold line so neither is lost.
    const unique = isUniqueEquipped(item, instance);
    const uniqueTag = unique ? t('hudChrome.itemUniqueEquipped') : null;
    if (armorTypeKey) {
      // Red armor type = the viewing player's class cannot wear this armor weight
      // (e.g. a mage hovering Mail), so they know it is not for them at a glance.
      const badClass = canEquipItem(world.cfg.playerClass, item) ? '' : ' tt-armor-bad';
      html += `<div class="tt-sub tt-row"><span>${esc(slotName)}</span><span class="tt-armor${badClass}">${esc(t(armorTypeKey))}</span></div>`;
      if (uniqueTag) {
        html += `<div class="tt-sub" style="color:var(--gold)">${esc(uniqueTag)}</div>`;
      }
    } else if (uniqueTag) {
      html += `<div class="tt-sub tt-row"><span>${esc(slotName)}</span><span class="tt-unique">${esc(uniqueTag)}</span></div>`;
    } else {
      html += `<div class="tt-sub">${esc(slotName)}</div>`;
    }
    // Masterwrought (the crafted-apex tier) is a COUNTED family, not the
    // one-copy rule above: the tag names the budget the whole family shares
    // rather than this one item, and reads that budget off the sim's own cap
    // so the number can never drift from the rule. It always takes its own
    // gold line, never the type seat, because a piece can carry both tags.
    if (item.masterwrought) {
      for (const line of masterwroughtTooltipLines(
        world.equipment,
        ITEMS,
        tooltipEffectiveQuality(item, instance),
      ))
        html += `<div class="tt-sub" style="color:var(--gold)">${esc(t(line.key, line.values))}</div>`;
    }
  }
  // Optional item-level readout (off by default; src/sim/item_level.ts derives it
  // from where the item drops). Read live, so toggling it takes effect on the next
  // hover. Combat gear only: sourceless items (vendor/starter) have no level, and
  // non-combat items never get the line. A quality-rolled copy ALWAYS shows it
  // (deliberate: its badge means "+N item levels", so the readout is the badge's
  // legend, not the optional setting). A Riftbound band or quality copy is priced
  // by its payload, not its stat-free shell, so its level/score come from
  // itemLevelReadout; itemInstanceLevel/itemScore stay the source for the rest.
  if (isItemLevelEligible(item) && (instance?.lootQuality || deps.showItemLevel())) {
    let readout: { level: number; score: number } | undefined;
    if (instance?.rift || instance?.lootQuality) {
      readout = itemLevelReadout(item, instance);
    } else {
      const level = itemInstanceLevel(item, instance);
      readout = level === undefined ? undefined : { level, score: itemScore(item) };
    }
    if (readout) {
      html += `<div class="tt-stat" style="color:var(--gold)">${esc(
        t('hudChrome.options.itemLevelLine', { level: itemNumber(readout.level) }),
      )}</div>`;
      html += `<div class="tt-sub">${esc(
        t('hudChrome.options.itemScoreLine', {
          score: itemNumber(readout.score, 1),
        }),
      )}</div>`;
    }
  }
  // Bound-to-owner marker (marks and other soulbound tokens): shown like the
  // classic "Soulbound" line so a player can see it cannot be traded or destroyed.
  if (item.soulbound) {
    html += `<div class="tt-sub" style="color:var(--gold)">${esc(t('hudChrome.itemSoulbound'))}</div>`;
    // BoP party trade window: qualifies the Soulbound line while this copy can
    // still be traded to the players who shared its drop; def-gated, so a legacy
    // marker on a since-freed drop renders nothing (the world owns the clock).
    html += instancePartyTradeLine(instance, (ms) => world.partyTradeMsRemaining(ms));
  }
  // Maker's Bond lines (Professions 2.0): the commission
  // binds-on-first-trade warning or the bound lock, beside the def-level
  // soulbound line it parallels (item_instance_tooltip.ts owns the copy
  // rules, incl. the equipment-kind scope and the no-name doctrine).
  html += instanceBindingLines(instance, item.kind);
  // Player item lock (issue 3042): the owner's own safety mark, not scoped
  // to any item kind (item_instance_tooltip.ts owns the copy rules).
  html += instanceLockLine(instance);
  // Per-copy instance badges (Professions 2.0): the masterwork
  // seal and the enchanted marker (item_instance_tooltip.ts owns the copy
  // rules, incl. never claiming a quality-rank upgrade).
  html += instanceBadgeLines(instance);
  html += itemCombatTooltipLines(item, instance);
  if (item.foodHp)
    html += `<div class="tt-desc">${esc(t('itemUi.tooltip.useFood', { amount: itemNumber(item.foodHp), seconds: itemNumber(CONSUME_DURATION) }))}</div>`;
  if (item.drinkMana)
    html += `<div class="tt-desc">${esc(t('itemUi.tooltip.useDrink', { amount: itemNumber(item.drinkMana), seconds: itemNumber(CONSUME_DURATION) }))}</div>`;
  // Directly under the restore line it qualifies: a buff food (farm dish or
  // apex role plate) heals while you sit AND leaves Well Fed once the meal
  // finishes, so the two read in the order the player experiences them. The
  // ONE well-fed line per tooltip (src/ui/hud/professions/wellfed_tooltip_view.ts).
  html += wellFedTooltipLines(item);
  // Gathering implements (#2343): picks/axes/sickles/rods and the simple
  // pole render their kind, requirement, use, and bonus lines from the
  // pure sibling module (the item_instance_tooltip.ts pattern).
  html += gatherToolTooltipLines(item);
  // Tool-effect charms (Gatherer's Cache / Artisan's Eye): what the charm
  // does, how to slot it from Professions, and the charge ladder. Bags,
  // bank, crafting, and market all compose this through itemTooltip.
  html += toolEffectTooltipLines(item);
  // Mobile-station tools (Master's Field Forge): what placing does, the
  // party radius, the duration, and the replace rule; same all-surfaces
  // composition (mobile_station_tooltip.ts).
  html += mobileStationTooltipLines(item, stationNameText);
  // Purpose hint for the eight enchanting materials (material_hint_view.ts
  // keys the table by item id): what the reagent is for and which gear
  // disenchants into it. Every other item id renders nothing here.
  html += materialHintLine(item.id);
  // Raw cooking catches: pure key table + the shared tooltipLine builder (no
  // foodHp / restore-health line; no materialHintLine HTML growth). The text
  // is escaped by the builder, never interpolated raw.
  const cookingHintKey = cookingCatchHintKey(item.id);
  if (cookingHintKey) html += tooltipLine('tt-desc', t(cookingHintKey));
  // Profession affinity for honest materials (material_profession_hint_view.ts):
  // "Used by Leatherworking, ..." derived from live recipe/enchant consumers.
  // Skips when a more specific purpose line above already covers a single
  // craft. Painted like the cooking hint (the shared tooltipLine builder);
  // the tt-material-use modifier carries the theme-emitted tint.
  const materialUseText = materialProfessionHintText(item.id);
  if (materialUseText) {
    html += tooltipLine('tt-desc', materialUseText, 'tt-material-use');
  }
  if (item.potionHp)
    html += `<div class="tt-desc">${esc(t('itemUi.tooltip.useHealingPotion', { amount: itemNumber(item.potionHp) }))}</div>`;
  if (item.potionHpPctMax)
    html += `<div class="tt-desc">${esc(t('itemUi.tooltip.useHealingPotionPct', { percent: formatNumber(item.potionHpPctMax * 100) }))}</div>`;
  if (item.potionMana)
    html += `<div class="tt-desc">${esc(t('itemUi.tooltip.useManaPotion', { amount: itemNumber(item.potionMana) }))}</div>`;
  // Battle elixirs: the temporary stat-buff quaffing grants (sim/items.ts
  // useItem), from the pure sibling view so bags, bank, crafting, vendor,
  // and market all state what the elixir does.
  html += elixirTooltipLines(item);
  // The faction quartermaster goods (hud/faction_reward_tooltip_view.ts). The
  // attunement is a Sim-only read the release takes structurally, so a world
  // without it (ClientWorld today) shows the unattuned line.
  html += factionRewardTooltipLines(
    item,
    (world as { alliedHearthstoneAttunement?: FactionId }).alliedHearthstoneAttunement,
  );
  // Patterns share their realm, skill and knownness gates across item surfaces.
  // Gate the identity read by kind: Sim copies and sorts this projection;
  // other item hovers should not pay for it. ClientWorld mirrors it directly.
  if (item.kind === 'recipe') {
    html += recipePatternTooltipLines(item, world.craftingIdentity, world.cfg.freeholdsEnabled);
  }
  html += feastTooltipLines(item);
  html += hearthKeyTooltipLines(item);
  // Quest story block (related quest, progress, rules, orphaned). Replaces the
  // old plain "Quest Item" desc that doubled the kind line.
  if (questModel) html += questItemTooltipStoryHtml(questModel);
  {
    const slotsKey = bagSlotsLineKey(item);
    // The bagSlots guard is load-bearing twice over: it keeps the old
    // no-line behavior for a slotless bag def AND narrows the number for
    // itemNumber (the leaf's null covers only the non-bag arm).
    if (slotsKey && item.bagSlots)
      html += `<div class="tt-stat">${esc(t(slotsKey, { slots: itemNumber(item.bagSlots) }))}</div>`;
  }
  html += mountTooltipLines(item);
  const requiredClasses = requiredClassesForTooltip(item);
  if (requiredClasses) {
    html += `<div class="tt-sub">${esc(t('itemUi.tooltip.classes', { classes: requiredClasses.map(classDisplayName).join(', ') }))}</div>`;
  }
  html += itemRequiredLevelLine(item, world.player.level);
  html += itemProcBlock(item) + trinketTooltipLines(item, world.player);
  html += itemSetBlock(item, world);
  html += materialMakersMarkLines(item, instance, materialSources);
  // Stackables state their per-slot cap (sim/bags.ts stackSizeOf), so a
  // player holding a single potion learns more copies will share the slot;
  // 1-per-slot kinds, mounts, and charge-bearing payloads render nothing.
  html += stackSizeTooltipLine(item, instance);
  html += vendorSellTooltipLine(item);
  if (compare) html += itemCompareBlock(item, deps, instance);
  return html;
}

// Legendary "chance on action" procs: one green trigger line per proc, each
// wrapping its joined effect fragments. Reads ItemDef.weaponProcs through the
// pure weapon_proc_view core so the derived numbers stay unit-tested.
function itemProcBlock(item: ItemDef): string {
  const lines = weaponProcLines(item.kind === 'weapon' ? item.weaponProcs : undefined);
  if (!lines.length) return '';
  let html = '';
  for (const line of lines) {
    const effect = line.effects.map((e) => procEffectText(e)).join(' ');
    const triggerKey =
      // onMeleeHit is the legacy key id; its English reads the generic "Chance on
      // hit", correct for a weaponHit proc that fires on melee AND hunter ranged.
      line.trigger === 'weaponHit'
        ? 'hudChrome.itemProc.onMeleeHit'
        : line.trigger === 'spellDamage'
          ? 'hudChrome.itemProc.onSpellDamage'
          : 'hudChrome.itemProc.onHeal';
    html += `<div class="tt-green">${esc(
      t(triggerKey, {
        chance: formatNumber(line.chancePct, { maximumFractionDigits: 0 }),
        effect,
      }),
    )}</div>`;
  }
  return html;
}

// One effect fragment (chain arc / attack slow / dot / hot) as localized text.
function procEffectText(e: WeaponProcEffectDesc): string {
  const n = (v: number | undefined): string => formatNumber(v ?? 0, { maximumFractionDigits: 0 });
  switch (e.kind) {
    case 'chainArc':
      return t('hudChrome.itemProc.chainArc', {
        school: e.school ?? '',
        name: e.name ?? '',
        damage: n(e.damage),
        jumps: n(e.jumps),
      });
    case 'attackSlow':
      return t('hudChrome.itemProc.attackSlow', {
        pct: n(e.slowPct),
        duration: n(e.duration),
      });
    case 'dot':
      return t('hudChrome.itemProc.dot', {
        name: e.name ?? '',
        school: e.school ?? '',
        total: n(e.total),
        duration: n(e.duration),
      });
    case 'hot':
      return t('hudChrome.itemProc.hot', {
        name: e.name ?? '',
        total: n(e.total),
        duration: n(e.duration),
      });
  }
}

// How many equipped pieces belong to the given set (read from IWorld.equipment
// so it is identical offline and online).
function equippedSetPieces(setId: string, world: ItemTooltipWorld): number {
  return equippedSetTooltipPieces(setId, Object.values(world.equipment));
}

// Classic tier-set block: the set name with the live (have/total) piece count,
// then each bonus tier - lit when its threshold is met, greyed otherwise. Set
// name and bonus text localize through entity_i18n (English source in
// content/item_sets.ts).
function itemSetBlock(item: ItemDef, world: ItemTooltipWorld): string {
  if (!item.set) return '';
  const model = itemSetTooltipModel({
    itemSetId: item.set,
    equippedPieces: equippedSetPieces(item.set, world),
    itemSetMembers: itemSetMemberCounts(),
  });
  if (!model) return '';
  const name = tEntity({ kind: 'itemSet', id: model.setId, field: 'name' });
  let html = `<div class="tt-set-name">${esc(t('hudChrome.itemSet.header', { name, have: formatNumber(model.equippedPieces, { maximumFractionDigits: 0 }), total: formatNumber(model.totalPieces, { maximumFractionDigits: 0 }) }))}</div>`;
  for (const tier of model.bonusTiers) {
    // The field NAMES its tier's piece count (itemSetBonusField): the old
    // 2/3/4 ternary chain silently painted the 4-piece text for any other
    // breakpoint, which is what a 7-piece tier would have shipped as.
    const text = tEntity({
      kind: 'itemSet',
      id: model.setId,
      field: itemSetBonusField(tier.pieces),
    });
    html += `<div class="tt-set-bonus${tier.active ? ' active' : ''}">${esc(t('hudChrome.itemSet.bonusLine', { pieces: formatNumber(tier.pieces, { maximumFractionDigits: 0 }), bonus: text }))}</div>`;
  }
  return html;
}

// Classic-style item comparison (the item_compare_view pure core): the deps
// supply the world's equipment reads and this composer is the renderer for
// the worn side, so BOTH sides carry per-copy stats and titles.
function itemCompareBlock(
  item: ItemDef,
  deps: ItemTooltipDeps,
  instance?: ItemInstancePayload,
): string {
  return itemCompareBlocksHtml(
    item,
    { equipment: deps.world.equipment, instances: deps.world.equipmentInstances },
    (id) => ITEMS[id],
    (equipped, worn) => itemTooltipHtml(equipped, deps, false, worn),
    instance,
  );
}

/** Pure quest-item tooltip model for one def, or null for non-quest kinds. */
function questItemTooltipFor(item: ItemDef, world: ItemTooltipWorld): QuestItemTooltipModel | null {
  if (item.kind !== 'quest') return null;
  const questId = item.questId;
  const quest = questId ? QUESTS[questId] : undefined;
  const log = questId ? world.questLog.get(questId) : undefined;
  return questItemTooltipModel({
    kind: item.kind,
    itemId: item.id,
    questId,
    questKnown: !!quest,
    log: log
      ? {
          counts: log.counts,
          state: log.state,
          resolvedCounts: log.resolvedCounts,
        }
      : null,
    objectives: quest?.objectives.map((objective) => ({
      type: objective.type,
      itemId: 'itemId' in objective ? objective.itemId : undefined,
      count: objective.count,
    })),
  });
}

/** Story lines under the quest kind row: related quest, progress, rules, orphaned. */
function questItemTooltipStoryHtml(model: QuestItemTooltipModel): string {
  let html = '';
  if (model.relatedQuestId) {
    html += `<div class="tt-sub" style="color:${QUEST_ITEM_TOOLTIP_COLOR}">${esc(
      t(questItemTooltipRelatedKey(), { quest: questTitle(model.relatedQuestId) }),
    )}</div>`;
  }
  if (model.progress && model.relatedQuestId) {
    html += `<div class="tt-sub">${esc(
      questProgressText(
        questObjectiveLabel(model.relatedQuestId, model.progress.objectiveIndex),
        model.progress.current,
        model.progress.required,
      ),
    )}</div>`;
  }
  html += `<div class="tt-desc">${esc(t(model.rulesKey))}</div>`;
  if (model.orphaned) {
    html += `<div class="tt-desc">${esc(t(model.orphanedKey))}</div>`;
  }
  return html;
}
