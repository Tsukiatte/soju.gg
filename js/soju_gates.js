/* The gates in the world. (3 Nov, owner: "make gates more relevant to the theme like maybe give different gates different looks like nightmarket as a night market
   stand or something and give them a cool construct animation too use blender")
   tools/soju_gates_blender.py models and keyframes them and bakes every piece's pose per frame into soju_gatedata.js. This builds them and plays those frames.
   While a gate is building each piece is its own mesh; once it stands they are swapped for one merged mesh, so a finished gate costs almost nothing to draw.
   island.js decides when a gate builds. */
(function () {
const AF = window.AF, T = THREE, K = AF.kit;
const bytes = b64 => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
const ints = b64 => { const u = bytes(b64); return new Int16Array(u.buffer, 0, u.length >> 1); };
const OUTLINE = 0.03;
const inkMat = new T.MeshBasicMaterial({ color: 0x07070a, side: T.BackSide }); inkMat.polygonOffset = true; inkMat.polygonOffsetFactor = 2; inkMat.polygonOffsetUnits = 8; // (4 Nov) an outline lying exactly on a neighbouring piece's face flickered: outlines always draw just behind
let toon = null, glow = null;
function mats() {
  if (toon) return;
  toon = K.mat(0xffffff, 0, true); toon.vertexColors = true; toon.color.setScalar(0.84); // (3 Nov) pale stone and gold in full sun were white on screen
  glow = new T.MeshBasicMaterial({ vertexColors: true }); glow.color.setScalar(1); // (3 Nov) no longer past the bloom's threshold: too bright to look at
}
// Pushed out along the average of the faces meeting at each corner, so an outline stays closed round a flat-shaded model.
function hull(pos, by = OUTLINE) {
  const key = i => `${pos[i]},${pos[i + 1]},${pos[i + 2]}`, sum = new Map(), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
  for (let i = 0; i < pos.length; i += 9) {
    a.fromArray(pos, i); b.fromArray(pos, i + 3); c.fromArray(pos, i + 6);
    n.subVectors(b, a).cross(c.sub(a)).normalize();
    for (let k = 0; k < 9; k += 3) { const m = key(i + k), s = sum.get(m) || [0, 0, 0]; s[0] += n.x; s[1] += n.y; s[2] += n.z; sum.set(m, s); }
  }
  const out = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const s = sum.get(key(i)), l = Math.hypot(s[0], s[1], s[2]) || 1;
    for (let k = 0; k < 3; k++) out[i + k] = pos[i + k] + (s[k] / l) * by;
  }
  return out;
}
function geometry(pos, col) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  if (col) { g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals(); }
  return g;
}
// (4 Nov, owner: "z fighting on golden gate and some parts of the first gate as well"): faces on one plane, facing the same way, in different colours, and really lying over each other, are moved apart. Only those:
// (owner: "fix up the roof a bit") lifting every face that merely shared a plane stepped the roof's tiles apart, and the black outline showed through the steps
function separate(list) {
  const buckets = new Map(), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
  for (const x of list) for (let o = 0; o < x.pos.length; o += 9) {
    a.fromArray(x.pos, o); b.fromArray(x.pos, o + 3); c.fromArray(x.pos, o + 6);
    n.subVectors(b, a).cross(c.sub(a)); const l = n.length(); if (l < 1e-6) continue; n.divideScalar(l);
    const d = n.dot(a), key = `${Math.round(n.x * 30)},${Math.round(n.y * 30)},${Math.round(n.z * 30)}|${Math.round(d * 60)}`;
    let B = buckets.get(key); if (!B) buckets.set(key, B = []);
    // flat on the plane's two largest axes
    const ax = Math.abs(n.x) > Math.abs(n.y) && Math.abs(n.x) > Math.abs(n.z) ? [1, 2] : Math.abs(n.y) > Math.abs(n.z) ? [0, 2] : [0, 1];
    B.push({ pos: x.pos, o, n: [n.x, n.y, n.z], col: `${x.col[o].toFixed(3)},${x.col[o + 1].toFixed(3)},${x.col[o + 2].toFixed(3)}`, tri: [0, 3, 6].map(k => [x.pos[o + k + ax[0]], x.pos[o + k + ax[1]]]), level: 0 });
  }
  // two triangles truly overlap if no edge of either separates them, by more than a touch
  const apart = (A, B2) => {
    for (const [P, Q] of [[A, B2], [B2, A]]) for (let i = 0; i < 3; i++) {
      const p = P[i], q = P[(i + 1) % 3], ex = q[0] - p[0], ey = q[1] - p[1], nx = -ey, ny = ex, len = Math.hypot(nx, ny) || 1;
      const proj = t => (t[0] * nx + t[1] * ny) / len, pv = P.map(proj), qv = Q.map(proj);
      if (Math.max(...pv) <= Math.min(...qv) + 0.004 || Math.max(...qv) <= Math.min(...pv) + 0.004) return true;
    }
    return false;
  };
  let moved = 0;
  for (const B of buckets.values()) {
    if (B.length < 2 || B.length > 900) continue;
    for (let i = 1; i < B.length; i++) for (let j = 0; j < i; j++) {
      if (B[i].col === B[j].col || B[i].level > B[j].level || apart(B[i].tri, B[j].tri)) continue;
      B[i].level = B[j].level + 1;
    }
    for (const t of B) { if (!t.level) continue; const e = t.level * 0.012; for (let k = 0; k < 9; k += 3) for (let q = 0; q < 3; q++) t.pos[t.o + k + q] += t.n[q] * e; moved++; }
  }
  return moved;
}
const POSE = 10;
function poseAt(part, f, ob) {
  const n = part.f1 - part.f0, u = Math.max(0, Math.min(n, f - part.f0)), i = Math.min(n, Math.floor(u)), j = Math.min(n, i + 1), k = u - i, t = part.track;
  const v = o => t[i * POSE + o] + (t[j * POSE + o] - t[i * POSE + o]) * k;
  ob.position.set(v(0) / 256, v(1) / 256, v(2) / 256);
  ob.quaternion.set(v(3), v(4), v(5), v(6)).normalize();
  ob.scale.set(Math.max(1e-3, v(7) / 4096), Math.max(1e-3, v(8) / 4096), Math.max(1e-3, v(9) / 4096));
}
// the name on a stall's sign, in the game's own font
function signPlane(s, parent) {
  const c = document.createElement('canvas'), W = 1024, H = Math.round((W * s.h) / s.w);
  c.width = W; c.height = H;
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
  const draw = () => {
    const x = c.getContext('2d');
    x.clearRect(0, 0, W, H);
    x.font = `600 ${Math.round(H * 0.68)}px Fredoka, Nunito, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = s.glow; x.shadowBlur = H * 0.2; x.fillStyle = s.col;
    x.fillText(s.text, W / 2, H / 2 + H * 0.03);
    x.shadowBlur = 0; x.fillText(s.text, W / 2, H / 2 + H * 0.03);
    tex.needsUpdate = true;
  };
  draw();
  if (document.fonts && document.fonts.load) document.fonts.load('600 40px Fredoka').then(draw).catch(() => {});
  const m = new T.Mesh(new T.PlaneGeometry(s.w, s.h), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  parent.add(m);
  return m;
}
const made = {};
// (4 Nov, owner: "make the gate construct quicker") the Blender keys are kept; they just play this much faster
const BUILD_SPEED = 1.9;
function make(id, parent, y) {
  if (made[id]) return made[id];
  mats();
  const D = AF.GATE_MODELS[id], root = new T.Group(), hex = D.palette.map(h => new T.Color(h));
  root.position.y = y; parent.add(root);
  const all = { toon: [], glow: [] };
  const parts = D.parts.map((P, pi) => {
    const raw = ints(P.p), idx = bytes(P.c), col = new Float32Array(raw.length);
    let pos = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) pos[i] = raw[i] / 256;
    // (4 Nov, owner: "theres a lot of z fighting at the gate"): pieces made flush in Blender shared surfaces, and flickered. Each is pushed out by its own small amount, so one always wins
    pos = hull(pos, (((pi * 7) % 11) + 1) * 0.004);
    for (let t = 0; t < idx.length; t++) { const c = hex[idx[t]]; for (let k = 0; k < 3; k++) { const o = t * 9 + k * 3; col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b; } }
    // (4 Nov, owner: "did the text dissapear for the gates?"): Blender calls the second gate's pieces "sign.001" and "ring.001", so the Golden Hall's board never got its words. Names are read without that ending
    const mesh = new T.Mesh(geometry(pos, col), P.g ? glow : toon), part = { n: P.n.split('.')[0], g: P.g, f0: P.f0, f1: P.f1, track: ints(P.t), mesh, landed: false };
    if (!P.g) mesh.add(new T.Mesh(geometry(hull(pos)), inkMat));
    mesh.visible = false;
    root.add(mesh);
    poseAt(part, D.frames, mesh); // at rest
    if (part.n === 'sign') {
      const rest = mesh.position.clone(), s = D.sign, plane = signPlane(s, mesh);
      plane.position.set(0, s.y - rest.y, -s.z - rest.z + 0.07); // (4 Nov, owner: "did the text dissapear for the gates?"): it had: the flicker fix pushes every piece out by up to 0.044, and that put the board in front of its words
      part.keep = true; // stays its own mesh: it carries the sign's picture
    } else {
      mesh.updateMatrix();
      const P2 = pos.slice(), v = new T.Vector3();
      for (let i = 0; i < P2.length; i += 3) { v.fromArray(P2, i).applyMatrix4(mesh.matrix); v.toArray(P2, i); }
      (P.g ? all.glow : all.toon).push({ pos: P2, col });
    }
    return part;
  });
  // the outline is made from the faces as they were, so it stays closed
  for (const x of all.toon) x.base = x.pos.slice();
  const movedFaces = separate(all.toon.concat(all.glow));
  const merge = (list, mat, withInk) => {
    if (!list.length) return null;
    const n = list.reduce((a, x) => a + x.pos.length, 0), pos = new Float32Array(n), col = new Float32Array(n);
    let o = 0; for (const x of list) { pos.set(x.pos, o); col.set(x.col, o); o += x.pos.length; }
    const m = new T.Mesh(geometry(pos, col), mat);
    if (withInk) { let q = 0; const ink = new Float32Array(n); for (const x of list) { ink.set(hull(x.base || x.pos), q); q += x.pos.length; } m.add(new T.Mesh(geometry(ink), inkMat)); }
    m.visible = false; root.add(m);
    return m;
  };
  const solid = merge(all.toon, toon, true), lit = merge(all.glow, glow, false);
  const C = made[id] = {
    id, root, parts, movedFaces, frames: D.frames, fps: D.fps, open: D.open, solid, lit,
    seconds: D.frames / D.fps / BUILD_SPEED,
    atRest: false,
    // frame f of the build, 0 to frames. onLand(n, names): how many pieces finished moving since the last frame, and which
    frame(f, onLand) {
      C.atRest = false;
      root.visible = true;
      if (solid) solid.visible = false; if (lit) lit.visible = false;
      let landed = 0; const names = [];
      for (const p of parts) {
        const shown = f >= p.f0;
        p.mesh.visible = shown;
        if (!shown) { p.landed = false; continue; }
        poseAt(p, f, p.mesh);
        const done = f >= p.f1;
        if (done && !p.landed) { landed++; names.push(p.n); }
        p.landed = done;
      }
      if (landed && onLand) onLand(landed, names);
    },
    // standing and finished: one mesh, plus the sign
    rest() {
      C.atRest = true;
      root.visible = true;
      for (const p of parts) { p.mesh.visible = !!p.keep; if (p.keep) poseAt(p, C.frames, p.mesh); p.landed = true; }
      if (solid) solid.visible = true; if (lit) lit.visible = true;
    },
    hide() { root.visible = false; C.atRest = false; },
    // what's drawn right now, for tools/soju_gates.mjs
    drawn: () => parts.filter(p => p.mesh.visible).length + (solid && solid.visible ? 1 : 0) + (lit && lit.visible ? 1 : 0),
  };
  return C;
}
AF.soju.gates = { make };
})();
