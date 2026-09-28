import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GATHERING_PROFESSION_IDS, GATHERING_PROFESSIONS } from '../src/sim/content/professions';
import type { GatheringProficiencyRow } from '../src/ui/hud/professions/gathering_view';
import { professionSurfaceRefreshSig } from '../src/ui/hud/professions/profession_identity_view';
import { ProfessionSurfaceRefresh } from '../src/ui/hud/professions/profession_surface_refresh';
import type { IWorld } from '../src/world_api';
import type { CraftingIdentityView } from '../src/world_api/professions';

function identity(overrides: Partial<CraftingIdentityView> = {}): CraftingIdentityView {
  return {
    version: 1,
    synced: true,
    craftSkills: { weaponcrafting: 75, armorcrafting: 50 },
    activeArchetype: 'weaponcrafting',
    pairedMajor: 'armorcrafting',
    hobbyCraft: 'jewelcrafting',
    attunedPairs: ['weaponcrafting+armorcrafting', 'engineering+alchemy'],
    switchCount: 0,
    amendsProgress: 0,
    amendsRequired: 5,
    knownRecipes: ['copper_sword', 'iron_helm'],
    ...overrides,
  };
}

// The rows arrive in the fixed GATHERING_PROFESSION_IDS order from
// buildGatheringProficiencyRows; deriving the fixture from the SAME sim list
// keeps the per-row coverage below growing with any future fifth profession.
function gathering(values: Partial<Record<string, number>> = {}): GatheringProficiencyRow[] {
  return GATHERING_PROFESSION_IDS.map((professionId) => ({
    professionId,
    value: values[professionId] ?? 0,
    displayValue: Math.floor(values[professionId] ?? 0),
    maxSkill: GATHERING_PROFESSIONS[professionId].maxSkill,
  }));
}

describe('professionSurfaceRefreshSig', () => {
  it('is stable for equivalent set and record ordering', () => {
    const a = identity();
    const b = identity({
      craftSkills: { armorcrafting: 50, weaponcrafting: 75 },
      attunedPairs: ['engineering+alchemy', 'weaponcrafting+armorcrafting'],
      knownRecipes: ['iron_helm', 'copper_sword'],
    });
    expect(professionSurfaceRefreshSig(b, gathering())).toBe(
      professionSurfaceRefreshSig(a, gathering()),
    );
  });

  it('moves for every identity dimension painted by Character or Crafting', () => {
    const base = identity();
    const baseSig = professionSurfaceRefreshSig(base, gathering());
    const changed = [
      identity({ synced: false }),
      identity({ activeArchetype: 'engineering' }),
      identity({ pairedMajor: 'alchemy' }),
      identity({ hobbyCraft: 'cooking' }),
      identity({ attunedPairs: ['weaponcrafting+armorcrafting'] }),
      identity({ switchCount: 1 }),
      identity({ amendsProgress: 1 }),
      identity({ amendsRequired: 8 }),
      identity({ craftSkills: { weaponcrafting: 76, armorcrafting: 50 } }),
      identity({ knownRecipes: ['copper_sword', 'iron_helm', 'silver_ring'] }),
    ];
    expect(changed.map((next) => professionSurfaceRefreshSig(next, gathering()))).not.toContain(
      baseSig,
    );
  });

  it('moves for every gathering proficiency row on the same Character surface', () => {
    const base = professionSurfaceRefreshSig(identity(), gathering());
    for (const professionId of GATHERING_PROFESSION_IDS) {
      expect(
        professionSurfaceRefreshSig(identity(), gathering({ [professionId]: 25 })),
        `${professionId} proficiency must claim a repaint edge`,
      ).not.toBe(base);
    }
  });

  it('detects the delayed online snapshot rather than the preceding stale event state', () => {
    const stale = identity();
    let last = professionSurfaceRefreshSig(stale, gathering());
    const changed = (next: CraftingIdentityView, rows = gathering()): boolean => {
      const sig = professionSurfaceRefreshSig(next, rows);
      if (sig === last) return false;
      last = sig;
      return true;
    };

    // An attuned event can drain before cprof. The stale mirror does not claim
    // a repaint edge; the later snapshot does, and subsequent polls elide.
    expect(changed(stale)).toBe(false);
    const returned = identity({
      activeArchetype: 'engineering',
      pairedMajor: 'alchemy',
      hobbyCraft: 'cooking',
      attunedPairs: ['weaponcrafting+armorcrafting', 'engineering+alchemy'],
      switchCount: 1,
    });
    expect(changed(returned)).toBe(true);
    expect(changed(returned)).toBe(false);

    // A late gathering snapshot converges through the identical edge, and
    // subsequent identical polls elide again.
    expect(changed(returned, gathering({ fishing: 40 }))).toBe(true);
    expect(changed(returned, gathering({ fishing: 40 }))).toBe(false);
  });
});

// ProfessionSurfaceRefresh: the latch the Hud's slow band and the personal
// attunement arm probe (the lastProfessionSurfaceSig field and the
// refreshOpenProfessionSurfacesIfChanged body, extracted whole). A fake
// #crafting-window stands in for the one open-state read it makes.
describe('ProfessionSurfaceRefresh', () => {
  let craftingDisplay = 'none';
  beforeEach(() => {
    craftingDisplay = 'none';
    vi.stubGlobal('document', {
      querySelector: (sel: string) =>
        sel === '#crafting-window' ? { style: { display: craftingDisplay } } : null,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function latch(world: { craftingIdentity: CraftingIdentityView; professionsState: unknown }) {
    const renderCharWindowIfOpen = vi.fn();
    const renderCrafting = vi.fn();
    const refresh = new ProfessionSurfaceRefresh({
      world: () => world as unknown as IWorld,
      renderCharWindowIfOpen,
      renderCrafting,
    });
    return { refresh, renderCharWindowIfOpen, renderCrafting };
  }

  it('repaints the char window on the first probe and elides every unmoved one after', () => {
    const world = { craftingIdentity: identity(), professionsState: { skills: [] } };
    const { refresh, renderCharWindowIfOpen, renderCrafting } = latch(world);
    refresh.refreshIfChanged();
    expect(renderCharWindowIfOpen).toHaveBeenCalledTimes(1);
    // The crafting window is closed, so only the (open-gated) char window moved.
    expect(renderCrafting).not.toHaveBeenCalled();
    refresh.refreshIfChanged();
    refresh.refreshIfChanged();
    expect(renderCharWindowIfOpen).toHaveBeenCalledTimes(1);
  });

  it('repaints an OPEN crafting window on a moved identity, and a moved gathering row', () => {
    const world = {
      craftingIdentity: identity(),
      professionsState: { skills: [] as { professionId: string; skill: number }[] },
    };
    const { refresh, renderCharWindowIfOpen, renderCrafting } = latch(world);
    craftingDisplay = 'flex';
    refresh.refreshIfChanged();
    expect(renderCrafting).toHaveBeenCalledTimes(1);
    // Read live through the world thunk: a replaced identity is a new edge.
    world.craftingIdentity = identity({ switchCount: 1 });
    refresh.refreshIfChanged();
    expect(renderCrafting).toHaveBeenCalledTimes(2);
    // The other facet claims the same edge (a late gathering snapshot).
    world.professionsState = { skills: [{ professionId: 'fishing', skill: 40 }] };
    refresh.refreshIfChanged();
    expect(renderCharWindowIfOpen).toHaveBeenCalledTimes(3);
    expect(renderCrafting).toHaveBeenCalledTimes(3);
    // A closed crafting window is never painted, even on a moved edge.
    craftingDisplay = 'block';
    world.craftingIdentity = identity({ switchCount: 2 });
    refresh.refreshIfChanged();
    expect(renderCharWindowIfOpen).toHaveBeenCalledTimes(4);
    expect(renderCrafting).toHaveBeenCalledTimes(3);
  });
});

describe('Hud profession-surface convergence wiring', () => {
  const hud = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');
  const latchSource = readFileSync(
    new URL('../src/ui/hud/professions/profession_surface_refresh.ts', import.meta.url),
    'utf8',
  );
  const router = readFileSync(
    new URL('../src/ui/hud/professions/profession_event_router.ts', import.meta.url),
    'utf8',
  );
  const methodStart = latchSource.indexOf('  refreshIfChanged(): void {');
  const method = latchSource.slice(methodStart, latchSource.indexOf('\n  }', methodStart) + 4);

  it('refreshes both cold surfaces from the identity signature on the slow band', () => {
    expect(hud).toContain('if (slowHud) this.refreshOpenProfessionSurfacesIfChanged();');
    // The Hud method is the one-line forward into its lazy latch, built over
    // the live world and the two cold surfaces.
    expect(hud).toContain(
      '  private refreshOpenProfessionSurfacesIfChanged(): void {\n' +
        '    this.professionSurfaces.refreshIfChanged();\n' +
        '  }',
    );
    expect(hud).toContain('this.professionSurfacesState ??= new ProfessionSurfaceRefresh({');
    expect(hud).toContain('world: () => this.sim,');
    expect(hud).toContain('renderCharWindowIfOpen: () => this.charWindow.renderIfOpen(),');
    expect(hud).toContain('renderCrafting: () => this.renderCrafting(),');
    // The exact call shape, not three loose substrings: both facets must feed
    // the ONE signature call, so a refactor that decouples an argument from
    // the call while keeping the names in the method body still fails here.
    expect(methodStart).toBeGreaterThan(-1);
    expect(method).toContain(
      'professionSurfaceRefreshSig(\n' +
        '      world.craftingIdentity,\n' +
        '      buildGatheringProficiencyRows(world),\n' +
        '    )',
    );
    expect(method).toContain('this.deps.renderCharWindowIfOpen()');
    expect(method).toContain("$('#crafting-window').style.display === 'flex'");
    expect(method).toContain('this.deps.renderCrafting()');
  });

  it('also probes immediately for a personal attunement without wiring the bystander arm', () => {
    const personalStart = router.indexOf("case 'attunement': {");
    const personal = router.slice(personalStart, router.indexOf('\n    }', personalStart));
    const bystanderStart = router.indexOf("case 'attunedZone':\n      h.log(");
    const bystander = router.slice(bystanderStart, router.indexOf('break;', bystanderStart));
    expect(personalStart).toBeGreaterThan(-1);
    expect(bystanderStart).toBeGreaterThan(-1);
    expect(personal).toContain('h.refreshOpenProfessionSurfacesIfChanged()');
    expect(bystander).not.toContain('refreshOpenProfessionSurfacesIfChanged()');
  });

  it('watches the gossip intro hint on the same slow band and attunement probe', () => {
    // The open gossip dialog's intro hint row is the one identity-driven quest
    // surface: the online cprof mirror can land after it opened, so it rides
    // the same two convergence edges as the profession windows.
    expect(hud).toContain('if (slowHud) this.questDialog.refreshIfChanged();');
    const personalStart = router.indexOf("case 'attunement': {");
    const personal = router.slice(personalStart, router.indexOf('\n    }', personalStart));
    expect(personal).toContain('h.questDialog.refreshIfChanged()');
  });
});
