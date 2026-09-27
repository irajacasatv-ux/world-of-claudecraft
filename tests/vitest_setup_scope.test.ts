// The global Vitest setup stays framework-free, and the one suite that mounts
// Svelte carries the Svelte testing library itself. A global setup file loads
// before every file's first case, and '@testing-library/svelte/vitest' there
// cost each Node-env file about 80 ms of setup (12.9 s across a 160-file sample,
// 0.5 s without it) for a library only tests/admin mounts. Its per-case setup
// and unmount now come from tests/admin/_setup.ts, so a file that mounts Svelte
// without that import would leak its mounted trees between cases.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { tsFilesUnder } from './helpers/ts_files_under';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const read = (rel: string) => readFileSync(`${repoRoot}${rel}`, 'utf8');
const FRAMEWORK_IMPORT =
  /from\s+'(@testing-library\/[^']+|svelte[^']*)'|import\s+'(@testing-library\/[^']+|svelte[^']*)'/;
const SVELTE_TESTING_IMPORT = /(?:from\s+|import\s+)'@testing-library\/svelte(?:\/[^']*)?'/;
const ADMIN_SETUP_IMPORT = /^import\s+'(?:\.{1,2}\/)+(?:admin\/)?_setup';$/m;

function globalSetupFiles(): string[] {
  const config = read('vite.config.ts');
  const block = /\bsetupFiles:\s*\[([^\]]*)\]/.exec(config);
  if (!block) throw new Error('vite.config.ts: no test.setupFiles array');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1].replace(/^\.\//, ''));
}

describe('the Vitest setup scope', () => {
  it('loads no testing framework from a global setup file', () => {
    const files = globalSetupFiles();
    expect(files).toContain('tests/jsdom_local_storage_setup.ts');
    for (const file of files) {
      expect(FRAMEWORK_IMPORT.test(read(file)), `${file} imports a testing framework`).toBe(false);
    }
  });

  it('gives the admin setup the Svelte testing library per-case setup and unmount', () => {
    expect(read('tests/admin/_setup.ts')).toMatch(/^import '@testing-library\/svelte\/vitest';$/m);
  });

  it('every test file that imports the Svelte testing library imports the admin setup', () => {
    const mounting = tsFilesUnder(`${repoRoot}tests`)
      .filter(({ file }) => file !== 'admin/_setup.ts')
      .filter(({ full }) => SVELTE_TESTING_IMPORT.test(readFileSync(full, 'utf8')));
    // Positive control: the admin suite is the corpus, so an empty or tiny
    // match set means the pattern stopped seeing it.
    expect(mounting.map(({ file }) => file)).toContain('admin/app_shell.test.ts');
    expect(mounting.length).toBeGreaterThanOrEqual(20);
    const missing = mounting
      .filter(({ full }) => !ADMIN_SETUP_IMPORT.test(readFileSync(full, 'utf8')))
      .map(({ file }) => file);
    expect(missing).toEqual([]);
  });

  it('scans only through the shared walker', () => {
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['ts_files_under']);
  });
});
