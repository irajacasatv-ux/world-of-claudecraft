// The capture's arch-on-screen probe (scripts/lib/freehold_gate_probe.mjs),
// driven through its `env` seam: a fake camera that projects (x - ox)/10,
// (y - oy)/10 about the gate, a scene tree walked by traverseVisible, a
// recording raycaster class (the probe builds its own from the renderer's
// constructor) that only returns planted hits among the objects it is given
// and nearer than its `far`, and fake DOM elements. By default the gate sits
// at the origin facing 0, so the sample points land on screen at plinth-left
// (415, 450), plinth-right (585, 450) and the keystone (500, 275).
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  FREEHOLD_GATE_PROBE_POINTS,
  freeholdGateDrawnProbe,
} from '../scripts/lib/freehold_gate_probe.mjs';
import { buildStaticDoorBody } from '../src/render/door_portal';
import { archHit, DOOR_ARCH_GLB, doorArchTriangles, insideArch } from './helpers/door_arch_glb';

class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
  copy(v: Vec3) {
    return this.set(v.x, v.y, v.z);
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
  project(camera: FakeCamera) {
    return this.set(
      camera.ndcX ?? (camera.offScreenX ? 3 : (this.x - camera.origin.x) / 10),
      camera.ndcY ?? (camera.offScreenY ? 3 : (this.y - camera.origin.y) / 10),
      camera.beyondFar ? 1.5 : camera.beyondNear ? -1.5 : 0.5,
    );
  }
}

type FakeCamera = {
  position: Vec3;
  origin: { x: number; y: number };
  updateMatrixWorld(): void;
  offScreenX?: boolean;
  offScreenY?: boolean;
  ndcY?: number;
  ndcX?: number;
  beyondFar?: boolean;
  beyondNear?: boolean;
};
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
  box: Rect & { width?: number; height?: number };
  style?: Record<string, string>;
  pseudo?: Record<string, Record<string, string>>;
  text?: { rect: Rect; content?: string }[];
  alpha?: number;
  classes?: string[];
  hidden?: boolean;
  holdsCanvas?: boolean;
  noContext?: boolean;
};
type Node = {
  name: string;
  visible: boolean;
  parent: Node | null;
  children: Node[];
  isMesh?: boolean;
  material?: unknown;
};
type Planted = { object: Node; distance: number };
type Cast = {
  origin: Vec3;
  direction: Vec3;
  near: number;
  far: number;
  objects: unknown[];
  recursive: unknown;
};
const NONE = { backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none' };
const OPAQUE = { backgroundColor: 'rgb(20, 20, 20)' };

const node = (name: string, extra: Partial<Node> = {}): Node => ({
  name,
  visible: true,
  parent: null,
  children: [],
  ...extra,
});
const mesh = (name: string, extra: Partial<Node> = {}) =>
  node(name, { isMesh: true, material: {}, ...extra });
function attach(parent: Node, child: Node): Node {
  child.parent = parent;
  parent.children.push(child);
  return child;
}

function probe(
  options: {
    elements?: FakeElement[];
    // Objects placed in the scene (the builder attaches each one) and the
    // distance at which every ray would hit it.
    world?: (tree: { scene: Node; group: Node }) => Planted[];
    viewVisible?: boolean;
    attached?: boolean;
    sceneVisible?: boolean;
    noGate?: boolean;
    noView?: boolean;
    gate?: { x: number; y: number; z: number; facing: number };
    camera?: Partial<FakeCamera>;
    canvasRect?: Rect;
    innerWidth?: number;
    innerHeight?: number;
    canvasInList?: boolean;
    points?: readonly (readonly [string, number, number])[] | null;
  } = {},
) {
  const scene = node('scene', { visible: options.sceneVisible ?? true });
  const holder = attach(scene, node('views'));
  const group = node('gate-view', { visible: options.viewVisible ?? true });
  if (options.attached !== false) attach(holder, group);
  attach(group, mesh('arch'));
  const planted = options.world?.({ scene, group }) ?? [];
  const sceneWithWalk = Object.assign(scene, {
    traverseVisible(visit: (object: Node) => void) {
      const walk = (object: Node) => {
        if (!object.visible) return;
        visit(object);
        for (const child of object.children) walk(child);
      };
      walk(scene);
    },
  });
  const frame = options.canvasRect ?? rect(0, 0, 1000, 1000);
  const canvas = {
    tagName: 'CANVAS',
    id: 'game-canvas',
    getBoundingClientRect: () => ({
      ...frame,
      width: frame.right - frame.left,
      height: frame.bottom - frame.top,
    }),
  };
  const gate = options.gate ?? { x: 0, y: 0, z: 0, facing: 0 };
  const camera: FakeCamera = {
    position: new Vec3(gate.x, gate.y + 2, gate.z + 10),
    origin: { x: gate.x, y: gate.y },
    updateMatrixWorld() {},
    ...options.camera,
  };
  const made: Recording[] = [];
  class Recording {
    near = 0.1;
    far = 99;
    camera: unknown = 'original';
    ray = new Vec3(7, 7, 7);
    origin = new Vec3();
    direction = new Vec3();
    casts: Cast[] = [];
    constructor() {
      made.push(this);
    }
    set(origin: Vec3, direction: Vec3) {
      this.origin = origin.clone();
      this.direction = direction.clone();
      this.ray.set(-1, -1, -1);
    }
    intersectObjects(objects: unknown[], recursive: unknown) {
      this.casts.push({
        origin: this.origin,
        direction: this.direction,
        near: this.near,
        far: this.far,
        objects,
        recursive,
      });
      return planted.filter((hit) => objects.includes(hit.object) && hit.distance <= this.far);
    }
  }
  const shared = new Recording();
  const fakes = (options.elements ?? []).map((e) => ({
    tagName: e.tagName,
    id: e.id,
    classList: { contains: (c: string) => (e.classes ?? []).includes(c) },
    contains: (other: unknown) => Boolean(e.holdsCanvas) && other === canvas,
    checkVisibility: () => !e.hidden,
    getBoundingClientRect: () => e.box,
    width: 1000,
    height: 1000,
    getContext: () =>
      e.noContext ? null : { getImageData: () => ({ data: [0, 0, 0, e.alpha ?? 0] }) },
    childNodes: (e.text ?? []).map((t) => ({
      nodeType: 3,
      textContent: t.content ?? 'label',
      rects: [t.rect],
    })),
    fake: e,
  }));
  // The game canvas itself, listed the way querySelectorAll('*') lists it.
  Object.assign(canvas, {
    classList: { contains: () => false },
    contains: (other: unknown) => other === canvas,
    checkVisibility: () => true,
    childNodes: [],
    fake: { tagName: 'CANVAS', id: 'game-canvas', box: frame, style: OPAQUE },
  });
  const elements = options.canvasInList ? [canvas, ...fakes] : fakes;
  const entities = options.noGate
    ? new Map()
    : new Map([
        [
          1,
          {
            id: 1,
            templateId: 'freehold_gate',
            pos: { x: gate.x, y: gate.y, z: gate.z },
            facing: gate.facing,
          },
        ],
      ]);
  const env = {
    points: options.points === null ? [] : (options.points ?? FREEHOLD_GATE_PROBE_POINTS),
    game: {
      sim: { entities },
      renderer: {
        views: new Map(options.noView ? [] : [[1, { group }]]),
        scene: sceneWithWalk,
        camera,
        webgl: { domElement: canvas },
        raycaster: shared,
      },
    },
    document: {
      body: { querySelectorAll: () => elements },
      createRange: () => {
        let text: { rects: Rect[] } | null = null;
        return {
          selectNodeContents: (n: { rects: Rect[] }) => {
            text = n;
          },
          getClientRects: () => text?.rects ?? [],
        };
      },
    },
    getComputedStyle: (element: { fake: FakeElement }, pseudo?: string) =>
      pseudo
        ? (element.fake.pseudo?.[pseudo] ?? { content: 'none', ...NONE })
        : { ...NONE, ...element.fake.style },
    innerWidth: options.innerWidth ?? 1000,
    innerHeight: options.innerHeight ?? 1000,
  };
  const result = freeholdGateDrawnProbe(env);
  return { result, shared, made, scene, group };
}

describe('freeholdGateDrawnProbe: geometry and the raycast', () => {
  it('draws on a clear frame, casting a private raycaster over the visible meshes only', () => {
    const { result, shared, made, scene, group } = probe({
      world: ({ scene }) => {
        const terrain = attach(scene, mesh('terrain'));
        const hiddenGroup = attach(scene, node('parked', { visible: false }));
        attach(hiddenGroup, mesh('pooled'));
        attach(scene, node('spark', { material: {} }));
        return [{ object: terrain, distance: 60 }];
      },
    });
    expect(result.drawn).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.points.map((p) => [p.label, Math.round(p.sx), Math.round(p.sy)])).toEqual([
      ['plinth-left', 415, 450],
      ['plinth-right', 585, 450],
      ['keystone', 500, 275],
    ]);
    // The renderer's shared raycaster (picking uses it) is never touched: the
    // probe built its own from the same constructor and cast only with that.
    expect(made).toHaveLength(2);
    const [, own] = made;
    expect(shared.casts).toEqual([]);
    expect([shared.near, shared.far, shared.camera]).toEqual([0.1, 99, 'original']);
    expect(shared.ray).toMatchObject({ x: 7, y: 7, z: 7 });
    // One cast per point: from the camera, toward the point, stopping 0.05 yd
    // short of it, over exactly the visible meshes outside the arch, flat.
    expect(own.casts).toHaveLength(3);
    const terrain = scene.children.find((child) => child.name === 'terrain');
    const targets = [
      [-1.7, 1, 0],
      [1.7, 1, 0],
      [0, 4.5, 0],
    ];
    own.casts.forEach((cast, i) => {
      const [x, y, z] = targets[i];
      const along = new Vec3(x, y, z).sub(new Vec3(0, 2, 10));
      const unit = along.clone().normalize();
      expect(cast.origin).toMatchObject({ x: 0, y: 2, z: 10 });
      expect(cast.direction.x).toBeCloseTo(unit.x, 9);
      expect(cast.direction.y).toBeCloseTo(unit.y, 9);
      expect(cast.direction.z).toBeCloseTo(unit.z, 9);
      expect(cast.far).toBeCloseTo(along.length() - 0.05, 9);
      expect(cast.near).toBe(0);
      expect(cast.objects).toEqual([terrain]);
      expect(cast.recursive).toBe(false);
    });
    expect(group.children.map((child) => child.name)).toEqual(['arch']);
  });

  it('turns the sample points by the gate facing at its real site, as three.js places them', () => {
    const gate = { x: -38.65, y: -0.79, z: -103.75, facing: 0.5 };
    const { made } = probe({ gate });
    const arch = new THREE.Object3D();
    arch.position.set(gate.x, gate.y, gate.z);
    arch.rotation.y = gate.facing;
    arch.updateMatrixWorld(true);
    const camera = new Vec3(gate.x, gate.y + 2, gate.z + 10);
    const casts = made[1].casts;
    expect(casts).toHaveLength(3);
    FREEHOLD_GATE_PROBE_POINTS.forEach(([, side, up], i) => {
      const world = arch.localToWorld(new THREE.Vector3(side, up, 0));
      const unit = new Vec3(world.x, world.y, world.z).sub(camera).normalize();
      expect(casts[i].direction.x).toBeCloseTo(unit.x, 9);
      expect(casts[i].direction.y).toBeCloseTo(unit.y, 9);
      expect(casts[i].direction.z).toBeCloseTo(unit.z, 9);
    });
  });

  it('refuses without points, a gate, its view, or an attached visible chain', () => {
    expect(probe({ points: null }).result.reason).toBe('no sample points');
    expect(probe({ noGate: true }).result.reason).toBe('no gate entity');
    expect(probe({ noView: true }).result.reason).toBe('no gate view');
    expect(probe({ viewVisible: false }).result.reason).toBe('gate view hidden');
    expect(probe({ attached: false }).result.reason).toBe('gate view not in the scene');
    expect(probe({ sceneVisible: false }).result.reason).toBe('gate view not in the scene');
  });

  it.each([
    ['ndc x past the canvas', { camera: { offScreenX: true } }],
    ['ndc y past the canvas', { camera: { offScreenY: true } }],
    // Past the canvas's top edge yet inside a taller viewport: only the ndc
    // bound refuses it.
    [
      'left of the canvas, inside the viewport',
      { camera: { ndcX: -1.2 }, canvasRect: rect(500, 0, 1500, 1000), innerWidth: 2000 },
    ],
    [
      'above the canvas, inside the viewport',
      { camera: { ndcY: 1.2 }, canvasRect: rect(0, 500, 1000, 1500), innerHeight: 2000 },
    ],
    ['beyond the far plane', { camera: { beyondFar: true } }],
    ['before the near plane', { camera: { beyondNear: true } }],
    ['left of the viewport', { canvasRect: rect(-600, 0, 400, 1000) }],
    ['right of the viewport', { innerWidth: 400 }],
    ['above the viewport', { canvasRect: rect(0, -600, 1000, 400) }],
    ['below the viewport', { innerHeight: 400 }],
  ])('refuses a point %s', (_, options) => {
    expect(probe(options as Parameters<typeof probe>[0]).result.reason).toBe(
      'plinth-left: off screen',
    );
  });

  it('refuses a colour-writing mesh in front, and only one nearer than the point', () => {
    const wall = (distance: number, extra: Partial<Node> = {}) =>
      probe({ world: ({ scene }) => [{ object: attach(scene, mesh('wall', extra)), distance }] });
    expect(wall(3).result.reason).toBe('plinth-left: wall');
    // Terrain beyond the arch (farther than the point) is not in front of it.
    expect(wall(40).result.drawn).toBe(true);
    // Mostly clear glass is looked through; at half opacity it hides the arch.
    expect(wall(3, { material: { transparent: true, opacity: 0.49 } }).result.drawn).toBe(true);
    expect(wall(3, { material: { transparent: true, opacity: 0.5 } }).result.reason).toBe(
      'plinth-left: wall',
    );
    for (const material of [{ colorWrite: false }, { visible: false }, undefined])
      expect(wall(3, { material }).result.drawn, JSON.stringify(material)).toBe(true);
    expect(wall(3, { material: [{ colorWrite: false }, {}] }).result.reason).toBe(
      'plinth-left: wall',
    );
  });

  it('never casts against the arch, a hidden subtree, or a non-mesh', () => {
    const { result, made } = probe({
      world: ({ scene, group }) => {
        const own = attach(group, mesh('arch-part'));
        const hidden = attach(scene, node('parked', { visible: false }));
        const pooled = attach(hidden, mesh('pooled'));
        const sprite = attach(scene, node('spark', { material: {} }));
        return [own, pooled, sprite].map((object) => ({ object, distance: 1 }));
      },
    });
    expect(result.drawn).toBe(true);
    for (const cast of made[1].casts) expect(cast.objects).toEqual([]);
  });
});

describe('freeholdGateDrawnProbe: the sample points sit on the real arch', () => {
  // The procedural body buildStaticDoorBody builds before the door-arch GLB
  // loads (the GLB replaces it in the browser; Node never loads it). Its
  // passage triangulates filled (the hole path dips below the outer shape's
  // base), so the control is a ray beside the arch, not through it.
  it('hits the arch body at every sample point and misses beside it', () => {
    const body = buildStaticDoorBody();
    body.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    const hits = (x: number, y: number) => {
      ray.set(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1));
      return ray.intersectObject(body, true);
    };
    for (const [label, side, up] of FREEHOLD_GATE_PROBE_POINTS)
      expect(hits(side, up).length, label).toBeGreaterThan(0);
    // The control: beside the arch, past its outer edge, nothing is hit.
    expect(hits(2.6, 1)).toEqual([]);
  });
});

describe('freeholdGateDrawnProbe: the sample points sit on the arch the browser draws', () => {
  // The door-arch GLB, read from disk and turned as door_portal.ts turns it.
  it('reads the file and the quarter turn door_portal.ts applies at load', () => {
    const code = readFileSync('src/render/door_portal.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/\s+/g, ' ');
    const load = code.slice(code.indexOf('loadGltf(DOOR_ARCH_ASSET_URL)'));
    expect(load.slice(0, 600)).toContain('scene.rotation.y = Math.PI / 2;');
    expect(DOOR_ARCH_GLB).toBe('public/models/props/dungeon_door_arch.glb');
  });

  it('hits the GLB arch at every sample point, and neither its open passage nor beside it', async () => {
    const triangles = await doorArchTriangles();
    expect(triangles.length).toBeGreaterThan(1000);
    // Within the stone itself (surface on both sides of the point along z),
    // not merely on a line some face of the arch meets.
    for (const [label, side, up] of FREEHOLD_GATE_PROBE_POINTS) {
      expect(archHit(triangles, side, up), label).toBe(true);
      expect(insideArch(triangles, side, up), `${label} inside`).toBe(true);
    }
    expect(insideArch(triangles, 0, 1)).toBe(false);
    // In front of the stone on the same line: one side only, so not within.
    expect(insideArch(triangles, -1.7, 1, 2)).toBe(false);
    expect(archHit(triangles, 0, 1)).toBe(false);
    expect(archHit(triangles, 2.6, 1)).toBe(false);
  });
});

describe('freeholdGateDrawnProbe: DOM paint', () => {
  it('ignores the game canvas and its ancestors', () => {
    const shell = {
      tagName: 'DIV',
      id: 'app',
      box: rect(0, 0, 1000, 1000),
      style: OPAQUE,
      holdsCanvas: true,
    };
    expect(probe({ canvasInList: true, elements: [shell] }).result.drawn).toBe(true);
  });

  it('refuses an opaque panel over a point and passes a 0.55 scrim', () => {
    const panel = { tagName: 'DIV', id: 'panel', box: rect(450, 200, 550, 300), style: OPAQUE };
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

  it.each(['IMG', 'svg', 'VIDEO'])('takes an %s over a point as paint', (tagName) => {
    const art = { tagName, id: 'art', box: rect(450, 200, 550, 300) };
    expect(probe({ elements: [art] }).result.reason).toBe(`keystone: ${tagName}#art`);
  });

  it('takes a background image over a point as paint', () => {
    const art = {
      tagName: 'DIV',
      id: 'art',
      box: rect(450, 200, 550, 300),
      style: { backgroundImage: 'url(frame.webp)' },
    };
    expect(probe({ elements: [art] }).result.reason).toBe('keystone: DIV#art');
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

  it('counts a pseudo-element only with content and a fill, on both sides', () => {
    const badge = (pseudo: string, fill: Record<string, string>, content = '""') => ({
      tagName: 'SPAN',
      id: 'badge',
      box: rect(480, 260, 520, 290),
      pseudo: { [pseudo]: { content, ...NONE, ...fill } },
    });
    const dark = { backgroundColor: 'rgb(0, 0, 0)' };
    expect(probe({ elements: [badge('::after', dark)] }).result.reason).toBe(
      'keystone: SPAN#badge::after',
    );
    expect(probe({ elements: [badge('::before', dark)] }).result.reason).toBe(
      'keystone: SPAN#badge::before',
    );
    expect(
      probe({ elements: [badge('::after', { backgroundImage: 'url(x.webp)' })] }).result.reason,
    ).toBe('keystone: SPAN#badge::after');
    expect(probe({ elements: [badge('::after', dark, 'none')] }).result.drawn).toBe(true);
  });

  it('counts a text run only where its glyphs are, and skips whitespace', () => {
    const row = { tagName: 'DIV', id: 'row', box: rect(300, 250, 700, 300) };
    const over = rect(480, 250, 520, 300);
    expect(
      probe({ elements: [{ ...row, text: [{ rect: rect(300, 250, 400, 300) }] }] }).result.drawn,
    ).toBe(true);
    expect(probe({ elements: [{ ...row, text: [{ rect: over }] }] }).result.reason).toBe(
      'keystone: DIV#row text',
    );
    expect(
      probe({ elements: [{ ...row, text: [{ rect: over, content: '  \n ' }] }] }).result.drawn,
    ).toBe(true);
  });

  it('reads the nameplate overlay by its pixels and takes any other canvas as painted', () => {
    const overlay = {
      tagName: 'CANVAS',
      id: '',
      box: { ...rect(0, 0, 1000, 1000), width: 1000, height: 1000 },
      classes: ['nameplate-canvas'],
    };
    expect(probe({ elements: [{ ...overlay, alpha: 0 }] }).result.drawn).toBe(true);
    expect(probe({ elements: [{ ...overlay, alpha: 200 }] }).result.reason).toBe(
      'plinth-left: CANVAS',
    );
    // An overlay it cannot read (no context, or a zero-size box) is paint.
    expect(probe({ elements: [{ ...overlay, noContext: true }] }).result.reason).toBe(
      'plinth-left: CANVAS',
    );
    const collapsed = { ...overlay, box: { ...overlay.box, width: 0 } };
    expect(probe({ elements: [collapsed] }).result.reason).toBe('plinth-left: CANVAS');
    expect(probe({ elements: [{ ...overlay, classes: [], id: 'minimap' }] }).result.reason).toBe(
      'plinth-left: CANVAS#minimap',
    );
  });
});
