// No browser suite writes a screenshot as a side effect of a test run. A suite
// that captured on every run rewrote tracked PNGs under docs/screenshots on every
// gate (21 of them), and one unrelated commit landed the whole set by accident.
// Evidence is taken on purpose: through tests/browser/_evidence.ts, which writes
// only under VITE_EVIDENCE_CAPTURE=1, or in a suite gated by its own capture flag.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { expectScansOnlyThroughSharedWalkers } from './helpers/scan_guard_self_audit';
import { stripComments } from './helpers/strip_comments';
import { tsFilesUnder } from './helpers/ts_files_under';

const browserRoot = fileURLToPath(new URL('./browser', import.meta.url));
const suites = tsFilesUnder(browserRoot).map(({ file, full }) => ({
  file,
  code: stripComments(readFileSync(full, 'utf8')),
}));

// The suites that capture through their own flag, each named with the flag that
// gates it. A new direct `page.screenshot(` anywhere else fails below.
const GATED_SUITES: Record<string, string> = {
  'rewards_sidebar.browser.test.ts': 'import.meta.env.VITE_REWARDS_CAPTURE',
  'freehold_gate_input.browser.test.ts': 'import.meta.env.VITE_FREEHOLD_PRESENTATION_CAPTURE',
};

describe('browser evidence capture', () => {
  it('sees the browser suites', () => {
    expect(suites.length).toBeGreaterThanOrEqual(60);
  });

  it('writes a screenshot only through the flagged helper or a flag-gated suite', () => {
    const direct = suites
      .filter(({ code }) => code.includes('page.screenshot('))
      .map(({ file }) => file)
      .sort();
    expect(direct).toEqual(['_evidence.ts', ...Object.keys(GATED_SUITES)].sort());
    for (const [file, flag] of Object.entries(GATED_SUITES)) {
      const suite = suites.find((s) => s.file === file);
      expect(suite?.code, file).toContain(flag);
    }
  });

  it('captures in the helper only under VITE_EVIDENCE_CAPTURE=1', () => {
    const helper = suites.find(({ file }) => file === '_evidence.ts')?.code ?? '';
    const gate = helper.indexOf("if (import.meta.env.VITE_EVIDENCE_CAPTURE === '1') {");
    const shot = helper.indexOf('page.screenshot(');
    expect(gate).toBeGreaterThanOrEqual(0);
    // The one screenshot call sits inside that branch, which returns before the
    // paint-only fallback.
    expect(shot).toBeGreaterThan(gate);
    expect(helper.indexOf('return;', shot)).toBeLessThan(helper.indexOf('requestAnimationFrame'));
    expect(helper.split('page.screenshot(').length - 1).toBe(1);
  });

  it('scans only through the shared walker', () => {
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['ts_files_under']);
  });
});
