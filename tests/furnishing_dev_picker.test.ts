// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../src/sim/data';
import type { ItemDef } from '../src/sim/types';
import { DevCommandWindow } from '../src/ui/dev_command_window';
import { setLanguage } from '../src/ui/i18n';
import { FURNISHING } from './fixtures/furnishing_item';

const base = {
  id: 'probe_furnishing_dev_base',
  name: 'Picker Control Armor',
  kind: 'armor',
  slot: 'chest',
  armorType: 'mail',
  quality: 'rare',
  sellValue: 0,
} satisfies ItemDef;
const heroic = {
  ...base,
  id: 'probe_furnishing_dev_heroic',
  quality: 'epic',
  heroicOf: base.id,
} satisfies ItemDef;
const furniture = {
  ...FURNISHING,
  id: 'probe_furnishing_dev_picker',
  name: 'Picker Test Furnishing',
  slot: 'chest',
  heroicOf: base.id,
} as unknown as ItemDef;
const fixtures = [base, heroic, furniture];

beforeEach(() => {
  for (const item of fixtures) ITEMS[item.id] = item;
  setLanguage('en');
  document.body.innerHTML = '<main id="ui"></main>';
});

afterEach(() => {
  for (const item of fixtures) delete ITEMS[item.id];
  document.body.innerHTML = '';
});

describe('furnishing developer item picker', () => {
  it('keeps furnishing identity and exact-ID selection without gear tags, while heroic armor retains them', () => {
    const before = structuredClone(furniture);
    const chat = vi.fn();
    const window = new DevCommandWindow({
      available: () => true,
      world: () => ({ chat, accountAdmin: true }) as never,
      closeOthers: vi.fn(),
      captureFocus: () => null,
      restoreFocus: vi.fn(),
    });
    expect(window.toggle()).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-dev-category="inventory"]')?.click();
    const input = document.querySelector<HTMLInputElement>('[data-dev-item-search]');
    if (!input) throw new Error('Missing developer item search');
    const search = (id: string): HTMLElement => {
      input.value = id;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const rows = [...document.querySelectorAll<HTMLElement>('.dev-item-opt')];
      expect(rows).toHaveLength(1);
      return rows[0];
    };
    const row = search(furniture.id);
    expect(row.querySelector('.dev-item-name')?.textContent).toBe('Picker Test Furnishing');
    expect(row.querySelector('.dev-item-name')?.classList.contains('qt-rare')).toBe(true);
    expect(row.querySelectorAll('.dev-item-tag')).toHaveLength(0);
    expect(row.querySelector('.dev-item-id')?.textContent).toBe(furniture.id);

    const control = search(heroic.id);
    expect(control.querySelector('.dev-item-name')?.textContent).toBe('Picker Control Armor');
    expect(control.querySelector('.dev-item-name')?.classList.contains('qt-epic')).toBe(true);
    expect([...control.querySelectorAll('.dev-item-tag')].map((tag) => tag.textContent)).toEqual([
      'Heroic',
      'chest',
    ]);

    search(furniture.id).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(input.value).toBe('probe_furnishing_dev_picker');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    document.querySelector<HTMLButtonElement>('[data-dev-run="give"]')?.click();
    expect(chat).toHaveBeenCalledExactlyOnceWith('/dev give probe_furnishing_dev_picker 1');
    expect(ITEMS[furniture.id]).toEqual(before);
  });
});
