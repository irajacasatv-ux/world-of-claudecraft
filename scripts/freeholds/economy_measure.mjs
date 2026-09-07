#!/usr/bin/env node
// Reproduce local TUNING evidence. This tool cannot write runtime content or approvals.
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
  throw new Error('Usage: node scripts/freeholds/economy_measure.mjs --out <evidence-directory>');
}
const outputDir = path.resolve(repo, args[1]);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const temp = await mkdtemp(path.join(tmpdir(), 'freehold-economy-'));
try {
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
  const capturedInputs = new Map();
  const outfile = path.join(temp, 'replay.cjs');
  const bundle = await build({
    absWorkingDir: repo,
    entryPoints: ['scripts/freeholds/economy_replay.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    metafile: true,
    logLevel: 'silent',
    plugins: [
      {
        name: 'seal-measured-inputs',
        setup(builder) {
          builder.onLoad({ filter: /\.(?:[cm]?[jt]sx?|json)$/ }, async ({ path: inputPath }) => {
            const contents = await readFile(inputPath);
            capturedInputs.set(path.resolve(inputPath), contents);
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
      'scripts/freeholds/economy_measure.mjs',
      'docs/freeholds/content-numbers-workbook.md',
      'docs/freeholds/content-manifest.md',
      'docs/freeholds/state.md',
      'docs/freeholds/content-completion-checklist-2026-09-07.md',
    ]),
  ].sort();
  const sourceHashes = [];
  for (const sourcePath of sourcePaths) {
    const absolute = path.resolve(repo, sourcePath);
    const bytes = capturedInputs.get(absolute) ?? (await readFile(absolute));
    if (Object.hasOwn(bundle.metafile.inputs, sourcePath) && !capturedInputs.has(absolute)) {
      throw new Error(`Bundle input was not sealed: ${sourcePath}`);
    }
    sourceHashes.push({ path: sourcePath, bytes: bytes.length, sha256: sha256(bytes) });
  }
  const stdout = execFileSync(process.execPath, [outfile], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const measurements = JSON.parse(stdout);
  for (const source of sourceHashes) {
    if (sha256(await readFile(path.resolve(repo, source.path))) !== source.sha256) {
      throw new Error(`Source changed during measurement: ${source.path}`);
    }
  }
  if (
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim() !==
    sourceCommit
  ) {
    throw new Error('Git revision changed during measurement');
  }
  const evidence = {
    artifactId: 'freehold-economy-trial-v1',
    status: 'TUNING_PROPOSAL_AWAITING_OWNER_ACCEPTANCE',
    productionApproved: false,
    approvalIdentity: null,
    approvalDay: null,
    supersedes: null,
    sourceCommit,
    nodeVersion: process.version,
    sourceGraphSha256: sha256(JSON.stringify(sourceHashes)),
    measurementsSha256: sha256(JSON.stringify(measurements)),
    fixtureHashes: measurements.observations.map((row) => ({
      fixtureId: row.fixtureId,
      sha256: sha256(JSON.stringify(row)),
    })),
    measurements,
  };
  await mkdir(outputDir, { recursive: true });
  const evidenceBytes = `${JSON.stringify(evidence, null, 2)}\n`;
  await writeFile(path.join(outputDir, 'economy-measurements.json'), evidenceBytes);
  await writeFile(
    path.join(outputDir, 'economy-source-hashes.json'),
    `${JSON.stringify(sourceHashes, null, 2)}\n`,
  );
  process.stdout.write(
    `${JSON.stringify(
      {
        artifactSha256: sha256(evidenceBytes),
        sourceGraphSha256: evidence.sourceGraphSha256,
        measurementsSha256: evidence.measurementsSha256,
        observations: measurements.observations.map(
          ({
            fixtureId,
            attempts,
            failures,
            completedWithoutEligibleOutput,
            eligibleUnits,
            activeCastSeconds,
          }) => ({
            fixtureId,
            attempts,
            failures,
            completedWithoutEligibleOutput,
            eligibleUnits,
            activeCastSeconds,
          }),
        ),
        bills: measurements.ledger.bills.map(({ id, lines, sensitivityOnly }) => ({
          id,
          lines: lines.map(({ alternativeId, units, achievedUnitShare }) => ({
            alternativeId,
            units,
            achievedUnitShare,
          })),
          sensitivityOnly,
        })),
        vendor: measurements.vendor.rows,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
