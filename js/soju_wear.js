/* What the gates give. (3 Nov, owner: "i want u to make skins to be like a new costume like a suit or something or a changed projectile thing
   like let them equip different costumes, projectile theme and shit on the unit page ... dont do too many just do like 40 for now but make sure
   u can equip any skin on any unit rn")
   20 costumes and 4 projectile themes. A tower has one slot of each, and any tower can wear any item. Neither changes a number.
   A tower's u.k names what it wears ("crew_pip~tux~caps"), and that key gets its own unit and attack entries the first time it is used, so
   everything that draws or fires a unit follows it. Sounds come from tools/soju_sfx.py and sfx/td. Loaded after tdfx.js, before soju_rules.js.
   A part is [shape, ...sizes, x, y, z, colour, options]: on a cube running -0.5 to 0.5, front +z, top +y. */
(function () {
const AF = window.AF, T = THREE, K = AF.kit, PI = Math.PI;
const { rr, dot } = AF.soju;

function addParts(parent, parts) {
  for (const p of parts) {
    const [shape] = p;
    let geo, at;
    if (shape === 'box') { geo = new T.BoxGeometry(p[1], p[2], p[3]); at = 4; }
    else if (shape === 'cyl') { geo = new T.CylinderGeometry(p[1], p[2], p[3], (p[8] && p[8].seg) || 14); at = 4; }
    else if (shape === 'cone') { geo = new T.ConeGeometry(p[1], p[2], (p[7] && p[7].seg) || 12); at = 3; }
    else if (shape === 'ball') { geo = new T.SphereGeometry(p[1], 14, 10); at = 2; }
    else if (shape === 'ring') { geo = new T.TorusGeometry(p[1], p[2], 8, 24); at = 3; }
    const col = p[at + 3], o = p[at + 4] || {};
    const mat = o.alpha ? new T.MeshToonMaterial({ color: col, transparent: true, opacity: o.alpha, depthWrite: false }) : K.mat(col, o.glow ? 1 : 0);
    const m = new T.Mesh(geo, mat);
    m.position.set(p[at], p[at + 1], p[at + 2]);
    m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    if (o.sx || o.sy || o.sz) m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    parent.add(m);
  }
}
// how high a costume reaches, so a flyer's rotor clears its hat
const topOf = parts => {
  let y = 0;
  for (const p of parts) { const at = p[0] === 'ball' ? 2 : p[0] === 'box' || p[0] === 'cyl' ? 4 : 3, half = p[0] === 'ball' ? p[1] : p[0] === 'box' ? p[2] / 2 : p[0] === 'cyl' ? p[3] / 2 : p[0] === 'cone' ? p[2] / 2 : p[2]; y = Math.max(y, p[at + 1] + half); }
  return y;
};

// ---------------- painting clothes on a cube ----------------
// cells: 0 and 1 sides, 2 top, 3 underneath, 4 front (the face is above y 90), 5 back. Clothes cover the front below the chin and the sides and
// back below the shoulders.
const clothes = o => (c, cell) => {
  const fy = o.frontY ?? 90, sy = o.sideY ?? 40;
  c.fillStyle = o.col;
  if (cell === 3) c.fillRect(0, 0, 128, 128);
  else if (cell === 4) { c.fillRect(0, fy, 128, 128 - fy); if (o.front) o.front(c); }
  else if (cell === 5) { c.fillRect(0, sy, 128, 128 - sy); if (o.back) o.back(c); }
  else if (cell !== 2) { c.fillRect(0, sy, 128, 128 - sy); if (o.side) o.side(c, cell); }
  else if (o.top) o.top(c);
};
const fill = (c, col, x, y, w, h, r = 0) => { c.fillStyle = col; if (r) { rr(c, x, y, w, h, r); c.fill(); } else c.fillRect(x, y, w, h); };
const tri = (c, col, ...pts) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
const buttons = (c, col, x, ys, r = 3.5) => ys.forEach(y => dot(c, x, y, r, col));
const hoops = (c, col, ys, h = 7) => ys.forEach(y => fill(c, col, 0, y, 128, h));
const starAt = (c, col, x, y, R) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.45 : R, a = -PI / 2 + (i * PI) / 5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); };

const BLK_S = '#24202c', INK = 0x24202c, GOLD = 0xf2c23a, WHITE = 0xf6f4ee, RED = 0xd9413f, STEEL = 0xaab2c0;
const shades = [['box', 0.2, 0.13, 0.03, -0.195, 0.07, 0.515, INK], ['box', 0.2, 0.13, 0.03, 0.195, 0.07, 0.515, INK], ['box', 0.22, 0.03, 0.03, 0, 0.1, 0.515, INK]];
const brim = (r, y, col) => ['cyl', r, r, 0.035, 0, y, 0, col];
const COSTUMES = [
  // ---- everyday ----
  { id: 'hoodie', name: 'Street Hoodie',
    paint: clothes({ col: '#6a6f86', front: c => { fill(c, '#585d73', 30, 104, 68, 22, 6); fill(c, '#e8e8ee', 50, 90, 4, 16); fill(c, '#e8e8ee', 74, 90, 4, 16); }, back: c => fill(c, '#585d73', 20, 40, 88, 14) }),
    parts: [['box', 0.9, 0.3, 0.2, 0, 0.36, -0.52, 0x6a6f86], ['box', 0.72, 0.17, 0.14, 0, 0.44, -0.55, 0x585d73]] },
  { id: 'sailor', name: 'Sailor Suit',
    paint: clothes({ col: '#f4f4f0', front: c => { tri(c, '#23407a', [0, 90], [128, 90], [64, 124]); tri(c, '#f4f4f0', [28, 90], [100, 90], [64, 112]); }, side: c => hoops(c, '#23407a', [58, 72], 6), back: c => { fill(c, '#23407a', 16, 40, 96, 42); fill(c, '#f4f4f0', 24, 48, 80, 4); } }),
    parts: [['cyl', 0.3, 0.27, 0.13, 0, 0.57, 0, WHITE], ['cyl', 0.285, 0.285, 0.05, 0, 0.55, 0, 0x23407a], ['box', 0.2, 0.09, 0.05, 0, -0.3, 0.52, RED]] },
  { id: 'chef', name: 'Chef Whites',
    paint: clothes({ col: '#f7f5ef', front: c => { for (const x of [50, 78]) buttons(c, '#3a3a44', x, [100, 116]); fill(c, '#dfdcd2', 0, 90, 128, 5); }, back: c => fill(c, '#e6e3da', 56, 40, 16, 88) }),
    parts: [['cyl', 0.34, 0.27, 0.34, 0, 0.71, 0, WHITE], ['ball', 0.2, -0.15, 0.92, 0, WHITE], ['ball', 0.22, 0.13, 0.94, 0.04, WHITE], ['ball', 0.18, 0, 0.98, -0.12, WHITE]] },
  { id: 'apron', name: 'Tent Night Apron',
    paint: clothes({ col: '#e8702a', front: c => { fill(c, '#2c5a3f', 22, 90, 84, 38); fill(c, '#3b7551', 36, 106, 56, 18, 3); }, side: c => { fill(c, '#2c5a3f', 0, 88, 128, 8); }, back: c => { fill(c, '#2c5a3f', 0, 88, 128, 8); fill(c, '#2c5a3f', 54, 80, 20, 24, 8); } }),
    parts: [['box', 1.04, 0.11, 1.04, 0, 0.36, 0, 0xe24a3a], ['box', 0.16, 0.2, 0.05, 0.2, 0.3, -0.54, 0xe24a3a, { rz: 0.5 }], ['box', 0.16, 0.2, 0.05, -0.2, 0.3, -0.54, 0xe24a3a, { rz: -0.5 }]] },
  { id: 'raincoat', name: 'Yellow Raincoat',
    paint: clothes({ col: '#ffd23a', sideY: 26, front: c => { fill(c, '#e0aa1a', 60, 90, 8, 38); buttons(c, '#3a3a44', 50, [100, 116], 4); }, back: c => fill(c, '#e0aa1a', 0, 26, 128, 8), side: c => fill(c, '#e0aa1a', 0, 26, 128, 8) }),
    parts: [['cyl', 0.62, 0.72, 0.05, 0, 0.53, -0.08, 0xffd23a], ['ball', 0.35, 0, 0.56, 0, 0xffd23a, { sy: 0.7 }]] },
  { id: 'jersey', name: 'Ball Team Jersey',
    paint: clothes({ col: '#f7f7f2', front: c => { hoops(c, '#d9413f', [90], 5); c.fillStyle = '#d9413f'; c.font = '800 28px sans-serif'; c.textAlign = 'center'; c.fillText('7', 64, 124); }, side: c => fill(c, '#d9413f', 56, 40, 12, 88), back: c => { c.fillStyle = '#d9413f'; c.font = '800 56px sans-serif'; c.textAlign = 'center'; c.fillText('7', 64, 104); } }),
    parts: [['cyl', 0.36, 0.39, 0.17, 0, 0.59, 0, RED], ['box', 0.46, 0.035, 0.32, 0, 0.53, 0.42, RED], ['cyl', 0.04, 0.04, 0.03, 0, 0.68, 0, WHITE]] },
  // ---- dressed up ----
  { id: 'suit', name: 'Sharp Suit',
    paint: clothes({ col: '#2c2f3c', front: c => { tri(c, '#f4f4f0', [36, 90], [92, 90], [64, 128]); tri(c, '#c9313a', [58, 92], [70, 92], [68, 120], [64, 126], [60, 120]); fill(c, '#f4f4f0', 96, 102, 16, 5); }, side: c => buttons(c, '#50546a', 64, [90, 110]), back: c => fill(c, '#23252f', 60, 40, 8, 88) }),
    parts: [...shades, ['box', 0.16, 0.08, 0.8, 0.55, 0.0, 0, 0x2c2f3c], ['box', 0.16, 0.08, 0.8, -0.55, 0.0, 0, 0x2c2f3c]] },
  { id: 'hanbok', name: 'Hanbok',
    paint: clothes({ col: '#1f9e96', sideY: 44, front: c => { fill(c, '#d9415f', 0, 108, 128, 20); tri(c, '#f7f3e6', [30, 90], [64, 90], [80, 108], [62, 108]); tri(c, '#f7f3e6', [98, 90], [64, 90], [50, 108], [66, 108]); fill(c, '#d9415f', 60, 100, 8, 26, 3); }, side: c => { fill(c, '#d9415f', 0, 86, 128, 42); fill(c, '#f2c23a', 0, 44, 128, 5); }, back: c => { fill(c, '#d9415f', 0, 86, 128, 42); fill(c, '#f7f3e6', 44, 44, 40, 8); } }),
    parts: [brim(0.62, 0.53, INK), ['cyl', 0.2, 0.24, 0.28, 0, 0.68, 0, INK]] },
  { id: 'detective', name: 'Trench Coat',
    paint: clothes({ col: '#b08a55', front: c => { fill(c, '#7a5a30', 0, 108, 128, 8); fill(c, '#d8c28a', 58, 106, 12, 12, 2); tri(c, '#8f6f3e', [20, 90], [58, 90], [40, 106]); tri(c, '#8f6f3e', [108, 90], [70, 90], [88, 106]); }, side: c => fill(c, '#7a5a30', 0, 84, 128, 8), back: c => fill(c, '#7a5a30', 0, 84, 128, 8) }),
    parts: [brim(0.5, 0.53, 0x5a4230), ['cyl', 0.26, 0.31, 0.2, 0, 0.64, 0, 0x5a4230], ['cyl', 0.315, 0.315, 0.05, 0, 0.57, 0, INK]] },
  { id: 'pirate', name: 'Pirate Captain',
    paint: clothes({ col: '#1e2f5a', front: c => { fill(c, '#f4f0e0', 48, 90, 32, 38); for (const x of [40, 88]) buttons(c, '#f2c23a', x, [100, 118], 4); }, side: c => fill(c, '#f2c23a', 0, 40, 128, 6), back: c => fill(c, '#f2c23a', 0, 40, 128, 6) }),
    parts: [['cyl', 0.6, 0.6, 0.1, 0, 0.56, 0, INK, { seg: 3, ry: 0.5 }], ['cyl', 0.28, 0.36, 0.22, 0, 0.71, 0, INK], ['ball', 0.07, 0, 0.72, 0.31, WHITE], ['cyl', 0.1, 0.1, 0.03, 0.195, 0.07, 0.515, INK, { rx: PI / 2 }], ['box', 0.8, 0.025, 0.02, 0.1, 0.2, 0.51, INK, { rz: -0.2 }]] },
  { id: 'cowboy', name: 'Cowboy',
    paint: clothes({ col: '#c8d4dc', front: c => { fill(c, '#7a4a26', 0, 90, 34, 38); fill(c, '#7a4a26', 94, 90, 34, 38); tri(c, '#d9413f', [38, 90], [90, 90], [64, 116]); }, side: c => { fill(c, '#7a4a26', 0, 40, 128, 88); for (let i = 0; i < 4; i++) dot(c, 20 + i * 30, 112, 3, '#f2c23a'); }, back: c => fill(c, '#7a4a26', 0, 40, 128, 88) }),
    parts: [['cyl', 0.72, 0.72, 0.04, 0, 0.54, 0, 0x8a5a30, { sz: 0.8 }], ['cyl', 0.23, 0.3, 0.26, 0, 0.68, 0, 0x8a5a30], ['cyl', 0.305, 0.305, 0.05, 0, 0.58, 0, 0xf2c23a]] },
  // ---- something special ----
  { id: 'tuxedo', name: 'Tuxedo',
    paint: clothes({ col: '#15151c', front: c => { tri(c, '#fbfbf6', [30, 90], [98, 90], [64, 128]); buttons(c, '#15151c', 64, [104, 116], 3); tri(c, '#2a2a36', [22, 90], [38, 90], [60, 126], [52, 128]); tri(c, '#2a2a36', [106, 90], [90, 90], [68, 126], [76, 128]); }, back: c => tri(c, '#2a2a36', [50, 90], [78, 90], [64, 128]) }),
    parts: [brim(0.42, 0.53, 0x15151c), ['cyl', 0.27, 0.27, 0.4, 0, 0.75, 0, 0x15151c], ['cyl', 0.275, 0.275, 0.08, 0, 0.59, 0, RED], ['cone', 0.06, 0.14, 0.07, -0.13, 0.51, RED, { rz: -PI / 2, seg: 4 }], ['cone', 0.06, 0.14, -0.07, -0.13, 0.51, RED, { rz: PI / 2, seg: 4 }], ['ball', 0.03, 0, -0.13, 0.53, RED]] },
  { id: 'samurai', name: 'Samurai Armour',
    paint: clothes({ col: '#8e1f28', sideY: 34, front: c => { hoops(c, '#2a1a1e', [96, 110, 122], 3); fill(c, '#f2c23a', 58, 90, 12, 38); }, side: c => { hoops(c, '#2a1a1e', [50, 66, 82, 98, 114], 3); }, back: c => hoops(c, '#2a1a1e', [50, 66, 82, 98, 114], 3) }),
    parts: [['ball', 0.42, 0, 0.5, 0, 0x2a1a1e, { sy: 0.62 }], ['cyl', 0.62, 0.66, 0.04, 0, 0.42, -0.04, 0x2a1a1e], ['cone', 0.06, 0.48, -0.2, 0.86, 0.26, GOLD, { rz: 0.38, seg: 5 }], ['cone', 0.06, 0.48, 0.2, 0.86, 0.26, GOLD, { rz: -0.38, seg: 5 }], ['ball', 0.07, 0, 0.62, 0.36, GOLD], ['box', 0.16, 0.42, 0.68, 0.57, -0.1, 0, 0x8e1f28, { rz: -0.2 }], ['box', 0.16, 0.42, 0.68, -0.57, -0.1, 0, 0x8e1f28, { rz: 0.2 }]] },
  { id: 'astronaut', name: 'Astronaut',
    paint: clothes({ col: '#eceef2', front: c => { fill(c, '#3a4050', 38, 96, 52, 26, 4); dot(c, 50, 108, 4, '#ff5a5a'); dot(c, 64, 108, 4, '#5aff8a'); dot(c, 78, 108, 4, '#4fc8ff'); }, side: c => { fill(c, '#ff8a2a', 0, 74, 128, 10); fill(c, '#4fc8ff', 40, 92, 48, 20, 4); }, back: c => fill(c, '#c8ccd4', 0, 74, 128, 8) }),
    parts: [['ball', 0.93, 0, 0.02, 0, 0xbfe6ff, { alpha: 0.2 }], ['ring', 0.63, 0.06, 0, -0.26, 0, 0xc8ccd4, { rx: PI / 2 }], ['box', 0.68, 0.72, 0.22, 0, -0.08, -0.66, 0xd8dbe2], ['cyl', 0.07, 0.09, 0.2, -0.2, -0.54, -0.66, 0x3a4050], ['cyl', 0.07, 0.09, 0.2, 0.2, -0.54, -0.66, 0x3a4050], ['cyl', 0.012, 0.012, 0.28, 0.4, 0.96, 0, STEEL], ['ball', 0.04, 0.4, 1.12, 0, 0xff5a5a, { glow: 1 }]] },
  { id: 'wizard', name: 'Wizard Robe',
    paint: clothes({ col: '#4a2f9c', sideY: 30, front: c => { fill(c, '#f2c23a', 60, 90, 8, 38); starAt(c, '#f2c23a', 34, 108, 10); starAt(c, '#f2c23a', 94, 108, 10); }, side: c => { starAt(c, '#f2c23a', 34, 66, 11); starAt(c, '#ffe9a0', 90, 100, 8); }, back: c => { starAt(c, '#f2c23a', 64, 80, 22); } }),
    parts: [brim(0.58, 0.53, 0x3a2480), ['cone', 0.38, 0.86, 0, 0.96, -0.03, 0x4a2f9c, { rz: 0.07 }], ['cyl', 0.34, 0.34, 0.06, 0, 0.62, -0.01, GOLD], ['cyl', 0.022, 0.022, 1.3, 0.64, 0.02, 0.12, 0x7a5a38, { rz: -0.07 }], ['ball', 0.11, 0.68, 0.72, 0.12, 0x6ae0ff, { glow: 1 }]] },
  // ---- rare finds ----
  { id: 'knight', name: 'Knight Armour',
    paint: clothes({ col: '#aab2c0', sideY: 30, front: c => { fill(c, '#7c8494', 0, 90, 128, 5); tri(c, '#c9313a', [44, 96], [84, 96], [84, 112], [64, 126], [44, 112]); fill(c, '#f6f4ee', 60, 98, 8, 22); fill(c, '#f6f4ee', 50, 104, 28, 7); }, side: c => { for (let y = 44; y < 128; y += 20) for (let x = 12; x < 128; x += 26) dot(c, x, y, 3, '#7c8494'); }, back: c => { hoops(c, '#7c8494', [52, 84, 116], 5); } }),
    parts: [['ball', 0.46, 0, 0.42, -0.04, STEEL, { sy: 0.72 }], ['box', 0.07, 0.34, 0.04, 0, 0.26, 0.53, STEEL], ['box', 0.1, 0.46, 0.46, 0, 0.92, -0.05, RED], ['ball', 0.25, 0.58, 0.1, 0, STEEL], ['ball', 0.25, -0.58, 0.1, 0, STEEL], ['box', 0.05, 1.3, 0.14, 0.2, 0.1, -0.6, 0xdde2ea, { rz: -0.5 }], ['box', 0.32, 0.05, 0.08, 0.05, -0.2, -0.6, GOLD, { rz: -0.5 }]] },
  { id: 'greenbottle', name: 'Green Bottle Suit',
    paint: clothes({ col: '#2a8f54', sideY: 0, frontY: 90, front: c => { fill(c, '#f4f7e6', 16, 94, 96, 30, 5); dot(c, 64, 109, 10, '#2a8f54'); }, side: c => { fill(c, '#f4f7e6', 0, 56, 128, 44); fill(c, 'rgba(255,255,255,.3)', 12, 4, 10, 120, 4); dot(c, 64, 78, 14, '#2a8f54'); }, back: c => { fill(c, '#f4f7e6', 0, 56, 128, 44); dot(c, 64, 78, 14, '#2a8f54'); }, top: c => { c.fillStyle = '#2a8f54'; c.fillRect(0, 0, 128, 128); } }),
    parts: [['cyl', 0.2, 0.46, 0.3, 0, 0.64, 0, 0x2a8f54], ['cyl', 0.17, 0.2, 0.3, 0, 0.93, 0, 0x2a8f54], ['cyl', 0.19, 0.2, 0.13, 0, 1.13, 0, 0xffd23a], ...Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * PI * 2; return ['box', 0.028, 0.13, 0.028, Math.cos(a) * 0.195, 1.13, Math.sin(a) * 0.195, 0xe0b420, { ry: -a }]; })] },
  { id: 'king', name: 'Royal King',
    paint: clothes({ col: '#b01f35', sideY: 28, front: c => { fill(c, '#f8f6f0', 0, 90, 128, 12); for (let x = 8; x < 128; x += 20) dot(c, x, 96, 2.5, '#222'); fill(c, '#f2c23a', 58, 102, 12, 26); dot(c, 64, 114, 6, '#3fa0ff'); }, side: c => { fill(c, '#f8f6f0', 0, 28, 128, 12); for (let x = 8; x < 128; x += 20) dot(c, x, 34, 2.5, '#222'); }, back: c => fill(c, '#f8f6f0', 0, 28, 128, 12) }),
    parts: [['cyl', 0.42, 0.4, 0.18, 0, 0.58, 0, GOLD], ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * PI * 2; return ['cone', 0.09, 0.24, Math.cos(a) * 0.36, 0.78, Math.sin(a) * 0.36, GOLD, { seg: 5 }]; }), ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * PI * 2; return ['ball', 0.045, Math.cos(a) * 0.415, 0.58, Math.sin(a) * 0.415, i % 2 ? 0xff4a6a : 0x3fa0ff]; }), ['box', 1.06, 1.02, 0.06, 0, -0.06, -0.58, 0xb01f35, { rx: -0.12 }], ['box', 1.1, 0.12, 0.09, 0, 0.42, -0.53, 0xf8f6f0]] },
  { id: 'mecha', name: 'Mecha Pilot',
    paint: clothes({ col: '#3a4f7a', sideY: 22, front: c => { fill(c, '#ffb02e', 0, 90, 128, 7); fill(c, '#222a3c', 36, 100, 56, 28, 4); dot(c, 64, 114, 8, '#5ff2ff'); }, side: c => { fill(c, '#222a3c', 14, 40, 100, 70, 6); fill(c, '#ffb02e', 14, 72, 100, 6); }, back: c => { fill(c, '#222a3c', 14, 34, 100, 80, 6); } }),
    parts: [['box', 0.86, 0.08, 0.03, 0, 0.07, 0.515, 0x5ff2ff, { glow: 1 }], ['box', 0.3, 0.3, 0.74, 0.62, 0.1, 0, 0x3a4f7a], ['box', 0.3, 0.3, 0.74, -0.62, 0.1, 0, 0x3a4f7a], ['cyl', 0.07, 0.07, 0.54, 0.62, 0.3, 0.22, 0x222a3c, { rx: PI / 2.6 }], ['cyl', 0.07, 0.07, 0.54, -0.62, 0.3, 0.22, 0x222a3c, { rx: PI / 2.6 }], ['cone', 0.06, 0.48, 0.17, 0.74, 0.1, 0xffb02e, { rz: -0.45, seg: 4 }], ['cone', 0.06, 0.48, -0.17, 0.74, 0.1, 0xffb02e, { rz: 0.45, seg: 4 }], ['cyl', 0.1, 0.15, 0.24, 0.2, -0.3, -0.6, 0x222a3c, { rx: 0.3 }], ['cyl', 0.1, 0.15, 0.24, -0.2, -0.3, -0.6, 0x222a3c, { rx: 0.3 }], ['ball', 0.08, 0.2, -0.47, -0.65, 0x5ff2ff, { glow: 1 }], ['ball', 0.08, -0.2, -0.47, -0.65, 0x5ff2ff, { glow: 1 }]] },
  { id: 'emperor', name: 'Soju Emperor',
    paint: clothes({ col: '#0f5c3a', sideY: 20, front: c => { fill(c, '#f2c23a', 0, 90, 128, 10); fill(c, '#f2c23a', 52, 100, 24, 28); starAt(c, '#0f5c3a', 64, 114, 9); }, side: c => { fill(c, '#f2c23a', 0, 20, 128, 8); for (const [x, y] of [[30, 60], [92, 76], [50, 102]]) starAt(c, '#f2c23a', x, y, 10); }, back: c => { fill(c, '#f2c23a', 0, 20, 128, 8); starAt(c, '#f2c23a', 64, 74, 26); } }),
    parts: [['cyl', 0.36, 0.42, 0.26, 0, 0.62, 0, GOLD], ['box', 0.96, 0.05, 0.56, 0, 0.78, 0, INK], ...[-0.33, -0.2, -0.07, 0.07, 0.2, 0.33].map(x => ['box', 0.022, 0.26, 0.022, x, 0.63, 0.29, 0xff4a6a]), ['cyl', 0.1, 0.13, 0.24, 0, 0.92, 0, 0x2a8f54], ['cyl', 0.05, 0.1, 0.12, 0, 1.1, 0, 0x2a8f54], ['cyl', 0.06, 0.06, 0.05, 0, 1.18, 0, GOLD], ['ring', 0.72, 0.022, 0, 0.92, 0, 0xfff0a0, { rx: PI / 2, glow: 1 }], ['box', 1.04, 1, 0.06, 0, -0.06, -0.57, 0x0f5c3a, { rx: -0.1 }], ['box', 0.2, 0.2, 0.8, 0.56, 0.2, 0, GOLD], ['box', 0.2, 0.2, 0.8, -0.56, 0.2, 0, GOLD]] },
];

// (4 Nov, owner: "have legendary skins have a little unfaithful to cube shape addition then mythic shold have extra stuff on the model asw"): a legendary gets one small
// thing that breaks the cube's outline, a mythic several, and the two secrets, above mythic, the most. A mitten beside the cube is what holds them.
const mit = (side, y, z, col = WHITE) => ['ball', 0.125, side * 0.62, y, z, col];
const smoke = (x, y, z, r) => ['ball', r, x, y, z, 0xe6e6ea, { alpha: 0.7 }];
const EXTRA = {
  // ---- legendary: one little thing ----
  sailor: [mit(1, -0.12, 0.2), ['cyl', 0.055, 0.075, 0.42, 0.76, 0.1, 0.2, 0x8a5a30, { rz: -0.9 }], ['cyl', 0.08, 0.08, 0.05, 0.93, 0.25, 0.2, GOLD, { rz: -0.9 }]],
  chef: [mit(1, -0.12, 0.2), ['cyl', 0.022, 0.022, 0.64, 0.68, 0.2, 0.2, STEEL, { rz: -0.14 }], ['ball', 0.12, 0.73, 0.55, 0.2, STEEL, { sy: 0.7 }]],
  cowboy: [mit(1, 0, 0.12, 0x7a4a26), ['cyl', 0.016, 0.016, 0.56, 0.7, 0.3, 0.12, 0xc8a060, { rz: -0.25 }], ['ring', 0.25, 0.02, 0.8, 0.62, 0.12, 0xc8a060, { rx: PI / 2 - 0.2 }]],
  samurai: [['cyl', 0.03, 0.03, 1.1, 0.62, -0.24, -0.1, 0x1a1216, { rx: 1.25 }], ['cyl', 0.065, 0.065, 0.025, 0.62, -0.1, 0.44, GOLD, { rx: 1.25 }], ['cyl', 0.03, 0.03, 0.26, 0.62, -0.06, 0.58, 0xf6f4ee, { rx: 1.25 }]],
  mecha: [['box', 0.2, 0.24, 0.24, 0.66, -0.2, 0.1, 0x222a3c], ['cone', 0.09, 0.26, 0.66, -0.2, 0.34, 0xffb02e, { rx: PI / 2, seg: 6 }], ['box', 0.2, 0.24, 0.24, -0.66, -0.2, 0.1, 0x222a3c]],
  greenbottle: [['ball', 0.13, 0.05, 1.3, 0, WHITE], ['ball', 0.1, -0.11, 1.26, 0.05, WHITE], ['ball', 0.08, 0.15, 1.24, -0.04, WHITE], ['ball', 0.05, 0.23, 1.04, 0.05, WHITE], ['ball', 0.035, 0.26, 0.9, 0.05, WHITE]],
  // ---- mythic: a lot more ----
  detective: [['box', 0.94, 0.5, 0.05, 0, -0.46, -0.56, 0xb08a55, { rx: 0.28 }], mit(1, -0.08, 0.26, 0x7a5a30), ['cyl', 0.022, 0.022, 0.34, 0.72, 0.06, 0.26, 0x5a4230, { rz: -0.4 }], ['ring', 0.16, 0.028, 0.84, 0.3, 0.26, GOLD], ['cyl', 0.145, 0.145, 0.012, 0.84, 0.3, 0.26, 0xbfe6ff, { rx: PI / 2, alpha: 0.5 }], ['cyl', 0.018, 0.018, 0.22, -0.22, -0.08, 0.62, 0x5a3a20, { rx: PI / 2 }], ['cyl', 0.055, 0.04, 0.09, -0.22, -0.03, 0.73, 0x5a3a20], smoke(-0.24, 0.12, 0.73, 0.04), smoke(-0.17, 0.25, 0.73, 0.06), smoke(-0.24, 0.42, 0.7, 0.085)],
  suit: [mit(1, -0.14, 0.04), ['ring', 0.06, 0.016, 0.68, -0.34, 0.04, INK], ['box', 0.46, 0.34, 0.14, 0.72, -0.56, 0.04, 0x4a2f20], ['box', 0.08, 0.05, 0.15, 0.72, -0.44, 0.04, GOLD], mit(-1, 0.02, 0.2), ['box', 0.26, 0.13, 0.012, -0.78, 0.26, 0.18, 0x6ac46a, { rz: 0.45 }], ['box', 0.26, 0.13, 0.012, -0.88, 0.48, 0.06, 0x6ac46a, { rz: -0.4 }], ['box', 0.26, 0.13, 0.012, -0.68, 0.66, 0.16, 0x6ac46a, { rz: 0.2 }]],
  knight: [['box', 0.92, 0.98, 0.04, 0, -0.14, -0.68, RED, { rx: -0.14 }], mit(-1, -0.06, 0.16, STEEL), ['box', 0.06, 0.62, 0.48, -0.74, -0.04, 0.16, 0xaab2c0], ['box', 0.07, 0.42, 0.09, -0.75, -0.02, 0.16, RED], ['box', 0.07, 0.09, 0.32, -0.75, 0.08, 0.16, RED], mit(1, -0.06, 0.2, STEEL), ['box', 0.05, 1.02, 0.11, 0.7, 0.44, 0.2, 0xdde2ea, { rz: -0.1 }], ['box', 0.3, 0.05, 0.11, 0.65, -0.02, 0.2, GOLD, { rz: -0.1 }]],
  king: [mit(1, -0.04, 0.2, WHITE), ['cyl', 0.032, 0.032, 1.16, 0.7, 0.16, 0.2, GOLD, { rz: -0.07 }], ['ball', 0.13, 0.74, 0.78, 0.2, 0xff4a6a, { glow: 1 }], ...[0, 1, 2, 3].map(i => ['cone', 0.03, 0.13, 0.74 + Math.cos((i * PI) / 2) * 0.14, 0.78 + Math.sin((i * PI) / 2) * 0.14, 0.2, GOLD, { rz: (i * PI) / 2 - PI / 2, seg: 4 }]), mit(-1, -0.04, 0.2, WHITE), ['ball', 0.14, -0.7, 0.14, 0.2, GOLD], ['box', 0.03, 0.18, 0.03, -0.7, 0.34, 0.2, GOLD], ['box', 0.12, 0.03, 0.03, -0.7, 0.36, 0.2, GOLD], ['box', 1.16, 0.2, 0.74, 0, -0.42, -0.86, 0xb01f35, { rx: 0.12 }], ['box', 1.2, 0.08, 0.1, 0, -0.34, -1.2, 0xf8f6f0, { rx: 0.12 }]],
  // ---- secret: above mythic, so the most of all ----
  pirate: [['ball', 0.17, 0.42, 0.72, 0.02, 0xe24a3a, { sy: 1.2 }], ['ball', 0.11, 0.46, 0.94, 0.06, 0xe24a3a], ['cone', 0.04, 0.12, 0.47, 0.92, 0.2, GOLD, { rx: PI / 2 }], ['box', 0.05, 0.26, 0.2, 0.58, 0.7, -0.03, 0x2f8fd8, { rz: -0.15 }], ['box', 0.1, 0.34, 0.04, 0.38, 0.5, -0.14, 0xffd23a, { rx: 0.5 }], ['ball', 0.022, 0.5, 0.97, 0.15, INK], mit(1, -0.1, 0.22), ['box', 0.07, 0.86, 0.03, 0.74, 0.3, 0.22, 0xdde2ea, { rz: -0.22 }], ['box', 0.24, 0.05, 0.07, 0.65, -0.06, 0.22, GOLD, { rz: -0.22 }], mit(-1, -0.1, 0.22, INK), ['ring', 0.09, 0.024, -0.76, 0.05, 0.22, STEEL, { rx: 0.2 }], ['box', 1, 0.86, 0.04, 0, -0.14, -0.66, 0x7a1a26, { rx: -0.12 }]],
  emperor: [...[0, 1, 2, 3].flatMap(i => { const a = (i / 4) * PI * 2 + 0.6, x = Math.cos(a) * 0.86, z = Math.sin(a) * 0.86; return [['cyl', 0.075, 0.09, 0.2, x, 0.3, z, 0x2a8f54, { rz: 0.25 }], ['cyl', 0.035, 0.07, 0.09, x - 0.035, 0.44, z, 0x2a8f54, { rz: 0.25 }], ['cyl', 0.04, 0.04, 0.03, x - 0.05, 0.5, z, GOLD, { rz: 0.25 }], ['cyl', 0.093, 0.093, 0.09, x, 0.28, z, 0xf4f7e6, { rz: 0.25 }]]; }), mit(1, -0.16, 0.2), ['cyl', 0.08, 0.05, 0.13, 0.74, -0.02, 0.2, GOLD], mit(-1, -0.16, 0.2)],
};
for (const c of COSTUMES) if (EXTRA[c.id]) c.parts.push(...EXTRA[c.id]);

// ---------------- projectile themes ----------------
// One model per theme, facing +z, at PROJECTILE_SIZE. spin: how it turns as it flies. Every attack shows it: towers without a projectile throw it out when they
// hit (see X.themeFling in tdfx.js).
const CAP = ['td/soju_cap_attack', 'td/soju_cap_hit', ''], CLINK = ['td/soju_clink_attack', 'td/soju_clink_hit', ''], POP = ['td/soju_pop_attack', 'td/soju_splash_hit', ''];
const TAB = ['td/soju_tab_attack', 'td/soju_cap_hit', ''];
const big = s => [s[0], s[1], 'td/soju_toast_sig'];
const SIG = (type, name, every = 4) => ({ every, type, name });
const THEMES = [
  { id: 'caps', name: 'Bottle Caps', spin: 'flat', el: 'light', c: [0xffd23a, 0xfff2a0, 0xffffff], sfx: CAP, parts: [['cyl', 0.17, 0.19, 0.07, 0, 0, 0, 0xffd23a, { seg: 16 }], ['cyl', 0.13, 0.13, 0.015, 0, 0.04, 0, 0xfff2a0]] },
  { id: 'dumplings', name: 'Dumplings', spin: 'tumble', el: 'dust', c: [0xf6ecd2, 0xd8c8a0, 0xffffff], sfx: POP, parts: [['ball', 0.17, 0, 0, 0, 0xf6ecd2, { sy: 0.72 }], ...[-0.1, -0.03, 0.04, 0.11].map(x => ['box', 0.035, 0.05, 0.03, x, 0.12, 0, 0xd8c8a0])] },
  { id: 'bottles', name: 'Soju Bottles', spin: 'tumble', el: 'fizz', c: [0x35b56a, 0xd8ffd8, 0xffffff], sfx: CLINK, parts: [['cyl', 0.09, 0.1, 0.28, 0, 0, -0.06, 0x2f9e5b, { rx: PI / 2 }], ['cyl', 0.04, 0.09, 0.12, 0, 0, 0.14, 0x2f9e5b, { rx: PI / 2 }], ['cyl', 0.045, 0.045, 0.05, 0, 0, 0.22, 0xffd23a, { rx: PI / 2 }], ['cyl', 0.103, 0.103, 0.13, 0, 0, -0.06, 0xf4f7e6, { rx: PI / 2 }]] },
  // (4 Nov, owner: "add more projectiles theres too less have like 7 projectiles per gate")
  { id: 'skewers', name: 'Rice Cake Skewers', spin: 'tumble', el: 'warm', c: [0xe2452f, 0xffa23a, 0xffffff], sfx: POP, parts: [['cyl', 0.013, 0.013, 0.56, 0, 0, 0, 0xd8b078, { rx: PI / 2 }], ...[-0.15, 0, 0.15].map(z => ['cyl', 0.07, 0.07, 0.12, 0, 0, z, 0xe2452f, { rx: PI / 2 }])] },
  { id: 'fishcake', name: 'Fish Cakes', spin: 'tumble', el: 'dust', c: [0xeed9a8, 0xc8a468, 0xffffff], sfx: POP, parts: [['cyl', 0.012, 0.012, 0.56, 0, 0, 0, 0xd8b078, { rx: PI / 2 }], ...[-0.16, -0.05, 0.06, 0.17].map((z, i) => ['box', 0.3, 0.045, 0.14, 0, i % 2 ? 0.05 : -0.05, z, 0xeed9a8, { rx: i % 2 ? 0.6 : -0.6 }])] },
  { id: 'chopsticks', name: 'Chopsticks', spin: 'tumble', el: 'dust', c: [0xa8643a, 0xe8c078, 0xffffff], sfx: TAB, parts: [['cyl', 0.012, 0.024, 0.62, -0.03, 0, 0, 0xa8643a, { rx: PI / 2, ry: 0.1 }], ['cyl', 0.012, 0.024, 0.62, 0.05, 0, 0, 0xc47a48, { rx: PI / 2, ry: -0.1 }]] },
  { id: 'hotteok', name: 'Hotteok', spin: 'flat', el: 'warm', c: [0xd99a44, 0xffd98a, 0xffffff], sfx: POP, parts: [['cyl', 0.19, 0.2, 0.07, 0, 0, 0, 0xd99a44, { seg: 16 }], ['cyl', 0.11, 0.11, 0.076, 0, 0.002, 0, 0x8f5a24, { seg: 14 }], ...[0, 2.1, 4.2].map(a => ['ball', 0.018, Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14, 0xfff0c8])] },
  { id: 'lanterns', name: 'Paper Lanterns', spin: 'roll', el: 'warm', c: [0xe2452f, 0xffd23a, 0xffffff], sfx: POP, parts: [['ball', 0.17, 0, 0, 0, 0xe2452f, { sy: 1.15, glow: 1 }], ['cyl', 0.08, 0.08, 0.04, 0, 0.19, 0, 0xffd23a], ['cyl', 0.08, 0.08, 0.04, 0, -0.19, 0, 0xffd23a], ['cyl', 0.012, 0.012, 0.13, 0, -0.27, 0, 0xffd23a]] },
  { id: 'shotglass', name: 'Shot Glasses', spin: 'tumble', el: 'fizz', c: [0xbfe6ff, 0x8fe8a8, 0xffffff], sfx: CLINK, parts: [['cyl', 0.075, 0.06, 0.15, 0, -0.02, 0, 0x7fe0a0, { seg: 12 }], ['cyl', 0.115, 0.085, 0.28, 0, 0, 0, 0xcfefff, { alpha: 0.55, seg: 14 }]] },
  { id: 'lemon', name: 'Lemon Slices', spin: 'flat', el: 'light', c: [0xffe14a, 0xfff6c0, 0xffffff], sfx: POP, parts: [['cyl', 0.19, 0.19, 0.05, 0, 0, 0, 0xffd21e, { seg: 16 }], ['cyl', 0.16, 0.16, 0.056, 0, 0, 0, 0xfff6c0, { seg: 16 }], ...[0, 1, 2].map(i => ['box', 0.3, 0.06, 0.016, 0, 0, 0, 0xffe14a, { ry: (i * PI) / 3 }])] },
  { id: 'ice', name: 'Ice Cubes', spin: 'tumble', el: 'fizz', c: [0xbfeaff, 0xeafaff, 0xffffff], sfx: CLINK, parts: [['box', 0.14, 0.14, 0.14, 0, 0, 0, 0xeafaff], ['box', 0.25, 0.25, 0.25, 0, 0, 0, 0xa8e0ff, { alpha: 0.6 }]] },
  { id: 'goldbars', name: 'Gold Bars', spin: 'tumble', el: 'warm', c: [0xffc83a, 0xfff2a0, 0xffffff], sfx: TAB, parts: [['box', 0.34, 0.12, 0.18, 0, -0.02, 0, 0xffc83a], ['box', 0.26, 0.05, 0.11, 0, 0.06, 0, 0xffe27a]] },
  { id: 'crowns', name: 'Little Crowns', spin: 'roll', el: 'light', c: [0xffd23a, 0xff4a6a, 0xffffff], sfx: TAB, parts: [['cyl', 0.16, 0.16, 0.12, 0, -0.06, 0, 0xffd23a, { seg: 12 }], ...[0, 1, 2, 3, 4].map(i => { const a = (i / 5) * PI * 2; return ['cone', 0.055, 0.16, Math.cos(a) * 0.13, 0.07, Math.sin(a) * 0.13, 0xffd23a, { seg: 4 }]; }), ['ball', 0.045, 0, -0.06, 0.16, 0xff4a6a]] },
  { id: 'coins', name: 'Gold Coins', spin: 'roll', el: 'warm', c: [0xffc83a, 0xfff2a0, 0xffffff], sig: SIG('toast', 'Jackpot'), sfx: big(TAB), parts: [['cyl', 0.17, 0.17, 0.05, 0, 0, 0, 0xffc83a, { rz: PI / 2, seg: 16 }], ['cyl', 0.115, 0.115, 0.056, 0, 0, 0, 0xfff2a0, { rz: PI / 2, seg: 16 }]] },
];

// ---------------- the event gate ----------------
// (5 Nov, owner: "under events, have 1 gate for sanrio characters then create sanrio costumes for all of them and make them really rare and put a bunch of just regular skins so that most summons give regular skins but a rare pull would give a rare sanrio character")
// A character is a whole suit: it paints over the hero, face and all, and the ears and bows stand off the cube. Regular skins keep the hero's face.
const oval = (c, col, x, y, rx, ry = rx) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, PI * 2); c.fill(); };
const stroke = (c, col, w, ...pts) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
const smile = (c, col, x, y, r, w = 3) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.arc(x, y - r * 0.6, r, 0.25 * PI, 0.75 * PI); c.stroke(); };
// (5 Nov, owner: "make the sanrio skjins cuter the faces r kinda scary a little"): big soft eyes with a shine in them, set low and wide, and rosy cheeks. Nothing with an edge
const eye = (c, x, y, rx = 6.5, ry = 8.5, col = BLK_S) => { oval(c, col, x, y, rx, ry); dot(c, x + rx * 0.3, y - ry * 0.36, rx * 0.4, '#fff'); dot(c, x - rx * 0.32, y + ry * 0.38, rx * 0.2, '#fff'); };
const blush = (c, x, y, col = '#ffb6c8') => oval(c, col, x, y, 9, 5.5);
const suit = o => clothes({ col: o.col, frontY: 0, sideY: 0, front: o.front, side: o.side, back: o.back, top: c => { c.fillStyle = o.topCol || o.col; c.fillRect(0, 0, 128, 128); if (o.topArt) o.topArt(c); } });
const bow = (x, y, z, col, s = 1, knot = col) => [['ball', 0.12 * s, x - 0.13 * s, y, z, col, { sy: 0.8, sz: 0.55 }], ['ball', 0.12 * s, x + 0.13 * s, y, z, col, { sy: 0.8, sz: 0.55 }], ['ball', 0.055 * s, x, y, z + 0.03 * s, knot]];
const BLK = 0x24202c, PINK = 0xff9ecb, SKY = 0x8fd4ff, CREAM = 0xfff0dc;
const hearts = c => { for (const [x, y] of [[26, 112], [64, 104], [102, 112]]) { oval(c, '#ff7ab0', x - 4, y, 5); oval(c, '#ff7ab0', x + 4, y, 5); tri(c, '#ff7ab0', [x - 9, y + 2], [x + 9, y + 2], [x, y + 11]); } };
COSTUMES.push(
  // ---- the characters: really rare ----
  { id: 'kitty', name: 'Hello Kitty',
    paint: suit({ col: '#fbfaf6',
      front: c => { eye(c, 38, 62, 6, 7.5); eye(c, 90, 62, 6, 7.5); oval(c, '#ffc92e', 64, 72, 5, 3.5); blush(c, 24, 76); blush(c, 104, 76); for (const [a, b] of [[62, 60], [72, 73]]) { stroke(c, '#8a8490', 2, [4, a], [18, b]); stroke(c, '#8a8490', 2, [124, a], [110, b]); } fill(c, '#ffd23a', 0, 90, 128, 12); fill(c, '#3b6fd6', 0, 100, 128, 28); fill(c, '#3b6fd6', 30, 90, 12, 12); fill(c, '#3b6fd6', 86, 90, 12, 12); dot(c, 36, 106, 3.5, '#ffd23a'); dot(c, 92, 106, 3.5, '#ffd23a'); },
      side: c => { fill(c, '#ffd23a', 0, 90, 128, 12); fill(c, '#3b6fd6', 0, 100, 128, 28); }, back: c => { fill(c, '#ffd23a', 0, 90, 128, 12); fill(c, '#3b6fd6', 0, 100, 128, 28); } }),
    parts: [['ball', 0.19, -0.34, 0.56, 0, WHITE, { sy: 1.1 }], ['ball', 0.19, 0.34, 0.56, 0, WHITE, { sy: 1.1 }], ...bow(0.3, 0.6, 0.2, 0xe8324a, 1.25, 0xffd23a)] },
  { id: 'purin', name: 'Pompompurin',
    paint: suit({ col: '#ffe488',
      front: c => { eye(c, 36, 60, 6, 7); eye(c, 92, 60, 6, 7); oval(c, '#8a5a24', 64, 67, 3.5, 2.5); smile(c, '#8a5a24', 58, 76, 6, 2.5); smile(c, '#8a5a24', 70, 76, 6, 2.5); blush(c, 22, 74, '#ffc090'); blush(c, 106, 74, '#ffc090'); stroke(c, '#d8b050', 3, [28, 116], [100, 116]); },
      side: c => stroke(c, '#e8c860', 3, [20, 116], [108, 116]), back: c => oval(c, '#f4d060', 64, 108, 16, 12) }),
    parts: [['cyl', 0.38, 0.43, 0.09, 0, 0.56, 0, 0x8a5a24], ['ball', 0.31, 0, 0.62, 0, 0x8a5a24, { sy: 0.42 }], ['cyl', 0.022, 0.03, 0.12, 0, 0.8, 0, 0x8a5a24], ['ball', 0.2, -0.6, 0.12, 0.02, 0xd8a050, { sx: 0.45, sy: 1.3 }], ['ball', 0.2, 0.6, 0.12, 0.02, 0xd8a050, { sx: 0.45, sy: 1.3 }], mit(1, -0.22, 0.2, 0xffe488), ['cyl', 0.13, 0.17, 0.16, 0.8, -0.1, 0.2, 0xffd87a], ['cyl', 0.13, 0.13, 0.05, 0.8, 0, 0.2, 0x8a5a24], mit(-1, -0.22, 0.2, 0xffe488)] },
  { id: 'melody', name: 'My Melody',
    paint: suit({ col: '#f7a3c4',
      front: c => { oval(c, '#fffaf6', 64, 62, 48, 42); eye(c, 44, 60, 6.5, 8); eye(c, 84, 60, 6.5, 8); oval(c, '#ffc92e', 64, 70, 4.5, 3); blush(c, 28, 74); blush(c, 100, 74); fill(c, '#fffaf6', 0, 104, 128, 24); hearts(c); },
      side: c => fill(c, '#fffaf6', 0, 104, 128, 24), back: c => fill(c, '#fffaf6', 0, 104, 128, 24) }),
    parts: [['ball', 0.17, -0.26, 1.02, -0.02, 0xf7a3c4, { sy: 2.5, sz: 0.8 }], ['ball', 0.17, 0.26, 1.02, -0.02, 0xf7a3c4, { sy: 2.5, sz: 0.8 }], ['ball', 0.09, -0.26, 1.02, 0.09, 0xfffaf6, { sy: 3.2, sz: 0.4 }], ['ball', 0.09, 0.26, 1.02, 0.09, 0xfffaf6, { sy: 3.2, sz: 0.4 }], ...bow(0.27, 0.56, 0.26, SKY, 1.05, 0xffffff), mit(1, -0.14, 0.2, 0xf7a3c4), ['cyl', 0.02, 0.02, 0.5, 0.74, 0.1, 0.2, 0xfffaf6, { rz: -0.15 }], ['ball', 0.09, 0.8, 0.38, 0.2, 0xff7ab0], mit(-1, -0.14, 0.2, 0xf7a3c4)] },
  { id: 'keroppi', name: 'Keroppi',
    paint: suit({ col: '#86d243',
      front: c => { c.strokeStyle = BLK_S; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(64, 54, 20, 0.2 * PI, 0.8 * PI); c.stroke(); blush(c, 24, 66, '#ffa8b8'); blush(c, 104, 66, '#ffa8b8'); hoops(c, '#e8324a', [90, 104, 118], 7); hoops(c, '#ffffff', [97, 111], 7); },
      side: c => { hoops(c, '#e8324a', [90, 104, 118], 7); hoops(c, '#ffffff', [97, 111], 7); }, back: c => { hoops(c, '#e8324a', [90, 104, 118], 7); hoops(c, '#ffffff', [97, 111], 7); } }),
    parts: [['ball', 0.25, -0.25, 0.6, 0.1, WHITE], ['ball', 0.25, 0.25, 0.6, 0.1, WHITE], ['ball', 0.15, -0.25, 0.6, 0.26, BLK], ['ball', 0.15, 0.25, 0.6, 0.26, BLK], ['ball', 0.055, -0.2, 0.67, 0.39, WHITE], ['ball', 0.055, 0.3, 0.67, 0.39, WHITE], mit(1, -0.16, 0.14, 0x86d243), mit(-1, -0.16, 0.14, 0x86d243), ['box', 0.34, 0.04, 0.28, 0.78, -0.56, 0.14, 0x4aa83a, { rz: 0.1 }]] },
  { id: 'badtz', name: 'Badtz-Maru',
    paint: suit({ col: '#1e1e24',
      front: c => { oval(c, '#ffffff', 42, 50, 15, 17); oval(c, '#ffffff', 86, 50, 15, 17); eye(c, 42, 52, 9, 11); eye(c, 86, 52, 9, 11); fill(c, '#ffc23a', 46, 68, 36, 11, 5.5); smile(c, '#b87a10', 64, 76, 5, 2); blush(c, 22, 72, '#ff9ab0'); blush(c, 106, 72, '#ff9ab0'); oval(c, '#f6f4ee', 64, 112, 36, 22); },
      back: c => oval(c, '#2c2c34', 64, 80, 30, 30) }),
    parts: [[0, -0.2, 0.15], [0.2, -0.05, 0], [-0.2, -0.05, 0], [0.34, 0.12, -0.3], [-0.34, 0.12, 0.3], [0.1, 0.22, -0.1], [-0.1, 0.22, 0.1]].map(([x, z, r]) => ['cone', 0.09, 0.26, x, 0.63, z, 0x1e1e24, { rz: r || -x * 0.8, seg: 8 }]).concat([['box', 0.34, 0.1, 0.22, 0.68, -0.1, 0.02, 0x1e1e24, { rz: -0.5 }], ['box', 0.34, 0.1, 0.22, -0.68, -0.1, 0.02, 0x1e1e24, { rz: 0.5 }]]) },
  { id: 'twinstars', name: 'Little Twin Stars',
    paint: clothes({ col: '#fff0dc', frontY: 0, sideY: 0,
      top: c => { fill(c, '#ff9ecb', 0, 0, 64, 128); fill(c, '#8fd4ff', 64, 0, 64, 128); },
      front: c => { fill(c, '#ff9ecb', 0, 0, 64, 30); fill(c, '#8fd4ff', 64, 0, 64, 30); eye(c, 42, 58, 6.5, 8.5); eye(c, 86, 58, 6.5, 8.5); blush(c, 26, 72); blush(c, 102, 72); smile(c, '#c86a6a', 64, 76, 5, 2.5); fill(c, '#ffe88a', 0, 92, 128, 36); starAt(c, '#ffffff', 34, 110, 11); starAt(c, '#ff9ecb', 94, 110, 11); },
      side: (c, cell) => { fill(c, cell ? '#8fd4ff' : '#ff9ecb', 0, 0, 128, 90); fill(c, '#ffe88a', 0, 92, 128, 36); }, back: c => { fill(c, '#ff9ecb', 0, 0, 64, 90); fill(c, '#8fd4ff', 64, 0, 64, 90); fill(c, '#ffe88a', 0, 92, 128, 36); } }),
    parts: [['ball', 0.32, -0.3, 0.58, -0.02, PINK, { sy: 0.85 }], ['ball', 0.32, 0.3, 0.58, -0.02, SKY, { sy: 0.85 }], ['ball', 0.14, -0.56, 0.3, 0, PINK], ['ball', 0.14, 0.56, 0.3, 0, SKY], ['cyl', 0.2, 0.2, 0.05, 0, 0.98, 0.04, 0xffe14a, { seg: 5, rx: PI / 2, glow: 1 }], ['cyl', 0.2, 0.2, 0.05, 0, 0.98, 0.04, 0xffe14a, { seg: 5, rx: PI / 2, rz: PI, glow: 1 }], mit(1, -0.14, 0.2, 0xfff0dc), ['cyl', 0.018, 0.018, 0.5, 0.76, 0.1, 0.2, 0xffe14a, { rz: -0.1 }], ['cyl', 0.1, 0.1, 0.03, 0.8, 0.38, 0.2, 0xffe14a, { seg: 5, rx: PI / 2, glow: 1 }]] },
  { id: 'kuromi', name: 'Kuromi',
    paint: suit({ col: '#2a2430',
      front: c => { oval(c, '#fffaf6', 64, 66, 44, 34); eye(c, 44, 64, 6.5, 8.5); eye(c, 84, 64, 6.5, 8.5); oval(c, '#ff9ec6', 64, 74, 3.5, 2.5); smile(c, '#8a7a90', 64, 82, 5, 2.5); blush(c, 30, 78); blush(c, 98, 78); oval(c, '#ff9ec6', 64, 18, 11, 10); dot(c, 60, 17, 2.2, '#2a2430'); dot(c, 68, 17, 2.2, '#2a2430'); smile(c, '#2a2430', 64, 24, 3, 1.5); fill(c, '#d8d0e0', 0, 110, 128, 18); },
      side: c => fill(c, '#d8d0e0', 0, 110, 128, 18), back: c => fill(c, '#d8d0e0', 0, 110, 128, 18) }),
    parts: [['ball', 0.17, -0.33, 0.72, -0.02, 0x2a2430, { sy: 1.7, rz: 0.3 }], ['ball', 0.17, 0.33, 0.72, -0.02, 0x2a2430, { sy: 1.7, rz: -0.3 }], ...bow(0.3, 0.6, 0.2, 0xff7ab0, 1.05, 0xffffff), ['cyl', 0.025, 0.035, 0.46, 0, -0.26, -0.68, 0x2a2430, { rx: 1.1 }], ['cone', 0.08, 0.17, 0, -0.08, -0.96, 0x2a2430, { rx: -2 }]] },
  { id: 'cinna', name: 'Cinnamoroll',
    paint: suit({ col: '#fbfdff',
      front: c => { eye(c, 42, 58, 7, 9, '#3a7fd6'); eye(c, 86, 58, 7, 9, '#3a7fd6'); blush(c, 26, 72, '#ffc0d4'); blush(c, 102, 72, '#ffc0d4'); smile(c, '#6a8aa8', 64, 74, 4.5, 2.5); fill(c, '#a8dcff', 0, 94, 128, 8); },
      side: c => fill(c, '#a8dcff', 0, 94, 128, 8), back: c => fill(c, '#a8dcff', 0, 94, 128, 8) }),
    parts: [['ball', 0.25, -0.74, 0.3, 0.02, WHITE, { sx: 1.7, sy: 0.72, sz: 0.5, rz: 0.2 }], ['ball', 0.25, 0.74, 0.3, 0.02, WHITE, { sx: 1.7, sy: 0.72, sz: 0.5, rz: -0.2 }], ['ring', 0.09, 0.035, 0, 0.62, 0, WHITE], ['ring', 0.14, 0.055, 0, 0.0, -0.64, WHITE], mit(1, -0.26, 0.26, WHITE), mit(-1, -0.26, 0.26, WHITE), ['cyl', 0.11, 0.13, 0.08, 0.8, -0.16, 0.26, 0xc88a4a], ['ball', 0.08, 0.8, -0.08, 0.26, 0xfff0dc, { sy: 0.5 }]] },
  // ---- regular skins: most of what this gate gives ----
  { id: 'polka', name: 'Polka Dot Tee',
    paint: clothes({ col: '#ff9ecb', front: c => { for (const [x, y] of [[20, 100], [52, 112], [84, 98], [112, 114]]) dot(c, x, y, 5, '#fff'); }, side: c => { for (const [x, y] of [[20, 60], [60, 90], [104, 70], [40, 112], [96, 112]]) dot(c, x, y, 6, '#fff'); }, back: c => { for (const [x, y] of [[24, 60], [64, 84], [104, 62], [40, 110], [90, 112]]) dot(c, x, y, 6, '#fff'); } }), parts: [['cyl', 0.33, 0.36, 0.16, 0, 0.58, 0, 0xff9ecb], ['box', 0.46, 0.035, 0.32, 0, 0.53, 0.42, 0xff9ecb]] },
  { id: 'candy', name: 'Candy Stripes',
    paint: clothes({ col: '#ffffff', front: c => hoops(c, '#ff6a8a', [92, 108, 124], 8), side: c => hoops(c, '#ff6a8a', [44, 60, 76, 92, 108, 124], 8), back: c => hoops(c, '#ff6a8a', [44, 60, 76, 92, 108, 124], 8) }),
    parts: [['cyl', 0.33, 0.36, 0.06, 0, 0.53, 0, 0xff6a8a]] },
  { id: 'overalls', name: 'Berry Overalls',
    paint: clothes({ col: '#6a9ae0', front: c => { fill(c, '#f6f4ee', 0, 90, 28, 38); fill(c, '#f6f4ee', 100, 90, 28, 38); oval(c, '#e8324a', 64, 110, 11, 13); fill(c, '#5fae4a', 58, 96, 12, 5); }, side: c => { fill(c, '#f6f4ee', 0, 40, 128, 40); }, back: c => fill(c, '#f6f4ee', 0, 40, 128, 34) }), parts: [brim(0.54, 0.53, 0xf4dfa8), ['cyl', 0.27, 0.31, 0.15, 0, 0.61, 0, 0xf4dfa8], ['cyl', 0.315, 0.315, 0.05, 0, 0.57, 0, 0xe8324a]] },
  { id: 'cardigan', name: 'Cream Cardigan',
    paint: clothes({ col: '#f7ecd2', front: c => { fill(c, '#e8d8b4', 60, 90, 8, 38); buttons(c, '#c88a5a', 74, [100, 116], 4); }, back: c => hoops(c, '#e8d8b4', [120], 5), side: c => hoops(c, '#e8d8b4', [120], 5) }), parts: [['ball', 0.42, 0, 0.5, 0, 0xc88a5a, { sy: 0.32 }], ['cyl', 0.02, 0.02, 0.08, 0, 0.64, 0, 0xc88a5a], ['box', 1.04, 0.12, 1.04, 0, -0.14, 0, 0xc88a5a]] },
  { id: 'pyjamas', name: 'Star Pyjamas',
    paint: clothes({ col: '#8a9ae8', front: c => { starAt(c, '#ffe88a', 32, 110, 9); starAt(c, '#ffe88a', 96, 106, 9); }, side: c => { starAt(c, '#ffe88a', 34, 66, 10); starAt(c, '#ffe88a', 92, 100, 10); }, back: c => starAt(c, '#ffe88a', 64, 84, 16) }),
    parts: [['cone', 0.3, 0.5, 0.06, 0.74, 0, 0x8a9ae8, { rz: -0.3 }], ['ball', 0.08, 0.23, 0.97, 0, WHITE]] },
  { id: 'sundress', name: 'Picnic Dress',
    paint: clothes({ col: '#ffe0e6', front: c => { for (let x = 0; x < 128; x += 24) for (let y = 92; y < 128; y += 24) fill(c, '#ff9eb0', x, y, 12, 12); }, side: c => { for (let x = 0; x < 128; x += 24) for (let y = 44; y < 128; y += 24) fill(c, '#ff9eb0', x, y, 12, 12); }, back: c => { for (let x = 0; x < 128; x += 24) for (let y = 44; y < 128; y += 24) fill(c, '#ff9eb0', x, y, 12, 12); } }),
    parts: [brim(0.56, 0.53, 0xf4dfa8), ['cyl', 0.26, 0.3, 0.14, 0, 0.6, 0, 0xf4dfa8], ['cyl', 0.305, 0.305, 0.05, 0, 0.56, 0, 0xff9eb0]] },
  { id: 'teddy', name: 'Teddy Onesie',
    paint: clothes({ col: '#b88a5a', front: c => oval(c, '#f0dcc0', 64, 116, 28, 18), back: c => oval(c, '#a07a4e', 64, 100, 16), side: c => fill(c, '#a07a4e', 0, 40, 128, 4) }),
    parts: [['ball', 0.18, -0.38, 0.6, 0, 0xb88a5a], ['ball', 0.18, 0.38, 0.6, 0, 0xb88a5a], ['ball', 0.09, -0.38, 0.6, 0.12, 0xf0dcc0], ['ball', 0.09, 0.38, 0.6, 0.12, 0xf0dcc0], ['box', 1.04, 0.1, 1.04, 0, 0.5, 0, 0xb88a5a]] },
  { id: 'frogcoat', name: 'Frog Raincoat',
    paint: clothes({ col: '#7ac84a', front: c => { fill(c, '#5aa836', 60, 90, 8, 38); buttons(c, '#ffe14a', 50, [100, 116], 4); }, side: c => fill(c, '#5aa836', 0, 40, 128, 5), back: c => fill(c, '#5aa836', 0, 40, 128, 5) }),
    parts: [['cyl', 0.6, 0.68, 0.05, 0, 0.53, -0.06, 0x7ac84a], ['ball', 0.34, 0, 0.56, 0, 0x7ac84a, { sy: 0.65 }], ['ball', 0.12, -0.2, 0.84, 0.12, WHITE], ['ball', 0.12, 0.2, 0.84, 0.12, WHITE], ['ball', 0.05, -0.2, 0.85, 0.22, BLK], ['ball', 0.05, 0.2, 0.85, 0.22, BLK]] },
  { id: 'bunny', name: 'Bunny Hood',
    paint: clothes({ col: '#f4eef4', front: c => { fill(c, '#e0d8e6', 0, 90, 128, 6); oval(c, '#ffd0e0', 64, 114, 12, 10); }, back: c => oval(c, '#ffffff', 64, 108, 12), side: c => fill(c, '#e0d8e6', 0, 40, 128, 4) }),
    parts: [['box', 1.04, 0.1, 1.04, 0, 0.5, 0, 0xf4eef4], ['ball', 0.13, -0.24, 0.92, 0, 0xf4eef4, { sy: 2.4, sz: 0.7 }], ['ball', 0.13, 0.24, 0.92, 0, 0xf4eef4, { sy: 2.4, sz: 0.7 }], ['ball', 0.07, -0.24, 0.92, 0.07, 0xffc0d4, { sy: 3.2, sz: 0.4 }], ['ball', 0.07, 0.24, 0.92, 0.07, 0xffc0d4, { sy: 3.2, sz: 0.4 }]] },
  { id: 'bigbow', name: 'Big Bow',
    paint: clothes({ col: '#fff4f8', front: c => { tri(c, '#ff6a9a', [40, 92], [64, 104], [40, 116]); tri(c, '#ff6a9a', [88, 92], [64, 104], [88, 116]); dot(c, 64, 104, 5, '#d83a6a'); } }),
    parts: bow(0, 0.66, 0, 0xff6a9a, 2.3, 0xd83a6a) },
  { id: 'cakehat', name: 'Cake Hat',
    paint: clothes({ col: '#ffe8c8', front: c => { fill(c, '#ffffff', 0, 90, 128, 8); for (let x = 8; x < 128; x += 26) dot(c, x, 104, 4, '#ff7a9a'); }, side: c => { fill(c, '#ffffff', 0, 40, 128, 8); }, back: c => fill(c, '#ffffff', 0, 40, 128, 8) }),
    parts: [['cyl', 0.46, 0.48, 0.2, 0, 0.6, 0, 0xfff4e0], ['cyl', 0.47, 0.49, 0.06, 0, 0.66, 0, 0xff9ecb], ['cyl', 0.32, 0.34, 0.16, 0, 0.78, 0, 0xfff4e0], ['ball', 0.1, 0, 0.95, 0, 0xe8324a], ['cyl', 0.012, 0.012, 0.12, 0.03, 1.08, 0, 0x5fae4a, { rz: -0.4 }]] },
  { id: 'teaparty', name: 'Tea Party',
    paint: clothes({ col: '#c8e8f0', front: c => { fill(c, '#ffffff', 40, 90, 48, 38, 6); for (const y of [100, 112, 124]) dot(c, 64, y, 3, '#ff9ecb'); }, side: c => fill(c, '#ffffff', 0, 112, 128, 16), back: c => { fill(c, '#ffffff', 0, 112, 128, 16); tri(c, '#ff9ecb', [46, 60], [64, 74], [46, 88]); tri(c, '#ff9ecb', [82, 60], [64, 74], [82, 88]); } }),
    parts: [brim(0.44, 0.53, 0xf4f4f4), ['cyl', 0.24, 0.26, 0.2, 0, 0.64, 0, 0xc8e8f0], ['ball', 0.08, 0.2, 0.74, 0.1, 0xff9ecb], mit(1, -0.1, 0.22), ['cyl', 0.09, 0.07, 0.1, 0.74, -0.02, 0.22, WHITE], ['ring', 0.04, 0.012, 0.84, -0.02, 0.22, WHITE]] },
  { id: 'cloudcoat', name: 'Cloud Coat',
    paint: clothes({ col: '#eaf6ff', sideY: 24, front: c => { fill(c, '#cfe8fa', 60, 90, 8, 38); oval(c, '#a8dcff', 36, 110, 11, 8); oval(c, '#a8dcff', 96, 110, 11, 8); }, side: c => { oval(c, '#cfe8fa', 40, 70, 22, 14); oval(c, '#cfe8fa', 90, 100, 22, 14); }, back: c => { oval(c, '#cfe8fa', 64, 76, 34, 22); } }),
    parts: [['ball', 0.3, -0.26, 0.6, 0, WHITE, { sy: 0.7 }], ['ball', 0.36, 0.06, 0.66, 0, WHITE, { sy: 0.75 }], ['ball', 0.26, 0.36, 0.58, 0.02, WHITE, { sy: 0.7 }], ['ball', 0.17, -0.62, 0.0, 0, WHITE], ['ball', 0.17, 0.62, 0.0, 0, WHITE]] },
);
THEMES.push(
  { id: 'hearts', name: 'Hearts', spin: 'flat', el: 'light', c: [0xff6a9a, 0xffc0d4, 0xffffff], sfx: POP, parts: [['ball', 0.12, -0.09, 0.05, 0, 0xff6a9a], ['ball', 0.12, 0.09, 0.05, 0, 0xff6a9a], ['cone', 0.18, 0.24, 0, -0.1, 0, 0xff6a9a, { rx: PI, seg: 12 }]] },
  { id: 'ribbons', name: 'Ribbons', spin: 'tumble', el: 'dust', c: [0xff9ecb, 0xffffff, 0xff6a9a], sfx: TAB, parts: bow(0, 0, 0, 0xff9ecb, 1.2, 0xff6a9a) },
  { id: 'berries', name: 'Strawberries', spin: 'tumble', el: 'warm', c: [0xe8324a, 0x5fae4a, 0xffffff], sfx: POP, parts: [['cone', 0.15, 0.3, 0, -0.04, 0, 0xe8324a, { rx: PI, seg: 10 }], ['cyl', 0.13, 0.05, 0.04, 0, 0.13, 0, 0x5fae4a, { seg: 6 }]] },
  { id: 'creampuff', name: 'Cream Puffs', spin: 'roll', el: 'dust', c: [0xf4d090, 0xffffff, 0xfff4e0], sfx: POP, parts: [['ball', 0.17, 0, -0.03, 0, 0xe8b868, { sy: 0.7 }], ['ball', 0.15, 0, 0.08, 0, 0xffffff, { sy: 0.45 }], ['ball', 0.14, 0, 0.14, 0, 0xf4d090, { sy: 0.5 }]] },
);

// ---------------- the gates' sets ----------------
// (3 Nov, owner: "make the different gates titled to be relevant to their skin themes", then "remove all those gates lets just have 2 gates for now and stack
// all the skins into those ... i want to have like 20 costumes, 4 projectiles, make costumes much more rarer than projectile cosmetics")
// Every item belongs to one gate. A gate's two projectiles are the common pulls, and its ten costumes are everything rarer (RARITY_WEIGHT in soju_rules.js).
const SETS = [
  { gate: 'ember', name: 'Night Market Gate', blurb: 'Street food, work clothes and the people out after dark.', items: {
    caps: 'common', skewers: 'common', fishcake: 'common', chopsticks: 'common', dumplings: 'rare', hotteok: 'rare', lanterns: 'rare',
    hoodie: 'epic', apron: 'epic', raincoat: 'epic', jersey: 'epic', sailor: 'legendary', chef: 'legendary', cowboy: 'legendary', detective: 'mythic', suit: 'mythic', pirate: 'secret' } },
  { gate: 'chrono', name: 'Golden Hall Gate', blurb: 'Dress up. Heroes, royalty and the finest bottle in the house.', items: {
    bottles: 'common', shotglass: 'common', lemon: 'common', ice: 'common', coins: 'rare', goldbars: 'rare', crowns: 'rare',
    tuxedo: 'epic', hanbok: 'epic', astronaut: 'epic', wizard: 'epic', samurai: 'legendary', mecha: 'legendary', greenbottle: 'legendary', knight: 'mythic', king: 'mythic', emperor: 'secret' } },
  // event: true puts a gate under the Event tab on the Summon page
  // (5 Nov, owner: "make them less rare theyre a bit too rare"): a character about 1 pull in 20, up from 1 in 65
  { gate: 'sanrio', event: true, name: 'Sanrio Gate', blurb: 'Mostly cute clothes. Once in a while, somebody famous.', weights: { mythic: 4, secret: 1 }, items: {
    hearts: 'common', ribbons: 'common', berries: 'common', polka: 'common', candy: 'common', overalls: 'common', cardigan: 'common', pyjamas: 'common', sundress: 'common',
    creampuff: 'rare', teddy: 'rare', frogcoat: 'rare', bunny: 'rare', bigbow: 'rare', cakehat: 'epic', teaparty: 'epic', cloudcoat: 'epic',
    purin: 'mythic', melody: 'mythic', keroppi: 'mythic', badtz: 'mythic', twinstars: 'mythic', cinna: 'mythic', kitty: 'secret', kuromi: 'secret' } },
];
const SET_OF = {};
for (const set of SETS) for (const id of Object.keys(set.items)) SET_OF[id] = set;
for (const x of [...COSTUMES, ...THEMES]) {
  x.gate = SET_OF[x.id].gate;
  x.rarity = SET_OF[x.id].items[x.id];
  // the rare ones get a signature look
  if (!x.parts.length || COSTUMES.includes(x)) continue;
  if (!x.sig && AF.RAR[x.rarity].order >= 3) { x.sig = SIG('toast', 'Cheers', AF.RAR[x.rarity].order >= 4 ? 3 : 4); x.sfx = big(x.sfx); }
}

// ---------------- items and what wearing them means ----------------
const COSTUME = {}, THEME = {};
const costumeKey = id => 'cos_' + id, themeKey = id => 'thm_' + id;
const blank = extra => Object.assign({ base: 0, look: {}, pose: {}, acc: [] }, extra);
for (const c of COSTUMES) {
  COSTUME[c.id] = c;
  c.top = topOf(c.parts);
  // the card a costume shows in a reveal or the Index: on Pip, the one tower everybody has
  const def = blank({ key: costumeKey(c.id), name: c.name, rarity: c.rarity, gateId: c.gate, item: 'costume', itemId: c.id, costume: c.id, animal: 'pip' });
  AF.UNITS.push(def); AF.UNIT[def.key] = def;
}
const TD_MODELS = AF.TDFX.lend().MODELS;
// (3 Nov, owner: "make projectiles a bit bigger i can barely see them in game") They were about a third of a raider's height.
const PROJECTILE_SIZE = 1.9;
const flyingModel = parts => g => { addParts(g, parts); g.scale.setScalar(PROJECTILE_SIZE); };
for (const t of THEMES) {
  THEME[t.id] = t;
  t.shape = 'wear_' + t.id;
  TD_MODELS[t.shape] = flyingModel(t.parts);
  const def = blank({ key: themeKey(t.id), name: t.name, rarity: t.rarity, gateId: t.gate, item: 'theme', itemId: t.id, animal: 'pip' });
  AF.UNITS.push(def); AF.UNIT[def.key] = def;
}
AF.WEAR_ITEMS = AF.UNITS.filter(d => d.item);

// the key for an animal wearing these, made the first time it is needed
const rank = r => AF.RAR[r].order;
function wornKey(animal, cid, tid) {
  const C = AF.CREW[animal];
  if (!cid && !tid) return C.key;
  const key = `${C.key}~${cid || ''}~${tid || ''}`;
  if (AF.UNIT[key]) return key;
  const base = AF.UNIT[C.key], c = COSTUME[cid], t = THEME[tid];
  const rarity = [c, t].filter(Boolean).map(x => x.rarity).sort((a, b) => rank(b) - rank(a))[0];
  AF.UNIT[key] = Object.assign({}, base, { key, rarity, costume: c ? cid : null, theme: t ? tid : null });
  const A0 = AF.ATTACKS[C.key];
  AF.ATTACKS[key] = t ? { name: t.name, kind: C.kind, el: t.el, shape: t.shape, c: t.c, p: C.p, spin: t.spin, sig: t.sig, themed: true } : Object.assign({}, A0);
  if (t) AF.UNIT_SFX[key] = t.sfx;
  return key;
}
// a saved key, read back as what still exists: an item since removed comes off. Null if it isn't one of these.
function wornFromKey(key) {
  const [crew, cid, tid] = key.split('~');
  const animal = Object.keys(AF.CREW).find(a => AF.CREW[a].key === crew);
  if (!animal || key.split('~').length !== 3) return null;
  return wornKey(animal, COSTUME[cid] ? cid : '', THEME[tid] ? tid : '');
}
// What each tower throws before it wears anything. They were a tiny spark. A tower with no projectile (Bao, Pebble, Truffle) has none here.
const SHOTS = {
  pip: { spin: 'none', parts: [['cone', 0.06, 0.3, 0, 0, 0.04, 0xff9d3c, { rx: PI / 2 }], ['box', 0.07, 0.03, 0.09, 0, 0.02, -0.14, 0x5fae4a], ['box', 0.03, 0.07, 0.09, 0, 0.02, -0.14, 0x5fae4a]] },
  mochi: { spin: 'tumble', parts: [['ball', 0.14, 0, 0, 0, 0xff7aa8], ['ring', 0.14, 0.018, 0, 0, 0, 0xffc0d4, { rx: 0.6 }], ['ring', 0.14, 0.018, 0, 0, 0, 0xffc0d4, { ry: 1 }]] },
  dot: { spin: 'none', parts: [['box', 0.1, 0.02, 0.28, 0, 0, 0, 0xd8f4ff], ['box', 0.02, 0.03, 0.34, 0, 0.01, 0, 0x8fdcff]] },
  fig: { spin: 'none', parts: [['ball', 0.09, 0, 0, 0, 0x9ae05e, { sz: 1.5 }]] },
  hazel: { spin: 'none', parts: [['cone', 0.08, 0.24, 0, 0.06, 0, 0xa98561, { seg: 6 }], ['cone', 0.06, 0.18, 0.12, 0.03, 0.05, 0xead9b8, { seg: 6 }], ['cone', 0.06, 0.18, -0.1, 0.03, -0.07, 0xead9b8, { seg: 6 }]] },
  owl: { spin: 'tumble', parts: [['ball', 0.13, 0, -0.02, 0, 0xc98f4e, { sy: 1.25 }], ['ball', 0.14, 0, 0.1, 0, 0x7a5a30, { sy: 0.55 }], ['box', 0.03, 0.08, 0.03, 0, 0.19, 0, 0x7a5a30]] },
  fox: { spin: 'flat', parts: [['box', 0.09, 0.03, 0.3, 0.1, 0, 0.08, 0xff8a4c, { ry: 0.8 }], ['box', 0.09, 0.03, 0.3, -0.1, 0, 0.08, 0xffc89a, { ry: -0.8 }]] },
};
const shotOf = animal => { const x = SHOTS[animal]; if (!x) return null; const shape = 'shot_' + animal; if (!TD_MODELS[shape]) TD_MODELS[shape] = flyingModel(x.parts); return { shape, spin: x.spin }; };
// a gate gives only its own set: that rarity, or (a pity pull for a rarity it doesn't have) the rarest thing it has
const byRarity = {};
for (const d of AF.WEAR_ITEMS) (byRarity[d.rarity] = byRarity[d.rarity] || []).push(d.key);
const inGate = g => AF.WEAR_ITEMS.filter(d => d.gateId === g);
AF.soju.pickSkin = (r, g) => {
  const set = inGate(g.id);
  let l = set.filter(d => d.rarity === r);
  if (!l.length) { const top = Math.max(...set.map(d => rank(d.rarity))); l = set.filter(d => rank(d.rarity) === top); }
  return l[(Math.random() * l.length) | 0].key;
};
// the colours a theme's pieces are made of, for the bits that come off on a hit
const colorsOf = t => { const out = new Set(); for (const p of t.parts) { const at = p[0] === 'ball' ? 2 : p[0] === 'box' || p[0] === 'cyl' ? 4 : 3, c = p[at + 3]; if (typeof c === 'number') out.add(c); } return [...out]; };
AF.soju.wear = { colorsOf, shotOf, SETS, inGate, COSTUME, THEME, COSTUMES, THEMES, wornKey, wornFromKey, addParts, costumeKey, themeKey, byRarity };
})();
