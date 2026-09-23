/** Transient HUD that can land over any Freehold capture frame, as
 * [selector, counts only once it holds content]. A message or banner shell
 * rests empty and counts once filled; the rest count once they show at all.
 * The arrival overlays the capture settles (the tutorial and popup cards, the
 * ferry note, the professions tutorial) are listed too, so one that lands
 * after the settle's last quiet pass is refused rather than photographed.
 * Passed to the census as `env.transient` (a page-shipped function cannot
 * close over a module constant). */
export const FREEHOLD_TRANSIENT_HUD = Object.freeze([
  Object.freeze(['#error-msg', true]),
  Object.freeze(['#quest-banner', true]),
  Object.freeze(['#raid-warning-banner', true]),
  Object.freeze(['#banner', true]),
  Object.freeze(['#subzone-banner', true]),
  Object.freeze(['#tooltip', true]),
  Object.freeze(['#loot-rolls', true]),
  Object.freeze(['.fct', false]),
  Object.freeze(['#low-health-vignette', false]),
  Object.freeze(['#death-overlay', false]),
  Object.freeze(['#ready-check-leader-window', false]),
  Object.freeze(['#dfinder-proposal-popup', true]),
  Object.freeze(['#bg-proposal-popup', true]),
  Object.freeze(['#entry-guard-banner', false]),
  Object.freeze(['#discord-cta-banner', false]),
  Object.freeze(['#desktop-update-toast', false]),
  Object.freeze(['.tut-card', false]),
  Object.freeze(['#tutorial-greeting', false]),
  Object.freeze(['#profession-tutorial', false]),
]);

/** The DOM half of one Freehold capture frame's evidence: the gate prompt's
 * controls (size, font, and whether each is what the frame shows at its
 * centre), where focus is, whether the prompt fits the viewport, and which
 * transient HUD shows. Self-contained so page.evaluate can ship it; a test
 * passes `env` fields standing in for the page globals. Known limit: a layer
 * with pointer-events:none is invisible to elementFromPoint, so it cannot mark
 * a control as covered.
 * @param {object} env
 */
export function freeholdCaptureCensus(env) {
  const doc = env.document ?? document;
  const styleOf = env.getComputedStyle ?? getComputedStyle;
  const viewW = env.innerWidth ?? innerWidth;
  const viewH = env.innerHeight ?? innerHeight;
  const shows = (element) => {
    if (!element?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  };
  const dialog = doc.getElementById('freehold-gate-window');
  const shown = Boolean(dialog) && styleOf(dialog).display !== 'none';
  const controls = shown
    ? [...dialog.querySelectorAll('button,input,select,textarea')]
        .map((control) => {
          const box = control.getBoundingClientRect();
          const hit = doc.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return {
            key: control.getAttribute('data-focus-key'),
            tag: control.tagName.toLowerCase(),
            width: box.width,
            height: box.height,
            fontSize: Number.parseFloat(styleOf(control).fontSize),
            onTop: hit === control || control.contains(hit),
          };
        })
        .filter((control) => control.width > 0 && control.height > 0)
    : [];
  const active = doc.activeElement;
  const box = shown ? dialog.getBoundingClientRect() : null;
  return {
    promptVisible: shown,
    controls,
    focusKey: active?.getAttribute?.('data-focus-key') ?? null,
    focusId: active?.id || null,
    promptFitsViewport:
      !box || (box.left >= 0 && box.top >= 0 && box.right <= viewW && box.bottom <= viewH),
    transientOverlays: env.transient
      .filter(([selector, needsContent]) =>
        [...doc.querySelectorAll(selector)].some(
          (element) =>
            shows(element) &&
            (!needsContent || element.textContent.trim() !== '' || element.children.length > 0),
        ),
      )
      .map(([selector]) => selector),
  };
}
