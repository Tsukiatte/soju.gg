/* Aura Farm: the Merchant (30 Oct, Chris: "that whole relic area would a really cool addition if added correctly. It should
   be a "merchant shop" in the lobby, behind everything, and that's where you roll for relics, these relics should have a
   cool coin design for each, and the way it's rolled is a coin flip, the coin flips in 3d then once it lands it shows
   you what it hit, that's the relic").
   AF.coin draws a relic as a coin: a rim in its rarity's metal (bronze, silver, violet, gold, rainbow), a dotted ring,
   a sunk field and the kind's emblem struck in the middle, a sheen across it. The same drawing is the 3D coin's face
   (AF.coin.texture) and the interface's coins (AF.coin.draw on a canvas). The back of every coin is the Merchant's
   mark, a pair of scales. "@merchant" is the trader behind the stall (drawn only). */
(function () {
const AF = window.AF;
// each relic kind's emblem, in the icon set's line style (24 x 24)
AF.RELIC_IC = {
  inc: '<circle cx="12" cy="13" r="7.5"/><circle cx="12" cy="13" r="4"/><path d="M12 5.5V3"/><circle cx="12" cy="2.4" r="1.2"/>',
  shard: '<path d="M12 3 19 10 12 21 5 10Z"/><path d="M5 10h14M12 3v18M8.5 10 12 21l3.5-11"/>',
  luck: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/><circle cx="8.5" cy="15.5" r="1.1"/>',
  favor: '<ellipse cx="12" cy="5.5" rx="7" ry="2.4"/><path d="M12 9.5 15.5 15 12 21.5 8.5 15Z"/>',
  tluck: '<path d="M10 4 17 18H3Z"/><path d="M13.6 11.5 21 9M14.3 13 21 13.5M15 14.6l6 3.8"/>',
  shiny: '<path d="M12 2.5c.8 5 3 7.2 8 8-5 .8-7.2 3-8 8-.8-5-3-7.2-8-8 5-.8 7.2-3 8-8Z"/><path d="M19 17v4M17 19h4"/>',
  cash: '<path d="M8 8h8l3.5 4.5V17a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4v-4.5Z"/><path d="M9 8 7 3.5h10L15 8"/><path d="M12 12v5M10 13.5h3.2a1.2 1.2 0 0 1 0 2.4H10"/>',
  nap: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 21h4"/><path d="M17 3.5h3l-3 3.5h3"/>',
  star: '<circle cx="12" cy="12" r="9"/><path d="M12 5 14 12 12 19 10 12Z"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21"/>',
  back: '<path d="M12 4v15M7.5 19.5h9M5 8h14"/><path d="M5 8 2.5 14h5L5 8M19 8l-2.5 6h5L19 8"/><circle cx="12" cy="3.6" r="1.2"/>',
};
// (30 Oct) the materials' marks (data.js AF.MATS)
AF.MAT_IC = {
  soul: '<path d="M9 3.5h6M10.5 3.5v2M13.5 3.5v2"/><path d="M8 5.5h8l1.2 3v9l-1.2 3H8l-1.2-3v-9Z"/><path d="M12 10.2c1.7 1.6 1.7 3.8 0 5.6-1.7-1.8-1.7-4 0-5.6Z"/>',
  ingot: '<path d="M4.5 15.5 7.5 9h9l3 6.5Z"/><path d="M4.5 15.5v3h15v-3M7.5 9l1.2-3.2h6.6L16.5 9"/><path d="M10 12h4"/>',
  contract: '<path d="M7 4h9a2 2 0 0 1 2 2v12H9a2 2 0 0 1-2-2Z"/><path d="M5 6.5a2 2 0 0 1 2-2.5M10 8h5M10 11h5M10 14h2.5"/><circle cx="15.6" cy="16.4" r="2.1"/>',
  crown: '<path d="M4 17 5.8 8l4.2 4 2-6.5 2 6.5 4.2-4L20 17Z"/><path d="M4 20h16"/><circle cx="12" cy="13.5" r="1.1"/>',
};
// rarity metals: [dark, mid, light]; Mythic is a rainbow rim
const METAL = [["#4a2c12", "#b8743a", "#f4c28a"], ["#3e4658", "#b8c4d8", "#ffffff"], ["#2e1458", "#9a70d8", "#f2e4ff"], ["#5a3806", "#e0aa3c", "#fff2b0"], ["#2a1a3a", "#d8c8ff", "#ffffff"]];
const BACK = ["#3a2a12", "#a88a4a", "#f0dca0"];
const imgs = {};
// the emblem as an image (an SVG drawn once per kind and colour); cb runs when it has loaded
function emblem(k, col, cb) {
  const key = k + col;
  let e = imgs[key];
  if (!e) {
    e = imgs[key] = { img: new Image(), ok: false, wait: [] };
    e.img.onload = () => { e.ok = true; e.wait.splice(0).forEach(f => f()); };
    e.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="${col}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${AF.RELIC_IC[k]}</svg>`);
  }
  if (!e.ok && cb) e.wait.push(cb);
  return e.ok ? e.img : null;
}
// draws the coin of kind k, rarity r (r < 0: the back) onto a 2D context of size S
function paint(x, k, r, S, again, ang = 0) {
  const c = S / 2, R = S * 0.48, back = r < 0, M = back ? BACK : METAL[r];
  x.clearRect(0, 0, S, S);
  // the rim
  let g;
  if (r === 4) { g = x.createConicGradient ? x.createConicGradient(ang, c, c) : null; if (g) ["#ff5a6a", "#ffd23a", "#5aff9a", "#4ad8ff", "#a87aff", "#ff5ad8", "#ff5a6a"].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col)); }
  if (!g) { g = x.createLinearGradient(c - R, c - R, c + R, c + R); g.addColorStop(0, M[2]); g.addColorStop(0.45, M[1]); g.addColorStop(1, M[0]); }
  x.fillStyle = g; x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.fill();
  // a thin dark line round the outside and a bevel just inside it
  x.lineWidth = S * 0.012; x.strokeStyle = "rgba(0,0,0,.45)"; x.stroke();
  x.lineWidth = S * 0.02; x.strokeStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.arc(c, c, R * 0.93, Math.PI * 0.9, Math.PI * 1.75); x.stroke();
  // the sunk field
  const f = x.createRadialGradient(c - R * 0.25, c - R * 0.3, R * 0.1, c, c, R * 0.8);
  f.addColorStop(0, M[1]); f.addColorStop(1, M[0]);
  x.fillStyle = f; x.beginPath(); x.arc(c, c, R * 0.78, 0, Math.PI * 2); x.fill();
  x.lineWidth = S * 0.016; x.strokeStyle = "rgba(0,0,0,.35)"; x.stroke();
  // the dotted ring between rim and field
  x.fillStyle = r === 4 ? "#ffffff" : M[2];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; x.beginPath(); x.arc(c + Math.cos(a) * R * 0.86, c + Math.sin(a) * R * 0.86, S * 0.009, 0, Math.PI * 2); x.fill(); }
  // the emblem, struck: a dark shadow under it, then the bright metal
  const kk = back ? "back" : k, lo = emblem(kk, "#1a0e06", again), hi = emblem(kk, r === 4 ? "#ffffff" : M[2], again);
  const E = R * 1.08, ex = c - E / 2, ey = c - E / 2;
  if (lo) x.drawImage(lo, ex + S * 0.012, ey + S * 0.016, E, E);
  if (hi) x.drawImage(hi, ex, ey, E, E);
  // a sheen across the top left
  const s = x.createLinearGradient(c - R, c - R, c + R * 0.2, c + R * 0.2);
  s.addColorStop(0, "rgba(255,255,255,.32)"); s.addColorStop(0.5, "rgba(255,255,255,0)");
  x.fillStyle = s; x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.fill();
}
// (31 Oct, "the rainbow color on the mythic coins should be rotating around"): Mythic coins on the page and in the
// world are repainted with the rainbow turning
const spin = new Set();
let spinRaf = 0, spinLast = 0;
function spinLoop(ms) {
  spinRaf = 0;
  if (ms - spinLast > 32) {
    spinLast = ms;
    const ang = ms / 1000 * (Math.PI / 4), tl = AF.coin.texLive();
    for (const v of spin) {
      if (v.cv && !v.cv.isConnected) { spin.delete(v); continue; }
      if (v.tex && !tl) continue;
      paint(v.x, v.k, 4, v.S, null, ang);
      if (v.tex) v.tex.needsUpdate = true;
    }
  }
  // the world's textures keep it running only while coins are out (the island wakes it when they are)
  for (const v of spin) if (v.cv || AF.coin.texLive()) { spinRaf = requestAnimationFrame(spinLoop); break; }
}
const spinAdd = v => { spin.add(v); if (!spinRaf) spinRaf = requestAnimationFrame(spinLoop); };
AF.coin = {
  // onto a canvas element (the interface's coins): sized to the canvas, redrawn once the emblem loads
  draw(cv, k, r) {
    const S = cv.width = cv.height = 192, x = cv.getContext("2d");
    const go = () => paint(x, k, r, S, go); go();
    if (r === 4) { for (const v of spin) if (v.cv === cv) spin.delete(v); spinAdd({ cv, x, k, S }); }
  },
  // a three.js texture of the coin's face (r < 0: the back), cached per kind and rarity
  texture: (() => {
    const cache = {};
    return (k, r) => {
      const key = k + ":" + r;
      if (cache[key]) return cache[key];
      const cv = document.createElement("canvas"); cv.width = cv.height = 256;
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      const go = () => { paint(cv.getContext("2d"), k, r, 256, go); t.needsUpdate = true; }; go();
      if (r === 4) spinAdd({ x: cv.getContext("2d"), k, S: 256, tex: t });
      return (cache[key] = t);
    };
  })(),
  METAL,
  texLive: () => false,
  wake: () => { if (!spinRaf && spin.size) spinRaf = requestAnimationFrame(spinLoop); },
};

// the trader behind the stall: a travelling merchant in a wide hat and a long coat, a monocle, a scarf in the wind,
// a pack on his back (drawn only)
AF.UNIT["@merchant"] = {
  key: "@merchant", name: "The Merchant", rarity: "legendary", base: 0, idx: -1, draw: true,
  look: { skin: 0xe8b88a, hairC: 0x8a8a92, hairC2: 0xa8a8b0, hair: "short", top: 0x5a2a1a, sleeve: 0x5a2a1a, pants: 0x2a2a30, boot: 0x3a2414, glove: 0x8a5a2a,
    face: { eye: 0x2a1a0a, mouth: "grin", brow: 0.1, browC: 0x8a8a92 } },
  acc: [["wideHat", { c: 0x3a2414 }], ["coat", { c: 0x4a2414 }], ["scarf", { c: 0xd8a84a, c2: 0xa8341a }], ["monocle", { c: 0xffd76a }], ["beard", { c: 0xa8a8b0 }], ["backpack", { c: 0x6a4a2a }]],
  pose: { pose: "show" }, scale: 1.0,
  fx: [],
  rim: [0xffd76a, 0xa8341a],
};
})();

// ---------------- (31 Oct, "these materials need a real model not just icon") the materials as 3D models ----------------
(function () {
const T = THREE, AF = window.AF, K = AF.kit, PI = Math.PI;
const IRON = 0x3a3f4a, IRON2 = 0x23262e, GOLD = 0xe8b54a, GOLD2 = 0xb07a22;
// each builder fills g and returns a step(t) for its moving parts
const BUILD = {
  soul(g) {
    K.mesh(g, K.cyl(0.42, 0.48, 0.16, 8), IRON2, 0, -0.62, 0);
    K.mesh(g, K.cyl(0.36, 0.36, 0.08, 8), IRON, 0, -0.5, 0);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.box(g, 0.07, 0.95, 0.07, IRON, x * 0.25, -0.02, z * 0.25);
    K.mesh(g, K.cyl(0.36, 0.36, 0.07, 8), IRON, 0, 0.47, 0);
    K.mesh(g, K.cone(0.42, 0.32, 4), IRON2, 0, 0.66, 0, { ry: PI / 4 });
    K.mesh(g, K.ring(0.15, 0.035, 6, 20), IRON, 0, 0.92, 0);
    // the glass and the soul inside it
    const gl = K.box(g, 0.46, 0.86, 0.46, 0x9ef4ff, 0, -0.02, 0, { glow: 2, own: true }); gl.material.opacity = 0.22;
    const f = K.pivot(g, 0, -0.3, 0);
    K.mesh(f, K.ball(0.12, 1), 0x4ad8ff, 0, 0.06, 0, { glow: 1 });
    K.mesh(f, K.cone(0.12, 0.42, 7), 0x4ad8ff, 0, 0.32, 0, { glow: 1 });
    K.mesh(f, K.cone(0.07, 0.3, 6), 0xd8fbff, 0, 0.22, 0.03, { glow: 1 });
    const licks = [-1, 1].map(sd => K.mesh(f, K.cone(0.05, 0.2, 5), 0x7de8ff, sd * 0.09, 0.2, 0, { glow: 1, rz: -sd * 0.35 }));
    const w = [0, 1].map(() => K.mesh(g, K.ball(0.035, 0), 0xd8fbff, 0, 0, 0, { glow: 1 }));
    return t => {
      f.scale.set(1 + Math.sin(t * 9) * 0.06, 1 + Math.sin(t * 7.3) * 0.12, 1 + Math.sin(t * 9) * 0.06);
      f.rotation.z = Math.sin(t * 5.1) * 0.06;
      licks.forEach((l, i) => { l.scale.y = 0.8 + Math.sin(t * 11 + i * 2) * 0.3; });
      w.forEach((m, i) => { const a = t * 2.2 + i * PI; m.position.set(Math.cos(a) * 0.15, -0.05 + Math.sin(t * 3 + i) * 0.14, Math.sin(a) * 0.15); });
    };
  },
  ingot(g) {
    // an ingot: a frustum with sloped sides, long and low; molten seam and a stamp on its top
    const bar = (x, y, z, ry) => {
      const p = K.pivot(g, x, y, z); p.rotation.y = ry;
      const geo = K.cyl(0.36, 0.5, 0.5, 4); geo.rotateY(PI / 4);
      const b = K.mesh(p, geo, 0x6a4a40, 0, 0, 0, { inkScale: 1.06 }); b.scale.set(1.55, 0.5, 0.62);
      K.box(p, 0.64, 0.012, 0.08, 0xff8a2a, 0, 0.128, 0, { glow: 1, ink: false });
      K.box(p, 0.1, 0.014, 0.1, 0xffd06a, 0.18, 0.13, 0, { glow: 1, ink: false, ry: PI / 4 });
      return p;
    };
    bar(0, -0.13, -0.24, 0); bar(0, -0.13, 0.24, 0);
    bar(0, 0.13, 0, PI / 2 + 0.12);
    g.scale.setScalar(1.25);
    // the heat under them
    const h = K.mesh(g, new T.CircleGeometry(0.75, 24), 0xff5a1a, 0, -0.27, 0, { glow: 2, rx: -PI / 2 });
    h.material = h.material.clone(); h.material.opacity = 0.35;
    const sp = Array.from({ length: 7 }, (_, i) => K.mesh(g, new T.BoxGeometry(0.045, 0.045, 0.045), i % 2 ? 0xffb04a : 0xff6a2a, 0, 0, 0, { glow: 1 }));
    return t => sp.forEach((m, i) => {
      const k = (t * 0.45 + i / 7) % 1;
      m.position.set(Math.sin(i * 2.4) * 0.45 + Math.sin(t + i) * 0.06, 0.24 + k * 0.7, Math.cos(i * 2.4) * 0.3);
      m.scale.setScalar(1 - k); m.rotation.set(t * 3 + i, t * 2, 0);
    });
  },
  contract(g) {
    const s = K.pivot(g, 0, 0, 0); s.rotation.set(-0.25, 0.35, 0.12);
    K.box(s, 0.86, 1.14, 0.03, 0x2e2440, 0, 0, 0, { ink: 0.02 });
    // the rollers, with gold caps
    for (const y of [0.6, -0.6]) {
      K.mesh(s, K.cyl(0.09, 0.09, 1.0, 10), 0x1a1224, 0, y, 0.02, { rz: PI / 2, inkScale: 1.1 });
      for (const x of [-0.54, 0.54]) K.mesh(s, K.cyl(0.12, 0.12, 0.08, 10), GOLD, x, y, 0.02, { rz: PI / 2 });
    }
    // the script: glowing violet lines
    const lines = [];
    for (let i = 0; i < 6; i++) lines.push(K.box(s, i === 5 ? 0.34 : 0.62 - (i % 3) * 0.08, 0.035, 0.01, 0xc89aff, i === 5 ? -0.14 : -0.02 - (i % 3) * 0.04, 0.4 - i * 0.13, 0.025, { glow: 1, ink: false }));
    // the seal
    K.mesh(s, K.cyl(0.16, 0.17, 0.05, 12), 0x8a1020, 0.2, -0.34, 0.04, { rx: PI / 2, inkScale: 1.1 });
    const mark = K.mesh(s, K.ring(0.08, 0.015, 4, 16), 0xff6aa0, 0.2, -0.34, 0.075, { glow: 1 });
    return t => { mark.scale.setScalar(1 + Math.sin(t * 3) * 0.12); s.position.y = Math.sin(t * 1.4) * 0.03; };
  },
  crown(g) {
    const bandGeo = new T.CylinderGeometry(0.56, 0.5, 0.34, 12, 1, true), m = K.mat(GOLD, 0, true); m.side = T.DoubleSide;
    const band = new T.Mesh(bandGeo, m); band.position.y = -0.3; g.add(band);
    const inkB = new T.Mesh(bandGeo, new T.MeshBasicMaterial({ color: 0x07070a, side: T.BackSide })); inkB.scale.set(1.06, 1.08, 1.06); band.add(inkB);
    K.mesh(g, K.ring(0.56, 0.05, 6, 24), GOLD2, 0, -0.13, 0, { rx: PI / 2 });
    K.mesh(g, K.ring(0.5, 0.05, 6, 24), GOLD2, 0, -0.47, 0, { rx: PI / 2 });
    const tips = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + PI / 6, x = Math.sin(a) * 0.54, z = Math.cos(a) * 0.54;
      K.mesh(g, K.cone(0.13, 0.5, 4), GOLD, x, 0.1, z, { ry: -a + PI / 4 });
      K.mesh(g, K.ball(0.075, 0), 0xd81a2a, Math.sin(a) * 0.58, -0.3, Math.cos(a) * 0.58, { inkScale: 1.2 });
      const e = K.mesh(g, K.ball(0.07, 1), 0xff8a2a, x, 0.42, z, { glow: 1 });
      K.mesh(e, K.ball(0.035, 0), 0xfff0a0, 0, 0.01, 0, { glow: 1 });
      K.mesh(e, K.cone(0.05, 0.16, 5), 0xffb03a, 0, 0.1, 0, { glow: 1 });
      tips.push(e);
    }
    return t => tips.forEach((e, i) => { const k = 1 + Math.sin(t * 8 + i * 1.7) * 0.18; e.scale.set(k, k * 1.25, k); });
  },
};
// one renderer for every material card; each model has its own little scene
const SZ = 256, scenes = {};
let rr = null;
function scene(id) {
  if (scenes[id]) return scenes[id];
  const S = new T.Scene(), g = new T.Group(), col = new T.Color(AF.MAT[id].c);
  S.add(new T.HemisphereLight(0xfff4e6, 0x2a1c14, 1.2));
  const k = new T.DirectionalLight(0xffffff, 2.4); k.position.set(-3, 6, 5); S.add(k);
  const r1 = new T.DirectionalLight(col, 2.2); r1.position.set(4, 2, -5); S.add(r1);
  const step = BUILD[id](g);
  g.rotation.x = 0.12; S.add(g);
  const cam = new T.PerspectiveCamera(30, 1, 0.1, 20); cam.position.set(0, 0.5, 4.5); cam.lookAt(0, 0.04, 0);
  return (scenes[id] = { S, g, cam, step });
}
function render(id, t, ctx, turn) {
  if (!rr) { rr = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); rr.setPixelRatio(1); rr.setSize(SZ, SZ, false); rr.outputColorSpace = T.SRGBColorSpace; rr.setClearColor(0, 0); }
  const s = scene(id);
  s.g.rotation.y = turn; s.g.position.y = Math.sin(t * 1.6) * 0.04; s.step(t);
  rr.render(s.S, s.cam);
  ctx.clearRect(0, 0, SZ, SZ); ctx.drawImage(rr.domElement, 0, 0);
}
const live = new Set(), stills = {};
let raf = 0;
function loop(ms) {
  raf = 0;
  const t = ms / 1000;
  for (const v of live) {
    if (!v.cv.isConnected) { live.delete(v); continue; }
    // a slow sway that keeps its front to you, half a turn either way
    render(v.id, t + v.ph, v.ctx, -0.5 + Math.sin(t * 0.6 + v.ph) * 0.7);
  }
  if (live.size) raf = requestAnimationFrame(loop);
}
AF.matArt = {
  live(cv, id) {
    if (!BUILD[id]) return;
    cv.width = cv.height = SZ;
    live.add({ cv, id, ctx: cv.getContext("2d"), ph: Math.random() * 10 });
    if (!raf) raf = requestAnimationFrame(loop);
  },
  // a still picture (a data URL), for small places
  still(id) {
    if (stills[id] || !BUILD[id]) return stills[id] || "";
    const cv = document.createElement("canvas"); cv.width = cv.height = SZ;
    try { render(id, 1.3, cv.getContext("2d"), -0.45); stills[id] = cv.toDataURL(); } catch (e) { return ""; }
    return stills[id];
  },
};
})();
