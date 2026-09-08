// @vitest-environment happy-dom
//
// The browser Fullscreen API pair moved whole out of src/main.ts into
// src/game/browser_fullscreen.ts: the transient-activation skip, the WebKit
// vendor fallbacks, the swallowed rejections, and the firewall pin that
// main.ts now only imports the two calls.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  currentFullscreenElement,
  exitBrowserFullscreen,
  requestBrowserFullscreen,
} from '../src/game/browser_fullscreen';
import { stripComments } from './helpers/strip_comments';

type Mutable = Record<string, unknown>;

function define(target: object, name: string, value: unknown): void {
  Object.defineProperty(target, name, { configurable: true, writable: true, value });
}

const DEFINED: Array<[object, string]> = [];
function stub(target: object, name: string, value: unknown): void {
  define(target, name, value);
  DEFINED.push([target, name]);
}

afterEach(() => {
  for (const [target, name] of DEFINED.splice(0)) delete (target as Mutable)[name];
  vi.restoreAllMocks();
});

const root = () => document.documentElement;
const active = (isActive: boolean) => stub(navigator, 'userActivation', { isActive });

describe('currentFullscreenElement', () => {
  it('is null when nothing is fullscreen', () => {
    stub(document, 'fullscreenElement', null);
    expect(currentFullscreenElement()).toBeNull();
  });

  it('is null when the API is absent altogether', () => {
    stub(document, 'fullscreenElement', undefined);
    expect(currentFullscreenElement()).toBeNull();
  });

  it('reads the standard element first, then the WebKit one', () => {
    const standard = document.createElement('div');
    const webkit = document.createElement('span');
    stub(document, 'fullscreenElement', standard);
    stub(document, 'webkitFullscreenElement', webkit);
    expect(currentFullscreenElement()).toBe(standard);
    stub(document, 'fullscreenElement', null);
    expect(currentFullscreenElement()).toBe(webkit);
  });
});

describe('requestBrowserFullscreen', () => {
  it('asks the root element once under an active user gesture', () => {
    stub(document, 'fullscreenElement', null);
    const request = vi.fn(() => Promise.resolve());
    stub(root(), 'requestFullscreen', request);
    active(true);
    requestBrowserFullscreen();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.instances[0]).toBe(root());
  });

  it('skips the call it already knows will be refused (no transient activation)', () => {
    stub(document, 'fullscreenElement', null);
    const request = vi.fn(() => Promise.resolve());
    stub(root(), 'requestFullscreen', request);
    active(false);
    requestBrowserFullscreen();
    expect(request).not.toHaveBeenCalled();
  });

  it('still attempts it on a browser without userActivation', () => {
    stub(document, 'fullscreenElement', null);
    const request = vi.fn(() => Promise.resolve());
    stub(root(), 'requestFullscreen', request);
    stub(navigator, 'userActivation', undefined);
    requestBrowserFullscreen();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does nothing while already fullscreen', () => {
    stub(document, 'fullscreenElement', document.createElement('div'));
    const request = vi.fn(() => Promise.resolve());
    stub(root(), 'requestFullscreen', request);
    active(true);
    requestBrowserFullscreen();
    expect(request).not.toHaveBeenCalled();
  });

  it('falls back to the WebKit request when the standard one is absent', () => {
    stub(document, 'fullscreenElement', null);
    stub(root(), 'requestFullscreen', undefined);
    const webkit = vi.fn(() => undefined);
    stub(root(), 'webkitRequestFullscreen', webkit);
    active(true);
    requestBrowserFullscreen();
    expect(webkit).toHaveBeenCalledTimes(1);
    expect(webkit.mock.instances[0]).toBe(root());
  });

  it('is a no-op without any request method', () => {
    stub(document, 'fullscreenElement', null);
    stub(root(), 'requestFullscreen', undefined);
    stub(root(), 'webkitRequestFullscreen', undefined);
    active(true);
    expect(() => requestBrowserFullscreen()).not.toThrow();
  });

  it('swallows a rejected request and a synchronous throw', async () => {
    stub(document, 'fullscreenElement', null);
    active(true);
    stub(root(), 'requestFullscreen', () => Promise.reject(new Error('not allowed')));
    expect(() => requestBrowserFullscreen()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    stub(root(), 'requestFullscreen', () => {
      throw new Error('not allowed');
    });
    expect(() => requestBrowserFullscreen()).not.toThrow();
  });
});

describe('exitBrowserFullscreen', () => {
  it('exits once while fullscreen', () => {
    stub(document, 'fullscreenElement', document.createElement('div'));
    const exit = vi.fn(() => Promise.resolve());
    stub(document, 'exitFullscreen', exit);
    exitBrowserFullscreen();
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('does nothing when nothing is fullscreen', () => {
    stub(document, 'fullscreenElement', null);
    const exit = vi.fn(() => Promise.resolve());
    stub(document, 'exitFullscreen', exit);
    exitBrowserFullscreen();
    expect(exit).not.toHaveBeenCalled();
  });

  it('falls back to the WebKit exit', () => {
    stub(document, 'fullscreenElement', null);
    stub(document, 'webkitFullscreenElement', document.createElement('div'));
    stub(document, 'exitFullscreen', undefined);
    const webkit = vi.fn(() => undefined);
    stub(document, 'webkitExitFullscreen', webkit);
    exitBrowserFullscreen();
    expect(webkit).toHaveBeenCalledTimes(1);
  });

  it('swallows a rejected exit and a synchronous throw', async () => {
    stub(document, 'fullscreenElement', document.createElement('div'));
    stub(document, 'exitFullscreen', () => Promise.reject(new Error('changing state')));
    expect(() => exitBrowserFullscreen()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    stub(document, 'exitFullscreen', () => {
      throw new Error('changing state');
    });
    expect(() => exitBrowserFullscreen()).not.toThrow();
  });
});

describe('src/main.ts imports the pair instead of defining it', () => {
  const main = stripComments(readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8'));

  it('defines none of the moved helpers', () => {
    for (const name of [
      'function currentFullscreenElement(',
      'function requestBrowserFullscreen(',
      'function exitBrowserFullscreen(',
      'type FullscreenDocument =',
      'type FullscreenElement =',
    ]) {
      expect(main).not.toContain(name);
    }
  });

  it('imports both calls from the module and still makes them', () => {
    expect(main).toContain(
      "import { exitBrowserFullscreen, requestBrowserFullscreen } from './game/browser_fullscreen';",
    );
    expect(main).toContain('requestBrowserFullscreen();');
    expect(main).toContain('exitBrowserFullscreen();');
  });
});
