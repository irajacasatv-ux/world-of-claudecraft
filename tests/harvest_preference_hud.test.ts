// @vitest-environment happy-dom
//
// Focused integration regression for the Field Kit + Professions shared
// picker HUD glue (Intentional Gathering PR3), driven against REAL seams
// only: the real HarvestPreferenceController, the real FocusManager +
// makeWindowFocus bridge every other window uses, the real
// syncWindowOpenBodyClasses scan, and the real professions-entry markup/wire
// pair (harvestPreferenceEntryHtml + wireHarvestEntries). No Hud instance is
// constructed (it is a monolith with no test-only construction path, the
// tests/farming_windows_body_class.test.ts precedent); the hud.ts glue this
// file cannot drive directly (the event-routing case, the closeAll case, the
// relocalize fan-out, the professions dep wiring) is proven by a source scan
// against the real file, the same "hud wires..." idiom that precedent uses,
// never by an invented stand-in function. The spectator gate on the event
// (the real Hud.handleEvents over a bare prototype) lives with the other
// coordinator cases in tests/hud_coordinator_delegators.test.ts.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HarvestPreference } from '../src/sim/professions/harvest_preference';
import { FocusManager } from '../src/ui/focus_manager';
import { HarvestPreferenceController } from '../src/ui/hud/professions/harvest_preference_controller';
import {
  harvestPreferenceEntryHtml,
  harvestPreferenceLocalSig,
  wireHarvestEntries,
} from '../src/ui/hud/professions/professions_harvest_entry_controller';
import { makeWindowFocus } from '../src/ui/window_focus';
import { syncWindowOpenBodyClasses } from '../src/ui/window_open_state';
import type { IWorld } from '../src/world_api';
import { stripComments } from './helpers/strip_comments';

// happy-dom rewrites import.meta.url to an http scheme (the localization_fixes idiom).
const repoRoot = process.cwd();

class StubWorld {
  harvestPreference: HarvestPreference | null = { kind: 'all' };
  setHarvestPreference = vi.fn<(raw: string) => void>();
}

type PreferenceWorld = Pick<IWorld, 'harvestPreference' | 'setHarvestPreference'>;

const isVisible = (el: HTMLElement): boolean => getComputedStyle(el).display !== 'none';

function radioRows(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
}

let root: HTMLElement;
let world: StubWorld;
let currentWorld: PreferenceWorld;
let controller: HarvestPreferenceController;

beforeEach(() => {
  document.body.className = '';
  document.body.innerHTML =
    '<div id="harvest-preference-window" class="window panel" style="display:none"></div>' +
    '<div id="professions-window" class="window panel" style="display:none"></div>';
  root = document.getElementById('harvest-preference-window') as HTMLElement;
  world = new StubWorld();
  currentWorld = world as unknown as PreferenceWorld;
  const windowFocus = makeWindowFocus(new FocusManager(), () => root);
  controller = new HarvestPreferenceController({
    root: () => root,
    world: () => currentWorld,
    closeOthers: () => {},
    captureFocus: windowFocus.captureFocus,
    restoreFocus: windowFocus.restoreFocus,
    onVisibilityChange: () => syncWindowOpenBodyClasses(isVisible),
  });
});

describe('shared picker: real focus bridge + body-class mirror', () => {
  it('open/close installs and releases the ONE shared FocusManager trap, no independent listener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    controller.open();
    expect(addSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    controller.close();
    expect(removeSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('follows real open/close for the mobile body-class mirror, exactly like every other window', () => {
    expect(document.body.classList.contains('mobile-window-open')).toBe(false);
    controller.open();
    expect(document.body.classList.contains('mobile-window-open')).toBe(true);
    controller.close();
    expect(document.body.classList.contains('mobile-window-open')).toBe(false);
  });
});

describe('shared entry: the real professions entry markup + wiring open the real controller', () => {
  it('clicking the rendered entry opens the SAME controller, showing the current preference, without changing it', () => {
    world.harvestPreference = { kind: 'material', itemId: 'rough_hide' };
    const entryRoot = document.createElement('div');
    entryRoot.innerHTML = harvestPreferenceEntryHtml(world.harvestPreference, true);
    // The real wiring pair: no invented handler shape, the actual production
    // callback contract professions_window.ts hands wireHarvestEntries.
    wireHarvestEntries(entryRoot, { openHarvestPreference: () => controller.open() });

    const button = entryRoot.querySelector<HTMLButtonElement>('[data-harvest-preference]');
    expect(button).not.toBeNull();
    // Real remembered-choice subtitle, resolved through the same
    // knownItemDef/itemDisplayName path the picker itself uses.
    expect(button?.textContent).toContain('Rough Hide');

    button?.click();

    expect(controller.isOpen).toBe(true);
    const checked = radioRows(root).find((r) => r.getAttribute('aria-checked') === 'true');
    expect(checked?.dataset.harvestChoice).toBe('rough_hide');
    expect(world.setHarvestPreference).not.toHaveBeenCalled();
  });

  it('omits the entry entirely when the host has not wired it (no dead button)', () => {
    const entryRoot = document.createElement('div');
    entryRoot.innerHTML = harvestPreferenceEntryHtml(world.harvestPreference, false);
    expect(entryRoot.innerHTML).toBe('');
  });
});

describe('harvestPreferenceLocalSig: the pure repaint-signature extension professions_window.ts shares', () => {
  it('an "all" preference and null resolve to distinct signatures', () => {
    expect(harvestPreferenceLocalSig({ kind: 'all' })).toEqual(['all', null]);
    expect(harvestPreferenceLocalSig(null)).toEqual([null, null]);
  });

  it('a material preference carries the item id, so switching materials moves the signature', () => {
    expect(harvestPreferenceLocalSig({ kind: 'material', itemId: 'rough_hide' })).toEqual([
      'material',
      'rough_hide',
    ]);
    expect(harvestPreferenceLocalSig({ kind: 'material', itemId: 'sharp_fang' })).not.toEqual(
      harvestPreferenceLocalSig({ kind: 'material', itemId: 'rough_hide' }),
    );
  });

  it('undefined (a stub IWorld predating the field) reads exactly like a malformed null preference', () => {
    expect(harvestPreferenceLocalSig(undefined)).toEqual(harvestPreferenceLocalSig(null));
  });
});

describe('hud.ts wiring (source scan against the real file, the farming_windows_body_class idiom)', () => {
  const hud = stripComments(readFileSync(join(repoRoot, 'src/ui/hud.ts'), 'utf8'));

  it('routes the personal harvestPreferenceOpen event to the controller', () => {
    const start = hud.indexOf("case 'harvestPreferenceOpen':");
    expect(start, 'harvestPreferenceOpen case found').toBeGreaterThan(-1);
    // The next arm in the switch since harvestResult left for the profession
    // event router.
    const end = hud.indexOf("case 'gatherDenied':", start);
    expect(end, 'end anchor past start').toBeGreaterThan(start);
    expect(hud.slice(start, end)).toContain('this.harvestPreferenceController.open();');
  });

  it('closeAll routes the window id through the controller, focus-returning close', () => {
    const start = hud.indexOf("case 'harvest-preference-window':");
    expect(start, 'harvest-preference-window case found').toBeGreaterThan(-1);
    const end = hud.indexOf('break;', start);
    expect(end, 'end anchor past start').toBeGreaterThan(start);
    expect(hud.slice(start, end)).toContain('this.harvestPreferenceController.close();');
  });

  it('the language-switch fan-out reaches the controller', () => {
    expect(hud).toContain('this.harvestPreferenceController.relocalize();');
  });

  it('the Professions window is wired to open the SAME controller', () => {
    const start = hud.indexOf('  readonly professionsWindow = new ProfessionsWindow({');
    expect(start, 'professionsWindow construction found').toBeGreaterThan(-1);
    const end = hud.indexOf(
      'private readonly harvestPreferenceController = new HarvestPreferenceController({',
      start,
    );
    expect(end, 'end anchor past start').toBeGreaterThan(start);
    expect(hud.slice(start, end)).toContain(
      'openHarvestPreference: () => this.harvestPreferenceController.open()',
    );
  });
});
