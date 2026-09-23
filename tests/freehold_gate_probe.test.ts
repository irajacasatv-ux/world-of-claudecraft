// The capture's arch-on-screen probe (scripts/lib/freehold_gate_probe.mjs),
// driven through its `env` seam: a fake camera that projects x/10, y/10, a fake
// raycaster that returns the hits a case plants, and fake DOM elements. The gate
// sits at the origin facing 0, so its three sample points land on screen at
// plinth-left (415, 450), plinth-right (585, 450) and the keystone (500, 275).
import { describe, expect, it } from 'vitest';
import { freeholdGateDrawnProbe } from '../scripts/lib/freehold_gate_probe.mjs';

class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  sub(v: Vec3) {
    return this.set(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  length() {
    return Math.hypot(this.x, this.y, this.z);
  }
  normalize() {
    const n = this.length() || 1;
    return this.set(this.x / n, this.y / n, this.z / n);
  }
  project(camera: { offScreen?: boolean }) {
    return this.set(camera.offScreen ? 3 : this.x / 10, this.y / 10, 0.5);
  }
}

type Rect = { left: number; top: number; right: number; bottom: number };
const rect = (left: number, top: number, right: number, bottom: number): Rect => ({
  left,
  top,
  right,
  bottom,
});
type FakeElement = {
  tagName: string;
  id: string;
  box: Rect;
  style?: Record<string, string>;
  pseudo?: Record<string, Record<string, string>>;
  text?: Rect[];
  alpha?: number;
  classes?: string[];
  hidden?: boolean;
};
const NONE = { backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none' };

function probe(
  options: {
    elements?: FakeElement[];
    hits?: object[];
    viewVisible?: boolean;
    attached?: boolean;
    offScreen?: boolean;
  } = {},
) {
  const scene = { visible: true, parent: null, children: [] };
  const group = {
    visible: options.viewVisible ?? true,
    parent: options.attached === false ? null : scene,
  };
  const canvas = {
    getBoundingClientRect: () => ({ ...rect(0, 0, 1000, 1000), width: 1000, height: 1000 }),
  };
  const camera = {
    position: new Vec3(0, 2, 10),
    updateMatrixWorld() {},
    offScreen: options.offScreen,
  };
  const raycaster = {
    near: 0.1,
    far: 99,
    camera: 'original',
    set() {},
    intersectObjects: () => options.hits ?? [],
  };
  const elements = (options.elements ?? []).map((e) => ({
    tagName: e.tagName,
    id: e.id,
    classList: { contains: (c: string) => (e.classes ?? []).includes(c) },
    contains: () => false,
    checkVisibility: () => !e.hidden,
    getBoundingClientRect: () => e.box,
    width: 1000,
    height: 1000,
    getContext: () => ({ getImageData: () => ({ data: [0, 0, 0, e.alpha ?? 0] }) }),
    childNodes: (e.text ?? []).map((r) => ({ nodeType: 3, textContent: 'label', rects: [r] })),
    fake: e,
  }));
  const env = {
    game: {
      sim: {
        entities: new Map([
          [1, { id: 1, templateId: 'freehold_gate', pos: { x: 0, y: 0, z: 0 }, facing: 0 }],
        ]),
      },
      renderer: {
        views: new Map([[1, { group }]]),
        scene,
        camera,
        webgl: { domElement: canvas },
        raycaster,
      },
    },
    document: {
      body: { querySelectorAll: () => elements },
      createRange: () => {
        let node: { rects: Rect[] } | null = null;
        return {
          selectNodeContents: (n: { rects: Rect[] }) => {
            node = n;
          },
          getClientRects: () => node?.rects ?? [],
        };
      },
    },
    getComputedStyle: (element: { fake: FakeElement }, pseudo?: string) =>
      pseudo
        ? (element.fake.pseudo?.[pseudo] ?? { content: 'none', ...NONE })
        : { ...NONE, ...element.fake.style },
    innerWidth: 1000,
    innerHeight: 1000,
  };
  return { result: freeholdGateDrawnProbe(env), raycaster };
}

describe('freeholdGateDrawnProbe', () => {
  it('draws on a clear frame, puts every point where it projects, and restores the raycaster', () => {
    const { result, raycaster } = probe();
    expect(result.drawn).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.points.map((p) => [p.label, Math.round(p.sx), Math.round(p.sy)])).toEqual([
      ['plinth-left', 415, 450],
      ['plinth-right', 585, 450],
      ['keystone', 500, 275],
    ]);
    expect([raycaster.near, raycaster.far, raycaster.camera]).toEqual([0.1, 99, 'original']);
  });

  it('refuses a hidden or detached view and an off-screen arch', () => {
    expect(probe({ viewVisible: false }).result.reason).toBe('gate view hidden');
    expect(probe({ attached: false }).result.reason).toBe('gate view not in the scene');
    expect(probe({ offScreen: true }).result.reason).toBe('plinth-left: off screen');
  });

  it('refuses a visible mesh between the camera and a point, ignoring the arch itself and see-through ones', () => {
    const wall = { object: { isMesh: true, visible: true, name: 'wall', material: {} } };
    expect(probe({ hits: [wall] }).result.reason).toBe('plinth-left: wall');
    const hidden = { object: { isMesh: true, visible: false, name: 'proxy', material: {} } };
    const glass = {
      object: {
        isMesh: true,
        visible: true,
        name: 'glass',
        material: { transparent: true, opacity: 0.3 },
      },
    };
    const sprite = { object: { isMesh: false, visible: true, name: 'spark' } };
    expect(probe({ hits: [hidden, glass, sprite] }).result.drawn).toBe(true);
  });

  it('refuses an opaque panel over a point and passes a 0.55 scrim', () => {
    const panel = {
      tagName: 'DIV',
      id: 'panel',
      box: rect(450, 200, 550, 300),
      style: { backgroundColor: 'rgb(20, 20, 20)' },
    };
    expect(probe({ elements: [panel] }).result.reason).toBe('keystone: DIV#panel');
    const scrim = {
      tagName: 'DIV',
      id: 'mobile-window-backdrop',
      box: rect(0, 0, 1000, 1000),
      style: { backgroundColor: 'color(srgb 0.01 0.02 0.03 / 0.55)' },
    };
    expect(probe({ elements: [scrim] }).result.drawn).toBe(true);
    const heavy = {
      ...scrim,
      id: 'heavy',
      style: { backgroundColor: 'color(srgb 0.01 0.02 0.03 / 0.8)' },
    };
    expect(probe({ elements: [heavy] }).result.reason).toBe('plinth-left: DIV#heavy');
    expect(probe({ elements: [{ ...panel, hidden: true }] }).result.drawn).toBe(true);
  });

  it('counts a border only inside its own band, on every side', () => {
    const frame = (side: string) => ({
      tagName: 'DIV',
      id: side,
      box: rect(405, 400, 595, 460),
      style: { [`border${side}Width`]: '12px', [`border${side}Color`]: 'rgb(200, 150, 50)' },
    });
    // The plinth points (415/585, 450) sit inside the left, right and bottom
    // 12 px bands of this box, and far below its top band.
    expect(probe({ elements: [frame('Bottom')] }).result.reason).toBe('plinth-left: DIV#Bottom');
    expect(probe({ elements: [frame('Left')] }).result.reason).toBe('plinth-left: DIV#Left');
    expect(probe({ elements: [frame('Right')] }).result.reason).toBe('plinth-right: DIV#Right');
    expect(probe({ elements: [frame('Top')] }).result.drawn).toBe(true);
  });

  it('counts a filled pseudo-element and a text run only where its glyphs are', () => {
    const badge = {
      tagName: 'SPAN',
      id: 'badge',
      box: rect(480, 260, 520, 290),
      pseudo: { '::after': { content: '""', ...NONE, backgroundColor: 'rgb(0, 0, 0)' } },
    };
    expect(probe({ elements: [badge] }).result.reason).toBe('keystone: SPAN#badge::after');
    const row = { tagName: 'DIV', id: 'row', box: rect(300, 250, 700, 300) };
    expect(probe({ elements: [{ ...row, text: [rect(300, 250, 400, 300)] }] }).result.drawn).toBe(
      true,
    );
    expect(probe({ elements: [{ ...row, text: [rect(480, 250, 520, 300)] }] }).result.reason).toBe(
      'keystone: DIV#row text',
    );
  });

  it('reads the nameplate overlay by its pixels and takes any other canvas as painted', () => {
    const overlay = {
      tagName: 'CANVAS',
      id: '',
      box: rect(0, 0, 1000, 1000),
      classes: ['nameplate-canvas'],
    };
    expect(probe({ elements: [{ ...overlay, alpha: 0 }] }).result.drawn).toBe(true);
    expect(probe({ elements: [{ ...overlay, alpha: 200 }] }).result.reason).toBe(
      'plinth-left: CANVAS',
    );
    expect(probe({ elements: [{ ...overlay, classes: [], id: 'minimap' }] }).result.reason).toBe(
      'plinth-left: CANVAS#minimap',
    );
  });
});
