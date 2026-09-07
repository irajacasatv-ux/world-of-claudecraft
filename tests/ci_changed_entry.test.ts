import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

// The POSIX launch is the path this fixture can model; Windows uses npx.cmd.
it.skipIf(process.platform === 'win32')(
  'ci:changed launches Biome at repo root and propagates failure',
  () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-changed-entry-'));
    try {
      fs.writeFileSync(path.join(fixture, 'npx'), '#!/bin/sh\npwd\nexit 73\n', { mode: 0o755 });
      const result = spawnSync(process.execPath, [path.join(root, 'scripts/ci_changed.mjs')], {
        cwd: path.join(root, 'scripts'),
        env: {
          ...process.env,
          PATH: `${fixture}${path.delimiter}${process.env.PATH}`,
          GATE_SELECT_BASE: 'HEAD',
        },
        encoding: 'utf8',
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(73);
      expect(result.stdout.trim().split('\n').at(-1)).toBe(root);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  },
);
