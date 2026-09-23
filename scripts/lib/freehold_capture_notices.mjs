/** Wait for the real software-rendering notice decision, then dismiss visible UI.
 * A preflight DOM check alone races the performance nudge's later first check.
 * @param {import('puppeteer-core').Page} page
 * @param {boolean} mobile
 */
export async function settleFreeholdCaptureNotices(page, mobile) {
  const resolution = await page.waitForFunction(
    () => {
      if (document.getElementById('gpu-notice')) return 'boot-notice';
      if (document.getElementById('perf-nudge')) return 'performance-notice';
      return localStorage.getItem('woc_perf_nudge_dismissed') === 'hardware-acceleration'
        ? 'prior-performance-dismissal'
        : false;
    },
    { timeout: 45_000 },
  );
  const noticeResolution = await resolution.jsonValue();
  await resolution.dispose();
  const dismissedIds = [];
  for (const id of ['gpu-notice', 'perf-nudge']) {
    const selector = `#${id}:not([hidden]) .${id}-dismiss`;
    if (!(await page.$(selector))) continue;
    if (mobile) await page.tap(selector);
    else await page.click(selector);
    await page.waitForSelector(selector, { hidden: true });
    dismissedIds.push(id);
  }
  return { noticeResolution, dismissedIds };
}

/** One in-page pass over the arrival overlays that can cover a Freehold frame:
 * the New Adventurer card (`.tut-card`), the Eastbrook ferry note
 * (`#tutorial-greeting`, whose guidance variant is declined, never accepted)
 * and the camera prompt. Located by id, class and data attribute only, never
 * by rendered text, so a localized run finds the same controls. Runs in the
 * page; returns what it dismissed this pass.
 * @returns {string[]}
 */
export function freeholdOverlayPass() {
  const shown = (element) =>
    Boolean(element) &&
    getComputedStyle(element).display !== 'none' &&
    getComputedStyle(element).visibility !== 'hidden';
  const dismissed = [];
  const card = document.querySelector('.tut-card');
  const skip = card?.querySelector('.tut-skip');
  if (shown(card) && skip) {
    skip.click();
    dismissed.push('tutorial-card');
  }
  const note = document.getElementById('tutorial-greeting');
  if (shown(note)) {
    const decline = note.querySelector('[data-guidance="off"]');
    const close = note.querySelector('[data-close]');
    if (decline) {
      decline.click();
      dismissed.push('tutorial-greeting:guidance-off');
    } else if (close) {
      close.click();
      dismissed.push('tutorial-greeting:close');
    } else dismissed.push('tutorial-greeting:no-control');
  }
  const camera = document.querySelector('.camera-prompt-backdrop');
  if (shown(camera)) {
    document.querySelector('.camera-prompt-confirm')?.click();
    dismissed.push('camera-prompt');
  }
  return dismissed;
}

/** Poll the arrival overlays until several consecutive passes find none. One
 * quiet pass proves nothing: the ferry note and the tutorial card arrive on
 * the sim's own timers, after a single check would have returned. Throws
 * rather than photograph a frame an overlay still covers.
 * @param {import('puppeteer-core').Page} page
 */
export async function settleFreeholdCaptureOverlays(
  page,
  { quietPasses = 3, pollMs = 400, maxPasses = 50 } = {},
) {
  const dismissedOverlays = [];
  let quiet = 0;
  for (let pass = 0; pass < maxPasses; pass++) {
    const dismissed = await page.evaluate(freeholdOverlayPass);
    if (dismissed.includes('tutorial-greeting:no-control'))
      throw new Error('Freehold capture overlay has no locale-independent control');
    dismissedOverlays.push(...dismissed);
    quiet = dismissed.length === 0 ? quiet + 1 : 0;
    if (quiet >= quietPasses) return { dismissedOverlays };
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`Freehold capture overlays did not settle: ${dismissedOverlays.join(', ')}`);
}
