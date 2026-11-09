/* Each trait's aura (owner, 4 Nov: "maybe have traits give cool aura effects too"): the trait's own picture, moving around the hero in its own way.
   One table, drawn two ways: AF.aura.attach() puts sprites in a 3D scene (fights, the island, the map), K.aura() paints the same thing on a hero card.
   Positions are in hero units: y 1 is the top of the hero, x and z 1 are just outside its sides. Nothing here is a stat. */
(function () {
const AF = window.AF, K = AF.kit;
const ic = n => 'icon:trait:' + n;
const AURAS = {
  sturdy1: { glow: '#ff5a3a', power: 0.3, layers: [{ m: ic('sturdy'), n: 6, mode: 'rise', sp: 0.3, size: 0.3 }] },
  swift1: { glow: '#ffd98a', power: 0.3, layers: [{ m: ic('swift'), n: 3, mode: 'orbit', sp: 0.55, r: 1.05, y: 0.42, size: 0.34 }] },
  keen1: { glow: '#7fe8a0', power: 0.3, layers: [{ m: ic('keen'), n: 9, mode: 'rise', sp: 0.48, size: 0.2 }] },
  gilded: { glow: '#ffb31e', power: 0.42, layers: [{ m: ic('gilded'), n: 6, mode: 'fall', sp: 0.36, size: 0.26 }, { m: 'dot:#ffd76a', n: 8, mode: 'rise', sp: 0.3, size: 0.18 }] },
  tempest: { glow: '#ffb09a', power: 0.45, layers: [{ m: ic('tempest'), n: 5, mode: 'orbit', sp: 0.85, r: 1.1, y: 0.28, size: 0.3 }, { m: ic('tempest'), n: 3, mode: 'orbit', sp: -0.6, r: 0.92, y: 0.98, size: 0.24 }] },
  solar: { glow: '#ffd25a', power: 0.6, layers: [{ m: ic('solar'), n: 1, mode: 'halo', y: 1.32, size: 0.62, spin: 0.8 }, { m: 'stars', n: 10, mode: 'trail', streams: 2, sp: 0.32, r: 1.02, size: 0.15 }] },
  eclipse: { glow: '#8aa8ff', power: 0.65, layers: [{ m: ic('eclipse'), n: 1, mode: 'halo', y: 1.36, size: 0.56, spin: 0.15 }, { m: 'bubble', n: 7, mode: 'rise', sp: 0.3, size: 0.2 }, { m: 'stars', n: 4, mode: 'fall', sp: 0.28, size: 0.14 }] },
  astral: { glow: '#8a6aff', power: 0.75, layers: [{ m: ic('astral'), n: 2, mode: 'orbit', sp: 0.5, r: 1.15, y: 0.95, size: 0.36 }, { m: 'stars', n: 12, mode: 'trail', streams: 3, sp: 0.35, r: 1.1, size: 0.14 }, { m: 'dot:#fff2a8', n: 10, mode: 'rise', sp: 0.22, size: 0.16 }] },
  infinity: { glow: '#6affb0', power: 0.9, layers: [{ m: ic('infinity'), n: 5, mode: 'orbit', sp: 0.7, r: 1.15, y: 0.68, size: 0.46 }, { m: ic('keen'), n: 10, mode: 'rise', sp: 0.6, size: 0.22 }, { m: 'stars', n: 15, mode: 'trail', streams: 3, sp: 0.45, r: 1.05, size: 0.15 }] },
};

// the pictures, cut from the 3D icon sheet once it can be drawn from
const pics = new Map();
function pic(m) {
  let p = pics.get(m); if (p) return p;
  const cv = document.createElement('canvas'); cv.width = cv.height = 96;
  const c = cv.getContext('2d');
  p = { cv, tex: null };
  pics.set(m, p);
  const paint = () => {
    c.clearRect(0, 0, 96, 96);
    if (m.startsWith('dot:')) { const g = c.createRadialGradient(48, 48, 2, 48, 48, 46); g.addColorStop(0, '#fff'); g.addColorStop(0.3, m.slice(4)); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 96, 96); }
    else if (AF.EI) AF.EI.paint(c, m, 0, 0, 96);
    if (p.tex) p.tex.needsUpdate = true;
  };
  paint();
  if (!m.startsWith('dot:') && AF.EI && AF.EI.sheet) AF.EI.sheet.then(paint);
  return p;
}
function texOf(m) {
  const p = pic(m);
  if (!p.tex) { p.tex = new THREE.CanvasTexture(p.cv); p.tex.colorSpace = THREE.SRGBColorSpace; }
  return p.tex;
}

const noise = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
// one picture's place at time t
function place(l, i, t, out) {
  const size = l.size;
  if (l.mode === 'orbit') {
    const a = t * l.sp * 2 + (i / l.n) * Math.PI * 2;
    out.x = Math.cos(a) * l.r; out.z = Math.sin(a) * l.r * 0.8; out.y = l.y + Math.sin(t * 1.8 + i) * (l.wave || 0.05);
    out.a = 1; out.s = size; out.rot = 0;
  } else if (l.mode === 'trail') {
    // (4 Nov, owner: "make them smaller just make them go higher and make it like a trail"): streams spiralling up from the feet, each star followed by smaller, fainter ones
    const st = l.streams || 2, per = Math.floor(l.n / st), s = i % st, j = Math.floor(i / st), fade = 1 - j / per;
    let k = t * l.sp + s / st; k -= Math.floor(k); k -= j * 0.05; if (k < 0) k += 1;
    const a = (s / st) * Math.PI * 2 + k * Math.PI * 2.8;
    out.x = Math.cos(a) * l.r; out.z = Math.sin(a) * l.r * 0.8; out.y = 0.08 + k * 0.84; // (owner: "actually center on the hero y level wise"): up the hero's own height, its middle at the hero's middle
    out.a = Math.min(1, k * 6, (1 - k) * 2.6) * fade; out.s = size * (0.5 + 0.5 * fade); out.rot = k * 4;
  } else if (l.mode === 'halo') {
    out.x = 0; out.z = 0.01; out.y = l.y + Math.sin(t * 1.5) * 0.03; out.a = 1; out.s = size; out.rot = t * (l.spin || 0);
  } else {
    let k = t * l.sp + i / l.n + noise(i, 3); k -= Math.floor(k);
    out.x = (noise(i, 1) * 2 - 1) * 0.98; out.z = (noise(i, 2) * 2 - 1) * 0.75;
    out.y = (l.mode === 'fall' ? 1 - k : k) * 1.45 + 0.02;
    out.a = Math.min(1, k * 5, (1 - k) * 3.2); out.s = size * (0.75 + 0.4 * noise(i, 4)); out.rot = (noise(i, 5) - 0.5) * 0.9 + Math.sin(t + i) * 0.15;
  }
  return out;
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.42)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(cv);
  return glowTex;
}
const spot = { x: 0, y: 0, z: 0, a: 1, s: 1, rot: 0 };
AF.aura = {
  LIST: AURAS,
  has: id => !!AURAS[id],
  // (4 Nov, owner: "make it actually visible in the 3d model at crew i cant see it i think its hidden inside"): the size of the hero's own cube, not hats or costumes, measured before anything is merged, so the aura goes round the outside of it
  measure(R, parent) {
    const T = THREE, cube = R && R.cube; parent.updateMatrixWorld(true);
    const box = new T.Box3();
    if (cube && cube.geometry) { if (!cube.geometry.boundingBox) cube.geometry.computeBoundingBox(); box.copy(cube.geometry.boundingBox).applyMatrix4(cube.matrixWorld); }
    else box.setFromObject(parent);
    const at = new T.Vector3(); parent.getWorldPosition(at);
    const size = new T.Vector3(); box.getSize(size);
    return { h: size.y, r: Math.max(size.x, size.z) * 0.68, y0: box.min.y - at.y };
  },
  // into a 3D scene. tr() says the trait now, so a new roll shows by itself. o.h: the hero's height; o.alive(): false hides it
  attach(parent, tr, o = {}) {
    const T = THREE, root = new T.Group(); root.name = 'traitAura'; parent.add(root);
    const h = o.h || 1, R = o.r || h * 0.62;
    let cur = null, sprites = [];
    const floor = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, fog: false }));
    root.position.y = o.y0 || 0;
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.04 - (o.y0 || 0); floor.scale.setScalar(R * 3.1); floor.renderOrder = 1; floor.frustumCulled = false; root.add(floor);
    const build = id => {
      for (const s of sprites) { root.remove(s.sp); s.sp.material.dispose(); }
      sprites = []; cur = id;
      const A = AURAS[id];
      floor.material.opacity = A ? A.power : 0;
      if (A) floor.material.color.set(A.glow);
      if (!A) return;
      for (const l of A.layers) for (let i = 0; i < l.n; i++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: texOf(l.m), transparent: true, depthWrite: false, toneMapped: false, fog: false }));
        sp.renderOrder = 3; root.add(sp); sprites.push({ sp, l, i });
      }
    };
    const tick = () => {
      const id = tr() || null;
      if (id !== cur) build(id);
      const on = !o.alive || o.alive();
      if (root.visible !== on) root.visible = on;
      if (!on) return;
      const t = performance.now() / 1000;
      for (const q of sprites) {
        place(q.l, q.i, t, spot);
        q.sp.position.set(spot.x * R, spot.y * h, spot.z * R);
        q.sp.scale.setScalar(spot.s * h);
        q.sp.material.opacity = spot.a; q.sp.material.rotation = spot.rot;
      }
    };
    floor.onBeforeRender = tick;
    tick();
    return AF.aura.last = { root, tick, count: () => sprites.length, get id() { return cur; } };
  },
};

// on a hero card: the same pictures. Behind the hero when they are behind it, in front when in front
if (K) K.aura = function (id, F, B, st, p) {
  const A = AURAS[id]; if (!A) return;
  const S = p.S, feet = (p.scr('feet') || [p.W / 2, p.H * 0.84]), cx = p.W / 2, fy = feet[1], tall = p.H * 0.62, rx = p.W * 0.36, pc = p.t;
  B.save(); F.save();
  B.globalCompositeOperation = F.globalCompositeOperation = 'source-over';
  const g = B.createRadialGradient(cx, fy - tall * 0.5, 8 * S, cx, fy - tall * 0.5, p.W * 0.62);
  B.globalAlpha = A.power * (0.75 + 0.25 * Math.sin(pc * 1.8));
  g.addColorStop(0, A.glow); g.addColorStop(1, 'rgba(255,255,255,0)');
  B.fillStyle = g; B.fillRect(0, 0, p.W, p.H);
  for (const l of A.layers) for (let i = 0; i < l.n; i++) {
    place(l, i, pc, spot);
    const c = spot.z < 0 ? B : F, s = spot.s * tall, x = cx + spot.x * rx, y = fy - spot.y * tall;
    c.globalAlpha = spot.a;
    c.translate(x, y); if (spot.rot) c.rotate(spot.rot);
    c.drawImage(pic(l.m).cv, -s / 2, -s / 2, s, s);
    if (spot.rot) c.rotate(-spot.rot); c.translate(-x, -y);
  }
  B.restore(); F.restore();
};
})();
