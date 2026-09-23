import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_CAMERA_BEHIND_TOLERANCE,
  FREEHOLD_GATE_STANCE,
  FREEHOLD_ROUTE_TOLERANCE,
  freeholdInteriorPerfFailures,
} from '../scripts/freehold_interior_route.mjs';
import {
  baselineRuntimeRefusal,
  outputPlacementRefusal,
} from '../scripts/lib/freehold_receipt_guards.mjs';
import { DUNGEONS, instanceOrigin } from '../src/sim/data';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';
import { cleanFreeholdPerfSamples } from './helpers/freehold_perf_samples';

const ROOT = 'docs/screenshots/freehold-interiors-2026-09-08/';
const views = { desktop: [1600, 900], compact: [874, 402], tablet: [1180, 820] } as const;
const targets = ['freehold-gate', 'freehold-inn', 'freehold-cottage'] as const;
const sourcePaths = [
  'src/render/renderer.ts',
  'src/render/dungeon.ts',
  'src/render/authored_walls.ts',
  'src/render/dungeon_wall_occlusion.ts',
  'src/render/entity_labels.ts',
  'src/render/nameplate_painter.ts',
  'src/render/zone_character_dependencies.ts',
  'src/render/characters/assets.ts',
  'src/render/characters/streaming_policy_core.ts',
  'src/render/dungeon_variant_core.ts',
  'src/render/dungeon_interior_resolver_core.ts',
  'src/render/zone_prewarm_groups.ts',
  'src/render/freehold/wall_cutaway.ts',
  'src/render/freehold/exit_label_core.ts',
  'src/render/door_portal.ts',
  'src/render/ground_object.ts',
  'src/render/freehold/interior_dressing.ts',
  'src/render/freehold/model_spec_core.ts',
  'src/sim/content/freehold/layouts.ts',
  'src/sim/eastbrook_layout.ts',
  'src/ui/hud/housing/gate_prompt_controller.ts',
  'src/ui/hud/housing/gate_prompt_painter.ts',
  'src/ui/hud/housing/housing_view.ts',
  'src/styles/components.css',
  'src/styles/hud.mobile.css',
  'scripts/lib/freehold_capture_notices.mjs',
  'scripts/lib/pr_shot_freeholds.mjs',
  'scripts/pr_shot_targets.mjs',
  'scripts/pr_screenshots.mjs',
  'scripts/freehold_interior_route.mjs',
  'scripts/perf_tour.mjs',
  'src/render/zone_character_dependency_wait.ts',
  'src/render/zone_prewarm_finalize.ts',
  'src/render/prewarm_instance_lifecycle.ts',
  'src/sim/instances/owner_arrival.ts',
  'src/sim/freehold/gate.ts',
  'src/sim/instances/dungeons.ts',
  'src/sim/content/freehold/dungeons.ts',
  'src/sim/world.ts',
  'src/ui/panel_key_guard.ts',
  'src/ui/hud/action_bar/action_bar_controller.ts',
  'scripts/freehold_capture_receipt.mjs',
  'src/render/delve_interactable_visibility_core.ts',
  'scripts/enter_offline_game.mjs',
  'src/sim/freehold/gate_rules.ts',
  'src/render/entity_view_policy_core.ts',
  'src/render/prewarm_policy.ts',
  'docs/freeholds/art/space-measurements.json',
  'scripts/lib/freehold_gate_probe.mjs',
  'src/render/foliage_core.ts',
  'src/styles/library.css',
  'scripts/lib/freehold_receipt_guards.mjs',
  'scripts/lib/freehold_capture_census.mjs',
];
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

describe('Freehold functional capture evidence', () => {
  it('preserves producer records without filtering errors or performance evidence', () => {
    const acceptance = JSON.parse(readFileSync(resolve(ROOT, 'acceptance.json'), 'utf8'));
    expect(acceptance.rawFiles.map((record: { file: string }) => record.file)).toEqual([
      'before-manifest.raw.json',
      'after-manifest.raw.json',
      'performance.raw.json',
    ]);
    for (const record of acceptance.rawFiles) {
      const bytes = readFileSync(resolve(ROOT, record.file));
      expect(digest(bytes)).toBe(record.sha256);
      expect(JSON.parse(bytes.toString('utf8'))).toEqual(
        JSON.parse(readFileSync(resolve(ROOT, record.formattedFile), 'utf8')),
      );
    }
    expect(acceptance.sourceIdentity.current.head).toMatch(/^[a-f0-9]{40}$/);
    expect(Array.isArray(acceptance.sourceIdentity.current.status)).toBe(true);
    expect(acceptance.sourceIdentity.baselineRuntime.head).toBe(acceptance.baselineCommit);
    expect(acceptance.baselineHarness.applicationDiff).toEqual([]);
    expect(acceptance.baselineHarness.applicationUntracked).toEqual([]);
    for (const side of ['before', 'after']) {
      const manifest = JSON.parse(readFileSync(resolve(ROOT, `${side}-manifest.raw.json`), 'utf8'));
      expect(acceptance.diagnosticCounts[side]).toBe(manifest.errors.length);
    }
  });
  it('retains actual rendered clean interior samples on desktop and mobile', () => {
    const acceptance = JSON.parse(readFileSync(resolve(ROOT, 'acceptance.json'), 'utf8'));
    const bytes = readFileSync(resolve(ROOT, acceptance.performance.file));
    expect(digest(bytes)).toBe(acceptance.performance.sha256);
    const performance = JSON.parse(bytes.toString('utf8'));
    expect(performance.scenario).toBe('bench_freehold_interiors');
    expect(performance.requestedPreset).toBe('low');
    expect(performance.gpuMode).toBe('real-gpu-headed');
    expect(performance.results.map((result: { viewport: string }) => result.viewport)).toEqual([
      'desktop',
      'mobile',
    ]);
    for (const result of performance.results) {
      expect(result.errors).toEqual([]);
      expect(result.budgetFailures).toEqual([]);
      expect(freeholdInteriorPerfFailures(result.samples)).toEqual([]);
    }
  });
  it('retains all nine matched before/after variants with exact viewport and low graphics evidence', () => {
    const acceptance = JSON.parse(readFileSync(resolve(ROOT, 'acceptance.json'), 'utf8'));
    expect(acceptance.baselineCommit).toBe('654071354172b3e252cfc03a1e85efde2daddaa6');
    expect(acceptance.captures).toHaveLength(18);
    const names: string[] = [];
    for (const side of ['before', 'after'])
      for (const target of targets)
        for (const [view, [width, height]] of Object.entries(views)) {
          const name = `${side}-${target}-${view}.png`;
          names.push(name);
          const record = acceptance.captures.find((entry: { file: string }) => entry.file === name);
          expect(record, name).toBeDefined();
          const bytes = readFileSync(resolve(ROOT, name));
          expect(digest(bytes), name).toBe(record.sha256);
          const evidenceBytes = readFileSync(resolve(ROOT, record.evidence));
          expect(digest(evidenceBytes), record.evidence).toBe(record.evidenceSha256);
          const evidence = JSON.parse(evidenceBytes.toString('utf8'));
          expect(evidence.target).toBe(target);
          expect(evidence.variant).toBe(view);
          expect(evidence.baseline).toBe(side === 'before');
          expect(evidence.viewport).toMatchObject({ width, height });
          expect(evidence.settings).toMatchObject({
            graphicsPreset: 1,
            graphicsDefaultApplied: true,
          });
          expect(evidence.theme.preset).toBe('classic');
          expect(evidence.rendererTier).toBe('low');
          expect(evidence.gpuRenderer).toMatch(/swiftshader/i);
          expect(evidence.gpuNoticeVisible).toBe(false);
          // The arrival-overlay settle ran for this frame (an empty list means it
          // found none across its quiet passes, not that it was skipped).
          expect(Array.isArray(evidence.dismissedOverlays), name).toBe(true);
          expect(Number.isInteger(evidence.overlaySettlePasses), name).toBe(true);
          expect(evidence.overlaySettlePasses, name).toBeGreaterThanOrEqual(3);
          expect(['boot-notice', 'performance-notice', 'prior-performance-dismissal']).toContain(
            evidence.noticeResolution,
          );
          expect(evidence.promptFitsViewport).toBe(true);
          expect(evidence.transientOverlays, name).toEqual([]);
          // The camera looks where the player does (the before tablet once did
          // not, swung round in front of the stance).
          expect(typeof evidence.camera.inputYaw, name).toBe('number');
          expect(typeof evidence.player.facing, name).toBe('number');
          const cameraTurn = evidence.camera.inputYaw - evidence.player.facing;
          expect(
            Math.abs(Math.atan2(Math.sin(cameraTurn), Math.cos(cameraTurn))),
            `${name} camera behind`,
          ).toBeLessThanOrEqual(FREEHOLD_CAMERA_BEHIND_TOLERANCE);
          // The after arm settles the GPU notices and the arrival overlays at
          // the gate stance, before the press (a dismissal after the prompt
          // opens takes its focus); the baseline arm opens no prompt.
          if (side === 'after') {
            expect(Number.isInteger(evidence.preSettle.overlays.passes), name).toBe(true);
            expect(evidence.preSettle.overlays.passes, name).toBeGreaterThanOrEqual(3);
            expect(Array.isArray(evidence.preSettle.overlays.dismissedOverlays), name).toBe(true);
            // The frame's own notice record is the one the stance settle made.
            expect(evidence.preSettle.notices.noticeResolution, name).toBe(
              evidence.noticeResolution,
            );
          } else expect(evidence.preSettle, name).toBeNull();
          expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
          expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([
            width * evidence.viewport.dpr,
            height * evidence.viewport.dpr,
          ]);
          if (target === 'freehold-gate') {
            // Both gate frames stand at the tour's stance off the CURRENT site,
            // so a moved gate reds this contract until the frames are re-shot.
            const gate = EASTBROOK_LAYOUT.services.freeholdGate.position;
            const off = Math.hypot(
              evidence.player.pos.x - (gate.x + FREEHOLD_GATE_STANCE.dx),
              evidence.player.pos.z - (gate.z + FREEHOLD_GATE_STANCE.dz),
            );
            expect(off, `${name} stands at the gate`).toBeLessThanOrEqual(FREEHOLD_ROUTE_TOLERANCE);
            // Squared on -z, so the arch reads face-on.
            const turn = Math.PI - evidence.player.facing;
            expect(Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn))), name).toBeLessThanOrEqual(
              0.12,
            );
          }
          if (side === 'before') {
            expect(evidence.promptVisible).toBe(false);
            expect(evidence.player.pos.x).toBeLessThan(10000);
          } else if (target === 'freehold-gate') {
            expect(evidence.promptVisible).toBe(true);
            expect(evidence.gateDrawn, `${name} drew the arch`).toBe(true);
            expect(evidence.controls.length).toBeGreaterThan(3);
            expect(evidence.focusId, name).toBe('gate-own-tab');
            for (const control of evidence.controls) {
              expect(control.width).toBeGreaterThanOrEqual(40);
              expect(control.height).toBeGreaterThanOrEqual(40);
              expect(control.onTop, `${name} ${control.key}`).toBe(true);
              if (view !== 'desktop' && ['input', 'select', 'textarea'].includes(control.tag))
                expect(control.fontSize, `${name} ${control.key}`).toBeGreaterThanOrEqual(16);
            }
          } else {
            expect(evidence.promptVisible).toBe(false);
            expect(evidence.player.entrySeq).toBeGreaterThan(0);
            const def =
              DUNGEONS[target === 'freehold-inn' ? 'freehold_inn_room' : 'freehold_cottage'];
            const origin = instanceOrigin(def.index, 0);
            expect(evidence.player.pos.x).toBeCloseTo(origin.x + def.entry.x, 3);
            expect(evidence.player.pos.z).toBeCloseTo(origin.z + def.entry.z, 3);
            expect(evidence.player.facing).toBe(0);
            // The room arrival snaps the camera onto the facing exactly.
            expect(evidence.camera.inputYaw, name).toBe(0);
          }
        }
    expect(acceptance.captures.map((entry: { file: string }) => entry.file).sort()).toEqual(
      names.sort(),
    );
    expect(acceptance.sourceInputs.map((input: { path: string }) => input.path)).toEqual(
      sourcePaths,
    );
    for (const input of acceptance.sourceInputs)
      expect(digest(readFileSync(input.path)), input.path).toBe(input.sha256);
  });
});

describe('Freehold capture receipt refusal', () => {
  // A synthetic producer set: the receipt reads only a PNG's signature and IHDR
  // size, so a 33-byte stub (signature plus IHDR header) stands in for each
  // frame, and a clean perf-tour record stands beside them. Each defect below
  // breaks one conjunct (a field of one frame, the manifest, one image, or the
  // performance record), and the valid set is proven to clear every check the
  // synthetic set can reach, so each refusal is for the defect it names.
  const measured = JSON.parse(readFileSync('docs/freeholds/art/space-measurements.json', 'utf8'));
  const site = measured.gate.position as [number, number];
  const stance = { x: site[0] + FREEHOLD_GATE_STANCE.dx, z: site[1] + FREEHOLD_GATE_STANCE.dz };
  const arrival = measured.arrival as Record<string, [number, number]>;
  const roomOf: Record<string, string> = {
    'freehold-inn': 'freehold_inn_room',
    'freehold-cottage': 'freehold_cottage',
  };
  type Control = {
    key: string;
    tag: string;
    width: number;
    height: number;
    fontSize: number;
    onTop: boolean;
  };
  type Evidence = Record<string, unknown> & {
    player: { pos: { x: number; z: number }; facing: number; entrySeq: number };
  };
  type Performance = Record<string, unknown> & {
    results: (Record<string, unknown> & { samples: ReturnType<typeof cleanFreeholdPerfSamples> })[];
  };
  function png(width: number, height: number): Buffer {
    const bytes = Buffer.alloc(33);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes, 0);
    bytes.writeUInt32BE(13, 8);
    bytes.write('IHDR', 12, 'ascii');
    bytes.writeUInt32BE(width, 16);
    bytes.writeUInt32BE(height, 20);
    return bytes;
  }
  function stage(
    dir: string,
    side: 'before' | 'after',
    edit?: (name: string, e: Evidence) => void,
  ) {
    const captured: unknown[] = [];
    let index = 1;
    for (const target of targets)
      for (const [view, [width, height]] of Object.entries(views)) {
        const dpr = view === 'desktop' ? 1 : 2;
        const file = `${String(index++).padStart(2, '0')}-${target}-${view}.png`;
        captured.push(file);
        writeFileSync(join(dir, file), png(width * dpr, height * dpr));
        const gateFrame = target === 'freehold-gate';
        const room = side === 'after' && !gateFrame;
        const prompt = gateFrame && side === 'after';
        const control = (key: string, tag: string, fontSize: number): Control => ({
          key,
          tag,
          width: 40,
          height: 40,
          fontSize,
          onTop: true,
        });
        const evidence: Evidence = {
          target,
          variant: view,
          baseline: side === 'before',
          viewport: { width, height, dpr },
          settings: { graphicsPreset: 1, graphicsDefaultApplied: true },
          rendererTier: 'low',
          theme: { preset: 'classic' },
          gpuRenderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))',
          gpuNoticeVisible: false,
          promptFitsViewport: true,
          transientOverlays: [],
          dismissedOverlays: [],
          overlaySettlePasses: 3,
          noticeResolution: 'boot-notice',
          promptVisible: prompt,
          // The desktop entry sits under 16 px, as the live one does: the
          // floor applies only on the touch variants.
          controls: prompt
            ? [
                control('gate-tab-own', 'button', 12),
                control('gate-tab-friend', 'button', 12),
                control('gate-home', 'select', view === 'desktop' ? 12 : 16),
                control('gate-enter', 'button', 12.5),
                control('gate-close', 'button', 12.5),
              ]
            : [],
          focusId: prompt ? 'gate-own-tab' : null,
          player: room
            ? {
                pos: { x: arrival[roomOf[target]][0], z: arrival[roomOf[target]][1] },
                facing: 0,
                entrySeq: 1,
              }
            : { pos: { ...stance }, facing: Math.PI, entrySeq: 0 },
          camera: { inputYaw: room ? 0 : Math.PI },
          preSettle:
            side === 'after'
              ? {
                  notices: { noticeResolution: 'boot-notice' },
                  overlays: { passes: 3, dismissedOverlays: [] },
                }
              : null,
          gateDrawn: prompt,
        };
        edit?.(`${target}-${view}`, evidence);
        writeFileSync(join(dir, `evidence-${target}-${view}.json`), JSON.stringify(evidence));
      }
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ captured, errors: [] }));
    return captured;
  }
  function performance(edit?: (p: Performance) => void): Performance {
    const record: Performance = {
      scenario: 'bench_freehold_interiors',
      requestedPreset: 'low',
      gpuMode: 'real-gpu-headed',
      results: ['desktop', 'mobile'].map((viewport) => ({
        viewport,
        errors: [],
        budgetFailures: [],
        samples: cleanFreeholdPerfSamples(),
      })),
    };
    edit?.(record);
    return record;
  }
  function receipt(before: string, after: string, output: string) {
    return spawnSync(
      process.execPath,
      [
        'scripts/freehold_capture_receipt.mjs',
        '--before',
        before,
        '--after',
        after,
        '--performance',
        join(before, 'performance.json'),
        '--output',
        output,
        '--baseline-root',
        '.',
      ],
      { encoding: 'utf8' },
    );
  }
  // The positive control stops here: the synthetic set cannot carry a
  // baseline checkout at the release commit, so reaching this refusal proves
  // every frame, manifest and performance check before it passed.
  const PAST_EVERY_CHECK = 'Baseline runtime HEAD does not match the declared release';
  const REFUSALS: Record<string, string> = {
    'missing image': 'expected exactly nine producer captures',
    'captured not a list': 'expected exactly nine producer captures',
    'duplicate image': 'expected one producer image',
    'capture entry that is not a string': 'expected one producer image',
    'producer errors not a list': 'before: missing producer errors array',
    'sidecar for another target': 'before: mismatched sidecar',
    'sidecar for another view': 'before: mismatched sidecar',
    'after sidecar marked baseline': 'after: mismatched sidecar',
    'viewport width off': 'before: mismatched viewport',
    'viewport height off': 'before: mismatched viewport',
    'zero dpr': 'before: mismatched viewport',
    'missing dpr': 'before: mismatched viewport',
    'string dpr': 'before: mismatched viewport',
    'wrong low preset': 'low graphics proof missing',
    'device default not applied': 'before: low graphics proof missing',
    'renderer tier not low': 'before: low graphics proof missing',
    'theme not classic': 'before: obscured or mismatched capture',
    'hardware renderer': 'before: obscured or mismatched capture',
    'gpu notice showing': 'before: obscured or mismatched capture',
    'prompt past the viewport': 'before: obscured or mismatched capture',
    'transient overlay showing': 'before: obscured or mismatched capture',
    'transient overlays not a list': 'before: obscured or mismatched capture',
    'dismissed overlays not a list': 'before: obscured or mismatched capture',
    'under three settle passes': 'obscured or mismatched capture',
    'fractional settle passes': 'obscured or mismatched capture',
    'missing settle record': 'obscured or mismatched capture',
    'gate frame 0.71 yd off the stance': 'gate frame is off the gate stance',
    'gate frame 1.4 yd off the stance': 'gate frame is off the gate stance',
    'gate frame turned 0.13 rad': 'gate frame is off the gate stance',
    'gate frame turned -0.13 rad': 'gate frame is off the gate stance',
    'gate frame turned 0.1201 rad': 'gate frame is off the gate stance',
    'undrawn after gate frame': 'after: gate frame is off the gate stance, unsquared, or undrawn',
    'after gate frame with no gateDrawn': 'after: gate frame is off the gate stance',
    'unresolved notice': 'unresolved GPU notice',
    'camera round in front': 'before: camera is not behind the player',
    'camera 0.11 rad off': 'before: camera is not behind the player',
    'camera yaw as a string': 'before: camera is not behind the player',
    'facing as a string': 'before: camera is not behind the player',
    'stance settle for another notice': 'after: missing or misplaced stance settle',
    'stance settle dismissals not a list': 'after: missing or misplaced stance settle',
    'stance settle with fractional passes': 'after: missing or misplaced stance settle',
    'room camera a hair off': 'after: interior frame is not a settled room arrival',
    'after frame without its stance settle': 'after: missing or misplaced stance settle',
    'stance settle with two quiet passes': 'after: missing or misplaced stance settle',
    'baseline frame with a stance settle': 'before: missing or misplaced stance settle',
    'camera record missing': 'before: camera is not behind the player',
    'room camera turned': 'after: camera is not behind the player',
    'baseline frame inside a room': 'before: baseline frame is not on the overworld',
    'baseline frame with the prompt shown': 'before: baseline frame is not on the overworld',
    'after gate frame with no prompt': 'after: gate frame has no usable prompt',
    'after gate control under 40 px': 'after: gate frame has no usable prompt',
    'gate control under 40 px wide': 'after: gate frame has no usable prompt',
    'three gate controls': 'after: gate frame has no usable prompt',
    'gate controls not a list': 'after: gate frame has no usable prompt',
    'gate control laid over': 'after: gate frame has no usable prompt',
    'touch entry under 16 px': 'after: gate frame has no usable prompt',
    'focus off the selected tab': 'after: gate frame has no usable prompt',
    'unsettled room arrival': 'after: interior frame is not a settled room arrival',
    'room arrival turned': 'after: interior frame is not a settled room arrival',
    'room arrival off its point': 'after: interior frame is not a settled room arrival',
    'room arrival off its z point': 'after: interior frame is not a settled room arrival',
    'room arrival in the other room': 'after: interior frame is not a settled room arrival',
    'room arrival with the prompt shown': 'after: interior frame is not a settled room arrival',
    'image one pixel too wide': 'before: invalid PNG dimensions',
    'image one pixel too tall': 'before: invalid PNG dimensions',
    'image without a PNG signature': 'before: invalid PNG dimensions',
    'truncated image': 'before: invalid PNG dimensions',
    'performance for another scenario': 'Expected hardware Freehold low-tier performance',
    'performance at another preset': 'Expected hardware Freehold low-tier performance',
    'performance on the software renderer': 'Expected hardware Freehold low-tier performance',
    'performance without its mobile result': 'Expected desktop and mobile performance results',
    'performance errors not a list': 'desktop: incomplete performance producer',
    'performance budget failures not a list': 'desktop: incomplete performance producer',
    'performance samples not a list': 'desktop: incomplete performance producer',
    'performance sample with a live link': 'desktop: freehold-inn-room: live-program delta 1',
    'performance result with an error': 'desktop: producer reported performance errors',
    'performance result over budget': 'desktop: producer reported performance errors',
  };
  // Inside every tolerance: 1.4 yd was once accepted and is not now; these are.
  const NEAR_MISSES = [
    'gate frame 0.69 yd off the stance',
    'gate frame turned 0.11 rad',
    'gate frame turned 0.1199 rad',
    'gate frame wrapped past -PI',
    'room arrival 0.0004 off its point',
    'performance-notice resolution',
    'camera 0.09 rad off',
    'prior-performance-dismissal resolution',
  ];
  function edits(defect: string) {
    return {
      before: (name: string, e: Evidence) => {
        if (defect === 'baseline frame inside a room' && name === 'freehold-inn-desktop')
          e.player.pos.x = 119200;
        if (defect === 'baseline frame with the prompt shown' && name === 'freehold-inn-desktop')
          e.promptVisible = true;
        if (name !== 'freehold-gate-desktop') return;
        if (defect === 'wrong low preset')
          (e.settings as { graphicsPreset: number }).graphicsPreset = 2;
        if (defect === 'under three settle passes') e.overlaySettlePasses = 2;
        if (defect === 'fractional settle passes') e.overlaySettlePasses = 3.5;
        if (defect === 'missing settle record') delete e.overlaySettlePasses;
        const off = /^gate frame ([\d.]+) yd off the stance$/.exec(defect);
        if (off) e.player.pos.x += Number(off[1]);
        // The camera turns with the player (the hold settles it behind), so
        // these rows move only the facing conjunct.
        const turned = /^gate frame turned (-?[\d.]+) rad$/.exec(defect);
        if (turned) e.player.facing = Math.PI - Number(turned[1]);
        if (defect === 'gate frame wrapped past -PI') e.player.facing = -Math.PI + 0.05;
        if (turned || defect === 'gate frame wrapped past -PI')
          (e.camera as { inputYaw: number }).inputYaw = e.player.facing;
        if (defect === 'unresolved notice') e.noticeResolution = 'none';
        const camera = e.camera as { inputYaw: number };
        if (defect === 'camera round in front') camera.inputYaw = Math.PI + 2.47;
        if (defect === 'camera 0.11 rad off') camera.inputYaw = Math.PI - 0.11;
        if (defect === 'camera 0.09 rad off') camera.inputYaw = Math.PI - 0.09;
        if (defect === 'facing as a string')
          (e.player as unknown as { facing: unknown }).facing = String(Math.PI);
        if (defect === 'camera yaw as a string')
          (camera as { inputYaw: unknown }).inputYaw = String(Math.PI);
        if (defect === 'baseline frame with a stance settle')
          e.preSettle = { overlays: { passes: 3, dismissedOverlays: [] } };
        if (defect === 'camera record missing') delete e.camera;
        if (defect === 'performance-notice resolution') e.noticeResolution = 'performance-notice';
        if (defect === 'prior-performance-dismissal resolution')
          e.noticeResolution = 'prior-performance-dismissal';
        if (defect === 'sidecar for another target') e.target = 'freehold-inn';
        if (defect === 'sidecar for another view') e.variant = 'compact';
        const viewport = e.viewport as { width: number; height: number; dpr?: unknown };
        if (defect === 'viewport width off') viewport.width += 1;
        if (defect === 'viewport height off') viewport.height -= 1;
        if (defect === 'zero dpr') viewport.dpr = 0;
        if (defect === 'missing dpr') delete viewport.dpr;
        if (defect === 'string dpr') viewport.dpr = '1';
        const settings = e.settings as { graphicsDefaultApplied: boolean };
        if (defect === 'device default not applied') settings.graphicsDefaultApplied = false;
        if (defect === 'renderer tier not low') e.rendererTier = 'medium';
        if (defect === 'theme not classic') e.theme = { preset: 'modern' };
        if (defect === 'hardware renderer') e.gpuRenderer = 'ANGLE (Apple, Apple M3, OpenGL 4.1)';
        if (defect === 'gpu notice showing') e.gpuNoticeVisible = true;
        if (defect === 'prompt past the viewport') e.promptFitsViewport = false;
        if (defect === 'transient overlay showing') e.transientOverlays = ['error-msg'];
        // An array-like with no entries: only the list check refuses it.
        if (defect === 'transient overlays not a list') e.transientOverlays = { length: 0 };
        if (defect === 'dismissed overlays not a list') e.dismissedOverlays = 'tut-card';
      },
      after: (name: string, e: Evidence) => {
        if (name === 'freehold-inn-desktop') {
          if (defect === 'unsettled room arrival') e.player.entrySeq = 0;
          if (defect === 'room arrival turned') e.player.facing = 0.1;
          if (defect === 'room arrival off its point') e.player.pos.x += 0.001;
          if (defect === 'room arrival 0.0004 off its point') e.player.pos.x += 0.0004;
          if (defect === 'room arrival off its z point') e.player.pos.z += 0.001;
          if (defect === 'room arrival in the other room')
            e.player.pos = { x: arrival.freehold_cottage[0], z: arrival.freehold_cottage[1] };
          if (defect === 'room arrival with the prompt shown') e.promptVisible = true;
          if (defect === 'after sidecar marked baseline') e.baseline = true;
          if (defect === 'room camera turned') (e.camera as { inputYaw: number }).inputYaw = 1;
          if (defect === 'room camera a hair off')
            (e.camera as { inputYaw: number }).inputYaw = 0.01;
        }
        const controls = e.controls as Control[];
        if (name === 'freehold-gate-compact' && defect === 'touch entry under 16 px')
          controls[2].fontSize = 15;
        if (name !== 'freehold-gate-desktop') return;
        if (defect === 'undrawn after gate frame') e.gateDrawn = false;
        if (defect === 'after gate frame with no gateDrawn') delete e.gateDrawn;
        if (defect === 'after gate frame with no prompt') e.promptVisible = false;
        if (defect === 'after gate control under 40 px') controls[0].height = 39;
        if (defect === 'gate control under 40 px wide') controls[0].width = 39;
        if (defect === 'three gate controls') e.controls = controls.slice(0, 3);
        if (defect === 'gate controls not a list') e.controls = { length: 5 };
        if (defect === 'gate control laid over') controls[3].onTop = false;
        if (defect === 'focus off the selected tab') e.focusId = 'gate-enter';
        if (defect === 'after frame without its stance settle') e.preSettle = null;
        type Settle = {
          notices: { noticeResolution: string };
          overlays: { passes: number; dismissedOverlays: unknown };
        };
        const settle = e.preSettle as Settle;
        if (defect === 'stance settle with two quiet passes') settle.overlays.passes = 2;
        if (defect === 'stance settle with fractional passes') settle.overlays.passes = 3.5;
        if (defect === 'stance settle dismissals not a list')
          settle.overlays.dismissedOverlays = 'tut-card';
        if (defect === 'stance settle for another notice')
          settle.notices.noticeResolution = 'performance-notice';
      },
      performance: (p: Performance) => {
        const desktop = p.results[0];
        if (defect === 'performance for another scenario') p.scenario = 'bench_town';
        if (defect === 'performance at another preset') p.requestedPreset = 'high';
        if (defect === 'performance on the software renderer') p.gpuMode = 'swiftshader';
        if (defect === 'performance without its mobile result') p.results = [desktop];
        if (defect === 'performance errors not a list') desktop.errors = 'none';
        if (defect === 'performance budget failures not a list') desktop.budgetFailures = 0;
        if (defect === 'performance samples not a list')
          (desktop as Record<string, unknown>).samples = {};
        if (defect === 'performance sample with a live link') {
          const inn = desktop.samples[0];
          inn.sampleEvidence.end.gpuCounts['live-program'] = 1;
          inn.arrival.gpuAfter['live-program'] = 1;
          inn.arrival.gpuDelta['live-program'] = 1;
          for (const edge of [
            desktop.samples[1].sampleEvidence.begin,
            desktop.samples[1].sampleEvidence.end,
          ])
            edge.gpuCounts['live-program'] = 1;
          desktop.samples[1].arrival.gpuBefore['live-program'] = 1;
          desktop.samples[1].arrival.gpuAfter['live-program'] = 1;
        }
        if (defect === 'performance result with an error') desktop.errors = ['page crashed'];
        if (defect === 'performance result over budget') desktop.budgetFailures = ['p95 12 ms'];
      },
    };
  }
  /** Defects that live in the manifest or the image bytes, not a sidecar. */
  function breakProducer(defect: string, before: string, captured: unknown[]) {
    const manifest = (list: unknown) =>
      writeFileSync(join(before, 'manifest.json'), JSON.stringify({ captured: list, errors: [] }));
    if (defect === 'missing image') manifest(captured.slice(0, 8));
    if (defect === 'duplicate image') manifest([captured[0], ...captured.slice(0, 8)]);
    if (defect === 'captured not a list') manifest({ length: 9 });
    // An array stringifies to its one entry, so only the type check refuses it.
    if (defect === 'capture entry that is not a string')
      manifest([[captured[0]], ...captured.slice(1)]);
    if (defect === 'producer errors not a list')
      writeFileSync(join(before, 'manifest.json'), JSON.stringify({ captured, errors: 0 }));
    const first = join(before, String(captured[0]));
    if (defect === 'image one pixel too wide') writeFileSync(first, png(1601, 900));
    if (defect === 'image one pixel too tall') writeFileSync(first, png(1600, 901));
    if (defect === 'image without a PNG signature') {
      const bytes = readFileSync(first);
      bytes[1] = 0x51;
      writeFileSync(first, bytes);
    }
    // Too short to hold an IHDR size: refused by name, never a RangeError.
    if (defect === 'truncated image') writeFileSync(first, readFileSync(first).subarray(0, 20));
  }
  function run(defect: string) {
    const root = mkdtempSync(join(tmpdir(), 'freehold-receipt-'));
    const output = join(root, 'receipt');
    const [before, after] = [join(root, 'before'), join(root, 'after')];
    for (const dir of [before, after]) mkdirSync(dir);
    const captured = stage(before, 'before', edits(defect).before);
    stage(after, 'after', edits(defect).after);
    breakProducer(defect, before, captured);
    writeFileSync(
      join(before, 'performance.json'),
      JSON.stringify(performance(edits(defect).performance)),
    );
    try {
      return { result: receipt(before, after, output), wrote: existsSync(output) };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  it.each(['a valid synthetic set (the positive control)', ...NEAR_MISSES])(
    'clears every evidence and performance check for %s',
    (defect) => {
      const { result, wrote } = run(defect);
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(PAST_EVERY_CHECK);
      expect(wrote).toBe(false);
    },
  );

  it.each(Object.keys(REFUSALS))('refuses %s before publishing any evidence', (defect) => {
    const { result, wrote } = run(defect);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(REFUSALS[defect]);
    expect(result.stderr).not.toContain(PAST_EVERY_CHECK);
    expect(wrote).toBe(false);
  });
});

describe('Freehold capture receipt placement guards', () => {
  const clean = {
    head: 'abc',
    expected: 'abc',
    applicationDiff: [] as string[],
    applicationUntracked: [] as string[],
  };
  it('accepts a clean baseline at the declared release, and refuses each other state', () => {
    expect(baselineRuntimeRefusal(clean)).toBeNull();
    expect(baselineRuntimeRefusal({ ...clean, head: 'def' })).toBe(
      'Baseline runtime HEAD does not match the declared release',
    );
    for (const dirty of [
      { applicationDiff: ['src/main.ts'] },
      { applicationUntracked: ['src/new.ts'] },
    ])
      expect(baselineRuntimeRefusal({ ...clean, ...dirty })).toBe(
        'Baseline runtime has application changes; only the current capture harness may differ',
      );
  });

  it('writes only to a directory apart from both producers and the performance record', () => {
    const place = {
      output: '/evidence',
      before: '/tmp/before',
      after: '/tmp/after',
      performance: '/tmp/performance.json',
      files: ['acceptance.json', 'performance.json'],
    };
    expect(outputPlacementRefusal(place)).toBeNull();
    for (const producer of ['before', 'after'] as const)
      expect(outputPlacementRefusal({ ...place, [producer]: '/evidence' })).toBe(
        'Output directory must differ from both producer directories',
      );
    expect(outputPlacementRefusal({ ...place, performance: '/evidence/performance.json' })).toBe(
      'Output must not overwrite the performance producer',
    );
  });
});
