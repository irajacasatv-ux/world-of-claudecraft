// Functional home tour: movement intent, nearby interaction, prompt and chat only.
import { dismissEntryOverlays } from './enter_offline_game.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const GPU_CHECKS = ['live-program', 'attach-watchdog', 'gate-timeout'];
const ENTER = '#freehold-gate-window [data-focus-key="gate-enter"]';

async function playerPose(page) {
  return page.evaluate(() => {
    const sim = window.__game.sim;
    const p = sim.player;
    return {
      x: p.pos.x,
      y: p.pos.y,
      z: p.pos.z,
      facing: p.facing,
      dead: p.dead,
      tick: sim.tickCount,
    };
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

/** Keyboard turns are observed through the world, never written through its debug handle. */
async function turnFreeholdRoute(page, difference) {
  const key = difference > 0 ? 'a' : 'd';
  await page.keyboard.down(key);
  try {
    await sleep(Math.min(120, Math.max(35, Math.abs(difference) * 250)));
  } finally {
    await page.keyboard.up(key);
  }
}

function headingDifference(target, facing) {
  return Math.atan2(Math.sin(target - facing), Math.cos(target - facing));
}

/** How close a route walk stops to its target, in yards. */
export const FREEHOLD_ROUTE_TOLERANCE = 0.7;

/** Walk through browser key events. Position and facing are observation-only. */
export async function walkFreeholdRouteTo(
  page,
  x,
  z,
  { tolerance = FREEHOLD_ROUTE_TOLERANCE, timeoutMs = 45000 } = {},
) {
  await waitForFreeholdMovementReady(page);
  const started = Date.now();
  let previous = await playerPose(page);
  let stalled = 0;
  let walking = false;
  try {
    while (Date.now() - started < timeoutMs) {
      const pose = await playerPose(page);
      if (pose.dead) throw new Error('Freehold tour player died during movement');
      const distance = Math.hypot(x - pose.x, z - pose.z);
      if (distance <= tolerance) return pose;
      if (walking && Math.hypot(pose.x - previous.x, pose.z - previous.z) < 0.03)
        stalled += Math.max(0, pose.tick - previous.tick);
      else stalled = 0;
      if (stalled > 60)
        throw new Error(`Freehold tour movement blocked at ${JSON.stringify(pose)}`);
      previous = pose;
      const difference = headingDifference(Math.atan2(x - pose.x, z - pose.z), pose.facing);
      if (Math.abs(difference) > 0.12) {
        await page.keyboard.up('w');
        walking = false;
        await turnFreeholdRoute(page, difference);
      } else {
        if (!walking) await page.keyboard.down('w');
        walking = true;
        await sleep(Math.min(120, Math.max(30, distance * 80)));
      }
    }
    throw new Error(`Freehold tour movement timed out toward ${x},${z}`);
  } finally {
    await page.keyboard.up('w');
    await page.keyboard.up('a');
    await page.keyboard.up('d');
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

/** Where the tour stands to press the gate, relative to its site: a yard short
 * of it along z and 4 yd off its axis toward -x (4.12 yd away, inside the 5 yd
 * reach), squared to face -z, so with the camera behind the player the arch
 * reads face-on right of centre, clear of the compact prompt's top-left anchor. */
export const FREEHOLD_GATE_STANCE = Object.freeze({ dx: -4, dz: 1 });

/** From the town landing to the gate stance: along the east road on legs that
 * stay 1.2 yd clear of every collider on the test seeds (a straight cut from
 * (0,-88) grazed the civic benches and only finished by sliding), then along z.
 * The arch opens along z (facing 0), so the last leg faces it square. Shared by
 * the capture's baseline arm, whose release has no gate entity. */
export async function approachFreeholdGateSite(page, site) {
  const x = site.x + FREEHOLD_GATE_STANCE.dx;
  await walkFreeholdRouteTo(page, 0, -88);
  await walkFreeholdRouteTo(page, -19, -97);
  await walkFreeholdRouteTo(page, -30, -100);
  await walkFreeholdRouteTo(page, x, site.z + 6);
  const pose = await walkFreeholdRouteTo(page, x, site.z + FREEHOLD_GATE_STANCE.dz);
  // Square up on -z (heading PI) so every viewport's camera settles alike.
  const started = Date.now();
  while (true) {
    const difference = headingDifference(Math.PI, (await playerPose(page)).facing);
    if (Math.abs(difference) <= 0.12) break;
    if (Date.now() - started > 10000) throw new Error('Freehold tour could not face the gate');
    await turnFreeholdRoute(page, difference);
  }
  return pose;
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
  await approachFreeholdGateSite(page, gate);
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
  await waitForFreeholdMovementReady(page);
  const started = Date.now();
  try {
    while (true) {
      const pose = await playerPose(page);
      const difference = headingDifference(Math.PI, pose.facing);
      if (Math.abs(difference) <= 0.12) break;
      if (Date.now() - started > 10000) throw new Error('Freehold tour could not face the exit');
      await turnFreeholdRoute(page, difference);
    }
    await page.keyboard.down('w');
    await page.waitForFunction(() => window.__game.sim.player.pos.x < 10000, { timeout: 10000 });
  } finally {
    await page.keyboard.up('w');
    await page.keyboard.up('a');
    await page.keyboard.up('d');
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
      graphicsPreset: JSON.parse(localStorage.getItem('woc_settings') ?? '{}').graphicsPreset,
      rendererTier: stats.tier,
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

/** Validate raw entry-to-sample evidence before accepting any stored derived values. */
export function freeholdInteriorPerfFailures(samples) {
  const failures = [];
  const counter = (value) => Number.isSafeInteger(value) && value >= 0;
  const finiteRoom = (room) => room && Number.isFinite(room.x) && Number.isFinite(room.z);
  for (const label of ['freehold-inn-room', 'freehold-cottage']) {
    const found = samples.find((sample) => sample.label === label);
    if (!found) {
      failures.push(`Missing accepted interior sample: ${label}`);
      continue;
    }
    const begin = found.sampleEvidence?.begin;
    const end = found.sampleEvidence?.end;
    const arrival = found.arrival;
    if (
      !begin ||
      !end ||
      !begin.instrumentationActive ||
      !end.instrumentationActive ||
      !counter(begin.frames) ||
      !counter(end.frames) ||
      end.frames <= begin.frames ||
      !counter(begin.calls) ||
      begin.calls <= 0 ||
      !counter(end.calls) ||
      end.calls <= 0 ||
      !Number.isFinite(arrival?.entryAtMs) ||
      arrival.entryAtMs < 0 ||
      !Number.isFinite(begin.atMs) ||
      !Number.isFinite(end.atMs) ||
      begin.atMs < arrival.entryAtMs ||
      end.atMs <= begin.atMs ||
      !finiteRoom(begin.room) ||
      !finiteRoom(end.room) ||
      begin.room.x !== end.room.x ||
      begin.room.z !== end.room.z
    )
      failures.push(`${label}: missing rendered room progress`);
    if (
      begin?.graphicsPreset !== 1 ||
      end?.graphicsPreset !== 1 ||
      begin?.rendererTier !== 'low' ||
      end?.rendererTier !== 'low'
    )
      failures.push(`${label}: effective graphics preset and renderer tier must remain low`);
    for (const kind of GPU_CHECKS) {
      const before = arrival?.gpuBefore?.[kind];
      const first = begin?.gpuCounts?.[kind];
      const last = end?.gpuCounts?.[kind];
      const after = arrival?.gpuAfter?.[kind];
      const storedDelta = arrival?.gpuDelta?.[kind];
      if (![before, first, last, after, storedDelta].every(counter)) {
        failures.push(`${label}: missing finite ${kind} sample counters`);
        continue;
      }
      if (first < before || last < first)
        failures.push(`${label}: ${kind} counters decreased after entry`);
      const delta = last - before;
      if (after !== last || storedDelta !== delta)
        failures.push(`${label}: inconsistent stored ${kind} counters`);
      if (delta !== 0) failures.push(`${label}: ${kind} delta ${delta}, expected zero`);
    }
  }
  return failures;
}
