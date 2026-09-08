#!/usr/bin/env node
// Seal completed producer output. This command never drives a browser or edits an image.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { freeholdInteriorPerfFailures } from './freehold_interior_route.mjs';

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
    const used = new Set();
    for (const target of targets) {
      for (const [variant, [width, height]] of Object.entries(views)) {
        const suffix = `${target}-${variant}.png`;
        const matches = manifest.captured.filter(
          (file) =>
            typeof file === 'string' &&
            new RegExp(`^\\d+-${suffix.replace('.', '\\.')}$`).test(file),
        );
        requireEvidence(matches.length === 1, `${side}: expected one producer image for ${suffix}`);
        used.add(matches[0]);
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
            evidence.promptFitsViewport === true,
          `${side}: obscured or mismatched capture ${sidecarName}`,
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
    requireEvidence(used.size === 9, `${side}: duplicate producer captures`);
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
  requireEvidence(
    baselineHead === baselineCommit,
    'Baseline runtime HEAD does not match the declared release',
  );
  const applicationDiff = lines(
    git(baselineRoot, 'diff', '--name-only', baselineCommit, '--', ...runtimePaths),
  );
  const applicationUntracked = lines(
    git(baselineRoot, 'ls-files', '--others', '--exclude-standard', '--', ...runtimePaths),
  );
  requireEvidence(
    applicationDiff.length === 0 && applicationUntracked.length === 0,
    'Baseline runtime has application changes; only the current capture harness may differ',
  );
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
      'Before captures show the real release-baseline quay, which has neither a Freehold Gate nor the authored rooms.',
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
  requireEvidence(
    ![options.before, options.after].some((input) => path.resolve(input) === output),
    'Output directory must differ from both producer directories',
  );
  requireEvidence(
    ![...pending.keys(), 'acceptance.json'].some(
      (file) => path.join(output, file) === path.resolve(options.performance),
    ),
    'Output must not overwrite the performance producer',
  );
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
