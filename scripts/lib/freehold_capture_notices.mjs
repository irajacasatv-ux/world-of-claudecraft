import { GREETING_DECLINE } from '../enter_offline_game.mjs';

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
 * every `.tut-card` (the New Adventurer card, and the noticeboard and realm
 * builder popups that reuse it) through its `.tut-skip`, and the Eastbrook
 * ferry note (`#tutorial-greeting`) and the professions tutorial
 * (`#profession-tutorial`) through their declining control, `decline`
 * (GREETING_DECLINE from scripts/enter_offline_game.mjs, passed in because
 * page.evaluate ships this function without its module). Located by id, class
 * and data attribute only, never by rendered text. An overlay that is up with
 * no such control reports `<name>:no-control` for the caller to refuse. Runs in
 * the page; returns what it found this pass.
 * @param {string} decline
 * @returns {string[]}
 */
export function freeholdOverlayPass(decline) {
  const shown = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  };
  const found = [];
  for (const card of document.querySelectorAll('.tut-card')) {
    if (!shown(card)) continue;
    const skip = card.querySelector('.tut-skip');
    if (skip) {
      skip.click();
      found.push('tutorial-card');
    } else found.push('tutorial-card:no-control');
  }
  const note = document.getElementById('tutorial-greeting');
  if (shown(note)) {
    const control = note.querySelector(decline);
    if (control) {
      control.click();
      found.push(
        control.hasAttribute('data-guidance')
          ? 'tutorial-greeting:guidance-off'
          : 'tutorial-greeting:close',
      );
    } else found.push('tutorial-greeting:no-control');
  }
  const professions = document.getElementById('profession-tutorial');
  if (shown(professions)) {
    const control = professions.querySelector(decline);
    if (control) {
      control.click();
      found.push('profession-tutorial');
    } else found.push('profession-tutorial:no-control');
  }
  return found;
}

/** Poll the arrival overlays until several consecutive passes find none. One
 * quiet pass proves nothing: the ferry note and the tutorial card arrive on
 * the sim's own timers, after a single check would have returned. Throws
 * rather than photograph a frame an overlay still covers. Returns the passes
 * it ran, so a record can tell a settle that ran from an empty list.
 * @param {import('puppeteer-core').Page} page
 */
export async function settleFreeholdCaptureOverlays(
  page,
  { quietPasses = 3, pollMs = 400, maxPasses = 50 } = {},
) {
  const dismissedOverlays = [];
  let quiet = 0;
  for (let pass = 1; pass <= maxPasses; pass++) {
    const found = await page.evaluate(freeholdOverlayPass, GREETING_DECLINE);
    const stuck = found.filter((entry) => entry.endsWith(':no-control'));
    if (stuck.length > 0)
      throw new Error(`Freehold capture overlay has no locale-independent control: ${stuck}`);
    dismissedOverlays.push(...found);
    quiet = found.length === 0 ? quiet + 1 : 0;
    if (quiet >= quietPasses) return { dismissedOverlays, passes: pass };
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`Freehold capture overlays did not settle: ${dismissedOverlays.join(', ')}`);
}
