import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_GATE_STANCE,
  freeholdInteriorPerfFailures,
} from '../scripts/freehold_interior_route.mjs';
import { DUNGEONS, instanceOrigin } from '../src/sim/data';
import { EASTBROOK_LAYOUT } from '../src/sim/eastbrook_layout';

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
          expect(evidence.overlaySettlePasses, name).toBeGreaterThanOrEqual(3);
          expect(['boot-notice', 'performance-notice', 'prior-performance-dismissal']).toContain(
            evidence.noticeResolution,
          );
          expect(evidence.promptFitsViewport).toBe(true);
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
            expect(off, `${name} stands at the gate`).toBeLessThan(1.5);
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
            for (const control of evidence.controls) {
              expect(control.width).toBeGreaterThanOrEqual(40);
              expect(control.height).toBeGreaterThanOrEqual(40);
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
  it.each(['missing image', 'duplicate image', 'wrong low preset'])(
    'refuses %s before publishing any evidence',
    (defect) => {
      const input = mkdtempSync(join(tmpdir(), 'freehold-receipt-'));
      const output = join(input, 'receipt');
      try {
        const names = targets.flatMap((target) =>
          Object.keys(views).map((view) => `${target}-${view}.png`),
        );
        const captured = names.map(
          (name, index) => `${String(index + 1).padStart(2, '0')}-${name}`,
        );
        if (defect === 'missing image') captured.pop();
        if (defect === 'duplicate image') captured[1] = captured[0];
        writeFileSync(join(input, 'manifest.json'), JSON.stringify({ captured, errors: [] }));
        if (defect === 'wrong low preset') {
          copyFileSync(resolve(ROOT, `before-${names[0]}`), join(input, captured[0]));
          const sidecar = 'evidence-freehold-gate-desktop.json';
          const evidence = JSON.parse(readFileSync(resolve(ROOT, `before-${sidecar}`), 'utf8'));
          evidence.settings.graphicsPreset = 2;
          writeFileSync(join(input, sidecar), JSON.stringify(evidence));
        }
        const result = spawnSync(
          process.execPath,
          [
            'scripts/freehold_capture_receipt.mjs',
            '--before',
            input,
            '--after',
            input,
            '--performance',
            join(input, 'performance.json'),
            '--output',
            output,
            '--baseline-root',
            '.',
          ],
          { encoding: 'utf8' },
        );
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(
          defect === 'missing image'
            ? 'expected exactly nine producer captures'
            : defect === 'duplicate image'
              ? 'expected one producer image'
              : 'low graphics proof missing',
        );
        expect(existsSync(output)).toBe(false);
      } finally {
        rmSync(input, { recursive: true, force: true });
      }
    },
  );
});
