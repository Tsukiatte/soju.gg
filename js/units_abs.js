/* Aura Farm: four more Absolutes for the gates past the Rift (31 Oct, Chris: "Me and my friend have only gotten 1 absolute
   unit ... maybe add a few more absolutes?"; he picked "2 aurora + 1 each later", saw the concepts, then: "build the 4
   absolutes, don't hold back, i want these to be the best models you've created yet").
   Each is a character from an anime archetype made original, sealed and RELEASED like the other gate units
   (units_gates.js): Hallvard and Søvn behind the Aurora Gate, Vespro behind the Chrono Gate, Shigure behind the Origin
   Gate. Each gate's Absolute pulls choose among its own (game.js pickUnit), so a Rebirth 1 player can now find three.
   Their Defense rules are in tdgate.js and their effects in tdrel.js, like the rest. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, A = K.acc, FX = K.FX, POSES = K.POSES;
const { box, mesh, pivot, marker, ball, ring, cyl, cone, chain } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos, abs = Math.abs;
const U = (key, name, rarity, base, d) => AF.UNITS.push(Object.assign({ key, name, rarity, base }, d));
// a hand item kept at a fixed angle to the body whatever the arm does (as units_gates.js)
function held(R, o, tilt) {
  const h = pivot(o.hand === "L" ? R.handL : R.handR, 0, 0, o.fwd || 0);
  const s = pivot(h); K.upright(R, s, o.hand === "L" ? R.armL : R.armR, tilt);
  return s;
}
const UNI = 0xf2f6fa, NAVY = 0x1a2440, G = 0x3dffa0, CY = 0x2ee6ff, VI = 0xa07bff, GOLD = 0xd8a84a, PALE = 0xffe9a8, BONE = 0xece6d6, BLACK = 0x16161c, WHITE = 0xf4f4f0;

// ======================= Hallvard, the King's Balance (Aurora) =======================
// the king's long cape, white over navy, held at the throat by a gold chain
A.kingsCape = (R, L, o) => {
  const c = o.c || UNI, lin = o.lining || NAVY, tr = o.trim || PALE;
  box(R.torso, 0.98, 0.05, 0.05, tr, 0, 0.9, 0.31, { ink: false, glow: 1 });
  for (const s of [-1, 1]) { mesh(R.torso, cyl(0.1, 0.1, 0.06, 10), tr, s * 0.46, 0.9, 0.31, { rx: PI / 2, inkScale: 1.15 }); box(R.torso, 0.42, 0.22, 0.7, c, s * 0.5, 1.02, -0.02, { rz: s * -0.25 }); }
  chain(R, R.torso, 0, 1.02, -0.33, 4, 0.44, (sg, i) => {
    const w = 1.34 + i * 0.14;
    box(sg, w, 0.46, 0.06, c, 0, -0.21, 0);
    box(sg, w - 0.08, 0.44, 0.03, lin, 0, -0.21, 0.045, { ink: false });
    box(sg, 0.05, 0.46, 0.07, tr, -w / 2, -0.21, 0, { ink: false, glow: 1 }); box(sg, 0.05, 0.46, 0.07, tr, w / 2, -0.21, 0, { ink: false, glow: 1 });
    if (i === 3) box(sg, w, 0.06, 0.07, tr, 0, -0.44, 0, { ink: false, glow: 1 });
  }, { b0: 0.16, b: 0.05, amp: 0.05, sp: 1.3, zamp: 0.04 });
};
// two long locks framing the face, down past the collar
A.faceLocks = (R, L, o) => { for (const s of [-1, 1]) chain(R, R.head, s * 0.52, 0.85, 0.42, 3, 0.3, (sg, i) => box(sg, 0.16 - i * 0.02, 0.32, 0.12, i % 2 ? (L.hairC2 || L.hairC) : L.hairC, 0, -0.15, 0), { b0: 0.06, b: 0.04, amp: 0.03, sp: 1.2, zamp: 0.03 }); };
// a balance of light: a rod, a beam that tips, two pans on light chains (a star in one, a dark stone in the other)
A.balanceScale = (R, L, o) => {
  const s = held(R, Object.assign({ hand: "L", fwd: 0.06 }, o), [0, 0, 0]), k = o.size || 1, c = o.c || PALE;
  const root = pivot(s, 0, 0, 0); root.scale.setScalar(k);
  box(root, 0.07, 0.3, 0.07, 0x1a1a22, 0, 0.02, 0);
  box(root, 0.05, 1.1, 0.05, 0xffffff, 0, 0.7, 0, { glow: 1, ink: 0.012 });
  mesh(root, cone(0.09, 0.22, 4), c, 0, 1.36, 0, { glow: 1 });
  mesh(root, cone(0.09, 0.14, 4), c, 0, 1.2, 0, { rx: PI, glow: 1 });
  const beam = pivot(root, 0, 1.18, 0);
  box(beam, 1.24, 0.05, 0.05, c, 0, 0, 0, { glow: 1, ink: 0.012 });
  mesh(beam, ring(0.07, 0.02, 4, 12), 0xffffff, 0, 0, 0, { glow: 1 });
  const pans = [-1, 1].map(d => {
    const hang = pivot(beam, d * 0.6, 0, 0);
    const pan = pivot(hang);
    for (const a of [0, 2.1, 4.2]) box(pan, 0.015, 0.5, 0.015, 0xffffff, cos(a) * 0.1, -0.25, sin(a) * 0.1, { glow: 1, ink: false, rz: -cos(a) * 0.38, rx: sin(a) * 0.38 });
    mesh(pan, cyl(0.24, 0.18, 0.06, 16), c, 0, -0.5, 0, { glow: 1, inkScale: 1.06 });
    mesh(pan, cyl(0.2, 0.2, 0.02, 16), d < 0 ? CY : 0x2a2a3a, 0, -0.465, 0, { glow: d < 0 ? 1 : 0, ink: false });
    if (d < 0) mesh(pan, new T.OctahedronGeometry(0.08, 0), 0xffffff, 0, -0.38, 0, { glow: 1 });
    else mesh(pan, ball(0.08, 0), 0x1a1a24, 0, -0.4, 0, { inkScale: 1.2 });
    return pan;
  });
  marker(R, "scale", beam);
  R.anim.push(t => { const tip = sin(t * 0.9) * 0.18; beam.rotation.z = tip; pans.forEach(p => { p.rotation.z = -tip; }); });
};
// released: the scale grown huge and hung in the air behind him, tipped hard toward the gold
A.heavenScale = (R, L, o) => {
  const g = pivot(R.root, 0, 4.0, -1.1), c = o.c || PALE;
  box(g, 0.1, 1.6, 0.1, 0xffffff, 0, 0.3, 0, { glow: 1, ink: false });
  mesh(g, cone(0.2, 0.5, 4), c, 0, 1.3, 0, { glow: 1 });
  mesh(g, ring(0.32, 0.05, 6, 28), c, 0, 0.9, 0, { glow: 1 });
  const beam = pivot(g, 0, 0.75, 0);
  box(beam, 3.6, 0.1, 0.1, c, 0, 0, 0, { glow: 1, ink: false });
  for (const d of [-1, 1]) box(beam, 0.3, 0.3, 0.06, 0xffffff, d * 1.8, 0, 0, { rz: PI / 4, glow: 1, ink: false });
  const pans = [-1, 1].map(d => {
    const pan = pivot(beam, d * 1.75, 0, 0);
    for (const a of [0, 2.1, 4.2]) box(pan, 0.03, 1.3, 0.03, 0xffffff, cos(a) * 0.28, -0.65, sin(a) * 0.28, { glow: 1, ink: false, rz: -cos(a) * 0.4, rx: sin(a) * 0.4 });
    mesh(pan, cyl(0.62, 0.42, 0.12, 24), c, 0, -1.3, 0, { glow: 1 });
    if (d < 0) { mesh(pan, new T.OctahedronGeometry(0.26, 0), 0xffffff, 0, -1.05, 0, { glow: 1 }); mesh(pan, ring(0.5, 0.03, 4, 24), CY, 0, -1.22, 0, { glow: 1, rx: PI / 2 }); }
    else mesh(pan, ball(0.26, 1), 0x0e0e16, 0, -1.08, 0, { inkScale: 1.1 });
    return pan;
  });
  marker(R, "heaven", g);
  R.anim.push(t => { const tip = -0.32 + sin(t * 0.7) * 0.05; beam.rotation.z = tip; pans.forEach(p => { p.rotation.z = -tip; }); g.position.y = 4.0 + sin(t * 1.1) * 0.06; });
};
// a straight sword at his hip, his hand resting on the pommel
A.hipSword = (R, L, o) => {
  const s = pivot(R.hips, 0.6, 0.12, 0.14); s.rotation.set(0.55, 0, -0.12);
  box(s, 0.14, 1.5, 0.12, o.c || UNI, 0, -0.7, 0);
  for (const y of [-0.05, -0.75, -1.42]) box(s, 0.17, 0.08, 0.15, PALE, 0, y, 0, { ink: 0.012 });
  box(s, 0.5, 0.08, 0.12, PALE, 0, 0.06, 0, { ink: 0.015 });
  box(s, 0.1, 0.36, 0.1, NAVY, 0, 0.28, 0);
  mesh(s, new T.OctahedronGeometry(0.08, 0), CY, 0, 0.5, 0, { glow: 1 });
};
// released: the sword drawn, a blade of light the length of him
A.lightBlade = (R, L, o) => {
  const s = K.hand(R, o), c = o.c || 0xffffff;
  box(s, 0.12, 0.42, 0.12, NAVY, 0, 0.0, 0);
  box(s, 0.62, 0.1, 0.16, PALE, 0, 0.24, 0, { ink: 0.015 });
  for (const d of [-1, 1]) mesh(s, cone(0.06, 0.18, 4), PALE, d * 0.36, 0.24, 0, { rz: d * -PI / 2, inkScale: 1.2 });
  const b = box(s, 0.18, 2.5, 0.06, c, 0, 1.55, 0, { glow: 1, ink: 0.015 });
  box(s, 0.06, 2.4, 0.08, o.edge || CY, 0, 1.55, 0, { glow: 1, ink: false });
  mesh(s, cone(0.13, 0.36, 4), c, 0, 2.95, 0, { glow: 1, ry: PI / 4 });
  marker(R, "tip", b, 0, 1.4, 0);
};
// released: a tall kite shield of light on his arm, edged in gold, the Order's star on its face
A.kiteShield = (R, L, o) => {
  const s = K.hand(R, Object.assign({ hand: "L" }, o)), c = o.c || PALE;
  const f = pivot(s, 0, 0.1, 0.22);
  box(f, 1.1, 1.0, 0.05, 0xfff2cc, 0, 0.35, 0, { glow: 1, ink: 0.015 });
  mesh(f, cone(0.78, 1.0, 4), 0xfff2cc, 0, -0.65, 0, { rx: PI, ry: PI / 4, glow: 1 }).scale.z = 0.06;
  for (const [x, y, w, h, rz] of [[0, 0.86, 1.18, 0.08, 0], [-0.55, 0.35, 0.08, 1.04, 0], [0.55, 0.35, 0.08, 1.04, 0], [-0.3, -0.62, 0.08, 1.15, 0.56], [0.3, -0.62, 0.08, 1.15, -0.56]]) box(f, w, h, 0.08, c, x, y, 0.02, { rz, glow: 1, ink: false });
  for (const r of [0, 0.785]) box(f, 0.4, 0.4, 0.06, 0xffffff, 0, 0.2, 0.05, { rz: r, glow: 1, ink: false });
  marker(R, "shield", f);
};
// weighing: the scale held out before him, the other hand on the pommel at his hip
POSES.weigh = (R, t, P, br) => {
  R.armL.rotation.set(-0.7 + br * 0.02, 0.3, -0.42);
  R.armR.rotation.set(-0.32, 0.1, 0.18);
  R.head.rotation.z += 0.05; R.head.rotation.x += 0.06;
};
// the verdict: the shield up across him, the blade raised high
POSES.verdict = (R, t, P, br, fl) => {
  R.armR.rotation.set(-2.6 + br * 0.03, 0, 0.32);
  R.armL.rotation.set(-1.15, 0.6, 0.25);
  R.torso.rotation.y += -0.18;
  if (R.legL) { R.legL.rotation.x = 0.28; R.legR.rotation.x = -0.24; }
};

U("hallvard", "Hallvard, the King's Balance", "absolute", 7e9, {
  gate: "aurora",
  look: { skin: 0xf6e8de, hairC: 0xf2e2a8, hairC2: 0xe2cc86, hair: "long", fringe: "side", top: UNI, sleeve: UNI, pants: NAVY, boot: UNI, bootTrim: PALE, glove: UNI, belt: NAVY,
    face: { style: "closed", mouth: "flat", brow: 0.04, browC: 0xd8c48a } },
  acc: [["longCoat", { c: UNI, c2: NAVY }], ["uniform", { trim: PALE, ep: NAVY }], ["northStar", { c: PALE }], ["kingsCape", {}], ["faceLocks", {}], ["hipSword", {}], ["balanceScale", { size: 0.85 }]],
  pose: { pose: "weigh" }, scale: 1.04,
  fx: [{ k: "fall", kind: "snow", rate: 9 }, { k: "glow", at: "scale", c: PALE, r: 70 }, { k: "motes", c: PALE, rate: 6 }],
  rim: [PALE, CY],
});

// ======================= Søvn, the Dreaming Child (Aurora) =======================
// an Order coat three sizes too big: the hem on the ground, sleeves past his hands, the collar up to his ears
A.bigCoat = (R, L, o) => {
  const c = o.c || UNI, t = o.trim || G;
  box(R.torso, 1.22, 1.12, 0.74, c, 0, 0.5, -0.02);
  box(R.torso, 0.05, 1.0, 0.03, t, 0, 0.5, 0.36, { glow: 1, ink: false });
  for (let i = 0; i < 3; i++) box(R.torso, 0.1, 0.1, 0.04, 0xd8dce4, 0.12, 0.25 + i * 0.25, 0.37, { ink: 0.01 });
  box(R.torso, 1.3, 0.5, 0.86, c, 0, 1.08, -0.04);
  box(R.torso, 1.31, 0.06, 0.87, t, 0, 1.3, -0.04, { glow: 1, ink: false });
  for (const arm of [R.armL, R.armR]) { box(arm, 0.6, 1.08, 0.62, c, 0, -0.5, 0); box(arm, 0.62, 0.07, 0.64, t, 0, -1.02, 0, { glow: 1, ink: false }); }
  chain(R, R.hips, 0, 0.04, 0, 3, 0.36, (sg, i) => {
    const w = 1.3 + i * 0.2, d = 0.86 + i * 0.12;
    box(sg, w, 0.38, 0.06, c, 0, -0.18, -d / 2);
    for (const s of [-1, 1]) { box(sg, 0.06, 0.38, d, c, s * w / 2, -0.18, 0); box(sg, w * 0.36, 0.38, 0.06, c, s * w * 0.32, -0.18, d / 2); }
    if (i === 2) box(sg, w + 0.02, 0.06, d + 0.02, t, 0, -0.36, 0, { glow: 1, ink: false });
  }, { b0: 0.05, b: 0.04, amp: 0.04, sp: 1.4, zamp: 0.03 });
};
// a nightcap of the Order's navy with stars on it, flopping back, a bobble of aurora light at its tip
A.nightcap = (R, L, o) => {
  const H = R.head, c = o.c || NAVY;
  box(H, 1.36, 0.22, 1.28, 0xf2f6fa, 0, 1.1, -0.02, { ink: 0.02 });
  box(H, 1.24, 0.34, 1.16, c, 0, 1.36, -0.06);
  const segs = chain(R, H, 0, 1.5, -0.1, 5, 0.3, (sg, i) => {
    box(sg, 1.0 - i * 0.17, 0.34, 0.9 - i * 0.15, c, 0, -0.15, 0);
    if (i % 2 === 0) box(sg, 0.1, 0.1, 0.02, 0xffe9a8, 0.2 - i * 0.05, -0.12, 0.46 - i * 0.075, { glow: 1, ink: false, rz: 0.785 });
  }, { b0: 2.3, b: 0.42, amp: 0.08, sp: 1.4, zamp: 0.06, rz0: 0.15 });
  const bob = pivot(segs[4], 0, -0.36, 0);
  mesh(bob, ball(0.2, 1), o.glow || G, 0, 0, 0, { glow: 1 });
  mesh(bob, ball(0.32, 1), o.glow2 || CY, 0, 0, 0, { glow: 2, own: 1 });
  marker(R, "bobble", bob);
};
// his sword: a toy of light, chunky and round-tipped, longer than he is, held loosely and dragging
A.toySword = (R, L, o) => {
  const s = K.hand(R, o), k = o.size || 1;
  box(s, 0.16, 0.42 * k, 0.16, 0xffe9a8, 0, 0.05, 0, { ink: 0.015 });
  mesh(s, ball(0.13, 1), 0xffe9a8, 0, -0.22 * k, 0);
  box(s, 0.7 * k, 0.16, 0.2, VI, 0, 0.3 * k, 0, { glow: 1, ink: 0.015 });
  const b = box(s, 0.34 * k, 1.9 * k, 0.12, G, 0, 1.33 * k, 0, { glow: 1, ink: 0.02 });
  box(s, 0.12 * k, 1.8 * k, 0.14, 0xeafff6, 0, 1.33 * k, 0, { glow: 1, ink: false });
  mesh(s, cyl(0.17 * k, 0.17 * k, 0.12, 16), G, 0, 2.28 * k, 0, { rx: PI / 2, glow: 1 });
  marker(R, "tip", b, 0, 0.95 * k, 0);
};
// the friend he imagined to keep him company: a great shadow of a stuffed bear, button eyes, a mouth sewn shut, seams
// of aurora light, its paws round him (o.awake: the eyes alight, the mouth torn open, its arms up)
A.dreamBeast = (R, L, o) => {
  const g = pivot(R.root, 0, 0, o.z == null ? -1.25 : o.z), c = o.c || 0x1c2240, c2 = o.c2 || 0x2a3458, seam = o.seam || G, aw = !!o.awake;
  const body = pivot(g, 0, 0, 0);
  box(body, 3.0, 2.6, 1.7, c, 0, 1.45, 0);
  box(body, 2.2, 1.9, 0.2, c2, 0, 1.35, 0.85, { ink: false });
  for (let i = 0; i < 7; i++) box(body, 0.06, 0.14, 0.04, seam, 0, 0.6 + i * 0.3, 0.97, { glow: 1, ink: false });
  box(body, 0.6, 0.6, 0.04, 0x3a4470, 0.85, 2.15, 0.87, { rz: 0.15, ink: 0.015 });
  for (let i = 0; i < 4; i++) box(body, 0.16, 0.04, 0.02, seam, 0.85 + (i - 1.5) * 0.15, 2.45 - (i % 2) * 0.58, 0.9, { rz: 0.15 + (i % 2 ? 0.6 : -0.6), glow: 1, ink: false });
  const hd = pivot(g, 0, 2.75, 0.15);
  box(hd, 2.3, 1.8, 1.7, c, 0, 0.9, 0);
  box(hd, 1.0, 0.6, 0.5, c2, 0, 0.55, 0.88);
  box(hd, 0.32, 0.22, 0.12, 0x0b0d16, 0, 0.78, 1.15, { ink: 0.015 });
  for (const s of [-1, 1]) {
    const ear = pivot(hd, s * 0.95, 1.85, 0);
    mesh(ear, cyl(0.42, 0.42, 0.32, 16), c, 0, 0.1, 0, { rx: PI / 2 });
    mesh(ear, cyl(0.24, 0.24, 0.34, 14), c2, 0, 0.1, 0.02, { rx: PI / 2, ink: false });
    if (aw) {
      box(hd, 0.46, 0.24, 0.06, 0x0b0d16, s * 0.5, 1.12, 0.85, { ink: 0.015 });
      box(hd, 0.36, 0.14, 0.04, seam, s * 0.5, 1.12, 0.89, { glow: 1, ink: false });
    } else {
      mesh(hd, cyl(0.26, 0.26, 0.08, 18), 0xf2f0e8, s * 0.5, 1.12, 0.87, { rx: PI / 2, inkScale: 1.1 });
      for (const [x, y] of [[-0.07, 0.07], [0.07, 0.07], [-0.07, -0.07], [0.07, -0.07]]) box(hd, 0.06, 0.06, 0.03, 0x1a1a24, s * 0.5 + x, 1.12 + y, 0.92, { ink: false });
    }
  }
  if (aw) {
    box(hd, 1.2, 0.5, 0.06, 0x05060c, 0, 0.3, 0.87, { ink: 0.015 });
    for (let i = 0; i < 6; i++) { mesh(hd, cone(0.08, 0.22, 4), 0xf2f0e8, -0.5 + i * 0.2, 0.47, 0.9, { rx: PI, ink: false }); mesh(hd, cone(0.08, 0.2, 4), 0xf2f0e8, -0.4 + i * 0.16, 0.12, 0.9, { ink: false }); }
    box(hd, 0.9, 0.2, 0.04, seam, 0, 0.3, 0.88, { glow: 1, ink: false });
  } else {
    box(hd, 0.9, 0.05, 0.04, seam, 0, 0.32, 0.88, { glow: 1, ink: false });
    for (let i = 0; i < 5; i++) for (const r of [0.6, -0.6]) box(hd, 0.18, 0.04, 0.04, seam, -0.36 + i * 0.18, 0.32, 0.89, { rz: r, glow: 1, ink: false });
  }
  for (let i = 0; i < 4; i++) box(hd, 0.12, 0.04, 0.03, seam, -0.9 + i * 0.12, 1.6 - i * 0.08, 0.86, { rz: -0.5, glow: 1, ink: false });
  // paws: round him on the ground (asleep), or raised either side of him (awake)
  const paws = [-1, 1].map(s => {
    const a = pivot(g, s * 1.45, 2.0, 0.4);
    box(a, 0.8, 1.6, 0.8, c, 0, -0.75, 0);
    const p = pivot(a, 0, -1.5, 0.2);
    box(p, 0.95, 0.5, 1.05, c, 0, -0.1, 0.25);
    mesh(p, cyl(0.24, 0.24, 0.04, 14), c2, 0, -0.1, 0.79, { rx: PI / 2, ink: false });
    for (let k = -1; k <= 1; k++) mesh(p, cyl(0.1, 0.1, 0.04, 10), c2, k * 0.25, 0.14, 0.79, { rx: PI / 2, ink: false });
    if (aw) for (let k = -1; k <= 1; k++) mesh(p, cone(0.07, 0.3, 4), 0xf2f0e8, k * 0.25, -0.2, 0.85, { rx: PI / 2 + 0.6, inkScale: 1.2 });
    if (aw) a.rotation.set(-0.4, 0, s * -2.0); else a.rotation.set(-0.95, s * -0.35, s * -0.15);
    return a;
  });
  R.beast = g;
  R.anim.push(t => {
    const br = sin(t * (aw ? 1.6 : 0.8));
    body.scale.set(1 + br * 0.015, 1 + br * 0.03, 1); hd.position.y = 2.75 + br * 0.06;
    hd.rotation.z = aw ? sin(t * 1.3) * 0.08 : 0.12 + sin(t * 0.5) * 0.04;
    if (aw) paws.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (2.0 + sin(t * 2 + i) * 0.12); });
  });
};
// what he imagined falling: a meteor of aurora fire hanging overhead
A.dreamMeteor = (R, L, o) => {
  const g = pivot(R.root, o.x == null ? 1.3 : o.x, o.y || 5.0, o.z == null ? -0.6 : o.z); g.rotation.z = -0.6; g.scale.setScalar(0.8);
  const rock = mesh(g, new T.IcosahedronGeometry(0.85, 0), 0x2a2440, 0, 0, 0, { inkScale: 1.06 });
  for (let i = 0; i < 6; i++) mesh(g, cone(0.18, 0.5, 4), 0x3a3460, cos(i) * 0.6, sin(i * 1.7) * 0.5, sin(i) * 0.5, { rx: i, rz: i * 0.7 });
  for (let i = 0; i < 5; i++) box(g, 0.06, 0.5, 0.02, [G, CY, VI][i % 3], cos(i * 1.3) * 0.62, sin(i * 1.3) * 0.62, 0.62, { rz: i, glow: 1, ink: false });
  for (let i = 0; i < 3; i++) mesh(g, cone(0.8 - i * 0.22, 1.6 + i * 0.4, 10), [G, CY, 0xffffff][i], 0, 1.0 + i * 0.25, 0, { glow: 2, own: 1 });
  marker(R, "meteor", g);
  R.anim.push(t => { rock.rotation.set(t * 0.4, t * 0.7, 0); g.position.y = (o.y || 5.0) + sin(t * 1.4) * 0.1; });
};
// asleep: cross-legged and floating, nodding off, now and then rubbing an eye
POSES.doze = (R, t, P, br, fl) => {
  if (R.legL) { R.legL.rotation.set(-1.42, 0.7, 0); R.legR.rotation.set(-1.42, -0.7, 0); }
  const c = (t % 8) / 8, rub = K.smooth(0.1, 0.18, c) - K.smooth(0.34, 0.42, c), nod = K.smooth(0.55, 0.6, c) - K.smooth(0.7, 0.72, c);
  R.armL.rotation.set(-0.5 - rub * 1.8, 0, 0.35 + rub * 0.25);
  R.armR.rotation.set(-0.38, 0, -0.22);
  R.head.rotation.x += 0.18 + nod * 0.35; R.head.rotation.z += 0.12;
};
// awake: both arms up, calling the thing he imagined down
POSES.conjure = (R, t, P, br, fl) => {
  R.armL.rotation.set(-2.7 + sin(t * 2) * 0.06, 0, -0.35);
  R.armR.rotation.set(-2.5 - sin(t * 2) * 0.06, 0, 0.35);
  R.head.rotation.x -= 0.32;
  if (R.legL) { R.legL.rotation.x = 0.3; R.legR.rotation.x = -0.1; }
};
U("sovn", "Søvn, the Dreaming Child", "absolute", 6.5e9, {
  gate: "aurora",
  look: { skin: 0xfbe6dc, hairC: 0xd8e4f4, hairC2: 0xbfd0ec, hair: "messy", top: UNI, sleeve: UNI, pants: NAVY, boot: UNI, glove: UNI,
    face: { style: "bored", eye: VI, brow: 0.2, browC: 0xbfd0ec, mouth: "flat", mouthW: 0.1, blush: true } },
  acc: [["bigCoat", {}], ["nightcap", {}], ["toySword", { rot: [2.4, 0, -0.2], size: 0.95 }], ["dreamBeast", {}]],
  pose: { pose: "doze", float: true }, scale: 0.92,
  fx: [{ k: "bubbles", rate: 3 }, { k: "glow", at: "bobble", c: G, r: 46 }, { k: "fall", kind: "snow", rate: 6 }, { k: "stars", rate: 3 }],
  rim: [G, VI],
});

// ======================= Vespro, the Lonely Hour (Chrono) =======================
// a long grey coat, shaggy with fur at the collar, the cuffs and the hem
A.furCoat = (R, L, o) => {
  const c = o.c || 0x8e8a92, f = o.fur || 0xe6e2da;
  for (const s of [-1, 1]) { box(R.torso, 0.24, 1.04, 0.07, c, s * 0.44, 0.5, 0.31); box(R.torso, 0.07, 1.04, 0.66, c, s * 0.54, 0.5, 0); }
  box(R.torso, 1.08, 1.04, 0.07, c, 0, 0.5, -0.31);
  box(R.torso, 1.3, 0.3, 0.86, f, 0, 1.02, -0.04, { ink: 0.02 });
  for (let i = 0; i < 9; i++) mesh(R.torso, cone(0.1, 0.24, 4), f, -0.56 + i * 0.14, 1.2, -0.1 + (i % 2) * 0.1, { rx: -0.4, ry: PI / 4, inkScale: 1.15 });
  for (const arm of [R.armL, R.armR]) { box(arm, 0.5, 0.68, 0.52, c, 0, -0.3, 0); box(arm, 0.56, 0.16, 0.58, f, 0, -0.62, 0, { ink: 0.015 }); }
  chain(R, R.hips, 0, 0.04, 0, o.n || 3, 0.38, (sg, i) => {
    const w = 1.16 + i * 0.14, d = 0.72 + i * 0.1;
    box(sg, w, 0.4, 0.06, c, 0, -0.19, -d / 2);
    for (const s of [-1, 1]) { box(sg, 0.06, 0.4, d, c, s * w / 2, -0.19, 0); box(sg, 0.22, 0.4, 0.06, c, s * (w / 2 - 0.11), -0.19, d / 2); }
    if (i === (o.n || 3) - 1) for (let k = 0; k < 7; k++) mesh(sg, cone(0.08, 0.2, 4), f, -w / 2 + 0.1 + k * (w - 0.2) / 6, -0.42, -d / 2, { rx: PI, inkScale: 1.15 });
  }, { b0: 0.05, b: 0.04, amp: 0.05, sp: 1.5, zamp: 0.03 });
};
// what's left of his mask: the lower jaw of a clock face round his throat, numerals on its teeth
A.jawCollar = (R, L, o) => {
  const b = o.c || BONE;
  box(R.torso, 0.92, 0.2, 0.7, b, 0, 1.06, 0.02, { ink: 0.02 });
  for (let i = 0; i < 7; i++) mesh(R.torso, cone(0.05, 0.16, 4), b, -0.36 + i * 0.12, 1.22, 0.32, { inkScale: 1.25 });
  for (let i = 0; i < 4; i++) box(R.torso, 0.03, 0.1, 0.02, 0x2a2a30, -0.27 + i * 0.18, 1.05, 0.375, { ink: false, rz: i % 2 ? 0.3 : 0 });
};
A.goatee = (R, L, o) => { const H = R.head, c = o.c || L.hairC; box(H, 0.2, 0.18, 0.08, c, 0.02, 0.12, 0.55); box(H, 0.4, 0.05, 0.05, c, 0.02, 0.33, 0.56, { ink: 0.01 }); };
// his other half: a small girl with the other piece of his mask, tugging at his coat
A.companion = (R, L, o) => {
  const g = pivot(R.root, o.x == null ? -0.95 : o.x, 0, o.z == null ? 0.25 : o.z);
  g.scale.setScalar(o.s || 0.6); g.rotation.y = o.ry == null ? 0.35 : o.ry;
  const R2 = K.rig(g, o.look); R2.P = Object.assign({}, o.pose || {});
  (o.acc || []).forEach(([n, oo]) => A[n] && A[n](R2, o.look, oo || {}));
  R.centre = marker(R, "pair", R.root, -0.3, 1.5, 0);
  R.anim.push(t => K.animate(R2, t + 1.3, R2.P));
};
// released: she has become his pistols, long revolvers of bone with a clock face for a cylinder
A.clockPistol = (R, L, o) => {
  const s = K.hand(R, o), c = o.c || BONE, gl = o.glow || 0x8ad8ff;
  box(s, 0.13, 0.4, 0.2, 0x1a1a22, 0, -0.05, -0.04, { rx: 0.25 });
  const gun = pivot(s, 0, 0.16, 0.02);
  box(gun, 0.16, 0.22, 0.34, c, 0, 0, 0.0);
  mesh(gun, cyl(0.14, 0.14, 0.14, 14), c, 0, 0.0, 0.2, { rz: PI / 2 });
  mesh(gun, cyl(0.1, 0.1, 0.15, 14), gl, 0, 0.0, 0.2, { rz: PI / 2, glow: 1, ink: false });
  box(gun, 0.11, 0.11, 0.9, c, 0, 0.04, 0.68);
  box(gun, 0.13, 0.04, 0.88, GOLD, 0, 0.11, 0.68, { ink: false });
  mesh(gun, cyl(0.04, 0.04, 0.04, 8), gl, 0, 0.04, 1.14, { rx: PI / 2, glow: 1, ink: false });
  marker(R, o.hand === "L" ? "muzzleL" : "muzzleR", gun, 0, 0.04, 1.16);
};
// released: the pack, wolves drawn in clock hands of light, circling him
A.wolfPack = (R, L, o) => {
  const g = pivot(R.root, 0, 0.05, 0), c = o.c || 0x8ad8ff, n = o.n || 3, wolves = [];
  for (let i = 0; i < n; i++) {
    const w = pivot(g), b = pivot(w, 0, 0.62, 0); w.scale.setScalar(1.3);
    const bar = (x, y, z, l, rx, rz, th = 0.07) => box(b, th, l, th, c, x, y, z, { rx, rz, glow: 1, ink: false });
    // a body of pale light, edged by the hands it's drawn with
    box(b, 0.3, 0.34, 0.95, c, 0, 0.12, 0, { glow: 2, own: 1 });
    box(b, 0.24, 0.26, 0.42, c, 0, 0.36, 0.66, { glow: 2, own: 1, rx: 0.3 });
    bar(0, 0.3, 0, 1.0, PI / 2, 0, 0.06);
    bar(0, 0.38, 0.62, 0.34, 0.6, 0); bar(0, 0.33, 0.82, 0.3, PI / 2 - 0.2, 0);
    for (const s of [-1, 1]) mesh(b, cone(0.06, 0.2, 4), c, s * 0.08, 0.58, 0.56, { glow: 1 });
    for (const [z, s] of [[0.42, -1], [0.42, 1], [-0.42, -1], [-0.42, 1]]) bar(s * 0.1, -0.24, z, 0.62, z > 0 ? 0.3 : -0.3, 0);
    bar(0, 0.22, -0.66, 0.5, -0.9, 0);
    mesh(b, cone(0.06, 0.16, 4), 0xffffff, 0, 0.36, 0.98, { rx: PI / 2, glow: 1 });
    wolves.push([w, b, i]);
  }
  R.anim.push(t => wolves.forEach(([w, b, i]) => {
    const a = t * 0.8 + (i / n) * PI * 2, r = 2.0;
    w.position.set(cos(a) * r, 0, sin(a) * r * 0.75); w.rotation.y = -a;
    b.position.y = 0.62 + abs(sin(t * 6 + i)) * 0.12; b.rotation.x = sin(t * 6 + i) * 0.1;
  }));
};
// lazy: hands in pockets, leaning back, head lolling, now and then a yawn
POSES.slouch = (R, t, P, br) => {
  R.armL.rotation.set(0.32, 0, -0.16); R.armR.rotation.set(0.32, 0, 0.16);
  R.torso.rotation.x = -0.1; R.hips.rotation.z += 0.06;
  const c = (t % 10) / 10, y = K.smooth(0.3, 0.38, c) - K.smooth(0.5, 0.58, c);
  R.head.rotation.x += 0.12 - y * 0.45; R.head.rotation.z += 0.14;
};
// twin pistols down and out at his sides, ready, his weight back
POSES.twinGuns = (R, t, P, br) => {
  const c = (t % 5) / 5, aim = K.smooth(0.4, 0.46, c) - K.smooth(0.7, 0.78, c);
  R.armL.rotation.set(-0.35 - aim * 1.05, 0.1, -0.55 + aim * 0.35);
  R.armR.rotation.set(-0.35 - aim * 1.05, -0.1, 0.55 - aim * 0.35);
  if (R.legL) { R.legL.rotation.x = 0.22; R.legR.rotation.x = -0.18; }
  R.head.rotation.x += 0.06 - aim * 0.1;
};
// she tugs at his sleeve, rocking on her heels
POSES.tug = (R, t, P, br) => {
  R.armR.rotation.set(-1.0 + sin(t * 3) * 0.12, 0, 0.75);
  R.armL.rotation.set(-0.2, 0, -0.3);
  R.root.position.y = abs(sin(t * 3)) * 0.06;
  R.head.rotation.y += 0.45; R.head.rotation.z -= 0.1;
};
const LILY = { skin: 0xfbe6dc, hairC: 0xd8d0f0, hairC2: 0xc0b4e6, hair: "bob", fringe: "straight", top: WHITE, sleeve: WHITE, pants: WHITE, boot: BLACK, glove: WHITE, belt: BLACK,
  face: { eye: 0xff6a8a, brow: 0.2, mouth: "grin", blush: true } };
U("vespro", "Vespro, the Lonely Hour", "absolute", 1.1e10, {
  gate: "chrono",
  look: { skin: 0xf0dcc8, hairC: 0x6a5240, hairC2: 0x584232, hair: "long", fringe: "side", top: WHITE, sleeve: WHITE, pants: WHITE, boot: BLACK, glove: 0x26262c, belt: BLACK,
    face: { style: "bored", eye: 0x8ab8ff, brow: 0.12, mouth: "flat" } },
  acc: [["furCoat", {}], ["jawCollar", {}], ["hole", { y: 0.6, r: 0.18, gear: 0x8ad8ff }], ["goatee", {}],
    ["companion", { look: LILY, acc: [["hornMask", { side: 1 }], ["hole", { y: 0.45, r: 0.14 }]], pose: { pose: "tug" } }]],
  pose: { pose: "slouch" }, scale: 1.06,
  fx: [{ k: "dust", rate: 4 }, { k: "glyphs", set: ["IV", "·", "IV"], c: 0x8ad8ff, rate: 0.8, size: 11 }],
  rim: [0x8ad8ff, 0xffffff],
});

// ======================= Shigure, the Captain Who Plays (Origin) =======================
// a wide straw hat, its weave and band, and two paper pinwheels stuck in it that turn in any breeze
A.strawHat = (R, L, o) => {
  const H = R.head, g = pivot(H, 0, 1.18, 0); g.rotation.set(o.tip == null ? 0.12 : o.tip, 0, o.tilt == null ? -0.1 : o.tilt);
  const c = o.c || 0xd8b870, c2 = o.c2 || 0xb8954a;
  mesh(g, cone(1.45, 0.7, 24), c, 0, 0.3, 0, { inkScale: 1.04 });
  mesh(g, cyl(1.46, 1.46, 0.04, 24), c2, 0, -0.04, 0, { ink: false });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; box(g, 0.025, 0.02, 1.3, c2, cos(a) * 0.68, 0.33, sin(a) * 0.68, { ry: -a + PI / 2, rz: 0.43 * (cos(a) > 0 ? 1 : 1), ink: false, rx: 0 }).rotation.set(0.43 * sin(a), -a + PI / 2, 0); }
  mesh(g, cyl(0.66, 0.7, 0.14, 20), o.band || 0x2a1a18, 0, 0.12, 0, { ink: false });
  const wheels = [];
  for (const [x, z, s] of [[0.62, 0.1, 1], [0.48, -0.42, -1]]) {
    const st = pivot(g, x, 0.36, z); st.rotation.z = -0.5;
    box(st, 0.03, 0.4, 0.03, 0x6a4a2a, 0, 0.2, 0, { ink: false });
    const w = pivot(st, 0, 0.42, 0.04);
    for (let k = 0; k < 4; k++) { const p = pivot(w); p.rotation.z = k * PI / 2; box(p, 0.18, 0.12, 0.02, k % 2 ? 0xffffff : 0xe8304a, 0.09, 0.05, 0, { ink: 0.01, rz: 0.4 }); }
    wheels.push([w, s]);
  }
  R.anim.push(t => wheels.forEach(([w, s]) => { w.rotation.z = t * 2.2 * s; }));
};
// the flowered kimono he wears over his captain's coat, thrown over his shoulders, pink with pale flowers
A.flowerDrape = (R, L, o) => {
  const c = o.c || 0xf07aa8, fl = o.flower || 0xfff2f6, fc = 0xffd76a;
  const flower = (p, x, y, z, s = 1, ry = 0) => { const f = pivot(p, x, y, z); f.rotation.y = ry; for (let k = 0; k < 5; k++) { const a = (k / 5) * PI * 2; box(f, 0.06 * s, 0.06 * s, 0.02, fl, cos(a) * 0.05 * s, sin(a) * 0.05 * s, 0, { ink: false }); } box(f, 0.035 * s, 0.035 * s, 0.025, fc, 0, 0, 0.005, { ink: false }); };
  for (const s of [-1, 1]) {
    box(R.torso, 0.46, 0.26, 0.76, c, s * 0.48, 1.02, -0.02, { rz: s * -0.28 });
    flower(R.torso, s * 0.5, 1.12, 0.39, 1.2);
  }
  chain(R, R.torso, 0, 1.0, -0.38, 4, 0.42, (sg, i) => {
    const w = 1.4 + i * 0.12;
    box(sg, w, 0.44, 0.06, c, 0, -0.2, 0);
    for (let k = 0; k < 3; k++) flower(sg, -w / 2 + 0.25 + ((k * 0.37 + i * 0.23) % 1) * (w - 0.5), -0.1 - ((k * 0.29 + i * 0.41) % 1) * 0.25, -0.04, 1.2, PI);
    if (i === 3) box(sg, w, 0.06, 0.07, 0xc84a7a, 0, -0.42, 0, { ink: false });
  }, { b0: 0.12, b: 0.05, amp: 0.06, sp: 1.2, zamp: 0.05 });
  for (const arm of [R.armL, R.armR]) { box(arm, 0.66, 0.5, 0.68, c, 0, -0.18, 0); flower(arm, 0, -0.14, 0.35, 1.3); }
};
// two swords at his left hip, sheathed together, pink cords on the hilts
A.twinSheaths = (R, L, o) => {
  for (const [dz, len, y] of [[0.0, 1.55, 0.0], [0.16, 1.2, 0.05]]) {
    const s = pivot(R.hips, -0.6, 0.15 + y, 0.12 + dz); s.rotation.set(0.62, 0, 0.18);
    box(s, 0.12, len, 0.1, o.c || BLACK, 0, -len / 2 + 0.1, 0);
    box(s, 0.15, 0.06, 0.13, GOLD, 0, 0.12, 0, { ink: 0.01 });
    box(s, 0.1, 0.42, 0.1, 0xf2f2ee, 0, 0.36, 0);
    for (let k = 0; k < 4; k++) box(s, 0.11, 0.035, 0.11, o.cord || 0xe8306a, 0, 0.2 + k * 0.1, 0, { rz: k % 2 ? 0.4 : -0.4, ink: false });
    box(s, 0.13, 0.06, 0.13, GOLD, 0, 0.58, 0, { ink: 0.01 });
  }
};
// a shallow red lacquer sake dish
A.sakeDish = (R, L, o) => {
  const s = held(R, { hand: "R", fwd: 0.04 }, [0, 0, 0]);
  mesh(s, cyl(0.2, 0.12, 0.07, 16), 0xb81a2a, 0, 0.06, 0.08, { inkScale: 1.1 });
  mesh(s, cyl(0.16, 0.16, 0.02, 16), 0xf2e8d0, 0, 0.1, 0.08, { ink: false, glow: 1 });
};
A.stubble = (R, L, o) => { const H = R.head, c = o.c || L.hairC; box(H, 0.5, 0.08, 0.04, c, 0.02, 0.33, 0.555, { ink: false }); box(H, 0.16, 0.14, 0.05, c, 0.02, 0.12, 0.555, { ink: 0.01 }); };
// a flower pin in the tie of his hair
A.hairPin = (R, L, o) => { const H = R.head; box(H, 0.06, 0.4, 0.06, 0x6a4a2a, -0.22, 0.95, -0.6, { rz: 0.6, ink: false }); for (let k = 0; k < 5; k++) { const a = (k / 5) * PI * 2; box(H, 0.1, 0.1, 0.04, 0xf07aa8, -0.36 + cos(a) * 0.08, 1.1 + sin(a) * 0.08, -0.62, { ink: 0.01 }); } };
// released: both swords out; the long one is broad and curved, the short one hooked
A.twinBlades = (R, L, o) => {
  for (const hd of ["R", "L"]) {
    const s = K.hand(R, { hand: hd, rot: hd === "R" ? [0.3, 0, -0.5] : [0.2, 0, 0.6] }), big = hd === "R", len = big ? 2.2 : 1.5, w = big ? 0.42 : 0.26;
    box(s, 0.12, 0.42, 0.12, 0xf2f2ee, 0, 0, 0);
    for (let k = 0; k < 3; k++) box(s, 0.13, 0.035, 0.13, 0xe8306a, 0, -0.12 + k * 0.1, 0, { rz: 0.4, ink: false });
    mesh(s, cyl(0.2, 0.2, 0.05, 12), GOLD, 0, 0.24, 0, { inkScale: 1.1 });
    const bl = pivot(s, 0, 0.27, 0);
    for (let k = 0; k < 5; k++) {
      const seg = len / 5, y = seg * (k + 0.5), curve = (k / 4) ** 2 * (big ? 0.38 : 0.3);
      box(bl, w * (1 - k * 0.08), seg + 0.02, 0.06, 0x3a3a44, curve, y, 0, { rz: -k * 0.09 });
      box(bl, 0.05, seg + 0.02, 0.07, o.edge || 0xff7ab0, curve + w * (1 - k * 0.08) / 2, y, 0, { rz: -k * 0.09, glow: 1, ink: false });
    }
    if (!big) mesh(bl, cone(0.12, 0.3, 4), 0x3a3a44, 0.34, len - 0.05, 0, { rz: -1.2 });
    marker(R, "blade" + hd, bl, 0, len, 0);
  }
};
// released: the stage of his last act behind him, red curtains drawn back from it, gold tassels, paper lanterns lit
A.stage = (R, L, o) => {
  const g = pivot(R.root, 0, 0, -1.6), W = 4.6, H = 4.8, red = o.c || 0xb0182e, red2 = 0x8a1024;
  box(g, W + 0.6, 0.6, 0.3, 0x14141a, 0, H, 0);
  for (let k = 0; k < 9; k++) box(g, 0.48, 0.42, 0.06, k % 2 ? red : red2, -W / 2 + 0.2 + k * (W - 0.4) / 8, H - 0.48, 0.12, { ink: 0.01 });
  for (const s of [-1, 1]) {
    chain(R, g, s * (W / 2 - 0.35), H - 0.3, 0.05, 6, 0.72, (sg, i) => {
      box(sg, 0.9 - i * 0.04 + (i > 3 ? 0.18 : 0), 0.74, 0.12, i % 2 ? red : red2, s * (i > 2 ? 0.12 * (i - 2) : 0), -0.36, 0);
      if (i === 3) { box(sg, 1.0, 0.1, 0.18, GOLD, s * 0.1, -0.1, 0.02, { ink: 0.01 }); mesh(sg, cone(0.12, 0.4, 6), GOLD, s * 0.5, -0.3, 0.06, { rx: PI }); }
    }, { b0: 0.0, b: 0.02, amp: 0.03, sp: 0.9, zamp: 0.02, rz0: s * -0.08 });
    for (let k = 0; k < 2; k++) {
      const ln = pivot(g, s * (0.8 + k * 0.9), H - 0.9 - k * 0.3, 0.6);
      box(ln, 0.02, 0.4, 0.02, 0x2a2a30, 0, 0.2, 0, { ink: false });
      mesh(ln, cyl(0.24, 0.24, 0.5, 10), 0xfff0d8, 0, -0.2, 0, { glow: 1, inkScale: 1.08 });
      for (const y of [0.05, -0.45]) mesh(ln, cyl(0.25, 0.25, 0.05, 10), 0x2a1a18, 0, y, 0, { ink: false });
      box(ln, 0.06, 0.14, 0.02, red, 0, -0.2, 0.25, { ink: false });
      R.anim.push(t => { ln.rotation.z = sin(t * 1.3 + k + s) * 0.08; });
    }
  }
  box(g, W + 0.4, 0.14, 2.2, 0x3a2418, 0, 0.07, 0.7, { ink: 0.02 });
  for (let k = 0; k < 6; k++) box(g, 0.04, 0.02, 2.2, 0x2a1a10, -W / 2 + 0.3 + k * 0.8, 0.15, 0.7, { ink: false });
  marker(R, "stage", g, 0, H * 0.6, 0);
};
// at his ease: the dish to his lips now and then, the other hand on the hilts at his hip
POSES.sake = (R, t, P, br) => {
  const c = (t % 7) / 7, sip = K.smooth(0.45, 0.55, c) - K.smooth(0.7, 0.8, c);
  R.armR.rotation.set(-0.85 - sip * 0.85, -0.2 - sip * 0.3, 0.12 + sip * 0.25);
  R.armL.rotation.set(-0.42, 0.25, -0.08);
  R.head.rotation.x += -0.04 - sip * 0.18; R.head.rotation.z += 0.08;
  R.hips.rotation.z += 0.04;
};
// the last act: both blades out low and wide, his weight forward, head down under the hat
POSES.lastAct = (R, t, P, br) => {
  R.armR.rotation.set(-0.55 + br * 0.03, 0, 0.95);
  R.armL.rotation.set(-0.45 - br * 0.03, 0, -0.85);
  R.torso.rotation.x = 0.16;
  if (R.legL) { R.legL.rotation.set(0.42, 0, -0.18); R.legR.rotation.set(-0.3, 0, 0.18); }
  R.head.rotation.x += 0.18;
};
U("shigure", "Shigure, the Captain Who Plays", "absolute", 1.5e10, {
  gate: "origin",
  look: { skin: 0xf2d6c0, hairC: 0x2a1e18, hairC2: 0x3a2a20, hair: "pony", hairTie: 0xe8306a, fringe: "side", top: BLACK, sleeve: BLACK, robe: BLACK, robeTrim: BLACK, robeIn: 0x0a0a0e,
    glove: 0xf2d6c0, face: { style: "bored", eye: 0x8a5a3a, brow: 0.08, mouth: "smile" } },
  acc: [["kimono", { sash: 0xf2f2ee }], ["haori", { c: WHITE, lining: 0xf07aa8 }], ["flowerDrape", {}], ["twinSheaths", {}], ["strawHat", {}], ["stubble", {}], ["hairPin", {}], ["sakeDish", {}]],
  pose: { pose: "sake" }, scale: 1.04,
  fx: [{ k: "fall", kind: "petal", c: 0xff8ab8, rate: 7 }],
  rim: [0xff8ab8, 0xffffff],
});

// every unit gets its place in the list (the collection's order) and its key
AF.UNITS.forEach((d, i) => { d.idx = i; AF.UNIT[d.key] = d; });

// ======================= the released forms =======================
const REL = AF.REL;
function release(key, d) {
  const b = AF.UNIT[key], look = Object.assign({}, b.look, d.look || {});
  look.face = Object.assign({}, b.look.face, (d.look || {}).face || {});
  const acc = d.acc || b.acc.filter(([n]) => !(d.drop || []).includes(n)).concat(d.add || []);
  const def = Object.assign({}, b, { look, acc, pose: d.pose || b.pose, fx: d.fx || b.fx, scale: d.scale || b.scale, rim: d.rim || b.rim, zoom: d.zoom || b.zoom, key: key + "@rel", rel: true });
  REL[key] = def; AF.UNIT[def.key] = def;
}
release("hallvard", { look: { face: { style: "glow", eye: PALE, brow: -0.1 } }, drop: ["balanceScale", "hipSword"],
  add: [["lightBlade", { rot: [0.1, 0, 0] }], ["kiteShield", { rot: [0.3, 0.2, 0] }], ["heavenScale", {}]], pose: { pose: "verdict" },
  fx: [{ k: "pressure", cols: [PALE, CY], w: 56 }, { k: "glow", at: "heaven", c: PALE, r: 120 }, { k: "motes", c: PALE, rate: 14 }, { k: "fall", kind: "snow", rate: 12 }] });
release("sovn", { look: { face: { style: "glow", eye: 0xffe9a8, eh: 0.3, brow: 0.3, mouth: "open", blush: true } }, drop: ["dreamBeast", "toySword"],
  add: [["dreamBeast", { awake: true, z: -1.45 }], ["toySword", { rot: [0.3, 0, 0.2], size: 1.25 }], ["dreamMeteor", {}]], pose: { pose: "conjure", float: true },
  fx: [{ k: "pressure", cols: [G, CY, VI], w: 60 }, { k: "stars", rate: 8 }, { k: "glow", at: "meteor", c: G, r: 120 }, { k: "bubbles", rate: 6 }] });
release("vespro", { look: { face: { style: "glow", eye: 0x8ad8ff, brow: -0.2, mouth: "flat" } }, drop: ["companion", "furCoat"],
  add: [["furCoat", { n: 4, c: 0x6a6870 }], ["clockPistol", { hand: "R", rot: [0.25, 0, 0] }], ["clockPistol", { hand: "L", rot: [0.25, 0, 0] }], ["wolfPack", {}]], pose: { pose: "twinGuns" },
  fx: [{ k: "pressure", c: 0x8ad8ff, w: 52 }, { k: "dust", rate: 8 }, { k: "shock", c: 0x8ad8ff, every: 2.4, r: 180 }] });
release("shigure", { look: { face: { style: "glow", eye: 0xff5a8a, brow: -0.25, mouth: "flat" } }, drop: ["sakeDish", "twinSheaths", "strawHat"],
  add: [["strawHat", { tip: -0.42, tilt: 0.05 }], ["twinBlades", {}], ["stage", {}]], pose: { pose: "lastAct" },
  fx: [{ k: "fall", kind: "petal", c: 0xff5a8a, rate: 16 }, { k: "pressure", c: 0xff5a8a, w: 50 }, { k: "glow", at: "stage", c: 0xffd76a, r: 140 }] });

// who they are and what they do (the summon reveal shows the command, the unit window and Defense the rest)
Object.assign(AF.GATE_NOTES, {
  hallvard: { arche: "the king's calm right hand who keeps the balance (Haschwalth, Bleach)",
    who: "The Father's right hand, and the only knight he ever trusted with his voice. Hallvard keeps his eyes shut because he has no need to look: he already knows how everything weighs. Good fortune and bad are never made or lost, only moved, and he decides where.",
    cmd: "Let the scales tip.", quote: "Fortune is never lost. Only moved.",
    atk: "Balance (passive): every 2 s the healthiest enemy in reach loses a quarter of the gap between it and the weakest, so the biggest are dragged down to the rest.",
    rel: "The Scales Tip: for 6 s every hit on an enemy in his reach also lands, at half, on every other enemy in his reach." },
  sovn: { arche: "the child whose imagination becomes real (Gremmy, Bleach)",
    who: "The youngest knight the Order ever had, and the most dangerous. Whatever he imagines is real for as long as he believes it, so the Order keeps him asleep. His only friend is the bear he imagined to keep him company. It has never once left his side.",
    cmd: "Make it real.", quote: "I imagined you smaller.",
    atk: "Imagine: every wave he dreams a new power for his stars: fire that burns, frost that slows, or stars that split to two more enemies.",
    rel: "Wake Up: he imagines a meteor onto the busiest stretch of road (one huge hit), then imagines the enemies aren't there: everything on the board freezes for 2 s." },
  vespro: { arche: "the lonely strongest who is two halves of one soul (Starrk and Lilynette, Bleach)",
    who: "The first hour that fell out of the stopped clock, and the strongest. He was so strong that everyone near him wound down and stopped, so he split himself in two to have company. She does most of the talking. He would rather be asleep.",
    cmd: "Wake up, Vespro.", quote: "Leave me alone. Please. It's for your sake.",
    atk: "Lonely: +40% damage for each of the four spaces around him left empty. She fires a small shot of her own with every one of his.",
    rel: "The Pack: the two of them merge into his pistols, and a pack of wolves made of clock hands runs down the road, bursting on everything it reaches, for 4 s." },
  shigure: { arche: "the laid-back captain whose sword makes children's games real (Kyoraku, Bleach)",
    who: "The Court's oldest captain and its laziest, or so he'd like you to think. Straw hat, a flowered kimono over his coat, a cup of something always in his hand. His swords turn the fight into a game, and whoever breaks the rules loses more than the game.",
    cmd: "Come out and play, Onigokko.", quote: "Let's not be serious. Serious is so tiring.",
    atk: "Games: each wave he calls one. Shadows: enemies in his reach take +40% from everyone. Red Light: everything in his reach freezes for a moment every 3 s. Tag: the first enemy he hits takes double from everyone, and the tag passes on when it falls.",
    rel: "The Last Act: a play in four acts over the whole board. Three acts of wounds, each hitting every enemy and slowing them, then the final cut through every enemy left." },
});
// "Find every unit" and each gate's own quest count these too
if (AF.QUEST && AF.QUEST.f48) AF.QUEST.f48.goal = AF.UNITS.length;
for (const f of AF.FACTIONS || []) if (AF.QUEST && AF.QUEST[f.id + "All"]) AF.QUEST[f.id + "All"].goal = AF.UNITS.filter(d => d.gate === f.id).length;
})();
