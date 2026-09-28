// The HUD's routing of a profession result event (extracted whole from the
// Hud's per-event switch, the quest_event_router.ts shape): the craft, unbind
// and tool-effect results, the masterwork zone broadcast, the four text-free
// Professions 2.0 events (profTrendNudge, profTierTutorial, attuned,
// attunedZone), the gather and corpse-harvest results, and the disenchant,
// salvage, enchant and fishing results. Each arm is the event-to-line doctrine
// of its own flow (one chat line per grant, #2430; one cue per command); the
// pure cores it reads own every key and tone decision. The other profession
// arms stay in the Hud's switch (recipe training, the Perfecting swap, the
// masterwork proc that feeds the drain-local celebration, the commission
// board, the legendary lines, the gather denials, the fishing bite family,
// farming, the rare-gather broadcast and the spectator-gated harvest
// preference open); each type has one home, pinned in
// tests/profession_event_router.test.ts.
//
// It takes a typed host (ProfessionEventHost) and Hud passes itself, so tsc checks
// Hud against the host; the member names are also welded in
// tests/profession_event_router.test.ts.

import { audio } from '../../../game/audio';
import { ALL_RECIPES, ITEMS } from '../../../sim/data';
import type { SimEvent } from '../../../sim/types';
import type { BannerVariant } from '../../banner_slot';
import { itemDisplayName, tEntity } from '../../entity_i18n';
import { craftedLineKey, grantItemToken, grantQtyText } from '../../grant_line_view';
import { HUD_LOG } from '../../hud_tones';
import {
  formatMoney as formatLocalizedMoney,
  formatNumber,
  type TranslationKey,
  t,
} from '../../i18n';
import { QUALITY_COLOR } from '../../icons';
import { toolEffectNameKey } from '../../tool_effect_name';
import { unbindDenyKey } from '../vendor/unbind_view';
import { masterworkZoneLine } from './craft_celebration_text_view';
import { archetypeTitleText } from './craft_name_view';
import { craftDenyMessage } from './crafting_deny_core';
import {
  applyEnchantResultToast,
  disenchantResultToast,
  disenchantSecondaryLineKey,
  salvageResultToast,
} from './enchanting_view';
import { gatheringProfessionNameKey } from './gathering_profession_name';
import {
  type GatherResultFeedbackHost,
  handleGatherResult,
  handleHarvestResult,
} from './gathering_result_feedback';
import { type ProfessionEventInput, planProfessionEvent } from './profession_event_lines_core';
import { PROF_LOG_DENY, PROF_LOG_GRANT } from './profession_log_tones';
import { stationNameText } from './station_name_view';
import { toolEffectResultLine } from './tool_effect_result_view';

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel) as T;

/** The private Hud members the router drives. */
export interface ProfessionEventHost extends GatherResultFeedbackHost {
  log(text: string, color?: string, decorativeIconUrl?: string): void;
  showError(text: string): void;
  showCelebrationBanner(
    text: string,
    bannerClass: 'levelup' | 'deed',
    variant?: BannerVariant,
    motion?: boolean,
  ): void;
  readonly combatAnnouncer: { push(line: string, now: number): void };
  openProfessionTutorial(): void;
  refreshOpenProfessionSurfacesIfChanged(): void;
  readonly questDialog: { refreshIfChanged(): void };
  /** Cleared by every craftResult: the in-flight craft cast resolved. */
  craftCastExpectingResult: boolean;
  readonly craftingWindowEl: HTMLElement | null;
  announceCraftCast(text: string): void;
  readonly celebrationDrain: { armCraftTierUps(): void };
  renderCrafting(): void;
  readonly openUnbindNpcId: number | null;
  renderUnbind(): void;
  renderBags(): void;
  readonly professionsWindow: { readonly isOpen: boolean; render(): void };
}

/** Present one sim event through its profession arm. True when it was one of
 *  the events above, so the HUD's per-event switch skips it. */
export function applyProfessionEventPresentation(h: ProfessionEventHost, ev: SimEvent): boolean {
  switch (ev.type) {
    case 'craftResult': {
      // A result (grant or denial) means the in-flight cast RESOLVED:
      // a session that later drops without one was cancelled. The paint
      // band re-arms the flag while a session stays active (mid-batch).
      h.craftCastExpectingResult = false;
      if (ev.ok && ev.itemId && h.craftingWindowEl?.style.display === 'flex') {
        const craftedItem = ITEMS[ev.itemId];
        // No display name resolves: say nothing (a raw internal id read
        // aloud is worse than silence).
        if (craftedItem) {
          h.announceCraftCast(
            t('hudChrome.crafting.announceComplete', {
              name: itemDisplayName(craftedItem),
            }),
          );
        }
      }
      // Arm the drain tail's tier-up state check (armCraftTierUps says why
      // a bounded window rather than a per-frame poll).
      h.celebrationDrain.armCraftTierUps();
      if (ev.ok && ev.itemId) {
        // The ONLY line for the craft grant: the hub's 'loot' events are
        // emitted both silent and callerLogs for every craft-output grant
        // (see crafting.ts), so this line has to carry what they used to,
        // the output count of a resultCount > 1 recipe included (#2430).
        // The line keeps its loot-family green; the output's quality now
        // rides the item link's own color, which is where a player reads
        // it everywhere else in chat.
        h.log(
          t(craftedLineKey(ev.count), {
            name: grantItemToken(ev.itemId),
            qty: grantQtyText(ev.count),
          }),
          PROF_LOG_GRANT,
        );
        const recipe = ALL_RECIPES.find((r) => r.id === ev.recipeId);
        audio.craftSuccess(recipe?.professionId ?? '');
        // Masterwork layers alongside the family cue above, never replaces
        // it: craftResult.masterwork mirrors the standalone 'masterwork'
        // event (see src/sim/types.ts), so this one check covers both.
        if (ev.masterwork) audio.masterwork();
      } else if (!ev.ok) {
        // Key selection lives in crafting_deny_core, which resolves the
        // recipe and delegates to craft_denial_line_view's exhaustive
        // Record (its header carries why the two modules exist); this
        // stays the thin render, and the core's key is LIVE for the
        // station arm too (a hardcoded key here left that row dead data).
        const denial = craftDenyMessage(ev.reason, ev.recipeId, ev.retryAfterSeconds);
        h.log(
          t(
            denial.key,
            denial.stationType ? { station: stationNameText(denial.stationType) } : denial.params,
          ),
          PROF_LOG_DENY,
        );
      }
      if ($('#crafting-window').style.display === 'flex') h.renderCrafting();
      break;
    }
    case 'unbindResult': {
      // Maker's Bond unbind outcome (Professions 2.0). The
      // event is text-free: the item name derives from itemId plus static
      // content and the fee formats locally, identical in both worlds.
      // ONE chat line either way (the trainResult single-surface rule:
      // no toast, no extra sound cue).
      const unboundItem = ITEMS[ev.itemId];
      const unboundName = unboundItem ? itemDisplayName(unboundItem) : ev.itemId;
      if (ev.ok) {
        h.log(
          t('hudChrome.unbind.unbound', {
            name: unboundName,
            fee: formatLocalizedMoney(ev.fee),
          }),
          PROF_LOG_GRANT,
        );
      } else if (ev.reason) {
        // A reason-less deny is the malformed-item-id probe arm
        // (resolveUnbind's silent arm): nothing legible to render. The
        // reason-to-key pairing is the total UNBIND_DENY_KEY record in
        // hud/vendor/unbind_view.ts, never a chain here.
        h.log(t(unbindDenyKey(ev.reason)), PROF_LOG_DENY);
      }
      // Refresh the service rows and the bags (the single-copy unbind
      // clears boundTo in place, so no loot event repaints them for us).
      if (h.openUnbindNpcId !== null && $('#unbind-window').style.display === 'block')
        h.renderUnbind();
      if ($('#bags').style.display !== 'none') h.renderBags();
      break;
    }
    case 'masterworkZone': {
      // Soft zone broadcast (the gatherRareEvent pattern): every recipient
      // in zone INCLUDING the crafter logs the line; NO audio cue for
      // anyone (the crafter's cue rides the personal 'masterwork' plan).
      const l = masterworkZoneLine(ev.crafterName, ev.itemId);
      h.log(l.text, l.color, l.icon);
      break;
    }
    case 'toolEffectResult': {
      // Slot/recharge outcome for the acquisition craft. The event is
      // text-free: the effect and profession names derive from their ids
      // (TOOL_EFFECT_NAME_KEYS / GATHERING_PROFESSION_NAME_KEYS) and the
      // recharge material splices as a clickable item link, identical in
      // both worlds. ONE chat line either way (the trainResult
      // single-surface rule: no toast, no extra sound cue). Unknown ids
      // render raw rather than crash, the stale-content doctrine: a
      // yet-unknown effect id still names itself legibly.
      // The shared hasOwn-safe getters enforce the prototype-key rule:
      // the deny arms echo the SENDER's own command strings back as
      // these ids, so a bare index on a frame naming 'constructor' would
      // resolve a prototype member and hand a non-key to t().
      const effectKey = ev.effectId !== undefined ? toolEffectNameKey(ev.effectId) : undefined;
      const effectName = effectKey ? t(effectKey) : (ev.effectId ?? '');
      const professionKey = gatheringProfessionNameKey(ev.professionId);
      const professionName = professionKey ? t(professionKey) : ev.professionId;
      const materialToken = ev.materialItemId ? grantItemToken(ev.materialItemId) : '';
      const countText = formatNumber(ev.count ?? 0, { maximumFractionDigits: 0 });
      // Which line, its values, and its tone: tool_effect_result_view's
      // exhaustive table (the craft_denial_line_view shape).
      const line = toolEffectResultLine(ev, {
        effect: effectName,
        profession: professionName,
        material: materialToken,
        count: countText,
      });
      h.log(t(line.key, line.params), line.tone);
      // The slot rows live in the professions window; repaint an open one
      // so charges/effects flip without a manual reopen (the trainResult
      // arm's idiom in hud.ts).
      if (h.professionsWindow.isOpen) h.professionsWindow.render();
      break;
    }
    case 'profTrendNudge':
    case 'profTierTutorial':
    case 'attuned':
    case 'attunedZone':
      // The four Professions 2.0 text-free events, rendered
      // through the profession_event_lines plan (chat line / banner /
      // tutorial panel). Thin: the plan owns every decision, this arm only
      // executes it.
      handleProfessionEvent(h, ev);
      break;
    case 'gatherResult':
      // Node-harvest feedback: line, cue, and rare-tier stinger (extracted
      // to gathering_result_feedback.ts; Hud is the host seam).
      handleGatherResult(ev, h);
      break;
    case 'harvestResult':
      // Corpse-harvest feedback: one line per distinct yield, one cue for
      // the whole command (extracted beside gatherResult above).
      handleHarvestResult(ev, h);
      break;
    case 'disenchantResult': {
      // Enchanting disenchant outcome (Professions 2.0): text-free,
      // so enchanting_view.ts maps the event to its key + sink and the
      // names interpolate. The success line is the ONLY line for the whole
      // action now that the hub's 'loot' events stand down for it
      // (callerLogs, see enchanting.ts resolveDisenchant), so it names both
      // the piece that was consumed and the material that came back; a
      // rare+ yield's typed secondary is a different item, so it takes one
      // extra line rather than being folded into this one (#2430).
      // Item-link tokens only expand on the chat log, never in showError,
      // so the deny arm stays name-free.
      const toast = disenchantResultToast(ev);
      if (toast.sink === 'log') {
        h.log(
          t(toast.key, {
            item: grantItemToken(ev.itemId),
            material: ev.materialItemId ? grantItemToken(ev.materialItemId) : '',
            qty: grantQtyText(ev.count),
          }),
          PROF_LOG_GRANT,
        );
        const secondary = disenchantSecondaryLineKey(ev);
        if (secondary && ev.secondaryItemId)
          h.log(
            t(secondary, {
              material: grantItemToken(ev.secondaryItemId),
              qty: grantQtyText(ev.secondaryCount),
            }),
            PROF_LOG_GRANT,
          );
        audio.disenchant();
      } else h.showError(t(toast.key));
      break;
    }
    case 'salvageResult': {
      // Enchanting salvage outcome (Professions 2.0): same shape as
      // disenchantResult above, minus the secondary (salvage yields one
      // material). Its success line names the consumed piece and the
      // reclaimed material for the same reason.
      const toast = salvageResultToast(ev);
      if (toast.sink === 'log') {
        h.log(
          t(toast.key, {
            item: grantItemToken(ev.itemId),
            material: ev.materialItemId ? grantItemToken(ev.materialItemId) : '',
            qty: grantQtyText(ev.count),
          }),
          PROF_LOG_GRANT,
        );
        audio.salvage();
      } else h.showError(t(toast.key));
      break;
    }
    case 'enchantResult': {
      // Apply-enchant outcome (Professions 2.0): the success line
      // names the item AND the enchant (enchantName.<id>, its first render
      // sink); every deny is an error toast. The ONLY line for the action:
      // the bagged arms re-mint the player's own copy through the grant
      // hub, whose "You receive:" line claimed they had received an item
      // that never left their bags, and now stands down (#2430). The WORN
      // arm never reaches the hub at all, so both arms print exactly this.
      const toast = applyEnchantResultToast(ev);
      if (toast.sink === 'log') {
        h.log(
          t(toast.key, {
            item: grantItemToken(ev.itemId),
            enchant: t(`hudChrome.enchantName.${ev.enchantId}` as TranslationKey),
          }),
          PROF_LOG_GRANT,
        );
        audio.enchant();
      } else {
        h.showError(t(toast.key));
      }
      break;
    }
    case 'fishingResult': {
      // Reel-in feedback line (Professions 2.0), colored by the
      // caught item's quality. Identical on every graphics tier (player
      // feedback is never profile-gated). This is the ONLY line for the
      // catch grant, and the reel cue (the splash-and-crank of the landed
      // reel) its only cue: the grant hub's 'loot' event is emitted both
      // silent and callerLogs for a landed catch (see fishing.ts
      // completeFishing), which is what stopped a catch printing three
      // lines and playing two cues (#2430).
      h.log(
        t('hudChrome.gathering.catchLine', {
          name: grantItemToken(ev.itemId),
        }),
        QUALITY_COLOR[ev.quality],
      );
      audio.fishReel();
      break;
    }
    default:
      return false;
  }
  return true;
}

// The four Professions 2.0 text-free events, rendered through the
// pure plan (profession_event_lines.ts). Thin consumer: the plan decides which
// chat line / banner / panel; this only resolves the localized archetype title
// and master/celebrant names and paints. The banner arm reuses the
// craft-celebration render family (showBanner + polite announcer + one
// achievement cue, motion trimmed under reduced motion).
function handleProfessionEvent(h: ProfessionEventHost, ev: ProfessionEventInput): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plan = planProfessionEvent(ev, reducedMotion);
  switch (plan.kind) {
    case 'trendNudge': {
      const archetype = archetypeTitleText(plan.pairId);
      h.log(
        plan.masterNpcId !== null
          ? t('hudChrome.crafting.trendNudge', {
              archetype,
              master: tEntity({
                kind: 'npc',
                id: plan.masterNpcId,
                field: 'name',
              }),
            })
          : t('hudChrome.crafting.trendNudgeNoMaster', { archetype }),
        HUD_LOG.HINT,
      );
      break;
    }
    case 'tierTutorial':
      h.openProfessionTutorial();
      break;
    case 'attunedZone':
      h.log(
        t('hudChrome.crafting.attunedZoneLine', {
          name: plan.celebrantName,
          archetype: archetypeTitleText(plan.pairId),
        }),
        QUALITY_COLOR.epic,
      );
      break;
    case 'attunement': {
      const text = t('hudChrome.crafting.attunedBanner', {
        title: archetypeTitleText(plan.pairId),
      });
      // Deed hook: a per-archetype deed unlock will fire from this
      // same attunement moment; today it is a pure celebration banner,
      // and it RIDES the celebration class (the phase 14 QA): classed
      // ambient it could vanish in the latest-wins pending seat behind a
      // live level-up. The attunedZone epic log line stays the durable
      // record either way.
      h.showCelebrationBanner(text, 'deed', 'default', plan.motion);
      h.combatAnnouncer.push(text, performance.now());
      if (plan.playSound) audio.achievement();
      // Offline identity is already mutated when this personal event drains,
      // so refresh immediately. If online cprof lands later, the slow-band
      // signature (profession_surface_refresh.ts) catches that second edge
      // and converges then.
      h.refreshOpenProfessionSurfacesIfChanged();
      h.questDialog.refreshIfChanged();
      break;
    }
  }
}
