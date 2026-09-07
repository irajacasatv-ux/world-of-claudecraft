// Produce sealed, deterministic development evidence without registering content.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--out') {
  throw new Error(
    'Usage: node scripts/freeholds/crafted_economy_measure.mjs --out <new-evidence-directory>',
  );
}
const outputDir = path.resolve(repo, args[1]);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const temp = await mkdtemp(path.join(tmpdir(), 'crafted-economy-'));
try {
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
  const captured = new Map();
  const outfile = path.join(temp, 'probe.cjs');
  const bundle = await build({
    absWorkingDir: repo,
    entryPoints: ['scripts/freeholds/crafted_economy_probe.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    metafile: true,
    logLevel: 'silent',
    plugins: [
      {
        name: 'seal-inputs',
        setup(builder) {
          builder.onLoad({ filter: /\.(?:[cm]?[jt]sx?|json)$/ }, async ({ path: inputPath }) => {
            const contents = await readFile(inputPath);
            captured.set(path.resolve(inputPath), contents);
            const extension = path.extname(inputPath);
            const loader =
              extension === '.json'
                ? 'json'
                : extension === '.tsx'
                  ? 'tsx'
                  : extension === '.jsx'
                    ? 'jsx'
                    : /\.[cm]?ts$/.test(extension)
                      ? 'ts'
                      : 'js';
            return { contents, loader };
          });
        },
      },
    ],
  });
  const sourcePaths = [
    ...new Set([
      ...Object.keys(bundle.metafile.inputs),
      'scripts/freeholds/crafted_economy_measure.mjs',
      'pnpm-lock.yaml',
      'docs/freeholds/content-trial-2026-09-07/acceptance.md',
      'docs/freeholds/content-numbers-workbook.md',
      'docs/freeholds/content-manifest.md',
    ]),
  ].sort();
  const sources = [];
  for (const inputPath of sourcePaths) {
    const absolute = path.resolve(repo, inputPath);
    const bytes = captured.get(absolute) ?? (await readFile(absolute));
    if (Object.hasOwn(bundle.metafile.inputs, inputPath) && !captured.has(absolute)) {
      throw new Error(`Unsealed bundle input ${inputPath}`);
    }
    sources.push({ path: inputPath, bytes: bytes.length, sha256: hash(bytes) });
  }
  const run = () =>
    execFileSync(process.execPath, [outfile], {
      cwd: repo,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 64 * 1024 * 1024,
    });
  const first = run();
  if (first !== run()) throw new Error('Repeated probe differs');
  for (const input of sources) {
    if (hash(await readFile(path.resolve(repo, input.path))) !== input.sha256) {
      throw new Error(`Source changed during measurement: ${input.path}`);
    }
  }
  if (
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim() !==
    sourceCommit
  ) {
    throw new Error('HEAD changed during measurement');
  }
  const result = JSON.parse(first);
  const evidence = {
    sourceCommit,
    nodeVersion: process.version,
    sourceGraphSha256: hash(JSON.stringify(sources)),
    probeSha256: hash(first),
    repeatByteIdentical: true,
    ...result,
  };
  await mkdir(outputDir, { recursive: true });
  // Refuse to overwrite a retained measurement or acceptance artifact.
  const bytes = `${JSON.stringify(evidence, null, 2)}\n`;
  await writeFile(path.join(outputDir, 'economy-measurements.json'), bytes, { flag: 'wx' });
  await writeFile(
    path.join(outputDir, 'economy-source-hashes.json'),
    `${JSON.stringify(sources, null, 2)}\n`,
    { flag: 'wx' },
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        artifactSha256: hash(bytes),
        checks: result.checks,
        rows: result.rows.map((r) => ({
          itemId: r.recipe.resultItemId,
          inputCopper: r.inputCopper,
          minimumCopper: r.minimumIncludingJackSensitivityCopper,
          sellValue: r.sellValue,
          reagents: r.recipe.reagents,
          craftFeeCopper: r.craftFeeCopper,
          marks: r.pattern?.marks ?? null,
        })),
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
