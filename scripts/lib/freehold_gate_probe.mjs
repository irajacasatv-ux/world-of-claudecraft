/** Whether the Freehold Gate's arch is actually on screen in the current frame.
 * A press opens the gate prompt whether or not the arch renders, so the prompt
 * alone cannot prove the arch is in a capture. Self-contained so page.evaluate
 * can ship it as-is; a test passes `env` to stand in for the page globals.
 *
 * The arch counts as drawn when its view is attached to the scene with its
 * whole chain visible, and each of three sample points (both plinths and the
 * keystone, turned by the gate's facing) projects inside the canvas and the
 * viewport, with no mesh between the camera and the point and no opaque DOM
 * paint over it. DOM paint means: a background or border fill of at least 0.75
 * alpha (a 0.55 scrim dims the world without hiding it), an image, svg or video,
 * a non-overlay canvas, a text run's own glyph boxes, or a ::before/::after
 * with a fill; the full-screen nameplate canvas counts only where its pixels
 * are painted. A mesh counts as in front when any of its materials renders
 * colour (a colorWrite:false shadow proxy does not) and is not mostly clear.
 * Known limits, which the per-frame visual review owns. They can REFUSE a good
 * frame: a transparent gradient counts as paint, a clipped or faded ancestor is
 * not modelled. They can PASS a bad one: sprites, points and lines are not
 * raycast, a pseudo-element drawn outside its host's box, box-shadow, outline
 * and CSS filters are not modelled.
 * @param {object} [env]
 * @returns {{ drawn: boolean, reason: string | null, points: object[] }}
 */
export function freeholdGateDrawnProbe(env) {
  const g = env?.game ?? window.__game;
  const doc = env?.document ?? document;
  const styleOf = env?.getComputedStyle ?? getComputedStyle;
  const viewW = env?.innerWidth ?? innerWidth;
  const viewH = env?.innerHeight ?? innerHeight;
  const refuse = (reason) => ({ drawn: false, reason, points: [] });
  const gate = [...g.sim.entities.values()].find((e) => e.templateId === 'freehold_gate');
  if (!gate) return refuse('no gate entity');
  const view = g.renderer.views.get(gate.id);
  if (!view) return refuse('no gate view');
  let node = view.group;
  for (; node.parent; node = node.parent) if (!node.visible) return refuse('gate view hidden');
  if (node !== g.renderer.scene || !node.visible) return refuse('gate view not in the scene');
  const inGate = (object) => {
    for (let at = object; at; at = at.parent) if (at === view.group) return true;
    return false;
  };
  const shownChain = (object) => {
    for (let at = object; at; at = at.parent) if (!at.visible) return false;
    return true;
  };
  const opaque = (color) => {
    if (!color || color === 'transparent') return false;
    const alpha = /\/\s*([\d.]+)\s*\)$/.exec(color) ?? /rgba\([^)]*,\s*([\d.]+)\)$/.exec(color);
    return !alpha || Number(alpha[1]) >= 0.75;
  };
  const canvas = g.renderer.webgl.domElement;
  const inside = (box, x, y) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  const paintsAt = (element, x, y) => {
    if (element === canvas || element.contains(canvas)) return null;
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return null;
    const box = element.getBoundingClientRect();
    if (!inside(box, x, y)) return null;
    const tag = element.tagName;
    const name = `${tag}${element.id ? `#${element.id}` : ''}`;
    if (tag === 'CANVAS') {
      // Only the known 2D overlay is sampled: reading any other canvas would
      // bind a context to it, so every other canvas is taken as painted.
      if (!element.classList.contains('nameplate-canvas')) return name;
      const context = element.getContext('2d');
      if (!context || box.width === 0 || box.height === 0) return name;
      const px = Math.floor(((x - box.left) / box.width) * element.width);
      const py = Math.floor(((y - box.top) / box.height) * element.height);
      return context.getImageData(px, py, 1, 1).data[3] > 0 ? name : null;
    }
    if (['IMG', 'SVG', 'svg', 'VIDEO'].includes(tag)) return name;
    const style = styleOf(element);
    if (opaque(style.backgroundColor) || style.backgroundImage !== 'none') return name;
    const band = {
      top: Number.parseFloat(style.borderTopWidth) || 0,
      right: Number.parseFloat(style.borderRightWidth) || 0,
      bottom: Number.parseFloat(style.borderBottomWidth) || 0,
      left: Number.parseFloat(style.borderLeftWidth) || 0,
    };
    if (
      (band.top > 0 && opaque(style.borderTopColor) && y <= box.top + band.top) ||
      (band.bottom > 0 && opaque(style.borderBottomColor) && y >= box.bottom - band.bottom) ||
      (band.left > 0 && opaque(style.borderLeftColor) && x <= box.left + band.left) ||
      (band.right > 0 && opaque(style.borderRightColor) && x >= box.right - band.right)
    )
      return name;
    for (const pseudo of ['::before', '::after']) {
      const fill = styleOf(element, pseudo);
      if (
        fill.content &&
        fill.content !== 'none' &&
        (opaque(fill.backgroundColor) || fill.backgroundImage !== 'none')
      )
        return `${name}${pseudo}`;
    }
    for (const child of element.childNodes) {
      if (child.nodeType !== 3 || child.textContent.trim() === '') continue;
      const range = doc.createRange();
      range.selectNodeContents(child);
      if ([...range.getClientRects()].some((glyphs) => inside(glyphs, x, y))) return `${name} text`;
    }
    return null;
  };
  const camera = g.renderer.camera;
  camera.updateMatrixWorld();
  const frame = canvas.getBoundingClientRect();
  const raycaster = g.renderer.raycaster;
  const saved = {
    near: raycaster.near,
    far: raycaster.far,
    camera: raycaster.camera,
    ray: raycaster.ray.clone(),
  };
  const elements = [...doc.body.querySelectorAll('*')];
  const turn = gate.facing ?? 0;
  const points = [
    ['plinth-left', -1.7, 1],
    ['plinth-right', 1.7, 1],
    ['keystone', 0, 4.5],
  ].map(([label, side, up]) => {
    const target = camera.position
      .clone()
      .set(gate.pos.x + side * Math.cos(turn), gate.pos.y + up, gate.pos.z - side * Math.sin(turn));
    const ndc = target.clone().project(camera);
    const sx = frame.left + ((ndc.x + 1) / 2) * frame.width;
    const sy = frame.top + ((1 - ndc.y) / 2) * frame.height;
    const onScreen =
      Math.abs(ndc.x) <= 1 &&
      Math.abs(ndc.y) <= 1 &&
      ndc.z >= -1 &&
      ndc.z <= 1 &&
      sx >= 0 &&
      sx <= viewW &&
      sy >= 0 &&
      sy <= viewH;
    let occludedBy = null;
    let coveredBy = null;
    if (onScreen) {
      const toPoint = target.clone().sub(camera.position);
      raycaster.set(camera.position, toPoint.clone().normalize());
      raycaster.near = 0;
      raycaster.far = Math.max(0, toPoint.length() - 0.05);
      raycaster.camera = camera;
      for (const hit of raycaster.intersectObjects(g.renderer.scene.children, true)) {
        const object = hit.object;
        if (!object.isMesh || inGate(object) || !shownChain(object)) continue;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const paintsColour = materials.some(
          (material) =>
            material &&
            material.visible !== false &&
            material.colorWrite !== false &&
            !(material.transparent && material.opacity < 0.5),
        );
        if (!paintsColour) continue;
        occludedBy = object.name || object.type;
        break;
      }
      for (const element of elements) {
        coveredBy = paintsAt(element, sx, sy);
        if (coveredBy) break;
      }
    }
    return { label, sx, sy, onScreen, occludedBy, coveredBy };
  });
  raycaster.near = saved.near;
  raycaster.far = saved.far;
  raycaster.camera = saved.camera;
  raycaster.ray.copy(saved.ray);
  const blocked = points.find((p) => !p.onScreen || p.occludedBy || p.coveredBy);
  return {
    drawn: !blocked,
    reason: blocked
      ? `${blocked.label}: ${blocked.onScreen ? (blocked.occludedBy ?? blocked.coveredBy) : 'off screen'}`
      : null,
    points,
  };
}
