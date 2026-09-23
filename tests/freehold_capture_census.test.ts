// The capture's DOM census (scripts/lib/freehold_capture_census.mjs), driven
// through its `env` seam with a fake document: the gate prompt's controls and
// what the frame shows at each one's centre, focus, the viewport fit, and the
// transient HUD list.
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_TRANSIENT_HUD,
  freeholdCaptureCensus,
} from '../scripts/lib/freehold_capture_census.mjs';

type Box = { left: number; top: number; width: number; height: number };
type FakeNode = {
  id: string;
  tagName: string;
  box: Box;
  fontSize?: number;
  focusKey?: string;
  text?: string;
  children?: FakeNode[];
  hidden?: boolean;
  display?: string;
};

function fake(node: FakeNode) {
  const element = {
    id: node.id,
    tagName: node.tagName,
    textContent: node.text ?? '',
    children: node.children ?? [],
    getAttribute: (name: string) => (name === 'data-focus-key' ? (node.focusKey ?? null) : null),
    getBoundingClientRect: () => ({
      ...node.box,
      right: node.box.left + node.box.width,
      bottom: node.box.top + node.box.height,
    }),
    checkVisibility: () => !node.hidden,
    contains: (other: unknown) =>
      other === element || (node.children ?? []).includes(other as never),
    node,
  };
  return element;
}
type FakeElement = ReturnType<typeof fake>;

function census(options: {
  dialog?: FakeNode | null;
  controls?: FakeNode[];
  // What elementFromPoint answers at a control's centre, by control id.
  hitAt?: (control: FakeElement) => unknown;
  active?: 'first-control' | 'body' | null;
  transient?: Record<string, FakeNode[]>;
  innerWidth?: number;
}) {
  const controls = (options.controls ?? []).map(fake);
  const dialog =
    options.dialog === null
      ? null
      : Object.assign(
          fake(
            options.dialog ?? {
              id: 'freehold-gate-window',
              tagName: 'DIV',
              box: { left: 100, top: 100, width: 400, height: 300 },
            },
          ),
          {
            // Honours the selector list, so a query that drops a tag drops it here.
            querySelectorAll: (selector: string) =>
              controls.filter((c) => selector.split(',').includes(c.tagName.toLowerCase())),
          },
        );
  const transient = Object.fromEntries(
    Object.entries(options.transient ?? {}).map(([selector, nodes]) => [selector, nodes.map(fake)]),
  );
  const body = { id: '', getAttribute: () => null };
  const doc = {
    getElementById: (id: string) => (id === 'freehold-gate-window' ? dialog : null),
    querySelectorAll: (selector: string) => transient[selector] ?? [],
    elementFromPoint: (x: number, y: number) => {
      const control = controls.find((c) => {
        const b = c.getBoundingClientRect();
        return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
      });
      return control ? (options.hitAt?.(control) ?? control) : null;
    },
    activeElement:
      options.active === 'first-control' ? controls[0] : options.active === 'body' ? body : null,
  };
  return freeholdCaptureCensus({
    transient: FREEHOLD_TRANSIENT_HUD,
    document: doc,
    getComputedStyle: (element: never) => {
      const node = (element as FakeElement).node;
      return { display: node.display ?? 'block', fontSize: `${node.fontSize ?? 12}px` };
    },
    innerWidth: options.innerWidth ?? 1000,
    innerHeight: 800,
  });
}

const button = (id: string, left: number, focusKey?: string): FakeNode => ({
  id,
  tagName: 'BUTTON',
  box: { left, top: 300, width: 80, height: 40 },
  focusKey,
});

describe('freeholdCaptureCensus: the gate prompt', () => {
  it('lists every sized control with its tag, font and whether it is on top', () => {
    const label: FakeNode = {
      id: 'label',
      tagName: 'SPAN',
      box: { left: 210, top: 300, width: 20, height: 40 },
    };
    const result = census({
      controls: [
        { ...button('gate-own-tab', 110), children: [label] },
        {
          id: 'gate-home',
          tagName: 'SELECT',
          box: { left: 200, top: 350, width: 200, height: 40 },
          fontSize: 16,
          focusKey: 'gate-home',
        },
        {
          id: 'note',
          tagName: 'TEXTAREA',
          box: { left: 110, top: 200, width: 200, height: 60 },
          fontSize: 15,
        },
        button('gate-enter', 300, 'gate-enter'),
        { id: 'gate-name', tagName: 'INPUT', box: { left: 0, top: 0, width: 0, height: 0 } },
      ],
      // The tab's centre shows its own label span; the enter button is covered.
      hitAt: (control) =>
        control.id === 'gate-own-tab'
          ? control.children[0]
          : control.id === 'gate-enter'
            ? { id: 'toast' }
            : control,
      active: 'first-control',
    });
    expect(result.promptVisible).toBe(true);
    expect(result.controls).toEqual([
      { key: null, tag: 'button', width: 80, height: 40, fontSize: 12, onTop: true },
      { key: 'gate-home', tag: 'select', width: 200, height: 40, fontSize: 16, onTop: true },
      { key: null, tag: 'textarea', width: 200, height: 60, fontSize: 15, onTop: true },
      { key: 'gate-enter', tag: 'button', width: 80, height: 40, fontSize: 12, onTop: false },
    ]);
    expect([result.focusId, result.focusKey]).toEqual(['gate-own-tab', null]);
  });

  it('reports no prompt, no controls and no focus id when the prompt is shut', () => {
    for (const dialog of [
      null,
      {
        id: 'freehold-gate-window',
        tagName: 'DIV',
        box: { left: -50, top: 0, width: 10, height: 10 },
        display: 'none',
      },
    ]) {
      const result = census({ dialog, controls: [button('gate-enter', 300)], active: 'body' });
      expect(result.promptVisible).toBe(false);
      expect(result.controls).toEqual([]);
      expect(result.focusId).toBeNull();
      // A shut prompt cannot escape the viewport.
      expect(result.promptFitsViewport).toBe(true);
    }
  });

  it('fits the viewport only while all four edges are inside it', () => {
    const at = (left: number, top: number, width: number) =>
      census({
        dialog: {
          id: 'freehold-gate-window',
          tagName: 'DIV',
          box: { left, top, width, height: 300 },
        },
      }).promptFitsViewport;
    expect(at(100, 100, 400)).toBe(true);
    expect(at(-1, 100, 400)).toBe(false);
    expect(at(100, -1, 400)).toBe(false);
    expect(at(700, 100, 400)).toBe(false);
    expect(at(100, 501, 400)).toBe(false);
  });
});

describe('freeholdCaptureCensus: transient HUD', () => {
  const shell = (text = '', extra: Partial<FakeNode> = {}): FakeNode => ({
    id: 'x',
    tagName: 'DIV',
    box: { left: 0, top: 0, width: 300, height: 40 },
    text,
    ...extra,
  });

  it('counts a message shell only once it holds content, and only while it shows', () => {
    expect(census({ transient: { '#error-msg': [shell()] } }).transientOverlays).toEqual([]);
    expect(census({ transient: { '#error-msg': [shell('  ')] } }).transientOverlays).toEqual([]);
    expect(
      census({ transient: { '#error-msg': [shell('Out of range')] } }).transientOverlays,
    ).toEqual(['#error-msg']);
    const child = shell('', { children: [shell('Level 7')] });
    expect(census({ transient: { '#quest-banner': [child] } }).transientOverlays).toEqual([
      '#quest-banner',
    ]);
    expect(
      census({ transient: { '#error-msg': [shell('Out of range', { hidden: true })] } })
        .transientOverlays,
    ).toEqual([]);
    const flat = shell('Out of range', { box: { left: 0, top: 0, width: 0, height: 40 } });
    expect(census({ transient: { '#error-msg': [flat] } }).transientOverlays).toEqual([]);
  });

  it('counts a layer that needs no content as soon as any match shows', () => {
    expect(census({ transient: { '#low-health-vignette': [shell()] } }).transientOverlays).toEqual([
      '#low-health-vignette',
    ]);
    const numbers = [shell('', { hidden: true }), shell('-12')];
    expect(census({ transient: { '.fct': numbers } }).transientOverlays).toEqual(['.fct']);
  });

  it('watches every transient layer the HUD paints over the world', () => {
    expect(FREEHOLD_TRANSIENT_HUD.map(([selector]) => selector)).toEqual([
      '#error-msg',
      '#quest-banner',
      '#raid-warning-banner',
      '#banner',
      '#subzone-banner',
      '#tooltip',
      '#loot-rolls',
      '.fct',
      '#low-health-vignette',
      '#death-overlay',
      '#ready-check-leader-window',
      '#dfinder-proposal-popup',
      '#bg-proposal-popup',
      '#entry-guard-banner',
      '#discord-cta-banner',
      '#desktop-update-toast',
    ]);
  });
});
