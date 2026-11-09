/* Aura Farm Defense: how each world looks. (29 Oct, request: "you can add however many worlds you were planning on
   with the same style just different theme. The last one should be really insane and probably space themed")
   board.js builds every board from Hollowbrook's recipe; a theme here hands it the colours and light, how the land
   rises outside the play area, what grows out there, the looks of the props (js/tdmaps.js places them), set pieces,
   weather, and the enemies' models with the colours they break into. Everything is the village's toon style: flat
   bands of light, ink outlines, and only what is meant to glow brighter than white. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit;
const { box, pivot, mesh, cone, cyl, ball } = K;
const PI = Math.PI, TAU = PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, max = Math.max, min = Math.min;
const smooth = K.smooth;
const Wd = AF.WORLDS = { PROP: {}, FOES: {}, DEATH: {}, SHELL: {}, KINDS: {} };
const P = Wd.PROP, F = Wd.FOES;

// ---------------- helpers ----------------
// unlit colour times k: past 1 it blooms. Shared per colour, so the board can bake them into one mesh
const hotCache = {};
function hotMat(hex, k = 2, a = 1, add = false) {
  const key = `${hex}|${k}|${a}|${add}`;
  if (hotCache[key]) return hotCache[key];
  const m = new T.MeshBasicMaterial({ color: hex, transparent: a < 1 || add, opacity: a, depthWrite: a >= 1 && !add,
    blending: add ? T.AdditiveBlending : T.NormalBlending, side: add ? T.DoubleSide : T.FrontSide });
  m.color.multiplyScalar(k);
  return (hotCache[key] = m);
}
// o: a (opacity), add (additive), own (a material of its own, for parts whose colour or opacity animates), side
function hot(parent, geo, hex, k = 2, x = 0, y = 0, z = 0, o = {}) {
  let mt = hotMat(hex, k, o.a == null ? 1 : o.a, !!o.add);
  if (o.own) { mt = mt.clone(); mt.userData.board = true; }
  if (o.side) { if (!o.own) { mt = mt.clone(); mt.userData.board = true; } mt.side = o.side; }
  const m = new T.Mesh(geo, mt);
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
  parent.add(m);
  return m;
}
const hbox = (p, w, h, d, hex, k, x, y, z, o) => hot(p, new T.BoxGeometry(w, h, d), hex, k, x, y, z, o);
Wd.hotMat = hotMat; Wd.hot = hot;
// the camera looks down along (16, 30, 28): something at height y shows over ground point (gx, gz) when put here
// (30 Oct) the match camera can be turned (board.js B.camXZ), so "under" follows it
Wd.under = (gx, gz, y) => { const [ox, oz] = AF.Board && AF.Board.camXZ ? AF.Board.camXZ() : [16 / 30, 28 / 30]; return [gx + y * ox, y, gz + y * oz]; };
// the ground point that shows r across and u up from the middle of the screen (units on screen; ground seen at a
// slant is squashed to 0.68 of its length up the screen)
const onScr = (r, u) => [0.868 * r - 0.496 * (u / 0.68), -0.496 * r - 0.868 * (u / 0.68)];
// how far toward the camera a ground point is (tall things there would stand in front of the board)
const near = (x, z) => (16 * x + 28 * z) / 32.25;
// parts that move after the scenery is baked go in a pivot of their own, listed here
const mv = (g, o) => { (g.userData.moving = g.userData.moving || []).push(o); return o; };
// a point inside a prop the weather comes out of (sparks off a fire, bubbles in lava)
function emit(g, C, kind, x, y, z) { g.updateMatrixWorld(true); const p = g.localToWorld(new T.Vector3(x, y, z)); C.emitters.push({ kind, x: p.x, y: p.y, z: p.z }); }
// a flame that flickers: an outer cone and a white-hot core
function flame(g, C, x, y, z, s = 1, col = 0xff7a1a, core = 0xffd36a) {
  const p = pivot(g, x, y, z), f = pivot(p), ph = C.rand() * 9;
  hot(f, cone(0.15 * s, 0.46 * s, 6), col, 2.4, 0, 0.23 * s, 0);
  hot(f, cone(0.08 * s, 0.28 * s, 6), core, 3.4, 0, 0.15 * s, 0.015 * s);
  C.anim(t => { f.scale.set(1 + sin(t * 17 + ph) * 0.1, 1 + sin(t * 11 + ph) * 0.2 + sin(t * 29 + ph) * 0.07, 1 + sin(t * 13 + ph) * 0.1); f.rotation.y = t * 3 + ph; });
  mv(g, p);
  return p;
}
// the swirl the enemies come out of: a disc and a broken ring turning against it
function portal(g, C, col, y = 1, r = 0.85, sy = 1.25) {
  const p = pivot(g, 0, y, 0); p.scale.y = sy;
  const a = hot(p, new T.CircleGeometry(r, 32), col, 1.5, 0, 0, 0, { own: 1, a: 0.65, side: T.DoubleSide });
  const b = hot(p, new T.RingGeometry(r * 0.35, r * 0.95, 32, 1, 0, PI * 1.4), 0xffffff, 1.3, 0, 0, 0.01, { own: 1, a: 0.3, add: true });
  C.anim(t => { a.material.opacity = 0.55 + sin(t * 2.5) * 0.2; a.rotation.z = t * 0.5; b.rotation.z = -t * 1.7; });
  mv(g, p);
  return p;
}
// a light that blinks
function blink(g, C, x, y, z, r, hex, k = 3, rate = 1.6) {
  const p = pivot(g, x, y, z), m = hot(p, ball(r, 1), hex, k, 0, 0, 0, { own: 1 }), ph = C.rand() * 6;
  C.anim(t => { const on = (t * rate + ph) % 1 < 0.5; m.visible = on; });
  mv(g, p);
  return p;
}
const legs = (g, c, x, h, z = 0, wdt = 0.16) => [-1, 1].map(s => { const l = pivot(g, s * x, h, z); box(l, wdt, h, wdt * 1.1, c, 0, -h / 2, 0); return l; });
const flap = (b, c, w, d, x, y, z = 0, o = {}) => [-1, 1].map(s => { const p = pivot(b, s * x, y, z); (o.hot ? hbox(p, w, 0.05, d, c, o.hot, s * w / 2, 0, 0) : box(p, w, 0.06, d, c, s * w / 2, 0, 0, { ink: 0.015 })); return p; });
const gableRoof = (g, w, d, y, col, end) => { const R = d / Math.sqrt(3); const e = mesh(g, cyl(R, R, w, 3), end, 0, y + R / 2, 0); e.rotation.set(-PI / 2, 0, -PI / 2);
  for (const s of [1, -1]) box(g, w + 0.36, 0.14, d + 0.3, col, 0, y + 0.75 * R + 0.035, s * (d / 4 + 0.06), { rx: s * PI / 3 }); };
const rocks = (g, C, n, r, col, s = 0.3, y = 0.1) => { for (let k = 0; k < n; k++) { const a = (k / n) * TAU + C.rand() * 0.4; mesh(g, ball(s * (0.7 + C.rand() * 0.6), 0), col, cos(a) * r, y, sin(a) * r, { ry: C.rand() * 3 }).scale.y = 0.65; } };
const ramp = () => K.mat(0xffffff).gradientMap;
// the weather all comes out of the particle system; these are its usual drifts
function drift(V, add, x, y, z, vx, vy, vz, life, s0, s1, cell, hex, k, a, spin = 0) { V.put(add, x, y, z, vx, vy, vz, life, 0, 0, s0, s1, cell, 0, V.lin(hex, k), a, Math.random() * TAU, spin); }
// a random ground point roughly on screen
const onScreen = () => [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 34];
// sparks, bubbles and wisps out of the props that make them
function emitters(C, V, dt) {
  for (const e of C.emitters) {
    if (e.kind === "spark" && Math.random() < dt * 9) drift(V, true, e.x + (Math.random() - 0.5) * 0.2, e.y, e.z + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.4, 1.2 + Math.random(), (Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.6, 0.06, 0.02, V.CELL.hot, 0xff9a3a, 2.6, 1);
    else if (e.kind === "bubble" && Math.random() < dt * 3) { const a = Math.random() * TAU, r = Math.random() * 1.1; V.burst(true, e.x + cos(a) * r, e.y, e.z + sin(a) * r, 5, { cols: [0xffb04a, 0xff6a1a], speed: [0.4, 1.4], up: 1.2, life: [0.4, 0.7], size: [0.08, 0.02], cell: V.CELL.hot, k: 2.4, grav: 4 }); }
    else if (e.kind === "wisp" && Math.random() < dt * 2.5) drift(V, true, e.x + (Math.random() - 0.5), e.y, e.z + (Math.random() - 0.5), (Math.random() - 0.5) * 0.3, 0.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3, 2 + Math.random() * 1.5, 0.14, 0.04, V.CELL.hot, 0x9a6aff, 2, 0.9);
    else if (e.kind === "glint" && Math.random() < dt * 6) drift(V, true, e.x + (Math.random() - 0.5) * 2.4, e.y + (Math.random() - 0.5) * 2, e.z + (Math.random() - 0.5) * 2.4, 0, 0.3, 0, 0.7, 0.2, 0, V.CELL.star, 0xfff0c0, 2.6, 1, 2);
    else if (e.kind === "smoke" && Math.random() < dt * 4) drift(V, false, e.x, e.y, e.z, 0.3 + Math.random() * 0.2, 0.9 + Math.random() * 0.4, -0.15, 2.4 + Math.random(), 0.3, 1.1, V.CELL.smoke, 0x4a4040, 1, 0.45, 0.6);
  }
}

// ---------------- the shared instanced pieces (outside the play area) ----------------
// [geometry, ink scale (0 = none), casts shadow, glows]
Object.assign(Wd.KINDS, {
  palm: [() => new T.CylinderGeometry(0.1, 0.15, 1, 6)],
  frond: [() => { const g = new T.BoxGeometry(1, 0.05, 0.3); g.translate(0.5, 0, 0); return g; }, 1.05],
  cactus: [() => new T.CylinderGeometry(0.2, 0.23, 1, 8)],
  shrub: [() => new T.IcosahedronGeometry(0.5, 0)],
  rock: [() => new T.IcosahedronGeometry(0.5, 0)],
  mesa: [() => new T.CylinderGeometry(1, 1.15, 1, 7)],
  snowcap: [() => new T.ConeGeometry(0.62, 0.95, 7), 0],
  branch: [() => { const g = new T.CylinderGeometry(0.055, 0.1, 1, 5); g.translate(0, 0.5, 0); return g; }],
  slab: [() => new T.BoxGeometry(1, 1, 1)],
  shroom: [() => new T.SphereGeometry(0.5, 8, 5, 0, TAU, 0, PI / 2), 0, false, true],
  column: [() => new T.CylinderGeometry(0.5, 0.5, 1, 6)],
  shard: [() => new T.OctahedronGeometry(0.5, 0), 0, false, true],
  block: [() => new T.BoxGeometry(1, 1, 1), 1.02],
  lit: [() => new T.BoxGeometry(1, 1, 1), 0, false, true],
});
const put = (C, kind, it, bx, bz) => C.put(kind, it, bx, bz);
function palmItem(C, x, z, s) {
  const lean = (C.rand() - 0.5) * 0.5, h = (2.2 + C.rand() * 0.8) * s;
  for (let k = 0; k < 4; k++) put(C, "palm", { x: x + lean * k * 0.28 * s, y: (k + 0.5) * h / 4, z, sx: s * (1 - k * 0.1), sy: h / 4 + 0.02, sz: s * (1 - k * 0.1), rz: -lean * 0.4, c: k % 2 ? 0x8a6a48 : 0x7a5a3a }, x, z);
  const tx = x + lean * 1.1 * s, ty = h;
  for (let k = 0; k < 7; k++) put(C, "frond", { x: tx, y: ty, z, sx: 1.3 * s, sy: s, sz: s, ry: (k / 7) * TAU + C.rand() * 0.3, rz: -0.45 - C.rand() * 0.3, c: [0x3f8f3a, 0x4fa045, 0x357a32][k % 3] }, x, z);
}
function cactusItem(C, x, z, s) {
  const h = (1.1 + C.rand() * 0.9) * s, col = [0x4a9a4a, 0x3f8a42, 0x56a650][(C.rand() * 3) | 0];
  put(C, "cactus", { x, y: h / 2, z, sx: s, sy: h, sz: s, c: col }, x, z);
  const arms = (C.rand() * 3) | 0;
  for (let k = 0; k < arms; k++) {
    const sd = k ? -1 : 1, ay = h * (0.45 + C.rand() * 0.25), ah = h * 0.4, a = C.rand() * TAU;
    const ox = cos(a) * 0.32 * s * sd, oz = sin(a) * 0.32 * s * sd;
    put(C, "cactus", { x: x + ox * 0.6, y: ay, z: z + oz * 0.6, sx: s * 0.6, sy: 0.4 * s, sz: s * 0.6, rz: PI / 2, ry: -a, c: col }, x, z);
    put(C, "cactus", { x: x + ox, y: ay + ah / 2, z: z + oz, sx: s * 0.62, sy: ah, sz: s * 0.62, c: col }, x, z);
  }
}
function deadTreeItem(C, x, z, s, col = 0x4a3a34) {
  const h = (1.4 + C.rand() * 0.8) * s;
  put(C, "branch", { x, y: 0, z, sx: s * 1.8, sy: h, sz: s * 1.8, rz: (C.rand() - 0.5) * 0.2, c: col }, x, z);
  for (let k = 0; k < 4; k++) put(C, "branch", { x, y: h * (0.5 + k * 0.13), z, sx: s * 0.9, sy: h * (0.55 - k * 0.07), sz: s * 0.9, ry: (k / 4) * TAU + C.rand(), rz: 0.7 + C.rand() * 0.4, c: col }, x, z);
}
function snowPineItem(C, x, z, s) {
  const h = (0.9 + C.rand() * 0.3) * s;
  C.put("trunk", { x, y: h / 2, z, sx: s, sy: h, sz: s, c: 0x5a4030 }, x, z);
  for (let k = 0; k < 3; k++) {
    const y = h * 0.75 + k * 0.48 * s, sc = s * (1.15 - k * 0.27), ry = C.rand() * 3;
    C.put("pine", { x, y, z, s: sc, ry, c: [0x2f5a48, 0x2a5040, 0x355f4c][k] }, x, z);
    C.put("snowcap", { x, y: y + 0.16 * sc, z, s: sc * 0.82, sy: sc * 0.6, ry, c: 0xf4f8ff }, x, z);
  }
}

// ======================= the worlds =======================
// fog colour (the stage behind the canvas is the same); fog start and end (none in space); hemisphere and sun
// light; ground colours (two greens, the low patches, worn ground by the road); road colours; lights = extra point
// lights [colour, strength, x, y, z, reach]
Wd.village = {
  fog: 0xb4cfbc, fogNear: 82, fogFar: 112, hemi: [0xe8f4ff, 0x4f6a3a, 1.05], sun: [0xfff0d8, 2.25],
  ground: { a: 0x5f9f48, b: 0x7cb85a, low: 0x4c8a3b, worn: 0x8fa25a }, hills: 1.6,
  road: { dirt: 0xc2a574, edge: 0x9c8458, pebbles: [0x9a9ea6, 0x868a92] },
  tufts: [0x4c8a3b, 0x3f7a35], flowers: [0xff5a6a, 0xffd23a, 0xffffff, 0xff8ac8, 0xb08aff],
  fill: (x, z, o, C) => C.tree(x, z, 1.1 + C.rand() * 0.7, C.rand() < 0.35 ? "pine" : "tree"),
};

// ---------------- 2: Gullport, the harbour ----------------
const shoreZ = x => 9.8 + sin(x * 0.21) * 0.6 + sin(x * 0.067 + 1) * 0.6, shoreX = z => 17 + sin(z * 0.3) * 1.0;
const sea = (x, z) => max(z - shoreZ(x), x - shoreX(z));
Wd.harbor = {
  fog: 0xb6d8e2, fogNear: 84, fogFar: 114, hemi: [0xeef8ff, 0x5a7a5a, 1.1], sun: [0xfff4e0, 2.3],
  ground: { a: 0x6aa84f, b: 0x86bd62, low: 0x58944a, worn: 0xb8b07a }, hills: 1.5,
  road: { dirt: 0xb8a07a, edge: 0x8a7656, pebbles: [0xa8a49a, 0x8f8b82] },
  tufts: [0x5a944a, 0x4c8a3b], flowers: null,
  height: (x, z, C) => { const s = sea(x, z); return s > 0 ? -smooth(0, 2.6, s) * 1.5 : C.baseLift(x, z) * smooth(0, 3, -s); },
  tint: (c, x, z, n, rd, h, C) => { const s = sea(x, z); if (s > -2.6) c.lerp(C.c2.set(0xe8d6a0), smooth(-2.6, -0.8, s)); if (s > 0) c.lerp(C.c2.set(0x3a8a8a), smooth(0, 2.4, s)); },
  fill(x, z, o, C) {
    if (sea(x, z) > -1.6) { if (sea(x, z) < -0.2 && C.rand() < 0.2) put(C, "rock", { x, y: 0.12, z, s: 0.4 + C.rand() * 0.4, ry: C.rand() * 3, c: 0x9a9890 }, x, z); return; }
    C.tree(x, z, 1.1 + C.rand() * 0.6, C.rand() < 0.5 ? "pine" : "tree");
  },
  lights: [],
  extras(C) {
    // the sea: a sheet of water over the sunken sand, foam along the beach, a pier, boats and buoys riding it
    const wgeo = new T.PlaneGeometry(160, 120, 1, 1); wgeo.rotateX(-PI / 2);
    const water = new T.Mesh(wgeo, C.own(new T.MeshBasicMaterial({ color: 0x2fa8c4, transparent: true, opacity: 0.8, depthWrite: false })));
    water.position.set(0, -0.32, 0); water.renderOrder = 1; C.world.add(water);
    C.anim(t => { const k = 0.95 + sin(t * 0.8) * 0.05; water.material.color.setRGB(0.03 * k, 0.4 * k, 0.55 * k); });
    const fv = [];
    for (let x = -60; x <= 18; x += 0.5) fv.push([x, shoreZ(x) + 0.1]);
    for (let z = shoreZ(18) - 0.4; z >= -40; z -= 0.5) fv.push([shoreX(z) + 0.1, z]);
    const pos = [], idx = [];
    fv.forEach(([x, z], i) => { pos.push(x, -0.3, z - 0.18, x, -0.3, z + 0.18); if (i) idx.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1); });
    const fg = new T.BufferGeometry(); fg.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); fg.setIndex(idx);
    const foam = new T.Mesh(fg, C.own(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, side: T.DoubleSide })));
    foam.renderOrder = 2; C.world.add(foam);
    C.anim(t => { foam.material.opacity = 0.45 + sin(t * 1.3) * 0.2; });
    // the pier: planks out over the water on posts, a lantern at the end
    const px = -3, z0 = shoreZ(px) - 0.6, pier = pivot(C.still, px, 0, z0);
    for (let k = 0; k < 16; k++) box(pier, 1.5, 0.08, 0.32, k % 2 ? 0x8a6a48 : 0x9a7a58, 0, 0.12, k * 0.36, { ink: 0.015 });
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) box(pier, 0.14, 1.2, 0.14, 0x5a4030, s * 0.7, -0.4, k * 1.7 + 0.2);
    box(pier, 0.1, 1.0, 0.1, 0x3a2a1c, 0.6, 0.6, 5.5); box(pier, 0.24, 0.3, 0.24, 0xffd98a, 0.6, 1.2, 5.5, { glow: 1, ink: 0.02 });
    // boats on the water and buoys, bobbing
    const bob = (g, ph, a) => C.anim(t => { g.position.y = -0.28 + sin(t * 1.4 + ph) * 0.05; g.rotation.z = sin(t * 1.1 + ph) * a; g.rotation.x = sin(t * 0.9 + ph) * a * 0.6; });
    [[6, 13.2, 0.4], [-11, 12.6, -0.3], [22, 2, 1.4], [-24, 12.5, 0.1]].forEach(([x, z, r], i) => {
      const g = pivot(C.world, x, -0.28, z); g.rotation.y = r; P.boat(pivot(g, 0, -0.1, 0), 0, i + 1, C, true); bob(g, i * 1.7, 0.05);
    });
    [[-8, 12], [2, 12.5], [12, 11.8], [20, -4], [-18, 12.4]].forEach(([x, z], i) => {
      const g = pivot(C.world, x, -0.28, z);
      mesh(g, cyl(0.22, 0.26, 0.4, 10), i % 2 ? 0xd84a3a : 0xf4efe2, 0, 0.1, 0); mesh(g, cone(0.2, 0.4, 8), i % 2 ? 0xf4efe2 : 0xd84a3a, 0, 0.5, 0);
      blink(g, C, 0, 0.75, 0, 0.06, 0xff5a3a, 3, 0.7); bob(g, i * 2.3, 0.12);
    });
  },
  weather(C, V) {
    return dt => {
      // the sun glinting off the sea
      for (let k = 0; k < 2; k++) if (Math.random() < dt * 14) {
        const [x, z] = onScreen(); if (sea(x, z) < 0.6) continue;
        drift(V, true, x, -0.25, z, 0, 0, 0, 0.5 + Math.random() * 0.4, 0.18, 0, V.CELL.star, 0xfff8e0, 2.2, 1, 3);
      }
      emitters(C, V, dt);
    };
  },
  props: {
    // a gate of two weathered posts, rope and a hanging sign, the swirl sea-green
    arch(g, look, i, C) {
      for (const s of [-1, 1]) { box(g, 0.42, 2.9, 0.42, 0x5a4030, s * 1.15, 1.45, 0); for (const y of [0.6, 1.6, 2.4]) mesh(g, cyl(0.27, 0.27, 0.1, 8), 0xc8b48a, s * 1.15, y, 0, { ink: false }); }
      box(g, 3.1, 0.3, 0.36, 0x6a4a32, 0, 2.95, 0);
      for (const s of [-1, 1]) { box(g, 0.03, 0.5, 0.03, 0x3a2a1c, s * 0.5, 2.55, 0.2, { ink: false }); }
      box(g, 1.3, 0.4, 0.06, 0x8a6a48, 0, 2.3, 0.2, { ink: 0.02 });
      for (const s of [-1, 1]) box(g, 0.24, 0.3, 0.24, 0xffd98a, s * 1.15, 2.6, 0.32, { glow: 1, ink: 0.02 });
      portal(g, C, 0x2ad8b0, 1.2, 0.85, 1.3);
    },
    lamp(g, look, i, C) {
      box(g, 0.14, 1.6, 0.14, 0x5a4030, 0, 0.8, 0); box(g, 0.5, 0.08, 0.08, 0x5a4030, 0.2, 1.55, 0, { ink: 0.015 });
      box(g, 0.02, 0.2, 0.02, 0x2a2a30, 0.4, 1.42, 0, { ink: false });
      box(g, 0.2, 0.26, 0.2, 0xffd98a, 0.4, 1.2, 0, { glow: 1, ink: 0.02 }); mesh(g, cone(0.17, 0.14, 4), 0x2a2d35, 0.4, 1.4, 0, { ry: PI / 4 });
    },
  },
};
P.fishhut = (g, look, i, C) => {
  const w = 2.2, d = 1.7, walls = [0x6a9ab8, 0xc8603f, 0x86ad6e][i % 3], roof = [0x3d5a6e, 0x8a3a2a, 0x4a6a3a][i % 3];
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.14, 0.5, 0.14, 0x4a3424, x * (w / 2 - 0.1), 0.25, z * (d / 2 - 0.1));
  box(g, w + 0.2, 0.12, d + 0.55, 0x8a6a48, 0, 0.5, 0.22);
  box(g, w, 1.2, d, walls, 0, 1.16, 0);
  for (let k = 0; k < 4; k++) box(g, w + 0.02, 0.03, d + 0.02, 0x2a2a30, 0, 0.8 + k * 0.26, 0, { ink: false });
  gableRoof(g, w, d, 1.76, roof, walls);
  box(g, 0.46, 0.8, 0.07, 0x5a3d28, -0.45, 0.96, d / 2 + 0.03, { ink: 0.02 });
  box(g, 0.42, 0.36, 0.06, 0xffd98a, 0.5, 1.25, d / 2 + 0.02, { glow: 1, ink: 0.02 });
  // a net drying on the side, fish on a line, a lantern by the door
  box(g, 0.05, 0.9, 1.3, 0x2f4a3a, w / 2 + 0.06, 1.1, 0, { ink: false });
  for (let k = 0; k < 4; k++) box(g, 0.06, 0.04, 1.32, 0x1e3328, w / 2 + 0.08, 0.75 + k * 0.22, 0, { ink: false });
  for (const s of [-1, 1]) box(g, 0.06, 0.9, 0.06, 0x4a3424, s * 0.75, 1.0, d / 2 + 0.42);
  box(g, 1.5, 0.03, 0.03, 0x3a2a1c, 0, 1.42, d / 2 + 0.42, { ink: false });
  for (let k = 0; k < 4; k++) box(g, 0.08, 0.22, 0.05, [0xffa04a, 0xc8d0d8][k % 2], -0.45 + k * 0.3, 1.28, d / 2 + 0.42, { ink: 0.012 });
  box(g, 0.2, 0.24, 0.2, 0xffc870, 0.1, 1.2, d / 2 + 0.12, { glow: 1, ink: 0.02 });
  box(g, 0.3, 0.7, 0.3, 0x8b8f96, -0.7, 2.3, -0.3); g.userData.chimney = [-0.7, 2.75, -0.3];
};
P.lighthouse = (g, look, i, C) => {
  rocks(g, C, 10, 1.35, 0x7d8288, 0.5, 0.15);
  mesh(g, cyl(1.3, 1.45, 0.5, 12), 0x9a9ea6, 0, 0.25, 0);
  const H = 5.6, top = 0.5 + H, R = y => 1.05 - ((y - 0.5) / H) * 0.36;
  for (let k = 0; k < 5; k++) mesh(g, cyl(R(0.5 + (k + 1) * H / 5), R(0.5 + k * H / 5), H / 5, 14), k % 2 ? 0xc0282a : 0xf4efe2, 0, 0.5 + (k + 0.5) * H / 5, 0);
  box(g, 0.5, 0.8, 0.1, 0x5a3d28, 0, 0.9, R(0.9) + 0.02, { ink: 0.02 });
  for (const y of [2.4, 3.6, 4.8]) box(g, 0.24, 0.32, 0.06, 0xffd98a, 0, y, R(y) + 0.01, { glow: 1, ink: 0.02 });
  mesh(g, cyl(0.98, 0.98, 0.16, 14), 0x2a2d35, 0, top + 0.08, 0);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; box(g, 0.04, 0.36, 0.04, 0x2a2d35, cos(a) * 0.92, top + 0.34, sin(a) * 0.92, { ink: false }); }
  mesh(g, new T.TorusGeometry(0.92, 0.03, 4, 24), 0x2a2d35, 0, top + 0.52, 0, { rx: PI / 2, ink: false });
  hot(g, cyl(0.5, 0.5, 0.8, 10), 0xfff0b0, 2.6, 0, top + 0.6, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; box(g, 0.05, 0.8, 0.05, 0x2a2d35, cos(a) * 0.52, top + 0.6, sin(a) * 0.52, { ink: false }); }
  mesh(g, cone(0.75, 0.7, 12), 0xc0282a, 0, top + 1.35, 0);
  box(g, 0.05, 0.4, 0.05, 0xd8b45a, 0, top + 1.85, 0, { ink: false });
  // the beam: two long soft cones, turning
  const bp = pivot(g, 0, top + 0.6, 0), spin = pivot(bp);
  for (const s of [1, -1]) hot(spin, new T.ConeGeometry(0.7, 9, 14, 1, true), 0xfff4c8, 1.1, s * 4.6, 0, 0, { a: 0.16, add: true, rz: s * PI / 2 });
  C.anim(t => { spin.rotation.y = t * 0.8; });
  mv(g, bp);
};
P.netrack = (g, look, i, C) => {
  for (const s of [-1, 1]) box(g, 0.12, 1.3, 0.12, 0x5a4030, s * 0.8, 0.65, 0);
  box(g, 1.8, 0.1, 0.1, 0x6a4a32, 0, 1.25, 0, { ink: 0.02 });
  box(g, 1.5, 0.9, 0.04, 0x3a5a48, 0, 0.82, 0, { ink: false });
  for (let k = 0; k < 6; k++) box(g, 0.03, 0.9, 0.06, 0x24382c, -0.62 + k * 0.25, 0.82, 0, { ink: false });
  for (let k = 0; k < 4; k++) box(g, 1.5, 0.03, 0.06, 0x24382c, 0, 0.45 + k * 0.25, 0, { ink: false });
  for (let k = 0; k < 4; k++) mesh(g, ball(0.08, 1), 0xff8a3a, -0.55 + k * 0.37, 0.38, 0.05, { ink: 0.015 });
};
// afloat = on the water (level), otherwise pulled up on the sand, leaning
P.boat = (g, look, i, C, afloat) => {
  const col = [0xc0402e, 0x3d6b9a, 0x3d8a6a, 0xd8a03a][i % 4], b = pivot(g, 0, 0.32, 0); if (!afloat) b.rotation.z = 0.12;
  box(b, 1.6, 0.42, 0.9, col, -0.1, 0, 0);
  box(b, 1.62, 0.08, 0.94, 0xf4efe2, -0.1, 0.22, 0, { ink: 0.02 });
  mesh(b, cone(0.47, 0.75, 4), col, 1.06, 0, 0, { rz: -PI / 2 }).scale.set(0.5, 1, 1);
  for (const x of [-0.5, 0.25]) box(b, 0.14, 0.06, 0.86, 0x8a6a48, x, 0.12, 0, { ink: 0.015 });
  box(b, 1.5, 0.05, 0.08, 0x8a6a48, 0, 0.3, 0.28, { ry: 0.25, rz: 0.08, ink: 0.015 });
  box(b, 0.32, 0.06, 0.16, 0x8a6a48, 0.82, 0.32, 0.48, { ry: 0.25, ink: 0.015 });
  if (afloat) { box(b, 0.08, 1.6, 0.08, 0x6a4a32, -0.2, 0.9, 0); box(b, 0.04, 1.1, 0.7, 0xf4efe2, -0.2, 1.0, 0.0, { rx: 0.1, ink: 0.015 }); }
};
P.anchor = (g, look, i, C) => {
  const a = pivot(g, 0, 0, 0); a.rotation.x = -0.35;
  box(a, 0.14, 1.3, 0.14, 0x3a3d45, 0, 0.75, 0);
  box(a, 0.7, 0.12, 0.14, 0x3a3d45, 0, 1.2, 0);
  mesh(a, new T.TorusGeometry(0.16, 0.05, 6, 12), 0x3a3d45, 0, 1.52, 0);
  for (const s of [-1, 1]) { box(a, 0.5, 0.13, 0.14, 0x3a3d45, s * 0.28, 0.16, 0, { rz: s * 0.5 }); mesh(a, cone(0.12, 0.26, 4), 0x3a3d45, s * 0.52, 0.36, 0, { rz: -s * 0.4 }); }
  for (let k = 0; k < 5; k++) mesh(g, new T.TorusGeometry(0.09, 0.03, 4, 8), 0x55585f, 0.2 + k * 0.17, 0.04, 0.3 + k * 0.05, { rx: (PI / 2) * (k % 2), ry: k });
};

// ---------------- 3: Sunscar Dunes, the desert ----------------
Wd.desert = {
  fog: 0xf0d6a4, fogNear: 84, fogFar: 114, hemi: [0xfff4dc, 0x8a6a3a, 1.15], sun: [0xffe8c0, 2.5],
  ground: { a: 0xe2b768, b: 0xeec67c, low: 0xd6a85a, worn: 0xd8b878 },
  height: (x, z, C) => { const o = C.outside(x, z); return max(0, smooth(1.2, 8, o) * smooth(2.5, 6, C.rdist(x, z)) * (0.55 + 0.45 * sin(x * 0.42 + sin(z * 0.31) * 1.8) + C.noise(x, z) * 0.35) * 2.6 * (1 - smooth(5, 14, near(x, z)) * 0.7)); },
  tint: (c, x, z, n, rd, h, C) => { c.offsetHSL(0, 0, sin(x * 1.3 + z * 0.6 + n * 3) * 0.018); if (h > 1.2) c.lerp(C.c2.set(0xf4d090), 0.3); },
  road: { dirt: 0xd8c095, edge: 0xa88a5e, pebbles: [0xc8b08a, 0xb09a72] },
  tufts: [0xb0a060, 0x9a8a50], tuftN: 900,
  fill(x, z, o, C) {
    const r = C.rand(), s = 0.9 + C.rand() * 0.6;
    if (o > 9 && r < 0.06 && near(x, z) < 0) { const h = 1.2 + C.rand() * 1.8, w = 1.2 + C.rand() * 1.2; for (let k = 0; k < 3; k++) put(C, "mesa", { x: x + (C.rand() - 0.5) * 0.3, y: h * (k + 0.5) / 3, z, sx: w * (1 - k * 0.12), sy: h / 3 + 0.02, sz: w * (0.8 - k * 0.1), ry: C.rand() * 3, c: [0xc8784a, 0xd88a58, 0xb86a40][k] }, x, z); return; }
    if (r < 0.42) cactusItem(C, x, z, s);
    else if (r < 0.6) put(C, "rock", { x, y: 0.15, z, s: 0.5 + C.rand() * 0.5, ry: C.rand() * 3, c: 0xc89a68 }, x, z);
    else if (r < 0.72) palmItem(C, x, z, s * 0.9);
    else put(C, "shrub", { x, y: 0.15, z, s: 0.45 * s, sy: 0.3 * s, c: 0x8a7a48 }, x, z);
  },
  extras(C) {
    // two old pyramids out in the dunes, and an oasis
    for (const [x, z, s] of [[-22, -12, 1.4], [20, -14, 1.1]]) { const g = pivot(C.still, x, C.lift(x, z) - 0.3, z); g.scale.setScalar(s); g.rotation.y = 0.4; P.pyramid(g, 0, 0, C, true); }
    const o = pivot(C.still, -19, 0, 6.5); C.PROP.pond(o, 0, 0);
    for (const [x, z] of [[-21.5, 5], [-17, 8.6], [-20.5, 9]]) palmItem(C, x, z, 1.1);
  },
  weather(C, V) {
    return dt => {
      // sand drifting across in thin veils
      if (Math.random() < dt * 7) { const [x, z] = onScreen(); drift(V, false, x - 6, 0.25 + Math.random() * 0.4, z, 3 + Math.random() * 2, 0.1, 0.5, 2.6, 0.9, 2.2, V.CELL.smoke, 0xf0d8a8, 1, 0.13, 0.4); }
      emitters(C, V, dt);
    };
  },
  props: {
    arch(g, look, i, C) {
      for (const s of [-1, 1]) { for (let k = 0; k < 4; k++) box(g, 0.62 - k * 0.04, 0.6, 0.62, k % 2 ? 0xd8b880 : 0xc8a870, s * 1.2, 0.3 + k * 0.6, 0); mesh(g, cone(0.32, 0.4, 4), 0xc8a870, s * 1.2, 2.6, 0, { ry: PI / 4 }); }
      box(g, 3.2, 0.36, 0.7, 0xd8b880, 0, 2.55, 0);
      hot(g, cyl(0.3, 0.3, 0.06, 20), 0xffc040, 2.2, 0, 2.95, 0.05, { rx: PI / 2 });
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; hbox(g, 0.05, 0.18, 0.04, 0xffc040, 1.8, cos(a) * 0.45, 2.95 + sin(a) * 0.45, 0.05, { rz: a - PI / 2 }); }
      portal(g, C, 0xffa02a, 1.15, 0.85, 1.25);
    },
    lamp(g, look, i, C) {
      box(g, 0.12, 1.3, 0.12, 0x6a4a32, 0, 0.65, 0); box(g, 0.26, 0.1, 0.26, 0xa07a4a, 0, 0.05, 0);
      mesh(g, cyl(0.2, 0.12, 0.16, 8), 0x5a4030, 0, 1.35, 0);
      flame(g, C, 0, 1.42, 0, 1.1); emit(g, C, "spark", 0, 1.8, 0);
    },
  },
};
P.pyramid = (g, look, i, C, far) => {
  const cols = [0xe0c080, 0xd4b070];
  for (let k = 0; k < 6; k++) { const s = 4.0 - k * 0.6; box(g, s, 0.55, s, cols[k % 2], 0, 0.275 + k * 0.55, 0); }
  hot(g, cone(0.72, 0.85, 4), 0xffcc50, 1.9, 0, 3.72, 0, { ry: PI / 4 });
  if (far) return;
  box(g, 0.8, 1.0, 0.2, 0x2a1a10, 0, 0.6, 2.0, { ink: 0.02 });
  hbox(g, 0.9, 0.08, 0.04, 0x5af0ff, 2.2, 0, 1.25, 2.02);
  for (let k = 0; k < 5; k++) hbox(g, 0.1, 0.1, 0.04, 0x5af0ff, 2.2, -0.4 + k * 0.2, 1.42, 1.72 + 0.02);
  for (let k = 0; k < 4; k++) box(g, 1.4 - k * 0.15, 0.12, 0.3, 0xd8b880, 0, 0.06 + k * 0.12, 2.6 - k * 0.15);
  for (const s of [-1, 1]) { box(g, 0.36, 1.4, 0.36, 0xc8a870, s * 0.9, 0.7, 2.3); hot(g, cone(0.12, 0.22, 4), 0xffcc50, 2, s * 0.9, 1.52, 2.3, { ry: PI / 4 }); }
  emit(g, C, "glint", 0, 3.9, 0);
};
P.tent = (g, look, i, C) => {
  const cloth = [0xc8423a, 0x3a6ab0, 0xd89a2a][i % 3];
  box(g, 1.9, 0.04, 1.7, 0x8a3a2a, 0, 0.02, 0, { ink: false });
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) box(g, 0.36, 0.05, 1.1, k % 2 ? 0xf0e4c8 : cloth, -0.72 + k * 0.36, 0.62, s * 0.38, { rx: s * 0.95, ink: 0.015 });
  for (const x of [-0.9, 0.9]) box(g, 0.06, 1.2, 0.06, 0x6a4a32, x, 0.6, 0);
  box(g, 1.9, 0.06, 0.06, 0x6a4a32, 0, 1.17, 0, { ink: false });
  box(g, 0.2, 0.22, 0.2, 0xffc870, 0.95, 0.85, 0.15, { glow: 1, ink: 0.02 });
  mesh(g, ball(0.18, 1), 0xc0703a, 1.1, 0.16, 0.6, { ink: 0.015 });
};
P.obelisk = (g, look, i, C) => {
  box(g, 0.8, 0.3, 0.8, 0xc8a870, 0, 0.15, 0);
  mesh(g, cyl(0.24, 0.36, 2.6, 4), 0xd8b880, 0, 1.6, 0, { ry: PI / 4 });
  hot(g, cone(0.26, 0.4, 4), 0xffcc50, 2, 0, 3.1, 0, { ry: PI / 4 });
  for (let k = 0; k < 4; k++) hbox(g, 0.14, 0.14, 0.03, 0x5af0ff, 2, 0, 1.0 + k * 0.42, 0.3 - k * 0.022);
};
P.ruin = (g, look, i, C) => {
  [[-0.8, 1.6], [0, 0.9], [0.8, 1.3]].forEach(([x, h], k) => { mesh(g, cyl(0.22, 0.25, h, 10), 0xe0c890, x, h / 2, 0); if (k !== 1) box(g, 0.6, 0.16, 0.6, 0xd8b880, x, h + 0.08, 0); });
  box(g, 2.0, 0.5, 0.3, 0xd0b880, 0, 0.25, -0.4);
  mesh(g, cyl(0.22, 0.22, 1.2, 10), 0xe0c890, 0.3, 0.22, 0.35, { rz: PI / 2, ry: 0.4 });
  for (let k = 0; k < 4; k++) mesh(g, ball(0.14 + C.rand() * 0.1, 0), 0xc8b080, -0.8 + C.rand() * 1.6, 0.08, 0.3 + C.rand() * 0.3);
};
P.cactus = (g, look, i, C) => {
  const c = 0x4a9a4a;
  mesh(g, cyl(0.24, 0.27, 1.8, 8), c, 0, 0.9, 0); mesh(g, ball(0.24, 1), c, 0, 1.8, 0, { ink: 0.02 });
  for (const [s, y, h] of [[1, 0.9, 0.7], [-1, 1.2, 0.5]]) { mesh(g, cyl(0.15, 0.15, 0.36, 8), c, s * 0.34, y, 0, { rz: PI / 2 }); mesh(g, cyl(0.15, 0.15, h, 8), c, s * 0.5, y + h / 2, 0); mesh(g, ball(0.15, 1), c, s * 0.5, y + h, 0, { ink: 0.015 }); }
  mesh(g, ball(0.1, 1), 0xff6aa8, 0, 2.02, 0, { ink: 0.015 });
};
P.urn = (g, look, i, C) => {
  [[0, 0, 1], [0.35, 0.2, 0.75], [-0.25, 0.25, 0.65]].forEach(([x, z, s], k) => {
    const u = pivot(g, x, 0, z); u.scale.setScalar(s); if (k === 2) { u.rotation.z = PI / 2.3; u.position.y = 0.12; }
    mesh(u, ball(0.28, 1), 0xc0703a, 0, 0.3, 0).scale.y = 1.1;
    mesh(u, cyl(0.12, 0.16, 0.2, 10), 0xb0602e, 0, 0.62, 0); mesh(u, cyl(0.17, 0.17, 0.05, 10), 0xa05a2a, 0, 0.73, 0, { ink: 0.015 });
    mesh(u, cyl(0.29, 0.29, 0.06, 12), 0x3a6ab0, 0, 0.36, 0, { ink: false });
  });
};
P.palm = (g, look, i, C) => {
  let x = 0, y = 0;
  for (let k = 0; k < 6; k++) { mesh(g, cyl(0.12 - k * 0.008, 0.15 - k * 0.008, 0.48, 7), k % 2 ? 0x8a6a48 : 0x7a5a3a, x, y + 0.24, 0, { rz: -0.1 - k * 0.04 }); x += 0.05 + k * 0.02; y += 0.46; }
  for (let k = 0; k < 7; k++) { const f = pivot(g, x, y, 0); f.rotation.y = (k / 7) * TAU; const l = pivot(f); l.rotation.z = -0.5; box(l, 1.2, 0.05, 0.3, [0x3f8f3a, 0x4fa045][k % 2], 0.6, 0, 0, { ink: 0.015 }); }
  for (let k = 0; k < 3; k++) mesh(g, ball(0.1, 1), 0x6a4a2a, x + cos(k * 2) * 0.14, y - 0.12, sin(k * 2) * 0.14, { ink: 0.015 });
};

// ---------------- 4: Frostveil Pass, the mountains ----------------
Wd.frost = {
  fog: 0xd2e2f0, fogNear: 82, fogFar: 112, hemi: [0xf0f8ff, 0x7a8aa8, 1.15], sun: [0xf4f8ff, 2.2],
  ground: { a: 0xe8f0f8, b: 0xf6fbff, low: 0xd2e0ee, worn: 0xc4d4e4 },
  height: (x, z, C) => { const o = C.outside(x, z), rd = C.rdist(x, z), nk = 1 - smooth(4, 14, near(x, z)) * 0.85;
    // the mountains part along the road (it carries on past the start through a pass and off the screen)
    return max(0, (smooth(1.5, 10, o) * (0.7 + C.noise(x, z) * 0.9) * 2.2 + smooth(8, 20, o) * (1.5 + abs(sin(x * 0.3) * cos(z * 0.27)) * 6)) * smooth(2.5, 6, rd) * nk); },
  tint: (c, x, z, n, rd, h, C) => { if (h > 2.2 && n > 0.15) c.lerp(C.c2.set(0x8a94a6), smooth(2.2, 4, h) * 0.6); if (n < -0.4) c.lerp(C.c2.set(0xbcd6ec), 0.5); },
  road: { dirt: 0xb4cadc, edge: 0x86a2bc, pebbles: [0xdceaf6, 0xa8bed2] },
  tufts: null,
  fill(x, z, o, C) {
    const r = C.rand();
    if (r < 0.7) snowPineItem(C, x, z, 1.1 + C.rand() * 0.6);
    else if (r < 0.88) { const s = 0.5 + C.rand() * 0.6; put(C, "rock", { x, y: 0.15, z, s, ry: C.rand() * 3, c: 0x7f8a9a }, x, z); put(C, "snowcap", { x, y: 0.15 + s * 0.3, z, s: s * 0.7, sy: s * 0.3, c: 0xf4f8ff }, x, z); }
    else put(C, "shard", { x, y: 0.5, z, sx: 0.35, sy: 1.6, sz: 0.35, rx: (C.rand() - 0.5) * 0.6, rz: (C.rand() - 0.5) * 0.6, c: 0x9fe0ff, k: 1.1 }, x, z);
  },
  extras(C) {
    // ice crystals breaking out of the snow round the edges
    for (const [x, z] of [[-17, -10], [16, -11], [-18, 9], [19, 6]]) {
      const g = pivot(C.still, x, C.lift(x, z), z);
      for (let k = 0; k < 5; k++) hot(g, new T.OctahedronGeometry(0.5, 0), [0x9fe0ff, 0xc8f0ff][k % 2], 1.3, cos(k * 1.3) * 0.6, 0.8, sin(k * 1.3) * 0.6, { rx: (k - 2) * 0.25, rz: (k % 3 - 1) * 0.3 }).scale.set(0.6, 2.4 - k * 0.2, 0.6);
    }
  },
  weather(C, V) {
    return dt => {
      // snow, slow and steady
      for (let k = 0; k < 3; k++) if (Math.random() < dt * 14) { const [gx, gz] = onScreen(), [x, y, z] = Wd.under(gx, gz, 9); drift(V, false, x, y, z, 0.35 + Math.random() * 0.3, -1.1 - Math.random() * 0.4, 0.15, 8, 0.12, 0.1, V.CELL.dot, 0xffffff, 1, 0.9, 1); }
      emitters(C, V, dt);
    };
  },
  props: {
    arch(g, look, i, C) {
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) mesh(g, ball(0.42 - k * 0.03, 0), k % 2 ? 0xbfe4f8 : 0xa8d8f4, s * 1.15, 0.35 + k * 0.6, 0, { ry: k });
      for (let k = 0; k < 7; k++) { const a = PI * (k / 6); mesh(g, ball(0.3, 0), 0xbfe4f8, cos(a) * 1.15, 2.4 + sin(a) * 0.7, 0, { ry: k }); }
      for (const s of [-1, 1]) hot(g, new T.OctahedronGeometry(0.2, 0), 0x9fe8ff, 2, s * 1.15, 2.9, 0).scale.y = 2;
      portal(g, C, 0x7fd8ff, 1.2, 0.85, 1.3);
    },
    lamp(g, look, i, C) {
      box(g, 0.1, 1.5, 0.1, 0x2a2d35, 0, 0.75, 0); box(g, 0.26, 0.1, 0.26, 0x2a2d35, 0, 0.05, 0);
      box(g, 0.24, 0.3, 0.24, 0xffc870, 0, 1.62, 0, { glow: 1, ink: 0.02 }); mesh(g, cone(0.24, 0.2, 4), 0xf4f8ff, 0, 1.87, 0, { ry: PI / 4 });
    },
  },
};
P.icekeep = (g, look, i, C) => {
  const ice = 0xbfe0f4, trim = 0x8aa8c8, roof = 0x3d6ba8;
  box(g, 3.8, 0.3, 3.2, trim, 0, 0.15, 0);
  box(g, 3.4, 1.7, 2.8, ice, 0, 1.15, 0);
  for (let k = 0; k < 7; k++) for (const s of [-1, 1]) box(g, 0.3, 0.3, 0.3, ice, -1.5 + k * 0.5, 2.15, s * 1.3);
  box(g, 2.0, 1.8, 1.8, 0xd0ecfa, 0, 2.9, -0.3);
  for (const s of [-1, 1]) { hbox(g, 0.3, 0.45, 0.05, 0x7fe8ff, 1.8, s * 0.5, 3.0, 0.62); }
  gableRoof(g, 2.0, 1.8, 3.8, roof, 0xd0ecfa);
  for (const s of [-1, 1]) {
    mesh(g, cyl(0.6, 0.65, 3.4, 10), ice, s * 1.65, 1.7, 1.25);
    mesh(g, cone(0.75, 1.3, 10), roof, s * 1.65, 4.05, 1.25); mesh(g, cone(0.4, 0.5, 10), 0xf4f8ff, s * 1.65, 4.55, 1.25, { ink: 0.015 });
    hbox(g, 0.24, 0.36, 0.05, 0x7fe8ff, 1.8, s * 1.65, 2.6, 1.85);
    const b = box(g, 0.36, 0.9, 0.04, 0x2a5aa8, s * 0.7, 1.4, 1.43, { ink: 0.015 }); box(b, 0.2, 0.2, 0.02, 0xf4f8ff, 0, 0.15, 0.03, { ink: false, rz: 0.785 });
  }
  box(g, 1.0, 1.2, 0.1, 0x2a3a5a, 0, 0.9, 1.42, { ink: 0.02 });
  hbox(g, 1.1, 0.1, 0.06, 0x9fe8ff, 1.8, 0, 1.56, 1.45);
  for (let k = 0; k < 4; k++) box(g, 1.6 - k * 0.2, 0.12, 0.3, trim, 0, 0.06 + k * 0.12, 1.9 - k * 0.15);
  const c = pivot(g, 0, 4.6, -0.3), cs = pivot(c);
  for (let k = 0; k < 3; k++) hot(cs, new T.OctahedronGeometry(0.22, 0), 0x9fe8ff, 2.4, cos(k * 2.1) * 0.25, 0, sin(k * 2.1) * 0.25).scale.y = 2.2;
  C.anim(t => { cs.rotation.y = t * 0.6; cs.position.y = sin(t * 1.5) * 0.08; });
  mv(g, c); emit(g, C, "glint", 0, 4.6, -0.3);
};
P.cabin = (g, look, i, C) => {
  const w = 2.2, d = 1.8, logs = [0x7a5236, 0x6a4628];
  box(g, w + 0.1, 0.25, d + 0.1, 0x8b8f96, 0, 0.12, 0);
  for (let k = 0; k < 6; k++) { const y = 0.38 + k * 0.22; for (const s of [-1, 1]) { mesh(g, cyl(0.11, 0.11, w + 0.3, 8), logs[k % 2], 0, y, s * d / 2, { rz: PI / 2 }); mesh(g, cyl(0.11, 0.11, d + 0.3, 8), logs[(k + 1) % 2], s * w / 2, y + 0.11, 0, { rx: PI / 2 }); } }
  box(g, w - 0.1, 1.3, d - 0.1, 0x6a4628, 0, 0.95, 0, { ink: false });
  gableRoof(g, w, d, 1.72, 0xf0f6ff, 0x6a4628);
  box(g, 0.5, 0.8, 0.08, 0x4a3020, -0.4, 0.82, d / 2 + 0.1, { ink: 0.02 });
  box(g, 0.44, 0.36, 0.06, 0xffc870, 0.5, 1.1, d / 2 + 0.1, { glow: 1, ink: 0.02 });
  box(g, 0.06, 0.36, 0.44, 0xffc870, w / 2 + 0.12, 1.1, 0, { glow: 1, ink: 0.02 });
  box(g, 0.34, 1.0, 0.34, 0x8b8f96, 0.7, 2.3, -0.35); box(g, 0.4, 0.08, 0.4, 0xf4f8ff, 0.7, 2.83, -0.35, { ink: 0.015 }); g.userData.chimney = [0.7, 2.95, -0.35];
  for (let k = 0; k < 3; k++) mesh(g, cyl(0.12, 0.12, 0.5, 8), 0x7a5236, -1.4, 0.12 + k * 0.2, -0.3 + (k % 2) * 0.25, { rx: PI / 2 });
};
P.snowpine = (g, look, i, C) => {
  box(g, 0.2, 0.7, 0.2, 0x5a4030, 0, 0.35, 0);
  for (let k = 0; k < 3; k++) { const s = 1.3 - k * 0.32; mesh(g, cone(0.75 * s, 1.0 * s, 8), [0x2f5a48, 0x2a5040, 0x355f4c][k], 0, 0.9 + k * 0.6, 0); mesh(g, cone(0.55 * s, 0.5 * s, 8), 0xf4f8ff, 0, 1.15 + k * 0.6, 0, { ink: 0.015 }); }
};
P.iceblock = (g, look, i, C) => {
  mesh(g, ball(0.55, 0), 0xa8dcf4, 0, 0.45, 0, { ry: i }).scale.set(1, 0.9, 0.85);
  hot(g, new T.OctahedronGeometry(0.22, 0), 0xd8f8ff, 2.2, 0.2, 0.75, 0.3);
  for (let k = 0; k < 3; k++) mesh(g, new T.OctahedronGeometry(0.16, 0), 0xc8ecff, cos(k * 2.2) * 0.6, 0.12, sin(k * 2.2) * 0.6, { rz: 0.4 });
};
P.snowman = (g, look, i, C) => {
  const w = 0xf4f8ff;
  mesh(g, ball(0.4, 1), w, 0, 0.36, 0); mesh(g, ball(0.3, 1), w, 0, 0.9, 0); mesh(g, ball(0.22, 1), w, 0, 1.33, 0);
  for (const s of [-1, 1]) box(g, 0.05, 0.05, 0.03, 0x1a1a22, s * 0.08, 1.38, 0.2, { ink: false });
  mesh(g, cone(0.04, 0.24, 6), 0xff8a2a, 0, 1.32, 0.3, { rx: PI / 2, ink: false });
  for (const y of [0.8, 0.95, 1.08]) box(g, 0.05, 0.05, 0.03, 0x1a1a22, 0, y, 0.29, { ink: false });
  for (const s of [-1, 1]) box(g, 0.5, 0.04, 0.04, 0x5a3d28, s * 0.42, 1.0, 0, { rz: s * 0.5, ink: false });
  mesh(g, cyl(0.2, 0.2, 0.08, 10), 0xc0282a, 0, 1.15, 0, { ink: 0.015 });
  mesh(g, cyl(0.16, 0.16, 0.26, 10), 0x1a1a22, 0, 1.6, 0); mesh(g, cyl(0.24, 0.24, 0.03, 10), 0x1a1a22, 0, 1.48, 0, { ink: false });
};
P.firepit = (g, look, i, C) => {
  rocks(g, C, 8, 0.45, 0x7d8288, 0.32, 0.08);
  for (let k = 0; k < 3; k++) mesh(g, cyl(0.06, 0.06, 0.6, 6), 0x5a3d28, 0, 0.12, 0, { ry: k * 1.05, rz: PI / 2 - 0.25 });
  flame(g, C, 0, 0.12, 0, 1.6); emit(g, C, "spark", 0, 0.6, 0);
  for (const s of [-1, 1]) mesh(g, cyl(0.07, 0.07, 0.7, 6), 0x6a4628, s * 0.95, 0.1, 0.2, { rx: PI / 2, rz: s * 0.3 });
};
P.sled = (g, look, i, C) => {
  for (const s of [-1, 1]) { box(g, 1.3, 0.05, 0.06, 0x8a2a2a, 0, 0.05, s * 0.3, { ink: 0.015 }); box(g, 0.3, 0.05, 0.06, 0x8a2a2a, 0.72, 0.15, s * 0.3, { rz: 0.8, ink: 0.015 }); for (const x of [-0.4, 0.3]) box(g, 0.05, 0.22, 0.05, 0x5a3d28, x, 0.17, s * 0.3, { ink: false }); }
  for (let k = 0; k < 5; k++) box(g, 0.18, 0.05, 0.7, 0x9a7a58, -0.5 + k * 0.24, 0.3, 0, { ink: 0.015 });
  box(g, 0.45, 0.4, 0.45, 0xa07a4a, -0.2, 0.53, 0, { ry: 0.2 });
};

// ---------------- 5: Gloomhollow, the graveyard at night ----------------
Wd.grave = {
  fog: 0x2c283e, fogNear: 72, fogFar: 106, hemi: [0x9a96d8, 0x2a2438, 0.8], sun: [0xc4d2ff, 1.55],
  ground: { a: 0x3e4a3e, b: 0x4a5646, low: 0x34402f, worn: 0x5a5458 }, hills: 1.3,
  tint: (c, x, z, n, rd, h, C) => { c.lerp(C.c2.set(0x4a3e5e), 0.18 + max(0, -n) * 0.2); },
  road: { dirt: 0x706a7c, edge: 0x4c4658, pebbles: [0x5a5668, 0x48445a] },
  tufts: [0x3a4636, 0x2e3a2c],
  lights: [[0xb06aff, 9, 15.5, 2.5, -2.5, 16]],
  fill(x, z, o, C) {
    const r = C.rand();
    if (r < 0.45) deadTreeItem(C, x, z, 1 + C.rand() * 0.6, 0x3a302e);
    else if (r < 0.8) put(C, "slab", { x, y: 0.35, z, sx: 0.45, sy: 0.7 + C.rand() * 0.4, sz: 0.14, ry: (C.rand() - 0.5) * 0.5, rz: (C.rand() - 0.5) * 0.3, c: [0x7a7686, 0x6a6676, 0x8a8696][(C.rand() * 3) | 0] }, x, z);
    else if (r < 0.9) put(C, "shroom", { x, y: 0.02, z, s: 0.2 + C.rand() * 0.2, c: C.rand() < 0.5 ? 0x5affd0 : 0xb07aff, k: 1.7 }, x, z);
    else put(C, "rock", { x, y: 0.15, z, s: 0.4 + C.rand() * 0.4, ry: C.rand() * 3, c: 0x5a5668 }, x, z);
  },
  extras(C) {
    // low mist lying in sheets, drifting
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const x = cv.getContext("2d"), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const tex = C.tex(new T.CanvasTexture(cv)), mat = C.own(new T.MeshBasicMaterial({ map: tex, color: 0xb8b0e0, transparent: true, opacity: 0.09, depthWrite: false }));
    for (let k = 0; k < 10; k++) {
      const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat), a = (k / 14) * TAU, r = 9 + C.rand() * 9;
      const mx = cos(a) * r * 1.3, mz = sin(a) * r * 0.8;
      m.rotation.x = -PI / 2; m.position.set(mx, 0.45 + C.rand() * 0.4, mz); m.scale.set(9 + C.rand() * 6, 6 + C.rand() * 4, 1); m.renderOrder = 2; C.world.add(m);
      const ph = C.rand() * 6; C.anim(t => { m.position.x = mx + sin(t * 0.12 + ph) * 2; m.position.z = mz + cos(t * 0.09 + ph) * 1.2; });
    }
  },
  weather(C, V) {
    return dt => {
      // will-o'-the-wisps drifting over the graves
      if (Math.random() < dt * 5) { const [x, z] = onScreen(); drift(V, true, x, 0.4 + Math.random() * 1.2, z, (Math.random() - 0.5) * 0.4, 0.15, (Math.random() - 0.5) * 0.4, 3 + Math.random() * 2, 0.16, 0.05, V.CELL.hot, Math.random() < 0.6 ? 0x5affd0 : 0x9a6aff, 2.2, 0.9); }
      emitters(C, V, dt);
    };
  },
  props: {
    arch(g, look, i, C) {
      for (const s of [-1, 1]) { box(g, 0.6, 2.7, 0.6, 0x6a6676, s * 1.25, 1.35, 0); box(g, 0.75, 0.2, 0.75, 0x5a5666, s * 1.25, 2.8, 0); mesh(g, ball(0.22, 1), 0xe8e4d8, s * 1.25, 3.05, 0, { ink: 0.02 }); for (const e of [-1, 1]) hbox(g, 0.06, 0.06, 0.03, 0x7aff8a, 2.6, s * 1.25 + e * 0.08, 3.08, 0.2); }
      for (let k = 0; k < 11; k++) { const a = PI * (k / 10); box(g, 0.08, 0.32, 0.06, 0x1a1a22, cos(a) * 0.95, 2.45 + sin(a) * 0.55, 0, { rz: a - PI / 2, ink: false }); }
      for (let k = 0; k < 5; k++) box(g, 0.05, 2.0, 0.05, 0x1a1a22, -0.6 + k * 0.3, 1.2, -0.12, { ink: false });
      portal(g, C, 0x7aff8a, 1.2, 0.85, 1.3);
    },
    lamp(g, look, i, C) {
      box(g, 0.1, 1.5, 0.1, 0x1a1a22, 0, 0.75, 0, { rz: 0.06 }); box(g, 0.45, 0.07, 0.07, 0x1a1a22, 0.18, 1.5, 0, { ink: false });
      box(g, 0.22, 0.28, 0.22, 0x2a2d35, 0.38, 1.28, 0, { ink: 0.02 });
      flame(g, C, 0.38, 1.16, 0, 0.7, 0x5aff9a, 0xd8ffe8);
    },
  },
};
P.crypt = (g, look, i, C) => {
  const st = 0x7a7686, dk = 0x5a5666;
  for (let k = 0; k < 3; k++) box(g, 3.6 - k * 0.2, 0.15, 3.2 - k * 0.2, dk, 0, 0.075 + k * 0.15, 0);
  box(g, 3.0, 2.0, 2.4, st, 0, 1.45, -0.3);
  gableRoof(g, 3.0, 2.4, 2.45, 0x3a3648, st);
  for (const x of [-1.15, -0.4, 0.4, 1.15]) { mesh(g, cyl(0.17, 0.2, 2.0, 10), 0x8a8696, x, 1.45, 1.2); box(g, 0.45, 0.14, 0.45, dk, x, 2.48, 1.2); }
  box(g, 3.0, 0.3, 0.5, dk, 0, 2.65, 1.1);
  const door = hbox(g, 0.9, 1.4, 0.06, 0xb06aff, 2.2, 0, 1.15, 0.92, { own: 1 });
  C.anim(t => { const k = 1.7 + sin(t * 2) * 0.5; door.material.color.setRGB(0.69 * k, 0.42 * k, 1 * k); });
  mv(g, door);
  mesh(g, ball(0.22, 1), 0xe8e4d8, 0, 2.95, 1.25, { ink: 0.02 }); for (const s of [-1, 1]) hbox(g, 0.07, 0.07, 0.03, 0xb06aff, 3, s * 0.08, 2.98, 1.46);
  for (const s of [-1, 1]) { box(g, 0.5, 0.6, 0.5, dk, s * 1.55, 0.6, 1.55); mesh(g, ball(0.2, 0), 0x8a8696, s * 1.55, 1.05, 1.55); flame(g, C, s * 1.55, 1.22, 1.55, 0.5, 0xb06aff, 0xf0d8ff); }
  emit(g, C, "wisp", 0, 1.0, 1.2);
};
P.tomb = (g, look, i, C) => {
  const v = i % 3, st = [0x7a7686, 0x8a8696, 0x6a6676][i % 3], t = pivot(g, 0, 0, -0.35); t.rotation.z = (C.rand() - 0.5) * 0.2; t.rotation.x = (C.rand() - 0.5) * 0.15;
  if (v === 0) { box(t, 0.7, 0.75, 0.18, st, 0, 0.38, 0); mesh(t, cyl(0.35, 0.35, 0.18, 14, 1, false, 0, PI), st, 0, 0.75, 0, { rx: PI / 2, rz: PI / 2 }); box(t, 0.36, 0.05, 0.02, 0x4a4656, 0, 0.6, 0.1, { ink: false }); }
  else if (v === 1) { box(t, 0.16, 1.1, 0.16, st, 0, 0.55, 0); box(t, 0.6, 0.16, 0.16, st, 0, 0.78, 0); }
  else { box(t, 0.55, 0.25, 0.4, st, 0, 0.12, 0); mesh(t, cyl(0.1, 0.16, 0.9, 4), st, 0, 0.7, 0, { ry: PI / 4 }); }
  box(g, 0.7, 0.12, 1.0, 0x3a3228, 0, 0.06, 0.25, { ink: 0.015 });
  if (i % 2) flame(g, C, 0.25, 0.14, 0.1, 0.4); else for (let k = 0; k < 3; k++) mesh(g, ball(0.05, 0), 0x9a6aff, -0.15 + k * 0.12, 0.15, 0.55, { ink: false });
};
P.deadtree = (g, look, i, C) => {
  const c = 0x3a302e;
  mesh(g, cyl(0.12, 0.24, 1.6, 7), c, 0, 0.8, 0, { rz: 0.08 });
  mesh(g, cyl(0.07, 0.12, 1.0, 6), c, 0.12, 1.95, 0, { rz: -0.25 });
  for (const [a, y, l] of [[0.6, 1.2, 0.9], [2.4, 1.5, 0.8], [4.1, 1.8, 0.7], [1.5, 2.2, 0.6]]) { const p = pivot(g, 0, y, 0); p.rotation.set(0, a, 0.9); mesh(p, cyl(0.03, 0.07, l, 5), c, 0, l / 2, 0); }
  const lp = pivot(g, 0.55, 1.3, 0.25); box(lp, 0.02, 0.3, 0.02, 0x1a1a22, 0, -0.15, 0, { ink: false }); box(lp, 0.16, 0.2, 0.16, 0x1a1a22, 0, -0.38, 0, { ink: 0.015 });
  hot(lp, ball(0.07, 1), 0x7aff8a, 3, 0, -0.38, 0);
};
P.mausoleum = (g, look, i, C) => {
  const st = [0x8a8696, 0x7a7686][i % 2];
  box(g, 2.1, 0.2, 1.9, 0x5a5666, 0, 0.1, 0);
  box(g, 1.8, 1.5, 1.6, st, 0, 0.95, 0);
  gableRoof(g, 1.8, 1.6, 1.7, 0x3a3648, st);
  for (const s of [-1, 1]) mesh(g, cyl(0.1, 0.12, 1.5, 8), 0x9a96a6, s * 0.65, 0.95, 0.85);
  box(g, 0.6, 1.0, 0.06, 0x1a1a22, 0, 0.7, 0.82, { ink: 0.02 });
  hbox(g, 0.06, 0.6, 0.02, 0xb06aff, 2.4, 0, 0.75, 0.86);
  hot(g, cyl(0.16, 0.16, 0.04, 14), 0x9a6aff, 1.8, 0, 2.0, 0.82, { rx: PI / 2 });
  for (const s of [-1, 1]) mesh(g, ball(0.14, 1), 0x6a6676, s * 0.9, 1.75, 0.8, { ink: 0.015 });
};
P.pumpkins = (g, look, i, C) => {
  [[0, 0, 1], [0.45, 0.25, 0.7], [-0.4, 0.3, 0.8]].forEach(([x, z, s], k) => {
    const p = pivot(g, x, 0, z); p.scale.setScalar(s); p.rotation.y = (k - 1) * 0.4;
    mesh(p, ball(0.32, 1), 0xe8761e, 0, 0.27, 0).scale.set(1.2, 0.85, 1.2);
    mesh(p, cyl(0.04, 0.06, 0.16, 5), 0x4a6a2a, 0, 0.6, 0, { rz: 0.3, ink: 0.01 });
    for (const e of [-1, 1]) hot(p, cone(0.07, 0.1, 3), 0xffb02a, 2.6, e * 0.12, 0.34, 0.36, { rx: PI / 2 });
    hbox(p, 0.26, 0.06, 0.03, 0xffb02a, 2.6, 0, 0.18, 0.37);
  });
};
P.gravefence = (g, look, i, C) => {
  for (const s of [-1, 1]) { box(g, 0.24, 0.9, 0.24, 0x6a6676, s * 1.05, 0.45, 0); mesh(g, ball(0.13, 0), 0x7a7686, s * 1.05, 0.98, 0); }
  for (let k = 0; k < 9; k++) { box(g, 0.04, 0.95, 0.04, 0x1a1a22, -0.8 + k * 0.2, 0.48, 0, { ink: false }); mesh(g, cone(0.05, 0.14, 4), 0x1a1a22, -0.8 + k * 0.2, 1.0, 0, { ink: false }); }
  for (const y of [0.25, 0.75]) box(g, 1.9, 0.05, 0.05, 0x1a1a22, 0, y, 0, { ink: false });
};

// ---------------- 6: Cinderfall, the volcano ----------------
// (29 Oct, request: "the volcano map shouldnt just be a rectangle, just make the whole thing ground and add some small
// lava pools peeking out from the sides"): all ground, with a few small pools just outside the play area at the edges
// of the screen [x, z, radius]; their banks slope in. The lava shader works out the same pools to crust their edges
const POOLS = [[-16, -5, 2.6], [-12.5, 10.8, 2.3], [3.5, 11, 2.2], [17.5, 1, 2.6], [16, -9.5, 2.2], [-5, -11, 2.6], [8, -11.2, 2]];
const lavaDip = (x, z, n) => { let d = 0; for (const [px, pz, r] of POOLS) d = max(d, smooth(r, r * 0.5, Math.hypot(x - px, z - pz) + n * 0.8)); return d; };
const nearPool = (x, z) => { let d = 1e9; for (const [px, pz, r] of POOLS) d = min(d, Math.hypot(x - px, z - pz) - r); return d; };
// lava (29 Oct, request: "theres still a square texture on all the lava and the lava pools look really weird, they need a
// rebuild"): drawn from where each point is in the world, so nothing repeats. Hot cells churning slowly, bright veins,
// dark crust riding over it, and (on the big sheet) crust thickening toward the shore, worked out from the same small
// pools board.js sinks the ground into, so the shore reads as cooling rock instead of a hard edge
const LAVA_V = `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LAVA_F = `uniform float uT, uK, uBank, uCrust; uniform vec4 uB; uniform vec3 uP[7]; varying vec3 vW;
float hs(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), u.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
float sm(float a, float b, float x) { float k = clamp((x - a) / (b - a), 0.0, 1.0); return k * k * (3.0 - 2.0 * k); }
void main() {
  vec2 p = vW.xz * 0.42;
  vec2 q = vec2(fbm(p + vec2(0.0, uT * 0.05)), fbm(p + vec2(5.2, 1.3) - uT * 0.04));
  float f = fbm(p + q * 1.8 + vec2(uT * 0.03, 0.0));
  float vein = clamp(1.0 - abs(f * 2.0 - 1.0), 0.0, 1.0);
  vec3 c = mix(vec3(0.42, 0.05, 0.015), vec3(0.92, 0.27, 0.045), sm(0.3, 0.75, f));
  c += vec3(0.85, 0.5, 0.12) * pow(vein, 10.0);
  float crust = sm(uCrust, uCrust + 0.1, fbm(p * 1.6 + vec2(3.1, -1.7) + q * 0.6 - uT * 0.015));
  float bank = 0.0;
  if (uBank > 0.5) {
    vec2 w = vW.xz, v = w * 1.3;
    float n = sin(v.x * 0.19 + 1.3) * cos(v.y * 0.23 - 0.7) * 0.5 + sin(v.x * 0.071 + v.y * 0.093) * 0.35 + sin(v.x * 0.53 - v.y * 0.41) * 0.15;
    float dip = 0.0;
    for (int i = 0; i < 7; i++) { vec3 P = uP[i]; dip = max(dip, sm(P.z, P.z * 0.5, length(w - P.xy) + n * 0.8)); }
    bank = 1.0 - sm(0.42, 0.8, dip);
  }
  c = mix(c, vec3(0.13, 0.04, 0.03), max(crust * 0.85, bank * 0.92));
  gl_FragColor = vec4(c * uK, 1.0);
}`;
// one lava material per board, its time kept by the board's clock (bank: crust toward the banks of the big sheet)
function lavaMat(C, bank) {
  const key = bank ? "lavaBank" : "lavaPool";
  if (C[key]) return C[key];
  const [x0, x1, z0, z1] = C.map.bounds;
  const m = C[key] = C.own(new T.ShaderMaterial({ vertexShader: LAVA_V, fragmentShader: LAVA_F,
    uniforms: { uT: { value: 0 }, uK: { value: 1 }, uBank: { value: bank ? 1 : 0 }, uCrust: { value: bank ? 0.58 : 0.5 }, uB: { value: new T.Vector4(x0, x1, z0, z1) },
      uP: { value: POOLS.map(([x, z, r]) => new T.Vector3(x, z, r)) } } }));
  C.anim(t => { m.uniforms.uT.value = t; m.uniforms.uK.value = 0.85 + sin(t * 0.9) * 0.05; });
  return m;
}
Wd.volcano = {
  fog: 0x3a2624, fogNear: 80, fogFar: 112, hemi: [0xffb898, 0x2a1a18, 0.85], sun: [0xffcc9a, 2.0], groundRes: 1.6, bloom: [4, 0.6],
  ground: { a: 0x3c3536, b: 0x4a4140, low: 0x2e2829, worn: 0x5a4c46 },
  // (29 Oct, request: "the lava is like in squares like minecraft could you fix this"): the banks slope down into the
  // rivers and the far lava instead of dropping a whole square at a time
  height(x, z, C) {
    const o = C.outside(x, z), clear = smooth(2.4, 3.6, C.rdist(x, z));
    const dip = lavaDip(x, z, C.noise(x * 1.3, z * 1.3)) * clear;
    return C.baseLift(x, z) * 1.1 * (1 - smooth(5, 14, near(x, z)) * 0.5) * (1 - dip) - dip * 0.8;
  },
  tint: (c, x, z, n, rd, h, C) => { if (h < -0.05) c.lerp(C.c2.set(0x2a1210), smooth(-0.05, -0.3, h)); else { const o = nearPool(x, z); if (o < 1.6) c.lerp(C.c2.set(0x6a2a16), smooth(1.6, 0, o) * 0.6); } if (n > 0.55) c.lerp(C.c2.set(0x5a2a1a), 0.4); },
  road: { dirt: 0x5a4c48, edge: 0xff6a1a, edgeK: 1.3, glow: true, pebbles: [0x2a2224, 0x3a3032] },
  tufts: null,
  lights: [[0xff6a2a, 10, 14.5, 3, 7.5, 16], [0xff4a1a, 6, -6, 2, -11, 18]],
  fill(x, z, o, C) {
    if (C.lift(x, z) < -0.1) return;
    const r = C.rand();
    if (r < 0.42) { const n = 2 + ((C.rand() * 3) | 0); for (let k = 0; k < n; k++) { const h = 0.6 + C.rand() * 1.8; put(C, "column", { x: x + (C.rand() - 0.5) * 0.9, y: h / 2, z: z + (C.rand() - 0.5) * 0.9, sx: 0.55, sy: h, sz: 0.55, c: [0x3a3438, 0x4a4246, 0x2e2a2e][k % 3] }, x, z); } }
    else if (r < 0.65) put(C, "rock", { x, y: 0.15, z, s: 0.5 + C.rand() * 0.6, ry: C.rand() * 3, c: 0x2e2a2c }, x, z);
    else if (r < 0.82) deadTreeItem(C, x, z, 0.9 + C.rand() * 0.5, 0x1e1a1a);
    else put(C, "shard", { x, y: 0.4, z, sx: 0.3, sy: 1.2, sz: 0.3, rx: (C.rand() - 0.5) * 0.7, rz: (C.rand() - 0.5) * 0.7, c: 0xff7a2a, k: 2.2 }, x, z);
  },
  extras(C) {
    // the lava under it all, glowing hot (only the rivers and the far edge sink below it)
    const lg = new T.PlaneGeometry(160, 120, 1, 1); lg.rotateX(-PI / 2);
    const lava = new T.Mesh(lg, lavaMat(C, true));
    lava.position.y = -0.3; C.world.add(lava);
    // the volcano itself, off past the far corner, smoking, now and then throwing up fire
    const [vx, , vz] = [-22, 0, -13], v = pivot(C.still, vx, C.lift(vx, vz) - 0.5, vz);
    mesh(v, cyl(1.6, 6.5, 5.5, 12), 0x3a3032, 0, 2.75, 0);
    mesh(v, cyl(1.7, 1.75, 0.3, 12), 0x2a2224, 0, 5.55, 0, { ink: 0.02 });
    hot(v, cyl(1.45, 1.45, 0.08, 12), 0xff6a1a, 2.8, 0, 5.62, 0);
    for (let k = 0; k < 5; k++) { const a = -0.4 + k * 0.45; hbox(v, 0.22, 4.4, 0.08, 0xff5a14, 2.2, cos(a) * 3.9, 2.9, sin(a) * 3.9, { ry: -a + PI / 2, rx: 0, rz: 0 }).rotation.set(-0.5 * sin(a), -a, 0.5 * cos(a)); }
    C.crater = new T.Vector3(vx, v.position.y + 5.7, vz);
  },
  weather(C, V) {
    let boom = 3;
    return dt => {
      // embers off the lava, ash coming down
      for (let k = 0; k < 2; k++) if (Math.random() < dt * 12) { const [x, z] = onScreen(); drift(V, true, x, 0, z, (Math.random() - 0.5) * 0.5, 1 + Math.random() * 1.4, (Math.random() - 0.5) * 0.5, 2 + Math.random() * 2, 0.07, 0.02, V.CELL.hot, 0xff8a2a, 2.6, 1); }
      if (Math.random() < dt * 6) { const [gx, gz] = onScreen(), [x, y, z] = Wd.under(gx, gz, 8); drift(V, false, x, y, z, 0.3, -0.9, 0.2, 9, 0.08, 0.06, V.CELL.dot, 0x8a8080, 1, 0.6, 1); }
      // the crater smokes, and every few seconds it goes off
      const cr = C.crater;
      if (cr && Math.random() < dt * 5) drift(V, false, cr.x + (Math.random() - 0.5), cr.y, cr.z + (Math.random() - 0.5), 0.4, 1.4, 0.2, 4, 0.8, 3.2, V.CELL.smoke, 0x3a3030, 1, 0.55, 0.4);
      boom -= dt;
      if (cr && boom <= 0) {
        boom = 4 + Math.random() * 5;
        V.burst(true, cr.x, cr.y, cr.z, 40, { cols: [0xffb04a, 0xff6a1a, 0xffe08a], speed: [2, 6], up: 5, dir: [0, 1, 0], cone: 0.6, life: [0.8, 1.6], size: [0.25, 0.05], cell: V.CELL.hot, k: 3, grav: 7 });
        V.burst(false, cr.x, cr.y + 0.5, cr.z, 10, { cols: [0x2a2222, 0x3a3030], speed: [0.5, 1.5], up: 2, life: [2, 3], size: [1, 3], cell: V.CELL.smoke, a: 0.6, drag: 1, grav: -0.4, spin: 1 });
      }
      emitters(C, V, dt);
    };
  },
  props: {
    arch(g, look, i, C) {
      for (const s of [-1, 1]) { mesh(g, cone(0.5, 3.2, 5), 0x1e1a1e, s * 1.2, 1.6, 0, { rz: -s * 0.12 }); for (let k = 0; k < 3; k++) hbox(g, 0.12, 0.12, 0.04, 0xff6a1a, 2.6, s * 1.2 - s * k * 0.04, 0.6 + k * 0.6, 0.38 - k * 0.06); }
      mesh(g, cone(0.3, 1.2, 4), 0x1e1a1e, -0.4, 2.9, 0, { rz: 1.1 }); mesh(g, cone(0.3, 1.2, 4), 0x1e1a1e, 0.4, 2.9, 0, { rz: -1.1 });
      portal(g, C, 0xff3a1a, 1.2, 0.85, 1.3);
    },
    lamp(g, look, i, C) {
      for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; box(g, 0.06, 1.1, 0.06, 0x2a2224, cos(a) * 0.14, 0.52, sin(a) * 0.14, { rx: sin(a) * 0.2, rz: -cos(a) * 0.2, ink: false }); }
      mesh(g, cyl(0.26, 0.14, 0.2, 8), 0x3a3032, 0, 1.12, 0);
      flame(g, C, 0, 1.18, 0, 1.3); emit(g, C, "spark", 0, 1.6, 0);
    },
  },
};
P.forgekeep = (g, look, i, C) => {
  const st = 0x3a3436, dk = 0x2a2426;
  box(g, 4.0, 0.3, 3.4, dk, 0, 0.15, 0);
  box(g, 3.4, 2.0, 2.6, st, 0, 1.3, -0.2);
  for (let k = 0; k < 7; k++) box(g, 0.32, 0.32, 0.32, st, -1.5 + k * 0.5, 2.46, 1.05);
  for (const s of [-1, 1]) { box(g, 0.9, 3.2, 0.9, dk, s * 1.6, 1.6, 1.0); for (const e of [-1, 1]) mesh(g, cone(0.12, 0.6, 4), 0x1e1a1e, s * 1.6 + e * 0.3, 3.5, 1.0, { ink: 0.015 }); hbox(g, 0.18, 0.4, 0.05, 0xff8a2a, 2, s * 1.6, 2.4, 1.46);
    const b = box(g, 0.5, 1.1, 0.04, 0x8a1a1a, s * 0.75, 1.5, 1.12, { ink: 0.015 }); box(b, 0.24, 0.24, 0.02, 0x1a1a1a, 0, 0.15, 0.03, { ink: false, rz: 0.785 }); }
  box(g, 1.5, 1.4, 0.12, 0x1a1616, 0, 0.95, 1.12, { ink: 0.02 });
  const mouth = hbox(g, 1.2, 1.1, 0.06, 0xff6a1a, 2.4, 0, 0.85, 1.16, { own: 1 });
  C.anim(t => { const k = 2.2 + sin(t * 3.1) * 0.4 + sin(t * 7.7) * 0.15; mouth.material.color.setRGB(1 * k, 0.42 * k, 0.1 * k); });
  mv(g, mouth);
  box(g, 0.6, 3.4, 0.6, dk, 0.9, 3.4, -0.9);
  flame(g, C, 0.9, 5.1, -0.9, 2.2); emit(g, C, "spark", 0.9, 5.6, -0.9); emit(g, C, "smoke", 0.9, 5.8, -0.9);
  box(g, 0.5, 0.3, 0.25, 0x2a2a30, -0.9, 0.45, 1.7); box(g, 0.25, 0.3, 0.2, 0x2a2a30, -0.9, 0.18, 1.7);
  hbox(g, 3.6, 0.06, 0.12, 0xff6a1a, 2.2, 0, 0.31, 1.62);
};
P.spire = (g, look, i, C) => {
  for (let k = 0; k < 3; k++) mesh(g, cone(0.55 - k * 0.15, 1.4 - k * 0.2, 6), 0x2a2426, (k % 2 - 0.5) * 0.08, 0.7 + k * 1.0, 0, { ry: k });
  for (let k = 0; k < 4; k++) hbox(g, 0.05, 0.5, 0.05, 0xff6a1a, 2.4, cos(k * 1.6) * (0.3 - k * 0.04), 0.5 + k * 0.6, sin(k * 1.6) * (0.3 - k * 0.04) + 0.12, { rz: 0.3 });
  hot(g, new T.OctahedronGeometry(0.12, 0), 0xffa040, 3, 0, 3.4, 0);
};
// a sunken pool: a low ring of basalt with rocks heaped on it, the lava (crust and all, from the shader) a little below
// its lip, bubbles popping
P.lavapool = (g, look, i, C) => {
  const R = 1.45;
  mesh(g, new T.LatheGeometry([[R * 0.9, 0.04], [R * 1.0, 0.2], [R * 1.12, 0.24], [R * 1.24, 0.12], [R * 1.32, 0]].map(([x, y]) => new T.Vector2(x, y)), 20), 0x2e2829, 0, 0, 0, { ink: false });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + C.rand() * 0.5, s = 0.2 + C.rand() * 0.18; mesh(g, ball(s, 0), [0x2a2426, 0x3a3234][k % 2], cos(a) * R * 1.12, 0.14, sin(a) * R * 1.12, { ry: C.rand() * 3 }).scale.y = 0.7; }
  const p = pivot(g, 0, 0.08, 0), d = new T.Mesh(new T.CircleGeometry(R * 0.95, 40), lavaMat(C, false));
  d.rotation.x = -PI / 2; p.add(d);
  hot(p, new T.TorusGeometry(R * 0.94, 0.05, 4, 40), 0x3a1a10, 1, 0, 0.015, 0, { rx: PI / 2 });
  mv(g, p); emit(g, C, "bubble", 0, 0.12, 0);
};
P.columns = (g, look, i, C) => {
  for (let k = 0; k < 5; k++) { const h = 0.7 + ((k * 7 + i * 3) % 5) * 0.32, a = (k / 5) * TAU; mesh(g, cyl(0.24, 0.24, h, 6), [0x3a3438, 0x4a4246][k % 2], cos(a) * 0.35, h / 2, sin(a) * 0.35, { ry: k * 0.3 }); mesh(g, cyl(0.24, 0.24, 0.04, 6), 0x5a5054, cos(a) * 0.35, h + 0.02, sin(a) * 0.35, { ry: k * 0.3, ink: false }); }
  hbox(g, 0.04, 0.6, 0.04, 0xff6a1a, 2.2, 0.22, 0.6, 0.38);
};
P.forgehut = (g, look, i, C) => {
  box(g, 2.2, 1.3, 1.8, 0x4a4244, 0, 0.65, -0.1);
  gableRoof(g, 2.2, 1.8, 1.3, 0x6a2a22, 0x4a4244);
  box(g, 0.8, 0.8, 0.1, 0x1a1616, -0.4, 0.6, 0.82, { ink: 0.02 }); hbox(g, 0.6, 0.6, 0.06, 0xff6a1a, 2.2, -0.4, 0.55, 0.86);
  box(g, 0.45, 0.25, 0.22, 0x2a2a30, 0.55, 0.42, 1.2); box(g, 0.22, 0.3, 0.18, 0x2a2a30, 0.55, 0.15, 1.2);
  mesh(g, cyl(0.24, 0.26, 0.5, 10), 0x5a3d28, -0.95, 0.25, 1.0); hot(g, cyl(0.2, 0.2, 0.02, 10), 0x4a8ad8, 1.2, -0.95, 0.5, 1.0);
  box(g, 0.32, 1.1, 0.32, 0x3a3436, 0.7, 1.8, -0.5); g.userData.chimney = [0.7, 2.4, -0.5]; emit(g, C, "spark", 0.7, 2.4, -0.5);
};

// ---------------- 7: Neon Arcology, the city at night ----------------
const NEON = [0x2af0ff, 0xff3aa8, 0xffd23a, 0x9a6aff, 0x3aff9a];
Wd.neon = {
  fog: 0x121830, fogNear: 82, fogFar: 114, hemi: [0x7a8aff, 0x1a1428, 0.75], sun: [0xb8c4ff, 1.25], bloom: [3, 0.6],
  ground: { a: 0x2a3048, b: 0x30364e, low: 0x252a3e, worn: 0x3a4262 }, hills: 0,
  tint: (c, x, z, n, rd, h, C) => { if (C.outside(x, z) > 0.3) c.set(0x1c2030).offsetHSL(0, 0, n * 0.02); else c.offsetHSL(0, 0, ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) * 0.035); },
  road: { dirt: 0x161a28, edge: 0x2af0ff, edgeK: 2.2, glow: true, pebbles: null },
  tufts: null,
  lights: [[0xff3aa8, 8, -7, 3, 3, 15], [0x2af0ff, 8, 7, 3, -3, 15], [0x9a6aff, 6, 15, 3, -1, 12]],
  extras(C) {
    // the lane line down the middle of the avenue
    const dash = new T.BoxGeometry(0.5, 0.02, 0.07), dm = hotMat(0xffd23a, 1.8);
    for (let d = 2; d < C.pts.length - 1; d += 4) { const a = C.pts[d - 1], b = C.pts[d], m = new T.Mesh(dash, dm); m.position.set(b[0], 0.045, b[1]); m.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); C.still.add(m); }
    // a faint grid across the plaza
    const lp = [], [x0, x1, z0, z1] = C.map.bounds;
    for (let x = x0; x <= x1; x += 2) lp.push(x, 0.02, z0, x, 0.02, z1);
    for (let z = z0; z <= z1; z += 2) lp.push(x0, 0.02, z, x1, 0.02, z);
    const lg = new T.BufferGeometry(); lg.setAttribute("position", new T.Float32BufferAttribute(lp, 3));
    const lm = C.own(new T.LineBasicMaterial({ color: 0x2af0ff, transparent: true, opacity: 0.18 })); C.world.add(new T.LineSegments(lg, lm));
    // the city: blocks on a grid all round, tall far off, low toward the camera so nothing stands in front of the board
    for (let x = -46; x <= 46; x += 3.4) for (let z = -34; z <= 34; z += 3.4) {
      const jx = x + (C.rand() - 0.5) * 0.6, jz = z + (C.rand() - 0.5) * 0.6, o = C.outside(jx, jz);
      if (o < 2.2 || C.rdist(jx, jz) < 3 || C.nearGoal(jx, jz, 4.5)) continue;
      const q = near(jx, jz), hmax = 1 + 12 * (1 - smooth(-4, 9, q)), h = 0.8 + C.rand() * hmax, w = 2 + C.rand() * 0.9, d = 2 + C.rand() * 0.9;
      put(C, "block", { x: jx, y: h / 2, z: jz, sx: w, sy: h, sz: d, c: [0x262c48, 0x2e3454, 0x22283e, 0x34305a][(C.rand() * 4) | 0] }, jx, jz);
      // lit windows on the two faces the camera sees, a neon edge on the roof
      const nc = NEON[(C.rand() * NEON.length) | 0];
      for (let y = 0.6; y < h - 0.3; y += 0.55) {
        if (C.rand() < 0.5) put(C, "lit", { x: jx + w / 2 + 0.02, y, z: jz, sx: 0.04, sy: 0.16, sz: d * (0.4 + C.rand() * 0.45), c: C.rand() < 0.75 ? 0xffe0a0 : nc, k: 1.15 }, jx, jz);
        if (C.rand() < 0.5) put(C, "lit", { x: jx, y, z: jz + d / 2 + 0.02, sx: w * (0.4 + C.rand() * 0.45), sy: 0.16, sz: 0.04, c: C.rand() < 0.75 ? 0xffe0a0 : nc, k: 1.15 }, jx, jz);
      }
      if (h > 2.4 || C.rand() < 0.15) {
        put(C, "lit", { x: jx, y: h + 0.03, z: jz + d / 2, sx: w, sy: 0.06, sz: 0.06, c: nc, k: 1.8 }, jx, jz);
        put(C, "lit", { x: jx + w / 2, y: h + 0.03, z: jz, sx: 0.06, sy: 0.06, sz: d, c: nc, k: 1.8 }, jx, jz);
      }
    }
    // traffic in the sky, crossing above the far side
    const carG = new T.BoxGeometry(0.7, 0.2, 0.35), headG = new T.BoxGeometry(0.06, 0.08, 0.3);
    for (let k = 0; k < 9; k++) {
      const g = new T.Group(), y = 5 + (k % 3) * 1.2, z = -22 + k * 2.2, sp = (k % 2 ? 1 : -1) * (3 + C.rand() * 3), ph = C.rand() * 80;
      g.add(new T.Mesh(carG, K.mat(0x1a1e2c)));
      const hd = new T.Mesh(headG, hotMat(0xffffff, 3)); hd.position.x = sp > 0 ? 0.36 : -0.36; g.add(hd);
      const tl = new T.Mesh(headG, hotMat(0xff2a4a, 2.6)); tl.position.x = sp > 0 ? -0.36 : 0.36; g.add(tl);
      g.position.set(0, y, z); C.world.add(g);
      C.anim(t => { g.position.x = ((t * sp + ph) % 90 + 90) % 90 - 45; });
    }
  },
  weather(C, V) {
    return dt => {
      // rain, and splashes where it lands
      for (let k = 0; k < 4; k++) if (Math.random() < dt * 22) { const [gx, gz] = onScreen(), [x, y, z] = Wd.under(gx, gz, 10); V.put(false, x, y, z, 0.8, -16, 0.8, 0.62, 0, 0, 0.05, 0.04, V.CELL.streak, 0.05, V.lin(0xa8c8ff, 1), 0.4, 0, 0); }
      if (Math.random() < dt * 10) { const [x, z] = onScreen(); V.burst(true, x, 0.03, z, 1, { cols: [0x9ab8ff], speed: [0, 0], life: [0.3, 0.3], size: [0.05, 0.35], cell: V.CELL.ring, k: 0.9, fixed: true }); }
      emitters(C, V, dt);
    };
  },
  props: {
    arch(g, look, i, C) {
      for (const s of [-1, 1]) { box(g, 0.4, 3.0, 0.5, 0x2a2d3a, s * 1.25, 1.5, 0); hbox(g, 0.06, 2.8, 0.06, s > 0 ? 0x2af0ff : 0xff3aa8, 2.6, s * 1.25 - s * 0.22, 1.5, 0.26); }
      box(g, 3.0, 0.4, 0.5, 0x2a2d3a, 0, 3.0, 0); hbox(g, 2.6, 0.06, 0.06, 0x2af0ff, 2.6, 0, 2.78, 0.26);
      hbox(g, 1.2, 0.24, 0.04, 0xff3aa8, 2.2, 0, 3.0, 0.27);
      portal(g, C, 0xff3aa8, 1.3, 0.85, 1.4);
    },
    lamp(g, look, i, C) {
      box(g, 0.08, 1.9, 0.08, 0x2a2d3a, 0, 0.95, 0); box(g, 0.5, 0.06, 0.06, 0x2a2d3a, 0.22, 1.88, 0, { ink: false });
      hbox(g, 0.4, 0.05, 0.1, i % 2 ? 0x2af0ff : 0xff3aa8, 3, 0.26, 1.82, 0);
    },
  },
};
P.coretower = (g, look, i, C) => {
  const dk = 0x232a44;
  mesh(g, cyl(1.9, 2.0, 0.3, 6), 0x2a2d3a, 0, 0.15, 0);
  hot(g, new T.TorusGeometry(1.95, 0.04, 4, 6), 0x2af0ff, 2.4, 0, 0.31, 0, { rx: PI / 2 });
  mesh(g, cyl(0.95, 1.2, 3.1, 6), dk, 0, 1.85, 0);
  mesh(g, cyl(0.7, 0.95, 2.0, 6), dk, 0, 6.0, 0);
  mesh(g, cyl(0.2, 0.2, 2.0, 6), 0x3a4060, 0, 4.2, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + PI / 6; hbox(g, 0.06, 2.9, 0.06, k % 2 ? 0x2af0ff : 0xff3aa8, 2.4, cos(a) * 1.05, 1.85, sin(a) * 1.05); box(g, 0.1, 2.0, 0.1, 0x3a4060, cos(a) * 0.82, 4.2, sin(a) * 0.82, { ink: 0.015 }); }
  hbox(g, 0.8, 1.0, 0.06, 0x2af0ff, 1.8, 0, 0.8, 1.15);
  const core = pivot(g, 0, 4.2, 0);
  const orb = hot(core, ball(0.62, 2), 0x9ff8ff, 3, 0, 0, 0, { own: 1 });
  hot(core, ball(0.95, 2), 0x2af0ff, 1.2, 0, 0, 0, { a: 0.18, add: true });
  const r1 = pivot(core), r2 = pivot(core);
  hot(r1, new T.TorusGeometry(1.25, 0.05, 6, 40), 0xff3aa8, 2.6); hot(r2, new T.TorusGeometry(1.45, 0.04, 6, 40), 0x2af0ff, 2.6);
  C.anim(t => { r1.rotation.set(t * 0.9, t * 0.4, 0); r2.rotation.set(0.6, -t * 0.7, t * 0.3); const k = 1 + sin(t * 3) * 0.08; orb.scale.setScalar(k); });
  mv(g, core);
  mesh(g, cyl(0.04, 0.04, 1.2, 4), 0x3a4060, 0, 7.6, 0, { ink: false });
  blink(g, C, 0, 8.25, 0, 0.1, 0xff2a4a, 3.2, 0.9);
  emit(g, C, "glint", 0, 4.2, 0);
};
P.tower = (g, look, i, C) => {
  const h = 3 + (i % 3) * 0.9, w = 2.2, col = [0x2a3050, 0x30284a, 0x263850][i % 3], nc = NEON[i % NEON.length];
  box(g, w, h, w, col, 0, h / 2, 0);
  for (let y = 0.7; y < h - 0.3; y += 0.6) for (let k = 0; k < 3; k++) {
    if ((k + Math.round(y * 3) + i) % 4) hbox(g, 0.5, 0.2, 0.04, (k + i) % 5 ? 0xffe0a0 : nc, 1.5, -0.7 + k * 0.7, y, w / 2 + 0.02);
    if ((k + Math.round(y * 5) + i) % 3) hbox(g, 0.04, 0.2, 0.5, (k + i) % 4 ? 0xffe0a0 : nc, 1.5, w / 2 + 0.02, y, -0.7 + k * 0.7);
  }
  hbox(g, 0.3, h * 0.6, 0.1, nc, 2.6, w / 2 - 0.25, h * 0.55, w / 2 + 0.12);
  for (let k = 0; k < 3; k++) hbox(g, 0.18, 0.18, 0.04, 0x161a28, 0.4, w / 2 - 0.25, h * 0.4 + k * 0.4, w / 2 + 0.18);
  box(g, 0.6, 0.4, 0.5, 0x3a4060, -0.4, h + 0.2, -0.3); box(g, 0.4, 0.3, 0.4, 0x3a4060, 0.5, h + 0.15, 0.4);
  mesh(g, cyl(0.03, 0.03, 1.0, 4), 0x3a4060, 0.6, h + 0.5, -0.6, { ink: false }); blink(g, C, 0.6, h + 1.02, -0.6, 0.06, 0xff2a4a, 3, 1.1);
  hbox(g, w + 0.04, 0.06, 0.06, nc, 2.6, 0, h, w / 2); hbox(g, 0.06, 0.06, w + 0.04, nc, 2.6, w / 2, h, 0);
};
P.billboard = (g, look, i, C) => {
  for (const s of [-1, 1]) box(g, 0.12, 2.0, 0.12, 0x2a2d3a, s * 0.75, 1.0, 0);
  box(g, 2.0, 1.1, 0.14, 0x1a1e2c, 0, 2.3, 0);
  const sc = hbox(g, 1.8, 0.92, 0.04, 0xff3aa8, 1.8, 0, 2.3, 0.08, { own: 1 }), ph = i * 2.1;
  for (let k = 0; k < 3; k++) hbox(g, 1.2 - k * 0.3, 0.1, 0.02, 0xffffff, 2, -0.2 + k * 0.1, 2.5 - k * 0.2, 0.11);
  C.anim(t => { sc.material.color.setHSL(((t * 0.05 + ph) % 1 + 1) % 1, 0.9, 0.5).multiplyScalar(1.8); });
  mv(g, sc);
};
P.vending = (g, look, i, C) => {
  const col = [0xc0283a, 0x2a5ab0, 0x7a3ab0][i % 3];
  box(g, 0.7, 1.4, 0.55, col, 0, 0.7, 0);
  hbox(g, 0.5, 0.8, 0.04, 0xd8f8ff, 1.5, -0.04, 0.85, 0.28);
  for (let k = 0; k < 3; k++) hbox(g, 0.06, 0.06, 0.03, NEON[k], 2.4, 0.26, 1.0 - k * 0.12, 0.29);
  box(g, 0.4, 0.12, 0.04, 0x1a1a22, -0.04, 0.25, 0.29, { ink: false });
};
P.holotree = (g, look, i, C) => {
  mesh(g, cyl(0.42, 0.48, 0.4, 8), 0x2a2d3a, 0, 0.2, 0); hot(g, cyl(0.38, 0.38, 0.02, 8), 0x2af0ff, 2, 0, 0.41, 0);
  hot(g, cyl(0.05, 0.08, 1.2, 6), 0x2af0ff, 1.6, 0, 1.0, 0, { a: 0.7 });
  const p = pivot(g, 0, 1.9, 0), cr = pivot(p);
  const wf = hot(cr, ball(0.65, 1), 0x2af0ff, 1.5, 0, 0, 0, { own: 1 }); wf.material.wireframe = true;
  hot(cr, ball(0.6, 1), i % 2 ? 0x2af0ff : 0x3aff9a, 1, 0, 0, 0, { a: 0.1, add: true });
  C.anim(t => { cr.rotation.y = t * 0.5; cr.position.y = sin(t * 1.3 + i) * 0.06; });
  mv(g, p);
};
P.car = (g, look, i, C) => {
  const col = [0xd8305a, 0x3a6ad8, 0xe8e8f0][i % 3], p = pivot(g, 0, 0, 0), c = pivot(p);
  box(c, 1.5, 0.32, 0.78, col, 0, 0.42, 0);
  box(c, 0.8, 0.26, 0.66, 0x1a2a3a, -0.1, 0.7, 0, { ink: 0.02 });
  for (const s of [-1, 1]) { hbox(c, 0.04, 0.08, 0.18, 0xffffff, 3, 0.76, 0.45, s * 0.26); hbox(c, 0.04, 0.08, 0.2, 0xff2a4a, 2.6, -0.76, 0.45, s * 0.26); }
  hot(c, new T.PlaneGeometry(1.5, 0.75), NEON[i % 2 ? 0 : 1], 1.4, 0, 0.2, 0, { a: 0.5, add: true, rx: -PI / 2 });
  C.anim(t => { c.position.y = sin(t * 2 + i) * 0.05; });
  mv(g, p);
};

// ---------------- 8: Starfall Expanse, space ----------------
function spaceSky(C) {
  const c = document.createElement("canvas"); c.width = 2048; c.height = 1024;
  const x = c.getContext("2d"), r = Math.random;
  const g = x.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, "#0a0622"); g.addColorStop(0.5, "#140a34"); g.addColorStop(1, "#060a18");
  x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);
  x.globalCompositeOperation = "lighter";
  const neb = [[380, 240, 520, "255,60,170", 0.2], [720, 420, 460, "140,70,255", 0.22], [1520, 660, 620, "40,200,255", 0.16], [1260, 280, 400, "255,140,60", 0.1], [260, 820, 420, "90,120,255", 0.15], [1820, 180, 380, "200,80,255", 0.15], [1000, 560, 300, "255,90,140", 0.08]];
  for (const [cx, cy, rad, col, a] of neb) for (let k = 0; k < 9; k++) {
    const ox = cx + (r() - 0.5) * rad * 0.9, oy = cy + (r() - 0.5) * rad * 0.5, rr = rad * (0.3 + r() * 0.5), gr = x.createRadialGradient(ox, oy, 0, ox, oy, rr);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gr; x.fillRect(ox - rr, oy - rr, rr * 2, rr * 2);
  }
  // dark dust lanes through the clouds
  x.globalCompositeOperation = "source-over";
  for (let k = 0; k < 40; k++) { const t = k / 40, px = 200 + t * 1700, py = 700 - t * 520 + sin(t * 9) * 60, rr = 40 + r() * 70, gr = x.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, "rgba(4,2,12,0.35)"); gr.addColorStop(1, "rgba(4,2,12,0)"); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  x.globalCompositeOperation = "lighter";
  for (let k = 0; k < 2600; k++) { const s = r() < 0.92 ? 1 : 2, tint = [[255, 255, 255], [180, 210, 255], [255, 230, 190], [255, 190, 230]][(r() * 4) | 0]; x.fillStyle = `rgba(${tint},${0.25 + r() * 0.7})`; x.fillRect(r() * 2048, r() * 1024, s, s); }
  for (let k = 0; k < 26; k++) {
    const px = r() * 2048, py = r() * 1024, rr = 8 + r() * 14, gr = x.createRadialGradient(px, py, 0, px, py, rr);
    gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.3, "rgba(200,220,255,0.3)"); gr.addColorStop(1, "rgba(200,220,255,0)"); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    x.fillStyle = "rgba(255,255,255,0.5)"; x.fillRect(px - rr * 1.6, py - 0.5, rr * 3.2, 1); x.fillRect(px - 0.5, py - rr * 1.6, 1, rr * 3.2);
  }
  const t = C.tex(new T.CanvasTexture(c)); t.colorSpace = T.SRGBColorSpace;
  return t;
}
const DISC_V = `varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// the black hole's disc: white-hot at the inside edge, cooling to orange and red, in swirling bands that turn
const DISC_F = `uniform float uT, uR0, uR1, uK; varying vec3 vP;
void main() {
  float r = length(vP.xy), a = atan(vP.y, vP.x), t = clamp((r - uR0) / (uR1 - uR0), 0.0, 1.0), u = 1.0 - t;
  float sw = 0.5 + 0.5 * sin(a * 3.0 - uT * 1.6 + r * 1.4), s2 = 0.5 + 0.5 * sin(a * 9.0 + uT * 2.7 - r * 2.2);
  float b = u * u * (0.55 + 0.45 * sw) * (0.75 + 0.25 * s2);
  vec3 c = mix(vec3(1.0, 0.3, 0.06), vec3(1.0, 0.8, 0.5), u * u * u);
  c = mix(c, vec3(1.0), u * u * u * u * u * u);
  float al = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.75, 1.0, t));
  gl_FragColor = vec4(c * b * uK, al * b);
}`;
// a ringed planet's rings: fine bands with a gap
const RING_F = `varying vec3 vP; uniform float uR0, uR1;
void main() {
  float t = clamp((length(vP.xy) - uR0) / (uR1 - uR0), 0.0, 1.0);
  float b = 0.55 + 0.45 * sin(t * 38.0) * sin(t * 11.0 + 1.0), gap = smoothstep(0.42, 0.45, t) * (1.0 - smoothstep(0.5, 0.53, t));
  float a = (1.0 - gap * 0.85) * smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.9, 1.0, t)) * b * 0.8;
  gl_FragColor = vec4(mix(vec3(0.95, 0.8, 0.62), vec3(0.75, 0.52, 0.46), t) * 1.15, a);
}`;
// the rainbow road: hue runs along it and drifts with time, chevrons move the way the enemies walk, the edges glow,
// the sides are a darker band (|aS| past 1)
const RAIN_V = `attribute float aD, aS; varying float vD, vS; void main() { vD = aD; vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RAIN_F = `uniform float uT; varying float vD, vS;
vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
void main() {
  float s = abs(vS);
  vec3 c = mix(hue(vD * 0.028 - uT * 0.08), vec3(1.0), 0.12);
  float chev = 0.8 + 0.2 * step(0.5, fract(vD * 0.55 - uT * 1.1 - s * 0.35));
  vec3 top = c * 0.78 * chev + c * smoothstep(0.8, 1.0, s) * 0.95;
  gl_FragColor = vec4(s > 1.02 ? c * 0.3 : top, 1.0);
}`;
Wd.space = {
  // (29 Oct, request: "theres a lot of empty space like genuine nothing just the background, and the road itself is
  // rainbow, that the enemies walk on. Then you can only place the units on the "meteors" or just platforms floating
  // next to that road and in the middle"): no ground at all; the platforms come from the map (TD.MAP.space.pads)
  fog: 0x0a0820, fogFar: 0, hemi: [0x9a8aff, 0x2a1a4a, 1.0], sun: [0xfff4ea, 2.2], noGround: true,
  ground: { a: 0x4c4468, b: 0x5a5278, low: 0x3c3658, worn: 0x6a6290 },
  road: { custom: true, dirt: 0, edge: 0, pebbles: null },
  tufts: null,
  lights: [[0xffc860, 8, 15, 4, 1.5, 18], [0xb05aff, 8, -15.8, 3, 5.6, 14]],
  extras(C) {
    const U = Wd.under;
    C.scene.background = spaceSky(C);
    // stars in front of the backdrop, bright enough to bloom, twinkling
    for (let L = 0; L < 2; L++) {
      const n = 420, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), cc = new T.Color();
      for (let k = 0; k < n; k++) { const [x, y, z] = U((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 56, -20 - Math.random() * 40); pos.set([x, y, z], k * 3); cc.set([0xffffff, 0xbfd8ff, 0xffe0c0, 0xffc0ec][k % 4]).multiplyScalar(1.5 + Math.random() * 2.5); col.set([cc.r, cc.g, cc.b], k * 3); }
      const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(pos, 3)); sg.setAttribute("color", new T.BufferAttribute(col, 3));
      const sm = C.own(new T.PointsMaterial({ size: L ? 2.4 : 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false }));
      C.world.add(new T.Points(sg, sm));
      C.anim(t => { sm.opacity = 0.55 + sin(t * (L ? 2.3 : 1.7) + L * 2) * 0.4; });
    }
    // a ringed planet, high on the left
    const pg = new T.SphereGeometry(6, 48, 32), pc = new Float32Array(pg.attributes.position.count * 3), c1 = new T.Color(), c2 = new T.Color();
    for (let k = 0; k < pg.attributes.position.count; k++) { const y = pg.attributes.position.getY(k), b = 0.5 + 0.5 * sin(y * 1.9 + sin(y * 0.7) * 2.2); c1.set(0xd89a6a).lerp(c2.set(0x9a5a8a), b); if (abs(y - 1.4) < 0.5) c1.lerp(c2.set(0xf0d0a0), 0.6); pc.set([c1.r, c1.g, c1.b], k * 3); }
    pg.setAttribute("color", new T.BufferAttribute(pc, 3));
    const planet = new T.Group(), [px, py, pz] = U(...onScr(-10.5, 10), -26); planet.position.set(px, py, pz); planet.rotation.set(0.35, 0, 0.3); C.world.add(planet);
    const pm = new T.Mesh(pg, C.own(new T.MeshToonMaterial({ vertexColors: true, gradientMap: ramp() }))); planet.add(pm);
    const ring = new T.Mesh(new T.RingGeometry(8, 13.5, 120, 1), C.own(new T.ShaderMaterial({ vertexShader: DISC_V, fragmentShader: RING_F, uniforms: { uR0: { value: 8 }, uR1: { value: 13.5 } }, transparent: true, depthWrite: false, side: T.DoubleSide })));
    ring.rotation.x = -1.25; planet.add(ring);
    C.anim(t => { pm.rotation.y = t * 0.03; });
    // a small moon low on the left
    const [mx, my, mz] = U(...onScr(-13, -6.5), -14), moon = new T.Mesh(new T.IcosahedronGeometry(1.8, 2), C.own(new T.MeshToonMaterial({ color: 0x9aa4c8, gradientMap: ramp() }))); moon.position.set(mx, my, mz); C.world.add(moon);
    // the black hole, high on the right: a disc seen nearly edge on, its far side bent up over the top (a second disc
    // facing the camera), a thin ring of light round the dark
    const bh = new T.Group(), [bx, by, bz] = U(...onScr(10.5, 8.5), -18), dir = new T.Vector3(16, 30, 28).normalize();
    bh.position.set(bx, by, bz); C.world.add(bh);
    bh.add(new T.Mesh(new T.SphereGeometry(2.3, 32, 16), C.own(new T.MeshBasicMaterial({ color: 0x000000, fog: false }))));
    const discMat = (R0, R1, k) => C.own(new T.ShaderMaterial({ vertexShader: DISC_V, fragmentShader: DISC_F, uniforms: { uT: { value: 0 }, uR0: { value: R0 }, uR1: { value: R1 }, uK: { value: k } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
    const flat = new T.Mesh(new T.RingGeometry(2.6, 9, 160, 1), discMat(2.6, 9, 2.2)), face = new T.Mesh(new T.RingGeometry(2.45, 5.2, 160, 1), discMat(2.45, 5.2, 1.6));
    flat.lookAt(dir); flat.rotateX(-1.36); face.lookAt(dir);
    bh.add(flat, face);
    const halo = new T.Mesh(new T.TorusGeometry(2.42, 0.05, 6, 80), hotMat(0xfff0d8, 2.2)); halo.lookAt(dir); bh.add(halo);
    C.anim(t => { flat.material.uniforms.uT.value = t; face.material.uniforms.uT.value = -t * 1.3; });
    // rocks drifting round the shelf at every depth, tumbling
    const N = 30, ag = new T.IcosahedronGeometry(1, 0), am = C.own(new T.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp() }));
    const rocksM = new T.InstancedMesh(ag, am, N), inkM = new T.InstancedMesh(ag, C.own(new T.MeshBasicMaterial({ color: 0x07070a, side: T.BackSide })), N);
    const A = [], m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s = new T.Vector3(), cc = new T.Color();
    for (let k = 0; k < N; k++) { A.push({ r: 20 + Math.random() * 16, a: Math.random() * TAU, y: -7 - Math.random() * 16, sp: (0.01 + Math.random() * 0.025) * (k % 5 ? 1 : -1), s: 0.3 + Math.random() * Math.random() * 1.6, rx: Math.random() * 3, rs: (Math.random() - 0.5) * 0.8 }); rocksM.setColorAt(k, cc.set([0x5a5278, 0x4a4266, 0x6a5a7a][k % 3])); }
    rocksM.castShadow = false; C.world.add(rocksM, inkM);
    C.anim(t => {
      for (let k = 0; k < N; k++) {
        const r = A[k], a = r.a + t * r.sp; v.set(cos(a) * r.r * 1.25, r.y + sin(t * 0.3 + k) * 0.3, sin(a) * r.r * 0.85); e.set(r.rx + t * r.rs, t * r.rs * 0.7, 0); q.setFromEuler(e);
        s.setScalar(r.s); m4.compose(v, q, s); rocksM.setMatrixAt(k, m4); s.setScalar(r.s * 1.08); m4.compose(v, q, s); inkM.setMatrixAt(k, m4);
      }
      rocksM.instanceMatrix.needsUpdate = true; inkM.instanceMatrix.needsUpdate = true;
    });
    // the road: a rainbow bridge over nothing, its colours running the way the enemies walk, its edges glowing
    const RP = C.pts, rpos = [], rd = [], rs = [], ri = [], w = C.map.roadW / 2;
    let dist = 0;
    for (let i = 0; i < RP.length; i++) {
      if (i) dist += Math.hypot(RP[i][0] - RP[i - 1][0], RP[i][1] - RP[i - 1][1]);
      const a = RP[max(0, i - 1)], b = RP[min(RP.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
      for (const [k, y, sd] of [[-1, -0.34, -1.3], [-1, 0.03, -1], [1, 0.03, 1], [1, -0.34, 1.3]]) { rpos.push(RP[i][0] + nx * w * k, y, RP[i][1] + nz * w * k); rd.push(dist); rs.push(sd); }
      if (i) for (let j = 0; j < 3; j++) { const q = (i - 1) * 4 + j; ri.push(q, q + 4, q + 1, q + 1, q + 4, q + 5); }
    }
    const rg = new T.BufferGeometry();
    rg.setAttribute("position", new T.Float32BufferAttribute(rpos, 3)); rg.setAttribute("aD", new T.Float32BufferAttribute(rd, 1)); rg.setAttribute("aS", new T.Float32BufferAttribute(rs, 1)); rg.setIndex(ri);
    const rm = C.own(new T.ShaderMaterial({ vertexShader: RAIN_V, fragmentShader: RAIN_F, uniforms: { uT: { value: 0 } }, side: T.DoubleSide }));
    C.world.add(new T.Mesh(rg, rm));
    C.anim(t => { rm.uniforms.uT.value = t; });
    // the platforms units stand on: a flat top with a glowing rim, rock tapering away underneath
    C.map.pads.forEach(([x, z, r], i) => {
      const g = pivot(C.still, x, 0, z), ry = C.rand() * 3;
      mesh(g, cyl(r, r * 0.9, 0.42, 9), 0x5a5278, 0, -0.21, 0, { ry });
      mesh(g, cyl(r * 0.84, r * 0.84, 0.02, 9), 0x6c639a, 0, 0.006, 0, { ry, ink: false });
      mesh(g, cone(r * 0.9, r * 1.7, 9), 0x3a3456, 0, -0.42 - r * 0.85, 0, { rx: PI, ry });
      hot(g, new T.TorusGeometry(r * 0.96, 0.035, 4, 40), 0x6af0ff, 1.5, 0, 0.03, 0, { rx: PI / 2 });
      for (let k = 0; k < 2; k++) { const a = ry + k * 2.6 + 0.5; hot(g, new T.OctahedronGeometry(0.12, 0), [0xff4ad8, 0x6af0ff][(i + k) % 2], 2, cos(a) * r * 0.5, -0.9 - k * 0.4, sin(a) * r * 0.5).scale.y = 2.4; }
      const a = ry + 1.2; for (let k = 0; k < 3; k++) hot(g, new T.OctahedronGeometry(0.09, 0), [0xff4ad8, 0x6af0ff, 0xa86aff][(i + k) % 3], 2, cos(a + k * 0.25) * r * 0.86, 0.12, sin(a + k * 0.25) * r * 0.86, { rz: (k - 1) * 0.4 }).scale.y = 2.2;
    });
    // scenery out past the edges: little rocks with a dish, a dome, pylons and crystals on them
    [[-16, -5, "dish"], [16.5, -7, "dome"], [-15, 9, "pylon"], [7.5, 10.5, "crystals"], [17, 6.5, "meteor"], [-6, -10.5, "pylon"], [3, -10.5, "crystals"]].forEach(([x, z, kind], i) => {
      if (C.rdist(x, z) < 3) return;
      const g = pivot(C.still, x, 0, z); g.rotation.y = i;
      mesh(g, cyl(1.4, 1.2, 0.4, 8), 0x5a5278, 0, -0.2, 0); mesh(g, cone(1.25, 2.6, 8), 0x3a3456, 0, -1.7, 0, { rx: PI });
      P[kind](g, 0, i, C);
    });
    // soft coloured glows deep behind everything
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const gx = cv.getContext("2d"), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
    const gt = C.tex(new T.CanvasTexture(gx.canvas));
    [[-10, -16, 0xff3aa8, 30], [14, 14, 0x3a8aff, 34], [0, -2, 0x8a4aff, 40]].forEach(([gx2, gz2, col, sz]) => {
      const m = new T.Mesh(new T.PlaneGeometry(sz, sz), C.own(new T.MeshBasicMaterial({ map: gt, color: col, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false, fog: false })));
      const [x, y, z] = U(gx2, gz2, -45); m.position.set(x, y, z); m.lookAt(x + dir.x, y + dir.y, z + dir.z); m.renderOrder = -1; C.world.add(m);
    });
  },
  weather(C, V) {
    let shoot = 0.5, comet = 6;
    return dt => {
      // stardust lifting off the shelf
      if (Math.random() < dt * 10) { const pd = C.map.pads[(Math.random() * C.map.pads.length) | 0], a = Math.random() * TAU, rr = Math.random() * pd[2], x = pd[0] + cos(a) * rr, z = pd[1] + sin(a) * rr; drift(V, true, x, 0.05, z, (Math.random() - 0.5) * 0.2, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.2, 2.5, 0.07, 0.02, V.CELL.hot, [0xb06aff, 0x6af0ff, 0xff8ad8][(Math.random() * 3) | 0], 2.2, 1); }
      // shooting stars far below, now and then
      shoot -= dt;
      if (shoot <= 0) {
        shoot = 0.4 + Math.random() * 1.4;
        const [gx, gz] = onScreen(), d = -12 - Math.random() * 25, [x, y, z] = Wd.under(gx - 10, gz - 6, d), sp = 28 + Math.random() * 20;
        V.put(true, x, y, z, sp * 0.8, -sp * 0.1, sp * 0.55, 0.7, 0, 0, 0.35, 0.05, V.CELL.streak, 0.07, V.lin(0xdfe8ff, 3), 1, 0, 0);
      }
      // a comet crossing slowly, its tail streaming
      comet -= dt;
      if (comet <= 0) { comet = 9 + Math.random() * 8; C.cometT = 0; C.cometA = [-30 + Math.random() * 10, -16 + Math.random() * 10]; }
      if (C.cometT != null) {
        C.cometT += dt; const k = C.cometT / 7;
        if (k > 1) C.cometT = null;
        else { const [x, y, z] = Wd.under(C.cometA[0] + k * 60, C.cometA[1] + k * 26, -9); V.burst(true, x, y, z, 3, { cols: [0x9ff0ff, 0xffffff, 0x6aa8ff], speed: [0.2, 1.2], dir: [-1, 0, -0.45], cone: 0.25, life: [0.6, 1.4], size: [0.4, 0.05], cell: V.CELL.hot, k: 2.6, drag: 0.6 }); }
      }
      emitters(C, V, dt);
    };
  },
  props: {
    // the warp gate: a ring standing on struts, its swirl violet
    arch(g, look, i, C) {
      mesh(g, cyl(1.8, 1.5, 0.4, 8), 0x5a5278, 0, -0.2, 0); mesh(g, cone(1.6, 3, 8), 0x3a3456, 0, -1.9, 0, { rx: PI });
      const r = pivot(g, 0, 1.7, 0);
      mesh(r, new T.TorusGeometry(1.45, 0.2, 8, 36), 0x4a4a70, 0, 0, 0);
      hot(r, new T.TorusGeometry(1.45, 0.07, 6, 48), 0xb05aff, 2.6, 0, 0, 0.16);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; hbox(r, 0.14, 0.14, 0.4, 0x6af0ff, 2.6, cos(a) * 1.45, sin(a) * 1.45, 0); }
      for (const s of [-1, 1]) box(g, 0.25, 1.4, 0.4, 0x3a3a5a, s * 1.05, 0.45, 0, { rz: s * 0.4 });
      portal(g, C, 0xb05aff, 1.7, 1.25, 1);
      const sp = pivot(g, 0, 1.7, 0.02), sr = hot(sp, new T.RingGeometry(0.2, 1.2, 40, 1, 0, PI * 1.2), 0x6af0ff, 1.6, 0, 0, 0, { a: 0.4, add: true });
      C.anim(t => { sr.rotation.z = t * 2.4; }); mv(g, sp);
    },
    lamp(g, look, i, C) {
      mesh(g, ball(0.22, 0), 0x4a4266, 0, 0.55, 0).scale.y = 0.6;
      const p = pivot(g, 0, 1.0, 0), c = pivot(p);
      hot(c, new T.OctahedronGeometry(0.16, 0), i % 2 ? 0x6af0ff : 0xff4ad8, 3, 0, 0, 0).scale.y = 1.6;
      C.anim(t => { c.rotation.y = t * 1.5; c.position.y = sin(t * 1.8 + i) * 0.08; }); mv(g, p);
    },
  },
};
P.starcore = (g, look, i, C) => {
  mesh(g, cyl(2.3, 2.0, 0.4, 9), 0x5a5278, 0, -0.2, 0); mesh(g, cone(2.1, 3.6, 9), 0x3a3456, 0, -2.2, 0, { rx: PI });
  mesh(g, cyl(1.9, 1.2, 0.9, 8), 0x4a4266, 0, 0.45, 0);
  mesh(g, cyl(1.5, 1.6, 0.25, 8), 0x5a5278, 0, 1.0, 0, { ink: 0.02 });
  hot(g, new T.TorusGeometry(1.55, 0.05, 4, 8), 0xffc860, 2.6, 0, 1.14, 0, { rx: PI / 2 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; hot(g, new T.OctahedronGeometry(0.22, 0), [0xff4ad8, 0x6af0ff][k % 2], 2.2, cos(a) * 1.75, 0.7, sin(a) * 1.75, { rz: cos(a) * 0.5, rx: sin(a) * 0.5 }).scale.y = 2.4; }
  const core = pivot(g, 0, 3.3, 0);
  const star = hot(core, ball(0.85, 3), 0xfff2c8, 1.5, 0, 0, 0, { own: 1 });
  hot(core, ball(1.25, 3), 0xffb84a, 1.1, 0, 0, 0, { a: 0.05, add: true });
  hot(core, ball(1.8, 3), 0xff7a3a, 1, 0, 0, 0, { a: 0.04, add: true });
  const rings = [[1.6, 0xffc860], [1.95, 0xb05aff], [2.3, 0x6af0ff]].map(([r, col]) => { const p = pivot(core); hot(p, new T.TorusGeometry(r, 0.045, 6, 64), col, 1.9); return p; });
  const moons = pivot(core); for (let k = 0; k < 3; k++) hot(moons, ball(0.12, 1), 0xffffff, 3, cos(k * 2.1) * 2.7, 0, sin(k * 2.1) * 2.7);
  hot(g, new T.CylinderGeometry(0.3, 0.75, 14, 16, 1, true), 0xffd890, 1.2, 0, 3.3 + 7, 0, { a: 0.06, add: true });
  C.anim(t => {
    star.scale.setScalar(1 + sin(t * 2.2) * 0.06);
    rings[0].rotation.set(t * 0.7, 0, 0.3); rings[1].rotation.set(0.9, t * 0.5, t * 0.2); rings[2].rotation.set(-0.5, -t * 0.4, t * 0.6);
    moons.rotation.y = t * 0.9; core.position.y = 3.3 + sin(t * 1.1) * 0.1;
  });
  mv(g, core); emit(g, C, "glint", 0, 3.3, 0);
};
P.crystals = (g, look, i, C) => {
  mesh(g, ball(0.5, 0), 0x3a3456, 0, 0.1, 0).scale.y = 0.5;
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + i; hot(g, new T.OctahedronGeometry(0.28, 0), [0xff4ad8, 0x6af0ff, 0xa86aff][(k + i) % 3], 2, cos(a) * 0.25, 0.55, sin(a) * 0.25, { rz: cos(a) * 0.45, rx: sin(a) * 0.45 }).scale.y = 2.4 + (k % 2) * 0.8; }
};
P.dish = (g, look, i, C) => {
  box(g, 0.9, 0.3, 0.9, 0x5a5a78, 0, 0.15, 0); mesh(g, cyl(0.1, 0.12, 1.0, 8), 0x8a90b0, 0, 0.8, 0);
  const p = pivot(g, 0, 1.3, 0), d = pivot(p); d.rotation.x = -0.7;
  const dm = mesh(d, new T.SphereGeometry(0.85, 20, 8, 0, TAU, 0, 0.9), 0xd8dcf0, 0, 0, 0, { rx: PI, own: 1, ink: false }); dm.material.side = T.DoubleSide;
  mesh(d, cyl(0.03, 0.03, 0.8, 4), 0x8a90b0, 0, 0.1, 0, { ink: false }); hot(d, ball(0.07, 1), 0xff2a4a, 3, 0, 0.5, 0);
  C.anim(t => { d.rotation.y = sin(t * 0.25 + i) * 0.8; }); mv(g, p);
};
P.meteor = (g, look, i, C) => {
  hot(g, new T.RingGeometry(0.75, 1.2, 20), 0x1a1426, 1, 0, 0.02, 0, { rx: -PI / 2 });
  const m = mesh(g, ball(0.7, 0), 0x3a3040, 0, 0.45, 0, { ry: i }); m.scale.set(1, 0.85, 0.95);
  for (let k = 0; k < 5; k++) hbox(m, 0.05, 0.9, 0.05, 0xff7a3a, 2.4, cos(k * 1.3) * 0.5, 0, sin(k * 1.3) * 0.5, { rz: k * 0.7, rx: k * 0.4 });
  for (let k = 0; k < 3; k++) mesh(g, ball(0.16, 0), 0x3a3040, cos(k * 2) * 1.0, 0.08, sin(k * 2) * 1.0);
  emit(g, C, "spark", 0, 0.9, 0);
};
P.pylon = (g, look, i, C) => {
  mesh(g, cyl(0.4, 0.45, 0.2, 6), 0x3a3a5a, 0, 0.1, 0); mesh(g, cyl(0.1, 0.16, 1.4, 6), 0x8a90b0, 0, 0.9, 0);
  hot(g, new T.TorusGeometry(0.28, 0.04, 4, 16), 0x6af0ff, 2.4, 0, 1.6, 0, { rx: PI / 2 });
  const p = pivot(g, 0, 2.0, 0), o = pivot(p);
  hot(o, ball(0.18, 2), 0xbff8ff, 3.2); hot(o, ball(0.32, 2), 0x6af0ff, 1, 0, 0, 0, { a: 0.25, add: true });
  const orb = pivot(o); for (let k = 0; k < 3; k++) hot(orb, ball(0.05, 1), 0xff4ad8, 3, cos(k * 2.1) * 0.45, 0, sin(k * 2.1) * 0.45);
  C.anim(t => { o.position.y = sin(t * 2 + i) * 0.1; orb.rotation.set(0.4, t * 2.4, 0); }); mv(g, p);
};
P.dome = (g, look, i, C) => {
  mesh(g, cyl(1.1, 1.15, 0.25, 16), 0x5a5a78, 0, 0.12, 0);
  hot(g, new T.TorusGeometry(1.1, 0.04, 4, 32), 0x6af0ff, 2.2, 0, 0.26, 0, { rx: PI / 2 });
  for (let k = 0; k < 4; k++) mesh(g, cone(0.12, 0.45 + k * 0.1, 6), 0x3aaa6a, cos(k * 1.6) * 0.5, 0.45, sin(k * 1.6) * 0.5);
  hot(g, ball(0.12, 1), 0xfff0c0, 2.4, 0, 0.75, 0);
  const glass = new T.Mesh(new T.SphereGeometry(1.05, 24, 10, 0, TAU, 0, PI / 2), C.own(new T.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.22, depthWrite: false })));
  glass.position.y = 0.25; g.add(glass); mv(g, glass);
  mesh(g, cyl(0.025, 0.025, 0.7, 4), 0x8a90b0, 0.5, 1.2, -0.4, { ink: false }); blink(g, C, 0.5, 1.58, -0.4, 0.05, 0xff2a4a, 3, 1.3);
};

// ======================= the enemies =======================
// each builds about one unit tall facing +z; L takes the pivots that swing as it walks; anim(w) runs every frame
const eyes = (b, x, y, z, col, k = 2.6, s = 0.08) => { for (const e of [-1, 1]) hbox(b, s, s, 0.03, col, k, e * x, y, z); };
// ---- the coast ----
F.crab = (g, L) => {
  const b = pivot(g, 0, 0.35, 0), c = 0xd8502e;
  box(b, 0.9, 0.32, 0.66, c, 0, 0, 0); box(b, 0.7, 0.14, 0.5, 0xe8703e, 0, 0.2, 0, { ink: 0.015 });
  for (const s of [-1, 1]) { box(b, 0.05, 0.22, 0.05, c, s * 0.14, 0.32, 0.25, { ink: false }); box(b, 0.1, 0.1, 0.08, 0xffffff, s * 0.14, 0.45, 0.25, { ink: 0.01 }); box(b, 0.05, 0.05, 0.03, 0x0b0d16, s * 0.14, 0.45, 0.3, { ink: false }); }
  const claws = [-1, 1].map(s => { const p = pivot(b, s * 0.42, 0.02, 0.3); box(p, 0.16, 0.14, 0.4, c, 0, 0, 0.15); box(p, 0.26, 0.2, 0.2, 0xe8703e, 0, 0, 0.42); box(p, 0.1, 0.08, 0.24, c, s * 0.06, 0.1, 0.55, { ink: 0.015 }); return p; });
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const l = pivot(g, s * 0.42, 0.32, -0.2 + k * 0.2); box(l, 0.42, 0.06, 0.06, 0xc0402a, s * 0.2, -0.12, 0, { rz: -s * 0.6, ink: 0.01 }); L.push(l); }
  g.userData.anim = w => { claws.forEach((p, i) => { p.rotation.y = (i ? -1 : 1) * (0.2 + sin(w * 2) * 0.25); }); b.rotation.z = sin(w * 2) * 0.08; };
};
F.gull = (g, L) => {
  const b = pivot(g, 0, 1.0, 0);
  box(b, 0.36, 0.34, 0.66, 0xf4f4f0, 0, 0, 0); box(b, 0.3, 0.28, 0.3, 0xffffff, 0, 0.2, 0.36);
  mesh(b, cone(0.07, 0.28, 4), 0xffc83a, 0, 0.16, 0.62, { rx: PI / 2, ry: PI / 4, ink: 0.015 });
  eyes(b, 0.1, 0.26, 0.5, 0x1a1a22, 1, 0.06);
  box(b, 0.3, 0.06, 0.26, 0x8a929a, 0, 0.06, -0.42, { rx: -0.3 });
  const W = flap(b, 0x9aa2aa, 0.8, 0.4, 0.17, 0.1);
  W.forEach(p => box(p, 0.25, 0.07, 0.38, 0x2a2d35, (p.position.x > 0 ? 1 : -1) * 0.7, 0, 0, { ink: 0.012 }));
  g.userData.anim = w => { W.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (-0.1 + sin(w * 2.2) * 0.6); }); b.position.y = 1.0 + sin(w * 1.1) * 0.15; };
};
F.barnacle = (g, L) => {
  const b = pivot(g, 0, 0.6, 0);
  mesh(b, ball(0.62, 1), 0x5f7f7a, 0, 0.3, 0).scale.set(1.1, 0.95, 0.95);
  for (let k = 0; k < 10; k++) { const a = k * 2.4, y = 0.1 + (k % 4) * 0.2; mesh(b, cone(0.1, 0.18, 6), 0xe8e4d8, cos(a) * 0.55, 0.3 + y * 0.5, sin(a) * 0.5, { rz: -cos(a) * 1.0, rx: sin(a) * 1.0, ink: 0.01 }); }
  for (let k = 0; k < 4; k++) box(b, 0.05, 0.6, 0.05, 0x3a7a3a, -0.3 + k * 0.2, -0.05, 0.5, { rz: (k - 1.5) * 0.2, ink: false });
  eyes(b, 0.15, 0.55, 0.55, 0x5affd0, 2.4, 0.1);
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.7, 0.5, 0); box(p, 0.34, 0.8, 0.36, 0x4f6f6a, 0, -0.32, 0); mesh(p, ball(0.26, 0), 0x6a8a84, 0, -0.78, 0.04); return p; });
  L.push(...legs(g, 0x4f6f6a, 0.3, 0.6, 0, 0.3));
  g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = sin(w + i * PI) * 0.5; }); };
};
F.kraken = (g, L) => {
  const b = pivot(g, 0, 1.2, 0), c = 0x7a3a8a;
  mesh(b, ball(0.75, 2), c, 0, 0.45, 0).scale.set(1, 1.25, 0.95);
  for (const s of [-1, 1]) { mesh(b, ball(0.2, 1), 0xfff0a0, s * 0.3, 0.35, 0.6, { ink: 0.015 }); hbox(b, 0.08, 0.2, 0.04, 0x1a0a20, 1, s * 0.3, 0.35, 0.8); }
  for (let k = 0; k < 6; k++) mesh(b, ball(0.09, 0), 0xc86aa8, cos(k) * 0.5, 1.05 + (k % 2) * 0.12, sin(k) * 0.4, { ink: 0.01 });
  const T6 = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU, root = pivot(g, cos(a) * 0.5, 0.75, sin(a) * 0.5); root.rotation.y = -a + PI / 2;
    let p = root; const segs = [];
    for (let j = 0; j < 4; j++) { const q = pivot(p, 0, 0, j ? 0.32 : 0); mesh(q, cyl(0.15 - j * 0.03, 0.18 - j * 0.03, 0.36, 8), c, 0, 0, 0.16, { rx: PI / 2 }); mesh(q, ball(0.04, 0), 0xe8a0c8, 0, -0.12, 0.16, { ink: false }); segs.push(q); p = q; }
    T6.push(segs);
  }
  g.userData.anim = w => { b.position.y = 1.2 + sin(w * 0.8) * 0.12; T6.forEach((s, i) => s.forEach((q, j) => { q.rotation.x = 0.35 + sin(w * 1.2 + i + j * 0.8) * 0.35; q.rotation.y = sin(w * 0.9 + i * 2 + j) * 0.25; })); };
};
// ---- the desert ----
F.scarab = (g, L) => {
  const b = pivot(g, 0, 0.36, 0);
  mesh(b, ball(0.45, 1), 0x2a5a7a, 0, 0, -0.05).scale.set(1, 0.62, 1.3);
  hbox(b, 0.04, 0.12, 0.9, 0xffcc50, 1.2, 0, 0.27, -0.05);
  box(b, 0.36, 0.22, 0.26, 0x1e4a66, 0, 0, 0.55); mesh(b, cone(0.07, 0.36, 4), 0xffcc50, 0, 0.14, 0.75, { rx: 1.0, ink: 0.01 });
  eyes(b, 0.12, 0.06, 0.69, 0x5af0ff, 2.6, 0.07);
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const l = pivot(g, s * 0.36, 0.3, -0.25 + k * 0.25); box(l, 0.36, 0.06, 0.06, 0x1a2a36, s * 0.16, -0.12, 0, { rz: -s * 0.7, ink: 0.01 }); L.push(l); }
  g.userData.anim = w => { b.position.y = 0.36 + abs(sin(w * 2)) * 0.04; };
};
F.vulture = (g, L) => {
  const b = pivot(g, 0, 1.0, 0);
  box(b, 0.42, 0.4, 0.72, 0x5a4030, 0, 0, 0); box(b, 0.5, 0.16, 0.24, 0xe8dcc8, 0, 0.2, 0.3, { ink: 0.015 });
  box(b, 0.12, 0.3, 0.12, 0xd88a7a, 0, 0.36, 0.42, { rx: 0.4 }); box(b, 0.2, 0.18, 0.22, 0xe8a090, 0, 0.5, 0.52);
  mesh(b, cone(0.06, 0.18, 4), 0xe8c050, 0, 0.47, 0.7, { rx: 2, ink: 0.01 }); eyes(b, 0.07, 0.54, 0.62, 0x1a1a22, 1, 0.05);
  const W = flap(b, 0x3a2a20, 1.05, 0.5, 0.2, 0.1);
  g.userData.anim = w => { W.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (0.1 + sin(w * 1.3) * 0.45); }); b.position.y = 1.0 + sin(w * 0.65) * 0.2; };
};
F.mummy = (g, L) => {
  const b = pivot(g, 0, 0.72, 0), w0 = 0xd8ccaa, w1 = 0xb8a888;
  box(b, 0.62, 0.7, 0.42, w0, 0, 0.3, 0);
  for (let k = 0; k < 5; k++) box(b, 0.66, 0.06, 0.46, w1, 0, 0.0 + k * 0.15, 0, { rz: (k % 2 - 0.5) * 0.15, ink: false });
  const h = pivot(b, 0, 0.88, 0); box(h, 0.44, 0.44, 0.4, w0, 0, 0, 0); for (let k = 0; k < 3; k++) box(h, 0.48, 0.05, 0.44, w1, 0, -0.12 + k * 0.13, 0, { rz: (k - 1) * 0.12, ink: false });
  eyes(h, 0.1, 0.04, 0.21, 0x7aff8a, 3, 0.08);
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.4, 0.55, 0); p.rotation.x = -1.4; box(p, 0.18, 0.6, 0.18, w0, 0, -0.28, 0); box(p, 0.06, 0.4, 0.04, w1, 0, -0.6, 0.08, { rz: 0.2, ink: false }); return p; });
  L.push(...legs(g, w1, 0.15, 0.4, 0, 0.2));
  g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = -1.4 + sin(w + i) * 0.15; }); h.rotation.z = sin(w * 0.5) * 0.15; };
};
F.sphinx = (g, L) => {
  const b = pivot(g, 0, 0.75, 0), fur = 0xd8a85a;
  box(b, 0.75, 0.6, 1.5, fur, 0, 0, -0.1);
  const h = pivot(b, 0, 0.6, 0.65);
  box(h, 0.5, 0.5, 0.45, 0xc8985a, 0, 0, 0);
  for (let k = 0; k < 5; k++) box(h, 0.82, 0.1, 0.5, k % 2 ? 0xe8c050 : 0x2a4a9a, 0, 0.3 - k * 0.12, -0.06, { ink: false });
  box(h, 0.84, 0.46, 0.1, 0x2a4a9a, 0, -0.05, -0.32); mesh(h, cone(0.1, 0.4, 4), 0xe8c050, 0, -0.32, 0.18, { rx: PI, ink: 0.01 });
  eyes(h, 0.11, 0.05, 0.23, 0x5af0ff, 3, 0.09);
  hbox(h, 0.12, 0.12, 0.04, 0x5af0ff, 2.6, 0, 0.36, 0.2);
  const W = flap(b, 0xe8c050, 1.0, 0.7, 0.3, 0.3, -0.2); W.forEach((p, i) => { for (let k = 0; k < 3; k++) box(p, 0.2, 0.06, 0.24, 0xf0d070, (i ? -1 : 1) * (0.3 + k * 0.3), 0.04, -0.3, { ink: 0.01 }); });
  const tail = pivot(b, 0, 0.2, -0.85); box(tail, 0.08, 0.08, 0.6, fur, 0, 0, -0.3);
  for (const [x, z] of [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.6], [0.3, -0.6]]) { const l = pivot(g, x, 0.55, z); box(l, 0.2, 0.55, 0.22, fur, 0, -0.27, 0); L.push(l); }
  g.userData.anim = w => { W.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (0.5 + sin(w * 0.6) * 0.2); }); tail.rotation.y = sin(w) * 0.4; h.rotation.x = sin(w * 0.5) * 0.06; };
};
// ---- the mountains ----
F.imp = (g, L) => {
  const b = pivot(g, 0, 0.42, 0);
  mesh(b, ball(0.42, 1), 0xd8eef8, 0, 0, 0).scale.set(1, 0.95, 0.9);
  for (const s of [-1, 1]) hot(b, cone(0.07, 0.32, 5), 0x9fe8ff, 1.5, s * 0.22, 0.42, 0, { rz: -s * 0.4 });
  for (const x of [-0.15, 0.15]) { box(b, 0.15, 0.18, 0.06, 0xffffff, x, 0.08, 0.38, { ink: false }); hbox(b, 0.07, 0.09, 0.03, 0x3a8aff, 2, x, 0.06, 0.42); }
  for (let k = 0; k < 3; k++) hot(b, new T.OctahedronGeometry(0.09, 0), 0x9fe8ff, 1.4, (k - 1) * 0.15, 0.2 + (k % 2) * 0.1, -0.36, { rx: -0.5 });
  L.push(...legs(g, 0xa8c8e0, 0.18, 0.18));
  g.userData.anim = w => { b.scale.set(1 + sin(w * 2) * 0.05, 1 - sin(w * 2) * 0.06, 1); };
};
F.wisp = (g, L) => {
  const b = pivot(g, 0, 1.0, 0);
  hot(b, ball(0.26, 2), 0xd8f8ff, 3); hot(b, ball(0.42, 1), 0x7fd8ff, 1.2, 0, 0, 0, { a: 0.3, add: true });
  mesh(b, ball(0.5, 0), 0xbfe8ff, 0, 0, 0, { own: 1, ink: false }).material.opacity = 0.35;
  b.children[2].material.transparent = true;
  const sh = pivot(b); for (let k = 0; k < 3; k++) hot(sh, new T.OctahedronGeometry(0.1, 0), 0x9fe8ff, 2, cos(k * 2.1) * 0.65, 0, sin(k * 2.1) * 0.65).scale.y = 1.8;
  g.userData.anim = w => { sh.rotation.y = w * 1.5; sh.rotation.x = 0.4; b.position.y = 1.0 + sin(w * 1.2) * 0.15; };
};
F.yeti = (g, L) => {
  const b = pivot(g, 0, 0.6, 0), fur = 0xe8eef4;
  box(b, 1.0, 0.9, 0.75, fur, 0, 0.35, 0);
  for (let k = 0; k < 8; k++) mesh(b, cone(0.1, 0.24, 4), 0xd8e2ec, -0.4 + (k % 4) * 0.27, 0.85, -0.2 + Math.floor(k / 4) * 0.3, { ink: 0.01 });
  const h = pivot(b, 0, 0.95, 0.12); box(h, 0.58, 0.5, 0.52, fur, 0, 0, 0); box(h, 0.4, 0.3, 0.06, 0x7a9ac8, 0, -0.04, 0.27, { ink: 0.015 });
  eyes(h, 0.1, 0.02, 0.3, 0x3a8aff, 2.4, 0.07); box(h, 0.2, 0.06, 0.03, 0x1a2a3a, 0, -0.12, 0.31, { ink: false });
  for (const s of [-1, 1]) mesh(h, cone(0.07, 0.3, 5), 0xc8d0d8, s * 0.32, 0.25, 0, { rz: -s * 0.7, ink: 0.01 });
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.62, 0.65, 0); box(p, 0.34, 0.95, 0.36, fur, 0, -0.4, 0); box(p, 0.3, 0.2, 0.32, 0x7a9ac8, 0, -0.92, 0.04); return p; });
  L.push(...legs(g, 0xd8e2ec, 0.26, 0.6, 0, 0.3));
  g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = sin(w + i * PI) * 0.6; }); };
};
F.giant = (g, L) => {
  const b = pivot(g, 0, 1.1, 0), skin = 0x6a8ab8, ice = 0xbfe8ff;
  box(b, 0.95, 1.0, 0.6, skin, 0, 0.4, 0);
  box(b, 1.0, 0.5, 0.65, ice, 0, 0.62, 0.02); box(b, 1.0, 0.25, 0.66, 0x8a6a4a, 0, -0.12, 0, { ink: 0.015 });
  const h = pivot(b, 0, 1.18, 0); box(h, 0.5, 0.5, 0.46, skin, 0, 0, 0); box(h, 0.46, 0.3, 0.1, 0xf4f8ff, 0, -0.28, 0.2, { ink: 0.015 });
  eyes(h, 0.11, 0.05, 0.24, 0x9fe8ff, 3.2, 0.09);
  for (let k = 0; k < 5; k++) hot(h, new T.OctahedronGeometry(0.08, 0), 0x9fe8ff, 2, -0.2 + k * 0.1, 0.34, 0, { rz: (k - 2) * 0.2 }).scale.y = 2.2 - abs(k - 2) * 0.4;
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.62, 0.75, 0); box(p, 0.3, 0.9, 0.3, skin, 0, -0.4, 0); box(p, 0.42, 0.24, 0.42, ice, 0, -0.05, 0, { ink: 0.015 }); return p; });
  const club = pivot(arms[1], 0, -0.9, 0.1); mesh(club, cyl(0.08, 0.18, 1.3, 7), 0x8a6a4a, 0, 0.3, 0.35, { rx: 1.2 }); for (let k = 0; k < 4; k++) hot(club, new T.OctahedronGeometry(0.1, 0), 0x9fe8ff, 1.6, cos(k * 1.6) * 0.18, 0.52, 0.62 + sin(k * 1.6) * 0.1).scale.y = 1.8;
  L.push(...legs(g, skin, 0.24, 0.62, 0, 0.3));
  g.userData.anim = w => { arms[0].rotation.x = sin(w) * 0.5; arms[1].rotation.x = -0.6 + sin(w + PI) * 0.3; h.rotation.y = sin(w * 0.4) * 0.15; };
};
// ---- the graveyard ----
F.shambler = (g, L) => {
  const b = pivot(g, 0, 0.62, 0), skin = 0x7a9a6a;
  box(b, 0.56, 0.62, 0.36, 0x4a5a8a, 0, 0.26, 0); box(b, 0.3, 0.2, 0.38, skin, 0.08, 0.18, 0.02, { ink: false });
  const h = pivot(b, 0, 0.78, 0); box(h, 0.42, 0.42, 0.4, skin, 0, 0, 0); h.rotation.z = 0.25;
  hbox(h, 0.1, 0.1, 0.03, 0xd8ff6a, 2.6, -0.1, 0.05, 0.21); box(h, 0.1, 0.03, 0.03, 0x1a1a22, 0.1, 0.05, 0.21, { ink: false }); box(h, 0.22, 0.06, 0.03, 0x3a2a2a, 0, -0.12, 0.21, { ink: false });
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.36, 0.48, 0); p.rotation.x = -1.3; box(p, 0.16, 0.56, 0.16, skin, 0, -0.26, 0); return p; });
  L.push(...legs(g, 0x3a3a4a, 0.14, 0.32, 0, 0.18));
  g.userData.anim = w => { b.rotation.z = sin(w) * 0.12; arms.forEach((p, i) => { p.rotation.x = -1.3 + sin(w * 1.3 + i * 2) * 0.25; }); };
};
F.wraith = (g, L) => {
  const b = pivot(g, 0, 1.0, 0), c = 0x2a2240;
  mesh(b, cone(0.42, 1.2, 8), c, 0, -0.1, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; mesh(b, cone(0.1, 0.3, 4), c, cos(a) * 0.36, -0.75, sin(a) * 0.36, { rx: PI, ink: 0.01 }); }
  const h = pivot(b, 0, 0.5, 0.05); mesh(h, ball(0.3, 1), c, 0, 0, 0).scale.set(1, 1.1, 1); box(h, 0.36, 0.3, 0.1, 0x07060c, 0, -0.02, 0.24, { ink: false });
  eyes(h, 0.08, 0.0, 0.3, 0x6affd8, 3, 0.07);
  const hands = [-1, 1].map(s => { const p = pivot(b, s * 0.36, 0.2, 0.2); mesh(p, ball(0.08, 0), 0xc8d8ff, 0, 0, 0.18, { ink: 0.01 }); return p; });
  g.userData.anim = w => { b.position.y = 1.0 + sin(w * 0.9) * 0.18; b.rotation.z = sin(w * 0.6) * 0.1; hands.forEach((p, i) => { p.rotation.x = -0.4 + sin(w + i) * 0.4; }); };
};
F.gargoyle = (g, L) => {
  const b = pivot(g, 0, 0.6, 0), st = 0x6e6a7a;
  box(b, 0.9, 0.8, 0.7, st, 0, 0.32, 0);
  const h = pivot(b, 0, 0.88, 0.2); box(h, 0.5, 0.42, 0.5, 0x7a7686, 0, 0, 0); eyes(h, 0.11, 0.04, 0.26, 0xff6a2a, 2.8, 0.08);
  for (const s of [-1, 1]) mesh(h, cone(0.07, 0.36, 4), 0x5a5666, s * 0.2, 0.3, -0.05, { rx: -0.5, rz: -s * 0.3, ink: 0.01 });
  const W = flap(b, 0x5a5666, 0.7, 0.55, 0.35, 0.65, -0.3); W.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * 0.9; });
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.56, 0.55, 0.05); box(p, 0.28, 0.7, 0.3, st, 0, -0.3, 0); for (let k = 0; k < 3; k++) mesh(p, cone(0.04, 0.16, 4), 0xd8d4c8, (k - 1) * 0.08, -0.72, 0.1, { rx: PI * 0.8, ink: false }); return p; });
  L.push(...legs(g, st, 0.26, 0.6, 0, 0.28));
  g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = sin(w + i * PI) * 0.5; }); W.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (0.9 + sin(w * 0.5) * 0.15); }); };
};
F.lich = (g, L) => {
  const b = pivot(g, 0, 1.05, 0), robe = 0x3a1a4a;
  mesh(b, cone(0.62, 1.6, 8), robe, 0, -0.2, 0);
  mesh(b, new T.TorusGeometry(0.5, 0.05, 4, 16), 0xe8c050, 0, -0.85, 0, { rx: PI / 2, ink: false });
  box(b, 0.7, 0.12, 0.42, 0xe8c050, 0, 0.5, 0, { ink: 0.015 });
  const h = pivot(b, 0, 0.85, 0); box(h, 0.42, 0.44, 0.4, 0xe8e4d8, 0, 0, 0); box(h, 0.32, 0.12, 0.05, 0x2a2228, 0, -0.16, 0.2, { ink: false });
  eyes(h, 0.1, 0.04, 0.21, 0xb85aff, 3.4, 0.11);
  for (let k = 0; k < 5; k++) mesh(h, cone(0.06, 0.24, 4), 0xe8c050, -0.18 + k * 0.09, 0.32, 0, { ink: 0.01 });
  hot(h, new T.OctahedronGeometry(0.06, 0), 0xff3a6a, 3, 0, 0.3, 0.2);
  const arm = pivot(b, 0.45, 0.4, 0.1); box(arm, 0.14, 0.6, 0.14, 0xe8e4d8, 0, -0.25, 0);
  const staff = pivot(arm, 0, -0.5, 0.1); mesh(staff, cyl(0.04, 0.04, 2.0, 6), 0x2a2228, 0, 0.5, 0); hot(staff, ball(0.16, 2), 0xb85aff, 3.2, 0, 1.55, 0); hot(staff, ball(0.26, 1), 0xb85aff, 1, 0, 1.55, 0, { a: 0.3, add: true });
  const runes = pivot(b, 0, 0.1, 0); for (let k = 0; k < 5; k++) hbox(runes, 0.12, 0.12, 0.02, 0xb85aff, 2.4, cos(k * 1.26) * 0.9, 0, sin(k * 1.26) * 0.9);
  g.userData.anim = w => { b.position.y = 1.05 + sin(w * 0.7) * 0.1; runes.rotation.y = w * 0.8; arm.rotation.x = -0.3 + sin(w * 0.7) * 0.15; };
};
// ---- the volcano ----
F.slime = (g, L) => {
  const b = pivot(g, 0, 0.42, 0);
  hot(b, ball(0.5, 2), 0xff6a1a, 1.7, 0, 0, 0).scale.set(1, 0.8, 0.95);
  for (let k = 0; k < 4; k++) box(b, 0.3, 0.08, 0.26, 0x2a1a14, cos(k * 1.6) * 0.2, 0.34, sin(k * 1.6) * 0.2, { ry: k, rz: 0.2, ink: 0.01 });
  for (const x of [-0.15, 0.15]) box(b, 0.12, 0.14, 0.04, 0x1a0a06, x, 0.08, 0.46, { ink: false });
  g.userData.anim = w => { b.scale.set(1 + sin(w * 2) * 0.09, 1 - sin(w * 2) * 0.12, 1 + sin(w * 2) * 0.05); };
};
F.firebat = (g, L) => {
  const b = pivot(g, 0, 1.0, 0);
  box(b, 0.3, 0.3, 0.4, 0x2a1a1a, 0, 0, 0); box(b, 0.26, 0.24, 0.24, 0x3a2222, 0, 0.12, 0.24);
  for (const s of [-1, 1]) mesh(b, cone(0.06, 0.2, 4), 0x2a1a1a, s * 0.1, 0.32, 0.22, { ink: 0.01 });
  eyes(b, 0.07, 0.15, 0.37, 0xffd23a, 3, 0.06);
  const W = flap(b, 0xff6a1a, 0.6, 0.42, 0.15, 0.04, 0, { hot: 1.8 });
  g.userData.anim = w => { W.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * sin(w * 3.2) * 0.8; }); b.position.y = 1.0 + sin(w * 1.6) * 0.18; };
};
F.basalt = (g, L) => {
  const b = pivot(g, 0, 0.58, 0), st = 0x3a3434;
  box(b, 1.0, 0.9, 0.75, st, 0, 0.35, 0);
  for (let k = 0; k < 4; k++) hbox(b, 0.04, 0.6, 0.02, 0xff6a1a, 2.4, -0.3 + k * 0.2, 0.35, 0.39, { rz: (k - 1.5) * 0.4 });
  hot(b, ball(0.14, 1), 0xffa040, 3, 0, 0.5, 0.36);
  box(b, 0.6, 0.48, 0.55, 0x4a4242, 0, 1.0, 0.04); eyes(b, 0.13, 1.02, 0.33, 0xff8a2a, 2.8, 0.1);
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.64, 0.6, 0); box(p, 0.36, 0.85, 0.4, 0x2e2a2a, 0, -0.35, 0); hbox(p, 0.04, 0.5, 0.02, 0xff6a1a, 2.2, 0, -0.35, 0.21); return p; });
  L.push(...legs(g, 0x2e2a2a, 0.28, 0.58, 0, 0.32));
  g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = sin(w + i * PI) * 0.5; }); };
};
F.wyrm = (g, L) => {
  const head = pivot(g, 0, 0.9, 0.6), c = 0x3a2420;
  box(head, 0.6, 0.45, 0.7, c, 0, 0, 0); box(head, 0.5, 0.15, 0.5, c, 0, -0.28, 0.12, { ink: 0.015 });
  hbox(head, 0.4, 0.08, 0.4, 0xffa040, 2.8, 0, -0.18, 0.16);
  eyes(head, 0.18, 0.12, 0.36, 0xffe04a, 3, 0.1);
  for (const s of [-1, 1]) mesh(head, cone(0.08, 0.5, 5), 0x2a1a16, s * 0.22, 0.3, -0.25, { rx: -0.9, ink: 0.01 });
  const segs = [];
  for (let k = 0; k < 7; k++) {
    const s = pivot(g, 0, 0.75, -0.1 - k * 0.42), r = 0.38 - k * 0.035;
    mesh(s, ball(r, 1), c, 0, 0, 0); hot(s, new T.TorusGeometry(r * 0.98, 0.035, 4, 16), 0xff6a1a, 2.6, 0, 0, 0.12);
    if (k % 2 === 0) mesh(s, cone(0.06, 0.24, 4), 0x2a1a16, 0, r * 0.95, 0, { ink: 0.01 });
    segs.push(s);
  }
  g.userData.anim = w => { head.position.y = 0.9 + sin(w * 0.8) * 0.12; head.rotation.y = sin(w * 0.8) * 0.25; segs.forEach((s, k) => { s.position.x = sin(w * 0.8 - k * 0.7) * 0.25; s.position.y = 0.75 + sin(w * 1.6 - k * 0.7) * 0.1; }); };
};
// ---- the city ----
F.bot = (g, L) => {
  const b = pivot(g, 0, 0.45, 0), m = 0x8a90a8;
  box(b, 0.52, 0.5, 0.4, m, 0, 0.1, 0); box(b, 0.4, 0.3, 0.36, 0x6a7088, 0, 0.52, 0);
  hbox(b, 0.32, 0.08, 0.03, 0xff2a4a, 3, 0, 0.55, 0.19);
  box(b, 0.03, 0.22, 0.03, 0x3a4060, 0.12, 0.78, 0, { ink: false }); hot(b, ball(0.04, 1), 0x2af0ff, 3, 0.12, 0.9, 0);
  for (const s of [-1, 1]) box(b, 0.1, 0.36, 0.1, 0x5a6078, s * 0.32, 0.0, 0.05, { rx: -0.4 });
  L.push(...legs(g, 0x4a5068, 0.14, 0.24, 0, 0.12));
  g.userData.anim = w => { b.rotation.y = sin(w) * 0.08; };
};
F.drone = (g, L) => {
  const b = pivot(g, 0, 1.0, 0);
  box(b, 0.36, 0.16, 0.36, 0x2a2d3a, 0, 0, 0); hbox(b, 0.12, 0.08, 0.03, 0x2af0ff, 3, 0, 0, 0.19);
  const R = [];
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + PI / 4, x = cos(a) * 0.36, z = sin(a) * 0.36; box(b, 0.06, 0.04, 0.4, 0x3a4060, x / 2, 0, z / 2, { ry: -a + PI / 2, ink: false });
    const r = pivot(b, x, 0.06, z); hot(r, new T.BoxGeometry(0.34, 0.01, 0.05), 0xd8e0ff, 1, 0, 0, 0, { a: 0.6 }); R.push(r); hot(b, ball(0.03, 0), k < 2 ? 0x3aff6a : 0xff2a4a, 3, x, -0.04, z); }
  g.userData.anim = w => { R.forEach((r, i) => { r.rotation.y = w * 18 + i; }); b.position.y = 1.0 + sin(w * 1.4) * 0.12; b.rotation.x = 0.12; };
};
F.mech = (g, L) => {
  const b = pivot(g, 0, 0.7, 0), m = 0x4a5068;
  box(b, 0.95, 0.75, 0.75, m, 0, 0.3, 0);
  for (let k = 0; k < 4; k++) box(b, 0.14, 0.12, 0.02, k % 2 ? 0x1a1a22 : 0xffc83a, -0.3 + k * 0.2, 0.0, 0.39, { rz: 0.6, ink: false });
  hbox(b, 0.5, 0.14, 0.04, 0xff8a2a, 2.6, 0, 0.55, 0.39);
  box(b, 0.3, 0.6, 0.7, 0x3a4058, -0.62, 0.45, 0.02);
  const gun = pivot(b, 0.6, 0.45, 0); box(gun, 0.26, 0.26, 0.3, 0x3a4058, 0, 0, 0); mesh(gun, cyl(0.07, 0.07, 0.6, 8), 0x2a2d3a, 0, 0, 0.4, { rx: PI / 2 }); hot(gun, ball(0.05, 1), 0xff8a2a, 3, 0, 0, 0.72);
  blink(b, { anim: f => g.userData.blinkF = f, rand: Math.random }, 0, 0.78, -0.2, 0.05, 0xff2a4a, 3, 1.4);
  L.push(...legs(g, 0x3a4058, 0.3, 0.7, 0, 0.3));
  g.userData.anim = w => { gun.rotation.x = sin(w * 0.5) * 0.15; if (g.userData.blinkF) g.userData.blinkF(w); };
};
F.overseer = (g, L) => {
  const b = pivot(g, 0, 1.7, 0);
  mesh(b, ball(0.7, 2), 0x2a2d40, 0, 0, 0);
  mesh(b, cyl(0.42, 0.42, 0.1, 24), 0x1a1e2c, 0, 0, 0.64, { rx: PI / 2 });
  hot(b, cyl(0.3, 0.3, 0.06, 24), 0xff2a4a, 3.2, 0, 0, 0.69, { rx: PI / 2 });
  hot(b, cyl(0.12, 0.12, 0.04, 16), 0xffd0a0, 4, 0, 0, 0.73, { rx: PI / 2 });
  const halo = pivot(b); hot(halo, new T.TorusGeometry(1.0, 0.04, 6, 48), 0x2af0ff, 2.6); halo.rotation.x = PI / 2.4;
  const arms = [];
  for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + PI / 4, p = pivot(b, cos(a) * 0.5, -0.4, sin(a) * 0.5); p.rotation.y = -a; let q = p;
    for (let j = 0; j < 3; j++) { const s = pivot(q, 0, j ? -0.34 : 0, 0); box(s, 0.12, 0.34, 0.12, j % 2 ? 0x3a4060 : 0x4a5068, 0, -0.17, 0); q = s; arms.push([s, k, j]); }
    for (const s of [-1, 1]) box(q, 0.04, 0.2, 0.04, 0x8a90a8, s * 0.06, -0.42, 0, { rz: s * 0.4, ink: false }); }
  for (let k = 0; k < 3; k++) hot(b, cone(0.1, 0.3, 8), 0x3a8aff, 2.6, cos(k * 2.1) * 0.35, -0.7, sin(k * 2.1) * 0.35, { rx: PI });
  g.userData.anim = w => { b.position.y = 1.7 + sin(w * 0.8) * 0.15; halo.rotation.z = w * 0.9; arms.forEach(([s, k, j]) => { s.rotation.x = 0.25 + sin(w * 1.1 + k + j * 0.7) * 0.3; }); };
};
// ---- space ----
F.mite = (g, L) => {
  const b = pivot(g, 0, 0.36, 0);
  mesh(b, ball(0.42, 1), 0x2a1a40, 0, 0, 0).scale.set(1.05, 0.7, 1.2);
  for (let k = 0; k < 3; k++) box(b, 0.66 - k * 0.12, 0.08, 0.2, 0x3a2a58, 0, 0.26, -0.25 + k * 0.22, { ink: 0.01 });
  for (let k = 0; k < 3; k++) hot(b, ball(0.06, 1), 0xff4ad8, 3, (k - 1) * 0.13, 0.12 + (k === 1 ? 0.06 : 0), 0.46);
  for (const s of [-1, 1]) mesh(b, cone(0.04, 0.24, 4), 0x8a6aaa, s * 0.12, -0.05, 0.55, { rx: PI / 2, rz: s * 0.4, ink: 0.01 });
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const l = pivot(g, s * 0.35, 0.32, -0.25 + k * 0.25); box(l, 0.4, 0.05, 0.05, 0x1a1028, s * 0.18, -0.12, 0, { rz: -s * 0.8, ink: 0.01 }); L.push(l); }
  g.userData.anim = w => { b.rotation.x = sin(w * 2) * 0.05; };
};
F.jelly = (g, L) => {
  const b = pivot(g, 0, 1.05, 0), bell = pivot(b);
  hot(bell, new T.SphereGeometry(0.42, 16, 8, 0, TAU, 0, PI / 2), 0x6af0ff, 1.3, 0, 0, 0, { a: 0.55, side: T.DoubleSide });
  hot(bell, ball(0.16, 1), 0xff8ad8, 3, 0, 0.12, 0);
  const ten = [];
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; let p = pivot(b, cos(a) * 0.26, 0, sin(a) * 0.26); for (let j = 0; j < 3; j++) { const q = pivot(p, 0, j ? -0.22 : 0, 0); hbox(q, 0.03, 0.22, 0.03, k % 2 ? 0x6af0ff : 0xff8ad8, 2, 0, -0.11, 0, { a: 0.8 }); ten.push([q, k, j]); p = q; } }
  g.userData.anim = w => { const p = sin(w * 1.6); bell.scale.set(1 + p * 0.12, 1 - p * 0.1, 1 + p * 0.12); b.position.y = 1.05 + p * 0.12; ten.forEach(([q, k, j]) => { q.rotation.z = sin(w * 1.6 - j * 0.9 + k) * 0.35; }); };
};
F.comet = (g, L) => {
  const b = pivot(g, 0, 0.6, 0);
  mesh(b, ball(0.6, 0), 0x4a4a62, 0, 0.35, 0).scale.set(1.15, 1, 0.9);
  for (let k = 0; k < 5; k++) hot(b, new T.OctahedronGeometry(0.1, 0), 0x9ff0ff, 2.2, cos(k * 1.3) * 0.4, 0.6 + (k % 2) * 0.2, sin(k * 1.3) * 0.3).scale.y = 1.8;
  eyes(b, 0.15, 0.45, 0.52, 0x9ff0ff, 3, 0.1);
  const tail = pivot(b, 0, 0.5, -0.4), tl = [];
  for (let k = 0; k < 3; k++) tl.push(hot(tail, cone(0.3 - k * 0.07, 1.1 + k * 0.3, 8), [0xffa040, 0x9ff0ff, 0xffffff][k], 2.4 - k * 0.3, 0, 0, -0.5 - k * 0.1, { rx: -PI / 2, a: 0.7 - k * 0.15, add: true }));
  const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.68, 0.5, 0); box(p, 0.3, 0.75, 0.32, 0x3a3a52, 0, -0.32, 0); return p; });
  L.push(...legs(g, 0x3a3a52, 0.26, 0.6, 0, 0.28));
  g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = sin(w + i * PI) * 0.5; }); tl.forEach((m, k) => { m.scale.set(1, 1 + sin(w * 6 + k) * 0.15, 1); }); };
};
F.devourer = (g, L) => {
  const b = pivot(g, 0, 1.5, 0);
  mesh(b, ball(1.0, 2), 0x140a26, 0, 0, 0);
  for (let k = 0; k < 24; k++) { const u = k * 2.4, v = (k % 6) / 6 * PI - PI / 2; hot(b, new T.BoxGeometry(0.04, 0.04, 0.04), [0xffffff, 0x9ff0ff, 0xff8ad8][k % 3], 3, cos(u) * cos(v) * 1.01, sin(v) * 1.01, sin(u) * cos(v) * 1.01 - 0.1); }
  const mouth = pivot(b, 0, -0.05, 0.86);
  hot(mouth, new T.TorusGeometry(0.5, 0.07, 8, 32), 0xff3aa8, 3);
  mesh(mouth, cyl(0.48, 0.48, 0.1, 24), 0x05030c, 0, 0, -0.04, { rx: PI / 2, ink: false });
  const core = hot(mouth, cyl(0.2, 0.2, 0.04, 20), 0xb05aff, 3, 0, 0, 0.02, { rx: PI / 2, own: 1 });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; hot(mouth, cone(0.06, 0.24, 4), 0xf0e8ff, 1.4, cos(a) * 0.4, sin(a) * 0.4, 0.04, { rz: a + PI / 2 }); }
  for (let k = 0; k < 3; k++) { const x = (k - 1) * 0.36; hot(b, ball(0.11, 1), 0xffd23a, 3.4, x, 0.72 - abs(x) * 0.3, 0.55); }
  const ten = [];
  for (let k = 0; k < 6; k++) { const a = PI + (k / 5 - 0.5) * 2.2, root = pivot(b, cos(a) * 0.3, 0.3 - (k % 2) * 0.4, sin(a) * 0.3 - 0.6); root.rotation.y = -a - PI / 2; let p = root;
    for (let j = 0; j < 4; j++) { const q = pivot(p, 0, 0, j ? -0.34 : 0); mesh(q, cyl(0.1 - j * 0.02, 0.12 - j * 0.02, 0.36, 7), 0x2a1a44, 0, 0, -0.17, { rx: PI / 2 }); if (j === 3) hot(q, ball(0.07, 1), 0xff3aa8, 3, 0, 0, -0.36); ten.push([q, k, j]); p = q; } }
  const debris = pivot(b); for (let k = 0; k < 6; k++) mesh(debris, ball(0.09, 0), 0x4a4266, cos(k * 1.05) * 1.5, (k % 2 - 0.5) * 0.4, sin(k * 1.05) * 1.5);
  g.userData.anim = w => { b.position.y = 1.5 + sin(w * 0.6) * 0.15; mouth.scale.setScalar(1 + sin(w * 1.4) * 0.1); core.rotation.y = w; debris.rotation.y = w * 0.6;
    ten.forEach(([q, k, j]) => { q.rotation.x = sin(w * 1.1 + k + j * 0.6) * 0.4; q.rotation.y = cos(w * 0.8 + k * 2 + j) * 0.3; }); };
};
Object.assign(Wd.DEATH, {
  crab: ["#d8502e", "#e8703e", "#ffffff"], gull: ["#f4f4f0", "#9aa2aa", "#ffc83a"], barnacle: ["#5f7f7a", "#e8e4d8", "#5affd0"], kraken: ["#7a3a8a", "#c86aa8", "#fff0a0"],
  scarab: ["#2a5a7a", "#ffcc50", "#5af0ff"], vulture: ["#5a4030", "#3a2a20", "#e8a090"], mummy: ["#d8ccaa", "#b8a888", "#7aff8a"], sphinx: ["#d8a85a", "#e8c050", "#2a4a9a"],
  imp: ["#d8eef8", "#9fe8ff", "#ffffff"], wisp: ["#d8f8ff", "#7fd8ff", "#ffffff"], yeti: ["#e8eef4", "#7a9ac8", "#3a8aff"], giant: ["#6a8ab8", "#bfe8ff", "#9fe8ff"],
  shambler: ["#7a9a6a", "#4a5a8a", "#d8ff6a"], wraith: ["#2a2240", "#6affd8", "#c8d8ff"], gargoyle: ["#6e6a7a", "#5a5666", "#ff6a2a"], lich: ["#3a1a4a", "#e8c050", "#b85aff"],
  slime: ["#ff6a1a", "#2a1a14", "#ffa040"], firebat: ["#2a1a1a", "#ff6a1a", "#ffd23a"], basalt: ["#3a3434", "#ff6a1a", "#4a4242"], wyrm: ["#3a2420", "#ff6a1a", "#ffe04a"],
  bot: ["#8a90a8", "#ff2a4a", "#2af0ff"], drone: ["#2a2d3a", "#2af0ff", "#d8e0ff"], mech: ["#4a5068", "#ffc83a", "#ff8a2a"], overseer: ["#2a2d40", "#ff2a4a", "#2af0ff"],
  mite: ["#2a1a40", "#ff4ad8", "#8a6aaa"], jelly: ["#6af0ff", "#ff8ad8", "#ffffff"], comet: ["#4a4a62", "#9ff0ff", "#ffa040"], devourer: ["#140a26", "#ff3aa8", "#ffd23a"],
});
Object.assign(Wd.SHELL, { crab: 0.6, gull: 0.6, barnacle: 1.0, kraken: 1.3, scarab: 0.6, vulture: 0.65, mummy: 0.7, sphinx: 1.25, imp: 0.6, wisp: 0.6, yeti: 1.0, giant: 1.35,
  shambler: 0.65, wraith: 0.7, gargoyle: 1.0, lich: 1.2, slime: 0.62, firebat: 0.55, basalt: 1.0, wyrm: 1.2, bot: 0.6, drone: 0.6, mech: 1.0, overseer: 1.3,
  mite: 0.6, jelly: 0.65, comet: 1.0, devourer: 1.5 });
})();
