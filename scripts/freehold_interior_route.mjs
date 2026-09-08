// Functional home tour: movement intent, nearby interaction, prompt and chat only.
import { dismissEntryOverlays } from './enter_offline_game.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const GPU_CHECKS = ['live-program', 'attach-watchdog', 'gate-timeout'];
const ENTER = '#freehold-gate-window [data-focus-key="gate-enter"]';

async function playerPose(page) {
  return page.evaluate(() => {
    const sim = window.__game.sim;
    const p = sim.player;
    return { x: p.pos.x, y: p.pos.y, z: p.pos.z, dead: p.dead, tick: sim.tickCount };
  });
}

async function waitForFreeholdMovementReady(page) {
  await page.waitForFunction(
    () => {
      const loading = document.querySelector('#loading-screen');
      return !loading?.classList.contains('visible');
    },
    { timeout: 60000 },
  );
  const before = await playerPose(page);
  await page.waitForFunction(
    (tick) => window.__game.sim.tickCount >= tick + 2,
    { timeout: 30000 },
    before.tick,
  );
}

/** Walk via the real input path. Position is observed, never assigned. */
export async function walkFreeholdRouteTo(page, x, z, { tolerance = 0.7, timeoutMs = 45000 } = {}) {
  await waitForFreeholdMovementReady(page);
  const started = Date.now();
  let previous = await playerPose(page);
  let stalled = 0;
  try {
    while (Date.now() - started < timeoutMs) {
      const pose = await playerPose(page);
      if (pose.dead) throw new Error('Freehold tour player died during movement');
      const distance = Math.hypot(x - pose.x, z - pose.z);
      if (distance <= tolerance) return pose;
      if (Math.hypot(pose.x - previous.x, pose.z - previous.z) < 0.03)
        stalled += Math.max(0, pose.tick - previous.tick);
      else stalled = 0;
      if (stalled > 60)
        throw new Error(`Freehold tour movement blocked at ${JSON.stringify(pose)}`);
      previous = pose;
      await page.evaluate(
        ({ x, z }) => {
          const g = window.__game;
          const p = g.sim.player;
          g.input.setTouchLook(true);
          g.input.camYaw = Math.atan2(x - p.pos.x, z - p.pos.z);
          g.input.setTouchMove({
            forward: true,
            back: false,
            strafeLeft: false,
            strafeRight: false,
          });
        },
        { x, z },
      );
      await sleep(Math.min(120, Math.max(30, distance * 80)));
    }
    throw new Error(`Freehold tour movement timed out toward ${x},${z}`);
  } finally {
    await page.evaluate(() => {
      window.__game.input.clearTouchMove();
      window.__game.input.setTouchLook(false);
    });
  }
}

/** Fresh offline characters leave the tutorial by ringing its actual pier bell. */
export async function sailToFreeholdTown(page) {
  const pose = await playerPose(page);
  if (!(pose.x >= -540 && pose.x < -180 && pose.z >= -180 && pose.z < 180)) return;
  const bell = await page.evaluate(() => {
    const g = window.__game;
    const p = g.sim.player;
    return (
      [...g.sim.entities.values()]
        .filter(
          (e) =>
            e.objectItemId === 'ps_ferry_bell' &&
            Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 100,
        )
        .map((e) => ({ x: e.pos.x, z: e.pos.z }))
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z),
        )[0] ?? null
    );
  });
  if (!bell) throw new Error('Freehold tour could not find the tutorial pier bell');
  // Approach the pier bell along its open east side, clear of the arrival props.
  await walkFreeholdRouteTo(page, bell.x + 4, bell.z - 8);
  await walkFreeholdRouteTo(page, bell.x + 4, bell.z - 1);
  await walkFreeholdRouteTo(page, bell.x + 2, bell.z);
  await page.keyboard.press('f');
  await page.waitForFunction(
    () => {
      const p = window.__game.sim.player;
      return Math.abs(p.pos.x + 4.5) < 5 && Math.abs(p.pos.z + 101.5) < 5;
    },
    { timeout: 30000 },
  );
  await dismissEntryOverlays(page);
}

export async function walkToFreeholdGate(page) {
  await sailToFreeholdTown(page);
  const gate = await page.evaluate(() => {
    for (const e of window.__game.sim.entities.values()) {
      if (e.templateId === 'freehold_gate') return { x: e.pos.x, z: e.pos.z };
    }
    return null;
  });
  if (!gate) throw new Error('Freehold tour requires an enabled gate at boot');
  await walkFreeholdRouteTo(page, 0, -88);
  await walkFreeholdRouteTo(page, gate.x, gate.z + 1);
  await page.keyboard.press('f');
  await page.waitForSelector(ENTER, { visible: true, timeout: 10000 });
  return gate;
}

export async function confirmFreeholdGate(page) {
  await page.waitForFunction(
    (selector) => {
      const button = document.querySelector(selector);
      if (!button || button.disabled) return false;
      const rect = button.getBoundingClientRect();
      const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return rect.width > 0 && rect.height > 0 && target && button.contains(target);
    },
    { timeout: 10000 },
    ENTER,
  );
  const entry = await page.evaluate(() => ({
    atMs: performance.now(),
    counts: { ...window.__game.renderer.perfStats().gpuPrep.events.counts },
  }));
  const gpuBefore = entry.counts;
  const before = await playerPose(page);
  await page.click(ENTER);
  await page.waitForFunction(
    (before) => {
      const p = window.__game.sim.player;
      return Math.abs(p.pos.x - before.x) > 1000 && !p.dead;
    },
    { timeout: 30000 },
    before,
  );
  await page.waitForFunction(
    () => {
      const g = window.__game;
      const p = g.sim.player;
      return g.renderer.scene.children.some(
        (root) =>
          root.userData.renderCategory === 'dungeon' &&
          root.visible &&
          Math.abs(root.position.x - p.pos.x) < 30 &&
          Math.abs(root.position.z - p.pos.z) < 30 &&
          root.children.some((child) => child.name === 'freehold-hearth'),
      );
    },
    { timeout: 60000 },
  );
  await sleep(1200);
  const gpuAfter = await page.evaluate(() => ({
    ...window.__game.renderer.perfStats().gpuPrep.events.counts,
  }));
  const gpuDelta = Object.fromEntries(
    GPU_CHECKS.map((kind) => [kind, gpuAfter[kind] - gpuBefore[kind]]),
  );
  return { ...(await playerPose(page)), entryAtMs: entry.atMs, gpuBefore, gpuAfter, gpuDelta };
}

export async function leaveFreeholdThroughExit(page) {
  await page.evaluate(() => {
    const g = window.__game;
    g.input.setTouchLook(true);
    g.input.camYaw = Math.PI;
    g.input.setTouchMove({ forward: true, back: false, strafeLeft: false, strafeRight: false });
  });
  try {
    await page.waitForFunction(() => window.__game.sim.player.pos.x < 10000, { timeout: 10000 });
  } finally {
    await page.evaluate(() => {
      window.__game.input.clearTouchMove();
      window.__game.input.setTouchLook(false);
    });
  }
}

/** The chat form runs the existing loopback-authorized dev bridge. */
export async function changeFreeholdToCottage(page) {
  const mobile = await page.evaluate(() => document.body.classList.contains('mobile-touch'));
  if (mobile) {
    await page.tap('#mobile-menu-anchor');
    await page.waitForSelector('#mobile-menu-chat', { visible: true });
    await page.tap('#mobile-menu-chat');
  } else await page.keyboard.press('Enter');
  await page.waitForSelector('#chat-input', { visible: true });
  await page.type('#chat-input', '/dev freehold cottage');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#chat-input', { hidden: true });
  if (
    mobile &&
    (await page.evaluate(() =>
      document.getElementById('mobile-menu-strip')?.classList.contains('open'),
    ))
  ) {
    await page.tap('#mobile-menu-cancel');
    await page.waitForFunction(
      () => !document.getElementById('mobile-menu-strip')?.classList.contains('open'),
    );
  }
  await sleep(700);
}

async function freeholdSampleBoundary(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const p = g.sim.player;
    const stats = g.renderer.perfStats();
    const report = g.perf.report();
    const room = g.renderer.scene.children.find(
      (root) =>
        root.userData.renderCategory === 'dungeon' &&
        root.visible &&
        Math.abs(root.position.x - p.pos.x) < 30 &&
        Math.abs(root.position.z - p.pos.z) < 30 &&
        root.children.some((child) => child.name === 'freehold-hearth'),
    );
    return {
      atMs: performance.now(),
      frames: report.frames,
      instrumentationActive: Boolean(report.postRevealLinks),
      calls: stats.calls,
      room: room ? { x: room.position.x, z: room.position.z } : null,
      gpuCounts: { ...stats.gpuPrep.events.counts },
    };
  });
}

/** Close evidence only after settled room frames and the full sampling callback. */
export async function sampleFreeholdInterior(page, label, arrival, sample) {
  const begin = await freeholdSampleBoundary(page);
  await sleep(1200);
  const result = await sample(page, label);
  const end = await freeholdSampleBoundary(page);
  const gpuAfter = end.gpuCounts;
  const gpuDelta = Object.fromEntries(
    GPU_CHECKS.map((kind) => [kind, gpuAfter[kind] - arrival.gpuBefore[kind]]),
  );
  return { ...result, sampleEvidence: { begin, end }, arrival: { ...arrival, gpuAfter, gpuDelta } };
}

/** Callbacks let each screenshot target capture exactly one functional moment. */
export async function runFreeholdInteriorRoute(page, hooks = {}) {
  const samples = [];
  await walkToFreeholdGate(page);
  await hooks.onGatePrompt?.(page);
  const inn = await confirmFreeholdGate(page);
  await sleep(1200);
  if (hooks.sample)
    samples.push(await sampleFreeholdInterior(page, 'freehold-inn-room', inn, hooks.sample));
  await hooks.afterInn?.(page, inn);
  await changeFreeholdToCottage(page);
  await leaveFreeholdThroughExit(page);
  await page.keyboard.press('f');
  await page.waitForSelector(ENTER, { visible: true, timeout: 10000 });
  const cottage = await confirmFreeholdGate(page);
  if (Math.abs(cottage.x - inn.x) < 200)
    throw new Error('Freehold tour did not enter the Cottage band');
  await sleep(1200);
  if (hooks.sample)
    samples.push(await sampleFreeholdInterior(page, 'freehold-cottage', cottage, hooks.sample));
  await hooks.afterCottage?.(page, cottage);
  return samples;
}

/** Missing counters cannot count as a clean reveal. Lifetime counts survive ring eviction. */
export function freeholdInteriorPerfFailures(samples) {
  const failures = [];
  for (const label of ['freehold-inn-room', 'freehold-cottage']) {
    const found = samples.find((sample) => sample.label === label);
    if (!found) {
      failures.push(`Missing accepted interior sample: ${label}`);
      continue;
    }
    const begin = found.sampleEvidence?.begin;
    const end = found.sampleEvidence?.end;
    if (
      !begin ||
      !end ||
      !begin.instrumentationActive ||
      !end.instrumentationActive ||
      !Number.isFinite(begin.frames) ||
      !Number.isFinite(end.frames) ||
      end.frames <= begin.frames ||
      !Number.isFinite(end.calls) ||
      end.calls <= 0 ||
      !Number.isFinite(begin.atMs) ||
      !Number.isFinite(end.atMs) ||
      end.atMs <= begin.atMs ||
      !begin.room ||
      !end.room ||
      begin.room.x !== end.room.x ||
      begin.room.z !== end.room.z
    )
      failures.push(`${label}: missing rendered room progress`);
    for (const kind of GPU_CHECKS) {
      const value = found.arrival?.gpuDelta?.[kind];
      if (!Number.isFinite(begin?.gpuCounts?.[kind]) || !Number.isFinite(end?.gpuCounts?.[kind]))
        failures.push(`${label}: missing finite ${kind} sample counters`);
      if (value !== 0) failures.push(`${label}: ${kind} delta ${value}, expected zero`);
    }
  }
  return failures;
}
