/* Aura Farm: the fifteen units of the three gates past the Rift (29 Oct, the package: "3 gates, 5 exclusive units each";
   Chris picked Aurora, Chrono and Origin, Divine to Absolute in each gate, Absolute as "Inverted prismatic", and
   "You design, I review").
   (30 Oct, Chris of the first fifteen: "theyre too similar, looks like the other 100 units, please genuinely think
   through something, take note from bleach and animes like that, like an aizen style unit"): the first fifteen were
   floating robes, wings, halos and light pillars like every top unit in units.js. These are characters instead. Each
   gate is a faction with its own look (the Order: white uniforms and weapons of solid light; the Unwound: masks of
   broken clock faces and a hole where the tick was; the Court: black robes, white captain's coats, named swords), each
   unit is an anime archetype made into an original character, and each has a RELEASE: a second form (AF.REL,
   built as "<key>@rel") with its own command, for the summon reveal and a Defense ability.
   (30 Oct, Chris: "yea looks good then"): in the game. Each lives only behind its own gate (data.js, opened by a
   Rebirth); tools/roster_next.html is still the page that shows every sealed and released form side by side. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, A = K.acc, FX = K.FX, POSES = K.POSES;
const { box, mesh, pivot, marker, ball, ring, cyl, cone, chain } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const rnd = (a, b) => a + Math.random() * (b - a);
const col = (c, a) => { const k = new T.Color(c); return `rgba(${k.r * 255 | 0},${k.g * 255 | 0},${k.b * 255 | 0},${a})`; };
const U = (key, name, rarity, base, d) => AF.UNITS.push(Object.assign({ key, name, rarity, base }, d));
// things turning round him (as units.js's own orbit): n items at radius r, height y
function orbit(R, n, r, y, make, sp, tilt, parent) {
  const g = pivot(parent || R.root, 0, y, 0);
  if (tilt) { g.rotation.x = tilt[0]; g.rotation.z = tilt[1]; }
  const items = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2, p = pivot(g, cos(a) * r, 0, sin(a) * r); make(p, i, a); items.push(p); }
  R.anim.push(t => { g.rotation.y = t * sp; items.forEach((p, i) => { p.position.y = sin(t * 2 + i * 2.1) * 0.08; }); });
  return { g, items };
}
// a hand item kept at a fixed angle to the body whatever the arm does (tilt [PI,0,0] = pointing straight down)
function held(R, o, tilt) {
  const h = pivot(o.hand === "L" ? R.handL : R.handR, 0, 0, o.fwd || 0);
  const s = pivot(h); K.upright(R, s, o.hand === "L" ? R.armL : R.armR, tilt);
  return s;
}

const BLACK = 0x16161c, WHITE = 0xf4f4f0, BONE = 0xece6d6, GOLD = 0xd8a84a;
const UNI = 0xf2f6fa, NAVY = 0x1a2440, G = 0x3dffa0, CY = 0x2ee6ff, VI = 0xa07bff, PK = 0xff7ad9;

// ======================= parts: the Court (Origin) =======================
// the white under-collar crossing in a V, and the sash
A.kimono = (R, L, o) => {
  for (const s of [-1, 1]) box(R.torso, 0.13, 0.66, 0.03, o.c || 0xf2f2ee, s * 0.15, 0.72, 0.295, { rz: -s * 0.48, ink: false });
  if (o.sash) box(R.torso, 1.05, 0.15, 0.6, o.sash, 0, 0.1, 0, { ink: 0.02 });
};
// wide hanging sleeves over the arms, the lining showing at the cuff
A.sleeves = (R, L, o) => {
  for (const arm of [R.armL, R.armR]) {
    box(arm, 0.6, 0.7, 0.62, o.c, 0, -0.36, 0);
    box(arm, 0.5, 0.05, 0.52, o.lining || 0x08080a, 0, -0.72, 0, { ink: false });
  }
};
// the captain's coat: open down the front, wide sleeves, to the knee (legs) or the ankle (hakama)
A.haori = (R, L, o) => {
  const c = o.c || WHITE, lin = o.lining || c, robe = !!L.robe;
  box(R.torso, 1.14, 1.06, 0.07, c, 0, 0.5, -0.32);
  for (const s of [-1, 1]) {
    box(R.torso, 0.08, 1.06, 0.7, c, s * 0.56, 0.5, 0);
    box(R.torso, 0.26, 1.06, 0.07, c, s * 0.44, 0.5, 0.32);
    box(R.torso, 0.05, 1.04, 0.05, lin, s * 0.3, 0.5, 0.345, { ink: false });
  }
  if (o.sleeveless) for (const arm of [R.armL, R.armR]) box(arm, 0.5, 0.18, 0.52, c, 0, -0.05, 0);
  else A.sleeves(R, L, { c, lining: lin });
  const n = o.n == null ? (robe ? 3 : 2) : o.n;
  if (n) chain(R, R.hips, 0, 0.04, 0, n, 0.36, (sg, i) => {
    const w = (robe ? 1.26 : 1.16) + i * 0.16, d = (robe ? 0.8 : 0.72) + i * 0.1;
    box(sg, w, 0.38, 0.06, c, 0, -0.18, -d / 2);
    for (const s of [-1, 1]) {
      box(sg, 0.06, 0.38, d, c, s * w / 2, -0.18, 0);
      box(sg, 0.26, 0.38, 0.06, c, s * (w / 2 - 0.13), -0.18, d / 2);
      box(sg, 0.05, 0.38, 0.04, lin, s * (w / 2 - 0.27), -0.18, d / 2 + 0.02, { ink: false });
    }
    // a torn hem: tatters of uneven length along the back and sides
    if (o.ragged && i === n - 1) for (let k = 0; k < 6; k++) {
      const x = -w / 2 + 0.12 + k * (w - 0.24) / 5;
      box(sg, 0.2, 0.14 + (k % 3) * 0.1, 0.06, c, x, -0.42 - (k % 3) * 0.05, -d / 2, { rz: k % 2 ? 0.22 : -0.18 });
    }
  }, { b0: 0.05, b: 0.04, amp: 0.04, sp: 1.6, zamp: 0.03 });
};
// a lieutenant's badge tied round the upper arm
A.armband = (R, L, o) => {
  box(R.armL, 0.66, 0.2, 0.68, o.c || WHITE, 0, -0.16, 0, { ink: 0.02 });
  box(R.armL, 0.16, 0.12, 0.03, o.mark || 0x7a6ac8, -0.02, -0.16, 0.35, { rz: 0.785, ink: false });
};
// a patch over one eye, its band round the head
A.eyepatch = (R, L, o) => {
  const H = R.head, s = o.side || -1, c = o.c || 0x101014;
  box(H, 0.38, 0.36, 0.05, c, s * 0.25, 0.53, 0.56, { ink: 0.015 });
  box(H, 1.21, 0.06, 1.13, c, 0, 0.72, 0, { rz: s * 0.16, ink: false });
  if (o.seal) for (const r of [0, 0.785]) box(H, 0.14, 0.14, 0.02, o.seal, s * 0.25, 0.53, 0.59, { rz: r, glow: 1, ink: false });
};
// chain wound round the forearm
A.chainWrap = (R, L, o) => {
  const a = o.hand === "L" ? R.armL : R.armR;
  for (let i = 0; i < 4; i++) mesh(a, ring(0.31, 0.045, 5, 14), o.c || 0x8a8f99, 0, -0.14 - i * 0.15, 0, { rx: PI / 2 + (i % 2 ? 0.25 : -0.25) });
};
// a sword chained shut in its scabbard, carried on the shoulder
A.chainedBlade = (R, L, o) => {
  const s = K.hand(R, o);
  box(s, 0.13, 0.6, 0.13, o.grip || 0x3a1010, 0, 0.05, 0);
  box(s, 0.36, 0.07, 0.36, o.trim || 0x6a6a72, 0, 0.36, 0);
  box(s, 0.22, 2.1, 0.14, o.c || 0x101014, 0, 1.45, 0);
  for (let i = 0; i < 6; i++) mesh(s, ring(0.18, 0.035, 5, 12), o.chain || 0x9aa0aa, 0, 0.62 + i * 0.32, 0, { rx: PI / 2, ry: i % 2 ? 0.5 : -0.5 });
};
// released: a blade chipped so many times it's a saw, edge glowing
A.sawCleaver = (R, L, o) => {
  const s = K.hand(R, o), c = o.c || 0x26262c;
  box(s, 0.13, 0.6, 0.13, o.grip || 0x3a1010, 0, 0.05, 0);
  box(s, 0.42, 0.08, 0.32, 0x6a6a72, 0, 0.36, 0);
  const b = pivot(s, 0, 0.4, 0);
  box(b, 0.62, 2.5, 0.08, c, 0.08, 1.25, 0);
  for (let i = 0; i < 9; i++) box(b, 0.2, 0.18, 0.07, c, 0.42, 0.2 + i * 0.27, 0, { rz: 0.785 });
  box(b, 0.06, 2.4, 0.1, o.edge || 0xffd23a, -0.22, 1.22, 0, { glow: 1, ink: false });
  marker(R, "tip", b, 0, 2.5, 0); marker(R, "base", b, 0, 0, 0);
};
// what's left of the chains, drifting round him
A.brokenChains = (R, L, o) => orbit(R, o.n || 7, 1.45, 1.4, (p, i) => {
  for (let k = 0; k < 2 + (i % 2); k++) mesh(p, ring(0.13, 0.035, 5, 12), o.c || 0x9aa0aa, k * 0.18, 0, 0, { ry: k % 2 ? PI / 2 : 0 });
  R.anim.push(t => { p.rotation.set(t * (0.5 + i * 0.1), t * 0.7, 0); });
}, 0.35, [0.18, -0.1]);
// hair combs of a noble house: three white rods and a gold pin on one side of the head
A.hairCombs = (R, L, o) => {
  const H = R.head, s = o.side || -1;
  for (let k = 0; k < 3; k++) box(H, 0.09, 0.44, 0.09, o.c || 0xf6f6f2, s * (0.24 + k * 0.12), 1.36, 0.16 - k * 0.14, { rz: s * -0.3, ink: 0.015 });
  box(H, 0.46, 0.08, 0.1, o.pin || GOLD, s * 0.36, 1.2, 0.02, { rz: s * -0.3, ink: 0.015 });
};
// a long silk stole round the shoulders, its ends down the front, veined with gold
A.stole = (R, L, o) => {
  const c = o.c || 0xf2f0ea;
  box(R.torso, 1.12, 0.24, 0.68, c, 0, 0.95, 0, { ink: 0.02 });
  for (const s of [-1, 1]) chain(R, R.torso, s * 0.3, 0.9, 0.36, 3, 0.36, (sg, i) => {
    box(sg, 0.26, 0.38, 0.05, c, 0, -0.18, 0);
    if (o.vein) box(sg, 0.03, 0.3, 0.02, o.vein, i % 2 ? 0.05 : -0.04, -0.18, 0.03, { rz: i % 2 ? 0.5 : -0.4, glow: 1, ink: false });
  }, { b0: -0.04, b: 0.02, amp: 0.03, sp: 1.4, zamp: 0.03 });
};
// a katana held point-down in front of him (o.hilt: only the grip, the blade gone)
A.downBlade = (R, L, o) => {
  const s = held(R, o, [PI, 0, 0]);
  box(s, 0.12, 0.55, 0.12, o.grip || 0x101014, 0, 0.05, 0);
  box(s, 0.34, 0.06, 0.34, o.trim || GOLD, 0, 0.34, 0);
  const len = o.len || 1.9;
  if (!o.hilt) { const b = box(s, 0.1, len, 0.04, o.c || 0xe6ecf2, 0, 0.38 + len / 2, 0); marker(R, "tip", b, 0, len / 2, 0); }
  marker(R, "hilt", s, 0, 0.36, 0);
};
// gold mended into cracks across the face
A.kintsugi = (R, L, o) => {
  const H = R.head, g = o.c || 0xffd76a;
  [[0.36, 0.36, 0.34, 0.45], [0.24, 0.2, 0.18, -0.7], [-0.38, 0.78, 0.26, 0.85], [-0.3, 0.92, 0.14, -0.4]]
    .forEach(([x, y, l, r]) => box(H, 0.035, l, 0.02, g, x, y, 0.56, { rz: r, glow: 1, ink: false }));
};
// the blade in a thousand pieces: porcelain shards edged in gold, turning round him in two rings
A.porcelain = (R, L, o) => {
  for (const [n, r, y, sp, tilt] of [[14, 1.55, 1.2, 0.7, [0.25, -0.1]], [10, 1.9, 2.3, -0.5, [-0.2, 0.15]]]) orbit(R, n, r, y, (p, i) => {
    const sh = pivot(p); sh.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    box(sh, 0.3, 0.05, 0.18, 0xf8f6f0, 0, 0, 0, { ink: 0.015 });
    box(sh, 0.32, 0.02, 0.03, o.c || 0xffd76a, 0, 0.03, 0.09, { glow: 1, ink: false });
    R.anim.push(t => { sh.rotation.x += 0.02; sh.rotation.z += 0.013; });
  }, sp, tilt);
};
// one long braid over the shoulder and down the front, tied with a cord
A.braid = (R, L, o) => {
  const s = o.side || 1, c = L.hairC, c2 = L.hairC2 || c;
  chain(R, R.head, s * 0.46, 0.4, 0.42, 6, 0.2, (sg, i) => {
    box(sg, 0.26 - i * 0.015, 0.24, 0.24 - i * 0.015, i % 2 ? c2 : c, i % 2 ? 0.03 : -0.03, -0.1, 0);
    if (i === 5) { box(sg, 0.2, 0.08, 0.2, o.tie || 0xc0182a, 0, -0.22, 0, { ink: 0.015 }); box(sg, 0.16, 0.22, 0.16, c, 0, -0.36, 0); }
  }, { b0: -0.08, b: 0.02, amp: 0.03, sp: 1.3, zamp: 0.03, rz0: s * 0.12 });
};
// her blade: a long silver needle, red thread running from its eye
A.needle = (R, L, o) => {
  const s = o.held ? held(R, o, o.tilt || [0, 0, 0]) : K.hand(R, o), len = o.len || 2.6;
  box(s, 0.1, 0.5, 0.1, o.grip || 0xe8e8ec, 0, 0.05, 0);
  mesh(s, ring(0.1, 0.03, 6, 16), o.c || 0xdfe6ee, 0, -0.32, 0, { ink: false });
  const b = mesh(s, cone(0.07, len, 6), o.c || 0xdfe6ee, 0, 0.3 + len / 2, 0, { inkScale: 1.3 });
  marker(R, "tip", b, 0, len / 2, 0); marker(R, "eye", s, 0, -0.32, 0);
};
// a spool of red thread at the hip
A.spool = (R, L, o) => {
  const s = pivot(R.hips, 0.56, 0.0, 0.18); s.rotation.z = PI / 2;
  mesh(s, cyl(0.16, 0.16, 0.34, 12), o.c || 0xc0182a, 0, 0, 0, { inkScale: 1.12 });
  for (const d of [-1, 1]) mesh(s, cyl(0.22, 0.22, 0.05, 12), 0xd8c8a8, 0, d * 0.19, 0, { inkScale: 1.1 });
  marker(R, "spool", s);
};
// an open book held in the left hand, tipped up toward him
A.heldBook = (R, L, o) => {
  const s = held(R, Object.assign({ hand: "L", fwd: 0.12 }, o), [0.55, 0.15, 0]);
  box(s, 0.64, 0.06, 0.46, o.c || 0x3a2a4a, 0, 0, 0);
  for (const d of [-1, 1]) box(s, 0.29, 0.05, 0.42, 0xf2ead8, d * 0.15, 0.05, 0, { rz: d * 0.12, ink: 0.015 });
  for (const d of [-1, 1]) for (let k = 0; k < 3; k++) box(s, 0.2, 0.01, 0.02, 0x2a2a30, d * 0.15, 0.085, 0.12 - k * 0.1, { rz: d * 0.12, ink: false });
};
// the one lock that falls forward when the rest is swept back
A.strand = (R, L, o) => box(R.head, 0.08, 0.46, 0.06, L.hairC, 0.12, 0.9, 0.57, { rz: 0.32 });
// the gentle captain he pretended to be, left standing behind him empty: a pale husk split down the front
A.husk = (R, L, o) => {
  const g = pivot(R.root, o.x == null ? -1.35 : o.x, 0, o.z == null ? -0.7 : o.z);
  g.rotation.y = o.ry == null ? 0.3 : o.ry;
  const R2 = K.rig(g, o.look); R2.P = Object.assign({}, o.pose || {});
  (o.acc || []).forEach(([n, oo]) => A[n] && A[n](R2, o.look, oo || {}));
  const m = new T.MeshBasicMaterial({ color: 0xf6f4fa, transparent: true, opacity: 0.62, depthWrite: false });
  const ink = new T.MeshBasicMaterial({ color: 0xb49aff, side: T.BackSide, transparent: true, opacity: 0.7, depthWrite: false });
  R2.root.traverse(ob => { if (ob.isMesh) ob.material = ob.material.side === T.BackSide ? ink : m; });
  for (const [par, x, y, z, h, rz] of [[R2.torso, 0, 0.5, 0.31, 1.0, 0.05], [R2.head, 0.04, 0.6, 0.56, 1.0, 0.12]])
    box(par, 0.07, h, 0.05, o.split || 0x9a6aff, x, y, z, { glow: 1, ink: false, rz });
  R.anim.push(t => K.animate(R2, t * 0.6 + 2, R2.P));
};

// ======================= parts: the Unwound (Chrono) =======================
// the hole where the tick was: a dark well with a bone rim (o.gear: a gear still turning in it)
A.hole = (R, L, o) => {
  const y = o.y == null ? 0.55 : o.y, r = o.r || 0.2;
  mesh(R.torso, cyl(r, r, 0.04, 20), 0x020203, 0, y, 0.285, { rx: PI / 2, glow: 1 });
  mesh(R.torso, ring(r + 0.02, 0.035, 6, 24), o.c || BONE, 0, y, 0.3, { ink: false });
  if (o.gear) {
    const g = pivot(R.torso, 0, y, 0.305);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; box(g, 0.05, 0.09, 0.02, o.gear, cos(a) * r * 0.62, sin(a) * r * 0.62, 0, { rz: a - PI / 2, glow: 1, ink: false }); }
    mesh(g, ring(r * 0.45, 0.025, 5, 16), o.gear, 0, 0, 0, { glow: 1 });
    R.anim.push(t => { g.rotation.z = -t * 0.8; });
  }
};
// a cracked watch glass over one eye, set in a shard of bone at the temple
A.watchGlass = (R, L, o) => {
  const H = R.head, s = o.side || 1, x = s * 0.25;
  box(H, 0.24, 0.54, 0.1, o.bone || BONE, s * 0.48, 0.58, 0.44, { rz: s * 0.08 });
  mesh(H, ring(0.2, 0.045, 6, 24), o.c || GOLD, x, 0.52, 0.585, { ink: false });
  mesh(H, cyl(0.19, 0.19, 0.02, 20), 0xbff2ff, x, 0.52, 0.575, { rx: PI / 2, glow: 2 });
  box(H, 0.03, 0.3, 0.02, 0x2a2a30, x + 0.02, 0.52, 0.6, { rz: 0.6, ink: false });
};
// the lower jaw of a wolf's skull over his mouth, numerals cut in the teeth
A.wolfJaw = (R, L, o) => {
  const H = R.head, b = o.c || BONE;
  box(H, 1.22, 0.38, 0.14, b, 0, 0.19, 0.55);
  for (const s of [-1, 1]) box(H, 0.14, 0.42, 0.56, b, s * 0.6, 0.22, 0.3);
  for (let i = 0; i < 7; i++) mesh(H, cone(0.06, 0.18, 4), b, -0.42 + i * 0.14, 0.42, 0.59, { inkScale: 1.25 });
  for (let i = 0; i < 3; i++) box(H, 0.03, 0.12, 0.02, 0x2a2a30, -0.12 + i * 0.12, 0.16, 0.63, { ink: false });
};
// released: the whole skull, snout, ears and burning sockets
A.wolfSkull = (R, L, o) => {
  const H = R.head, b = o.c || BONE;
  box(H, 1.32, 0.56, 1.24, b, 0, 1.06, 0.02);
  box(H, 0.72, 0.4, 0.58, b, 0, 0.66, 0.8);
  box(H, 0.66, 0.14, 0.5, b, 0, 0.4, 0.78);
  for (const s of [-1, 1]) {
    mesh(H, cone(0.22, 0.56, 4), b, s * 0.42, 1.52, -0.08, { rz: s * -0.2, ry: PI / 4 });
    box(H, 0.2, 0.09, 0.04, o.glow || 0x6ab8ff, s * 0.28, 0.94, 0.65, { glow: 1, ink: false, rz: s * -0.2 });
    for (let i = 0; i < 3; i++) mesh(H, cone(0.05, 0.16, 4), b, s * (0.12 + i * 0.1), 0.5, 1.06, { rx: PI, inkScale: 1.25 });
  }
};
A.claws = (R, L, o) => { for (const h of [R.handL, R.handR]) for (let k = -1; k <= 1; k++) mesh(h, cone(0.06, 0.46, 4), o.c || BONE, k * 0.13, -0.3, 0.12, { rx: PI - 0.5, inkScale: 1.2 }); };
A.tail = (R, L, o) => chain(R, R.hips, 0, 0.1, -0.3, o.n || 5, 0.28, (sg, i) => box(sg, 0.28 - i * 0.03, 0.3, 0.28 - i * 0.03, i % 2 ? (o.c2 || o.c) : o.c, 0, -0.14, 0),
  { b0: 1.7, b: 0.18, amp: 0.16, sp: 2.4, zamp: 0.22 });
// an open jacket over a bare chest
A.openJacket = (R, L, o) => {
  const c = o.c || 0xf2efe6;
  box(R.torso, 1.06, 1.04, 0.07, c, 0, 0.5, -0.31);
  for (const s of [-1, 1]) { box(R.torso, 0.07, 1.04, 0.66, c, s * 0.53, 0.5, 0); box(R.torso, 0.2, 1.04, 0.07, c, s * 0.44, 0.5, 0.31); box(R.torso, 0.04, 1.0, 0.04, o.trim || BLACK, s * 0.33, 0.5, 0.34, { ink: false }); }
  box(R.torso, 1.08, 0.16, 0.66, o.sash || BLACK, 0, 0.06, 0, { ink: 0.02 });
};
// half the face painted black and half white, split down the middle
A.facePaint = (R, L, o) => {
  box(R.head, 0.56, 1.0, 0.02, o.a || 0x0a0a0c, -0.29, 0.56, 0.542, { ink: false });
  box(R.head, 0.56, 1.0, 0.02, o.b || 0xf6f6f2, 0.29, 0.56, 0.542, { ink: false });
};
// a watchmaker's loupe screwed into one eye
A.loupe = (R, L, o) => {
  const H = R.head, x = (o.side || -1) * 0.25;
  mesh(H, cyl(0.17, 0.2, 0.34, 14), o.c || 0x3a3a40, x, 0.52, 0.72, { rx: PI / 2 });
  mesh(H, cyl(0.14, 0.14, 0.02, 14), o.lens || 0x9aff4a, x, 0.52, 0.9, { rx: PI / 2, glow: 1 });
  mesh(H, ring(0.19, 0.03, 5, 16), GOLD, x, 0.52, 0.88, { ink: false });
};
// a crown of gear teeth, turning
A.gearCrown = (R, L, o) => {
  const g = pivot(R.head, 0, 1.3, 0), c = o.c || GOLD;
  mesh(g, ring(0.6, 0.07, 6, 32), c, 0, 0, 0, { rx: PI / 2 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; box(g, 0.14, 0.24, 0.1, c, cos(a) * 0.66, 0.08, sin(a) * 0.66, { ry: -a }); }
  R.anim.push(t => { g.rotation.y = t * 0.4; });
};
// the key in his back, turning (o.sp: how fast)
A.windKey = (R, L, o) => {
  const k = pivot(R.torso, 0, 0.55, -0.32), c = o.c || GOLD;
  box(k, 0.12, 0.12, 0.5, c, 0, 0, -0.25);
  const h = pivot(k, 0, 0, -0.52);
  for (const s of [-1, 1]) mesh(h, ring(0.22, 0.06, 6, 16), c, s * 0.24, 0, 0, { rx: PI / 2 });
  marker(R, "key", h);
  R.anim.push(t => { h.rotation.z = t * (o.sp || 1.2); });
};
// jointed arms out of his back, each with a tool (o.n: how many)
A.backArms = (R, L, o) => {
  const n = o.n || 2, c = o.c || 0x6a6f78, j = o.joint || GOLD, tools = [0x9aff4a, 0xffd23a, 0x4fe6ff];
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1, tier = (i / 2) | 0;
    const a = pivot(R.torso, s * 0.28, 0.85 - tier * 0.22, -0.3);
    box(a, 0.13, 0.8, 0.13, c, 0, 0.4, 0);
    mesh(a, ball(0.12, 1), j, 0, 0.82, 0, { inkScale: 1.2 });
    const b = pivot(a, 0, 0.82, 0);
    box(b, 0.11, 0.7, 0.11, c, 0, 0.35, 0);
    mesh(b, cone(0.07, 0.3, 4), tools[i % 3], 0, 0.82, 0, { glow: 1 });
    marker(R, "tool" + i, b, 0, 0.9, 0);
    R.anim.push(t => {
      a.rotation.set(-0.35 - tier * 0.3, 0, s * (1.15 + tier * 0.4) + sin(t * 1.6 + i) * 0.08);
      b.rotation.z = -s * (1.5 + sin(t * 2.2 + i * 1.3) * 0.3);
    });
  }
};
// gears thrown out round him
A.gears = (R, L, o) => orbit(R, o.n || 6, 1.6, 1.8, (p, i) => {
  const g = pivot(p), r = 0.16 + (i % 3) * 0.06;
  mesh(g, ring(r, 0.04, 5, 16), o.c || GOLD, 0, 0, 0, {});
  for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2; box(g, 0.06, 0.08, 0.05, o.c || GOLD, cos(a) * (r + 0.05), sin(a) * (r + 0.05), 0, { rz: a - PI / 2, ink: false }); }
  R.anim.push(t => { g.rotation.z = t * (i % 2 ? 2 : -2); });
}, 0.3, [0.2, 0.1]);
// tear marks down the cheeks: a long hand and a short one, like a clock's
A.tearMarks = (R, L, o) => {
  const H = R.head, c = o.c || 0x1a8a7a, g = o.glow ? 1 : 0;
  for (const s of [-1, 1]) {
    box(H, 0.04, 0.34, 0.02, c, s * 0.25, 0.21, 0.555, { ink: false, glow: g });
    box(H, 0.04, 0.17, 0.02, c, s * 0.25 + s * 0.06, 0.3, 0.555, { ink: false, rz: s * 0.6, glow: g });
  }
};
// half a broken clock face over one side of the head, the hour hand standing up off it as a horn
A.hornMask = (R, L, o) => {
  const H = R.head, b = o.c || BONE, s = o.side || -1;
  box(H, 0.64, 0.42, 1.22, b, s * 0.36, 1.24, 0);
  box(H, 0.14, 0.72, 1.0, b, s * 0.66, 0.84, 0);
  for (let i = 0; i < 4; i++) box(H, 0.03, 0.1, 0.02, 0x2a2a30, s * (0.16 + i * 0.13), 1.24, 0.62, { ink: false });
  const h = pivot(H, s * 0.52, 1.42, 0.1); h.rotation.z = s * 0.55 * (o.long ? 0.8 : 1);
  const L2 = o.long ? 1.1 : 0.64;
  box(h, 0.12, L2, 0.1, b, 0, L2 / 2, 0);
  mesh(h, cone(0.16, 0.32, 4), b, 0, L2 + 0.14, 0, { ry: PI / 4 });
};
// released: wings of long black clock hands, edged in light
A.handWings = (R, L, o) => {
  for (const s of [-1, 1]) {
    const w = pivot(R.torso, s * 0.25, 0.85, -0.36);
    for (let i = 0; i < (o.n || 5); i++) {
      const f = pivot(w); f.rotation.z = -s * (0.32 + i * 0.3);
      const len = (o.len || 2.0) - i * 0.2;
      box(f, 0.1, len, 0.06, o.c || 0x0a0a0e, 0, len / 2 + 0.1, -0.04 * i);
      mesh(f, cone(0.15, 0.36, 4), o.c || 0x0a0a0e, 0, len + 0.27, -0.04 * i, { ry: PI / 4 });
      if (o.edge) box(f, 0.03, len * 0.9, 0.07, o.edge, 0, len / 2 + 0.1, -0.04 * i + 0.01, { glow: 1, ink: false });
    }
    R.anim.push(t => { w.rotation.y = s * (0.5 + sin(t * 1.2) * 0.07); w.rotation.x = 0.2; });
  }
};
// a pendulum for a tail
A.pendulum = (R, L, o) => {
  const segs = chain(R, R.hips, 0, 0.05, -0.32, 4, 0.3, (sg, i) => box(sg, 0.08, 0.32, 0.08, o.c || 0x0a0a0e, 0, -0.15, 0), { b0: 0.35, b: 0.06, amp: 0.3, sp: 1.6, zamp: 0.05 });
  const d = pivot(segs[3], 0, -0.36, 0);
  mesh(d, cyl(0.26, 0.26, 0.06, 20), o.c || 0x0a0a0e, 0, 0, 0, { rx: PI / 2 });
  mesh(d, ring(0.27, 0.03, 5, 20), o.edge || 0x2ee6b0, 0, 0, 0, { glow: 1 });
};
// a crown that is what's left of a clock's bezel, the twelve numerals turning above it
A.bezelCrown = (R, L, o) => {
  const H = R.head, c = o.c || BONE, n = o.n || 12;
  box(H, 1.26, 0.16, 1.18, c, 0, 1.12, 0, { ink: 0.02 });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * PI * 2 + PI / 2; box(H, 0.16, 0.3 + (i % 2) * 0.16, 0.08, c, cos(a) * 0.6, 1.32 + (i % 2) * 0.08, sin(a) * 0.58, { ry: -a + PI / 2 }); }
  const g = pivot(H, 0, 1.95, 0); g.rotation.x = 0.25;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2, p = pivot(g, cos(a) * 0.95, 0, sin(a) * 0.95); p.rotation.y = -a + PI / 2;
    const w = i % 3 ? 0.06 : 0.1;
    box(p, w, 0.26, 0.04, o.glow || 0xffffff, -0.04, 0, 0, { glow: 1, ink: false });
    if (!(i % 3)) box(p, w, 0.26, 0.04, o.glow || 0xffffff, 0.08, 0, 0, { glow: 1, ink: false });
  }
  R.anim.push(t => { g.rotation.y = -t * 0.25; });
};
// a pocket watch on its chain, held up in the left hand
A.pocketWatch = (R, L, o) => {
  const s = held(R, { hand: "L", fwd: 0.05 }, [0, 0, 0]);
  const segs = chain(R, s, 0, -0.1, 0, 3, 0.16, sg => box(sg, 0.03, 0.17, 0.03, o.c || 0xd8dce4, 0, -0.08, 0, { ink: false }), { b0: 0, b: 0, amp: 0.12, sp: 1.8, zamp: 0.1 });
  const w = pivot(segs[2], 0, -0.36, 0);
  mesh(w, cyl(0.24, 0.24, 0.09, 20), o.c || 0xd8dce4, 0, 0, 0, { rx: PI / 2 });
  mesh(w, cyl(0.2, 0.2, 0.1, 20), 0xfaf8f2, 0, 0, 0, { rx: PI / 2, glow: 1, ink: false });
  box(w, 0.03, 0.15, 0.03, 0x14141a, 0, 0.07, 0.06, { ink: false });
  const sec = pivot(w, 0, 0, 0.065); box(sec, 0.015, 0.17, 0.015, o.hand || 0xff3b4e, 0, 0.08, 0, { glow: 1, ink: false });
  R.anim.push(t => { sec.rotation.z = -Math.floor(t) * (PI / 30); });
  marker(R, "watch", w);
};
// released: a huge clock stopped at midnight behind him, a crack across its face
A.clockDial = (R, L, o) => {
  const g = pivot(R.root, 0, o.y || 2.4, -1.2), r = o.r || 2.1, c = o.c || 0xffffff;
  mesh(g, cyl(r, r, 0.04, 48), o.face || 0x050507, 0, 0, -0.05, { rx: PI / 2, glow: 1 });
  mesh(g, ring(r, 0.1, 8, 64), c, 0, 0, 0, { glow: 1 });
  mesh(g, ring(r * 0.84, 0.025, 6, 64), c, 0, 0, 0, { glow: 1 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; box(g, i % 3 ? 0.07 : 0.12, i % 3 ? 0.2 : 0.4, 0.04, c, sin(a) * r * 0.92, cos(a) * r * 0.92, 0, { rz: -a, glow: 1, ink: false }); }
  box(g, 0.14, r * 0.78, 0.05, c, 0, r * 0.39, 0.04, { glow: 1, ink: false });
  box(g, 0.09, r * 0.58, 0.05, c, 0.01, r * 0.29, 0.07, { rz: -0.03, glow: 1, ink: false });
  [[-0.9, 0.5, 1.1, 0.7], [-0.2, 0.1, 0.8, -0.4], [0.5, -0.4, 0.9, 0.9]].forEach(([x, y, l, rz]) => box(g, 0.035, l, 0.05, o.crack || 0xff3b4e, x, y, 0.06, { rz, glow: 1, ink: false }));
};
// released: clock-hand knives hanging still in the air round him, all pointing in, trembling
A.frozenKnives = (R, L, o) => {
  const g = pivot(R.root, 0, 1.5, 0), n = o.n || 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2, p = pivot(g, cos(a) * 1.9, (i % 3 - 1) * 0.45, sin(a) * 1.9);
    p.rotation.set(0, -a + PI / 2, PI / 2);
    box(p, 0.06, 0.8, 0.04, o.c || 0xf6f6f8, 0, 0.1, 0, { glow: 1, ink: 0.015 });
    mesh(p, cone(0.12, 0.28, 4), o.c || 0xf6f6f8, 0, 0.62, 0, { glow: 1 });
    R.anim.push(t => { p.position.y = (i % 3 - 1) * 0.45 + sin(t * 40 + i) * 0.006; });
  }
};
// a clock-hand dagger: thin, arrow-tipped, a ring at the hilt (o.rot as any hand item)
A.handDagger = (R, L, o) => {
  const s = K.hand(R, o), c = o.c || GOLD;
  mesh(s, ring(0.12, 0.035, 5, 14), c, 0, -0.04, 0, { ink: false, ry: PI / 2 });
  box(s, 0.1, 1.25, 0.05, c, 0, 0.72, 0, { ink: 0.015 });
  mesh(s, cone(0.17, 0.34, 4), c, 0, 1.5, 0, { inkScale: 1.2 });
};
// released: twelve clock-hand blades wheeling round him
A.handRing = (R, L, o) => orbit(R, o.n || 12, 1.65, 1.25, (p, i, a) => {
  const b = pivot(p); b.rotation.set(0, -a, PI / 2);
  box(b, 0.06, 0.8, 0.04, o.c || GOLD, 0, 0, 0, { glow: 1, ink: false });
  mesh(b, cone(0.1, 0.22, 4), o.c || GOLD, 0, 0.5, 0, { glow: 1 });
}, -1.6, [0.15, 0]);

// ======================= parts: the Order (Aurora) =======================
A.peakedCap = (R, L, o) => {
  const H = R.head, c = o.c || UNI;
  box(H, 1.3, 0.3, 1.24, c, 0, 1.2, -0.02);
  box(H, 1.46, 0.14, 1.38, c, 0, 1.38, -0.1, { rx: -0.1 });
  box(H, 1.25, 0.11, 1.17, o.band || NAVY, 0, 1.08, 0, { ink: 0.02 });
  box(H, 1.02, 0.06, 0.42, o.peak || 0x14141a, 0, 1.03, 0.74, { rx: 0.18 });
  if (o.badge) for (const r of [0, 0.785]) box(H, 0.2, 0.2, 0.05, o.badge, 0, 1.24, 0.65, { rz: r, glow: 1, ink: 0.015 });
};
// the Order's eight-point star at the throat
A.northStar = (R, L, o) => { for (const r of [0, 0.785]) box(R.torso, 0.22, 0.22, 0.04, o.c || G, 0, 0.84, 0.31, { rz: r, glow: 1, ink: 0.015 }); };
// the uniform: a placket of light down the front, buttons, epaulettes
A.uniform = (R, L, o) => {
  const t = o.trim || G;
  box(R.torso, 0.05, 0.86, 0.03, t, 0, 0.48, 0.295, { ink: false, glow: 1 });
  for (let i = 0; i < 3; i++) box(R.torso, 0.08, 0.08, 0.04, o.button || 0xd8dce4, 0.1, 0.25 + i * 0.22, 0.3, { ink: 0.01 });
  for (const s of [-1, 1]) { box(R.torso, 0.5, 0.1, 0.64, o.ep || NAVY, s * 0.62, 1.0, 0, { rz: s * -0.22, ink: 0.02 }); box(R.torso, 0.5, 0.03, 0.66, t, s * 0.62, 1.05, 0, { rz: s * -0.22, ink: false, glow: 1 }); }
};
// a short cape over one shoulder
A.shoulderCape = (R, L, o) => chain(R, R.torso, (o.side || 1) * 0.32, 1.0, -0.2, 3, 0.36, (sg, i) => {
  box(sg, 0.74 + i * 0.06, 0.38, 0.06, o.c || UNI, 0, -0.18, 0);
  box(sg, 0.7 + i * 0.06, 0.34, 0.02, o.c2 || NAVY, 0, -0.18, 0.04, { ink: false });
}, { b0: 0.2, b: 0.06, amp: 0.08, sp: 2.2, zamp: 0.06, rz0: (o.side || 1) * 0.3 });
// a bow of solid light, bigger than she is (o.size scales it)
// a bow of solid light, one smooth arc bigger than she is (o.size scales it). Built with its long side along the hand
// item's +y and the string toward +z like the kit's bow; o.tilt holds it at that fixed angle to the body instead
A.lightBow = (R, L, o) => {
  const s = o.tilt ? held(R, o, o.tilt) : K.hand(R, o), c = o.c || G, c2 = o.c2 || CY, k = o.size || 1;
  const r = 1.45 * k, a = 1.7, g = pivot(s); g.rotation.y = PI / 2;
  box(s, 0.14, 0.36, 0.16, 0xf2f6fa, 0, 0, 0);
  const arc = pivot(g, -r, 0, 0); arc.rotation.z = -a / 2;
  arc.add(new T.Mesh(new T.TorusGeometry(r, 0.07 * k, 6, 40, a), K.mat(c, 1)));
  arc.add(new T.Mesh(new T.TorusGeometry(r + 0.005, 0.03 * k, 5, 40, a), K.mat(0xffffff, 1)));
  const tipX = r * cos(a / 2) - r, tipY = r * sin(a / 2);
  for (const d of [-1, 1]) mesh(g, cone(0.11 * k, 0.4 * k, 4), c2, tipX - 0.08, d * (tipY + 0.12), 0, { rz: d > 0 ? 0.5 : PI - 0.5, glow: 1 });
  R.string = box(g, 0.02, tipY * 2, 0.02, 0xeafff6, tipX, 0, 0, { glow: 1, ink: false });
  if (!o.noArrow) {
    R.arrow = box(g, 1.5 * k, 0.05, 0.05, 0xffffff, tipX + 0.75 * k, 0, 0, { glow: 1, ink: false });
    mesh(g, cone(0.09, 0.3, 4), c, tipX + 1.55 * k, 0, 0, { rz: -PI / 2, glow: 1 });
  }
  marker(R, "bow", s, 0, 0, 0);
};
A.lightLance = (R, L, o) => {
  const s = K.hand(R, o), c = o.c || CY, k = o.size || 1;
  box(s, 0.1, 2.4 * k, 0.1, 0xf2f6fa, 0, 0.55 * k, 0);
  mesh(s, cone(0.22 * k, 1.0 * k, 4), c, 0, 2.2 * k, 0, { glow: 2, own: 1 });
  mesh(s, cone(0.08 * k, 0.9 * k, 4), 0xffffff, 0, 2.18 * k, 0, { glow: 1 });
  marker(R, "tip", s, 0, 2.7 * k, 0);
};
A.lightShield = (R, L, o) => {
  const s = K.hand(R, o), w = o.w || 1.0, h = o.h || 1.3, c = o.c || VI;
  box(s, w, h, 0.05, c, 0, 0, 0.12, { glow: 2, own: 1 });
  for (const [x, y, ww, hh] of [[0, h / 2, w + 0.08, 0.08], [0, -h / 2, w + 0.08, 0.08], [w / 2, 0, 0.08, h], [-w / 2, 0, 0.08, h]]) box(s, ww, hh, 0.08, 0xffffff, x, y, 0.12, { glow: 1, ink: false });
  for (const r of [0, 0.785]) box(s, w * 0.3, w * 0.3, 0.06, 0xffffff, 0, 0, 0.16, { rz: r, glow: 1, ink: false });
  marker(R, "shield", s, 0, 0, 0.2);
};
// a second figure beside the first (the twins), its own look, parts and pose, breathing with the first. The card
// frames the pair from a point between them (R.centre)
A.twin = (R, L, o) => {
  const g = pivot(R.root, o.x == null ? -0.66 : o.x, 0, o.z || 0);
  const R2 = K.rig(g, o.look); R2.P = Object.assign({}, o.pose || {});
  (o.acc || []).forEach(([n, oo]) => A[n] && A[n](R2, o.look, oo || {}));
  R.hips.position.x = o.self == null ? 0.66 : o.self;
  R.centre = marker(R, "pair", R.root, 0, 1.5, 0);
  R.twin = R2;
  R.anim.push(t => K.animate(R2, t + 0.9, R2.P));
};
// released: their two lights fused into one great lance over both of them
A.greatLance = (R, L, o) => {
  const g = pivot(R.root, -0.66 / 2 + 0.33, o.y || 3.3, 0.2); g.rotation.z = PI / 2 - 0.12;
  box(g, 0.14, 3.6, 0.14, 0xffffff, 0, -0.2, 0, { glow: 1, ink: false });
  mesh(g, cone(0.34, 1.3, 4), o.c || CY, 0, 2.1, 0, { glow: 2, own: 1 });
  mesh(g, cone(0.34, 1.0, 4), o.c2 || VI, 0, -2.4, 0, { rx: PI, glow: 2, own: 1 });
  marker(R, "lance", g);
  R.anim.push(t => { g.position.y = (o.y || 3.3) + sin(t * 2) * 0.08; });
};
// a whole bear: its head for a hood, paws over his shoulders, its pelt down his back
A.bearPelt = (R, L, o) => {
  const H = R.head, c = o.c || 0x5a3a22, c2 = o.c2 || 0x3a2414;
  box(H, 1.4, 0.5, 1.32, c, 0, 1.24, -0.06);
  box(H, 0.68, 0.36, 0.58, c, 0, 1.2, 0.78);
  box(H, 0.3, 0.16, 0.12, 0x1a1210, 0, 1.28, 1.08, { ink: 0.015 });
  for (const s of [-1, 1]) {
    box(H, 0.3, 0.28, 0.16, c, s * 0.52, 1.56, -0.1);
    box(H, 0.16, 0.16, 0.05, c2, s * 0.52, 1.54, -0.01, { ink: false });
    box(H, 0.1, 0.07, 0.03, 0xffd23a, s * 0.2, 1.34, 0.93, { glow: 1, ink: false });
    const paw = box(R.torso, 0.42, 0.5, 0.56, c, s * 0.58, 0.98, 0.12, { rz: s * -0.3 });
    for (let k = -1; k <= 1; k++) mesh(paw, cone(0.05, 0.18, 4), 0xe8e0d0, k * 0.11, -0.3, 0.26, { rx: PI - 0.4, inkScale: 1.2 });
  }
  chain(R, R.torso, 0, 1.0, -0.36, 3, 0.52, (sg, i) => box(sg, 1.42 + i * 0.12, 0.54, 0.1, i % 2 ? c2 : c, 0, -0.26, 0), { b0: 0.12, b: 0.06, amp: 0.05, sp: 1.6, zamp: 0.03 });
};
A.beard = (R, L, o) => {
  const H = R.head, c = o.c || L.hairC;
  box(H, 1.02, 0.42, 0.2, c, 0, 0.14, 0.52);
  box(H, 0.74, 0.34, 0.2, c, 0, -0.16, 0.5);
  box(H, 0.4, 0.24, 0.18, c, 0, -0.42, 0.46);
  for (const s of [-1, 1]) box(H, 0.16, 0.6, 0.66, c, s * 0.58, 0.3, 0.2);
  box(H, 0.56, 0.1, 0.06, c, 0, 0.33, 0.62);
};
// a black band over the eyes, its tails behind (o.emblem: the Order's star on the front)
A.blindfold = (R, L, o) => {
  const H = R.head, c = o.c || 0x0e0e12;
  box(H, 1.22, 0.32, 1.14, c, 0, 0.56, 0, { ink: 0.02 });
  for (const s of [-1, 1]) chain(R, H, s * 0.14, 0.56, -0.6, 2, 0.3, sg => box(sg, 0.12, 0.32, 0.04, c, 0, -0.15, 0), { b0: 0.5, b: 0.2, amp: 0.12, sp: 2.4, zamp: 0.12, rz0: s * 0.4 });
  if (o.emblem) for (const r of [0, 0.785]) box(H, 0.13, 0.13, 0.03, o.emblem, 0, 0.56, 0.585, { rz: r, glow: 1, ink: false });
};
// released: the blindfold pulled down round his neck
A.blindfoldDown = (R, L, o) => box(R.torso, 1.04, 0.2, 0.66, o.c || 0x0e0e12, 0, 1.02, 0, { ink: 0.02 });
// eyes the colours of the aurora, one of each
A.auroraEyes = (R, L, o) => { [-1, 1].forEach((s, i) => box(R.head, 0.2, 0.17, 0.03, i ? (o.b || VI) : (o.a || G), s * 0.25, 0.52, 0.565, { glow: 1, ink: false })); };
// the long open coat of the Order, tails to the knee, a high collar
A.longCoat = (R, L, o) => {
  const c = o.c || UNI;
  for (const s of [-1, 1]) { box(R.torso, 0.24, 1.04, 0.07, c, s * 0.44, 0.5, 0.31); box(R.torso, 0.07, 1.04, 0.66, c, s * 0.54, 0.5, 0); }
  box(R.torso, 1.08, 1.04, 0.07, c, 0, 0.5, -0.31);
  for (const arm of [R.armL, R.armR]) box(arm, 0.48, 0.66, 0.5, c, 0, -0.3, 0);
  chain(R, R.hips, 0, 0.04, 0, 2, 0.38, (sg, i) => {
    const w = 1.14 + i * 0.12, d = 0.7 + i * 0.08;
    box(sg, w, 0.4, 0.06, c, 0, -0.19, -d / 2);
    for (const s of [-1, 1]) { box(sg, 0.06, 0.4, d, c, s * w / 2, -0.19, 0); box(sg, 0.22, 0.4, 0.06, c, s * (w / 2 - 0.11), -0.19, d / 2); }
  }, { b0: 0.05, b: 0.04, amp: 0.05, sp: 1.8, zamp: 0.03 });
  A.collarTall(R, L, { c, c2: o.c2 || NAVY });
};
// a crown of black ice
A.icicleCrown = (R, L, o) => {
  const H = R.head, c = o.c || 0x0a0a0e, e = o.edge || 0xeaf6ff;
  box(H, 1.27, 0.14, 1.19, c, 0, 1.06, 0, { ink: 0.02 });
  const hs = [0.95, 0.5, 0.72, 0.45, 0.62, 0.45, 0.72, 0.5];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2 + PI / 2, x = cos(a) * 0.6, z = sin(a) * 0.56, h = hs[i] * (o.k || 1);
    mesh(H, cone(0.11, h, 4), c, x, 1.14 + h / 2, z, { ry: PI / 4 });
    box(H, 0.02, h * 0.7, 0.02, e, x, 1.12 + h * 0.4, z + 0.06, { glow: 1, ink: false });
  }
};
// eyes all over him and his throne: shut (o.open: open and staring)
const EYE_SPOTS = [["torso", -0.3, 0.6, 0.33], ["torso", 0.32, 0.36, 0.33], ["armL", 0, -0.35, 0.27], ["armR", 0, -0.2, 0.27], ["throne", -0.75, 3.1], ["throne", 0.7, 2.6],
  ["throne", -0.8, 2.0], ["throne", 0.82, 3.5], ["throne", -0.3, 3.65], ["throne", 0.35, 3.25], ["throne", 0.85, 1.6], ["throne", -0.85, 1.2]];
A.eyes = (R, L, o) => {
  for (const [par, x, y, z] of EYE_SPOTS) {
    const p = par === "throne" ? R.throneBack : R[par]; if (!p) continue;
    const zz = par === "throne" ? 0.17 : z, k = par === "throne" ? 1.5 : 1;
    if (o.open) {
      box(p, 0.26 * k, 0.13 * k, 0.02, 0xffffff, x, y, zz, { glow: 1, ink: 0.012 });
      box(p, 0.09 * k, 0.09 * k, 0.02, o.iris || 0xff3b4e, x, y, zz + 0.012, { glow: 1, ink: false });
    } else box(p, 0.24 * k, 0.04 * k, 0.02, o.lid || 0xeaf6ff, x, y, zz, { ink: false, glow: 1, rz: 0.04 });
  }
};
// a throne of ice (o.y: where its feet are, under a seated or a standing king; o.z: how far back). The back stands
// well clear of his head and every edge glows, so the shape reads on the Absolute card's black heart
A.throne = (R, L, o) => {
  const g = pivot(R.root, 0, o.y == null ? 0.45 : o.y, o.z == null ? -0.15 : o.z), c = o.c || 0x0a0a0e, e = o.edge || 0xeaf6ff;
  box(g, 1.9, 0.32, 1.3, c, 0, 0.17, 0.05);
  box(g, 1.8, 0.18, 1.1, c, 0, -0.06, 0.05);
  const back = pivot(g, 0, 0, -0.62); R.throneBack = back;
  const H = 4.0, W = 2.3;
  box(back, W, H, 0.3, c, 0, H / 2, 0);
  for (const [x, h] of [[-0.95, 1.0], [-0.5, 0.6], [0, 1.5], [0.5, 0.6], [0.95, 1.0]]) {
    mesh(back, cone(0.22, h, 4), c, x, H + h / 2, 0, { ry: PI / 4 });
    box(back, 0.03, h * 0.8, 0.03, e, x, H + h * 0.4, 0.17, { glow: 1, ink: false });
  }
  for (const s of [-1, 1]) {
    box(back, 0.05, H, 0.05, e, s * (W / 2 - 0.04), H / 2, 0.16, { glow: 1, ink: false });
    box(g, 0.32, 0.6, 1.3, c, s * 1.08, 0.5, 0.05);
    box(g, 0.34, 0.04, 0.04, e, s * 1.08, 0.8, 0.71, { glow: 1, ink: false });
  }
  box(back, W - 0.1, 0.05, 0.05, e, 0, H - 0.03, 0.16, { glow: 1, ink: false });
};
// a black greatsword planted point-down beside him, a hand on its pommel
A.plantedSword = (R, L, o) => {
  const s = held(R, o, [PI, 0, 0]);
  box(s, 0.14, 0.6, 0.14, 0x1a1a22, 0, 0.1, 0);
  box(s, 0.8, 0.12, 0.2, o.trim || 0xeaf6ff, 0, 0.42, 0, { ink: 0.02 });
  const len = o.len || 2.4;
  box(s, 0.34, len, 0.08, o.c || 0x0a0a0e, 0, 0.48 + len / 2, 0);
  box(s, 0.05, len - 0.1, 0.1, o.edge || 0xeaf6ff, 0.15, 0.48 + len / 2, 0, { glow: 1, ink: false });
};
// a black greatsword laid across his knees
A.lapSword = (R, L, o) => {
  const s = pivot(R.hips, 0.1, 0.3, 0.75); s.rotation.set(0, 0.15, PI / 2 + 0.08);
  box(s, 0.14, 0.6, 0.14, 0x1a1a22, 0, -0.95, 0);
  box(s, 0.2, 0.8, 0.12, o.trim || 0xeaf6ff, 0, -0.6, 0, { rz: PI / 2, ink: 0.02 });
  box(s, 0.32, 2.0, 0.08, o.c || 0x0a0a0e, 0, 0.42, 0);
  box(s, 0.05, 1.9, 0.1, o.edge || 0xeaf6ff, 0.14, 0.42, 0, { glow: 1, ink: false });
};

// ======================= poses =======================
// hands tucked away in the opposite sleeves, head cocked
POSES.sleeves = (R, t, P, br) => {
  R.armL.rotation.set(-0.78 + br * 0.02, 0, 0.66);
  R.armR.rotation.set(-0.86 + br * 0.02, 0, -0.64);
  R.head.rotation.z += 0.1;
};
// standing easy, the bow held upright at her side like a staff
POSES.atSide = (R, t, P, br) => {
  R.armR.rotation.set(-0.12 + br * 0.02, 0, 0.3);
  R.armL.rotation.set(0.12, 0, -0.16);
};
// on his toes and never still, arms out low with a blade in each hand
POSES.ready = (R, t, P, br) => {
  const b = Math.abs(sin(t * 5.2));
  R.root.position.y = b * 0.07;
  R.armL.rotation.set(-0.35 + sin(t * 2.6) * 0.06, 0, -0.75);
  R.armR.rotation.set(-0.35 - sin(t * 2.6) * 0.06, 0, 0.75);
  if (R.legL) { R.legL.rotation.x = 0.22; R.legR.rotation.x = -0.18; }
  R.torso.rotation.x = 0.1; R.head.rotation.x -= 0.1;
};
// a sword held point-down before him, the other arm at rest
POSES.drop = (R, t, P, br) => {
  R.armR.rotation.set(-0.5 + br * 0.02, 0, -0.06);
  R.armL.rotation.set(0.06, 0, -0.1);
};
// reading the book in his left hand
POSES.read = (R, t, P, br) => {
  R.armL.rotation.set(-1.12 + br * 0.02, 0, 0.42);
  R.armR.rotation.set(-0.15, 0, 0.06);
  R.head.rotation.x += 0.2;
  const c = (t % 9) / 9, s = K.smooth(0.6, 0.66, c) - K.smooth(0.8, 0.86, c);
  R.head.rotation.x -= s * 0.28; R.head.rotation.y += s * 0.25; // now and then he looks up at you, and smiles
};
// low, weight forward, hands open like claws, ready to spring
POSES.crouch = (R, t, P, br) => {
  R.root.position.y = -0.2;
  R.torso.rotation.x = 0.38;
  if (R.legL) { R.legL.rotation.set(0.6, 0, -0.28); R.legR.rotation.set(-0.3, 0, 0.26); }
  R.armL.rotation.set(-0.55 + sin(t * 1.7) * 0.05, 0, -0.4);
  R.armR.rotation.set(-1.05 + sin(t * 1.7 + 1) * 0.05, 0, 0.32);
  R.head.rotation.x -= 0.4;
};
// hands in his pockets, weight on one leg
POSES.pockets = (R, t, P, br) => {
  R.armL.rotation.set(0.3, 0, -0.14);
  R.armR.rotation.set(0.3, 0, 0.14);
  R.hips.rotation.z += 0.05;
  R.head.rotation.z += 0.06;
};
// the watch held up for you to see; turned, chin up
POSES.present = (R, t, P, br) => {
  R.armL.rotation.set(-1.5 + br * 0.03, 0.25, 0.3);
  R.armR.rotation.set(0.18, 0, 0.42);
  R.torso.rotation.y += 0.28;
  R.head.rotation.z += 0.16; R.head.rotation.x -= 0.1; R.head.rotation.y -= 0.25;
};
// seated on a throne, one arm on the rest, one hand on the sword at its side
POSES.sit = (R, t, P, br) => {
  R.root.position.y = -0.45;
  if (R.legL) { R.legL.rotation.set(-1.42, 0.14, -0.06); R.legR.rotation.set(-1.42, -0.14, 0.06); }
  R.armL.rotation.set(-0.42, 0, -0.42);
  R.armR.rotation.set(-0.42 + br * 0.02, 0, 0.36);
  R.torso.rotation.x = -0.06;
  R.head.rotation.x += 0.08;
};
// sweeping his hair back with one hand, the sword low in the other
POSES.slick = (R, t, P, br) => {
  const c = (t % 6) / 6, s = K.smooth(0.0, 0.25, c) - K.smooth(0.55, 0.8, c);
  R.armR.rotation.set(-0.3 - s * 2.4, -s * 0.3, 0.1 - s * 0.75);
  R.armL.rotation.set(0.08, 0, -0.16);
  R.head.rotation.x -= 0.08 + s * 0.12;
};

// ======================= card effects =======================
// spiritual pressure: tongues of coloured light licking up round him from the ground, a column of it behind
FX.pressure = (F, B, st, p, o) => {
  const c = p.scr(o.at || "feet"), S = p.S; if (!c) return;
  const w = (o.w || 46) * S, h = (o.h || 220) * S, cols = o.cols || [o.c], pc = i => cols[i % cols.length];
  const g = B.createLinearGradient(0, c[1], 0, c[1] - h);
  g.addColorStop(0, col(pc(0), 0.26 * (o.a || 1))); g.addColorStop(1, col(pc(0), 0));
  B.fillStyle = g; B.beginPath(); B.ellipse(c[0], c[1] - h * 0.42, w * 1.5, h * 0.55, 0, 0, PI * 2); B.fill();
  spawn(st, o.rate || 34, p.dt, () => ({ x: c[0] + rnd(-1, 1) * w, y: c[1] - rnd(0, 0.55) * h, vy: -rnd(110, 190) * S, ph: rnd(0, 6), life: 0, max: rnd(0.45, 0.8),
    len: rnd(22, 46) * S, wd: rnd(5, 10) * S, ci: (Math.random() * cols.length) | 0, front: Math.random() < (o.front == null ? 0.16 : o.front) }));
  tick(st, p.dt, (q, k) => {
    q.y += q.vy * p.dt;
    const sway = sin(p.t * 7 + q.ph) * 6 * S, a = sin(k * PI) * (o.a || 0.75), ctx = q.front ? F : B;
    const x = q.x + sway * k, y = q.y, wd = q.wd * (1 - k * 0.5), len = q.len * (0.7 + k * 0.6);
    ctx.fillStyle = col(pc(q.ci), a);
    ctx.beginPath(); ctx.moveTo(x - wd, y); ctx.quadraticCurveTo(x - wd * 0.7, y - len * 0.55, x + sway * 0.6, y - len);
    ctx.quadraticCurveTo(x + wd * 0.7, y - len * 0.55, x + wd, y); ctx.quadraticCurveTo(x, y + wd, x - wd, y); ctx.fill();
  });
};
// a needle of light out of the blade to the edge of the card and back, again and again
FX.needle = (F, B, st, p, o) => {
  const a = p.scr(o.a || "base"), b = p.scr(o.b || "tip"), S = p.S; if (!a || !b) return;
  st.t = (st.t || 0) + p.dt;
  const k = (st.t % (o.every || 1.1)) / (o.every || 1.1);
  const ext = k < 0.07 ? k / 0.07 : k < 0.3 ? 1 : k < 0.37 ? 1 - (k - 0.3) / 0.07 : 0; if (!ext) return;
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, L = p.W * 1.5 * ext;
  F.lineCap = "round";
  for (const [lw, c, al] of [[7 * S, o.c, 0.3], [2 * S, 0xffffff, 0.95]]) {
    F.strokeStyle = col(c, al); F.lineWidth = lw;
    F.beginPath(); F.moveTo(b[0], b[1]); F.lineTo(b[0] + dx / l * L, b[1] + dy / l * L); F.stroke();
  }
};
// red threads pulled taut out of her hand across the card, trembling
FX.threads = (F, B, st, p, o) => {
  const a = p.scr(o.at || "handR"), S = p.S; if (!a) return;
  spawn(st, o.rate || 3, p.dt, () => ({ life: 0, max: rnd(1.2, 2.2), x: rnd(-0.1, 1.1) * p.W, y: rnd(0.05, 0.95) * p.H, bend: rnd(-40, 40) * S, back: Math.random() < 0.5 }));
  tick(st, p.dt, (q, k) => {
    const ctx = q.back ? B : F, al = Math.min(1, k * 5) * (1 - k);
    const mx = (a[0] + q.x) / 2 + q.bend * (1 - k) + sin(p.t * 9 + q.x) * 1.5 * S, my = (a[1] + q.y) / 2 + q.bend * 0.5;
    ctx.strokeStyle = col(o.c || 0xff2a3a, 0.9 * al); ctx.lineWidth = 1.4 * S;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, q.x, q.y); ctx.stroke();
  });
};
// one thread hanging slack between two points (the needle's eye and the spool)
FX.tether = (F, B, st, p, o) => {
  const a = p.scr(o.a), b = p.scr(o.b), S = p.S; if (!a || !b) return;
  const ctx = K.lay(F, B, a, o), sag = (o.sag || 22) * S * (1 + sin(p.t * 1.6) * 0.15);
  ctx.strokeStyle = col(o.c || 0xff2a3a, 0.85); ctx.lineWidth = 1.3 * S;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + sag, b[0], b[1]); ctx.stroke();
};
// eyes opening in the dark round him, looking about, closing again
FX.eyes = (F, B, st, p, o) => {
  const S = p.S;
  spawn(st, o.rate || 2.5, p.dt, () => ({ life: 0, max: rnd(1.4, 2.4), x: rnd(0.05, 0.95) * p.W, y: rnd(0.05, 0.72) * p.H, s: rnd(5, 11) * S, look: rnd(-1, 1) }));
  tick(st, p.dt, (q, k) => {
    const open = K.smooth(0, 0.18, k) * (1 - K.smooth(0.8, 1, k)), w = q.s * 1.8, h = q.s * open;
    if (h < 0.3) return;
    B.fillStyle = col(o.c || 0xffffff, 0.5); B.beginPath(); B.ellipse(q.x, q.y, w, h, 0, 0, PI * 2); B.fill();
    B.fillStyle = col(o.iris || 0xff3b4e, 0.95); B.beginPath(); B.arc(q.x + q.look * w * 0.35, q.y, h * 0.7, 0, PI * 2); B.fill();
  });
};
// light arrows raining down at a slant
FX.arrowRain = (F, B, st, p, o) => {
  const S = p.S;
  spawn(st, o.rate || 14, p.dt, () => ({ life: 0, max: rnd(0.35, 0.6), x: rnd(-0.15, 0.95) * p.W, l: rnd(26, 50) * S }));
  tick(st, p.dt, (q, k) => {
    const y = -q.l + k * (p.H + q.l * 2), x = q.x + k * p.H * 0.28;
    F.lineCap = "round";
    for (const [lw, c, al] of [[5 * S, o.c || G, 0.3], [1.8 * S, 0xffffff, 0.9]]) { F.strokeStyle = col(c, al); F.lineWidth = lw; F.beginPath(); F.moveTo(x - q.l * 0.28, y - q.l); F.lineTo(x, y); F.stroke(); }
  });
};
function spawn(st, rate, dt, make) { st.acc = (st.acc || 0) + rate * dt; while (st.acc >= 1) { st.acc -= 1; (st.list = st.list || []).push(make()); } }
function tick(st, dt, draw) {
  const L = st.list || [];
  for (let i = L.length - 1; i >= 0; i--) { const q = L[i]; q.life += dt; if (q.life >= q.max) { L.splice(i, 1); continue; } draw(q, q.life / q.max); }
}

// ======================= the Order of the Long Night (Aurora) =======================
U("elske", "Elske, the Thousandth Arrow", "divine", 260000, {
  gate: "aurora",
  look: { skin: 0xfbe6dc, hairC: 0xfff0c8, hairC2: 0xffe0a0, hair: "pony", hairTie: NAVY, top: UNI, sleeve: UNI, pants: NAVY, boot: UNI, bootTrim: G, glove: NAVY, belt: NAVY,
    face: { eye: CY, brow: 0.18, mouth: "smile" } },
  acc: [["peakedCap", { badge: G }], ["uniform", { trim: G }], ["northStar", { c: G }], ["shoulderCape", { side: -1 }], ["lightBow", { tilt: [0, PI / 2, 0], size: 1.0, noArrow: true }]],
  pose: { pose: "atSide", headX: -0.08 },
  fx: [{ k: "fall", kind: "snow", rate: 10 }, { k: "glow", at: "bow", c: G, r: 46 }],
  rim: [G, 0xffffff],
});
const NATT = { skin: 0xfbe6dc, hairC: 0x14141c, hairC2: 0x24243a, hair: "bob", fringe: "straight", top: NAVY, sleeve: NAVY, pants: NAVY, boot: UNI, glove: UNI, belt: UNI,
  face: { eye: VI, brow: 0.12, mouth: "flat" } };
const NATT_ACC = [["peakedCap", { c: NAVY, band: UNI, badge: VI }], ["uniform", { trim: VI, ep: UNI }], ["lightShield", { hand: "L", c: VI, rot: [0.2, 0, 0] }]];
U("dagnatt", "Dag and Natt, the Twin Lights", "transcendent", 2200000, {
  gate: "aurora",
  look: { skin: 0xfbe6dc, hairC: 0xfff0c8, hairC2: 0xffe6b0, hair: "short", fringe: "spiky", top: UNI, sleeve: UNI, pants: UNI, boot: NAVY, glove: NAVY, belt: NAVY,
    face: { eye: CY, mouth: "grin", brow: -0.05 } },
  acc: [["peakedCap", { badge: CY }], ["uniform", { trim: CY }], ["lightLance", { rot: [1.06, 0, 0], c: CY }],
    ["twin", { look: NATT, acc: NATT_ACC, pose: { pose: "guard", turn: 0.35 } }]],
  pose: { pose: "guard", turn: -0.3 }, scale: 0.92,
  fx: [{ k: "fall", kind: "snow", rate: 8 }, { k: "glow", at: "pair", r: 120, stops: [[0, "rgba(46,230,255,.18)"], [0.5, "rgba(160,123,255,.12)"], [1, "rgba(40,20,90,0)"]] }],
  rim: [CY, VI],
});
U("bjarnulf", "Bjarnulf, the Wall of the North", "primordial", 22000000, {
  gate: "aurora",
  look: { skin: 0xe8c4a8, hairC: 0xe8eef6, hairC2: 0xc8d4e0, hair: "long", top: 0x3a4a5a, sleeve: 0x3a4a5a, pants: NAVY, boot: 0x2a1a10, glove: 0x5a3a22,
    face: { eye: CY, ew: 0.2, eh: 0.16, brow: 0.05, browC: 0xe8eef6 } },
  acc: [["armor", { c: 0xb8c4d0, trim: CY }], ["bearPelt", {}], ["beard", { c: 0xe8eef6 }], ["lightShield", { hand: "L", w: 1.5, h: 2.1, c: CY, rot: [0.25, 0.2, 0] }],
    ["hammer", { rot: [1.2, 0, 0], c: 0x9aa4b0, glow: CY }]],
  pose: { pose: "guard" }, scale: 1.28,
  fx: [{ k: "fall", kind: "snow", rate: 18 }, { k: "steam", at: "face" }],
  rim: [CY, 0xffffff],
});
U("vidar", "Vidar, the Unseeing", "eternal", 380000000, {
  gate: "aurora",
  look: { skin: 0xfbeee6, hairC: 0xf6f8fc, hairC2: 0xbff6ff, hair: "spiky", top: 0x0e0e14, sleeve: UNI, pants: 0x0e0e14, boot: 0x0e0e14, glove: 0xfbeee6,
    face: { style: "none", mouth: "smile", brow: null } },
  acc: [["blindfold", { emblem: G }], ["longCoat", { c: UNI }], ["northStar", { c: VI }]],
  pose: { pose: "pockets", headY: -0.12 }, scale: 1.06,
  fx: [{ k: "fall", kind: "snow", rate: 8 }],
  rim: [0xbff6ff, VI],
});
U("ragnvald", "Ragnvald, Father of the Long Night", "absolute", 6e9, {
  gate: "aurora",
  look: { skin: 0xe8d8cc, hairC: 0x0a0a0e, hairC2: 0x16161c, hair: "long", fringe: "side", top: 0x0a0a0e, sleeve: 0xf4f4f6, pants: 0x0a0a0e, boot: 0x0a0a0e, glove: 0x0a0a0e,
    face: { eye: 0x9aa0b0, ew: 0.22, eh: 0.16, brow: -0.2, mouth: "flat", mustache: 0x0a0a0e } },
  acc: [["throne", { c: 0x23324a, edge: 0xbff2ff }], ["armor", { c: 0x16161c, trim: 0xf4f4f6 }], ["fur", { c: 0xffffff }], ["icicleCrown", { c: 0xeaf2fa, edge: 0xffffff, k: 0.7 }],
    ["lapSword", {}], ["eyes", {}]],
  pose: { pose: "sit" }, scale: 1.05,
  fx: [{ k: "fall", kind: "snow", rate: 12 }],
  rim: [0xffffff, 0x2ee6ff],
});

// ======================= the Unwound (Chrono) =======================
U("secondo", "Secondo, the Second Hand", "divine", 420000, {
  gate: "chrono",
  look: { skin: 0xf2d6c0, hairC: 0xffe0a0, hairC2: 0xffc860, hair: "spiky", top: 0xf2efe6, sleeve: 0xf2efe6, pants: 0x14141a, boot: 0xf2efe6, glove: 0x14141a, cuff: GOLD, belt: 0x14141a,
    face: { eye: 0xffb02e, mouth: "grin", brow: -0.1 } },
  acc: [["watchGlass", { side: 1 }], ["hole", { y: 0.3, r: 0.17 }], ["handDagger", { rot: [PI - 0.2, 0, 0] }], ["handDagger", { hand: "L", rot: [PI - 0.2, 0, 0] }]],
  pose: { pose: "ready" }, scale: 0.92,
  fx: [{ k: "wind", rate: 4 }, { k: "glyphs", set: ["XII"], c: GOLD, rate: 0.6, size: 12 }],
  rim: [0xffb02e, 0xffffff],
});
U("lupo", "Lupo, Hour of the Wolf", "transcendent", 3600000, {
  gate: "chrono",
  look: { skin: 0xe8c8b0, hairC: 0x8aa8e0, hairC2: 0x6a88c8, hair: "spiky", top: 0xe8c8b0, sleeve: 0xf2efe6, pants: 0x14141a, boot: 0x14141a, glove: 0xe8c8b0,
    face: { eye: 0x4fe6ff, ey: 0.62, eh: 0.2, brow: -0.42 } },
  acc: [["openJacket", {}], ["hole", { y: 0.6, r: 0.18 }], ["wolfJaw", {}]],
  pose: { pose: "crouch" },
  fx: [{ k: "dust", rate: 4 }],
  rim: [0x8aa8e0, 0xffffff],
});
U("molla", "Molla, the Watchmaker", "primordial", 36000000, {
  gate: "chrono",
  look: { skin: 0xe6dccc, hairC: 0x9adf3a, hairC2: 0x7ac02a, hair: "messy", top: 0xf2efe6, sleeve: 0xf2efe6, pants: 0x2a2a30, boot: 0x14141a, glove: 0x14141a,
    face: { eye: 0xffd23a, mouth: "grin", brow: -0.25 } },
  acc: [["facePaint", {}], ["loupe", { side: -1 }], ["gearCrown", {}], ["haori", { c: 0xf2efe6, lining: 0x9adf3a, sleeveless: true }], ["hole", { y: 0.5, gear: GOLD }],
    ["backArms", { n: 2 }], ["windKey", {}], ["wrench", { rot: [1.2, 0, 0] }]],
  pose: { pose: "tinker" },
  fx: [{ k: "sparks", a: "tool0", b: "tool1", c: 0xffd23a, rate: 5 }, { k: "steam", at: "key" }],
  rim: [0x9adf3a, 0xffd76a],
});
U("ultimo", "Ultimo, the Last Second", "eternal", 620000000, {
  gate: "chrono",
  look: { skin: 0xf6f6f8, hairC: 0x101014, hairC2: 0x1a1a22, hair: "messy", top: 0xf2efe6, sleeve: 0xf2efe6, pants: 0x14141a, boot: 0x14141a, glove: 0xf6f6f8,
    face: { eye: 0x2ee6b0, ew: 0.2, eh: 0.22, brow: 0.06, mouth: "flat" } },
  acc: [["haori", { c: 0xf2efe6, lining: 0x14141a, sleeveless: true }], ["collarTall", { c: 0xf2efe6, c2: 0x14141a }], ["hornMask", { side: -1 }], ["tearMarks", { c: 0x1a9a8a }],
    ["hole", { y: 0.78, r: 0.14 }]],
  pose: { pose: "pockets" },
  fx: [{ k: "fall", kind: "blackFeather", rate: 1.5 }],
  rim: [0x2ee6b0, 0xffffff],
});
U("mezzanotte", "Mezzanotte, the Hour King", "absolute", 1e10, {
  gate: "chrono",
  look: { skin: 0xf2ece6, hairC: 0xf6f6f8, hairC2: 0xd8d8e0, hair: "short", fringe: "none", top: 0x0e0e12, sleeve: 0x0e0e12, pants: 0x0e0e12, boot: 0x0e0e12, glove: 0xf6f6f2,
    face: { eye: 0xff3b4e, ew: 0.22, eh: 0.18, brow: -0.28, mouth: "smile" } },
  acc: [["haori", { c: 0x0e0e12, lining: 0xf6f6f2, sleeveless: true }], ["collarTall", { c: 0x0e0e12, c2: 0xf6f6f2 }], ["bezelCrown", {}], ["pocketWatch", {}]],
  pose: { pose: "present" }, scale: 1.08,
  fx: [{ k: "glyphs", set: ["XII", "0", "0:00"], c: 0xffffff, rate: 1.5, size: 12 }],
  rim: [0xffffff, 0xff3b4e],
});

// ======================= the First Court (Origin) =======================
const COURT = { top: BLACK, sleeve: BLACK, robe: BLACK, robeTrim: BLACK, robeIn: 0x0a0a0e };
U("hisame", "Hisame, the Fox-Eyed", "divine", 680000, {
  gate: "origin",
  look: Object.assign({ skin: 0xf6e6dc, hairC: 0xdcd8ee, hairC2: 0xb8b0dc, hair: "short", fringe: "spiky", glove: 0xf6e6dc, face: { style: "closed", mouth: "grin", brow: -0.08 } }, COURT),
  acc: [["kimono", { sash: 0xf2f2ee }], ["sleeves", { c: BLACK }], ["armband", {}], ["sheath", { c: 0x2a2440, grip: 0x8a7ac8, trim: 0xc9c4e0 }]],
  pose: { pose: "sleeves", headY: -0.15 },
  fx: [{ k: "motes", c: 0xc9b8ff, rate: 5, size: 1.2 }],
  rim: [0xc9b8ff, 0xffffff],
});
U("kurogane", "Kurogane, the Unchained", "transcendent", 5800000, {
  gate: "origin",
  look: { skin: 0xe8c0a0, hairC: 0x14141a, hairC2: 0x24242e, hair: "long", fringe: "spiky", top: BLACK, sleeve: BLACK, pants: BLACK, boot: 0x2a2a2a, glove: 0xe8c0a0,
    face: { eye: 0xffd23a, mouth: "grin", brow: -0.38, scar: true } },
  acc: [["kimono", { sash: 0x8a1a1a }], ["haori", { c: 0xf2f2ee, lining: BLACK, sleeveless: true, ragged: true }], ["eyepatch", { side: -1, seal: 0xffd23a }], ["chainWrap", {}],
    ["chainedBlade", { rot: [0.62, 0, -0.32] }]],
  pose: { pose: "shoulder", headY: 0.2, turn: -0.15 }, scale: 1.16,
  fx: [{ k: "dust", rate: 3 }],
  rim: [0xffd23a, 0xffffff],
});
U("shirasagi", "Shirasagi, Head of the First House", "primordial", 58000000, {
  gate: "origin",
  look: Object.assign({ skin: 0xf6ece4, hairC: 0x0e0e14, hairC2: 0x1a1a24, hair: "long", fringe: "side", glove: 0xf6ece4, face: { eye: 0x8a9ab8, ew: 0.2, eh: 0.18, brow: 0.08, mouth: "flat" } }, COURT),
  acc: [["kimono", { sash: 0xf2f2ee }], ["haori", { c: 0xf6f6f2, lining: 0xd8c8a0 }], ["stole", { vein: 0xffd76a }], ["hairCombs", {}], ["downBlade", { fwd: 0.15, len: 1.15 }]],
  pose: { pose: "drop", headY: 0.1 },
  fx: [{ k: "fall", kind: "petal", c: 0xfff6ea, rate: 4 }],
  rim: [0xffd76a, 0xffffff],
});
U("tsumugi", "Tsumugi, the Court Physician", "eternal", 1e9, {
  gate: "origin",
  look: Object.assign({ skin: 0xf8ece4, hairC: 0x14141c, hairC2: 0x22222e, hair: "short", fringe: "straight", glove: 0xf8ece4, face: { style: "closed", mouth: "smile", brow: 0.1 } }, COURT),
  acc: [["kimono", { sash: 0xa0182a }], ["haori", { c: 0xf6f6f2, lining: 0xc0182a }], ["braid", { side: -1, tie: 0xc0182a }], ["spool", {}],
    ["needle", { held: true, fwd: 0.1, tilt: [0.12, 0, -0.1] }]],
  pose: { pose: "staff", headY: 0.12 },
  fx: [{ k: "tether", a: "eye", b: "spool", c: 0xff2a3a }],
  rim: [0xff3a4a, 0xffffff],
});
U("kagero", "Kagero, the Gentle Captain", "absolute", 1.6e10, {
  gate: "origin",
  look: Object.assign({ skin: 0xf4e2d4, hairC: 0x5a3a28, hairC2: 0x6e4a34, hair: "short", fringe: "side", glove: 0xf4e2d4, face: { style: "closed", mouth: "smile", brow: 0.14 } }, COURT),
  acc: [["kimono", { sash: 0xf2f2ee }], ["haori", { c: 0xf6f6f2, lining: 0x9a6aff }], ["glasses", { c: 0x3a2a24 }], ["sheath", { c: BLACK, grip: 0x5a3aa0, trim: 0xd8c8ff }],
    ["heldBook", { c: 0x3a2a5a }]],
  pose: { pose: "read" },
  fx: [{ k: "glow", at: "center", r: 100, stops: [[0, "rgba(154,106,255,.16)"], [1, "rgba(154,106,255,0)"]] }],
  rim: [0xd8c8ff, 0xffffff],
});

AF.UNITS.forEach((d, i) => { d.idx = i; AF.UNIT[d.key] = d; });

// ======================= the released forms =======================
// each is its sealed self with what changes: look and face merged in, parts dropped (drop) or added (add), its own
// pose, effects and size. Registered as "<key>@rel" for drawing only (never in AF.UNITS, so never summoned)
const REL = AF.REL = {};
function release(key, d) {
  const b = AF.UNIT[key], look = Object.assign({}, b.look, d.look || {});
  look.face = Object.assign({}, b.look.face, (d.look || {}).face || {});
  const acc = d.acc || b.acc.filter(([n]) => !(d.drop || []).includes(n)).concat(d.add || []);
  const def = Object.assign({}, b, { look, acc, pose: d.pose || b.pose, fx: d.fx || b.fx, scale: d.scale || b.scale, rim: d.rim || b.rim, key: key + "@rel", rel: true });
  REL[key] = def; AF.UNIT[def.key] = def;
}
// Aurora
release("elske", { drop: ["lightBow"], add: [["lightBow", { tilt: [PI / 2, PI / 2, 0, "YXZ"], size: 1.35, c: G, c2: PK }]], pose: { pose: "cast", headX: -0.25 },
  fx: [{ k: "glow", at: "bow", c: G, r: 60 }, { k: "pressure", c: G, w: 40 }, { k: "arrowRain", c: G }, { k: "fall", kind: "snow", rate: 10 }] });
release("dagnatt", { drop: ["lightLance", "twin"], add: [["twin", { look: NATT, acc: NATT_ACC.slice(0, 2), pose: { pose: "cast", turn: 0.3 } }], ["greatLance", {}]],
  pose: { pose: "cast", turn: -0.3 }, fx: [{ k: "pressure", cols: [CY, VI], w: 80, at: "feet" }, { k: "glow", at: "lance", c: CY, r: 90 }, { k: "fall", kind: "snow", rate: 10 }] });
release("bjarnulf", { look: { face: { style: "glow", eye: CY, brow: null } }, drop: ["lightShield"], add: [["lightShield", { hand: "L", w: 2.0, h: 2.9, c: CY, rot: [0.25, 0.2, 0] }]],
  scale: 1.5, fx: [{ k: "pressure", c: CY, w: 60, h: 260 }, { k: "fall", kind: "snow", rate: 30 }, { k: "shock", c: CY, every: 2.4, r: 190 }, { k: "steam", at: "face" }] });
release("vidar", { look: { face: { style: "glow", eye: G, brow: null, mouth: "smile" } }, drop: ["blindfold"], add: [["blindfoldDown", {}], ["auroraEyes", {}],
  ["ribbons", { cols: [G, CY, VI, PK], n: 6 }]], pose: { pose: "pocket", headY: -0.1 },
  fx: [{ k: "pressure", cols: [G, CY, VI, PK], w: 50 }, { k: "ring", at: "feet", c: CY, every: 1.2, r: 110 }, { k: "glow", at: "face", c: 0x9ff2ff, r: 60 }] });
release("ragnvald", { drop: ["eyes", "throne", "lapSword"], add: [["throne", { y: 0, z: -1.15, c: 0x23324a, edge: 0xbff2ff }], ["eyes", { open: true, iris: 0xff3b4e }]], pose: { pose: "emperor" },
  look: { face: { style: "glow", eye: 0xffffff, brow: null } },
  fx: [{ k: "eyes", iris: 0x2ee6ff, rate: 3 }, { k: "pressure", c: 0xffffff, w: 52, a: 0.5 }, { k: "swirl", at: "center", rate: 50, hue: 120, flat: 0.5 }, { k: "glitch", amount: 0.4 }] });
// Chrono
release("secondo", { add: [["handRing", {}]], fx: [{ k: "afterimage", n: 4, every: 0.06, off: 10 }, { k: "wind", rate: 12 }, { k: "pressure", c: 0xffb02e, w: 40 }] });
release("lupo", { drop: ["wolfJaw"], add: [["wolfSkull", {}], ["claws", {}], ["tail", { c: 0xd8dce8, c2: 0x8aa8e0 }]], scale: 1.08,
  fx: [{ k: "pressure", c: 0x6ab8ff, w: 52 }, { k: "dust", rate: 8 }, { k: "shock", c: 0x6ab8ff, every: 2.2, r: 170 }] });
release("molla", { drop: ["backArms", "windKey"], add: [["backArms", { n: 6 }], ["windKey", { sp: 7 }], ["gears", {}]], pose: { pose: "conduct" },
  fx: [{ k: "pressure", c: 0x9adf3a, w: 50 }, { k: "sparks", a: "tool0", b: "tool3", c: 0xffd23a, rate: 12 }, { k: "steam", at: "key" }] });
release("ultimo", { look: { face: { style: "glow", eye: 0x2ee6b0, brow: null } }, drop: ["tearMarks", "hornMask"],
  add: [["tearMarks", { c: 0x2ee6b0, glow: true }], ["hornMask", { side: -1, long: true }], ["handWings", { edge: 0x2ee6b0 }], ["pendulum", {}]],
  pose: { pose: "pockets", float: true }, fx: [{ k: "pressure", c: 0x2ee6b0, w: 44 }, { k: "fall", kind: "blackFeather", rate: 7 }, { k: "shock", c: 0x2ee6b0, every: 2.6, r: 180 }] });
release("mezzanotte", { add: [["clockDial", {}], ["frozenKnives", {}]], pose: { pose: "emperor" },
  fx: [{ k: "pressure", c: 0xffffff, w: 46, a: 0.55 }, { k: "glitch", amount: 0.6 }, { k: "glyphs", set: ["XII", "0", "0:00"], c: 0xffffff, rate: 3, size: 13 }] });
// Origin
release("hisame", { look: { face: { style: "round", eye: 0xff3b6a, eh: 0.2, brow: 0.2, mouth: "grin" } }, drop: ["sheath"], add: [["katana", { rot: [PI, 0, 0], len: 1.1, c: 0xe6e0ff, trim: 0xc9c4e0 }]],
  pose: { pose: "aimOne", headY: -0.2 }, fx: [{ k: "needle", c: 0xc9b8ff, every: 1.1 }, { k: "pressure", c: 0xc9b8ff, w: 40, a: 0.6 }] });
release("kurogane", { look: { face: { style: "glow", eye: 0xffd23a, brow: -0.42 } }, drop: ["eyepatch", "chainWrap", "chainedBlade"],
  add: [["sawCleaver", { rot: [0.62, 0, -0.32] }], ["brokenChains", {}]], scale: 1.2,
  fx: [{ k: "pressure", c: 0xffd23a, w: 64, h: 260, rate: 46 }, { k: "dust", rate: 6 }, { k: "shock", c: 0xffd23a, every: 2.2, r: 200 }] });
release("shirasagi", { drop: ["downBlade"], add: [["downBlade", { fwd: 0.15, hilt: true }], ["kintsugi", {}], ["porcelain", {}]], pose: { pose: "emperor", headY: 0.1 },
  fx: [{ k: "pressure", c: 0xffe6a0, w: 44, a: 0.55 }, { k: "fall", kind: "sand", c: 0xffd76a, rate: 16, size: 0.8 }, { k: "motes", c: 0xffd76a, rate: 10 }] });
release("tsumugi", { look: { hair: "long", fringe: "straight", face: { style: "glow", eye: 0xff2a3a, brow: null } }, drop: ["braid"], pose: { pose: "conduct" },
  fx: [{ k: "threads", at: "handR", rate: 5 }, { k: "pressure", c: 0xff2a3a, w: 46 }, { k: "tether", a: "eye", b: "spool", c: 0xff2a3a }] });
release("kagero", {
  look: { hair: "short", fringe: "none", top: 0xf6f6f2, sleeve: 0xf6f6f2, robe: 0xf6f6f2, robeTrim: 0xf6f6f2, robeIn: 0xe6e6ea, face: { style: "round", eye: 0xb48aff, eh: 0.2, brow: 0.22, mouth: "smile" } },
  acc: [["kimono", { c: BLACK, sash: BLACK }], ["haori", { c: 0x0e0e12, lining: 0x9a6aff }], ["strand", {}], ["katana", { hand: "L", rot: [0.35, 0, 0.15], len: 1.9, c: 0xe8e0ff, trim: 0xd8c8ff }],
    ["husk", { look: AF.UNIT.kagero.look, acc: [["haori", { c: WHITE }], ["glasses", {}]], pose: { pose: "read" } }]],
  pose: { pose: "slick" },
  fx: [{ k: "pressure", c: 0x9a6aff, w: 46 }, { k: "glitch", amount: 0.35 }, { k: "fall", kind: "feather", c: 0xffffff, rate: 4 }] });

// the three factions (the review page and the gates' notes), and who each unit is and what it does: the summon reveal
// shows the command, the unit window and Defense read the rest
AF.FACTIONS = [
  { id: "aurora", name: "The Order of the Long Night", gate: "Aurora Gate", c: "#0d3a34",
    blurb: "In the far north the night lasts half the year, and things come out of it. The Order hunts them with weapons made of the aurora: bows, lances and shields of solid light. Every knight's light was lent to them by the Father of the Long Night, and what is lent can be taken back.",
    look: "White uniforms with high collars, peaked caps and capes, an eight-point star, weapons of solid light." },
  { id: "chrono", name: "The Unwound", gate: "Chrono Gate", c: "#3a2a10",
    blurb: "When the Hour King stopped the world's clock, the hours fell out of it. They woke up masked in pieces of broken clock faces, with a hole where their tick should be, and they follow him because only he can start them again.",
    look: "Bone masks cut from clock faces, a hole through the body somewhere, white and black, numerals." },
  { id: "origin", name: "The First Court", gate: "Origin Gate", c: "#2a2a30",
    blurb: "Before the first world there was a throne, and a court of swordsmen to guard it. Black robes, white captain's coats, and swords with names that wake when you call them. Its kindest captain is the one who emptied the throne.",
    look: "Black robes and hakama, white captain's coats, a named sword each, a release command." },
];
AF.GATE_NOTES = {
  elske: { arche: "the proud archer who never misses (Uryu, Bleach)",
    who: "Top of her class and wants everyone to know it. She has never missed a shot and keeps count: she's on nine hundred and ninety-nine.",
    cmd: "Light the sky.", quote: "Nine hundred and ninety-nine. Hold still for a thousand.",
    atk: "Long-range arrows of light that split into three when they hit.",
    rel: "Thousandth Arrow: a rain of light arrows over the road for 4 s." },
  dagnatt: { arche: "the twins who fight as one",
    who: "A sister and a brother who have never been more than an arm's length apart. Dag carries the lance and Natt the shield, and they finish each other's sentences, which everyone else finds exhausting.",
    cmd: "Together.", quote: "You hit him, you deal with me. / You hit her, you deal with me.",
    atk: "Two attacks at once: Dag's lance pierces a line, Natt's shield bashes and knocks enemies back.",
    rel: "One Light: their lights fuse into one great lance down the length of the road that knocks everything on it back." },
  bjarnulf: { arche: "the giant who only gets bigger (Gerard, Bleach)",
    who: "Has stood at the edge of the Order's land for a hundred winters. Slow to speak, slower to move, and nothing has ever got past him. He wears the bear that tried.",
    cmd: "Stand.", quote: "No.",
    atk: "Grows every wave: +6% size and damage for each wave he has stood on the board.",
    rel: "The Wall: he doubles in size and his shield becomes a wall of light across the road. Everything in front of it stops for 3 s and takes a slam." },
  vidar: { arche: "the cocky strongest who keeps his eyes covered (Gojo, Jujutsu Kaisen)",
    who: "The strongest knight in the Order, and he knows it. He stared at the aurora too long as a boy and it got into his eyes, so he keeps them covered: whatever he looks at directly, the light goes straight through.",
    cmd: "Look at me.", quote: "Relax. Nothing up here has ever touched me.",
    atk: "Nothing reaches him: enemies slow down the closer they get to him, up to 90%.",
    rel: "Open Eyes: he pulls the blindfold down and looks. Every enemy in his sight takes a huge hit and is pushed back up the road." },
  ragnvald: { arche: "the father-king who gave his knights their power and takes it back (Yhwach, Bleach)",
    who: "The king of the Order. He lent every knight their light and he sees every way the night could end. The eyes on his throne are closed. You do not want them open.",
    cmd: "I take it back.", quote: "Everything you are, I lent you.",
    atk: "His Light (passive): every other Aurora unit on the board deals +15% damage.",
    rel: "Taken Back: for 4 s every unit on your side stops attacking while he draws their light in, then he lets it all out at every enemy at once, at twice what they would have dealt." },
  secondo: { arche: "the speedster who can't sit still (the flash-step fighters of Bleach)",
    who: "Talks too fast, laughs at everything and has never stood still in his life. He is always one second ahead of you and will not stop mentioning it.",
    cmd: "Tick.", quote: "Too slow, too slow! Wanna try that again?",
    atk: "The fastest attacker in the game, and every hit makes the next one 3% faster (resets each wave).",
    rel: "Twelve O'Clock: twelve of him, each one cutting a different enemy, for 6 s." },
  lupo: { arche: "the feral fighter who lives for the hunt (Grimmjow, Bleach)",
    who: "The hour before dawn, when the most people die. Proud, savage, hates orders and hates the Hour King most of all. He wears the lower jaw of a wolf's skull with numerals cut in its teeth.",
    cmd: "Howl, Lupo.", quote: "Get out of my way or I go through you.",
    atk: "Leaping melee: every kill lets him leap at the next enemy at once.",
    rel: "Hour of the Wolf: a howl that freezes every enemy in range with fear for 2 s, then he leaps through all of them." },
  molla: { arche: "the mad scientist who experiments on himself (Mayuri, Bleach)",
    who: "Took himself apart to see how he worked, then put himself back together better. Mostly. Half his face is painted, a gear crown turns on his head, and the key in his back has to be wound every hour.",
    cmd: "Wind me up.", quote: "Hold still. I only want to see what's inside.",
    atk: "Every attack drops a ticking clock-bomb on the road that goes off 2 s later.",
    rel: "Escapement: every bomb on the board goes off at once, and his six arms lay a fresh row down the road." },
  ultimo: { arche: "the empty-eyed nihilist (Ulquiorra, Bleach)",
    who: "Has already seen how everything ends, so nothing interests him. Speaks only to correct you. The lines down his cheeks are a clock's hands, stopped one second before the end.",
    cmd: "Close your eyes, Crepuscolo.", quote: "You are already finished. You just haven't noticed.",
    atk: "Ends things: any enemy under 12% health he hits dies on the spot (a boss under 4%).",
    rel: "The Last Second: a spear of light thrown down the whole road, and every enemy under 30% health dies." },
  mezzanotte: { arche: "the vain king who stops time (DIO, JoJo; Barragan, Bleach)",
    who: "Stopped the world's clock because he didn't like what time it was. Everything since has happened only because he allowed it. Vain, theatrical, and he poses when he talks.",
    cmd: "Zero o'clock.", quote: "Your time? You never had any. It was always mine.",
    atk: "Every 12th attack stops time round one enemy for 1 s.",
    rel: "Zero O'Clock: time stops for 5 s and the board goes grey. Only he moves, hanging a clock-hand knife in front of every enemy. All the damage your team deals in the stop is held, then lands at once, x1.5, when time starts again." },
  hisame: { arche: "the smiling lieutenant with his own plan (Gin, Bleach)",
    who: "The Gentle Captain's lieutenant. His eyes never open and his smile never drops, and nobody has seen him draw. He has served the captain for a hundred years, waiting for one clear shot at his back.",
    cmd: "Pierce the dark, Hariyomi.", quote: "Oh, don't mind me. I'm only smiling.",
    atk: "A needle-thin thrust that runs to the edge of the map, through every enemy on the line.",
    rel: "A Thousand Needles: the blade stabs out and back twelve times in one breath, down the whole road." },
  kurogane: { arche: "the battle maniac who holds himself back (Kenpachi, Bleach)",
    who: "Joined the Court for one reason: it had the best fights. He wears a patch that eats his strength and keeps his sword chained shut, because otherwise the fights end too fast.",
    cmd: "Bare your teeth, Nokogiri.", quote: "Hah! Still standing? Good. Don't stop now.",
    atk: "Cleaving melee. Every hit adds Bloodlust (+4% damage, up to +200%) that lasts the whole match.",
    rel: "Off Comes the Patch: Bloodlust doubled, and every swing cleaves all round him for 8 s." },
  shirasagi: { arche: "the cold noble whose blade scatters (Byakuya, Bleach)",
    who: "Head of the oldest house in the Court. He never raises his voice and never wastes a step. His family's rule: what breaks and is mended in gold is worth more than before.",
    cmd: "Break, and be mended, Kintsugi.", quote: "You are beneath my notice. Be grateful.",
    atk: "A stream of porcelain shards that curves after its target and hits it again and again.",
    rel: "Gilded Storm: thousands of shards circle one stretch of road for 6 s and shred everything that walks in." },
  tsumugi: { arche: "the gentle healer who was the first and worst killer (Unohana, Bleach)",
    who: "Has stitched up every captain in the Court and never lost a patient. Nobody alive remembers that before she was the healer, she was the Court's executioner. Everything she sewed, she can unpick.",
    cmd: "Unpick them, Akaito.", quote: "Hold still, please. This will only hurt for a moment.",
    atk: "Every hit stitches the enemy onto a red thread. Damage to anything on the thread is shared by everything on it.",
    rel: "The Last Stitch: the whole board is sewn together for 6 s, every hit shared by every enemy, then she pulls the thread for one cut through all of them." },
  kagero: { arche: "the kind mastermind who planned everything (Aizen, Bleach)",
    who: "The most loved captain the Court ever had. He knew every recruit's name, took the blame for other people's mistakes and read poetry in the evenings. None of it was real. From the moment anyone saw his blade, they saw only what he chose.",
    cmd: "Shed your shell, Utsusemi.", quote: "When did you start believing you were the one summoning me?",
    atk: "Haze (passive): enemies that walk into his range believe what he shows them. One in four turns round and walks back the way it came for 2 s, taking +50% damage while it does.",
    rel: "It Was Never Real: the board turns to negative and nothing seems to happen. Then every enemy takes all the damage your team dealt in the last 10 seconds, at once." },
};
// "Find every unit" counts these too, and each gate's quest counts its own five
if (AF.QUEST && AF.QUEST.f48) AF.QUEST.f48.goal = AF.UNITS.length;
for (const f of AF.FACTIONS) if (AF.QUEST && AF.QUEST[f.id + "All"]) AF.QUEST[f.id + "All"].goal = AF.UNITS.filter(d => d.gate === f.id).length;
})();
