import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  approachFreeholdGateSite,
  changeFreeholdToCottage,
  confirmFreeholdGate,
  leaveFreeholdThroughExit,
  sailToFreeholdTown,
  walkToFreeholdGate,
} from '../freehold_interior_route.mjs';
import {
  settleFreeholdCaptureNotices,
  settleFreeholdCaptureOverlays,
} from './freehold_capture_notices.mjs';

// The authored gate site as the measurements record states it.
const GATE_RECORD = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../docs/freeholds/art/space-measurements.json',
);

async function prepare(page, width, height, mobile) {
  await page.setViewport({
    width,
    height,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
  });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
  });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      'woc_settings',
      JSON.stringify({ graphicsPreset: 1, graphicsDefaultApplied: true }),
    );
    localStorage.setItem('woc_theme', JSON.stringify({ preset: 'classic', custom: {} }));
  });
}
const variants = [
  { key: 'desktop', width: 1600, height: 900, mobile: false },
  { key: 'compact', width: 874, height: 402, mobile: true },
  { key: 'tablet', width: 1180, height: 820, mobile: true },
].map((v) => ({
  ...v,
  viewport: { width: v.width, height: v.height },
  beforeLoad: (page) => prepare(page, v.width, v.height, v.mobile),
}));

export const freeholdReviewTargets = [
  { key: 'freehold-gate', scene: 'gate-own-prompt' },
  { key: 'freehold-inn', scene: 'inn-safe-landing' },
  { key: 'freehold-cottage', scene: 'cottage-safe-landing' },
].map(({ key, scene }) => ({
  key,
  label: `Freehold ${scene}`,
  scene,
  when: [
    'ui/hud/housing/',
    'freehold/',
    'render/freehold_',
    'game/nearby_interaction',
    'render/dungeon_interior_resolver_core.ts',
    'render/dungeon_variant_core.ts',
    'render/ground_object.ts',
  ],
  variants,
  async capture(page, variant) {
    if (process.env.PR_SHOTS_FREEHOLD_BASELINE === '1') {
      await sailToFreeholdTown(page);
      // The release baseline has neither gate nor room. Walk the after frame's
      // own approach to the gate site, read from the sealed measurements record
      // (pinned equal to EASTBROOK_LAYOUT; the receipt and the capture contract
      // hold both frames to it) and
      // stand where the after frame stands, so the missing prior surface is
      // explicit in the evidence record.
      const [x, z] = JSON.parse(fs.readFileSync(GATE_RECORD, 'utf8')).gate.position;
      await approachFreeholdGateSite(page, { x, z });
    } else {
      await walkToFreeholdGate(page);
      if (scene !== 'gate-own-prompt') {
        await confirmFreeholdGate(page);
        if (scene === 'cottage-safe-landing') {
          await changeFreeholdToCottage(page);
          await leaveFreeholdThroughExit(page);
          await page.keyboard.press('f');
          await page.waitForSelector('#freehold-gate-window [data-focus-key="gate-enter"]', {
            visible: true,
          });
          await confirmFreeholdGate(page);
        }
      }
    }
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
    const { noticeResolution, dismissedIds: dismissedNotices } = await settleFreeholdCaptureNotices(
      page,
      variant.mobile,
    );
    // The arrival overlays (tutorial card, ferry note) ride their own timers and
    // can land after the notices settle, so this runs last before the frame.
    const { dismissedOverlays, passes: overlaySettlePasses } =
      await settleFreeholdCaptureOverlays(page);
    const evidence = await page.evaluate(() => {
      const g = window.__game;
      const p = g.sim.player;
      const gl = g.renderer.webgl.getContext();
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const dialog = document.getElementById('freehold-gate-window');
      const shown = dialog && getComputedStyle(dialog).display !== 'none';
      return {
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        gpuRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
        gpuNoticeVisible: Boolean(
          document.querySelector('#gpu-notice:not([hidden]), #perf-nudge:not([hidden])'),
        ),
        rendererTier: g.renderer.perfStats().tier,
        camera: {
          position: g.renderer.camera.position.toArray(),
          quaternion: g.renderer.camera.quaternion.toArray(),
          inputYaw: g.input.camYaw,
        },
        settings: JSON.parse(localStorage.getItem('woc_settings') ?? '{}'),
        theme: JSON.parse(localStorage.getItem('woc_theme') ?? '{}'),
        player: { pos: { ...p.pos }, facing: p.facing, entrySeq: p.dungeonEntrySeq ?? 0 },
        // Whether the arch is actually on screen this frame: the gate's view is
        // attached to the scene with its whole chain visible, and both plinths
        // and the keystone project inside the canvas with no painted DOM element
        // (HUD, prompt, touch controls, even pointer-events:none overlays) over
        // them. A press opens the prompt whether or not the arch renders, so the
        // prompt alone cannot prove the arch is on screen.
        gateDrawn: (() => {
          const gate = [...g.sim.entities.values()].find((e) => e.templateId === 'freehold_gate');
          const view = gate ? g.renderer.views.get(gate.id) : null;
          if (!view) return false;
          let node = view.group;
          for (; node.parent; node = node.parent) if (!node.visible) return false;
          if (node !== g.renderer.scene || !node.visible) return false;
          const camera = g.renderer.camera;
          camera.updateMatrixWorld();
          const canvas = g.renderer.webgl.domElement;
          const frame = canvas.getBoundingClientRect();
          // Local arch points (plinths 1.7 either side, keystone 4.5 up), turned
          // by the gate's facing about y.
          const turn = gate.facing ?? 0;
          const points = [
            [-1.7, 1],
            [1.7, 1],
            [0, 4.5],
          ].map(([side, up]) => [
            gate.pos.x + side * Math.cos(turn),
            gate.pos.y + up,
            gate.pos.z - side * Math.sin(turn),
          ]);
          // A fill hides what is under it only when it is mostly opaque: the
          // mobile window backdrop is a 0.55-alpha scrim that dims the world
          // under a window without hiding it. Handles rgb(a), color(... / a)
          // and transparent.
          const opaque = (color) => {
            if (color === 'transparent') return false;
            const alpha =
              /\/\s*([\d.]+)\s*\)$/.exec(color) ?? /rgba\([^)]*,\s*([\d.]+)\)$/.exec(color);
            return !alpha || Number(alpha[1]) >= 0.75;
          };
          // Whether an element paints at a screen point. A 2D canvas overlay (the
          // nameplate layer spans the whole screen) paints only where its own
          // pixels do; any other canvas is taken as painted.
          const paintsAt = (element, sx, sy) => {
            if (element === canvas || element.contains(canvas)) return false;
            if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
              return false;
            const box = element.getBoundingClientRect();
            if (!(sx >= box.left && sx <= box.right && sy >= box.top && sy <= box.bottom))
              return false;
            if (element.tagName === 'CANVAS') {
              const context = element.getContext('2d');
              if (!context || box.width === 0 || box.height === 0) return true;
              const px = Math.floor(((sx - box.left) / box.width) * element.width);
              const py = Math.floor(((sy - box.top) / box.height) * element.height);
              return context.getImageData(px, py, 1, 1).data[3] > 0;
            }
            if (['IMG', 'SVG', 'svg', 'VIDEO'].includes(element.tagName)) return true;
            const style = getComputedStyle(element);
            if (opaque(style.backgroundColor) || style.backgroundImage !== 'none') return true;
            if (Number.parseFloat(style.borderTopWidth) > 0 && opaque(style.borderTopColor))
              return true;
            return [...element.childNodes].some(
              (child) => child.nodeType === 3 && child.textContent.trim() !== '',
            );
          };
          const elements = [...document.body.querySelectorAll('*')];
          return points.every(([x, y, z]) => {
            const ndc = camera.position.clone().set(x, y, z).project(camera);
            if (!(Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z >= -1 && ndc.z <= 1))
              return false;
            const sx = frame.left + ((ndc.x + 1) / 2) * frame.width;
            const sy = frame.top + ((1 - ndc.y) / 2) * frame.height;
            return !elements.some((element) => paintsAt(element, sx, sy));
          });
        })(),
        promptVisible: Boolean(shown),
        controls: shown
          ? [...dialog.querySelectorAll('button,input,select')]
              .map((control) => {
                const box = control.getBoundingClientRect();
                return {
                  key: control.getAttribute('data-focus-key'),
                  width: box.width,
                  height: box.height,
                  fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
                };
              })
              .filter((control) => control.width > 0 && control.height > 0)
          : [],
        focusKey: document.activeElement?.getAttribute('data-focus-key') ?? null,
        promptFitsViewport:
          !shown ||
          (() => {
            const box = dialog.getBoundingClientRect();
            return (
              box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight
            );
          })(),
      };
    });
    if (evidence.viewport.width !== variant.width || evidence.viewport.height !== variant.height)
      throw new Error('Freehold capture viewport does not match its declared variant');
    if (evidence.settings.graphicsPreset !== 1 || evidence.settings.graphicsDefaultApplied !== true)
      throw new Error('Freehold capture requires the lowest graphics preset');
    if (evidence.rendererTier !== 'low')
      throw new Error('Freehold capture did not apply the low renderer tier');
    if (!/swiftshader/i.test(evidence.gpuRenderer ?? ''))
      throw new Error('Freehold capture backend does not match the software capture runner');
    if (evidence.gpuNoticeVisible) throw new Error('GPU notice obscures the Freehold capture');
    if (
      key === 'freehold-gate' &&
      process.env.PR_SHOTS_FREEHOLD_BASELINE !== '1' &&
      !evidence.gateDrawn
    )
      throw new Error('The Freehold Gate did not draw in the gate frame');
    if (!evidence.promptFitsViewport) throw new Error('Freehold prompt escapes its viewport');
    if (evidence.controls.some((control) => control.width < 40 || control.height < 40))
      throw new Error('Freehold prompt has a control smaller than 40 pixels');
    const output = process.env.SHOTS_DIR ?? 'pr-shots';
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(output, `evidence-${key}-${variant.key}.json`),
      `${JSON.stringify(
        {
          target: key,
          scene,
          variant: variant.key,
          baseline: process.env.PR_SHOTS_FREEHOLD_BASELINE === '1',
          noticeResolution,
          dismissedNotices,
          dismissedOverlays,
          overlaySettlePasses,
          ...evidence,
        },
        null,
        2,
      )}\n`,
    );
    return { clip: '#ui' };
  },
}));
