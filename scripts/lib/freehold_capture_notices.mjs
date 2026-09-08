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
