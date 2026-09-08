// Supplemental real offline UI evidence. Keep the canonical interior registry unchanged.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './browser_path.mjs';
import { enterOfflineGame } from './enter_offline_game.mjs';
import {
  confirmFreeholdGate,
  leaveFreeholdThroughExit,
  walkFreeholdRouteTo,
  walkToFreeholdGate,
} from './freehold_interior_route.mjs';
import { settleFreeholdCaptureNotices } from './lib/freehold_capture_notices.mjs';
import { assertLoopbackUrl } from './lib/loopback_guard.mjs';

const gameUrl = assertLoopbackUrl(process.env.GAME_URL ?? 'http://localhost:5173', 'GAME_URL').href;
const output = process.env.KEY_SHOTS_DIR ?? 'docs/screenshots/freeholds-06-key';
const keyRow = '#bags .bag-item[data-coach-item="hearth_key"]';
const bankKey = '#bank-window .bank-item[aria-label*="Hearth Key"]';
const desktopSlot = '#actionbar .action-btn[data-hotbar-slot="4"]';
const touchSlot = '#mobile-action-ring .mobile-action-slot[data-mobile-index="3"]';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const variants = [
  { key: 'desktop', width: 1600, height: 900, mobile: false },
  { key: 'compact', width: 874, height: 402, mobile: true },
];
const report = { kind: 'real-offline-hearth-key-ui', gameUrl, variants: [], sources: {} };
for (const file of [
  'scripts/freehold_key_capture.mjs',
  'scripts/freehold_interior_route.mjs',
  'src/ui/hud/action_bar/action_bar_controller.ts',
  'src/ui/hud/housing/hearth_key_tooltip.ts',
  'src/sim/freehold/hearth_key.ts',
  'public/ui/items/hearth_key.webp',
]) {
  report.sources[file] = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
fs.mkdirSync(output, { recursive: true });
const saveReport = () =>
  fs.writeFileSync(path.join(output, 'evidence.json'), `${JSON.stringify(report, null, 2)}\n`);

async function observe(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const sim = g.sim;
    const count = (slots) =>
      slots.reduce((n, slot) => n + (slot.itemId === 'hearth_key' ? slot.count : 0), 0);
    return {
      pos: { ...sim.player.pos },
      entrySeq: sim.player.dungeonEntrySeq ?? 0,
      keyCount: count(sim.inventory),
      bankKeyCount: sim.bankInfo ? count(sim.bankInfo.slots) : null,
      keyDeadlines: [...sim.freeholdKeyReadyAtMs.entries()],
      action: g.hud.hotbarActions[3],
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      mobileTouch: document.body.classList.contains('mobile-touch'),
      settings: JSON.parse(localStorage.getItem('woc_settings') ?? '{}'),
      theme: JSON.parse(localStorage.getItem('woc_theme') ?? '{}'),
      rendererTier: g.renderer.perfStats().tier,
      gpuNoticeVisible: ['gpu-notice', 'perf-nudge'].some((id) => {
        const notice = document.getElementById(id);
        return notice && !notice.hidden && getComputedStyle(notice).display !== 'none';
      }),
    };
  });
}

async function center(page, selector) {
  const element = await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  const box = await element.boundingBox();
  assert(box, `No visible bounds for ${selector}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function tapSettled(page, selector) {
  // The bank opens Bags before the compact split-panel layout has settled.
  // Wait for a stable, unobscured hit target before sending a real touch tap.
  let previous;
  let stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    const at = await center(page, selector);
    const ready = await page.$eval(
      selector,
      (element, point) => {
        const hit = document.elementFromPoint(point.x, point.y);
        return hit === element || element.contains(hit);
      },
      at,
    );
    stable =
      ready && previous && Math.hypot(at.x - previous.x, at.y - previous.y) < 0.5 ? stable + 1 : 0;
    if (stable >= 4) {
      await page.touchscreen.tap(at.x, at.y);
      return { ...at, unobscured: true };
    }
    previous = at;
    await sleep(75);
  }
  throw new Error(`Touch target did not settle: ${selector}`);
}

async function tooltip(page, selector, mobile) {
  // Inventory authority can change before its event-driven bank paint completes.
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  // Compact presentation only: non-modal Bags reserves Tab for target cycling,
  // ignores hover, and its touch hold arms drag before the tooltip timer.
  // DOM focus invokes the shipping tooltip handler without activating the item.
  if (mobile) await page.focus(selector);
  else await page.hover(selector);
  await page.waitForFunction(() => {
    const tip = document.getElementById('tooltip');
    return (
      tip && getComputedStyle(tip).display !== 'none' && tip.textContent.includes('Hearth Key')
    );
  });
  return page.$eval('#tooltip', (element) => ({
    text: element.textContent,
    bounds: (() => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })(),
  }));
}

async function shot(page, variant, evidence, name, extra = {}) {
  const file = `${variant.key}-${name}.png`;
  await page.waitForFunction(
    () =>
      ['banner', 'subzone-banner'].every((id) => {
        const element = document.getElementById(id);
        if (!element) return true;
        const style = getComputedStyle(element);
        return style.display === 'none' || Number(style.opacity) === 0;
      }),
    { timeout: 15000 },
  );
  const state = await observe(page);
  assert.equal(state.viewport.width, variant.width);
  assert.equal(state.viewport.height, variant.height);
  assert.equal(state.settings.graphicsPreset, 1);
  assert.equal(state.settings.graphicsDefaultApplied, true);
  assert.equal(state.rendererTier, 'low');
  assert.equal(state.theme.preset, 'classic');
  assert.equal(state.gpuNoticeVisible, false, 'GPU notice obscures the screenshot');
  await page.screenshot({ path: path.join(output, file), fullPage: false });
  const sha256 = createHash('sha256')
    .update(fs.readFileSync(path.join(output, file)))
    .digest('hex');
  evidence.shots.push({ file, sha256, ...extra, state });
  saveReport();
}

async function openBags(page, mobile) {
  if (mobile) {
    await page.tap('#mobile-menu-anchor');
    await page.waitForSelector('#mobile-menu-bags', { visible: true });
    await page.tap('#mobile-menu-bags');
    if (
      await page.evaluate(() =>
        document.getElementById('mobile-menu-strip')?.classList.contains('open'),
      )
    ) {
      await page.tap('#mobile-menu-cancel');
    }
  } else await page.keyboard.press('b');
  await page.waitForSelector(keyRow, { visible: true });
}

async function placeKey(page, mobile) {
  const start = await center(page, keyRow);
  if (mobile) {
    const touch = await page.touchscreen.touchStart(start.x, start.y);
    try {
      await page.waitForFunction(() => document.body.classList.contains('touch-item-dragging'), {
        timeout: 3000,
      });
      const target = await center(page, touchSlot);
      await touch.move(target.x, target.y);
      await sleep(120);
    } finally {
      await touch.end();
    }
  } else {
    await page.setDragInterception(true);
    try {
      await page.mouse.dragAndDrop(start, await center(page, desktopSlot), { delay: 180 });
    } finally {
      await page.setDragInterception(false);
    }
  }
  await page.waitForFunction(() => {
    const action = window.__game.hud.hotbarActions[3];
    return action?.type === 'item' && action.id === 'hearth_key';
  });
}

async function captureBank(page, variant, evidence) {
  const banker = await page.evaluate(() => {
    const npc = [...window.__game.sim.entities.values()].find(
      (entity) => entity.templateId === 'bursar_fernando',
    );
    return npc ? { x: npc.pos.x, z: npc.pos.z } : null;
  });
  assert(banker, 'Real Eastbrook banker is missing');
  await walkFreeholdRouteTo(page, 0, -88);
  await walkFreeholdRouteTo(page, 0, banker.z);
  await walkFreeholdRouteTo(page, banker.x - 2, banker.z);
  await page.keyboard.press('f');
  await page.waitForSelector('#bank-window', { visible: true, timeout: 10000 });
  await page.waitForSelector(keyRow, { visible: true });
  if (variant.mobile) evidence.depositTap = await tapSettled(page, keyRow);
  else await page.click(keyRow);
  await page.waitForFunction(() => {
    const sim = window.__game.sim;
    return (
      !sim.inventory.some((slot) => slot.itemId === 'hearth_key') &&
      sim.bankInfo?.slots.some((slot) => slot.itemId === 'hearth_key' && slot.count === 1)
    );
  });
  const tip = await tooltip(page, bankKey, variant.mobile);
  await shot(page, variant, evidence, 'bank-key-tooltip', {
    tooltip: tip,
    input: variant.mobile
      ? 'touch deposit, automated DOM tooltip focus'
      : 'mouse deposit and hover',
  });
  if (variant.mobile) evidence.withdrawalTap = await tapSettled(page, bankKey);
  else await page.click(bankKey);
  await page.waitForFunction(() =>
    window.__game.sim.inventory.some((slot) => slot.itemId === 'hearth_key' && slot.count === 1),
  );
  evidence.bankWithdrawal = await observe(page);
  assert.equal(evidence.bankWithdrawal.bankKeyCount, 0);
  await page.keyboard.press('Escape');
  if (await page.$eval('#bags', (element) => getComputedStyle(element).display !== 'none')) {
    await page.keyboard.press('Escape');
  }
}

const browser = await puppeteer.launch({
  executablePath: BROWSER_PATH,
  headless: 'new',
  args: ['--window-size=1600,900', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  for (const variant of variants) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const evidence = { ...variant, shots: [], pageErrors: [], consoleErrors: [] };
    report.variants.push(evidence);
    page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') evidence.consoleErrors.push(message.text());
    });
    try {
      await page.setViewport({
        width: variant.width,
        height: variant.height,
        isMobile: variant.mobile,
        hasTouch: variant.mobile,
        deviceScaleFactor: variant.mobile ? 2 : 1,
      });
      if (variant.mobile)
        await page.setUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        );
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem(
          'woc_settings',
          JSON.stringify({ graphicsPreset: 1, graphicsDefaultApplied: true }),
        );
        localStorage.setItem('woc_theme', JSON.stringify({ preset: 'classic', custom: {} }));
      });
      await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 60000 });
      if (variant.mobile) await page.evaluate(() => document.body.classList.add('mobile-touch'));
      assert(
        await enterOfflineGame(page, {
          charClass: 'warrior',
          charName: 'Keyreview',
          selectorTimeoutMs: 60000,
          gameBootTimeoutMs: 60000,
        }),
        'Offline boot failed',
      );
      evidence.initial = await observe(page);
      assert.equal(evidence.initial.keyCount, 0, 'Fresh character already has a key');
      await walkToFreeholdGate(page);
      await confirmFreeholdGate(page);
      evidence.gateGrant = await observe(page);
      assert.equal(evidence.gateGrant.keyCount, 1);
      assert.equal(evidence.gateGrant.entrySeq, evidence.initial.entrySeq + 1);
      assert.deepEqual(evidence.gateGrant.keyDeadlines, []);
      await leaveFreeholdThroughExit(page);
      evidence.notices = await settleFreeholdCaptureNotices(page, variant.mobile);
      await openBags(page, variant.mobile);
      const tip = await tooltip(page, keyRow, variant.mobile);
      assert(tip.text.includes('Return to your home.'));
      await shot(page, variant, evidence, 'bags-key-tooltip', {
        tooltip: tip,
        input: variant.mobile
          ? 'touch open, automated DOM tooltip focus'
          : 'keyboard open, mouse hover',
      });
      const beforeDrag = await observe(page);
      await placeKey(page, variant.mobile);
      evidence.placement = await observe(page);
      assert.equal(evidence.placement.keyCount, 1);
      assert.equal(
        evidence.placement.entrySeq,
        beforeDrag.entrySeq,
        'Drag unexpectedly used the key',
      );
      assert.deepEqual(evidence.placement.keyDeadlines, []);
      await page.keyboard.press('Escape');
      await shot(page, variant, evidence, 'action-slot', {
        input: variant.mobile ? 'held touch drag to action ring' : 'native HTML drag to action bar',
      });
      await captureBank(page, variant, evidence);
      const beforeUse = await observe(page);
      assert(beforeUse.pos.x < 10000, 'Key use must start outside the home');
      if (variant.mobile) await page.tap(touchSlot);
      else await page.click(desktopSlot);
      await page.waitForFunction(
        (seq) =>
          window.__game.sim.player.dungeonEntrySeq === seq + 1 &&
          window.__game.sim.player.pos.x > 10000,
        { timeout: 30000 },
        beforeUse.entrySeq,
      );
      await page.waitForFunction(
        () => !document.querySelector('#loading-screen')?.classList.contains('visible'),
        { timeout: 60000 },
      );
      evidence.keyUse = await observe(page);
      assert.equal(evidence.keyUse.keyCount, 1, 'Permanent key was consumed');
      assert.equal(evidence.keyUse.keyDeadlines.length, 1);
      assert(evidence.keyUse.keyDeadlines[0][1] > 0);
      await shot(page, variant, evidence, 'key-use-home', {
        input: variant.mobile ? 'touch action-ring activation' : 'mouse action-bar activation',
      });
      assert.deepEqual(evidence.pageErrors, [], 'Browser page errors occurred');
      evidence.passed = true;
      console.log(
        `${variant.key}: gate grant, bag tooltip, native placement, bank round trip, key activation passed`,
      );
    } catch (error) {
      evidence.failure = error.stack ?? String(error);
      await page
        .screenshot({ path: path.join(output, `${variant.key}-failure.png`) })
        .catch(() => {});
      throw error;
    } finally {
      saveReport();
      await context.close();
    }
  }
} finally {
  await browser.close();
}
