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
// gates it. A screenshot call anywhere else fails below.
const GATED_SUITES: Record<string, string> = {
  'rewards_sidebar.browser.test.ts': 'import.meta.env.VITE_REWARDS_CAPTURE',
  'freehold_gate_input.browser.test.ts': 'import.meta.env.VITE_FREEHOLD_PRESENTATION_CAPTURE',
};

// Every screenshot call, however the receiver is spelled or spaced.
function screenshotCalls(code: string): number[] {
  return [...code.matchAll(/\.screenshot\s*\(/g)].map((m) => m.index ?? -1);
}

// The index of the brace closing the one opened at `openAt`.
function matchingBrace(code: string, openAt: number): number {
  let depth = 0;
  for (let i = openAt; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}' && --depth === 0) return i;
  }
  throw new Error('unbalanced braces');
}

describe('browser evidence capture', () => {
  it('sees the browser suites', () => {
    expect(suites.length).toBeGreaterThanOrEqual(60);
  });

  it('writes a screenshot only through the flagged helper or a flag-gated suite', () => {
    const direct = suites
      .filter(({ code }) => screenshotCalls(code).length > 0)
      .map(({ file }) => file)
      .sort();
    expect(direct).toEqual(['_evidence.ts', ...Object.keys(GATED_SUITES)].sort());
    for (const [file, flag] of Object.entries(GATED_SUITES)) {
      const code = suites.find((s) => s.file === file)?.code ?? '';
      const calls = screenshotCalls(code);
      // One capture per gated suite, and its flag is read before it.
      expect(calls, file).toHaveLength(1);
      const flagAt = code.indexOf(flag);
      expect(flagAt, file).toBeGreaterThanOrEqual(0);
      expect(flagAt, file).toBeLessThan(calls[0]);
    }
  });

  it('captures in the helper only inside the VITE_EVIDENCE_CAPTURE=1 branch', () => {
    const helper = suites.find(({ file }) => file === '_evidence.ts')?.code ?? '';
    const gate = "if (import.meta.env.VITE_EVIDENCE_CAPTURE === '1') {";
    const open = helper.indexOf(gate);
    expect(open).toBeGreaterThanOrEqual(0);
    const bodyStart = open + gate.length;
    const bodyEnd = matchingBrace(helper, bodyStart - 1);
    const body = helper.slice(bodyStart, bodyEnd);
    const outside = helper.slice(0, bodyStart) + helper.slice(bodyEnd);
    // The one capture sits inside the branch and the branch returns after it, so
    // the paint-only fallback below can never be followed by a capture.
    expect(screenshotCalls(body)).toHaveLength(1);
    expect(body.indexOf('return;')).toBeGreaterThan(screenshotCalls(body)[0]);
    expect(screenshotCalls(outside)).toHaveLength(0);
    expect(outside).toContain('requestAnimationFrame');
  });

  it('scans only through the shared walker', () => {
    expectScansOnlyThroughSharedWalkers(import.meta.url, ['ts_files_under']);
  });
});
