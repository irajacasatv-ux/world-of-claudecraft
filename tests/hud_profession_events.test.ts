// @vitest-environment happy-dom

// The HUD render sink for the four Professions 2.0 text-free
// SimEvents (profTrendNudge, profTierTutorial, attuned, attunedZone). The sim
// emits ids and names only; the profession event router's handleProfessionEvent
// (hud/professions/profession_event_router.ts) must resolve the LOCALIZED
// archetype title and master name (never leak the raw pairId, whose '+'
// separator is the wire spelling, not player copy) and execute exactly the
// plan's one render action per arm: a chat line, the tutorial panel, or the
// celebration banner family (banner + polite announcer + one achievement
// cue). Driven through applyProfessionEventPresentation (the router's public
// entry, which routes all four to that handler) over the router host rig
// (tests/helpers/event_router_rig.ts), no Hud coordinator import.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { audio } from '../src/game/audio';
import { ARCHETYPE_PAIR_TARGETS } from '../src/sim/professions/archetype';
import type { SimEvent } from '../src/sim/types';
import { tEntity } from '../src/ui/entity_i18n';
import { archetypeTitleText } from '../src/ui/hud/professions/craft_name_view';
import {
  attunementMasterForPair,
  type ProfessionEventInput,
} from '../src/ui/hud/professions/profession_event_lines_core';
import { applyProfessionEventPresentation } from '../src/ui/hud/professions/profession_event_router';
import { t } from '../src/ui/i18n';
import type { CraftingIdentityView } from '../src/world_api/professions';
import { type EventRouterRig, eventRouterRig } from './helpers/event_router_rig';

// jsdom ships no matchMedia; the handler reads only `.matches` to derive the
// reduced-motion flag. A never-matching stub keeps motion on (the desktop
// default the attuned banner assertion below relies on).
window.matchMedia = ((query: string) =>
  ({ matches: false, media: query }) as MediaQueryList) as typeof window.matchMedia;

interface ProfessionEventHarness extends EventRouterRig {
  sim: {
    craftingIdentity: CraftingIdentityView;
    professionsState: { skills: readonly { professionId: string; skill: number }[] };
  };
  /** The four events through the router's public entry. */
  handleProfessionEvent(ev: ProfessionEventInput): void;
}

function makeHud(): ProfessionEventHarness {
  const hud = eventRouterRig({
    sim: {
      craftingIdentity: {
        version: 1,
        synced: true,
        craftSkills: {},
        activeArchetype: 'leatherworking',
        pairedMajor: 'tailoring',
        hobbyCraft: null,
        attunedPairs: ['leatherworking+tailoring'],
        switchCount: 0,
        amendsProgress: 0,
        amendsRequired: 5,
        knownRecipes: [],
      },
      professionsState: { skills: [] },
    },
    // The log sink stays a bare spy (the old bare-prototype rig's stub): these
    // cases read its arguments, never a rendered pane.
    log: vi.fn(),
  }) as ProfessionEventHarness;
  hud.handleProfessionEvent = (ev) => {
    expect(applyProfessionEventPresentation(hud, ev as SimEvent)).toBe(true);
  };
  // The attuned arm also probes the gossip dialog's intro-hint staleness
  // (attunement retires the hint); the dialog's own behavior is pinned in
  // quest_dialog_controller.test.ts, this harness only has to ROUTE there
  // (the rig's questDialog.refreshIfChanged spy).
  document.getElementById('crafting-window')?.remove();
  const craftingWindow = document.createElement('div');
  craftingWindow.id = 'crafting-window';
  craftingWindow.style.display = 'none';
  document.body.appendChild(craftingWindow);
  // The tierTutorial arm only has to ROUTE to the rig's openProfessionTutorial
  // spy; the panel itself is pinned in profession_tutorial_window.test.ts.
  return hud;
}

// A wave-one pair with a seated anchor master (content/zone1.ts
// q_prof_attune_smith), so the trendNudge master arm has a real name to
// resolve.
const MASTER_PAIR = 'weaponcrafting+armorcrafting';
const MASTER_NPC_ID = 'forgemistress_darva';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the profession event router: handleProfessionEvent', () => {
  it('profTrendNudge logs the localized master line: archetype title + master name, no raw pairId', () => {
    const hud = makeHud();
    hud.handleProfessionEvent({ type: 'profTrendNudge', pairId: MASTER_PAIR });

    expect(hud.log).toHaveBeenCalledTimes(1);
    const line = hud.log.mock.calls[0][0] as string;
    const archetype = archetypeTitleText(MASTER_PAIR);
    const master = tEntity({ kind: 'npc', id: MASTER_NPC_ID, field: 'name' });
    // Guard: the entity catalog resolves a real display name, so the contains
    // assertions below cannot be satisfied by an id-echo fallback.
    expect(master).not.toBe(MASTER_NPC_ID);
    expect(line).toBe(t('hudChrome.crafting.trendNudge', { archetype, master }));
    expect(line).toContain(archetype);
    expect(line).toContain(master);
    // The raw pair id is wire spelling: its '+' separator never reaches chat.
    expect(line).not.toContain(MASTER_PAIR);
    expect(line).not.toContain('+');
    expect(hud.showBanner).not.toHaveBeenCalled();
    expect(hud.openProfessionTutorial).not.toHaveBeenCalled();
  });

  it('profTrendNudge falls to the noMaster line for a ring pair without a seated master', () => {
    // Derived, not hand-picked: any ring pair outside the four wave-one
    // archetypes has no attunement quest, hence no master to name. If a later
    // phase seats all ten masters this find() comes up empty and the arm
    // becomes dead code, which this guard would surface.
    const pair = ARCHETYPE_PAIR_TARGETS.find((p) => attunementMasterForPair(p) === null);
    expect(pair).toBeTruthy();

    const hud = makeHud();
    hud.handleProfessionEvent({ type: 'profTrendNudge', pairId: pair as string });

    expect(hud.log).toHaveBeenCalledTimes(1);
    const line = hud.log.mock.calls[0][0] as string;
    expect(line).toBe(
      t('hudChrome.crafting.trendNudgeNoMaster', { archetype: archetypeTitleText(pair as string) }),
    );
    expect(line).not.toContain('+');
  });

  it('attunedZone logs the celebrant name with the localized archetype title, never the raw pairId', () => {
    const hud = makeHud();
    hud.handleProfessionEvent({
      type: 'attunedZone',
      celebrantName: 'Torvald',
      pairId: 'alchemy+cooking',
    });

    expect(hud.log).toHaveBeenCalledTimes(1);
    const line = hud.log.mock.calls[0][0] as string;
    expect(line).toContain('Torvald');
    expect(line).toContain(archetypeTitleText('alchemy+cooking'));
    expect(line).not.toContain('alchemy+cooking');
    expect(line).not.toContain('+');
    // A zone broadcast is a chat line only: no banner, no cue for recipients
    // (the masterworkZone precedent).
    expect(hud.showBanner).not.toHaveBeenCalled();
  });

  it('attuned fires the celebration family: banner + polite announcer + one achievement cue, localized', () => {
    const achievement = vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const hud = makeHud();
    hud.handleProfessionEvent({ type: 'attuned', pairId: 'leatherworking+tailoring' });

    expect(hud.showBanner).toHaveBeenCalledTimes(1);
    const [text, motion] = hud.showBanner.mock.calls[0] as [string, boolean];
    expect(text).toBe(
      t('hudChrome.crafting.attunedBanner', {
        title: archetypeTitleText('leatherworking+tailoring'),
      }),
    );
    expect(text).not.toContain('+');
    // jsdom's matchMedia never matches prefers-reduced-motion, so the plan
    // keeps motion on; information (text, announcer, cue) is never gated.
    expect(motion).toBe(true);
    expect(hud.combatAnnouncer.push).toHaveBeenCalledTimes(1);
    expect(hud.combatAnnouncer.push.mock.calls[0][0]).toBe(text);
    expect(achievement).toHaveBeenCalledTimes(1);
    expect(hud.log).not.toHaveBeenCalled();
    expect(hud.charWindow.renderIfOpen).toHaveBeenCalledTimes(1);
    expect(hud.renderCrafting).not.toHaveBeenCalled();
    // The gossip intro hint retires on attunement, so the arm probes the
    // dialog's staleness signature alongside the profession surfaces.
    expect(hud.questDialog.refreshIfChanged).toHaveBeenCalledTimes(1);
  });

  it('attuned repaints an OPEN Crafting window through the probe, then elides the repeat', () => {
    vi.spyOn(audio, 'achievement').mockImplementation(() => {});
    const hud = makeHud();
    const craftingWindow = document.getElementById('crafting-window') as HTMLElement;
    // 'flex' is the painter's open state (the column-flex shell); the repaint
    // gate tests display === 'flex', so staging anything else reads closed.
    craftingWindow.style.display = 'flex';

    hud.handleProfessionEvent({ type: 'attuned', pairId: 'leatherworking+tailoring' });
    expect(hud.charWindow.renderIfOpen).toHaveBeenCalledTimes(1);
    expect(hud.renderCrafting).toHaveBeenCalledTimes(1);

    // The identity mirror has not moved since the first probe, so a second
    // drain elides both repaints (the signature diff, not the event, decides).
    hud.handleProfessionEvent({ type: 'attuned', pairId: 'leatherworking+tailoring' });
    expect(hud.charWindow.renderIfOpen).toHaveBeenCalledTimes(1);
    expect(hud.renderCrafting).toHaveBeenCalledTimes(1);

    // A moved mirror claims the edge again for both open surfaces.
    hud.sim.craftingIdentity = { ...hud.sim.craftingIdentity, switchCount: 1 };
    hud.handleProfessionEvent({ type: 'attuned', pairId: 'leatherworking+tailoring' });
    expect(hud.charWindow.renderIfOpen).toHaveBeenCalledTimes(2);
    expect(hud.renderCrafting).toHaveBeenCalledTimes(2);

    // The OTHER facet moves the same edge: a late gathering snapshot alone
    // (crafting identity untouched) must also converge both surfaces.
    hud.sim.professionsState = { skills: [{ professionId: 'fishing', skill: 40 }] };
    hud.handleProfessionEvent({ type: 'attuned', pairId: 'leatherworking+tailoring' });
    expect(hud.charWindow.renderIfOpen).toHaveBeenCalledTimes(3);
    expect(hud.renderCrafting).toHaveBeenCalledTimes(3);
  });

  it('profTierTutorial routes to openProfessionTutorial and does nothing else', () => {
    const hud = makeHud();
    hud.handleProfessionEvent({ type: 'profTierTutorial' });

    expect(hud.openProfessionTutorial).toHaveBeenCalledTimes(1);
    expect(hud.log).not.toHaveBeenCalled();
    expect(hud.showBanner).not.toHaveBeenCalled();
  });
});

// The four event types must fall through to the ONE handler above in the
// router's switch, so a new arm cannot silently drop one of them. The cases
// above drive that switch for real; this source pin (the
// craft_celebration_view.test.ts precedent) holds the fall-through shape.
describe('profession event router switch routing (source pin)', () => {
  // join(process.cwd()) rather than import.meta.url: under jsdom the module
  // URL is not a file: scheme (the confirm_dialog_key_activation precedent).
  const routerSource = readFileSync(
    join(process.cwd(), 'src/ui/hud/professions/profession_event_router.ts'),
    'utf8',
  );

  it('all four SimEvent types route to handleProfessionEvent', () => {
    expect(routerSource).toMatch(
      /case 'profTrendNudge':\n\s*case 'profTierTutorial':\n\s*case 'attuned':\n\s*case 'attunedZone':(?:\n\s*\/\/[^\n]*)*\n\s*handleProfessionEvent\(h, ev\);/,
    );
  });
});
