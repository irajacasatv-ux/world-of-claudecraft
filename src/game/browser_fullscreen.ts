// The browser Fullscreen API pair main.ts calls from the fullscreen setting
// and the world-entry preflight, moved here WHOLE out of src/main.ts (the
// firewall keeps only the two call sites). DOM and navigator only, no module
// state; the vendor-prefixed shapes cover WebKit.

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function currentFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function requestBrowserFullscreen(): void {
  if (currentFullscreenElement()) return;
  const root = document.documentElement as FullscreenElement;
  const request = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root);
  if (!request) return;
  // Fullscreen needs transient activation. Chrome logs a console error for every
  // call made without it, whether or not the rejection is caught, so skip the
  // call we already know will be refused. Browsers without userActivation still
  // attempt it, which is the previous behavior.
  if (navigator.userActivation && !navigator.userActivation.isActive) return;
  try {
    const result = request();
    if (result instanceof Promise) void result.catch(() => {});
  } catch {
    // Browsers can reject fullscreen outside a direct user gesture.
  }
}

export function exitBrowserFullscreen(): void {
  if (!currentFullscreenElement()) return;
  const doc = document as FullscreenDocument;
  try {
    const result = document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.();
    if (result instanceof Promise) void result.catch(() => {});
  } catch {
    // Fullscreen exit can also reject while the document is changing state.
  }
}
