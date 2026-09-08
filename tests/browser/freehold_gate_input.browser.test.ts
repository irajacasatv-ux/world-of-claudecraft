// Composed native-input proof: the real gate, Input, gamepad dispatch, managed
// Hud close route, and FocusManager bridge run together. Only unused HUD state
// is omitted; entry calls through the real Sim so cancellation also pins travel.
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import { clearPadFocus } from '../../src/game/dpad_focus_nav';
import { GamepadManager } from '../../src/game/gamepad';
import { GamepadBindings } from '../../src/game/gamepad_bindings';
import { Input, type InputCallbacks } from '../../src/game/input';
import { Keybinds } from '../../src/game/keybinds';
import { Sim } from '../../src/sim/sim';
import { WORLD_SEED } from '../../src/sim/world_seed';
import { FocusManager } from '../../src/ui/focus_manager';
import { Hud } from '../../src/ui/hud';
import {
  type FreeholdFriendAdapter,
  FreeholdGatePrompt,
  freeholdGateRoot,
} from '../../src/ui/hud/housing/gate_prompt_controller';
import type { GateLookupRequest, GateVisitCapability } from '../../src/ui/hud/housing/housing_view';
import { makeWindowFocus } from '../../src/ui/window_focus';
import { cleanup, stubDeps } from './_harness';

let input: Input;
let current: ReturnType<typeof mount> | null = null;

// Only the installed protocol methods this Chromium fixture uses. Importing
// the provider's whole type surface also brings unrelated Electron DOM types.
type GateCdpCommand =
  | 'Page.getFrameTree'
  | 'DOM.getFrameOwner'
  | 'DOM.getBoxModel'
  | 'Emulation.setTouchEmulationEnabled'
  | 'Input.dispatchTouchEvent'
  | 'Emulation.setEmulatedMedia';
interface GateCdpSession {
  send<Command extends GateCdpCommand>(
    method: Command,
    ...params: ProtocolMapping.Commands[Command]['paramsType']
  ): Promise<ProtocolMapping.Commands[Command]['returnType']>;
}

beforeAll(() => {
  localStorage.clear();
  input = new Input(
    document.createElement('canvas'),
    stubDeps<InputCallbacks>({
      canUseGameKeys: () => true,
      onUiKey: (key) => {
        if (!current) return;
        if (key === 'escape') current.hud.closeAll();
        if (key === 'chat') {
          current.chatOpens++;
          current.chat.style.display = 'block';
          current.chat.focus();
        }
      },
    }),
    new Keybinds(),
  );
});

afterEach(async () => {
  await userEvent.keyboard('[/Enter][/Space]');
  current?.prompt.close();
  current = null;
  clearPadFocus();
  vi.restoreAllMocks();
  cleanup();
  document.body.className = '';
  input.readMoveInput();
});

function mount(friend?: FreeholdFriendAdapter) {
  document.body.className = 'game-active';
  document.body.innerHTML =
    '<button id="gate-opener">Open gate</button><div id="ui"></div><div id="ctx-menu" style="display:none"></div><div id="delve-rite-panel" style="display:none"></div><textarea id="gate-chat" style="display:none"></textarea>';
  const sim = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', freeholdsEnabled: true });
  const gate = [...sim.entities.values()].find((entity) => entity.templateId === 'freehold_gate');
  if (!gate) throw new Error('The authored Freehold gate did not spawn.');
  sim.player.pos = { ...gate.pos };
  sim.player.prevPos = { ...gate.pos };
  sim.drainEvents();
  const enter = vi.spyOn(sim, 'freeholdEnter');
  const root = freeholdGateRoot();
  const opener = document.getElementById('gate-opener')!;
  const chat = document.getElementById('gate-chat') as HTMLTextAreaElement;
  const fm = new FocusManager();
  const prompt = new FreeholdGatePrompt({
    friend,
    root: () => root,
    world: () => sim,
    closeOthers: () => undefined,
    ...makeWindowFocus(fm, () => root),
    onVisibilityChange: () => undefined,
  });
  // Retain real closeAll, topmostOpenWindow and closeManagedWindow methods.
  // These unrelated surfaces are closed; the painter owns real trap teardown.
  const hud: Hud = Object.assign(Object.create(Hud.prototype), {
    lootWindow: { hasOpenChest: false },
    playerCard: { isOpen: false },
    freeholdGatePrompt: prompt,
    syncAnyWindowOpenState: () => undefined,
  });
  const state = { sim, gate, enter, prompt, root, opener, chat, hud, chatOpens: 0 };
  current = state;
  opener.focus();
  prompt.open();
  return state;
}

function control(key: string): HTMLElement {
  const root = current!.root;
  const found = root.querySelector<HTMLElement>(
    key === 'own' || key === 'visit' ? `#gate-${key}-tab` : `[data-focus-key="gate-${key}"]`,
  );
  if (!found) throw new Error(`Gate control ${key} is missing.`);
  return found;
}

function travel(sim: Sim) {
  return JSON.stringify({
    pos: sim.player.pos,
    previous: sim.player.prevPos,
    sequence: sim.player.dungeonEntrySeq,
    inventory: sim.inventory,
  });
}

async function cancelled(f: ReturnType<typeof mount>, before: string) {
  expect(f.prompt.isOpen).toBe(false);
  expect(f.root.style.display).toBe('none');
  expect(f.enter).not.toHaveBeenCalled();
  expect(travel(f.sim)).toBe(before);
  expect(f.chatOpens).toBe(0);
  await vi.waitFor(() => expect(document.activeElement).toBe(f.opener));
}

// Optional supplementary presentation receipts. These exercise dormant adapter
// and denial states and must never be labelled online authority evidence.
async function capturePresentation(name: string): Promise<void> {
  if (import.meta.env.VITE_FREEHOLD_PRESENTATION_CAPTURE !== '1') return;
  await page.viewport(390, 844);
  document.body.classList.add('mobile-touch');
  await page.screenshot({ path: `../../docs/screenshots/freeholds-06-presentation/${name}.png` });
}

describe('Freehold gate native input and cancellation', () => {
  it.each(['Enter', 'Space'])(
    '%s activates the own-home button once without chat or jump',
    async (key) => {
      const f = mount();
      control('enter').focus();
      await userEvent.keyboard(`[${key}]`);
      expect(f.chatOpens).toBe(0);
      expect(input.readMoveInput().jump).toBe(false);
      expect(f.enter).toHaveBeenCalledTimes(1);
      expect(f.sim.player.dungeonEntrySeq).toBe(1);
      expect(f.prompt.isOpen).toBe(false);
    },
  );

  it.each(['Enter', 'Space'])(
    '%s keeps tab and Find Home activation native without entry',
    async (key) => {
      const lookup = vi.fn(async () => null);
      const f = mount({ lookup, enter: vi.fn() });
      control('visit').focus();
      await userEvent.keyboard(`[${key}]`);
      expect(control('visit').getAttribute('aria-selected')).toBe('true');
      control('name').focus();
      await userEvent.keyboard('Fen');
      control('lookup').focus();
      await userEvent.keyboard(`[${key}]`);
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(f.enter).not.toHaveBeenCalled();
      expect(f.chatOpens).toBe(0);
      expect(input.readMoveInput().jump).toBe(false);
    },
  );

  it.each(['Enter', 'Space'])(
    '%s on the native home select never opens chat or jumps',
    async (key) => {
      const f = mount();
      const select = control('home') as HTMLSelectElement;
      let prevented: boolean | null = null;
      select.addEventListener('keydown', (event) => {
        if (event.code === key)
          queueMicrotask(() => {
            prevented = event.defaultPrevented;
          });
      });
      select.focus();
      await userEvent.keyboard(`[${key}]`);
      expect(f.chatOpens).toBe(0);
      expect(input.readMoveInput().jump).toBe(false);
      expect(prevented).toBe(false);
      expect(f.enter).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(select);
      // Dismiss native popup without turning this into a gate confirmation.
      await userEvent.keyboard('[Escape]');
    },
  );

  it.each(['Enter', 'Space'])('%s on Cancel closes and returns the real opener', async (key) => {
    const f = mount();
    const before = travel(f.sim);
    control('close').focus();
    await userEvent.keyboard(`[${key}]`);
    await cancelled(f, before);
  });

  it('Escape from a button runs the shared managed close dispatcher and restores focus', async () => {
    const f = mount();
    const before = travel(f.sim);
    control('enter').focus();
    await userEvent.keyboard('[Escape]');
    await cancelled(f, before);
  });

  it('Escape from the character name cancels, while composing Escape preserves the draft', async () => {
    const f = mount();
    const before = travel(f.sim);
    control('visit').click();
    const name = control('name') as HTMLInputElement;
    name.focus();
    name.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    name.value = '芬';
    name.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    name.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
        isComposing: true,
      }),
    );
    expect(f.prompt.isOpen).toBe(true);
    expect(control('name')).toBe(name);
    expect(name.value).toBe('芬');
    name.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await userEvent.keyboard('[Escape]');
    await cancelled(f, before);
  });

  it('gamepad B traverses GamepadManager and the managed close dispatcher with focus return', async () => {
    const f = mount();
    const before = travel(f.sim);
    const buttons = Array.from({ length: 17 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    }));
    const pad = {
      axes: [0, 0, 0, 0],
      buttons,
      connected: true,
      id: 'gate-test-pad',
      index: 0,
      mapping: 'standard',
      timestamp: 0,
      vibrationActuator: null,
    } as unknown as Gamepad;
    vi.spyOn(navigator, 'getGamepads').mockReturnValue([pad]);
    const manager = new GamepadManager(input, new GamepadBindings(), {
      onInputEdge: () => undefined,
      onAction: (id) => {
        if (id === 'escape') f.hud.closeAll();
      },
      isPointerMode: () => f.prompt.isOpen,
    });
    manager.start();
    try {
      manager.poll(0.05);
      buttons[1] = { pressed: true, touched: true, value: 1 };
      manager.poll(0.05);
      await cancelled(f, before);
    } finally {
      manager.stop();
    }
  });

  it('a trusted touch Cancel closes and returns focus without command or teleport', async () => {
    const f = mount();
    const before = travel(f.sim);
    const close = control('close');
    const box = close.getBoundingClientRect();
    let trustedTouch = false;
    close.addEventListener('pointerdown', (event) => {
      trustedTouch = event.isTrusted && event.pointerType === 'touch';
    });
    const session = cdp() as GateCdpSession;
    // Vitest isolates this document in a potentially cross-origin iframe.
    // CDP touches use the top-level viewport, so resolve its actual frame box.
    const tree = await session.send('Page.getFrameTree');
    const frame = tree.frameTree.childFrames?.find(
      (child: { frame: { url: string; id: string } }) => child.frame.url === window.location.href,
    );
    if (!frame) throw new Error('The browser test iframe was not found.');
    const owner = await session.send('DOM.getFrameOwner', { frameId: frame.frame.id });
    const { model } = await session.send('DOM.getBoxModel', { backendNodeId: owner.backendNodeId });
    const x =
      model.content[0] +
      ((box.left + box.width / 2) * (model.content[2] - model.content[0])) / window.innerWidth;
    const y =
      model.content[1] +
      ((box.top + box.height / 2) * (model.content[5] - model.content[1])) / window.innerHeight;
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect(trustedTouch).toBe(true);
      await cancelled(f, before);
    } finally {
      await session.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  });

  it('pointer activation parks focus on the dynamic dialog before its action handler', async () => {
    const f = mount({
      lookup: vi.fn(() => new Promise<GateVisitCapability | null>(() => undefined)),
      enter: vi.fn(),
    });
    control('visit').click();
    control('name').focus();
    await userEvent.keyboard('Fen');
    let focusAtCapture: Element | null = null;
    f.root.addEventListener(
      'click',
      () => {
        focusAtCapture = document.activeElement;
      },
      true,
    );
    await userEvent.click(control('lookup'));
    expect(focusAtCapture).toBe(f.root);
    expect(document.activeElement).toBe(f.root);
    expect(f.enter).not.toHaveBeenCalled();
  });

  it.each(['range', 'death', 'gate removed', 'disabled host'])(
    'stale %s activation explains unavailability and disables Enter',
    async (reason) => {
      const f = mount();
      if (reason === 'range') f.sim.player.pos.x += 20;
      if (reason === 'death') f.sim.player.dead = true;
      if (reason === 'gate removed') f.sim.entities.delete(f.gate.id);
      if (reason === 'disabled host') f.sim.cfg.freeholdsEnabled = false;
      const before = travel(f.sim);
      control('enter').focus();
      await userEvent.keyboard('[Enter]');
      expect(f.enter).not.toHaveBeenCalled();
      expect(travel(f.sim)).toBe(before);
      expect(f.root.querySelector('[role="status"]')!.textContent).toBe(
        'This is unavailable right now.',
      );
      expect(f.root.textContent!.match(/This is unavailable right now\./g)).toHaveLength(1);
      expect((control('enter') as HTMLButtonElement).disabled).toBe(true);
      expect(f.chatOpens).toBe(0);
      await capturePresentation(`stale-${reason.replaceAll(' ', '-')}`);
    },
  );

  it.each([
    ['no_freehold', 'This home is unavailable right now. Try again later.'],
    ['busy', 'This home is active elsewhere or still opening. Try again shortly.'],
    ['not_friend', 'You cannot use this here.'],
    ['locked', "Restore your home's condition to use this amenity."],
    ['dead', 'You cannot do that while dead.'],
    ['combat', 'You cannot do that in combat.'],
    ['cooldown', 'Your Hearth Key is still cooling down.'],
    ['instanced', 'You cannot use this inside an instance.'],
    ['match', 'You cannot use this during a match.'],
  ] as const)('presents the %s refusal and permits explicit recovery', async (reason, expected) => {
    const f = mount();
    // Presentation-only held response; actual successful Sim entry is above.
    f.enter.mockImplementation(() => undefined);
    control('enter').focus();
    await userEvent.keyboard('[Enter]');
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    expect(f.root.querySelector('[role="status"]')!.textContent).toBe('Opening the door...');
    if (reason === 'busy') await capturePresentation('entry-pending');
    f.prompt.notifyDenied({ type: 'freeholdDenied', pid: f.sim.playerId, reason });
    expect(f.root.getAttribute('aria-busy')).toBe('false');
    expect(f.root.querySelector('[role="status"]')!.textContent).toBe(expected);
    expect(document.activeElement).toBe(control('enter'));
    await capturePresentation(`denied-${reason}`);
    await userEvent.keyboard('[Enter]');
    expect(f.enter).toHaveBeenCalledTimes(2);
  });

  it('keeps Name Enter as Find Home, then requires a separate result-to-entry activation', async () => {
    let settle: (capability: GateVisitCapability | null) => void = () => undefined;
    const lookup = vi.fn(
      (_request: GateLookupRequest) =>
        new Promise<GateVisitCapability | null>((resolve) => {
          settle = resolve;
        }),
    );
    const friendEnter = vi.fn();
    const f = mount({ lookup, enter: friendEnter });
    control('visit').click();
    expect(f.root.querySelector('[role="status"]')!.textContent).toBe(
      'Enter a character name to visit.',
    );
    await capturePresentation('friend-name-required');
    control('name').focus();
    await userEvent.keyboard('芬 Fen');
    await capturePresentation('friend-nonlatin-draft');
    await userEvent.keyboard('[Enter]');
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(friendEnter).not.toHaveBeenCalled();
    expect(f.root.querySelector('[role="status"]')!.textContent).toBe(
      "Finding your friend's home...",
    );
    await capturePresentation('friend-lookup-pending');
    settle(null);
    await vi.waitFor(() => expect(control('lookup').textContent).toBe('Try Again'));
    expect((control('name') as HTMLInputElement).value).toBe('芬 Fen');
    await capturePresentation('friend-lookup-retry');
    control('lookup').focus();
    await userEvent.keyboard('[Enter]');
    const request = lookup.mock.calls[1][0];
    settle({ ...request, homeId: 'presentation-home', displayName: '芬 Fen' });
    await vi.waitFor(() => expect(document.activeElement).toBe(control('result')));
    expect(f.root.querySelector('[role="status"]')!.textContent).toBe('Home belonging to 芬 Fen');
    expect(friendEnter).not.toHaveBeenCalled();
    await capturePresentation('friend-lookup-result');
    await userEvent.keyboard('[Tab]');
    expect(document.activeElement).toBe(control('enter'));
    await userEvent.keyboard('[Enter]');
    expect(friendEnter).toHaveBeenCalledTimes(1);
    expect(f.enter).not.toHaveBeenCalled();
  });

  it('keeps gate keyboard controls visible with forced colors', async () => {
    const f = mount();
    const session = cdp() as GateCdpSession;
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    try {
      control('enter').focus();
      expect(matchMedia('(forced-colors: active)').matches).toBe(true);
      const style = getComputedStyle(control('enter'));
      expect(style.outlineStyle).not.toBe('none');
      expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
      await capturePresentation('forced-colors');
      await userEvent.keyboard('[Escape]');
      expect(f.prompt.isOpen).toBe(false);
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
  });
});
