// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusManager } from '../src/ui/focus_manager';
import {
  type FreeholdFriendAdapter,
  FreeholdGatePrompt,
} from '../src/ui/hud/housing/gate_prompt_controller';
import type { GateLookupRequest, GateVisitCapability } from '../src/ui/hud/housing/housing_view';
import type { IWorld } from '../src/world_api';
import { bareClient } from './helpers/bare_client';
import { cssTreeUnder } from './helpers/css_tree_under';

// Every coordinate in this file is a self-consistent SYNTHETIC world (the gate's
// first authored site, (-14,-92), kept as a stand-in): the prompt reads only the
// fake world's gate and player, never EASTBROOK_LAYOUT, so the live site
// (tests/freehold_gate_clearance.test.ts) is not pinned here.
function fixture(enabled = true, friend?: FreeholdFriendAdapter) {
  document.body.innerHTML = '<button id="opener"></button><div id="gate"></div>';
  const root = document.getElementById('gate')!;
  const world = {
    cfg: { freeholdsEnabled: enabled },
    playerId: 1,
    player: {
      dead: false,
      ghost: false,
      corpseInstanceId: null,
      pos: { x: -14, y: 0, z: -91 },
      dungeonEntrySeq: 0,
    },
    entities: new Map([
      [2, { id: 2, kind: 'object', templateId: 'freehold_gate', pos: { x: -14, y: 0, z: -92 } }],
    ]),
    freeholdEnter: vi.fn(),
  };
  const restoreFocus = vi.fn();
  const opener = document.getElementById('opener')!;
  const prompt = new FreeholdGatePrompt({
    friend,
    root: () => root,
    world: () => world as unknown as IWorld,
    closeOthers: vi.fn(),
    captureFocus: () => opener,
    restoreFocus,
    onVisibilityChange: vi.fn(),
  });
  const control = (key: string) =>
    root.querySelector<HTMLElement>(
      key === 'gate-own' || key === 'gate-visit' ? `#${key}-tab` : `[data-focus-key="${key}"]`,
    )!;
  return { prompt, world, root, control, opener, restoreFocus };
}
beforeEach(() => {
  document.body.innerHTML = '';
});
describe('Freehold gate dialog', () => {
  it('renders its tabs on the library tab primitive, 40 px tall, with no local selected look', () => {
    const f = fixture();
    f.prompt.open();
    const tabs = [...f.root.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((tab) => tab.id)).toEqual(['gate-own-tab', 'gate-visit-tab']);
    for (const tab of tabs) {
      expect(tab.classList.contains('ui-tab'), tab.id).toBe(true);
      expect(tab.parentElement?.classList.contains('ui-tabs'), tab.id).toBe(true);
    }
    // The library owns the selected state (library.css .ui-tab[aria-selected]);
    // a later-layer gate rule restyling it would override that primitive, and
    // the gate's own floor keeps its buttons, the tabs included, at 40 px.
    const css = readFileSync('src/styles/components.css', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    expect(css).toMatch(
      /#freehold-gate-window button,[^{]*\{ min-height: 40px; min-width: 40px; \}/,
    );
  });
  it('leaves the selected tab to the library in every stylesheet, under every selector', () => {
    // Every selector in every sheet, by the text before its brace: one that
    // scopes to the gate prompt or its tabs must not also name a selected
    // state, whether the painter's `on` class or the aria attribute.
    const GATE = /#freehold-gate-window|\.fh-gate-tabs?(?![\w-])/;
    const SELECTED = /\[aria-selected|\.(?:on|is-on|active|selected)(?![\w-])/;
    const gateSelectors: string[] = [];
    for (const { file, full } of cssTreeUnder('src/styles').files) {
      const css = readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const head of css.split('{').slice(0, -1)) {
        const selector = head.slice(Math.max(head.lastIndexOf('}'), head.lastIndexOf(';')) + 1);
        if (!GATE.test(selector)) continue;
        gateSelectors.push(selector);
        expect(SELECTED.test(selector), `${file}: ${selector.trim()}`).toBe(false);
      }
    }
    // Positive control: the scan reads the gate's own rules (measured 8).
    expect(gateSelectors.length).toBeGreaterThanOrEqual(8);
    expect(SELECTED.test('#freehold-gate-window .fh-gate-tab.on')).toBe(true);
    expect(SELECTED.test('.fh-gate-tabs [aria-selected="true"]')).toBe(true);
    expect(SELECTED.test('#freehold-gate-window .btn')).toBe(false);
    expect(GATE.test('.fh-gate-tabs button')).toBe(true);
    expect(GATE.test('.fh-gate-tab-x')).toBe(false);
  });
  it('keeps the selected tab apart from the others under forced colors', () => {
    // The library's selected look is a fill and a text color, both stripped by
    // the forced palette; base.css underlines it there, in both selected forms,
    // and no sheet takes the underline back off a tab.
    const block = (css: string) => {
      const at = css.indexOf('@media (forced-colors: active) {');
      expect(at).toBeGreaterThan(-1);
      let depth = 0;
      for (let i = css.indexOf('{', at); i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}' && --depth === 0) return css.slice(at, i);
      }
      return '';
    };
    const base = readFileSync('src/styles/base.css', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    expect(block(base)).toContain(
      '.ui-tab[aria-selected="true"], .ui-tab.is-on { text-decoration: underline; }',
    );
    for (const { file, full } of cssTreeUnder('src/styles').files) {
      const css = readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const rule of css.matchAll(/([^{};]*\.ui-tab\b[^{]*)\{([^}]*)\}/g))
        if (/text-decoration/.test(rule[2]))
          expect(`${file}: ${rule[1].trim()}`).toMatch(/^base\.css: /);
    }
  });
  it('dark hosts never open or create a prompt', () => {
    const f = fixture(false);
    f.prompt.open();
    expect(f.prompt.isOpen).toBe(false);
    expect(f.root.childElementCount).toBe(0);
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
  });
  it('sends once per explicit intent and re-arms only on close/reopen or matching denial', () => {
    const f = fixture();
    f.prompt.open();
    const stale = f.control('gate-enter');
    stale.click();
    stale.click();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(1);
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    f.prompt.close();
    expect(f.restoreFocus).toHaveBeenCalledWith(f.opener);
    f.prompt.open();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(1);
    expect(f.root.getAttribute('aria-busy')).toBe('false');
    stale.click();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(1);
    f.control('gate-enter').click();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(2);
    f.prompt.notifyDenied({ type: 'freeholdDenied', pid: 2, reason: 'busy' });
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    f.prompt.notifyDenied({ type: 'freeholdDenied', pid: 1, reason: 'busy' });
    f.control('gate-enter').click();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(3);
  });
  it('reconciles an accepted teleport after close without restoring an old opener', () => {
    const f = fixture();
    f.prompt.open();
    f.control('gate-enter').click();
    f.prompt.close();
    f.restoreFocus.mockClear();
    f.world.player.pos.x = 119200;
    f.world.player.dungeonEntrySeq = 1;
    f.prompt.reconcile();
    expect(f.prompt.isOpen).toBe(false);
    expect(f.restoreFocus).not.toHaveBeenCalled();
    f.world.player.pos.x = -14;
    f.prompt.open();
    f.control('gate-enter').click();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(2);
  });
  it('returns accepted entry to world input and never lets a detached control send', () => {
    const f = fixture();
    f.prompt.open();
    const old = f.control('gate-enter');
    f.prompt.close();
    f.prompt.open();
    old.click();
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
    f.world.freeholdEnter.mockImplementation(() => {
      f.world.player.pos.x = 119200;
      f.world.player.dungeonEntrySeq++;
    });
    f.control('gate-enter').click();
    expect(f.prompt.isOpen).toBe(false);
    expect(f.restoreFocus).toHaveBeenLastCalledWith(null);
  });
  it('supports shared tab arrows and preserves friend draft with lookup and Enter unavailable', () => {
    const f = fixture();
    f.prompt.open();
    f.control('gate-own').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect(f.control('gate-visit').getAttribute('aria-selected')).toBe('true');
    const input = f.control('gate-name') as HTMLInputElement;
    input.value = 'Fen';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(f.control('gate-enter')).toBeNull();
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
    expect((f.control('gate-lookup') as HTMLButtonElement).disabled).toBe(true);
    f.prompt.relocalize();
    expect((f.control('gate-name') as HTMLInputElement).value).toBe('Fen');
  });
  it('keeps a persistent live region and returns a denied keyboard action without stealing outside focus', () => {
    const f = fixture();
    f.prompt.open();
    const status = f.root.querySelector('[role="status"]');
    f.control('gate-enter').focus();
    f.control('gate-enter').click();
    f.prompt.notifyDenied({ type: 'freeholdDenied', pid: 1, reason: 'busy' });
    expect(document.activeElement).toBe(f.control('gate-enter'));
    expect(f.root.querySelector('[role="status"]')).toBe(status);
    expect(status!.textContent).toContain('active elsewhere');
    f.control('gate-enter').click();
    expect(status!.textContent).toBe('Opening the door...');
    f.opener.focus();
    f.prompt.relocalize();
    expect(document.activeElement).toBe(f.opener);
    f.prompt.notifyDenied({ type: 'freeholdDenied', pid: 1, reason: 'busy' });
    expect(document.activeElement).toBe(f.opener);
    expect(f.root.querySelector('[role="status"]')).toBe(status);
  });
  it('does not turn a parked nested dialog into a control focus on relocalization', () => {
    const f = fixture();
    f.prompt.open();
    const parked = document.createElement('div');
    parked.setAttribute('role', 'dialog');
    parked.tabIndex = -1;
    f.root.querySelector('.fh-gate-content')!.appendChild(parked);
    parked.focus();
    expect(document.activeElement).toBe(parked);
    f.prompt.relocalize();
    expect(f.root.contains(document.activeElement)).toBe(false);
  });
  it('links both shared tabs to a live panel and leaves pointer tab changes unfocused', () => {
    const f = fixture();
    f.prompt.open();
    for (const tab of f.root.querySelectorAll('[role="tab"]'))
      expect(f.root.querySelector('#' + tab.getAttribute('aria-controls'))).not.toBeNull();
    f.control('gate-visit').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(f.control('gate-visit').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).not.toBe(f.control('gate-visit'));
  });
  it('revalidates range at activation', () => {
    const f = fixture();
    f.prompt.open();
    f.world.player.pos.x = 50;
    f.control('gate-enter').click();
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
  });
});

describe('Freehold prompt with real ClientWorld wire decoding', () => {
  function onlineFixture() {
    document.body.innerHTML = '<button id="opener"></button><div id="gate"></div>';
    const root = document.getElementById('gate')!;
    const sent: Record<string, unknown>[] = [];
    const world = bareClient(1, {
      cfg: { seed: 42, playerClass: 'warrior', freeholdsEnabled: true },
      ws: { readyState: WebSocket.OPEN, send: (raw: string) => sent.push(JSON.parse(raw)) },
    });
    const wire = world as unknown as {
      applySnapshot(snapshot: unknown): void;
      onMessage(raw: string): void;
    };
    let tick = 0;
    const snapshot = (x = -14, de?: number) => {
      wire.applySnapshot({
        t: 'snap',
        tick: ++tick,
        time: tick / 20,
        self: {
          id: 1,
          k: 'player',
          tid: 'warrior',
          nm: 'Fen',
          lv: 1,
          x,
          y: 0,
          z: x > 10000 ? -1250 : -91,
          f: 0,
          hp: 100,
          mhp: 100,
          ...(de === undefined ? {} : { de }),
        },
        ents:
          x > 10000
            ? []
            : [
                {
                  id: 2,
                  k: 'object',
                  tid: 'freehold_gate',
                  nm: 'Freehold Gate',
                  x: -14,
                  y: 0,
                  z: -92,
                  f: 0,
                  hp: 1,
                  mhp: 1,
                },
              ],
      });
    };
    snapshot(-14, 0);
    const restoreFocus = vi.fn();
    const prompt = new FreeholdGatePrompt({
      root: () => root,
      world: () => world,
      closeOthers: vi.fn(),
      captureFocus: () => document.getElementById('opener'),
      restoreFocus,
      onVisibilityChange: vi.fn(),
    });
    const enter = () =>
      root.querySelector<HTMLButtonElement>('[data-focus-key="gate-enter"]')!.click();
    const flush = () => {
      prompt.reconcile();
      for (const event of world.drainEvents())
        if (event.type === 'freeholdDenied') prompt.notifyDenied(event);
    };
    return { root, world, wire, sent, snapshot, prompt, enter, flush, restoreFocus };
  }
  it('mirrors authoritative entry generations and closes the pending online dialog after landing', () => {
    const f = onlineFixture();
    expect(f.world.player.dungeonEntrySeq).toBe(0);
    f.prompt.open();
    f.enter();
    f.enter();
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(1);
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    f.snapshot(-14, undefined);
    f.flush();
    expect(f.prompt.isOpen).toBe(true);
    f.snapshot(119200, 1);
    f.flush();
    expect(f.world.player.dungeonEntrySeq).toBe(1);
    expect(f.prompt.isOpen).toBe(false);
    expect(f.restoreFocus).toHaveBeenLastCalledWith(null);
    f.snapshot(119200, undefined);
    expect(f.world.player.dungeonEntrySeq).toBe(1);
  });
  it('does not replay a cold room snapshot and still settles an entry accepted after close', () => {
    const f = onlineFixture();
    f.snapshot(119200, 4);
    f.flush();
    expect(f.prompt.isOpen).toBe(false);
    expect(f.restoreFocus).not.toHaveBeenCalled();
    f.snapshot(-14, undefined);
    f.prompt.open();
    f.enter();
    f.prompt.close();
    f.restoreFocus.mockClear();
    f.snapshot(119200, 5);
    f.flush();
    expect(f.restoreFocus).not.toHaveBeenCalled();
    f.snapshot(-14, undefined);
    f.prompt.open();
    f.enter();
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(2);
  });
  it('decodes a live dark-flag refusal and rearms the request without changing the mirrored position', () => {
    const f = onlineFixture();
    f.prompt.open();
    f.enter();
    f.wire.onMessage(
      JSON.stringify({
        t: 'events',
        list: [{ type: 'freeholdDenied', pid: 1, reason: 'no_freehold' }],
      }),
    );
    f.flush();
    expect(f.root.getAttribute('aria-busy')).toBe('false');
    expect(f.prompt.isOpen).toBe(true);
    expect(f.world.player.pos.x).toBe(-14);
    f.enter();
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(2);
  });
  it('retires an uncertain entry on real reconnect hello before the fresh snapshot without replay', () => {
    const f = onlineFixture();
    f.prompt.open();
    f.enter();
    Object.assign(f.world, { connected: false, reconnectAttempts: 1 });
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    f.world.onReconnected = () => f.prompt.onReconnected();
    f.wire.onMessage(JSON.stringify({ t: 'hello', pid: 1, seed: 42, freeholdsEnabled: true }));
    expect(f.prompt.isOpen).toBe(false);
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(1);
    f.snapshot(-14, 0);
    f.flush();
    f.prompt.open();
    f.enter();
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(2);
    Object.assign(f.world, { connected: false, reconnectAttempts: 1 });
    f.wire.onMessage(JSON.stringify({ t: 'hello', pid: 1, seed: 42, freeholdsEnabled: true }));
    f.snapshot(119200, 1);
    f.flush();
    expect(f.prompt.isOpen).toBe(false);
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(2);
  });
  it('unrelated decoded errors cannot retire pending authority, but a keyed jail refusal can', () => {
    const f = onlineFixture();
    f.prompt.open();
    f.enter();
    f.wire.onMessage(
      JSON.stringify({ t: 'events', list: [{ type: 'error', pid: 1, text: 'unrelated' }] }),
    );
    f.flush();
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    f.wire.onMessage(
      JSON.stringify({
        t: 'events',
        list: [{ type: 'freeholdDenied', pid: 1, reason: 'no_freehold' }],
      }),
    );
    f.flush();
    expect(f.root.getAttribute('aria-busy')).toBe('false');
  });
  it('allows an explicit retry after a transport-unavailable send with no reconnect callback', () => {
    const f = onlineFixture();
    f.world.connected = false;
    f.prompt.open();
    f.enter();
    expect(f.sent).toEqual([]);
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    f.prompt.close();
    f.world.connected = true;
    f.prompt.open();
    expect(f.root.getAttribute('aria-busy')).toBe('false');
    expect(f.sent).toEqual([]);
    f.enter();
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(1);
  });
  it('accepts a late original snapshot after close without replay or reopening the gate inside home', () => {
    const f = onlineFixture();
    f.prompt.open();
    f.enter();
    f.prompt.close();
    f.snapshot(119200, 1);
    f.flush();
    expect(f.world.player.pos.x).toBe(119200);
    f.prompt.open();
    expect(f.prompt.isOpen).toBe(false);
    expect(f.sent.filter((message) => message.cmd === 'freehold_enter')).toHaveLength(1);
  });
});

describe('dormant friend lookup composition', () => {
  function friendFixture() {
    const requests: {
      request: GateLookupRequest;
      resolve(value: GateVisitCapability | null): void;
      reject(): void;
    }[] = [];
    const enter = vi.fn();
    const lookup = vi.fn(
      (request: GateLookupRequest) =>
        new Promise<GateVisitCapability | null>((resolve, reject) =>
          requests.push({ request, resolve, reject: () => reject(new Error('offline')) }),
        ),
    );
    const f = fixture(true, { lookup, enter });
    f.prompt.open();
    f.control('gate-visit').click();
    const edit = (value: string) => {
      const input = f.control('gate-name') as HTMLInputElement;
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const find = () => {
      f.control('gate-lookup').focus();
      f.control('gate-lookup').click();
    };
    const settle = async (index: number, name = 'Fen') => {
      requests[index].resolve({
        ...requests[index].request,
        homeId: 'home-' + index,
        displayName: name,
      });
      await Promise.resolve();
    };
    return { ...f, requests, enter, lookup, edit, find, settle };
  }
  it('composes pending, authorized result, live announcement, and Tab to explicit Enter', async () => {
    const f = friendFixture();
    expect(f.root.textContent).toContain('Enter a character name to visit.');
    f.edit('  Fen  ');
    f.find();
    const status = f.root.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("Finding your friend's home...");
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    expect(f.control('gate-enter')).toBeNull();
    expect(f.requests[0].request.normalizedName).toBe('fen');
    await f.settle(0);
    expect(status.textContent).toBe('Home belonging to Fen');
    expect(document.activeElement).toBe(f.control('gate-result'));
    expect(f.enter).not.toHaveBeenCalled();
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getClientRects')
      .mockReturnValue([{ width: 40, height: 40 }] as unknown as DOMRectList);
    const manager = new FocusManager();
    const trap = manager.open({ root: () => f.root });
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(f.control('gate-enter'));
    f.control('gate-enter').click();
    f.control('gate-enter').click();
    expect(f.enter).toHaveBeenCalledTimes(1);
    expect(f.enter).toHaveBeenCalledWith({
      ...f.requests[0].request,
      homeId: 'home-0',
      displayName: 'Fen',
    });
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
    trap.release(false);
    rect.mockRestore();
  });
  it('immediately invalidates results on edit and ignores out-of-order replies with the same normalized name', async () => {
    const f = friendFixture();
    f.edit('Fen');
    f.find();
    f.edit('  Fen  ');
    expect(f.root.textContent).toContain("Find this character's home before entering.");
    expect(f.control('gate-enter')).toBeNull();
    f.find();
    await f.settle(0, 'Stale');
    expect(f.root.textContent).not.toContain('Home belonging to Stale');
    expect(f.root.getAttribute('aria-busy')).toBe('true');
    await f.settle(1);
    const staleEnter = f.control('gate-enter');
    f.edit('Other');
    staleEnter.click();
    expect(f.control('gate-enter')).toBeNull();
    expect(f.root.textContent).toContain("Find this character's home before entering.");
    expect(f.enter).not.toHaveBeenCalled();
  });
  it('retains the draft on failure, focuses retry, and ignores responses after close', async () => {
    const f = friendFixture();
    f.edit('Fen');
    f.find();
    f.requests[0].reject();
    await Promise.resolve();
    expect((f.control('gate-name') as HTMLInputElement).value).toBe('Fen');
    expect(f.control('gate-lookup').textContent).toBe('Try Again');
    expect(document.activeElement).toBe(f.control('gate-lookup'));
    expect(f.root.textContent).toContain('This is unavailable right now.');
    f.find();
    f.prompt.close();
    f.prompt.open();
    await f.settle(1);
    expect(f.control('gate-enter')).toBeNull();
    expect(f.enter).not.toHaveBeenCalled();
  });
  it('announces a result without stealing focus from another window and keeps production lookup disabled', async () => {
    const f = friendFixture();
    f.edit('<Fen>');
    f.find();
    f.opener.focus();
    await f.settle(0, '<Fen>');
    expect(document.activeElement).toBe(f.opener);
    expect(f.root.querySelector('fen')).toBeNull();
    expect(f.control('gate-result').textContent).toBe('Home belonging to <Fen>');
    const production = fixture();
    production.prompt.open();
    production.control('gate-visit').click();
    expect((production.control('gate-lookup') as HTMLButtonElement).disabled).toBe(true);
    expect(production.control('gate-enter')).toBeNull();
    expect(production.root.textContent).toContain('This is unavailable right now.');
  });
  it('keeps lookup Enter separate from visit entry and rechecks the physical gate before visiting', async () => {
    const f = friendFixture();
    f.edit('Fen');
    f.control('gate-name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(f.lookup).toHaveBeenCalledTimes(1);
    expect(f.enter).not.toHaveBeenCalled();
    await f.settle(0);
    f.world.player.pos.x = 100;
    f.control('gate-enter').click();
    expect(f.enter).not.toHaveBeenCalled();
    expect(f.world.freeholdEnter).not.toHaveBeenCalled();
  });
  it('preserves the live status when IME editing retires a focused friend result', async () => {
    const f = friendFixture();
    f.edit('Fen');
    f.find();
    await f.settle(0);
    const status = f.control('gate-result');
    const name = f.control('gate-name') as HTMLInputElement;
    name.focus();
    name.value = '芬';
    name.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    expect(f.root.querySelector('[role="status"]')).toBe(status);
    expect(status.textContent).toBe("Find this character's home before entering.");
    expect(status.hasAttribute('tabindex')).toBe(false);
    expect(f.control('gate-result')).toBeNull();
    expect(f.control('gate-enter')).toBeNull();
    expect(document.activeElement).toBe(name);
    expect(f.enter).not.toHaveBeenCalled();
  });
  it('keeps a completed friend result separate from the selected own-home entry', async () => {
    const f = friendFixture();
    f.edit('Fen');
    f.find();
    f.control('gate-own').focus();
    f.control('gate-own').click();
    await f.settle(0);
    expect(document.activeElement).toBe(f.control('gate-own'));
    expect(f.control('gate-result')).toBeNull();
    f.control('gate-enter').click();
    expect(f.world.freeholdEnter).toHaveBeenCalledTimes(1);
    expect(f.enter).not.toHaveBeenCalled();
  });
});
