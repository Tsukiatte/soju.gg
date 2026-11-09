/* Aura Farm parts kit: toon materials and ink outlines, the shared blocky rig, faces, hair, accessories, idle poses
   and the 2D effects drawn on each card. Every character in units.js is put together from these. */
(function () {
const T = THREE, AF = window.AF = window.AF || {};
const K = AF.kit = {};
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const rnd = (a, b) => a + Math.random() * (b - a);
K.smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------------- materials ----------------
const ramp = new T.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, T.RedFormat);
ramp.minFilter = ramp.magFilter = T.NearestFilter; ramp.needsUpdate = true;
const INK = new T.MeshBasicMaterial({ color: 0x07070a, side: T.BackSide });
const cache = {};
// glow 1 = flat unlit colour, glow 2 = unlit and see-through (hard light, water)
function mat(hex, glow, own) {
  const make = () => glow
    ? new T.MeshBasicMaterial({ color: hex, transparent: glow === 2, opacity: glow === 2 ? 0.5 : 1, depthWrite: glow !== 2 })
    : new T.MeshToonMaterial({ color: hex, gradientMap: ramp });
  if (own) return make();
  const k = hex + "|" + (glow || 0);
  return cache[k] || (cache[k] = make());
}
K.mat = mat;

// ---------------- primitives ----------------
const OUT = 0.045;
let nBox = 0;
function place(m, x, y, z, o) {
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
}
function box(parent, w, h, d, color, x = 0, y = 0, z = 0, o = {}) {
  // every part is a hair bigger than the last (up to 0.6%), so two parts built flush can't z-fight
  const e = 1 + (nBox++ % 7) * 0.001;
  w *= e; h *= e; d *= e;
  const g = new T.BoxGeometry(w, h, d);
  const m = new T.Mesh(g, mat(color, o.glow, o.own));
  place(m, x, y, z, o);
  if (o.ink !== false && o.glow !== 2) {
    const t = o.ink || OUT;
    const s = new T.Mesh(g, INK);
    s.scale.set((w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d);
    m.add(s);
  }
  parent.add(m);
  return m;
}
function mesh(parent, geo, color, x = 0, y = 0, z = 0, o = {}) {
  const m = new T.Mesh(geo, mat(color, o.glow, o.own));
  place(m, x, y, z, o);
  if (o.inkGeo) m.add(new T.Mesh(o.inkGeo, INK));
  else if (o.ink !== false && !o.glow) { const s = new T.Mesh(geo, INK); s.scale.setScalar(o.inkScale || 1.12); m.add(s); }
  parent.add(m);
  return m;
}
function pivot(parent, x = 0, y = 0, z = 0) { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function marker(R, name, parent, x = 0, y = 0, z = 0) {
  const o = new T.Object3D(); o.position.set(x, y, z); parent.add(o); R.m[name] = o; return o;
}
const cone = (r, h, seg = 4) => new T.ConeGeometry(r, h, seg);
const ball = (r, d = 1) => new T.IcosahedronGeometry(r, d);
const cyl = (a, b, h, s = 16) => new T.CylinderGeometry(a, b, h, s);
const ring = (r, t, rs = 8, ts = 48) => new T.TorusGeometry(r, t, rs, ts);
Object.assign(K, { box, mesh, pivot, marker, cone, ball, cyl, ring });

// a hanging chain of hinged segments (capes, hair, tails); swayed every frame by K.animate
function chain(R, parent, x, y, z, n, len, seg, sw) {
  const segs = [];
  let p = pivot(parent, x, y, z);
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? p : pivot(p, 0, -len, 0);
    seg(s, i);
    segs.push(s); p = s;
  }
  R.chains.push(Object.assign({ segs, b0: 0.1, b: 0.08, amp: 0.08, sp: 2, zamp: 0.06, ph: rnd(0, 6), rz0: 0, ry0: 0 }, sw));
  return segs;
}
K.chain = chain;
// keeps an object level whatever the arm holding it does (cups, lanterns, staffs)
function upright(R, obj, arm, tilt) {
  const q = new T.Quaternion(), tq = tilt ? new T.Quaternion().setFromEuler(new T.Euler(...tilt)) : null;
  R.anim.push(() => { q.copy(arm.quaternion).invert(); if (tq) q.multiply(tq); obj.quaternion.copy(q); });
}

// ---------------- the rig ----------------
// R.root > hips > legs / torso > arms (hands) / head. Robes swap the legs for a hinged skirt.
K.rig = function (S, L) {
  const R = { anim: [], chains: [], m: {}, L, P: {} };
  R.root = pivot(S);
  R.hipY = L.robe ? 1.32 : 1.0;
  R.hips = pivot(R.root, 0, R.hipY, 0);
  if (L.robe) {
    R.skirt = chain(R, R.hips, 0, 0.02, 0, 3, 0.34, (seg, i) => {
      box(seg, 1.08 + i * 0.16, 0.36, 0.66 + i * 0.1, L.robe, 0, -0.18, 0);
      if (L.robeTrim) box(seg, 1.1 + i * 0.16, 0.06, 0.68 + i * 0.1, L.robeTrim, 0, -0.33, 0, { ink: false });
      if (L.robeIn) box(seg, 0.3, 0.36, 0.05, L.robeIn, 0, -0.18, 0.36 + i * 0.05, { ink: false });
    }, { b0: 0, b: 0.03, amp: 0.05, sp: 1.5, zamp: 0.045 });
  } else {
    R.legL = pivot(R.hips, -0.25, 0, 0); R.legR = pivot(R.hips, 0.25, 0, 0);
    for (const leg of [R.legL, R.legR]) {
      box(leg, 0.44, 0.72, 0.46, L.pants, 0, -0.36, 0);
      box(leg, 0.48, 0.3, 0.55, L.boot || L.pants, 0, -0.84, 0.04);
      if (L.bootTrim) box(leg, 0.5, 0.07, 0.57, L.bootTrim, 0, -0.66, 0.04, { ink: false });
    }
  }
  R.torso = pivot(R.hips);
  box(R.torso, 1.0, 1.0, 0.56, L.top, 0, 0.5, 0);
  if (L.belt) box(R.torso, 1.04, 0.13, 0.6, L.belt, 0, 0.08, 0, { ink: 0.02 });
  if (L.collar) box(R.torso, 0.62, 0.16, 0.62, L.collar, 0, 0.98, 0, { ink: 0.02 });
  if (L.chest) box(R.torso, 0.34, 0.6, 0.04, L.chest, 0, 0.62, 0.29, { ink: false });
  R.armL = pivot(R.torso, -0.71, 0.92, 0); R.armR = pivot(R.torso, 0.71, 0.92, 0);
  for (const arm of [R.armL, R.armR]) {
    box(arm, 0.42, 0.64, 0.44, L.sleeve || L.top, 0, -0.31, 0);
    box(arm, 0.38, 0.28, 0.4, L.glove || L.skin, 0, -0.76, 0);
    if (L.cuff) box(arm, 0.46, 0.07, 0.48, L.cuff, 0, -0.6, 0, { ink: false });
  }
  R.handL = pivot(R.armL, 0, -0.84, 0); R.handR = pivot(R.armR, 0, -0.84, 0);
  R.head = pivot(R.torso, 0, 1.0, 0);
  box(R.head, 1.16, 1.12, 1.08, L.skin, 0, 0.58, 0);
  K.face(R.head, L.face || {}, L);
  K.hair(R, L.hair || "short", L);
  marker(R, "head", R.head, 0, 1.3, 0);
  marker(R, "face", R.head, 0, 0.55, 0.6);
  marker(R, "chest", R.torso, 0, 0.6, 0.3);
  marker(R, "feet", R.root, 0, 0.05, 0);
  marker(R, "center", R.torso, 0, 0.3, 0);
  marker(R, "handR", R.handR); marker(R, "handL", R.handL);
  return R;
};

// ---------------- faces (front of the head is +z) ----------------
K.face = function (H, F, L) {
  const z = 0.55, st = F.style || "round", dark = 0x0b0d16;
  const ew = F.ew || 0.2, eh = F.eh || 0.28, ey = F.ey || 0.52, ex = F.ex || 0.25;
  if (st === "visor") box(H, 0.98, 0.22, 0.06, F.eye, 0, 0.52, z + 0.01, { glow: 1, ink: 0.02 });
  for (const s of [-1, 1]) {
    if (st === "visor" || st === "none") break;
    if (st === "closed") {
      box(H, 0.12, 0.04, 0.03, dark, s * ex - 0.05, ey - 0.06, z, { ink: false, rz: -0.35 });
      box(H, 0.12, 0.04, 0.03, dark, s * ex + 0.05, ey - 0.06, z, { ink: false, rz: 0.35 });
    } else if (st === "glow") {
      box(H, ew, eh * 0.62, 0.03, F.eye, s * ex, ey, z, { ink: false, glow: 1 });
    } else {
      box(H, ew, eh, 0.03, dark, s * ex, ey, z, { ink: false });
      box(H, ew - 0.06, eh - 0.11, 0.03, F.eye, s * ex, ey - 0.04, z + 0.012, { ink: false, glow: 1 });
      if (st === "round") box(H, 0.06, 0.07, 0.03, 0xffffff, s * ex - 0.04, ey + 0.06, z + 0.024, { ink: false, glow: 1 });
      if (st === "bored") box(H, ew + 0.03, eh * 0.45, 0.03, L.skin, s * ex, ey + eh * 0.3, z + 0.03, { ink: false });
    }
    if (F.brow !== null) {
      box(H, 0.28, 0.06, 0.03, F.browC || L.hairC || dark, s * (ex + 0.02), F.browY || ey + 0.2, z + 0.005,
        { ink: false, rz: s * (F.brow === undefined ? -0.22 : F.brow) });
    }
    if (F.blush) box(H, 0.14, 0.06, 0.03, 0xf08f8f, s * 0.38, 0.33, z, { ink: false });
  }
  const m = F.mouth || "flat", mc = 0x4a2222;
  if (m === "flat") box(H, F.mouthW || 0.16, 0.04, 0.03, mc, 0.03, 0.24, z, { ink: false });
  else if (m === "smile") {
    box(H, 0.12, 0.04, 0.03, mc, -0.04, 0.25, z, { ink: false, rz: -0.35 });
    box(H, 0.12, 0.04, 0.03, mc, 0.07, 0.25, z, { ink: false, rz: 0.35 });
  } else if (m === "grin") {
    box(H, 0.3, 0.1, 0.03, dark, 0.02, 0.24, z, { ink: false });
    box(H, 0.26, 0.05, 0.03, 0xffffff, 0.02, 0.26, z + 0.01, { ink: false, glow: 1 });
  } else if (m === "frown") {
    box(H, 0.12, 0.04, 0.03, mc, -0.04, 0.23, z, { ink: false, rz: 0.35 });
    box(H, 0.12, 0.04, 0.03, mc, 0.07, 0.23, z, { ink: false, rz: -0.35 });
  } else if (m === "open") H.userData.mouth = box(H, 0.14, 0.12, 0.03, 0x2a0d0d, 0.03, 0.24, z, { ink: false });
  if (F.mustache) box(H, 0.42, 0.08, 0.04, F.mustache, 0.02, 0.33, z + 0.01, { ink: 0.015 });
  if (F.scar) box(H, 0.04, 0.3, 0.02, 0xb05050, 0.3, 0.55, z + 0.02, { ink: false, rz: 0.3 });
};

// ---------------- hair ----------------
K.hair = function (R, st, L) {
  const H = R.head, c = L.hairC, c2 = L.hairC2 || c;
  if (st === "none") return;
  if (st === "mohawk") {
    for (let i = 0; i < 5; i++) box(H, 0.22, 0.34 + (i % 2) * 0.1, 0.24, i % 2 ? c2 : c, 0, 1.22, 0.4 - i * 0.22, { rx: -0.25 });
    return;
  }
  if (st === "balding") {
    for (const s of [-1, 1]) box(H, 0.14, 0.42, 0.7, c, s * 0.6, 0.78, -0.16);
    box(H, 1.2, 0.42, 0.16, c, 0, 0.78, -0.53);
    return;
  }
  // cap and back are shared by every other style
  box(H, 1.26, st === "short" ? 0.3 : 0.4, 1.18, c, 0, st === "short" ? 1.1 : 1.12, -0.02);
  const longBack = st === "long" || st === "swept";
  box(H, 1.21, longBack ? 1.0 : 0.62, 0.3, c, 0, longBack ? 0.72 : 0.86, -0.49);
  const fr = L.fringe || (st === "short" ? "straight" : "spiky");
  if (fr === "spiky") {
    for (let i = 0; i < 4; i++) {
      box(H, 0.36, 0.42 - i * 0.04, 0.22 + i * 0.035, i % 2 ? c2 : c, -0.42 + i * 0.29, 0.9 - (i % 2) * 0.05,
        0.52 + i * 0.018, { rz: 0.35 - i * 0.12 });
    }
  } else if (fr === "straight") box(H, 1.22, 0.2, 0.16, c, 0, 1.0, 0.52);
  else if (fr === "side") {
    box(H, 0.9, 0.24, 0.18, c, -0.16, 1.0, 0.52, { rz: 0.14 });
    box(H, 0.32, 0.5, 0.2, c2, -0.44, 0.82, 0.53, { rz: -0.15 });
  }
  if (st !== "short") for (const s of [-1, 1]) box(H, 0.2, 0.7, 0.32, c, s * 0.62, 0.56, 0.22);
  else for (const s of [-1, 1]) box(H, 0.12, 0.36, 0.62, c, s * 0.6, 0.86, -0.14);
  if (st === "spiky") {
    const sp = [[-0.4, 0.35, -0.5], [0, 0.45, -0.1], [0.4, 0.38, 0.5], [-0.25, 0.3, -0.9], [0.25, 0.3, 0.9]];
    sp.forEach(([x, h, rz], i) => mesh(H, cone(0.26, 0.6 + h, 4), i % 2 ? c2 : c, x, 1.45 + h * 0.3, -0.15 - (i > 2 ? 0.25 : 0),
      { rz: rz * 0.6, rx: -0.35, ry: 0.785 }));
  } else if (st === "pony") {
    box(H, 0.32, 0.12, 0.12, L.hairTie || 0xe8b54a, 0, 1.0, -0.66, { ink: 0.02 });
    chain(R, H, 0, 1.0, -0.68, 4, 0.36, (s, i) => box(s, 0.36 - i * 0.05, 0.4, 0.34 - i * 0.05, i % 2 ? c2 : c, 0, -0.18, 0),
      { b0: -0.35, b: 0.12, amp: 0.08, sp: 2.0, zamp: 0.1 });
  } else if (st === "long" || st === "swept") {
    if (st === "swept") for (const s of [-1, 1]) box(H, 0.5, 0.18, 0.7, c2, s * 0.34, 1.3, 0.02, { rz: s * -0.35, rx: -0.2 });
    for (let k = -1; k <= 1; k++) {
      chain(R, H, k * 0.36, 0.3, -0.58, 3, 0.42, (s, i) => box(s, 0.34 - i * 0.04, 0.46, 0.22 + (k === 0 ? 0.04 : 0),
        i % 2 ? c2 : c, 0, -0.2, 0), { b0: 0.08, b: 0.06, amp: 0.07, sp: 1.5, zamp: 0.06 });
    }
  } else if (st === "bob") {
    for (const s of [-1, 1]) box(H, 0.2, 0.84, 0.9, c, s * 0.64, 0.6, -0.04);
  } else if (st === "twin") {
    for (const s of [-1, 1]) {
      box(H, 0.22, 0.16, 0.22, L.hairTie || 0xff6fa8, s * 0.7, 1.0, -0.16, { ink: 0.02 });
      chain(R, H, s * 0.72, 0.98, -0.18, 4, 0.34, (sg, i) => box(sg, 0.32 - i * 0.04, 0.38, 0.3 - i * 0.04, i % 2 ? c2 : c, 0, -0.17, 0),
        { b0: 0.1, b: 0.06, amp: 0.07, sp: 2.2, zamp: 0.12, rz0: s * 0.25 });
    }
  } else if (st === "bun") {
    box(H, 0.5, 0.42, 0.46, c2, 0, 1.38, -0.32);
    box(H, 0.56, 0.1, 0.5, L.hairTie || 0xe8b54a, 0, 1.2, -0.32, { ink: 0.02 });
  } else if (st === "messy") {
    const tufts = [[-0.45, 1.3, 0.2, 0.6], [0.1, 1.38, 0.1, -0.3], [0.48, 1.28, -0.1, -0.7], [-0.2, 1.3, -0.4, 0.4], [0.3, 1.3, -0.45, -0.2]];
    tufts.forEach(([x, y, zz, r], i) => box(H, 0.32, 0.3, 0.32, i % 2 ? c2 : c, x, y, zz, { rz: r, rx: r * 0.5 }));
  }
};

// ---------------- accessories ----------------
// every one takes (R, L, o); colours default to the look's palette
const A = K.acc = {};
A.glasses = (R, L, o) => {
  const H = R.head, f = o.c || 0x26262a;
  for (const s of [-1, 1]) {
    for (const y of [0.64, 0.4]) box(H, 0.32, 0.035, 0.02, f, s * 0.25, y, 0.59, { ink: false });
    for (const x of [0.41, 0.09]) box(H, 0.035, 0.26, 0.02, f, s * x, 0.52, 0.59, { ink: false });
  }
  box(H, 0.18, 0.035, 0.02, f, 0, 0.56, 0.59, { ink: false });
};
A.monocle = (R, L, o) => {
  mesh(R.head, ring(0.15, 0.025, 6, 24), o.c || 0xd8a84a, 0.25, 0.5, 0.6, { glow: 1 });
  box(R.head, 0.02, 0.5, 0.02, o.c || 0xd8a84a, 0.38, 0.22, 0.58, { ink: false, rz: 0.2 });
};
A.goggles = (R, L, o) => {
  const H = R.head;
  box(H, 1.22, 0.12, 1.14, o.band || 0x3a2a1c, 0, 0.98, 0, { ink: 0.02 });
  for (const s of [-1, 1]) {
    box(H, 0.34, 0.26, 0.12, o.frame || 0x6a5236, s * 0.27, 1.0, 0.58, { ink: 0.02 });
    box(H, 0.24, 0.17, 0.04, o.lens || 0x6fe2ff, s * 0.27, 1.0, 0.65, { glow: 1, ink: false });
  }
};
A.cap = (R, L, o) => {
  const H = R.head, b = o.back ? -1 : 1;
  box(H, 1.26, 0.34, 1.2, o.c, 0, 1.22, 0);
  box(H, 1.02, 0.06, 0.56, o.c2 || o.c, 0, 1.08, b * 0.8);
  if (o.badge) box(H, 0.22, 0.2, 0.04, o.badge, 0, 1.24, 0.62, { ink: 0.015 });
};
A.visorCap = (R, L, o) => {
  box(R.head, 1.24, 0.14, 1.16, o.c, 0, 1.08, 0, { ink: 0.02 });
  box(R.head, 1.0, 0.06, 0.52, o.c, 0, 1.06, 0.78);
};
A.beanie = (R, L, o) => {
  box(R.head, 1.28, 0.46, 1.2, o.c, 0, 1.2, 0);
  box(R.head, 1.32, 0.16, 1.24, o.c2 || o.c, 0, 1.0, 0, { ink: 0.02 });
  box(R.head, 0.24, 0.2, 0.24, o.c2 || o.c, 0, 1.52, 0);
};
A.headband = (R, L, o) => {
  box(R.head, 1.22, 0.13, 1.14, o.c, 0, 0.94, 0, { ink: 0.02 });
  if (o.tails !== false) for (const s of [-1, 1]) {
    chain(R, R.head, s * 0.14, 0.94, -0.6, 2, 0.3, sg => box(sg, 0.12, 0.32, 0.04, o.c, 0, -0.15, 0, { ink: 0.02 }),
      { b0: 0.5, b: 0.2, amp: 0.15, sp: 3, zamp: 0.15, rz0: s * 0.5 });
  }
};
A.hood = (R, L, o) => {
  const H = R.head, c = o.c, c2 = o.c2 || c;
  box(H, 1.4, 0.52, 1.34, c, 0, 1.18, -0.04);
  for (const s of [-1, 1]) box(H, 0.16, 1.02, 1.24, c, s * 0.71, 0.66, -0.06);
  box(H, 1.4, 1.1, 0.16, c, 0, 0.62, -0.66);
  box(H, 1.2, 0.08, 0.1, c2, 0, 0.96, 0.6, { ink: 0.02 });
  chain(R, H, 0, 1.1, -0.66, 2, 0.34, (s, i) => box(s, 0.5 - i * 0.18, 0.4, 0.14, c, 0, -0.18, -0.06),
    { b0: 0.9, b: 0.3, amp: 0.05, sp: 1.5, zamp: 0.03 });
};
A.wideHat = (R, L, o) => {
  const H = R.head, g = pivot(H, 0, 1.2, 0);
  g.rotation.z = 0.12; g.rotation.x = 0.16; // brim tipped toward the viewer so it reads as a brim, not a line
  box(g, 2.3, 0.12, 2.3, o.c, 0, 0, 0, { ry: 0.785 });
  box(g, 1.3, 0.2, 1.3, o.band || 0x2a1d10, 0, 0.12, 0, { ink: 0.02 });
  const tip = mesh(g, cone(0.72, 1.5, 4), o.c, 0.1, 0.9, 0, { rz: -0.18, ry: 0.785 });
  if (o.rose) { box(g, 0.24, 0.24, 0.24, o.rose, 0.55, 0.2, 0.42, { rz: 0.4 }); box(g, 0.3, 0.06, 0.16, 0x2f8a3a, 0.72, 0.16, 0.4); }
  R.hatTip = tip;
};
A.conicalHat = (R, L, o) => {
  mesh(R.head, cone(1.45, 0.62, 8), o.c, 0, 1.46, 0, { inkScale: 1.06 });
  box(R.head, 1.24, 0.1, 1.16, o.band || 0x7a2a1a, 0, 1.1, 0, { ink: 0.02 });
};
A.tricorn = (R, L, o) => {
  const H = R.head;
  box(H, 1.36, 0.36, 1.26, o.c, 0, 1.28, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * PI * 2 + PI / 2, f = pivot(H, cos(a) * 0.62, 1.3, sin(a) * 0.62);
    f.rotation.y = -a + PI / 2;
    box(f, 1.0, 0.36, 0.08, o.c, 0, 0.06, 0, { rx: -0.45 });
    box(f, 1.02, 0.06, 0.1, o.trim || 0xe8b54a, 0, 0.22, -0.06, { rx: -0.45, ink: false });
  }
  if (o.feather) chain(R, H, 0.4, 1.55, -0.2, 3, 0.3, (s, i) => box(s, 0.16 - i * 0.03, 0.34, 0.06, i % 2 ? 0xfff2d6 : o.feather, 0, 0.16, 0),
    { b0: -0.6, b: -0.2, amp: 0.1, sp: 2.4, zamp: 0.1, rz0: -0.5 });
};
A.helmet = (R, L, o) => {
  const H = R.head, c = o.c, big = o.big ? 1.12 : 1;
  if (o.closed) {
    box(H, 1.32 * big, 1.24 * big, 1.22 * big, c, 0, 0.6, 0);
    box(H, 0.92, 0.09, 0.04, o.slit || 0xff5a2a, 0, 0.6, 0.62 * big + 0.02, { glow: 1, ink: false });
    box(H, 0.08, 0.5, 0.06, o.trim || c, 0, 0.36, 0.63 * big + 0.02, { ink: 0.02 });
  } else {
    box(H, 1.5, 0.52, 1.42, c, 0, 1.12, -0.02);
    for (const s of [-1, 1]) box(H, 0.16, 0.98, 1.38, c, s * 0.74, 0.62, -0.04);
    box(H, 1.5, 1.0, 0.16, c, 0, 0.62, -0.72);
    box(H, 0.12, 0.5, 0.12, o.trim || c, 0, 0.98, 0.66);
  }
  if (o.trim) box(H, 1.54 * big, 0.1, 1.46 * big, o.trim, 0, 0.96 * big + (o.closed ? 0.1 : 0.1), 0, { ink: false });
  if (o.plume) chain(R, H, 0, o.closed ? 1.3 : 1.4, 0, 3, 0.3, (s, i) => box(s, 0.16, 0.4, 0.34 - i * 0.06, i % 2 ? (o.plume2 || o.plume) : o.plume, 0, 0.16, -0.12),
    { b0: -0.5, b: -0.45, amp: 0.08, sp: 2.2, zamp: 0.06 });
};
A.crown = (R, L, o) => {
  const H = R.head, g = o.c || 0xe8b54a;
  box(H, 1.28, 0.12, 0.06, g, 0, 0.98, 0.58, { ink: 0.02 });
  for (const s of [-1, 1]) box(H, 0.06, 0.12, 1.12, g, s * 0.63, 0.98, 0.02, { ink: 0.02 });
  for (const [x, sz] of [[-0.36, 0.16], [0, 0.24], [0.36, 0.16]]) box(H, sz, sz, 0.06, g, x, 1.08 + sz * 0.4, 0.6, { rz: 0.785, ink: 0.02 });
  box(H, 0.12, 0.12, 0.06, o.gem || 0xc47bff, 0, 1.16, 0.64, { rz: 0.785, glow: 1, ink: false });
};
A.scrapCrown = (R, L, o) => {
  const H = R.head, cs = [0x8a4a22, 0x6b6f74, 0xa86a2c, 0x50545a];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * PI * 2;
    box(H, 0.22, 0.3 + (i % 3) * 0.12, 0.08, cs[i % 4], sin(a) * 0.6, 1.22, cos(a) * 0.6, { ry: a, rz: (i % 2 ? 0.2 : -0.15) });
  }
  box(H, 0.14, 0.14, 0.06, 0xffc23a, 0, 1.26, 0.64, { glow: 1, ink: 0.02, rz: 0.785 });
};
A.halo = (R, L, o) => {
  const h = mesh(R.head, ring(o.r || 0.52, 0.06, 8, 48), o.c || 0xfff2b0, 0, 1.6, -0.1, { glow: 1, rx: PI / 2 - 0.25 });
  R.anim.push(t => { h.position.y = 1.6 + sin(t * 2) * 0.05; });
  marker(R, "halo", R.head, 0, 1.6, -0.1);
};
A.horns = (R, L, o) => {
  for (const s of [-1, 1]) {
    let p = pivot(R.head, s * 0.44, 1.2, 0.05);
    for (let i = 0; i < 3; i++) {
      const q = pivot(p, 0, i ? 0.3 : 0, 0);
      q.rotation.z = s * (i ? -0.4 : -0.5); q.rotation.x = -0.2;
      box(q, 0.24 - i * 0.06, 0.34, 0.24 - i * 0.06, i === 2 ? (o.tip || o.c) : o.c, 0, 0.15, 0);
      p = q;
    }
  }
};
A.headphones = (R, L, o) => {
  box(R.head, 1.38, 0.12, 0.22, o.c, 0, 1.28, 0);
  for (const s of [-1, 1]) {
    box(R.head, 0.12, 0.5, 0.2, o.c, s * 0.68, 1.0, 0);
    box(R.head, 0.24, 0.46, 0.46, o.c2 || o.c, s * 0.68, 0.62, 0);
    box(R.head, 0.04, 0.24, 0.24, o.glow || 0x4fe6ff, s * 0.81, 0.62, 0, { glow: 1, ink: false });
  }
};
A.crowMask = (R, L, o) => {
  const H = R.head;
  box(H, 1.2, 0.56, 0.12, o.c, 0, 0.6, 0.56);
  mesh(H, cone(0.2, 0.7, 4), o.beak || 0x1a1a1f, 0, 0.46, 0.9, { rx: PI / 2, ry: 0.785 });
  for (const s of [-1, 1]) box(H, 0.2, 0.08, 0.04, o.eye || 0xff3030, s * 0.26, 0.66, 0.63, { glow: 1, ink: false, rz: s * -0.2 });
};
A.maskLower = (R, L, o) => box(R.head, 1.2, 0.46, 0.1, o.c, 0, 0.3, 0.52);
A.maskFull = (R, L, o) => {
  const H = R.head;
  box(H, 1.04, 1.02, 0.1, o.c || 0xf2f0ea, 0, 0.58, 0.58);
  for (const s of [-1, 1]) box(H, 0.26, 0.05, 0.03, 0x050505, s * 0.24, 0.62, 0.64, { ink: false, rz: s * 0.15 });
  box(H, 0.05, 0.3, 0.03, o.drip || 0xc01030, 0.24, 0.42, 0.64, { ink: false, glow: 1 });
};
A.cape = (R, L, o) => {
  R.cape = chain(R, R.torso, 0, 0.98, -0.32, o.n || 3, 0.5, (s, i) => {
    box(s, (o.w || 1.18) + i * 0.1, 0.52, 0.06, o.c, 0, -0.25, 0);
    if (o.c2) box(s, (o.w || 1.18) - 0.04 + i * 0.1, 0.48, 0.02, o.c2, 0, -0.25, 0.045, { ink: false });
    if (o.fur && i === 0) for (let k = -2; k <= 2; k++) box(s, 0.32, 0.26, 0.4, o.fur, k * 0.26, 0.02, 0.12, { rz: k * 0.15 });
    if (o.stars) for (let k = 0; k < 4; k++) box(s, 0.05, 0.05, 0.02, k % 2 ? 0xffffff : 0xbfe0ff, rnd(-0.5, 0.5), rnd(-0.45, -0.05), -0.045, { glow: 1, ink: false });
  }, { b0: 0.12, b: 0.08, amp: 0.09, sp: 2.2, zamp: 0.05 });
  if (o.trim) box(R.cape[R.cape.length - 1], 1.4, 0.06, 0.08, o.trim, 0, -0.5, 0, { ink: 0.02 });
};
A.coat = (R, L, o) => {
  for (const s of [-1, 1]) {
    chain(R, R.hips, s * 0.27, 0.06, -0.24, 2, 0.42, (sg, i) => box(sg, 0.5, 0.44, 0.08, o.c, 0, -0.21, 0),
      { b0: 0.12, b: 0.05, amp: 0.06, sp: 2, zamp: 0.04 });
    box(R.torso, 0.18, 0.86, 0.05, o.lapel || o.c, s * 0.38, 0.55, 0.3, { ink: 0.015 });
  }
};
A.scarf = (R, L, o) => {
  box(R.torso, 1.06, 0.22, 0.64, o.c, 0, 0.94, 0, { ink: 0.02 });
  chain(R, R.torso, 0.3, 0.92, -0.3, o.n || 4, 0.32, (s, i) => box(s, 0.24, 0.36, 0.06, i % 2 ? (o.c2 || o.c) : o.c, 0, -0.16, 0),
    { b0: 0.4, b: 0.05, amp: 0.2, sp: 4.2, zamp: 0.2, rz0: -(o.stream || 1.25) });
};
A.vest = (R, L, o) => {
  box(R.torso, 1.06, 0.86, 0.62, o.c, 0, 0.52, 0);
  for (const y of [0.35, 0.68]) box(R.torso, 1.08, 0.08, 0.64, o.stripe || 0xdfe7ef, 0, y, 0, { ink: false, glow: 1 });
};
A.apron = (R, L, o) => {
  box(R.torso, 0.86, 1.2, 0.05, o.c, 0, 0.32, 0.31, { ink: 0.02 });
  box(R.torso, 0.06, 0.4, 0.04, o.c, 0.3, 0.98, 0.3, { ink: false });
  box(R.torso, 0.06, 0.4, 0.04, o.c, -0.3, 0.98, 0.3, { ink: false });
};
A.armor = (R, L, o) => {
  box(R.torso, 1.08, 0.7, 0.64, o.c, 0, 0.62, 0);
  if (o.trim) box(R.torso, 1.1, 0.06, 0.66, o.trim, 0, 0.3, 0, { ink: false });
  if (o.emblem) box(R.torso, 0.24, 0.24, 0.04, o.emblem, 0, 0.66, 0.34, { rz: 0.785, glow: o.glowEmblem ? 1 : 0, ink: 0.015 });
  for (const s of [-1, 1]) {
    const p = box(R.torso, 0.62, 0.28, 0.68, o.c, s * 0.64, 1.0, 0, { rz: s * -0.28 });
    if (o.trim) box(p, 0.5, 0.08, 0.56, o.trim, 0, 0.17, 0, { ink: 0.02 });
  }
};
A.pauldron = (R, L, o) => {
  const s = o.side || 1, p = box(R.torso, 0.62, 0.26, 0.66, o.c, s * 0.62, 1.0, 0, { rz: s * -0.28 });
  if (o.c2) box(p, 0.5, 0.08, 0.56, o.c2, 0, 0.16, 0, { ink: 0.02 });
};
A.sash = (R, L, o) => box(R.torso, 0.12, 1.1, 0.04, o.c, 0.15, 0.55, 0.3, { ink: false, rz: 0.6 });
A.tie = (R, L, o) => {
  box(R.torso, 0.14, 0.6, 0.04, o.c, 0, 0.6, 0.3, { ink: 0.015 });
  box(R.torso, 0.2, 0.13, 0.05, o.c, 0, 0.9, 0.3, { ink: 0.015 });
  for (const s of [-1, 1]) box(R.torso, 0.24, 0.1, 0.05, o.collar || 0xeef3f8, s * 0.15, 0.97, 0.3, { rz: s * -0.4, ink: 0.015 });
};
A.lanyard = (R, L, o) => {
  box(R.torso, 0.04, 0.5, 0.03, o.c || 0x2f5fa8, 0.2, 0.68, 0.31, { rz: 0.32, ink: false });
  const b = box(R.torso, 0.22, 0.28, 0.03, 0xf5f5f5, 0.29, 0.38, 0.31, { ink: 0.015 });
  box(b, 0.16, 0.05, 0.02, o.c || 0x2f5fa8, 0, 0.08, 0.02, { ink: false });
};
A.nametag = (R, L, o) => box(R.torso, 0.26, 0.12, 0.03, o.c || 0xf2f2f2, -0.24, 0.72, 0.3, { ink: 0.015 });
A.bag = (R, L, o) => {
  box(R.torso, 0.08, 1.2, 0.04, o.strap || 0x3a2a1c, 0, 0.5, 0.3, { rz: -0.75, ink: false });
  box(R.hips, 0.56, 0.44, 0.22, o.c, -0.5, 0.08, 0.26, { ry: 0.3 });
  box(R.hips, 0.58, 0.18, 0.24, o.flap || o.c, -0.5, 0.24, 0.27, { ry: 0.3, ink: 0.02 });
};
A.backpack = (R, L, o) => box(R.torso, 0.82, 0.86, 0.4, o.c, 0, 0.55, -0.48);
A.jetpack = (R, L, o) => {
  box(R.torso, 0.9, 0.7, 0.26, o.c, 0, 0.6, -0.4);
  for (const s of [-1, 1]) {
    mesh(R.torso, cyl(0.18, 0.18, 0.8, 10), o.c2 || o.c, s * 0.28, 0.5, -0.62);
    mesh(R.torso, cyl(0.13, 0.2, 0.16, 10), 0x2a2a30, s * 0.28, 0.04, -0.62);
    marker(R, s < 0 ? "jetL" : "jetR", R.torso, s * 0.28, -0.05, -0.62);
  }
};
A.fur = (R, L, o) => { for (let k = -2; k <= 2; k++) box(R.torso, 0.34, 0.28, 0.72, o.c, k * 0.24, 1.02, 0, { rz: k * 0.12 }); };
A.tabard = (R, L, o) => {
  box(R.torso, 0.7, 1.24, 0.05, o.c, 0, 0.36, 0.31, { ink: 0.02 });
  if (o.emblem) box(R.torso, 0.24, 0.24, 0.03, o.emblem, 0, 0.6, 0.35, { ink: 0.015, rz: 0.785 });
};
A.collarTall = (R, L, o) => {
  box(R.torso, 1.24, 0.66, 0.12, o.c, 0, 1.3, -0.36, { rx: -0.3 });
  if (o.c2) box(R.torso, 1.1, 0.56, 0.05, o.c2, 0, 1.3, -0.29, { rx: -0.3, ink: false });
};
A.mantle = (R, L, o) => {
  const m = box(R.torso, 1.56, 0.24, 0.78, o.c, 0, 0.98, 0);
  if (o.trim) box(m, 1.6, 0.06, 0.82, o.trim, 0, -0.12, 0, { ink: false });
};
A.wings = (R, L, o) => {
  // o.kind: "feather" (toon), "light" (glowing hard light); o.n feathers per wing; o.pairs stacks extra wings
  const pairs = o.pairs || 1;
  R.wings = [];
  for (let p = 0; p < pairs; p++) for (const s of [-1, 1]) {
    const w = pivot(R.torso, s * 0.28, 0.82 + p * 0.12, -0.34);
    const n = o.n || 5, span = (o.span || 1.0) * (1 - p * 0.18);
    for (let i = 0; i < n; i++) {
      const f = pivot(w); f.rotation.z = -s * (0.25 + i * 0.22 - p * 0.35); // fan outward, away from the spine
      const len = span * (1.7 - i * 0.18);
      if (o.kind === "light") {
        box(f, 0.2, len, 0.04, i % 2 ? o.c : (o.c2 || o.c), 0, len / 2 + 0.1, -0.04 * i, { glow: 2, own: 1 });
        box(f, 0.05, len * 0.92, 0.05, 0xffffff, 0, len / 2 + 0.1, -0.04 * i + 0.01, { glow: 1, ink: false });
      } else box(f, 0.26, len, 0.08, i % 2 ? o.c : (o.c2 || o.c), 0, len / 2 + 0.1, -0.06 * i);
    }
    R.wings.push({ w, s, p });
  }
  R.anim.push(t => R.wings.forEach(({ w, s, p }) => {
    w.rotation.y = s * (0.45 + sin(t * (o.flap || 1.6) + p) * 0.12);
    w.rotation.x = 0.2 + p * 0.25;
  }));
};

// hand items: built with the business end along +y from the fist; o.rot turns them in the hand, o.hand picks "L"
function hand(R, o) {
  const h = pivot(o.hand === "L" ? R.handL : R.handR);
  if (o.rot) h.rotation.set(...o.rot);
  if (o.at) h.position.set(...o.at);
  return o.shift ? pivot(h, 0, -o.shift, 0) : h; // shift: grip further up the handle
}
K.hand = hand; K.upright = upright;
A.greatsword = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.14, 0.5, 0.14, 0x2a1d10, 0, 0, 0);
  box(s, 0.18, 0.16, 0.18, o.trim || 0xe8b54a, 0, -0.3, 0, { ink: 0.02 });
  box(s, 0.9, 0.14, 0.24, o.trim || 0xe8b54a, 0, 0.32, 0);
  R.gem = box(s, 0.22, 0.22, 0.3, o.glow, 0, 0.32, 0, { glow: 1, ink: 0.02, own: 1 });
  const blade = box(s, 0.42, 2.5, 0.1, o.c || 0xc9d3e0, 0, 1.66, 0);
  R.edge = box(blade, 0.1, 2.46, 0.12, o.glow, 0.2, 0, 0, { glow: 1, ink: false, own: 1 });
  box(blade, 0.3, 0.28, 0.1, o.c || 0xc9d3e0, 0, 1.36, 0, { rz: 0.785 });
  marker(R, "tip", blade, 0, 1.4, 0); marker(R, "base", blade, 0, -1.1, 0);
  R.anim.push(t => {
    const p = 0.75 + 0.25 * sin(t * 5), c = new T.Color(o.glow);
    R.edge.material.color.setRGB(c.r * p + 0.15, c.g * p + 0.1, c.b);
    R.gem.material.color.copy(R.edge.material.color);
  });
};
A.sword = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.12, 0.4, 0.12, o.grip || 0x3a2a1c, 0, 0, 0);
  box(s, 0.6, 0.1, 0.18, o.trim || 0xb8bec8, 0, 0.24, 0);
  const b = box(s, 0.2, o.len || 1.4, 0.06, o.c || 0xdfe6ee, 0, 0.3 + (o.len || 1.4) / 2, 0, { glow: o.glowBlade ? 1 : 0 });
  marker(R, "tip", b, 0, (o.len || 1.4) / 2, 0); marker(R, "base", b, 0, -(o.len || 1.4) / 2, 0);
};
A.katana = (R, L, o) => {
  const s = hand(R, o), len = o.len || 1.8;
  box(s, 0.11, 0.55, 0.11, o.grip || 0x1a1a22, 0, 0.05, 0);
  box(s, 0.32, 0.06, 0.32, o.trim || 0xc9a24a, 0, 0.34, 0);
  const b = box(s, 0.1, len, 0.04, o.c || 0xe6ecf2, 0.02, 0.37 + len / 2, 0, { rz: -0.04 });
  marker(R, "tip", b, 0, len / 2, 0); marker(R, "base", b, 0, -len / 2, 0);
};
A.sheath = (R, L, o) => {
  const s = pivot(R.hips, -0.55, 0.15, 0.1); s.rotation.set(0.2, 0, 1.3);
  box(s, 0.14, 1.7, 0.1, o.c || 0x1a1a22, 0, -0.5, 0);
  box(s, 0.11, 0.5, 0.11, o.grip || 0x6a1a1a, 0, 0.6, 0);
  box(s, 0.3, 0.06, 0.3, o.trim || 0xc9a24a, 0, 0.34, 0);
  marker(R, "hilt", s, 0, 0.8, 0); marker(R, "sheathEnd", s, 0, -1.3, 0);
};
A.dagger = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.1, 0.3, 0.1, 0x2a2a2a, 0, 0, 0);
  box(s, 0.12, 0.5, 0.04, o.c || 0xdfe6ee, 0, 0.38, 0, { glow: o.glowBlade ? 1 : 0 });
};
A.kunai = (R, L, o) => {
  const s = hand(R, o), spin = pivot(s, 0, -0.1, 0.1);
  mesh(spin, ring(0.08, 0.02, 6, 16), 0x9aa0a8, 0, -0.1, 0, { ink: false });
  box(spin, 0.06, 0.24, 0.06, 0x1a1a1f, 0, 0.08, 0);
  mesh(spin, cone(0.1, 0.4, 4), o.c || 0xc8ced6, 0, 0.4, 0);
  R.anim.push(t => { spin.rotation.x = t * 9; });
};
A.spear = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.1, 3.0, 0.1, o.shaft || 0x6a4a2a, 0, 0.5, 0);
  const head = mesh(s, cone(0.17, 0.62, 4), o.head || 0xd8dee6, 0, 2.3, 0, { glow: o.glowHead ? 1 : 0, ink: !o.glowHead });
  if (o.ribbon) box(s, 0.24, 0.14, 0.12, o.ribbon, 0, 1.9, 0, { ink: 0.02 });
  marker(R, "tip", head, 0, 0.3, 0); marker(R, "base", s, 0, 1.6, 0);
};
A.staff = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.12, 3.0, 0.12, o.shaft || 0x5a3a22, 0, 0.6, 0);
  if (o.vine) for (let i = 0; i < 6; i++) box(s, 0.16, 0.2, 0.16, 0x3f8a3a, 0, -0.5 + i * 0.4, 0, { ry: i * 0.6, ink: 0.02 });
  const top = pivot(s, 0, 2.3, 0);
  if (o.flower) for (let i = 0; i < 5; i++) { const pp = pivot(top); pp.rotation.z = (i / 5) * PI * 2; box(pp, 0.18, 0.3, 0.06, o.flower, 0, 0.2, 0); }
  const orb = mesh(top, ball(o.flower ? 0.13 : 0.22, 1), o.orb || 0x8ff0ff, 0, 0, 0, { glow: 1 });
  if (!o.flower) mesh(top, ring(0.3, 0.035, 6, 32), o.ringC || 0xe8b54a, 0, 0, 0, { glow: 1 });
  R.anim.push(t => { orb.scale.setScalar(1 + sin(t * 4) * 0.08); top.rotation.y = t; });
  marker(R, "orb", top);
};
A.bow = (R, L, o) => {
  const s = hand(R, o), c = o.c || 0x6a4a2a;
  box(s, 0.12, 0.3, 0.14, c, 0, 0, 0);
  for (const d of [-1, 1]) {
    box(s, 0.1, 0.7, 0.12, c, 0, d * 0.45, 0.1, { rx: d * -0.3 });
    box(s, 0.08, 0.5, 0.1, c, 0, d * 0.98, 0.3, { rx: d * -0.7 });
  }
  R.string = box(s, 0.025, 2.1, 0.025, o.string || 0xeae2c8, 0, 0, 0.42, { ink: false });
  R.arrow = box(s, 0.05, 0.05, 1.2, 0x8a6a3a, 0, 0, 0.0, { ink: false });
};
A.shield = (R, L, o) => {
  const s = o.planted ? pivot(R.root, o.at ? o.at[0] : 0.15, 0.95, 0.95) : hand(R, o);
  box(s, o.w || 1.3, o.h || 1.8, 0.16, o.c, 0, 0, 0.06);
  box(s, (o.w || 1.3) + 0.06, 0.1, 0.18, o.trim || 0xb8bec8, 0, (o.h || 1.8) / 2 - 0.05, 0.06, { ink: 0.02 });
  box(s, (o.w || 1.3) + 0.06, 0.1, 0.18, o.trim || 0xb8bec8, 0, -(o.h || 1.8) / 2 + 0.05, 0.06, { ink: 0.02 });
  if (o.emblem) box(s, 0.38, 0.38, 0.06, o.emblem, 0, 0.1, 0.17, { rz: 0.785, ink: 0.02 });
  R.shield = s;
};
A.flintlock = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.16, 0.36, 0.2, 0x5a3a22, 0, 0, 0.06, { rx: 0.3 });
  box(s, 0.12, 0.12, 0.9, 0x3a3a40, 0, 0.12, 0.5);
  box(s, 0.16, 0.14, 0.12, 0xc9a24a, 0, 0.12, 0.94, { ink: 0.02 });
  marker(R, "muzzle", s, 0, 0.12, 1.05);
};
A.blaster = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.22, 0.34, 0.3, o.c || 0xe6e8ee, 0, -0.05, 0.1);
  box(s, 0.26, 0.24, 0.66, o.c || 0xe6e8ee, 0, 0.14, 0.36);
  box(s, 0.12, 0.12, 0.08, o.glow || 0x4fe6ff, 0, 0.14, 0.72, { glow: 1, ink: 0.02 });
  marker(R, o.hand === "L" ? "muzzleL" : "muzzle", s, 0, 0.14, 0.8);
};
A.hammer = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.13, o.big ? 2.2 : 1.4, 0.13, o.shaft || 0x4a3220, 0, o.big ? 0.7 : 0.4, 0);
  const hy = o.big ? 1.9 : 1.15;
  const head = box(s, o.big ? 1.1 : 0.62, o.big ? 0.62 : 0.4, o.big ? 0.62 : 0.4, o.c || 0x8a9098, 0, hy, 0);
  if (o.glow) {
    R.rune = box(head, (o.big ? 1.12 : 0.64), 0.08, (o.big ? 0.64 : 0.42), o.glow, 0, 0, 0, { glow: 1, ink: false, own: 1 });
    R.anim.push(t => R.rune.material.color.setHSL(new T.Color(o.glow).getHSL({}).h, 1, 0.55 + sin(t * 3) * 0.12));
  }
  marker(R, "hammer", head);
};
A.wrench = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.12, 0.9, 0.08, o.c || 0x9aa0a8, 0, 0.3, 0);
  box(s, 0.34, 0.2, 0.1, o.c || 0x9aa0a8, 0, 0.8, 0);
  box(s, 0.1, 0.22, 0.1, o.c || 0x9aa0a8, 0.12, 0.96, 0);
};
A.flashlight = (R, L, o) => {
  const s = hand(R, o);
  mesh(s, cyl(0.1, 0.1, 0.6, 10), 0x2a2a30, 0, 0.12, 0);
  mesh(s, cyl(0.16, 0.11, 0.18, 10), 0x2a2a30, 0, 0.48, 0);
  mesh(s, cyl(0.13, 0.13, 0.03, 10), 0xfff6c8, 0, 0.58, 0, { glow: 1 });
  marker(R, "beam", s, 0, 0.6, 0); marker(R, "beamEnd", s, 0, 3.4, 0);
};
A.stopSign = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.08, 1.6, 0.08, 0xb8bec8, 0, 0.6, 0);
  const sign = pivot(s, 0, 1.55, 0.04);
  mesh(sign, cyl(0.52, 0.52, 0.06, 8), 0xffffff, 0, 0, 0, { rx: PI / 2, ry: PI / 8, ink: false });
  mesh(sign, cyl(0.46, 0.46, 0.07, 8), 0xd42a2a, 0, 0, 0.005, { rx: PI / 2, ry: PI / 8, inkScale: 1.15 });
  box(sign, 0.56, 0.12, 0.02, 0xffffff, 0, 0, 0.05, { ink: false, glow: 1 });
};
A.papers = (R, L, o) => {
  const s = hand(R, o);
  for (let i = 0; i < 5; i++) box(s, 0.56, 0.05, 0.72, i % 2 ? 0xf6f6f2 : 0xe9eef5, rnd(-0.03, 0.03), i * 0.055, 0.36, { ry: rnd(-0.12, 0.12), ink: 0.015 });
  R.papers = s;
};
A.bottle = (R, L, o) => {
  const s = hand(R, o);
  mesh(s, cyl(0.15, 0.15, 0.6, 12), o.c || 0x6fc8ff, 0, 0.2, 0);
  mesh(s, cyl(0.09, 0.09, 0.12, 10), 0x2a2a30, 0, 0.56, 0);
};
A.scanner = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.16, 0.42, 0.18, 0x2a2a30, 0, 0.06, 0, { rx: 0.4 });
  box(s, 0.34, 0.24, 0.42, 0x3a3a42, 0, 0.32, 0.18);
  R.scanLight = box(s, 0.26, 0.04, 0.04, 0xff2a2a, 0, 0.3, 0.4, { glow: 1, ink: false, own: 1 });
  marker(R, "scan", s, 0, 0.3, 0.45);
};
A.cup = (R, L, o) => {
  const s = pivot(R.handR, 0, 0, 0.3);
  mesh(s, cyl(0.19, 0.15, 0.4, 16), 0xf2efe8, 0, 0, 0, { inkScale: 1.14 });
  mesh(s, cyl(0.195, 0.18, 0.13, 16), 0xb7864f, 0, -0.02, 0, { ink: false });
  mesh(s, cyl(0.205, 0.205, 0.06, 16), 0x5a3a24, 0, 0.22, 0, { inkScale: 1.12 });
  marker(R, "steam", s, 0, 0.3, 0);
  upright(R, s, R.armR);
};
A.mug = (R, L, o) => {
  const s = pivot(o.hand === "L" ? R.handL : R.handR, 0, 0, 0.26);
  mesh(s, cyl(0.2, 0.2, 0.36, 14), o.c || 0x9a3a3a, 0, 0, 0, { inkScale: 1.14 });
  mesh(s, ring(0.12, 0.04, 6, 14), o.c || 0x9a3a3a, 0.22, 0, 0, { ink: false });
  marker(R, "steam", s, 0, 0.26, 0);
  upright(R, s, o.hand === "L" ? R.armL : R.armR);
};
A.watch = (R, L, o) => box(R.armL, 0.46, 0.12, 0.48, o.c || 0x2a2a30, 0, -0.62, 0, { ink: 0.02 });
A.lanternPole = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.08, 2.2, 0.08, 0x5a3a22, 0, 0.6, 0);
  box(s, 0.9, 0.08, 0.08, 0x5a3a22, 0.4, 1.66, 0);
  const lan = chain(R, s, 0.8, 1.62, 0, 1, 0.3, sg => {
    box(sg, 0.03, 0.3, 0.03, 0x2a2a2a, 0, -0.15, 0, { ink: false });
    box(sg, 0.42, 0.52, 0.42, o.c || 0xff6a3a, 0, -0.56, 0, { ink: 0.03 });
    box(sg, 0.32, 0.36, 0.44, 0xffd36a, 0, -0.56, 0, { glow: 1, ink: false });
    marker(R, "lantern", sg, 0, -0.56, 0);
  }, { b0: 0, b: 0, amp: 0.18, sp: 1.8, zamp: 0.08 });
};
A.cards = (R, L, o) => {
  const s = hand(R, o), fan = [];
  for (let i = 0; i < 5; i++) {
    const p = pivot(s, 0, 0.05, 0.12);
    box(p, 0.3, 0.44, 0.02, i === 2 ? (o.c2 || 0xffffff) : (o.c || 0x6a2aa8), 0, 0.26, 0.01 * i, { ink: 0.015 });
    fan.push(p);
  }
  R.anim.push(t => {
    const spread = 0.5 + K.smooth(0.2, 0.5, (t % 3) / 3) * 0.6 - K.smooth(0.7, 0.95, (t % 3) / 3) * 0.6;
    fan.forEach((p, i) => { p.rotation.z = (i - 2) * 0.22 * spread; });
  });
  marker(R, "cards", s, 0, 0.4, 0.15);
};
A.book = (R, L, o) => {
  const s = pivot(R.root, 0.85, 2.1, 0.7);
  box(s, 0.62, 0.08, 0.84, o.c || 0x6a2a2a, 0, 0, 0);
  for (const d of [-1, 1]) box(s, 0.28, 0.06, 0.78, 0xf2ead8, d * 0.15, 0.06, 0, { rz: d * 0.15, ink: 0.015 });
  R.anim.push(t => { s.position.y = 2.1 + sin(t * 2) * 0.1; s.rotation.y = -0.5 + sin(t * 0.8) * 0.2; });
};
A.baton = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.06, 0.18, 0.06, 0x2a2a2a, 0, 0, 0);
  box(s, 0.035, 0.9, 0.035, 0xf6f6f6, 0, 0.5, 0, { ink: 0.015 });
  marker(R, "baton", s, 0, 0.95, 0);
};
A.parasol = (R, L, o) => {
  const s = hand(R, o);
  box(s, 0.06, 2.0, 0.06, 0x2a1a1a, 0, 0.8, 0);
  mesh(s, cone(1.25, 0.5, 12), o.c || 0xc0182a, 0, 1.85, 0, { inkScale: 1.05 });
  mesh(s, cyl(1.26, 1.26, 0.04, 12), o.trim || 0xf2d28a, 0, 1.6, 0, { ink: false });
  R.anim.push(t => { s.rotation.y = t * 0.6; });
};
A.waterOrb = (R, L, o) => {
  const s = pivot(R.root, 0, 1.4, 0.75);
  const orb = mesh(s, ball(0.32, 2), o.c || 0x4fc8ff, 0, 0, 0, { glow: 2, own: 1 });
  mesh(s, ball(0.18, 1), 0xbff2ff, 0, 0, 0, { glow: 1 });
  R.anim.push(t => {
    const h = Math.abs(sin(t * 2.6));
    s.position.y = 1.3 + h * 0.9; s.position.x = sin(t * 1.3) * 0.25;
    orb.scale.set(1 + (1 - h) * 0.25, 1 - (1 - h) * 0.2, 1 + (1 - h) * 0.25);
  });
  marker(R, "water", s);
};
A.orb = (R, L, o) => {
  const s = pivot(o.hand === "L" ? R.armL : R.armR, 0, -1.22, 0.18);
  mesh(s, ball(0.17, 1), o.c || 0x050308, 0, 0, 0, { inkScale: 1.2 });
  const rg = mesh(s, ring(0.25, 0.03, 6, 32), o.ring || 0xc47bff, 0, 0, 0, { glow: 1, own: 1 });
  R.anim.push(t => { s.position.y = -1.22 + sin(t * 2.4) * 0.05; rg.rotation.set(1.1, t * 2.5, 0); });
  marker(R, "orb", s);
};
A.tapedFists = (R, L, o) => { for (const h of [R.handL, R.handR]) box(h, 0.42, 0.18, 0.44, o.c || 0xf2efe8, 0, 0.06, 0, { ink: 0.02 }); };
A.gauntlets = (R, L, o) => {
  for (const h of [R.handL, R.handR]) {
    box(h, 0.52, 0.46, 0.54, o.c, 0, 0.12, 0);
    box(h, 0.54, 0.06, 0.56, o.glow || 0x9cffd0, 0, 0.18, 0, { glow: 1, ink: false });
  }
};
A.mechArm = (R, L, o) => {
  const a = R.armR;
  box(a, 0.64, 0.5, 0.64, o.c || 0x8a4a22, 0, -0.2, 0);
  box(a, 0.72, 0.62, 0.72, o.c2 || 0x6b6f74, 0, -0.72, 0);
  box(a, 0.3, 0.3, 0.1, o.glow || 0xffa23a, 0, -0.68, 0.37, { glow: 1, ink: 0.02 });
  for (let i = 0; i < 3; i++) box(a, 0.16, 0.34, 0.16, o.c2 || 0x6b6f74, -0.22 + i * 0.22, -1.12, 0.12, { rx: -0.3 });
  marker(R, "mech", a, 0, -0.68, 0.4);
};

// floating things
function orbit(R, n, rad, y, make, sp, tilt, parent) {
  const g = pivot(parent || R.root, 0, y, 0);
  if (tilt) { g.rotation.x = tilt[0]; g.rotation.z = tilt[1]; }
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2, p = pivot(g, cos(a) * rad, 0, sin(a) * rad);
    make(p, i); items.push(p);
  }
  R.anim.push(t => { g.rotation.y = t * sp; items.forEach((p, i) => { p.position.y = sin(t * 2 + i * 2.1) * 0.1; }); });
  return { g, items };
}
A.charms = (R, L, o) => orbit(R, o.n || 6, 1.35, 1.6, (p, i) => {
  box(p, 0.24, 0.42, 0.02, 0xf2e6c8, 0, 0, 0, { ink: 0.015 });
  box(p, 0.04, 0.26, 0.03, 0xc0282a, 0, 0, 0.01, { ink: false });
  p.rotation.y = -(i / (o.n || 6)) * PI * 2 + PI / 2;
}, 0.6, [0.12, -0.08]);
A.beads = (R, L, o) => orbit(R, o.n || 10, 1.1, 1.9, p => mesh(p, ball(0.09, 0), o.c || 0x8a3a1a, 0, 0, 0, { inkScale: 1.25 }), 0.9, [0.25, 0]);
A.drone = (R, L, o) => {
  const { items } = orbit(R, 1, 1.25, 3.1, p => {
    box(p, 0.4, 0.2, 0.4, o.c || 0xe6e2d8, 0, 0, 0);
    box(p, 0.14, 0.1, 0.04, o.glow || 0x4fe6ff, 0, 0, 0.21, { glow: 1, ink: false });
    const rot = pivot(p, 0, 0.16, 0);
    box(rot, 0.7, 0.03, 0.08, 0x2a2a30, 0, 0, 0, { ink: false });
    R.anim.push(t => { rot.rotation.y = t * 30; });
  }, 0.9);
  marker(R, "drone", items[0]);
};
A.orbitOrbs = (R, L, o) => orbit(R, o.n || 3, o.r || 1.45, o.y || 1.3, (p, i) => {
  mesh(p, ball(0.2, 1), o.c || 0x050308, 0, 0, 0, { inkScale: 1.18 });
  const rg = mesh(p, ring(0.29, 0.035, 6, 32), o.ring || 0xffd76a, 0, 0, 0, { glow: 1, rx: 1.2 });
  R.anim.push(t => { rg.rotation.z = t * 2; });
}, o.sp || 0.8, [0.28, -0.12]);
A.ghostLanterns = (R, L, o) => orbit(R, o.n || 4, 1.5, 1.9, (p, i) => {
  box(p, 0.3, 0.38, 0.3, 0x2a2a34, 0, 0, 0, { ink: 0.03 });
  box(p, 0.22, 0.28, 0.32, o.c || 0x8affd2, 0, 0, 0, { glow: 1, ink: false });
  marker(R, "lan" + i, p);
}, 0.5, [0.2, 0.1]);
A.notesRing = (R, L, o) => orbit(R, o.n || 5, 1.6, 2.4, (p, i) => {
  box(p, 0.24, 0.18, 0.06, o.c || 0x111111, 0, 0, 0, { ink: 0.02, rz: 0.3 });
  box(p, 0.05, 0.56, 0.05, o.c || 0x111111, 0.1, 0.26, 0, { ink: false });
  if (i % 2) box(p, 0.22, 0.06, 0.05, o.c || 0x111111, 0.2, 0.52, 0, { ink: false, rz: -0.3 });
}, 0.7, [0.15, 0]);
A.serpent = (R, L, o) => {
  const g = pivot(R.root, 0, 2.0, 0); g.rotation.x = 0.35;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2, p = pivot(g, cos(a) * 1.5, 0, sin(a) * 1.5);
    p.rotation.y = -a;
    const sz = i === 0 ? 0.36 : 0.28 - (i / n) * 0.12;
    box(p, sz, sz, 0.3, i % 2 ? (o.c2 || o.c) : o.c, 0, 0, 0);
    if (i === 0) for (const s of [-1, 1]) box(p, 0.08, 0.06, 0.04, o.eye || 0xffd23a, s * 0.1, 0.06, 0.16, { glow: 1, ink: false });
  }
  R.anim.push(t => { g.rotation.y = -t * 0.7; g.position.y = 2.0 + sin(t * 1.5) * 0.08; });
};
A.pages = (R, L, o) => orbit(R, o.n || 8, 1.5, 2.0, (p, i) => {
  const pg = box(p, 0.36, 0.48, 0.02, 0xf4f1e8, 0, 0, 0, { ink: 0.015 });
  for (let k = 0; k < 3; k++) box(pg, 0.24, 0.025, 0.02, 0x1a1a1a, 0, 0.12 - k * 0.1, 0.012, { ink: false });
  R.anim.push(t => { pg.rotation.y = sin(t * 3 + i) * 0.6; });
}, 0.45, [0.25, 0.1]);
A.shards = (R, L, o) => orbit(R, o.n || 7, 1.55, 1.9, (p, i) => {
  const sh = mesh(p, new T.TetrahedronGeometry(0.22 + (i % 3) * 0.06), o.c || 0x0a0a0f, 0, 0, 0, { inkScale: 1.0 });
  mesh(p, new T.TetrahedronGeometry(0.24 + (i % 3) * 0.06), o.edge || 0xffffff, 0, 0, 0, { glow: 2, own: 1 }).material.wireframe = true;
  R.anim.push(t => { sh.rotation.set(t * (1 + i * 0.2), t * 0.7, 0); sh.children[0] && sh.children[0].rotation.set(0, 0, 0); });
}, 0.55, [0.2, -0.15]);
A.planets = (R, L, o) => orbit(R, 3, 1.65, 2.0, (p, i) => {
  const cs = [0xff8a3a, 0x5ab8ff, 0xc48aff];
  mesh(p, ball(0.18 + i * 0.05, 1), cs[i], 0, 0, 0, { inkScale: 1.15 });
  if (i === 1) mesh(p, ring(0.38, 0.03, 6, 32), 0xfff2c8, 0, 0, 0, { glow: 1, rx: 1.2 });
}, 0.5, [0.3, -0.1]);
A.parrot = (R, L, o) => {
  const p = pivot(R.torso, -0.85, 1.45, 0.1);
  box(p, 0.3, 0.34, 0.36, o.c || 0x3ac86a, 0, 0, 0);
  box(p, 0.24, 0.24, 0.24, o.c || 0x3ac86a, 0, 0.26, 0.08);
  mesh(p, cone(0.08, 0.2, 4), 0xffb02e, 0, 0.24, 0.28, { rx: PI / 2 });
  box(p, 0.06, 0.06, 0.03, 0x4fe6ff, 0.08, 0.3, 0.2, { glow: 1, ink: false });
  const wl = pivot(p, -0.17, 0.05, 0), wr = pivot(p, 0.17, 0.05, 0);
  box(wl, 0.06, 0.3, 0.3, o.c2 || 0xe63a3a, -0.03, -0.1, 0); box(wr, 0.06, 0.3, 0.3, o.c2 || 0xe63a3a, 0.03, -0.1, 0);
  R.anim.push(t => { const f = sin(t * 18) * 0.5; wl.rotation.z = -0.3 - f; wr.rotation.z = 0.3 + f; p.position.y = 1.45 + sin(t * 3) * 0.08; });
};

// ---------------- idle poses ----------------
// every pose: breathing, a wandering head, chains swaying; then the arms and legs for that pose
K.animate = function (R, t, P) {
  const br = sin(t * 2.0), fl = P.float ? sin(t * 1.5) : 0;
  R.root.position.y = P.float ? 0.12 + fl * 0.13 : 0;
  R.hips.position.y = R.hipY + br * 0.014;
  R.hips.rotation.set(0, 0, sin(t * 0.9) * 0.03);
  R.torso.rotation.set(P.lean || 0, (P.turn || 0) + sin(t * 0.8) * 0.04, 0);
  R.torso.scale.y = 1 + br * 0.016;
  R.head.rotation.set((P.headX || 0) + sin(t * 2 + 0.6) * 0.025, (P.headY || 0) + sin(t * 0.6) * 0.1, sin(t * 0.85) * -0.035);
  if (R.legL) {
    R.legL.rotation.set(0.06, 0, -0.05 - R.hips.rotation.z);
    R.legR.rotation.set(-0.06, 0, 0.05 - R.hips.rotation.z);
    if (P.float) { R.legL.rotation.x = 0.2 + fl * 0.06; R.legR.rotation.x = 0.05 - fl * 0.06; }
  }
  R.armL.rotation.set(sin(t * 1.4) * 0.08, 0, -0.12 - br * 0.03);
  R.armR.rotation.set(-sin(t * 1.4) * 0.08, 0, 0.12 + br * 0.03);
  const f = POSES[P.pose || "stand"];
  if (f) f(R, t, P, br, fl);
  for (const c of R.chains) c.segs.forEach((s, i) => {
    s.rotation.x = (i ? c.b : c.b0) + sin(t * c.sp - i * 0.85 + c.ph) * c.amp;
    s.rotation.z = (i ? 0 : c.rz0) + sin(t * c.sp * 0.65 - i * 0.7 + c.ph) * c.zamp;
    if (!i && c.ry0) s.rotation.y = c.ry0;
  });
  for (const a of R.anim) a(t, P);
};
const POSES = K.POSES = {
  stand() {},
  shoulder(R, t, P, br) { R.armR.rotation.set(-1.25 + br * 0.04, -0.25, 0.12); },
  guard(R, t, P, br) {
    R.armR.rotation.set(-0.75 + br * 0.03, 0, 0.18);
    R.armL.rotation.set(-0.45 + br * 0.03, 0, -0.2);
    if (R.legL) { R.legL.rotation.x = 0.25; R.legR.rotation.x = -0.2; }
  },
  float(R, t, P, br, fl) {
    R.armL.rotation.set(0.1 + sin(t * 1.5 + 1) * 0.06, 0, -0.42 - fl * 0.05);
    R.armR.rotation.set(0.1 + sin(t * 1.5) * 0.06, 0, 0.42 + fl * 0.05);
  },
  emperor(R, t, P, br, fl) {
    R.armR.rotation.set(-1.0 + fl * 0.05, 0.1, 0.38);
    R.armL.rotation.set(0.12 + sin(t * 1.5 + 1) * 0.06, 0, -0.42 - fl * 0.04);
  },
  bounce(R, t) {
    const b = Math.abs(sin(t * 4.4));
    R.root.position.y = b * 0.12;
    const jab = Math.pow(Math.max(0, sin(t * 2.2)), 8);
    R.armL.rotation.set(-1.45, 0, 0.42);
    R.armR.rotation.set(-1.35 - jab * 0.45, 0, -0.38 + jab * 0.2);
    if (R.legL) { R.legL.rotation.x = 0.2; R.legR.rotation.x = -0.25; }
    R.torso.rotation.y = -0.25;
  },
  cast(R, t, P, br, fl) {
    R.armR.rotation.set(-2.5 + sin(t * 2) * 0.08, 0, 0.25);
    R.armL.rotation.set(-0.3, 0, -0.5 - fl * 0.05);
  },
  staff(R, t, P, br) {
    R.armR.rotation.set(-0.55 + br * 0.03, 0, 0.12);
    R.armL.rotation.set(-0.2, 0, -0.35 + sin(t * 1.2) * 0.05);
  },
  cross(R, t, P, br) {
    R.armL.rotation.set(-1.18 + br * 0.03, 0, 1.0);
    R.armR.rotation.set(-1.32 + br * 0.03, 0, -1.0);
    R.head.rotation.z += 0.08;
  },
  hold(R, t, P, br) {
    R.armL.rotation.set(-0.85 + br * 0.03, 0, 0.32);
    R.armR.rotation.set(-0.85 + br * 0.03, 0, -0.32);
  },
  aim(R, t, P, br) {
    const kick = Math.pow(Math.max(0, sin(t * 1.6)), 30);
    R.armR.rotation.set(-1.5 + kick * 0.3, 0.1, 0.05);
    R.armL.rotation.set(-1.45 + kick * 0.25, -0.1, -0.05);
  },
  aimOne(R, t, P, br) {
    R.armR.rotation.set(-1.45, 0.15, 0.1);
    R.armL.rotation.set(0.1, 0, -0.35);
    R.torso.rotation.y = -0.35;
  },
  wave(R, t) {
    R.armR.rotation.set(-2.75, 0, 0.1 + sin(t * 3) * 0.22);
    R.armL.rotation.set(0.15, 0, -0.1);
  },
  pocket(R, t, P, br) {
    R.armL.rotation.set(0.25 + br * 0.02, 0, -0.06);
    R.armR.rotation.set(-0.55 + sin(t * 0.9) * 0.08, 0, 0.05);
  },
  rock(R, t, P, br) {
    const r = sin(t * 1.6);
    R.root.position.y = Math.max(0, r) * 0.06;
    R.torso.rotation.x = r * 0.04;
    R.armL.rotation.set(0.25, 0, -0.06);
    R.armR.rotation.set(-0.7 + r * 0.05, 0, 0.05);
  },
  meditate(R, t, P, br) {
    if (R.legL) { R.legL.rotation.set(-1.42, 0.7, 0); R.legR.rotation.set(-1.42, -0.7, 0); }
    R.armL.rotation.set(-0.7, 0, 0.3); R.armR.rotation.set(-0.7, 0, -0.3);
  },
  sip(R, t) {
    const c = (t % 6) / 6, s = K.smooth(0.55, 0.66, c) - K.smooth(0.8, 0.92, c);
    R.torso.rotation.x = 0.05;
    R.head.rotation.x += 0.12 - s * 0.3;
    R.armL.rotation.set(0.22, 0, -0.06);
    R.armR.rotation.set(-0.95 - s * 0.8, 0, -(0.08 + s * 0.42));
  },
  watch(R, t) {
    const c = (t % 5) / 5, s = K.smooth(0.5, 0.6, c) - K.smooth(0.82, 0.92, c);
    R.armL.rotation.set(-0.2 - s * 1.2, 0, 0.2 + s * 0.7);
    R.head.rotation.x += s * 0.35; R.head.rotation.y = -s * 0.5 + (1 - s) * R.head.rotation.y;
    R.armR.rotation.set(0.15, 0, 0.08);
  },
  tap(R, t) {
    const c = (t % 1.4) / 1.4, s = K.smooth(0.0, 0.12, c) - K.smooth(0.18, 0.34, c);
    R.armR.rotation.set(-0.7 + s * 0.35, 0, 0.1);
    R.armL.rotation.set(-0.5, 0, 0.35);
    R.head.rotation.x += 0.15;
    if (R.scanLight) R.scanLight.material.color.setRGB(1, s > 0.3 ? 0.9 : 0.15, s > 0.3 ? 0.9 : 0.15);
    R.P.flash = s;
  },
  nervous(R, t, P, br) {
    R.root.position.x = sin(t * 23) * 0.012;
    R.armL.rotation.set(-0.9, 0, 0.3); R.armR.rotation.set(-0.9, 0, -0.3);
    R.head.rotation.y = (sin(t * 0.9) > 0.6 ? 0.45 : sin(t * 0.9) < -0.6 ? -0.45 : 0) + sin(t * 9) * 0.02;
  },
  stretch(R, t) {
    const c = (t % 4) / 4, s = sin(c * PI * 2);
    R.armL.rotation.set(-2.9, 0, -0.1 + s * 0.2);
    R.armR.rotation.set(-2.9, 0, 0.1 + s * 0.2);
    R.torso.rotation.z = s * 0.18;
    R.hips.rotation.z = -s * 0.05;
  },
  yawn(R, t) {
    const c = (t % 7) / 7, s = K.smooth(0.55, 0.65, c) - K.smooth(0.85, 0.95, c);
    R.armL.rotation.set(-s * 2.6 + 0.15, 0, -0.1 - s * 0.3);
    R.armR.rotation.set(-s * 2.6 + 0.15, 0, 0.1 + s * 0.3);
    R.head.rotation.x += -s * 0.35;
    const m = R.head.userData.mouth; if (m) m.scale.y = 1 + s * 2.5;
  },
  jog(R, t) {
    const a = sin(t * 7);
    R.root.position.y = Math.abs(a) * 0.08;
    if (R.legL) { R.legL.rotation.x = a * 0.3; R.legR.rotation.x = -a * 0.3; }
    R.armL.rotation.set(-a * 0.35, 0, -0.1); R.armR.rotation.set(a * 0.35, 0, 0.1);
  },
  archer(R, t) {
    const c = (t % 3.2) / 3.2, s = K.smooth(0.3, 0.5, c) - K.smooth(0.75, 0.85, c);
    R.armL.rotation.set(-1.5, 0.35, -0.05);
    R.armR.rotation.set(-1.5 + s * 0.05, -0.45 - s * 0.35, 0.1);
    R.torso.rotation.y = -0.6;
    R.head.rotation.y = 0.5;
    if (R.string) R.string.position.z = 0.42 + s * 0.35;
    if (R.arrow) R.arrow.position.z = 0.0 + s * 0.35 + 0.4;
  },
  peek(R, t) {
    const c = (t % 5) / 5, s = K.smooth(0.4, 0.5, c) - K.smooth(0.75, 0.85, c);
    R.root.position.y = -0.08 + s * 0.1;
    R.head.rotation.y = 0.0 + sin(t * 3) * s * 0.3;
    R.armL.rotation.set(-0.5, 0, 0.3); R.armR.rotation.set(-0.5, 0, -0.3);
  },
  nod(R, t) {
    const b = Math.pow(Math.abs(sin(t * 4.2)), 3);
    R.head.rotation.x += b * 0.22;
    R.root.position.y = b * 0.04;
    R.armL.rotation.set(0.25, 0, -0.08); R.armR.rotation.set(0.25, 0, 0.08);
  },
  juggle(R, t) {
    const h = Math.abs(sin(t * 2.6));
    R.armL.rotation.set(-0.9 - (1 - h) * 0.2, 0, 0.35); R.armR.rotation.set(-0.9 - (1 - h) * 0.2, 0, -0.35);
    R.head.rotation.x += -h * 0.15;
  },
  tinker(R, t) {
    const c = (t % 1.1) / 1.1, s = K.smooth(0, 0.15, c) - K.smooth(0.2, 0.45, c);
    R.armR.rotation.set(-1.1 + s * 0.5, 0, -0.1);
    R.armL.rotation.set(-0.7, 0, 0.3);
    R.head.rotation.x += 0.2;
    R.P.hit = s;
  },
  iai(R, t, P, br) {
    R.armR.rotation.set(-0.6 + br * 0.02, 0, -0.75);
    R.armL.rotation.set(-0.3, 0, 0.55);
    R.torso.rotation.y = -0.3;
    if (R.legL) { R.legL.rotation.x = 0.35; R.legR.rotation.x = -0.25; }
  },
  kata(R, t) {
    const a = sin(t * 0.9);
    R.armR.rotation.set(-1.4 + a * 0.4, 0, -0.3 + a * 0.3);
    R.armL.rotation.set(-1.0 - a * 0.4, 0, 0.5 - a * 0.3);
    R.torso.rotation.y = a * 0.3;
    if (R.legL) { R.legL.rotation.set(0.3, 0, -0.2); R.legR.rotation.set(-0.3, 0, 0.2); }
    R.root.position.y = -0.05;
  },
  lean(R, t, P, br) {
    R.armR.rotation.set(-0.35 + br * 0.02, 0, 0.32);
    R.armL.rotation.set(0.2, 0, -0.15);
    R.hips.rotation.z = 0.06;
  },
  forge(R, t) {
    const c = (t % 1.6) / 1.6, s = K.smooth(0, 0.4, c) - K.smooth(0.45, 0.55, c);
    R.armR.rotation.set(-0.6 - s * 1.8, 0, 0.1);
    R.armL.rotation.set(-0.6, 0, 0.3);
    R.P.hit = 1 - Math.min(1, Math.abs(c - 0.52) * 12);
  },
  conduct(R, t, P, br, fl) {
    R.armR.rotation.set(-1.7 + sin(t * 2.4) * 0.45, 0, 0.3 + sin(t * 4.8) * 0.25);
    R.armL.rotation.set(-1.2 + sin(t * 1.2) * 0.3, 0, -0.6);
  },
  parasol(R, t, P, br, fl) {
    R.armR.rotation.set(-1.0, 0, -0.35);
    R.armL.rotation.set(0.1 + sin(t * 1.5) * 0.05, 0, -0.45 - fl * 0.05);
  },
  divine(R, t, P, br, fl) {
    R.armL.rotation.set(-0.3 + sin(t * 1.2) * 0.1, 0, -0.8 - fl * 0.08);
    R.armR.rotation.set(-0.3 + sin(t * 1.2 + 1) * 0.1, 0, 0.8 + fl * 0.08);
    R.head.rotation.x -= 0.1;
  },
};

// ---------------- 2D card effects ----------------
// each runs per card view with its own state; F = front context (over the model), B = back context (behind it)
const FX = K.FX = {};
function spawn(st, rate, dt, make) { st.acc = (st.acc || 0) + rate * dt; while (st.acc >= 1) { st.acc -= 1; (st.list = st.list || []).push(make()); } }
function tick(st, dt, draw) {
  const L = st.list || [];
  for (let i = L.length - 1; i >= 0; i--) {
    const p = L[i]; p.life += dt;
    if (p.life >= p.max) { L.splice(i, 1); continue; }
    draw(p, p.life / p.max);
  }
}
// which layer a point belongs on: behind the body (depth > bias) goes on the back layer, under the figure
const lay = (F, B, pt, o, bias = 0.12) => (o && o.back ? B : o && o.front ? F : pt && pt[2] > bias ? B : F);
K.lay = lay;
const col = (c, a) => { const k = new T.Color(c); return `rgba(${k.r * 255 | 0},${k.g * 255 | 0},${k.b * 255 | 0},${a})`; };
const hue = (h, a, l = 70) => `hsla(${h % 360},100%,${l}%,${a})`;
function area(o, W, H) { const a = o.area || [0.2, 0.8, 0.3, 0.85]; return [W * rnd(a[0], a[1]), H * rnd(a[2], a[3])]; }
function star(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s * 0.5, y); ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s * 0.5, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
}
K.star = star;
function boltPts(a, b, segs, jag) {
  const pts = [a];
  for (let i = 1; i < segs; i++) {
    const f = i / segs;
    pts.push([a[0] + (b[0] - a[0]) * f + rnd(-0.5, 0.5) * jag, a[1] + (b[1] - a[1]) * f + rnd(-0.5, 0.5) * jag]);
  }
  pts.push(b);
  return pts;
}
function strokePts(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
K.boltPts = boltPts; K.strokePts = strokePts;

FX.glow = (F, B, st, p, o) => {
  const c = p.scr(o.at); if (!c) return;
  const r = (o.r || 70) * p.S * (1 + sin(p.t * (o.pulse || 3)) * 0.06);
  const ctx = lay(F, B, c, o, -0.25); // glows sit behind unless clearly in front of him
  const g = ctx.createRadialGradient(c[0], c[1], r * 0.15, c[0], c[1], r);
  (o.stops || [[0, col(o.c, 0.8)], [1, col(o.c, 0)]]).forEach(([k, s]) => g.addColorStop(k, s));
  ctx.fillStyle = g; ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
};
FX.rays = (F, B, st, p, o) => {
  const c = p.scr(o.at); if (!c) return;
  const n = o.n || 12, L = (o.len || 140) * p.S;
  B.save(); B.translate(c[0], c[1]); B.rotate(p.t * (o.spin || 0.2));
  for (let i = 0; i < n; i++) {
    B.rotate((PI * 2) / n);
    const g = B.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, col(o.c, o.a || 0.35)); g.addColorStop(1, col(o.c, 0));
    B.fillStyle = g;
    B.beginPath(); B.moveTo(0, 0); B.lineTo(L, -L * 0.07 * (i % 2 ? 0.6 : 1)); B.lineTo(L, L * 0.07 * (i % 2 ? 0.6 : 1)); B.fill();
  }
  B.restore();
};
FX.pillar = (F, B, st, p, o) => {
  const c = p.scr(o.at || "center"), w = (o.w || 60) * p.S * (1 + sin(p.t * 2.5) * 0.08);
  const g = B.createLinearGradient(c[0] - w, 0, c[0] + w, 0);
  g.addColorStop(0, col(o.c, 0)); g.addColorStop(0.5, col(o.c, o.a || 0.35)); g.addColorStop(1, col(o.c, 0));
  B.fillStyle = g; B.fillRect(c[0] - w, 0, w * 2, p.H);
};
FX.motes = (F, B, st, p, o) => {
  const S = p.S;
  spawn(st, o.rate || 14, p.dt, () => {
    const at = o.at ? p.scr(o.at) : null;
    const [x, y] = at ? [at[0] + rnd(-1, 1) * (o.spread || 30) * S, at[1] + rnd(-1, 1) * (o.spread || 30) * S] : area(o, p.W, p.H);
    return { x, y, vx: rnd(-1, 1) * 10 * S, vy: -(o.up || 30) * S * rnd(0.6, 1.3), life: 0, max: rnd(1, 2) * (o.life || 1),
      r: (o.size || 1.6) * S * rnd(0.6, 1.3), h: o.c === "rainbow" ? p.t * 90 + rnd(0, 120) : 0, ctx: lay(F, B, at, o) };
  });
  tick(st, p.dt, (q, k) => {
    q.x += (q.vx + sin(p.t * 3 + q.r * 9) * 6 * S) * p.dt; q.y += q.vy * p.dt;
    const a = sin(k * PI), ctx = q.ctx;
    ctx.fillStyle = o.c === "rainbow" ? hue(q.h, a) : col(o.c, a);
    ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.6 + a * 0.5), 0, PI * 2); ctx.fill();
  });
};
FX.embers = (F, B, st, p, o) => FX.motes(F, B, st, p, Object.assign({ c: 0xff8a2a, rate: 16, up: 40, size: 1.4 }, o));
FX.sparks = (F, B, st, p, o) => {
  const a = p.scr(o.a), b = p.scr(o.b), S = p.S; if (!a || !b) return;
  spawn(st, o.rate || 14, p.dt, () => {
    const f = Math.random();
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, vx: rnd(-20, 20) * S, vy: rnd(-60, -20) * S, life: 0, max: rnd(0.5, 1),
      ctx: lay(F, B, [0, 0, a[2] + (b[2] - a[2]) * f], o) };
  });
  tick(st, p.dt, (q, k) => {
    q.x += q.vx * p.dt; q.y += q.vy * p.dt; q.vy -= 10 * S * p.dt;
    q.ctx.fillStyle = col(o.c, 1 - k);
    q.ctx.fillRect(q.x - S, q.y - S, 2 * S * (1 - k) + S, 2 * S * (1 - k) + S);
  });
};
FX.arc = (F, B, st, p, o) => {
  const a = p.scr(o.a), b = p.scr(o.b), S = p.S; if (!a || !b) return;
  st.next = (st.next === undefined ? rnd(0.3, 1) : st.next) - p.dt;
  if (st.next <= 0) { st.arc = { life: 0, pts: boltPts(a, b, 9, (o.jag || 18) * S) }; st.next = rnd(0.6, 1.8) * (o.every || 1); }
  if (!st.arc) return;
  st.arc.life += p.dt;
  if (st.arc.life > 0.18) { st.arc = null; return; }
  if (Math.random() < 0.5) st.arc.pts = boltPts(a, b, 9, (o.jag || 18) * S);
  const k = 1 - st.arc.life / 0.18, pts = st.arc.pts, n = pts.length - 1;
  // each segment goes on its own layer, so a bolt running behind his head is hidden there and shows in front
  for (const [w, c] of [[7 * S, col(o.c, 0.35 * k)], [2.4 * S, col(o.core || 0xeafcff, k)]]) {
    for (let i = 0; i < n; i++) {
      const ctx = lay(F, B, [0, 0, a[2] + (b[2] - a[2]) * ((i + 0.5) / n)], o);
      ctx.lineJoin = ctx.lineCap = "round"; ctx.lineWidth = w; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
  }
};
FX.steam = (F, B, st, p, o) => {
  const c = p.scr(o.at || "steam"), S = p.S; if (!c) return;
  spawn(st, 7, p.dt, () => ({ x: c[0], y: c[1], life: 0, max: rnd(1.6, 2.6), ph: rnd(0, 6), ctx: lay(F, B, c, o) }));
  tick(st, p.dt, (q, k) => {
    const x = q.x + sin(q.ph + q.life * 3) * 5 * S * k, y = q.y - q.life * 22 * S;
    q.ctx.fillStyle = `rgba(210,214,222,${0.16 * sin(k * PI)})`;
    q.ctx.beginPath(); q.ctx.arc(x, y, (3 + k * 7) * S, 0, PI * 2); q.ctx.fill();
  });
};
FX.smoke = (F, B, st, p, o) => {
  const S = p.S;
  spawn(st, o.rate || 6, p.dt, () => {
    const at = o.at ? p.scr(o.at) : null;
    const [x, y] = at || (o.at ? [0, 0] : area(o, p.W, p.H));
    return { x: x + rnd(-8, 8) * S, y, life: 0, max: rnd(1.5, 2.5), ph: rnd(0, 6), r: rnd(6, 12) * S, ctx: lay(F, B, at, o) };
  });
  F.globalCompositeOperation = B.globalCompositeOperation = "source-over";
  tick(st, p.dt, (q, k) => {
    q.ctx.fillStyle = col(o.c || 0x222228, (o.a || 0.35) * sin(k * PI));
    q.ctx.beginPath(); q.ctx.arc(q.x + sin(q.ph + q.life * 2) * 6 * S, q.y - q.life * (o.up || 18) * S, q.r * (0.6 + k), 0, PI * 2); q.ctx.fill();
  });
  F.globalCompositeOperation = B.globalCompositeOperation = "lighter";
};
FX.fall = (F, B, st, p, o) => {
  // snow, petals, leaves, feathers, sand: things drifting down
  const S = p.S, kind = o.kind || "snow";
  spawn(st, o.rate || 8, p.dt, () => ({ x: rnd(0, p.W), y: -10 * S, vx: rnd(-10, 10) * S, vy: rnd(18, 34) * S * (o.speed || 1),
    life: 0, max: rnd(3, 5), rot: rnd(0, 6), vr: rnd(-3, 3), s: rnd(0.8, 1.4) * S * (o.size || 1) }));
  const prev = F.globalCompositeOperation;
  if (kind === "leaf" || kind === "petal" || kind === "feather" || kind === "blackFeather") F.globalCompositeOperation = "source-over";
  tick(st, p.dt, (q, k) => {
    q.x += (q.vx + sin(p.t * 2 + q.rot) * 12 * S) * p.dt; q.y += q.vy * p.dt; q.rot += q.vr * p.dt;
    const a = Math.min(1, (1 - k) * 3);
    F.save(); F.translate(q.x, q.y); F.rotate(q.rot);
    if (kind === "snow") { F.fillStyle = `rgba(230,246,255,${0.8 * a})`; F.beginPath(); F.arc(0, 0, 1.6 * q.s, 0, PI * 2); F.fill(); }
    else if (kind === "petal") { F.fillStyle = col(o.c || 0xff6f9a, 0.9 * a); F.beginPath(); F.ellipse(0, 0, 4 * q.s, 2.2 * q.s, 0, 0, PI * 2); F.fill(); }
    else if (kind === "leaf") { F.fillStyle = col(o.c || 0x6ac04a, 0.9 * a); F.beginPath(); F.ellipse(0, 0, 4.5 * q.s, 2 * q.s, 0, 0, PI * 2); F.fill(); }
    else if (kind === "feather" || kind === "blackFeather") {
      F.fillStyle = kind === "feather" ? col(o.c || 0xfff6dc, 0.95 * a) : `rgba(10,10,14,${0.9 * a})`;
      F.beginPath(); F.ellipse(0, 0, 6 * q.s, 1.8 * q.s, 0, 0, PI * 2); F.fill();
    } else if (kind === "sand") { F.fillStyle = col(o.c || 0xffd27a, a); F.fillRect(-q.s, -q.s, q.s * 2, q.s * 2); }
    F.restore();
  });
  F.globalCompositeOperation = prev;
};
FX.notes = (F, B, st, p, o) => {
  const S = p.S;
  spawn(st, o.rate || 2.5, p.dt, () => ({ x: rnd(0.2, 0.8) * p.W, y: rnd(0.4, 0.7) * p.H, life: 0, max: rnd(1.6, 2.4), g: Math.random() < 0.5 ? "♪" : "♫", h: rnd(0, 360) }));
  tick(st, p.dt, (q, k) => {
    F.font = `${(16 * S) | 0}px Georgia, serif`;
    F.fillStyle = o.c === "rainbow" ? hue(q.h + p.t * 60, sin(k * PI)) : col(o.c || 0xffffff, sin(k * PI));
    F.fillText(q.g, q.x + sin(q.life * 3) * 8 * S, q.y - q.life * 26 * S);
  });
};
FX.stars = (F, B, st, p, o) => {
  spawn(st, o.rate || 3, p.dt, () => ({ x: rnd(0.08, 0.92) * p.W, y: rnd(0.06, 0.85) * p.H, life: 0, max: rnd(0.6, 1.2), s: rnd(4, 9) * p.S, h: rnd(0, 360) }));
  tick(st, p.dt, (q, k) => {
    const a = sin(k * PI);
    F.fillStyle = o.c === "rainbow" ? hue(q.h, a, 85) : col(o.c || 0xffffff, a);
    star(F, q.x, q.y, q.s * a);
  });
};
FX.ring = (F, B, st, p, o) => {
  const c = p.scr(o.at || "feet"); if (!c) return;
  spawn(st, 1 / (o.every || 1.6), p.dt, () => ({ life: 0, max: o.dur || 1.2 }));
  tick(st, p.dt, (q, k) => {
    const rx = (10 + k * (o.r || 80)) * p.S, ry = (4 + k * (o.r || 80) * (o.flat || 0.3)) * p.S;
    // the far half of the ring passes behind him, the near half in front
    for (const [ctx, a0, a1] of o.back ? [[B, 0, PI * 2]] : [[B, PI, PI * 2], [F, 0, PI]]) {
      ctx.strokeStyle = o.c === "rainbow" ? hue(p.t * 120, 1 - k) : col(o.c, (1 - k) * 0.8);
      ctx.lineWidth = (3 - k * 2) * p.S;
      ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, a0, a1); ctx.stroke();
    }
  });
};
FX.beam = (F, B, st, p, o) => {
  const a = p.scr(o.a || "beam"), b = p.scr(o.b || "beamEnd"); if (!a || !b) return;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, w = (o.w || 26) * p.S;
  const ctx = lay(F, B, a, o);
  const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
  const fl = 0.85 + Math.random() * 0.15;
  g.addColorStop(0, col(o.c || 0xfff6c8, 0.5 * fl)); g.addColorStop(1, col(o.c || 0xfff6c8, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + nx * w, b[1] + ny * w); ctx.lineTo(b[0] - nx * w, b[1] - ny * w); ctx.fill();
};
FX.flash = (F, B, st, p, o) => {
  const v = p.R.P[o.key || "flash"] || 0; if (v < 0.25) return;
  const c = p.scr(o.at); if (!c) return;
  const r = (o.r || 26) * p.S, ctx = lay(F, B, c, o);
  const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
  g.addColorStop(0, col(o.c, v)); g.addColorStop(1, col(o.c, 0));
  ctx.fillStyle = g; ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  if (o.sparks) for (let i = 0; i < 3; i++) { ctx.fillStyle = col(o.c, v); ctx.fillRect(c[0] + rnd(-r, r) * 0.6, c[1] + rnd(-r, r) * 0.6, 2 * p.S, 2 * p.S); }
};
FX.drop = (F, B, st, p, o) => {
  const c = p.scr(o.at || "head"); if (!c) return;
  spawn(st, o.rate || 0.6, p.dt, () => ({ x: c[0] + rnd(-14, 14) * p.S, y: c[1] + rnd(0, 10) * p.S, life: 0, max: 0.9, ctx: lay(F, B, c, o) }));
  tick(st, p.dt, (q, k) => {
    q.ctx.fillStyle = col(o.c || 0x8fdcff, 1 - k);
    q.ctx.beginPath(); q.ctx.ellipse(q.x, q.y + k * 20 * p.S, 2.2 * p.S, 3.4 * p.S, 0, 0, PI * 2); q.ctx.fill();
  });
};
FX.dust = (F, B, st, p, o) => {
  const c = p.scr("feet"); if (!c) return;
  spawn(st, o.rate || 3, p.dt, () => ({ x: c[0] + rnd(-30, 30) * p.S, y: c[1], life: 0, max: rnd(0.6, 1), d: rnd(-1, 1) }));
  const prev = F.globalCompositeOperation; F.globalCompositeOperation = "source-over";
  tick(st, p.dt, (q, k) => {
    F.fillStyle = col(o.c || 0xb9a27a, 0.35 * (1 - k));
    F.beginPath(); F.arc(q.x + q.d * k * 14 * p.S, q.y - k * 6 * p.S, (2 + k * 6) * p.S, 0, PI * 2); F.fill();
  });
  F.globalCompositeOperation = prev;
};
FX.wind = (F, B, st, p, o) => {
  spawn(st, o.rate || 5, p.dt, () => ({ x: -40 * p.S, y: rnd(0.1, 0.9) * p.H, life: 0, max: rnd(0.5, 0.9), l: rnd(30, 70) * p.S }));
  tick(st, p.dt, (q, k) => {
    const x = q.x + k * (p.W + 80 * p.S);
    F.strokeStyle = col(o.c || 0xdff6ff, 0.35 * sin(k * PI)); F.lineWidth = 1.5 * p.S;
    F.beginPath(); F.moveTo(x, q.y); F.lineTo(x + q.l, q.y + sin(p.t * 6 + q.y) * 2 * p.S); F.stroke();
  });
};
FX.bubbles = (F, B, st, p, o) => {
  const c = p.scr(o.at || "water"); if (!c) return;
  spawn(st, o.rate || 6, p.dt, () => ({ x: c[0] + rnd(-16, 16) * p.S, y: c[1], life: 0, max: rnd(0.8, 1.5), r: rnd(1.5, 3.5) * p.S, ctx: lay(F, B, c, o) }));
  tick(st, p.dt, (q, k) => {
    q.ctx.strokeStyle = col(o.c || 0xbff2ff, 1 - k); q.ctx.lineWidth = 1.2 * p.S;
    q.ctx.beginPath(); q.ctx.arc(q.x + sin(q.life * 5) * 4 * p.S, q.y - q.life * 30 * p.S, q.r, 0, PI * 2); q.ctx.stroke();
  });
};
FX.jet = (F, B, st, p, o) => {
  for (const at of o.at) {
    const c = p.scr(at); if (!c) continue;
    const L = (22 + Math.random() * 10) * p.S, w = 7 * p.S, ctx = lay(F, B, c, o);
    const g = ctx.createLinearGradient(c[0], c[1], c[0], c[1] + L);
    g.addColorStop(0, "rgba(255,255,230,.95)"); g.addColorStop(0.3, col(o.c || 0x4fe6ff, 0.8)); g.addColorStop(1, col(o.c || 0x4fe6ff, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(c[0] - w, c[1]); ctx.lineTo(c[0] + w, c[1]); ctx.lineTo(c[0], c[1] + L); ctx.fill();
  }
};
FX.glyphs = (F, B, st, p, o) => {
  const S = p.S, set = o.set || ["ᚠ", "ᚱ", "ᛇ", "ᛟ", "ᛗ"];
  spawn(st, o.rate || 2, p.dt, () => ({ x: rnd(0.15, 0.85) * p.W, y: rnd(0.3, 0.8) * p.H, life: 0, max: rnd(1.4, 2.2), g: set[(Math.random() * set.length) | 0], h: rnd(0, 360) }));
  tick(st, p.dt, (q, k) => {
    F.font = `700 ${(o.size || 15) * S | 0}px Georgia, serif`;
    F.fillStyle = o.c === "rainbow" ? hue(q.h + p.t * 80, sin(k * PI)) : col(o.c, sin(k * PI));
    F.fillText(q.g, q.x, q.y - q.life * 14 * S);
  });
};
FX.ink = (F, B, st, p, o) => {
  spawn(st, o.rate || 4, p.dt, () => ({ x: rnd(0.25, 0.75) * p.W, y: rnd(0.2, 0.6) * p.H, life: 0, max: rnd(1.2, 2), l: rnd(10, 26) * p.S }));
  const prev = F.globalCompositeOperation; F.globalCompositeOperation = "source-over";
  tick(st, p.dt, (q, k) => {
    F.fillStyle = `rgba(5,5,8,${0.8 * sin(k * PI)})`;
    F.fillRect(q.x, q.y, 2.4 * p.S, q.l * Math.min(1, k * 2));
    F.beginPath(); F.arc(q.x + 1.2 * p.S, q.y + q.l * Math.min(1, k * 2), 2.2 * p.S, 0, PI * 2); F.fill();
  });
  F.globalCompositeOperation = prev;
};
FX.hexbits = (F, B, st, p, o) => {
  spawn(st, o.rate || 10, p.dt, () => ({ x: rnd(0.2, 0.8) * p.W, y: rnd(0.4, 0.9) * p.H, life: 0, max: rnd(0.8, 1.6), s: rnd(2, 4) * p.S }));
  tick(st, p.dt, (q, k) => {
    F.fillStyle = col(o.c || 0x4fe6ff, sin(k * PI));
    F.fillRect(q.x, q.y - q.life * 30 * p.S, q.s, q.s);
  });
};
FX.glitch = (F, B, st, p, o) => {
  // tears the rendered figure into offset slices with a colour-split edge
  st.next = (st.next || 0) - p.dt;
  if (st.next <= 0) { st.on = rnd(0.08, 0.22); st.next = rnd(0.6, 1.8) / (o.amount || 1); st.seed = Math.random(); }
  if (!(st.on > 0)) return;
  st.on -= p.dt;
  const src = p.src, sw = src.width, sh = src.height, n = 5;
  for (let i = 0; i < n; i++) {
    const y0 = ((st.seed * 997 + i * 0.37) % 1) * p.H, h = rnd(4, 18) * p.S, off = rnd(-14, 14) * p.S;
    const sy = (y0 / p.H) * sh, shh = (h / p.H) * sh;
    F.globalCompositeOperation = "source-over";
    F.drawImage(src, 0, sy, sw, shh, off, y0, p.W, h);
    F.globalCompositeOperation = "lighter";
    F.globalAlpha = 0.6;
    F.fillStyle = i % 2 ? "rgba(255,40,80,.5)" : "rgba(40,240,255,.5)";
    F.fillRect(off + (i % 2 ? 3 : -3) * p.S, y0, p.W, 1.5 * p.S);
    F.globalAlpha = 1;
  }
};
FX.swirl = (F, B, st, p, o) => {
  // matter spiralling into a point (accretion)
  const c = p.scr(o.at); if (!c) return;
  const S = p.S;
  spawn(st, o.rate || 40, p.dt, () => ({ a: rnd(0, PI * 2), r: rnd(70, 120) * S, life: 0, max: rnd(1.2, 2), h: rnd(0, 60) }));
  const ctx = lay(F, B, c, o);
  tick(st, p.dt, (q, k) => {
    const r = q.r * (1 - k * 0.92), a = q.a + k * 7;
    const x = c[0] + cos(a) * r, y = c[1] + sin(a) * r * (o.flat || 0.35);
    ctx.fillStyle = hue((o.hue || 280) + q.h, sin(k * PI), 65 + k * 20);
    ctx.beginPath(); ctx.arc(x, y, (1 + k * 1.6) * S, 0, PI * 2); ctx.fill();
  });
};
FX.afterimage = (F, B, st, p, o) => {
  // ghost copies of the last few frames, tinted, trailing behind the figure
  st.buf = st.buf || [];
  st.cd = (st.cd || 0) - p.dt;
  if (st.cd <= 0) {
    st.cd = o.every || 0.12;
    let c = st.buf.length >= (o.n || 3) ? st.buf.shift() : document.createElement("canvas");
    c.width = p.W; c.height = p.H;
    c.getContext("2d").drawImage(p.src, 0, 0, p.W, p.H);
    st.buf.push(c);
  }
  const cols = o.cols || ["rgba(80,220,255,", "rgba(255,80,220,", "rgba(255,230,120,"];
  st.buf.forEach((c, i) => {
    const off = (st.buf.length - i) * (o.off || 6) * p.S;
    B.globalAlpha = 0.25 + i * 0.08;
    B.drawImage(c, off * (i % 2 ? 1 : -1), -off * 0.3, p.W, p.H);
  });
  B.globalAlpha = 1;
  void cols;
};
FX.flare = (F, B, st, p, o) => {
  const c = p.scr(o.at); if (!c) return;
  const s = (o.s || 40) * p.S * (0.85 + sin(p.t * 4) * 0.15), ctx = lay(F, B, c, o);
  ctx.fillStyle = col(o.c || 0xffffff, 0.9);
  star(ctx, c[0], c[1], s);
  ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(PI / 4); star(ctx, 0, 0, s * 0.5); ctx.restore();
  const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], s * 0.6);
  g.addColorStop(0, col(o.c || 0xffffff, 0.8)); g.addColorStop(1, col(o.c || 0xffffff, 0));
  ctx.fillStyle = g; ctx.fillRect(c[0] - s, c[1] - s, s * 2, s * 2);
};
FX.shock = (F, B, st, p, o) => {
  // a hard, bright shockwave every few seconds
  st.t = (st.t || 0) + p.dt;
  const per = o.every || 3, k = (st.t % per) / 0.7;
  if (k > 1) return;
  const c = p.scr(o.at || "center"); if (!c) return;
  const ctx = lay(F, B, c, o);
  ctx.strokeStyle = o.c === "rainbow" ? hue(p.t * 200, 1 - k) : col(o.c, 1 - k);
  ctx.lineWidth = (6 - k * 5) * p.S;
  ctx.beginPath(); ctx.arc(c[0], c[1], k * (o.r || 150) * p.S, 0, PI * 2); ctx.stroke();
};

// ---------------- trait auras (tier 3 and up) ----------------
const NEB = [["rgba(138,92,255,.6)", "rgba(138,92,255,0)", 0], ["rgba(255,90,216,.5)", "rgba(255,90,216,0)", 2.1], ["rgba(79,216,255,.45)", "rgba(79,216,255,0)", 4.2]];
K.aura = function (tier, F, B, st, p) {
  if (tier < 3) return;
  const S = p.S, feet = p.scr("feet") || [p.W / 2, p.H * 0.9], ctr = p.scr("center") || [p.W / 2, p.H / 2];
  st.a = st.a || {}; st.b = st.b || {}; st.c = st.c || {};
  if (tier === 3) {
    FX.glow(F, B, st.c, p, { at: "feet", c: 0xffc23a, r: 70 });
    FX.motes(F, B, st.a, p, { c: 0xffd76a, rate: 10, area: [0.25, 0.75, 0.6, 0.95], up: 26 });
    return;
  }
  if (tier === 3.5) {
    // Inferno: tall orange-red flames and a hot glow at the feet
    FX.glow(F, B, st.c, p, { at: "feet", c: 0xff5a1a, r: 90 });
    spawn(st.a, 34, p.dt, () => ({ x: feet[0] + rnd(-50, 50) * S, y: feet[1] + rnd(-8, 6) * S, life: 0, max: rnd(0.6, 1.1), w: rnd(5, 10) * S }));
    tick(st.a, p.dt, (q, k) => {
      const y = q.y - k * 110 * S, x = q.x + sin(p.t * 6 + q.w) * 5 * S * k;
      B.fillStyle = k < 0.4 ? `rgba(255,${200 - k * 200 | 0},60,${0.6 * (1 - k)})` : `rgba(255,${60 - k * 40 | 0},20,${0.5 * (1 - k)})`;
      B.beginPath(); B.ellipse(x, y, q.w * (1 - k * 0.7), q.w * 1.9 * (1 - k * 0.5), 0, 0, PI * 2); B.fill();
    });
    FX.embers(F, B, st.b, p, { rate: 14, area: [0.25, 0.75, 0.5, 0.95], up: 50 });
    return;
  }
  if (tier === 4) {
    // Eclipse: crimson and violet flames licking up the silhouette
    const g = B.createRadialGradient(ctr[0], ctr[1], 10 * S, ctr[0], ctr[1], 120 * S);
    g.addColorStop(0, "rgba(255,40,90,.45)"); g.addColorStop(0.6, "rgba(120,20,200,.22)"); g.addColorStop(1, "rgba(60,0,90,0)");
    B.fillStyle = g; B.fillRect(0, 0, p.W, p.H);
    spawn(st.a, 30, p.dt, () => ({ x: feet[0] + rnd(-55, 55) * S, y: feet[1] + rnd(-10, 6) * S, life: 0, max: rnd(0.7, 1.3), w: rnd(5, 10) * S }));
    tick(st.a, p.dt, (q, k) => {
      const y = q.y - k * 120 * S, x = q.x + sin(p.t * 5 + q.w) * 6 * S * k;
      B.fillStyle = k < 0.5 ? `rgba(255,${60 + k * 120 | 0},90,${0.55 * (1 - k)})` : `rgba(150,40,255,${0.5 * (1 - k)})`;
      B.beginPath(); B.ellipse(x, y, q.w * (1 - k * 0.7), q.w * 1.8 * (1 - k * 0.5), 0, 0, PI * 2); B.fill();
    });
    FX.ring(F, B, st.b, p, { at: "feet", c: 0xff3b6b, every: 1.4, r: 70, back: true });
    return;
  }
  if (tier === 4.5) {
    // Nebula: slow clouds of violet, magenta and cyan gas behind him, stars twinkling through them
    NEB.forEach(([c0, c1, ph]) => {
      const x = ctr[0] + cos(p.t * 0.35 + ph) * 48 * S, y = ctr[1] + sin(p.t * 0.27 + ph) * 34 * S, r = (115 + sin(p.t * 0.8 + ph) * 18) * S;
      const g = B.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      B.fillStyle = g; B.fillRect(0, 0, p.W, p.H);
    });
    spawn(st.a, 28, p.dt, () => ({ x: rnd(0.1, 0.9) * p.W, y: rnd(0.06, 0.92) * p.H, life: 0, max: rnd(0.8, 1.6), s: rnd(3, 7) * S, front: Math.random() < 0.35 }));
    tick(st.a, p.dt, (q, k) => {
      const ctx = q.front ? F : B, f = sin(k * PI);
      ctx.fillStyle = `rgba(255,255,255,${0.95 * f})`; star(ctx, q.x, q.y, q.s * (0.5 + f * 0.7));
    });
    FX.motes(F, B, st.b, p, { c: 0xd8c4ff, rate: 10, up: 30 });
    FX.ring(F, B, st.c, p, { at: "feet", c: 0xb89cff, every: 1.5, r: 80 });
    return;
  }
  if (tier === 5 || tier === 5.5) {
    // Zenith adds a turning crown of white-gold rays behind it
    if (tier === 5.5) FX.rays(F, B, st.d || (st.d = {}), p, { at: "center", c: 0xffe48a, n: 14, len: 190, spin: 0.3, a: 0.3 });
    // Astral: a pillar of light, a tilted halo ring and stars orbiting
    FX.pillar(F, B, st.c, p, { c: 0x9feaff, w: 70, a: 0.3 });
    B.save(); B.translate(ctr[0], ctr[1]);
    B.strokeStyle = `rgba(255,230,150,${0.65 + sin(p.t * 3) * 0.2})`; B.lineWidth = 3 * S;
    B.beginPath(); B.ellipse(0, 0, 100 * S, 26 * S, -0.15, 0, PI * 2); B.stroke(); B.restore();
    for (let i = 0; i < 10; i++) {
      const a = p.t * 1.2 + (i / 10) * PI * 2, x = ctr[0] + cos(a) * 100 * S, y = ctr[1] + sin(a) * 26 * S - cos(a) * 15 * S;
      (sin(a) > 0 ? F : B).fillStyle = i % 2 ? "rgba(255,240,180,.95)" : "rgba(160,235,255,.95)";
      star(sin(a) > 0 ? F : B, x, y, (4 + (i % 3) * 2) * S);
    }
    FX.motes(F, B, st.a, p, { c: 0xbff2ff, rate: 12, up: 40 });
    return;
  }
  if (tier === 6.5) {
    // Infinity: Singularity's whole show (below), with a band of light running an endless figure eight around him.
    // The eight lies flat around his middle: the half nearer the viewer is drawn in front of the body
    const a = 120 * S, cx = ctr[0], cy = ctr[1] - 8 * S + sin(p.t * 1.3) * 4 * S;
    const P = u => { const d = 1 + sin(u) * sin(u), z = (a * sin(u) * cos(u)) / d; return [cx + (a * cos(u)) / d, cy + z * 0.4, z]; };
    const core = B.createRadialGradient(cx, cy, 0, cx, cy, 70 * S);
    core.addColorStop(0, "rgba(255,255,255,.55)"); core.addColorStop(1, "rgba(255,255,255,0)");
    B.fillStyle = core; B.fillRect(0, 0, p.W, p.H);
    for (const [ctx, near] of [[B, false], [F, true]]) {
      ctx.lineWidth = 6 * S; ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.beginPath();
      let on = false;
      for (let i = 0; i <= 96; i++) {
        const q = P((i / 96) * PI * 2);
        if ((q[2] > 0) !== near) { on = false; continue; }
        on ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); on = true;
      }
      ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      const u = p.t * 1.6 - (i / 30) * 1.9, q = P(u), ctx = q[2] > 0 ? F : B, k = 1 - i / 30;
      ctx.fillStyle = i === 0 ? "#ffffff" : hue(p.t * 160 + i * 12, 0.9 * k);
      ctx.beginPath(); ctx.arc(q[0], q[1], (i === 0 ? 8 : 3 + 4 * k) * S, 0, PI * 2); ctx.fill();
    }
  }
  // Singularity: everything, in every colour
  const h0 = p.t * 120;
  const g = B.createRadialGradient(ctr[0], ctr[1], 0, ctr[0], ctr[1], 150 * S);
  g.addColorStop(0, hue(h0, 0.5)); g.addColorStop(0.5, hue(h0 + 120, 0.25)); g.addColorStop(1, hue(h0 + 240, 0));
  B.fillStyle = g; B.fillRect(0, 0, p.W, p.H);
  FX.rays(F, B, st.c, p, { at: "center", c: 0xffffff, n: 16, len: 200, spin: 0.5, a: 0.18 });
  spawn(st.a, 40, p.dt, () => ({ x: feet[0] + rnd(-60, 60) * S, y: feet[1] + rnd(-10, 6) * S, life: 0, max: rnd(0.7, 1.4), w: rnd(5, 11) * S, h: rnd(0, 360) }));
  tick(st.a, p.dt, (q, k) => {
    B.fillStyle = hue(q.h + p.t * 200, 0.6 * (1 - k));
    B.beginPath(); B.ellipse(q.x + sin(p.t * 6 + q.w) * 6 * S * k, q.y - k * 140 * S, q.w * (1 - k * 0.7), q.w * 2 * (1 - k * 0.5), 0, 0, PI * 2); B.fill();
  });
  for (let i = 0; i < 7; i++) {
    const a = -p.t * 1.6 + (i / 7) * PI * 2, x = ctr[0] + cos(a) * 92 * S, y = ctr[1] + sin(a) * 34 * S;
    const ctx = sin(a) > 0 ? F : B;
    ctx.save(); ctx.translate(x, y); ctx.rotate(p.t * 3 + i);
    ctx.fillStyle = hue(h0 + i * 50, 0.95);
    ctx.beginPath(); ctx.moveTo(0, -8 * S); ctx.lineTo(4 * S, 0); ctx.lineTo(0, 8 * S); ctx.lineTo(-4 * S, 0); ctx.fill();
    ctx.restore();
  }
  FX.ring(F, B, st.b, p, { at: "feet", c: "rainbow", every: 0.9, r: 90 });
  FX.stars(F, B, st.d || (st.d = {}), p, { c: "rainbow", rate: 6 });
};
})();
