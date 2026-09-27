// Evidence capture for the browser suites. A PR's before/after screenshots under
// docs/screenshots are taken on purpose, never as a side effect of a test run: an
// unconditional write rewrote tracked PNGs on every gate and once landed inside an
// unrelated commit. With VITE_EVIDENCE_CAPTURE=1 the shot is written where the
// caller says (a path relative to the calling suite, as page.screenshot takes it);
// without it nothing is written and the call waits two animation frames instead,
// so a suite still asserts after a real paint, as it did while every run captured.

import { page } from 'vitest/browser';

export async function captureEvidence(
  options: Parameters<typeof page.screenshot>[0] & { path: string },
): Promise<void> {
  if (import.meta.env.VITE_EVIDENCE_CAPTURE === '1') {
    await page.screenshot(options);
    return;
  }
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
