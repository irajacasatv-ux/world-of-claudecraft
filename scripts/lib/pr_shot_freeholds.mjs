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
import { FREEHOLD_GATE_PROBE_POINTS, freeholdGateDrawnProbe } from './freehold_gate_probe.mjs';

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
  // Everything that decides what these frames show: the housing UI and sim,
  // whether and where the arch draws (the visibility, pick, rank, prewarm and
  // grass cores, the arch body, the layout site), and this harness itself.
  // The shared stylesheets stay on the generic HUD fallback by policy
  // (tests/pr_shot_targets.test.ts); the receipt's seal still covers them.
  when: [
    'ui/hud/housing/',
    'freehold/',
    'render/freehold_',
    'game/nearby_interaction',
    'render/dungeon_interior_resolver_core.ts',
    'render/dungeon_variant_core.ts',
    'render/ground_object.ts',
    'render/door_portal.ts',
    'render/delve_interactable_visibility_core.ts',
    'render/pick_resolution.ts',
    'render/prewarm_policy.ts',
    'render/entity_view_policy_core.ts',
    'render/foliage_core.ts',
    'sim/eastbrook_layout.ts',
    'scripts/freehold_',
    'scripts/lib/freehold_',
    'scripts/lib/pr_shot_freeholds.mjs',
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

        promptVisible: Boolean(shown),
        controls: shown
          ? [...dialog.querySelectorAll('button,input,select')]
              .map((control) => {
                const box = control.getBoundingClientRect();
                // On top: what the frame shows at the control's centre is the
                // control (or its own content), not something laid over it.
                const hit = document.elementFromPoint(
                  box.left + box.width / 2,
                  box.top + box.height / 2,
                );
                return {
                  key: control.getAttribute('data-focus-key'),
                  tag: control.tagName.toLowerCase(),
                  width: box.width,
                  height: box.height,
                  fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
                  onTop: hit === control || control.contains(hit),
                };
              })
              .filter((control) => control.width > 0 && control.height > 0)
          : [],
        focusKey: document.activeElement?.getAttribute('data-focus-key') ?? null,
        focusId: document.activeElement?.id || null,
        // Transient HUD that can land over any frame: a message or banner
        // counts once it holds content, the rest once it shows at all.
        transientOverlays: [
          ['error-msg', true],
          ['quest-banner', true],
          ['raid-warning-banner', true],
          ['tooltip', true],
          ['low-health-vignette', false],
          ['death-overlay', false],
          ['ready-check-leader-window', false],
          ['dfinder-proposal-popup', true],
          ['bg-proposal-popup', true],
          ['entry-guard-banner', false],
          ['discord-cta-banner', false],
          ['desktop-update-toast', false],
        ]
          .filter(([id, needsContent]) => {
            const element = document.getElementById(id);
            if (!element?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
              return false;
            const box = element.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) return false;
            return (
              !needsContent || element.textContent.trim() !== '' || element.children.length > 0
            );
          })
          .map(([id]) => id),
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
    // Whether the arch is actually on screen (freehold_gate_probe.mjs), kept with
    // its per-point record so a refusal names what hid which point.
    const gateProbe = await page.evaluate(freeholdGateDrawnProbe, {
      points: FREEHOLD_GATE_PROBE_POINTS,
    });
    evidence.gateDrawn = gateProbe.drawn;
    evidence.gateProbe = gateProbe;
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
      throw new Error(`The Freehold Gate did not draw in the gate frame (${gateProbe.reason})`);
    if (!evidence.promptFitsViewport) throw new Error('Freehold prompt escapes its viewport');
    if (evidence.controls.some((control) => control.width < 40 || control.height < 40))
      throw new Error('Freehold prompt has a control smaller than 40 pixels');
    if (evidence.controls.some((control) => !control.onTop))
      throw new Error('Something is laid over a Freehold prompt control');
    if (evidence.transientOverlays.length > 0)
      throw new Error(`Transient HUD over the Freehold capture: ${evidence.transientOverlays}`);
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
