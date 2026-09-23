#!/usr/bin/env node
// Seal completed producer output. This command never drives a browser or edits an image.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREEHOLD_CAMERA_BEHIND_TOLERANCE,
  FREEHOLD_GATE_STANCE,
  FREEHOLD_ROUTE_TOLERANCE,
  freeholdInteriorPerfFailures,
} from './freehold_interior_route.mjs';
import { baselineRuntimeRefusal, outputPlacementRefusal } from './lib/freehold_receipt_guards.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineCommit = '654071354172b3e252cfc03a1e85efde2daddaa6';
const views = { desktop: [1600, 900], compact: [874, 402], tablet: [1180, 820] };
const targets = ['freehold-gate', 'freehold-inn', 'freehold-cottage'];
// Keep the original capture seal order stable, then append newly participating sources.
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
  'src/render/foliage.ts',
  'src/sim/world_object_bootstrap.ts',
  'src/game/nearby_interaction_core.ts',
  'src/game/interactions.ts',
  'src/styles/base.css',
  'src/styles/tokens.css',
  'scripts/lib/gpu_notice_suppress.mjs',
  'scripts/lib/pr_shot_entry_opts.mjs',
  'scripts/browser_path.mjs',
  'scripts/browser_path_resolve.mjs',
  'scripts/perf_tour_entry_options.mjs',
  'scripts/lib/pr_shot_masterwrought.mjs',
  'src/game/camera_follow.ts',
  'src/game/offline_world_config.ts',
];
const runtimePaths = [
  'src',
  'public',
  'server',
  'headless',
  'index.html',
  'play.html',
  'package.json',
  'pnpm-lock.yaml',
  'patches',
  'vite.config.ts',
];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
// The evidence directory is excluded from Biome scans. Use an in-root JSON stdin
// path so normalized copies follow the repository formatter without touching raw producers.
const formatted = (value) =>
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules/@biomejs/biome/bin/biome'),
      'format',
      '--stdin-file-path=freehold-capture-receipt.json',
    ],
    { cwd: root, input: JSON.stringify(value), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
const requireEvidence = (condition, message) => {
  if (!condition) throw new Error(message);
};
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trimEnd();
const lines = (text) => (text ? text.split('\n') : []);
const read = (file) => {
  const bytes = fs.readFileSync(file);
  return { bytes, value: JSON.parse(bytes.toString('utf8')) };
};

try {
  const allowed = ['before', 'after', 'performance', 'output', 'baseline-root', 'baseline-url'];
  const options = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]?.replace(/^--/, '');
    requireEvidence(
      args[i].startsWith('--') && allowed.includes(name) && args[i + 1] && !options[name],
      `Expected --${allowed.join(' <value> --')} <value>`,
    );
    options[name] = args[i + 1];
  }
  for (const name of allowed.filter((name) => name !== 'baseline-url'))
    requireEvidence(options[name], `Missing --${name}`);

  // The authored gate site, as the measurements record states it (pinned equal to
  // EASTBROOK_LAYOUT by tests/freehold_layouts.test.ts, and sealed below), and the
  // tour's stance off it.
  const measured = read(path.join(root, 'docs/freeholds/art/space-measurements.json')).value;
  const gateSite = measured.gate.position;
  // Each room's arrival point (slot-0 origin plus the shared entry), pinned to
  // DUNGEONS and instanceOrigin by the same test.
  const arrivalOf = {
    'freehold-inn': measured.arrival.freehold_inn_room,
    'freehold-cottage': measured.arrival.freehold_cottage,
  };
  const gateStance = {
    x: gateSite[0] + FREEHOLD_GATE_STANCE.dx,
    z: gateSite[1] + FREEHOLD_GATE_STANCE.dz,
  };
  const pending = new Map();
  const captures = [];
  const rawFiles = [];
  const manifests = {};
  const preserve = (name, producer) => {
    const file = `${name}.raw.json`;
    const formattedFile = `${name}.json`;
    pending.set(file, producer.bytes);
    pending.set(formattedFile, Buffer.from(formatted(producer.value)));
    rawFiles.push({ file, sha256: sha256(producer.bytes), formattedFile });
  };

  for (const side of ['before', 'after']) {
    const directory = path.resolve(options[side]);
    const producer = read(path.join(directory, 'manifest.json'));
    const manifest = producer.value;
    requireEvidence(
      Array.isArray(manifest.captured) && manifest.captured.length === 9,
      `${side}: expected exactly nine producer captures`,
    );
    requireEvidence(Array.isArray(manifest.errors), `${side}: missing producer errors array`);
    manifests[side] = manifest;
    for (const target of targets) {
      for (const [variant, [width, height]] of Object.entries(views)) {
        const suffix = `${target}-${variant}.png`;
        const matches = manifest.captured.filter(
          (file) =>
            typeof file === 'string' &&
            new RegExp(`^\\d+-${suffix.replace('.', '\\.')}$`).test(file),
        );
        requireEvidence(matches.length === 1, `${side}: expected one producer image for ${suffix}`);
        const png = fs.readFileSync(path.join(directory, matches[0]));
        const sidecarName = `evidence-${target}-${variant}.json`;
        const sidecar = read(path.join(directory, sidecarName));
        const evidence = sidecar.value;
        requireEvidence(
          evidence.target === target &&
            evidence.variant === variant &&
            evidence.baseline === (side === 'before'),
          `${side}: mismatched sidecar ${sidecarName}`,
        );
        requireEvidence(
          evidence.viewport?.width === width &&
            evidence.viewport?.height === height &&
            Number.isFinite(evidence.viewport.dpr) &&
            evidence.viewport.dpr > 0,
          `${side}: mismatched viewport ${sidecarName}`,
        );
        requireEvidence(
          evidence.settings?.graphicsPreset === 1 &&
            evidence.settings.graphicsDefaultApplied === true &&
            evidence.rendererTier === 'low',
          `${side}: low graphics proof missing in ${sidecarName}`,
        );
        requireEvidence(
          evidence.theme?.preset === 'classic' &&
            /swiftshader/i.test(evidence.gpuRenderer) &&
            evidence.gpuNoticeVisible === false &&
            evidence.promptFitsViewport === true &&
            Array.isArray(evidence.transientOverlays) &&
            evidence.transientOverlays.length === 0 &&
            Array.isArray(evidence.dismissedOverlays) &&
            Number.isInteger(evidence.overlaySettlePasses) &&
            evidence.overlaySettlePasses >= 3,
          `${side}: obscured or mismatched capture ${sidecarName}`,
        );
        // Every gate frame holds the stance, and so does every baseline frame:
        // the release has no room, so each before scene stands where the after
        // gate frame stands.
        if (target === 'freehold-gate' || side === 'before') {
          const pos = evidence.player?.pos ?? {};
          const turn = Math.PI - evidence.player?.facing;
          // The tour holds the stance to its route tolerance (holdFreeholdGateStance),
          // which keeps the gate inside its press reach.
          requireEvidence(
            Math.hypot(pos.x - gateStance.x, pos.z - gateStance.z) <= FREEHOLD_ROUTE_TOLERANCE &&
              Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn))) <= 0.12 &&
              (side === 'before' || evidence.gateDrawn === true),
            `${side}: ${target === 'freehold-gate' ? 'gate' : 'baseline'} frame is off the gate stance, unsquared, or undrawn in ${sidecarName}`,
          );
        }
        // The follow camera's yaw sits behind the player (the stance hold
        // settles it in place; a room arrival snaps it), so matched frames look
        // the same way. The recorded input yaw, not the drawn rotation.
        const cameraTurn = evidence.camera?.inputYaw - evidence.player?.facing;
        requireEvidence(
          typeof evidence.camera?.inputYaw === 'number' &&
            typeof evidence.player?.facing === 'number' &&
            Math.abs(Math.atan2(Math.sin(cameraTurn), Math.cos(cameraTurn))) <=
              FREEHOLD_CAMERA_BEHIND_TOLERANCE,
          `${side}: camera is not behind the player in ${sidecarName}`,
        );
        // The after arm settles the GPU notices and the arrival overlays at the
        // stance before the press; the baseline arm opens no prompt. The frame's
        // notice resolution must be the one the stance settle recorded. That
        // proves the record's source, not which pass dismissed what: a second
        // settle after the press resolves the same way (the resolution follows
        // which notice mounted), so a dismissal after the press is refused by
        // the gate frame's focus check instead.
        requireEvidence(
          side === 'before'
            ? evidence.preSettle === null
            : Number.isInteger(evidence.preSettle?.overlays?.passes) &&
                evidence.preSettle.overlays.passes >= 3 &&
                Array.isArray(evidence.preSettle.overlays.dismissedOverlays) &&
                evidence.preSettle.notices?.noticeResolution === evidence.noticeResolution,
          `${side}: missing or misplaced stance settle in ${sidecarName}`,
        );
        requireEvidence(
          ['boot-notice', 'performance-notice', 'prior-performance-dismissal'].includes(
            evidence.noticeResolution,
          ),
          `${side}: unresolved GPU notice in ${sidecarName}`,
        );
        // A baseline frame is on the overworld by the stance check above.
        if (side === 'before')
          requireEvidence(
            evidence.promptVisible === false,
            `before: baseline frame shows a prompt in ${sidecarName}`,
          );
        else if (target === 'freehold-gate')
          // Usable: every control at least 40 px, uncovered, and on a touch
          // variant every text entry at the 16 px floor that stops iOS zooming;
          // focus on the selected tab, where the prompt puts it on open.
          requireEvidence(
            evidence.promptVisible === true &&
              Array.isArray(evidence.controls) &&
              evidence.controls.length > 3 &&
              evidence.controls.every(
                (control) =>
                  control.width >= 40 &&
                  control.height >= 40 &&
                  control.onTop === true &&
                  (variant === 'desktop' ||
                    !['input', 'select', 'textarea'].includes(control.tag) ||
                    control.fontSize >= 16),
              ) &&
              evidence.focusId === 'gate-own-tab',
            `after: gate frame has no usable prompt in ${sidecarName}`,
          );
        else
          requireEvidence(
            evidence.promptVisible === false &&
              evidence.player?.entrySeq > 0 &&
              evidence.player?.facing === 0 &&
              evidence.camera?.inputYaw === 0 &&
              Math.abs(evidence.player?.pos?.x - arrivalOf[target][0]) < 0.0005 &&
              Math.abs(evidence.player?.pos?.z - arrivalOf[target][1]) < 0.0005,
            `after: interior frame is not a settled room arrival in ${sidecarName}`,
          );
        requireEvidence(
          png.length >= 24 &&
            png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' &&
            png.readUInt32BE(16) === width * evidence.viewport.dpr &&
            png.readUInt32BE(20) === height * evidence.viewport.dpr,
          `${side}: invalid PNG dimensions for ${suffix}`,
        );
        const file = `${side}-${suffix}`;
        const evidenceFile = `${side}-${sidecarName}`;
        pending.set(file, png);
        pending.set(evidenceFile, sidecar.bytes);
        captures.push({
          file,
          sha256: sha256(png),
          evidence: evidenceFile,
          evidenceSha256: sha256(sidecar.bytes),
        });
      }
    }
    preserve(`${side}-manifest`, producer);
  }

  const performance = read(path.resolve(options.performance));
  requireEvidence(
    performance.value.scenario === 'bench_freehold_interiors' &&
      performance.value.requestedPreset === 'low' &&
      performance.value.gpuMode === 'real-gpu-headed',
    'Expected hardware Freehold low-tier performance',
  );
  requireEvidence(
    JSON.stringify(performance.value.results?.map((result) => result.viewport)) ===
      JSON.stringify(['desktop', 'mobile']),
    'Expected desktop and mobile performance results',
  );
  for (const result of performance.value.results) {
    requireEvidence(
      Array.isArray(result.errors) &&
        Array.isArray(result.budgetFailures) &&
        Array.isArray(result.samples),
      `${result.viewport}: incomplete performance producer`,
    );
    const failures = freeholdInteriorPerfFailures(result.samples);
    requireEvidence(failures.length === 0, `${result.viewport}: ${failures.join('; ')}`);
    requireEvidence(
      result.errors.length === 0 && result.budgetFailures.length === 0,
      `${result.viewport}: producer reported performance errors or budget failures`,
    );
  }
  preserve('performance', performance);

  const baselineRoot = path.resolve(options['baseline-root']);
  const baselineHead = git(baselineRoot, 'rev-parse', 'HEAD');
  const headRefusal = baselineRuntimeRefusal({
    head: baselineHead,
    expected: baselineCommit,
    applicationDiff: [],
    applicationUntracked: [],
  });
  requireEvidence(!headRefusal, headRefusal);
  const applicationDiff = lines(
    git(baselineRoot, 'diff', '--name-only', baselineCommit, '--', ...runtimePaths),
  );
  const applicationUntracked = lines(
    git(baselineRoot, 'ls-files', '--others', '--exclude-standard', '--', ...runtimePaths),
  );
  const runtimeRefusal = baselineRuntimeRefusal({
    head: baselineHead,
    expected: baselineCommit,
    applicationDiff,
    applicationUntracked,
  });
  requireEvidence(!runtimeRefusal, runtimeRefusal);
  const sourceInputs = sourcePaths.map((file) => ({
    path: file,
    sha256: sha256(fs.readFileSync(path.join(root, file))),
  }));
  const acceptance = {
    baselineCommit,
    baselineHarness: {
      sourceRoot: root,
      files: sourceInputs.filter((input) => input.path.startsWith('scripts/')),
      applicationDiff,
      applicationUntracked,
    },
    sourceIdentity: {
      observation: 'Verified when this receipt was generated, after capture producers completed.',
      current: {
        root,
        head: git(root, 'rev-parse', 'HEAD'),
        status: lines(git(root, 'status', '--porcelain=v1', '--untracked-files=all')),
      },
      baselineRuntime: {
        root: baselineRoot,
        head: baselineHead,
        url: options['baseline-url'] ?? null,
        status: lines(git(baselineRoot, 'status', '--porcelain=v1', '--untracked-files=all')),
        trackedRuntimeTrees: lines(
          git(baselineRoot, 'ls-tree', baselineCommit, '--', ...runtimePaths),
        ),
      },
    },
    producerInputs: {
      before: path.resolve(options.before),
      after: path.resolve(options.after),
      performance: path.resolve(options.performance),
    },
    notes: [
      'Before captures stand at the gate stance on the real release baseline, which has neither a Freehold Gate nor the authored rooms.',
      'Both sides are produced by the current capture harness against their separate running applications.',
      'Source identities are receipt-time checks, not a claim that the producers recorded Git state at capture time.',
      'Raw manifests and performance records are retained byte-for-byte, including every diagnostic array.',
      'Screenshot producer diagnostics require review; copying a record does not classify its errors as harmless.',
      'The zero performance requirement applies to new events from gate confirmation through rendered room samples.',
    ],
    diagnosticCounts: {
      before: manifests.before.errors.length,
      after: manifests.after.errors.length,
    },
    sourceInputs,
    performance: { file: 'performance.json', sha256: sha256(pending.get('performance.json')) },
    captures,
    rawFiles,
  };
  // Validate every input before changing existing evidence. Producer buffers are never mutated.
  const output = path.resolve(options.output);
  const placementRefusal = outputPlacementRefusal({
    output,
    before: path.resolve(options.before),
    after: path.resolve(options.after),
    performance: path.resolve(options.performance),
    files: [...pending.keys(), 'acceptance.json'],
  });
  requireEvidence(!placementRefusal, placementRefusal);
  const acceptanceBytes = formatted(acceptance);
  fs.mkdirSync(output, { recursive: true });
  for (const [file, bytes] of pending) fs.writeFileSync(path.join(output, file), bytes);
  fs.writeFileSync(path.join(output, 'acceptance.json'), acceptanceBytes);
  console.log(
    `Sealed ${captures.length} matched captures and ${rawFiles.length} unmodified producer records in ${output}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
