/* The landmarks on the Expedition map (4 Nov, owner: "make the expedition map more interesting its boring add more landmarks or something and make them progressively more impressive like just make them cooler and cooler").
   Three to a world, and each world's are bigger and stranger than the last: a giant picnic, up to a gate standing over the crater. js/epic_world.js names and sizes them (EP.LANDMARKS), js/epic_map.js finds them a place, and these draw them.
   A drawing is plain meshes on a group, in world units, standing on y = 0. epic_map.js merges everything still into one mesh a world, so all of this costs a couple of draws; only what is inside live() stays its own mesh and moves. */
(function () {
const AF = window.AF, T = window.THREE, PI = Math.PI;
const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (a, b, h, s = 8) => new T.CylinderGeometry(a, b, h, s), cone = (r, h, s = 8) => new T.ConeGeometry(r, h, s), ico = (r, d = 0) => new T.IcosahedronGeometry(r, d), ball = (r, a = 10, b = 7) => new T.SphereGeometry(r, a, b), ring = (R, r, a = 6, b = 28, arc = PI * 2) => new T.TorusGeometry(R, r, a, b, arc), oct = r => new T.OctahedronGeometry(r, 0);
// a part: geometry, colour, where, and { rx, ry, rz, s: [x, y, z], glow, alpha }
function p(parent, geo, hex, x, y, z, o = {}) {
  const mat = o.alpha != null ? new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: o.alpha, depthWrite: false, side: T.DoubleSide }) : o.glow ? new T.MeshBasicMaterial({ color: hex }) : new T.MeshLambertMaterial({ color: hex, flatShading: true });
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  m.userData.glow = !!o.glow; parent.add(m); return m;
}
// a group that keeps moving: fn(time, group) every frame
let liveList = null;
function live(parent, fn) { const g = new T.Group(); g.userData.live = true; parent.add(g); if (liveList) liveList.push(t => fn(t, g)); return g; }

function palm(g, x, z, h = 3) { p(g, cyl(0.14, 0.24, h, 5), 0x9a7a4a, x, h / 2, z, { rz: 0.1 }); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; p(g, box(1.8, 0.08, 0.5), 0x4fa850, x + Math.cos(a) * 0.8, h + 0.1, z + Math.sin(a) * 0.8, { ry: -a, rz: 0.3 }); } }
function ribs(g, n, R0, R1, gap, hex, r = 0.26) { for (let i = 0; i < n; i++) { const k = i / (n - 1), R = R0 + (R1 - R0) * Math.abs(k - 0.35) * 1.5; p(g, ring(R, r, 5, 12, PI), hex, (i - (n - 1) / 2) * gap, 0, 0, { ry: PI / 2 }); } }
function orbit(g, n, R, y, geo, hex, speed, wob = 0.5, o = { glow: true }) { const l = live(g, (t, q) => { q.rotation.y = t * speed; q.children.forEach((c, i) => { c.position.y = y + Math.sin(t * 1.6 + i * 1.9) * wob; c.rotation.y = t * 1.5; }); }); for (let i = 0; i < n; i++) { const a = i / n * PI * 2; p(l, geo, hex, Math.cos(a) * R, y, Math.sin(a) * R, o); } return l; }

const BUILD = {
  // ---------------- Hollowbrook: a picnic, a mill, a tree ----------------
  bigpicnic(g) {
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) p(g, box(1.9, 0.1, 1.9), (i + j) & 1 ? 0xfff6e4 : 0xd9443c, i * 1.9, 0.08, j * 1.9);
    p(g, box(4.2, 2.3, 3), 0xb98a4a, -2, 1.3, -1.6); p(g, box(4.4, 0.3, 1.6), 0x9a6e36, -2, 2.7, -2.4, { rx: -0.5 }); p(g, box(4.4, 0.3, 1.6), 0x9a6e36, -2, 2.7, -0.8, { rx: 0.5 }); p(g, ring(1.4, 0.13, 5, 14, PI), 0x7a5428, -2, 2.6, -1.6);
    for (let i = 0; i < 4; i++) p(g, box(4.26, 0.1, 3.06), 0x8f6630, -2, 0.5 + i * 0.5, -1.6);
    p(g, cyl(0.85, 0.85, 3.4, 10), 0x3f9a5a, 2.6, 1.8, -2); p(g, cyl(0.86, 0.86, 1.4, 10), 0xfff6e4, 2.6, 1.6, -2); p(g, cyl(0.34, 0.8, 1, 10), 0x3f9a5a, 2.6, 4, -2); p(g, cyl(0.34, 0.34, 0.9, 10), 0x3f9a5a, 2.6, 4.9, -2); p(g, cyl(0.38, 0.38, 0.3, 10), 0x2a7a42, 2.6, 5.45, -2);
    p(g, ball(1.35), 0xe0453a, 3, 1.4, 2.6); p(g, cyl(0.07, 0.1, 0.7, 5), 0x6a4a2a, 3, 3, 2.6); p(g, box(0.7, 0.08, 0.36), 0x5fae4a, 3.4, 3.05, 2.6, { rz: 0.4 });
    for (const [c, h] of [[0xe6bd6e, 0.5], [0x6fbf58, 0.25], [0xffd25a, 0.2], [0xc4453a, 0.3], [0xe6bd6e, 0.5]]) { this._y = (this._y || 0.2) + h; p(g, box(3, h, 2.6), c, -2.2, this._y, 3.2, { ry: 0.3 }); this._y += h / 2; } this._y = 0;
  },
  windmill(g) {
    p(g, cyl(1.7, 2.7, 7.5, 8), 0xeadfc4, 0, 3.75, 0); for (const y of [2.4, 5.2]) p(g, cyl(2.1 - (y - 2.4) * 0.14, 2.3 - (y - 2.4) * 0.14, 0.2, 8), 0x8a6a42, 0, y, 0);
    p(g, cone(2.3, 2.3, 8), 0xc45a3a, 0, 8.65, 0); p(g, box(1.2, 1.9, 0.2), 0x5a3a22, 0, 0.95, 2.5); p(g, box(0.8, 0.8, 0.1), 0xffe9a0, 0, 4, 2.2, { glow: true });
    p(g, box(4, 1.6, 3), 0xd8c8a0, 5, 0.8, 1); p(g, cone(3, 1.3, 4), 0xa8482e, 5, 2.25, 1, { ry: PI / 4 });
    for (let i = 0; i < 3; i++) p(g, cyl(0.7, 0.7, 1.1, 8), 0xe6c35a, -4 + i * 1.3, 0.7, 2.6, { rx: PI / 2 });
    const hub = live(g, (t, q) => { q.rotation.z = t * 0.8; }); hub.position.set(0, 7, 2.4);
    p(hub, cyl(0.3, 0.3, 0.5, 8), 0x6a4a2a, 0, 0, 0, { rx: PI / 2 });
    for (let i = 0; i < 4; i++) { const a = i * PI / 2, q = new T.Group(); q.rotation.z = a; hub.add(q); p(q, box(0.25, 6, 0.08), 0x6a4a2a, 0, 3, 0.05); p(q, box(1.2, 4.8, 0.06), 0xfff4d8, 0.65, 3.4, 0); }
  },
  oak(g) {
    p(g, cyl(0.9, 1.5, 5.6, 7), 0x6a4a2a, 0, 2.8, 0); for (const [a, l] of [[0.9, 3.4], [-0.8, 3], [2.4, 2.6]]) p(g, cyl(0.25, 0.55, l, 5), 0x6a4a2a, Math.cos(a) * 1.2, 5.6, Math.sin(a) * 1.2, { rz: -Math.cos(a) * 0.8, rx: Math.sin(a) * 0.8 });
    for (const [x, y, z, r, c] of [[0, 8, 0, 3.4, 0x5fae4a], [-2.6, 7, 1, 2.5, 0x6fbf58], [2.6, 7.2, -0.6, 2.7, 0x4f9e42], [0.5, 7, 2.4, 2.2, 0x6fbf58], [-0.6, 9.8, -0.6, 2.1, 0x7fce68]]) p(g, ico(r, 1), c, x, y, z);
    p(g, box(2.6, 1.6, 2.2), 0xc9a06a, 0, 5, 1.6); p(g, cone(2.2, 1.1, 4), 0xc45a3a, 0, 6.3, 1.6, { ry: PI / 4 }); p(g, box(0.7, 0.8, 0.08), 0xffe9a0, 0, 5, 2.75, { glow: true });
    for (let i = 0; i < 7; i++) p(g, box(0.8, 0.08, 0.14), 0xeadfc4, 0, 0.5 + i * 0.6, 2.8);
    p(g, box(0.06, 3.2, 0.06), 0xeadfc4, 2.7, 2.5, 1.5); p(g, box(0.06, 3.2, 0.06), 0xeadfc4, 3.5, 2.5, 1.5); p(g, box(1, 0.1, 0.4), 0x8a5a3a, 3.1, 0.9, 1.5);
  },
  // ---------------- Gullport: a wreck, a tall light, a whale ----------------
  wreck(g) {
    const s = new T.Group(); s.rotation.set(0.05, 0.5, 0.26); s.position.y = 1.4; g.add(s);
    p(s, box(3.6, 2.2, 11), 0x7a4f2e, 0, 1, 0); p(s, box(3, 0.4, 10.6), 0xb98a54, 0, 2.2, 0); p(s, box(3.8, 0.3, 11.2), 0x5a3a22, 0, 1.9, 0); p(s, cone(1.95, 3.6, 4), 0x7a4f2e, 0, 1, 7, { rx: PI / 2, ry: PI / 4 });
    p(s, box(3.4, 1.8, 3), 0x6a4426, 0, 3.2, -4); p(s, box(0.9, 0.7, 0.1), 0xffe9a0, -1, 3.3, -2.45, { glow: true }); p(s, box(0.9, 0.7, 0.1), 0xffe9a0, 1, 3.3, -2.45, { glow: true });
    p(s, cyl(0.2, 0.28, 8, 6), 0x5a3a22, 0, 6, 0); p(s, box(5, 3.4, 0.08), 0xe8dcc0, 0.4, 7, 0.3, { rz: 0.1 }); p(s, box(0.14, 5, 0.14), 0x5a3a22, 0, 6.8, 0.2, { rz: PI / 2 }); p(s, cyl(0.16, 0.24, 4, 6), 0x5a3a22, 0, 3.8, 3.8, { rz: 0.8 });
    for (const [x, z, sz, c] of [[-4.6, 3, 1.3, 0xa87a48], [-5.6, 1.4, 0.9, 0x9a6e3a], [4.8, -3.2, 1.2, 0xa87a48], [5, 1, 0.8, 0xb98a54]]) p(g, box(sz, sz, sz), c, x, sz / 2, z, { ry: x });
    orbit(g, 3, 6.5, 8.5, box(0.8, 0.06, 0.24), 0xffffff, 0.5, 0.7, {});
  },
  lighthouse(g) {
    p(g, ico(5.2, 1), 0x8a8a7a, 0, 0.3, 0, { s: [1, 0.42, 1] });
    for (let i = 0; i < 6; i++) p(g, cyl(1.72 - (i + 1) * 0.12, 1.72 - i * 0.12 + 0.02, 2, 12), i % 2 ? 0xe0453a : 0xffffff, 0, 2.2 + i * 2, 0);
    p(g, cyl(1.5, 1.1, 0.3, 12), 0x3a3a44, 0, 13.3, 0); p(g, ring(1.45, 0.05, 4, 20), 0x3a3a44, 0, 13.9, 0, { rx: PI / 2 });
    p(g, cyl(0.88, 0.88, 1.6, 10), 0xffe9a0, 0, 14.2, 0, { glow: true }); p(g, cone(1.2, 1.2, 10), 0xe0453a, 0, 15.6, 0); p(g, ball(0.2), 0xffd25a, 0, 16.4, 0);
    p(g, box(2.6, 1.5, 2), 0xf4efe0, 3.4, 2.1, 1.2); p(g, cone(2, 1, 4), 0x4a78a8, 3.4, 3.35, 1.2, { ry: PI / 4 });
    const beam = live(g, (t, q) => { q.rotation.y = t * 0.8; }); beam.position.y = 14.2;
    for (const a of [0, PI]) { const arm = new T.Group(); arm.rotation.y = a; beam.add(arm); p(arm, cone(1.9, 14, 10), 0xfff4b8, 0, 0, 7, { rx: -PI / 2, alpha: 0.2 }); }
  },
  whale(g) {
    const w = new T.Group(); w.rotation.y = 0.45; g.add(w);
    ribs(w, 8, 4.8, 3, 1.5, 0xeee6d0); p(w, box(13, 0.5, 0.6), 0xd8d0b8, 0, 4.4, 0);
    p(w, ico(2.6, 1), 0xeee6d0, -7.8, 1.9, 0, { s: [1.5, 0.8, 0.9] }); p(w, ball(0.55), 0x2a2228, -8.6, 2.6, 1.8); p(w, box(4, 0.3, 2.4), 0xd8d0b8, -8.6, 0.25, 0);
    for (let i = 0; i < 3; i++) p(w, box(0.42, 0.42, 0.42), 0xd8d0b8, 6.8 + i * 0.75, 3.5 - i * 0.9, 0, { rz: 0.8 });
    p(w, box(1.6, 0.12, 3), 0xd8d0b8, 8.6, 1.1, 0);
  },
  // ---------------- Sunscar Dunes: a buried head, stepped pyramids, a pool ----------------
  colossus(g) {
    p(g, ico(8, 1), 0xdeb76c, 0, -0.4, 0, { s: [1, 0.3, 1] });
    const h = new T.Group(); h.rotation.set(0.1, 0.32, -0.14); h.position.y = 3; g.add(h);
    p(h, box(9, 7.4, 8.2), 0xcfa35a, 0, 1.4, 0); p(h, box(7.4, 0.4, 0.2), 0xb88a48, 0, -1.4, 4.1); p(h, box(9.1, 0.5, 8.3), 0xdcb574, 0, 5, 0);
    for (const x of [-2.2, 2.2]) { p(h, ball(1.05), 0x2a2228, x, 2, 3.9, { s: [1, 1, 0.3] }); p(h, ball(0.32), 0xfff4d8, x - 0.3, 2.4, 4.2, { glow: true }); p(h, cyl(0.85, 0.85, 0.1, 10), 0xc47a54, x * 1.5, 0.5, 4.08, { rx: PI / 2 }); }
    p(h, cone(0.4, 0.5, 3), 0xa86a48, 0, 0.7, 4.15, { rx: PI }); p(h, ring(0.7, 0.14, 5, 10, PI), 0x8a5a3a, 0, 0.1, 4.12, { rz: PI });
    p(h, box(1.7, 5.4, 1.5), 0xcfa35a, -3, 7.4, -0.4, { rz: 0.1 }); p(h, box(1.7, 2.4, 1.5), 0xcfa35a, 3, 6, -0.4, { rz: -0.2 });
    for (const [x, z, s] of [[7.2, 3, 1.6], [6.6, 5, 1], [-7, 4.4, 1.2], [-6.2, -4, 1.8]]) p(g, box(s, s, s), 0xcfa35a, x, s / 2, z, { ry: x, rz: 0.2 });
  },
  pyramids(g) {
    for (let i = 0; i < 8; i++) { const w = 16 - i * 1.9; p(g, box(w, 1.6, w), i % 2 ? 0xd8ad62 : 0xc9984a, 0, 0.8 + i * 1.6, -1); }
    p(g, cone(1.9, 2.2, 4), 0xffd25a, 0, 14.1, -1, { ry: PI / 4 }); p(g, box(1.9, 3.4, 0.3), 0x3a2a1e, 0, 1.7, 7.05); p(g, box(1.2, 2.4, 0.1), 0xffc23a, 0, 1.3, 7.22, { glow: true });
    for (let i = 0; i < 6; i++) p(g, box(2.4, 0.3, 0.8), 0xe0b870, 0, 1.45 + i * 1.6, 7.6 - i * 0.95);
    for (const x of [-10.5, 10.5]) { p(g, box(1.3, 7.6, 1.3), 0xb88a52, x, 3.8, 6, { s: [1, 1, 1] }); p(g, cone(0.92, 1.3, 4), 0xffd25a, x, 8.25, 6, { ry: PI / 4 }); }
    for (const [x, z, n] of [[-9.6, -7, 4], [9.6, -7.4, 5]]) for (let i = 0; i < n; i++) { const w = n * 1.5 - i * 1.5; p(g, box(w, 1, w), 0xd8ad62, x, 0.5 + i, z); }
    const sun = live(g, (t, q) => { q.rotation.y = t * 0.5; q.position.y = 19 + Math.sin(t * 0.8) * 0.5; }); sun.position.y = 19;
    p(sun, ball(1.4), 0xffe07a, 0, 0, 0, { glow: true }); p(sun, ring(2.5, 0.16, 5, 30), 0xffc23a, 0, 0, 0, { glow: true, rx: PI / 2 });
    for (let i = 0; i < 8; i++) { const a = i * PI / 4; p(sun, cone(0.4, 1.3, 4), 0xffb02e, Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4, { glow: true, rz: -PI / 2, ry: -a }); }
  },
  oasis(g) {
    p(g, cyl(5.6, 5.8, 0.2, 18), 0xe6d08e, 0, 0.1, 0); p(g, cyl(4.5, 4.5, 0.1, 18), 0x3ac0d8, 0, 0.26, 0, { glow: true });
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + 0.3; palm(g, Math.cos(a) * 5.7, Math.sin(a) * 5.7, 2.6 + (i % 3) * 0.7); }
    for (const [x, z, c] of [[-7, 2.6, 0xe0453a], [7, 3.4, 0x3a78c0]]) { p(g, cone(1.9, 2.3, 4), c, x, 1.15, z, { ry: PI / 4 }); p(g, box(0.7, 1.1, 0.06), 0x3a2a1e, x, 0.55, z + 1.35); }
  },
  // ---------------- Frostveil Pass: a sword in the ice, a palace, an arch ----------------
  sword(g) {
    p(g, ico(6, 1), 0xbfe6f4, 0, 0.6, 0, { s: [1, 0.56, 1] });
    p(g, box(1.5, 11, 0.36), 0xdfeef8, 0, 8, 0); p(g, cone(0.75, 1.8, 4), 0xdfeef8, 0, 2.3, 0, { rx: PI, ry: PI / 4, s: [1, 1, 0.3] }); p(g, box(0.34, 10.4, 0.4), 0x9ac8e4, 0, 8.2, 0);
    p(g, box(5.2, 0.7, 0.8), 0xffc23a, 0, 13.7, 0); p(g, cyl(0.34, 0.34, 2, 6), 0x7a3a2e, 0, 15, 0); p(g, ico(0.62), 0x5ad8ff, 0, 16.3, 0, { glow: true });
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2, r = 3.4 + (i % 3) * 0.8, h = 2 + (i * 7 % 5) * 0.8; p(g, cone(0.7, h, 5), 0xa8e4ff, Math.cos(a) * r, h / 2 + 1, Math.sin(a) * r, { rz: -Math.cos(a) * 0.3, rx: Math.sin(a) * 0.3 }); }
    orbit(g, 5, 4.6, 10, oct(0.34), 0xbff4ff, 0.5, 0.9);
  },
  palace(g) {
    p(g, cyl(10.5, 11.5, 1.2, 12), 0xcfe6f2, 0, 0.6, 0); p(g, box(15, 4.4, 1), 0xbfe6f4, 0, 3.4, 6.2);
    p(g, box(4, 3.6, 1.2), 0x2f6f96, 0, 3, 6.4); p(g, cone(2.4, 2.4, 4), 0xa8e4ff, 0, 6.8, 6.3, { ry: PI / 4 });
    for (const [x, z, h, r] of [[0, -1.5, 23, 3.1], [-4.2, 0, 16, 2.3], [4.2, 0, 17, 2.4], [-1.8, -5, 14, 2], [2.8, -5, 15, 2], [-7.4, 3, 11, 1.7], [7.4, 3, 11.5, 1.7], [-6.6, -4, 9.5, 1.6], [6.6, -4, 10, 1.6]]) {
      p(g, cone(r, h, 6), 0xa8e4ff, x, h / 2 + 1.2, z); p(g, cone(r * 0.58, h * 0.56, 6), 0xe6f8ff, x, h * 0.72 + 1.2, z + r * 0.16, { glow: true, s: [0.5, 1, 0.5] });
    }
    for (const x of [-5, -2.8, 2.8, 5]) p(g, box(0.9, 1.5, 0.1), 0xffe9a0, x, 3.4, 6.78, { glow: true });
    for (const x of [-8.6, 8.6]) { p(g, cyl(1.1, 1.3, 6.2, 8), 0xbfe6f4, x, 3.8, 6.2); p(g, cone(1.5, 3, 8), 0x5ac0e0, x, 8.4, 6.2); }
    const sky = live(g, (t, q) => { q.children.forEach((c, i) => { c.material.opacity = 0.16 + Math.sin(t * 0.7 + i * 1.7) * 0.09; c.position.x = Math.sin(t * 0.35 + i) * 2.5; c.rotation.z = Math.sin(t * 0.3 + i) * 0.08; }); });
    for (const [c, y, z] of [[0x7dffcf, 21, -7], [0xc08cff, 24, -8.4], [0x5ad8ff, 18, -9.4]]) p(sky, new T.PlaneGeometry(30, 7, 1, 1), c, 0, y, z, { alpha: 0.2 });
  },
  icearch(g) {
    p(g, ring(6.2, 1.2, 6, 16, PI), 0xa8e4ff, 0, 1.4, 0, { ry: 0.3 });
    for (const x of [-6, 6]) p(g, cyl(1.3, 1.7, 2.6, 6), 0xbfe6f4, x * 0.96, 1.3, -x * 0.29);
    for (let i = 1; i < 8; i++) { const a = i / 8 * PI, l = 1 + (i * 5 % 3) * 0.7; p(g, cone(0.26, l, 5), 0xe6f8ff, Math.cos(a) * 5 * 0.955, 1.4 + Math.sin(a) * 5 - l / 2, -Math.cos(a) * 5 * 0.29, { rx: PI }); }
    for (let i = 0; i < 4; i++) p(g, cone(0.8, 2.2 + i, 5), 0xc8ecfa, -8 + i * 0.9, (2.2 + i) / 2, 4 - i * 1.6);
  },
  // ---------------- Gloomhollow: a manor, a giant dead tree, a stone ring ----------------
  manor(g) {
    const stone = 0x4a4a54, dark = 0x2e2e38, lit = 0xffc25a;
    p(g, box(10, 6, 5), stone, 0, 3, 0); p(g, cone(7.2, 3.6, 4), dark, 0, 7.8, 0, { ry: PI / 4, s: [1, 1, 0.55] });
    for (const x of [-6.6, 6.6]) { p(g, cyl(1.7, 1.9, 8.6, 8), stone, x, 4.3, 1); p(g, cone(2.2, 5, 8), dark, x, 11.1, 1); p(g, box(0.06, 1.3, 0.06), 0x111118, x, 14.2, 1); }
    for (let i = 0; i < 2; i++) for (const x of [-3.4, -1.2, 1.2, 3.4]) if (!(i === 0 && Math.abs(x) < 2)) p(g, box(1, 1.2, 0.1), lit, x, 1.6 + i * 2.5, 2.56, { glow: true });
    for (const x of [-6.6, 6.6]) { p(g, box(0.7, 1, 0.1), lit, x, 6, 2.86, { glow: true }); p(g, box(0.7, 1, 0.1), lit, x, 3, 2.86, { glow: true }); }
    p(g, box(2, 2.6, 0.2), 0x2a1a14, 0, 1.3, 2.6); p(g, box(3, 0.3, 1.8), dark, 0, 2.9, 3.4); p(g, cone(0.3, 3.4, 5), 0x111118, 2.6, 8.8, 1);
    for (let i = 0; i < 12; i++) p(g, box(0.1, 1.2, 0.1), 0x111118, -8 + i * 1.45, 0.6, 6.4);
    for (const [x, z] of [[-6, 7.6], [-3.4, 7.4], [4, 7.6], [6.6, 7.2]]) { p(g, box(0.8, 1.1, 0.24), 0x6a6a74, x, 0.55, z, { rz: x * 0.02 }); }
    const ghosts = live(g, (t, q) => { q.rotation.y = -t * 0.3; q.children.forEach((c, i) => { c.position.y = 5 + i * 1.6 + Math.sin(t * 1.2 + i * 2) * 0.8; }); });
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, q = new T.Group(); q.position.set(Math.cos(a) * 9, 5, Math.sin(a) * 6); ghosts.add(q); p(q, ball(0.62), 0xdfffee, 0, 0, 0, { alpha: 0.7 }); p(q, cone(0.62, 1.3, 8), 0xdfffee, 0, -0.9, 0, { alpha: 0.5, rx: PI }); }
  },
  deadtree(g) {
    const bark = 0x2e2422, hi = 0x46362e;
    p(g, cyl(1.9, 3.6, 13, 7), bark, 0, 6.5, 0); p(g, cyl(1, 1.9, 6, 6), hi, 0.3, 15.5, -0.2, { rz: -0.1 });
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2, r = 3.2; p(g, cone(1.2, 6.5, 5), bark, Math.cos(a) * r * 1.4, 1, Math.sin(a) * r * 1.4, { rz: -Math.cos(a) * 1.25, rx: Math.sin(a) * 1.25 }); }
    const lamps = [];
    for (const [a, y, l, tip] of [[0.5, 12, 11, 18], [2.4, 11, 11, 17], [4.4, 13, 10, 19], [5.6, 15, 9, 22], [1.5, 16, 9, 23], [3.4, 16.5, 8, 24]]) {
      const cx = Math.cos(a), sz = Math.sin(a), mid = l / 2, dy = tip - y, tilt = Math.atan2(l, dy);
      const b = new T.Group(); b.position.set(0, y, 0); b.rotation.set(sz * tilt, 0, -cx * tilt); g.add(b); p(b, cyl(0.2, 0.86, Math.hypot(l, dy), 6), bark, 0, Math.hypot(l, dy) / 2, 0);
      const along = k => new T.Vector3(0, Math.hypot(l, dy) * k, 0).applyEuler(b.rotation).add(b.position), q = along(0.8), q2 = along(0.58); lamps.push([q.x, q.y, q.z]);
      const c = new T.Group(); c.position.copy(q2); c.rotation.set(-sz * 0.5, 0, cx * 0.5); g.add(c); p(c, cyl(0.1, 0.34, 4.4, 5), hi, 0, 2.2, 0);
    }
    for (const [x, y, z] of lamps) { p(g, box(0.05, 1.2, 0.05), 0x111118, x, y - 0.6, z); p(g, ball(0.52, 8, 6), 0xffa040, x, y - 1.5, z, { glow: true }); }
    for (const x of [-1, 1]) p(g, ball(0.55, 8, 6), 0x9dffb4, x, 7.6, 3, { glow: true, s: [1, 1.3, 0.3] }); p(g, cone(1.2, 2.6, 5), 0x12100e, 0, 4.2, 3.08, { s: [1, 1, 0.2] });
    orbit(g, 7, 10, 10, ball(0.26, 6, 5), 0x9dffb4, 0.22, 2.4);
  },
  stonering(g) {
    p(g, cyl(7.8, 8, 0.2, 18), 0x3a4a3e, 0, 0.1, 0);
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, h = 5 + (i * 4 % 3) * 1.4, x = Math.cos(a) * 6.4, z = Math.sin(a) * 6.4; p(g, box(1.5, h, 0.9), 0x5a5a64, x, h / 2, z, { ry: -a + PI / 2, rz: (i % 2 ? 0.07 : -0.05) }); p(g, box(0.5, 1.5, 0.06), 0x7dffb8, x - Math.cos(a) * 0.5, h * 0.62, z - Math.sin(a) * 0.5, { glow: true, ry: -a + PI / 2 }); }
    p(g, cyl(1.6, 2, 1.2, 8), 0x4a4a54, 0, 0.8, 0);
    const o = live(g, (t, q) => { q.position.y = 4.8 + Math.sin(t * 1.1) * 0.5; q.rotation.y = t; }); o.position.y = 4.8;
    p(o, ico(1), 0x7dffb8, 0, 0, 0, { glow: true }); p(o, ring(1.8, 0.07, 4, 22), 0xbfffe0, 0, 0, 0, { glow: true, rx: 1.2 });
  },
  // ---------------- Cinderfall: dragon bones, a citadel, a geyser ----------------
  dragon(g) {
    const d = new T.Group(); d.rotation.y = -0.4; g.add(d);
    const bone = 0x3a3032;
    ribs(d, 9, 7.6, 4.6, 1.8, bone, 0.4); p(d, box(18, 0.8, 0.9), bone, 0, 7, 0);
    for (let i = 0; i < 10; i++) p(d, cone(0.46, 2 - Math.abs(i - 4) * 0.14, 4), 0x241c1e, -7.6 + i * 1.7, 8.2, 0);
    p(d, ico(3, 1), bone, -11.6, 3.2, 0, { s: [1.5, 0.82, 0.92] }); p(d, box(5, 0.5, 3.2), bone, -13, 0.4, 0);
    for (const z of [-1.6, 1.6]) { p(d, ball(0.62, 8, 6), 0xff5a1e, -12.2, 4, z * 1.24, { glow: true, s: [1, 1, 0.4] }); p(d, cone(0.52, 4.6, 5), 0x241c1e, -10.4, 6.2, z, { rz: -1 }); }
    for (let i = 0; i < 5; i++) p(d, cone(0.26, 1, 4), 0xe8dcc8, -14.8 + i * 0.6, 1.3, 1.3, { rx: PI });
    for (let i = 0; i < 6; i++) p(d, box(0.7, 0.7, 0.7), bone, 9 + i * 1.1, 5.6 - i * 1, 0, { rz: 0.8 });
    const lava = p(g, cyl(9.6, 9.6, 0.1, 18), 0xff6a2a, 0, 0.12, 0, { glow: true, s: [1, 1, 0.4] }); lava.rotation.y = -0.4;
  },
  citadel(g) {
    const blk = 0x241c1e, mid = 0x32282a, lava = 0xff6a1e;
    p(g, cyl(11.6, 12, 0.3, 24), lava, 0, 0.14, 0, { glow: true }); p(g, cyl(9.4, 10.6, 3, 8), blk, 0, 1.6, 0);
    p(g, box(13, 6, 11), mid, 0, 6, -0.5); p(g, box(9, 8, 7.6), blk, 0, 13, -1); p(g, box(5.4, 7, 4.6), mid, 0, 20.5, -1.4);
    for (const [x, z, h, y] of [[-7, 5, 13, 6.5], [7, 5, 13, 6.5], [-7, -6, 16, 8], [7, -6, 16, 8]]) { p(g, cyl(1.6, 2, h, 6), blk, x, y, z); p(g, cone(2.1, 4.4, 6), 0x46120c, x, y + h / 2 + 2.2, z); p(g, ball(0.6, 8, 6), 0xffa040, x, y + h / 2 + 5, z, { glow: true }); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; p(g, cone(0.68, 4, 4), 0x46120c, Math.cos(a) * 2.6, 26, -1.4 + Math.sin(a) * 2, {}); }
    p(g, box(5, 7, 0.3), lava, 0, 4.9, 5.2, { glow: true }); p(g, box(1.6, 12, 0.3), lava, 0, 11, 2.95, { glow: true }); p(g, box(1.2, 8, 0.3), lava, 0, 20.5, 0.95, { glow: true });
    for (const x of [-4.6, 4.6]) for (const y of [5.4, 8, 12, 15]) p(g, box(0.62, 1, 0.1), 0xffc25a, Math.sign(x) * (y > 9 ? 3 : 4.6), y, y > 9 ? 2.86 : 5.04, { glow: true });
    for (let i = 0; i < 6; i++) p(g, ring(0.5, 0.14, 4, 8), 0x4a4044, -9 + (i * 0.55), 4 - i * 0.6, 7 + i * 0.7, { ry: i % 2 ? PI / 2 : 0 });
    const heart = live(g, (t, q) => { const s = 1 + Math.sin(t * 2.6) * 0.14; q.scale.setScalar(s); q.rotation.y = t * 0.7; }); heart.position.set(0, 27.6, -1.4);
    p(heart, ico(1.7, 0), 0xffb84a, 0, 0, 0, { glow: true }); p(heart, ring(2.6, 0.12, 4, 24), 0xff6a1e, 0, 0, 0, { glow: true, rx: 1.3 });
    orbit(g, 9, 11, 15, oct(0.3), 0xff8a3a, 0.28, 4);
  },
  geyser(g) {
    p(g, cone(5, 3.6, 7), 0x2e2422, 0, 1.8, 0); p(g, cyl(1.3, 1.5, 0.3, 8), 0xffb84a, 0, 3.5, 0, { glow: true });
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + 0.4; p(g, cone(0.9, 2.5, 4), 0x3e2e2a, Math.cos(a) * 3.8, 1.2, Math.sin(a) * 3.8); }
    const f = live(g, (t, q) => { const k = 0.65 + Math.abs(Math.sin(t * 0.9)) * 0.5 + Math.sin(t * 7) * 0.04; q.scale.set(1, k, 1); q.children.forEach((c, i) => { c.rotation.y = t * (i + 1); }); }); f.position.y = 3.4;
    p(f, cone(1.3, 9, 7), 0xff5a1e, 0, 4.5, 0, { glow: true }); p(f, cone(0.86, 6.5, 7), 0xffa040, 0, 3.3, 0, { glow: true }); p(f, cone(0.42, 4, 7), 0xfff0a0, 0, 2, 0, { glow: true });
    orbit(g, 5, 2.4, 9, oct(0.2), 0xffc25a, 1.3, 3);
  },
  // ---------------- Neon Arcology: a wheel, a spire, a train ----------------
  neonwheel(g) {
    p(g, box(16, 0.6, 7), 0x1e2038, 0, 0.3, 0);
    for (const z of [-1.9, 1.9]) for (const s of [-1, 1]) p(g, box(0.7, 11.8, 0.7), 0x3a3c5c, s * 2.9, 5.2, z, { rz: s * 0.56 });
    const W = live(g, (t, q) => { q.rotation.z = t * 0.28; q.userData.cabins.forEach(c => { c.rotation.z = -t * 0.28; }); }); W.position.y = 10; W.userData.cabins = [];
    for (const z of [-1.3, 1.3]) { p(W, ring(8.4, 0.18, 5, 40), 0xff4ac0, 0, 0, z, { glow: true }); p(W, ring(4.6, 0.11, 5, 30), 0x48e0ff, 0, 0, z, { glow: true }); }
    p(W, cyl(0.7, 0.7, 4.4, 10), 0xffe14a, 0, 0, 0, { glow: true, rx: PI / 2 });
    const COL = [0xff4ac0, 0x48e0ff, 0x7dff9a, 0xffe14a];
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; for (const z of [-1.3, 1.3]) p(W, box(8.3, 0.1, 0.1), 0x8a8cb0, Math.cos(a) * 4.15, Math.sin(a) * 4.15, z, { rz: a }); const c = new T.Group(); c.position.set(Math.cos(a) * 8.4, Math.sin(a) * 8.4, 0); W.add(c); W.userData.cabins.push(c); p(c, box(1.5, 1.4, 1.5), COL[i % 4], 0, -0.9, 0, { glow: true }); p(c, box(1.8, 0.14, 1.8), 0x1e2038, 0, -0.14, 0); }
  },
  spire(g) {
    const C = [0xff4ac0, 0x48e0ff, 0x7dff9a, 0xffe14a], skin = 0x1e2038;
    p(g, cyl(11, 12, 0.5, 8), 0x282a4a, 0, 0.25, 0);
    for (let i = 0; i < 6; i++) { const w = 7.4 - i * 0.9, y = 2.5 + i * 4.6; p(g, box(w, 4.6, w), i % 2 ? skin : 0x262846, 0, y, -1); p(g, box(w + 0.1, 0.3, w + 0.1), C[i % 4], 0, y + 2.1, -1, { glow: true }); for (const x of [-w * 0.26, w * 0.26]) p(g, box(0.34, 3.4, 0.1), C[(i + 1) % 4], x, y - 0.1, w / 2 - 1 + 0.02, { glow: true }); }
    p(g, cyl(0.16, 0.5, 5, 6), 0x8a8cb0, 0, 30, -1); p(g, ball(0.34, 8, 6), 0xff4ac0, 0, 32.6, -1, { glow: true });
    for (const [x, z, h, w, c] of [[-7, 3, 15, 3, 0], [7, 3, 18, 3.2, 1], [-7.6, -5, 21, 3, 2], [7.6, -5, 13, 3.4, 3], [-3.4, 7, 8, 2.6, 1], [3.8, 7, 10, 2.6, 0]]) { p(g, box(w, h, w), skin, x, h / 2, z); for (let y = 2; y < h; y += 2.6) p(g, box(w + 0.08, 0.2, w + 0.08), C[(c + Math.round(y)) % 4], x, y, z, { glow: true }); }
    for (const [x, y, l] of [[-4.2, 11, 3.5], [4.2, 13, 3.5], [-4.6, 17, 3.2]]) p(g, box(l, 0.4, 0.9), 0x48e0ff, x, y, y > 16 ? -3 : 1, { glow: true });
    const holo = live(g, (t, q) => { q.rotation.y = t * 0.9; q.position.y = 24.6 + Math.sin(t) * 0.5; }); holo.position.set(9.5, 24.6, 4);
    p(holo, cyl(1.3, 1.3, 4.4, 10), 0x48e0ff, 0, 0, 0, { alpha: 0.42 }); p(holo, cyl(0.55, 1.25, 1.3, 10), 0x48e0ff, 0, 2.9, 0, { alpha: 0.42 }); p(holo, cyl(0.55, 0.55, 1.2, 10), 0x48e0ff, 0, 4.1, 0, { alpha: 0.42 }); p(holo, cyl(1.34, 1.34, 1.6, 10), 0xff4ac0, 0, -0.3, 0, { alpha: 0.55 }); p(holo, ring(3, 0.08, 4, 26), 0x7dff9a, 0, -3, 0, { glow: true, rx: PI / 2 });
  },
  skytrain(g) {
    p(g, box(5.4, 4, 4.4), 0x1e2038, 0, 2, 0); p(g, box(5.5, 0.3, 4.5), 0x7dff9a, 0, 3.6, 0, { glow: true }); p(g, box(3, 1.4, 0.1), 0xffe14a, 0, 2, 2.25, { glow: true });
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; p(g, box(0.5, 7, 0.5), 0x3a3c5c, Math.cos(a) * 9, 3.5, Math.sin(a) * 9); }
    p(g, ring(9, 0.34, 5, 44), 0x3a3c5c, 0, 7, 0, { rx: PI / 2 }); p(g, ring(9, 0.09, 4, 44), 0x48e0ff, 0, 7.4, 0, { glow: true, rx: PI / 2 });
    const tr = live(g, (t, q) => { q.rotation.y = -t * 0.7; });
    for (let i = 0; i < 4; i++) { const a = i * 0.34, c = new T.Group(); c.position.set(Math.cos(a) * 9, 8, Math.sin(a) * 9); c.rotation.y = -a; tr.add(c); p(c, box(1.3, 1.1, 2.7), i ? 0xeef2ff : 0xff4ac0, 0, 0, 0); p(c, box(1.34, 0.36, 2.2), 0x48e0ff, 0, 0.15, 0, { glow: true }); }
  },
  // ---------------- Starfall Expanse: a telescope, a gate over everything, the star itself ----------------
  telescope(g) {
    const stone = 0x4a4068, brass = 0xc9a24a;
    p(g, cyl(9, 9.6, 1, 12), 0x2a2250, 0, 0.5, 0); p(g, cyl(6.4, 6.8, 6, 12), stone, 0, 4, -1); p(g, ball(6.4, 14, 8), 0xdcd4f0, 0, 7, -1, { s: [1, 0.8, 1] });
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; p(g, box(0.6, 2.2, 0.06), 0xffe9a0, Math.cos(a) * 6.5, 3.8, -1 + Math.sin(a) * 6.5, { glow: true, ry: -a + PI / 2 }); }
    const s = new T.Group(); s.position.set(1, 11, 0); s.rotation.set(-0.72, 0.5, 0); g.add(s);
    p(s, cyl(2, 1.5, 7, 12), brass, 0, 4.6, 0); p(s, cyl(1.5, 1.2, 6, 12), 0xe0bc60, 0, 10.5, 0); p(s, cyl(1.2, 1, 4, 12), brass, 0, 15, 0); p(s, cyl(2.2, 2.2, 0.5, 12), 0x8a6a2a, 0, 8.1, 0); p(s, cyl(1.8, 1.8, 0.4, 12), 0x8a6a2a, 0, 13.4, 0); p(s, cyl(1, 1, 0.14, 12), 0x9fe8ff, 0, 17.05, 0, { glow: true });
    p(g, cyl(1.5, 2.6, 7, 8), 0x8a6a2a, 1, 8, 0.2);
    for (let i = 0; i < 9; i++) p(g, box(5, 0.4, 1.2), 0x6a5a90, 0, 0.9 + i * 0.5 - 0.5, 9.6 - i * 0.8);
    const pl = live(g, (t, q) => { q.rotation.y = t * 0.3; });
    for (const [R, r, c, y] of [[12, 1.1, 0xff8ab4, 17], [15, 0.7, 0x8fd8ff, 22]]) { p(pl, ball(r, 10, 7), c, R, y, 0, { glow: true }); p(pl, ring(r * 1.7, 0.08, 4, 22), 0xffffff, R, y, 0, { glow: true, rx: 1.2 }); }
  },
  stargate(g) {
    const stone = 0x2a2250, trim = 0xd8b8ff;
    p(g, cyl(12, 13.4, 1.4, 12), stone, 0, 0.7, 0); for (let i = 0; i < 5; i++) p(g, box(9 - i, 0.6, 1.5), 0x4a3c80, 0, 1.3 + i * 0.55, 13 - i * 1.4);
    for (const s of [-1, 1]) { p(g, box(5, 12, 5), stone, s * 12, 7, 0, { rz: -s * 0.16 }); p(g, cone(3.2, 8, 4), 0x3a2e68, s * 12.8, 16.8, 0, { ry: PI / 4, rz: -s * 0.12 }); p(g, box(0.5, 9, 0.3), trim, s * 12.1, 7, 2.56, { glow: true, rz: -s * 0.16 }); }
    p(g, ring(14.2, 1.7, 8, 56), 0x3a2e68, 0, 18, 0); p(g, ring(14.2, 0.4, 5, 56), trim, 0, 18, 1.6, { glow: true }); p(g, ring(14.2, 0.4, 5, 56), trim, 0, 18, -1.6, { glow: true });
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; p(g, box(1.4, 2.4, 3.8), i % 2 ? 0xffd25a : 0x8fd8ff, Math.cos(a) * 16, 18 + Math.sin(a) * 16, 0, { rz: a, glow: !!(i % 2) }); }
    p(g, cone(2.6, 6, 6), 0xffd25a, 0, 36, 0, { glow: true }); p(g, oct(1.5), 0xffffff, 0, 40.5, 0, { glow: true });
    const inner = live(g, (t, q) => { q.rotation.z = -t * 0.4; }); inner.position.y = 18;
    p(inner, ring(12, 0.3, 5, 48), 0xc9a8ff, 0, 0, 0, { glow: true }); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; p(inner, box(0.34, 2.2, 0.34), 0xffffff, Math.cos(a) * 12, Math.sin(a) * 12, 0, { rz: a, glow: true }); }
    const swirl = live(g, (t, q) => { q.rotation.z = t * 0.6; q.children[0].material.opacity = 0.42 + Math.sin(t * 1.4) * 0.1; }); swirl.position.y = 18;
    p(swirl, new T.CircleGeometry(11.6, 36), 0x8a5aff, 0, 0, 0, { alpha: 0.42 });
    for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + k * 0.9, r = 2.5 + i * 0.72; p(swirl, oct(0.24 + i * 0.022), k ? 0xbfe4ff : 0xffffff, Math.cos(a) * r, Math.sin(a) * r, 0.3, { glow: true }); }
    orbit(g, 12, 21, 16, oct(0.8), 0xd8b8ff, 0.12, 6, { glow: true });
  },
  fallenstar(g) {
    p(g, cyl(7, 8.6, 1, 12), 0x1e1838, 0, 0.3, 0); p(g, cyl(3.6, 3.6, 0.1, 12), 0xb98cff, 0, 0.86, 0, { glow: true });
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, h = 2.5 + (i * 5 % 4); p(g, cone(0.7, h, 5), i % 2 ? 0xc9a8ff : 0x8fd8ff, Math.cos(a) * 5.4, h / 2, Math.sin(a) * 5.4, { glow: true, rz: -Math.cos(a) * 0.28, rx: Math.sin(a) * 0.28 }); }
    const s = live(g, (t, q) => { q.position.y = 17 + Math.sin(t * 0.5) * 0.8; q.children[0].rotation.y = t * 0.2; q.children[1].rotation.set(1.2 + Math.sin(t * 0.3) * 0.2, t * 0.5, 0); q.children[2].rotation.set(1.6, -t * 0.35, 0.4); q.children[3].rotation.set(0.4, t * 0.2, t * 0.3); }); s.position.y = 17;
    p(s, ico(5, 1), 0x4a4068, 0, 0, 0); p(s, ring(8, 0.3, 6, 44), 0xd8b8ff, 0, 0, 0, { glow: true }); p(s, ring(10, 0.18, 6, 44), 0x8fd8ff, 0, 0, 0, { glow: true }); p(s, ring(12, 0.12, 6, 44), 0xffe07a, 0, 0, 0, { glow: true });
    for (let i = 0; i < 7; i++) { const a = i * 2.4, b = i * 1.1; p(s.children[0], box(0.5, 0.5, 0.3), 0xffe07a, Math.cos(a) * Math.cos(b) * 4.8, Math.sin(b) * 4.8, Math.sin(a) * Math.cos(b) * 4.8, { glow: true, ry: a }); }
    for (const [x, y, z, r] of [[-11, 14, 3, 2.6], [12, 11, 2, 2.1], [-8, 21, -4, 1.8], [10, 22, -3, 2]]) {
      const isle = live(g, (t, q) => { q.position.y = y + Math.sin(t * 0.7 + x) * 0.5; }); isle.position.set(x, y, z);
      p(isle, cone(r, r * 1.9, 6), 0x3a2e68, 0, -r * 0.95, 0, { rx: PI }); p(isle, cyl(r, r, 0.3, 6), 0x7f6ad0, 0, 0.1, 0); p(isle, cone(0.4, 1.5, 5), 0xc9a8ff, 0.3, 1, 0, { glow: true });
    }
  },
};
AF.EML = {
  // draws one, and tells you what in it keeps moving
  build(key, g) { liveList = []; BUILD[key](g); const l = liveList; liveList = null; return l; },
  has: key => !!BUILD[key],
};
})();
