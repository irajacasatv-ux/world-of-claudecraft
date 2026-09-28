// @vitest-environment happy-dom

// The HUD's profession result arms (src/ui/hud/professions/profession_event_router.ts),
// extracted whole from the Hud's per-event switch. Each arm's rendered lines
// are driven in its own suite (tests/professions_single_line_grants.test.ts,
// tool_effect_result_lines, hud_profession_events, masterwork_zone_broadcast);
// this suite holds what the router itself owns: exactly which events it
// claims (every other one stays in the Hud switch, with one home per type),
// the craft-cast state the craftResult arm settles on the host, the window
// repaint gates, and the weld to the private Hud members it reads.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { ITEMS } from '../src/sim/data';
import type { SimEvent } from '../src/sim/types';
import { itemDisplayName } from '../src/ui/entity_i18n';
import { applyProfessionEventPresentation } from '../src/ui/hud/professions/profession_event_router';
import { t } from '../src/ui/i18n';
import { type EventRouterRig, eventRouterRig } from './helpers/event_router_rig';
import { hudDeclares, interfaceMembers } from './helpers/hud_host_weld';
import { stripComments } from './helpers/strip_comments';

const PLAYER_ID = 7;
const SWORD = 'eastbrook_arming_sword';

// One minimal event per claimed type.
const CLAIMED: SimEvent[] = [
  { type: 'craftResult', ok: true, recipeId: 'recipe_x', itemId: SWORD, count: 1 },
  { type: 'unbindResult', ok: true, itemId: SWORD, fee: 100 },
  {
    type: 'masterworkZone',
    crafterPid: 3,
    crafterName: 'Crafter',
    itemId: SWORD,
    recipeId: 'recipe_x',
    zoneId: 'eastbrook_vale',
  },
  { type: 'toolEffectResult', action: 'slot', ok: true, professionId: 'mining' },
  { type: 'profTrendNudge', pairId: 'alchemy+cooking' },
  { type: 'profTierTutorial' },
  { type: 'attuned', pairId: 'alchemy+cooking' },
  { type: 'attunedZone', celebrantName: 'Torvald', pairId: 'alchemy+cooking' },
  {
    type: 'gatherResult',
    nodeId: 'n1',
    nodeType: 'ore',
    professionId: 'mining',
    itemId: 'copper_ore',
    rarity: 'common',
    qty: 1,
    rareEvent: null,
  },
  { type: 'harvestResult', yields: [] },
  { type: 'disenchantResult', ok: true, itemId: SWORD },
  { type: 'salvageResult', ok: true, itemId: SWORD },
  { type: 'enchantResult', ok: false, itemId: SWORD, reason: 'wrong_slot' },
  {
    type: 'fishingResult',
    itemId: 'copper_ore',
    quality: 'common',
    zoneId: 'eastbrook_vale',
    band: 0,
  },
].map((ev) => ({ ...ev, pid: PLAYER_ID }) as unknown as SimEvent);

// The profession-family neighbors that stay in the Hud switch.
const LEFT_IN_HUD = [
  'loot',
  'trainResult',
  'perfectingSwapResult',
  'masterwork',
  'legendaryForged',
  'legendaryForgedZone',
  'commissionOrderResult',
  'harvestPreferenceOpen',
  'gatherDenied',
  'gatherToolNoNode',
  'gatherDowngrade',
  'fishingBite',
  'fishingGotAway',
  'fishingEarlyReel',
  'fishingEmptyHook',
  'gatherRareEvent',
  'farmPlanted',
];

function rig(): EventRouterRig {
  return eventRouterRig({
    sim: { playerId: PLAYER_ID },
    // The attuned arm's surface probe has its own suites
    // (tests/profession_surface_refresh.test.ts); here it only has to route.
    refreshOpenProfessionSurfacesIfChanged: vi.fn(),
  });
}

beforeEach(() => {
  document.body.innerHTML =
    '<div id="bags" style="display:none"></div>' +
    '<div id="crafting-window" style="display:none"></div>' +
    '<div id="unbind-window" style="display:none"></div>';
  window.matchMedia = ((query: string) =>
    ({ matches: false, media: query }) as MediaQueryList) as typeof window.matchMedia;
  for (const cue of [
    'craftSuccess',
    'masterwork',
    'achievement',
    'gather',
    'gatherRareTier',
    'lootItem',
    'disenchant',
    'salvage',
    'enchant',
    'fishReel',
  ] as const) {
    vi.spyOn(audio, cue).mockImplementation(() => {});
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('applyProfessionEventPresentation: which events it claims', () => {
  it('claims every one of its arms, and each does something a player sees', () => {
    for (const ev of CLAIMED) {
      const host = rig();
      expect(applyProfessionEventPresentation(host, ev), ev.type).toBe(true);
      const acted =
        host.log.mock.calls.length +
        host.showError.mock.calls.length +
        host.openProfessionTutorial.mock.calls.length +
        host.combatAnnouncer.push.mock.calls.length +
        host.renderBags.mock.calls.length;
      // The empty corpse harvest is the one claimed event with nothing to say.
      if (ev.type !== 'harvestResult') expect(acted, ev.type).toBeGreaterThan(0);
    }
  });

  it('leaves every neighboring event to the Hud switch, untouched', () => {
    const host = rig();
    for (const type of LEFT_IN_HUD) {
      expect(
        applyProfessionEventPresentation(host, { type, pid: PLAYER_ID } as unknown as SimEvent),
        type,
      ).toBe(false);
    }
    expect(host.log).not.toHaveBeenCalled();
    expect(host.showError).not.toHaveBeenCalled();
    expect(host.renderBags).not.toHaveBeenCalled();
  });
});

describe('the craftResult arm settles the craft cast on the host', () => {
  const craft = (ok: boolean): SimEvent =>
    ({
      type: 'craftResult',
      pid: PLAYER_ID,
      ok,
      recipeId: 'recipe_x',
      itemId: SWORD,
      count: 1,
      ...(ok ? {} : { reason: 'insufficient_materials' }),
    }) as unknown as SimEvent;

  it('clears the in-flight flag and arms the tier-up window on a grant AND a denial', () => {
    for (const ok of [true, false]) {
      const host = rig();
      host.craftCastExpectingResult = true;
      applyProfessionEventPresentation(host, craft(ok));
      expect(host.craftCastExpectingResult, String(ok)).toBe(false);
      expect(host.celebrationDrain.armCraftTierUps, String(ok)).toHaveBeenCalledTimes(1);
    }
  });

  it('announces the completed craft only while the crafting window is open', () => {
    const host = rig();
    applyProfessionEventPresentation(host, craft(true));
    expect(host.announceCraftCast).not.toHaveBeenCalled();
    const windowEl = document.getElementById('crafting-window') as HTMLElement;
    windowEl.style.display = 'flex';
    host.craftingWindowEl = windowEl;
    applyProfessionEventPresentation(host, craft(true));
    expect(host.announceCraftCast).toHaveBeenCalledTimes(1);
    expect(host.announceCraftCast.mock.calls[0][0]).toBe(
      t('hudChrome.crafting.announceComplete', { name: itemDisplayName(ITEMS[SWORD]) }),
    );
    // The open window repaints on the same result, a closed one never did.
    expect(host.renderCrafting).toHaveBeenCalledTimes(1);
  });
});

describe('the unbindResult arm repaints only what is open', () => {
  it('the service rows only while the unbind window is up for an npc, the bags only while open', () => {
    const unbind = {
      type: 'unbindResult',
      pid: PLAYER_ID,
      ok: true,
      itemId: SWORD,
      fee: 100,
    } as SimEvent;
    const host = rig();
    applyProfessionEventPresentation(host, unbind);
    expect(host.renderUnbind).not.toHaveBeenCalled();
    expect(host.renderBags).not.toHaveBeenCalled();
    (document.getElementById('unbind-window') as HTMLElement).style.display = 'block';
    applyProfessionEventPresentation(host, unbind);
    expect(host.renderUnbind).not.toHaveBeenCalled();
    host.openUnbindNpcId = 12;
    (document.getElementById('bags') as HTMLElement).style.display = 'block';
    applyProfessionEventPresentation(host, unbind);
    expect(host.renderUnbind).toHaveBeenCalledTimes(1);
    expect(host.renderBags).toHaveBeenCalledTimes(1);
  });
});

describe('the weld to the private Hud members the router reads', () => {
  // join(process.cwd()) rather than import.meta.url: under happy-dom the module
  // URL is not a file: scheme.
  const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
  const router = read('src/ui/hud/professions/profession_event_router.ts');
  const gather = read('src/ui/hud/professions/gathering_result_feedback.ts');
  const hud = read('src/ui/hud.ts');

  it('every ProfessionEventHost member, the inherited feedback host included, is declared on the Hud', () => {
    const members = [
      ...interfaceMembers(gather, 'GatherResultFeedbackHost'),
      ...interfaceMembers(router, 'ProfessionEventHost'),
    ];
    expect(new Set(members)).toEqual(
      new Set([
        'log',
        'showSelfNote',
        'showError',
        'showCelebrationBanner',
        'combatAnnouncer',
        'openProfessionTutorial',
        'refreshOpenProfessionSurfacesIfChanged',
        'questDialog',
        'craftCastExpectingResult',
        'craftingWindowEl',
        'announceCraftCast',
        'celebrationDrain',
        'renderCrafting',
        'openUnbindNpcId',
        'renderUnbind',
        'renderBags',
        'professionsWindow',
      ]),
    );
    for (const member of members) expect(hudDeclares(hud, member), member).toBe(true);
  });

  it('every event type has exactly one home: the router or the Hud switch, never both', () => {
    const hudCode = stripComments(hud);
    // The event switch only: handleProfessionEvent's own plan switch below it
    // spells one plan kind ('attunedZone') the same way.
    const routerCode = stripComments(router).slice(
      0,
      stripComments(router).indexOf('function handleProfessionEvent('),
    );
    expect(routerCode).toContain('export function applyProfessionEventPresentation(');
    for (const ev of CLAIMED) {
      expect(routerCode.split(`case '${ev.type}':`).length - 1, ev.type).toBe(1);
      expect(hudCode, ev.type).not.toContain(`case '${ev.type}':`);
    }
    for (const type of LEFT_IN_HUD.filter((type) => type !== 'loot')) {
      expect(routerCode, type).not.toContain(`case '${type}':`);
      expect(hudCode, type).toContain(`case '${type}':`);
    }
  });
});
