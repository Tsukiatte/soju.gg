/* Aura Farm Defense: the world bosses, rebuilt (31 Oct, Chris: "the gloomhollow boss looks horrible. frostveil pass boss,
   sunscar dunes, they all look like shitty ai generated art ... spend more time on the models please ... dont hold
   back"). Each replaces the first quick model in worlds.js (AF.WORLDS.FOES) with a proper one in the same toon style:
   anatomy instead of a stack of boxes, cloth and fur in layers that move, a signature weapon, light only where it means
   something, and a silhouette that reads from the match camera. Same contract as every enemy: built about facing +z,
   L takes the leg pivots the board swings as it walks, g.userData.anim(w) runs each frame with the walk phase. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, Wd = AF.WORLDS;
const { box, pivot, mesh, cone, cyl, ball } = K;
const PI = Math.PI, TAU = PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, max = Math.max;
const F = Wd.FOES, hot = Wd.hot;
const hbox = (p, w, h, d, hex, k, x, y, z, o) => hot(p, new T.BoxGeometry(w, h, d), hex, k, x, y, z, o);
const oct = r => new T.OctahedronGeometry(r, 0);
// a crystal: a long four-sided spike with a pale lit face, set at (x, y, z) leaning by (rx, rz)
function crystal(p, r, len, c, x, y, z, rx = 0, rz = 0, o = {}) {
  const s = pivot(p, x, y, z); s.rotation.set(rx, o.ry || 0, rz);
  mesh(s, cone(r, len, 4), c, 0, len / 2, 0, { ry: PI / 4, inkScale: o.inkScale || 1.1 });
  if (o.core) hot(s, cone(r * 0.45, len * 0.7, 4), o.core, o.k || 1.6, 0, len * 0.38, 0, { ry: PI / 4 });
  return s;
}

// ======================= The Lich (Gloomhollow) =======================
// a skeletal sorcerer-king hovering over a turning circle of runes: a tattered robe in hanging strips, an open chest
// with a ribcage round a burning phylactery, a high fan of bone behind his skull, a tarnished crown, flames for eyes,
// a staff caging a soul, a grimoire that floats at his side, and the souls he keeps circling him
F.lich = (g, L) => {
  const ROBE = 0x2a1238, ROBE2 = 0x3c1a52, LINE = 0x14081c, BONE = 0xe8e0cc, BONE2 = 0xc8bea6, GOLD = 0xc9a24a, SOUL = 0xb85aff, SOUL2 = 0xe2b8ff;
  // the circle under him
  const circ = pivot(g, 0, 0.04, 0);
  hot(circ, new T.CircleGeometry(1.05, 40), SOUL, 1, 0, 0, 0, { rx: -PI / 2, a: 0.12, add: true });
  hot(circ, new T.TorusGeometry(1.0, 0.025, 4, 64), SOUL, 2.2, 0, 0.01, 0, { rx: PI / 2 });
  hot(circ, new T.TorusGeometry(0.78, 0.018, 4, 56), SOUL, 1.8, 0, 0.01, 0, { rx: PI / 2 });
  for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; hbox(circ, 1.33, 0.015, 0.03, SOUL, 1.8, cos(a + PI / 2) * 0.39, 0.012, sin(a + PI / 2) * 0.39, { ry: -a }); }
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; hbox(circ, 0.08, 0.015, 0.12, SOUL2, 2.4, cos(a) * 0.89, 0.014, sin(a) * 0.89, { ry: -a + (k % 2) * 0.6 }); }
  const b = pivot(g, 0, 1.15, 0);
  // the robe: a dark core, then strips that hang to a ragged hem and drift
  mesh(b, cone(0.42, 1.1, 10), LINE, 0, -0.48, 0, { rx: PI, ink: false });
  const strips = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU, s = pivot(b, cos(a) * 0.4, 0.0, sin(a) * 0.36); s.rotation.y = -a + PI / 2;
    const c = k % 2 ? ROBE : ROBE2, len = 0.55, len2 = 0.36 + ((k * 7) % 5) * 0.06;
    box(s, 0.28, len, 0.05, c, 0, -len / 2, 0);
    const s2 = pivot(s, 0, -len, 0);
    box(s2, 0.24, len2, 0.045, c, 0, -len2 / 2, 0);
    mesh(s2, cone(0.12, 0.22, 3), c, (k % 3 - 1) * 0.05, -len2 - 0.09, 0, { rx: PI, inkScale: 1.15 });
    strips.push([s, s2, k]);
  }
  mesh(b, new T.TorusGeometry(0.43, 0.035, 5, 28), GOLD, 0, 0.02, 0, { rx: PI / 2, ink: false });
  // a long tattered cape down the back
  const cape = [];
  for (let k = 0; k < 3; k++) {
    const s = pivot(b, (k - 1) * 0.26, 0.78, -0.3), len = 1.1 + (k % 2) * 0.25;
    box(s, 0.3, len, 0.05, ROBE, 0, -len / 2, 0);
    mesh(s, cone(0.15, 0.3, 3), ROBE, 0, -len - 0.12, 0, { rx: PI });
    cape.push(s);
  }
  // the chest: open lapels, a dark cavity with ribs round the phylactery
  const t = pivot(b, 0, 0.05, 0);
  box(t, 0.78, 0.82, 0.48, ROBE, 0, 0.42, -0.04);
  for (const s of [-1, 1]) {
    box(t, 0.22, 0.84, 0.08, ROBE2, s * 0.26, 0.42, 0.22, { rz: s * 0.08 });
    box(t, 0.04, 0.84, 0.03, GOLD, s * 0.155, 0.42, 0.265, { rz: s * 0.08, ink: false });
  }
  box(t, 0.3, 0.7, 0.04, LINE, 0, 0.45, 0.2, { ink: false });
  box(t, 0.04, 0.62, 0.04, BONE2, 0, 0.47, 0.21, { ink: false });
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) box(t, 0.15 - k * 0.012, 0.035, 0.035, BONE, s * 0.08, 0.68 - k * 0.12, 0.225, { rz: s * (0.35 + k * 0.05), ink: false });
  const gem = hot(t, oct(0.08), SOUL, 3.2, 0, 0.42, 0.22, { own: 1 });
  const gemGlow = hot(t, ball(0.16, 2), SOUL, 1, 0, 0.42, 0.22, { a: 0.35, add: true, own: 1 });
  // the bone fan behind his head and the pauldrons
  for (let k = 0; k < 7; k++) {
    const x = (k - 3) * 0.13, h = 0.85 - abs(k - 3) * 0.14;
    const sp = pivot(t, x, 0.84, -0.22); sp.rotation.set(-0.35, 0, -(k - 3) * 0.2);
    mesh(sp, cone(0.065, h, 4), k % 2 ? BONE2 : BONE, 0, h / 2, 0, { ry: PI / 4 });
  }
  box(t, 0.9, 0.2, 0.3, ROBE2, 0, 0.84, -0.18, { rx: -0.3 });
  for (const s of [-1, 1]) {
    const pa = pivot(t, s * 0.48, 0.8, 0);
    box(pa, 0.36, 0.16, 0.44, GOLD, 0, 0.02, 0, { rz: s * -0.3 });
    box(pa, 0.32, 0.12, 0.4, BONE, s * 0.04, 0.12, 0, { rz: s * -0.3 });
    for (let k = 0; k < 3; k++) mesh(pa, cone(0.045, 0.24 - k * 0.04, 4), BONE, s * (0.06 + k * 0.08), 0.22 - k * 0.03, -0.08 + k * 0.08, { rz: s * -0.6, ry: PI / 4, inkScale: 1.2 });
  }
  // the skull: cranium, brow, sockets with flames in them, cheekbones, teeth, a jaw that chatters, a crown askew
  const h = pivot(t, 0, 0.9, 0.04);
  box(h, 0.42, 0.36, 0.42, BONE, 0, 0.24, 0);
  box(h, 0.36, 0.14, 0.36, BONE, 0, 0.46, -0.02);
  box(h, 0.44, 0.07, 0.08, BONE2, 0, 0.29, 0.2, { ink: false });
  const flames = [];
  for (const s of [-1, 1]) {
    box(h, 0.13, 0.11, 0.04, 0x07040a, s * 0.1, 0.21, 0.205, { ink: false });
    hbox(h, 0.06, 0.05, 0.02, SOUL2, 3.4, s * 0.1, 0.2, 0.225);
    const fl = hot(h, cone(0.05, 0.2, 4), SOUL, 2.6, s * 0.1, 0.32, 0.215, { own: 1 });
    flames.push(fl);
    box(h, 0.08, 0.07, 0.3, BONE2, s * 0.21, 0.12, 0.04, { ink: false });
    box(h, 0.03, 0.12, 0.02, 0x2a2228, s * 0.13, 0.42, 0.205, { rz: s * 0.4, ink: false });
  }
  mesh(h, cone(0.04, 0.08, 3), 0x07040a, 0, 0.12, 0.215, { rx: PI, ink: false });
  for (let k = 0; k < 5; k++) box(h, 0.045, 0.06, 0.03, 0xf6f2e6, -0.1 + k * 0.05, 0.06, 0.2, { ink: false });
  const jaw = pivot(h, 0, 0.06, -0.08);
  box(jaw, 0.34, 0.08, 0.3, BONE2, 0, -0.04, 0.1);
  for (let k = 0; k < 5; k++) box(jaw, 0.04, 0.05, 0.03, 0xf6f2e6, -0.1 + k * 0.05, 0.02, 0.25, { ink: false });
  const crown = pivot(h, 0, 0.55, 0); crown.rotation.set(-0.06, 0, 0.14);
  for (const [w, d, x, z] of [[0.46, 0.06, 0, 0.21], [0.46, 0.06, 0, -0.21], [0.06, 0.46, 0.21, 0], [0.06, 0.46, -0.21, 0]]) box(crown, w, 0.1, d, GOLD, x, 0, z, { ink: 0.015 });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, r = 0.24; mesh(crown, cone(0.045, 0.2 + (k % 2) * 0.1, 4), GOLD, cos(a) * r, 0.14 + (k % 2) * 0.05, sin(a) * r, { ry: PI / 4, inkScale: 1.2 }); }
  hot(crown, oct(0.05), 0xff3a6a, 3, 0, 0.05, 0.25);
  // the arms in long sleeves, bone hands; the right holds the staff, the left casts
  const arm = s => {
    const a = pivot(t, s * 0.5, 0.72, 0);
    mesh(a, cyl(0.12, 0.24, 0.62, 8), ROBE2, 0, -0.3, 0);
    mesh(a, new T.TorusGeometry(0.235, 0.03, 4, 16), GOLD, 0, -0.61, 0, { rx: PI / 2, ink: false });
    const hd = pivot(a, 0, -0.66, 0);
    box(hd, 0.12, 0.07, 0.11, BONE, 0, -0.04, 0);
    for (let k = 0; k < 4; k++) { const f = pivot(hd, -0.045 + k * 0.03, -0.07, 0.04); f.rotation.x = 0.4; box(f, 0.025, 0.15, 0.025, BONE, 0, -0.075, 0, { ink: false }); }
    return { a, hd };
  };
  const R = arm(1), Lf = arm(-1);
  R.a.rotation.set(-0.35, 0, 0.12);
  const staff = pivot(R.hd, 0, -0.06, 0.04); staff.rotation.x = 0.35;
  mesh(staff, cyl(0.035, 0.05, 2.5, 6), 0x2a1a22, 0, 0.55, 0);
  for (let k = 0; k < 4; k++) mesh(staff, cyl(0.055, 0.055, 0.06, 6), BONE2, 0, -0.4 + k * 0.5, 0, { ink: false });
  const head = pivot(staff, 0, 1.82, 0);
  box(head, 0.12, 0.12, 0.12, BONE, 0, 0, 0);
  box(head, 0.035, 0.035, 0.02, 0x07040a, -0.03, 0.01, 0.06, { ink: false }); box(head, 0.035, 0.035, 0.02, 0x07040a, 0.03, 0.01, 0.06, { ink: false });
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + PI / 4, pr = pivot(head, cos(a) * 0.06, 0.06, sin(a) * 0.06); pr.rotation.set(sin(a) * 0.55, 0, -cos(a) * 0.55);
    box(pr, 0.035, 0.3, 0.035, BONE, 0, 0.15, 0);
    const tip = pivot(pr, 0, 0.3, 0); tip.rotation.set(-sin(a) * 1.0, 0, cos(a) * 1.0);
    mesh(tip, cone(0.03, 0.18, 4), BONE, 0, 0.09, 0, { inkScale: 1.2 });
  }
  const orb = hot(head, ball(0.12, 2), SOUL2, 3, 0, 0.3, 0, { own: 1 });
  const orbGlow = hot(head, ball(0.24, 2), SOUL, 1, 0, 0.3, 0, { a: 0.3, add: true, own: 1 });
  Lf.a.rotation.set(-1.15, 0.3, -0.25);
  const spell = pivot(Lf.hd, 0, -0.2, 0.08);
  hot(spell, ball(0.07, 1), SOUL2, 3.2, 0, 0, 0);
  const sring = pivot(spell); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; hbox(sring, 0.05, 0.05, 0.01, SOUL, 2.6, cos(a) * 0.17, sin(a) * 0.17, 0); }
  // the grimoire, open, floating at his left
  const book = pivot(g, -0.95, 1.6, 0.3); book.rotation.set(-0.5, 0.5, 0);
  box(book, 0.36, 0.05, 0.26, 0x3a1430, 0, 0, 0);
  for (const s of [-1, 1]) {
    box(book, 0.17, 0.04, 0.24, 0xe8dcc0, s * 0.09, 0.04, 0, { rz: s * 0.15, ink: 0.012 });
    for (let k = 0; k < 3; k++) hbox(book, 0.11, 0.01, 0.015, SOUL, 2.2, s * 0.09, 0.066, 0.06 - k * 0.05, { rz: s * 0.15 });
    for (const z of [-1, 1]) box(book, 0.05, 0.06, 0.05, GOLD, s * 0.17, 0, z * 0.12, { ink: false });
  }
  const page = pivot(book, 0, 0.05, 0); box(page, 0.16, 0.012, 0.22, 0xf2e8d0, 0.08, 0, 0, { ink: false });
  // the souls he keeps
  const souls = [];
  for (let k = 0; k < 5; k++) {
    const s = pivot(g, 0, 0, 0), trail = [];
    hot(s, ball(0.055, 1), SOUL2, 3); hot(s, ball(0.12, 1), SOUL, 1, 0, 0, 0, { a: 0.28, add: true });
    for (let j = 1; j <= 3; j++) trail.push(hot(g, ball(0.045 - j * 0.009, 1), SOUL, 2 - j * 0.3, 0, 0, 0, { a: 0.7 - j * 0.15, add: true }));
    souls.push([s, trail]);
  }
  g.userData.anim = w => {
    const bob = sin(w * 0.7) * 0.08;
    b.position.y = 1.15 + bob;
    circ.rotation.y = w * 0.25;
    strips.forEach(([s, s2, k]) => { s.rotation.x = 0.12 + sin(w * 1.1 + k * 0.9) * 0.07; s2.rotation.x = 0.1 + sin(w * 1.1 + k * 0.9 - 0.8) * 0.16; });
    cape.forEach((s, k) => { s.rotation.x = 0.35 + sin(w * 1.0 + k) * 0.1; });
    const p = 1 + sin(w * 2.2) * 0.18;
    gem.scale.setScalar(p); gemGlow.scale.setScalar(p * 1.1); gem.rotation.y = w;
    flames.forEach((f, i) => { f.scale.set(1, 0.8 + abs(sin(w * 5 + i * 2)) * 0.6, 1); });
    jaw.rotation.x = max(0, sin(w * 1.7)) * 0.25 * (sin(w * 0.35) > 0.3 ? 1 : 0.15);
    h.rotation.y = sin(w * 0.4) * 0.25; h.rotation.z = sin(w * 0.55) * 0.06;
    R.a.rotation.x = -0.35 + sin(w * 0.7) * 0.08;
    Lf.a.rotation.x = -1.15 + sin(w * 0.9) * 0.15;
    sring.rotation.z = w * 1.6; spell.scale.setScalar(1 + sin(w * 3) * 0.15);
    orb.scale.setScalar(1 + sin(w * 2) * 0.12); orbGlow.scale.setScalar(1 + sin(w * 2) * 0.2);
    book.position.y = 1.6 + sin(w * 0.9 + 1) * 0.1; book.rotation.y = 0.5 + sin(w * 0.5) * 0.2;
    page.rotation.z = -abs(sin(w * 1.3)) * 2.8;
    const at = (k, ww) => { const a = ww * (0.5 + k * 0.08) + k * 1.3, r = 0.75 + (k % 2) * 0.25; return [cos(a) * r, 1.0 + sin(ww * 0.8 + k * 1.7) * 0.45 + k * 0.12, sin(a) * r]; };
    souls.forEach(([s, trail], k) => { s.position.set(...at(k, w)); trail.forEach((m, j) => m.position.set(...at(k, w - (j + 1) * 0.09))); });
  };
};

// ======================= The Frost Giant (Frostveil Pass) =======================
// a hunched mountain of a giant: grey-blue skin cut with glowing frost runes, a glacier grown out of his shoulders and
// spine, a fur mantle, a heavy brow over ice-lit eyes, tusks, a beard of icicles, a maul of a whole tree trunk with a
// block of glacier bound to it carried over his shoulder, and his breath freezing in the air
F.giant = (g, L) => {
  const SKIN = 0x6c8cbc, SKIN2 = 0x56749e, ICE = 0xbfe8ff, ICE2 = 0x8fd0f4, RUNE = 0x9fe8ff, FUR = 0xe8ecf0, FUR2 = 0x9a8a76, LEATH = 0x5a3e2a, WOOD = 0x6a4a30;
  // legs: short and thick, fur wraps, big feet
  for (const s of [-1, 1]) {
    const l = pivot(g, s * 0.32, 0.92, 0);
    box(l, 0.42, 0.42, 0.44, SKIN2, 0, -0.2, 0);
    box(l, 0.5, 0.2, 0.52, FUR2, 0, -0.42, 0, { ink: 0.02 });
    box(l, 0.38, 0.34, 0.4, SKIN2, 0, -0.62, 0);
    box(l, 0.46, 0.14, 0.48, FUR, 0, -0.66, 0, { ink: 0.015 });
    box(l, 0.46, 0.16, 0.6, SKIN, 0, -0.84, 0.08);
    for (let k = -1; k <= 1; k++) box(l, 0.12, 0.1, 0.1, SKIN2, k * 0.14, -0.86, 0.42, { ink: 0.012 });
    L.push(l);
  }
  // hips: a wide belt with a buckle of ice, a fur loincloth front and back
  const b = pivot(g, 0, 1.0, 0);
  box(b, 1.1, 0.24, 0.72, LEATH, 0, 0, 0, { ink: 0.02 });
  box(b, 0.3, 0.24, 0.06, ICE, 0, 0, 0.38, { ink: 0.015 }); hbox(b, 0.12, 0.1, 0.02, RUNE, 1.8, 0, 0, 0.42);
  const flap = pivot(b, 0, -0.1, 0.36); box(flap, 0.5, 0.5, 0.06, FUR2, 0, -0.24, 0); box(flap, 0.42, 0.08, 0.07, FUR, 0, -0.46, 0, { ink: false });
  const flapB = pivot(b, 0, -0.1, -0.36); box(flapB, 0.7, 0.45, 0.06, FUR2, 0, -0.22, 0);
  // the body, leaning forward: belly, barrel chest, rune lines
  const t = pivot(b, 0, 0.1, 0); t.rotation.x = 0.28;
  box(t, 1.1, 0.5, 0.8, SKIN2, 0, 0.25, 0.02);
  box(t, 1.4, 0.75, 0.9, SKIN, 0, 0.82, 0);
  for (const s of [-1, 1]) box(t, 0.6, 0.36, 0.1, SKIN, s * 0.32, 0.85, 0.46, { ink: 0.015 });
  [[-0.32, 0.92, 0.52, 0.3, 0.6], [0.32, 0.92, 0.52, 0.3, -0.6], [0, 0.62, 0.52, 0.45, 0], [-0.3, 0.45, 0.42, 0.25, -0.9], [0.3, 0.45, 0.42, 0.25, 0.9]]
    .forEach(([x, y, z, l, rz]) => hbox(t, 0.04, l, 0.02, RUNE, 1.7, x, y, z, { rz }));
  // the fur mantle over the shoulders and back
  box(t, 1.62, 0.3, 1.0, FUR, 0, 1.22, -0.06, { ink: 0.02 });
  for (let k = 0; k < 9; k++) mesh(t, cone(0.09, 0.22, 4), FUR, -0.72 + k * 0.18, 1.1, 0.5, { rx: PI - 0.3, ry: PI / 4, inkScale: 1.15 });
  box(t, 1.5, 0.9, 0.12, FUR2, 0, 0.8, -0.5, { ink: 0.02 });
  // the glacier on his back: ridges of ice along the spine and out of each shoulder
  for (let k = 0; k < 5; k++) crystal(t, 0.13 + (k % 2) * 0.04, 0.45 + k * 0.1, ICE, (k % 2 - 0.5) * 0.18, 1.0 - k * 0.12, -0.45 - k * 0.04, -0.6 - k * 0.05, (k % 2 - 0.5) * 0.4, { core: RUNE, k: 1.4 });
  for (const s of [-1, 1]) {
    const sh = pivot(t, s * 0.75, 1.2, 0);
    box(sh, 0.5, 0.42, 0.62, SKIN, 0, -0.05, 0);
    crystal(sh, 0.16, 0.7, ICE, s * 0.08, 0.15, -0.05, -0.2, s * -0.5, { core: RUNE });
    crystal(sh, 0.12, 0.5, ICE2, s * 0.2, 0.08, 0.15, 0.3, s * -0.9);
    crystal(sh, 0.1, 0.4, ICE, -s * 0.05, 0.16, -0.25, -0.7, s * -0.2);
  }
  // the head: low between the shoulders, heavy brow, eyes lit from inside, tusks, an icicle beard
  const h = pivot(t, 0, 1.24, 0.42); h.rotation.x = -0.28; h.scale.setScalar(1.18);
  box(h, 0.56, 0.5, 0.52, SKIN, 0, 0.18, 0);
  box(h, 0.62, 0.14, 0.2, SKIN2, 0, 0.32, 0.22, { ink: 0.015 });
  for (const s of [-1, 1]) {
    box(h, 0.16, 0.07, 0.04, 0x16202e, s * 0.13, 0.22, 0.27, { ink: false });
    hbox(h, 0.1, 0.05, 0.02, RUNE, 3.2, s * 0.13, 0.22, 0.29);
    box(h, 0.2, 0.06, 0.06, FUR, s * 0.15, 0.4, 0.31, { rz: s * -0.25, ink: 0.01 });
    mesh(h, cone(0.05, 0.22, 4), 0xf2ead8, s * 0.17, 0.04, 0.3, { rz: s * 0.25, inkScale: 1.2 });
  }
  box(h, 0.16, 0.16, 0.14, SKIN2, 0, 0.12, 0.32);
  box(h, 0.5, 0.14, 0.42, SKIN2, 0, -0.06, 0.08);
  const beard = [];
  for (let k = 0; k < 9; k++) {
    const x = -0.22 + k * 0.055, len = 0.22 + ((k * 5) % 4) * 0.08 + (k === 4 ? 0.14 : 0);
    beard.push(mesh(h, cone(0.05, len, 4), k % 2 ? ICE : FUR, x, -0.13 - len / 2, 0.2 + (k % 2) * 0.03, { rx: PI, inkScale: 1.15 }));
  }
  for (let k = 0; k < 5; k++) crystal(h, 0.06, 0.18 + (k % 2) * 0.12, ICE, -0.2 + k * 0.1, 0.42, -0.05, -0.2, (k - 2) * 0.25, { core: RUNE, k: 1.8 });
  // arms: huge forearms crusted in ice, fists of stone
  const arm = s => {
    const a = pivot(t, s * 0.92, 1.12, 0.02);
    box(a, 0.44, 0.6, 0.46, SKIN, 0, -0.28, 0);
    hbox(a, 0.03, 0.4, 0.02, RUNE, 1.6, 0, -0.3, 0.24);
    const f = pivot(a, 0, -0.58, 0);
    box(f, 0.54, 0.62, 0.54, SKIN2, 0, -0.3, 0);
    crystal(f, 0.1, 0.3, ICE, s * 0.2, -0.2, 0.05, 0.2, s * -1.2);
    crystal(f, 0.08, 0.24, ICE2, s * 0.22, -0.4, -0.1, -0.3, s * -1.4);
    const fist = pivot(f, 0, -0.66, 0.02);
    box(fist, 0.48, 0.4, 0.48, SKIN, 0, -0.1, 0);
    for (let k = 0; k < 4; k++) box(fist, 0.1, 0.1, 0.1, SKIN2, -0.15 + k * 0.1, -0.02, 0.26, { ink: 0.01 });
    return { a, f, fist };
  };
  const AR = arm(1), AL = arm(-1);
  // the maul over his right shoulder: a trunk with branch stubs and rope, a glacier block bound to its end
  AR.a.rotation.set(-2.5, 0, -0.25); AR.f.rotation.x = -1.2;
  const maul = pivot(AR.fist, 0, -0.1, 0.05); maul.rotation.set(-0.3, 0, 0);
  mesh(maul, cyl(0.1, 0.13, 2.0, 7), WOOD, 0, -0.2, 0);
  for (let k = 0; k < 3; k++) mesh(maul, cyl(0.04, 0.05, 0.22, 5), WOOD, (k % 2 ? 1 : -1) * 0.12, -0.6 + k * 0.4, 0, { rz: (k % 2 ? -1 : 1) * 1.0 });
  for (let k = 0; k < 3; k++) mesh(maul, new T.TorusGeometry(0.13, 0.025, 4, 12), 0xc8b08a, 0, -0.98 - k * 0.07, 0, { rx: PI / 2, ink: false });
  const blk = pivot(maul, 0, -1.3, 0);
  // the chunk: three blocks at odd angles, one inside the next
  mesh(blk, oct(0.5), ICE, 0, -0.12, 0, { inkScale: 1.06 }).scale.set(1.15, 0.9, 0.95);
  box(blk, 0.62, 0.5, 0.56, ICE2, 0.06, -0.05, 0.02, { rz: 0.35, rx: 0.2 });
  box(blk, 0.5, 0.56, 0.5, ICE, -0.08, -0.2, -0.04, { rz: -0.5, ry: 0.4 });
  hot(blk, oct(0.32), RUNE, 1, 0, -0.12, 0, { a: 0.4, add: true });
  // spikes out of it in every direction (out along each axis, and the diagonals)
  [[1, 0, 0, 0.5], [-1, 0, 0, 0.42], [0, -1, 0, 0.55], [0, 0, 1, 0.4], [0, 0, -1, 0.36], [0.7, -0.7, 0, 0.45], [-0.7, -0.7, 0.2, 0.4], [0.6, 0.2, 0.7, 0.32], [-0.5, 0.1, -0.8, 0.34]].forEach(([dx, dy, dz, len], k) => {
    const sp = pivot(blk, dx * 0.3, -0.12 + dy * 0.3, dz * 0.28);
    sp.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, dy, dz).normalize());
    mesh(sp, cone(0.09 + (k % 2) * 0.03, len, 4), k % 3 ? ICE : ICE2, 0, len / 2, 0, { ry: PI / 4, inkScale: 1.12 });
    if (k % 2) hot(sp, cone(0.04, len * 0.6, 4), RUNE, 1.6, 0, len * 0.34, 0, { ry: PI / 4 });
  });
  for (const z of [-1, 1]) box(blk, 0.7, 0.06, 0.05, 0xc8b08a, 0, 0.22, z * 0.22, { ink: false });
  // the left arm swings low, knuckles near the snow
  AL.a.rotation.set(0.25, 0, 0.18);
  // his breath, freezing as it leaves him
  const breath = [0, 1, 2].map(i => { const m = mesh(g, ball(0.12, 1), 0xf2fbff, 0, 0, 0, { own: 1, ink: false }); m.material.transparent = true; m.material.depthWrite = false; return m; });
  const mouth = new T.Vector3();
  g.userData.anim = w => {
    const st = abs(sin(w * 1.0));
    b.position.y = 1.0 - st * 0.06;
    t.rotation.x = 0.28 + sin(w * 2) * 0.03; t.rotation.y = sin(w) * 0.06;
    AL.a.rotation.x = 0.25 + sin(w + PI) * 0.45; AL.f.rotation.x = -0.25 - max(0, sin(w + PI)) * 0.3;
    AR.a.rotation.x = -2.5 + sin(w * 2) * 0.06;
    h.rotation.y = sin(w * 0.35) * 0.3; h.rotation.z = sin(w * 0.5) * 0.05;
    flap.rotation.x = -0.15 + sin(w) * 0.2; flapB.rotation.x = 0.15 - sin(w) * 0.15;
    beard.forEach((m, k) => { m.rotation.z = sin(w * 1.3 + k) * 0.05; });
    // a cloud every two strides, drifting forward and up as it thins
    h.updateWorldMatrix(true, false); mouth.set(0, 0.0, 0.42); h.localToWorld(mouth); g.worldToLocal(mouth);
    breath.forEach((m, i) => {
      const k = ((w * 0.25 + i / 3) % 1);
      m.position.set(mouth.x, mouth.y + k * 0.3, mouth.z + k * 0.6);
      m.scale.setScalar(0.4 + k * 1.6); m.material.opacity = 0.55 * (1 - k) * (k > 0.02 ? 1 : 0);
    });
  };
};

// ======================= The Sphinx (Sunscar Dunes) =======================
// a lion of sandstone with a woman's stern face: the striped headdress and its lappets, a cobra on her brow, kohl-lined
// eyes lit turquoise, a braided beard, a broad collar of gold and lapis, gold on her legs, great wings of gold,
// turquoise and lapis feathers folding and opening, a tail that swings, and the riddles she asks drifting round her
F.sphinx = (g, L) => {
  const SAND = 0xd9a85e, SAND2 = 0xc08a4a, BELLY = 0xe8c48a, GOLD = 0xe8c050, LAPIS = 0x2a4a9a, TURQ = 0x3ac8c0, FACE = 0xc88a54, GLOW = 0x5af0ff;
  const b = pivot(g, 0, 0.92, 0);
  // the body: deep chest, narrower waist, high haunch, a lighter belly, the spine's ridge
  box(b, 0.84, 0.72, 0.62, SAND, 0, 0.02, 0.5);
  box(b, 0.7, 0.58, 0.62, SAND, 0, 0.0, -0.05);
  box(b, 0.8, 0.68, 0.62, SAND, 0, 0.06, -0.6);
  box(b, 0.6, 0.14, 1.5, BELLY, 0, -0.3, -0.05, { ink: 0.015 });
  for (const s of [-1, 1]) {
    mesh(b, ball(0.3, 1), SAND, s * 0.3, 0.12, 0.5, { inkScale: 1.06 }).scale.set(0.8, 1.05, 1.15);
    mesh(b, ball(0.34, 1), SAND, s * 0.3, 0.12, -0.62, { inkScale: 1.06 }).scale.set(0.8, 1.0, 1.1);
  }
  mesh(b, ball(0.4, 1), SAND, 0, -0.02, 0.66, { inkScale: 1.06 }).scale.set(1.0, 0.9, 0.7);
  for (let k = 0; k < 5; k++) box(b, 0.12, 0.06, 0.24, SAND2, 0, 0.37, 0.45 - k * 0.27, { ink: false });
  // a saddle-cloth of lapis and gold between the wings
  box(b, 0.74, 0.06, 0.62, LAPIS, 0, 0.36, -0.12, { ink: 0.015 });
  for (const s of [-1, 1]) { box(b, 0.06, 0.4, 0.62, LAPIS, s * 0.38, 0.18, -0.12); for (let k = 0; k < 3; k++) box(b, 0.07, 0.05, 0.6, GOLD, s * 0.385, 0.32 - k * 0.12, -0.12, { ink: false }); }
  // the broad collar: rings of gold, lapis and turquoise over the chest
  [[0.52, GOLD, 0.1], [0.46, LAPIS, 0.06], [0.4, TURQ, 0.02], [0.34, GOLD, -0.02]].forEach(([r, c, y], i) => {
    const m = mesh(b, new T.CylinderGeometry(r, r + 0.05, 0.08, 20, 1, false, -1.45, 2.9), c, 0, 0.33 + y, 0.66, { ink: false, own: 1 });
    m.rotation.x = 0.9; m.material.side = T.DoubleSide;
  });
  // legs (diagonal pairs swing together: front left, front right, back right, back left)
  const legs = [];
  const leg = (x, y, z, back) => {
    const l = pivot(g, x, y, z);
    box(l, 0.28, 0.48, 0.34, SAND, 0, -0.2, back ? -0.04 : 0.02);
    const lo = pivot(l, 0, -0.42, 0);
    box(lo, 0.22, 0.34, 0.26, SAND, 0, -0.15, 0);
    box(lo, 0.25, 0.08, 0.29, GOLD, 0, -0.06, 0, { ink: 0.012 }); box(lo, 0.255, 0.03, 0.295, LAPIS, 0, -0.06, 0, { ink: false });
    const paw = pivot(lo, 0, -0.33, 0.04);
    box(paw, 0.28, 0.12, 0.36, SAND, 0, -0.02, 0.04);
    for (let k = 0; k < 4; k++) { box(paw, 0.07, 0.09, 0.09, SAND2, -0.1 + k * 0.066, -0.03, 0.24, { ink: 0.01 }); mesh(paw, cone(0.02, 0.07, 4), 0x2a2018, -0.1 + k * 0.066, -0.05, 0.3, { rx: PI / 2 + 0.3, ink: false }); }
    legs.push({ l, lo, paw }); L.push(l);
  };
  leg(-0.3, 0.72, 0.55, 0); leg(0.3, 0.72, 0.55, 0); leg(0.32, 0.78, -0.62, 1); leg(-0.32, 0.78, -0.62, 1);
  // the head: face, kohl, glowing eyes, the headdress and its stripes, lappets, cobra, beard
  const n = pivot(b, 0, 0.38, 0.68);
  box(n, 0.4, 0.36, 0.34, SAND, 0, 0.1, 0, { rx: -0.2 });
  const h = pivot(n, 0, 0.35, 0.12);
  box(h, 0.44, 0.5, 0.4, FACE, 0, 0.1, 0);
  for (const s of [-1, 1]) {
    box(h, 0.13, 0.05, 0.03, 0x1a1210, s * 0.11, 0.17, 0.205, { ink: false });
    hbox(h, 0.07, 0.04, 0.02, GLOW, 3.2, s * 0.11, 0.14, 0.212);
    box(h, 0.12, 0.025, 0.02, 0x1a1210, s * 0.2, 0.15, 0.2, { rz: s * 0.35, ink: false });
    box(h, 0.12, 0.03, 0.02, 0x2a1810, s * 0.11, 0.24, 0.205, { rz: s * -0.12, ink: false });
  }
  box(h, 0.08, 0.16, 0.08, FACE, 0, 0.05, 0.22);
  box(h, 0.14, 0.04, 0.03, 0x8a3a2a, 0, -0.06, 0.205, { ink: false });
  // the beard: braided, striped, curled forward at the tip
  const beard = pivot(h, 0, -0.14, 0.17);
  for (let k = 0; k < 4; k++) box(beard, 0.1 - k * 0.012, 0.08, 0.09, k % 2 ? LAPIS : GOLD, 0, -0.04 - k * 0.075, k * 0.012, { ink: 0.01 });
  box(beard, 0.06, 0.06, 0.1, GOLD, 0, -0.33, 0.06, { rx: 0.6, ink: 0.01 });
  // the headdress: a cap over the brow, gold band, stripes, the lappets down the chest and the queue down the back
  box(h, 0.52, 0.22, 0.48, GOLD, 0, 0.42, -0.02, { ink: 0.015 });
  for (let k = 0; k < 4; k++) box(h, 0.535, 0.035, 0.49, LAPIS, 0, 0.35 + k * 0.05, -0.02, { ink: false });
  box(h, 0.5, 0.06, 0.06, GOLD, 0, 0.32, 0.22, { ink: 0.012 });
  for (const s of [-1, 1]) {
    const lp = pivot(h, s * 0.3, 0.4, 0.02); lp.rotation.z = s * 0.2;
    box(lp, 0.16, 0.42, 0.34, GOLD, 0, -0.18, 0, { ink: 0.015 });
    for (let k = 0; k < 5; k++) box(lp, 0.165, 0.03, 0.345, LAPIS, 0, -0.04 - k * 0.07, 0, { ink: false });
    const lap = pivot(lp, 0, -0.38, 0.06);
    box(lap, 0.14, 0.42, 0.18, GOLD, 0, -0.2, 0.04, { rx: 0.3, ink: 0.015 });
    for (let k = 0; k < 5; k++) box(lap, 0.145, 0.03, 0.185, LAPIS, 0, -0.06 - k * 0.07, 0.04 + k * 0.02, { rx: 0.3, ink: false });
  }
  const queue = pivot(h, 0, 0.32, -0.25); box(queue, 0.24, 0.42, 0.08, GOLD, 0, -0.2, 0, { rx: -0.25, ink: 0.015 }); for (let k = 0; k < 4; k++) box(queue, 0.245, 0.03, 0.085, LAPIS, 0, -0.06 - k * 0.08, -0.02 * k, { rx: -0.25, ink: false });
  // the cobra rearing on the brow
  const ur = pivot(h, 0, 0.48, 0.24);
  box(ur, 0.12, 0.05, 0.1, GOLD, 0, -0.02, -0.02, { ink: 0.012 });
  box(ur, 0.06, 0.14, 0.06, GOLD, 0, 0.06, 0.02, { ink: 0.012 });
  mesh(ur, cyl(0.1, 0.05, 0.14, 8), GOLD, 0, 0.17, 0.0, { inkScale: 1.15 }).scale.z = 0.35;
  box(ur, 0.05, 0.1, 0.02, LAPIS, 0, 0.16, 0.025, { ink: false });
  box(ur, 0.07, 0.05, 0.09, GOLD, 0, 0.255, 0.035, { ink: 0.012 });
  for (const s of [-1, 1]) hbox(ur, 0.02, 0.02, 0.02, 0xff3a3a, 3, s * 0.025, 0.25, 0.075);
  // wings: an arm of gold, then rows of feathers (lapis coverts, turquoise secondaries, long gold primaries)
  const wings = [-1, 1].map(s => {
    const wg = pivot(b, s * 0.3, 0.36, 0.2);
    const arm1 = pivot(wg); box(arm1, 0.7, 0.1, 0.12, GOLD, s * 0.35, 0, 0, { ink: 0.015 });
    const arm2 = pivot(arm1, s * 0.7, 0, 0); box(arm2, 0.6, 0.08, 0.1, GOLD, s * 0.3, 0, 0, { ink: 0.015 });
    const row = (par, n, x0, step, len, c, z, wdt) => { for (let k = 0; k < n; k++) {
      const f = pivot(par, s * (x0 + k * step), 0, z); f.rotation.set(0, 0, 0);
      const L2 = len * (1 - k * 0.04);
      box(f, wdt, 0.035, L2, c, 0, 0, -L2 / 2, { ink: 0.01 });
      mesh(f, cone(wdt * 0.5, 0.14, 4), c, 0, 0, -L2 - 0.05, { rx: -PI / 2, ry: PI / 4, ink: false });
    } };
    row(arm1, 5, 0.12, 0.13, 0.32, LAPIS, -0.04, 0.12);
    row(arm1, 5, 0.12, 0.13, 0.58, TURQ, -0.08, 0.12);
    row(arm2, 5, 0.05, 0.12, 0.42, LAPIS, -0.04, 0.11);
    row(arm2, 6, 0.0, 0.11, 0.95, GOLD, -0.09, 0.12);
    for (let k = 0; k < 3; k++) box(arm2, 0.11, 0.036, 0.8, 0xffffff, s * (0.06 + k * 0.22), -0.008, -0.5, { ink: false });
    return { wg, arm1, arm2, s };
  });
  // the tail, swinging, a lapis tuft at its end
  const tail = [];
  let tp = pivot(b, 0, 0.3, -0.92);
  for (let k = 0; k < 5; k++) {
    const q = pivot(tp, 0, 0, k ? -0.2 : 0); box(q, 0.08, 0.08, 0.22, SAND, 0, 0, -0.1, { ink: 0.012 }); tail.push(q); tp = q;
  }
  for (let k = 0; k < 4; k++) mesh(tp, cone(0.06, 0.2, 4), k % 2 ? LAPIS : GOLD, (k % 2 - 0.5) * 0.06, 0, -0.26 - (k >> 1) * 0.04, { rx: -PI / 2 - (k - 1.5) * 0.25, inkScale: 1.15 });
  // her riddles: cartouches of light turning slowly round her
  const ring = pivot(g, 0, 2.15, -0.1);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU, c = pivot(ring, cos(a) * 1.25, 0, sin(a) * 1.25); c.rotation.y = -a + PI / 2;
    hot(c, new T.BoxGeometry(0.14, 0.32, 0.02), GLOW, 1, 0, 0, 0, { a: 0.28, add: true });
    for (let j = 0; j < 3; j++) hbox(c, j % 2 ? 0.07 : 0.05, 0.04, 0.02, GLOW, 2.2, 0, 0.09 - j * 0.09, 0.01);
  }
  g.userData.anim = w => {
    // knees fold as each leg comes forward
    legs.forEach((lg, i) => { const ph = sin(w * 2 + i * PI); lg.lo.rotation.x = max(0, ph) * (i > 1 ? -0.7 : 0.7); lg.paw.rotation.x = -lg.lo.rotation.x * 0.6; });
    b.position.y = 0.92 + abs(sin(w * 2)) * 0.035;
    n.rotation.x = sin(w * 2) * 0.03; h.rotation.y = sin(w * 0.4) * 0.18;
    // wings breathe half-open, and every few strides beat once
    const beat = max(0, sin(w * 0.45)) ** 6;
    wings.forEach(({ wg, arm1, arm2, s }) => {
      wg.rotation.set(-0.25 - beat * 0.25, s * (0.7 - beat * 0.4), s * (0.95 + sin(w * 0.9) * 0.05 - beat * 0.7));
      arm2.rotation.z = s * (0.1 + beat * 0.35); arm2.rotation.y = s * (-0.65 + beat * 0.4);
    });
    tail.forEach((q, k) => { q.rotation.x = k ? 0.32 : -0.75; q.rotation.y = sin(w * 1.1 - k * 0.6) * 0.32; });
    ring.rotation.y = w * 0.15;
  };
};

Object.assign(Wd.SHELL, { lich: 1.25, giant: 1.45, sphinx: 1.3 });
Object.assign(Wd.DEATH, { lich: ["#2a1238", "#e8e0cc", "#b85aff"], giant: ["#6c8cbc", "#bfe8ff", "#9fe8ff"], sphinx: ["#d9a85e", "#e8c050", "#2a4a9a"] });
})();
