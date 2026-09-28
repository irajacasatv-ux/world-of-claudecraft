// Real painter, shipped CSS, and account fixtures for the new cosmetics dialog.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { MOUNT_SKIN_IDS } from '../../src/sim/content/mount_skins';
import { CosmeticsWindow } from '../../src/ui/hud/cosmetics/cosmetics_window';
import { axeSeriousViolations, cleanup, formatViolations, host, stubDeps } from './_harness';

afterEach(() => {
  cleanup();
  document.body.classList.remove('mobile-touch');
});
function mountWindow() {
  const root = host('cosmetics-window');
  root.style.display = '';
  const world = {
    player: {
      templateId: 'warrior',
      mainhandItemId: 'worn_sword',
      skinCatalog: 'class',
      skin: 0,
      mountSkinId: null as string | null,
      buddyKey: '',
    },
    ownedMounts: () => ['valorsteed'],
    ownedBuddies: () => ['horse'],
    pendingBuddies: () => [],
    summonBuddy: vi.fn((key: string) => {
      world.player.buddyKey = world.player.buddyKey === key ? '' : key;
    }),
    accountCosmetics: {
      completedQuestIds: [],
      mountSkinIds: [...MOUNT_SKIN_IDS],
      weaponSkinIds: ['ice_fang_sword'],
      weaponSkinLoadout: {},
      mechChromaIds: ['amber_crimson'],
    },
    changeMountSkin: vi.fn((id: string | null) => {
      world.player.mountSkinId = id;
    }),
  };
  const win = new CosmeticsWindow(
    stubDeps({ root: () => root, world: () => world as never, captureFocus: () => null }),
  );
  win.open();
  return { root, world, win };
}
describe('cosmetics accessibility and interaction', () => {
  it('keeps all four tabs and buddy summon controls reachable without dragging on narrow portrait', async () => {
    await page.viewport(320, 640);
    document.body.classList.add('mobile-touch');
    const { root, world, win } = mountWindow();
    win.open('buddies');
    const tabs = root.querySelectorAll<HTMLElement>('.cos-tab');
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      const bounds = tab.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(320);
      expect(bounds.height).toBeGreaterThanOrEqual(40);
    }
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    expect(root.querySelector('[data-buddy-drag], [draggable="true"]')).toBeNull();
    expect(root.querySelectorAll('.cos-scope-account')).toHaveLength(3);
    expect(root.querySelector('.cos-scope-character')).toBeNull();
    expect(root.textContent).not.toContain('Drag to action bar');
    const control = () =>
      root.querySelector<HTMLButtonElement>('[data-act="summon-buddy"][data-id="horse"]')!;
    expect(control().getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
    expect(control().getBoundingClientRect().width).toBeGreaterThanOrEqual(40);
    control().click();
    expect(world.player.buddyKey).toBe('horse');
    expect(control().textContent).toBe('Dismiss');
    control().click();
    expect(world.player.buddyKey).toBe('');
    expect(control().textContent).toBe('Summon');
  });
  it.each(['mounts', 'skins', 'mech', 'buddies'] as const)(
    '%s has a named dialog and no serious WCAG violations',
    async (tab) => {
      await page.viewport(1280, 900);
      const { root, win } = mountWindow();
      win.open(tab);
      expect(root.getAttribute('aria-label')).toBe('Cosmetics');
      expect(root.querySelectorAll('.cos-card').length).toBeGreaterThan(0);
      const violations = await axeSeriousViolations(root);
      expect(violations, formatViolations(violations)).toEqual([]);
    },
  );
  it('keeps keyboard focus on Wear/Take off through actions and a live refresh', async () => {
    await page.viewport(1280, 900);
    const { root, world, win } = mountWindow();
    const control = () =>
      root.querySelector<HTMLButtonElement>('.cos-action[data-id="mech_bird"]')!;
    control().focus();
    await userEvent.keyboard('{Enter}');
    expect(world.player.mountSkinId).toBe('mech_bird');
    expect(document.activeElement).toBe(control());
    expect(control().dataset.act).toBe('takeoff-mount');
    await page.screenshot({
      path: '../../docs/screenshots/cosmetics-window/review-keyboard-focus.png',
    });
    world.accountCosmetics.mountSkinIds = ['mech_bird'];
    win.refreshIfChanged();
    expect(document.activeElement).toBe(control());
    await userEvent.keyboard(' ');
    expect(world.player.mountSkinId).toBeNull();
    expect(document.activeElement).toBe(control());
    expect(control().dataset.act).toBe('wear-mount');
  });
  it('makes every mount skin reachable with Wear and Take off on short mobile landscape', async () => {
    await page.viewport(844, 390);
    document.body.classList.add('mobile-touch');
    const { root, world } = mountWindow();
    const bounds = root.getBoundingClientRect();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(844);
    expect(bounds.bottom).toBeLessThanOrEqual(390);
    for (const tab of root.querySelectorAll<HTMLElement>('.cos-tab')) {
      expect(tab.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
      expect(tab.getBoundingClientRect().width).toBeGreaterThanOrEqual(40);
    }
    await page.screenshot({
      path: '../../docs/screenshots/cosmetics-window/review-mobile-tabs.png',
    });
    for (const id of MOUNT_SKIN_IDS) {
      const button = root.querySelector<HTMLButtonElement>(
        `[data-act="wear-mount"][data-id="${id}"]`,
      )!;
      button.scrollIntoView({ block: 'center' });
      expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
      button.click();
      expect(world.player.mountSkinId).toBe(id);
      root.querySelector<HTMLButtonElement>('[data-act="takeoff-mount"]')!.click();
      expect(world.player.mountSkinId).toBeNull();
    }
    // One wear plus one take-off per live skin.
    expect(world.changeMountSkin).toHaveBeenCalledTimes(MOUNT_SKIN_IDS.length * 2);
  });
});
